// bridges-of-marigold, the city: THE SKYLINE OF THE RING TOWERS, made to read from far off. Round each ring tower run
// two or three great terrace rings (their heights: city-deal's terraceRings): a deck that hangs out over the houses
// below wherever the leave lets it (city-place), carried on stone brackets; on its rim an arcade of piers and round
// arches with a lantern in each arch; behind, a lamp-lit wall of painted fronts with a lit door in each bay; over the
// walk a flat tiled roof. And each ring tower ends in a crown of its own, on a round house at the middle of its top:
// a great tiled dome, a belfry among four small domes, a crane, a walled garden of trees, a cluster of little towers
// with pennants, a dome among four small ones. Stream 'skyline' deals which tower gets which, and their small sizes.
import { TOWERS, towerRadius } from './bridges-of-marigold-plan.js';
import { leave, DRUM } from './bridges-of-marigold-city-place.js';
import { terraceRings } from './bridges-of-marigold-city-deal.js';
import { frame, boxF, archWall, dome, cupola, belfry, litPane } from './bridges-of-marigold-city-shapes.js';
import { mast, arm } from './bridges-of-marigold-city-crown.js';

const STONE = [0.34, 0.3, 0.4], PALE = [0.62, 0.56, 0.5], DARK = [0.06, 0.05, 0.1], PANE = [1, 0.6, 0.24];
const WALLS = [[0.8, 0.45, 0.25], [0.75, 0.3, 0.38], [0.3, 0.55, 0.6], [0.78, 0.62, 0.3], [0.5, 0.38, 0.7]];
const TILE_A = [0.85, 0.6, 0.08], TILE_B = [0.06, 0.16, 0.55], TILE_C = [0.1, 0.5, 0.45], TILE_D = [0.8, 0.76, 0.66];
const HANG = 4.6, WALK = 3.5;              // how far a terrace ring hangs out, how high its arcade stands

// One terrace ring of tower k with its deck's top at yR.
function terrace(G, k, yR, turn) {
  const t = TOWERS[k], R = towerRadius(k, yR + WALK), n = Math.max(12, Math.round(Math.PI * 2 * (R + HANG) / 5.2)), da = Math.PI * 2 / n;
  const at = (a, r, y) => [t.x + r * Math.sin(a), y, t.z + r * Math.cos(a)];
  const free = (a) => { const p = at(a, R + HANG + 0.6, 0); return leave(p[0], p[2], 1) > 0; };
  const ri = R - 0.12, ro = R + HANG, yb = yR - 0.5, yt = yR + WALK;
  for (let i = 0; i < n; i++) {
    const a0 = turn + i * da, a1 = a0 + da, am = a0 + da / 2;
    if (!(free(a0) && free(am) && free(a1))) continue;
    // the deck and the roof over the walk: top, underside, rim
    for (const [y0, y1, top, v] of [[yb, yR, STONE, 0.45], [yt, yt + 0.4, [0.5, 0.19, 0.08], 0.2]]) {
      G.col(top).aux(y0 === yb ? 0 : 4, y0 === yb ? v : 0).quad(at(a0, ri, y1), at(a0, ro, y1), at(a1, ro, y1), at(a1, ri, y1));
      G.col(DARK).aux(1, 0.5).quad(at(a0, ri, y0), at(a1, ri, y0), at(a1, ro, y0), at(a0, ro, y0));
      G.col(PALE).aux(0, 0.6).quad(at(a0, ro, y0), at(a1, ro, y0), at(a1, ro, y1), at(a0, ro, y1));
    }
    // the lamp-lit wall of painted fronts behind the walk, a lit door in it
    G.col(WALLS[(i * 3 + k) % WALLS.length]).aux(1, 1.3).quad(at(a0, ri, yR), at(a1, ri, yR), at(a1, ri, yt), at(a0, ri, yt));
    const W = frame(t.x + (ri * Math.cos(da / 2) + 0.04) * Math.sin(am), yR, t.z + (ri * Math.cos(da / 2) + 0.04) * Math.cos(am), am);
    G.col(PANE).aux(2, 1.5).quad(W.p(-0.6, 0, 0), W.p(0.6, 0, 0), W.p(0.6, 2.2, 0), W.p(-0.6, 2.2, 0));
    // the arcade on the rim: a pier at the bay's first edge, a round arch to the next, a lantern hung in it
    const cho = ro * Math.cos(da / 2) - 0.06, half = ro * Math.sin(da / 2) - 0.5, F = frame(t.x + cho * Math.sin(am), yR, t.z + cho * Math.cos(am), am);
    const pq = at(a0, ro - 0.5, yR);
    G.col(PALE).aux(0, 0.8).box(pq[0], pq[1], pq[2], 0.95, WALK, 0.95, a0, false);
    G.col(STONE).aux(0, 0.75); archWall(G, F, half, WALK - 0.3 - half, WALK, 0.7, 4, false);
    const lq = F.p(0, WALK - 1.5, -0.4);
    G.col([1, 0.72, 0.36]).aux(2, 2.6).prism(lq[0], lq[2], lq[1], lq[1] + 0.55, 0.22, 0.3, 4, am, true, true);
    // a stone bracket under the deck at the bay's first edge
    G.col(STONE).aux(0, 0.3).beam(at(a0, ri + 0.1, yb - 2.6), at(a0, ro - 0.5, yb - 0.1), 0.45);
  }
}

// The terrace rings of one ring tower, or the one ring `only` of them (work file: a ring a step).
export function layTerraces(G, rngFor, k, only = -1) {
  const L = terraceRings(rngFor, k), rng = rngFor('skyline:' + k);
  L.forEach((yR, i) => { const turn = rng() * Math.PI; if (only < 0 || only === i) terrace(G, k, yR, turn); });
}

// a tree: a trunk, and a crown of leaves as a cone opening upward under a low dome
function tree(G, x, y, z, trunk, r, rot) {
  G.col([0.2, 0.12, 0.07]).aux(1, 0.5).beam([x, y, z], [x, y + trunk + 0.4, z], 0.45);
  G.col([0.05, 0.2, 0.09]).aux(1, 0.75).prism(x, z, y + trunk, y + trunk + 1.2, 0.5, r, 7, rot, false, true);
  dome(G, x, y + trunk + 1.2, z, r, r * 1.1, 7, 3, [0.08, 0.3, 0.1], [0.12, 0.38, 0.12], 1, 0.5);
}
// a little round tower under a pointed cap of tiles, a pole and a pennant on it
function turret(G, x, y, z, r, hgt, rot, tile, flag) {
  G.col(PALE).aux(1, 0.6).prism(x, z, y, y + hgt, r, r * 0.92, 8, rot, false);
  G.col(PANE).aux(2, 1.3).prism(x, z, y + hgt - 2.0, y + hgt - 1.1, r * 0.95 + 0.04, r * 0.94 + 0.04, 8, rot, false);      // (one lit band all round)
  G.col(tile).aux(4, 0).prism(x, z, y + hgt, y + hgt + 2.2, r * 1.2, 0.06, 8, rot, false, true);
  const p0 = [x, y + hgt + 2.1, z], p1 = [x, y + hgt + 3.6, z], s = Math.sin(rot), c = Math.cos(rot);
  G.col([0.3, 0.2, 0.12]).aux(1, 0.5).beam(p0, p1, 0.25);
  const q0 = [x, p1[1] - 0.05, z], q1 = [x, p1[1] - 0.75, z], q2 = [x + 1.7 * s, p1[1] - 0.4, z + 1.7 * c];
  G.col(flag).aux(6, 0.6).tri(q0, q1, q2); G.aux(6, -0.6).tri(q0, q2, q1);
}

// The crowns of the six ring towers.
export function layCrowns(G, rngFor) {
  const rng = rngFor('skyline'), kinds = [0, 1, 2, 3, 4, 5];
  for (let i = 5; i > 0; i--) { const j = Math.floor(rng() * (i + 1)), s = kinds[i]; kinds[i] = kinds[j]; kinds[j] = s; }
  for (let k = 1; k < TOWERS.length - 1; k++) {
    const t = TOWERS[k], x = t.x, z = t.z, y0 = t.top + 0.4, yaw = rng() * Math.PI, kind = kinds[k - 1], u = [rng(), rng(), rng(), rng(), rng(), rng()];
    const A = u[0] < 0.5 ? TILE_A : TILE_C, B = u[0] < 0.5 ? TILE_B : TILE_D, ap = DRUM * Math.cos(Math.PI / 16);
    // the round house that carries it: a cornice, lit arched windows round it
    G.col(PALE).aux(1, 0.6).prism(x, z, t.top - 15, y0 - 0.45, DRUM, DRUM, 16, yaw, false);
    G.col(STONE).aux(0, 0.6).prism(x, z, y0 - 0.45, y0, DRUM + 0.3, DRUM + 0.3, 16, yaw, true);
    for (let j = 0; j < 16; j++) { const a = yaw + (j + 0.5) * Math.PI / 8; litPane(G, frame(x + ap * Math.sin(a), t.top - 5.6, z + ap * Math.cos(a), a), 0, 0, 1.0, 2.3, PANE, 1.4, STONE, true); }      // (a window in every side: a row, never a pair)
    if (kind === 0 || kind === 5) {
      const r = kind === 0 ? 7.5 : 4.8, hd = kind === 0 ? 5.2 : 4.2;
      G.col(PALE).aux(1, 0.65).prism(x, z, y0, y0 + 2.4, r, r, 16, yaw, false);
      G.col(PANE).aux(2, 1.3).prism(x, z, y0 + 0.6, y0 + 1.8, r + 0.04, r + 0.04, 16, yaw, false);      // (one lit band all round, no single openings)
      dome(G, x, y0 + 2.4, z, r + 0.2, hd, 16, 5, A, B, 1, 0.6);
      cupola(G, x, y0 + 2.4 + hd - 0.3, z, 0.85, yaw, A, B, PALE);
      if (kind === 5) for (let j = 0; j < 4; j++) { const a = yaw + j * Math.PI / 2; cupola(G, x + 6.3 * Math.sin(a), y0, z + 6.3 * Math.cos(a), 1.7, a, B, A, PALE); }
    } else if (kind === 1) {
      belfry(G, frame(x, y0, z, yaw), 4.8, 9.5, [0.6, 0.36, 0.3]);
      for (let j = 0; j < 4; j++) { const a = yaw + (j + 0.5) * Math.PI / 2; cupola(G, x + 6 * Math.sin(a), y0, z + 6 * Math.cos(a), 1.2, a, A, B, PALE); }
    } else if (kind === 2) {
      G.col([0.85, 0.56, 0.06]).aux(7, 0.6); mast(G, x, z, y0, y0 + 5.85, 1.6, 0.36);
      arm(G, frame(x, y0 + 7.9, z, yaw), 12, 0.36);
      G.col([0.44, 0.28, 0.13]).aux(7, 0.55);
      for (let j = 0; j < 6; j++) { const a = yaw + j * Math.PI / 3, p = [x + 6.5 * Math.sin(a), y0, z + 6.5 * Math.cos(a)], q = [x + 6.5 * Math.sin(a + 1.05), y0, z + 6.5 * Math.cos(a + 1.05)]; G.beam(p, [p[0], y0 + 3.4, p[2]], 0.34); G.beam([p[0], y0 + 3.2, p[2]], [q[0], y0 + 3.2, q[2]], 0.28); }
    } else if (kind === 3) {
      G.col(PALE).aux(0, 0.6).prism(x, z, y0, y0 + 0.9, DRUM - 0.1, DRUM - 0.1, 16, yaw, false);
      tree(G, x, y0, z, 2.6 + u[1], 3.1, yaw);
      for (let j = 0; j < 7; j++) { const a = yaw + j * 0.8976 + u[2], rr = 4.9 + u[(j % 3) + 3]; tree(G, x + rr * Math.sin(a), y0, z + rr * Math.cos(a), 1.7 + 1.2 * u[(j + 1) % 6], 1.9 + 0.9 * u[(j + 2) % 6], a); }
      for (let j = 0; j < 5; j++) { const a = yaw + (j + 0.5) * 1.2566 + u[2], p = [x + 3 * Math.sin(a), y0, z + 3 * Math.cos(a)]; G.col(DARK).aux(1, 0.5).beam(p, [p[0], y0 + 2.4, p[2]], 0.25); G.col([1, 0.75, 0.4]).aux(2, 3).prism(p[0], p[2], y0 + 2.4, y0 + 2.95, 0.22, 0.32, 5, 0, true, true); }
    } else {
      turret(G, x, y0, z, 2.3, 5.6, yaw, [0.5, 0.19, 0.08], [0.9, 0.2, 0.35]);
      const flags = [[0.95, 0.7, 0.1], [0.1, 0.6, 0.6], [0.55, 0.2, 0.8], [0.9, 0.3, 0.1], [0.3, 0.7, 0.2]];
      for (let j = 0; j < 5; j++) { const a = yaw + j * 1.2566; turret(G, x + 5.6 * Math.sin(a), y0, z + 5.6 * Math.cos(a), 1.5, 2.6 + 2 * u[j], a, j % 2 ? [0.06, 0.16, 0.5] : [0.5, 0.19, 0.08], flags[j]); }
    }
  }
}
