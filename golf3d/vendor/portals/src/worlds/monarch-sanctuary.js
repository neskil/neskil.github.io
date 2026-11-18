// THE ORANGE AWAKENING (monarch-sanctuary): a cold grey oyamel fir forest hung with what look like dead
// leaves, until a shaft of sun travels down the Great Bough tree and a million monarchs open, lift and
// pour downhill as a river of orange.
//
// Layout (world metres). The Great Bough tree (src/parts/monarch-sanctuary.js) stands at the origin at the
// head of a stream gully that runs downhill along +Z between a dozen draped firs to a pale meadow; the
// portal stands in the meadow at z ~ 228. Everything that shares the hero's event clock lives in one
// group at the hero's base, so "hero local" = world minus (0, y0, 0).
//   u 0.00  entry 20 m up; the first bough thatched with real closed wings passes just under the lens
//   u 0.10  down between the trunks: every fir for 100 m is draped and sagging, the Great Bough ahead in the mist
//   u 0.37  THE REVEAL: the cloud tears, the light front runs down the tree (hero event clock te = 0..7 s) while
//           the camera, slowed by pace(u), closes from 55 m to 24 m with the gaze held in the crown
//   u 0.50  the air is full of wings; round the tree's -X side, turn downhill and ride the river: gully firs
//           ignite ahead in a cascade, sun shafts slide down the gully, the river's shadow flickers on the stream
//   u 0.80  the trees open on the meadow; the portal's rim is crusted with fanning wings; the river pours in
//
// One clock: te (seconds) = tau(u) - tau(uIgnite), where tau is the journey time at u under pace(u). It drives
// the hero, every draped fir (the hero's own material, instanced, with a per-tree clock offset), the released
// flyers and far sprites, the river shadow and the light. Variations by seed / ctx.vary: three hours (late morning; first
// light after frost with rime and a slower ignition; late afternoon played IN REVERSE, the river flowing
// uphill and settling back on the trees), three weathers (fast broken cloud, thin snow, still mist with a
// single shaft), a cast swap, and the rare event: the deck opens at once and every draped tree ignites.
//
// Style: naturalistic with a selective-colour device. The post grade cannot mask a hue, so the device is
// built into the materials: every albedo in the world is a desaturated grey, grey-green or straw, and
// only wings write orange (HDR, so they bloom). style: 'none'.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as SKY from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as W from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, liteFirGeometryAsync, FLYER_VERTS, GLSL_FLYWING } from '../parts/monarch-sanctuary.js';

const TAU = Math.PI * 2;
const DURATION = 47, PACE_PRE = 1.45, PACE_HOLD = 0.5;
const C = (h) => new THREE.Color(h);

// the three hours. palette order: [mist, sky, fir, bark, closed wing, sun, orange]
const HOURS = {
  morning: {
    title: 'The Orange Awakening', palette: ['#C9D3D0', '#8FA6B8', '#24382F', '#4A4038', '#8C7A66', '#FFF1D0', '#F2811D'],
    sunDir: [-0.6, 0.7, 0.4], zenith: '#8296a8', mid: '#a9b8c0', horizon: '#c9d3d0', fog: '#c2ccc9', fogDensity: 0.0058,
    hemi: [1.75, 1.5], sun: [0.22, 4.6], hemiSky: '#c9d3d0', hemiGround: '#8a8478', rate: 1, reverse: false, rime: 0, cover: [0.97, 0.45],
  },
  frost: {
    title: 'The Orange Awakening: First Light', palette: ['#D2D8E0', '#9AAAC2', '#2A3C3A', '#4A4440', '#8A7F76', '#FFE6C8', '#F2811D'],
    sunDir: [-0.74, 0.46, 0.42], zenith: '#8c9ab4', mid: '#b9c0cc', horizon: '#dcd6d6', fog: '#cdd3da', fogDensity: 0.0068,
    hemi: [1.7, 1.5], sun: [0.16, 4.0], hemiSky: '#d0d8e4', hemiGround: '#8c8c90', rate: 0.74, reverse: false, rime: 1, cover: [0.98, 0.52],
  },
  afternoon: {
    title: 'The Orange Settling', palette: ['#CFCDC2', '#A3ADB0', '#2A3A2E', '#4C4136', '#8C7A66', '#FFDDAE', '#F2811D'],
    sunDir: [-0.72, 0.5, 0.3], zenith: '#8f9aa0', mid: '#b4b8b4', horizon: '#d6d0c2', fog: '#c9c7bc', fogDensity: 0.0056,
    hemi: [1.7, 1.5], sun: [0.3, 4.5], hemiSky: '#cfcfc6', hemiGround: '#8a8376', rate: 1, reverse: true, rime: 0, cover: [0.95, 0.46],
  },
};

// ------------------------------------------------------------------------------------------ GLSL
const GLSL_UTIL = /* glsl */`
float mHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float mNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mHash(i), mHash(i+vec2(1.,0.)), f.x), mix(mHash(i+vec2(0.,1.)), mHash(i+vec2(1.,1.)), f.x), f.y); }
`;
const GLSL_FOGMIX = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float mFog = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float mFog = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  outc = mix(outc, fogColor, mFog);
#endif`;
const GLSL_RIVER = /* glsl */`
uniform vec3 uRiver[8]; uniform float uRiverLen;
vec3 riverPt(float s){
  float f = clamp(s / uRiverLen, 0.0, 1.0) * 7.0; float fi = min(floor(f), 6.0); float t = f - fi; int k = int(fi);
  vec3 p0 = uRiver[max(k - 1, 0)], p1 = uRiver[k], p2 = uRiver[min(k + 1, 7)], p3 = uRiver[min(k + 2, 7)];
  return 0.5 * ((2.0 * p1) + (p2 - p0) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (3.0 * p1 - p0 - 3.0 * p2 + p3) * t * t * t);
}
vec3 wander(float s, float t){
  return vec3(sin(t * 0.83 + s * 6.3) + 0.5 * sin(t * 1.9 + s * 17.0),
              0.7 * sin(t * 1.07 + s * 11.0) + 0.4 * sin(t * 2.3 + s * 5.0),
              cos(t * 0.71 + s * 9.0) + 0.5 * cos(t * 1.7 + s * 13.0));
}`;

// released wings: hidden until aRel.x on the clock, spiral out of aSrc, then join the river at aRel.y metres
const GLSL_FLYPOS = /* glsl */`
vec3 flyPos(float clock, out float fade){
  float a = clock - aRel.x, aa = max(a, 0.0);
  float out1 = 1.0 - exp(-aa * 0.9);
  vec2 rad = normalize(aSeed.xy - 0.5 + 1e-3);
  float sw = aa * 0.25 * (aSeed.y - 0.4) + out1 * (aSeed.x - 0.5) * 2.0;
  float cs = cos(sw), sn = sin(sw); vec2 rr = vec2(rad.x * cs - rad.y * sn, rad.x * sn + rad.y * cs);
  float cr = out1 * (2.5 + 9.0 * aSeed.w * aSeed.w);
  vec3 cloud = aSrc + vec3(rr.x * cr, out1 * (0.5 + 6.0 * aSeed.z * aSeed.z) + 0.5 * sin(aa * 0.6 + aSeed.x * 6.0), rr.y * cr);
  float sp = smoothstep(0.0, 0.3, aa) * (1.0 - smoothstep(0.9, 2.2, aa)), sa = aa * 7.0 + aSeed.x * 40.0;
  cloud += vec3(cos(sa) * rad.y, sin(sa), -cos(sa) * rad.x) * 0.5 * sp;
  cloud += wander(aSeed.x * 10.0 + aSeed.w, clock * 0.8) * (0.2 + 1.8 * out1);
  float tG = 1.0 + aSeed.z * 4.5;
  float gth = smoothstep(tG, tG + 3.5, aa) * step(0.0, aRel.y);
  float s = max(aRel.y, 0.0) + aSeed.x * 14.0 + max(aa - tG, 0.0) * (6.0 + 2.5 * aSeed.y);
  vec3 rp = riverPt(s);
  float ca = aSeed.x * 6.2832 + s * 0.035 + clock * 0.15;
  float funnel = 1.0 - 0.55 * smoothstep(uRiverLen - 62.0, uRiverLen - 14.0, s);      // the river narrows and pours into the ring
  float crad = sqrt(aSeed.y) * (3.7 + 1.2 * sin(s * 0.05 + aSeed.z * 6.0)) * funnel;
  float braid = smoothstep(25.0, 70.0, s), strand = floor(aSeed.z * 3.0);
  rp += vec3(cos(ca) * crad, sin(ca) * crad * 0.6, 0.0) * (1.0 - 0.3 * braid) + wander(aSeed.y * 9.0 + aSeed.z, clock * 1.1 + s * 0.05) * 0.7;
  rp += vec3(2.3 * sin(s * 0.052 + strand * 2.1 + clock * 0.13), 0.9 * sin(s * 0.041 + strand * 4.0), 0.0) * braid * funnel;
  fade = step(0.0, a) * (1.0 - smoothstep(uRiverLen - 18.0, uRiverLen - 2.0, s) * step(0.0, aRel.y));
  return mix(cloud, rp, gth);
}`;

// same spline in JS (uniform Catmull-Rom over 8 points, s in metres)
function riverPointJS(R, len, s, out) {
  const f = clamp(s / len, 0, 1) * 7, fi = Math.min(Math.floor(f), 6), t = f - fi;
  const p0 = R[Math.max(fi - 1, 0)], p1 = R[fi], p2 = R[Math.min(fi + 1, 7)], p3 = R[Math.min(fi + 2, 7)];
  const c = (a, b, cc, d) => 0.5 * (2 * b + (cc - a) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (3 * b - a - 3 * cc + d) * t * t * t);
  return out.set(c(p0.x, p1.x, p2.x, p3.x), c(p0.y, p1.y, p2.y, p3.y), c(p0.z, p1.z, p2.z, p3.z));
}

// ------------------------------------------------------------------------------------------ perched wings
// One instanced mesh of real butterflies at rest: two wings hinged on the body line. mode 0 = sleepers
// (shut, hanging, shivering in 25 Hz bursts), mode 1 = fanners (opening and closing in a travelling wave).
async function makePerched(list, U, yieldFn) {
  const n = list.length;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, -0.55, 0, 0, 0.55, 1, 0, 0.55, 1, 0, -0.55,
    0, 0, -0.55, 0, 0, 0.55, -1, 0, 0.55, -1, 0, -0.55]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
  const pos = new Float32Array(n * 3), up = new Float32Array(n * 3), fw = new Float32Array(n * 3), par = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    if ((i & 2047) === 2047) await yieldFn();
    const w = list[i], j = i * 4;
    pos.set(w.p, i * 3); up.set(w.up, i * 3); fw.set(w.fw, i * 3); par[j] = w.size; par[j + 1] = w.phase; par[j + 2] = w.mode; par[j + 3] = w.rnd;
  }
  await yieldFn();
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('aUp', new THREE.InstancedBufferAttribute(up, 3));
  g.setAttribute('aFwd', new THREE.InstancedBufferAttribute(fw, 3));
  g.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_UTIL}
attribute vec3 aPos, aUp, aFwd; attribute vec4 aPar;
uniform float uTime, uGate;
varying vec2 vW; varying float vRnd, vOpen, vMode; varying vec3 vWN;
void main(){
  vec3 up = normalize(aUp); vec3 fw = normalize(aFwd - up * dot(aFwd, up) + 1e-4); vec3 rt = cross(up, fw);
  float side = sign(position.x), ax = abs(position.x), rnd = aPar.w, open;
  if (aPar.z < 0.5) {
    float burst = step(0.92 - 0.22 * uGate, mHash(vec2(rnd * 91.0, floor(uTime * 1.3 + rnd * 7.0))));
    open = 0.035 + 0.03 * rnd + burst * 0.26 * (0.5 + 0.5 * sin(uTime * 157.0 + rnd * 40.0));
  } else if (aPar.z < 1.5) {
    float wv = 0.5 + 0.5 * sin(uTime * 2.3 - aPar.y);
    open = mix(0.1, 0.9, smoothstep(0.25, 0.9, wv)) * (0.75 + 0.25 * rnd);
  } else {
    // a basker: half open, breathing slowly, with a quick shiver now and then
    float burst = step(0.8, mHash(vec2(rnd * 91.0, floor(uTime * 1.1 + rnd * 7.0))));
    open = 0.3 + 0.2 * rnd + 0.2 * sin(uTime * (0.9 + rnd) + rnd * 50.0) + burst * 0.12 * sin(uTime * 150.0 + rnd * 40.0);
  }
  float ang = (1.0 - open) * 1.52;
  vec4 mc = modelViewMatrix * vec4(aPos, 1.0);
  float sc = max(aPar.x, -mc.z * 0.0021);
  vec3 lp = fw * position.z + (rt * side * cos(ang) + up * sin(ang)) * ax;
  vec4 mvPosition = modelViewMatrix * vec4(aPos + lp * sc, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vW = vec2(ax, position.z); vRnd = rnd; vOpen = open; vMode = aPar.z;
  vWN = up * cos(ang) - rt * side * sin(ang);      // the wing's own plane: the same on its four corners
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_UTIL}
uniform vec3 uOrange, uWing, uAmb, uSunCol, uSunDir; uniform float uGate, uRime;
varying vec2 vW; varying float vRnd, vOpen, vMode; varying vec3 vWN;
void main(){
  float d1 = length((vW - vec2(0.47, 0.2)) / vec2(0.53, 0.34));
  float d2 = length((vW - vec2(0.36, -0.2)) / vec2(0.39, 0.35));
  float d = min(d1, d2); if (d > 1.0) discard;
  float edge = smoothstep(0.7, 0.93, d);
  float fan = atan(vW.y, vW.x + 0.06);
  float vein = smoothstep(0.0, 0.28, abs(sin(fan * 10.0 + vW.x * 2.0)));
  float dots = step(0.55, mHash(floor(vec2(fan * 9.0, d * 7.0)) + vRnd)) * edge;
  vec3 outc;
  if (gl_FrontFacing) {
    float bask = step(1.5, vMode);
    float shv = step(vMode, 0.5) * smoothstep(0.09, 0.2, vOpen);      // a shivering sleeper shows a sliver of its orange upper wing
    vec3 col = mix(uWing * 1.15, uOrange, max(max(uGate, 0.9 * shv), bask)) * (0.75 + 0.5 * vRnd) * (0.28 + 0.72 * vein) * (1.0 - 0.93 * edge) + vec3(0.6) * dots * max(uGate, bask);
    outc = col * (uAmb + uSunCol * uGate * 0.5) + col * vec3(1.0, 0.72, 0.42) * max(uGate * (0.2 + 0.9 * vOpen) + 0.5 * shv, bask * (0.35 + 0.5 * vOpen));
  } else {
    vec3 col = mix(uWing, uOrange * 0.55, 0.14 * max(uGate, 0.8 * step(1.5, vMode)) * step(0.5, vMode)) * (0.62 + 0.6 * vRnd) * (0.55 + 0.45 * vein) * (1.0 - 0.6 * edge) + vec3(0.2) * dots;
    col = mix(col, vec3(0.74, 0.79, 0.85), uRime * 0.45 * smoothstep(0.35, 0.8, mNoise(vW * 9.0 + vRnd * 40.0)));
    // a shut wing is a pale straw leaf with a form: broadside to the bright place of the sky it is light, edge on it is dark,
    // darker where it is tucked in at the hinge, and its outline catches the sky
    float turn = clamp(abs(dot(vWN, uSunDir)), 0.0, 1.0), tip = clamp(vW.x, 0.0, 1.0);
    col *= vec3(1.46, 1.38, 1.14) * (0.62 + 0.56 * turn) * (0.74 + 0.42 * tip);
    col += vec3(0.4, 0.44, 0.48) * smoothstep(0.93, 1.0, d) * (0.5 + 0.5 * turn);
    outc = col * (uAmb * 1.25 + uSunCol * uGate * 0.4);
  }
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'monarch-perched';
  return mesh;
}

// ------------------------------------------------------------------------------------------ cascade flyers
// Two-triangle butterflies released from the gully firs just behind each tree's light front. They spiral
// out, then join the same river spline as the hero's flyers. A pure function of the clock, so the
// afternoon variant simply runs it backwards (they fly up the river and settle).
async function makeFlyers(list, U, yieldFn) {
  const n = list.length;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLYER_VERTS), 3));
  g.setAttribute('aBary', new THREE.BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1]), 3));
  g.setIndex([0, 2, 1, 0, 1, 3]);
  const src = new Float32Array(n * 3), rel = new Float32Array(n * 2), seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { if ((i & 2047) === 2047) await yieldFn(); const f = list[i]; src.set(f.p, i * 3); rel[i * 2] = f.t; rel[i * 2 + 1] = f.s; seed.set(f.seed, i * 4); }
  await yieldFn();
  g.setAttribute('aSrc', new THREE.InstancedBufferAttribute(src, 3));
  g.setAttribute('aRel', new THREE.InstancedBufferAttribute(rel, 2));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_UTIL}
${GLSL_RIVER}
attribute vec3 aBary, aSrc; attribute vec2 aRel; attribute vec4 aSeed;
uniform float uClock, uTime, uGate, uSize; uniform vec3 uSunDir;
varying vec3 vBary; varying float vLit, vSeed, vFade, vPx, vBack;
${GLSL_FLYPOS}
void main(){
  float fade, f2;
  vec3 c = flyPos(uClock, fade);
  vec3 c2 = flyPos(uClock + 0.12, f2);
  vec3 fw = c2 - c; float fl = length(fw);
  fw = fl > 1e-4 ? fw / fl : vec3(0.0, 0.0, 1.0);
  fw = normalize(fw + vec3(0.0, 0.15, 0.0));
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)) + 1e-4), up = cross(rt, fw);
  // no two fly alike: each holds its own heading and bank about the stream's direction, and wavers
  float yaw = (fract(aSeed.y * 13.7 + aSeed.z) - 0.5) * 1.6 + 0.3 * sin(uTime * 1.3 + aSeed.x * 31.0);
  float rol = (fract(aSeed.z * 9.1 + aSeed.w) - 0.5) * 1.6 + 0.3 * sin(uTime * 1.7 + aSeed.y * 23.0);
  vec3 fwY = fw * cos(yaw) + rt * sin(yaw); rt = rt * cos(yaw) - fw * sin(yaw); fw = fwY;
  vec3 rtR = rt * cos(rol) + up * sin(rol); up = up * cos(rol) - rt * sin(rol); rt = rtR;
  float ph = uTime * (46.0 + 16.0 * aSeed.z) + aSeed.x * 60.0;
  float glide = smoothstep(0.55, 0.7, fract(uTime * 0.37 + aSeed.w * 5.0 + aSeed.y));
  float ang = mix(0.15 + 1.05 * sin(ph), 0.06 + 0.34 * aSeed.z, glide);
  ang = mix(1.45, ang, smoothstep(0.0, 0.35, uClock - aRel.x));
  vec4 mc = modelViewMatrix * vec4(c, 1.0);
  // the early ones (never released: aRel.x far in the past) are drawn larger, so that a wing in the grey reads as a wing;
  // aRel.y = -2 marks those that live inside a standing sun shaft and are lit by it before the tear
  float early = step(aRel.x, -500.0), inShaft = early * step(aRel.y, -1.5);
  float sc = max(uSize * (1.0 + 0.6 * early), -mc.z * mix(0.0021, 0.0042, early)) * (0.7 + 0.7 * fract(aSeed.w * 7.31 + aSeed.x * 3.7)) * fade * smoothstep(0.4, 3.2, -mc.z);
  sc *= 1.0 + 0.6 * (1.0 - smoothstep(0.8, 4.5, uClock - aRel.x));
  float side = position.x;
  vec3 lp = fw * position.z + rt * (side * cos(ang)) + up * (abs(side) * sin(ang));
  vec4 mvPosition = modelViewMatrix * vec4(c + lp * sc, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vBary = aBary; vSeed = aSeed.x; vFade = fade; vPx = sc / max(-mc.z * 0.0022, 1e-4);
  vec3 wv = (modelMatrix * vec4(c, 1.0)).xyz - cameraPosition;
  vBack = uGate * smoothstep(0.6, 0.95, dot(wv, uSunDir) / max(length(wv), 1e-3));      // between the lens and the sun: amber glass
  vLit = uGate * smoothstep(0.3, 0.62, mNoise(c.xz * 0.045 + vec2(1.7, -uTime * 0.36)));
  vLit = max(vLit, 0.22 * early + inShaft * (0.5 + 0.3 * sin(uTime * 0.7 + aSeed.x * 40.0)));
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uOrange, uSunCol, uAmb;
varying vec3 vBary; varying float vLit, vSeed, vFade, vPx, vBack;
${GLSL_FLYWING}
void main(){
  if (vFade < 0.01) discard;
  float white, ink = flyWing(vBary, vPx, vSeed, white);
  vec3 col = mix(uOrange * (0.8 + 0.5 * vSeed) * ink, vec3(0.75), white);
  if (!gl_FrontFacing) col = mix(col, vec3(dot(col, vec3(0.5))) * vec3(1.3, 0.9, 0.55), 0.3);
  vec3 outc = col * (uAmb * 0.7 + uSunCol * vLit * 0.45) + col * vec3(1.0, 0.74, 0.45) * (0.15 + vLit * 0.85 + vBack * 0.9) * ink;
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'monarch-cascade-flyers';
  return mesh;
}

// ------------------------------------------------------------------------------------------ river shadow
// A sheet draped on the ground along the river, multiplied into what is under it: the flickering dapple
// of thousands of wings overhead. uFront / uTail (metres along the river) say where the river is.
function makeRiverShadow(R, len, groundLocal, U) {
  const SEG = 120, AC = 6, HALF = 8.5, P = [], A = [], I = [];
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i <= SEG; i++) {
    const s = (i / SEG) * len; riverPointJS(R, len, s, p); riverPointJS(R, len, Math.min(s + 1, len + 1), q);
    let tx = q.x - p.x, tz = q.z - p.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    for (let j = 0; j <= AC; j++) {
      const a = (j / AC) * 2 - 1, x = p.x + tz * a * HALF, z = p.z - tx * a * HALF;
      P.push(x, groundLocal(x, z) + 0.4, z); A.push(a, s);
    }
  }
  for (let i = 0; i < SEG; i++) for (let j = 0; j < AC; j++) { const a = i * (AC + 1) + j, b = a + AC + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAS', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uFront: { value: -100 }, uTail: { value: -200 }, uAmount: { value: 0.55 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
attribute vec2 aAS; varying vec2 vAS;
void main(){ vAS = aAS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${GLSL_UTIL}
uniform float uTime, uFront, uTail, uAmount; varying vec2 vAS;
void main(){
  float pres = smoothstep(uFront + 6.0, uFront - 28.0, vAS.y) * smoothstep(uTail - 6.0, uTail + 30.0, vAS.y);
  float across = 1.0 - smoothstep(0.35, 1.0, abs(vAS.x));
  float d1 = mNoise(vec2(vAS.y * 0.9 - uTime * 7.0, vAS.x * 5.0));
  float d2 = mNoise(vec2(vAS.y * 2.3 - uTime * 13.0, vAS.x * 11.0 + 3.0));
  float flick = 0.8 + 0.2 * sin(uTime * 31.0 + vAS.y * 0.8);
  float k = pres * across * uAmount * (0.45 + 0.75 * d1 * d2 + 0.25 * d1) * flick;
  gl_FragColor = vec4(vec3(1.0 - clamp(k, 0.0, 0.7)), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 3; mesh.frustumCulled = false; mesh.name = 'river-shadow';
  return mesh;
}

// ------------------------------------------------------------------------------------------ sun on the ground
// Where the hero's shaft meets the slope: a sheet draped on the ground that brightens what is under it
// (dst * (1 + src)), so needles, moss and stones keep their own colours inside the pool. uPool = local x, z, strength.
async function makeSunPool(groundLocal, sunDir, U, yieldFn) {
  const X0 = -42, X1 = 78, Z0 = -72, Z1 = 96, ST = 4, NX = Math.round((X1 - X0) / ST), NZ = Math.round((Z1 - Z0) / ST), P = [], I = [];
  for (let j = 0; j <= NZ; j++) {
    if ((j & 7) === 7) await yieldFn();
    for (let i = 0; i <= NX; i++) { const x = X0 + i * ST, z = Z0 + j * ST; P.push(x, groundLocal(x, z) + 0.45, z); }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const az = new THREE.Vector2(sunDir.x, sunDir.z).normalize();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSunCol: U.uSunCol, uPool: { value: new THREE.Vector3(0, 0, 0) }, uAz: { value: new THREE.Vector3(az.x, az.y, 1 / Math.max(sunDir.y, 0.3)) } },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.OneFactor,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
varying vec2 vXZ;
void main(){ vXZ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${GLSL_UTIL}
uniform float uTime; uniform vec3 uSunCol, uPool, uAz; varying vec2 vXZ;
void main(){
  vec2 d = vXZ - uPool.xy;
  float al = dot(d, uAz.xy) / (8.5 * uAz.z), ac = dot(d, vec2(-uAz.y, uAz.x)) / 8.5;
  float r = sqrt(al * al + ac * ac) + 0.22 * (mNoise(vXZ * 0.35 + vec2(uTime * 0.4, 0.0)) - 0.5);
  float k = (1.0 - smoothstep(0.55, 1.15, r)) * (0.8 + 0.35 * mNoise(vXZ * 1.3 - vec2(0.0, uTime * 0.7)));
  gl_FragColor = vec4(uSunCol * (0.75 * uPool.z * k), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 3; mesh.frustumCulled = false; mesh.name = 'sun-pool';
  return mesh;
}

// ------------------------------------------------------------------------------------------ cloud shadow on the meadow
// A sheet a little above the grass, multiplied into everything under it: broad soft shadows of the torn deck
// sliding over the meadow, so that sunlit and shaded grass alternate. uK = how much sun there is to be shaded from.
function makeCloudShade(hAt, U) {
  const X0 = -84, X1 = 84, Z0 = 138, Z1 = 348, ST = 7, NX = Math.round((X1 - X0) / ST), NZ = Math.round((Z1 - Z0) / ST), P = [], I = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const x = X0 + i * ST, z = Z0 + j * ST; P.push(x, hAt(x, z) + 1.5, z); }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uK: { value: 0 } },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    vertexShader: /* glsl */`
varying vec2 vXZ;
void main(){ vXZ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${GLSL_UTIL}
uniform float uTime, uK; varying vec2 vXZ;
void main(){
  vec2 q = vXZ + vec2(uTime * 5.5, uTime * 1.6);
  float n = 0.62 * mNoise(q * 0.03) + 0.28 * mNoise(q * 0.075 + 7.0) + 0.1 * mNoise(q * 0.21);
  float edge = smoothstep(84.0, 62.0, abs(vXZ.x)) * smoothstep(138.0, 158.0, vXZ.y) * smoothstep(348.0, 318.0, vXZ.y);
  float k = smoothstep(0.42, 0.62, n) * 0.5 * uK * edge;
  gl_FragColor = vec4(mix(vec3(1.0), vec3(0.5, 0.56, 0.66), k), 1.0);      // shade is cooler as well as darker
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 1; mesh.frustumCulled = false; mesh.name = 'cloud-shade';
  return mesh;
}

// ------------------------------------------------------------------------------------------ sun on the stream
// Glints on the water that exist only inside the footprints of the sliding sun shafts (uRay: x = z of a
// footprint, y = its strength), so the stream is dark until a shaft crosses it.
function makeStreamGlints(gx, hAt, z0, z1, U) {
  const P = [], A = [], I = []; let n = 0;
  for (let z = z0; z <= z1; z += 2.5, n++) {
    const x = gx(z), dx = (gx(z + 1) - gx(z - 1)) / 2, il = 1 / Math.hypot(1, dx);
    for (const a of [-1, 1]) { const px = x + a * 1.75 * il, pz = z - a * 1.75 * dx * il; P.push(px, hAt(x, z) + 0.37, pz); A.push(a, z); }
  }
  for (let i = 0; i < n - 1; i++) I.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAS', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I);
  const uRay = []; for (let i = 0; i < 6; i++) uRay.push(new THREE.Vector3(-1e4, 0, 0));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSunCol: U.uSunCol, uRay: { value: uRay } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec2 aAS; varying vec2 vAS;
void main(){ vAS = aAS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${GLSL_UTIL}
uniform float uTime; uniform vec3 uSunCol; uniform vec3 uRay[6]; varying vec2 vAS;
void main(){
  float lit = 0.0;
  for (int i = 0; i < 6; i++) { float d = (vAS.y - uRay[i].x) / 7.5; lit += uRay[i].y * exp(-d * d); }
  vec2 gp = vec2(vAS.x * 7.0, vAS.y * 7.0 - uTime * 2.6), id = floor(gp), f = fract(gp) - 0.5;
  float h = mHash(id), s1 = max(sin(uTime * (5.0 + 9.0 * h) + h * 40.0), 0.0);
  float tw = s1 * s1 * s1 * s1 * step(0.5, h);
  float spot = smoothstep(0.4, 0.04, length(f * vec2(1.0, 2.2)));
  float edge = 1.0 - smoothstep(0.55, 1.0, abs(vAS.x));
  gl_FragColor = vec4(uSunCol * (tw * spot * edge * min(lit, 1.6) * 8.5), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 4; mesh.frustumCulled = false; mesh.name = 'stream-glints';
  return mesh;
}

// ------------------------------------------------------------------------------------------ small builders
// A thin tapered tube along points (bark limbs, rope), appended to arrays.
function pushTube(B, pts, r0, r1, sides, col) {
  const n = pts.length, start = B.P.length / 3, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    a.copy(pts[Math.min(i + 1, n - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
    b.set(0, 1, 0); if (Math.abs(a.y) > 0.9) b.set(1, 0, 0);
    c.crossVectors(a, b).normalize(); b.crossVectors(c, a).normalize();
    const r = lerp(r0, r1, i / (n - 1));
    for (let s = 0; s < sides; s++) {
      const an = (s / sides) * TAU, cx = Math.cos(an), sx = Math.sin(an);
      const nx = c.x * cx + b.x * sx, ny = c.y * cx + b.y * sx, nz = c.z * cx + b.z * sx, k = (0.72 + 0.5 * ((s * 5 + i * 3) % 4) / 4) * (0.8 + 0.4 * Math.abs(Math.sin(i * 1.7 + s * 2.3)));
      B.P.push(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r); B.N.push(nx, ny, nz); B.C.push(col.r * k, col.g * k, col.b * k);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) {
    const p0 = start + i * sides + s, p1 = start + i * sides + (s + 1) % sides;
    B.I.push(p0, p1, p0 + sides, p1, p1 + sides, p0 + sides);
  }
}
function tubeMesh(B, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.C, 3)); g.setIndex(B.I);
  return new THREE.Mesh(g, mat);
}

// One sagging bough thatched with real closed wings (the macro opening). Returns nothing: limb tubes go to
// B, wings to `wings`. from = attachment on the trunk, tip = where it ends near the camera path.
function addWingBough(B, wings, rng, spec, bark, wingSize, bare = 0) {
  let curve;
  if (spec.pts) curve = new THREE.CatmullRomCurve3(spec.pts, false, 'centripetal');
  else {
    const ctl = new THREE.Vector3().lerpVectors(spec.from, spec.tip, 0.4); ctl.y += 0.9 + spec.from.distanceTo(spec.tip) * 0.06;
    curve = new THREE.QuadraticBezierCurve3(spec.from, ctl, spec.tip);
  }
  const hero = !!spec.pts, len = curve.getLength();
  const main = curve.getSpacedPoints(hero ? 44 : 14);
  pushTube(B, main, hero ? 0.2 : 0.11, hero ? 0.065 : 0.03, hero ? 8 : 5, bark);
  const lines = [main], dir = new THREE.Vector3(), lat = new THREE.Vector3();
  const nTw = hero ? 13 : 9;
  for (let k = 0; k < nTw; k++) {
    const t = Math.min(lerp(Math.max(0.22, bare), 1, (k + rng()) / nTw), 1), o = curve.getPointAt(t), sd = k % 2 ? 1 : -1, L = rng.range(0.9, 1.9) * (1.15 - 0.5 * t);
    curve.getTangentAt(t, dir).setY(0).normalize(); lat.set(-dir.z, 0, dir.x);
    const tw = [];
    for (let j = 0; j <= 5; j++) {
      const f = j / 5;
      tw.push(new THREE.Vector3().copy(o).addScaledVector(lat, sd * L * f).addScaledVector(dir, L * 0.45 * f).add(new THREE.Vector3(0, -0.55 * L * f * f - (hero ? 0.25 * f : 0), 0)));
    }
    pushTube(B, tw, hero ? 0.045 : 0.035, 0.012, 4, bark); lines.push(tw);
  }
  spec.lines = lines; spec.bare = bare; spec.w0 = wings.length;      // for the needle sprays that grow on the same limb and twigs; where this bough's wings begin in the list
  // strands of shut wings hanging off every line, overlapping like shingles
  const p = new THREE.Vector3();
  for (const line of lines) {
    const c = new THREE.CatmullRomCurve3(line), L = c.getLength(), u0 = line === main ? bare : 0, nS = Math.round(L * (1 - u0) / 0.072);
    const hd0 = Math.atan2(line[line.length - 1].z - line[0].z, line[line.length - 1].x - line[0].x);
    for (let i = 0; i < nS; i++) {
      c.getPointAt(Math.min(1, u0 + (1 - u0) * (i + rng()) / nS), p);
      if (hero && line === main) for (let k = 0; k < 5; k++) {      // seen from above: wings lying over the top of the bough like roof shingles
        const a2 = hd0 + rng.range(-0.35, 0.35);
        wings.push({
          p: [p.x + rng.range(-0.13, 0.13), p.y + 0.02 + rng.range(0, 0.06), p.z + rng.range(-0.13, 0.13)],
          up: [rng.range(-0.5, 0.5), 1, rng.range(-0.5, 0.5)], fw: [Math.cos(a2), -0.25, Math.sin(a2)],
          size: wingSize * rng.range(0.9, 1.2), phase: 0, mode: 0, rnd: rng(),
        });
      }
      const strand = rng.int(line === main ? 4 : 3, line === main ? 12 : 8), jx = rng.range(-0.05, 0.05), jz = rng.range(-0.05, 0.05), hd = rng.range(0, TAU);
      for (let k = 0; k < strand; k++) {
        wings.push({
          p: [p.x + jx + rng.range(-0.02, 0.02), p.y - 0.02 - k * wingSize * 0.72, p.z + jz + rng.range(-0.02, 0.02)],
          up: [rng.range(-0.25, 0.25), -1, rng.range(-0.25, 0.25)], fw: [Math.cos(hd + rng.range(-0.5, 0.5)), 0, Math.sin(hd + rng.range(-0.5, 0.5))],
          size: wingSize * rng.range(0.85, 1.15), phase: 0, mode: 0, rnd: rng(),
        });
      }
    }
  }
  spec.w1 = wings.length;
  return len;
}

// ------------------------------------------------------------------------------------------ far wings
// The sky-filling burst and the far river: soft point sprites on the same flight function as the flyers
// (one vertex each). They fade out near the lens, where the real two-triangle butterflies take over.
async function makeSprites(list, U, uPx, yieldFn) {
  const n = list.length, g = new THREE.BufferGeometry();
  const src = new Float32Array(n * 3), rel = new Float32Array(n * 2), seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { if ((i & 2047) === 2047) await yieldFn(); const f = list[i]; src.set(f.p, i * 3); rel[i * 2] = f.t; rel[i * 2 + 1] = f.s; seed.set(f.seed, i * 4); }
  await yieldFn();
  g.setAttribute('position', new THREE.BufferAttribute(src, 3));
  g.setAttribute('aRel', new THREE.BufferAttribute(rel, 2));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_UTIL}
${GLSL_RIVER}
#define aSrc position
attribute vec2 aRel; attribute vec4 aSeed;
uniform float uClock, uTime, uGate, uPx;
varying float vLit, vSeed, vFade, vFlap, vFar;
${GLSL_FLYPOS}
void main(){
  float fade;
  vec3 c = flyPos(uClock, fade);
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float d = max(-mvPosition.z, 0.5);
  float young = 1.0 - smoothstep(0.8, 5.0, uClock - aRel.x);
  float res = max(1.0, uPx / 400.0);      // the floor is an angle, not a pixel count: the same cloud at any resolution
  gl_PointSize = fade * smoothstep(6.0, 14.0, d) * clamp(uPx * 0.3 * (0.8 + 0.4 * aSeed.w) * (1.0 + 0.7 * young) / d, (3.2 + 1.8 * young) * res, (9.0 + 5.0 * young) * res);
  vFlap = 0.5 + 0.5 * sin(uTime * (40.0 + 16.0 * aSeed.z) + aSeed.x * 60.0);
  vSeed = aSeed.x; vFade = fade;
  vFar = 1.0 - 0.6 * smoothstep(55.0, 110.0, d);      // thin far off, so the portal's rim reads through the river's far end
  vLit = uGate * smoothstep(0.3, 0.62, mNoise(c.xz * 0.045 + vec2(1.7, -uTime * 0.36)));
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uOrange, uSunCol, uAmb;
varying float vLit, vSeed, vFade, vFlap, vFar;
void main(){
  if (vFade < 0.01) discard;
  // a soft pair of rounded wings meeting at the body, beating: far off the burst is a glowing cloud, never square pixels
  vec2 pc = abs(gl_PointCoord - 0.5) * 2.0;
  float span = 0.35 + 0.65 * vFlap;
  float dd = length(vec2((pc.x - 0.46 * span) / (0.5 * span), pc.y / 0.66));
  float al = smoothstep(1.0, 0.5, dd);
  if (al < 0.03) discard;
  vec3 col = uOrange * (0.8 + 0.5 * vSeed) * (0.6 + 0.4 * vFlap) * (0.75 + 0.6 * al);
  vec3 outc = col * (uAmb * 0.7 + uSunCol * vLit * 0.45) + col * vec3(1.0, 0.74, 0.45) * (0.15 + vLit * 0.85);
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, al * 0.78 * vFar);
}`,
  });
  Object.assign(mat.uniforms, U, { uPx });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 2; pts.name = 'monarch-far-wings';
  return pts;
}

// ------------------------------------------------------------------------------------------ loose wings
// Each oriole snatch leaves two wings spiralling down. aT = the moment (seconds on the journey clock) it
// was let go; uTau is the journey clock, so they fall as the camera arrives.
function makeLooseWings(list, U, uTau) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -0.5, 1, 0, -0.45, 1, 0, 0.5, 0, 0, 0.35]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const p0 = new Float32Array(n * 3), sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { p0.set(list[i].p, i * 3); sd.set(list[i].seed, i * 4); }
  g.setAttribute('aP0', new THREE.InstancedBufferAttribute(p0, 3));
  g.setAttribute('aSd', new THREE.InstancedBufferAttribute(sd, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aP0; attribute vec4 aSd;      // aSd: release time, spiral radius, phase, rnd
uniform float uTau;
varying vec2 vW; varying float vShow, vRnd;
void main(){
  float a = uTau - aSd.x, aa = clamp(a, 0.0, 12.0);
  float ph = aa * (2.6 + aSd.w) + aSd.z;
  vec3 c = aP0 + vec3(cos(ph) * aSd.y * (0.4 + 0.2 * aa), -0.75 * aa - 0.12 * sin(ph * 2.0), sin(ph) * aSd.y * (0.4 + 0.2 * aa));
  vShow = step(0.0, a) * (1.0 - smoothstep(9.0, 11.0, a));
  float sp = aa * 9.0 + aSd.z * 3.0;
  vec3 ax = normalize(vec3(cos(sp), 0.5 * sin(sp * 0.7), sin(sp))), bx = normalize(cross(ax, vec3(0.2, 1.0, 0.3)));
  vec4 mc = modelViewMatrix * vec4(c, 1.0);
  float sc = max(0.11, -mc.z * 0.004) * vShow;
  vec4 mvPosition = modelViewMatrix * vec4(c + (ax * position.x + bx * position.z) * sc, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vW = position.xz; vRnd = aSd.w;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uOrange, uSunCol, uAmb; uniform float uGate;
varying vec2 vW; varying float vShow, vRnd;
void main(){
  if (vShow < 0.01) discard;
  float d = length((vW - vec2(0.48, 0.0)) / vec2(0.52, 0.5)); if (d > 1.0) discard;
  float ink = (1.0 - 0.9 * smoothstep(0.7, 0.93, d)) * (0.45 + 0.55 * smoothstep(0.0, 0.3, abs(sin(atan(vW.y, vW.x + 0.05) * 9.0))));
  vec3 col = uOrange * (0.8 + 0.4 * vRnd) * ink;
  vec3 outc = col * (uAmb + uSunCol * uGate * 0.4) + col * vec3(1.0, 0.74, 0.45) * (0.2 + 0.6 * uGate);
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  Object.assign(mat.uniforms, U, { uTau });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'loose-wings';
  return mesh;
}

// ------------------------------------------------------------------------------------------ early wakers
// Single monarchs on the firs where a cold pencil of light touches a cluster. Each sits on its perch (aPos, on the
// surface whose normal is aUp), opening and closing its wings slowly; for a fifth of its own cycle it lets go, drifts
// a metre out and round and settles again. aPar = heading, phase, period (s), rnd: drawn per wing, so at any moment
// of the clock some sit shut, some bask and a few are in the air. aRel = the clock at which its tree ignites (it leaves).
function makeWakers(list, U) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLYER_VERTS), 3));
  g.setAttribute('aBary', new THREE.BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1]), 3));
  g.setIndex([0, 2, 1, 0, 1, 3]);
  const pos = new Float32Array(n * 3), up = new Float32Array(n * 3), par = new Float32Array(n * 4), rel = new Float32Array(n);
  for (let i = 0; i < n; i++) { const w = list[i]; pos.set(w.p, i * 3); up.set(w.up, i * 3); par.set(w.par, i * 4); rel[i] = w.rel; }
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('aUp', new THREE.InstancedBufferAttribute(up, 3));
  g.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4)); g.setAttribute('aRel', new THREE.InstancedBufferAttribute(rel, 1));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aBary, aPos, aUp; attribute vec4 aPar; attribute float aRel;
uniform float uTime, uClock;
varying vec3 vBary; varying float vLit, vSeed, vPx;
void main(){
  float rnd = aPar.w, ph = fract(uTime / aPar.z + aPar.y);
  float air = smoothstep(0.0, 0.025, ph) * (1.0 - smoothstep(0.175, 0.2, ph)), a = clamp(ph / 0.2, 0.0, 1.0) * 6.2832;
  vec3 up = normalize(aUp), hd = vec3(cos(aPar.x), 0.35, sin(aPar.x));
  vec3 f0 = normalize(hd - up * dot(hd, up) + vec3(1e-4, 0.0, 0.0)), r0 = cross(up, f0);
  float R = 0.45 + 0.45 * rnd, gone = smoothstep(0.0, 0.7, uClock - aRel);
  vec3 c = aPos + up * 0.03 + (f0 * sin(a) + r0 * (1.0 - cos(a))) * R + up * (0.4 * R * sin(a * 0.5)) + vec3(0.0, 3.0 * gone, 0.0);
  vec3 fw = f0 * cos(a) + r0 * sin(a), rt = cross(up, fw);
  float bask = smoothstep(0.2, 0.9, 0.5 + 0.5 * sin(uTime * (0.5 + 0.5 * rnd) + rnd * 40.0));
  float ang = mix(mix(1.42, 0.3, bask), 0.15 + 1.05 * sin(uTime * (46.0 + 16.0 * rnd) + rnd * 60.0), max(air, gone));
  vec4 mc = modelViewMatrix * vec4(c, 1.0);
  float sc = max(0.13, -mc.z * 0.0042) * (0.8 + 0.4 * fract(rnd * 7.31)) * (1.0 - gone) * smoothstep(0.4, 3.2, -mc.z);
  float side = position.x;
  vec3 lp = fw * position.z + rt * (side * cos(ang)) + up * (abs(side) * sin(ang));
  vec4 mvPosition = modelViewMatrix * vec4(c + lp * sc, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vBary = aBary; vSeed = rnd; vPx = sc / max(-mc.z * 0.0022, 1e-4);
  vLit = 0.5 + 0.2 * sin(uTime * 0.7 + rnd * 40.0) + 0.3 * bask * (1.0 - air);      // in the pencil's light: an ember, brightest when it basks
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uOrange, uSunCol, uAmb;
varying vec3 vBary; varying float vLit, vSeed, vPx;
${GLSL_FLYWING}
void main(){
  float white, ink = flyWing(vBary, vPx, vSeed, white);
  vec3 col = mix(uOrange * (0.8 + 0.5 * vSeed) * ink, vec3(0.75), white);
  if (!gl_FrontFacing) col = mix(col, vec3(dot(col, vec3(0.5))) * vec3(1.3, 0.9, 0.55), 0.3);
  vec3 outc = col * (uAmb * 0.7 + uSunCol * vLit * 0.45) + col * vec3(1.0, 0.74, 0.45) * (0.15 + vLit * 0.85) * ink;
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'early-wakers';
  return mesh;
}

// ------------------------------------------------------------------------------------------ fallen wings
// The litter under the firs: patches lying on the ground, each a strew of fallen closed wings (pale straw undersides,
// veined; here and there one lies upper side up, a faded brown-orange). Far off, where single wings can no longer be told apart,
// a patch is a pale mottling of the floor. list: { x, z, s (metres across), rot, rnd }; surf(x, z) = the ground's surface.
async function makeLitter(list, surf, U, yieldFn) {
  const n = list.length, P = new Float32Array(n * 27), UV = new Float32Array(n * 18), R = new Float32Array(n * 9), I = new Uint32Array(n * 24);
  for (let i = 0; i < n; i++) {
    if ((i & 127) === 127) await yieldFn();
    const it = list[i], c = Math.cos(it.rot) * it.s * 0.5, s = Math.sin(it.rot) * it.s * 0.5, v0 = i * 9;
    for (let k = 0; k < 9; k++) {      // three by three knots, each laid on the ground's surface, so a patch follows the slope's creases
      const a = (k % 3) - 1, b = Math.floor(k / 3) - 1, x = it.x + a * c - b * s, z = it.z + a * s + b * c, j = v0 + k;
      P[j * 3] = x; P[j * 3 + 1] = surf(x, z) + 0.06; P[j * 3 + 2] = z; UV[j * 2] = a * 0.5 + 0.5; UV[j * 2 + 1] = b * 0.5 + 0.5; R[j] = it.rnd;
    }
    for (let q = 0; q < 4; q++) { const a = v0 + (q % 2) + Math.floor(q / 2) * 3; I.set([a, a + 3, a + 1, a + 1, a + 3, a + 4], i * 24 + q * 6); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setAttribute('aRnd', new THREE.BufferAttribute(R, 1)); g.setIndex(new THREE.BufferAttribute(I, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aRnd; varying vec2 vUv, vXZ; varying float vRnd;
void main(){
  vUv = uv; vRnd = aRnd; vXZ = (modelMatrix * vec4(position, 1.0)).xz;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_UTIL}
uniform vec3 uAmb, uSunCol; uniform float uGate;
varying vec2 vUv, vXZ; varying float vRnd;
void main(){
  // the wings lie in cells of the ground itself (17 cm), so two patches that overlap show the same wings
  vec2 uvc = clamp(vUv, 0.0, 1.0), p = vXZ * 5.88, id = floor(p), f = fract(p) - 0.5;
  float fw = max(fwidth(p.x), fwidth(p.y));
  float h = mHash(id), h2 = mHash(id + 13.7), an = h * 6.2832, cs = cos(an), sn = sin(an);
  vec2 d = vec2(f.x * cs - f.y * sn, f.x * sn + f.y * cs);
  float t = clamp(d.y / 0.84 + 0.5, 0.0, 1.0);
  float hw = 0.27 * sqrt(max(sin(3.14159 * pow(t, 1.3)), 0.0)) + 0.012;
  float e = max(abs(d.x) / hw, abs(d.y / 0.84) * 2.0);
  // how thickly they lie: drifts and bare places inside the patch, thinning to nothing at its rim
  float drift = smoothstep(0.4, 0.56, 0.6 * mNoise(vXZ * 0.6 + vRnd * 40.0) + 0.4 * mNoise(vXZ * 2.1));
  float dens = (0.12 + 0.8 * drift) * (1.0 - smoothstep(0.45, 1.0, length(uvc - 0.5) * 2.0)), there = step(fract(h2 * 5.3), dens);
  float lod = 1.0 - smoothstep(0.22, 0.6, fw);
  float alpha = mix(0.75 * dens * (0.35 + 0.65 * smoothstep(0.3, 0.7, mNoise(vXZ * 3.7))), (1.0 - smoothstep(1.0 - min(fw * 4.0, 0.6), 1.0, e)) * there, lod);
  if (alpha < 0.02) discard;
  float vein = 0.7 + 0.3 * smoothstep(0.0, 0.3, abs(sin(atan(d.x, d.y + 0.9) * 14.0)));
  vec3 col = mix(vec3(0.33, 0.27, 0.18), vec3(0.6, 0.52, 0.38), mix(0.45, h, lod)) * mix(1.0, vein * (1.0 - 0.4 * smoothstep(0.7, 1.0, e)), lod);
  col = mix(col, vec3(0.42, 0.22, 0.1), 0.75 * step(0.9, fract(h * 13.0)) * lod);      // one in ten lies upper side up
  col *= 0.78 + 0.44 * mNoise(vXZ * 2.9 + 3.0);      // a drift is never one flat tone
  vec3 outc = col * (uAmb * 1.5 + uSunCol * uGate * 0.22);
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, alpha);
}`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 1; mesh.name = 'forest-litter';
  return mesh;
}

// ------------------------------------------------------------------------------------------ the stream's face
// A sheet lying on the stream from its head to beyond the portal: the water as it is seen from just above it.
// Straight down, the pale gravel of its bed shows through moving ripples; further off it mirrors the deck's light; and
// where the river of wings is overhead (uFront / uTail, metres along the river: the same two the river's shadow reads)
// the mirror breaks into orange. rows: { c (centre, on the water), nx, nz (across), s (metres along the river),
// wl, wr (how far the water reaches on either side before the ground rises out of it) }.
const STREAM_FACE_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec2 aAS, aBank; varying vec2 vAS, vBank; varying vec3 vW;
void main(){
  vAS = aAS; vBank = aBank; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STREAM_FACE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_UTIL}
uniform float uTime, uGate, uFront, uTail; uniform vec3 uSkyA, uSkyB, uOrange, uSunCol, uAmb;
varying vec2 vAS, vBank; varying vec3 vW;
void main(){
  float ax = clamp(vAS.x, -4.0, 4.0), s = vAS.y, shore = (ax < 0.0 ? vBank.x : vBank.y) - abs(ax);      // metres of water between here and the bank
  vec2 q = vec2(ax, vW.z);
  float sp = 1.2 + 0.9 * smoothstep(0.0, 1.5, shore);      // the water runs faster in mid-channel
  vec2 rp = vec2(mNoise(vec2(q.x * 1.7, q.y * 0.75 - uTime * sp)), mNoise(vec2(q.x * 1.3 + 9.0, q.y * 0.6 - uTime * sp * 0.8))) - 0.5;
  rp += 0.5 * (vec2(mNoise(vec2(q.x * 4.3, q.y * 2.1 - uTime * sp * 1.7)), mNoise(vec2(q.x * 3.7 + 5.0, q.y * 1.9 - uTime * sp * 1.5))) - 0.5);
  // the bed: pale gravel seen through the ripples, darker and greener where the water is deeper
  vec2 bp = q + rp * 0.35;
  float peb = 0.55 * mNoise(bp * 3.1) + 0.3 * mNoise(bp * 7.3 + 4.0) + 0.15 * mNoise(bp * 17.0);
  vec3 bed = mix(vec3(0.13, 0.14, 0.12), vec3(0.42, 0.41, 0.36), smoothstep(0.34, 0.68, peb)) * mix(vec3(1.0), vec3(0.4, 0.56, 0.52), smoothstep(0.1, 1.7, shore));
  bed *= uAmb * 2.2 + uSunCol * uGate * 0.22;
  // light running in lines down the current: the ripples' own faces turned to the deck
  float line = smoothstep(0.56, 0.86, mNoise(vec2(q.x * 3.3 + rp.x * 1.5, q.y * 0.55 - uTime * sp * 1.1)));
  bed += uSkyA * (0.3 * line * (0.4 + 0.6 * smoothstep(0.0, 0.8, shore)));
  // the mirror: the deck's light, and under the river of wings the wings themselves, broken by the ripples
  vec3 V = normalize(cameraPosition - clamp(vW, -4000.0, 4000.0) + vec3(0.0, 1e-3, 0.0)), N = normalize(vec3(rp.x * 0.55, 1.0, rp.y * 0.55));
  float F = 0.03 + 0.97 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
  vec3 sky = mix(uSkyA, uSkyB, clamp(reflect(-V, N).y, 0.0, 1.0)) * (1.0 + 0.35 * uGate);
  float pres = smoothstep(uFront + 6.0, uFront - 28.0, s) * smoothstep(uTail - 6.0, uTail + 30.0, s);
  float dap = mNoise(vec2(q.y * 0.9 - uTime * 6.0, q.x * 2.3)) * mNoise(vec2(q.y * 2.1 - uTime * 11.0, q.x * 4.0 + 3.0));
  vec3 mir = mix(sky, uOrange * (0.9 + 1.4 * uGate), 0.72 * pres * smoothstep(0.12, 0.42, dap + 0.25 * rp.x));
  vec3 outc = mix(bed, mir, F);
  float foam = smoothstep(0.35, 0.0, shore) * smoothstep(0.45, 0.7, mNoise(vec2(q.x * 2.0, q.y * 1.4 - uTime * 0.9)));      // where the water turns round the bank
  outc = mix(outc, vec3(0.75, 0.78, 0.78) * (uAmb * 2.0), foam * 0.7);
  float alpha = smoothstep(-0.15, 0.25, shore) * 0.94;
  if (alpha < 0.01) discard;
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, alpha);
}`;
function makeStreamFace(rows, U, shadowU, skyA, skyB) {
  const AC = 6, HALF = 3.8, n = rows.length, P = [], A = [], B = [], I = [];
  for (let i = 0; i < n; i++) {
    const r = rows[i];
    for (let j = 0; j <= AC; j++) { const ax = ((j / AC) * 2 - 1) * HALF; P.push(r.c.x + r.nx * ax, r.c.y, r.c.z + r.nz * ax); A.push(ax, r.s); B.push(r.wl, r.wr); }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < AC; j++) { const a = i * (AC + 1) + j, b = a + AC + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAS', new THREE.Float32BufferAttribute(A, 2)); g.setAttribute('aBank', new THREE.Float32BufferAttribute(B, 2)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: STREAM_FACE_VERT, fragmentShader: STREAM_FACE_FRAG,
  });
  Object.assign(mat.uniforms, U, { uFront: shadowU.uFront, uTail: shadowU.uTail, uSkyA: { value: skyA }, uSkyB: { value: skyB } });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 3.5; mesh.frustumCulled = false; mesh.name = 'stream-face';
  return mesh;
}

// ------------------------------------------------------------------------------------------ pools of light
// Where each cold pencil of light meets the forest floor: a small sheet on the ground that brightens what is under it
// (dst * (1 + src)), drawn out along the sun's azimuth as the pencil's own footprint is. feet: Vector3 on the ground.
function makeLightPools(feet, surf, sunDir, U) {
  const n = feet.length, P = new Float32Array(n * 27), UV = new Float32Array(n * 18), I = new Uint32Array(n * 24);
  const az = new THREE.Vector2(sunDir.x, sunDir.z).normalize(), along = 2.1 / Math.max(sunDir.y, 0.3), across = 2.1;
  for (let i = 0; i < n; i++) {
    const v0 = i * 9;
    for (let k = 0; k < 9; k++) {
      const a = (k % 3) - 1, b = Math.floor(k / 3) - 1, x = feet[i].x + az.x * a * along - az.y * b * across, z = feet[i].z + az.y * a * along + az.x * b * across, j = v0 + k;
      P[j * 3] = x; P[j * 3 + 1] = surf(x, z) + 0.12; P[j * 3 + 2] = z; UV[j * 2] = a; UV[j * 2 + 1] = b;
    }
    for (let q = 0; q < 4; q++) { const a = v0 + (q % 2) + Math.floor(q / 2) * 3; I.set([a, a + 3, a + 1, a + 1, a + 3, a + 4], i * 24 + q * 6); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setIndex(new THREE.BufferAttribute(I, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color() }, uK: { value: 0 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.OneFactor,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    vertexShader: /* glsl */`
varying vec2 vUv, vXZ;
void main(){ vUv = uv; vXZ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${GLSL_UTIL}
uniform float uTime, uK; uniform vec3 uCol; varying vec2 vUv, vXZ;
void main(){
  float r = length(clamp(vUv, -1.0, 1.0)) + 0.18 * (mNoise(vXZ * 0.9 + vec2(uTime * 0.3, 0.0)) - 0.5);
  float k = (1.0 - smoothstep(0.35, 1.0, r)) * (0.8 + 0.3 * mNoise(vXZ * 2.3 - vec2(0.0, uTime * 0.5)));
  gl_FragColor = vec4(uCol * (uK * k), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 3; mesh.name = 'light-pools';
  return mesh;
}

// ------------------------------------------------------------------------------------------ the cloud deck
// A sheet high above the Great Bough, fixed in the world: the deck's lighter and darker reaches drifting on the wind,
// and one brighter place where the sun stands behind it (uBreak: where the sun's line through the tree's crown meets
// the sheet). uDeck thins it as the deck tears, so that the torn sky behind it shows through.
function makeDeck(y, breakXZ, wind, U, dark, light, sunCol) {
  const g = new THREE.PlaneGeometry(4200, 4200, 1, 1); g.rotateX(Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uDeck: { value: 1 }, uBreak: { value: breakXZ }, uWind: { value: wind }, uDark: { value: dark }, uLight: { value: light }, uSunCol: { value: sunCol } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
varying vec2 vXZ;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vXZ = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
${GLSL_UTIL}
uniform float uTime, uDeck; uniform vec2 uBreak, uWind; uniform vec3 uDark, uLight, uSunCol; varying vec2 vXZ;
float dFbm(vec2 p){ return 0.5 * mNoise(p) + 0.3 * mNoise(p * 2.13 + 7.3) + 0.2 * mNoise(p * 4.7 + 19.1); }
void main(){
  vec2 xz = clamp(vXZ, -2400.0, 2400.0);
  vec2 q = xz * 0.0016 + uWind * uTime;
  float n = dFbm(q), f = dFbm(q * 3.1 + vec2(4.0, 9.0) + uWind * uTime * 1.7);
  float reach = (n - 0.5) * 2.2 + (f - 0.5) * 0.7;      // under 0 a darker reach of the deck, over 0 a lighter one
  float a = smoothstep(0.05, 0.5, abs(reach)) * (reach < 0.0 ? 0.5 : 0.78);
  vec3 col = reach < 0.0 ? uDark : uLight;
  float d = min(length(xz - uBreak) / 380.0, 4.0), glow = exp(-d * d * 2.2);
  col = mix(col, uSunCol * (0.75 + 0.5 * f), glow);      // the brighter place: the deck is thin there and its grain shows silver
  a = max(a, glow * (0.55 + 0.35 * f));
  a *= (1.0 - smoothstep(1000.0, 1750.0, length(xz))) * uDeck;
  gl_FragColor = vec4(col, a);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.position.set(0, y, 0); mesh.renderOrder = -0.5; mesh.frustumCulled = false; mesh.name = 'cloud-deck';
  return mesh;
}

// ------------------------------------------------------------------------------------------ needles of the opening's boughs
// A fir bough is green under its load: flat sprays of needles (one card each: a midrib with a comb of needles either side,
// drawn in the shader) grow out of the limb and of every twig of the four boughs of the opening, to the left and right
// by turns, and on the bare reach of each limb next to its trunk short branchlets carry more of them.
function makeBoughNeedles(specs, rnd, U) {
  const P = [], UV = [], N = [], R = [];
  const up = new THREE.Vector3(0, 1, 0), o = new THREE.Vector3(), tn = new THREE.Vector3(), lat = new THREE.Vector3(), ax = new THREE.Vector3(), wd = new THREE.Vector3(), nn = new THREE.Vector3(), q = new THREE.Vector3();
  const card = (at, axis, len, half, r, kind) => {
    nn.set(rnd.range(-0.35, 0.35), 1, rnd.range(-0.35, 0.35)).normalize(); wd.crossVectors(axis, nn).normalize(); nn.crossVectors(wd, axis).normalize();
    for (const [a, b] of [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]]) {
      q.copy(at).addScaledVector(axis, a * len).addScaledVector(wd, b * half); q.y -= a * a * len * 0.22;      // every spray droops a little toward its tip
      P.push(q.x, q.y, q.z); UV.push(a, b); N.push(nn.x, nn.y, nn.z); R.push(r, kind);
    }
  };
  const along = (curve, t0, t1, step, size) => {
    const L = curve.getLength() * (t1 - t0), n = Math.max(1, Math.round(L / step));
    for (let i = 0; i < n; i++) {
      const t = Math.min(1, t0 + (t1 - t0) * (i + rnd()) / n), sd = i % 2 ? 1 : -1;
      curve.getPointAt(t, o); curve.getTangentAt(t, tn); lat.crossVectors(up, tn).normalize();
      ax.copy(tn).multiplyScalar(rnd.range(0.45, 0.8)).addScaledVector(lat, sd * rnd.range(0.7, 1)).addScaledVector(up, rnd.range(-0.18, 0.12)).normalize();
      const len = size * rnd.range(0.75, 1.25);
      card(o, ax, len, rnd.range(0.04, 0.052), rnd(), 0);
    }
  };
  for (const sp of specs) {
    if (!sp.lines) continue;
    sp.lines.forEach((line, k) => {
      const c = new THREE.CatmullRomCurve3(line);
      along(c, k ? 0.04 : sp.bare, 1, 0.055, k ? 0.24 : 0.27);
      if (k) return;
      // the bare reach of the limb: a branchlet every third of a metre, to the left and right by turns, each with its own sprays
      const Lb = c.getLength() * sp.bare, nb = Math.round(Lb / 0.34);
      for (let i = 0; i < nb; i++) {
        const t = sp.bare * (i + rnd()) / nb, sd = i % 2 ? 1 : -1, len = rnd.range(0.55, 1.05);
        c.getPointAt(t, o); c.getTangentAt(t, tn); lat.crossVectors(up, tn).normalize();
        ax.copy(tn).multiplyScalar(0.55).addScaledVector(lat, sd).normalize();
        const a0 = o.clone(), a2 = o.clone().addScaledVector(ax, len); a2.y -= len * rnd.range(0.25, 0.5);
        const a1 = a0.clone().lerp(a2, 0.5); a1.y += len * 0.12;
        const bc = new THREE.QuadraticBezierCurve3(a0, a1, a2);
        for (let j = 0; j < 4; j++) { bc.getPointAt(j / 4, o); bc.getTangentAt(j / 4 + 0.1, tn); card(o, tn, len / 4 * 1.04, 0.022, rnd(), 1); }      // its stem: four thin strips
        along(bc, 0.1, 1, 0.055, 0.22);
      }
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 2));
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec2 aR; varying vec2 vUv, vR; varying vec3 vN;
void main(){
  vUv = uv; vR = aR; vN = normal;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_UTIL}
uniform vec3 uAmb, uSunCol, uSunDir; uniform float uGate, uRime;
varying vec2 vUv, vR; varying vec3 vN;
void main(){
  float a = clamp(vUv.x, 0.0, 1.0), b = clamp(abs(vUv.y), 0.0, 1.0);      // along the spray; out from its midrib
  float s = (a - 0.16 * b) * 23.0, lod = clamp(fwidth(s) * 1.6, 0.0, 1.0);      // the needles lean toward the tip
  vec3 col; float keep;
  if (vR.y > 0.5) { keep = 1.0; col = vec3(0.3, 0.25, 0.2) * (0.8 + 0.4 * vR.x); }
  else {
    float outl = (1.0 - a * a) * (0.3 + 0.7 * smoothstep(0.0, 0.1, a));      // the comb's outline: full by the twig, drawn in to a point
    float f = abs(fract(s + vR.x * 7.0) - 0.5) * 2.0, wide = 0.62 - 0.3 * b / max(outl, 0.05);
    float needle = mix(step(f, wide), 1.0, lod) * step(b, outl), rib = step(b, 0.07);
    keep = max(needle, rib);
    float topSide = gl_FrontFacing ? 0.0 : 1.0;
    vec3 green = mix(vec3(0.21, 0.3, 0.27), vec3(0.11, 0.19, 0.165), topSide);      // dark above, paler below, as on a fir
    green *= (0.72 + 0.5 * (1.0 - f) * (1.0 - lod)) * (0.8 + 0.4 * vR.x) * (0.75 + 0.45 * b);
    green = mix(green, vec3(0.72, 0.8, 0.86), uRime * 0.4 * smoothstep(0.55, 1.0, b / max(outl, 0.05)));      // rime on the needle tips
    col = mix(green, vec3(0.3, 0.25, 0.2), rib * (1.0 - needle * 0.5));
  }
  if (keep < 0.5) discard;
  float turn = clamp(abs(dot(vN, uSunDir)), 0.0, 1.0);
  vec3 outc = col * (uAmb * (1.0 + 0.7 * turn) + uSunCol * uGate * (0.15 + 0.4 * turn));
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  mat.uniforms.uAmb = U.uAmb; mat.uniforms.uSunCol = U.uSunCol; mat.uniforms.uSunDir = U.uSunDir; mat.uniforms.uGate = U.uGate; mat.uniforms.uRime = U.uRime;
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'bough-needles';
  return mesh;
}

// ------------------------------------------------------------------------------------------ the ribbon into the ring
// One narrow band of wings that leaves the river above the meadow, climbs out to one side of it and pours down
// through the upper half of the portal's ring. uRib: its eight places (the first on the river, the sixth in the
// ring's plane); uRibS0: the river metre at which it leaves. It is there where the river is (the river-shadow's
// own uFront / uTail, in river metres), and every wing's place is a pure function of the event clock.
function makeRibbon(n, rnd, pts, len, s0, U, shadowU) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLYER_VERTS), 3));
  g.setAttribute('aBary', new THREE.BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1]), 3));
  g.setIndex([0, 2, 1, 0, 1, 3]);
  const seed = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) seed[i] = rnd();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]), side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_UTIL}
${GLSL_RIVER}
attribute vec3 aBary; attribute vec4 aSeed;
uniform float uClock, uTime, uGate, uSize, uRibLen, uRibS0, uFront, uTail; uniform vec3 uSunDir, uRib[8];
varying vec3 vBary; varying float vLit, vSeed, vFade, vPx, vBack;
vec3 ribPt(float s){
  float f = clamp(s / uRibLen, 0.0, 1.0) * 7.0; float fi = min(floor(f), 6.0); float t = f - fi; int k = int(fi);
  vec3 p0 = uRib[max(k - 1, 0)], p1 = uRib[k], p2 = uRib[min(k + 1, 7)], p3 = uRib[min(k + 2, 7)];
  return 0.5 * ((2.0 * p1) + (p2 - p0) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (3.0 * p1 - p0 - 3.0 * p2 + p3) * t * t * t);
}
vec3 ribPos(float clock, out float r){
  r = mod(aSeed.x * uRibLen + clock * (7.0 + 1.6 * aSeed.y), uRibLen);
  vec3 p = ribPt(r), tn = normalize(ribPt(r + 0.6) - p + vec3(0.0, 0.0, 1e-4));
  vec3 nb = normalize(cross(tn, vec3(0.0, 1.0, 0.0)) + 1e-4), bb = cross(nb, tn);
  float th = r * 0.075, cs = cos(th), sn = sin(th), gather = smoothstep(0.0, 18.0, r);      // the band turns over slowly along its length
  float a = aSeed.z * 2.0 - 1.0, b = fract(aSeed.w * 7.3) * 2.0 - 1.0;
  vec3 off = (nb * cs + bb * sn) * (a * mix(2.8, 0.95, gather)) + (bb * cs - nb * sn) * (b * mix(1.5, 0.24, gather));
  return p + off + wander(aSeed.y * 9.0 + aSeed.z, clock * 1.1 + r * 0.05) * 0.1;
}
void main(){
  float r, r2;
  vec3 c = ribPos(uClock, r), c2 = ribPos(uClock + 0.12, r2);
  float sR = uRibS0 + r;
  float fade = smoothstep(uFront + 6.0, uFront - 28.0, sR) * smoothstep(uTail - 6.0, uTail + 30.0, sR) * smoothstep(0.0, 9.0, r) * (1.0 - smoothstep(uRibLen - 13.0, uRibLen - 1.5, r));
  vec3 fw = c2 - c; float fl = length(fw);
  fw = fl > 1e-4 && fl < 3.0 ? fw / fl : vec3(0.0, 0.0, 1.0);
  fw = normalize(fw + vec3(0.0, 0.15, 0.0));
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)) + 1e-4), up = cross(rt, fw);
  float yaw = (fract(aSeed.y * 13.7 + aSeed.z) - 0.5) * 1.2 + 0.3 * sin(uTime * 1.3 + aSeed.x * 31.0);
  float rol = (fract(aSeed.z * 9.1 + aSeed.w) - 0.5) * 1.2 + 0.3 * sin(uTime * 1.7 + aSeed.y * 23.0);
  vec3 fwY = fw * cos(yaw) + rt * sin(yaw); rt = rt * cos(yaw) - fw * sin(yaw); fw = fwY;
  vec3 rtR = rt * cos(rol) + up * sin(rol); up = up * cos(rol) - rt * sin(rol); rt = rtR;
  float ph = uTime * (46.0 + 16.0 * aSeed.z) + aSeed.x * 60.0;
  float glide = smoothstep(0.55, 0.7, fract(uTime * 0.37 + aSeed.w * 5.0 + aSeed.y));
  float ang = mix(0.15 + 1.05 * sin(ph), 0.06 + 0.34 * aSeed.z, glide);
  vec4 mc = modelViewMatrix * vec4(c, 1.0);
  float sc = max(uSize * 1.2, -mc.z * 0.0026) * (0.7 + 0.7 * fract(aSeed.w * 7.31 + aSeed.x * 3.7)) * fade * smoothstep(0.4, 3.2, -mc.z);
  float side = position.x;
  vec3 lp = fw * position.z + rt * (side * cos(ang)) + up * (abs(side) * sin(ang));
  vec4 mvPosition = modelViewMatrix * vec4(c + lp * sc, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vBary = aBary; vSeed = aSeed.x; vFade = fade; vPx = sc / max(-mc.z * 0.0022, 1e-4);
  vec3 wv = (modelMatrix * vec4(c, 1.0)).xyz - cameraPosition;
  vBack = uGate * smoothstep(0.6, 0.95, dot(wv, uSunDir) / max(length(wv), 1e-3));      // between the eye and the sun: amber glass, as the river's own wings
  vLit = uGate * (0.55 + 0.45 * smoothstep(0.3, 0.62, mNoise(c.xz * 0.045 + vec2(1.7, -uTime * 0.36))));
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uOrange, uSunCol, uAmb;
varying vec3 vBary; varying float vLit, vSeed, vFade, vPx, vBack;
${GLSL_FLYWING}
void main(){
  if (vFade < 0.01) discard;
  float white, ink = flyWing(vBary, vPx, vSeed, white);
  vec3 col = mix(uOrange * (0.8 + 0.5 * vSeed) * ink, vec3(0.75), white);
  if (!gl_FrontFacing) col = mix(col, vec3(dot(col, vec3(0.5))) * vec3(1.3, 0.9, 0.55), 0.3);
  vec3 outc = col * (uAmb * 0.7 + uSunCol * vLit * 0.45) + col * vec3(1.0, 0.74, 0.45) * (0.15 + vLit * 0.85 + vBack * 0.9) * ink;
  ${GLSL_FOGMIX}
  gl_FragColor = vec4(outc, 1.0);
}`,
  });
  Object.assign(mat.uniforms, U, { uRib: { value: pts }, uRibLen: { value: len }, uRibS0: { value: s0 }, uFront: shadowU.uFront, uTail: shadowU.uTail });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'wing-ribbon';
  return mesh;
}

// ==========================================================================================
export default {
  id: 'monarch-sanctuary',
  name: 'The Orange Awakening',
  category: 'wilderness',
  weirdness: 0.03,
  media: ['air', 'tiny'],

  async build(ctx) {
    await ctx.yield();
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};

    // ---------------------------------------------------------------- which visit is this?
    const vr = rng.fork('variation');
    const hourPick = vr.pick(['morning', 'morning', 'frost', 'afternoon']);
    const weatherPick = vr.pick(['broken', 'broken', 'snow', 'still']);
    const castB = vr.chance(0.5);
    const hourName = vary.hour === 'dawn' || vary.hour === 'night' ? 'frost' : vary.hour === 'golden' ? 'afternoon' : vary.hour === 'day' ? 'morning' : hourPick;
    const H = HOURS[hourName], weather = weatherPick, rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const pal = H.palette, REV = H.reverse;
    const sunAz = vr.range(-0.18, 0.18);
    const xr = vr.fork('second-pass');      // everything added later draws from here, so the first layout is untouched
    const sunDir = new THREE.Vector3(H.sunDir[0], H.sunDir[1], H.sunDir[2]).applyAxisAngle(new THREE.Vector3(0, 1, 0), sunAz).normalize();

    // ---------------------------------------------------------------- the mountainside
    const mPh = rng.range(0, TAU), mA = rng.range(5, 8), mK = rng.range(0.036, 0.048);
    const gx = (z) => mA * Math.sin(z * mK + mPh) * smoothstep(25, 70, z) * (1 - smoothstep(112, 156, z));   // gully centre line
    const slopeAt = (z) => lerp(lerp(lerp(0.09, 0.22, smoothstep(-45, 10, z)), 0.032, smoothstep(138, 176, z)), 0.3, smoothstep(520, 600, z));
    const Z0 = -600, DZ = 2, NZ = 820, prof = new Float32Array(NZ + 1);
    for (let i = 1; i <= NZ; i++) prof[i] = prof[i - 1] - slopeAt(Z0 + (i - 0.5) * DZ) * DZ;
    { const o = prof[Math.round(-Z0 / DZ)]; for (let i = 0; i <= NZ; i++) prof[i] -= o; }
    const gz = (z) => { const f = clamp((z - Z0) / DZ, 0, NZ - 1e-3), i = Math.floor(f); return lerp(prof[i], prof[i + 1], f - i); };
    const hRaw = (x, z) => {
      const dx = x - gx(z), ad = Math.abs(dx);
      const depth = 3.6 * smoothstep(4, 24, z) * (1 - 0.72 * smoothstep(150, 185, z));
      const sideK = lerp(0.07, 0.24, smoothstep(-30, 40, z)) * (1 - 0.8 * smoothstep(138, 180, z));
      const a = Math.max(0, ad - 9), b = Math.max(0, ad - 44);
      const side = sideK * a * a / (a + 14) + smoothstep(138, 180, z) * 0.24 * b * b / (b + 14);
      const n = 1.5 * noise.fbm2(x * 0.021, z * 0.021, 3) * smoothstep(3, 16, ad) + 0.3 * noise.fbm2(x * 0.12 + 9, z * 0.12, 2) * smoothstep(1, 6, ad);
      return gz(z) - depth * Math.exp(-(dx * dx) / 30) + side + n;
    };

    // ---------------------------------------------------------------- the flight
    // In along the slope among draped boughs, straight at the Great Bough; slow while the light runs down it,
    // closing from 55 m to 24 m and rounding its -X side inside the released cloud; then down the river.
    const P = (x, z, up) => [x, hRaw(x, z) + up, z];
    const Pg = (z, up) => [gx(z), hRaw(gx(z), z) + up, z];
    const ex = rng.range(-4, 4);
    const ZP = 228;                                    // portal
    // The entry axis points at the Great Bough (its crown stands on the horizon line through the previous portal);
    // the reveal is flown low and close, 19-20 m from the trunk, looking up through the sagging limbs.
    const path = makePath([
      P(-50 + ex * 0.5, -205, 20), P(-44.5 + ex * 0.5, -170, 20), P(-40 + ex * 0.3, -134, 16.5), P(-39, -100, 10.5), P(-38, -70, 7.2), P(-32, -47, 4.8),
      P(-19.5, -25, 4.0), P(-14.5, -12.5, 4.0), P(-19.5, -1, 5.0), P(-17.5, 10, 6.2), P(-11, 23, 7), P(-4, 35, 7.6),
      Pg(54, 7.6), Pg(78, 5.9), Pg(104, 5.4), Pg(130, 5.3), [0, hRaw(0, 160) + 5.4, 160], [0, hRaw(0, 194) + 5.9, 194], [0, hRaw(0, ZP) + 6.7, ZP],
    ]);
    const uI = path.nearestXZ(-32, -47).u - (H.rate < 1 ? 0.02 : 0);     // the light strikes the crown here
    const uHold = path.nearestXZ(-14.5, -12.5).u, uTurn = path.nearestXZ(-11, 23).u;
    // lingering: slow through the reveal, quick down the river. tau(u) = seconds into the journey at u (the same
    // table the engine builds from pace), so the event clock stays keyed to u and still runs in real seconds.
    // (the grey prelude is flown briskly: the saved seconds are spent in the hold, with the air full of wings)
    const paceBase = (u) => lerp(PACE_PRE, 1.3, smoothstep(uI - 0.02, uTurn + 0.05, u)) - 0.18 * smoothstep(0.86, 0.93, u);
    const pace = (u) => lerp(paceBase(u), PACE_HOLD, smoothstep(uI - 0.05, uI + 0.015, u) * (1 - smoothstep(uTurn - 0.03, uTurn + 0.05, u)));
    const NT = 64, tauTab = new Float32Array(NT + 1);
    for (let i = 0; i < NT; i++) tauTab[i + 1] = tauTab[i] + 2 / (clamp(pace(i / NT), 0.35, 2.5) + clamp(pace((i + 1) / NT), 0.35, 2.5));
    const tau = (u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return DURATION * lerp(tauTab[i], tauTab[i + 1], x - i) / tauTab[NT]; };
    const tauI = tau(uI), tauR = tau(uHold) + 4.5;
    let uR = uHold; while (uR < 1 && tau(uR) < tauR) uR += 0.002;
    const T1 = 7.2 / H.rate;      // a hesitant ignition (rate < 1) only slows the sweep; afterwards the river keeps pace with the camera
    const teOf = REV ? (u) => tauR - tau(u) : (u) => { const q = tau(u) - tauI; return q < T1 ? q * H.rate : 7.2 + (q - T1); };
    const gateOf = REV ? (u) => 1 - 0.68 * smoothstep(uR - 0.05, uR + 0.16, u)
      : rare ? (u) => smoothstep(uI - 0.012, uI + 0.035, u) : (u) => smoothstep(uI - 0.02, uI + 0.09, u);
    const camClock = (x, z) => teOf(path.nearestXZ(x, z).u);            // clock value when the camera is abreast of (x, z)
    // the sight line from the approach to the Great Bough stays open
    // (and a narrower avenue from the entry point, so the tree's silhouette is what the previous portal shows)
    const segD = (x, z, ax, az) => { const t = clamp(((x - ax) * -ax + (z - az) * -az) / (ax * ax + az * az), 0, 1); return Math.hypot(x - ax * (1 - t), z - az * (1 - t)); };
    const p0 = path.posAtDist(0);
    const sightDist = (x, z) => Math.min(segD(x, z, -39, -104), segD(x, z, p0.x, p0.z) * 1.3, Math.hypot(x - p0.x, z - p0.z) * 0.45);

    await ctx.yield();
    // ---------------------------------------------------------------- scene, sky, light
    const scene = new THREE.Scene();
    const fogCol = C(H.fog);
    scene.fog = new THREE.FogExp2(fogCol, H.fogDensity * 0.76 * (weather === 'still' ? 1.25 : weather === 'snow' ? 1.1 : 1));
    scene.background = fogCol.clone();
    const sky = SKY.makeSky({
      rng, preset: 'overcast', zenith: H.zenith, mid: H.mid, horizon: H.horizon, ground: H.fog, horizonPow: 2.2, fogColor: H.fog,
      sunDirection: sunDir, sunColor: pal[5], sunIntensity: 7, sunGlow: 0.5, veil: 0.9, scatterColor: pal[5], scatter: 0.25,
      clouds: { coverage: H.cover[0], softness: 0.5, lit: '#d3d6d4', shade: '#727d88', absorb: 1.6, silver: 0.6, scale: 1.15, detail: 0.7, wind: weather === 'still' ? [0.008, 0.002] : [0.05, 0.012] },
      clouds2: { coverage: 0.9, softness: 0.6, scale: 0.5, stretch: 0.25, opacity: 1, lit: '#c2c8ca', shade: '#8b949c', wind: [0.02, 0.005] },
    });
    scene.add(sky.object);
    await ctx.yield();
    const hemi = new THREE.HemisphereLight(C(H.hemiSky), C(H.hemiGround), H.hemi[0]);
    const sun = new THREE.DirectionalLight(C(pal[5]), H.sun[0]);
    sun.position.copy(sunDir).multiplyScalar(200); scene.add(hemi, sun, sun.target);
    await ctx.yield();

    // ---------------------------------------------------------------- terrain
    const cNeedle = C('#6b6053'), cNeedle2 = C('#82766a'), cFern = C('#6a7068'), cDirt = C('#8c8172'), cStraw = C('#8f8a75'), cStraw2 = C('#9d9a87'), cWet = C('#33342f'), cRime = C('#c6ced6'), cMoss = C('#6f7a62'), cDamp = C('#4f463c');
    const groundCol = (x, z, out) => {
      const dx = x - gx(z), ad = Math.abs(dx);
      const n1 = noise.fbm2(x * 0.05, z * 0.05, 3), n2 = noise.n2(x * 0.31, z * 0.31);
      const n3 = noise.fbm2(x * 0.17 + 31, z * 0.17, 2);
      out.copy(cNeedle).lerp(cNeedle2, clamp(0.5 + n2 * 0.5, 0, 1)).lerp(cFern, smoothstep(0.05, 0.45, n1) * 0.7);
      out.lerp(cMoss, 0.75 * smoothstep(0.12, 0.42, n3)).lerp(cDamp, 0.6 * smoothstep(0.15, 0.5, -n3));
      const meadow = smoothstep(140, 176, z) * (1 - smoothstep(38, 50, ad + 6 * n1));
      out.lerp(cStraw, meadow).lerp(cStraw2, meadow * clamp(0.5 + 0.5 * n2, 0, 1));
      out.lerp(cDirt, 0.8 * smoothstep(1.4, 0.6, Math.abs(dx - 7.5 - 1.2 * Math.sin(z * 0.09))) * smoothstep(14, 26, z));     // footpath, left bank
      out.lerp(cWet, 0.88 * smoothstep(4.4, 2.1, ad) * smoothstep(4, 20, z));      // the wet margin of the stream
      if (H.rime) out.lerp(cRime, 0.4 * smoothstep(-0.2, 0.5, n2 + n1));
      return out;
    };
    const terrain = await T.makeTerrainAsync({
      rng: rng.fork('terrain'), noise, path, height: hRaw, corridor: { clearance: 3.2, width: 9 }, margin: 205, cell: 3, near: 30, levels: 4,
      maxTriangles: 46000, biome: 'meadow', sunDir, skirt: 30,
      palette: { rock: '#6f6a62', rockB: '#5c5852', clouds: 0.6, cloudSize: 38, cloudSpeed: 8, tufts: 0.3, patchAmount: 0, altAmount: 0, pebbles: 0.45 },
      color: (x, z, h, ny, out) => groundCol(x, z, out),
    }, ctx.yield);
    scene.add(terrain.object);
    const hAt = (x, z) => terrain.heightAt(x, z);
    const cloudU = terrain.uniforms && terrain.uniforms.uTCloud ? terrain.uniforms.uTCloud.value : null;
    await ctx.yield();

    // ---------------------------------------------------------------- the hero and its river
    const y0 = hAt(0, 0) - 0.4;
    const rCtl = [[9, 13], [40, 8.5], [70, 6.2], [100, 5.6], [130, 5.5], [160, 5.6], [196, 6.2], [ZP + 9, 6.9]]
      .map(([z, up]) => new THREE.Vector3(gx(z) * 0.85, hAt(gx(z), z) + up - y0, z));
    const river = new THREE.CatmullRomCurve3(rCtl, false, 'centripetal').getSpacedPoints(7);
    let riverLen = 0; for (let i = 1; i < 8; i++) riverLen += river[i].distanceTo(river[i - 1]);
    const hero = await buildHero(ctx, {
      palette: pal, sunDir: [sunDir.x, sunDir.y, sunDir.z], riverPoints: river, slope: Math.atan(0.2),
      flyers: Math.round(clamp(17000 * density, 13000, 19500) * (REV ? 0.75 : 1)), fill: 0.55, afterLight: 0.6, shaftGain: 0.13, burst: 0.7,
    });
    const heroGroup = new THREE.Group(); heroGroup.position.set(0, y0, 0); heroGroup.add(hero.object); scene.add(heroGroup);
    const HH = hero.height; hero.uniforms.uSize.value = 0.125; hero.uniforms.uRime.value = H.rime;
    await ctx.yield();

    // uniforms shared by everything on the event clock
    const U = {
      uClock: { value: -10 }, uTime: { value: 0 }, uGate: { value: 0 }, uRime: { value: H.rime },
      uOrange: { value: C(pal[6]) }, uWing: { value: C(pal[4]) }, uAmb: { value: C(pal[0]).multiplyScalar(0.62) },
      uSunCol: { value: C(pal[5]).multiplyScalar(2.2) }, uRiver: { value: river }, uRiverLen: { value: riverLen }, uSize: { value: 0.095 }, uSunDir: { value: sunDir.clone() },
    };
    const uPx = { value: 400 }, uTau = { value: 0 }, bufSize = new THREE.Vector2();

    // ---------------------------------------------------------------- firs
    // Every fir near the path is of the Great Bough's own make (liteFirGeometry, instanced, the hero's material):
    // sagging fronds under a coat of closed wings that flips and peels on the shared clock. Kit conifers only far off.
    const LH = 33, LIMB = 7.4, T_TOP = (hero.yTop - LH) / 7.5, fr = rng.fork('firs'), detail = ctx.quality?.detail ?? 1;
    const liteGeos = [];
    for (let i = 0; i < 6; i++) {
      liteGeos.push(await liteFirGeometryAsync(ctx, { rng: fr, lod: 1 + (i >> 1), height: LH * (i % 2 ? 0.95 : 1), limbMax: LIMB * (i % 2 ? 0.92 : 1), palette: hero.palette }));
      await ctx.yield();
    }
    await ctx.yield();
    const liteMat = hero.makeMaterial();
    await ctx.yield();
    const wind = flora.makeWind({ direction: [0.9, 0.3], strength: weather === 'still' ? 0.45 : 1 });
    await ctx.yield();
    const fmatOpts = { wind, backlight: 0.4, backlightTint: '#cfd6c0', ambient: 1.6, leafAmbient: 1.5, emissive: '#222c28', emissiveIntensity: 1.2 };
    await flora.prepareLeafTexture(fmatOpts, ctx.yield);      // the leaf atlas drawn in short steps
    await ctx.yield();
    const fmat = flora.windMaterial(fmatOpts);
    await ctx.yield();
    const snowAmt = H.rime ? 0.5 : weather === 'snow' ? 0.22 : 0;
    const firPal = { leaf: '#33483e', leafLight: '#6a8072', leafDark: '#22332b', bark: pal[3], barkDark: '#2b2520', snow: snowAmt, snowColor: '#d2d9e0' };
    const drPal = { leaf: '#665c50', leafLight: pal[4], leafDark: '#40382f', bark: pal[3], barkDark: '#2b2520', snow: snowAmt, snowColor: '#d2d9e0' };
    const gFarA = flora.coniferGeometry({ rng: fr, height: LH, detail: 0, droop: 1.1, ...firPal });
    await ctx.yield();
    const gFarB = flora.coniferGeometry({ rng: fr, height: LH, detail: 0, droop: 1.3, ...drPal });
    await ctx.yield();

    // the draped trees: hosts of the opening boughs, dormant ones framing the approach, gully firs that feed the river
    const drapes = [], dr = rng.fork('drapes');
    const tooClose = (x, z, gap) => drapes.some((d) => Math.hypot(d.x - x, d.z - z) < gap) || Math.hypot(x, z) < 27;
    const addDrape = (x, z, kind, v) => {
      const pn = path.nearestXZ(x, z);
      const d = { x, z, y: hAt(x, z) - 0.3, s: dr.range(0.88, 1.04), v, rot: dr.range(0, TAU), d: pn.dist, u: pn.u, kind, tIgn: 1e5, s0: -1 };
      drapes.push(d); return d;
    };
    const boughSpecs = [];
    for (let k = 0; k < 4; k++) {
      const dist = (k ? 22 + k * 13 + dr.range(-1.5, 1.5) : 28), side = k % 2 ? -1 : 1, pp = path.posAtDist(dist), tn = path.tangentAtDist(dist), off = 1.9;
      const rx = -tn.z, rz = tn.x, lat = k ? 10.8 : 11.4, hx = pp.x + rx * side * lat, hz = pp.z + rz * side * lat;
      const host = addDrape(hx, hz, 'host', k % 2); host.s = 1.04;
      if (k) { boughSpecs.push({ from: new THREE.Vector3(hx, pp.y + 2.4, hz), tip: new THREE.Vector3(pp.x + rx * side * off + tn.x * 2, pp.y - 0.9, pp.z + rz * side * off + tn.z * 2) }); continue; }
      // the bough of the opening: it leaves its fir, swings in under the flight line and runs along it for 16 m,
      // half a metre below the lens and a hand's breadth to its right, so the journey begins centimetres from shut wings
      const pts = [new THREE.Vector3(hx, pp.y + 2.2, hz)];
      for (const [d, l, dy] of [[24.8, 5.6, 1.3], [22, 2.3, 0.3], [19.6, 0.8, -0.3], [17.4, 0.4, -0.42], [15, 0.31, -0.43], [12.5, 0.29, -0.43], [10, 0.29, -0.43], [7.5, 0.3, -0.45], [5.2, 0.34, -0.52], [3.2, 0.42, -0.68]]) {
        const q = path.posAtDist(d), t2 = path.tangentAtDist(d);
        pts.push(new THREE.Vector3(q.x - t2.z * side * l, q.y + dy, q.z + t2.x * side * l));
      }
      boughSpecs.push({ pts });
    }
    await ctx.yield();
    for (let i = 0; i < 14; i++) {
      if ((i & 3) === 3) await ctx.yield();
      const z = 30 + i * 9.6 + dr.range(-2.5, 2.5);
      for (const side of (i % 2 ? [1, -1] : [-1, 1])) {
        const x = gx(z) + side * dr.range(19.5, 25);
        if (path.nearestXZ(x, z).dist < 19 || tooClose(x, z, 9.5)) continue;
        addDrape(x, z, 'gully', i % 2); break;
      }
    }
    const flank = (pd, side, lat, v) => {
      const pp = path.posAtDist(pd), tn = path.tangentAtDist(pd), x = pp.x - tn.z * side * lat, z = pp.z + tn.x * side * lat;
      if (path.nearestXZ(x, z).dist < Math.min(lat, 12) - 0.6 || tooClose(x, z, lat < 13 ? 8 : 9.5) || sightDist(x, z) < (lat < 13 ? 7.2 : 8)) return false;
      addDrape(x, z, 'upper', v); return true;
    };
    // dark frames close beside the descent between the trunks, two of them inside 9 m
    await ctx.yield();
    flank(94, 1, 8.7, 1); flank(120, -1, 8.6, 0); flank(66, 1, 12.4, 0); flank(72, -1, 11.2, 1); flank(101, -1, 12.8, 1);
    await ctx.yield();
    flank(137, 1, 10.4, 0); flank(144, -1, 12.6, 1); flank(160, -1, 11, 0); flank(166, 1, 12.2, 1);
    await ctx.yield();
    flank(84, -1, 11.6, 0); flank(108, 1, 11.8, 1); flank(128, -1, 12, 1); flank(150, 1, 12.5, 0);     // close frames on the approach
    for (let i = 0, tries = 0; i < 11 && tries < 300; tries++) { if ((tries & 3) === 3) await ctx.yield(); if (flank(dr.range(20, 200), dr.sign(), dr.range(13, 27), i % 2)) i++; }
    if (rare) for (let i = 0, tries = 0; i < 7 && tries < 100; tries++) {   // the rare event wants thirty
      const z = dr.range(165, 262), x = dr.sign() * dr.range(45, 54);
      if (tooClose(x, z, 9.5)) continue;
      addDrape(x, z, 'meadow', i % 2); i++;
    }
    await ctx.yield();
    // ignition times on the shared clock, and where each tree's wings join the river
    const tmp = new THREE.Vector3();
    for (const d of drapes) {
      const cAbreast = camClock(d.x, d.z);
      if (rare) d.tIgn = REV ? 4.5 + dr.range(0, 3) : dr.range(0.2, 3);
      else if (d.kind === 'gully') d.tIgn = REV ? cAbreast + dr.range(-1.5, 5) : Math.max(cAbreast - dr.range(3, 7), 1 + dr());
      if (d.kind === 'gully' || d.kind === 'meadow') {
        let best = 1e9;
        for (let s = 0; s < riverLen; s += 2) { riverPointJS(river, riverLen, s, tmp); const q = Math.hypot(tmp.x - d.x, tmp.z - d.z); if (q < best) { best = q; d.s0 = s; } }
      }
    }
    const chunkOf = (z) => (z < -122 ? 4 : z < -45 ? 0 : z < 70 ? 1 : z < 150 ? 2 : 3);      // 4: the firs round the entry, behind the lens for good once we are down among the trunks
    const trees = drapes.map((d) => ({ x: d.x, y: d.y, z: d.z, s: d.s, rot: d.rot, t0: d.tIgn < 1e4 ? d.tIgn - T_TOP : 1e5, coat: 1, geo: (d.kind === 'meadow' || (d.kind === 'upper' && d.d > 17) ? 2 : 0) + d.v % 2, chunk: chunkOf(d.z) }));
    await ctx.yield();

    // the forest: firs of the same make near the path (most of them draped and dormant), kit conifers beyond
    const clearOf = (x, z) => {
      const ad = Math.abs(x - gx(z));
      if (Math.hypot(x, z) < 25 || (z > 2 && ad < 12) || sightDist(x, z) < 7.5) return 0;
      if (z > 150 && ad < 42 + 7 * noise.n2(x * 0.05, z * 0.05)) return 0;                  // the meadow
      for (const d of drapes) if (Math.hypot(d.x - x, d.z - z) < 9.5) return 0;
      return 1;
    };
    const band = (label, count, radius, corridor, spacing, falloff) => flora.scatterPoints({
      rng: rng.fork(label), path, heightAt: hAt, count: Math.round(count * Math.min(density, 1.05)), radius, corridor, spacing, scale: [0.8, 1.12], falloff, density: (x, z) => clearOf(x, z),
    });
    await ctx.yield();
    const farPts = [];
    band('forest', 105, 64, 11, 7, 0).forEach((p, i) => (Math.hypot(p.x - p0.x, p.z - p0.z) < 31 && p.z > p0.z - 6) || trees.push({ x: p.x, y: p.y - 0.3, z: p.z, s: p.s, rot: p.rot, t0: 1e5, coat: noise.n2(p.x * 0.03 + 5, p.z * 0.03) > -0.3 ? 1 : 0.3, geo: (p.d < 31 ? 2 : 4) + (i % 2), chunk: chunkOf(p.z) }));
    await ctx.yield();
    band('forest2', 150, 180, 64, 6.2, 0.35).forEach((p, i) => {
      if (p.d < 92 && detail > 0.9) trees.push({ x: p.x, y: p.y - 0.3, z: p.z, s: p.s, rot: p.rot, t0: 1e5, coat: noise.n2(p.x * 0.03 + 5, p.z * 0.03) > -0.3 ? 1 : 0.3, geo: 4 + (i % 2), chunk: chunkOf(p.z) });
      else farPts.push(p);
    });
    await ctx.yield();
    flora.scatterPoints({
      rng: rng.fork('behind'), bounds: [-120, ZP + 4, 120, ZP + 76], count: Math.round(26 * density), heightAt: hAt, spacing: 7, scale: [0.8, 1.12],
      density: (x, z) => (Math.abs(x - gx(z)) > 44 + 9 * noise.n2(x * 0.04, z * 0.04) ? 1 : 0),
    }).forEach((p, i) => trees.push({ x: p.x, y: p.y - 0.3, z: p.z, s: p.s, rot: p.rot, t0: 1e5, coat: i % 3 ? 1 : 0.3, geo: 4 + (i % 2), chunk: 3 }));
    await ctx.yield();
    const liteGroup = new THREE.Group(); liteGroup.name = 'draped-firs'; scene.add(liteGroup);
    // The five draped firs nearest the approach carry real wings on the upper side of their boughs, on the side the
    // camera passes: sleepers standing shut and, among them, baskers lying half open and orange. Points are taken on
    // the fir's own frond triangles and carried through its instance matrix, so they sit on the boughs.
    const boughWings = [], bw = xr.fork('boughwings'), _bp = new THREE.Vector3(), _bn = new THREE.Vector3(), _nm = new THREE.Matrix3();
    {
      const nearest = drapes.map((d, i) => ({ d, i })).filter((o) => o.d.kind !== 'gully' && o.d.z > -182 && o.d.z < -50).sort((a, b) => a.d.d - b.d.d).slice(0, 5);
      for (const o of nearest) { const pn = path.pointAt(o.d.u); trees[o.i].wing = [pn.x - o.d.x, pn.z - o.d.z]; }
    }
    const dressFir = (src, mat, t) => {
      const pos = src.attributes.position.array, nor = src.attributes.normal.array, inf = src.attributes.aInfo.array, uv = src.attributes.uv.array, idx = src.index.array, nT = idx.length / 3;
      _nm.getNormalMatrix(mat);
      const want = Math.round(240 * density);
      for (let got = 0, tries = 0; got < want && tries < want * 60; tries++) {
        const k = bw.int(0, nT - 1) * 3, a = idx[k], b = idx[k + 1], c = idx[k + 2];
        if (inf[a * 4] !== 1) continue;
        let r1 = bw(), r2 = bw(); if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
        const r0 = 1 - r1 - r2, mixA = (arr, n, o) => arr[a * n + o] * r0 + arr[b * n + o] * r1 + arr[c * n + o] * r2;
        if (Math.abs(mixA(uv, 2, 1)) > 0.42 || mixA(uv, 2, 0) < 0.3) continue;      // on the solid heart of the pad, out along the limb
        _bp.set(mixA(pos, 3, 0), mixA(pos, 3, 1), mixA(pos, 3, 2));
        if (_bp.y < 3.5 || _bp.y > 22) continue;
        _bn.set(mixA(nor, 3, 0), mixA(nor, 3, 1), mixA(nor, 3, 2)); if (_bn.y < 0) _bn.negate();
        _bp.applyMatrix4(mat); _bn.applyMatrix3(_nm).normalize();
        if ((_bp.x - t.x) * t.wing[0] + (_bp.z - t.z) * t.wing[1] < 0) continue;
        const hd = bw.range(0, TAU);
        boughWings.push({ p: [_bp.x + _bn.x * 0.05, _bp.y + _bn.y * 0.05, _bp.z + _bn.z * 0.05], up: [_bn.x, _bn.y, _bn.z], fw: [Math.cos(hd), 0, Math.sin(hd)], size: bw.range(0.17, 0.24), phase: 0, mode: bw() < 0.45 ? 2 : 0, rnd: bw() });
        got++;
      }
    };
    {
      const dummy = new THREE.Object3D(), buckets = new Map(), ir = rng.fork('inst');
      for (const t of trees) { const k = t.geo * 8 + t.chunk; if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(t); }
      for (const [k, list] of buckets) {
        const src = liteGeos[Math.floor(k / 8)], g = new THREE.BufferGeometry();
        for (const name in src.attributes) g.setAttribute(name, src.attributes[name]);
        g.setIndex(src.index); g.boundingSphere = src.boundingSphere.clone();
        const inst = new Float32Array(list.length * 3), im = new THREE.InstancedMesh(g, liteMat, list.length);
        list.forEach((t, i) => {
          dummy.position.set(t.x, t.y, t.z); dummy.rotation.set(ir.range(-0.02, 0.02), t.rot, ir.range(-0.02, 0.02)); dummy.scale.setScalar(t.s); dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix); inst.set([t.t0, t.coat, ir()], i * 3);
          if (t.wing) dressFir(src, dummy.matrix, t);
        });
        g.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3));
        im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.userData.chunk = k % 8; liteGroup.add(im);
      }
    }
    await ctx.yield();
    const forest = flora.makeScatter({
      rng: rng.fork('far'), points: farPts, path, heightAt: hAt, material: fmat, variants: [gFarA, gFarB], stretch: 0, tilt: 0.02, tint: 0.12, hue: 0.02, chunks: 3, cullDistance: 300,
    });
    scene.add(forest.object);
    await ctx.yield();
    const beyond = flora.makeScatter({
      rng: rng.fork('beyond'), bounds: [-170, ZP + 76, 170, 420], count: Math.round(50 * density), heightAt: hAt, material: fmat, variants: [gFarA, gFarB],
      spacing: 6, scale: [0.86, 1.2], tint: 0.12, hue: 0.02, tilt: 0.02, density: (x, z) => (Math.abs(x - gx(z)) > 44 + 9 * noise.n2(x * 0.04, z * 0.04) - smoothstep(300, 400, z) * 30 ? 1 : 0),
    });
    scene.add(beyond.object);
    await ctx.yield();

    // released wings from the gully firs: real flyers near, sprites for the far river and the burst round the Great Bough
    // the three standing shafts of the approach: ground x, z, and the band of heights their wings keep to
    const APPROACH = [[-34, -132, 6, 23], [-29, -80, 2, 13], [-30, -40, 2, 12]];
    const flyList = [], spriteList = [], cr = rng.fork('cards');
    {
      // a promise in the grey: a few hundred wings already adrift between the trunks of the approach (never released, never in the river)
      const er = xr.fork('early'), L0 = 26, L1 = uI * path.length + 22, nE = Math.round(1400 * density);
      for (let i = 0; i < nE; i++) {
        if (i < nE * 0.7) {
          // most of them turn slowly inside the three sun shafts that already stand in the mist of the approach
          const sh = APPROACH[i % 3], h = er.range(sh[2], sh[3]), k = h / Math.max(sunDir.y, 0.3), x = sh[0] + sunDir.x * k + er.range(-3, 3), z = sh[1] + sunDir.z * k + er.range(-3, 3);
          flyList.push({ p: [x, hAt(sh[0], sh[1]) + h - 2 - y0, z], t: -900 - er() * 200, s: -2, seed: [er(), er(), er(), er()] });
        } else {
          const pd = lerp(L0, L1, Math.pow(er(), 0.8)), pp = path.posAtDist(pd), tn = path.tangentAtDist(pd), lat = er.sign() * er.range(2, 9);
          flyList.push({ p: [pp.x - tn.z * lat, pp.y - y0 + er.range(-5, 1.5), pp.z + tn.x * lat], t: -900 - er() * 200, s: -1, seed: [er(), er(), er(), er()] });
        }
      }
    }
    const nEarly = flyList.length;
    const crownR = (yl) => lerp(LIMB * 0.8, 0.7, clamp((yl - 5.5) / (LH - 5.5), 0, 1));
    const igniting = drapes.filter((d) => d.tIgn < 1e4);
    const perTree = igniting.length ? Math.round(10500 * Math.min(density, 1.1) * (REV ? 0.72 : 1) / igniting.length) : 0, perTreeS = igniting.length ? Math.round(15000 * density * detail / igniting.length) : 0;
    for (const d of igniting) { await ctx.yield(); for (let i = 0; i < perTree + perTreeS; i++) {
      if ((i & 255) === 255) await ctx.yield();
      const yl = lerp(6, LH * 0.92, Math.pow(cr(), 0.8)), a = cr.range(0, TAU), r = crownR(yl) * cr.range(0.45, 1) * d.s;
      const f = { p: [d.x + Math.cos(a) * r, d.y - y0 + yl * d.s, d.z + Math.sin(a) * r], t: d.tIgn + (LH - yl) / 7.5 + 0.5 + cr() * 0.9, s: d.s0, seed: [cr(), cr(), cr(), cr()] };
      (i < perTree ? flyList : spriteList).push(f);
    } }
    await ctx.yield();
    for (let i = 0, n = Math.round(19000 * density * detail); i < n; i++) {
      if ((i & 255) === 0) await ctx.yield();
      const yl = lerp(8, HH * 0.95, Math.pow(cr(), 0.8)), a = cr.range(0, TAU), r = lerp(10, 1, clamp((yl - 8) / (HH - 8), 0, 1)) * cr.range(0.4, 1);
      spriteList.push({ p: [Math.cos(a) * r, yl, Math.sin(a) * r], t: (hero.yTop - yl) / 7.5 + 0.6 + cr() * 1.2 + Math.pow(cr(), 3) * 9, s: cr() * 70, seed: [cr(), cr(), cr(), cr()] });
    }
    await ctx.yield();
    const cascade = await makeFlyers(flyList, U, ctx.yield);
    await ctx.yield();
    const sprites = await makeSprites(spriteList, U, uPx, ctx.yield);
    heroGroup.add(cascade, sprites);
    await ctx.yield();

    // ---------------------------------------------------------------- perched wings: opening boughs, portal rim, stream drinkers
    const wings = [], wr = rng.fork('wings'), limbB = { P: [], N: [], C: [], I: [] }, barkC = C('#85786a');
    for (const b of boughSpecs) { addWingBough(limbB, wings, wr, b, barkC, 0.13, b.pts ? 0.3 : 0.42); await ctx.yield(); }
    await ctx.yield();
    // on the bough of the opening a few lie open, basking: orange under the lens from the first frame
    for (const w of wings) if (w.up[1] > 0 ? w.rnd < 0.17 : w.rnd < 0.035) w.mode = 2;
    await ctx.yield();
    // each of the four boughs of the opening carries its wings as a mesh of its own with its own bounds, so that the engine
    // leaves a bough that is not in sight undrawn (the four are a tenth of all the triangles here); the list then starts
    // again with the wings of the nearest firs
    const boughPerched = [];
    for (const b of boughSpecs) {
      const m = await makePerched(wings.slice(b.w0, b.w1), U, ctx.yield), bx = new THREE.Box3();
      for (let i = b.w0; i < b.w1; i++) bx.expandByPoint(_bp.fromArray(wings[i].p));
      m.geometry.boundingSphere = bx.getBoundingSphere(new THREE.Sphere()); m.geometry.boundingSphere.radius += 1.5;
      m.frustumCulled = true; boughPerched.push(m); scene.add(m);
    }
    wings.length = 0;
    for (const w of boughWings) wings.push(w);      // the wings lying on the boughs of the nearest firs (placed with the firs)
    const nBoughWings = wings.length, rimWings = [];
    const pe = path.end.clone(), RT = 7.8, TUBE = 0.42;
    const nRim = Math.round(2400 * density);
    for (let i = 0; i < nRim; i++) {
      if ((i & 255) === 255) await ctx.yield();
      const a = wr.range(0, TAU), b = wr.range(-0.25, 1.25) * Math.PI, rr = RT + (TUBE + 0.02) * Math.cos(b), hd = wr.range(0, TAU);
      const p = [pe.x + Math.cos(a) * rr, pe.y + Math.sin(a) * rr, pe.z - (TUBE + 0.02) * Math.sin(b)];
      if (p[1] < hAt(p[0], p[2]) + 0.15) continue;
      rimWings.push({ p, up: [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), -Math.sin(b)], fw: [Math.cos(hd), Math.sin(hd), 0.3], size: wr.range(0.17, 0.24), phase: a * 3, mode: 1, rnd: wr() });
    }
    await ctx.yield();
    for (let c = 0; c < 34; c++) {
      const z = wr.range(28, 175), side = wr.sign(), cx = gx(z) + side * (wr.range(1.5, 2.2) + 0.85);
      for (let k = 0; k < 13; k++) {
        const x = cx + wr.gauss() * 0.3, zz = z + wr.gauss() * 0.45, hd = wr.range(0, TAU);
        rimWings.push({ p: [x, hAt(x, zz) + 0.05, zz], up: [wr.range(-0.15, 0.15), 1, wr.range(-0.15, 0.15)], fw: [Math.cos(hd), 0, Math.sin(hd)], size: wr.range(0.08, 0.1), phase: wr.range(0, 50), mode: 1, rnd: wr() });
      }
    }
    await ctx.yield();
    {
      // puddle clubs: three places on the wet margin, right under the flight line, where hundreds drink wing to wing
      const pr = xr.fork('puddle');
      for (const [zc, side] of [[76, 1], [103, -1], [133, 1]]) {
        const z0 = zc + pr.range(-3, 3);
        for (let k = 0; k < 160; k++) {
          const zz = z0 + pr.gauss() * 1.5, x = gx(zz) + side * (2.75 + Math.abs(pr.gauss()) * 0.5), hd = pr.range(0, TAU);
          rimWings.push({ p: [x, hAt(x, zz) + 0.06, zz], up: [pr.range(-0.12, 0.12), 1, pr.range(-0.12, 0.12)], fw: [Math.cos(hd), 0, Math.sin(hd)], size: pr.range(0.13, 0.18), phase: zz * 2.2 + pr.range(0, 1.5), mode: 1, rnd: pr() });
        }
      }
    }
    await ctx.yield();
    const perched = await makePerched(wings, U, ctx.yield);
    await ctx.yield();
    const perchedFar = await makePerched(rimWings, U, ctx.yield); scene.add(perched, perchedFar);      // boughs of the opening; rim + drinkers
    const barkMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const limbs = tubeMesh(limbB, barkMat); scene.add(limbs);
    await ctx.yield();
    { const nr = ctx.core.makeRng(ctx.core.hashSeed('bough-needles:' + ctx.seed)); for (const b of boughSpecs) { scene.add(makeBoughNeedles([b], nr, U)); await ctx.yield(); } }      // a mesh to each bough, with its own bounds
    await ctx.yield();
    // the ring the rim butterflies sit on: a hoop of woven boughs
    const ringGeo = new THREE.TorusGeometry(RT, TUBE, 7, 64);
    { const rp = ringGeo.getAttribute('position'), cc = new Float32Array(rp.count * 3);
      for (let i = 0; i < rp.count; i++) { const k = 0.7 + 0.5 * noise.n2(i * 0.37, 1.5); cc[i * 3] = barkC.r * k; cc[i * 3 + 1] = barkC.g * k; cc[i * 3 + 2] = barkC.b * k; }
      ringGeo.setAttribute('color', new THREE.BufferAttribute(cc, 3)); }
    const ring = new THREE.Mesh(ringGeo, barkMat); ring.position.copy(pe); scene.add(ring);
    await ctx.yield();

    // ---------------------------------------------------------------- ground cover
    const ridges = T.makeHorizonRidges({
      rng: rng.fork('ridges'), layers: 2, radius: [900, 2100], height: [150, 340], base: -240, segments: 200, jagged: 0.45, coverage: 0.85,
      colorNear: '#74859a', fog: scene.fog, fogScale: 0.06, sunDir, sunColor: pal[5], sunIntensity: 0.5, rim: 0.2, hazeNear: 0.42, hazeFar: 0.72, footHaze: 0.9,
    });
    scene.add(ridges.object);
    await ctx.yield();
    const tmpCol = new THREE.Color(), gcol = (x, z) => groundCol(x, z, tmpCol);
    const pale = ['#e9e6dc', '#d9d4be', '#c8c2d2', '#dcdcd8'];
    const fernGeo = (size) => flora.fernGeometry({ rng: fr, size, detail: 0, leaf: '#868a78', leafLight: '#a8ac98', leafDark: '#5a5f54' });
    await ctx.yield();
    const ferns = flora.makeFerns({
      rng: rng.fork('ferns'), path, uRange: [0.12, 0.86], heightAt: hAt, wind, map: fmat.map, count: Math.round(560 * density * detail), radius: 22, chunks: 4, scale: [0.55, 1.25],
      variants: [fernGeo(0.8), fernGeo(1.3), fernGeo(1.0)], density: (x, z) => (z < 150 ? 1 : 0.15) * (Math.abs(x - gx(z)) > 2.7 || z < 8 ? 1 : 0), tint: 0.1, hue: 0,
      materialOptions: { fade: [55, 80], detail: 0, ambient: 1.5, leafAmbient: 1.5, backlight: 0.3, backlightTint: '#d6d8c8' },
    });
    await ctx.yield();
    const grass = await flora.makeGrassAsync({
      rng: rng.fork('grass'), bounds: [-46, 146, 46, 300], count: Math.round(9000 * density), heightAt: hAt, wind, map: fmat.map, groundColor: gcol,
      height: [0.45, 0.95], flowers: 0.06, flowerColors: pale, fade: [85, 115], density: (x, z) => smoothstep(146, 160, z) * (1 - smoothstep(40, 46, Math.abs(x))) * (Math.abs(x - gx(z)) > 3.0 ? 1 : 0),
    }, ctx.yield);
    // a second, taller class in drifts, and clumps of pale milkweed and groundsel standing above it: relief for the foreground
    const grassTall = await flora.makeGrassAsync({
      rng: rng.fork('grass2'), bounds: [-46, 150, 46, 290], count: Math.round(3200 * density * detail), heightAt: hAt, wind, map: fmat.map, groundColor: gcol,
      height: [0.95, 1.6], width: [0.8, 1.3], flowers: 0, fade: [70, 100],
      density: (x, z) => smoothstep(150, 164, z) * (1 - smoothstep(38, 46, Math.abs(x))) * (Math.abs(x - gx(z)) > 3.2 ? 1 : 0) * smoothstep(-0.05, 0.3, noise.fbm2(x * 0.07 + 40, z * 0.07, 2)),
    }, ctx.yield);
    const milkweed = flora.makeFlowers({
      rng: rng.fork('milkweed'), bounds: [-40, 152, 40, ZP + 40], count: Math.round(190 * density), heightAt: hAt, wind, map: fmat.map, colors: pale, groundColor: gcol, chunks: 2,
      scale: [1.7, 2.8], density: (x, z) => (Math.abs(x - gx(z)) > 3 ? 1 : 0),
    });
    await ctx.yield();
    await ctx.yield();
    const flowers = flora.makeFlowers({
      rng: rng.fork('flowers'), path, uRange: [0.5, 0.88], radius: 13, corridor: 0, count: Math.round(260 * density), heightAt: hAt, wind, map: fmat.map,
      colors: pale, groundColor: gcol, chunks: 2, density: (x, z) => (Math.abs(x - gx(z)) > 2.9 ? 1 : 0),
    });
    const floorGrass = await flora.makeGrassAsync({      // dry tufts on the needle floor, taking the ground's colour
      rng: rng.fork('floor'), path, uRange: [0.08, 0.8], radius: 17, bias: 1.5, count: Math.round(5600 * Math.min(density, 1.1) * detail), heightAt: hAt, wind, map: fmat.map, groundColor: gcol,
      height: [0.3, 0.75], width: [0.7, 1.3], rootGain: 1.5, flowers: 0, fade: [42, 60], chunks: 4, density: (x, z) => (z > 6 && Math.abs(x - gx(z)) < 2.7 ? 0 : 0.35 + 0.65 * smoothstep(-0.1, 0.3, noise.fbm2(x * 0.11, z * 0.11, 2))),
    }, ctx.yield);
    const bankGrass = await flora.makeGrassAsync({      // tufts leaning over the water's edge
      rng: rng.fork('bank'), path, uRange: [uTurn + 0.02, 0.9], radius: 4.8, bias: 1, count: Math.round(2600 * detail), heightAt: hAt, wind, map: fmat.map, groundColor: gcol,
      height: [0.4, 0.85], width: [0.8, 1.4], rootGain: 1.4, flowers: 0, fade: [45, 62], chunks: 3, density: (x, z) => { const ad = Math.abs(x - gx(z)); return ad > 2.05 && ad < 3.8 ? 1 : 0; },
    }, ctx.yield);
    await ctx.yield();
    // the floor under the Great Bough, between the hold and the trunk: twice the ferns and tufts, so the tree stands in a foreground
    const ferns2 = flora.makeFerns({
      rng: xr.fork('ferns2'), path, uRange: [uI - 0.06, uTurn + 0.02], heightAt: hAt, wind, map: fmat.map, count: Math.round(250 * density * detail), radius: 26, chunks: 2, scale: [0.7, 1.5],
      variants: [fernGeo(1.0), fernGeo(1.4)], density: (x, z) => (Math.abs(x - gx(z)) > 2.7 || z < 8 ? 1 : 0) * (Math.hypot(x, z) > 2.5 ? 1 : 0), tint: 0.1, hue: 0,
      materialOptions: { fade: [55, 80], detail: 0, ambient: 1.5, leafAmbient: 1.5, backlight: 0.3, backlightTint: '#d6d8c8' },
    });
    await ctx.yield();
    const floorGrass2 = await flora.makeGrassAsync({
      rng: xr.fork('floor2'), path, uRange: [uI - 0.06, uTurn + 0.02], radius: 24, bias: 1.2, count: Math.round(2200 * Math.min(density, 1.1) * detail), heightAt: hAt, wind, map: fmat.map, groundColor: gcol,
      height: [0.35, 0.9], width: [0.7, 1.3], rootGain: 1.5, flowers: 0, fade: [44, 62], chunks: 2, density: (x, z) => (z > 6 && Math.abs(x - gx(z)) < 2.7 ? 0 : 0.4 + 0.6 * smoothstep(-0.2, 0.25, noise.fbm2(x * 0.09 + 7, z * 0.09, 2))),
    }, ctx.yield);
    scene.add(ferns.object, grass.object, flowers.object, floorGrass.object, grassTall.object, milkweed.object, bankGrass.object, ferns2.object, floorGrass2.object);
    await ctx.yield();

    // ---------------------------------------------------------------- stream, its stones, forest litter, river shadow, footpath rail
    await ctx.yield();
    const sLift = (z) => 0.28 + 0.24 * (1 - smoothstep(140, 178, z));      // the water stands higher in the gully: 4 m of it between wet banks
    const sPts = []; for (let z = 9; z <= 420; z += 11) sPts.push([gx(z), hAt(gx(z), z) + sLift(z), z]);
    const stream = W.makeRiver({
      rng: rng.fork('stream'), points: sPts, width: (t) => 4.7 + 1.1 * Math.sin(t * 61) + 0.7 * Math.sin(t * 157 + 1), speed: 1.9, light: W.waterLight(sky, { zenith: '#38423f', mid: '#4a5551', horizon: '#66716c' }), deep: '#252d2a', shallow: '#4c5852', foamColor: '#aab2b2',
      wetColor: '#2e2c28', opacity: 0.62, foam: 0.14, bankFoam: 0.45, bankFade: 1.5,
    });
    scene.add(stream.object);
    await ctx.yield();
    const glints = makeStreamGlints(gx, (x, z) => hAt(x, z) + sLift(z) - 0.27, 12, ZP + 20, U); scene.add(glints);
    {
      // wet boulders and pebble banks along the water; stones, moss mounds and fallen twigs on the needle floor near the path
      const sr = rng.fork('stones'), items = [], cWetS = C('#8a8c84'), cDry = C('#7c776d'), cMoss = C('#64705c'), cTwig = C(pal[3]).multiplyScalar(1.2);
      const put = (x, z, sx, sy, sz, col, k, sink) => items.push({ x, y: hAt(x, z) + sy * sink, z, sx, sy, sz, c: col.clone().multiplyScalar(k), ry: sr.range(0, TAU), rx: sr.range(-0.3, 0.3) });
      for (let z = 12; z < 204; z += sr.range(3.8, 6)) for (const side of [-1, 1]) {
        const x = gx(z) + side * sr.range(1.25, 2.3), r = sr.range(0.3, 0.85);
        put(x, z, r * sr.range(0.9, 1.4), r * sr.range(0.5, 0.8), r, cWetS, sr.range(0.7, 1.15), 0.25);
        for (let k = 0; k < 3; k++) { const q = sr.range(0.08, 0.22); put(x + sr.gauss() * 0.7, z + sr.gauss() * 1.1, q * 1.3, q * 0.6, q, sr.chance(0.5) ? cWetS : cDry, sr.range(0.8, 1.3), 0.3); }
      }
      await ctx.yield();
      const L0 = path.length * 0.1, L1 = path.length * 0.84;
      for (let i = 0; i < 620; i++) {
        const pd = sr.range(L0, L1), pp = path.posAtDist(pd), tn = path.tangentAtDist(pd), lat = sr.sign() * sr.range(1.5, 20), x = pp.x - tn.z * lat, z = pp.z + tn.x * lat, kind = sr();
        if (z > 6 && Math.abs(x - gx(z)) < 2.6) continue;
        if (kind < 0.4) { const r = sr.range(0.1, 0.42); put(x, z, r * sr.range(0.9, 1.5), r * 0.6, r, cDry, sr.range(0.6, 1.0), 0.2); }
        else if (kind < 0.55) { const r = sr.range(0.2, 0.5); put(x, z, r * 1.3, r * 0.45, r, cMoss, sr.range(0.7, 1.0), 0.15); }
        else put(x, z, sr.range(0.5, 1.3), 0.035, 0.035, cTwig, sr.range(0.7, 1.2), 1);
      }
      for (let z = 11; z < 206; z += sr.range(2.1, 3.1)) {      // more stones standing in the water's edge, so the bank is never a straight line
        const side = sr.sign(), x = gx(z) + side * sr.range(0.95, 1.6), r = sr.range(0.22, 0.6);
        put(x, z, r * sr.range(0.9, 1.5), r * sr.range(0.45, 0.75), r * sr.range(0.8, 1.2), sr.chance(0.7) ? cWetS : cMoss, sr.range(0.65, 1.1), 0.2);
      }
      await ctx.yield();
      const sg = new THREE.IcosahedronGeometry(1, 0);
      const stones = new THREE.InstancedMesh(sg, new THREE.MeshLambertMaterial({ flatShading: true }), items.length), dm = new THREE.Object3D();
      items.forEach((it, i) => {
        dm.position.set(it.x, it.y, it.z); dm.rotation.set(it.rx, it.ry, 0); dm.scale.set(it.sx, it.sy, it.sz); dm.updateMatrix();
        stones.setMatrixAt(i, dm.matrix); stones.setColorAt(i, it.c);
      });
      stones.instanceMatrix.needsUpdate = true; stones.instanceColor.needsUpdate = true; stones.frustumCulled = false; stones.name = 'stones-litter'; scene.add(stones);
    }
    await ctx.yield();
    const riverShadow = makeRiverShadow(river, riverLen, (x, z) => hAt(x, z) - y0, U); heroGroup.add(riverShadow);
    await ctx.yield();
    // the stream's face, laid on the stream where it stands, from its head to 80 m beyond the portal: a row every 1.5 m
    const faceRows = [];
    {
      const smp = {}, q = new THREE.Vector3(), nR = Math.round(stream.length / 1.5);
      for (let i = 0; i <= nR; i++) {
        if ((i & 15) === 15) await ctx.yield();
        stream.sampleAt(i / nR, smp);
        const c = smp.position.clone(), tl = Math.hypot(smp.tangent.x, smp.tangent.z) || 1, nx = -smp.tangent.z / tl, nz = smp.tangent.x / tl;
        if (c.z > ZP + 80) break;
        c.y += 0.06;
        const reach = (sd) => { let d = 0.25; while (d < 3.8 && terrain.surfaceAt(c.x + nx * sd * d, c.z + nz * sd * d) < c.y) d += 0.25; return d; };      // where the ground rises out of the water
        let s0 = riverLen, best = 1e9;
        for (let s = 0; s <= riverLen; s += 2) { riverPointJS(river, riverLen, s, q); const dd = Math.hypot(q.x - c.x, q.z - c.z); if (dd < best) { best = dd; s0 = s; } }
        faceRows.push({ c, nx, nz, s: s0, wl: reach(-1), wr: reach(1) });
      }
    }
    const streamFace = makeStreamFace(faceRows, U, riverShadow.material.uniforms, C(H.horizon).multiplyScalar(0.95), C(H.mid).multiplyScalar(0.8)); scene.add(streamFace);
    await ctx.yield();
    // Gravel bars: pale shingle on the stream's banks, one every 5 to 10 m on a seeded side, from the water's edge outward.
    // On each bar monarchs drink wing to wing; when the river of wings reaches the bar some of them lift into it (their
    // release is the moment the river's front, the one its shadow follows, arrives over the bar).
    const gb = ctx.core.makeRng(ctx.core.hashSeed('gravel-bars:' + ctx.seed)), shingle = [], barWings = [], barFlyers = [], cShingle = C('#a8a498'), cWetRock = C('#77786f');
    const BAR_REACH = 40;      // the bars of every 40 m of the stream are drawn together, with bounds of their own: a reach that is not in sight is not drawn
    for (let i = 4; i < faceRows.length - 4; i += Math.round(gb.range(3.5, 6.5))) {
      const r = faceRows[i], side = gb.sign(), w = side < 0 ? r.wl : r.wr, half = gb.range(2.2, 4.2), ch = Math.floor(r.s / BAR_REACH);
      for (let k = 0; k < 46; k++) {      // the bar's stones: thickest at the water's edge, thinning up the bank and toward its two ends
        const al = gb.gauss() * half * 0.5, ac = w - 0.25 + Math.abs(gb.gauss()) * 0.95, q = k < 3 ? gb.range(0.24, 0.5) : gb.range(0.06, 0.2), x = r.c.x + r.nx * side * ac + r.nz * al, z = r.c.z + r.nz * side * ac - r.nx * al;
        shingle.push({ ch, x, z, q, sy: gb.range(0.35, 0.6), ry: gb.range(0, TAU), c: (ac < w + 0.2 ? cWetRock : cShingle).clone().multiplyScalar(gb.range(0.8, 1.18)) });
      }
      const ex = r.c.x + r.nx * side * (w + 0.45), ez = r.c.z + r.nz * side * (w + 0.45), tArr = 3 + r.s / 11;      // the wet edge of the bar; when the river's front is over it
      for (let k = 0; k < 44; k++) {
        const x = ex + gb.gauss() * 0.35 + r.nz * gb.gauss() * 0.9, z = ez + gb.gauss() * 0.35 - r.nx * gb.gauss() * 0.9, hd = gb.range(0, TAU), y = terrain.surfaceAt(x, z);
        barWings.push({ ch, p: [x, y + 0.06, z], up: [gb.range(-0.12, 0.12), 1, gb.range(-0.12, 0.12)], fw: [Math.cos(hd), 0, Math.sin(hd)], size: gb.range(0.12, 0.17), phase: z * 2.2 + gb.range(0, 1.5), mode: 1, rnd: gb() });
        if (k < 26) barFlyers.push({ p: [x, y + 0.1 - y0, z], t: tArr + gb.range(-0.6, 2.2), s: r.s, seed: [gb(), gb(), gb(), gb()] });
      }
    }
    await ctx.yield();
    // a shingle stone: the upper half of an eight-sided stone (its under side lies in the gravel and is never seen)
    const stoneGeo = new THREE.BufferGeometry(); stoneGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, -1, 0, 1, 0, 0, 0, -1, -1, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 1], 3)); stoneGeo.computeVertexNormals();
    const barPerched = [];
    for (let ch = 0; ch <= Math.floor(riverLen / BAR_REACH) + 3; ch++) {
      const st = shingle.filter((it) => it.ch === ch), wg = barWings.filter((it) => it.ch === ch); if (!st.length) continue;
      const gm = new THREE.InstancedMesh(stoneGeo, new THREE.MeshLambertMaterial({ flatShading: true }), st.length), dm = new THREE.Object3D(), bx = new THREE.Box3();
      st.forEach((it, i) => {
        dm.position.set(it.x, terrain.surfaceAt(it.x, it.z) - it.q * it.sy * 0.25, it.z); dm.rotation.set(0, it.ry, 0); dm.scale.set(it.q * 1.4, it.q * it.sy * 1.6, it.q); dm.updateMatrix();
        gm.setMatrixAt(i, dm.matrix); gm.setColorAt(i, it.c);
      });
      gm.instanceMatrix.needsUpdate = true; gm.instanceColor.needsUpdate = true; gm.computeBoundingSphere(); gm.name = 'gravel-bars'; scene.add(gm);
      await ctx.yield();
      const pm = await makePerched(wg, U, ctx.yield); for (const it of wg) bx.expandByPoint(dm.position.fromArray(it.p));
      pm.geometry.boundingSphere = bx.getBoundingSphere(new THREE.Sphere()); pm.geometry.boundingSphere.radius += 1.5; pm.frustumCulled = true;
      pm.name = 'bar-drinkers'; barPerched.push(pm); scene.add(pm);
      await ctx.yield();
    }
    const barLift = await makeFlyers(barFlyers, U, ctx.yield); barLift.name = 'bar-lifters'; heroGroup.add(barLift);
    // the ribbon: it leaves the river RIB_LEAVE m before the river's end (above the meadow), swings out to one side of it
    // (a seeded side) in one long low arc beside and above the river, and comes down through the ring a third of the ring's
    // radius to that side of its middle and a little above it; places in the hero's own coordinates like the river's, one every
    // RIB_STEP m down the gully: [metres out to the side, metres up] from the river, then from the ring's middle
    const rbn = ctx.core.makeRng(ctx.core.hashSeed('wing-ribbon:' + ctx.seed)), ribSide = rbn.sign();
    const RIB_LEAVE = 78, RIB_STEP = 13, ribPts = [], ringC = path.end;
    [[0, 0], [2.5, 2], [5, 4.5], [6.5, 6]].forEach(([out, upR], k) => { const q = riverPointJS(river, riverLen, riverLen - RIB_LEAVE + k * RIB_STEP, new THREE.Vector3()); q.x += ribSide * out; q.y += upR; ribPts.push(q); });
    [[5, 4.5], [RT / 3, RT * 0.28], [1, 1], [0, 0]].forEach(([out, upR], k) => ribPts.push(new THREE.Vector3(ringC.x + ribSide * out, ringC.y - y0 + upR, ringC.z + (k - 1) * RIB_STEP)));
    let ribLen = 0; for (let i = 1; i < 8; i++) ribLen += ribPts[i].distanceTo(ribPts[i - 1]);
    const ribbon = makeRibbon(Math.round(5000 * Math.min(density, 1.1)), rbn, ribPts, ribLen, riverLen - RIB_LEAVE, U, riverShadow.material.uniforms); heroGroup.add(ribbon);
    await ctx.yield();
    await ctx.yield();
    const sunPool = await makeSunPool((x, z) => hAt(x, z) - y0, sunDir, U, ctx.yield); heroGroup.add(sunPool);
    await ctx.yield();
    const railB = { P: [], N: [], C: [], I: [] }, postC = C('#6f675d'), ropeC = C('#9c968a');
    let prevTop = null;
    for (let z = 26; z <= 172; z += 4.2) {
      const x = gx(z) + 9.1 + 1.2 * Math.sin(z * 0.09), y = hAt(x, z), top = new THREE.Vector3(x, y + 1.0, z);
      pushTube(railB, [new THREE.Vector3(x, y - 0.2, z), new THREE.Vector3(x + 0.02, y + 1.08, z)], 0.055, 0.045, 5, postC);
      if (prevTop) { const rope = []; for (let k = 0; k <= 5; k++) { const f = k / 5; rope.push(new THREE.Vector3().lerpVectors(prevTop, top, f).add(new THREE.Vector3(0, -0.5 * f * (1 - f), 0))); } pushTube(railB, rope, 0.03, 0.03, 4, ropeC); }
      prevTop = top;
    }
    scene.add(tubeMesh(railB, barkMat));
    await ctx.yield();
    {
      // fallen firs on the floor under the Great Bough, mossed over: the foreground of the reveal
      const lr = xr.fork('logs'), logB = { P: [], N: [], C: [], I: [] }, cLog = C('#5d5a48'), cLog2 = C('#6d6250');
      for (const [cx, cz, hd0, len] of [[-9, -25, 0.5, 11], [-27.5, -20, 2.2, 8.5], [-2, -38, -0.3, 9.5], [-24, 3, 1.2, 8]]) {
        const hd = hd0 + lr.range(-0.3, 0.3), r0 = lr.range(0.36, 0.5), pts = [], n = Math.round(len / 0.9);
        let ok = true;
        for (let i = 0; i <= n; i++) {
          const f = i / n - 0.5, x = cx + Math.cos(hd) * f * len, z = cz + Math.sin(hd) * f * len, r = lerp(r0, r0 * 0.5, i / n);
          if (path.nearestXZ(x, z).dist < 3.2) ok = false;
          pts.push(new THREE.Vector3(x, hAt(x, z) + r * 0.62, z));
        }
        if (!ok) continue;
        pushTube(logB, pts, r0, r0 * 0.5, 7, lr.chance(0.5) ? cLog : cLog2);
        for (let k = 0; k < 4; k++) {      // snapped limbs still standing off it
          const b = pts[lr.int(1, n - 2)], a = hd + Math.PI / 2 * lr.sign() + lr.range(-0.5, 0.5), L = lr.range(0.6, 1.7);
          pushTube(logB, [b.clone(), new THREE.Vector3(b.x + Math.cos(a) * L * 0.5, b.y + L * 0.75, b.z + Math.sin(a) * L * 0.5), new THREE.Vector3(b.x + Math.cos(a) * L, b.y + L * 1.1, b.z + Math.sin(a) * L)], 0.07, 0.02, 4, cLog2);
        }
      }
      if (logB.P.length) { const logs = tubeMesh(logB, barkMat); logs.name = 'fallen-logs'; scene.add(logs); }
    }
    await ctx.yield();
    const cloudShade = makeCloudShade(hAt, U); scene.add(cloudShade);
    await ctx.yield();
    // the deck above the firs: lighter and darker reaches, and the brighter place where this hour's sun stands behind it
    // (on the sun's line through the Great Bough's crown, the line the shaft of the reveal comes down)
    const DECK_H = 430, deckT = (DECK_H - HH) / Math.max(sunDir.y, 0.3);
    const deck = makeDeck(y0 + DECK_H, new THREE.Vector2(sunDir.x * deckT, sunDir.z * deckT), weather === 'still' ? new THREE.Vector2(0.0012, 0.0003) : new THREE.Vector2(0.006, 0.0015), U,
      C(H.zenith).multiplyScalar(0.78), C(H.horizon).multiplyScalar(1.12), C(H.horizon).lerp(C(pal[5]), 0.6).multiplyScalar(1.5));
    scene.add(deck);
    await ctx.yield();

    // ---------------------------------------------------------------- creatures
    await ctx.yield();
    const fauna = F.makeFauna(scene, { light: { sunDir, sunColor: C(pal[5]), sunIntensity: 1.5, sky: C(H.hemiSky), skyIntensity: 1.5, ground: C(H.hemiGround), groundIntensity: 1.3 } });
    const fr2 = rng.fork('fauna'), dz = 60 + fr2.range(-6, 8), deerAt = new THREE.Vector3(gx(dz) - 4.5, 0, dz); deerAt.y = hAt(deerAt.x, deerAt.z) + 1.1;
    if (castB) fauna.add(F.makeHerd({    // a grey fox instead of the deer
      rng: fr2, preset: { ...F.HERD_PRESETS.deer, h: 0.8, bodyLen: 1.3, neckLen: 0.32, neckAng: 40, headLen: 0.34, ears: 0.2, tail: 0.75, tailType: 'flow', antlers: 0, coat: '#5c5e63', belly: '#c9c9c4', legs: '#48494c', sock: '#2c2c2e', pattern: 'none', varieties: 0 },
      count: 1, heightAt: hAt, path, clear: 0.4, center: [deerAt.x, 0, dz], radius: 1.2, roam: 0.45,
    }));
    else fauna.add(F.makeHerd({
      rng: fr2, species: 'deer', count: 1 + (fr2.chance(0.5) ? 1 : 0), heightAt: hAt, path, clear: 0.4, center: [deerAt.x, 0, dz], radius: 1.2, roam: 0.4,
      coat: '#a08a6e', belly: '#ece6d6', legs: '#8a7862', sock: '#5a4e42', rump: '#f4f0e6', pattern: 'none', pause: 0.34,
    }));
    {
      // a bar of pale gravel under the drinker, so it stands out from the dark bank
      const gr = rng.fork('gravel'), n = 300, gm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), n), dm = new THREE.Object3D(), cg = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const a = gr.range(0, TAU), r = 3.6 * Math.sqrt(gr()), x = deerAt.x + Math.cos(a) * r * 0.8, z = deerAt.z + Math.sin(a) * r * 1.5, q = gr.range(0.07, 0.21);
        dm.position.set(x, hAt(x, z) + q * 0.08, z); dm.rotation.set(0, gr.range(0, TAU), 0); dm.scale.set(q * 1.5, q * 0.4, q * 1.15); dm.updateMatrix();
        gm.setMatrixAt(i, dm.matrix); gm.setColorAt(i, cg.set('#a39f93').multiplyScalar(gr.range(0.78, 1.15)));
      }
      gm.instanceMatrix.needsUpdate = true; gm.instanceColor.needsUpdate = true; gm.name = 'gravel-bar'; scene.add(gm);
    }
    await ctx.yield();
    const birdPal = castB    // grosbeaks / orioles: black and the same orange
      ? { body: '#1a1a1a', head: '#121212', belly: '#e58a2a', wingC: '#1c1c1c', trail: '#ececec', tip: '#f4f4f4', tailC: '#1a1a1a' }
      : { body: '#141414', head: '#101010', belly: pal[6], wingC: '#1a1a1a', trail: '#2a2a2a', tip: '#e8e8e8', tailC: pal[6] };
    const nb = Math.round(clamp(12 * density, 8, 15)), uS1 = 0.69, uS2 = 0.83, coloured = [];    // coloured: hidden until the light comes
    coloured.push(fauna.add(F.makeFlock({ rng: fr2, species: 'swifts', count: Math.ceil(nb / 3), size: 2.7, speed: 15, ...birdPal, cross: { path, u: uS1, lead: 28, angle: 48, side: 1, height: 1.5, span: 170, duration: DURATION } })));
    await ctx.yield();
    coloured.push(fauna.add(F.makeFlock({ rng: fr2, species: 'swifts', count: Math.ceil(nb / 3), size: 2.7, speed: 15, ...birdPal, cross: { path, u: uS2, lead: 26, angle: 55, side: -1, height: 0.5, span: 170, duration: DURATION } })));
    await ctx.yield();
    // (the clear air round the line, 14 Oct: this escort dealt a swift 1.89 m from the flown line. Its wander is steadied first, because the kit
    // clears a member's whole roam and these swifts roam eighteen metres: cleared unsteadied they would be thrown far out of the frame.)
    coloured.push(fauna.add(F.makeFlock({ rng: fr2, species: 'swifts', count: Math.ceil(nb / 3), size: 2.7, speed: 13, spread: [10, 4, 14], wander: [0.9, 0.5, 0.9, 0.8], ...birdPal, along: { path, side: 6, up: 2.2, lead: 26, from: 0.56, to: 0.99, drift: 8 }, keepClear: { path, dist: 2, each: true } })));
    await ctx.yield();
    fauna.add(F.makeDragonflies({    // hummingbirds: dull green hover-and-dart at the stream flowers
      rng: fr2, count: 9, size: 2.6, path, uFrom: 0.52, uTo: 0.84, clear: 3.2, spread: 7.5, lift: [-4.4, -2.4], varieties: [['#5d7a5c', '#2a332b'], ['#6c8468', '#30382f']],
    }));
    await ctx.yield();
    coloured.push(fauna.add(F.makeButterflies({    // stragglers over the meadow, there in every variant
      rng: fr2, count: Math.round(80 * density), size: 2.1, path, uFrom: 0.74, uTo: 1, clear: 3, spread: 24, lift: [-5.5, 4], varieties: [[pal[6], '#fff1d0'], ['#e8760f', '#ffe6c0']],
    })));
    await ctx.yield();
    // each snatch leaves two loose wings spiralling down: let go just ahead of the camera where the flocks cross
    const loose = [], lw = rng.fork('loose');
    for (const us of [uS1, uS2]) for (let i = 0; i < 20; i++) {
      const pp = path.pointAt(Math.min(0.99, us + lw.range(0.0, 0.06)));
      loose.push({ p: [pp.x + lw.range(-7, 7), pp.y + lw.range(1.5, 6), pp.z + lw.range(-2, 2)], seed: [tau(us) - lw.range(1.0, 4.5), lw.range(0.4, 1.1), lw.range(0, TAU), lw()] });
    }
    scene.add(makeLooseWings(loose, U, uTau));
    // far down the trail: three pack horses climbing (at first light, a line of walkers' lanterns instead)
    await ctx.yield();
    const trail = [[19, 336], [27, 312], [17, 288], [25, 264], [18, 244]].map(([x, z]) => new THREE.Vector3(x, hAt(x, z), z));
    const trailCurve = new THREE.CatmullRomCurve3(trail, false, 'centripetal'), trailLen = trailCurve.getLength();
    const fxTime = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    let lanterns = null;
    if (hourName === 'frost') lanterns = set.add(fx.makeGlows({ rng: rng.fork('lan'), count: 5, color: '#ffd29a', size: 1.5, intensity: 2.4, flicker: 0.35, halo: 1.2, time: fxTime, fogAmount: 0.6 }));
    else fauna.add(F.makeHerd({ rng: fr2, species: 'horse', count: 3, mode: 'migrate', route: trail, closed: false, heightAt: hAt, spread: [0.5, 9], speed: 1.25, tints: ['#8a8078', '#6f6a66', '#a39a90'] }));
    await ctx.yield();

    // ---------------------------------------------------------------- air: mist, motes, needles, snow, shafts
    const still = weather === 'still' && !rare;
    set.add(fx.makeMist({ rng: rng.fork('mist'), time: fxTime, count: 80, area: [230, 5, 430], center: [-8, 0, 10], heightAt: hAt, lift: 1.5, size: [18, 42], color: H.fog, opacity: still ? 0.32 : 0.25, drift: still ? [1.5, 0, 0.6] : [2.8, 0, 1.0] }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: rng.fork('breath'), time: fxTime, count: 44, area: [110, 7, 110], follow: true, heightAt: hAt, lift: 4, size: [7, 17], color: H.fog, opacity: 0.16, drift: still ? [2.2, 0, 0.8] : [3.6, 0.1, 1.3] }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', count: Math.round(2800 * density * detail), colors: ['#eef1ef', '#dfe5e3', '#ffffff'], intensity: 0.8, box: [38, 24, 38], time: fxTime }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('needles'), preset: 'leaves', count: 320, colors: ['#5c6a5a', '#7c7b62', '#4b5a4d'], size: [0.015, 0.035], time: fxTime }));
    if (weather === 'snow') set.add(fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', count: Math.round(2600 * detail), time: fxTime }));
    await ctx.yield();
    // wings in the air round the lens once they are loose: a swarm that travels with the camera
    const swarm = set.add(fx.makeParticles({ rng: rng.fork('swarm'), preset: 'petals', count: Math.round(5200 * density * detail), colors: [pal[6], '#e8760f', '#ffa040'], size: [0.1, 0.2], box: [40, 20, 40],
      velocity: [0.4, 0.2, 1.6], turbulence: [1.6, 1.0, 0.5], intensity: 1.5, time: fxTime }));
    swarm.setOpacity(0);
    await ctx.yield();
    // sun shafts: one on the portal, one on the reveal, and a train of them that slides down the gully at 8 m/s
    const rays = [], rayDir = [-sunDir.x, -sunDir.y, -sunDir.z];
    const addRays = (x, z, radius, count, k, slide, rr = rng) => {
      const gy = hAt(x, z), r = fx.makeGodRays({ rng: rr.fork('rays' + rays.length), time: fxTime, position: [x + sunDir.x * 58, gy + sunDir.y * 58, z + sunDir.z * 58], direction: rayDir,
        radius, count, length: 84, width: [2.4, 6.5], falloff: 0.22, color: pal[5], intensity: 0, fogAmount: 0.3 });
      r.base = k; r.slide = !!slide; r.pre = 0; r.late = 0; r.home = r.object.position.clone(); r.z0 = z; r.ph = rays.length * 23.7; rays.push(r); set.add(r);
    };
    addRays(0, ZP - 6, 16, 7, 0.4);                                        // the portal stands in full sun
    addRays(-30, -40, 20, 6, 0.4); rays[rays.length - 1].pre = still ? 0.5 : 0.75;      // lit before the tear: the promise
    for (const z of (still ? [60, 150] : rare ? [30, 60, 92, 120, 150, 176] : [30, 60, 92, 120, 150])) { addRays(gx(z), z, 15, 5, 0.5, true); rays[rays.length - 1].pre = 0.34; }
    await ctx.yield();
    // the promise before the tear: pale shafts already standing in the mist behind the Great Bough (they are what the
    // previous portal shows beyond the dark trunks); and two more on the meadow either side of the portal for the arrival
    addRays(12, 30, 22, 6, 0.24, false, xr); rays[rays.length - 1].pre = 0.7;
    await ctx.yield();
    // and two on the approach itself, on the entry axis: wings turn in them (the 'early' flyers), the first colour of the journey
    addRays(APPROACH[0][0], APPROACH[0][1], 14, 5, 0.62, false, xr); rays[rays.length - 1].pre = 0.85;
    addRays(APPROACH[1][0], APPROACH[1][1], 14, 5, 0.58, false, xr); rays[rays.length - 1].pre = 0.85;
    await ctx.yield();
    addRays(-21, ZP - 36, 12, 5, 0.34, false, xr); rays[rays.length - 1].late = 1;
    addRays(23, ZP - 22, 12, 5, 0.34, false, xr); rays[rays.length - 1].late = 1;
    await ctx.yield();
    // low mist lying between the trunks on the descent toward the Great Bough
    set.add(fx.makeMist({ rng: rng.fork('lowmist'), time: fxTime, count: 26, area: [90, 3, 110], center: [-37, 0, -66], heightAt: hAt, lift: 1.2, size: [15, 27], color: H.fog, opacity: 0.14, drift: still ? [0.8, 0, 0.3] : [1.5, 0, 0.5] }));
    await ctx.yield();

    // ---------------------------------------------------------------- cold pencils of light over the whole forest
    // The deck lets thin cold pencils of light through, from the same sun the reveal uses: at forest places PEN_ROW m apart
    // down the slope (the forest only: the last row stands above the meadow's upper edge) and either side of the stream's
    // line, each place shifted by a seeded offset, seven pencils to a place. No pencil stands in the flight line: the line
    // of every pencil keeps PEN_CLEAR m from the route (measured to places on the route 2 m apart); one that would come
    // nearer stands that much further out, on the side it is already on.
    const PEN_ROW = 75, PEN_CLEAR = 18, routePts = [], _pa = new THREE.Vector3(), _pb = new THREE.Vector3(), _pc = new THREE.Vector3(), _pl = new THREE.Line3(), _rd = new THREE.Vector3(rayDir[0], rayDir[1], rayDir[2]);
    for (let d = 0; d <= path.length; d += 2) routePts.push(path.posAtDist(d).clone());
    const pk = ctx.core.makeRng(ctx.core.hashSeed('cold-pencils:' + ctx.seed)), pencils = [], penLines = [], coldCol = C('#dbe6ee'), warmCol = C(pal[5]);
    for (let row = 0; row < 5; row++) for (const col of [-1, 1]) {
      const z = -200 + row * PEN_ROW + pk.range(-20, 20), x = gx(z) - 30 + col * 38 + pk.range(-14, 14), top = new THREE.Vector3(x, hAt(x, z), z).addScaledVector(sunDir, 58);
      const r = fx.makeGodRays({ rng: pk, time: fxTime, position: top, direction: rayDir, radius: 46, count: 7, length: 84, width: [0.6, 1.9], falloff: 0.22, color: coldCol, intensity: 0, fogAmount: 0.3 });
      pencils.push(r); set.add(r);
      const org = r.object.geometry.attributes.aOrigin.array;
      for (let i = 0; i < 7; i++) for (let pass = 0; pass < 6; pass++) {
        _pl.start.set(top.x + org[i * 3], top.y + org[i * 3 + 1], top.z + org[i * 3 + 2]); _pl.end.copy(_pl.start).addScaledVector(_rd, 84);
        let best = 1e9; for (const q of routePts) { _pl.closestPointToPoint(q, true, _pa); const dd = _pa.distanceTo(q); if (dd < best) { best = dd; _pb.copy(_pa); _pc.copy(q); } }
        if (best >= PEN_CLEAR) break;
        _pb.sub(_pc).setY(0); if (_pb.lengthSq() < 1e-6) _pb.set(col, 0, 0); _pb.normalize();
        org[i * 3] += _pb.x * (PEN_CLEAR - best + 0.5); org[i * 3 + 2] += _pb.z * (PEN_CLEAR - best + 0.5);
      }
      r.object.geometry.boundingSphere.radius += 2 * PEN_CLEAR;
      for (let i = 0; i < 7; i++) penLines.push(new THREE.Vector3(top.x + org[i * 3], top.y + org[i * 3 + 1], top.z + org[i * 3 + 2]));      // a point on each pencil's own line
      await ctx.yield();
    }
    // where each pencil meets the floor, a pool of its light
    const penFeet = penLines.map((pl) => { const f = pl.clone().addScaledVector(sunDir, -58); for (let k = 0; k < 4; k++) f.addScaledVector(sunDir, -(f.y - terrain.surfaceAt(f.x, f.z)) / Math.max(sunDir.y, 0.3)); return f; });
    const lightPools = makeLightPools(penFeet, (x, z) => terrain.surfaceAt(x, z), sunDir, U); scene.add(lightPools);
    await ctx.yield();
    // Early wakers: where one of those pencils passes through a fir's crown, a few single monarchs are awake on the
    // fronds and clusters it touches (points taken on the fir's own triangles within R of the pencil's line); and more
    // of them where the broad shafts that already stand in the mist before the tear fall on a fir.
    const wakers = [];
    {
      const touches = penLines.map((p) => ({ p, R: 2.2, n: 36 }));
      for (const r of rays) if (!r.slide && r.pre > 0) {
        const org = r.object.geometry.attributes.aOrigin.array; let R = 0;
        for (let i = 0; i < org.length; i += 3) R = Math.max(R, Math.hypot(org[i], org[i + 1], org[i + 2]));      // the breadth of this set of shafts
        touches.push({ p: r.home, R, n: 110 });
      }
      const lists = new Map(), cenOf = new Map(), inv = new THREE.Matrix4(), m4 = new THREE.Matrix4(), nm = new THREE.Matrix3(), lo = new THREE.Vector3(), ld = new THREE.Vector3(), q = new THREE.Vector3(), nn = new THREE.Vector3();
      const cens = (g) => {      // per fir shape: centre, normal and mean uv of every frond and cluster triangle
        const key = g.attributes.position; let c = cenOf.get(key); if (c) return c;
        const pos = key.array, nor = g.attributes.normal.array, inf = g.attributes.aInfo.array, uv = g.attributes.uv.array, idx = g.index.array; c = [];
        for (let k = 0; k < idx.length; k += 3) {
          const a = idx[k], b = idx[k + 1], d = idx[k + 2], kind = inf[a * 4]; if (kind < 0.5) continue;
          const u1 = (uv[a * 2] + uv[b * 2] + uv[d * 2]) / 3, v1 = (uv[a * 2 + 1] + uv[b * 2 + 1] + uv[d * 2 + 1]) / 3;
          if (kind < 1.5 ? (Math.abs(v1) > 0.42 || u1 < 0.3) : (v1 > 0.55 || Math.abs(u1 - 0.5) > 0.35)) continue;      // the solid heart of a pad; the body of a cluster
          const m = (o) => (pos[a * 3 + o] + pos[b * 3 + o] + pos[d * 3 + o]) / 3, n = (o) => nor[a * 3 + o] + nor[b * 3 + o] + nor[d * 3 + o], flip = kind < 1.5 && (n(1) < 0) === ((k / 3) % 2 < 1) ? -1 : 1;      // on a pad: one on its upper side, the next hanging under it
          c.push(m(0), m(1), m(2), n(0) * flip, n(1) * flip, n(2) * flip);
        }
        cenOf.set(key, c); return c;
      };
      for (const im of liteGroup.children) {
        await ctx.yield();
        const c = cens(im.geometry), ai = im.geometry.attributes.aInst.array, chunk = im.userData.chunk;
        if (!lists.has(chunk)) lists.set(chunk, { list: [], im });
        const out = lists.get(chunk).list;
        for (let i = 0; i < im.count; i++) {
          im.getMatrixAt(i, m4); inv.copy(m4).invert(); nm.getNormalMatrix(m4);
          ld.copy(sunDir).transformDirection(inv);
          for (const tc of touches) {
            const WAKE_R = tc.R, PER_TOUCH = tc.n;
            lo.copy(tc.p).applyMatrix4(inv);
            let near = false;      // does the pencil's line come inside the crown at any height?
            for (let yl = 5; yl <= 32 && !near; yl += 3) { const t = (yl - lo.y) / ld.y; near = Math.hypot(lo.x + ld.x * t, lo.z + ld.z * t) < crownR(yl) + WAKE_R; }
            if (!near) continue;
            const hit = [];
            for (let k = 0; k < c.length; k += 6) { q.set(c[k] - lo.x, c[k + 1] - lo.y, c[k + 2] - lo.z); const al = q.dot(ld); if (q.lengthSq() - al * al < WAKE_R * WAKE_R) hit.push(k); }
            for (let j = 0, nW = Math.min(PER_TOUCH, hit.length); j < nW; j++) {
              const k = hit[pk.int(0, hit.length - 1)], t0 = ai[i * 3];
              q.set(c[k], c[k + 1], c[k + 2]); const yl = q.y; q.applyMatrix4(m4); nn.set(c[k + 3], c[k + 4], c[k + 5]).applyMatrix3(nm).normalize();
              out.push({ p: [q.x, q.y, q.z], up: [nn.x, nn.y, nn.z], par: [pk.range(0, TAU), pk(), pk.range(7, 13), pk()], rel: t0 < 1e4 ? t0 + (hero.yTop - yl) / 7.5 + 0.3 : 1e5 });
            }
          }
        }
      }
      for (const { list, im } of lists.values()) if (list.length) { const m = makeWakers(list, U); m.userData.im = im; wakers.push(m); scene.add(m); }
    }
    await ctx.yield();
    // Fallen wings: litter under the crown of every fir of the forest (more under a heavily draped one) and under the
    // Great Bough, none in the stream. Drawn with the firs it lies under.
    const litter = [];
    {
      const lt = ctx.core.makeRng(ctx.core.hashSeed('wing-litter:' + ctx.seed)), lists = new Map(), m4 = new THREE.Matrix4(), surf = (x, z) => terrain.surfaceAt(x, z);
      const strew = (cx, cz, n, R, out) => {
        for (let k = 0; k < n; k++) {
          const a = lt.range(0, TAU), r = R * Math.sqrt(lt()), it = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, s: lt.range(2.4, 4.4), rot: lt.range(0, TAU), rnd: lt() };
          if (!(it.z > 6 && Math.abs(it.x - gx(it.z)) < 2.6 + it.s * 0.5)) out.push(it);      // a patch thins to nothing at its rim: none reaches the water
        }
      };
      for (const im of liteGroup.children) {
        const chunk = im.userData.chunk, ai = im.geometry.attributes.aInst.array;
        if (!lists.has(chunk)) lists.set(chunk, { list: [], im });
        for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); strew(m4.elements[12], m4.elements[14], ai[i * 3 + 1] > 0.5 ? 6 : 3, 7, lists.get(chunk).list); }
      }
      if (lists.has(1)) strew(0, 0, 30, 13, lists.get(1).list);      // under the Great Bough
      for (const { list, im } of lists.values()) if (list.length) { const m = await makeLitter(list, surf, U, ctx.yield); m.userData.im = im; litter.push(m); scene.add(m); await ctx.yield(); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- camera gaze, hand-over
    const heroLook = new THREE.Vector3(), lanternP = new THREE.Vector3(), boughLook = new THREE.Vector3();
    const pois = [
      // (the look point always stays ahead of the lens: held at a fixed place on the bough it ended up behind the camera,
      // which then looked back out of the forest for the last metres of the bough)
      { at: (time, u) => { const d = u * path.length, k = smoothstep(9, 21, d), q = path.posAtDist(Math.max(d + 2.1 + 3.5 * k, 3)), t2 = path.tangentAtDist(10); return boughLook.set(q.x - t2.z * 0.3, q.y - lerp(0.74, 0.3, k), q.z + t2.x * 0.3); }, from: 0, to: 0.065, weight: 0.88, fade: 0.2 },
      { at: () => heroLook.set(0, y0 + clamp(hero.frontY() - 5, 17, HH * 0.6), 0), from: 0.17, to: uTurn + 0.03, weight: 0.9, fade: 0.2 },
      { at: deerAt, from: uTurn - 0.01, to: path.nearestXZ(deerAt.x, deerAt.z).u + 0.012, weight: 0.6, fade: 0.35 },
    ];
    const SPAN = 64, showFrom = REV ? -1 : uI - 0.01, nHeroFly = hero.flyers.geometry.instanceCount, uBehind = path.nearestXZ(gx(48), 48).u, uBack = path.nearestXZ(-38.5, -84).u, uHide = path.nearestXZ(gx(40), 40).u, glintRay = glints.material.uniforms.uRay.value;
    const heroSolid = ['great-bough', 'monarch-needles'].map((n) => hero.object.getObjectByName(n)).filter(Boolean);
    // the Great Bough's own bounds (its boughs spring up as the wings leave: a wide margin), so that it is not drawn while it is out of sight
    { const gbm = hero.object.getObjectByName('great-bough'); if (gbm && gbm.geometry.attributes.position) { gbm.geometry.computeBoundingSphere(); gbm.geometry.boundingSphere.radius = gbm.geometry.boundingSphere.radius * 1.15 + 4; gbm.frustumCulled = true; } }
    const fogD = scene.fog.density, foot = hero.shaftFoot, poolU = sunPool.material.uniforms.uPool.value, cloudA = sky.uniforms.uCloudA.value, cloudB = sky.uniforms.uCloudB.value;
    const silver0 = cloudB[0].y;
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    return {
      scene, path, duration: DURATION, pace, title: rare ? H.title + ' (all at once)' : H.title,
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.15, far: 3000, lookAhead: 22, sway: 0.8, bank: 0.7 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#ffe9c4', glow: 1.0, revealDistance: 240 },
      post: {
        exposure: 0.97, bloom: { strength: 0.44, radius: 0.7, threshold: 0.92 },
        grade: { saturation: 0.94, contrast: 1.05, tint: '#f3f6f5', shadowTint: '#0a0f13', vignette: 0.34, grain: 0.03, aberration: 0 },
      },
      update(dt, time, camera, u) {
        const te = teOf(u), gate = gateOf(u);
        hero.setEventTime(te); hero.uniforms.uWarm.value = gate; hero.update(dt, time, camera);
        U.uClock.value = te; U.uTime.value = time; U.uGate.value = gate; fxTime.value = time; uTau.value = tau(u);
        ctx.renderer.getDrawingBufferSize(bufSize); uPx.value = bufSize.y / (2 * Math.tan((camera.fov || 62) * Math.PI / 360));
        // the light: flat cold shade before, a warm key through moving cloud gaps after (the exposure lift of the brief)
        // the deck itself only opens once the front is well down the tree, so the first shaft and the first orange are seen
        // against grey; then ragged blue-grey gaps, bright cloud edges, and sun and cloud shadow sliding over the slope
        const open = REV || rare ? gate : smoothstep(4.5, 11.0, te), sunK = 0.12 * gate + 0.88 * open;
        sun.intensity = lerp(H.sun[0], H.sun[1], sunK); hemi.intensity = lerp(H.hemi[0], H.hemi[1], gate);
        cloudA[0].x = lerp(H.cover[0], rare ? 0.4 : H.cover[1], open); cloudB[0].y = lerp(silver0, 1.1, open);
        if (cloudA[1]) { cloudA[1].x = lerp(0.9, 0.42, open); cloudA[1].w = lerp(1, 0.5, open); }
        if (cloudU) cloudU.w = (still ? 0.62 : 0.92) * sunK;
        cloudShade.material.uniforms.uK.value = (still ? 0.6 : 1) * sunK;
        deck.material.uniforms.uDeck.value = 1 - 0.85 * open;      // the deck's own reaches thin as it tears
        scene.fog.density = fogD * lerp(0.74, 1, smoothstep(uI + 0.03, uTurn + 0.02, u));      // the Great Bough stands clear in the grey approach
        poolU.set(foot.x, foot.y, foot.z * (1 - 0.8 * open) * (0.35 + 0.65 * gate));
        if (stream.light && stream.light.skyQ) stream.light.skyQ.z = lerp(0.08, 0.45, gate);
        let gi = 0;
        for (const r of rays) {
          let k = r.base * Math.max(gate, r.pre) * (r.late ? smoothstep(0.56, 0.72, u) : 1);
          if (r.slide) {
            const f = (((time * 8 + r.ph) % SPAN) + SPAN) % SPAN, s = f - SPAN / 2, z = r.z0 + s;
            r.object.position.set(r.home.x + gx(z) - gx(r.z0), r.home.y - 0.2 * s, r.home.z + s);
            k *= Math.sin(Math.PI * f / SPAN);
            if (gi < 6) glintRay[gi++].set(z, gate * k / r.base, 0);        // the stream sparkles only inside this footprint
          }
          r.uniforms.uIntensity.value = k;
        }
        riverShadow.material.uniforms.uFront.value = (te - 3) * 11;
        riverShadow.material.uniforms.uTail.value = (te - 17) * 9;
        ribbon.visible = riverShadow.material.uniforms.uFront.value + 6 > riverLen - RIB_LEAVE && riverShadow.material.uniforms.uTail.value - 6 < riverLen - RIB_LEAVE + ribLen;      // while the river's front has reached the place where the ribbon leaves it and its tail has not yet left the ribbon's end
        const loose = te > -1 ? 1 : 0;        // nothing released yet: the flyers are not drawn at all
        const farK = REV ? lerp(0.3, 1, smoothstep(0.08, 0.3, u)) : 1;      // (afternoon: the river is 250 m off at the entry, a fraction of it is plenty)
        hero.flyers.geometry.instanceCount = Math.round(loose * nHeroFly * farK); cascade.geometry.instanceCount = loose ? Math.max(nEarly, Math.round(flyList.length * farK)) : nEarly;
        perched.geometry.instanceCount = u < uHide ? nBoughWings : 0; perchedFar.geometry.instanceCount = u > 0.25 ? rimWings.length : 0;
        for (const m of boughPerched) m.visible = u < uHide;      // the four boughs' wings: with the firs' own
        swarm.setOpacity(smoothstep(1.0, 4.5, te) * (1 - 0.6 * smoothstep(13, 20, te)) * (1 - smoothstep(0.9, 0.97, u)));
        for (const im of liteGroup.children) {
          if (im.userData.chunk === 3) im.visible = u > uTurn - 0.04;       // the meadow's firs: 230 m off in the mist until then
          else if (im.userData.chunk === 2) im.visible = u > 0.12;         // the lower gully: 300 m off behind the Great Bough at the entry
          else if (im.userData.chunk === 0) im.visible = u < uHide;          // the firs of the approach: behind us once we look down the gully
          else if (im.userData.chunk === 4) im.visible = u < uBack;
        }
        for (const m of heroSolid) m.visible = u < uHide;      // the Great Bough itself: 40 m behind the lens on the river
        for (const m of barPerched) m.visible = perchedFar.geometry.instanceCount > 0; barLift.visible = loose > 0;      // the bars' drinkers with the stream's other drinkers; their lifters once wings are loose
        for (const m of wakers) m.visible = m.userData.im.visible;      // the early wakers are drawn with the firs they sit on
        for (const m of litter) m.visible = m.userData.im.visible;      // and the fallen wings with the firs they lie under
        const penK = Math.max(gate, 0.9) * (1 - 0.7 * open);      // the pencils are the deck's gaps: as the deck tears and the whole sky lights, they thin away
        for (const r of pencils) { r.uniforms.uColor.value.lerpColors(coldCol, warmCol, gate); r.uniforms.uIntensity.value = (still ? 0.36 : 0.5) * penK; }
        lightPools.material.uniforms.uCol.value.lerpColors(coldCol, warmCol, gate); lightPools.material.uniforms.uK.value = (still ? 1.2 : 1.7) * penK;
        const show = u > showFrom;
        for (const c of coloured) if (c && c.object) c.object.visible = show;
        if (lanterns) for (let i = 0; i < 5; i++) {
          const s = (((time * 1.1 + i * 6.5) % trailLen) + trailLen) % trailLen;
          trailCurve.getPointAt(s / trailLen, lanternP);
          lanterns.setPosition(i, lanternP.x + Math.sin(i * 2.1) * 0.5, lanternP.y + 1.1 + 0.08 * Math.sin(time * 3.1 + i), lanternP.z);
        }
        sky.update(dt, time, camera); terrain.update(dt, time);
        forest.update(dt, time, camera); beyond.update(dt, time, camera); ridges.update(dt, time, camera);
        ferns.update(dt, time, camera); grass.update(dt, time, camera); flowers.update(dt, time, camera); floorGrass.update(dt, time, camera);
        grassTall.update(dt, time, camera); milkweed.update(dt, time, camera); bankGrass.update(dt, time, camera); ferns2.update(dt, time, camera); floorGrass2.update(dt, time, camera);
        stream.update(dt, time, camera); fauna.update(dt, time, camera, u); set.update(dt, time, camera);
      },
      dispose() { sky.dispose?.(); },
    };
  },
};
