// bridges-of-marigold, the city: WHAT JOINS THE TOWERS, AND THE BOATS. (1) Footbridges of iron: a cambered deck with
// railings on two arched ribs, a lantern on a post every few metres. Some run from ring tower to ring tower (outside
// the canyon, far from the flown line); some cross the canyon from the great tower to a ring tower, and those keep
// 14 m and more over or under the flown line where they cross it (plan: routeHeightAt), counted along their whole
// length with routeDistance. A bridge is the one thing of the city that leaves the towers' radii, by the design.
// (2) Small painted boats moored at the quays of the stone feet, a lantern on a pole in each, riding the water.
// Stream 'links' deals the bridges' heights and the boats' places, paint and lamps (every die before any test).
import { TOWERS, towerRadius, WATER, routeDistance, routeHeightAt } from './bridges-of-marigold-plan.js';
import { frame, boxF } from './bridges-of-marigold-city-shapes.js';

const IRON = [0.09, 0.08, 0.12], PLANK = [0.36, 0.24, 0.13];
const LAMPS = [[1, 0.72, 0.36], [0.2, 0.9, 0.8], [1, 0.25, 0.6], [1, 0.72, 0.36], [0.65, 0.4, 1], [0.6, 0.95, 0.25]];
const PAINT = [[0.75, 0.1, 0.25], [0.05, 0.2, 0.7], [0.05, 0.55, 0.5], [0.8, 0.5, 0.05], [0.4, 0.65, 0.08], [0.45, 0.15, 0.7], [0.8, 0.15, 0.05], [0.8, 0.75, 0.65]];
export const CLEAR = 14;                    // a footbridge keeps this far from the flown line everywhere

// the ends of a bridge between towers a and b at heights ya, yb: each 8 m inside its tower's radius (inside the houses)
function ends(a, b, ya, yb) {
  const A = TOWERS[a], B = TOWERS[b], dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  const ra = Math.max(2, towerRadius(a, ya) - 8), rb = Math.max(2, towerRadius(b, yb) - 8);
  return [[A.x + ux * ra, ya, A.z + uz * ra], [B.x - ux * rb, yb, B.z - uz * rb]];
}
function clearOf(p, q) {
  let least = Infinity;
  for (let i = 0; i <= 24; i++) { const s = i / 24; least = Math.min(least, routeDistance(p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s + 1.5, p[2] + (q[2] - p[2]) * s)); }
  return least;
}

function footbridge(G, p, q, first) {
  const dx = q[0] - p[0], dz = q[2] - p[2], L = Math.hypot(dx, dz), n = Math.max(6, Math.round(L / 4.5)), yaw = Math.atan2(dx, dz) - Math.PI / 2;
  const sx = -dz / L, sz = dx / L, w = 0.95, camber = L * 0.035;
  const at = (s, side, dy = 0) => [p[0] + dx * s + sx * side, p[1] + (q[1] - p[1]) * s + camber * 4 * s * (1 - s) + dy, p[2] + dz * s + sz * side];
  for (let i = 0; i < n; i++) {
    const s0 = i / n, s1 = (i + 1) / n;
    G.col(PLANK).aux(1, 0.55);
    G.quad(at(s0, w), at(s1, w), at(s1, -w), at(s0, -w)); G.quad(at(s0, -w, -0.22), at(s1, -w, -0.22), at(s1, w, -0.22), at(s0, w, -0.22));
    for (const sd of [-1, 1]) {
      const a = at(s0, sd * w), b = at(s1, sd * w), up = (v) => [v[0], v[1] + 1, v[2]];
      G.col(IRON).aux(8, 0);                                  // (each corner of the railing carries the height of the deck under it)
      G.tri3(a, b, up(b), [a[1], b[1], b[1]]); G.tri3(a, up(b), up(a), [a[1], b[1], a[1]]); G.tri3(b, a, up(a), [b[1], a[1], a[1]]); G.tri3(b, up(a), up(b), [b[1], a[1], b[1]]);
      // the rib under the deck: an arch that springs 0.4 m and a twelfth of the span under each end and meets the deck at mid-span
      const rib = (s) => -(0.4 + L * 0.08 * 4 * (s - 0.5) * (s - 0.5)), r0 = rib(s0), r1 = rib(s1);
      G.col(IRON).aux(7, 0.45).beam(at(s0, sd * w, r0), at(s1, sd * w, r1), 0.3);
      if (i > 0) G.beam(at(s0, sd * w, r0), at(s0, sd * w, -0.2), 0.14);
    }
    if (i % 2 === 1) {
      const c = at(s0, w - 0.1), lc = LAMPS[(i + first) % LAMPS.length];
      G.col(IRON).aux(7, 0.5).beam(c, [c[0], c[1] + 2.5, c[2]], 0.12);
      G.col(lc).aux(2, 3.6).prism(c[0], c[2], c[1] + 2.5, c[1] + 2.95, 0.18, 0.27, 5, 0, true, true);
    }
  }
}

function boat(G, F, paint, lamp, phase) {
  const gun = [[0, 1.9], [0.62, 0.3], [0.5, -1.6], [-0.5, -1.6], [-0.62, 0.3]], n = gun.length;
  G.bob(phase);
  for (let i = 0; i < n; i++) {
    const a = gun[i], b = gun[(i + 1) % n];
    G.col(paint).aux(1, 0.6).quad(F.p(a[0] * 0.55, 0, a[1] * 0.9), F.p(b[0] * 0.55, 0, b[1] * 0.9), F.p(b[0], 0.55, b[1]), F.p(a[0], 0.55, a[1]));
    G.col(PLANK).aux(1, 0.7).tri(F.p(0, 0.22, 0), F.p(a[0] * 0.85, 0.22, a[1] * 0.92), F.p(b[0] * 0.85, 0.22, b[1] * 0.92));
  }
  G.col(PLANK).aux(1, 0.6); boxF(G, F, 0, 0.22, -0.5, 1.05, 0.2, 0.3, false);
  const q = F.p(0, 0.22, 1.0);
  G.col(IRON).aux(7, 0.5).beam(q, [q[0], q[1] + 1.5, q[2]], 0.08);
  G.col(lamp).aux(2, 3.6).prism(q[0], q[2], q[1] + 1.5, q[1] + 1.9, 0.14, 0.2, 5, 0, true, true);
  G.bob(0);
}

// Lays footbridges and boats into G in steps (it yields between them); its last value: the bridges' ends (for
// whoever hangs lines between the towers).
function* linkSteps(G, rngFor, quayIn) {
  const rng = rngFor('links'), bridges = [];
  const pairs = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 2], [0, 3], [0, 5], [0, 6]];
  for (let pi = 0; pi < pairs.length; pi++) {
    const [a, b] = pairs[pi];
    const dice = []; for (let i = 0; i < 5; i++) dice.push([rng(), rng(), rng()]);       // five tries' dice, all drawn first
    const A = TOWERS[a], B = TOWERS[b], cap = Math.min(A.top, B.top) - 11;
    for (const [u, v, o] of dice) {
      let ya, yb;
      if (a === 0) {                                       // across the canyon: over or under the flown line where it passes this bearing
        const yL = routeHeightAt(B.b), over = yL + 17 + u * 13, under = yL - 17 - u * 9;
        ya = o < 0.5 && over < cap ? over : Math.max(A.base + 7, under); yb = ya + (v - 0.5) * 7;
      } else { ya = 34 + u * (cap - 34); yb = Math.min(cap, Math.max(30, ya + (v - 0.5) * 18)); }
      const [p, q] = ends(a, b, ya, yb);
      if (clearOf(p, q) < CLEAR + 1.5 || yb > cap || yb < B.base + 6) continue;
      footbridge(G, p, q, pi); bridges.push([p, q]);
      break;
    }
    yield;
  }
  // boats at the quays: three to five at each ring tower's foot, nine at the great tower's
  for (let k = 0; k < TOWERS.length; k++) {
    const t = TOWERS[k], n = k === 0 ? 9 : 3 + Math.floor(rng() * 2.99);
    for (let i = 0; i < n; i++) {
      const a = (i + rng() * 0.7) * Math.PI * 2 / n + rng() * 0.3, turn = (rng() - 0.5) * 0.5, c = Math.floor(rng() * PAINT.length), l = Math.floor(rng() * LAMPS.length), ph = 0.5 + rng() * 6;
      const rho = t.footR - quayIn + 1.35;            // (0.28 m and more of water between its side and the quay)
      if (k === 0 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.45) continue;      // (the gate terrace's bastion stands in the water there)
      boat(G, frame(t.x + rho * Math.sin(a), WATER - 0.12, t.z + rho * Math.cos(a), a + Math.PI / 2 + turn), PAINT[c], LAMPS[l], ph);
    }
    if (k % 3 === 2) yield;
  }
  return bridges;
}
// the same with pause() awaited between the steps (a footbridge a step, three towers' boats a step)
export async function layLinksIn(G, rngFor, quayIn, pause) {
  const it = linkSteps(G, rngFor, quayIn); let s = it.next();
  while (!s.done) { await pause(); s = it.next(); }
  return s.value;
}
