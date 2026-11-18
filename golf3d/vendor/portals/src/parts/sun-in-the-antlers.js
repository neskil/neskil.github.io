// HERO: "The Elk Who Carries the Sun" (world sun-in-the-antlers).
// Hand-off note: shots/sun-in-the-antlers/handoff.md.
//
// WHAT IT IS
//   A walking elk 940 m at the withers whose body is a window onto a fixed night sky (stars sampled by
//   view direction, so the outline slides over them), rimmed in gold, with frost-white palmate antlers
//   1,400 m across, the morning sun (a painted 160 m disc) cupped in its LEFT palm, god rays turning
//   between the tines, cranes roosting on the right antler, hoof plumes, breath clouds, snow veils and
//   an elk-shaped ptch of starry night laid on the ground behind and to its right.
//
// AXES
//   Contract space: origin on the ground under the withers, +Y up, the elk WALKS TOWARD +Z, its right
//   side is -X. The brief's "elk axes" (+x walk, +z right) map as  local = (-z_elk, y, x_elk).
//   If you would rather work in elk axes, set hero.object.rotation.y = Math.PI / 2 and use
//   hero.anchorsElk (same anchors, elk axes).
//
// OPTS
//   palette  [snow, peach, night, ice, gold, spruce, apricot] hex strings (brief palette by default)
//   detail   0.6..1 thins frost blades, cranes (never the 30 scripted ones), plume discs, veils
//   shadow   true: draw the planar night-shadow on y = groundY + 0.6 (set false if the world paints
//            the shadow itself from a mask; hero.shadow is the group, hero.sunDir the light)
//   night    'milkyway' | 'comet' | 'moon' | 'aurora' (default by seed: half milky way alone, else one
//            of the three specials on top of it)
//   fogK     how much of the scene fog the piece takes (default 0.12)
//   craneScale  multiplies the 2.8 m cranes (default 1)
//   sunDir   [x, y, z] in elk axes: the light the shading and the night shadow use (default 22 degrees up, 45 left)
//   phase0   strides added to the walk phase (the world times a hoof-fall to its rail with it)
//   craneColors  [body, wing bar, dark, crown] hex (swans, ravens); earU  u of the ear flick (hero.earU may be set later)
//   boneShade  THREE.Color-like for the antlers' shade tone (pick it against the sky); sunColors [core, ring, limb] hex
//   hero.craneClock  metres of camera travel past anchors.gate (negative before it): the scripted flocks' clock. 22 birds
//            lift off the two gate tines at about -250..-150 m, wheel round and hold lanes 16-75 m ahead of a camera on
//            the fly-through, nose-up so it sees whole painted birds, then lead it into the ring; 10 more leave the
//            brow tine for the ring at +95..+240 m. Left unset, the clock follows setProgress.
// FOR THE WORLD: hero.uniforms (uMask = 1 makes the shadow pass write a plain mask), hero.elkGeo, hero.shadowMat,
//   hero.segCount, and the exports poseElk / ELK_VERT / NIGHT (the world's calf reuses the elk mesh and walk).
//
// HOOKS
//   setProgress(u)  flight progress, 0..1 (it may run on past 1). Walk phase = 5 strides x u (stride 360 m, so
//                   scroll the ground 1,800 m x u backward and the hooves never slide), ear flick at earU.
//                   Until it is called the piece free-runs on time (one stride per 9 s) so it is never frozen.
//   hero.hoof(i)    -> { pos: Vector3 (local), down: 0..1 } for the world's own plumes / tree shake
//                   (i: 0 LH, 1 LF, 2 RH, 3 RF)
//
// LIGHTING
//   None needed: every material is unlit gouache (three flat tones split by a dry-brush noise fixed to
//   the object, 4% paper tooth). The key is the antler sun itself; hero.sunDir is the unit vector
//   toward it as the ground sees it. The antlers are lit by the disc as a point light (white bone on tops,
//   gold on faces and edges turned to the disc, cobalt-lilac shade) and carry an outline pass that is gold
//   on the disc's side, so they read in three tones from behind as well as from the front. Bloom threshold 0.92 / strength 0.35 / exposure 0.9 suit it; the
//   sun disc is held at 1.6 x white so it stays yellow. Scene fog is honoured but scaled by uFogK
//   (opts.fogK, 0.12) because the brief wants three flat haze planes, not real fog, on a 1.3 km animal.
//
// SIZE / COST
//   radius 820 (antlers reach 700 m to each side, muzzle +670, rump -900), height about 1,360 (tine
//   tips). The ground shadow runs about 3,300 m back and to the right (anchors.shadowTip).
//   About 100k triangles in 10 draw calls: elk 18k x 3 passes (night fill, gold rim, ground shadow),
//   antlers 23k x 2 (bone + shadow), sun disc, sun glow, plumes/breath, veils, cranes. Build ~140 ms.
//   No lights, no textures, no render targets.
//
// ANCHORS (hero.anchors in contract axes, hero.anchorsElk the same in elk axes)
//   portalSeat    { position, facing, radiusFree }: in the U of the RIGHT antler's fork, between the
//                 outer brow tine and the forward front tine; facing = direction of travel (about 13
//                 degrees down), radiusFree = clear radius round the seat (about 70 m)
//   flyThrough    7 points: over the right shoulder -> up behind the right antler -> `gate` (between
//                 the two inner rear tines, each ~29 m away) -> straight over the snow dish
//                 (straightLength ~370 m, >= 10 m clear of the palm rim) -> portalSeat -> 80 m beyond
//   gate, threadTines[4]  the gate point and the four tine shafts the line passes (2 rear, brow, front)
//   sun, sunRadius        centre of the 160 m disc in the left palm (rest pose; it nods with the head)
//   muzzle, rightEar, withers, rump, hooves[4] (rest), hocks[2]
//   viewpoints    entry, shadowEdge, hoofFall, flank, sunAbeam, fork: { position, lookAt } for the
//                 six frames the brief names
//   shadowTip     where the shadow of the highest tine lands
//   hero.antlers.right/left.tines[i].pts are the tine centre lines (elk axes) for perching more birds.
//
// STYLE (so the world can match it): ShaderMaterials only, no lights. Tone = dot(N, sun) * .5 + .5 plus
//   (brush(objectPos) - .5) * .3, cut with step() at .40 and .68 into shade / mid / lit; brush() is value
//   noise stretched 5:1 along one object axis, so band edges look dry-brushed and ride with the object.
//   Tooth: colour *= .96 + .08 * hash(floor(objectPos * 5.)). Shadow tone is cobalt-lilac #8FA3DC * .62,
//   never black. Stars are round dots in cube-face cells of the VIEW direction (five cell sizes), the
//   night function is NIGHT/nightSky(dir) in this file and can be pasted into the dome shader.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#EAF2FB', '#F7C9A3', '#0B1033', '#DCE8FF', '#FFD277', '#1F3B3A', '#F29B4B'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- geometry builder
class Builder {
  constructor() { this.pos = []; this.idx = []; this.seg = []; this.aux = []; }
  get count() { return this.pos.length / 3; }
  vert(x, y, z, seg, aux = 0) { this.pos.push(x, y, z); this.seg.push(seg); this.aux.push(aux); return this.count - 1; }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('seg', new THREE.Float32BufferAttribute(this.seg, 1));
    g.setAttribute('aux', new THREE.Float32BufferAttribute(this.aux, 1));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

// Catmull-Rom resample of rows of numbers (each row the same length), k steps between rows.
function resample(rows, k) {
  const out = [], n = rows.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = rows[Math.max(0, i - 1)], p1 = rows[i], p2 = rows[i + 1], p3 = rows[Math.min(n - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push(p1.map((_, c) => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(rows[n - 1].slice());
  return out;
}

// Loft a closed, round-ended form through sections [x, y, z, ru, rd, rs]:
//   ru / rd = radius toward +n / -n where n = side x tangent ("up" for a spine along +x, "front" for
//   a spine running down), rs = radius along the side axis. Ends get hemispherical caps.
function loft(B, secs, o = {}) {
  const M = o.M || 12, seg = o.seg || 0, sub = o.sub || 3, cap = o.cap ?? 0.8, minY = o.minY ?? -1e9;
  const side = new THREE.Vector3().fromArray(o.side || [0, 0, 1]).normalize();
  let rows = resample(secs, sub);
  // caps: extend past each end with shrinking rings
  const capRows = (a, b, dirSign) => {
    const t = new THREE.Vector3(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    if (t.lengthSq() < 1e-8) t.set(1, 0, 0);
    t.normalize();
    const r = (a[3] + a[4]) * 0.5 * cap, res = [];
    for (const k of [0.45, 0.78, 0.95, 1.0]) {
      const s = Math.sqrt(Math.max(0, 1 - k * k)) + (k === 1 ? 0.002 : 0);
      res.push([a[0] + t.x * r * k, a[1] + t.y * r * k, a[2] + t.z * r * k, a[3] * s, a[4] * s, a[5] * s]);
    }
    return dirSign < 0 ? res.reverse() : res;
  };
  rows = [...capRows(rows[0], rows[1], -1), ...rows, ...capRows(rows[rows.length - 1], rows[rows.length - 2], 1)];
  const t = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3();
  const base = B.count, R = rows.length;
  for (let i = 0; i < R; i++) {
    const p = rows[i], q0 = rows[Math.max(0, i - 1)], q1 = rows[Math.min(R - 1, i + 1)];
    t.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]);
    if (t.lengthSq() < 1e-8) t.set(1, 0, 0);
    t.normalize();
    n.crossVectors(side, t);
    if (n.lengthSq() < 1e-6) n.set(0, 1, 0);
    n.normalize(); b.crossVectors(t, n).normalize();
    for (let j = 0; j < M; j++) {
      const a = (j / M) * TAU, sa = Math.sin(a), ca = Math.cos(a);
      const rn = sa * (sa > 0 ? p[3] : p[4]), rb = ca * p[5];
      B.vert(p[0] + n.x * rn + b.x * rb, Math.max(minY, p[1] + n.y * rn + b.y * rb), p[2] + n.z * rn + b.z * rb, seg, i / (R - 1));
    }
  }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < M; j++) {
    const a = base + i * M + j, c = base + i * M + (j + 1) % M;
    B.quad(a, c, c + M, a + M);
  }
}

// make the triangles added since index offset i0 face outward (positive signed volume)
function fixWinding(B, i0) {
  const P = B.pos, I = B.idx; let vol = 0, cx = 0, cy = 0, cz = 0, n = 0;
  for (let i = i0; i < I.length; i += 3) { cx += P[I[i] * 3]; cy += P[I[i] * 3 + 1]; cz += P[I[i] * 3 + 2]; n++; }
  cx /= Math.max(n, 1); cy /= Math.max(n, 1); cz /= Math.max(n, 1);
  for (let i = i0; i < I.length; i += 3) {
    const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
    const ax = P[a] - cx, ay = P[a + 1] - cy, az = P[a + 2] - cz, bx = P[b] - cx, by = P[b + 1] - cy, bz = P[b + 2] - cz, qx = P[c] - cx, qy = P[c + 1] - cy, qz = P[c + 2] - cz;
    vol += ax * (by * qz - bz * qy) - ay * (bx * qz - bz * qx) + az * (bx * qy - by * qx);
  }
  if (vol < 0) for (let i = i0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; }
}
const L = (B, secs, o) => { const i0 = B.idx.length; loft(B, secs, o); fixWinding(B, i0); };
// body-type section across a spine along x: [x, top, bottom, halfWidth, z]
const S = (x, top, bot, w, z = 0) => [x, (top + bot) / 2, z, (top - bot) / 2, (top - bot) / 2, w];

// ---------------------------------------------------------------- the elk (elk axes: +x walk, +z right)
// Segment ids: 0 barrel, 1 hump, 2 neck, 3 head, 4 jaw + dewlap, 5 ear L, 6 ear R, 7 tail,
// 8 + 3 * leg + (0 upper, 1 cannon, 2 hoof); legs 0 LH, 1 LF, 2 RH, 3 RF.
const NSEG = 20;
const LEGS = [
  { hind: true, z: -110, ph: 0.0 }, { hind: false, z: -110, ph: 0.25 },
  { hind: true, z: 110, ph: 0.5 }, { hind: false, z: 110, ph: 0.75 },
];
// bind-pose joints (x, y): pivot (shoulder / hip, buried in the body), mid joint (knee / hock), fetlock
const FORE = { P: [8, 640], K: [26, 296], F: [2, 72] };
const HIND = { P: [-715, 640], K: [-806, 316], F: [-764, 72] };

function buildElk(rng, v) {
  const B = new Builder();
  const j = (a) => 1 + (rng() - 0.5) * a;         // per-seed proportion jitter
  const hump = 940 * v.hump, rump = 820, belly = 520;
  // barrel: low rump, tucked flank, deep brisket
  L(B, [S(-868, 762, 610, 84), S(-820, rump, 556, 134), S(-700, rump + 12, 505, 168), S(-520, 812, 548, 158),
    S(-300, 828, 528, 170), S(-120, 872, belly - 2, 172), S(0, 912, belly, 160), S(80, 892, 545, 128), S(128, 846, 610, 84)],
    { M: 36, sub: 4, seg: 0, cap: 0.5 });
  // shoulder hump
  L(B, [S(-310, 838, 720, 60), S(-170, 892, 700, 92), S(-20, hump + 4, 700, 104), S(70, hump - 14, 700, 94), S(150, 868, 720, 62)],
    { M: 20, sub: 4, seg: 1, cap: 0.6 });
  // neck: short and thick, with a throat mane line underneath
  L(B, [[50, 742, 0, 150, 176, 112], [150, 800, 0, 122, 150, 98], [255, 862, 0, 98, 122, 84], [352, 918, 0, 80, 92, 72]],
    { M: 22, sub: 4, seg: 2, cap: 0.5 });
  // head: long, level, forehead bump, bulbous overhung muzzle
  const mz = v.muzzle;
  L(B, [S(316, 1004, 884, 70), S(392, 1010, 876, 74), S(470, 990, 880, 58), S(545, 978, 878, 54),
    S(600, 980, 858 - 6 * mz, 60), S(628, 966, 846 - 10 * mz, 52), S(642, 940, 852 - 8 * mz, 36)],
    { M: 22, sub: 4, seg: 3, cap: 0.55 });
  // nostril pads and brow ridges (secondary forms that notch the outline)
  for (const s of [-1, 1]) {
    L(B, [[604, 930, s * 44, 18, 18, 12], [628, 918, s * 36, 20, 22, 14], [640, 900, s * 24, 14, 16, 10]], { M: 8, sub: 2, seg: 3 });
    L(B, [[372, 990, s * 62, 14, 12, 14], [410, 988, s * 66, 18, 14, 16], [446, 972, s * 54, 12, 10, 12]], { M: 8, sub: 2, seg: 3 });
  }
  // lower jaw (stops short of the nose so the muzzle overhangs) + dewlap bell
  L(B, [S(372, 900, 846, 58), S(450, 890, 850, 44), S(530, 884, 852, 36), S(578, 880, 856, 28)], { M: 14, sub: 3, seg: 4, cap: 0.6 });
  const dl = v.dewlap;
  L(B, [[452, 868, 0, 30, 34, 20], [455, 826, 0, 24, 26, 15], [458, 788 - 14 * dl, 0, 28, 28, 17], [460, 752 - 34 * dl, 0, 20, 20, 13], [461, 734 - 44 * dl, 0, 8, 8, 6]],
    { M: 14, sub: 4, seg: 4, cap: 0.9 });
  // ears: leaf blades 110 m long, flat face turned to the side
  for (const s of [-1, 1]) {
    const o = [338, 992, s * 58], d = new THREE.Vector3(-0.42, 0.62, s * 0.66).normalize(), rows = [];
    for (const [t, th, br] of [[0, 9, 14], [0.2, 10, 27], [0.45, 9, 33], [0.72, 7, 24], [0.92, 5, 11], [1, 3, 4]])
      rows.push([o[0] + d.x * t * 112, o[1] + d.y * t * 112, o[2] + d.z * t * 112, th, th, br]);
    L(B, rows, { M: 10, sub: 3, seg: s < 0 ? 5 : 6, side: [0.75, 0.6, 0.1], cap: 0.6 });
  }
  // stub tail
  L(B, [[-868, 770, 0, 20, 22, 20], [-890, 736, 0, 17, 19, 16], [-896, 700, 0, 10, 11, 9]], { M: 10, sub: 3, seg: 7, cap: 0.8 });
  // legs
  LEGS.forEach((leg, li) => {
    const z = leg.z, s0 = 8 + li * 3, zi = z * 0.82;
    if (!leg.hind) {
      // shoulder + forearm with a pointed elbow behind
      L(B, [[16, 700, zi, 96, 104, 64], [10, 610, z * 0.9, 78, 96, 60], [2, 540, z, 56, 84, 50], [8, 486, z, 46, 50, 42],
        [18, 400, z, 37, 38, 34], [25, 322, z, 30, 30, 28]], { M: 14, sub: 3, seg: s0, cap: 0.7 });
      // knobbed knee, long cannon, fetlock with a tuft behind
      L(B, [[26, 310, z, 36, 30, 33], [27, 286, z, 40, 33, 36], [22, 250, z, 25, 25, 24], [12, 160, z, 21, 23, 21],
        [5, 104, z, 22, 26, 22], [2, 76, z, 29, 40, 29]], { M: 16, sub: 3, seg: s0 + 1, cap: 0.7 });
    } else {
      // haunch, stifle bulge in front, gaskin narrowing to the hock
      L(B, [[-735, 720, zi, 120, 118, 66], [-712, 630, z * 0.9, 112, 104, 64], [-705, 552, z, 86, 78, 54], [-742, 468, z, 54, 56, 44],
        [-778, 392, z, 40, 44, 36], [-800, 336, z, 30, 36, 30]], { M: 14, sub: 3, seg: s0, cap: 0.7 });
      // sharp hock point behind, long cannon, fetlock
      L(B, [[-812, 352, z, 22, 46, 24], [-808, 318, z, 32, 54, 30], [-798, 276, z, 26, 28, 25], [-780, 170, z, 21, 23, 21],
        [-769, 104, z, 22, 26, 22], [-765, 76, z, 29, 40, 29]], { M: 16, sub: 3, seg: s0 + 1, cap: 0.7 });
    }
    // pastern + cloven hoof: two toes with a cleft, dew claws behind
    const fx = leg.hind ? HIND.F[0] : FORE.F[0];
    L(B, [[fx, 74, z, 24, 26, 24], [fx + 8, 50, z, 24, 24, 26], [fx + 16, 30, z, 22, 22, 28]], { M: 10, sub: 2, seg: s0 + 2, cap: 0.6 });
    for (const t of [-1, 1]) {
      L(B, [[fx + 10, 34, z + t * 15, 20, 20, 15], [fx + 30, 22, z + t * 17, 22, 26, 17], [fx + 52, 14, z + t * 16, 18, 20, 14], [fx + 70, 8, z + t * 12, 9, 10, 7]],
        { M: 10, sub: 3, seg: s0 + 2, cap: 0.7, minY: 0 });
      L(B, [[fx - 22, 62, z + t * 13, 9, 9, 8], [fx - 32, 46, z + t * 14, 8, 8, 7], [fx - 36, 34, z + t * 14, 4, 4, 4]], { M: 6, sub: 2, seg: s0 + 2 });
    }
  });
  return B.geometry();
}

// ---------------------------------------------------------------- shaders
const FOG_PARS = /* glsl */`
uniform vec3 fogColor; uniform float fogDensity; uniform float fogNear; uniform float fogFar; uniform float uFogK;
vec3 applyFog(vec3 c, float depth) {
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float f = 1. - exp(-fogDensity * fogDensity * depth * depth);
    #else
      float f = smoothstep(fogNear, fogFar, depth);
    #endif
    return mix(c, fogColor, clamp(f * uFogK, 0., 1.));
  #else
    return c;
  #endif
}`;
const HASH = /* glsl */`
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec4 h24(vec2 p) { vec4 q = fract(vec4(p.xyxy) * vec4(.1031, .1030, .0973, .1099)); q += dot(q, q.wzxy + 33.33); return fract((q.xxyz + q.yzzw) * q.zywx); }
float vn3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float n = i.x + i.y * 57. + i.z * 113.;
  return mix(mix(mix(h11(n), h11(n + 1.), f.x), mix(h11(n + 57.), h11(n + 58.), f.x), f.y),
             mix(mix(h11(n + 113.), h11(n + 114.), f.x), mix(h11(n + 170.), h11(n + 171.), f.x), f.y), f.z);
}
// dry-brush: streaky noise, stretched along one axis
float brush(vec3 p) { return vn3(p * vec3(1., 5., 1.)) * .6 + vn3(p * vec3(2.3, 13., 2.3) + 7.) * .4; }`;

// The night seen through the elk: a function of VIEW DIRECTION only (the world's dome can reuse it).
export const NIGHT = /* glsl */`
uniform float uTime; uniform vec3 uNightA; uniform vec3 uNightB; uniform vec3 uIce; uniform vec3 uGold; uniform vec3 uPeach;
uniform vec3 uMwN; uniform vec3 uBodyDir; uniform float uMode; uniform float uSeed;
vec3 cubeUV(vec3 d) {                       // xy = face uv (-1..1), z = face id
  vec3 a = abs(d);
  if (a.x >= a.y && a.x >= a.z) return vec3(d.yz / max(a.x, 1e-4), d.x > 0. ? 0. : 1.);
  if (a.y >= a.z) return vec3(d.xz / max(a.y, 1e-4), d.y > 0. ? 2. : 3.);
  return vec3(d.xy / max(a.z, 1e-4), d.z > 0. ? 4. : 5.);
}
// round spatter dots: returns brightness, tint selector in .y
vec2 dots(vec3 cu, float N, float rad, float keep, float salt) {
  vec2 g = cu.xy * N, id = floor(g), f = fract(g) - .5;
  vec4 h = h24(id + vec2(cu.z * 37. + salt, salt * 1.7 + uSeed));
  float r = rad * (.55 + .9 * h.z);
  float m = 1. - smoothstep(r * .7, r, length(f - (h.xy - .5) * .62));
  float tw = .72 + .28 * sin(uTime * (1.2 + 2.6 * h.w) + h.z * 40.);
  return vec2(m * step(h.w, keep) * tw, h.x);
}
float spark(vec3 cu, float N, float salt) {  // four-point sparks
  vec2 g = cu.xy * N, id = floor(g), f = fract(g) - .5;
  vec4 h = h24(id + vec2(cu.z * 19. + salt, salt + uSeed));
  vec2 q = abs(f - (h.xy - .5) * .5);
  float len = .12 + .1 * h.z, w = .012;
  float s = max((1. - smoothstep(0., w, q.y)) * (1. - smoothstep(0., len, q.x)), (1. - smoothstep(0., w, q.x)) * (1. - smoothstep(0., len, q.y)));
  s = max(s, 1. - smoothstep(.012, .03, length(q)));
  return s * step(h.w, .22) * (.75 + .25 * sin(uTime * 1.7 + h.z * 30.));
}
vec3 nightSky(vec3 d) {
  vec3 cu = cubeUV(d);
  // two flat indigo tones laid in broad dry-brushed patches
  float ptch = vn3(d * 3.1 + uSeed) + .35 * (brush(d * 9.) - .5);
  vec3 col = mix(uNightA, uNightB, step(.56, ptch) * .55);
  // milky way: a slanting band in two pale flat tones with torn edges
  float b = abs(dot(d, uMwN) + .10 * (vn3(d * 4.3 + 3.) - .5));
  float mw = 1. - smoothstep(0., .2, b);
  float tear = brush(d * 14. + 2.) - .5;
  float tone = step(.38, mw + tear * .35) + step(.74, mw + tear * .3);
  col = mix(col, mix(uNightB * 2.6, uIce * .34, .45), tone * .36);
  float rift = step(.66, vn3(d * 11. + 5.) + (brush(d * 23. + 1.) - .5) * .5) * step(.8, mw);            // dark lane
  col = mix(col, uNightA, rift * .6);
  // spatter stars in five sizes (denser inside the band) + sparks
  float dens = .30 + .35 * mw;
  vec2 s1 = dots(cu, 16., .085, dens * .55, 1.), s2 = dots(cu, 30., .10, dens * .8, 2.), s3 = dots(cu, 52., .12, dens, 3.),
       s4 = dots(cu, 84., .15, dens * 1.1, 4.), s5 = dots(cu, 130., .19, dens * 1.2, 5.);
  vec3 tA = mix(uIce, uGold, step(.72, s1.y)), tB = mix(uIce, uPeach, step(.8, s2.y));
  col = mix(col, tA * 1.45, s1.x); col = mix(col, tB * 1.25, s2.x);
  col = mix(col, uIce * 1.05, s3.x); col = mix(col, uIce * .8, s4.x * .9); col = mix(col, uIce * .6, s5.x * .8);
  col = mix(col, mix(uIce, uGold, .35) * 1.7, spark(cu, 5., 9.));
  // around the body centre: meteor strokes (every 6-10 s) and the seed's special (comet / moon / aurora)
  vec3 c = uBodyDir, t1 = normalize(cross(c, vec3(.13, 1., .07)) + vec3(1e-4, 0., 0.)), t2 = cross(t1, c);
  vec2 p = vec2(dot(d, t1), dot(d, t2)); float front = step(0., dot(d, c));
  float tt = uTime / 8., k = floor(tt), f = fract(tt) * (1.6 - .5 * h11(k + 3.));
  vec2 a0 = (vec2(h11(k), h11(k + 9.)) - .5) * vec2(.5, .24) + vec2(0., .06), dir = normalize(vec2(-.8 - .4 * h11(k + 5.), -.45));
  vec2 q = p - a0 - dir * f * .55; float al = dot(q, -dir), ac = dot(q, vec2(-dir.y, dir.x));
  float tail = .11 * smoothstep(0., .08, f);
  float stroke = step(0., al) * step(al, tail) * (1. - smoothstep(0., max(.0035 * (1. - al / max(tail, 1e-4)), 0.) + .0004, abs(ac)));
  col = mix(col, mix(uIce, uGold, .3) * 1.6, stroke * front * (1. - smoothstep(.3, .42, f)));
  if (uMode > .5 && uMode < 1.5) {           // comet: head + curved tapering tail
    vec2 cq = p - vec2(.12, .05); float ca = -cq.x * .9 + cq.y * .44, cc = cq.x * .44 + cq.y * .9 - ca * ca * .9;
    float tl = step(0., ca) * (1. - smoothstep(.0, .46, ca)) * (1. - smoothstep(0., .006 + max(ca, 0.) * .11, abs(cc)));
    col = mix(col, uIce * .95, tl * front * (.62 + .3 * step(.5, brush(vec3(cq * 40., 1.)))));
    col = mix(col, uGold * 1.7, (1. - smoothstep(.018, .024, length(cq))) * front);
  } else if (uMode > 1.5 && uMode < 2.5) {   // crescent moon riding in the chest
    vec2 mq = p - vec2(.02, .03); float moon = (1. - smoothstep(.058, .062, length(mq))) * smoothstep(.05, .054, length(mq - vec2(.03, .012)));
    col = mix(col, mix(uIce, uGold, .25) * 1.5, moon * front);
  } else if (uMode > 2.5) {                  // slow aurora curtains, flat bands
    float warp = vn3(vec3(p * 2.2, uTime * .03)) - .5;
    float y0 = .02 + .22 * warp + .05 * sin(p.x * 9. + uTime * .1);              // wavy hem of the curtain
    float hgt = .1 + .16 * vn3(vec3(p.x * 3., 4., uTime * .02));
    float stri = brush(vec3(p.x * 34. + warp * 6., p.y * .8, 2.));               // vertical dry-brush streaks
    float body = step(y0, p.y) * (1. - smoothstep(y0, y0 + hgt, p.y));
    float au = step(.42, body * (.55 + .7 * stri)) + step(.8, body * (.6 + .6 * stri));
    col = mix(col, vec3(.21, .74, .53) * .62, au * front * .26);
  }
  return col;
}`;

export const ELK_VERT = /* glsl */`
attribute float seg;
uniform mat4 uSeg[${NSEG}]; uniform float uRim; uniform float uPxK; uniform vec3 uSunW; uniform float uGroundW; uniform float uPass;
varying vec3 vW; varying vec3 vN; varying vec3 vO; varying float vDepth;
void main() {
  mat4 sm = uSeg[int(seg + .5)];
  vec4 lp = sm * vec4(position, 1.);
  vec3 n = normalize(mat3(modelMatrix) * (mat3(sm) * normal) + vec3(0., 1e-5, 0.));
  vec4 w = modelMatrix * lp;
  if (uPass > .5 && uPass < 1.5) {            // rim: back faces pushed out, never thinner than ~3 px
    float dist = length(w.xyz - cameraPosition);
    w.xyz += n * max(uRim, dist * uPxK);
  } else if (uPass > 1.5) {                   // planar night shadow thrown from the antler sun
    w.xyz -= uSunW * ((w.y - uGroundW) / max(uSunW.y, .05));
  }
  vW = w.xyz; vN = n; vO = position;
  vec4 mv = viewMatrix * w; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const ELK_FRAG = /* glsl */`
${FOG_PARS}
${HASH}
${NIGHT}
uniform float uPass; uniform vec3 uSunW; uniform vec3 uApricot; uniform vec3 uShadowSnow; uniform vec2 uScroll; uniform float uMask;
varying vec3 vW; varying vec3 vN; varying vec3 vO; varying float vDepth;
void main() {
  if (uMask > .5) { gl_FragColor = vec4(1., 0., 0., 1.); return; }   // world's shadow-mask pass
  vec3 col;
  float grain = .96 + .08 * h21(floor(gl_FragCoord.xy * .5));
  if (uPass < .5) {                           // the window: night by view direction + screen-space tooth
    vec3 d = vW - cameraPosition;
    col = nightSky(d / max(length(d), 1e-4)) * grain;
    gl_FragColor = vec4(applyFog(col, vDepth * .6), 1.); return;
  } else if (uPass < 1.5) {                   // gold outline, three flat tones, dry-brushed joins
    float s = dot(vN, uSunW) * .5 + .5 + (brush(vO * .012) - .5) * .32;
    col = mix(uApricot * .62, uGold * .95, step(.42, s));
    col = mix(col, uGold * 1.75, step(.66, s)) * grain;
  } else {                                    // night laid on the snow: starlight blue with glints
    vec2 g = vW.xz + uScroll; float fw = max(fwidth(g.x), fwidth(g.y));
    float ptch = step(.55, vn3(vec3(g * .004, 1.)) + .3 * (brush(vec3(g.x * .01, g.y * .01, 3.)) - .5));
    col = mix(uShadowSnow, uShadowSnow * 1.28, ptch);
    vec2 c = g / 46., id = floor(c), f = fract(c) - .5; vec4 h = h24(id + 3.);
    float r = max(.045, fw / 46. * 1.3);
    float glint = (1. - smoothstep(r * .6, r, length(f - (h.xy - .5) * .7))) * step(h.w, .5) * (.6 + .4 * sin(uTime * (1. + 2. * h.z) + h.x * 30.));
    col = mix(col, uIce * 1.25, glint) * (.97 + .06 * h21(floor(g * .25)));
  }
  gl_FragColor = vec4(applyFog(col, vDepth), 1.);
}`;

const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();
const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
// out = out * rotation(angle about axis through pivot)
function rotAbout(out, px, py, pz, axis, ang) {
  _m.makeTranslation(px, py, pz); out.multiply(_m);
  _m.makeRotationAxis(axis, ang); out.multiply(_m);
  _m.makeTranslation(-px, -py, -pz); out.multiply(_m);
  return out;
}
const pulse = (x) => { const f = x - Math.floor(x); return f < 0.12 ? Math.sin((f / 0.12) * Math.PI) : 0; };

// Analytic four-beat walk. phase in strides. Fills mats[NSEG] (elk axes) and hoofs[4] = {x, y, z, down, c}.
export function poseElk(mats, hoofs, phase, time, earKick) {
  const w = phase * TAU;
  const bob = -4 * Math.cos(2 * w), sway = 10 * Math.sin(w), roll = 0.012 * Math.sin(w);
  const body = mats[0].identity();
  _m.makeTranslation(0, bob, sway); body.multiply(_m);
  rotAbout(body, -380, 700, 0, AX.x, roll);
  rotAbout(body, -380, 700, 0, AX.z, 0.006 * Math.sin(2 * w + 0.6));
  mats[1].copy(body); _m.makeTranslation(0, 3 * Math.sin(2 * w + 1.2), -sway * 0.3); mats[1].multiply(_m);
  const nod = 0.034 * Math.sin(2 * w + 0.9);
  rotAbout(mats[2].copy(body), 60, 760, 0, AX.z, nod);
  rotAbout(mats[3].copy(mats[2]), 340, 930, 0, AX.z, -nod * 0.55 + 0.012 * Math.sin(w * 0.5));
  rotAbout(mats[3], 340, 930, 0, AX.y, 0.03 * Math.sin(w * 0.5 + 1.0));
  rotAbout(mats[4].copy(mats[3]), 452, 874, 0, AX.x, 0.2 * Math.sin(2 * w + 2.2));
  rotAbout(mats[4], 452, 874, 0, AX.z, 0.09 * Math.sin(2 * w + 0.4));
  const fl = pulse(time * 0.23 + 0.3) + 0.25 * Math.sin(time * 0.7), fr = Math.max(pulse(time * 0.19 + 0.7), earKick);
  rotAbout(mats[5].copy(mats[3]), 338, 992, -58, AX.x, 0.5 * fl + 0.04 * Math.sin(time * 1.3));
  rotAbout(mats[6].copy(mats[3]), 338, 992, 58, AX.x, -0.5 * fr - 0.04 * Math.sin(time * 1.1));
  rotAbout(mats[7].copy(body), -866, 786, 0, AX.x, 0.5 * pulse(time * 0.37) * Math.sin(time * 9) + 0.12 * Math.sin(time * 1.9));
  rotAbout(mats[7], -866, 786, 0, AX.z, -0.12 + 0.1 * Math.sin(2 * w));
  for (let li = 0; li < 4; li++) {
    const leg = LEGS[li], J = leg.hind ? HIND : FORE, sgn = leg.hind ? -1 : 1, shift = leg.hind ? 34 : 0;
    const c = phase - leg.ph - Math.floor(phase - leg.ph);
    let dx, lift = 0, pitch = 0;
    if (c < 0.65) { dx = lerp(117, -117, c / 0.65) + shift; pitch = -0.22 * smoothstep(0.5, 0.65, c); }
    else {
      const s = (c - 0.65) / 0.35, e = s * s * (3 - 2 * s);
      dx = lerp(-117, 117, e) + shift; lift = 70 * Math.max(0, Math.sin(Math.PI * s)) ** 1.3;
      pitch = -0.22 * (1 - s) - 0.75 * Math.sin(Math.PI * Math.min(1, s * 1.5)) * (1 - s);
    }
    const L1 = Math.hypot(J.K[0] - J.P[0], J.K[1] - J.P[1]), L2 = Math.hypot(J.F[0] - J.K[0], J.F[1] - J.K[1]);
    const px = J.P[0] + dx * 0.42, py = J.P[1] + bob * (leg.hind ? 0.5 : 1);
    const tx = J.F[0] + dx, ty = J.F[1] + lift;
    const ddx = tx - px, ddy = ty - py, dist = clamp(Math.hypot(ddx, ddy), Math.abs(L1 - L2) + 1, (L1 + L2) * 0.9995);
    const th = Math.atan2(ddy, ddx), A = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
    const a1 = th + sgn * A, kx = px + L1 * Math.cos(a1), ky = py + L1 * Math.sin(a1);
    const b1 = Math.atan2(ty - ky, tx - kx), fx = kx + L2 * Math.cos(b1), fy = ky + L2 * Math.sin(b1);
    const a0 = Math.atan2(J.K[1] - J.P[1], J.K[0] - J.P[0]), b0 = Math.atan2(J.F[1] - J.K[1], J.F[0] - J.K[0]);
    const s0 = 8 + li * 3, set = (m, nx, ny, ang, ox, oy) => {
      m.makeTranslation(nx, ny, 0); _m.makeRotationZ(ang); m.multiply(_m); _m.makeTranslation(-ox, -oy, 0); m.multiply(_m);
    };
    set(mats[s0], px, py, a1 - a0, J.P[0], J.P[1]);
    set(mats[s0 + 1], kx, ky, b1 - b0, J.K[0], J.K[1]);
    set(mats[s0 + 2], fx, fy, pitch, J.F[0], J.F[1]);
    const h = hoofs[li]; h.x = fx + 20; h.y = Math.max(0, fy - J.F[1]); h.z = leg.z; h.c = c; h.down = c < 0.65 ? 1 : 0;
  }
}

// ---------------------------------------------------------------- antlers (elk axes, rigid with the head: seg 3)
// aux >= 0: bone, value = ridge coordinate (grooves at integers); aux < 0: lying snow.
function tube(B, pts, rad, M, ridges, snow = false) {
  const n = pts.length, t = new THREE.Vector3(), nn = new THREE.Vector3(0, 1, 0), bb = new THREE.Vector3(), pt = new THREE.Vector3();
  const base = B.count, i0 = B.idx.length;
  for (let i = 0; i < n; i++) {
    t.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]);
    if (t.lengthSq() < 1e-8) t.set(0, 1, 0);
    t.normalize();
    if (i === 0) { nn.set(0.31, 0.2, 0.93); }
    nn.addScaledVector(t, -nn.dot(t));
    if (nn.lengthSq() < 1e-6) nn.set(t.y, t.z, t.x).addScaledVector(t, -(t.y * t.x + t.z * t.y + t.x * t.z));
    nn.normalize(); bb.crossVectors(t, nn);
    const r = rad(i / (n - 1));
    for (let j = 0; j < M; j++) {
      const a = (j / M) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const rr = r * (snow ? 1 : 1 + 0.07 * Math.cos(a * ridges));         // fluted section
      pt.copy(pts[i]).addScaledVector(nn, ca * rr).addScaledVector(bb, sa * rr);
      B.vert(pt.x, pt.y, pt.z, 3, snow ? -1 : (j / M) * ridges + 0.5);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < M; j++) {
    const a = base + i * M + j, c = base + i * M + (j + 1) % M; B.quad(a, c, c + M, a + M);
  }
  const c0 = B.vert(pts[0].x, pts[0].y, pts[0].z, 3, snow ? -1 : 0.5), c1 = B.vert(pts[n - 1].x, pts[n - 1].y, pts[n - 1].z, 3, snow ? -1 : 0.5);
  for (let j = 0; j < M; j++) { B.idx.push(c0, base + (j + 1) % M, base + j); B.idx.push(c1, base + (n - 1) * M + j, base + (n - 1) * M + (j + 1) % M); }
  fixWinding(B, i0);
}

// orient an open sheet (triangles from index i0) so its summed normal points along sign * dir
function orient(B, i0, dir, sign) {
  const P = B.pos, I = B.idx; let d = 0;
  for (let i = i0; i < I.length; i += 3) {
    const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    d += (uy * vz - uz * vy) * dir.x + (uz * vx - ux * vz) * dir.y + (ux * vy - uy * vx) * dir.z;
  }
  if (d * sign < 0) for (let i = i0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; }
}

// One antler. sgn = +1 right (+z), -1 left. Returns { tines: [{ pts, len, rear }], palm(s, t, lift), browTip, frontTine }.
function buildAntler(B, rng, v, sgn) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z * sgn);
  const up = new THREE.Vector3(0, 1, 0), out = { tines: [] };
  // beam with a pearled burr
  const R0 = V(398, 996, 44), B1 = V(425, 1052, 176);
  tube(B, [V(390, 978, 30), R0, V(408, 1026, 100), V(418, 1044, 140), B1, V(430, 1060, 200)], (k) => 24 - 5 * k, 12, 9);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU, c = V(398 + Math.cos(a) * 26, 1000 + Math.sin(a) * 9, 46 + Math.sin(a) * 24 * sgn * sgn);
    L(B, [[c.x - 6, c.y, c.z, 8, 8, 8], [c.x + 6, c.y, c.z, 8, 8, 8]], { M: 6, sub: 1, seg: 3, cap: 1 });
  }
  // curved swept tine: starts along dir0 in the palm plane, curls toward `toward` (mostly up)
  const tine = (root, dir0, toward, len, r0, curl, tag) => {
    const pts = [root.clone()], d = dir0.clone().normalize(), p = root.clone(), N = 11;
    for (let i = 1; i <= N; i++) {
      const k = i / N; d.lerp(toward, 0.13 * curl * (0.6 + k)).normalize();
      p.addScaledVector(d, len / N); pts.push(p.clone());
    }
    pts.unshift(root.clone().addScaledVector(dir0, -r0 * 1.6));
    const fine = resample(pts.map((q) => [q.x, q.y, q.z]), 2).map((q) => new THREE.Vector3(q[0], q[1], q[2]));
    tube(B, fine, (k) => lerp(r0, 3.4, Math.pow(k, 0.8)) * (1 + 0.5 * Math.max(0, 1 - k * 7)), 14, 7);
    // snow cap lying along the lower part
    const sp = pts.slice(1, 7).map((q, i) => q.clone().addScaledVector(up, lerp(r0, 4, i / 9) * 0.75));
    tube(B, sp, (k) => Math.max(0.6, lerp(r0, 5, k) * 0.86 * Math.max(0, Math.sin(Math.PI * (0.12 + 0.88 * k))) ** 0.6), 9, 1, true);
    const T = { pts, len, tag }; out.tines.push(T); return T;
  };
  // palm plate: s along the long axis, t across (-1 rear edge .. +1 front edge)
  const plate = (O, a, len, halfW, prof, dishK, thick, snowIn, roll = 0) => {
    const c = new THREE.Vector3().crossVectors(up, a).normalize().multiplyScalar(sgn); c.addScaledVector(up, -roll); c.addScaledVector(a, -c.dot(a)).normalize();
    const n = new THREE.Vector3().crossVectors(a, c).multiplyScalar(sgn).normalize();
    const P = (s, t, lift = 0) => new THREE.Vector3().copy(O).addScaledVector(a, len * s).addScaledVector(c, halfW * prof(s) * t)
      .addScaledVector(n, dishK * (t * t * 1.0 + s * s * 0.8) + lift);
    const NS = 26, NT = 12, i0 = B.idx.length, grid = (side) => {
      const b = B.count;
      for (let i = 0; i <= NS; i++) for (let jx = 0; jx <= NT; jx++) {
        const s = i / NS, t = (jx / NT) * 2 - 1, edge = Math.max(Math.abs(t), s > 0.5 ? (s - 0.5) * 2 : (0.5 - s) * 2);
        const bulge = Math.sqrt(Math.max(0, 1 - edge ** 4));
        const scal = 1 + 0.035 * Math.sin(s * 34) * Math.abs(t);              // scalloped rim
        const q = P(s, t * scal, side > 0 ? thick * 0.35 * bulge : -thick * 1.25 * bulge);
        B.vert(q.x, q.y, q.z, 3, (t * 0.5 + 0.5) * 9 * prof(s) + (side > 0 ? 0 : 0.25));
      }
      for (let i = 0; i < NS; i++) for (let jx = 0; jx < NT; jx++) { const q = b + i * (NT + 1) + jx; B.quad(q, q + 1, q + NT + 2, q + NT + 1); }
      return b;
    };
    const i1 = B.idx.length; grid(1); orient(B, i1, n, 1);
    const i2 = B.idx.length; grid(-1); orient(B, i2, n, -1);
    void i0;
    if (snowIn) {                                 // snow lying in the dish: a scalloped drift sheet
      const b = B.count, MS = 44, MT = 20, i3 = B.idx.length;
      for (let i = 0; i <= MS; i++) for (let jx = 0; jx <= MT; jx++) {
        const s = lerp(0.1, 0.95, i / MS), t0 = (jx / MT) * 2 - 1, wob = 0.74 + 0.07 * Math.sin(s * 23 + t0 * 2);
        const e = Math.max(Math.abs(t0), Math.abs(i / MS * 2 - 1)), heap = Math.sqrt(Math.max(0, 1 - e * e * e));
        const q = P(s, t0 * wob, thick * 0.3 + heap * (7 + 3 * Math.sin(s * 9 + t0 * 3) + 1.3 * Math.sin(s * 61 + t0 * 4) * Math.sin(t0 * 13 + s * 7)));
        B.vert(q.x, q.y, q.z, 3, -1);
      }
      for (let i = 0; i < MS; i++) for (let jx = 0; jx < MT; jx++) { const q = b + i * (MT + 1) + jx; B.quad(q, q + 1, q + MT + 2, q + MT + 1); }
      orient(B, i3, n, 1);
    }
    return { P, a, c, n };
  };
  const ax = new THREE.Vector3(-0.2 + v.sweep, 0.34, 0.95 * sgn).normalize();
  const prof = (s) => 0.2 + 0.8 * Math.sin(Math.PI * 0.86 * Math.pow(s, 0.75)) ** 0.8;
  const main = plate(V(425, 1055, 180), ax, 460, 125, prof, 30, 13, true, 0.3);
  out.palm = main.P; out.palmN = main.n;
  // nine tines: four off the rear edge (long, raked back), three off the end, two off the front
  const rear = main.c.clone().multiplyScalar(-1), lean = up.clone().addScaledVector(rear, 0.25).addScaledVector(ax, -0.12).normalize();
  const spec = [[0.3, -1, 0], [0.47, -1, 0], [0.64, -1, 0], [0.81, -1, 0], [0.98, -0.72, 1], [1.0, 0, 1], [0.98, 0.72, 1], [0.84, 1, 2], [0.6, 1, 2]];
  spec.slice(0, v.tines).forEach(([s, t, kind], i) => {
    const root = main.P(s, t * 0.9), d0 = kind === 0 ? rear.clone().addScaledVector(ax, 0.25) : kind === 1 ? ax.clone().addScaledVector(main.c, t * 0.8) : main.c.clone().addScaledVector(ax, 0.45);
    const len = kind === 0 ? rng.range(130, 172) : kind === 1 ? rng.range(100, 150) : rng.range(120, 168);
    const to = kind === 0 ? lean : kind === 1 ? up.clone().addScaledVector(ax, -0.2).normalize() : up.clone().addScaledVector(main.c, 0.15).normalize();
    tine(root, d0.addScaledVector(up, 0.25), to, len, 12, v.tineCurl, ['rear', 'end', 'front'][kind]);
  });
  // brow palm with three tines, reaching forward: the U between it and the main palm is the fork
  const bx = new THREE.Vector3(0.84, 0.1, 0.53 * sgn).normalize();
  const brow = plate(V(428, 1050, 178), bx, 200, 46, (s) => 0.45 + 0.55 * Math.sin(Math.PI * Math.pow(s, 0.7) * 0.8), 10, 10, false);
  [[-0.8, -0.5, 150], [0, 0.0, 185], [0.8, 0.5, 165]].forEach(([t, spread, len], i) => {
    const d0 = bx.clone().addScaledVector(brow.c, spread).addScaledVector(up, 0.12);
    const T = tine(brow.P(0.96, t * 0.8), d0, up.clone().addScaledVector(bx, 0.3).normalize(), len * rng.range(0.92, 1.08), 11, v.tineCurl * 0.8, 'brow');
    if (i === 0) out.browOuter = T;
  });
  out.frontTine = out.tines.find((T) => T.tag === 'front');
  return out;
}

const ANT_VERT = /* glsl */`
attribute float seg; attribute float aux;
uniform mat4 uSeg[${NSEG}]; uniform float uOut; uniform float uPxK;
varying vec3 vN; varying vec3 vO; varying vec3 vW; varying float vAux; varying float vDepth;
void main() {
  mat4 sm = uSeg[int(seg + .5)];
  vec4 w = modelMatrix * (sm * vec4(position, 1.));
  vN = normalize(mat3(modelMatrix) * (mat3(sm) * normal) + vec3(0., 1e-5, 0.));
  // outline pass: back faces pushed out, about two pixels wide at any distance
  if (uOut > .5) w.xyz += vN * clamp(length(w.xyz - cameraPosition) * uPxK * .8, .4, 10.);
  vO = position; vAux = aux; vW = w.xyz;
  vec4 mv = viewMatrix * w; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
// Gouache bone lit by the disc itself (a point light in the left palm, so the rail, which looks toward the
// dawn, still sees three tones): white bone on tops, gold on faces and edges turned to the disc, cobalt-lilac
// shade underneath; grooves; lying snow with wind scallops. uOut = 1 is the outline pass: gold toward the disc.
const ANT_FRAG = /* glsl */`
${FOG_PARS}
${HASH}
uniform vec3 uSunP; uniform float uOut; uniform float uTime;
uniform vec3 uBoneLit; uniform vec3 uBoneMid; uniform vec3 uBoneShade; uniform vec3 uSnowLit; uniform vec3 uSnowShade; uniform vec3 uGold;
varying vec3 vN; varying vec3 vO; varying vec3 vW; varying float vAux; varying float vDepth;
void main() {
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 L = uSunP - vW; L /= max(length(L), 1e-3);
  float sunF = dot(n, L);
  float br = brush(vO.yxz * .05) - .5 + (brush(vO.yxz * .43) - .5) * .22, br2 = brush(vO.zyx * .021 + 4.) - .5;
  if (uOut > .5) {                                     // outline: a gold edge on the disc's side, deep shade elsewhere
    vec3 oc = mix(uBoneShade * .74, uGold * 1.18, step(.02, sunF + br * .25));
    gl_FragColor = vec4(applyFog(oc, vDepth), 1.); return;
  }
  float l = sunF * .5 + .5 + br * .3;
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-3);
  float rim = 1. - abs(dot(n, V));
  vec3 col;
  if (vAux < -.5) {                                    // snow: ice above, lilac under, drifted by the wind
    float s = sunF * .3 + .6 + max(n.y, 0.) * .14 + br * .16;
    float litK = step(.42, s);
    col = mix(uSnowShade, uSnowLit, litK);
    vec2 p = vec2(vO.x * .8 + vO.z * .6, -vO.x * .6 + vO.z * .8);
    float wv = vn3(vec3(p * .045, 2.));
    float q = p.x / 5.6 + wv * 2.6 + .3 * sin(p.y / 3.3 + wv * 9.) - uTime * .07;   // the crests creep downwind          // scalloped crest every few metres
    float fq = fract(q);
    float field = smoothstep(.34, .5, vn3(vec3(p * .034, 8.)) + .25 * wv);     // crests come in fields, smooth snow between
    float lens = step(fq, .17 + .13 * vn3(vec3(p * .21, 5.))) * field;       // lilac lens in the lee of each crest
    col = mix(col, mix(uSnowShade, uSnowLit, .22), lens * litK);
    col = mix(col, uSnowLit * 1.1, step(.84, fq) * litK * field);
    col = mix(col, mix(uSnowShade, uSnowLit, .5), (1. - field) * step(.62, vn3(vec3(p * .09, 12.))) * litK);   // broad soft hollows
    vec2 gc = p / .85, gid = floor(gc), gf = fract(gc) - .5; vec4 gh = h24(gid + 11.);
    float glint = (1. - smoothstep(.1, .2, length(gf - (gh.xy - .5) * .6))) * step(gh.w, .16)
      * step(.2, sin(uTime * (1.5 + 3. * gh.z) + gh.x * 40.)) * (1. - smoothstep(50., 240., vDepth));
    col = mix(col, mix(uSnowLit, uGold, .25) * 1.5, glint * litK);
  } else {
    float top = n.y + br * .4;
    col = mix(uBoneShade, uBoneMid, max(step(.2, top), step(.47, l)));
    col = mix(col, uBoneLit, step(.7, l + br2 * .15));
    float edge = step(.52, rim + br * .22) * step(.02, sunF);                 // gold edge where the form turns to the disc
    col = mix(col, uGold * 1.05, edge);
    float g = abs(fract(vAux) - .5);                   // ridge grooves, broken like a dry brush
    float groove = (1. - smoothstep(.08, .12, g)) * step(.26, brush(vO.xzy * .03 + 1.)) * (1. - edge);
    col = mix(col, uBoneShade * mix(.66, 1., step(.3, top)), groove * .8);
    float fleck = step(.86, vn3(vO * .9)) * step(.45, n.y);                  // fine frost stipple on the tops
    col = mix(col, uSnowLit, fleck * .5);
  }
  col *= .96 + .08 * h21(floor(vO.xy * 5.) + floor(vO.z * 5.) * 1.7);   // paper tooth fixed to the object
  gl_FragColor = vec4(applyFog(col, vDepth), 1.);
}`;

// The sun: a painted flat disc (1.6 x white, stays yellow) with two counter-rotating dry-brushed rings,
// flat halo bands and slow god-ray wedges, drawn on one camera-facing quad.
const SUN_VERT = /* glsl */`
uniform float uR; varying vec2 vP; varying float vDepth;
void main() {
  vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.);
  mv.xy += position.xy * uR * 7.;
  vP = position.xy * 7.; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SUN_FRAG = /* glsl */`
${FOG_PARS}
${HASH}
uniform float uTime; uniform float uPart; uniform vec3 uSunA; uniform vec3 uSunB; uniform vec3 uSunC;
varying vec2 vP; varying float vDepth;
void main() {
  float r = length(vP), a = atan(vP.y, abs(vP.x) < 1e-5 ? 1e-5 : vP.x);
  float aa = max(fwidth(r), 1e-4);
  float a1 = a + uTime * .05, a2 = a - uTime * .035;
  float b1 = brush(vec3(cos(a1) * 3., r * 2.5, sin(a1) * 3.)), b2 = brush(vec3(cos(a2) * 3., r * 2.5 + 5., sin(a2) * 3.));
  vec3 col = uSunA;
  col = mix(col, uSunB, step(.6 + (b1 - .5) * .16, r));
  col = mix(col, uSunC, step(.83 + (b2 - .5) * .12, r));
  if (uPart > .5) { if (r > 1.) discard; gl_FragColor = vec4(col, 1.); return; }
  // halo: two flat bands with torn edges
  float hb = brush(vec3(cos(a) * 2., 1., sin(a) * 2.) + uTime * .01) - .5;
  float h1 = 1. - smoothstep(1.45 + hb * .25 - aa, 1.45 + hb * .25 + aa, r), h2 = 1. - smoothstep(2.3 + hb * .5 - aa, 2.3 + hb * .5 + aa, r);
  // god rays: 12 wedges turning slowly, each a flat stroke fading outward
  float w = sin(a * 6. + uTime * .06) * sin(a * 3. - uTime * .04 + 1.);
  float ray = step(.38, w + (brush(vec3(a * 4., r * .4, 2.)) - .5) * .5) * (1. - smoothstep(2., 6.6, r)) * step(1., r);
  float glow = h1 * .13 + h2 * .06 + ray * .085;
  gl_FragColor = vec4(mix(uSunB, uSunC, .5) * glow * step(.98, r), 1.);
}`;

// ---------------------------------------------------------------- hoof plumes + breath: opaque scalloped discs
const NEM = 5;                                   // 4 hooves + muzzle
const PUFF_VERT = /* glsl */`
attribute vec4 aR; attribute float aE;
uniform vec3 uEm[${NEM}]; uniform float uEmT[${NEM}]; uniform float uTime; uniform vec3 uSunE;
varying vec2 vP; varying vec3 vR; varying float vDepth; varying float vWarm; varying vec3 vT; varying vec2 vSd;
void main() {
  int e = int(aE + .5);
  float t = clamp(uEmT[e], 0., 1.), breath = step(3.5, aE);
  float born = aR.w * .35, lt = clamp((t - born) / (1. - born), 0., 1.);
  float ease = 1. - (1. - lt) * (1. - lt);
  float env = sin(3.1416 * pow(lt, .55)) * step(1e-3, lt) * step(lt, .999);
  // hoof plume: billows in three sizes on a horseshoe round the hoof, open toward the rail (behind and to the
  // right of the elk) so the planted hoof is seen; big ones low, small ones as a ragged streaming top
  float cls = aR.z < .34 ? 0. : (aR.z < .72 ? 1. : 2.);
  float h1 = fract(aR.y * 7.31 + aR.x * 3.17), h2 = fract(aR.z * 13.7 + aR.w * 5.3);
  float ang = mix(3.14 + aR.x * 4.18, aR.x * 6.2832, breath);
  float radH = mix(40., mix(64., 150., aR.y), ease);
  float rad = mix(radH, 70. * (.25 + .75 * aR.y) * ease, breath);
  vec3 c = uEm[e] + vec3(cos(ang) * rad * mix(1., .9, breath), 0., sin(ang) * rad * mix(1., .7, breath));
  float hf = (cls < .5 ? .1 + .34 * h1 : (cls < 1.5 ? .3 + .45 * h1 : .62 + .5 * h1)) * (1. - .45 * aR.y);
  float yH = 10. + 205. * hf * ease + 30. * lt * hf;
  c.y += mix(yH, (aR.z - .3) * 70. * ease + 40. * lt, breath);
  c.x += breath * (60. * ease - 40. * lt) - (1. - breath) * 34. * lt * hf;          // the top leans back downwind
  // alive on the clock as well as on the stride: billows roll, and the smallest stream off the crown
  c += vec3(sin(uTime * .5 + aR.x * 40.), sin(uTime * .7 + aR.y * 40.), cos(uTime * .6 + aR.z * 40.)) * (3. + 2.5 * cls) * (1. - breath * .5);
  float st = fract(uTime * .2 + aR.x * 9.) * step(1.5, cls) * step(.4, h2) * (1. - breath);
  c.x -= st * 78.; c.y += st * 22. - st * st * 16.;
  float sizeH = (cls < .5 ? 78. : (cls < 1.5 ? 47. : 25.)) * (.8 + .45 * h2) * (1. - .75 * st) * (1. + .05 * sin(uTime * .9 + aR.w * 30.));
  float size = mix(sizeH, 36. * (.45 + .75 * aR.z), breath) * env;
  vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.);
  mv.xy += position.xy * size;
  vec3 out3 = c - uEm[e];
  float sunSide = dot(out3.xz / max(length(out3.xz), 1e-3), uSunE.xz / max(length(uSunE.xz), 1e-3)) * .5 + .5;
  vec2 sd = (viewMatrix * modelMatrix * vec4(uSunE, 0.)).xy;
  sd += vec2(0., .7);                              // every billow is lit from above and from the sun's side
  vSd = sd / max(length(sd), 1e-3);
  vT = vec3(c.y / 170., sunSide, size / 170.);
  vP = position.xy; vR = aR.xyz; vDepth = -mv.z; vWarm = breath;
  gl_Position = projectionMatrix * mv;
}`;
const PUFF_FRAG = /* glsl */`
${FOG_PARS}
${HASH}
uniform vec3 uSnowLit; uniform vec3 uSnowShade; uniform vec3 uGold; uniform vec3 uPeach; uniform vec3 uCobalt;
varying vec2 vP; varying vec3 vR; varying float vDepth; varying float vWarm; varying vec3 vT; varying vec2 vSd;
void main() {
  float r = length(vP), a = atan(vP.y, abs(vP.x) < 1e-5 ? 1e-5 : vP.x);
  float edge = .84 + .11 * sin(a * 7. + vR.x * 40.) + .05 * sin(a * 13. + vR.y * 30.);   // scalloped rim
  if (r > edge) discard;
  float br = brush(vec3(vP * 2.2 + vR.xy * 9., vR.z * 5.)) - .5;
  vec3 col;
  if (vWarm > .5) {                                // breath: gold where the sun is on it
    float l = dot(vP, vec2(-.6, .8)) * .5 + .5 + br * .5;
    vec3 lit = mix(uSnowLit, mix(uPeach, uGold, .55) * .95, .92);
    col = mix(uSnowShade, lit, step(.46, l));
    col = mix(col, lit * 1.1, step(.82, l));
  } else {                                         // snow plume in three tones: cobalt-lilac underside, pale body, warm white crown on the sun's side
    float hy = vT.x + vP.y * vT.z;
    float l = dot(vP, vSd) * .5 + .42 + hy * .34 + (vT.y - .5) * .22 + br * .3;
    vec3 under = mix(uCobalt * 1.15, uSnowShade * .95, step(.2, l + br * .2));
    vec3 body = mix(uSnowLit, uSnowShade, .34);
    vec3 crown = mix(uSnowLit, mix(uPeach, uGold, .4), .3) * 1.2;
    col = mix(under, body, step(.36, l));
    col = mix(col, crown, step(.76, l));
  }
  gl_FragColor = vec4(applyFog(col, vDepth), 1.);
}`;
function buildPuffs(S, per, per0) {
  // the first NEM * per0 discs draw from the hero's own stream exactly as before (so nothing built later changes with the disc count)
  const { U, inner, hoofs } = S, n = NEM * per, n0 = NEM * per0, rng0 = S.rng;
  let xs = 1;                                      // the extra discs use a small stream of their own, seeded from the first draw
  const xr = () => { xs = (xs + 0x6D2B79F5) | 0; let t = Math.imul(xs ^ (xs >>> 15), 1 | xs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pos = new Float32Array(n * 12), aR = new Float32Array(n * 16), aE = new Float32Array(n * 4), idx = [];
  const q = [-1, -1, 1, -1, 1, 1, -1, 1];
  for (let i = 0; i < n; i++) {
    const rng = i < n0 ? rng0 : xr, r = [rng(), rng(), rng(), rng()];
    if (i === 0) xs = Math.floor(r[0] * 4294967296) | 0;
    for (let k = 0; k < 4; k++) {
      pos.set([q[k * 2], q[k * 2 + 1], 0], (i * 4 + k) * 3); aR.set(r, (i * 4 + k) * 4); aE[i * 4 + k] = Math.floor(i / per);
    }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 4));
  g.setAttribute('aE', new THREE.BufferAttribute(aE, 1)); g.setIndex(idx);
  const em = Array.from({ length: NEM }, () => new THREE.Vector3()), emT = new Float32Array(NEM);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uEm: { value: em }, uEmT: { value: emT }, uSnowLit: { value: S.pal[0].clone().multiplyScalar(0.78) },
      uSnowShade: { value: S.lilac.clone().multiplyScalar(0.72) },
      uSunE: { value: S.sunElk }, uCobalt: { value: new THREE.Color(S.cobalt || '#5F74C8').multiplyScalar(0.62) } },
    vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, fog: true });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; inner.add(mesh);
  S.parts.push({ update() {
    for (let i = 0; i < 4; i++) {                 // plume born at touchdown, then left behind with the ground
      const c = hoofs[i].c, J = LEGS[i].hind ? HIND : FORE;
      em[i].set(J.F[0] + 137 + (LEGS[i].hind ? 34 : 0) - 360 * c, 0, LEGS[i].z); emT[i] = c / 0.34;
    }
    const cb = S.phase * 2 + 0.36, f = cb - Math.floor(cb);   // a breath every half stride (4.5 s)
    em[4].set(668, 884, 0).applyMatrix4(S.head); emT[4] = f / 0.62;
  } });
  return mesh;
}

// ---------------------------------------------------------------- snow veils sifting off the antlers
const VEIL_VERT = /* glsl */`
attribute vec2 aUv; attribute float aSeed; varying vec2 vUv; varying float vSeed; varying float vDepth;
uniform float uTime;
void main() {
  vec3 p = position; float hang = 1. - aUv.y;
  p.x -= hang * hang * 46.; p.z += sin(uTime * .4 + aSeed * 9. + hang * 3.) * 9. * hang;      // lean back with the walk
  vec4 mv = modelViewMatrix * vec4(p, 1.); vDepth = -mv.z; vUv = aUv; vSeed = aSeed;
  gl_Position = projectionMatrix * mv;
}`;
const VEIL_FRAG = /* glsl */`
${FOG_PARS}
${HASH}
uniform float uTime; uniform vec3 uIce; uniform vec3 uGold;
varying vec2 vUv; varying float vSeed; varying float vDepth;
void main() {
  float fall = vUv.y + uTime * .11 + vSeed;
  vec2 g = vec2(vUv.x * 64., fall * 150.), id = floor(g), f = fract(g) - .5; vec4 h = h24(id + vSeed * 31.);
  float fwv = max(fwidth(g.x), fwidth(g.y));
  float rr = max(.2 + .14 * h.z, fwv * .75);
  float dotm = (1. - smoothstep(rr * .5, rr, length(f - (h.xy - .5) * .5))) * step(h.w, .3) * min(1., .5 / max(fwv, 1e-3));
  float streak = step(.57, brush(vec3(vUv.x * 26. + vSeed * 7., fall * .7, 1.)));
  float env = smoothstep(0., .12, vUv.y) * (1. - smoothstep(.75, 1., vUv.y)) * (1. - pow(abs(vUv.x * 2. - 1.), 3.));
  float tw = .6 + .4 * sin(uTime * (2. + 3. * h.z) + h.x * 40.);
  vec3 col = mix(uIce, uGold, step(.7, h.x)) * (dotm * tw * .85 + streak * .075);
  gl_FragColor = vec4(applyFog(col, vDepth) * env, 0.);
}`;
function buildVeils(S, group, count) {
  const { rng, U } = S, pos = [], uv = [], seed = [], idx = [];
  for (let i = 0; i < count; i++) {
    const A = i % 2 ? S.antL : S.antR, s = rng.range(0.25, 0.95), a = A.palm(s, -0.95, -8), b = A.palm(Math.min(1, s + rng.range(0.12, 0.2)), -0.9, -8);
    const h = rng.range(110, 200), sd = rng(), o = pos.length / 3;
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, b.x, b.y - h, b.z, a.x, a.y - h, a.z);
    uv.push(0, 1, 1, 1, 1, 0, 0, 0); seed.push(sd, sd, sd, sd); idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, fog: true,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; group.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------- frost fringe: spikes along upper edges
function addFrost(B, ant, rng, n) {
  const spike = (bx, by, bz, dx, dy, dz, h, w) => {
    const b = B.count, i0 = B.idx.length;
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + bx; B.vert(bx + Math.cos(a) * w, by, bz + Math.sin(a) * w, 3, -1); }
    B.vert(bx + dx * h, by + dy * h, bz + dz * h, 3, -1);
    B.idx.push(b, b + 1, b + 3, b + 1, b + 2, b + 3, b + 2, b, b + 3);
    fixWinding(B, i0);
  };
  const per = Math.round((n * 0.72) / ant.tines.length);
  for (const T of ant.tines) for (let i = 0; i < per; i++) {
    const f = rng.range(0.12, 0.98) * (T.pts.length - 2) + 1, i0 = Math.floor(f), k = f - i0, a = T.pts[i0], b = T.pts[Math.min(T.pts.length - 1, i0 + 1)];
    const r = lerp(12, 3.4, Math.pow(i0 / (T.pts.length - 1), 0.8)) * 0.8, j = rng.range(-0.5, 0.5);
    spike(lerp(a.x, b.x, k) + j * r, lerp(a.y, b.y, k) + r * (1 - j * j * 0.6), lerp(a.z, b.z, k) + rng.range(-0.4, 0.4) * r,
      rng.range(-0.3, 0.3) - 0.2, 1, rng.range(-0.3, 0.3), rng.range(2.2, 6.5), rng.range(0.5, 1.0));
  }
  for (let i = 0; i < n * 0.28; i++) {              // along the palm rim
    const s = rng.range(0.08, 1), t = (rng.chance(0.6) ? -1 : 1) * rng.range(0.93, 1.0), p = ant.palm(s, t, 3);
    spike(p.x, p.y, p.z, rng.range(-0.3, 0.3) - 0.15, 1, rng.range(-0.3, 0.3), rng.range(2.5, 7), rng.range(0.6, 1.1));
  }
}

// ---------------------------------------------------------------- birds: flat painted cranes, swans or ravens, roosting and lifting off
const CRANE_VERT = /* glsl */`
// aBird: lift (metres on the flock clock), rnd, scale, wheel radius. aFly: x = metres flown per clock metre (wheelers) or
// gap kept ahead of the camera (formation), y = kind (0 wheels off its tine, 1 formation down the fly-through, 2 dives into the ring).
// aLane: metres to the right, metres up, extra lead gained on the approach.
// aX: crossing birds only: metres drifted to the right per clock metre, and the clock at which they are on the axis.
attribute vec3 aPerch; attribute vec3 aDir; attribute vec4 aBird; attribute vec2 aWC; attribute vec2 aFly; attribute vec3 aOff; attribute vec3 aLane; attribute vec2 aX;
uniform float uTime; uniform float uM; uniform vec3 uGateC; uniform vec3 uRun; uniform float uRunLen; uniform mat4 uHeadInv; uniform float uFlap;
varying float vCol; varying float vDepth; varying vec3 vL;
// a formation bird at flock-clock um: off its tine, round in an arc, then holding a lane ahead of the camera
vec3 lanePos(float um) {
  float k = 1. - exp(-max(um - aBird.x, 0.) / 50.);
  k = mix(k, 1., step(1e-3, abs(aX.x)));           // crossing birds come in from outside the frame
  float s = um + aFly.x + aLane.z * smoothstep(90., 330., um);
  float conv = 1. - .8 * smoothstep(uRunLen - 150., uRunLen - 15., s);   // they close on the ring only at the end
  vec3 rv = normalize(vec3(-uRun.z, 0., uRun.x) + vec3(1e-4, 0., 0.));
  float lat = aLane.x * conv + aX.x * (um - aX.y);
  vec3 lane = uGateC + uRun * s + rv * lat + vec3(0., aLane.y * conv, 0.);
  lane = (uHeadInv * vec4(lane, 1.)).xyz;          // lanes are fixed to the fly-through (rest pose), perches nod with the head
  return mix(aPerch, lane, k) + vec3(0., 9. * k * (1. - k), 0.);
}
void main() {
  float lift = aBird.x, rnd = aBird.y, sc = aBird.z, R = aBird.w, kind = aFly.y;
  float cross = step(1e-3, abs(aX.x));
  float tm = uM - lift, f = max(smoothstep(0., 20., tm) * step(0., tm), cross);
  float air = step(.5, kind);
  // where it is and which way it heads
  vec3 fw = normalize(vec3(aDir.x, 0., aDir.z) + vec3(1e-4, 0., 0.)), rt = vec3(fw.z, 0., -fw.x);
  float d = max(tm, 0.) * aFly.x, psi = d / (abs(R) < 1. ? 1. : R);
  float climb = min(d, 70.) * .5 + d * .05 + aDir.y * d * .1;
  vec3 c = aPerch + (fw * sin(psi) + rt * (1. - cos(psi))) * R + vec3(0., climb, 0.);
  vec3 hf = fw * cos(psi) + rt * sin(psi);
  if (kind > .5 && kind < 1.5) {                  // formation: heading follows the bird's own track, so it wheels round to lead us
    c = lanePos(uM);
    vec3 dv = lanePos(uM + 3.) - c;
    hf = normalize(vec3(dv.x, 0., dv.z) + fw * .03);
    c.y += sin(uTime * 1.1 + rnd * 20.) * 1.1;
    float s = uM + aFly.x + aLane.z * smoothstep(90., 330., uM);
    sc *= 1. - step(uRunLen + 4., s);
    sc *= mix(1., 1. - smoothstep(aOff.x * .85, aOff.x, abs(uM - aX.y)), cross);
  } else if (kind > 1.5) {                        // the last birds: off the brow tine and into the ring
    float k2 = smoothstep(0., 200., tm);
    c = mix(aPerch, (uHeadInv * vec4(aPerch + aOff, 1.)).xyz, k2) + vec3(0., 16. * sin(3.1416 * k2) + sin(uTime * 1.3 + rnd * 20.), 0.);
    hf = fw; sc *= 1. - step(.995, k2);
  }
  vec3 hr = vec3(hf.z, 0., -hf.x);
  // a painted bird shows its plan to the viewer: it banks and pitches a little toward wherever the lens is
  vec3 toCam = cameraPosition - (modelMatrix * vec4(c, 1.)).xyz; float tl = max(length(toCam), 1e-3);
  float side = clamp(dot(mat3(modelMatrix) * hr, toCam) / tl * 3., -1., 1.);
  float above = clamp(toCam.y / tl * 5., -1., 1.);
  // wings: folded and drooped when perched; in the air two hinges, the hand lagging the arm, and some birds gliding
  float ph = uTime * (uFlap + rnd) + rnd * 20.;
  float glide = smoothstep(.45, .8, sin(uTime * .45 + rnd * 37.)) * f;
  float amp = mix(1., .1, glide);
  float th1 = mix(-1.15, (.1 + .52 * sin(ph)) * amp + .16 * glide, f);
  float th2 = mix(-.5, (-.55 * cos(ph) - .1) * amp, f);
  vec3 p = position; float w = abs(aWC.x), sg = sign(aWC.x);
  float fold = mix(.22, 1., f), ax = abs(p.x) * fold, xw = .7 * fold;
  float xi = min(ax, xw), xo = max(ax - xw, 0.);
  if (w > .004) {
    p.x = sg * (xi * cos(th1) + xo * cos(th1 + th2));
    p.y += xi * sin(th1) + xo * sin(th1 + th2);
    p.z -= xo * clamp(-th2, 0., 1.) * .4 * f;      // the hand sweeps back on the upstroke
  } else {
    p.y -= sin(ph) * .05 * amp * f;                // the body lifts against the downstroke
  }
  // perched birds stand upright and preen
  float pitFly = mix(.06 * sin(uTime * 2.6 + rnd * 9.), .1 + .3 * max(above, 0.) + .06 * sin(uTime * 1.3 + rnd * 9.), air);
  float pit = mix(1.15 + .12 * sin(uTime * .9 + rnd * 30.), pitFly, f);
  float neck = smoothstep(.5, 1.3, position.z) * (1. - f);
  p.x += neck * sin(uTime * .7 + rnd * 50.) * .28;
  p = vec3(p.x, p.y * cos(pit) + p.z * sin(pit), p.z * cos(pit) - p.y * sin(pit));
  p.y += (1. - f) * 1.05;
  float bankAir = -side * above * (.3 + .4 * rnd) + .12 * sin(uTime * .9 + rnd * 12.);
  float bank = mix(.85 * sign(R), bankAir, air) * f;
  vec3 wp = c + (hr * (p.x * cos(bank) - p.y * sin(bank)) + vec3(0., p.y * cos(bank) + p.x * sin(bank), 0.) + hf * p.z) * sc;
  vec4 mv = modelViewMatrix * vec4(wp, 1.);
  vCol = aWC.y; vDepth = -mv.z; vL = position;
  gl_Position = projectionMatrix * mv;
}`;
const CRANE_FRAG = /* glsl */`
${FOG_PARS}
${HASH}
uniform vec3 uSlate; uniform vec3 uSnowLit; uniform vec3 uDark; uniform vec3 uCrown;
varying float vCol; varying float vDepth; varying vec3 vL;
void main() {
  float b = brush(vL * vec3(3., 1., 1.2)) - .5;
  vec3 col = vCol < .5 ? mix(uSlate * .8, uSlate, step(-.12, b)) : vCol < 1.5 ? uSnowLit : vCol < 2.5 ? uDark : uCrown;
  gl_FragColor = vec4(applyFog(col, vDepth), 1.);
}`;
// one flat painted bird per species, as four-cornered pieces [x, y, z, wingWeight, colour]:
// colour 0 plumage (two brushed tones), 1 pale accent, 2 dark, 3 bill or crown
function birdPieces(kind) {
  const P = [], q = (a, b, c, d) => P.push([a, b, c, d || c]);
  // body: a six-cornered plan and a six-cornered profile crossed, so it is thicker than the neck from any side
  const body = (z1, zs, zh, z0, hw, up, dn, col) => {
    for (const s of [-1, 1]) q([0, 0, z1, 0, col], [s * hw, 0, zs, 0, col], [s * hw * 0.85, 0, zh, 0, col], [0, 0, z0, 0, col]);
    q([0, 0, z1, 0, col], [0, up, zs, 0, col], [0, up * 0.8, zh, 0, col], [0, 0, z0, 0, col]);
    q([0, 0, z1, 0, col], [0, -dn, zs, 0, col], [0, -dn * 0.9, zh, 0, col], [0, 0, z0, 0, col]);
  };
  // a tapered stick (neck, head, bill, legs), crossed too
  const stick = (z0, z1, w0, w1, c0, c1, y0 = 0, y1 = 0) => {
    q([-w0, y0, z0, 0, c0], [w0, y0, z0, 0, c0], [w1, y1, z1, 0, c1], [-w1, y1, z1, 0, c1]);
    q([0, y0 - w0, z0, 0, c0], [0, y0 + w0, z0, 0, c0], [0, y1 + w1, z1, 0, c1], [0, y1 - w1, z1, 0, c1]);
  };
  // a wing: stations [x, leading z, trailing z]; the trailing `bar` of the arm takes the accent; the hand ends in separate fingers
  const wing = (st, bar, cols, fingers, gap, tipX, tipZ0, tipZ1, fcol) => {
    const W = (x) => Math.max(0.01, (x - 0.1) / 1.35);
    for (const s of [-1, 1]) {
      for (let i = 0; i < st.length - 1; i++) {
        const [xa, la, ta] = st[i], [xb, lb, tb] = st[i + 1], wa = W(xa) * s, wb = W(xb) * s, c = cols[i], cb = i < 2 ? 1 : c;
        const ma = ta + (la - ta) * bar, mb = tb + (lb - tb) * bar;
        q([s * xa, 0, la, wa, c], [s * xb, 0, lb, wb, c], [s * xb, 0, mb, wb, c], [s * xa, 0, ma, wa, c]);
        q([s * xa, 0, ma, wa, cb], [s * xb, 0, mb, wb, cb], [s * xb, 0, tb, wb, cb], [s * xa, 0, ta, wa, cb]);
      }
      const [xe, le, te] = st[st.length - 1], we = W(xe) * s;
      for (let j = 0; j < fingers; j++) {
        const a = j / fingers, b = (j + gap) / fingers, m = (j + 0.5) / fingers, tx = tipX - 0.2 * m * m;
        q([s * xe, 0, le + (te - le) * a, we, fcol], [s * xe, 0, le + (te - le) * b, we, fcol], [s * tx, 0, tipZ0 + (tipZ1 - tipZ0) * m, W(tx) * s, fcol]);
      }
    }
  };
  if (kind === 'ravens') {                         // short neck, stout bill, wedge tail, broad deeply fingered wings; no legs
    body(0.42, 0.16, -0.2, -0.45, 0.2, 0.12, 0.15, 0);
    stick(0.36, 0.66, 0.115, 0.09, 0, 0); stick(0.64, 0.92, 0.06, 0.012, 2, 2);
    for (const s of [-1, 1]) q([0, 0, -0.34, 0, 2], [s * 0.08, 0, -0.34, 0, 2], [s * 0.22, 0, -0.82, 0, 2], [0, 0, -1.0, 0, 2]);
    wing([[0.1, 0.34, -0.3], [0.4, 0.43, -0.31], [0.7, 0.43, -0.28], [1.0, 0.35, -0.25], [1.16, 0.25, -0.2]], 0.36, [0, 0, 0, 0], 5, 0.66, 1.52, 0.26, -0.36, 2);
  } else if (kind === 'swans') {                   // long neck, heavy body, all white, colour only at the bill; no trailing legs
    body(0.5, 0.18, -0.24, -0.62, 0.2, 0.11, 0.17, 0);
    stick(0.44, 1.26, 0.062, 0.046, 0, 0); stick(1.24, 1.37, 0.066, 0.05, 0, 0); stick(1.37, 1.5, 0.046, 0.03, 3, 3); stick(1.5, 1.57, 0.03, 0.012, 2, 2);
    wing([[0.1, 0.3, -0.3], [0.42, 0.36, -0.27], [0.7, 0.35, -0.2], [1.02, 0.24, -0.12], [1.22, 0.12, -0.06]], 0.3, [0, 0, 1, 1], 4, 0.8, 1.5, 0.06, -0.24, 1);   // the hand in lilac shade, so the bend at the wrist is a change of tone
  } else {                                         // cranes: long straight neck, red crown, trailing legs, white wing bar, dark hands
    body(0.52, 0.2, -0.2, -0.5, 0.17, 0.1, 0.15, 0);
    stick(0.46, 1.2, 0.055, 0.04, 0, 1); stick(1.18, 1.3, 0.06, 0.05, 3, 3); stick(1.3, 1.56, 0.03, 0.007, 2, 2);
    stick(-0.42, -1.22, 0.036, 0.02, 2, 2, -0.03, -0.05);
    q([-0.09, 0, -0.42, 0, 0], [0.09, 0, -0.42, 0, 0], [0.05, 0, -0.64, 0, 0], [-0.05, 0, -0.64, 0, 0]);
    wing([[0.1, 0.32, -0.26], [0.42, 0.37, -0.24], [0.7, 0.36, -0.2], [1.0, 0.27, -0.16], [1.2, 0.17, -0.12]], 0.3, [0, 0, 0, 2], 5, 0.8, 1.5, 0.12, -0.3, 2);
  }
  return P;
}
async function buildCranes(S, group, total, debugScale = 1, pause) {
  const { rng, U } = S, pos = [], wc = [], perch = [], dir = [], bird = [], idx = [];
  const pieces = birdPieces(S.birdKind);
  const R = S.antR.tines, rearT = R.filter((T) => T.tag === 'rear'), frontT = R.filter((T) => T.tag === 'front');
  const tA = rearT[0], tB = rearT[1] || rearT[0], tC = S.antR.browOuter || frontT[0] || rearT[0];
  // the fly-through (gate -> seat in the fork), exactly as the anchors define it
  const gA = tA.pts[8], gateC = gA.clone().lerp(tB.pts.reduce((b, q) => (Math.abs(q.y - gA.y) < Math.abs(b.y - gA.y) ? q : b), tB.pts[0]), 0.5);
  const fA = tC.pts[8], fB = (frontT[frontT.length - 1] || rearT[0]).pts[8], seat = fA.clone().lerp(fB, 0.5); seat.y = (fA.y + fB.y) / 2 - 6;
  const run = seat.clone().sub(gateC), runLen = Math.max(run.length(), 1); run.multiplyScalar(1 / runLen);
  const NF = 22, ND = 10;                         // formation birds off the two gate tines, divers off the brow tine: never thinned
  // [gap ahead of the lens, metres to the right, metres up]: the high ones sit against the dawn band, the low ones over the pale dish
  const lanes = [[17, -6.5, 3.2], [20, 8.5, -3.4], [25, 3, 5.6], [30, -13, 6.4], [36, 15, -6.5], [42, -4, 9], [48, 21, -8.5], [56, 9, 11], [64, -21, 12], [74, 15, 14]];
  if (S.birdKind === 'swans') for (const L of lanes) L[2] = Math.abs(L[2]) + 0.6;      // white birds do not carry on the pale dish: all of them on the band
  // crossing birds: [gap, metres up, drift to the right per clock metre, clock at which it is dead ahead]
  const crossers = [[22, 5.2, 0.36, -34], [29, 8, 0.32, -4], [24, 6.2, 0.36, 58], [32, 9.5, -0.3, 104], [23, 5.6, 0.36, 148], [30, 8.5, 0.34, 198]];
  const fly = [], off = [], lane = [], axs = [];
  const all = [...S.antR.tines, ...S.antL.tines];
  for (let i = 0; i < total; i++) {
    if (pause && i % 16 === 15) await pause();     // (the hero's random stream is its own, so a pause here changes nothing)
    const kind = i < NF ? 1 : i < NF + ND ? 2 : 0, T = kind === 1 ? (i % 2 ? tB : tA) : kind === 2 ? tC : rng.pick(all);
    const k = Math.min(T.pts.length - 1, Math.floor(kind === 1 ? rng.range(6, 10.99) : rng.range(kind ? 5 : 3, T.pts.length - 0.01))), q = T.pts[k];
    const r = lerp(12, 3.4, Math.pow(k / (T.pts.length - 1), 0.8));
    const a = rng.range(0, TAU), rnd = rng();
    // the flock clock is metres of camera travel past the gate (negative before it)
    const lift = kind === 1 ? rng.range(-250, -150) : kind === 2 ? 95 + (i - NF) * 15 + rng.range(-6, 6) : (rng.chance(0.6) ? rng.range(-1500, 260) : 1e9);
    const fd = kind ? [run.x, run.y, run.z] : [Math.cos(a), rng.range(-0.2, 0.5), Math.sin(a)];
    const sc = rng.range(0.9, 1.15) * debugScale * (kind === 1 ? 1.36 : 1), wheel = (kind ? 3000 : rng.range(110, 260)) * (rng.chance(0.5) ? 1 : -1);
    const ov = [0, 0, 0], lv = [0, 0, 0], xv = [0, 0];
    let spd = 0.33;
    if (kind === 1) {
      const gap = rng.range(64, 112), side = rng.chance(0.5) ? 1 : -1, lead = rng.range(10, 70);
      const X = crossers[i - lanes.length], L = lanes[i] || [gap, side * rng.range(6, 30), gap * rng.range(0.1, 0.24)];
      if (X) { spd = X[0]; lv[1] = X[1]; xv[0] = X[2]; xv[1] = X[3]; ov[0] = (X[0] * 1.15 + 14) / Math.abs(X[2]); }
      else { spd = L[0]; lv[0] = L[1]; lv[1] = L[2]; lv[2] = lanes[i] ? 6 + i * 5 : lead; }
    } else if (kind === 2) {
      const tx = seat.x + run.x * 6 + rng.range(-5, 5), ty = seat.y + run.y * 6 + rng.range(-5, 4), tz = seat.z + run.z * 6 + rng.range(-5, 5);
      ov[0] = tx - q.x; ov[1] = ty - (q.y + r * 0.9); ov[2] = tz - q.z; fd[0] = ov[0]; fd[1] = 0; fd[2] = ov[2];
    }
    for (const Q of pieces) {
      const o = pos.length / 3;
      for (const [x, y, z, w, c] of Q) {
        pos.push(x, y, z); wc.push(w, c); perch.push(q.x, q.y + r * 0.9, q.z); dir.push(fd[0], fd[1], fd[2]); bird.push(lift, rnd, sc, wheel);
        fly.push(spd, kind); off.push(ov[0], ov[1], ov[2]); lane.push(lv[0], lv[1], lv[2]); axs.push(xv[0], xv[1]);
      }
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aWC', new THREE.Float32BufferAttribute(wc, 2));
  g.setAttribute('aPerch', new THREE.Float32BufferAttribute(perch, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3));
  g.setAttribute('aBird', new THREE.Float32BufferAttribute(bird, 4)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(fly, 2)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 3)); g.setAttribute('aLane', new THREE.Float32BufferAttribute(lane, 3));
  g.setAttribute('aX', new THREE.Float32BufferAttribute(axs, 2)); g.setIndex(idx);
  const uM = { value: -4000 }, headInv = new THREE.Matrix4();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uM, uHeadInv: { value: headInv }, uGateC: { value: gateC }, uRun: { value: run }, uRunLen: { value: runLen }, uFlap: { value: S.birdKind === 'ravens' ? 7.2 : S.birdKind === 'swans' ? 5.6 : 5.0 },
      uSlate: { value: new THREE.Color(S.craneCols?.[0] || '#5E7396').multiplyScalar(S.craneCols ? 0.95 : 0.8) }, uSnowLit: { value: new THREE.Color(S.craneCols?.[1] || S.pal[0]).multiplyScalar(0.78) },
      uDark: { value: new THREE.Color(S.craneCols?.[2] || '#1B2440') }, uCrown: { value: new THREE.Color(S.craneCols?.[3] || '#C8442E') } },
    vertexShader: CRANE_VERT, fragmentShader: CRANE_FRAG, fog: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; group.add(mesh);
  S.parts.push({ update() { uM.value = S.craneM ?? (S.u - 0.9) * 3750; headInv.copy(S.head).invert(); } });
  return mesh;
}

// ==== PARTS-ABOVE (antlers, sun, fx builders are inserted above this line)

// ---------------------------------------------------------------- hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('elk-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const [cSnow, cPeach, cNight, cIce, cGold, cSpruce, cApricot] = pal;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const vary = { hump: rng.range(0.985, 1.03), muzzle: rng.range(0, 1.6), dewlap: rng.range(0.25, 1.2), sweep: rng.range(-0.08, 0.1),
    tineCurl: rng.range(0.8, 1.25), tines: 9 };
  const modes = ['milkyway', 'comet', 'moon', 'aurora'];
  const night = opts.night || (rng.chance(0.5) ? 'milkyway' : rng.pick(modes.slice(1)));

  const object = new THREE.Group(); object.name = 'elk-who-carries-the-sun';
  const inner = new THREE.Group(); inner.rotation.y = -Math.PI / 2; object.add(inner);   // elk axes -> contract axes

  // sun as the ground sees it: 22 degrees up, ahead and to the left
  const sunElk = opts.sunDir ? new THREE.Vector3().fromArray(opts.sunDir).normalize()
    : new THREE.Vector3(Math.cos(0.384) * 0.7071, Math.sin(0.384), -Math.cos(0.384) * 0.7071);
  const mwN = new THREE.Vector3(rng.range(-0.25, 0.25), 0.86, rng.range(0.35, 0.6)).normalize();
  const U = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uFogK: { value: opts.fogK ?? 0.12 }, uMask: { value: 0 }, uTime: { value: 0 }, uSeed: { value: rng.range(0, 50) },
    uSeg: { value: Array.from({ length: NSEG }, () => new THREE.Matrix4()) },
    uRim: { value: 7 }, uPxK: { value: 0.004 }, uSunP: { value: new THREE.Vector3(400, 1224, -376) }, uSunW: { value: new THREE.Vector3(0, 1, 0) }, uGroundW: { value: 0.6 },
    uNightA: { value: cNight.clone().multiplyScalar(1.5) },
    uNightB: { value: cNight.clone().lerp(new THREE.Color('#27306A'), 0.75) },
    uIce: { value: cIce.clone() }, uGold: { value: cGold.clone() }, uPeach: { value: cPeach.clone() }, uApricot: { value: cApricot.clone() },
    uShadowSnow: { value: new THREE.Color('#2C3A78') }, uScroll: { value: new THREE.Vector2() },
    uMwN: { value: mwN }, uBodyDir: { value: new THREE.Vector3(0, 0, -1) }, uMode: { value: modes.indexOf(night) },
  };
  const elkGeo = buildElk(rng, vary);
  await ctx.yield?.();
  const elkMat = (pass, side, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...U, uPass: { value: pass } }, vertexShader: ELK_VERT, fragmentShader: ELK_FRAG, side, fog: true, ...extra });
  const fill = new THREE.Mesh(elkGeo, elkMat(0, THREE.FrontSide));
  const rim = new THREE.Mesh(elkGeo, elkMat(1, THREE.BackSide));
  const _size = new THREE.Vector2();
  rim.onBeforeRender = (renderer, scene, camera) => {
    renderer.getDrawingBufferSize(_size);
    U.uPxK.value = 6 / Math.max(1e-3, camera.projectionMatrix.elements[5] * Math.max(_size.y, 1));
  };
  const shadow = new THREE.Group(); shadow.name = 'night-shadow';
  const shadowMat = elkMat(2, THREE.DoubleSide, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const elkShadow = new THREE.Mesh(elkGeo, shadowMat); shadow.add(elkShadow);
  for (const m of [fill, rim, elkShadow]) { m.frustumCulled = false; }
  fill.renderOrder = 1; rim.renderOrder = 2; elkShadow.renderOrder = 0;
  inner.add(fill, rim);
  if (opts.shadow !== false) inner.add(shadow);

  const hoofs = Array.from({ length: 4 }, () => ({ x: 0, y: 0, z: 0, down: 1, c: 0 }));
  const parts = [];                                  // { update(S) } pieces added below
  const S = { craneU: opts.craneU, craneCols: opts.craneColors, birdKind: opts.birdKind || 'cranes', U, rng, pal, detail, vary, inner, shadow, shadowMat, hoofs, sunElk, parts, u: 0, phase: 0, time: 0, head: U.uSeg.value[3] };
  // --- antlers (rigid with the head) and their shadow
  const AB = new Builder();
  const antR = buildAntler(AB, rng, vary, 1);
  await ctx.yield?.();
  const antL = buildAntler(AB, rng, vary, -1);
  const frostRng = rng.fork ? rng.fork('frost') : rng, frostStart = AB.idx.length;
  addFrost(AB, antR, frostRng, Math.round(1300 * detail)); addFrost(AB, antL, frostRng, Math.round(1300 * detail));
  const antGeo = AB.geometry();
  await ctx.yield?.();
  const lilac = new THREE.Color('#8FA3DC');
  const antMatOf = (out, side) => new THREE.ShaderMaterial({
    uniforms: { ...U, uOut: { value: out },
      uBoneLit: { value: cSnow.clone().lerp(cGold, 0.62).multiplyScalar(0.9) }, uBoneMid: { value: cSnow.clone().lerp(cPeach, 0.06).multiplyScalar(0.8) },
      uBoneShade: { value: opts.boneShade ? new THREE.Color(opts.boneShade) : new THREE.Color('#5E6FBE').multiplyScalar(0.6) },
      uSnowLit: { value: cSnow.clone().multiplyScalar(0.8) }, uSnowShade: { value: lilac.clone().multiplyScalar(0.68) } },
    vertexShader: ANT_VERT, fragmentShader: ANT_FRAG, fog: true, side });
  const antMat = antMatOf(0, THREE.FrontSide);
  const antMesh = new THREE.Mesh(antGeo, antMat); antMesh.frustumCulled = false; antMesh.renderOrder = 1; inner.add(antMesh);
  // the outline: bone only (no frost blades), back faces pushed out; gold on the disc's side
  const antEdgeGeo = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'seg', 'aux']) antEdgeGeo.setAttribute(k, antGeo.getAttribute(k));
  antEdgeGeo.setIndex(antGeo.getIndex()); antEdgeGeo.setDrawRange(0, frostStart);
  const antEdge = new THREE.Mesh(antEdgeGeo, antMatOf(1, THREE.BackSide)); antEdge.frustumCulled = false; antEdge.renderOrder = 2; inner.add(antEdge);
  const antShadowGeo = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'seg']) antShadowGeo.setAttribute(k, antGeo.getAttribute(k));
  antShadowGeo.setIndex(antGeo.getIndex()); antShadowGeo.setDrawRange(0, frostStart);
  const antShadow = new THREE.Mesh(antShadowGeo, shadowMat); antShadow.frustumCulled = false; shadow.add(antShadow);

  // --- the sun, cupped in the LEFT palm
  const sunRest = antL.palm(0.52, 0.05, 0).addScaledVector(antL.palmN, 96);
  const sunCols = (opts.sunColors || ['#FFCB2E', '#F7A233', '#EC7A2A']).map((h, i) => new THREE.Color(h).multiplyScalar([1.22, 1.0, 0.92][i]));
  const sunMat = (part, extra) => new THREE.ShaderMaterial({
    uniforms: { ...U, uR: { value: 80 }, uPart: { value: part }, uSunA: { value: sunCols[0] }, uSunB: { value: sunCols[1] }, uSunC: { value: sunCols[2] } }, vertexShader: SUN_VERT, fragmentShader: SUN_FRAG, fog: true, ...extra });
  const sunGeo = new THREE.PlaneGeometry(2, 2);
  // glow + god rays: additive, no depth test, drawn in the opaque pass right after the sky so the elk,
  // the antlers and all terrain paint over it (the rays show only between the tines)
  const sunGlow = new THREE.Mesh(sunGeo, sunMat(0, { blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
  sunGlow.renderOrder = -0.5;
  const sunMesh = new THREE.Mesh(sunGeo, sunMat(1, {})); sunMesh.renderOrder = 1;
  for (const m of [sunGlow, sunMesh]) { m.frustumCulled = false; inner.add(m); }
  parts.push({ update() { sunMesh.position.copy(sunRest).applyMatrix4(S.head); sunGlow.position.copy(sunMesh.position); U.uSunP.value.copy(sunMesh.position).applyMatrix4(inner.matrixWorld); } });
  S.antR = antR; S.antL = antL; S.sunRest = sunRest; S.sunMesh = sunMesh; S.lilac = lilac;
  // --- things that ride with the head (veils, cranes) and the plumes / breath
  const headGroup = new THREE.Group(); headGroup.matrixAutoUpdate = false; inner.add(headGroup);
  parts.push({ update() { headGroup.matrix.copy(S.head); headGroup.matrixWorldNeedsUpdate = true; } });
  S.headGroup = headGroup;
  S.cobalt = opts.cobalt;
  buildPuffs(S, Math.round(40 + 32 * detail), Math.round(40 * detail));
  await ctx.yield?.();
  buildVeils(S, headGroup, Math.round(10 * detail));
  await ctx.yield?.();
  await buildCranes(S, headGroup, 32 + Math.round(56 * detail), opts.craneScale ?? 1, ctx.yield ? () => ctx.yield() : null);
  await ctx.yield?.();
  // ==== ASSEMBLE (antlers, sun and fx are attached here)

  // --- anchors (built in elk axes, converted to contract axes below)
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const rearT = antR.tines.filter((T) => T.tag === 'rear'), frontT = antR.tines.filter((T) => T.tag === 'front');
  const atY = (T, y) => T.pts.reduce((b, q) => (Math.abs(q.y - y) < Math.abs(b.y - y) ? q : b), T.pts[0]);
  const gateY = rearT[0].pts[8].y;
  const gate = rearT[0].pts[8].clone().lerp(atY(rearT[1], gateY), 0.5);                 // between the two inner rear tines
  const fA = antR.browOuter.pts[8], fB = frontT[frontT.length - 1].pts[8];
  const seat = fA.clone().lerp(fB, 0.5); seat.y = (fA.y + fB.y) / 2 - 6;            // in the U of the fork
  const run = seat.clone().sub(gate), runLen = run.length(); run.normalize();
  const E = {
    portalSeat: { position: seat, facing: run.clone(), radiusFree: Math.min(fA.distanceTo(seat), fB.distanceTo(seat)) - 12 },
    flyThrough: [V3(-420, 1000, 330), V3(-150, 1030, 262), V3(70, 1140, 262), gate.clone().addScaledVector(run, -40), gate, seat, seat.clone().addScaledVector(run, 80)],
    gate, straightLength: runLen,
    threadTines: [atY(rearT[0], gateY).clone(), atY(rearT[1], gateY).clone(), fA.clone(), fB.clone()],
    sun: sunRest.clone(), sunRadius: 80,
    muzzle: V3(668, 884, 0), rightEar: V3(300, 1060, 120), withers: V3(0, 940 * vary.hump, 0), rump: V3(-820, 820, 0),
    hooves: LEGS.map((l) => V3(l.hind ? HIND.F[0] + 54 : FORE.F[0] + 20, 0, l.z)),
    hocks: [V3(HIND.K[0], HIND.K[1], -110), V3(HIND.K[0], HIND.K[1], 110)],
    viewpoints: {
      entry: { position: V3(-2450, 55, 620), lookAt: V3(-380, 420, 0) },
      shadowEdge: { position: V3(-1900, 16, 730), lookAt: V3(-700, 300, 110) },
      hoofFall: { position: V3(-900, 120, 300), lookAt: V3(-764, 40, 110) },
      flank: { position: V3(-380, 760, 430), lookAt: V3(-380, 700, 0) },
      sunAbeam: { position: gate.clone().addScaledVector(run, 120), lookAt: sunRest.clone() },
      fork: { position: seat.clone().addScaledVector(run, -220), lookAt: seat.clone() },
    },
    shadowTip: V3(0, 0, 0).addScaledVector(sunElk, -1340 / sunElk.y).setY(0),
  };
  const conv = (v) => (v && v.isVector3 ? new THREE.Vector3(-v.z, v.y, v.x) : Array.isArray(v) ? v.map(conv)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, conv(x)])) : v);
  const anchors = conv(E);

  let progress = -1;
  const _c = new THREE.Vector3(), _cw = new THREE.Vector3(), _n3 = new THREE.Matrix3();
  const toLocal = (x, y, z) => new THREE.Vector3(-z, y, x);     // elk axes -> contract axes
  const hoofOut = Array.from({ length: 4 }, () => ({ pos: new THREE.Vector3(), down: 1, cycle: 0 }));
  const api = {
    object, radius: 820, height: 1340, center: new THREE.Vector3(0, 720, -60),
    anchors, anchorsElk: E, uniforms: U, elkGeo, shadowMat, segCount: NSEG, ground: true, groundY: 0, shadow, night, antlers: { right: antR, left: antL },
    triangles: { elk: elkGeo.getIndex().count / 3, antlers: antGeo.getIndex().count / 3, antlerShadow: frostStart / 3 },
    sunDir: toLocal(sunElk.x, sunElk.y, sunElk.z),
    setProgress(u) { progress = Math.max(0, u); },
    hoof(i) { const h = hoofs[i], o = hoofOut[i]; o.pos.set(-h.z, h.y, h.x); o.down = h.down; o.cycle = h.c; return o; },   // reused objects: no garbage per frame
    update(dt, time, camera) {
      const u = progress >= 0 ? progress : (time / 46) % 1;
      const phase = progress >= 0 ? progress * 5 + (opts.phase0 || 0) : time / 9;
      S.u = u; S.phase = phase; S.time = time; S.camera = camera; S.craneM = api.craneClock;
      U.uTime.value = time;
      const earKick = Math.sin(clamp((u - (api.earU ?? opts.earU ?? 0.63) + 0.01) / 0.03, 0, 1) * Math.PI);
      poseElk(U.uSeg.value, hoofs, phase, time, earKick);
      object.updateMatrixWorld(true);
      _n3.setFromMatrix4(inner.matrixWorld);
      U.uSunW.value.copy(sunElk).applyMatrix3(_n3).normalize();
      U.uGroundW.value = _c.set(0, 0.6, 0).applyMatrix4(inner.matrixWorld).y;
      _c.set(1, 0, 0).applyMatrix3(_n3).normalize(); U.uScroll.value.set(_c.x, _c.z).multiplyScalar(phase * 360);
      if (camera) {
        _c.set(-320, 700, 0).applyMatrix4(inner.matrixWorld).sub(_cw.setFromMatrixPosition(camera.matrixWorld));
        if (_c.lengthSq() > 1) U.uBodyDir.value.copy(_c.normalize());
      }
      for (const p of parts) p.update(S, dt);
    },
    dispose() {},
  };
  return api;
}
