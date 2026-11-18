// NET UP THE PILLAR: Monasteries on Rock Pillars. A clear October morning about 1750; we are hauled 246 m up the face of the
// greatest pillar in a rope net, in one slow even circling, and drawn in through the floor of its hoist house.
//
// FRAME (the brief's): x = metres out from the mean plane of the haul face (east-north-east), y = metres above the stage deck,
//   z = metres along the face toward the south-south-east. Headings are degrees clockwise from +z (90 = straight at the face).
// The hero part (src/parts/net-up-the-pillar.js) is the great pillar and everything on it; this file is the flight, the mount
//   (net, hook, rope, our shadow), the country round about (hollow, knoll, saddle, track, neighbours, village, plain, river, ranges),
//   its life (birds, mules, sheep, smoke, leaves) and the looks. Every place below is a place of the world, in that frame.
// Rules, places and numbers: scratch net-world/rules-try1.txt and rules-try2.txt of the build (each written before its try's first picture).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as PART from '../parts/net-up-the-pillar.js';
const { buildHero, makePillarAsync, tools } = PART;       // the part's standing exports; its makeMonastery is read at build time, when it is there

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lin = (c) => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------- places of the brief ----------
const RING = [13, 251.5, 4], LINE_DIR = [-0.3234, 0.9397, 0.1114];          // portal ring centre; the last straight (heading 71, 70 degrees up)
const BLOCK = [10, 260, 5];                                                  // the block under the house roof: our rope runs to it
const KNOLL = [126, -8], STAGE = { x0: 118, x1: 127, z0: -11.5, z1: -4.5 };  // knoll top y 0; the stage deck 9 by 7 m at y 0
const SUN_MORNING = [0.38, 0.44, 0.82], SUN_GOLD = [0.65, 0.21, 0.73];
const SE = [0.326, 0.946];                                                   // the way to the south-east (azimuth 135) in this frame
// THE NEIGHBOURS, eleven (x, z, top y, mean width, shape); mon = a lived-in monastery and its size. Order T3: three crowned pillars stand
// near, 130 to 320 m from the haul line (the plumb line under the hatch's middle, x 17, z 2.7, where the rope hangs), on bearings
// 337.7, 270.5 and 15.2 degrees from it, at 206, 180 and 188 m:
//   M6 the LOW one (top y 60): in the first view's upper left, 160 m from the stage, and seen from above at 26 to 30 s;
//   M2 the MIDDLE one (top y 140), out beyond the knoll: level with us and a little above at 21 to 29 s;
//   M1 the HIGH one (top y 285): its shaft in the middle of the first view, 229 m from the stage, and THE LAST THIRD'S SUBJECT (after
//   the fourth showing, where the end was a pale plain, then rock and planks): from 34 s it stands 20 degrees to the right of the
//   held gaze, 215 to 195 m off, its crown whole against the sky from 37 s, the sun as far to the left of it, the plain, the river and
//   the sea between; as the gaze goes round and up it crosses the picture's middle at 41 to 42 s. It stood at (-112.8, 247.9), 277 m
//   off and by our own rock's flank; here it is clear of the flank (the rock's north-east corner bears 31 degrees from the eye at 38 s,
//   25 at 43 s; M1's right edge 29 and 27). The tusk, which stood where M1 now does, stands 80 m to the north-east of it.
// M3 and M4 stand farther out than in try 1 (M3 clear of M1's shaft as seen from the stage, M4 clear of the obelisk); the rest keep their places.
const HAUL = [17, 2.7];
// M6 stands on its bearing from the haul line (337.7 degrees) at the least distance at which its whole crown (its top and 26 m of
// building) lies under 0.92 of the half height of the level first picture (eye (103, 5, 0), heading 43): depth along the gaze
// 60.6 + 0.4177 d >= 81 / (0.92 * 0.601) = 146.5 m, so d = 206 m (was 168; the order's ring is 130 to 320 m). By sums it is whole
// in the picture only for the first 0.4 s (it stands at the left edge and the gaze turns from it); M3's stands whole to 6.4 s.
const M6_D = 206;
const NEIGHBOURS = [
  { name: 'M1', x: -32.4, z: 184, top: 285, w: 64, shape: 'column', mon: 'great' },
  { name: 'M2', x: 197, z: 1, top: 140, w: 50, shape: 'column', mon: 'middle' },
  { name: 'M3', x: -620, z: 570, top: 260, w: 150, shape: 'column', mon: 'great' },
  { name: 'M4', x: 420, z: -380, top: 135, w: 70, shape: 'column', mon: 'middle' },
  { name: 'M5', x: 520, z: -150, top: 95, w: 64, shape: 'column', mon: 'middle' },
  { name: 'M6', x: HAUL[0] + 0.379 * M6_D, z: HAUL[1] + 0.925 * M6_D, top: 60, w: 40, shape: 'square', mon: 'small' },
  { name: 'spindle', x: 30, z: 150, top: 70, w: 14, shape: 'spindle' },
  { name: 'tusk', x: 30, z: 235, top: 110, w: 30, shape: 'tusk' },
  { name: 'obelisk', x: 190, z: -250, top: 150, w: 36, shape: 'obelisk', ruin: 1, mon: 'ruin' },
  { name: 'dome-n', x: -330, z: -260, top: 62, w: 120, shape: 'dome' },
  { name: 'dome-e', x: 700, z: 420, top: 8, w: 110, shape: 'dome' },
];
const VILLAGE = [350, 650];
const ROAD = [[150, 205], [160, 262], [176, 335], [214, 428], [262, 522], [318, 598], [VILLAGE[0] + 62, VILLAGE[1] + 38], [VILLAGE[0] + 120, VILLAGE[1] + 190], [VILLAGE[0] + 190, VILLAGE[1] + 420], [VILLAGE[0] + 250, VILLAGE[1] + 640], [VILLAGE[0] + 290, VILLAGE[1] + 820]];      // from the track's end (TRACK[0]) by the village to the river

// ---------- the flight (try 2): the journey's plan, a rise of our own, one look-out ----------
// PLAN as before: heading 40 to 1 s, then 10.2 degrees a second to 39.33 s (391 degrees in all); the level speed at every second is the
// journey table's (its speed times the cosine of its pitch), so the line in plan, the nearest pass and the join are try 1's to the metre.
// RISE (ours, order T2): level to 4 s (the first view), then 4.9 m/s by 6 s (the eye is at the cave's height, y 44, at 13 s, while the
// heading still bears within 20 degrees of it), from 14 s easing to an even rate K (worked out below so that the turn ends at the
// height the old table ended at: the last straight is the part's own, untouched), and into the straight at its own 6.5 m/s.
// From 15 s the line is eased sideways by the table's 3.5 m miss, as in try 1.
const SPEEDS = [[0, 8.6], [5, 9.4], [10, 9.5], [15, 7.1], [40, 7.0], [48, 7.6]], PITCHES = [[0, 0], [5, 0], [10, 22], [15, 56], [17, 63], [35, 63], [40, 70]];
const T_TURN0 = 1, T_TURN1 = 1 + 391 / 10.2, T_EASE0 = 15;
const tab = (A, t) => { for (let i = 0; i < A.length - 1; i++) if (t <= A[i + 1][0]) return lerp(A[i][1], A[i + 1][1], (t - A[i][0]) / (A[i + 1][0] - A[i][0])); return A[A.length - 1][1]; };
const headingAt = (t) => (t < T_TURN0 ? 40 : t < T_TURN1 ? 40 + 10.2 * (t - T_TURN0) : 431);              // degrees, clockwise from +z; 90 looks at the face
const levelSpeed = (t) => tab(SPEEDS, t) * Math.cos(tab(PITCHES, t) * DEG);
const RISE = (() => {                                                      // the rise's rate by seconds: [t, m/s], K solved for the old end height
  let yOld = 5; const N = Math.round(T_TURN1 * 100); for (let i = 0; i < N; i++) yOld += Math.sin(tab(PITCHES, i * 0.01) * DEG) * tab(SPEEDS, i * 0.01) * 0.01;
  const vEnd = Math.sin(tab(PITCHES, T_TURN1) * DEG) * tab(SPEEDS, T_TURN1), T = (k) => [[0, 0], [4, 0], [6, 4.9], [14, 4.9], [17, k], [36, k], [T_TURN1, vEnd]];
  const rise = (k) => { let y = 5; const A = T(k); for (let i = 0; i < N; i++) y += tab(A, i * 0.01) * 0.01; return y; };
  const k = 5 + (yOld - rise(5)) / (rise(6) - rise(5));                    // the rise is linear in K
  return T(k);
})();
const flownSpeed = (t) => (t < T_TURN1 ? Math.hypot(levelSpeed(t), tab(RISE, t)) : tab(SPEEDS, t));
function journeyTable() {
  const rows = []; let x = 103.1, y = 5, z = 0, s = 0; const N = Math.round(T_TURN1 * 100);
  for (let i = 0; i <= N; i++) {
    const t = i * 0.01, h = headingAt(t) * DEG, v = levelSpeed(t), w = tab(RISE, t);
    rows.push([t, x, y, z, s]);
    x -= Math.sin(h) * v * 0.01; z += Math.cos(h) * v * 0.01; y += w * 0.01; s += Math.hypot(v, w) * 0.01;
  }
  // where the last straight passes at the height the turn ends at; the sideways miss of the table there
  const e = rows[rows.length - 1], k = (e[2] - RING[1]) / LINE_DIR[1], jx = RING[0] + LINE_DIR[0] * k, jz = RING[2] + LINE_DIR[2] * k;
  const mx = jx - e[1], mz = jz - e[3];
  for (const r of rows) { const w = sstep(T_EASE0, T_TURN1, r[0]); r[1] += mx * w; r[3] += mz * w; }
  return { rows, miss: Math.hypot(mx, mz), join: [jx, e[2], jz], straight: -k };
}
// control points: the table every second to 37 s, then in three even steps to the join (where the turn ends on the straight's own
// line, 63 m before the ring), then the straight at 5.5, 11 and 37 m and the ring: the 5.5 m after the join carry the last of the turn
function journeyPoints() {
  const J = journeyTable(), pts = [], at = (t) => { const r = J.rows[Math.round(t * 100)]; pts.push([r[1], r[2], r[3]]); };
  for (let t = 0; t <= 37; t += 1) at(t);
  const dt = (T_TURN1 - 37) / 3; at(37 + dt); at(37 + 2 * dt);
  pts.push(J.join);
  for (const d of [5.5, 11, 37, J.straight]) pts.push([J.join[0] + LINE_DIR[0] * d, J.join[1] + LINE_DIR[1] * d, J.join[2] + LINE_DIR[2] * d]);
  return { pts, J };
}
// seconds of the journey at metres flown, and the pace (speed over the mean speed) the engine is given. The engine's speed follows
// its pace with a lag of 1 / 1.4 s: the pace is the flown speed that much later, so that the turn stays at its even 10.2 degrees a second.
const PACE_LEAD = 1 / 1.4;
function makeFlight() {
  const { pts, J } = journeyPoints(), path = makePath(pts, { samples: 480 }), L = path.length;
  const N = 512, tOf = new Float32Array(N + 1), vOf = new Float32Array(N + 1);
  let tt = 0, v0 = flownSpeed(0);
  for (let i = 1; i <= N; i++) { let v1 = flownSpeed(tt + (L / N) / v0); const dt = (L / N) * 2 / (v0 + v1); tt += dt; tOf[i] = tt; v0 = flownSpeed(tt); }
  for (let i = 0; i <= N; i++) vOf[i] = flownSpeed(tOf[i] + PACE_LEAD);
  const mean = L / tt;
  const at = (A, u) => { const f = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(A[i], A[i + 1], f - i); };
  return { path, pts, L, seconds: tt, miss: J.miss, straight: J.straight, pace: (u) => at(vOf, u) / mean, secondsAt: (m) => at(tOf, m / L) };
}

// ---------- the gaze: ONE look-out (order T1) ----------
// A passenger in a net looks out and round, and up at the end. One pull of weight 1 over the whole flight (the engine's own guard
// leaves the first and last metres to the path): its place is 2,000 m from the eye in a direction given by the metres flown alone.
// THE BEARING IS THE GAZE'S OWN (after the second showing: by sums the great rock filled over half of the level picture from 3.3
// to 12.5 s and from 36.3 s to the end, 43 in 100 of the flight, while the gaze kept the path's own heading). The path is untouched;
// the net turns on its rope as the gaze does (the mount takes this bearing), never back:
//   40 until 0.6 s (the first view); QUICK IN, 20 degrees a second from 1.6 s until the eye is 45 m out from the face's mean plane
//   (7.3 s of the journey), across the cliff while it is still far; eased, until the eye is 30 m out (9.1 s), to THE FLANK's even
//   rate, which is the one rate solved, so that the whole turn ends on the hold (2.6 degrees a second): the gaze is past the wall's
//   own line (180) with the eye still 36 m off, and from there the wall is the picture's left flank as the eye climbs it, with the
//   lower ledge's chapel and the stair to it on that flank (the part), the wood, the obelisk, M4 and the valley beside it; from 14 to
//   16 s, where the journey's look-out begins, up to THE LOOK-OUT's 7.2 degrees a second, kept to 36.8 s, the rising look-out over
//   the land, the neighbours and the sea; HELD at 4 (364 on the table) from 38.8 s, the sea and the far range before us and the high
//   neighbour whole on the right, our own rock at the picture's right edge (after the third showing, where the end was wanted turned
//   out to the monastery tops and the coast); and from 39.6 to 46.6 s, as the gaze goes up, round to the path's own 71 (431), 10.9
//   degrees a second at the most.
//   (Until polish round 2 the quick turn was 13 degrees a second to 10.6 s and the slow rate the solved one, 7.16 from 12.6 s: the
//   gaze passed the wall's line only 13.5 m off, and viewers held the first look-out against the flight, the haul face filling the
//   picture and soft at that distance. The seconds here are the journey table's; the gaze reads them at the metres flown.)
// Pitch: level at the entry, 6 degrees under level from 4.5 s (with polish round B's two leans, below, by place); from 33 to 37 s up to 7 degrees over level, so that the high
// neighbour's monastery (33 degrees up at its roofs, 203 m off) stands whole in the picture over the plain and the sea; THE LOOK UP AT THE END at
// an even rate (eased over 0.12 of its time at either end, 10.7 degrees a second at the most) from 39.8 s to the path's own 70
// degrees at 46.5 s, as the eye comes to the floor.
const GAZE_QUICK = 20, GAZE_SLOW = 7.2, GAZE_HOLD = 364, GAZE_OUT_M = [45, 30], GAZE_T = [0.6, 1.6, 14, 16, 36.8, 38.8], GAZE_Y0 = 39.6, GAZE_Y1 = 46.6;
const GAZE = (() => {                                                      // the bearing by hundredths of a second; the flank's rate solved for the hold
  const R = journeyTable().rows, within = (m) => R.find((r) => r[1] <= m)[0];      // the journey's second at which the eye is first m metres out from the face
  const tA = within(GAZE_OUT_M[0]), tB = within(GAZE_OUT_M[1]);
  const T = (k) => [[0, 0], [GAZE_T[0], 0], [GAZE_T[1], GAZE_QUICK], [tA, GAZE_QUICK], [tB, k], [GAZE_T[2], k], [GAZE_T[3], GAZE_SLOW], [GAZE_T[4], GAZE_SLOW], [GAZE_T[5], 0]];
  const N = Math.round(GAZE_T[5] * 100), end = (k) => { let h = 40; const A = T(k); for (let i = 0; i < N; i++) h += tab(A, (i + 0.5) * 0.01) * 0.01; return h; };
  const flank = 2 + (GAZE_HOLD - end(2)) / (end(3) - end(2)), A = T(flank), rows = new Float64Array(N + 1);      // the end is linear in the flank's rate
  let h = 40; for (let i = 0; i <= N; i++) { rows[i] = h; h += tab(A, (i + 0.5) * 0.01) * 0.01; }
  return { rows, N, flank, tA, tB };
})();
const LOOK_DOWN = -6, LOOK_EASE = 0.12, LOOK_HIGH = 7, LOOK_H0 = 33, LOOK_H1 = 37, LOOK_UP0 = 39.8, LOOK_UP1 = 46.5;
const ramp = (s) => { const a = LOOK_EASE, x = clamp(s, 0, 1), k = 1 / (1 - a); return x < a ? k * x * x / (2 * a) : x > 1 - a ? 1 - k * (1 - x) * (1 - x) / (2 * a) : k * (x - a / 2); };
// POLISH ROUND B: TWO LEANS laid over the table, each a rule of places alone (the eye's height against the cave's sill; where the
// nearest lived-in neighbour stands from the eye): no second of the table is read to begin or end them and none is typed in seconds.
// The table's own bearings are untouched, no rest and no quick turn is added, and the gaze still never turns back (the first
// lean's fastest giving is half the flank's own rate).
//   AT THE HERMIT'S CAVE (its sill at y 44, the part's anchor box): while the eye rises from LEAN_Y[0] to LEAN_Y[1] metres against
//   the sill the gaze leans back toward the wall by LEAN_CAVE degrees and up by LEAN_UP, so that the cave with its cloths stands
//   inside the picture's upper left corner and not over it; both are given back by LEAN_Y[2]. The three heights, and why: 20 m under
//   the sill the mouth's middle stands 23 degrees over the eye and comes under the top of the picture (25 over at live's pitch);
//   5 m under it the mouth stands 15 degrees up, the last of the look up into it before the eye draws level; 15 m over it the mouth
//   is 50 degrees under the eye and gone from the picture, and the look-out begins, whose bearings this round is ordered to keep.
//   It is not the wall's own line (180): M4 keeps well inside the right of the picture.
//   ON THE CLOSE PASS OF THE NEAREST LIVED-IN NEIGHBOUR (found by rule: the nearest in plan to the eye where it is level with the
//   cave's sill, which is M2): the pitch is the pitch its built top NEEDS, held between live's 6 under level and level (the round's
//   order: level, never over). The need is plain geometry of each row: the pitch at which a point NEAR_TOP metres over the pillar's
//   crown stands NEAR_SKY degrees of sky under the picture's top edge AT ITS OWN PLACE ACROSS THE PICTURE (the edge stands lower
//   toward the sides: the tangent of its height falls with the cosine of the degrees off the middle). NEAR_TOP is the part's own
//   most for a 'middle' monastery on every seed: a tall cypress, 0.3 + a range of five storeys 18 + half its depth 4 + 11 m (the
//   hoist tower is held to 30 m and its cap rises 2.25 m more). LENS_UP is this world's lens above its middle (fov 62, below).
//   The lift is whole while the need is level or more and is given back as the need sinks to NEAR_SKY under live's pitch, slower
//   than the roofs fall. It is let in as the gaze turns out to the look-out and that pillar comes round from NEAR_OFF[0] to
//   NEAR_OFF[1] degrees off it: along the flank it stands 76.6 to 80 degrees off the table's bearing, so from 75 the lift is nought
//   all along the flank and begins as the gaze turns out; it is whole 3 degrees before the pillar comes into a picture of 16 to 9
//   (46.9 degrees off). So the level top holds from there until the eye has
//   climbed so far that the top needs less than level: a stretch of about 19 m of the way, not a moment.
const LEAN_CAVE = 2.5, LEAN_UP = 3, CAVE_SILL = 44, LEAN_Y = [-20, -5, 15], NEAR_OFF = [75, 50], NEAR_TOP = 34, NEAR_SKY = 3, LENS_UP = 31;
const LEAN = (() => {                                                      // the two leans by hundredths of a second, each from the eye's place in that row
  const R = journeyTable().rows, N = R.length - 1, sill = R.find((r) => r[2] >= CAVE_SILL) || R[N];
  const near = NEIGHBOURS.filter((n) => n.mon && n.mon !== 'ruin').reduce((a, n) => (Math.hypot(n.x - sill[1], n.z - sill[3]) < Math.hypot(a.x - sill[1], a.z - sill[3]) ? n : a));
  const cave = new Float64Array(N + 1), up = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const r = R[i], y = r[2] - CAVE_SILL; cave[i] = sstep(LEAN_Y[0], LEAN_Y[1], y) - sstep(LEAN_Y[1], LEAN_Y[2], y);
    let off = Math.atan2(r[1] - near.x, near.z - r[3]) / DEG - GAZE.rows[Math.min(GAZE.N, i)]; off = Math.abs(off - 360 * Math.round(off / 360));      // the neighbour's degrees off the table's bearing
    const te = (near.top + NEAR_TOP - r[2]) / Math.hypot(near.x - r[1], near.z - r[3]), ca = Math.cos(Math.min(off, 89) * DEG), T = Math.tan((LENS_UP - NEAR_SKY) * DEG);
    const need = Math.atan((te - T * ca) / (ca + T * te)) / DEG;           // the pitch at which its built top stands NEAR_SKY under the top edge, at its own place across the picture
    up[i] = sstep(NEAR_OFF[0], NEAR_OFF[1], off) * sstep(LOOK_DOWN - NEAR_SKY, 0, need);
  }
  const at = (A, t) => { const f = clamp(t, 0, N / 100) * 100, i = Math.min(N - 1, Math.floor(f)); return lerp(A[i], A[i + 1], f - i); };
  return { cave: (t) => at(cave, t), up: (t) => at(up, t), near: near.name };
})();
const gazeAt = (t) => { const f = clamp(t, 0, GAZE_T[5]) * 100, i = Math.min(GAZE.N - 1, Math.floor(f)); return lerp(GAZE.rows[i], GAZE.rows[i + 1], f - i) - LEAN_CAVE * LEAN.cave(t) + (431 - GAZE_HOLD) * ramp((t - GAZE_Y0) / (GAZE_Y1 - GAZE_Y0)); };      // degrees, clockwise from +z; 90 looks at the face
const lookPitch = (t) => (t < LOOK_H0 ? LOOK_DOWN * sstep(0.5, 4.5, t) + LEAN_UP * LEAN.cave(t) - LOOK_DOWN * LEAN.up(t)
  : t < LOOK_UP0 ? lerp(LOOK_DOWN, LOOK_HIGH, ramp((t - LOOK_H0) / (LOOK_H1 - LOOK_H0)))
  : lerp(LOOK_HIGH, 70, ramp((t - LOOK_UP0) / (LOOK_UP1 - LOOK_UP0))));
function makePois(F) {
  const L = F.L, eye = new THREE.Vector3(), out = new THREE.Vector3();
  const lookOut = (time, u) => {
    const d = clamp(u, 0, 1) * L, t = F.secondsAt(d), h = gazeAt(t) * DEG, p = lookPitch(t) * DEG;
    F.path.posAtDist(d, eye);
    return out.set(eye.x - Math.sin(h) * Math.cos(p) * 2000, eye.y + Math.sin(p) * 2000, eye.z + Math.cos(h) * Math.cos(p) * 2000);
  };
  return [{ at: lookOut, from: -1, to: 2, fade: 0.2, weight: 1 }];
}

// ---------- the looks ----------
// One draw of the stream 'look' and the visit's hour: the October morning, the first gold hour, the morning after rain; the rare
// event is the first snow (after a dry night: a rain look with snow is the morning). Mules and kerchiefs follow the visit's density.
// THE FIRST GOLD HOUR IS THE COMMONEST (round C): where no hour is asked, a quarter of the draws (LOOK_SHARE[0]) are the nine o'clock
// morning, a half the first gold hour, a quarter the morning after rain. Until round B the morning had a half and the gold hour a
// quarter; the one bound moved is the morning's, so no draw that had the gold hour or the rain lost it. The world's long circling
// looks out with the sun behind it for half the haul: in the nine o'clock light that stretch is lit flat from behind the eye, in the
// first hour the sun is low and to the side, the shadows lie five heights long and the far range stands in rose haze.
const LOOK_SHARE = [0.25, 0.75];                                            // the draw's bounds: under the first the morning, under the second the gold hour, over it the rain
function chooseLook(ctx, st) {
  const v = ctx.vary || {}, r = st('look')(), h = v.hour;
  let name = h === 'dawn' || h === 'golden' ? 'gold' : h === 'day' ? (r < 0.65 ? 'morning' : 'rain') : (r < LOOK_SHARE[0] ? 'morning' : r < LOOK_SHARE[1] ? 'gold' : 'rain');
  const snow = v.rare ? 1 : 0; if (snow && name === 'rain') name = 'morning';
  const d = clamp(((v.density ?? 1) - 0.7) / 0.6, 0, 1), gold = name === 'gold', rain = name === 'rain', sd = gold ? SUN_GOLD : SUN_MORNING, sl = Math.hypot(sd[0], sd[1], sd[2]);
  return { name, snow, gold, rain, wet: rain ? 1 : 0, lamps: gold ? 1 : 0, mules: Math.round(lerp(4, 9, d)), kerchiefs: Math.round(lerp(9, 20, d)),
    // THE LIGHT (order try 3, 2 and 3): a strong warm sun against a cooler, lower sky; on rock the shaded side takes the sky's
    // blue-violet (rockShade, through the part's own shade uniform) so that it stands near 0.4 of the sunlit side; the same rule in every look.
    // Gold: the sun low and orange, the sky warm toward it, warm haze, the range in rose.
    sun: [sd[0] / sl, sd[1] / sl, sd[2] / sl], sunColor: gold ? '#FFB266' : '#FFE6C0', sunPower: gold ? 4.6 : 3.6, fillColor: gold ? '#9A98D8' : '#93A4E8', fillPower: gold ? 1.2 : 1.05, sideColor: gold ? '#B2A8E6' : '#A4B4F2', sidePower: gold ? 1.3 : 1.5,
    rockShade: gold ? [0.98, 0.82, 1.2] : [1.25, 1.27, 1.95],            // the light in a rock's shade (irradiance, linear): blue-violet, whatever the sun's colour
    fogColor: gold ? '#E2C2A6' : rain ? '#BCD4EA' : '#BFD3E8', fog: rain ? 0.0002 : gold ? 0.00034 : 0.0003,      // the air between the pillars: the far great one, 950 m off, is a tenth paler; washed clearer after rain
    skyZenith: gold ? '#56649f' : '#5270b0', skyMid: gold ? '#8E9CCB' : null, skyHorizon: gold ? '#F4C690' : null, skyScatter: gold ? '#FFA858' : '#fff0d8', skyScatterK: gold ? 0.85 : 0.3,
    exposure: 1, leafGain: rain ? 0.8 : 1, groundGain: rain ? 0.84 : 1,
    farFog: rain ? 0.00008 : 0.00016, rangeHaze: gold ? '#CF9FA4' : rain ? '#8fa6c4' : '#9ab0cd' };      // the far hills' own haze, and the colour of the range's air (gold: rose)
}
const looksOf = (core, seed, vary) => chooseLook({ vary }, (name) => core.makeRng(core.hashSeed(name + ':' + seed)));

// ---------- the ground ----------
const TRACK = [[150, 205], [118, 128], [72, 62], [53, 28], [47, 9], [32, 3], [18, -3], [10, -12], [6, -28], [3.5, -41]];   // the cobbled mule track, plan
const SHRINE = [51.5, 4.5], PASTURE = [175, 75], HOLLOW = [30, 10];          // the shrine where the track crosses the saddle; the flock's pasture beyond the knoll
const GULLY = [[185, 120], [190, 215], [205, 330], [290, 470], [380, 560]];
// THE UPLAND (order try 3, 6), by rules of the ground. The hills' own height (the kit's hills noise, 3 to 54 m, half the ground under
// 22) says what a place is: a HOLLOW under 16 m (the lowest quarter), a RIDGE over 33 m (the highest seventh). Woods stand in the
// hollows and within 45 m of the gully; rock crops out and blocks lie on the ridges; folds stand on gentle middle ground by a track or
// the water; the second track runs from the first (at 118, 128) over the upland to the feet of M5 and M4.
const HOLLOW_H = 16, RIDGE_H = 33;
const TRACK2 = [[118, 128], [205, 95], [290, 60], [380, -20], [455, -110], [440, -230], [405, -320]];
const GREAT = { x0: -118, x1: -2, z0: -63, z1: 58, top: 240 };
// distance from (x, z) to a polyline, and how far along it (metres) the nearest point lies
function polyDist(P, x, z, out) {
  let best = 1e18, along = 0, acc = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const ax = P[i][0], az = P[i][1], dx = P[i + 1][0] - ax, dz = P[i + 1][1] - az, l2 = dx * dx + dz * dz, t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1);
    const ex = x - ax - dx * t, ez = z - az - dz * t, d = ex * ex + ez * ez, l = Math.sqrt(l2);
    if (d < best) { best = d; along = acc + l * t; }
    acc += l;
  }
  if (out) out.along = along;
  return Math.sqrt(best);
}
// THE GULLIES of the upland (order of 03:47 UTC 10 Oct, point 15; addenda C and D): candidates on a 160 m lattice (stream 'gullies',
// every candidate's dice first, taken by lot), starting on middle ground (the hills' own height 20 to 39): the water's way down (the
// ground's steepest fall, 8 m steps) until a hollow (hills under 14), a fall under 0.03, the second track, an earlier gully within
// 24 m, or 320 m; kept from 96 m; MID_GULLIES at most. The ground is drawn dark along each; the middle ground's deal sets bush on it.
const MID_CELL = 100, MID_R0 = 250, MID_R1 = 900, MID_STEEP = 0.3, MID_GULLIES = 8;
const inMid = (x, z) => { const r0 = Math.hypot(x - HOLLOW[0], z - HOLLOW[1]); return r0 >= MID_R0 && r0 <= MID_R1 && SE[0] * x + SE[1] * z <= 700 && !inPillar(x, z, 25) && Math.hypot(x - VILLAGE[0], z - VILLAGE[1]) > 140 && Math.hypot(x - PASTURE[0], z - PASTURE[1]) > 60; };
function traceGullies(st, hills, height) {
  const rg = st('gullies'), cand = [], lines = [];
  for (let gx0 = -770; gx0 <= 830; gx0 += 160) for (let gz0 = -790; gz0 <= 810; gz0 += 160) cand.push([rg(), gx0 + rg.range(-50, 50), gz0 + rg.range(-50, 50), rg()]);
  cand.sort((p, q) => p[0] - q[0]);
  for (const [, x0, z0, tone] of cand) {
    if (lines.length >= MID_GULLIES) break;
    if (!inMid(x0, z0)) continue;
    const hv0 = hills(x0, z0); if (hv0 < HOLLOW_H + 4 || hv0 > RIDGE_H + 6) continue;
    const pts = [[x0, z0]]; let x = x0, z = z0, ok = true;
    for (let k = 0; k < 40; k++) {
      const gx = (height(x + 6, z) - height(x - 6, z)) / 12, gz = (height(x, z + 6) - height(x, z - 6)) / 12, sl = Math.hypot(gx, gz); if (sl < 0.03) break;
      x -= 8 * gx / sl; z -= 8 * gz / sl;
      if (!inMid(x, z) || polyDist(TRACK2, x, z, null) < 6) break;
      if (lines.some((L) => x > L.x0 - 24 && x < L.x1 + 24 && z > L.z0 - 24 && z < L.z1 + 24 && L.pts.some((p) => Math.hypot(p[0] - x, p[1] - z) < 24))) { ok = pts.length >= 13; break; }
      pts.push([x, z]); if (hills(x, z) < HOLLOW_H - 2) break;
    }
    if (!ok || pts.length < 13) continue;
    lines.push({ pts, tone, x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), z0: Math.min(...pts.map((p) => p[1])), z1: Math.max(...pts.map((p) => p[1])) });
  }
  return lines;
}
function makeGround(ctx, look, st) {
  const n = ctx.noise, hills = T.hills({ noise: n, height: 46, scale: 300 }), o = { along: 0 };
  const taluses = [];                                                   // filled once the neighbours' widths are known: [x, z, w]
  for (const q of NEIGHBOURS) taluses.push([q.x, q.z, q.w]);
  const ridge = (h, x, z, ax, az, bx, bz, ya, ym, yb, w) => {            // a ridge along a segment: crest ya at a, ym midway, yb at b; gaussian flanks
    const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), d2 = (x - ax - dx * t) ** 2 + (z - az - dz * t) ** 2;
    if (d2 > w * w * 9) return h;
    const crest = t < 0.5 ? lerp(ya, ym, t * 2) : lerp(ym, yb, t * 2 - 1);
    return Math.max(h, lerp(h, crest, Math.exp(-d2 / (w * w))));
  };
  const height = (x, z) => {
    const s = SE[0] * x + SE[1] * z, r0 = Math.hypot(x - 30, z - 10);
    let h = -26 - 164 * sstep(250, 950, s);
    const wild = (1 - sstep(700, 950, s)) * sstep(150, 420, r0);
    if (wild > 0) h += wild * (hills(x, z) - 20) + 110 * sstep(350, 2200, -SE[1] * x + SE[0] * z) * (1 - sstep(600, 950, s));
    if (r0 < 300) h = lerp(-26 + 4 * n.n2(x / 60, z / 60), h, sstep(170, 300, r0));
    if (s > 60 && s < 700) {                                             // the gully that leads the stream down toward the village
      const d = polyDist(GULLY, x, z, o); if (d < 60) h -= 10 * Math.exp(-(d * d) / (22 * 22)) * sstep(0, 80, o.along);
    }
    const rv = Math.hypot(x - VILLAGE[0], z - VILLAGE[1]); if (rv < 190) h = lerp(-150 - 0.03 * (SE[0] * (x - VILLAGE[0]) + SE[1] * (z - VILLAGE[1])), h, sstep(100, 190, rv));   // the village's shelf
    for (const q of taluses) { const dx = x - q[0], dz = z - q[1], w = q[2] * 0.9, d2 = dx * dx + dz * dz; if (d2 < w * w * 6) h += 0.12 * q[2] * Math.exp(-d2 / (w * w)); }
    const rk = Math.hypot(x - KNOLL[0], z - KNOLL[1]); if (rk < 60) h = Math.max(h, -40 * (rk / 48) * (rk / 48));
    h = ridge(h, x, z, 98, 2, 45, 8, -9, -11, -12, 17);                 // the saddle between knoll and pillar, in two reaches
    h = ridge(h, x, z, 45, 8, 14, -4, -12, -11.5, -10, 17);
    h = ridge(h, x, z, 9, -8, 2.5, -47, -10, -2, 7.3, 8);               // the bench along the face foot: the track's last climb to the platform
    return h;
  };
  const gullies = traceGullies(st, hills, height), gullyC = lin('#454a30');
  // colours (linear): dry gold grass, leaf litter under the planes, the bare rock of the knoll, trodden earth by the track, snow
  const grassA = lin('#8f8454'), grassB = lin('#a79a5e'), litter = lin('#7d6a3a'), rock = lin('#857f66'), earth = lin('#93866d'), plain = lin('#9c935f'), scrub = lin('#646540'), woodFloor = lin('#414b2c'), farWood = lin('#2e3b1f'), snow = [0.78, 0.83, 0.92];
  const color = (x, z, h, ny, out) => {
    const s = SE[0] * x + SE[1] * z, r0 = Math.hypot(x - 30, z - 10), k = 0.5 + 0.5 * n.n2(x / 90, z / 90), k2 = 0.5 + 0.5 * n.n2(x / 17 + 31, z / 17);
    let c = mix3(grassA, grassB, k);
    c = mix3(c, litter, 0.7 * (1 - sstep(190, 330, r0)) * (0.6 + 0.4 * k2));
    c = mix3(c, scrub, 0.6 * sstep(0.5, 0.72, 0.5 + 0.5 * n.n2(x / 150 + 7, z / 150 - 3) + 0.25 * (k2 - 0.5)) * sstep(160, 320, r0));      // dry scrub in patches on the open upland
    if (r0 > 300 && s < 950) { const hv = hills(x, z), up = sstep(300, 420, r0) * (1 - sstep(700, 950, s));       // the upland: dark leaf mould under the woods of the hollows, bare pale rock on the ridges
      // beyond the last crowns (700 m) the wood is its colour alone: darker there, its edge broken by the fine noise; along the gully too
      const far = sstep(620, 780, r0), wood = Math.max(1 - sstep(HOLLOW_H - 3, HOLLOW_H + 1, hv + 5 * (k2 - 0.5) * far), r0 < 800 ? 1 - sstep(30, 50, polyDist(GULLY, x, z, null)) : 0);
      c = mix3(c, mix3(woodFloor, farWood, far), (0.75 + 0.2 * far) * wood * up); c = mix3(c, rock, 0.45 * sstep(RIDGE_H - 2, RIDGE_H + 4, hv) * up);
      // point 15: scrub's own colour on the steeper slopes (a fall of 0.27 to 0.43 and more), and each gully a dark thread 6 m either way
      c = mix3(c, scrub, 0.55 * (1 - sstep(0.92, 0.965, ny)) * (1 - wood) * up);
      for (const L of gullies) if (x > L.x0 - 9 && x < L.x1 + 9 && z > L.z0 - 9 && z < L.z1 + 9) { const d = polyDist(L.pts, x, z, null); if (d < 9) c = mix3(c, gullyC, 0.8 * (1 - sstep(2.5, 9, d))); } }
    c = mix3(c, plain, sstep(700, 950, s));
    const rk = Math.hypot(x - KNOLL[0], z - KNOLL[1]); c = mix3(c, rock, 0.9 * (1 - sstep(26, 40, rk)));
    if (r0 < 260) { const d = polyDist(TRACK, x, z, null); c = mix3(c, earth, 0.6 * (1 - sstep(2, 7, d))); }
    if (r0 > 100 && r0 < 620) { const d = polyDist(TRACK2, x, z, null); if (d < 9) c = mix3(c, earth, 0.5 * (1 - sstep(2, 8, d))); }
    const g = look.groundGain * (0.9 + 0.2 * k2);
    c = [c[0] * g, c[1] * g, c[2] * g];
    if (look.snow) c = mix3(c, snow, sstep(0.72, 0.9, ny) * (0.82 + 0.18 * k2));
    return out.setRGB(c[0], c[1], c[2]);
  };
  // the look's sun in plan, and what throws the long shadows that the ground is cut finer for: the three near neighbours, the hero, the
  // knoll: [x, z, the shadow's length (to 420 m), half its width]
  const S0 = look.sun, hl = Math.hypot(S0[0], S0[2]), ux = S0[0] / hl, uz = S0[2] / hl, tan = S0[1] / hl;
  const casters = [[-60, -3, Math.min(420, 266 / tan), 62], [KNOLL[0], KNOLL[1], Math.min(260, 26 / tan + 40), 34]];
  for (const q of NEIGHBOURS) if (Math.hypot(q.x - HAUL[0], q.z - HAUL[1]) < 330 && q.top > 50) casters.push([q.x, q.z, Math.min(420, (q.top + 26) / tan), q.w * 0.5]);
  // how fine the ground is cut: finest under the flight (a disc that holds the whole route in plan), finer about each neighbour's foot and the village
  const focus = (x, z) => {
    let d = Math.max(0, Math.hypot(x - 56, z - 8) - 60);
    for (const q of NEIGHBOURS) { const e = 260 + Math.max(0, Math.hypot(x - q.x, z - q.z) - q.w); if (e < d) d = e; }
    for (const c of casters) { const dx = x - c[0], dz = z - c[1], t = clamp(-(dx * ux + dz * uz), 0, c[2]), e = 170 + 0.8 * Math.max(0, Math.hypot(dx + ux * t, dz + uz * t) - c[3]); if (e < d) d = e; }
    const e = 200 + Math.max(0, Math.hypot(x - VILLAGE[0], z - VILLAGE[1]) - 140); return e < d ? e : d;
  };
  // the shade of the pillars and the knoll on ground and trees, by sums: 0 lit .. 1 in shade, for a point and the sun's direction
  const boxShade = (x, y, z, m) => {
    const B = GREAT, x0 = B.x0 - m, x1 = B.x1 + m, z0 = B.z0 - m, z1 = B.z1 + m;
    let ta = 0, tb = 1e9;
    { const a = (x0 - x) / ux, b = (x1 - x) / ux; ta = Math.max(ta, Math.min(a, b)); tb = Math.min(tb, Math.max(a, b)); }
    { const a = (z0 - z) / uz, b = (z1 - z) / uz; ta = Math.max(ta, Math.min(a, b)); tb = Math.min(tb, Math.max(a, b)); }
    return tb > ta ? 1 - sstep(B.top - 6, B.top + 6, y + ta * tan) : 0;
  };
  const fineCast = (q) => Math.hypot(q.x - HAUL[0], q.z - HAUL[1]) < 330 && q.top > 50;
  const shade = (x, y, z, only) => {                                     // only: 'near' = the casters the ground is cut finer for; a neighbour = that one alone
    let sh = only && only !== 'near' ? 0 : (boxShade(x, y, z, -5) + boxShade(x, y, z, 0) + boxShade(x, y, z, 5)) / 3;
    for (const q of NEIGHBOURS) {
      if (only && (only === 'near' ? !fineCast(q) : only !== q)) continue;
      const dx = q.x - x, dz = q.z - z, t0 = dx * ux + dz * uz; if (t0 < 0) continue;
      const R = q.w * 0.45, d = Math.abs(dx * uz - dz * ux); if (d > R + 6) continue;
      const te = Math.max(0, t0 - Math.sqrt(Math.max(0, R * R - d * d))), v = (1 - sstep(R - 6, R + 6, d)) * (1 - sstep(q.top - 10, q.top + 10, y + te * tan));
      if (v > sh) sh = v;
    }
    // the knoll's own shadow: a march toward the sun over its cap (top y 0, falling as the square of the distance)
    const kx = x - KNOLL[0], kz = z - KNOLL[1], along = -(kx * ux + kz * uz);
    if ((!only || only === 'near') && sh < 1 && along > -50 && along < 320 && Math.abs(kx * uz - kz * ux) < 60) {
      for (let t = 6; t <= 150; t += 8) { const rk = Math.hypot(kx + ux * t, kz + uz * t); if (rk < 56 && y + t * tan < -40 * (rk / 48) * (rk / 48) - 1) { const v = 1 - sstep(-3, 2, y + t * tan + 40 * (rk / 48) * (rk / 48)); if (v > sh) sh = v; break; } }
    }
    return sh;
  };
  return { height, color, focus, shade, fineCast, hills, sunPlan: [ux, uz, tan], gullies };
}

// The far pillars' shadows (order T5b): out there the ground is cut too coarse to hold a shadow in its vertices, so each is laid on
// it: a strip from the pillar along the look's sun to where its top's shadow ends (at most 420 m), cells 12 m long, seven points
// across, every point shaded by the same sum the trees take; it multiplies what lies under it (no light of its own) and thins with the air.
function makeFarShadows(env, terrain) {
  const { look, ground } = env, [ux, uz, tan] = ground.sunPlan, P = [], C = [], I = [], AC = [-1.3, -0.95, -0.55, 0, 0.55, 0.95, 1.3];
  for (const q of NEIGHBOURS) {
    if (ground.fineCast(q) || q.top < 20) continue;
    const R = q.w * 0.45, L = Math.min(look.gold ? 820 : 420, (q.top + 60) / tan + R), n = Math.ceil(L / (look.gold ? 18 : 12)), base = P.length / 3;   // the low sun's shadows reach twice as far
    const air = Math.exp(-((Math.hypot(q.x - HAUL[0], q.z - HAUL[1]) * look.fog) ** 2));
    for (let i = 0; i <= n; i++) for (const a of AC) {
      const t = L * i / n, x = q.x - ux * t + uz * a * R, z = q.z - uz * t - ux * a * R, y = terrain.surfaceAt(x, z);
      const k = (a === AC[0] || a === AC[6] || i === n ? 0 : ground.shade(x, y + 0.5, z, q)) * air;
      P.push(x, y + 0.7 + 3 * (x * x + z * z) / 1e6, z); C.push(1 - 0.46 * k, 1 - 0.41 * k, 1 - 0.3 * k);
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < 6; j++) { const a = base + i * 7 + j, b = a + 7; I.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh.name = 'far-shadows'; mesh.renderOrder = 1;
  return { mesh, triangles: I.length / 3 };
}

// ---------- the far country ----------
// A plain geometry for the ground's own material: position, normal, colour and the baked shade the terrain shader expects.
function groundGeometry(P, N, C, I) {
  const g = new THREE.BufferGeometry(), n = P.length / 3, sh = new Float32Array(n * 2).fill(1);
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aShade', new THREE.BufferAttribute(sh, 2));
  g.setIndex(I); g.computeBoundingSphere();
  return g;
}
// The land beyond the cut ground: four rings fanned out from the terrain's own rim (the same height and colour rules), to 10 km and more.
function makeFan(terrain, G) {
  const pos = terrain.geometry.attributes.position, B = terrain.bounds, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2, e = 0.01, rim = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    if (Math.abs(z - B.minZ) < e) rim.push([x, z, 0, x - B.minX]); else if (Math.abs(x - B.maxX) < e) rim.push([x, z, 1, z - B.minZ]);
    else if (Math.abs(z - B.maxZ) < e) rim.push([x, z, 2, B.maxX - x]); else if (Math.abs(x - B.minX) < e) rim.push([x, z, 3, B.maxZ - z]);
  }
  rim.sort((a, b) => a[2] - b[2] || a[3] - b[3]);
  const K = [1, 1.09, 1.3, 1.8, 2.9], n = rim.length, P = [], N = [], C = [], I = [], col = new THREE.Color();
  for (let r = 0; r < K.length; r++) for (let i = 0; i < n; i++) {
    const x = cx + (rim[i][0] - cx) * K[r], z = cz + (rim[i][1] - cz) * K[r], y = G.height(x, z), d = 30 * K[r];
    const gx = (G.height(x + d, z) - G.height(x - d, z)) / (2 * d), gz = (G.height(x, z + d) - G.height(x, z - d)) / (2 * d), l = 1 / Math.hypot(gx, 1, gz);
    P.push(x, y, z); N.push(-gx * l, l, -gz * l); G.color(x, z, y, l, col); C.push(col.r, col.g, col.b);
  }
  for (let r = 0; r < K.length - 1; r++) for (let i = 0; i < n; i++) { const a = r * n + i, b = r * n + (i + 1) % n, c = a + n, d = b + n; I.push(a, b, c, b, d, c); }
  const mesh = new THREE.Mesh(groundGeometry(P, N, C, I), terrain.material); mesh.name = 'far-ground';
  return mesh;
}
const E_S = SE, E_L = [0.946, -0.326];                                  // along the plain to the south-east, and across it to the north-east
const plainAt = (s, l) => [E_S[0] * s + E_L[0] * l, E_S[1] * s + E_L[1] * l];
const liftAt = (x, z) => 2 + (x * x + z * z) / 1e6;                      // metres above the level plain: more than the depth buffer's step at that distance
// the braided river: the main channel wanders 90 m about s 1600; a second leaves and rejoins it every 700 m on the far side, a third
// (narrow) every 900 m on the near side; between and beside them lie the gravel bars
const riverS = (l, k) => 1600 + 90 * Math.sin(l / 520) + 35 * Math.sin(l / 190 + 1) + (k === 1 ? 105 * Math.sin(Math.PI * l / 700) ** 2 + 8 : k === 2 ? -70 * Math.sin(Math.PI * l / 900 + 1) ** 2 - 6 : 0);
const inRiver = (s, l, m) => s > riverS(l, 2) - m && s < riverS(l, 1) + m;
// Far crowns (mulberries, poplars, the far woods): each a round five-sided crown of two rings between two points. The sun stands still,
// so its light is written into the colours once: a leaf crown takes light round its side and passes some through (as the kit's trees do).
function makeCrowns(look) {
  const P = [], C = [], I = [], S = look.sun, sunL = mul3(lin(look.sunColor), look.sunPower / Math.PI), skyL = mul3(lin(look.fillColor), look.fillPower / Math.PI);
  const add = (x, y, z, r, h, c, rot = 0, small = false) => {
    const k = P.length / 3, put = (px, py, pz) => {
      let nx = px / (r * r), ny = (py - 0.15 * h) / (0.56 * h * h), nz = pz / (r * r); const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const sun = clamp((nx * S[0] + ny * S[1] + nz * S[2] + 0.55) / 1.55, 0, 1), under = 0.62 + 0.38 * clamp(0.5 + py / h, 0, 1);
      P.push(x + px, y + py, z + pz);
      for (let q = 0; q < 3; q++) C.push(c[q] * under * (skyL[q] * (1.05 + 0.25 * ny) + sunL[q] * (0.1 + 0.9 * sun)));
    };
    // no two alike: each point of the two rings stands in or out and up or down by its own share (from the crown's place, not from a stream)
    const hs = (n) => { const v = Math.sin(x * 12.9898 + z * 78.233 + n * 37.719) * 43758.5453; return v - Math.floor(v); };
    if (small === 2) {                                                   // the least form (point 15): three points on the ground and a top, for a thicket or a boulder beyond 450 m of the line
      for (let i = 0; i < 3; i++) { const a = rot + TAU * (i + 0.4 * (hs(i) - 0.5)) / 3, q = 0.8 + 0.5 * hs(i + 5); put(r * q * Math.cos(a), -0.38 * h, r * q * Math.sin(a)); }
      put(0.3 * r * (hs(25) - 0.5), (0.42 + 0.13 * hs(26)) * h, 0.3 * r * (hs(27) - 0.5)); for (let i = 0; i < 3; i++) I.push(k + i, k + 3, k + (i + 1) % 3); return; }
    put(0, -0.5 * h, 0);
    for (let i = 0; i < 5; i++) { const a = rot + TAU * (i + 0.3 * (hs(i) - 0.5)) / 5, k = 0.72 + 0.56 * hs(i + 5); put(r * k * Math.cos(a), (0.05 + 0.22 * (hs(i + 10) - 0.5)) * h, r * k * Math.sin(a)); }
    if (small) { put(0.3 * r * (hs(25) - 0.5), (0.42 + 0.13 * hs(26)) * h, 0.3 * r * (hs(27) - 0.5)); for (let i = 0; i < 5; i++) { const a = k + 1 + i, b = k + 1 + (i + 1) % 5; I.push(k, a, b, a, k + 6, b); } return; }
    for (let i = 0; i < 5; i++) { const a = rot + TAU * (i + 0.5) / 5, k = 0.64 * (0.7 + 0.6 * hs(i + 15)); put(r * k * Math.cos(a), (0.64 + 0.24 * (hs(i + 20) - 0.5)) * h, r * k * Math.sin(a)); }
    put(0.3 * r * (hs(25) - 0.5), (0.8 + 0.13 * hs(26)) * h, 0.3 * r * (hs(27) - 0.5));
    for (let i = 0; i < 5; i++) { const a = k + 1 + i, b = k + 1 + (i + 1) % 5, c2 = k + 6 + i, d = k + 6 + (i + 1) % 5; I.push(k, a, b, a, c2, b, b, c2, d, c2, k + 11, d); }
  };
  const mesh = (material) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, material); m.name = 'far-crowns'; return m;
  };
  return { add, mesh, get triangles() { return I.length / 3; } };
}
// The river plain of the 1700s (order T5c): open-field furlongs cut into long strips (stubble, plough, fallow, winter green: earth
// colours close in tone, a balk between), commons left as the plain's own grass; the river's gravel bed; rows of yellow poplars along
// field edges and the river, each row with its long shadow by the look's sun; the road from the track's end by the village to the river.
function makePlain(st, look, terrain, crowns, middle) {
  const rf = st('fields'), P = [], N = [], C = [], I = [], snow = [0.78, 0.83, 0.92], gg = look.groundGain;
  const tones = [lin('#b89c54'), lin('#695440'), lin('#8a8852'), lin('#587438'), lin('#c4b47e')];     // (POLISH 1: plough and winter green a little deeper, stubble a little more golden)
  const quad = (q, c, rank, y) => {                                       // four corners in plan (x, z)
    const k = P.length / 3; for (const [x, z] of q) { P.push(x, (y ? y(x, z) : -190) + rank * liftAt(x, z), z); N.push(0, 1, 0); C.push(c[0], c[1], c[2]); }
    if ((q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]) < 0) I.push(k, k + 1, k + 2, k, k + 2, k + 3); else I.push(k, k + 2, k + 1, k, k + 3, k + 2);   // face up
  };
  const patch = (s0, l0, s1, l1, c, rank) => quad([plainAt(s0, l0), plainAt(s1, l0), plainAt(s1, l1), plainAt(s0, l1)], c, rank);
  const tint = (c, g) => (look.snow ? mix3(mul3(c, g * gg), snow, 0.85) : mul3(c, g * gg));
  // furlongs: a lattice of 250 m by 190 m; every cell's dice first (nine strips' worth); none in the river's band; one in five left as common
  for (let i = 0; i < 9; i++) for (let j = -14; j < 14; j++) {
    const keep = rf(), ds = rf.range(150, 232), dl = rf.range(110, 172), js = rf.range(0, 250 - ds), jl = rf.range(0, 190 - dl), along = rf.chance(0.5), n = rf.int(5, 9), tk = [], gk = [];
    for (let k = 0; k < 9; k++) { tk.push(rf.int(0, 4)); gk.push(rf.range(0.93, 1.06)); }
    const s0 = 1000 + i * 250 + js, l0 = j * 190 + jl, sm = s0 + ds / 2, lm = l0 + dl / 2;
    if (keep > 0.8 || inRiver(sm, lm, 170)) continue;
    for (let k = 0; k < n; k++) { const a = k / n, b = (k + 1) / n, c = tint(tones[tk[k]], gk[k]);
      if (along) patch(s0, l0 + dl * a + 0.8, s0 + ds, l0 + dl * b - 0.8, c, 1); else patch(s0 + ds * a + 0.8, l0, s0 + ds * b - 0.8, l0 + dl, c, 1); }
  }
  // the gravel bed of the braided river: from the near channel's bank to the far one's, 30 to 60 m beyond either
  { const grav = tint(lin('#b9ae92'), 1), gravB = tint(lin('#a9a088'), 1); let prev = null;
    for (let l = -3600; l <= 3600; l += 60) { const a = riverS(l, 2) - 45 - 15 * Math.sin(l / 137), b = riverS(l, 1) + 45 + 15 * Math.sin(l / 171 + 2), cur = [plainAt(a, l), plainAt(b, l)];
      if (prev) quad([prev[0], prev[1], cur[1], cur[0]], (Math.round(l / 60) & 1) ? grav : gravB, 2); prev = cur; } }
  // poplars: the nine on the village's north-west edge (as in try 1), then 26 rows along field edges and 8 along the river's near bank
  const rp = st('poplars'), pop = lin('#d2ad3a'), popB = lin('#b9a548'), S0 = look.sun, hl = Math.hypot(S0[0], S0[2]), sx = -S0[0] / hl, sz = -S0[2] / hl, cot = hl / S0[1], crown = crowns.add;
  const dark = tint(lin('#5a5a44'), 1);
  for (let i = 0; i < 9; i++) {
    const a = rp.range(-0.9, 0.9), d = rp.range(108, 128), h = rp.range(15, 21), x = VILLAGE[0] - d * (0.326 * Math.cos(a) - 0.946 * Math.sin(a)), z = VILLAGE[1] - d * (0.946 * Math.cos(a) + 0.326 * Math.sin(a));
    crown(x, terrain.surfaceAt(x, z) + h * 0.3, z, rp.range(1.6, 2.2), h * 0.7, mix3(pop, snow, look.snow * 0.4), a);
  }
  const row = (sA, lA, alongS, n, gap, h, tone, bank) => {
    let first = null, last = null;
    for (let k = 0; k < n; k++) {
      const l = alongS ? lA : lA + k * gap, sv = bank ? riverS(l, 2) - 62 : alongS ? sA + k * gap : sA; if (!bank && inRiver(sv, l, 40)) continue;
      const [x, z] = plainAt(sv, l), hh = h * (0.85 + 0.3 * ((k * 0.618 + tone) % 1));
      crown(x, -190 + 2 * liftAt(x, z) + hh * 0.35, z, hh * 0.11, hh * 0.7, mul3(mix3(mix3(pop, popB, tone), snow, look.snow * 0.4), look.leafGain), k + tone * 6, true);
      if (!first) first = [x, z]; last = [x, z];
    }
    if (first && last !== first) { const L = Math.min(h * cot, 160); quad([[first[0], first[1]], [last[0], last[1]], [last[0] + sx * L, last[1] + sz * L], [first[0] + sx * L, first[1] + sz * L]], dark, 2.5); }
  };
  for (let i = 0; i < 26; i++) { const sA = rp.range(1000, 3100), lA = rp.range(-2000, 2000), alongS = rp.chance(0.5), n = rp.int(9, 16), gap = rp.range(11, 15), h = rp.range(15, 21), tone = rp(); row(sA, lA, alongS, n, gap, h, tone, false); }
  for (let i = 0; i < 8; i++) { const lA = rp.range(-2200, 2200), n = rp.int(8, 14), gap = rp.range(12, 16), h = rp.range(14, 20), tone = rp(); row(0, lA, false, n, gap, h, tone, true); }
  // POLISH 1: THE RIVER HAS ITS GREEN AND THE PLAIN ITS WOODS (the plain read as one pale wash under the haze). (a) Water meadows: a
  // ribbon of dull green along either bank, from the gravel's edge 30 to 250 m out. (b) The gallery wood: clumps of four to ten
  // willows and planes on the meadows, 60 to 150 m apart along either bank. (c) Copses and single trees over the plain, none in the
  // river's band, and twelve woods beyond the river. Every clump throws its long shadow by the look's sun, as the poplar rows do. All by place; the stream 'plain-woods'
  // is its own and new (no earlier deal moves), every clump's dice first.
  { const rw = st('plain-woods'), wA = lin('#36452a'), wB = lin('#66702f'), wC = lin('#a8893c'), meadow = tint(lin('#66783f'), 1), meadowB = tint(lin('#72804a'), 1);
    for (const side of [2, 1]) { let prev = null;
      for (let l = -3600; l <= 3600; l += 60) {
        const edge = side === 2 ? riverS(l, 2) - 45 - 15 * Math.sin(l / 137) : riverS(l, 1) + 45 + 15 * Math.sin(l / 171 + 2);
        const w = 140 + 70 * Math.sin(l / 310 + side) + 40 * Math.sin(l / 97 + 2 * side), cur = [plainAt(edge, l), plainAt(side === 2 ? edge - w : edge + w, l)];
        if (prev) quad([prev[0], prev[1], cur[1], cur[0]], (Math.round(l / 60) & 1) ? meadow : meadowB, 1.5); prev = cur; } }
    const wood = (s, l, n, spread, h, tone, rot) => {                    // n crowns within `spread` m, the tallest in the middle, and the clump's shadow
      const [x0, z0] = plainAt(s, l);
      for (let k = 0; k < n; k++) {
        const a = rot + k * 2.4, d = n > 1 ? spread * Math.sqrt((k + 0.5) / n) : 0, x = x0 + d * Math.cos(a), z = z0 + d * Math.sin(a), hk = h * (1 - 0.35 * k / n), f = (k * 0.618 + tone) % 1;
        const c = mul3(mix3(mix3(mix3(wA, wB, tone), wC, 0.7 * f * f * f), snow, look.snow * 0.4), look.leafGain * (0.88 + 0.24 * ((k * 0.382 + tone) % 1)));
        crown(x, -190 + 2 * liftAt(x, z) + hk * 0.42, z, hk * 0.55, hk * 0.9, c, a, n > 4 ? 2 : true);
      }
      const L = Math.min(h * cot, 160), w = spread + h * 0.5, px = -sz * w, pz = sx * w;
      quad([[x0 - px, z0 - pz], [x0 + px, z0 + pz], [x0 + 0.8 * px + sx * L, z0 + 0.8 * pz + sz * L], [x0 - 0.8 * px + sx * L, z0 - 0.8 * pz + sz * L]], dark, 2.5);
    };
    for (const side of [2, 1]) for (let l = -3500 + rw.range(0, 100); l < 3500;) {
      const off = rw.range(20, 120), n = rw.int(4, 10), spread = rw.range(12, 34), h = rw.range(11, 18), tone = rw(), rot = rw.range(0, TAU), step = rw.range(60, 150);
      wood(side === 2 ? riverS(l, 2) - 60 - off : riverS(l, 1) + 60 + off, l, n, spread, h, tone, rot); l += step; }
    for (let i = 0; i < 220; i++) {
      const s = rw.range(1000, 3300), l = rw.range(-2600, 2600), n = rw.chance(0.3) ? 1 : rw.int(2, 8), spread = rw.range(8, 26), h = rw.range(9, 16), tone = rw(), rot = rw.range(0, TAU);
      if (inRiver(s, l, 130)) continue;
      wood(s, l, n, spread, h, tone, rot); }
    for (let i = 0; i < 12; i++) {                                       // the woods beyond the river: 25 to 60 crowns each, 80 to 200 m across
      const s = rw.range(2500, 4600), l = rw.range(-3000, 3000), n = rw.int(25, 60), spread = rw.range(80, 200), h = rw.range(12, 18), tone = 0.5 * rw(), rot = rw.range(0, TAU);
      wood(s, l, n, spread, h, tone, rot); }
  }
  // the road: from the track's end past the village down to the plain and on to the river's near bank, 3.2 m of pale earth laid on the
  // ground; the second track over the upland (order try 3, 6), 2.4 m
  const yAt = (x, z) => terrain.surfaceAt(x, z) + 0.35 + 3 * (x * x + z * z) / 1e6;       // over the ground, and over the strips where it crosses them
  const lay = (pts, half, col) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], 0, q[1])), false, 'centripetal'), line = curve.getSpacedPoints(Math.round(curve.getLength() / 9)); let prev = null;
    for (let i = 0; i < line.length; i++) { const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * half, nz = dx / l * half, cur = [[line[i].x - nx, line[i].z - nz], [line[i].x + nx, line[i].z + nz]];
      if (prev) quad([prev[0], prev[1], cur[1], cur[0]], col, 0, yAt); prev = cur; }
  };
  lay(ROAD, 1.6, tint(lin('#b3a68a'), 1));
  lay(TRACK2, 1.2, tint(lin('#a89b7e'), 1));
  // terraces and vines above the village: on the slope uphill of it, 150 to 430 m from its middle; a 24 m lattice (stream 'terraces',
  // every cell's dice first); a cell is terraced where the ground falls 0.12 to 0.55 (not within 14 m of the road or the gully): two
  // dry-stone walls 22 m long along the level line, 12 m apart up the slope, each with 5 m of vines above it (old gold to wine red)
  { const rt = st('terraces'), wall = tint(lin('#b7ad96'), 1), vineA = lin('#8a7a34'), vineB = lin('#8c4a2e'), vineC = lin('#5f6a34');
    const yT = (x, z) => terrain.surfaceAt(x, z) + 0.3 + 3 * (x * x + z * z) / 1e6;
    for (let gx = -432; gx <= 432; gx += 24) for (let gz = -432; gz <= 432; gz += 24) {
      const jx = rt.range(-5, 5), jz = rt.range(-5, 5), tone = rt(), tone2 = rt(), keep = rt();
      const x = VILLAGE[0] + gx + jx, z = VILLAGE[1] + gz + jz, rv = Math.hypot(gx + jx, gz + jz), sr = E_S[0] * (gx + jx) + E_S[1] * (gz + jz);
      if (rv < 150 || rv > 430 || sr > -30 || keep > 0.85 || polyDist(GULLY, x, z, null) < 14 || polyDist(ROAD, x, z, null) < 14) continue;
      const gxs = (terrain.surfaceAt(x + 6, z) - terrain.surfaceAt(x - 6, z)) / 12, gzs = (terrain.surfaceAt(x, z + 6) - terrain.surfaceAt(x, z - 6)) / 12, sl = Math.hypot(gxs, gzs);
      if (sl < 0.12 || sl > 0.55) continue;
      const ux = gxs / sl, uz = gzs / sl, tx = -uz, tz = ux;              // up the slope, and along the level line
      for (let k = 0; k < 2; k++) {
        const cx = x + ux * (k * 12 - 6), cz = z + uz * (k * 12 - 6), tk = k ? tone2 : tone;
        const at = (a0, a1, d0, d1) => [[cx + tx * a0 + ux * d0, cz + tz * a0 + uz * d0], [cx + tx * a1 + ux * d0, cz + tz * a1 + uz * d0], [cx + tx * a1 + ux * d1, cz + tz * a1 + uz * d1], [cx + tx * a0 + ux * d1, cz + tz * a0 + uz * d1]];
        quad(at(-11, 11, -0.6, 0.6), wall, 0, yT);
        quad(at(-10.5, 10.5, 1.2, 6.2), tint(mix3(mix3(vineA, vineB, tk), vineC, tk < 0.25 ? 0.6 : 0), 0.9 + 0.2 * tone2), 0, yT);
      }
    }
  }
  // the small fields by the folds (point 15): stubble, plough, fallow or winter green, laid on the upland's ground in cells of 12 m
  { const yF = (x, z) => terrain.surfaceAt(x, z) + 0.3 + 3 * (x * x + z * z) / 1e6;
    for (const f of (middle ? middle.fields : [])) { const na = Math.max(2, Math.round(f.a / 12)), nb = Math.max(2, Math.round(f.b / 12)), c = tint(tones[f.tone], 0.95), at = (p, q) => [f.cx + f.ux * (p - 0.5) * (f.a - 1.4) + f.vx * (q - 0.5) * (f.b - 1.4), f.cz + f.uz * (p - 0.5) * (f.a - 1.4) + f.vz * (q - 0.5) * (f.b - 1.4)];
      for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) quad([at(i / na, j / nb), at((i + 1) / na, j / nb), at((i + 1) / na, (j + 1) / nb), at(i / na, (j + 1) / nb)], c, 0, yF); } }
  const fields = new THREE.Mesh(groundGeometry(P, N, C, I), terrain.material); fields.name = 'fields';
  return { fields, triangles: I.length / 3 };
}
// The river: three ribbons on the plain's gravel; they mirror the sky and glitter where the sun's mirror falls (ripples drift on the world's clock).
function makeRiver(look, U) {
  const P = [], A = [], I = [];
  for (let k = 0; k < 3; k++) {
    const w = k === 0 ? 22.5 : k === 1 ? 15 : 8, base = P.length / 3; let n = 0;
    for (let l = -3600; l <= 3600; l += 60, n++) {
      const s = riverS(l, k), ds = (riverS(l + 5, k) - riverS(l - 5, k)) / 10, q = 1 / Math.hypot(1, ds);
      for (const sd of [-1, 1]) { const [x, z] = plainAt(s + sd * w * q, l - sd * w * q * ds); P.push(x, -190 + 3 * liftAt(x, z), z); A.push(sd, l / 60); }
    }
    for (let i = 0; i < n - 1; i++) { const a = base + i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aRv', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I); g.computeBoundingSphere();
  const m = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: U.uTime, uSunD: U.uSunD, uSunC: U.uSunC, uSkyC: U.uSkyC, uDeep: { value: new THREE.Color().setRGB(...mix3([1, 1, 1], lin('#2c4a66'), 0.45)) } },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aRv; varying vec2 vRv; varying vec3 vW;
      #include <fog_pars_vertex>
      void main() { vRv = aRv; vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uSunD, uSunC, uSkyC, uDeep; varying vec2 vRv; varying vec3 vW;
      #include <fog_pars_fragment>
      float h21(vec2 p) { p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      void main() {
        vec3 v = normalize(cameraPosition - vW);
        // ripples: cells of 9 m, each a facet that leans a little and turns over in a second or two
        vec2 c = floor(vW.xz / 9.), f = c + floor(uTime * (.5 + h21(c)) + h21(c + 7.3));
        vec3 n = normalize(vec3((h21(f) - .5) * .34, 1., (h21(f + 19.7) - .5) * .34));
        float spec = pow(max(dot(reflect(-v, n), uSunD), 0.), 180.);
        float fres = .12 + .88 * pow(1. - max(v.y, 0.), 4.);
        float edge = 1. - .35 * smoothstep(.55, 1., abs(clamp(vRv.x, -1., 1.)));                         // paler shoals at the banks
        vec3 col = mix(uDeep * (uSkyC * 2.2 + uSunC * .25), uSkyC * 3.1, fres) * edge + uSunC * spec * 26.;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'river';
  return { mesh, triangles: I.length / 3 };
}
// The far hills all round, the snow-crested range to the south-west and the one snow summit to the north-east: two walls of facets
// at 6.4 and 8.6 km (and the range across the plain, below), coloured once at build (rock, snow, the sun's side, the air between) and drawn without fog.
function makeFarRing(ctx, st, look) {
  const noise = ctx.core.makeNoise(ctx.core.hashSeed('far:' + ctx.seed)), r = st('far'), off = r.range(0, 40);
  const fogC = lin(look.fogColor), rockLit = lin('#8d8f8c'), rockSh = lin('#4f6480'), snowLit = lin('#eef2f8'), snowSh = lin('#a9b8d6'), sunC = lin(look.sunColor);
  const bearing = (x, z) => Math.atan2(x * E_L[0] + z * E_L[1], x * E_S[0] + z * E_S[1]);    // 0 = south-east, +90 = north-east, -90 = south-west
  const P = [], C = [], I = [], SEG = 240, V = [0, 0.3, 0.62, 0.86, 1];      // 240 facets round (were 288; the range below 192, were 224): 1,792 triangles to the middle ground (point 15)
  for (let layer = 0; layer < 2; layer++) {
    const R = layer ? 8600 : 6400, fog = 1 - Math.exp(-((R * look.farFog) ** 2)), base = P.length / 3;
    const cols = [];
    for (let i = 0; i < SEG; i++) {
      const a = i / SEG * TAU, ca = Math.cos(a), sa = Math.sin(a), x = ca * R, z = sa * R, b = bearing(x, z) / DEG;
      const n1 = noise.fbm2(ca * 2.2 + off, sa * 2.2 - off, 4), n2 = noise.n2(ca * 9 + off, sa * 9), jag = noise.n2(ca * 26 - off, sa * 26 + off);
      const plainward = 1 - sstep(35, 75, Math.abs(b));                                        // the plain runs to the horizon in the south-east
      let h = (70 + 90 * (0.5 + 0.5 * n1)) * (1 - 0.8 * plainward) + 18 * jag, snowLine = 9e9;
      const sw = Math.exp(-(((b + 90) / 34) ** 2)), ne = Math.exp(-(((b - 90) / 30) ** 2));
      if (!layer) { h += sw * (380 + 380 * (0.5 + 0.5 * n1) + 60 * n2) + ne * (180 + 150 * (0.5 + 0.5 * n2)); if (sw > 0.2) snowLine = 560 + 60 * n2 - (look.snow ? 460 : 0); }
      else { const pk = Math.max(Math.exp(-(((b - 90) / 6) ** 2)), 0.74 * Math.exp(-(((b - 101) / 5) ** 2)), 0.6 * Math.exp(-(((b - 80) / 7) ** 2))); h = h * 0.7 + ne * 260 + pk * (1500 - 260) * (0.82 + 0.14 * n2 + 0.1 * jag) + sw * 420 * (0.6 + 0.4 * n2); snowLine = (pk > 0.05 ? 980 : 520) - (look.snow ? 400 : 0); }
      cols.push({ ca, sa, h, snowLine, n2 });
    }
    for (let i = 0; i <= SEG; i++) {
      const { ca, sa, h, snowLine, n2 } = cols[i % SEG], fall = (cols[(i + SEG - 1) % SEG].h - cols[(i + 1) % SEG].h) / 160;      // a flank that falls toward the sun's side is lit, the other in shade
      const lit = clamp(0.5 - (ca * look.sun[0] + sa * look.sun[2]) * 0.9 + 0.9 * clamp(fall, -1, 1) * (-sa * look.sun[0] + ca * look.sun[2]) + 0.15 * n2, 0, 1);
      for (let k = 0; k < V.length; k++) {
        const y = -200 + (h + 200) * V[k], hh = y, sn = sstep(snowLine - 40, snowLine + 50, hh + 70 * n2 * (1 - V[k]));
        const rock = mix3(rockSh, [rockLit[0] * sunC[0], rockLit[1] * sunC[1], rockLit[2] * sunC[2]], lit * (0.4 + 0.6 * V[k])), snowC = mix3(snowSh, [snowLit[0] * (0.6 + 0.4 * sunC[0]), snowLit[1] * (0.6 + 0.4 * sunC[1]), snowLit[2] * (0.6 + 0.4 * sunC[2])], lit);
        const c = mix3(mix3(rock, snowC, sn), fogC, clamp(fog * (0.7 + 0.3 * (1 - V[k])) + (1 - fog) * 0.55 * (1 - V[k]) * (1 - V[k]), 0, 1));      // the air takes less of a summit than of its foot
        const rr = R - (1 - V[k]) * (h + 200) * 1.4;
        P.push(ca * rr, y, sa * rr); C.push(c[0], c[1], c[2]);
      }
    }
    for (let i = 0; i < SEG; i++) for (let k = 0; k < V.length - 1; k++) { const a = base + i * V.length + k, b2 = a + V.length; I.push(a, b2, a + 1, a + 1, b2, b2 + 1); }
  }
  // THE RANGE across the plain (order T5c): from the east of south-east round by the south into the snow range of the south-west, four
  // ranks at 4.2, 5.6, 7.2 and 9.0 km whose summits stand at most 3.2, 5.2, 7.2 and 8.8 degrees over the horizon as seen from the
  // hatch's height (y 251); the last rank, the skyline, nowhere along the range's body under 0.72 of that (6.3 to 8.8 degrees), the
  // nearer ranks free between 0.42 and 1 of theirs (foothills with saddles); each rank paler than the one before it; the first snow
  // on the last rank's summits (in the snow look on the third's too); the snow takes 0.8 of its rank's haze and the last rank's
  // rock 0.9 of it, so that the summits stand in the air as the range does and not as white shapes cut out of the sky.
  { const RANKS = [[4200, 3.2, 0.5, 9], [5600, 5.2, 0.62, 9], [7200, 7.2, 0.73, 0.9], [9000, 8.8, 0.82, 0.9]], SR = 192, RV = [0, 0.3, 0.6, 0.85, 1];
    const hz = lin(look.rangeHaze), wood = lin('#3f4a40');
    RANKS.forEach(([R, elev, haze, snowAt], k) => {
      const base = P.length / 3, top = R * Math.tan(elev * DEG), lo = k === 3 ? 0.72 : 0.42, e0 = 2 - 4 * (3 - k), e1 = 40 - 6 * (3 - k);
      for (let i = 0; i <= SR; i++) {
        const b = -140 + 180 * i / SR, [ux, uz] = plainAt(Math.cos(b * DEG), Math.sin(b * DEG));
        const n1 = noise.fbm2(ux * 3.1 + off + k * 7.7, uz * 3.1 - off, 4), n2 = noise.n2(ux * 11 + k * 3.3, uz * 11 + off), jag = noise.n2(ux * 31 - off, uz * 31 + k), spur = noise.n2(ux * 47 + k * 5.1, uz * 47 - off);
        // the range sinks under the plain's edge at either end (no end wall); along its body summits stand over saddles
        const win = (1 - sstep(e0, e1, b + 4 * n2)) * sstep(-138, -106, b + 4 * n2), peak = (1 - Math.abs(noise.n2(ux * 7.3 + k * 3.3 - off, uz * 7.3 + off))) ** 2;
        const body = lo + (1 - lo) * clamp(0.3 + 0.38 * n1 + 0.5 * peak + 0.07 * jag, 0, 1), crest = lerp(-200, 251 + top * body, win), sl = snowAt - (look.snow ? 0.28 : 0);
        const lit = clamp(0.5 - (ux * look.sun[0] + uz * look.sun[2]) * 0.9 + 0.12 * jag + 0.25 * n2, 0, 1);
        for (let v = 0; v < RV.length; v++) {
          const t = RV[v], y = -200 + (crest + 200) * t, rel = (y - 251) / top, sn = sstep(sl - 0.05, sl + 0.05, rel + 0.06 * n2);
          const face = 1 + 0.06 * spur * (1 - 0.5 * t);                                           // spurs and gullies down the face
          const rock = mul3(mix3(mix3(wood, rockSh, 0.35 + 0.65 * t), [rockLit[0] * sunC[0], rockLit[1] * sunC[1], rockLit[2] * sunC[2]], lit * (0.12 + 0.3 * t)), face);
          const snowC = mix3(snowSh, [snowLit[0] * (0.6 + 0.4 * sunC[0]), snowLit[1] * (0.6 + 0.4 * sunC[1]), snowLit[2] * (0.6 + 0.4 * sunC[2])], 0.35 + 0.65 * lit);
          const hk = clamp(haze + (1 - haze) * 0.45 * (1 - t) * (1 - t), 0, 1), c = mix3(mix3(rock, hz, hk * (k === 3 ? 0.9 : 1)), mix3(snowC, hz, hk * 0.8), sn), rr = R - (1 - t) * (crest + 200) * (1.2 + 0.5 * n2 + 0.3 * spur);
          P.push(ux * rr, y, uz * rr); C.push(c[0], c[1], c[2]);
        }
      }
      for (let i = 0; i < SR; i++) for (let v = 0; v < RV.length - 1; v++) { const a = base + i * RV.length + v, b2 = a + RV.length; I.push(a, b2, a + 1, a + 1, b2, b2 + 1); }
    }); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide })); mesh.name = 'far-ring';
  return { mesh, triangles: I.length / 3 };
}

// THE SEA (polish round 2: the design's 'sea's edge' of the last third, not built before): a bay beyond the plain's far edge, east of
// where the range runs out. Its shore, capes and coves 3.6 to 4.5 km off and never nearer than 150 m beyond the plain's own fields
// and copses, closes against the hills at either end (no end wall); the
// water runs on to the foot of the far ring. Drawn the far ring's own way: no scene fog, the air between written into its colour by
// its distance with the far hills' own haze. It mirrors the sky; the sun's glitter lies on it under the sun, glint by glint on the
// world's clock (a ripple leans by a bell's odds: where the facet that would mirror the sun to the eye leans little, glints are many).
// A noise of its own (sea:) and no stream of the world's.
function makeSea(ctx, look, U) {
  const noise = ctx.core.makeNoise(ctx.core.hashSeed('sea:' + ctx.seed)), P = [], A = [], I = [], NB = 104, NR = 4, B0 = -18, B1 = 86, R1 = 6400;
  for (let i = 0; i <= NB; i++) {
    const b = B0 + (B1 - B0) * i / NB, [ux, uz] = plainAt(Math.cos(b * DEG), Math.sin(b * DEG));
    const end = Math.max(1 - sstep(B0, B0 + 16, b), sstep(B1 - 18, B1, b));
    // the shore keeps 150 m clear of the plain's own fields and copses (they reach 3,350 m along the plain and 2,700 m across it)
    const cb = Math.cos(b * DEG), sb = Math.abs(Math.sin(b * DEG)), fields = Math.min(3350 / Math.max(cb, 1e-3), 2700 / Math.max(sb, 1e-3)) + 150;
    const shore = lerp(Math.max(3900 + 260 * noise.fbm2(b * 0.08, 3.7, 3) + 70 * noise.n2(b * 0.5, 9.1), fields), R1, end);
    for (let j = 0; j <= NR; j++) { const r = lerp(shore, R1, j / NR), x = ux * r, z = uz * r; P.push(x, -190 + 1.5 * liftAt(x, z), z); A.push(r - shore); }
  }
  for (let i = 0; i < NB; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b2 = a + NR + 1; I.push(a, a + 1, b2, a + 1, b2 + 1, b2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aShore', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I); g.computeBoundingSphere();
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSunD: U.uSunD, uSunC: U.uSunC, uSkyC: U.uSkyC, uDeep: { value: new THREE.Color().setRGB(...lin(look.gold ? '#35557c' : '#1c6690')) },
      uHaze: { value: new THREE.Color().setRGB(...lin(look.fogColor)) }, uStrand: { value: new THREE.Color().setRGB(...lin(look.snow ? '#e4e9f0' : '#d9d2bd')) }, uFarFog: { value: look.farFog } },
    fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aShore; varying float vShore; varying vec3 vW;
      void main() { vShore = aShore; vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFarFog; uniform vec3 uSunD, uSunC, uSkyC, uDeep, uHaze, uStrand; varying float vShore; varying vec3 vW;
      float h21(vec2 p) { p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      void main() {
        vec3 e = cameraPosition - vW; float d = length(e); vec3 v = e / d;
        vec3 hv = normalize(v + uSunD); float lean2 = (1. - hv.y * hv.y) / max(hv.y * hv.y, 1e-4), odds = exp(-lean2 / .3);
        vec2 q = vW.xz / 34., c = floor(q); float tw = h21(c + floor(uTime * (.5 + h21(c)) + h21(c + 7.3)));
        tw = tw * tw * tw * smoothstep(.5, .12, length(fract(q) - .5 - .2 * (vec2(h21(c + 3.1), h21(c + 5.9)) - .5)));      // a glint is a round patch; the distance draws it out
        float fres = .1 + .9 * pow(1. - max(v.y, 0.), 5.);
        vec3 col = mix(uDeep * (uSkyC * 2.2 + uSunC * .25), uSkyC * 3.1, fres * .25) + uSunC * odds * (.3 + 5. * tw);
        col = mix(uStrand * (uSkyC + uSunC * .5), col, smoothstep(10., 70., vShore));                       // the strand and the surf's line
        col = mix(col, uHaze, .55 * (1. - exp(-(d * uFarFog) * (d * uFarFog))));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'sea';
  return { mesh, triangles: I.length / 3 };
}

// ---------- what is built round about: the neighbours' monasteries, the village, the stage, the shrine, the track ----------
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
// the track's line in plan, every two metres (a smooth curve through its points)
function trackLine(from = 0) {
  const c = new THREE.CatmullRomCurve3(TRACK.slice(from).map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  return c.getSpacedPoints(Math.round(c.getLength() / 2)).map((p) => [p.x, p.z]);
}
// centre, inner radius and box of a pillar's top from its rim
function topPlan(outline) {
  let cx = 0, cz = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of outline) { cx += p[0]; cz += p[1]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  cx /= outline.length; cz /= outline.length;
  let inr = 1e9; for (const p of outline) inr = Math.min(inr, Math.hypot(p[0] - cx, p[1] - cz));
  return { cx, cz, inr, x0, x1, z0, z1 };
}
// The monasteries on the neighbours' tops. THE ARTIST'S (the part's makeMonastery) are taken when the lead says they are in and the part
// has them; until then OUR OWN: every lived-in top is built over from edge to edge. Along the whole rim stand ranges of two and three
// storeys, their outer walls flush with the cliff (rubble below, limewash above, small dark windows, here and there a timber gallery
// hung out over the drop), their tiled roofs one ring; in the court a domed church and cypresses; on
// the rim that looks to our hollow the hoist loft, its rope down the face. Either way each lived-in top has one thread of smoke.
const ARTIST_TOPS = true;                                                  // the lead's word, about 00:30 UTC 10 Oct: the artist's are in (part md5 55c7bb02...)
function ownTop(env, pl) {
  const { b, rb, mv, C, look, st } = env, q = pl.spec, r = st('mon:' + q.name), T = topPlan(pl.outline), Y = pl.topY, snowK = look.snow * 0.92;
  const big = q.mon === 'great' ? 1 : q.mon === 'middle' ? 0.5 : 0, lime = lin('#d8ccb2'), limeB = lin('#c9b79a');
  const tiles = (k = 1) => b.col(mix3(mul3(C.tile, k * r.range(0.86, 1.1)), C.snow, snowK), 0.85, 1.05).surf(look.snow ? 0 : S.SURF.TILES);
  const cross = (x, y, z, h) => { rb.seg([x, y, z], [x, y + h, z], 0.12, C.iron, 1.5); rb.seg([x - h * 0.27, y + h * 0.68, z], [x + h * 0.27, y + h * 0.68, z], 0.12, C.iron, 1.5); };
  // the rim, walked evenly: K ranges of 9 to 20 m each
  const O = pl.outline, n = O.length, cum = [0]; for (let i = 0; i < n; i++) { const a = O[i], c = O[(i + 1) % n]; cum.push(cum[i] + Math.hypot(c[0] - a[0], c[1] - a[1])); }
  const per = cum[n], K = Math.max(8, Math.round(per / clamp(per / 18, 9, 20)));
  const at = (d) => { d = ((d % per) + per) % per; let i = 0; while (i < n - 1 && cum[i + 1] < d) i++; const t = (d - cum[i]) / (cum[i + 1] - cum[i] || 1), a = O[i], c = O[(i + 1) % n]; return [lerp(a[0], c[0], t), lerp(a[1], c[1], t)]; };
  const off = r.range(0, per), depth = clamp(T.inr * 0.3, 5, 9), smoke = [];
  let hoist = null, hd = 1e9;
  const ruin = !!q.ruin;
  for (let k = 0; k < K; k++) {
    const A = at(off + per * k / K), B = at(off + per * (k + 1) / K), h = r.range(6.2, 8.6) + 3 * big * r(), dp = depth * r.range(0.85, 1.1), gal = r.chance(0.36), keep = r(), tone = r.range(0.9, 1.06), hipped = r.chance(0.25);
    const mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2, ex = B[0] - A[0], ez = B[1] - A[1], w = Math.hypot(ex, ez) + 0.5;
    let nx = ez, nz = -ex; if (nx * (mx - T.cx) + nz * (mz - T.cz) < 0) { nx = -nx; nz = -nz; } const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
    const dH = Math.hypot(mx - HOLLOW[0], mz - HOLLOW[1]); if (dH < hd) { hd = dH; hoist = { x: mx, z: mz, nx, nz }; }
    if (ruin && keep > 0.55) continue;
    b.tr(mx - nx * (dp / 2 + 0.25), Y, mz - nz * (dp / 2 + 0.25), Math.atan2(nx, nz));                       // local +z looks out over the drop
    if (ruin) { tools.banded(b, C, r, -w / 2, -dp / 2, w / 2, dp / 2, -1.5, h * r.range(0.3, 0.75), { top: true }); b.pop(); continue; }
    b.col(mul3(C.stone, tone), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.7); b.box(-w / 2, -2.5, -dp / 2, w / 2, 2.4, dp / 2, { m: 1, top: false });
    b.col(mul3(k % 3 ? lime : limeB, tone), 0.9, 1).surf(S.SURF.MASONRY, 0, 0.12); b.box(-w / 2, 2.4, -dp / 2, w / 2, h, dp / 2, { m: 1, top: false });
    tiles();
    if (hipped) b.hip(-w / 2, -dp / 2, w / 2, dp / 2, h, 0.3 * dp, { overhang: 0.5, ridge: 0.5 }); else b.gable(-w / 2, -dp / 2, w / 2, dp / 2, h, 0.32 * dp, { overhang: 0.5, alongX: true, wallColor: mul3(lime, tone), wallStyle: S.SURF.MASONRY, m: 1 });
    const rows = h > 8.4 ? 2 : 1, nw = Math.max(2, Math.round(w / 3.2));
    for (let f = 0; f < rows; f++) tools.openings(b, C, r, 2, -w / 2 + 1, w / 2 - 1, dp / 2, 3.4 + f * 3, nw, { w: 0.7, h: 1.1, shutter: f === 0 });
    tools.openings(b, C, r, 3, -w / 2 + 1, w / 2 - 1, -dp / 2, 3.2, Math.max(1, nw - 1), { w: 0.7, h: 1.1 });
    if (gal) {                                                            // a timber gallery hung out over the drop under the eaves
      const gy = h - 3.1, g0 = -w / 2 + 0.8, g1 = w / 2 - 0.8;
      b.col(C.timberDark, 0.8, 1).surf(S.SURF.PLANKS); b.box(g0, gy, dp / 2, g1, gy + 0.16, dp / 2 + 1.5, { m: 1, bottom: true });
      b.box(g0, gy + 0.9, dp / 2 + 1.38, g1, gy + 1.02, dp / 2 + 1.5, {});
      for (let i = 0; i <= 3; i++) { const x = lerp(g0 + 0.1, g1 - 0.1, i / 3); b.beam([x, gy - 1.5, dp / 2], [x, gy, dp / 2 + 1.35], 0.14, 0.14); b.beam([x, gy, dp / 2 + 1.42], [x, gy + 2.5, dp / 2 + 1.42], 0.11, 0.11); }
      tiles(0.9); b.quad([g0 - 0.2, gy + 2.45, dp / 2 + 1.75], [g1 + 0.2, gy + 2.45, dp / 2 + 1.75], [g1 + 0.2, gy + 3.05, dp / 2], [g0 - 0.2, gy + 3.05, dp / 2]);
    }
    if (k === 1 || (big === 1 && k === Math.floor(K / 2) + 1)) {          // the kitchen's chimney: the smoke's foot
      b.col(mul3(C.stone, 0.9), 0.85, 1).surf(S.SURF.MASONRY, 0, 0.5); b.box(-0.6, h, -0.6, 0.6, h + 0.32 * dp + 1.5, 0.6, { m: 1 });
      const cx = mx - nx * (dp / 2 + 0.25), cz = mz - nz * (dp / 2 + 0.25); if (!smoke.length) smoke.push(new THREE.Vector3(cx, Y + h + 0.32 * dp + 1.7, cz));
    }
    b.pop();
  }
  if (ruin) return null;
  // the court: the church, domed (a nave under a hipped roof, the dome on its drum, an apse), cypresses
  const cr = Math.max(4, T.inr - depth - 3), cw = clamp(cr * 0.75, 6, 15), cd = cw * 1.35, ch = 5 + 2.5 * big, a0 = r.range(0, TAU), dr = clamp(cw * 0.3, 1.9, 3.6);
  b.tr(T.cx, Y, T.cz, a0);
  tools.banded(b, C, r, -cw / 2, -cd / 2, cw / 2, cd / 2, -1.2, ch); tiles(); b.hip(-cw / 2, -cd / 2, cw / 2, cd / 2, ch, 0.26 * cw, { overhang: 0.4, ridge: 0.4 });
  b.col(C.stone, 0.85, 1).surf(S.SURF.MASONRY, 0, 0.6); b.lathe(0, 0, cd / 2, [[cw * 0.32, 0], [cw * 0.32, ch * 0.8]], 8, { facet: true, m: 1 }); tiles(0.95); b.lathe(0, ch * 0.8, cd / 2, [[cw * 0.34, 0], [0.01, cw * 0.2]], 8, { facet: true });
  const dy = ch + 0.26 * cw - 0.9;
  for (let k = 0; k < 3; k++) { if (k === 1) b.col(C.brick, 0.95, 1).surf(S.SURF.MASONRY, 0, 0.32); else b.col(C.stone, 0.9, 1).surf(S.SURF.MASONRY, 0, 0.6); b.lathe(0, dy + dr * 1.1 * k / 3, 0, [[dr, 0], [dr, dr * 1.1 / 3]], 10, { facet: true, m: 1 }); }
  { const prof = [[dr + 0.3, 0]]; for (let i = 1; i <= 4; i++) { const a = (Math.PI / 2) * i / 4; prof.push([Math.max(0.001, (dr + 0.1) * Math.cos(a)), dr * 0.86 * Math.sin(a) + 0.12]); } tiles(0.95); b.lathe(0, dy + dr * 1.1, 0, prof, 10, { smooth: true, m: 1 }); }
  b.pop();
  cross(T.cx, Y + dy + dr * 1.1 + dr * 0.86 + 0.1, T.cz, 2.2);
  for (let i = 0, nc = 2 + Math.round(3 * big); i < nc; i++) { const a = a0 + 0.9 + TAU * i / nc + r.range(-0.3, 0.3), rad = cr * r.range(0.72, 0.92), hh = r.range(9, 14), x = T.cx + rad * Math.cos(a), z = T.cz + rad * Math.sin(a), g = mix3(C.cypress, C.snow, look.snow * 0.55), B = mv.b, v0 = B.nv;
    B.col(g, 0.6, 1.2).surf(0); B.lathe(x, Y, z, [[0.25, 0], [1.1, 2.4], [0.9, hh * 0.6], [0.05, hh]], 6, { smooth: true }); mv.anim(v0, [x, Y, z], 4, r.range(0, TAU), 0.012, 1.1); }
  // the hoist loft on the rim that looks to our hollow: a timber box hung 2 m out, the block under its roof
  { const H = hoist, ry = Math.atan2(H.nx, H.nz); b.tr(H.x + H.nx * 0.6, Y, H.z + H.nz * 0.6, ry);
    b.col(C.timber, 0.8, 1).surf(S.SURF.PLANKS); b.box(-1.7, 3.2, -1.2, 1.7, 6.4, 2.2, { m: 1, bottom: true, capStyle: S.SURF.PLANKS, capM: 1 });
    b.col(C.timberDark, 0.85, 1).surf(0); for (const sx of [-1.5, 1.5]) { b.beam([sx, 0.6, -0.4], [sx, 3.2, 2.1], 0.22, 0.22); b.beam([sx, 6.1, -1], [sx, 6.25, 3.4], 0.2, 0.22); }
    b.col([0.03, 0.027, 0.024]).surf(0); b.quad([-0.9, 3.5, 2.23], [0.9, 3.5, 2.23], [0.9, 5.6, 2.23], [-0.9, 5.6, 2.23]);
    tiles(0.9); b.gable(-1.9, -1.3, 1.9, 2.4, 6.4, 1.0, { overhang: 0.4, alongX: false, wallColor: C.timber });
    b.pop();
    hoist = { position: new THREE.Vector3(H.x + H.nx * 3.6, Y + 6.2, H.z + H.nz * 3.6) }; }
  return { hoist, smoke };
}
function buildVillage(env, terrain) {
  const { b, C, look, st } = env, r = st('village'), placed = [], snowK = look.snow * 0.92, red = lin('#a2482e');
  // sixty houses of stone under red tile (some weathered browner) in a disc of 110 m: every candidate's dice first, then nine metres between doors
  for (let i = 0; i < 200 && placed.length < 60; i++) {
    const a = r.range(0, TAU), d = 110 * Math.sqrt(r()), w = r.range(7, 11), dp = r.range(5, 7), h = r.range(3, 5.5), ry = r.range(0, TAU), slate = r.chance(0.35), tone = r.range(0.85, 1.1), two = r.chance(0.3);
    const x = VILLAGE[0] + d * Math.cos(a), z = VILLAGE[1] + d * Math.sin(a);
    if (placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 9 + (p[2] + w) * 0.35)) continue;
    placed.push([x, z, w]);
    const y = terrain.surfaceAt(x, z);
    b.tr(x, y, z, ry);
    b.col(mul3(C.stone, tone), 0.8, 1).surf(S.SURF.MASONRY, 0, 0.75); b.box(-w / 2, -1.5, -dp / 2, w / 2, h, dp / 2, { m: 1, top: false });
    b.col(mix3(mul3(mix3(C.tile, red, slate ? 0.35 : 0.6), tone), C.snow, snowK), 0.85, 1.05).surf(look.snow ? 0 : S.SURF.TILES, 0, 0.5);
    b.gable(-w / 2, -dp / 2, w / 2, dp / 2, h, 0.32 * dp, { overhang: 0.4, wallColor: mul3(C.stone, tone), wallStyle: S.SURF.MASONRY, m: 1 });
    b.col([0.03, 0.027, 0.024]).surf(0); b.quad([-0.5, 0, dp / 2 + 0.03], [0.5, 0, dp / 2 + 0.03], [0.5, 1.9, dp / 2 + 0.03], [-0.5, 1.9, dp / 2 + 0.03]);
    if (two) { b.col(mul3(C.stone, tone * 0.95), 0.85, 1).surf(S.SURF.MASONRY, 0, 0.6); b.box(w / 2 - 1.3, h, -0.4, w / 2 - 0.5, h + 0.32 * dp + 0.9, 0.4, { m: 1 }); }
    b.pop();
  }
  return placed;
}
// Shepherds' folds on the upland (order try 3, 6): at most three. Candidates on a 60 m lattice (stream 'folds', every candidate's dice
// first), taken in the order of their lot: 380 to 760 m from the hollow, on gentle middle ground (neither hollow nor ridge), within
// 240 m of the second track or the gully (water), 200 m from each other, clear of pillars. A fold: a round dry-stone pen 15 m across
// with a gate gap, and a hut under tiles beside the gate.
function buildFolds(env, terrain) {
  const { b, C, st, ground, look } = env, r = st('folds'), cand = [], out = [];
  for (let gx = -640; gx <= 700; gx += 60) for (let gz = -640; gz <= 680; gz += 60) cand.push([r(), gx + r.range(-20, 20), gz + r.range(-20, 20), r.range(0, TAU)]);
  cand.sort((p, q) => p[0] - q[0]);
  for (const [, x, z, ry] of cand) {
    if (out.length >= 3) break;
    const r0 = Math.hypot(x - HOLLOW[0], z - HOLLOW[1]), dt = polyDist(TRACK2, x, z, null), hv = ground.hills(x, z), y = terrain.surfaceAt(x, z);
    if (r0 < 380 || r0 > 760 || SE[0] * x + SE[1] * z > 600 || dt < 14 || Math.min(dt, polyDist(GULLY, x, z, null)) > 240 || hv < HOLLOW_H || hv > RIDGE_H) continue;
    if (Math.abs(terrain.surfaceAt(x + 8, z) - y) + Math.abs(terrain.surfaceAt(x, z + 8) - y) > 2.6 || inPillar(x, z, 60) || out.some((p) => Math.hypot(p[0] - x, p[1] - z) < 200)) continue;
    out.push([x, z]);
    b.col(mul3(C.stone, 0.95), 0.8, 1.05).surf(S.SURF.MASONRY, 0, 0.7);
    for (let i = 1; i < 16; i++) { const a = ry + TAU * i / 16, px = x + 7.5 * Math.cos(a), pz = z + 7.5 * Math.sin(a); b.tr(px, terrain.surfaceAt(px, pz), pz, -a); b.box(-0.35, -1.2, -1.55, 0.35, 1.3, 1.55, { m: 1 }); b.pop(); }
    const hx = x + 11 * Math.cos(ry), hz = z + 11 * Math.sin(ry);
    b.tr(hx, terrain.surfaceAt(hx, hz), hz, ry); b.box(-2.3, -1.2, -1.6, 2.3, 2.1, 1.6, { m: 1, top: false });
    b.col(mix3(C.tile, C.snow, look.snow * 0.92), 0.85, 1.05).surf(look.snow ? 0 : S.SURF.TILES, 0, 0.5); b.gable(-2.3, -1.6, 2.3, 1.6, 2.1, 1.0, { overhang: 0.3, wallColor: mul3(C.stone, 0.95), wallStyle: S.SURF.MASONRY, m: 1 }); b.pop();
  }
  return out;
}
// the stage on the knoll, the shrine at the saddle crossing, the cobbled track
function buildKnoll(env, terrain) {
  const { b, rb, C, look, st } = env, G = (x, z) => terrain.surfaceAt(x, z), snowK = look.snow * 0.92, rs = st('stage');
  // the stage: a deck 9 by 7 m at y 0 on posts, one rail on the far sides, the hand-line post; nothing over y 2.6
  b.col(C.timber, 0.9, 1).surf(S.SURF.PLANKS); b.box(STAGE.x0, -0.14, STAGE.z0, STAGE.x1, 0, STAGE.z1, { m: 1, bottom: true, capStyle: S.SURF.PLANKS, capM: 1 });
  b.col(C.timberDark, 0.8, 1).surf(0);
  for (const x of [STAGE.x0 + 0.3, 122.5, STAGE.x1 - 0.3]) for (const z of [STAGE.z0 + 0.3, STAGE.z1 - 0.3]) b.beam([x, G(x, z) - 0.6, z], [x, -0.14, z], 0.24, 0.24);
  for (const z of [STAGE.z0 + 0.3, -8, STAGE.z1 - 0.3]) b.beam([STAGE.x0, -0.3, z], [STAGE.x1, -0.3, z], 0.2, 0.26);
  for (const [x, z] of [[STAGE.x1 - 0.1, STAGE.z0 + 0.1], [STAGE.x1 - 0.1, -8], [STAGE.x1 - 0.1, STAGE.z1 - 0.1], [122.5, STAGE.z0 + 0.1], [122.5, STAGE.z1 - 0.1]]) b.beam([x, 0, z], [x, 1.05, z], 0.1, 0.1);
  rb.poly([[122.5, 1.0, STAGE.z0 + 0.1], [STAGE.x1 - 0.1, 1.0, STAGE.z0 + 0.1], [STAGE.x1 - 0.1, 1.0, STAGE.z1 - 0.1], [122.5, 1.0, STAGE.z1 - 0.1]], 0.07, C.oak, 1.5);
  b.col(C.oakDark, 0.8, 1); b.beam([STAGE.x0 + 0.5, 0, -8.6], [STAGE.x0 + 0.5, 2.4, -8.6], 0.2, 0.2); b.beam([STAGE.x0 + 0.5, 2.3, -8.6], [STAGE.x0 - 0.5, 2.55, -8.6], 0.12, 0.12);
  b.col(C.rope, 0.7, 1); b.lathe(STAGE.x0 + 1.4, 0, -6.6, [[0.42, 0], [0.45, 0.12], [0.3, 0.2], [0.12, 0.2]], 8, {});
  for (let i = 0; i < 3; i++) { const x = STAGE.x1 - 1.6 - rs.range(0, 1.6), z = STAGE.z0 + 1 + i * 0.9 + rs.range(0, 0.3); b.col(mul3(C.sack, rs.range(0.8, 1)), 0.8, 1); b.tr(x, 0, z, rs.range(0, TAU)); b.box(-0.45, 0, -0.3, 0.45, 0.5, 0.3, {}); b.pop(); }
  // the shrine: a stone box 2 by 2 by 2.4 m, gabled, a dark niche to the track, a plain iron cross
  { const [x, z] = SHRINE, y = G(x, z) - 0.3;
    b.tr(x, y, z, 0.6);
    b.col(C.stone, 0.8, 1).surf(S.SURF.MASONRY, 0, 0.6); b.box(-1, 0, -1, 1, 2.4, 1, { m: 1, top: false });
    b.col(mix3(C.slate, C.snow, snowK), 0.85, 1.05).surf(S.SURF.MASONRY, 0, 0.4); b.gable(-1, -1, 1, 1, 2.4, 0.8, { overhang: 0.25, alongX: false, wallColor: C.stone, wallStyle: S.SURF.MASONRY, m: 1 });
    b.col([0.03, 0.027, 0.024]).surf(0); b.quad([-1.03, 0.9, -0.35], [-1.03, 0.9, 0.35], [-1.03, 1.8, 0.35], [-1.03, 1.8, -0.35]);
    b.pop();
    rb.seg([x, y + 3.2, z], [x, y + 4.3, z], 0.07, C.iron, 1.5); rb.seg([x - 0.25, y + 3.95, z + 0.17], [x + 0.25, y + 3.95, z - 0.17], 0.07, C.iron, 1.5);
  }
  // the track: cobbles 2.2 m wide laid on the ground, every two metres
  const L = trackLine(), cob = mix3(mul3(C.paving, 0.95), C.snow, look.snow * 0.5);
  b.col(cob, 1, 1).surf(S.SURF.MASONRY, 0, 0.35);
  let prev = null, acc = 0;
  for (let i = 0; i < L.length; i++) {
    const p = L[i], q = L[Math.min(L.length - 1, i + 1)], o = L[Math.max(0, i - 1)], dx = q[0] - o[0], dz = q[1] - o[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * 1.1, nz = dx / l * 1.1;
    const a = [p[0] - nx, G(p[0] - nx, p[1] - nz) + 0.25, p[1] - nz], c = [p[0] + nx, G(p[0] + nx, p[1] + nz) + 0.25, p[1] + nz];
    if (prev) b.quad(prev[0], prev[1], c, a, [0, acc - 2, 2.2, acc]);
    prev = [a, c]; acc += 2;
  }
  return L;
}

// ---------- trees, brush, fallen blocks ----------
const inGreat = (x, z, m) => x > GREAT.x0 - m && x < GREAT.x1 + m && z > GREAT.z0 - m && z < GREAT.z1 + m;
const inPillar = (x, z, m) => inGreat(x, z, m) || NEIGHBOURS.some((q) => Math.hypot(x - q.x, z - q.z) < q.w * 0.6 + m);
// Where trees stand (sums only; the build and the clear-air count both read it). Every candidate's dice first, then the tests.
// Order T5a: by the distance in plan to the flown line (dL): to 250 m every tree is a tree with leaves (the kit's): planes in the low
// ground, oaks and leafy round crowns on the slopes (beyond 120 m nine planes in ten are leafy round crowns of 12 to 16 m too); from 250 to 400 m one in four is leafy still; beyond 400 m plain crowns, small.
// Within 30 m of the line's low part (to y 36) no crown stands over y -3.2: the line passes 8 m and more above every crown.
function lineDistance(F) {
  const p = new THREE.Vector3(), L = []; for (let m = 0; m <= F.L; m += 3) { F.path.posAtDist(m, p); L.push([p.x, p.z, p.y]); }
  return (x, z, low) => { let d = 1e9; for (const q of L) { if (low && q[2] > 36) break; const e = Math.hypot(x - q[0], z - q[1]); if (e < d) d = e; } return d; };
}
const FINE_PLANES = 12, CORE_TUCK = 0.5, CORE_DARK = 0.45;                 // the planes cut finer; a crown's core: half its size, 0.45 of its tone
const MID_SHARE = 0.42;                                                   // of the lattice's trees between 250 and 400 m of the line, the share that stands (all leafy)
// the deal in short steps (the build waits between them); dealTrees runs it through at once for the sums
function* dealTreesSteps(st, heightAt, F, hillsAt) {
  const rt = st('trees'), near = [], far = [], TL = trackLine().map((p) => [p[0], p[1]]), dLine = lineDistance(F);
  for (let gx = -40; gx <= 366; gx += 18) { if (gx % 72 === 32) yield; for (let gz = -300; gz <= 420; gz += 18) {
    const x = gx + rt.range(-6, 6), z = gz + rt.range(-6, 6), hp = rt.range(20, 27), ho = rt.range(7, 11), v = rt.int(0, 2), rot = rt.range(0, TAU), keep = rt(), tone = rt();
    const r0 = Math.hypot(x - HOLLOW[0], z - HOLLOW[1]);
    if (keep > 1 - 0.65 * sstep(200, 420, r0) || inPillar(x, z, 6) || Math.hypot(x - KNOLL[0], z - KNOLL[1]) < 34 || Math.hypot(x - PASTURE[0], z - PASTURE[1]) < 45 || Math.hypot(x - SHRINE[0], z - SHRINE[1]) < 6) continue;
    if (r0 < 260 && polyDist(TL, x, z, null) < 5) continue;
    const y = heightAt(x, z), dL = dLine(x, z, false), lowLine = dLine(x, z, true) < 30;
    let kind, h;
    if (y <= -16.5 && (!lowLine || y + hp <= -3.2)) { kind = 0; h = hp; } else if (!lowLine || y + ho <= -3.2) { kind = 1; h = ho; } else continue;
    if (kind === 1 && Math.abs(heightAt(x + 6, z) - y) + Math.abs(heightAt(x, z + 6) - y) > 9) continue;       // not on the steepest ground
    if (dL > 400) { far.push({ x, y, z, h: (kind ? ho : hp * 0.5) * 0.7, kind, v, rot, tone, r0, dL }); continue; }
    if (dL > 250) { if (tone < MID_SHARE) near.push({ x, y, z, h: h * 1.25, kind, v, rot, tone: tone / MID_SHARE, r0, dL, mound: true }); continue; }
    near.push({ x, y, z, h, kind, v, rot, tone, r0, dL, mound: kind === 1 ? (dL > 120 ? tone < 0.7 : tone < 0.3) : (dL > 120 && tone < 0.9) });
  } }
  // upland oaks beyond 250 m of the line: a 22 m lattice within 700 m of the hollow, half kept, on ground that is not steep
  const ro = st('oaks');
  for (let gx = -670; gx <= 730; gx += 22) { if ((gx + 670) % 132 === 0) yield; for (let gz = -690; gz <= 710; gz += 22) {
    const x = gx + ro.range(-8, 8), z = gz + ro.range(-8, 8), h = ro.range(8, 12), keep = ro(), tone = ro(), rot = ro.range(0, TAU);
    const r0 = Math.hypot(x - HOLLOW[0], z - HOLLOW[1]);
    if (r0 > 700 || r0 <= 200 || inPillar(x, z, 8) || Math.hypot(x - VILLAGE[0], z - VILLAGE[1]) < 130 || Math.hypot(x - PASTURE[0], z - PASTURE[1]) < 45 || polyDist(TRACK2, x, z, null) < 6) continue;
    const dL = dLine(x, z, false); if (dL <= 250) continue;
    // beyond 400 m: a wood where the ground is a hollow or the gully runs (nine in ten of the lattice stand), lone trees elsewhere (one in sixteen)
    const wood = dL > 400 && hillsAt ? (hillsAt(x, z) < HOLLOW_H || polyDist(GULLY, x, z, null) < 45) : false;
    if (keep > (dL > 400 && hillsAt ? (wood ? 0.9 : 0.0625) : 0.5)) continue;
    const y = heightAt(x, z); if (Math.abs(heightAt(x + 6, z) - y) + Math.abs(heightAt(x, z + 6) - y) > (wood ? 9 : 5.5)) continue;
    if (dL > 400) far.push({ x, y, z, h: wood ? h : h * 0.7, kind: 1, v: 0, rot, tone, r0, dL, wood });
    else if (tone < MID_SHARE) near.push({ x, y, z, h: h * 1.25, kind: 1, v: 0, rot, tone: tone / MID_SHARE, r0, dL, mound: true });
  } }
  yield;
  // the twelve nearest the first 60 m of the flown line are cut finer
  if (F) { const p = new THREE.Vector3(), e = [];
    for (const t of near) { if (t.kind) continue; let d = 1e9; for (let m = 0; m <= 60; m += 3) { F.path.posAtDist(m, p); d = Math.min(d, Math.hypot(t.x - p.x, t.z - p.z)); } e.push([d, t]); }
    e.sort((a, b) => a[0] - b[0]); for (let i = 0; i < Math.min(FINE_PLANES, e.length); i++) e[i][1].fine = true; }
  return { near, far };
}
function dealTrees(st, heightAt, F, hillsAt) { const it = dealTreesSteps(st, heightAt, F, hillsAt); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// No bare ball among the leaves (order try 3, 4): the kit hangs its leaf cards on a smooth core; grown to a tree's size the core
// shows as a ball. Each core (a connected patch of core triangles) is drawn in about its own middle to `scale` of its size and
// darkened to `dark` (the crown's inner shade), or with `remove` left out altogether (the far crowns: leaves and boughs only).
function tuckCores(g, scale, dark, remove) {
  const W = g.attributes.wind, P = g.attributes.position, C = g.attributes.color, idx = g.index.array, n = P.count, par = new Int32Array(n), isCore = (i) => W.getY(i) > 0.9 && W.getZ(i) > 0.9;
  for (let i = 0; i < n; i++) par[i] = i;
  const find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  const keep = [];
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    if (isCore(a) && isCore(b) && isCore(c)) { par[find(a)] = find(b); par[find(c)] = find(b); } else keep.push(a, b, c); }
  if (remove) { g.setIndex(keep); } else {
    const sum = new Map();
    for (let i = 0; i < n; i++) if (isCore(i)) { const r = find(i); let e = sum.get(r); if (!e) sum.set(r, e = [0, 0, 0, 0]); e[0] += P.getX(i); e[1] += P.getY(i); e[2] += P.getZ(i); e[3]++; }
    for (let i = 0; i < n; i++) if (isCore(i)) { const e = sum.get(find(i)), cx = e[0] / e[3], cy = e[1] / e[3], cz = e[2] / e[3];
      P.setXYZ(i, cx + (P.getX(i) - cx) * scale, cy + (P.getY(i) - cy) * scale, cz + (P.getZ(i) - cz) * scale); C.setXYZ(i, C.getX(i) * dark, C.getY(i) * dark, C.getZ(i) * dark); }
  }
  if (g.userData) g.userData.triangles = g.index.count / 3;
  return g;
}
async function makeTrees(ctx, env, terrain, F, farCrowns) {
  const { st, look, ground } = env, sn = look.snow * 0.35, white = '#e4e9f2', deal = dealTreesSteps(st, (x, z) => terrain.surfaceAt(x, z), F, ground.hills);
  let step = deal.next(); while (!step.done) { await ctx.yield(); step = deal.next(); }
  const D = step.value;
  await ctx.yield();
  const windDir = [-SE[0], -SE[1]], wind = flora.makeWind({ direction: windDir, strength: look.snow ? 0.35 : 1 });
  const matOptions = { wind, backlight: 1.0, backlightTint: '#ffe08a' };
  await flora.prepareLeafTexture(matOptions, ctx.yield);
  const mat = flora.windMaterial(matOptions);
  await ctx.yield();
  const tint = (c) => '#' + new THREE.Color(c).lerp(new THREE.Color(white), sn).getHexString();
  const pal = [['#D9A62E', '#EBC454', '#8f6f24'], ['#B98A4A', '#D0A462', '#7d5a2e'], ['#A8A23A', '#C6B84E', '#5f6a2a']], oakPal = [['#6f7f58', '#8a966a', '#3f4a34'], ['#8a5a34', '#a8763e', '#55361f']];
  const rs = st('tree-shapes'), variants = [];
  for (const detail of [0, 1]) for (const p of pal) { variants.push(flora.oakGeometry({ rng: rs, height: 24, detail, fullness: 1.15, leaf: tint(p[0]), leafLight: tint(p[1]), leafDark: tint(p[2]), bark: '#a7966a', barkDark: '#6c6a42' })); await ctx.yield(); }      // a plane's bark: pale grey-buff, mottled olive
  for (const p of oakPal) variants.push(flora.oakGeometry({ rng: rs, height: 9, detail: 0, leaf: tint(p[0]), leafLight: tint(p[1]), leafDark: tint(p[2]) }));
  await ctx.yield();
  // leafy round crowns (the kit's bush, grown to a tree's size): olive, rust and old gold; variants 8 to 10, 7.5 m high as cut
  for (const p of [['#6f7f58', '#8d9a6c', '#414c36'], ['#96623a', '#b47f46', '#5a3a22'], ['#b39a44', '#cdb45a', '#6f6230']]) variants.push(flora.bushGeometry({ rng: rs, size: 6, detail: 0, leaf: tint(p[0]), leafLight: tint(p[1]), leafDark: tint(p[2]) }));
  await ctx.yield();
  // the same three again for beyond 120 m of the line (variants 11 to 13): leaves and boughs only
  for (const p of [['#6f7f58', '#8d9a6c', '#414c36'], ['#96623a', '#b47f46', '#5a3a22'], ['#b39a44', '#cdb45a', '#6f6230']]) variants.push(tuckCores(flora.bushGeometry({ rng: rs, size: 6, detail: 0, leaf: tint(p[0]), leafLight: tint(p[1]), leafDark: tint(p[2]) }), 1, 1, true));
  for (let i = 0; i < 11; i++) tuckCores(variants[i], CORE_TUCK, CORE_DARK, false);
  await ctx.yield();
  const points = D.near.map((t) => ({ x: t.x, y: t.y - (t.mound ? 0.4 : 0), z: t.z, s: t.mound ? (t.kind ? t.h : t.h * 0.6) / 7.5 : t.h / (t.kind ? 9 : 24), rot: t.rot, d: 0, u: 0, v: t.mound ? (t.kind ? 8 + (t.v & 1) : 10 - (t.v & 1)) + (t.dL > 120 ? 3 : 0) : t.kind ? 6 + (t.v & 1) : t.v + (t.fine ? 3 : 0) }));
  const g = look.leafGain, shade = (x, z) => { const k = ground.shade(x, terrain.surfaceAt(x, z) + 12, z); return [1 - 0.62 * k, 1 - 0.58 * k, 1 - 0.5 * k]; };      // in shade the light is the sky's: darker, a little cooler (never blue on pale bark)
  await ctx.yield();
  const forest = flora.makeScatter({ rng: st('tree-tints'), points, variants, material: mat, tint: 0.16, hue: 0.05, sink: 0.02, tilt: 0.03, stretch: 0, colors: [[g, g, g]], shade });
  await ctx.yield();
  // the far woods: round crowns in the plain's own mesh of crowns (gold planes in the low ground, olive and rust oaks on the slopes)
  const gold = lin('#a8893c'), tan = lin('#93724a'), olive = lin('#5d6a49'), rust = lin('#74502f'), snow = [0.78, 0.83, 0.92];      // seen far off a wood is duller and darker than its leaves
  const deep = lin('#4c5c3a');                                             // a wood of oaks in a hollow: deep olive, a rusty crown here and there
  for (const t of D.far) { const c = mix3(t.wood ? mix3(deep, rust, 0.6 * t.tone ** 3) : t.kind ? mix3(olive, rust, t.tone * t.tone) : mix3(gold, tan, t.tone), snow, look.snow * 0.45), k = g * (1 - 0.5 * ground.shade(t.x, t.y + t.h * 0.7, t.z));
    const sh = ground.shade(t.x, t.y + t.h * 0.7, t.z), wk = t.wood ? 0.78 : 1, col = [c[0] * k * wk, c[1] * k * wk * (1 + 0.04 * sh), c[2] * k * wk * (1 + 0.25 * sh)], r = t.h * (t.wood ? 0.72 : t.kind ? 0.5 : 0.3), hk = t.wood ? 1.45 : 1;      // in a wood the crowns are broad and close, and darker
    farCrowns(t.x, t.y + t.h * 0.45, t.z, r, t.h * 0.55 * hk, col, t.rot, true);
    // every far crown has a fellow beside it (a clump, not a lattice of single trees): 1.2 to 1.9 radii off, a fifth smaller
    const a2 = t.rot * 2.7, d2 = r * (t.wood ? 1.0 + 0.5 * t.tone : 1.2 + 0.7 * t.tone), x2 = t.x + d2 * Math.cos(a2), z2 = t.z + d2 * Math.sin(a2);
    farCrowns(x2, terrain.surfaceAt(x2, z2) + t.h * 0.36, z2, r * 0.8, t.h * 0.44 * hk, mul3(col, 0.92 + 0.16 * t.tone), t.rot + 1, true);
    if (t.wood) { const a3 = a2 + 2.2 + t.tone, d3 = r * (1.1 + 0.5 * t.tone), x3 = t.x + d3 * Math.cos(a3), z3 = t.z + d3 * Math.sin(a3);      // in a wood a third: the crowns close
      farCrowns(x3, terrain.surfaceAt(x3, z3) + t.h * 0.4, z3, r * 0.9, t.h * 0.5 * hk, mul3(col, 1.06 - 0.16 * t.tone), t.rot + 2, true); } }
  // scrub on the bare domes (order try 3, 7): they stay domes of the neighbours' rock (the part's makePillar, shape dome); 26 dark
  // thickets of 4 to 9 m root on each where the rock is not steep (its own mesh: normal up over 0.35) above three tenths of its height
  // (stream 'dome-scrub', every thicket's dice first); as far crowns: both domes lie beyond 400 m of the line
  { const rd = st('dome-scrub');
    for (const pl of env.pillars || []) { const q = pl.spec, dice = [];
      for (let i = 0; i < 26; i++) dice.push([rd(), rd.range(4, 9), rd(), rd.range(0, TAU)]);
      if (q.shape !== 'dome' || !pl.mesh) continue;
      const P = pl.mesh.geometry.attributes.position, N = pl.mesh.geometry.attributes.normal, foot = ground.height(q.x, q.z), ok = [];
      for (let i = 0; i < P.count; i++) if (N.getY(i) > 0.35 && P.getY(i) > lerp(foot, q.top, 0.3)) ok.push(i);
      for (const [u, sz, tone, rot] of dice) { if (!ok.length) break; const i = ok[Math.min(ok.length - 1, Math.floor(u * ok.length))], x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = g * (1 - 0.5 * ground.shade(x, y, z));
        farCrowns(x, y + 0.12 * sz, z, sz, sz * 0.7, mul3(mix3(mix3(deep, rust, 0.5 * tone * tone), snow, look.snow * 0.45), k * 0.8), rot, true); } } }
  await ctx.yield();
  // brushwood on the knoll's flanks and along the saddle (stream 'brush'): every candidate's dice first
  const rb = st('brush'), bpts = [];
  for (let i = 0; i < 90; i++) {
    const onKnoll = rb.chance(0.6), a = rb.range(0, TAU), d = rb.range(13, 44), t = rb(), off = rb.range(-11, 11), s = rb.range(0.7, 1.5), rot = rb.range(0, TAU), v = rb.int(0, 1);
    const x = onKnoll ? KNOLL[0] + d * Math.cos(a) : lerp(98, 14, t) + off * 0.2, z = onKnoll ? KNOLL[1] + d * Math.sin(a) : lerp(2, -2, t) + 6 * Math.sin(t * 3) + off;
    if ((x > STAGE.x0 - 1.5 && x < STAGE.x1 + 1.5 && z > STAGE.z0 - 1.5 && z < STAGE.z1 + 1.5) || polyDist(TRACK, x, z, null) < 2.5 || inGreat(x, z, 1)) continue;
    bpts.push({ x, y: terrain.surfaceAt(x, z), z, s, rot, d: 0, u: 0, v });
  }
  const bushes = flora.makeScatter({ rng: st('brush-tints'), points: bpts, material: mat, tint: 0.2, hue: 0.05, stretch: 0.2, colors: [[g, g, g]],
    variants: [flora.bushGeometry({ rng: rs, size: 1.7, detail: 0, leaf: tint('#9a8c52'), leafLight: tint('#b8aa66'), leafDark: tint('#5e5c3a') }), flora.bushGeometry({ rng: rs, size: 1.4, detail: 0, leaf: tint('#6a6a40'), leafLight: tint('#8a8850'), leafDark: tint('#3f4028') })] });
  return { forest, bushes, wind, mat, deal: D, triangles: forest.triangles + bushes.triangles };
}
// fallen blocks in the hollow and on the open ground at the pillar's foot (stream 'blocks'): every candidate's dice first
function makeBlocks(env, terrain) {
  const { st, look } = env, r = st('blocks'), M = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), spots = [];
  for (let i = 0; i < 70; i++) {
    const a = r.range(0, TAU), d = 210 * Math.sqrt(r()), s = 1 + 4 * Math.pow(r(), 2.2), yaw = r.range(0, TAU), tx = r.range(-0.3, 0.3), tz = r.range(-0.3, 0.3), sy = r.range(0.6, 1);
    const x = HOLLOW[0] + d * Math.cos(a), z = HOLLOW[1] + d * Math.sin(a);
    if (inGreat(x, z, 2 + s) || polyDist(TRACK, x, z, null) < 2.5 + s || Math.hypot(x - KNOLL[0], z - KNOLL[1]) < 16 + s || Math.hypot(x - SHRINE[0], z - SHRINE[1]) < 3 + s) continue;
    q.setFromEuler(e.set(tx, yaw, tz)); M.push(new THREE.Matrix4().compose(new THREE.Vector3(x, terrain.surfaceAt(x, z) - 0.3 * s, z), q, new THREE.Vector3(s, s * sy, s))); spots.push([x, z, s]);
  }
  void m;
  const geo = T.rockGeometry({ rng: st('block-shape'), kind: 'boulder', detail: 1, color: '#857f66', colorB: '#6f6a58' });
  const mat = T.makeRockMaterial({ terrain, rng: st('block-mat'), top: look.snow ? new THREE.Color(0.8, 0.85, 0.93) : null, strata: 0.2 });
  const inst = T.makeInstances(geo, mat, M, { rng: st('block-tints') });
  // rock crops out on the ridges of the upland (order try 3, 6): a 48 m lattice (stream 'outcrops', every candidate's dice first);
  // where the hills stand over RIDGE_H, 320 to 780 m from the hollow, three blocks of 3.5 to 8 m lie together, sunk a third
  const ro = st('outcrops'), M2 = [], ground = env.ground;
  for (let gx = -720; gx <= 760; gx += 48) for (let gz = -720; gz <= 740; gz += 48) {
    const x = gx + ro.range(-16, 16), z = gz + ro.range(-16, 16), keep = ro(), s = ro.range(3.5, 8), d = [];
    for (let k = 0; k < 3; k++) d.push([ro.range(0, TAU), ro.range(0.9, 1.6), ro.range(0.45, 0.9), ro.range(-0.35, 0.35), ro.range(0, TAU), ro.range(0.55, 0.95)]);
    const r0 = Math.hypot(x - HOLLOW[0], z - HOLLOW[1]);
    if (keep > 0.85 || r0 < 320 || r0 > 780 || SE[0] * x + SE[1] * z > 650 || ground.hills(x, z) < RIDGE_H || inPillar(x, z, 12) || polyDist(TRACK2, x, z, null) < 8) continue;
    for (let k = 0; k < 3; k++) { const [a, dd, sc, tilt, yw, sy] = d[k], px = x + (k ? dd * s * Math.cos(a) : 0), pz = z + (k ? dd * s * Math.sin(a) : 0), ss = s * (k ? sc : 1);
      q.setFromEuler(e.set(tilt, yw, tilt * 0.6)); M2.push(new THREE.Matrix4().compose(new THREE.Vector3(px, terrain.surfaceAt(px, pz) - 0.3 * ss, pz), q, new THREE.Vector3(ss, ss * sy, ss))); }
  }
  const geo2 = T.rockGeometry({ rng: st('outcrop-shape'), kind: 'boulder', detail: 0, color: '#8a846c', colorB: '#6f6a58' });
  const crops = T.makeInstances(geo2, mat, M2, { rng: st('outcrop-tints') }), object = new THREE.Group(); object.add(inst.object, crops.object);
  return { object, triangles: inst.triangles + crops.triangles, spots, outcrops: M2.length / 3 };
}

// ---------- THE MIDDLE GROUND (order of 03:47 UTC 10 Oct, point 15; rules-try3.txt addendum C) ----------
// Between the near wood and the pillars, 250 to 900 m from the hollow on the wild ground, the upland held grass and single trees.
// By rules of the ground, on a lattice of MID_CELL metres (stream 'middle', every cell's dice first), each cell that is not a wood
// already (a hollow, or within 45 m of the gully) takes what its place is:
//   by the second track (within 80 m): a CLUMP of three to nine trees, 8 m and more off the track;
//   on steep ground (a fall of MID_STEEP and more): SCRUB, three to five thickets (2.5 to 5.5 m) in a patch 40 m long lying along the level line, and one or two boulders (1.6 to 4.2 m, low);
//   on a ridge: two to four thickets by the rock that crops out there;
//   on gentle open ground: a clump of three to six small trees (45 in 100), three or four thickets with one boulder (35), or one tree, two thickets and a boulder (20);
//   in a wood beyond the oaks' own lattice (700 m), where the wood was its colour alone: four dark crowns.
// By each fold two or three small FIELDS (30 to 46 m by 44 to 64 m) lie along the level line either side of it (and uphill of it): a
// dry-stone wall on three sides, a hedge on the fourth, a gate gap toward the fold, a clump of three to five trees at one corner;
// stubble, plough, fallow or winter green. Along the second track a station every 70 m: at two in three a clump of three to nine
// trees 10 to 18 m off it. On each GULLY of the ground (traceGullies) a thread of dark bush, two to every 24 m, a tree among them.
function* dealMiddleSteps(st, ground, heightAt, folds, F) {
  const rm = st('middle'), dLine = lineDistance(F), crowns = [], fields = [], threads = ground.gullies.map((L) => L.pts), cells = [];
  const grad = (x, z, d) => [(heightAt(x + d, z) - heightAt(x - d, z)) / (2 * d), (heightAt(x, z + d) - heightAt(x, z - d)) / (2 * d)];
  const tree = (x, z, h, tone, gold) => { if (polyDist(TRACK2, x, z, null) < 5 || inPillar(x, z, 8)) return; crowns.push({ x, z, r: h * (gold ? 0.3 : 0.5), h, kind: gold ? 1 : 0, tone, rot: tone * 40, big: dLine(x, z, false) < 400 }); };
  const thicket = (x, z, r, tone, kind) => { if (polyDist(TRACK2, x, z, null) < 3 + r || inPillar(x, z, 6)) return; crowns.push({ x, z, r, h: r * (0.7 + 0.4 * tone), kind, tone, rot: tone * 50, big: false }); };
  // the fields by the folds: each fold's dice first
  for (const f of folds) {
    const d = []; for (let k = 0; k < 3; k++) d.push([rm.range(30, 46), rm.range(44, 64), rm.int(0, 4), rm(), rm.int(3, 5), rm.int(0, 3)]);
    const three = rm.chance(0.5), sideUp = rm.chance(0.5) ? 1 : -1, [gx, gz] = grad(f[0], f[1], 10), gl = Math.hypot(gx, gz) || 1, vx = gx / gl, vz = gz / gl, ux = -vz, uz = vx;
    for (let k = 0; k < (three ? 3 : 2); k++) {
      const [a, b, tone, t2, nt, corner] = d[k], along = k < 2, cx = f[0] + (along ? ux * (k ? -1 : 1) * (13 + a / 2) : vx * sideUp * (14 + b / 2)), cz = f[1] + (along ? uz * (k ? -1 : 1) * (13 + a / 2) : vz * sideUp * (14 + b / 2));
      const at = (p, q) => [cx + ux * p + vx * q, cz + uz * p + vz * q], C4 = [at(-a / 2, -b / 2), at(a / 2, -b / 2), at(a / 2, b / 2), at(-a / 2, b / 2)], ys = C4.map((c) => heightAt(c[0], c[1]));
      if (Math.max(...ys) - Math.min(...ys) > 13 || polyDist(TRACK2, cx, cz, null) < Math.max(a, b) / 2 + 6 || C4.some((c) => inPillar(c[0], c[1], 10)) || ground.gullies.some((L) => L.pts.some((p) => Math.abs((p[0] - cx) * ux + (p[1] - cz) * uz) < a / 2 + 4 && Math.abs((p[0] - cx) * vx + (p[1] - cz) * vz) < b / 2 + 4))) continue;
      const gate = along ? (k ? 1 : 3) : (sideUp > 0 ? 0 : 2), hedge = (gate + 2) % 4;     // sides: 0 = the low side, 1 = +u, 2 = the high side, 3 = -u; the gate looks to the fold, the hedge stands across from it
      fields.push({ cx, cz, ux, uz, vx, vz, a, b, tone, gate, hedge, C4 });
      { const A = C4[hedge], B = C4[(hedge + 1) % 4], L = Math.hypot(B[0] - A[0], B[1] - A[1]), nh = Math.max(2, Math.round(L / 5.5));
        for (let i = 0; i <= nh; i++) { const t = i / nh, w = Math.sin(i * 12.9898 + cx) * 43758.5453, hs = w - Math.floor(w); crowns.push({ x: lerp(A[0], B[0], t), z: lerp(A[1], B[1], t), r: 2.3 + 0.9 * hs, h: 2.6 + 1.2 * hs, kind: 3, tone: hs, rot: i, big: false }); } }
      const c0 = C4[corner]; for (let i = 0; i < nt; i++) { const w = Math.sin((i + 1) * 78.233 + cz) * 43758.5453, hs = w - Math.floor(w), an = TAU * (i + hs) / nt; tree(c0[0] + (5 + 4 * hs) * Math.cos(an), c0[1] + (5 + 4 * hs) * Math.sin(an), 7 + 4 * hs, (t2 + hs) % 1, false); }
    }
  }
  yield;
  const inField = (x, z, m) => fields.some((f) => { const dx = x - f.cx, dz = z - f.cz; return Math.abs(dx * f.ux + dz * f.uz) < f.a / 2 + m && Math.abs(dx * f.vx + dz * f.vz) < f.b / 2 + m; });
  // the lattice
  for (let i = -9; i <= 9; i++) { if (i % 4 === 0) yield; for (let j = -9; j <= 9; j++) {
    const x = HOLLOW[0] + i * MID_CELL + rm.range(-25, 25), z = HOLLOW[1] + j * MID_CELL + rm.range(-25, 25), lot = rm(), n = rm(), tone = rm(), d = [];
    for (let k = 0; k < 9; k++) d.push([rm(), rm(), rm()]);
    if (!inMid(x, z) || inField(x, z, 8) || folds.some((f) => Math.hypot(f[0] - x, f[1] - z) < 30)) continue;
    const hv = ground.hills(x, z), dt = polyDist(TRACK2, x, z, null), [gx, gz] = grad(x, z, 8), sl = Math.hypot(gx, gz), lx = sl > 1e-4 ? -gz / sl : 1, lz = sl > 1e-4 ? gx / sl : 0;
    let what;
    const clump = (k, hLo, hHi, golds) => { for (let q = 0; q < k; q++) { const an = TAU * d[q][0], rr = 3 + 13 * Math.sqrt(d[q][1]); tree(x + rr * Math.cos(an), z + rr * Math.sin(an), lerp(hLo, hHi, d[q][2]), (tone + d[q][2]) % 1, golds && q === 0 && tone < 0.3); } };
    const scrub = (k, nb) => { for (let q = 0; q < k; q++) thicket(x + lx * (d[q][0] - 0.5) * 40 + lz * (d[q][1] - 0.5) * 14, z + lz * (d[q][0] - 0.5) * 40 - lx * (d[q][1] - 0.5) * 14, 2.5 + 3 * d[q][2], d[q][2], 2);
      for (let q = 0; q < nb; q++) { const bx = x + lx * (d[8 - q][0] - 0.5) * 30 + lz * (d[8 - q][1] - 0.5) * 12, bz = z + lz * (d[8 - q][0] - 0.5) * 30 - lx * (d[8 - q][1] - 0.5) * 12; if (polyDist(TRACK2, bx, bz, null) > 8 && !inPillar(bx, bz, 10)) crowns.push({ x: bx, z: bz, r: 1.6 + 2.6 * d[8 - q][2] * d[8 - q][2], h: (1.6 + 2.6 * d[8 - q][2] * d[8 - q][2]) * (0.5 + 0.3 * d[8 - q][1]), kind: 5, tone: d[8 - q][0], rot: TAU * d[8 - q][0], big: false }); } };
    if (hv < HOLLOW_H || polyDist(GULLY, x, z, null) < 45) { what = 'wood';      // beyond the oaks' own lattice (700 m) a wood was its colour alone: four dark crowns to the cell
      if (Math.hypot(x - HOLLOW[0], z - HOLLOW[1]) > 690) for (let q = 0; q < 4; q++) crowns.push({ x: x + (d[q][0] - 0.5) * 44, z: z + (d[q][1] - 0.5) * 44, r: 4.5 + 2.5 * d[q][2], h: 5 + 2 * d[q][2], kind: 4, tone: d[q][2], rot: q, big: false }); }
    else if (dt < 80) { what = 'clump by the track'; clump(3 + Math.floor(n * 6.999), 7, 12, true); }
    else if (sl > MID_STEEP) { what = 'scrub and boulders'; scrub(3 + Math.floor(n * 2.999), 1 + Math.floor(lot * 1.999)); }
    else if (hv > RIDGE_H) { what = 'scrub on the ridge'; scrub(2 + Math.floor(n * 2.999), 0); }
    else if (lot < 0.45) { what = 'clump'; clump(3 + Math.floor(n * 3.999), 6, 10, false); }
    else if (lot < 0.8) { what = 'scrub'; scrub(3 + Math.floor(n * 1.999), 1); }
    else { what = 'tree and thickets'; clump(1, 8, 12, false); scrub(2, 1); }
    cells.push({ i, j, x, z, what });
  } }
  yield;
  // along the second track: a station every 70 m of its length (each station's dice first): at two in three a clump of 3 to 9 trees, 10 to 18 m off it to one side
  { let acc = 0, next = 35; for (let i = 0; i < TRACK2.length - 1; i++) { const A = TRACK2[i], B = TRACK2[i + 1], L = Math.hypot(B[0] - A[0], B[1] - A[1]);
      while (next <= acc + L) { const t = (next - acc) / L, keep = rm(), side = rm.chance(0.5) ? 1 : -1, off = rm.range(10, 18), n = rm.int(3, 9), tone = rm(), d = []; for (let q = 0; q < 9; q++) d.push([rm(), rm(), rm()]);
        const x = lerp(A[0], B[0], t) - side * off * (B[1] - A[1]) / L, z = lerp(A[1], B[1], t) + side * off * (B[0] - A[0]) / L; next += 70;
        if (keep > 0.667 || !inMid(x, z) || inField(x, z, 6)) continue;
        for (let q = 0; q < n; q++) { const an = TAU * d[q][0], rr = 2 + 9 * Math.sqrt(d[q][1]); tree(x + rr * Math.cos(an), z + rr * Math.sin(an), lerp(7, 12, d[q][2]), (tone + d[q][2]) % 1, q === 0 && tone < 0.3); }
        cells.push({ x, z, what: 'clump at a station of the track' }); }
      acc += L; } }
  yield;
  // the gullies (the ground's own, traced with it): a thread of dark bush, two to every 24 m, and a tree at every fifth step where the lot says
  for (const L of ground.gullies) { const line = L.pts;
    for (let k = 0; k < line.length; k++) { const w = Math.sin(k * 12.9898 + line[0][0] * 0.37) * 43758.5453, hs = w - Math.floor(w), a = line[Math.max(0, k - 1)], b2 = line[Math.min(line.length - 1, k + 1)], l = Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1;
      const x = line[k][0] + (hs - 0.5) * 4 * (b2[1] - a[1]) / l, z = line[k][1] - (hs - 0.5) * 4 * (b2[0] - a[0]) / l; if (inField(x, z, 3)) continue;
      if (k % 5 === 2 && hs > 0.35) tree(x, z, 8 + 4 * ((hs * 5) % 1), (L.tone + hs) % 1, hs > 0.8);
      else if (k % 3 !== 2) crowns.push({ x, z, r: 3 + 2 * hs, h: 3 + 3 * ((hs * 7) % 1), kind: 4, tone: (L.tone + hs) % 1, rot: k, big: false }); } }
  return { crowns, fields, threads, cells };
}
function dealMiddle(st, ground, heightAt, folds, F) { const it = dealMiddleSteps(st, ground, heightAt, folds, F); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
// the deal in the build's own short steps, and the fields' walls (dry stone, 0.7 m thick, 1.15 m over the ground at each piece's middle,
// pieces of 10 m and less up the slope, 14 m and less along the level line; a gate gap of 4 m toward the fold)
async function buildMiddle(ctx, env, terrain, folds) {
  const { b, C, st, ground, F } = env, it = dealMiddleSteps(st, ground, (x, z) => terrain.surfaceAt(x, z), folds, F); let r = it.next();
  while (!r.done) { await ctx.yield(); r = it.next(); }
  const M = r.value;
  b.col(mul3(C.stone, 0.95), 0.8, 1.05).surf(S.SURF.MASONRY, 0, 0.7);
  const run = (A, B, t0, t1, most) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]) * (t1 - t0), n = Math.max(1, Math.ceil(L / most)), yaw = Math.atan2(B[0] - A[0], B[1] - A[1]);
    for (let i = 0; i < n; i++) { const t = t0 + (t1 - t0) * (i + 0.5) / n, x = lerp(A[0], B[0], t), z = lerp(A[1], B[1], t); b.tr(x, terrain.surfaceAt(x, z), z, yaw); b.box(-0.35, -1.6, -L / n / 2, 0.35, 1.15, L / n / 2, { m: 1 }); b.pop(); } };
  for (const f of M.fields) for (let sd = 0; sd < 4; sd++) { if (sd === f.hedge) continue; const A = f.C4[sd], B = f.C4[(sd + 1) % 4], L = Math.hypot(B[0] - A[0], B[1] - A[1]), most = sd % 2 ? 10 : 14;
    if (sd === f.gate) { run(A, B, 0, 0.5 - 2 / L, most); run(A, B, 0.5 + 2 / L, 1, most); } else run(A, B, 0, 1, most); }
  return M;
}
// its trees, thickets, hedges, gully bush and boulders, as far crowns (a tree within 400 m of the line in the fuller crown; a boulder
// is a lump of the same make in the rock's colour); lit by the look, shaded by the pillars
function addMiddleCrowns(env, terrain, add, M) {
  const { look, ground } = env, dLine = lineDistance(env.F), g = look.leafGain, snow = [0.78, 0.83, 0.92], olive = lin('#5d6a49'), rust = lin('#74502f'), gold = lin('#a8893c'), tan = lin('#93724a'), deep = lin('#4c5c3a'), kermes = lin('#4f5a3c'), thorn = lin('#6a6548'), rock = lin('#857f66');
  for (const c of M.crowns) {
    const y = terrain.surfaceAt(c.x, c.z), k = g * (1 - 0.5 * ground.shade(c.x, y + c.h * 0.7, c.z)), t = c.tone;
    const base = c.kind === 0 ? mix3(olive, rust, t * t) : c.kind === 1 ? mix3(gold, tan, t) : c.kind === 2 ? mul3(mix3(kermes, thorn, t), 0.9) : c.kind === 3 ? mul3(mix3(deep, rust, 0.35 * t), 0.85) : c.kind === 4 ? mul3(mix3(deep, rust, 0.5 * t * t * t), 0.72) : mul3(rock, 0.6 + 0.2 * t);
    const col = mul3(mix3(base, snow, look.snow * 0.45), k);
    if (c.kind < 2) add(c.x, y + c.h * 0.45, c.z, c.r, c.h * 0.55, col, c.rot, !c.big); else add(c.x, y + c.h * (c.kind === 5 ? 0.25 : 0.38), c.z, c.r, c.h, c.kind === 5 ? mul3(col, 1 / g) : col, c.rot, dLine(c.x, c.z, false) > 450 ? 2 : true);
  }
}

// ---------- sky, light, far clouds, the shower ----------
// The far clouds' noise (the kit's own recipe, made here in steps of its own so that the kit's cloud call stays short): two channels
// of four octaves of value noise on a 256 tile, the first repeated twice shifted; stream 'cloud-noise'.
async function cloudNoise(rng, pause, size = 256) {
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)], m = size - 1;
  for (let ch = 0; ch < 2; ch++) for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
    const lat = new Float32Array(per * per), acc = f[ch]; for (let i = 0; i < lat.length; i++) lat[i] = rng();
    for (let y = 0; y < size; y++) { const fy = y / size * per, iy = Math.floor(fy), ty = fy - iy, wy = ty * ty * (3 - 2 * ty), r0 = (iy % per) * per, r1 = ((iy + 1) % per) * per;
      for (let x = 0, q = y * size; x < size; x++, q++) { const fx = x / size * per, ix = Math.floor(fx), tx = fx - ix, w = tx * tx * (3 - 2 * tx), i0 = ix % per, i1 = (ix + 1) % per;
        const a = lat[r0 + i0], b = lat[r0 + i1], c = lat[r1 + i0], d = lat[r1 + i1]; acc[q] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy); } }
    if (o & 1) await pause();
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), px = (v) => clamp(((v / norm - 0.5) * 1.75 + 0.5) * 255, 0, 255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const q = y * size + x, s1 = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
    data[q * 4] = px(f[0][q]); data[q * 4 + 1] = px(f[1][q]); data[q * 4 + 2] = px(f[0][s1]); data[q * 4 + 3] = px(f[0][s2]); }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}
const CUM_BASE = 950, CUM_R0 = 1500, CUM_R1 = 5000, CUM_N = [24, 30], CUM_APART = 0.9, CUM_SUN = 14, CUM_W = [420, 700], CUM_TALL = 0.55, CUM_PUFFS = 40, CUM_AIR = 0.3;
async function makeHeaven(ctx, env, scene) {
  const { st, look } = env, fogC = new THREE.Color(look.fogColor);
  scene.fog = new THREE.FogExp2(fogC, look.fog);
  const sky = makeSky({ rng: st('sky'), preset: 'day', zenith: look.skyZenith, ...(look.skyMid ? { mid: look.skyMid, horizon: look.skyHorizon } : {}), ground: '#9aa79c', sunDirection: look.sun, sunColor: look.gold ? '#ffc98a' : '#fff4e2',
    scatterColor: look.skyScatter, scatter: look.skyScatterK, lightColor: look.sunColor, lightIntensity: look.sunPower, ambientColor: look.fillColor, groundLight: '#67637c', ambientIntensity: look.fillPower * HEMI_SHARE,
    lightElevationMin: 5, fogColor: look.fogColor, clouds: false,
    // THE ZENITH (order of 03:47 UTC 10 Oct, point 14): deeper than the horizon but, as shown, no more saturated than 0.6 (the page's
    // curve drove the kit's day zenith #0f44ad to a pure cobalt #002db9, gold's #34479A to #0033a6): morning and rain #5270b0 (shown
    // #4b75bc), gold #56649f (shown #4e63ac). The high cloud is the world's own (makeCirrus): the kit's high layer is one field on a
    // shell, and overhead one feature of it filled a third of the picture.
    clouds2: false });
  await ctx.yield();
  // the light's box is FIXED on the haul face (centre (8,110,0), 165 m half-width, the sun 600 m off): it never follows the eye
  const rig = makeLightRig(sky, { follow: false, shadow: true, shadowSize: 2048, shadowRange: 165, distance: 600 });
  // A CAST SHADOW OF THE MAP TAKES CAST_SHADOW OF THE SUN, NOT ALL OF IT (order of 02:38 UTC 10 Oct, point 11; rules-try3.txt addendum A).
  // Measured: the rock under the brow stood black (0.006 as shown) where the hoist house and the edge row throw their shadow on rock that
  // the part's baked terms call lit: there the part keeps only a fifth of its shade light, and the map took the whole sun. With 0.45 of
  // the sun left, rock in a cast shadow stands at 0.38 to 0.43 of the same rock in the sun (the band of the shade's own rule, 0.35 to
  // 0.45) and plain rock never under 0.02 as shown. The same in every look and for every cast shadow of the map, our own on the face too.
  rig.sun.shadow.intensity = env.castShade ? 1 : CAST_SHADOW;                // the part's word castShade: its shade line un-cuts itself in the map's shadow (for-artist.txt); then the map takes the whole sun
  // THE GROUND'S LIGHT (order of 03:47 UTC, point 13; rules-try3.txt addendum C): the lower half of the hemisphere carries GROUND_BACK of
  // the rock's own shade light (the lit country's light thrown back up, blue-violet in every look); it was a fourteenth of it. Whatever
  // looks down takes it: the brow, the stage's underside, the eaves. With it plain rock in a cast shadow under the brow is shown at
  // 0.07 (lit beside it 0.11) and a wall's shade stands at 0.42 of its sunlit side.
  rig.hemi.groundColor.setRGB(look.rockShade[0] * GROUND_BACK / rig.hemi.intensity, look.rockShade[1] * GROUND_BACK / rig.hemi.intensity, look.rockShade[2] * GROUND_BACK / rig.hemi.intensity);
  // the sky's fill against the sun (order try 3, 2): a cooler, lower light without shadow from FILL_TURN degrees round from the sun's
  // bearing, FILL_ELEV up: it models the shaded sides (a core of shade stays between it and the sun); the hemisphere keeps HEMI_SHARE
  { const fa = Math.atan2(look.sun[0], look.sun[2]) + FILL_TURN * DEG, fe = FILL_ELEV * DEG, side = new THREE.DirectionalLight(look.sideColor, look.sidePower);
    side.position.set(Math.sin(fa) * Math.cos(fe), Math.sin(fe), Math.cos(fa) * Math.cos(fe)).multiplyScalar(600); side.name = 'sky-fill'; rig.object.add(side); }
  await ctx.yield();
  // THE CUMULUS FIELD (polish round G; stream 'clouds'). The sky stood bare: the five to nine small clouds were dealt 3.4 to 6.2 km off,
  // and the kit's cloud field, called without a far fade of the world's own, ends a puff between 2.88 and 3.78 km from the eye; what
  // was left of one the air took. Now fair-weather cumulus stand over the country all round, their BASES LEVEL at CUM_BASE.
  // SAID IN THE OPEN (rule text BB, two): the field is laid about THE HAUL LINE, the way's own axis (the eye is never 90 m from it),
  // so that it is seen well from the way, and this holds for the whole flight and every seed: a cloud's middle stands between CUM_R0
  // from that line (none over the pillars: the zenith stays clear) and CUM_R1, the bearing even and the distance even by area, and
  // its width is CUM_W times the root of (its distance from the line over 2.5 km): the farther is dealt the wider, so that the far
  // ranks still read (the first build's clouds were sized by their distance too). CUM_N lots, each taken where its middle stands
  // CUM_APART times the sum of the two widths from every cloud before it (ten tries, else none) and CUM_SUN degrees or more from the
  // sun's bearing as taken from the haul line at the build (THE SUN'S ROAD: it keeps a cloud's body off the sun's disc in most deals,
  // not in all: a wide cloud's edge or the drift may reach that bearing, and then the disc shows through the cloud's rim and the
  // light does not dim). A cloud is wider than tall (the kit's height CUM_TALL); the kit's width is nominal, an outline measures up
  // to about 1.5 times it. The field's far fade lies beyond its own bound, so that the air alone pales a far cloud, and the air tints
  // a far cloud and thins it little (the kit's fogFade CUM_AIR: a cloud stands a kilometre up, above the thick of the air). One
  // wind: they drift north-west at 3 m/s. After rain one more, grey, low over the shower, where it stood (its place is typed here
  // twice and once in the shower's veil); the lots keep their distance from it too. The kit takes the clouds' colours from the sky.
  const rc = st('clouds'), at = [], nc = rc.int(CUM_N[0], CUM_N[1]), sunB = Math.atan2(look.sun[2], look.sun[0]), kept = look.rain ? [[1150, 2500, 520]] : [];
  for (let i = 0; i < nc; i++) for (let t = 0; t < 10; t++) {
    const b = rc.range(0, TAU), d = Math.sqrt(rc.range(CUM_R0 * CUM_R0, CUM_R1 * CUM_R1)), w = rc.range(CUM_W[0], CUM_W[1]) * Math.sqrt(d / 2500), x = HAUL[0] + d * Math.cos(b), z = HAUL[1] + d * Math.sin(b);
    if (Math.abs(Math.atan2(Math.sin(b - sunB), Math.cos(b - sunB))) < CUM_SUN * DEG || kept.some((k) => Math.hypot(x - k[0], z - k[1]) < CUM_APART * (w + k[2]))) continue;
    kept.push([x, z, w]); at.push([x, CUM_BASE, z, w]); break;
  }
  if (look.rain) at.push([1150, 430, 2500, 520]);
  const noiseTexture = await cloudNoise(st('cloud-noise'), ctx.yield);
  await ctx.yield();
  const clouds = makeCloudField({ rng: st('cloud-shapes'), sky, at, noiseTexture, wind: [-SE[0] * 3, 0, -SE[1] * 3], puffs: CUM_PUFFS, height: CUM_TALL, farFade: [CUM_R1 + 1500, CUM_R1 + 3000], fogFade: CUM_AIR, opacity: 0.85, shadeColor: look.gold ? '#b9aeb6' : look.rain ? '#98a6bd' : '#a9b9d6' });
  await ctx.yield();
  let shower = null;
  if (look.rain) {                                                        // one grey veil of rain under the eighth cloud, slanting with the wind
    const P = [], A = [], w = 260, n = [-SE[1], SE[0]];
    for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { P.push(1150 + n[0] * w * u - SE[0] * 90 * (1 - v), -190 + 630 * v, 2500 + n[1] * w * u - SE[1] * 90 * (1 - v)); A.push(u, v); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(A, 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeBoundingSphere();
    shower = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uC: { value: new THREE.Color().setRGB(...mix3(lin(look.fogColor), lin('#6f7f95'), 0.6)) }, uTime: env.U.uTime },
      vertexShader: 'attribute vec2 aUv; varying vec2 vUv; void main() { vUv = aUv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: /* glsl */`uniform vec3 uC; uniform float uTime; varying vec2 vUv;
        void main() { float x = clamp(vUv.x, -1., 1.), s = .75 + .25 * sin(x * 37. + vUv.y * 3. - uTime * .35) * sin(x * 11.3 + 1.7);
          float a = (1. - x * x) * (1. - x * x) * (1. - smoothstep(.82, 1., vUv.y)) * (.35 + .65 * vUv.y) * s * .5; gl_FragColor = vec4(uC, a); }` }));
    shower.name = 'shower'; shower.renderOrder = 1;
  }
  const cirrus = makeCirrus(env, noiseTexture);
  return { sky, rig, clouds, shower, noiseTexture, cirrus };
}
// THE HIGH CLOUD (orders of 03:47 and 05:19 UTC 10 Oct, points 14 and 16; rules-try3.txt addenda F to N): small COMMAS of cirrus on one
// level sheet far above; the sheet rides with the eye as the sky does (a tail is a direction: (x, 1, z) on the sheet, its height the
// unit). Stream 'cirrus', the families' dice first, then every tail's: 18 on a morning, 20 at gold, 24 after rain, in three or four
// loose families whose headings stand 28 to 40 degrees apart about the upper wind (a tail within 4 degrees of its family's). A tail
// is 5 to 8 degrees long AS SEEN FROM BELOW wherever it stands (the sheet's metric), its head no nearer the zenith than 15 degrees
// + its length + its fan: a hooked head with a dense tuft, fibres fanning from it (0.5 to 0.75 of the length wide at the end),
// leaning heavier to one side and thinning to nothing. At gold it takes the low sun's colour. Nothing moves in it.
const CIRRUS_TURN = 40, CIRRUS_SEG = 12, CIRRUS_CLEAR = 15, CIRRUS_LOW = 76, CIRRUS_APART = 12;   // the upper wind's run round from the low wind's; ribbon segments; degrees kept clear round the zenith; the lowest head, degrees from the zenith; head from head, degrees
function makeCirrus(env, noiseTexture) {
  const { st, look } = env, r = st('cirrus'), n = look.rain ? 24 : look.gold ? 20 : 18, P = [], A = [], K = [], I = [], wa = Math.atan2(-SE[1], -SE[0]) + CIRRUS_TURN * DEG;
  const nf = r.chance(0.5) ? 3 : 4, step = r.range(28, 40) * DEG, a0 = r.range(0, TAU), fam = [], heads = [];
  for (let f = 0; f < nf; f++) fam.push({ heading: wa + (f - (nf - 1) / 2) * step, az: a0 + f * TAU / nf + r.range(-15, 15) * DEG });
  // the sheet's metric: one radian of sky seen from below is 1 + q² of the sheet along the radius and sqrt(1 + q²) across it (q the
  // distance from the zenith's foot): how far on the sheet one radian of sight goes in the direction (c, s) at (x, z)
  const reach = (x, z, c, s) => { const q2 = x * x + z * z, q = Math.sqrt(q2) || 1, cr = (c * x + s * z) / q, ct = (s * x - c * z) / q, m = 1 + q2; return Math.min(30, 1 / Math.sqrt(cr * cr / (m * m) + ct * ct / m)); };
  for (let i = 0; i < n; i++) {
    const F = fam[i % nf], len = r.range(5, 8) * DEG, fan = len * r.range(0.5, 0.75), head = r.range(0.15, 0.25), e = r.range(0.7, 1.1), hook = r.chance(0.7) ? r.range(40, 110) * DEG * (r.chance(0.5) ? 1 : -1) : 0, bend = r.range(-25, 25) * DEG;
    const th0 = F.heading + r.range(-4, 4) * DEG, seed = r(), op = r.range(0.55, 1), lean = r.range(-0.45, 0.45), thin = r.range(0.5, 1), base = P.length / 3;
    // its place: up to 8 lots; the first that stands CIRRUS_APART from every earlier head (else the one that stands farthest)
    let x = 0, z = 0, s0 = 0, best = -1;
    for (let t = 0; t < 8 && best < CIRRUS_APART * DEG; t++) {
      const az = F.az + r.range(-55, 55) * DEG, zen = Math.acos(r.range(Math.cos(CIRRUS_LOW * DEG), Math.cos(CIRRUS_CLEAR * DEG + len + fan))), q = Math.tan(zen), hx = q * Math.cos(az), hz = q * Math.sin(az);
      let near = 9; for (const h of heads) near = Math.min(near, Math.acos(clamp((hx * h[0] + 1 + hz * h[1]) / Math.sqrt((hx * hx + 1 + hz * hz) * (h[0] * h[0] + 1 + h[1] * h[1])), -1, 1)));
      if (near > best) { best = near; x = hx; z = hz; }
    }
    heads.push([x, z]);
    for (let k = 0; k <= CIRRUS_SEG; k++) {
      const s = k / CIRRUS_SEG, th = th0 + bend * (s - 1) + hook * Math.exp(-s / 0.16), c = Math.cos(th), sn = Math.sin(th);   // the far end runs down the family's heading
      const d = (s - s0) * len * reach(x, z, c, sn); s0 = s; x += d * c; z += d * sn;
      const hw = 0.5 * fan * (head + (1 - head) * Math.pow(s, e)) * reach(x, z, -sn, c), nx = -sn * hw, nz = c * hw;
      P.push(x - nx, 1, z - nz, x + nx, 1, z + nz); A.push(s, -1, s, 1); K.push(seed, op, lean, thin, seed, op, lean, thin);
      if (k) { const j = base + k * 2; I.push(j - 2, j - 1, j, j, j - 1, j + 1); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(A, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4)); g.setIndex(I);
  const lit = new THREE.Color('#ffffff'); if (look.gold) lit.lerp(new THREE.Color(look.sunColor), 0.75);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: true, fog: false, toneMapped: false, side: THREE.DoubleSide,
    uniforms: { tNoise: { value: noiseTexture }, uLit: { value: lit }, uShade: { value: new THREE.Color(look.gold ? '#b294a2' : '#c3cee2') }, uHaze: { value: new THREE.Color(look.fogColor) }, uOp: { value: look.rain ? 0.25 : 0.27 } },
    vertexShader: /* glsl */`attribute vec2 aUv; attribute vec4 aK; varying vec2 vUv; varying vec4 vK; varying vec3 vD;
      void main() { vUv = aUv; vK = aK; vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`uniform sampler2D tNoise; uniform vec3 uLit, uShade, uHaze; uniform float uOp; varying vec2 vUv; varying vec4 vK; varying vec3 vD;
      void main() {
        float s = vUv.x, v = vUv.y, rr = length(vec2(max(0., (.14 - s) / .14), v)), edge = pow(max(1. - rr * rr, 0.), 1.2), lv = (v - vK.z) / .9, lean = .45 + .55 * exp(-lv * lv);   // soft from the middle out, round at the head; heavier to one side
        // a soft VEIL with strands in it (the far clouds' noise): each strand its own weight (the fine field across, the same along the
        // whole tail), its own length (the broad field across) and a waver along it; at the head they are one soft knot
        float n1 = texture2D(tNoise, vec2(v * .16 + vK.x * 3.1, vK.x * 7.3)).g, n2 = texture2D(tNoise, vec2(v * .8 + vK.x * 5.7, vK.x)).r, n3 = texture2D(tNoise, vec2(v * .1 + vK.x, s * .2 + vK.x * 2.9)).g;
        float fend = .6 + .4 * n2, fib = (.25 + .75 * smoothstep(.3, .7, n1)) * (1. - smoothstep(fend - .3, fend, s)) * (.75 + .25 * n3), kn = (s - .12) / .12, knot = .7 * exp(-kn * kn), dy = normalize(vD).y;
        float a = edge * pow(max(1. - s, 0.), vK.w) * mix(lean * fib, 1., knot) * vK.y * smoothstep(.1, .26, dy) * uOp;
        gl_FragColor = vec4(mix(uHaze, mix(uShade, uLit, .45 + .55 * max(fib, knot)), smoothstep(.1, .42, dy)), a);
      }` });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'cirrus'; mesh.frustumCulled = false; mesh.renderOrder = -1;
  return { mesh, triangles: I.length / 3 };
}

// ---------- leaves and smoke ----------
function makeAir(env, hero, time, villageAt, tops) {
  const { st, look } = env, detail = env.detail, wind = look.snow ? [0, 0, 0] : [-SE[0], 0, -SE[1]];
  // falling leaves: a FIXED box over the hollow (top y +1: 4 m under the lowest of the line); they come down singly on the one wind
  const leaves = fx.makeParticles({ rng: st('leaves'), preset: 'leaves', follow: false, center: [60, -12.5, 30], box: [240, 27, 200], count: Math.round(2600 * detail * (look.snow ? 0.4 : 1)), near: [0, 0.001], time,
    velocity: [wind[0] * 1.8, -1.15, wind[2] * 1.8], colors: ['#D9A62E', '#B98A4A', '#c9b04a'], size: [0.16, 0.3], lightDir: look.sun });
  const smokes = [], col = look.gold ? '#b9aaa0' : '#aeb4c0', top = look.gold ? '#e0cdb8' : '#d6dde8';
  const column = (name, p, h, r1, n) => smokes.push(fx.makeSmokeColumn({ rng: st(name), time, position: p, height: h, radius: [0.5, r1], size: [1.6, r1 * 2.2], count: n, color: col, colorTop: top, shadowColor: '#6c7388', ambient: '#3a4254',
    opacity: 0.5, wind: [wind[0], 0.0001, wind[2]], bend: look.snow ? 0.02 : 0.5, near: [0, 0.001], sunDir: look.sun, sunColor: look.sunColor }));
  const K = hero.anchors.smoke.kitchen, Cc = hero.anchors.smoke.cell;
  column('smoke-kitchen', [K.x, K.y, K.z], 26, 4.5, 36); column('smoke-cell', [Cc.x, Cc.y, Cc.z], 18, 3, 24);
  for (let i = 0; i < 3 && i < villageAt.length; i++) { const v = villageAt[i * 7 % villageAt.length]; column('smoke-village' + i, [v[0], -150 + 7, v[1]], 60, 9, 30); }
  // one thread from each lived-in neighbour: taller and thicker the farther it stands, so that it reads from the net
  for (const t of tops) { const k = clamp(t.far / 300, 0.6, 2.6); column('smoke-' + t.name, t.smoke, 22 * k, 3.2 * k, 18); }
  return { leaves, smokes };
}

// ---------- THE MOUNT (try 2, light): the net's rim and meshes, seven cords to the hook, the hook, the great rope, our shadow's stand-ins ----------
// Local frame: the eye at the origin, +y up, +z along our heading. The passenger sits a little back in the net: the net's axis (the hook's
// plumb line) is AX ahead of the eye. The rim is one cord of 2.5 cm, an oval 1.15 m from the axis ahead, 1.39 m abeam, 1.29 m astern; it is held at seven feet,
// at bearings 55, 100 and 145 degrees either side of the heading and at 180 (NONE ahead), 0.42 m under the eye, and sags between them as
// the square of the gap: 0.48 m across the open front (its middle lies 33 degrees under level: 7 in 100 of a level picture), 0.08 m and less
// elsewhere. From each foot one cord of 2.2 cm runs to the hook, 2.2 m over the eye, its middle hanging 3 in 100 of its length under the
// straight line (hemp, order try 3, 5). The meshes are 0.35 m of 1.5 cm cord; the great rope above the hook is 5 cm.
// Nothing of it is nearer the eye than 0.6 m (the cord astern passes at 0.68 m). In a level picture the two cords of 55 degrees stand
// in the outermost fiftieth of the width; on the look up the hub stands 0.45 of the half height over the ring's middle. Nothing else rides with us.
const FILL_TURN = 160, FILL_ELEV = 12, HEMI_SHARE = 0.6;                    // the sky's fill light: its bearing from the sun's, its height; the hemisphere's share of the old fill
const CAST_SHADOW = 0.55;                                                   // the share of the sun that a cast shadow of the light's map takes away
const GROUND_BACK = 0.5;                                                    // the hemisphere's lower half: this share of the rock's shade light, from below
const CORD_SAG = 0.03;                                                      // a cord's middle hangs 3 in 100 of its length off the straight line
const CORD = 0.022, RIM_CORD = 0.025, ROPE = 0.05;                          // thickness, metres: a gathered cord, the rim, the great rope above the hook (meshes 1.5 cm)
const HOOK_Y = 2.2, AX = 0.22, FEET = [-145, -100, -55, 55, 100, 145, 180], FOOT_Y = -0.42, SAG = 0.48 / (55 * 55);
const netRim = (az) => {                                                    // radius about the axis and height of the rim at a bearing (radians) from the heading
  let d = ((az / DEG) % 360 + 540) % 360 - 180; if (d <= -145) d += 360;
  let a = FEET[0], b = FEET[1]; for (let i = 0; i < FEET.length - 1; i++) if (d >= FEET[i] && d <= FEET[i + 1]) { a = FEET[i]; b = FEET[i + 1]; }
  if (d > 180) { a = 180; b = 215; }
  const c = Math.cos(az);
  return [1.15 + 0.2 * (1 - c * c) + 0.14 * ((1 - c) / 2) ** 2, FOOT_Y - SAG * (d - a) * (b - d)];      // an oval: wider abeam, so the cords of 55 stand outside a level picture below eye height
};
const netAt = (az, t) => { const [R, yr] = netRim(az), g = Math.pow(Math.max(0, (t - 0.42) / 0.58), 1.25); return [R * t * Math.sin(az), -0.95 + (yr + 0.95) * g, AX + R * t * Math.cos(az)]; };
// A cord is drawn as a ribbon turned to the eye and shaded as a round: aW = side across, half width, least pixels, which end; aAl.x = the
// way along it in its own diameters (the lay's measure).
const CORD_VERT = /* glsl */`
  attribute vec3 aOther; attribute vec4 aW; attribute vec3 aAl; uniform float uBufH, uTime; uniform vec3 uSunD; varying vec3 vCol, vSide, vEye, vSunV, vUpV; varying float vAx, vAl, vPx;
  #include <fog_pars_vertex>
  vec3 give(vec3 p, float m) { return p + m * vec3(.008 * sin(uTime * 2.6 + p.y * 3.), .012 * sin(uTime * 4.4), .008 * cos(uTime * 2.2 + p.y * 2.4)); }   // the bag breathes, the cords give a little
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(give(position, aAl.y), 1.); vec3 q = (modelViewMatrix * vec4(give(aOther, aAl.z), 1.)).xyz;
    vec3 t = (q - mvPosition.xyz) * aW.w; vec3 sd = cross(t, mvPosition.xyz); float l = length(sd); sd = l > 1e-7 ? sd / l : vec3(1., 0., 0.);
    float px = 2. * max(-mvPosition.z, .01) / (projectionMatrix[1][1] * max(uBufH, 1.));
    float hw = max(aW.y, aW.z * px * .5);
    vSide = sd; vEye = normalize(-mvPosition.xyz); vAx = aW.x; vAl = aAl.x; vPx = 2. * aW.y / px; vCol = color; vSunV = (viewMatrix * vec4(uSunD, 0.)).xyz; vUpV = (viewMatrix * vec4(0., 1., 0., 0.)).xyz;
    mvPosition.xyz += sd * aW.x * hw; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const ROPE_VERT = /* glsl */`
  attribute vec3 aW; uniform vec3 uHook, uBlock, uSunD; uniform float uBufH; varying vec3 vCol, vSide, vEye, vSunV, vUpV; varying float vAx, vAl, vPx;
  #include <fog_pars_vertex>
  void main() {
    vec3 d = uBlock - uHook; float L = length(d); d /= max(L, 1e-4);
    vec4 mvPosition = viewMatrix * vec4(uHook + d * min(position.y, L), 1.); vec3 t = (viewMatrix * vec4(d, 0.)).xyz;
    vec3 sd = cross(t, mvPosition.xyz); float l = length(sd); sd = l > 1e-7 ? sd / l : vec3(1., 0., 0.);
    float px = 2. * max(-mvPosition.z, .01) / (projectionMatrix[1][1] * max(uBufH, 1.));
    float hw = max(aW.y, aW.z * px * .5);
    vSide = sd; vEye = normalize(-mvPosition.xyz); vAx = aW.x; vAl = position.y / (2. * aW.y); vPx = 2. * aW.y / px; vCol = color; vSunV = (viewMatrix * vec4(uSunD, 0.)).xyz; vUpV = (viewMatrix * vec4(0., 1., 0., 0.)).xyz;
    mvPosition.xyz += sd * aW.x * hw; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
// THE RULE OF THE CORD (order of 02:38 UTC 10 Oct, point 10; rules-try3.txt addendum A): rim, meshes, the seven gathered cords and the
// great rope are one old hemp. Its own colour HEMP (#777564) is 0.91 of the hoist house's planks in luminance, so square to one light a
// cord is never brighter than a plank. In the sun it shows HEMP x (sun + sky), in shade HEMP x (0.45 sun + 1.2 sky) (light through and
// round the fibres); between them by the round's own normal; a round's limb 0.82 of its middle. The crest, morning: #8f7e5c (linear
// luminance 0.216 as shown) and #5b5040; gold #a26934 and #6b4028. Nothing here adds light: lay, fleck and tone only take away.
// The lay: three strands, one turn in three diameters (a band each diameter along, slanting across), the groove 0.25 darker than the
// crest; it fades in with the cord's width in the picture (nothing under 4 pixels, whole from 9), so it never beats into stripes;
// fibre fleck in cells a sixth of a diameter, up to 0.1 darker, from 8 to 16 pixels of width.
const HEMP = '#777564', HEMP_SHADE_SUN = 0.45, HEMP_SHADE_SKY = 1.2, LAY_DEPTH = 0.25;
const CORD_FRAG = /* glsl */`
  uniform vec3 uCordSun, uCordShade; varying vec3 vCol, vSide, vEye, vSunV, vUpV; varying float vAx, vAl, vPx;
  #include <fog_pars_fragment>
  float h21(vec2 p) { p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
  void main() {
    float ax = clamp(vAx, -1., 1.), rd = sqrt(max(1. - ax * ax, 0.)), th = asin(ax);
    vec3 n = normalize(normalize(vSide) * ax + normalize(vEye) * rd);
    float groove = .5 - .5 * cos(6.2832 * vAl - 3. * th);
    float lay = 1. - ${LAY_DEPTH.toFixed(2)} * smoothstep(.25, 1., groove) * smoothstep(4., 9., vPx);
    float fleck = 1. - .1 * h21(vec2(floor(vAl * 6.), floor((th + 1.5708) * 3.))) * smoothstep(8., 16., vPx);
    vec3 col = mix(uCordShade, uCordSun, smoothstep(-.25, .75, dot(n, normalize(vSunV)))) * vCol * (lay * fleck * (.82 + .18 * rd));
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;
function makeMount(env, hero) {
  const { C, st, U } = env, r = st('net'), grey = (k) => [k, k, k], KNOT = grey(0.72);      // a cord's colour here is its own tone only (0.86 to 1; knots darker): the hemp is the shader's
  const P = [], O = [], Cc = [], W = [], A = [], I = [];
  // seg(a, b, width, colour, along at a, mask a, mask b): mask 0 = held by the hook, 1 = gives with the bag
  const seg = (a, b, w, c, al, ma, mb) => {
    const n = P.length / 3, len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    for (let k = 0; k < 4; k++) { const first = k < 2, p = first ? a : b, q = first ? b : a, sd = (k === 0 || k === 3) ? -1 : 1;
      P.push(p[0], p[1], p[2]); O.push(q[0], q[1], q[2]); Cc.push(c[0], c[1], c[2]); W.push(sd, w * 0.5, 1.2, first ? 1 : -1); A.push((first ? al : al + len) / w, first ? ma : mb, first ? mb : ma); }
    I.push(n, n + 1, n + 2, n, n + 2, n + 3); return al + len;
  };
  const poly = (pts, w, c, mask) => { let al = r.range(0, 3); for (let i = 0; i < pts.length - 1; i++) al = seg(pts[i], pts[i + 1], w, c, al, mask(pts[i]), mask(pts[i + 1])); };
  const bagMask = (p) => clamp((HOOK_Y - p[1]) / (HOOK_Y + 0.2), 0, 1);
  // the meshes: two families of fourteen diagonal cords of 1.5 cm from under us to the rim (0.35 m apart at the rim), a small knot at the upper crossings
  const NM = 14, TW = 1.1;
  for (let j = 0; j < NM; j++) for (const sgn of [1, -1]) {
    const az0 = TAU * (j + 0.5) / NM, pts = [], tone = grey(r.range(0.86, 1));
    for (let i = 0; i <= 12; i++) { const t = lerp(0.2, 1, i / 12); pts.push(netAt(az0 + sgn * TW * (1 - t), t)); }
    poly(pts, 0.015, tone, bagMask);
    if (sgn > 0) for (let n = 1; n <= 2; n++) { const t = 1 - n * (TAU / NM) / (2 * TW), az = az0 + TW * (1 - t), p = netAt(az, t), q = netAt(az + 0.02, t + 0.012), dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], l = Math.hypot(dx, dy, dz) / 0.012;
      seg([p[0] - dx / l, p[1] - dy / l, p[2] - dz / l], [p[0] + dx / l, p[1] + dy / l, p[2] + dz / l], 0.032, KNOT, 0, bagMask(p), bagMask(p)); }
  }
  // the rim cord (2.5 cm), and from each of its seven feet one cord of 2.2 cm to the hook; a whipping where they meet under it
  { const pts = []; for (let i = 0; i <= 96; i++) { const az = TAU * i / 96, [R, y] = netRim(az); pts.push([R * Math.sin(az), y, AX + R * Math.cos(az)]); } poly(pts, RIM_CORD, grey(0.97), bagMask); }
  const feet = [];
  for (const f of FEET) {
    const az = f * DEG, [R, y] = netRim(az), foot = [R * Math.sin(az), y, AX + R * Math.cos(az)], pts = [];
    const hx = -foot[0], hy = HOOK_Y - 0.1 - foot[1], hz = AX - foot[2], hl = Math.hypot(hx, hy, hz), hr = Math.hypot(hx, hz) || 1;
    // below the chord, square to it in its own upright plane: (toward the axis) * hy/hl, (down) * hr/hl
    const sx = hx / hr * hy / hl, sy = -hr / hl, sz = hz / hr * hy / hl;
    for (let i = 0; i <= 8; i++) { const t = i / 8, k = CORD_SAG * hl * 4 * t * (1 - t); pts.push([foot[0] * (1 - t) + sx * k, lerp(foot[1], HOOK_Y - 0.1, t) + sy * k, lerp(foot[2], AX, t) + sz * k]); }
    poly(pts, CORD, grey(r.range(0.9, 1)), bagMask); feet.push(foot);
    seg([foot[0] * 1.0, foot[1] - 0.03, foot[2]], [foot[0] * 0.985, foot[1] + 0.035, lerp(foot[2], AX, 0.015)], 0.036, KNOT, 0, 1, 1);      // the knot at the foot
  }
  seg([0, HOOK_Y - 0.17, AX], [0, HOOK_Y - 0.05, AX], 0.055, KNOT, 0, 0.05, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aOther', new THREE.Float32BufferAttribute(O, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4)); g.setAttribute('aAl', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.3, AX), 2.4);
  // the hemp in the look's sun and in its shade (the rule of the cord): from the look's own sun and sky, once
  const H = lin(HEMP), sn = U.uSunC.value, sk = U.uSkyC.value;
  const uCordSun = { value: new THREE.Color().setRGB(H[0] * (sn.r + sk.r), H[1] * (sn.g + sk.g), H[2] * (sn.b + sk.b)) };
  const uCordShade = { value: new THREE.Color().setRGB(H[0] * (HEMP_SHADE_SUN * sn.r + HEMP_SHADE_SKY * sk.r), H[1] * (HEMP_SHADE_SUN * sn.g + HEMP_SHADE_SKY * sk.g), H[2] * (HEMP_SHADE_SUN * sn.b + HEMP_SHADE_SKY * sk.b)) };
  const base = () => ({ ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uBufH: U.uBufH, uTime: U.uTime, uSunD: U.uSunD, uCordSun, uCordShade });
  const cordMat = new THREE.ShaderMaterial({ uniforms: base(), vertexColors: true, fog: true, side: THREE.DoubleSide, vertexShader: CORD_VERT, fragmentShader: CORD_FRAG });
  const cords = new THREE.Mesh(g, cordMat); cords.name = 'net'; cords.frustumCulled = false;
  // the iron hook, its eye 0.34 m over the cords' meeting
  const b = new S.Builder(512);
  b.col(C.iron, 0.8, 1.2).surf(0);
  b.tube([[0, HOOK_Y + 0.34, AX], [0, HOOK_Y + 0.1, AX], [0.012, HOOK_Y + 0.03, AX], [0.05, HOOK_Y - 0.035, AX], [0.105, HOOK_Y - 0.04, AX], [0.145, HOOK_Y, AX], [0.15, HOOK_Y + 0.06, AX], [0.13, HOOK_Y + 0.1, AX]], (t) => 0.0125 * (1 - 0.5 * t * t * t), 6);
  b.lathe(0, HOOK_Y + 0.34, AX, [[0.012, 0], [0.03, 0.02], [0.03, 0.05], [0.012, 0.07]], 8, {});
  const solid = new THREE.Mesh(b.toGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); solid.name = 'hook'; solid.castShadow = true; solid.frustumCulled = false;
  // the great rope: 5 cm, from the hook's eye to the block, two splices (7 cm) 14 and 41 m above the hook; stations by metres above the hook
  const RP = [], RC = [], RW = [], RI = [], stations = [0, 0.5, 1, 2, 4, 8, 13.5, 13.7, 14.3, 14.5, 20, 30, 40.5, 40.7, 41.3, 41.5, 60, 100, 160, 240, 330];
  stations.forEach((d, i) => { const splice = (d > 13.6 && d < 14.4) || (d > 40.6 && d < 41.4), tone = grey(splice ? 0.82 : 1);
    for (const sd of [-1, 1]) { RP.push(0, d, 0); RC.push(tone[0], tone[1], tone[2]); RW.push(sd, (splice ? 1.4 : 1) * ROPE / 2, 1.5); }
    if (i) { const a = (i - 1) * 2; RI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(RP, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(RC, 3)); rg.setAttribute('aW', new THREE.Float32BufferAttribute(RW, 3)); rg.setIndex(RI);
  const uHook = { value: new THREE.Vector3() }, uBlock = { value: new THREE.Vector3(BLOCK[0], BLOCK[1], BLOCK[2]) };
  const rope = new THREE.Mesh(rg, new THREE.ShaderMaterial({ uniforms: { ...base(), uHook, uBlock }, vertexColors: true, fog: true, side: THREE.DoubleSide, vertexShader: ROPE_VERT, fragmentShader: CORD_FRAG }));
  rope.name = 'rope'; rope.frustumCulled = false;
  // our shadow's stand-ins (drawn only into the light's map): the bundle, and the line above it
  const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const bundle = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), ghost); bundle.scale.set(0.75, 0.7, 0.75); bundle.position.set(0, -0.3, AX); bundle.castShadow = true; bundle.frustumCulled = false;
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.3, 60, 0.3).translate(0, 30, 0), ghost); line.castShadow = true; line.frustumCulled = false; line.name = 'rope-shadow';
  const group = new THREE.Group(); group.name = 'mount'; group.add(cords, solid, bundle);
  return { group, rope, line, uHook, feet, triangles: I.length / 3 + b.triangles + RI.length / 3 + 12 + 96 };
}

// ---------- LIFE in the air: every bird on a closed course of its own ----------
// A course: pos(a) = C + cos(a) P + sin(a) Q + sin(2a + psi) R, a = w t + phase. The same rule runs in the shader (the birds) and in
// the clear-air count (courseAt below). Streams by kind; each bird's dice are its own.
const browLean = (y) => (y > 200 ? 7.9 * Math.pow((y - 200) / 40, 1.6) : 0);
function dealBirds(st, F) {
  const L = [], add = (o) => L.push({ R: [0, 0, 0], psi: 0, head: -9, glide: 0, ...o });
  // crag martins and alpine swifts: three parties of 30 along the face, 1 to 5 m out from the rock, where the gaze meets it (order T7):
  // one low before us as we swing in (y 26), one along the face beyond the hermit's cave (y 46), one under the brow beside the hatch bay (y <= 226)
  const rm = st('martins'), parties = [[26, 12, 0, 1, 0.8, 0.8], [46, -44, 0, 0.67, 0.55, 0.67], [214, 23, 1, 0.5, 0.55, 1]];      // y, z, under the brow, and the shares of the party's spread along z, of its swing along z and of its swing in height
  for (const [py, pz, brow, kz, kp, kq] of parties) for (let i = 0; i < 30; i++) {
    const swift = rm.chance(0.4), yc = py + rm.range(-3, 3), zc = pz + rm.range(-6, 6) * kz, out = rm.range(2.2, 3.8), pzA = rm.range(8, brow ? 14 : 22) * rm.sign() * kp, qy = rm.range(3, 9) * kq, ro = rm.range(0, 1), per = rm.range(5, 9), ph = rm.range(0, TAU), psi = rm.range(0, TAU);
    const slope = brow ? 7.9 * 1.6 / 40 * Math.pow((yc - 200) / 40, 0.6) : 0, top = brow ? Math.min(qy, 226 - yc) : qy;
    add({ kind: swift ? 'swift' : 'martin', C: [browLean(yc) + out, yc, zc], P: [0, 0, pzA], Q: [slope * top, top, 0], R: [ro, 0, 0], w: TAU / per, phase: ph, psi, span: swift ? 0.55 : 0.33,
      flap: swift ? 16 : 21, amp: 0.75, glide: 0.6, body: swift ? '#5a4a3c' : '#6b5e52', under: swift ? '#e8e2d6' : '#c9b9a0', tip: swift ? '#2f2722' : '#3d352f' });
  }
  // five pale vultures in ONE column of rising air that stands over the hollow off the pillar's open side (a place of the land, dealt from
  // the stream: its foot 73 to 83 m out from the haul's axis along x, z -25 to 5): each soars on a level ring of 13 to 17 m whose centre lies
  // within 6 m of the column, each in its own fifth of the heights from 93 to 187 m, all turning the same way. By these bounds no ring's
  // reach comes within 21 m of the flown line on any seed (a ring's centre has x >= 84; the line above y 70 has x <= 44.6; reach 18.3 m)
  const rv = st('vultures'), vx = HAUL[0] + rv.range(73, 83), vz = rv.range(-25, 5), dir = rv.sign();
  for (let i = 0; i < 5; i++) {
    const rr = rv.range(13, 17), ph = rv.range(0, TAU), psi = rv.range(0, TAU);
    add({ kind: 'vulture', C: [vx + rv.range(-6, 6), 93 + 18.8 * (i + rv.range(0, 1)), vz + rv.range(-6, 6)], P: [rr, 0, 0], Q: [0, 0, rr * dir], R: [0, 3, 0], w: 0.5, phase: ph, psi, span: 2.6, flap: 1.1, amp: 0.07, bank: 0.3, body: '#b9a57e', under: '#a08c68', tip: '#2b2622' });
  }
  // sixteen jackdaws tumbling in figures about the tower's top
  const rj = st('jackdaws');
  for (let i = 0; i < 16; i++) {
    const c = [2 + rj.range(-2, 2), 271 + rj.range(-1.5, 1.5), 35 + rj.range(-3, 3)], pz = rj.range(6, 11) * rj.sign(), qx = rj.range(4, 7), ru = rj.range(2, 3.5), per = rj.range(7, 11), ph = rj.range(0, TAU), psi = rj.range(0, TAU);
    add({ kind: 'jackdaw', C: c, P: [0, 0, pz], Q: [qx, 0, 0], R: [0, ru, 0], w: TAU / per, phase: ph, psi, span: 0.7, flap: 15, amp: 0.6, glide: 0.35, body: '#1c1c20', under: '#2a2a30', tip: '#101012' });
  }
  // the kestrel, hovering head to wind over the knoll's flank
  const rk = st('kestrel');
  add({ kind: 'kestrel', C: [84, 17, 34], P: [0.4, 0, 0], Q: [0, 0, 0.3], R: [0, 0.2, 0], w: 0.5, phase: rk.range(0, TAU), psi: rk.range(0, TAU), span: 0.75, flap: 31, amp: 0.55, head: Math.atan2(SE[0], SE[1]), body: '#9a5a34', under: '#d9c3a0', tip: '#2a2420' });
  return L;
}
const courseAt = (b, a, out) => { const c = Math.cos(a), s = Math.sin(a), q = Math.sin(2 * a + b.psi);
  out[0] = b.C[0] + c * b.P[0] + s * b.Q[0] + q * b.R[0]; out[1] = b.C[1] + c * b.P[1] + s * b.Q[1] + q * b.R[1]; out[2] = b.C[2] + c * b.P[2] + s * b.Q[2] + q * b.R[2]; return out; };
function makeBirds(env) {
  const { st, U } = env, L = dealBirds(st, env.F), n = L.length;
  // one small bird, span 2 across x, nose to +z: a spindle body, two swept wings of three pieces, a tail. aBd = (wing 0..1 signed, part)
  const P = [], N = [], B = [];
  const tri = (a, b, c, wing) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
    for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); N.push(nx / l, ny / l, nz / l); B.push(wing ? p[0] : 0, wing ? 1 : 0); } };
  const ring = [[0.085, 0, 0.06], [0, 0.085, 0.06], [-0.085, 0, 0.06], [0, -0.07, 0.06]], nose = [0, 0, 0.42], tail = [0, 0.01, -0.36];
  for (let i = 0; i < 4; i++) { const a = ring[i], b = ring[(i + 1) % 4]; tri(nose, b, a, 0); tri(tail, a, b, 0); }
  tri([0, 0.01, -0.3], [0.1, 0.01, -0.6], [-0.1, 0.01, -0.6], 0);
  for (const s of [1, -1]) { const a = [0.07 * s, 0.03, 0.2], b = [0.07 * s, 0.03, -0.12], c = [0.52 * s, 0.03, 0.14], d = [0.5 * s, 0.03, -0.1], e = [s, 0.03, -0.16], f = [0.8 * s, 0.03, 0.02];
    if (s > 0) { tri(a, c, b, 1); tri(b, c, d, 1); tri(c, f, d, 1); tri(f, e, d, 1); } else { tri(a, b, c, 1); tri(b, d, c, 1); tri(c, d, f, 1); tri(f, d, e, 1); } }
  const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aBd', new THREE.Float32BufferAttribute(B, 2));
  const iA = (name, size, fn) => { const a = new Float32Array(n * size); L.forEach((b, i) => a.set(fn(b), i * size)); g.setAttribute(name, new THREE.InstancedBufferAttribute(a, size)); };
  iA('iC', 3, (b) => b.C); iA('iP', 3, (b) => b.P); iA('iQ', 3, (b) => b.Q); iA('iR', 3, (b) => b.R);
  iA('iA', 4, (b) => [b.w, b.phase, b.psi, b.span * 0.5]); iA('iK', 4, (b) => [b.flap, b.amp, b.glide, b.head]);
  iA('iCol', 3, (b) => lin(b.body)); iA('iTip', 3, (b) => lin(b.tip)); iA('iUnder', 4, (b) => [...lin(b.under), b.bank || 0]);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(30, 130, 0), 400);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: U.uTime, uSunD: U.uSunD, uSunC: U.uSunC, uSkyC: U.uSkyC }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aBd; attribute vec3 iC, iP, iQ, iR, iCol, iTip; attribute vec4 iA, iK, iUnder; uniform float uTime; varying vec3 vN, vCol, vUnder;
      #include <fog_pars_vertex>
      void main() {
        float a = iA.x * uTime + iA.y, c = cos(a), s = sin(a), q = sin(2. * a + iA.z);
        vec3 pos = iC + c * iP + s * iQ + q * iR, vel = -s * iP + c * iQ + 2. * cos(2. * a + iA.z) * iR, acc = -c * iP - s * iQ;
        vec3 f = iK.w > -8. ? vec3(sin(iK.w), 0., cos(iK.w)) : normalize(vel + vec3(0., 0., 1e-5));
        vec3 up = normalize(vec3(0., 1., 0.) + iUnder.w * normalize(acc + vec3(1e-5, 0., 0.)));
        vec3 rt = normalize(cross(up, f)); up = cross(f, rt);
        // the wings: beats in bursts, glides between (glide = share of the time spent gliding); a soaring bird holds a shallow V
        float beat = sin(uTime * iK.x + iA.y * 7.), burst = smoothstep(-.2, .2, sin(uTime * .9 + iA.y * 3.) - (iK.z * 2. - 1.));
        float th = aBd.y * (iK.y * beat * mix(1., burst, step(.01, iK.z)) + .12);
        vec3 p = position; float w = abs(p.x); p.y += aBd.y * w * sin(th); p.x = sign(p.x) * mix(w, w * cos(th), aBd.y);
        vec3 n = normal; if (aBd.y > .5) n = normalize(vec3(-sign(position.x) * sin(th), cos(th), 0.));
        vec3 wp = pos + (rt * p.x + up * p.y + f * p.z) * iA.w;
        vN = rt * n.x + up * n.y + f * n.z; vCol = mix(iCol, iTip, aBd.y * smoothstep(.45, .8, abs(aBd.x))); vUnder = mix(iUnder.rgb, iTip, aBd.y * smoothstep(.6, .9, abs(aBd.x)));
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunD, uSunC, uSkyC; varying vec3 vN, vCol, vUnder;
      #include <fog_pars_fragment>
      void main() {
        vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.); float under = 1. - smoothstep(-.15, .15, n.y);
        vec3 col = mix(vCol, vUnder, under) * (uSkyC * (1. + .3 * n.y) + uSunC * max(dot(n, uSunD), 0.) + uSunC * .12 * under);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'birds'; mesh.frustumCulled = false;
  return { mesh, list: L, triangles: n * (P.length / 9) };
}

// ---------- LIFE on the ground: mules and drivers on the track's lane, the flock in its pasture ----------
// The lane is a closed loop along the track's open stretch (up one side, down the other, a turn at each end), every 0.5 m, on the ground.
function makeLane(heightAt) {
  const T0 = trackLine(2), up = [], down = [], n = T0.length, off = 0.7;
  for (let i = 0; i < n; i++) { const o = T0[Math.max(0, i - 1)], q = T0[Math.min(n - 1, i + 1)], dx = q[0] - o[0], dz = q[1] - o[1], l = Math.hypot(dx, dz) || 1; up.push([T0[i][0] - dz / l * off, T0[i][1] + dx / l * off]); down.push([T0[i][0] + dz / l * off, T0[i][1] - dx / l * off]); }
  const turn = (a, b) => { const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, a0 = Math.atan2(a[1] - cz, a[0] - cx), out = []; for (let k = 1; k < 6; k++) { const an = a0 - Math.PI * k / 6; out.push([cx + off * Math.cos(an), cz + off * Math.sin(an)]); } return out; };
  const loop = [...up, ...turn(up[n - 1], down[n - 1]), ...down.reverse(), ...turn(down[n - 1], up[0])], acc = [0];
  for (let i = 0; i < loop.length; i++) { const a = loop[i], b = loop[(i + 1) % loop.length]; acc.push(acc[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = acc[loop.length], N = Math.round(L / 0.5), pts = new Float32Array(N * 4);
  for (let k = 0, i = 0; k < N; k++) { const d = L * k / N; while (acc[i + 1] < d) i++; const a = loop[i], b = loop[(i + 1) % loop.length], t = (d - acc[i]) / (acc[i + 1] - acc[i]), x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
    pts[k * 4] = x; pts[k * 4 + 1] = heightAt(x, z) + 0.27; pts[k * 4 + 2] = z; }
  const at = (d, out) => { const f = (((d / L) % 1) + 1) % 1 * N, i = Math.floor(f) % N, j = (i + 1) % N, t = f - Math.floor(f); out[0] = lerp(pts[i * 4], pts[j * 4], t); out[1] = lerp(pts[i * 4 + 1], pts[j * 4 + 1], t); out[2] = lerp(pts[i * 4 + 2], pts[j * 4 + 2], t); return out; };
  return { L, N, pts, at };
}
function dealWalkers(st, look, heightAt, lane) {
  const L = [], rm = st('mules'), o0 = rm.range(0, lane.L), coats = ['#5a4636', '#6b5a48', '#7a746c', '#4a3a2e'];
  const nA = Math.ceil(look.mules / 2);
  for (let i = 0; i < look.mules; i++) { const second = i >= nA, k = second ? i - nA : i, tone = rm.int(0, 3), ph = rm.range(0, TAU), sz = rm.range(1.75, 1.95);
    L.push({ kind: 'mule', lane: 1, a0: o0 + (second ? lane.L / 2 : 0) - k * 3.2, rate: 1.2, lat: 0, size: sz, stride: 1.25, col: coats[tone], col2: '#D8C7A4', load: 1, ph }); }
  for (const second of [0, 1]) { const k = second ? look.mules - nA : nA; if (k) L.push({ kind: 'driver', human: 1, lane: 1, a0: o0 + (second ? lane.L / 2 : 0) - k * 3.2 - 1.2, rate: 1.2, lat: 0.25, size: 1.68, stride: 1.4, col: second ? '#8d7f66' : '#6f6654', col2: '#6b4a34', ph: rm.range(0, TAU) }); }
  // the flock: eighty sheep and goats ambling small rings in the pasture beyond the knoll, the shepherd, the dog on its round
  const rf = st('flock'), G = (x, z) => [(heightAt(x + 1.5, z) - heightAt(x - 1.5, z)) / 3, (heightAt(x, z + 1.5) - heightAt(x, z - 1.5)) / 3];
  for (let i = 0; i < 80; i++) { const a = rf.range(0, TAU), d = 36 * Math.sqrt(rf()), rr = rf.range(0.6, 2), per = rf.range(40, 90) * rf.sign(), ph = rf.range(0, TAU), goat = rf.chance(0.25), sz = rf.range(0.9, 1.12), tone = rf.range(0.8, 1.05);
    const x = PASTURE[0] + d * Math.cos(a), z = PASTURE[1] + d * Math.sin(a), c = goat ? new THREE.Color(rf.chance(0.5) ? '#3a3028' : '#6a5a48') : new THREE.Color('#c9c1ad').multiplyScalar(tone);
    L.push({ kind: goat ? 'goat' : 'sheep', C: [x, heightAt(x, z), z], g: G(x, z), a0: ph, rate: TAU / per, rad: rr, ratio: 1, size: sz * (goat ? 0.95 : 1), stride: 0.6, col: '#' + c.getHexString(), col2: '#2a2622', drop: goat ? 0.12 : 0.3, wide: goat ? 0.85 : 1.25, ph }); }
  { const x = PASTURE[0] - 30, z = PASTURE[1] - 16; L.push({ kind: 'shepherd', human: 1, C: [x, heightAt(x, z), z], g: [0, 0], a0: rf.range(0, TAU), rate: 0.05, rad: 0.05, ratio: 1, size: 1.72, stride: 1.4, col: '#5a4c3a', col2: '#c9c1ad', staff: 1, ph: 0 }); }
  { const x = PASTURE[0], z = PASTURE[1]; L.push({ kind: 'dog', C: [x, heightAt(x, z), z], g: G(x, z), a0: rf.range(0, TAU), rate: TAU / 40, rad: 13, ratio: 0.54, size: 0.8, stride: 0.9, col: '#a08060', col2: '#2a2622', drop: 0, wide: 0.8, ph: 0 }); }
  return L;
}
// where a walker is at world time t (the same rule as the shader's): for the clear-air count
const walkerAt = (w, lane, t, out) => { if (w.lane) { lane.at(w.a0 + w.rate * t, out); return out; } const a = w.a0 + w.rate * t, dx = w.rad * Math.cos(a), dz = w.rad * w.ratio * Math.sin(a); out[0] = w.C[0] + dx; out[1] = w.C[1] + w.g[0] * dx + w.g[1] * dz; out[2] = w.C[2] + dz; return out; };
const WALK_VERT = /* glsl */`
  attribute vec4 aPt; attribute vec4 iW, iPl, iG, iH; attribute vec3 iCol, iCol2; uniform sampler2D tLane; uniform float uLaneL, uLaneN, uTime; varying vec3 vN, vCol;
  #include <fog_pars_vertex>
  vec3 lanePos(float s) { float f = fract(s / uLaneL) * uLaneN, i = floor(f); return mix(texelFetch(tLane, ivec2(int(mod(i, uLaneN)), 0), 0).xyz, texelFetch(tLane, ivec2(int(mod(i + 1., uLaneN)), 0), 0).xyz, f - i); }
  void main() {
    vec3 pos, f; float gait;
    if (iPl.w < .5) { float s = iW.x + iW.y * uTime; pos = lanePos(s); f = lanePos(s + .9) - pos; gait = s * 6.2832 / iG.z; }
    else { float a = iW.x + iW.y * uTime; vec2 d = iW.z * vec2(cos(a), iG.w * sin(a)); pos = iPl.xyz + vec3(d.x, iG.x * d.x + iG.y * d.y, d.y);
      vec2 v = vec2(-sin(a), iG.w * cos(a)) * sign(iW.y); f = vec3(v.x, iG.x * v.x + iG.y * v.y, v.y); gait = a * iW.z * 6.2832 / iG.z; }
    if (iH.w > .5) f.y = 0.;                                               // people stand upright on a slope; beasts lean with it
    f = normalize(f + vec3(0., 0., 1e-5)); vec3 rt = normalize(cross(vec3(0., 1., 0.), f)), up = cross(f, rt);
    if (iPl.w < .5) pos += rt * iW.z;
    vec3 p = position; vec3 n = normal;
    p.x *= iH.y;
    if (aPt.z > .5 && aPt.z < 1.5) p = mix(vec3(0., .62, 0.), p, iH.z);                                   // the load: only a pack beast carries one
    if (aPt.z > 1.5 && aPt.z < 2.5) { float dr = iH.x * (.75 + .25 * sin(uTime * .21 + iW.x * 5.)); p.y -= dr * (p.z - .3) * 1.5; p.z -= dr * .12; }   // head and neck: down to graze
    if (aPt.x > .001) { float sw = aPt.y * .45 * sin(gait) * min(1., abs(iW.y) * (iPl.w < .5 ? 1. : iW.z) * 4.), dy = aPt.x - p.y; p.z += sin(sw) * dy; p.y = aPt.x - cos(sw) * dy; }   // a leg swings from its hip
    p.y += .02 * abs(sin(gait)) * iH.w;
    vec3 wp = pos + (rt * p.x + up * p.y + f * p.z) * iW.w;
    vN = rt * n.x + up * n.y + f * n.z; vCol = aPt.w < .5 ? iCol : aPt.w < 1.5 ? iCol2 : aPt.w < 2.5 ? vec3(.38, .22, .13) : vec3(.03, .028, .026);
    vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const WALK_FRAG = /* glsl */`
  uniform vec3 uSunD, uSunC, uSkyC; varying vec3 vN, vCol;
  #include <fog_pars_fragment>
  void main() { vec3 n = normalize(vN); gl_FragColor = vec4(vCol * (uSkyC * (1. + .3 * n.y) + uSunC * max(dot(n, uSunD), 0.)), 1.);
    #include <fog_fragment>
  }`;
function makeWalkers(env, terrain) {
  const { st, look, U } = env, H = (x, z) => terrain.surfaceAt(x, z), lane = makeLane(H), list = dealWalkers(st, look, H, lane);
  const tex = new THREE.DataTexture(lane.pts, lane.N, 1, THREE.RGBAFormat, THREE.FloatType); tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uTime: U.uTime, uSunD: U.uSunD, uSunC: U.uSunC, uSkyC: U.uSkyC, tLane: { value: tex }, uLaneL: { value: lane.L }, uLaneN: { value: lane.N } },
    fog: true, vertexShader: WALK_VERT, fragmentShader: WALK_FRAG });
  // a base figure: a Builder's boxes, each run of vertices marked (hip height, swing sign, part 0 body / 1 load / 2 head, colour slot)
  const figureGeo = (make) => { const b = new S.Builder(1024), marks = [], part = (hip, sw, pt, c, fn) => { const v0 = b.nv; fn(); marks.push([v0, b.nv, hip, sw, pt, c]); };
    make(b, part); const g = b.toGeometry(), n = b.nv, a = new Float32Array(n * 4); for (const m of marks) for (let i = m[0]; i < m[1]; i++) a.set([m[2], m[3], m[4], m[5]], i * 4);
    const ig = new THREE.InstancedBufferGeometry(); ig.setAttribute('position', g.attributes.position); ig.setAttribute('normal', g.attributes.normal); ig.setIndex(g.index); ig.setAttribute('aPt', new THREE.BufferAttribute(a, 4));
    ig.userData.triangles = b.triangles; return ig; };
  // a beast: unit length along z, shoulder 0.62; pack saddle and two panniers; ears; four legs that swing in diagonal pairs
  const beast = figureGeo((b, part) => {
    part(0, 0, 0, 0, () => { b.box(-0.15, 0.4, -0.5, 0.15, 0.74, 0.42, { bottom: true }); b.beam([0, 0.66, -0.5], [0, 0.42, -0.6], 0.05, 0.05); });
    part(0, 0, 2, 0, () => { b.beam([0, 0.64, 0.36], [0, 0.86, 0.62], 0.16, 0.2); b.beam([0, 0.86, 0.56], [0, 0.78, 0.86], 0.13, 0.15); for (const s of [-1, 1]) b.beam([s * 0.05, 0.9, 0.58], [s * 0.08, 1.04, 0.55], 0.035, 0.05); });
    part(0, 0, 1, 1, () => { b.box(-0.3, 0.52, -0.3, -0.15, 0.82, 0.2, { bottom: true }); b.box(0.15, 0.52, -0.3, 0.3, 0.82, 0.2, { bottom: true }); b.box(-0.17, 0.74, -0.26, 0.17, 0.92, 0.16, {}); });
    for (const [x, z, sw] of [[-0.1, 0.34, 1], [0.1, 0.34, -1], [-0.1, -0.42, -1], [0.1, -0.42, 1]]) part(0.44, sw, 0, 3, () => b.box(x - 0.04, 0, z - 0.045, x + 0.04, 0.44, z + 0.045, { top: false }));
  });
  // a walker: unit height; tunic, head, cap, two legs, a staff in the right hand
  const person = figureGeo((b, part) => {
    part(0, 0, 0, 0, () => { b.frustum(0, 0, 0.26, 0.17, 0.2, 0.13, 0.42, 0.84, {}); for (const s of [-1, 1]) b.beam([s * 0.13, 0.8, 0], [s * 0.15, 0.5, 0.03], 0.06, 0.06); });
    part(0, 0, 0, 2, () => b.box(-0.055, 0.86, -0.06, 0.055, 0.97, 0.06, {}));
    part(0, 0, 0, 1, () => { b.box(-0.065, 0.95, -0.07, 0.065, 1.0, 0.07, {}); b.beam([0.17, 0.02, 0.1], [0.17, 0.98, 0.1], 0.018, 0.018); });
    for (const [x, sw] of [[-0.055, 1], [0.055, -1]]) part(0.45, sw, 0, 3, () => b.box(x - 0.04, 0, -0.045, x + 0.04, 0.45, 0.045, { top: false }));
  });
  const fill = (geo, L) => { const n = L.length, A = (name, size, fn) => { const a = new Float32Array(n * size); L.forEach((w, i) => a.set(fn(w), i * size)); geo.setAttribute(name, new THREE.InstancedBufferAttribute(a, size)); };
    geo.instanceCount = n;
    A('iW', 4, (w) => [w.a0, w.rate, w.lane ? w.lat : w.rad, w.size]); A('iPl', 4, (w) => (w.lane ? [0, 0, 0, 0] : [w.C[0], w.C[1], w.C[2], 1])); A('iG', 4, (w) => (w.lane ? [0, 0, w.stride, 1] : [w.g[0], w.g[1], w.stride, w.ratio]));
    A('iH', 4, (w) => [w.drop || 0, w.wide || 1, w.load || 0, w.human ? 1 : 0]); A('iCol', 3, (w) => lin(w.col)); A('iCol2', 3, (w) => lin(w.col2));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(90, -15, 15), 140);
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; return m; };
  const beasts = fill(beast, list.filter((w) => !w.human)), people = fill(person, list.filter((w) => w.human)); beasts.name = 'beasts'; people.name = 'walkers';
  return { beasts, people, list, lane, tex, triangles: beast.userData.triangles * beasts.geometry.instanceCount + person.userData.triangles * people.geometry.instanceCount };
}

// ---------- the world ----------
export default {
  id: 'net-up-the-pillar',
  name: 'Monasteries on Rock Pillars',
  category: 'city',
  weirdness: 0.1,
  media: ['cable', 'air', 'open'],
  // for the sums in node (turn, clear air, looks): the same rules the build reads
  flight: { makeFlight, makePois },
  sums: { things: () => [['cave', 0, 46, -22], ['fig', 0, 66, -31], ['platform', 2, 8, -44], ['door', -3.8, 196, -44], ['garden', 1.6, 231, -50], ['gallery', 4, 241, -45], ['brow', 12, 232, 2], ['struts', 10, 230, -6.5],
    ['hatch', 17, 240, 2.7], ['ring', RING[0], RING[1], RING[2]], ['tower', 0.5, 266, 35], ['village', VILLAGE[0], -145, VILLAGE[1]], ['knoll', KNOLL[0], 0, KNOLL[1]], ...NEIGHBOURS.map((q) => [q.name + (q.mon ? '*' : ''), q.x, q.top + (q.mon ? 8 : 0), q.z])],
    headingAt, gazeAt, lookPitch, HAUL, ARTIST_TOPS, looksOf, makeGround, dealBirds, courseAt, dealTrees, dealWalkers, walkerAt, makeLane, trackLine, netAt, netRim, FEET, AX, NEIGHBOURS, TRACK, HOOK_Y },
  async build(ctx) {
    const core = ctx.core, st = (name) => core.makeRng(core.hashSeed(name + ':' + ctx.seed));
    const look = chooseLook(ctx, st), detail = (ctx.quality && ctx.quality.detail) || 1;
    await ctx.yield();
    const F = makeFlight(); await ctx.yield();
    const pois = makePois(F), scene = new THREE.Scene(), ground = makeGround(ctx, look, st);
    await ctx.yield();
    // the ground: fine under the flight, coarse on the plain; then the pillars' shade on it, by sums
    const terrain = await T.makeTerrainAsync({ rng: st('terrain'), noise: ctx.noise, height: ground.height, color: ground.color, focus: ground.focus, corridor: false, bounds: [-2800, -2600, 4200, 6000],
      cell: 4, near: 50, maxTriangles: 70000, skirt: 0, heightRange: [-190, 150], biome: 'meadow', sunDir: look.sun,
      palette: { rock: '#857f66', rockB: '#6f6a58', patch: look.snow ? '#e4e9f2' : '#c9b676', clouds: 0.5, cloudSize: 1100, cloudSpeed: 9, wind: [-SE[0], -SE[1]], tufts: look.snow ? 0 : 1 } }, ctx.yield);
    scene.add(terrain.object);
    { const pos = terrain.geometry.attributes.position, sh = terrain.geometry.attributes.aShade;
      for (let i = 0; i < pos.count; i++) { const k = ground.shade(pos.getX(i), pos.getY(i) + 0.5, pos.getZ(i), 'near'); if (k > 0) sh.setX(i, sh.getX(i) * (1 - 0.9 * k)); if ((i & 4095) === 4095) await ctx.yield(); } }
    await ctx.yield();
    // the great pillar and everything on it (the part), given our line, our light and our ground
    const sunLin = mul3(lin(look.sunColor), look.sunPower / Math.PI), skyLin = mul3(lin(look.fillColor), look.fillPower / Math.PI);
    const hero = await buildHero(ctx, { wet: look.wet, snow: look.snow, lamps: look.lamps, kerchiefs: look.kerchiefs, sunDir: look.sun, sunColor: sunLin, skyColor: skyLin, line: F.pts, terrain });
    scene.add(hero.object);
    if (hero.uniforms && hero.uniforms.uPilB) { const sc = lin(look.sunColor); hero.uniforms.uPilB.value.setRGB(look.rockShade[0] / (sc[0] * look.sunPower), look.rockShade[1] / (sc[1] * look.sunPower), look.rockShade[2] / (sc[2] * look.sunPower)); }      // the rock's shade is the sky's (order try 3, 2)
    hero.object.traverse((o) => { if (o.name === 'great-pillar') o.castShadow = false; });     // its own shade is baked by the part; it takes the house's shadow and ours
    await ctx.yield();
    const U = hero.uniforms, env = { st, look, ground, F, C: hero.colors, U, detail, b: new S.Builder(8192), rb: tools.makeRibbons(), mv: tools.makeMovers() };
    env.castShade = hero.castShade === true || tools.castShade === true;
    // the eleven neighbours, of the great pillar's own rock
    const pillars = [];
    for (const q of NEIGHBOURS) {
      const pl = await makePillarAsync(ctx, { x: q.x, z: q.z, footY: ground.height(q.x, q.z) - 3, topY: q.top, width: q.w, shape: q.shape, name: q.name, material: hero.rockMaterial, skirt: 14, sunDir: look.sun, built: !!q.mon });
      pl.mesh.castShadow = false; pl.spec = q; scene.add(pl.mesh); pillars.push(pl); env.pillars = pillars;
      await ctx.yield();
    }
    // their monasteries: the artist's when they are in (the lead's word and the part's export), our own otherwise; then, for either,
    // one thread of smoke from each lived-in top and the hoist's rope down the face to the ground
    const tops = [], useArtist = ARTIST_TOPS && typeof PART.makeMonastery === 'function' && typeof tools.monasteryMaterials === 'function';
    const mb = useArtist ? new S.Builder(8192) : null;                    // the artist's six and the ruin go into one mesh of ours
    for (const pl of pillars) {
      const q = pl.spec; if (!q.mon) continue;
      let top = null, own = !useArtist;
      if (useArtist) {
        const spec = { outline: pl.outline, topY: pl.topY, x: q.x, z: q.z, size: q.mon, name: q.name, sunDir: look.sun, snow: look.snow, lamps: !!look.lamps, toward: HOLLOW, footY: ground.height(q.x, q.z), ribbons: env.rb, builder: mb };
        const m = typeof PART.makeMonasteryAsync === 'function' ? await PART.makeMonasteryAsync(ctx, spec) : PART.makeMonastery(ctx, spec);
        if (m) top = { hoist: m.hoist, smoke: m.smoke, center: m.center }; else own = true;
      }
      if (own) top = ownTop(env, pl);
      await ctx.yield();
      if (!top || q.mon === 'ruin') continue;
      const hp = top.hoist && (top.hoist.position || top.hoist), sm = Array.isArray(top.smoke) ? top.smoke[0] : top.smoke, c = top.center;
      if (own && hp) env.rb.seg([hp.x, hp.y, hp.z], [hp.x, ground.height(hp.x, hp.z), hp.z], 0.06, env.C.rope, 1.5);      // the artist's hoist lays its own rope into our threads
      tops.push({ name: q.name, smoke: sm ? [sm.x, sm.y, sm.z] : c && c.isVector3 ? [c.x, pl.topY + 9, c.z] : [q.x, pl.topY + 9, q.z], far: Math.hypot(q.x - HAUL[0], q.z - HAUL[1]) });
    }
    let topTriangles = 0;
    if (mb && mb.triangles) { const mm = new THREE.Mesh(mb.toGeometry(), tools.monasteryMaterials(ctx).facades); mm.name = 'monasteries'; scene.add(mm); topTriangles = mb.triangles; }
    await ctx.yield();
    const villageAt = buildVillage(env, terrain); await ctx.yield();
    buildKnoll(env, terrain); await ctx.yield();
    const folds = buildFolds(env, terrain); await ctx.yield();
    const middle = await buildMiddle(ctx, env, terrain, folds); env.middle = middle; await ctx.yield();      // the middle ground (point 15): its deal, and the fields' walls
    const built = new THREE.Mesh(env.b.toGeometry(), hero.mats.facades); built.name = 'built-round-about'; scene.add(built);
    const movers = new THREE.Mesh(env.mv.geometry(), tools.addBounce(tools.moverMaterial(U), U, '-b')); movers.name = 'movers-round-about'; movers.frustumCulled = false; scene.add(movers);
    const ribMat = tools.ribbonMaterial(); Object.assign(ribMat.uniforms, U);
    const ribbons = new THREE.Mesh(env.rb.geometry(), ribMat); ribbons.name = 'threads'; scene.add(ribbons);
    await ctx.yield();
    // the far country
    const crowns = makeCrowns(look), fan = makeFan(terrain, ground); await ctx.yield();
    const plain = makePlain(st, look, terrain, crowns, middle); await ctx.yield();
    const river = makeRiver(look, U); await ctx.yield();
    const farShadows = makeFarShadows(env, terrain); scene.add(farShadows.mesh); await ctx.yield();
    const farRing = makeFarRing(ctx, st, look), sea = makeSea(ctx, look, U);
    fan.name = 'fan'; plain.fields.name = 'fields'; river.mesh.name = 'river'; farRing.mesh.name = 'far-ring';
    scene.add(fan, plain.fields, river.mesh, farRing.mesh, sea.mesh);
    await ctx.yield();
    const heaven = await makeHeaven(ctx, env, scene);
    heaven.rig.sun.target.position.set(8, 110, 0); heaven.rig.update(0, 0, null);              // the light's box stands on the haul face, whole
    scene.add(heaven.sky.object, heaven.rig.object, heaven.clouds.object, heaven.cirrus.mesh); if (heaven.shower) scene.add(heaven.shower);
    await ctx.yield();
    const trees = await makeTrees(ctx, env, terrain, F, crowns.add);
    await ctx.yield();
    addMiddleCrowns(env, terrain, crowns.add, middle);
    await ctx.yield();
    const crownMesh = crowns.mesh(new THREE.MeshBasicMaterial({ vertexColors: true }));
    trees.forest.object.name = 'trees'; trees.bushes.object.name = 'brush'; crownMesh.name = 'far-crowns';
    scene.add(trees.forest.object, trees.bushes.object, crownMesh);
    await ctx.yield();
    const blocks = makeBlocks(env, terrain); blocks.object.name = 'blocks'; scene.add(blocks.object);
    await ctx.yield();
    const mount = makeMount(env, hero); scene.add(mount.group, mount.rope, mount.line);
    await ctx.yield();
    const birds = makeBirds(env); scene.add(birds.mesh);
    await ctx.yield();
    const walkers = makeWalkers(env, terrain); scene.add(walkers.beasts, walkers.people);
    await ctx.yield();
    const air = makeAir(env, hero, U.uTime, villageAt, tops); scene.add(air.leaves.object); for (const s of air.smokes) scene.add(s.object);
    await ctx.yield();
    const pA = new THREE.Vector3(), dirV = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), blockV = new THREE.Vector3(BLOCK[0], BLOCK[1], BLOCK[2]);
    const place = (u) => {                                                 // the mount on the route: at the point of u, turned to the gaze's bearing at that metre
      const d = clamp(u, 0, 1) * F.L; F.path.posAtDist(d, pA);
      mount.group.position.copy(pA); mount.group.rotation.y = -gazeAt(F.secondsAt(d)) * DEG;      // the gaze's own bearing at that metre (a rule of the metres flown)
      const hd = mount.group.rotation.y; mount.uHook.value.set(pA.x + Math.sin(hd) * AX, pA.y + HOOK_Y + 0.41, pA.z + Math.cos(hd) * AX);
      mount.line.position.copy(mount.uHook.value); mount.line.quaternion.setFromUnitVectors(UP, dirV.copy(blockV).sub(mount.uHook.value).normalize());
    };
    place(0);
    if (ctx.renderer) await heaven.sky.prewarm(ctx.renderer, null, scene);
    const triangles = { terrain: terrain.triangles, hero: hero.triangles.total, pillars: pillars.reduce((a, p) => a + p.geometry.index.count / 3, 0), built: env.b.triangles + topTriangles, trees: trees.triangles, crowns: crowns.triangles,
      plain: plain.triangles + river.triangles + farRing.triangles + sea.triangles + farShadows.triangles + heaven.cirrus.triangles + heaven.clouds.triangles, mount: mount.triangles, birds: birds.triangles, walkers: walkers.triangles, blocks: blocks.triangles };
    return {
      scene, path: F.path, duration: 48, pace: F.pace, pois, ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 14000, sway: 0, bank: 0 },
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#fff1c8', glow: 1, blendDistance: 25 },
      post: { exposure: look.exposure, bloom: { strength: 0.25, radius: 0.5, threshold: 1.0 }, grade: { saturation: 1.04, contrast: 1, vignette: 0.2, grain: 0.01 } },      // contrast 1: at 1.03 the page showed everything under 0.035 of light as black (point 13)
      look: look.name + (look.snow ? '+snow' : ''), triangles, made: { hero, walkers, birds, air, mount, trees, folds, blocks, middle },      // for the sums and the report only
      update(dt, time, camera, u) {
        hero.update(dt, time); terrain.update(dt, time); trees.wind.update(time);
        heaven.sky.update(dt, time, camera); heaven.clouds.update(dt, time, camera);
        mount.group.visible = mount.rope.visible = mount.line.visible = !ctx.through;      // what rides with the eye is hidden while this world is the next one, seen through the portal (the guide)
        place(u);
      },
      dispose() { heaven.sky.dispose(); heaven.noiseTexture.dispose(); walkers.tex.dispose(); hero.dispose(); },
    };
  },
};
