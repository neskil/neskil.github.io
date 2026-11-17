// hill-of-round-doors, the land builder's part: WHERE THE HEDGES, THE WALLS AND THE TREES STAND. The land's fields
// (the lattice of land-glsl.js) are bounded by hedges in the valley and by drystone walls and hedges on the hill;
// hedgerow trees stand in the hedges, an orchard on the slope west of the road, and beyond the village the far
// country's hedges carry small far trees. This part only lays them out, by place and by the visit's own draws; it
// makes no mesh. Nothing solid of the land's stands within CLEAR metres of the flown line in plan (9.5 for a hedge
// or a wall, which are under 3.5 m high; a tree's trunk keeps 9 m more than its crown's reach; the same hedge's
// distance, and 14 m more than a crown's reach, from the level line running 60 m back from the entry), nothing on the way,
// in a garden, on a mound, on the party field, in the water, by the mill and its wheel pit or at the bridge's ends,
// and no tree where its evening shadow
// would lie on a home's front.
import { FAR, farPoint, farField, farKind } from './hill-of-round-doors-land-glsl.js';
import { HOMES, FIELD, TREE, OAK, ENTRY, ROUTE } from './hill-of-round-doors-plan.js';
import { fieldAt, nearWorks } from './hill-of-round-doors-land-lines.js';

export const CLEAR = { hedge: 9.5, trunk: 9, back: 14, backLength: 60 };
// how far a place is, in plan, from the level line that runs CLEAR.backLength m back from the entry (the way the
// flight comes in, drawn backward from the plan's first two knots)
const B = (() => { const dx = ROUTE[0][0] - ROUTE[1][0], dz = ROUTE[0][2] - ROUTE[1][2], l = Math.hypot(dx, dz); return { x: dx / l, z: dz / l }; })();
export function backLine(x, z) { const rx = x - ENTRY.x, rz = z - ENTRY.z, t = Math.min(CLEAR.backLength, Math.max(0, rx * B.x + rz * B.z)); return Math.hypot(rx - B.x * t, rz - B.z * t); }
const VILLAGE = 185;                                           // metres from the flown line (in plan) within which hedges and walls are built
const MIN_RUN = 5;                                             // the fewest steps (4.6 m each) of a hedge or wall that stands

// o: { rng (hedges and walls), rngTrees, kinds, routeField, heightAt, farHeightAt (ground or far downs), sun, density }
export async function layFields(ctx, o) {
  const { rng, rngTrees, kinds, routeField, heightAt, farHeightAt, sun, density } = o;
  const k = {}, p = { x: 0, z: 0 }, p2 = { x: 0, z: 0 }, f = {}, runs = [], trees = [], far = [];
  const sl = Math.hypot(sun.x, sun.z) || 1e-3, sx = -sun.x / sl, sz = -sun.z / sl;
  const free = (x, z, y, gap) => {
    kinds.at(x, z, k, y);
    return k.grows && !k.water && k.wet < 0.45 && k.way > gap && k.garden < 0.02 && k.mound < 0.02 && k.front > 12 && fieldAt(x, z) > 1.22 && !nearWorks(x, z);
  };
  // a tree may not throw its evening shadow on a home's front, nor stand in the party tree's or the oak's own ground
  const shades = (x, z, y, h, r) => {
    for (const hm of HOMES) { const dx = hm.x - x, dz = hm.z - z, along = dx * sx + dz * sz, across = Math.abs(dx * sz - dz * sx); if (along > -4 && along < h * 3.4 && across < r + hm.w + 4 && y + h > hm.y + 1.5) return true; }
    return Math.hypot(x - TREE.x, z - TREE.z) < TREE.crown + 16 || Math.hypot(x - OAK.x, z - OAK.z) < OAK.crown + 14 || Math.hypot((x - FIELD.x) / (FIELD.rx + 14), (z - FIELD.z) / (FIELD.rz + 14)) < 1;
  };
  // ---- hedges and walls: every edge of the lattice is walked in steps; a step stands if its middle is free
  const STEP = 4.6 / FAR.size, R = 5;
  for (let dir = 0; dir < 2; dir++) for (let i = -R; i <= R; i++) {
    let run = null, cell = -99, kind = 0, gate = 0, open = false;
    for (let s = -R; s < R; s += STEP) {
      const c = Math.floor(s + STEP * 0.5);
      if (c !== cell) { cell = c; const e = farKind(i * 2 + dir, c, kinds.farSeed + 0.37); kind = e < 0.42 ? 1 : 0; open = e > 0.93; gate = c + 0.25 + 0.5 * farKind(c, i * 2 + dir, kinds.farSeed + 0.71); if (run) run = null; }
      const h0 = rng(), w0 = rng(), tDie = rngTrees(), tSize = rngTrees(), tKind = rngTrees();          // every step's dice, before any test
      if (dir === 0) { farPoint(i, s, p); farPoint(i, s + STEP, p2); } else { farPoint(s, i, p); farPoint(s + STEP, i, p2); }
      const mx = (p.x + p2.x) / 2, mz = (p.z + p2.z) / 2, rd = routeField(mx, mz);
      if (rd > VILLAGE + 30 || open) { run = null; continue; }
      const y = heightAt(mx, mz), ok = rd >= CLEAR.hedge && rd <= VILLAGE && backLine(mx, mz) >= CLEAR.hedge && Math.abs(s + STEP * 0.5 - gate) > 0.035 && free(mx, mz, y, 7.5);
      if (!ok) { run = null; continue; }
      const wall = kind === 1 && y > 21;
      if (!run || run.wall !== wall) { run = { wall, pts: [{ x: p.x, z: p.z, y: heightAt(p.x, p.z), h: 0, w: 0 }] }; runs.push(run); }
      const last = run.pts[run.pts.length - 1]; if (last.h === 0) { last.h = wall ? 1.35 + 0.3 * h0 : 2.1 + 1.1 * h0; last.w = wall ? 0.8 : 1.9 + 0.7 * w0; }
      run.pts.push({ x: p2.x, z: p2.z, y: heightAt(p2.x, p2.z), h: wall ? 1.35 + 0.3 * h0 : 2.1 + 1.1 * h0, w: wall ? 0.8 : 1.9 + 0.7 * w0 });
      // a hedgerow tree here and there in a hedge
      if (!wall && tDie < 0.055 * density) {
        const h = 13 + 9 * tSize, r = h * 0.42;
        if (rd >= CLEAR.trunk + r + 1 && backLine(mx, mz) >= CLEAR.back + r && !shades(mx, mz, y, h, r)) trees.push({ x: mx, y, z: mz, h, r, kind: tKind < 0.7 ? 0 : 1, d: rd });
      }
    }
    await ctx.yield();
  }
  // (a hedge or a wall is a line across the land: a piece shorter than MIN_RUN steps, left standing alone between
  // two gaps, is taken out again)
  for (let i = runs.length - 1; i >= 0; i--) if (runs[i].pts.length - 1 < MIN_RUN) runs.splice(i, 1);
  // ---- the orchard: small round trees in rows on the slope west of the road
  for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) {
    const jx = rngTrees.range(-1.6, 1.6), jz = rngTrees.range(-1.6, 1.6), hs = rngTrees(), x = -62 + a * 11.5 + b * 2.5 + jx, z = 38 + b * 11.5 - a * 2 + jz;
    const y = heightAt(x, z), h = 7.5 + 2.5 * hs, r = h * 0.5, rd = routeField(x, z);
    if (rd >= CLEAR.trunk + r + 1 && free(x, z, y, 9) && !shades(x, z, y, h, r)) trees.push({ x, y, z, h, r, kind: 2, d: Math.max(rd, 200) });      // (drawn as the lighter stand-in: they are small)
  }
  await ctx.yield();
  // ---- the far country's hedgerow trees: on the painted hedges beyond the village
  const want = Math.round(760 * (0.85 + 0.15 * density));
  for (let n = 0; n < want * 9 && far.length < want; n++) {
    const x = rngTrees.range(-600, 660), z = rngTrees.range(-430, 430), hs = rngTrees(), tone = rngTrees();
    const rd = routeField(x, z); if (rd < VILLAGE + 6 || rd > 640 || backLine(x, z) < CLEAR.back + 10) continue;
    if (farField(x, z, f).e > 2.6) continue;
    const y = farHeightAt(x, z); if (y < 1.4) continue;
    far.push({ x, y, z, h: 9 + 9 * hs, tone, d: rd });
    if ((n & 1023) === 1023) await ctx.yield();
  }
  return { runs, trees, far };
}
