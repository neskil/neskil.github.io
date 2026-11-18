// CANYON OF THREE AIRS: a canyon filled with three gases too heavy to mix, lying on one another like stacked
// seas. We sink through each surface in turn and surf the never-breaking curl on the rose/amber surface.
// World frame = the hero's frame (S1 calm level y 0, crest along X, lip toward +Z). The canyon axis runs along
// A = (0.643, 0, -0.766); B = (0.766, 0, 0.643) is across it. S0 (rose top) y 260, S2 (teal top) y -300, floor -480.
import * as THREE from 'three';
import { makePath, clamp, smoothstep, lerp } from '../kit/core.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, SWELL_GLSL, SKIN_GLSL, swellAt } from '../parts/canyon-of-three-airs.js';

const AX = 0.643, AZ = -0.766, BX = 0.766, BZ = 0.643;
const S0 = 260, S2 = -300, FLOOR = -480;
const W = (a, b, y) => new THREE.Vector3(AX * a + BX * b, y, AZ * a + BZ * b);
const AIRS = [
  { name: 'Canyon of Three Airs', c: ['#F4B8C4', '#F0B254', '#2FA7A0'], deep: '#12494E', rust: '#C4472E' },
  { name: 'Canyon of Three Airs: Lilac Tide', c: ['#C9B4F0', '#F2DC8A', '#3F4FB0'], deep: '#1A2060', rust: '#B8562E' },
  { name: 'Canyon of Three Airs: Pearl and Coral', c: ['#EBD0D8', '#F08A6A', '#3A78D0'], deep: '#122A70', rust: '#A83A4E' },
];

const NOISE = /* glsl */`
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
`;
// the layer a world point sits in: a 3 m step at each surface with a cream skin line between, never a blend
const LAYER = SWELL_GLSL + /* glsl */`
uniform vec3 uC0, uC1, uC2, uLv, uFogCol; uniform float uTime, uFogDen;
vec4 c3aLayer(vec3 p, out float line){
  float sw = c3aSwell(p.xz, uTime);
  float a0 = smoothstep(-1.5, 1.5, p.y - uLv.x - sw * 0.5);
  float a1 = smoothstep(-1.5, 1.5, p.y - uLv.y - sw);
  float a2 = smoothstep(-1.5, 1.5, p.y - uLv.z - sw * 0.4);
  vec3 c = mix(uC2, uC1, a2); c = mix(c, uC0, a1); c = mix(c, vec3(1.), a0);
  line = max(max(a0 * (1. - a0), a1 * (1. - a1)), a2 * (1. - a2)) * 4.;
  return vec4(c, a0 + a1 + a2);
}
vec3 c3aFog(vec3 col, vec3 wp){
  float d = distance(wp, cameraPosition) * uFogDen;
  return mix(uFogCol, col, exp(-d * d));
}
`;
const ROCK_VS = /* glsl */`
attribute vec3 aCol; varying vec3 vW, vN, vCol;
#ifdef TERR
attribute float aF; varying float vF;
#endif
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  // a spire is a unit cone stretched many times taller than wide: the normal has to be stretched the other way
  mat3 m3 = mat3(m); vec3 s2 = max(vec3(dot(m3[0], m3[0]), dot(m3[1], m3[1]), dot(m3[2], m3[2])), vec3(1e-6));
  vec4 wp = m * vec4(position, 1.); vW = wp.xyz; vN = m3 * (normal / s2); vCol = aCol;
  #ifdef TERR
  vF = aF;
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const ROCK_FS = NOISE + LAYER + /* glsl */`
uniform vec3 uSun, uKey, uFill, uFlora0, uFlora1, uFlora2; uniform float uStrata, uLift; uniform vec4 uPools[3];
varying vec3 vW, vN, vCol;
#ifdef TERR
varying float vF;
#endif
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
  vec3 nl = normalize(n + vec3(0., uLift + 1e-4, 0.));                        // the standing stones take the light of the lid as well as the sun's
  float dist = distance(vW, cameraPosition);
  float s = vW.y * 0.42 + 4. * vn(vW.xz * 0.012);
  float band = 0.82 + 0.22 * sin(s) * sin(s * 0.37 + 1.7) + 0.09 * sin(s * 5.3) + 0.1 * (vn(vW.xz * 0.35 + vW.y * 0.6) - 0.5);
  float steep = 1. - smoothstep(0.55, 0.8, n.y);
  vec3 alb = vCol * mix(1., band, uStrata * steep);
  // strata in two or three related colours: warm cream, cool grey, a thin rust course
  vec3 hue = mix(vec3(1.1, 0.97, 0.78), vec3(0.8, 0.92, 1.04), smoothstep(-0.3, 0.3, sin(s * 0.23 + 0.7)));
  hue = mix(hue, vec3(1.1, 0.74, 0.56), smoothstep(0.78, 0.97, sin(s * 0.11 + 2.)) * 0.7);
  alb *= mix(vec3(1.), hue, uStrata * steep);
  float line; vec4 L = c3aLayer(vW, line);
  float a2 = step(0.5, L.w), a1 = step(1.5, L.w), a0 = step(2.5, L.w);
  // above the top skin the rock is the spires' own rock in the sun: bold courses of cream, sage and ochre a dozen metres thick
  float bi = floor(s * 0.19 + 0.6 * sin(s * 0.07 + 1.));
  float bh = h21(vec2(bi, 1.3));
  vec3 bcol = bh < 0.4 ? vec3(1.14, 1.0, 0.78) : (bh < 0.68 ? vec3(0.84, 0.94, 0.84) : vec3(1.2, 0.8, 0.55));
  alb *= mix(vec3(1.), bcol, uStrata * a0 * (0.55 + 0.3 * steep));
  // lichen, one kind to each air: it follows the strata in long hanging rows, never in blobs
  float along = vW.x * ${AX.toFixed(3)} + vW.z * ${AZ.toFixed(3)};
  float pn = vn(vec2(along * 0.034, vW.y * 0.19)) * 0.55 + 0.3 * vn(vec2(along * 0.11, vW.y * 0.45 + 3.)) + 0.15 * vn(vec2(along * 0.6, vW.y * 1.7));
  float shelf = 0.5 + 0.5 * sin(s * 2. + 1.);
  float frT = fract((vW.y - (${FLOOR.toFixed(1)})) / 52.);
  float ao = 1. - 0.34 * (1. - smoothstep(0., 0.17, frT)) - 0.22 * smoothstep(0.78, 0.92, frT);
  alb *= mix(1., ao, uStrata * steep);                                       // the foot of each riser and the hollow under each ledge sit in shade
  alb = mix(alb, vec3(1.02, 0.97, 0.86), smoothstep(0.945, 0.985, frT) * steep * uStrata * 0.55);   // the worn pale rim of each ledge
  float hang = 0.3 + 0.7 * smoothstep(0.5, 0.9, frT);
  float patchM = smoothstep(0.5, 0.64, pn * (0.7 + 0.5 * shelf)) * uStrata * (1. - a0) * 0.85 * steep * hang;
  vec3 flora = mix(mix(uFlora2, uFlora1, a2), uFlora0, a1);
  float tips = smoothstep(0.62, 0.8, pn * (0.7 + 0.5 * shelf));
  alb = mix(alb, mix(flora, alb, 0.2) * (0.7 + 0.5 * vn(vec2(along * 1.3, vW.y * 2.2)) + 0.5 * tips), patchM);
  // old tide-lines under each surface
  float tide = smoothstep(0.55, 0.7, vn(vec2(vW.x * 0.3 + vW.z * 0.2, 0.))) * uStrata;
  vec3 dy = vec3(vW.y) - uLv;
  float old = max(max(exp(-abs(dy.x + 9.) * 0.5), exp(-abs(dy.y + 9.) * 0.5)), exp(-abs(dy.z + 9.) * 0.5));
  alb = mix(alb, vec3(0.93, 0.9, 0.82), old * (0.35 + 0.4 * tide) * uStrata);
  float lvl = (1. - steep) * uStrata;
  #ifdef TERR
  // rimstone terraces: the same field that stepped the mesh, cut per pixel so every lip is crisp
  float fw = fwidth(vF), fr = fract(vF), lv = floor(vF);
  float aa = 1. - smoothstep(0.3, 0.8, fw);
  float riser = smoothstep(0.76, 0.8, fr);
  float lip = 1. - smoothstep(0.015, 0.07 + fw, fr);
  float foot = smoothstep(0.5, 0.76, fr) * (1. - riser);
  float pool = smoothstep(0.07, 0.3, fr) * (1. - smoothstep(0.55, 0.76, fr));
  float hsh = h21(vec2(lv, 3.7));
  vec3 poolc = mix(vec3(0.62, 0.72, 0.68), vec3(0.8, 0.8, 0.7), hsh) * (0.82 + 0.25 * vn(vW.xz * 0.21));
  vec3 terr = mix(vec3(0.82, 0.78, 0.68), poolc, pool);
  terr *= 1. - 0.42 * foot;                                                  // the shadow each lip casts on the pool below
  float drip = 0.75 + 0.25 * sin(along * 2.3 + 5. * vn(vW.xz * 0.4)) ;
  terr = mix(terr, vec3(0.6, 0.57, 0.5) * drip, riser);
  terr = mix(terr, vec3(1.02, 0.97, 0.84), lip);
  // pale ground-fog sliding between the lips
  float gfog = smoothstep(0.4, 0.78, vn(vW.xz * 0.03 + vec2(uTime * 0.07, -uTime * 0.045)) * 0.7 + 0.3 * vn(vW.xz * 0.11 - vec2(uTime * 0.11, 0.)));
  terr = mix(terr, vec3(0.93, 0.98, 0.95), gfog * (0.25 + 0.4 * pool + 0.3 * foot) * 0.75);
  alb = mix(alb, mix(vec3(0.74, 0.74, 0.66), terr, aa), 0.92);
  #else
  // level rock: wind-scoured streaks and cracked plates, quiet enough to sit under whatever lies on it
  float plates = vn(vW.xz * 0.045 + 7.) * 0.6 + vn(vW.xz * vec2(0.011, 0.07)) * 0.4;
  float crack = smoothstep(0.44, 0.47, abs(fract(vn(vW.xz * 0.09 + 2.) * 3.) - 0.5));
  alb *= mix(vec3(1.), mix(vec3(0.74, 0.66, 0.56), vec3(1.02, 0.98, 0.9), plates) * (1. - 0.3 * crack * (1. - smoothstep(60., 220., dist))), lvl);
  // the strata worn through on the level: each plate inside its crack line is one course, cream, cool grey or rust
  float crs = floor(vn(vW.xz * 0.09 + 2.) * 3. + 0.5) + floor(vn(vW.xz * 0.021 + 9.) * 4.);
  float ch = h21(vec2(crs, 5.3));
  vec3 course = ch < 0.4 ? vec3(1.07, 0.93, 0.8) : (ch < 0.72 ? vec3(0.84, 0.9, 0.99) : vec3(1.08, 0.76, 0.66));
  course = mix(course, ch < 0.4 ? vec3(1.12, 0.96, 0.72) : (ch < 0.72 ? vec3(0.8, 0.93, 0.84) : vec3(1.2, 0.76, 0.5)), a0);
  alb *= mix(vec3(1.), course, lvl * (0.7 + 0.25 * a0));
  // and wide worn courses that still read from across the canyon: a seam line between each and the next
  float topo = vn(vW.xz * 0.017 + 4.) * 7. + vW.y * 0.03;
  float tf = fract(topo), seam = (1. - smoothstep(0., 0.45, tf)) * smoothstep(0., 0.04, tf);    // each course throws a soft shadow on the one below
  alb *= mix(1., (0.82 + 0.3 * h21(vec2(floor(topo), 2.1))) * (1. - 0.24 * seam), lvl * 0.85);
  #endif
  float sand = vn(vec2(along * 0.045 - uTime * 0.9, vW.x * ${BX.toFixed(3)} * 0.3 + vW.z * ${BZ.toFixed(3)} * 0.3)) * vn(vec2(along * 0.013 - uTime * 0.35, vW.z * 0.02 + 5.));
  alb *= 1. + lvl * a0 * (smoothstep(0.2, 0.55, sand) * 0.5 - 0.12) * (1. - smoothstep(150., 500., dist));
  float key = max(dot(nl, uSun), 0.);
  vec3 col = alb * (uKey * key + uFill * (0.5 + 0.35 * nl.y)) * mix(vec3(1.), L.rgb, 0.45);
  // gold caustics in the lowest air: a fine net that drifts and breaks into dapples
  vec2 cw = vW.xz * 0.05 + 1.7 * vec2(vn(vW.xz * 0.023 + uTime * 0.05), vn(vW.zx * 0.023 - uTime * 0.04)) + vW.y * 0.02;
  float ca = abs(sin(cw.x * 1.9 + uTime * 0.31)), cb = abs(sin(cw.y * 1.7 - uTime * 0.27)), cc = abs(sin((cw.x + cw.y) * 1.3 + uTime * 0.2));
  float cn = 1. - min(ca, min(cb, cc)); cn *= cn; cn *= cn; cn *= cn; cn *= cn;
  float dap = smoothstep(0.3, 0.7, vn(vW.xz * 0.009 + vec2(uTime * 0.03, -uTime * 0.02)));
  float up = 0.06 + 0.94 * max(n.y, 0.); up *= up;
  col += (1. - a2) * vec3(1., 0.78, 0.38) * (cn * dap * dap * 0.5 + 0.05 * dap) * up * (1. - smoothstep(250., 600., dist));
  // pools of light under the shafts
  vec3 pl = vec3(0.);
  for (int i = 0; i < 3; i++) { vec2 d = vW.xz - uPools[i].xy; pl += vec3(1., 0.8, 0.42) * uPools[i].w * exp(-dot(d, d) / max(uPools[i].z * uPools[i].z, 1.)); }
  col += alb * pl * (1. - a2) * up;
  float dapl = vn(vec2(vW.x * 0.03 + vW.y * 0.02 + uTime * 0.55, vW.z * 0.03 - uTime * 0.4)) * 0.6 + 0.4 * vn(vec2(vW.x * 0.11 - uTime * 0.9, vW.y * 0.09 + vW.z * 0.1));
  col *= 0.8 + 0.4 * dapl;
  col += vec3(1., 0.96, 0.86) * line * 0.7 * (1. - smoothstep(50., 240., dist));   // the skin line shows on rock close by; far off it would rule a straight line along the wall
  col += uFogCol * 0.07;                                                     // never pure black, in any air
  col = max(col, vec3(0.034, 0.038, 0.056) + uFogCol * 0.09);
  gl_FragColor = vec4(c3aFog(col, vW), 1.);
}`;
const SHEET_VS = SWELL_GLSL + /* glsl */`
uniform float uTime, uLevel, uAmp, uRidge, uUp; uniform vec4 uHole; uniform vec4 uHoles[3]; uniform vec4 uSag[2];
varying vec3 vW; varying float vRidge, vVault, vSag;
void main(){
  vec3 p = position; p.y = uLevel + c3aSwell(p.xz, uTime) * uAmp;
  // the rest of the billow train, standing down the canyon behind the hero
  float zz = p.z - uHole.z + 780.;
  float m = (1. - smoothstep(-80., 0., zz)) * uRidge;
  float ph = zz * 0.0157 + 0.0012 * p.x + 0.35 * sin(p.x * 0.004);
  float c = 0.5 + 0.5 * cos(ph);
  vRidge = c * c * c * m * uUp; p.y += vRidge * 62.; p.z += vRidge * 24.;      // uUp 0 once the camera is under the skin: the far train sinks back level with the ceiling
  // seen from inside the amber every billow of the train is a long rounded vault in the one unbroken ceiling
  float vv = 0.;
  for (int i = 0; i < 3; i++) {
    vec4 h = uHoles[i]; float wz = h.w - h.z, hy = max(h.y, 1.);
    float fx = 1. - smoothstep(hy * 0.5, hy * 0.97, abs(p.x - h.x));
    float t = clamp((p.z - (h.z + wz * 0.44)) / max(wz * 0.4, 1.), -1., 1.);
    float cz = 0.5 + 0.5 * cos(3.14159 * t);
    vv = max(vv, fx * cz * cz * wz / 530.);
  }
  vVault = vv * (1. - uUp) * uRidge; p.y += vVault * 66.;
  // and the troughs before two billows of the train hang down into the amber as long rounded bellies
  float sg = 0.;
  for (int i = 0; i < 2; i++) {
    vec2 d = (p.xz - uSag[i].xy) / max(uSag[i].zw, vec2(1.));
    float q = clamp(1. - dot(d, d), 0., 1.);
    sg = max(sg, q * q * (3. - 2. * q));
  }
  vSag = sg * (1. - uUp) * uRidge; p.y -= vSag * (46. + 5. * sin(uTime * 0.21 + p.x * 0.01));
  vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const SHEET_FS = NOISE + LAYER + SKIN_GLSL + /* glsl */`
uniform vec3 uBelow, uAbove, uSun, uKey, uFill, uGold, uBody; uniform vec4 uHole; uniform vec4 uBars[3]; uniform vec4 uHoles[3];
// where a rolled billow stands in for the skin: 1 inside its footprint (x centre, half length, z back, z front), soft and uneven at the edge
float c3aCut(vec4 h, vec3 w, float inset, float jit){
  float hx = 1. - smoothstep(h.y - 45. - inset, h.y - inset * 0.4, abs(w.x - h.x) + jit);
  float hz = smoothstep(h.z + inset * 0.5, h.z + 45. + inset * 1.5, w.z - jit) * (1. - smoothstep(h.w - 45. - inset * 1.7, h.w - inset * 0.7, w.z + jit));
  return hx * hz;
}
float c3aNear(vec4 h, vec3 w){
  float dx = max(abs(w.x - h.x) - h.y, 0.), dz = max(max(h.z - w.z, w.z - h.w), 0.);
  return 1. - smoothstep(0., 300., sqrt(dx * dx + dz * dz + 1e-4));
} uniform float uLevel, uRidge, uGlit, uAlpha, uGhost, uLid, uUp, uAmp; uniform vec3 uSunC;
// one billow of the train seen through the top skin: x = body of the bar, y = its bright curling crest
vec2 c3aBar(vec2 p, vec4 b){
  float bx = 1. - smoothstep(0.5 * b.w, b.w, abs(p.x - b.y));
  float dz = (p.y - b.x) / (125. * b.z);
  float e = dz - 0.6;
  return vec2(exp(-dz * dz), exp(-e * e * 11.)) * bx * (0.5 + 0.5 * b.z);
}
varying vec3 vW; varying float vRidge, vVault, vSag;
void main(){
  vec3 V = cameraPosition - vW; float dist = length(V) + 1e-3; V /= dist;
  float above = step(vW.y, cameraPosition.y);
  float graze = 1. - abs(V.y);
  // coin glitter, twinkling
  vec2 q = vW.xz * 1.1 + vec2(uTime * 0.3, 0.);
  vec2 ci = floor(q); float hsh = h21(ci);
  float tw = 0.5 + 0.5 * sin(uTime * (2. + 3. * hsh) + hsh * 40.);
  float near = 1. - smoothstep(40., 190., dist); vec2 cf = fract(q) - 0.5; float spot = 1. - smoothstep(0.02, 0.16, dot(cf, cf));
  float rows = 0., gl = 0.;
  vec3 col; float alpha;
  vec3 hlf = normalize(V + uSun + vec3(0., 1e-3, 0.));
  if (above > 0.5) {
    // FROM ABOVE the skin is a surface: slow swells that shade and catch a crisp sheen, cells of mineral scum with cream walls,
    // small rafts riding at their hearts, short broken wind-rows lying across the canyon; all of it sinks into the air's colour far off
    float rdg = clamp(uRidge, 0., 1.);
    float fineK = 1. - smoothstep(70., 300., dist), midK = 1. - smoothstep(500., 1700., dist);
    vec2 sp = vW.xz; float e = 1.6;
    // (the swells are laid in a frame turned so their crests lie across the canyon: long backs, each a few of its own lengths wide)
    vec2 wsc = mix(vec2(1.7, 0.55), vec2(0.95), uLid);                               // (the lid is flown over on every heading: its chop has no grain)
    vec2 wq = mix(vec2(dot(sp, vec2(0.985, -0.17)), dot(sp, vec2(0.17, 0.985))), sp, uLid) * wsc;
    float h0 = c3aChop(wq, uTime, fineK), hx = c3aChop(wq + vec2(e, 0.), uTime, fineK), hz = c3aChop(wq + vec2(0., e), uTime, fineK);
    vec2 sq = vec2(hx - h0, hz - h0) / e * wsc;
    vec2 slope = c3aSwellG(sp, uTime) * uAmp * mix(3., 0.9, uLid) + mix(vec2(0.985 * sq.x + 0.17 * sq.y, -0.17 * sq.x + 0.985 * sq.y), sq, uLid) * (0.3 + 0.7 * midK);
    vec3 n = normalize(vec3(-slope.x, 1., -slope.y));
    float rel = -(slope.x * uSun.x + slope.y * uSun.z);
    float shade = clamp(1. + 2.6 * rel + 0.14 * (h0 - 2.), 0.58, 1.34);
    float nh = max(dot(n, hlf), 0.), nh8 = nh * nh; nh8 *= nh8; nh8 *= nh8; float nh64 = nh8 * nh8; nh64 *= nh64; nh64 *= nh64;
    vec3 base0 = uBelow * (0.7 + 0.25 * vRidge + 0.45 * uLid) * (0.75 + 0.25 * uKey);
    // the middle skin is the same deep amber as the rolled billow standing in it, so the two meet without an edge
    vec3 base1 = uBody * (uKey * vec3(1., 0.95, 0.8) * (0.62 + 0.3 * vRidge) + uFill * vec3(1.05, 0.9, 0.62) * 0.73) * 1.08;
    float prox = max(c3aNear(uHoles[0], vW), max(c3aNear(uHoles[1], vW), c3aNear(uHoles[2], vW))) * rdg;
    base1 = mix(base1, uBody * (uKey * vec3(1., 0.95, 0.8) * 0.72 + uFill * vec3(1.05, 0.9, 0.62) * 0.66), prox * 0.85);
    col = mix(base0, base1, rdg) * shade;
    col *= 1. + 0.3 * nh8 * (1. - 0.6 * uLid);                                    // the satin sheen, in the skin's own colour
    col += uKey * nh64 * (0.12 + 0.9 * step(0.55, hsh) * spot * near) * mix(vec3(1.), vec3(1., 0.86, 0.6), rdg);   // and the sun's glint, broken into sparks
    // cells of scum
    vec2 cp = (sp + vec2(0.5, 0.3) * uTime + 4. * vec2(vn(sp * 0.05 + 2.), vn(sp * 0.05 + 9.))) / 6.5;
    vec2 cw = fwidth(cp); float caa = max(cw.x, cw.y);
    vec4 ce = c3aCells(cp);
    float scumP = smoothstep(0.4, 0.68, vn(sp * 0.011 + vec2(uTime * 0.01, 4.)) * 0.7 + 0.3 * vn(sp * 0.04 + 3.));
    float wall = 1. - smoothstep(0.03, 0.08 + caa * 1.2, ce.x);
    wall = mix(wall, 0.14, smoothstep(0.1, 0.4, caa)) * scumP * smoothstep(0.3, 0.62, vn(sp * 0.19 + 4.)) * (1. - 0.55 * uLid);
    float rr = length(ce.zw) * 6.5, isR = step(0.93, ce.y), rfade = 1. - smoothstep(0.08, 0.3, caa);
    float raft = isR * (1. - smoothstep(0.6, 0.85 + caa * 6.5, rr)) * rfade;
    float rring = isR * (1. - smoothstep(0., 0.25, abs(rr - 1.7 - 0.4 * sin(uTime * 1.3 + ce.y * 40.)))) * rfade;
    // wind-rows: short, broken, lying across the canyon, never a line that runs to the vanishing point
    vec2 rd = vec2(dot(sp, vec2(0.17, 0.985)), dot(sp, vec2(0.985, -0.17)));
    float rowsN = smoothstep(0.6, 0.78, vn(vec2(rd.x * 0.03 + uTime * 0.03, rd.y * 0.15) + 1.7 * vn(sp * 0.012)))
      * smoothstep(0.35, 0.6, vn(sp * 0.02 + 7.)) * (1. - smoothstep(250., 800., dist)) * (1. - uLid);
    vec3 cream = vec3(1., 0.95, 0.85);
    vec3 scum = mix(cream, mix(base0, base1, rdg) * 1.6, 0.3);
    col = mix(col, scum * (0.55 + 0.45 * uKey), clamp(wall * 0.45 + rowsN * 0.2, 0., 0.7));
    col = mix(col, scum * (0.5 + 0.55 * uKey), raft * 0.85);
    col *= 1. - 0.35 * isR * (1. - smoothstep(0.2, 0.45, rr)) * rfade;
    col += scum * rring * 0.22;
    // glitter gathers along the cell walls
    float gath = 1. - smoothstep(0.02, 0.3, ce.x);
    col += cream * step(0.9 - 0.25 * gath, hsh) * tw * near * spot * 2. * uGlit;
    col += vec3(0.72, 1., 0.9) * (wall * 0.22 + 0.05 * nh8) * uLid;
    // at a grazing angle the skin mirrors its own air, kept in colour
    float fz = 1. - clamp(V.y, 0., 1.); fz *= fz; fz *= fz;
    col = mix(col, mix(uFogCol, mix(base0, base1, rdg), 0.55) * 1.04, fz * 0.5);
    alpha = mix(mix(uAlpha, 0.97, graze * graze * graze), mix(0.5, 0.97, 1. - V.y * V.y), rdg);
    alpha = max(alpha, max(raft * 0.9, wall * 0.5));
    if (uGhost > 0.5) {
      // the billow train showing through the skin as gold bars with bright crests (the look-down ray, bent steeply as it enters)
      vec2 p2 = vW.xz - V.xz * 60.;
      vec2 bar = c3aBar(p2, uBars[0]) + c3aBar(p2, uBars[1]) + c3aBar(p2, uBars[2]);
      float zz = p2.y - uHole.z + 780.;
      float rc = 0.5 + 0.5 * cos(zz * 0.0157 + 0.0012 * p2.x + 0.35 * sin(p2.x * 0.004));
      float rm = (1. - smoothstep(-80., 0., zz)) * 0.85; rc = rc * rc * rc;
      bar += vec2(rc, rc * rc * rc) * rm;
      float vis = exp(-dist * 0.00022) * (0.7 + 0.3 * vn(p2 * 0.012 + uTime * 0.03));
      col = mix(col, uGold * vec3(1., 0.84, 0.58) * (0.72 + 0.25 * uKey) * shade, clamp(bar.x * 2.2 * vis, 0., 0.9));
      col += vec3(1., 0.92, 0.66) * bar.y * 1.5 * vis * (0.8 + 0.2 * sin(uTime * 0.7 + p2.x * 0.02));
    }
  } else {
    vec2 rp = uGhost > 0.5 ? vec2(vW.z, -vW.x) : vW.xz;       // the top skin's rows lie across the way we fly under it
    rows = smoothstep(0.45, 0.8, vn(vec2(rp.x * 0.012 + rp.y * 0.004, rp.y * 0.09 + 0.3 * vn(vW.xz * 0.02)) + vec2(uTime * 0.02, uTime * 0.22)));
    gl = step(0.8, hsh) * tw * near * spot * 2.2 + rows * 0.25 * (0.6 + 0.4 * vn(vW.xz * 0.2 + uTime * 0.05));
    float win = smoothstep(mix(0.25, 0.03, uLid), mix(0.75, 0.42, uLid), abs(V.y));
    float sunL = max(dot(-V, uSun), 0.); sunL = sunL * sunL; sunL *= sunL; sunL *= sunL;
    float rdg = clamp(uRidge, 0., 1.);
    col = mix(uFogCol * mix(0.7, 1.15, uLid) + uAbove * 0.3 * rdg, uAbove * mix(1.25, 1.02, rdg), win) + vec3(1., 0.9, 0.7) * sunL * sunL * 1.1 * (1. - rdg) * (0.7 + 0.3 * sin(uTime * 1.7 + vW.x * 0.05));
    col += vec3(1., 0.95, 0.85) * rows * 0.22 * win;
    col *= 1. + 0.13 * sin(uTime * 1.4 + vW.x * 0.08 + vW.z * 0.05);
    col *= 0.82 + 0.36 * rows + 0.2 * (vn(vW.xz * vec2(0.004, 0.03) + 7.) - 0.5);   // wind-rows show through even edge-on
    col += vec3(1., 0.95, 0.85) * (gl * uGlit * 0.7 + rows * 0.1);            // coin glitter drifting past overhead
    // close to, the ceiling shows its grain: strands streaming with the wind, a dapple of denser gas
    float det = (1. - smoothstep(50., 260., dist)) * rdg;
    float fs = vn(vec2(vW.x * 0.035 + uTime * 0.12, vW.z * 0.42)) * 0.6 + vn(vec2(vW.x * 0.11 + uTime * 0.2, vW.z * 1.1)) * 0.4;
    col *= mix(1., 0.66 + 0.68 * fs, det);
    // straight overhead the ceiling is bright enough to wash out, so there the strands are drawn in colour: deep rose-gold between pale gold
    float fine = vn(vec2(vW.x * 0.3 + uTime * 0.3, vW.z * 2.3));
    float st = smoothstep(0.28, 0.72, 0.62 * fs + 0.38 * fine);
    col *= mix(vec3(1.), mix(vec3(0.5, 0.4, 0.37), vec3(1.02, 1., 0.96), st), det * (0.4 + 0.6 * win));
    // within a few metres the skin is all fine strands sliding past, never a blank sheet
    float nearC = (1. - smoothstep(8., 52., dist)) * rdg;
    float mic = vn(vec2(vW.x * 0.45 + uTime * 0.5, vW.z * 3.6)) * 0.62 + vn(vec2(vW.x * 1.2 + uTime * 0.9, vW.z * 9.)) * 0.38;
    col *= mix(vec3(1.), mix(vec3(0.66, 0.55, 0.5), vec3(1.04, 1.01, 0.96), smoothstep(0.2, 0.8, mic)), nearC * 0.85);
    // the billows are thicker gas: their vaults and hanging bellies are a deeper gold than the calm skin between them
    float thick = clamp(max(vVault * 0.75, vSag), 0., 1.);
    col = mix(col, col * (uBody * 1.35 + vec3(0.12, 0.08, 0.04)), thick * 0.8);
    col *= 1. + 0.22 * smoothstep(0.02, 0.3, vSag) * (1. - smoothstep(0.3, 0.75, vSag));      // a paler rim where a belly turns under
    // the ceiling keeps its own colour: whatever the rows and the glow add, it rolls off before it reaches white
    float pk = max(col.r, max(col.g, col.b));
    col *= mix(1., (0.9 + 0.22 * (1. - exp(-(pk - 0.9) * 2.5))) / max(pk, 1e-3), step(0.9, pk) * rdg);
    // the sun smeared through the skin above the gasfall, and its road of glitter running up the ceiling toward the eye
    vec3 sd = -V; float scn = max(dot(sd, uSunC), 0.); float s8 = scn * scn; s8 *= s8; s8 *= s8; float s64 = s8 * s8; s64 *= s64; s64 *= s64; float s256 = s64 * s64; s256 *= s256;
    vec2 sh = sd.xz / max(length(sd.xz), 1e-4), ch = uSunC.xz / max(length(uSunC.xz), 1e-4);
    float az = max(dot(sh, ch), 0.); az *= az; az *= az; az *= az; az *= az; az *= az;
    float road = az * az * smoothstep(uSunC.y - 0.12, uSunC.y + 0.15, sd.y) * (1. - smoothstep(0.55, 0.95, sd.y));
    col += rdg * (1. - 0.8 * thick) * vec3(1., 0.93, 0.76) * (s64 * 0.1 + s256 * s256 * 1.4 + road * (0.14 + 0.8 * rows + 1.6 * gl));
    alpha = mix(0.88, mix(0.8, 0.93, win) * (1. - 0.3 * clamp(vRidge, 0., 1.)), rdg);
  }
  float sb = sin(0.045 * vW.x + 0.07 * vW.z + uTime * 0.9) * sin(0.02 * vW.z - 0.03 * vW.x + uTime * 0.6);
  col *= 1. + (0.11 + 0.07 * clamp(uRidge, 0., 1.) * above) * sb;
  col = c3aFog(col, vW);
  // seen from underneath, broad wind-rows stay readable through the haze, so the skin is a streaked ceiling and never a flat slab
  float under = 1. - above;
  vec2 rq = uGhost > 0.5 ? vec2(vW.z, -vW.x) : vW.xz;
  float wr = vn(vec2(rq.x * 0.0035 + 3. + uTime * 0.012, rq.y * 0.022)), wr2 = vn(vec2(rq.x * 0.011 + uTime * 0.03, rq.y * 0.06) + 9.);
  float hz = smoothstep(mix(600., 500., clamp(uRidge, 0., 1.)), mix(1500., 1300., clamp(uRidge, 0., 1.)), dist);   // toward the horizon the rows sink into the haze: no ruled line where a skin ends
  col *= 1. + under * (1. - 0.6 * uLid) * (1. - hz) * (0.6 * (wr - 0.5) + 0.35 * (wr2 - 0.5) + 0.25 * smoothstep(0.6, 0.85, wr));
  // cut to meet the hero's aprons
  float inset = 30. * above, jit = (vn(vW.xz * 0.021 + 3.) - 0.5) * 34.;   // from above the skin laps a little way over the apron's fading edge: no gap between them
  float cutT = max(c3aCut(uHoles[1], vW, inset * 0.7, jit), c3aCut(uHoles[2], vW, inset * 0.6, jit));
  float cut = max(c3aCut(uHoles[0], vW, inset, jit), cutT) * uUp;      // uUp 0 once the camera is inside the amber: no opening anywhere, the ceiling is one sheet
  alpha *= 1. - cut * clamp(uRidge, 0., 1.);
  gl_FragColor = vec4(col, alpha);
}`;
const SKY_FS = /* glsl */`
uniform vec3 uSun, uFogCol, uZen, uHor; uniform float uClear, uTime;
varying vec3 vD;
void main(){
  vec3 d = normalize(vD); float h = max(d.y, 0.);
  float hh = 1. - h; vec3 sky = mix(uHor, uZen, 1. - hh * hh * hh * hh);
  // combed cirrus
  float ci = 0.5 + 0.5 * sin(d.x * 9. / (0.15 + h) + uTime * 0.07 + 3. * sin(d.z * 5. / (0.2 + h) + uTime * 0.04));
  sky += vec3(0.13) * ci * ci * smoothstep(0.05, 0.3, h) * (1. - h);
  float sd = max(dot(d, uSun), 0.); float s2 = sd * sd; s2 *= s2; s2 *= s2; s2 *= s2;
  sky += vec3(1., 0.93, 0.8) * (s2 * s2 * s2 * 0.5 + smoothstep(0.9993, 0.9997, sd) * 5.);
  vec3 inside = uFogCol;                                    // exactly the fog colour, so rock lost in the haze has no outline against it
  gl_FragColor = vec4(mix(inside, sky, uClear), 1.);
}`;

export default {
  id: 'canyon-of-three-airs',
  name: 'Canyon of Three Airs',
  category: 'alien',
  weirdness: 0.55,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || {};
    const scene = new THREE.Scene();
    // ---- variations: which airs, which hour, how many in the cast ----
    const air = AIRS[rng.int(0, 2)];
    const hourSel = vary.hour != null ? (vary.hour < 0.34 ? 1 : vary.hour > 0.67 ? 2 : 0) : rng.int(0, 2);
    const sunEl = [52, 20, 78][hourSel] * Math.PI / 180, sunAz = rng.range(0.3, 0.9);
    const junkCount = rng.pick([7, 7, 3, 1]), skeins = rng.int(2, 4);
    const rare = !!vary.rare;
    const C0 = new THREE.Color(air.c[0]), C1 = new THREE.Color(air.c[1]), C2 = new THREE.Color(air.c[2]);
    const deep = new THREE.Color(air.deep), cream = new THREE.Color('#F7F1E6');
    // sun: off to the side of the surf run so the lip is back-lit
    const sunDir = new THREE.Vector3(Math.cos(sunEl) * Math.sin(sunAz + 1.2), Math.sin(sunEl), Math.cos(sunEl) * Math.cos(sunAz + 1.2)).normalize();
    const keyCol = new THREE.Color(hourSel === 1 ? '#FFD9B0' : '#FFF4E2');
    const U = {
      uTime: { value: 0 }, uC0: { value: C0 }, uC1: { value: C1 }, uC2: { value: C2 },
      uLv: { value: new THREE.Vector3(S0, 0, S2) }, uFogCol: { value: new THREE.Color('#F2E6D2') }, uFogDen: { value: 0.0003 },
      uSun: { value: sunDir }, uKey: { value: keyCol.clone() }, uFill: { value: new THREE.Color('#9db8d8') },
    };
    scene.fog = new THREE.FogExp2(0xf2e6d2, 0.0003);
    scene.background = new THREE.Color(0xf2e6d2);

    // ---- hero: billow four ----
    const palette = [air.c[0], air.c[1], air.c[2], '#F7F1E6', '#5A3F52', air.rust, air.deep];
    const hero = await buildHero(ctx, { palette, sun: { direction: sunDir, color: keyCol.clone().multiplyScalar(0.9) } });
    scene.add(hero.object);
    // the amber skin seen from below: luminous rose-gold (lilac-gold, coral), held to a colour that cannot wash out to white
    const ceilCol = C0.clone().lerp(C1, 0.24); { const h = {}; ceilCol.getHSL(h, THREE.SRGBColorSpace); ceilCol.setHSL(h.h, Math.max(h.s, 0.6), Math.min(h.l, 0.72), THREE.SRGBColorSpace); }
    hero.setCeil(ceilCol);
    const ext = hero.anchors.extent;
    await ctx.yield();

    // ---- sky dome ----
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uSun: U.uSun, uFogCol: U.uFogCol, uTime: U.uTime, uZen: { value: new THREE.Color(hourSel === 2 ? '#5C98DC' : '#3F7FCB') }, uHor: { value: new THREE.Color(hourSel === 1 ? '#F3CFAE' : '#E9D3C4') }, uClear: { value: 1 } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(4200, 32, 16), skyMat);
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

    // ---- rock: walls, floor, spires, arch (one program) ----
    const pools = [new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 1, 0)];
    const rockU = (strata, lift = 0) => ({ ...U, uStrata: { value: strata }, uLift: { value: lift }, uPools: { value: pools },
      uFlora0: { value: C0.clone().lerp(new THREE.Color('#E8788C'), 0.55) }, uFlora1: { value: new THREE.Color(air.rust) }, uFlora2: { value: C2.clone().lerp(deep, 0.3).lerp(new THREE.Color('#BFE8DC'), 0.46) } });
    const rockMat = new THREE.ShaderMaterial({ uniforms: rockU(1), vertexShader: ROCK_VS, fragmentShader: ROCK_FS, side: THREE.DoubleSide });
    const wallAt = (side, a, y) => {            // lateral position of a wall face: stepped mesas, widening upward
      const h = (y - FLOOR) / 52, fl = Math.floor(h), fr = h - fl;
      const step = (fl + smoothstep(0.92, 1, fr)) * 15;                       // a tall riser, then a ledge 15 m deep
      const flute = noise.fbm2(a * 0.006 + side * 9, y * 0.012, 3) * 16 + noise.n2(a * 0.03, y * 0.05 + side * 5) * 4;
      const bt = 1 - Math.abs(noise.n2(a * 0.011 + fl * 3.7, side * 7.3 + fl * 1.9)), butt = bt * bt * bt * 13;   // promontories, different on every tier
      return side > 0 ? 440 + step + flute - butt : -470 - step - flute * 1.4 + butt;
    };
    const RIM = S0 + 42, FA0 = 380, FA1 = 984, FY0 = FLOOR + 104, FY1 = FLOOR + 520;
    const mkWall = async (side, a0, a1, NA, y0, NY) => {
      const pos = new Float32Array((NA + 1) * (NY + 1) * 3), col = new Float32Array(pos.length), idx = [];
      for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NA; i++) {
          const a = a0 + (a1 - a0) * i / NA, y = y0 + (S0 + 60 - y0) * j / NY, k = (j * (NA + 1) + i) * 3;
          const top = y > S0 + 45;                                              // the rim plateau, running far back from the edge
          const fine = side > 0 ? 16 * smoothstep(FA0, FA0 + 30, a) * (1 - smoothstep(FA1 - 30, FA1, a)) * smoothstep(FY0, FY0 + 26, y) * (1 - smoothstep(FY1 - 26, FY1, y)) : 0;   // stand back behind the fine stretch
          const b = wallAt(side, a, Math.min(y, S0 + 40)) + (top ? side * 1100 : 0) + fine;
          pos[k] = AX * a + BX * b; pos[k + 1] = top ? RIM + 14 : Math.min(y, RIM); pos[k + 2] = AZ * a + BZ * b;
          const t = 0.74 + 0.1 * noise.n2(a * 0.01, y * 0.03);
          col[k] = 0.72 * t / 0.78; col[k + 1] = 0.66 * t / 0.78; col[k + 2] = 0.58 * t / 0.78;
          if (i < NA && j < NY) { const p = j * (NA + 1) + i; side > 0 ? idx.push(p, p + 1, p + NA + 1, p + 1, p + NA + 2, p + NA + 1) : idx.push(p, p + NA + 1, p + 1, p + 1, p + NA + 1, p + NA + 2); }
        }
        if (j % 6 === 5) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
      g.setIndex(idx); await ctx.yield(); g.computeVertexNormals();
      const wall = new THREE.Mesh(g, rockMat); wall.frustumCulled = false; scene.add(wall);
      await ctx.yield();
    };
    for (const side of [1, -1]) {
      await mkWall(side, -1500, 2400, 177, FLOOR - 10, 60);
      await mkWall(side, 2400, 4300, 32, S0 - 80, 8);          // the canyon runs on into the haze: only its rim shows from the clear air
    }

    // ---- the east wall where the camera passes it: the same wall at 4 m, rows set on every ledge so the steps are real ----
    {
      const FR = [0.001, 0.12, 0.25, 0.4, 0.55, 0.7, 0.82, 0.9, 0.925, 0.96, 0.999], NA = 151, rows = [];
      for (let t = 2; t < 10; t++) for (const f of FR) rows.push(FLOOR + 52 * (t + f));
      const NY = rows.length, pos = new Float32Array(NA * NY * 3), col = new Float32Array(NA * NY * 3), idx = [];
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NA; i++) {
          const a = FA0 + (FA1 - FA0) * i / (NA - 1), y = rows[j], k = (j * NA + i) * 3;
          const b = wallAt(1, a, y) - 0.8 + 1.4 * noise.n2(a * 0.11, y * 0.23);
          pos[k] = AX * a + BX * b; pos[k + 1] = y; pos[k + 2] = AZ * a + BZ * b;
          const t = 0.74 + 0.1 * noise.n2(a * 0.01, y * 0.03);
          col[k] = 0.72 * t / 0.78; col[k + 1] = 0.66 * t / 0.78; col[k + 2] = 0.58 * t / 0.78;
          if (i < NA - 1 && j < NY - 1) { const p = j * NA + i; idx.push(p, p + 1, p + NA, p + 1, p + NA + 1, p + NA); }
        }
        if (j % 10 === 9) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
      g.setIndex(idx); await ctx.yield(); g.computeVertexNormals();
      const fw = new THREE.Mesh(g, rockMat); fw.frustumCulled = false; scene.add(fw);
      await ctx.yield();
    }

    // ---- mesas standing back from both rims: stepped tiers, so the canyon reads as a river between walls ----
    {
      const P = [], C = [], I = [], M = 16;
      const tier = (a, b, y0, y1, r, key) => {
        const base = P.length / 3, t = 0.9 + 0.12 * noise.n2(a * 0.02 + key, b * 0.02);
        for (let ring = 0; ring < 2; ring++) for (let i = 0; i <= M; i++) {
          const th = (i % M) / M * Math.PI * 2, rr = r * (0.78 + 0.34 * noise.n2(Math.cos(th) * 1.2 + a * 0.011 + key, Math.sin(th) * 1.2 + b * 0.011)) * (ring ? 0.9 : 1.08);
          const da = Math.cos(th) * rr * 1.7, db = Math.sin(th) * rr;
          P.push(AX * (a + da) + BX * (b + db), ring ? y1 : y0, AZ * (a + da) + BZ * (b + db)); C.push(0.82 * t, 0.67 * t, 0.54 * t);
        }
        for (let i = 0; i < M; i++) { const p = base + i, q = p + M + 1; I.push(p, q, p + 1, p + 1, q, q + 1); }
        const cb = P.length / 3;                                                // flat top, its own vertices so the edge stays crisp
        for (let i = 0; i <= M; i++) { const k = (base + M + 1 + i) * 3; P.push(P[k], y1, P[k + 2]); C.push(0.86 * t, 0.76 * t, 0.64 * t); }
        P.push(AX * a + BX * b, y1 + 2, AZ * a + BZ * b); C.push(0.86 * t, 0.76 * t, 0.64 * t);
        for (let i = 0; i < M; i++) I.push(cb + i, cb + M + 1, cb + i + 1);
      };
      const mr = rng.fork('mesas');
      for (let a = -1250; a < 4200; a += mr.range(150, 260)) for (const side of [1, -1]) {
        const r = mr.range(70, 150), h = mr.range(80, 230), out = mr.range(60, 420), tiers = mr.int(2, 4);
        if (side < 0 && a < -640) continue;                                     // the entry ledge stays open
        const b = side * (705 + r + out); let rr = r, y = RIM + 2;
        for (let k = 0; k < tiers; k++) { const th = h / tiers * mr.range(0.8, 1.25); tier(a, b, y - 6, y + th, rr, k * 7.3 + side); y += th; rr *= mr.range(0.6, 0.78); }
      }
      // one mesa stands near on the entry ledge, left of the way in: the first thing with weight and shadow in the frame
      { let rr = 46, y = RIM + 2; for (const th of [54, 43, 32]) { tier(-556, -759, y - 6, y + th, rr, 91.7 + th); y += th; rr *= 0.72; } }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      g.setIndex(I); g.computeVertexNormals();
      const mesas = new THREE.Mesh(g, rockMat); mesas.frustumCulled = false; scene.add(mesas);
      await ctx.yield();
    }

    // ---- the path (a along the canyon, b across it, y) ----
    const An = hero.anchors, fly = An.flyThrough, f10 = fly[10];
    // height of the hero's face/trough skin at a hero-frame point in front of the crest
    const s1H = (x, z) => { let best = 0, bd = 1e9; const o = {}; for (let k = 0; k <= 36; k++) { hero.facePoint(x, k / 36 * 0.6, o); const d = Math.abs(o.z - z); if (d < bd) { bd = d; best = o.y; } } return best; };
    const dvx = f10.x + 170, dvz = f10.z + 16, dvy = s1H(dvx, dvz), dvA = AX * dvx + AZ * dvz, dvB = BX * dvx + BZ * dvz;
    // The dive through the face of the unwinding curl is laid against the face itself (at rest, without its breathing lobes), so that on
    // every seed the camera goes through the skin once and steeply: from 6.5 m over it to 6.5 m under it in 36 m of flight, never gliding
    // along it. kc is the first place down the track where the path can come down to that without dropping faster than 1 in 3.
    const trk = (k) => [f10.x + k, f10.z + 5 + 11 * clamp((k - 60) / 110, 0, 1.3)];
    const restH = (k) => { const q = trk(k), h = hero.faceHeight(q[0], q[1], 0, 0); return h === h ? h : 0; };
    const yA = Math.max(f10.y - 6, restH(60) + 6.5);
    let kc = 190, bestClear = -1e9;
    for (let k = 80; k <= 190; k += 4) {
      const y1 = restH(k - 18) + 6.5, run = k - 78;
      if (y1 > yA + 3 || yA - y1 > 0.32 * run + 0.1) continue;
      let clear = 1e9;
      for (let j = 1; j <= 6; j++) { const kk = 60 + (k - 78) * j / 6; clear = Math.min(clear, lerp(yA, y1, j / 6) - restH(kk)); }
      if (clear >= 4.5) { kc = k; bestClear = 9; break; }
      if (clear > bestClear) { bestClear = clear; kc = k; }
    }
    const qB1 = trk(kc - 18), qB2 = trk(kc + 18), yB1 = restH(kc - 18) + 6.5, yB2 = Math.min(restH(kc + 18) - 6.5, yB1 - 9);
    const yN = Math.min(dvy - 24, yB2 - 8);
    const divePts = [new THREE.Vector3(qB1[0], yB1, qB1[1]), new THREE.Vector3(qB2[0], yB2, qB2[1])];
    const pLevel = W(dvA + 196, dvB + 62, Math.min(dvy - 40, -50, yN - 8)), pFall = W(712, 378, -263), pS2 = W(815, 374, -318);
    if (kc - 78 >= 22) divePts.unshift(new THREE.Vector3(f10.x + 60, yA, f10.z + 5));
    // The way in: high over the west rim, heading down the canyon so the river runs to its vanishing point between both walls; down past the
    // elder skimmers and through the top skin; a long look at the whole curl across the amber sea; past the lead junk; then round in front of
    // the lip, its filaments against the rose, and in under it onto the surf line.
    const pts = [W(-1100, -692, 332), W(-1042, -670, 328), W(-960, -636, 316), W(-890, -598, 297), W(-835, -540, 252), W(-792, -452, 178),
      new THREE.Vector3(-640, 70, 330), new THREE.Vector3(-525, 35, 300), new THREE.Vector3(-390, 42, 262), new THREE.Vector3(-250, 50, 230),
      new THREE.Vector3(fly[4].x - 102, fly[4].y + 12, fly[4].z + 77),
      fly[4].clone(), fly[6].clone(), fly[8].clone(), f10.clone(),
      ...divePts,                                                                                       // down through the face of the unwinding curl
      W(dvA + 88, dvB + 44, yN), pLevel,                                                          // a long easy turn down the canyon under the glowing ceiling, the gasfall ahead
      W(500, 356, -106), W(600, 330, -182), pFall,                                                      // out into the canyon so the gasfall stands whole to starboard, then the dive past it
      pS2, W(930, 320, -372), W(1070, 300, -410), W(1230, 300, -437), W(1390, 300, -449), W(1450, 300, -452)];
    const path = makePath(pts);
    const endP = pts[pts.length - 1];
    // where the camera truly goes through the amber skin (crossing two), and the other landmarks, as u
    let uX = 0.55;
    { const pp = new THREE.Vector3(); for (let k = 0; k <= 1200; k++) { const u = 0.4 + 0.3 * k / 1200; path.pointAt(u, pp); if (pp.x < f10.x + 20) continue; const h = hero.faceHeight(pp.x, pp.z, 0, 0); if (pp.y < (h === h ? h : 0) + 0.9) { uX = u; break; } } }
    const FALL_A = 705, fallB = (y) => 440 + 15 * (y - FLOOR) / 52;
    const uOf = (v) => path.nearestXZ(v.x, v.z).u;
    const uSurf = uOf(fly[4]), uFall = uOf(pFall), uS2 = uOf(pS2), uLevel = uOf(pLevel);
    await ctx.yield();
    // THE BELL-FLOATERS LEAVE CLEAR AIR ROUND THE ROUTE (geometry, no fade; by the owner's ruling the route's own line is what is asked).
    // The lens flies exactly the line path.posAtDist(d): that line is handed to the hero every quarter metre OF ITS LENGTH, first metre
    // to last, with the widest gap between two neighbouring places as they fell, and the hero seats every floater where its skin as
    // drawn at its furthest reach leaves CLEAR to the whole line (parts: bellsOff, which says how the gap is allowed for). The hero
    // stands unmoved and unturned in this scene, so the line needs no change of frame.
    // The line is made in pieces and the law handed back between floaters: the hand-backs change no place and draw no number.
    const CLEAR = 2.0;                                                         // metres of clear air between the flown line and every floater's body (the owner's figure for this repair)
    {                                                                          // STEP: a quarter metre, so that the room asked beyond CLEAR for the gap between two places is under a centimetre
      const STEP = 0.25, n = Math.ceil(path.length / STEP), line = new Float64Array((n + 1) * 3), lp = new THREE.Vector3(), was = new THREE.Vector3();
      let gap = 0;
      for (let i = 0; i <= n; i++) {
        path.posAtDist(path.length * i / n, lp).toArray(line, i * 3);
        if (i) gap = Math.max(gap, lp.distanceTo(was));
        was.copy(lp);
        if (i % 1024 === 1023) await ctx.yield();                              // every 1024 places (256 m of line): the figure only keeps a piece of the build short
      }
      await ctx.yield();
      await hero.keepBellsOff(line, gap, CLEAR);
      await ctx.yield();
    }
    const colAttr = (g, r, gg, b) => { const n = g.attributes.position.count, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b; } g.setAttribute('aCol', new THREE.BufferAttribute(c, 3)); return g; };

    // ---- floor ----
    const TA0 = 740, TA1 = 1680, TB0 = 40, TB1 = 500;
    {
      const NA = 95, NB = 30, pos = new Float32Array((NA + 1) * (NB + 1) * 3), idx = [];
      for (let j = 0; j <= NB; j++) for (let i = 0; i <= NA; i++) {
        const a = -1500 + 3900 * i / NA, b = -680 + 1260 * j / NB, k = (j * (NA + 1) + i) * 3;
        const near = path.nearestXZ(AX * a + BX * b, AZ * a + BZ * b);
        const h = FLOOR + noise.fbm2(a * 0.01, b * 0.01, 3) * 9 + Math.abs(noise.n2(a * 0.04, b * 0.04)) * 3;
        const sink = 16 * smoothstep(TA0, TA0 + 60, a) * (1 - smoothstep(TA1 - 60, TA1, a)) * smoothstep(TB0, TB0 + 60, b);
        pos[k] = AX * a + BX * b; pos[k + 1] = Math.min(h - sink, near.dist < 30 ? near.y - 9 : 1e9); pos[k + 2] = AZ * a + BZ * b;
        if (i < NA && j < NB) { const p = j * (NA + 1) + i; idx.push(p, p + NA + 1, p + 1, p + 1, p + NA + 1, p + NA + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const floor = new THREE.Mesh(colAttr(g, 0.7, 0.66, 0.58), rockMat); floor.frustumCulled = false; scene.add(floor);
    }
    await ctx.yield();

    // ---- rimstone terraces of the lowest air: real steps cut from one field; the shader cuts the same field per pixel ----
    {
      const NA = 288, NB = 141, HS = 2, pos = new Float32Array((NA + 1) * (NB + 1) * 3), aF = new Float32Array((NA + 1) * (NB + 1)), idx = [];
      const PS = 70, px = new Float32Array(PS), pz = new Float32Array(PS), py = new Float32Array(PS), pp = new THREE.Vector3();
      for (let i = 0; i < PS; i++) { path.pointAt(uS2 - 0.02 + (1.02 - uS2) * i / (PS - 1), pp); px[i] = pp.x; pz[i] = pp.z; py[i] = pp.y; }
      for (let j = 0; j <= NB; j++) {
        for (let i = 0; i <= NA; i++) {
          const a = TA0 + (TA1 - TA0) * i / NA, b = TB0 + (TB1 - TB0) * j / NB, k = j * (NA + 1) + i, x = AX * a + BX * b, z = AZ * a + BZ * b;
          const mound = 13 * Math.exp(-((a - 1452) * (a - 1452) + (b - 300) * (b - 300) * 1.5) / 28900);
          let F = 8 + mound + 6.5 * noise.fbm2(a * 0.0055, b * 0.0055, 3) + 2.2 * noise.n2(a * 0.021, b * 0.021) + 13 * smoothstep(350, 470, b);
          if (Math.abs(b - 325) < 120) {                              // keep clear under the camera
            let bd = 1e9, by = 0; for (let q = 0; q < PS; q++) { const d = (px[q] - x) * (px[q] - x) + (pz[q] - z) * (pz[q] - z); if (d < bd) { bd = d; by = py[q]; } }
            F = Math.min(F, lerp(by - 13 - FLOOR, 60, smoothstep(24, 80, Math.sqrt(bd))));
          }
          F = Math.max(F, 1);
          const edge = smoothstep(TA0, TA0 + 40, a) * (1 - smoothstep(TA1 - 40, TA1, a)) * smoothstep(TB0, TB0 + 40, b);
          const lv = Math.floor(F / HS), fr = F / HS - lv;
          pos[k * 3] = x; pos[k * 3 + 1] = FLOOR + HS * (lv + smoothstep(0.76, 0.98, fr)) - 18 * (1 - edge); pos[k * 3 + 2] = z; aF[k] = F / HS;
          if (i < NA && j < NB) idx.push(k, k + NA + 1, k + 1, k + 1, k + NA + 1, k + NA + 2);
        }
        if (j % 3 === 2) await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aF', new THREE.BufferAttribute(aF, 1)); g.setIndex(idx);
      await ctx.yield(); g.computeVertexNormals(); await ctx.yield();
      const terrMat = new THREE.ShaderMaterial({ uniforms: rockU(1), vertexShader: ROCK_VS, fragmentShader: ROCK_FS, defines: { TERR: 1 }, side: THREE.DoubleSide });
      const terr = new THREE.Mesh(colAttr(g, 0.8, 0.78, 0.7), terrMat); terr.frustumCulled = false; scene.add(terr);
    }
    await ctx.yield();

    // ---- banded spires in the lowest air, and the natural arch round the exit ----
    const spireList = [];
    {
      // two cuts of the one spire: finely turned for those the camera passes close in the lowest air, plain for the far stand
      const spireGeo = (rad, hs) => {
        const sg = colAttr(new THREE.CylinderGeometry(0.22, 1, 1, rad, hs, false), 0.72, 0.67, 0.6);
        sg.translate(0, 0.5, 0);
        const pp = sg.attributes.position, sc3 = sg.attributes.aCol;
        for (let i = 0; i < pp.count; i++) {                           // courses of cream, grey-green and ochre, the same on every spire
          const y = pp.getY(i), bnd = Math.floor(y * 9 + 0.6 * Math.sin(y * 23)) % 3, c = bnd === 0 ? [0.84, 0.78, 0.66] : bnd === 1 ? [0.7, 0.73, 0.67] : [0.85, 0.68, 0.52];
          sc3.setXYZ(i, c[0], c[1], c[2]);
        }
        for (let i = 0; i < pp.count; i++) {                           // six flutes that twist a little as they climb, courses that stand proud, a weathered cap
          const y = pp.getY(i), th = Math.atan2(pp.getZ(i), pp.getX(i)), fl = rad > 16 ? Math.cos(6 * th + y * 2.6) : 0;
          const f = (1 + 0.065 * Math.sin(y * 44) + 0.1 * Math.sin(y * 13 + 2) + 0.15 * fl * Math.abs(fl)) * (y > 0.95 ? 0.3 : 1); pp.setX(i, pp.getX(i) * f); pp.setZ(i, pp.getZ(i) * f);
        }
        sg.computeVertexNormals();
        return sg;
      };
      // the same rock program as the walls, strata and lichen a little weaker and the light lifted, so the stand stays paler than the canyon behind it
      const spireMat = new THREE.ShaderMaterial({ uniforms: rockU(0.8, 1.1), vertexShader: ROCK_VS, fragmentShader: ROCK_FS, side: THREE.DoubleSide });
      const spN = new THREE.InstancedMesh(spireGeo(24, 24), spireMat, 57), spF = new THREE.InstancedMesh(spireGeo(10, 18), spireMat, 57);
      spN.frustumCulled = false; spF.frustumCulled = false;
      const lateP = []; for (let u = 0.72; u <= 1.001; u += 0.02) lateP.push(path.pointAt(Math.min(u, 1), new THREE.Vector3()));
      let nN = 0, nF = 0;
      const spires = { setMatrixAt(i, m) {
        const x = m.elements[12], z = m.elements[14];
        if (lateP.some((c) => Math.hypot(c.x - x, c.z - z) < 105)) spN.setMatrixAt(nN++, m); else spF.setMatrixAt(nF++, m);
      } };
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
      let n = 0;
      // the lines of sight from the last fifth of the flight to the portal stay open
      const sightP = [0.77, 0.8, 0.83, 0.86, 0.9].map((u) => path.pointAt(u, new THREE.Vector3()));
      const blocksSight = (p, r) => {
        for (const c of sightP) {
          const ex = endP.x - c.x, ez = endP.z - c.z, t = clamp(((p.x - c.x) * ex + (p.z - c.z) * ez) / Math.max(ex * ex + ez * ez, 1), 0, 1);
          if (Math.hypot(p.x - c.x - ex * t, p.z - c.z - ez * t) < r + 9) return true;
        }
        return false;
      };
      for (let tries = 0; tries < 400 && n < 40; tries++) {
        const a = rng.range(700, 1800), b = rng.range(30, 440), r = rng.range(9, 20), hgt = rng.range(60, 180);
        const p = W(a, b, FLOOR - 6), near = path.nearestXZ(p.x, p.z);
        if (near.dist < r + 19 || blocksSight(p, r)) continue;
        if (a > 1250 && Math.abs(b - 300) < 78 && a < 1560) continue;            // keep the arch and its terraces readable
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, 6.28)); sc.set(r, hgt, r); ps.copy(p);
        m4.compose(ps, q, sc); spires.setMatrixAt(n++, m4); spireList.push({ p: p.clone(), r, hgt });
      }
      // the stand that frames the arch: two to the left of the approach, one to the right, a shadowed group behind
      for (const [a, b, r, hgt] of [[1338, 256, 11, 172], [1398, 232, 15, 132], [1436, 356, 9, 96], [1528, 246, 17, 160], [1575, 322, 13, 176], [1548, 398, 11, 124], [1612, 268, 12, 140]]) {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a); sc.set(r, hgt, r); ps.copy(W(a, b, FLOOR - 4)); m4.compose(ps, q, sc); spires.setMatrixAt(n++, m4); spireList.push({ p: ps.clone(), r, hgt });
      }
      // the tallest stand right through the lower skin: needles in the amber air beside the gasfall, columns to the lid from below
      for (const [a, b, r, hgt] of [[905, 412, 15, 262], [1040, 414, 13, 288], [1135, 404, 16, 250], [1010, 150, 17, 336], [1165, 165, 15, 300], [1290, 150, 16, 272], [860, 40, 17, 352], [1310, 420, 14, 240], [930, 250, 15, 318]]) {
        const p = W(a, b, FLOOR - 4); if (path.nearestXZ(p.x, p.z).dist < r + 22 || blocksSight(p, r)) continue;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a * 0.7); sc.set(r, hgt, r); m4.compose(p, q, sc); spires.setMatrixAt(n++, m4);
      }
      spN.count = nN; spF.count = nF; scene.add(spN, spF);
      await ctx.yield();
      // the natural arch: one swept rock rib, thick at the feet, standing on the terraces round the ring
      {
        const K = 84, M = 16, P = [], I = [], OPEN = 19.5;
        const courseOf = (lx, ly) => (ly + 24) / 3.6 + 0.35 * Math.sin(lx * 0.21), hsh = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
        const cl = (t) => {                                          // centre line in the arch's own plane (x across, y up) and the rib's radius there
          const rr = 6.2 + 3.8 * Math.pow(Math.abs(2 * t - 1), 2.2) + 1.5 * noise.n2(t * 5, 3.3), R = OPEN + rr;
          const leg = 0.2, f = t < leg ? 0 : t > 1 - leg ? 1 : (t - leg) / (1 - 2 * leg), th = Math.PI * f;
          const drop = t < leg ? (leg - t) / leg : t > 1 - leg ? (t - 1 + leg) / leg : 0;
          return [Math.cos(th) * R + (t < 0.5 ? 1 : -1) * drop * 3, Math.sin(th) * R * 1.06 - drop * 20, rr];
        };
        for (let k = 0; k <= K; k++) {
          const t = k / K, c = cl(t), c2 = cl(Math.min(1, t + 0.01)), c1 = cl(Math.max(0, t - 0.01));
          let tx = c2[0] - c1[0], ty = c2[1] - c1[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          const crown = 1 + 0.42 * Math.max(0, noise.n2(t * 11, 2.2)) + 0.25 * Math.max(0, noise.n2(t * 27, 8.1));   // the outline is broken: lumps and shoulders, most on its back
          for (let m = 0; m <= M; m++) {
            const ph = (m % M) / M * Math.PI * 2, sqr = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.6), inw = sqr(Math.cos(ph)), sdw = sqr(Math.sin(ph));   // squared off in section: piers and a lintel, not a tube
            let r = c[2] * (1 + 0.16 * noise.n3(c[0] * 0.09, c[1] * 0.09, ph * 1.3 + 7));
            // coursed rock: each course of a few metres stands a little proud of or back from the next, with a raked joint between
            const co = courseOf(c[0] + (-ty) * inw * r, c[1] + tx * inw * r), cf = co - Math.floor(co);
            r *= (0.8 + 0.42 * hsh(Math.floor(co))) * (cf < 0.12 ? 0.9 : 1);
            if (inw < 0) r *= 1 + (crown - 1) * -inw; else r = Math.min(r, c[2] + 1.3 - 0.4 * inw);      // the opening itself stays clear of the ring
            const lx = c[0] + (-ty) * inw * r, ly = c[1] + tx * inw * r, lz = sdw * r * 1.25;
            P.push(endP.x + BX * lx + AX * lz, endP.y + ly, endP.z + BZ * lx + AZ * lz);
          }
        }
        for (let k = 0; k < K; k++) for (let m = 0; m < M; m++) { const p = k * (M + 1) + m, q2 = p + M + 1; I.push(p, p + 1, q2, p + 1, q2 + 1, q2); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
        const arch = new THREE.Mesh(colAttr(g, 0.7, 0.66, 0.6), spireMat); arch.frustumCulled = false; scene.add(arch);
        {                                                                // the rib is the spires' rock: the same three courses, dipping a little, the right pier in the light
          const ap = g.attributes.position, ac = g.attributes.aCol;
          for (let i = 0; i < ap.count; i++) {
            const dx = ap.getX(i) - endP.x, dz = ap.getZ(i) - endP.z, lx = dx * BX + dz * BZ, ly = ap.getY(i) - endP.y;
            const cs = Math.floor(hsh(Math.floor(courseOf(lx, ly)) + 0.5) * 3) % 3, c = cs === 0 ? [0.95, 0.86, 0.68] : cs === 1 ? [0.6, 0.66, 0.62] : [0.93, 0.62, 0.42];
            const inw = Math.cos(((i % (M + 1)) % M) / M * Math.PI * 2);
            const lit = (0.66 + 0.8 * smoothstep(-6, 22, lx)) * (1 - 0.6 * Math.max(0, inw));      // the right pier in the shaft's light, the inside of the opening dark
            ac.setXYZ(i, c[0] * lit, c[1] * lit, c[2] * lit);
          }
        }
      }
    }
    await ctx.yield();

    // ---- the three surfaces: real displaced translucent sheets ----
    const sheets = [];
    const tri = hero.anchors.trainInfo || [];
    const bars = [new THREE.Vector4(20, 0, 1, 590)], holes = [new THREE.Vector4(0, ext.halfLength, ext.back, ext.front)];
    for (let k = 0; k < 2; k++) {
      const t = tri[k];
      bars.push(t ? new THREE.Vector4(t.z + 20 * t.scale, t.x, t.scale, t.length * 0.49) : new THREE.Vector4(-9000, 0, 0.01, 1));
      holes.push(t ? new THREE.Vector4(t.x, t.length * 0.5, t.z - 200 * t.scale, t.z + 330 * t.scale) : new THREE.Vector4(0, -1000, -9000, -8000));
    }
    const amberH = new THREE.Color(C1.r * 0.84, C1.g * 0.74, C1.b * 0.5);
    const bodyCol = new THREE.Color(amberH.r * 0.62, amberH.g * 0.42, amberH.b * 0.34).lerp(new THREE.Color('#5A3F52'), 0.22).lerp(amberH, 0.5);
    const upU = { value: 1 };
    // the top skin from above: the palette's first air, deepened so the river is a colour and not a haze
    const roseDeep = C0.clone(); { const h = {}; roseDeep.getHSL(h, THREE.SRGBColorSpace); roseDeep.setHSL(h.h, Math.min(1, h.s * 1.2 + 0.08), Math.min(h.l, 0.73), THREE.SRGBColorSpace); }
    // the two hanging bellies, in the open canyon to the left of the way from the crossing to the gasfall (x, z, half length, half width)
    const sags = [new THREE.Vector4(415, -213, 165, 78), new THREE.Vector4(583, -411, 190, 84)];
    // where the smeared sun sits in the amber ceiling: low over the gasfall as seen from the stretch under the skin
    const sunCU = { value: new THREE.Vector3(1, 0.3, 0) };
    { const fa = W(FALL_A, fallB(-215) - 38, 0), d = new THREE.Vector3(fa.x - pLevel.x, 0, fa.z - pLevel.z).normalize(); sunCU.value.set(d.x * 0.95, 0.31, d.z * 0.95).normalize(); }
    const mkSheet = async (level, NA, NB, below, above, amp, ridge, glit, a0, a1, b0, b1) => {
      const pos = new Float32Array((NA + 1) * (NB + 1) * 3), idx = [];
      for (let j = 0; j <= NB; j++) for (let i = 0; i <= NA; i++) {
        const a = a0 + (a1 - a0) * i / NA, b = b0 + (b1 - b0) * j / NB, k = (j * (NA + 1) + i) * 3;
        pos[k] = AX * a + BX * b; pos[k + 1] = 0; pos[k + 2] = AZ * a + BZ * b;
        if (i < NA && j < NB) { const p = j * (NA + 1) + i; idx.push(p, p + NA + 1, p + 1, p + 1, p + NA + 1, p + NA + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...U, uUp: upU, uSunC: sunCU, uSag: { value: sags }, uLevel: { value: level }, uAmp: { value: amp }, uRidge: { value: ridge }, uGlit: { value: glit }, uAlpha: { value: ridge > 0 ? 0.66 : level > 0 ? 0.6 : 0.88 }, uGhost: { value: level > 0 ? 1 : 0 }, uLid: { value: level < -1 ? 1 : 0 }, uGold: { value: C1.clone().multiplyScalar(0.95) }, uBars: { value: bars }, uHoles: { value: holes }, uBody: { value: bodyCol },
          uHole: { value: new THREE.Vector4(ext.halfLength, 0, ext.back, ext.front) }, uBelow: { value: below }, uAbove: { value: above } },
        vertexShader: SHEET_VS, fragmentShader: SHEET_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.userData.level = level; scene.add(mesh); sheets.push(mesh);
      await ctx.yield();
    };
    await mkSheet(S0, 116, 30, roseDeep.clone(), C0.clone().lerp(new THREE.Color('#ffffff'), 0.55), 1, 0, 1, -1500, 4300, -790, 770);
    await mkSheet(0, 208, 64, C1.clone(), ceilCol.clone(), 1, 1, 1.2, -1500, 2400, -720, 670);
    await mkSheet(S2, 96, 30, C2.clone(), C1.clone().multiplyScalar(1.05), 0.4, 0, 0.8, -1500, 2400, -700, 620);

    // ---- the caravan of gas-junks on the calm lane: hull in rose, keel and leeboards hanging in amber ----
    const junkMat = new THREE.ShaderMaterial({ uniforms: rockU(0), vertexShader: ROCK_VS, fragmentShader: ROCK_FS, side: THREE.DoubleSide });
    const junkParts = [];
    {
      const hull = new THREE.BoxGeometry(30, 4.6, 7.4, 8, 1, 2), hp = hull.attributes.position;
      // the belly is a shallow V down to a keel line, so that from inside the amber the hull is a boat's bottom and not a plate
      const hn = hull.attributes.normal, belly = [], keelL = [], port = [];
      for (let i = 0; i < hp.count; i++) { belly.push(hn.getY(i) < -0.5); keelL.push(hp.getY(i) < 0 && Math.abs(hp.getZ(i)) < 1e-3); port.push(hp.getZ(i) > 0); }
      for (let i = 0; i < hp.count; i++) { const t = hp.getX(i) / 15; hp.setZ(i, hp.getZ(i) * (1 - 0.72 * t * t) * (hp.getY(i) < 0 ? 0.6 : 1)); hp.setY(i, hp.getY(i) + 1.3 + 2 * t * t - (keelL[i] ? 1.9 * (1 - 0.7 * t * t) : 0)); }
      colAttr(hull, 0.46, 0.29, 0.17);
      // (its light comes up from the glowing gas under it: brightest along the keel, one bilge in that light and the other turned from it)
      { const hc = hull.attributes.aCol; for (let i = 0; i < hp.count; i++) if (belly[i]) { const c = keelL[i] ? [1.5, 0.92, 0.46] : port[i] ? [1.05, 0.66, 0.3] : [0.56, 0.34, 0.19]; hc.setXYZ(i, c[0], c[1], c[2]); } }
      junkParts.push(hull);
      const fin = (g, sweep) => { const fp = g.attributes.position; let y0 = 0, y1 = -1e9; for (let i = 0; i < fp.count; i++) { y0 = Math.min(y0, fp.getY(i)); y1 = Math.max(y1, fp.getY(i)); }
        for (let i = 0; i < fp.count; i++) { const t = (y1 - fp.getY(i)) / Math.max(y1 - y0, 1e-3), e = t * t; fp.setX(i, fp.getX(i) * (1 - 0.62 * e) - sweep * t); fp.setZ(i, fp.getZ(i) * (1 - 0.5 * t)); } return g; };
      // a blade is painted as it hangs in the amber: its leading edge and its tip catch the glow, the trailing edge stays dark
      const blade = (g, sweep, r, gg, b) => {
        const fp = g.attributes.position; g.computeBoundingBox(); const bb = g.boundingBox, cx = (bb.min.x + bb.max.x) / 2, lead = [], dn = [];
        for (let i = 0; i < fp.count; i++) { lead.push(fp.getX(i) > cx); dn.push((bb.max.y - fp.getY(i)) / Math.max(bb.max.y - bb.min.y, 1e-3)); }
        colAttr(fin(g, sweep), r, gg, b);
        const ac = g.attributes.aCol; for (let i = 0; i < fp.count; i++) { const k = lead[i] ? lerp(2.4, 5.6, dn[i]) : lerp(1.0, 1.9, dn[i]); ac.setXYZ(i, r * k, gg * k * (lead[i] ? lerp(1.3, 1.75, dn[i]) : 1.1), b * k * (lead[i] ? lerp(1.0, 1.9, dn[i]) : 1)); }
        return g;
      };
      junkParts.push(blade(new THREE.BoxGeometry(13, 14, 0.9, 1, 6, 1).translate(0, -7.6, 0), 6.5, 0.34, 0.22, 0.15));       // a swept fin keel
      for (const s of [-1, 1]) junkParts.push(blade(new THREE.BoxGeometry(4, 9, 0.4, 1, 4, 1).translate(3, -4, s * 3.9), 1.6, 0.36, 0.24, 0.16));
      junkParts.push(colAttr(new THREE.BoxGeometry(7, 0.35, 6.4).translate(-10, 6.4, 0), 0.77, 0.28, 0.18));
      junkParts.push(colAttr(new THREE.BoxGeometry(0.5, 3, 0.5).translate(-10, 5, 0), 0.3, 0.2, 0.14));
      [-9, 0.5, 9.5].forEach((x, i) => {
        const hgt = [22, 28, 20][i];
        junkParts.push(colAttr(new THREE.CylinderGeometry(0.22, 0.34, hgt, 6).translate(x, 3 + hgt / 2, 0), 0.3, 0.2, 0.14));
        const sail = new THREE.CircleGeometry(hgt - 2, 9, Math.PI / 2 - 0.42, 1.25), sp = sail.attributes.position;
        for (let k = 0; k < sp.count; k++) { const r = Math.hypot(sp.getX(k), sp.getY(k)) / hgt; sp.setZ(k, Math.sin(r * 3.1) * 1.1 + Math.sin(k * 2.4) * 0.25); }
        sail.translate(x + 2.5, 4, 0);
        junkParts.push(colAttr(sail, 0.93, 0.84, 0.7));
        junkParts.push(colAttr(new THREE.PlaneGeometry(3.6, 0.7).translate(x - 1.8, 3.6 + hgt, 0), 0.8, 0.26, 0.16));
      });
    }
    const junkGeo = mergeGeometries(junkParts.map((g) => { const n = g.index ? g.toNonIndexed() : g; n.deleteAttribute('uv'); if (!n.attributes.normal) n.computeVertexNormals(); return n; }));
    junkParts.forEach((g) => g.dispose());
    const junks = new THREE.InstancedMesh(junkGeo, junkMat, junkCount + 4); junks.frustumCulled = false; scene.add(junks);
    const LAND_A = 852, landB = wallAt(1, LAND_A, S2), skiffAt = W(LAND_A + 6, landB - 21, 0), skiffS = new THREE.Vector3(0.55, 0.55, 0.55);
    const junkAt = [];
    for (let i = 0; i < junkCount; i++) junkAt.push({ a: -498 - i * 120, b: -168 + (i % 2) * 22 + i * 6 - 85 * smoothstep(2.5, 5, i), ph: rng.range(0, 6.28), yaw: 0.873 + rng.range(-0.08, 0.08), sc: 1 + 0.95 * smoothstep(2.5, 5, i) });      // the tail of the fleet, the ones under the way in, are the big hulls
    // two big junks on the calm skin behind the hero: from inside the amber their keels and leeboards hang through the ceiling beside the path
    junkAt.push({ a: 520, b: 335, ph: 1.3, yaw: 0.873 + 1.3, sc: 1.9, sink: 2.6 }, { a: 650, b: 296, ph: 4.1, yaw: 0.873 - 1.15, sc: 1.6, sink: 2.2 });   // lying across the canyon, so their keels are seen in profile
    // and one that leads the caravan out on the open sea before the curl: the scale of the first long look, then passed close to starboard
    junkAt.push({ a: -542, b: -276, ph: 2.6, yaw: 0.873 + 0.35, sc: 1.55 });
    const jm = new THREE.Matrix4(), jq = new THREE.Quaternion(), je = new THREE.Euler(), jp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const placeJunks = (t) => {
      for (let i = 0; i < junkAt.length; i++) {
        const j = junkAt[i], x = AX * j.a + BX * j.b, z = AZ * j.a + BZ * j.b;
        je.set(0.07 * Math.sin(t * 0.5 + j.ph) + 0.05, j.yaw, 0.03 * Math.sin(t * 0.37 + j.ph * 2), 'YXZ');
        jp.set(x, swellAt(x, z, t) + 0.4 - (j.sink || 0), z); jm.compose(jp, jq.setFromEuler(je), one.setScalar(j.sc)); junks.setMatrixAt(i, jm);
      }
      je.set(0.05 * Math.sin(t * 0.6), 0.873 + 0.06 * Math.sin(t * 0.21), 0.04 * Math.sin(t * 0.45), 'YXZ');
      jp.set(skiffAt.x, S2 + swellAt(skiffAt.x, skiffAt.z, t) * 0.4 + 0.3, skiffAt.z); jm.compose(jp, jq.setFromEuler(je), skiffS); junks.setMatrixAt(junkAt.length, jm);
      junks.instanceMatrix.needsUpdate = true;
    };
    placeJunks(0);
    await ctx.yield();

    // ---- close rock: ledge slabs, fallen blocks, a rock-cut landing; shelf brackets in the amber, cushions in the rose ----
    {
      const sr = rng.fork('scatter'), dens = clamp(vary.density ?? 1, 0.6, 1.4) * detail;
      const bg0 = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2); bg0.deleteAttribute('uv'); bg0.deleteAttribute('normal');
      const bg = mergeVertices(bg0), bp = bg.attributes.position; bg0.dispose();
      for (let i = 0; i < bp.count; i++) {                           // knock the corners in so no block is a crate
        const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), k = 1 - 0.3 * (Math.abs(x) + Math.abs(y) + Math.abs(z) - 0.5) + 0.08 * Math.sin(x * 9 + y * 7 + z * 5);
        bp.setXYZ(i, x * k, y * k, z * k);
      }
      bg.computeVertexNormals();
      const NB = Math.round(400 * dens) + 8, blocks = new THREE.InstancedMesh(bg, rockMat, NB), bc = new Float32Array(NB * 3);
      const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(AX, 0, AZ), new THREE.Vector3(0, 1, 0), new THREE.Vector3(BX, 0, BZ));
      const qA = new THREE.Quaternion().setFromRotationMatrix(basis), qr = new THREE.Quaternion(), q = new THREE.Quaternion(), e = new THREE.Euler(), m4 = new THREE.Matrix4(), ps = new THREE.Vector3(), sc = new THREE.Vector3();
      let n = 0;
      const put = (a, b, y, sx, sy, sz, tilt, tone) => {
        if (n >= NB) return;
        e.set(sr.range(-tilt, tilt), sr.range(-0.25, 0.25) + (tilt > 0.3 ? sr.range(0, 6.28) : 0), sr.range(-tilt, tilt)); q.copy(qA).multiply(qr.setFromEuler(e));
        ps.copy(W(a, b, y)); sc.set(sx, sy, sz); m4.compose(ps, q, sc); blocks.setMatrixAt(n, m4);
        const t = tone * sr.range(0.9, 1.08); bc[n * 3] = 0.74 * t; bc[n * 3 + 1] = 0.68 * t; bc[n * 3 + 2] = 0.6 * t; n++;
      };
      // the landing first, so it is never thinned away: a quay, three steps down to the skin, a bollard
      put(LAND_A, landB - 5, S2 + 1.2, 22, 3.4, 13, 0, 1.02);
      for (let k = 0; k < 3; k++) put(LAND_A - 7 + k * 0.5, landB - 13.5 - k * 2.6, S2 + 0.6 - k * 1.1, 8, 1.4, 3.2, 0, 1.08);
      put(LAND_A + 8.5, landB - 10.5, S2 + 3.6, 1.1, 1.7, 1.1, 0.05, 0.75);
      put(LAND_A - 2, landB - 1, S2 + 7, 30, 9, 9, 0.04, 0.95); put(LAND_A + 2, landB + 1, S2 + 15, 22, 7, 7, 0.04, 0.9); put(LAND_A + 16, landB - 4, S2 + 4, 6, 5, 6, 0.3, 0.9);
      // the sill of the hanging gully the gasfall pours over, and the two shoulders of its notch
      put(FALL_A, fallB(-124) + 6, -127, 66, 8, 34, 0.02, 0.86); put(FALL_A - 44, fallB(-110) + 2, -112, 26, 30, 30, 0.06, 0.92); put(FALL_A + 46, fallB(-110) + 2, -114, 30, 26, 30, 0.06, 0.9);
      // strata slabs standing out of the east wall where the camera passes it, fallen blocks lying on them
      const nSlab = Math.round(78 * dens);
      for (let i = 0; i < nSlab; i++) {
        const a = sr.range(470, 960), y = FLOOR + 52 * sr.int(3, 8) + 45 + sr.range(-4, 4), len = sr.range(16, 44), dep = sr.range(7, 15), th = sr.range(1.6, 4.5);
        if (Math.abs(a - FALL_A) < 60 && y < -70) continue;
        const b = wallAt(1, a, y) + dep * 0.12;
        put(a, b, y, len, th, dep, 0.035, 0.96);
        const nearCam = a < 690 && y > -210 ? 1 : 0;                   // the ledges the camera passes close carry more of them, and bigger
        for (let k = sr.int(0, 2) + nearCam * 2; k > 0; k--) { const r = sr.range(1.2, 4.2) * (1 + 0.3 * nearCam); put(a + sr.range(-0.4, 0.4) * len, b - dep * sr.range(0.05, 0.3), y + th * 0.5 + r * 0.3, r * sr.range(0.8, 1.6), r, r * sr.range(0.7, 1.3), 0.5, 0.92); }
      }
      // the rim where we come in: the blocks left lying on the ledge (none where the camera leaves it)
      let guard = 0;
      while (n < NB && guard++ < 4000) {
        const a = sr.range(-1080, -800), off = Math.pow(sr(), 1.6) * 150 + 4, r = sr.range(0.7, 3.4) * (sr.chance(0.12) ? 2.2 : 1);
        const b = wallAt(-1, a, RIM - 4) - off, cw = W(a, b, RIM - 6);
        if (path.distanceTo(cw.x, cw.y, cw.z) < 15 + r * 2) continue;
        put(a, b, RIM - 9 + off * 0.021 + r * 0.32, r * sr.range(0.8, 1.9), r * sr.range(0.5, 1), r * sr.range(0.8, 1.4), 0.45, sr.range(0.86, 1.06));
      }
      bg.setAttribute('aCol', new THREE.InstancedBufferAttribute(bc, 3));
      blocks.count = n; blocks.frustumCulled = false; scene.add(blocks);
      await ctx.yield();
      // growths: one flattened dome serves as shelf bracket (half sunk in the wall) and as cushion
      const gg = new THREE.SphereGeometry(1, 9, 4, 0, Math.PI * 2, 0, Math.PI * 0.5); gg.deleteAttribute('uv');
      const NG = Math.round(560 * dens), growths = new THREE.InstancedMesh(gg, junkMat, NG), gc = new Float32Array(NG * 3);
      const rust = new THREE.Color(air.rust), ochre = rust.clone().lerp(C1, 0.55), coral = C0.clone().lerp(new THREE.Color('#E8607C'), 0.6), tmp = new THREE.Color();
      let g = 0;
      const grow = (a, b, y, r, flat, c) => {
        if (g >= NG) return;
        e.set(sr.range(-0.12, 0.12), sr.range(0, 6.28), sr.range(-0.12, 0.12)); q.setFromEuler(e);
        ps.copy(W(a, b, y)); sc.set(r, r * flat, r); m4.compose(ps, q, sc); growths.setMatrixAt(g, m4);
        gc[g * 3] = c.r; gc[g * 3 + 1] = c.g; gc[g * 3 + 2] = c.b; g++;
      };
      const nBr = Math.round(300 * dens);
      for (let i = 0; i < nBr && g < NG; ) {                          // brackets in stepped tiers along a stratum
        const a0 = sr.range(430, 940), y0 = sr.range(S2 + 14, -30), cnt = sr.int(3, 7);
        for (let k = 0; k < cnt; k++, i++) {
          const a = a0 + k * sr.range(3.5, 6.5), y = y0 + k * sr.range(-0.4, 1.3), near = a < 690 && y > -210, r = sr.range(2.6, 6.5) * (near ? 1.45 : 1), fl = near ? sr.range(0.3, 0.46) : sr.range(0.14, 0.3);
          if (Math.abs(a - FALL_A) < 56) continue;
          tmp.copy(rust).lerp(ochre, sr()).multiplyScalar(sr.range(0.85, 1.15)); grow(a, wallAt(1, a, y) - 0.6, y, r, fl, tmp);
          // where the camera passes close each bracket is stepped: a second, paler shelf grown on the first
          if (near) { tmp.multiplyScalar(1.22); grow(a + sr.range(-0.2, 0.2) * r, wallAt(1, a, y) - 0.6, y + r * fl * 0.66, r * 0.58, fl * 1.1, tmp); }
        }
      }
      {                                                                 // fans standing off the flanks of the three spires the camera passes last: dark shelves with pale tips
        const late = [0.87, 0.89, 0.91, 0.93, 0.95, 0.97].map((u) => path.pointAt(u, new THREE.Vector3()));
        const dOf = (sp) => late.reduce((m, c) => Math.min(m, Math.hypot(c.x - sp.p.x, c.z - sp.p.z)), 1e9);
        const fanC = C2.clone().lerp(deep, 0.45), tipC = new THREE.Color('#CFEFE2');
        for (const sp of spireList.slice().sort((x, y) => dOf(x) - dOf(y)).slice(0, 3)) {
          const c = late.reduce((m, q2) => (Math.hypot(q2.x - sp.p.x, q2.z - sp.p.z) < Math.hypot(m.x - sp.p.x, m.z - sp.p.z) ? q2 : m), late[0]);
          const toA = (c.x - sp.p.x) * AX + (c.z - sp.p.z) * AZ, toB = (c.x - sp.p.x) * BX + (c.z - sp.p.z) * BZ, face = Math.atan2(toB, toA);
          const sa = sp.p.x * AX + sp.p.z * AZ, sb = sp.p.x * BX + sp.p.z * BZ;
          for (let k = 0; k < 10; k++) {
            const h = 9 + k * 5.2 + sr.range(-1.2, 1.2), th = face + (k % 2 ? 1 : -1) * (0.25 + 0.14 * k) + sr.range(-0.2, 0.2), fr = sr.range(2.6, 4.6);
            const rad = sp.r * (1 - 0.78 * h / sp.hgt) * 1.02 - fr * 0.3, y = FLOOR - 4 + h;
            tmp.copy(fanC).multiplyScalar(sr.range(0.85, 1.15)); grow(sa + Math.cos(th) * rad, sb + Math.sin(th) * rad, y, fr, sr.range(0.2, 0.3), tmp);
            tmp.copy(tipC).multiplyScalar(sr.range(0.85, 1)); grow(sa + Math.cos(th) * (rad + fr * 0.42), sb + Math.sin(th) * (rad + fr * 0.42), y + fr * 0.13, fr * 0.5, 0.3, tmp);
          }
        }
      }
      guard = 0;
      while (g < NG && guard++ < 4000) {                               // cushions in drifts on the entry ledge
        const a0 = sr.chance(0.45) ? sr.range(-975, -870) : sr.range(-1080, -800), o0 = Math.pow(sr(), 1.5) * 120 + 3, cnt = sr.int(2, 6), cw = W(a0, wallAt(-1, a0, RIM - 4) - o0, RIM - 6);
        if (path.distanceTo(cw.x, cw.y, cw.z) < 13) continue;
        for (let k = 0; k < cnt; k++) {
          const a = a0 + sr.range(-6, 6), off = o0 + sr.range(-5, 5), r = sr.range(0.7, 2.6);
          tmp.copy(coral).multiplyScalar(sr.range(0.8, 1.15)); grow(a, wallAt(-1, a, RIM - 4) - Math.max(off, 1), RIM - 9.2 + Math.max(off, 1) * 0.021, r, sr.range(0.4, 0.62), tmp);
        }
      }
      gg.setAttribute('aCol', new THREE.InstancedBufferAttribute(gc, 3));
      growths.count = g; growths.frustumCulled = false; scene.add(growths);
    }
    await ctx.yield();

    // ---- skimmers: gliders a wingspan above a surface, a keel-fin in it, cutting V-wakes ----
    // the first skein are the big elders: an echelon on the rose skin just off the rim ledge, keeping pace with the camera
    // (the camera overtakes them: far ahead as it comes in over the rim, right under it at u 0.08)
    const SKU = 0.08, SKSP = 1570, RH = 2.8, skDir = [0.927, -0.375], skBase = path.pointAt(SKU, new THREE.Vector3());
    skBase.x += 34 * 0.961 + 6 * 0.276; skBase.z += 34 * -0.276 + 6 * 0.961; skBase.y = 0;
    const flights = [{ u: SKU, lv: S0, amp: 0.5, sc: 3.8, at: skBase, dir: skDir, ech: 1, sp: SKSP, pitch: 0.45 }, { u: 0.07, lv: S0, amp: 0.5, sc: 1.5 },
      { u: 0.2, lv: 0, amp: 1, sc: 1 }, { u: 0.265, lv: 0, amp: 1, sc: 1 }, { u: uS2 - 0.022, lv: S2, amp: 0.4, sc: 1.7 }];
    const perFlight = rng.pick([9, 9, 5]);
    const skU = { ...U, uU: { value: 0 } };
    {
      const P = [], K = [], Q = [];
      // every corner carries (part, u, v): part 0 wing (u chord 0 leading edge .. 1 trailing, v span 0 root .. 1 tip), 1 body, 2 keel-fin (u down it), 3 the ring it cuts in the skin, 4 wake
      const tri = (a, b, c, k, part = 4, qa = [0, 0], qb = [0, 0], qc = [0, 0]) => { P.push(...a, ...b, ...c); K.push(k[0], k[1], k[2]); Q.push(part, qa[0], qa[1], part, qb[0], qb[1], part, qc[0], qc[1]); };
      const Z0 = [0, 0, 0];
      for (const s of [-1, 1]) {      // a wing: swept, cambered, the trailing edge scalloped between the ribs
        const NT = 7, NC = 3, wp = (i, j) => {
          const t = j / NT, c = i / NC, xle = 1.25 - 0.55 * t - 2.1 * t * t, ch = (2.5 * (1 - t) + 0.3) * (1 + (i === NC ? 0.11 * Math.cos(t * 6.5 * 6.2832) : 0));
          return [xle - ch * c, 0.38 * Math.pow(t, 1.2) + 0.12 * Math.sin(Math.PI * c) * (1 - t), s * (0.16 + 2.44 * t)];
        };
        for (let j = 0; j < NT; j++) for (let i = 0; i < NC; i++) {
          const q00 = [i / NC, j / NT], q10 = [(i + 1) / NC, j / NT], q01 = [i / NC, (j + 1) / NT], q11 = [(i + 1) / NC, (j + 1) / NT];
          tri(wp(i, j), wp(i + 1, j), wp(i + 1, j + 1), Z0, 0, q00, q10, q11); tri(wp(i, j), wp(i + 1, j + 1), wp(i, j + 1), Z0, 0, q00, q11, q01);
        }
      }
      {                               // a small spindle of a body
        const bx = [1.9, 1.3, 0.35, -0.8, -1.7], br = [0.02, 0.3, 0.46, 0.3, 0.04], NS = 6, bp = (k, m) => { const th = m / NS * 6.2832; return [bx[k], -0.04 + Math.sin(th) * br[k] * 0.85, Math.cos(th) * br[k]]; };
        for (let k = 0; k < 4; k++) for (let m = 0; m < NS; m++) { tri(bp(k, m), bp(k + 1, m), bp(k + 1, m + 1), Z0, 1); tri(bp(k, m), bp(k + 1, m + 1), bp(k, m + 1), Z0, 1); }
      }
      {                               // the keel-fin: a blade swept back, its tip dragging under the skin
        const NF = 5, fp = (k, e) => { const v = k / NF; return [e ? -0.42 - 0.25 * v - 0.2 * v * v : 0.02 - 0.5 * v - 0.4 * v * v, -0.15 - (RH + 0.6) * v, 0]; };
        for (let k = 0; k < NF; k++) { const v0 = [k / NF, 0], v1 = [(k + 1) / NF, 0]; tri(fp(k, 0), fp(k, 1), fp(k + 1, 1), Z0, 2, v0, v0, v1); tri(fp(k, 0), fp(k + 1, 1), fp(k + 1, 0), Z0, 2, v0, v1, v1); }
      }
      { const r = 1.7, y = -RH + 0.03, cx = -0.7;      // where the fin cuts the skin
        tri([cx - r, y, -r], [cx + r, y, -r], [cx + r, y, r], Z0, 3, [-1, -1], [1, -1], [1, 1]); tri([cx - r, y, -r], [cx + r, y, r], [cx - r, y, r], Z0, 3, [-1, -1], [1, 1], [-1, 1]); }
      for (const s of [-1, 1]) {      // the wake: two soft arms on the skin that widen and fade out within about 45 m
        const NS = 5, st = (i) => { const t = i / NS, c = s * (0.25 + 3.6 * t), hw = 0.22 + 2.7 * t, x = -0.6 - 44 * t; return { i: [x, -RH + 0.3, c - s * hw], c: [x, -RH + 0.3, c], o: [x, -RH + 0.3, c + s * hw * 1.5], a: 0.02 + 0.95 * Math.pow(1 - t, 1.6) }; };
        for (let i = 0; i < NS; i++) { const p = st(i), q = st(i + 1);
          tri(p.i, q.i, q.c, [0.02, 0.02, q.a]); tri(p.i, q.c, p.c, [0.02, q.a, p.a]); tri(p.c, q.c, q.o, [p.a, q.a, 0.02]); tri(p.c, q.o, p.o, [p.a, 0.02, 0.02]); }
      }
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); base.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 3));
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', base.attributes.position); g.setAttribute('aK', base.attributes.aK); g.setAttribute('aQ', base.attributes.aQ);
      const N = flights.length * perFlight, aBase = new Float32Array(N * 4), aForm = new Float32Array(N * 4), aSc = new Float32Array(N * 3), tan = new THREE.Vector3(), pt = new THREE.Vector3();
      flights.forEach((f, fi) => {
        path.pointAt(Math.min(f.u + 0.013, 0.99), pt); path.tangentAt(f.u, tan);
        if (f.at) pt.copy(f.at);
        const ang = f.dir ? Math.atan2(f.dir[1], f.dir[0]) : Math.atan2(tan.z, tan.x) + (fi % 2 ? -1.15 : 1.15);
        for (let i = 0; i < perFlight; i++) {
          const k = (fi * perFlight + i) * 4, row = Math.ceil(i / 2), sd = i % 2 ? 1 : -1;
          aBase[k] = pt.x; aBase[k + 1] = f.lv; aBase[k + 2] = pt.z; aBase[k + 3] = ang;
          aForm[k] = f.ech ? i * 4.2 * f.sc : sd * row * 7.5 * f.sc; aForm[k + 1] = f.ech ? -i * 5 * f.sc : row * 9 * f.sc; aForm[k + 2] = f.u; aForm[k + 3] = f.amp; aSc[k / 4 * 3] = f.sc; aSc[k / 4 * 3 + 1] = f.sp || 2600; aSc[k / 4 * 3 + 2] = f.pitch || 0;   // ech: one echelon stepping ahead and out from the wall
        }
      });
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(aBase, 4)); g.setAttribute('aForm', new THREE.InstancedBufferAttribute(aForm, 4)); g.setAttribute('aSc', new THREE.InstancedBufferAttribute(aSc, 3));
      g.instanceCount = N;
      const mat = new THREE.ShaderMaterial({
        uniforms: skU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: SWELL_GLSL + /* glsl */`
uniform float uTime, uU; attribute float aK; attribute vec3 aSc, aQ; attribute vec4 aBase, aForm; varying float vK, vS; varying vec3 vW, vQ;
void main(){
  float sc = aSc.x, ws = mix(sc, min(sc, 1.5), step(0.001, aK));            // a wake is as long on a big skimmer as on a small one
  // the elders lean into the skin, wings tipped nose-down over a keel that stays where it is
  float pk = aSc.z * step(aK, 0.001) * smoothstep(-1.3, -0.25, position.y) * step(aQ.x, 2.5), cp = cos(pk), sp = sin(pk);
  vec3 pos = vec3(position.x * cp + position.y * sp, position.y * cp - position.x * sp, position.z);
  float along = (uU - aForm.z) * aSc.y - aForm.y + pos.x * ws;
  float lat = aForm.x + pos.z * ws + 2.5 * sin(uTime * 0.6 + aForm.x);
  vec2 d = vec2(cos(aBase.w), sin(aBase.w));
  vec2 xz = vec2(aBase.x, aBase.z) + d * along + vec2(-d.y, d.x) * lat;
  float skin = aBase.y + c3aSwell(xz, uTime) * aForm.w;
  float y = skin + (${RH.toFixed(1)} + pos.y) * sc;
  y += step(aQ.x, 0.5) * abs(pos.z) * sc * 0.22 * sin(uTime * 2.4 + aForm.x * 0.7);      // the wings beat slowly from the root
  vK = aK; vQ = aQ; vS = y - skin; vW = vec3(xz.x, y, xz.y);
  // a flight is seen from the air it rides in, never as specks through the skin above it
  float lidY = aBase.y > 200. ? 1e5 : (aBase.y > -100. ? 262. : 4.);
  gl_Position = mix(projectionMatrix * viewMatrix * vec4(vW, 1.), vec4(0., 0., 2., 1.), step(lidY, cameraPosition.y));
}`,
        fragmentShader: LAYER + /* glsl */`
uniform vec3 uSun, uKey, uFill; varying float vK, vS; varying vec3 vW, vQ;
void main(){
  float d = distance(vW, cameraPosition) * uFogDen; float f = exp(-d * d);
  vec3 col = vec3(1.25, 1.18, 1.02); float a = clamp(vK, 0., 1.) * 0.62;
  if (vK < 0.01) {
    vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-3, 0.));
    vec3 N = cross(dFdx(vW), dFdy(vW)); N = N / max(length(N), 1e-7); if (dot(N, V) < 0.) N = -N;
    float ndl = max(dot(N, uSun), 0.), top = smoothstep(-0.15, 0.3, N.y);
    float thru = max(dot(-V, uSun), 0.); thru *= thru;
    float fr = 1. - abs(dot(N, V)); fr *= fr;
    float ln; vec4 L = c3aLayer(vW - vec3(0., 3., 0.), ln);                 // the gas under the skin this one rides
    vec3 plum = vec3(0.34, 0.17, 0.26), cream = vec3(1., 0.94, 0.86);
    a = 1.;
    if (vQ.x < 0.5) {
      // a wing: a thin membrane between dark ribs, pale along the leading edge, thinner and brighter toward the trailing edge
      float c = clamp(vQ.y, 0., 1.), t = clamp(vQ.z, 0., 1.);
      float rl = 1. - smoothstep(0.03, 0.11, abs(fract(t * 6.5 - c * 0.55) - 0.5));
      float le = 1. - smoothstep(0.02, 0.12, c);
      vec3 memb = mix(plum, mix(L.rgb, cream, 0.2), 0.22 + 0.4 * c);
      memb = mix(memb, plum * 0.5, rl * 0.7);
      memb = mix(memb, cream, le * 0.9);
      vec3 lit = uKey * (0.2 + 0.8 * ndl) * mix(0.3, 1., top) + uFill * 0.8 + uKey * thru * (1. - top) * (0.25 + 0.75 * c) + vec3(0.9, 0.85, 0.8) * fr * 0.25;
      col = memb * lit;
      a = clamp(0.62 + 0.4 * rl + 0.4 * le + 0.3 * (1. - c) - 0.1 * (1. - top), 0., 1.);
    } else if (vQ.x < 1.5) {
      col = plum * 0.75 * (uKey * (0.25 + 1.1 * ndl) + uFill * 0.8) + cream * fr * 0.22;
    } else if (vQ.x < 2.5) {
      // the keel-fin takes the colour of the gas it drags in, with a bright line where it cuts the skin
      float under = 1. - smoothstep(-0.4, 1.6, vS);
      col = mix(plum * 0.7, L.rgb * 0.95, under * 0.85) * (uKey * 0.55 + uFill * 0.8);
      col += cream * (1. - smoothstep(0.1, 0.5, abs(vS - 0.15))) * 0.9;
    } else {
      float r = length(vQ.yz) + 1e-4, ph = fract(uTime * 0.6);
      float ring = (1. - smoothstep(0., 0.07, abs(r - 0.22))) + (1. - ph) * (1. - smoothstep(0., 0.09, abs(r - 0.22 - 0.7 * ph)));
      col = cream * 1.15; a = clamp(ring, 0., 1.) * 0.8 * (1. - smoothstep(0.85, 1., r));
    }
  }
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uFogCol, col, f), a);
}`,
      });
      const sk = new THREE.Mesh(g, mat); sk.frustumCulled = false; sk.renderOrder = 6; scene.add(sk); base.dispose();
    }
    await ctx.yield();

    // ---- flakes snowing through the rose ----
    const flakeU = { ...U, uPx: { value: 800 } };
    {
      const N = Math.floor(3600 * detail), pos = new Float32Array(N * 3);
      for (let i = 0; i < N * 3; i++) pos[i] = rng() * 160;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.ShaderMaterial({
        uniforms: flakeU, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`
uniform float uTime, uPx; uniform vec3 uLv; varying float vA;
void main(){
  float h = fract(position.x * 7.31 + position.z * 3.17);
  vec3 p = position + vec3(uTime * (1. + 2. * h), -uTime * (2.5 + 2.5 * h), sin(uTime * 0.7 + h * 30.) * 1.5);
  p = mod(p - cameraPosition, 160.) - 80. + cameraPosition;
  vA = 1. - smoothstep(uLv.x - 8., uLv.x - 1., p.y);
  vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uPx * 0.2 / max(-mv.z, 1.), 1.5, 14.) * step(0.01, vA);
}`,
        fragmentShader: /* glsl */`
uniform vec3 uC0; varying float vA;
void main(){ vec2 c = gl_PointCoord - 0.5; float r = dot(c, c) * 4.; gl_FragColor = vec4(mix(uC0, vec3(1.), 0.75) * 1.15, (1. - smoothstep(0.3, 1., r)) * vA * 0.8); }`,
      });
      const flakes = new THREE.Points(g, mat); flakes.frustumCulled = false; flakes.renderOrder = 8; scene.add(flakes);
    }

    // ---- the gasfall: the lowest air pouring off a hanging gully through the middle one, standing off the wall ----
    // built in depth: nine overlapping strand sheets at different stand-offs, a flared skirt where it spreads on the
    // lower skin, and rings beating out from the dimple. Green only here, where teal truly mixes into amber.
    const fallU = { ...U, uGreen: { value: new THREE.Color('#8FBF5A') }, uPale: { value: C2.clone().lerp(new THREE.Color('#F2FFF6'), 0.55) } };
    const fallMat = new THREE.ShaderMaterial({
      uniforms: fallU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
attribute vec4 aFall; varying vec4 vF; varying vec3 vW; uniform float uTime;
void main(){
  vF = aFall; vec3 p = position;
  float sway = sin(uTime * 0.37 + aFall.y * 5. + aFall.z * 20.) * 3.2 * aFall.y * (1. - aFall.w);
  p.x -= ${BX.toFixed(3)} * sway; p.z -= ${BZ.toFixed(3)} * sway; p.x += ${AX.toFixed(3)} * sway * 0.6; p.z += ${AZ.toFixed(3)} * sway * 0.6;
  vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
      fragmentShader: NOISE + LAYER + /* glsl */`
uniform vec3 uGreen, uPale, uKey; varying vec4 vF; varying vec3 vW;
void main(){
  float u = vF.x, v = vF.y, sd = vF.z, skirt = vF.w;
  vec3 col; float a;
  if (skirt > 0.5) {
    // the fallen gas spreading over the lower skin: slow rolls beating outward from the plunge
    float n1 = vn(vec2(u * 9., v * 3. - uTime * 0.25));
    float rings = 0.5 + 0.5 * sin(v * 26. - uTime * 1.3 + 4. * n1);
    float puff = smoothstep(0.3, 0.75, vn(vec2(u * 14. + 3., v * 5. - uTime * 0.4)) * 0.6 + 0.4 * n1);
    a = (0.07 + 0.4 * rings * rings * puff) * smoothstep(0., 0.08, v) * (1. - smoothstep(0.3, 0.95, v));
    col = mix(uC2 * 1.5, uPale, 0.2 + 0.45 * rings) * (0.85 + 0.25 * uKey);
  } else {
    float e = abs(u - 0.5) * 2.;
    float fall = v * 9. - uTime * 0.9;
    float s1 = vn(vec2(u * 4. + sd * 17., fall * 0.35));
    float s2 = vn(vec2(u * 7. + sd * 31. + 0.6 * s1, fall * 0.8 + sd * 5.));
    float s3 = vn(vec2(u * 19. + sd * 7., fall * 1.5));
    float st = vn(vec2(u * 30. + sd * 13., fall * 0.3 + sd * 3.));          // threads streaming down inside the pour
    float edgeN = e + 0.3 * (s2 - 0.5) + 0.16 * (s3 - 0.5);
    float body = 1. - smoothstep(0.66, 0.8, edgeN);                         // a billowing edge, not a fade
    float rim = smoothstep(0.42, 0.7, edgeN) * body;
    float ends = smoothstep(0., 0.05, v) * (1. - smoothstep(0.9, 1., v));
    float dens = 0.45 + 0.55 * smoothstep(0.25, 0.8, 0.5 * s1 + 0.5 * s2);
    a = min(body * ends * (0.5 + 0.42 * dens), 0.94);
    col = mix(uC2 * 1.25, uPale, 0.12 + 0.6 * smoothstep(0.5, 0.85, st) + 0.25 * s2 * s2);
    col = mix(col, uGreen * (0.9 + 0.4 * s2), rim * 0.9);                   // green only here, where the lowest air truly mixes into the middle one
    col *= 0.78 + 0.4 * s1 + 0.22 * uKey;
    col += uPale * smoothstep(0.75, 0.95, st) * 0.3 * (1. - rim);
  }
  if (a < 0.004) discard;
  gl_FragColor = vec4(c3aFog(col, vW), a);
}`,
    });
    let fallMesh = null, ringMesh = null;
    const fallFoot = W(FALL_A, fallB(S2) - 52, S2);
    {
      const P = [], F = [], I = [], fr = rng.fork('fall');
      const strand = (da, off, wid, bow, seed, yTop) => {
        const NU = 6, NV = 40, base = P.length / 3;
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const v = j / NV, uu = i / NU, y = yTop + (S2 - 14 - yTop) * v, low = smoothstep(S2 + 70, S2 - 5, y);
          const w = wid * (0.55 + 0.45 * smoothstep(0, 0.3, v)) * (1 + 0.7 * low);
          const a = FALL_A + da + (uu - 0.5) * w + 5 * Math.sin(v * 5 + seed * 9);
          const b = fallB(y) - off * (0.25 + 0.75 * smoothstep(0, 0.35, v)) - bow * Math.sin(Math.PI * uu) - 26 * low * low + 4 * Math.sin(v * 7 + seed * 5);
          P.push(AX * a + BX * b, y, AZ * a + BZ * b); F.push(uu, v, seed, 0);
          if (i < NU && j < NV) { const k = base + j * (NU + 1) + i; I.push(k, k + NU + 1, k + 1, k + 1, k + NU + 1, k + NU + 2); }
        }
      };
      for (let i = 0; i < 9; i++) strand((i / 8 - 0.5) * 42 + fr.range(-4, 4), 16 + (i % 3) * 19 + fr.range(0, 8), fr.range(15, 24) * 1.3, fr.range(2, 9) * (i % 2 ? 1 : -0.5), fr(), -120 - fr.range(0, 10));
      strand(0, 36, 60, 6, 0.613, -118);
      // the skirt: the fallen gas spreading over the lower skin
      { const NU = 40, NV = 5, base = P.length / 3;
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const th = i / NU * Math.PI * 2, v = j / NV, r = 14 + 100 * v, y = S2 + 1.2 + 12 * (1 - v) * (1 - v);
          P.push(fallFoot.x + Math.cos(th) * r, y, fallFoot.z + Math.sin(th) * r * 0.8); F.push(i / NU * 3, v, 0.37, 1);
          if (i < NU && j < NV) { const k = base + j * (NU + 1) + i; I.push(k, k + NU + 1, k + 1, k + 1, k + NU + 1, k + NU + 2); }
        } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aFall', new THREE.Float32BufferAttribute(F, 4)); g.setIndex(I);
      fallMesh = new THREE.Mesh(g, fallMat); fallMesh.frustumCulled = false; scene.add(fallMesh);
      // the dimple: bright rings beating outward on the lower skin round the foot of the fall
      const rg = new THREE.RingGeometry(6, 176, 64, 8); rg.rotateX(-Math.PI / 2);
      ringMesh = new THREE.Mesh(rg, new THREE.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: SWELL_GLSL + /* glsl */`
uniform float uTime; varying vec3 vW; varying float vR;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vR = length(position.xz);
  wp.y += c3aSwell(wp.xz, uTime) * 0.4 - 8. * exp(-vR * vR / 2800.) + 1.3 * sin(vR * 0.2 - uTime * 1.5) * exp(-vR / 60.);
  vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`,
        fragmentShader: LAYER + /* glsl */`
varying vec3 vW; varying float vR;
void main(){
  float w = 0.5 + 0.5 * sin(vR * 0.2 - uTime * 1.5); w = w * w; w *= w;
  float ring = exp(-(vR - 58.) * (vR - 58.) / 70.);
  float a = (w * 0.42 * exp(-vR / 60.) + ring * 0.55) * (1. - smoothstep(125., 176., vR)) * smoothstep(6., 16., vR);
  gl_FragColor = vec4(c3aFog(vec3(1., 0.97, 0.88) * (0.9 + 0.5 * ring), vW), clamp(a, 0., 1.));
}`,
      }));
      ringMesh.position.set(fallFoot.x, S2 + 0.5, fallFoot.z); ringMesh.frustumCulled = false; ringMesh.renderOrder = 5; scene.add(ringMesh);
    }
    const fallAt = W(FALL_A, fallB(-215) - 38, -215);
    await ctx.yield();

    // ---- three shafts of amber light standing in the lowest air ----
    // soft shafts: brightest where the cone faces the eye, fading to nothing at its silhouette and at both ends
    const shaftMat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: C1.clone().multiplyScalar(0.075) }, uFogDen: U.uFogDen },
      vertexShader: `varying vec3 vSN; varying vec3 vSW; varying vec2 vSUv;
void main() { vSUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vSW = wp.xyz; vSN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform vec3 uCol; uniform float uFogDen; varying vec3 vSN; varying vec3 vSW; varying vec2 vSUv;
void main() { vec3 V = cameraPosition - vSW; float dl = max(length(V), 1e-4); V = V / dl; vec3 N = vSN / max(length(vSN), 1e-4);
  float fd = dl * uFogDen * 1.3;
  float nv = abs(dot(N, V)); float a = nv * nv * nv * smoothstep(0.0, 0.45, vSUv.y) * (1.0 - smoothstep(0.35, 1.0, vSUv.y)) * exp(-fd * fd);
  gl_FragColor = vec4(uCol * a, 1.0); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide,
    });
    const shafts = [];
    // the first stands on the terraces just right of the arch and is the strong one
    const shaftMat0 = shaftMat.clone(); shaftMat0.uniforms.uCol = { value: C1.clone().multiplyScalar(0.3) }; shaftMat0.uniforms.uFogDen = U.uFogDen;
    [[1408, 337, 0], [1150, 228, 1], [985, 430, 2]].forEach(([a, b, i]) => {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(5, 17, 200, 20, 1, true), i ? shaftMat : shaftMat0);
      s.position.copy(W(a, b, FLOOR + 96)); s.rotation.z = 0.1; scene.add(s); shafts.push(s);
      const ft = W(a, b, 0); pools[shafts.length - 1].set(ft.x - 9, ft.z, i ? 30 : 25, i ? 0.8 : 2.3);
    });

    // ---- the membrane: for the few frames the lens is in the middle skin, the skin's own lit colour floods the frame ----
    // (one screen-filling pane, clear at every other moment; the hero hands over to the world's ceiling behind it)
    const veilU = { uA: { value: 0 }, uBody: { value: bodyCol }, uKey: U.uKey, uFill: U.uFill, uTime: U.uTime };
    {
      const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: veilU, transparent: true, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vS; void main(){ vS = position.xy; gl_Position = vec4(position.xy, 0., 1.); }',
        fragmentShader: NOISE + /* glsl */`
uniform float uA, uTime; uniform vec3 uBody, uKey, uFill; varying vec2 vS;
void main(){
  float g = exp(-dot(vS - vec2(0.15, 0.3), vS - vec2(0.15, 0.3)) * 1.4);
  float rows = vn(vec2(vS.x * 2.2 + vS.y * 0.8 + uTime * 0.6, vS.y * 26. - vS.x * 9.)) * 0.6 + 0.4 * vn(vec2(vS.x * 5. - uTime * 0.9, vS.y * 70. - vS.x * 24.));
  vec3 col = uBody * (uKey * (0.5 + 0.4 * g + 0.18 * rows) + uFill * 0.66);
  gl_FragColor = vec4(col, uA);
}`,
      }));
      veil.frustumCulled = false; veil.renderOrder = 900; scene.add(veil);
    }

    // ---- a mint glow standing before the arch, so the way out reads from the far end of the lowest air ----
    {
      const hg = new THREE.CircleGeometry(46, 40);
      const halo = new THREE.Mesh(hg, new THREE.ShaderMaterial({
        uniforms: { uCol: { value: new THREE.Color('#BFF5E4').multiplyScalar(0.3) }, uFogDen: U.uFogDen },
        vertexShader: 'varying vec3 vHW; varying vec2 vHP; void main(){ vHP = position.xy; vec4 wp = modelMatrix * vec4(position, 1.); vHW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
        fragmentShader: 'uniform vec3 uCol; uniform float uFogDen; varying vec3 vHW; varying vec2 vHP; void main(){ float d = distance(vHW, cameraPosition), fd = d * uFogDen * 0.7; float r2 = dot(vHP, vHP); float a = (exp(-r2 / 330.) + 0.35 * exp(-r2 / 1300.)) * (1. - smoothstep(600., 2100., r2)) * smoothstep(25., 110., d) * exp(-fd * fd); gl_FragColor = vec4(uCol * a, 1.); }',
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide,
      }));
      halo.position.copy(endP).add(new THREE.Vector3(-AX * 13, 0, -AZ * 13)); halo.rotation.y = Math.atan2(AX, AZ); halo.frustumCulled = false; halo.renderOrder = 7; scene.add(halo);
    }

    // ---- rare: the mother bell, 60 m across, rising through the lowest surface beside the path ----
    let bell = null; const bellAt = W(826, 280, S2 - 86);
    if (rare) {
      // one body: a lobed dome with a rolled rim, a frilled trunk hanging under it, and streamers trailing from the rim into the lowest air
      const R = 60, NS = 48, P = [], UV = [], B = [], I = [], br = rng.fork('bell');
      const lathe = (prof, part, frill) => {
        const base = P.length / 3, NP = prof.length;
        for (let j = 0; j < NP; j++) for (let i = 0; i <= NS; i++) {
          const th = i / NS * Math.PI * 2, r = prof[j][0] * (1 + frill * Math.sin(th * 8 + j * 0.9));
          P.push(r * Math.cos(th), prof[j][1], r * Math.sin(th)); UV.push(i / NS, prof[j][2]); B.push(part, 0);
          if (i < NS && j < NP - 1) { const k = base + j * (NS + 1) + i; I.push(k, k + NS + 1, k + 1, k + 1, k + NS + 1, k + NS + 2); }
        }
      };
      const dome = []; for (let i = 0; i <= 14; i++) { const ph = i / 14 * Math.PI * 0.6; dome.push([R * Math.sin(ph), R * Math.cos(ph), i / 14 * 0.8]); }
      dome.push([R * 0.9, -R * 0.38, 0.87], [R * 0.76, -R * 0.44, 0.94], [R * 0.62, -R * 0.4, 1]);
      lathe(dome, 0, 0);
      const trunk = []; for (let i = 0; i <= 8; i++) { const v = i / 8; trunk.push([R * lerp(0.34, 0.1, Math.pow(v, 0.7)), -R * (0.12 + 1.25 * v), v]); }
      lathe(trunk, 1, 0.22);
      const ribbon = (x0, y0, z0, len, wid, tx, tz, ph, drift) => {
        const NL = 12, base = P.length / 3;
        for (let j = 0; j <= NL; j++) { const v = j / NL, w = wid * (1 - 0.6 * v), ox = drift * v * v * x0, oz = drift * v * v * z0;
          for (let s = 0; s < 2; s++) { const e = s - 0.5; P.push(x0 + ox + tx * w * e, y0 - len * v, z0 + oz + tz * w * e); UV.push(s, v); B.push(2, ph); }
          if (j < NL) { const k = base + j * 2; I.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
      };
      for (let i = 0; i < 30; i++) {                                     // streamers from the rim, every other one turned edge to the centre
        const th = (i + br.range(-0.25, 0.25)) / 30 * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), rad = i % 2;
        ribbon(c * R * 0.8, -R * 0.42, s * R * 0.8, R * br.range(1.1, 2.0), br.range(2.2, 3.6), rad ? c : -s, rad ? s : c, br(), br.range(-0.12, 0.1));
      }
      for (let i = 0; i < 6; i++) {                                      // the broad arms under the trunk
        const th = (i + 0.5) / 6 * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        ribbon(c * R * 0.08, -R * 1.3, s * R * 0.08, R * br.range(0.7, 1.1), 9, -s, c, br(), 1.5);
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); bg.setAttribute('aB', new THREE.Float32BufferAttribute(B, 2)); bg.setIndex(I); bg.computeVertexNormals();
      bell = new THREE.Mesh(bg, new THREE.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
attribute vec2 aB; uniform float uTime; varying vec2 vUv; varying vec3 vN, vW; varying float vPart;
void main(){
  vUv = uv; vPart = aB.x; vec3 p = position; float beat = sin(uTime * 1.57);
  if (aB.x < 0.5) { float rk = smoothstep(0.25, 0.8, uv.y); p.xz *= 1. + 0.07 * beat * rk; p.y += 1.6 * beat * (1. - rk); }
  else if (aB.x < 1.5) { p.xz *= 1. + 0.08 * sin(uTime * 1.57 - 1. - uv.y * 3.); }
  else {
    float al = uv.y, ph = aB.y * 6.2832;
    p.xz *= 1. + 0.07 * beat * (1. - al);
    p.x += sin(uTime * 0.5 + ph + al * 4.) * al * al * 9.;
    p.z += cos(uTime * 0.43 + ph * 1.7 + al * 3.3) * al * al * 9.;
    p.y += 2.5 * al * sin(uTime * 1.57 - al * 5. + ph);
  }
  vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * wp;
}`,
        fragmentShader: LAYER + /* glsl */`
varying vec2 vUv; varying vec3 vN, vW; varying float vPart;
void main(){
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-3, 0.));
  float line; vec4 L = c3aLayer(vW, line);
  vec3 pearl = vec3(0.98, 0.9, 0.82), gas = mix(L.rgb, pearl, 0.5);
  vec3 col; float a;
  if (vPart < 0.5) {
    vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
    float fr = 1. - abs(dot(n, V)); fr *= fr;
    float lob = abs(sin(vUv.x * 3.14159 * 24.));                       // 24 lobes with a groove between each two
    float groove = smoothstep(0., 0.3, lob);
    float band = 0.5 + 0.5 * sin(vUv.y * 46. - uTime * 0.6);
    float rim = smoothstep(0.74, 0.8, vUv.y);
    col = mix(gas * 0.86, pearl, 0.3 * fr) * (0.56 + 0.4 * groove) * (0.92 + 0.1 * band * smoothstep(0.3, 0.8, vUv.y)) * (0.86 + 0.2 * n.y);
    col = mix(col, vec3(1., 0.86, 0.66) * (0.7 + 0.3 * lob), rim * 0.5);
    col += vec3(1., 0.96, 0.86) * line * 0.6;
    a = 0.62 + 0.3 * fr + 0.12 * (1. - groove) + 0.15 * rim;
  } else if (vPart < 1.5) {
    float fl = 0.5 + 0.5 * sin(vUv.x * 6.2832 * 8. + vUv.y * 7.);
    float tv = clamp(vUv.y, 0., 1.);
    col = gas * (0.6 + 0.35 * fl) * (1.05 - 0.3 * tv); a = 0.72 - 0.2 * tv;
  } else {
    float ed = min(abs(vUv.x - 0.5) * 2., 1.), sv = clamp(vUv.y, 0., 1.);
    float bead = 0.5 + 0.5 * sin(sv * 60. - uTime * 1.2);
    col = mix(gas * 0.8, pearl, 0.25 + 0.45 * bead * bead) * (1. - 0.3 * ed);
    a = (1. - smoothstep(0.7, 1., ed)) * (0.8 - 0.45 * sv) * (1. - smoothstep(0.9, 1., sv));
  }
  // drawn after the skins: what lies on the far side of the lowest skin from the eye is seen through it, faint from above, glowing from below
  float sub = 1. - clamp(L.a, 0., 1.), camUp = step(uLv.z, cameraPosition.y);
  a *= mix(mix(1., 0.5, 1. - sub), mix(1., 0.2, sub), camUp);
  gl_FragColor = vec4(c3aFog(col, vW), clamp(a, 0., 0.95));
}`,
      }));
      bell.position.copy(bellAt); bell.frustumCulled = false; bell.renderOrder = 4.5; scene.add(bell);
    }
    await ctx.yield();

    // ---- light and fog by the layer the CAMERA is in ----
    const lowSun = hourSel === 1;
    // the middle air is a deep honey on every palette, never cream
    const honey = C1.clone(); { const h = {}; honey.getHSL(h, THREE.SRGBColorSpace); honey.setHSL(lerp(h.h, 0.1, 0.6), clamp(h.s, 0.66, 0.78), Math.min(h.l, 0.57), THREE.SRGBColorSpace); }
    const roseFog = C0.clone(); { const h = {}; roseFog.getHSL(h, THREE.SRGBColorSpace); roseFog.setHSL(h.h, Math.min(1, h.s * 1.16 + 0.08), Math.min(h.l, 0.75), THREE.SRGBColorSpace); }
    const LY = [
      { fog: deep.clone().lerp(C2, 0.3), den: 0.0022, key: new THREE.Color(0.16, 0.17, 0.15), fill: C2.clone().lerp(new THREE.Color(0.8, 0.85, 0.8), 0.4).multiplyScalar(0.95) },
      { fog: honey, den: 0.0016, key: keyCol.clone().multiply(new THREE.Color(1, 0.76, 0.38)).multiplyScalar(lowSun ? 0.4 : 0.95), fill: C1.clone().lerp(honey, 0.5).multiplyScalar(lowSun ? 0.9 : 0.76) },
      { fog: roseFog, den: 0.00102, key: keyCol.clone().multiply(new THREE.Color(1, 0.8, 0.84)).multiplyScalar(0.92), fill: C0.clone().multiplyScalar(0.55) },
      { fog: new THREE.Color(lowSun ? '#F3CFAE' : '#E9D3C4'), den: 0.00031, key: keyCol.clone().multiplyScalar(0.95), fill: new THREE.Color('#9db8d8').lerp(new THREE.Color('#5A3F52'), 0.38).multiplyScalar(0.72) },
    ];
    const cp = new THREE.Vector3(), fogC = new THREE.Color(), keyC = new THREE.Color(), fillC = new THREE.Color(), hkC = new THREE.Color(), hfC = new THREE.Color(), size = new THREE.Vector2();
    // dy = how far the camera is above the middle skin where it is right now (the hero's face as drawn this instant, or the calm sheet beyond it)
    const xing = { dy: 300, under: 0 }, xv = new THREE.Vector3();
    const skinDy = (pos, t) => { const fh = pos.y < 60 ? hero.faceHeight(pos.x, pos.z, t) : NaN; return pos.y - (fh === fh ? fh : swellAt(pos.x, pos.z, t)); };
    xing.at = (u, t) => skinDy(path.pointAt(u, xv), t);
    xing.kc = kc; xing.uX = uX;
    const applyLayer = (y, dy) => {
      const under = y < 50 && dy < 0.9; xing.dy = dy; xing.under = under ? 1 : 0;
      const w = [smoothstep(S2 - 5, S2 + 5, y), Math.max(smoothstep(40, 60, y), smoothstep(0.9, 7, dy)), smoothstep(S0 - 6, S0 + 6, y)];
      fogC.copy(LY[0].fog); keyC.copy(LY[0].key); fillC.copy(LY[0].fill); let den = LY[0].den;
      for (let i = 0; i < 3; i++) { fogC.lerp(LY[i + 1].fog, w[i]); keyC.lerp(LY[i + 1].key, w[i]); fillC.lerp(LY[i + 1].fill, w[i]); den = lerp(den, LY[i + 1].den, w[i]); }
      U.uFogCol.value.copy(fogC); U.uFogDen.value = den; U.uKey.value.copy(keyC); U.uFill.value.copy(fillC);
      scene.fog.color.copy(fogC); scene.fog.density = den; scene.background.copy(fogC);
      // seen from the rose the billow and its sea are honey, not salmon: its light is warmed a little there
      hkC.copy(keyC); hkC.g *= lerp(1, 0.97, w[1]); hkC.b *= lerp(1, 0.84, w[1]); hfC.copy(fillC); hfC.g *= lerp(1, 0.92, w[1]); hfC.b *= lerp(1, 0.66, w[1]);
      hero.setSun(sunDir, hkC); hero.setFill(hfC);
      // the instant the camera is through the hero's skin the rolled billows give way to the vaults of the world's own unbroken ceiling:
      // decided from the camera against the skin itself, and a lens-width early, while that skin still fills the frame
      upU.value = under ? 0 : 1; hero.object.visible = !under;
      veilU.uA.value = y < 50 ? (under ? smoothstep(-1.1, 0.5, dy) : 1 - smoothstep(1.0, 2.2, dy)) : 0;
      skyMat.uniforms.uClear.value = w[2]; fallMesh.renderOrder = !under ? 0 : y > S2 ? 5 : 0.5; ringMesh.renderOrder = y > S2 ? 5 : 0.6;
      for (const s of sheets) s.renderOrder = 1 + Math.round(3 - Math.min(3, Math.abs(y - s.userData.level) / 200));
    };
    applyLayer(300, 300);

    // ---- the gaze: where the eye rests at every point of the flight, laid out once along the route and smoothed, so that no
    // view whips round. Keys are either metres of look-ahead down the route or a place to look at; between two keys the eye eases over.
    const GN = 500, gz = new Float32Array((GN + 1) * 3), gp = new THREE.Vector3(), gt = new THREE.Vector3();
    {
      const P = new THREE.Vector3(), Q = new THREE.Vector3(), d0 = new THREE.Vector3(), d1 = new THREE.Vector3(), T = new THREE.Vector3();
      const fallAim = rare ? W(FALL_A + 120, fallB(-200) - 110, 0) : W(FALL_A + 40, fallB(-200) - 62, 0), bellD0 = new THREE.Vector3(), bellD1 = new THREE.Vector3();
      const skOff = new THREE.Vector3(), skT = (u) => { const al = (u - SKU) * SKSP + 26; return T.set(skBase.x + skDir[0] * al - skDir[1] * 4, S0 + 12, skBase.z + skDir[1] * al + skDir[0] * 4); };
      skOff.copy(skT(SKU)).sub(path.pointAt(SKU, P));
      const skAt = (u) => (u <= SKU ? skT(u) : T.copy(path.pointAt(u, Q)).add(skOff));      // the eye follows the elders in, and leaves them as the camera goes over them
      const heroView = () => T.set(-420, 10, 120), junkView = () => T.set(-370, 26, 198), lipView = () => T.set(20, 55, 70);
      const uHold = uFall - 0.075, fallOff = new THREE.Vector3();
      const fallT = (u) => T.set(fallAim.x, lerp(-60, -205, smoothstep(uX + 0.012, uFall - 0.045, u)), fallAim.z);
      fallOff.copy(fallT(uHold)).sub(path.pointAt(uHold, P));
      const fallView = (u) => (u <= uHold ? fallT(u) : T.copy(path.pointAt(u, Q)).add(fallOff));      // held on the fall, then the look is carried on as the camera goes by it
      const barrelView = () => T.copy(fly[8]);                                                         // into the barrel: the eye is already down the surf line while the route swings onto it
      const keys = [[0, 30], [0.015, 30], [0.07, skAt], [0.086, skAt], [0.135, heroView], [0.2, heroView], [0.238, junkView], [0.262, junkView], [0.31, lipView], [0.35, lipView],
        [uSurf - 0.035, barrelView], [uSurf + 0.004, barrelView], [uSurf + 0.03, 45], [uX - 0.055, 45], [uX + 0.05, fallView]];
      if (rare) {
        // the eye comes off the fall onto the bell standing in the skin (a little down-canyon of its heart, so it sits left of centre),
        // then onto its heart as the camera goes under beside it; both looks are directions carried with the camera, so nothing whips by
        const uA = uFall + 0.002, uB = uFall + 0.04;
        bellD0.copy(W(826 + 25, 280, S2 + 24)).sub(path.pointAt(uA, P)).normalize(); bellD1.copy(W(826 + 75, 280, S2 - 26)).sub(path.pointAt(uB, P)).normalize();
        const bellView = (u) => T.copy(bellD0).lerp(bellD1, smoothstep(uA, uB, u)).multiplyScalar(300).add(path.pointAt(u, Q));
        keys.push([uFall - 0.085, fallView], [uFall - 0.002, bellView], [uFall + 0.045, bellView], [uS2 + 0.09, 30], [1, 30]);
      } else keys.push([uFall - 0.075, fallView], [uFall + 0.03, 30], [1, 30]);
      const dirOf = (k, u, out) => { path.pointAt(u, P); if (typeof k[1] === 'number') path.posAtDist(u * path.length + k[1], Q); else Q.copy(k[1](u)); return out.subVectors(Q, P).normalize(); };
      for (let i = 0; i <= GN; i++) {
        const u = i / GN; let j = 0; while (j < keys.length - 2 && u > keys[j + 1][0]) j++;
        dirOf(keys[j], u, d0); dirOf(keys[j + 1], u, d1); d0.lerp(d1, smoothstep(keys[j][0], keys[j + 1][0], u)).normalize();
        gz[i * 3] = d0.x; gz[i * 3 + 1] = d0.y; gz[i * 3 + 2] = d0.z;
      }
      for (let pass = 0; pass < 2; pass++) {                             // a short box filter, twice: every turn of the eye is spread over a second or so
        const src = gz.slice();
        for (let i = 0; i <= GN; i++) {
          let x = 0, y = 0, z = 0; for (let k = -4; k <= 4; k++) { const q = clamp(i + k, 0, GN) * 3; x += src[q]; y += src[q + 1]; z += src[q + 2]; }
          const l = Math.hypot(x, y, z) || 1; gz[i * 3] = x / l; gz[i * 3 + 1] = y / l; gz[i * 3 + 2] = z / l;
        }
      }
    }
    const gazeAt = (t, u) => {
      const f = clamp(u, 0, 1) * GN, i = Math.min(GN - 1, Math.floor(f)), k = f - i;
      path.pointAt(u, gp); gt.set(lerp(gz[i * 3], gz[i * 3 + 3], k), lerp(gz[i * 3 + 1], gz[i * 3 + 4], k), lerp(gz[i * 3 + 2], gz[i * 3 + 5], k)).normalize();
      return gt.multiplyScalar(300).add(gp);
    };
    const pois = [{ at: gazeAt, from: -1, to: 2, weight: 1 }];
    const bump = (u, a, b, c, d) => smoothstep(a, b, u) * (1 - smoothstep(c, d, u));

    return {
      scene, path, duration: 50,
      pace: (u) => 1 - 0.33 * bump(u, uSurf - 0.04, uSurf + 0.01, uX - 0.05, uX - 0.01) + 0.25 * bump(u, uX + 0.01, uX + 0.04, uFall - 0.09, uFall - 0.05) - 0.2 * bump(u, uFall - 0.06, uFall - 0.03, uFall + 0.01, uFall + 0.04),
      title: air.name,
      camera: { fov: 62, near: 0.5, far: 5000, lookAhead: 30, sway: 0.6, bank: 0.45 },
      pois,
      portal: { shape: 'circle', radius: 13, color: '#BFF5E4', glow: 1, revealDistance: 460 },
      post: { exposure: 1, bloom: { strength: 0.35, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.04, tint: '#ffffff', shadowTint: '#2a1c26', vignette: 0.25, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        U.uTime.value = time; skU.uU.value = u;
        cp.setFromMatrixPosition(camera.matrixWorld);
        applyLayer(cp.y, skinDy(cp, time));
        sky.position.copy(cp);
        hero.update(dt, time);
        placeJunks(time);
        ctx.renderer.getDrawingBufferSize(size); flakeU.uPx.value = size.y;
        for (let i = 0; i < shafts.length; i++) shafts[i].scale.x = 1 + 0.12 * Math.sin(time * 0.4 + i * 2.1);
        if (bell) bell.position.y = bellAt.y + 92 * smoothstep(uS2 - 0.2, uS2 - 0.07, u) + 2.5 * Math.sin(time * 0.8);
      },
      dispose() { hero.dispose(); },
      crossing: xing,                                                    // read-only: the camera's height over the middle skin, for the frame-by-frame check
    };
  },
};
