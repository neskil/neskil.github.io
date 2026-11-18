// city-closing-overhead: THE LIFE OF THE FOLDED TOWN (an update; the light, the tone, the town, the curl and the route are untouched).
// All of it is AMBIENT, on the world's clock alone (uLifeT): update() writes that one uniform. Six draws:
//   closing-life-vehicles, closing-life-carlights  440 small vehicles as moving lamps on the plan's long and cross streets of the
//                       flat town, the flank and the hanging town (the life frame: the houses' own mapping onto the roll): a low
//                       dark body 4 m long, two warm white lamps ahead, two red behind, a soft warm pool on the setts before it
//                       (a quad on the street's own ground, 8 to 12 m). Each on a stretch of one street as a closed there-and-back
//                       course, keeping to one side, 8 to 14 m/s; more on the wide streets. NEVER WITHIN 12 m OF THE FLOWN LINE
//                       (a course is made only of street 21 m and more off it, squares and typed places left out).
//   closing-life-birds  eight flocks of 80 to 120 birds (wings 1.4 to 1.6 m), dark bodies (near-black on both sides), instanced; wings beat
//                       in the vertex program; each flock on its own CLOSED loop dealt from its own name stream (set in the air nearest the way that clears it), in the bend's
//                       own frame (a along the land, h off its ground, z along the street), through the open air between the
//                       street's town and the hanging town. NEVER WITHIN 15 m OF THE FLOWN LINE: counted in build against the
//                       path (every phase, the cloud's whole reach); a loop too near takes the nearest height that clears,
//                       else the flock is not made (stats.birds).
//   closing-life-smoke  12 chimneys of the FLAT town by die (two in each of six bands of z), 12 soft puffs each, from the chimney's
//                       own top; each rises along its ground's normal, drifts with the kept wind (+z) and thins over 12 to 20 m;
//                       warm at its foot, grey-violet above. The flank's and the hanging town's plumes are OUT (their dice are
//                       still drawn). No chimney within 24 m of the flown line, no plume's own line within 14 m (a place law).
//   closing-life-lamps  one faint additive halo on each street lamp of the plan, breathing on its own phase (a gas flame).
//   closing-life-cloth  NOT MADE: the washing is out (its most is 0: no line was seen to hold it) and the awnings (both rows are arcaded).
// RULES OF THIS FILE THAT READ THE EYE'S PLACE (all of them):
//   1. a smoke puff's quad FACES THE EYE (a round soft puff has no side);
//   2. a lamp halo's quad FACES THE EYE, and is never drawn under 1.5 pixels in radius (its light kept: a pixel's footprint);
//   3. a vehicle lamp's glow quad FACES THE EYE, never under 1.5 pixels in radius (its light kept);
//   4. the scene's fog on every thing here (air by distance).
// Nothing here is placed, sized, shown, hidden, lit or timed by the lens, the gaze or the wall clock.
import * as THREE from 'three';
import { PLAN, bendAt, BEND_GLSL } from './city-closing-overhead.js';

const TAU = 6.283185307179586;
// the life frame: a over 0 rides the bend at a; a under 0 is the flat side of the hinge (x = HX + a), h its height over the ground
const _v = new THREE.Vector3();
export const lifeAt = (K, a, h, z, out = new THREE.Vector3()) => bendAt(K, Math.max(a, 0), Math.min(a, 0), h, z, out);
const LIFE_GLSL = BEND_GLSL + /* glsl */`
uniform float uLifeT;
vec3 lifeNormal;
vec3 lifeAt(float a, float h, float z) {
  bendFrameAt(max(a, 0.0));
  lifeNormal = vec3(-bendF.y, bendF.x, 0.0);
  return vec3(bendC + min(a, 0.0) * bendF + h * vec2(-bendF.y, bendF.x), z);
}
`;
const FOG_V = '#include <fog_pars_vertex>\n', FOG_F = '#include <fog_pars_fragment>\n';

// ---------------------------------------------------------------- THE BIRDS
const BIRD_VERT = /* glsl */`
${LIFE_GLSL}${FOG_V}
attribute float aWing; attribute vec4 aB0; attribute vec3 aB1;
uniform vec4 uFlA[8]; uniform vec4 uFlB[8];
vec3 courseAt(vec4 A, vec4 B, float ph, vec3 off) {
  return vec3(A.x + B.x * cos(ph) + off.x, A.y + B.y * sin(ph + 1.3) + off.y, A.z + B.z * sin(ph) + off.z);
}
void main() {
  int f = int(aB0.x + 0.5);
  vec4 A = uFlA[f], B = uFlB[f];
  float ph = ${TAU.toFixed(6)} * fract(uLifeT * A.w + B.w + aB0.y);
  vec3 off = aB1 * (1.0 + 0.3 * sin(uLifeT * 0.37 + aB0.z * 40.0));        // the cloud breathes (a loop of the clock)
  vec3 c1 = courseAt(A, B, ph + 0.02, off), c0 = courseAt(A, B, ph, off);
  vec3 p1 = lifeAt(c1.x, c1.y, c1.z), p0 = lifeAt(c0.x, c0.y, c0.z);       // (the frame left standing is p0's)
  vec3 d = p1 - p0; vec3 fwd = d * inversesqrt(max(dot(d, d), 1e-8));
  vec3 r = cross(fwd, lifeNormal); vec3 right = r * inversesqrt(max(dot(r, r), 1e-4)); vec3 up = cross(right, fwd);
  float glide = smoothstep(0.3, 0.8, sin(uLifeT * 0.8 + aB0.z * 23.0));
  float ang = 0.95 * (1.0 - 0.5 * glide) * sin(uLifeT * 26.0 + aB0.z * ${TAU.toFixed(6)});
  float lx = position.x * mix(1.0, cos(ang), aWing), ly = abs(position.x) * aWing * sin(ang);
  vec3 wp = p0 + aB0.w * (right * lx + up * ly + fwd * position.z);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
${FOG_F}uniform vec3 uBirdC;
void main() {
  gl_FragColor = vec4(uBirdC, 1.0);                                  // every bird a dark body on both its sides: only the air's tone with distance
  #include <fog_fragment>
}`;
// one bird: a slim body and two wings hinged at it (x across, z along its flight; aWing 1 at a wing's tip); half-span 0.5
function birdGeometry() {
  const P = [0, 0, 0.26, -0.05, 0, 0, 0.05, 0, 0, 0, 0, -0.3, -0.04, 0, 0.12, -0.04, 0, -0.1, -0.5, 0, -0.08, 0.04, 0, 0.12, 0.04, 0, -0.1, 0.5, 0, -0.08];
  const W = [0, 0, 0, 0, 0, 0, 1, 0, 0, 1], I = [0, 1, 2, 1, 3, 2, 4, 6, 5, 7, 8, 9];
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('aWing', new THREE.BufferAttribute(new Float32Array(W), 1));
  g.setIndex(I);
  return g;
}
// the least distance from the flown line to a flock's course (every phase), by the builder's own count `off` (to 80 m)
export function courseClear(off, A, B, n = 144) {
  let best = Infinity;
  for (let i = 0; i < n; i++) { const ph = TAU * i / n; best = Math.min(best, off(A[0] + B[0] * Math.cos(ph), A[1] + B[1] * Math.sin(ph + 1.3), A[2] + B[2] * Math.sin(ph), 80)); }
  return best;
}
const SPREAD = [7, 3, 7], REACH = 1.3 * Math.hypot(7, 3, 7) + 1.2;         // the cloud's half-widths (a, h, z) and its whole reach with a wing
export const BIRD_CLEAR = 15, CAR_CLEAR = 12;
// ---------------------------------------------------------------- THE VEHICLES (programs): a course is a stretch of one street, there and back
const CAR_GLSL = /* glsl */`
attribute vec4 aV0; attribute vec4 aV1;                 // (a, z of the course's start, its length, 0 along z or 1 along a); (turns a second, phase, lane, pool)
vec3 carP; vec2 carF;
void carAt() {
  float s = fract(uLifeT * aV1.x + aV1.y), len = aV0.z;
  float go = s < 0.5 ? 1.0 : -1.0, p = s < 0.5 ? 2.0 * s : 2.0 - 2.0 * s;
  vec2 f = aV0.w < 0.5 ? vec2(0.0, 1.0) : vec2(1.0, 0.0);
  float lat = go * aV1.z * clamp(min(p, 1.0 - p) * len / 6.0, 0.0, 1.0);    // keeps to its side; crosses over at the course's two ends
  carF = f * go;
  carP = vec3(aV0.x + f.x * p * len + f.y * lat, 0.0, aV0.y + f.y * p * len - f.x * lat);
}
`;
// the same law in JS (the proof's): -> [a, z, fa, fz] of vehicle i at clock t
export function carAt(v0, v1, i, t, out = [0, 0, 0, 0]) {
  const s = (((t * v1[4 * i] + v1[4 * i + 1]) % 1) + 1) % 1, go = s < 0.5 ? 1 : -1, p = s < 0.5 ? 2 * s : 2 - 2 * s, len = v0[4 * i + 2], fa = v0[4 * i + 3] > 0.5 ? 1 : 0, fz = 1 - fa;
  const lat = go * v1[4 * i + 2] * Math.min(1, Math.max(0, Math.min(p, 1 - p) * len / 6));
  out[0] = v0[4 * i] + fa * p * len + fz * lat; out[1] = v0[4 * i + 1] + fz * p * len - fa * lat; out[2] = fa * go; out[3] = fz * go; return out;
}
const CAR_VERT = /* glsl */`
${LIFE_GLSL}${CAR_GLSL}${FOG_V}
attribute vec2 aPart; uniform vec3 uCarBody; uniform vec3 uCarFront; uniform vec3 uCarRear;
varying vec3 vCol;
void main() {
  carAt();
  vec2 r = vec2(carF.y, -carF.x);
  vec4 mvPosition = viewMatrix * vec4(lifeAt(carP.x + carF.x * position.z + r.x * position.x, position.y, carP.z + carF.y * position.z + r.y * position.x), 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vCol = aPart.x > 1.5 ? uCarRear : aPart.x > 0.5 ? uCarFront : uCarBody * aPart.y * (0.6 + 0.9 * fract(aV1.y * 57.0));
  #include <fog_vertex>
}`;
const CARLIGHT_VERT = /* glsl */`
${LIFE_GLSL}${CAR_GLSL}${FOG_V}
attribute float aKind; uniform float uViewH; uniform vec3 uPoolC; uniform vec3 uCarFront; uniform vec3 uCarRear;
varying vec2 vUv; varying vec3 vCol; varying float vKind;
void main() {
  carAt();
  vec2 r = vec2(carF.y, -carF.x);
  vec4 mvPosition;
  if (aKind < 0.5) {                                                        // the pool: a quad on the street's own ground before it
    float fz = 2.2 + (0.5 * position.y + 0.5) * aV1.w, fx = 3.0 * position.x;
    mvPosition = viewMatrix * vec4(lifeAt(carP.x + carF.x * fz + r.x * fx, 0.12, carP.z + carF.y * fz + r.y * fx), 1.0);
    vCol = uPoolC;
  } else {                                                                  // RULE 3: a lamp's glow faces the eye, never under 1.5 pixels, its light kept
    float e = aKind < 1.5 ? 1.0 : -1.0, rw = aKind < 1.5 ? 1.3 : 0.9;
    mvPosition = viewMatrix * vec4(lifeAt(carP.x + carF.x * 2.05 * e, 0.8, carP.z + carF.y * 2.05 * e), 1.0);
    float pxm = uViewH * 0.5 * projectionMatrix[1][1] / max(-mvPosition.z, 0.5), rr = max(rw, 1.5 / pxm);
    mvPosition.xy += position.xy * rr;
    vCol = (aKind < 1.5 ? uCarFront : uCarRear) * (rw * rw) / (rr * rr);
  }
  vKind = aKind; vUv = position.xy;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CARLIGHT_FRAG = /* glsl */`
${FOG_F}varying vec2 vUv; varying vec3 vCol; varying float vKind;
void main() {
  float v = 0.5 * vUv.y + 0.5, d2 = dot(vUv, vUv);
  float g = vKind < 0.5 ? (1.0 - smoothstep(0.15, 1.0, abs(vUv.x))) * smoothstep(0.0, 0.08, v) * (1.0 - v) : exp(-3.5 * d2) * (1.0 - smoothstep(0.6, 1.0, d2));
  vec3 col = vCol * g;
  #ifdef USE_FOG
    col *= exp(-0.16 * fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;
// a low plain body 4 m long (no bottom) with two lamps ahead and two behind: aPart (0 body, 1 front lamp, 2 rear lamp; the face's shade)
function carGeometry() {
  const P = [], Q = [], I = [], x = 0.85, y0 = 0.25, y1 = 1.35, z = 2;
  const quad = (a, b, c, d, kind, shade) => { const n = P.length / 3; P.push(...a, ...b, ...c, ...d); for (let k = 0; k < 4; k++) Q.push(kind, shade); I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  quad([-x, y1, -z], [-x, y1, z], [x, y1, z], [x, y1, -z], 0, 1.7);
  quad([-x, y0, z], [x, y0, z], [x, y1, z], [-x, y1, z], 0, 1); quad([-x, y0, -z], [x, y0, -z], [x, y1, -z], [-x, y1, -z], 0, 1);
  quad([-x, y0, -z], [-x, y0, z], [-x, y1, z], [-x, y1, -z], 0, 0.8); quad([x, y0, -z], [x, y0, z], [x, y1, z], [x, y1, -z], 0, 0.8);
  for (const sx of [-0.55, 0.55]) for (const e of [1, -1]) quad([sx - 0.16, 0.62, e * (z + 0.02)], [sx + 0.16, 0.62, e * (z + 0.02)], [sx + 0.16, 0.86, e * (z + 0.02)], [sx - 0.16, 0.86, e * (z + 0.02)], e > 0 ? 1 : 2, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(Q), 2)); g.setIndex(I);
  return g;
}
function carLightGeometry() {
  const P = [], Q = [], I = [];
  for (let k = 0; k < 3; k++) { P.push(-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0); Q.push(k, k, k, k); I.push(4 * k, 4 * k + 1, 4 * k + 2, 4 * k, 4 * k + 2, 4 * k + 3); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(Q), 1)); g.setIndex(I);
  return g;
}
// ---------------------------------------------------------------- THE SMOKE, THE LAMPS' BREATH, THE CLOTH (programs)
const SMOKE_VERT = /* glsl */`
${LIFE_GLSL}${FOG_V}
attribute vec4 aS0; attribute vec4 aS1;
uniform vec3 uSmWarm; uniform vec3 uSmGrey;
varying vec2 vUv; varying vec4 vCol;
void main() {
  float age = fract(uLifeT / aS1.x + aS1.y), L = aS0.w;
  float rise = 0.66 * L * (1.0 - exp(-2.4 * age));                          // off its own roof, along its own ground's normal
  float drift = 0.8 * L * age * (0.3 + 0.7 * age);                           // the kept wind: along the street toward +z
  float wz = 0.9 * age * sin(uLifeT * 0.5 + aS1.w * 6.2832 + age * 5.0), wa = 0.9 * age * cos(uLifeT * 0.4 + aS1.w * 11.0 + age * 4.0);
  vec3 c = lifeAt(aS0.x + wa - 0.15 * L * age * age, aS0.y + rise, aS0.z + drift + wz);
  vec4 mvPosition = viewMatrix * vec4(c, 1.0);
  mvPosition.xy += position.xy * aS1.z * (0.45 + 2.3 * age);                 // RULE 1: the puff faces the eye
  gl_Position = projectionMatrix * mvPosition;
  vUv = position.xy;
  vCol = vec4(mix(uSmWarm, uSmGrey, smoothstep(0.0, 0.3, age)), 1.0 * smoothstep(0.0, 0.04, age) * (1.0 - age) * (1.0 - 0.45 * age));
  #include <fog_vertex>
}`;
const SMOKE_FRAG = /* glsl */`
${FOG_F}varying vec2 vUv; varying vec4 vCol;
void main() {
  gl_FragColor = vec4(vCol.rgb, vCol.a * (1.0 - smoothstep(0.08, 1.0, dot(vUv, vUv))));
  #include <fog_fragment>
}`;
const LAMP_VERT = /* glsl */`
${LIFE_GLSL}${FOG_V}
attribute vec4 aL0; uniform float uViewH;
varying vec2 vUv; varying float vGain;
void main() {
  vec3 c = lifeAt(aL0.x, aL0.y, aL0.z);
  vec4 mvPosition = viewMatrix * vec4(c, 1.0);
  float pxm = uViewH * 0.5 * projectionMatrix[1][1] / max(-mvPosition.z, 0.5);
  float r = max(2.4, 1.5 / pxm);                                            // RULE 2: never under 1.5 pixels, its light kept
  vGain = (5.76 / (r * r)) * (0.5 + 0.3 * sin(uLifeT * 2.3 + aL0.w) + 0.2 * sin(uLifeT * 5.9 + 1.7 * aL0.w));
  mvPosition.xy += position.xy * r;                                         // RULE 2: the halo faces the eye
  gl_Position = projectionMatrix * mvPosition;
  vUv = position.xy;
  #include <fog_vertex>
}`;
const LAMP_FRAG = /* glsl */`
${FOG_F}uniform vec3 uHalo; varying vec2 vUv; varying float vGain;
void main() {
  float d2 = dot(vUv, vUv);
  vec3 col = uHalo * vGain * exp(-3.0 * d2) * (1.0 - smoothstep(0.6, 1.0, d2));
  #ifdef USE_FOG
    col *= exp(-0.16 * fogDensity * fogDensity * vFogDepth * vFogDepth);    // the air on a source: the lamps' own share (0.4 of the density)
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;
const CLOTH_VERT = /* glsl */`
${LIFE_GLSL}${FOG_V}
attribute vec3 aCl; attribute vec3 aCol; uniform vec3 uClothL;
varying vec3 vCol;
void main() {
  float s = aCl.x * (sin(uLifeT * 1.6 + aCl.y) + 0.4 * sin(uLifeT * 3.3 + 1.9 * aCl.y));
  vec3 p = position + s * mix(vec3(0.22, 0.03, 0.04), vec3(0.05, 0.035, 0.0), aCl.z);   // washing swings across its line; an awning's edge lifts
  vec4 mvPosition = viewMatrix * vec4(lifeAt(p.x, p.y, p.z), 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vCol = aCol * uClothL * (1.0 - 0.18 * aCl.x);
  #include <fog_vertex>
}`;
const CLOTH_FRAG = /* glsl */`
${FOG_F}varying vec3 vCol;
void main() {
  gl_FragColor = vec4(vCol, 1.0);
  #include <fog_fragment>
}`;
function quadGeometry() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
const inst = (g, name, arr, n) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), n));
// ---------------------------------------------------------------- THE BUILDER
// buildLife(ctx, { bend, plan, path, chimneys, light }) -> { group, update(dt, time, camera, u), stats, dispose }
export async function buildLife(ctx, o = {}) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const group = new THREE.Group(); group.name = 'closing-life';
  const plan = o.plan || {}, flat = plan.flat || {}, K = o.bend.knots, path = o.path;
  const uLifeT = { value: 0 }, uBendK = o.bend.uniforms.uBendK, fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const geos = [], mats = [], stats = { birds: [], birdCount: 0, vehicles: 0, courses: 0, smoking: 0, lamps: 0, washing: 0, awnings: 0, tris: 0, draws: 0 };
  // THE FLOWN LINE, a point every 3 m, with the opening's 60 m behind the entry (the path's own straight run-on), by cells of z
  const cells = new Map(), CELL = 16;
  for (let d = -60; d <= path.length; d += 3) { path.posAtDist(d, _v); const c = Math.floor(_v.z / CELL); if (!cells.has(c)) cells.set(c, []); cells.get(c).push(_v.x, _v.y, _v.z); }
  // the least distance from the flown line to a place of the life frame, counted to `cap` metres (cap where none is nearer)
  const offWay = (a, h, z, cap = 100) => {
    lifeAt(K, a, h, z, _v); let best = cap * cap;
    for (let c = Math.floor((_v.z - cap) / CELL); c <= Math.floor((_v.z + cap) / CELL); c++) { const L = cells.get(c); if (!L) continue; for (let j = 0; j < L.length; j += 3) { const dx = L[j] - _v.x, dy = L[j + 1] - _v.y, dz = L[j + 2] - _v.z, q = dx * dx + dy * dy + dz * dz; if (q < best) best = q; } }
    return Math.sqrt(best);
  };
  const add = (geo, mat, name, order, tris) => {
    const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; m.renderOrder = order; m.castShadow = false; m.receiveShadow = false;
    geos.push(geo); mats.push(mat); group.add(m); stats.tris += tris; stats.draws++; return m;
  };

  // ---- THE BIRDS: eight long loops along the street through the open air between the street's town and the hanging town,
  // one in each eighth of the town's length (the third about tower A, the sixth in tower B's air on the hanging half);
  // a loop too near the flown line takes the nearest height that clears it (6 m a turn, up then down, thirteen at most)
  const tA = flat.towerA || { x: 62.25, z: 330, h: 62 }, tB = (plan.sites && plan.sites.towerB) || { a: 422, z: 528, h: 70 };
  const NF = 8, AC = [-50, 60, tA.x - PLAN.HX, 150, 20, tB.a, 110, -30], TRY = [0, 6, -6, 12, -12, 18, -18, 24, -24, 30, 36, 42, 48];
  const flA = [], flB = [], b0 = [], b1 = [];
  for (let i = 0; i < NF; i++) {
    const R = stream('closing-life-flock-' + i), zr = R(), ar = R.range(-20, 20), h0 = R.range(26, 60), ra = R.range(30, 55), rz = R.range(60, 100), rh = R.range(6, 12);
    const n = 80 + Math.floor(R() * 41), ph0 = R(), dir = R() < 0.5 ? -1 : 1, mem = [];
    for (let k = 0; k < n; k++) { const g = () => (R() + R() + R() - 1.5) / 1.5; mem.push([i, 0.03 * (R() - 0.5), R(), R.range(1.4, 1.6), SPREAD[0] * g(), SPREAD[1] * g(), SPREAD[2] * g()]); }
    const A = [AC[i] + (i === 2 || i === 5 ? 0 : ar), h0, i === 2 ? tA.z : i === 5 ? tB.z : 60 + 1100 * (i + zr) / NF, dir * 13 / (TAU * Math.sqrt((ra * ra + rz * rz) / 2))], B = [ra, rh, rz, ph0];
    // SEEN FROM THE WAY (design, on every seed): of twenty-five airs about its own place (five across the land, five heights), the
    // loop takes the one nearest the flown line that clears it with 3 m to spare (the towers' two keep their towers)
    let clear = 0, lifts = 0, made = false, near = null, hBase = h0;
    if (i !== 2 && i !== 5) for (const ca of [-60, 0, 60, 120, 180]) for (const ch of [30, 50, 70, 90, 110]) {
      const T = [ca + ar, ch + (h0 - 43) / 3, A[2]], c = courseClear(offWay, T, B, 36);
      if (c >= BIRD_CLEAR + REACH + 4 && (!near || c < near.c)) near = { c, a: T[0], h: T[1] };
    }
    if (near) { A[0] = near.a; hBase = near.h; }
    for (; lifts < TRY.length && !made; lifts++) { A[1] = hBase + TRY[lifts]; if (A[1] < 16) continue; clear = courseClear(offWay, A, B); made = clear >= BIRD_CLEAR + REACH + 1; }
    stats.birds.push({ made, count: made ? n : 0, lifts, course: +clear.toFixed(1), least: +(clear - REACH).toFixed(1) });
    flA.push(new THREE.Vector4(...A)); flB.push(new THREE.Vector4(...B));
    if (made) { stats.birdCount += n; for (const m of mem) { b0.push(m[0], m[1], m[2], m[3]); b1.push(m[4], m[5], m[6]); } }
    await ctx.yield();
  }
  if (stats.birdCount) {
    const g = birdGeometry(); inst(g, 'aB0', b0, 4); inst(g, 'aB1', b1, 3); g.instanceCount = stats.birdCount;
    const mat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), { uBendK, uLifeT, uFlA: { value: flA }, uFlB: { value: flB }, uBirdC: { value: new THREE.Color('#141a33') } }),
      vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide });
    add(g, mat, 'closing-life-birds', 4, 4 * stats.birdCount);
  }

  // ---- THE VEHICLES: moving lamps on the plan's long and cross streets of both halves (the flat town's by a = x - HX)
  const V = stream('closing-life-vehicles'), sites = plan.sites || {}, sq = plan.squares || {};
  const siteList = [sites.towerB, sites.church, ...(sites.towerHouses || []), ...(sites.fountains || [])].filter(Boolean), paved = [sq.hinge && sq.hinge.paved, sq.hanging && sq.hanging.paved].filter(Boolean);
  const blocked = (a, z) => siteList.some((q) => Math.abs(a - q.a) < q.w / 2 + 4 && Math.abs(z - q.z) < q.d / 2 + 4) || paved.some((q) => a > q.a0 - 3 && a < q.a1 + 3 && z > q.z0 - 3 && z < q.z1 + 3);
  const streets = [], courses = [];
  for (const l of plan.longs || []) if (l.zone !== 'brink') streets.push({ a: (l.a0 + l.a1) / 2, z: l.z0, len: l.z1 - l.z0, along: 0, hw: (l.a1 - l.a0) / 2, wide: !!l.wide });
  for (const c of plan.cross || []) streets.push({ a: Math.max(8, c.aStart), z: (c.z0 + c.z1) / 2, len: c.aEnd - Math.max(8, c.aStart), along: 1, hw: (c.z1 - c.z0) / 2, wide: !!c.wide });
  for (const l of flat.longs || []) streets.push({ a: -34 - (l.f0 + l.f1) / 2, z: l.z0, len: l.z1 - l.z0, along: 0, hw: (l.f1 - l.f0) / 2, wide: false });
  for (const c of flat.cross || []) streets.push({ a: -220, z: (c.z0 + c.z1) / 2, len: 182, along: 1, hw: (c.z1 - c.z0) / 2, wide: !!c.wide });
  // a course: a run of a street less 15 m at each end, 48 m and more (cut to 140 m at the most), every 4 m of it on the land, off the squares and the
  // typed places, and 21 m and more off the flown line (12 m, the lane, half a body, a lamp's glow and a margin)
  for (let k = 0; k < streets.length; k++) {
    const st = streets[k], n = Math.floor(st.len / 4); let run = -1;
    for (let i = 0; i <= n + 1; i++) {
      const a = st.a + (st.along ? 4 * i : 0), z = st.z + (st.along ? 0 : 4 * i);
      const ok = i <= n && z > -50 && z < 1480 && (a < 0 || !plan.onLand || plan.onLand(a, z, 4)) && !blocked(a, z) && offWay(a, 1, z, 40) >= CAR_CLEAR + 9;
      if (ok && run < 0) run = i;
      if (!ok && run >= 0) {
        const L = 4 * (i - 1 - run) - 30, parts = Math.ceil(L / 140), s0 = 4 * run + 15;   // (15 m in from the run's two ends: a pool never reaches past the run)
        if (L >= 48) for (let q = 0; q < parts; q++) courses.push({ a: st.a + (st.along ? s0 + q * L / parts : 0), z: st.z + (st.along ? 0 : s0 + q * L / parts), len: L / parts, along: st.along, lane: 0.42 * st.hw, w: (L / parts) * (st.wide ? 2.2 : 1) });
        run = -1;
      }
    }
    if (k % 40 === 39) await ctx.yield();
  }
  await ctx.yield();
  // 440 of them, a course by die in the measure of its length (a wide street's counts 2.2 times: more on the wide streets);
  // one speed a course (8 to 14 m/s), its vehicles spaced round its loop
  const NV = 440, v0 = [], v1 = [], per = courses.map(() => []); let tot = 0;
  for (const c of courses) { c.v = V.range(8, 14); tot += c.w; }
  for (let k = 0; k < NV && courses.length; k++) {
    const pick = V() * tot, jit = V(), pool = V.range(8, 12); let i = 0, acc = courses[0].w;
    while (i < courses.length - 1 && acc < pick) acc += courses[++i].w;
    per[i].push([jit, pool]);
  }
  courses.forEach((c, i) => per[i].forEach((m, k) => { v0.push(c.a, c.z, c.len, c.along); v1.push(c.v / (2 * c.len), (k + 0.7 * m[0]) / per[i].length, c.lane, m[1]); }));
  stats.vehicles = v0.length / 4; stats.courses = courses.length;
  if (stats.vehicles) {
    const A0 = new THREE.InstancedBufferAttribute(new Float32Array(v0), 4), A1 = new THREE.InstancedBufferAttribute(new Float32Array(v1), 4);
    const front = { value: new THREE.Color('#ffe2b0').multiplyScalar(4.0) }, rear = { value: new THREE.Color('#ff2a12').multiplyScalar(2.5) }, uViewH = { value: 450 }, size = new THREE.Vector2();
    const gb = carGeometry(); gb.setAttribute('aV0', A0); gb.setAttribute('aV1', A1); gb.instanceCount = stats.vehicles;
    add(gb, new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), { uBendK, uLifeT, uCarBody: { value: new THREE.Color(0.035, 0.035, 0.05) }, uCarFront: front, uCarRear: rear }),
      vertexShader: CAR_VERT, fragmentShader: CLOTH_FRAG, fog: true, side: THREE.DoubleSide }), 'closing-life-vehicles', 3, 18 * stats.vehicles);
    const gl = carLightGeometry(); gl.setAttribute('aV0', A0); gl.setAttribute('aV1', A1); gl.instanceCount = stats.vehicles;
    add(gl, new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), { uBendK, uLifeT, uViewH, uPoolC: { value: new THREE.Color('#ffd9a0').multiplyScalar(1.4) }, uCarFront: front, uCarRear: rear }),
      vertexShader: CARLIGHT_VERT, fragmentShader: CARLIGHT_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 'closing-life-carlights', 9, 6 * stats.vehicles)
      .onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); uViewH.value = rt ? rt.height : renderer.getDrawingBufferSize(size).y; };
  }
  await ctx.yield();

  // ---- THE SMOKE: by bands of z (six from z 20 to past the ring), two chimneys of the flat half, two of the
  // flank and two of the hanging half in each, by die from those 24 m and more off the flown line
  const S = stream('closing-life-smoke'), s0 = [], s1 = [], NB = 6, SZ0 = 20, SZ1 = 1240;                // (none before z 20: nothing of it stands behind the entry)
  const chims = (o.chimneys || []).map((c) => (c.a < 0 ? { a: c.x - PLAN.HX, h: c.y - PLAN.Y0, z: c.z, flat: true } : { a: c.a, h: c.top, z: c.z }))
    .filter((c) => c.z >= SZ0 && c.z < SZ1 && (c.flat ? c.a <= 0 && c.a > -110 : c.a >= 60 && c.a <= 596.5));
  await ctx.yield();
  // a plume's whole run (its longest and its shortest, its widest puff) stands 14 m and more off the flown line, 20 at its end
  const plumeClear = (c) => { for (const L of [12, 20]) for (let t = 0; t <= 1.001; t += 0.25) if (offWay(c.a - 0.15 * L * t * t, c.h + 0.66 * L * (1 - Math.exp(-2.4 * t)), c.z + 0.8 * L * t * (0.3 + 0.7 * t), 24) < 14 + 6 * t) return false; return true; };
  const free = [];
  for (let i = 0; i < chims.length; i++) { const c = chims[i]; c.d = offWay(c.a, c.h, c.z); if (c.d >= 24 && plumeClear(c)) free.push(c); if (i % 250 === 249) await ctx.yield(); }
  await ctx.yield();
  for (let b = 0; b < NB; b++) for (let half = 0; half < 3; half++) {
    const z0 = SZ0 + (SZ1 - SZ0) * b / NB, z1 = z0 + (SZ1 - SZ0) / NB;
    const all = free.filter((c) => c.z >= z0 && c.z < z1 && (half === 0 ? c.flat : half === 1 ? !c.flat && c.a < 266 : !c.flat && c.a >= 266));
    const near = all.filter((c) => c.d < 90), L = near.length >= 4 ? near : all;   // SEEN FROM THE WAY (design, on every seed): within 90 m of the flown line where a band has four such
    for (let k = 0; k < 2; k++) {
      const pick = S(), len = S.range(12, 20), ph = S(), size = S.range(1.45, 2.0) * (half ? 1.3 : 1), dice = []; for (let j = 0; j < 36; j++) dice.push(S());
      if (half || !L.length) continue;                        // THE LAST TOUCH: the flat town's plumes alone are made (the flank's and the hanging town's are OUT: every die is still drawn)
      const c = L.splice(Math.floor(pick * L.length), 1)[0]; stats.smoking++;
      for (let j = 0; j < 12; j++) { s0.push(c.a, c.h, c.z, len); s1.push(len / 1.1, ph + (j + 0.7 * dice[3 * j]) / 12, size * (0.8 + 0.4 * dice[3 * j + 1]), dice[3 * j + 2]); }
    }
  }
  if (stats.smoking) {
    const g = quadGeometry(); inst(g, 'aS0', s0, 4); inst(g, 'aS1', s1, 4); g.instanceCount = 12 * stats.smoking;
    const mat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), { uBendK, uLifeT, uSmWarm: { value: new THREE.Color('#c88a6a').multiplyScalar(0.9) }, uSmGrey: { value: new THREE.Color('#9a96b4').multiplyScalar(0.9) } }),
      vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, fog: true, transparent: true, depthWrite: false });
    add(g, mat, 'closing-life-smoke', 7, 24 * stats.smoking);
  }
  await ctx.yield();
  // ---- THE LAMPS' BREATH: the plan's street lamps of both halves and the promenade's bracket lanterns (the lattice), no bulb
  const Lp = stream('closing-life-lamps'), l0 = [], MOST = 2600, lamp = (a, h, z) => { const ph = TAU * Lp(); if (l0.length < 4 * MOST) l0.push(a, h, z, ph); };
  let brackets = 0;
  for (const l of plan.lamps || []) { if (l.kind === 'bracket') brackets++; if (l.kind !== 'bulb') lamp(Math.min(596.5, Math.max(0, l.a)), l.h, l.z); }
  for (const l of flat.lamps || []) { if (l.kind === 'bracket') brackets++; if (l.kind !== 'bulb' && l.x <= PLAN.HX) lamp(l.x - PLAN.HX, l.y - PLAN.Y0, l.z); }
  const lt = flat.lattice;
  if (lt && !brackets) for (let z = lt.z0 - lt.step * Math.floor((lt.z0 + 60) / lt.step); z <= (PLAN.TOWN_Z1 || PLAN.RING_Z - 10); z += lt.step) {
    if (!(lt.gapL && z > lt.gapL[0] && z < lt.gapL[1])) lamp(Math.max(0, lt.xL - PLAN.HX), lt.y - PLAN.Y0, z);
    lamp(lt.xR - PLAN.HX, lt.y - PLAN.Y0, z);
  }
  stats.lamps = l0.length / 4;
  if (stats.lamps) {
    const g = quadGeometry(); inst(g, 'aL0', l0, 4); g.instanceCount = stats.lamps;
    const uViewH = { value: 450 }, size = new THREE.Vector2();
    const mat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), { uBendK, uLifeT, uViewH, uHalo: { value: new THREE.Color('#ff8a3a').multiplyScalar(0.36 * 0.12) } }),   // 0 to 12 in 100 of a halo's radiance: 6 either way of its mean
      vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    add(g, mat, 'closing-life-lamps', 8, 2 * stats.lamps).onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); uViewH.value = rt ? rt.height : renderer.getDrawingBufferSize(size).y; };
  }
  await ctx.yield();

  // ---- THE CLOTH (one mesh, in the life frame): washing across side lanes between two house rows; awnings on the promenade's fronts
  const cp = [], cc = [], ck = [], ci = []; let cv = 0;
  const vert = (a, h, z, w, ph, kind, col) => { cp.push(a, h, z); ck.push(w, ph, kind); cc.push(col.r, col.g, col.b); return cv++; };
  const quad = (i0, i1, i2, i3) => ci.push(i0, i1, i2, i0, i2, i3);
  const LINEN = ['#d9d2c0', '#c9c2b2', '#b8c0c8', '#c4a58a', '#a9b39a', '#d8cfae'].map((c) => new THREE.Color(c));
  const CANVAS = ['#8c4a3a', '#b08a4a', '#5f7362', '#4f5d75', '#9a8f7a'].map((c) => new THREE.Color(c));
  const WASHING = 0;                                          // OUT (the small mend): a cloth with no line seen to hold it is not made
  const Wd = stream('closing-life-washing'), lanes = (plan.cross || []).filter((c) => !c.wide && c.aStart === 0 && c.z0 > 20 && c.z1 < 1150), blocks = plan.blocks || [];
  for (let tries = 0; tries < 12 && stats.washing < WASHING && lanes.length; tries++) {
    const pick = Wd(), da = Wd.range(2.5, 6.5), hh = Wd.range(4.6, 5.6), dice = []; for (let j = 0; j < 96; j++) dice.push(Wd());
    const c = lanes.splice(Math.floor(pick * lanes.length), 1)[0];
    const pair = blocks.filter((b) => Math.abs(b.z1 - c.z0) < 1.5 && b.a0 >= 5 && b.a0 < 120).map((bA) => [bA, blocks.find((bB) => Math.abs(bB.z0 - c.z1) < 1.5 && Math.abs(bB.a0 - bA.a0) < 1.5)]).find((p) => p[1]);
    if (!pair) continue;
    const a0 = Math.max(pair[0].a0, pair[1].a0) + da;
    if (offWay(a0, hh, (c.z0 + c.z1) / 2) < 12) continue;
    stats.washing++;
    for (let line = 0; line < 2; line++) {
      const a = a0 + 2.4 * line; let z = c.z0 + 0.25;
      for (let d = 48 * line; d < 48 * line + 48 && z < c.z1 - 0.9; d += 4) {
        const w = Math.min(0.55 + 0.6 * dice[d], c.z1 - 0.25 - z), H = 0.7 + 0.7 * dice[d + 1], col = LINEN[Math.floor(dice[d + 2] * LINEN.length)], ph = TAU * dice[d + 3], row = [];
        for (let r = 0; r < 3; r++) row.push(vert(a, hh - r * H / 2, z, r / 2, ph, 0, col), vert(a, hh - r * H / 2, z + w, r / 2, ph + 0.5, 0, col));
        quad(row[0], row[1], row[3], row[2]); quad(row[2], row[3], row[5], row[4]);
        z += w + 0.06 + 0.2 * dice[d + 3];
      }
    }
  }
  const AWNINGS = 0;                                          // NOT MADE in this update: both rows of the promenade are arcaded (an awning wants a plain shop front)
  const Aw = stream('closing-life-awnings'), used = new Set(), bays = lt ? Math.floor((1150 - lt.z0) / lt.step) : 0;
  for (let k = 0; k < 40 && stats.awnings < AWNINGS && bays > 0; k++) {
    const i = Math.floor(Aw() * bays), left = Aw() < 0.5, w = Aw.range(3.2, 4.6), col = CANVAS[Math.floor(Aw() * CANVAS.length)], ph = TAU * Aw();
    const zc = lt.z0 + (i + 0.5) * lt.step, z0 = zc - w / 2, z1 = zc + w / 2, key = (left ? 'L' : 'R') + i, aw = left ? 5.95 : -33.95, out = left ? -1.6 : 1.6;
    const fronts = (left ? blocks : flat.blocks || []).some((b) => b.zone === 'promenade' && b.z0 + 0.8 <= z0 && b.z1 - 0.8 >= z1);
    if (used.has(key) || !fronts || offWay(aw + out, 2.9, zc) < 6) continue;
    used.add(key); stats.awnings++;
    const t0 = vert(aw, 3.5, z0, 0, ph, 1, col), t1 = vert(aw, 3.5, z1, 0, ph, 1, col), e0 = vert(aw + out, 2.9, z0, 0.5, ph, 1, col), e1 = vert(aw + out, 2.9, z1, 0.5, ph + 0.6, 1, col);
    const v0 = vert(aw + out, 2.55, z0, 1, ph, 1, col), v1 = vert(aw + out, 2.55, z1, 1, ph + 0.6, 1, col);
    quad(t0, t1, e1, e0); quad(e0, e1, v1, v0);
  }
  if (cv) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cp), 3)); g.setAttribute('aCl', new THREE.BufferAttribute(new Float32Array(ck), 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(cc), 3)); g.setIndex(ci);
    const mat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), { uBendK, uLifeT, uClothL: { value: new THREE.Vector3(0.34, 0.31, 0.33) } }), vertexShader: CLOTH_VERT, fragmentShader: CLOTH_FRAG, fog: true, side: THREE.DoubleSide });
    add(g, mat, 'closing-life-cloth', 3, ci.length / 3);
  }
  await ctx.yield();
  return {
    group, stats,
    update(dt, time) { uLifeT.value = time; },                 // the world's clock alone: one uniform
    dispose() { for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); },
  };
}
