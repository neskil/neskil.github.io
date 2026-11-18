// valley-inside-the-works, THE SHED: iron stairs from a gallery down to the ground, and boarded doors. Drawn in a
// wall's own frame (x along the wall, y up, z out from it). A stair's treads are 0.5 m deep and rise 0.4 m; it goes down
// tread by tread until it meets the plan's ground, and lands there on a stone slab; or it comes down onto a floor handed
// in (the terrace), where a tread that would lie in that floor is left out (the floor is that step) and no slab is laid.
import { KIND, LACE } from './valley-inside-the-works-shed-mats.js';
import { GAL, RAILTINT, groundAt } from './valley-inside-the-works-shed-walls.js';

const TREAD = 0.5, RISE = 0.4, WIDE = 2.6, LAND = 3.2, MOST = 64;
// the farthest a stair can run from its seat: its most treads, the landing between two flights, and its slab
export const STAIR_REACH = MOST * TREAD + 2.5 + 2.4;

// a stair from the gallery at (aTop, yTop), running along the wall in direction s (+1 or -1). floor(a) gives the level
// it lands on. Returns the gap it needs in the gallery's railing: [from, to].
export function stair(kit, W, aTop, s, yTop, floor, noSlab) {
  const { solid, lace } = kit, d0 = GAL + 0.12, d1 = d0 + WIDE, dm = (d0 + d1) / 2;
  const ground = floor || ((a) => groundAt(W, a, dm));
  // how many treads until the ground
  let n = 1;
  while (n < MOST && yTop - n * RISE > ground(aTop + s * (n - 0.5) * TREAD) + 0.12) n++;
  const half = n > 26 ? Math.round(n / 2) : 0;                   // a long flight is broken by a landing
  const runs = [];                                               // sloped runs: [a from, y from, treads]
  if (half) { runs.push([aTop, yTop, half]); runs.push([aTop + s * (half * TREAD + 2.5), yTop - half * RISE, n - half]); }
  else runs.push([aTop, yTop, n]);
  const plate = (aa, ab, y) => {                                 // a flat landing of iron plate with its outer railing
    const x0 = Math.min(aa, ab), x1 = Math.max(aa, ab);
    solid.set({ kind: KIND.iron, w: 0, col: RAILTINT });
    solid.box(x0, x1, y - 0.16, y, GAL, d1 + 0.1, 'k');
    lace.set({ kind: LACE.rail, w: 0, col: [1, 1, 1] });
    lace.quad([x0, y, d1], [x1, y, d1], [x1, y + 3.3, d1], [x0, y + 3.3, d1], [[x0, 0], [x1, 0], [x1, 3.3], [x0, 3.3]]);
  };
  const post = (a, d, y) => {                                    // a slim iron post down to the ground
    const g = ground(a) - 0.6;
    if (y - g > 1.5) { solid.set({ kind: KIND.iron, w: 0, col: RAILTINT }); solid.bar([a, g, d], [a, y, d], 0.28, 0.28, [1, 0, 0]); }
  };
  plate(aTop - s * LAND, aTop, yTop);                            // the head landing, beside the gallery
  lace.set({ kind: LACE.rail, w: 0, col: [1, 1, 1] });
  lace.quad([aTop - s * LAND, yTop, GAL], [aTop - s * LAND, yTop, d1], [aTop - s * LAND, yTop + 3.3, d1], [aTop - s * LAND, yTop + 3.3, GAL], [[0, 0], [WIDE, 0], [WIDE, 3.3], [0, 3.3]]);
  for (let r = 0; r < runs.length; r++) {
    const [aS, yS, cnt] = runs[r], aE = aS + s * cnt * TREAD, yE = yS - cnt * RISE, L = cnt * TREAD;
    solid.set({ kind: KIND.iron, w: 0, col: RAILTINT });
    for (const d of [d0, d1]) {
      solid.bar([aS, yS - 0.3, d], [aE, yE - 0.3, d], 0.14, 0.8, [0, 0, 1]);                       // the stringers
      solid.bar([aS, yS + 3.2, d], [aE, yE + 3.2, d], 0.22, 0.2, [0, 0, 1]);                       // the handrails
      for (const [a, y] of [[aS, yS], [aE, yE]]) solid.bar([a, y - 0.2, d], [a, y + 3.5, d], 0.3, 0.3, [1, 0, 0]);   // newels
    }
    for (let i = 1; i <= cnt; i++) {
      const a0 = aS + s * (i - 1) * TREAD, a1 = aS + s * i * TREAD, y = yS - i * RISE;
      if (floor && y < floor((a0 + a1) / 2) + 0.03) continue;    // a tread that would lie in the floor it lands on: the floor is that step
      solid.box(Math.min(a0, a1) - 0.04, Math.max(a0, a1) + 0.04, y - 0.1, y, d0, d1, 'fk');
    }
    lace.set({ kind: LACE.rail, w: 0, col: [1, 1, 1] });
    for (const d of [d0, d1]) lace.quad([aS, yS, d], [aE, yE, d], [aE, yE + 3.3, d], [aS, yS + 3.3, d], [[0, 0], [L, 0], [L, 3.3], [0, 3.3]]);
    for (let q = 6; q < L - 2; q += 6) for (const d of [d0, d1]) post(aS + s * q, d, yS - q / TREAD * RISE - 0.5);
    if (r + 1 < runs.length) {                                    // the landing between two flights, on four posts
      plate(aE, aE + s * 2.5, yE);
      for (const a of [aE + s * 0.3, aE + s * 2.2]) for (const d of [d0, d1]) post(a, d, yE - 0.16);
    }
  }
  // the stone slab it lands on
  const last = runs[runs.length - 1], aF = last[0] + s * last[2] * TREAD, yF = last[1] - last[2] * RISE;
  solid.set({ kind: KIND.ashlar, w: 0.5, col: [1, 1, 1] });
  if (!noSlab) solid.box(Math.min(aF - s * 0.6, aF + s * 2.4), Math.max(aF - s * 0.6, aF + s * 2.4), yF - 1.4, yF + 0.02, d0 - 0.5, d1 + 0.5);
  return [Math.min(aTop - s * LAND, aTop), Math.max(aTop - s * LAND, aTop)];
}

// a plain boarded door 6 m high in stone dressings, its sill on the ground at the wall
export function door(kit, W, ac, paint) {
  const { solid } = kit, g = groundAt(W, ac, 0.8) + 0.2, hw = 2.1, H = 6;
  solid.set({ kind: KIND.planks, w: 0.85, col: paint });
  solid.quad([ac - hw, g, 0.4], [ac + hw, g, 0.4], [ac + hw, g + H, 0.4], [ac - hw, g + H, 0.4]);
  solid.set({ kind: KIND.ashlar, w: 0.7, col: [1, 1, 1] });
  solid.box(ac - hw - 0.6, ac - hw, g - 1.5, g + H, 0, 0.52, 'kdu');
  solid.box(ac + hw, ac + hw + 0.6, g - 1.5, g + H, 0, 0.52, 'kdu');
  solid.box(ac - hw - 0.85, ac + hw + 0.85, g + H, g + H + 0.9, 0, 0.6, 'k');
  solid.box(ac - hw - 0.85, ac + hw + 0.85, g - 1.5, g, 0, 1.3, 'kd');
  solid.set({ kind: KIND.iron, w: 0, col: [0.5, 0.52, 0.5] });
  for (const y of [g + 1.1, g + 4.9]) for (const sx of [-1, 1]) solid.box(Math.min(ac + sx * hw, ac + sx * 0.5), Math.max(ac + sx * hw, ac + sx * 0.5), y, y + 0.22, 0.4, 0.46, 'k');
  solid.box(ac - 0.07, ac + 0.07, g, g + H, 0.4, 0.45, 'kdu');
}
