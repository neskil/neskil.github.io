// valley-inside-the-works, the chocolate: THE HEAD OF THE VALLEY. The chocolate standing in the four troughs (plan:
// TROUGH_X, TROUGH; its surface at TROUGH.level) with a slow bow wave before each roller and a smooth wake behind
// (the shader draws them from where the plan's rollerZ puts each roller); from each trough's front the chocolate
// runs out over the stone lip and spills from it (0.45 m beyond the terrace's edge, z = HEAD_Z) in a broad thin satin
// ribbon, 6 m wide at the lip and 5 m at its foot, down to the head pool, where it folds a little.
import * as P from './valley-inside-the-works-plan.js';
import { smooth, LIFT } from './valley-inside-the-works-chocolate-river.js';
import { poolPatch } from './valley-inside-the-works-chocolate-pool.js';

const TR = P.TROUGH, HALF = TR.width / 2;
const LIP_Z0 = TR.z0 - 0.3, LIP_Z1 = P.HEAD_Z + 0.45;        // the stone lip runs from here to here; its edge is where the ribbon falls
const POOL_Y = P.riverY(P.HEAD_Z) + LIFT;
const FOOT_Z = LIP_Z1 + 0.55;                                 // where the ribbons meet the head pool

export function addTroughs(acc) {
  P.TROUGH_X.forEach((cx, i) => {
    const v0 = 20 + 8 * i;
    // the standing chocolate (kind 2: the shader lays the roller's bow wave and wake on it; aPleat.x says which roller)
    let prev = null;
    for (let k = 0; k <= 10; k++) {
      const z = TR.z1 + (LIP_Z0 - TR.z1) * (k / 10), row = [];
      for (let j = 0; j <= 8; j++) {
        const x = cx - HALF + TR.width * (j / 8);
        row.push(acc.vertex(x, TR.level, z, x - cx, v0 + (z - TR.z1), 0, 0, 1, 0.25, Math.abs(x - cx) / HALF, { pleat: [i, 0, 0, 1], kind: 2, half: -HALF }));
      }
      if (prev) acc.strip(row, prev);
      prev = row;
    }
    // over the stone lip, round its edge and down: the ribbon
    const path = [];                                         // z, y, plumb 0..1
    for (let k = 0; k <= 4; k++) path.push([LIP_Z0 + (LIP_Z1 - 0.3 - LIP_Z0) * (k / 4), TR.level - 0.05 * (k / 4), 0]);
    const yl = TR.level - 0.05, r = 0.3;
    for (let k = 1; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; path.push([LIP_Z1 - 0.3 + r * Math.sin(a), yl - r * (1 - Math.cos(a)), k / 4]); }
    const y0 = yl - r, rows = 8;
    for (let k = 1; k <= rows; k++) { const f = k / rows; path.push([LIP_Z1 + 0.25 * f * f, y0 - (y0 - POOL_Y + 0.2) * f, 1]); }
    prev = null;
    let s = 0;
    for (let k = 0; k < path.length; k++) {
      const [z, y, plumb] = path[k];
      if (k > 0) s += Math.hypot(z - path[k - 1][0], y - path[k - 1][1]);
      const a = plumb * Math.PI / 2, drop = Math.max(TR.level - y, 0), narrow = 1 - (1 / 6) * smooth(0.2, 3.2, drop);
      const row = [];
      for (let j = 0; j <= 12; j++) {
        const t = -1 + 2 * (j / 12), x = cx + t * HALF * narrow, xs = t * HALF;
        const p = 0.6 * (xs + 0.6 * Math.sin(0.9 * xs + 1.3 * i + 0.4)), dp = 0.6 * (1 + 0.54 * Math.cos(0.9 * xs + 1.3 * i + 0.4));
        const amp = 0.055 * smooth(0.3, 2, drop) * (1 - smooth(0.75, 1, Math.abs(t)));
        row.push(acc.vertex(x, y, z, xs, v0 + (LIP_Z0 - TR.z1) + s, 0, -Math.sin(a), Math.cos(a), 0.7 + 2.6 * Math.sqrt(drop / 5), Math.abs(t),
          { thin: 0.05 + 0.1 * smooth(0, 1.5, drop), pleat: [p, amp, dp, 0], kind: 1, half: -HALF }));
      }
      if (prev) acc.strip(row, prev);
      prev = row;
    }
  });
}

// The head pool under the four ribbons: a finer patch where each ribbon lays itself down in a few slow pleats.
export function addHeadPool(acc) {
  poolPatch(acc, {
    x0: P.TROUGH_X[0] - 5, x1: P.TROUGH_X[3] + 5, z0: P.HEAD_Z + 0.02, z1: P.HEAD_Z + 7, nx: 46, nz: 14, nominal: 6.5, speed: 1.2,
    dress: (u, v, z, x) => {
      let near = 1e9;
      for (const cx of P.TROUGH_X) near = Math.min(near, Math.abs(x - cx));
      const p = z - FOOT_Z, inside = 1 - smooth(2.3, 3.4, near);
      const amp = 0.11 * smooth(-0.3, 0.4, p) * Math.exp(-Math.max(p, 0) / 1.7) * inside;
      return { pleat: [p, amp, 0, 1], kind: 0 };
    },
  });
}
