// bridges-of-marigold, the city: RELIEF WHERE THE FLIGHT PASSES. Chosen by PLACE: every house of an outer ring whose
// front stands within NEAR metres of the flown line (plan: routeDistance) is dealt real things before its wall:
// a balcony of timber with an iron railing and pots (the shader opens a door onto it), a striped awning over its
// door, timber brackets under a house that hangs out, a washing line with cloths, and before the deep-set houses an
// arcade of stone piers and round arches with a lamp under each arch and a railed walk on top.
// Everything stands in the room the house's own inset leaves, so that nothing passes the plan's towerRadius.
// Stream 'relief' deals which house gets what (every die of a house is drawn before any test).
import { routeDistance } from './bridges-of-marigold-plan.js';
import { frame, boxF, archWall, dome } from './bridges-of-marigold-city-shapes.js';

export const NEAR = 70;
const TIMBER = [0.3, 0.17, 0.08], IRON = [0.07, 0.07, 0.1], PLASTER = [0.55, 0.5, 0.45], STONE = [0.34, 0.3, 0.4], POT = [0.5, 0.2, 0.09];
const CLOTH = [[0.85, 0.1, 0.4], [0.95, 0.9, 0.8], [0.05, 0.6, 0.6], [0.95, 0.7, 0.1], [0.1, 0.2, 0.75], [0.55, 0.2, 0.8], [0.9, 0.2, 0.1], [0.5, 0.8, 0.15]];
const WASH = [[0.9, 0.88, 0.82], [0.8, 0.3, 0.4], [0.3, 0.6, 0.8], [0.9, 0.75, 0.3], [0.6, 0.8, 0.6], [0.85, 0.85, 0.9]];

// The numbers of a house's front that its shader is handed too: bays, floors, the door's bay, a bay's width, a floor's height.
export function frontOf(h) {
  const f = (m) => { const v = h.seed * m; return v - Math.floor(v); };
  const bays = Math.max(1, Math.floor(h.w / (2.2 + 2.2 * f(917.13)))), floors = Math.min(3, Math.max(2, Math.floor((h.h + (f(573.71) - 0.5) * 1.5) / 2.75)));
  return { bays, floors, door: Math.floor(f(231.17) * bays), bw: h.w / bays, fh: h.h / floors };
}

// a railing 1 m high from a to b (both faces), its foot at their height
function railing(G, a, b) {
  const up = (p) => [p[0], p[1] + 1, p[2]];
  G.col(IRON).aux(8, a[1]); G.quad(a, b, up(b), up(a)); G.quad(b, a, up(a), up(b));
}

function balcony(G, F, x0, x1, y, dp, wy, rng) {
  G.col(PLASTER).aux(1, 0.75); boxF(G, F, (x0 + x1) / 2, y - 0.17, dp / 2, x1 - x0, 0.17, dp);
  const a = F.p(x0 + 0.05, y, dp - 0.06), b = F.p(x1 - 0.05, y, dp - 0.06), a0 = F.p(x0 + 0.05, y, 0.02), b0 = F.p(x1 - 0.05, y, 0.02);
  railing(G, a, b); railing(G, a0, a); railing(G, b, b0);
  G.col(TIMBER).aux(7, 0.6);
  for (const x of [x0 + 0.3, x1 - 0.3]) G.beam(F.p(x, y - 0.17, dp - 0.15), F.p(x, y - 0.95, 0.02), 0.14);
  if (rng() < 0.55) for (const x of [x0 + 0.4, x1 - 0.4]) {
    const q = F.p(x, y, dp - 0.4), r = 0.2 + rng() * 0.08;
    G.col(POT).aux(1, 0.6).prism(q[0], q[2], q[1], q[1] + r * 1.4, r * 0.7, r, 6, 0, false);
    dome(G, q[0], q[1] + r * 1.4, q[2], r * 1.2, r * 1.1, 6, 2, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, 0.45);
  }
}

function awning(G, F, xc, w, y, dp, rng) {
  const a = CLOTH[Math.floor(rng() * CLOTH.length)], b = CLOTH[Math.floor(rng() * CLOTH.length)], n = 5, dx = w / n, drop = 0.5;
  for (let i = 0; i < n; i++) {
    const xa = xc - w / 2 + i * dx, xb = xa + dx;
    G.col(i % 2 ? a : b).aux(1, 0.7).quad(F.p(xa, y - drop, dp), F.p(xb, y - drop, dp), F.p(xb, y, 0.03), F.p(xa, y, 0.03));
    G.quad(F.p(xa, y - drop - 0.28, dp), F.p(xb, y - drop - 0.28, dp), F.p(xb, y - drop, dp), F.p(xa, y - drop, dp));
    G.col(i % 2 ? a : b).aux(1, 1.2).quad(F.p(xb, y - drop - 0.02, dp), F.p(xa, y - drop - 0.02, dp), F.p(xa, y - 0.02, 0.03), F.p(xb, y - 0.02, 0.03));
  }
  G.col(IRON).aux(7, 0.5);
  for (const x of [xc - w / 2, xc + w / 2]) G.beam(F.p(x, y - drop, dp), F.p(x, y - drop - 0.75, 0.03), 0.07);
}

function washing(G, F, x0, x1, y, z, rng) {
  G.col(IRON).aux(7, 0.5); G.beam(F.p(x0, y, 0.02), F.p(x0, y, z), 0.08); G.beam(F.p(x1, y, 0.02), F.p(x1, y, z), 0.08);
  G.col([0.5, 0.48, 0.45]).aux(7, 0.6).beam(F.p(x0, y, z), F.p(x1, y, z), 0.05);
  let x = x0 + 0.25;
  while (x < x1 - 0.9) {
    const w = 0.5 + rng() * 0.5, hgt = 0.6 + rng() * 0.6, c = WASH[Math.floor(rng() * WASH.length)], gap = 0.15 + rng() * 0.3;
    const p = [F.p(x, y - hgt, z), F.p(x + w, y - hgt, z), F.p(x + w, y, z), F.p(x, y, z)];
    G.col(c).aux(6, 0);                                      // (the hem swings, the line holds; the back face takes the same swing)
    G.tri3(p[0], p[1], p[2], [1, 1, 0]); G.tri3(p[0], p[2], p[3], [1, 0, 0]);
    G.tri3(p[1], p[0], p[2], [-1, -1, 0]); G.tri3(p[2], p[0], p[3], [0, -1, 0]);
    x += w + gap;
  }
}

// an arcade before a deep-set house: piers and round arches, a lamp under each arch, a railed walk on top
function arcade(G, F, w, bays, z, top) {
  const bw = w / bays, pier = 0.55, half = bw / 2 - pier / 2, spring = Math.max(0.9, top - 0.5 - half);
  G.col(STONE).aux(0, 0.8);
  for (let i = 0; i <= bays; i++) boxF(G, F, -w / 2 + i * bw, 0, z - pier / 2, pier, top, pier, false);
  for (let i = 0; i < bays; i++) {
    const xc = -w / 2 + (i + 0.5) * bw, A = F.sub(xc, 0, z);
    G.col(STONE).aux(0, 0.9); archWall(G, A, half, spring, top, pier, 4, false);
    const q = F.p(xc, top - 0.75, z - 0.9);
    G.col([1, 0.72, 0.36]).aux(2, 3).prism(q[0], q[2], q[1], q[1] + 0.3, 0.13, 0.17, 4, 0, false, true);
  }
  G.col(PLASTER).aux(1, 0.6); boxF(G, F, 0, top, z / 2, w + 0.3, 0.2, z + 0.1);
  railing(G, F.p(-w / 2, top + 0.2, z - 0.05), F.p(w / 2, top + 0.2, z - 0.05));
}

// a room that juts from an upper floor on timber brackets: a block of the house's own paint, a lit pane, a tiled lid
function jutty(G, F, xc, w, y, hgt, dp, paint) {
  G.col(paint).aux(1, 0.6); boxF(G, F, xc, y, dp / 2, w, hgt, dp);
  G.col([0.5, 0.19, 0.08]).aux(4, 0).quad(F.p(xc - w / 2 - 0.15, y + hgt, dp + 0.15), F.p(xc + w / 2 + 0.15, y + hgt, dp + 0.15), F.p(xc + w / 2 + 0.15, y + hgt + 0.55, 0.02), F.p(xc - w / 2 - 0.15, y + hgt + 0.55, 0.02));
  const P = F.sub(xc, y, dp);
  G.col([1, 0.62, 0.26]).aux(2, 1.5).quad(P.p(-w / 2 + 0.45, 0.8, 0.03), P.p(w / 2 - 0.45, 0.8, 0.03), P.p(w / 2 - 0.45, hgt - 0.45, 0.03), P.p(-w / 2 + 0.45, hgt - 0.45, 0.03));
  G.col([0.12, 0.07, 0.05]).aux(1, 0.5); boxF(G, P, 0, 0.8, 0.03, 0.09, hgt - 1.25, 0.05); boxF(G, P, 0, 0.8 + (hgt - 1.25) * 0.55, 0.03, w - 0.9, 0.08, 0.05);
  G.col(TIMBER).aux(7, 0.6);
  for (const x of [xc - w / 2 + 0.2, xc + w / 2 - 0.2]) G.beam(F.p(x, y, dp - 0.15), F.p(x, y - 1, 0.02), 0.16);
}

// Lays the relief into G and returns, per house, the cells its shader must open as doors (see the house material).
export async function layRelief(G, houses, rngFor, paintOf, pause) {
  const rng = rngFor('relief'), codes = new Float32Array(houses.length); let laid = 0;
  for (let i = 0; i < houses.length; i++) {
    const h = houses[i];
    if (G.triangles - laid > 2000) { laid = G.triangles; await pause(); }      // (a step of the build ends here)
    if (h.ring !== 0) continue;                              // (inner rings of the tops carry none: no die is drawn for them)
    const ub = rng(), ubx = rng(), ubn = rng(), ubf = rng(), uaw = rng(), ucorb = rng(), uwash = rng(), ujut = rng();
    const fx = h.x + (h.d / 2) * Math.sin(h.yaw), fz = h.z + (h.d / 2) * Math.cos(h.yaw);
    if (routeDistance(fx, h.y + h.h / 2, fz) > NEAR) continue;
    const own = h.inset - (h.bite || 0), F = frame(fx, h.y, fz, h.yaw), fr = frontOf(h), room = own + 0.25, r2 = rngFor('relief:' + i), hw = h.w / 2;
    if (room >= 3.1) {
      arcade(G, F, h.w - 0.5, fr.bays, Math.min(2.7, room - 0.15), Math.min(3.4, fr.fh));
      if (fr.fh <= 3.4) codes[i] = 8 * Math.min(7, fr.bays) + 64;
      continue;
    }
    const bf = fr.floors === 3 && ubf < 0.5 ? 2 : 1, bn = Math.min(fr.bays, 1 + Math.floor(ubn * 2.6)), bx = Math.floor(ubx * (fr.bays - bn + 1));
    const x0 = -hw + bx * fr.bw + 0.12, x1 = -hw + (bx + bn) * fr.bw - 0.12, yb = bf * fr.fh;
    if (ub < 0.62 && room >= 1.1) { balcony(G, F, x0, x1, yb, Math.min(1.35, room), h.y, r2); codes[i] = bx + 8 * bn + 64 * bf; }
    else if (ub < 0.8 && room >= 1.45 && fr.bw >= 2.3) {
      const jb = Math.floor(ubx * fr.bays), jf = fr.floors - 1;
      jutty(G, F, -hw + (jb + 0.5) * fr.bw, Math.min(3.6, fr.bw - 0.2), jf * fr.fh + 0.1, fr.fh - 0.75, Math.min(2.1, room), paintOf(h));
    }
    if (uaw < 0.45 && room >= 0.85) awning(G, F, -hw + (fr.door + 0.5) * fr.bw, Math.min(3.2, fr.bw + 0.5), Math.min(fr.fh - 0.12, 2.95), Math.min(1.25, room), r2);
    if (own < 0.8 && ucorb < 0.75) {
      const n = 3 + (ucorb < 0.3 ? 1 : 0);
      G.col(TIMBER).aux(7, 0.5);
      for (let j = 0; j < n; j++) { const x = -hw + 0.6 + (j * (h.w - 1.2)) / (n - 1); G.beam(F.p(x, 0.05, -0.08), F.p(x, -1.15, -1.0), 0.2); }
    }
    if (uwash < 0.2 && room >= 0.8 && fr.bays >= 2) {
      const wb = Math.floor(ujut * (fr.bays - 1)), top = (fr.floors - 1) * fr.fh + 2.45;
      washing(G, F, -hw + wb * fr.bw + 0.3, -hw + (wb + 2) * fr.bw - 0.3, Math.min(h.h - 0.5, top), Math.min(0.75, room - 0.1), r2);
    }
  }
  return codes;
}
