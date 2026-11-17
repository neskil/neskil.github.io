// The Field in Thick Paint: a hay meadow at morning made wholly of thick oil paint as stuff. Every grass is one brush
// stroke as long as a street, the sky is laid in ragged slabs with a knife over a vault of primed canvas, the weave
// shows thread over thread where the paint is thin. We come in level over the tips of the foreground strokes, COME
// DOWN to a brook of sliding blue and white strokes, fly LOW over its water between towering flowers toward a step
// where the strokes pour white over a ledge into a round pool that turns, swing round the pool and IN TOWARD ONE ELM
// that is a stack of forty strokes (the hero part, src/parts/field-in-thick-paint.js, which also holds the one stroke
// family and the one paint shader): whole at first, then its boughs from close on the sunny side. West of it the
// meadow is FINISHED and has a second landmark: A MAY TREE in full blossom on a low knoll, heaped white, with the
// brook's west arm bending round the knoll's foot under a drift of cobalt, the far bay beyond under cloud shadow as
// far as the ridge, which goes on round the west. Then over the far meadow to a belt of strokes as tall as towers,
// under one great stroke bent over the lane's mouth as a gate, and down the lane to the one thing here that is not
// paint: a drop of real water at the tip of a blade, in a bower of strokes that it lights. THE DROP IS THE EXIT
// OPENING: nothing is built in it or before it; the engine draws there whatever world comes next.
//
// AXES. The picture plane is z 0; -Z is into the picture, +X to the right, y up; primed canvas lies at y 0 under
// everything. "Azimuth" is degrees to the right of -Z. We are the size of a gnat: the picture is about 1600 m wide.
//
// EVERY WINDOW, RIDE, GATE, CROSSING AND DRIFT IS WRITTEN FROM NAMED PLACES (the elm's foot and reach, the brook's
// bends, the pool, the may tree, the lane's mouth and length, the wall rows, the key's bearing, the sun's body, the
// drop), never from metres flown: the look by the lens's angle and the trunk's bearing, the line's leaving of the
// elm by the two trees' circles, the rides by shares of the wall rows, the sun by two laws of the place.
//
// THE JOIN IS THE SAME ON EVERY SEED: the entry point and axis, the foreground grass (all of its strokes), the brook's
// line and its west arm, the elm, the may tree, the ridge, the sun boss, the belt's strokes that wall the lane, the
// sun's wall, the lane's gate, variety, path, flowers, crossing butterflies and dew file, the bower, the blade, the
// drop and the whole route are dealt from FIXED STREAMS (constants, never the seed) or are plain measures; so is the
// underpainting. The visit's seed deals only what stands off the join: the meadow's ground strokes, the banks, the
// brook's strokes, its bed and its step, the flowers and the colour drifts, the red dab, sky slabs, clouds, birds,
// butterflies, the far belt. This world reads neither the world before it nor any series.
//
// EVERYTHING GOES BY THE WORLD CLOCK OR STANDS: wind, brook, arm, fall, pool, rooks, larks, butterflies, petals, clouds
// and their shades, the blade's bob, the beads that fall. Nothing begins, turns or ends because the visitor comes;
// light differs only by where a thing stands (lit side, shade side, under a cloud or a neighbour's shadow, near the
// drop), never by the metres flown.
//
// LIGHT: one key (the low sun), warm on the lit sides; shade sides cool and darker; the clouds' shades travel over the
// field (never over the may tree, always over the bay beyond it); wet paint shines toward the sun and the water
// glitters under it; and the drop is a light at its own place with a real fall-off, whose shadows lie from every
// stroke's foot straight away from it. The boss is the light itself: nothing lights it. THE SUN IS NEVER BEHIND THE
// GRASS: it stands clear over a hedge (the sun's strip) or is hidden by the lane's closed wall (the sun's wall), and
// shines into the lane at one declared place, the sun's ride.
//
// BODIES (kept off the flown line by place, each by its own rule, counted on seeds 1 to 100 by arithmetic): every
// stroke, dab and slab, the birds, the butterflies, the petals, the blade, the collar, the arch, the bower. MEDIA: none.
//
// BEHIND THE ENTRY: nothing stands at z over ENTRY.clear; for 60 m back along the level entry axis and 15 m to every
// side there is only air (the canvas lies 30 m under the axis, the vault's foot 590 m behind). camera.nearThrough is
// not set.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  buildHero, paintShared, paintMaterial, makeStrokes, strokeGeometry, dabGeometry, slabGeometry, strokeSkin, strokePoint, windReach, LIGHT_GLSL,
  blotsOf, makeShadowTexture, lyingStroke, flowerAt, paintColours, MEADOW_GREENS, ELM, WIND, MAY, mayStrokes,
} from '../parts/field-in-thick-paint.js';

const { lin, mix3, mul3 } = paintColours;
const DEG = Math.PI / 180;
const FIXED = 'field-in-thick-paint:the join';
// the lens's own angle (degrees, the picture's height)
const FOV = 62;
// a heading as a unit vector in x and z, and the unit vector to its right
const head = (az) => [Math.sin(az * DEG), -Math.cos(az * DEG)], rightOf = (h) => [-h[1], h[0]];

// ------------------------------------------------------------------ the places (metres)
const ENTRY = { x: 0, y: 30, z: 0, level: 60, clear: -14 };
const DROP = { x: -207, y: 14, z: -722, r: 5.5 };
// the lane's axis is the line from the entry point to the drop (so the drop is in sight from the first metre)
const LANE_LEN = Math.hypot(DROP.x - ENTRY.x, DROP.z - ENTRY.z);
const LANE = {
  f: [(DROP.x - ENTRY.x) / LANE_LEN, (DROP.z - ENTRY.z) / LANE_LEN], straight: 130, half: 9, floor: 2,
  // the belt of tall grass across it: from before to beyond the drop along the lane, and to either side
  before: 120, beyond: 25, side: 260, fixedSide: 60,
  // the blade's bay on the left: the last bay.len metres before the opening's plane, from the wall's skin out to bay.out
  bay: { len: 26, out: 20, top: 28 }, bladeBack: 1.5, beyondClear: 14,
};
LANE.l = [LANE.f[1], -LANE.f[0]];
LANE.az = Math.atan2(LANE.f[0], -LANE.f[1]) / DEG;
// a place in the lane's own frame: a metres along it from the drop (negative before it), c metres to its left
const laneAt = (a, c) => [DROP.x + LANE.f[0] * a + LANE.l[0] * c, DROP.z + LANE.f[1] * a + LANE.l[1] * c];
const laneOf = (x, z) => [(x - DROP.x) * LANE.f[0] + (z - DROP.z) * LANE.f[1], (x - DROP.x) * LANE.l[0] + (z - DROP.z) * LANE.l[1]];
const ELM_AT = { x: -42, y: 3, z: -342 };
// THE MAY TREE (the second landmark): a thorn in full blossom on a low knoll in the bay west of the elm. Its foot is
// the knoll's top; pass: how near the line passes it (the middle of the 60 to 90 m asked); knoll: the knoll's radius;
// eye: the height of its crown's middle over its foot (the line leaves the elm at that height).
const MAY_AT = { x: -200, y: 8, z: -445, pass: 75, knoll: 46, eye: 22 };
// SUN.inside: the boss stands this far inside the vault's canvas, proud of every sky slab under it
const SUN = { x: 172, y: 140, z: -1365, across: 190, proud: 16, inside: 96 };
const VAULT = { x: -150, y: 0, z: -450, a: 1500, b: 320, c: 1050 };
const RIDGE = [
  { x0: -820, x1: -200, z: -1180, top: 150 }, { x0: -380, x1: 90, z: -1120, top: 125 },
  { x0: 60, x1: 640, z: -1160, top: 90 }, { x0: -1000, x1: -640, z: -1080, top: 95 },
];
// THE RIDGE GOES ON ROUND THE WEST: two more slabs of it, standing along x (z0 to z1), beyond the painted field's west edge
const RIDGE_WEST = [{ x: -1000, z0: -1110, z1: -560, top: 118 }, { x: -1060, z0: -640, z1: -120, top: 84 }];
// (bay: west of this x lies THE FAR BAY, the may tree's side of the field out to the west ridge's foot: broad strokes, its
// own wash streaks, no flower drifts of the meadow's own; east of it the home meadow)
const PAINTED = { x0: -960, bay: -380, x1: 340, rag0: 80, rag1: 80, z0: -14, z1: -1075 };
const BROOK = {
  // the centre line, from where it enters at the right foot (it flows toward us) up to the picture's right edge
  line: [[64, -14], [56, -44], [44, -76], [30, -120], [14, -170], [12, -225], [15, -270], [21, -325], [46, -385], [90, -415], [150, -432], [240, -452], [340, -468], [430, -478]],
  half: 8, surface: 0.8, speed: 3, bank: 2.5, short: 0.5,
  // the water keeps its blue: only the ridges of a stroke that stand above this share of its tracks' height carry the
  // sun's white sheen (well under half of any stroke's face, on every seed)
  sheenAt: 0.66,
};
const SCRAPE = { x: -6, z: -250, w: 40, d: 25 };

// ------------------------------------------------------------------ the route, from the measures of the place
// The first ENTRY.level metres level on the entry axis. From their end THE LINE COMES DOWN, in the mean one metre in
// ROUTE.sink of plan (eased at both ends), straight to the brook's west edge: the low run begins at the first place up that edge that lies so far from
// the level entry's end as that sinking needs (found on the brook's own line). LOW OVER THE WATER, ROUTE.low.over
// above it, up the brook's own course (a point to every ROUTE.low.step metres of brook), drawn aslant from its west
// edge to its east bank, as far as one pool's width before the pool's middle; round the east side of the pool, its
// rim ROUTE.pass.clear to the left; then IN TOWARD THE ELM on a curve about its own axis that draws in to the close
// pass: a circle the crown's greatest reach and ROUTE.elm.air of air from the trunk (so the crown's sunny side stands
// that air off), climbing gently to the height of the may tree's crown. THE LINE LEAVES THE TREE ALONG THE ONE
// STRAIGHT THAT TOUCHES BOTH TREES' CIRCLES, the elm's close pass and the may tree's (MAY_AT.pass about its knoll),
// both trees to the left of it: its bearing follows from the two places and the two radii. Then a RIGHT arc, a straight over
// the far meadow, a slight bend, the lane. From where the line leaves the elm its height is ONE GLIDE down to the
// lane's own. The two straights between the arcs are as long as the place makes them (a 2 by 2 solve of the elm's
// axis, the radii and the lane's line), not typed.
const ROUTE = {
  sink: 4, low: { over: 6, step: 30, west: -4, east: BROOK.half + 0.5 }, pass: { clear: 4, y: 8.5 },
  elm: { air: 32.5, climb: 1.6 },
  west: { step: 32 },
  right: { r: 90, to: -12 },
  far: { at: [0.36, 0.72], yEnd: 14 },
  bend: { r: 300 },
};
// a place d metres to the right of the brook's middle (looking up it) at metre m of its course
const brookSide = (m, d) => { const p = brookAt(m); return [p[0] - p[3] * d, p[1] + p[2] * d]; };
function routePlan() {
  const R = ROUTE, rE = ELM.reach + R.elm.air, yLow = BROOK.surface + R.low.over;
  // the straight that touches both circles: the bearing from the elm to the may tree, turned by the two radii
  const mx = MAY_AT.x - ELM_AT.x, mz = MAY_AT.z - ELM_AT.z, to = (Math.atan2(mx, -mz) + Math.asin((MAY_AT.pass - rE) / Math.hypot(mx, mz))) / DEG;
  const hB = head(to), hC = head(R.right.to), hD = LANE.f;
  const rB = rightOf(hB), rC = rightOf(hC), rD = rightOf(hD), bendDeg = LANE.az - R.right.to, sg = bendDeg < 0 ? -1 : 1;
  // where the low run begins (mA, by the sinking) and ends (mB), and where the line passes the pool (S0)
  const pm = POOL.m, H = [ENTRY.x, ENTRY.z - ENTRY.level], need = R.sink * (ENTRY.y - yLow);
  let mA = 0;
  for (let m = 0; m < pm; m += 0.5) { const q = brookSide(m, R.low.west); if (q[1] < H[1] && Math.hypot(q[0] - H[0], q[1] - H[1]) >= need) { mA = m; break; } }
  const mB = pm - 2 * POOL.r, S0 = brookSide(pm, POOL.r + R.pass.clear), L0 = brookSide(mA, R.low.west), L1 = brookSide(mB, R.low.east);
  const Q = [ELM_AT.x + rE * rB[0], ELM_AT.z + rE * rB[1]];
  const M = [DROP.x - LANE.straight * hD[0], DROP.z - LANE.straight * hD[1]];
  // Q + s1 hB + right.r (rB - rC) + s2 hC + sg bend.r (rC - rD) = M   (the bend turns right or left as the lane lies)
  const kx = M[0] - Q[0] - R.right.r * (rB[0] - rC[0]) - sg * R.bend.r * (rC[0] - rD[0]), kz = M[1] - Q[1] - R.right.r * (rB[1] - rC[1]) - sg * R.bend.r * (rC[1] - rD[1]);
  const det = hB[0] * hC[1] - hB[1] * hC[0], s1 = (kx * hC[1] - kz * hC[0]) / det, s2 = (hB[0] * kz - hB[1] * kx) / det;
  const R0 = [Q[0] + s1 * hB[0], Q[1] + s1 * hB[1]], cR = [R0[0] + R.right.r * rB[0], R0[1] + R.right.r * rB[1]];
  const P5 = [cR[0] - R.right.r * rC[0], cR[1] - R.right.r * rC[1]], P6 = [P5[0] + s2 * hC[0], P5[1] + s2 * hC[1]];
  const cB = [P6[0] + sg * R.bend.r * rC[0], P6[1] + sg * R.bend.r * rC[1]];
  return { rE, to, yLow, mA, mB, H, S0, L0, L1, A0: S0, Q, R0, cR, P5, P6, cB, M, s1, s2, bendDeg, sg, y1: MAY_AT.y + MAY_AT.eye };
}
export function routePoints() {
  const R = ROUTE, P = routePlan(), pts = [], yLow = P.yLow;
  // the level entry: its last point doubled a twelfth of its length back, so that the curve leaves the axis only past its end
  for (const k of [0, 1 / 3, 2 / 3, 11 / 12, 1]) pts.push([ENTRY.x, ENTRY.y, ENTRY.z - ENTRY.level * k]);
  // the descent: one eased sinking along the straight from the level entry's end to the low run's start (level at
  // both its ends, steepest half way); a point at each quarter of it
  for (const k of [1 / 4, 1 / 2, 3 / 4]) pts.push([lerp(P.H[0], P.L0[0], k), lerp(ENTRY.y, yLow, smoothstep(0, 1, k)), lerp(P.H[1], P.L0[1], k)]);
  // the low run up the brook, aslant from its west edge to its east bank
  const nL = Math.max(2, Math.round((P.mB - P.mA) / R.low.step));
  for (let i = 0; i <= nL; i++) { const q = brookSide(lerp(P.mA, P.mB, i / nL), lerp(R.low.west, R.low.east, i / nL)); pts.push([q[0], yLow, q[1]]); }
  // IN TOWARD THE ELM: polar about its axis from S0 (at the pool) round to Q. The distance draws in with the square
  // of the way still to go, so that the curve leaves S0 along the line it came on (the sweep follows from that) and
  // meets the circle of the close pass without a kink; a point every 12 degrees; the climb steepest at first and
  // spent as the far side is reached (the power ROUTE.elm.climb).
  const rel = [P.S0[0] - ELM_AT.x, P.S0[1] - ELM_AT.z], r0 = Math.hypot(rel[0], rel[1]), phi0 = Math.atan2(rel[0], -rel[1]) / DEG, phi1 = P.to + 90;
  const hin = Math.atan2(P.S0[0] - P.L1[0], -(P.S0[1] - P.L1[1])) / DEG, psi = hin - Math.atan2(-rel[0], rel[1]) / DEG;
  const sweep = 2 * (r0 - P.rE) * Math.tan(psi * DEG) / r0 / DEG, phim = phi0 - sweep, nS = Math.round((phi0 - phi1) / 12);
  for (let i = 0; i <= nS; i++) {
    const k = i / nS, phi = lerp(phi0, phi1, k), q = clamp((phi - phim) / (phi0 - phim), 0, 1), r = P.rE + (r0 - P.rE) * q * q, d = head(phi);
    pts.push([ELM_AT.x + r * d[0], lerp(R.pass.y, P.y1, 1 - Math.pow(1 - k, R.elm.climb)), ELM_AT.z + r * d[1]]);
  }
  // the straight on from the tree (points every ROUTE.west.step metres of it), then the right arc: a point every
  // 15.5 degrees; then the far meadow's straight. The height is the glide's, by the metres from the pass's end.
  const hB = head(P.to), arcLen = R.right.r * (R.right.to - P.to) * DEG, glideLen = P.s1 + arcLen + P.s2;
  const glide = (d) => lerp(P.y1, R.far.yEnd, smoothstep(0, glideLen, d));
  const nW = Math.max(1, Math.round(P.s1 / R.west.step));
  for (let i = 1; i < nW; i++) pts.push([P.Q[0] + hB[0] * P.s1 * i / nW, glide(P.s1 * i / nW), P.Q[1] + hB[1] * P.s1 * i / nW]);
  const nR = Math.max(2, Math.round((R.right.to - P.to) / 15.5));
  for (let i = 0; i <= nR; i++) {
    const k = i / nR, r = rightOf(head(lerp(P.to, R.right.to, k)));
    pts.push([P.cR[0] - R.right.r * r[0], glide(P.s1 + arcLen * k), P.cR[1] - R.right.r * r[1]]);
  }
  const hC = head(R.right.to);
  for (const k of R.far.at) pts.push([P.P5[0] + hC[0] * P.s2 * k, glide(P.s1 + arcLen + P.s2 * k), P.P5[1] + hC[1] * P.s2 * k]);
  pts.push([P.P6[0], R.far.yEnd, P.P6[1]]);
  // the bend onto the lane: one point half way round it; then the lane, a point every 26 m, all on its line at the drop's height
  const rm = rightOf(head(R.right.to + P.bendDeg / 2));
  pts.push([P.cB[0] - P.sg * R.bend.r * rm[0], DROP.y, P.cB[1] - P.sg * R.bend.r * rm[1]]);
  for (let i = 0; i <= 5; i++) pts.push([P.M[0] + LANE.f[0] * LANE.straight * i / 5, DROP.y, P.M[1] + LANE.f[1] * LANE.straight * i / 5]);
  return pts;
}

// ------------------------------------------------------------------ the brook's line and the ground
// The brook's centre line as a smooth curve through BROOK.line, read by metres along it from its near end (the right
// foot); brookAt(m) gives [x, z, tangent x, tangent z]; brookNear(x, z) the plan distance to the line and the metres.
const brookCurve = (() => {
  const c = new THREE.CatmullRomCurve3(BROOK.line.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  c.arcLengthDivisions = 600; const length = c.getLength(), N = 300, sx = new Float32Array(N + 1), sz = new Float32Array(N + 1), v = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { c.getPointAt(i / N, v); sx[i] = v.x; sz[i] = v.z; }
  return { c, length, N, sx, sz };
})();
const BROOK_LEN = brookCurve.length;
function brookAt(m, out = [0, 0, 0, 0]) {
  const B = brookCurve, k = clamp(m / B.length, 0, 1) * B.N, i = Math.min(B.N - 1, Math.floor(k)), f = k - i;
  const tx = B.sx[i + 1] - B.sx[i], tz = B.sz[i + 1] - B.sz[i], l = Math.hypot(tx, tz) || 1;
  out[0] = lerp(B.sx[i], B.sx[i + 1], f); out[1] = lerp(B.sz[i], B.sz[i + 1], f); out[2] = tx / l; out[3] = tz / l;
  return out;
}
// (the samples are kept in blocks of BROOK_BLOCK with the box each block lies in: a block whose box is further off than
// the nearest sample found so far is passed over; the answer is the same as from every sample in turn, the first of
// equals standing)
const BROOK_BLOCK = 16;
const brookBoxes = (() => {
  const B = brookCurve, n = Math.ceil((B.N + 1) / BROOK_BLOCK), box = new Float64Array(n * 4);
  for (let k = 0; k < n; k++) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = k * BROOK_BLOCK; i < Math.min(B.N + 1, (k + 1) * BROOK_BLOCK); i++) { x0 = Math.min(x0, B.sx[i]); x1 = Math.max(x1, B.sx[i]); z0 = Math.min(z0, B.sz[i]); z1 = Math.max(z1, B.sz[i]); }
    box[k * 4] = x0; box[k * 4 + 1] = x1; box[k * 4 + 2] = z0; box[k * 4 + 3] = z1;
  }
  return { n, box, low: new Float64Array(n) };
})();
function brookNear(x, z) {
  const B = brookCurve, K = brookBoxes, box = K.box, low = K.low; let best = Infinity, bi = 0, first = 0, least = Infinity;
  // how near each block's box comes (squared), and the block whose box is nearest
  for (let k = 0; k < K.n; k++) {
    const o = k * 4, ex = Math.max(box[o] - x, 0, x - box[o + 1]), ez = Math.max(box[o + 2] - z, 0, z - box[o + 3]), e = ex * ex + ez * ez;
    low[k] = e; if (e < least) { least = e; first = k; }
  }
  for (let pass = 0; pass < K.n + 1; pass++) {
    const k = pass === 0 ? first : pass - 1; if (pass > 0 && (k === first || low[k] > best * 1.000001)) continue;
    for (let i = k * BROOK_BLOCK, end = Math.min(B.N + 1, (k + 1) * BROOK_BLOCK); i < end; i++) {
      const dx = B.sx[i] - x, dz = B.sz[i] - z, d = dx * dx + dz * dz; if (d < best || (d === best && i < bi)) { best = d; bi = i; }
    }
  }
  return { dist: Math.sqrt(best), m: bi / B.N * B.length };
}
// THE WEST ARM OF THE BROOK (the brook comes back): a second course, ARM.half to either hand of its line, that joins
// the brook at its bend beyond the elm (the brook's own point BROOK.line[ARM.joins]). Read up its course from there:
// it skirts the far side of the elm's knoll ARM.skirt from the trunk, runs to the may tree's knoll and BENDS ROUND
// ITS FOOT on the side toward the line (ARM.round from the trunk: the knoll's radius and the water's half width; at
// the bearings ARM.bend from the tree), and RISES at the knoll's west foot (the last of those bearings): there its
// water thins to nothing over ARM.rise. Its line is made of those named places; the same on every seed. armAt(m) gives [x, z, tangent x, tangent z]
// at m metres up it from the brook; armNear(x, z) the plan distance to its line and the metres.
const ARM = { joins: 8, half: 6, skirt: 95, round: MAY_AT.knoll + 6, bend: [80, 35, -10, -55, -100], rise: 40, surface: 0.8, speed: 2.4, box: 40 };
const armCurve = (() => {
  const pts = [BROOK.line[ARM.joins], [ELM_AT.x, ELM_AT.z - ARM.skirt]];
  for (const az of ARM.bend) { const h = head(az); pts.push([MAY_AT.x + h[0] * ARM.round, MAY_AT.z + h[1] * ARM.round]); }
  const c = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], 0, q[1])), false, 'centripetal');
  c.arcLengthDivisions = 500; const length = c.getLength(), N = Math.ceil(length / 2.5), sx = new Float32Array(N + 1), sz = new Float32Array(N + 1), v = new THREE.Vector3();
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i <= N; i++) { c.getPointAt(i / N, v); sx[i] = v.x; sz[i] = v.z; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); }
  return { length, N, sx, sz, x0, x1, z0, z1 };
})();
const ARM_LEN = armCurve.length;
function armAt(m, out = [0, 0, 0, 0]) {
  const A = armCurve, k = clamp(m / A.length, 0, 1) * A.N, i = Math.min(A.N - 1, Math.floor(k)), f = k - i;
  const tx = A.sx[i + 1] - A.sx[i], tz = A.sz[i + 1] - A.sz[i], l = Math.hypot(tx, tz) || 1;
  out[0] = lerp(A.sx[i], A.sx[i + 1], f); out[1] = lerp(A.sz[i], A.sz[i + 1], f); out[2] = tx / l; out[3] = tz / l;
  return out;
}
// (a place further than ARM.box from the box the arm lies in is answered at once: ARM.box away, at the arm's foot)
const _an = { dist: 0, m: 0 };
function armNear(x, z) {
  const A = armCurve; _an.dist = ARM.box; _an.m = 0;
  if (x < A.x0 - ARM.box || x > A.x1 + ARM.box || z < A.z0 - ARM.box || z > A.z1 + ARM.box) return _an;
  let best = Infinity, bi = 0;
  for (let i = 0; i <= A.N; i++) { const dx = A.sx[i] - x, dz = A.sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
  _an.dist = Math.sqrt(best); _an.m = bi / A.N * A.length;
  return _an;
}
// THE STEP IN THE BROOK: beside the far end of the scraped patch the brook pours over a ledge POOL.fall high, POOL.lip
// metres upstream of the middle of a round pool POOL.r in radius. Upstream of the ledge the water and its bed stand
// that much higher (brookRise). The pool's middle lies on the brook's own line.
const POOL = { r: 12, fall: 2.2, lip: 15 };
POOL.m = brookNear(SCRAPE.x, SCRAPE.z - SCRAPE.d / 2).m; POOL.at = brookAt(POOL.m).slice();
const brookRise = (m) => POOL.fall * smoothstep(POOL.m + POOL.lip - 1.5, POOL.m + POOL.lip + 1.5, m);
// how far a place lies from the water (the brook's bed, the pool's round or the west arm's bed), in metres; negative in it
const waterOut = (x, z) => Math.min(brookNear(x, z).dist - BROOK.half, Math.hypot(x - POOL.at[0], z - POOL.at[1]) - POOL.r, armNear(x, z).dist - ARM.half);
// how far inside the painted field a place lies (metres; negative outside): the field is the rectangle PAINTED
const insidePaint = (x, z) => Math.min(x - PAINTED.x0, PAINTED.x1 - x, PAINTED.z0 - z, z - PAINTED.z1);
// THE GROUND: primed canvas at y 0; under the paint it swells gently in level bands (0 to 5 m); the brook lies in its
// low line; the elm stands on a knoll at y ELM_AT.y; the lane's floor is level at LANE.floor inside the belt; the
// foreground under the entry lies low. One fixed law, the same on every seed.
function groundY(x, z) {
  const sw = clamp(2.4 + 1.5 * Math.sin(x / 97 + 1.3) * Math.cos(z / 131 + 0.4) + 1.1 * Math.sin(x / 43 - z / 61) * Math.sin(z / 37 + 2.2), 0, 5);
  let y = sw * smoothstep(-20, 60, insidePaint(x, z));
  y = lerp(1, y, smoothstep(60, 110, -z));
  const de = Math.hypot(x - ELM_AT.x, z - ELM_AT.z); y = lerp(y, ELM_AT.y, smoothstep(58, 12, de));
  y = lerp(y, MAY_AT.y, smoothstep(MAY_AT.knoll, MAY_AT.knoll * 0.25, Math.hypot(x - MAY_AT.x, z - MAY_AT.z)));
  const [a, c] = laneOf(x, z), belt = smoothstep(LANE.before + 45, LANE.before, -a) * smoothstep(LANE.beyond + 45, LANE.beyond, a) * smoothstep(LANE.side + 40, LANE.side, Math.abs(c));
  y = lerp(y, LANE.floor, belt);
  // the brook's bed lies low; the pool's too; upstream of the ledge the bed stands higher by the fall
  const bn = brookNear(x, z), dp = Math.hypot(x - POOL.at[0], z - POOL.at[1]);
  return lerp(0.15 + brookRise(bn.m), y, Math.min(smoothstep(BROOK.half + 2, BROOK.half + 24, bn.dist), smoothstep(POOL.r + 2, POOL.r + 22, dp), smoothstep(ARM.half + 2, ARM.half + 20, armNear(x, z).dist)));
}
export const fieldPlace = { ARM, ARM_LEN, armAt, armNear, ENTRY, DROP, LANE, ELM_AT, MAY_AT, SUN, VAULT, RIDGE, BROOK, PAINTED, POOL, SCRAPE, ROUTE, routePlan, brookRise, laneAt, laneOf, groundY, brookAt, brookNear, BROOK_LEN };

// ------------------------------------------------------------------ what stands: one maker, one measure
const TAU = Math.PI * 2;
const GRASS = { lit: lin('#86B347'), olive: lin('#93A93E'), mid: lin('#5E9A3F'), deep: lin('#2C6B3C'), blue: lin('#2F7A5A'), shade: lin('#173F33'), pale: lin('#A8C257') };
const grassColours = (rng) => {
  const lights = [GRASS.lit, GRASS.olive, GRASS.mid, GRASS.pale], darks = [GRASS.deep, GRASS.blue, GRASS.shade];
  return [mul3(mix3(rng.pick(lights), rng.pick(lights), rng()), rng.range(0.85, 1.1)), mix3(rng.pick(darks), rng.pick(darks), rng())];
};
// A standing stroke rooted at (x, z) on ground y: o.tall metres high, its tip leaning o.lean (a share of its height)
// toward o.leanTo (radians in plan; dealt if not given), bowed by its own draw, its face turned toward o.face.
function standing(rng, x, z, y, o) {
  const tall = rng.range(o.tall[0], o.tall[1]), la = o.leanTo ?? rng.range(0, TAU), lean = rng.range(o.lean?.[0] ?? 0, o.lean?.[1] ?? 0.1) * tall;
  const fa = (o.face ?? rng.range(0, TAU)) + rng.range(-1, 1) * (o.faceTurn ?? 0.5), bow = rng.range(-1, 1) * (o.bow ?? 0.05) * tall, ba = la + rng.range(-0.6, 0.6);
  const [ca, cb] = o.colours || grassColours(rng);
  return { h: [x, y - 0.8, z], e: [x + Math.cos(la) * lean, y + tall, z + Math.sin(la) * lean], b: [Math.cos(ba) * bow, 0, Math.sin(ba) * bow], n: [Math.cos(fa), o.faceUp ?? 0, Math.sin(fa)],
    w: rng.range(o.w[0], o.w[1]), th: rng.range(o.th?.[0] ?? 1.2, o.th?.[1] ?? 2), ca, cb, seed: rng(), wind: rng.range(o.wind[0], o.wind[1]), taper: rng.range(o.taper?.[0] ?? 0.25, o.taper?.[1] ?? 0.5) };
}
// The skin of a stroke at the worst of the wind, as a list of [x, y, z, reach]: its four section corners at 13 shares
// of its length, each with the metres the wind may carry it (in the level plane). Every test of clear air uses it.
function skinOf(s) {
  const out = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, wr = windReach(s.wind || 0, t); for (const q of strokeSkin(s, t)) out.push([q[0], q[1], q[2], wr]); }
  return out;
}
// Move a stroke in plan by (dx, dz)
const shift = (s, dx, dz) => { s.h[0] += dx; s.h[2] += dz; s.e[0] += dx; s.e[2] += dz; return s; };

// The flown line as points a metre apart, in cells of NEAR.cell metres, for every test of clear air: near.plan(x, z)
// gives the plan distance to the line and the line's height there; near.dist(x, y, z) the distance in space. Both are
// exact up to NEAR.cell metres and say NEAR.cell beyond that.
const NEAR = { cell: 64, step: 8 };
// FORMS BY PLACE (chosen once at build from the fixed line, never from the eye): a lying stroke or a stalk further
// than FAR.flat from the line in plan is the three-piece ribbon, a flower dab further than FAR.dab the face alone; a
// lane wall stroke rooted further than FAR.wall[0] from the lane's axis is the fuller ribbon with fewer rings, further
// than FAR.wall[1] the six-sided one; a belt stroke further than FAR.belt from the lane's axis the open ribbon.
const FAR = { flat: 120, dab: 80, wall: [19, 34], belt: 150, fore: 13, full: 26 };
async function routeNear(path, yieldFn = null) {
  const cells = new Map(), key = (i, j) => i * 4096 + j, v = new THREE.Vector3(), n = Math.floor(path.length) + 1;
  // the points' places, each list by the point's own number (its metres along the route)
  const px = new Float64Array(n), py = new Float64Array(n), pz = new Float64Array(n);
  for (let q = 0; q < n; q++) {
    path.posAtDist(q, v); px[q] = v.x; py[q] = v.y; pz[q] = v.z;
    const k = key(Math.floor(v.x / NEAR.cell), Math.floor(v.z / NEAR.cell)); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(q);
    if (yieldFn && q % 100 === 99) await yieldFn();
  }
  return {
    plan(x, z) {
      let best = NEAR.cell * NEAR.cell, y = 0, m = -1; const ci = Math.floor(x / NEAR.cell), cj = Math.floor(z / NEAR.cell);
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
        const c = cells.get(key(i, j)); if (!c) continue;
        for (let k = 0; k < c.length; k++) { const q = c[k], d = (px[q] - x) ** 2 + (pz[q] - z) ** 2; if (d < best) { best = d; y = py[q]; m = q; } }
      }
      return { dist: Math.sqrt(best), y, m };
    },
    dist(x, y, z) {
      let best = NEAR.cell * NEAR.cell; const ci = Math.floor(x / NEAR.cell), cj = Math.floor(z / NEAR.cell);
      for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
        const c = cells.get(key(i, j)); if (!c) continue;
        for (let k = 0; k < c.length; k++) { const q = c[k], d = (px[q] - x) ** 2 + (py[q] - y) ** 2 + (pz[q] - z) ** 2; if (d < best) best = d; }
      }
      return Math.sqrt(best);
    },
    // the plan distance to the line at any range, from its points every NEAR.step metres (for choosing a far thing's
    // form at build; no test of clear air uses it)
    far(x, z) { let best = Infinity; for (let q = 0; q < n; q += NEAR.step) { const d = (px[q] - x) ** 2 + (pz[q] - z) ** 2; if (d < best) best = d; } return Math.sqrt(best); },
    // the least clear air between the line and a stroke's skin at the worst of the wind
    clear(s) { let best = NEAR.cell; for (const q of skinOf(s)) best = Math.min(best, this.dist(q[0], q[1], q[2]) - q[3]); return best; },
  };
}

// ------------------------------------------------------------------ THE FOREGROUND GRASS (one fixed stream: the same on every seed)
// Under and near the entry axis FORE.under strokes stand FORE.tall metres; to either side FORE.sides taller ones.
// THEIR RULES, each tested on the skin at the worst of the wind, a stroke that breaks one being cut shorter or moved
// out by what it lacks: (1) no tip nearer under the line than FORE.under4 (so none above y 26 where the line is level);
// (2) THE BROOK'S WEDGE, between the entry axis and azimuth FORE.brook from E and never narrower than x 0 to 8: nothing
// above y 17 deeper than z -30, nothing above y 22 nearer; (3) the side strokes keep out of the LEFT wedge (axis to
// azimuth -19: the elm's and the drop's side) and the RIGHT wedge (axis to +14: the sun's side) and never cross the
// axis; (4) nothing stands at z over ENTRY.clear; (5) the side strokes on the brook's hand stand low (see there).
const FORE = { under: 60, sides: 50, x: 24, xSide: [24, 60], z: [-16, -75], tall: [14, 24], tallSide: [30, 40], under4: 4, brook: 9, brookX: 8, left: -19, right: 14, sight: 24, sunny: [0.6, 0.45], open: 1.7, brookSide: [9, 15] };
async function foregroundGrass(near, yieldFn = null) {
  const r = makeRng(hashSeed(FIXED + ':foreground')), under = [], sides = [];
  const az = (x, z) => Math.atan2(x, ENTRY.z - z) / DEG;
  // how much too tall a stroke stands by rules 1 and 2 (metres; 0 or less is well)
  const tooTall = (s) => {
    let over = 0;
    for (const q of skinOf(s)) {
      const pl = near.plan(q[0], q[2]); if (pl.dist - q[3] < 12) over = Math.max(over, q[1] - (pl.y - FORE.under4));
      const edge = Math.max(FORE.brookX, Math.tan(FORE.brook * DEG) * (ENTRY.z - q[2]));
      if (q[0] + q[3] > 0 && q[0] - q[3] < edge) over = Math.max(over, q[1] - (q[2] < -30 ? 17 : 22));
      // (2b) THE SIGHT OF THE BROOK: out to azimuth FORE.sight no part stands above the straight sight from the entry
      // eye to the water that lies that way (so the brook is seen from the first frame)
      const a = az(q[0], q[2]), D = a > 0 && a < FORE.sight ? waterWay(a) : 0, d = Math.hypot(q[0] - ENTRY.x, q[2] - ENTRY.z);
      if (D > d) over = Math.max(over, q[1] - (ENTRY.y - (ENTRY.y - BROOK.surface - 1) * d / D - 0.5));
    }
    return over;
  };
  // how far from the entry the brook's middle lies along an azimuth (0 where no water lies that way within 2 degrees)
  // (a table to every half degree, made once from the brook's line)
  const way = new Float64Array(2 * FORE.sight + 2), off = new Float64Array(2 * FORE.sight + 2).fill(2);
  for (let m = 0; m < BROOK_LEN; m += 4) { const p = brookAt(m), wa = az(p[0], p[1]), wd = Math.hypot(p[0] - ENTRY.x, p[1] - ENTRY.z); for (let i = Math.max(0, Math.floor(2 * wa) - 3); i <= Math.min(way.length - 1, Math.ceil(2 * wa) + 3); i++) if (Math.abs(i / 2 - wa) < off[i]) { off[i] = Math.abs(i / 2 - wa); way[i] = wd; } }
  const waterWay = (a) => way[Math.round(2 * a)];
  for (let i = 0; i < FORE.under; i++) {
    const x = r.range(-FORE.x, FORE.x), z = lerp(FORE.z[0], FORE.z[1], (i + r()) / FORE.under), y = groundY(x, z);
    const s = standing(r, x, z, y, { tall: FORE.tall, lean: [0.03, 0.16], face: Math.PI / 2, faceTurn: 0.9, bow: 0.06, w: [5, 8.5], th: [1.3, 2.2], wind: [1.2, 2.6], taper: [0.25, 0.5] });
    for (let k = 0; k < 12; k++) { const over = tooTall(s); if (over <= 0) break; s.e[1] -= over + 0.25; if (yieldFn) await yieldFn(); }
    // rule 4: its whole skin behind the line z = ENTRY.clear
    let fwd = -1e9; for (const q of skinOf(s)) fwd = Math.max(fwd, q[2] + q[3] - ENTRY.clear); if (fwd > 0) shift(s, 0, -fwd - 0.2);
    under.push(s);
    if (yieldFn) await yieldFn();
  }
  // the foreground stands in the morning sun: its local colours are the sunny yellow greens (FORE.sunny of the way to
  // them from what the stream dealt); the darks are its shade sides and the gaps at its roots
  for (const st of under) { st.ca = mix3(st.ca, GRASS.pale, FORE.sunny[0]); st.cb = mix3(st.cb, GRASS.lit, FORE.sunny[1]); }
  for (let i = 0; i < FORE.sides; i++) {
    const sg = i % 2 ? 1 : -1, z = lerp(FORE.z[0], FORE.z[1], (i + r()) / FORE.sides), x = sg * r.range(z < -50 && sg > 0 ? 30 : FORE.xSide[0], FORE.xSide[1]);
    // they lean outward or stand upright, never inward
    const s = standing(r, x, z, groundY(x, z), { tall: FORE.tallSide, lean: [0, 0.1], leanTo: (sg > 0 ? 0 : Math.PI) + r.range(-0.9, 0.9), face: Math.PI / 2, faceTurn: 1.1, bow: 0.04, w: [5.5, 9], th: [1.5, 2.4], wind: [1.5, 3.5], taper: [0.25, 0.5] });
    // rule 3: by how many metres its skin stands inside a wedge, at the worst of the wind
    let lack = 0, fwd = -1e9;
    for (const q of skinOf(s)) { const lim = Math.tan((sg > 0 ? FORE.right : -FORE.left) * DEG) * (ENTRY.z - q[2]); lack = Math.max(lack, lim - (sg * q[0] - q[3])); fwd = Math.max(fwd, q[2] + q[3] - ENTRY.clear); }
    shift(s, lack > 0 ? sg * (lack + 0.3) : 0, fwd > 0 ? -fwd - 0.2 : 0);
    s.ca = mix3(s.ca, GRASS.pale, FORE.sunny[0] * 0.7); s.cb = mix3(s.cb, GRASS.lit, FORE.sunny[1] * 0.7);
    // rule 5, THE BROOK'S CORNER STANDS OPEN: a side stroke on the brook's hand (the right) stands only FORE.brookSide
    // tall, by its own seed (dealt as every other, then cut: the stream stands), so the picture's lower right
    // corner, where the brook comes in, is not covered; the left corner keeps its clump
    if (sg > 0) { const k = lerp(FORE.brookSide[0], FORE.brookSide[1], s.seed) / (s.e[1] - s.h[1]); for (let j = 0; j < 3; j++) { s.e[j] = s.h[j] + (s.e[j] - s.h[j]) * k; s.b[j] *= k; } s.wind *= k; }
    sides.push(s);
    if (yieldFn) await yieldFn();
  }
  return { under, sides, az };
}

// ------------------------------------------------------------------ THE LANE (one fixed stream: the same on every seed)
// The belt's strokes within LANE.fixedSide of the lane's axis: a row along each side whose skins stand LANE.half from
// the axis, and rows behind them. THE LANE'S RULE, for every one of them: no skin nearer the axis than LANE.half at
// rest nor LANE.half - 2.5 at the worst of its bending, at any height; beyond the blade's plane none within
// LANE.beyondClear. THE BLADE'S BAY: on the left, over the last LANE.bay.len metres before the opening's plane and out
// to LANE.bay.out from the axis, no part of a stroke above LANE.bay.top. A stroke that would break a rule is moved out
// from the axis by what it lacks, or (the bay) dealt low. The first row on the sun's hand is the first row of the sun's
// wall (see THE SUN'S WALL); each stroke carries its row (first) and its hand (side).
const BELT_TALL = [40, 60], BAY_TALL = [20, 24];
async function laneWalls(yieldFn = null) {
  const r = makeRng(hashSeed(FIXED + ':lane walls')), out = [];
  const inBay = (a, c) => a > -LANE.bay.len - 5 && a < LANE.bladeBack + 4 && c > 0 && c < LANE.bay.out + 6;
  const place = (a, c, sg, first = false) => {
    const [x, z] = laneAt(a, c), low = inBay(a, c);
    // its face looks across the lane, turned by its own draw; it leans along the lane or away from it, never over it
    const face = Math.atan2(-sg * LANE.l[1], -sg * LANE.l[0]), away = Math.atan2(sg * LANE.l[1], sg * LANE.l[0]) + r.range(-1.3, 1.3);
    const s = standing(r, x, z, LANE.floor, { tall: low ? BAY_TALL : BELT_TALL, lean: [0.02, 0.09], leanTo: away, face, faceTurn: 0.6, bow: 0.04, w: [6, 10], th: [1.5, 2.5], wind: low ? [1, 1.8] : [2, 4], taper: [0.3, 0.55] });
    // the lane's rule: how near the axis the skin comes, at rest and at the worst of its bending
    let lack = 0;
    for (const q of skinOf(s)) {
      const [qa, qc] = laneOf(q[0], q[2]), need = qa > LANE.bladeBack - 1 ? LANE.beyondClear : LANE.half;
      lack = Math.max(lack, need - Math.abs(qc), need - 2.5 - (Math.abs(qc) - q[3]));
    }
    if (lack > 0) shift(s, sg * LANE.l[0] * (lack + 0.2), sg * LANE.l[1] * (lack + 0.2));
    s.low = low; s.side = sg; s.first = first; s.sunWall = first && sg < 0; out.push(s);
  };
  for (const sg of [1, -1]) {
    // the row that walls the lane
    for (let a = -LANE.before + r.range(0, 4); a < LANE.beyond; a += r.range(6, 9)) { place(a, sg * (LANE.half + r.range(3.2, 6)), sg, true); if (yieldFn) await yieldFn(); }
    // the rows behind it
    for (let i = 0; i < 46; i++) { place(r.range(-LANE.before, LANE.beyond), sg * r.range(20, LANE.fixedSide), sg); if (yieldFn) await yieldFn(); }
  }
  return out;
}
// THE LANE'S OWN MEASURES: its mouth is the belt's face (LANE.before before the drop); its last LANE.last metres are
// the join's; laneShare(k) is the place k of the way along the wall rows from the mouth to the start of the last
// LANE.last metres (metres along the lane from the drop). Everything of the lane is placed by these and by bearings of
// the world; nothing by metres that a flight would count.
LANE.last = 60;
const laneShare = (k) => -LANE.before + (LANE.before - LANE.last) * k;
// THE SUN AS A PLACE: the boss's body (its heart's middle C, its half width), and from any place its bearing az, its
// height el and its half width rad (radians).
const sunBody = () => { const to = [-20 - SUN.x, 30 - SUN.y, -318 - SUN.z], tl = Math.hypot(...to); return { C: [SUN.x, SUN.y, SUN.z].map((v, k) => v + to[k] / tl * (SUN.inside + 9)), half: SUN.across / 2 }; };
const sunFrom = (x, y, z) => { const b = sunBody(), d = [b.C[0] - x, b.C[1] - y, b.C[2] - z], dl = Math.hypot(...d); return { az: Math.atan2(d[0], -d[2]), el: Math.asin(d[1] / dl), rad: Math.asin(b.half / dl) }; };
// how far a place lies to the right of the line that leaves p on the bearing az (radians), in plan
const rightOfLine = (x, z, p, az) => (x - p[0]) * Math.cos(az) + (z - p[1]) * Math.sin(az);
// THE RIDES: two gaps through the walls, both before the last LANE.last metres, their middles on the walls' first rows
// (RIDE.rowC from the axis) at the shares RIDE.at of the wall rows: THE LEFT RIDE at the first quarter, a straight way
// RIDE.half to either hand of the line from there toward the middle of the ridge's west slab (through it the ridge is
// seen); THE SUN'S RIDE at the third quarter on the sun's hand: there the wall stands open over RIDE.half to either
// hand of the key's own bearing, and behind that gap nothing is rooted on any sight from the gap to the sun's body
// (the ground between the line from the gap's nearer end toward the body's right limb and the line from its further
// end toward the body's left limb, each RIDE.pad degrees wider). THE SUN'S RIDE IS THE ONE PLACE WHERE THE SUN SHINES
// INTO THE LANE: its light lies in a bar across the floor on the key's bearing, and from the lane the sun is seen
// there, whole in the open ride, and nowhere else. No stroke of the walls, the variety or the belt is rooted in a
// ride (the streams deal as before; the one rooted there is left out).
const RIDE = { half: 8, at: [0.25, 0.75], rowC: LANE.half + 4.6, pad: 1.5 };
let _rides = null;
const rides = () => {
  if (_rides) return _rides;
  const gl = laneAt(laneShare(RIDE.at[0]), RIDE.rowC), to = [(RIDGE[3].x0 + RIDGE[3].x1) / 2 - gl[0], RIDGE[3].z - gl[1]], tl = Math.hypot(to[0], to[1]);
  // the sun's ride: the gap's two ends on the row, RIDE.half to either hand of the key's bearing through its middle
  const along = RIDE.half / Math.sin((KEY.az - LANE.az) * DEG), a = laneShare(RIDE.at[1]), g0 = laneAt(a - along, -RIDE.rowC), g1 = laneAt(a + along, -RIDE.rowC);
  const s0 = sunFrom(g0[0], DROP.y, g0[1]), s1 = sunFrom(g1[0], DROP.y, g1[1]);
  return (_rides = { left: { p: gl, u: [to[0] / tl, to[1] / tl] }, sun: { a, g0, g1, az0: s0.az + s0.rad + RIDE.pad * DEG, az1: s1.az - s1.rad - RIDE.pad * DEG } });
};
const inSunRide = (x, z, pad = 0) => { const R = rides().sun; return laneOf(x, z)[1] < -RIDE.rowC + 4.6 && rightOfLine(x, z, R.g0, R.az0) < pad && rightOfLine(x, z, R.g1, R.az1) > -pad; };
const inRide = (x, z, pad = 0) => {
  const R = rides().left, dx = x - R.p[0], dz = z - R.p[1];
  return (laneOf(x, z)[1] > 0 && Math.abs(dx * R.u[1] - dz * R.u[0]) < RIDE.half + pad) || inSunRide(x, z, pad);
};
// THE SUN IS NEVER BEHIND THE GRASS, BY TWO LAWS OF THE PLACE (no eye is asked):
// (1) THE SUN'S WALL. On the sun's hand the lane's wall is a CLOSED DOUBLE ROW from the gate to beyond the drop, open
// only at the sun's ride. Behind every gap of the first row (between two neighbours of it, and before its first
// stroke at the belt's face) stands one stroke of a second row, SUNWALL.back further from the axis on the sun's own
// bearing from that gap, its face square to that bearing, and SO WIDE that no gap is left against the sun's bearing:
// its width at the height the sun is seen through (its mean of root and tip widths) is the two neighbours' spacing as
// it lies across the sun's bearing at its widest (the sine of the bearing's greatest angle to the lane), and
// SUNWALL.lap more. THEIR TOPS STAND ABOVE THE SUN for every point of the lane's axis, by one inequality: a stroke c
// metres from the axis is tall enough if   tall >= (the line's height over the floor) + c / sin(least angle of the
// sun's bearing to the lane) * tan(greatest height of the body's top) + its sway + SUNWALL.over.   sunWallNeed(c)
// gives the right side; every stroke of the second row is dealt at least that tall, and the first row's least height
// (BELT_TALL[0]) is over it at its own distance (shown in the proofs).
// (2) THE SUN'S STRIP. From the far meadow the sun stands CLEAR over a hedge. The strip is the ground between two
// lines in plan: on its lane side the line through the gate's outer corner on the sun's hand on the bearing of the
// body's left limb from there (HEDGE.pad degrees wider); on its far side the line from where the flown line leaves
// the elm on the bearing of the body's right limb from there (as much wider). EVERY standing stroke with any part of
// its skin in the strip (belt, walls, gate or variety alike; the sun's wall alone stands whole) is a hedge: its top,
// at the worst of its sway, lies under    DROP.y + (ridgeLow - DROP.y) * d / (d + s) - HEDGE.under,    where ridgeLow
// is the least top of the ridge's slab under the sun, d the stroke's distance in plan from the far line (the straight
// from the elm, the right arc's chord, the far straight) and s its distance on to that slab along the widest bearing.
// That is the height of the sight to the ridge's top from the nearest and lowest the line can be; the line is never
// nearer nor lower, so from the line no hedge stroke reaches up to the ridge's top, over which the sun stands.
// A stroke is dealt as every other, then cut (the streams stand).
const SUNWALL = { back: 7.5, lap: 1.2, over: 4, w: [7, 13], tall: [46, 58], taper: [0.72, 0.85], front: [5, 12.5] };
const HEDGE = { pad: 1.5, under: 1.5, rag: 0.34, slab: 2 };
let _sunLaw = null;
const sunLaw = () => {
  if (_sunLaw) return _sunLaw;
  // the sun from the two ends of the lane's axis, at the line's own height: the least and greatest angle of its
  // bearing to the lane, the greatest height of its top
  const ends = [laneAt(-LANE.straight, 0), laneAt(0, 0)].map((q) => sunFrom(q[0], DROP.y, q[1])), ang = (e, sg) => e.az + sg * e.rad - LANE.az * DEG;
  const thMin = Math.min(...ends.map((e) => ang(e, -1))), thMax = Math.max(...ends.map((e) => ang(e, 1))), top = Math.max(...ends.map((e) => e.el + e.rad));
  // the strip's two lines
  const corner = laneAt(MORE.towerAt[0], -MORE.towerRoot[1]), sc = sunFrom(corner[0], DROP.y, corner[1]), P = routePlan(), sq = sunFrom(P.Q[0], P.y1, P.Q[1]);
  return (_sunLaw = { thMin, thMax, top, corner, azL: sc.az - sc.rad - HEDGE.pad * DEG, Q: P.Q, azR: sq.az + sq.rad + HEDGE.pad * DEG, far: [P.Q, P.R0, P.P5, P.P6], wide: Math.max(sq.az + sq.rad, sc.az + sc.rad),
    ridgeLow: RIDGE[HEDGE.slab].top * (1 - HEDGE.rag), ridgeZ: RIDGE[HEDGE.slab].z });
};
const sunWallNeed = (c, sway) => { const S = sunLaw(); return DROP.y - LANE.floor + c / Math.sin(S.thMin) * Math.tan(S.top) + sway + SUNWALL.over; };
const segDist = (x, z, a, b) => { const ux = b[0] - a[0], uz = b[1] - a[1], t = clamp(((x - a[0]) * ux + (z - a[1]) * uz) / (ux * ux + uz * uz), 0, 1); return Math.hypot(x - a[0] - ux * t, z - a[1] - uz * t); };
// the hedge's law for one stroke: it gives the stroke back, cut if any part of its skin stands in the sun's strip over its bound
function hedge(s) {
  if (s.sunWall) return s;
  const S = sunLaw();
  // (twice: the cut stroke's own skin is measured again, for its lean and sway move it a little in plan)
  for (let pass = 0; pass < 2; pass++) {
    let k = 1;
    for (const q of skinOf(s)) {
      if (rightOfLine(q[0], q[2], S.corner, S.azL) < -q[3] || rightOfLine(q[0], q[2], S.Q, S.azR) > q[3] || q[1] <= s.h[1] + 1) continue;
      let d = Infinity; for (let i = 0; i + 1 < S.far.length; i++) d = Math.min(d, segDist(q[0], q[2], S.far[i], S.far[i + 1]));
      const far = Math.max(0, q[2] - S.ridgeZ) / Math.cos(S.wide), bound = DROP.y + (S.ridgeLow - DROP.y) * d / (d + far) - HEDGE.under;
      if (q[1] > bound) k = Math.min(k, Math.max(0.05, (bound - s.h[1]) / (q[1] - s.h[1])));
    }
    if (k >= 1) break;
    k *= 0.985;
    for (let i = 0; i < 3; i++) { s.e[i] = s.h[i] + (s.e[i] - s.h[i]) * k; s.b[i] *= k; }
    s.wind *= k; s.sun = true;
  }
  return s;
}
// the sun's wall's second row, from the first row's own strokes on the sun's hand (a fixed stream of its own)
function sunWall(first) {
  const r = makeRng(hashSeed(FIXED + ":the sun's wall")), S = sunLaw(), out = [];
  const row = first.map((st) => laneOf(st.h[0], st.h[2])).filter((q) => q[1] < 0).sort((p, q) => p[0] - q[0]);
  const stand = (a, c, span) => {
    const [x, z] = laneAt(a, c), sun = sunFrom(x, DROP.y, z), k = head(sun.az / DEG), bx = x + k[0] * SUNWALL.back, bz = z + k[1] * SUNWALL.back, taper = r.range(SUNWALL.taper[0], SUNWALL.taper[1]);
    const w = clamp((span * Math.sin(S.thMax) + SUNWALL.lap) * 2 / (1 + taper), SUNWALL.w[0], SUNWALL.w[1]), wind = r.range(1.6, 2.6), need = sunWallNeed(-laneOf(bx, bz)[1], windReach(wind, 1));
    const tall = Math.max(need, r.range(SUNWALL.tall[0], SUNWALL.tall[1]));
    const st = standing(r, bx, bz, LANE.floor, { tall: [tall, tall], lean: [0.01, 0.04], leanTo: Math.atan2(k[1], k[0]) + r.range(-0.7, 0.7), face: Math.atan2(-k[1], -k[0]), faceTurn: 0.12, bow: 0.02, w: [w, w], th: [1.6, 2.4], wind: [wind, wind], taper: [taper, taper] });
    st.sunWall = true; st.side = -1;
    if (!inSunRide(bx, bz, w / 2)) out.push(st);
  };
  // across the belt's face, from the first row out to the gate's outer corner (the wall's front)
  for (const f of SUNWALL.front) stand(-LANE.before - 1, -RIDE.rowC - f + SUNWALL.back * Math.sin(S.thMin), 9);
  for (let i = 0; i + 1 < row.length; i++) stand((row[i][0] + row[i + 1][0]) / 2, (row[i][1] + row[i + 1][1]) / 2, row[i + 1][0] - row[i][0]);
  return out;
}
// THE ARCH: one great bent stroke that goes right over the lane as a gate we pass under, AT THE LANE'S MOUTH (the
// belt's face: far before the last 60 m, over which nothing goes). Rooted ARCH.root to the left of the axis there, its face toward the far meadow, it rises to a crest
// ARCH.crest high over the axis and comes down to its tip ARCH.tip (metres to the left: negative is right; height)
// ARCH.fwd further on. THE WALLS' OWN RULE HOLDS FOR IT: no part of its skin, at the worst of its bending, nearer the
// axis than LANE.half unless it stands ARCH.over and more over the line's own height; a stroke that would break it is
// raised by what it lacks (a bounded loop). The control point follows from the crest (the blade's own solve).
const ARCH = { root: 24, tip: [-23, 11], fwd: 7, crest: 38, w: 9.5, th: 2.4, over: 8, wind: 0.8, taper: 0.42 };
function archStroke() {
  const y0 = LANE.floor - 0.8, y2 = ARCH.tip[1], h = laneAt(-LANE.before, ARCH.root), e = laneAt(-LANE.before + ARCH.fwd, ARCH.tip[0]);
  const make = (crest) => {
    const crestOf = (cy) => { const t = (cy - y0) / (2 * cy - y0 - y2); return (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cy + t * t * y2; };
    let lo = crest, hi = 3 * crest;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (crestOf(mid) < crest) lo = mid; else hi = mid; }
    return { h: [h[0], y0, h[1]], e: [e[0], y2, e[1]], b: [0, (lo + hi) / 2 - (y0 + y2) / 2, 0], n: [-LANE.f[0], 0.15, -LANE.f[1]], w: ARCH.w, th: ARCH.th, ca: mix3(GRASS.lit, GRASS.pale, 0.5), cb: GRASS.deep, seed: 0.71, wind: ARCH.wind, taper: ARCH.taper };
  };
  // how much too low its skin stands where it is nearer the axis than the lane's half width (0 or less is well)
  const lackOf = (st) => { let lack = 0; for (let i = 0; i <= 120; i++) { const t = i / 120, wr = windReach(st.wind, t); for (const q of strokeSkin(st, t)) if (Math.abs(laneOf(q[0], q[2])[1]) - wr < LANE.half) lack = Math.max(lack, DROP.y + ARCH.over - q[1]); } return lack; };
  let crest = ARCH.crest, st = make(crest);
  for (let i = 0; i < 8; i++) { const lack = lackOf(st); if (lack <= 0) break; crest += lack + 0.5; st = make(crest); }
  return st;
}
// THE LANE'S GATE AND ITS VARIETY (one fixed stream of its own, added to the walls: the same on every seed).
// TOWERS: at the mouth, MORE.tower strokes to either hand, MORE.towerTall tall, rooted MORE.towerRoot from the axis and
// leaning in over the lane so that their tips stand MORE.towerTip from it high overhead (the lane's rule holds for
// them below MORE.free, which is far over the line; they stand before the last 60 m). GIANT FLOWERS: MORE.giants
// orange dabs on stalks MORE.giantTall tall, rooted outside the walls at the mouth, nodding in over the lane. VARIETY
// among the rows behind the walls: thin dark strokes MORE.tall tall, strokes bent right over along the lane, broad
// pale ones, and seed-head strokes (a thin stalk that broadens into an ochre head). Every one obeys the lane's rule,
// the blade's bay and the rides. The towers on the sun's hand are the front of the sun's wall and stand whole.
const MORE = { tower: 3, towerTall: [62, 74], towerRoot: [16, 23], towerTip: [4, 8], towerAt: [-127, -121], free: 40, giants: 5, giantTall: [36, 46], giantAt: [-128, -98], giantR: [3.4, 5], variety: 34, tall: [60, 70] };
function laneMore() {
  const r = makeRng(hashSeed(FIXED + ':the lane, its gate and its variety')), strokes = [], stalks = [], heads = [];
  const lackOf = (st, free) => { let lack = 0; for (const q of skinOf(st)) { if (free && q[1] > free) continue; const [qa, qc] = laneOf(q[0], q[2]), need = qa > LANE.bladeBack - 1 ? LANE.beyondClear : LANE.half; lack = Math.max(lack, need - Math.abs(qc), need - 2.5 - (Math.abs(qc) - q[3])); } return lack; };
  const out = (st, sg, free) => { const lack = lackOf(st, free); if (lack > 0) shift(st, sg * LANE.l[0] * (lack + 0.2), sg * LANE.l[1] * (lack + 0.2)); return st; };
  const dark = [GRASS.deep, GRASS.shade], pale = lin('#E4E6A0'), ochre = [lin('#C9A24A'), lin('#B8873A'), lin('#D8B866')], orange = [lin('#F29A2E'), lin('#F2C230'), lin('#EE7F22')];
  for (const sg of [1, -1]) for (let i = 0; i < MORE.tower; i++) {
    const a = r.range(MORE.towerAt[0], MORE.towerAt[1]), c0 = sg * r.range(MORE.towerRoot[0], MORE.towerRoot[1]), c1 = sg * r.range(MORE.towerTip[0], MORE.towerTip[1]), tall = r.range(MORE.towerTall[0], MORE.towerTall[1]);
    const [x0, z0] = laneAt(a, c0), [x1, z1] = laneAt(a + r.range(-4, 6), c1), bow = sg * r.range(7, 11), k = r();
    strokes.push(out({ h: [x0, LANE.floor - 0.8, z0], e: [x1, LANE.floor + tall, z1], b: [LANE.l[0] * bow, 0, LANE.l[1] * bow], n: [-sg * LANE.l[0] * 0.8 - LANE.f[0] * 0.6, 0, -sg * LANE.l[1] * 0.8 - LANE.f[1] * 0.6],
      w: r.range(5, 8), th: r.range(1.8, 2.6), tower: true, sunWall: sg < 0, ca: mix3(GRASS.lit, pale, k * 0.6), cb: mix3(GRASS.deep, GRASS.blue, r()), seed: r(), wind: r.range(1.5, 2.5), taper: r.range(0.3, 0.45) }, sg, MORE.free));
  }
  for (let i = 0; i < MORE.giants; i++) {
    // (all rooted on the left: their faces look down and across the lane to the sun's side, so the low sun lights the
    // orange that the eye sees from under them)
    const sg = 1, a = lerp(MORE.giantAt[0], MORE.giantAt[1], (i + r.range(0.2, 0.8)) / MORE.giants), tall = r.range(MORE.giantTall[0], MORE.giantTall[1]), R = r.range(MORE.giantR[0], MORE.giantR[1]);
    const [x0, z0] = laneAt(a, sg * r.range(13, 18)), [x1, z1] = laneAt(a + r.range(-3, 3), r.range(-3, 6.5)), bow = sg * r.range(5, 8), wind = r.range(2, 3), col = r.pick(orange);
    stalks.push(out({ h: [x0, LANE.floor - 0.8, z0], e: [x1, LANE.floor + tall, z1], b: [LANE.l[0] * bow, 6, LANE.l[1] * bow], n: [-LANE.f[0], 0, -LANE.f[1]], w: r.range(2.2, 3), th: 1.4, ca: mix3(GRASS.mid, GRASS.lit, r()), cb: GRASS.deep, seed: r(), wind, taper: 0.5 }, sg, MORE.free - 12));
    const tip = stalks[stalks.length - 1].e, ta = r.range(0, TAU), hx = Math.cos(ta) * R, hz = Math.sin(ta) * R;
    heads.push({ h: [tip[0] - hx, tip[1] + 0.6, tip[2] - hz], e: [tip[0] + hx, tip[1] + 0.6, tip[2] + hz], b: [0, 0, 0], n: [-LANE.l[0] * 0.62, -0.78, -LANE.l[1] * 0.62], w: 2 * R, th: R * 0.7, ca: col, cb: mix3(col, orange[1], r.range(0.2, 0.6)), seed: r(), wind: wind * 2, taper: 1 });
  }
  for (let i = 0; i < MORE.variety; i++) {
    const sg = i % 2 ? -1 : 1, a = r.range(-LANE.before + 2, LANE.beyond - 6), c = sg * r.range(17, 46), [x, z] = laneAt(a, c), kind = i % 4, along = Math.atan2(LANE.f[1], LANE.f[0]) + (r.chance(0.5) ? 0 : Math.PI) + r.range(-0.4, 0.4);
    const face = Math.atan2(-sg * LANE.l[1], -sg * LANE.l[0]);
    let st;
    if (kind === 0) st = standing(r, x, z, LANE.floor, { tall: MORE.tall, lean: [0.01, 0.05], face, faceTurn: 0.6, bow: 0.03, w: [3.4, 5], th: [1.2, 1.8], wind: [3, 5], taper: [0.2, 0.35], colours: [mix3(GRASS.deep, GRASS.blue, r()), r.pick(dark)] });
    else if (kind === 1) { st = standing(r, x, z, LANE.floor, { tall: [30, 38], lean: [0.55, 0.8], leanTo: along, face, faceTurn: 0.5, bow: 0, w: [6, 9], th: [1.5, 2.2], wind: [1.5, 2.5], taper: [0.3, 0.5] }); st.b = [0, r.range(26, 36), 0]; }
    else if (kind === 2) st = standing(r, x, z, LANE.floor, { tall: [32, 48], lean: [0.02, 0.1], face, faceTurn: 0.4, bow: 0.05, w: [12, 15], th: [2, 2.8], wind: [1.5, 3], taper: [0.35, 0.55], colours: [mix3(GRASS.lit, pale, r.range(0.4, 0.9)), mix3(GRASS.olive, GRASS.mid, r())] });
    else st = standing(r, x, z, LANE.floor, { tall: [46, 58], lean: [0.03, 0.12], face, faceTurn: 0.6, bow: 0.06, w: [2.1, 2.9], th: [1.6, 2.2], wind: [3, 4.5], taper: [1.7, 2.2], colours: [mix3(GRASS.olive, GRASS.mid, r()), r.pick(ochre)] });
    out(st, sg, 0);
    const low = sg > 0 && a > -LANE.bay.len - 10 && Math.abs(laneOf(st.h[0], st.h[2])[1]) < LANE.bay.out + 10;
    if (low || inRide(st.h[0], st.h[2])) continue;
    st.side = sg; strokes.push(st);
  }
  return { strokes, stalks, heads };
}
// THE PATH: strokes of path ochre laid along the lane's floor in PATH.files files, from before the mouth to PATH.before
// short of the opening's plane, 12 m under the line (one fixed stream).
const PATH = { files: [-3.4, 0.3, 3.8], len: [12, 24], w: [3.4, 5], before: 12, colours: [lin('#C9A24A'), lin('#D8BE72'), lin('#B99A4E'), lin('#E0CB8A')] };
function lanePath() {
  const r = makeRng(hashSeed(FIXED + ':the lane path')), out = [];
  for (const c0 of PATH.files) for (let a = -LANE.straight - 14 + r.range(0, 8); a < -PATH.before - PATH.len[0];) {
    const len = Math.min(r.range(PATH.len[0], PATH.len[1]), -PATH.before - a), c = c0 + r.range(-1, 1), [x0, z0] = laneAt(a, c), [x1, z1] = laneAt(a + len, c + r.range(-0.8, 0.8)), ca = r.pick(PATH.colours);
    const y0 = Math.max(groundY(x0, z0), groundY(x1, z1)) + 0.3;
    out.push({ h: [x0, y0, z0], e: [x1, y0, z1], b: [0, 0.2, 0], n: [0, 1, 0], w: r.range(PATH.w[0], PATH.w[1]), th: r.range(0.5, 0.8), ca, cb: mix3(ca, r.pick(PATH.colours), r.range(0.3, 0.8)), seed: r(), wind: 0, taper: r.range(0.5, 0.8) });
    a += len * r.range(0.8, 1.05);
  }
  return out;
}
// THE DEW'S DOUBLE FILE (one fixed stream): a short blade to every BEAD.step metres of either side of the lane, rooted
// BEAD.out from the axis (outside LANE.half at the worst of its small sway), its tip about the line's own height; on
// each tip a small clear bead that holds nothing, which shows one hard spark of the sun; none within BEAD.before of the
// opening's plane. BEAD.fall of them let go on the world clock: a bead falls from its tip to the floor and another
// stands there again (fallAt writes the falling one at a clock).
// THE BUTTERFLIES THAT CROSS THE LANE (the lane's own fixed stream: the same on every seed): a file of CROSS.n, gap
// metres apart, going at speed (m/s) along one straight line FROM THE LEFT RIDE TO THE SUN'S RIDE: from the point of
// the left ride's middle line CROSS.in beyond the wall's first row to the point of the sun's ride's middle line (the
// key's bearing through its gap's middle) as far beyond the first row on the sun's hand; at CROSS.y, two thirds of
// the walls' mean height (far over the line, and over the drop and its bower as the mouth sees them). A BUTTERFLY
// GROWS FROM NOTHING over the first CROSS.ease metres of the line and shrinks to nothing over the last, by its place
// on the line. The file runs on the world's clock whether we are there or not.
const CROSS = { n: 8, gap: 7, speed: 2.6, in: 10, ease: 8, y: LANE.floor + (BELT_TALL[0] + BELT_TALL[1]) / 3 };
function crossing() {
  const r = makeRng(hashSeed(FIXED + ':the lane crossing')), R = rides(), tl = CROSS.in / Math.max(0.2, R.left.u[0] * LANE.l[0] + R.left.u[1] * LANE.l[1]);
  const g = laneAt(R.sun.a, -RIDE.rowC), k = head(KEY.az), ts = CROSS.in / Math.sin((KEY.az - LANE.az) * DEG);
  const from = [R.left.p[0] + R.left.u[0] * tl, R.left.p[1] + R.left.u[1] * tl];
  const to = [g[0] + k[0] * ts, g[1] + k[1] * ts], list = [];
  for (let i = 0; i < CROSS.n; i++) list.push({ i, x: 0, y: CROSS.y, z: 0, f: [r.range(0.5, 0.9), r.range(0.7, 1.2), r.range(0.4, 0.8)], q: [r.range(0, TAU), r.range(0, TAU), r.range(0, TAU)], beat: r.range(9, 13), beatPhase: r.range(0, TAU), col: r.pick(FLIT.colours), seed: r() });
  return { from, to, len: Math.hypot(to[0] - from[0], to[1] - from[1]), list };
}
// writes crosser k at a clock into the two wing strokes: its place on the line, its size by that place
function crossAt(C, k, time, out) {
  const along = (k.i * CROSS.gap + CROSS.speed * time) % C.len, size = smoothstep(0, CROSS.ease, along) * smoothstep(0, CROSS.ease, C.len - along);
  k.x = lerp(C.from[0], C.to[0], along / C.len); k.z = lerp(C.from[1], C.to[1], along / C.len); k.y = CROSS.y;
  butterflyAt(k, time, out);
  for (const o of out) { for (let i = 0; i < 3; i++) { const mid = (o.h[i] + o.e[i]) / 2; o.h[i] = mid + (o.h[i] - mid) * size; o.e[i] = mid + (o.e[i] - mid) * size; } o.w *= size; o.th *= size; }
  return out;
}
// THE LANE'S FLOWERS (a fixed stream of their own; the same on every seed): tall flower heads on stems BETWEEN THE
// WALL STROKES of the first rows, one to every LFLOWER.step metres of lane on alternate hands, from the mouth to
// LFLOWER.before short of the opening's plane; their heads ride about the line's own height and over it
// (LFLOWER.tall), orange, cobalt and pale yellow by turns, their faces turned to the lane and toward the mouth.
// THE LANE'S RULE HOLDS: a head's rim at the worst of its nodding stands no nearer the axis than LANE.half (it is
// rooted LFLOWER.out from the axis, or further by what it lacks). None is rooted in a ride.
const LFLOWER = { step: 7.5, out: [12, 14], tall: [13, 24], R: [2.2, 3.1], before: 14 };
function laneFlowers() {
  const r = makeRng(hashSeed(FIXED + ":the lane's flowers")), stalks = [], heads = [], cols = [CHORD.orange, CHORD.cobalt, CHORD.yellow];
  let i = 0;
  for (let a = -LANE.before + r.range(2, 6); a < -LFLOWER.before; a += LFLOWER.step * r.range(0.8, 1.2), i++) {
    const sg = i % 2 ? -1 : 1, tall = r.range(LFLOWER.tall[0], LFLOWER.tall[1]), R = r.range(LFLOWER.R[0], LFLOWER.R[1]), wind = r.range(0.5, 0.9), fwd = r.range(-1.5, 1.5), k = r.range(0.92, 1.08), seed = r();
    const c = sg * Math.max(r.range(LFLOWER.out[0], LFLOWER.out[1]), LANE.half + R + windReach(wind, 1) + 0.4), [x, z] = laneAt(a, c), tip = [x + LANE.f[0] * fwd, LANE.floor + tall, z + LANE.f[1] * fwd], col = cols[i % 3];
    if (inRide(x, z)) continue;
    stalks.push({ h: [x, LANE.floor - 0.8, z], e: tip, b: [LANE.f[0] * fwd * 0.3, 0, LANE.f[1] * fwd * 0.3], n: [-sg * LANE.l[0], 0, -sg * LANE.l[1]], w: 1.7, th: 1.1, ca: mix3(GRASS.mid, GRASS.deep, 0.5), cb: GRASS.deep, seed, wind, taper: 0.7 });
    const nx = -sg * LANE.l[0] * 0.55 - LANE.f[0] * 0.55, nz = -sg * LANE.l[1] * 0.55 - LANE.f[1] * 0.55, nl = Math.hypot(nx, 0.45, nz);
    heads.push({ h: [tip[0] - LANE.f[0] * R, tip[1] + 0.4, tip[2] - LANE.f[1] * R], e: [tip[0] + LANE.f[0] * R, tip[1] + 0.4, tip[2] + LANE.f[1] * R], b: [x - tip[0] + LANE.f[0] * R, 0, z - tip[2] + LANE.f[1] * R], n: [nx / nl, 0.45 / nl, nz / nl], w: 2 * R, th: R * 1.3, ca: mul3(col[0], k), cb: mul3(col[1], k), seed, wind, taper: 1 });
  }
  return { stalks, heads };
}
// THE BOWER (the join; a fixed stream of its own): BEHIND AND BESIDE THE DROP THE LANE CLOSES. Two rings of strokes
// are rooted on half ovals behind the opening's plane, from the left wall round the back to the right wall: ring k's
// oval is BOWER.wide[k] to either hand of the axis and BOWER.deep[k] deep, begun BOWER.behind behind the plane (behind
// the blade); a stroke to every BOWER.step[k] metres of the oval. Each rises BOWER.tall[k] and BOWS IN OVER THE DROP:
// its tip stands BOWER.in[k] of the way from its root toward the crown point (over the axis, BOWER.crown[0] behind
// the plane); its face is turned to the drop, so the drop's own light, which falls with the square of the distance,
// lies full on it, brightest on the nearest. NOTHING OF IT STANDS BEFORE THE BLADE'S PLANE (a stroke whose skin would
// is set back by what it lacks), so nothing of it is before the opening; from the lane the drop hides what stands
// straight behind it.
const BOWER = { behind: 5, wide: [15.5, 23], deep: [15, 25], step: [4.6, 6.2], tall: [[27, 35], [38, 48]], in: [0.62, 0.48], crown: 9, w: [[5.5, 8], [7, 10]], th: [1.5, 2.3] };
function bower() {
  const r = makeRng(hashSeed(FIXED + ':the bower')), rings = [[], []], plane = LANE.bladeBack + 2 * BLADE.th + 0.6;
  for (let k = 0; k < 2; k++) {
    const A = BOWER.deep[k], B = BOWER.wide[k], n = Math.round(Math.PI * Math.sqrt((A * A + B * B) / 2) / BOWER.step[k]);
    for (let i = 0; i < n; i++) {
      const ph = (i + 0.5 + r.range(-0.3, 0.3) + k * 0.5) / (n + k * 0.5) * Math.PI, a = BOWER.behind + A * Math.sin(ph), c = B * Math.cos(ph), tall = r.range(BOWER.tall[k][0], BOWER.tall[k][1]);
      const [x, z] = laneAt(a, c), [cx, cz] = laneAt(BOWER.behind + BOWER.crown, 0), dx = cx - x, dz = cz - z, dl = Math.hypot(dx, dz) || 1, inn = BOWER.in[k] * r.range(0.85, 1.1);
      const toDrop = [DROP.x - x, DROP.z - z], tl = Math.hypot(toDrop[0], toDrop[1]) || 1, bulge = tall * r.range(0.1, 0.16), [ca, cb] = grassColours(r);
      const st = { h: [x, LANE.floor - 0.8, z], e: [x + dx * inn, LANE.floor + tall, z + dz * inn], b: [-dx / dl * bulge, tall * 0.18, -dz / dl * bulge], n: [toDrop[0] / tl, -0.12, toDrop[1] / tl],
        w: r.range(BOWER.w[k][0], BOWER.w[k][1]), th: r.range(BOWER.th[0], BOWER.th[1]), ca: mix3(ca, GRASS.pale, 0.35), cb, seed: r(), wind: r.range(0.6, 1.2), taper: r.range(0.35, 0.55), ring: k };
      let lack = 0; for (const q of skinOf(st)) lack = Math.max(lack, plane - (laneOf(q[0], q[2])[0] - q[3]));
      if (lack > 0) shift(st, LANE.f[0] * (lack + 0.2), LANE.f[1] * (lack + 0.2));
      rings[k].push(st);
    }
  }
  return rings;
}
const BEAD = { step: [5.5, 8.5], out: [10.6, 12.6], tall: [10, 17], R: 0.34, before: 16, fall: 6, every: [6, 10], g: 9.8, colour: lin('#BFD6DC') };
function dewFile() {
  const r = makeRng(hashSeed(FIXED + ':the dew file')), blades = [], beads = [], falls = [];
  for (const sg of [1, -1]) for (let a = -LANE.before + r.range(0, 4); a < -BEAD.before; a += r.range(BEAD.step[0], BEAD.step[1])) {
    const [x, z] = laneAt(a, sg * r.range(BEAD.out[0], BEAD.out[1])), along = Math.atan2(LANE.f[1], LANE.f[0]) + (r.chance(0.5) ? 0 : Math.PI);
    const st = standing(r, x, z, LANE.floor, { tall: BEAD.tall, lean: [0.03, 0.12], leanTo: along, face: Math.atan2(-sg * LANE.l[1], -sg * LANE.l[0]), faceTurn: 0.5, bow: 0.05, w: [1.5, 2.2], th: [0.7, 1], wind: [0.3, 0.5], taper: [0.12, 0.2] });
    if (inRide(x, z)) continue;
    const tip = st.e, R = BEAD.R * r.range(0.85, 1.25);
    blades.push(st);
    beads.push({ h: [tip[0], tip[1] + 0.2 - R, tip[2]], e: [tip[0], tip[1] + 0.2 + R, tip[2]], b: [0, 0, 0], n: [-sg * LANE.l[0] * 0.7 - LANE.f[0] * 0.7, 0.1, -sg * LANE.l[1] * 0.7 - LANE.f[1] * 0.7], w: 2 * R, th: 1.6 * R, ca: BEAD.colour, cb: BEAD.colour, seed: r(), wind: st.wind, taper: 1 });
  }
  for (let i = 0; i < BEAD.fall; i++) { const b = beads[Math.floor((i + r.range(0.1, 0.9)) / BEAD.fall * beads.length)]; falls.push({ x: b.h[0], y: b.h[1], z: b.h[2], n: b.n, R: b.w / 2, every: r.range(BEAD.every[0], BEAD.every[1]), phase: r() }); }
  return { blades, beads, falls };
}
function fallAt(k, time, s) {
  const tau = ((time / k.every + k.phase) % 1) * k.every, y = k.y - 0.5 * BEAD.g * tau * tau, on = y > LANE.floor + 0.4 ? 1 : 0;
  s.h[0] = k.x; s.h[1] = y - k.R * 1.5; s.h[2] = k.z; s.e[0] = k.x; s.e[1] = y + k.R * 1.5; s.e[2] = k.z; s.b[0] = s.b[1] = s.b[2] = 0; s.n = k.n; s.w = 1.7 * k.R * on; s.th = 1.5 * k.R * on; s.ca = BEAD.colour; s.cb = BEAD.colour; s.seed = k.phase; s.wind = 0; s.taper = 1;
  return s;
}
// THE SHADOWS THE DROP THROWS: every stroke that stands within DROPLIGHT.shade of the drop lays a blot on the floor from
// its own foot straight away from the drop (so they run back down the lane toward the eye), DROPLIGHT.blot long,
// broader as it goes, thinning to nothing. They are read from the shadow texture's green and shut the drop's light only.
function dropBlots(list) {
  const out = [];
  for (const s of list) {
    const dx = s.h[0] - DROP.x, dz = s.h[2] - DROP.z, d = Math.hypot(dx, dz);
    if (d > DROPLIGHT.shade || d < 1 || s.e[1] - s.h[1] < 2) continue;
    out.push({ x0: s.h[0], z0: s.h[2], x1: s.h[0] + dx / d * DROPLIGHT.blot, z1: s.h[2] + dz / d * DROPLIGHT.blot, w0: s.w * 0.7, w1: s.w * 1.5, d0: 0.85, d1: 0, drop: true });
  }
  return out;
}
// THE BLADE: one long green stroke in the upright plane behind the opening, rooted BLADE.root metres left of the axis
// on the lane's floor, rising to a crest at BLADE.crest (metres left, height) and bowing down to its tip right over the
// drop's top. The curve's control point follows from the crest (a small solve), not from a typed number.
const BLADE = { root: 30, crest: [14, 40], tip: 0.3, w: 5, taper: 0.28, th: 1.2, sway: 0.5, bob: 1.2, bobRate: 0.5 };
function bladeStroke() {
  const y0 = LANE.floor, y2 = DROP.y + DROP.r + BLADE.tip, [cx0, yc] = BLADE.crest;
  // the height's greatest value along the curve for a control height cy, and the share of the curve where it stands
  const crestOf = (cy) => { const t = (cy - y0) / (2 * cy - y0 - y2); return [t, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * cy + t * t * y2]; };
  let lo = yc, hi = 3 * yc;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (crestOf(mid)[1] < yc) lo = mid; else hi = mid; }
  const cy = (lo + hi) / 2, t = crestOf(cy)[0], cx = (cx0 - (1 - t) * (1 - t) * BLADE.root) / (2 * t * (1 - t));
  // its middle plane stands behind the opening by LANE.bladeBack and its own half thickness at its thickest
  const back = LANE.bladeBack + BLADE.th, p = (c, y) => { const q = laneAt(back, c); return [q[0], y, q[1]]; };
  const h = p(BLADE.root, y0), e = p(0, y2), c = p(cx, cy);
  return { h, e, b: [c[0] - (h[0] + e[0]) / 2, c[1] - (h[1] + e[1]) / 2, c[2] - (h[2] + e[2]) / 2], n: [-LANE.f[0], 0, -LANE.f[1]], w: BLADE.w, th: BLADE.th, ca: GRASS.lit, cb: GRASS.deep, seed: 0.37, wind: BLADE.sway, taper: BLADE.taper };
}
export const fieldLane = { archStroke, ARCH, sunBody, sunFrom, sunLaw, sunWall, sunWallNeed, hedge, SUNWALL, HEDGE, rides, inSunRide, laneShare, rightOfLine, laneWalls, laneMore, lanePath, dewFile, fallAt, dropBlots, crossing, crossAt, CROSS, laneFlowers, LFLOWER, bower, BOWER, inRide, RIDE, MORE, BEAD, bladeStroke, skinOf, foregroundGrass, routeNear };

// ------------------------------------------------------------------ THE MEADOW'S GROUND (the visit's stream)
// Lying strokes in level rows from the foreground to the ridge's foot: 20 to 40 m long and 5 to 9 m wide as far as the
// far meadow, twice that and darker beyond it. Rows end raggedly at the field's edges. None lies in the brook, on
// the scraped patch, under the elm's trunk, on the lane's floor or under the belt (the belt's floor is thin paint).
// A band of rows shares one green of the five. Those within MEADOW.near of the route in plan are returned apart (they
// are drawn with the fuller ribbon). keep: the share of the far ones kept (the visitor's graphics level).
const MEADOW = { rows: 7.2, z: [-66, -604], farRows: 15, near: 45, band: 43, wide: 240, wideKeep: 0.5 };
async function meadowGround(r, near, keep, yieldFn = null) {
  const nearList = [], farList = [], order = r.shuffle([0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1, 2, 3]);
  const free = (x, z, wide) => {
    if (waterOut(x, z) < 0.5 * wide + 0.5) return false;
    if (Math.abs(x - SCRAPE.x) < SCRAPE.w * 0.42 && Math.abs(z - SCRAPE.z) < SCRAPE.d * 0.42) return false;
    if (Math.hypot(x - ELM_AT.x, z - ELM_AT.z) < 9 || Math.hypot(x - MAY_AT.x, z - MAY_AT.z) < 6) return false;
    const [a, c] = laneOf(x, z);
    return !(a > -LANE.before - 6 && a < LANE.beyond + 6 && Math.abs(c) < LANE.side + 6) && !(a > -LANE.straight - 10 && a <= -LANE.before - 6 && Math.abs(c) < 5);
  };
  const row = (z0, big) => {
    const x0 = PAINTED.x0 - r.range(0, PAINTED.rag0), x1 = PAINTED.x1 + r.range(0, PAINTED.rag1), band = order[Math.floor(-z0 / MEADOW.band) % order.length];
    for (let x = x0 + r.range(0, 20); x < x1;) {
      // (further than MEADOW.wide from the line in plan the strokes are of the big kind too, and MEADOW.wideKeep of them are laid)
      const wide = near.far(x, z0) > MEADOW.wide;
      const z = z0 + r.range(-3.2, 3.2) * big, s = lyingStroke(r, x, z, 0, big > 1 || wide ? { len: [40, 72], w: [10, 16], turn: 0.16 } : { turn: 0.2 });
      const len = Math.hypot(s.e[0] - s.h[0], s.e[2] - s.h[2]), far = r() > keep;
      // it lies on the ground under its own two ends and its middle
      const yh = groundY(s.h[0], s.h[2]), ye = groundY(s.e[0], s.e[2]), ym = groundY(x, z), lift = s.h[1];
      s.h[1] = yh + lift; s.e[1] = ye + lift; s.b[1] = 2 * (ym - (yh + ye) / 2);
      // the band's own green in seven strokes of ten; darker and bluer beyond the far meadow
      if (r() < 0.7) s.ca = mul3(MEADOW_GREENS[band], r.range(0.88, 1.08));
      if (big > 1) { s.ca = mix3(s.ca, GRASS.blue, r.range(0.35, 0.7)); s.cb = mix3(s.cb, GRASS.shade, 0.5); }
      const cx = x; x += len * r.range(0.7, 0.95);
      if (wide && r() > MEADOW.wideKeep) continue;
      if (!free(cx, z, s.w) || !free(s.h[0], s.h[2], s.w) || !free(s.e[0], s.e[2], s.w)) continue;
      if (near.plan(cx, z).dist < MEADOW.near && big === 1) nearList.push(s); else if (!far) farList.push(s);
    }
  };
  for (let z = MEADOW.z[0]; z > MEADOW.z[1]; z -= MEADOW.rows) { row(z + r.range(-1.5, 1.5), 1); if (yieldFn) await yieldFn(); }
  for (let z = MEADOW.z[1]; z > PAINTED.z1; z -= MEADOW.farRows) { row(z + r.range(-3, 3), 2); if (yieldFn) await yieldFn(); }
  return { nearList, farList };
}

// ------------------------------------------------------------------ THE BROOK: strokes of pale blue and white that slide down it
// Each has its place along the brook at clock 0 (m0), a lane across it (d), a length. They slide toward us at
// BROOK.speed on the world clock and are laid again at the far end of the reach; brookStroke writes one at a clock.
function dealBrook(r, count) {
  const blues = [lin('#A9CBE2'), lin('#7FB2DA'), lin('#5F9BCF'), lin('#4A86BE')], white = lin('#F7F3E8'), out = [];
  for (let i = 0; i < count; i++) {
    const foam = r.chance(0.22), ca = foam ? mix3(white, blues[0], r.range(0, 0.3)) : mix3(r.pick(blues), r.pick(blues), r());
    out.push({ m0: (i + r()) / count * BROOK_LEN, d: r.range(-1, 1) * (BROOK.half - 2), len: r.range(8, 20), w: r.range(2.5, 3.8), th: r.range(0.7, 1.2), lift: r.range(0, 0.5),
      ca, cb: foam ? white : mix3(ca, white, r.range(0.1, 0.5)), seed: r(), taper: r.range(0.4, 0.75), skew: r.range(-1.2, 1.2) });
  }
  return out;
}
// THE BED (a stream of its own): under the sliding strokes the water's deep colour is laid in still strokes of dark
// blue along the stream, BED.rows abreast at every BED.step metres of the reach the line comes near (from the brook's
// near end to BED.past metres above the pool), BED.under below the surface; and in the pool, still arcs on its rings.
const BED = { step: [5, 8], rows: 3, past: 70, under: 0.45, th: 0.4 };
function brookBed(r) {
  const out = [], deeps = [lin('#2B5C84'), lin('#356F9C'), lin('#27506E'), lin('#3F7FAE')], p = [0, 0, 0, 0], q = [0, 0, 0, 0];
  for (let m = 8; m < POOL.m + BED.past; m += r.range(BED.step[0], BED.step[1])) for (let j = 0; j < BED.rows; j++) {
    const d = lerp(-BROOK.half + 2.4, BROOK.half - 2.4, (j + r.range(0.15, 0.85)) / BED.rows), len = r.range(13, 24), ca = mix3(r.pick(deeps), r.pick(deeps), r());
    brookAt(m + len / 2, p); brookAt(m - len / 2, q);
    const st = { h: [p[0] - p[3] * d, BROOK.surface - BED.under + brookRise(m + len / 2), p[1] + p[2] * d], e: [q[0] - q[3] * d, BROOK.surface - BED.under + brookRise(m - len / 2), q[1] + q[2] * d], b: [0, 0, 0], n: [0, 1, 0],
      w: r.range(4.2, 6), th: BED.th, ca, cb: mix3(ca, lin('#7FB2DA'), r.range(0.1, 0.4)), seed: r(), wind: 0, taper: r.range(0.6, 0.9) };
    // none spans the ledge (the fall's strokes are there) and none lies under the pool's round
    if (Math.abs(m - POOL.m - POOL.lip) < len / 2 + 2 || Math.abs(m - POOL.m) < POOL.r - 2) continue;
    out.push(st);
  }
  for (const [rad, n] of STEP.rings) for (let i = 0; i < n; i++) {
    const a = (i + r.range(0.1, 0.9)) / n * TAU, span = r.range(0.7, 0.95) * TAU / n, am = a + span / 2, bow = 2 * rad * (1 - Math.cos(span / 2)), ca = mix3(r.pick(deeps), r.pick(deeps), r()), y = BROOK.surface - BED.under;
    out.push({ h: [POOL.at[0] + Math.cos(a) * rad, y, POOL.at[1] + Math.sin(a) * rad], e: [POOL.at[0] + Math.cos(a + span) * rad, y, POOL.at[1] + Math.sin(a + span) * rad], b: [Math.cos(am) * bow, 0, Math.sin(am) * bow], n: [0, 1, 0],
      w: r.range(3.4, 4.6), th: BED.th, ca, cb: mix3(ca, lin('#7FB2DA'), r.range(0.1, 0.4)), seed: r(), wind: 0, taper: r.range(0.6, 0.9) });
  }
  return out;
}
const _b0 = [0, 0, 0, 0], _b1 = [0, 0, 0, 0], _b2 = [0, 0, 0, 0];
function brookStroke(k, time, s) {
  const m = ((k.m0 - BROOK.speed * time) % BROOK_LEN + BROOK_LEN) % BROOK_LEN;
  // laid again at the far end: it thins to nothing over the last 14 m of either end of the reach
  const ends = smoothstep(0, 14, m) * smoothstep(0, 14, BROOK_LEN - m);
  // THE STROKES UNDER THE EYE ARE SHORT: below the step (the reach the line flies low over) a stroke is BROOK.short as
  // long as above it, by its place on the brook
  const len = k.len * lerp(BROOK.short, 1, smoothstep(POOL.m, POOL.m + 2 * POOL.lip, m));
  const a = brookAt(m + len / 2, _b0), b = brookAt(m - len / 2, _b1), c = brookAt(m, _b2), y = BROOK.surface + k.lift;
  // the head upstream, the tail drawn down the stream; right of the stream's line is (-tz, tx). At the ledge the
  // stroke pours over it: its head on the upper water, its tail on the lower, its middle bent over the lip.
  const yh = y + brookRise(m + len / 2), ye = y + brookRise(m - len / 2), yc = y + brookRise(m);
  s.h[0] = a[0] - a[3] * k.d; s.h[1] = yh; s.h[2] = a[1] + a[2] * k.d;
  s.e[0] = b[0] - b[3] * (k.d + k.skew); s.e[1] = ye; s.e[2] = b[1] + b[2] * (k.d + k.skew);
  s.b[0] = 2 * (c[0] - c[3] * (k.d + k.skew / 2) - (s.h[0] + s.e[0]) / 2); s.b[1] = 2 * (yc - (yh + ye) / 2); s.b[2] = 2 * (c[1] + c[2] * (k.d + k.skew / 2) - (s.h[2] + s.e[2]) / 2);
  // in the pool the stream's own strokes give out (the pool's strokes turn there)
  const inPool = 1 - 0.85 * (1 - smoothstep(POOL.r - 5, POOL.r + 3, Math.abs(m - POOL.m)));
  s.w = k.w * ends * inPool; s.th = k.th * ends * inPool;
  return s;
}

// ------------------------------------------------------------------ THE WEST ARM'S WATER (fixed streams of its own: the same on every seed)
// Its surface lies level with the brook's upper water. SLIDING STROKES as the brook's, shorter (ARMW.len), going down
// the arm to the brook on the world clock (ARM.speed), thinning to nothing over ARMW.ends where it meets the brook and
// over ARM.rise where it rises;
// THE BED under them in still dark strokes, ARMW.rows abreast; THE BANKS: dark strokes lying along both edges, and
// short strokes standing on them (the bank's rule: none nearer the line than BANK.clear at the worst of its sway).
const ARMW = { slide: 72, len: [7, 13], ends: 12, rows: 2, bed: [6, 9], bank: [8, 12], stand: 90 };
const armY = () => ARM.surface + POOL.fall;
function dealArm(r) {
  const blues = [lin('#A9CBE2'), lin('#7FB2DA'), lin('#5F9BCF'), lin('#4A86BE')], white = lin('#F7F3E8'), out = [];
  for (let i = 0; i < ARMW.slide; i++) {
    const foam = r.chance(0.25), ca = foam ? mix3(white, blues[0], r.range(0, 0.3)) : mix3(r.pick(blues), r.pick(blues), r());
    out.push({ m0: (i + r()) / ARMW.slide * ARM_LEN, d: r.range(-1, 1) * (ARM.half - 1.6), len: r.range(ARMW.len[0], ARMW.len[1]), w: r.range(2.1, 3.2), th: r.range(0.7, 1.2), lift: r.range(0, 0.4),
      ca, cb: foam ? white : mix3(ca, white, r.range(0.1, 0.5)), seed: r(), taper: r.range(0.4, 0.75), skew: r.range(-0.9, 0.9) });
  }
  return out;
}
const _a0 = [0, 0, 0, 0], _a1 = [0, 0, 0, 0], _a2 = [0, 0, 0, 0];
function armStroke(k, time, s) {
  const m = ((k.m0 - ARM.speed * time) % ARM_LEN + ARM_LEN) % ARM_LEN, ends = smoothstep(0, ARMW.ends, m) * smoothstep(0, ARM.rise, ARM_LEN - m);
  const a = armAt(m + k.len / 2, _a0), b = armAt(m - k.len / 2, _a1), c = armAt(m, _a2), y = armY() + k.lift;
  s.h[0] = a[0] - a[3] * k.d; s.h[1] = y; s.h[2] = a[1] + a[2] * k.d;
  s.e[0] = b[0] - b[3] * (k.d + k.skew); s.e[1] = y; s.e[2] = b[1] + b[2] * (k.d + k.skew);
  s.b[0] = 2 * (c[0] - c[3] * (k.d + k.skew / 2) - (s.h[0] + s.e[0]) / 2); s.b[1] = 0; s.b[2] = 2 * (c[1] + c[2] * (k.d + k.skew / 2) - (s.h[2] + s.e[2]) / 2);
  s.w = k.w * ends; s.th = k.th * ends;
  return s;
}
function armStill(r, near) {
  const bed = [], lying = [], stand = [], deeps = [lin('#2B5C84'), lin('#356F9C'), lin('#27506E'), lin('#3F7FAE')], darks = [GRASS.deep, GRASS.blue, GRASS.shade, GRASS.mid], p = [0, 0, 0, 0], q = [0, 0, 0, 0];
  // the arm ends where it meets the brook's own bed (its first metres lie in the brook's water)
  const from = BROOK.half + ARM.half;
  for (let m = from; m < ARM_LEN - 4; m += r.range(ARMW.bed[0], ARMW.bed[1])) for (let j = 0; j < ARMW.rows; j++) {
    const d = lerp(-ARM.half + 2, ARM.half - 2, (j + r.range(0.15, 0.85)) / ARMW.rows), len = r.range(11, 19), ca = mix3(r.pick(deeps), r.pick(deeps), r()), y = armY() - BED.under;
    armAt(m + len / 2, p); armAt(m - len / 2, q);
    bed.push({ h: [p[0] - p[3] * d, y, p[1] + p[2] * d], e: [q[0] - q[3] * d, y, q[1] + q[2] * d], b: [0, 0, 0], n: [0, 1, 0], w: r.range(4, 5.4), th: BED.th, ca, cb: mix3(ca, lin('#7FB2DA'), r.range(0.1, 0.4)), seed: r(), wind: 0, taper: r.range(0.6, 0.9) });
  }
  for (let m = from + 6; m < ARM_LEN - 6; m += r.range(ARMW.bank[0], ARMW.bank[1])) for (const sg of [-1, 1]) {
    armAt(m, p); const d = sg * (ARM.half + r.range(1.6, 3.6)), len = r.range(8, 13), x = p[0] - p[3] * d, z = p[1] + p[2] * d, y = groundY(x, z);
    const ca = mul3(mix3(r.pick(darks), r.pick(darks), r()), r.range(0.9, 1.25));
    const st = { h: [x + p[2] * len / 2, y + 0.9, z + p[3] * len / 2], e: [x - p[2] * len / 2, y + 0.9, z - p[3] * len / 2], b: [-p[3] * sg * r.range(0, 1.5), 0, p[2] * sg * r.range(0, 1.5)], n: [0, 1, 0],
      w: r.range(3.4, 5.2), th: BROOK.bank, ca, cb: mix3(ca, GRASS.lit, r.range(0.1, 0.5)), seed: r(), wind: 0, taper: r.range(0.45, 0.8) };
    if (brookNear(x, z).dist < BROOK.half + 2.5) continue;
    lying.push(st);
  }
  for (let i = 0; i < ARMW.stand; i++) {
    const m = r.range(from + 4, ARM_LEN - 4), sg = r.sign(), d = sg * (ARM.half + r.range(2.5, 11)); armAt(m, p);
    const x = p[0] - p[3] * d, z = p[1] + p[2] * d, awayTo = Math.atan2(p[2] * sg, -p[3] * sg) + r.range(-0.8, 0.8);
    const st = standing(r, x, z, groundY(x, z) + 1, { tall: [3, 5.5], lean: [0, 0.2], leanTo: awayTo, bow: 0.08, w: [2.5, 4], th: [0.9, 1.5], wind: [0.4, 1], taper: [0.25, 0.5], colours: [mul3(mix3(r.pick(darks), GRASS.lit, r.range(0, 0.6)), r.range(0.9, 1.2)), r.pick(darks)] });
    st.e[1] = Math.min(st.e[1], groundY(x, z) + BANK.top - 2.5);
    const off = near.plan(x, z).dist;
    if (brookNear(x, z).dist < BROOK.half + 2.5 || (off < BANK.far && near.clear(st) < BANK.clear)) continue;
    stand.push(st);
  }
  return { bed, lying, stand };
}

// ------------------------------------------------------------------ THE STEP IN THE BROOK AND THE POOL UNDER IT (the visit's stream)
// At POOL.lip metres of brook above the pool's middle the bed stands POOL.fall higher: the water's strokes pour over
// the ledge. THE FALL: STEP.fall thick white strokes side by side across the brook, each loaded on the upper water
// just above the lip and dragged down over it to the pool (its reach breathes a little on the clock); behind them the
// ledge's own face, dark slabs standing across the brook; at their foot foam dabs that bob. THE POOL: strokes on
// STEP.rings ([radius, how many]) about the pool's middle, each bowed along its own ring, all turning slowly the one
// way (STEP.turn radians a second at the rim, faster toward the middle). stepAt writes stroke i at a clock.
const STEP = { fall: 9, th: [1.3, 2.1], reach: [4, 7], over: 1.3, rings: [[3, 4], [6.2, 6], [9.4, 8]], turn: 0.09, foam: 9, breathe: 0.7, ledge: '#2A3766' };
function dealStep(r) {
  const out = [], white = lin('#FBF8EE'), pale = lin('#D4E4F2'), blues = [lin('#A9CBE2'), lin('#7FB2DA'), lin('#5F9BCF')], lipM = POOL.m + POOL.lip, p = [0, 0, 0, 0];
  for (let i = 0; i < STEP.fall; i++) {
    const d = lerp(-BROOK.half + 1.6, BROOK.half - 1.6, (i + r.range(0.2, 0.8)) / STEP.fall);
    out.push({ kind: 'fall', d, top: lipM + r.range(1.6, 3.4), reach: r.range(STEP.reach[0], STEP.reach[1]), w: r.range(2.6, 3.8), th: r.range(STEP.th[0], STEP.th[1]), phase: r(), rate: r.range(0.8, 1.5),
      ca: mul3(white, r.range(0.97, 1.03)), cb: mix3(white, pale, r.range(0.2, 0.7)), seed: r(), taper: r.range(0.55, 0.8) });
  }
  for (let i = 0; i < STEP.foam; i++) out.push({ kind: 'foam', d: lerp(-BROOK.half + 1, BROOK.half - 1, (i + r.range(0.1, 0.9)) / STEP.foam), m: lipM - r.range(3.5, 7.5), R: r.range(1.1, 2), phase: r(), rate: r.range(0.9, 1.7),
    ca: white, cb: mix3(white, pale, r.range(0, 0.5)), seed: r(), turn: r.range(0, TAU) });
  for (const [rad, n] of STEP.rings) for (let i = 0; i < n; i++) {
    const foam = r.chance(0.3), ca = foam ? mix3(white, blues[0], r.range(0, 0.3)) : mix3(r.pick(blues), r.pick(blues), r());
    out.push({ kind: 'pool', rad: rad + r.range(-0.7, 0.7), a0: (i + r.range(0.1, 0.9)) / n * TAU, span: r.range(0.5, 0.78) * TAU / n, w: r.range(1.7, 2.7), th: r.range(0.5, 0.9), lift: r.range(0.1, 0.45),
      ca, cb: foam ? white : mix3(ca, white, r.range(0.1, 0.5)), seed: r(), taper: r.range(0.4, 0.7) });
  }
  return out;
}
const _s0 = [0, 0, 0, 0];
function stepAt(k, time, s) {
  s.ca = k.ca; s.cb = k.cb; s.seed = k.seed; s.wind = 0; s.cover = 1;
  if (k.kind === 'pool') {
    const a = k.a0 + time * STEP.turn * (POOL.r + 3) / (k.rad + 3), a1 = a + k.span, am = a + k.span / 2, y = BROOK.surface + k.lift, bow = 2 * k.rad * (1 - Math.cos(k.span / 2));
    s.h[0] = POOL.at[0] + Math.cos(a) * k.rad; s.h[1] = y; s.h[2] = POOL.at[1] + Math.sin(a) * k.rad; s.e[0] = POOL.at[0] + Math.cos(a1) * k.rad; s.e[1] = y; s.e[2] = POOL.at[1] + Math.sin(a1) * k.rad;
    s.b[0] = Math.cos(am) * bow; s.b[1] = 0; s.b[2] = Math.sin(am) * bow; s.n[0] = 0; s.n[1] = 1; s.n[2] = 0; s.w = k.w; s.th = k.th; s.taper = k.taper;
    return s;
  }
  if (k.kind === 'foam') {
    const p = brookAt(k.m, _s0), x = p[0] - p[3] * k.d, z = p[1] + p[2] * k.d, y = BROOK.surface + 0.5 + 0.35 * Math.sin(time * k.rate * 2 + k.phase * TAU), c = Math.cos(k.turn) * k.R, sn = Math.sin(k.turn) * k.R;
    s.h[0] = x - c; s.h[1] = y; s.h[2] = z - sn; s.e[0] = x + c; s.e[1] = y; s.e[2] = z + sn; s.b[0] = s.b[1] = s.b[2] = 0; s.n[0] = 0; s.n[1] = 1; s.n[2] = 0; s.w = 2 * k.R; s.th = k.R * 0.8; s.taper = 1;
    return s;
  }
  // a stroke of the fall: its head on the upper water above the lip, its tail down on the pool, its middle thrown out over the lip
  const reach = k.reach + STEP.breathe * Math.sin(time * k.rate + k.phase * TAU), p = brookAt(k.top, _s0), tx = p[2], tz = p[3], hx = p[0] - tz * k.d, hz = p[1] + tx * k.d, len = k.top - (POOL.m + POOL.lip) + reach;
  s.h[0] = hx; s.h[1] = BROOK.surface + POOL.fall + 0.5; s.h[2] = hz; s.e[0] = hx - tx * len; s.e[1] = BROOK.surface + 0.3; s.e[2] = hz - tz * len;
  s.b[0] = -tx * STEP.over; s.b[1] = POOL.fall * 0.9; s.b[2] = -tz * STEP.over; s.n[0] = -tx * 0.6; s.n[1] = 0.8; s.n[2] = -tz * 0.6; s.w = k.w; s.th = k.th; s.taper = k.taper;
  return s;
}
// the ledge's own face under the fall: dark slabs standing across the brook at the lip, their feet in the pool
function ledgeSlabs() {
  const out = [], col = lin(STEP.ledge), p = brookAt(POOL.m + POOL.lip + 0.4), tx = p[2], tz = p[3];
  for (let i = 0; i < 3; i++) { const d0 = -BROOK.half - 1 + i * (2 * BROOK.half + 2) / 3, d1 = d0 + (2 * BROOK.half + 2) / 3 + 0.8, y = BROOK.surface + POOL.fall / 2 - 0.2;
    out.push({ h: [p[0] - tz * d0, y, p[1] + tx * d0], e: [p[0] - tz * d1, y, p[1] + tx * d1], b: [0, 0, 0], n: [-tx, 0.1, -tz], w: POOL.fall + 0.9, th: 1.2, ca: mul3(col, 0.9 + 0.12 * i), cb: mul3(col, 0.7), seed: 0.17 + 0.31 * i, wind: 0, taper: 0.9 }); }
  return out;
}

// ------------------------------------------------------------------ THE BANKS, THE FLOWERS, THE FAR BELT (the visit's streams)
// The banks: thick dark strokes lying along both edges of the water (BROOK.bank high), and short strokes standing on
// them, 3 to 5.5 m tall, upright or leaning away from the water. THE BANK'S RULE: none is rooted within BANK.root of
// the line in plan and none comes within BANK.clear of it at the worst of its sway; no tip above y 8.
// NO DARK SHARD BY THE LINE: a bank stroke (lying or standing) nearer the line in plan than BANK.sun[1] is painted in
// the sunny greens, the more the nearer (wholly so within BANK.sun[0], by BANK.sunny): sunnyBank, for all alike.
const sunnyBank = (st, near) => { const k = BANK.sunny * (1 - smoothstep(BANK.sun[0], BANK.sun[1], near.plan((st.h[0] + st.e[0]) / 2, (st.h[2] + st.e[2]) / 2).dist)); if (k > 0) { st.ca = mix3(st.ca, GRASS.lit, k); st.cb = mix3(st.cb, GRASS.mid, k); } return st; };
const BANK = { root: 7.5, clear: 6, top: 8, standing: 300, lie: 2.5, pool: 12, far: 40, sun: [14, 32], sunny: 0.8 };
async function bankStrokes(r, near, yieldFn = null, q = r) {
  const lying = [], stand = [], darks = [GRASS.deep, GRASS.blue, GRASS.shade, GRASS.mid], p = [0, 0, 0, 0], end = brookNear(PAINTED.x1, -470).m;
  for (let m = 6; m < end; m += r.range(7, 11)) for (const sg of [-1, 1]) {
    if (yieldFn && sg < 0) await yieldFn();
    brookAt(m, p); const d = sg * (BROOK.half + r.range(2, 5)), len = r.range(12, 24), x = p[0] - p[3] * d, z = p[1] + p[2] * d, y = groundY(x, z);
    const ca = mul3(mix3(r.pick(darks), r.pick(darks), r()), r.range(0.9, 1.25));
    const st = { h: [x + p[2] * len / 2, y + 0.9, z + p[3] * len / 2], e: [x - p[2] * len / 2, y + 0.9, z - p[3] * len / 2], b: [-p[3] * sg * r.range(0, 2), 0, p[2] * sg * r.range(0, 2)], n: [0, 1, 0],
      w: r.range(4, 6.5), th: BROOK.bank, ca, cb: mix3(ca, GRASS.lit, r.range(0.1, 0.5)), seed: r(), wind: 0, taper: r.range(0.45, 0.8) };
    // none lies in the pool's round, and none within BANK.lie of the line (the low run comes over the east bank)
    if (Math.hypot(x - POOL.at[0], z - POOL.at[1]) < POOL.r + 3.5 || (near.plan(x, z).dist < BANK.far && near.clear(st) < BANK.lie)) continue;
    lying.push(st);
  }
  // the pool's own bank (a stream of its own): strokes lying round its rim, each along the rim, none across the brook's way in or out
  for (let i = 0; i < BANK.pool; i++) {
    const a = (i + q.range(0.1, 0.9)) / BANK.pool * TAU, rad = POOL.r + q.range(2.6, 4.2), x = POOL.at[0] + Math.cos(a) * rad, z = POOL.at[1] + Math.sin(a) * rad, len = q.range(9, 15), y = groundY(x, z);
    const ca = mul3(mix3(q.pick(darks), q.pick(darks), q()), q.range(0.9, 1.25)), tx = -Math.sin(a), tz = Math.cos(a);
    const st = { h: [x + tx * len / 2, y + 0.9, z + tz * len / 2], e: [x - tx * len / 2, y + 0.9, z - tz * len / 2], b: [Math.cos(a) * len * 0.22, 0, Math.sin(a) * len * 0.22], n: [0, 1, 0],
      w: q.range(4, 6), th: BROOK.bank, ca, cb: mix3(ca, GRASS.lit, q.range(0.1, 0.5)), seed: q(), wind: 0, taper: q.range(0.45, 0.8) };
    if (brookNear(x, z).dist < BROOK.half + 2.5 || (near.plan(x, z).dist < BANK.far && near.clear(st) < BANK.lie)) continue;
    lying.push(st);
  }
  if (yieldFn) await yieldFn();
  for (let i = 0; i < BANK.standing; i++) {
    const m = r.range(4, end), sg = r.sign(), d = sg * (BROOK.half + r.range(3, 15)); brookAt(m, p);
    const x = p[0] - p[3] * d, z = p[1] + p[2] * d, awayTo = Math.atan2(p[2] * sg, -p[3] * sg) + r.range(-0.8, 0.8);
    const s = standing(r, x, z, groundY(x, z) + 1, { tall: [3, 5.5], lean: [0, 0.2], leanTo: awayTo, bow: 0.08, w: [2.5, 4], th: [0.9, 1.5], wind: [0.4, 1], taper: [0.25, 0.5], colours: [mul3(mix3(r.pick(darks), GRASS.lit, r.range(0, 0.6)), r.range(0.9, 1.2)), r.pick(darks)] });
    s.e[1] = Math.min(s.e[1], BANK.top - 0.3);
    if (yieldFn) await yieldFn();
    const off = near.plan(x, z).dist;
    if (off < BANK.root || (off < BANK.far && near.clear(s) < BANK.clear) || Math.hypot(x - POOL.at[0], z - POOL.at[1]) < POOL.r + 2) continue;
    stand.push(s);
  }
  return { lying, stand };
}
// The flowers: drifts of buttercup and clover dabs on stalk strokes, thickest by the brook. THE FLOWERS' RULE: no part
// of a flower, at the worst of its nodding, nearer the line than FLOWER.clear; none in the water, on the scraped
// patch, by the elm's trunk or under the belt. Those within FLOWER.near of the route are returned apart: THEY STAND ON
// STEMS THAT READ (stemOf: every such stalk is a thin stem FLOWER.stem.w wide that keeps its width to the head and is
// darkened toward the grass's deep green by FLOWER.stem.dark, so the dab is seen to ride a flower's stem and not to hover).
const stemOf = (st) => ({ ...st, w: FLOWER.stem.w, taper: FLOWER.stem.taper, ca: mix3(st.ca, GRASS.deep, FLOWER.stem.dark), cb: GRASS.deep });
const FLOWER = { clear: 8, near: 40, drifts: 46, stem: { w: 1.5, taper: 0.7, dark: 0.45 } };
// THE RED DAB's place is drawn inside the design's box (x 120 to 300, z -520 to -260: right of the brook) or, RED.armShare
// of the tries, in its ARM: to the right of the far meadow's straight (the route's own two points), RED.armOff metres
// from it (so far that it lies outside the margin about the entry axis, and before the belt's face): the far meadow's
// stretch sees it there. Either is rejected by the design's margins: RED.off metres and more from the route, never
// within RED.axis degrees of the entry axis, on the painted meadow, out of the water and out of the belt.
const RED = { box: [120, 300, -520, -260], armOff: [290, 400], armShare: 0.3, off: 120, axis: 12, tries: 400 };
function redPlace(r, near) {
  const P = routePlan(), hx = P.M[0] - P.P5[0], hz = P.M[1] - P.P5[1], hl = Math.hypot(hx, hz) || 1, rt = rightOf([hx / hl, hz / hl]);
  for (let i = 0; i < RED.tries; i++) {
    const arm = r() < RED.armShare, u = r(), v = r(), off = lerp(RED.armOff[0], RED.armOff[1], u);
    const x = arm ? lerp(P.P5[0], P.M[0], v) + rt[0] * off : lerp(RED.box[0], RED.box[1], u), z = arm ? lerp(P.P5[1], P.M[1], v) + rt[1] * off : lerp(RED.box[2], RED.box[3], v), [a, c] = laneOf(x, z);
    if (near.far(x, z) < RED.off || Math.abs(Math.atan2(x - ENTRY.x, ENTRY.z - z)) < RED.axis * DEG || insidePaint(x, z) < 10 || waterOut(x, z) < 6) continue;
    if (a > -LANE.before - 10 && a < LANE.beyond + 10 && Math.abs(c) < LANE.side + 10) continue;
    return [x, z];
  }
  return [(RED.box[0] + RED.box[1]) / 2, (RED.box[2] + RED.box[3]) / 2];
}
async function flowers(r, near, count, yieldFn = null) {
  const out = { nearStalks: [], nearHeads: [], farStalks: [], farHeads: [] }, p = [0, 0, 0, 0], end = brookNear(PAINTED.x1, -470).m;
  const per = Math.ceil(count / FLOWER.drifts);
  for (let k = 0; k < FLOWER.drifts; k++) {
    // a drift's middle: four in ten on the brook's banks, the rest anywhere in the meadow
    let cx, cz;
    if (r.chance(0.4)) { brookAt(r.range(20, end), p); const d = r.sign() * (BROOK.half + r.range(8, 30)); cx = p[0] - p[3] * d; cz = p[1] + p[2] * d; }
    else { cx = r.range(PAINTED.bay + 20, PAINTED.x1 - 20); cz = r.range(-585, -80); }
    if (yieldFn) await yieldFn();
    const spread = r.range(9, 20), pink = r.chance(0.5) ? 0.85 : 0.12;
    for (let i = 0; i < per; i++) {
      if (yieldFn && i % 8 === 7) await yieldFn();
      const x = cx + r.gauss() * spread * 1.6, z = cz + r.gauss() * spread, f = flowerAt(r, x, z, groundY(x, z), { pink });
      if (insidePaint(x, z) < 4 || waterOut(x, z) < 2.5 || Math.hypot(x - ELM_AT.x, z - ELM_AT.z) < 12 || Math.hypot(x - MAY_AT.x, z - MAY_AT.z) < 10) continue;
      if (Math.abs(x - SCRAPE.x) < SCRAPE.w * 0.5 && Math.abs(z - SCRAPE.z) < SCRAPE.d * 0.5) continue;
      const [a, c] = laneOf(x, z); if (a > -LANE.before - 8 && a < LANE.beyond + 8 && Math.abs(c) < LANE.side + 8) continue;
      const pl = near.plan(x, z), reach = f.R + windReach(f.stalk.wind, 1) + Math.hypot(f.stalk.e[0] - x, f.stalk.e[2] - z);
      if (pl.dist - reach < FLOWER.clear) continue;
      if (pl.dist < FLOWER.near) { out.nearStalks.push(f.stalk); out.nearHeads.push(f.dab); } else { out.farStalks.push(f.stalk); out.farHeads.push(f.dab); }
    }
  }
  return out;
}
// THE FLOWERS OF THE LOW RUN (a stream of their own): where the line flies low over the water, flowers TOWER TO BOTH
// HANDS OF IT: along the low run (from where it begins on the brook's west edge to one pool's width before the pool,
// the route's own two places), one to every LOWFL.step metres of the brook on either hand, rooted LOWFL.off from the
// line itself across the brook's way, LOWFL.tall tall (over the line's height there). The flowers' rule holds for
// each (FLOWER.clear of clear air at the worst of its nodding; none in the water): one that breaks it is left out.
const LOWFL = { step: 7, off: [10.5, 19], tall: [9, 12.5], size: 1.4 };
function lowRunFlowers(r, near, out) {
  const P = routePlan(), p = [0, 0, 0, 0];
  for (let m = P.mA; m < P.mB; m += LOWFL.step) for (const sg of [-1, 1]) {
    brookAt(m + r.range(-0.4, 0.4) * LOWFL.step, p);
    // the line's own place abeam of this metre of brook, and the flower's root to that hand of it
    const k = clamp((m - P.mA) / Math.max(1, P.mB - P.mA), 0, 1), across = lerp(ROUTE.low.west, ROUTE.low.east, k), d = across + sg * r.range(LOWFL.off[0], LOWFL.off[1]);
    const x = p[0] - p[3] * d, z = p[1] + p[2] * d, f = flowerAt(r, x, z, groundY(x, z), { tall: LOWFL.tall, size: LOWFL.size, pink: 0.5 });
    const pl = near.plan(x, z), reach = f.R + windReach(f.stalk.wind, 1) + Math.hypot(f.stalk.e[0] - x, f.stalk.e[2] - z);
    if (waterOut(x, z) < 2.5 || pl.dist - reach < FLOWER.clear) continue;
    out.nearStalks.push(f.stalk); out.nearHeads.push(f.dab);
  }
}
// THE COLOUR CHORDS (streams of their own; the flowers' rule holds for every dab), EACH ALONG A LINE WRITTEN FROM NAMES:
// COBALT on the west arm's bank on the line's side (the side away from the may tree's trunk), CHORD.bank.drifts drifts
// whose middles stand at even shares of the arm's bend round the may knoll (from the first to the last of ARM.bend's
// places), CHORD.bank.off from the water's edge; PALE YELLOW to either hand of the far meadow's straight (from the
// right arc's end to the lane's mouth, the route's own points), CHORD.far.off from it, and no pale head nearer the
// line than CHORD.far.clear (the pale yellow is a drift seen across the meadow, never a head by the eye); ONE LOOSE DRIFT OF ORANGE to
// the RIGHT of the straight that goes on from the elm (from where the line leaves the elm's circle to where the
// right arc begins), CHORD.open.off from it: so the may tree stands to the left of that straight and the orange to
// its right.
const CHORD = { cobalt: [lin('#2A50C4'), lin('#4C74E2')], yellow: [lin('#F3DB3E'), lin('#F9EC86')], orange: [lin('#F29A2E'), lin('#F0A81C')],
  bank: { drifts: 4, per: 30, off: [4, 15], along: 15, size: 1.35 }, far: { drifts: 4, per: 36, off: [44, 90], spread: [14, 26], size: 1.35, clear: 28 }, open: { off: 44, per: 80, spread: 15, size: 1.35 } };
function chordDrifts(r, near, out, which) {
  const put = (x, z, colour, size, clear = FLOWER.clear) => {
    const f = flowerAt(r, x, z, groundY(x, z), { colour, size });
    if (insidePaint(x, z) < 4 || waterOut(x, z) < 2.5 || Math.hypot(x - ELM_AT.x, z - ELM_AT.z) < 12 || Math.hypot(x - MAY_AT.x, z - MAY_AT.z) < 10) return;
    const [a, c] = laneOf(x, z); if (a > -LANE.before - 8 && a < LANE.beyond + 8 && Math.abs(c) < LANE.side + 8) return;
    const pl = near.plan(x, z), reach = f.R + windReach(f.stalk.wind, 1) + Math.hypot(f.stalk.e[0] - x, f.stalk.e[2] - z);
    if (pl.dist - reach < clear) return;
    if (pl.dist < FLOWER.near) { out.nearStalks.push(f.stalk); out.nearHeads.push(f.dab); } else { out.farStalks.push(f.stalk); out.farHeads.push(f.dab); }
  };
  const P = routePlan();
  if (which === 'open') {
    const O = CHORD.open, hx = P.R0[0] - P.Q[0], hz = P.R0[1] - P.Q[1], l = Math.hypot(hx, hz) || 1, rt = rightOf([hx / l, hz / l]);
    for (let i = 0; i < O.per; i++) { const t = r(); put(lerp(P.Q[0], P.R0[0], t) + rt[0] * O.off + r.gauss() * O.spread * 1.5, lerp(P.Q[1], P.R0[1], t) + rt[1] * O.off + r.gauss() * O.spread, CHORD.orange, O.size); }
    return;
  }
  if (which === 'cobalt') {
    const B = CHORD.bank, at = (az) => { const h = head(az); return armNear(MAY_AT.x + h[0] * ARM.round, MAY_AT.z + h[1] * ARM.round).m; }, m0 = at(ARM.bend[0]), m1 = at(ARM.bend[ARM.bend.length - 1]), p = [0, 0, 0, 0];
    for (let k = 0; k < B.drifts; k++) {
      const mid = lerp(m0, m1, (k + r.range(0.2, 0.8)) / B.drifts);
      for (let i = 0; i < B.per; i++) {
        armAt(mid + r.gauss() * B.along, p);
        const side = ((p[0] - MAY_AT.x) * -p[3] + (p[1] - MAY_AT.z) * p[2]) >= 0 ? 1 : -1, d = side * (ARM.half + r.range(B.off[0], B.off[1]));
        put(p[0] - p[3] * d, p[1] + p[2] * d, CHORD.cobalt, B.size);
      }
    }
    return;
  }
  const F = CHORD.far, a = P.P5, b = P.M, hx = b[0] - a[0], hz = b[1] - a[1], l = Math.hypot(hx, hz) || 1, rt = rightOf([hx / l, hz / l]);
  for (let k = 0; k < F.drifts; k++) {
    const t = (k + r.range(0.1, 0.9)) / F.drifts, off = (k % 2 ? 1 : -1) * r.range(F.off[0], F.off[1]), cx = lerp(a[0], b[0], t) + rt[0] * off, cz = lerp(a[1], b[1], t) + rt[1] * off, spread = r.range(F.spread[0], F.spread[1]);
    for (let i = 0; i < F.per; i++) put(cx + r.gauss() * spread * 1.6, cz + r.gauss() * spread, CHORD.yellow, F.size, F.clear);
  }
}
// The belt beyond the fixed walls: strokes 40 to 60 m tall from LANE.fixedSide to LANE.side to either hand of the lane,
// four in ten of them in one row along the belt's near edge (the wall of towers seen from the far meadow).
function farBelt(r, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const front = i < count * 0.4, sg = i % 2 ? 1 : -1, c = sg * r.range(LANE.fixedSide + 4, LANE.side), a = front ? -LANE.before + r.range(0, 22) : r.range(-LANE.before + 22, LANE.beyond);
    const [x, z] = laneAt(a, c);
    out.push(standing(r, x, z, groundY(x, z), { tall: BELT_TALL, lean: [0.02, 0.1], face: Math.atan2(-LANE.f[1], -LANE.f[0]), faceTurn: 1.2, bow: 0.05, w: [6, 10], th: [1.5, 2.5], wind: [2, 4], taper: [0.3, 0.55] }));
  }
  return out;
}

// ------------------------------------------------------------------ THE CLOUDS (the visit's stream; they drift on the world clock)
// Separate slabs of white, each in its own row of z, drifting toward -X at CLOUD.speed along one run of x, thinning to
// nothing over CLOUD.fade at either end of the run and laid again at the other. A cloud's shade lies on the field
// CLOUD.shade from under it, away from the sun (the rows are so placed that the shades cross the meadow, the belt's
// near face and the lane's first half, and none reaches the lane's last 60 m: the deepest row's far edge stops short
// of them). They stand 130 m and more over the line and far over the sight to the boss.
const CLOUD = { y: [190, 250], z: [-420, -905], run: [-1050, 760], speed: 4, fade: 170, thick: 12, len: [190, 330], wide: [80, 135], shade: [-120, 330], rag: 45, bay: 12, bayN: 3, bayWide: [60, 80] };
function dealClouds(r, count) {
  const out = [], white = lin('#F7F3E8'), order = r.shuffle(Array.from({ length: count }, (_, i) => i));
  for (let i = 0; i < count; i++) out.push({ x0: CLOUD.run[0] + (order[i] + r.range(0.1, 0.9)) / count * (CLOUD.run[1] - CLOUD.run[0]), z: lerp(CLOUD.z[0], CLOUD.z[1], (i + r.range(0.2, 0.8)) / count),
    y: r.range(CLOUD.y[0], CLOUD.y[1]), len: r.range(CLOUD.len[0], CLOUD.len[1]), wide: r.range(CLOUD.wide[0], CLOUD.wide[1]), tilt: r.range(0.2, 0.5),
    ca: mix3(HEAP.under[0], white, r.range(0, 0.3)), cb: mix3(HEAP.under[1], HEAP.under[0], r.range(0.2, 0.7)), seed: r(), taper: 1 });
  // THE MAY TREE STANDS IN SUN: a row whose shade would touch the may tree's crown lies nearer us instead (its shade's
  // far edge CLOUD.bay before the crown)
  for (const k of out) k.z = bayRow(k.z, k.wide, 1);
  return out;
}
// (a cloud row's z, moved to the side asked if its shade, ragged edge and all, would touch the may tree's crown)
const bayRow = (z, wide, side) => { const reach = wide / 2 + CLOUD.rag + MAY.reach; return Math.abs(z + CLOUD.shade[1] - MAY_AT.z) < reach ? MAY_AT.z - CLOUD.shade[1] + side * (reach + CLOUD.bay) : z; };
// THE BAY'S CLOUDS (a fixed stream; the same on every seed): CLOUD.bayN clouds on the one row whose shade lies just
// beyond the may tree (its near edge CLOUD.bay beyond the crown), following one another at even shares of the run: at
// any clock one of their shades lies on the far bay, behind the white tree. They are narrow (CLOUD.bayWide), so that
// their shade's far edge stops short of the lane's last 60 m as every cloud's does.
function bayClouds() {
  const r = makeRng(hashSeed(FIXED + ":the bay's clouds")), white = lin('#F7F3E8'), out = [];
  for (let i = 0; i < CLOUD.bayN; i++) { const wide = r.range(CLOUD.bayWide[0], CLOUD.bayWide[1]);
    out.push({ x0: CLOUD.run[0] + (i + r.range(0.3, 0.7)) / CLOUD.bayN * (CLOUD.run[1] - CLOUD.run[0]), z: bayRow(MAY_AT.z - CLOUD.shade[1], wide, -1), y: r.range(CLOUD.y[0], CLOUD.y[1]), len: r.range(CLOUD.len[0], CLOUD.len[1]), wide, tilt: r.range(0.2, 0.5),
      ca: mix3(HEAP.under[0], white, r.range(0, 0.3)), cb: mix3(HEAP.under[1], HEAP.under[0], r.range(0.2, 0.7)), seed: r(), taper: 1 }); }
  return out;
}
// A cloud is HEAPED: its slab is the violet underside, and HEAP.n loaded white dabs stand along the slab's edge toward
// the picture plane, each HEAP.R of the slab's length in radius, lapping one another. dealHeaps gives each cloud its
// dabs (a stream of their own); heapAt writes dab j of cloud k at a clock (it rides its slab).
const HEAP = { n: 4, R: [0.13, 0.2], under: [lin('#A9A6D6'), lin('#8E8CC6')] };
function dealHeaps(r, clouds) {
  const white = lin('#FBF8EE');
  return clouds.map((k) => Array.from({ length: HEAP.n }, (_, j) => ({ along: (j + r.range(0.15, 0.85)) / HEAP.n - 0.5, R: k.len * r.range(HEAP.R[0], HEAP.R[1]), up: r.range(0.25, 0.6), out: r.range(0.25, 0.5),
    turn: r.range(0, TAU), ca: mul3(white, r.range(0.97, 1.03)), cb: mix3(white, lin('#E4E0F2'), r.range(0.1, 0.5)), seed: r() })));
}
const _cs = { h: [0, 0, 0], e: [0, 0, 0], n: [0, 0, 0] };
function heapAt(k, d, time, s) {
  cloudAt(k, time, _cs, null);
  const ends = _cs.th / CLOUD.thick, x = (_cs.h[0] + _cs.e[0]) / 2 + d.along * k.len * 0.8, y = k.y + d.R * d.up * ends, z = k.z + d.out * k.wide / 2, R = d.R * ends, c = Math.cos(d.turn) * R, sn = Math.sin(d.turn) * R;
  s.h[0] = x - c; s.h[1] = y - sn * 0.5; s.h[2] = z; s.e[0] = x + c; s.e[1] = y + sn * 0.5; s.e[2] = z;
  s.b[0] = 0; s.b[1] = 0; s.b[2] = 0; s.n[0] = 0; s.n[1] = -0.2; s.n[2] = 0.98; s.w = 2 * R; s.th = R * 0.9; s.ca = d.ca; s.cb = d.cb; s.seed = d.seed; s.taper = 1; s.wind = 0;
  return s;
}
// writes cloud k at a clock into stroke s and its shade into the vector sh (x, z, half length, half width)
function cloudAt(k, time, s, sh) {
  const run = CLOUD.run[1] - CLOUD.run[0], x = CLOUD.run[0] + (((k.x0 - CLOUD.run[0] - CLOUD.speed * time) % run) + run) % run;
  const ends = smoothstep(0, CLOUD.fade, x - CLOUD.run[0]) * smoothstep(0, CLOUD.fade, CLOUD.run[1] - x);
  s.h[0] = x + k.len / 2; s.h[1] = k.y; s.h[2] = k.z; s.e[0] = x - k.len / 2; s.e[1] = k.y; s.e[2] = k.z;
  s.n[0] = 0; s.n[1] = -Math.cos(k.tilt); s.n[2] = Math.sin(k.tilt);
  s.w = k.wide * ends; s.th = CLOUD.thick * ends; s.ca = k.ca; s.cb = k.cb; s.seed = k.seed; s.taper = 1;
  if (sh) sh.set(x + CLOUD.shade[0], k.z + CLOUD.shade[1], k.len / 2 * ends, k.wide / 2 * ends);
  return s;
}

// ------------------------------------------------------------------ THE LARKS, THE BUTTERFLIES, THE FOAM (the visit's streams; the world clock moves them)
// A lark: one tick of two strokes that climbs a spiral LARK.ring wide to LARK.top and drops again, round after round on
// the clock from its own phase. THE LARKS' RULE: each loop's axis stands LARK.off and more from the line in plan (the
// ring and the wings are inside that), over the far meadow, outside the belt.
const LARK = { ring: 12, wing: 3.2, wide: 2.5, low: 9, top: 90, off: 50, z: [-430, -590], x: [-330, 240], colour: lin('#4A3A2E'), colour2: lin('#7A6248') };
function dealLarks(r, near, count) {
  const out = [];
  for (let tries = 0; out.length < count && tries < 600; tries++) {
    const x = r.range(LARK.x[0], LARK.x[1]), z = r.range(LARK.z[1], LARK.z[0]), [a, c] = laneOf(x, z);
    if (near.plan(x, z).dist < LARK.off || (a > -LANE.before - 30 && Math.abs(c) < LANE.side + 30)) continue;
    out.push({ x, z, round: r.range(22, 34), phase: r(), turns: r.int(3, 5), dir: r.sign(), beat: r.range(5, 7), beatPhase: r.range(0, TAU), seed: r() });
  }
  return out;
}
function larkAt(k, time, out) {
  const ph = (((time / k.round + k.phase) % 1) + 1) % 1, up = ph < 0.74 ? smoothstep(0, 1, ph / 0.74) : 1 - smoothstep(0, 1, (ph - 0.74) / 0.26);
  const a = k.dir * ph * k.turns * TAU, c = Math.cos(a), s = Math.sin(a), x = k.x + c * LARK.ring, z = k.z + s * LARK.ring, y = LARK.low + (LARK.top - LARK.low) * up;
  // climbing it beats; dropping it holds its wings high and half shut
  const lift = (ph < 0.74 ? 26 + 22 * Math.sin(time * k.beat + k.beatPhase) : 62) * DEG, reach = LARK.wing * Math.cos(lift), rise = LARK.wing * Math.sin(lift);
  for (let w = 0; w < 2; w++) {
    const sg = w ? -1 : 1, o = out[w];
    o.h[0] = x; o.h[1] = y; o.h[2] = z; o.e[0] = x + sg * c * reach; o.e[1] = y + rise; o.e[2] = z + sg * s * reach;
    o.b[0] = -s * k.dir * 0.4; o.b[1] = 0.4; o.b[2] = c * k.dir * 0.4; o.n[0] = 0; o.n[1] = 1; o.n[2] = 0;
  }
  return out;
}
// A butterfly: a pair of small dabs hinged on one line, flitting inside a box FLIT.box wide and FLIT.high tall about
// its own place over a bank. THE BUTTERFLIES' RULE: the box's middle stands FLIT.off and more from the line, so with
// the box's half diagonal and a wing no part comes within 6 m of it at any clock.
const FLIT = { box: 2.6, high: 1.2, wing: 1.3, off: 11.5, y: [4.5, 8], colours: [[lin('#F7F3E8'), lin('#E9E2C4')], [lin('#F2D85C'), lin('#F2C230')], [lin('#B9D4EC'), lin('#F7F3E8')], [lin('#F0A8BC'), lin('#F7F3E8')]] };
function dealButterflies(r, near, count) {
  const out = [], p = [0, 0, 0, 0], end = brookNear(FOAM.east, -385).m;
  for (let tries = 0; out.length < count && tries < 900; tries++) {
    brookAt(r.range(20, end), p); const d = r.sign() * (BROOK.half + r.range(4, 26)), x = p[0] - p[3] * d, z = p[1] + p[2] * d, y = groundY(x, z) + r.range(FLIT.y[0], FLIT.y[1]);
    if (near.dist(x, y, z) < FLIT.off) continue;
    out.push({ x, y, z, f: [r.range(0.5, 0.9), r.range(0.7, 1.2), r.range(0.4, 0.8)], q: [r.range(0, TAU), r.range(0, TAU), r.range(0, TAU)], beat: r.range(9, 13), beatPhase: r.range(0, TAU), col: r.pick(FLIT.colours), seed: r() });
  }
  return out;
}
function butterflyAt(k, time, out) {
  const x = k.x + FLIT.box * Math.sin(time * k.f[0] + k.q[0]), y = k.y + FLIT.high * Math.sin(time * k.f[1] + k.q[1]), z = k.z + FLIT.box * Math.sin(time * k.f[2] + k.q[2]);
  // it heads the way it moves in plan; its wings open and shut about that line
  let dx = k.f[0] * Math.cos(time * k.f[0] + k.q[0]), dz = k.f[2] * Math.cos(time * k.f[2] + k.q[2]); const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  const th = 0.25 + 0.95 * (0.5 + 0.5 * Math.sin(time * k.beat + k.beatPhase)), ct = Math.cos(th), st = Math.sin(th), half = FLIT.wing / 2;
  for (let w = 0; w < 2; w++) {
    const sg = w ? -1 : 1, o = out[w], ox = -dz * sg * ct, oy = st, oz = dx * sg * ct, cx = x + ox * half, cy = y + oy * half, cz = z + oz * half;
    o.h[0] = cx - dx * half; o.h[1] = cy; o.h[2] = cz - dz * half; o.e[0] = cx + dx * half; o.e[1] = cy; o.e[2] = cz + dz * half;
    o.n[0] = dz * sg * st; o.n[1] = ct; o.n[2] = -dx * sg * st; o.w = FLIT.wing; o.th = 0.35; o.ca = k.col[0]; o.cb = k.col[1]; o.seed = k.seed; o.taper = 1; o.wind = 0;
  }
  return out;
}
// THE MAY TREE'S PETALS (one fixed stream; the world clock moves them): PETAL.n small white dabs that come off the
// crown on the wind and sink to the grass, each along its own straight course from a place in the crown's lee to the
// ground PETAL.far metres downwind (WIND.dir), round after round from its own phase. A petal grows from nothing over
// the first tenth of its course and is gone into the grass over the last eighth. The courses lie to the south-west
// of the tree, the side away from the line (which passes it to the north-east): counted by place.
const PETAL = { n: 40, far: [40, 95], round: [9, 16], R: [0.55, 0.95], side: 14 };
function dealPetals() {
  const r = makeRng(hashSeed(FIXED + ':the may petals')), out = [], wl = Math.hypot(WIND.dir[0], WIND.dir[1]), wx = WIND.dir[0] / wl, wz = WIND.dir[1] / wl;
  for (let i = 0; i < PETAL.n; i++) {
    const side = r.range(-0.8, 0.8) * MAY.reach, back = r.range(0, 0.6) * MAY.reach, far = r.range(PETAL.far[0], PETAL.far[1]), off = r.range(-1, 1) * PETAL.side;
    const x0 = MAY_AT.x - wz * side + wx * back, z0 = MAY_AT.z + wx * side + wz * back, x1 = x0 + wx * far - wz * off, z1 = z0 + wz * far + wx * off;
    out.push({ x0, y0: MAY_AT.y + r.range(14, MAY.top - 4), z0, x1, y1: groundY(x1, z1) + 0.4, z1, round: r.range(PETAL.round[0], PETAL.round[1]), phase: r(), R: r.range(PETAL.R[0], PETAL.R[1]), turn: r.range(0, TAU), seed: r() });
  }
  return out;
}
function petalAt(k, time, s) {
  const q = (((time / k.round + k.phase) % 1) + 1) % 1, size = smoothstep(0, 0.1, q) * (1 - smoothstep(0.875, 1, q)), a = k.turn + time * 1.1, c = Math.cos(a) * k.R, sn = Math.sin(a) * k.R;
  const x = lerp(k.x0, k.x1, q), z = lerp(k.z0, k.z1, q), y = lerp(k.y0, k.y1, Math.pow(q, 1.4)) + 0.8 * (1 - q) * Math.sin(time * 1.3 + k.seed * 40);
  s.h[0] = x - c; s.h[1] = y; s.h[2] = z - sn; s.e[0] = x + c; s.e[1] = y; s.e[2] = z + sn; s.b[0] = s.b[1] = s.b[2] = 0;
  s.n[0] = 0.6 * Math.sin(time * 0.9 + k.seed * 9); s.n[1] = 0.75; s.n[2] = 0.6 * Math.cos(time * 0.9 + k.seed * 9); s.w = 2 * k.R * size; s.th = k.R * 0.5 * size; s.seed = k.seed; s.taper = 1; s.wind = 0;
  return s;
}
// The foam: white dabs that lie on the water where the brook bends most and turn there in the eddy, on the clock.
const FOAM = { count: 14, bend: 0.045, lift: 0.5, east: 46 };
function dealFoam(r) {
  const out = [], a = [0, 0, 0, 0], b = [0, 0, 0, 0], white = lin('#F7F3E8');
  for (let tries = 0; out.length < FOAM.count && tries < 900; tries++) {
    const m = r.range(12, BROOK_LEN - 30); brookAt(m - 8, a); brookAt(m + 8, b);
    // how far the stream turns in 16 m here
    if (Math.abs(a[2] * b[3] - a[3] * b[2]) < FOAM.bend * 16 / 10) continue;
    brookAt(m, a); const d = r.range(-1, 1) * (BROOK.half - 3);
    out.push({ x: a[0] - a[3] * d, z: a[1] + a[2] * d, R: r.range(1.3, 2.1), rate: r.range(0.25, 0.6) * r.sign(), phase: r.range(0, TAU), ca: mul3(white, r.range(0.95, 1.02)), cb: mix3(white, lin('#A9CBE2'), r.range(0.2, 0.5)), seed: r() });
  }
  return out;
}
function foamAt(k, time, s) {
  const a = k.phase + time * k.rate, c = Math.cos(a) * k.R, sn = Math.sin(a) * k.R, y = BROOK.surface + FOAM.lift;
  s.h[0] = k.x - c; s.h[1] = y; s.h[2] = k.z - sn; s.e[0] = k.x + c; s.e[1] = y; s.e[2] = k.z + sn;
  s.n[0] = 0; s.n[1] = 1; s.n[2] = 0; s.w = 2 * k.R; s.th = 0.7; s.ca = k.ca; s.cb = k.cb; s.seed = k.seed; s.taper = 1; s.wind = 0;
  return s;
}

// ------------------------------------------------------------------ THE DEW, THE LANE'S FOOT, THE DRIPS, THE RAIN
// A dew glint: a small white dab on the edge of a stroke near its tip, holding nothing. It rides its stroke in the wind
// (its anchor is the stroke's root, its sway the stroke's own at that share, its beat the stroke's). keep(x, y, z, stroke)
// says where one may sit (the lane's glints are kept or left out by their stroke's ROOT, as the walls themselves are): none within DEW.before of the opening's plane or beyond it.
const DEW = { size: 0.6, lane: 30, fore: 16, bank: 14, before: 8 };
function dewOn(r, list, count, keep) {
  const out = [], white = lin('#FFFDF2');
  for (let tries = 0; out.length < count && tries < count * 20 && list.length; tries++) {
    const s = r.pick(list), t = r.range(0.72, 0.97), q = strokeSkin(s, t)[r.int(0, 3)], a = r.range(0, TAU), half = DEW.size / 2;
    if (keep && !keep(q[0], q[1], q[2], s)) continue;
    const n = [r.range(-0.5, 0.5), r.range(0.2, 0.8), 1], nl = Math.hypot(n[0], n[1], n[2]);
    out.push({ h: [q[0] - Math.cos(a) * half, q[1], q[2] - Math.sin(a) * half], e: [q[0] + Math.cos(a) * half, q[1], q[2] + Math.sin(a) * half], b: [s.h[0] - (q[0] - Math.cos(a) * half), 0, s.h[2] - (q[2] - Math.sin(a) * half)],
      n: [n[0] / nl, n[1] / nl, n[2] / nl], w: DEW.size, th: DEW.size * 0.8, ca: white, cb: white, seed: s.seed, wind: (s.wind || 0) * t * t, taper: 1 });
  }
  return out;
}
// Small dabs lying along the foot of the lane's walls (the fixed stream: the same on every seed), FOOT.out from the
// axis, on the floor 12 m under the line; none within FOOT.before of the opening's plane.
const FOOT = { count: 44, out: [6.5, 10.5], size: [0.9, 1.5], before: 10 };
function laneFoot() {
  const r = makeRng(hashSeed(FIXED + ':lane foot')), out = [], cols = [[lin('#F2C230'), lin('#F0A81C')], [lin('#E58FA8'), lin('#EFB4C4')], [lin('#F7F3E8'), lin('#E9E2C4')], [GRASS.pale, GRASS.lit]];
  for (let i = 0; i < FOOT.count; i++) {
    const [x, z] = laneAt(r.range(-LANE.before - 6, -FOOT.before), r.sign() * r.range(FOOT.out[0], FOOT.out[1])), R = r.range(FOOT.size[0], FOOT.size[1]), a = r.range(0, TAU), col = r.pick(cols), k = r.range(0.9, 1.1);
    out.push({ h: [x - Math.cos(a) * R, LANE.floor + 0.25, z - Math.sin(a) * R], e: [x + Math.cos(a) * R, LANE.floor + 0.25, z + Math.sin(a) * R], b: [0, 0, 0], n: [r.range(-0.2, 0.2), 1, r.range(-0.2, 0.2)],
      w: 2 * R, th: R * 0.9, ca: mul3(col[0], k), cb: mul3(col[1], k), seed: r(), wind: 0, taper: 1 });
  }
  return out;
}
// RARE, the paint very wet: drips hang straight down from the lowest edge of thick strokes OFF THE JOIN, DRIP.long
// long. A drip is an elongated dab that rides its stroke in the wind as a dew glint does; it hangs below its own
// stroke's skin, so it comes no nearer the line than the stroke does wherever the line is above (the bank strokes) and
// stands far from it elsewhere (the belt beyond the fixed walls, the sky's slabs).
const DRIP = { long: [0.6, 1.5], wide: [0.5, 0.9] };
function dripsOn(r, list, count, slab) {
  const out = [];
  for (let i = 0; i < count && list.length; i++) {
    const s = r.pick(list), t = r.range(0.15, 0.85), mid = strokePoint(s, t); let q;
    if (slab) { const tx = s.e[0] - s.h[0], ty = s.e[1] - s.h[1], tz = s.e[2] - s.h[2], bx = s.n[1] * tz - s.n[2] * ty, by = s.n[2] * tx - s.n[0] * tz, bz = s.n[0] * ty - s.n[1] * tx, bl = Math.hypot(bx, by, bz) || 1, sg = by > 0 ? -1 : 1;
      q = [mid[0] + sg * bx / bl * s.w / 2, mid[1] + sg * by / bl * s.w / 2, mid[2] + sg * bz / bl * s.w / 2]; }
    else { const c = strokeSkin(s, t), top = c.filter((v) => v[1] >= mid[1] - 0.05); q = (top.length ? top : c).reduce((a, b) => (b[1] < a[1] ? b : a)); }
    const len = r.range(DRIP.long[0], DRIP.long[1]), w = r.range(DRIP.wide[0], DRIP.wide[1]); let nx = q[0] - mid[0], nz = q[2] - mid[2]; const nl = Math.hypot(nx, nz); if (nl < 1e-3) { nx = 1; nz = 0; } else { nx /= nl; nz /= nl; }
    out.push({ h: [q[0], q[1] + 0.1, q[2]], e: [q[0], q[1] - len, q[2]], b: [s.h[0] - q[0], 0, s.h[2] - q[2]], n: [nx, 0, nz], w, th: w * 0.8, ca: s.ca, cb: s.cb || s.ca, seed: s.seed ?? 0, wind: (s.wind || 0) * t * t, taper: 1 });
  }
  return out;
}
// THE RAIN SEED: one slab of grey cloud RAIN.slab over the ridge's left end (slab D) and short slanting strokes of grey
// blue falling under it, far off: they slide down their own slant at RAIN.speed on the world clock and are laid again
// at the slab. It stands 34 degrees and more left of the lane, far outside the entry picture, never before the boss.
const RAIN = { x: [-946, -652], z: -1052, y: [98, 228], count: 60, slant: 0.34, len: [30, 48], speed: 26, slab: { x: [-570, -1070], y: 238, z: -1076, wide: 120, thick: 14 } };
function dealRain(r) {
  const out = [], cols = [lin('#7F8FB4'), lin('#6C7CA6'), lin('#93A2C2')];
  for (let i = 0; i < RAIN.count; i++) { const ca = r.pick(cols); out.push({ x: r.range(RAIN.x[0], RAIN.x[1]), z: RAIN.z + r.range(-14, 14), y0: r.range(0, RAIN.y[1] - RAIN.y[0]), len: r.range(RAIN.len[0], RAIN.len[1]), w: r.range(3.5, 5.5), ca, cb: mix3(ca, lin('#C9CCE6'), r.range(0.2, 0.6)), seed: r(), taper: r.range(0.3, 0.6) }); }
  return out;
}
function rainAt(k, time, s) {
  const span = RAIN.y[1] - RAIN.y[0], fall = (((k.y0 + RAIN.speed * time) % span) + span) % span, y = RAIN.y[1] - fall, ends = smoothstep(0, 16, fall) * smoothstep(0, 16, span - fall), dy = k.len / Math.hypot(1, RAIN.slant) / 2, x = k.x - RAIN.slant * fall;
  s.h[0] = x + RAIN.slant * dy; s.h[1] = y + dy; s.h[2] = k.z; s.e[0] = x - RAIN.slant * dy; s.e[1] = y - dy; s.e[2] = k.z;
  s.n[0] = 0; s.n[1] = 0; s.n[2] = 1; s.w = k.w * ends; s.th = 1.2 * ends; s.ca = k.ca; s.cb = k.cb; s.seed = k.seed; s.taper = k.taper; s.wind = 0;
  return s;
}
function rainSlab() { const S = RAIN.slab, grey = lin('#8E90A8'); return { h: [S.x[0], S.y, S.z], e: [S.x[1], S.y, S.z], n: [0, -0.9, 0.44], w: S.wide, th: S.thick, ca: grey, cb: lin('#6F7396'), seed: 0.61, taper: 1 }; }

export const fieldThings = { meadowGround, dealBrook, brookStroke, bankStrokes, flowers, farBelt, dealClouds, bayClouds, cloudAt, CLOUD,
  dealLarks, larkAt, LARK, dealButterflies, butterflyAt, FLIT, dealFoam, foamAt, dealStep, stepAt, ledgeSlabs, STEP, brookBed, chordDrifts, CHORD, lowRunFlowers, LOWFL, redPlace, RED, dewOn, laneFoot, dealPetals, petalAt, PETAL, dealArm, armStroke, armStill, ARMW, dripsOn, dealRain, rainAt, rainSlab, RAIN, DEW };

// ------------------------------------------------------------------ the canvas: the ground under the paint and the vault behind the sky
// Primed canvas whose weave is drawn as relief: ropes WEAVE.pitch apart and WEAVE.h high, warp over weft cell by cell.
// The relief fades to its mean tone by the size of a pixel ON THE WEAVE ITSELF (fwidth of the weave's own coordinate),
// so it knows nothing of the eye's distance and never shimmers. Thin paint (the wash texture: rgb its colour, a how
// much of it lies there) sits in the hollows of the weave and skips the crowns of the threads.
const WEAVE = { pitch: 2.8, h: 0.42 };
const CANVAS_VERT = /* glsl */`
varying vec3 vPos, vNrm;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vPos = wp.xyz; vNrm = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*wp; }`;
const CANVAS_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uWash, uShadow, uNoise;
uniform vec4 uWashBox, uShadowBox;
uniform vec3 uSunDir, uSunPos, uKeyCol, uSkyCol, uGroundCol, uShadeCol, uFogCol, uCanvas;
uniform vec2 uShadowY;
uniform float uFogDen, uVault, uShadeK, uTime;
${LIGHT_GLSL}
varying vec3 vPos, vNrm;
void main(){
  vec3 N = normalize(vNrm);
  vec2 w = (uVault > .5 ? vec2(vPos.x + vPos.z, vPos.y) : vPos.xz)*${(1 / WEAVE.pitch).toFixed(3)};
  vec2 fw2 = fwidth(w);
  float rel = 1. - smoothstep(.22, .9, max(fw2.x, fw2.y));
  vec2 cell = floor(w), f = fract(w);
  // THREAD OVER THREAD: the warp thread of column cell.x runs the second way and rides over and under the weft; the
  // weft thread of row cell.y runs the first way on the opposite beat; the one that stands higher shows. Each thread
  // has its own tone the whole way along, so the eye follows it under the next and out again.
  float pw = sin(3.14159*f.x), pf = sin(3.14159*f.y);
  float bw = 3.14159*(w.y - .5 + cell.x), bf = 3.14159*(w.x - .5 + cell.y);
  float hw = .5*pw + .5*cos(bw), hf = .5*pf - .5*cos(bf), top = step(hf, hw);
  float h = clamp(max(hw, hf), 0., 1.);
  vec2 g = top > .5 ? vec2(1.5708*cos(3.14159*f.x), -1.5708*sin(bw)) : vec2(1.5708*sin(bf), 1.5708*cos(3.14159*f.y));
  float tone = fract(sin((top > .5 ? cell.x : cell.y + 57.)*12.9898)*43758.5453);
  vec4 ws = texture2D(uWash, (vPos.xz - uWashBox.xy)*uWashBox.zw);
  float streak = texture2D(uNoise, vPos.xz*vec2(.011, .09)).r;
  // thin paint sits in the hollows of the weave and skips the crowns of its threads; a full coat hides them
  float c0 = uVault > .5 ? 0. : max(clamp(ws.a*(.9 + .3*streak), 0., 1.), smoothstep(.9, .99, ws.a));
  float thin = sqrt(1. - c0);
  float cover = c0*mix(1., .7 + .3*(1. - h), rel*thin);
  // under paint the weave's relief is filled as the coat thickens (gone under a full coat)
  vec3 n = uVault > .5 ? N : normalize(N - vec3(g.x, 0., g.y)*(${WEAVE.h.toFixed(2)}*rel*thin));
  vec3 base = mix(uCanvas*(.8 + .24*mix(.6, h, rel))*(1. + .12*(tone - .5)*rel), ws.rgb, cover);
  vec3 col;
  if (uVault > .5) {
    // the vault behind the sky's slabs: bare primed canvas, paler toward the sun boss
    float near = exp(-distance(vPos, uSunPos)/700.);
    col = base*(.78 + .3*near);
  } else {
    vec4 blots = texture2D(uShadow, (vPos.xz - uShadowBox.xy)*uShadowBox.zw);
    float lowF = 1. - smoothstep(uShadowY.x, uShadowY.y, vPos.y), blot = blots.r*lowF;
    float cl = cloudShade(vPos.xz, texture2D(uNoise, vPos.xz*.0031).a);
    float lit = smoothstep(-.1, .34, dot(n, uSunDir))*(1. - blot)*(1. - cl);
    float hem = n.y*.5 + .5;
    vec3 amb = mix(uGroundCol, uSkyCol, hem);
    vec3 shadeL = (uShadeCol*(.7 + .6*hem) + amb*.22)*(1. - .3*cl)*uShadeK;
    vec3 inShade = mix(base, vec3(.2, .19, .5)*(dot(base, vec3(.3, .5, .2))*1.6 + .08), .36);
    col = mix(inShade*shadeL, base*(uKeyCol + amb*.34), lit);
    vec3 V = normalize(cameraPosition - vPos), Hk = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
    float fres = .05 + .95*pow(1. - clamp(dot(V, Hk), 0., 1.), 5.);
    col += uKeyCol*(pow(clamp(dot(n, Hk), 0., 1.), 40.)*.07*(.3 + 8.*fres)*cover*(1. - blot)*(1. - cl));
    col += dropLight(vPos, n, V, base, blots.g*lowF, .5 + .5*cover);
  }
  float fd = length(cameraPosition - vPos)*uFogDen;
  gl_FragColor = vec4(mix(col, uFogCol, 1. - exp(-fd*fd)), 1.);
}`;
// the ground mesh: a grid whose lines stand GRID.fine metres apart over the painted field and widen to the vault's foot
const GRID = { fine: 12, x: [-500, 460], z: [-800, 20], far: [-1700, 1400, -1560, 660], coarse: 9 };
async function groundGeometry(yieldFn = null) {
  const nodes = (lo, hi, farLo, farHi) => {
    const out = [];
    for (let i = GRID.coarse; i >= 1; i--) out.push(lo + (farLo - lo) * Math.pow(i / GRID.coarse, 1.6));
    for (let v = lo; v <= hi + 1e-6; v += GRID.fine) out.push(v);
    for (let i = 1; i <= GRID.coarse; i++) out.push(hi + (farHi - hi) * Math.pow(i / GRID.coarse, 1.6));
    return out;
  };
  const xs = nodes(GRID.x[0], GRID.x[1], GRID.far[0], GRID.far[1]), zs = nodes(GRID.z[0], GRID.z[1], GRID.far[2], GRID.far[3]);
  if (yieldFn) await yieldFn();
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), nrm = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  for (let j = 0; j < zs.length; j++) {
    for (let i = 0; i < xs.length; i++) { const o = (j * xs.length + i) * 3; pos[o] = xs[i]; pos[o + 1] = groundY(xs[i], zs[j]) - 0.05; pos[o + 2] = zs[j]; }
    if (yieldFn) await yieldFn();
  }
  for (let j = 0, k = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    if (yieldFn && j % 4 === 3) await yieldFn();
  }
  // the normal of each node from the heights of its neighbours on the grid
  for (let j = 0; j < nz; j++) {
    const j0 = Math.max(0, j - 1), j1 = Math.min(nz - 1, j + 1);
    for (let i = 0; i < nx; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1), o = (j * nx + i) * 3;
      const sx = (pos[(j * nx + i1) * 3 + 1] - pos[(j * nx + i0) * 3 + 1]) / (xs[i1] - xs[i0]), sz = (pos[(j1 * nx + i) * 3 + 1] - pos[(j0 * nx + i) * 3 + 1]) / (zs[j1] - zs[j0]);
      const l = Math.hypot(sx, 1, sz); nrm[o] = -sx / l; nrm[o + 1] = 1 / l; nrm[o + 2] = -sz / l;
    }
    if (yieldFn && j % 4 === 3) await yieldFn();
  }
  if (yieldFn) await yieldFn();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ------------------------------------------------------------------ the thin paint under everything (one texture over WASH.box)
// Streaks of thin green dragged level across the field, ragged where the paint ends at the field's edges; the
// brook's bed; the dark floor of the far grass; the lane's floor; the scraped patch taken back to bare weave.
// Drawn from the fixed stream: the same underpainting on every seed. o.yield is awaited between its pieces.
const WASH = { box: [-1080, -1160, 1640, 1220], size: 768, west: 2200 };
async function paintWash(o) {
  const cv = document.createElement('canvas'); cv.width = cv.height = WASH.size;
  const g = cv.getContext('2d'), r = makeRng(hashSeed(FIXED + ':wash')), kx = WASH.size / WASH.box[2], kz = WASH.size / WASH.box[3];
  const X = (x) => (x - WASH.box[0]) * kx, Z = (z) => (z - WASH.box[1]) * kz;
  const streak = (x, z, len, wid, col, alpha, turn = 0.05) => {
    g.save(); g.translate(X(x), Z(z)); g.rotate(r.range(-turn, turn)); g.globalAlpha = alpha; g.fillStyle = col;
    g.beginPath(); g.ellipse(0, 0, len / 2 * kx, wid / 2 * kz, 0, 0, TAU); g.fill(); g.restore();
  };
  const near = ['#7FA050', '#93A85A', '#6E9A4E', '#A9B46A', '#5E8F55', '#8AA24E'], far = ['#4E7F55', '#3F7058', '#5A8A52', '#3A6650'], fore = ['#3F7048', '#4E8046', '#2F5E40'];
  // one thin coat over the whole painted field first, then the streaks dragged across it
  await o.yield();
  g.globalAlpha = 0.72; g.fillStyle = '#6F9850'; g.fillRect(X(PAINTED.x0), Z(PAINTED.z1), (PAINTED.x1 - PAINTED.x0) * kx, (PAINTED.z0 - PAINTED.z1) * kz);
  await o.yield();
  for (let i = 0; i < 3200; i++) {
    const z = r.range(PAINTED.z1 - 20, PAINTED.z0 + 4), x = r.range(PAINTED.bay - 20, PAINTED.x1 + 20), deep = smoothstep(-560, -640, z);
    const set = z > -78 ? fore : r() < deep ? far : near;
    streak(x, z, r.range(50, 170) * (1 + deep), r.range(7, 16) * (1 + deep), r.pick(set), r.range(0.6, 0.9));
    if (i % 80 === 79) await o.yield();
  }
  // the same streaks over the far bay, to the west ridge's foot (a fixed stream of their own)
  { const q = makeRng(hashSeed(FIXED + ':wash: the west meadow'));
    for (let i = 0; i < WASH.west; i++) {
      const z = q.range(PAINTED.z1 - 20, PAINTED.z0 + 4), x = q.range(PAINTED.x0 - 20, PAINTED.bay - 20), deep = smoothstep(-560, -640, z);
      g.save(); g.translate(X(x), Z(z)); g.rotate(q.range(-0.05, 0.05)); g.globalAlpha = q.range(0.6, 0.9); g.fillStyle = q.pick(z > -78 ? fore : q() < deep ? far : near);
      g.beginPath(); g.ellipse(0, 0, q.range(50, 170) * (1 + deep) / 2 * kx, q.range(7, 16) * (1 + deep) / 2 * kz, 0, 0, TAU); g.fill(); g.restore();
      if (i % 80 === 79) await o.yield();
    } }
  // the belt's floor (dark, under the tall grass) and the lane's own floor of thin warm paint
  for (let i = 0; i < 260; i++) { const [x, z] = laneAt(r.range(-LANE.before - 10, LANE.beyond + 10), r.range(-LANE.side, LANE.side)); streak(x, z, r.range(30, 80), r.range(8, 16), r.pick(fore), r.range(0.5, 0.85), 0.4); if (i % 65 === 64) await o.yield(); }
  // the lane's floor is thin: half the coat is taken off along it, so the weave shows through
  g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.5; g.lineWidth = 17 * kx; g.lineCap = 'round'; g.strokeStyle = '#000'; g.beginPath();
  { const a = laneAt(-LANE.before - 4, 0), b = laneAt(LANE.beyond, 0); g.moveTo(X(a[0]), Z(a[1])); g.lineTo(X(b[0]), Z(b[1])); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  await o.yield();
  for (let i = 0; i < 70; i++) { const [x, z] = laneAt(r.range(-LANE.straight - 20, LANE.beyond + 30), r.range(-6, 6)); g.save(); g.translate(X(x), Z(z)); g.rotate(Math.atan2(LANE.f[1], LANE.f[0]) + r.range(-0.08, 0.08));
    g.globalAlpha = r.range(0.35, 0.6); g.fillStyle = r.pick(['#A5A85C', '#8F9A50', '#B8B070', '#7E9048']); g.beginPath(); g.ellipse(0, 0, r.range(14, 30) * kx, r.range(3.5, 6) * kx, 0, 0, TAU); g.fill(); g.restore(); }
  await o.yield();
  // the scraped patch: the knife took the paint off in level drags (before the brook's bed was laid: the water lies over its edge)
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 26; i++) streak(SCRAPE.x + r.range(-0.3, 0.3) * SCRAPE.w, SCRAPE.z + r.range(-0.42, 0.42) * SCRAPE.d, r.range(0.5, 0.9) * SCRAPE.w, r.range(3, 6), '#000', r.range(0.7, 1), 0.03);
  g.globalCompositeOperation = 'source-over';
  // the brook's bed
  g.globalAlpha = 1; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [wid, col] of [[2 * BROOK.half + 12, '#33605C'], [2 * BROOK.half + 2, '#356A86'], [BROOK.half, '#4F86B0']]) {
    g.strokeStyle = col; g.lineWidth = wid * kx; g.beginPath();
    for (let m = 0; m <= BROOK_LEN; m += 6) { const p = brookAt(m); if (m === 0) g.moveTo(X(p[0]), Z(p[1])); else g.lineTo(X(p[0]), Z(p[1])); }
    g.stroke();
    await o.yield();
  }
  // the west arm's bed, as the brook's
  for (const [wid, col] of [[2 * ARM.half + 10, '#33605C'], [2 * ARM.half + 2, '#356A86'], [ARM.half, '#4F86B0']]) {
    g.strokeStyle = col; g.lineWidth = wid * kx; g.beginPath();
    for (let m = 0; m <= ARM_LEN - ARM.rise / 2; m += 6) { const p = armAt(m); if (m === 0) g.moveTo(X(p[0]), Z(p[1])); else g.lineTo(X(p[0]), Z(p[1])); }
    g.stroke();
    await o.yield();
  }
  // the pool's bed under the step
  for (const [rad, col] of [[POOL.r + 6, '#33605C'], [POOL.r + 1, '#356A86'], [POOL.r * 0.55, '#4F86B0']]) { g.fillStyle = col; g.beginPath(); g.ellipse(X(POOL.at[0]), Z(POOL.at[1]), rad * kx, rad * kz, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = false; texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false;
  return { texture, box: new THREE.Vector4(WASH.box[0], WASH.box[1], 1 / WASH.box[2], 1 / WASH.box[3]) };
}

// ------------------------------------------------------------------ the collar: the one thing built that is not paint
// Clear water joining the blade's tip to the drop: a small bead behind the opening's plane, over the circle's top.
const COLLAR = { wide: 1.6, y0: DROP.y + DROP.r, y1: DROP.y + DROP.r + 1.1, deep: 0.9 };
const WATER_VERT = /* glsl */`
uniform float uTime;
varying vec3 vPos, vNrm;
void main(){
  vec3 p = position;
  // it shimmers: its skin works a few centimetres on the clock; its place never moves
  p += normal*(.035*sin(uTime*5.3 + position.y*9.) + .025*sin(uTime*3.1 + position.x*11.));
  vec4 wp = modelMatrix*vec4(p, 1.); vPos = wp.xyz; vNrm = normalize(mat3(modelMatrix)*normal);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const WATER_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSunDir, uKeyCol, uSkyCol, uGroundCol, uFogCol, uTint, uDropCol;
uniform vec4 uDrop;
uniform float uFogDen, uTime;
varying vec3 vPos, vNrm;
void main(){
  vec3 N = normalize(vNrm), V = normalize(cameraPosition - vPos);
  float fr = pow(1. - clamp(dot(N, V), 0., 1.), 2.5);
  vec3 R = reflect(-V, N);
  vec3 env = mix(uGroundCol*1.4, uSkyCol*1.5, smoothstep(-.3, .5, R.y));
  // its two highlights: the world's one key, and the drop's light from the drop's own place under it
  float sp = pow(clamp(dot(N, normalize(uSunDir + V + vec3(0., 1e-4, 0.))), 0., 1.), 90.), sd = pow(clamp(dot(N, normalize(normalize(uDrop.xyz - vPos) + V + vec3(0., 1e-4, 0.))), 0., 1.), 40.);
  vec3 col = mix(uTint*.55, env, .25 + .75*fr) + uKeyCol*sp*1.4 + uDropCol*sd*.8;
  float fd = length(cameraPosition - vPos)*uFogDen;
  gl_FragColor = vec4(mix(col, uFogCol, 1. - exp(-fd*fd)), .5 + .5*fr + sp + sd*.6);
}`;

// ------------------------------------------------------------------ the sky: a vault of canvas, knife slabs on it, the boss, the ridge
// a point of the vault at angle th round it and be up it, and the unit normal there that looks inward
const vaultAt = (th, be) => [VAULT.x + VAULT.a * Math.cos(be) * Math.cos(th), VAULT.y + VAULT.b * Math.sin(be), VAULT.z + VAULT.c * Math.cos(be) * Math.sin(th)];
// a point brought back onto the vault along the line from its middle
function onVault(p) { const k = Math.hypot((p[0] - VAULT.x) / VAULT.a, (p[1] - VAULT.y) / VAULT.b, (p[2] - VAULT.z) / VAULT.c) || 1; return [VAULT.x + (p[0] - VAULT.x) / k, VAULT.y + (p[1] - VAULT.y) / k, VAULT.z + (p[2] - VAULT.z) / k]; }
const SKY_LEVEL = 0.62;
// the courses of the sky's slabs slant: each slab's long way climbs SKY.slant (radians) to the right, a little more or
// less by its own draw; SKY.grow: how much longer and broader the slabs are laid than the rows' own measures
const SKY = { slant: 0.2, grow: 1.18, warm: [27, 9], from: [-20, 30, -318] };
function vaultIn(p) { const n = [-(p[0] - VAULT.x) / VAULT.a ** 2, -(p[1] - VAULT.y) / VAULT.b ** 2, -(p[2] - VAULT.z) / VAULT.c ** 2], l = Math.hypot(n[0], n[1], n[2]); return [n[0] / l, n[1] / l, n[2] / l]; }
// The slabs, row over row: [how far up the vault (radians), how many, width up the vault, length round it]. Primrose
// low, pale blue high, paler toward the boss; each laid a little inside the canvas by its own draw so they overlap.
const SKY_ROWS = [[[0.1, 0.2], 15, [130, 200], [300, 420]], [[0.36, 0.55], 15, [200, 290], [280, 420]], [[0.7, 0.92], 16, [250, 380], [250, 420]],
  [[1.0, 1.22], 16, [300, 420], [300, 420]], [[1.32, 1.5], 9, [300, 420], [300, 420]], [[0.25, 1.1], 9, [250, 400], [250, 420]]];
function skySlabs(rng, low) {
  const out = [], hi = lin('#A9CBE2'), lo = lin(low), pale = lin('#FFF3B8'), white = lin('#F7F3E8'), cream = lin('#FFEFB4'), gold = lin('#FFD777'), sunTh = Math.atan2((SUN.z - VAULT.z) / VAULT.c, (SUN.x - VAULT.x) / VAULT.a);
  for (const [be, n, wid, len] of SKY_ROWS) {
    const turn = rng.range(0, TAU);
    for (let i = 0; i < n; i++) {
      const th = turn + (i + rng.range(-0.35, 0.35)) / n * TAU, b = rng.range(be[0], be[1]), w = rng.range(wid[0], wid[1]) * SKY.grow, l = rng.range(len[0], len[1]) * SKY.grow;
      const round = Math.hypot(VAULT.a * Math.cos(b) * Math.sin(th), VAULT.c * Math.cos(b) * Math.cos(th)), dth = l / 2 / Math.max(round, 200) * (rng.chance(0.5) ? 1 : -1), tilt = Math.sign(dth) * SKY.slant * l / 2 / VAULT.b + rng.range(-0.04, 0.04);
      const inset = rng.range(6, 44), mid = vaultAt(th, b), nin = vaultIn(mid); let h = vaultAt(th - dth, b - tilt), e = vaultAt(th + dth, b + tilt);
      // high on the vault the knife is drawn level across the picture (along x, a little turned), not round the zenith
      if (b > SKY_LEVEL) { const a = SKY.slant + rng.range(-0.12, 0.12), dx = Math.cos(a) * l / 2, dz = Math.sin(a) * l / 2; h = onVault([mid[0] - dx, mid[1], mid[2] - dz]); e = onVault([mid[0] + dx, mid[1], mid[2] + dz]); }
      const hn = vaultIn(h), en = vaultIn(e);
      for (let k = 0; k < 3; k++) { mid[k] += nin[k] * inset; h[k] += hn[k] * inset; e[k] += en[k] * inset; }
      // toward the boss the sky is paler; each slab its own step of colour
      let dT = Math.abs(th - sunTh) % TAU; if (dT > Math.PI) dT = TAU - dT;
      const up = smoothstep(0.22, 0.95, b + rng.range(-0.12, 0.12)), nearSun = smoothstep(1.1, 0.1, dT) * smoothstep(0.9, 0.2, b);
      let ca = mix3(mix3(lo, hi, up), pale, 0.55 * nearSun); ca = mix3(ca, white, rng.range(0, 0.25)); let cb = mix3(ca, rng.chance(0.5) ? hi : lo, rng.range(0.15, 0.5));
      // THE SUN WARMS THE SKY ROUND IT: a slab whose middle stands within SKY.warm[0] degrees of the boss, as the
      // middle of the far meadow sees both, is turned toward cream and pale gold, wholly so within SKY.warm[1]
      { const d0 = [mid[0] - SKY.from[0], mid[1] - SKY.from[1], mid[2] - SKY.from[2]], d1 = [SUN.x - SKY.from[0], SUN.y - SKY.from[1], SUN.z - SKY.from[2]];
        const ang = Math.acos(clamp((d0[0] * d1[0] + d0[1] * d1[1] + d0[2] * d1[2]) / (Math.hypot(...d0) * Math.hypot(...d1)), -1, 1)) / DEG, warm = smoothstep(SKY.warm[0], SKY.warm[1], ang);
        ca = mix3(ca, cream, 0.8 * warm); cb = mix3(cb, gold, 0.7 * warm); }
      out.push({ h, e, b: [2 * (mid[0] - (h[0] + e[0]) / 2), 2 * (mid[1] - (h[1] + e[1]) / 2), 2 * (mid[2] - (h[2] + e[2]) / 2)], n: nin, w, th: rng.range(6, 10), ca: mul3(ca, rng.range(0.94, 1.04)), cb, seed: rng(), taper: 1 });
    }
  }
  return out;
}
// (THE BOSS BLAZES: its heart is laid six times over white, so the engine's glow takes it; its cadmium ring twice over.)
// THE SUN BOSS: a great boss of thick paint on the vault, SUN.across metres across and SUN.proud proud of it, its face
// turned to the middle of the far meadow: a white heart (one loaded dab), a ring of ridged knife slabs of cadmium and
// warm cream laid round it and lapping over its rim, and straight knife strokes of warm cream going out from it into
// the sky (straight and slabbed; nothing swirls). The same on every seed (its own fixed stream). Returns the three
// lists and the boss's own frame (its face's normal n, its right R and its up Uv).
// THE RIDGE: four level slabs of blue violet standing from the ground.
// The boss's body (heart and ring) fills SUN.across: the ring's slabs reach its rim; the rays begin at the rim.
const BOSS = { heart: 0.5, ring: 10, ringAt: 0.7, ringLen: [0.56, 0.74], ringWide: [0.4, 0.55], rays: 13, rayFrom: [0.8, 0.95], rayLen: [0.5, 1.3], rayWide: [0.08, 0.15] };
function sunBoss() {
  const r = makeRng(hashSeed(FIXED + ':sun boss')), half = SUN.across / 2;
  const to = [-20 - SUN.x, 30 - SUN.y, -318 - SUN.z], tl = Math.hypot(...to), n = to.map((v) => v / tl), right = [n[2], 0, -n[0]], rl = Math.hypot(right[0], right[2]);
  const R = [right[0] / rl, 0, right[2] / rl], Uv = [n[1] * R[2] - n[2] * R[1], n[2] * R[0] - n[0] * R[2], n[0] * R[1] - n[1] * R[0]];
  const white = lin('#FFFDF0'), cream = lin('#FFE08A'), cad = lin('#FFB80F'), deep = lin('#F08A0A'), pale = lin('#FFF0A8');
  // a place in the boss's own plane: dx right and dy up of S, proud metres toward the meadow
  const at = (dx, dy, proud) => [0, 1, 2].map((k) => [SUN.x, SUN.y, SUN.z][k] + R[k] * dx + Uv[k] * dy + n[k] * (SUN.inside + proud));
  const heart = [{ h: at(-half * BOSS.heart, -half * 0.05, 9), e: at(half * BOSS.heart, half * 0.05, 9), n, w: 2 * half * BOSS.heart, th: SUN.proud * 1.3, ca: white, cb: mix3(white, pale, 0.5), seed: 0.2, taper: 1 }];
  const ring = [], rays = [];
  for (let i = 0; i < BOSS.ring; i++) {
    // each slab lies across its own spoke (along the ring), a little turned, lapping the next
    const a = (i + r.range(-0.25, 0.25)) / BOSS.ring * TAU, d = half * (BOSS.ringAt + r.range(-0.03, 0.05)), len = half * r.range(BOSS.ringLen[0], BOSS.ringLen[1]), turn = a + Math.PI / 2 + r.range(-0.35, 0.35);
    const cx = Math.cos(a) * d, cy = Math.sin(a) * d, ux = Math.cos(turn) * len / 2, uy = Math.sin(turn) * len / 2, k = r(), ca = mix3(cad, i % 3 ? deep : cream, k * k * 0.6), proud = 3 + r.range(0, 4);
    ring.push({ h: at(cx - ux, cy - uy, proud), e: at(cx + ux, cy + uy, proud), n, w: half * r.range(BOSS.ringWide[0], BOSS.ringWide[1]), th: SUN.proud * r.range(0.6, 0.9), ca, cb: mix3(ca, r.chance(0.5) ? deep : pale, r.range(0.2, 0.5)), seed: r(), taper: 1 });
  }
  for (let i = 0; i < BOSS.rays; i++) {
    // a straight knife stroke along its own spoke, from near the ring out into the sky
    const a = (i + r.range(-0.3, 0.3)) / BOSS.rays * TAU, c = Math.cos(a), sn = Math.sin(a), d0 = half * r.range(BOSS.rayFrom[0], BOSS.rayFrom[1]), d1 = d0 + half * r.range(BOSS.rayLen[0], BOSS.rayLen[1]);
    const ca = mix3(cream, pale, r() * 0.6), proud = r.range(-2, 2);
    rays.push({ h: at(c * d0, sn * d0, proud), e: at(c * d1, sn * d1, proud - 3), n, w: half * r.range(BOSS.rayWide[0], BOSS.rayWide[1]), th: SUN.proud * r.range(0.35, 0.55), ca, cb: mix3(ca, cad, r.range(0.3, 0.7)), seed: r(), taper: 1 });
  }
  // nothing lights the boss: it is the light, and its relief reads by its own thickness (the part's uSelf 2)
  return { heart, ring, rays, n, R, Uv };
}
function ridgeSlabs() {
  const cols = [lin('#6E6BB4'), lin('#7B74BC'), lin('#8A7FC0'), lin('#615FA8')];
  return RIDGE.map((s, i) => ({ h: [s.x0, s.top / 2, s.z], e: [s.x1, s.top / 2, s.z], n: [0, 0, 1], w: s.top, th: 22, ca: cols[i], cb: mix3(cols[i], lin('#5A5FA0'), 0.5), seed: 0.13 + i * 0.21, taper: 1 }))
    .concat(RIDGE_WEST.map((s, i) => ({ h: [s.x, s.top / 2, s.z0], e: [s.x, s.top / 2, s.z1], n: [1, 0, 0], w: s.top, th: 22, ca: cols[(i + 2) % 4], cb: mix3(cols[(i + 2) % 4], lin('#5A5FA0'), 0.5), seed: 0.57 + i * 0.21, taper: 1 })));
}
export const fieldSky = { skySlabs, sunBoss, ridgeSlabs, vaultAt };

// the light by the hour: the key's height and warmth only; the boss itself stands where it stands. Its bearing is the
// boss's own from the middle of the far meadow. Night is not honoured: it is always a morning.
const KEY = { az: 20, strength: 1.12 };
// THE DROP'S LIGHT: the one real thing lights the paint. A point light at the drop's own place: DROPLIGHT.strength at
// the drop, halved twice over at DROPLIGHT.half metres (it falls with the square of the distance), gone at
// DROPLIGHT.reach. It is a light by place: the same for any visitor at any moment.
const DROPLIGHT = { strength: 2.1, half: 30, reach: 190, shade: 95, blot: 36 };
const HOURS = { dawn: { elev: 7, key: '#FFDFA0', low: '#F3E6A4' }, day: { elev: 10, key: '#FFE9B0', low: '#F3E6A4' }, golden: { elev: 14, key: '#FFE2A0', low: '#F0D886' } };
// a standing stroke's blot is this many times its height long, by the key's height (2.6 at 10 degrees)
const blotLength = (elev) => 0.46 / Math.tan(elev * DEG);

export default {
  id: 'field-in-thick-paint',
  name: 'The Field in Thick Paint',
  category: 'wilderness',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const hour = vary.hour || 'any', mood = vary.mood ?? 0.5, density = vary.density ?? 1, rare = !!vary.rare;
    const HR = HOURS[hour] || HOURS.day;
    // EVERY STREAM OF THE VISIT, taken once here, each from the visit's seed and a name (none draws from another).
    // What the join shows is dealt from FIXED streams inside laneWalls, foregroundGrass, paintWash and the part's elm.
    const fork = (name) => makeRng(hashSeed('field-in-thick-paint:' + name + ':' + ctx.seed));
    const rMeadow = fork('meadow'), rBanks = fork('banks'), rBrook = fork('brook'), rFlowers = fork('flowers'), rFlit = fork('butterflies');
    const rSky = fork('sky'), rCloud = fork('clouds'), rBelt = fork('far belt'), rLark = fork('larks'), rRook = fork('rooks');
    const rRed = fork('the one red dab'), rDew = fork('dew'), rDrip = fork('drips'), rRain = fork('rain');
    // the streams of the things this round adds, each its own, taken after every older one
    const rHeap = fork('cloud heaps'), rStep = fork('the step'), rPoolBank = fork('pool bank'), rBed = fork('brook bed');
    const rCobalt = fork('cobalt drifts'), rYellow = fork('pale yellow drifts'), rOrange = fork('orange drift');
    // (r4's new things, each its own stream)
    const rLowFl = fork('flowers of the low run');

    const scene = new THREE.Scene();
    const fogCol = new THREE.Color('#F1EBD2'), FOG_DEN = 0.00045;
    scene.background = fogCol.clone(); scene.fog = new THREE.FogExp2(fogCol, FOG_DEN);
    const sunH = head(KEY.az), ce = Math.cos(HR.elev * DEG), sunDir = [sunH[0] * ce, Math.sin(HR.elev * DEG), sunH[1] * ce];
    const shared = await paintShared({
      rng: makeRng(hashSeed(FIXED + ':bristles')), sunDir, sunPos: [SUN.x, SUN.y, SUN.z], key: mul3(lin(HR.key), KEY.strength),
      sky: mul3(lin('#BFD6EA'), 1), ground: mul3(lin('#7FA050'), 1), shade: [0.27, 0.29, 0.56], fog: [fogCol.r, fogCol.g, fogCol.b], fogDen: FOG_DEN,
      dropCol: lin('#FFF0C4'), dropI: DROPLIGHT.strength, dropF: 1 / (DROPLIGHT.half * DROPLIGHT.half), wet: rare ? 1.5 : 1, yield: ctx.yield,
    });
    const U = shared.U;
    U.uDrop.value.set(DROP.x, DROP.y, DROP.z, DROPLIGHT.reach);
    // the two real lights serve only what the engine may hang in this scene; every surface of ours is its own shader
    const hemi = new THREE.HemisphereLight('#BFD6EA', '#7FA050', 1.0); scene.add(hemi);
    const key = new THREE.DirectionalLight(HR.key, 3.0); key.position.set(sunDir[0], sunDir[1], sunDir[2]).multiplyScalar(600); scene.add(key);
    await ctx.yield();

    const path = makePath(routePoints()), L = path.length;
    await ctx.yield();
    const geo = {};
    for (const d of ['hero', 'high', 'round', 'mid', 'low', 'flat']) { geo[d] = strokeGeometry(d); await ctx.yield(); }
    geo.dabLow = dabGeometry('low'); geo.dabFar = dabGeometry('far'); geo.dabMid = dabGeometry('mid'); await ctx.yield();
    geo.dabHigh = dabGeometry('high'); await ctx.yield();
    geo.slab = slabGeometry('low'); geo.slabHigh = slabGeometry('high');
    const blots = [], sunXZ = sunH, blotK = blotLength(HR.elev);
    // a list of strokes becomes one instanced mesh: written into it in pieces, the page handed back between them
    const add = async (list, geometry, material, name) => {
      const m = makeStrokes([], geometry, material, list.length);
      for (let i = 0; i < list.length; i++) { m.put(i, list[i]); if (i % 60 === 59) await ctx.yield(); }
      m.geometry.instanceCount = list.length; m.name = name; scene.add(m);
      await ctx.yield();
      return m;
    };
    await ctx.yield();

    // ---- the canvas: the ground under the paint
    const wash = await paintWash({ yield: ctx.yield });
    await ctx.yield();
    const canvasU = { ...U, uWash: { value: wash.texture }, uWashBox: { value: wash.box }, uCanvas: { value: new THREE.Color('#E7DCC3') }, uVault: { value: 0 } };
    const groundMat = new THREE.ShaderMaterial({ uniforms: canvasU, vertexShader: CANVAS_VERT, fragmentShader: CANVAS_FRAG });
    const ground = new THREE.Mesh(await groundGeometry(ctx.yield), groundMat); ground.name = 'canvas ground'; ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ---- THE LANE: its walls (the fixed stream), the blade, the collar
    // the walls as the fixed stream deals them, less those rooted in a ride, each under the hedge's law; the sun's
    // wall's second row; then the gate and the variety, added
    const hedged = async (list) => { for (let i = 0; i < list.length; i++) { hedge(list[i]); if (i % 4 === 3) await ctx.yield(); } return list; };
    const wallsAll = await laneWalls(ctx.yield), walls = await hedged(wallsAll.filter((st) => !inRide(st.h[0], st.h[2])));
    await ctx.yield();
    walls.push(...sunWall(wallsAll.filter((st) => st.first)));
    await ctx.yield();
    const more = laneMore();
    await hedged(more.strokes);
    await ctx.yield();
    const wallMat = paintMaterial(shared, { relief: 1.2, rim: 0.6, dry: 0.74, gloss: 1, root: 1 });
    const wallOff = (st) => Math.abs(laneOf(st.h[0], st.h[2])[1]);
    // the row that walls the lane is ridged and bristled, for it is seen from close
    const wallNear = paintMaterial(shared, { relief: 2.3, rim: 1.05, dry: 0.7, gloss: 1.15, root: 1, trackScale: 1.6 });
    await add(walls.filter((st) => wallOff(st) < FAR.wall[0] && st.first), geo.high, wallNear, 'lane walls');
    await add(walls.filter((st) => wallOff(st) < FAR.wall[0] && !st.first), geo.round, wallNear, "lane walls: the sun's wall's second row");
    await add(more.strokes.filter((st) => st.tower), geo.high, wallNear, 'lane gate towers');
    await add(more.strokes.filter((st) => !st.tower), geo.round, wallMat, 'lane variety');
    await add(more.stalks, geo.round, wallMat, 'giant stalks');
    await add(more.heads, geo.dabMid, paintMaterial(shared, { kind: 1, relief: 1.3, dry: 2, gloss: 1.2 }), 'giant flower dabs');
    blots.push(...blotsOf(more.strokes, sunXZ, blotK));
    // the arch over the lane: the one great bent stroke we pass under, in the first row's own ridged paint
    const arch = archStroke();
    await add([arch], geo.hero, wallNear, 'the arch over the lane');
    blots.push(...blotsOf([arch], sunXZ, blotK));
    await add(walls.filter((st) => wallOff(st) >= FAR.wall[0] && wallOff(st) < FAR.wall[1]), geo.round, wallMat, 'lane walls, second rows');
    await add(walls.filter((st) => wallOff(st) >= FAR.wall[1]), geo.mid, wallMat, 'lane walls, far rows');
    await ctx.yield();
    // the row that walls the lane lays its whole shade on the floor (the part's broad blot); one cut low only its thin one
    blots.push(...blotsOf(walls.map((st) => (wallOff(st) < FAR.wall[0] && !st.sun ? { ...st, broad: true } : st)), sunXZ, blotK));
    await ctx.yield();
    const blade = bladeStroke();
    await ctx.yield();
    // it bows under the drop and bobs slowly on the world clock: its crest rises and sinks BLADE.bob, its tip stays on the drop
    const bladeMesh = makeStrokes([blade], geo.hero, paintMaterial(shared, { relief: 1.2, rim: 0.55, dry: 2, gloss: 4.5, glossP: 150, sway: 1 })); bladeMesh.name = 'the blade'; bladeMesh.frustumCulled = false; scene.add(bladeMesh);
    const bladeB = blade.b[1], bob = (time) => { blade.b[1] = bladeB + BLADE.bob * Math.sin(time * BLADE.bobRate); bladeMesh.put(0, blade); bladeMesh.commit(); };
    const collar = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uKeyCol: U.uKeyCol, uSkyCol: U.uSkyCol, uGroundCol: U.uGroundCol, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uDrop: U.uDrop, uDropCol: U.uDropCol, uTint: { value: new THREE.Color('#FFF0C4') } },
      vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false }));
    collar.name = 'the collar of water';
    collar.scale.set(COLLAR.wide / 2, (COLLAR.y1 - COLLAR.y0) / 2, COLLAR.deep / 2);
    collar.position.set(blade.e[0], (COLLAR.y0 + COLLAR.y1) / 2, blade.e[2]); collar.rotation.y = Math.atan2(-LANE.f[0], -LANE.f[1]); collar.renderOrder = 3; scene.add(collar);
    await ctx.yield();
    // ---- THE SKY: the vault of bare canvas, the knife slabs on it, the ridge, the sun boss
    const vault = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 20, 0, TAU, 0, Math.PI / 2 + 0.05), new THREE.ShaderMaterial({ uniforms: { ...canvasU, uVault: { value: 1 } }, vertexShader: CANVAS_VERT, fragmentShader: CANVAS_FRAG, side: THREE.BackSide }));
    vault.name = 'canvas vault'; vault.scale.set(VAULT.a, VAULT.b, VAULT.c); vault.position.set(VAULT.x, VAULT.y, VAULT.z); vault.frustumCulled = false; scene.add(vault);
    await ctx.yield();
    const skyList = skySlabs(rSky, HR.low);
    await ctx.yield();
    await add(skyList, geo.slab, paintMaterial(shared, { kind: 2, self: 1, emis: 1.12, rag: 0.3, endRag: 0.2, sideRag: 0.22, dry: 2, rim: 0, trackScale: 14, relief: 1.5 }), 'sky slabs');
    await ctx.yield();
    await add(ridgeSlabs(), geo.slabHigh, paintMaterial(shared, { kind: 2, self: 1, emis: 0.95, rag: 0.34, ends: 1, dry: 2, rim: 0, trackScale: 9, relief: 1.1 }), 'the ridge');
    const boss = sunBoss();
    await add(boss.rays, geo.slab, paintMaterial(shared, { kind: 2, self: 2, emis: 1.5, rag: 0.25, endRag: 0.16, sideRag: 0.12, dry: 2, rim: 0, trackScale: 7, relief: 1.5 }), 'the sun boss: knife strokes');
    await add(boss.ring, geo.slabHigh, paintMaterial(shared, { kind: 2, self: 2, emis: 2.0, rag: 0.2, endRag: 0.08, sideRag: 0.08, dry: 2, rim: 0, trackScale: 6, relief: 1.7 }), 'the sun boss: ridged slabs');
    await add(boss.heart, geo.dabHigh, paintMaterial(shared, { kind: 1, self: 2, emis: 6.0, dry: 2, rim: 0, trackScale: 8, relief: 1.3 }), 'the sun boss: heart');
    await ctx.yield();
    // ---- THE ELM (the hero part) on its knoll, and its rooks
    const nRook = clamp(Math.round(lerp(7, 16, (density - 0.7) / 0.6)), 7, 16);
    const hero = await buildHero(ctx, { shared, rooks: nRook, rookRng: rRook });
    hero.object.position.set(ELM_AT.x, ELM_AT.y, ELM_AT.z); scene.add(hero.object);
    blots.push(...blotsOf(hero.strokes.filter((s) => s.part !== 'twig').map((s) => ({ ...s, aloft: s.part === 'crown' || s.part === 'inner' })), sunXZ, blotK, ELM_AT.x, ELM_AT.y, ELM_AT.z));
    await ctx.yield();
    // ---- THE MAY TREE on its knoll: dark twisted wood, the heaped white crown, green showing through, the fallen ring
    const may = mayStrokes(), mayAt = (st) => ({ ...st, h: [st.h[0] + MAY_AT.x, st.h[1] + MAY_AT.y, st.h[2] + MAY_AT.z], e: [st.e[0] + MAY_AT.x, st.e[1] + MAY_AT.y, st.e[2] + MAY_AT.z] });
    await ctx.yield();
    const mayLie = (st) => { const q = mayAt(st), y = groundY((q.h[0] + q.e[0]) / 2, (q.h[2] + q.e[2]) / 2) + 0.35; q.h[1] = y; q.e[1] = y; return q; };
    await add(may.wood.map(mayAt), geo.high, paintMaterial(shared, { relief: 1.2, rim: 0.5, dry: 0.85, gloss: 0.7 }), 'may tree: trunk and boughs');
    const blossomMat = paintMaterial(shared, { relief: 1.6, rim: 0.9, dry: 2, gloss: 0.9, vio: 0.42 });
    await add(may.heap.map(mayAt), geo.round, blossomMat, 'may tree: blossom strokes');
    await add(may.dabs.map(mayAt), geo.dabMid, paintMaterial(shared, { kind: 1, relief: 1.4, dry: 2, gloss: 1, vio: 0.42 }), 'may tree: heaped dabs');
    await add(may.green.map(mayAt), geo.high, paintMaterial(shared, { relief: 1.25, rim: 0.6, dry: 0.66, gloss: 1 }), 'may tree: green under the heap');
    const petalMat = paintMaterial(shared, { kind: 1, relief: 0.8, dry: 2, gloss: 0.9, vio: 0.3, side: THREE.DoubleSide });
    await add(may.fallen.map(mayLie), geo.dabLow, petalMat, 'may tree: fallen blossom');
    blots.push(...blotsOf(may.wood.filter((st) => st.part === 'trunk').concat(may.heap.concat(may.green).map((st) => ({ ...st, aloft: true }))), sunXZ, blotK, MAY_AT.x, MAY_AT.y, MAY_AT.z));
    await ctx.yield();

    // ---- THE FOREGROUND GRASS (the fixed stream)
    const near = await routeNear(path, ctx.yield);
    await ctx.yield();
    const fore = await foregroundGrass(near, ctx.yield);
    await ctx.yield();
    const grassMat = paintMaterial(shared, { relief: 1.2, rim: 0.55, dry: 0.74, gloss: 1.1, root: 1 });
    // the foreground stands at the picture plane with the whole open sky behind the eye on its faces: its shade side
    // is lighter by FORE.open (the part's `open`), and less of it is turned to violet
    const foreMat = paintMaterial(shared, { relief: 1.2, rim: 0.55, dry: 0.74, gloss: 1.1, root: 1, open: FORE.open, vio: 0.14 });
    await add(fore.under.filter((st) => Math.abs(st.h[0] - ENTRY.x) < FAR.fore), geo.high, foreMat, 'foreground grass');
    await add(fore.under.filter((st) => Math.abs(st.h[0] - ENTRY.x) >= FAR.fore), geo.round, foreMat, 'foreground grass, outer');
    await add(fore.sides, geo.mid, foreMat, 'side grass');
    await ctx.yield();
    blots.push(...blotsOf(fore.under, sunXZ, blotK), ...blotsOf(fore.sides, sunXZ, blotK));
    await ctx.yield();

    // ---- THE MEADOW: lying strokes in level bands
    const meadow = await meadowGround(rMeadow, near, detail, ctx.yield);
    const lyingMat = paintMaterial(shared, { relief: 1.1, rim: 0.5, dry: 0.66, gloss: 1 });
    const lyingLow = paintMaterial(shared, { detail: 'low', relief: 1.1, rim: 0.6, dry: 0.66, gloss: 1 });
    // (a stroke's form by its distance from the line in space: where the line is high over it, the plainer form)
    const closeBy = (st, lim) => near.dist((st.h[0] + st.e[0]) / 2, (st.h[1] + st.e[1]) / 2, (st.h[2] + st.e[2]) / 2) < lim;
    await add(meadow.nearList.filter((st) => closeBy(st, FAR.full + 10)), geo.round, lyingMat, 'meadow strokes by the route');
    await add(meadow.nearList.filter((st) => !closeBy(st, FAR.full + 10)), geo.mid, lyingMat, 'meadow strokes under the route');
    await ctx.yield();
    const midFar = (st) => near.far((st.h[0] + st.e[0]) / 2, (st.h[2] + st.e[2]) / 2) >= FAR.flat;
    await add(meadow.farList.filter((st) => !midFar(st)), geo.low, lyingLow, 'meadow strokes');
    await add(meadow.farList.filter(midFar), geo.flat, lyingLow, 'meadow strokes far from the line');
    await ctx.yield();

    // ---- THE BROOK and its banks
    const brook = dealBrook(rBrook, 220), brookMesh = makeStrokes([], geo.mid, paintMaterial(shared, { relief: 1.9, rim: 0.8, dry: 0.6, gloss: 1.0, glossP: 70, glit: 3.0, sheenAt: BROOK.sheenAt }), brook.length);
    const bs = { h: [0, 0, 0], e: [0, 0, 0], b: [0, 0, 0], n: [0, 1, 0], w: 1, th: 1, ca: [0, 0, 0], cb: [0, 0, 0], seed: 0, wind: 0, taper: 0.5 };
    const flowBrook = (time) => { for (let i = 0; i < brook.length; i++) { const k = brook[i]; bs.ca = k.ca; bs.cb = k.cb; bs.seed = k.seed; bs.taper = k.taper; brookMesh.put(i, brookStroke(k, time, bs)); } brookMesh.commit(); };
    brookMesh.geometry.instanceCount = brook.length; brookMesh.name = 'brook strokes';
    await ctx.yield();
    flowBrook(0); scene.add(brookMesh);
    await ctx.yield();
    // the west arm: its sliding strokes (the brook's own paint), its bed, its banks; dealt from fixed streams
    const arm = dealArm(makeRng(hashSeed(FIXED + ':the west arm'))), armMesh = makeStrokes([], geo.mid, brookMesh.material, arm.length);
    const flowArm = (time) => { for (let i = 0; i < arm.length; i++) { const k = arm[i]; bs.ca = k.ca; bs.cb = k.cb; bs.seed = k.seed; bs.taper = k.taper; armMesh.put(i, armStroke(k, time, bs)); } armMesh.commit(); };
    armMesh.geometry.instanceCount = arm.length; armMesh.name = 'west arm strokes';
    flowArm(0); scene.add(armMesh);
    await ctx.yield();
    const armLand = armStill(makeRng(hashSeed(FIXED + ':the west arm: bed and banks')), near);
    await ctx.yield();
    const banks = await bankStrokes(rBanks, near, ctx.yield, rPoolBank);
    banks.lying.push(...armLand.lying); banks.stand.push(...armLand.stand);
    for (const st of banks.lying) sunnyBank(st, near);
    for (const st of banks.stand) sunnyBank(st, near);
    // the banks' lying strokes by the route in the fuller ribbon, the far reach's in the plainer one (dealt by place at build)
    const byRoute = (st) => closeBy(st, FAR.full + 4);
    await add(banks.lying.filter(byRoute), geo.round, lyingMat, 'bank strokes lying by the route'); await add(banks.lying.filter((st) => !byRoute(st) && !midFar(st)), geo.mid, lyingMat, 'bank strokes lying'); await add(banks.lying.filter((st) => !byRoute(st) && midFar(st)), geo.low, lyingLow, 'bank strokes lying far from the line');
    await ctx.yield();
    const grassLow = paintMaterial(shared, { detail: 'low', relief: 1.2, rim: 0.55, dry: 0.74, gloss: 1.1, root: 1 });
    await add(banks.stand.filter((st) => closeBy(st, FAR.full + 4)), geo.mid, grassMat, 'bank strokes standing by the route');
    await add(banks.stand.filter((st) => !closeBy(st, FAR.full + 4)), geo.low, grassLow, 'bank strokes standing');
    await ctx.yield();
    blots.push(...blotsOf(banks.stand, sunXZ, blotK));
    await ctx.yield();

    // ---- THE FLOWERS in their drifts
    const fl = await flowers(rFlowers, near, Math.round(1400 * density * detail), ctx.yield);
    const stalkMat = paintMaterial(shared, { relief: 0.9, rim: 0.3, dry: 0.8, gloss: 0.7 }), stalkLow = paintMaterial(shared, { detail: 'low', relief: 0.9, rim: 0.3, dry: 0.8, gloss: 0.7 });
    const headMat = paintMaterial(shared, { kind: 1, relief: 0.9, dry: 2, gloss: 1.2, vio: 0.1 });
    // THE RED DAB: one, at a place drawn in the design's box by the seed (its own stream; every draw is used)
    const redAt = redPlace(rRed, near), red = flowerAt(rRed, redAt[0], redAt[1], groundY(redAt[0], redAt[1]), { colour: [lin('#D8281E'), lin('#E2452A')], tall: [9, 9], R: 2.5 });
    fl.nearStalks.push(red.stalk); fl.nearHeads.push(red.dab);
    chordDrifts(rCobalt, near, fl, 'cobalt'); await ctx.yield(); chordDrifts(rYellow, near, fl, 'yellow'); await ctx.yield(); chordDrifts(rOrange, near, fl, 'open');
    lowRunFlowers(rLowFl, near, fl);
    await ctx.yield();
    // a far flower's form by how far its root stands from the line (stalk and head are dealt together: one index)
    const rootOff = fl.farStalks.map((st) => near.far(st.h[0], st.h[2]));
    await ctx.yield();
    const headFar = paintMaterial(shared, { kind: 1, detail: 'far', relief: 0.9, dry: 2, gloss: 1.2, vio: 0.1 });
    fl.nearStalks = fl.nearStalks.map(stemOf);
    const nearFl = fl.nearStalks.map((st) => closeBy(st, FAR.full));
    await add(fl.nearStalks.filter((st, i) => nearFl[i]), geo.mid, stalkMat, 'stalks by the route'); await add(fl.nearStalks.filter((st, i) => !nearFl[i]), geo.low, stalkLow, 'stalks near the route'); await add(fl.farStalks.filter((st, i) => rootOff[i] < FAR.dab), geo.low, stalkLow, 'stalks');
    await add(fl.farStalks.filter((st, i) => rootOff[i] >= FAR.dab), geo.flat, stalkLow, 'stalks far from the line');
    await add(fl.nearHeads.filter((st, i) => nearFl[i]), geo.dabMid, headMat, 'flower dabs by the route'); await add(fl.nearHeads.filter((st, i) => !nearFl[i]), geo.dabLow, headMat, 'flower dabs near the route'); await add(fl.farHeads.filter((st, i) => rootOff[i] < FAR.dab), geo.dabLow, headMat, 'flower dabs');
    await add(fl.farHeads.filter((st, i) => rootOff[i] >= FAR.dab), geo.dabFar, headFar, 'flower dabs far from the line');
    blots.push(...blotsOf(fl.nearStalks, sunXZ, blotK));
    await ctx.yield();
    blots.push(...blotsOf(fl.farStalks, sunXZ, blotK));
    await ctx.yield();

    // ---- THE FAR BELT
    const belt = await hedged(farBelt(rBelt, 150).filter((st) => !inRide(st.h[0], st.h[2])));
    await ctx.yield();
    const beltOff = (st) => Math.abs(laneOf(st.h[0], st.h[2])[1]);
    await add(belt.filter((st) => beltOff(st) < FAR.belt), geo.mid, grassMat, 'far belt');
    await add(belt.filter((st) => beltOff(st) >= FAR.belt), geo.low, paintMaterial(shared, { detail: 'low', relief: 1.2, rim: 0.55, dry: 0.74, gloss: 1.1, root: 1 }), 'far belt, outer');
    blots.push(...blotsOf(belt, sunXZ, blotK));
    await ctx.yield();
    // ---- THE WEATHER'S THINGS (by the mood): the clouds and their shades (one more of them on a cloudy visit), the rain seed's slab and rain
    const weather = mood > 0.75 ? 'rain' : mood >= 0.4 ? 'cloud' : 'clear';
    const blank = (o = {}) => ({ h: [0, 0, 0], e: [0, 0, 0], b: [0, 0, 0], n: [0, 1, 0], w: 1, th: 1, ca: [0, 0, 0], cb: [0, 0, 0], seed: 0, wind: 0, taper: 0.5, cover: 1, ...o });
    const moving = (count, geometry, material, name) => { const m = makeStrokes([], geometry, material, Math.max(1, count)); m.geometry.instanceCount = count; m.name = name; scene.add(m); return m; };
    await ctx.yield();
    const clouds = dealClouds(rCloud, weather === 'cloud' ? 8 : 7).concat(bayClouds());
    const cloudMesh = moving(clouds.length + (weather === 'rain' ? 1 : 0), geo.slab, paintMaterial(shared, { kind: 2, self: 1, emis: 1.0, rag: 0.3, ends: 1, endRag: 0.1, sideRag: 0.1, dry: 2, rim: 0, trackScale: 9, relief: 1.2 }), 'cloud slabs');
    if (weather === 'rain') cloudMesh.put(clouds.length, rainSlab());
    const heaps = dealHeaps(rHeap, clouds), heapMesh = moving(clouds.length * HEAP.n, geo.dabMid, paintMaterial(shared, { kind: 1, self: 1, emis: 1.04, dry: 2, rim: 0, trackScale: 9, relief: 1.4 }), 'cloud heaps');
    const cs = blank(), hs = blank(), driftClouds = (time) => {
      for (let i = 0; i < clouds.length; i++) { cloudMesh.put(i, cloudAt(clouds[i], time, cs, U.uCloud.value[i])); for (let j = 0; j < HEAP.n; j++) heapMesh.put(i * HEAP.n + j, heapAt(clouds[i], heaps[i][j], time, hs)); }
      cloudMesh.commit(); heapMesh.commit();
    };
    const rain = weather === 'rain' ? dealRain(rRain) : [];
    const rainMesh = rain.length ? moving(rain.length, geo.mid, paintMaterial(shared, { relief: 0.8, rim: 0.3, dry: 0.5, gloss: 0.3 }), 'rain strokes') : null;
    const rs = blank(), fallRain = (time) => { if (!rainMesh) return; for (let i = 0; i < rain.length; i++) rainMesh.put(i, rainAt(rain[i], time, rs)); rainMesh.commit(); };
    await ctx.yield();

    // ---- THE SMALL LIFE: larks, butterflies, foam (the world clock moves them, each inside its own place)
    const tickMat = paintMaterial(shared, { relief: 0.8, rim: 0.3, dry: 2, gloss: 0.5, side: THREE.DoubleSide });
    const larks = dealLarks(rLark, near, clamp(Math.round(lerp(2, 6, (density - 0.7) / 0.6)), 2, 6));
    await ctx.yield();
    const larkMesh = moving(larks.length * 2, geo.mid, tickMat, 'larks');
    const lw = [blank({ w: LARK.wide, th: 0.5, ca: LARK.colour, cb: LARK.colour2, taper: 0.35 }), blank({ w: LARK.wide, th: 0.5, ca: LARK.colour, cb: LARK.colour2, taper: 0.35 })];
    const flyLarks = (time) => { for (let i = 0; i < larks.length; i++) { larkAt(larks[i], time, lw); lw[0].seed = lw[1].seed = larks[i].seed; larkMesh.put(2 * i, lw[0]); larkMesh.put(2 * i + 1, lw[1]); } larkMesh.commit(); };
    const flits = dealButterflies(rFlit, near, clamp(Math.round(lerp(10, 20, (density - 0.7) / 0.6)), 10, 20));
    await ctx.yield();
    const flitMesh = moving(flits.length * 2, geo.dabLow, paintMaterial(shared, { kind: 1, relief: 0.7, dry: 2, gloss: 0.8, vio: 0.1, side: THREE.DoubleSide }), 'butterflies');
    const fw = [blank(), blank()], flit = (time) => { for (let i = 0; i < flits.length; i++) { butterflyAt(flits[i], time, fw); flitMesh.put(2 * i, fw[0]); flitMesh.put(2 * i + 1, fw[1]); } flitMesh.commit(); };
    const foam = dealFoam(rBrook), foamMesh = moving(foam.length, geo.dabMid, paintMaterial(shared, { kind: 1, relief: 1, dry: 2, gloss: 1.3, vio: 0.15 }), 'foam dabs');
    const fs = blank(), turnFoam = (time) => { for (let i = 0; i < foam.length; i++) foamMesh.put(i, foamAt(foam[i], time, fs)); foamMesh.commit(); };
    // the step in the brook: the fall's white strokes, the foam at their foot, the pool's turning strokes, the ledge's face
    const step = dealStep(rStep), fallList = step.filter((k) => k.kind === 'fall'), foamList = step.filter((k) => k.kind === 'foam'), poolList = step.filter((k) => k.kind === 'pool');
    const fallMesh = moving(fallList.length, geo.high, paintMaterial(shared, { relief: 1.7, rim: 0.7, dry: 0.5, gloss: 1.3, glossP: 60, glit: 1.2 }), 'the fall');
    const fallFoam = moving(foamList.length, geo.dabMid, foamMesh.material, 'the fall: foam'), poolMesh = moving(poolList.length, geo.mid, brookMesh.material, 'pool strokes');
    const bed = brookBed(rBed).concat(armLand.bed);
    await ctx.yield();
    await add(bed, geo.low, paintMaterial(shared, { detail: 'low', relief: 1.2, rim: 0.3, dry: 0.8, gloss: 0.9, glossP: 70, glit: 0.8, sheenAt: BROOK.sheenAt }), 'brook bed strokes');
    await add(ledgeSlabs(), geo.round, paintMaterial(shared, { relief: 1, rim: 0.3, dry: 2, gloss: 0.6 }), 'the ledge');
    const ss = blank(), pour = (time) => {
      for (let i = 0; i < fallList.length; i++) fallMesh.put(i, stepAt(fallList[i], time, ss));
      for (let i = 0; i < foamList.length; i++) fallFoam.put(i, stepAt(foamList[i], time, ss));
      for (let i = 0; i < poolList.length; i++) poolMesh.put(i, stepAt(poolList[i], time, ss));
      fallMesh.commit(); fallFoam.commit(); poolMesh.commit();
    };
    const petals = dealPetals(), petalMesh = moving(petals.length, geo.dabLow, petalMat, 'may tree: petals on the wind'), ps = blank({ ca: may.blossom.white, cb: may.blossom.rose });
    const shed = (time) => { for (let i = 0; i < petals.length; i++) petalMesh.put(i, petalAt(petals[i], time, ps)); petalMesh.commit(); };
    const life = (time) => { flowBrook(time); flowArm(time); driftClouds(time); fallRain(time); flyLarks(time); flit(time); turnFoam(time); pour(time); shed(time); };
    await ctx.yield();
    life(0);
    await ctx.yield();

    // ---- THE DEW (on the join from the fixed stream, on the banks from the visit's), THE LANE'S FOOT
    const rFixDew = makeRng(hashSeed(FIXED + ':dew'));
    await ctx.yield();
    const dew = [...dewOn(rFixDew, wallsAll, DEW.lane, (x, y, z, st) => laneOf(x, z)[0] < -DEW.before && !inRide(st.h[0], st.h[2])), ...dewOn(rFixDew, fore.sides.concat(fore.under), DEW.fore), ...dewOn(rDew, banks.stand, DEW.bank)];
    await add(dew, geo.dabLow, paintMaterial(shared, { kind: 1, self: 1, emis: 1.5, twinkle: 0.35, dry: 2, rim: 0, relief: 0.4, side: THREE.DoubleSide }), 'dew glints');
    await add(laneFoot(), geo.dabMid, headMat, 'lane foot dabs');
    // ---- RARE: the paint is very wet (the gloss is set in the shared light); drips hang off the join only
    if (rare) await add([...dripsOn(rDrip, banks.lying, 70), ...dripsOn(rDrip, belt, 60), ...dripsOn(rDrip, skyList, 30, true)], geo.dabLow, paintMaterial(shared, { kind: 1, relief: 0.6, dry: 2, gloss: 1.4 }), 'drips');
    await ctx.yield();

    // ---- the lane's floor and the dew's double file; the file of butterflies that crosses the lane high over the line
    await add(lanePath(), geo.round, lyingMat, 'lane path strokes');
    await ctx.yield();
    const file = dewFile(), beadMat = paintMaterial(shared, { kind: 1, relief: 0.2, dry: 2, gloss: 7, glossP: 150, vio: 0.1 });
    await add(file.blades, geo.mid, grassMat, 'dew blades');
    await add(file.beads, geo.dabMid, beadMat, 'dew beads');
    const fallMesh2 = moving(file.falls.length, geo.dabMid, beadMat, 'falling beads'), fb = blank();
    const cross = crossing(), crossMesh = moving(CROSS.n * 2, geo.dabLow, flitMesh.material, 'butterflies crossing the lane');
    const laneLife = (time) => {
      bob(time);
      for (let i = 0; i < file.falls.length; i++) fallMesh2.put(i, fallAt(file.falls[i], time, fb));
      fallMesh2.commit();
      for (const k of cross.list) { crossAt(cross, k, time, fw); crossMesh.put(2 * k.i, fw[0]); crossMesh.put(2 * k.i + 1, fw[1]); }
      crossMesh.commit();
    };
    await ctx.yield();
    // the lane's flowers between the wall strokes; the bower behind and beside the drop
    const lfl = laneFlowers();
    await add(lfl.stalks, geo.round, wallMat, "the lane's flowers: stems");
    await add(lfl.heads, geo.dabMid, headMat, "the lane's flowers: heads");
    const bow = bower();
    await ctx.yield();
    await add(bow[0], geo.high, wallNear, 'the bower');
    await add(bow[1], geo.round, wallMat, 'the bower, behind');
    blots.push(...blotsOf(lfl.stalks, sunXZ, blotK));
    laneLife(0);
    blots.push(...dropBlots([...walls, ...more.strokes, ...file.blades, ...lfl.stalks]));
    // ---- the cast shadows: every blot into one texture, read by every face that lies low
    const shadow = await makeShadowTexture(blots, [-620, -1000, 1100, 1060], 1024, ctx.yield);
    U.uShadow.value = shadow.texture; U.uShadowBox.value.copy(shadow.box);
    await ctx.yield();

    // ---- THE GAZE AND THE PACE, both from places of the route (metres along it found from the places themselves)
    // mDown: the end of the level entry; mLow: where the low run over the water begins; mFar: the end of the close
    // pass, where the line goes straight on from the tree; mWest: half way along that straight.
    const RP = routePlan(), mDown = ENTRY.level, mLow = near.plan(RP.L0[0], RP.L0[1]).m, mFar = near.plan(RP.Q[0], RP.Q[1]).m, mWest = near.plan((RP.Q[0] + RP.R0[0]) / 2, (RP.Q[1] + RP.R0[1]) / 2).m;
    // ONE LOOK, AT ONE THING: THE ELM, WHOLE, on its own axis at the height that stands midway by angle between its
    // foot and its top as seen from where the eye is. IT IS ON THE ELM BY A LAW OF THE TWO PLACES, the eye's and the
    // tree's, and by nothing else: (1) FIT: while the whole tree, foot to top, stands inside the lens's own height:
    // full while the angle from foot to top is under GAZE.fit[0] of the lens's angle, none where it is over
    // GAZE.fit[1] of it (so the crown is never cut by the picture's upper edge while the look is on the tree);
    // (2) ABEAM: while the trunk stands before the eye: full while it bears no more than GAZE.arc off the way ahead
    // (the furthest the look ever turns), none once it is abeam. Nearer or further round than that the look is the
    // way ahead. It eases in over the whole descent, from the end of the level entry to the low run's start (no
    // pull on the first metres). So: coming down, the tree whole over the brook's line; low over the water, the tree whole and
    // towering with the step and the pool under it; on the close pass, in the far meadow and in the lane, the way
    // ahead. The point is computed from u alone.
    const GAZE = { arc: 58, fit: [0.78, 0.98], ahead: 22 };
    const _p = new THREE.Vector3(), _ah = new THREE.Vector3(), _dir = new THREE.Vector3(), _to = new THREE.Vector3(), _ax = new THREE.Vector3(), _look = new THREE.Vector3();
    const crown = new THREE.Vector3(ELM_AT.x, 0, ELM_AT.z), elmFoot = ELM_AT.y, elmTop = ELM_AT.y + ELM.top;
    // turn the gaze toward a point by share of the angle to it, the angle counted no greater than lead (a soft least)
    const turnTo = (point, lead, share) => {
      if (share <= 1e-4) return;
      _to.subVectors(point, _p).normalize(); const ang = _dir.angleTo(_to), soft = -Math.log(Math.exp(-7 * ang) + Math.exp(-7 * lead)) / 7;
      _ax.crossVectors(_dir, _to); if (_ax.lengthSq() < 1e-8) return;
      _dir.applyAxisAngle(_ax.normalize(), Math.max(0, Math.min(ang, soft)) * share);
    };
    const lookPoint = (u, out) => {
      const m = u * L; path.posAtDist(m, _p);
      if (m + GAZE.ahead < L) { path.posAtDist(m + GAZE.ahead, _ah); _dir.subVectors(_ah, _p).normalize(); } else path.tangentAtDist(m, _dir);
      // the elm's axis as seen from the eye: how far, the angles to its foot and its top, its bearing off the way ahead
      const dx = ELM_AT.x - _p.x, dz = ELM_AT.z - _p.z, d = Math.hypot(dx, dz) || 1, lowA = Math.atan2(elmFoot - _p.y, d), topA = Math.atan2(elmTop - _p.y, d);
      const bear = Math.acos(clamp((dx * _dir.x + dz * _dir.z) / (d * (Math.hypot(_dir.x, _dir.z) || 1)), -1, 1)) / DEG;
      crown.y = _p.y + d * Math.tan((topA + lowA) / 2);
      const fits = 1 - smoothstep(GAZE.fit[0] * FOV, GAZE.fit[1] * FOV, (topA - lowA) / DEG), before = 1 - smoothstep(GAZE.arc, 90, bear);
      turnTo(crown, GAZE.arc * DEG, smoothstep(mDown, mLow, m) * fits * before);
      return out.copy(_p).addScaledVector(_dir, 120);
    };
    // PACE: 1 at the entry, over the far meadow and in the lane; PACE.slow along the brook and round the elm: it eases
    // down over the descent's second half and up again over the first half of the straight on from the tree.
    const PACE = { slow: 0.8 };
    const pace = (u) => { const m = u * L; return 1 - (1 - PACE.slow) * smoothstep((mDown + mLow) / 2, mLow, m) * (1 - smoothstep(mFar, mWest, m)); };

    return {
      scene, path, duration: 42, pace,
      style: 'none', ride: 'none', companion: 'none',
      camera: { fov: FOV, near: 0.5, far: 3200, lookAhead: 22, sway: 1, bank: 0.2 },
      // one look over the whole flight, turned along the angle; where it pulls nowhere its point is the way ahead
      pois: [{ at: (time, u) => lookPoint(u, _look), from: 0, to: 1, weight: 1, fade: 0, arc: true }],
      // THE JOIN (exit of this world, as the series' join sheet has it): the drop is the opening
      portal: { shape: 'circle', radius: 5.5, style: 'lens', color: '#FFF0C4', glow: 1.6, halo: true, revealDistance: 200, blendDistance: 25 },
      post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.04, contrast: 1.02, vignette: 0.15, grain: 0 } },
      update(dt, time, camera, u) {
        U.uTime.value = time;
        hero.update(dt, time, camera);
        life(time); laneLife(time);
      },
      dispose() { hero.dispose(); shared.dispose(); wash.texture.dispose(); shadow.texture.dispose(); },
    };
  },
};
