// Terrain kit, part 1: the lit surface materials (terrain + rock).
// Both are MeshStandardMaterial with shader injections, so scene lights, shadows and fog all work.
import * as THREE from 'three';
import { makeDetailTexture, makeStrata, cellOf, rngOf } from './textures.js';

const col = (c) => (c && c.isColor ? c.clone() : new THREE.Color(c));

// ---------- shader pieces ----------
const VERT_PARS = /* glsl */`
varying vec3 vTWorld; varying vec3 vTNormal; varying vec3 vTShade;
#ifdef T_SHADE
attribute vec2 aShade;
#endif
#ifdef T_ROCK
uniform vec4 uTGround;      // contact height (x scale), contact darkening, ao relax height, sink bias
#endif
#ifdef T_SHADEMAP
uniform sampler2D tShade; uniform vec4 uTShadeBox;
#endif
`;
const VERT_MAIN = /* glsl */`
{ vec4 tw = vec4(transformed, 1.); vec3 tn = objectNormal; mat4 tm = modelMatrix;
  #ifdef USE_INSTANCING
    tm = modelMatrix * instanceMatrix;
  #endif
  vTWorld = (tm * tw).xyz; vTNormal = mat3(tm) * tn; vTShade = vec3(1.);
  #ifdef T_SHADE
    vTShade.xy = aShade;
  #endif
  #ifdef T_ROCK
    float tsc = length(tm[1].xyz);
    vTShade.z = mix(1. - uTGround.y, 1., smoothstep(0., uTGround.x * tsc, vTWorld.y - tm[3].y + uTGround.w * tsc));
  #endif
  #ifdef T_SHADEMAP
    vec4 sm = texture2D(tShade, (vTWorld.xz - uTShadeBox.xy) * uTShadeBox.zw);
    vTShade.x = max(sm.r, smoothstep(sm.b - 1., sm.b + 7., vTWorld.y));          // sm.b: height above which the sun is visible here
    vTShade.y = mix(sm.g, 1., smoothstep(0., uTGround.z, vTWorld.y - sm.a));     // sm.a: ground height
  #endif
}`;

const FRAG_PARS = /* glsl */`
uniform sampler2D tDetail, tCell, tStrata;
uniform vec4 uTScale;    // tiles per metre: macro, mid, fine, side
uniform vec3 uTRock, uTRockB, uTSnow, uTPatch, uTGlowColor, uTWetTint, uTTop;
uniform vec4 uTSlope;    // rock lo, rock hi, snow lo, snow hi  (thresholds on normal.y)
uniform vec4 uTSnowP;    // line (m), blend (m), noise amplitude (m), amount
uniform vec4 uTStrata;   // amount, 1 / span (1/m), warp (m), varnish
uniform vec4 uTWet;      // level (m), range (m), amount, roughness
uniform vec4 uTDetail;   // albedo strength, bump strength, patch amount, streak strength
uniform vec4 uTGlow;     // level (m), range (m), intensity, strata base (m)
uniform vec4 uTTopP;     // lo, hi, amount, crack darkening   (rock material)
uniform vec4 uTNear;     // near-field layers: pebbles, cracks, ripples, tufts
uniform vec4 uTWind;     // xy = wind direction (xz), z = 2 pi / ripple wavelength, w = sparkle
uniform vec4 uTFx;       // lee-side darkening, drifting sand / spindrift, relief of the beds, time
uniform vec4 uTCloud;    // xy = offset, z = 1 / size (1/m), w = amount
uniform vec3 uTBounce;    // irradiance bounced off sunlit ground into the shade (fills canyons with warm light)
varying vec3 vTWorld; varying vec3 vTNormal; varying vec3 vTShade;
float gTSnow = 0., gTWet = 0., gTSpark = 0.; vec3 gTGrad = vec3(0.), gTEmit = vec3(0.);
`;

const FRAG_NORMAL = /* glsl */`
  normal = normalize(normal - uTDetail.y * (1. + 2. * smoothstep(60., 5., length(vViewPosition))) * (viewMatrix * vec4(gTGrad, 0.)).xyz);
`;
const FRAG_ROUGH = /* glsl */`
  roughnessFactor = mix(roughnessFactor, uTWet.w, gTWet);
  roughnessFactor = mix(roughnessFactor, .72, gTSnow);
  roughnessFactor = mix(roughnessFactor, .32, gTSpark);
`;
const FRAG_SHADE = /* glsl */`
  { float tsun = vTShade.x * vTShade.z, tamb = vTShade.y * (.35 + .65 * vTShade.z);
    #ifdef T_CLOUD
      float tcl = texture2D(tDetail, vTWorld.xz * uTCloud.z + uTCloud.xy).r;
      tsun *= 1. - uTCloud.w * smoothstep(.46, .66, tcl);
    #endif
    reflectedLight.directDiffuse *= tsun; reflectedLight.directSpecular *= tsun;
    // sunlight bounced off the lit ground into the shade: scales with the scene's first directional light (none: no bounce)
    #if NUM_DIR_LIGHTS > 0
      reflectedLight.indirectDiffuse += diffuseColor.rgb * uTBounce * directionalLights[0].color * (.4 * RECIPROCAL_PI * (1. - .75 * tsun));
    #endif
    reflectedLight.indirectDiffuse *= tamb; reflectedLight.indirectSpecular *= tamb; }
`;

const FRAG_TERRAIN = /* glsl */`
{ vec3 wp = vTWorld; vec3 wnS = normalize(vTNormal);
  float vd = length(vViewPosition), nearK = smoothstep(95., 9., vd), midK = smoothstep(280., 30., vd);
  float steep = smoothstep(.8, .5, wnS.y), flatK = 1. - steep;
  // top projection: macro, mid and fine layers at unrelated scales (the macro layer bends the others, hiding the tiling)
  vec4 tM = texture2D(tDetail, wp.xz * uTScale.x);
  vec2 bend = vec2(tM.r, 1. - tM.r) * .6;
  vec4 tD = texture2D(tDetail, wp.xz * uTScale.y + bend * .3);
  // fine layer: top projection on flat ground, a side projection on steep ground (no vertical smearing). The choice is
  // dithered by the mid layer, so one lookup serves both without a visible seam. The mid layer smears into streaks on cliffs.
  const vec2 hA = vec2(.8, .6);
  vec2 uvF = wp.zx * uTScale.z + bend, uvT = vec2(dot(wp.xz, hA), wp.y) * uTScale.z * .41 + bend;
  bool side = steep > .2 + .6 * tD.r;
  vec2 fGx = side ? dFdx(uvT) : dFdx(uvF), fGy = side ? dFdy(uvT) : dFdy(uvF);
  vec4 tF = textureGrad(tDetail, side ? uvT : uvF, fGx * .66, fGy * .66);
  // a layer is dropped before its tile gets small enough on screen to read as a lattice of repeats (40 px), full from 160 px
  float fineK = smoothstep(.025, .00625, sqrt(length(fGx) * length(fGy)));
  float midF = smoothstep(.03, .008, sqrt(length(dFdx(wp.xz)) * length(dFdy(wp.xz))) * uTScale.y);
  tF = mix(vec4(.5, .5, .5, 0.), tF, fineK);
  // rock where it is steep, with an organic edge
  float sl = wnS.y + (tD.r - .5) * .3 + (tM.r - .5) * .12 + (tF.r - .5) * .1;
  float rock = 1. - smoothstep(uTSlope.x, uTSlope.y, sl);
  // beds from the strata table; their relief comes from the screen-space gradient of the hardness (no second lookup)
  float sy = wp.y + (tM.r - .5) * uTStrata.z + (tD.r - .5) * uTStrata.z * .15;
  vec4 st = texture2D(tStrata, vec2((sy - uTGlow.w) * uTStrata.y, .5));
  vec2 dA = vec2(dFdx(st.a), dFdy(st.a)), dY = vec2(dFdx(sy), dFdy(sy));
  float bed = clamp(dot(dA, dY) / max(dot(dY, dY), 1e-6) * .5, -1., 1.) * uTFx.z * uTStrata.x * rock * steep * smoothstep(.45, .1, length(dY));   // only while a bed spans several pixels (else it dots)
  float dR = mix(.5, tD.r, midF), fR = tF.r, fA = tF.a;
  // ----- ground
  vec3 c = diffuseColor.rgb;
  float macro = smoothstep(.36, .66, tM.r);
  c = mix(c, c * uTPatch, macro * uTDetail.z);
  c = mix(c, c * mix(vec3(1.), uTPatch, .7), smoothstep(.5, .72, tD.r) * uTDetail.z * flatK);
  vec2 wd = uTWind.xy;
  c *= 1. - uTFx.x * smoothstep(.06, .45, dot(wnS.xz, wd)) * vec3(.9, 1., 1.12) * .5;      // slip faces: darker and cooler
  vec3 gNear = vec3(0.);
  #ifdef T_NEAR
  { float gk = flatK * (1. - rock);
    vec2 uv1 = wp.xz * uTScale.z * .83 + bend.yx, uv2 = vec2(.8 * wp.x + .6 * wp.z, -.6 * wp.x + .8 * wp.z) * uTScale.z * .19 + bend * .5;
    vec2 d1x = dFdx(uv1) * .62, d1y = dFdy(uv1) * .62, d2x = dFdx(uv2) * .75, d2y = dFdy(uv2) * .75;
    float rp = dot(wp.xz, wd) * uTWind.z + tD.r * 7. + tM.r * 11. + (tF.r - .5) * 1.3;
    vec2 wd2 = vec2(wd.x * .94 - wd.y * .34, wd.x * .34 + wd.y * .94);
    float rp2 = dot(wp.xz, wd2) * uTWind.z * .21 + tM.r * 9. + tD.r * 3.;
    float rw = fwidth(rp), rw2 = fwidth(rp2);
    #ifdef T_TUFT
    vec2 uv3 = vec2(wp.x + wp.z * .35, wp.z - wp.x * .2) * uTScale.z * vec2(.85, .4) + bend, d3x = dFdx(uv3) * .7, d3y = dFdy(uv3) * .7;
    #endif
    if (gk * midK > .004) {
      vec4 c1 = textureGrad(tCell, uv1, d1x, d1y), c2 = textureGrad(tCell, uv2, d2x, d2y);
      float dens = smoothstep(.3, .72, tD.r * .6 + tM.r * .4);                       // stones gather in patches
      float p1 = smoothstep(.1, .3, c1.r) * nearK * (.3 + .7 * dens), p2 = smoothstep(.34, .5, c2.r) * midK * dens;
      float peb = max(p1, p2) * uTNear.x * gk;
      vec3 stone = mix(c, uTRock, .65) * (.72 + .55 * max(c1.r * p1, c2.r * p2) + .3 * (tF.r - .5));
      float ck = max((1. - smoothstep(.0, .1, c1.a)) * nearK, (1. - smoothstep(.0, .06, c2.a)) * midK) * uTNear.y * gk * (1. - peb) * (.35 + .65 * (1. - dens));
      c *= 1. + uTNear.y * gk * .16 * (c2.a - .55) * midK;                           // plates: lighter in the middle
      c *= 1. - .6 * ck;
      c = mix(c, stone, peb);
      vec2 g1 = (c1.gb - .5) * p1, g2 = (c2.gb - .5) * p2;
      gNear = vec3(g1.x + .8 * g2.x - .6 * g2.y, 0., g1.y + .6 * g2.x + .8 * g2.y) * (2.2 * uTNear.x * gk);
      // wind ripples: fine ones under the camera, mega-ripples for the middle distance
      float ra = uTNear.z * gk * (1. - peb) * smoothstep(1.7, .5, rw), ra2 = uTNear.z * gk * smoothstep(1.1, .3, rw2);
      c *= 1. + ra * .07 * sin(rp + .9) + ra2 * .035 * sin(rp2 + .9);
      gNear += vec3(wd.x, 0., wd.y) * (cos(rp) + .45 * cos(2. * rp + 1.)) * ra * .34 + vec3(wd2.x, 0., wd2.y) * cos(rp2) * ra2 * .13;
      gTSpark = uTWind.w * gk * nearK * smoothstep(.72, .98, c1.r * (.6 + .8 * tF.r));
      #ifdef T_TUFT
      { // tufts: elongated clumps (grass, moss, lichen), darker between, lighter tips
        vec4 tu = textureGrad(tCell, uv3, d3x, d3y);
        float tk = uTNear.w * gk * (1. - peb) * nearK, tf = smoothstep(.15, .7, tu.r) * (.6 + .8 * tF.r);
        c *= 1. + tk * (tf * .55 - .26);
        c = mix(c, c * uTPatch * 1.25, tk * smoothstep(.75, 1., tu.r * (.6 + .8 * tD.r)) * .5);
        gNear += vec3(tu.g - .5, 0., (tu.b - .5) * .4) * tk * 1.6; }
      #endif
    }
  }
  #endif
  #ifdef T_DRIFT
  { vec2 dq = vec2(dot(wp.xz, wd), dot(wp.xz, vec2(-wd.y, wd.x)));
    float dr = texture2D(tDetail, dq * vec2(1. / 110., 1. / 13.) - vec2(uTFx.w * .16, tM.r * .2)).r;
    float drift = smoothstep(.5, .78, dr) * smoothstep(.3, .62, tM.r + .25 * sin(uTFx.w * .21 + dq.x * .011)) * uTFx.y * flatK * (1. - rock);
    c = mix(c, c * 1.22 + uTPatch * .05, drift); }
  #endif
  // ----- rock: beds from the strata table, soft beds dusty, hard beds clean; varnish streaks down the steep faces
  vec3 rc = mix(uTRock, st.rgb * st.rgb, uTStrata.x);
  rc = mix(mix(rc, c, .22 * uTStrata.x), rc, st.a);
  rc *= 1. - uTStrata.w * smoothstep(.42, .82, tD.r * .75 + tM.r * .25) * steep * (.35 + .65 * st.a);
  rc *= 1. + uTDetail.w * (tD.r - .5) * .6 * steep;
  #ifdef T_JOINT
  { // joints: a net of fractures cuts the cliffs into blocks (side projection on the dominant axis; read from 20 m to ~600 m)
    bool jx = abs(wnS.x) > abs(wnS.z);
    vec2 uvJ = vec2(jx ? wp.z : wp.x, wp.y * 1.6) * uTScale.w + bend * .7;
    vec2 jdx = vec2(jx ? dFdx(wp.z) : dFdx(wp.x), dFdx(wp.y) * 1.6) * uTScale.w, jdy = vec2(jx ? dFdy(wp.z) : dFdy(wp.x), dFdy(wp.y) * 1.6) * uTScale.w;
    float jK = smoothstep(.022, .006, sqrt(length(jdx) * length(jdy))) * rock * steep * uTTopP.x;
    if (jK > .01) {
      vec4 cj = textureGrad(tCell, uvJ, jdx, jdy);
      rc *= (1. - .5 * jK * (1. - smoothstep(.0, .11, cj.a)) * (.4 + 1.2 * tM.r)) * (1. + .3 * jK * (cj.a - .5));
    } }
  #endif
  c = mix(c, rc, rock);
  // fine breakup on everything
  float grain = (dR - .5) * .7 + (fR - .5) * .9 + (macro - .5) * .16;
  c *= 1. + uTDetail.x * grain * (1. + .6 * rock);
  c *= 1. - uTDetail.x * .3 * smoothstep(.55, .95, fA) * (.1 + .9 * rock) * (.4 + 1.2 * tM.r);
  // wet shoreline
  float wet = (1. - smoothstep(uTWet.x, uTWet.x + uTWet.y, wp.y + (tD.r - .5) * uTWet.y * .8)) * uTWet.z;
  c *= mix(vec3(1.), uTWetTint, wet);
  // snow above the line, where it is not too steep; bluer where the sun does not reach
  float sn = smoothstep(uTSnowP.x - uTSnowP.y, uTSnowP.x + uTSnowP.y, wp.y + (tM.r - .5) * uTSnowP.z + (tD.r - .5) * uTSnowP.z * .35);
  sn *= smoothstep(uTSlope.z, uTSlope.w, wnS.y + (tD.r - .5) * .2 + (tF.r - .5) * .08) * uTSnowP.w;
  c = mix(c, uTSnow * mix(vec3(.8, .89, 1.03), vec3(1.), vTShade.x) * (1. + (fR - .5) * .1 + (dR - .5) * .08), sn);
  diffuseColor.rgb = c;
  gTSnow = sn; gTWet = wet; gTSpark *= 1. - rock;
  vec3 gMid = vec3(tD.g - .5, 0., tD.b - .5) * (.6 * flatK * midF);
  vec3 gFine = side ? vec3(hA.x * (tF.g - .5), tF.b - .5, hA.y * (tF.g - .5)) * 1.2 : vec3(tF.b - .5, 0., tF.g - .5) * .9;
  gTGrad = (gMid + gFine + gNear * (1. - sn) + vec3(0., bed * 1.2, 0.)) * (1. + .8 * rock) * (1. - .7 * sn);   // hard beds stand proud
  #ifdef T_GLOW
  { // glowing seams between crust plates: wide and molten in the lowest, most enclosed ground, thinning uphill
    float gy = wp.y + (tM.r - .5) * uTGlow.y * 1.4 + (vTShade.y - .85) * uTGlow.y * 2.5;
    float heat = 1. - smoothstep(uTGlow.x - uTGlow.y * .5, uTGlow.x + uTGlow.y, gy);
    vec2 gw = wp.xz + (tM.gb - .5) * 50. + (tD.gb - .5) * 5.;
    vec4 g1 = texture2D(tCell, gw * (1. / 97.) + uTFx.w * vec2(.0009, .0006));
    vec4 g2 = texture2D(tCell, vec2(.8 * gw.x + .6 * gw.y, -.6 * gw.x + .8 * gw.y) * (1. / 19.) - uTFx.w * vec2(.0035, .001));
    float w1 = mix(.015, .3, heat * heat) * (.45 + 1.1 * tD.r);
    float e1 = 1. - smoothstep(0., w1, g1.a), e2 = 1. - smoothstep(0., w1 * .8 + .015, g2.a);
    float temp = max(e1, e2 * (.25 + .5 * e1 + .5 * heat * heat)) * smoothstep(0., .12, heat);
    temp = mix(temp, heat * heat * .3, clamp(fwidth(gw.x) * .03, 0., 1.));         // far away: the average glow of the field
    temp *= .78 + .22 * sin(uTFx.w * .8 + tM.r * 14. + tD.r * 6.);
    vec3 gc = uTGlowColor, cool = gc * gc * .45, hot = mix(gc, vec3(1., .9, .66), .6);
    vec3 ramp = mix(cool, gc, smoothstep(.12, .5, temp)); ramp = mix(ramp, hot, smoothstep(.68, 1., temp)) * (1. - .28 * temp * temp);   // the core stays under the bloom's white-out
    diffuseColor.rgb *= 1. - .45 * heat * (1. - temp);                              // cooled crust is darker than the country rock
    gTEmit = (ramp * temp * uTGlow.z + gc * (diffuseColor.rgb + .03) * heat * .16 * uTGlow.z) * (1. - sn);
  }
  #endif
}`;

const FRAG_ROCK = /* glsl */`
{ vec3 wp = vTWorld;
  #ifdef FLAT_SHADED
    vec3 wn = normalize(cross(dFdx(wp), dFdy(wp)));
  #else
    vec3 wn = normalize(vTNormal);
  #endif
  float nearK = smoothstep(120., 10., length(vViewPosition));
  vec3 aw = abs(wn); aw *= aw; aw *= aw; aw /= (aw.x + aw.y + aw.z);
  float s = uTScale.y;
  vec4 tx = texture2D(tDetail, wp.zy * s), ty = texture2D(tDetail, wp.xz * s), tz = texture2D(tDetail, wp.xy * s);
  vec4 t = tx * aw.x + ty * aw.y + tz * aw.z;
  vec4 tf = texture2D(tDetail, (wp.xz + wp.yy * vec2(.83, .57)) * uTScale.z, -.5);
  vec4 tm = texture2D(tDetail, (wp.xz + wp.yy * vec2(.6, .8)) * uTScale.x);
  vec4 tc = texture2D(tCell, (wp.xz + wp.yy * vec2(.57, .83)) * uTScale.z * .45, -.5);
  vec3 c = diffuseColor.rgb;
  #ifdef T_STRATA
  { float sy = wp.y + (tm.r - .5) * uTStrata.z + (t.r - .5) * uTStrata.z * .2;
    vec2 suv = vec2((sy - uTGlow.w) * uTStrata.y, .5);
    vec4 st = texture2D(tStrata, suv);
    float lv = clamp(dot(c, vec3(.3333)) / max(dot(uTRock, vec3(.3333)), .02), .6, 1.45);
    c = mix(c, st.rgb * st.rgb * lv, uTStrata.x);
    vec2 dA = vec2(dFdx(st.a), dFdy(st.a)), dY = vec2(dFdx(sy), dFdy(sy));
    gTGrad.y = clamp(dot(dA, dY) / max(dot(dY, dY), 1e-6) * .5, -1., 1.) * uTFx.z * uTStrata.x * (1. - aw.y) * smoothstep(.45, .1, length(dY));
    // desert varnish: dark vertical streaks on the steep faces (the top projection smears into streaks there)
    c *= 1. - uTStrata.w * smoothstep(.42, .8, ty.r + .5 * aw.y) * (1. - aw.y) * (.4 + .6 * st.a); }
  #endif
  c *= 1. + uTDetail.x * ((t.r - .5) * 1.2 + (tf.r - .5) * .7 + (tm.r - .5) * .5);
  c *= 1. - uTTopP.w * smoothstep(.5, .98, max(t.a, tm.a * .8)) * (.3 + 1.4 * tm.r);
  c *= 1. - uTTopP.w * 1.6 * (1. - smoothstep(0., .07, tc.a)) * nearK * (.3 + .7 * tm.r);       // crisp joints up close
  float top = smoothstep(uTTopP.x, uTTopP.y, wn.y + (t.r - .5) * .5 + (tf.r - .5) * .2) * uTTopP.z;
  c = mix(c, uTTop * (1. + (tf.r - .5) * .3 + (tc.r - .4) * .25 * nearK), top);
  float wet = (1. - smoothstep(uTWet.x, uTWet.x + uTWet.y, wp.y + (t.r - .5) * uTWet.y)) * uTWet.z;
  c *= mix(vec3(1.), uTWetTint, wet);
  diffuseColor.rgb = c; gTWet = wet; gTSnow = top * .5;
  gTGrad += aw.x * vec3(0., tx.b - .5, tx.g - .5) + aw.y * vec3(ty.g - .5, 0., ty.b - .5) + aw.z * vec3(tz.g - .5, tz.b - .5, 0.);
  gTGrad *= 1.6 * (1. - .6 * top) * (1. - .5 * smoothstep(45., 6., length(vViewPosition)));   // close up the shared near-field boost is too much for rock
}`;

function inject(material, uniforms, mode, defines, textures) {
  material.defines = { ...(material.defines || {}), ...defines };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_MAIN);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (mode === 'rock' ? FRAG_ROCK : FRAG_TERRAIN))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + FRAG_ROUGH)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + FRAG_NORMAL)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += gTEmit;')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + FRAG_SHADE);
  };
  material.customProgramCacheKey = () => 'kit-terrain2-' + mode;
  material.userData.uniforms = uniforms;
  // plain enumerable properties: the engine's disposer (and any scene walker) finds and frees these textures
  Object.assign(material, textures);
  material.userData.dispose = () => { for (const k in textures) if (textures[k]) textures[k].dispose(); material.dispose(); };
}

const windVec = (o) => { const a = o.wind ?? 0.5; return Array.isArray(a) ? a : [Math.cos(a), Math.sin(a)]; };
const cloudUniform = (o) => ({ value: new THREE.Vector4(0, 0, 1 / (o.cloudSize ?? 900), o.clouds ?? 0) });

// ---------- terrain material ----------
// opts (all optional):
//   rock, rockB (the two main bed colours), rockSlope [lo,hi] (normal.y where ground gives way to rock),
//   strata 0.6 (visibility of the beds), strataScale 7 (mean bed thickness, m), strataBeds 16, strataAccent, strataWarp 5 (m),
//   strataTable (a makeStrata() result: share it with terrace()/canyon() and the rock material), varnish 0.45, bedRelief 1.2,
//   joints 0.5 (a net of fractures that cuts cliffs into blocks, read from 20 m to ~600 m),
//   snow (colour or null), snowLine, snowBlend, snowNoise, snowSlope [lo,hi], patch (colour multiplier), patchAmount,
//   waterLevel, wetRange, wet, wetTint, wetRoughness, glow (colour or null), glowLevel, glowRange, glowIntensity 3,
//   pebbles, cracks, ripples, tufts (0..1 each: the crisp near-field layers), rippleLength 1.5 (m), sparkle 0,
//   wind 0.5 (radians, or [x,z]), lee 0 (darkening of slopes facing downwind), drift 0 (moving streaks of blown sand / snow),
//   clouds 0 (strength of drifting cloud shadows), cloudSize 900 (m), cloudSpeed 9 (m/s, along the wind),
//   bounce (colour of the light bounced into shaded ground; default: the mean rock colour), bounceAmount 1,
//   detail, bump, streaks, scale (multiplies every detail frequency), roughness, flat, detailTexture, rng
// Call material.userData.update(time) every frame when glow, drift or clouds are used (makeTerrain().update does).
export function makeTerrainMaterial(opts = {}) {
  const o = opts, k = o.scale ?? 1;
  const tex = o.detailTexture || makeDetailTexture({ rng: rngOf(o) });
  const strata = o.strataTable || makeStrata({ rng: rngOf(o), rock: o.rock ?? '#8e867c', rockB: o.rockB ?? o.rock ?? '#6f6860', accent: o.strataAccent, beds: o.strataBeds, thickness: o.strataScale ?? 7 });
  const sl = o.rockSlope || [0.62, 0.8], ss = o.snowSlope || [0.45, 0.72], wd = windVec(o), cs = o.cloudSpeed ?? 9;
  const uniforms = {
    tDetail: { value: tex }, tCell: { value: cellOf(tex) }, tStrata: { value: strata.texture },
    uTScale: { value: new THREE.Vector4(k / 173, k / 23, k / 3.7, k / 41) },
    uTRock: { value: col(o.rock ?? '#8e867c') }, uTRockB: { value: col(o.rockB ?? o.rock ?? '#6f6860') },
    uTSnow: { value: col(o.snow ?? '#d6dde9') }, uTPatch: { value: col(o.patch ?? '#cfc49a') },
    uTGlowColor: { value: col(o.glow ?? '#ff5a1c') }, uTWetTint: { value: col(o.wetTint ?? '#5b5f66') }, uTTop: { value: col('#ffffff') },
    uTSlope: { value: new THREE.Vector4(sl[0], sl[1], ss[0], ss[1]) },
    uTSnowP: { value: new THREE.Vector4(o.snowLine ?? 1e6, o.snowBlend ?? 14, o.snowNoise ?? 40, o.snow === null || o.snowLine == null ? 0 : (o.snowAmount ?? 1)) },
    uTStrata: { value: new THREE.Vector4(o.strata ?? 0.6, 1 / strata.span, o.strataWarp ?? 5, o.varnish ?? 0.45) },
    uTWet: { value: new THREE.Vector4(o.waterLevel ?? -1e6, o.wetRange ?? 1.6, o.waterLevel == null ? 0 : (o.wet ?? 0.6), o.wetRoughness ?? 0.3) },
    uTDetail: { value: new THREE.Vector4(o.detail ?? 0.6, o.bump ?? 0.8, o.patchAmount ?? 0.35, o.streaks ?? 0.6) },
    uTGlow: { value: new THREE.Vector4(o.glowLevel ?? 0, o.glowRange ?? 20, o.glow ? (o.glowIntensity ?? 3) : 0, strata.base) },
    uTTopP: { value: new THREE.Vector4(o.joints ?? 0.5, 1, 0, 0) },   // terrain: x = joints
    uTNear: { value: new THREE.Vector4(o.pebbles ?? 0.5, o.cracks ?? 0.2, o.ripples ?? 0, o.tufts ?? 0) },
    uTWind: { value: new THREE.Vector4(wd[0], wd[1], Math.PI * 2 / (o.rippleLength ?? 1.5), o.sparkle ?? 0) },
    uTFx: { value: new THREE.Vector4(o.lee ?? 0, o.drift ?? 0, o.bedRelief ?? 1.2, 0) },
    uTCloud: o.cloudUniform || cloudUniform(o),
    uTBounce: { value: (o.bounce != null ? col(o.bounce) : strata.meanColor.clone().lerp(col(o.patch ?? '#cfc49a'), 0.3)).multiplyScalar(o.bounceAmount ?? 1) },
  };
  const u = uniforms, defines = {};
  if (o.shade) defines.T_SHADE = '';   // geometry carries the baked aShade attribute (makeTerrain sets this)
  if (u.uTNear.value.lengthSq() > 0) defines.T_NEAR = '';
  if (u.uTNear.value.w > 0) defines.T_TUFT = '';
  if (u.uTTopP.value.x > 0) defines.T_JOINT = '';
  if (u.uTFx.value.y > 0) defines.T_DRIFT = '';
  if (u.uTGlow.value.z > 0) defines.T_GLOW = '';
  if (u.uTCloud.value.w > 0) defines.T_CLOUD = '';
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.roughness ?? 0.94, metalness: 0, flatShading: !!o.flat });
  inject(material, uniforms, 'terrain', defines, { detailMap: tex, cellMap: cellOf(tex), strataMap: strata.texture });
  material.userData.strata = strata;
  material.userData.update = (time) => { u.uTFx.value.w = time; u.uTCloud.value.x = -wd[0] * cs * time * u.uTCloud.value.z; u.uTCloud.value.y = -wd[1] * cs * time * u.uTCloud.value.z; };
  return material;
}

// ---------- rock material ----------
// Triplanar detail in world space, so it also works on InstancedMesh and on any rotation. Vertex colours are the albedo.
// opts: terrain (a makeTerrain() result: shares its detail texture, strata table, cloud shadows and baked sun/ao, so rocks
//   standing in a shadowed canyon are in shadow too), detail, bump, cracks, scale,
//   strata (0..1: how far the terrain's beds replace the vertex colour; default 0.55 with `terrain` or `strataTable`, else 0),
//   strataTable, varnish 0.35, bedRelief 1, top (colour of moss/snow/dust on upward faces, or null), topAmount, topSlope [lo,hi],
//   contact [height 0.45, darkening 0.55, bias -0.2] (grounding: the foot of the rock is darkened over `height` x instance scale,
//   starting at -bias x scale above the object's origin; use [3, 0.5, 0] for stacks and arches whose origin is at the base),
//   waterLevel, wet, wetRange, wetTint, roughness, flat, color, detailTexture, rng
export function makeRockMaterial(opts = {}) {
  const o = opts, k = o.scale ?? 1, T = o.terrain || null;
  const tex = o.detailTexture || (T && T.detailTexture) || makeDetailTexture({ rng: rngOf(o) });
  const strata = o.strataTable || (T && T.strata) || null;
  const ts = o.topSlope || [0.5, 0.85], ct = o.contact || [0.45, 0.55, -0.2];
  const uniforms = {
    tDetail: { value: tex }, tCell: { value: cellOf(tex) }, tStrata: { value: strata ? strata.texture : null },
    uTScale: { value: new THREE.Vector4(k / 61, k / 9.3, k / 2.1, k / 9.3) },
    uTRock: { value: strata ? strata.meanColor.clone() : col('#ffffff') }, uTRockB: { value: col('#ffffff') },
    uTSnow: { value: col('#ffffff') }, uTPatch: { value: col('#ffffff') }, uTGlowColor: { value: col('#000000') },
    uTWetTint: { value: col(o.wetTint ?? '#5b5f66') }, uTTop: { value: col(o.top ?? '#5d6b3a') },
    uTSlope: { value: new THREE.Vector4(0, 1, 0, 1) }, uTSnowP: { value: new THREE.Vector4(1e6, 1, 0, 0) },
    uTStrata: { value: new THREE.Vector4(strata ? (o.strata ?? 0.55) : 0, strata ? 1 / strata.span : 1, o.strataWarp ?? 3, o.varnish ?? 0.35) },
    uTWet: { value: new THREE.Vector4(o.waterLevel ?? -1e6, o.wetRange ?? 1.2, o.waterLevel == null ? 0 : (o.wet ?? 0.6), o.wetRoughness ?? 0.3) },
    uTDetail: { value: new THREE.Vector4(o.detail ?? 0.6, o.bump ?? 1.0, 0, 0) },
    uTGlow: { value: new THREE.Vector4(0, 1, 0, strata ? strata.base : 0) },
    uTTopP: { value: new THREE.Vector4(ts[0], ts[1], o.top ? (o.topAmount ?? 0.8) : 0, o.cracks ?? 0.2) },
    uTNear: { value: new THREE.Vector4(0, 0, 0, 0) }, uTWind: { value: new THREE.Vector4(1, 0, 1, 0) },
    uTFx: { value: new THREE.Vector4(0, 0, o.bedRelief ?? 1, 0) },
    uTCloud: o.cloudUniform || (T && T.uniforms.uTCloud) || cloudUniform(o),
    uTGround: { value: new THREE.Vector4(ct[0], ct[1], o.aoHeight ?? 26, -(ct[2] ?? 0)) },
    uTBounce: (T && o.bounce == null) ? T.uniforms.uTBounce : { value: col(o.bounce ?? '#000000').multiplyScalar(o.bounceAmount ?? 1) },
  };
  const defines = { T_ROCK: '' }, textures = { detailMap: tex, cellMap: cellOf(tex) };
  if (strata && uniforms.uTStrata.value.x > 0) { defines.T_STRATA = ''; textures.strataMap = strata.texture; }
  if (uniforms.uTCloud.value.w > 0) defines.T_CLOUD = '';
  if (T && T.shadeMap && o.shade !== false) { defines.T_SHADEMAP = ''; uniforms.tShade = { value: T.shadeMap }; uniforms.uTShadeBox = { value: T.shadeBox.clone() }; textures.shadeMap = T.shadeMap; }
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, color: col(o.color ?? '#ffffff'), roughness: o.roughness ?? 0.9, metalness: 0, flatShading: !!o.flat });
  inject(material, uniforms, 'rock', defines, textures);
  return material;
}
