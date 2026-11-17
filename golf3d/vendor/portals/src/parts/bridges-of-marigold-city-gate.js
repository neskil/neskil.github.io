// bridges-of-marigold, the city: THE GATE HOUSE AND ITS TERRACE (plan: GATE). Astride the great bridge's end stands a
// house of rose stone: two flanking towers under small tiled domes, between them one great round arch on the bridge's
// line inside a carved surround, a bell gable over it, a lamp-lit way through and a lit inner door at its far end; lit
// windows on every side, lanterns, marigolds heaped at its feet, lines of cut-paper flags (flowers, suns, leaves). The terrace before it has a parapet with piers on its three open sides, open where the bridge lands.
// Everything keeps inside the plan's GATE box (and the parapet on the foot's own outline). Nothing here is dealt.
import { GATE, GREAT_BRIDGE } from './bridges-of-marigold-plan.js';
import { frame, boxF, archWall, archBand, dome, parapet, litPane, flagLine } from './bridges-of-marigold-city-shapes.js';

const ROSE = [0.42, 0.25, 0.22], ROSE_PALE = [0.55, 0.36, 0.3], ROSE_DARK = [0.24, 0.13, 0.13], PANE = [1, 0.58, 0.22];
const TILE_A = [0.85, 0.6, 0.08], TILE_B = [0.06, 0.16, 0.55], FLOOR = [0.5, 0.2, 0.1];

export function layGateHouse(G) {
  const H = GATE.top - GATE.terraceY, D = GATE.z1 - GATE.z0, F = frame(0, GATE.terraceY, GATE.z1, 0);
  const a = GATE.archHalf, spring = GATE.archTop - GATE.terraceY - a, wallTop = H - 4, pw = GATE.half - a - 0.4, px = a + pw / 2;
  for (const sd of [-1, 1]) {
    // a flanking tower: its body, a cornice, a drum and a dome in gores
    G.col(ROSE).aux(0, 0.55); boxF(G, F, sd * px, 0, -(D + 5) / 2, pw, H - 2.6, D + 5);      // (it runs on 5 m into the tower behind)
    G.col(ROSE_PALE).aux(0, 0.7); boxF(G, F, sd * px, H - 3.1, -D / 2, pw + 0.5, 0.5, D - 0.1); boxF(G, F, sd * px, spring - 0.3, -D / 2, pw + 0.4, 0.45, D - 0.2);
    const c = F.p(sd * px, H - 2.6, -4.6);
    G.col(ROSE_PALE).aux(0, 0.6).prism(c[0], c[2], c[1], c[1] + 0.5, 3.3, 3.3, 10, 0, true);
    dome(G, c[0], c[1] + 0.5, c[2], 3.1, 1.7, 10, 4, TILE_A, TILE_B, 1, 0.55);
    G.col([0.9, 0.85, 0.7]).aux(1, 0.8).prism(c[0], c[2], c[1] + 2.15, c[1] + 2.55, 0.2, 0.05, 5, 0, false);
    // the way through: its wall lined with lamp-lit stone, a lit window high in each tower's front and flank
    G.col(ROSE_PALE).aux(0, 1.5); boxF(G, F, sd * (a - 0.03), 0, -D / 2, 0.1, spring, D - 0.2);
    for (const [ly, w, h] of [[4.2, 1.7, 2.6], [10.2, 1.5, 2.3], [15.6, 1.2, 1.7]]) {
      litPane(G, F, sd * px, ly, w, h, PANE, 1.5, ROSE_DARK, true);
      const S = frame(sd * (a + pw), GATE.terraceY, GATE.z1 - D / 2, sd * Math.PI / 2);
      for (const lx of [-4, 0, 4]) litPane(G, S, lx, ly, w * 0.8, h, PANE, lx === 0 ? 1.4 : 1.1, ROSE_DARK, ly < 12);
    }
  }
  // the tower's own stone behind the house, as wide as the gap the stacks leave for it and up to the lowest houses
  // over it: a wall with a string course and five lit windows, so that nothing dark shows over the gable or beside
  // the flanking towers
  {
    const back = D + 6.8, wide = 2 * (GATE.half + 6), W = F.sub(0, 0, -back);      // (so far back its corners keep the plan's radius)
    G.col(ROSE).aux(0, 0.45); boxF(G, F, 0, 0, -back - 0.5, wide, H + 6.2, 1, false);
    for (const [w, y, hgt] of [[wide, H + 6.2, 0], [wide - 10, H + 6.2, 2.2], [wide - 22, H + 8.4, 1.6]]) {      // its top: a gable in three steps
      if (hgt > 0) { G.col(ROSE).aux(0, 0.45); boxF(G, F, 0, y, -back - 0.5, w, hgt, 1, false); }
      G.col(ROSE_PALE).aux(0, 0.7); boxF(G, F, 0, y + hgt, -back - 0.45, w, 0.4, 1.2);
    }
    G.col(ROSE_PALE).aux(0, 0.6); boxF(G, F, 0, H + 0.6, -back + 0.15, wide, 0.45, 0.3);
    for (let i = -2; i <= 2; i++) litPane(G, W, i * 7.4, H + 2.2, 1.5, 2.6, PANE, 1.2, ROSE_DARK, true);
  }
  // the great arch and what stands on it: a string course, then a crest in three steps
  G.col(ROSE_PALE).aux(0, 0.95); archWall(G, F, a, spring, wallTop, D, 14);
  G.col(ROSE).aux(0, 0.7); boxF(G, F, 0, wallTop, -D / 2, 2 * a + 0.8, 0.5, D);
  // the bell gable over the arch: three round openings in a wall, a bell in each, a pale coping
  {
    const yb = wallTop + 0.5, B = F.sub(0, yb, -0.8), bw = 1.5, pier = 0.9, top = 2.75;
    for (let i = -1; i <= 1; i++) {
      const xc = i * (bw + pier), A = B.sub(xc, 0, 0);
      G.col(ROSE_PALE).aux(9, 0.8); archWall(G, A, bw / 2, 1.25, top, 1.1, 8);
      const q = A.p(0, 0.75, -0.55); dome(G, q[0], q[1], q[2], 0.5, 0.8, 6, 2, [0.42, 0.26, 0.08], [0.36, 0.22, 0.07], 1, 1.1);
      G.col([0.1, 0.07, 0.05]).aux(7, 0.5).beam([q[0], q[1] + 0.8, q[2]], A.p(0, 2, -0.55), 0.1);
    }
    G.col(ROSE).aux(9, 0.75);
    for (const sx of [-1.5, -0.5, 0.5, 1.5]) boxF(G, B, sx * (bw + pier), 0, -0.55, pier, top, 1.1, false);
    G.col([0.75, 0.6, 0.5]).aux(0, 0.85); boxF(G, B, 0, top, -0.55, 3 * bw + 4 * pier + 0.4, 0.3, 1.4, true);
    G.col(ROSE_PALE).aux(0, 0.8); boxF(G, B, 0, top + 0.3, -0.55, 2.6, 0.32, 1.1, false);
  }
  // the carved surround: two bands of carved stone round the arch on pilasters with capitals, and a keystone
  G.col([0.62, 0.42, 0.34]).aux(9, 1.05); archBand(G, F, a, a + 1.0, spring, 0.32, 16);
  G.col(ROSE).aux(9, 0.9); archBand(G, F, a + 1.0, a + 1.7, spring, 0.16, 16);
  for (const sd of [-1, 1]) {
    G.col([0.62, 0.42, 0.34]).aux(9, 1.05); boxF(G, F, sd * (a + 0.5), 0, 0.16, 1.0, spring, 0.32, false);
    G.col([0.75, 0.6, 0.5]).aux(0, 1.0); boxF(G, F, sd * (a + 0.5), spring - 0.5, 0.2, 1.3, 0.5, 0.4, true); boxF(G, F, sd * (a + 0.5), 0, 0.2, 1.3, 0.6, 0.4, false);
    // a lantern on a bracket either side of the arch, and marigolds heaped along the foot of each tower's front
    const lq = F.p(sd * (a + 2.6), 6.2, 0.75);
    G.col([0.08, 0.07, 0.1]).aux(7, 0.5).beam(F.p(sd * (a + 2.6), 7.1, 0.02), [lq[0], lq[1] + 0.9, lq[2]], 0.1); G.beam([lq[0], lq[1] + 0.9, lq[2]], [lq[0], lq[1] + 0.6, lq[2]], 0.06);
    G.col([1, 0.74, 0.38]).aux(2, 3.6).prism(lq[0], lq[2], lq[1], lq[1] + 0.6, 0.2, 0.3, 6, 0, true, true);
    for (let j = 0; j < 5; j++) { const r = 0.55 + 0.3 * ((j * 7 + (sd > 0 ? 3 : 0)) % 5) / 4, q = F.p(sd * (a + 2 + j * 1.55), 0, 0.75 + 0.2 * (j % 2)); dome(G, q[0], q[1], q[2], r, r * 0.7, 7, 2, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, 0.5); }
    for (let j = 0; j < 4; j++) { const q = F.p(sd * (a - 0.75), 0, -2 - j * 3.8); dome(G, q[0], q[1], q[2], 0.5, 0.4, 6, 2, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, 0.6); }
  }
  G.col([0.75, 0.6, 0.5]).aux(9, 1.1); boxF(G, F, 0, spring + a - 0.3, 0.2, 1.2, 1.9, 0.4, true);
  // a lantern hung in the crown of the arch, and lines of cut-paper flags across the front and down to the parapets
  {
    const c = F.p(0, spring + a - 0.05, -3), l = [c[0], c[1] - 2.6, c[2]];
    G.col([0.08, 0.07, 0.1]).aux(7, 0.5).beam(c, [l[0], l[1] + 0.9, l[2]], 0.07);
    G.col([1, 0.76, 0.4]).aux(2, 3.4).prism(l[0], l[2], l[1], l[1] + 0.9, 0.3, 0.45, 6, 0, true, true);
    const FLAGS = [[0.85, 0.1, 0.45], [0.05, 0.6, 0.62], [0.95, 0.72, 0.1], [0.5, 0.22, 0.8], [0.55, 0.85, 0.15], [0.92, 0.88, 0.8]];
    flagLine(G, F.p(-(a + 1.9), wallTop - 0.6, 0.45), F.p(a + 1.9, wallTop - 0.6, 0.45), 13, 1.5, 0.95, 0.75, FLAGS, 0);
    for (const sd of [-1, 1]) flagLine(G, F.p(sd * (GATE.half - 0.6), 9.5, 0.45), F.p(sd * 20.4, 1.9, GREAT_BRIDGE.z1 + 0.9 - GATE.z1), 9, 1.2, 0.9, 0.7, FLAGS, sd > 0 ? 2 : 4);
  }
  // (no petals are laid on this floor: the petals are the bridges' and end at the gate's sill)
  // the floor of the way through (tiles in a pattern of squares), and at its far end a wall with the lit inner door
  G.col(FLOOR).aux(4, 1); G.quad(F.p(-a, 0.03, 0.4), F.p(a, 0.03, 0.4), F.p(a, 0.03, -D - 2), F.p(-a, 0.03, -D - 2));
  const B = frame(0, GATE.terraceY, GATE.z0 - 2, 0);
  G.col(ROSE).aux(0, 1.3); boxF(G, B, 0, 0, -0.5, 2 * a + 4, H - 6, 1);
  litPane(G, B, 0, 0, 5.2, 6.4, [1, 0.66, 0.3], 1.7, ROSE_DARK, true);
  // (the lit door stands alone in this wall: no panes beside its head, so that door and panes can never read as a face)
}

// The parapet of the gate terrace: along its east and west sides and along its south side either hand of the bridge.
export function layTerraceRail(G) {
  const y = GATE.terraceY, x = 21.0, zN = GATE.z0 - 5.6, zS = GREAT_BRIDGE.z1 + 1.1, gap = GREAT_BRIDGE.width / 2 + 0.9;
  const col = [0.3, 0.27, 0.38], colB = [0.4, 0.35, 0.46];
  for (const sd of [-1, 1]) {
    parapet(G, [sd * x, y, zN], [sd * x, y, zS], 1.15, 0.5, 4.2, col, colB, 0, 0.45);
    parapet(G, [sd * x, y, zS], [sd * gap, y, zS], 1.15, 0.5, 3.8, col, colB, 0, 0.6);
  }
}
