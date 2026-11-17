// THE HERD AS MOVING ARCHITECTURE - hero set piece for the world "sauropod-ford".
//
// A migrating column of sauropods fording a river: ~30 whip-tailed diplodocids and 8 brachiosaurs walking
// north in two loose files, 12 juveniles trotting in the shallows between them, the tall matriarch at the
// head of the column, and beyond her, on the last gravel bar, two feeding brachiosaurs standing in profile
// with their necks crossed 15.5 m up into a pointed arch for the exit portal. Every animal is posed in the
// vertex shader: a slow lateral-sequence walk with two-bone legs solved to a foot target that is planted
// for 3/4 of the 4.4 s cycle and is EXACTLY still on the riverbed while the body rolls over it (stance
// travel = speed x duty x period, straight track), swinging necks, travelling whip-tail waves, body bob.
// Each footfall throws a 3 m spray crown, each lift pours water off the foot, bellies shed drips, every
// standing leg cuts a V wake, heads steam into the sun, and the matriarch's amber eye tracks the camera.
//
// LOCAL SPACE  origin = riverbed level at the middle of the ford, +Y up. The herd walks toward +Z ("front");
//   the camera of the brief follows it from -Z to +Z, so the sun (east, on the camera's right) is at -X and
//   the river runs toward -X. y = 0 is the riverbed/gravel, the water surface is y = waterY (1.2).
// SIZE   column ~300 m long (z -205..+95 at herd time 0, it advances 1.1 m/s x herdTime), 26 m wide;
//   the arch pair stands at z = +244, the portal seat at z = +262. True extent (anchors.extent): radius 240
//   about (0,5,30); hero.radius/center are a closer orbit of the front half of the column for the part
//   viewer (opts.focus = 'head'|'under'|'arch' picks other close views). Height 17 (arch heads ~17.5 m, matriarch's head 15 m, brachiosaurs 14 m, diplodocid backs 5 m).
// COST   ~142k triangles, 6 draw calls (diplodocids, brachiosaurs, juveniles, one sprite draw for spray/
//   pours/drips/steam/mist curls, wakes, optional water sheet), no lights, no textures, ~130 ms build.
// LIGHT  Hides are MeshStandardMaterial (vertex colour + procedural folds, wet line, rim) and take the
//   scene's lights and fog: give them a low warm DirectionalLight from -X (~22 deg up, intensity ~3) and a
//   blue-green HemisphereLight (~0.8). Sprites/wakes/water are custom shaders (linear HDR, scene fog) lit
//   by uniforms: on its first update the piece adopts the direction and colour of the scene's first
//   DirectionalLight unless opts.sunDir is given (or call hero.setLight). A river mist (analytic
//   exponential height fog from the water surface, pearl, brighter toward the sun) is built into every
//   material here: hero.uniforms.uMist = (worldBaseY, scaleHeight 3, density 0.03, -) and uMistCol; use
//   the same formula (MIST_GLSL below) in the world's river/terrain/flora so everything sits in one mist,
//   or set opts.mist = 0 and do your own.
//   Inside dense mist (uMist.z above ~0.02) the hides drop toward silhouette with a warm rim on the sun side and a gold
//   edge when seen against the sun, and hold their dark through the near mist; the world drives uMist.z along the path.
//   opts.headZ (default 85) is the z of the matriarch's body at herd time 0.
//
// OPTS   palette   7 hex strings, brief order: pearl, fern, deep fern, river, hide, sun cream, rust accent
//        count     walking adults (28-50, default 38 +- seed)      juveniles (default 12)
//        length    column length in metres (default 300)           cast: 'mixed' | 'brachio'
//        sunDir    [x,y,z] local direction TOWARD the sun (default: adopt the scene's light)
//        heightAt  (z) => riverbed height along the track (local y; default 0 everywhere). Feet plant on
//                  it, bodies ride its smoothed value, spray/wakes appear only where it is under water.
//        waterY    water surface height (default 1.2)              water: false to omit the built-in sheet
//        mist      0..2 mist density multiplier (default 1)        arch: false to omit the feeding pair
//        archZ     z of the arch pair (default 244)
// HERO API (besides the contract)
//   hero.setProgress(u)    THE HERD CLOCK: herdTime = u x opts.duration (40 s). Every gait phase, spray
//                          crown, tail and the matriarch's blink (at u ~0.745-0.775) hang off it. If never
//                          called the herd free-runs on the time passed to update().
//   hero.setHerdTime(s)    same clock in seconds.          hero.setBlink(x) 0..1 overrides the blink.
//   hero.clearance(x,y,z,herdTime) -> metres to the nearest leg/belly/neck/tail capsule (CPU mirror of
//                          the shader gait): author the slalom against it (brief: assert >= 1.8 m).
//   hero.feet(herdTime) -> Float32Array [x,y,z,planted, ...] of every adult foot (for river-shader wakes).
//   hero.matriarchHead(herdTime) -> Vector3 (local) of her eye-level head centre; hero.animals (layout).
//   hero.setLight({ sunDir, sunColor }), hero.uniforms, hero.stats.
//   opts.bull = { x, z, scale, yaw } adds a standing bull diplodocid; hero.setRear(0..1) rears it onto hind legs and tail.
// ANCHORS (local space; the moving ones are given at the herd time the brief reaches them)
//   portalSeat   { position [0,7,262], facing [0,0,-1], radius 7 }: lowest edge on the gravel (y 0).
//   arch         { position [0,15.5,archZ], openingWidth, openingHeight }: where the two throats cross.
//   flyThrough   ordered points: skim in, the centre lane between the files at y 3.8 (2.6 m over water),
//                the climb up the matriarch's west (+X) side, level with her head 4 m off, the glide down
//                to 7.6 m, straight under the crossed necks to the portal. The centre lane is the legal
//                corridor (>= 2.5 m from hides); only the last 110 m is clear by >= 6 m. Weave from it and
//                check with hero.clearance().
//   matriarch    { head (at herdTime 29.6), eyeSide [1,0,0], z0, x }   viewpoints { skim, under, head, arch }
//   brachiosaurs [{x, z0, scale}] the three mid-column ones to pass under crosswise; waterY; sunDir.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#DCE7E2', '#4F7C46', '#213F2C', '#5C8A96', '#7D766A', '#FFE8B5', '#D9652B'];
const SPEED = 1.1, PERIOD = 4.4, DUTY = 0.75, NBED = 64;
const LEG_OFF = [0, 0.25, 0.5, 0.75]; // LH, LF, RH, RF: lateral sequence walk

// ------------------------------------------------------------------------------------------------ GLSL
export const MIST_GLSL = /* glsl */`
uniform vec4 uMist; uniform vec3 uMistCol; uniform vec3 uSunDirW;
vec3 applyMist(vec3 col, vec3 wp){
  vec3 d = wp - cameraPosition; float L = length(d);
  float ya = max(cameraPosition.y - uMist.x, 0.), yb = max(wp.y - uMist.x, 0.);
  float ea = exp(-ya / uMist.y), eb = exp(-yb / uMist.y), dy = yb - ya;
  float od = uMist.z * L * (abs(dy) > 0.02 ? uMist.y * (ea - eb) / dy : ea);
  float cs = dot(d / max(L, 1e-3), uSunDirW), fw = max(cs, 0.);
  vec3 mc = uMistCol * (0.5 + 0.3 * (cs * 0.5 + 0.5) + 0.2 * fw + 0.6 * fw * fw * fw);
  return mix(mc, col, exp(-max(od, 0.)));
}`;

// gait shared by the hide, the sprites and the wakes
const GAIT_GLSL = /* glsl */`
uniform float uTime; uniform vec4 uGait; // speed, period, duty, z offset of the walkers (m)
uniform float uBed[${NBED}]; uniform vec2 uBedR; uniform float uWaterY;
float bedAt(float z){ float f = clamp((z - uBedR.x) * uBedR.y, 0., ${NBED - 1.001}); int i = int(f); return mix(uBed[i], uBed[i + 1], f - float(i)); }
// small animals wade: their footing never lies deeper than belly height under the surface
float bedS(float z, float sc){ return max(bedAt(z), uWaterY - 3.2 * sc); }
float baseAt(float z, float sc){ return (bedS(z - 4., sc) + bedS(z, sc) + bedS(z + 4., sc)) / 3.; }
float legOff(float k){ return k * 0.25; }
// x: foot offset along the body (rest units), y: lift 0..1, z: phase
vec3 footCycle(float phase, float rate, float walk, float scale, float k){
  float ph = fract(uTime / uGait.y * rate * walk + phase + legOff(k));
  float S = uGait.x * uGait.z * uGait.y / rate / scale, fz, lift = 0.;
  if (ph < uGait.z) fz = S * (0.5 - ph / uGait.z);
  else { float s = (ph - uGait.z) / (1. - uGait.z); fz = S * (-0.5 + s * s * (3. - 2. * s)); lift = sin(3.14159 * s); }
  return vec3(fz * walk, lift * walk, ph);
}
vec2 rotY(vec2 xz, float a){ float c = cos(a), s = sin(a); return vec2(xz.x * c + xz.y * s, -xz.x * s + xz.y * c); }
`;

// rig: needs attributes aRig (part, t), iA (x, z0, yaw, scale), iB (gait phase, neck phase, tail phase, tint),
// iC (neck pitch, neck length, walk, step rate), iD (neck sway amp, neck yaw lean, tail amp, lift m)
const RIG_GLSL = /* glsl */`
attribute vec2 aRig; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD;
uniform float uRear; uniform vec3 uHip[4]; uniform vec3 uNeckB; uniform vec4 uNeckA; uniform vec4 uTail; // tail: base y, base z, length, -
varying vec3 vWPos; varying vec3 vRest; varying vec4 vInfo; varying vec3 vCamL;
vec3 rigP; vec3 rigN;
vec3 neckPose(vec3 p, float t, inout vec3 n){
  vec3 A = vec3(0., uNeckA.y, uNeckA.z); float Ln = uNeckA.w;
  vec3 q = p - uNeckB + A * (iC.y - 1.) * Ln * t;
  float ang = (iC.x + 0.05 * sin(uTime * 0.23 + iB.y * 9.)) * smoothstep(0., 0.6, t);
  float c = cos(ang), s = sin(ang);
  q = vec3(q.x, q.y * c + q.z * s, q.z * c - q.y * s);
  n = vec3(n.x, n.y * c + n.z * s, n.z * c - n.y * s);
  float sw = iD.x * sin(uTime * 0.31 + iB.y * 6.2832) + iD.y;
  q.x += sw * Ln * iC.y * t * t;
  n = normalize(n - A * (2. * sw * t) * n.x);
  return q + uNeckB;
}
vec3 tailPose(vec3 p, float t, inout vec3 n){
  float w = uTime * 0.85 * (0.4 + 0.6 * iC.z) - 4.2 * t + iB.z * 6.2832;
  float a = iD.z * uTail.z * 0.16 * pow(t, 1.5);
  p.x += a * sin(w); p.y += 0.25 * a * sin(w * 0.7 + 1.3) + 0.35 * a;
  float m = iD.z * uTail.z * 0.16 * (1.5 * sqrt(t) * sin(w) - 4.2 * pow(t, 1.5) * cos(w)) / uTail.z;
  n = normalize(n + vec3(0., 0., 1.) * m * n.x);
  return p;
}
void rig(vec3 p, vec3 n){
  float part = aRig.x, t = aRig.y, sc = iA.w, walk = iC.z, rate = iC.w;
  float zc = iA.y + (uGait.x * uTime + uGait.w) * walk;
  float base = baseAt(zc, sc);
  float ph0 = uTime / uGait.y * rate * walk + iB.x;
  float bob = 0.045 * sin(12.566 * ph0 + 0.6) * walk;
  float sway = 0.11 * sin(6.2832 * ph0 + 1.2) * walk;
  if (part > 2.5 && part < 6.5) {
    float k = part - 3.; vec3 hip = uHip[int(k)];
    vec3 fc = footCycle(iB.x, rate, walk, sc, k);
    float cy = cos(iA.z);
    float footY = (bedS(zc + (hip.z + fc.x) * sc * cy, sc) - base) / sc + fc.y * iD.w / sc;
    vec2 H = vec2(hip.z + 0.4 * fc.x, hip.y + bob);          // (z, y)
    vec2 d = vec2(hip.z + fc.x, footY) - H;
    float L1 = 0.5 * max(hip.y * 0.995, length(d) * 1.0005);  // column-straight in stance (<3% telescoping), knee folds in swing
    float D = min(length(d), 2. * L1 * 0.9995);
    float th = atan(d.x, max(-d.y, 0.01));
    float al = acos(clamp(D / (2. * L1), -1., 1.)) * (hip.z > 0. ? -1. : 1.);
    float a1 = th + al, a2 = th - al;
    float tt = clamp((hip.y - p.y) / hip.y, 0., 1.), dy0 = max(p.y - hip.y, 0.);
    float u1 = min(tt, 0.5) * 2., u2 = max(tt - 0.5, 0.) * 2.;
    vec2 b = H + L1 * u1 * vec2(sin(a1), -cos(a1)) + L1 * u2 * vec2(sin(a2), -cos(a2));
    float a = mix(a1, a2, smoothstep(0.36, 0.64, tt)) * (1. - smoothstep(0.86, 0.97, tt)) * smoothstep(0., 0.12, tt);
    float ca = cos(a), sa = sin(a), oz = p.z - hip.z;
    p = vec3(p.x + sway * (1. - tt), b.y + oz * sa + dy0, b.x + oz * ca);
    n = vec3(n.x, n.y * ca + n.z * sa, n.z * ca - n.y * sa);
  } else {
    if (part > 0.5 && part < 1.5) p = neckPose(p, t, n);
    else if (part > 1.5 && part < 2.5) p = tailPose(p, t, n);
    else if (part > 6.5) p = neckPose(p, 1., n);
    p.y += bob; p.x += sway;
  }
  if (iC.w > 6.5 && uRear > 0.001) {            // the rearing bull (opts.bull): everything but hind legs and tail pivots on the hips
    float w = 1.;
    if (part > 2.5 && part < 6.5) { float k = part - 3.; if (k < 0.5 || (k > 1.5 && k < 2.5)) w = 1. - smoothstep(0.02, 0.4, clamp((uHip[0].y - position.y) / uHip[0].y, 0., 1.)); }
    else if (part > 1.5 && part < 2.5) w = 1. - smoothstep(0., 0.3, t);
    float ra = uRear * 0.98 * w, rc = cos(ra), rs = sin(ra);
    vec2 pv = vec2(uHip[0].z, uHip[0].y);
    vec2 dq = vec2(p.z, p.y) - pv;
    p.z = pv.x + rc * dq.x - rs * dq.y; p.y = pv.y + rs * dq.x + rc * dq.y - 0.5 * uRear * w;
    n = vec3(n.x, rs * n.z + rc * n.y, rc * n.z - rs * n.y);
    if (w > 0.5 && part > 2.5 && part < 6.5) { float tt2 = clamp((uHip[1].y - position.y) / uHip[1].y, 0., 1.); p.z -= uRear * 1.6 * tt2 * tt2 * rc; p.y += uRear * 1.6 * tt2 * tt2 * rs * 0.6; }
  }
  vec2 xz = rotY(p.xz * sc, iA.z); vec2 nxz = rotY(n.xz, iA.z);
  rigP = vec3(xz.x + iA.x, p.y * sc + base, xz.y + zc);
  rigN = vec3(nxz.x, n.y, nxz.y);
}`;

// -------------------------------------------------------------------------------------------- geometry
// species: profile keys along the spine [z, y, halfWidth, topRadius, bottomRadius] from tail tip to snout
const DIPLO = {
  name: 'diplo', radial: 14, step: 0.62, headStep: 0.2, headZ: 11.4,
  keys: [[-17.6, 3.0, .03, .03, .03], [-15.5, 3.02, .05, .05, .05], [-13, 3.1, .09, .09, .09], [-10, 3.3, .19, .21, .19], [-7, 3.68, .4, .46, .4],
    [-4.6, 4.12, .78, .8, .72], [-2.6, 4.45, 1.2, .86, .86], [-0.5, 4.5, 1.46, .8, .95], [1.6, 4.4, 1.36, .76, .86], [3.0, 4.32, 1.02, .7, .76],
    [4.4, 4.42, .6, .56, .56], [6.5, 4.7, .42, .42, .42], [9, 5.0, .33, .34, .33], [11, 5.2, .26, .27, .26], [11.6, 5.25, .23, .23, .2],
    [12.1, 5.27, .27, .2, .17], [12.65, 5.17, .23, .12, .12], [12.98, 5.1, .13, .06, .06]],
  hips: [[1.0, 4.3, -2.5], [0.86, 3.9, 2.6], [-1.0, 4.3, -2.5], [-0.86, 3.9, 2.6]], legR: [0.58, 0.46],
  neckB: [0, 4.36, 3.7], neckEnd: [0, 5.25, 11.6], tailZ: -3.6, tailLen: 14, tailY: 4.3,
  eye: [0.2, 5.33, 12.0], eyeR: 0.06, crest: [0, 5.5, 12.3], spines: true, lift: 1.25,
  belly: [4.5, 0.95, 1.45, -2.6, 3.0],
};
const BRACHIO = {
  name: 'brachio', radial: 16, step: 0.56, headStep: 0.13, headZ: 8.4,
  keys: [[-10.6, 3.5, .04, .04, .04], [-9.3, 3.8, .1, .1, .1], [-7.8, 4.3, .22, .24, .22], [-6, 5.05, .46, .52, .46], [-4.6, 5.9, .92, .9, .82],
    [-3.2, 6.6, 1.5, 1.05, 1.0], [-0.5, 6.9, 1.78, 1.28, 1.3], [2.0, 7.2, 1.68, 1.4, 1.5], [3.6, 7.65, 1.32, 1.28, 1.3], [4.9, 8.55, 1.0, 1.0, .94],
    [6.3, 9.8, .74, .74, .74], [7.25, 11.35, .56, .55, .57], [7.9, 12.85, .42, .41, .43], [8.4, 13.62, .35, .35, .35], [8.8, 13.95, .36, .36, .3],
    [9.15, 14.02, .38, .4, .32], [9.5, 14.02, .36, .62, .33], [9.8, 13.98, .34, .7, .33], [10.1, 13.86, .35, .36, .32], [10.4, 13.76, .36, .24, .3], [10.62, 13.7, .33, .2, .26], [10.74, 13.68, .2, .1, .14]],
  hips: [[1.2, 6.05, -3.25], [1.15, 6.7, 3.25], [-1.2, 6.05, -3.25], [-1.15, 6.7, 3.25]], legR: [0.64, 0.58],
  neckB: [0, 8.3, 4.4], neckEnd: [0, 13.75, 8.55], tailZ: -4.2, tailLen: 6.4, tailY: 5.9,
  eye: [0.33, 14.02, 9.2], eyeR: 0.1, crest: [0, 14.75, 9.8], spines: false, lift: 1.45,
  belly: [6.9, 1.3, 1.76, -3.2, 3.6],
};

function catmull(a, b, c, d, t) { const t2 = t * t, t3 = t2 * t; return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3); }

function makeBuilder() {
  const P = [], C = [], R = [], I = [];
  return {
    P, C, R, I,
    v(x, y, z, r, g, b, part, t) { P.push(x, y, z); C.push(r, g, b); R.push(part, t); return P.length / 3 - 1; },
    tri(a, b, c) { I.push(a, b, c); },
    finish() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aRig', new THREE.Float32BufferAttribute(R, 2));
      g.setIndex(I); g.computeVertexNormals();
      return g;
    },
  };
}

// lod 1 = adult, lod < 1 = juvenile (fewer rings and sides)
async function buildSauropod(S, lod, noise, pal, variant, yieldFn) {
  const B = makeBuilder();
  const hide = pal.hide, dark = pal.dark, pale = pal.pale;
  const NB = S.neckB, NE = S.neckEnd;
  const nLen = Math.hypot(NE[1] - NB[1], NE[2] - NB[2]), nA = [0, (NE[1] - NB[1]) / nLen, (NE[2] - NB[2]) / nLen];
  S.neckLen = nLen; S.neckAxis = nA;
  const partOf = (y, z) => {
    const tn = ((y - NB[1]) * nA[1] + (z - NB[2]) * nA[2]) / nLen;
    if (tn > 0) return [1, Math.min(tn, 1)];
    const tt = (S.tailZ - z) / S.tailLen;
    if (tt > 0) return [2, Math.min(tt, 1)];
    return [0, 0];
  };
  // ---- rings along the spine
  const K = S.keys, rings = [];
  for (let i = 0; i < K.length - 1; i++) {
    const a = K[Math.max(i - 1, 0)], b = K[i], c = K[i + 1], d = K[Math.min(i + 2, K.length - 1)];
    const len = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const st = (b[0] >= S.headZ ? S.headStep : S.step) / lod * (lod >= 1 && c[0] <= S.tailZ - 1 ? 1.7 : 1);   // the whip of the tail needs fewer rings
    const n = Math.max(1, Math.round(len / st));
    for (let j = 0; j < n; j++) { const t = j / n; rings.push([0, 1, 2, 3, 4].map((q) => catmull(a[q], b[q], c[q], d[q], t))); }
  }
  rings.push(K[K.length - 1].slice());
  const rad = Math.max(8, Math.round(S.radial * (lod < 1 ? 0.6 : 1)));
  const col = new THREE.Color(), tmp = new THREE.Color();
  const hideCol = (x, y, z, up, belly) => { // up: -1 belly .. 1 spine
    const m = noise.fbm3(x * 0.45 + variant * 7, y * 0.45, z * 0.22, 3);
    const blotch = smoothstep(0.1, 0.5, noise.n3(x * 0.9, y * 0.9 + variant * 3, z * 0.35));
    col.copy(hide).multiplyScalar(0.92 + 0.22 * m);
    col.lerp(dark, clamp(smoothstep(0.05, 0.9, up) * 0.82 + blotch * 0.2 * smoothstep(-0.3, 0.5, up), 0, 0.9));
    col.lerp(pale, smoothstep(-0.15, -0.85, up) * Math.min(1, belly * 1.45));
    return col;
  };
  const ringStart = [];
  for (let j = 0; j < rings.length; j++) {
    const r = rings[j], p = rings[Math.max(j - 1, 0)], q = rings[Math.min(j + 1, rings.length - 1)];
    let ty = q[1] - p[1], tz = q[0] - p[0]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
    const uy = tz, uz = -ty; // ring "up" in the y-z plane
    ringStart.push(B.P.length / 3);
    const isHead = r[0] >= S.headZ;
    for (let a = 0; a < rad; a++) {
      const ang = (a / rad) * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
      // squarer back, hanging belly, skin-fold breakup on the torso
      let wx = r[2] * Math.sign(c) * Math.pow(Math.abs(c), 0.85), h = (s > 0 ? r[3] : r[4]) * Math.sign(s) * Math.pow(Math.abs(s), 0.9);
      const lump = isHead ? 0 : 0.035 * noise.n3(r[0] * 0.9, ang * 1.5, variant * 5) * Math.min(1, r[2] * 1.4);
      wx *= 1 + lump; h *= 1 + lump;
      const x = wx, y = r[1] + h * uy, z = r[0] + h * uz;
      const [part, t] = partOf(r[1], r[0]);
      hideCol(x, y, z, isHead ? s * 0.45 - 0.1 : part === 1 ? s * (1 - 0.35 * t) : s, part === 1 ? 0.75 : 0.5);
      if (isHead) { // mouth line and darker muzzle
        const mouth = Math.exp(-Math.pow((s + 0.42) / 0.11, 2)) * smoothstep(S.headZ + 0.25, S.headZ + 0.6, r[0]);
        col.multiplyScalar(1 - 0.6 * mouth);
        if (!S.spines) col.multiplyScalar(1 - 0.75 * Math.exp(-Math.pow((r[0] - S.headZ - 1.42) / 0.1, 2) - Math.pow((s - 0.8) / 0.16, 2)));
      }
      if (part === 2) col.multiplyScalar(0.86 + 0.14 * Math.sin(r[0] * 2.2)); // faint tail bands
      B.v(x, y, z, col.r, col.g, col.b, part, t);
    }
  }
  for (let j = 0; j < rings.length - 1; j++) for (let a = 0; a < rad; a++) {
    const a1 = (a + 1) % rad, p0 = ringStart[j] + a, p1 = ringStart[j] + a1, q0 = ringStart[j + 1] + a, q1 = ringStart[j + 1] + a1;
    B.tri(p0, q1, q0); B.tri(p0, p1, q1);
  }
  if (yieldFn) await yieldFn();
  { // end caps
    const f = rings[0], l = rings[rings.length - 1];
    hideCol(0, f[1], f[0], 0, 0); const c0 = B.v(0, f[1], f[0] - 0.05, col.r, col.g, col.b, 2, 1);
    col.copy(dark); const c1 = B.v(0, l[1] - 0.01, l[0] + 0.06, col.r * 0.6, col.g * 0.6, col.b * 0.6, 1, 1);
    const e = ringStart[rings.length - 1];
    for (let a = 0; a < rad; a++) { const a1 = (a + 1) % rad; B.tri(c0, ringStart[0] + a, ringStart[0] + a1); B.tri(c1, e + a1, e + a); }
  }
  // ---- legs: limbs with a haunch/shoulder bulge that domes shut inside the torso, a knee, a lean shank, a flared foot pad and claws
  const lr = lod < 1 ? 8 : 12, lrings = lod < 1 ? 7 : 10;
  for (let k = 0; k < 4; k++) {
    const hip = S.hips[k], fore = hip[2] > 0, r0 = S.legR[fore ? 1 : 0], rise = fore ? 1.0 : 0.85, top = hip[1] + rise;
    const start = [];
    for (let j = 0; j <= lrings; j++) {
      const f = j / lrings, y = top * (1 - Math.pow(f, 0.92)), t = clamp((hip[1] - y) / hip[1], 0, 1), up = clamp((y - hip[1]) / rise, 0, 1);
      let r = r0 * (1.14 - 0.31 * smoothstep(0, 0.42, t) - 0.15 * smoothstep(0.52, 0.78, t) + 0.42 * smoothstep(0.84, 0.96, t));
      r *= 1 + 0.12 * Math.exp(-Math.pow((t - 0.5) / 0.06, 2));
      if (j === lrings) r *= 0.9;
      const dome = Math.sqrt(1 - 0.86 * up * up), cx = hip[0] * (1 - 0.42 * up * up);
      const rz = r * (1 + (fore ? 0.14 : 0.3) * (1 - smoothstep(0, 0.45, t)));
      start.push(B.P.length / 3);
      for (let a = 0; a < lr; a++) {
        const ang = (a / lr) * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
        const fold = 1 + 0.035 * noise.n3(ang * 2 + k * 9, y * 1.6, variant);
        const x = cx + c * r * dome * fold, z = hip[2] + s * rz * dome * fold + (fore ? -0.12 : 0.1) * (1 - t) + (fore ? 0.07 : -0.06) * Math.exp(-Math.pow((t - 0.5) / 0.1, 2));
        hideCol(x * 2, y, z, 0.25 - 0.5 * t, 0.3);
        col.multiplyScalar(0.92 - 0.25 * smoothstep(0.8, 1, t) - 0.18 * (1 - smoothstep(0, 0.2, t)));
        B.v(x, y, z, col.r, col.g, col.b, 3 + k, t);
      }
    }
    for (let j = 0; j < lrings; j++) for (let a = 0; a < lr; a++) {
      const a1 = (a + 1) % lr, p0 = start[j] + a, p1 = start[j] + a1, q0 = start[j + 1] + a, q1 = start[j + 1] + a1;
      B.tri(p0, q1, q0); B.tri(p0, p1, q1);
    }
    const cc = B.v(hip[0], 0, hip[2], dark.r * 0.5, dark.g * 0.5, dark.b * 0.5, 3 + k, 1);
    for (let a = 0; a < lr; a++) B.tri(cc, start[lrings] + a, start[lrings] + (a + 1) % lr);
    if (lod >= 1) for (let c = -1; c <= 1; c++) { // three blunt claws on the front of each foot
      const cx = hip[0] + c * r0 * 0.55, cz = hip[2] + r0 * (1.02 - 0.12 * Math.abs(c)), w = r0 * 0.2;
      tmp.copy(pale).multiplyScalar(0.55);
      const b0 = B.v(cx - w, 0.02, cz - 0.1, tmp.r, tmp.g, tmp.b, 3 + k, 1), b1 = B.v(cx + w, 0.02, cz - 0.1, tmp.r, tmp.g, tmp.b, 3 + k, 1);
      const b2 = B.v(cx, 0.36, cz - 0.14, tmp.r, tmp.g, tmp.b, 3 + k, 1), b3 = B.v(cx + c * 0.05, 0.03, cz + 0.26, tmp.r, tmp.g, tmp.b, 3 + k, 1);
      B.tri(b0, b3, b2); B.tri(b3, b1, b2); B.tri(b0, b1, b3);
    }
  }
  if (yieldFn) await yieldFn();
  // ---- dorsal spines (diplodocid) / eyes with lids
  const spineY = (z) => { for (let j = 0; j < rings.length - 1; j++) if (rings[j + 1][0] >= z) { const f = (z - rings[j][0]) / Math.max(rings[j + 1][0] - rings[j][0], 1e-4); return lerp(rings[j][1] + rings[j][3], rings[j + 1][1] + rings[j + 1][3], f); } return 0; };
  if (S.spines && lod >= 1) for (let z = -12; z < 10.6; z += 0.52) {
    const y = spineY(z) - 0.03, hgt = 0.1 + 0.13 * smoothstep(-12, -3, z) * (1 - 0.55 * smoothstep(3, 10, z)), w = 0.07 + hgt * 0.22;
    const [part, t] = partOf(y - 0.3, z); tmp.copy(dark).multiplyScalar(0.8);
    const y0 = spineY(z - 0.22) - 0.04, y1 = spineY(z + 0.22) - 0.04;
    const a = B.v(-w, y - 0.03, z, tmp.r, tmp.g, tmp.b, part, t), b = B.v(w, y - 0.03, z, tmp.r, tmp.g, tmp.b, part, t);
    const c = B.v(0, y0, z - 0.22, tmp.r, tmp.g, tmp.b, part, t), d = B.v(0, y1, z + 0.22, tmp.r, tmp.g, tmp.b, part, t);
    const e = B.v(0, y + hgt, z - 0.08, tmp.r * 1.5, tmp.g * 1.5, tmp.b * 1.5, part, t);
    B.tri(c, e, a); B.tri(a, e, d); B.tri(d, e, b); B.tri(b, e, c);
  }
  for (let sgn = -1; sgn <= 1; sgn += 2) {
    const E = S.eye, r = S.eyeR, ex = E[0] * sgn, seg = lod < 1 ? 5 : 10, st = [];
    for (let j = 0; j <= seg; j++) { // eye ball: part 7, colour carries the unit direction from its centre
      const th = (j / seg) * Math.PI; st.push(B.P.length / 3);
      for (let a = 0; a < seg; a++) {
        const ph = (a / seg) * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th) * Math.cos(ph), dz = Math.sin(th) * Math.sin(ph);
        B.v(ex + sgn * dx * r * 0.8, E[1] + dy * r, E[2] + dz * r, sgn * dx * 0.5 + 0.5, dy * 0.5 + 0.5, dz * 0.5 + 0.5, 7, 1);
      }
    }
    for (let j = 0; j < seg; j++) for (let a = 0; a < seg; a++) {
      const a1 = (a + 1) % seg, p0 = st[j] + a, p1 = st[j] + a1, q0 = st[j + 1] + a, q1 = st[j + 1] + a1;
      if (sgn > 0) { B.tri(p0, q0, q1); B.tri(p0, q1, p1); } else { B.tri(p0, q1, q0); B.tri(p0, p1, q1); }
    }
    if (lod >= 1) { // brow and lower lid: a wrinkled ring of hide round the eye
      const n = 12, m = 5, s0 = [];
      for (let j = 0; j < n; j++) {
        const ph = (j / n) * Math.PI * 2, cy = Math.cos(ph), cz = Math.sin(ph); s0.push(B.P.length / 3);
        const thick = r * (0.36 + 0.2 * Math.max(cy, 0));
        for (let a = 0; a < m; a++) {
          const q = (a / m) * Math.PI * 2, rr = r * 1.12 + Math.cos(q) * thick, out = Math.sin(q) * thick + r * 0.3;
          hideCol(ex, E[1] + cy * rr, E[2] + cz * rr, 0.5, 0); col.multiplyScalar(0.8);
          B.v(ex + sgn * out, E[1] + cy * rr, E[2] + cz * rr, col.r, col.g, col.b, 1, 1);
        }
      }
      for (let j = 0; j < n; j++) for (let a = 0; a < m; a++) {
        const j1 = (j + 1) % n, a1 = (a + 1) % m, p0 = s0[j] + a, p1 = s0[j] + a1, q0 = s0[j1] + a, q1 = s0[j1] + a1;
        if (sgn > 0) { B.tri(p0, q1, q0); B.tri(p0, p1, q1); } else { B.tri(p0, q0, q1); B.tri(p0, q1, p1); }
      }
    }
  }
  if (yieldFn) await yieldFn();
  const g = B.finish();
  g.userData.triangles = B.I.length / 3;
  return g;
}

// ------------------------------------------------------------------------------------------- materials
const NOISE_GLSL = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }`;

function makeHideMaterial(S, U, pal) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide });
  const own = {
    uHip: { value: S.hips.map((h) => new THREE.Vector3(h[0], h[1], h[2])) },
    uNeckB: { value: new THREE.Vector3().fromArray(S.neckB) },
    uNeckA: { value: new THREE.Vector4(0, S.neckAxis[1], S.neckAxis[2], S.neckLen) },
    uTail: { value: new THREE.Vector4(S.tailY, S.tailZ, S.tailLen, 0) },
    uBlink: { value: 0 }, uRear: { value: 0 },
    uIris: { value: pal.iris.clone() },
  };
  mat.userData.uniforms = own;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, own);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + GAIT_GLSL + RIG_GLSL)
      .replace('#include <beginnormal_vertex>', 'rig(position, normal);\nvec3 objectNormal = rigN;')
      .replace('#include <begin_vertex>', /* glsl */`vec3 transformed = rigP;
        vWPos = (modelMatrix * vec4(rigP, 1.)).xyz; vRest = position;
        vInfo = vec4(aRig.x > 6.5 ? 1. : 0., iB.w, aRig.x, iA.w);
        vec3 cl = (cameraPosition - vWPos) * mat3(modelMatrix); cl.xz = rotY(cl.xz, -iA.z); vCamL = cl;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', /* glsl */`#include <common>
        varying vec3 vWPos; varying vec3 vRest; varying vec4 vInfo; varying vec3 vCamL;
        uniform float uWaterW; uniform float uBlink; uniform vec3 uIris; uniform vec3 uSunCol; uniform vec3 uAmbCol; uniform float uTime;
        float gWet; float gEye; float gFold; float gBand; vec3 gIris;
        ${NOISE_GLSL}
        ${MIST_GLSL}`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          bool leg = vInfo.z > 2.5 && vInfo.z < 6.5;
          vec3 fp = leg ? vRest * vec3(2.2, 6.5, 2.2) : vRest * vec3(1.7, 1.7, 5.2);
          fp += 1.3 * (vnoise(vRest * 1.1 + 3.) - 0.5);
          float f1 = vnoise(fp), f2 = vnoise(fp * 2.7 + 7.), sc = vnoise(vRest * 16.), ptc = smoothstep(0.25, 0.7, vnoise(vRest * 0.8 + 11.));
          float near = smoothstep(140., 20., length(vViewPosition));
          float big = smoothstep(0.3, 0.8, vInfo.w);            // juveniles: the fine folds would only speckle
          gFold = mix(0.55, 0.3 + pow(1. - abs(f1 * 2. - 1.), 2.) * 0.42 * (0.35 + 0.65 * ptc) * (0.5 + 0.5 * big) + (f2 * 0.26 + sc * 0.12) * (0.25 + 0.75 * big) + 0.14 * (1. - big), near);
          float streak = vnoise(vec3(vRest.x * 5., vRest.y * 0.5, vRest.z * 5.));
          float wl = 1. - smoothstep(uWaterW + 0.25 * big, uWaterW + (1.25 + 0.75 * f2) * (0.3 + 0.7 * big), vWPos.y);
          float splash = (1. - smoothstep(uWaterW + 0.4, uWaterW + 3.6, vWPos.y)) * smoothstep(0.35, 0.75, streak) * 0.6;
          gBand = wl; gWet = max(wl, splash);
          gEye = 0.; gIris = vec3(0.);
          vec3 skin = diffuseColor.rgb * (0.82 + 0.3 * gFold) * (1. + vInfo.y);
          skin = mix(vec3(dot(skin, vec3(0.3, 0.55, 0.15))), skin, 0.72) * vec3(0.53, 0.585, 0.78);   // warm grey under a cream sun, never khaki
          skin *= mix(1., 0.26, gWet);
          if (vInfo.x > 0.5) {
            vec3 ed = normalize(vColor.rgb * 2. - 1.);
            vec3 o = vec3(vRest.x > 0. ? 1. : -1., 0., 0.);
            vec3 c = normalize(vCamL + vec3(0., 1e-4, 0.));
            vec3 d = (c - o * dot(c, o)) / max(dot(c, o), 0.25);
            d *= min(1., 0.62 / max(length(d), 1e-3));
            vec3 g = normalize(o + d);
            float a = dot(ed, g);
            float ring = vnoise(ed * 26.);
            vec3 iris = uIris * (0.55 + 0.9 * ring) * smoothstep(0.62, 0.9, a);
            iris = mix(iris, vec3(0.008), smoothstep(0.935, 0.955, a));
            iris = mix(vec3(0.03, 0.02, 0.012), iris, smoothstep(0.6, 0.7, a));
            float blink = max(uBlink, smoothstep(0.965, 0.985, fract(uTime * 0.09 + vInfo.y * 31.)) );
            float lid = smoothstep(0.02, -0.06, abs(ed.y - 0.12) - 0.86 * (1. - blink));
            gEye = lid; gIris = iris * lid * smoothstep(0.62, 0.8, a) * (1. - smoothstep(0.93, 0.95, a));
            skin = mix(vec3(0.09, 0.08, 0.07), iris, lid);
          }
          diffuseColor.rgb = skin;
        }`)
      .replace('#include <roughnessmap_fragment>', /* glsl */`#include <roughnessmap_fragment>
        roughnessFactor = mix(mix(0.86, 0.2, gWet), 0.1, gEye);`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        {
          vec3 dpx = dFdx(vViewPosition), dpy = dFdy(vViewPosition);
          float hx = dFdx(gFold), hy = dFdy(gFold);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 gr = sign(det) * (hx * r1 + hy * r2);
          normal = normalize(abs(det) * normal - 0.07 * (1. - gEye) * gr + vec3(0., 0., 1e-6));
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          vec3 vd = normalize(vViewPosition);
          float fr = pow(1. - clamp(dot(normal, vd), 0., 1.), 3.);
          vec3 sv = normalize((viewMatrix * vec4(uSunDirW, 0.)).xyz);
          float toward = clamp(dot(normal, sv) * 0.6 + 0.5, 0., 1.);
          totalEmissiveRadiance += uSunCol * fr * toward * 0.06 * (1. - gEye);
          totalEmissiveRadiance += gIris * 0.55 + diffuseColor.rgb * uAmbCol * 0.33 * (1. - gEye);
        }`)
      .replace('#include <fog_fragment>', /* glsl */`#include <fog_fragment>
        {
          // inside the mist the low sun is spent before it reaches a hide: animals go to near-silhouette, keeping a warm rim on the sun side
          float inM = exp(-max(vWPos.y - uMist.x, 0.) / max(uMist.y * 1.5, 0.1));
          float sil = clamp((uMist.z - 0.02) * 30., 0., 0.84) * inM * (1. - gEye);
          vec3 vdR = normalize(vViewPosition);
          float frR = 1. - clamp(dot(normal, vdR), 0., 1.); frR *= frR * frR;
          vec3 svR = normalize((viewMatrix * vec4(uSunDirW, 0.)).xyz);
          float sunSide = smoothstep(-0.1, 0.55, dot(normal, svR));
          vec3 rim = uSunCol * frR * sunSide * (0.42 + 0.3 * gWet) * (1. - gEye);
          float back = max(dot(-vdR, svR), 0.), frB = 1. - clamp(dot(normal, vdR), 0., 1.);
          rim += uSunCol * frB * frB * back * back * 0.55 * (1. - gEye);      // looking into the sun: a gold edge round the silhouette
          gl_FragColor.rgb = gl_FragColor.rgb * (1. - sil) + rim;
          // hides hold their dark through the near mist (silhouettes in a bright hall) and only dissolve far off
          float holdK = mix(0.5, 1., smoothstep(45., 190., length(vViewPosition)));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, applyMist(gl_FragColor.rgb, vWPos), holdK);
        }\n` + ' gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.035, 0.06, 0.06), 0.85 * clamp((uWaterW - vWPos.y) / 0.9, 0., 1.));');
  };
  return mat;
}

function instanced(geo, list, mat) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geo.index; for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
  const n = list.length, A = new Float32Array(n * 4), Bq = new Float32Array(n * 4), Cq = new Float32Array(n * 4), D = new Float32Array(n * 4);
  list.forEach((a, i) => {
    A.set([a.x, a.z0, a.yaw, a.scale], i * 4); Bq.set([a.phase, a.neckPhase, a.tailPhase, a.tint], i * 4);
    Cq.set([a.neckPitch, a.neckLen, a.walk, a.rate], i * 4); D.set([a.neckSway, a.neckLean, a.tailAmp, a.lift], i * 4);
  });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(Bq, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(Cq, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(D, 4));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------- fx
// one instanced sprite draw: 0 spray crown, 1 pour off a lifted foot, 2 belly drip, 3 breath steam, 4 mist curl
function makeSprites(items, U) {
  const n = items.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const arr = { iA: 4, iB: 4, iC: 4, iD: 4, sHip: 4, sP: 4 }, buf = {};
  for (const k in arr) buf[k] = new Float32Array(n * 4);
  items.forEach((it, i) => {
    const a = it.a;
    buf.iA.set([a.x, a.z0, a.yaw, a.scale], i * 4); buf.iB.set([a.phase, a.neckPhase, 0, 0], i * 4);
    buf.iC.set([0, 0, a.walk, a.rate], i * 4); buf.iD.set([a.neckSway, 0, 0, a.lift], i * 4);
    buf.sHip.set(it.hip, i * 4); buf.sP.set([it.type, it.seed, it.size, it.extra || 0], i * 4);
  });
  for (const k in arr) g.setAttribute(k, new THREE.InstancedBufferAttribute(buf[k], 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      ${GAIT_GLSL}
      attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD; attribute vec4 sHip; attribute vec4 sP;
      varying vec2 vUv; varying vec4 vCol; varying vec3 vWPos; uniform vec4 uMist;
      #include <fog_pars_vertex>
      void main(){
        float type = sP.x, seed = sP.y, sc = iA.w, walk = iC.z, rate = iC.w;
        float zc = iA.y + (uGait.x * uTime + uGait.w) * walk, base = baseAt(zc, sc);
        float s2 = fract(seed * 7.31), s3 = fract(seed * 13.7), s4 = fract(seed * 29.3);
        vec3 c; vec2 size = vec2(sP.z); float alpha = 0.; float streak = 0.; float warm = 0.;
        if (type < 1.5) {
          vec3 fc = footCycle(iB.x, rate, walk, sc, sHip.w);
          vec2 f = rotY(vec2(sHip.x, sHip.z + fc.x) * sc, iA.z);
          float fzw = zc + f.y, bed = bedS(fzw, sc), wetF = smoothstep(uWaterY - 0.15, uWaterY - 0.5, bed);
          if (type < 0.5) {                      // spray crown thrown at touchdown
            float tau = fc.z * uGait.y / rate, life = 1.25 + 0.5 * s3;
            float th = seed * 6.2832, vr = (1.0 + 2.0 * s2) * sc, vy = (4.6 + 3.1 * s3) * sqrt(sc);
            float r = 0.55 * sc + vr * tau;
            c = vec3(iA.x + f.x + cos(th) * r, uWaterY + max(vy * tau - 4.9 * tau * tau, -0.2), fzw + sin(th) * r);
            size *= (0.5 + 0.9 * tau / life) * vec2(1., 2.1);
            alpha = wetF * walk * step(tau, life) * smoothstep(0., 0.06, tau) * (1. - tau / life) * 0.95;
          } else {                               // water pouring off the lifted foot
            float q = fract(uTime * (0.9 + 0.5 * s2) + s3), top = base + fc.y * iD.w + 0.25 * sc;
            float th = seed * 6.2832;
            c = vec3(iA.x + f.x + cos(th) * 0.42 * sc, mix(top, uWaterY, q * q), fzw + sin(th) * 0.42 * sc);
            size *= vec2(0.3, 1.0 + 1.2 * q); streak = 1.;
            alpha = wetF * smoothstep(0.03, 0.3, fc.y) * (1. - 0.6 * q) * 0.75 * step(uWaterY, top);
          }
        } else if (type < 2.5) {                 // drips falling from the wet belly
          vec2 f = rotY(sHip.xz * sc, iA.z);
          float y0 = base + sHip.y * sc, tf = sqrt(max(y0 - uWaterY, 0.01) / 4.9);
          float tau = fract(uTime * (0.28 + 0.2 * s2) + s3) * 2.6;
          c = vec3(iA.x + f.x, y0 - 4.9 * tau * tau, zc + f.y);
          size *= vec2(0.4, 1. + 5. * tau); streak = 1.;
          alpha = step(tau, tf) * 0.8 * smoothstep(uWaterY - 0.1, uWaterY - 0.5, base);
        } else if (type < 3.5) {                 // breath steaming off the head
          float q = fract(uTime * 0.2 + seed);
          vec2 f = rotY(sHip.xz * sc, iA.z);
          float sw = iD.x * sin(uTime * 0.31 + iB.y * 6.2832) * sP.w;
          vec2 l = rotY(vec2(sw * sc, 0.), iA.z);
          c = vec3(iA.x + f.x + l.x, base + sHip.y * sc, zc + f.y + l.y);
          c += vec3(2.6 * q * q + 0.5 * (s2 - 0.5) * q, 2.4 * q + 0.3 * sin(q * 9. + seed * 40.), (s3 - 0.5) * 1.4 * q);
          size *= 0.3 + 1.9 * q;
          float breath = 0.55 + 0.45 * sin(uTime * 1.3 - q * 7. + iB.y * 20.);
          alpha = smoothstep(0., 0.12, q) * (1. - q) * (1. - q) * 0.5 * breath; warm = 1.;
        } else {                                 // curls on the top of the mist, drifting with the wind
          float drift = mod(sHip.x + uTime * (0.5 + 0.5 * s2) + 60., 120.) - 60.;
          c = vec3(drift, uWaterY + sHip.y + 0.5 * sin(uTime * 0.2 + seed * 30.), sHip.z);
          size *= vec2(1.7, 0.55 + 0.25 * s3);
          alpha = (0.1 + 0.1 * s4) * smoothstep(60., 40., abs(drift)); warm = 0.45;
        }
        vec4 wc = modelMatrix * vec4(c, 1.);
        vec3 toCam = normalize(cameraPosition - wc.xyz + vec3(0., 1e-3, 0.));
        vec3 right = normalize(cross(vec3(0., 1., 0.), toCam) + vec3(1e-5, 0., 0.));
        vec3 up = mix(cross(toCam, right), vec3(0., 1., 0.), streak);
        vec3 wp = wc.xyz + right * position.x * size.x + up * position.y * size.y;
        vWPos = wp; vUv = position.xy; vCol = vec4(warm, streak, s4, alpha * uMist.w);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec4 vCol; varying vec3 vWPos;
      uniform vec3 uSunCol; uniform vec3 uAmbCol; uniform vec3 uPearl;
      ${MIST_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
        float soft = (1. - r2); soft *= soft;
        float a = vCol.a * mix(soft, sqrt(soft), vCol.y);
        if (a < 0.004) discard;
        vec3 vd = normalize(vWPos - cameraPosition);
        float fw = max(dot(vd, uSunDirW), 0.);
        vec3 light = uAmbCol * 0.75 + uSunCol * (0.2 + 0.2 * (1. - vCol.x) + (0.9 + 1.5 * vCol.x) * fw * fw * fw);
        vec3 col = uPearl * light * (0.85 + 0.3 * vCol.z);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, applyMist(gl_FragColor.rgb, vWPos), 1. - 0.6 * vCol.x);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 4;
  return m;
}

// V wakes, bow rings and touchdown rings drawn on the water round every standing leg
function makeWakes(feet, U) {
  const n = feet.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-2.5, 0, -3.5, 7.5, 0, -3.5, 7.5, 0, 3.5, -2.5, 0, 3.5], 3));
  g.setIndex([0, 2, 1, 0, 3, 2]);
  const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), sHip = new Float32Array(n * 4);
  feet.forEach((it, i) => { const a = it.a; iA.set([a.x, a.z0, a.yaw, a.scale], i * 4); iB.set([a.phase, it.seed, 0, 0], i * 4); iC.set([0, 0, a.walk, a.rate], i * 4); sHip.set(it.hip, i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('sHip', new THREE.InstancedBufferAttribute(sHip, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      ${GAIT_GLSL}
      attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 sHip;
      varying vec2 vP; varying vec4 vI; varying vec3 vWPos; uniform vec4 uMist;
      #include <fog_pars_vertex>
      void main(){
        float sc = iA.w, walk = iC.z, rate = iC.w, zc = iA.y + (uGait.x * uTime + uGait.w) * walk;
        vec3 fc = footCycle(iB.x, rate, walk, sc, sHip.w);
        vec2 f = rotY(vec2(sHip.x, sHip.z + fc.x) * sc, iA.z);
        float fzw = zc + f.y, wetF = smoothstep(uWaterY - 0.15, uWaterY - 0.5, bedS(fzw, sc));
        float k = max(sc, 0.45);
        vec3 c = vec3(iA.x + f.x - position.x * k, uWaterY + 0.03, fzw + position.z * k);
        vP = position.xz; vI = vec4(fc.z * uGait.y / rate, (1. - fc.y) * wetF * uMist.w, iB.y, sc);
        vec4 wp = modelMatrix * vec4(c, 1.); vWPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vP; varying vec4 vI; varying vec3 vWPos;
      uniform float uTime; uniform vec3 uSunCol; uniform vec3 uAmbCol; uniform vec3 uPearl;
      ${NOISE_GLSL}
      ${MIST_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float u = vP.x, v = vP.y, r = length(vP), tau = vI.x, t = uTime;
        float edge = smoothstep(7.5, 4.5, u) * smoothstep(3.5, 2.6, abs(v)) * smoothstep(-2.5, -1.8, u);
        float n = vnoise(vec3(u * 1.6 + t * 1.6, v * 2.2, vI.z * 9.));
        float bow = smoothstep(0.22, 0.0, abs(r - 0.92)) * smoothstep(0.6, -0.4, u) * 0.9;
        float arm = abs(v) - (0.75 + 0.36 * max(u, 0.));
        float vee = smoothstep(0.3, 0., abs(arm)) * smoothstep(-0.3, 0.6, u) * (0.35 + 0.65 * n);
        float rip = (0.5 + 0.5 * sin((arm + 0.3) * 7. + t * 3.)) * smoothstep(0., -0.4, arm) * smoothstep(-1.6, -0.5, arm) * smoothstep(0.4, 1.5, u) * 0.25;
        float trail = smoothstep(0.75, 0.2, abs(v) / (0.5 + 0.12 * max(u, 0.))) * smoothstep(0.5, 1.2, u) * smoothstep(0.45, 0.8, n) * 0.7;
        float ring = smoothstep(0.32, 0., abs(r - (0.9 + 1.5 * tau))) * max(1. - tau / 1.5, 0.) * 0.9;
        float foam = (bow + vee + rip + trail) * vI.y + ring * vI.y;
        float a = clamp(foam * edge, 0., 1.) * 0.8;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uPearl * (uAmbCol * 0.8 + uSunCol * 0.45), a);
        #include <fog_fragment>
        gl_FragColor.rgb = applyMist(gl_FragColor.rgb, vWPos);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3;
  return m;
}

// simple river sheet for when the world has no river of its own yet (opts.water)
function makeWater(U, pal) {
  const g = new THREE.PlaneGeometry(1, 1, 1, 1); g.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uRiver: { value: pal.river }, uSkyH: { value: pal.pearl }, uSkyZ: { value: pal.zenith }, uGravel: { value: pal.gravel } },
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      varying vec3 vWPos; varying vec2 vL; uniform float uWaterY;
      #include <fog_pars_vertex>
      void main(){ vL = position.xz; vec4 wp = modelMatrix * vec4(position.x * 640., uWaterY, position.z * 640. + 40., 1.); vWPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vWPos; varying vec2 vL; uniform float uTime; uniform vec3 uRiver, uSkyH, uSkyZ, uGravel, uSunCol;
      ${NOISE_GLSL}
      ${MIST_GLSL}
      #include <fog_pars_fragment>
      void main(){
        vec3 vd = normalize(vWPos - cameraPosition); float dist = length(vWPos - cameraPosition);
        vec2 p = vWPos.xz; float t = uTime, lod = smoothstep(260., 40., dist);
        float n1 = vnoise(vec3(p.x * 0.9 + t * 1.5, p.y * 1.5, t * 0.25)), n2 = vnoise(vec3(p.x * 2.3 + t * 2.6, p.y * 3.1, 3. + t * 0.4));
        float e = 0.35;
        float n1x = vnoise(vec3((p.x + e) * 0.9 + t * 1.5, p.y * 1.5, t * 0.25)), n1z = vnoise(vec3(p.x * 0.9 + t * 1.5, (p.y + e) * 1.5, t * 0.25));
        vec3 N = normalize(vec3(-(n1x - n1) * 0.9 * lod - (n2 - 0.5) * 0.12 * lod, 1., -(n1z - n1) * 0.9 * lod));
        float fres = 0.04 + 0.96 * pow(1. - clamp(dot(-vd, N), 0., 1.), 5.);
        vec3 R = reflect(vd, N);
        vec3 sky = mix(uSkyH * 0.62, uSkyZ * 0.5, smoothstep(0., 0.4, R.y));
        float glint = pow(max(dot(R, uSunDirW), 0.), 260.) * 7. + pow(max(dot(R, uSunDirW), 0.), 24.) * 0.35;
        float g = vnoise(vec3(p * 2.2, 1.)) * 0.6 + vnoise(vec3(p * 7., 4.)) * 0.4;
        vec3 bed = mix(uGravel * (0.4 + 0.5 * g) * mix(vec3(1.), uRiver * 1.7, 0.6), uRiver * 0.3, 0.5);
        float foam = smoothstep(0.78, 0.92, vnoise(vec3(p.x * 0.25 + t * 0.45, p.y * 0.9, 7.)) * (0.6 + 0.4 * n2)) * 0.35 * lod;
        vec3 col = mix(bed, sky, fres * 0.8) + uSunCol * glint * lod + foam * uSkyH;
        float fade = smoothstep(0.5, 0.36, length(vL));
        gl_FragColor = vec4(col, fade * mix(0.62, 1., fres));
        #include <fog_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, applyMist(gl_FragColor.rgb, vWPos), 0.75);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2;
  return m;
}

// --------------------------------------------------------------------------------------------- build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('sauropod-ford') : ctx.rng, noise = ctx.noise;
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const waterY = opts.waterY ?? 1.2, duration = opts.duration ?? 40;
  const hsl = {}; P[4].getHSL(hsl);
  const hide = new THREE.Color().setHSL((hsl.h + rng.range(-0.03, 0.012) + 1) % 1, clamp(hsl.s * rng.range(0.8, 1.25), 0, 1), hsl.l * rng.range(0.92, 1.06));
  const pal = {
    pearl: P[0], hide, river: P[3], iris: new THREE.Color('#F2A826'),
    dark: hide.clone().lerp(P[2], 0.45).multiplyScalar(0.5), pale: hide.clone().lerp(P[0], 0.42),
    zenith: P[3].clone().lerp(P[0], 0.2), gravel: hide.clone().lerp(P[0], 0.62),
  };
  const variant = rng.range(0, 10);

  // ---- riverbed profile along the track
  const bedZ0 = -280, bedZ1 = 350, bedArr = new Float32Array(NBED);
  for (let i = 0; i < NBED; i++) bedArr[i] = opts.heightAt ? opts.heightAt(lerp(bedZ0, bedZ1, i / (NBED - 1))) : 0;
  const bedAt = (z) => { const f = clamp((z - bedZ0) / (bedZ1 - bedZ0) * (NBED - 1), 0, NBED - 1.001), i = Math.floor(f); return lerp(bedArr[i], bedArr[i + 1], f - i); };
  const bedS = (z, sc) => Math.max(bedAt(z), waterY - 3.2 * sc);
  const baseAt = (z, sc) => (bedS(z - 4, sc) + bedS(z, sc) + bedS(z + 4, sc)) / 3;

  // ---- shared uniforms
  const sunDir = new THREE.Vector3(-0.927, 0.375, 0);
  if (opts.sunDir) sunDir.fromArray(opts.sunDir).normalize();
  const U = {
    uTime: { value: 0 }, uGait: { value: new THREE.Vector4(SPEED, PERIOD, DUTY, 0) },
    uBed: { value: bedArr }, uBedR: { value: new THREE.Vector2(bedZ0, (NBED - 1) / (bedZ1 - bedZ0)) },
    uWaterY: { value: waterY }, uWaterW: { value: waterY },
    uMist: { value: new THREE.Vector4(waterY, 3.0, 0.024 * (opts.mist ?? 1), 1) },
    uMistCol: { value: P[0].clone().multiplyScalar(0.92) }, uSunDirW: { value: sunDir.clone() },
    uSunCol: { value: P[5].clone().multiplyScalar(1.15) }, uAmbCol: { value: P[0].clone().lerp(P[3], 0.35).multiplyScalar(0.8) },
    uPearl: { value: P[0].clone() },
  };

  // ---- geometry (three builds)
  const yf = ctx.yield ? () => ctx.yield() : null;
  const gDiplo = await buildSauropod(DIPLO, 1, noise, pal, variant, yf); await ctx.yield?.();
  const gBrach = await buildSauropod(BRACHIO, 1, noise, pal, variant + 3, yf); await ctx.yield?.();
  const gJuv = await buildSauropod(DIPLO, 0.42, noise, { ...pal, hide: hide.clone().lerp(P[1], 0.12).multiplyScalar(1.08) }, variant + 6, yf); await ctx.yield?.();

  // ---- the column
  const count = clamp(Math.round(opts.count ?? 38 + rng.int(-3, 2)), 12, 60), length = opts.length ?? 300;
  const zHead = opts.headZ ?? 85, step = (length - 14) / count, lanes = [-9.6, -4.4, 4.4, 9.6], order = [1, 3, 0, 2];
  const allBrach = opts.cast === 'brachio';
  const animal = (S, x, z0, scale, extra = {}) => ({
    S, x, z0, yaw: 0, scale, phase: rng(), neckPhase: rng(), tailPhase: rng(), tint: rng.range(-0.12, 0.1),
    neckPitch: rng.range(-0.05, 0.07), neckLen: 1, walk: 1, rate: 1, neckSway: rng.range(0.06, 0.13) * (S === BRACHIO ? 0.5 : 1), neckLean: rng.range(-0.05, 0.05),
    tailAmp: rng.range(0.7, 1.25), lift: S.lift * scale, ...extra,
  });
  const diplos = [], brachs = [], juvs = [];
  const matriarch = animal(BRACHIO, lanes[1], zHead, 1.07, { neckPitch: 0.02, neckSway: 0.035, neckLean: 0.02, tint: 0.04, phase: 0.1 });
  brachs.push(matriarch);
  const i0 = 4 * clamp(Math.round(count * rng.range(0.36, 0.5) / 4), 1, Math.floor(count / 4) - 2);
  const brSlots = new Set([i0, i0 + 3, i0 + 4]);
  const nBr = opts.brachiosaurs ?? 8;
  for (let guard = 0; brSlots.size < Math.min(nBr - 1, count - 2) && guard < 200; guard++) { const s = rng.int(3, count - 2); if (Math.abs(s - i0 - 2) > 5) brSlots.add(s); }
  const cluster = [];
  for (let i = 1; i < count; i++) {
    const br = allBrach || brSlots.has(i);
    let lane = order[i % 4];
    if (i === i0 + 3) lane = 2; else if (i === i0 || i === i0 + 4) lane = 1;
    const x = lanes[lane] + rng.range(-0.55, 0.55), z0 = zHead - 6 - i * step + rng.range(-1.2, 1.2);
    if (br) { const a = animal(BRACHIO, x, z0, rng.range(0.9, 1.0)); brachs.push(a); if (i >= i0 && i <= i0 + 4) cluster.push(a); }
    else diplos.push(animal(DIPLO, x, z0, rng.range(0.8, 0.98)));
  }
  const walkers = brachs.concat(diplos);
  // opts.bull = { x, z, scale }: a standing bull diplodocid beside the column that can rear (hero.setRear)
  let bull = null;
  if (opts.bull) { bull = animal(DIPLO, opts.bull.x, opts.bull.z, opts.bull.scale ?? 1.08, { walk: 0, rate: 7, neckPitch: 0.1, neckSway: 0.05, tint: -0.1, phase: 0.05, yaw: opts.bull.yaw ?? 0 }); }
  const nJ = opts.juveniles ?? 12;
  for (let j = 0, gz = 0; j < nJ; j++) {
    if (j % 4 === 0) gz = zHead - length * rng.range(0.15, 0.3) * (1 + j / 4) + rng.range(-10, 10);
    const sc = rng.range(0.19, 0.25);
    juvs.push(animal(DIPLO, rng.range(-2.4, 2.4), gz + (j % 4) * rng.range(4.5, 7) * (rng() < 0.5 ? 1 : 0.8), sc, { rate: 3, lift: 0.5, tailAmp: 1.4, neckPitch: rng.range(0.05, 0.3), neckSway: 0.12, tint: rng.range(0, 0.15) }));
  }
  // the feeding pair: in profile either side of the flight line, necks crossed into a pointed arch
  const archZ = opts.archZ ?? 244, arch = [];
  if (opts.arch !== false) for (let s = -1; s <= 1; s += 2) {
    const a = animal(BRACHIO, s * 11.6, archZ + s * 0.85, 1.12, { yaw: -s * Math.PI / 2, walk: 0, neckLen: 1.4, neckPitch: -0.2 + rng.range(-0.015, 0.015), neckSway: 0.02, neckLean: 0, phase: 0.05, tint: s * 0.05 });
    arch.push(a); brachs.push(a);
  }
  await ctx.yield?.();

  // ---- CPU mirror of the shader pose (anchors, clearance, emitters)
  const footCycle = (a, k, time) => {
    const ph = (((time / PERIOD) * a.rate * a.walk + a.phase + LEG_OFF[k]) % 1 + 1) % 1, S = SPEED * DUTY * PERIOD / a.rate / a.scale;
    if (ph < DUTY) return [S * (0.5 - ph / DUTY) * a.walk, 0, ph];
    const s = (ph - DUTY) / (1 - DUTY);
    return [S * (-0.5 + s * s * (3 - 2 * s)) * a.walk, Math.sin(Math.PI * s) * a.walk, ph];
  };
  const zcOf = (a, time) => a.z0 + SPEED * time * a.walk;
  const toWorld = (a, p, time, out = []) => { // rest-space point (already posed) -> hero local space
    const c = Math.cos(a.yaw), s = Math.sin(a.yaw), zc = zcOf(a, time), x = p[0] * a.scale, z = p[2] * a.scale;
    out[0] = x * c + z * s + a.x; out[1] = p[1] * a.scale + baseAt(zc, a.scale); out[2] = -x * s + z * c + zc; return out;
  };
  const neckPoint = (a, p, t, time) => { // time null = static pose without sway
    const S = a.S, A = S.neckAxis, Ln = S.neckLen, B = S.neckB;
    let x = p[0], y = p[1] - B[1] + A[1] * (a.neckLen - 1) * Ln * t, z = p[2] - B[2] + A[2] * (a.neckLen - 1) * Ln * t;
    const ang = (a.neckPitch + (time == null ? 0 : 0.05 * Math.sin(time * 0.23 + a.neckPhase * 9))) * smoothstep(0, 0.6, t), c = Math.cos(ang), s = Math.sin(ang);
    const y2 = y * c + z * s, z2 = z * c - y * s;
    const sw = (time == null ? 0 : a.neckSway * Math.sin(time * 0.31 + a.neckPhase * 6.2832)) + a.neckLean;
    x += sw * Ln * a.neckLen * t * t;
    return [x, y2 + B[1], z2 + B[2]];
  };
  const tailPoint = (a, t, time) => {
    const S = a.S, w = time * 0.85 * (0.4 + 0.6 * a.walk) - 4.2 * t + a.tailPhase * 6.2832, amp = a.tailAmp * S.tailLen * 0.16 * Math.pow(t, 1.5);
    const k0 = S.keys[0];
    return [amp * Math.sin(w), lerp(S.tailY, k0[1], t) + 0.25 * amp * Math.sin(w * 0.7 + 1.3) + 0.35 * amp, S.tailZ - t * S.tailLen];
  };
  const footWorld = (a, k, time, out = []) => {
    const h = a.S.hips[k], fc = footCycle(a, k, time), zc = zcOf(a, time), c = Math.cos(a.yaw), s = Math.sin(a.yaw);
    const x = h[0] * a.scale, z = (h[2] + fc[0]) * a.scale, wz = -x * s + z * c + zc;
    out[0] = x * c + z * s + a.x; out[1] = bedS(wz, a.scale) + fc[1] * a.lift; out[2] = wz; out[3] = fc[1] < 0.01 ? 1 : 0; return out;
  };
  const segDist = (px, py, pz, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l2 = dx * dx + dy * dy + dz * dz || 1e-6;
    const t = clamp(((px - a[0]) * dx + (py - a[1]) * dy + (pz - a[2]) * dz) / l2, 0, 1);
    return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t, pz - a[2] - dz * t);
  };
  const everyone = () => walkers.concat(juvs, arch, bull ? [bull] : []);
  const _a = [], _b = [];
  function clearance(x, y, z, time) {
    let best = 1e9;
    for (const a of everyone()) {
      const S = a.S, sc = a.scale, zc = zcOf(a, time);
      if (Math.hypot(x - a.x, z - zc) > 24 * sc + best + 14 * (a.neckLen - 1)) continue;
      const bl = S.belly;
      toWorld(a, [0, bl[0], bl[3]], time, _a); toWorld(a, [0, bl[0], bl[4]], time, _b);
      best = Math.min(best, segDist(x, y, z, _a, _b) - (y < _a[1] - 0.3 * sc ? bl[1] : bl[2]) * sc);
      for (let k = 0; k < 4; k++) {
        const h = S.hips[k], fc = footCycle(a, k, time); footWorld(a, k, time, _b);
        toWorld(a, [h[0], h[1], h[2] + 0.4 * fc[0]], time, _a);
        best = Math.min(best, segDist(x, y, z, _a, _b) - S.legR[h[2] > 0 ? 1 : 0] * 1.1 * sc);
      }
      let prev = toWorld(a, S.neckB, time, []);
      for (let i = 1; i <= 4; i++) {
        const t = i / 4, p = [0, lerp(S.neckB[1], S.neckEnd[1], t), lerp(S.neckB[2], S.neckEnd[2], t)];
        const cur = toWorld(a, neckPoint(a, p, t, time), time, []);
        best = Math.min(best, segDist(x, y, z, prev, cur) - lerp(0.75, 0.42, t) * sc); prev = cur;
      }
      const hk = S.keys[S.keys.length - 1];
      best = Math.min(best, segDist(x, y, z, prev, toWorld(a, neckPoint(a, [0, hk[1], hk[0]], 1, time), time, _a)) - 0.5 * sc);
      prev = toWorld(a, tailPoint(a, 0, time), time, []);
      for (let i = 1; i <= 6; i++) {
        const t = i / 6, cur = toWorld(a, tailPoint(a, t, time), time, []);
        best = Math.min(best, segDist(x, y, z, prev, cur) - lerp(0.75, 0.08, Math.sqrt(t)) * sc); prev = cur;
      }
    }
    return best;
  }
  const adults = walkers;
  const feetOut = new Float32Array(adults.length * 16);
  const feet = (time) => { const o = []; adults.forEach((a, i) => { for (let k = 0; k < 4; k++) { footWorld(a, k, time, o); feetOut.set(o, (i * 4 + k) * 4); } }); return feetOut; };
  const headRest = [0, 13.97, 9.45];
  const matriarchHead = (time, out = new THREE.Vector3()) => out.fromArray(toWorld(matriarch, neckPoint(matriarch, headRest, 1, time), time, _a));

  // ---- meshes
  const object = new THREE.Group(); object.name = 'sauropod-ford-hero';
  const mDiplo = makeHideMaterial(DIPLO, U, pal), mBrach = makeHideMaterial(BRACHIO, U, pal), mJuv = makeHideMaterial(DIPLO, U, pal);
  const meshes = [];
  if (diplos.length || bull) meshes.push(instanced(gDiplo, bull ? diplos.concat([bull]) : diplos, mDiplo));
  meshes.push(instanced(gBrach, brachs, mBrach));
  if (juvs.length) meshes.push(instanced(gJuv, juvs, mJuv));
  meshes.forEach((m) => object.add(m));
  await ctx.yield?.();

  // ---- sprites: spray, pours, drips, steam, mist curls
  const detail = ctx.quality?.detail ?? 1, items = [], wakeFeet = [];
  for (const a of walkers) {
    const S = a.S, r0 = S.legR[0];
    for (let k = 0; k < 4; k++) {
      const h = S.hips[k], hip = [h[0], h[1], h[2], k];
      wakeFeet.push({ a, hip, seed: rng() });
      for (let i = 0, n = Math.round(9 * detail); i < n; i++) items.push({ a, hip, type: 0, seed: (i + rng()) / n, size: rng.range(0.2, 0.42) * a.scale });
      for (let i = 0; i < 3; i++) items.push({ a, hip, type: 1, seed: rng(), size: rng.range(0.3, 0.5) * r0 * 1.6 * a.scale });
    }
    const bl = S.belly;
    for (let i = 0, n = Math.round(10 * detail); i < n; i++) {
      const fx = rng.range(-0.75, 0.75), z = rng.range(bl[3], bl[4]);
      items.push({ a, hip: [fx * bl[2], bl[0] - bl[1] * Math.sqrt(1 - fx * fx) * 0.96, z, 0], type: 2, seed: rng(), size: rng.range(0.035, 0.06) });
    }
  }
  for (const a of juvs) for (let k = 0; k < 4; k++) {
    const h = DIPLO.hips[k], hip = [h[0], h[1], h[2], k];
    for (let i = 0; i < 2; i++) items.push({ a, hip, type: 0, seed: rng(), size: rng.range(0.35, 0.5) });
  }
  for (const a of walkers.concat(arch)) {
    const S = a.S, n = S === BRACHIO ? 8 : 2, c = neckPoint(a, S.crest, 1, null);
    for (let i = 0; i < n; i++) items.push({ a, hip: [c[0], c[1], c[2], 0], type: 3, seed: (i + rng() * 0.6) / n, size: (S === BRACHIO ? 0.85 : 0.5) * a.scale, extra: S.neckLen * a.neckLen });
  }
  const still = { x: 0, z0: 0, yaw: 0, scale: 1, phase: 0, neckPhase: 0, walk: 0, rate: 1, neckSway: 0, lift: 0 };
  for (let i = 0, n = Math.round(70 * detail); i < n; i++) items.push({ a: still, hip: [rng.range(-60, 60), rng.range(3.2, 6.2), rng.range(zHead - length - 30, zHead + 70), 0], type: 4, seed: rng(), size: rng.range(6, 11) });
  const sprites = makeSprites(items, U), wakes = makeWakes(wakeFeet, U);
  object.add(wakes, sprites);
  let water = null;
  if (opts.water !== false) { water = makeWater(U, pal); object.add(water); }
  await ctx.yield?.();

  // ---- anchors
  const tHead = 29.6, mh = matriarchHead(tHead), zM = zcOf(matriarch, 24), ySkim = waterY + 2.6;
  const archTop = arch.length ? toWorld(arch[0], neckPoint(arch[0], [0, 12.9, 7.9], 0.86, null), 0, [])[1] : 15.5;
  const anchors = {
    portalSeat: { position: [0, 7, archZ + 18], facing: [0, 0, -1], radius: 7 },
    arch: { position: [0, archTop, archZ], openingWidth: 12.4, openingHeight: archTop - 0.6, heads: arch.map((a) => toWorld(a, neckPoint(a, headRest, 1, null), 0, [])) },
    flyThrough: [[0, 5.2, zHead - length - 80], [0, 5.0, zHead - length - 30], [0, ySkim, zHead - length + 10], [0, ySkim, zHead - length * 0.6], [0, ySkim, zHead - length * 0.25],
      [0.2, ySkim, zM - 16], [0.1, 8.6, zM + 1], [mh.x + 4, mh.y - 0.6, mh.z - 2], [mh.x + 4.2, mh.y - 0.2, mh.z + 12], [0, 9.6, archZ - 62], [0, 7.6, archZ - 42], [0, 7.6, archZ], [0, 7.6, archZ + 18]],
    matriarch: { head: mh.toArray(), headTime: tHead, eyeSide: [1, 0, 0], x: matriarch.x, z0: matriarch.z0, scale: matriarch.scale },
    brachiosaurs: cluster.map((a) => ({ x: a.x, z0: a.z0, scale: a.scale })),
    viewpoints: {
      skim: [0, 5.2, zHead - length - 80], under: cluster[0] ? [cluster[0].x + 6, ySkim, cluster[0].z0 + 12] : [0, ySkim, 0],
      head: [mh.x + 4, mh.y - 0.4, mh.z], arch: [0, 7.6, archZ - 60],
    },
    extent: { center: [0, 5, 30], radius: 240, height: 17.5 }, waterY, sunDir: sunDir.toArray(), herdSpeed: SPEED, column: { zHead, zTail: zHead - length, lanes },
  };

  // ---- viewer framing (the _part viewer orbits center at radius; opts.focus picks a close view)
  // default: a presentable orbit of the front half of the column; the true extent is in anchors.extent
  let center = new THREE.Vector3(0, 5, zHead - 38), radius = 26, height = 16;
  let focus = opts.focus;
  if (focus === 'head') { matriarchHead(12, center); center.y -= 0.6; radius = -2.4; height = 2.5; }
  else if (focus === 'under') { const a = cluster[1] || matriarch; center.set(0, 3.2, zcOf(a, 12)); radius = 5; height = 3.2; }
  else if (focus === 'arch') { center.set(0, 8, archZ); radius = 13; height = 10; }

  // ---- animation
  let progress = null, herdTime = null, blink = null, lightAdopted = !!opts.sunDir;
  const brachU = mBrach.userData.uniforms;
  const setLight = ({ sunDir: d, sunColor: c } = {}) => {
    if (d) { U.uSunDirW.value.set(d.x ?? d[0], d.y ?? d[1], d.z ?? d[2]).normalize(); }
    if (c) U.uSunCol.value.copy(c);
    lightAdopted = true;
  };
  const _v = new THREE.Vector3(), _t = new THREE.Vector3();
  function update(dt, time, camera) {
    if (!lightAdopted && object.parent) {
      let root = object; while (root.parent) root = root.parent;
      let sun = null; root.traverse((o) => { if (!sun && o.isDirectionalLight) sun = o; });
      if (sun) {
        sun.getWorldPosition(_v); sun.target.getWorldPosition(_t); _v.sub(_t);
        if (_v.lengthSq() > 1e-6) U.uSunDirW.value.copy(_v.normalize());
        U.uSunCol.value.copy(sun.color).multiplyScalar(clamp(sun.intensity / 2.6, 0.2, 1.4));
      }
      lightAdopted = true;
    }
    const ht = herdTime != null ? herdTime : progress != null ? progress * duration : time;
    U.uTime.value = ht;
    const wy = object.matrixWorld.elements[13] + waterY;
    U.uWaterW.value = wy; U.uMist.value.x = wy;
    const pb = progress != null ? smoothstep(0.745, 0.754, progress) * (1 - smoothstep(0.764, 0.776, progress)) : 0;
    brachU.uBlink.value = blink != null ? blink : pb;
  }
  update(0, 0, null);

  // ---- the lone wader (hero.addWader): one more diplodocid of this herd, standing apart in the river on a patch of bed
  // the world names (it knows the bed in two dimensions; this piece only knows it along the track), its neck lowered
  // until the muzzle meets the water. It is posed by the same rig with walk 0, in a draw of its own because its footing
  // is its own. Every number comes in with the spec: no draw of this piece's stream is spent, and it is not one of
  // `everyone()`, so clearance(), feet() and animals are exactly what they were.
  //   spec: { x, z, bedY, yaw, scale, muzzleY, phase, neckPhase, tailPhase, tint, neckSway, neckLean, tailAmp }
  //   -> { muzzle [x,y,z] (rest pose), feet [[x,z] x 4], body [x,z], neckPitch, clearance(x,y,z,herdTime), triangles }
  let waderInfo = null;
  function addWader(w) {
    if (waderInfo) return waderInfo;
    const a = { S: DIPLO, x: w.x, z0: w.z, yaw: w.yaw ?? 0, scale: w.scale ?? 0.9, phase: w.phase ?? 0.05, neckPhase: w.neckPhase ?? 0, tailPhase: w.tailPhase ?? 0, tint: w.tint ?? 0,
      neckPitch: 0, neckLen: 1, walk: 0, rate: 1, neckSway: w.neckSway ?? 0.05, neckLean: w.neckLean ?? 0, tailAmp: w.tailAmp ?? 1, lift: DIPLO.lift * (w.scale ?? 0.9) };
    const bedY = w.bedY ?? 0, cy = Math.cos(a.yaw), sy = Math.sin(a.yaw);
    const toW = (p, out = []) => { const x = p[0] * a.scale, z = p[2] * a.scale; out[0] = x * cy + z * sy + a.x; out[1] = p[1] * a.scale + bedY; out[2] = -x * sy + z * cy + a.z0; return out; };
    // lower the neck (the rig's own pitch) until the tip of the snout rests at muzzleY
    const hk = DIPLO.keys[DIPLO.keys.length - 1], snout = (pitch, time = null) => { a.neckPitch = pitch; return toW(neckPoint(a, [0, hk[1], hk[0]], 1, time), []); };
    let lo = -1.3, hi = 0.2;
    for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (snout(m)[1] > (w.muzzleY ?? waterY)) hi = m; else lo = m; }
    a.neckPitch = (lo + hi) / 2;
    const mat = makeHideMaterial(DIPLO, { ...U, uBed: { value: new Float32Array(NBED).fill(bedY) } }, pal);
    const mesh = instanced(gDiplo, [a], mat); mesh.name = 'sauropod-ford-wader';
    object.add(mesh);
    const _p = [], _q = [];
    const clear = (x, y, z, time) => {          // the same capsules clearance() measures, for this one animal
      const S = DIPLO, sc = a.scale, bl = S.belly; let best = 1e9;
      toW([0, bl[0], bl[3]], _p); toW([0, bl[0], bl[4]], _q);
      best = Math.min(best, segDist(x, y, z, _p, _q) - bl[2] * sc);
      for (let k = 0; k < 4; k++) { const h = S.hips[k]; toW(h, _p); toW([h[0], 0, h[2]], _q); best = Math.min(best, segDist(x, y, z, _p, _q) - S.legR[h[2] > 0 ? 1 : 0] * 1.1 * sc); }
      let prev = toW(S.neckB, []);
      for (let i = 1; i <= 4; i++) {
        const t = i / 4, cur = toW(neckPoint(a, [0, lerp(S.neckB[1], S.neckEnd[1], t), lerp(S.neckB[2], S.neckEnd[2], t)], t, time), []);
        best = Math.min(best, segDist(x, y, z, prev, cur) - lerp(0.75, 0.42, t) * sc); prev = cur;
      }
      best = Math.min(best, segDist(x, y, z, prev, toW(neckPoint(a, [0, hk[1], hk[0]], 1, time), _p)) - 0.5 * sc);
      prev = toW(tailPoint(a, 0, time), []);
      for (let i = 1; i <= 6; i++) { const t = i / 6, cur = toW(tailPoint(a, t, time), []); best = Math.min(best, segDist(x, y, z, prev, cur) - lerp(0.75, 0.08, Math.sqrt(t)) * sc); prev = cur; }
      return best;
    };
    waderInfo = { muzzle: snout(a.neckPitch), feet: DIPLO.hips.map((h) => { const f = toW([h[0], 0, h[2]], []); return [f[0], f[2]]; }), body: [a.x, a.z0], neckPitch: a.neckPitch, scale: a.scale, yaw: a.yaw,
      clearance: clear, triangles: gDiplo.userData.triangles, dispose() { mat.dispose(); } };
    return waderInfo;
  }

  let triangles = 0;
  for (const [g, n] of [[gDiplo, diplos.length], [gBrach, brachs.length], [gJuv, juvs.length]]) triangles += g.userData.triangles * n;
  triangles += items.length * 2 + wakeFeet.length * 2 + (water ? 2 : 0);

  return {
    object, radius, height, center, anchors, update,
    dispose() { gDiplo.dispose(); gBrach.dispose(); gJuv.dispose(); },
    ground: true, groundY: 0,
    setProgress(u) { progress = u; }, setHerdTime(s) { herdTime = s; }, setBlink(x) { blink = x; }, setLight,
    setRear(x) { mDiplo.userData.uniforms.uRear.value = x; }, setZOffset(m) { U.uGait.value.w = m; },
    clearance, feet, matriarchHead, uniforms: U,
    addWader,
    animals: everyone().map((a) => ({ species: a.S.name, x: a.x, z0: a.z0, yaw: a.yaw, scale: a.scale, walking: a.walk > 0, juvenile: a.rate > 1 })),
    stats: { triangles, drawCalls: object.children.length, adults: walkers.length, juveniles: juvs.length },
  };
}
