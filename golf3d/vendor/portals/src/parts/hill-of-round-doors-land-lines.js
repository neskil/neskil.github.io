// hill-of-round-doors, the land builder's part: THE LINES OF THE PLAN AS THE LAND NEEDS THEM, all worked out from the
// plan's own exports (nothing retyped): the middle line of the road and the lanes as one chain of straight pieces
// (the same pieces the plan's ground is benched along), how far a place lies from that line and on which side, each
// home's own frame, the hall's footprint, and the flown line itself as a fine chain for the counts.
import { ROAD, LANE1, LANE2, BEND, laneAt, bendAt, LANE_HALF, GARDEN, HOMES, TOP, HALL, FIELD, BRIDGE, MILL, streamZ, streamHalf } from './hill-of-round-doors-plan.js';

// the middle line of the road (side 0: level either hand), lane 1 and the bend (the hill on the right hand of the
// way up: side 1) and lane 2 (side -1), in the plan's own order
export const WAY = (() => {
  const S = [], add = (a, b, side) => { const ex = b[0] - a[0], ez = b[2] - a[2]; S.push({ ax: a[0], ay: a[1], az: a[2], bx: b[0], by: b[1], bz: b[2], side, ex, ez, len: Math.hypot(ex, ez), inv: 1 / (ex * ex + ez * ez) }); };
  for (let i = 0; i < ROAD.length - 1; i++) add(ROAD[i], ROAD[i + 1], 0);
  add(laneAt(LANE1, 0), laneAt(LANE1, LANE1.length), 1);
  for (let i = 0; i < 12; i++) add(bendAt(i / 12), bendAt((i + 1) / 12), 1);
  add(laneAt(LANE2, 0), laneAt(LANE2, LANE2.length + 3), -1);
  let s = 0; for (const g of S) { g.s0 = s; s += g.len; }
  return S;
})();
export const WAY_LENGTH = WAY[WAY.length - 1].s0 + WAY[WAY.length - 1].len;

// Where a place lies by the way: out.d metres from its middle line, out.up +1 on the hill's side and -1 on the
// valley's (0 by the road), out.s metres along the way from the bridge, out.y the way's level there.
// (asked for every vertex of the ground and every node the plants read: the pieces are compared by their squared
// distances and one root is taken at the end)
export function wayAt(x, z, out) {
  let best = Infinity, g = WAY[0], t = 0;
  for (let i = 0; i < WAY.length; i++) {
    const k = WAY[i], rx = x - k.ax, rz = z - k.az, tk = Math.min(1, Math.max(0, (rx * k.ex + rz * k.ez) * k.inv)), dx = rx - k.ex * tk, dz = rz - k.ez * tk, d2 = dx * dx + dz * dz;
    if (d2 < best) { best = d2; g = k; t = tk; }
  }
  out.d = Math.sqrt(best); out.s = g.s0 + g.len * t; out.y = g.ay + (g.by - g.ay) * t;
  out.up = g.side === 0 ? 0 : (g.ex * (z - g.az) - g.ez * (x - g.ax) > 0 ? 1 : -1) * g.side;
  return out;
}
// The place s metres along the way and off metres to the hill's side of it (to the right hand of the way up by the road).
export function wayPoint(s, off, out) {
  let g = WAY[0]; for (const k of WAY) if (k.s0 <= s) g = k;
  const t = Math.min(1, Math.max(0, (s - g.s0) / g.len)), ex = (g.bx - g.ax) / g.len, ez = (g.bz - g.az) / g.len, sd = g.side === 0 ? 1 : g.side;
  out.x = g.ax + (g.bx - g.ax) * t - ez * off * sd; out.z = g.az + (g.bz - g.az) * t + ex * off * sd;
  out.y = g.ay + (g.by - g.ay) * t; out.tx = ex; out.tz = ez; out.side = g.side;
  return out;
}

// A home's own frame: u metres along its front from the middle, v metres behind the front line (into the hill).
export function homeFrame(h, x, z, out) { const rx = x - h.x, rz = z - h.z; out.v = -(rx * h.fx + rz * h.fz); out.u = rx * h.fz - rz * h.fx; return out; }
// How much of a home's turf mound a place is (1 on the mound, 0 off it), and how much of its levelled garden.
const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const _f = { u: 0, v: 0 };
export function homeAt(x, z, out) {
  out.mound = 0; out.garden = 0; out.front = 99;
  for (const h of HOMES) {
    if (Math.abs(x - h.x) > 34 || Math.abs(z - h.z) > 34) continue;
    homeFrame(h, x, z, _f); const au = Math.abs(_f.u);
    if (_f.v >= 0.6) out.mound = Math.max(out.mound, (1 - ss(h.w - 0.5, h.w + 1.5, au)) * ss(0.6, 1.4, _f.v) * (1 - ss(14, 20, _f.v)));
    else out.garden = Math.max(out.garden, (1 - ss(h.w, h.w + 2.5, au)) * (1 - ss(8, 10.5, -_f.v)));
    if (au < h.w + 3) out.front = Math.min(out.front, Math.abs(_f.v));
  }
  return out;
}
// The hall's footprint, where the land leaves its ground out: the plan's (to depth + 1 behind the green door's front,
// half either side of the door's line), begun at the front line itself: HALL_FROM m behind it, inside the thickness
// of the home's own wall, so that no turf stands in the round opening and none ends short of the wall's foot.
const HALL_FROM = 0.05;
export function inHall(x, z) { homeFrame(TOP, x, z, _f); return _f.v > HALL_FROM && _f.v < HALL.depth + 1 && Math.abs(_f.u) < HALL.half; }
// The hall's footprint for a shader: the front's middle (x, z), the way it faces (fx, fz), and v0, v1, half.
export const HALL_BOX = { x: TOP.x, z: TOP.z, fx: TOP.fx, fz: TOP.fz, v0: HALL_FROM, v1: HALL.depth + 1, half: HALL.half };
// How far a place is inside the party field's oval (under 1: on the level lawn).
export function fieldAt(x, z) { const u = (x - FIELD.x) / FIELD.rx, v = (z - FIELD.z) / FIELD.rz; return Math.sqrt(u * u + v * v); }
// Metres from the water's edge: under 0 in the stream, over 0 on land.
export function shoreAt(x, z) { return Math.abs(z - streamZ(x)) - streamHalf(x); }
// Is a place on the bridge's own strip (the road over the water)?
export function onBridge(x, z, margin = 0) { return Math.abs(x - BRIDGE.x) < BRIDGE.width / 2 + margin && z > BRIDGE.z1 - margin && z < BRIDGE.z0 + margin; }
// Is a place by the field builder's works on the water, where nothing of the land's may stand: the mill, its wheel
// pit and race wall and the ground east of the mill as far as the road; the bridge's deck and both its ends?
export function nearWorks(x, z) {
  if (x > MILL.x0 - 8 && x < MILL.x1 + 22 && z > MILL.z0 - 8 && z < MILL.wheel.z + MILL.wheel.thick / 2 + 7) return true;
  return Math.abs(x - BRIDGE.x) < BRIDGE.width / 2 + 5 && z > BRIDGE.z1 - 10 && z < BRIDGE.z0 + 10;
}
export { LANE_HALF, GARDEN };
