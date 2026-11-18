// bridges-of-marigold, the city: CABLE CARS. Up to four cables hang between neighbouring ring towers on the side away
// from the great tower; each keeps CLEAR_CAR metres and more from the flown line along its whole length (the cabin's
// own depth counted). On each a small lit cabin (a plain box with warm windows under a hanger, nobody seen) glides to
// and fro by the world's own time (the work file moves the cabins). Stream 'cars' deals the heights, the sag, the start.
import { TOWERS, towerRadius, routeDistance } from './bridges-of-marigold-plan.js';

export const CLEAR_CAR = 17;
const PAIRS = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]], IRON = [0.12, 0.11, 0.14];

// where a cabin's hanger hooks on, a share s of the way along a line
export function carAt(l, s) { return [l.a[0] + (l.b[0] - l.a[0]) * s, l.a[1] + (l.b[1] - l.a[1]) * s - l.sag * 4 * s * (1 - s), l.a[2] + (l.b[2] - l.a[2]) * s]; }

// Lays the cables into G and one cabin (about its hook) into GC; returns the lines: [{ a, b, sag, phase }].
export function layCars(G, GC, rngFor) {
  const rng = rngFor('cars'), lines = [];
  for (const [i, j] of PAIRS) {
    const A = TOWERS[i], B = TOWERS[j], ua = rng(), ub = rng(), up = rng();
    const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, out = (A.x + B.x) * -uz + (A.z + B.z) * ux < 0 ? -1 : 1, nx = -uz * out, nz = ux * out;
    const ya = A.base + (A.top - A.base) * (0.5 + 0.3 * ua), yb = B.base + (B.top - B.base) * (0.5 + 0.3 * ub), ra = towerRadius(i, ya) - 1, rb = towerRadius(j, yb) - 1;
    // its ends on the two towers' outer flanks, half way between the way to the other tower and the way out
    const l = { a: [A.x + ra * (ux + nx) * 0.7071, ya, A.z + ra * (uz + nz) * 0.7071], b: [B.x + rb * (nx - ux) * 0.7071, yb, B.z + rb * (nz - uz) * 0.7071], sag: 5 + 3 * up, phase: up * 6.283 };
    let clear = Infinity;
    for (let q = 0; q <= 16; q++) { const p = carAt(l, q / 16); clear = Math.min(clear, routeDistance(p[0], p[1] - 3, p[2])); }
    if (clear < CLEAR_CAR || lines.length >= 4) continue;
    G.col(IRON).aux(7, 0.4);
    for (let q = 0; q < 10; q++) G.beam(carAt(l, q / 10), carAt(l, (q + 1) / 10), 0.14);
    lines.push(l);
  }
  // the cabin: a hanger, a roof, a body with a lit window in each side
  GC.col(IRON).aux(7, 0.4).beam([0, 0, 0], [0, -1.3, 0], 0.18);
  GC.col([0.75, 0.2, 0.12]).aux(1, 0.8).box(0, -1.5, 0, 2.7, 0.22, 2.0, 0, true);
  GC.col([0.85, 0.6, 0.12]).aux(1, 0.8).box(0, -3.5, 0, 2.4, 2.0, 1.7, 0, true);
  GC.col([1, 0.66, 0.3]).aux(2, 2.2);
  for (const sd of [-1, 1]) {
    const z = sd * 0.86, x = sd * 1.21;
    if (sd > 0) { GC.quad([-0.95, -2.75, z], [0.95, -2.75, z], [0.95, -1.9, z], [-0.95, -1.9, z]); GC.quad([x, -2.75, 0.6], [x, -2.75, -0.6], [x, -1.9, -0.6], [x, -1.9, 0.6]); }
    else { GC.quad([0.95, -2.75, z], [-0.95, -2.75, z], [-0.95, -1.9, z], [0.95, -1.9, z]); GC.quad([x, -2.75, -0.6], [x, -2.75, 0.6], [x, -1.9, 0.6], [x, -1.9, -0.6]); }
  }
  return lines;
}
