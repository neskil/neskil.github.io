// valley-inside-the-works, THE SHED: the saw-tooth roof. Valleys cross the hall every 20 m at y 52; in each tooth a
// boarded slope climbs 16 m to the ridge at y 62 and a steep glazed face drops back to the next valley, so the glass
// looks up the valley. In each tooth a light truss every 20 m across; under every valley a lattice girder 4 m deep.
// The lowest thing of the roof is the girders' flange plate, whose underside is at y 47.92.
import * as P from './valley-inside-the-works-plan.js';
import { KIND, LACE, PANE } from './valley-inside-the-works-shed-mats.js';

export const TRUSS_X = [-70, -50, -30, -10, 10, 30, 50, 70];
export const GIRDER = { depth: 4, chord: 0.45, half: 0.42 };
const CURB = 1.4;

export async function buildRoof(kit) {
  const { solid, lace, glass, ctx } = kit, S = P.SHED, X0 = S.x0, X1 = S.x1, V = S.roofValley, R = S.roofRidge;
  const rise = R - V, back = S.ridgeBack, sl = Math.hypot(back, rise), gl = Math.hypot(S.bay - back, rise);
  const tS = [0, rise / sl, -back / sl];                       // up the slope
  const nS = [0, back / sl, rise / sl];                        // the slope's outer normal
  const tG = [0, -rise / gl, -(S.bay - back) / gl];            // down the glass
  const nG = [0, (S.bay - back) / gl, -rise / gl];             // the glass's outer normal (toward the light)
  for (let k = -1; k <= 21; k++) {
    const v = 200 - 20 * k, zr = v - back, zn = v - S.bay;
    const za = Math.min(v, S.zDown), zb = Math.max(zr, S.zHead);
    const ya = V + rise * (v - za) / back, yb = V + rise * (v - zb) / back, s0 = (v - za) / back * sl, s1 = (v - zb) / back * sl;
    // the slope's underside: cream boards
    solid.set({ kind: KIND.boards, w: (k * 0.37) % 1, col: [1, 1, 1] });
    solid.quad([X1, ya, za], [X0, ya, za], [X0, yb, zb], [X1, yb, zb], [[X1, s0], [X0, s0], [X0, s1], [X1, s1]]);
    // iron purlins under the boards, and the rafters of the trusses
    solid.set({ kind: KIND.iron, w: 0.2 });
    for (const f of [0.25, 0.5, 0.75]) {
      const z = v - back * f, y = V + rise * f;
      if (z > S.zDown - 0.5 || z < S.zHead + 0.5) continue;
      const c = [0, y - nS[1] * 0.3, z - nS[2] * 0.3];
      solid.bar([X0, c[1], c[2]], [X1, c[1], c[2]], 0.34, 0.6, tS);
    }
    for (const x of TRUSS_X) {
      const a = [x, ya - nS[1] * 0.85, za - nS[2] * 0.85], b = [x, yb - nS[1] * 0.85, zb - nS[2] * 0.85];
      solid.bar(a, b, 0.3, 0.5, [1, 0, 0]);
    }
    if (zr <= S.zDown && zn >= S.zHead) {
      // the glazed face, seen from inside
      // (its lowest 1.4 m is a boarded curb over the valley gutter; the glass stands on it)
      const cs = CURB / gl, yc = V + rise * cs, zc = zn + (zr - zn) * cs;
      solid.set({ kind: KIND.boards, w: (k * 0.53 + 0.2) % 1, col: [0.96, 0.95, 0.93] });
      solid.quad([X0, V, zn], [X1, V, zn], [X1, yc, zc], [X0, yc, zc], [[X0, 0], [X1, 0], [X1, CURB], [X0, CURB]]);
      solid.set({ kind: KIND.iron, w: 0.2, col: [1, 1, 1] });
      solid.bar([X0, yc - nG[1] * 0.12, zc - nG[2] * 0.12], [X1, yc - nG[1] * 0.12, zc - nG[2] * 0.12], 0.3, 0.24, tG);
      glass.set({ kind: PANE.roof, w: ((k + 1) * 0.618) % 1, col: [1, 1, 1] });
      glass.quad([X0, yc, zc], [X1, yc, zc], [X1, R, zr], [X0, R, zr], [[X0, CURB], [X1, CURB], [X1, gl], [X0, gl]]);
      solid.set({ kind: KIND.iron, w: 0.2 });
      for (const x of TRUSS_X) {
        const a = [x, R + nG[1] * -0.3, zr + nG[2] * -0.3], b = [x, V + nG[1] * -0.3, zn + nG[2] * -0.3];
        solid.bar(a, b, 0.26, 0.42, [1, 0, 0]);
      }
      // the ridge piece
      solid.bar([X0, R - 0.45, zr + 0.05], [X1, R - 0.45, zr + 0.05], 0.5, 0.5, [0, 0, 1]);
    }
    // the truss's light members, drawn on a panel in the truss's own plane (clipped at the end walls)
    let tri = [[zn, V], [v, V], [zr, R]];
    for (const [lim, keep] of [[S.zDown, (z) => z <= S.zDown], [S.zHead, (z) => z >= S.zHead]]) {
      const out = [];
      for (let i = 0; i < tri.length; i++) {
        const a = tri[i], b = tri[(i + 1) % tri.length], ia = keep(a[0]), ib = keep(b[0]);
        if (ia) out.push(a);
        if (ia !== ib) { const t = (lim - a[0]) / (b[0] - a[0]); out.push([lim, a[1] + (b[1] - a[1]) * t]); }
      }
      tri = out;
    }
    if (tri.length >= 3) {
      lace.set({ kind: LACE.truss, w: 0, col: [1, 1, 1] });
      for (const x of TRUSS_X) lace.poly(tri.map((q) => [x, q[1], q[0]]), tri.map((q) => [q[0] - zn, q[1] - V]));
    }
    await ctx.yield();
  }
  // the lattice girders under the valleys, carried by the columns
  for (let k = 0; k <= 21; k++) {
    const v = P.columnZ(k), h = GIRDER.half, c = GIRDER.chord, y0 = V - GIRDER.depth;
    solid.set({ kind: KIND.iron, w: 0.5, col: [1, 1, 1] });
    solid.bar([X0, V - c / 2, v], [X1, V - c / 2, v], 2 * h, c, [0, 0, 1]);          // the top chord
    solid.bar([X0, y0 + c / 2, v], [X1, y0 + c / 2, v], 2 * h, c, [0, 0, 1]);        // the bottom chord
    solid.bar([X0, y0 - 0.04, v], [X1, y0 - 0.04, v], 2 * h + 0.36, 0.08, [0, 0, 1]);   // its flange plate (underside at y 47.92, the roof's lowest)
    solid.set({ w: 0 });
    solid.box(X0, X1, V - 0.06, V + 0.12, v - 0.95, v + 0.95, 'lru');   // the valley gutter's sole
    for (const x of P.COLUMN_X) solid.box(x - 0.45, x + 0.45, y0 + c, V - c, v - 0.3, v + 0.3, 'ud');   // a stiffener over each column
    lace.set({ kind: LACE.web, w: 0, col: [1, 1, 1] });
    for (let x = -24; x <= 24; x += 1) for (const dz of [-0.6, 0.6]) kit.air(x, y0 - 0.08, v + dz, 'girder');
    for (const dz of [-0.26, 0.26]) lace.quad([X0, y0 + c, v + dz], [X1, y0 + c, v + dz], [X1, V - c, v + dz], [X0, V - c, v + dz], [[X0, 0], [X1, 0], [X1, 1], [X0, 1]]);
    await ctx.yield();
  }
  await ctx.yield();
}
