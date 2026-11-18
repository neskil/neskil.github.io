// valley-inside-the-works, the meadow: THE FIELD. One lattice of the place (2 m) that says where each kind grows:
// read by the turf's paint, by the planting and by the far meadow alike, so that the drifts seen far off are the
// drifts flown over. Everything here is by place (metres of the plan); nothing reads the lens.
import * as P from './valley-inside-the-works-plan.js';

export const X0 = -80, X1 = 80, Z0 = -230, Z1 = 210, STEP = 2, NX = 81, NZ = 221;
export const CH = { lush: 0, daisy: 1, clover: 2, parsley: 3, tall: 4, dry: 5, shade: 6, fox: 7, wet: 8, open: 9 };
export const NCH = 10;
const smooth = (a, b, v) => { const t = Math.min(Math.max((v - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
export { smooth };

// the flown line by z (it runs upstream, z falling all the way): its x and its height at a z of the valley
export function routeAt(z) {
  const R = P.ROUTE;
  if (z >= R[0][2]) return [R[0][0], R[0][1]];
  for (let i = 0; i + 1 < R.length; i++) {
    if (z <= R[i][2] && z >= R[i + 1][2]) { const t = (R[i][2] - z) / (R[i][2] - R[i + 1][2]); return [R[i][0] + (R[i + 1][0] - R[i][0]) * t, R[i][1] + (R[i + 1][1] - R[i][1]) * t]; }
  }
  const L = R[R.length - 1]; return [L[0], L[1]];
}
// where nothing is planted: the river and its shore (the bank's first metre is wet earth and stones: see the ground's
// paint), the cream basin with its rim, under the terrace, on the scar's own rock
export function bare(x, z) {
  if (P.bankDistance(x, z) < 1) return true;
  if (Math.hypot(x - P.CREAM.x, z - P.CREAM.z) < P.CREAM.r + 1.3) return true;
  if (x > P.TERRACE.x0 - 1.2 && x < P.TERRACE.x1 + 1.2 && z < P.TERRACE.z0 + 1.2) return true;
  if (z < -34.3 && z > -44.4) return true;
  if (x < X0 + 0.8 || x > X1 - 0.8 || z > Z1 - 0.8 || z < Z0 + 0.8) return true;
  return false;
}
// THE GREAT PIPE'S SIGHT. The plan's great pipe is the room's sign and is to be seen whole from the way in, so nothing
// of the meadow taller than SIGHT.tall above its own ground stands on the wedge of ground between the flown line's
// first SIGHT.first metres and the pipe: the ground swept by the straight lines that run from each place of that
// stretch of the line (the entry's the first) to the pipe's axis, and SIGHT.wide either side of it (9 m, and half a
// metre more for what the flown curve leaves the plan's straight pieces by). Each deal asks sightGap of a place.
export const SIGHT = { wide: 9.5, tall: 4, first: 60 };
// (the plan's line over that stretch, in plan: its points, the last where the stretch ends)
const SIGHT_FAN = (() => {
  const R = P.ROUTE, pts = [[R[0][0], R[0][2]]];
  for (let i = 0, left = SIGHT.first; i + 1 < R.length && left > 0; i++) {
    const l = Math.hypot(R[i + 1][0] - R[i][0], R[i + 1][1] - R[i][1], R[i + 1][2] - R[i][2]), t = Math.min(left / l, 1);
    pts.push([R[i][0] + (R[i + 1][0] - R[i][0]) * t, R[i][2] + (R[i + 1][2] - R[i][2]) * t]); left -= l;
  }
  return pts;
})();
// how far a place lies outside the wedge, in plan (nought and less: on it)
export function sightGap(x, z) {
  const gx = P.GREAT_PIPE.x, gz = P.GREAT_PIPE.z, side = (ax, az, bx, bz) => (bx - ax) * (z - az) - (bz - az) * (x - ax);
  const off = (ax, az, bx, bz) => { const ex = bx - ax, ez = bz - az, t = Math.min(Math.max(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez), 0), 1); return Math.hypot(x - ax - ex * t, z - az - ez * t); };
  let best = 1e9;
  for (let i = 0; i < SIGHT_FAN.length; i++) {
    const [ax, az] = SIGHT_FAN[i]; best = Math.min(best, off(ax, az, gx, gz));
    if (i + 1 === SIGHT_FAN.length) break;
    const [bx, bz] = SIGHT_FAN[i + 1], s1 = side(ax, az, bx, bz), s2 = side(bx, bz, gx, gz), s3 = side(gx, gz, ax, az);
    if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return -SIGHT.wide;      // (between two of the lines)
    best = Math.min(best, off(ax, az, bx, bz));
  }
  return best - SIGHT.wide;
}
// THE DRY GROUND: some 11 m off the river's left bank the ground drains, and there the turf lies paler and drier. It
// is turf like the rest, with the meadow's plants on it, and it is no even band: long ragged patches of uneven breadth
// (some 2 to 9 m), with green meadow between them (see dry in makeField). How far a place lies from that line:
function stripOffset(x, z) {
  const hw = Math.max(P.riverHalfWidth(z), 6.5), want = 11 + 3.2 * Math.sin(z / 17 + 0.6) + 1.6 * Math.sin(z / 6.3);
  const slope = (P.riverX(z + 0.5) - P.riverX(z - 0.5));
  return ((P.riverX(z) - hw - want) - x) / Math.sqrt(1 + slope * slope);
}

export async function makeField(ctx) {
  const noise = ctx.core.makeNoise(ctx.core.hashSeed('valley:meadow-drifts:' + ctx.seed));
  const data = new Float32Array(NX * NZ * NCH);
  for (let j = 0; j < NZ; j++) {
    const z = Z0 + j * STEP;
    for (let i = 0; i < NX; i++) {
      const x = X0 + i * STEP, o = (j * NX + i) * NCH, d = P.bankDistance(x, z);
      const wall = Math.min(x - X0, X1 - x), side = smooth(16, 58, d);
      const lush = (1 - smooth(3, 30, d)) * 0.8 + 0.2 * (0.5 + 0.5 * noise.n2(x / 37, z / 43));
      // (the dry ground: its breadth by one noise along the line, its edge warped by another, its patches by a third)
      const half = 1.2 + 3.5 * (0.5 + 0.5 * noise.n2(z / 13 + 9.1, 3.3)), rag = noise.n2(x / 7.3 + 31.7, z / 7.3 - 12.9);
      const dry = (1 - smooth(half, half + 2.5, Math.abs(stripOffset(x, z) + 1.8 * rag))) * smooth(-0.2, 0.2, noise.n2(z / 26 + 5.3, 77.7));
      // drifts: long soft shapes, each kind by a noise of its own; warped so that no edge runs straight
      const wx = x + 9 * noise.n2(x / 31 + 7, z / 31), wz = z + 9 * noise.n2(x / 31, z / 31 + 13);
      const nd = noise.fbm2(wx / 26 + 3.1, wz / 34 + 1.7, 3), nc = noise.fbm2(wx / 19 - 8.2, wz / 23 + 5.5, 3);
      const np = noise.fbm2(wx / 22 + 21.4, wz / 28 - 9.3, 3), nt = noise.fbm2(wx / 15 - 4.4, wz / 40 + 17.9, 3);
      const nf = noise.fbm2(x / 13 + 2.2, z / 17 - 30.1, 2);
      const open = smooth(1.0, 2.4, d);
      // the first tongue of meadow, inside the river's bend, is the richest ground of the valley: no part of it is without flowers
      const rich = smooth(150, 136, z) * smooth(70, 90, z) * (1 - smooth(18, 30, Math.abs(x - routeAt(z)[0])));
      data[o + CH.lush] = lush;
      data[o + CH.daisy] = open * Math.max(smooth(0.0, 0.26, nd), 0.28 * rich) * (0.45 + 0.55 * smooth(2, 9, d));
      data[o + CH.clover] = open * Math.max(smooth(0.04, 0.3, nc), 0.22 * rich) * (0.5 + 0.5 * lush);
      data[o + CH.parsley] = open * Math.max(smooth(0.12, 0.45, np) * 0.7, (1 - smooth(4, 15, wall)) * smooth(-0.3, 0.2, np));
      data[o + CH.tall] = open * (0.35 + 0.65 * smooth(-0.3, 0.35, nt)) * (0.7 + 0.3 * side) * (1 - 0.4 * dry);      // (the hay stands thinner on the dry ground)
      data[o + CH.dry] = dry;
      data[o + CH.shade] = 0;
      const scarFoot = smooth(-8, -30, z) * (1 - smooth(-36.5, -37, z)) + smooth(-44, -45, z) * (1 - smooth(-50, -66, z));
      data[o + CH.fox] = open * smooth(-0.15, 0.3, nf) * Math.max(1 - smooth(5, 16, wall), 0.8 * scarFoot);
      data[o + CH.wet] = smooth(0.9, 1.3, d) * (1 - smooth(2.4, 5.0, d)) * smooth(-0.25, 0.25, noise.n2(x / 9 + 50, z / 9 - 20));      // (the reeds' and flags' ground: from the shore's edge out)
      data[o + CH.open] = open;
    }
    if (j % 3 === 2) await ctx.yield();
  }
  // a value of the lattice at any place (bilinear)
  function at(ch, x, z) {
    const fx = Math.min(Math.max((x - X0) / STEP, 0), NX - 1.001), fz = Math.min(Math.max((z - Z0) / STEP, 0), NZ - 1.001);
    const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, a = (j * NX + i) * NCH + ch, b = a + NX * NCH;
    return (data[a] * (1 - tx) + data[a + NCH] * tx) * (1 - tz) + (data[b] * (1 - tx) + data[b + NCH] * tx) * tz;
  }
  // the shade of the trees, laid in once their places are dealt: bluebells and cow parsley follow it, the hay thins in it
  function addShade(trees) {
    for (const t of trees) {
      const r = t.crown * 1.25, i0 = Math.max(0, Math.floor((t.x - r - X0) / STEP)), i1 = Math.min(NX - 1, Math.ceil((t.x + r - X0) / STEP));
      const j0 = Math.max(0, Math.floor((t.z - r - Z0) / STEP)), j1 = Math.min(NZ - 1, Math.ceil((t.z + r - Z0) / STEP));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const dd = Math.hypot(X0 + i * STEP - t.x, Z0 + j * STEP - t.z), o = (j * NX + i) * NCH + CH.shade;
        data[o] = Math.max(data[o], 1 - smooth(0.45 * r, r, dd));
      }
    }
  }
  return { data, at, addShade, noise };
}
