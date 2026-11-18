// bridges-of-marigold, the air: WHERE THE CANYON'S HANGINGS RUN (design, section 3). A pure deal: it imports the
// plan only, so it can be counted outside the page too.
// Every line is slung between two tower faces taken from the plan (towerRadius), never from the city's meshes:
//   ACROSS THE CANYON, from the great tower's face to a ring tower's face, and
//   ROUND THE RING, from one ring tower to the next (towers 7 and 1 included, across the great bridge's approach).
// A line hangs in a parabola (its sag is a share of its length) and sways sideways as one, most at its middle.
// THREE CABLES carry the trams, each between two ring towers on the canyon's outer side; they are laid first.
// CLEAR AIR, by the plan's own measure (routeDistance, good to a metre and a half): with its sag and its whole sway,
// no part of any line comes within CLEAR metres of the flown line; that covers the design's 6 m for lamps, flags,
// cables and trams and its 12 m for a thing that crosses the canyon, with the margin the plan asks for.
// A line also keeps LINE_GAP from every other line and TRAM_GAP from a tram's cable (a car hangs under it and
// passes by), and stays out of the three bridges' beds and the air a few metres over them.
// Every die of a candidate is cast before it is tested; the search has a most.
import { TOWERS, towerRadius, routeDistance, GREAT_BRIDGE, HIGH_BRIDGE, CANYON_BRIDGE, greatDeck, highDeck, canyonBridge, ring } from './bridges-of-marigold-plan.js';

export const CLEAR = 14, LINE_GAP = 2.2, TRAM_GAP = 7, INSET = 2.5, SAMPLES = 14;

// a point of line l at the share t of its span (at rest); side is metres of sway to add (the line's own sideways unit)
export function linePoint(l, t, side = 0) {
  const k = 4 * t * (1 - t), s = side * k;
  return [l.a[0] + (l.b[0] - l.a[0]) * t + l.px * s, l.a[1] + (l.b[1] - l.a[1]) * t - l.sag * k, l.a[2] + (l.b[2] - l.a[2]) * t + l.pz * s];
}
// the face of tower k seen from the ground-plan point (x, z), at height y, pushed out by pad metres
function face(k, x, z, y, pad) {
  const T = TOWERS[k], dx = x - T.x, dz = z - T.z, d = Math.hypot(dx, dz) || 1, r = towerRadius(k, y) + pad;
  return [T.x + dx / d * r, y, T.z + dz / d * r];
}
function makeLine(kA, kB, toA, toB, yA, yB, sagK, sway, phase, kind) {
  // toA: the ground-plan point tower kA's end faces; toB likewise for kB
  const a = face(kA, toA[0], toA[1], yA, -INSET), b = face(kB, toB[0], toB[1], yB, -INSET);
  const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, b[1] - a[1], dz), h = Math.hypot(dx, dz) || 1;
  // t0, t1: where the line leaves each tower's face (the string runs INSET metres on inside the plan's face)
  const t0 = Math.min(0.3, (INSET + 0.7) / len), t1 = 1 - t0;
  return { kA, kB, a, b, len, sag: len * sagK, sway, phase, kind, px: -dz / h, pz: dx / h, t0, t1 };
}
// is a place in a bridge's bed, or in the air a few metres over or under it?
function inBridge(p) {
  const g = GREAT_BRIDGE, h = HIGH_BRIDGE, c = CANYON_BRIDGE;
  if (p[2] > g.z1 - 2 && p[2] < g.z0 + 14 && Math.abs(p[0] - g.x) < g.width / 2 + 4) { const d = p[1] - greatDeck(p[2]); if (d > -8 && d < 12) return true; }
  if (p[2] > h.z0 - 2 && p[2] < h.z1 + 12 && Math.abs(p[0] - h.x) < h.width / 2 + 4) { const d = p[1] - highDeck(p[2]); if (d > -8 && d < 12) return true; }
  const a = ring(c.b, c.r0), b = ring(c.b, c.r1), ux = (b[0] - a[0]) / (c.r1 - c.r0), uz = (b[1] - a[1]) / (c.r1 - c.r0);
  const s = (p[0] - a[0]) * ux + (p[2] - a[1]) * uz, w = Math.abs(-(p[0] - a[0]) * uz + (p[2] - a[1]) * ux);
  if (s > -3 && s < c.r1 - c.r0 + 3 && w < c.width / 2 + 4) { const d = p[1] - canyonBridge(Math.min(1, Math.max(0, s / (c.r1 - c.r0))))[1]; if (d > -9 && d < 9) return true; }
  return false;
}
function samples(l) {
  const P = [];
  for (let i = 0; i <= SAMPLES; i++) { const t = l.t0 + (l.t1 - l.t0) * i / SAMPLES; for (const s of [-l.sway, l.sway]) P.push(linePoint(l, t, s)); }
  return P;
}
function gap(P, Q) { let best = 1e9; for (const p of P) for (const q of Q) { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (d < best) best = d; } return Math.sqrt(best); }
const clearOfRoute = (P) => { for (const p of P) if (routeDistance(p[0], p[1], p[2]) < CLEAR) return false; return true; };

// THE TRAMS' CABLES: [from tower, to tower]. Each hangs so that its car rides at the flown line's own height where
// the line passes that part of the canyon (the plan's routeHeightAt at the bearing of the cable's middle): the
// first on the west side (towers 3 and 2), the second on the north-west (3 and 4), the third on the east (5 and 6).
export const TRAM_PAIRS = [[3, 2], [3, 4], [5, 6]];
export const CAR_DROP = 3.4;           // a car's middle hangs this far under its cable
const bearingOf = (x, z) => (Math.atan2(-x, z) * 180 / Math.PI + 360) % 360;

// The whole deal. rng: the lines' own stream. density: the visit's 0.7..1.3. tick: an optional awaitable handed
// back to between candidates (the page's ctx.yield); it takes no die.
export async function layLines(rng, density, routeHeightAt, tick) {
  const lines = [], coarse = [], tramBoxes = [];
  const rest = (l, n) => { const P = []; for (let i = 0; i <= n; i++) P.push(linePoint(l, l.t0 + (l.t1 - l.t0) * i / n)); return P; };
  for (const [kA, kB] of TRAM_PAIRS) {
    const A = TOWERS[kA], B = TOWERS[kB], y = routeHeightAt(bearingOf((A.x + B.x) / 2, (A.z + B.z) / 2)) + CAR_DROP;
    const l = makeLine(kA, kB, [B.x, B.z], [A.x, A.z], y, y, 0.022, 0, 0, 'tram');
    lines.push(l); coarse.push(rest(l, 7));
    const box = rest(l, 12); for (const p of rest(l, 12)) box.push([p[0], p[1] - CAR_DROP - 1.2, p[2]]); tramBoxes.push(box);
  }
  const want = 3 + Math.round(150 * density), most = 7 * want;
  for (let tries = 0; lines.length < want && tries < most; tries++) {
    const fam = rng(), kr = rng(), jb = rng(), ya = rng(), yb = rng(), sg = rng(), sw = rng(), ph = rng(), kd = rng();
    const k = 1 + Math.min(6, Math.floor(kr * 7)), T = TOWERS[k], kind = kd < 0.5 ? 'lamps' : kd < 0.9 ? 'flags' : 'cable';
    let l;
    if (fam < 0.56) {                                                  // across the canyon, from the great tower
      const top = Math.min(T.top, TOWERS[0].top) - 6, y0 = 46 + (top - 46) * ya, y1 = Math.min(T.top - 3, Math.max(24, y0 + (yb - 0.5) * 18));
      const far = ring(T.b + (jb - 0.5) * 30, 400), A = face(0, far[0], far[1], y0, 0);
      l = makeLine(0, k, far, [A[0], A[2]], y0, y1, 0.05 + 0.06 * sg, 0.2 + 0.3 * sw, ph * 6.2832, kind);
    } else {                                                           // round the ring, to the next ring tower
      const k2 = k % 7 + 1, Tb = TOWERS[k2], top = Math.min(T.top, Tb.top) - 4, y0 = 24 + (top - 24) * ya, y1 = Math.min(top, Math.max(22, y0 + (yb - 0.5) * 16));
      const bow = 1 + (jb - 0.5) * 0.5, mx = (T.x + Tb.x) / 2 * bow, mz = (T.z + Tb.z) / 2 * bow;
      l = makeLine(k, k2, [mx, mz], [mx, mz], y0, y1, 0.05 + 0.06 * sg, 0.2 + 0.3 * sw, ph * 6.2832, kind);
    }
    if (tick && tries % 12 === 11) await tick();
    if (l.len < 16 || l.len > 110) continue;
    const P = samples(l);
    if (!clearOfRoute(P)) continue;
    let ok = true;
    for (const p of P) if (inBridge(p)) { ok = false; break; }
    if (!ok) continue;
    for (const box of tramBoxes) if (gap(P, box) < TRAM_GAP) { ok = false; break; }
    if (!ok) continue;
    const C = rest(l, 7);
    for (let i = 3; i < coarse.length && ok; i++) if (gap(C, coarse[i]) < LINE_GAP + 3) ok = false;   // (coarse samples stand up to 8 m apart: 3 m more keeps the true gap)
    if (!ok) continue;
    lines.push(l); coarse.push(C);
  }
  return lines;
}
