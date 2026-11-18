// THE HERD AND ITS WALL OF SPRAY - hero set piece for the world "delta-in-flood".
//
// Four hundred red lechwe bounding through knee-deep floodwater in a loose river of animals 300 m long and
// 60 m wide. Every animal is posed in the vertex shader: chest-first landing, forelegs then hind legs planted
// on a point that is FIXED in the world while the body rolls over it (two-bone IK to a lane point at a whole
// number of strides), then a parabolic leap with forelegs tucked and hind legs trailing, pitch taken from the
// arc, a high leap every 7th to 11th stride, neck held level, tail flagging. Each landing throws a ballistic
// crown of spray 3 m high that stays where it was born (stateless: quad k belongs to landing n-k and is aged
// by the distance run since): a thin sheet breaking into round drops, with foam lace and spreading rings on
// the water (no tiles, no domes), and a soft shadow that slides away toward the viewer while the animal is in
// the air. The hanging mist of all of them is one curtain 10-12 m tall: columns of billows with shaded hearts
// and burning crests, built by age since the herd's front passed, trailing 200 m behind and drifting downwind.
// Under it lies the churned wake (bent grass, foam lace, stirred water that still mirrors the sky) as a road
// across the plain. At the hippo pool the river of
// animals parts in two and closes again.
//
// LOCAL SPACE  origin on the bed of the plain (y = 0; water surface y = waterY = 0.3). The herd runs toward +Z
//   ("front"). The brief's camera paces the herd's RIGHT flank, which is the -X side, looking toward +X where
//   the sun is: default sunDir = (cos 24deg, sin 24deg, 0) rotated a few degrees per seed. The pool is at
//   z = +40. The herd's centre is at z = zStart + travel * u (default -461 .. +85), so the middle of the herd
//   crosses local z = 0 at u = 0.84, as the camera passes the pool; the pacing leg (u 0.56-0.79) runs
//   z -215 .. -5 and starts 60 m behind the herd's middle, as the brief's speeds require.
// SIZE   herd window 300 x 60 m (hero.radius 190 about the moving centre, height 8: curtain 10-13 m, horn tips
//   1.9 m standing, 3.4 m at the top of a high leap). The lanes follow x = arc * z^2 / 2 and reach 34 m from
//   the z axis (up to ~80 m where the run starts, z -610); the curtain trails 200 m behind the last animal.
// COST   about 135k triangles (count 400; 150k at 520), 6 draw calls: near lechwe (3 flank lanes, up to 150
//   animals at ~690 tris each, 5 lanes and 172 on the rare wheel; the three outermost lanes stand 3 m apart,
//   mostly rams, the outermost the densest with no long gaps, so an animal is always abreast of the eye), far
//   lechwe (~200 tris each), flats (rings, foam, shadows), curtain, crowns, sheet.
//   No lights, no textures, build 60-150 ms.
// LIGHT  Everything is a custom ShaderMaterial (linear HDR, scene fog) lit by uniforms, not by scene lights:
//   warm key from sunDir, cool sky fill, bright bounce from the water below (it lights the white bellies).
//   Spray is forward-scattering: drops, foam and wake rings burn only close to the sun's bearing (scatter),
//   the hanging curtain glows white-gold over a wide arc round it (scatterWide) and stands behind the three
//   flank lanes, so they run as dark cut-outs in front of it; from the sunny side it is plain blue-white. Use
//   hero.setLight({ sunDir, sunColor, skyColor, horizonColor }) to match the world's sky; keep the sun on +X.
//
// OPTS   palette  7 hex strings in brief order: grass gold, sedge green, deep channel, sky blue, cream key,
//                 lechwe chestnut (the accent), dark culm green
//        count    animals, 280-520 (default 360-440 by seed)        rams: share with horns (default by seed)
//        hour     'afternoon' (default) | 'golden' | 'dawn' | 'night'      sunDir [x,y,z] overrides its sun
//        weather  'clear' (default) | 'haze' | 'wind' (curtain torn long and low, more drift)
//        season   'flood' (default) | 'may' (thin water: tan dust mixed into the curtain) | 'august'
//        cast     'lechwe' (default) | 'buffalo' (a rough stand-in: heavier, darker, slower, taller spray)
//        water    'full' (default: the floodplain sheet with the wake road and the pool painted in) |
//                 'wake' (only the churned band, as a transparent overlay for the world's own lake) | false
//        pool     { z, d, radius } or false: where the herd parts (d = lateral offset in the herd band)
//        arc      curvature of the lanes (1/m, default ~0.0005 toward +X)      speed 13 m/s
//        duration 42 s, travel = speed x duration, zStart: herd centre z at u = 0
//        waterY   0.3
//        wheel    { z, sigma, amp }: the rare wheel. The whole river of animals swings amp metres toward -X in a
//                 bell round z (lanes, spray, curtain and wake together; the lanes stay fixed in the world, so no
//                 skating). The anchors keep the un-wheeled flank line.      nearLanes  3..6 flank lanes at full detail
//        curtainGain / crownGain  sun gain on the curtain / on crowns and foam (default 1)
//        curtainHeight  m (default 10.5)      curtainNear  lateral offset where the curtain starts (default -17)
//        focus    'pace' | 'herd' | 'pool': a closer framing for the part viewer
// HERO API (besides the contract)
//   hero.setProgress(u)   THE HERD CLOCK. centre z = zStart + travel * u. While u stays 0 (or if it is never
//                         called) the herd runs on a treadmill inside its 300 m window, animals swapping from
//                         the front to the back unseen inside the spray; when u starts to move the treadmill
//                         stops where it is (no jump) and u takes over. Between u 0.18 and 0.45 the treadmill's
//                         leftover offset is eased to nothing (opts.settle: false keeps it), so from then on
//                         every animal's place is a function of u alone.
//   hero.nearAt(i, centreZ, out) -> { x, z, sc, ram, lane, inside } of flank animal i (hero.nearCount of
//                         them) when the herd's centre is at centreZ; hero.zStartNow(). The world uses them
//                         to compose its hero frame.
//   hero.centerZ(u), hero.laneX(z, d) -> x of the lane at lateral offset d (-30 = the flank lane by the
//                         camera, +30 = the sun side), hero.flankX(z) = laneX(z, -30).
//   hero.setRun({ zStart }) re-times the run once the world knows its path; hero.wheelAt(z); hero.parts (meshes).
//   hero.setLight(...), hero.uniforms (shared: uSunDir, uSunCol, uSkyCol, uHorizon, uHerd ...), hero.stats.
// ANCHORS (local space)
//   flyThrough   ordered points: in over the plain, the pacing line 18 m outside the flank lane at 3 m above
//                the water (z -215 .. -5), past the pool, a 10 degree right turn, 60 m straight climbing 6
//                degrees to the portal. Nothing of the hero is within 6 m of it except spray mist.
//   paceLine     the pacing part alone; look 35 degrees left of travel (toward +X).
//   portalSeat   { position, facing, radius 7 }: centre 9.5 m above the water where the exit island should
//                be built; facing points back along the last leg.
//   pool         { position, radius }: build the hippo pool here (deep water, no grass).
//   viewpoints   { pace: { from, to }, far: { from, to } }; herd { speed, length, width, zStart, travel };
//   sunDir, waterY.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { Geo } from '../kit/fauna.js';

const BRIEF_PALETTE = ['#B9B45A', '#6E9440', '#1F4E7A', '#9CC3E0', '#FFF1CF', '#A85A2A', '#22301F'];
const C = (h) => new THREE.Color(h);

// ---------------------------------------------------------------------------------------------------------
// Lechwe geometry. Model space: nose +Z, up +Y, shoulder height 1.0, hooves at y 0, body centre over z 0.
// aAnim = (leg index 0 FL 1 FR 2 HL 3 HR | weight, t: 0..1 thigh, 1..2 shank, part: 1 leg 2 neck+head 3 tail
// 4 ear, w: 2 = ram only). aPivot = joint. Legs are modelled straight down so the shader can bend them.
const LEG = { front: { z: 0.36, y: 0.78, l1: 0.40, l2: 0.38 }, hind: { z: -0.38, y: 0.86, l1: 0.44, l2: 0.42 } };
function lechweGeometry(pal, hi) {
  const g = new Geo();
  const coat = pal.coat.clone().multiplyScalar(0.8), back = pal.coat.clone().multiplyScalar(0.52), white = C('#efe6d2'), black = C('#16110d');
  const sock = pal.coat.clone().multiplyScalar(0.8).lerp(C('#d9b98a'), 0.25), horn = C('#3a3029'), hornTip = C('#8a7a66'), muzzle = C('#241a14');
  const sides = hi ? 12 : 6;
  // torso: rump higher than the withers, deep chest, tucked loins
  const rings = hi ? [
    { z: -0.66, y: 0.93, rx: 0, ry: 0 }, { z: -0.59, y: 0.915, rx: 0.10, ry: 0.13 }, { z: -0.44, y: 0.88, rx: 0.165, ry: 0.205 },
    { z: -0.22, y: 0.862, rx: 0.165, ry: 0.19 }, { z: 0.03, y: 0.826, rx: 0.178, ry: 0.208 }, { z: 0.27, y: 0.80, rx: 0.168, ry: 0.226 },
    { z: 0.45, y: 0.825, rx: 0.132, ry: 0.196 }, { z: 0.57, y: 0.86, rx: 0.08, ry: 0.125 }, { z: 0.63, y: 0.87, rx: 0, ry: 0 },
  ] : [
    { z: -0.66, y: 0.93, rx: 0, ry: 0 }, { z: -0.47, y: 0.885, rx: 0.16, ry: 0.2 }, { z: -0.1, y: 0.845, rx: 0.172, ry: 0.2 },
    { z: 0.3, y: 0.805, rx: 0.165, ry: 0.222 }, { z: 0.52, y: 0.845, rx: 0.1, ry: 0.15 }, { z: 0.63, y: 0.87, rx: 0, ry: 0 },
  ];
  const body = g.loft(rings, { sides, top: coat, belly: white, shade: hi ? [-0.82, -0.28] : [-0.98, -0.62] });
  g.paint(body, (x, y, z, c) => {
    const top = smoothstep(0.93, 1.06, y); c.lerp(back, top * 0.55);             // darker saddle
    if (z < -0.52 && y < 0.95) c.lerp(white, 0.75);                              // pale rump patch under the tail
    if (z > 0.4 && y < 0.82) c.lerp(white, 0.6);                                 // white chest
  });
  // legs: straight down from the joint; thigh and forearm are deep front to back, cannons thin, dark hooves
  const leg = (id, sx, J, front) => {
    const x = sx * 0.105, ts = hi ? [0, 0.5, 1, 1.5, 1.86, 2] : [0, 1, 2];
    const rr = hi ? (front ? [0.062, 0.042, 0.03, 0.021, 0.02, 0.03] : [0.085, 0.052, 0.03, 0.022, 0.021, 0.03]) : (front ? [0.058, 0.03, 0.026] : [0.078, 0.03, 0.026]);
    const pts = ts.map((t) => [x, J.y - (t <= 1 ? t * J.l1 : J.l1 + (t - 1) * J.l2), J.z]);
    const r = g.tube(pts, rr, hi ? 6 : 3, coat, sock, { flatten: front ? 1.25 : 1.6 });
    const n = hi ? 6 : 3;
    for (let i = r[0]; i < r[1]; i++) {
      const ring = Math.floor((i - r[0]) / n), t = ts[ring], k = i * 4;
      g.a[k] = id; g.a[k + 1] = t; g.a[k + 2] = 1; g.a[k + 3] = 0;
      g.pv[i * 3] = x; g.pv[i * 3 + 1] = J.y; g.pv[i * 3 + 2] = J.z;
    }
    g.paint(r, (px, py, pz, c) => {
      if (py < 0.05) c.copy(black);                                              // hoof
      else if (front && pz > J.z + 0.004 && py < J.y - 0.12) c.lerp(black, 0.9); // black stripe down the foreleg
      else if (!front && py < 0.3 && pz > J.z) c.lerp(black, 0.5);
      if (py > J.y - 0.2 && Math.abs(px) < 0.1) c.lerp(white, 0.35);             // pale inside of the upper leg
    });
  };
  leg(0, -1, LEG.front, true); leg(1, 1, LEG.front, true); leg(2, -1, LEG.hind, false); leg(3, 1, LEG.hind, false);
  // neck and head
  const n0 = g.n, nb = [0, 0.9, 0.45], ntop = [0, 1.33, 0.73], npts = [], nr = [], NS = hi ? 4 : 2;
  for (let i = 0; i <= NS; i++) { const t = i / NS, bow = Math.sin(t * Math.PI) * 0.035; npts.push([0, lerp(nb[1], ntop[1], t) + bow * 0.4, lerp(nb[2], ntop[2], t) - bow]); nr.push(lerp(0.125, 0.066, Math.pow(t, 0.75))); }
  const neck = g.tube(npts, nr, hi ? 8 : 4, coat, coat, { flatten: 0.8 });
  g.paint(neck, (x, y, z, c) => { const under = (z - nb[2]) * 0.84 - (y - nb[1]) * 0.55; if (under > 0.035) c.lerp(white, 0.85); });
  const h0 = g.n, hl = 0.31, hr = 0.074, hp = 0.5;
  const head = g.loft(hi ? [
    { z: -0.28 * hl, y: 0, rx: 0, ry: 0 }, { z: -0.12 * hl, y: 0.004, rx: hr * 0.86, ry: hr * 0.95 }, { z: 0.18 * hl, y: 0.004, rx: hr, ry: hr * 1.02 },
    { z: 0.55 * hl, y: -0.012, rx: hr * 0.66, ry: hr * 0.7 }, { z: 0.86 * hl, y: -0.02, rx: hr * 0.46, ry: hr * 0.5, top: muzzle, belly: white }, { z: hl, y: -0.024, rx: 0, ry: 0, top: muzzle },
  ] : [
    { z: -0.28 * hl, y: 0, rx: 0, ry: 0 }, { z: 0.1 * hl, y: 0.004, rx: hr, ry: hr * 1.02 }, { z: 0.8 * hl, y: -0.02, rx: hr * 0.5, ry: hr * 0.54, top: muzzle, belly: white }, { z: hl, y: -0.024, rx: 0, ry: 0, top: muzzle },
  ], { sides: hi ? 8 : 4, top: coat, belly: white, shade: [-0.7, -0.1] });
  if (hi) g.paint(head, (x, y, z, c) => { if (Math.abs(x) > hr * 0.6 && y > 0 && z > 0.1 * hl && z < 0.36 * hl) c.copy(Math.abs(z - 0.23 * hl) < 0.035 * hl * 2 ? black : white); });
  const e0 = g.n;
  for (const sx of [-1, 1]) {
    const er = g.fan([[sx * hr * 0.55, hr * 0.7, -0.1 * hl], [sx * (hr * 0.9 + 0.11), hr * 0.8 + 0.1, -0.2 * hl], [sx * (hr * 1.0 + 0.05), hr * 0.55, -0.05 * hl]], coat, white);
    g.anim(er, () => [1, 0, 4, 0]);
    if (!hi && sx < 0) break;
  }
  // lyre horns: back and out, then up, tips hooking forward (rams only)
  const o0 = g.n;
  for (const sx of [-1, 1]) {
    const bx = sx * hr * 0.42, by = hr * 0.86, bz = 0.0;
    const hp3 = hi
      ? [[0, 0, 0], [0.05, 0.11, -0.13], [0.12, 0.24, -0.24], [0.165, 0.37, -0.27], [0.15, 0.48, -0.2], [0.115, 0.56, -0.09]]
      : [[0, 0, 0], [0.11, 0.22, -0.23], [0.165, 0.4, -0.26], [0.115, 0.56, -0.09]];
    const rad = hi ? [0.027, 0.025, 0.022, 0.018, 0.012, 0] : [0.03, 0.026, 0.02, 0];
    g.tube(hp3.map((p) => [bx + sx * p[0], by + p[1], bz + p[2]]), rad, hi ? 5 : 3, horn, hornTip);
  }
  g.anim([o0, g.n], () => [1, 0, 2, 2]);
  // place the head on the neck: pitch the muzzle down, move to the top of the neck
  g.move([h0, g.n], (p) => { const y = p.y, z = p.z; p.y = y * Math.cos(hp) - z * Math.sin(hp) + ntop[1] + 0.035; p.z = y * Math.sin(hp) + z * Math.cos(hp) + ntop[2] + 0.02; });
  for (let i = n0; i < g.n; i++) {
    const t = clamp(((g.p[i * 3 + 2] - nb[2]) * 0.55 + (g.p[i * 3 + 1] - nb[1]) * 0.84) / 0.3, 0, 1), k = i * 4;
    const part = g.a[k + 2]; g.a[k] = i >= h0 ? 1 : t; g.a[k + 1] = part === 4 ? 1 : 0; g.a[k + 2] = 2;
    g.pv[i * 3] = 0; g.pv[i * 3 + 1] = nb[1]; g.pv[i * 3 + 2] = nb[2];
  }
  // tail: short, black tuft, flagged in the leap
  const tb = [0, 1.02, -0.6], t0 = g.n;
  g.tube([[0, tb[1], tb[2]], [0, tb[1] - 0.13, tb[2] - 0.07], [0, tb[1] - 0.27, tb[2] - 0.08], [0, tb[1] - 0.36, tb[2] - 0.06]], [0.022, 0.018, 0.028, 0], 3, coat, black);
  g.anim([t0, g.n], (x, y) => [0, clamp((tb[1] - y) / 0.36, 0, 1), 3, 0]); g.pivot([t0, g.n], tb[0], tb[1], tb[2]);
  const geo = g.build();
  geo.userData.triangles = g.triangles;
  return geo;
}

// ---------------------------------------------------------------------------------------------------------
// Shared GLSL: the lanes, the treadmill window, the herd's outline, the stride clock.
const LANE_GLSL = /* glsl */`
uniform vec4 uHerd;   // x centre z, y treadmill distance, z window length, w treadmill weight (1 running, 0 frozen)
uniform vec4 uPool;   // x z, y lateral offset, z push radius (0 = no pool), w length of the parting
uniform vec4 uLane;   // x arc curvature, y speed m/s, z water surface y, w half width the push dies out over
uniform vec4 uEnv;    // x head taper m, y tail taper m, z lateral offset of the leaders, w half width
uniform vec4 uWheel;  // x centre z, y sigma m (never 0), z how far (m) the whole river swings toward -X there (the rare wheel), w unused
uniform float uTime;
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float wrapS(float s){ float L = uHerd.z; return mod(s + uHerd.y + L * .5, L) - L * .5; }
// x of the lane with lateral offset d at z, and its slope dx/dz
vec2 laneX(float z, float d){
  float dd = d - uPool.y, sg = dd < 0. ? -1. : 1., q = (z - uPool.x) / uPool.w, g = exp(-q * q);
  float push = uPool.z * max(1. - abs(dd) / uLane.w, 0.);
  float qw = (z - uWheel.x) / uWheel.y, gw = uWheel.z * exp(-qw * qw);
  return vec2(.5 * uLane.x * z * z + d + sg * push * g - gw, uLane.x * z + sg * push * g * (-2. * q / uPool.w) + gw * 2. * qw / uWheel.y);
}
// how far (m) the window position w of lane d lies inside the herd's outline: tapered head, ragged tail
float inside(float w, float d, float seed){
  float hl = uHerd.z * .5, k = (d - uEnv.z) / uEnv.w, k2 = d / uEnv.w;
  float head = hl - uEnv.x * k * k - 9. * h11(seed + 3.), tail = -hl + uEnv.y * k2 * k2 * (.4 + 1.2 * h11(floor(d * .25) + 7.));
  return min(head - w, w - tail);
}
float visOf(float e){ return mix(step(2., e), smoothstep(0., 7., e), uHerd.w); }
`;

// ---- lechwe: bounding gait solved per vertex
const LECHWE_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aAnim; attribute vec3 aPivot; attribute vec4 iA, iB; attribute vec3 iTint;
uniform vec4 uGait;   // x leap height m, y high leap height m, z stance share of the stride, w crouch m
varying vec3 vColor, vN, vWorld; varying float vWet;
${LANE_GLSL}
vec2 rot(vec2 yz, float a){ float c = cos(a), s = sin(a); return vec2(yz.x * c + yz.y * s, yz.y * c - yz.x * s); }
float leapOf(float n, float seed, float per){ return mod(n + floor(seed * 37.), per) < .5 ? uGait.y : uGait.x * (.8 + .4 * h11(n * .37 + seed)); }
void main(){
  vec3 p = position, n = normal;
  float sc = iB.x, seed = iB.z;
  float w = wrapS(iA.x), zw = uHerd.x + w;
  vec2 lx = laneX(zw, iA.y); float len = sqrt(1. + lx.y * lx.y);
  float lam = iA.w, ph = (zw + iA.z) / lam, nS = floor(ph), f = ph - nS;
  float f0 = uGait.z, H1 = leapOf(nS, seed, iB.w), H0 = leapOf(nS - 1., seed, iB.w);
  float psi = clamp((f - f0) / (1. - f0), 0., 1.), fl = f < f0 ? 0. : 1.;
  float yb = (fl > .5 ? H1 * 4. * psi * (1. - psi) : -uGait.w * sin(3.14159 * f / f0)) / sc;
  float t0a = .55 * atan(4. * H0 / ((1. - f0) * lam)), t0b = .55 * atan(4. * H1 / ((1. - f0) * lam));
  float pitch = fl > .5 ? .55 * atan(4. * H1 * (1. - 2. * psi) / ((1. - f0) * lam)) : mix(-t0a, t0b, smoothstep(0., f0, f));
  float air = fl * sin(3.14159 * psi);
  vec3 B = vec3(0., .8, 0.);
  if(aAnim.w > 1.5 && iB.y < .5) p = aPivot + vec3(0., .1, .1);          // ewes carry no horns
  float part = aAnim.z;
  if(part > .5 && part < 1.5){
    bool front = aAnim.x < 1.5; float side = fract(aAnim.x * .5) > .25 ? 1. : -1.;
    float L1 = front ? ${LEG.front.l1.toFixed(3)} : ${LEG.hind.l1.toFixed(3)}, L2 = front ? ${LEG.front.l2.toFixed(3)} : ${LEG.hind.l2.toFixed(3)};
    float fq = fract(f - side * .012 + 1.);                               // the lead leg lands a touch earlier
    float sw = f0 * .62, c0 = front ? sw * .5 : f0 - sw * .5;              // stance: fore first (chest first), then hind
    float fs = (front && fq > .5) ? fq - 1. : fq;
    float wS = smoothstep(c0 - sw * .5 - .035, c0 - sw * .5, fs) * (1. - smoothstep(c0 + sw * .5, c0 + sw * .5 + .035, fs));
    // joint in the lane frame (model units), after body pitch and height
    vec2 jr = rot(vec2(aPivot.y - B.y, aPivot.z), pitch);
    vec2 st = vec2((c0 - fs) * lam * len / sc + aPivot.z - jr.y, -(B.y + jr.x + yb));   // (z, y) hoof on the bed, from the joint
    vec2 stb = vec2(st.x * cos(pitch) + st.y * sin(pitch), st.y * cos(pitch) - st.x * sin(pitch));
    vec2 swg;                                                             // (z, y) swing target in the body frame
    if(front) swg = mix(mix(vec2(-.34, -.6), vec2(.11, -.4), smoothstep(c0 + sw * .5, .36, fq)), vec2(.34, -.68), smoothstep(.72, .97, fq));
    else swg = fq < c0 - sw * .5 ? vec2(.28, -.72) : mix(mix(mix(vec2(-.42, -.7), vec2(-.66, -.5), smoothstep(c0 + sw * .5, .34, fq)), vec2(-.06, -.52), smoothstep(.5, .8, fq)), vec2(.28, -.72), smoothstep(.8, 1., fq));
    vec2 d = mix(swg, stb, wS);
    float Lt = L1 + L2, D = clamp(length(d), .3 * Lt, .995 * Lt), al = atan(d.x, max(-d.y, .001));
    float A = acos(clamp((L1 * L1 + D * D - L2 * L2) / (2. * L1 * D), -1., 1.));
    float th1 = al + (front ? A : -A);
    vec2 knee = L1 * vec2(-cos(th1), sin(th1));                           // (y, z)
    vec2 foot = D * vec2(-cos(al), sin(al)), kv = foot - knee;
    float th2 = atan(kv.y, -kv.x + (abs(kv.x) + abs(kv.y) < 1e-4 ? 1e-3 : 0.));
    vec3 r = p - aPivot; float t = aAnim.y;
    if(t < .99){ r.yz = rot(r.yz, th1); n.yz = rot(n.yz, th1); }
    else { float a2 = t < 1.01 ? .5 * (th1 + th2) : th2; vec2 q = rot(vec2(r.y + L1, r.z), a2); r.yz = knee + q; n.yz = rot(n.yz, a2); }
    p = aPivot + r;
  } else if(part > 1.5 && part < 2.5){
    float a = (-.8 * pitch - .16 * air + .05 * sin(uTime * 1.3 + seed * 9.)) * aAnim.x;
    vec3 dd = p - aPivot; dd.yz = rot(dd.yz, a); n.yz = rot(n.yz, a); p = aPivot + dd;
    if(aAnim.y > .5) p.x += sign(p.x) * .02 * sin(uTime * 7. + seed * 31.);
  } else if(part > 2.5){
    float a = -(.35 + 1.5 * air + .25 * sin(uTime * 9. + seed * 17.)) * aAnim.y;
    vec3 dd = p - aPivot; dd.yz = rot(dd.yz, a); p = aPivot + dd;
  }
  p.yz = rot(vec2(p.y - B.y, p.z), pitch) + vec2(B.y, 0.); n.yz = rot(n.yz, pitch);
  p.y += yb;
  float vis = visOf(inside(w, iA.y, seed));
  p *= sc * vis;
  vec3 Z = vec3(lx.y, 0., 1.) / len, X = vec3(Z.z, 0., -Z.x);
  vec3 lp = vec3(lx.x, 0., zw) + X * p.x + vec3(0., p.y, 0.) + Z * p.z;
  vec3 ln = X * n.x + vec3(0., n.y, 0.) + Z * n.z;
  vec4 wp = modelMatrix * vec4(lp, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix) * ln;
  vColor = color * iTint;
  vWet = 1. - smoothstep(.3, .78, position.y);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LECHWE_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce; uniform float uWaterW;
varying vec3 vColor, vN, vWorld; varying float vWet;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
  float ndl = dot(N, uSunDir), nv = max(dot(N, V), 0.);
  float wet = vWet * .75;
  vec3 alb = vColor * (1. - .4 * wet);
  vec3 hemi = mix(uBounce, uSkyCol, smoothstep(-.7, .7, N.y)) * .6;
  vec3 c = alb * (hemi + uSunCol * (max(ndl, 0.) * .85 + .15 * max(ndl * .5 + .5, 0.))) * .3183;
  float fr = 1. - nv; fr *= fr; fr *= fr;
  float toSun = smoothstep(-.15, .85, dot(-V, uSunDir));
  c += uSunCol * (.3 + alb) * (fr * toSun * smoothstep(-.55, .2, ndl) * .75);        // lit rim along back and horns
  c += uSkyCol * (fr * .12);
  vec3 Hv = normalize(V + uSunDir + vec3(0., 1e-4, 0.));
  float sp = max(dot(N, Hv), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  c += uSunCol * sp * (.06 + .55 * wet);                                             // wet hide
  float under = 1. - smoothstep(uWaterW - .2, uWaterW + .02, vWorld.y);                   // legs under the surface
  c = mix(c, uBounce * .09 + c * .25, under);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---- spray. Stateless: every quad finds its own landing from the stride clock, so plumes stay where they
// were born while the animal leaps on. Premultiplied alpha, no depth write.
const SPRAY_COMMON = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uSprayCol; uniform vec4 uSprayK;   // uSprayK: x sun gain on the curtain, y on crowns and foam, z curtain top raggedness, w unused
float vh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(vh(i), vh(i + vec2(1., 0.)), f.x), mix(vh(i + vec2(0., 1.)), vh(i + vec2(1., 1.)), f.x), f.y); }
// round drops: one soft disc to a cell, a third of the cells empty
float spDrops(vec2 p){ vec2 i = floor(p), f = fract(p) - .5; vec2 o = (vec2(vh(i + 3.7), vh(i + 11.3)) - .5) * .56; float rad = .07 + .11 * vh(i + 5.1);
  return (1. - smoothstep(rad * .45, rad, length(f - o))) * step(.5, vh(i + 17.9)); }
// foam lace: thin curling lines along the contours of two noises, feathered, never a tile
float spLace(vec2 p){ float a = vnoise(p) + .5 * vnoise(p * 2.07 + 5.3), b = vnoise(p * 1.31 + 9.1) + .5 * vnoise(p * 2.9 - 3.7);
  return max(1. - smoothstep(0., .13, abs(a - .75)), .8 * (1. - smoothstep(0., .1, abs(b - .72)))); }
// forward scatter: bright only when the eye looks through the spray toward the sun
float scatter(vec3 world){ vec3 ray = normalize(world - cameraPosition + vec3(0., 1e-5, 0.)); float s = max(dot(ray, uSunDir), 0.), s2 = s * s, s4 = s2 * s2; return .08 + .2 * s2 + .72 * s4 * s4; }
// the hanging mist glows over a wide arc round the sun; drops, foam and wake rings only close to it
float scatterWide(vec3 world){ vec3 ray = normalize(world - cameraPosition + vec3(0., 1e-5, 0.)); float s = max(dot(ray, uSunDir), 0.), s2 = s * s; return .15 + .5 * s2 + .3 * s2 * s2 * s2; }
`;
const CROWN_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aK; attribute vec4 iA, iB;
uniform vec4 uGait, uCrown;   // uCrown: x width m, y height m, z launch speed m/s, w strides a crown lives
varying vec2 vP; varying vec3 vWorld; varying vec4 vInfo;   // vInfo: age s, seed, power, visibility
${LANE_GLSL}
void main(){
  float sc = iB.x, seed = iB.z, w = wrapS(iA.x), zw = uHerd.x + w, lam = iA.w;
  float ph = (zw + iA.z) / lam, nS = floor(ph), f = ph - nS, back = (f + aK) * lam;
  float age = back / max(uLane.y, .1), nL = nS - aK;
  float high = mod(nL - 1. + floor(seed * 37.), iB.w) < .5 ? 1. : 0.;
  float zl = zw - back + .062 * lam + .2 * sc;
  vec2 lx = laneX(zl, iA.y);
  float vis = visOf(inside(w - back, iA.y, seed)) * step(aK + .5, uCrown.w + .5);
  vec4 c = modelMatrix * vec4(lx.x, uLane.z, zl, 1.);
  vis *= smoothstep(2., 7., distance(cameraPosition, c.xyz));          // never a card across the lens
  float pw = (.7 + .45 * h11(nL * .71 + seed)) * (1. + .3 * high) * sqrt(sc);
  float W = uCrown.x * pw, Hq = uCrown.y * pw;
  vec2 tc = cameraPosition.xz - c.xz; tc /= max(length(tc), 1e-3);
  vec3 wp = c.xyz + vec3(tc.y, 0., -tc.x) * (position.x * W * vis) + vec3(0., position.y * Hq * vis, 0.);
  vP = vec2(position.x * W, position.y * Hq); vWorld = wp; vInfo = vec4(age, seed + nL * .137, sqrt(pw), vis);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CROWN_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec4 uCrown;
varying vec2 vP; varying vec3 vWorld; varying vec4 vInfo;
${SPRAY_COMMON}
void main(){
  float t = max(vInfo.x, .02), seed = vInfo.y, pw = vInfo.z * vInfo.z, v0 = uCrown.z * vInfo.z;
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv), down = clamp(Vv.y / max(dist, 1e-3), 0., 1.);
  // every drop left the landing point at t = 0: the launch velocity that puts a drop HERE now
  vec2 vel = vec2(vP.x, vP.y + 4.9 * t * t) / t;
  float sp = length(vel) / max(v0, .1);
  float an = atan(vel.x, max(vel.y, 1e-3)) - (fract(seed * 3.71) - .5) * .5;        // every burst is thrown its own way
  // a broad low fan with a torn rim, not a jet: how fast the fastest water left in each direction
  float rim = .66 + .3 * vnoise(vec2(an * 2.1 + seed * 17., seed * 3.)) + .09 * vnoise(vec2(an * 7.3, seed * 9.));   // broad lobes, never spikes
  float fan = 1. - smoothstep(.85, 1.3, abs(an));
  float sheet = (1. - smoothstep(rim - .4, rim, sp)) * fan;
  float flung = smoothstep(rim - .2, rim, sp) * (1. - smoothstep(rim + .05, rim + .55, sp)) * fan;      // loose drops thrown clear of the rim
  // the sheet tears into soft ligaments as it flies; the pattern lives in launch space, so it rides with the water
  vec2 q = vel * .8 + seed * 13.;
  float lig = vnoise(q * vec2(1.7, .8)) * .5 + vnoise(q * 3.9 + 3.) * .3 + vnoise(q * 9.1 - 7.) * .2;
  float tear = smoothstep(.04, .7, t);
  float body = smoothstep(mix(.1, .42, tear), mix(.5, .8, tear), lig) * (.5 + .5 * smoothstep(.25, .95, sp / max(rim, .2)));
  // round drops, a few centimetres across: one to a cell of launch space, some cells empty; far away they melt into the mist
  float near = 1. - smoothstep(16., 42., dist);
  float beads = spDrops(q * 3.3 + 5.) * smoothstep(.15, .5, sp) * (.35 + .65 * tear) * near;
  float drops = spDrops(q * 2.3 + 9.) * flung * near + flung * .1 * (1. - near);
  float fade = 1. - smoothstep(.5, 1.1, t);
  // the froth where it struck: a low torn mound that hugs the water, no dome (seen from above the ring of foam carries it)
  vec2 fq = vec2(vP.x / (.6 + 1.5 * t), (vP.y - .05) / (.2 + .55 * t));
  float froth = exp(-dot(fq, fq) * 1.9) * (1. - smoothstep(.08, .55, t)) * (.35 + .65 * lig) * (1. - .75 * smoothstep(.2, .55, down));
  float dens = ((sheet * (body * .7 + beads * .9) + drops) * fade + froth * .45) * (.75 + .25 * pw);
  // the fine mist each landing leaves hanging: a soft ball that swells and thins
  float life = 1.9, mr = .55 + .7 * t; vec2 mq = (vP - vec2(0., .3 + .4 * t)) / vec2(mr * 1.4, mr);
  float mist = exp(-dot(mq, mq) * 1.6) * .07 * smoothstep(0., .12, t) * (1. - smoothstep(.45 * life, life, t)) * (.6 + .4 * vnoise(vP * 2.3 + seed * 5.));
  float hw = max(uCrown.x * pw * .5, .1), hh = max(uCrown.y * pw, .1);
  float inQuad = (1. - smoothstep(.8, 1., abs(vP.x) / hw)) * (1. - smoothstep(.85, 1., vP.y / hh)) * smoothstep(0., .3, vP.y + .12 * lig);
  float a = clamp(dens * .8 + mist, 0., .8) * vInfo.w * inQuad;
  if(a < .004) discard;
  float fs = scatter(vWorld), glint = (beads * sheet + drops) * fade;
  dens = min(dens, 1.);
  vec3 wet = uSprayCol * .6 + uSunCol * uSprayK.y * (.05 + fs * (.5 + .9 * glint)) + uSunCol * glint * .07;
  vec3 fog1 = uSprayCol * .5 + uSunCol * uSprayK.y * (.02 + fs * .22);
  vec3 c = mix(fog1, wet, dens / max(dens + mist, 1e-3));
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

// rings, foam and shadows lying on the water
const FLAT_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aK; attribute vec4 iA, iB;
uniform vec4 uGait; uniform vec3 uSunLocal; uniform float uRingLife;
varying vec2 vP; varying vec3 vWorld; varying vec4 vInfo;   // age s, seed, kind (0 ring, 1 shadow), visibility
${LANE_GLSL}
float leapOf(float n, float seed, float per){ return mod(n + floor(seed * 37.), per) < .5 ? uGait.y : uGait.x * (.8 + .4 * h11(n * .37 + seed)); }
void main(){
  float sc = iB.x, seed = iB.z, w = wrapS(iA.x), zw = uHerd.x + w, lam = iA.w;
  float ph = (zw + iA.z) / lam, nS = floor(ph), f = ph - nS, f0 = uGait.z;
  bool shadow = aK > uRingLife - .5;
  float back = shadow ? 0. : (f + aK) * lam, age = back / max(uLane.y, .1);
  float zl = shadow ? zw : zw - back + .062 * lam + .2 * sc;
  vec2 lx = laneX(zl, iA.y); float len = sqrt(1. + lx.y * lx.y);
  vec3 Z = vec3(lx.y, 0., 1.) / len, X = vec3(Z.z, 0., -Z.x);
  vec3 c = vec3(lx.x, uLane.z + .02, zl); vec2 size = vec2(8.) * sqrt(sc);
  float vis = visOf(inside(w - back, iA.y, seed));
  if(shadow){
    float psi = clamp((f - f0) / (1. - f0), 0., 1.), yb = f < f0 ? 0. : leapOf(nS, seed, iB.w) * 4. * psi * (1. - psi);
    float h = yb + .75 * sc; vec2 sh = -uSunLocal.xz / max(uSunLocal.y, .12);
    c.xz += sh * min(h, 6.);
    size = vec2(1.1, 2.3) * sc * (1. + .12 * yb); age = yb;
  }
  vec3 lp = c + (X * position.x * size.x + Z * position.z * size.y) * vis;
  vec4 wp = modelMatrix * vec4(lp, 1.);
  vP = position.xz * size; vWorld = wp.xyz; vInfo = vec4(age, seed + (nS - aK) * .137, shadow ? 1. : 0., vis);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLAT_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uRingT; uniform vec3 uHorizon;
varying vec2 vP; varying vec3 vWorld; varying vec4 vInfo;
${SPRAY_COMMON}
void main(){
  float t = vInfo.x, seed = vInfo.y, r = length(vP);
  vec3 c; float a;
  if(vInfo.z > .5){                                   // shadow: slides away from the sun as the animal rises
    vec2 q = vP / vec2(.55, 1.15) / (1. + .12 * t); a = exp(-dot(q, q) * 3.) * .55 / (1. + .25 * t); c = vec3(.012, .02, .03);
  } else {
    float fade = 1. - smoothstep(.45 * uRingT, uRingT, t);
    float rf = .35 + 2.1 * pow(max(t, 0.), .72);
    float wgl = .1 + .12 * t, r1 = (r - rf) / wgl, r2 = (r - rf * .58) / wgl;
    float crest = exp(-r1 * r1) + .6 * exp(-r2 * r2);
    vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
    // foam: lace that spreads and thins, a soft bloom at its heart, fine bubbles under the eye; no hard patch
    vec2 fp = vP * (1.5 / (1. + .5 * t)) + seed * 7.;
    float lace = spLace(fp) * .75 + spLace(fp * 2.7 + 3.) * .45 * (1. - smoothstep(8., 26., dist));
    float bub = vnoise(vP * 17. + seed * 3.) * vnoise(vP * 29. - seed * 5.) * (1. - smoothstep(4., 14., dist));
    float reach = 1. - smoothstep(.1 + .5 * t, .75 + 1.15 * t, r + .25 * (vnoise(vP * 1.9 + seed) - .5));
    float foam = reach * (lace * (.45 + .55 * reach) + smoothstep(.3, .46, bub) * .34 + .3 * exp(-r * r * 5. / (1. + 3. * t))) * (1. - smoothstep(.2, 1.25, t));
    float fs = scatter(vWorld);
    float graze = 1. - max(V.y, 0.); graze *= graze;
    a = clamp(crest * fade * (.07 + .26 * graze) + foam * .5, 0., .78);
    c = mix(mix(uSkyCol, uHorizon, .5) * 1.05 + uSunCol * fs * .8 * crest, uSprayCol * .62 + uSunCol * (.06 + fs * .3), smoothstep(0., .35, foam));
  }
  a *= vInfo.w;
  if(a < .004) discard;
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

// the hanging curtain: soft quads fixed in the world, each aged by the time since the herd's front passed it
const CURTAIN_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 iC;            // x phase along the trail m, y lateral position 0..1, z seed, w width m
uniform vec4 uCurt;           // x trail period m, y seconds the mist outlives the herd, z full height m, w opacity
uniform vec4 uWind;           // xyz drift m/s (local), w build seconds
uniform vec4 uCurtB;          // x, y lateral band of the mist in the herd's frame (m), z height the newest mist starts at, w unused
varying vec2 vUv; varying vec3 vWorld; varying vec3 vInfo;   // density, seed, age
${LANE_GLSL}
void main(){
  float front = uHerd.x + uHerd.z * .5, back = mod(front - iC.x, uCurt.x), zq = front - back;
  float age = back / max(uLane.y, .1), tail = uHerd.z / max(uLane.y, .1), seed = iC.z;
  float tr = smoothstep(uHerd.z * .75, uHerd.z * 1.15, back);
  vec2 lx = laneX(zq, mix(mix(uCurtB.x, uCurtB.y, iC.y), mix(-uEnv.w + 4., uEnv.w + 6., iC.y), tr));
  float dens = smoothstep(0., uWind.w, age) * (1. - smoothstep(tail * .8, tail + uCurt.y, age * (.85 + .3 * seed)));
  float Hq = mix(uCurtB.z, uCurt.z, smoothstep(0., uWind.w * 1.4, age)) * (.72 + .56 * seed), W = iC.w * (1. + .012 * age);
  vec3 lp = vec3(lx.x, uLane.z, zq) + uWind.xyz * age * (.6 + .8 * h11(seed * 9.));
  vec4 c = modelMatrix * vec4(lp, 1.);
  vec2 tc = cameraPosition.xz - c.xz; float dc = length(tc); tc /= max(dc, 1e-3);
  dens *= smoothstep(5., 22., dc);                    // thins out round the lens instead of popping
  float show = step(.004, dens);
  vec3 wp = c.xyz + (vec3(tc.y, 0., -tc.x) * (position.x * W) + vec3(0., position.y * Hq, 0.)) * show;
  vUv = vec2(position.x * 2., position.y); vWorld = wp; vInfo = vec3(dens, seed, age);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CURTAIN_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec4 uCurt; uniform float uTime; uniform vec3 uDust;
varying vec2 vUv; varying vec3 vWorld; varying vec3 vInfo;
${SPRAY_COMMON}
void main(){
  float seed = vInfo.y, x = vUv.x, y = vUv.y;
  // one standing column of mist: big slow billows, fine ones that climb, a domed cauliflower head
  vec2 q = vec2(x * 1.5 + seed * 13., y * 1.9 - uTime * .07 + seed * 5.);
  float n = vnoise(q + vec2(uTime * .04, 0.)) * .6 + vnoise(q * 2.3 - vec2(uTime * .06, uTime * .03)) * .4;
  float n2 = vnoise(q * 5.1 + vec2(0., uTime * .2)) * .62 + vnoise(q * 11.7 - vec2(uTime * .11, -uTime * .27)) * .38;
  float top = .76 + .2 * n + uSprayK.z * (n2 - .5) * .45;                              // where this billow gives out
  float head = 1. - smoothstep(top - .1, top + .03, y + .24 * x * x);
  float side = 1. - smoothstep(.42, 1., abs(x) + .24 * (n - .5));
  float body = side * head * smoothstep(0., .035, y);
  float a = body * (.55 + .6 * n) * (.8 + .4 * n2) * vInfo.x * uCurt.w;
  if(a < .003) discard;
  float fs = scatterWide(vWorld);
  // thick mist shades itself: the heart of a billow is cooler and dimmer, its crest and its ragged rim burn
  float heart = smoothstep(.2, .9, body * (.5 + .7 * n));
  float crest = smoothstep(top - .3, top, y) * (.6 + .4 * n2);
  float lit = (.42 + .58 * (1. - heart)) * (.7 + .6 * n2) + .5 * crest;
  vec3 amb = mix(uSprayCol * (.3 + .12 * y), uDust, uDust.r > 0. ? .45 * (1. - y) : 0.);
  vec3 c = amb + uSunCol * uSprayK.x * (.03 + fs * lit * 1.05);
  gl_FragColor = vec4(c, min(a, .86));
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

// the floodplain under the herd: sky mirror at grazing angles, tea-gold bed looking down, grass tips, the
// sun's glitter road, and the churned wake lying across it like a road. WAKE_ONLY draws just the wake.
const SHEET_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vLocal, vWorld;
void main(){
  vLocal = position; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHEET_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uHorizon, uDeep, uGrassA, uGrassB, uBed; uniform vec4 uWake;   // uWake: x trail length m, y pool radius m, z strength, w grass
varying vec3 vLocal, vWorld;
${LANE_GLSL}
${SPRAY_COMMON}
void main(){
  vec2 p = vLocal.xz; float t = uTime;
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  // the wake: inside the herd's band, from its front back along the trail
  float qw = (p.y - uWheel.x) / uWheel.y; float d = p.x - .5 * uLane.x * p.y * p.y + uWheel.z * exp(-qw * qw), front = uHerd.x + uHerd.z * .5, behind = front - p.y;
  float q = (p.y - uPool.x) / uPool.w, g = exp(-q * q), hw = uEnv.w + 3. + uPool.z * .1 * g;
  float band = 1. - smoothstep(hw - 9., hw + 5., abs(d) + 4. * (vnoise(vec2(p.y * .05, d * .02)) - .5));
  float fresh = smoothstep(-6., 22., behind) * (1. - smoothstep(uHerd.z * .9, uHerd.z + uWake.x, behind));
  float inHerd = smoothstep(-6., 22., behind) * (1. - smoothstep(uHerd.z * .7, uHerd.z * 1.2, behind));
  float qp = (uPool.x - uWheel.x) / uWheel.y; vec2 pc = vec2(.5 * uLane.x * uPool.x * uPool.x + uPool.y - uWheel.z * exp(-qp * qp), uPool.x); float pr = length(p - pc);
  float pool = uPool.z > 0. ? 1. - smoothstep(uWake.y - 3., uWake.y + 1.5, pr + 2.5 * (vnoise(p * .12) - .5)) : 0.;
  float wake = band * fresh * (1. - pool) * uWake.z;
  float dw = d + 3. * (vnoise(p * .13) - .5) + 1.2 * (vnoise(p * .47 + 4.) - .5);
  float streak = (vnoise(vec2(dw * .8, p.y * .16 + 3.)) * .55 + vnoise(vec2(dw * 1.9, p.y * .41)) * .45) * (.72 + .56 * vnoise(p * 1.3 + 7.));
  float fnear = 1. - smoothstep(8., 30., dist);
  float flace = spLace(vec2(dw * 1.15, p.y * .62) + t * .03) * .7 + spLace(vec2(dw * 3.1, p.y * 1.9) + 7.) * .5 * fnear + smoothstep(.34, .52, vnoise(p * 15.) * vnoise(p * 27. + 3.)) * .22 * (1. - smoothstep(4., 13., dist));
  float foam = wake * smoothstep(.56 - .08 * inHerd, 1.02, streak + .18 * vnoise(p * 2.9 + t * .15)) * flace * (.25 + .5 * inHerd);
#ifdef WAKE_ONLY
  if(wake < .01) discard;
#endif
  // ripples: wind cat's paws plus the chop the herd leaves
  float amp = (.03 + .07 * wake) / (1. + dist * .012);
  vec2 rp = vec2(sin(p.x * 1.3 + t * 1.1 + 2. * sin(p.y * .7 - t * .6)), sin(p.y * 1.7 - t * 1.3 + 2. * sin(p.x * .9 + t * .5)));
  rp += 1.6 * (vec2(vnoise(p * 2.7 + t * .4), vnoise(p * 2.7 + 17. - t * .35)) - .5);
  vec3 N = normalize(vec3(rp.x * amp, 1., rp.y * amp));
  float nv = max(dot(N, V), 0.), fres = .025 + .975 * pow(clamp(1. - nv, 0., 1.), 5.);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float toS = max(dot(normalize(R.xz + vec2(1e-4, 0.)), normalize(uSunDir.xz + vec2(1e-4, 0.))), 0.); toS *= toS * toS;
  vec3 sky = mix(mix(mix(uHorizon, uSkyCol, .72) * .84, uHorizon * .95, toS * .35), uSkyCol * .9, smoothstep(0., .26, R.y));   // a blue mirror; warm only down the sun's road
  float sr = max(dot(R, uSunDir), 0.), s8 = sr * sr; s8 *= s8; s8 *= s8;
  float spark = vnoise(p * 5. + vec2(t * 1.3, -t)) * vnoise(p * 9. - vec2(t, t * 1.7));
  float s64 = s8 * s8; s64 *= s64; s64 *= s64;
  float glit = s64 * s64 * smoothstep(.32, .5, spark) * .8;
  // looking down: clear tea-gold water over pale sand and dark weed; deep blue in the pool
  float weed = smoothstep(.45, .7, vnoise(p * .23 + 9.) * .6 + vnoise(p * .9) * .4);
  vec3 bed = mix(uBed, uBed * vec3(.35, .42, .24), weed * .6) * (uSunCol * max(uSunDir.y, 0.) * .3183 * .8 + uSkyCol * .25);
  bed = mix(bed, uDeep * .16, pool);
  vec3 stir = uBed * vec3(.5, .52, .34) * (uSunCol * max(uSunDir.y, 0.) * .3183 + uSkyCol * .35);
  bed = mix(bed, stir, wake);
  vec3 c = mix(bed, sky, fres * (1. - .4 * wake)) + uSunCol * glit;
  // grass and sedge tips standing through the water: more of them the lower the eye, bent flat in the wake
  float gn = vnoise(p * .17) * .45 + vnoise(p * .6) * .35 + vnoise(p * 2.4) * .2;
  float tips = mix(smoothstep(.4, .72, vnoise(p * vec2(13., 9.)) * .5 + vnoise(p * vec2(31., 37.)) * .5), .42, smoothstep(8., 55., dist));
  float cover = clamp(smoothstep(.3, .62, gn + .3 * vnoise(p * .04 + 3.)) * tips * (.5 + 1.1 * (1. - nv) * (1. - nv)), 0., .8) * uWake.w * (1. - pool) * (1. - .85 * wake);
  float toSun = max(dot(-V, uSunDir), 0.);
  vec3 grass = mix(uGrassB, uGrassA, smoothstep(.3, .8, vnoise(p * .31 + 5.))) * (uSkyCol * .5 + uSunCol * (.3 + 1.1 * toSun * toSun)) * .3183;
  c = mix(c, grass, cover);
  vec3 fc = uSprayCol * .55 + uSunCol * (.05 + .22 * scatter(vWorld));
  c = mix(c, fc, clamp(foam, 0., .8));
#ifdef WAKE_ONLY
  gl_FragColor = vec4(mix(mix(stir, sky, .3 + fres * .6) + uSunCol * glit, fc, clamp(foam, 0., .8)), clamp(wake * .34 + foam, 0., .85));   // the stirred water stays a mirror: the sky still lies on it
#else
  gl_FragColor = vec4(c, 1.);
#endif
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------
const HOURS = {
  afternoon: { elev: 24, sun: '#fff1cf', sunI: 3.1, skyI: 1.0, horizon: '#eadfc6', spray: '#f3f6f8', bounce: 0.75 },
  golden: { elev: 9, sun: '#ffb25c', sunI: 2.7, skyI: 0.8, horizon: '#f2c48e', spray: '#f6e2c8', bounce: 0.6 },
  dawn: { elev: 7, sun: '#ffb9a2', sunI: 1.7, skyI: 0.7, horizon: '#e8c3bd', spray: '#e9dfe2', bounce: 0.55 },
  night: { elev: 32, sun: '#a9bde6', sunI: 0.42, skyI: 0.12, horizon: '#1c2a44', spray: '#aebdd8', bounce: 0.1 },
};
const quadGeo = (ks, flat) => {   // ks.length quads; upright (x -0.5..0.5, y 0..1) or flat (x, z -0.5..0.5)
  const pos = [], ak = [], idx = [];
  ks.forEach((k, i) => {
    for (const [a, b] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]]) { if (flat) pos.push(a, 0, b - 0.5); else pos.push(a, b, 0); ak.push(k); }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(ak, 1)); g.setIndex(idx);
  return g;
};
const instanced = (base, attrs, count) => {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][0], attrs[k][1]));
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const P = (opts.palette && opts.palette.length >= 7 ? opts.palette : BRIEF_PALETTE).map(C);
  const buffalo = opts.cast === 'buffalo', hour = HOURS[opts.hour] || HOURS.afternoon, weather = opts.weather || 'clear', season = opts.season || 'flood';
  const pal = { gold: P[0], sedge: P[1], deep: P[2], sky: P[3], cream: P[4], coat: buffalo ? C('#2b2622') : P[5], culm: P[6] };

  // ---- the run
  const L = 300, HALF = 30, WMAX = HALF + 2, waterY = opts.waterY ?? 0.3;
  const speed = opts.speed ?? (buffalo ? 9 : 13), duration = opts.duration ?? 42, travel = opts.travel ?? speed * duration;
  let zStart = opts.zStart ?? -155 - 0.56 * travel;
  const arc = opts.arc ?? rng.range(0.00026, 0.00042);
  const pool = opts.pool === false ? null : { z: opts.pool?.z ?? 40, d: opts.pool?.d ?? rng.range(-7, 3), radius: opts.pool?.radius ?? 20, sigma: 44 };
  const pushR = pool ? pool.radius + 4 : 0, poolZ = pool ? pool.z : 0, poolD = pool ? pool.d : 0, sigma = pool ? pool.sigma : 44;
  const wheel = opts.wheel ? { z: opts.wheel.z ?? 0, sigma: Math.max(opts.wheel.sigma ?? 60, 1), amp: opts.wheel.amp ?? 0 } : { z: 0, sigma: 60, amp: 0 };
  const wheelAt = (z) => { const q = (z - wheel.z) / wheel.sigma; return wheel.amp * Math.exp(-q * q); };
  const lane0 = (z, d) => { const dd = d - poolD, q = (z - poolZ) / sigma; return 0.5 * arc * z * z + d + (dd < 0 ? -1 : 1) * pushR * Math.max(1 - Math.abs(dd) / WMAX, 0) * Math.exp(-q * q); };
  const laneX = (z, d) => lane0(z, d) - wheelAt(z);
  const flankX = (z) => lane0(z, -HALF);          // the flank lane before any wheel: the anchors are laid out along this
  const centerZ = (u) => zStart + travel * u;

  // ---- sun and colours
  const az = rng.range(-0.12, 0.12), el = (hour.elev * Math.PI) / 180;
  const sunLocal = opts.sunDir ? new THREE.Vector3(...opts.sunDir).normalize() : new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const hazeK = weather === 'haze' ? 0.6 : 1;
  const U = {
    uHerd: { value: new THREE.Vector4(0, 0, L, 1) }, uPool: { value: new THREE.Vector4(poolZ, poolD, pushR, sigma) },
    uLane: { value: new THREE.Vector4(arc, speed, waterY, WMAX) }, uEnv: { value: new THREE.Vector4(rng.range(36, 56), rng.range(22, 40), rng.range(-12, 12), HALF) },
    uTime: { value: 0 }, uWaterW: { value: waterY }, uWheel: { value: new THREE.Vector4(wheel.z, wheel.sigma, wheel.amp, 0) },
    uGait: { value: new THREE.Vector4(buffalo ? 0.3 : 0.9, buffalo ? 0.5 : 1.6, 0.2, buffalo ? 0.05 : 0.08) },
    uSunDir: { value: sunLocal.clone() }, uSunLocal: { value: sunLocal.clone() },
    uSunCol: { value: C(hour.sun).multiplyScalar(hour.sunI * hazeK) },
    uSkyCol: { value: pal.sky.clone().multiplyScalar(hour.skyI) }, uHorizon: { value: C(hour.horizon).multiplyScalar(hour.skyI) },
    uBounce: { value: pal.sky.clone().lerp(C(hour.horizon), 0.5).multiplyScalar(hour.skyI * hour.bounce) },
    uSprayCol: { value: C(hour.spray).multiplyScalar(0.3 + 0.5 * hour.skyI) },
    uSprayK: { value: new THREE.Vector4(opts.curtainGain ?? 1, opts.crownGain ?? 1, 0.3, 0) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const pick = (...names) => { const o = {}; for (const n of names) o[n] = U[n]; return o; };
  const LANE_U = ['uHerd', 'uPool', 'uLane', 'uEnv', 'uTime', 'uWheel'], LIGHT_U = ['uSunDir', 'uSunCol', 'uSkyCol', 'uSprayCol', 'uSprayK'];

  // ---- the animals: three flank lanes at full detail, the rest of the river lighter
  const total = Math.round(clamp(opts.count ?? rng.range(360, 440), 280, 520));
  const nNear = Math.round(clamp(opts.nearLanes ?? 3, 3, 6));
  const nearN = Math.min(opts.nearMax ?? 150, Math.round(((total > 460 ? 111 : 120) * nNear) / 3), Math.round(total * 0.1 * nNear)), farN = total - nearN;   // the flank lanes run as thick as the river behind them
  const ramShare = opts.rams ?? rng.range(0.3, 0.46), strideLo = buffalo ? 3.2 : 5.0, strideHi = buffalo ? 4.0 : 6.2;
  const nearLanes = [-HALF, -HALF + rng.range(2.7, 3.2), -HALF + rng.range(5.6, 6.5)];   // the three flank lanes run close together: a thick rank of animals abreast of the eye
  for (let i = 3; i < nNear; i++) nearLanes.push(-HALF + 6.3 + 4.3 * (i - 2) + (i * 0.37 % 0.6) - 0.3);
  const nFar = rng.int(10, 12), farLanes = [];
  for (let i = 0; i < nFar; i++) farLanes.push(lerp(-HALF + 10.6 + 4.45 * (nNear - 3), HALF, i / (nFar - 1)) + rng.range(-0.7, 0.7));
  const fill = (lanes, n, share) => {
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iT = new Float32Array(n * 3);
    let k = 0;
    lanes.forEach((ld, li) => {
      const m = li === lanes.length - 1 ? n - k : Math.round(n * (share ? share[li] ?? 1 / lanes.length : 1 / lanes.length)), gaps = [], flank = !!share && li === 0;
      let sum = 0;
      for (let j = 0; j < m; j++) { const g = flank ? rng.range(0.78, 1.22) : (rng.chance(0.14) ? rng.range(1.8, 3.2) : rng.range(0.45, 1.2)); gaps.push(g); sum += g; }   // the flank lane has no long gaps: there is always an animal abreast of the eye
      let s = rng() * L;
      for (let j = 0; j < m; j++, k++) {
        s += (gaps[j] / sum) * L;
        const ram = rng.chance(flank ? 0.86 : share ? Math.max(ramShare, 0.6) : ramShare), calf = !ram && rng.chance(0.12);   // the big rams run on the outside
        const sc = (buffalo ? 1.45 : 1) * (ram ? rng.range(0.98, 1.08) * (share ? 1.06 : 1) : calf ? rng.range(0.66, 0.76) : rng.range(0.84, 0.95));
        const lam = rng.range(strideLo, strideHi) * (calf ? 0.92 : 1);
        iA.set([(s % L) - L / 2, ld + clamp(rng.gauss() * 0.6, -1.3, 1.3), rng() * lam, lam], k * 4);
        iB.set([sc, ram || buffalo ? 1 : 0, rng(), rng.int(7, 11)], k * 4);
        const l = rng.range(0.82, 1.14), warm = rng.range(-0.06, 0.06);
        iT.set([l * (1 + warm), l, l * (1 - warm * 1.5)], k * 3);
      }
    });
    return { iA, iB, iT, n };
  };
  const near = fill(nearLanes, nearN, nNear === 3 ? [0.42, 0.3, 0.28] : null), far = fill(farLanes, farN);
  await ctx.yield?.();
  const gHi = lechweGeometry(pal, true);
  await ctx.yield?.();
  const gLo = lechweGeometry(pal, false);
  await ctx.yield?.();
  const lechweMat = () => new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...pick(...LANE_U, 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uGait', 'uWaterW') },
    vertexShader: LECHWE_VERT, fragmentShader: LECHWE_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide,
  });
  const object = new THREE.Group(); object.name = 'delta-in-flood-hero';
  const add = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; object.add(m); return m; };
  const herdMat = lechweMat();
  add(instanced(gHi, { iA: [near.iA, 4], iB: [near.iB, 4], iTint: [near.iT, 3] }, near.n), herdMat, 0);
  add(instanced(gLo, { iA: [far.iA, 4], iB: [far.iB, 4], iTint: [far.iT, 3] }, far.n), herdMat, 0);
  await ctx.yield?.();

  // ---- spray, rings and shadows: one instance per animal, stateless
  const all = { iA: new Float32Array(total * 4), iB: new Float32Array(total * 4) };
  all.iA.set(near.iA, 0); all.iA.set(far.iA, near.n * 4); all.iB.set(near.iB, 0); all.iB.set(far.iB, near.n * 4);
  const meanT = (strideLo + strideHi) / 2 / speed, RINGS = 5, big = buffalo ? 1.35 : 1;
  const sprayMat = (vs, fs, uniforms, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...uniforms }, vertexShader: vs, fragmentShader: fs, fog: true,
    transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, ...extra,
  });
  const uCrown = { value: new THREE.Vector4(7.0 * big, 3.0 * big, 5.4 * Math.sqrt(big), 3) };   // quad wider than tall: a low torn fan about 2 m high (3 m after a high leap)
  const flats = add(instanced(quadGeo([0, 1, 2, 3, 4, 5], true), { iA: [all.iA, 4], iB: [all.iB, 4] }, total),
    sprayMat(FLAT_VERT, FLAT_FRAG, { ...pick(...LANE_U, ...LIGHT_U, 'uGait', 'uSunLocal', 'uHorizon'), uRingLife: { value: RINGS }, uRingT: { value: RINGS * meanT } },
      { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), 1);
  await ctx.yield?.();
  // ---- the hanging curtain
  const windy = weather === 'wind';
  const nCurt = Math.max(160, Math.round(360 * detail)), iC = new Float32Array(nCurt * 4), period = windy ? 660 : 520;
  for (let i = 0; i < nCurt; i++) iC.set([((i + rng()) / nCurt) * period, rng(), rng(), rng.range(15, 24)], i * 4);
  const curtH = opts.curtainHeight ?? 10.5;   // the tallest billows; the wall reads about 0.8 of this
  const uCurt = { value: new THREE.Vector4(period, windy ? 24 : 15, windy ? curtH * 0.62 : curtH, (windy ? 0.55 : 0.8) * Math.min(360 / nCurt, 1.5)) };
  const uCurtB = { value: new THREE.Vector4(opts.curtainNear ?? -HALF + 13, HALF + 9, windy ? 3.0 : 5.0, 0) };   // the mist starts just behind the flank lanes
  const uWind = { value: new THREE.Vector4(windy ? 2.3 : rng.range(0.35, 0.7), 0.03, windy ? -1.3 : rng.range(-0.4, -0.1), buffalo ? 6 : 8) };
  const uDust = { value: season === 'may' ? new THREE.Color(0.46, 0.37, 0.25) : new THREE.Color(0, 0, 0) };
  const curtain = add(instanced(quadGeo([0], false), { iC: [iC, 4] }, nCurt),
    sprayMat(CURTAIN_VERT, CURTAIN_FRAG, { ...pick(...LANE_U, ...LIGHT_U), uCurt, uCurtB, uWind, uDust }), 2);
  const crowns = add(instanced(quadGeo([0, 1, 2, 3], false), { iA: [all.iA, 4], iB: [all.iB, 4] }, total),
    sprayMat(CROWN_VERT, CROWN_FRAG, { ...pick(...LANE_U, ...LIGHT_U, 'uGait'), uCrown }), 3);
  await ctx.yield?.();

  // ---- the floodplain sheet (or just the wake road)
  const waterMode = opts.water === false ? null : opts.water === 'wake' ? 'wake' : 'full';
  let sheet = null;
  if (waterMode) {
    const g = new THREE.BufferGeometry(), x0 = waterMode === 'wake' ? -125 : -1600, x1 = waterMode === 'wake' ? 160 : 1600, z0 = zStart - L / 2 - 460, z1 = waterMode === 'wake' ? zStart + travel + L / 2 + 20 : 1500;
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, waterY, z0, x1, waterY, z0, x1, waterY, z1, x0, waterY, z1], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const wakeOnly = waterMode === 'wake';
    sheet = add(g, new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...pick(...LANE_U, ...LIGHT_U, 'uHorizon'), uDeep: { value: pal.deep }, uGrassA: { value: pal.gold }, uGrassB: { value: pal.sedge },
        uBed: { value: C('#d9c9a2') }, uWake: { value: new THREE.Vector4(420, pool ? pool.radius : 0, 1, season === 'may' ? 1.25 : 1) } },
      vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, fog: true, defines: wakeOnly ? { WAKE_ONLY: 1 } : {},
      transparent: wakeOnly, depthWrite: !wakeOnly, side: THREE.DoubleSide,
      ...(wakeOnly ? { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 } : {}),
    }), 0);
  }

  // ---- anchors
  const yFly = waterY + 3, pace = [];
  for (let z = -215; z <= -5; z += 35) pace.push([flankX(z) - 18, yFly, z]);
  const t10 = (10 * Math.PI) / 180, t6 = (6 * Math.PI) / 180, turn = [flankX(70) - 19, yFly, 70];
  const dir = new THREE.Vector3(-Math.sin(t10) * Math.cos(t6), Math.sin(t6), Math.cos(t10) * Math.cos(t6));
  const lead = [turn[0] + dir.x * 25, yFly + 0.3, turn[2] + dir.z * 25], seat = [lead[0] + dir.x * 60, waterY + 9.5, lead[2] + dir.z * 60];
  const anchors = {
    flyThrough: [[flankX(-330) - 44, yFly + 1.5, -330], [flankX(-270) - 26, yFly + 0.4, -270], ...pace, [flankX(35) - 18.5, yFly, 35], turn, lead, seat],
    paceLine: pace,
    portalSeat: { position: seat, facing: [-dir.x, 0, -dir.z], radius: 7 },
    pool: pool ? { position: [laneX(pool.z, pool.d) - (pool.d - poolD), waterY, pool.z], radius: pool.radius } : null,
    viewpoints: {
      pace: { from: [flankX(-60) - 18, yFly, -60], to: [flankX(-35) + 14, 2.2, -35] },
      far: { from: [flankX(-200) - 150, 26, -420], to: [0, 3, -40] },
    },
    herd: { speed, length: L, width: HALF * 2, zStart, travel, count: total },
    sunDir: sunLocal.toArray(), waterY,
  };
  if (pool) anchors.pool.position[0] = 0.5 * arc * pool.z * pool.z + pool.d - wheelAt(pool.z);

  // ---- viewer framing: the _part viewer orbits `center` at `radius`; opts.focus = 'pace' | 'herd' | 'pool' picks a closer look
  let center = new THREE.Vector3(0, 3, 0), radius = 190, height = 8;
  const focus = opts.focus;
  if (focus === 'pace') { center.set(flankX(-40) + 1, 1.3, -40); radius = 3; height = 5; }
  else if (focus === 'herd') { center.set(0, 2.5, 0); radius = 14; height = 8; }
  else if (focus === 'pool' && pool) { center.set(anchors.pool.position[0], 1.5, pool.z); radius = 16; height = 9; }

  // ---- the clock
  let progress = null, lastZeroTime = 0, frozen = null, settle = 0, treadW = 1;
  const _q = new THREE.Quaternion();
  const setLight = ({ sunDir, sunColor, skyColor, horizonColor } = {}) => {
    if (sunDir) { sunLocal.set(sunDir.x ?? sunDir[0], sunDir.y ?? sunDir[1], sunDir.z ?? sunDir[2]).normalize(); U.uSunLocal.value.copy(sunLocal); }
    if (sunColor) U.uSunCol.value.copy(sunColor);
    if (skyColor) U.uSkyCol.value.copy(skyColor);
    if (horizonColor) U.uHorizon.value.copy(horizonColor);
    if (skyColor || horizonColor) U.uBounce.value.copy(U.uSkyCol.value).lerp(U.uHorizon.value, 0.5).multiplyScalar(hour.bounce);
  };
  function update(dt, time) {
    U.uTime.value = time;
    if (progress == null || progress <= 0) { lastZeroTime = time; frozen = null; treadW = 1; U.uHerd.value.set(progress == null ? 0 : zStart, (speed * time) % L, L, 1); }
    else {
      if (frozen == null) { frozen = (speed * lastZeroTime) % L; settle = frozen > L * 0.5 ? L - frozen : -frozen; }
      treadW = Math.max(0, treadW - Math.max(dt || 0, 0) / 1.2);
      U.uHerd.value.set(zStart + travel * progress, opts.settle === false ? frozen : frozen + settle * smoothstep(0.18, 0.45, progress), L, treadW);
    }
    object.updateWorldMatrix(true, false);
    object.getWorldQuaternion(_q);
    U.uSunDir.value.copy(sunLocal).applyQuaternion(_q).normalize();
    U.uWaterW.value = object.matrixWorld.elements[13] + waterY;
  }
  update(0, 0);

  const nearAt = (i, cz, out = {}) => {
    const s = near.iA[i * 4], d = near.iA[i * 4 + 1], zw = cz + s, env = U.uEnv.value, k = (d - env.z) / env.w, k2 = d / env.w;
    out.x = laneX(zw, d); out.z = zw; out.sc = near.iB[i * 4]; out.ram = near.iB[i * 4 + 1] > 0.5; out.lane = d;
    out.inside = Math.min(L / 2 - env.x * k * k - 9 - s, s + L / 2 - env.y * k2 * k2 * 1.6);
    return out;
  };
  const triangles = gHi.userData.triangles * near.n + gLo.userData.triangles * far.n + total * (6 + 4) * 2 + nCurt * 2 + (sheet ? 2 : 0);
  return {
    object, radius, height, center, anchors, update,
    dispose() {},
    ground: !sheet || waterMode === 'wake', groundY: 0,
    setProgress(u) { progress = u; }, setRun(o = {}) { if (o.zStart !== undefined) { zStart = o.zStart; anchors.herd.zStart = zStart; } }, setLight, laneX, flankX, wheelAt, centerZ, nearAt, nearCount: near.n, zStartNow: () => zStart, uniforms: U,
    parts: { herdMat, flats, curtain, crowns, sheet, uCurt, uCurtB, uCrown },
    stats: { triangles, drawCalls: object.children.length, animals: total, near: near.n, far: far.n, trisNear: gHi.userData.triangles, trisFar: gLo.userData.triangles },
  };
}
