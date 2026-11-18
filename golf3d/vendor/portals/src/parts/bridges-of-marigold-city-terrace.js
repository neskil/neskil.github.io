// bridges-of-marigold, the city: THE TERRACES. (1) The two landings of the canyon bridge: a door of the great tower on
// its north face and a side terrace cut into ring tower 4, each a tiled floor under a broad stone arch that frames
// the bridge's end, with a lit door and windows in the wall behind. (2) Tower 7's roof terrace, the market on the
// roof: a tiled deck with a parapet (open to the south, where the high bridge springs), its tiles running through
// from rim to rim (no petals are laid on this floor: the petals are the bridges'), an aisle down its middle between
// two rows of stalls under striped awnings with heaps of marigolds and fruit, pots, lamps on poles, a fountain,
// candles, strings of lamps, stair heads. Nothing on it stands more than 3.7 m over the deck (the flown line passes
// 14 m over it).
// Stream 'terrace' deals the stalls' colours, wares and small turns; every place keeps inside the plan's radius.
import { TOWERS, towerRadius, CANYON_BRIDGE, canyonBridge, HIGH_BRIDGE } from './bridges-of-marigold-plan.js';
import { frame, boxF, archWall, dome, parapet, litPane, flagLine } from './bridges-of-marigold-city-shapes.js';
import { CORE } from './bridges-of-marigold-city-stone.js';

const STONE = [0.3, 0.27, 0.38], STONE_B = [0.4, 0.35, 0.46], FLOOR = [0.5, 0.2, 0.1], PANE = [1, 0.6, 0.24], DARK = [0.16, 0.1, 0.12];
const WOOD = [0.3, 0.17, 0.08], POT = [0.5, 0.2, 0.09];
const CLOTH = [[0.85, 0.1, 0.4], [0.95, 0.9, 0.8], [0.05, 0.6, 0.6], [0.95, 0.7, 0.1], [0.1, 0.2, 0.75], [0.55, 0.2, 0.8], [0.9, 0.2, 0.1], [0.5, 0.8, 0.15]];
const FRUIT = [[0.9, 0.12, 0.08], [0.95, 0.75, 0.1], [0.4, 0.7, 0.1], [0.75, 0.15, 0.45], [0.95, 0.45, 0.1]];

// A landing of the canyon bridge on tower k: s is 0 (the great tower's end) or 1 (tower 4's).
export function layLanding(G, k, s) {
  const t = TOWERS[k], L = canyonBridge(s), half = CANYON_BRIDGE.width / 2, yaw = Math.atan2(L[0] - t.x, L[2] - t.z);
  const F = frame(t.x, L[1], t.z, yaw), R = towerRadius(k, L[1] + 12.5) - 0.25, R0 = towerRadius(k, L[1]) - 0.2;
  const zLip = Math.sqrt(R0 * R0 - (half + 0.2) * (half + 0.2)), pierOut = half + 2.4, zArch = Math.sqrt(R * R - pierOut * pierOut) - 0.2, zBack = Math.max(zArch - 9.5, towerRadius(k, L[1]) - CORE + 1.6), top = 11.8;
  G.col(STONE).aux(0, 0.5); boxF(G, F, 0, -0.7, (zLip + zBack) / 2, 2 * half + 0.4, 0.7, zLip - zBack, true);
  G.col(FLOOR).aux(4, 1); G.quad(F.p(-half, 0.02, zLip), F.p(half, 0.02, zLip), F.p(half, 0.02, zBack), F.p(-half, 0.02, zBack));
  const A = F.sub(0, 0, zArch);
  G.col(STONE_B).aux(0, 0.85); archWall(G, A, half + 0.2, 4.4, top, 1.8, 12);
  for (const sd of [-1, 1]) {
    G.col(STONE).aux(0, 0.7); boxF(G, A, sd * (half + 1.3), -0.7, -0.9, 2.2, top + 0.7, 1.8);
    G.col(STONE_B).aux(0, 0.8); boxF(G, A, sd * (half + 1.3), 4.1, -0.9, 2.5, 0.45, 2.1);
    G.col(STONE).aux(0, 0.45); boxF(G, F, sd * (pierOut + 1.9), -0.7, zArch - 3.4, 3.8, top + 0.7, 1.2);      // a wing wall either side
    litPane(G, F.sub(sd * (pierOut + 1.9), 0, zArch - 2.8), 0, 5.2, 1.3, 2.3, PANE, 1.3, DARK, true);
    G.col(STONE).aux(0, 0.9); boxF(G, F, sd * (half + 0.1), 0, (zArch + zBack) / 2 - 0.9, 0.5, top, zArch - zBack - 1.8);   // the side walls within
  }
  const B = F.sub(0, 0, zBack);
  G.col(STONE).aux(0, 1.2); boxF(G, B, 0, 0, -0.5, 2 * half + 0.6, top, 1);
  G.col(STONE).aux(0, 0.5); boxF(G, F, 0, top - 0.5, (zArch + zBack) / 2 - 0.9, 2 * half + 0.6, 0.5, zArch - zBack - 1.8);   // the ceiling
  litPane(G, B, 0, 0, 3.4, 4.6, [1, 0.66, 0.3], 1.6, DARK, true);
  for (const sx of [-4.6, 4.6]) { litPane(G, B, sx, 1.2, 1.4, 2.6, PANE, 1.25, DARK, true); litPane(G, B, sx, 7, 1.2, 1.8, PANE, 1.1, DARK, false); }
}

// one market stall at the frame's origin, its front toward the frame's +z: a table of wares under a striped awning
function stall(G, F, rng) {
  const w = 2.8 + rng() * 0.8, a = CLOTH[Math.floor(rng() * CLOTH.length)], b = CLOTH[Math.floor(rng() * CLOTH.length)], hgt = 2.5 + rng() * 0.5;
  G.col(WOOD).aux(1, 0.7); boxF(G, F, 0, 0, 0, w, 0.95, 1.2, false);
  for (const sx of [-1, 1]) { G.beam(F.p(sx * w / 2, 0, -0.7), F.p(sx * w / 2, hgt + 0.5, -0.7), 0.13); G.beam(F.p(sx * w / 2, 0, 1), F.p(sx * w / 2, hgt - 0.1, 1), 0.13); }
  const n = 6, x0 = -w / 2 - 0.3, dx = (w + 0.6) / n;
  for (let i = 0; i < n; i++) {                              // the awning in stripes, and its underside
    const xa = x0 + i * dx, xb = xa + dx;
    G.col(i % 2 ? a : b).aux(1, 0.75).quad(F.p(xa, hgt, 1.5), F.p(xb, hgt, 1.5), F.p(xb, hgt + 0.7, -0.9), F.p(xa, hgt + 0.7, -0.9));
    G.quad(F.p(xa, hgt - 0.35, 1.5), F.p(xb, hgt - 0.35, 1.5), F.p(xb, hgt, 1.5), F.p(xa, hgt, 1.5));
    G.col(i % 2 ? a : b).aux(1, 1.1).quad(F.p(xb, hgt - 0.02, 1.5), F.p(xa, hgt - 0.02, 1.5), F.p(xa, hgt + 0.68, -0.9), F.p(xb, hgt + 0.68, -0.9));
  }
  const m = 3;
  for (let i = 0; i < m; i++) {                              // the wares: heaps of marigolds, fruit in heaps, a crate
    const q = F.p((i - 1) * w * 0.3, 0.95, 0.05), u = rng(), r = 0.36 + rng() * 0.14;
    if (u < 0.45) { G.col([1, 0.5, 0.05]); dome(G, q[0], q[1], q[2], r, r * 0.9, 7, 2, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, 0.5); }
    else if (u < 0.85) { const c = FRUIT[Math.floor(rng() * FRUIT.length)], c2 = FRUIT[Math.floor(rng() * FRUIT.length)]; dome(G, q[0], q[1], q[2], r, r * 0.8, 8, 2, c, c2, 1, 0.9); }
    else { G.col(WOOD).aux(1, 0.6).box(q[0], q[1], q[2], 0.7, 0.4, 0.5, F.yaw + rng(), false); }
  }
  const lp = F.p(0, hgt - 0.5, 0.4); G.col([1, 0.78, 0.4]).aux(2, 3).prism(lp[0], lp[2], lp[1], lp[1] + 0.3, 0.16, 0.12, 6, 0, true, true);   // a lamp under the awning
}

function pot(G, x, y, z, r, bloom) {
  G.col(POT).aux(1, 0.6).prism(x, z, y, y + r * 1.3, r * 0.7, r, 7, 0, false);
  dome(G, x, y + r * 1.3, z, r * 1.15, r * (bloom ? 1.1 : 0.5), 7, 2, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, bloom ? 0.45 : 0.2);
}

function lampPost(G, x, y, z, h, col) {
  G.col([0.08, 0.07, 0.1]).aux(7, 0.5).beam([x, y, z], [x, y + h, z], 0.16);
  G.col(col).aux(2, 3.4).prism(x, z, y + h, y + h + 0.5, 0.2, 0.3, 6, 0, true, true);
  G.col([0.08, 0.07, 0.1]).aux(1, 0.5).prism(x, z, y + h + 0.5, y + h + 0.75, 0.36, 0.04, 6, 0, false);
}

// a tiled fountain: an eight-sided basin of blue and white tiles, lit water in it, a stem and an upper bowl
function fountain(G, x, y, z) {
  const p = (a, r, yy) => [x + r * Math.sin(a), yy, z + r * Math.cos(a)], WHITE = [0.82, 0.78, 0.7];
  for (let j = 0; j < 8; j++) {
    const a0 = j * Math.PI / 4, a1 = a0 + Math.PI / 4;
    G.col(j % 2 ? [0.08, 0.2, 0.6] : WHITE).aux(1, 0.9).quad(p(a0, 2.4, y), p(a1, 2.4, y), p(a1, 2.4, y + 0.75), p(a0, 2.4, y + 0.75));
    G.col(WHITE).aux(1, 0.9).quad(p(a0, 2.05, y + 0.75), p(a0, 2.4, y + 0.75), p(a1, 2.4, y + 0.75), p(a1, 2.05, y + 0.75));
  }
  G.col([0.2, 0.75, 0.8]).aux(2, 0.7).prism(x, z, y + 0.55, y + 0.56, 2.06, 2.05, 8, 0, true);
  G.col(STONE_B).aux(0, 0.8).prism(x, z, y, y + 1.9, 0.35, 0.28, 6, 0, false);
  G.col(WHITE).aux(1, 0.9).prism(x, z, y + 1.9, y + 2.25, 0.3, 1.1, 8, 0, false, true);
  G.col([0.2, 0.75, 0.8]).aux(2, 0.9).prism(x, z, y + 2.2, y + 2.21, 1.0, 0.99, 8, 0, true);
}
// a string of small lamps on a cord from a to b, their colours taken in turn
function lampString(G, a, b, n, sag, cols, first) {
  const at = (s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s - sag * 4 * s * (1 - s), a[2] + (b[2] - a[2]) * s];
  G.col([0.2, 0.18, 0.2]).aux(7, 0.5);
  for (let i = 0; i < 4; i++) G.beam(at(i / 4), at((i + 1) / 4), 0.06);
  for (let i = 0; i < n; i++) { const q = at((i + 0.5) / n); G.col(cols[(i + first) % cols.length]).aux(2, 2.6).prism(q[0], q[2], q[1] - 0.3, q[1] - 0.04, 0.09, 0.14, 4, 0, true, true); }
}

// Tower 7's roof terrace (the deck stands on the plan's `top`; its rim keeps 0.4 m inside the radius there).
export function layRoofTerrace(G, rngFor) {
  const rng = rngFor('terrace'), t = TOWERS[7], y0 = t.top, y = y0 + 0.3, Rd = towerRadius(7, y0 + 0.01) - 0.4, n = 28, TAU = Math.PI * 2;
  G.col(STONE).aux(0, 0.35).prism(t.x, t.z, y0, y, Rd, Rd, n, 0, false, false);
  // its underside: a great sun of tiles drawn by the stone material (kind 11) on stone corbels, a lantern hung
  // between each two (the lead's leave: under the deck out to 22 m from the axis; none where the high bridge springs)
  G.col([1, 1, 1]).aux(11, 0).prism(t.x, t.z, y0, y0, Rd, Rd, n, 0, false, true);
  for (let i = 0; i < 2 * n; i++) {
    const a = (i + 0.5) * TAU / (2 * n), s = Math.sin(a), c = Math.cos(a);
    if (Math.abs(a - Math.PI) > Math.PI - 0.55) continue;
    if (i % 2) G.col(STONE_B).aux(0, 0.5).beam([t.x + (Rd - 0.35) * s, y0 - 0.02, t.z + (Rd - 0.35) * c], [t.x + (Rd - 3.4) * s, y0 - 2.6, t.z + (Rd - 3.4) * c], 0.55);
    else {
      const q = [t.x + (Rd - 1.4) * s, y0, t.z + (Rd - 1.4) * c];
      G.col([0.1, 0.09, 0.12]).aux(1, 0.5).beam(q, [q[0], y0 - 1.3, q[2]], 0.25);
      G.col([1, 0.72, 0.36]).aux(2, 2.8).prism(q[0], q[2], y0 - 1.95, y0 - 1.3, 0.3, 0.4, 6, 0, true, true);
    }
  }
  G.col(FLOOR).aux(4, 1).prism(t.x, t.z, y, y + 0.02, Rd, Rd - 0.02, n, 0, true, false);
  // the parapet round the rim, open to the south where the high bridge springs
  const gap = Math.asin((HIGH_BRIDGE.width / 2 + 0.9) / (Rd - 0.5)), m = 22, a0 = gap, a1 = TAU - gap, rim = (a) => [t.x + (Rd - 0.5) * Math.sin(a), y, t.z + (Rd - 0.5) * Math.cos(a)];
  for (let i = 0; i < m; i++) parapet(G, rim(a0 + (a1 - a0) * i / m), rim(a0 + (a1 - a0) * (i + 1) / m), 1.0, 0.4, 9, STONE, STONE_B, 0, 0.55);
  for (const sd of [-1, 1]) {                                 // two gate piers with lanterns where the bridge springs
    const q = rim(sd * gap);
    G.col(STONE_B).aux(0, 0.8).box(q[0], y, q[2], 1.1, 2.9, 1.1, 0, false);
    G.col([1, 0.75, 0.38]).aux(2, 3.2).prism(q[0], q[2], y + 2.9, y + 3.45, 0.3, 0.4, 6, 0, true, true);
  }
  // the aisle down the middle, from the heart of the terrace to the bridge's head: the deck's own tiles, and nothing
  // laid on them (zA is the aisle's head and hw its half width; the fountain and the candles below stand by them)
  const zA = t.z - 15.5, hw = 1.7;
  // stalls: two rows facing the aisle, two more behind them facing in; lamps on poles between; heaps and pots
  const LAMPS = [[1, 0.75, 0.4], [0.2, 0.9, 0.8], [1, 0.25, 0.6], [0.6, 0.95, 0.25], [0.65, 0.4, 1], [1, 0.6, 0.2]];
  for (const sd of [-1, 1]) {
    for (let j = 0; j < 6; j++) {
      const z = t.z - 14.6 + j * 5.6, turn = (rng() - 0.5) * 0.24;
      stall(G, frame(t.x + sd * 6.4, y, z, -sd * Math.PI / 2 + turn), rng);
      lampPost(G, t.x + sd * 2.9, y, z + 2.8, 2.75, LAMPS[(j + (sd > 0 ? 3 : 0)) % LAMPS.length]);
      if (sd > 0) flagLine(G, [t.x - 2.9, y + 3.45, z + 2.8], [t.x + 2.9, y + 3.45, z + 2.8], 5, 0.4, 0.8, 0.6, CLOTH, j);      // (cut-paper flags from lamp to lamp across the aisle)
      const hr = 0.5 + rng() * 0.5; dome(G, t.x + sd * (2.2 + rng() * 0.5), y, z + 0.3 + rng(), hr, hr * 0.7, 7, 2, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, 0.4);
    }
    for (let j = 0; j < 4; j++) {
      const z = t.z - 8 + j * 5.4, turn = (rng() - 0.5) * 0.3;
      stall(G, frame(t.x + sd * 13.4, y, z, -sd * Math.PI / 2 + turn), rng);
    }
    // a stair head: a small house over the stairs that come up from below, its lit door toward the aisle
    const S = frame(t.x + sd * 12.6, y, t.z + (sd > 0 ? 13.6 : -13.2), -sd * Math.PI / 2);
    G.col(sd > 0 ? [0.1, 0.5, 0.55] : [0.7, 0.2, 0.4]).aux(1, 0.6); boxF(G, S, 0, 0, 0, 3.4, 2.9, 3, false);
    G.col([0.5, 0.19, 0.08]).aux(4, 0); boxF(G, S, 0, 2.9, 0, 3.9, 0.3, 3.5, true);
    litPane(G, S.sub(0, 0, 1.5), 0, 0, 1.3, 2.05, PANE, 1.7, DARK, true);
    for (const o of [-2.6, 2.6]) { const q = S.p(o, 0, 1.2); pot(G, q[0], q[1], q[2], 0.5, true); }
  }
  // the fountain at the aisle's head; candles along the aisle; strings of lamps from the lamp posts out to poles at the
  // rim; crates heaped with fruit and bread between the rows of stalls
  fountain(G, t.x, y, zA - 1.0);
  for (const sd of [-1, 1]) {
    for (let j = 0; j < 38; j++) G.col([1, 0.8, 0.45]).aux(2, 2.2).box(t.x + sd * (hw + 0.3), y + 0.02, zA + 0.5 + j * 0.92, 0.12, 0.28, 0.12, 0, false);
    for (let j = 0; j < 6; j++) {
      const z = t.z - 14.6 + j * 5.6 + 2.8, xe = Math.sqrt(Math.max(9, (Rd - 1.1) * (Rd - 1.1) - (z - t.z) * (z - t.z)));
      G.col(DARK).aux(1, 0.5).beam([t.x + sd * xe, y, z], [t.x + sd * xe, y + 3.6, z], 0.25);
      lampString(G, [t.x + sd * 2.9, y + 3.5, z], [t.x + sd * xe, y + 3.55, z], 8, 0.45, LAMPS, j);
    }
    for (let j = 0; j < 5; j++) {
      const q = [t.x + sd * 9.9, y, t.z - 10.5 + j * 5.4], c = [[0.9, 0.15, 0.1], [0.95, 0.75, 0.1], [0.72, 0.5, 0.25], [0.45, 0.75, 0.15], [0.85, 0.4, 0.1]][(j + (sd > 0 ? 2 : 0)) % 5];
      G.col([0.36, 0.22, 0.1]).aux(1, 0.6).box(q[0], q[1], q[2], 1.1, 0.55, 0.8, 0.3 * j, false);
      dome(G, q[0], q[1] + 0.55, q[2], 0.5, 0.42, 6, 2, c, c.map((v) => v * 0.8), 1, 1.1);
    }
  }
  for (let i = 1; i < m; i += 2) { const a = a0 + (a1 - a0) * i / m, r = Rd - 1.7; pot(G, t.x + r * Math.sin(a), y, t.z + r * Math.cos(a), 0.42 + rng() * 0.16, rng() < 0.8); }
  for (const [dx, dz, r] of [[-4.6, -17.6, 1.5], [4.4, -17.9, 1.3], [-9.6, 16.4, 1.4], [9.8, 16.2, 1.6], [0, -17, 1.1]]) dome(G, t.x + dx, y, t.z + dz, r, r * 0.62, 9, 3, [1, 0.5, 0.05], [1, 0.5, 0.05], 3, 0.45);
}
