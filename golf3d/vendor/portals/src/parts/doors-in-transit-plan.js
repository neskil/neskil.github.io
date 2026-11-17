// doors-in-transit: the numbers the world and its parts share (metres; floor y = 0). Written by the designer; change a
// number only by the designer's word. Everything is built about three and a half times life size, so the lens is small.

export const SCALE = 3.5;

// The shed: a great iron-and-glass hall. Inner faces of its walls:
export const SHED = { x0: -96, x1: 96, z0: -150, z1: 150, spring: 34, crown: 104, ribStep: 20 };

// The stands: FOUR oval rails (changed by the designer at 23:58 UTC on the auditor's finding: six rails packed 10 m and
// 9.5 m apart made a wall of doors row over row), each one a closed racetrack round the arena, stepped back 14 m and up
// 15 m like the tiers of a stadium, so that brick, iron and floor show between every two rows.
// Tier k: two straights along z at x = +-R, from z = -STRAIGHT to z = +STRAIGHT, joined by half circles of radius R about
// (0, +-STRAIGHT). Doors hang BELOW the rail with their faces parallel to it (so they face the arena).
export const TIERS = 4;
export const STRAIGHT = 60;
export function tierRadius(k) { return 32 + 14 * k; }        // 32, 46, 60, 74
export function tierRail(k) { return 13 + 15 * k; }          // rail height: 13, 28, 43, 58
export function tierLength(k) { return 4 * STRAIGHT + 2 * Math.PI * tierRadius(k); }
// A point on tier k's rail at arc length s (any real number; it wraps). s = 0 is at (R, -STRAIGHT), going toward +z
// along the +x straight when dir = 1. Returns [x, y, z, tangentX, tangentZ].
export function tierPoint(k, s) {
  const R = tierRadius(k), L = tierLength(k), y = tierRail(k), half = Math.PI * R;
  let t = ((s % L) + L) % L;
  if (t < 2 * STRAIGHT) return [R, y, -STRAIGHT + t, 0, 1];
  t -= 2 * STRAIGHT;
  if (t < half) { const a = t / R; return [R * Math.cos(a), y, STRAIGHT + R * Math.sin(a), -Math.sin(a), Math.cos(a)]; }
  t -= half;
  if (t < 2 * STRAIGHT) return [-R, y, STRAIGHT - t, 0, -1];
  t -= 2 * STRAIGHT;
  const a = t / R; return [-R * Math.cos(a), y, -STRAIGHT - R * Math.sin(a), Math.sin(a), -Math.cos(a)];
}

// A door in its frame, as it hangs (sizes of the largest kind; kinds vary inside this box):
export const DOOR = { frameW: 4.7, frameH: 8.6, hanger: 1.2, drop: 9.8, pitch: 8.6, depth: 0.5 };   // drop = rail to sill; pitch = centre to centre on a tier (a clear gap of most of a door's width between neighbours)

// The winding tower: a double screw of doors about a vertical axis, one thread rising, one sinking, joined at foot and head.
// The two threads stand half a turn's rise apart, one over the other: (head - foot) / turns / 2 = 12 m. A door hangs 9.8 m
// from its rail, so the sill of a door on the upper thread passes about 1.1 m clear over the lower thread's rail and
// steps. (head was 80, the threads 11 m apart: there a passing sill's end came down to the lower thread's step.)
export const TOWER = { x: 0, z: 26, radius: 12, turns: 3, foot: 14, head: 86 };

// The marked door (an arched plank courtyard door, the only vermilion one). It rides tier 0 along the +x straight toward
// -z, is switched out at SWITCH, runs the spur and stops in the bay. Its opening: 4.5 wide, 8.7 high, round-headed.
// ITS COURSE IS GIVEN BY PLACES: metres of route still to fly to its own frame (the route ends in it). No share of the
// flight is typed anywhere; the works turn each into a place on the route (left metres from the route's end).
//   switchLeft  the points throw it out of its street as we come out of the head turn and first face the bay, about
//               160 m of route from the door;
//   stopLeft    it stands still in the bay before the engine draws the way out (portal.drawWithin, 55 m): at 70 m;
//   openFrom/openTo  the leaf begins to swing when we are 50 m from the door and rests open when we are 20 m from it.
export const MARKED = { w: 4.5, h: 8.7, startZ: 22, switchZ: -48, switchLeft: 160, stopLeft: 70, openFromLeft: 50, openToLeft: 20 };
// The spur: leaves tier 0 at (32, -48) heading -z, a quarter circle of radius 22 about (10, -48) to (10, -70), then
// straight along -x to its stop at x = 0 and on to a buffer at x = -7. Rail height 13 throughout.
export const SPUR = { cx: 10, cz: -48, r: 22, endZ: -70, stopX: 0, bufferX: -7, rail: 13 };

// The quiet bay: a small brick alcove standing in the arena at its -z end, open toward +z. The marked door stops in it.
export const BAY = { x0: -11, x1: 11, zFront: -62, zBack: -78, height: 16 };

// The floor's turntable (the joiner's): a round iron deck in the floor on the hall's axis, in the middle of the open
// floor between the tower's foot and the bay. The flight's first turn goes round it (the route's half circle is about
// this point) and the way home passes over it. Rails in the floor may CROSS the flown line there; none lies along it.
export const TURNTABLE = { x: 0, z: -30, r: 5 };

export const ENTRY = { x: 21, y: 8, z: 34 };          // the flight begins here, level, heading -z
export const EXIT = { x: 0, y: 7.55, z: -70 };        // the centre of the marked door's opening when it has stopped

// THE FAR STORE (added by the designer at 05:33 UTC on 9 Nov for the closer version: ranks of door trains stacked tier
// on tier into haze past the hall's end, so that the doors seem without number).
// THE OPENING (the joiner cuts it): the -z end wall, behind the bay, is open from x0 to x1 and from the floor up to
// `top`, under a deep iron lattice girder (top .. top + girder, the wall's springing line); the brick piers at x0 and
// x1 are its jambs, the great screen above it stays, a stone sill lies in the floor across it. The +z end wall stays.
// THE STORE BEYOND (the works build it, in parts of their own): from z = first the ranks stand every `step` metres,
// `ranks` of them, each a set of straight rails across the hall's line, `tiers` rails one over another from the
// hall's lowest rail height up in the hall's own step of 15 m, door trains gliding along them.
// THE FAR AIR IS LAID BY PLACE, never by the lens: a thing at the place (x, y, z) takes farAir(x, y, z) of the far
// air's colour (look.farAir, a Color the works set in the look they hand to every part), 0 at the opening and 1
// (wholly air) at the store's far end, far sides and top, where plain sheets of that same colour close the view.
export const FAR = { x0: -60, x1: 60, top: 30, girder: 4, wallZ: -150, first: -176, step: 28, ranks: 26, tiers: 16,
  zClear: -150, zGone: -900, xClear: 150, xGone: 400, yClear: 150, yGone: 260 };
export function farAir(x, y, z) {
  const s = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const keep = (1 - s(-FAR.zClear, -FAR.zGone, -z)) * (1 - s(FAR.xClear, FAR.xGone, Math.abs(x))) * (1 - s(FAR.yClear, FAR.yGone, y));
  return 1 - keep;
}
// The same law for a shader (p is a place of the world in metres): paste it, never retype its numbers.
export const FAR_AIR_GLSL = `float farAir(vec3 p) {
  float kz = 1. - smoothstep(${(-FAR.zClear).toFixed(1)}, ${(-FAR.zGone).toFixed(1)}, -p.z);
  float kx = 1. - smoothstep(${FAR.xClear.toFixed(1)}, ${FAR.xGone.toFixed(1)}, abs(p.x));
  float ky = 1. - smoothstep(${FAR.yClear.toFixed(1)}, ${FAR.yGone.toFixed(1)}, p.y);
  return 1. - kz * kx * ky;
}`;
