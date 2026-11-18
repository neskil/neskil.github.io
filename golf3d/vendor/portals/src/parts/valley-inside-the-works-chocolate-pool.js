// valley-inside-the-works, the chocolate: ROUND THE PIERS AND THE PIPES. Which columns stand in the river on stone
// piers (the family's shader lays round each a meniscus, a little pile on the upstream side, a dent behind and a slow
// V trailing downstream); round each of the seven pipes in the pool (plan: pipeX, PIPES.riseZ) the surface dimples.
// Also here: a finer patch of surface laid over the river where small things need it; and where the moored boat's
// hull lies in the liquid (the shader parts the river at its bow, rings it with froth, and draws no liquid inside it).
import * as P from './valley-inside-the-works-plan.js';
import { streamV, LIFT } from './valley-inside-the-works-chocolate-river.js';
import * as SHED_BOAT from './valley-inside-the-works-shed-boat.js';

// A patch of the river's own surface, finer than the river's mesh, laid a hand's breadth over it: every vertex carries
// the stream's own coordinates for its place, so it wears exactly what the river wears there, plus dress(u, v, z, x).
// o: { x0, x1, z0, z1, nx, nz, nominal, speed, half(z), dress }. The dress must fall to nothing at the patch's edge.
export function poolPatch(acc, o) {
  const half = o.half || P.riverHalfWidth;
  let prev = null;
  for (let k = 0; k <= o.nz; k++) {
    const z = o.z1 + (o.z0 - o.z1) * (k / o.nz);            // from z1 (downstream) going upstream
    const c = P.riverX(z), h = half(z), e = 0.05, v = streamV(z);
    const cA = P.riverX(z + e), cB = P.riverX(z - e), hA = half(z + e), hB = half(z - e);
    const row = [];
    for (let j = 0; j <= o.nx; j++) {
      const x = o.x0 + (o.x1 - o.x0) * (j / o.nx), s = (x - c) / h, u = s * o.nominal;
      let fx = (cA + s * hA) - (cB + s * hB), fz = 2 * e; const l = Math.hypot(fx, fz); fx /= l; fz /= l;
      const edge = Math.min(j, o.nx - j, k, o.nz - k) === 0 ? 0 : 1;
      const d = (edge && o.dress && o.dress(u, v, z, x)) || {};
      d.scale = o.nominal / h; d.half = o.nominal;
      row.push(acc.vertex(x, P.riverY(z) + LIFT + 0.035, z, u, v, fx, 0, fz, o.speed, Math.min(Math.abs(s), 1), d));
    }
    if (prev) acc.strip(prev, row);
    prev = row;
  }
}

// The columns that stand in the river on their stone piers (the plan's columns with bankDistance under 0 that stand):
// where each is, and the way the stream runs there.
export function riverPiers() {
  const list = [];
  for (const x of P.COLUMN_X) for (let k = 0; k < 22; k++) {
    const z = P.columnZ(k);
    if (P.bankDistance(x, z) >= 0 || !P.columnStands(x, z)) continue;
    const dx = P.riverX(z + 0.5) - P.riverX(z - 0.5), l = Math.hypot(dx, 1);
    list.push({ x, z, fx: dx / l, fz: 1 / l });
  }
  return list;
}

// The dimples where the seven pipes draw from the pool: a fine patch round the rank, each pipe in a small soft funnel.
export function addDimples(acc) {
  const z0 = P.PIPES.riseZ, xa = P.pipeX(0), xb = P.pipeX(P.PIPES.count - 1);
  poolPatch(acc, {
    x0: xa - 2.6, x1: xb + 0.85, z0: z0 - 2.6, z1: z0 + 2.6, nx: 42, nz: 20, nominal: 8, speed: 1.5,
    dress: (u, v, z, x) => {
      let best = null, bestR = 9;
      for (let i = 0; i < P.PIPES.count; i++) { const r = Math.hypot(x - P.pipeX(i), z - z0); if (r < bestR) { bestR = r; best = i; } }
      const r = Math.max(bestR, 0.05), dx = x - P.pipeX(best), dz = z - z0;
      // a standing pleat whose phase is the distance from the pipe: with a negative height its first crest is a hollow
      return { pleat: [r, -0.13 * Math.exp(-((r / 0.85) ** 2)), dx / r, dz / r], kind: 1 };
    },
  });
}

// THE BOAT'S HULL WHERE IT LIES IN THE LIQUID (the plan's BOAT and boatX; the shed's builder makes the boat). half: the
// half breadth of its outer skin at the liquid's face, at stations dz apart along z, the first z0 from the plan's
// BOAT.z (toward the bow, which lies upstream). They are read here, once, off the shed's own boatSide(z), which its
// boat file gives for whoever rings the hull: so the liquid follows the hull as it is built (about 10 m by 2.6 m at
// the liquid's face; the plan's 13 by 3.6 m are its posts and rails, above the liquid). Should that file give no
// such law, a plain pointed oval of that size stands in.
const HULL_Z0 = -6.5, HULL_DZ = 0.25, HULL_M = 53;
const ovalSide = (z) => { const s = Math.abs(z - P.BOAT.z - 0.16) / 5.05; return s < 1 ? 1.3 * Math.pow(1 - Math.pow(s, 1.8), 0.8) : 0; };
function hullStations() {
  const read = (law) => Array.from({ length: HULL_M }, (_, i) => Math.max(law(P.BOAT.z + HULL_Z0 + HULL_DZ * i) || 0, 0));
  let half = typeof SHED_BOAT.boatSide === 'function' ? read(SHED_BOAT.boatSide) : read(ovalSide);
  if (!half.some((h) => h > 0)) half = read(ovalSide);
  // (kept from the last station before the hull begins to the first after it ends: the outline's two points)
  const first = Math.max(half.findIndex((h) => h > 0) - 1, 0), last = Math.min(half.length - half.slice().reverse().findIndex((h) => h > 0), half.length - 1);
  half[first] = 0; half[last] = 0;
  return { z0: HULL_Z0 + HULL_DZ * first, dz: HULL_DZ, half: half.slice(first, last + 1) };
}
export const HULL = hullStations();
