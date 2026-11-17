// THE MOUNTAIN CITY LINE: a humid morning just after rain in a mountain river city, seen from the cab of a straddle
// monorail on a single concrete beam. Out from under a banyan-hung cliff, through a slot between apartment cliffs at
// balcony height (the oncoming train whips past the left pillar), round a long left curve on tall piers above a spiral
// interchange, a two-colour river confluence and a red arch bridge, then dead straight into the glowing five-storey
// hole in a nineteen-storey housing slab, where the portal waits.
// World space: X east, Z south, heights above the jade river (water at 0). The slab stands at the origin facing +Z.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep as sm } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as S from '../kit/structures.js';
import * as fx from '../kit/fx.js';
import * as Water from '../kit/water.js';
import { buildHero } from '../parts/through-the-tower.js';

const PALETTE = ['#DCE6DC', '#8E9690', '#3F7A4A', '#3FA08C', '#9A6B3F', '#C8382B', '#FFE9B8'];
const TAU = Math.PI * 2, EYE = 70, BEAM_DROP = 2.6, TWIN = 4.4, CAR = 14.2, CAR_GAP = 0.6;
const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const GLSL_N = /* glsl */`
float wH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float wN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(wH(i), wH(i + vec2(1., 0.)), f.x), mix(wH(i + vec2(0., 1.)), wH(i + vec2(1., 1.)), f.x), f.y); }
`;

// The four hours and weathers the line is seen in. Colours are sRGB hex; intensities follow the three.js light conventions.
const LOOKS = {
  washed: { preset: 'day', zenith: '#7fa3c4', mid: '#bccdd4', horizon: '#c6d4cf', ground: '#aebbb2', sunEl: 32, sunAz: 115, sun: '#ffe9b8', sunI: 2.7, sunDisc: 5,
    hemiSky: '#dfe7f0', hemiGnd: '#a09a8c', hemiI: 1.7, fog: '#cbd8d0', fogD: 0.0011, cover: 0.55, cLit: '#f0f3ec', cShade: '#a9b7bc', rays: 0.7, shaft: 1, glow: 1,
    lit: 0, exposure: 1.0, bloom: 0.34, sat: 1.12, tint: '#fbfff9', mist: 0.2, glint: 0.45, rain: 0, wipe: 0, parasol: 0.6 },
  // golden: the sun low over the confluence (east-south-east, where the line's long curve looks), peach under violet, the distance gone blue-grey
  golden: { preset: 'goldenHour', zenith: '#4a5f9a', mid: '#c79aa6', horizon: '#f6b98a', ground: '#8d8798', sunEl: 10, sunAz: 116, sun: '#ffb070', sunI: 2.8, sunDisc: 11,
    hemiSky: '#8fa2e0', hemiGnd: '#9a8068', hemiI: 1.35, fog: '#9aa3bf', fogD: 0.0009, cover: 0.36, cLit: '#ffd6a6', cShade: '#7f7a9c', rays: 0.4, shaft: 0.4, glow: 1.5,
    lit: 0.2, exposure: 1.0, bloom: 0.42, sat: 1.12, tint: '#fff5ea', mist: 0.16, glint: 1.7, rain: 0, wipe: 0, parasol: 0.35, hPow: 1.6, scat: 0.42, shadowTint: '#141c38' },
  fog: { preset: 'day', zenith: '#b6c3c6', mid: '#c4cfce', horizon: '#ccd6d1', ground: '#bcc7c1', sunEl: 24, sunAz: 112, sun: '#fff0d0', sunI: 1.0, sunDisc: 0,
    hemiSky: '#e2ebee', hemiGnd: '#9aa69a', hemiI: 2.05, fog: '#c5d0cb', fogD: 0.0034, cover: 1, cLit: '#dfe6e2', cShade: '#b4bfbf', rays: 0, shaft: 0.35, glow: 3.6,
    lit: 0.05, exposure: 0.98, bloom: 0.5, sat: 1.04, tint: '#f6fbf8', mist: 0.3, glint: 0.2, rain: 0, wipe: 0, parasol: 0.4 },
  rain: { preset: 'day', zenith: '#8f9da4', mid: '#a9b6b8', horizon: '#bcc8c4', ground: '#a3aeaa', sunEl: 30, sunAz: 115, sun: '#eef0e6', sunI: 0.8, sunDisc: 0,
    hemiSky: '#d6e2ea', hemiGnd: '#8a9688', hemiI: 2.0, fog: '#b7c4c0', fogD: 0.002, cover: 1, cLit: '#cfd8d6', cShade: '#93a0a4', rays: 0, shaft: 0, glow: 1.8,
    lit: 0.07, exposure: 1.05, bloom: 0.4, sat: 1.1, tint: '#f2f8fa', mist: 0.24, glint: 0.25, rain: 1, wipe: 1, parasol: 1 },
  dusk: { preset: 'blueHour', zenith: '#1a2a55', mid: '#3a5488', horizon: '#8d90b8', ground: '#39466c', sunEl: -4, sunAz: 255, sun: '#a8b6ee', sunI: 1.0, sunDisc: 0,
    hemiSky: '#8499d8', hemiGnd: '#3c4460', hemiI: 1.65, fog: '#586c9c', fogD: 0.0016, cover: 0.5, cLit: '#b0a6cc', cShade: '#2c3a66', rays: 0, shaft: 0, glow: 2.6,
    lit: 0.3, exposure: 1.1, bloom: 0.36, thr: 1.0, sat: 1.06, tint: '#eef0ff', mist: 0.16, glint: 0.3, rain: 0, wipe: 0, parasol: 0.3 },
};

// ---------------------------------------------------------------- thin things: wires, cables, kite strings
// Ribbons that never get thinner than 1.5 pixels; they sway between their anchors. segs: [ax,ay,az, bx,by,bz, swayA, swayB, phase]
function makeWires(segs, time, color, width) {
  const n = segs.length, P = new Float32Array(n * 12), O = new Float32Array(n * 12), K = new Float32Array(n * 16), I = new Uint32Array(n * 6);
  segs.forEach((s, i) => {
    for (let k = 0; k < 4; k++) {
      const end = k >> 1, o = (i * 4 + k) * 3, a = end ? 3 : 0, b = end ? 0 : 3;
      P[o] = s[a]; P[o + 1] = s[a + 1]; P[o + 2] = s[a + 2]; O[o] = s[b]; O[o + 1] = s[b + 1]; O[o + 2] = s[b + 2];
      const side = (k & 1 ? 1 : -1) * (end ? -1 : 1), q = (i * 4 + k) * 4;
      K[q] = side; K[q + 1] = end ? s[7] : s[6]; K[q + 2] = end ? s[6] : s[7]; K[q + 3] = s[8];
    }
    I.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2], i * 6);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aOther', new THREE.BufferAttribute(O, 3));
  g.setAttribute('aK', new THREE.BufferAttribute(K, 4)); g.setIndex(new THREE.BufferAttribute(I, 1));
  const U = { ...fx.fogUniforms(), uTime: time, uRes: { value: new THREE.Vector2(1280, 720) }, uCol: { value: new THREE.Color(color) }, uW: { value: width } };
  const m = new THREE.ShaderMaterial({
    uniforms: U, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 aOther; attribute vec4 aK; uniform float uTime, uW; uniform vec2 uRes; varying float vA; ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        vec3 sw = vec3(sin(uTime * 1.1 + aK.w), 0.3 * sin(uTime * 1.7 + aK.w), cos(uTime * 0.8 + aK.w * 1.3));
        vec4 mvPosition = modelViewMatrix * vec4(position + sw * aK.y, 1.);
        vec4 c0 = projectionMatrix * mvPosition, c1 = projectionMatrix * modelViewMatrix * vec4(aOther + sw * aK.z, 1.);
        vec2 d = (c1.xy / max(abs(c1.w), 1e-3) - c0.xy / max(abs(c0.w), 1e-3)) * uRes; float l = length(d); d = l > 1e-4 ? d / l : vec2(1., 0.);
        float px = uW * projectionMatrix[1][1] * uRes.y * 0.5 / max(abs(c0.w), 0.1), w = max(px, 1.5);
        vA = clamp(px / 1.5, 0.22, 1.);
        c0.xy += vec2(-d.y, d.x) * aK.x * w / uRes * c0.w;
        gl_Position = c0; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`uniform vec3 uCol; varying float vA; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ gl_FragColor = vec4(fxApplyFog(uCol), vA); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'wires';
  mesh.onBeforeRender = (renderer) => { renderer.getDrawingBufferSize(U.uRes.value); };
  return mesh;
}
// a sagging run of wire between two points, as segments for makeWires
function swag(out, a, b, sag, sway, phase, n = 7) {
  let px = a[0], py = a[1], pz = a[2], pw = 0;
  for (let i = 1; i <= n; i++) {
    const t = i / n, k = 4 * t * (1 - t), x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t) - sag * k, z = lerp(a[2], b[2], t), w = sway * k;
    out.push([px, py, pz, x, y, z, pw, w, phase]); px = x; py = y; pz = z; pw = w;
  }
}

// ---------------------------------------------------------------- kitchen steam and vent plumes: soft puffs rising and shearing
function makeSteam(emitters, rng, time, wind, colour) {
  const K = 5, n = emitters.length * K, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const B = new Float32Array(n * 4), D = new Float32Array(n * 4);
  emitters.forEach((e, i) => {
    const seed = rng();
    for (let k = 0; k < K; k++) { const o = (i * K + k) * 4; B[o] = e[0]; B[o + 1] = e[1]; B[o + 2] = e[2]; B[o + 3] = e[3] || 1; D[o] = (k + rng() * 0.6) / K + seed; D[o + 1] = rng(); D[o + 2] = rng.range(0.75, 1.3); D[o + 3] = rng.range(0.06, 0.1); }
  });
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aData', new THREE.InstancedBufferAttribute(D, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uWind: { value: new THREE.Vector3(wind[0], 1, wind[1]) }, uCol: { value: colour } },
    fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`attribute vec4 aBase, aData; uniform float uTime; uniform vec3 uWind; varying vec2 vQ; varying vec3 vK; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ float age = fract(uTime * aData.w + aData.x), s = aBase.w; vec3 p = aBase.xyz;
        p.y += (1. - exp(-age * 2.2)) * 9. * aData.z * s; p.xz += uWind.xz * (age * age * 7. + age * 1.5) * s;
        p.x += sin(age * 9. + aData.y * 30. + uTime * .4) * age * 1.1 * s;
        float size = (.5 + 4.6 * pow(age, .75)) * s * (.8 + .5 * aData.y);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); mvPosition.xy += position.xy * size;
        vQ = position.xy; vK = vec3(age, smoothstep(0., .1, age) * pow(1. - age, 1.5), aData.y);
        gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uTime; varying vec2 vQ; varying vec3 vK; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ float r = length(vQ); if (r > 1.) discard;
        float lump = .78 + .22 * sin(vQ.x * 5. + vK.z * 30. + uTime * .6) * cos(vQ.y * 4.3 - vK.z * 11.);
        float a = (1. - smoothstep(.15, 1., r)) * vK.y * .55 * lump;
        gl_FragColor = vec4(fxFogPremult(uCol * (.86 + .2 * vQ.y) * a, a), a); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'steam';
  return mesh;
}

// ---------------------------------------------------------------- the rivers: one sheet, two colours folding into each other
function makeRivers(time, o) {
  const g = new THREE.PlaneGeometry(4400, 4400, 1, 1); g.rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uJade: { value: o.jade }, uBrown: { value: o.brown }, uSky: { value: o.sky }, uSun: { value: o.sun }, uSunDir: { value: o.sunDir },
      uAmb: { value: o.amb }, uRain: { value: o.rain }, uGlint: { value: o.glint }, uFogNear: { value: o.fogNear ?? 0.62 } },
    fog: true,
    vertexShader: /* glsl */`varying vec3 vWP; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ vWP = (modelMatrix * vec4(position, 1.)).xyz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`uniform float uTime, uRain, uGlint, uFogNear; uniform vec3 uJade, uBrown, uSky, uSun, uSunDir, uAmb; varying vec3 vWP; ${fx.GLSL_FOG_PARS_FRAG} ${GLSL_N}
      void main(){
        vec2 q = vWP.xz; vec3 V = cameraPosition - vWP; float dist = max(length(V), 1e-3); V /= dist;
        float along = max(q.x - 300., 0.);
        // the join: a line running downstream from the tip of the peninsula, warped by eddies that drift with the current
        float warp = (wN(vec2(q.x * .011 - uTime * .045, q.y * .02)) - .5) * (16. + along * .26) + (wN(vec2(q.x * .04 - uTime * .15, q.y * .055 + 3.)) - .5) * (7. + along * .08);
        float s = q.y - (472. + (q.x - 300.) * .06) + warp, wd = 1.5 + along * .035;
        float mx = smoothstep(-wd, wd, s);
        float curl = wN(vec2(q.x * .09 - uTime * .3, q.y * .09 + s * .04));
        mx = clamp(mx + (curl - .5) * .5 * (1. - smoothstep(0., 22. + along * .1, abs(s))), 0., 1.);
        vec2 fl = mix(vec2(q.x * .05, q.y * .011 - uTime * .05), vec2(q.x * .011 - uTime * .07, q.y * .05), mx);
        float st = wN(fl) * .6 + wN(fl * 2.7 + 5.) * .4;
        vec3 body = mix(uJade, uBrown, mx) * (.78 + .44 * st) * uAmb;
        body += mix(uAmb * vec3(.34, .36, .32), uSky * .42, .65) * (1. - smoothstep(0., 6. + along * .03, abs(s + (curl - .5) * 8.))) * smoothstep(.3, .65, curl) * smoothstep(296., 316., q.x);
        float fade = smoothstep(900., 80., dist);
        vec2 r1 = q * .3 + vec2(uTime * .35, uTime * .22), r2 = q * .85 - vec2(uTime * .45, -uTime * .3);
        float h0 = wN(r1) + .5 * wN(r2);
        vec3 N = normalize(vec3((h0 - wN(r1 + vec2(.7, 0.)) - .5 * wN(r2 + vec2(.7, 0.))) * .5 * fade, 1., (h0 - wN(r1 + vec2(0., .7)) - .5 * wN(r2 + vec2(0., .7))) * .5 * fade));
        float fres = .04 + .96 * pow(1. - max(dot(N, V), 0.), 5.);
        vec3 R = reflect(-V, N); float sd = max(dot(R, uSunDir), 0.);
        float spark = step(.82, wN(q * 1.7 + uTime * vec2(.9, .6))) * fade * smoothstep(700., 250., dist);
        vec3 col = mix(body * mix(.9, 1.5, smoothstep(120., 450., dist)), uSky, min(fres * .5, .3)) + uSun * min(pow(sd, 220.) * 2.2 + pow(sd, 22.) * .08 * spark, 1.2) * uGlint;
        // the sun's road on the water: a long broken path of light under a low sun
        col += uSun * uGlint * pow(sd, 42.) * .2 * (.25 + .75 * smoothstep(.3, .75, wN(q * vec2(.045, .17) + uTime * vec2(.16, .09)) * .6 + wN(q * vec2(.21, .6) - uTime * vec2(.3, .2)) * .4));
        // rain pocking the surface
        vec2 pc = floor(q * .9), pf = fract(q * .9) - .5; float ph = wH(pc), pt = fract(uTime * (.9 + ph) + ph * 7.);
        float ring = (1. - smoothstep(.02, .07, abs(length(pf) - pt * .42))) * (1. - pt) * step(.45, ph);
        col += uSky * ring * .35 * uRain * smoothstep(420., 40., dist);
        gl_FragColor = vec4(mix(col, fxApplyFog(col), mix(uFogNear, 1., smoothstep(500., 1500., dist))), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'rivers'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the ground: a light Lambert shader with baked shade, moss, plots and wet rock
function makeLandMaterial(lift) {       // lift: 'r, g, b' share of the albedo given back as skylight bounce (blue dusk, where the grade's toe would crush the slopes to black)
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute vec2 aShade; varying vec3 vWP; varying vec3 vWN; varying vec2 vSh;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vWP = (modelMatrix * vec4(position, 1.)).xyz; vWN = normalize(mat3(modelMatrix) * normal); vSh = aShade;');
    sh.fragmentShader = 'varying vec3 vWP; varying vec3 vWN; varying vec2 vSh;\n' + GLSL_N + sh.fragmentShader.replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
      { vec2 q = vWP.xz; float n1 = wN(q * .045), n2 = wN(q * .19 + 7.), n3 = wN(q * .9 + 3.);
        float steep = 1. - smoothstep(.55, .82, vWN.y + (n2 - .5) * .16);
        float streak = wN(vec2((q.x + q.y) * .6, vWP.y * .09));
        float strata = wN(vec2(vWP.y * .5 + n2 * 2.4, (q.x + q.y) * .035));
        vec3 rock = mix(vec3(.15, .145, .13), vec3(.36, .34, .3), strata) * (.55 + .6 * streak);
        float bed = fract(vWP.y * .31 + n2 * .55 + n1 * .5), grain = wN(vec2(q.x + q.y, vWP.y * 1.9) * 1.1);
        rock *= (.72 + .28 * smoothstep(.0, .12, bed)) * (.8 + .4 * grain) * (1. - .45 * smoothstep(.62, .9, wN(vec2((q.x - q.y) * .5, vWP.y * .045))));
        float cling = smoothstep(.34, .6, n1 * .6 + n2 * .5);
        diffuseColor.rgb *= .58 + .3 * n1 + .22 * n2 + .2 * smoothstep(.25, .75, wN(q * .33 + 3.));
        // terraced plots: darker furrows and pale bunds stepping down the middle slopes
        // (near the line they cover most of the slope: distance to the long left curve, an arc about (-260, 150) of radius 260, to the last straight and to the end of the thread)
        vec2 qa = q - vec2(-260., 150.), qe = q - vec2(-540., 495.);
        float dArc = (qa.x > 0. && qa.y > 0. && qa.y < qa.x * 3.9) ? abs(length(qa) - 260.) : 999., dStr = (q.y <= 150. && q.y > -10.) ? abs(q.x) : 999.;
        float dThr = length(qe - vec2(.9652, -.2614) * clamp(qe.x * .9652 - qe.y * .2614, 150., 360.));
        float nearL = 1. - smoothstep(62., 108., min(min(dArc, dStr), dThr));
        float plot = max(smoothstep(.5, .7, wN(q * .012 + 11.)), nearL * smoothstep(.12, .3, wN(q * .03 + 4.))) * smoothstep(3., 9., vWP.y) * (1. - smoothstep(mix(48., 96., nearL), mix(80., 118., nearL), vWP.y));
        float tv = vWP.y / 3.2 + n1 * .5, band = fract(tv), dCp = length(cameraPosition - vWP);
        float ph = wH(floor(vec2((q.x * .8 + q.y * .6) / 9. + n1 * 1.5, tv)) + 3.);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.86, .74, .62), nearL * .75);
        vec3 crop = ph < .14 ? diffuseColor.rgb * vec3(.7, .9, .6) : ph < .4 ? diffuseColor.rgb * vec3(1.7, 1.3, .5) : ph < .66 ? vec3(.17, .115, .075) : ph < .82 ? vec3(.2, .23, .2) * (.8 + .4 * n2) : diffuseColor.rgb * vec3(1.15, 1.12, .8);
        crop *= mix(1., .78 + .22 * step(.5, fract(vWP.y * 2.7 + ph * 5.)), (1. - smoothstep(90., 200., dCp)) * step(.14, ph) * (1. - step(.66, ph) * step(ph, .82)));      // rows along the contour (not on the flooded beds)
        vec3 wallC = vec3(.3, .29, .26) * (.7 + .5 * wN(vec2((q.x + q.y) * 1.3, vWP.y * 2.1))) * (.75 + .5 * smoothstep(.0, .13, band));
        vec3 terr = mix(wallC, crop, smoothstep(.16, .2, band));
        terr = mix(terr, vec3(.4, .39, .34), (1. - smoothstep(.0, .035, abs(band - .23))) * .7);                                    // the pale bund along the lip
        diffuseColor.rgb = mix(diffuseColor.rgb, terr, plot * mix(.42, .92, nearL));
        // tree crowns: the green slopes read as a closed canopy of banyan and camphor rather than a lawn
        float veg = clamp((diffuseColor.g - max(diffuseColor.r, diffuseColor.b)) * 14., 0., 1.) * (1. - steep) * smoothstep(3., 7., vWP.y);
        vec2 cq = mix(q, vec2((q.x + q.y) * .75, vWP.y * 1.25), step(.5, steep)) * .15 + (n2 - .5) * .9, ci = floor(cq), cf = fract(cq), cr = vec2(0.); float md = 9., chh = 0.;
        for (int jy = -1; jy <= 1; jy++) for (int jx = -1; jx <= 1; jx++) {
          vec2 gg = vec2(float(jx), float(jy)), rr = gg + vec2(wH(ci + gg), wH(ci + gg + 17.3)) - cf; float d2 = dot(rr, rr);
          if (d2 < md) { md = d2; chh = wH(ci + gg + 5.1); cr = rr; } }
        float crown = 1. - smoothstep(0., .66, sqrt(md)), lit = clamp(.5 - cr.x * 1.1 + cr.y * .35, 0., 1.);
        float dC = length(cameraPosition - vWP), nearK = smoothstep(120., 260., dC);
        float cfar = veg * (1. - smoothstep(380., 950., dC)) * nearK * (1. - .85 * plot);
        diffuseColor.rgb *= mix(1., (.36 + .8 * crown * (.55 + .7 * lit)) * (.72 + .5 * chh), cfar * .88);
        // within about 160 m no crowns are painted on (real trees, scrub and creeper stand there): leaf litter, grass and moss at a fine grain
        vec2 fq = mix(q, vec2((q.x + q.y) * .75, vWP.y * 1.25), step(.5, steep));
        float fine = wN(fq * 2.5) * .55 + wN(fq * 7.3 + 5.) * .45;
        fine = mix(fine, fine * .55 + .45 * (wN(fq * 19.) * .6 + wN(fq * 47. + 2.) * .4), 1. - smoothstep(14., 55., dC));     // a sharper grain where the cab brushes the rock
        diffuseColor.rgb *= mix(.64 + .72 * fine, 1., nearK);
        float cfr = 1. - smoothstep(380., 950., dC);
        vec3 bush = vec3(.035, .085, .03) * mix(1., (.3 + 1.5 * crown * (.5 + .8 * lit)) * (.7 + .6 * chh), cfr);
        vec3 rockFar = mix(rock, bush, cling * mix(.75, smoothstep(.05, .5, crown), cfr));
        float ledge = (1. - smoothstep(0., .3, bed)) * smoothstep(.38, .62, wN(fq * .31 + 4.));     // moss gathers in patches on the bedding ledges and down the wet streaks
        float moss = smoothstep(.44, .7, fine * .55 + ledge * .3 + (1. - streak) * .22 + (n2 - .5) * .3);
        vec3 mossC = vec3(.05, .1, .035) * (.55 + .9 * wN(fq * 7.3 + 9.));
        rock = mix(mix(rock * (.78 + .44 * fine), mossC, moss * .75), rockFar, nearK);
        diffuseColor.rgb = mix(diffuseColor.rgb, rock, steep * .9);
        diffuseColor.rgb *= (.5 + .5 * vSh.y) * (.66 + .34 * vSh.x);
        ${lift ? `totalEmissiveRadiance += diffuseColor.rgb * vec3(${lift});` : ''} }`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
      { vec2 q = vWP.xz * .21; float e = .9, h0 = wN(q) + .5 * wN(q * 2.9 + 3.), k = .34 * (1. - smoothstep(140., 320., length(cameraPosition - vWP)));
        vec3 dn = vec3(h0 - wN(q + vec2(e, 0.)) - .5 * wN((q + vec2(e, 0.)) * 2.9 + 3.), 0., h0 - wN(q + vec2(0., e)) - .5 * wN((q + vec2(0., e)) * 2.9 + 3.));
        normal = normalize(normal + (viewMatrix * vec4(dn, 0.)).xyz * k); }`);
  };
  m.customProgramCacheKey = () => 'mcl-land4' + (lift || '');
  return m;
}

// ---------------------------------------------------------------- the far city: pale towers as instanced boxes with shader windows
function makeFarTowers(list, o) {
  const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
  const m = new THREE.MeshLambertMaterial();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLit = o.lit; sh.uniforms.uWarm = { value: new THREE.Color('#ffb866').multiplyScalar(o.warm ?? 1) };
    sh.vertexShader = 'varying vec3 vL; varying vec3 vNl; varying float vSeed;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
      vL = position * sc; vNl = normal; vSeed = instanceMatrix[3].x * .37 + instanceMatrix[3].z * .11;`);
    sh.fragmentShader = 'varying vec3 vL; varying vec3 vNl; varying float vSeed; uniform float uLit; uniform vec3 uWarm; float gWin = 0.;\n' + GLSL_N + sh.fragmentShader
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
      { float d = length(vViewPosition);
        if (abs(vNl.y) < .5) {
          vec2 q = abs(vNl.x) > .5 ? vec2(vL.z, vL.y) : vec2(vL.x, vL.y), c = vec2(q.x / 4.6, q.y / 3.4), id = floor(c), f = fract(c);
          float h = wH(id + floor(vSeed)), fadeW = smoothstep(1100., 260., d);
          float win = step(.16, f.x) * step(f.x, .84) * step(.26, f.y) * step(f.y, .82);
          diffuseColor.rgb *= mix(1., mix(.34, .62, h), win * fadeW);
          diffuseColor.rgb *= 1. - .16 * step(f.y, .12) * fadeW;
          float nearW = smoothstep(560., 220., d), hc = wH(id * 1.7 + floor(vSeed) + 3.);
          diffuseColor.rgb *= (1. - .24 * smoothstep(.5, .98, f.y) * nearW) * (1. - .22 * step(.95, f.x) * nearW);
          vec2 lp = (f - vec2(.18 + .5 * hc, .22)) / vec2(.2, .24);
          float cloth = step(abs(lp.x - .5), .5) * step(abs(lp.y - .5), .5) * step(.4, hc) * nearW;
          vec3 lc = mix(vec3(.5, .5, .46), vec3(.42, .1, .08), step(.88, hc)); lc = mix(lc, vec3(.2, .3, .4), step(.55, hc) * step(hc, .68));
          diffuseColor.rgb = mix(diffuseColor.rgb, lc, cloth * .75);
          diffuseColor.rgb *= .8 + .26 * wN(vec2(q.x * .35 + vSeed, q.y * .05)) - .1 * smoothstep(12., 0., q.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.74, .92, .7), smoothstep(.55, .9, wN(vec2(q.x * .11 + vSeed, q.y * .02))) * .6);
          gWin = win * step(1. - uLit * mix(.3, 1.4, wH(vec2(floor(vSeed), 3.))), h) * (.5 + h);
        } else diffuseColor.rgb *= .55 + .2 * wN(vL.xz * .4 + vSeed);
      }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uWarm * gWin * 1.2;');
  };
  m.customProgramCacheKey = () => 'mcl-far2';
  const mesh = new THREE.InstancedMesh(g, m, list.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  list.forEach((t, i) => { mesh.setMatrixAt(i, M.compose(p.set(t.x, t.y, t.z), q.setFromAxisAngle(Y, t.yaw), s.set(t.w, t.h, t.d))); mesh.setColorAt(i, c.setRGB(t.c[0], t.c[1], t.c[2])); });
  mesh.frustumCulled = false; mesh.name = 'far-towers';
  return mesh;
}

// ---------------------------------------------------------------- traffic: instanced cars driven round arcs and along straights in the vertex shader
// tracks: { arc: [cx, cz, R, th0, th1] | line: [x0, z0, x1, z1], y0, y1, len }
function makeTraffic(tracks, perKm, rng, time) {
  const A = [], B = [], C = [], cols = [];
  const paint = [[0.62, 0.63, 0.62], [0.5, 0.52, 0.54], [0.05, 0.055, 0.06], [0.55, 0.42, 0.06], [0.42, 0.05, 0.04], [0.1, 0.2, 0.34], [0.62, 0.63, 0.62], [0.3, 0.32, 0.33]];
  for (const t of tracks) {
    const n = Math.max(2, Math.round(t.len / 1000 * perKm));
    for (let i = 0; i < n; i++) {
      const dirn = i % 2 ? 1 : -1, v = rng.range(10, 16) * (t.slow || 1);
      if (t.arc) { A.push(t.arc[0], t.arc[1], t.arc[2], 0); B.push(t.arc[3], t.arc[4], t.y0 + 0.45, t.y1 + 0.45); }
      else { A.push(t.line[0], t.line[1], t.line[2], t.line[3]); B.push(0, 0, t.y0 + 0.45, t.y1 + 0.45); }
      C.push((i + rng()) / n, dirn * v / t.len, dirn * rng.range(1.5, 3.6) * (t.arc ? Math.sign(t.arc[4] - t.arc[3]) : 1), t.arc ? 0 : 1);
      const c = rng.pick(paint), k = rng.range(0.8, 1.1); cols.push(c[0] * k, c[1] * k, c[2] * k);
    }
  }
  const count = A.length / 4;
  const body = new THREE.BoxGeometry(1.8, 0.85, 4.4).translate(0, 0.62, 0), top = new THREE.BoxGeometry(1.6, 0.6, 2.3).translate(0, 1.3, -0.25);
  const P = [], N = [], K = [], I = []; let nv = 0;
  for (const [g, dark] of [[body, 1], [top, 0.16]]) {
    const p = g.attributes.position, nn = g.attributes.normal, ix = g.index;
    for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); K.push(dark, dark, dark); }
    for (let i = 0; i < ix.count; i++) I.push(ix.getX(i) + nv);
    nv += p.count; g.dispose();
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(K), 3)); g.setIndex(I);
  g.setAttribute('aT1', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('aT2', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
  g.setAttribute('aT3', new THREE.InstancedBufferAttribute(new Float32Array(C), 4));
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time;
    sh.vertexShader = /* glsl */`attribute vec4 aT1, aT2, aT3; uniform float uTime; vec2 gFw;
      vec3 carAt(vec3 l){
        float s = fract(aT3.x + uTime * aT3.y), dirn = aT3.y < 0. ? -1. : 1.;
        l *= smoothstep(0., .012, s) * (1. - smoothstep(.988, 1., s)) * (1. + step(.93, fract(aT3.x * 37.)) * vec3(.3, .7, 1.4));
        vec3 c; vec2 fw;
        if (aT3.w < .5) { float th = mix(aT2.x, aT2.y, s), R = aT1.z + aT3.z; vec2 d = vec2(cos(th), sin(th));
          fw = vec2(-d.y, d.x) * (aT2.y < aT2.x ? -1. : 1.); c = vec3(aT1.x + d.x * R, mix(aT2.z, aT2.w, s), aT1.y + d.y * R); }
        else { vec2 dd = aT1.zw - aT1.xy; fw = dd / max(length(dd), 1e-3); vec2 p = mix(aT1.xy, aT1.zw, s) + vec2(fw.y, -fw.x) * aT3.z; c = vec3(p.x, mix(aT2.z, aT2.w, s), p.y); }
        fw *= dirn; gFw = fw;
        return c + vec3(fw.x * l.z + fw.y * l.x, l.y, fw.y * l.z - fw.x * l.x);
      }
      ` + sh.vertexShader
      .replace('#include <beginnormal_vertex>', 'vec3 carP = carAt(position);\n vec3 objectNormal = vec3(gFw.x * normal.z + gFw.y * normal.x, normal.y, gFw.y * normal.z - gFw.x * normal.x);')
      .replace('#include <begin_vertex>', 'vec3 transformed = carP;');
  };
  m.customProgramCacheKey = () => 'mcl-cars';
  const mesh = new THREE.InstancedMesh(g, m, count);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cols), 3);
  mesh.frustumCulled = false; mesh.name = 'traffic';
  return mesh;
}

// ---------------------------------------------------------------- people: specks under parasols and umbrellas, walking to and fro along their own segment
function makePeople(Geo, list, time) {
  const b = new Geo();
  b.box(0, 0.42, 0, 0.3, 0.84, 0.24, [0.07, 0.08, 0.1], { mask: 1 | 2 | 16 | 32 });
  b.box(0, 1.14, 0, 0.44, 0.62, 0.28, [0.36, 0.38, 0.4], { mask: 1 | 2 | 4 | 16 | 32, taper: 0.8 });
  b.box(0, 1.58, 0, 0.2, 0.24, 0.2, [0.3, 0.2, 0.14], { mask: 1 | 2 | 4 | 16 | 32 });
  const nBody = b.nv;
  b.prism(0.08, 1.92, 0, 0.72, 0.24, 7, [1, 1, 1], { r2: 0.03, aoB: 1 });
  const g0 = b.toGeometry(), n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', g0.attributes.position); g.setAttribute('normal', g0.attributes.normal); g.setAttribute('color', g0.attributes.color); g.setIndex(g0.index);
  const kind = new Float32Array(b.nv); for (let i = nBody; i < b.nv; i++) kind[i] = 1;
  g.setAttribute('aTop', new THREE.BufferAttribute(kind, 1));
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4);
  list.forEach((p, i) => { A.set([p.a[0], p.a[1], p.a[2], p.ph], i * 4); B.set([p.b[0], p.b[1], p.b[2], p.sp], i * 4); C.set([p.c[0], p.c[1], p.c[2], p.um ? 1 : 0], i * 4); });
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 4));
  g.instanceCount = n;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time;
    sh.vertexShader = 'attribute vec4 aA, aB, aC; attribute float aTop; uniform float uTime;\n' + sh.vertexShader
      .replace('#include <color_vertex>', '#include <color_vertex>\n vColor.rgb = aTop > .5 ? aC.rgb : vColor.rgb * (.5 + 1.2 * fract(aA.w * 7.31));')
      .replace('#include <begin_vertex>', `vec3 transformed = position * (aTop > .5 ? aC.w : 1.) * 1.25;
        { float tt = aA.w + uTime * aB.w, s = abs(fract(tt) * 2. - 1.); s = s * s * (3. - 2. * s);
          transformed += mix(aA.xyz, aB.xyz, s); transformed.y += abs(sin(tt * 150.)) * .05; }`);
  };
  m.customProgramCacheKey = () => 'mcl-people';
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'people';
  return mesh;
}

// ---------------------------------------------------------------- rolling stock and river craft (geometry only)
function carGeometry(Geo, band) {
  const b = new Geo(), white = [0.7, 0.71, 0.69], glass = [0.025, 0.04, 0.045], grey = [0.2, 0.21, 0.22], L = CAR, h = L / 2;
  for (const s of [1, -1]) b.box(s * 1.12, -0.35, 0, 0.62, 1.5, L - 0.7, grey, { mask: 1 | 2 | 8 | 16 | 32, aoB: 0.6 });   // skirts straddling the beam
  b.box(0, 1.85, 0, 2.9, 3.0, L, white, { aoB: 0.85 });
  b.box(0, 3.45, 0, 2.4, 0.2, L - 0.8, [0.42, 0.43, 0.44], { mask: 1 | 2 | 4 | 16 | 32 });
  for (const z of [-3.6, 3.6]) b.box(0, 3.72, z, 1.8, 0.36, 2.8, [0.34, 0.35, 0.36], { mask: 1 | 2 | 4 | 16 | 32 });
  // side panels: nothing lies in the plane of anything else. The glazing ribbon and the band stop at each door; the door leaves stand 4 cm
  // proud of the body and their glass (level with the ribbon, so the glazing still reads as one line) 4 cm proud of the leaves
  const sides = (y0, y1, c, z0, z1, x = 1.46) => {
    b.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], c); b.quad([-x, y0, z0], [-x, y0, z1], [-x, y1, z1], [-x, y1, z0], c);
  };
  const doors = [-3.3, 0, 3.3], DW = 0.72, cuts = [-h + 0.25, ...doors.flatMap((z) => [z - DW, z + DW]), h - 0.25], cutsB = [-h, ...doors.flatMap((z) => [z - DW, z + DW]), h];
  for (let i = 0; i < cuts.length; i += 2) { sides(1.62, 2.72, glass, cuts[i], cuts[i + 1]); sides(1.08, 1.42, band, cutsB[i], cutsB[i + 1]); }
  sides(0.36, 0.5, grey, -h, h);
  for (const z of doors) { sides(0.55, 2.86, [0.5, 0.51, 0.5], z - DW, z + DW, 1.5); sides(1.62, 2.72, glass, z - 0.58, z - 0.03, 1.54); sides(1.62, 2.72, glass, z + 0.03, z + 0.58, 1.54); }
  for (const s of [1, -1]) { b.s = s; b.wallZ(-1.2, 1.2, 1.5, 2.95, h + 0.05, glass); b.wallZ(-1.3, 1.3, 0.95, 1.3, h + 0.05, band); }
  b.s = 1;
  return b.toGeometry();
}
function bargeGeometry(Geo, R, kind) {
  const b = new Geo(), wake = [0.8, 0.84, 0.8];
  const wakes = (z0, hw, len, sp) => {       // two foam arms that thin to nothing far astern, and the churned water between them
    for (const s of [1, -1]) b.quad([s * hw * 0.5, 0.14, z0], [s * (hw + 1.6), 0.14, z0], [s * (hw + sp), 0.14, z0 - len], [s * (hw + sp - 0.6), 0.14, z0 - len], wake, 1, 1, 0.5, 0.5);
    b.quad([-hw * 0.45, 0.13, z0], [hw * 0.45, 0.13, z0], [0.4, 0.13, z0 - len * 0.6], [-0.4, 0.13, z0 - len * 0.6], wake, 0.8, 0.8, 0.45, 0.45);
  };
  if (kind === 'cruiser') {
    b.box(0, 1.2, 0, 11, 3.2, 64, [0.66, 0.67, 0.66], { mask: 1 | 2 | 4 | 16 | 32, taper: 1.06, aoB: 0.7 });
    for (let d = 0; d < 3; d++) { const l = 50 - d * 9; b.box(0, 3.9 + d * 2.7, -2 - d * 2, 9.4 - d * 0.8, 2.6, l, [0.72, 0.72, 0.7], { mask: 1 | 2 | 4 | 16 | 32 });
      for (const s of [1, -1]) b.quad([s * (4.72 - d * 0.4), 4.2 + d * 2.7, s * (l / 2 - 1) - 2 - d * 2], [s * (4.72 - d * 0.4), 4.2 + d * 2.7, -s * (l / 2 - 1) - 2 - d * 2], [s * (4.72 - d * 0.4), 5.4 + d * 2.7, -s * (l / 2 - 1) - 2 - d * 2], [s * (4.72 - d * 0.4), 5.4 + d * 2.7, s * (l / 2 - 1) - 2 - d * 2], [0.03, 0.05, 0.07]); }
    b.box(0, 13.2, -12, 3, 3.2, 4, [0.5, 0.07, 0.05], { mask: 1 | 2 | 4 | 16 | 32 });
    wakes(-32, 5, 320, 46);
  } else if (kind === 'ferry') {
    b.box(0, 0.9, 0, 7.4, 2.6, 30, [0.62, 0.64, 0.63], { mask: 1 | 2 | 4 | 16 | 32, taper: 1.07, aoB: 0.7, top: [0.3, 0.32, 0.33] });
    b.box(0, 3.4, -1, 6.4, 2.4, 21, [0.72, 0.72, 0.69], { mask: 1 | 2 | 4 | 16 | 32 });
    for (const s of [1, -1]) b.quad([s * 3.22, 3.1, s * 9 - 1], [s * 3.22, 3.1, -s * 9 - 1], [s * 3.22, 4.1, -s * 9 - 1], [s * 3.22, 4.1, s * 9 - 1], [0.03, 0.05, 0.07]);
    b.box(0, 5.4, 5.5, 4.2, 1.7, 5, [0.74, 0.74, 0.7], { mask: 1 | 2 | 4 | 16 | 32 });
    b.box(0, 6.3, -4, 1.5, 3.2, 2.2, [0.55, 0.09, 0.06], { mask: 1 | 2 | 4 | 16 | 32 });
    wakes(-15, 3.4, 230, 34);
  } else {
    const hull = kind === 'sand' ? [0.1, 0.11, 0.12] : [0.2, 0.07, 0.05], len = kind === 'sand' ? 30 : 42;
    b.box(0, 0.7, 0, 8, 2.2, len, hull, { mask: 1 | 2 | 4 | 16 | 32, taper: 1.08, aoB: 0.7, top: [0.16, 0.15, 0.14] });
    if (kind === 'sand') b.box(0, 2.5, 3, 5.6, 2.2, len * 0.6, [0.5, 0.4, 0.24], { mask: 1 | 2 | 4 | 16 | 32, taper: 0.45 });
    else for (let i = 0; i < 4; i++) b.box(R.range(-0.8, 0.8), 2.9, -9 + i * 8.5, 5.6, 2.4, 7, R.pick([[0.42, 0.1, 0.06], [0.08, 0.2, 0.3], [0.5, 0.42, 0.3], [0.16, 0.3, 0.2]]), { mask: 1 | 2 | 4 | 16 | 32 });
    b.box(0, 3.4, -len / 2 + 3.4, 5.4, 3.4, 4.6, [0.66, 0.66, 0.63], { mask: 1 | 2 | 4 | 16 | 32 });
    b.wallZ(-2.2, 2.2, 3.9, 4.8, -len / 2 + 5.72, [0.03, 0.05, 0.07]);
    wakes(-len / 2, 3.6, 260, 38);
  }
  return b.toGeometry();
}

// ---------------------------------------------------------------- our cab: pillars at the frame edges, a roof lip, a low grey dash with two dials,
// a brass handle that trembles, a wiper parked low on the left, and beaded glass. Built in camera space (eye at the origin, looking down -Z) as
// separate parts that update() fits to the frustum of whatever camera it is given, so the cab frames a wide screen and an upright phone alike:
// the cab is drawn a little larger than the frame, so what shows of it is a rim: the rubber gasket down each side, a sill of cowl along the bottom 3%
// with the brass handle and the parked wiper reaching up from it. The dials sit below the frame. Nothing but the wiper's sweep crosses the middle.
const WIPER = { z: -1.63, a0: 0.035, a1: 2.05, r0: 0.42, r1: 1.08 };
function makeCab(Geo, time, tone, skyCol, dusk) {
  const group = new THREE.Group(); group.name = 'cab';
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, color: tone });
  const matE = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });       // self-lit: dial faces, needles, pilot lamps
  const paint = [0.17, 0.178, 0.186], rubber = [0.03, 0.031, 0.033], pale = [0.3, 0.305, 0.31], chrome = [0.42, 0.42, 0.4];   // (the grade has a toe: anything under ~0.05 after the tone goes black)
  const mesh = (b, m = mat) => { const x = new THREE.Mesh(b.toGeometry(), m); group.add(x); return x; };
  // A-pillars: what shows is the inner face, seen at a glancing angle: a rubber gasket against the glass, a pale bevel, then the painted post
  const pillars = [1, -1].map((s) => {
    const b = new Geo(), ys = [-3.4, -1.5, 1.5, 3.4];
    const strip = (xa, za, xb, zb, c, k0, k1) => { for (let i = 0; i < 3; i++) { const ka = i === 0 ? k0 : i === 1 ? k0 : k1, kb = i === 2 ? k1 : i === 1 ? k1 : k0;
      b.quad([s * xa, ys[i], za], [s * xb, ys[i], zb], [s * xb, ys[i + 1], zb], [s * xa, ys[i + 1], za], c, ka, ka, kb, kb); } };
    strip(-0.04, -1.56, -0.03, -1.545, rubber, 1, 1);
    strip(-0.03, -1.545, 0, -1.5, pale, 0.7, 1.15);
    strip(0, -1.5, 0, -1.2, paint, 0.75, 1.1);
    for (let y = -1.35; y < 1.4; y += 0.45) b.quad([s * -0.024, y - 0.009, -1.5315], [s * -0.015, y - 0.009, -1.518], [s * -0.015, y + 0.009, -1.518], [s * -0.024, y + 0.009, -1.5315], rubber);   // screw heads in the bevel
    const m = mesh(b); m.rotation.z = s * 0.035; return m;
  });
  // roof lip (unit width, scaled to the frame): the underside, lit toward the glass, a pale trim and the gasket
  const rb = new Geo();
  rb.quad([-0.5, 0.03, -1.2], [0.5, 0.03, -1.2], [0.5, 0, -1.6], [-0.5, 0, -1.6], paint, 0.5, 0.5, 1.1, 1.1);
  rb.quad([-0.5, -0.003, -1.565], [0.5, -0.003, -1.565], [0.5, -0.003, -1.6], [-0.5, -0.003, -1.6], pale, 0.8, 0.8, 1.1, 1.1);
  rb.quad([-0.5, -0.02, -1.603], [0.5, -0.02, -1.603], [0.5, 0, -1.6], [-0.5, 0, -1.6], rubber);
  const roof = mesh(rb);
  // dash (unit width, scaled to the frame). Local y 0 = its top edge at z -1.35; the cowl runs from there down to the glass, the panel falls toward the driver
  const db = new Geo(), cowl = (t, lift = 0) => [-0.098 * t + lift, -1.35 - 0.29 * t];
  const band = (t0, t1, x0, x1, c, k0, k1, lift = 0.003) => { const a = cowl(t0, lift), e = cowl(t1, lift); db.quad([x0, a[0], a[1]], [x1, a[0], a[1]], [x1, e[0], e[1]], [x0, e[0], e[1]], c, k0, k0, k1, k1); };
  band(0, 1, -0.5, 0.5, paint, 0.85, 1.35, 0);                                                           // cowl top: sky sheen growing toward the glass
  band(0.7, 0.96, -0.5, 0.5, [0.19, 0.21, 0.235], 0.75, 1.2);                                            // the windscreen's reflection lying on it
  band(0, 0.05, -0.5, 0.5, pale, 0.9, 0.9);                                                            // edge trim catching the light
  band(0.985, 1.03, -0.5, 0.5, rubber, 1, 1, 0.012);                                                   // gasket under the glass
  for (let i = 0; i < 31; i++) if (i % 8 !== 7) { const x = (i - 15) * 0.027; band(0.24, 0.5, x - 0.008, x + 0.008, rubber, 1, 1); }   // demister grille in four banks
  db.quad([-0.5, -0.4, -1.185], [0.5, -0.4, -1.185], [0.5, 0, -1.35], [-0.5, 0, -1.35], paint, 0.55, 0.55, 0.9, 0.9);                 // instrument panel
  const dash = mesh(db);
  // instruments on the panel (never stretched): two dials with pale faces, ticks and a red sector, three pilot lamps
  const ax = [1, 0, 0], ay = [0, 0.923, -0.385], nz = [0, 0.385, 0.923], ib = new Geo(), ie = new Geo(), dials = [];
  const on = (c, u, v, o) => [c[0] + ax[0] * u + nz[0] * o, c[1] + ay[1] * v + nz[1] * o, c[2] + ay[2] * v + nz[2] * o];
  const face = dusk ? [0.34, 0.23, 0.1] : [0.2, 0.195, 0.17], ink = dusk ? [0.05, 0.03, 0.02] : [0.02, 0.022, 0.025];
  for (const cx of [-0.33, 0.29]) {
    const c = [cx, -0.072, -1.32], pt = (r, a, o) => on(c, Math.cos(a) * r, Math.sin(a) * r, o);
    for (let i = 0; i < 20; i++) {
      const a0 = i / 20 * TAU, a1 = (i + 1) / 20 * TAU;
      ie.quad(pt(0, 0, 0.004), pt(0.061, a0, 0.004), pt(0.061, a1, 0.004), pt(0, 0, 0.004), face);
      ib.quad(pt(0.06, a0, 0.006), pt(0.07, a0, 0.003), pt(0.07, a1, 0.003), pt(0.06, a1, 0.006), chrome, 0.6 + 0.5 * Math.max(0, Math.sin(a0)), 0.6 + 0.5 * Math.max(0, Math.sin(a0)), 0.6 + 0.5 * Math.max(0, Math.sin(a1)), 0.6 + 0.5 * Math.max(0, Math.sin(a1)));
    }
    for (let i = 0; i <= 8; i++) { const a = (1.25 - 1.5 * i / 8) * Math.PI, w = i % 2 ? 0.03 : 0.05; ie.quad(pt(0.044, a - w, 0.005), pt(0.057, a - w, 0.005), pt(0.057, a + w, 0.005), pt(0.044, a + w, 0.005), ink); }
    for (let i = 0; i < 3; i++) { const a0 = (-0.25 + i * 0.1) * Math.PI, a1 = a0 + 0.1 * Math.PI; ie.quad(pt(0.035, a0, 0.0045), pt(0.042, a0, 0.0045), pt(0.042, a1, 0.0045), pt(0.035, a1, 0.0045), [0.62, 0.07, 0.04]); }
    dials.push(c);
  }
  for (const [x, col] of [[-0.56, [0.1, 0.8, 0.36]], [-0.02, [1.2, 0.12, 0.07]], [0.52, [0.1, 0.8, 0.36]]]) {
    const c = [x, -0.072, -1.32];
    ib.quad(on(c, -0.034, -0.016, 0.003), on(c, 0.034, -0.016, 0.003), on(c, 0.034, 0.016, 0.003), on(c, -0.034, 0.016, 0.003), rubber);
    ie.quad(on(c, -0.027, -0.01, 0.005), on(c, 0.027, -0.01, 0.005), on(c, 0.027, 0.01, 0.005), on(c, -0.027, 0.01, 0.005), col);
  }
  const inst = new THREE.Group(); inst.add(new THREE.Mesh(ib.toGeometry(), mat), new THREE.Mesh(ie.toGeometry(), matE)); group.add(inst);
  inst.visible = false;        // the instrument panel lies below the frame on every screen shape
  const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(...ax), new THREE.Vector3(...ay), new THREE.Vector3(...nz)), rot = new THREE.Matrix4();
  const needles = dials.map((c) => {
    const n = new Geo(); n.quad([-0.005, -0.012, 0], [0.005, -0.012, 0], [0.0018, 0.054, 0], [-0.0018, 0.054, 0], dusk ? [0.05, 0.02, 0.012] : [0.5, 0.05, 0.02]);
    n.quad([-0.009, -0.009, 0.001], [0.009, -0.009, 0.001], [0.009, 0.009, 0.001], [-0.009, 0.009, 0.001], ink);
    const m = new THREE.Mesh(n.toGeometry(), matE); m.matrixAutoUpdate = false; m.userData.c = new THREE.Vector3(c[0] + nz[0] * 0.008, c[1] + nz[1] * 0.008, c[2] + nz[2] * 0.008); inst.add(m); return m;
  });
  // brass controller handle standing on the cowl, right of centre
  const hg = new Geo(), brass = [0.5, 0.33, 0.1];
  hg.box(0, 0.05, 0, 0.022, 0.1, 0.022, [0.09, 0.09, 0.095]); hg.box(0, 0.115, 0, 0.075, 0.036, 0.036, brass, { aoB: 0.6, top: [0.8, 0.56, 0.2] }); hg.box(0, -0.002, 0, 0.13, 0.014, 0.08, [0.14, 0.14, 0.145], { top: [0.24, 0.24, 0.245] });
  const handle = mesh(hg); handle.rotation.x = 0.3;
  // wiper: arm and blade pivoting low on the left
  const wg = new Geo(); wg.box(0.23, 0, 0, 0.46, 0.012, 0.012, [0.07, 0.07, 0.075]); wg.box(WIPER.r0 + (WIPER.r1 - WIPER.r0) / 2, 0, 0.004, WIPER.r1 - WIPER.r0, 0.018, 0.012, [0.03, 0.03, 0.032]);
  wg.box(0, 0, 0, 0.06, 0.06, 0.02, [0.1, 0.1, 0.11]);
  const wiper = mesh(wg); wiper.rotation.z = WIPER.a0;
  // the glass: beads of rain, the wiped fan, a faint sky sheen toward the top. A unit quad stretched over the whole frustum; vP is in metres on the glass
  const GU = { uTime: time, uSky: { value: skyCol }, uWipe: { value: 0 }, uClean: { value: 0 }, uAll: { value: 1 }, uBeads: { value: 1 }, uPiv: { value: new THREE.Vector4(-0.98, -0.7, WIPER.a0, WIPER.a1) },
    uR: { value: new THREE.Vector2(WIPER.r0, WIPER.r1) }, uHalf: { value: new THREE.Vector2(1.77, 1) }, uRain: { value: 0 } };
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), new THREE.ShaderMaterial({
    uniforms: GU, transparent: true, depthWrite: false,
    vertexShader: 'uniform vec2 uHalf; varying vec2 vP; void main(){ vP = position.xy * uHalf; gl_Position = projectionMatrix * modelViewMatrix * vec4(vP, 0., 1.); }',
    fragmentShader: /* glsl */`uniform float uTime, uWipe, uClean, uAll, uBeads, uRain; uniform vec3 uSky; uniform vec4 uPiv; uniform vec2 uR, uHalf; varying vec2 vP; ${GLSL_N}
      vec2 bead(vec2 p, float sc, float seed){
        p.y -= uTime * .004 * (1. + uRain * 14.);
        vec2 c = floor(p * sc), f = fract(p * sc) - .5; float h = wH(c + seed), h2 = wH(c * 1.7 + seed + 3.);
        vec2 o = (vec2(h, h2) - .5) * .56; float r = .07 + .17 * wH(c + seed + 9.), d = length(f - o);
        float a = (1. - smoothstep(r * .72, r, d)) * step(.5, wH(c * .7 + seed + 5.));
        return vec2(a, clamp(.5 + (f.y - o.y - (f.x - o.x) * .6) / max(r, 1e-3) * .55, 0., 1.));
      }
      void main(){
        vec2 q = vP - uPiv.xy; float r = length(q), ang = atan(q.y, q.x + 1e-5);
        float fan = smoothstep(uR.x, uR.x + .02, r) * (1. - smoothstep(uR.y - .02, uR.y, r)) * step(uPiv.z, ang) * step(ang, uPiv.w);
        float wiped = fan * max(uClean, step(ang, uWipe));
        float edge = max(smoothstep(.84, 1., abs(vP.x) / max(uHalf.x, 1e-3)), smoothstep(.82, 1., abs(vP.y) / max(uHalf.y, 1e-3)));
        float keep = max(mix(edge, 1., uAll), fan * .85) * (1. - wiped);
        vec2 b1 = bead(vP, 13., 0.), b2 = bead(vP + 3.7, 27., 7.);
        float a = max(b1.x, b2.x * .8) * keep * uBeads, hi = b1.x > b2.x * .8 ? b1.y : b2.y;
        vec3 col = uSky * mix(.42, 1.05, hi);
        float rim = fan * (1. - smoothstep(0., .012, abs(r - (uR.y - .01)))) * .1 * uClean * uBeads;
        float sheen = smoothstep(.2, .95, vP.y / max(uHalf.y * .92, 1e-3)) * .035;
        gl_FragColor = vec4(mix(col, uSky, step(a, .001)), clamp(a * mix(.1, .34, abs(hi - .5) * 2.) + rim + sheen, 0., .7)); }`,
  }));
  glass.position.z = -1.66; glass.renderOrder = 50; group.add(glass);
  group.traverse((o) => { o.frustumCulled = false; if (o.isMesh && o !== glass) o.renderOrder = 51; });
  const st = { wipe: 0 };
  return {
    object: group, uniforms: GU, tone: mat.color,
    // fit every part to the frustum of the camera in use this frame (never cached: the portal preview uses another camera)
    fit(camera) {
      const tv = Math.tan((camera.fov || 62) * Math.PI / 360), th = tv * (camera.aspect || 16 / 9), px = 1.5 * th * 1.11, dy = -1.1 * tv * 1.35;   // pillars, roof lip and dash sit just outside the picture; only the handle's knob reaches in
      pillars[0].position.x = px; pillars[1].position.x = -px;
      roof.position.y = 1.6 * tv * 1.09; roof.scale.x = dash.scale.x = 2 * th * 1.75;
      dash.position.y = inst.position.y = dy;
      handle.position.set(0.62 * th * 1.42, dy - 0.075, -1.42);
      const wk = clamp(th / 1.068, 0.5, 1.15), wx = -0.563 * th * 1.63, wy = dy - 0.145;
      wiper.position.set(wx, wy, WIPER.z); wiper.scale.x = wk;
      GU.uHalf.value.set(th * 1.66, tv * 1.66); GU.uPiv.value.set(wx, wy, WIPER.a0, WIPER.a1); GU.uR.value.set(WIPER.r0 * wk, WIPER.r1 * wk);
    },
    // sweep 0..1..0 = the wiper's stroke; needle and handle follow speed and the passing train
    update(t, sweep, rock, speedK) {
      const a = lerp(WIPER.a0, WIPER.a1, sweep); wiper.rotation.z = a;
      if (sweep > 0.02) { st.wipe = Math.max(st.wipe, a); GU.uWipe.value = a; } else { if (st.wipe > WIPER.a1 * 0.8) GU.uClean.value = 1; st.wipe = 0; GU.uWipe.value = 0; }
      for (let i = 0; i < 2; i++) {
        const ang = i ? -1.9 + 0.5 * Math.sin(t * 0.7) + 0.06 * Math.sin(t * 9) : 2.0 - 3.1 * speedK + 0.05 * Math.sin(t * 11 + 1) + rock * 0.3;
        needles[i].matrix.copy(basis).multiply(rot.makeRotationZ(ang)).setPosition(needles[i].userData.c);
      }
      handle.rotation.z = 0.25 + 0.012 * Math.sin(t * 31) + 0.008 * Math.sin(t * 47 + 1) + rock * 0.05;
    },
  };
}

export default {
  id: 'through-the-tower',
  name: 'The Mountain City Line',
  category: 'city',
  weirdness: 0.15,
  media: ['rail', 'air', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene(), time = { value: 0 }, updaters = [];

    // ------------------------------------------------------------ per-seed character: hour and weather, season, cast
    const pick = rng.fork('look'), hour = vary.hour || 'any';
    const lookId = hour === 'golden' ? 'golden' : hour === 'night' ? 'dusk' : hour === 'dawn' ? (pick.chance(0.55) ? 'fog' : 'washed')
      : hour === 'day' ? (pick.chance(0.7) ? 'washed' : 'rain') : pick.pick(['washed', 'washed', 'washed', 'golden', 'fog', 'rain', 'washed', 'golden', 'washed', 'rain']);
    const L = LOOKS[lookId];
    const season = pick.pick(['summer', 'summer', 'summer', 'summer', 'spring', 'spring', 'winter']);
    const livery = lin(pick.pick(['#3FA08C', '#3FA08C', '#e07a2a', '#7d858c'])), cruiser = pick.chance(0.35), kites = pick.chance(0.5) && (lookId === 'washed' || lookId === 'golden');
    const laundryHue = pick(), sA = pick.sign() * pick.range(0.7, 1.15), windA = pick.range(-0.6, 0.6), wind = [Math.cos(windA), Math.sin(windA)];
    const rare = !!vary.rare;
    const GR = makeRng('mcl-gable:' + ctx.seed), XR = makeRng('mcl-extra:' + ctx.seed);     // later additions draw from their own streams, so the rest of the city is laid out as before
    const fogColor = new THREE.Color(L.fog), sunColor = new THREE.Color(L.sun), skyCol = new THREE.Color(L.horizon);
    const leafHex = season === 'winter' ? '#5f7450' : season === 'spring' ? '#4f8a48' : '#3F7A4A';

    // ------------------------------------------------------------ the line: 360 m through the thread, a 340 m left curve over the gorge, 150 m dead straight
    const E = [-540, EYE, 495], dir = [0.9652, -0.2614], lft = [-0.2614, -0.9652], pts = [];
    for (const [d, off] of [[0, 0], [45, 0], [105, 3.2], [170, 5.5], [240, 0.5], [300, -4.2], [360, 0]]) pts.push([E[0] + dir[0] * d + lft[0] * off * sA, EYE, E[2] + dir[1] * d + lft[1] * off * sA]);
    for (const deg of [62.5, 50, 37.5, 25, 12.5]) { const a = deg * Math.PI / 180; pts.push([-260 + 260 * Math.cos(a), EYE - 4 * Math.pow(Math.sin((75 - deg) / 75 * Math.PI), 1.2), 150 + 260 * Math.sin(a)]); }
    pts.push([0, EYE, 150], [0, EYE, 100], [0, EYE, 50], [0, EYE, 2]);
    const path = makePath(pts), PL = path.length, DUR = 41;
    const lowPath = makePath([[-720, 22, 604], [-470, 27, 560], [-300, 33, 505], [-150, 39, 415], [-60, 39, 318], [30, 39, 246], [124, 38, 150], [142, 37, 40], [150, 37, -52], [152, 37, -200], [150, 38, -420]]);
    const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _q = new THREE.Quaternion();
    const frame = (pth, d) => { pth.posAtDist(d, _p); pth.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1; return { x: _p.x, y: _p.y, z: _p.z, tx: _t.x / l, tz: _t.z / l, lx: _t.z / l, lz: -_t.x / l }; };

    // ------------------------------------------------------------ sky, fog, light
    const sky = makeSky({
      rng: rng.fork('sky'), preset: L.preset, zenith: L.zenith, mid: L.mid, horizon: L.horizon, ground: L.ground, horizonPow: L.hPow || 2.6, midPow: 1.3,
      sunElevation: L.sunEl, sunAzimuth: L.sunAz, sunColor: L.sun, sunIntensity: L.sunDisc, sunSize: lookId === 'golden' ? 1.7 : 2.2, sunGlow: lookId === 'golden' ? 0.9 : 0.5, veil: 0.8,
      scatterColor: L.sun, scatter: L.scat || 0.25, stars: lookId === 'dusk' ? 0.25 : 0, milkyWay: 0, nebula: 0, aurora: 0, bodies: [], sun2: false,
      clouds: { coverage: L.cover, softness: 0.42, scale: 1.25, opacity: 0.95, lit: L.cLit, shade: L.cShade, silver: 0.7, absorb: 1.1, wind: [0.008 * wind[0], 0.008 * wind[1]], haze: 0.35 },
      clouds2: false, fogColor,
    });
    sky.object.name = 'sky'; scene.add(sky.object); updaters.push(sky);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(fogColor, L.fogD);
    const sunDir = sky.lightDirection.clone().normalize();
    const hemi = new THREE.HemisphereLight(new THREE.Color(L.hemiSky), new THREE.Color(L.hemiGnd), L.hemiI);
    const sun = new THREE.DirectionalLight(sunColor, L.sunI); sun.position.copy(sunDir).multiplyScalar(400);
    scene.add(hemi, sun, sun.target);
    const gold = lookId === 'golden';
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [1700, 3300], height: [170, 430], jagged: gold ? 0.22 : 0.35, segments: 200, sunDir, sunColor, sunIntensity: 0.35,
      colorNear: lookId === 'dusk' ? '#2c3c66' : gold ? '#5a6a92' : '#5f8f86', haze: fogColor, hazeNear: gold ? 0.55 : 0.62, hazeFar: gold ? 0.9 : 0.93, footHaze: 0.85, rim: gold ? 0.45 : 0.3 });
    scene.add(ridges.object); updaters.push(ridges);
    await ctx.yield();

    // ------------------------------------------------------------ the hero: the slab with the hole
    const HY = EYE - 25.5;
    const hero = await buildHero(ctx, { palette: PALETTE, beam: false, bulkhead: true, shaftBeam: L.shaft > 0.5, progress: 0, laundryHue,
      laundry: lookId === 'golden' || lookId === 'dusk' ? 0.6 : lookId === 'rain' ? 0.75 : 1, lit: L.lit });
    hero.object.position.set(0, HY, 0); scene.add(hero.object);
    hero.setSky(L.horizon); hero.setGlow(L.glow); hero.setShaftColor(L.sun, L.shaft);
    if (lookId === 'golden' || lookId === 'dusk') { const c = new THREE.Color(L.hemiSky).multiplyScalar(L.hemiI * 0.3); hero.setPlantLift(c.r, c.g, c.b); }      // shaded creeper stays dark green, not black
    const kit = hero.kit, { G, GL, GB, K, mixc, mul, jit } = kit, P = kit.pal, KR = rng.fork('city');
    await ctx.yield();

    // ------------------------------------------------------------ the land: two river valleys, a gorge basin, the slab's shoulder, the tunnel cliff
    const bankS = (x) => 640 - (x + 540) * 0.2, bankJ = (z) => 150 + 150 * sm(100, 420, z), eastJ = (z) => bankJ(z) + 220 + Math.max(0, z - 380) * 3;
    const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };
    const prof = (d) => (d < 14 ? 6.5 * sm(0, 12, d) : d < 44 ? 6.5 + (d - 14) * 0.1 : d < 130 ? 9.5 + (d - 44) * 0.31 : Math.min(36.2 + (d - 130) * 0.6, 118 + (d - 130) * 0.06));
    const nearP = T.pathNearest(path), GC = [48, 388];
    const height = (x, z) => {
      const dW = smin(bankS(x) - z, bankJ(z) - x, 40), dE = x - eastJ(z), dSo = z - bankS(x) - 600, d = Math.max(dW, dE, dSo);
      if (d <= 0) return Math.max(-5, d * 0.35);
      // (each noise is only worked out where its weight is not zero, and the line is only looked for near it: the same heights for less work)
      const n1 = d > 120 ? noise.fbm2(x * 0.0023 + 5, z * 0.0023, 4) : 0, n2 = noise.n2(x * 0.021, z * 0.021 + 3);
      let h = prof(d) + (n1 * 0.5 + 0.5) * 95 * sm(120, 460, d) + n2 * 3.5 * sm(30, 120, d);
      if (dE > 120) h += sm(120, 620, dE) * (45 + 75 * (noise.n2(x * 0.0035 + 9, z * 0.0035 - 4) * 0.5 + 0.5));      // the far bank climbs to join the ridges
      if (dW > 0) {
        h += 42 * sm(-40, -320, z) * sm(170, -60, x);
        const g = 1 - sm(120, 250, Math.hypot(x - GC[0], z - GC[1]));
        if (g > 0) h = lerp(h, Math.min(h, 7.6 + n2 * 1.2), g);
        const f = (1 - sm(98, 114, Math.abs(x))) * (1 - sm(30, 46, z)) * sm(-38, -24, z);
        if (f > 0) h = lerp(h, clamp(h, 33.5, 41.5), f);
        if (x > -650 && x < 110 && z > -100 && z < 600) { const n = nearP(x, z);
          if (n.dist < 92) h = Math.min(h, n.y - 21 + Math.max(0, n.dist - 9) * 0.95 + Math.max(0, n.dist - 30) * 2); }
        const s = (x - E[0]) * dir[0] + (z - E[2]) * dir[1], off = (x - E[0]) * lft[0] + (z - E[2]) * lft[1];
        if (s < 112) {
          if (s < -14) h = lerp(h, Math.max(h, 168 + n2 * 14), sm(-14, -36, s) * (1 - sm(40, 150, -off)));
          if (off > 10) h = Math.max(h, Math.min(150 + n2 * 10, 60 + (off - 10) * 4.2) * (1 - sm(50, 112, s)));
        }
      }
      return h;
    };
    const lf = lin(leafHex), cLo = [lf[0] * 0.72, lf[1] * 0.7, lf[2] * 0.7], cHi = [lf[0] * 2.0, lf[1] * 1.2, lf[2] * 0.8], cMud = lin('#6c6048'), cCon = lin('#8a8f86'), cBed = lin('#3c4a40');
    const urban = (x, z) => noise.n2(x * 0.0042 + 11, z * 0.0042 - 7) * 0.6 + noise.n2(x * 0.013, z * 0.013 + 31) * 0.4;
    await ctx.yield();
    const land = await T.makeTerrainAsync({
      rng: rng.fork('land'), noise, path, height, corridor: false, cell: 4, near: 34, bounds: [-1150, -950, 1750, 1500], refine: 1, maxTriangles: Math.round(66000 * (0.7 + 0.3 * detail)),
      focus: (x, z) => { const np = nearP(x, z); let d = np.dist; if (d < 96 && np.u * PL > 470 && np.u * PL < 775) d = Math.min(d, 18 + d * 0.16); const dg = Math.hypot(x - GC[0], z - GC[1]); if (dg < 260) d = Math.min(d, 46 + dg * 0.2); if (Math.abs(x) < 130 && z > -60 && z < 60) d = Math.min(d, 40); return d; },
      materialInstance: makeLandMaterial(lookId === 'dusk' ? '.4, .5, .85' : lookId === 'golden' ? '.42, .44, .5' : ''), detailTexture: new THREE.DataTexture(new Uint8Array(4), 1, 1), sunDir, ao: 0.5, shadow: lookId === 'washed' ? 0.42 : lookId === 'golden' ? 0.22 : 0.15,
      color: (x, z, h, ny, out) => {
        const ts = (x - E[0]) * dir[0] + (z - E[2]) * dir[1], to = Math.abs((x - E[0]) * lft[0] + (z - E[2]) * lft[1]), th = (1 - sm(42, 80, to)) * sm(25, 70, ts) * (1 - sm(385, 440, ts));
        const a = noise.n2(x * 0.012 + 3, z * 0.012) * 0.5 + 0.5, u = Math.max(th, sm(0.05, 0.4, urban(x, z)) * sm(5, 9, h) * (1 - sm(120, 170, h)));
        let r = lerp(cLo[0], cHi[0], a), g = lerp(cLo[1], cHi[1], a), b = lerp(cLo[2], cHi[2], a);
        const k = u * 0.62; r = lerp(r, cCon[0] * 0.6, k); g = lerp(g, cCon[1] * 0.6, k); b = lerp(b, cCon[2] * 0.6, k);
        const q = sm(3.2, 1.0, h); r = lerp(r, cMud[0], q); g = lerp(g, cMud[1], q); b = lerp(b, cMud[2], q);
        const e = sm(4.5, 6.2, h) * (1 - sm(7.4, 9.5, h)) * 0.8; r = lerp(r, cCon[0], e); g = lerp(g, cCon[1], e); b = lerp(b, cCon[2], e);
        const w = sm(0.2, -1.5, h); out.r = lerp(r, cBed[0], w); out.g = lerp(g, cBed[1], w); out.b = lerp(b, cBed[2], w);
        return out;
      },
    }, ctx.yield, 2);
    land.object.name = 'land'; scene.add(land.object);
    const groundAt = (x, z) => land.heightAt(x, z);
    await ctx.yield();
    const lightK = new THREE.Color(L.hemiSky).multiplyScalar(L.hemiI * 0.3).add(sunColor.clone().multiplyScalar(L.sunI * 0.16 * Math.max(0.2, sunDir.y)));
    const rivers = makeRivers(time, { jade: new THREE.Color('#2a9d80').multiplyScalar(gold ? 1.3 : 1), brown: new THREE.Color(gold ? '#a8703c' : '#9a6f44'), fogNear: gold ? 0.4 : lookId === 'washed' ? 0.5 : 0.62, sky: skyCol.clone().multiplyScalar(lookId === 'dusk' ? 0.55 : 0.9), sun: sunColor.clone().multiplyScalar(L.sunI),
      sunDir, amb: lightK, rain: L.rain, glint: L.glint });
    rivers.position.y = 0.3; scene.add(rivers);
    await ctx.yield();

    // ------------------------------------------------------------ the thread: fourteen apartment blocks stepping up the slope either side of the beam
    const Q = (B, a, b, c, d, w, col, k0 = 1, k1 = 1) => {     // a quad whose winding is chosen so that it faces `w`
      const e = d[0] === a[0] && d[1] === a[1] && d[2] === a[2] ? c : d, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = e[0] - a[0], vy = e[1] - a[1], vz = e[2] - a[2];
      if ((uy * vz - uz * vy) * w[0] + (uz * vx - ux * vz) * w[1] + (ux * vy - uy * vx) * w[2] < 0) B.quad(b, a, d, c, col, k0, k0, k1, k1); else B.quad(a, b, c, d, col, k0, k0, k1, k1);
    };
    const UP = [0, 1, 0], DOWN = [0, -1, 0], groups = [];
    const blocks = [], steamers = [], walkers = [], wires = [], keepOut = [];
    const parasol = () => { const c = KR.chance(0.25) ? [0.7, 0.7, 0.68] : KR.pick(P.cloths); return [c[0] * 1.15, c[1] * 1.15, c[2] * 1.15]; };
    const addWalker = (a, b, speed = 0.9) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1; walkers.push({ a, b, ph: KR() * 4, sp: speed * KR.range(0.7, 1.3) / (2 * len), c: parasol(), um: KR.chance(L.parasol) }); };
    const lantern = (x, y, z) => K.box(x, y - 0.3, z, 0.4, 0.46, 0.4, [2.9, 0.2, 0.1], { mask: 1 | 2 | 16 | 32 | 8 });
    const band = (season === 'winter' || rare ? 7 : 8) + 2 * detail, lit = L.lit, DR = makeRng('mcl-gdress:' + ctx.seed);
    const placeBlock = async (d, side, low, nb, lateral, plain) => {
      const f = frame(path, d), off = lateral ?? (side > 0 ? 21 : -16), x = f.x + f.lx * off, z = f.z + f.lz * off, yaw = Math.atan2(-side * f.lx, -side * f.lz), hw = nb * 2.5;
      let base = 1e9; for (const [ax, az] of [[-hw, -8], [hw, -8], [-hw, 8], [hw, 8], [0, 0]]) base = Math.min(base, groundAt(x + ax * f.tx + az * f.lx, z + ax * f.tz + az * f.lz));
      base = Math.round(base + 2.5);
      const ns = low ? Math.max(4, Math.round((EYE - BEAM_DROP - 6 - base) / 3.4)) : KR.int(side > 0 ? 21 : 19, side > 0 ? 29 : 26), m = kit.mark();
      await kit.towerAsync(KR, { nb, ns, core: KR.chance(0.6) ? KR.int(0, nb - 1) : -1, skirt: 28, sheets: low, hut: low, gableRng: GR, dressRng: DR,
        gableDress: (s, k) => s !== side && !low && Math.abs(base + k * 3.4 + 1.7 - EYE) < 11.5,
        gable: (s, k) => { const yc = base + k * 3.4 + 1.7 - EYE;       // the end that faces the approaching cab is loaded like a balcony face; the other end is never seen
          if (s === side || yc < -42 || yc > 56) return -1;
          return low ? 2 : Math.abs(yc) < (d < 230 ? 7 : 4) ? 2 : yc > -17 && yc < 21 ? (Math.abs(yc) < 12 ? 1 : 0.5) : 0; },
        level: (b, k) => { const yc = base + k * 3.4 + 1.7 - EYE; return low ? 1 : plain ? (Math.abs(yc) < 13 ? 1 : 0) : Math.abs(yc) < band ? 2 : yc > -24 && yc < 28 ? 1 : 0; } }, ctx.yield);
      kit.place(m, x, base, z, yaw);
      const B = { x, z, r: Math.hypot(hw, 8) + 3, top: base + ns * 3.4, base, d, side, f, hw, low };
      blocks.push(B); keepOut.push([x, z, B.r + 2]);
      if (low) {
        for (let j = 0; j < 2; j++) steamers.push([x + f.tx * KR.range(-hw + 2, hw - 2) + f.lx * KR.range(-4, 4), B.top + 2.6, z + f.tz * KR.range(-hw + 2, hw - 2) + f.lz * KR.range(-4, 4), KR.range(0.5, 0.8)]);
        for (let j = 0; j < 4; j++) { const o = side * (1.5 + (KR.range(-5, 5) + 5) * 0.45); addWalker([x - f.tx * (hw - 2) + f.lx * o, B.top + 0.3, z - f.tz * (hw - 2) + f.lz * o], [x + f.tx * (hw - 2) + f.lx * o, B.top + 0.3, z + f.tz * (hw - 2) + f.lz * o], 0.6); }
      } else if (!plain && KR.chance(0.7)) { const a = KR.range(-hw + 3, hw - 3), fo = side > 0 ? 12.2 : -7.2; steamers.push([f.x + f.tx * a + f.lx * fo, EYE + KR.range(-9, 14), f.z + f.tz * a + f.lz * fo, 0.42]); }
      return B;
    };
    const faceAt = (B, a, y) => { const o = B.side > 0 ? 13 : -8; return [B.f.x + B.f.tx * a + B.f.lx * o, y, B.f.z + B.f.tz * a + B.f.lz * o]; };
    const strung = (a, b, sag, n = 2) => {            // a bundle of wires; in winter a string of red paper lanterns on the first
      const ph = KR() * 6;
      for (let j = 0; j < n; j++) swag(wires, [a[0], a[1] - j * 0.35, a[2]], [b[0], b[1] - j * 0.3, b[2]], sag * (1 + j * 0.12), 0.25, ph + j);
      if (season === 'winter') for (let j = 1; j < 7; j++) { const t = j / 7; lantern(lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)); }
    };
    const lowR = [KR.int(1, 2), KR.int(4, 5)], left = [], right = [];
    for (let i = 0; i < 7; i++) {
      const d = 131 + i * 31.2;
      left.push(await placeBlock(d + KR.range(-1, 1), 1, false, i % 3 === 1 ? 4 : 5)); await ctx.yield();
      right.push(await placeBlock(d + 5 + KR.range(-1, 1), -1, lowR.includes(i), i % 3 === 2 ? 4 : 5)); await ctx.yield();
      const A = left[i], Bk = right[i];
      if (!Bk.low) for (let j = 0; j < 2; j++) { const y = EYE + KR.range(9.5, 30); if (y < Math.min(A.top, Bk.top) - 2) strung(faceAt(A, KR.range(-8, 8), y), faceAt(Bk, KR.range(-8, 8), y + KR.range(-3, 3)), KR.range(1.2, 2.4)); }
      if (i > 0) for (const row of [left, right]) { const a = row[i - 1], b = row[i], y = Math.min(a.top, b.top) - KR.range(2, 20); if (y > EYE - 20) strung(faceAt(a, a.hw, y), faceAt(b, -b.hw, y - KR.range(0, 4)), KR.range(0.6, 1.4), 3); }
      if (i === 3) { groups.push(await kit.flush('thread-a', { lit })); await ctx.yield(); }
    }
    {   // the slim footbridge between the last pair, 7.5 m over the beam
      const f = frame(path, 322), y = EYE - BEAM_DROP + 7.5, m = kit.mark(), col = jit(mul(P.CONC, 0.95), 0.04, KR);
      G.box(0, 0.25, 0, 21.4, 0.5, 2.3, col, { aoB: 0.7 });
      for (const s of [1, -1]) { GB.quad([-10.7, 0.5, s * 1.1], [10.7, 0.5, s * 1.1], [10.7, 1.65, s * 1.1], [-10.7, 1.65, s * 1.1], [0.16, 0.2, 0.19], 1, 1, 1, 1, [0, 0, 21.4, 1.15]); K.box(0, 1.67, s * 1.1, 21.4, 0.07, 0.08, mul(P.JADE, 0.7), { mask: 1 | 2 | 4 | 8 | 16 | 32 }); }
      for (let x = -9; x <= 9; x += 3) kit.pot(KR, x + KR.range(-0.5, 0.5), 0.5, KR.sign() * 0.85, 0.6, KR.range(0.5, 0.9));
      if (season === 'winter') for (let x = -9.5; x <= 9.5; x += 1.9) lantern(x, 0.36, 1.2);
      kit.place(m, f.x + f.lx * 2.5, y, f.z + f.lz * 2.5, Math.atan2(-f.lz, f.lx));
      for (let j = 0; j < 5; j++) addWalker([f.x + f.lx * 12.5, y + 0.5, f.z + f.lz * 12.5], [f.x - f.lx * 7.5, y + 0.5, f.z - f.lz * 7.5], 1);
    }
    groups.push(await kit.flush('thread-b', { lit })); await ctx.yield();

    // ------------------------------------------------------------ low town: tiled roofs, stair-streets, the retaining wall with its storm drain, the last low blocks
    const tiles = [[0.3, 0.1, 0.07], [0.22, 0.11, 0.08], [0.15, 0.16, 0.17], [0.34, 0.17, 0.1], [0.12, 0.2, 0.2]];
    const HR = makeRng('mcl-house:' + ctx.seed), FRR = makeRng('mcl-framer:' + ctx.seed);     // (their own streams: the city's sequence KR is drawn exactly as before)
    const framer = (() => { const f = frame(path, 400), off = -58; return { f, x: f.x + f.lx * off, z: f.z + f.lz * off, nb: 4 }; })();     // a low roof-garden block outside the curve, where the right side opens
    const house = (x, z, yaw, w, dp, hh, R = KR, yAt, fz = 1) => {
      const y = yAt ?? (Math.hypot(x - framer.x, z - framer.z) < 24 ? -300 : groundAt(x, z)), m = kit.mark(), wall = jit(mixc(R.pick(P.tints), P.WHITE, 0.25), 0.1, R), tile = jit(R.pick(tiles), 0.14, R), rh = w * 0.27, o = 0.55;
      G.box(0, hh / 2 - 3, 0, w, hh + 6, dp, wall, { mask: 1 | 2 | 16 | 32, aoB: 0.7 });
      for (const s of [1, -1]) {
        for (let j = 0, nc = fz < 0 ? 5 : 3; j < nc; j++) { const ex = (t) => s * (w / 2 + o) * (1 - t), ey = (t) => hh - 0.2 + (rh + 0.2) * t, t0 = j / nc, t1 = (j + 1) / nc;
          Q(K, [ex(t0), ey(t0), dp / 2 + o], [ex(t0), ey(t0), -dp / 2 - o], [ex(t1), ey(t1), -dp / 2 - o], [ex(t1), ey(t1), dp / 2 + o], [s, 1, 0], tile, 0.7, 1.08); }
        Q(G, [-w / 2, hh, s * dp / 2], [w / 2, hh, s * dp / 2], [0, hh + rh, s * dp / 2], [-w / 2, hh, s * dp / 2], [0, 0, s], wall);
        kit.setFlip(s); GL.wallZ(-w / 4 - 0.5, -w / 4 + 0.5, Math.max(0.6, hh - 2.5), hh - 1.2, dp / 2 + 0.03, R.pick(P.glassCols)); if (R.chance(0.5)) GL.wallZ(w / 6, w / 6 + 0.9, 0.1, 2, dp / 2 + 0.03, mul(P.BAMBOO, 0.3));
      }
      kit.setFlip(1);
      for (const sx of [1, -1]) {       // the long walls under the eaves: a row of windows upstairs, a door or a shop shutter below, a lean-to or a tank beside
        const xw = sx * (w / 2 + 0.04), nw = dp > 6.6 ? 3 : 2, door = HR.chance(0.6), dz = HR.range(-dp / 2 + 1, dp / 2 - 1);
        for (let j = 0; j < nw; j++) { const zc = (j + 0.5) / nw * dp - dp / 2, gc = HR.pick(P.glassCols), y1 = Math.max(1.6, hh - 1.0);
          Q(GL, [xw, y1 - 1.15, zc - 0.6], [xw, y1 - 1.15, zc + 0.6], [xw, y1, zc + 0.6], [xw, y1, zc - 0.6], [sx, 0, 0], gc);
          if (R !== KR) Q(K, [xw - sx * 0.02, y1 - 1.27, zc - 0.74], [xw - sx * 0.02, y1 - 1.27, zc + 0.74], [xw - sx * 0.02, y1 + 0.12, zc + 0.74], [xw - sx * 0.02, y1 + 0.12, zc - 0.74], [sx, 0, 0], [0.2, 0.14, 0.1]);
          Q(K, [xw + sx * 0.02, y1 - 1.3, zc - 0.75], [xw + sx * 0.02, y1 - 1.3, zc + 0.75], [xw + sx * 0.18, y1 - 1.22, zc + 0.75], [xw + sx * 0.18, y1 - 1.22, zc - 0.75], [0, 1, 0], [0.5, 0.5, 0.47]); }
        if (door && hh > 4.4) Q(GL, [xw, 0, dz - 0.55], [xw, 0, dz + 0.55], [xw, 2.1, dz + 0.55], [xw, 2.1, dz - 0.55], [sx, 0, 0], mul(P.BAMBOO, 0.32));
        const r = HR();
        if (r < 0.3) {              // lean-to under a tin or tile roof
          const lw = HR.range(1.8, 2.6), ld = dp * HR.range(0.45, 0.75), lz = HR.range(-1, 1) * (dp - ld) / 2, lh = Math.min(2.6, hh - 1.4), tc = jit(HR.chance(0.5) ? [0.3, 0.33, 0.36] : tile, 0.1, HR);
          G.box(sx * (w / 2 + lw / 2), lh / 2 - 3, lz, lw, lh + 6, ld, mul(wall, 0.9), { mask: (sx > 0 ? 1 : 2) | 16 | 32, aoB: 0.7 });
          Q(K, [sx * (w / 2), lh + 0.75, lz - ld / 2 - 0.3], [sx * (w / 2), lh + 0.75, lz + ld / 2 + 0.3], [sx * (w / 2 + lw + 0.4), lh - 0.05, lz + ld / 2 + 0.3], [sx * (w / 2 + lw + 0.4), lh - 0.05, lz - ld / 2 - 0.3], [sx * 0.3, 1, 0], tc, 0.85, 1.05);
        } else if (r < 0.55) {      // a steel water tank on a stand
          const tz = HR.range(-dp / 2 + 1, dp / 2 - 1), tx = sx * (w / 2 + 0.95);
          K.box(tx, 0.2, tz, 1.3, 3.4, 1.3, [0.2, 0.2, 0.2], { mask: 1 | 2 | 16 | 32 });
          K.prism(tx, 1.9, tz, 0.72, 1.25, 8, jit([0.46, 0.5, 0.54], 0.08, HR), { cap: [0.36, 0.39, 0.42] });
        }
      }
      if (R !== KR) {     // a dark plinth and a chimney; a pole of washing under the eaves, an air conditioner, a door under a faded awning
        G.box(0, 0.35, 0, w + 0.16, 0.7, dp + 0.16, mul(wall, 0.52), { mask: 1 | 2 | 16 | 32 });
        K.box(R.sign() * w * 0.22, hh + rh * 0.8, R.range(-dp / 4, dp / 4), 0.5, 1.3, 0.5, [0.3, 0.27, 0.25], { mask: 1 | 2 | 4 | 16 | 32, aoB: 0.7 });
        const zf = fz * dp / 2, pc = [0.3, 0.2, 0.09], py = hh - 0.55, ac = R.sign() * w * 0.3, ax = -ac * 0.9, aw = jit(mul(R.pick(P.cloths), 0.75), 0.1, R);
        K.box(0, py, zf + fz * 0.85, w * 0.72, 0.06, 0.06, pc, { mask: 4 | 8 | 16 | 32 });
        for (const sx of [1, -1]) K.box(sx * w * 0.36, py, zf + fz * 0.43, 0.05, 0.05, 0.86, pc, { mask: 1 | 2 | 4 | 8 });
        for (let j = 0, n = R.int(2, 4); j < n; j++) kit.garment(R, (j + R.range(0.2, 0.8)) / n * w * 0.68 - w * 0.34, py - 0.04, zf + fz * 0.85, 0, true);
        K.box(ac, Math.min(2.3, hh - 1.6), zf + fz * 0.2, 0.84, 0.56, 0.38, jit([0.6, 0.6, 0.57], 0.08, R), { aoB: 0.8 });
        Q(K, [ax - 1.0, 2.7, zf + fz * 0.03], [ax + 1.0, 2.7, zf + fz * 0.03], [ax + 1.0, 2.25, zf + fz * 1.0], [ax - 1.0, 2.25, zf + fz * 1.0], [0, 1, fz * 0.3], aw, 1, 0.8);
        Q(K, [ax - 1.0, 2.7, zf + fz * 0.03], [ax + 1.0, 2.7, zf + fz * 0.03], [ax + 1.0, 2.25, zf + fz * 1.0], [ax - 1.0, 2.25, zf + fz * 1.0], [0, -1, -fz * 0.3], mul(aw, 0.5));
        Q(GL, [ax - 0.5, 0, zf + fz * 0.04], [ax + 0.5, 0, zf + fz * 0.04], [ax + 0.5, 2.05, zf + fz * 0.04], [ax - 0.5, 2.05, zf + fz * 0.04], [0, 0, fz], mul(P.BAMBOO, 0.32));
      }
      if (R.chance(0.5)) kit.pot(R, R.range(-w / 2, w / 2), 0, dp / 2 + 0.5, 1, R.range(1, 2.2));
      kit.place(m, x, y, z, yaw); keepOut.push([x, z, Math.max(w, dp) * 0.7]);
    };
    const clearOf = (x, z, r) => { for (const k of keepOut) if (Math.hypot(k[0] - x, k[1] - z) < k[2] + r) return false; return true; };
    for (const gi of [lowR[0], lowR[1]]) {            // two stair-streets zigzag down from the low blocks toward the river road
      const B = right[gi], f = B.f; let px = B.x - f.lx * 12 + f.tx * (B.hw + 4), pz = B.z - f.lz * 12 + f.tz * (B.hw + 4), py = groundAt(px, pz) + 0.3;
      for (let j = 0; j < 6; j++) {
        const zig = j % 2 ? -1 : 1, qx = px - f.lx * 15 + f.tx * zig * 8, qz = pz - f.lz * 15 + f.tz * zig * 8, qy = groundAt(qx, qz) + 0.3;
        const l = Math.hypot(qx - px, qz - pz), nx = (qz - pz) / l * 1.4, nz = -(qx - px) / l * 1.4, c = jit(mul(P.CONC, 1.05), 0.06, KR);
        Q(G, [px + nx, py, pz + nz], [px - nx, py, pz - nz], [qx - nx, qy, qz - nz], [qx + nx, qy, qz + nz], UP, c, 1, 0.82);
        for (const s of [1, -1]) Q(G, [px + s * nx, py - 3, pz + s * nz], [qx + s * nx, qy - 3, qz + s * nz], [qx + s * nx, qy + 0.5, qz + s * nz], [px + s * nx, py + 0.5, pz + s * nz], [s * nx, 0, s * nz], mul(c, 0.8), 0.6, 1);
        for (let k = 0; k < Math.round(3 * dens); k++) addWalker([px, py, pz], [qx, qy, qz], 0.8);
        for (const s of [1, -1]) if (KR.chance(0.8)) { const t = KR.range(0.25, 0.75), hx = lerp(px, qx, t) + s * nx * 5, hz = lerp(pz, qz, t) + s * nz * 5; if (clearOf(hx, hz, 4) && groundAt(hx, hz) > 5) house(hx, hz, Math.atan2(nx * s, nz * s), KR.range(6, 8.5), KR.range(5.5, 7.5), KR.range(4.5, 7.5)); }
        px = qx; pz = qz; py = qy;
      }
      await ctx.yield();
    }
    for (let i = 0, tries = 0; i < Math.round(70 * dens) && tries < 900; tries++) {        // tiled roofs scattered on the slopes below the line
      const d = KR.range(60, PL - 70), f = frame(path, d), off = KR.sign() * KR.range(16, 110), x = f.x + f.lx * off, z = f.z + f.lz * off, h = groundAt(x, z);
      if (h < 6 || h > f.y - 9 || !clearOf(x, z, 6) || Math.hypot(x - GC[0], z - GC[1]) < 150 || Math.abs(groundAt(x + 4, z) - groundAt(x - 4, z)) + Math.abs(groundAt(x, z + 4) - groundAt(x, z - 4)) > 9) continue;
      house(x, z, Math.atan2(f.lx, f.lz) + KR.range(-0.3, 0.3), KR.range(6, 10), KR.range(5.5, 8), KR.range(4, 8)); i++;
      if ((i & 3) === 0) await ctx.yield();
    }
    await ctx.yield();
    const pigeonBlock = await placeBlock(PL - 46, -1, true, 3); await ctx.yield();
    const lowLeft = await placeBlock(PL - 96, 1, true, 4, 22); await ctx.yield();
    for (const [d, o, nb] of [[394, 31, 5], [428, 34, 4], [461, 38, 5]]) { await placeBlock(d, 1, false, nb, o, true); await ctx.yield(); }        // three more slabs carry the left wall on as the right side opens
    {   // the roof-garden block 58 m outside the start of the curve: its roof lies ten metres under the eye, so the cab looks across it to the rivers
      const f = framer.f, hw = framer.nb * 2.5, x = framer.x, z = framer.z, yaw = Math.atan2(f.lx, f.lz);
      let base = 1e9; for (const [ax, az] of [[-hw, -8], [hw, -8], [-hw, 8], [hw, 8], [0, 0]]) base = Math.min(base, groundAt(x + ax * f.tx + az * f.lx, z + ax * f.tz + az * f.lz));
      base = Math.round(base + 2.5);
      const ns = Math.max(5, Math.round((EYE - 10.5 - base) / 3.4)), top = base + ns * 3.4, m = kit.mark();
      await kit.towerAsync(FRR, { nb: framer.nb, ns, core: 1, skirt: 30, sheets: true, hut: true, gableRng: FRR, dressRng: FRR,
        gable: (sd, k) => (top - (base + k * 3.4) < 11 ? 2 : top - (base + k * 3.4) < 28 ? 0 : -1), gableDress: (sd, k) => top - (base + k * 3.4) < 14,
        level: (b, k) => (top - (base + k * 3.4) < 10.5 ? 2 : top - (base + k * 3.4) < 26 ? 1 : 0) }, ctx.yield);
      kit.place(m, x, base, z, yaw); keepOut.push([x, z, Math.hypot(hw, 8) + 5]);
      blocks.push({ x, z, r: Math.hypot(hw, 8) + 3, top, base, d: 400, side: -1, f, hw, low: true });
      for (let j = 0; j < 2; j++) steamers.push([x + f.tx * FRR.range(-hw + 2, hw - 2) + f.lx * FRR.range(-4, 4), top + 2.6, z + f.tz * FRR.range(-hw + 2, hw - 2) + f.lz * FRR.range(-4, 4), FRR.range(0.5, 0.8)]);
      for (let j = 0; j < Math.round(5 * dens); j++) { const o = FRR.range(-5.5, 5.5), c = FRR.pick(P.cloths), a = [x - f.tx * (hw - 2) + f.lx * o, top + 0.3, z - f.tz * (hw - 2) + f.lz * o], b = [x + f.tx * (hw - 2) + f.lx * o, top + 0.3, z + f.tz * (hw - 2) + f.lz * o];
        walkers.push({ a, b, ph: FRR() * 4, sp: 0.6 * FRR.range(0.7, 1.3) / (4 * hw), c: [c[0] * 1.15, c[1] * 1.15, c[2] * 1.15], um: FRR.chance(L.parasol) }); }
      await ctx.yield();
    }
    const drain = (() => {     // retaining wall 15 m left of the curve's end, with the storm-drain outlet that feeds a waterfall
      const f = frame(path, 648), x = f.x + f.lx * 17.5, z = f.z + f.lz * 17.5, g0 = groundAt(f.x + f.lx * 12, f.z + f.lz * 12), top = f.y - 4, m = kit.mark(), c = jit(mul(P.CONC, 0.5), 0.05, KR);
      G.box(0, (top + g0 - 8) / 2 - top, 0, 44, top - g0 + 8, 3, c, { mask: 1 | 2 | 4 | 16 | 32, aoB: 0.75, taper: 0.94 });
      for (let i = -3; i <= 3; i++) G.box(i * 6.2, (top + g0 - 8) / 2 - top - 1, 1.7, 1.2, top - g0 + 6, 1.2, mul(c, 0.92), { mask: 1 | 2 | 16, taper: 0.6 });
      K.box(2, -2.2, 1.56, 2.6, 2.2, 0.3, [0.02, 0.025, 0.03], { mask: 16 }); G.box(2, -3.5, 1.9, 3.4, 0.4, 1, mul(c, 0.8));
      for (let i = 0; i < 5; i++) { let x0 = KR.range(-21, 15); const w = 1.2 + (KR.range(3, 8) - 3) * 0.26, len = KR.range(4, 13) - 1; if (x0 + w > -1.5 && x0 < 5.5) x0 += x0 < 2 ? -7 : 7; kit.creeper(KR, x0, x0 + w, 0.6, len, 1.6, 0.3, 1.5); }
      for (let i = 0; i < 3; i++) { const z0 = -1.9 + i * 1.1, len = GR.range(7, 15); kit.plantQuad(-22.3 - i * 0.12, z0, -22.5 - i * 0.12, z0 + GR.range(1.8, 2.6) * 0.5, 0.9 - len * (i === 1 ? 0.45 : 0.75), 0.9, z0 * 0.3, (z0 + 2.2) * 0.3, GR(), 1, -0.03 * len, mul(kit.leafCol(GR), 0.75), 0.6); }
      for (let i = 0; i < 2; i++) kit.creeper(GR, -20.5 + i * 8.5, -18.6 + i * 9, 0.7, GR.range(6, 12) * (i ? 0.55 : 1), 1.62, 0.3, 1.4);
      kit.place(m, x, top, z, Math.atan2(-f.lx, -f.lz)); keepOut.push([x, z, 24]);
      return { top: [x - f.lx * 2.3 + f.tx * 2, top - 3.2, z - f.lz * 2.3 + f.tz * 2], height: Math.max(8, top - 3.2 - g0), dir: [-f.lx, 0, -f.lz] };
    })();
    groups.push(await kit.flush('lowtown', { lit })); await ctx.yield();

    // ------------------------------------------------------------ the slopes beside the long curve and the last straight: terraces of beds behind stone walls,
    // rows of small houses standing on them, stair-streets with walkers. Its own group and its own random stream (the city's sequence KR is drawn as before).
    const NR = makeRng('mcl-near:' + ctx.seed), nearLow = T.pathNearest(lowPath);
    {
      const stone = mul(P.CONC, 0.66), crops = [[0.05, 0.13, 0.045], [0.16, 0.19, 0.05], [0.15, 0.1, 0.065], [0.08, 0.16, 0.07], [0.045, 0.1, 0.05]], lip = [0.3, 0.29, 0.25];
      const stairs = [[600, 9.5, 31], [781, 9.5, 31], [727, -13, -104], [690, -13, -70]], rows = [];      // stairs: [path distance, from offset, to offset]
      const free = (d, x, z) => { for (const st of stairs) if (Math.abs(d - st[0]) < 2.6) return false; return clearOf(x, z, 1.2) && !(Math.abs(x) < 116 && z < 52) && nearLow(x, z).dist > 7.5; };
      const walk = (a, b, speed) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1, c = NR.chance(0.25) ? [0.7, 0.7, 0.68] : NR.pick(P.cloths);
        walkers.push({ a, b, ph: NR() * 4, sp: speed * NR.range(0.7, 1.3) / (2 * len), c: [c[0] * 1.15, c[1] * 1.15, c[2] * 1.15], um: NR.chance(L.parasol) }); };
      // one terrace: a wall whose foot stands `o` m left of the line (negative: right), holding a level strip `run` m deep on its uphill side (toward +left on both banks)
      const terrace = async (d0, d1, o, run, homes) => {
        let prev = null, patch = 0, col = crops[0], hd = d0 + NR.range(3, 9);
        const cap = (c, sgn) => Q(G, c.F, c.Ft, c.B, c.F, [sgn * c.f.tx, 0, sgn * c.f.tz], mul(stone, 0.85), 0.7, 1);
        for (let d = d0, i = 0; d <= d1; d += 4, i++) {
          const f = frame(path, d), fx = f.x + f.lx * o, fz = f.z + f.lz * o, bx = f.x + f.lx * (o + run), bz = f.z + f.lz * (o + run), g = groundAt(fx, fz), top = groundAt(bx, bz) + 0.12;
          const ok = top - g > 1.1 && top - g < 8.5 && g > 7.5 && top < f.y - 1.5 && free(d, fx, fz) && free(d, bx, bz);
          const cur = ok ? { F: [fx, g - 1.2, fz], Ft: [fx, top, fz], B: [bx, top, bz], f, top } : null;
          if (cur && !prev) cap(cur, -1);
          if (!cur && prev) cap(prev, 1);
          if (cur && prev) {
            if (patch-- <= 0) { patch = NR.int(2, 5); col = jit(NR.pick(crops), 0.12, NR); }
            Q(G, prev.F, cur.F, cur.Ft, prev.Ft, [-f.lx, 0, -f.lz], jit(stone, 0.05, NR), 0.62, 1);
            Q(K, prev.Ft, cur.Ft, cur.B, prev.B, UP, col, 1.12, 0.88);
            const lp = (c) => [c.Ft[0] + c.f.lx * 0.4, c.top + 0.03, c.Ft[2] + c.f.lz * 0.4], lq = (c) => [c.Ft[0], c.top + 0.03, c.Ft[2]];
            Q(K, lq(prev), lq(cur), lp(cur), lp(prev), UP, lip);                                             // the pale bund along the lip
            if (homes && d >= hd) { rows.push([f.x + f.lx * (o + run * 0.52), f.z + f.lz * (o + run * 0.52), Math.atan2(f.lx, f.lz), top, run]); hd = d + NR.range(9, 16); }
            else if (NR.chance(0.07 * dens)) { const m = (c, k) => [lerp(c.Ft[0], c.B[0], k), c.top + 0.05, lerp(c.Ft[2], c.B[2], k)], k = NR.range(0.35, 0.7); walk(m(prev, k), m(cur, k), 0.25); }
          }
          prev = cur;
          if ((i & 15) === 15) await ctx.yield();
        }
        if (prev) cap(prev, 1);
      };
      await terrace(472, 804, 11.5, 3.5, false); await terrace(472, 804, 15.2, 7.2, true); await terrace(472, 804, 22.6, 3.5, false);
      await ctx.yield();
      for (let k = 0; k < 9; k++) { await terrace(596, 838, -24.6 - 8.8 * k, 8.6, k % 2 === 1 || k === 4); await ctx.yield(); }
      for (const [d, o0, o1] of stairs) {             // stair-streets straight up the fall of the slope, in the gaps the terraces leave for them
        const f = frame(path, d), n = Math.max(3, Math.round(Math.abs(o1 - o0) / 5)), c = jit(mul(P.CONC, 1.05), 0.06, NR), e = (q, sd, dy) => [q[0] + f.tx * 1.2 * sd, q[1] + dy, q[2] + f.tz * 1.2 * sd]; let a = null;
        for (let i = 0; i <= n; i++) {
          const o = lerp(o0, o1, i / n), x = f.x + f.lx * o, z = f.z + f.lz * o, y = groundAt(x, z) + 0.35, b = [x, y, z];
          if (y < 7 || y > f.y - 1 || nearLow(x, z).dist < 6 || (Math.abs(x) < 116 && z < 52)) break;
          if (a) {
            Q(G, e(a, 1, 0), e(a, -1, 0), e(b, -1, 0), e(b, 1, 0), UP, c, i % 2 ? 1 : 0.8, i % 2 ? 0.8 : 1);
            for (const sd of [1, -1]) Q(G, e(a, sd, -2.5), e(b, sd, -2.5), e(b, sd, 0.45), e(a, sd, 0.45), [sd * f.tx, 0, sd * f.tz], mul(c, 0.8), 0.6, 1);
            for (let k = 0; k < Math.round(2 * dens); k++) walk([a[0], a[1], a[2]], [b[0], b[1], b[2]], 0.8);
          }
          a = b;
        }
      }
      await ctx.yield();
      for (let i = 0; i < rows.length; i++) {         // the houses, once every terrace is laid (each one keeps trees and later houses off its plot)
        const [x, z, yaw, top, run] = rows[i], small = run < 8, w = small ? NR.range(4.8, 6.4) : NR.range(6, 8.5), dp = small ? NR.range(4.4, 5.4) : NR.range(5.4, 6.6), hh = small ? NR.range(3.0, 4.0) : NR.range(4.4, 7.2);
        if (clearOf(x, z, 4.2)) house(x, z, yaw, w, dp, hh, NR, top, small ? -1 : 1);
        if ((i & 3) === 3) await ctx.yield();
      }
    }
    const slopes = await kit.flush('slopes', { lit }); groups.push(slopes); await ctx.yield();

    // ------------------------------------------------------------ the line itself: twin beams swept along the camera path, walkway, cable tray, T-piers to the ground
    const beamCol = mul(P.MIST, 0.6), wetCol = mul(P.MIST, 0.24), edgeCol = [0.3, 0.31, 0.32], railCol = mul(P.JADE, 0.55);
    const sweepBeam = async (pth, d0, d1, offs, drop, walk) => {
      const n = Math.ceil((d1 - d0) / 4); let prev = null;
      for (let i = 0; i <= n; i++) {
        const dNow = lerp(d0, d1, i / n), f = frame(pth, dNow), cur = { f, y: f.y - drop };
        if (prev) for (const off of offs) {
          const pt = (c, o, dy) => [c.f.x + c.f.lx * (off + o), c.y + dy, c.f.z + c.f.lz * (off + o)], a = prev, b = cur, sd = [b.f.lx, 0, b.f.lz], sr = [-b.f.lx, 0, -b.f.lz];
          Q(G, pt(a, 0.425, 0), pt(a, -0.425, 0), pt(b, -0.425, 0), pt(b, 0.425, 0), UP, beamCol);
          Q(G, pt(a, 0.425, -1.5), pt(a, -0.425, -1.5), pt(b, -0.425, -1.5), pt(b, 0.425, -1.5), DOWN, beamCol, 0.5, 0.5);
          Q(G, pt(a, 0.425, -1.5), pt(b, 0.425, -1.5), pt(b, 0.425, 0), pt(a, 0.425, 0), sd, beamCol, 0.78, 1);
          Q(G, pt(a, -0.425, -1.5), pt(b, -0.425, -1.5), pt(b, -0.425, 0), pt(a, -0.425, 0), sr, beamCol, 0.78, 1);
          Q(K, pt(a, 0.17, 0.014), pt(a, -0.17, 0.014), pt(b, -0.17, 0.014), pt(b, 0.17, 0.014), UP, wetCol);                    // wet running stripe
          Q(K, pt(a, -0.5, -1.02), pt(b, -0.5, -1.02), pt(b, -0.5, -0.86), pt(a, -0.5, -0.86), sr, [0.2, 0.11, 0.06]);            // power rail
          if (i % 8 === 0) Q(K, pt(b, 0.43, -1.5), pt(b, 0.43, 0.005), pt(b, -0.43, 0.005), pt(b, -0.43, -1.5), [-b.f.tx, 0.3, -b.f.tz], mul(beamCol, 0.3));   // joint
          if (walk && dNow > -30) {       // the dressed guideway: steel edge angles, a conduit over the power rail, and every 8 m an expansion joint, a seam and an insulator plate
            for (const sg of [1, -1]) Q(K, pt(a, sg * 0.425, 0.012), pt(a, sg * 0.345, 0.012), pt(b, sg * 0.345, 0.012), pt(b, sg * 0.425, 0.012), UP, edgeCol);
            Q(K, pt(a, -0.47, -0.54), pt(b, -0.47, -0.54), pt(b, -0.47, -0.4), pt(a, -0.47, -0.4), sr, [0.4, 0.41, 0.39]);
            if (i % 2 === 0) {
              const pj = (o, dy, dt) => [b.f.x + b.f.lx * (off + o) + b.f.tx * dt, b.y + dy, b.f.z + b.f.lz * (off + o) + b.f.tz * dt];
              Q(K, pj(0.43, 0.02, -0.07), pj(-0.43, 0.02, -0.07), pj(-0.43, 0.02, 0.07), pj(0.43, 0.02, 0.07), UP, mul(beamCol, 0.26));
              Q(K, pj(-0.44, -1.5, -0.05), pj(-0.44, -1.5, 0.05), pj(-0.44, 0, 0.05), pj(-0.44, 0, -0.05), sr, mul(beamCol, 0.34));
              Q(K, pj(-0.53, -1.14, -0.13), pj(-0.53, -1.14, 0.13), pj(-0.53, -0.76, 0.13), pj(-0.53, -0.76, -0.13), sr, [0.5, 0.5, 0.46]);
            }
          }
        }
        if (prev && walk) {
          const a = prev, b = cur, w = (c, o, dy) => [c.f.x + c.f.lx * o, c.y + dy, c.f.z + c.f.lz * o], dd = (i / n) * (d1 - d0);
          GB.quad(w(a, 0.75, -0.6), w(a, TWIN - 0.75, -0.6), w(b, TWIN - 0.75, -0.6), w(b, 0.75, -0.6), [0.3, 0.31, 0.32], 1, 1, 1, 1, [0, dd * 3, 8.7, dd * 3 + 12]);
          Q(K, w(a, TWIN / 2 - 0.25, -1.0), w(a, TWIN / 2 + 0.25, -1.0), w(b, TWIN / 2 + 0.25, -1.0), w(b, TWIN / 2 - 0.25, -1.0), UP, [0.1, 0.1, 0.11]);
          if (dNow > -30) {               // a handrail down each side of the walkway, and a cross-bearer under the mesh every 4 m
            for (const o of [1.62, 2.78]) {
              GB.quad(w(a, o, -0.6), w(b, o, -0.6), w(b, o, 0.5), w(a, o, 0.5), [0.2, 0.24, 0.23], 1, 1, 1, 1, [dd - 4, 0, dd, 1.1]);
              Q(K, w(a, o - 0.05, 0.51), w(a, o + 0.05, 0.51), w(b, o + 0.05, 0.51), w(b, o - 0.05, 0.51), UP, railCol);
            }
            const wj = (o, dt) => [b.f.x + b.f.lx * o + b.f.tx * dt, b.y - 0.66, b.f.z + b.f.lz * o + b.f.tz * dt];
            Q(K, wj(0.43, -0.14), wj(TWIN - 0.43, -0.14), wj(TWIN - 0.43, 0.14), wj(0.43, 0.14), UP, [0.15, 0.15, 0.16]);
          }
        }
        prev = cur;
        if ((i & 31) === 31) await ctx.yield();
      }
    };
    const pier = (pth, d, cx, drop, wide, base, R = KR) => {
      const f = frame(pth, d), x = f.x + f.lx * cx, z = f.z + f.lz * cx, top = f.y - drop - 1.5, ry = Math.atan2(-f.lz, f.lx), g0 = base ?? groundAt(x, z) - 2, pc = jit(mul(P.MIST, 0.55), 0.05, R);
      if (top - g0 < 1.5) return;
      G.box(x, top - 0.55, z, wide, 1.1, 1.8, pc, { ry, aoB: 0.85 });
      G.box(x, top - 1.9, z, 2.5, 1.6, 1.5, pc, { ry, taper: Math.max(1, wide / 3.9), mask: 1 | 2 | 16 | 32, aoB: 0.85 });
      if (top - 2.7 > g0) G.box(x, (top - 2.7 + g0) / 2, z, 2.5, top - 2.7 - g0, 1.5, pc, { ry, mask: 1 | 2 | 16 | 32, aoB: 0.55 });
      if (base === undefined && KR.chance(0.3)) { const m = kit.mark(), w = KR.range(1.2, 2.4), len = Math.min(top - g0 - 4, KR.range(6, 22)); if (len > 3) { kit.creeper(KR, -w / 2, w / 2, 0, len, 0.78, 0.5, 0.2); kit.place(m, x, g0 + 2 + len + KR.range(0, 4), z, ry + (KR.chance(0.5) ? Math.PI : 0)); } }
    };
    // (the beam starts 240 m back, inside the cliff, so the camera that previews this world through the last portal always has line under and behind it)
    await sweepBeam(path, -240, PL, [0, TWIN], BEAM_DROP, true);
    {   // on the walkway between the beams: a signal every 90 m (one green aspect toward the cab) and between them a lamp on a short post, lit in the evening, in fog and in rain
      const lampLit = lookId !== 'washed', grey = [0.34, 0.35, 0.35], dark = [0.045, 0.05, 0.055];
      for (let d = 24, i = 0; d < PL - 34; d += 30, i++) {
        const f = frame(path, d), x = f.x + f.lx * 2.2, z = f.z + f.lz * 2.2, y0 = f.y - BEAM_DROP - 0.6, ry = Math.atan2(-f.lz, f.lx);
        const face = (cy, hw, hh, back, col) => { const cx = x - f.tx * back, cz = z - f.tz * back;
          Q(GL, [cx - f.lx * hw, cy - hh, cz - f.lz * hw], [cx + f.lx * hw, cy - hh, cz + f.lz * hw], [cx + f.lx * hw, cy + hh, cz + f.lz * hw], [cx - f.lx * hw, cy + hh, cz - f.lz * hw], [-f.tx, 0, -f.tz], col); };
        if (i % 3 === 1) {
          K.box(x, y0 + 0.6, z, 0.1, 1.2, 0.1, grey, { ry, mask: 1 | 2 | 16 | 32 });
          K.box(x, y0 + 1.5, z, 0.34, 0.7, 0.2, dark, { ry });
          K.box(x, y0 + 1.88, z, 0.42, 0.05, 0.4, dark, { ry, mask: 4 | 8 | 16 | 32 });
          face(y0 + 1.66, 0.09, 0.09, 0.11, [1.35, 3.6, 2.0]); face(y0 + 1.36, 0.09, 0.09, 0.11, [0.16, 0.03, 0.02]);
          K.box(x, y0 + 0.9, z, 0.26, 0.3, 0.05, [0.62, 0.55, 0.12], { ry, mask: 16 | 32 });
        } else {
          K.box(x, y0 + 0.7, z, 0.07, 1.4, 0.07, grey, { ry, mask: 1 | 2 | 16 | 32 });
          K.box(x, y0 + 1.46, z, 0.3, 0.12, 0.3, lampLit ? dark : [0.5, 0.5, 0.46], { ry, mask: 1 | 2 | 4 | 16 | 32 });
          if (lampLit) face(y0 + 1.33, 0.12, 0.07, 0.151, [2.6, 1.7, 0.7]);
        }
      }
    }
    let dPier = PL - 5;
    for (; dPier > -50; dPier -= 30) pier(path, dPier, TWIN / 2, BEAM_DROP, 7.4, dPier > PL - 8 ? HY + 17 : (dPier > PL - 26 ? HY : undefined));
    for (; dPier > -232; dPier -= 30) pier(path, dPier, TWIN / 2, BEAM_DROP, 7.4, EYE - 34, GR);
    await ctx.yield();
    {   // the tunnel mouth 20 m behind the entry: a dark concrete ring round both beams
      const f = frame(path, -21.5), ry = Math.atan2(-f.lz, f.lx), cl = TWIN / 2, RI = 5.2, ys = EYE + 1.6, yb = EYE - BEAM_DROP - 4.5, tc = mul(P.CONC, 0.2);
      const at = (o, y, sx, sy, rz) => G.box(f.x + f.lx * o, y, f.z + f.lz * o, sx, sy, 3, tc, { ry, rz, aoB: 0.8 });
      for (const sd of [1, -1]) at(cl + sd * (RI + 0.45), (ys + yb) / 2, 0.9, ys - yb, 0);
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI, r = RI + 0.45; at(cl + Math.cos(a) * r, ys + Math.sin(a) * r, 2 * r * Math.tan(Math.PI / 16) + 0.12, 0.9, a + Math.PI / 2); }
    }
    await sweepBeam(lowPath, 0, lowPath.length, [0], 0, false);
    for (let d = 16; d < lowPath.length; d += 30) pier(lowPath, d, 0, 0, 3.2);
    groups.push(await kit.flush('line')); await ctx.yield();

    // ------------------------------------------------------------ the gorge: spiral interchange, riverside road, viaducts, the red arch, the cableway
    let laneN = 0; const tracks = [], asphalt = [0.09, 0.095, 0.1], laneCol = [0.4, 0.4, 0.36], parap = mul(P.CONC, 1.1), IC = [70, 388];
    const deckSeg = (a, b, w, col, struts) => {
      const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l, h = w / 2;
      const p = (c, s, dy) => [c[0] + nx * s, c[1] + dy, c[2] + nz * s];
      Q(K, p(a, h, 0), p(a, -h, 0), p(b, -h, 0), p(b, h, 0), UP, asphalt);
      for (const s of [1, -1]) Q(K, p(a, s * (h - 0.9), 0.08), p(a, s * (h - 1.35), 0.08), p(b, s * (h - 1.35), 0.08), p(b, s * (h - 0.9), 0.08), UP, laneCol);
      if (laneN++ % 2) Q(K, p(a, 0.2, 0.08), p(a, -0.2, 0.08), p(b, -0.2, 0.08), p(b, 0.2, 0.08), UP, laneCol);
      Q(G, p(a, h, -1.3), p(a, -h, -1.3), p(b, -h, -1.3), p(b, h, -1.3), DOWN, col, 0.45, 0.45);
      for (const s of [1, -1]) {
        Q(G, p(a, s * h, -1.3), p(b, s * h, -1.3), p(b, s * h, 0.95), p(a, s * h, 0.95), [s * nx, 0, s * nz], col, 0.7, 1);
        Q(G, p(a, s * (h - 0.3), 0), p(b, s * (h - 0.3), 0), p(b, s * (h - 0.3), 0.95), p(a, s * (h - 0.3), 0.95), [-s * nx, 0, -s * nz], col, 0.6, 0.9);
      }
      if (struts) { const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, my = (a[1] + b[1]) / 2 - 1.3, g0 = groundAt(mx, mz) - 1; if (my - g0 > 3) G.box(mx, (my + g0) / 2, mz, 1.7, my - g0, 1.7, mul(P.MIST, 0.52), { mask: 1 | 2 | 16 | 32, aoB: 0.6, ry: Math.atan2(-nz, nx) }); }
    };
    const deckArc = (cx, cz, R, th0, th1, y0, y1, w = 11) => {
      const len = Math.abs(th1 - th0) * R, n = Math.max(6, Math.round(len / 9)); let a = null;
      for (let i = 0; i <= n; i++) { const t = i / n, th = lerp(th0, th1, t), b = [cx + Math.cos(th) * R, lerp(y0, y1, t), cz + Math.sin(th) * R]; if (a) deckSeg(a, b, w, parap, i % 3 === 0); a = b; }
      tracks.push({ arc: [cx, cz, R, th0, th1], y0, y1, len });
    };
    const deckLine = (x0, z0, x1, z1, y0, y1, w = 11, struts = true, slow = 1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(len / 18)); let a = null;
      for (let i = 0; i <= n; i++) { const t = i / n, b = [lerp(x0, x1, t), lerp(y0, y1, t), lerp(z0, z1, t)]; if (a) deckSeg(a, b, w, parap, struts && i % 2 === 0); a = b; }
      tracks.push({ line: [x0, z0, x1, z1], y0, y1, len, slow });
    };
    deckArc(IC[0], IC[1], 58, 0.4, 0.4 + TAU * 2, 10.5, 30); await ctx.yield();                               // the spiral ramp: two full turns
    deckArc(IC[0], IC[1], 88, 0, TAU, 25, 25); await ctx.yield();                                             // the ring
    deckArc(IC[0], IC[1], 116, 1.9, 1.9 + TAU * 0.82, 30.5, 12); await ctx.yield();                             // the long outer ramp coming down
    deckLine(-300, bankS(-300) - 30, -40, 452, 11, 34, 11, true); deckLine(-40, 452, 185, 296, 34, 34, 11, true);   // the flyover over the top of it all
    deckLine(185, 296, 148, -20, 34, 46, 10, true);                                          // viaduct up the jade bank to the arch
    { const x0 = -820, x1 = 250; deckLine(x0, bankS(x0) - 24, x1, bankS(x1) - 24, 8.2, 8.2, 10, false); }   // the riverside road on its embankment
    await ctx.yield();
    const AZ = -52, AX0 = 140, AX1 = 478, deckY = 46, red = lin(PALETTE[5]);
    deckLine(AX0 - 60, AZ, AX1 + 90, AZ, deckY, deckY, 15, false, 0.8);
    {   // the red steel arch: two ribs, bracing, hangers above the deck and spandrel posts below it
      const N = 24, ay = (t) => 7 + 83 * (1 - (2 * t - 1) * (2 * t - 1)); let px = AX0, py = ay(0);
      for (let i = 1; i <= N; i++) {
        const t = i / N, x = lerp(AX0, AX1, t), y = ay(t), len = Math.hypot(x - px, y - py), c = jit(red, 0.07, KR);
        for (const s of [1, -1]) {
          K.box((x + px) / 2, (y + py) / 2, AZ + s * 8.6, len + 0.6, 3.0, 2.2, c, { rz: Math.atan2(y - py, x - px), aoB: 0.8 });
          if (i < N && Math.abs(y - deckY) > 3) K.box(x, (y + deckY) / 2 + (y > deckY ? 0.7 : -0.7), AZ + s * 8.6, 1.0, Math.abs(y - deckY) - 1.4, 1.0, mul(c, 0.9), { mask: 1 | 2 | 16 | 32 });
        }
        if (i < N && Math.abs(y - deckY) > 6) K.box(x, y, AZ, 1.3, 1.3, 17.2, mul(c, 0.85), { mask: 1 | 2 | 4 | 8 });
        if (i < N && y > deckY + 16) K.box((x + px) / 2, (y + py) / 2, AZ, 1.0, 1.0, Math.hypot(len, 17.2), mul(c, 0.8), { ry: Math.atan2(len, 17.2) * (i % 2 ? 1 : -1), mask: 1 | 2 | 4 | 8 });
        px = x; py = y;
      }
      for (const s of [1, -1]) K.box((AX0 + AX1) / 2, deckY - 0.5, AZ + s * 7.7, AX1 - AX0, 2.4, 0.5, mul(red, 0.9), { mask: 4 | 8 | 16 | 32 });
      for (const x of [AX0 - 16, AX1 + 12]) G.box(x, 14, AZ, 16, 44, 26, mul(P.CONC, 0.95), { mask: 1 | 2 | 16 | 32, aoB: 0.7, taper: 0.8 });
    }
    await ctx.yield();
    const CW = { a: [212, 78, 452], b: [330, 96, 1100], sag: 34 };                           // cableway over the brown river: two masts and their cables
    for (const p of [CW.a, CW.b]) { const g0 = groundAt(p[0], p[2]) - 2; K.box(p[0], (p[1] + g0) / 2, p[2], 3.2, p[1] - g0, 3.2, [0.52, 0.53, 0.52], { taper: 0.5, aoB: 0.7 }); K.box(p[0], p[1] + 0.6, p[2], 12, 1.2, 2, [0.52, 0.53, 0.52]); }
    const cwSegs = []; for (const s of [-4, 4]) swag(cwSegs, [CW.a[0] + s, CW.a[1], CW.a[2]], [CW.b[0] + s, CW.b[1], CW.b[2]], CW.sag, 0.15, s, 12);
    // the east bank: a road on stilts along the water, a second cableway over the jade river, and a cable-stayed bridge far down the brown river
    const OR = makeRng('mcl-open:' + ctx.seed), ERD = [[386, -170], [386, 100], [eastJ(190) + 16, 190], [eastJ(280) + 16, 280], [528, 368], [1010, 536]];
    for (let i = 0; i + 1 < ERD.length; i++) { deckLine(ERD[i][0], ERD[i][1], ERD[i + 1][0], ERD[i + 1][1], 24, 24, 10, true); await ctx.yield(); }
    const CW2 = { a: [215, 64, 236], b: [472, 86, 236], sag: 9 }, mastC = [0.52, 0.53, 0.52];
    for (const p of [CW2.a, CW2.b]) { const g0 = Math.min(groundAt(p[0], p[2]), 0) - 4; K.box(p[0], (p[1] + g0) / 2, p[2], 3, p[1] - g0, 3, mastC, { taper: 0.5, aoB: 0.7 }); K.box(p[0], p[1] + 0.6, p[2], 2, 1.2, 10, mastC); }
    for (const s of [-3, 3]) swag(cwSegs, [CW2.a[0], CW2.a[1], CW2.a[2] + s], [CW2.b[0], CW2.b[1], CW2.b[2] + s], CW2.sag, 0.12, s + 9, 10);
    const BX = 700, BZ0 = 438, BZ1 = 1004, BDY = 40;
    deckLine(BX, BZ0, BX, BZ1, BDY, BDY, 14, false, 0.9);
    for (const z of [BZ0 + 2, BZ1 + 5]) G.box(BX, 16, z, 20, 50, 12, mul(P.CONC, 0.95), { mask: 1 | 2 | 16 | 32, aoB: 0.7, taper: 0.85 });
    for (const pz of [600, 850]) {
      const pc = jit([0.6, 0.6, 0.57], 0.03, OR);
      for (const sx of [1, -1]) {
        K.box(BX + sx * 10, 58, pz, 4.4, 136, 6, pc, { mask: 1 | 2 | 16 | 32, taper: 0.62, aoB: 0.6 });
        for (let i = 0; i < 7; i++) for (const sz of [1, -1]) cwSegs.push([BX + sx * 8.2, 122 - i * 7, pz, BX + sx * 7.2, BDY + 1, pz + sz * (22 + i * 17), 0, 0, 0]);
      }
      K.box(BX, 118, pz, 15, 4, 4.4, pc); K.box(BX, BDY - 4, pz, 22, 3.4, 4.6, pc);
    }
    await ctx.yield();
    if (lookId === 'golden' || lookId === 'dusk') for (let x = -640; x < 215; x += 26) {      // evening kiosks on the river side of the embankment road: one lit front each, facing the line
      if (!OR.chance(0.6)) continue;
      const z = bankS(x) - 17, w = OR.range(3.2, 5), y = 8.2, c = jit(mixc(OR.pick(P.tints), P.CONC, 0.4), 0.06, OR), k = OR.range(1.5, 2.1), wc = [k, k * OR.range(0.52, 0.66), k * 0.24];
      G.box(x, y - 1.2, z, w, 7.6, 2.8, c, { mask: 1 | 2 | 4 | 16 | 32, aoB: 0.75, top: mul(c, 0.6) });
      Q(GL, [x - w / 2 + 0.3, y + 0.5, z - 1.43], [x + w / 2 - 0.3, y + 0.5, z - 1.43], [x + w / 2 - 0.3, y + 2.1, z - 1.43], [x - w / 2 + 0.3, y + 2.1, z - 1.43], [0, 0, -1], wc);
      Q(K, [x - w / 2 - 0.2, y + 2.5, z - 1.4], [x + w / 2 + 0.2, y + 2.5, z - 1.4], [x + w / 2 + 0.2, y + 2.1, z - 2.7], [x - w / 2 - 0.2, y + 2.1, z - 2.7], [0, 1, -0.3], jit(mul(OR.pick(P.cloths), 0.7), 0.1, OR));
      if (OR.chance(0.5)) for (let j = 0; j < 4; j++) lantern(x - w / 2 + 0.4 + j * (w - 0.8) / 3, y + 2.5, z - 2.75);
    }
    await ctx.yield();
    groups.push(await kit.flush('gorge')); await ctx.yield();
    for (const g of groups) scene.add(g);
    const traffic = makeTraffic(tracks, 62 * dens * (0.7 + 0.3 * detail), rng.fork('cars'), time); scene.add(traffic);
    await ctx.yield();

    // ------------------------------------------------------------ the far city: pale towers stacked up every hillside, with a tank house on each roof
    const farList = [], FR = rng.fork('far'), tintsFar = P.tints.map((c) => mul(mixc(c, P.WHITE, 0.3), lookId === 'washed' ? 0.72 : 1));
    for (let gx = -1060; gx < 1500; gx += 46) { await ctx.yield(); for (let gz = -900; gz < 1440; gz += 46) {
      const x = gx + FR.range(-15, 15), z = gz + FR.range(-15, 15), jitr = FR();
      if (urban(x, z) + (x > eastJ(z) + 25 ? 0.32 : 0) < -0.02 + jitr * 0.22) continue;
      const h = height(x, z);
      if (h < 7 || h > (x > eastJ(z) ? 250 : 185)) continue;
      if (nearP(x, z).dist < 170 || Math.hypot(x - IC[0], z - IC[1]) < 152 || (Math.abs(x) < 128 && Math.abs(z) < 72) || (x > 100 && x < 215 && z > -90 && z < 310) || (x > 185 && x < 330 && z > 300 && z < 520) || !clearOf(x, z, 22)) continue;
      const w = FR.range(18, 32), dp = FR.range(15, 22), hh = FR.range(42, 100) * (0.8 + 0.45 * sm(-0.1, 0.5, urban(x, z))), yaw = FR.pick([0, Math.PI / 2]) + FR.range(-0.35, 0.35), c = jit(FR.pick(tintsFar), 0.09, FR);
      farList.push({ x, y: h - 16, z, w, h: hh + 16, d: dp, yaw, c });
      farList.push({ x: x + FR.range(-4, 4), y: h + hh, z: z + FR.range(-3, 3), w: FR.range(4, 9), h: FR.range(2.5, 6), d: FR.range(4, 8), yaw, c: mul(c, 0.8) });
    } }
    {   // three stepped ranks of taller towers up the east bank, facing the line across the jade river and along the brown one
      const RR = makeRng('mcl-ranks:' + ctx.seed), n0 = farList.length;
      const taken = (x, z) => { for (let i = 0; i < n0; i += 2) { const t = farList[i]; if (Math.abs(t.x - x) < 27 && Math.abs(t.z - z) < 27) return true; } return false; };
      const rank = (x, z, r) => {
        const jx = RR.range(-6, 6), jz = RR.range(-7, 7), w = RR.range(17, 28), dp = RR.range(14, 20), hh = 70 + r * 28 + RR.range(0, 36), yaw = RR.pick([0, Math.PI / 2]) + RR.range(-0.3, 0.3), c = jit(RR.pick(tintsFar), 0.09, RR), tw = RR.range(4, 9), th = RR.range(2.5, 6);
        x += jx; z += jz;
        if (Math.abs(z - AZ) < 36 || (Math.abs(z - 236) < 22 && x < 510) || (Math.abs(x - BX) < 30 && z > 380) || taken(x, z)) return;
        const h = height(x, z); if (h < 5) return;
        farList.push({ x, y: h - 16, z, w, h: hh + 16, d: dp, yaw, c });
        farList.push({ x: x + 2, y: h + hh, z: z - 1, w: tw, h: th, d: tw * 0.8, yaw, c: mul(c, 0.8) });
      };
      for (let z = -150, i = 0; z < 372; z += 30, i++) { if (i % 4 === 3) await ctx.yield(); for (let r = 0; r < 3; r++) rank(eastJ(z) + 54 + r * 38, z, r); }
      await ctx.yield();
      for (let x = 545, i = 0; x < 1300; x += 30, i++) { if (i % 4 === 3) await ctx.yield(); for (let r = 0; r < 3; r++) { const o = 72 + r * 38; rank(x + 0.316 * o, 380 + (x - 513.6) / 3 - 0.949 * o, r); } }
    }
    await ctx.yield();
    const litU = { value: gold ? 0.04 : lookId === 'dusk' ? 0.22 : L.lit * 1.3 };      // (golden: the sun is still up, so only a few far kitchens are lit, and dimly)
    scene.add(makeFarTowers(farList, { lit: litU, warm: gold ? 0.55 : 1 }));
    await ctx.yield();
    const skyline = S.makeSkyline({ rng: rng.fork('skyline'), radius: 1500, count: 150, layers: 3, maxHeight: 210, baseY: 30, clusters: 5, spires: false,
      color: new THREE.Color(L.hemiSky).multiplyScalar(lookId === 'dusk' ? 0.3 : 0.62), haze: fogColor, hazeAmount: [0.55, 0.9], groundHaze: 0.9 });
    scene.add(skyline.object); updaters.push(skyline);
    await ctx.yield();

    // ------------------------------------------------------------ trains: the sister train ahead, the oncoming train on the twin beam, two on the lower line
    const M = kit.mats(), nCars = 6 + 6 + 8;
    const cars = new THREE.InstancedMesh(carGeometry(kit.Geo, livery), M.clutter, nCars); cars.frustumCulled = false; cars.name = 'trains'; scene.add(cars);
    // lamps: a 0.6 x 0.4 m lens and a soft additive halo round it, so two red points still read from 250 m in the mist
    const lampG = new kit.Geo(true);
    for (const s of [1, -1]) { lampG.wallZ(s * 0.95 - 0.3, s * 0.95 + 0.3, 0.56, 0.96, 0, [1, 1, 1], 1, 1, [2, 2, 3, 3]); lampG.wallZ(s * 0.95 - 2.5, s * 0.95 + 2.5, -1.74, 3.26, 0.02, [1, 1, 1], 1, 1, [-1, -1, 1, 1]); }
    const lamps = new THREE.InstancedMesh(lampG.toGeometry(), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vQ; varying vec3 vC; void main(){ vQ = uv; vC = instanceColor; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec2 vQ; varying vec3 vC; void main(){ if (gl_FrontFacing == (vC.g < vC.r * .5)) discard; float r = length(vQ), core = step(1.5, vQ.x), halo = 1. - smoothstep(0., 1., r); gl_FragColor = vec4(vC * (core * 1.1 + halo * halo * (vC.g < vC.r * .5 ? .45 : .2)), 1.); }',
    }), 8); lamps.frustumCulled = false; lamps.name = 'train-lamps'; lamps.renderOrder = 4; scene.add(lamps);
    const RED = new THREE.Color(5.5, 0.22, 0.12), WHT = new THREE.Color(3.4, 3.1, 2.5);
    for (let i = 0; i < 8; i++) lamps.setColorAt(i, i % 2 ? WHT : RED);
    const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), UPV = new THREE.Vector3(0, 1, 0);
    const setCar = (mesh, i, pth, d, offL, drop, rev, shift) => {       // place one instance on a beam: +z of the car along (or against) the direction of travel
      pth.posAtDist(d, _p); pth.tangentAtDist(d, _z); if (rev) _z.negate();
      _x.crossVectors(UPV, _z).normalize(); _y.crossVectors(_z, _x);
      _p.addScaledVector(_x, rev ? -offL : offL); _p.y -= drop; if (shift) _p.addScaledVector(_z, shift);
      mesh.setMatrixAt(i, _m.makeBasis(_x, _y, _z).setPosition(_p));
    };
    const PITCH = CAR + CAR_GAP, lowL = lowPath.length;
    const runTrain = (first, n, pth, tail, offL, drop, rev, lo, hi, lampTail, lampHead) => {   // tail = distance of the rear end along the path
      let shown = 0;
      for (let k = 0; k < n; k++) {
        const d = rev ? tail - k * PITCH - CAR / 2 : tail + k * PITCH + CAR / 2, ok = d > lo && d < hi;
        if (ok) { setCar(cars, first + k, pth, d, offL, drop, rev); shown++; } else cars.setMatrixAt(first + k, ZERO);
        if (k === 0) { if (ok) setCar(lamps, lampTail, pth, d, offL, drop, rev, -CAR / 2 - 0.09); else lamps.setMatrixAt(lampTail, ZERO); }
        if (k === n - 1) { if (ok) setCar(lamps, lampHead, pth, d, offL, drop, rev, CAR / 2 + 0.09); else lamps.setMatrixAt(lampHead, ZERO); }
      }
      return shown;
    };
    const updateTrains = (t, dCam) => {
      runTrain(0, 6, path, dCam + 240 + 90 * sm(0.45 * PL, 0.6 * PL, dCam), 0, BEAM_DROP, false, -60, PL - CAR / 2 - 0.6, 0, 1);                   // the sister train slips into the hole at u 0.61
      runTrain(6, 6, path, 460 - dCam + 6 * PITCH, TWIN, BEAM_DROP, true, -58, PL - CAR / 2 - 0.6, 2, 3);     // the oncoming train: its nose meets the cab at 230 m
      for (let j = 0; j < 2; j++) { const span = lowL + 160, s = ((t * 17 + j * span * 0.5) % span) - 80; runTrain(12 + j * 4, 4, lowPath, j ? lowL - s : s, 0, 0, !!j, 4, lowL - 4, 4 + j * 2, 5 + j * 2); }
      cars.instanceMatrix.needsUpdate = true; lamps.instanceMatrix.needsUpdate = true;
    };
    updateTrains(0, 0);
    await ctx.yield();

    // ------------------------------------------------------------ river craft: barge trains and sand boats (or a white cruiser), and the cableway cabins
    const BR = rng.fork('boats'), boatSets = [], boats = [];
    const addSet = (kind, n) => { const mesh = new THREE.InstancedMesh(bargeGeometry(kit.Geo, BR, kind), M.clutter, n); mesh.frustumCulled = false; mesh.name = 'boats-' + kind; scene.add(mesh); boatSets.push(mesh); return mesh; };
    const nTrain = Math.round(2 * dens) + 1, barge = addSet('barge', nTrain * 3 + 2), sand = addSet('sand', 4), liner = cruiser ? addSet('cruiser', 1) : null;
    let bi = 0;
    for (let k = 0; k < nTrain; k++) { const lane = 90 + k * 150 + BR.range(-20, 20), v = (k % 2 ? -1 : 1) * BR.range(2.6, 4.2), ph = BR() * 2000; for (let j = 0; j < 3; j++) boats.push({ mesh: barge, i: bi++, river: 0, lane, v, ph: ph + j * 49 * Math.sign(v) }); }
    for (let k = 0; k < 2; k++) boats.push({ mesh: barge, i: bi++, river: 0, lane: BR.range(200, 520), v: BR.sign() * BR.range(3, 5), ph: BR() * 2000 });
    for (let k = 0; k < 4; k++) boats.push({ mesh: sand, i: k, river: k < 3 ? 1 : 0, lane: k < 3 ? 50 + k * 60 : 60, v: (k % 2 ? -1 : 1) * BR.range(2.4, 3.8), ph: BR() * 1200 });
    if (liner) boats.push({ mesh: liner, i: 0, river: 0, lane: 170, v: 4.4, ph: 760 });
    {   // two more lanes of barge trains close under the north bank, four trains in each, so some are always abreast of the curve; three ferries plying the confluence
      const OB = makeRng('mcl-boats2:' + ctx.seed), barge2 = new THREE.InstancedMesh(bargeGeometry(kit.Geo, OB, 'barge'), M.clutter, 24), ferry = new THREE.InstancedMesh(bargeGeometry(kit.Geo, OB, 'ferry'), M.clutter, 3);
      barge2.frustumCulled = ferry.frustumCulled = false; barge2.name = 'boats-barge2'; ferry.name = 'boats-ferry'; scene.add(barge2, ferry); boatSets.push(barge2, ferry);
      let bj = 0;
      for (let ln = 0; ln < 2; ln++) { const v = (ln ? -1 : 1) * OB.range(2.8, 3.8), ph0 = OB() * 2150; for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) boats.push({ mesh: barge2, i: bj++, river: 0, lane: ln ? 150 : 38, v, ph: ph0 + k * 537.5 + j * 49 * Math.sign(v) }); }
      for (const [i, a, c, T] of [[0, [297, 476], [548, 400], 64], [1, [287, 494], [350, 1038], 150], [2, [612, 428], [652, 985], 138]]) boats.push({ mesh: ferry, i, river: 2, a, c, T, ph: OB() });
    }
    const updateBoats = (t) => {
      for (const b of boats) {
        if (b.river === 2) { const fr = (t / b.T + b.ph) % 1, q = 0.5 - 0.5 * Math.cos(fr * TAU), sg = fr < 0.5 ? 1 : -1;
          _m.makeRotationY(Math.atan2(sg * (b.c[0] - b.a[0]), sg * (b.c[1] - b.a[1]))).setPosition(lerp(b.a[0], b.c[0], q), 0.3, lerp(b.a[1], b.c[1], q)); b.mesh.setMatrixAt(b.i, _m); continue; }
        if (b.river === 0) { const x = -980 + ((((b.ph + t * b.v) % 2150) + 2150) % 2150), z = bankS(x) + b.lane; _m.makeRotationY(Math.atan2(b.v > 0 ? 0.98 : -0.98, b.v > 0 ? -0.196 : 0.196)).setPosition(x, 0.3, z); }
        else { const z = -880 + ((((b.ph + t * b.v) % 1250) + 1250) % 1250), x = bankJ(z) + b.lane; _m.makeRotationY(b.v > 0 ? 0.1 * sm(100, 420, z) * (1 - sm(100, 420, z)) * 4 : Math.PI).setPosition(x, 0.3, z); }
        b.mesh.setMatrixAt(b.i, _m);
      }
      for (const m of boatSets) m.instanceMatrix.needsUpdate = true;
    };
    updateBoats(0);
    const cabinG = new kit.Geo(); cabinG.box(0, -3.4, 0, 2.6, 2.7, 4.2, [0.62, 0.2, 0.12], { aoB: 0.7 }); cabinG.box(0, -2.9, 0, 2.66, 0.9, 3.4, [0.04, 0.06, 0.07], { mask: 1 | 2 }); cabinG.box(0, -1, 0, 0.3, 2.2, 0.3, [0.3, 0.3, 0.3]);
    const cabins = new THREE.InstancedMesh(cabinG.toGeometry(), M.clutter, 10); cabins.frustumCulled = false; cabins.name = 'cableway-cabins'; scene.add(cabins);
    const updateCabins = (t) => {
      for (let i = 0; i < 4; i++) { const up = i < 2, s = (t * 0.011 + i * 0.5 + (up ? 0 : 0.27)) % 1, q = up ? s : 1 - s, o = up ? 4 : -4;
        cabins.setMatrixAt(i, _m.makeRotationY(0.18).setPosition(lerp(CW.a[0], CW.b[0], q) + o, lerp(CW.a[1], CW.b[1], q) - CW.sag * 4 * q * (1 - q), lerp(CW.a[2], CW.b[2], q))); }
      for (let i = 0; i < 6; i++) { const up = i < 3, s = (t * 0.02 + i / 3 + (up ? 0 : 0.16)) % 1, q = up ? s : 1 - s;
        cabins.setMatrixAt(4 + i, _m.makeRotationY(Math.PI / 2).scale(_x.set(1.5, 1.5, 1.5)).setPosition(lerp(CW2.a[0], CW2.b[0], q), lerp(CW2.a[1], CW2.b[1], q) - CW2.sag * 4 * q * (1 - q), CW2.a[2] + (up ? 3 : -3))); }
      cabins.instanceMatrix.needsUpdate = true;
    };
    updateCabins(0);
    await ctx.yield();

    // ------------------------------------------------------------ people, steam, wires, kites
    for (let i = 0; i < Math.round(70 * dens); i++) { const x = KR.range(-600, 230), o = KR.chance(0.5) ? -17.5 : -30.5, l = KR.range(20, 60); addWalker([x, 8.3, bankS(x) + o], [x + l, 8.3, bankS(x + l) + o], 1.1); }
    for (let i = 0; i < Math.round(24 * dens); i++) { const x = KR.range(-86, 86), z = KR.range(11, 20), l = KR.range(8, 24) * KR.sign(); addWalker([x, HY + 0.05, z], [clamp(x + l, -88, 88), HY + 0.05, z + KR.range(-2, 2)], 0.8); }
    scene.add(makePeople(kit.Geo, walkers, time));
    await ctx.yield();
    for (const b of [pigeonBlock, lowLeft]) void b;
    scene.add(makeSteam(steamers, rng.fork('steam'), time, wind, new THREE.Color(L.cLit).multiplyScalar(lookId === 'dusk' ? 0.35 : 0.85)));
    await ctx.yield();
    const kiteGroup = new THREE.Group(); kiteGroup.name = 'kites';
    if (kites) {
      const kg = new kit.Geo(), kc = [], KA = 2.4;
      for (const B of blocks) if (B.low) for (let j = 0; j < 2; j++) {
        const kx = B.x + KR.range(-30, 30), kz = B.z + KR.range(-30, 30) - B.f.lz * 26, ky = B.top + KR.range(34, 60), c = KR.pick([[0.6, 0.06, 0.04], [0.7, 0.5, 0.06], [0.1, 0.4, 0.36], [0.65, 0.65, 0.6]]);
        if (nearP(kx, kz).dist < 16) continue;
        kg.quad([kx - 1.1, ky, kz], [kx, ky - 1.6, kz + 0.3], [kx + 1.1, ky, kz], [kx, ky + 1.2, kz - 0.2], c); kg.quad([kx - 0.12, ky - 1.6, kz + 0.3], [kx + 0.12, ky - 1.6, kz + 0.3], [kx + 0.3, ky - 5, kz + 1.4], [kx - 0.3, ky - 4.6, kz + 1.2], mul(c, 0.8));
        const ax = B.x + KR.range(-5, 5), az = B.z + KR.range(-3, 3), ph = KR() * 6, a = [ax, B.top + 1.8, az];
        for (let i = 0; i < 8; i++) kc.push(kx, ky, kz, i < 4 ? ph : -ph - 1);
        let pp = a, pw = 0;           // the string: fixed on the roof, carried by the kite at the top (same sway as the kite, see makeWires)
        for (let i = 1; i <= 7; i++) { const t = i / 7, q = [lerp(a[0], kx, t), lerp(a[1], ky - 0.4, t) - 14 * t * (1 - t), lerp(a[2], kz, t)], w = KA * t * t; wires.push([pp[0], pp[1], pp[2], q[0], q[1], q[2], pw, w, ph]); pp = q; pw = w; }
      }
      if (kg.nv) {
        const g = kg.toGeometry(); g.setAttribute('aKc', new THREE.BufferAttribute(new Float32Array(kc), 4));
        const km = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
        km.onBeforeCompile = (sh) => {
          sh.uniforms.uTime = time;
          sh.vertexShader = 'attribute vec4 aKc; uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', /* glsl */`
            float kph = abs(aKc.w) - step(aKc.w, -.5), kya = .45 * sin(uTime * .9 + kph * 2.) * (aKc.w < -.5 ? 1.8 : 1.);
            vec3 kr = position - aKc.xyz; kr.xz = vec2(kr.x * cos(kya) - kr.z * sin(kya), kr.x * sin(kya) + kr.z * cos(kya));
            if (aKc.w < -.5) kr.x += sin(uTime * 3.1 + kph + kr.y * 1.4) * .22 * clamp(-kr.y - 1.4, 0., 3.);
            vec3 transformed = aKc.xyz + kr + vec3(sin(uTime * 1.1 + kph), .3 * sin(uTime * 1.7 + kph), cos(uTime * .8 + kph * 1.3)) * ${KA.toFixed(1)};`);
        };
        km.customProgramCacheKey = () => 'mcl-kite';
        const kmesh = new THREE.Mesh(g, km); kmesh.frustumCulled = false; kiteGroup.add(kmesh);
      }
    }
    scene.add(kiteGroup);
    const wireMesh = makeWires(wires, time, lookId === 'dusk' ? '#0c1020' : '#1c2224', 0.05), cableMesh = makeWires(cwSegs, time, '#2a2f30', 0.09);
    scene.add(wireMesh, cableMesh);
    await ctx.yield();

    // ------------------------------------------------------------ storm drain waterfall under the curve
    const fall = Water.makeWaterfall({ rng: rng.fork('fall'), light: sky, top: drain.top, height: drain.height, width: 3.6, dir: drain.dir, launch: 1.5, layers: 2, rows: 18,
      tint: '#6f7a66', color: '#e4ece6', mistColor: fogColor, mistCount: 70, mistOpacity: 0.26, density: 0.6, rainbow: 0, pool: false });
    fall.object.name = 'storm-drain'; scene.add(fall.object); updaters.push(fall);
    await ctx.yield();

    // ------------------------------------------------------------ trees: banyan and bamboo on every ledge the city left over, a blurred canopy on the far slopes
    const floraWind = flora.makeWind({ direction: wind, strength: lookId === 'rain' ? 1.5 : 1, gustiness: 0.6 });
    const fmatOpts = { wind: floraWind, backlight: lookId === 'golden' ? 1.3 : 0.7, ambient: lookId === 'dusk' ? 2.4 : 2.0, leafAmbient: lookId === 'dusk' ? 2.5 : 1.5 };
    await flora.prepareLeafTexture(fmatOpts, ctx.yield);
    const fmat = flora.windMaterial(fmatOpts);
    const TR = rng.fork('trees'), lp = season === 'winter' ? { leaf: '#5d7048', leafLight: '#8f9860', leafDark: '#2e3f2c' } : season === 'spring' ? { leaf: '#4f8f3e', leafLight: '#b4d06a', leafDark: '#2a5a30' } : { leaf: '#3f7a3a', leafLight: '#8fb85a', leafDark: '#1f4a2c' };
    const blossom = season === 'spring' ? {} : lp;
    await ctx.yield();
    const nearV = [], farV = [], grow = async (list, g) => { list.push(g); await ctx.yield(); };       // one tree model per step, in the same order as ever
    const wood = { bark: '#8a745c', barkDark: '#5a4a3a' };
    await grow(nearV, flora.oakGeometry({ rng: TR, detail: 1, height: 13, fullness: 1.25, ...lp, ...wood }));
    await grow(nearV, flora.bambooGeometry({ rng: TR, detail: 1, height: 12, ...lp }));
    await grow(nearV, flora.willowGeometry({ rng: TR, detail: 1, height: 12, strands: 6, ...lp }));
    await grow(nearV, season === 'spring' ? flora.cherryGeometry({ rng: TR, detail: 1, height: 9 }) : flora.oakGeometry({ rng: TR, detail: 1, height: 10, fullness: 1.1, ...lp }));
    await grow(farV, flora.oakGeometry({ rng: TR, detail: 0, height: 13, fullness: 1.3, ...lp }));
    await grow(farV, flora.bambooGeometry({ rng: TR, detail: 0, height: 12, ...lp }));
    await grow(farV, flora.oakGeometry({ rng: TR, detail: 0, height: 11, fullness: 1.2, ...lp }));
    await grow(farV, season === 'spring' ? flora.cherryGeometry({ rng: TR, detail: 0, height: 9 }) : flora.oakGeometry({ rng: TR, detail: 0, height: 10, ...blossom }));
    const treePts = [], nTrees = Math.round(125 * lerp(1, dens, 0.6) * (0.6 + 0.4 * detail));
    for (let tries = 0; tries < nTrees * 30 && treePts.length < nTrees; tries++) {
      if ((tries & 63) === 63) await ctx.yield();
      const d = TR.range(-40, PL - 30), off = (TR.chance(0.5) ? 1 : -1) * (9 + Math.pow(TR(), 1.5) * 190), f = frame(path, d), x = f.x + f.lx * off, z = f.z + f.lz * off;
      const n = nearP(x, z), nd = n.dist, ny = n.y, nu = n.u, h = groundAt(x, z), s = TR.range(0.75, 1.3);
      if (h < 3.2 || nd < 8.5 || (nd < 20 && h + 15 * s > ny - 3.4) || !clearOf(x, z, 4)) continue;
      const di = Math.hypot(x - IC[0], z - IC[1]); if (di > 44 && di < 126) continue;
      if (Math.abs(x) < 112 && z > -40 && z < 48) continue;
      if (x > 104 && x < 200 && z < 310) continue;
      const cliff = (x - E[0]) * dir[0] + (z - E[2]) * dir[1] < 120;
      if (!cliff && urban(x, z) > 0.22 && TR.chance(0.75)) continue;
      const tp = { x, y: h - 0.2, z, s, rot: TR() * TAU, d: nd, u: clamp(nu, 0, 0.999), v: cliff ? TR.pick([0, 0, 2, 2, 1, 3]) : TR.int(0, 3) };
      if (tp.v === 1 && nd < 28 && nu * PL > 320 && nu * PL < 430) tp.v = 0;      // no lone bamboo clump beside the line where the reveal opens: a camphor instead
      treePts.push(tp);
    }
    await ctx.yield();
    const extraScrub = [];
    for (let tries = 0, nT = 0; tries < 1600 && (nT < 24 || extraScrub.length < 56); tries++) {     // bamboo and camphor on the hillside inside the last curve, so it is not a lawn
      const d = XR.range(500, 800), off = XR.range(15, 96), f = frame(path, d), x = f.x + f.lx * off, z = f.z + f.lz * off, n = nearP(x, z), h = groundAt(x, z), sc = XR.range(0.75, 1.25), tree = XR.chance(0.3), rot = XR() * TAU;
      if ((tries & 63) === 63) await ctx.yield();
      if (h < 3.2 || n.dist < 11 || !clearOf(x, z, tree ? 4 : 3) || (Math.abs(x) < 112 && z > -40 && z < 48)) continue;
      if (tree) { if (nT >= 24 || (n.dist < 22 && h + 15 * sc > n.y - 3.4)) continue; treePts.push({ x, y: h - 0.2, z, s: sc, rot, d: n.dist, u: clamp(n.u, 0, 0.999), v: (tries % 3 === 0 ? 0 : tries % 3 === 1 ? 1 : 3) }); nT++; }
      else if (extraScrub.length < 56) extraScrub.push({ x, y: h - 0.6, z, s: sc * 3, rot, d: n.dist, u: clamp(n.u, 0, 0.999), v: tries & 1 });
    }
    {   // more scrub and young trees where two slopes still read as open ground: under the last thread towers (left), and among the terraces right of the last straight
      const SR = makeRng('mcl-scrub2:' + ctx.seed);
      for (const [da, db, oa, ob, nB, nTr] of [[360, 480, 12, 70, 30, 6], [690, 820, -12, -70, 22, 6]]) {
        for (let tries = 0, nb = 0, nt = 0; tries < 700 && (nb < nB || nt < nTr); tries++) {
          const d = SR.range(da, db), off = SR.range(oa, ob), f = frame(path, d), x = f.x + f.lx * off, z = f.z + f.lz * off, n = nearP(x, z), h = groundAt(x, z), sc = SR.range(0.75, 1.25), tree = SR.chance(0.25), rot = SR() * TAU;
          if ((tries & 63) === 63) await ctx.yield();
          if (h < 3.2 || n.dist < 11 || !clearOf(x, z, tree ? 4 : 3) || (Math.abs(x) < 112 && z > -40 && z < 48)) continue;
          if (tree) { if (nt >= nTr || (n.dist < 22 && h + 15 * sc > n.y - 3.4)) continue; treePts.push({ x, y: h - 0.2, z, s: sc, rot, d: n.dist, u: clamp(n.u, 0, 0.999), v: (tries % 3 === 0 ? 0 : tries % 3 === 1 ? 1 : 3) }); nt++; }
          else if (nb < nB) { extraScrub.push({ x, y: h - 0.6, z, s: sc * 3, rot, d: n.dist, u: clamp(n.u, 0, 0.999), v: tries & 1 }); nb++; }
        }
      }
    }
    await ctx.yield();
    const trees = flora.makeScatter({ rng: rng.fork('scatter'), points: treePts, variants: nearV, farVariants: farV, farDistance: 24, material: fmat, chunks: 8, cullDistance: 230, tint: 0.2, hue: 0.05, sink: 0.05 });
    trees.object.name = 'trees'; scene.add(trees.object);
    await ctx.yield();
    const canopyPts = [], nCan = Math.round(150 * (0.6 + 0.4 * detail));
    for (let tries = 0; tries < nCan * 20 && canopyPts.length < nCan; tries++) {
      if ((tries & 63) === 63) await ctx.yield();
      const x = TR.range(-1050, 1150), z = TR.range(-900, 1400), n = nearP(x, z), nd = n.dist, nu = n.u, h = groundAt(x, z);
      if (h < 6 || nd < 150 || urban(x, z) > 0.12 + TR() * 0.2 || !clearOf(x, z, 10)) continue;
      const di = Math.hypot(x - IC[0], z - IC[1]); if (di < 130 || (x > 104 && x < 200 && z < 310)) continue;
      canopyPts.push({ x, y: h - 1.5, z, s: TR.range(5.5, 10), rot: TR() * TAU, d: nd, u: clamp(nu, 0, 0.999), v: TR.int(0, 1) });
    }
    await ctx.yield();
    const bushV = [flora.bushGeometry({ rng: TR, detail: 0, size: 1.7, ...lp, ...wood }), flora.bushGeometry({ rng: TR, detail: 0, size: 1.4, ...blossom, ...(season === 'spring' ? { leaf: '#e9b9c8', leafLight: '#fbe3ea', leafDark: '#b9788e' } : {}), ...wood })];
    await ctx.yield();
    const canopy = flora.makeScatter({ rng: rng.fork('canopy'), points: canopyPts, variants: bushV,
      material: fmat, chunks: 1, tint: 0.22, hue: 0.05, sink: 0, tilt: 0.02, stretch: 0.3 });
    canopy.object.name = 'canopy'; scene.add(canopy.object);
    await ctx.yield();
    const scrubPts = [], nScrub = Math.round(310 * (0.6 + 0.4 * detail));       // scrub and young trees on the slopes the curve swings past
    for (let tries = 0; tries < nScrub * 20 && scrubPts.length < nScrub; tries++) {
      if ((tries & 63) === 63) await ctx.yield();
      const d = TR.range(-40, PL - 20), off = (TR.chance(0.72) ? 1 : -1) * (11 + Math.pow(TR(), 1.3) * 150), f = frame(path, d), x = f.x + f.lx * off, z = f.z + f.lz * off;
      const n = nearP(x, z), nd = n.dist, nu = n.u, h = groundAt(x, z);
      if (h < 3.2 || nd < 10 || !clearOf(x, z, 3) || (Math.abs(x) < 112 && z > -40 && z < 48)) continue;
      const di = Math.hypot(x - IC[0], z - IC[1]); if (di > 40 && di < 126) continue;
      scrubPts.push({ x, y: h - 0.6, z, s: TR.range(1.6, 4.2), rot: TR() * TAU, d: nd, u: clamp(nu, 0, 0.999), v: TR.int(0, 1) });
    }
    for (const q of extraScrub) scrubPts.push(q);
    await ctx.yield();
    const scrub = flora.makeScatter({ rng: rng.fork('scrub'), points: scrubPts, variants: bushV, material: fmat, chunks: 6, cullDistance: 280, tint: 0.24, hue: 0.06, sink: 0, stretch: 0.35 });
    scrub.object.name = 'scrub'; scene.add(scrub.object);
    await ctx.yield();
    // the tunnel cliff beside the first 120 m and the rock wall inside the last curve: creeper sheets hung from ledges, banyan aerial roots in
    // curtains, banyans and shrubs gripping the face. Each site is its own scatter, so it is culled once the cab has passed it.
    const CR = rng.fork('cliff'), rootV = [flora.willowGeometry({ rng: TR, detail: 1, height: 16, strands: 9, leaf: '#55703a', leafLight: '#8fa85a', leafDark: '#2a3a22', bark: '#7a6650', barkDark: '#4a3d30' }), nearV[0], bushV[0], bushV[1]];
    const rootR = (rootV[0].userData.radius || 6), wallAt = (d, y, o0, o1) => {     // the first point left of the line, at path distance d, where the ground reaches height y
      const f = frame(path, d);
      for (let o = o0; o < o1; o += 0.5) { const x = f.x + f.lx * o, z = f.z + f.lz * o; if (groundAt(x, z) >= y) return { f, o, x, z }; }
      return null;
    };
    const cliffSets = [];
    for (const [d0, d1, o0, o1, nSheet, nRoot, nGrip, nShrub, rise] of [[-40, 120, 9, 44, 14, 9, 4, 40, 4.2], [556, 704, 22, 76, 12, 7, 4, 36, 2.95]]) {
      const pts = [], put = (d, y, v, sc, minO) => {
        let w = wallAt(d, y, o0, o1); if (!w) return;
        if (w.o < minO) { const x = w.f.x + w.f.lx * minO, z = w.f.z + w.f.lz * minO; w = { f: w.f, o: minO, x, z }; }
        pts.push({ x: w.x, y: groundAt(w.x, w.z) - (v === 0 ? 5 : v === 1 ? 0.4 : 0.5), z: w.z, s: sc, rot: CR() * TAU, d: w.o, u: clamp(d / PL, 0, 0.999), v });
      };
      for (let i = 0; i < nSheet; i++) {
        const d = lerp(d0, d1, (i + CR()) / nSheet), len = CR.range(6, 20), yTop = EYE + CR.range(1, 24), w = wallAt(d, yTop, o0, o1); if (!w) continue;
        const wd = CR.range(4, 9), m = kit.mark();
        for (let x = -wd / 2; x < wd / 2;) { const sw = CR.range(0.6, 1.6), l = len * CR.range(0.4, 1), top = CR.range(-1.2, 0.8), zz = 1.0 + CR.range(-0.15, 0.25);
          kit.plantQuad(x, zz, x + sw, zz, top - l, top, x * 0.3, (x + sw) * 0.3, CR(), 1, -0.03 * l - 0.05, mul(kit.leafCol(CR), 0.72), (l - top) / rise + 0.4); x += sw * CR.range(0.7, 1.25); }
        kit.place(m, w.x, yTop, w.z, Math.atan2(-w.f.lx, -w.f.lz));
      }
      await ctx.yield();
      for (let i = 0; i < nRoot; i++) { const sc = CR.range(0.85, 1.15); put(lerp(d0, d1, (i + CR()) / nRoot), EYE + CR.range(-3, 6), 0, sc, 7 + rootR * sc); }
      await ctx.yield();
      for (let i = 0; i < nGrip; i++) { const sc = CR.range(0.9, 1.3); put(lerp(d0, d1, (i + CR()) / nGrip), EYE + CR.range(8, 30), 1, sc, 20); }
      for (let i = 0; i < nShrub; i++) { if (i % 10 === 0) await ctx.yield(); put(CR.range(d0, d1), EYE + CR.range(-12, 40) * (CR() < 0.5 ? 0.5 : 1), 2 + (i & 1), CR.range(1.8, 4) * 0.78, o0 + 1.5); }
      await ctx.yield();
      const set = flora.makeScatter({ rng: CR.fork('s' + d0), points: pts, variants: rootV, material: fmat, chunks: 1, cullDistance: 300, tint: 0.2, hue: 0.05, sink: 0, tilt: 0.25 });
      set.object.name = 'cliff-' + d0; scene.add(set.object); cliffSets.push(set);
      await ctx.yield();
    }
    scene.add(await kit.flush('cliff'));
    await ctx.yield();
    {   // reeds fringing the jade river (large clumps: they are seen from 150 m and more)
      const pts = [];
      for (let i = 0; i < Math.round(78 * (0.6 + 0.4 * detail)); i++) { const z = CR.range(-70, 425), x = bankJ(z) - CR.range(-1.5, 3.5), g = groundAt(x, z); if (g > 3.5) continue;
        pts.push({ x, y: Math.max(g, 0.25) - 0.1, z, s: CR.range(2, 3.4), rot: CR() * TAU, d: nearP(x, z).dist, u: clamp(nearP(x, z).u, 0, 0.999), v: i & 1 }); }
      await ctx.yield();
      const reeds = flora.makeReeds({ rng: CR.fork('reeds'), points: pts, variants: [flora.reedGeometry({ rng: CR, leaf: '#6f9a44' }), flora.reedGeometry({ rng: CR, leaf: '#7fa24a' })], material: fmat, chunks: 3, cullDistance: 430, tint: 0.2 });
      reeds.object.name = 'reeds'; scene.add(reeds.object); cliffSets.push(reeds);
    }
    await ctx.yield();

    // ------------------------------------------------------------ birds: pigeons wheeling in the slot, swifts over the gorge, egrets up the jade river, kites on the thermal
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), BRD = rng.fork('birds');
    await ctx.yield();
    const pigeon = { body: '#8a9098', belly: '#b4b9bf', wingC: '#727982', trail: '#9aa0a8', tip: '#2a2d33', beak: '#c9a070', head: '#5d646e', legC: '#b05a50' };
    // (flock cure 1) every flock that can come near the flown line keeps 2.0 m of clear air from it, BY PLACE, bird by bird: its course stays where it
    // is laid, a bird whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each), the deal is held at
    // three scatters, and each has a small wander of its own written out so that the lane it leaves about the line stays narrow. The stretches are
    // the parts of the route each course comes within 45 m of.
    const birdsClear = (from, to) => ({ path, dist: 2, each: true, from, to, step: 2 });
    for (const [d, up, r, c0, c1] of [[150, 17, 20, 0.07, 0.29], [262, 22, 24, 0.19, 0.43], [338, 15, 19, 0.28, 0.52]]) { const f = frame(path, d);
      fauna.add(F.makeFlock({ rng: BRD.fork('p' + d), species: 'gulls', count: Math.round(34 * dens), size: 0.82, speed: 13, flap: 4.6, glide: 0.25, spread: [16, 6, 16], wander: [1.2, 0.8, 1.6, 0.35], maxSigma: 3, keepClear: birdsClear(c0, c1), center: [f.x + f.lx * 2, EYE + up, f.z + f.lz * 2], radius: r, height: 5, ...pigeon })); await ctx.yield(); }
    fauna.add(F.makeFlock({ rng: BRD.fork('burst'), species: 'gulls', count: Math.round(60 * dens), size: 0.82, speed: 14, flap: 5.2, glide: 0.1, spread: [15, 9, 22], wander: [0.6, 0.4, 0.8, 0.35], maxSigma: 3, keepClear: birdsClear(0.88, 1), ...pigeon,
      cross: { path, u: 0.94, lead: 27, span: 150, angle: 72, side: -1, height: 2.5, rise: 26, bow: 12, duration: DUR } }), { range: 360 });
    await ctx.yield();
    // (the swifts' clearing is the long one, 20 to 85 ms whole on a cold page: made by the kit's stepped form, the same flock to the bit, the clearing handed back in slices)
    fauna.add(await F.makeFlockAsync({ rng: BRD.fork('swifts'), species: 'swifts', count: 36, wander: [2, 1.2, 2, 0.7], maxSigma: 3, keepClear: birdsClear(0.23, 0.83), along: { path, side: -9, up: 7, lead: 38, from: 0.34, to: 0.72, drift: 9 } }, ctx.yield));
    await ctx.yield();
    const egretRoute = []; for (let z = 420; z >= -420; z -= 70) egretRoute.push([bankJ(z) + 95 + 30 * Math.sin(z * 0.01), 16 + 5 * Math.sin(z * 0.013), z]);
    fauna.add(F.makeFlock({ rng: BRD.fork('egrets'), species: 'flamingos', count: 9, speed: 11, route: egretRoute, closed: false, body: '#f6f6f0', belly: '#ffffff', wingC: '#f0f1ec', trail: '#e2e4de', tip: '#dfe2dc', beak: '#e0b030', head: '#fbfbf6', neckC: '#fbfbf6', legC: '#2a2a28' }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: BRD.fork('kites'), species: 'eagles', count: 3, center: [330, 128, 300], radius: 60, soarRadius: 46, body: '#4a3626', belly: '#5c4632', wingC: '#46321f', head: '#5a4634', tailC: '#5a4028' }));
    await ctx.yield();
    let raceFlock = null, raceOn = true; const raceParts = [];
    if (rare) {      // the pigeon race: 1,200 birds released from the slab roof as the sun shaft reaches it, wheeling out over the valley beside the line and back over the roof
      // (flock cure 2: the wheel is moved in plan. It leaves the roof's east half, turns out over the valley to the right of the line, comes back up over the
      // roof ahead of us and crosses our axis only behind the slab's face, to the roof's west end: no point of its course lies within 69 m of the flown line,
      // and the cloud's whole reach is 62.7 m)
      const RY = HY + 66.1, race = makePath([[56, RY + 2, 3], [62, RY + 8, 28], [82, RY + 2, 48], [100, RY - 10, 62], [98, RY - 22, 80], [80, RY - 28, 80], [69, RY - 22, 58], [66, RY - 6, 30], [56, RY + 8, 4], [32, RY + 18, -16], [2, RY + 22, -38], [-30, RY + 20, -34], [-58, RY + 14, -12], [-70, RY + 10, 14]], { tension: 0.5 });
      const RL = race.length / 0.34, fake = { length: RL, posAtDist: (d, out) => race.posAtDist(d - 0.66 * RL, out), tangentAtDist: (d, out) => race.tangentAtDist(d - 0.66 * RL, out) };
      raceFlock = F.makeFlock({ rng: BRD.fork('race'), species: 'starlings', count: Math.round(1200 * (0.6 + 0.4 * detail)), size: 4.4, flap: 5.4, spread: [26, 11, 34], body: '#8a9098', belly: '#b9bec4', wingC: '#70777f', trail: '#a2a8b0', tip: '#30333a', head: '#5d646e',
        along: { path: fake, from: 0.66, to: 1, lead: 0, side: 0, up: 0, tread: 60 } });
      fauna.add(raceFlock, { always: true });
      // until its moment (it flies from u 0.66) only one bird of the flock is drawn: the shader is warm and the thread keeps its triangles
      raceFlock.object.traverse((m) => { if (m.isInstancedMesh) raceParts.push({ m, n: m.count }); else if (m.isMesh && m.geometry.isInstancedBufferGeometry) raceParts.push({ g: m.geometry, n: m.geometry.instanceCount }); });
    }
    await ctx.yield();

    // ------------------------------------------------------------ air: sun shafts over the confluence, mist pooled on the rivers, drifting scraps, rain or motes
    const air = fx.fxGroup(); air.object.name = 'air'; scene.add(air.object);
    const wash = lookId === 'washed';
    if (L.rays > 0.02) air.add(fx.makeGodRays({ rng: rng.fork('rays'), time, position: [(wash ? 300 : 200) + sunDir.x * 230, 10 + sunDir.y * 230, (wash ? 380 : 420) + sunDir.z * 230], direction: [-sunDir.x, -sunDir.y, -sunDir.z], radius: 170, count: 9, length: 330,
      width: wash ? [24, 60] : [14, 40], color: sunColor, intensity: (wash ? 1.1 : 0.6) * L.rays, falloff: 1.0, speed: 0.6, far: [900, 1300] }));
    await ctx.yield();
    if (lookId === 'fog') air.add(fx.makeMist({ rng: makeRng('mcl-fogbank:' + ctx.seed), time, count: 30, area: [560, 22, 440], center: [90, 31, 380], size: [110, 230], color: fogColor.clone().multiplyScalar(1.06), opacity: 0.5, drift: [wind[0] * 0.8, 0, wind[1] * 0.8] }));
    await ctx.yield();
    if (L.mist > 0.02) {
      // (the pooled mist is told the ground stands high round the confluence, so it thins out there and the two-colour join shows)
      air.add(fx.makeGroundFog({ rng: rng.fork('pool'), time, heightAt: (x, z) => groundAt(x, z) + 70 * (1 - sm(240, 430, Math.hypot(x - 390, z - 480))), mode: 'pool', center: [240, 0, 320], size: 1700, y: 9, height: 26, layers: 5, segments: 28, color: fogColor, opacity: 0.2 + 0.7 * L.mist, coverage: 0.34, scale: 0.006,
        wind: [wind[0] * 1.6, wind[1] * 1.6], sunDir, sunColor, scatter: 0.12 }));
      await ctx.yield();
      // three thin layers lying in the gorge under the first of the line, below the beam
      air.add(fx.makeGroundFog({ rng: rng.fork('gorge'), time, heightAt: groundAt, mode: 'pool', center: [-300, 0, 560], size: 660, y: 24, height: 28, layers: 3, segments: 16, color: fogColor, opacity: (wash ? 1.2 : 1.6) * L.mist, coverage: 0.7, scale: 0.011,
        wind: [wind[0] * 1.2, wind[1] * 1.2], sunDir, sunColor, scatter: 0.35 }));
      await ctx.yield();
      air.add(fx.makeMist({ rng: rng.fork('scraps'), time, count: 26, area: [900, 40, 700], center: [-60, 38, 250], size: [50, 120], color: fogColor, opacity: 0.24 * L.mist, drift: [wind[0] * 1.8, 0, wind[1] * 1.8] }));
      await ctx.yield();
      air.add(fx.makeMist({ rng: makeRng('mcl-bank1:' + ctx.seed), time, count: 20, area: [190, 22, 520], center: [585, 40, 170], size: [120, 260], color: fogColor, opacity: 0.35, drift: [wind[0] * 0.7, 0, wind[1] * 0.7] }));
      await ctx.yield();
      air.add(fx.makeMist({ rng: makeRng('mcl-bank2:' + ctx.seed), time, count: 20, area: [520, 24, 220], center: [860, 52, 400], size: [120, 260], color: fogColor, opacity: 0.35, drift: [wind[0] * 0.7, 0, wind[1] * 0.7] }));
      await ctx.yield();
      air.add(fx.makeMist({ rng: rng.fork('slot'), time, count: 26, area: [420, 30, 150], center: [-370, EYE - 24, 450], size: [22, 46], color: fogColor, opacity: 0.6 * L.mist, drift: [wind[0] * 0.9, 0.05, wind[1] * 0.9] }));
    }
    await ctx.yield();
    const fallP = L.rain ? fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, density: 0.75 * L.rain, opacity: 0.5, near: [2.2, 5] })
      : season === 'spring' ? fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', time, count: 420, colors: ['#f6c9d6', '#fde6ec', '#e9a9bd'], near: [2.4, 5] })
      : fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: 220, box: [46, 26, 46], colors: [L.sun, L.horizon], intensity: 0.14, near: [3.5, 7] });
    air.add(fallP);
    await ctx.yield();

    // ------------------------------------------------------------ the cab: the driver's windscreen, at the frame edges only
    const cabTone = new THREE.Color(L.horizon).lerp(new THREE.Color(1, 1, 1), 0.35).multiplyScalar((lookId === 'dusk' ? 0.8 : lookId === 'fog' ? 0.85 : 1) * 0.75);
    if (lookId === 'golden') { const g = cabTone.r * 0.3 + cabTone.g * 0.55 + cabTone.b * 0.15; cabTone.lerp(new THREE.Color(g * 0.97, g * 0.98, g * 1.06), 0.6); }
    const cab = makeCab(kit.Geo, time, cabTone, skyCol.clone().multiplyScalar(lookId === 'dusk' ? 0.7 : 1.1), lookId === 'dusk');
    cab.uniforms.uAll.value = L.rain ? 0.42 : 0.07; cab.uniforms.uBeads.value = lookId === 'golden' || lookId === 'dusk' ? 0 : lookId === 'washed' ? 0.7 : 1; cab.uniforms.uRain.value = L.rain;
    scene.add(cab.object);
    const beads0 = cab.uniforms.uBeads.value;
    await ctx.yield();
    const heroDress = [], dryGlass = lookId === 'golden' || lookId === 'dusk'; let heroFar = false, inThread = false;
    hero.object.traverse((o) => { if (o.isMesh && /clutter|laundry|plant|drip|bars/.test(o.name)) heroDress.push(o); });
    const stroke = (p) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p));
    // While u is 0 this world is being drawn through the last world's portal, by the portal's camera, which stands behind the start of the line:
    // the cab then waits where a camera at the first point of the line would carry it, and the viewer arrives into it at the crossing.
    const cabAtStart = path.frameAt(0);

    if (ctx.renderer && sky.prewarm) { try { await sky.prewarm(ctx.renderer, null, scene); } catch (e) { /* prewarm is optional */ } }
    await ctx.yield();

    const update = (dt, t, camera, u) => {
      time.value = t;
      const uu = u || 0, dCam = uu * PL;
      for (let i = 0; i < updaters.length; i++) updaters[i].update(dt, t, camera);
      const pass = Math.exp(-Math.pow((dCam - 236) / 30, 2)), rock = pass * Math.sin(t * 13) + 0.25 * Math.sin(t * 2.3) * Math.sin(t * 0.7);
      hero.setProgress(sm(0.66, 0.88, uu)); hero.setGust(0.16 + 0.12 * Math.sin(t * 0.37) + 0.8 * pass + 0.5 * sm(0.9, 1, uu)); hero.update(dt, t);
      sun.intensity = L.sunI * (0.95 + 0.05 * Math.sin(t * 0.31) + 0.03 * Math.sin(t * 0.83 + 1)) * (1 - 0.15 * L.shaft * sm(0.66, 0.76, uu));
      updateTrains(t, dCam); updateBoats(t); updateCabins(t);
      flora.updateWind(floraWind, t);
      trees.update(dt, t, camera); scrub.update(dt, t, camera); for (let i = 0; i < cliffSets.length; i++) cliffSets[i].update(dt, t, camera);
      const far = uu < 0.47; if (far !== heroFar) { heroFar = far; for (let i = 0; i < heroDress.length; i++) heroDress[i].visible = !far; }
      const thr = uu < 0.33; if (thr !== inThread) { inThread = thr; cliffSets[1].object.visible = cliffSets[2].object.visible = fall.object.visible = !thr; }      // the rock wall of the last curve, the reeds and the storm drain (meshes only)
      fauna.update(dt, t, camera, u);
      if (raceFlock && raceOn !== uu > 0.6) { raceOn = uu > 0.6; for (let i = 0; i < raceParts.length; i++) { const q = raceParts[i]; if (q.m) q.m.count = raceOn ? q.n : 1; else q.g.instanceCount = raceOn ? q.n : Math.min(1, q.n); } }
      air.update(dt, t, camera);
      cab.fit(camera); camera.updateMatrixWorld(); (uu > 0 ? camera.matrixWorld : cabAtStart).decompose(cab.object.position, cab.object.quaternion, _x);
      cab.object.visible = uu > 0;   // seen through the previous portal (u is 0) the cab is only a bare frame from behind: leave it out of that picture
      cab.object.rotateZ(0.0035 * rock); cab.object.translateY(0.004 * Math.sin(t * 7.3) + 0.006 * rock);
      const sweep = L.wipe ? stroke((t % 2.5) / 1.05) : dryGlass ? 0 : Math.max(stroke((uu - 0.006) / 0.03), stroke((uu - 0.575) / 0.018));
      cab.update(t, sweep, rock, 0.62 + 0.03 * Math.sin(t * 0.4));
      if (!dryGlass && (L.wipe ? t > 0.6 : uu > 0.021)) cab.uniforms.uClean.value = 1;
      cab.uniforms.uBeads.value = beads0 * (L.rain ? 1 : 1 - 0.85 * sm(0.03, 0.13, uu));     // once the rain has stopped the beads at the edges dry off in the wind of the run
    };
    update(0, 0, ctx.camera || new THREE.PerspectiveCamera(), 0);

    return {
      scene, path, duration: DUR,
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 26 },
      pois: [{ at: [70, 12, 388], from: 0.33, to: 0.5, weight: 0.6, fade: 0.3 }, { at: [420, 0, 335], from: 0.46, to: 0.64, weight: 0.7, fade: 0.25 }, { at: [0, EYE, 8], from: 0.65, to: 0.83, weight: 0.3 }],
      portal: { shape: 'circle', radius: 7, color: '#ffe9b8', glow: 1, revealDistance: 300, blendDistance: 25 },
      post: { exposure: L.exposure, bloom: { strength: L.bloom, radius: 0.6, threshold: L.thr || 0.92 }, grade: { saturation: L.sat, contrast: lookId === 'washed' ? 1.09 : 1.05, tint: L.tint, shadowTint: L.shadowTint || '#000000', vignette: 0.28, grain: 0.02 } },
      ride: 'none',
      update,
      dispose() {
        sky.dispose?.(); hero.dispose(); skyline.dispose?.(); fall.dispose?.();
        for (const g of nearV) g.dispose(); for (const g of farV) g.dispose(); rootV[0].dispose();
      },
    };
  },
};
