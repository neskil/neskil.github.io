// otter-in-the-window-seat: THE PLAN. Plain numbers and pure functions, NO IMPORT AT ALL: the same in the page and in
// plain node, so that the counts read what the world builds. Every number of the design that two files need lives here
// once (design/ab/otter-in-the-window-seat.design.json; build plan, section 1). Places are metres of CABIN SPACE (the
// sun wall's inner face at x = 0, seats to +x, the far wall at x 72.8, y up from the cabin floor, seats facing -z, row k
// with the front face of its seat backs at z = 15.6 k) or metres of ROUTE. Nothing here reads a clock of the wall, a
// lens, a seed or a picture; a dealer takes its stream as an argument; a function of the route takes the route's table.
// What differs from the design's figures, old and new, with the reason: design/ab/otter-in-the-window-seat.plan-changes.md.
// The count that holds this file to the kit's real path: node --import ./tools/ab/pp-three.mjs tools/ab/ow-count.mjs
// Held by that count on seeds 1 to 40 and on the heaviest deal by rule, and against the part's true vertices: FROZEN
// (four numbers changed since the freeze, each by a check or a ruling: the changes file, section 9)
// BROUGHT IN: triDist (the closest point of a triangle by regions; for the count of clear air over the wing, it draws nothing) follows the listing of Christer Ericson's Real-Time Collision Detection (Morgan Kaufmann, 2005, chapter 5.1.5) as three.js carries it in Triangle.closestPointToPoint (three.js r170, the Three.js Authors, MIT licence: vendor/three/three.module.js).
const PI = Math.PI, D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------- 1. MEASURES: the part's own DIM table, copied (ow-count --part proves the two are the same) ----------
export const D = {
  SCALE: 20, PITCH: 15.6, WIN_W: 4.6, WIN_H: 6.6, WIN_Y: 20, WIN_Z: -5.6, WIN_DEPTH: 1.6, WALL_TOP: 38, WALL_R: 34,
  SEAT_W: 9, ARM_W: 1, SEAT_X0: 0.9, CUSHION_TOP: 9, CUSHION_T: 2.4, SEAT_D: 9.2, BACK_TOP: 23, BACK_T0: 1.9, BACK_T1: 1.25, RAKE: 0.14,
  ARM_TOP: 13, ARM_LEN: 7.4, TRAY_Y: 13.9, TRAY_W: 8.6, TRAY_D: 6.0, TRAY_T: 0.36,
  LAP_W: 6.6, LAP_D: 4.5, LAP_T: 0.3, SCREEN_W: 6.2, SCREEN_H: 4.0, LID: 1.85, LID_FRONT: 2.36,
  PHONE_W: 1.8, PHONE_H: 3.6, PHONE_T: 0.2, TABLET_W: 3.4, TABLET_H: 4.8, TABLET_T: 0.18,
  OTTER_H: 12.3, OTTER_SEAT_Z: -4.3, BLOCK_X1: 31.9, AISLE: 9.0, CABIN_W: 72.8, BIN_Y: 33, BIN_X: 20.2, CEIL_Y: 42.6,
};
export const backFront = (y) => Math.max(0, y - D.CUSHION_TOP) * Math.tan(D.RAKE);
export const backThick = (y) => D.BACK_T0 + (D.BACK_T1 - D.BACK_T0) * sstep(D.CUSHION_TOP, D.BACK_TOP, y);
export const seatX = (seat) => D.SEAT_X0 + D.ARM_W + D.SEAT_W / 2 + seat * (D.SEAT_W + D.ARM_W);      // 6.4, 16.4, 26.4
export const wallX = (y) => (y <= D.WIN_Y ? 0 : D.WALL_R - Math.sqrt(Math.max(0, D.WALL_R * D.WALL_R - (y - D.WIN_Y) * (y - D.WIN_Y))));
export const blockX = (x, side = 0) => (side ? D.CABIN_W - x : x);
// side 0: the SUN block (S), by the wall x = 0; side 1: the FAR block (F). seat 0 window, 1 middle, 2 aisle.
export const seatAt = (row, seat, side = 0) => ({ position: [blockX(seatX(seat), side), D.CUSHION_TOP, row * D.PITCH + D.OTTER_SEAT_Z], yaw: PI });
export const trayAt = (row, seat, side = 0) => {
  const z0 = (row - 1) * D.PITCH + backFront(D.TRAY_Y) + backThick(D.TRAY_Y) + 0.35;
  return { position: [blockX(seatX(seat), side), D.TRAY_Y, z0 + D.TRAY_D / 2], zBack: z0, zNear: z0 + D.TRAY_D };
};
// THE CABIN: twelve units. Units -3 and -2 are the doorway's bay (no seats); rows -1 to 8 hold seats; a partition
// closes each end. Rows -1 to 4 are the near seat unit, rows 5 to 8 the far one. Blinds: down in rows 3 to 8 (both
// blocks), half down in the sun block's row 2, up elsewhere; the rig's window rows are units -3 to 2.
export const CABIN = {
  ROW0: -1, ROW1: 8, BAY: [-3, -2], NEAR_ROWS: [-1, 4], FAR_ROWS: [5, 8],
  Z0: -58.8, Z1: 128.4,                                // the two partitions (the unit's span is row * PITCH - 12 .. + 3.6)
  DUSK_ROW: 3, HALF_BLIND: [2, 0],                     // [row, side] of the one blind half down
  LIGHT_ROW0: -3, LIGHT_ROWS: 6,                       // what makeCabinLight is handed
  AISLE_X: [31.9, 40.9], MID_X: 36.4,
  HULL_R: 38.4, HULL_AXIS: [36.4, 14], HULL_Z: [-330, 420],   // the skin: a circle about the airliner's axis (x, y)
};

// ---------- 2. THE ROUTE: 49 control points for the kit's makePath (centripetal), laid by places only ----------
// Over the crown along z -112.4; half a circle of radius 30 about (x -12, z -82.4) down the sun flank; straight through
// the middle of the entered window; a quarter circle of radius 18.5 about (x 16.4, z -33.9), sinking, onto the sun side
// of the aisle; then ONE EVEN CLIMB up the aisle at x 34.9, from the sitters' chests in the bay (y 15.6) past the first
// row's faces (y 19 to 20 beside row -1), over the caps (y 23) beside the hero's row and on to a GALLERY 6 m above them
// (y 29.5) from row 2 on: the sitters are flown past from above their caps, never from behind a seat's back. (The design
// flew the aisle at y 12 to 15, under the trays' line: the changes file, section 12. The climb is even, and no steeper,
// because the wave's pulses are laid on the metres flown: a steeper one lengthens the line before row 1 and the third
// of that row's seats then wakes under 17 m ahead of the eye.) A wheel of radius 12 about (x 40.4, z 54);
// the far block at x 52.4, y 29.8; the swing out to x 60.4; a quarter circle of radius 14; the hero's row gap.
// Points 43 and 46 are moved against the design (40.5, 24.6 and 20.5, 17.05 there), both along the last leg's own line: see the changes file.
export const ROUTE = [
  [104, 70, -112.4], [70, 69.5, -112.4], [36.4, 68, -112.4], [10, 65.5, -112.4], [-12, 62, -112.4],
  [-27, 58.84, -108.38], [-37.98, 50.95, -97.4], [-42, 40.69, -82.4], [-37.98, 30.43, -67.4], [-27, 22.54, -56.42],
  [-12, 19.38, -52.4], [-1.6, 19.38, -52.4], [8, 19.38, -52.4], [16.4, 19.2, -52.4],
  [25.65, 17.6, -49.92], [32.42, 15.6, -43.15], [34.9, 15.6, -33.9],
  [34.9, 17.7, -25], [34.9, 20.8, -14], [34.9, 24.2, -2], [34.9, 26.6, 8], [34.9, 28.5, 17],
  [34.9, 29.3, 25], [35.2, 29.5, 31], [34.6, 29.5, 36.5], [32.3, 29.6, 42.5],
  [29.52, 29.6, 48.93], [28.45, 29.46, 55.05], [30.57, 29.52, 60.88], [35.33, 29.58, 64.88], [40.4, 29.62, 66],
  [45.47, 29.67, 64.88], [50.23, 29.73, 60.88], [52.4, 29.8, 54],
  [52.4, 29.8, 44], [52.6, 29.7, 35], [54.2, 29.3, 27], [57.4, 28.4, 19], [59.8, 27.2, 11.5], [60.4, 26.6, 4.75],
  [58.52, 26.47, -2.25], [53.4, 26.33, -7.37], [46.4, 26.2, -9.25],
  [41.5, 24.87, -9.25], [34, 21.6, -9.25], [27, 18.6, -9.25], [22.5, 17.15, -9.25], [13, 16.9, -9.25], [4.42, 16.9, -9.25],
];
// what the count holds the kit's path to (ow-count fails outside these)
export const ROUTE_LAW = {
  LENGTH: 523.6, LENGTH_TOL: 0.5,                      // m (the design: 525.6; 525.7 until the aisle's line became one even climb to the gallery: the changes file, section 12)
  PITCH_MAX: 35, PITCH_CABIN: 33.5, PITCH_LAST: 27,    // degrees: steepest anywhere, inside the cabin, on the last leg
  BEND_MAX: 60,                                        // degrees a second at the flown speed, anywhere
  LAST_HEADING: 38, LAST_LEVEL: 14,                    // m: the last metres within 1 degree of -x in plan; within 1 degree of level
  WINDOW_M: [221, 250], WHEEL_M: [370, 407], LAST_M: 480,
};
// THE FLIGHT: 57 s (the lead's ruling; the design said 54). paceOf(m): the pace by ROUTE METRE, one smooth shape, no step: 1.9 over the roof, eased up to 2.3
// down the flank (m 95 to 125), eased down to 1.0 through the window (m 200 to 245), 0.85 round the wheel (eased over
// m 348 to 370 and m 396 to 418), 1.0 to the end. The world hands the engine pace: (u) => paceOf(u * path.length).
export const FLIGHT = { DURATION: 57, ROOF: 1.9, FLANK: 2.3, CABIN: 1.0, WHEEL: 0.85, UP_M: [95, 125], DOWN_M: [200, 245], SLOW_M: [348, 370], FAST_M: [396, 418] };
export function paceOf(m) {
  const F = FLIGHT;
  return F.ROOF + (F.FLANK - F.ROOF) * sstep(F.UP_M[0], F.UP_M[1], m) - (F.FLANK - F.CABIN) * sstep(F.DOWN_M[0], F.DOWN_M[1], m)
    - (F.CABIN - F.WHEEL) * sstep(F.SLOW_M[0], F.SLOW_M[1], m) + (F.CABIN - F.WHEEL) * sstep(F.FAST_M[0], F.FAST_M[1], m);
}
// the engine's own scaling of a pace (65 readings, clamped to 0.35..2.5, the mean of the inverse): the flown speed in
// m/s at route metre m. Mirrors src/core/engine.js makePace; for counts only (the engine does it for the page).
export function speedLaw(length, duration = FLIGHT.DURATION) {
  const n = 64, p = []; for (let i = 0; i <= n; i++) p.push(clamp(paceOf(i / n * length), 0.35, 2.5));
  let inv = 0; for (let i = 0; i < n; i++) inv += 2 / (p[i] + p[i + 1]);
  const k = inv / n, v0 = length / duration;
  return (m) => { const x = clamp(m / length, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)); return (p[i] + (p[i + 1] - p[i]) * (x - i)) * k * v0; };
}
// THE ONE TABLE OF THE ROUTE: place and tangent every STEP metres. path: the kit's makePath(ROUTE) (its posAtDist and
// tangentAtDist are all that is used). Made once; stations, builds by distance, looks and counts read it.
export const STEP = 0.25;
export function layTable(path, step = STEP) {
  const L = path.length, n = Math.floor(L / step) + 1, P = new Float64Array((n + 1) * 3), T = new Float64Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) {
    const d = Math.min(i * step, L), p = path.posAtDist(d), t = path.tangentAtDist(d);
    P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z; T[i * 3] = t.x; T[i * 3 + 1] = t.y; T[i * 3 + 2] = t.z;
  }
  return { L, step, n: n + 1, P, T, metre: (i) => Math.min(i * step, L) };
}

// ---------- 3. NAMED PLACES (the same for every visitor) ----------
// THE ENTERED WINDOW: the window of unit -3 in the sun wall. No pane: a rim, a reveal 1.6 m deep, the blind's lip.
// The line goes through the middle of its FREE opening. The three numbers are counted by windowGap() below.
export const WINDOW = { UNIT: -3, X: [-1.6, 0], Y: 19.38, Z: -52.4, FREE_Y: [16.8, 21.96], HAND: 2.22, MEMBER: 2.22, ABOVE: 2.58, BELOW: 2.58,
  SKIN_M: 231.6, WALL_M: 233.2, ARCS_M: [215, 245], ARCS_R: [1.0, 1.5, 2.0] };   // route metres of skin and inner wall; where the pulses are drawn small
// THE HERO'S ROW: row 0 of the sun block. Seat 0 the hero; seats 1 and 2 EMPTY on every visit, trays stowed.
// The hero's machine stands on its own tray turned a quarter: keys toward +x, the lid upright on the wall side.
// GLASS is the engine's opening: the route's last point is its middle and the last direction is -x, square into it.
export const HERO = {
  SEAT: [0, 0, 0],                                       // [row, seat, side]
  // sat back; the head goes round to the aisle and us (LOOK, -) and back TOWARD ITS OWN MACHINE'S GLASS (LOOK2), by the
  // world's clock, the same at every metre. LOOK2 is 0.12 rad to its window's side of straight ahead: the glass stands
  // 8 m before it and 2 m to that side, and from no place of the last leg (the lens up to 40 m out along z -9.25) is
  // the face then seen further round than its profile (tan of the turn 0.12 + its 0.05 of sway stays under 7.75 / 40)
  LEAN: -0.45, LOOK: -1.15, LOOK2: 0.12, NOD: 0.25, PHASE: 0.13,
  PAW: [7.9, 14.7, -5.6], PAW_ARM: -1,                   // the middle of its right paw: its fingers lie on the TOP of the deck's near aisle-side corner
  THIGH_Z: -5.6,                                         // the other forearm stays behind (aft of) this z
  MACHINE: { position: [6.4, 13.9, -9.25], yaw: PI / 2, lid: PI / 2, glass: [6.2, 5.0], screen: false },
  GLASS: { centre: [4.42, 16.9, -9.25], normal: [1, 0, 0], width: 6.2, height: 5.0 },
  ARCS: { x: 4.3, y: [20.5, 26], z: -9.25, span: 7, LIGHT: [[0, 0.9], [1, 0.9], [2, 0.55]] },   // LIGHT: [seat of the hero's row, strength]: the arcs' blue on the front of the hero's own seat's back (seat 0, behind the hero) and of the two empty seats beside it (three plain arcs in the lid's own plane, always lit)
  TUMBLER: [11.4, 13, -3],                               // on the armrest between its seat and the middle seat (the foot's middle)
  EMPTY: [[0, 1, 0], [0, 2, 0]],
  KEEP: 2.8,                                             // m: no tray, tumbler, machine or dress stands nearer the last leg than this
  TRAY_LONG: 1.2, TRAY_LIP: 0.14,                        // its own tray reaches this much further toward it than a seat's (it shows past both ends of the turned machine) and has a lip this high all round
  BACK_REACH: 3.55,                                      // m aft of row -1's own z: nothing hung on the backs of row -1 stands further into the gap
  MOUTH: [46.4, -9.25],                                  // the mouth of the row gap (x, z): no station and no pulse beyond it
  FILL: [6.4, 15.5, -5, 9], FILL_FROM: [0.8, 0.3, -0.52],  // its seat's own place and reach (x, y, z, m), and the side a soft light of its own comes from (the aisle's, a little above and before it): the fur's law names it
};
// THE ONE STOOD UP: row 1 of the sun block, the MIDDLE seat (the eye never comes nearer than 7 m to any part of it; the
// count holds that). IT STANDS ON ITS HIND LEGS ON ITS OWN CUSHION, AN OTTER OF AN OTTER'S PROPORTIONS (the lead's
// ruling D4; it was a sitter whose trunk was drawn up 7 m and whose arm was carried 9 m to the cap of the seat before
// it: a rubber tube and a bent pipe). STAND: metres its hips stand over where they sat (the hind legs straightened
// under it, the whole body lifted unstretched); RISE: the little its trunk draws up as it cranes (under a tenth of the
// trunk's 7.5 m). It cannot reach the cap of the seat before it (its shoulder stands 5 m under that cap and 9 m behind
// it; its arm is 4.8 m), so it stands turned to the aisle (YAW; STEP: where on its cushion, from the seat's own place:
// toward the aisle and back against its own seat's back). IT HOLDS NOTHING (the lead's ruling E5; its right paw was
// hooked over its own seat's cap, and from the gallery the dark paw lay in the picture on top of its own head): it has
// no reach, and both its paws hang before its belly as an otter stood upright holds them (the main part's
// STAND_LAW.FREE), nothing above its shoulders. It looks down the aisle to where the visitor comes from (LOOK) and
// round to the aisle abeam (LOOK2), by the world's clock. No machine, no station: the same at every metre flown. The
// aisle seat beside it (S1:2) is kept EMPTY by NAMED since round OG: from the aisle nothing stands before it.
// FILL: its place and reach for the fur's soft light (as the hero's). CLEAR: the least clear air the count asks of it.
export const UP = { SEAT: [1, 1, 0], STAND: 2.9, RISE: 0.7, YAW: PI / 2 + 0.15, STEP: [1.2, 1.85], LEAN: 0.05, LOOK: 0.95, LOOK2: 0.25, NOD: 0.2, PHASE: 0.47, FILL: [17.6, 18.5, 13.2, 9.5], CLEAR: 7 };
export const upAt = () => { const s = seatAt(...UP.SEAT).position; return { position: [s[0] + UP.STEP[0], s[1], s[2] + UP.STEP[1]], yaw: UP.YAW }; };
// FACES AT THE GLASS (the sun block; from the flank outside they show in lit windows, and from the gallery inside they
// are otters looking out at the cloud sea). SEATS: window seats whose sitter (pose REST, one state all flight, no
// machine, no station) bends BEND radians sideways to its window, sat a little back (LEAN) and drawn up RISE metres,
// its window-side paw on the opening's lower rim (PAW: x, y, and z from the window's middle), its head going by the
// clock between LOOK (out of the window) and LOOK2 (out and a little ahead). [row, seat, side, rise, phase]: row 2's
// blind is half down, so its sitter stays low and looks out under the blind's rail.
// STAND: one more on a plain case in the bay, standing at the window of unit -2 (the door's own window, the next to
// the entered one), turned to the wall: on its hind legs as THE ONE STOOD UP is (UP.STAND, UP.RISE), its own LEAN, its
// right paw on the rim (it alone of the two that stand holds something), its eyes at the window's middle. CASE: the case it stands on [x0, y0, z0, x1, y1, z1] (the
// dress builds it): 6 m high and hard by the wall, so that an otter of an otter's proportions reaches the rim from it
// (the case was 4 m high and stood 5 m off the wall, and the animal was drawn up 7 m to the glass).
export const GLASS = {
  BEND: 0.2, LEAN: -0.1, LOOK: 1.35, LOOK2: 0.95, NOD: 0.3, PAW: [0.8, 17.3, -1.0], PAW_ARM: 1,
  SEATS: [[1, 0, 0, 1.5, 0.29], [2, 0, 0, 0, 0.74]],
  STAND: { UNIT: -2, position: [5.8, 6.0, -2 * D.PITCH + D.WIN_Z], yaw: -PI / 2, LEAN: 0.1, LOOK: -0.3, LOOK2: 0.25, NOD: 0.3, PHASE: 0.58, PAW: [0.7, 18.3, -2 * D.PITCH + D.WIN_Z - 2.1], PAW_ARM: -1,
    CASE: [1.2, 0, -2 * D.PITCH + D.WIN_Z - 3.6, 11.4, 6.0, -2 * D.PITCH + D.WIN_Z + 6.0] },
};
export const glassPaw = (row) => [GLASS.PAW[0], GLASS.PAW[1], row * D.PITCH + D.WIN_Z + GLASS.PAW[2]];
// THE WAY OUT, for the world's portal and camera lines (src/core/engine.js, portal.js; see the changes file):
// frame 0 is a bare opening (no halo, no light in the rim, no shimmer) and is always the 'ring' look inside the Portal;
// style 'ring' is NAMED so that the engine deals no seeded look (it deals one only when no style is named).
// glow is nought with frame 0 whatever is written; dewash is NOT named (the engine's 0.85 takes this world's glow back out
// of the next world's picture; it does not touch the veil); no tilt (the exit frame is level), no drawWithin, no feed.
// veil: THE WAITING SCREENS' OWN DEEP LIT BLUE as the main part's screen shader draws their field (`waiting`: its base
// and its soft halo at strength 1 are 0.038, 0.12, 0.36 in linear light, which is this colour): until the next world
// shows, the way out is one more lit glass waiting for the signal, not a dead black one. One flat colour, the same at every metre.
export const PORTAL = { shape: 'rect', width: 6.2, height: 5.0, frame: 0, style: 'ring', veil: '#3762a1', revealDistance: 110, blendDistance: 25 };
export const CAMERA = { fov: 56, near: 0.3, far: 7000, lookAhead: 14, sway: 0.5, bank: 0.6, lookArc: true };
export const SWAP_SHORT = 0.45;                          // m: the engine swaps worlds this far short of the route's end
// THE BAY (units -3 and -2, z -58.8 to -27.6): no seats. The crew otter on a fold-down seat against the front
// partition, facing aft; the trolley parked on the far side.
export const BAY = {
  Z: [-58.8, -27.6],
  CREW: { position: [46, 9, -54.5], yaw: 0, SEAT_BOX: [41.4, 0, -58.8, 50.6, 9, -50.2], BACK_BOX: [41.4, 9, -58.8, 50.6, 23.2, -57.4] },
  TROLLEY: { BOX: [47, 0, -46, 53, 20.6, -30], RAIL: 0.6, TUMBLERS: [[48.6, -43], [51.4, -43], [48.6, -39.7], [51.4, -39.7], [48.6, -36.3], [51.4, -36.3], [48.6, -33], [51.4, -33]] },
};
// OUTSIDE. Own spaces as the part builds them: a lying animal's head is toward +z of its own space; yaw turns it
// (own +z goes to (sin yaw, cos yaw) in plan).
// CROWN: THE ONE ON THE ROOF, sat up on its haunches (pose REST, RISE) beside the dome's aft end, its right paw
//   on the top of the second aerial's blade (PAW), its tail on the skin behind it clear of the dome's foot. Its head
//   goes by the clock between LOOK (toward the route's start) and LOOK2 (toward the line abeam); over LIFT_M metres
//   of route it is lifted and comes round with the eye. SHADE: its three capsules for the skin's drawn shade (tail,
//   trunk, head: own space, the outside part's E.crownShade).
// RAFT: SIX sea otters afloat on the named tower's flat top and a PUP on one's belly, a LOOSE raft: AT is each one's
//   [x, z, turn from RAFT.yaw (a quarter turn either way at the most), size]; HOLD: the two that hold paws (at the
//   middle between their chests, at the water line); MOTHER carries the pup (PUP: its size, its place on her own
//   belly, its turn); GROOMER rubs its cheeks in bouts by the clock; TAPPER keeps its shell and stone; the others'
//   paws are folded on their chests. Every head lifts toward US (a place of the flown line abeam) by the clock.
// WING_OTTER: THE SLIDER. On its belly it slides down the wing's upper face from `position` by SLIDE (the face falls
//   toward the root; the wind carries it a little aft) and climbs back, one round every part.SLIDE.PERIOD seconds by
//   the world's clock. HEAD: the middle of its way, for the look.
// WINDOW_CLOUD: a small cloud top of its own in the open sky 160 m beyond the sun wall, FORWARD OF THE WING'S SWEPT
//   LEADING EDGE (which runs aft as it goes out: at that span it lies 25 m further aft than the cloud's middle) and
//   5 m under the wing's own face there, in the line of sight through the hero's window from the first 20 m of the
//   last leg (then the hero's own lid and the window's forward edge stand before it): two sea otters afloat on it (AT: [x, z, yaw, size]), heads lifting toward the windows (US) by the
//   clock. On every visit. BY PLACE (the lead's ruling D2; it stood 62 m out and 16 m OVER the wing, and from the
//   flank's descent it was seen lying on the metal): from no place of the flown line outside (m 0 to the skin) does
//   a sight line through any part of it or of its two otters go on to meet the wing or the hull: it stands against
//   sky and cloud sea (ow-count-outside counts the rays on the true triangles, and the metres of the last leg from
//   which an otter's head stands in the hero's window's opening).
export const OUTSIDE = {
  CROWN: { position: [43.3, 51.72, -120.35], yaw: 1.66, RISE: 1.5, LEAN: 0.06, LOOK: -0.22, LOOK2: -1.25, PAW: [44, 57.87, -117.1], PAW_ARM: -1, PHASE: 0.7,
    HEAD: [45.9, 64.3, -120.6], LIFT_M: [30, 60], SHADE: [[0, 0.6, -2, 0, 0.6, -10, 0.7], [0, 2.2, 0, 0, 9.5, 0.8, 2.4], [0, 11.3, 1.6, 0, 12.3, 3.2, 1.9]] },
  DOME: { centre: [36.4, 52.4, -135], size: [14, 5, 30], ARCS_R: [4, 6.2, 8.4], ARCS_FAN: 100 },   // ARCS_R: the three stand whole in the picture from the line abeam (25 m off: the outside part thins an arc nearer than 2.9 of its radii)
  AERIALS: [[30, -116], [44, -117]], AERIAL_H: 6,
  RAFT: { middle: [-70, 22, -88], N: 6, yaw: PI / 2, Y0: 21, SWELL: 0.6, TOP_Y: 21, BILLOW_R: 35, BILLOW_TOP: 24, US: [-38, 46, -86],
    AT: [[-75.5, -102.5, 0.55, 0.94], [-73.2, -95.2, -0.06, 1.06], [-73.6, -88.0, 0.06, 0.98], [-71.0, -80.6, -0.6, 1.1], [-76.5, -73.2, -1.35, 0.9], [-85, -91.5, 1.45, 1.0]],
    HOLD: [1, 2], HOLD_Y: 2.7, MOTHER: 3, GROOMER: 4, TAPPER: 5, PUP: { SIZE: 0.36, AT: [0, 4.2, 1.4], TURN: 0.1, LIFT: 1.2 } },
  WING_OTTER: { position: [-64, -2.4, -20], yaw: 1.2847, SLIDE: [34, -2.975, 10], PHASE: 0.3, HEAD: [-47, 0, -15], KEEP: [-40, 4, -36, 26],   // KEEP: the cloud sea's keep-out there, as it always stood (the sea's deal is not touched)
    SHADE: [[0, 0.7, -10.2, 0, 0.9, -3.5, 0.75], [0, 1.9, -3.5, 0, 2.0, 8.6, 2.0], [0, 2.0, 8.6, 0, 1.9, 12.2, 1.75]] },
  WINDOW_CLOUD: { centre: [-160, 1, -10], R: 16, TOP: 4, US: [0, 20, -5.6], AT: [[-156, -11.5, PI / 2 + 0.3, 1.0], [-164, -7, 0.25, 0.9]] },
  WING: { ROOT_X: 0, ROOT_Y: -8, ROOT_Z: [-60, 80], SWEEP: 25, RISE: 5, SPAN: 340, TIP_CHORD: 40, POD_OUT: 115 },
  RARE: { position: [136, 21, 16.6], yaw: 0, CLOUD_R: 15 },          // one more sea otter afloat beyond the far wall (its middle x 136, z 20; side on to the windows), when ctx.vary.rare
  TOWERS: [3, 7],                                                    // how many towers stand beyond the named one (dealt by 'otter-look')
  ENTRY_CLEAR: [60, 15],                                             // m: open sky behind and round the entry point
};
export const raftAt = (i) => { const R = OUTSIDE.RAFT, q = R.AT[i]; return { position: [q[0], R.Y0, q[1]], yaw: R.yaw + q[2], scale: q[3] }; };
// THE FLOATING CAST (the part's makeOtters entries but for the pose's number and the flags of the open air): the raft's
// six and the pup, then the window cloud's two. A floating otter's own space: head toward +z, its chest's middle at
// AFLOAT_CHEST; the cloud's water line lies 2 m over its place (the outside part's), held paws HOLD_Y over it. look: how far its lifted head turns toward a place (for the
// part's pose 7 a turn toward own +x is NEGATIVE), 0.9 rad at the most.
export const AFLOAT_CHEST = [0, 1.25, 7.3];
export function lookAfloat(at, us) {
  const h = ownToCabin(at, [0, 4, 10.5], at.scale || 1), dx = us[0] - h[0], dz = us[2] - h[2], c = Math.cos(at.yaw), s = Math.sin(at.yaw);
  return -clamp(Math.atan2(dx * c - dz * s, Math.abs(dz * c + dx * s) + 6), -0.9, 0.9);
}
export function floatingCast() {
  const R = OUTSIDE.RAFT, W = OUTSIDE.WINDOW_CLOUD, out = [];
  for (let i = 0; i < R.N; i++) { const at = raftAt(i);
    out.push({ ...at, who: 'raft ' + (i + 1), tap: i === R.TAPPER ? 1 : 0, plain: i !== R.TAPPER, habit: i === R.GROOMER ? 0 : 2, span: i === R.MOTHER ? R.PUP.LIFT : 0, look: lookAfloat(at, R.US), phase: 0.17 + i * 0.23 }); }
  { const [a, b] = R.HOLD, ca = ownToCabin(out[a], AFLOAT_CHEST, out[a].scale), cb = ownToCabin(out[b], AFLOAT_CHEST, out[b].scale);
    out[a].reach = out[b].reach = [(ca[0] + cb[0]) / 2, R.Y0 + R.HOLD_Y, (ca[2] + cb[2]) / 2]; }
  { const m = out[R.MOTHER], at = { position: ownToCabin(m, R.PUP.AT, m.scale), yaw: m.yaw + R.PUP.TURN, scale: R.PUP.SIZE };
    out.push({ ...at, who: 'the pup', tap: 0, plain: true, habit: 2, span: 0, look: lookAfloat(at, R.US), phase: 0.61 }); }
  W.AT.forEach((q, i) => { const at = { position: [q[0], W.centre[1], q[1]], yaw: q[2], scale: q[3] };
    out.push({ ...at, who: 'window cloud ' + (i + 1), tap: 0, plain: true, habit: i === 1 ? 0 : 2, span: 0, look: lookAfloat(at, W.US), phase: 0.39 + i * 0.31 }); });
  return out;
}
// where the cloud tops are hollowed for the floating bodies: two rounds an animal (its hips and its chest), [x, z, r]
export function floatHollows(list) { const out = []; for (const a of list) for (const z of [1.5, 8]) { const c = ownToCabin(a, [0, 0, z], a.scale || 1); out.push([c[0], c[2], 5.2 * (a.scale || 1)]); } return out; }
export const skinY = (x) => CABIN.HULL_AXIS[1] + Math.sqrt(Math.max(0, CABIN.HULL_R * CABIN.HULL_R - (x - CABIN.HULL_AXIS[0]) * (x - CABIN.HULL_AXIS[0])));   // the crown's height over x

// ---------- 4. THE ARCS' LAW AND THE WAVE (metres flown, and nothing else) ----------
// DECLARED PACING. Pulse k is born at the route place GAP k. While the metres flown d lie between GAP k and
// GAP k + LIFE the pulse stands ON THE ROUTE at the station GAP k + RUN (d - GAP k): it runs ahead of the eye and is
// 32.4 m in front when it dies. It also dies where its station reaches the mouth of the hero's row gap, and none is
// born within NO_BIRTH metres of that mouth: over the last MOUTH_EASE metres of route before the mouth its strength
// goes out eased by the STATION'S OWN PLACE (13.2 m of station is 6 m flown, as long as its coming-in), so that it
// is nought where the station meets the mouth and nothing is cut in one frame (only pulse 18, born at m 432, comes
// there; a seat's station is a number fixed at build and does not read the strength).
// A pulse is three arcs APART metres apart along the route (the first at
// the station, the others behind it), radii R growing by GROW over its life, but at most SMALL_R while the station
// lies between the route metres SMALL_M (eased over SMALL_EASE either side): they pass the entered window's rim whole.
export const ARCS = {
  GAP: 24, RUN: 2.2, LIFE: 27, N: 3, APART: 3, FAN: 110, R: [2.5, 4, 5.5], GROW: 0.5,
  SMALL_R: [1.0, 1.5, 2.0], SMALL_M: [215, 245], SMALL_EASE: 10, IN: 6, OUT: 8, NO_BIRTH: 30, MOUTH_EASE: 13.2,
  THIN: [0.6, 2.5], HURRY: [2.5, 4], COLOUR: '#2f7dff', EMISSIVE: [2, 3], LIVE_MAX: 2,
};
// the radius of arc j of a pulse whose station is at route metre s, at life l metres (0..LIFE)
export function arcRadius(j, s, l) {
  const A = ARCS, big = A.R[j] * (1 + A.GROW * clamp(l / A.LIFE, 0, 1));
  const small = sstep(A.SMALL_M[0] - A.SMALL_EASE, A.SMALL_M[0], s) * (1 - sstep(A.SMALL_M[1], A.SMALL_M[1] + A.SMALL_EASE, s));
  return big + (Math.min(big, A.SMALL_R[j]) - big) * small;
}
// pulse k at d metres flown: null when it does not live; else its station, life and strength (0..1, before the hurry
// guard; eased in by its life, out by its life and out by its station's metres to the mouth) and the route metre and radius of each of its three arcs. mouthM: the route metre of the row gap's mouth.
export function pulseAt(k, d, mouthM) {
  const A = ARCS, born = A.GAP * k, l = d - born;
  if (k < 0 || born > mouthM - A.NO_BIRTH || l < 0 || l > A.LIFE) return null;
  const station = born + A.RUN * l; if (station > mouthM) return null;
  const strength = sstep(0, A.IN, l) * (1 - sstep(A.LIFE - A.OUT, A.LIFE, l)) * (1 - sstep(mouthM - A.MOUTH_EASE, mouthM, station)), arcs = [];
  for (let j = 0; j < A.N; j++) { const s = station - j * A.APART; arcs.push({ metre: s, radius: arcRadius(j, s, l), on: s >= born }); }
  return { k, station, life: l, strength, arcs };
}
// the pulses that live at d (two at the most): what update() turns into six frames from the path
export function livePulses(d, mouthM) {
  const k1 = Math.floor(d / ARCS.GAP), out = [];
  for (let k = k1 - 1; k <= k1; k++) { const p = pulseAt(k, d, mouthM); if (p) out.push(p); }
  return out;
}
export const hurryGuard = (rate) => 1 - sstep(ARCS.HURRY[0], ARCS.HURRY[1], rate);
// THE WAVE. A seat is IN REACH when the route, between the inner wall and the mouth of the hero's row gap, passes
// within REACH metres of its sitter's head IN PLAN: one number for every seat. Its PLACE is the route metre of the
// nearest point of the FIRST such pass. Its STATION is the metres flown at which the first pulse reaches that place:
// with k the least whole number for which GAP k + RUN LIFE is at or over the place, GAP k + (place - GAP k) / RUN.
// The part's uSignal is (metres flown, RAMP). No reach: no station (the sitter waits all flight).
// AWAKE: the last two seats of the wave's order (the far block's front row, window and middle), whose stations the
// gap rule holds back until the last pulse is at or past the mouth of the hero's row gap (its ease there 0.18, then
// gone): they are DEALT AWAKE FROM THE START OF THE CABIN (a rule of the seat, no dice; the table of stations and every
// other seat's station stand), so that no seat begins to wake under a last pulse weaker than a half.
export const WAVE = { REACH: 20, RAMP: 8, TUNE: [14, 24], NEVER: 1e6, ALWAYS: -1e6, PER_SECOND: 3, AWAKE: ['F-1:0', 'F-1:1'], LEAST_PULSE: 0.5 };
export const HEAD_OWN = [0, 11.2, 2.5], CHEST_OWN = [0, 6, 1];          // a sitter's head and chest in its own space (it faces +z there)
export const ownToCabin = (sit, q, scale = 1) => { const c = Math.cos(sit.yaw), s = Math.sin(sit.yaw), p = sit.position; return [p[0] + (q[0] * c + q[2] * s) * scale, p[1] + q[1] * scale, p[2] + (q[2] * c - q[0] * s) * scale]; };
export function stationOfPlace(place) {
  const A = ARCS, k = Math.max(0, Math.ceil((place - A.RUN * A.LIFE) / A.GAP));
  return A.GAP * k + (place - A.GAP * k) / A.RUN;
}
// the route metre nearest a place, between two route metres (for the mouth, the looks' places, the wall)
export function metreNear(T, x, y, z, m0 = 0, m1 = Infinity) {
  let best = Infinity, bi = 0; const i0 = Math.max(0, Math.ceil(m0 / T.step)), i1 = Math.min(T.n - 1, Math.floor(m1 / T.step));
  for (let i = i0; i <= i1; i++) { const dx = T.P[i * 3] - x, dy = T.P[i * 3 + 1] - y, dz = T.P[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
  return { metre: T.metre(bi), dist: Math.sqrt(best), i: bi };
}
export const mouthMetre = (T) => metreNear(T, HERO.MOUTH[0], 26.2, HERO.MOUTH[1], 440, T.L).metre;
// a seat's reach: { reach, place, aside, station } from the table. hx, hz: its sitter's head in plan.
export function seatReach(T, hx, hz, mouthM, reach = WAVE.REACH) {
  const i0 = Math.ceil(WINDOW.WALL_M / T.step), i1 = Math.floor(mouthM / T.step), r2 = reach * reach;
  let inPass = false, best = Infinity, bi = -1;
  for (let i = i0; i <= i1; i++) {
    const dx = T.P[i * 3] - hx, dz = T.P[i * 3 + 2] - hz, d = dx * dx + dz * dz;
    if (d <= r2) { inPass = true; if (d < best) { best = d; bi = i; } } else if (inPass) break;
  }
  if (bi < 0) return { reach: false, place: null, aside: null, station: WAVE.NEVER };
  const place = T.metre(bi);
  return { reach: true, place, aside: Math.sqrt(best), station: stationOfPlace(place) };
}
// the build of the animal by the chest's true distance to the flown line (a thing of the place, never dealt)
export const TIER = { NEAR: 23, MID: 60 };
export const tierOf = (dist) => (dist < TIER.NEAR ? 'near' : dist < TIER.MID ? 'mid' : 'far');
export function lineDist(T, x, y, z, m0 = 0, m1 = Infinity) { return metreNear(T, x, y, z, m0, m1).dist; }

// ---------- 5. THE CAST: sixty seats (rows -1 to 8, two blocks of three) ----------
// A seat's id is its block letter, its row and its seat: 'S0:0' is the hero's. POSE numbers are the part's (LAPTOP 0,
// PHONE 1, TABLET 2, LAP 3, LYING_BACK 4, REST 5, ASLEEP 6, AFLOAT 7, BELLY 8). look: + toward the sitter's own
// window, - toward the aisle, in both blocks (the far block is mirrored). station: null = worked out from the route
// by the wave's law; WAVE.NEVER = it waits all flight; WAVE.ALWAYS = it has no waiting state.
export const POSE = { LAPTOP: 0, PHONE: 1, TABLET: 2, LAP: 3, LYING_BACK: 4, REST: 5, ASLEEP: 6, AFLOAT: 7, BELLY: 8 };
export const seatId = (row, seat, side) => (side ? 'F' : 'S') + row + ':' + seat;
// THE NAMED, the same for every visitor (their dice are drawn and not used). armTray: a tray folded out of its own armrest.
export const NAMED = {
  'S0:0': { who: 'hero', pose: 5, machine: 'laptop', lean: HERO.LEAN, look: HERO.LOOK, look2: HERO.LOOK2, nod: HERO.NOD, tap: 0, glow: 0, phase: HERO.PHASE, scale: 1, station: 1e6, tint: [1, 0.98, 0.95] },
  'S0:1': { who: 'empty' }, 'S0:2': { who: 'empty' },
  'S-1:2': { who: 'typist', pose: 0, machine: 'laptop', picture: 1, look: 0.9, nod: 0.3, tap: 1, phase: 0.44, scale: 1, tint: [0.95, 0.95, 0.98] },
  'S-1:1': { who: 'typist-2', pose: 0, machine: 'laptop', picture: 0, look: 0.7, nod: 0.2, tap: 1, phase: 0.71, scale: 0.97, tint: [1.04, 0.99, 0.93] },
  'S-1:0': { who: 'typist-3', pose: 0, machine: 'laptop', picture: 2, look: 0.5, nod: 0.5, tap: 1, phase: 0.18, scale: 0.95, tint: [0.98, 0.97, 0.96] },
  'F-1:2': { who: 'sea otter', species: 'sea', pose: 4, machine: null, look: -0.6, tap: 1, phase: 0.3, scale: 1, station: -1e6, tint: [1, 1, 1] },
  'S1:1': { who: 'up', pose: 5, machine: null, lean: UP.LEAN, look: UP.LOOK, look2: UP.LOOK2, nod: UP.NOD, tap: 0, glow: 0, phase: UP.PHASE, scale: 1, station: 1e6, tint: [1.0, 0.98, 0.94],
    rise: UP.RISE, stand: UP.STAND, place: upAt() },   // place: where it stands on its cushion and which way it is turned (every other sitter: seatAt); no reach: it holds nothing, both paws hang before its belly
  // RIGHT UNDER THE LINE ON THE AISLE'S CLIMB (the lead's ruling E3c, round OG; about route m 308 to m 322): the sun
  // block's row 1 AISLE seat is EMPTY on every visit, its tray stowed. The first one in headphones sat there, beside the
  // one stood up, and the line comes up the aisle right behind and above that seat: its head and headset filled the
  // picture's lower edge from behind (the head the strangers named in the second bar's eighth still). Its dice are
  // drawn and not used; its slot in the wave's table stands, and wakes nothing.
  'S1:2': { who: 'empty' },
  // UNDER THE LINE WHERE IT COMES DOWN OVER THE FAR BLOCK (the lead's rulings E3 and E3b; between about route m 425 and m 485): the far block's
  // row 0 keeps its aisle and middle seats EMPTY on every visit, trays stowed, as the hero's row does across the aisle
  // (a sitter there was seen from above and behind as a brown lump cut by the picture's lower edge; asleep it still
  // was). The one in headphones of the far block, who sat in the aisle seat, has the window seat of the same row, 20 m
  // from its old seat: its swept shape 6.2 m from the line at the least (counted; asked 6). AND ROW 1'S AISLE SEAT
  // (F1:2, round OG) IS EMPTY TOO, its tray stowed and its ruled tumbler gone: from the line above (about m 441 to
  // m 458) it was a huge head cut by the picture's lower left corner, a cup on the lower edge. F-1:1 is a seat of the
  // wave's own rule. Their dice are drawn and not used, like every named seat's.
  'F0:2': { who: 'empty' }, 'F0:1': { who: 'empty' }, 'F1:2': { who: 'empty' },
  'F0:0': { who: 'headphones-2', pose: 2, machine: 'tablet', picture: 1, look: 0, nod: 0.8, tap: 0.6, phase: 0.27, scale: 0.98, headphones: true, tint: [0.96, 0.96, 0.99] },
  'S1:0': { who: 'glass', pose: 5, machine: null, lean: GLASS.LEAN, bend: GLASS.BEND, look: GLASS.LOOK, look2: GLASS.LOOK2, nod: GLASS.NOD, tap: 0, glow: 0, phase: GLASS.SEATS[0][4], scale: 1, station: 1e6, tint: [1.03, 0.99, 0.93],
    rise: GLASS.SEATS[0][3], reach: glassPaw(1), reachArm: GLASS.PAW_ARM },
  'S2:0': { who: 'glass', pose: 5, machine: null, lean: GLASS.LEAN, bend: GLASS.BEND, look: GLASS.LOOK, look2: GLASS.LOOK2, nod: GLASS.NOD, tap: 0, glow: 0, phase: GLASS.SEATS[1][4], scale: 0.97, station: 1e6, tint: [0.97, 0.96, 0.98],
    rise: GLASS.SEATS[1][3], reach: glassPaw(2), reachArm: GLASS.PAW_ARM },
  'S2:2': { who: 'asleep', pose: 6, machine: null, look: 0.46, tap: 0, glow: 0, phase: 0.2, scale: 1, station: 1e6, tint: [1.04, 0.99, 0.93] },
  'S2:1': { who: 'asleep-2', pose: 6, machine: null, look: -0.52, tap: 0, glow: 0, phase: 0.55, scale: 0.96, station: 1e6, tint: [0.94, 0.95, 0.99] },
  'S3:2': { who: 'phone the wrong way round', pose: 1, machine: 'phone', back: true, picture: 0, look: 0.3, nod: 0.4, tap: 0.3, phase: 0.83, scale: 1, tint: [1.0, 0.97, 0.94] },
  'F3:0': { who: 'never connects', pose: 0, machine: 'laptop', picture: 0, look: 0.9, nod: 0.2, tap: 1, habit: 1, phase: 0.37, scale: 1, station: 1e6, tint: [0.97, 0.96, 0.97] },
  'F1:1': { who: 'an otter at its machine, on a machine', pose: 0, machine: 'laptop', picture: 2, look: 0.6, nod: 0.2, tap: 1, phase: 0.52, scale: 1, tint: [1.02, 0.98, 0.94] },
};
// RULED, their dice still drawn: the far block's rows 1 to 3, seats 0 and 1, always taken and at laptops (row 0's
// two were of this rule until round OF: its middle seat is now kept empty and its window seat is the one in
// headphones', both by NAMED); a tumbler on the aisle end of the tray in the far block's row 2, aisle seat (which
// never holds a laptop; row 1's aisle seat was of this rule until round OG: NAMED keeps it empty, no tumbler).
// NO_EMPTY_AISLE: the aisle seats of rows -1 to 5, either block, are never empty, BUT ROW 0'S AND ROW 1'S IN BOTH
// BLOCKS, which NAMED keeps empty (rows 4 and 5 joined them when the climb and the wheel were given faces to look at:
// the changes file, section 12).
export const RULES = { LAPTOP_ROWS: [1, 3], AISLE_DRINK: ['F2:2'], NO_EMPTY_AISLE: [-1, 5], THIN_ROWS: [6, 8], THIN_UNDER: 0.7 };
export const DEAL = {
  EMPTY: 0.10, MACHINE: [['laptop', 0.5], ['phone', 0.2], ['tablet', 0.16], ['lap', 0.14]], PICTURE: [0.4, 0.8], DRINK: 0.3,
  SIZE: [0.93, 1.04], LOOK: [0.6, 1.1], NOD: [0, 0.4], DRAWS: 12,
};
export const POSE_OF = { laptop: 0, phone: 1, tablet: 2, lap: 3 };
// THE LOOKS OF THE SKY: the first draw of the 'otter-look' stream; all three with a low sun on the side of x = 0,
// SUN_AHEAD degrees toward -z. ctx.vary.hour 'golden' asks for GOLD and 'dawn' for ROSE (the draw is still taken).
export const SKY = { LOOKS: [['GOLD', 0.55, 13], ['ROSE', 0.30, 9], ['AFTERGLOW', 0.15, 5]], SUN_AHEAD: 20, HOURS: { golden: 0, dawn: 1 } };
export const sunDir = (elevation) => { const e = elevation * D2R, a = SKY.SUN_AHEAD * D2R; return [-Math.cos(e) * Math.cos(a), Math.sin(e), -Math.cos(e) * Math.sin(a)]; };
// THE DEALERS. rng: a function giving numbers in 0..1 (the world: ctx.core.makeRng(ctx.core.hashSeed('otter-cast:' + seed))).
// EVERY one of the sixty seats takes DEAL.DRAWS draws, in one fixed order, before any test: a seat named, ruled or
// left out by quality still takes its draws, so no rule and no setting shifts another seat's deal.
// vary: { density 0.7..1.3 }; detail: ctx.quality.detail. opts.full: the heaviest deal by rule (every dealable seat taken).
// Returns one row a seat, rows -1 to 8, the sun block first: { id, row, seat, side, who, taken, species, machine, pose,
// back, picture, drink, armTray, trayDown, headphones, look, look2, nod, tap, habit, lean, glow, phase, scale, tint, mirror,
// station (null: by the wave's law), dealt }.
export function dealCast(rng, vary = {}, detail = 1, opts = {}) {
  const out = [], density = vary.density ?? 1, pEmpty = clamp(DEAL.EMPTY * (2 - density), 0, 1), R = RULES;
  for (let row = CABIN.ROW0; row <= CABIN.ROW1; row++) for (let side = 0; side < 2; side++) for (let seat = 0; seat < 3; seat++) {
    const u = []; for (let i = 0; i < DEAL.DRAWS; i++) u.push(rng());
    const id = seatId(row, seat, side), nm = NAMED[id], base = { id, row, seat, side, mirror: side === 1, armTray: row === CABIN.ROW0, lid: row === CABIN.ROW0 ? D.LID_FRONT : D.LID };   // lid: a front row's laptop stands open flatter (no back ahead of it): its top edge lies under its sitter's chin from where we come
    if (nm) {
      const taken = nm.who !== 'empty';
      out.push({ ...base, who: nm.who, dealt: false, taken, species: nm.species || 'river', machine: nm.machine ?? null, pose: nm.pose ?? null, back: !!nm.back,
        picture: nm.picture ?? 0, drink: null, trayDown: taken && nm.machine === 'laptop', headphones: !!nm.headphones, look: nm.look ?? 0, look2: nm.look2 ?? 0,
        nod: nm.nod ?? 0, tap: nm.tap ?? 0, habit: nm.habit ?? 2, lean: nm.lean ?? 0, glow: nm.glow ?? 1, phase: nm.phase ?? 0, scale: nm.scale ?? 1,
        tint: nm.tint || [1, 1, 1], station: nm.station ?? null, rise: nm.rise ?? 0, stand: nm.stand ?? 0, place: nm.place ?? null, reach: nm.reach ?? null, reachArm: nm.reachArm ?? 0, bend: nm.bend ?? 0 });
      continue;
    }
    const ruledLaptop = side === 1 && seat < 2 && row >= R.LAPTOP_ROWS[0] && row <= R.LAPTOP_ROWS[1], aisleDrink = R.AISLE_DRINK.includes(id);
    const mustSit = ruledLaptop || aisleDrink || (seat === 2 && row >= R.NO_EMPTY_AISLE[0] && row <= R.NO_EMPTY_AISLE[1]);
    let taken = opts.full || mustSit || u[0] >= pEmpty;
    if (!opts.full && detail < R.THIN_UNDER && row >= R.THIN_ROWS[0] && row <= R.THIN_ROWS[1] && (row + seat + side) % 2 === 1) taken = false;   // thinned by quality
    let machine = 'lap'; { let x = u[1]; for (const [name, p] of DEAL.MACHINE) { if (x < p) { machine = name; break; } x -= p; } }
    if (ruledLaptop) machine = 'laptop';
    if (aisleDrink && machine === 'laptop') machine = 'tablet';
    const picture = u[2] < DEAL.PICTURE[0] ? 0 : u[2] < DEAL.PICTURE[1] ? 1 : 2;
    // a drink stands on the tray's end AWAY from the aisle (the ruled one on the aisle end); never beside a laptop
    const drink = !taken ? null : aisleDrink ? 'aisle' : machine !== 'laptop' && u[3] < DEAL.DRINK ? 'window' : null;
    const a = u[4], b = u[5], lum = 0.94 + 0.12 * b, tint = [(0.94 + 0.12 * a) * lum, 0.97 * lum, (1 - 0.08 * a) * lum];
    let habit = Math.min(2, Math.floor(u[10] * 3));          // 0 the machine held up high and tilted about, 1 one claw tapping, 2 chin on a paw
    if (habit === 0 && (machine === 'laptop' || machine === 'lap')) habit = machine === 'laptop' ? 1 : 2;
    if (habit === 1 && machine !== 'laptop') habit = 2;
    out.push({ ...base, who: taken ? 'dealt' : 'nobody', dealt: true, taken, species: 'river', machine: taken ? machine : null, pose: taken ? POSE_OF[machine] : null, back: false,
      picture, drink, trayDown: taken && (machine === 'laptop' || !!drink), headphones: false,
      look: (u[8] < 0.5 ? -1 : 1) * (DEAL.LOOK[0] + (DEAL.LOOK[1] - DEAL.LOOK[0]) * u[9]), look2: 0, nod: DEAL.NOD[0] + (DEAL.NOD[1] - DEAL.NOD[0]) * u[11],
      tap: machine === 'lap' ? 0 : 1, habit, lean: 0, glow: 1, phase: u[7], scale: DEAL.SIZE[0] + (DEAL.SIZE[1] - DEAL.SIZE[0]) * u[6], tint, station: WAVE.AWAKE.includes(id) ? WAVE.ALWAYS : null });
  }
  return out;
}
// the look and the towers: rng is the 'otter-look' stream. The first draw is the look; then how many towers stand
// beyond the named one (3 to 7) and, for all seven (their dice always drawn), where: none nearer than TOWER.KEEP
// metres in plan to the airliner's axis, its wings' sweep or the outside route, by place (a candidate inside is moved
// straight out along x to the keep's edge on the side it lies).
export const TOWER = { N: 7, X: [-900, 900], Z: [-800, 800], KEEP: 420, TOP: [-5, 70], R: [60, 150] };
export function dealLook(rng, hour = 'any') {
  const u0 = rng(), un = rng(), towers = [];
  let look = 2; { let x = u0; for (let i = 0; i < SKY.LOOKS.length; i++) { if (x < SKY.LOOKS[i][1]) { look = i; break; } x -= SKY.LOOKS[i][1]; } }
  if (hour in SKY.HOURS) look = SKY.HOURS[hour];
  const n = OUTSIDE.TOWERS[0] + Math.min(OUTSIDE.TOWERS[1] - OUTSIDE.TOWERS[0], Math.floor(un * (OUTSIDE.TOWERS[1] - OUTSIDE.TOWERS[0] + 1)));
  for (let i = 0; i < TOWER.N; i++) {
    const ux = rng(), uz = rng(), ut = rng(), ur = rng();
    let x = TOWER.X[0] + (TOWER.X[1] - TOWER.X[0]) * ux; const z = TOWER.Z[0] + (TOWER.Z[1] - TOWER.Z[0]) * uz, r = TOWER.R[0] + (TOWER.R[1] - TOWER.R[0]) * ur;
    const dx = x - CABIN.MID_X; if (Math.abs(dx) < TOWER.KEEP + r) x = CABIN.MID_X + (dx < 0 ? -1 : 1) * (TOWER.KEEP + r);
    if (i < n) towers.push({ x, z, top: TOWER.TOP[0] + (TOWER.TOP[1] - TOWER.TOP[0]) * ut, r });
  }
  return { look, name: SKY.LOOKS[look][0], sunElevation: SKY.LOOKS[look][2], sun: sunDir(SKY.LOOKS[look][2]), towers };
}

// ---------- 6. MIRRORS FOR THE COUNT: each body as boxes, rounded boxes or closed forms; never smaller than the thing ----------
// box: [x0, y0, z0, x1, y1, z1] in cabin space. boxDist: the true distance from a place to it (0 inside).
export const boxDist = (b, x, y, z) => Math.hypot(Math.max(b[0] - x, 0, x - b[3]), Math.max(b[1] - y, 0, y - b[4]), Math.max(b[2] - z, 0, z - b[5]));
export const mirrorBox = (b, side) => (side ? [D.CABIN_W - b[3], b[1], b[2], D.CABIN_W - b[0], b[4], b[5]] : b);
// rounded box: [cx, cy, cz, hx, hy, hz, r]: the box of those half sizes with its edges rounded by r. Signed distance.
export const rboxDist = (s, x, y, z) => {
  const qx = Math.abs(x - s[0]) - (s[3] - s[6]), qy = Math.abs(y - s[1]) - (s[4] - s[6]), qz = Math.abs(z - s[2]) - (s[5] - s[6]);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - s[6];
};
// ONE SEAT ROW as the part builds it (seatRowSteps), as boxes: for each seat a cushion and its back in three bands
// (the back is raked: each band is the box of its own slice, shell and pocket included); four armrests with their
// webs; the frame and feet under the seats. row: the row; side: 0 sun block, 1 far block.
const BAND_Y = [8.3, 13.2, 18.2, 23.1], BAND_Z = [[-0.3, 2.95], [0.3, 2.85], [1.1, 3.2]];
export function rowBoxes(row, side = 0) {
  const z = row * D.PITCH, out = [];
  for (let s = 0; s < 3; s++) {
    const cx = seatX(s);
    out.push(['cushion', [cx - 4.4, 6.2, z - 9.15, cx + 4.4, 9.15, z + 0.15]]);
    for (let k = 0; k < 3; k++) out.push(['back', [cx - 4.45, BAND_Y[k], z + BAND_Z[k][0], cx + 4.45, BAND_Y[k + 1], z + BAND_Z[k][1]]]);
  }
  for (let k = 0; k < 4; k++) { const x = D.SEAT_X0 + D.ARM_W / 2 + k * (D.SEAT_W + D.ARM_W); out.push(['armrest', [x - 0.5, 6.7, z - 6.9, x + 0.5, 13.0, z + 0.5]]); }
  out.push(['frame', [1.3, 0, z - 8.1, 31.5, 6.7, z - 0.5]]);
  return out.map(([kind, b]) => ({ kind, row, side, box: mirrorBox(b, side) }));
}
// THE WALLS (upright to window height, then curving in on WALL_R), the floor, and the bins and ceiling as one section
// drawn the length of the cabin: the distance from a place INSIDE the cabin to the nearest of them (the windows'
// holes are not counted here: see windowGap). BIN: the bin's underside, its door's face, the cove and the ceiling.
const BIN = [[2.0, 33], [20.2, 33], [21.3, 33.22], [22, 33.8], [22.5, 34.8], [23.4, 37], [24.3, 39.2], [25, 40.8], [25.3, 41.5], [25.5, 42.3], [27.1, 42.6], [31, 42.85], [36.4, 42.95]];
const segDist2 = (px, py, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], t = clamp(((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy), 0, 1); return Math.hypot(px - a[0] - vx * t, py - a[1] - vy * t); };
// WALL_PAD: what stands in from the wall's own line (the ledge at armrest height 0.7 m, the window's bezel 0.25 m, the
// far unit's coarser wall 0.68 m); BIN_PAD: the lamps, nozzles and latch under and on the bin. Both are taken off.
export const WALL_PAD = 0.7, BIN_PAD = 0.25;
export function binDist(x, y) { const u = Math.min(x, D.CABIN_W - x); let m = Infinity; for (let i = 0; i + 1 < BIN.length; i++) m = Math.min(m, segDist2(u, y, BIN[i], BIN[i + 1])); return m - BIN_PAD; }
export function wallDist(x, y) { const u = Math.min(x, D.CABIN_W - x); return (y <= D.WIN_Y ? u : D.WALL_R - Math.hypot(u - D.WALL_R, y - D.WIN_Y)) - WALL_PAD; }
// THE PARTITIONS at z CABIN.Z0 and Z1: a panel from wall to wall; in the aisle's doorway a curtain whose folds and
// sway reach CURTAIN metres into the cabin (below y 36).
export const CURTAIN = 2.0;
export function partitionDist(x, y, z) {
  const door = x > 31.2 && x < 41.6 && y < 36, reach = door ? CURTAIN : 0.36;
  return Math.min(z - CABIN.Z0, CABIN.Z1 - z) - reach;
}
// A TRAY (the part's trayBuilder): down, the table and the two arms under it; stowed, the panel against the back
// ahead and its latch (either way the panel leans: the box holds both). arm: a front row tray on its stalk from the
// window-side armrest (the stalk's box runs from the armrest to the tray, on the seat's window side).
// long, lip: the hero's own tray (HERO.TRAY_LONG, TRAY_LIP): longer toward its sitter, a raised lip all round.
export function trayBoxes(row, seat, side = 0, down = true, arm = false, long = 0, lip = 0) {
  const t = trayAt(row, seat, side), cx = seatX(seat), zs = (row - 1) * D.PITCH, out = [];
  if (down) {
    out.push(['tray', [cx - 4.3, D.TRAY_Y - D.TRAY_T - 0.02, t.zBack, cx + 4.3, D.TRAY_Y + Math.max(0.08, lip + 0.01), t.zNear + long]]);
    if (arm) out.push(['stalk', [cx - 5.5, 12.0, t.zBack + 1.5, cx - 3.6, D.TRAY_Y, row * D.PITCH - 6.4]]);
    else out.push(['tray arms', [cx - 4.3, 10.9, zs + 1.0, cx + 4.3, D.TRAY_Y, t.zBack + 3.2]]);
  } else out.push(['tray stowed', [cx - 3.75, 13.7, zs + 1.9, cx + 3.75, 19.9, zs + 3.5]]);
  return out.map(([kind, b]) => ({ kind, row, side, box: mirrorBox(b, side) }));
}
// THE MACHINES as the part's deviceBuilder and machineFor place them, for a sitter at seatAt(...) of size sc facing -z:
// a laptop's deck and its lid (opened to D.LID, leaning away from the sitter); a phone or a tablet in the paws.
export function machineBoxes(sit, kind, sc = 1, lid = D.LID) {
  const p = sit.position, out = [];
  if (kind === 'laptop') { const z = p[2] - 4.95 * sc, H = D.SCREEN_H + 0.4, y0 = D.TRAY_Y + D.LAP_T;
    out.push(['laptop deck', [p[0] - 3.3, D.TRAY_Y, z - 2.25, p[0] + 3.3, D.TRAY_Y + D.LAP_T + 0.04, z + 2.25]]);
    // the lid by its opening angle (the sticker on its back lies inside the same box)
    out.push(['laptop lid', [p[0] - 3.3, y0, z - 2.1 + Math.min(0, Math.cos(lid)) * H - 0.2, p[0] + 3.3, y0 + Math.sin(lid) * H + 0.13, z - 1.95]]);
  } else if (kind === 'phone') { const y = p[1] + 6.85 * sc, z = p[2] - 3.52 * sc; out.push(['phone', [p[0] - 0.9, y - 1.75, z - 0.8, p[0] + 0.9, y + 1.75, z + 0.8]]);
  } else if (kind === 'tablet') { const y = p[1] + 6.5 * sc, z = p[2] - 3.9 * sc; out.push(['tablet', [p[0] - 1.7, y - 2.05, z - 1.5, p[0] + 1.7, y + 2.05, z + 1.5]]); }
  return out.map(([k, box]) => ({ kind: k, box }));
}
// THE HERO'S MACHINE, turned a quarter: the deck and the upright lid (the glass is the opening in its inner face).
export const HERO_BOXES = [
  { kind: 'hero deck', box: [4.15, 13.9, -12.55, 8.65, 14.24, -5.95] },
  { kind: 'hero lid', box: [4.2, 14.2, -12.55, 4.42, 19.6, -5.95] },
];
// A TUMBLER: 2.1 m tall, 0.85 m in radius at the lip; p: the middle of its foot. Where a seat's drink stands: on its
// tray, 1.5 m from the back ahead, 3.2 m from the tray's middle toward the window ('window') or the aisle ('aisle').
export const tumblerBox = (p) => [p[0] - 0.87, p[1], p[2] - 0.87, p[0] + 0.87, p[1] + 2.12, p[2] + 0.87];
export const tumblerAt = (row, seat, side, end) => { const t = trayAt(row, seat, 0); return [blockX(seatX(seat) + (end === 'aisle' ? 3.2 : -3.2), side), D.TRAY_Y, t.zBack + 1.5]; };
// THE BAY'S THINGS: the trolley (its rail and the tumblers on its top included), the crew otter's seat and back pad.
export const BAY_BOXES = [
  { kind: 'trolley', box: [47, 0, -46, 53, 20.6 + 0.6 + 2.12, -30] },
  { kind: 'crew seat', box: BAY.CREW.SEAT_BOX }, { kind: 'crew seat', box: BAY.CREW.BACK_BOX },
  { kind: 'the case in the bay', box: [GLASS.STAND.CASE[0] - 0.06, 0, GLASS.STAND.CASE[2], GLASS.STAND.CASE[3] + 0.42, GLASS.STAND.CASE[4], GLASS.STAND.CASE[5]] },
];
// THE ENTERED WINDOW'S FREE OPENING, seen along x: the reveal's inner outline where it is narrowest (at the skin,
// 0.97 of the oval: half sizes 2.231 x 3.201 m about y 20, a superellipse of power 2.7) under the chord of the
// pushed-up blind's lip (y 21.96). For a place (y, z) in the wall's thickness: hand = clear air to the outline at
// that height, either hand; above = to the lip; below = to the outline under it; member = the nearest of all.
export function windowGap(y, z, zMid = WINDOW.Z) {
  const a = (D.WIN_W / 2) * 0.97, b = (D.WIN_H / 2) * 0.97, e = 2.7, dy = y - D.WIN_Y, dz = z - zMid, lip = WINDOW.FREE_Y[1];
  const half = (v, h, o) => (Math.abs(v) >= h ? 0 : o * Math.pow(1 - Math.pow(Math.abs(v) / h, e), 1 / e));
  const hand = half(dy, b, a) - Math.abs(dz), above = lip - y, below = y - (D.WIN_Y - half(dz, a, b));
  let member = above;
  for (let i = 0; i < 1440; i++) {
    const t = (i / 1440) * 2 * PI, c = Math.cos(t), s = Math.sin(t), oz = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / e), oy = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / e);
    if (D.WIN_Y + oy > lip) continue;
    member = Math.min(member, Math.hypot(oz - dz, oy - dy));
  }
  return { hand, above, below, member };
}
// THE ANIMAL: a sitter's SWEPT SHAPE over its clock, as rounded boxes in its OWN space at size 1 (it faces +z there,
// its origin under its rump; x is flipped for a mirrored sitter). Each set holds every vertex the fur shader can
// place, at every clock, for the poses named (ow-count --part proves it on the part's own geometry and law):
//   SIT     poses 0 to 3 (laptop, phone, tablet, paws in the lap), waiting and awake, any glance up to 1.2 rad
//           either way, any nod, typing, tail and whiskers; lean 0
//   HABIT   the room a waiting habit may use beside SIT (a machine held up high and tilted, a chin on a paw):
//           the main part keeps every habit inside SIT and this box
//   ASLEEP  pose 6, tipped toward own +x (look > 0); the three shapes marked 1 flip in x when it tips the other way
//   REST    pose 5, the hero: lean -0.45, the head from LOOK to LOOK2, the right paw on the deck's corner
//   UP      pose 5 ON ITS HIND LEGS (UP: STAND, RISE, lean and head ends, NOTHING HELD; its own place and turn: upAt),
//           craning by the clock: trunk low and high, head, the two arms before its belly, the straightened legs,
//           the tail laid in a round where it sat
//   GLASS   pose 5 seated and bent sideways to its window; STAND: pose 5 on its hind legs on the case at the bay's window
//   SEA     the sea otter lying back in a seat (pose 4)       BELLY, AFLOAT, SIT_OUT, ROOF, SLIDER: the outside poses
// A shape is [cx, cy, cz, hx, hy, hz, r, flag]; flag 1: flips with the sleeper's tip.
// (The arms' mend, plan changes OC, set three faces further out; since OD-B the shapes of UP and of STAND are measured
// anew on the standing law, 0.1 m of room on every face, and only the sleeper's arm face still carries OC's 0.06 m.
// Since OF the one stood up holds nothing: UP has six shapes, none for a held arm.)
export const SHAPES = {
  SIT: [[0, 5.9, 0.7, 2.35, 6.0, 3.0, 1.3, 0], [0, 9.95, 2.2, 5.0, 3.25, 3.75, 1.8, 0], [0, 5.6, 2.8, 3.15, 2.55, 3.0, 1.2, 0],
    [0, 1.28, 1.2, 3.3, 1.38, 2.3, 0.6, 0], [-2.04, -0.93, 1.45, 2.5, 3.0, 4.65, 0.8, 0]],
  HABIT: [[0, 10.2, 4.4, 3.3, 3.2, 2.2, 1.0, 0]],
  ASLEEP: [[0.8, 5.6, 0.25, 3.05, 5.7, 2.55, 1.3, 1], [2.6, 10.25, 2.65, 3.0, 2.5, 2.85, 1.3, 1], [1.87, 5.7, 2.05, 4.33, 2.75, 2.4, 1.0, 1],
    [0, 1.28, 1.2, 3.3, 1.38, 2.3, 0.6, 0], [-2.04, -0.93, 1.45, 2.5, 3.0, 4.65, 0.8, 0]],
  REST: [[0, 3.2, 0.0, 2.5, 3.3, 3.0, 1.5, 0], [0, 7.9, -1.9, 2.3, 3.7, 2.7, 1.4, 0], [0, 10.65, -2.17, 4.8, 2.5, 3.55, 1.5, 0],
    [0, 5.6, -1.2, 3.0, 2.6, 2.3, 1.2, 0], [-1.6, 5.6, 1.3, 0.95, 0.85, 1.15, 0.5, 0], [0, 1.28, 1.2, 3.3, 1.38, 2.3, 0.6, 0], [-2.04, -0.93, 1.45, 2.5, 3.0, 4.65, 0.8, 0]],
  UP: [[0, 5.63, -0.01, 2.28, 3.25, 2.29, 0.3, 0], [0.01, 11.55, 0.77, 2.3, 3.93, 2.51, 0.3, 0], [1.32, 14.2, 2.88, 3.6, 2.52, 3.12, 0.3, 0],
    [0, 9.41, 1.72, 3.32, 3.03, 1.91, 0.3, 0], [0, 2.68, 0.16, 2.63, 2.75, 1.6, 0.3, 0], [2.12, 2.68, -3.12, 3.4, 2.76, 1.73, 0.3, 0]],   // six: no held arm since OF (the box of the two arms before the belly is the free arm's, made as wide to the right as to the left)
  SEA: [[0, 3.8, 1.15, 4.55, 7.95, 6.25, 1.8, 0]],      // (0.1 m more behind and above since OD-B: the sea otter's ears are larger, and dark)
  // a face at the glass, seated (pose 5 bent sideways toward the wall, GLASS: rise 0 to 1.5, its head ends, its paw on the reveal)
  GLASS: [[0.87, 6.39, -0.12, 3.1, 6.5, 2.4, 0.4, 0], [4.0, 10.65, 1.08, 3.15, 3.77, 3.7, 0.4, 0], [2.1, 6.58, 1.14, 4.33, 3.63, 2.28, 0.4, 0],
    [0, 1.38, 1.18, 3.32, 1.47, 2.3, 0.3, 0], [-2.04, -0.93, 1.45, 2.5, 3.0, 4.65, 0.8, 0]],
  // the one stood on the case at the bay's window (pose 5 on its hind legs, GLASS.STAND: its lean, its head ends and its paw
  // on the rim): trunk low and high, head, held arm, free arm, legs, tail
  STAND: [[0, 5.66, 0.07, 2.28, 3.27, 2.37, 0.3, 0], [0.01, 11.43, 1.12, 2.3, 3.94, 2.66, 0.3, 0], [-0.09, 14.01, 3.65, 4.09, 2.58, 2.79, 0.3, 0],
    [-1.44, 11.06, 3.71, 1.42, 1.82, 2.44, 0.3, 0], [0.19, 9.31, 1.97, 3.12, 3.04, 1.84, 0.3, 0], [0, 2.68, 0.16, 2.63, 2.75, 1.6, 0.3, 0], [2.12, 2.68, -3.12, 3.4, 2.76, 1.73, 0.3, 0]],
  BELLY: [[0, 1.4, 1.8, 4.2, 3.1, 12.1, 1.5, 0]],
  AFLOAT: [[0, 3.15, 3.4, 4.45, 4.95, 9.6, 1.5, 0]],
  SIT_OUT: [[0, 5.9, -1.8, 4.45, 6.6, 8.8, 1.5, 0]],
  ROOF: [[0, 7.1, 1.7, 4.6, 7.2, 4.6, 1.5, 0], [0, 0.9, -5.8, 1.4, 1.1, 5.8, 0.8, 0]],            // the one on the roof: pose 5 sat up (CROWN: its rise, lean, head ends and held paw), its tail behind it
  SLIDER: [[0, 1.8, 2.5, 12.6, 3.4, 12.6, 1.5, 0]],        // the belly pose on its slide: it turns about its own middle (own z 2.5), so the shape is square in plan
};
export const FUR = 0.29, WIND = 1.0;       // m added to every animal's figure: the breathing swell 0.11 and the whiskers' widening 0.18; outside, the wind's reach
// the distance from a place of cabin space to a sitter's shapes. sit: { position, yaw, scale, mirror, tip }.
export function sitterDist(sit, set, x, y, z) {
  const p = sit.position, sc = sit.scale || 1, c = Math.cos(sit.yaw), s = Math.sin(sit.yaw), dx = (x - p[0]) / sc, dz = (z - p[2]) / sc;
  const ox = (dx * c - dz * s) * (sit.mirror ? -1 : 1), oy = (y - p[1]) / sc, oz = dz * c + dx * s, flip = (sit.tip || 0) < 0;
  let m = Infinity; for (const q of set) m = Math.min(m, rboxDist(q, q[7] === 1 && flip ? -ox : ox, oy, oz));
  return m * sc;
}
// OUTSIDE BODIES. The hull: a tube about the airliner's axis. The wing's upper face: one flat four-cornered face
// (root at x 0, swept and rising to the tip). The dome, the aerials, the named tower's flat top with its billows.
export const hullDist = (x, y, z) => Math.hypot(x - CABIN.HULL_AXIS[0], y - CABIN.HULL_AXIS[1]) - CABIN.HULL_R;
function triDist(p, a, b, c) {                 // the distance from a place to a triangle (closest point by regions); BROUGHT IN: see this file's head
  const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]], dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap); let q;
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp), cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  const vc = d1 * d4 - d3 * d2, vb = d5 * d2 - d1 * d6, va = d3 * d6 - d5 * d4, at = (u, v, t) => [u[0] + v[0] * t, u[1] + v[1] * t, u[2] + v[2] * t];
  if (d1 <= 0 && d2 <= 0) q = a; else if (d3 >= 0 && d4 <= d3) q = b; else if (d6 >= 0 && d5 <= d6) q = c;
  else if (vc <= 0 && d1 >= 0 && d3 <= 0) q = at(a, ab, d1 / (d1 - d3)); else if (vb <= 0 && d2 >= 0 && d6 <= 0) q = at(a, ac, d2 / (d2 - d6));
  else if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) q = at(b, sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6));
  else { const dn = 1 / (va + vb + vc), v = vb * dn, w = vc * dn; q = [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w]; }
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}
export function wingDist(x, y, z) {            // the sun wing's upper face
  const W = OUTSIDE.WING, tx = W.ROOT_X - W.SPAN, ty = W.ROOT_Y + W.SPAN * Math.tan(W.RISE * D2R), tz = W.ROOT_Z[0] + W.SPAN * Math.tan(W.SWEEP * D2R);
  const a = [W.ROOT_X, W.ROOT_Y, W.ROOT_Z[0]], b = [W.ROOT_X, W.ROOT_Y, W.ROOT_Z[1]], c = [tx, ty, tz], e = [tx, ty, tz + W.TIP_CHORD];
  return Math.min(triDist([x, y, z], a, b, c), triDist([x, y, z], b, e, c));
}
export const DOME_SHAPE = [36.4, 54.9, -135, 7, 2.5, 15, 2.5];
export const aerialBox = (i) => { const [x, z] = OUTSIDE.AERIALS[i]; return [x - 0.4, 50, z - 1.2, x + 0.4, skinY(x) + OUTSIDE.AERIAL_H, z + 1.2]; };
export function towerDist(x, y, z) { const R = OUTSIDE.RAFT; return Math.hypot(Math.max(Math.hypot(x - R.middle[0], z - R.middle[2]) - R.BILLOW_R, 0), Math.max(y - R.BILLOW_TOP, 0)); }
export function windowCloudDist(x, y, z) { const W = OUTSIDE.WINDOW_CLOUD; return Math.hypot(Math.max(Math.hypot(x - W.centre[0], z - W.centre[2]) - W.R, 0), Math.max(y - W.TOP, 0, W.centre[1] - 6 - y)); }

// ---------- 7. THE STATIONS OF THE WAVE, laid once at build from the table (the same on every visit) ----------
// For each of the 57 seats beside the hero's row's three: its reach, place and RAW station by the arcs' law (seatReach,
// from the seat's own head place at size 1: a thing of the seat, whoever sits). Then ONE RULE MORE, so that no more
// than three screens begin to wake in any second: the seats in reach are taken in the order the first pulse reaches
// them (where it reaches two together, the nearer the line first), and NO STATION STANDS NEARER THAN WAVE.GAP METRES
// FLOWN TO THE ONE BEFORE IT. Three gaps are 8.7 m: 1.1 s at the cabin's 7.8 m/s. A seat's slot is its own whether
// or not it holds a screen. Returns { [id]: { reach, place, aside, raw, station, order } }; out of reach: station NEVER.
WAVE.GAP = 2.9; WAVE.AHEAD = [17, 32.5];
export function layStations(T, mouthM = mouthMetre(T), reach = WAVE.REACH, gap = WAVE.GAP) {
  const out = {}, queue = [];
  for (let row = CABIN.ROW0; row <= CABIN.ROW1; row++) for (let side = 0; side < 2; side++) for (let seat = 0; seat < 3; seat++) {
    const id = seatId(row, seat, side); if (row === HERO.SEAT[0] && side === HERO.SEAT[2]) { out[id] = { reach: false, place: null, aside: null, raw: WAVE.NEVER, station: WAVE.NEVER, order: -1 }; continue; }
    const h = ownToCabin(seatAt(row, seat, side), HEAD_OWN, 1), q = seatReach(T, h[0], h[2], mouthM, reach);
    out[id] = { reach: q.reach, place: q.place, aside: q.aside, raw: q.station, station: q.station, order: -1 };
    if (q.reach) queue.push(id);
  }
  queue.sort((a, b) => out[a].raw - out[b].raw || out[a].aside - out[b].aside || (a < b ? -1 : 1));
  let prev = -Infinity;
  queue.forEach((id, i) => { const s = out[id]; s.station = Math.max(s.raw, prev + gap); s.order = i; prev = s.station; });
  return out;
}
// a sitter's station: its typed one (NAMED: the hero, the sleepers, the one that never connects wait all flight; the
// sea otter has no waiting state), else its seat's
export const stationFor = (row, stations) => (row.station != null ? row.station : stations[row.id].station);
