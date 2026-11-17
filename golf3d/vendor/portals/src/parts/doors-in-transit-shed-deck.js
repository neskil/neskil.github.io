// doors-in-transit: THE FAR DECK (a piece of the joiner's shed, made for the closer version): more of the works' own
// gear on the bare ends and sides of the floor, where the first version's deck lay empty: low wagons carrying spare
// doors LYING FLAT, stacks of spare rail, barrels, crates, spare buffer stops. Nothing is lettered, there is no figure,
// and no door stands on the ground. EVERY THING KEEPS 9 m OF CLEAR AIR FROM THE FLOWN LINE (asked of the route part)
// and stands off the marked door's whole run in plan (its street from its start to the points, the spur's quarter
// circle and straight, by the plan), off the lowest street's doors, both tracks' beds, the turntable, the tower's foot,
// the bay with its gates, the walls' piers and the mouth to the far store; a thing that cannot is left out and counted.
// One mesh with the yard's (the shed's iron material, kind 3; w picks the stuff: 1 black iron, 2 bare rail steel,
// 3 timber, 4 grey-blue paint, 5 buff paint, 6 grey primer).
import { SHED, TURNTABLE, TOWER, MARKED, SPUR, BAY, DOOR, STRAIGHT, tierRadius } from './doors-in-transit-plan.js';
import { routeTable, nearestOnRoute } from './doors-in-transit-works-route.js';
import { rod } from './doors-in-transit-shed-bay.js';
import { buildYard, TRACKS } from './doors-in-transit-shed-yard.js';

export const DECK = { air: 9, run: 4, skin: 1.5 };      // clear air from the flown line; plan metres off the marked door's run; a skin round what is fixed
const HALF = (SHED.x1 - SHED.x0) / 2;

// how far a place of the floor lies, in plan, from the marked door's run
export function runDist(x, z) {
  const R = tierRadius(0), seg = (ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - ax - dx * t, z - az - dz * t);
  };
  const a = Math.atan2(z - SPUR.cz, x - SPUR.cx), onArc = a <= 0 && a >= -Math.PI / 2;      // the quarter circle: from +x round to -z
  const arc = onArc ? Math.abs(Math.hypot(x - SPUR.cx, z - SPUR.cz) - SPUR.r) : Math.min(Math.hypot(x - R, z - SPUR.cz), Math.hypot(x - SPUR.cx, z - SPUR.endZ));
  return Math.min(seg(R, MARKED.startZ, R, MARKED.switchZ), arc, seg(SPUR.cx, SPUR.endZ, SPUR.bufferX, SPUR.endZ));
}
// why a thing of footprint radius r and height h may not stand at (x, z): '' if it may
export function deckBar(table, x, z, r, h) {
  const T = TURNTABLE, s = DECK.skin, sn = Math.sin(TRACKS.slant), cs = Math.cos(TRACKS.slant), tx = x - T.x, tz = z - T.z;
  if (nearestOnRoute(table, x, h / 2, z).dist < DECK.air + Math.max(r, h / 2)) return 'the flown line';
  if (runDist(x, z) < DECK.run + r) return 'the marked door\'s run';
  if (Math.abs(Math.hypot(x, Math.max(Math.abs(z) - STRAIGHT, 0)) - tierRadius(0)) < s + r) return 'the lowest street';
  if (Math.abs(tz) < TRACKS.bed + s + r && Math.abs(tx) < TRACKS.reach + s + r) return 'the cross track';
  if (Math.abs(sn * tz - cs * tx) < TRACKS.bed + s + r) return 'the through track';
  if (Math.hypot(tx, tz) < T.r + 4 + r || Math.hypot(x - TOWER.x, z - TOWER.z) < TOWER.radius + 6 + r) return 'the turntable or the tower';
  if (x > BAY.x0 - 2 - r && x < BAY.x1 + 2 + r && z > BAY.zBack - 2 - r && z < BAY.zFront + 8 + r) return 'the bay';
  if (Math.abs(x) > HALF - 3.4 - r || z > SHED.z1 - 4 - r || z < SHED.z0 + 6 + r) return 'a wall or the mouth';
  return '';
}

// the far deck set out. Returns { standing, leftOut, things: [{ what, x, z, r, h, bar }] }; with a ctx it rests between groups.
export async function furnishDeck(iron, ctx) {
  const table = routeTable(1), yard = buildYard(iron), Q = Math.PI / 2, things = [];
  const stuff = (w) => iron.set({ kind: 3, w }), rest = async () => { if (ctx) await ctx.yield(); };
  const free = (what, x, z, r, h) => { const bar = deckBar(table, x, z, r, h); things.push({ what, x, z, r, h, bar }); return !bar; };
  const frame = (cx, cz, heading) => { const c = Math.cos(heading), s = Math.sin(heading); return (u, y, v) => [cx + u * c - v * s, y, cz + u * s + v * c]; };
  const boxIn = (F, u0, u1, y0, y1, v0, v1) => {
    iron.quad(F(u0, y0, v1), F(u1, y0, v1), F(u1, y1, v1), F(u0, y1, v1)); iron.quad(F(u1, y0, v0), F(u0, y0, v0), F(u0, y1, v0), F(u1, y1, v0));
    iron.quad(F(u1, y0, v1), F(u1, y0, v0), F(u1, y1, v0), F(u1, y1, v1)); iron.quad(F(u0, y0, v0), F(u0, y0, v1), F(u0, y1, v1), F(u0, y1, v0));
    iron.quad(F(u0, y1, v1), F(u1, y1, v1), F(u1, y1, v0), F(u0, y1, v0));
  };
  const bar = (F, a, b, hw, hh) => rod(iron, F(a[0], a[1], a[2]), F(b[0], b[1], b[2]), hw, hh);

  // a low wagon with spare doors lying flat: a timber deck on six iron wheels with a draw bar; on it the doors in their
  // frames, one on another on battens, none square on the one below; the top one shows its leaf (paints: bottom to top)
  const wagon = (cx, cz, heading, paints) => {
    const n = paints.length, hl = DOOR.frameH / 2, hw = DOOR.frameW / 2, top = 1.0 + n * 0.62;
    if (!free('wagon of ' + n + ' doors', cx, cz, Math.hypot(hl + 0.5, hw + 0.3), top)) return;
    const F = frame(cx, cz, heading);
    stuff(3); boxIn(F, -hl - 0.5, hl + 0.5, 0.78, 1.0, -hw - 0.3, hw + 0.3);
    stuff(1);
    for (const u of [-hl * 0.7, 0, hl * 0.7]) { for (const v of [-hw - 0.1, hw + 0.1]) boxIn(F, u - 0.42, u + 0.42, 0, 0.84, v - 0.1, v + 0.1); bar(F, [u, 0.42, -hw], [u, 0.42, hw], 0.07, 0.07); }
    bar(F, [hl + 0.5, 0.86, 0], [hl + 2.3, 0.5, 0], 0.07, 0.07);
    for (let i = 0; i < n; i++) {
      const y0 = 1.14 + i * 0.62, y1 = y0 + 0.48, du = ((i * 5) % 3 - 1) * 0.14, dv = ((i * 7) % 3 - 1) * 0.1, m = 0.36;
      stuff(3); for (const u of [-hl * 0.6, 0, hl * 0.6]) boxIn(F, u - 0.12, u + 0.12, y0 - 0.14, y0, -hw, hw);
      stuff(paints[i]); boxIn(F, -hl + du, hl + du, y0, y1, -hw + dv, hw + dv);
      if (i < n - 1) continue;
      stuff(paints[i] === 4 ? 6 : 4);      // the top door's leaf within its frame, and its two ledges
      iron.quad(F(-hl + du + m, y1 + 0.012, hw + dv - m), F(hl + du - m, y1 + 0.012, hw + dv - m), F(hl + du - m, y1 + 0.012, -hw + dv + m), F(-hl + du + m, y1 + 0.012, -hw + dv + m));
      for (const u of [-hl * 0.5, hl * 0.5]) boxIn(F, u + du - 0.2, u + du + 0.2, y1, y1 + 0.07, -hw + dv + m + 0.1, hw + dv - m - 0.1);
    }
  };
  // a barrel standing on end: eight faces bulging to the belly, a head of the staves' own timber, two hoops of dull steel
  // below the belly's overhang (seen from above a barrel is one plain timber shape: no ring, no dark middle), and
  // never two alone: three or more, of unlike sizes, in an uneven huddle
  const barrel = (cx, cz, r, h) => {
    const ring = (rr, yy) => { const o = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * (i + 0.5); o.push([cx + rr * Math.cos(a), yy, cz + rr * Math.sin(a)]); } return o; };
    const band = (A, B) => { for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; iron.quad(A[j], A[i], B[i], B[j]); } };
    const C = ring(r * 0.82, h);
    stuff(3); band(ring(r * 0.82, 0), ring(r, h / 2)); band(ring(r, h / 2), C); iron.poly(C.slice().reverse());
    stuff(2); for (const t of [0.1, 0.3]) band(ring(r * (0.84 + 0.36 * t) + 0.02, h * t), ring(r * (0.84 + 0.36 * (t + 0.06)) + 0.02, h * (t + 0.06)));
  };
  const barrels = (cx, cz, list) => {
    if (!free('barrels', cx, cz, 2.4, 2.2)) return;
    for (const [dx, dz, r, h] of list) barrel(cx + dx, cz + dz, r, h);
  };
  // crates: timber boxes strapped with iron near each end, some one on another: list of [u, v, y0, length, width, height]
  const crates = (cx, cz, heading, list) => {
    if (!free('crates', cx, cz, 3.2, 2.9)) return;
    const F = frame(cx, cz, heading);
    for (const [u, v, y0, l, w, h] of list) {
      stuff(3); boxIn(F, u - l / 2, u + l / 2, y0, y0 + h, v - w / 2, v + w / 2);
      stuff(1); for (const e of [-1, 1]) boxIn(F, u + e * (l / 2 - 0.4) - 0.07, u + e * (l / 2 - 0.4) + 0.07, y0, y0 + h + 0.02, v - w / 2 - 0.02, v + w / 2 + 0.02);
    }
  };
  // a spare buffer stop standing on the floor: two raked frames of rail steel, a timber beam across, two buffer heads
  const buffer = (cx, cz, heading) => {
    if (!free('buffer stop', cx, cz, 2.9, 2.2)) return;
    const F = frame(cx, cz, heading);
    stuff(2); for (const v of [-1.5, 1.5]) { bar(F, [0, 0, v], [0, 2.0, v], 0.1, 0.1); bar(F, [-2.2, 0, v], [0, 1.9, v], 0.09, 0.09); bar(F, [-2.2, 0.1, v], [0.3, 0.1, v], 0.09, 0.09); }
    stuff(3); boxIn(F, -0.05, 0.5, 1.45, 2.05, -2.3, 2.3);      // (the beam alone takes the knock: no round heads, nothing that could read as a pair of eyes)
    stuff(1); for (const v of [-1.5, 1.5]) boxIn(F, -0.12, 0.57, 1.38, 2.12, v - 0.09, v + 0.09);      // an iron strap round the beam at each frame
  };
  // the places (metres): the two ends of the hall, before the mouth and under the +z screen; the long walls' feet;
  // the open deck left of the bay. Wagons and stacks lie as the hall's walls run or square to them, never in a row.
  const yardStack = (cx, cz, heading, len, layers) => { if (free('stack of rail', cx, cz, len / 2, 0.5 + layers * 0.98)) yard.stack(cx, cz, heading, len, layers); };
  const B3 = [[0, 0, 0.78, 2.1], [1.7, 0.5, 0.62, 1.6], [0.7, -1.6, 0.74, 2.0]], B4 = [[0, 0, 0.78, 2.1], [-1.6, 0.7, 0.66, 1.7], [0.2, 1.7, 0.74, 2.0], [-1.3, -1.2, 0.6, 1.5]];
  const B5 = [[0, 0, 0.78, 2.1], [1.7, 0.4, 0.66, 1.7], [0.5, 1.7, 0.74, 2.0], [-1.4, 1.0, 0.6, 1.5], [-0.9, -1.3, 0.78, 2.1]];
  const C3 = [[-0.9, 0, 0, 2.2, 1.6, 1.4], [1.3, 0.4, 0, 1.8, 1.4, 1.2], [-0.6, 0.1, 1.4, 1.8, 1.4, 1.3]], C2 = [[0, 0, 0, 2.4, 1.6, 1.5], [0.2, 1.9, 0, 1.8, 1.4, 1.2]];
  const C4 = [[0, 0, 0, 2.4, 1.6, 1.5], [0, 0, 1.5, 2.0, 1.4, 1.2], [2.6, 0.2, 0, 1.8, 1.4, 1.2]];
  // the -z end, either side of the bay and before the mouth to the far store
  wagon(-46, -104, 0.12, [6, 5, 4]); wagon(46, -100, Q - 0.2, [5, 6, 4, 5]); barrels(31, -128, B3); crates(-52, -128, 0.3, C3); buffer(58, -124, Math.PI - 0.5);
  yardStack(-76, -120, 0.1, 16, 2); barrels(-68, -98, B5); crates(72, -106, -0.4, C2); wagon(23, -97, 0.05, [4, 5]);
  await rest();
  // the long walls' feet and the lanes between the upper streets
  wagon(86, -44, Q, [6, 4, 5]); barrels(88, 38, B3); crates(-88, -8, Q, C4); buffer(-87, 62, 0.2); yardStack(-83, -78, Q, 18, 3);
  wagon(-67, -40, Q + 0.1, [5, 4, 6, 4]); crates(53, -62, 0.25, C3); buffer(66, 12, Q + 0.3); yardStack(67, -84, Q - 0.08, 16, 2); barrels(-56, 28, B4); wagon(70, 62, Q - 0.1, [4, 6]);
  await rest();
  // the +z end, under the other screen
  wagon(-52, 100, Q + 0.15, [4, 6, 5]); barrels(50, 128, B4); crates(-6, 134, -0.2, C2); buffer(-56, 132, 0.6); wagon(60, 96, 0.1, [5, 4]); yardStack(84, 112, Q, 16, 2);
  return { standing: things.filter((t) => !t.bar).length, leftOut: things.filter((t) => t.bar).length, things };
}
