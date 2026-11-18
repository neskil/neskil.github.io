// doors-in-transit: THE FLOWN LINE, by the design's places (section 6), as plain numbers: no three.js here, so that the
// works can count its clear air against the very same line. Metres; floor y = 0.
import { ENTRY, EXIT, TURNTABLE } from './doors-in-transit-plan.js';

const ss = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
const lerp = (a, b, t) => a + (b - a) * t;

// The legs, each a function of its own share t in 0..1, each beginning where the last one ends and with its heading:
// A  the canyon: straight down x = 21 from the entry (level at first) until the floor's turntable is abeam (z = -30),
//    rising from 8 to 10
// B  a left-hand half circle about the turntable's middle (the plan's TURNTABLE: (0, -30)), as wide as the entry
//    stands off it (21 m), by (0, 11, -51), to (-21, 12, -30) heading +z
// C  up the stand: heading +z, sliding out from x = -21 to x = -40 and climbing from 12 to 46 by z = 60
// D  round the head of the hall: a left-hand half circle of 40 m about (0, 60), rising from 46 to 52, by (0, 50, 100)
// E  down toward the bay: heading -z from (40, 52, 60), wide of the tower, then easing onto the hall's long axis
// F  the last door: a straight last leg of 60 m from (0, 14, -10.3), sinking gently, to the exit
const LAST = { x: 0, y: 14, z: -10.3 };
const TURN = { x: TURNTABLE.x, z: TURNTABLE.z, r: ENTRY.x - TURNTABLE.x };      // the first half circle: about the turntable, from the canyon's line
const legs = [
  { len: ENTRY.z - TURN.z, at: (t) => [ENTRY.x, ENTRY.y + 2 * ss((t - 0.3) / 0.7), lerp(ENTRY.z, TURN.z, t)] },
  { len: Math.PI * TURN.r, at: (t) => { const a = Math.PI * t; return [TURN.x + TURN.r * Math.cos(a), 10 + 2 * t, TURN.z - TURN.r * Math.sin(a)]; } },
  { len: 98, at: (t) => [TURN.x - TURN.r - 19 * ss(t), 12 + 34 * (0.25 * t + 0.75 * ss(t)), lerp(TURN.z, 60, t)] },
  { len: Math.PI * 40, at: (t) => { const a = Math.PI * t; return [-40 * Math.cos(a), 46 + 6 * t + 1 * Math.sin(a), 60 + 40 * Math.sin(a)]; } },
  { len: 88, at: (t) => {
    // x holds wide of the tower while it passes on the left hand, then eases onto the axis; y sinks all the way
    const z = lerp(60, LAST.z, t), w = ss((t - 0.3) / 0.7), w2 = ss(w);
    return [40 * (1 - lerp(w, w2, 0.5)), lerp(52, LAST.y, 0.3 * t + 0.7 * ss(t)), z];
  } },
  { len: 60, at: (t) => [0, lerp(LAST.y, EXIT.y, t), lerp(LAST.z, EXIT.z, t)] },
];

// Points along the whole line at about `step` metres (the path's own spline is drawn through them).
export function routePoints(step = 4) {
  const out = [];
  for (let k = 0; k < legs.length; k++) {
    const n = Math.max(2, Math.round(legs[k].len / step));
    for (let i = k === 0 ? 0 : 1; i <= n; i++) out.push(legs[k].at(i / n));
  }
  return out;
}

// A fine copy of the line with its running length: { pts, cum, total } (for metres of route <-> share of route).
export function routeTable(step = 0.5) {
  const pts = routePoints(step), cum = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
  return { pts, cum, total: cum[pts.length - 1] };
}

// The share of the route (0..1) at which each leg ends, by the fine table: { A, B, C, D, E } (F ends at 1).
export function legEnds(step = 0.5) {
  const ends = []; let total = 0;
  for (const leg of legs) {
    const n = Math.max(2, Math.round(leg.len / step)); let len = 0, p = leg.at(0);
    for (let i = 1; i <= n; i++) { const q = leg.at(i / n); len += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); p = q; }
    total += len; ends.push(total);
  }
  return { A: ends[0] / total, B: ends[1] / total, C: ends[2] / total, D: ends[3] / total, E: ends[4] / total, total };
}

// The nearest point of the flown line to a point: its distance (the whole line, fine table handed in).
export function nearestOnRoute(table, x, y, z) {
  let best = Infinity, bi = 0; const P = table.pts;
  for (let i = 0; i < P.length; i++) { const dx = P[i][0] - x, dy = P[i][1] - y, dz = P[i][2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
  return { dist: Math.sqrt(best), u: table.cum[bi] / table.total, i: bi };
}
