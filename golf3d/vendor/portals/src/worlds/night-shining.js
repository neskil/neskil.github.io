// THE NIGHT-SHINING CLOUDS. Polar midnight, 38 km up, under a giant research balloon: ballast glitters away toward the
// pack ice, the camera lifts off the gondola, rises in a wide arc south of the balloon looking north at it and through
// it, climbs past its shoulder, and the balloon tears open like a flower around the way out.
// The sky, the Earth, the envelope, its burst, frost and ice dust are the hero part's (src/parts/night-shining.js);
// this file is the posing, the gondola, the flight train, the ballast, the sister balloons, the meteors and the looks.
//
// WHAT IS CARRIED WITH THE CAMERA, AND FOR HOW LONG
//   The engine's route is a level, dead-straight 460 m line (46 s at 10 m/s). The world is POSED about the camera: a rig
//   Group holds everything in BALLOON SPACE (+Y up, gondola's middle at the origin, the balloon's axis the Y axis,
//   +Z south, +X east) and each update rig.matrix = frame * inverse(pose(u)), pose(u) being the smooth spline through
//   the brief's eight keyed camera poses, keyed to u (the route), never to a clock. So for the first 300 m (u 0 to
//   U_LINE = 0.6527: THE FIRST 30.02 SECONDS OF ROUTE) the WHOLE CRAFT (gondola, flight train, ballast, sister
//   balloons, our frost flecks, the part's envelope, flakes and dust) is carried:
//   it moves in the engine's space so that the lens flies the brief's arc through balloon space. From U_LINE on pose(u)
//   runs along its own straight 68 degree line at path speed, the rig's matrix is constant, the craft STANDS, and the
//   last 160 m are real flight into a portal that reads as tilted 68 degrees. Only the sky, the Earth and the meteors
//   are at infinity (centred on the eye).
//   WHILE SEEN THROUGH THE PREVIOUS PORTAL (ctx.through, read on ctx each frame) everything carried is hidden and the
//   frame is the route's own entry (first point, level, looking down the line), not the viewing camera: sky and ice lie
//   still in space. After the crossing the frame is the passed camera's (never cached), its turning eased in from the
//   entry frame BY THE ROUTE over the first U_EASE of the path, so the first metres equal the opening.
//   THE GREATEST TURNING of the picture against the far scene is 28.53 degrees a second (at 7.10 s) AT THE USUAL PACE.
//   AT EVERY OTHER PACE THE FOLLOWER BOUNDS IT: a law of this world's own, since the engine's ceilings do not bind a
//   posed world. The pose is read at the follower's place F, not at the route's place S (both in seconds of route).
//   Each update with a step of time, F goes toward S UNDER TWO BOUNDS, and whichever binds first stops it. OF
//   TURNING: it spends at most OMEGA times that step, walked in steps of 0.02 s of route (a step costs the angle
//   between its two poses' whole rotations). OF ADVANCE: it goes forward by at most ADV, 2, times the route's own
//   advance of that update (the step of time times the rate, in the route's measure). NOT TO THE LAST HAIR: a
//   step of turning that cannot be paid in full is taken in part by proportion and trimmed once, and the greatest
//   turning counted is about a twentieth of a degree a second over the two figures: 58.01 and 145.01 on steps of
//   a 60th of a second, 58.05 and 145.05 on steps of a 240th. ITS TWO FIGURES OF TURNING: OMEGA is 58 degrees a
//   second while the engine's ctx.flight.rate is 5 or under (a steady flight, whose hurry is Pace times 2 and
//   whose camera's ceiling is 60) and 145 from 5.5 up (the ordinary camera in a hurry, Pace times 5, whose ceiling
//   is 150), an even ramp between.
//   TWO CASES ARE NOT COVERED. In both a steady flight has a rate over 5 for a while and gets the ramp or the 145:
//   (1) a speed carried in through the portal out of a far faster world (more than 13 times faster at Pace 2.5,
//   more than 33 times at Pace 1), for the first moments of the flight: by count 88 degrees a second arriving at a
//   rate of 7.5; (2) the steady camera, or calm worlds only, chosen IN THE MIDDLE OF AN ORDINARY HURRY: the rate
//   comes down from Pace times 5 toward Pace times 2 at the engine's 1.4 a second, and while it is over 5 the
//   turning can reach 145: by count never over 60 at Pace 1, over 60 for about half a second at Pace 1.5 (0.57 s
//   the greatest counted: the hurry at its full rate from the first metre, steady chosen at 5 s of route) and for
//   about 2 s at Pace 2.5 (2.13 s the greatest counted). A world is not told which camera flies, so neither is
//   closed here.
//   A THIRD CASE IS MENDED: A FRAME WITH NO TIME IN FLIGHT. The engine hands a step of time of nought not only
//   for a still but in a pause and for the visitor's photograph: the same moment drawn again. A step of nought
//   with the route's place exactly where the last update left it leaves F where it is, and its state with it, so
//   A PAUSED OR PHOTOGRAPHED FRAME SHOWS THE FOLLOWER'S PLACE, NOT THE ROUTE'S, and the flight goes on from it as
//   if that frame had not been (by count, at every tenth of a second of route in a hurry: nought of step and of
//   turn in that frame, and the flight after it equal to the bit; before the mending such a frame stood F on S
//   at once, a cut of up to 30 m of lens and 46 degrees of picture). A step of nought with the place MOVED is a
//   still and stands F on the route's place.
//   Where both bounds let S be reached F IS S to the bit, and at the usual pace it always is (the pose turns 28.53
//   a second at the most there, and the route's own advance is half the allowance), so no picture of the usual
//   pace changes. F STANDS ON THE ROUTE'S PLACE while the world is seen through a portal and at the first update
//   after it, in every still (the still page draws a frame with a step of a 60th at the still's place, which
//   stands F there, and then frames with a step of nought, which leave it there), and after any jump of the
//   route's place (S behind F, or S further on from the last S than half as much again as the step of time times
//   the rate explains). Its whole state is F and the last S: it reads the engine's rate and the step handed to
//   update, and no clock. ONLY THE POSE READS F: the gondola's turn, the pour, the meteors, the frost, the tearing
//   and the exit stay on S. THE HAND-OVER IS THE POSE'S OWN AND IS READ AT F like the rest of the pose: poseAt
//   passes onto its straight line at 30.02 s of the place it is given, and the rig stands from there. That is
//   30.02 s of route only because F has caught up with S before then on every counted flight (by about 22.4 s at
//   the latest); nothing else holds the two together. While F lags the lens stands at an earlier place of the
//   same line. COUNTED: at Pace 2.5 with no hurry, behind by 0.11 s of route at the most. In a hurry (toward a
//   rate of 5 or of 12.5), with the rate held from the first metre, or with the Pace or the camera moved inside
//   the hurry: behind by up to about 4.2 s, near 16.2 s of route, and for the last time at about 22.4 s. With one
//   hurry begun at any half second of route under the engine's own law of speed and nothing else moved: behind by
//   up to 3.5 s, and for the last time before 21 s. The least air against the gondola while it lags is 3.49 m,
//   and the usual pace's own least is 3.48 m (both with the rate held). THE LENS'S PLACE DOES NOT LEAP: catching
//   up, F covers at most twice the route's own advance in one update, so the lens goes at most twice the greater
//   of the flight's own steps at the two ends of the stretch it covers (by count 2.00 times). Against the own
//   step at the stretch's start alone it is about 2.1 times at the worst, where the lens gathers speed along its
//   line (2.09 the greatest counted with the rate held, on steps of a 30th; 2.14 with a hurry begun, on steps of
//   a 20th). Its greatest step in one update, with the rate held, is by count 1.28 m at a rate of 5 and 3.20 m at
//   a rate of 12.5 on steps of a 60th of a second, 3.81 m and 9.40 m on steps of a 20th; the lens's own greatest
//   step were F on S, over the first 30 s of route at those rates and steps, is 0.82, 2.04, 2.43 and 5.91 m.
//   THE FIRST SECOND AFTER A CROSSING, if the camera arrives pitched up: the frame keeps the arriving offset and eases it out by the route, so the limb can show early for that second (not mended).
//
// BY THE ROUTE (u), never by a clock: the pose (at the follower's place, above); THE GONDOLA'S TURN, 5 degrees a
//   second (the crew lead's ruling): its angle in balloon space is 5 deg * (46 u - 8); a turn on the clock would bring the boom and the wing round to any
//   place beside the lens (the clock runs while the world loads and while it is seen through a portal) and no air could
//   be promised. THE GONDOLA HOLDS THE CAMERA FOR THE FIRST EIGHT SECONDS: the brief's first two keys are poses in the
//   gondola's own frame, so pose(u) is the keyed pose turned about the balloon's axis by carry(u), which equals the
//   gondola's angle up to 8 s (in the picture the gondola stands, the ice, the moon's glitter and the sky turn under
//   it, and the lens creeps out along the boom), lets go over the next three seconds (a cubic that leaves at 5 degrees
//   a second and arrives at rest, no step) and is nothing from 11 s on: the keys from 11 s stand in balloon space.
//   THE TWO DEPARTURES FROM THE BRIEF'S HEADINGS (agreed; both by the route, the same on every seed and at every
//   pace): in the hold the gaze stands 16 degrees south of the brief's east to 1.6 s (heading 106), is the brief's
//   east from 3.7 to 5.1 s and then comes round toward the craft by 35 degrees (67 at 6.55 s, 64 at 7.3 s, 55 at 8 s); after the
//   lift-off it swings on to 27 at 9.5 s and 25 at 11 s (the gondola whole in the picture), dwells, and comes to north
//   at 17.3 s, not 14. The pitch of the hold is the brief's to 5.4 s; from there THE GAZE RISES, earlier than the lens (the limb, the arc
//   and the low sky in the upper third from about 7.1 s, the pod and the pour before them). The hold is three stands and two eased moves (see K_POS): the
//   lens stands at the entry to 1.6 s, abeam of the pod (0.4 m above the brief's straight way) from 3.7 to 5.1 s, and
//   at the brief's second place from 7.7 s.
//   Also by the route: the burst's clock (U_BURST, handed to the part), the frost's shedding (the part's, and how many
//   of our own flecks fall past the lens from 24 s, the brief's beat, to the tearing), the brief's meteor of 16 s and THE TWO METEORS OF
//   THE UPPER SKY (26.2 and 29.6 s), THE METEORS' QUIET (the sky's own strokes fall still from 15 to 34 s of route, so
//   that those three and their trains stand alone), the rare fireball of 17 s and its flash. The exit is the engine's
//   (drawWithin: the last 150 m).
// BY THE CLOCK (ambient): the half-degree swing, the foil, the wings, the telescope, the strobes, the ballast, the sky's
//   own meteors, the sisters' bob.
// EVERY TERM OF THIS FILE THAT READS THE EYE (all are light, filtering or facing; none clears a picture)
//   the rig's frame: the passed camera's matrix (the posing itself; while ctx.through, the route's entry instead).
//     cam0, at the end of build, is a STAND-IN while building: a camera of our own at the route's entry (level, 72
//     degrees, 16 to 9), handed to update once so that matrices and uniforms stand before the first frame; never kept.
//   uEye (the eye in balloon space): the sight line for what the foil, the metal, the solar cells and the sisters
//     mirror, their fresnel edge, glints and the arc's rim; a frost fleck's flash; a cord's round shading turned to the lens; with uPix,
//     which sizes of the foil's crinkle are drawn (a size finer than two or three pixels is left out, not faded:
//     the foil is as bright without it). No fade, no fog.
//   uPix (a pixel's size, from the camera's fov and the buffer's height): ribbons are never under a pixel and a half
//     wide, grains never under 1.3, the ballast's core and a frost fleck 1.5, a strobe's glare 4, and what the widening adds is taken
//     back in brightness; the meteors' widths are in pixels.
//   facing: grains, glare, the ballast's core and the meteors' ribbons are turned to the lens; so are THE CORDS (every
//     ribbon of ours: its width is laid across the sight line, LINE_VERT) and THE FROST FLECK (its plate is laid in the
//     picture's plane, turned by its spin and narrowed by its own tilt to the sight line). The meteors' group is
//     kept on the eye (they are at infinity). gl_FrontFacing turns a normal toward the viewer.
//   The part's own terms that read the eye are named at the head of its file.
//
// MAP OF THIS FILE
//   1. constants and THE POSE LAW (K_POS, K_PITCH, K_HEAD,   4. the gondola (buildGondola), the flight train
//      carryAt, poseAt)                                         (buildTrain)
//   2. shaders of the craft, the ribbons, the ballast,       5. sister balloons, ballast, meteors, strobes
//      the meteors, the strobes, the sister balloons         6. the world: looks, rig, update(), the return
//   3. the geometry builder (makeGeo)
// DRAW ORDER (the part's: sky -1, film 1 and 3, crown 2, ribbons 4, flakes and dust 5): meteors -0.5, the sisters'
//   film -0.45 and cords -0.4 (behind our film), solids 0, our cords 3.5 (never behind the film on the flown line), frost flecks 5.5, ballast 6 and 7,
//   strobes 8. The kit's makeSky and fx particles are not used: they assume the world's up, and here up is the rig's.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/night-shining.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const u1 = (v) => ({ value: v });
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------------------------------------------------------------- 1. the route and THE POSE LAW
const DUR = 46, LEN = 460;                                   // seconds, metres: 10 m/s
const PORTAL = [0, 278.5, 0], P30 = [0, 130.3, 59.7];        // balloon space: the way out, and the pose of the brief's 30 s
const LINE_LEN = Math.hypot(PORTAL[1] - P30[1], PORTAL[2] - P30[2]);                      // 159.77 m
const LINE_DIR = [0, (PORTAL[1] - P30[1]) / LINE_LEN, (PORTAL[2] - P30[2]) / LINE_LEN];   // 68.06 degrees up, north
const LINE_PITCH = Math.asin(LINE_DIR[1]) / DEG;
const U_LINE = 1 - LINE_LEN / LEN;                           // 0.6527: from here the rig stands (the brief's 30 s, 0.652)
const U_BURST = 30.8 / DUR;                                  // the burst's clock starts here; nothing else starts it
const U_EASE = 25 / LEN;                                     // the camera's own turning is eased in over the first 25 m
const S_LINE = U_LINE * DUR;                                 // 30.02 s of route
const TURN_RATE = 5 * DEG, S_HOLD = 8, S_LETGO = 3;          // the gondola's turn per second of route; the lens held to 8 s, let go over 3 s
// THE KEYS, by seconds of route (u * 46). Place: the brief's eight, to the letter (z metres south, y).
// Heading: the brief's, with the departures agreed. (1) IN THE HOLD the first two keys are in the gondola's own
// frame; the gaze stands H_IN at the entry (16 degrees south of the brief's east, so that the pod and its wing are
// whole in an upright picture too) and comes round toward the craft and the north (H_END east of north at 8 s).
// (2) IN THE CLIMB the heading comes to north at 17.3 s, not 14, and dwells about 24 degrees
// short of it from 11 to 15.5 s: the flight train stands a third of the way across.
// THE HOLD IS THREE STANDS AND TWO MOVES (the designers' amendment). The lens STANDS at the brief's entry to 1.6 s
// (the pod whole under the rail in the upper right, the comma pouring to the middle), GLIDES in 2.1 s to a place abeam
// of the pod, 1 m up and 2.4 m on (the pod and its wing whole in the middle, 58 down), STANDS there to 5.1 s,
// GLIDES in 2.6 s along the rail to the brief's second place while the gaze comes round, and STANDS there to the
// lift-off. Every move is eased in and out (the flat keys make the monotone cubic leave and arrive at rest: speed 0
// at both ends, 1.5 times the mean in the middle: 1.86 m/s in the first move, 2.1 m/s in the second). While the lens
// stands the picture lives by the craft's turn (5 degrees a second of ice under it), the pour, the foil and the strobe.
// THE GAZE LIFTS OFF EARLIER THAN THE LENS (the designers' sixth amendment). The PLACES are as they were. The pitch is
// the brief's 62 and 58 down to 5.4 s; then ONE rise that runs on through the lift-off to the key of 11 s and the
// tilt after it, never resting, never coming back. It creeps one degree up in 1.1 s (56.93 down at 6.53 s: the limb,
// 6.24 degrees under the level, shows first at a top corner, and first of all in a window 0.59 as wide as high,
// which the engine opens to 100 degrees: there at 56.9 down, so NO LIMB AND NO ARC BEFORE 6.53 s in any window from
// 0.4 to 2.4), then SURGES, 26 to 27 degrees a second from 6.7 to 7.2 s (44.45 down at 7.05 s, 38.35 at 7.3 s), so
// that the horizon stands in the hold's third picture; then it runs on at 10 to 12 a second through the lift-off
// (30.8 down at 8 s) and slows from 8.4 s: 26.2 down there, 20.4 at 9.3 s, 10 at 11 s (never under 5 a second). The
// limb enters the earliest window and 9 to 16 at 6.54 s, 9 to 20 at 6.56 s, 21 to 9 at 6.97 s and 16 to 9 at 7.03 s
// (corners first; the top's middle at 6.58 and 7.13 s); on a wide screen it stands 0.07 of the height from the top
// at 7.3 s with the ember arc over it, and at 7.9 s 0.17 (wide) and 0.30 (upright): in the upper third, the ice the
// greater part, the pod left of the middle and the pour under it. THE HEADING RESTS WHILE THE PITCH SURGES: it comes
// round from 5.1 s at 19 degrees a second to 67 at 6.55 s, goes on by 3 degrees only to 7.3 s, comes round to H_END
// at 8 s and runs on to 27 at 9.5 s; the arc's lit part (north) stands in the left half of the picture from the
// moment the limb is in it.
// THE TURNING OF THE PICTURE AGAINST THE FAR SCENE (the sky and the Earth: pitch and heading together, the gondola's
// 5 degrees a second in it while it holds the lens) is this law's to keep, since the engine's ceilings do not bind a
// posed world: the keys are set so that it is never over 28.53 degrees a second at the usual pace (the bound is 30),
// and THE FOLLOWER (follow(), below) bounds it at every other pace.
// It is 27.6 to 28.53 in the surge from 6.7 to 7.1 s (28.53 at 7.10 s), 25.8 at 11.3 s, 25.7 at 11.7 s, 24.9 at 8.2 s
// and 24.4 at most while the heading comes round before the surge.
// THE CUBE DURING THE RISE: it stands due north of the lens, so it comes in by the left edge and STANDS CUT BY IT
// until the swing of the heading brings it in whole (the 3 m truss cube, by its edges): on 16 to 9 from 6.61 to
// 8.61 s; on 21 to 9 from 5.41 to 8.33 s; on 9 to 16 from 8.51 to 9.36 s; on 9 to 20 from 8.77 s until it leaves by
// the bottom (there it is never whole). Its west wing is in whole on 16 to 9 at about 9.3 s.
// (3) AFTER THE LIFT-OFF the heading swings on at 17 to 22 degrees a second to 27 at 9.5 s and 25 at 11 s (the brief
// has 45 there); the gondola, which is always dead ahead of a heading of nothing, comes in from the left at the height
// of the limb, and LEAVES BY THE BOTTOM IN HALF A SECOND: the pitch passes 12 up at 12 s (22 degrees a second from
// 11 s, never over 26: the keys at 10.6, 11.5 and 12.4 s only even that tilt), so the cube, its wings and the
// telescope's tube do not stand cut by the bottom edge.
const H_END = 55, H_IN = 106;
const K_POS = [[0, 5, 0.5], [1.6, 5, 0.5], [3.7, 7.4, 1.5], [5.1, 7.4, 1.5], [7.7, 11, 2], [8, 11, 2], [11, 16, 12], [14, 24, 30], [19, 48, 58], [24, 62, 86], [28, 62, 113], [S_LINE, P30[2], P30[1]]];
const K_PITCH = [[0, -62], [1.6, -62], [3.7, -58], [5.4, -58], [6.2, -57.85], [6.42, -57.5], [6.53, -56.93], [6.65, -54.9], [6.75, -52.4], [6.9, -48.43], [7.05, -44.45], [7.2, -40.5], [7.3, -38.35], [7.45, -36.4], [7.7, -33.8], [8, -30.8], [8.4, -26.2], [9.3, -20.4],
  [10.6, -13.4], [11, -10], [11.5, 1.2], [12, 12], [12.4, 14.4], [14, 20], [19, 22], [24, 34], [28, 52], [S_LINE, LINE_PITCH]];
const K_HEAD = [[0, H_IN], [1.6, H_IN], [3.7, 90], [5.1, 90], [5.4, 87.2], [5.7, 82], [6, 76.3], [6.3, 70.7], [6.55, 67], [7.3, 64], [7.55, 61.2], [8, H_END], [8.35, 48.9], [8.7, 41.3], [9.05, 33.7], [9.5, 27], [11, 25], [13.5, 25], [15.5, 21], [17.3, 0], [S_LINE, 0]];
// a monotone cubic through one column of a table (no overshoot between keys); the slope at the last key is given, so
// the place runs into the straight line with its own speed and direction
function mono(T, col, endSlope) {
  const n = T.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((T[i + 1][col] - T[i][col]) / (T[i + 1][0] - T[i][0]));
  m[0] = d[0]; m[n - 1] = endSlope;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (S) => {
    let i = 0; while (i < n - 2 && S > T[i + 1][0]) i++;
    const a = T[i], b = T[i + 1], h = b[0] - a[0], t = clamp((S - a[0]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[col] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * b[col] + (t3 - t2) * h * m[i + 1];
  };
}
const keyZ = mono(K_POS, 1, LINE_DIR[2] * 10), keyY = mono(K_POS, 2, LINE_DIR[1] * 10), keyPitch = mono(K_PITCH, 1, 0), keyHead = mono(K_HEAD, 1, 0);
const _pm = new THREE.Matrix4(), _pf = V3(), _pz = V3(), _py = V3(0, 1, 0), _pq = new THREE.Quaternion();
// THE GONDOLA'S ANGLE about the balloon's axis, and THE CARRY: the angle by which the keyed pose is turned with it.
// They are equal up to S_HOLD (the gondola holds the lens). Then the carry runs on from C_HOLD to nothing over S_LETGO
// seconds as a cubic that leaves at the gondola's own rate and arrives at rest (no step in turning speed), so that in
// balloon space the gaze swings on from 55 degrees east of north at 8 s to 25 at 11 s without turning back.
// (C_HOLD is nothing: at the lift-off the gondola's frame and the balloon's are one.)
const C_HOLD = 0;
const gondolaAngle = (u) => C_HOLD + TURN_RATE * (DUR * clamp(u, 0, 1) - S_HOLD);
function carryAt(u) {
  const S = u * DUR;
  if (S >= S_HOLD + S_LETGO) return 0;
  if (S <= S_HOLD) return gondolaAngle(u);
  const x = (S - S_HOLD) / S_LETGO, x2 = x * x, x3 = x2 * x;
  return C_HOLD * (1 - 3 * x2 + 2 * x3) + TURN_RATE * S_LETGO * (x3 - 2 * x2 + x);
}
// pose(u): the camera in balloon space. out = { pos: Vector3, quat: Quaternion }
function poseAt(u, out) {
  u = clamp(u, 0, 1);
  let z, y, pitch, az;
  if (u >= U_LINE) { const d = (u - U_LINE) * LEN; z = P30[2] + LINE_DIR[2] * d; y = P30[1] + LINE_DIR[1] * d; pitch = LINE_PITCH; az = 0; }
  else { const S = u * DUR; z = keyZ(S); y = keyY(S); pitch = keyPitch(S); az = keyHead(S); }
  const cp = Math.cos(pitch * DEG);
  _pf.set(Math.sin(az * DEG) * cp, Math.sin(pitch * DEG), -Math.cos(az * DEG) * cp);
  out.pos.set(0, y, z);
  out.quat.setFromRotationMatrix(_pm.lookAt(_pz, _pf, _py));   // the camera's -Z along the gaze, no roll
  const c = carryAt(u);
  if (c !== 0) { out.pos.applyAxisAngle(_py, c); out.quat.premultiply(_pq.setFromAxisAngle(_py, c)); }
  return out;
}
// THE FOLLOWER: the place (a share of the route, as u is) at which the pose is read. st = { f: the follower's place,
// last: the route's place at the last update, or -1 for none }: its whole state. A STEP OF TIME OF NOUGHT ON AN
// UNMOVED PLACE (a last place there is, and u is exactly it: a pause, the visitor's photograph) is the same moment
// drawn again: it returns f and changes nothing. Otherwise, each update with a step of time it walks f toward u
// in steps of F_STEP (0.02 s of route) under two bounds, and whichever binds first ends the walk. OF TURNING: it
// pays for each step the angle between the two poses' whole rotations, out of a budget of OMEGA times the step of
// time (a step it cannot pay in full is taken in part by proportion, measured once more and trimmed: by count
// about a twentieth of a degree a second over the figure at the worst). OF ADVANCE: it goes no further than ADV
// times the route's own advance of this update (the step of time times the rate) from where it stood. Where both
// let u be reached f IS u, assigned. OMEGA: OMEGA_CALM to a rate of RATE_CALM, OMEGA_SWEEP from RATE_CALM +
// RATE_RAMP, even between. It stands on the route's place (f = u) with a step of nought on a place that has moved
// (a still), with no last place (the first update, and the first after a portal), when u is not ahead of f, and
// after a jump: u further on from the last place than JUMP times what the step of time and the rate explain. No
// clock, nothing made.
const F_STEP = 0.02 / DUR, OMEGA_CALM = 58 * DEG, OMEGA_SWEEP = 145 * DEG, RATE_CALM = 5, RATE_RAMP = 0.5, JUMP = 1.5, ADV = 2;
const _fa = { pos: V3(), quat: new THREE.Quaternion() }, _fb = { pos: V3(), quat: new THREE.Quaternion() };
function follow(st, u, dt, rate) {
  const last = st.last;
  if (!(dt > 0) && last >= 0 && u === last) return st.f;      // the same moment drawn again (a pause, the visitor's photograph): it stays, and its state with it
  st.last = u;
  if (!(rate > 0)) rate = 1;
  if (!(dt > 0) || last < 0 || u <= st.f || u - last > (JUMP * dt * rate) / DUR + 1e-9) { st.f = u; return u; }
  const cap = st.f + (ADV * dt * rate) / DUR, end = cap < u ? cap : u;      // the furthest it may go in this update: u itself where the allowance reaches it
  let f = st.f, left = dt * (OMEGA_CALM + (OMEGA_SWEEP - OMEGA_CALM) * clamp((rate - RATE_CALM) / RATE_RAMP, 0, 1)), a = _fa, b = _fb;
  poseAt(f, a);
  while (f < end) {
    const nx = end - f <= F_STEP ? end : f + F_STEP, cost = poseAt(nx, b).quat.angleTo(a.quat);
    if (cost > left) {      // the budget is spent: the step is taken in part, by proportion, measured once more and trimmed
      let g = f + (nx - f) * (left / cost); const c2 = poseAt(g, b).quat.angleTo(a.quat);
      if (c2 > left) g = f + (g - f) * (left / c2);
      f = g; break;
    }
    left -= cost; f = nx; const t = a; a = b; b = t;
  }
  st.f = f; return f;
}

// ---------------------------------------------------------------- 2. shaders
// Everything of the craft is lit in BALLOON SPACE by two lights and a fill given as uniforms (no THREE light is in the
// scene, so none is ever added, removed or switched): the moon key, THE ARC (the look's ember light, low in the north:
// every solid, cord, cloth and sister takes it on what it turns north, and along its edge where it stands against the
// north), the sheet from above, the ice from below.
const GLSL_LIGHT = /* glsl */`
  uniform vec3 uEye, uMoon, uMoonCol, uTwiCol, uSheetCol, uIceCol, uShadow, uStrobePos, uStrobeCol, uFlashCol, uFlashDir;
  uniform float uTime, uStrobe, uFlash, uPix, uWash;
  float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  vec3 h33(vec3 p){ return vec3(h31(p), h31(p + 17.3), h31(p + 41.7)); }
  // how much of the arc a face takes: all of it turned north, a seventh side on, none turned south
  float arcW(vec3 n){ float k = clamp(.38 - n.z * .62, 0., 1.); return k * k * (1. - .35 * abs(n.y)); }
  // what a mirror facing r would show: the sheet overhead, the arc broad and low in the north, moonlit ice below, the moon
  vec3 envB(vec3 r, float arc){
    vec3 c = uShadow * .7 + uSheetCol * smoothstep(-.1, .75, r.y) * .8 + uIceCol * (1. - smoothstep(-.55, .02, r.y)) * .5;
    float north = smoothstep(-.15, .9, -r.z);
    c += uTwiCol * north * north * exp(-abs(r.y + .03) * 4.2) * 3. * arc;
    float m = max(dot(r, uMoon), 0.);
    return c + uMoonCol * (pow(m, 260.) * 5. + pow(m, 14.) * .3);
  }
  // matte surfaces: key, arc, fill, bounce, and an indigo floor so no shadow is grey or black
  vec3 lightB(vec3 n, vec3 alb, vec3 p){
    float kd = max(dot(n, uMoon), 0.);
    vec3 c = alb * (uMoonCol * kd + uTwiCol * arcW(n) * .5 + uSheetCol * (.5 + .5 * n.y) * .55 + uIceCol * (.5 - .5 * n.y) * .22);
    c += uShadow * (.5 + alb) * .55;
    vec3 L = uStrobePos - p; float d2 = dot(L, L);
    c += alb * uStrobeCol * uStrobe * max(dot(n, L / sqrt(max(d2, 1e-4))), 0.) / (1. + d2 * .5);
    return c + alb * uFlashCol * uFlash * (.35 + .65 * max(dot(n, uFlashDir), 0.));
  }
  // PALE THINGS (silk, cords, a sister's film) keep their own colours on the deep twilight look, whose arc is a thin
  // red line: uWash is how much of the arc's broad light they take (all of it on the other looks, a tenth on that
  // one); the ember is then only a rim on what faces north
  vec3 lightP(vec3 n, vec3 alb, vec3 p){ return lightB(n, alb, p) - alb * uTwiCol * arcW(n) * .5 * (1. - uWash); }
  // the arc along an edge: whatever is seen against the north glows along its rim
  vec3 rimB(vec3 n, float nv){ return uTwiCol * pow(1. - nv, 2.5) * smoothstep(-.6, .5, -n.z); }
`;
// THE OUTRIGGER'S FRAME (in gondola space). The outrigger is an L of lattice at the cube's floor level: an east arm
// from the cube's lower north-east corner to an elbow 3.9 m east of the axis, and from the elbow THE RAIL, running
// south and 4.1 degrees toward the lens's side. bp(across, up, along) gives a place on the rail's frame. The lens of
// the opening rides at x 0, z 5 to 11, looking east and 62 degrees down: the rail lies along the top of its picture
// (3.4 to 3.9 m east, 2 m below), and the pod hung under its end (the bay, the hopper slung on the bay's near side,
// the wing beyond the bay) stands whole in its upper right; everything is north of z 9.6.
const BOOM_Y = -1.5, ARM_Z = -1.25, BOOM_R0 = [3.9, BOOM_Y, ARM_Z], BOOM_YAW = -4.1 * DEG, BOOM_TILT = 0;
const MB = new THREE.Matrix4().makeRotationY(BOOM_YAW).multiply(new THREE.Matrix4().makeRotationX(BOOM_TILT)).setPosition(BOOM_R0[0], BOOM_R0[1], BOOM_R0[2]);
const BD = [MB.elements[8], MB.elements[9], MB.elements[10]], BX = [MB.elements[0], MB.elements[1], MB.elements[2]];
const bp = (bx, by, bz) => { const e = MB.elements; return [e[0] * bx + e[4] * by + e[8] * bz + e[12], e[1] * bx + e[5] * by + e[9] * bz + e[13], e[2] * bx + e[6] * by + e[10] * bz + e[14]]; };
const BAY_Z = 8.26, BAY_H = [0.5, 0.6, 0.78];                 // the end bay on the rail's frame: its middle along, its half sizes
// THE POD (the end bay with all it carries, the hopper, the strobe, the wing) hangs POD_DY under the rail's end on four
// hangers, and the rail runs on over it: from the entry the lens sees the whole pod under the bar, with room over it,
// and only the rail runs out of the picture. bq(across, up, along) gives a place on the pod's frame (the rail's, lowered).
const POD_DY = -1.1, MP = MB.clone().multiply(new THREE.Matrix4().makeTranslation(0, POD_DY, 0));
const bq = (bx, by, bz) => bp(bx, by + POD_DY, bz);
// the rail's solar wing: from the bay's lower south-east corner, 36 degrees east of south, drooping 12 degrees
const WING_P = bq(0.7, -0.4, BAY_Z + 0.25), WING_L = 2.65;
const MW = new THREE.Matrix4().makeRotationY(36 * DEG).multiply(new THREE.Matrix4().makeRotationX(12 * DEG)).setPosition(WING_P[0], WING_P[1], WING_P[2]);
const WING_D = [MW.elements[8], MW.elements[9], MW.elements[10]];
const f3 = (a) => `vec3(${a.map((x) => x.toFixed(5)).join(', ')})`;
const CRAFT_VERT = /* glsl */`
  attribute vec3 aCol; attribute float aMat; attribute vec3 aWing;
  uniform mat4 uRigInv; uniform float uFeather, uTrack;
  varying vec3 vP, vN, vC, vO; varying float vMat;
  const vec3 WD = ${f3(WING_D)}, WP = ${f3(WING_P)};
  void main(){
    vec3 p = position, n = normal;
    if (abs(aWing.x) > 2.5) {     // 3: the rail's solar wing, feathering about its own long axis (the line along WD through WP)
      float c = cos(uFeather), s = sin(uFeather); vec3 q = p - WP;
      p = WP + q * c + cross(WD, q) * s + WD * dot(WD, q) * (1. - c); n = n * c + cross(WD, n) * s + WD * dot(WD, n) * (1. - c);
    } else
    if (abs(aWing.x) > .5) {      // 1: a solar wing feathering about its long axis (the X axis through y, z = aWing.yz); 2: the telescope's nod
      float a = abs(aWing.x) > 1.5 ? uTrack : uFeather * aWing.x, c = cos(a), s = sin(a); vec2 q = p.yz - aWing.yz;
      p.yz = aWing.yz + vec2(c * q.x - s * q.y, s * q.x + c * q.y); n.yz = vec2(c * n.y - s * n.z, s * n.y + c * n.z);
    }
    vec4 w = modelMatrix * vec4(p, 1.);
    vP = (uRigInv * w).xyz; vN = mat3(uRigInv) * (mat3(modelMatrix) * n); vC = aCol; vMat = aMat; vO = position;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
// aMat: 0 anodised metal, 1 foil (crinkled, rippling), 2 white paint, 3 solar cells, 4 self-lit (lamp glass), 5 silk
const CRAFT_FRAG = GLSL_LIGHT + /* glsl */`
  varying vec3 vP, vN, vC, vO; varying float vMat;
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(uEye - vP); float nv = clamp(dot(n, v), 0., 1.);
    vec3 col; float rim = .35;
    if (vMat > .5 && vMat < 1.5) {
      // CRINKLED FOIL: the blanket's slow billows, facets a hand wide and facets a finger wide, each size on a skewed
      // grid of its own (so no facet is a square), every facet with its own tilt and a dark crease at its border. A
      // ripple runs through them, and now and then a fine facet turns its mirror to the moon, the arc or the sheet:
      // the running glitter. A size of facet is left out where it would be finer than two or three pixels.
      vec3 o = vO; float px = uPix * length(uEye - vP);
      float wa = clamp(.047 / px, 0., 1.), wb = clamp(.019 / px, 0., 1.);
      vec3 qa = vec3(dot(o, vec3(.82, .41, .39)), dot(o, vec3(-.36, .86, -.36)), dot(o, vec3(-.45, .11, .89))) * 8.5 + .5 * sin(o.yzx * 6.1 + 1.7);
      vec3 qb = vec3(dot(o, vec3(.59, -.64, .49)), dot(o, vec3(.72, .69, .04)), dot(o, vec3(-.36, .33, .87))) * 21. + .45 * sin(o.zxy * 17. + 4.);
      vec3 ia = floor(qa), ib = floor(qb), fa = abs(fract(qa) - .5), fb = abs(fract(qb) - .5);
      float ph = dot(o, vec3(2.1, 1.3, 1.7)) - uTime * 1.3;
      vec3 t = (h33(ia) - .5) * .8 * wa + (h33(ib) - .5) * .5 * wb + .16 * sin(o.zxy * 2.3 + vec3(0., 2.1, 4.2)) + .1 * vec3(sin(ph), sin(ph * 1.31 + 2.), sin(ph * .77 + 4.));
      float ck = smoothstep(.42, .5, max(max(fa.x, fa.y), fa.z)) * .5 * wa + smoothstep(.4, .5, max(max(fb.x, fb.y), fb.z)) * .25 * wb;
      vec3 nf = normalize(n + t - n * dot(t, n) * .6);
      vec3 r = reflect(-v, nf);
      vec3 e = envB(r, 1.);      // (the sky's blue is mostly lost in gold: what the foil gives back is the light, in its own colour)
      col = mix(e, vec3(dot(e, vec3(.3, .5, .2))), .6) * vC * 1.75 * (1. - .55 * ck) + lightB(nf, vC * .5, vP) * (1. - .3 * ck);
      float gl = pow(max(sin(uTime * (1.2 + 2.6 * h31(ib + 7.)) + 37. * h31(ib)), 0.), 24.) * step(.8, h31(ib + 3.)) * wb;
      col += vC * (uMoonCol * .9 + uTwiCol * 1.6 * arcW(n) + uSheetCol * .4) * gl * 1.3;
      col += vC * vC * uStrobe * pow(max(dot(r, normalize(uStrobePos - vP)), 0.), 24.) * .9;      // the strobe's glint, in the foil's own gold
      rim = .5;
    } else if (vMat > 2.5 && vMat < 3.5) {
      // SOLAR CELLS (vC: metres along the panel, metres across, the panel's length): cells of deep blue glass, each a
      // shade and a hair's tilt of its own, silver lines between them, the sheet's blue sheen, a bright edge all round
      vec2 pc = vC.xy, cq = vec2(pc.x / .25, (pc.y + .66) / .165), g = abs(fract(cq) - .5);
      float line = smoothstep(.43, .47, max(g.x, g.y)), id = h31(vec3(floor(cq), 3.));
      float edge = 1. - smoothstep(.0, .035, min(min(pc.x, vC.z - pc.x), .655 - abs(pc.y)));
      vec3 alb = mix(mix(vec3(.01, .028, .12), vec3(.03, .03, .19), id), vec3(.55, .6, .7), line);
      vec3 nc = normalize(n + (h33(vec3(floor(cq), 7.)) - .5) * .05), r = reflect(-v, nc);
      float fr = pow(1. - nv, 3.);
      // (on the deep twilight look the glass mirrors the sheet and the moon, not the arc: a wing is blue, never magenta)
      col = lightP(n, alb, vP) + envB(r, .6 * uWash) * vec3(.4, .62, 1.2) * (.2 + .8 * fr) * (1. - .6 * line) + uSheetCol * vec3(.25, .45, 1.) * (.1 + .25 * id) * (1. - nv);
      col = mix(col, lightP(n, vec3(.82, .86, .95), vP) + envB(reflect(-v, n), uWash) * (.3 + .7 * fr), edge);
      rim *= uWash;
    } else if (vMat > 4.5) {
      // SILK: lit as cloth, and the light on its far side comes through it (the arc's from the north, the moon's)
      col = lightP(n, vC * .7, vP) + vC * (uTwiCol * (arcW(-n) * 1.3 + .12) * uWash + uMoonCol * max(dot(-n, uMoon), 0.) * .3 + uSheetCol * .3 * (1. - uWash));
      rim = .35 * uWash;
      col += uTwiCol * pow(1. - nv, 2.5) * smoothstep(0., .7, -n.z) * .8 * (1. - uWash);      // (on that look: the ember only as a rim on what faces north)
    } else if (vMat > 3.5) {
      col = vC * (.2 + .7 * uStrobe);
    } else {
      float metal = vMat < .5 ? 1. : 0.;
      vec3 r = reflect(-v, n);
      // (on the deep twilight look bare metal and paint keep their own colours as the pale things do: the lattice is
      // metal, not magenta, and the arc is only a thin rim on what is turned north)
      col = lightP(n, vC, vP) + envB(r, .35 * uWash) * mix(vec3(.04), vC * .5 + .1, metal) * (.35 + .65 * pow(1. - nv, 3.));
      rim *= mix(.7 * smoothstep(.1, .7, -n.z) * pow(1. - nv, 1.5), 1., uWash);
    }
    col += rimB(n, nv) * rim;      // the arc along every edge that stands against the north
    // nothing clips to white: what is brighter than the cap is brought down whole, so it keeps its colour
    float top = max(col.r, max(col.g, col.b));
    gl_FragColor = vec4(col * (top > 1.25 ? (1.25 + (1. - exp(-(top - 1.25) * 1.4)) * .45) / top : 1.), 1.);
  }
`;
// ribbons for every thin thing (load lines, shrouds, ladder cables, antennas): never under a pixel and a half wide; what
// the widening adds is taken back in brightness, so a far line is a fainter line, not a fatter one
const LINE_VERT = /* glsl */`
  attribute vec3 aDir, aCol; attribute vec3 aSide;      // aSide: (side -1/+1, width in metres, sway 0..1)
  uniform mat4 uRigInv; uniform float uPix, uTime;
  varying vec3 vC, vN, vP; varying float vK, vS;
  void main(){
    vec3 p = position;
    float sw = aSide.z * aSide.z;
    p += sw * vec3(sin(uTime * 2.3 + position.y * 1.7 + position.x * 3.), 0., cos(uTime * 1.9 + position.z * 2.3)) * .07;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    vec3 t = normalize((modelViewMatrix * vec4(aDir, 0.)).xyz), e = normalize(-mv.xyz);
    vec3 s = cross(t, e); float sl = length(s); s = sl > 1e-4 ? s / sl : vec3(1., 0., 0.);
    float wMin = 1.5 * uPix * max(-mv.z, .05), w = max(aSide.y, wMin);
    mv.xyz += s * aSide.x * w * .5;
    vK = clamp(aSide.y / w, 0., 1.); vS = aSide.x; vC = aCol;
    vec4 wp = modelMatrix * vec4(p, 1.); vP = (uRigInv * wp).xyz;
    vN = mat3(uRigInv) * (mat3(modelMatrix) * aDir);      // (the cord's own direction, in balloon space)
    gl_Position = projectionMatrix * mv;
  }
`;
const LINE_FRAG = GLSL_LIGHT + /* glsl */`
  varying vec3 vC, vN, vP; varying float vK, vS;
  void main(){
    vec3 v = normalize(uEye - vP), t = normalize(vN);
    // a round cord: its normal sweeps from one edge to the other, facing the lens in the middle
    vec3 side = normalize(cross(t, v) + 1e-5), n = normalize(v * sqrt(max(1. - vS * vS, 0.)) + side * vS);
    vec3 col = lightP(n, vC, vP) + envB(reflect(-v, n), .2 * uWash) * .08;
    // the arc on the cord (one that runs north takes none; on the deep twilight look only the side turned north takes it)
    col += vC * uTwiCol * (.25 + .75 * smoothstep(-.9, .3, -n.z)) * sqrt(max(1. - t.z * t.z, 0.)) * 1.6 * mix(smoothstep(.25, .85, -n.z), 1., uWash);
    float a = mix(.35, 1., vK);
    gl_FragColor = vec4(col * a, a);
  }
`;
// THE BALLAST. One law for the grains and for the soft core: a grain that left the valve tau seconds ago is where the
// valve is now, thrown outward by the chute, spread a little, carrying the swing the dribble had when it left, and
// fallen freely. It never comes near the lens (it falls away from a valve 2.5 m off).
const GLSL_STREAM = /* glsl */`
  uniform vec3 uValve, uOut; uniform float uTime, uPix;
  vec3 streamAt(float tau, vec3 lat){
    float tr = uTime - tau;
    vec3 wav = vec3(sin(tr * 3.1) + .5 * sin(tr * 7.3 + 1.), 0., cos(tr * 2.3) + .5 * sin(tr * 5.9)) * .014;
    return uValve + lat * (.022 + .085 * tau + .02 * tau * tau) + wav * (1. + 2.5 * tau) + uOut * (1.0 * tau) - vec3(0., .25 * tau + 4.85 * tau * tau, 0.);
  }
`;
const GRAIN_VERT = GLSL_STREAM + /* glsl */`
  attribute vec4 aSeed;      // phase, angle, radius, kind
  varying vec2 vUv; varying float vA, vG;
  void main(){
    float life = aSeed.w < .68 ? 1.5 + aSeed.w : 7.;                 // most grains are followed for the first metres only
    float tau = fract(uTime / life + aSeed.x) * life, a = aSeed.y * 6.2832;
    vec3 p = streamAt(tau, vec3(cos(a), 0., sin(a)) * sqrt(aSeed.z));
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    float size = .008 + .01 * fract(aSeed.w * 7.3), s = max(size, 1.3 * uPix * max(-mv.z, .05));
    mv.xy += position.xy * s;
    vUv = position.xy;
    vG = pow(.5 + .5 * sin(uTime * (7. + 15. * fract(aSeed.w * 3.7)) + aSeed.x * 97. + tau * 5.), 10.);      // each grain tumbles and glints
    vA = min(1., size / s * 1.6) * (1. - smoothstep(life * .75, life, tau)) * smoothstep(0., .04, tau);      // (each is drawn as the brighter of grain and ground: what the widening adds is taken back by its width)
    gl_Position = projectionMatrix * mv;
  }
`;
const GRAIN_FRAG = /* glsl */`
  uniform vec3 uCol, uGlint; varying vec2 vUv; varying float vA, vG;
  void main(){
    float r = length(vUv), a = (1. - smoothstep(.45, 1., r)) * vA; vec3 c = uCol + uGlint * vG * 3.4;
    gl_FragColor = vec4(c * min(1., 2. / max(c.r, max(c.g, c.b))) * a, 1.);      // (capped at 2; drawn as the brighter of grain and ground, so grains never add up)
  }
`;
const CORE_VERT = GLSL_STREAM + /* glsl */`
  attribute vec2 aK;      // (0..1 along, side)
  varying float vS, vA;
  void main(){
    float tau = aK.x * aK.x * 7.;
    vec4 a = modelViewMatrix * vec4(streamAt(tau, vec3(0.)), 1.), b = modelViewMatrix * vec4(streamAt(tau + .02 + .05 * tau, vec3(0.)), 1.);
    vec2 t = b.xy / max(-b.z, .05) - a.xy / max(-a.z, .05); float tl = length(t); t = tl > 1e-6 ? t / tl : vec2(0., -1.);
    float wTrue = .03 + .1 * tau, w = max(wTrue, 1.5 * uPix * max(-a.z, .05));
    a.xy += vec2(-t.y, t.x) * aK.y * w * .5;
    vS = aK.y; vA = (wTrue / w) * smoothstep(0., .05, aK.x) * (1. - smoothstep(.8, 1., aK.x)) / (1. + .12 * tau);
    gl_Position = projectionMatrix * a;
  }
`;
const CORE_FRAG = /* glsl */`
  uniform vec3 uCol; varying float vS, vA;
  void main(){ float e = 1. - vS * vS; gl_FragColor = vec4(uCol * e * e * vA * .5, 1.); }
`;
// METEORS: ribbons on the sky (centred on the eye, so at infinity), each a great-circle stroke from uA to uB. The head
// runs the stroke in uPar.x seconds: a bright point. THE TRAIN it leaves lives uPar.y seconds and is ONE CONTINUOUS
// SOFT STREAK along the meteor's own straight path, as long as the stroke (16 to 28 degrees): brightest and broadest
// where the head went last, tapering evenly to nothing toward where the stroke began; it widens softly (in angle) and
// bends only gently as it ages (one slow bow and a slight S, no zigzag), and it fades from its old end toward its
// head's end, so what is left is always one streak; its colour passes from white-gold through green to rose.
// Drawn with the depth test, so the craft and the portal's disc cover them.
const N_MET = 13;      // six of the sky's own (by time); by u: the brief's meteor of 16 s, the fireball of 17 s and its three pieces, the meteors of 26.2 and 29.6 s
const S_MET = [26.2, 29.6];      // seconds of route at which the two meteors of the upper sky begin
const MET_VERT = /* glsl */`
  attribute vec3 aK;      // (ribbon, 0..1 along, side)
  uniform vec3 uA[${N_MET}], uB[${N_MET}], uPar[${N_MET}]; uniform float uAge[${N_MET}], uPix;
  varying float vS, vI, vHead, vA;
  void main(){
    int i = int(aK.x + .5);
    float age = uAge[i], dur = uPar[i].x, life = uPar[i].y, z = uPar[i].z, on = step(0., age) * step(age, dur + life);
    float head = clamp(age / dur, 0., 1.), k = aK.y * head, old = max(age - k * dur, 0.);
    vec3 d0 = normalize(mix(uA[i], uB[i], k)), tv = uB[i] - uA[i], t = normalize(tv - d0 * dot(tv, d0)), n = cross(d0, t);
    // the winds bend it gently: one slow bow and a slight S, both growing with the age of each piece (nothing while it is fresh)
    float wr = 1. - exp(-old / 6.);
    vec3 d = normalize(d0 + n * (sin(k * 3.1 + aK.x * 1.9) * .012 + sin(k * 6.5 + aK.x * 5.1 - old * .1) * .005) * wr * z);
    vec4 mv = modelViewMatrix * vec4(d * 6000., 1.);
    vec3 tm = normalize((modelViewMatrix * vec4(t, 0.)).xyz), s = cross(tm, normalize(mv.xyz)); float sl = length(s); s = sl > 1e-4 ? s / sl : vec3(0., 1., 0.);
    float hk = smoothstep(.93, 1., aK.y) * step(age, dur + .15);                      // the head: a point at the stroke's end, while it runs
    // the streak's taper: a hair where the stroke began, full toward the head's end, closing softly at its very tip
    float tp = (.12 + .88 * smoothstep(0., .85, k)) * (1. - .75 * smoothstep(.9, 1., k));
    // its width, in angle: a hair when fresh, to three degrees of soft glow where the head went last
    float wa = (.0025 + .05 * (1. - exp(-old / (life * .45)))) * tp;
    float w = 6000. * max(uPix * (1.3 + 2.6 * hk), wa) * z;
    mv.xyz += s * aK.z * w * .5;
    // it fades from its old end: the piece at k lives (.6 + .4 k) of the train's life, so the end where the stroke began
    // goes first and the fade runs up the streak toward the head's end
    float a = clamp(old / (life * (.6 + .4 * k)), 0., 1.), fade = (1. - a) * (1. - a * .5);
    float tr = smoothstep(0., .3, k) * (.3 + .7 * k) * (1. - smoothstep(.96, 1., k)) * fade * 1.5 * pow(.0025 / max(wa / tp, .0025), .3);   // (what the widening adds is taken back, softly)
    vS = aK.z; vHead = hk; vA = clamp(old / life + (1. - k) * .12, 0., 1.);
    vI = on * step(1e-4, head) * z * (tr + hk * 3.);
    gl_Position = projectionMatrix * mv;
  }
`;
const MET_FRAG = /* glsl */`
  uniform vec3 uHeadCol; varying float vS, vI, vHead, vA;
  void main(){
    float e = max(exp(-vS * vS * 3.4) - .034, 0.) * (1. - vS * vS * vS * vS);      // soft across: no edge
    vec3 c = mix(mix(vec3(1., .86, .56), vec3(.42, 1., .6), smoothstep(.04, .3, vA)), vec3(1., .46, .62), smoothstep(.45, .9, vA));
    gl_FragColor = vec4(mix(c, uHeadCol, vHead) * e * min(vI, 2.), 1.);
  }
`;
// STROBES: ours and the sisters', a quad each, the place and the eased flash given per lamp
const N_LAMP = 3;
const LAMP_VERT = /* glsl */`
  attribute float aI; uniform vec4 uLamp[${N_LAMP}]; uniform float uPix;      // xyz in balloon space, w the eased flash
  varying vec2 vUv; varying float vI;
  void main(){
    vec4 L = uLamp[int(aI + .5)]; vec4 mv = modelViewMatrix * vec4(L.xyz, 1.);
    float s = max(.17, 4. * uPix * max(-mv.z, .05)) * (.4 + .6 * L.w);
    mv.xy += position.xy * s; vUv = position.xy; vI = L.w;
    gl_Position = projectionMatrix * mv;
  }
`;
const LAMP_FRAG = /* glsl */`
  uniform vec3 uCol; varying vec2 vUv; varying float vI;
  void main(){ float r2 = dot(vUv, vUv); gl_FragColor = vec4(uCol * vI * (exp(-r2 * 9.) * .5 + exp(-r2 * 60.) * .8) * (1. - smoothstep(.6, 1., r2)), 1.); }      // (1.3 at most, over a lamp glass of 0.9: the glare keeps its blue)
`;
// THE FROST THAT FALLS PAST THE LENS (24 s of route to the tearing: the brief's beat for the frost falling past is
// 24 to 30 s): flecks peel off the south film between y 95 and 150, where
// it is at its widest or below (so a fleck falls free of it), drift outward at 0.5 to 2.2 m/s and fall at 1.4 to 3 m/s
// through the air the lens climbs in. Each is a law of time (no state); HOW MANY are shed is by the route (uShed).
// BY PLACE: no fleck's middle within 2.5 m of the flown plane (x = 0), so nothing of it within 2.2 m. A fleck is
// a six-sided plate of frost, 6 to 28 cm across, that tumbles: lit by the sheet, the moon and the arc as a pale solid
// thing (drawn over what is behind it, so it reads against the dome as against the sky), and when it mirrors the
// moon, the sheet or the arc to the lens it flashes: a four-rayed spark over the plate. The near ones are few and
// large; the far ones go down to a pixel and a half and fade out (they are not stars). The plate is capped at 1.15, its spark at 1.8.
const FLECK_VERT = /* glsl */`
  attribute vec4 aA, aB;      // aA: bearing (0 is south), birth height, the film's radius there and a little, phase. aB: period s, fall m/s, size m, number
  uniform vec3 uEye, uMoon, uMoonCol, uSheetCol, uTwiCol; uniform float uTime, uShed, uPix, uWash;
  varying vec2 vUv; varying vec4 vC; varying vec3 vG; varying float vPh;
  void main(){
    float ph = fract(uTime / aB.x + aA.w), age = ph * aB.x, vr = .5 + 1.7 * fract(aA.w * 7.31);
    float r = aA.z + vr * age + .5 * sin(age * .5 + aA.w * 50.), th = aA.x + .5 * sin(age * .23 + aA.w * 30.) / max(aA.z, 8.);
    vec3 c = vec3(sin(th) * r, aA.y - aB.y * age + .3 * sin(age * .9 + aA.w * 70.), cos(th) * r);
    c.x += sign(c.x + 1e-4) * 2.5 * exp(-abs(c.x) / 2.5);
    float vis = smoothstep(aB.w, aB.w + .06, uShed * 1.06) * smoothstep(0., .05, ph) * (1. - smoothstep(.85, 1., ph));
    float spin = uTime * (1.5 + 4. * aB.w) + aA.w * 90.;
    vec3 V = normalize(c - uEye), n = normalize(vec3(sin(spin), cos(spin * .73 + 1.), sin(spin * 1.31 + 2.)));
    float sm = pow(abs(dot(n, normalize(uMoon - V))), 11.), ss = pow(abs(dot(n, normalize(vec3(0., 1., 0.) - V))), 10.), sa = pow(abs(dot(n, normalize(vec3(0., .12, -.99) - V))), 10.);
    vec4 mv = modelViewMatrix * vec4(c, 1.);
    float grow = max(1., 1.5 * uPix * max(-mv.z, .05) / aB.z), ang = spin * .37;
    vec2 q = vec2(position.x * cos(ang) - position.y * sin(ang), position.x * sin(ang) + position.y * cos(ang));
    mv.xy += q * vec2(1., .35 + .65 * abs(dot(n, V))) * aB.z * grow;
    vUv = position.xy; vPh = aA.w * 40.;
    vec3 col = vec3(.7, .84, 1.) * (dot(uSheetCol, vec3(.3, .5, .2)) * 1.0 + .14) + uMoonCol * (.28 * abs(dot(n, uMoon)) + .14) + uTwiCol * .25 * abs(n.z) * uWash;
    vec3 gl = uMoonCol * 7. * sm + uSheetCol * 3. * ss + uTwiCol * 2.5 * sa;
    float al = vis / (grow * grow);      // (a far fleck, widened to its pixel and a half, fades out)
    vC = vec4(col * min(1., 1.15 / max(col.r, max(col.g, col.b))), al);
    vG = gl * min(1., 1.8 / max(gl.r, max(gl.g, max(gl.b, 1e-3)))) * al;
    gl_Position = projectionMatrix * mv;
  }
`;
const FLECK_FRAG = /* glsl */`
  varying vec2 vUv; varying vec4 vC; varying vec3 vG; varying float vPh;
  void main(){
    vec2 a = abs(vUv); float h = max(a.x * .866 + a.y * .5, a.y) * (1. + .1 * sin(atan(vUv.y, vUv.x) * 3. + vPh) + .06 * sin(atan(vUv.y, vUv.x) * 7. - vPh * 1.7));      // a six-sided plate, chipped: each has an outline of its own
    float al = (1. - smoothstep(.5, .64, h)) * vC.a * .88;
    float ray = exp(-a.x * a.y * 70.) * exp(-dot(vUv, vUv) * 2.6) * (1. - smoothstep(.7, 1., max(a.x, a.y)));           // the spark's four rays
    // (the plate's rim a little brighter; colour times cover, drawn over; the spark is light added, on the plate and beyond it)
    gl_FragColor = vec4(vC.rgb * (.7 + .5 * smoothstep(.2, .52, h)) * al + vG * (ray + .5 * al), al);
  }
`;
// THE SISTER BALLOON, the same craft as ours and the scale of the sky: a thin film that what stands behind it comes
// through, the arc's warm light on its north side and along its edge, the moon's silver on its edge, a fleck of gold
const SIS_VERT = /* glsl */`
  attribute float aMat; uniform mat4 uRigInv; varying vec3 vP, vN; varying float vMat, vY;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.); vP = (uRigInv * w).xyz; vN = mat3(uRigInv) * (mat3(modelMatrix) * normal); vMat = aMat; vY = position.y; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const SIS_FRAG = GLSL_LIGHT + /* glsl */`
  varying vec3 vP, vN; varying float vMat, vY;
  void main(){
    vec3 no = normalize(vN), n = gl_FrontFacing ? no : -no;      // no: the film's own outward side
    vec3 v = normalize(uEye - vP); float nv = clamp(dot(n, v), 0., 1.), rim = 1. - nv;
    if (vMat > .5) {      // its gondola: a fleck of gold foil
      vec3 gold = vec3(1., .66, .22), c = lightB(n, gold * .8, vP) + envB(reflect(-v, n), 1.) * gold * .9;
      gl_FragColor = vec4(c * min(1., 1.6 / max(c.r, 1e-3)), 1.); return;
    }
    float a = .3 + .62 * pow(rim, 1.6);      // the film: thin and clear in its middle, a bright edge
    vec3 col = uShadow * .9 + uSheetCol * (.5 + .5 * no.y) * .06;
    col += uTwiCol * (arcW(no) * .55 * uWash + pow(rim, 2.) * smoothstep(-.7 + .7 * (1. - uWash), .4 + .3 * (1. - uWash), -no.z) * .5);
    col += uSheetCol * (.5 + .5 * no.y) * .12 * (1. - uWash);
    col += uMoonCol * (pow(max(dot(no, uMoon), 0.), 2.) * .1 + pow(rim, 2.6) * smoothstep(-.1, .7, dot(n, uMoon)) * .9);
    col += uSheetCol * pow(rim, 3.) * .15;
    gl_FragColor = vec4(col * a, a);
  }
`;

// ---------------------------------------------------------------- 3. the geometry builder
// Merged, per-vertex colour and material (aMat as in CRAFT_FRAG). xf() sets the matrix laid on what follows; wing() marks
// what follows as part of a feathering solar wing (sign, and the y, z of its hinge line).
const IDENT = new THREE.Matrix4();
function makeGeo() {
  const P = [], N = [], C = [], M = [], W = [];
  const m = new THREE.Matrix4(), nm = new THREE.Matrix3(), a = V3(), n = V3(), e1 = V3(), e2 = V3(), ax = V3(), bx = V3(), by = V3();
  let wing = [0, 0, 0];
  const vert = (p, nr, col, mat) => {
    a.set(p[0], p[1], p[2]).applyMatrix4(m); n.set(nr[0], nr[1], nr[2]).applyMatrix3(nm).normalize();
    P.push(a.x, a.y, a.z); N.push(n.x, n.y, n.z); C.push(col[0], col[1], col[2]); M.push(mat); W.push(wing[0], wing[1], wing[2]);
  };
  const g = {
    count: () => P.length / 9,
    xf(mat) { m.copy(mat || IDENT); nm.getNormalMatrix(m); return g; },
    wing(s = 0, y = 0, z = 0) { wing = [s, y, z]; return g; },
    tri(p0, p1, p2, col, mat, n0, n1, n2) {
      if (!n0) { e1.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); e2.set(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]); e1.cross(e2).normalize(); n0 = n1 = n2 = [e1.x, e1.y, e1.z]; }
      vert(p0, n0, col, mat); vert(p1, n1, col, mat); vert(p2, n2, col, mat); return g;
    },
    quad(p0, p1, p2, p3, col, mat, n0, n1, n2, n3) { g.tri(p0, p1, p2, col, mat, n0, n1, n2); g.tri(p0, p2, p3, col, mat, n0, n2, n3); return g; },
    // a flat quad with a colour at each corner (the solar cells carry their panel's own coordinates there)
    quadC(ps, cs, mat) {
      e1.set(ps[1][0] - ps[0][0], ps[1][1] - ps[0][1], ps[1][2] - ps[0][2]); e2.set(ps[2][0] - ps[0][0], ps[2][1] - ps[0][1], ps[2][2] - ps[0][2]); e1.cross(e2).normalize();
      const nn = [e1.x, e1.y, e1.z]; for (const i of [0, 1, 2, 0, 2, 3]) vert(ps[i], nn, cs[i], mat); return g;
    },
    box(cx, cy, cz, sx, sy, sz, col, mat = 0) {
      const x = sx / 2, y = sy / 2, z = sz / 2, v = (i, j, k) => [cx + i * x, cy + j * y, cz + k * z];
      g.quad(v(1, -1, 1), v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), col, mat); g.quad(v(-1, -1, -1), v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1), col, mat);
      g.quad(v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1), v(-1, 1, -1), col, mat); g.quad(v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1), col, mat);
      g.quad(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1), col, mat); g.quad(v(1, -1, -1), v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1), col, mat);
      return g;
    },
    // a round member from p0 to p1 (radius r at p0, r1 at p1), smooth, open ended
    tube(p0, p1, r, col, mat = 0, seg = 6, r1 = r) {
      ax.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); const L = ax.length(); if (L < 1e-6) return g; ax.divideScalar(L);
      bx.set(Math.abs(ax.y) < 0.9 ? 0 : 1, Math.abs(ax.y) < 0.9 ? 1 : 0, 0).cross(ax).normalize(); by.crossVectors(ax, bx);
      const ring = [];
      for (let i = 0; i <= seg; i++) { const t = (i / seg) * TAU, c = Math.cos(t), s = Math.sin(t); ring.push([bx.x * c + by.x * s, bx.y * c + by.y * s, bx.z * c + by.z * s]); }
      for (let i = 0; i < seg; i++) {
        const na = ring[i], nb = ring[i + 1];
        g.quad([p0[0] + na[0] * r, p0[1] + na[1] * r, p0[2] + na[2] * r], [p0[0] + nb[0] * r, p0[1] + nb[1] * r, p0[2] + nb[2] * r],
          [p1[0] + nb[0] * r1, p1[1] + nb[1] * r1, p1[2] + nb[2] * r1], [p1[0] + na[0] * r1, p1[1] + na[1] * r1, p1[2] + na[2] * r1], col, mat, na, nb, nb, na);
      }
      return g;
    },
    // turned about the local Y axis: pts = [[radius, y], ...] from the bottom up; smooth round, creased along the profile
    lathe(pts, seg, col, mat = 0) {
      for (let j = 0; j < pts.length - 1; j++) {
        const [r0, y0] = pts[j], [r1, y1] = pts[j + 1], dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1, nr = dy / l, ny = -dr / l;
        for (let i = 0; i < seg; i++) {
          const t0 = (i / seg) * TAU, t1 = ((i + 1) / seg) * TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
          const n0 = [c0 * nr, ny, s0 * nr], n1 = [c1 * nr, ny, s1 * nr];
          if (r0 > 1e-5) g.tri([c0 * r0, y0, s0 * r0], [c1 * r1, y1, s1 * r1], [c1 * r0, y0, s1 * r0], col, mat, n0, n1, n1);
          if (r1 > 1e-5) g.tri([c0 * r0, y0, s0 * r0], [c0 * r1, y1, s0 * r1], [c1 * r1, y1, s1 * r1], col, mat, n0, n0, n1);
        }
      }
      return g;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aMat', new THREE.Float32BufferAttribute(M, 1));
      geo.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 3));
      return geo;
    },
  };
  return g;
}
// ribbons: add(points, width in metres, colour, sway at the first point, sway at the last)
function makeLines() {
  const P = [], D = [], C = [], S = [], I = [];
  return {
    add(pts, w, col, sw0 = 0, sw1 = 0) {
      const base = P.length / 3, n = pts.length;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q0 = pts[Math.max(i - 1, 0)], q1 = pts[Math.min(i + 1, n - 1)];
        let dx = q1[0] - q0[0], dy = q1[1] - q0[1], dz = q1[2] - q0[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
        const sw = sw0 + (sw1 - sw0) * (i / (n - 1));
        for (const s of [-1, 1]) { P.push(p[0], p[1], p[2]); D.push(dx, dy, dz); C.push(col[0], col[1], col[2]); S.push(s, w, sw); }
        if (i < n - 1) { const k = base + i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      return this;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aDir', new THREE.Float32BufferAttribute(D, 3));
      geo.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 3)); geo.setIndex(I);
      return geo;
    },
  };
}
const seg3 = (a, b, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n; o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } return o; };

// ---------------------------------------------------------------- 4. the gondola and the flight train
// GONDOLA SPACE: the gondola's middle at the origin, +Y up. It is also the frame of the brief's first two keys: the
// held lens rides at x 0, from (y 0.5, z 5) to (y 2, z 11), looking east at first and 62 to 58 degrees down, so its
// picture's right is +Z, its top is +X, and the cube (5 m to its left) is out of the picture. A 3 m truss cube round a
// foil-wrapped instrument box with a 4 m solar wing on its west and on its east face; THE OUTRIGGER, an L of lattice
// with a harness (an east arm from the cube's lower north-east corner, a bolted elbow, a 7 m rail running south), stayed
// from the cube's upper corners; at the rail's end a 1 by 1.56 m truss bay in foil (gussets, bolt heads, a taped lid
// with plugs, cables, an antenna), THE BALLAST HOPPER (a metre across) slung from the bay on the lens's side, the strobe
// on the bay's near post, and a 2.65 m wing running out south-east from the bay's lower corner. THE HOLD'S THREE
// PICTURES: at the entry the rail lies along the top edge and the pod hangs whole under it in the upper right, the
// hopper before the bay; from 3.7 to 5.3 s the lens is abeam, 3 m above the rail, and the bay, the hopper and the
// wing stand whole in the middle; at 8 s they are 6.5 to 7.5 m off, left of the middle under the limb and the arc. Nothing of the
// outrigger or the pod is higher than y -1.3; the lens passes 3.4 m and more off the hopper.
const C_ALU = [0.5, 0.54, 0.62], C_DARK = [0.09, 0.105, 0.16], C_GOLD = [1.0, 0.66, 0.22], C_TAPE = [0.72, 0.76, 0.84], C_WHITE = [0.8, 0.83, 0.88];
const C_BLACK = [0.012, 0.014, 0.022], C_PAD = [0.42, 0.44, 0.5], C_LAMP = [0.75, 0.9, 1.0], C_CORD = [0.5, 0.52, 0.56];
const HOP = [-1.1, 0.05, BAY_Z - 0.45], HOP_K = 1.6, HOP_C = bq(HOP[0], HOP[1], HOP[2]);      // the hopper's drum (1 m across): its middle on the rail's frame, its scale, its middle in gondola space (it hangs plumb)
const VALVE = [HOP_C[0], HOP_C[1] - 0.63 * HOP_K, HOP_C[2]], LAMP = bq(-BAY_H[0], 0.8, BAY_Z - BAY_H[2]), OUT = [BX[0] * 0.2 - BD[0], 0, BX[2] * 0.2 - BD[2]];   // the chute throws back along the boom
// (built in steps: pause is the contract's ctx.yield, awaited between the sections so that no step is long)
async function buildGondola(cast, rg, pause) {
  const g = makeGeo(), L = makeLines(), q = new THREE.Quaternion(), mt = new THREE.Matrix4(), UP = V3(0, 1, 0), nv = V3(), ONE = V3(1, 1, 1);
  let base = IDENT;                                              // the frame laid under what follows: the gondola's, an arm's, the wing's
  const home = () => g.xf(base);
  const at = (p, n) => g.xf(mt.compose(V3(p[0], p[1], p[2]), q.setFromUnitVectors(UP, nv.set(n[0], n[1], n[2]).normalize()), ONE).premultiply(base));
  const cable = (pts, r, col, mat = 0) => { for (let i = 0; i < pts.length - 1; i++) g.tube(pts[i], pts[i + 1], r, col, mat, 5); };
  const bolt = (p, n) => { at(p, n); g.lathe([[0.024, 0], [0.024, 0.016], [0.012, 0.022], [0, 0.022]], 6, C_ALU, 0); home(); };
  // a truss box about c with half sizes h: tubes along its edges, a diagonal on each face, a gusset plate with three
  // bolt heads in each plane at every corner
  const frameTubes = (c, h, r) => {
    const P = (i, j, k) => [c[0] + i * h[0], c[1] + j * h[1], c[2] + k * h[2]];
    for (const a of [-1, 1]) for (const b of [-1, 1]) { g.tube(P(-1, a, b), P(1, a, b), r, C_ALU, 0, 8); g.tube(P(a, -1, b), P(a, 1, b), r, C_ALU, 0, 8); g.tube(P(a, b, -1), P(a, b, 1), r, C_ALU, 0, 8); }
    for (const s of [-1, 1]) {
      g.tube(P(s, -1, -1), P(s, 1, 1), r * 0.62, C_ALU, 0, 6); g.tube(P(-1, -1, s), P(1, 1, s), r * 0.62, C_ALU, 0, 6);
      g.tube(P(-1, s, -1), P(1, s, 1), r * 0.62, C_ALU, 0, 6); g.tube(P(-1, s, 1), P(1, s, -1), r * 0.62, C_ALU, 0, 6);
    }
  };
  const frameCorners = (c, h, r, PL, sx) => {      // the four corners at the side sx
    const P = (i, j, k) => [c[0] + i * h[0], c[1] + j * h[1], c[2] + k * h[2]];
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      const cn = P(sx, sy, sz), sg = [sx, sy, sz];
      for (let ax = 0; ax < 3; ax++) {            // the plate in the plane whose normal is the axis ax
        const u = (ax + 1) % 3, v = (ax + 2) % 3, p0 = cn.slice(), n = [0, 0, 0]; n[ax] = sg[ax]; p0[ax] += sg[ax] * (r + 0.007);
        const p1 = p0.slice(), p2 = p0.slice(); p1[u] -= sg[u] * PL; p2[v] -= sg[v] * PL;
        g.tri(p0, p1, p2, C_DARK, 0, n, n, n);
        for (const [fu, fv] of [[0.16, 0.16], [0.62, 0.14], [0.14, 0.62]]) { const b = p0.slice(); b[u] -= sg[u] * PL * fu; b[v] -= sg[v] * PL * fv; bolt(b, n); }
      }
    }
  };
  const frame = (c, h, r, PL) => { frameTubes(c, h, r); frameCorners(c, h, r, PL, -1); frameCorners(c, h, r, PL, 1); };
  const H = 1.5;
  // ---- the truss cube
  frameTubes([0, 0, 0], [H, H, H], 0.045); frameCorners([0, 0, 0], [H, H, H], 0.045, 0.34, -1);
  await pause();
  frameCorners([0, 0, 0], [H, H, H], 0.045, 0.34, 1);
  await pause();
  // ---- the instrument box in crinkled gold foil, taped at its edges; a white radiator on its north face
  g.box(0, -0.15, 0, 2.5, 2.3, 2.5, C_GOLD, 1);
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    g.box(a * 1.255, -0.15, b * 1.255, 0.05, 2.32, 0.05, C_TAPE, 1); g.box(a * 1.255, 1.0, 0, 0.05, 0.05, 2.5, C_TAPE, 1); g.box(0, 1.0, a * 1.255, 2.5, 0.05, 0.05, C_TAPE, 1);
  }
  g.box(0, -0.1, -1.29, 1.7, 1.5, 0.04, C_WHITE, 2);
  for (let i = -3; i <= 3; i++) g.box(i * 0.24, -0.1, -1.325, 0.03, 1.5, 0.05, C_WHITE, 2);      // its fins
  g.box(-1.29, 0.2, 0.3, 0.05, 0.6, 0.9, C_DARK, 0); g.box(-1.33, 0.2, 0.3, 0.03, 0.42, 0.7, C_TAPE, 1);      // a patch antenna
  for (let i = 0; i < 5; i++) g.tube([1.27 + 0.03 * (i % 2), -1.2, -1.0 + i * 0.07], [1.27 + 0.03 * (i % 2), 0.95, -1.0 + i * 0.07], 0.014, i % 2 ? C_DARK : C_CORD, 0, 5);   // a cable loom
  for (const a of [-1, 1]) { g.box(a * 1.256, 0.3, 0, 0.012, 0.06, 2.5, C_TAPE, 1); g.box(0, 0.3, a * 1.256, 2.5, 0.06, 0.012, C_TAPE, 1); }      // a taped seam round the blanket
  g.box(0.7, -0.9, 1.262, 0.52, 0.3, 0.024, C_DARK, 0);                                                              // a connector plate, south face: its cables run down to the floor frame
  for (let i = 0; i < 5; i++) {
    const x = 0.52 + i * 0.09, y = -0.94 + (i % 2) * 0.09;
    at([x, y, 1.274], [0, 0, 1]); g.lathe([[0.026, 0], [0.026, 0.05], [0.017, 0.06], [0.017, 0.09]], 8, i % 2 ? C_ALU : C_TAPE, 0); home();
    cable([[x, y, 1.37], [x + 0.06, -1.2, 1.46], [1.0 + i * 0.07, -1.47, 1.53]], 0.011, i === 2 ? C_GOLD : C_BLACK, i === 2 ? 1 : 0);
  }
  // ---- crush pads under the corners: stepped honeycomb drums
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    at([a * 1.25, -1.5, b * 1.25], [0, -1, 0]);
    g.lathe([[0.1, 0], [0.24, 0.02], [0.24, 0.1], [0.2, 0.12], [0.24, 0.14], [0.24, 0.24], [0.2, 0.26], [0.24, 0.28], [0.24, 0.4], [0.0, 0.42]], 14, C_PAD, 2);
  }
  g.xf();
  await pause();
  // ---- the cast on the roof: the white telescope staring up at the clouds (it nods as it tracks), or a ring of small cameras
  if (cast === 'telescope') {
    g.wing(2, 0.9, -0.2);
    g.xf(mt.makeRotationX(-10 * DEG).setPosition(0.3, 0.9, -0.2));
    g.lathe([[0.3, -0.9], [0.44, -0.8], [0.44, 2.15], [0.47, 2.17], [0.47, 2.25], [0.44, 2.27], [0.44, 2.3]], 28, C_WHITE, 2);
    g.lathe([[0.415, 2.3], [0.415, 0.4], [0.0, 0.4]], 28, C_BLACK, 0);                              // the dark inside
    for (const y of [0.1, 0.9, 1.6]) g.lathe([[0.44, y], [0.475, y + 0.015], [0.475, y + 0.06], [0.44, y + 0.075]], 28, C_ALU, 0);
    g.lathe([[0.46, -0.55], [0.5, -0.5], [0.5, 0.0], [0.46, 0.05]], 28, C_GOLD, 1);                 // a foil collar
    for (let i = 0; i < 3; i++) { const t = i * 2.094 + 0.4; g.tube([Math.cos(t) * 0.42, 2.12, Math.sin(t) * 0.42], [0, 2.0, 0], 0.012, C_DARK, 0, 4); }
    g.lathe([[0.0, 1.9], [0.11, 1.92], [0.11, 2.02], [0.0, 2.04]], 12, C_DARK, 0);                  // the secondary
    g.lathe([[0.37, 0.44], [0.0, 0.41]], 28, C_TAPE, 0);                                            // the mirror, far down the tube
    g.tube([0.56, 0.75, 0.1], [0.56, 1.7, 0.1], 0.07, C_WHITE, 2, 12); g.tube([0.56, 1.7, 0.1], [0.56, 1.86, 0.1], 0.082, C_DARK, 0, 12);   // the finder
    for (const y of [0.95, 1.5]) g.box(0.49, y, 0.1, 0.09, 0.05, 0.05, C_ALU, 0);
    g.box(-0.6, -0.3, 0, 0.3, 0.44, 0.34, C_GOLD, 1); g.box(-0.76, -0.3, 0, 0.02, 0.34, 0.26, C_WHITE, 2); g.box(-0.6, -0.07, 0, 0.32, 0.03, 0.36, C_TAPE, 1);   // the camera at its foot
    cable([[-0.6, -0.52, 0.1], [-0.55, -0.72, 0.2], [-0.3, -0.86, 0.3]], 0.014, C_BLACK);
    g.xf().wing();
    g.tube([0.3, 0.2, 0.25], [0.3, 0.9, -0.2], 0.05, C_ALU, 0, 8); g.tube([-0.2, 1.0, -0.2], [0.8, 1.0, -0.2], 0.04, C_ALU, 0, 8);   // its fork
  } else {
    g.lathe([[1.02, 1.42], [1.08, 1.44], [1.08, 1.5], [1.02, 1.52], [0.96, 1.5], [0.96, 1.44], [1.02, 1.42]], 36, C_ALU, 0);        // the rail
    for (let i = 0; i < 8; i++) {
      const t = (i / 8) * TAU + 0.2, c = Math.cos(t), s = Math.sin(t), p = [c * 1.02, 1.5, s * 1.02];
      at(p, [c * 0.55, 0.83, s * 0.55]);
      g.lathe([[0.09, 0], [0.09, 0.3], [0.13, 0.32], [0.15, 0.52]], 12, C_WHITE, 2); g.lathe([[0.135, 0.52], [0.085, 0.3], [0.0, 0.3]], 12, C_BLACK, 0);
      g.lathe([[0.1, 0.02], [0.115, 0.04], [0.115, 0.16], [0.1, 0.18]], 12, C_GOLD, 1);
      g.xf(); cable([[c * 0.94, 1.56, s * 0.94], [c * 0.6, 1.53, s * 0.6], [c * 0.31, 1.2, s * 0.31]], 0.012, i % 3 ? C_BLACK : C_GOLD, i % 3 ? 0 : 1);
    }
    g.xf(); g.lathe([[0.0, 1.0], [0.3, 1.0], [0.3, 1.25], [0.22, 1.3], [0.0, 1.42]], 18, C_DARK, 0);   // the all-sky lens in the middle
  }
  await pause();
  // ---- a solar wing: cells up, foil backing, a tube frame. P(along, across, lift) places it; flip keeps the cells' face up
  const panel = (P, t0, t1, hw, flip) => {
    const qd = (a, b, c, d, col, mat) => (flip ? g.quad(d, c, b, a, col, mat) : g.quad(a, b, c, d, col, mat));
    const cp = [P(t0, hw, 0.02), P(t1, hw, 0.02), P(t1, -hw, 0.02), P(t0, -hw, 0.02)], L = t1 - t0, cc = [[0, hw, L], [L, hw, L], [L, -hw, L], [0, -hw, L]];
    if (flip) g.quadC(cp.slice().reverse(), cc.slice().reverse(), 3); else g.quadC(cp, cc, 3);
    qd(P(t0, -hw, -0.02), P(t1, -hw, -0.02), P(t1, hw, -0.02), P(t0, hw, -0.02), C_TAPE, 1);
    for (const w of [-hw - 0.02, hw + 0.02]) g.tube(P(t0, w, 0), P(t1, w, 0), 0.022, C_ALU, 0, 6);
    for (let i = 0; i <= 4; i++) { const t = t0 + ((t1 - t0) * i) / 4; g.tube(P(t, -hw - 0.02, 0), P(t, hw + 0.02, 0), 0.02, C_ALU, 0, 6); }
  };
  // the two wings, on yokes on the cube's west and east faces, feathering about their long axes (the shader turns them)
  const WY = 1.15;
  for (const sw of [-1, 1]) {
    g.tube([sw * 1.5, WY, 0], [sw * 1.85, WY, 0], 0.04, C_ALU, 0, 8);
    g.wing(sw, WY, 0); panel((t, w, dy) => [t, WY + dy, w], sw < 0 ? -5.85 : 1.85, sw < 0 ? -1.85 : 5.85, 0.66, false); g.wing();
  }
  // ---- THE OUTRIGGER: triangular lattice (two chords at the cube's floor level, one 0.42 m under them) laid along
  // the +Z of the frame under it, with a harness on the chord at -X: one cable in gold wrap and two dark ones, clamped
  const BW = 0.25, BDP = -0.42;
  const lattice = (z0, zl, nb) => {
    const dz = (zl - z0) / nb;
    for (const sx of [-1, 1]) g.tube([sx * BW, 0, z0], [sx * BW, 0, zl], 0.026, C_ALU, 0, 8);
    g.tube([0, BDP, z0], [0, BDP, zl], 0.026, C_ALU, 0, 8);
    for (let i = 0; i <= nb; i++) {
      const z = z0 + i * dz, zn = z + dz, e = i % 2;
      g.tube([-BW, 0, z], [BW, 0, z], 0.014, C_ALU, 0, 5); g.tube([-BW, 0, z], [0, BDP, z], 0.014, C_ALU, 0, 5); g.tube([BW, 0, z], [0, BDP, z], 0.014, C_ALU, 0, 5);
      for (const sx of [-1, 1]) g.box(sx * BW, 0, z, 0.075, 0.075, 0.075, C_DARK, 0);                 // node blocks
      if (i < nb) { g.tube([e ? -BW : BW, 0, z], [e ? BW : -BW, 0, zn], 0.012, C_ALU, 0, 5); g.tube([-BW, 0, e ? z : zn], [0, BDP, e ? zn : z], 0.012, C_ALU, 0, 5); g.tube([BW, 0, e ? zn : z], [0, BDP, e ? z : zn], 0.012, C_ALU, 0, 5); }
    }
    g.tube([-BW - 0.05, 0.04, z0], [-BW - 0.05, 0.04, zl], 0.018, C_GOLD, 1, 6);
    for (const dy of [-0.012, 0.085]) g.tube([-BW - 0.045, dy, z0], [-BW - 0.045, dy, zl], 0.009, C_BLACK, 0, 5);
    for (let i = 1; i < nb; i += 2) g.box(-BW - 0.045, 0.035, z0 + i * dz + 0.09, 0.075, 0.14, 0.035, C_DARK, 0);
  };
  await pause();
  // the east arm, from the cube's lower north-east corner to the elbow (its frame's +Z is the gondola's +X)
  const EL = 0.32;                                               // the elbow: a bolted truss box, its half size
  base = new THREE.Matrix4().makeRotationY(90 * DEG).setPosition(1.5, BOOM_Y, ARM_Z); home();
  lattice(0.08, BOOM_R0[0] - 1.5 - EL, 4);
  base = IDENT; home();
  frame([BOOM_R0[0], BOOM_Y - 0.21, ARM_Z], [EL, EL, EL], 0.03, 0.2);
  for (let i = 0; i < 3; i++) cable([[1.27 + 0.03 * (i % 2), -1.2, -1.0 + i * 0.14], [1.4, -1.4, -1.02 + i * 0.01], [1.6, BOOM_Y + 0.04, ARM_Z + BW + 0.05]], 0.012, i === 1 ? C_GOLD : C_BLACK, i === 1 ? 1 : 0);   // the cube's loom runs into the harness
  await pause();
  // THE RAIL, in its own frame (across, up from BOOM_Y, along): from the elbow south to the end bay
  base = MB; home();
  const [bhx, , bhz] = BAY_H, BZ = BAY_Z, ZL = BZ + bhz, Z0 = EL, NB = 14, dzb = (ZL - Z0) / NB;
  lattice(Z0, ZL, NB);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([sx * BW, 0, BZ + sz * (bhz - 0.07)], [sx * bhx, 0.55 + POD_DY, BZ + sz * bhz], 0.022, C_ALU, 0, 6);   // the pod's four hangers
  await pause();
  base = MP; home();
  // THE END BAY: a truss box with gussets and bolt heads round an instrument box in foil. The lens looks down on its
  // lid from three to six metres: the lid's edges and two bands are taped, and it carries a connector plate with four
  // plugs whose cables run over the edge into the harness, a patch antenna on a stub, a sun sensor and tape patches
  const LID = 0.36, fx = bhx - 0.15, fz = bhz - 0.15;      // (the foil box: its lid's height, its half sizes)
  frame([0, -0.05, BZ], BAY_H, 0.034, 0.26);
  await pause();
  g.box(0, -0.1, BZ, 2 * fx, 0.92, 2 * fz, C_GOLD, 1); g.box(0, -0.1, BZ, 2 * fx + 0.02, 0.94, 0.06, C_TAPE, 1); g.box(0, -0.1, BZ, 0.06, 0.94, 2 * fz + 0.02, C_TAPE, 1);
  for (const s of [-1, 1]) { g.box(s * (fx - 0.005), LID, BZ, 0.05, 0.014, 2 * fz, C_TAPE, 1); g.box(0, LID, BZ + s * (fz - 0.005), 2 * fx, 0.014, 0.05, C_TAPE, 1); }
  g.box(-0.1, LID, BZ + 0.26, 0.17, 0.012, 0.09, C_TAPE, 1); g.box(0.14, LID, BZ - 0.02, 0.07, 0.012, 0.2, C_TAPE, 1);
  g.box(-0.15, LID + 0.012, BZ - 0.38, 0.36, 0.024, 0.16, C_DARK, 0);
  for (let i = 0; i < 4; i++) {
    const x = -0.27 + i * 0.08, z = BZ - 0.38;
    at([x, LID + 0.024, z], [0, 1, 0]); g.lathe([[0.025, 0], [0.025, 0.04], [0.016, 0.05], [0.016, 0.075]], 8, i % 2 ? C_ALU : C_TAPE, 0); home();
    cable([[x, LID + 0.09, z], [x, LID + 0.3, z - 0.04], [-BW - 0.045 + i * 0.014, -POD_DY - 0.05, z - 0.12], [-BW - 0.045 + i * 0.014, 0.1 - POD_DY, z - 0.3]], 0.011, i === 1 ? C_GOLD : C_BLACK, i === 1 ? 1 : 0);
  }
  g.tube([0.2, LID, BZ + 0.34], [0.2, LID + 0.13, BZ + 0.34], 0.014, C_ALU, 0, 5);
  at([0.2, LID + 0.13, BZ + 0.34], [0, 1, 0]); g.lathe([[0.0, 0], [0.115, 0], [0.115, 0.025], [0.0, 0.032]], 14, C_WHITE, 2); home();
  g.box(0.24, LID + 0.04, BZ - 0.34, 0.1, 0.08, 0.1, C_DARK, 0); g.box(0.24, LID + 0.086, BZ - 0.34, 0.06, 0.012, 0.06, C_TAPE, 1);
  g.box(fx + 0.02, -0.1, BZ, 0.03, 0.66, 0.9, C_WHITE, 2);                                                          // a radiator on its far face
  for (let i = -2; i <= 2; i++) g.box(fx + 0.05, -0.1, BZ + i * 0.19, 0.04, 0.66, 0.02, C_WHITE, 2);
  g.tube([bhx, -0.3, BZ + 0.5], [1.3, -0.3, BZ + 0.5], 0.016, C_ALU, 0, 6); g.box(1.36, -0.36, BZ + 0.5, 0.2, 0.26, 0.2, C_WHITE, 2);      // a boxed magnetometer on a stub
  at([bhx - 0.08, 0.2, BZ - 0.45], [0.8, 0.5, -0.3]);                                                                      // a star-tracker baffle
  g.lathe([[0.07, 0], [0.085, 0.02], [0.17, 0.46], [0.18, 0.47]], 18, C_GOLD, 1); g.lathe([[0.165, 0.47], [0.06, 0.02], [0.0, 0.02]], 18, C_BLACK, 0);
  for (const y of [0.16, 0.3]) g.lathe([[0.07 + y * 0.2, y], [0.04 + y * 0.2, y + 0.004]], 18, C_BLACK, 0);     // vanes
  home();
  await pause();
  // ---- THE BALLAST HOPPER, slung from the bay on the lens's side (HOP_K times the drawing below): a foil-wrapped
  // drum with a bolted lid, a cone, the valve with its actuator and cable, the chute
  const HR = 0.3 * HOP_K, PZ = BZ - bhz;
  for (const sz of [-1, 1]) for (const [y0, y1] of [[0.55, 0.25], [-0.65, -0.25]]) g.tube([-bhx, y0, HOP[2] + sz * 0.5], [HOP[0] + 0.8 * HR, HOP[1] + y1, HOP[2] + sz * 0.6 * HR], 0.02, C_ALU, 0, 6);
  cable([[-bhx, -0.3, HOP[2] + 0.62], [-0.62, -0.62, HOP[2] + 0.5], [HOP[0] - 0.12 * HOP_K, HOP[1] - 0.41 * HOP_K, HOP[2] + 0.09 * HOP_K]], 0.011, C_GOLD, 1);
  const MH = new THREE.Matrix4().makeTranslation(0, 2.19, 0).premultiply(mt.makeScale(HOP_K, HOP_K, HOP_K)).premultiply(mt.makeRotationY(BOOM_YAW)).premultiply(mt.makeTranslation(HOP_C[0], HOP_C[1], HOP_C[2]));
  base = MH; home();
  g.lathe([[0.3, -2.02], [0.3, -1.98], [0.27, -1.95], [0.12, -1.925], [0.0, -1.92]], 22, C_GOLD, 1); g.lathe([[0.1, -1.93], [0.1, -1.9], [0.0, -1.895]], 12, C_ALU, 0);   // lid, in foil, with its cap
  g.lathe([[0.295, -2.36], [0.295, -2.02]], 22, C_GOLD, 1);                                             // drum, in foil
  for (const y of [-2.03, -2.19, -2.35]) g.lathe([[0.295, y - 0.012], [0.312, y - 0.006], [0.312, y + 0.006], [0.295, y + 0.012]], 22, C_ALU, 0);   // bands
  g.lathe([[0.055, -2.7], [0.295, -2.37]], 22, C_ALU, 0);                                               // cone
  g.lathe([[0.04, -2.78], [0.065, -2.76], [0.065, -2.69]], 12, C_DARK, 0);                              // valve
  for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU; bolt([Math.cos(t) * 0.245, -1.947, Math.sin(t) * 0.245], [0, 1, 0]); }
  g.box(-0.12, -2.6, 0.09, 0.07, 0.11, 0.08, C_DARK, 0);                                                // the valve's actuator
  g.quad([-0.05, -2.74, -0.02], [0.05, -2.74, -0.02], [0.04, -2.8, -0.17], [-0.04, -2.8, -0.17], C_ALU, 0);   // chute, throwing back along the boom
  base = MP; home();
  // ---- the strobe on a stalk on the bay's near post
  g.tube([-bhx, 0.55, PZ], [-bhx, 0.7, PZ], 0.014, C_ALU, 0, 6);
  at([-bhx, 0.7, PZ], [0, 1, 0]);
  g.lathe([[0.045, 0], [0.045, 0.035], [0.032, 0.045]], 10, C_DARK, 0); g.lathe([[0.032, 0.045], [0.037, 0.09], [0.028, 0.135], [0.0, 0.15]], 10, C_LAMP, 4);
  home();
  await pause();
  // ---- the rail's solar wing (2.65 by 1.2 m), on a yoke at the bay's lower south-east corner, running out south-east
  // and drooping, feathering about its own long axis (the shader turns it); built in its own frame (across, up, along)
  base = IDENT; home();
  g.tube(bq(bhx, -0.65, BZ + 0.25), WING_P, 0.04, C_ALU, 0, 8); g.tube(bq(bhx, 0.1, BZ + bhz), WING_P, 0.02, C_ALU, 0, 6);
  base = MW; home();
  g.tube([0, 0, 0], [0, 0, 0.14], 0.04, C_ALU, 0, 8);
  g.wing(3, 0, 0); panel((t, w, dy) => [w, dy, t], 0.14, 0.14 + WING_L, 0.65, true); g.wing();
  base = IDENT; home();
  // a second baffle on the roof, staring at the zenith stars
  at([-1.1, 1.52, 1.1], [-0.25, 0.9, 0.3]);
  g.lathe([[0.08, 0], [0.095, 0.02], [0.2, 0.52], [0.21, 0.53]], 18, C_GOLD, 1); g.lathe([[0.195, 0.53], [0.07, 0.02], [0.0, 0.02]], 18, C_BLACK, 0);
  g.xf();
  // ---- ribbons: whip antennas (they sway), the four suspension lines to the confluence ring 7.5 m up
  const wob = () => rg.range(-0.06, 0.06);
  L.add(seg3([1.5, 1.5, -1.5], [2.0 + wob(), 3.6, -2.0 + wob()], 6), 0.012, C_CORD, 0, 1); L.add(seg3([-1.5, 1.5, -1.5], [-1.9 + wob(), 3.2, -1.9 + wob()], 6), 0.012, C_CORD, 0, 1);
  L.add(seg3(bq(-BAY_H[0], -0.65, BAY_Z + BAY_H[2]), bq(-0.9 + wob(), -2.3, BAY_Z + BAY_H[2] + 0.3 + wob()), 6), 0.01, C_CORD, 0, 1);
  // the outrigger's stays, from the cube's upper east corners to the elbow and to the rail
  L.add(seg3([1.5, 1.5, -1.5], [BOOM_R0[0], BOOM_Y + 0.12, ARM_Z], 3), 0.014, C_CORD);
  for (const z of [Z0 + 6 * dzb, ZL - 0.3]) L.add(seg3([1.5, 1.5, 1.5], bp(-BW, 0.04, z), 3), 0.014, C_CORD);
  for (const a of [-1, 1]) for (const b of [-1, 1]) L.add(seg3([a * H, H, b * H], [a * 0.12, 7.5, b * 0.12], 4), 0.022, C_CORD);
  g.lathe([[0.2, 7.46], [0.24, 7.5], [0.2, 7.54], [0.16, 7.5], [0.2, 7.46]], 16, C_ALU, 0);
  await pause();
  const solid = g.build();
  await pause();
  return { solid, lines: L.build(), tris: g.count() };
}
// THE FLIGHT TRAIN, y 7.5 to 60, on the axis (it does not turn with the gondola: a swivel sits over the gondola's ring;
// nothing of it is further than 1.75 m from the axis, and the lens never comes within 6 m of that). It is the near
// subject of the climb's first pictures, a third of the way across: bodies, not wires. Bottom up: the swivel and a
// strop; a square spreader 2.4 m wide; four load lines, the square set 20 degrees round so that each line is seen
// apart from the others; between two of them THE LADDER, a triangular lattice of tube 0.6 m wide; on a centre line a radar reflector in
// foil 1.1 m across, a foil package with a radiator plate and a whip, a white transponder drum; a second spreader,
// the parachute's swivel and its twelve shroud lines; THE FURLED PARACHUTE, 19 m of canopy 3 m through; a third
// spreader, the terminate package, and the lines gathered into the apex fitting.
async function buildTrain(rt, pause) {
  const g = makeGeo(), L = makeLines(), mt = new THREE.Matrix4();
  const RL = 1.7, cor = [0, 1, 2, 3].map((k) => { const t = (20 + 90 * k) * DEG; return [Math.cos(t) * RL, Math.sin(t) * RL]; });
  const spreader = (y) => {
    for (let k = 0; k < 4; k++) { const a = cor[k], b = cor[(k + 1) % 4]; g.tube([a[0], y, a[1]], [b[0], y, b[1]], 0.034, C_ALU, 0, 6); g.box(a[0], y, a[1], 0.14, 0.14, 0.14, C_DARK, 0); }
    for (let k = 0; k < 2; k++) g.tube([cor[k][0], y, cor[k][1]], [cor[k + 2][0], y, cor[k + 2][1]], 0.022, C_ALU, 0, 5);
  };
  g.lathe([[0.0, 7.56], [0.06, 7.62], [0.06, 7.8], [0.1, 7.84], [0.1, 8.06], [0.06, 8.1], [0.06, 8.3], [0.0, 8.36]], 12, C_ALU, 0);      // the swivel
  g.lathe([[0.1, 7.92], [0.116, 7.94], [0.116, 7.98], [0.1, 8.0]], 12, C_DARK, 0);
  L.add(seg3([0, 8.36, 0], [0, 9.3, 0], 2), 0.04, C_CORD);
  for (const c of cor) L.add(seg3([0, 9.3, 0], [c[0], 11.2, c[1]], 2), 0.03, C_CORD);
  spreader(11.2); spreader(29.5); spreader(53);
  for (const c of cor) { L.add(seg3([c[0], 11.2, c[1]], [c[0], 53, c[1]], 12), 0.034, C_CORD); L.add(seg3([c[0], 53, c[1]], [c[0] * 0.08, 59.25, c[1] * 0.08], 3), 0.034, C_CORD); }
  L.add(seg3([0, 11.2, 0], [0, 29.5, 0], 6), 0.02, C_CORD); L.add(seg3([0, 52.4, 0], [0, 59.2, 0], 3), 0.02, C_CORD);      // the centre line
  await pause();
  // THE LADDER on the square's south-east side, y 11.2 to 29.5: a made thing of the same craft as the outrigger, and
  // built as it is. Two rails of tube 15 cm through with a rung of tube every half metre, a third chord 0.42 m
  // behind them (outward) and a zigzag of braces from it to each rail: a triangular lattice in the truss's own bare
  // metal (solid bodies, lit as the truss is: a lit and a shaded side), dark node blocks and a stand-off to each
  // load line every 2 m, and a gold-wrapped cable clamped down the outside of one rail
  const lm = [(cor[0][0] + cor[1][0]) / 2, (cor[0][1] + cor[1][1]) / 2], ld = [(cor[1][0] - cor[0][0]) / (RL * Math.SQRT2), (cor[1][1] - cor[0][1]) / (RL * Math.SQRT2)];
  const lo = [lm[0] / Math.hypot(lm[0], lm[1]), lm[1] / Math.hypot(lm[0], lm[1])];      // outward from the axis
  const lw = (sd, y, k = 0.3, o = 0) => [lm[0] + ld[0] * k * sd + lo[0] * o, y, lm[1] + ld[1] * k * sd + lo[1] * o];
  for (const sd of [-1, 1]) g.tube(lw(sd, 11.2), lw(sd, 29.5), 0.075, C_ALU, 0, 8);
  g.tube(lw(0, 11.2, 0, 0.42), lw(0, 29.5, 0, 0.42), 0.06, C_ALU, 0, 8);
  for (let i = 0, y = 11.7; y < 29.3; y += 0.5, i++) {
    g.tube(lw(-1, y), lw(1, y), 0.05, C_ALU, 0, 6);
    if (i % 2 === 0 && y + 1 < 29.5) for (const sd of [-1, 1]) { g.tube(lw(sd, y), lw(0, y + 0.5, 0, 0.42), 0.032, C_ALU, 0, 5); g.tube(lw(0, y + 0.5, 0, 0.42), lw(sd, y + 1), 0.032, C_ALU, 0, 5); }
    if (i % 4 === 0) for (const sd of [-1, 1]) { const p = lw(sd, y); g.box(p[0], p[1], p[2], 0.2, 0.2, 0.2, C_DARK, 0); g.tube(p, [cor[sd < 0 ? 0 : 1][0], y, cor[sd < 0 ? 0 : 1][1]], 0.03, C_ALU, 0, 5); }
  }
  g.tube(lw(1, 11.3, 0.42), lw(1, 29.4, 0.42), 0.035, C_GOLD, 1, 6);
  for (let y = 12.2; y < 29.3; y += 2) { const p = lw(1, y, 0.4); g.box(p[0], p[1], p[2], 0.14, 0.16, 0.14, C_DARK, 0); }
  await pause();
  // strung on the centre line: the radar reflector (three square plates of gold foil at right angles, set on a corner,
  // framed in tube)
  g.xf(mt.makeRotationFromEuler(new THREE.Euler(0.6155, 0.7854 + rt() * 0.6, 0.3)).setPosition(0, 14.2, 0));
  for (let ax = 0; ax < 3; ax++) {
    const u = (ax + 1) % 3, v = (ax + 2) % 3, P = (p0, p1) => { const p = [0, 0, 0]; p[u] = p0 * 0.55; p[v] = p1 * 0.55; return p; };
    g.quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), C_GOLD, 1);
    for (const [p0, p1, p2, p3] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) g.tube(P(p0, p1), P(p2, p3), 0.024, C_ALU, 0, 5);
  }
  g.xf();
  // ... the foil package with its taped bands, radiator plate and whip, and the transponder drum in foil with white
  // end caps and a taped band
  g.box(0, 19.2, 0, 0.9, 0.75, 0.9, C_GOLD, 1); g.box(0, 19.2, 0, 0.93, 0.09, 0.93, C_TAPE, 1); g.box(0, 19.2, 0, 0.09, 0.78, 0.93, C_TAPE, 1); g.box(0, 19.2, 0.465, 0.56, 0.46, 0.03, C_WHITE, 2);
  g.box(0.3, 19.62, -0.25, 0.16, 0.1, 0.16, C_DARK, 0);
  L.add(seg3([0.36, 19.58, 0.36], [0.6, 21.2, 0.52], 4), 0.014, C_CORD, 0, 1);
  g.lathe([[0.34, 23.97], [0.34, 24.73]], 18, C_GOLD, 1);
  g.lathe([[0.0, 23.9], [0.3, 23.93], [0.35, 23.97]], 18, C_WHITE, 2); g.lathe([[0.35, 24.73], [0.3, 24.77], [0.0, 24.8]], 18, C_WHITE, 2);
  g.lathe([[0.343, 24.28], [0.352, 24.29], [0.352, 24.41], [0.343, 24.42]], 18, C_TAPE, 1);
  await pause();
  // THE FURLED PARACHUTE, y 32.6 to 51.6: a long gathered canopy of twelve gores, WHITE AND INTERNATIONAL ORANGE by
  // turns, in deep pleats (the colours meet in the folds, which shade themselves), bound by a dark band every 2.4 m (it
  // necks in at each and billows between, up to 3 m through), its hem gathered into twelve shroud lines that run down
  // to its swivel, its apex gathered into a ring. Silk: lit by the moon, the sheet and the arc, whose light also comes
  // through it from the far side.
  const C_ORG = [0.92, 0.17, 0.02], C_WHT = [0.86, 0.88, 0.92], BAND = [0.035, 0.04, 0.09], NP = 12, RW = 60, PY0 = 32.6, PY1 = 51.6;
  const shade = (c) => [c[0] * 0.4 + 0.01, c[1] * 0.4 + 0.015, c[2] * 0.4 + 0.05];
  const twist = rt() * TAU, bulge = []; for (let i = 0; i < 8; i++) bulge.push(0.85 + 0.3 * rt());
  const girth = (t) => 0.6 + 0.88 * Math.sin(Math.PI * Math.min(t * 1.08, 1)) ** 0.8;
  const chute = (j, i) => {      // row j, and four places a pleat: ridge, flank, valley, flank
    const t = j / RW, y = PY0 + (PY1 - PY0) * t, sg = t * 8, k = Math.min(Math.floor(sg), 7), f = sg - k;
    const full = Math.sin(Math.PI * f) ** 0.6, body = girth(t) * (0.62 + 0.38 * full * bulge[k]);      // full: 0 at a band, 1 between
    const r = body * [1, 0.8, 0.5 + 0.22 * (1 - full), 0.8][i % 4], a = ((i + 0.5 * Math.sin(y * 0.9 + ((i >> 2) % NP))) / (4 * NP)) * TAU + twist + t * 0.9;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (let j = 0; j < RW; j++) {
    if (j === RW / 2) await pause();
    for (let i = 0; i < 4 * NP; i++) {
    const gore = ((i + 2) >> 2) % 2 ? C_ORG : C_WHT;      // (a gore runs from one fold to the next)
    g.quad(chute(j, i + 1), chute(j, i), chute(j + 1, i), chute(j + 1, i + 1), i % 4 === 1 || i % 4 === 2 ? shade(gore) : gore, 5);
    }
  }
  await pause();
  for (let k = 0; k <= 8; k++) { const y = PY0 + ((PY1 - PY0) * k) / 8, rb = girth(k / 8) * 0.64; g.lathe([[rb, y - 0.1], [rb + 0.022, y - 0.05], [rb + 0.022, y + 0.05], [rb, y + 0.1]], 14, BAND, 0); }
  g.lathe([[0.37, PY1], [0.17, PY1 + 0.45], [0.08, PY1 + 0.7]], 12, C_WHT, 5);                                                                    // the apex gathered ...
  g.lathe([[0.17, PY1 + 0.7], [0.215, PY1 + 0.745], [0.17, PY1 + 0.79], [0.125, PY1 + 0.745], [0.17, PY1 + 0.7]], 14, C_ALU, 0);                      // ... into its ring
  g.lathe([[0.0, 29.5], [0.09, 29.6], [0.09, 30.3], [0.13, 30.35], [0.13, 30.55], [0.06, 30.62]], 10, C_ALU, 0);                                 // the parachute's swivel
  for (let i = 0; i < NP; i++) { const p = chute(0, 4 * i), t = Math.atan2(p[2], p[0]); L.add(seg3(p, [Math.cos(t) * 0.07, 30.6, Math.sin(t) * 0.07], 3), 0.014, C_CORD); }
  // the terminate package under the apex fitting, and the apex fitting
  g.box(0, 55.6, 0, 0.6, 0.52, 0.6, C_GOLD, 1); g.box(0, 55.6, 0, 0.63, 0.08, 0.63, C_TAPE, 1); g.box(0.31, 55.6, 0, 0.03, 0.32, 0.32, C_WHITE, 2);
  g.lathe([[0.0, 59.2], [0.12, 59.3], [0.3, 59.9], [0.5, 60.0]], 16, C_ALU, 0);
  await pause();
  const solid = g.build();
  await pause();
  return { solid, lines: L.build(), tris: g.count() };
}

// ---------------------------------------------------------------- 5. sister balloons, ballast, meteors, strobes
const SIS_AT = [[900 * Math.sin(22.5 * DEG), 0, -900 * Math.cos(22.5 * DEG)], [-2100 * Math.sin(35 * DEG), -70, -2100 * Math.cos(35 * DEG)]];
async function buildSisters(n, radiusAt, pause) {      // (radiusAt: the part's, so a sister is the same craft)
  const g = makeGeo(), L = makeLines(), mt = new THREE.Matrix4(), pr = [];
  for (let j = 0; j <= 36; j++) { const y = 60 + (130 * j) / 36; pr.push([Math.max(radiusAt(y), 0.4), y]); }
  for (let i = 0; i < n; i++) {
    g.xf(mt.makeTranslation(SIS_AT[i][0], SIS_AT[i][1], SIS_AT[i][2]));
    g.lathe(pr, 40, C_DARK, 0); g.box(0, 0, 0, 3.4, 3.4, 3.4, C_GOLD, 1);
    L.add(seg3([SIS_AT[i][0], SIS_AT[i][1] + 2, SIS_AT[i][2]], [SIS_AT[i][0], SIS_AT[i][1] + 60, SIS_AT[i][2]], 2), 0.35, C_CORD);
    await pause();
  }
  g.xf();
  return { solid: g.build(), lines: L.build(), tris: g.count() };
}
function quadGeo(n, name, fill) {      // n unit quads sharing one attribute row each (ribbons of one segment)
  const P = [], A = [], I = [];
  for (let i = 0; i < n; i++) { for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(c[0], c[1], 0); A.push(...fill(i)); } I.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute(name, new THREE.Float32BufferAttribute(A, A.length / (n * 4))); geo.setIndex(I);
  return geo;
}
function ballastGeo(count, rb) {
  const geo = new THREE.InstancedBufferGeometry(), seed = new Float32Array(count * 4);
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
  for (let i = 0; i < count * 4; i++) seed[i] = rb();
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); geo.instanceCount = count;
  return geo;
}
function stripGeo(ribbons, segs, name, row) {      // ribbons of `segs` segments; row(ribbon, 0..1, side) gives the attribute
  const P = [], A = [], I = [];
  for (let r = 0; r < ribbons; r++) for (let i = 0; i <= segs; i++) {
    for (const s of [-1, 1]) { P.push(0, 0, 0); A.push(...row(r, i / segs, s)); }
    if (i < segs) { const k = (r * (segs + 1) + i) * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute(name, new THREE.Float32BufferAttribute(A, A.length / (P.length / 3))); geo.setIndex(I);
  return geo;
}
const skyDir = (azDeg, elDeg, out) => { const c = Math.cos(elDeg * DEG); return out.set(Math.sin(azDeg * DEG) * c, Math.sin(elDeg * DEG), -Math.cos(azDeg * DEG) * c); };
const flashOf = (x) => smoothstep(0, 0.1, x) * (1 - smoothstep(0.1, 0.4, x));      // the guide's flash: 0.1 s up, 0.3 s down

// ================================================================ 6. the world
export default {
  id: 'night-shining',
  name: 'The Night-Shining Clouds',
  category: 'sky',
  weirdness: 0.2,
  media: ['air'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    // ---------------- streams of our own (every fork is drawn here, before anything is awaited)
    const rLook = rng.fork('ns-looks'), rGond = rng.fork('ns-gondola'), rTrain = rng.fork('ns-train'), rBal = rng.fork('ns-ballast'), rMet = rng.fork('ns-meteors');
    // ---------------- THE LOOKS: dealt from the stream above and from ctx.vary (the hour sets the twilight's depth, rare the fireball)
    const seededDepth = rLook.pick([9, 9, 6, 13, 9, 6]);
    const look = {
      sunDepth: { dawn: 6, golden: 6, day: 9, night: 13 }[vary.hour] ?? seededDepth,
      display: rLook.pick(['bands', 'billows', 'whirls']),
      moon: rLook.pick(['gibbous', 'gibbous', 'crescent', 'gibbous', 'none']),
      below: rLook.pick(['pack', 'pack', 'edge', 'coast']),
      film: rLook.pick(['clear', 'clear', 'gold']),
    };
    const cast = rLook.pick(['telescope', 'telescope', 'cameras']), sisters = rLook.pick([1, 1, 2, 0]), fireball = !!vary.rare;
    const metSeed = rMet() * 100, metOff = [0, 1, 2, 3, 4, 5].map((i) => i * 5 + rMet.range(-0.5, 0.5));      // one of the sky's own every 4 to 6 s
    const rFleck = rMet.fork('ns-flecks');      // (forked from our own stream after its draws: no other stream moves)

    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010208);
    const path = makePath([[0, 0, 0], [0, 0, -92], [0, 0, -184], [0, 0, -276], [0, 0, -368], [0, 0, -LEN]]);
    const entryP = path.pointAt(0).clone(), entryQ = new THREE.Quaternion().setFromRotationMatrix(path.frameAt(0));
    const rig = new THREE.Group(); rig.matrixAutoUpdate = false; rig.frustumCulled = false; scene.add(rig);

    // ---------------- the hero part, in balloon space: the sky and the Earth at infinity (it keeps them on the eye itself),
    // the envelope, its tear and ribbons, frost and ice dust. Of it the world uses object, craft, anchors.moonDir, radiusAt,
    // setBurst, setShed, setFlash, update, dispose, and nothing else
    const hero = await buildHero(ctx, { look });
    rig.add(hero.object);
    await ctx.yield();
    const md = hero.anchors && hero.anchors.moonDir, moonDir = V3(0.6, 0.53, 0.6);
    if (md) { if (md.isVector3) moonDir.copy(md); else moonDir.set(md[0], md[1], md[2]); }
    moonDir.normalize();

    // ---------------- the two lights and the fill, as uniforms in balloon space (see GLSL_LIGHT)
    const moonK = { gibbous: 1, crescent: 0.34, none: 0 }[look.moon], dark = 1 - moonK;      // moonless: the sheet and the arc carry the craft
    const twi = { 6: ['#FFA366', 1.25], 9: ['#FF7A3C', 0.95], 13: ['#E8482C', 0.5] }[look.sunDepth];
    const sheet = { 6: ['#BFE4FF', 0.5], 9: ['#2E8BFF', 0.62], 13: ['#4450E6', 0.46] }[look.sunDepth];
    const LU = {
      uRigInv: u1(new THREE.Matrix4()), uEye: u1(V3()), uPix: u1(0.004), uTime: u1(0), uFeather: u1(0), uTrack: u1(0),
      uMoon: u1(moonDir.clone()), uMoonCol: u1(lin('#E9EEF7', 1.3 * moonK + 0.04)), uTwiCol: u1(lin(twi[0], twi[1] * (1 + 0.5 * dark))),
      uSheetCol: u1(lin(sheet[0], sheet[1] * (1 + 1.1 * dark))), uIceCol: u1(lin('#8FA2E0', 0.24 * moonK + 0.07)), uShadow: u1(lin('#0B1030', 2.4)),
      uStrobePos: u1(V3()), uStrobeCol: u1(lin('#CFE6FF', 1.5)), uStrobe: u1(0), uFlashCol: u1(lin('#B8FFD8', 1.3)), uFlashDir: u1(V3(0.5, 0.5, -0.7).normalize()), uFlash: u1(0),
      uWash: u1(look.sunDepth === 13 ? 0.1 : 1),      // (see lightP: on the deep twilight look silk, cords and sisters keep their own colours)
    };
    const craftMat = new THREE.ShaderMaterial({ uniforms: { ...LU }, vertexShader: CRAFT_VERT, fragmentShader: CRAFT_FRAG, side: THREE.DoubleSide });
    const lineMat = new THREE.ShaderMaterial({ uniforms: { ...LU }, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = (geo, mat, parent, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; parent.add(m); return m; };

    // ---------------- the gondola (it turns by the route and swings by the clock) and the flight train
    const pause = () => ctx.yield();
    const G = await buildGondola(cast, rGond, pause);
    await ctx.yield();
    const gond = new THREE.Group(); rig.add(gond);
    mesh(G.solid, craftMat, gond); mesh(G.lines, lineMat, gond, 3.5);
    const T = await buildTrain(rTrain, pause);
    await ctx.yield();
    const train = new THREE.Group(); rig.add(train);
    mesh(T.solid, craftMat, train); mesh(T.lines, lineMat, train, 3.5);

    // ---------------- the sister balloons (one, two or none), bobbing
    const sis = new THREE.Group(); rig.add(sis);
    if (sisters > 0) {
      const S = await buildSisters(sisters, hero.radiusAt, pause);
      mesh(S.solid, new THREE.ShaderMaterial({ uniforms: { ...LU }, vertexShader: SIS_VERT, fragmentShader: SIS_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide }), sis, -0.45);
      mesh(S.lines, lineMat, sis, -0.4);
    }
    await ctx.yield();

    // ---------------- the ballast: grains and the soft core, one law (GLSL_STREAM)
    const BU = { uValve: u1(V3()), uOut: u1(V3(0, 0, 1)), uTime: LU.uTime, uPix: LU.uPix, uCol: u1(lin('#BFD2F4', 0.5 * moonK + 0.22).add(LU.uSheetCol.value.clone().multiplyScalar(0.35))), uGlint: u1(lin('#E9EEF7', 0.9 * moonK + 0.25).add(LU.uSheetCol.value.clone().multiplyScalar(0.6))) };
    const ballast = new THREE.Group(); rig.add(ballast);
    mesh(stripGeo(1, 64, 'aK', (r, k, s) => [k, s]), new THREE.ShaderMaterial({ uniforms: BU, vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), ballast, 6);
    mesh(ballastGeo(Math.round(3000 * detail), rBal), new THREE.ShaderMaterial({ uniforms: BU, vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, depthWrite: false }), ballast, 7);
    await ctx.yield();

    // ---------------- the frost that falls past the lens (see FLECK_VERT): hidden until the route sheds it, and from the tearing on
    const NFL = Math.max(300, Math.round(3000 * detail)), fa = new Float32Array(NFL * 4), fb = new Float32Array(NFL * 4);
    for (let i = 0; i < NFL; i++) {
      const y0 = 95 + 55 * rFleck();
      fa.set([rFleck.range(-0.2, 0.2), y0, hero.radiusAt(y0) + 0.2 + 1.8 * rFleck(), rFleck()], i * 4);
      fb.set([rFleck.range(13, 22), rFleck.range(1.4, 3.0), rFleck() < 0.3 ? rFleck.range(0.12, 0.22) : rFleck.range(0.05, 0.1), rFleck()], i * 4);
    }
    const fleckGeo = new THREE.InstancedBufferGeometry();
    fleckGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); fleckGeo.setIndex([0, 1, 2, 0, 2, 3]);
    fleckGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(fa, 4)); fleckGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(fb, 4)); fleckGeo.instanceCount = NFL;
    const FU = { uEye: LU.uEye, uMoon: LU.uMoon, uMoonCol: LU.uMoonCol, uSheetCol: LU.uSheetCol, uTwiCol: LU.uTwiCol, uTime: LU.uTime, uPix: LU.uPix, uWash: LU.uWash, uShed: u1(0) };
    const flecks = mesh(fleckGeo, new THREE.ShaderMaterial({ uniforms: FU, vertexShader: FLECK_VERT, fragmentShader: FLECK_FRAG, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, depthWrite: false }), rig, 5.5);
    flecks.visible = false;
    await ctx.yield();

    // ---------------- strobes (ours and the sisters', out of step) and the meteors (at infinity: a group kept on the eye)
    const lampU = { uLamp: u1([0, 1, 2].map(() => new THREE.Vector4(0, 0, 0, 0))), uPix: LU.uPix, uCol: u1(lin('#9CC8FF', 1)) };
    const lamps = mesh(quadGeo(N_LAMP, 'aI', (i) => [i]), new THREE.ShaderMaterial({ uniforms: lampU, vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), rig, 8);
    const inf = new THREE.Group(); rig.add(inf);
    const MU = {
      uA: u1(Array.from({ length: N_MET }, () => V3(0, 1, 0))), uB: u1(Array.from({ length: N_MET }, () => V3(0.1, 1, 0).normalize())), uPar: u1(Array.from({ length: N_MET }, () => V3(1, 8, 1))),
      uAge: u1(new Array(N_MET).fill(-1)), uPix: LU.uPix, uTrain: u1(lin('#9FD8E8', 1)), uHeadCol: u1(lin('#F2FAFF', 1)),
    };
    mesh(stripGeo(N_MET, 56, 'aK', (r, k, s) => [r, k, s]), new THREE.ShaderMaterial({ uniforms: MU, vertexShader: MET_VERT, fragmentShader: MET_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), inf, -0.5);      // (after the part's sky at -1, before its film)
    // the brief's two scripted strokes (keyed to u): the meteor of 16 s, upper left; the fireball of 17 s and its three pieces
    skyDir(-62, 51, MU.uA.value[6]); skyDir(-36, 33, MU.uB.value[6]); MU.uPar.value[6].set(0.7, 7.3, 1.15);
    skyDir(56, 52, MU.uA.value[7]); skyDir(24, 27, MU.uB.value[7]); MU.uPar.value[7].set(1.1, 45, 1.7);
    [[17, 19], [24, 18.5], [30, 21.5]].forEach(([az, el], j) => { MU.uA.value[8 + j].copy(MU.uB.value[7]); skyDir(az, el, MU.uB.value[8 + j]); MU.uPar.value[8 + j].set(0.45, 2.6, 1.0); });      // (the pieces burn out: no lasting fork)
    // THE TWO METEORS OF THE UPPER SKY, by the route (S_MET), in open sky clear of the dome. At 26.2 s a bright head
    // crosses the upper left of the picture as the gaze swings up the flank (22 to 35 degrees from the last line's
    // direction); at 29.6 s, before the tearing, one crosses the top of the picture above that direction, from the west
    // to the east past the zenith (28 to 37 degrees from it: inside an upright picture too). Each train stands and
    // twists for its 8 s; neither stroke comes within 20 degrees of the line's direction.
    skyDir(-88, 41, MU.uA.value[11]); skyDir(-52, 62, MU.uB.value[11]); MU.uPar.value[11].set(0.8, 8, 1.6);
    skyDir(-96.3, 64.1, MU.uA.value[12]); skyDir(112.4, 67.3, MU.uB.value[12]); MU.uPar.value[12].set(0.9, 8, 1.5);
    const lineDir = V3(...LINE_DIR), flashColor = new THREE.Color(0.72, 1.0, 0.84);
    await ctx.yield();

    // ---------------- per-frame
    const cP = V3(), cS = V3(), fP = V3(), eye = V3(), ONE = V3(1, 1, 1), v = V3(), w = V3();
    const cQ = new THREE.Quaternion(), fQ = new THREE.Quaternion(), mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), size2 = new THREE.Vector2();
    const pose = { pos: V3(), quat: new THREE.Quaternion() }, fol = { f: 0, last: -1 };      // (fol: the follower's whole state)
    function update(dt, time, camera, u) {
      u = clamp(u || 0, 0, 1);
      const S = u * DUR, through = !!ctx.through;      // S: the brief's seconds, by the route

      // ---- THE RIG. Through the previous portal: the route's own entry frame, so sky and ice lie still. In flight: the
      //      passed camera's place, and its turning eased in from the entry frame over the first metres of route.
      camera.matrixWorld.decompose(cP, cQ, cS);
      //      THE POSE IS READ AT THE FOLLOWER'S PLACE (follow(): the route's own place at the usual pace, in every still and
      //      at the crossing in); everything else below stays on u.
      if (through) { fP.copy(entryP); fQ.copy(entryQ); fol.f = 0; fol.last = -1; poseAt(0, pose); }
      else { fP.copy(cP); fQ.copy(entryQ).slerp(cQ, smoothstep(0, U_EASE, u)); poseAt(follow(fol, u, dt, ctx.flight ? ctx.flight.rate : 1), pose); }
      rig.matrix.multiplyMatrices(mA.compose(fP, fQ, ONE), mB.compose(pose.pos, pose.quat, ONE).invert());
      LU.uRigInv.value.copy(rig.matrix).invert();
      eye.copy(cP).applyMatrix4(LU.uRigInv.value); LU.uEye.value.copy(eye);
      inf.position.copy(eye);

      // ---- what is carried is not shown through a portal (there are no lights to hide: none is in the scene)
      const show = !through;
      gond.visible = train.visible = sis.visible = ballast.visible = lamps.visible = show;
      if (hero.craft) hero.craft.visible = show;

      // ---- the gondola: turning with the route, swinging half a degree; wings, telescope, strobes
      gond.rotation.set(0.5 * DEG * Math.sin(time * 0.71), gondolaAngle(u), 0.5 * DEG * Math.sin(time * 0.53 + 1.3), 'YXZ');
      gond.updateMatrix();
      sis.position.y = 4 * Math.sin(time * 0.31);
      const resY = Math.max(64, ctx.renderer.getDrawingBufferSize(size2).y);
      LU.uPix.value = (2 * Math.tan((camera.fov || 72) * 0.5 * DEG)) / resY;
      LU.uTime.value = time; LU.uFeather.value = 14 * DEG * Math.sin(time * 0.21); LU.uTrack.value = 3 * DEG * Math.sin(time * 0.13);
      const k0 = flashOf(time % 2.5);
      v.set(LAMP[0], LAMP[1], LAMP[2]).applyMatrix4(gond.matrix); LU.uStrobePos.value.copy(v); LU.uStrobe.value = k0;
      lampU.uLamp.value[0].set(v.x, v.y, v.z, k0);
      for (let i = 0; i < 2; i++) lampU.uLamp.value[1 + i].set(SIS_AT[i][0], SIS_AT[i][1] + sis.position.y - 2.2, SIS_AT[i][2], i < sisters ? flashOf((time + 1.1 + i * 0.8) % 2.5) : 0);
      BU.uValve.value.set(VALVE[0], VALVE[1], VALVE[2]).applyMatrix4(gond.matrix);
      BU.uOut.value.set(OUT[0], 0, OUT[2]).normalize().applyQuaternion(gond.quaternion);

      // ---- meteors: six of the sky's own by time, each stroke placed by its own count; the scripted ones by the route
      // (head and train together live 8 s at most and the strokes start 4 to 6 s apart: never more than two trains at once.
      //  The sky's own fall quiet, by the route, from 15 to 34 s: the three meteors of the route and their trains stand alone.)
      const quiet = 1 - smoothstep(15, 15.8, S) * (1 - smoothstep(33, 34, S));
      for (let i = 0; i < 6; i++) {
        const tt = time - metOff[i] + 3000, n = Math.floor(tt / 30), age = tt - n * 30;
        let az = 0, el = 0, hd = 0, len = 0, lawful = false;
        // (a stroke that would cross the way out is dealt again, by its own count and no state; one refused in all four
        //  tries, about 7 in 1,000, IS NOT DRAWN: its age is -1, as an absent fireball's. Nothing crosses the opening.)
        for (let k = 0; k < 4; k++) {
          const s = metSeed + i * 17.13 + n * 3.71 + k * 0.917;
          az = -110 + 220 * hash1(s); el = 15 + 55 * hash1(s + 1.3); hd = TAU * hash1(s + 2.9); len = 16 + 12 * hash1(s + 4.1);
          skyDir(az, el, v); skyDir(az + (Math.sin(hd) * len) / Math.max(Math.cos(el * DEG), 0.3), clamp(el - Math.abs(Math.cos(hd)) * len * 0.8, 6, 80), w);
          if (v.dot(lineDir) < 0.88 && w.dot(lineDir) < 0.88) { lawful = true; break; }
        }
        MU.uA.value[i].copy(v); MU.uB.value[i].copy(w); MU.uPar.value[i].set(0.5 + 0.3 * hash1(n * 5.1 + i), 7.2, (0.8 + 0.5 * hash1(n * 2.3 + i * 7.7)) * quiet); MU.uAge.value[i] = lawful ? age : -1;
      }
      MU.uAge.value[6] = S - 16; MU.uAge.value[11] = S - S_MET[0]; MU.uAge.value[12] = S - S_MET[1];
      MU.uAge.value[7] = fireball ? S - 17 : -1;
      for (let j = 0; j < 3; j++) MU.uAge.value[8 + j] = fireball ? S - 18.1 : -1;
      const fl = fireball ? Math.max(flashOf(S - 18.05), 0.3 * smoothstep(17, 17.5, S) * (1 - smoothstep(18.0, 18.4, S))) : 0;
      LU.uFlash.value = fl;

      // ---- the frost past the lens, by the route: shed from 24 s (the brief's beat), all of it by 26 s, gone by the tearing (30.8 s)
      const shed = smoothstep(24, 26, S) * (1 - smoothstep(29.8, 30.8, S));
      FU.uShed.value = shed; flecks.visible = show && shed > 0;

      // ---- the part: the burst and the shedding by the route, the flash, then its own update (after the rig's matrix)
      hero.setBurst((u - U_BURST) * DUR);
      hero.setShed(smoothstep(21 / DUR, 26 / DUR, u));
      hero.setFlash(fl, flashColor);
      rig.matrixWorldNeedsUpdate = true; rig.updateMatrixWorld(true);
      hero.update(dt, time, camera);
    }
    // cam0: a stand-in while building (see the head); the engine's camera is the one passed to update from the first frame on
    const cam0 = new THREE.PerspectiveCamera(72, 16 / 9, 0.2, 9000); cam0.position.copy(entryP); cam0.updateMatrixWorld(true);
    update(0, 0, cam0, 0);      // (matrices and uniforms stand before the first frame)

    return {
      scene, path, duration: 46,
      camera: { fov: 72, near: 0.2, far: 9000, sway: 0, bank: 0 },
      // the engine's own way of leaving a far exit undrawn: it reads the route's distance left. The exit first appears with
      // 150 m to fly, 10 m into the straight line, and opens about its middle over the next 14 m; no depth disc is built.
      portal: { shape: 'circle', radius: 7, color: '#FFC79A', glow: 1, revealDistance: 150, drawWithin: 150 },
      post: {
        exposure: 1.3, bloom: { strength: 0.5, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.04, tint: '#ffffff', shadowTint: '#070a22', vignette: 0.28, grain: 0.02, aberration: 0 },
      },
      ride: 'none', companion: 'none',
      look: { ...look, cast, sisters, fireball },      // (read by nobody but a test: which look this seed was dealt)
      update,
      dispose() { hero.dispose(); },
    };
  },
};
