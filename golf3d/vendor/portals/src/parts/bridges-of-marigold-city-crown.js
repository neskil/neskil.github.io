// bridges-of-marigold, the city: THE TOPS, STILL BEING BUILT. On the houses that stand open to the sky (none over
// them) stream 'crown' deals timber scaffolds round half-built storeys, water tanks, small tiled domes and belfries;
// on the great tower stand two
// builders' cranes of yellow lattice, one of which turns its arm slowly (its arm is laid into an accumulator of its
// own, about its pivot, and the work file turns that mesh by the world's time).
// Everything keeps under top + crown and inside the plan's radius there; the turning arm sweeps over everything else
// with 1.5 m and more to spare, and the second crane stands wholly outside the circle it sweeps.
import { TOWERS, towerRadius } from './bridges-of-marigold-plan.js';
import { frame, boxF, cupola, belfry } from './bridges-of-marigold-city-shapes.js';
import { DRUM } from './bridges-of-marigold-city-place.js';

const TIMBER = [0.44, 0.28, 0.13], PLANK = [0.5, 0.36, 0.2], RAW = [0.36, 0.29, 0.3], CRANE = [0.85, 0.56, 0.06], IRON = [0.1, 0.1, 0.14];

// the houses of a tower with no house over them (within 6 m of their middle)
export function openTops(houses, k) {
  const L = houses.filter((h) => h.k === k);
  return L.filter((h) => !L.some((o) => o !== h && o.y > h.y + h.h - 3 && Math.hypot(o.x - h.x, o.z - h.z) < 6));
}

function scaffold(G, h, hs, rng) {
  const F = frame(h.x, h.y + h.h, h.z, h.yaw), hw = h.w / 2 - 0.9, hd = h.d / 2 - 0.9, t = 0.36;
  const wallH = Math.min(hs - 0.8, 1 + rng() * 2.4), brace = rng() < 0.5 ? 1 : -1, deckAt = rng() < 0.5 ? 2.2 : Math.min(4.4, hs - 0.4);
  G.col(RAW).aux(1, 0.3); boxF(G, F, 0, 0, 0, 2 * hw - 1.2, wallH, 2 * hd - 1.2, false);
  G.col(TIMBER).aux(7, 0.55);
  for (const [lx, lz] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [0, hd], [0, -hd]]) G.beam(F.p(lx, 0, lz), F.p(lx, hs, lz), t);
  for (const ly of [2.2, 4.4, hs - 0.2]) {
    if (ly > hs) continue;
    G.beam(F.p(-hw, ly, hd), F.p(hw, ly, hd), t * 0.8); G.beam(F.p(-hw, ly, -hd), F.p(hw, ly, -hd), t * 0.8);
    G.beam(F.p(hw, ly, -hd), F.p(hw, ly, hd), t * 0.8); G.beam(F.p(-hw, ly, -hd), F.p(-hw, ly, hd), t * 0.8);
  }
  G.beam(F.p(-hw * brace, 0, hd), F.p(0, Math.min(hs, 4.4), hd), t * 0.7); G.beam(F.p(hw, 0, -hd * brace), F.p(hw, Math.min(hs, 4.4), 0), t * 0.7);
  G.col(PLANK).aux(1, 0.5); boxF(G, F, 0, deckAt, hd - 0.5, 2 * hw, 0.14, 1.3);
}

function tank(G, h, rng) {
  const F = frame(h.x, h.y + h.h, h.z, h.yaw), q = F.p((rng() - 0.5) * (h.w - 4), 0, (rng() - 0.5) * (h.d - 4)), dark = rng() < 0.6;
  G.col(RAW).aux(1, 0.3).box(q[0], q[1], q[2], 1.9, 0.9, 1.9, h.yaw, false);
  G.col(dark ? [0.05, 0.05, 0.07] : [0.1, 0.25, 0.5]).aux(1, 0.35).prism(q[0], q[2], q[1] + 0.9, q[1] + 2.3, 0.95, 0.85, 9, 0, true);
}

// a lattice mast between two heights about a vertical axis, s wide
export function mast(G, x, z, y0, y1, s, t) {
  const c = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]], bays = Math.max(1, Math.round((y1 - y0) / 2.2)), dy = (y1 - y0) / bays;
  for (const [a, b] of c) G.beam([x + a, y0, z + b], [x + a, y1, z + b], t);
  for (let i = 0; i < bays; i++) for (let j = 0; j < 4; j++) {
    const p = c[j], q = c[(j + 1) % 4], ya = y0 + i * dy, yb = ya + dy;
    G.beam([x + p[0], yb, z + p[1]], [x + q[0], yb, z + q[1]], Math.max(0.25, t * 0.6));
    G.beam([x + p[0], ya, z + p[1]], [x + q[0], yb, z + q[1]], Math.max(0.25, t * 0.55));
  }
}

// the arm of a crane about its pivot (the frame's origin): jib along the frame's x (length L), counter-jib behind,
// the head and its tie bars, a slewing drum and a cab under the jib's foot, a trolley with a short fall and its block.
// Nothing of it hangs lower than 2 m under the pivot.
export function arm(G, F, L, t) {
  const bays = Math.round(L / 2.2), dx = L / bays, w = 0.7, hgt = 1.3, P = (x, y, z) => F.p(x, y, z);
  G.col(CRANE).aux(7, 0.6);
  G.beam(P(0, 0, -w), P(L, 0, -w), t); G.beam(P(0, 0, w), P(L, 0, w), t); G.beam(P(0, hgt, 0), P(L, hgt * 0.5, 0), t);
  for (let i = 0; i < bays; i++) {
    const xa = i * dx, xb = xa + dx, yb = hgt - (hgt * 0.5 * (i + 0.5)) / bays;
    G.beam(P(xa, 0, -w), P(xa + dx / 2, yb, 0), 0.25); G.beam(P(xb, 0, w), P(xa + dx / 2, yb, 0), 0.25); G.beam(P(xa, 0, w), P(xb, 0, -w), 0.25);
  }
  const cj = L * 0.32;
  G.beam(P(0, 0, -w), P(-cj, 0, -w), t); G.beam(P(0, 0, w), P(-cj, 0, w), t); G.beam(P(-cj, 0, -w), P(-cj, 0, w), t);
  G.beam(P(-0.6, 0, 0), P(0, 3.2, 0), t); G.beam(P(0.6, 0, 0), P(0, 3.2, 0), t);                     // the head
  G.col(IRON).aux(7, 0.4); G.beam(P(0, 3.2, 0), P(L * 0.62, hgt * 0.7, 0), 0.25); G.beam(P(0, 3.2, 0), P(-cj + 0.4, 0.2, 0), 0.25);   // tie bars
  const d = P(0, -2, 0); G.col(IRON).aux(1, 0.4).prism(d[0], d[2], d[1], d[1] + 2, 0.6, 0.6, 8, 0, true, true);   // the slewing drum
  G.col([0.2, 0.2, 0.24]).aux(1, 0.3); boxF(G, F, -cj + 1.2, -1.1, 0, 2.2, 1.1, 1.6);             // the counterweight
  G.col(CRANE).aux(1, 0.6); boxF(G, F, 1.6, -1.9, 1.2, 1.5, 1.8, 1.4);                             // the cab, with one lit pane
  G.col([1, 0.72, 0.36]).aux(2, 1.6).quad(P(2.37, -1.3, 1.8), P(2.37, -1.3, 0.6), P(2.37, -0.5, 0.6), P(2.37, -0.5, 1.8));
  const tx = L * 0.7;
  G.col(IRON).aux(1, 0.4); boxF(G, F, tx, -0.35, 0, 1, 0.3, 1.2); G.beam(P(tx, -0.35, 0), P(tx, -1.25, 0), 0.25); boxF(G, F, tx, -1.75, 0, 0.5, 0.5, 0.5);
}

// Lays the tops into G (fixed) and the turning arm into GA (about its pivot), a tower a step (it yields between
// them). Its last value is { pivot: [x, y, z] }.
function* crownSteps(G, GA, houses, rngFor, paintOf) {
  const rng = rngFor('crown'), t0 = TOWERS[0];
  // the two cranes of the great tower: the turning one 12 m from the axis, the fixed one 15 m off on the far side
  const bear = rng() * Math.PI * 2, turn2 = (rng() - 0.5) * 1.2, yP = t0.top + t0.crown - 3.7, L1 = 20, L2 = 16;
  const c1 = [t0.x + 12 * Math.sin(bear), t0.z + 12 * Math.cos(bear)], c2 = [t0.x - 15 * Math.sin(bear), t0.z - 15 * Math.cos(bear)];
  const roofAt = (x, z) => { let y = t0.top - 22; for (const h of houses) if (h.k === 0 && Math.hypot(h.x - x, h.z - z) < 5.5) y = Math.max(y, h.y + h.h); return y; };
  G.col(CRANE).aux(7, 0.55); mast(G, c1[0], c1[1], roofAt(c1[0], c1[1]) - 0.5, yP - 2.3, 1.4, 0.3);
  arm(GA, frame(0, 0, 0, 0), L1, 0.3);
  const y2 = yP - 4.5;
  G.col(CRANE).aux(7, 0.55); mast(G, c2[0], c2[1], roofAt(c2[0], c2[1]) - 0.5, y2 - 2.05, 1.4, 0.3);
  arm(G, frame(c2[0], y2, c2[1], bear + Math.PI / 2 + turn2), L2, 0.3);        // (its jib points away from the turning crane)
  yield;
  for (let k = 0; k < TOWERS.length - 1; k++) {
    const t = TOWERS[k], cap = k === 0 ? yP - 2.5 : t.top + t.crown - 0.4;
    let seen = 0;
    for (const h of openTops(houses, k)) {
      if (seen++ % 20 === 19) yield;
      const u = rng(), uh = rng(), r2 = rngFor('crown' + k + ':' + Math.round(h.seed * 1e6));
      const top = h.y + h.h, near = k === 0 && (Math.hypot(h.x - c1[0], h.z - c1[1]) < 4.5 || Math.hypot(h.x - c2[0], h.z - c2[1]) < 4.5);
      const hs = Math.min(4 + uh * 3.6, cap - top);
      if (near) continue;                                    // a crane's mast stands on this roof
      if (k > 0 && Math.hypot(h.x - t.x, h.z - t.z) < DRUM + 3) continue;   // the round house of the tower's crown stands here (city-skyline)
      if (u < 0.5 && hs > 2.6 && keeps(k, h, hs)) scaffold(G, h, hs, r2);
      else if (u < 0.68) tank(G, h, r2);
      else if (u < 0.84 && cap - top > 2.2 + 1.9 * 2.3 && Math.min(h.w, h.d) > 6.6) cupola(G, h.x, top, h.z, 2.3, h.yaw, uh < 0.5 ? [0.85, 0.6, 0.08] : [0.75, 0.72, 0.62], uh < 0.5 ? [0.06, 0.16, 0.55] : [0.1, 0.5, 0.45], [0.7, 0.66, 0.58]);
      else if (u < 0.95 && cap - top > 6.8) belfry(G, frame(h.x, top, h.z, h.yaw), 2.4, 5, paintOf(h).map((v) => v * 0.8 + 0.12));
    }
    yield;
  }
  return { pivot: [c1[0], yP, c1[1]] };
}
// the tops, with pause() awaited between the steps
export async function layTops(G, GA, houses, rngFor, paintOf, pause) {
  const it = crownSteps(G, GA, houses, rngFor, paintOf); let s = it.next();
  while (!s.done) { await pause(); s = it.next(); }
  return s.value;
}
// a scaffold's posts stand 0.9 m inside its house's walls; this says whether its top still keeps the plan's radius
function keeps(k, h, hs) {
  const t = TOWERS[k], y = h.y + h.h + hs, R = towerRadius(k, Math.min(y, t.top + t.crown));
  const F = frame(h.x, 0, h.z, h.yaw); let far = 0;
  for (const [lx, lz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = F.p(lx * (h.w / 2 - 0.7), 0, lz * (h.d / 2 - 0.7)); far = Math.max(far, Math.hypot(q[0] - t.x, q[2] - t.z)); }
  return far < R;
}
