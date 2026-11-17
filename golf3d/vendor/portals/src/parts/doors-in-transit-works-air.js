// doors-in-transit: THE COUNT OF CLEAR AIR (the works builder's part), made on every build and kept by the works
// (works.air), so that what the world's head says of it is counted and not only said:
//   line   the nearest thing of the works to the flown line: metres of clear air (skin to line), what it is, where it
//          stands and how far along the line the nearest point lies;
//   tube   the nearest thing of the works to the axis of the tube behind the entry (the law: nothing across the
//          opening's half width plus 2 m in the last 30 m), and whether the tube is clear.
// What is counted: every bar of the standing iron, from the very lists the iron has just drawn (rails, walkways,
// rods, arms, mast, crown, posts, buffer); every place a hanging door can come to on each street, from its rail down
// to its sill with its sway; the tower's doors, steps and hangers round the whole screw; the marked door on its way
// along the spur, against where the lens is at the same share of the flight. Not counted: the marked door once it
// stands (it is the way out, flown into), and the shed with its floor, its bay and its yard's standing things (the
// joiner's, not the works': this count says nothing of them).
// The line is searched coarsely (every 2 m) and then finely (every half metre) about the nearest: good to a decimetre.
import { TIERS, tierLength, tierPoint, DOOR, ENTRY } from './doors-in-transit-plan.js';
import { routeTable } from './doors-in-transit-works-route.js';

export const TUBE = { length: 30, radius: 9 };      // behind the entry, along the level entry frame's axis; 9 = an opening's half width of 7 m, plus 2 m

// table: the fine flown line; bars: [{ name, axes: [[px, py, pz, qx, qy, qz, r], ...] }]; tower: the tower's rail
// (towerPoint, TOWER_LENGTH); marked(u, out) and stopU: the marked door's course and the share at which it stands
export async function countAir(ctx, { table, bars, tower, marked, stopU }) {
  const coarse = routeTable(2), C = coarse.pts, F = table.pts, cum = table.cum, TOTAL = table.total;
  const fineAt = (m) => { let lo = 0, hi = F.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < m) lo = mid + 1; else hi = mid; } return lo; };
  const hit = [0, 0];                                   // [distance, metres along the line]
  const toLine = (x, y, z) => {
    let b = Infinity, bi = 0;
    for (let i = 0; i < C.length; i++) { const dx = C[i][0] - x, dy = C[i][1] - y, dz = C[i][2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) { b = d; bi = i; } }
    const i0 = fineAt(coarse.cum[Math.max(0, bi - 1)]), i1 = fineAt(coarse.cum[Math.min(C.length - 1, bi + 1)]); let fi = i0;
    for (let i = i0; i <= i1; i++) { const dx = F[i][0] - x, dy = F[i][1] - y, dz = F[i][2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) { b = d; fi = i; } }
    hit[0] = Math.sqrt(b); hit[1] = cum[fi]; return hit;
  };
  // the tube's axis runs level from the entry back against the first heading (the flight begins heading -z)
  const toTube = (x, y, z) => { const t = Math.min(TUBE.length, Math.max(0, z - ENTRY.z)); return Math.hypot(x - ENTRY.x, y - ENTRY.y, z - ENTRY.z - t); };
  const air = { line: { dist: Infinity, what: '', at: [0, 0, 0], along: 0 }, tube: { dist: Infinity, what: '', at: [0, 0, 0], clear: true } };
  const take = (what, x, y, z, r) => {
    const h = toLine(x, y, z); if (h[0] - r < air.line.dist) { air.line.dist = h[0] - r; air.line.what = what; air.line.at = [x, y, z]; air.line.along = h[1]; }
    const t = toTube(x, y, z) - r; if (t < air.tube.dist) { air.tube.dist = t; air.tube.what = what; air.tube.at = [x, y, z]; }
  };
  // 1 the standing iron: each bar's axis every 2 m, less its half thickness
  for (const list of bars) {
    for (const a of list.axes) {
      const len = Math.hypot(a[3] - a[0], a[4] - a[1], a[5] - a[2]), n = Math.max(1, Math.ceil(len / 2));
      for (let i = 0; i <= n; i++) { const f = i / n; take(list.name, a[0] + (a[3] - a[0]) * f, a[1] + (a[4] - a[1]) * f, a[2] + (a[5] - a[2]) * f, a[6]); }
    }
    await ctx.yield();
  }
  // 2 the streets: every place of each rail every 2 m, from the beam's top down to the sill; a door's half depth and its sway
  const skin = DOOR.depth / 2 + 0.022 * DOOR.drop;
  for (let k = 0; k < TIERS; k++) {
    for (let s = 0, L = tierLength(k); s < L; s += 2) { const p = tierPoint(k, s); for (let y = p[1] - DOOR.drop; y <= p[1] + 0.9; y += 1) take('the doors of street ' + k, p[0], y, p[2], skin); }
    await ctx.yield();
  }
  // 3 the tower: every place of its rail every 1.5 m; a door's ends and middle, its faces, its step and hangers
  const half = DOOR.frameW / 2;
  for (let s = 0; s < tower.TOWER_LENGTH; s += 1.5) {
    const p = tower.towerPoint(s);
    for (let y = p[1] - DOOR.drop; y <= p[1] + 0.7; y += 1.5) for (const e of [-half, 0, half]) for (const side of [-0.58, 0.58]) take('the doors of the tower', p[0] + p[3] * e - p[4] * side, y, p[2] + p[4] * e + p[3] * side, 0);
  }
  await ctx.yield();
  // 4 the marked door on its way: where it is against where the lens is, at the same share of the flight, until it stands
  const MP = [0, 0, 0, 0, 0, 0];
  for (let m = 0; m <= stopU * TOTAL; m += 1) {
    const c = F[fineAt(m)]; marked(m / TOTAL, MP);
    for (let y = MP[1] - DOOR.drop; y <= MP[1] + 0.9; y += 1) for (const e of [-half, 0, half]) {
      const d = Math.hypot(MP[0] + MP[3] * e - c[0], y - c[1], MP[2] + MP[4] * e - c[2]) - skin;
      if (d < air.line.dist) { air.line.dist = d; air.line.what = 'the marked door on its way'; air.line.at = [MP[0], y, MP[2]]; air.line.along = m; }
    }
  }
  air.tube.clear = air.tube.dist >= TUBE.radius;
  return air;
}
