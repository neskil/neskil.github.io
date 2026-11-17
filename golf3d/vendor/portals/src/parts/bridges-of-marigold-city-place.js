// bridges-of-marigold, the city: WHERE THE CITY MAY STAND OUT. The plan's towerRadius is the mean face of a tower: by
// the lead's leave the city may stand up to OUT metres beyond it wherever the flown line is more than CLEAR_PLAN metres
// off in plan (measured flat, heights left out). This piece measures that from the plan's own knots.
import { ROUTE } from './bridges-of-marigold-plan.js';

export const OUT = 5, CLEAR_PLAN = 40;
export const DRUM = 8.5;                   // the radius of the round house that carries each ring tower's crown
const FINE = [];
for (let i = 0; i < ROUTE.length - 1; i++) for (let j = 0; j < 8; j++) { const t = j / 8, a = ROUTE[i], b = ROUTE[i + 1]; FINE.push([a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t]); }
FINE.push([ROUTE[ROUTE.length - 1][0], ROUTE[ROUTE.length - 1][2]]);
// how far a place is from the flown line in plan (to within about a metre and a half)
export function planDistance(x, z) {
  let best = Infinity;
  for (const p of FINE) { const dx = p[0] - x, dz = p[1] - z, d = dx * dx + dz * dz; if (d < best) best = d; }
  return Math.sqrt(best);
}
// how far beyond the plan's radius a thing at this place may stand (margin: how much nearer the line its own farthest corner may lie)
export function leave(x, z, margin = 0) { return planDistance(x, z) > CLEAR_PLAN + 1.5 + margin ? OUT : 0; }
