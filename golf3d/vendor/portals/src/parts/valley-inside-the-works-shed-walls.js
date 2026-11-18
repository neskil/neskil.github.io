// valley-inside-the-works, THE SHED: the brick walls and what is fixed to them. Each wall is drawn in a frame of its
// own: local x runs along the wall, y up, z out of the wall into the hall (so one piece of drawing serves the left wall,
// the right wall, the head wall and the downstream wall).
import * as P from './valley-inside-the-works-plan.js';
import { KIND, LACE, PANE } from './valley-inside-the-works-shed-mats.js';
import { stair, door, STAIR_REACH } from './valley-inside-the-works-shed-stairs.js';

const S = P.SHED;
export const WALLS = {
  left: { O: [S.x0, 0, 0], E1: [0, 0, 1], E3: [1, 0, 0], a0: S.zHead, a1: S.zDown, at: (a, d) => [S.x0 + d, a] },
  right: { O: [S.x1, 0, 0], E1: [0, 0, 1], E3: [-1, 0, 0], a0: S.zHead, a1: S.zDown, at: (a, d) => [S.x1 - d, a] },
  head: { O: [0, 0, S.zHead], E1: [1, 0, 0], E3: [0, 0, 1], a0: S.x0, a1: S.x1, at: (a, d) => [a, S.zHead + d] },
  down: { O: [0, 0, S.zDown], E1: [1, 0, 0], E3: [0, 0, -1], a0: S.x0, a1: S.x1, at: (a, d) => [a, S.zDown - d] },
};
export const TOP = S.roofRidge + 0.5;
export function inFrame(mesh, W) { return mesh.frame(W.O, W.E1, [0, 1, 0], W.E3); }

export const GAL = 3.6;                       // the gallery's width out from the wall
export const RAILTINT = [0.52, 0.63, 0.7];    // the gallery iron's darker green, over the columns' sage
export function groundAt(W, a, d) { const q = W.at(a, d); return P.groundHeight(q[0], q[1]); }
// the plinth's flat top at the most: its chamfer, 0.3 m higher at the wall's face, then ends 0.4 m under the gallery's
// planks (0.2 m thick), however high the ground stands at the wall's foot
export const PLINTH_TOP = S.gallery - 0.9;
// the underside of a gallery bracket: [metres out from the wall, metres down from the bracket's top line], from its
// foot on the wall along the curved brace to its outer end
const BRACKET_UNDER = [[0.05, 3.2], [0.35, 2.9], [0.8, 1.6], [1.5, 0.85], [2.4, 0.4], [3.25, 0.27]];

// a tall round-headed window in its stone dressings: glass 8 m wide, sill at y 35.6, springing 8.5 m above it
function wallWindow(kit, ac, tone) {
  const { solid, glass } = kit, hw = 4, sill = 35.6, spr = sill + 8.5, n = 12, D = 0.28, ro = hw + 0.55;
  const pts = [[ac - hw, sill, 0.1], [ac + hw, sill, 0.1]];
  for (let i = 0; i <= n; i++) { const t = Math.PI * i / n; pts.push([ac + hw * Math.cos(t), spr + hw * Math.sin(t), 0.1]); }
  glass.set({ kind: PANE.wall, w: tone, col: [1, 1, 1] });
  glass.poly(pts, pts.map((q) => [q[0] - ac, q[1] - sill]));
  solid.set({ kind: KIND.ashlar, w: 0.75, col: [1, 1, 1] });
  solid.box(ac - ro, ac - hw, sill, spr, 0, D, 'kdu');
  solid.box(ac + hw, ac + ro, sill, spr, 0, D, 'kdu');
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI * i / n, t1 = Math.PI * (i + 1) / n, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    const u0 = t0 * ro * 3, u1 = t1 * ro * 3;
    solid.quad([ac + hw * c0, spr + hw * s0, D], [ac + ro * c0, spr + ro * s0, D], [ac + ro * c1, spr + ro * s1, D], [ac + hw * c1, spr + hw * s1, D], [[u0, 0.1], [u0, 0.7], [u1, 0.7], [u1, 0.1]]);
    solid.quad([ac + ro * c0, spr + ro * s0, D], [ac + ro * c0, spr + ro * s0, 0], [ac + ro * c1, spr + ro * s1, 0], [ac + ro * c1, spr + ro * s1, D], [[u0, 0.1], [u0, 0.4], [u1, 0.4], [u1, 0.1]]);
  }
  solid.box(ac - ro - 0.3, ac + ro + 0.3, sill - 0.55, sill, 0, 0.5, 'k');
  solid.box(ac - 0.45, ac + 0.45, spr + hw - 0.1, spr + hw + 0.95, 0, 0.42, 'k');
}

// one long wall: its face, the piers at the column rows, the stone bands and plinth, the windows
async function longWall(kit, W, name) {
  const { solid } = kit, shade = name === 'left' ? 0 : 0.6;
  solid.set({ kind: KIND.brick, w: shade, col: [1, 1, 1] });
  solid.quad([W.a0, -2, 0], [W.a1, -2, 0], [W.a1, TOP, 0], [W.a0, TOP, 0]);
  for (let k = 0; k < 22; k++) {
    const a = P.columnZ(k);
    solid.set({ kind: KIND.brick, w: shade });
    solid.box(a - 1.3, a + 1.3, -2, 47.3, 0, 0.7, 'kdu');
    solid.set({ kind: KIND.ashlar, w: 0.7 });
    solid.box(a - 1.65, a + 1.65, 47.3, 48.0, 0, 1.0, 'k');
    solid.box(a - 1.5, a + 1.5, 28.9, 30.0, 0, 0.9, 'k');
  }
  solid.set({ kind: KIND.ashlar, w: 0.55 });
  solid.box(W.a0, W.a1, 29.1, 29.8, 0, 0.22, 'lrk');
  solid.box(W.a0, W.a1, 50.7, 51.6, 0, 0.36, 'lrk');
  // the plinth, bay by bay, as high as the ground stands
  const edges = [W.a0]; for (let k = 21; k >= 0; k--) edges.push(P.columnZ(k)); edges.push(W.a1);
  for (let j = 0; j + 1 < edges.length; j++) {
    const aa = edges[j], ab = edges[j + 1];
    let g = -1e9; for (let a = aa; a <= ab; a += 2.5) g = Math.max(g, groundAt(W, a, 0.6));
    const top = Math.min(Math.max(Math.min(g + 2.0, 28.9), g + 0.5), PLINTH_TOP);
    solid.set({ kind: KIND.ashlar, w: 0.35 });
    solid.box(aa, ab, -2, top, 0, 0.3, 'lrkdu');
    solid.quad([aa, top, 0.3], [ab, top, 0.3], [ab, top + 0.3, 0], [aa, top + 0.3, 0]);
    if (ab - aa > 15) wallWindow(kit, (aa + ab) / 2, (j * 0.37 + (name === 'left' ? 0.1 : 0.6)) % 1);
    await kit.ctx.yield();
  }
}
// an iron gallery at y 30 along a wall, a0..a1: plank floor, edge beam, a joist every 5 m, and a railing 3.3 m high
// that is left open across each of `gaps` ([from, to] along the wall), where a stair's landing joins. Under each joist,
// by rule from the level beneath it (o.under(a, d): the plan's ground at the wall's foot unless the caller builds a
// floor there): a cast bracket where its whole length is clear of that level by 0.3 m; where the level stands higher,
// a plain stone corbel in two steps. o.seat(a) may move a joist's place along the wall, clear of a thing on its face.
export async function gallery(kit, W, a0, a1, gaps, real, o = {}) {
  const { solid, lace } = kit, Y = P.SHED.gallery, under = o.under || ((a, d) => groundAt(W, a, d));
  solid.set({ kind: KIND.planks, w: 0, col: [1, 1, 1] });
  solid.box(a0, a1, Y - 0.2, Y, 0, GAL, 'lrk');
  solid.set({ kind: KIND.iron, w: 0, col: RAILTINT });
  solid.bar([a0, Y - 0.45, GAL], [a1, Y - 0.45, GAL], 0.22, 0.7, [0, 0, 1]);
  solid.bar([a0, Y - 0.5, 0.3], [a1, Y - 0.5, 0.3], 0.2, 0.5, [0, 0, 1]);
  const first = Math.ceil((a0 + 1) / 5) * 5;
  for (let at = first; at < a1 - 0.5; at += 5) {
    const a = o.seat ? o.seat(at) : at;
    let clear = 1e9;
    for (const [d, drop] of BRACKET_UNDER) clear = Math.min(clear, Y - 0.75 - drop - under(a, d));
    if (clear >= 0.3) {
      lace.set({ kind: LACE.bracket, w: 0, col: [1, 1, 1] });
      lace.poly([[a, Y - 0.75, 0.05], [a, Y - 0.75, 3.25], [a, Y - 3.95, 0.05]], [[0, 0], [3.2, 0], [0, 3.2]]);
    } else {
      solid.set({ kind: KIND.ashlar, w: 0.6, col: [1, 1, 1] });
      solid.box(a - 0.3, a + 0.3, Y - 1.24, Y - 0.79, 0, 1.5, 'k');
      solid.box(a - 0.3, a + 0.3, Y - 1.69, Y - 1.24, 0, 0.8, 'ku');
    }
    solid.set({ kind: KIND.iron, w: 0, col: RAILTINT });
    solid.bar([a, Y - 0.62, 0.3], [a, Y - 0.62, GAL], 0.2, 0.34, [1, 0, 0]);      // the joist over the bracket or corbel
    if (at % 40 === 0) await kit.ctx.yield();
  }
  // the railing between the gaps
  const cuts = gaps.slice().sort((p, q) => p[0] - q[0]);
  let from = a0;
  const piece = (f, t) => {
    if (t - f < 0.4) return;
    lace.set({ kind: LACE.rail, w: 0, col: [1, 1, 1] });
    lace.quad([f, Y, GAL], [t, Y, GAL], [t, Y + 3.3, GAL], [f, Y + 3.3, GAL], [[f, 0], [t, 0], [t, 3.3], [f, 3.3]]);
    solid.set({ kind: KIND.iron, w: 0, col: RAILTINT });
    solid.bar([f, Y + 3.2, GAL], [t, Y + 3.2, GAL], 0.24, 0.2, [0, 0, 1]);
    if (real) for (let a = Math.ceil(f / 5) * 5; a <= t; a += 5) solid.bar([a, Y, GAL], [a, Y + 3.36, GAL], 0.26, 0.26, [1, 0, 0]);
    for (const e of [f, t]) solid.bar([e, Y, GAL], [e, Y + 3.5, GAL], 0.3, 0.3, [1, 0, 0]);
  };
  for (const c of cuts) { piece(from, c[0]); from = c[1]; }
  piece(from, a1);
}
// a stone gutter where the meadow meets the wall: a sunk channel and a kerb, following the ground
export async function gutter(kit, W, a0, a1, skip) {
  const { solid } = kit, n = Math.round((a1 - a0) / 5), g = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; g.push(Math.max(groundAt(W, a, 0.5), groundAt(W, a, 1.9)) + 0.18); }
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n, ga = g[i], gb = g[i + 1];
    if (skip && skip((a + b) / 2)) continue;
    solid.set({ kind: KIND.ashlar, w: 0.15, col: [0.86, 0.86, 0.84] });
    solid.quad([a, ga - 0.2, 1.45], [b, gb - 0.2, 1.45], [b, gb - 0.2, 0.3], [a, ga - 0.2, 0.3]);                 // the channel's bed
    solid.set({ w: 0.6, col: [1, 1, 1] });
    solid.quad([a, ga, 2.0], [b, gb, 2.0], [b, gb, 1.45], [a, ga, 1.45]);                                           // the kerb's top
    solid.quad([a, ga - 1.2, 2.0], [b, gb - 1.2, 2.0], [b, gb, 2.0], [a, ga, 2.0]);                                 // its face to the meadow
    solid.quad([b, gb - 0.2, 1.45], [a, ga - 0.2, 1.45], [a, ga, 1.45], [b, gb, 1.45]);                             // its face to the channel
    if (i % 12 === 11) await kit.ctx.yield();
  }
}
// a cast wall bracket with a hanging lantern, unlit, on a pier's face at (a, y): an iron cap, an iron foot and a dark
// six-sided glass body between them (plain: no cage bars are drawn)
export function lamp(kit, a, y) {
  const { solid } = kit, d = 0.7;
  solid.set({ kind: KIND.iron, w: 0, col: RAILTINT });
  solid.box(a - 0.3, a + 0.3, y - 1.5, y + 0.5, d, d + 0.14, 'k');
  solid.bar([a, y, d + 0.1], [a, y, d + 2.5], 0.16, 0.16, [1, 0, 0]);
  solid.bar([a, y - 1.3, d + 0.1], [a, y - 0.1, d + 1.8], 0.12, 0.12, [1, 0, 0]);
  solid.bar([a, y, d + 2.3], [a, y - 0.5, d + 2.3], 0.08, 0.08, [1, 0, 0]);
  const c = [a, y - 0.5, d + 2.3];
  solid.lathe(c, 1, [[0.5, -0.38], [0.1, -0.05], [0.06, 0.0]], 6);
  solid.lathe(c, 1, [[0.12, -1.62], [0.36, -1.4]], 6);
  solid.set({ kind: KIND.plain, w: 0, col: [0.16, 0.2, 0.21] });
  solid.lathe(c, 1, [[0.36, -1.4], [0.46, -0.38]], 6);
}

// what the seed deals for one long wall, from that wall's own stream: where its stairs go down and which bays have
// doors. `extra`: a second stair in the lower valley (drawn only where it is built).
function dealWall(rng, extra) {
  const pick = (list) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  const side = () => (rng() < 0.5 ? 1 : -1);
  const lows = [165, 125, 85, 45], stairs = [];
  const first = pick(lows);
  stairs.push({ a: first, s: side() });
  if (extra) stairs.push({ a: pick(lows.filter((v) => Math.abs(v - first) > 50)), s: side() });
  // the upper valley's stair. No stair's run may cross the terrace's front, where the plan's ground steps: a seat
  // within a stair's farthest reach of that front is given the side that leads away from it.
  const a = pick([-75, -115, -155, -195]), s = side(), front = P.TERRACE.z0;
  stairs.push({ a, s: (a - front) * (a + s * STAIR_REACH - front) < 0 ? -s : s });
  const doors = [];
  for (let c = 190; c >= -10; c -= 20) {
    const dice = rng();                                           // drawn for every bay, used or not
    const busy = stairs.some((t) => c > Math.min(t.a - t.s * 4, t.a + t.s * 34) - 5 && c < Math.max(t.a - t.s * 4, t.a + t.s * 34) + 5);
    if (!busy && dice < 0.45) doors.push(c);
  }
  return { stairs, doors };
}

export async function buildWalls(kit) {
  const { solid, lace, glass, ctx, o } = kit, rng = o.rngFor('shed-walls');
  const five = rng() < 0.5, paints = [[0.36, 0.5, 0.5], [0.5, 0.3, 0.24], [0.42, 0.46, 0.34]];
  const paint = paints[Math.min(2, Math.floor(rng() * 3))];
  for (const name of ['left', 'right']) {
    // each long wall is dealt from a stream of its own, so that one wall's deal never shifts the other's
    const W = WALLS[name], deal = dealWall(o.rngFor('shed-walls:' + name), name === 'left' && five);
    inFrame(solid, W); inFrame(lace, W); inFrame(glass, W);
    await longWall(kit, W, name);
    await ctx.yield();
    const gaps = deal.stairs.map((t) => stair(kit, W, t.a, t.s, P.SHED.gallery));
    await ctx.yield();
    await gallery(kit, W, W.a0, W.a1, gaps, false);
    await ctx.yield();
    for (const c of deal.doors) door(kit, W, c, paint);
    await ctx.yield();
    for (let k = 1; k < 22; k += 2) lamp(kit, P.columnZ(k), 37.6);
    await ctx.yield();
    await gutter(kit, W, W.a0, W.a1, (a) => deal.doors.some((c) => Math.abs(a - c) < 3.2));
    solid.frame(null); lace.frame(null); glass.frame(null);
    await ctx.yield();
  }
  kit.doorPaint = paint;
  // the downstream wall: face, piers, plinth and bands; at its foot the river ends in a stone-kerbed sump under a grating
  {
    const W = WALLS.down;
    inFrame(solid, W); inFrame(lace, W);
    solid.set({ kind: KIND.brick, w: 0.45, col: [1, 1, 1] });
    solid.quad([W.a0, -2, 0], [W.a1, -2, 0], [W.a1, TOP, 0], [W.a0, TOP, 0]);
    for (let a = -60; a <= 60; a += 20) solid.box(a - 1.3, a + 1.3, -2, 50.7, 0, 0.7, 'kdu');
    solid.set({ kind: KIND.ashlar, w: 0.5 });
    solid.box(W.a0, W.a1, 29.1, 29.8, 0, 0.22, 'lrk');
    solid.box(W.a0, W.a1, 50.7, 51.6, 0, 0.36, 'lrk');
    for (let a = -80; a < 80; a += 20) {
      let g = -1e9; for (let q = a; q <= a + 20; q += 2.5) g = Math.max(g, groundAt(W, q, 0.6));
      solid.set({ kind: KIND.ashlar, w: 0.35 });
      solid.box(a, a + 20, -2, g + 2, 0, 0.3, 'lrkdu');
      solid.quad([a, g + 2, 0.3], [a + 20, g + 2, 0.3], [a + 20, g + 2.3, 0], [a, g + 2.3, 0]);
    }
    const c = P.riverX(S.zDown), h = P.riverHalfWidth(S.zDown), y = P.riverY(S.zDown), x0 = c - h - 1.5, x1 = c + h + 1.5;
    solid.set({ kind: KIND.ashlar, w: 0.6 });
    solid.box(x0 - 0.8, x0, y - 2.5, y + 0.95, 0, 4.0, 'kd');
    solid.box(x1, x1 + 0.8, y - 2.5, y + 0.95, 0, 4.0, 'kd');
    solid.box(x0, x1, y + 0.6, y + 0.95, 3.2, 4.0, 'lr');
    lace.set({ kind: LACE.grate, w: 0, col: [1, 1, 1] });
    lace.quad([x0, y + 0.8, 3.2], [x1, y + 0.8, 3.2], [x1, y + 0.8, 0], [x0, y + 0.8, 0], [[x0, 3.2], [x1, 3.2], [x1, 0], [x0, 0]]);
    await gutter(kit, W, W.a0, W.a1, (a) => a > x0 - 3 && a < x1 + 3);
    solid.frame(null); lace.frame(null);
  }
  await ctx.yield();
}
