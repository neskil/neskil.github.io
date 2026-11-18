// doors-in-transit: THE WINDING TOWER'S RAIL (the works builder's part), as plain numbers. A double screw about the
// plan's TOWER axis: thread A climbs anticlockwise (seen from above) from the plan's foot to its head, thread B sinks
// clockwise from head to foot, and all the way the two lie APART (half a turn's rise) over and under one another. At
// the head a bend carries A across to B, at the foot another carries B back to A. Each bend is two half circles in
// plan (7.5 m and 4.5 m), so it passes 3 m to one side of the mast and never through it.
// WHY THE BENDS STAND BEYOND THE THREADS' ENDS (LIFT). A door hangs DOOR.drop and the threads lie APART, so a door's
// level sill passes only APART less drop over the other thread's rail; and beside a bend's first metres the other
// thread's last half turn is still climbing (at the foot: still sinking) toward the bend's own height. So a bend does
// not leave its thread level. For its first RAMP metres it runs on at the thread's own climb (the same rise to a
// metre of plan), as the thread itself would, and only then lies level, LIFT over the head (LIFT under the foot),
// where its doors hang wholly inside the screw; and it comes down (up) to the other thread the same way.
// WHERE THE RAIL IS A FIXED BEAM (onBeam): only on a bend's level stretch, and there only from LEAD metres after
// the ramp's end, so that a door and its step stand level before the beam takes them. Everywhere else (the two
// threads, the bends' ramps and those few metres) there is no fixed rail at all: each door rides its own short
// level step.
import { TOWER, DOOR } from './doors-in-transit-plan.js';

const R = TOWER.radius, TURN = 2 * Math.PI * TOWER.turns, RISE = TOWER.head - TOWER.foot;
const C = RISE / TURN;                         // metres of rise per radian
const HEL = Math.hypot(R, C);                   // metres of rail per radian of thread
const LA = TURN * HEL;                          // one thread's length
export const APART = RISE / TOWER.turns / 2;    // the two threads' distance, one over the other
export const S_BIG = 7.5, S_SMALL = R - S_BIG;  // a bend's two radii
const LS = Math.PI * (S_BIG + S_SMALL);         // one bend's length (in plan)
export const TOWER_LENGTH = 2 * LA + 2 * LS;
export const TOWER_SLOPE = C / HEL;             // rise per metre of rail on a thread
export const LIFT = APART / 6;                  // a bend's level stretch stands this far beyond its threads' ends
const CLIMB = C / R;                            // a thread's rise per metre of plan
export const RAMP = LIFT / CLIMB;               // and this much of the bend, at either end, still climbs (sinks) to it
export const LEAD = 1.5;                        // a bend's beam begins this far after its ramp's end
const lift = (t) => Math.min(LIFT, CLIMB * t, CLIMB * (LS - t));
const ramp = (t) => (t < RAMP ? CLIMB : t > LS - RAMP ? -CLIMB : 0);

// A point of the tower's rail at arc length s (wraps): [x, y, z, tx, tz, slope] in the world's own space.
// (tx, tz) is the level unit heading; slope is the rail's rise per metre along it.
export function towerPoint(s) {
  let t = ((s % TOWER_LENGTH) + TOWER_LENGTH) % TOWER_LENGTH, x, y, z, tx, tz, slope = 0;
  if (t < LA) {                                 // thread A, rising, anticlockwise from angle 0
    const a = t / HEL; x = R * Math.cos(a); z = R * Math.sin(a); y = TOWER.foot + C * a; tx = -Math.sin(a); tz = Math.cos(a); slope = TOWER_SLOPE;
  } else if (t < LA + LS) {                     // the head's bend: (R, 0) heading +z  ->  (-R, 0) heading +z
    t -= LA; y = TOWER.head + lift(t); slope = ramp(t);
    if (t < Math.PI * S_BIG) { const f = t / S_BIG; x = (R - S_BIG) + S_BIG * Math.cos(f); z = S_BIG * Math.sin(f); tx = -Math.sin(f); tz = Math.cos(f); }
    else { const f = (t - Math.PI * S_BIG) / S_SMALL; x = -S_BIG + S_SMALL * Math.cos(f); z = -S_SMALL * Math.sin(f); tx = -Math.sin(f); tz = -Math.cos(f); }
  } else if (t < 2 * LA + LS) {                 // thread B, sinking, clockwise from angle pi
    t -= LA + LS; const a = Math.PI - t / HEL; x = R * Math.cos(a); z = R * Math.sin(a); y = TOWER.head - C * (t / HEL); tx = Math.sin(a); tz = -Math.cos(a); slope = -TOWER_SLOPE;
  } else {                                      // the foot's bend: (-R, 0) heading +z  ->  (R, 0) heading +z
    t -= 2 * LA + LS; y = TOWER.foot - lift(t); slope = -ramp(t);
    if (t < Math.PI * S_BIG) { const f = t / S_BIG; x = -(R - S_BIG) - S_BIG * Math.cos(f); z = S_BIG * Math.sin(f); tx = Math.sin(f); tz = Math.cos(f); }
    else { const f = (t - Math.PI * S_BIG) / S_SMALL; x = S_BIG - S_SMALL * Math.cos(f); z = -S_SMALL * Math.sin(f); tx = Math.sin(f); tz = -Math.cos(f); }
  }
  return [TOWER.x + x, y, TOWER.z + z, tx, tz, slope];
}
// Which part of the course a place lies on: 0 thread A, 1 the head's bend, 2 thread B, 3 the foot's bend.
export function towerPart(s) { const t = ((s % TOWER_LENGTH) + TOWER_LENGTH) % TOWER_LENGTH; return t < LA ? 0 : t < LA + LS ? 1 : t < 2 * LA + LS ? 2 : 3; }

// The tower's rail as a closed run of points about every `step` metres (for the iron).
export function towerRun(step = 1.6) {
  const n = Math.round(TOWER_LENGTH / step), out = [];
  for (let i = 0; i < n; i++) { const p = towerPoint(i * TOWER_LENGTH / n); out.push([p[0], p[1], p[2]]); }
  return out;
}

// The height of thread A's rail (or B's) at an angle about the axis, on its turn number (0, 1, 2): for the mast's arms.
export function threadHeight(thread, angle, turn) {
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (thread === 0) return TOWER.foot + C * (a + 2 * Math.PI * turn);
  const b = ((a - Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);      // B stands at angle pi at the foot and rises anticlockwise
  return TOWER.foot + C * (b + 2 * Math.PI * turn);
}
export const TOWER_INFO = { R, C, HEL, LA, LS };
// A bend's fixed beam: its level stretch. beamAt(bend, k): the beam's place a share k along it (0 one end, 1 the other).
export function onBeam(s) {
  const t = ((s % TOWER_LENGTH) + TOWER_LENGTH) % TOWER_LENGTH, b = t < LA ? -1 : t < LA + LS ? t - LA : t < 2 * LA + LS ? -1 : t - 2 * LA - LS;
  return b >= RAMP + LEAD && b <= LS - RAMP - LEAD;
}
export const BEAM_LENGTH = LS - 2 * (RAMP + LEAD);
export function beamAt(bend, k) { return towerPoint((bend ? 2 * LA + LS : LA) + RAMP + LEAD + BEAM_LENGTH * k); }

// A TOWER DOOR'S CARRIER, as its true boxes [x0, x1, y0, y1, z0, z1] about the rail's point over the door's middle
// (x along the rail, y up from the rail's foot, z across): what the works draw and what the tower's count counts.
// It is small and stands close under the rail's point, because the thread above passes so near (see the count):
// two small trucks 0.7 m either side of the middle, a level spreader under them from which the two straps hang,
// and (wherever no beam carries the door) a short level step the trucks ride in.
export const GEAR = { truck: 0.7, yoke: 0.3, wheel: 0.155, spread: 1.5, strap: 1.4, hung: 0.33, step: 1.1, stepTop: 0.45 };
export function gearBoxes() {
  const G = GEAR, hang = [['spreader', [-G.spread, G.spread, -0.44, -0.22, -0.12, 0.12]]];
  for (const x of [-G.truck, G.truck]) {
    hang.push(['yoke', [x - G.yoke, x + G.yoke, -0.22, -0.04, -0.56, 0.56]]);
    for (const sz of [-1, 1]) {
      hang.push(['cheek', [x - 0.2, x + 0.2, -0.1, 0.4, sz * 0.54 - 0.04, sz * 0.54 + 0.04]]);
      hang.push(['wheel', [x - G.wheel, x + G.wheel, 0.14, 0.14 + 2 * G.wheel, sz * 0.3 - 0.08, sz * 0.3 + 0.08]]);
    }
  }
  const straps = [-G.strap, G.strap].map((x) => ['strap', [x - 0.08, x + 0.08, -DOOR.hanger - 0.3, -G.hung, -0.06, 0.06]]);
  const door = ['leaf', [-DOOR.frameW / 2, DOOR.frameW / 2, -DOOR.drop, -DOOR.drop + DOOR.frameH, -DOOR.depth / 2, DOOR.depth / 2]];
  return { hang, straps, door, step: ['step', [-G.step, G.step, 0, G.stepTop, -0.4, 0.4]], stepOn: G.truck + G.yoke };
}
