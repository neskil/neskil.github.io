// WALKING OUT THE AIRSHIP (world "airship-shed-dawn")
// At first light a silver rigid airship 245 m long is walked out of its shed by its ground crew. Our own ship and our own shed,
// after no one named ship, builder, line, shed or country. Nothing is lettered; there is no number, flag, emblem or marking on
// hull, fins, cars, doors or shed. No fire, no accident and no hint of either. One look: first light.
//
// THE FRAME. 1 unit is 1 metre. Floor y 0, x east, z south. The doors are the north end, on the plane z -138; the back wall is
// z 207. The shed is 100 m wide at the floor and 68 m to the crown. The ship lies on the axis, its long axis 26.5 m up, nose north.
//
// THE EVENT IS KEYED TO THE FLIGHT AND TO NOTHING ELSE. With u the share of the route flown: the ship has advanced
// s = 62 u metres north (shipShift); the door leaves stand doorHalf(s) metres to either side of the axis (4 m at the start,
// rolling in two stages: 1.1 m for each metre of the ship's advance until they stand 26 m out, the ship 20 m on; they wait there while the bow's shoulder goes through, and from 36 m of advance roll on, a metre for a metre, to stand 34 m out and fully open at 44 m); the men's step is s over their stride.
// The ship starts with its nose 10 m inside the doors; it is 52 m out at the end. So every visit meets the same thing at the same
// place whatever the clock says on entry. Seen through a portal (u 0) the ship stands at its start, the doors stand a crack
// open and the men stand at their lines. Only small things run on the clock, each bounded and each far from the way by place:
// the ship riding at its lines (afloat, it surges at most 0.22 m to either side and 0.15 m up or down; the hull ends of its lines
// ride with it), the propellers turning over about their own shafts, the rudders and elevators swinging on their hinges (0.2
// radians at the most), the lamps on their cords and the limp wind sleeve stirring (0.3 m along x and along z at the most), the
// trees' sprays of leaves stirring (0.075 m at the most; no tree stands within 70 m of the way), each
// mote of dust drifting 0.6 m along each axis round its own place, the swallows on closed courses, a breath and a shift of
// weight in the men who stand (0.025 m at the most). And patterns that travel on the clock but move no body, only the shade of a surface or of air that stays where it
// is: the high cloud, the wisps in the mist, the rolling of the dust in the shafts, the dew's sparkle, a flicker in the ship's
// lit windows, a shiver in the hull's cloth, a light air running over the grass, the glints on trembling leaves. No timer anywhere.
//
// THE MEN (the owner's terms: plain figures without faces, none nearer than 20 m in space to the lens). KEPT BY PLACE: the men
// walk in double files at the handling lines 30.5 m out from the axis (two files a side at the forward body, two a side at the
// after body, ahead of each rail trolley), a foreman beside each of those files, in two files under the control car, and in two
// gangs ahead of the nose, on the axis; a few stand at the foot of the walls and inside the doors, and a mooring party of twelve
// waits by the mast's foot, on its south side. The way keeps high wherever a file is under it or abreast of it:
// it crosses to the port side over the hull's back; it comes down to 10 m beside the forward port engine car, in the gap between
// the after files and the forward files, and climbs away toward the hull before it nears the file ahead, which it passes 23 m
// up; it leaves the doors 36 m up, and comes down outside no nearer than 40 m west of the gangs; it passes the mooring party
// 16.6 m up and 23.8 m to their east at its nearest (28 m in space). crewPlaces() gives every
// man's place; a tool of the crew counts the least distance from the lens to any man over the whole flight (said in the
// hand-in note).
//
// BEHIND THE ENTRY (section 134): the flight begins at (12, 9, 172) heading north. The back wall of the shed stands across the
// axis 35 m behind the entry (between 30 and 60 m: named here and left). Nothing else stands within the tube behind the entry.
//
// WHAT READS THE EYE, AND WHY IT MAY (section 153): the shafts of the dawn and the indoor dust are air between the eye and a
// thing; reflections of the sky, the lamps and the opening in floor and skin, the dew's sparks, the grass against the light and
// the dust's glint read the eye's bearing as light does; brick, sheeting, panel lines and the grain of floor and grass fade to
// their mean by the pixel's footprint on the surface; lines and dust keep a least width in pixels (a filter by footprint; update
// reads the picture's height and the projection's scale for it, never the lens's place). Nothing is placed, timed, lit, hidden or
// thinned for a still's position, a seed, a clock or the lens.
//
// THE WAY (makeRoute): THE FINS, in toward the cross of the fins, to starboard of the lower fin; THE RAFTERS, out under the
// tip of the starboard fin and up the starboard side; THE
// BACK, over the hull's back to the port side, 54 m up, the ridge of the hull below and the doors' light ahead; THE PORT
// FLANK, down the port side as the doors roll back to their first stand and the low sun comes in along the bow; THE CAR, close beside the
// forward port engine car; THE WINDOWS, along the lit promenade windows, 23 m over the forward files, the doors open on the
// field ahead and the sister ship far off in the gap; out through the doors beside the bow, 36 m up; THE
// GANGS, west along the shed's face and down, the bow, its lines and the two hauling gangs to our right, then north past the
// gangs, 44 m west of them and 10 m up; THE FIELD, north and climbing over the grass, east of the mooring mast, the mast and
// the mooring party at its foot to our left, the poplars and the sun, the sister ship coming in over them and passing west of the mast; THE HOOK, a left
// turn of 20 m radius round by the north, the sister ship beyond the mast's head, drawing away to the south-west
// (the hook is placed so: its centre follows from the mast's place, typed below, and holds for every seed), onto the ring's own
// line; THE RING, through the ring on the mast's head, 44 m up, heading due south, the shed's whole front and the bow standing
// out of it to the left of the ring, the sister ship going away to its right. About 630 m in 61 s.
//
// THE SISTER SHIP (SISTER, below): a second ship of the same build, already aloft, comes in from the north and passes west of
// the mast, 95 m up, heading south-south-west. She too is keyed to the flight and to nothing else; her axis is nowhere within
// 130 m of the way.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import { buildHero, makeShedLight, SHED, SHIP, SID, sf, strut, roofY, figureGeometry, ropeGeometry, hang, leafCards, S_STEEL, S_STEELM } from '../parts/airship-shed-dawn.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, f) => a + (b - a) * f;
const ss = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ZD = SHED.ZD, ZB = SHED.ZB, HW = SHED.HW, TAU = Math.PI * 2;
export const ADV = 62, DUR = 61, STRIDE = 1.5, SHIP0 = 28;      // SHIP0: where the ship stands at the start, metres north of its own frame (its nose 10 m inside the doors)
export const shipShift = (u) => ADV * clamp(u, 0, 1);
export const shipZ = (u) => -(SHIP0 + shipShift(u));              // the ship's frame in the world: world z is the ship's z plus this
export const doorHalf = (s) => Math.min(SHED.DW, Math.min(26, 4 + 1.1 * s) + Math.max(0, s - 36));
// THE MAST AND ITS RING: the mooring mast stands in the field 136 m out from the doors and 60 m west of the ship's line; on its
// head, 44 m up, the ring (8 m in radius) faces due south, toward the shed's west side. The way ends through the ring.
export const MASTP = [-60, ZD - 136], MASTH = 52;
// THE SISTER SHIP: a second ship of the same build (the same model drawn a second time), already aloft, comes in from the
// north over the poplars and passes west of the mast heading south-south-west, her axis 95 m up (her keel 20 m and more over the
// mast's head): far off beside the sun while our ship's bow is first seen from outside, over the poplars and past the mast as we
// cross the field, her whole length beyond the ring and drawing away as we round the hook, away south-west past the shed's
// west side at the end, the low sun on her. Like the event she is keyed to the flight and to nothing else: the middle of her hull stands at AT (x, the height of
// her axis, z) when the share flown is U0 and moves RUN metres along HEAD (x, z) for the whole flight (some 33 m a second).
// By this law her axis is nowhere nearer the way than 136 m, nor nearer the mast's head than 99 m (she passes 43 m over its
// level and 90 m to its west), nor nearer the shed than 148 m (a tool of the crew counts these from the law; her skin stands
// 20.5 m inside each figure at the most, her fins a little more).
export const SISTER = { AT: [-172, 95, -230], U0: 0.86, HEAD: [-0.349, 0.937], RUN: 2000 };
const RING = 8, RING_Y = 44, CRADLE = 10.4, HOOK_R = 20, RUN_IN = 22, GANGS = [-44, 10.5, -204];
const LEAF = { W: SHED.DW / 2, H: SHED.DH + 0.6, Z: ZD - 1.0, T: 0.7 };

// ---------------------------------------------------------------- the way
export function makeRoute() {
  const E = new THREE.Vector3(MASTP[0], RING_Y, MASTP[1]), d = new THREE.Vector3(0, 0, 1);      // the ring's own line: due south, toward the shed's west side, so that the ship stands clear to the left of the ring as we come to it
  // indoors: in to starboard of the lower fin, out under the starboard fin's tip and up to the rafters; over the hull's back to the port side; down
  // the port flank to the forward port engine car; up over the forward files and out through the doors beside the bow
  const pts = [[12, 9, 172], [12, 9, 155], [13.5, 10.5, 137], [18.5, 15, 121], [25, 23.5, 106], [30, 33, 92], [31.5, 41, 79],
    [29, 47.5, 66], [22, 51.5, 52], [11, 53.5, 38], [-2, 54, 24], [-14, 52.5, 11], [-24, 48, -2],
    [-30.5, 41, -15], [-33, 33, -28], [-32, 25, -40], [-29.5, 17.5, -51], [-27.6, 12.3, -58], [-27.2, 10.4, -64],
    [-26.6, 11.3, -71], [-25.5, 16, -78], [-25.5, 21, -86], [-25.5, 23, -96], [-25.5, 23, -108], [-24.5, 26.5, -119], [-22, 31.5, -130], [-19, 36, ZD],
    // THE GANGS: out along the shed's face to the west and down, the bow, its lines and the hauling gangs to our right, then
    // north past the gangs, 44 m west of them and 10 m up
    [-24, 34.5, -146], [-32, 31, -152], [-40, 25.5, -159], [-46, 19, -170], [-47, 13.5, -186], GANGS];
  // THE FIELD: then straight and climbing, north over the grass, to pass east of the mast; THE HOOK: a left turn HOOK_R in radius
  // round by the north that brings us back onto the ring's own line, RUN_IN metres before it. a: bearings, radians east of north.
  const a1 = Math.atan2(d.x, -d.z), F0 = E.clone().addScaledVector(d, -RUN_IN), cx = F0.x - HOOK_R * Math.cos(a1), cz = F0.z - HOOK_R * Math.sin(a1);
  const LD = Math.hypot(cx - GANGS[0], cz - GANGS[2]), a0 = Math.atan2(cx - GANGS[0], -(cz - GANGS[2])) + Math.asin(HOOK_R / LD), LJ = Math.sqrt(LD * LD - HOOK_R * HOOK_R);
  for (const f of [0.14, 0.28, 0.42, 0.56, 0.7, 0.84]) pts.push([GANGS[0] + Math.sin(a0) * LJ * f, 10.5 + 13.5 * ss(f, 0.1, 1.05), GANGS[2] - Math.cos(a0) * LJ * f]);
  const NA = 16, sweep = a0 - a1 + (a0 < a1 ? Math.PI * 2 : 0);
  for (let k = 0; k <= NA; k++) { const a = a0 - k / NA * sweep; pts.push([cx + HOOK_R * Math.cos(a), 24 + (RING_Y - 0.5 - 24) * ss(k / NA, 0, 1), cz + HOOK_R * Math.sin(a)]); }
  for (const f of [0.34, 0.67, 1]) pts.push([F0.x + d.x * RUN_IN * f, RING_Y - 0.5 * (1 - f), F0.z + d.z * RUN_IN * f]);
  return { path: makePath(pts), E, d, pts };
}

// every man's place. Walkers are given in the ship's frame (they walk with it: world z is z plus shipZ(u), that is z less 28 m and less the ship's advance), standers in
// the world's. mirror: the man holds the line at his other hand. turn: which way a stander faces (radians about y; 0 is north). free: a walker
// whose hands hold no line.
export function crewPlaces() {
  const walk = [], stand = [], jit = (i, k) => (((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1 - 0.5) * 2 * k;
  const file = (x, z0, n, dz) => { for (let i = 0; i < n; i++) for (const row of [-1, 1]) walk.push({ x: x + row * 0.45 + jit(walk.length, 0.1), z: z0 - i * dz + jit(walk.length + 500, 0.2), mirror: row > 0 }); };
  for (const z0 of [-38, -51]) for (const s of [-1, 1]) file(s * 30.5, z0 - 0.5, 10, 1.12);      // the forward side lines, 30.5 m out
  for (const z0 of [36, 96]) for (const s of [-1, 1]) file(s * 30.5, z0 - 4.5, 8, 1.12);          // the after lines, ahead of each rail trolley
  for (const s of [-1, 1]) file(s * 5, -71.8, 8, 1.15);                                          // the control car's lines, under the forward body
  for (const s of [-1, 1]) file(s * 1.6, -106, 18, 1.0);                                         // the two bow gangs, ahead of the nose on the axis
  // a foreman walks beside each side file, on its inner hand, 2.5 m from it (the forward ones pass through the doors and keep
  // clear of the leaves; the after ones walk 9 m ahead of their trolley and 1.3 m inside its line)
  for (const z0 of [-38, -51]) for (const s of [-1, 1]) walk.push({ x: s * 28.0 + jit(walk.length, 0.2), z: z0 - 4.5 + jit(walk.length + 500, 0.8), mirror: s > 0, free: true });
  for (const z0 of [36, 96]) for (const s of [-1, 1]) walk.push({ x: s * 28.0 + jit(walk.length, 0.2), z: z0 - 9 + jit(walk.length + 500, 0.8), mirror: s > 0, free: true });
  for (let i = 0; i < 5; i++) stand.push({ x: -45.4 + (i % 2) * 0.7, z: 114.5 + i * 1.25, turn: -Math.PI / 2 + (i - 2) * 0.12 });
  for (let i = 0; i < 5; i++) stand.push({ x: 45.2 - (i % 2) * 0.6, z: 55 + i * 1.3, turn: Math.PI / 2 + (i - 2) * 0.15 });
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) stand.push({ x: s * (41 + i * 1.1), z: ZD + 5 + (i % 2) * 1.2, turn: Math.PI - s * 0.5 });
  for (let i = 0; i < 6; i++) stand.push({ x: 45.6 - (i % 2) * 0.8, z: -44 + i * 1.2, turn: Math.PI / 2 + (i - 2.5) * 0.1 });
  for (let i = 0; i < 4; i++) stand.push({ x: -45.8 + (i % 2) * 0.7, z: -12 + i * 1.3, turn: -Math.PI / 2 + (i - 1.5) * 0.12 });
  // the mooring party waits by the mast's foot, on its south side, looking back at the ship: twelve men in a loose knot
  for (let i = 0; i < 12; i++) stand.push({ x: MASTP[0] + 0.4 + (i % 6) * 1.3 + jit(i + 900, 0.35), z: MASTP[1] + 11.6 + Math.floor(i / 6) * 1.7 + jit(i + 950, 0.4), turn: Math.PI + 0.416 + jit(i + 990, 0.3) });
  return { walk, stand };
}

// the gaze, keyed to the metres flown: [metres along the way, x, y, z, with the ship (1) or of the shed (0)]. It is one look
// the whole way: the fins; the flank in the shafts; the shed from the rafters; along the ridge of the hull's back to the
// doors; down the port flank to the doors, the dawn in them, and the men far below; an engine car; the lit windows and the open doors;
// the gangs, the field, the mast and the sun; the bow over the gangs; round by the east and the north (the gaze's points are
// set so that none passes near the lens: the look turns evenly) and west of north past the mast to the poplars and the sister
// ship coming in over them; up to her as she passes west of the mast; round by the west after her to the shed and the bow standing out of it;
// the ring.
const GAZE = [[0, 0, 28, 128, 1], [30, 6, 22, 118, 1], [56, 44, 10, 80, 1], [80, 26, 16, 40, 1], [100, 12, 22, -30, 0], [122, 10, 26, -50, 0], [150, 0, 38, -80, 0],
  [164, 0, 36, -90, 0], [190, 0, 36, -100, 0], [215, -21, 10, -100, 0], [232, -30, 6, -52, 1], [255, -17, 9, -20, 1], [282, -17, 9, -24, 1], [300, -22, 8, -44, 1],
  [322, -14, 15, -70, 1], [341, -14, 15, -80, 1], [354, -4, 12, -185, 0], [372, -1, 26, -208, 0], [392, 2, 26, -206, 0], [424, 0, 26, -88, 1], [445, 0, 26, -88, 1],
  [458, 100, 20, -230, 0], [476, -30, 20, -420, 0], [492, -105, 60, -385, 0], [508, -120, 62, -360, 0], [538, -158, 78, -265, 0], [550, -170, 78, -232, 0], [568, -150, 68, -215, 0], [592, -78, 52, -172, 0],
  [616, MASTP[0], RING_Y, MASTP[1], 0],
  [640, MASTP[0], RING_Y, MASTP[1], 0]];
export function flightPlan(R) {
  const g = new THREE.Vector3(), L = R.path.length;
  const gazeAt = (t, u) => {
    const m = u * L; let i = 0; while (i < GAZE.length - 2 && m > GAZE[i + 1][0]) i++;
    const a = GAZE[i], b = GAZE[i + 1], f = ss(m, a[0], b[0]), sz = shipZ(u);
    return g.set(lerp(a[1], b[1], f), lerp(a[2], b[2], f), lerp(a[3] + a[4] * sz, b[3] + b[4] * sz, f));
  };
  return {
    camera: { fov: 64, near: 0.3, far: 6000, lookAhead: 26, sway: 0.5, bank: 0.3 },
    pois: [{ at: gazeAt, from: -0.2, to: 1.2, weight: 0.85, fade: 0.05 }],
  };
}

// ---------------------------------------------------------------- the shed's own shapes
// the vault's cross-section at p from -1 (west eave) to 1 (east eave): the point and the way inward
function prof(p) {
  const X = (q) => HW * Math.sin(Math.PI / 2 * clamp(q, -1, 1)), x = X(p), y = roofY(x);
  const x0 = X(p - 0.012), x1 = X(p + 0.012); let tx = x1 - x0, ty = roofY(x1) - roofY(x0); const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
  return { x, y, nx: ty, ny: -tx };
}
// the shell: the walls to 14 m and the vault, its front faces inward
function shellGeometry() {
  const NS = 22, ring = [{ x: -HW, y: 0, nx: 1, ny: 0 }]; for (let i = -NS; i <= NS; i++) ring.push(prof(i / NS)); ring.push({ x: HW, y: 0, nx: -1, ny: 0 });
  const P = [], N = [], IX = [], NZ = Math.round((ZB - ZD) / 15), m = ring.length;
  for (let j = 0; j <= NZ; j++) for (const q of ring) { P.push(q.x, q.y, ZD + j * 15); N.push(q.nx, q.ny, 0); }
  for (let j = 0; j < NZ; j++) for (let k = 0; k < m - 1; k++) { const a = j * m + k, b = a + 1, c = a + m + 1, d = a + m; IX.push(a, b, c, a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(IX);
  return g;
}
// an end wall under the vault; open: with the doors' opening left out; nz: the way its front face looks
function gableGeometry(z, open, nz) {
  const P = [], N = [], IX = [];
  for (let x0 = -HW; x0 < HW - 1e-6; x0 += 2) {
    const x1 = x0 + 2, yb = open && x0 >= -SHED.DW - 1e-6 && x1 <= SHED.DW + 1e-6 ? SHED.DH : 0, base = P.length / 3;
    for (const q of [[x0, yb], [x1, yb], [x1, roofY(x1)], [x0, roofY(x0)]]) { P.push(q[0], q[1], z); N.push(0, 0, nz); }
    if (nz > 0) IX.push(base, base + 1, base + 2, base, base + 2, base + 3); else IX.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(IX);
  return g;
}
// one lattice arch rib in the plane z: two chords 2.8 m apart with a zigzag between, and its legs down the walls
function rib(b, z, c, surf) {
  const NR = 14, O = [], I = [], D = 3.1;
  for (let i = -NR; i <= NR; i++) { const q = prof(i / NR); O.push([q.x + q.nx * 0.3, q.y + q.ny * 0.3, z]); I.push([q.x + q.nx * D, q.y + q.ny * D, z]); }
  for (let i = 0; i < O.length - 1; i++) {
    strut(b, O[i], O[i + 1], 0.26, 0.8, [0, 0, 1], c, surf); strut(b, I[i], I[i + 1], 0.26, 0.8, [0, 0, 1], c, surf);
    strut(b, O[i], I[i + 1], 0.14, 0.4, [0, 0, 1], c, surf); strut(b, I[i], O[i], 0.14, 0.4, [0, 0, 1], c, surf);
  }
  strut(b, I[O.length - 1], O[O.length - 1], 0.14, 0.4, [0, 0, 1], c, surf);
  for (const s of [-1, 1]) {
    const xo = s * (HW - 0.3), xi = s * (HW - D), top = SHED.WH + 0.4;
    strut(b, [xo, 0, z], [xo, top, z], 0.26, 0.8, [0, 0, 1], c, surf); strut(b, [xi, 0, z], [xi, top, z], 0.26, 0.8, [0, 0, 1], c, surf);
    for (let k = 0; k < 4; k++) { const y0 = k * 3.6, y1 = y0 + 3.6; strut(b, [xo, y0, z], [xi, y1, z], 0.14, 0.4, [0, 0, 1], c, surf); strut(b, [xi, y1, z], [xo, y1, z], 0.14, 0.4, [0, 0, 1], c, surf); }
  }
}
// a lattice tower: four legs from half-width w0 at the foot to w1 at height h, crossed between
function tower(b, x, z, h, w0, w1, levels, c, surf) {
  const at = (k, sx, sz) => { const f = k / levels, w = lerp(w0, w1, f); return [x + sx * w, h * f, z + sz * w]; }, cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let k = 0; k < levels; k++) for (let e = 0; e < 4; e++) { const a = cs[e], n = cs[(e + 1) % 4];
    strut(b, at(k, ...a), at(k + 1, ...a), 0.16, 0.16, [1, 0, 0.01], c, surf); strut(b, at(k, ...a), at(k + 1, ...n), 0.08, 0.08, [0, 1, 0], c, surf); strut(b, at(k + 1, ...a), at(k + 1, ...n), 0.08, 0.08, [0, 1, 0], c, surf); }
}

export default {
  id: 'airship-shed-dawn',
  name: 'Walking Out the Airship',
  category: 'interior',
  weirdness: 0.1,
  media: ['interior'],
  async build(ctx) {
    const { rng } = ctx;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#141a26');
    const LT = makeShedLight(), U = LT.uniforms, matS = LT.surface(), matD = LT.surface({ side: THREE.DoubleSide });
    await ctx.yield();
    const R = makeRoute(), path = R.path;
    await ctx.yield();
    // the small things a visit deals, each from a stream of its own
    const rCloud = rng.fork('cloud'), rStand = rng.fork('stands'), rBird = rng.fork('swallows'), rBirdE = rng.fork('swallows-east'), rBirdW = rng.fork('swallows-west'), rCrate = rng.fork('crates'), rMen = rng.fork('men'), rDust = rng.fork('dust');
    U.uCloud.value.set(rCloud.range(0, 40), rCloud.range(0, 40));
    const disposables = [], poplars = [], hedgeAt = [], sister = new THREE.Group();
    const mesh = (b, mat, name, parent = scene) => { const g = b.build(); disposables.push(g); const m = new THREE.Mesh(g, mat); m.name = name; parent.add(m); return m; };

    // ------------------------------------------------------------------ the sky, the field, the far trees
    {
      const g = new THREE.SphereGeometry(2600, 40, 20); disposables.push(g);
      const sky = new THREE.Mesh(g, LT.sky()); sky.position.set(0, 0, -100); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
      await ctx.yield();
      const b = INT.makeBuilder();
      // the ground lies round the shed, not under its floor
      const G = sf(SID.GROUND, 0.3), gq = (x0, x1, z0, z1) => b.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], '#ffffff', G);
      gq(-2600, 2600, -2700, ZD); gq(-2600, 2600, ZB, 2500); gq(-2600, -HW, ZD, ZB); gq(HW, 2600, ZD, ZB);
      // a line of trees far off round the field, their feet in the mist
      const NT = 720, tr = rng.fork('trees'), rPop = rng.fork('poplars'), rClump = rng.fork('clumps'), ph = [tr.range(0, TAU), tr.range(0, TAU), tr.range(0, TAU)];
      const rim = (i) => { const a = i / NT * TAU, r = 560 + 70 * Math.sin(a * 3 + ph[0]) + 40 * Math.sin(a * 7 + ph[1]);
        const h = 8 + 2.5 * Math.sin(a * 9 + ph[2]) + 2.2 * Math.sin(a * 47 + ph[0]) + 1.3 * Math.sin(a * 113 + ph[1]) + 0.8 * Math.sin(a * 271 + ph[2]); return [Math.sin(a) * r, h, -100 + Math.cos(a) * r]; };
      for (let i = 0; i < NT; i++) { if (i % 120 === 119) await ctx.yield(); const p = rim(i), q = rim(i + 1); b.quad([q[0], -1, q[2]], [p[0], -1, p[2]], [p[0], p[1], p[2]], [q[0], q[1], q[2]], '#0b110c', sf(SID.PLAIN, 0.02)); }
      mesh(b, matS, 'field').frustumCulled = false;
      await ctx.yield();
      // nearer: a lane of poplars across the north of the field, five clumps of trees standing out of the mist round it, and
      // two hedgerows. A crown is a dark heart of a few lobes (each a sphere pushed in and out by a pattern of its own) under
      // sprays of leaves: cards, each cut to a ragged clump, that stand out of it and make its outline.
      const S_LEAF = sf(SID.LEAF, 0.05), TRUNK = sf(SID.PLAIN, 0.03), bt = INT.makeBuilder(), cards = leafCards(), _v = new THREE.Vector3();
      const lobe = (x, y, z, sx, sy, sz, k, c, ry = 0, fine = true) => {
        const g = fine ? new THREE.SphereGeometry(1, 12, 8) : new THREE.SphereGeometry(1, 8, 5), P = g.attributes.position;
        for (let i = 0; i < P.count; i++) { _v.fromBufferAttribute(P, i).normalize();
          const w = 1 + 0.13 * Math.sin(_v.x * 5.1 + k) * Math.sin(_v.y * 4.3 + k * 1.7) * Math.sin(_v.z * 4.7 + k * 0.6) + 0.08 * Math.sin(_v.x * 11.3 + k * 2.1) * Math.sin(_v.z * 10.1 + k) + 0.05 * Math.sin(_v.y * 13.7 + k * 3.3);
          P.setXYZ(i, _v.x * w, _v.y * w, _v.z * w); }
        g.computeVertexNormals(); bt.add(g, { p: [x, y, z], s: [sx, sy, sz], r: [0, ry, 0], c, surf: S_LEAF });
      };
      // a spray on a crown: at the point `at`, where the crown's face looks along (ox, oy, oz); it reaches up and outward
      const spray = (r, at, ox, oy, oz, hw, hh, rise) => {
        const l = Math.hypot(ox, oy, oz) || 1; ox /= l; oy /= l; oz /= l;
        let ux = ox * (1 - rise), uy = rise + oy * (1 - rise), uz = oz * (1 - rise); ux += r.range(-0.35, 0.35); uy += r.range(-0.2, 0.2); uz += r.range(-0.35, 0.35);
        const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
        let ax = r.range(-1, 1), ay = r.range(-0.3, 0.3), az = r.range(-1, 1); const d = ax * ux + ay * uy + az * uz; ax -= ux * d; ay -= uy * d; az -= uz * d;
        const al = Math.hypot(ax, ay, az) || 1;
        cards.add(at, [ox * 0.8, oy * 0.8 + 0.35, oz * 0.8], [ax / al, ay / al, az / al], [ux, uy, uz], hw, hh, r.range(0, 1));
      };
      const GREEN = ['#2b3f1c', '#263a19', '#30461f', '#293d22'];
      // a poplar: a tall narrow flame, four lobes at its heart and a hundred and fifty small sprays that climb it, on a short stem (r: its stream)
      const poplar = (r, x, z, h, w) => {
        const k = r.range(0, 50), wl = w * 0.8;
        lobe(x, h * 0.5, z, wl, h * 0.4, wl, k, r.pick(GREEN)); lobe(x + wl * 0.25, h * 0.33, z - wl * 0.2, wl * 0.95, h * 0.25, wl * 0.95, k + 3, r.pick(GREEN));
        lobe(x - wl * 0.22, h * 0.36, z + wl * 0.24, wl * 0.85, h * 0.26, wl * 0.85, k + 5, r.pick(GREEN)); lobe(x + wl * 0.1, h * 0.72, z + wl * 0.1, wl * 0.62, h * 0.22, wl * 0.62, k + 7, r.pick(GREEN));
        for (let i = 0; i < 150; i++) { const t = r.range(0.1, 1), a = r.range(0, TAU), rr = w * 1.02 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.6) * r.range(0.86, 1.04);
          spray(r, [x + Math.cos(a) * rr, h * t, z + Math.sin(a) * rr], Math.cos(a), 0.25, Math.sin(a), r.range(0.45, 0.8) * (0.6 + 0.4 * w / 3), r.range(0.9, 1.5), 0.8); }
        bt.add(new THREE.CylinderGeometry(0.25, 0.4, h * 0.2, 6), { p: [x, h * 0.1, z], c: '#14110d', surf: TRUNK });
      };
      // a broad tree: a crown of seven lobes under a hundred and five sprays, on a trunk with two limbs (r: its stream)
      const broad = async (r, x, z, h, w) => {
        const k = r.range(0, 50), L = [[x, h * 0.66, z, w * 0.62, h * 0.27, w * 0.62]];
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + k, rr = w * (0.5 + 0.12 * Math.sin(i * 2.3 + k)), up = 0.5 + 0.14 * Math.sin(i * 1.7 + k * 2); L.push([x + Math.cos(a) * rr, h * up, z + Math.sin(a) * rr, w * 0.44, h * 0.2, w * 0.44]); }
        for (let i = 0; i < L.length; i++) { const q = L[i];
          lobe(q[0], q[1], q[2], q[3], q[4], q[5], k + i * 2, r.pick(GREEN));
          for (let j = 0; j < 15; j++) { const a = r.range(0, TAU), e = r.range(-0.35, 1), ce = Math.sqrt(Math.max(0, 1 - e * e)), ox = Math.cos(a) * ce, oz = Math.sin(a) * ce, sz = r.range(0.7, 1.25) * (0.5 + w * 0.1);
            spray(r, [q[0] + ox * q[3] * 1.12, q[1] + e * q[4] * 1.12, q[2] + oz * q[5] * 1.12], ox, e, oz, sz, sz * r.range(0.8, 1.2), 0.35); }
          if (i % 3 === 2) await ctx.yield();
        }
        bt.add(new THREE.CylinderGeometry(w * 0.07, w * 0.11, h * 0.45, 7), { p: [x, h * 0.22, z], c: '#14110d', surf: TRUNK });
        for (const sd of [-1, 1]) strut(bt, [x, h * 0.3, z], [x + sd * w * 0.4, h * 0.52, z + sd * w * 0.15], w * 0.05, w * 0.05, [0, 0, 1], '#14110d', TRUNK);
      };
      await ctx.yield();
      for (let i = 0; i < 17; i++) { const x = -215 + i * 16.5 + rPop.range(-4, 4), z = ZD - 232 + rPop.range(-3, 3) - 0.12 * i * 16.5; poplars.push([x, z]); poplar(rPop, x, z, rPop.range(15, 27), rPop.range(2.0, 3.2)); await ctx.yield(); }
      for (const [cx, cz, n] of [[-20, ZD - 330, 6], [95, ZD - 290, 5], [-300, ZD - 150, 6], [245, ZD - 215, 4], [-210, ZD - 380, 5]]) { for (let i = 0; i < n; i++) { await broad(rClump, cx + rClump.range(-22, 22), cz + rClump.range(-16, 16), rClump.range(9, 16), rClump.range(4.5, 8)); await ctx.yield(); } }
      // two hedgerows: one east of the field, one beyond the mast to the west (neither within 70 m of the way).
      // Each is one unbroken bank of thorn, a lobe every four metres or so lying along it under its
      // own sprays, with a tree standing out of it here and there
      const hd = rng.fork('hedges'), hdT = rng.fork('hedge-trees');
      for (const [x0, z0, x1, z1] of [[130, ZD - 20, 215, ZD - 330], [-190, ZD - 60, -250, ZD - 330]]) {
        const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 4.2), ry = Math.atan2(-(z1 - z0), x1 - x0), px = -(z1 - z0) / len, pz = (x1 - x0) / len;
        for (let i = 0; i < n; i++) { const f = (i + hd.range(-0.2, 0.2)) / n, off = hd.range(-0.5, 0.5), x = lerp(x0, x1, f) + px * off, z = lerp(z0, z1, f) + pz * off;
          if (hd.chance(0.07)) await broad(hdT, x, z, hdT.range(7, 11), hdT.range(3.5, 5));
          const hh = hd.range(1.7, 2.7), hl = hd.range(3.0, 3.9), hw = hd.range(1.3, 1.9); lobe(x, hh * 0.5, z, hl, hh * 0.55, hw, hd.range(0, 50), hd.pick(GREEN), ry, false); hedgeAt.push([x, z]);
          for (let j = 0; j < 7; j++) { const along = hd.range(-1, 1) * hl, side = hd.range(-1, 1); spray(hd, [x + (x1 - x0) / len * along + px * side * hw * 0.8, hh * hd.range(0.75, 1.1), z + (z1 - z0) / len * along + pz * side * hw * 0.8], px * side, 0.8, pz * side, hd.range(0.6, 1.0), hd.range(0.5, 0.9), 0.6); }
          if (i % 4 === 3) await ctx.yield(); }
        await ctx.yield();
      }
      { const g = cards.build(); disposables.push(g); const m = new THREE.Mesh(g, LT.leaves()); m.name = 'leaves'; m.frustumCulled = false; scene.add(m); }
      await ctx.yield();
      mesh(bt, matS, 'trees').frustumCulled = false;
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the shed: shell, end walls, floor
    {
      const b = INT.makeBuilder();
      b.add(shellGeometry(), { c: '#ffffff', surf: sf(SID.SHELL, 0.12) });
      b.add(gableGeometry(ZD, true, 1), { c: '#ffffff', surf: sf(SID.GABLE, 0.12) }); b.add(gableGeometry(ZB, false, -1), { c: '#ffffff', surf: sf(SID.GABLE, 0.12) });
      mesh(b, matD, 'shell');
      const f = INT.makeBuilder(); f.quad([-HW, 0, ZB], [HW, 0, ZB], [HW, 0, ZD], [-HW, 0, ZD], '#8d8982', sf(SID.FLOOR, 0.3)); mesh(f, matS, 'floor');
    }
    await ctx.yield();
    // the ribs, in runs of five, each run a mesh of its own
    const STEEL = '#2c3238', STEEL_L = '#444b52', NRIB = Math.round((ZB - ZD) / 15);
    for (let i0 = 0; i0 <= NRIB; i0 += 5) {
      const b = INT.makeBuilder();
      for (let i = i0; i < Math.min(i0 + 5, NRIB + 1); i++) { rib(b, ZD + i * 15 + (i === 0 ? 0.5 : i === NRIB ? -0.5 : 0), STEEL, S_STEELM); await ctx.yield(); }
      mesh(b, matS, 'ribs');
      await ctx.yield();
    }
    {
      // purlins under the sheeting, ties along the ribs' inner chords, the galleries, the lamps
      const b = INT.makeBuilder();
      for (const p of [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6, 0.8, -0.8, 0.93, -0.93]) { const q = prof(p); strut(b, [q.x + q.nx * 0.5, q.y + q.ny * 0.5, ZD + 0.3], [q.x + q.nx * 0.5, q.y + q.ny * 0.5, ZB - 0.3], 0.5, 0.3, [q.nx, q.ny, 0], STEEL, S_STEELM); }
      for (const p of [0, 0.36, -0.36, 0.72, -0.72]) { const q = prof(p); strut(b, [q.x + q.nx * 3.1, q.y + q.ny * 3.1, ZD + 0.3], [q.x + q.nx * 3.1, q.y + q.ny * 3.1, ZB - 0.3], 0.3, 0.3, [q.nx, q.ny, 0], STEEL, S_STEELM); }
      for (const s of [-1, 1]) {
        b.add(new THREE.BoxGeometry(1.5, 0.12, ZB - ZD - 4), { p: [s * 47.7, 22, (ZB + ZD) / 2], c: '#3a3530', surf: sf(SID.WOOD, 0.2) });
        for (const y of [22.55, 23.05]) b.add(new THREE.BoxGeometry(0.06, 0.06, ZB - ZD - 4), { p: [s * 46.95, y, (ZB + ZD) / 2], c: STEEL_L, surf: S_STEELM });
        for (let z = ZD + 4.5; z < ZB - 2; z += 7.5) b.add(new THREE.BoxGeometry(0.06, 1.05, 0.06), { p: [s * 46.95, 22.55, z], c: STEEL_L, surf: S_STEELM });
      }
      await ctx.yield();
      // the lamps: an enamel shade and a bulb on a long cord from the rib above, stirring a little
      for (let k = 0; k < SHED.LN; k++) for (const s of [-1, 1]) {
        const x = s * SHED.LX, y = SHED.LY, z = SHED.LZ0 + SHED.LDZ * k, top = roofY(x) - 3.4;
        b.add(new THREE.BoxGeometry(0.035, top - y - 0.4, 0.035), { p: [x, (top + y + 0.4) / 2, z], c: '#15171a', surf: sf(SID.PLAIN, 0.1), sway: [y, top, 1, 0] });
        b.add(new THREE.CylinderGeometry(0.1, 0.72, 0.4, 14, 1, true), { p: [x, y + 0.22, z], c: '#1d2a26', surf: sf(SID.PLAIN, 0.6, 0, 0, 1) });
        b.add(new THREE.CylinderGeometry(0.69, 0.08, 0.36, 14, 1, true), { p: [x, y + 0.22, z], c: '#ffe6bd', surf: sf(SID.PLAIN, 0.1, 0, 1.3, 1) });
        b.add(new THREE.SphereGeometry(0.13, 8, 6), { p: [x, y + 0.12, z], c: '#ffd9a0', surf: sf(SID.PLAIN, 0.1, 0, 9, 1) });
      }
      mesh(b, matS, 'roofwork');
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the doors: two leaves a side that roll apart, one past the other
    // (each 17 m wide; open, both stand before the 16 m of front wall beside the opening and reach 1 m past its corner)
    const leaves = [];
    {
      for (const s of [-1, 1]) for (const inner of [1, 0]) {
        const b = INT.makeBuilder(); b.add(new THREE.BoxGeometry(LEAF.W, LEAF.H, LEAF.T), { p: [0, LEAF.H / 2, 0], c: '#ffffff', surf: sf(SID.DOOR, 0.15) });
        // its frame stands proud of the sheet on the outer face: posts, girders, a cross in every bay (0.09 m on the leaf that
        // rolls behind the other and on the face the other shows it: the two leaves pass 0.2 m apart), and its wheels on the floor rail
        const pr = inner ? 0.5 : 0.09, zf = -LEAF.T / 2 - pr / 2, FR = '#2e3a38';
        for (const x of [-8.3, -6, 0, 6, 8.3]) b.add(new THREE.BoxGeometry(0.42, LEAF.H, pr), { p: [x, LEAF.H / 2, zf], c: FR, surf: S_STEELM });
        for (let y = 0.25; y < LEAF.H; y += 8) b.add(new THREE.BoxGeometry(LEAF.W, 0.42, pr), { p: [0, y, zf], c: FR, surf: S_STEELM });
        b.add(new THREE.BoxGeometry(LEAF.W, 0.42, pr), { p: [0, LEAF.H - 0.25, zf], c: FR, surf: S_STEELM });
        for (const [xa, xb] of [[-6, 0], [0, 6]]) for (let y = 0.25; y < 24; y += 8) { strut(b, [xa, y, zf], [xb, y + 8, zf], 0.2, pr * 0.6, [0, 0, 1], FR, S_STEELM); strut(b, [xb, y, zf], [xa, y + 8, zf], 0.2, pr * 0.6, [0, 0, 1], FR, S_STEELM); }
        for (const x of [-6.5, 0, 6.5]) b.add(new THREE.BoxGeometry(1.6, 0.7, LEAF.T + 0.1), { p: [x, 0.35, 0], c: '#3a3f44', surf: S_STEEL });      // (0.8 m deep: the two leaves' wheel boxes pass 0.1 m apart)
        // and on the face toward the shed: posts and girders (shallow on the leaf that rolls before the other)
        const pi = inner ? 0.09 : 0.3, zi = LEAF.T / 2 + pi / 2, FI = '#59666a';
        for (const x of [-8.3, -6, 0, 6, 8.3]) b.add(new THREE.BoxGeometry(0.36, LEAF.H, pi), { p: [x, LEAF.H / 2, zi], c: FI, surf: S_STEELM });
        for (let y = 0.25; y < LEAF.H; y += 8) b.add(new THREE.BoxGeometry(LEAF.W, 0.36, pi), { p: [0, y, zi], c: FI, surf: S_STEELM });
        for (const [xa, xb] of [[-6, 0], [0, 6]]) for (let y = 0.25; y < 24; y += 8) { strut(b, [xa, y, zi], [xb, y + 8, zi], 0.16, pi * 0.6, [0, 0, 1], FI, S_STEELM); strut(b, [xb, y, zi], [xa, y + 8, zi], 0.16, pi * 0.6, [0, 0, 1], FI, S_STEELM); }
        await ctx.yield();
        const m = mesh(b, matS, 'leaf'); m.position.set(0, 0, LEAF.Z - (inner ? 0.9 : 0)); m.userData.side = s; m.userData.inner = inner; leaves.push(m);
      }
      const b = INT.makeBuilder(), XO = HW + 2;
      // the track the leaves hang from, across the whole front (its underside on the leaves' heads), tied back to the gable where
      // the gable stands as high (within 32 m of the axis), and the leaves' rails in the floor
      b.add(new THREE.BoxGeometry(XO * 2, 2.4, 2.6), { p: [0, LEAF.H + 1.2, LEAF.Z - 0.5], c: STEEL_L, surf: S_STEELM });
      for (let x = -32; x <= 32; x += 8) strut(b, [x, LEAF.H + 2.4, LEAF.Z - 0.5], [x, LEAF.H + 4.0, ZD - 0.3], 0.3, 0.3, [1, 0, 0], STEEL_L, S_STEELM);
      for (const dz of [0, -0.9]) b.add(new THREE.BoxGeometry(XO * 2, 0.06, 0.4), { p: [0, 0.0, LEAF.Z + dz], c: '#5b5f63', surf: sf(SID.STEEL, 0.6, 0.8) });
      await ctx.yield();
      // a long low workshop outside the west wall (its own wall 0.4 m clear of the shed's), a few of its windows lit
      const WX = -(HW + 5.7), WZ0 = -92, WZ1 = 128, rw = rng.fork('workshop');
      b.add(new THREE.BoxGeometry(10.6, 6.5, WZ1 - WZ0), { p: [WX, 3.25, (WZ0 + WZ1) / 2], c: '#6a3626', surf: sf(SID.BRICK, 0.1) });
      b.add(new THREE.BoxGeometry(11.0, 0.3, WZ1 - WZ0 + 0.8), { p: [WX - 0.3, 6.65, (WZ0 + WZ1) / 2], c: '#3c4144', surf: sf(SID.PLAIN, 0.3) });      // (a flat roof on the wall's head)
      for (let z = WZ0 + 5; z < WZ1 - 3; z += 6.5) { const lit = rw.chance(0.55); b.add(new THREE.BoxGeometry(0.1, 2.2, 3.2), { p: [WX - 5.32, 3.3, z], c: lit ? '#ffc680' : '#0c1016', surf: sf(SID.PLAIN, 0.7, 0, lit ? 1.6 : 0) }); }
      for (let x = WX - 3.5; x < WX + 4; x += 3.5) { const lit = rw.chance(0.6); b.add(new THREE.BoxGeometry(2.2, 2.2, 0.1), { p: [x, 3.3, WZ0 - 0.02], c: lit ? '#ffc680' : '#0c1016', surf: sf(SID.PLAIN, 0.7, 0, lit ? 1.6 : 0) }); }
      await ctx.yield();
      // two lattice towers carry the ends of the track, out beyond the shed's corners, each stayed to the ground
      for (const s of [-1, 1]) {
        tower(b, s * (XO + 3.4), LEAF.Z - 0.5, LEAF.H, 3.4, 1.5, 9, STEEL_L, S_STEELM);
        strut(b, [s * (XO + 3.4), LEAF.H * 0.72, LEAF.Z - 0.5], [s * (XO + 19), 0, LEAF.Z - 0.5], 0.3, 0.3, [0, 0, 1], STEEL_L, S_STEELM);
        strut(b, [s * (XO + 3.4), LEAF.H * 0.72, LEAF.Z - 0.5], [s * (XO + 3.4), 0, LEAF.Z - 19], 0.3, 0.3, [1, 0, 0], STEEL_L, S_STEELM);
        b.add(new THREE.BoxGeometry(8, 2.4, 2.6), { p: [s * (XO + 3), LEAF.H + 1.2, LEAF.Z - 0.5], c: STEEL_L, surf: S_STEELM });
      }
      mesh(b, matS, 'doorframe');
      await ctx.yield();
      // the shed's outside: a rib over the sheeting at every arch, a buttress down the wall under it (none where the workshop
      // stands against the west wall), the eaves, a lantern along the ridge
      {
        const o = INT.makeBuilder(), NO = 12, OUT = '#3a4246', S_OUT = sf(SID.STEEL, 0.15, 0.2);
        for (let i = 0; i <= NRIB; i++) {
          const z = ZD + i * 15; let q0 = prof(-1);
          for (let k = -NO + 1; k <= NO; k++) { const q = prof(k / NO); strut(o, [q0.x - q0.nx * 0.3, q0.y - q0.ny * 0.3, z], [q.x - q.nx * 0.3, q.y - q.ny * 0.3, z], 0.7, 0.6, [0, 0, 1], OUT, S_OUT); q0 = q; }
          for (const sd of [-1, 1]) if (sd > 0 || z < WZ0 - 1 || z > WZ1 + 1) o.add(new THREE.BoxGeometry(1.5, SHED.WH + 0.6, 1.3), { p: [sd * (HW + 0.75), (SHED.WH + 0.6) / 2, z], c: '#6a3626', surf: sf(SID.BRICK, 0.1) });
          if (i % 4 === 3) await ctx.yield();
        }
        for (const sd of [-1, 1]) o.add(new THREE.BoxGeometry(0.9, 0.6, ZB - ZD + 1), { p: [sd * (HW + 0.45), SHED.WH + 0.3, (ZB + ZD) / 2], c: OUT, surf: S_OUT });
        o.add(new THREE.BoxGeometry(5.2, 2.2, ZB - ZD - 6), { p: [0, SHED.HH + 1.0, (ZB + ZD) / 2], c: '#4a5458', surf: sf(SID.PLAIN, 0.2) });
        o.add(new THREE.BoxGeometry(6.6, 0.3, ZB - ZD - 5), { p: [0, SHED.HH + 2.25, (ZB + ZD) / 2], c: '#333b3f', surf: sf(SID.PLAIN, 0.3) });
        mesh(o, matS, 'outside');
      }
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the mooring mast and its ring, the wind sleeve
    {
      // the ring in its cradle (built in a frame of its own: its deck at y 0, the ring's centre CRADLE above it, facing +z);
      // it stands on the mast's head, across the last of the way. Its two towers stand 1.8 m beyond the ring's own plane, clear
      // of its tube, each holding it by an arm; a saddle carries its foot.
      const b = INT.makeBuilder(), top = CRADLE - RING - 0.7, HD = RING_Y - CRADLE, turn = Math.atan2(R.d.x, R.d.z);
      b.add(new THREE.TorusGeometry(RING + 0.42, 0.26, 10, 72), { p: [0, CRADLE, 0], c: '#59606a', surf: sf(SID.STEEL, 0.55, 0.8) });
      for (const s of [-1, 1]) {
        tower(b, s * 6.2, 1.8, 7.4, 1.5, 0.5, 4, STEEL_L, S_STEEL);
        strut(b, [s * 6.2, 7.4, 1.8], [s * (RING + 0.42) * 0.93, CRADLE - (RING + 0.42) * 0.37, 0], 0.22, 0.22, [0, 1, 0], STEEL_L, S_STEEL);
        strut(b, [s * 6.2, 0, 3.3], [s * 6.2, 0, 7.4], 0.3, 0.3, [0, 1, 0], STEEL_L, S_STEEL); strut(b, [s * 6.2, 5, 2.62], [s * 6.2, 0.2, 7.2], 0.14, 0.14, [1, 0, 0], STEEL_L, S_STEEL);
        strut(b, [s * 6.2, 0, 0.3], [s * 6.2, 0, -5.2], 0.3, 0.3, [0, 1, 0], STEEL_L, S_STEEL); strut(b, [s * 6.2, 4.2, 0.87], [s * 6.2, 0.2, -5.0], 0.14, 0.14, [1, 0, 0], STEEL_L, S_STEEL);
      }
      b.add(new THREE.BoxGeometry(5.2, 0.5, 2.2), { p: [0, top - 0.21, 0], c: STEEL_L, surf: S_STEEL }); tower(b, 0, 0, top - 0.46, 2.2, 1.6, 1, STEEL_L, S_STEEL);
      const mm = mesh(b, matD, 'mast'); mm.position.set(MASTP[0], HD, MASTP[1]); mm.rotation.y = turn;
      // the wind sleeve on its pole, hanging limp, west of the apron
      const w = INT.makeBuilder(), sx = -92, sz = ZD - 18;
      w.add(new THREE.CylinderGeometry(0.07, 0.1, 9, 8), { p: [sx, 4.5, sz], c: '#d8d4c8', surf: sf(SID.PLAIN, 0.3) });
      w.add(new THREE.CylinderGeometry(0.42, 0.16, 3.0, 10, 4, true), { p: [sx + 0.5, 7.4, sz + 0.25], r: [0.1, 0, 0.16], c: '#d2613c', surf: sf(SID.FABRIC, 0.05), sway: [5.9, 8.9, 1, 0.1] });
      mesh(w, matD, 'sleeve');
      await ctx.yield();
      // the mast itself (in the cradle's own turn, its foot at the origin): a lattice tower, a railed deck on its head carried
      // on four brackets, a ladder up one face, a hut at its foot
      const t = INT.makeBuilder(), DW = 7.8, DL = 8.3;
      tower(t, 0, 0, HD - 0.3, 6.5, 2.4, 10, STEEL_L, S_STEEL);
      t.add(new THREE.BoxGeometry(DW * 2, 0.3, DL * 2), { p: [0, HD - 0.15, 0], c: '#4a4f55', surf: S_STEEL });
      for (const sx2 of [-1, 1]) for (const sz2 of [-1, 1]) {
        strut(t, [sx2 * 1.3, HD - 9, sz2 * 1.3], [sx2 * (DW - 0.6), HD - 0.3, sz2 * (DL - 0.6)], 0.2, 0.2, [0, 1, 0], STEEL_L, S_STEEL);
        strut(t, [sx2 * DW, HD, sz2 * DL], [sx2 * DW, HD + 1.1, sz2 * DL], 0.07, 0.07, [1, 0, 0], STEEL_L, S_STEEL);
      }
      for (const sg of [-1, 1]) {
        strut(t, [sg * DW, HD + 1.1, -DL], [sg * DW, HD + 1.1, DL], 0.06, 0.06, [0, 1, 0], STEEL_L, S_STEEL); strut(t, [-DW, HD + 1.1, sg * DL], [DW, HD + 1.1, sg * DL], 0.06, 0.06, [0, 1, 0], STEEL_L, S_STEEL);
        strut(t, [sg * DW, HD + 0.55, -DL], [sg * DW, HD + 0.55, DL], 0.04, 0.04, [0, 1, 0], STEEL_L, S_STEEL); strut(t, [-DW, HD + 0.55, sg * DL], [DW, HD + 0.55, sg * DL], 0.04, 0.04, [0, 1, 0], STEEL_L, S_STEEL);
        for (let k = 1; k < 6; k++) { strut(t, [sg * DW, HD, -DL + k * DL / 3], [sg * DW, HD + 1.1, -DL + k * DL / 3], 0.05, 0.05, [1, 0, 0], STEEL_L, S_STEEL); strut(t, [-DW + k * DW / 3, HD, sg * DL], [-DW + k * DW / 3, HD + 1.1, sg * DL], 0.05, 0.05, [1, 0, 0], STEEL_L, S_STEEL); }
      }
      for (const dx of [-0.25, 0.25]) strut(t, [dx, 0, 6.9], [dx, HD - 0.3, 2.7], 0.05, 0.05, [1, 0, 0], STEEL_L, S_STEEL);
      t.add(new THREE.BoxGeometry(4.2, 2.8, 3.4), { p: [10, 1.4, 3], c: '#6a3626', surf: sf(SID.BRICK, 0.1) });
      t.add(new THREE.BoxGeometry(4.8, 0.2, 4.0), { p: [10, 2.9, 3], c: '#3c4144', surf: sf(SID.PLAIN, 0.3) });
      t.add(new THREE.BoxGeometry(1.5, 1.0, 0.08), { p: [10, 1.6, 4.72], c: '#ffc680', surf: sf(SID.PLAIN, 0.6, 0, 2.0) }); t.add(new THREE.BoxGeometry(0.9, 1.9, 0.08), { p: [8.6, 0.95, 4.72], c: '#3a2c20', surf: sf(SID.WOOD, 0.2) });
      // the winch that hauls the ship's nose in to the mast: a drum on its axle between two cheeks that stand on a bed; its cable
      // runs to a block at the foot of the mast's west face and up that face, just outside the lattice, to a sheave under the deck
      t.add(new THREE.BoxGeometry(2.6, 0.4, 3.4), { p: [-9.5, 0.2, 3], c: '#3b4046', surf: S_STEEL }); t.add(new THREE.CylinderGeometry(0.75, 0.75, 2.1, 16), { p: [-9.5, 1.25, 3], r: [0, 0, Math.PI / 2], c: '#6d624a', surf: sf(SID.FABRIC, 0.1) });
      for (const dx of [-1.1, 1.1]) t.add(new THREE.CylinderGeometry(1.05, 1.05, 0.14, 18), { p: [-9.5 + dx, 1.25, 3], r: [0, 0, Math.PI / 2], c: '#4a5058', surf: S_STEEL });
      strut(t, [-9.5, 1.9, 2.6], [-6.75, 0.5, 2.4], 0.05, 0.05, [0, 1, 0], '#2a2d30', S_STEELM); strut(t, [-6.75, 0.5, 2.4], [-2.69, HD - 0.55, 2.2], 0.05, 0.05, [1, 0, 0], '#2a2d30', S_STEELM);
      t.add(new THREE.BoxGeometry(0.5, 0.3, 0.6), { p: [-6.75, 0.15, 2.4], c: '#3b4046', surf: S_STEEL }); t.add(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), { p: [-6.75, 0.5, 2.4], r: [Math.PI / 2, 0, 0], c: '#4a5058', surf: S_STEEL });
      t.add(new THREE.CylinderGeometry(0.25, 0.25, 0.16, 12), { p: [-2.69, HD - 0.55, 2.2], r: [Math.PI / 2, 0, 0], c: '#4a5058', surf: S_STEEL });
      const fm = mesh(t, matD, 'fieldmast'); fm.position.set(MASTP[0], 0, MASTP[1]); fm.rotation.y = turn;
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the field's lamps, still lit, and the gas works east of the shed
    {
      const b = INT.makeBuilder(), IRON = '#39423f', S_IRON = sf(SID.STEEL, 0.2, 0.3);
      // a lamp on a post 6 m tall: round the apron's edge (none on the lines the men, the trolleys or the ship's cars follow,
      // none at the north-west corner, where the way passes), and two by the mast's foot, clear of the haul way. BY PLACE: none
      // within 14 m of the way.
      const lampPost = (x, z, toX, toZ) => {
        b.add(new THREE.CylinderGeometry(0.06, 0.1, 6, 8), { p: [x, 3, z], c: '#2a2f2d', surf: S_STEELM });
        strut(b, [x, 5.9, z], [x + toX * 0.9, 6.15, z + toZ * 0.9], 0.05, 0.05, [0, 1, 0], '#2a2f2d', S_STEELM);
        b.add(new THREE.CylinderGeometry(0.08, 0.34, 0.2, 10, 1, true), { p: [x + toX * 0.9, 6.1, z + toZ * 0.9], c: '#1d2a26', surf: sf(SID.PLAIN, 0.5) });
        b.add(new THREE.SphereGeometry(0.15, 8, 6), { p: [x + toX * 0.9, 5.98, z + toZ * 0.9], c: '#ffdca6', surf: sf(SID.PLAIN, 0.1, 0, 10) });
      };
      for (const sd of [-1, 1]) for (const z of [-150, -174, -198, -222]) lampPost(sd * 61.5, z, -sd, 0);
      for (const x of [-15, 15, 45]) lampPost(x, -228, 0, 1);
      lampPost(MASTP[0] + 17, MASTP[1] + 9, -0.7, 0.7); lampPost(MASTP[0] - 11, MASTP[1] + 9, 0.7, 0.7);
      await ctx.yield();
      // THE GAS WORKS, 97 to 176 m east of the ship's line (the way never comes east of that line outdoors): a gas holder in its
      // guide frame, the retort house with its stack, a water tower, three stores
      {
        const gx = 158, gz = -128, GR = 16;
        b.add(new THREE.CylinderGeometry(GR, GR, 12, 40, 1, true), { p: [gx, 6, gz], c: IRON, surf: S_IRON });
        b.add(new THREE.CylinderGeometry(GR - 0.7, GR - 0.7, 9.4, 40, 1, true), { p: [gx, 16.7, gz], c: '#3f4946', surf: S_IRON });
        { const CR = 48.1, CA = Math.asin((GR - 0.7) / CR); b.add(new THREE.SphereGeometry(CR, 40, 5, 0, TAU, 0, CA), { p: [gx, 21.4 - CR * Math.cos(CA), gz], c: '#46504c', surf: S_IRON }); }      // its crown: a shallow dome 2.5 m high over the whole lift
        for (const y of [0.3, 12, 21.2]) b.add(new THREE.TorusGeometry(GR - (y > 12.5 ? 0.6 : 0) + 0.1, 0.22, 6, 40), { p: [gx, y, gz], r: [Math.PI / 2, 0, 0], c: '#2c3432', surf: S_IRON });
        const NG = 12, col = (k, r, y) => [gx + Math.cos(k / NG * TAU) * r, y, gz + Math.sin(k / NG * TAU) * r];
        for (let k = 0; k < NG; k++) {
          strut(b, col(k, GR + 1.3, 0), col(k, GR + 1.3, 27), 0.5, 0.5, [1, 0, 0.01], '#2c3432', S_IRON);
          for (const y of [13.5, 27]) strut(b, col(k, GR + 1.3, y), col(k + 1, GR + 1.3, y), 0.34, 0.5, [0, 1, 0], '#2c3432', S_IRON);
          strut(b, col(k, GR + 1.3, 13.5), col(k + 1, GR + 1.3, 27), 0.09, 0.09, [0, 1, 0], '#2c3432', S_IRON); strut(b, col(k + 1, GR + 1.3, 13.5), col(k, GR + 1.3, 27), 0.09, 0.09, [0, 1, 0], '#2c3432', S_IRON);
        }
        await ctx.yield();
        // the retort house: brick, a pitched roof, tall windows (some lit), and its stack
        const hx = 116, hz = -108, rg = rng.fork('works');
        b.add(new THREE.BoxGeometry(14, 9, 30), { p: [hx, 4.5, hz], c: '#6a3626', surf: sf(SID.BRICK, 0.1) });
        for (const sd of [-1, 1]) b.add(new THREE.BoxGeometry(8.4, 0.3, 31), { p: [hx + sd * 3.6, 10.6, hz], r: [0, 0, -sd * 0.42], c: '#3c4144', surf: sf(SID.PLAIN, 0.3) });
        for (const dz of [-15.02, 15.02]) for (const [w, y] of [[10, 9.6], [6, 10.8], [2.4, 11.8]]) b.add(new THREE.BoxGeometry(w, 1.3, 0.3), { p: [hx, y, hz + dz * 0.99], c: '#6a3626', surf: sf(SID.BRICK, 0.1) });
        for (let z = hz - 12; z <= hz + 12.1; z += 6) { const lit = rg.chance(0.5); b.add(new THREE.BoxGeometry(0.1, 4.2, 2.4), { p: [hx - 7.03, 4.4, z], c: lit ? '#ffc680' : '#0c1016', surf: sf(SID.PLAIN, 0.7, 0, lit ? 1.5 : 0) }); }
        b.add(new THREE.CylinderGeometry(1.0, 1.6, 34, 14), { p: [hx + 4, 17, hz - 21], c: '#5d3122', surf: sf(SID.BRICK, 0.1) });
        b.add(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 14), { p: [hx + 4, 34.2, hz - 21], c: '#4a2a1e', surf: sf(SID.BRICK, 0.1) });
        // the water tower
        const wx = 112, wz = -172;
        tower(b, wx, wz, 15, 4.2, 3.2, 4, IRON, S_IRON);
        b.add(new THREE.CylinderGeometry(4.6, 4.6, 5.5, 20), { p: [wx, 17.75, wz], c: '#3f4946', surf: S_IRON }); b.add(new THREE.CylinderGeometry(0.4, 4.8, 1.6, 20), { p: [wx, 21.28, wz], c: '#333b39', surf: S_IRON });
        b.add(new THREE.CylinderGeometry(0.3, 0.3, 15, 8), { p: [wx, 7.5, wz], c: IRON, surf: S_IRON });
        // three stores
        for (let k = 0; k < 3; k++) { const x = 104 + k * 17, z = -64;
          b.add(new THREE.BoxGeometry(13, 4.6, 9), { p: [x, 2.3, z], c: '#56524a', surf: sf(SID.WOOD, 0.1) });
          for (const sd of [-1, 1]) b.add(new THREE.BoxGeometry(13.6, 0.24, 5.3), { p: [x, 5.5, z + sd * 2.35], r: [sd * 0.4, 0, 0], c: '#33393b', surf: sf(SID.PLAIN, 0.3) }); }
      }
      mesh(b, matS, 'works');
      await ctx.yield();
      // the cradles the ship lay on, left where they stood: a padded trestle every 15 m, 8.5 m to either side of the axis (the
      // belly passes 6 m over them; the men under the control car walk 3.5 m inside them). The three pairs astern of where the
      // tail lay stand ready there.
      const c = INT.makeBuilder(), WD = '#5d4630', SWD = sf(SID.WOOD, 0.2);
      for (let z = ZD + 22; z < ZB - 40; z += 15) for (const sd of [-1, 1]) {
        const x = sd * 8.5;
        for (const dz of [-1.3, 1.3]) for (const dx of [-0.55, 0.55]) strut(c, [x + dx, 0, z + dz], [x + dx * 0.25, 0.92, z + dz], 0.1, 0.12, [0, 0, 1], WD, SWD);
        c.add(new THREE.BoxGeometry(0.34, 0.16, 3.4), { p: [x, 0.98, z], c: WD, surf: SWD });
        c.add(new THREE.BoxGeometry(0.7, 0.2, 3.0), { p: [x, 1.16, z], c: '#8c7f66', surf: sf(SID.FABRIC, 0.05) });
      }
      mesh(c, matS, 'cradles');
    }
    await ctx.yield();
    {
      // gear left out on the apron, along its east and west edges (nothing within 7 m of the way, which crosses the apron's west
      // side 10 m up and more): a tank wagon, handcarts, piles of ballast bags, stacked trestles, coils of line. The carts are
      // dealt from one stream and the bag piles from another; each pile lies 2.6 m and more from its cart, on the cart's inner hand
      const a = INT.makeBuilder(), rA = rng.fork('apron-carts'), rBg = rng.fork('apron-bags'), WD2 = '#6b4a2e', SW2 = sf(SID.WOOD, 0.2), BAG2 = sf(SID.FABRIC, 0.05);
      const cart = (x, z, ry) => { const co = Math.cos(ry), si = Math.sin(ry);
        a.add(new THREE.BoxGeometry(1.5, 0.12, 2.6), { p: [x, 0.62, z], r: [0, ry, 0], c: WD2, surf: SW2 });
        for (const dz of [-0.8, 0.8]) for (const dx of [-0.79, 0.79]) a.add(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), { p: [x + dx * co + dz * si, 0.3, z - dx * si + dz * co], r: [0, ry, Math.PI / 2], c: '#1f2327', surf: S_STEEL });
        strut(a, [x + 1.3 * si, 0.62, z + 1.3 * co], [x + 2.7 * si, 0.95, z + 2.7 * co], 0.06, 0.06, [0, 1, 0], '#2a2d30', S_STEELM); };
      // a pile: six bags on the ground, three by two; then two lying over the joints between them; then one over those two
      // (each layer 0.22 m above the last: the bags slump into one another by a few centimetres, none hangs clear)
      const BAGAT = [[-0.6, 0, 0], [0.02, 0, 0], [0.64, 0, 0], [-0.6, 0, 0.75], [0.02, 0, 0.75], [0.64, 0, 0.75], [-0.29, 1, 0.375], [0.33, 1, 0.375], [0.02, 2, 0.375]];
      const bags = (x, z, n) => { for (let k = 0; k < n; k++) { const [dx, lay, dz] = BAGAT[k]; a.add(new THREE.SphereGeometry(1, 7, 5), { p: [x + dx + rBg.range(-0.04, 0.04), 0.17 + lay * 0.22, z + dz + rBg.range(-0.04, 0.04)], s: [0.34, 0.17, 0.42], c: rBg.pick(['#8c7f66', '#7d725c', '#968a70']), surf: BAG2 }); } };
      for (const [x, z] of [[49, -150], [53, -186], [46, -212], [-55, -146]]) { const cx = x + rA.range(-1.5, 1.5), cz = z + rA.range(-3, 3);
        cart(cx, cz, rA.range(-0.5, 0.5)); bags(cx - Math.sign(x) * rBg.range(2.6, 3.4), cz + rBg.range(-1.5, 1.5), 6 + Math.floor(rBg.range(0, 3.99))); }
      // the tank wagon: a tank on a four-wheeled bed with a drawbar
      { const x = 52, z = -168;
        a.add(new THREE.CylinderGeometry(1.05, 1.05, 4.6, 16), { p: [x, 1.85, z], r: [Math.PI / 2, 0, 0], c: '#59624f', surf: sf(SID.PLAIN, 0.4, 0.4) });
        a.add(new THREE.BoxGeometry(1.9, 0.2, 5.2), { p: [x, 0.75, z], c: '#3b4046', surf: S_STEEL });
        for (const dz of [-1.7, 1.7]) for (const dx of [-1.0, 1.0]) a.add(new THREE.CylinderGeometry(0.45, 0.45, 0.16, 14), { p: [x + dx, 0.45, z + dz], r: [0, 0, Math.PI / 2], c: '#1f2327', surf: S_STEEL });
        strut(a, [x, 0.75, z - 2.6], [x, 0.9, z - 4.4], 0.07, 0.07, [0, 1, 0], '#2a2d30', S_STEELM); }
      // trestles stacked two high, and coils of line
      for (const [x, z] of [[55, -200], [-56, -158]]) for (let k = 0; k < 4; k++) {
        const zz = z + (k % 2) * 1.5, y = Math.floor(k / 2) * 0.86;
        a.add(new THREE.BoxGeometry(0.5, 0.06, 2.6), { p: [x, y + 0.82, zz], r: [0, Math.PI / 2, 0], c: '#7a5a3a', surf: sf(SID.WOOD, 0.3) });
        for (const dx of [-1.1, 1.1]) a.add(new THREE.BoxGeometry(0.06, 0.8, 0.46), { p: [x + dx, y + 0.4, zz], c: WD2, surf: SW2 });
      }
      for (const [x, z] of [[47, -160], [50.5, -196], [-51.5, -154.5]]) for (let k = 0; k < 3; k++) a.add(new THREE.TorusGeometry(0.42 - k * 0.03, 0.09, 6, 14), { p: [x, 0.09 + k * 0.17, z], r: [Math.PI / 2, 0, 0], c: '#a08a62', surf: BAG2 });
      mesh(a, matS, 'aprongear');
    }
    await ctx.yield();

    // ------------------------------------------------------------------ along the walls: work stands, benches, ladders, coils of line
    {
      const b = INT.makeBuilder(), WOOD = '#6b4a2e', bays = []; for (let i = 2; i < NRIB - 1; i++) bays.push(i);
      // (nothing is set down where men stand at the foot of a wall: [side, z from, z to] of each knot of them, as crewPlaces has them)
      const MENZ = [[-1, 114.5, 119.5], [1, 55, 60.2], [1, -44, -38], [-1, -12, -8.1]], nearMen = (sd, z0, z1) => MENZ.some((q) => q[0] === sd && z1 > q[1] - 1.5 && z0 < q[2] + 1.5);
      // (and nothing is set down in another thing: [side, x from, x to, z from, z to] of each thing as it is placed, x from the axis)
      const taken = [], free = (sd, x, z) => !taken.some((q) => q[0] === sd && Math.abs(x) + 1.0 > q[1] && Math.abs(x) - 1.0 < q[2] && z + 1.3 > q[3] && z - 1.3 < q[4]);
      const pickBays = rStand.shuffle(bays.slice()).slice(0, 9);
      for (let n = 0; n < pickBays.length; n++) {
        const bay = pickBays[n], s = n % 2 ? 1 : -1, z = ZD + bay * 15 + 7.5, x = s * 41.5;
        if (nearMen(s, z - 3.5, z + 6.5)) continue;
        if (n < 6) {      // a rolling work stand: a tower of planks and poles
          const h = 8 + 2.4 * (n % 3), lv = Math.round(h / 2.4);
          tower(b, x, z, h, 1.7, 1.7, lv, WOOD, sf(SID.WOOD, 0.2));
          for (let k = 1; k <= lv; k += 2) b.add(new THREE.BoxGeometry(3.3, 0.07, 3.3), { p: [x, h * k / lv, z], c: '#8a6a44', surf: sf(SID.WOOD, 0.2) });
          b.add(new THREE.BoxGeometry(3.5, 0.07, 3.5), { p: [x, h + 0.04, z], c: '#8a6a44', surf: sf(SID.WOOD, 0.2) });
          taken.push([s, 39.7, 43.3, z - 1.8, z + 1.8]);
        } else {          // a bench with coils of line
          b.add(new THREE.BoxGeometry(1.1, 0.08, 6), { p: [s * 44.6, 0.9, z], c: '#7a5a3a', surf: sf(SID.WOOD, 0.3) });
          for (const dz of [-2.7, 0, 2.7]) b.add(new THREE.BoxGeometry(1.0, 0.86, 0.1), { p: [s * 44.6, 0.43, z + dz], c: WOOD, surf: sf(SID.WOOD, 0.2) });
          for (const dz of [-1.6, 1.3]) b.add(new THREE.TorusGeometry(0.34, 0.09, 6, 14), { p: [s * 44.6, 1.03, z + dz], r: [Math.PI / 2, 0, 0], c: '#a08a62', surf: sf(SID.FABRIC, 0.05) });
          taken.push([s, 44.0, 45.2, z - 3.05, z + 3.05]);
        }
        // a long ladder against the wall beside it
        const lz = z + 5, lx0 = s * 45.2, lx1 = s * 48.8; taken.push([s, 45.1, 50, lz - 0.4, lz + 0.4]);
        for (const dz of [-0.28, 0.28]) strut(b, [lx0, 0, lz + dz], [lx1, 11, lz + dz], 0.07, 0.07, [0, 0, 1], WOOD, sf(SID.WOOD, 0.2));
        for (let k = 1; k < 24; k++) { const f = k / 24; b.add(new THREE.BoxGeometry(0.04, 0.04, 0.56), { p: [lerp(lx0, lx1, f), 11 * f, lz], c: WOOD, surf: sf(SID.WOOD, 0.2) }); }
        await ctx.yield();
      }
      await ctx.yield();
      // and in most bays, at the foot of the wall: crates, drums, a trestle (all within 7 m of the wall)
      const CR = ['#6b4a2e', '#5a4630', '#74583a', '#4c4f52'];
      for (let i = 1; i < NRIB; i++) for (const sd of [-1, 1]) {
        if (!rCrate.chance(0.7)) continue;
        const z0 = ZD + i * 15 + rCrate.range(2, 12), n = 1 + Math.floor(rCrate.range(0, 3.99));
        for (let k = 0; k < n; k++) {
          const x = sd * rCrate.range(43.5, 47.5), z = z0 + rCrate.range(-2.5, 2.5), kind = rCrate.range(0, 1);
          if (nearMen(sd, z - 1.6, z + 1.6) || !free(sd, x, z)) continue;
          taken.push([sd, Math.abs(x) - 1.0, Math.abs(x) + 1.0, z - 1.3, z + 1.3]);
          if (kind < 0.55) { const w = rCrate.range(0.8, 1.7), h = rCrate.range(0.6, 1.4); b.add(new THREE.BoxGeometry(w, h, rCrate.range(0.8, 2.2)), { p: [x, h / 2, z], r: [0, rCrate.range(-0.3, 0.3), 0], c: rCrate.pick(CR), surf: sf(SID.WOOD, 0.15) }); }
          else if (kind < 0.85) b.add(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10), { p: [x, 0.45, z], c: rCrate.pick(['#3f4a44', '#4a3f38', '#56524a']), surf: sf(SID.PLAIN, 0.35, 0.4) });
          else { b.add(new THREE.BoxGeometry(0.5, 0.06, 2.6), { p: [x, 0.82, z], c: '#7a5a3a', surf: sf(SID.WOOD, 0.3) }); for (const dz of [-1.1, 1.1]) b.add(new THREE.BoxGeometry(0.46, 0.8, 0.06), { p: [x, 0.4, z + dz], c: WOOD, surf: sf(SID.WOOD, 0.2) }); }
        }
        if (i % 6 === 5) await ctx.yield();
      }
      await ctx.yield();
      // two work lamps on stands on the floor where the tail lies at the start, turned on the fins; they stay as the ship moves off
      // (their light: the third lamp of the part's light)
      for (const s of [-1, 1]) {
        const x = s * 9, z = 102;
        for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + 0.4; strut(b, [x + Math.cos(a) * 0.9, 0, z + Math.sin(a) * 0.9], [x, 2.7, z], 0.06, 0.06, [0, 1, 0.01], '#2a2d30', S_STEELM); }
        strut(b, [x, 2.6, z], [x, 3.0, z], 0.07, 0.07, [1, 0, 0], '#2a2d30', S_STEELM);
        b.add(new THREE.CylinderGeometry(0.34, 0.2, 0.42, 12), { p: [x, 3.15, z], r: [0, 0, s * 1.2], c: '#23302b', surf: sf(SID.PLAIN, 0.6) });
        b.add(new THREE.SphereGeometry(0.2, 8, 6), { p: [x - s * 0.12, 3.2, z], c: '#ffe0b0', surf: sf(SID.PLAIN, 0.1, 0, 9) });
      }
      // the rolling stair the control car was boarded by, drawn back 14 m to starboard of where the car stood: its head, rail and
      // all, 7 m up; the hull's belly passes 3.4 m over it at the least and an engine car's propeller 2.7 m from it (the ship's ride counted in)
      {
        const x = 14.2, z = -103, h = 6.0, W2 = '#5d4630', SW = sf(SID.WOOD, 0.2);
        tower(b, x, z, h, 1.5, 1.5, 4, W2, SW); b.add(new THREE.BoxGeometry(3.2, 0.08, 3.2), { p: [x, h + 0.04, z], c: '#8a6a44', surf: SW });
        for (const dz of [-1.5, 1.5]) { strut(b, [x - 1.5, h + 1.0, z + dz], [x + 1.5, h + 1.0, z + dz], 0.05, 0.05, [0, 1, 0], W2, SW); strut(b, [x + 9.5, 0.3, z + dz * 0.6], [x + 1.5, h, z + dz * 0.6], 0.09, 0.22, [0, 1, 0], W2, SW); }
        for (let k = 1; k < 20; k++) { const f = k / 20; b.add(new THREE.BoxGeometry(0.34, 0.05, 1.7), { p: [lerp(x + 9.5, x + 1.5, f), lerp(0.3, h, f), z], c: '#8a6a44', surf: SW }); }
        for (const dx of [-1.5, 1.5]) for (const dz of [-1.5, 1.5]) b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10), { p: [x + dx, 0.22, z + dz], r: [0, 0, Math.PI / 2], c: '#1f2327', surf: S_STEEL });
      }
      await ctx.yield();
      // between the files' lines and the walls: piles of ballast bags, a handcart by some of them (34 to 39 m out, under 1.4 m high)
      const rGear = rng.fork('gear'), BAG = sf(SID.FABRIC, 0.05);
      for (let i = 1; i < NRIB - 1; i++) for (const sd of [-1, 1]) {
        if (!rGear.chance(0.42)) continue;
        const x0 = sd * rGear.range(36.6, 38.4), z0 = ZD + i * 15 + rGear.range(3, 12), nb = 5 + Math.floor(rGear.range(0, 5.99));
        for (let k = 0; k < nb; k++) { const lay = k < 4 ? 0 : 1; b.add(new THREE.SphereGeometry(1, 7, 5), { p: [x0 + (k % 2) * 0.62 - 0.3 + rGear.range(-0.06, 0.06), 0.15 + lay * 0.27, z0 + ((k >> 1) % 2) * 0.46 + lay * 0.2 + rGear.range(-0.05, 0.05)], r: [0, rGear.range(-0.3, 0.3), 0], s: [0.36, 0.16, 0.24], c: rGear.pick(['#8c7f66', '#7d745f', '#968a70']), surf: BAG }); }
        if (rGear.chance(0.5)) { const cx = x0 - sd * 1.7, cz = z0 + rGear.range(-1.5, 1.5);
          b.add(new THREE.BoxGeometry(0.9, 0.12, 1.5), { p: [cx, 0.62, cz], c: '#6b4a2e', surf: sf(SID.WOOD, 0.2) });
          for (const dx of [-0.52, 0.52]) { b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 12), { p: [cx + dx, 0.42, cz], r: [0, 0, Math.PI / 2], c: '#3a2c20', surf: sf(SID.WOOD, 0.2) }); strut(b, [cx + dx * 0.8, 0.66, cz + 0.7], [cx + dx * 0.8, 0.95, cz + 1.9], 0.05, 0.05, [1, 0, 0], '#6b4a2e', sf(SID.WOOD, 0.2)); }
        }
        if (i % 6 === 5) await ctx.yield();
      }
      mesh(b, matS, 'dressing');
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the ship, and what walks with it
    const hero = await buildHero(ctx, { light: LT }), ship = hero.object; scene.add(ship);
    // THE SISTER SHIP: the ship's own geometry and material drawn a second time (nothing new is built): hull, fins, cars,
    // her rudders amidships, her propellers turning by the clock, two and a half times as fast as ours turn over (a closed course)
    const sisProps = [];
    for (const o of ship.getObjectByName('afloat').children) {
      const m = new THREE.Mesh(o.geometry, o.material); m.position.copy(o.position); m.name = 'sister'; m.frustumCulled = false; sister.add(m);
      if (o.userData.rate) { m.userData.rate = o.userData.rate * 2.5; sisProps.push(m); }
    }
    sister.rotation.y = Math.atan2(-SISTER.HEAD[0], -SISTER.HEAD[1]); scene.add(sister);
    await ctx.yield();
    const places = crewPlaces(), instanced = [];
    const TONES = ['#2c3a50', '#263246', '#35445a', '#4c463a', '#6a665c', '#2e3138', '#34443c'];
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Euler();
    const crew = (list, walking) => {
      const g = figureGeometry(), n = list.length, ph = new Float32Array(n * 4); disposables.push(g);
      const m = new THREE.InstancedMesh(g, LT.figure(), n); instanced.push(m);
      list.forEach((q, i) => {
        const h = rMen.range(0.92, 1.07); _e.set(0, q.turn || 0, 0); _q.setFromEuler(_e); _p.set(q.x, 0, q.z); _s.set(q.mirror ? -h : h, h, h);
        m.setMatrixAt(i, _m.compose(_p, _q, _s)); m.setColorAt(i, _c.set(rMen.pick(TONES)).multiplyScalar(rMen.range(0.85, 1.1)));
        ph[i * 4] = (rMen.chance(0.12) ? Math.PI : 0) + rMen.range(-0.3, 0.3); ph[i * 4 + 1] = walking ? 1 : 0; ph[i * 4 + 2] = rMen(); ph[i * 4 + 3] = !walking || q.free ? 1 : 0;
      });
      g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 4)); m.instanceMatrix.needsUpdate = true; m.frustumCulled = false;
      return m;
    };
    ship.add(crew(places.walk, true)); scene.add(crew(places.stand, false));
    await ctx.yield();
    {
      // their long shadows, one strip a man, laid where the dawn reaches
      const n = places.walk.length, base = new Float32Array(n * 4); places.walk.forEach((q, i) => { base[i * 4] = q.x; base[i * 4 + 1] = 0; base[i * 4 + 2] = q.z; base[i * 4 + 3] = 0.42; });
      const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n; disposables.push(g);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 1, -0.5, 0, 1], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 4));
      const m = new THREE.Mesh(g, LT.shadow()); m.frustumCulled = false; m.renderOrder = 3; ship.add(m);
      // and the men who stand in the open (the mooring party)
      const od = places.stand.filter((q) => q.z < ZD - 2), og = new THREE.InstancedBufferGeometry(), ob = new Float32Array(od.length * 4); og.instanceCount = od.length; disposables.push(og);
      od.forEach((q, i) => { ob[i * 4] = q.x; ob[i * 4 + 2] = q.z; ob[i * 4 + 3] = 0.42; });
      og.setAttribute('position', g.getAttribute('position')); og.setIndex([0, 1, 2, 0, 2, 3]); og.setAttribute('aBase', new THREE.InstancedBufferAttribute(ob, 4));
      const om = new THREE.Mesh(og, LT.shadow()); om.frustumCulled = false; om.renderOrder = 3; scene.add(om);
      // the poplars' long shadows across the field, toward us (a strip's fourth number is its width in metres; its length is
      // a man's shadow's times the height typed in its own corners: 11 for a poplar)
      const pg = new THREE.InstancedBufferGeometry(), pb = new Float32Array(poplars.length * 4); pg.instanceCount = poplars.length; disposables.push(pg);
      poplars.forEach((q, i) => { pb[i * 4] = q[0]; pb[i * 4 + 2] = q[1]; pb[i * 4 + 3] = 5.5; });
      pg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 11, 0, 0.5, 11, 0, 0.5, 11, 1, -0.5, 11, 1], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]); pg.setAttribute('aBase', new THREE.InstancedBufferAttribute(pb, 4));
      const pm = new THREE.Mesh(pg, LT.shadow()); pm.frustumCulled = false; pm.renderOrder = 3; scene.add(pm);
      // the hedges' shadows (a strip 5 m wide for each 4 m of bank; 1.25 of a man's height)
      const hg = new THREE.InstancedBufferGeometry(), hb = new Float32Array(hedgeAt.length * 4); hg.instanceCount = hedgeAt.length; disposables.push(hg);
      hedgeAt.forEach((q, i) => { hb[i * 4] = q[0]; hb[i * 4 + 2] = q[1]; hb[i * 4 + 3] = 5; });
      hg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 1.25, 0, 0.5, 1.25, 0, 0.5, 1.25, 1, -0.5, 1.25, 1], 3)); hg.setIndex([0, 1, 2, 0, 2, 3]); hg.setAttribute('aBase', new THREE.InstancedBufferAttribute(hb, 4));
      const hm = new THREE.Mesh(hg, LT.shadow()); hm.frustumCulled = false; hm.renderOrder = 3; scene.add(hm);
      // the mast's own long shadow (a strip 3 m wide)
      const mg = new THREE.InstancedBufferGeometry(); mg.instanceCount = 1; disposables.push(mg);
      mg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, MASTH / 1.78, 0, 0.5, MASTH / 1.78, 0, 0.5, MASTH / 1.78, 1, -0.5, MASTH / 1.78, 1], 3)); mg.setIndex([0, 1, 2, 0, 2, 3]);
      mg.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array([MASTP[0], 0, MASTP[1], 3]), 4));
      const ms = new THREE.Mesh(mg, LT.shadow()); ms.frustumCulled = false; ms.renderOrder = 3; scene.add(ms);
    }
    {
      // the lines: from the hull down to each double file and along it; two from the bow to the gangs ahead; the after body's to its trolleys
      const lines = [], A = hero.anchors;
      for (const a of A.side) { const x = a.s * 30.5, z = a.z; lines.push(hang(a.at, [x, 1.12, z - 0.4], 1.6, 12, 1)); lines.push(hang([x, 1.12, z - 0.4], [x, 1.08, z - 11.2], 0.05, 6)); }
      for (const s of [-1, 1]) { lines.push(hang([s * 1.0, 10.5, -73], [s * 5, 1.15, -71.6], 0.5, 10, 1)); lines.push(hang([s * 5, 1.15, -71.6], [s * 5, 1.08, -80.6], 0.05, 6)); }
      A.bow.forEach((p, i) => { const s = i ? 1 : -1; lines.push(hang(p, [s * 1.6, 1.15, -105.6], 1.2, 14, 1)); lines.push(hang([s * 1.6, 1.15, -105.6], [s * 1.6, 1.08, -123.6], 0.05, 8)); });
      const tb = INT.makeBuilder();
      for (const a of A.aft) {
        const x = a.s * 30.5, z = a.z;
        lines.push(hang(a.at, [x, 1.12, z - 4.4], 1.4, 12, 1)); lines.push(hang([x, 1.12, z - 4.4], [x, 1.08, z - 13.2], 0.05, 6));
        tb.add(new THREE.BoxGeometry(2.4, 0.55, 3.6), { p: [x, 0.62, z], c: '#68727a', surf: S_STEEL }); tb.add(new THREE.BoxGeometry(0.3, 1.5, 0.3), { p: [x, 1.6, z], c: '#68727a', surf: S_STEEL });
        for (const dx of [-1.5, 1.5]) for (const dz of [-1.2, 1.2]) tb.add(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 12), { p: [x + dx, 0.32, z + dz], r: [0, 0, Math.PI / 2], c: '#1f2327', surf: S_STEEL });
        lines.push(hang(a.at, [x, 2.35, z], 0.9, 10, 1));
      }
      mesh(tb, matS, 'trolleys', ship);
      const rg = ropeGeometry(lines); disposables.push(rg); const rm = new THREE.Mesh(rg, LT.rope()); rm.frustumCulled = false; rm.renderOrder = 4; ship.add(rm);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ dust in the shafts, swallows
    {
      // dust: places of its own in the forward 190 m of the shed. BY PLACE, as for every body: none within 5.1 m of the way
      // (it drifts at most 0.6 m along each axis round its place, 1.04 m in all, so 4.1 m at the least)
      const N = 5200, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4), NW = 180, way = new Float32Array((NW + 1) * 3), wp = new THREE.Vector3(); let n = 0, tries = 0;
      for (let i = 0; i <= NW; i++) { path.pointAt(i / NW, wp); way[i * 3] = wp.x; way[i * 3 + 1] = wp.y; way[i * 3 + 2] = wp.z; }
      await ctx.yield();
      while (n < N && tries < N * 4) {
        tries++; const x = rDust.range(-44, 44), y = rDust.range(1.5, 60), z = rDust.range(ZD + 2, ZD + 190), s0 = rDust(), s1 = rDust(), s2 = rDust(), s3 = rDust();
        if (tries % 80 === 0) await ctx.yield();
        if (y > roofY(x) - 4) continue; let ok = true; for (let k = 0; k <= NW; k++) { const dx = way[k * 3] - x, dy = way[k * 3 + 1] - y, dz = way[k * 3 + 2] - z; if (dx * dx + dy * dy + dz * dz < 30) { ok = false; break; } }
        if (!ok) continue; pos[n * 3] = x; pos[n * 3 + 1] = y; pos[n * 3 + 2] = z; seed[n * 4] = s0; seed[n * 4 + 1] = s1; seed[n * 4 + 2] = s2; seed[n * 4 + 3] = s3; n++;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, n * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed.subarray(0, n * 4), 4));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, ZD + 95), 130); disposables.push(g);
      await ctx.yield();
      const pts = new THREE.Points(g, LT.motes()); pts.renderOrder = 6; scene.add(pts);
    }
    await ctx.yield();
    {
      // swallows. Each flies an ellipse laid level in the air. BY PLACE: five indoors, high along the starboard side forward,
      // between the hull and the lamps (x 24.5 to 35.5, y 35 to 39.5, z -131 to 11; the way has crossed to port by then and is
      // nowhere within 30 m of them); fifty-six outdoors over the meadow north-east of the doors (x 60 to 130, y 4 to 17,
      // z -336 to -248), where the way never goes (outdoors it keeps west of the ship's line); thirty over the meadow west of
      // the mast (x -166 to -98, y 3.8 to 14.2, z -342 to -260: the way comes no farther west than x -68.1, and there it is some 43 m up).
      const N = 91, c = new Float32Array(N * 4), r = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) {
        const indoors = i < 5, rb = indoors ? rBird : i < 61 ? rBirdE : rBirdW, sp = rb.range(0.32, 0.5) * (rb.chance(0.5) ? 1 : -1);      // (each flight on a stream of its own)
        if (indoors) { c.set([30, rBird.range(36.5, 38), rBird.range(-105, -15), rBird.range(0, TAU)], i * 4); r.set([rBird.range(3.5, 5.5), rBird.range(14, 26), 0, sp], i * 4); }
        else if (i < 61) { c.set([rb.range(84, 106), rb.range(6, 15), rb.range(-312, -272), rb.range(0, TAU)], i * 4); r.set([rb.range(10, 24), rb.range(8, 20), rb.range(0, TAU), sp * 0.6], i * 4); }
        else { c.set([rb.range(-150, -114), rb.range(5, 13), rb.range(-326, -276), rb.range(0, TAU)], i * 4); r.set([rb.range(8, 16), rb.range(6, 14), rb.range(0, TAU), sp * 0.7], i * 4); }
      }
      const g = new THREE.InstancedBufferGeometry(); g.instanceCount = N; disposables.push(g);
      // a body and two wings: 1.0 m from tip to tip (larger than life, so that it reads at this scale)
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.26, 0.05, 0, 0.1, -0.05, 0, 0.1, 0, 0, 0.3, 0.05, 0, 0.1, -0.05, 0, 0.1,
        0.03, 0, -0.1, 0.5, 0, 0.12, 0.03, 0, 0.1, -0.03, 0, -0.1, -0.5, 0, 0.12, -0.03, 0, 0.1], 3));
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(c, 4)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(r, 4));
      const m = new THREE.Mesh(g, LT.birds()); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the flight
    const plan = flightPlan(R), size = new THREE.Vector2();
    const setEvent = (u) => {
      const s = shipShift(u), w = doorHalf(s);
      ship.position.z = shipZ(u); U.uShipZ.value = shipZ(u); U.uDoorW.value = w; U.uStep.value = s / STRIDE; U.uWalk.value = ss(u, 0, 0.004);
      for (const m of leaves) m.position.x = m.userData.side * (m.userData.inner ? w + LEAF.W / 2 : LEAF.W * 1.5 + w / 2);
      // (the sister ship: her frame's origin stands 22.5 m ahead of her hull's middle, and her axis SHIP.CY over it)
      const sr = (clamp(u, 0, 1) - SISTER.U0) * SISTER.RUN + 22.5; sister.position.set(SISTER.AT[0] + SISTER.HEAD[0] * sr, SISTER.AT[1] - SHIP.CY, SISTER.AT[2] + SISTER.HEAD[1] * sr);
    };
    setEvent(0);
    return {
      scene, path, duration: DUR, pace: 1, title: 'Walking Out the Airship', ride: 'none',
      camera: plan.camera, pois: plan.pois,
      portal: { shape: 'circle', radius: RING, color: '#ffd9a0', glow: 0.7, revealDistance: 95, blendDistance: 30 },
      post: { exposure: 1.25, bloom: { strength: 0.36, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.06, contrast: 1.05, tint: '#fff6ec', shadowTint: '#10141f', vignette: 0.3, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u = 0) {
        U.uTime.value = t;
        setEvent(u);
        hero.update(dt, t);
        for (const p of sisProps) p.rotation.z = (t * p.userData.rate) % TAU;
        ctx.renderer.getDrawingBufferSize(size); U.uRes.value.copy(size); U.uPx.value = size.y * camera.projectionMatrix.elements[5] * 0.5;
      },
      dispose() { hero.dispose(); for (const m of instanced) m.dispose(); for (const g of disposables) g.dispose(); LT.dispose(); },
    };
  },
};
