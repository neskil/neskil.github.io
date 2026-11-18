// doors-in-transit: THE YARD (a piece of the joiner's shed): the standing things of such a works, in groups on the arena
// floor: stacks of spare I-beam rail on timber bearers, racks of spare wheeled hangers, rolling iron step-ladders for
// reaching the hangers, hand trolleys with crates and heaps of chain, cast-iron bollards. (What lies flush in the paving,
// the rails, the turntable, the ribs' kerbs, is drawn by the floor's own material.) No door stands on the ground, nothing
// is lettered, there is no figure. Every thing keeps 2 m of clear air from the flown line, asked of the route part.
// One mesh of the shed's iron material, kind 3; w picks the stuff: 1 black iron, 2 bare rail steel, 3 timber,
// 4 grey-blue paint, 5 buff paint.
import { SHED, TURNTABLE, tierRadius } from './doors-in-transit-plan.js';
import { routeTable, nearestOnRoute } from './doors-in-transit-works-route.js';
import { rod } from './doors-in-transit-shed-bay.js';

const CLEAR = 2.0;
// the long walls' arcade (the shed dresses its side walls from these numbers): a pier on every rib's line, and in every
// rib bay two round-headed arches, 2 * hw wide and dep deep, their middles off either side of the bay's middle
export const ARCADE = { pierW: 3.2, hw: 3.3, dep: 1.8, gap: 0.2 };
ARCADE.off = (SHED.ribStep - ARCADE.pierW) / 4 + ARCADE.gap;
// the tracks set flush in the paving (the floor's material draws them from these numbers; the bollards stand by them):
// both run through the turntable and only CROSS the flown line. gauge: between the two rails' middles; bed: half the
// width of the bed of setts. The CROSS track runs square across the hall, reach to each side (3 m short of the lowest
// street). The THROUGH track comes in by a gated doorway in one long wall, crosses the turntable and leaves by the
// doorway opposite in the other wall. doorZ: the two doorways' middles along the hall: in the +x wall the first arch
// beyond the middle pier of the wall, in the -x wall the arch that the line through the turntable meets (an arch's
// middle too, because the turntable lies midway between two ribs). slant, the track's angle to the hall's axis,
// follows from those two ends; slantReach: its two arms from the turntable's middle to the backs of the doorways
const doorZ = [(SHED.z0 + SHED.z1) / 2 + SHED.ribStep / 2 - ARCADE.off, 0];
doorZ[1] = TURNTABLE.z + (TURNTABLE.z - doorZ[0]) * (TURNTABLE.x - SHED.x0) / (SHED.x1 - TURNTABLE.x);
const slant = Math.atan2(SHED.x1 - TURNTABLE.x, doorZ[0] - TURNTABLE.z);
export const TRACKS = { gauge: 3.0, bed: 2.7, reach: tierRadius(0) - 3, doorZ, slant,
  slantReach: [(SHED.x1 + ARCADE.dep - TURNTABLE.x) / Math.sin(slant), (TURNTABLE.x - SHED.x0 + ARCADE.dep) / Math.sin(slant)] };

export function buildYard(iron) {
  const table = routeTable(1), stuff = (w) => iron.set({ kind: 3, w });
  let left = 0, stand = 0;
  // a place is free when a ball of radius r about (x, y, z) keeps the clear air from the flown line
  const free = (x, y, z, r) => { const ok = nearestOnRoute(table, x, y, z).dist >= CLEAR + r; if (ok) stand++; else left++; return ok; };
  // a frame turned by a heading about (cx, cz): local (u along, y up, v across) to the hall
  const frame = (cx, cz, heading) => { const c = Math.cos(heading), s = Math.sin(heading); return (u, y, v) => [cx + u * c - v * s, y, cz + u * s + v * c]; };
  // a box in a frame (all six faces; the iron is two-sided)
  const boxIn = (F, u0, u1, y0, y1, v0, v1) => {
    const p = (u, y, v) => F(u, y, v);
    iron.quad(p(u0, y0, v1), p(u1, y0, v1), p(u1, y1, v1), p(u0, y1, v1)); iron.quad(p(u1, y0, v0), p(u0, y0, v0), p(u0, y1, v0), p(u1, y1, v0));
    iron.quad(p(u1, y0, v1), p(u1, y0, v0), p(u1, y1, v0), p(u1, y1, v1)); iron.quad(p(u0, y0, v0), p(u0, y0, v1), p(u0, y1, v1), p(u0, y1, v0));
    iron.quad(p(u0, y1, v1), p(u1, y1, v1), p(u1, y1, v0), p(u0, y1, v0));
  };
  const bar = (F, a, b, hw, hh) => rod(iron, F(a[0], a[1], a[2]), F(b[0], b[1], b[2]), hw, hh);

  // a stack of spare rail: I-beams side by side in layers on timber bearers, battens between the layers
  const stack = (cx, cz, heading, len, layers, across = 4) => {
    const top = 0.5 + layers * 0.98;
    if (!free(cx, top, cz, len / 2)) return;
    const F = frame(cx, cz, heading), wd = across * 0.78;
    for (let l = 0; l < layers; l++) {
      const y = 0.5 + l * 0.98, off = (l % 2) * 0.5 - 0.25, n = across - (l === layers - 1 && layers > 1 ? 1 : 0);
      stuff(3); for (const u of [-len * 0.36, 0, len * 0.36]) boxIn(F, u - 0.25, u + 0.25, y - (l ? 0.13 : 0.5), y, -wd / 2 - 0.2, wd / 2 + 0.2);
      stuff(2);
      for (let i = 0; i < n; i++) {
        const v = (i - (n - 1) / 2) * 0.78, u0 = -len / 2 + off + (i % 2) * 0.4, u1 = len / 2 + off - ((i + l) % 3) * 0.5;
        boxIn(F, u0, u1, y, y + 0.1, v - 0.3, v + 0.3); boxIn(F, u0, u1, y + 0.75, y + 0.85, v - 0.3, v + 0.3);
        iron.quad(F(u0, y + 0.1, v + 0.05), F(u1, y + 0.1, v + 0.05), F(u1, y + 0.75, v + 0.05), F(u0, y + 0.75, v + 0.05));
        iron.quad(F(u0, y + 0.1, v), F(u0, y + 0.75, v), F(u0, y + 0.75, v + 0.05), F(u0, y + 0.1, v + 0.05));
      }
    }
  };
  // a rack of spare hangers: a rail on two trestles, wheeled hangers hung along it
  const rack = (cx, cz, heading, len) => {
    if (!free(cx, 4.9, cz, len / 2)) return;
    const F = frame(cx, cz, heading), h = 4.5;
    stuff(4);
    for (const u of [-len / 2 + 0.4, len / 2 - 0.4]) { bar(F, [u, 0, -1.3], [u, h, 0], 0.11, 0.11); bar(F, [u, 0, 1.3], [u, h, 0], 0.11, 0.11); bar(F, [u, 0.12, -1.5], [u, 0.12, 1.5], 0.14, 0.12); bar(F, [u, 2.2, -0.66], [u, 2.2, 0.66], 0.07, 0.07); }
    stuff(2); bar(F, [-len / 2, h + 0.15, 0], [len / 2, h + 0.15, 0], 0.16, 0.24);
    const n = Math.floor((len - 1.6) / 1.05);
    for (let i = 0; i < n; i++) {
      const u = -len / 2 + 1.0 + i * 1.05, drop = 1.15 + ((i * 7) % 3) * 0.12;
      stuff(1); boxIn(F, u - 0.24, u + 0.24, h - 0.32, h + 0.02, -0.22, 0.22); bar(F, [u, h - 0.32, 0], [u, h - 0.32 - drop, 0], 0.05, 0.035);
      boxIn(F, u - 0.05, u + 0.05, h - 0.5 - drop, h - 0.3 - drop, -0.3, 0.3);
    }
  };
  // a rolling step-ladder: a wheeled base, two strings with treads up to a railed platform
  const ladder = (cx, cz, heading) => {
    if (!free(cx, 5.2, cz, 2.4)) return;
    const F = frame(cx, cz, heading), ph = 3.9, run = 2.5;
    stuff(4);
    for (const v of [-0.75, 0.75]) {
      bar(F, [-run, 0.35, v], [0, ph, v], 0.06, 0.14); bar(F, [1.5, 0.35, v], [1.5, ph + 1.15, v], 0.07, 0.07); bar(F, [0, 0.35, v], [0, ph + 1.15, v], 0.07, 0.07);
      bar(F, [-run, 0.35, v], [1.5, 0.35, v], 0.08, 0.08); bar(F, [0, ph + 1.15, v], [1.5, ph + 1.15, v], 0.05, 0.05); bar(F, [0, ph + 0.6, v], [1.5, ph + 0.6, v], 0.04, 0.04);
      bar(F, [-run, 0.35, v], [-run + 0.62, 2.4, v], 0.04, 0.04); bar(F, [-run + 0.62, 2.4, v], [0, ph + 1.15, v], 0.04, 0.04);          // a hand rail up the flight
    }
    bar(F, [1.5, ph + 1.15, -0.75], [1.5, ph + 1.15, 0.75], 0.05, 0.05); bar(F, [1.5, 0.35, -0.75], [1.5, 0.35, 0.75], 0.08, 0.08); bar(F, [0.2, 0.35, -0.75], [1.5, ph - 0.1, -0.75], 0.04, 0.04); bar(F, [0.2, 0.35, 0.75], [1.5, ph - 0.1, 0.75], 0.04, 0.04);
    stuff(1); boxIn(F, 0, 1.5, ph - 0.08, ph, -0.75, 0.75);
    for (let i = 1; i <= 8; i++) { const t = i / 9, u = -run + run * t, y = 0.35 + (ph - 0.35) * t; boxIn(F, u - 0.02, u + 0.3, y - 0.04, y, -0.72, 0.72); }
    for (const [u, v] of [[-run + 0.2, -0.82], [-run + 0.2, 0.82], [1.3, -0.82], [1.3, 0.82]]) boxIn(F, u - 0.22, u + 0.22, 0, 0.44, v - 0.07, v + 0.07);
  };
  // a hand trolley: a timber deck on four iron wheels, a push handle; load: 0 none, 1 a crate, 2 a heap of chain in a tray
  const trolley = (cx, cz, heading, load) => {
    if (!free(cx, 2.7, cz, 2.2)) return;
    const F = frame(cx, cz, heading);
    stuff(3); boxIn(F, -1.6, 1.6, 0.72, 0.9, -0.85, 0.85);
    stuff(1); for (const [u, v] of [[-1.1, -0.8], [-1.1, 0.8], [1.1, -0.8], [1.1, 0.8]]) boxIn(F, u - 0.3, u + 0.3, 0, 0.6, v - 0.08, v + 0.08);
    bar(F, [-1.1, 0.62, -0.8], [-1.1, 0.62, 0.8], 0.06, 0.06); bar(F, [1.1, 0.62, -0.8], [1.1, 0.62, 0.8], 0.06, 0.06);
    stuff(5); bar(F, [1.55, 0.9, -0.7], [1.75, 2.55, -0.7], 0.045, 0.045); bar(F, [1.55, 0.9, 0.7], [1.75, 2.55, 0.7], 0.045, 0.045); bar(F, [1.75, 2.55, -0.7], [1.75, 2.55, 0.7], 0.05, 0.05);
    if (load === 1) { stuff(3); boxIn(F, -1.3, 0.5, 0.9, 2.0, -0.7, 0.7); stuff(1); bar(F, [-1.3, 1.45, 0.71], [0.5, 1.45, 0.71], 0.02, 0.06); bar(F, [-1.3, 1.45, -0.71], [0.5, 1.45, -0.71], 0.02, 0.06); }
    if (load === 2) {
      stuff(3); boxIn(F, -1.35, 0.6, 0.9, 1.25, -0.75, 0.75);
      stuff(1); const t = F(-0.4, 1.75, 0.05), c = [[-1.25, -0.65], [0.5, -0.65], [0.5, 0.65], [-1.25, 0.65]];
      for (let i = 0; i < 4; i++) iron.poly([F(c[i][0], 1.25, c[i][1]), F(c[(i + 1) % 4][0], 1.25, c[(i + 1) % 4][1]), t]);
    }
  };
  // a cast-iron bollard: an eight-sided post with a low cap
  const bollard = (cx, cz) => {
    if (!free(cx, 1.7, cz, 0.5)) return;
    stuff(1);
    for (let i = 0; i < 8; i++) {
      const a0 = Math.PI / 4 * i, a1 = a0 + Math.PI / 4, r = 0.3, p0 = [cx + r * Math.cos(a0), cz + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cz + r * Math.sin(a1)];
      iron.quad([p1[0], 0, p1[1]], [p0[0], 0, p0[1]], [p0[0], 1.45, p0[1]], [p1[0], 1.45, p1[1]]);
      iron.poly([[p0[0], 1.45, p0[1]], [cx, 1.72, cz], [p1[0], 1.45, p1[1]]]);
    }
  };
  return { stack, rack, ladder, trolley, bollard, standing: () => stand, leftOut: () => left };
}

// the yard set out, group by group (metres; the plan's places: the lowest street hangs over x = +-32, the tower stands at
// z = 26, the turntable lies where the plan puts it, the bay's mouth at z = -62). Returns { standing, leftOut }: how many
// things stand, and how many were left out for want of clear air (none, at these places). With a ctx it rests between
// the groups, so that no build step is long.
export async function furnishYard(iron, ctx) {
  const y = buildYard(iron), Q = Math.PI / 2, rest = async () => { if (ctx) await ctx.yield(); };
  const T = TURNTABLE, th = Q - TRACKS.slant;                                 // th: the through track's bearing from +x
  // on the arena's +x side and under the street's doors (the two shorter stacks of the arena lie as the through track
  // runs, not as the hall does)
  y.stack(9.5, 6, Q, 20, 3); y.stack(13, -12, th, 16, 2); y.rack(14.5, 1, Q, 9.5);
  y.trolley(17, 26, 0.4, 1); y.trolley(19, -15, -0.3, 2); y.trolley(24.5, 8, Q, 0); y.ladder(27.2, 22, 0); y.ladder(27.2, -14, 0);
  await rest();
  // between the lowest street and the next, on both sides of the hall
  y.stack(39, 30, Q, 22, 3); y.stack(39.5, -30, Q, 18, 2); y.rack(38.5, 2, Q, 11); y.ladder(36.8, 46, Math.PI); y.trolley(41, 14, Q, 1); y.trolley(37.5, -10, 1.2, 2);
  y.stack(-39, -16, Q, 20, 3); y.rack(-38.5, 26, Q, 11); y.stack(-39.5, 52, Q, 16, 2); y.trolley(-41, 8, Q, 1); y.ladder(-36.8, -52, 0);
  await rest();
  // the arena's other side
  y.stack(-11.5, 8, Q, 20, 3); y.stack(-13.5, -13, th, 14, 2); y.rack(-15.5, -4, Q, 9.5); y.ladder(-27.2, 12, Math.PI); y.ladder(-27.2, -50, Math.PI);
  y.trolley(-17, 24, 2.6, 1); y.trolley(-9, -17, 0.2, 0); y.trolley(-22, -6, 1.9, 2);
  // bollards: round the turntable, one at each side of the two wide gaps between its tracks, each with its skin on the
  // edge of a track's setts (none stands within 5 m of the hall's axis), and two at each end of the cross track
  // (the through track ends at its gates)
  const side = TRACKS.bed + 1.2, ring = T.r + 2.6, off = Math.asin((TRACKS.bed + 0.3) / ring);
  for (const a of [th + off, Math.PI - off, th + Math.PI + off, 2 * Math.PI - off]) y.bollard(T.x + ring * Math.cos(a), T.z + ring * Math.sin(a));
  for (const sg of [-1, 1]) for (const dv of [-side, side]) y.bollard(T.x + sg * (TRACKS.reach + 0.6), T.z + dv);
  // between the turntable and the bay, aside of the hall's axis: trolleys, a ladder, a rack (nothing stands there
  // within 6 m of the axis)
  y.trolley(8.5, -49, 2.2, 1); y.trolley(-8, -45, -0.5, 2); y.trolley(15, -40, 0.9, 0); y.ladder(-16.5, -54, Q); y.rack(13.5, -36, 0.5, 8);
  await rest();
  // beyond the tower, inside the street's far bend; and at the two ends of the hall
  y.stack(0, 54, 0, 18, 3); y.rack(-12, 64, 0.3, 9); y.trolley(7, 44.5, 0.8, 2); y.trolley(-6, 72, 2.9, 1); y.ladder(10, 68, Q); y.stack(14, 78, 0.25, 14, 2);
  y.stack(-20, 112, 0, 20, 3); y.stack(22, 118, 0, 16, 2); y.rack(0, 108, 0, 11); y.trolley(10, 104, 0.4, 1); y.trolley(-30, 122, 2, 0); y.ladder(34, 106, Q);
  y.stack(-24, -112, 0, 18, 2); y.stack(20, -118, 0, 20, 3); y.rack(0, -106, 0, 10); y.trolley(-8, -124, 1, 1);
  return { standing: y.standing(), leftOut: y.leftOut() };
}
