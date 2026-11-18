// bridges-of-marigold, the city: THE OPEN ROOFS UNDER THE SET-BACKS. Where the deal bites a set-back into a stack, the
// roofs just under it lie open (house.deck: metres of open roof, counted back from the house's own front). On each
// flat one stream 'decks' deals a roof terrace: an iron railing or a low painted parapet, pots of marigolds, and some
// of: a pergola under striped cloth, a small tiled dome on a drum, a belfry, a lamp on a post, a short string of
// coloured lamps or a line of cut-paper flags between two posts, a stair of stone climbing along the set-back wall. Tiled roofs are left to show.
// Everything stands on the house's own roof, inside its outline (so inside the plan's radius) and under 6.5 m high.
import { frame, boxF, dome, steps, cupola, belfry, flagLine } from './bridges-of-marigold-city-shapes.js';

const IRON = [0.07, 0.07, 0.1], TIMBER = [0.3, 0.17, 0.08], POT = [0.5, 0.2, 0.09], STONE = [0.34, 0.3, 0.4], WHITE = [0.7, 0.66, 0.58];
const CLOTH = [[0.85, 0.1, 0.4], [0.95, 0.9, 0.8], [0.05, 0.6, 0.6], [0.95, 0.7, 0.1], [0.1, 0.2, 0.75], [0.55, 0.2, 0.8], [0.9, 0.2, 0.1], [0.5, 0.8, 0.15]];
const LAMPS = [[0.2, 0.9, 0.8], [1, 0.25, 0.6], [1, 0.6, 0.15], [0.65, 0.4, 1], [0.6, 0.95, 0.25]];
const TILE_A = [0.85, 0.6, 0.08], TILE_B = [0.06, 0.16, 0.55], TILE_C = [0.75, 0.72, 0.62], TILE_D = [0.1, 0.5, 0.45];

function pot(G, q, r) {
  G.col(POT).aux(1, 0.6).prism(q[0], q[2], q[1], q[1] + r * 1.3, r * 0.7, r, 6, 0, false);
  dome(G, q[0], q[1] + r * 1.3, q[2], r * 1.2, r * 1.1, 6, 2, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, 0.45);
}

export async function layDecks(G, houses, rngFor, paintOf, pause) {
  const rng = rngFor('decks'); let count = 0;
  for (let i = 0; i < houses.length; i++) {
    const h = houses[i];
    if (!(h.deck > 0)) continue;
    const uRail = rng(), uWhat = rng(), uSide = rng(), uLamp = rng(), uStair = rng(), uString = rng(), uPots = rng(), uCol = rng();
    if (h.tiled) continue;
    if (++count % 8 === 0) await pause();
    const fx = h.x + (h.d / 2) * Math.sin(h.yaw), fz = h.z + (h.d / 2) * Math.cos(h.yaw), F = frame(fx, h.y + h.h, fz, h.yaw);
    const hw = h.w / 2 - 0.25, zb = -Math.min(h.deck, h.d - 1) + 0.45, zf = -0.2, sd = uSide < 0.5 ? -1 : 1, r2 = rngFor('decks:' + i);
    // the edge: an iron railing, or a low parapet of the house's own paint with a pale coping
    if (uRail < 0.5) {
      const up = (p) => [p[0], p[1] + 1, p[2]], a = F.p(-hw, 0, zf), b = F.p(hw, 0, zf), c = F.p(hw, 0, zb), d = F.p(-hw, 0, zb);
      G.col(IRON).aux(8, a[1]); for (const [p, q] of [[a, b], [b, c], [d, a]]) { G.quad(p, q, up(q), up(p)); G.quad(q, p, up(p), up(q)); }
    } else {
      G.col(paintOf(h)).aux(1, 0.6); boxF(G, F, 0, 0, zf - 0.12, 2 * hw, 0.8, 0.26, false);
      for (const s of [-1, 1]) boxF(G, F, s * hw, 0, (zf + zb) / 2, 0.26, 0.8, zf - zb, false);
      G.col(WHITE).aux(1, 0.7); boxF(G, F, 0, 0.8, zf - 0.12, 2 * hw + 0.1, 0.1, 0.36, true);
    }
    const nP = 2 + Math.floor(uPots * 3.99);
    for (let j = 0; j < nP; j++) pot(G, F.p(-hw + 0.6 + (j + r2() * 0.5) * ((2 * hw - 1.2) / nP), 0, zf - 0.55), 0.26 + r2() * 0.16);
    const deep = zf - zb;
    if (uWhat < 0.26 && deep > 2.6) {
      // a pergola under striped cloth
      const x0 = sd * hw * 0.35 - 1.6, x1 = x0 + 3.2, z0 = zf - 0.5, z1 = Math.max(zb + 0.3, z0 - 2.4), a = CLOTH[Math.floor(uCol * CLOTH.length)], b = CLOTH[Math.floor(r2() * CLOTH.length)];
      G.col(TIMBER).aux(7, 0.6);
      for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) G.beam(F.p(x, 0, z), F.p(x, 2.4, z), 0.13);
      G.beam(F.p(x0, 2.4, z0), F.p(x1, 2.4, z0), 0.11); G.beam(F.p(x0, 2.4, z1), F.p(x1, 2.4, z1), 0.11);
      for (let j = 0; j < 4; j++) {
        const xa = x0 + (j * (x1 - x0)) / 4, xb = xa + (x1 - x0) / 4;
        G.col(j % 2 ? a : b).aux(1, 0.75).quad(F.p(xa, 2.46, z0), F.p(xb, 2.46, z0), F.p(xb, 2.46, z1), F.p(xa, 2.46, z1));
        G.col(j % 2 ? a : b).aux(1, 1.1).quad(F.p(xb, 2.44, z0), F.p(xa, 2.44, z0), F.p(xa, 2.44, z1), F.p(xb, 2.44, z1));
      }
    } else if (uWhat < 0.5 && deep > 3.4) {
      // a small dome of glazed tiles on a drum with lit slits
      const r = Math.min(2.1, deep / 2 - 0.25), q = F.p(sd * (hw - r - 0.5), 0, (zf + zb) / 2), two = uCol < 0.5;
      cupola(G, q[0], q[1], q[2], r, h.yaw, two ? TILE_A : TILE_C, two ? TILE_B : TILE_D, WHITE);
    } else if (uWhat < 0.66 && deep > 3) {
      // a belfry: a square tower with an open lit arch in each face under a tiled cap
      const q = F.p(sd * (hw - 1.6), 0, (zf + zb) / 2);
      belfry(G, frame(q[0], q[1], q[2], h.yaw), 2.2, 4.4, paintOf(h).map((v) => v * 0.8 + 0.12));
    }
    if (uLamp < 0.34) {
      const q = F.p(-sd * (hw - 0.5), 0, zf - 0.45), c = LAMPS[Math.floor(uCol * LAMPS.length)];
      G.col(IRON).aux(7, 0.5).beam(q, [q[0], q[1] + 2.5, q[2]], 0.13);
      G.col(c).aux(2, 3.2).prism(q[0], q[2], q[1] + 2.5, q[1] + 2.95, 0.17, 0.26, 5, 0, true, true);
    }
    if (uString < 0.3 && 2 * hw > 5) {
      // between two posts along the front: a short string of coloured lamps, or (every other one) a line of cut-paper flags
      const a = F.p(-hw + 0.3, 2.6, zf - 0.3), b = F.p(hw - 0.3, 2.6, zf - 0.3), n = 7;
      G.col(IRON).aux(7, 0.5).beam([a[0], a[1] - 2.6, a[2]], a, 0.11); G.beam([b[0], b[1] - 2.6, b[2]], b, 0.11);
      if (i % 2) { flagLine(G, a, b, Math.max(3, Math.floor((2 * hw - 0.6) / 1.1)), 0.4, 0.8, 0.62, CLOTH, i); continue; }
      const mid = [(a[0] + b[0]) / 2, a[1] - 0.5, (a[2] + b[2]) / 2]; G.beam(a, mid, 0.05); G.beam(mid, b, 0.05);      // (the cord the lamps hang on)
      for (let j = 1; j <= n; j++) { const s = j / (n + 1), sag = 0.5 * 4 * s * (1 - s), x = a[0] + (b[0] - a[0]) * s, z = a[2] + (b[2] - a[2]) * s; G.col(LAMPS[(j + i) % LAMPS.length]).aux(2, 3.4).prism(x, z, a[1] - sag - 0.12, a[1] - sag + 0.12, 0.1, 0.1, 4, 0, true, true); }
    }
    if (uStair < 0.22 && deep > 1.8 && 2 * hw > 6) {
      const St = F.sub(-sd * (hw - 0.3), 0, zb + 0.75, sd > 0 ? -Math.PI / 2 : Math.PI / 2);
      G.col(STONE).aux(0, 0.55); steps(G, St, 11, 1.1, 0.28, 0.32);
    }
  }
}
