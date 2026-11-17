// THE POLE THAT MUST NOT FALL: a white salt plain at first light, printed in flat inks. One cart the size of a
// railway station runs to and fro on one straight track to keep a banded mast 480 m tall standing on its
// hinge alone; a school of small machines of the same kind (a plain cart on wheels on a track with a buffer post at each
// end, one plain pole standing on one pin) lose their poles one after another beside it.
// kit: none; makePath and makeRng come from src/kit/core.js; bell is the world's own copy of the kit's bell and must stay
// the same as it, because build() flies the lane for the tiling rule with the engine's own figures (see THE LANE AS FLOWN).
//
// AXES: x east, y up, z south. The floor is the plane y 0. The sun is one fixed direction (SUN of the part
// file); every cast shadow is a low proxy of its own body laid on the floor through the flat-shadow matrix in
// one opaque ink, under the same matrix as the body, so it moves because the body moves.
//
// THE CLOCK: update() poses everything from the time it is given and from nothing else: the great mast and
// cart by lean(t) and cart(t) of the part file (period 120 s), each learner by learnerPose(t, its offset, its ends),
// each sister by sisterPose(t, its phase). update() reads neither the route's progress nor the lens.
//
// THE LOOKS (pois; the look only), each one rule of place for its whole stretch, the same on every seed, its
// from and to worked out in build() from the route metre nearest the thing looked at:
//   1. the lane. No look begins before sCrown (in build()), the route metre at which a level frame turned along the
//      route's heading would lose the crown (its top edge less CROWN_KEEP degrees); till there the gaze rests on the route.
//      The flown gaze dips with the route a little sooner, so the ball's top (the mast upright) leaves the flown frame near
//      route metre 360. From sCrown
//      one point ahead of the eye: first on the line where the south rank's hinges stand when they have lost, then,
//      from the route metre sSwing on, moving evenly to the floor on the great shadow's own line. sSwing is the first
//      south learner's place abeam at which the rank's falls, in the frame of the lane as flown, cover the learner's
//      cycle SPARE times over (the tiling rule in build()). The look ends 60 m of route past the school's east end: the 60 m
//      is the rise of the hinge's look, which begins at that east end (the share 0.12 of its stretch);
//   2. the hinge's middle place over the track, from the school's east end to 40 m of route before it is abeam
//      on the east side;
//   3. on the climb, a direction by the eye's bearing from the mast's axis. Its heading leads the mast by a fixed angle, so
//      the mast stands left of the middle (the mast taken at a share of the way from the axis to where it stands at the clock
//      at the eye's own height); about one bearing north of east it is held for a while and made up evenly round the rest of
//      the turn. Its pitch's base is by the eye's bearing alone, the same on both turns: down on the ground from the east round
//      by the north (the school and the shadow road, then the working line running south); less far down from the bearings
//      at which the sun stands in the frame to the right of the mast (the sun whole, the brine channel and the sun's road under it); and down again
//      round by the south (the line running north). Then each gallery and the ball, where it stands at the clock, is framed
//      whole while it is near the frame's height and dropped out of the frame when it is far under the eye. It begins 160 m
//      of route before the eye is due east of the mast, so that it stands at its full weight where the hinge's look ends, and
//      ends where the eye is due south for the third time;
//   4. on the way out, a point ahead of the eye along the last leg's line and a fixed way to its right, level with
//      the hoop: the sun then stands left of the hoop and the storks' wedges on the right. It begins 20 m of route before
//      the eye is due south of the mast for the third time.
//
// THE ROUTE: 41 control points. The first 24 are route-v2.json's, unchanged; the next eight (the second turn) are drawn
// out to 86 m from the mast's axis; the last nine are laid anew along route-v3.json's end: they carry the dying turn onto
// a line east 4 degrees south (legX, legZ in build(); the turn is still running where the eye is due south of the mast and
// ends about 55 m of route later; the line is straight from about 175 m before the end) and level off at 526 m over the
// last 105 m, so the sun stands beside the way out and not behind it.
//
// EDITIONS (by seed): the inks and sky bands (three), the count of dawn bars, how many far learners stand,
// storks and pennants and, by the same seed, the places and sizes of the dawn bars, the range's outline, the figures at
// the galleries (three or four at each, their places, poses and shirts) and the two on deck (their places), the nests'
// sticks, the two nest storks' turn, the ring storks' rings and every flying stork's step in its wingbeat; the rare one adds a thin
// moon in the west. ctx.vary.density and ctx.quality.detail set
// how many wedges of storks fly beside the way out; detail also thins the far brine, the middle pools and the cart's
// rivets. The track, the mast, the clock, the route, the school's places, the sisters' places, the working line, the brine
// channel with the sun's road, the haul road and the sun are constants.
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import {
  buildHero, makeStyle, buildLearnerParts, buildSisterParts, lean, cart, mastPoint, learnerPose, sisterPose, lieAngle, fallTime, fallAngle,
  LEARNER, PERIOD, MAST_L, HINGE_Y, SUN,
} from '../parts/pole-that-must-not-fall.js';

const DEG = Math.PI / 180;
// the route: control points for makePath (x east, y up, z south)
const ROUTE = [[-1180, 80, 315.4], [-1000, 80, 290.4], [-820, 80, 265.5], [-680, 71, 246], [-540, 54, 226.6], [-380, 38, 204.5], [-250, 38, 186.5],
  [-150, 42, 172.5], [-60, 47, 160], [20.9, 52, 148.5], [71.6, 72.1, 106.1], [90.1, 92.1, 52], [84, 112.3, 0], [72.7, 130.2, -42],
  [45, 149.9, -77.9], [0, 171.8, -95], [-48, 195.1, -83.1], [-82.3, 219.1, -47.5], [-94, 243.2, 0], [-80.5, 267.4, 46.5], [-46, 291.4, 79.7],
  [0, 314.9, 90], [44, 337.7, 76.2], [74.5, 359.6, 43], [86, 380.5, 0], [74.5, 400.4, -43], [43, 419.3, -74.5], [0, 437.1, -86],
  [-43, 453.9, -74.5], [-74.5, 469.3, -43], [-86, 483.5, 0], [-74.5, 496.4, 43], [-50.6, 506.8, 69.6], [-18, 515, 84.4], [17.6, 520.9, 89.7], [53.5, 524.5, 92.2],
  [89.4, 526, 94.7], [125.3, 526, 97.2], [161.2, 526, 99.7], [197.1, 526, 102.2], [233, 526, 104.7]];
// the pace in m/s by route metre: [from this metre on, speed]; the changes are eased over 80 m (the lane; round the
// south end and beside the cradle; the climb; the way out)
const PACE = [[0, 30], [1172, 26], [1472, 28], [2415, 30]];
// the lane's line on the floor under the first leg: z = LANE_Z0 + LANE_K * (x - LANE_X0)
const LANE_X0 = -1180, LANE_Z0 = 315.4, LANE_K = -0.13875;
const laneZ = (x) => LANE_Z0 + LANE_K * (x - LANE_X0);

// THE SCHOOL. Every learner's track runs north to south, centred at [x, z]; z is given from the lane's line.
// FRONT RANKS. South: SOUTH_N learners SOUTH_DX apart eastward from FRONT_X0, each track centred SOUTH_Z south of
// the line; a south learner loses toward the lane (north) in every cycle. North: NORTH_N learners NORTH_DX apart
// from FRONT_X0, each track centred NORTH_Z north of the line (beyond the band the great shadow sweeps); a north
// learner loses northward in every cycle, and the six begin their falls evenly through the learner's cycle.
// The south rank's offsets on the clock are worked out in build() by the tiling rule (see there).
const FRONT_X0 = -960, SOUTH_N = 11, SOUTH_DX = 62.5, NORTH_N = 6, NORTH_DX = 125, SOUTH_Z = 145, NORTH_Z = -235;
// the tiling rule's frame: a fall is seen whole while hinge and crown stand SEEN_EDGE_DEG degrees inside every edge of
// the frame and the hinge is within SEEN_FAR m of the lens when the crown lands
const SEEN_EDGE_DEG = 4, SEEN_FAR = 350;
// FAR RANKS: [metres from the lane's line (minus is north), the x of its first learner]; seven learners in each,
// FAR_DX apart. A far learner's end (the way its pole lies, or the end it loses toward first) and its place in
// the order of standing come from its number by the rules in build(). An edition makes the first 6 or the first
// 14 of that order stand and run the learner's cycle; the others lie as fallen.
const FAR_RANKS = [[-495, -1040], [-755, -975], [-1015, -1030], [405, -1010]], FAR_DX = 128;
// THE SISTERS: [bearing in degrees from east toward north, metres from the origin, the heading of its track
// in degrees, its phase on the clock in seconds, fallen (0, or +1 / -1 for the way its mast lies)].
const SISTERS = [
  [21, 2250, 20, 7, 0], [-25, 1700, -35, 31, 0], [-38, 1250, 70, 0, 1], [-50, 2100, 10, 53, 0], [-72, 1500, -50, 88, 0], [-95, 2500, 35, 19, 0],
  [-118, 1350, -15, 64, 0], [-140, 2200, 60, 0, -1], [-165, 1950, 0, 101, 0], [172, 2600, 40, 43, 0], [150, 1450, -25, 76, 0],
  [128, 2300, 15, 12, 0], [105, 1300, 80, 0, -1], [82, 2100, -40, 94, 0], [62, 1500, 30, 58, 0], [38, 2500, -10, 26, 0],
  [48, 1900, 25, 37, 0], [-31, 2000, -20, 71, 0],
];
// THE BRINE: flat sheets on the floor, [x, z, half length, half width, heading in degrees]
const BRINE = [
  [-960, 262, 44, 15, 8], [-850, 332, 30, 12, -20], [-800, 206, 26, 10, 30], [-690, 300, 38, 13, 12], [-640, 226, 22, 9, -35], [-560, 148, 34, 12, 5],
  [-520, 290, 28, 11, 40], [-430, 252, 42, 14, -8], [-390, 150, 24, 9, 25], [-300, 262, 30, 12, 15], [-270, 120, 36, 11, -14], [-215, 222, 26, 10, -30],
  [-180, 300, 44, 15, 10], [-140, 96, 22, 8, 35], [-112, 214, 16, 7, 0], [-118, 330, 30, 11, -22], [112, 250, 34, 12, 28], [150, 150, 26, 10, -12],
  [205, 40, 40, 13, 80], [180, -110, 30, 11, 60], [128, -230, 36, 12, -20], [-130, -205, 28, 10, 15], [-190, -60, 34, 11, 70], [-720, 20, 40, 13, 10],
  [-900, 64, 30, 11, -18], [-480, -60, 44, 14, 6], [-1090, 390, 36, 12, 12], [300, 300, 45, 15, -30], [330, -260, 40, 13, 20], [-40, 372, 38, 12, 4],
];
// broad sheets on the eastern plain beyond the way out, from 400 m east of it: [x, z, half length, half width, heading in
// degrees]; one that would touch the brine channel is not laid
const EAST_BRINE = [[760, -40, 120, 52, 12], [900, 300, 110, 46, -20], [980, -330, 125, 50, 30], [1180, 60, 150, 62, -8], [1330, -260, 140, 55, 18], [1420, 380, 150, 60, -28]];
// THE STORKS' FLIGHTS (the part file flies them: wedges of storks round an oval of two straights and two half rounds).
// BESIDE THE WAY OUT: a level oval on the right (south) of the route's last straight: its first straight runs OVAL_LEN m the
// way we fly and ends OVAL_SHORT m short of the hoop's plane, OVAL_SIDE m to the right of the route and OVAL_OVER m over it;
// the straight back lies 2 OVAL_R further right. OUT_WEDGES: [each wedge's place round the oval as a share, its birds].
// OVER THE LANE: a level oval FLOCK_Y m up whose first straight begins at FLOCK_FROM [x, z], north-west of the lane's
// beginning, and runs FLOCK_LEN m east FLOCK_SOUTH degrees south, crossing over the lane; the straight back lies 2 FLOCK_R
// to its right. LANE_WEDGES as above. Speeds in m/s, the storks' scales, and the gap from bird to bird in a wedge in m.
// A stork is built 3.5 m in span: the ring birds and the two in the nest are 8.4 m at STORK_SCALE; a wedge's birds are 0.75
// to 1.2 of their flight's scale, so up to 10.1 m beside the way out and up to 6.7 m over the lane.
const OVAL_LEN = 180, OVAL_SHORT = 45, OVAL_SIDE = 30, OVAL_OVER = 4, OVAL_R = 22, OVAL_SPEED = 12, STORK_SCALE = 2.4, OUT_GAP = 6;
const OUT_WEDGES = [[0, 7], [0.14, 3], [0.25, 5], [0.4, 7], [0.52, 4], [0.66, 6], [0.77, 5], [0.9, 3]];
const FLOCK_FROM = [-1500, 60], FLOCK_SOUTH = 20, FLOCK_LEN = 700, FLOCK_R = 60, FLOCK_Y = 125, FLOCK_SPEED = 14, FLOCK_SCALE = 1.6, FLOCK_GAP = 7;
const LANE_WEDGES = [[0, 7], [0.15, 4], [0.34, 9], [0.5, 5], [0.68, 6], [0.85, 3]];
// THE LOOKS' FIGURES. FOV is the lens's field of view in degrees and LOOK_FAR how far on along the route the gaze rests.
// The lane: CROWN_KEEP, LOOK_LANE (the weight), SCHOOL_AHEAD (three south learners' pitch), SCHOOL_H, ROAD_AHEAD, SWING_LEN,
// SPARE. The lane as flown, for the tiling rule: FLY_DT, FLY_ON, SEEN_STEP. The climb: LOOK_CLIMB (the weight), AIM_FAR (the
// length of its direction), CLIMB_LEAD (degrees), FOLLOW (the share of the mast's way from the axis that the heading follows),
// FOLLOW_FROM and FOLLOW_FULL (metres of mast); EAST_AT the bearing at which the heading is held (degrees from east toward
// north), EAST_DWELL the half width of that hold; DOWN, SUN_DOWN and SOUTH_DOWN the base's degrees under level, SUN_FROM and
// SUN_TO the sun's place right of the mast's axis in degrees, SUN_EASE, SOUTH_EASE and EAST_EASE the degrees of bearing over
// which the base passes from one to the next; HALF, HALF_DOWN, CLEAR, EDGE, KEEP_UP, LOSE_UP, BALL_KEEP, BALL_LOSE, UP_MOST,
// KEEP_DOWN, LOSE_DOWN, FAR_KEEP, FAR_LOSE, FAR_EDGE and PITCH_MOST in degrees, THING_UP and THING_DOWN in metres.
// The way out: LOOK_OUT (the weight), OUT_AHEAD, OUT_SIDE.
const FOV = 62, LOOK_FAR = 110, CROWN_KEEP = 1.5, LOOK_LANE = 0.62, SCHOOL_AHEAD = 3 * SOUTH_DX, SCHOOL_H = 40, ROAD_AHEAD = 85, SWING_LEN = 140, SPARE = 1.2;
const FLY_DT = 0.1, FLY_ON = 60, SEEN_STEP = 0.2;
const LOOK_CLIMB = 1, AIM_FAR = 400, CLIMB_LEAD = 26, FOLLOW = 0.62, FOLLOW_FROM = 110, FOLLOW_FULL = 220, EAST_AT = 19, EAST_DWELL = 8, DOWN = 27, SUN_DOWN = 12, SOUTH_DOWN = 18, SUN_FROM = 14, SUN_TO = 58, SUN_EASE = 70, SOUTH_EASE = 40, EAST_EASE = 40;
const SUN_BEARING = Math.atan2(-SUN.z, SUN.x) / DEG;      // the sun's bearing in degrees from east toward north
const BASE = [[EAST_AT + 11, DOWN], [180 + SUN_BEARING + SUN_FROM - SUN_EASE, DOWN], [180 + SUN_BEARING + SUN_FROM, SUN_DOWN], [180 + SUN_BEARING + SUN_TO, SUN_DOWN],
  [180 + SUN_BEARING + SUN_TO + SOUTH_EASE, SOUTH_DOWN], [EAST_AT + 371 - EAST_EASE, SOUTH_DOWN], [EAST_AT + 371, DOWN]];
const HALF = 28, HALF_DOWN = 31, CLEAR = 6, EDGE = 2, KEEP_UP = 0, LOSE_UP = 12, BALL_KEEP = 28, BALL_LOSE = 64, UP_MOST = 12, KEEP_DOWN = 12, LOSE_DOWN = 20, FAR_KEEP = 36, FAR_LOSE = 48, FAR_EDGE = 4, PITCH_MOST = 32, THING_UP = 10, THING_DOWN = 2;
const LOOK_OUT = 0.9, OUT_AHEAD = 90, OUT_SIDE = 21;
// THE HAUL ROAD (built in build(), see there)
const HAUL_OFF = 24, HAUL_R = 10, HAUL_X0 = -1420, HAUL_X1 = -500, HAUL_TRAINS = 6, HAUL_WAGONS = 7, HAUL_PITCH = 16, HAUL_SPEED = 7.5;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// a look's weight along the route: up over the share fade of its stretch from a, down over as much to b (the kit's bell, written here)
const bell = (x, a, b, fade = 0.25) => { const w = (b - a) * fade; return smooth(a, a + w, x) * (1 - smooth(b - w, b, x)); };
// a fixed hash of two whole numbers into 0..1 (the crust's hand; the same on every seed)
const hash2 = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };

export default {
  id: 'pole-that-must-not-fall',
  name: 'The Pole That Must Not Fall',
  category: 'bizarre',
  weirdness: 0.55,
  media: ['air', 'open'],
  async build(ctx) {
    const detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const rare = !!ctx.vary?.rare, density = Math.min(1.3, Math.max(0.7, ctx.vary?.density ?? 1));
    const S = makeStyle(ctx, {});                      // the edition: one draw from a fork of the seed
    const er = ctx.rng.fork('ptf-world');
    const manyStand = er.chance(0.5), nBars = er.chance(0.5) ? 14 : 20;
    const fixed = makeRng(480120);                     // the hand of things that are the same in every edition
    const I = S.inks, P = S.palette, ORD = S.order;
    const scene = new THREE.Scene();
    scene.background = P.bands[5].clone();
    await ctx.yield();

    // the great machine, at the origin, unturned; the world builds its own sky and floor
    const rEnd = ROUTE[ROUTE.length - 1], rBack = ROUTE[ROUTE.length - 2], legLen = Math.hypot(rEnd[0] - rBack[0], rEnd[2] - rBack[2]);
    const legX = (rEnd[0] - rBack[0]) / legLen, legZ = (rEnd[2] - rBack[2]) / legLen;      // the last straight's level heading; (-legZ, legX) is to its right
    const stringOval = { x: rEnd[0] - legX * (OVAL_LEN + OVAL_SHORT) - legZ * OVAL_SIDE, y: rEnd[1] + OVAL_OVER, z: rEnd[2] - legZ * (OVAL_LEN + OVAL_SHORT) + legX * OVAL_SIDE, dx: legX, dz: legZ, len: OVAL_LEN, r: OVAL_R, speed: OVAL_SPEED };
    const laneOval = { x: FLOCK_FROM[0], y: FLOCK_Y, z: FLOCK_FROM[1], dx: Math.cos(FLOCK_SOUTH * DEG), dz: Math.sin(FLOCK_SOUTH * DEG), len: FLOCK_LEN, r: FLOCK_R, speed: FLOCK_SPEED };
    const flights = [{ oval: stringOval, wedges: OUT_WEDGES.filter((q, k) => k < 6 || 0.75 * density * detail > 0.7 + 0.1 * (k - 6)), scale: STORK_SCALE, gap: OUT_GAP }, { oval: laneOval, wedges: LANE_WEDGES, scale: FLOCK_SCALE, gap: FLOCK_GAP }];
    const hero = await buildHero(ctx, { style: S, sky: false, floor: false, detail, storkScale: STORK_SCALE, flights });
    scene.add(hero.object);
    await ctx.yield();
    const sky = S.makeSky({ radius: 9500, moon: rare, bars: nBars });
    scene.add(sky);
    await ctx.yield();
    const floor = await S.makeFloor({ radius: 9300, cell: 150, count: 32, rng: fixed });
    scene.add(floor);
    await ctx.yield();

    // ------------------------------------------------------------ the route
    const path = makePath(ROUTE, { samples: 640 });
    const LEN = path.length, NS = Math.ceil(LEN / 2);
    const RX = new Float32Array(NS + 1), RY = new Float32Array(NS + 1), RZ = new Float32Array(NS + 1), tmp = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) { path.posAtDist((i / NS) * LEN, tmp); RX[i] = tmp.x; RY[i] = tmp.y; RZ[i] = tmp.z; }
    await ctx.yield();
    // the route metre nearest a place on the floor plan, searched between two route metres
    const metreNear = (x, z, s0 = 0, s1 = LEN) => {
      let best = Infinity, bi = 0;
      for (let i = Math.max(0, Math.floor((s0 / LEN) * NS)); i <= Math.min(NS, Math.ceil((s1 / LEN) * NS)); i++) {
        const dx = RX[i] - x, dz = RZ[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; }
      }
      return (bi / NS) * LEN;
    };
    // the floor-plan distance from a place to the route's first stretch (to the route metre s1)
    const laneDist = (x, z, s1) => {
      let best = Infinity;
      for (let i = 0; i <= Math.min(NS, Math.ceil((s1 / LEN) * NS)); i += 4) { const dx = RX[i] - x, dz = RZ[i] - z, d = dx * dx + dz * dz; if (d < best) best = d; }
      return Math.sqrt(best);
    };
    const speedAt = (s) => { let v = PACE[0][1]; for (let k = 1; k < PACE.length; k++) v += (PACE[k][1] - PACE[k - 1][1]) * smooth(PACE[k][0] - 40, PACE[k][0] + 40, s); return v; };
    const pace = (u) => speedAt(u * LEN) / 30;
    let duration = 0;
    for (let i = 0; i < NS; i++) duration += (LEN / NS) / speedAt(((i + 0.5) / NS) * LEN);

    // ------------------------------------------------------------ the looks (see the head of this file)
    const U = (s) => Math.min(1, Math.max(0, s / LEN)), pois = [];
    // the first route metre from s0 on at which the eye's bearing from the mast's axis (from east toward north) is deg
    const metreAtBearing = (deg, s0) => {
      const wrap = (a) => a - Math.round(a / (2 * Math.PI)) * 2 * Math.PI;
      let prev = null;
      for (let i = Math.max(0, Math.floor((s0 / LEN) * NS)); i <= NS; i++) {
        const d = wrap(Math.atan2(-RZ[i], RX[i]) - deg * DEG);
        if (prev !== null && prev < 0 && d >= 0 && d - prev < 1) return (i / NS) * LEN;
        prev = d;
      }
      return LEN;
    };
    const ballY = HINGE_Y + hero.anchors.ball.s, ballR = hero.anchors.ball.radius;
    const eastEnd = FRONT_X0 + (SOUTH_N - 1) * SOUTH_DX + 6.5;      // the east edge of the school's front ranks
    const sSchoolEnd = metreNear(eastEnd, laneZ(eastEnd), 0, LEN * 0.4), sEast = metreAtBearing(0, sSchoolEnd);
    const sSouth2 = metreAtBearing(-90, sEast), sSouth3 = metreAtBearing(-90, sSouth2 + 100);
    // the opening inside the hoop is first drawn where the eye stands due east of the mast on the second turn, the hoop then behind
    // the right shoulder and high, out of every frame
    const sEast2 = metreAtBearing(0, sSouth2);
    // WHERE A LEVEL FRAME LOSES THE CROWN: the first route metre at which the ball's top stands higher in a level frame turned
    // along the route (the route's own point lookAhead m on) than the frame's top edge less CROWN_KEEP degrees. No look begins before it.
    const tanV = Math.tan((FOV / 2) * DEG), tanH = tanV * 16 / 9;
    let sCrown = sSchoolEnd;
    for (let i = 0; i < NS; i++) {
      const j = Math.min(NS, i + Math.round(LOOK_FAR / (LEN / NS))), hx = RX[j] - RX[i], hz = RZ[j] - RZ[i], hl = Math.hypot(hx, hz) || 1;
      const fwd = (-RX[i] * hx - RZ[i] * hz) / hl;                  // metres to the mast's axis along the level heading
      if (fwd < 1 || (ballY + ballR - RY[i]) / fwd > Math.tan((FOV / 2 - CROWN_KEEP) * DEG)) { sCrown = (i / NS) * LEN; break; }
    }
    // the lane's look, from sCrown to 60 m of route past the school's east end: one point ahead of the eye. Till the route metre
    // sSwing it lies on the line where the south rank's hinges stand when they have lost (their carts at the north buffers), SCHOOL_AHEAD m ahead of the eye at
    // SCHOOL_H m; from sSwing it moves evenly, over SWING_LEN m of route, to the floor on the great shadow's own line (the
    // shadow of the upright mast), ROAD_AHEAD m ahead of the eye, and stays there. sSwing is worked out below with the school.
    const laneLen = Math.hypot(1, LANE_K), swingOff = SOUTH_Z - LEARNER.reach;
    const shF = hero.anchors.shadowFoot, shC = hero.anchors.shadowCrown, shK = (shC.z - shF.z) / (shC.x - shF.x);
    const laneAim = new THREE.Vector3(), laneEye = new THREE.Vector3();
    const laneLook = { sSwing: sSchoolEnd };
    const lanePoi = {
      from: U(sCrown), to: U(sSchoolEnd + 60), weight: LOOK_LANE, fade: 0.12, arc: true,
      at: (time, u) => {
        path.posAtDist(u * LEN, laneEye);
        const e = smooth(laneLook.sSwing, laneLook.sSwing + SWING_LEN, u * LEN);
        const xs = laneEye.x + SCHOOL_AHEAD / laneLen, xr = laneEye.x + ROAD_AHEAD / laneLen, zr = shF.z + (xr - shF.x) * shK;
        return laneAim.set(xs + (xr - xs) * e, SCHOOL_H * (1 - e), (laneZ(xs) + swingOff) * (1 - e) + zr * e);
      },
    };
    pois.push(lanePoi);
    pois.push({ at: [0, HINGE_Y, 0], from: U(sSchoolEnd), to: U(sEast - 40), weight: 0.75, fade: 0.12, arc: true });
    // the climb's look: a direction from the eye by the eye's bearing from the mast's axis and by where the things on the mast
    // (the two galleries, the ball with its nest) stand over or under the eye at the clock
    const eye = new THREE.Vector3(), aim = new THREE.Vector3(), mp = new THREE.Vector3();
    const onMast = hero.anchors.galleries.map((g) => ({ s: g.s, rim: g.radius, up: THING_UP, down: THING_DOWN, keep: KEEP_UP, lose: LOSE_UP })).concat([{ s: hero.anchors.ball.s, rim: 0, up: ballR + THING_UP, down: ballR + THING_DOWN, keep: BALL_KEEP, lose: BALL_LOSE }]);
    const wrapDeg = (a) => a - Math.round(a / 360) * 360;
    pois.push({
      from: U(sEast - 160), to: U(sSouth3), weight: LOOK_CLIMB, fade: 0.1, arc: true,
      at: (time, u) => {
        path.posAtDist(u * LEN, eye);
        const bearing = Math.atan2(-eye.z, eye.x) / DEG, x = wrapDeg(bearing - EAST_AT);
        // the heading: the gaze leads the mast's axis by CLIMB_LEAD degrees; within EAST_DWELL degrees either side of EAST_AT it
        // slows to a stand at EAST_AT, and the EAST_DWELL degrees so lost are made up evenly round the whole turn
        const held = Math.abs(x) < EAST_DWELL ? x / 2 + (EAST_DWELL / (2 * Math.PI)) * Math.sin((Math.PI * x) / EAST_DWELL) : Math.sign(x) * EAST_DWELL / 2;
        // and it is taken not from the axis but from a point FOLLOW of the way from the axis to where the mast stands at the clock
        // at the eye's own height (none of the way under FOLLOW_FROM m of mast, the whole share from FOLLOW_FULL m)
        const sm = Math.min(MAST_L, Math.max(0, eye.y - HINGE_Y));
        mastPoint(sm, time, mp);
        const lead = Math.atan2(-(eye.z - mp.z * FOLLOW * smooth(FOLLOW_FROM, FOLLOW_FULL, sm)), eye.x) / DEG;
        const az = (lead - CLIMB_LEAD - held + (x * EAST_DWELL) / 360) * DEG;
        // the pitch's base, by the eye's bearing alone (BASE: [bearing, degrees under level], eased from each to the next): DOWN on
        // the ground from the east round by the north; SUN_DOWN, the sun whole under the frame's top edge, for the bearings from
        // which the sun stands in the frame to the right of the mast (from SUN_FROM to SUN_TO degrees past the bearing opposite
        // the sun); SOUTH_DOWN from there round by the south.
        // Then each thing on the mast is FRAMED OR DROPPED by the elevation of its middle from the eye. A thing over the eye by
        // less than KEEP_UP degrees (the ball: BALL_KEEP, and BALL_LOSE for LOSE_UP; the gaze is never raised over UP_MOST for it), or under the base by less than KEEP_DOWN, is framed: the pitch is brought (if it is not
        // there already) to where the whole thing, THING_UP m over it to THING_DOWN m under it, stands inside the frame's top
        // edge by CLEAR degrees and its bottom edge by EDGE (HALF is the frame's half height where the mast stands in it).
        // One over the eye by more than LOSE_UP is left to itself (the pitch is the base). One under the base by more than LOSE_DOWN
        // is let go (the pitch is the base), unless it stands FAR_LOSE degrees and more under the eye: then the pitch is raised to
        // where the whole thing stands outside the bottom edge by FAR_EDGE (HALF_DOWN is the frame's half height at the middle of
        // that edge), and by a share of that from FAR_KEEP degrees on.
        // Between KEEP and LOSE the pitch passes evenly from the one to the other. Of all the things' pulls the greatest upward
        // and the greatest downward are taken.
        const bb = ((bearing - BASE[0][0]) % 360 + 360) % 360 + BASE[0][0];
        let base = -BASE[0][1];
        for (let k = 1; k < BASE.length; k++) if (bb >= BASE[k - 1][0]) base = -(BASE[k - 1][1] + (BASE[k][1] - BASE[k - 1][1]) * smooth(BASE[k - 1][0], BASE[k][0], bb));
        let raise = 0, lower = 0;                                    // of all the things, the most the gaze is raised by one and the most it is lowered by one
        for (const g of onMast) {
          mastPoint(g.s, time, mp);
          const rho = Math.max(1, Math.hypot(eye.x - mp.x, eye.z - mp.z)), el = Math.atan2(mp.y - eye.y, rho) / DEG;
          // its top and its low edge as the eye sees them: of a gallery over the eye the near rim stands highest, of one under it lowest
          const near = Math.max(1, rho - g.rim), top = Math.atan2(mp.y + g.up - eye.y, mp.y + g.up > eye.y ? near : rho) / DEG, low = Math.atan2(mp.y - g.down - eye.y, mp.y - g.down < eye.y ? near : rho) / DEG;
          const framed = Math.min(Math.max(base, Math.min(top + CLEAR - HALF, UP_MOST)), low + HALF - EDGE);
          const dropped = el > 0 ? base : base + Math.max(0, top + HALF_DOWN + FAR_EDGE - base) * smooth(FAR_KEEP, FAR_LOSE, -el);
          const w = el > 0 ? 1 - smooth(g.keep, g.lose, el) : 1 - smooth(KEEP_DOWN, LOSE_DOWN, base - el);
          const by = dropped + (framed - dropped) * w - base;
          raise = Math.max(raise, by); lower = Math.min(lower, by);
        }
        const pitch = Math.max(-PITCH_MOST, Math.min(PITCH_MOST, base + raise + lower)) * DEG;
        const c = Math.cos(pitch) * AIM_FAR;
        return aim.set(eye.x - Math.cos(az) * c, eye.y + Math.sin(pitch) * AIM_FAR, eye.z + Math.sin(az) * c);
      },
    });
    // the way out's look: a point OUT_AHEAD m ahead of the eye along the last leg's line and OUT_SIDE m to its right, at the hoop's height
    const outAim = new THREE.Vector3(), outEye = new THREE.Vector3();
    pois.push({
      from: U(sSouth3 - 20), to: 1, weight: LOOK_OUT, fade: 0.3, arc: true,
      at: (time, u) => {
        path.posAtDist(u * LEN, outEye);
        const along = (outEye.x - rEnd[0]) * legX + (outEye.z - rEnd[2]) * legZ + OUT_AHEAD;
        return outAim.set(rEnd[0] + legX * along - legZ * OUT_SIDE, rEnd[1], rEnd[2] + legZ * along + legX * OUT_SIDE);
      },
    });
    await ctx.yield();

    // ------------------------------------------------------------ the school's places
    const learners = [];
    // THE LANE AS FLOWN. laneLook.walk() flies the route's first stretch (to the school's east end and FLY_ON m more) as the
    // engine flies a journey's first world, in steps of FLY_DT s: the speed eases toward the pace at 1.4 a second from the
    // flight's mean speed (the eased arrival after a crossing, the turn's ceiling and the sway are not walked; the figures 1.4,
    // 2.6 and 4 per cent are the engine's own and must follow it); the gaze
    // goes to the route's own point LOOK_FAR m on, then each look turns it along the arc by its weight (the bell of its from, to
    // and fade, and the engine's guard over the route's first 4 per cent); the lens follows the gaze by 1 - exp(-dt * 2.6) a step.
    // It fills the lens's place and its forward, right and up directions for every step.
    const FLY_N = Math.ceil((sSchoolEnd + FLY_ON) / PACE[0][1] / FLY_DT) + 60, FL = new Float32Array(FLY_N * 12);
    let flyN = 0;
    {
      const gq = new THREE.Quaternion(), cq = new THREE.Quaternion(), gm = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0);
      const pos = new THREE.Vector3(), ah = new THREE.Vector3(), d = new THREE.Vector3(), to = new THREE.Vector3(), ax = new THREE.Vector3(), v = new THREE.Vector3();
      laneLook.walk = () => {
        let s = 0, speed = LEN / duration;
        for (flyN = 0; flyN < FLY_N && s < sSchoolEnd + FLY_ON; flyN++) {
          const u = s / LEN, guard = smooth(0, 0.04, u);
          path.posAtDist(s, pos); path.posAtDist(s + LOOK_FAR, ah); d.subVectors(ah, pos).normalize();
          for (const p of pois) {
            const w = bell(u, p.from, p.to, p.fade) * p.weight * guard;
            if (w <= 0.001) continue;
            const at = typeof p.at === 'function' ? p.at(0, u) : p.at;
            if (at.isVector3) to.copy(at); else to.set(at[0], at[1], at[2]);
            to.sub(pos).normalize();
            const ang = Math.acos(Math.min(1, Math.max(-1, d.dot(to))));
            if (ang > 1e-4) { ax.crossVectors(d, to); if (ax.lengthSq() < 1e-8) ax.copy(UP); else ax.normalize(); d.applyAxisAngle(ax, ang * Math.min(1, w)).normalize(); }
          }
          gm.lookAt(pos, ah.copy(pos).add(d), UP); gq.setFromRotationMatrix(gm);
          if (flyN === 0) cq.copy(gq); else cq.slerp(gq, 1 - Math.exp(-FLY_DT * 2.6));
          const o = flyN * 12;
          FL[o] = pos.x; FL[o + 1] = pos.y; FL[o + 2] = pos.z;
          v.set(0, 0, -1).applyQuaternion(cq); FL[o + 3] = v.x; FL[o + 4] = v.y; FL[o + 5] = v.z;
          v.set(1, 0, 0).applyQuaternion(cq); FL[o + 6] = v.x; FL[o + 7] = v.y; FL[o + 8] = v.z;
          v.set(0, 1, 0).applyQuaternion(cq); FL[o + 9] = v.x; FL[o + 10] = v.y; FL[o + 11] = v.z;
          speed += (speedAt(s) - speed) * (1 - Math.exp(-1.4 * FLY_DT)); s += speed * FLY_DT;
        }
      };
    }
    // is the place (x, y, z) inside the 16:9 frame of step n of that flight, SEEN_EDGE_DEG degrees inside its edges?
    const seenH = Math.tan(Math.atan(tanH) - SEEN_EDGE_DEG * DEG), seenV = Math.tan((FOV / 2 - SEEN_EDGE_DEG) * DEG);
    const inFrame = (n, x, y, z) => {
      const o = n * 12, dx = x - FL[o], dy = y - FL[o + 1], dz = z - FL[o + 2], f = dx * FL[o + 3] + dy * FL[o + 4] + dz * FL[o + 5];
      return f > 1 && Math.abs(dx * FL[o + 6] + dy * FL[o + 7] + dz * FL[o + 8]) < f * seenH && Math.abs(dx * FL[o + 9] + dy * FL[o + 10] + dz * FL[o + 11]) < f * seenV;
    };
    // THE TILING RULE for the south rank. A south learner loses toward the lane: its hinge then stands LEARNER.reach m north of
    // its track's middle and its pole falls northward. Its fall is SEEN WHOLE from a flight second T of letting go if, every
    // SEEN_STEP s from T to the crown's landing, hinge and crown stand inside the frame of the lane as flown, and the hinge is
    // within SEEN_FAR m of the lens when the crown lands. cover(sSwing) flies the lane with the look's swing at sSwing, gives
    // each south learner the longest unbroken stretch [a, b] of such seconds, and returns the sum of the stretches. As built,
    // eight of the eleven have a stretch; the three westmost have none (none of their falls can be seen whole from the lane
    // as flown), and the cover of the cycle rests on the other eight.
    const south = [];
    for (let j = 0; j < SOUTH_N; j++) { const x = FRONT_X0 + j * SOUTH_DX; south.push({ x, z: laneZ(x) + SOUTH_Z, front: true, south: true, runs: true, a: 0, b: 0, ends: [-1, -1, -1] }); }
    const fallN = Math.round(fallTime() / FLY_DT), stepN = Math.max(1, Math.round(SEEN_STEP / FLY_DT)), fallUp = [], fallOut = [];
    for (let k = 0; k <= fallN; k++) { const a = fallAngle(Math.min(fallTime(), k * FLY_DT)); fallUp.push(LEARNER.L * Math.cos(a)); fallOut.push(LEARNER.L * Math.sin(a)); }
    const cover = (sSwing) => {
      laneLook.sSwing = sSwing; laneLook.walk();
      let total = 0;
      for (const q of south) {
        const hz = q.z - LEARNER.reach;
        let run = 0, best = 0, bestEnd = 0;
        for (let n = 0; n + fallN < flyN; n++) {
          const o = (n + fallN) * 12;
          let whole = Math.hypot(q.x - FL[o], LEARNER.hingeY - FL[o + 1], hz - FL[o + 2]) <= SEEN_FAR;
          for (let k = 0; whole && k <= fallN; k = k < fallN ? Math.min(fallN, k + stepN) : fallN + 1) {
            whole = inFrame(n + k, q.x, LEARNER.hingeY, hz) && inFrame(n + k, q.x, LEARNER.hingeY + fallUp[k], hz - fallOut[k]);
          }
          run = whole ? run + 1 : 0;
          if (run > best) { best = run; bestEnd = n; }
        }
        q.b = best > 0 ? bestEnd * FLY_DT : 0; q.a = best > 0 ? (bestEnd - best + 1) * FLY_DT : 0;
        total += q.b - q.a;
      }
      return total;
    };
    // THE SWING OF THE LANE'S LOOK. The look stays with the school until the south rank's stretches cover the learner's cycle
    // SPARE times over: sSwing is the first of the south learners' places abeam, taken from the west, at which they do (the
    // school's east end if none does: the look then begins to swing only over its last 60 m, as its weight falls).
    let covered = 0, sSwing = sSchoolEnd;
    for (const q of south) {
      const s = metreNear(q.x, q.z - LEARNER.reach, 0, LEN * 0.5);
      covered = cover(s);
      await ctx.yield();
      if (covered >= SPARE * LEARNER.cycle) { sSwing = s; break; }
    }
    if (sSwing === sSchoolEnd) covered = cover(sSwing);
    // The stretches are laid end to end round the learner's cycle, each shrunk by the same factor, taking the learners from
    // the two ends of the rank inward in turn; a learner lets go, for the entry clock at the middle of its laid stretch, at the
    // middle second of its own stretch: so each fall begins in the middle of its stretch and the stretches overlap evenly.
    {
      const turn = south.map((q, j) => j).sort((i, j) => (Math.min(i, SOUTH_N - 1 - i) - Math.min(j, SOUTH_N - 1 - j)) || (i - j));
      let laid = 0;
      for (const j of turn) {
        const q = south[j], share = covered > 0 ? ((q.b - q.a) * LEARNER.cycle) / covered : LEARNER.cycle / SOUTH_N;
        const letsGo = laid + share / 2 + (q.a + q.b) / 2;         // the clock second at which it lets go
        q.offset = (((LEARNER.balance - letsGo) % LEARNER.cycle) + LEARNER.cycle) % LEARNER.cycle;
        laid += share;
        learners.push(q);
      }
      for (let k = 0; k < NORTH_N; k++) {
        const x = FRONT_X0 + k * NORTH_DX;
        learners.push({ x, z: laneZ(x) + NORTH_Z, front: true, south: false, runs: true, offset: (((k % 2) * 3 + (k >> 1)) * LEARNER.cycle) / NORTH_N, ends: [-1, -1, -1] });
      }
    }
    await ctx.yield();
    const nStand = manyStand ? 14 : 6;
    FAR_RANKS.forEach(([dz, x0], r) => {
      for (let c = 0; c < 7; c++) {
        const j = r * 7 + c, x = x0 + c * FAR_DX, side = hash2(j, 3) < 0.5 ? 1 : -1, rank = (j * 11) % 28;
        learners.push({ x, z: laneZ(x) + dz, front: false, runs: rank < nStand, offset: ((rank * 17) % 28) * (LEARNER.cycle / 28) + 1.3, side, ends: [side, -side, side] });
      }
    });
    for (const q of learners) q.pale = Math.hypot(q.x, q.z) > 900 && laneDist(q.x, q.z, LEN) > 400;
    // the floor a body stands on: rectangles [x0, x1, z0, z1] that brine and crust keep off
    const keepOff = [[-17, 17, -139, 139], [-78, 78, 148, 268], [-78, 78, -268, -148]];
    for (const q of learners) keepOff.push([q.x - 6.5, q.x + 6.5, q.z - LEARNER.track / 2 - 6.4, q.z + LEARNER.track / 2 + 3.4]);
    for (const [bear, d] of SISTERS) keepOff.push([d * Math.cos(bear * DEG) - 150, d * Math.cos(bear * DEG) + 150, -d * Math.sin(bear * DEG) - 150, -d * Math.sin(bear * DEG) + 150]);
    // the working line's figures (it is built further down) and the floor its things stand on
    const LINE_FROM = 272, LINE_TO = 9200, LINE_SOLID = 900, LINE_PALE = 900, LINE_BAND = 30, LINE_FAR_WIDE = 1.5;
    const SECTION_N = 7, SECTION_RANKS = [[0, LINE_FROM + 40, SECTION_N], [1, LINE_FROM + 40, SECTION_N], [0, 720, 5], [0, 1120, 5], [0, 1520, 5], [0, 1920, 5]], SECTION_LEN = 84, SECTION_W = 10, SECTION_GAP = 26, SIDING_X = 52, WAGONS = 9, HEAP_ROWS = 3, HEAP_COLS = 4, HEAP_FROM = 780, HEAP_EVERY = 190, HEAP_TO = 2100;
    for (const e of [1, -1]) keepOff.push([-25, 25, Math.min(e * LINE_FROM, e * LINE_TO), Math.max(e * LINE_FROM, e * LINE_TO)]);
    for (const [rank, out, count] of SECTION_RANKS) keepOff.push([40 + rank * (SECTION_LEN + 30), 48 + (rank + 1) * (SECTION_LEN + 30), -(out + 8 + count * SECTION_GAP), -(out - 14)]);
    keepOff.push([-262, -30, HEAP_FROM - 30, HEAP_TO + 30], [34, 144, HEAP_FROM - 20, HEAP_TO + 20], [SIDING_X - 10, SIDING_X + 10, LINE_FROM + 16, LINE_FROM + 56 + (WAGONS + 1) * 40], [-52 - HEAP_COLS * 46, -30, LINE_FROM + 30, LINE_FROM + 74 + HEAP_ROWS * 72]);
    for (let x = HAUL_X0 - 20; x < HAUL_X1 + 20; x += 20) keepOff.push([x - 10, x + 10, laneZ(x) - HAUL_OFF - 2 * HAUL_R - 11, laneZ(x) - HAUL_OFF + 11]);      // the haul road's two lanes
    // THE BRINE CHANNEL'S PLACE (it is built further down). One broad channel of standing brine lies along the line from the
    // origin toward the sun's bearing, from CH_FROM m out to CH_TO m: CH_HALF m in half width, each bank shaken by up to
    // 2 CH_SHAKE m by its own fixed waves, its head rounded over CH_HEAD m. No sheet, pan, pool or ridge of the crust is
    // laid in it. chHalf(d, side): the half width d metres out on the north (-1) or south (+1) bank.
    const CH_FROM = 450, CH_TO = 9200, CH_HEAD = 300, CH_HALF = 212, CH_SHAKE = 18;
    const chC = Math.cos(SUN_BEARING * DEG), chS = Math.sin(SUN_BEARING * DEG);
    const chHalf = (d, side) => {
      if (d <= CH_FROM || d >= CH_TO) return 0;
      const e = Math.min(1, (d - CH_FROM) / CH_HEAD), shake = CH_SHAKE * (Math.sin(d / 97 + side * 1.3) + 0.6 * Math.sin(d / 41 + side * 2.9) + 0.4 * Math.sin(d / 263 + side));
      return (CH_HALF + shake) * Math.sqrt(1 - (1 - e) * (1 - e));
    };
    const inChannel = (x, z, m) => { const d = x * chC - z * chS, v = x * chS + z * chC; return d > CH_FROM - m && d < CH_TO && Math.abs(v) < chHalf(Math.min(CH_TO - 1, Math.max(d, CH_FROM + 40)), v < 0 ? -1 : 1) + m; };
    const onBody = (x, z, m = 0) => { if (inChannel(x, z, m)) return true; for (const r of keepOff) if (x > r[0] - m && x < r[1] + m && z > r[2] - m && z < r[3] + m) return true; return false; };
    await ctx.yield();

    // ------------------------------------------------------------ the brine: flat sheets in the horizon's ink
    // each sheet is three flat shapes one on another: a thin lilac line, a white rim of salt, the brine
    {
      const b = S.batch(), one = (c) => ({ lit: c, shade: c }), LANE_END = 1120, LANE_CLEAR = 30, LANE_SMALL = 130;
      const layers = [[0, one(P.joint)], [0.7, one(P.plates[0])], [2.8, one(P.brine)]];      // [metres in from the edge, ink]
      const sheets = [];
      const farBrine = [];                                          // and larger sheets far out on the plain, by the fixed hand
      for (let k = 0, n = Math.round(44 * detail); k < 44; k++) { const an = fixed.range(0, 6.283), d = fixed.range(420, 2100), a = fixed.range(34, 85), sheet = [Math.cos(an) * d, Math.sin(an) * d, a, a * fixed.range(0.28, 0.42), fixed.range(-40, 40)]; if (k < n) farBrine.push(sheet); }
      // and broad sheets out on the eastern plain, the way the flight leaves: [bearing from east toward north, metres out], each
      // sheet's length a share of its distance by the fixed hand
      for (let k = 0, n = Math.round(26 * detail); k < 26; k++) {
        const an = fixed.range(-52, 72) * DEG, d = fixed.range(600, 3400), a = d * fixed.range(0.055, 0.095), sheet = [Math.cos(an) * d, -Math.sin(an) * d, a, a * fixed.range(0.32, 0.5), fixed.range(-30, 30)];
        if (k < n) farBrine.push(sheet);
      }
      BRINE.concat(EAST_BRINE, farBrine).forEach(([x, z, a0, c0, head], k) => {
        const small = laneDist(x, z, LANE_END) < LANE_SMALL ? 0.5 : 1, a = a0 * small, c = c0 * small;      // a sheet beside the lane is laid at half its size
        const p1 = hash2(k, 7) * 6.28, p2 = hash2(k, 19) * 6.28, ch = Math.cos(head * DEG), sh = Math.sin(head * DEG), pts = [];
        let clear = true;
        for (let k = 0; k < 18; k++) {
          const t = (k / 18) * Math.PI * 2, r = 1 + 0.16 * Math.sin(2 * t + p1) + 0.09 * Math.sin(3 * t + p2), u = Math.cos(t) * a * r, v = Math.sin(t) * c * r;
          const px = x + u * ch + v * sh, pz = z - u * sh + v * ch;
          pts.push([px, pz]); if (onBody(px, pz, 3) || laneDist(px, pz, LANE_END) < LANE_CLEAR) clear = false;
        }
        if (clear) sheets.push({ x, z, a: a * 1.25, c: c * 1.25, ch, sh, pts });       // a sheet that would lie under a body, or within LANE_CLEAR m of the route's first LANE_END m in plan, is not laid
      });
      for (const [f, ink] of layers) for (const q of sheets) for (let k = 0; k < 18; k++) {
        const A = q.pts[k], B = q.pts[(k + 1) % 18], w = 1 - f / (q.c * 0.8);
        b.tri(q.x, 0, q.z, q.x + (B[0] - q.x) * w, 0, q.z + (B[1] - q.z) * w, q.x + (A[0] - q.x) * w, 0, q.z + (A[1] - q.z) * w, ink);
      }
      const brine = S.mesh(b, S.materials.inkFloor); brine.renderOrder = ORD.brine; brine.frustumCulled = false; scene.add(brine);
      for (const q of sheets) keepOff.push([q.x - q.a * 0.8, q.x + q.a * 0.8, q.z - q.a * 0.5, q.z + q.a * 0.5]);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the brine channel, the salt pans and the plain's middle pools
    // THE BRINE CHANNEL (its place and banks: chHalf above): three flat shapes one on another, as a sheet of brine is laid: a
    // lilac line, a white rim of salt, and the standing brine in the deepest ink of the sky's bands, which the floor has
    // nowhere else. The rim's two widths (RIM m) grow by a share RIM_GROW of the distance out. Its stations lie CH_STEP m
    // apart at the head and a share CH_STEP_GROW of the distance further apart beyond.
    // THE SUN'S ROAD lies down the channel's middle: from ROAD_SOLID m out to the channel's end one unbroken band, ROAD_HALF m
    // and a share ROAD_WIDEN of its distance in half width (its edge shaken by a fixed hand), in the sun's warm ink with a
    // heart of the sun's pale ring ink ROAD_HEART of its width; from ROAD_FROM to ROAD_SOLID it is broken into BARS flat bars
    // lying across the channel, each of the same two inks, which slide down the road toward the mast, one after another, in
    // BAR_T s of the clock from the band's end to ROAD_FROM, each born under the band and shrunk to nothing at ROAD_FROM.
    // THE PANS: fields of square-cut pans in tidy rows on the plain round the mast, PANS: [x, z of the field's middle, pans
    // along, pans across, heading in degrees]; a pan PAN_LEN by PAN_WIDE m, in three inks by turn; one that would lie on a
    // body, a sheet or the channel is not cut. THE MIDDLE POOLS: MID_POOLS sheets more, by a fixed hand, between MID_FROM
    // and MID_TO m out.
    let poseBars;
    {
      const RIM = [16, 9], RIM_GROW = 1 / 1500, CH_STEP = 30, CH_STEP_GROW = 0.035;
      const ROAD_FROM = 540, ROAD_SOLID = 1700, ROAD_HALF = 30, ROAD_WIDEN = 0.012, ROAD_HEART = 0.42, BARS = 26, BAR_T = 120, BAR_THICK = [7, 24], BAR_WIDE = [0.5, 1.1];
      const PANS = [[330, 600, 4, 5, 8], [500, -620, 5, 4, -12], [1080, 700, 5, 5, 20], [-560, -1210, 6, 3, 5], [-640, 1010, 6, 3, -8], [1150, -940, 5, 4, 15], [-118, -520, 2, 4, 0], [360, 1150, 5, 4, -6], [-420, 1480, 6, 4, 10], [330, 1700, 5, 4, 0], [430, 200, 5, 4, -10], [420, -1300, 5, 4, 8], [860, 190, 3, 4, -10]];
      const PAN_LEN = 64, PAN_WIDE = 40, PAN_GAP = 10, MID_POOLS = 46, MID_FROM = 430, MID_TO = 1700;
      const b = S.batch(), one = (c) => ({ lit: c, shade: c }), warmInk = P.ring2.clone().lerp(P.bands[4], 0.6);
      const warm = one(warmInk), heart = one(P.ring1), deep = one(P.bands[0]);
      const rim = one(P.plates[0]), jointInk = one(P.joint), hand = makeRng(480121);
      const oval = (x, z, a, c, ch, sh, k0, ink, w) => {             // an 18-sided sheet, a m by c m (half sizes), shaken by k0, shrunk to w
        const p1 = hash2(k0, 7) * 6.28, p2 = hash2(k0, 19) * 6.28, pt = (k) => { const t = (k / 18) * Math.PI * 2, r = (1 + 0.1 * Math.sin(2 * t + p1) + 0.06 * Math.sin(3 * t + p2)) * w, u = Math.cos(t) * a * r, v = Math.sin(t) * c * r; return [x + u * ch + v * sh, z - u * sh + v * ch]; };
        for (let k = 0; k < 18; k++) { const A = pt(k), B = pt(k + 1); b.tri(x, 0, z, B[0], 0, B[1], A[0], 0, A[1], ink); }
      };
      // a place d metres out along the channel's line and v metres to its right (south)
      const chAt = (d, v) => [d * chC + v * chS, 0, -d * chS + v * chC];
      const ST = [];                                                 // the stations' metres out
      for (let d = CH_FROM; d < CH_TO; d += CH_STEP + CH_STEP_GROW * (d - CH_FROM)) ST.push(d);
      ST.push(CH_TO);
      // the outline, from the far end of the south bank round the head to the far end of the north bank, and each point's
      // outward direction (square to the line through its two neighbours)
      const OL = [];
      for (let k = ST.length - 1; k > 0; k--) OL.push([ST[k], chHalf(Math.min(ST[k], CH_TO - 1), 1)]);
      OL.push([CH_FROM, 0]);
      for (let k = 1; k < ST.length; k++) OL.push([ST[k], -chHalf(Math.min(ST[k], CH_TO - 1), -1)]);
      const NRM = OL.map((p, i) => { const A = OL[Math.max(0, i - 1)], B = OL[Math.min(OL.length - 1, i + 1)], dd = B[0] - A[0], dv = B[1] - A[1], l = Math.hypot(dd, dv) || 1; return [dv / l, -dd / l]; });
      const nSt = ST.length - 1;
      for (const [grow, ink] of [[RIM[0], jointInk], [RIM[1], rim], [0, deep]]) {
        const pt = (i) => { const g = grow * (1 + OL[i][0] * RIM_GROW); return chAt(OL[i][0] + NRM[i][0] * g, OL[i][1] + NRM[i][1] * g); };
        for (let k = 0; k < nSt; k++) b.quad(pt(nSt - k), pt(nSt - k - 1), pt(nSt + k + 1), pt(nSt + k), ink);      // from the head outward, bank to bank
      }
      await ctx.yield();
      const roadHalf = (d) => ROAD_HALF + ROAD_WIDEN * d;
      for (const [share, ink] of [[1, warm], [ROAD_HEART, heart]]) {
        let prev = null;
        for (let k = 0; k < ST.length; k++) {
          const d = ST[k];
          if (d < ROAD_SOLID) continue;
          const w = roadHalf(d) * share, cur = [d, w * (0.82 + 0.36 * hash2(k, 41)), w * (0.82 + 0.36 * hash2(k, 43))];
          if (prev) b.quad(chAt(prev[0], prev[1]), chAt(prev[0], -prev[2]), chAt(cur[0], -cur[2]), chAt(cur[0], cur[1]), ink);
          prev = cur;
        }
      }
      await ctx.yield();
      const panInks = [one(P.brine), one(P.bands[4].clone().lerp(P.plates[0], 0.45)), one(P.joint.clone().lerp(P.plates[0], 0.35))];
      PANS.forEach(([fx, fz, nu, nv, head], f) => {
        const c = Math.cos(head * DEG), s = Math.sin(head * DEG);
        for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
          const u = (i - (nu - 1) / 2) * (PAN_LEN + PAN_GAP), v = (j - (nv - 1) / 2) * (PAN_WIDE + PAN_GAP), x = fx + u * c + v * s, z = fz - u * s + v * c;
          if (onBody(x, z, 45)) continue;
          for (const [grow, ink] of [[2.6, jointInk], [1.3, rim], [-1.2, panInks[(i + 2 * j + f) % 3]]]) {
            const a = PAN_LEN / 2 + grow, w = PAN_WIDE / 2 + grow, q = [[-a, -w], [-a, w], [a, w], [a, -w]].map(([pu, pv]) => [x + pu * c + pv * s, 0, z - pu * s + pv * c]);
            b.quad(q[0], q[1], q[2], q[3], ink);
          }
          keepOff.push([x - PAN_LEN / 2 - 4, x + PAN_LEN / 2 + 4, z - PAN_LEN / 2 - 4, z + PAN_LEN / 2 + 4]);
        }
      });
      await ctx.yield();
      for (let k = 0, n = Math.round(MID_POOLS * detail); k < MID_POOLS; k++) {
        const an = hand.range(0, 6.283), d = hand.range(MID_FROM, MID_TO), a = hand.range(30, 62) * (0.7 + d / 1500), c = a * hand.range(0.3, 0.46), x = Math.cos(an) * d, z = Math.sin(an) * d, head = hand.range(-0.7, 0.7);
        if (k >= n || onBody(x, z, a + 6) || laneDist(x, z, LEN) < a + 40) continue;
        const hc = Math.cos(head), hs = Math.sin(head);
        oval(x, z, a + 1.2, c + 1.2, hc, hs, k + 90, jointInk, 1); oval(x, z, a, c, hc, hs, k + 90, rim, 1); oval(x, z, a, c, hc, hs, k + 90, panInks[0], 1 - 2.6 / c);
        keepOff.push([x - a, x + a, z - a * 0.6, z + a * 0.6]);
      }
      const pans = S.mesh(b, S.materials.inkFloor); pans.renderOrder = ORD.brine + 0.01; pans.frustumCulled = false; scene.add(pans);
      // the bars: one lozenge, a unit long each way, in the warm ink with its pale heart, set out by its matrix (along the
      // road, across it)
      const gb = S.batch(), LOZ = [[0, -1], [1, -0.35], [1, 0.35], [0, 1], [-1, 0.35], [-1, -0.35]];
      for (const [w, ink] of [[1, warm], [ROAD_HEART, heart]]) for (let k = 0; k < 6; k++) { const A = LOZ[k], B = LOZ[(k + 1) % 6]; gb.tri(0, 0, 0, B[0] * w, 0, B[1] * w, A[0] * w, 0, A[1] * w, ink); }
      const bars = new THREE.InstancedMesh(gb.geometry(), S.materials.inkFloor, BARS), GM = new THREE.Matrix4();
      bars.frustumCulled = false; bars.renderOrder = ORD.brine + 0.02; bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(bars);
      const born = ST.find((d) => d >= ROAD_SOLID) + 40;              // under the band's near end
      poseBars = (time) => {
        for (let k = 0; k < BARS; k++) {
          const ph = (time / BAR_T + (k + 0.6 * hash2(k, 31)) / BARS) % 1, d = born - ph * (born - ROAD_FROM), e = smooth(0, 0.1, 1 - ph) * smooth(0, 0.05, ph);
          const t = ((BAR_THICK[0] + (BAR_THICK[1] - BAR_THICK[0]) * hash2(k, 53)) / 2) * e, wd = roadHalf(d) * (BAR_WIDE[0] + (BAR_WIDE[1] - BAR_WIDE[0]) * hash2(k, 59)) * e;
          GM.set(t * chC, 0, wd * chS, d * chC, 0, 1, 0, 0, -t * chS, 0, wd * chC, -d * chS, 0, 0, 0, 1);
          bars.setMatrixAt(k, GM);
        }
        bars.instanceMatrix.needsUpdate = true;
      };
      poseBars(0);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the crust: many-sided cells whose edges are ridges
    // Every cell's ridges are built within CRUST m of the floor under the route's first CRUST_S metres and within DISC m of
    // the origin (the floor the climb looks down on). Further out the cells GROW: in each of the bands GROW (metres beyond
    // that floor) the cells are joined 2 by 2, then 4 by 4, then 8 by 8 into greater cells and only the ridges between two of
    // those are built, each ridge broader by the share BROADER and higher by the share HIGHER for every doubling (so a line of
    // the school's floor, which lies in those bands, is 2.4 m and more across and prints as a line from the climb); beyond the
    // last band there is none.
    // Each ridge is two flat faces (lit and shade by the sun) and, as its shadow, its own crest wall laid on the floor by the
    // shadow matrix.
    {
      const CRUST = 80, CRUST_S = 1120, DISC = 390, A = 13, Wd = Math.sqrt(3) * A, HW = 0.62, H = 0.62, GROW = [130, 380, 770], BROADER = 0.95, HIGHER = 0.5;
      const b = S.batch(), sb = S.batch(true), corner = [0, 0], OUT = GROW[GROW.length - 1];
      const cornerAt = (cx, cz, k) => {
        const an = (30 + 60 * k) * DEG, x = cx + A * Math.cos(an), z = cz + A * Math.sin(an), kx = Math.round(x / (Wd / 2)), kz = Math.round(z / (A / 2));
        corner[0] = x + (hash2(kx, kz) - 0.5) * A * 0.62; corner[1] = z + (hash2(kz + 57, kx - 13) - 0.5) * A * 0.62; return corner;
      };
      // the greater cell a cell belongs to after n doublings (each row of greater cells is shifted along by its own fixed share)
      const greater = (i, j, n) => { const m = 1 << n, gj = Math.floor(j / m); return Math.floor((i + Math.floor(hash2(gj, n) * m)) / m) * 4096 + gj; };
      let n = 0;
      const done = new Set();
      for (let j = -Math.ceil((DISC + OUT + A) / (1.5 * A)); j <= Math.ceil((LANE_Z0 + CRUST + OUT + A) / (1.5 * A)); j++) {
        for (let i = Math.floor((LANE_X0 - CRUST - OUT - A) / Wd); i <= Math.ceil((DISC + OUT + A) / Wd); i++) {
          const cx = (i + (j & 1) * 0.5) * Wd, cz = j * 1.5 * A;
          if (++n % 600 === 0) await ctx.yield();
          if (Math.hypot(cx, cz) > DISC + OUT + 2 * A && laneDist(cx, cz, CRUST_S) > CRUST + OUT + 2 * A) continue;
          for (let k = 0; k < 6; k++) {                              // a ridge two cells share is built once
            const p = cornerAt(cx, cz, k), ax = p[0], az = p[1], q = cornerAt(cx, cz, k + 1), bx = q[0], bz = q[1];
            const key = Math.round(ax + bx) * 8192 + Math.round(az + bz);
            if (done.has(key)) continue;
            done.add(key);
            const mx = (ax + bx) / 2, mz = (az + bz) / 2, out = Math.min(Math.hypot(mx, mz) - DISC, laneDist(mx, mz, CRUST_S) - CRUST);
            let grown = 0;
            while (grown < GROW.length && out > (grown ? GROW[grown - 1] : 0)) grown++;
            if (out > OUT) continue;
            if (grown) {                                             // the cell on the ridge's other side
              const an = (60 + 60 * k) * DEG, j2 = Math.round((cz + Wd * Math.sin(an)) / (1.5 * A)), i2 = Math.round((cx + Wd * Math.cos(an)) / Wd - (j2 & 1) * 0.5);
              if (greater(i, j, grown) === greater(i2, j2, grown)) continue;
            }
            if (onBody(mx, mz, 2) || onBody(ax, az, 1) || onBody(bx, bz, 1)) continue;
            const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, hw = HW * (1 + BROADER * grown), h = H * (1 + HIGHER * grown), nx = -dz / l * hw, nz = dx / l * hw;
            const ex = (dx / l) * 0.5, ez = (dz / l) * 0.5, tA = [ax + ex, h, az + ez], tB = [bx - ex, h, bz - ez];
            b.quad([ax + nx, 0, az + nz], [bx + nx, 0, bz + nz], tB, tA, I.salt);
            b.quad([bx - nx, 0, bz - nz], [ax - nx, 0, az - nz], tA, tB, I.salt);
            sb.quad([ax, 0, az], [bx, 0, bz], tB, tA, null);
          }
        }
      }
      await ctx.yield();
      const crust = S.mesh(await b.geometryIn(ctx)); crust.renderOrder = ORD.crust; crust.frustumCulled = false;
      const crustShadow = S.shadowOf(sb);
      scene.add(crustShadow, crust);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the school: every learner, in two inks' sets
    // Each set: tracks (fixed), carts, poles and dust puffs (posed by the clock), and the three shadow proxies,
    // each proxy drawn with its body's own instance matrices.
    const lie = lieAngle(), tipReach = LEARNER.L * Math.sin(lie);
    const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), pose = {};
    const sets = [];
    for (const paleSet of [false, true]) {
      const list = learners.filter((q) => q.pale === paleSet), n = list.length;
      if (!n) continue;
      const parts = buildLearnerParts(S, paleSet ? { pale: 0.45, low: true } : {});
      await ctx.yield();
      const body = (g, dyn) => { const m = new THREE.InstancedMesh(g, S.materials.ink, n); m.frustumCulled = false; m.renderOrder = ORD.body; if (dyn) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return m; };
      const cast = (g, of) => { const m = new THREE.InstancedMesh(g, S.materials.shadow, n); m.instanceMatrix = of.instanceMatrix; m.frustumCulled = false; m.renderOrder = ORD.shadow; return m; };
      const tracks = body(parts.track, false), carts = body(parts.cart, true), poles = body(parts.pole, true), dust = body(parts.dust, true);
      const set = { list, carts, poles, dust };
      list.forEach((q, k) => { q.k = k; M.makeTranslation(q.x, 0, q.z); tracks.setMatrixAt(k, M); });
      scene.add(cast(parts.trackProxy, tracks), cast(parts.cartProxy, carts), cast(parts.poleProxy, poles), tracks, carts, poles, dust);
      sets.push(set);
      await ctx.yield();
    }
    // one learner's cart, pole and dust puff from its angle, its cart's place along its track and its dust's age
    // THE PUFF is born at nothing where the ball strikes, swells and subsides to nothing again, by its age alone (0..1 of its
    // LEARNER.dust seconds): its height is up by PUFF_UP of its life and sinks away from PUFF_SINK on; its spread eases out to
    // PUFF_R m by PUFF_OUT of its life and draws back to nought by its end. It never stands wider than PUFF_R or higher than built.
    const PUFF_R = 26, PUFF_UP = 0.125, PUFF_SINK = 0.4, PUFF_OUT = 0.5;
    const setLearner = (set, q, angle, cz, dustAge, side) => {
      M.makeTranslation(q.x, 0, q.z + cz); set.carts.setMatrixAt(q.k, M);
      M.makeRotationX(angle).setPosition(q.x, LEARNER.hingeY, q.z + cz); set.poles.setMatrixAt(q.k, M);
      const left = 1 - Math.min(1, dustAge / PUFF_OUT), grown = 1 - left * left * left;
      const r = dustAge > 0 ? PUFF_R * grown * (1 - smooth(PUFF_OUT, 1, dustAge)) : 0;
      const h = dustAge > 0 ? smooth(0, PUFF_UP, dustAge) * (1 - smooth(PUFF_SINK, 1, dustAge)) : 0;
      M.makeScale(r, h, r).setPosition(q.x, 0, q.z + cz + side * tipReach); set.dust.setMatrixAt(q.k, M);
    };
    const poseSchool = (time, all) => {
      for (const set of sets) {
        for (const q of set.list) {
          if (q.runs) { learnerPose(time, q.offset, pose, q.ends); setLearner(set, q, pose.angle, pose.cart, pose.dust, pose.side); }
          else if (all) setLearner(set, q, q.side * lie, q.side * LEARNER.reach, 0, q.side);
        }
        set.carts.instanceMatrix.needsUpdate = true; set.poles.instanceMatrix.needsUpdate = true; set.dust.instanceMatrix.needsUpdate = true;
      }
    };
    poseSchool(0, true);
    await ctx.yield();

    // ------------------------------------------------------------ the sisters, far out, in paler inks by place
    const SIS_BALL = 484, sisLie = Math.PI / 2 + Math.asin((HINGE_Y - 7) / SIS_BALL);      // a fallen mast rests on its ball
    const sisters = SISTERS.map(([bear, d, head, phase, fallen]) => ({ x: d * Math.cos(bear * DEG), z: -d * Math.sin(bear * DEG), d, head: head * DEG, phase, fallen }));
    const sisSets = [];
    for (const far of [false, true]) {
      const list = sisters.filter((q) => (q.d > 1600) === far), n = list.length;
      if (!n) continue;
      const parts = buildSisterParts(S, { pale: far ? 0.65 : 0.45 });
      await ctx.yield();
      const body = (g, dyn) => { const m = new THREE.InstancedMesh(g, S.materials.ink, n); m.frustumCulled = false; m.renderOrder = ORD.body; if (dyn) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return m; };
      const cast = (g, of) => { const m = new THREE.InstancedMesh(g, S.materials.shadow, n); m.instanceMatrix = of.instanceMatrix; m.frustumCulled = false; m.renderOrder = ORD.shadow; return m; };
      const tracks = body(parts.track, false), carts = body(parts.cart, true), masts = body(parts.mast, true);
      list.forEach((q, k) => { q.k = k; q.base = new THREE.Matrix4().makeRotationY(q.head).setPosition(q.x, 0, q.z); tracks.setMatrixAt(k, q.base); });
      scene.add(cast(parts.trackProxy, tracks), cast(parts.cartProxy, carts), cast(parts.mastProxy, masts), tracks, carts, masts);
      sisSets.push({ list, carts, masts });
      await ctx.yield();
    }
    const sp = {};
    const setSister = (set, q, a, c) => {
      M.makeTranslation(0, 0, c); M.premultiply(q.base); set.carts.setMatrixAt(q.k, M);
      M.makeRotationX(a).setPosition(0, HINGE_Y, c); M.premultiply(q.base); set.masts.setMatrixAt(q.k, M);
    };
    const poseSisters = (time, all) => {
      for (const set of sisSets) {
        for (const q of set.list) {
          if (!q.fallen) { sisterPose(time, q.phase, MAST_L, sp); setSister(set, q, sp.lean, sp.cart); }
          else if (all) setSister(set, q, q.fallen * sisLie, -q.fallen * 40);
        }
        set.carts.instanceMatrix.needsUpdate = true; set.masts.instanceMatrix.needsUpdate = true;
      }
    };
    poseSisters(0, true);
    await ctx.yield();

    // ------------------------------------------------------------ the two tidy yards beyond the buffer stops
    // v is metres outward from the yard's inner edge (z = e * (150 + v)); nothing here stands over 10 m.
    {
      const b = S.batch(), sb = S.batch(true), dark = { lit: I.iron.shade, shade: I.iron.shade };
      const person = (x, z, yaw, top) => {                         // a still figure about 1.8 m tall
        const keep = b.m; b.m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
        b.box(-0.14, 0.45, 0, 0.2, 0.9, 0.24, I.iron); b.box(0.14, 0.45, 0, 0.2, 0.9, 0.24, I.iron);
        b.box(0, 1.2, 0, 0.56, 0.62, 0.3, top); b.box(0, 1.66, 0, 0.24, 0.26, 0.24, I.timber);
        b.bar(-0.33, 1.45, 0, -0.38, 0.9, 0.2, 0.14, top); b.bar(0.33, 1.45, 0, 0.5, 1.1, 0.3, 0.14, top);
        b.m = keep; sb.box(x, 0.9, z, 0.6, 1.8, 0.4, null);
      };
      for (const e of [1, -1]) {
        const Z = (v) => e * (150 + v);
        // spare mast sections: lattice boxes 22 m long in three exact rows of five, on timbers
        for (let row = 0; row < 3; row++) for (let c = 0; c < 5; c++) {
          const x = (c - 2) * 26, z = Z(13 + row * 15), ink = (row + c) % 2 ? I.bone : I.red, h = 3.1, y0 = 0.7 + h, t = 0.95, core = { lit: ink.shade, shade: ink.shade };
          b.box(x, y0, z, 21, 2 * h - 1.2, 2 * h - 1.2, core); sb.box(x, y0, z, 22, 2 * h, 2 * h, null);      // a section's boarded core, and its shadow as one block
          for (const tx of [-8, 8]) { b.box(x + tx, 0.35, z, 0.9, 0.7, 9, I.timber); sb.box(x + tx, 0.35, z, 0.9, 0.7, 9, null); }
          for (const sy of [-1, 1]) for (const sz of [-1, 1]) b.bar(x - 11, y0 + sy * h, z + sz * h, x + 11, y0 + sy * h, z + sz * h, t, ink);
          for (let k = 0; k <= 2; k++) {
            const rx = x - 11 + k * 11;
            for (const s of [-1, 1]) { b.bar(rx, y0 - h, z + s * h, rx, y0 + h, z + s * h, t * 0.8, ink); b.bar(rx, y0 + s * h, z - h, rx, y0 + s * h, z + h, t * 0.8, ink); }
            if (k < 2) for (const s of [-1, 1]) {
              b.bar(rx, y0 - h, z + s * h, rx + 11, y0 + h, z + s * h, t * 0.7, ink); b.bar(rx, y0 + h, z + s * h, rx + 11, y0 - h, z + s * h, t * 0.7, ink);
              b.bar(rx, y0 + s * h, z - h, rx + 11, y0 + s * h, z + h, t * 0.7, ink); b.bar(rx, y0 + s * h, z + h, rx + 11, y0 + s * h, z - h, t * 0.7, ink);
            }
          }
        }
        await ctx.yield();
        // learners' broken poles in exact piles by length, the piles growing smaller across the yard
        for (let p = 0; p < 6; p++) {
          const len = 42 - p * 6.4, x0 = e * (-62 + p * 24.5), rows = 6 - p, w = 1.5;
          for (let lv = 0, k = rows; k > 0 && lv < 4; lv++, k--) for (let q = 0; q < k; q++) {
            const x = x0 + (q - (k - 1) / 2) * (w + 0.5), y = 0.5 + w / 2 + lv * w, zc = Z(58 + len / 2);
            b.box(x, y, zc, w, w, len, I.timber); b.box(x, y, Z(58) + e * 0.02, w * 0.7, w * 0.7, 0.3, dark);
            b.box(x, y, Z(58 + len * 0.42), w + 0.12, w + 0.12, 0.8, I.brass);
          }
          sb.box(x0, 0.5 + Math.min(4, rows) * w * 0.5, Z(58 + len / 2), rows * (w + 0.5), Math.min(4, rows) * w, len, null);
          for (const dv of [4, len - 4]) b.box(x0, 0.25, Z(58 + dv), rows * (w + 0.5) + 2, 0.5, 0.9, I.iron);
        }
        // two low sheds with flat roofs, a row of spare wheels, a crane on rails with its jib down
        for (const sx of [-48, 30]) {
          const x = e * sx, z = Z(106);
          b.box(x, 2.6, z, 26, 5.2, 9, I.bone); b.box(x, 5.5, z, 27.4, 0.6, 10.4, I.red); sb.box(x, 2.9, z, 27.4, 5.8, 10.4, null);
          for (let k = -2; k <= 2; k++) { b.box(x + k * 5, 2.2, z - 4.55, 2.4, 3.4, 0.2, dark); b.box(x + k * 5, 2.2, z + 4.55, 2.4, 3.4, 0.2, dark); }
        }
        for (let k = 0; k < 9; k++) {
          const x = e * (-70 + k * 4.2), z = Z(88);
          b.cyl(x, 3, z, 'x', 3, 3, 0.9, 14, I.brass, true, I.iron); b.cyl(x, 3, z, 'x', 0.8, 0.8, 1.5, 8, I.iron); sb.box(x, 3, z, 0.9, 6, 5.2, null);
        }
        for (const dz of [-3, 3]) b.box(e * 22, 0.3, Z(48) + dz, 96, 0.6, 0.6, I.iron);
        const cx = e * 44, cz = Z(48);
        b.box(cx, 1.6, cz, 9, 1.6, 8, I.iron); b.box(cx, 5.2, cz, 6, 5.6, 6, I.iron); b.box(cx, 8.2, cz, 6.8, 0.5, 6.8, I.brass);
        for (const s of [-1, 1]) { b.bar(cx - e * 3, 6.6, cz + s * 1.3, cx - e * 37, 8.6, cz + s * 0.5, 0.7, I.red); sb.bar(cx - e * 3, 6.6, cz + s * 1.3, cx - e * 37, 8.6, cz + s * 0.5, 0.7, null); }
        for (let k = 0; k < 8; k++) b.bar(cx - e * (3 + k * 4.25), 6.6 + k * 0.25, cz + (k % 2 ? 1.2 : -1.2), cx - e * (7.25 + k * 4.25), 6.85 + k * 0.25, cz + (k % 2 ? -1.1 : 1.1), 0.4, I.red);
        b.box(cx - e * 37, 6.4, cz, 1.2, 3.4, 1.2, I.iron); b.box(cx - e * 37, 4.3, cz, 2.2, 1, 2.2, I.brass);
        for (const wx of [-3, 3]) for (const dz of [-3, 3]) b.cyl(cx + wx, 1.2, cz + dz, 'z', 1, 1, 0.8, 10, I.brass);
        sb.box(cx, 4.2, cz, 7, 8.4, 7, null);
        person(e * 8, Z(52), 0.6, I.bone); person(e * 10.5, Z(53.2), 2.4, I.red); person(e * -30, Z(98), -1.2, I.salt); person(e * -27, Z(99), 1.9, I.brass); person(e * 58, Z(8), 0.2, I.bone);
        await ctx.yield();
      }
      const yards = S.mesh(b), yardShadow = S.shadowOf(sb);
      yards.frustumCulled = false; scene.add(yardShadow, yards);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the working line: the great track laid on to north and south
    // Beyond each yard the same bed runs on dead straight from LINE_FROM to LINE_TO m from the origin: a pale bed, dark flat
    // bands of sleepers across it (LINE_BAND m to a band and a gap; the dark share of each grows from a half at LINE_FROM to
    // the whole at LINE_SOLID, and from there the bed is one dark band), and two rails. Beyond LINE_PALE m it is built in the
    // paler inks of far things and LINE_FAR_WIDE times as broad. Beside it stand the things of a working line, in ranks square to it: north-east spare mast
    // sections lying side by side (SECTION_RANKS: [the rank's place eastward, metres out to its first section, sections]),
    // south-east a siding with a row of wagons behind a tractor, south-west a field of salt heaps and, further out, a row of
    // four heaps every HEAP_EVERY m along the line from HEAP_FROM to HEAP_TO m, with a long shed across the line from each row.
    {
      const b = S.batch(), sb = S.batch(true), dark = { lit: I.iron.shade, shade: I.iron.shade };
      // the inks of a thing d metres out along the line: the paler inks of far things beyond LINE_PALE, as the bed's
      const IP = { red: S.pale(I.red, 0.45), bone: S.pale(I.bone, 0.45), salt: S.pale(I.salt, 0.45), timber: S.pale(I.timber, 0.45), dark: S.pale(dark, 0.45) }, IN = { red: I.red, bone: I.bone, salt: I.salt, timber: I.timber, dark };
      const inksAt = (d) => (d > LINE_PALE ? IP : IN);
      for (const e of [1, -1]) {
        for (const [d0, d1, f] of [[LINE_FROM, LINE_PALE, 0], [LINE_PALE, LINE_TO, 0.45]]) {
          const K = (k) => (f ? S.pale(k, f) : k), zc = e * (d0 + d1) / 2, len = d1 - d0;
          const wide = f ? LINE_FAR_WIDE : 1;                         // the far bed is laid broader
          b.slab([[-15.5 * wide, 0], [15.5 * wide, 0], [13.4 * wide, 2], [-13.4 * wide, 2]], 'xy', Math.min(e * d0, e * d1), Math.max(e * d0, e * d1), K(I.salt));
          for (const s of [-1, 1]) { b.box(s * 12.5 * wide, 2.795, zc, 0.9, 0.59, len, K(I.iron)); b.box(s * 12.5 * wide, 3.15, zc, 1.5 * wide, 0.12, len, K(I.bone)); }   // each rail ends under its crown's underside
          sb.box(0, 1, zc, 28 * wide, 2, len, null);
          if (f) b.box(0, 2.25, e * (Math.max(d0, LINE_SOLID) + d1) / 2, 23 * wide, 0.5, d1 - Math.max(d0, LINE_SOLID), K(I.iron));
        }
        for (let d = LINE_FROM; d < LINE_SOLID; d += LINE_BAND) {
          const share = 0.5 + 0.5 * (d - LINE_FROM) / (LINE_SOLID - LINE_FROM);
          const len = Math.min(LINE_BAND * share, LINE_SOLID - d);     // the last band ends where the solid bed begins
          b.box(0, 2.25, e * (d + len / 2), 23, 0.5, len, I.iron);
        }
        // a stop block across the bed where the line leaves the yard
        b.box(0, 3.6, e * (LINE_FROM + 2), 27, 3.2, 3, I.iron); b.box(0, 5.5, e * (LINE_FROM + 2), 28, 0.7, 3.6, I.red); sb.box(0, 2.9, e * (LINE_FROM + 2), 28, 5.8, 3.6, null);
      }
      await ctx.yield();
      // north-east: spare mast sections, each a boarded core in bands of SECTION_LEN / 4 m with its corner legs, lying east to west
      for (const [rank, out, count] of SECTION_RANKS) for (let k = 0; k < count; k++) {
        const x0 = 44 + rank * (SECTION_LEN + 30), z = -(out + k * SECTION_GAP), h = SECTION_W / 2, y0 = 1 + h, q = SECTION_LEN / 4, J = inksAt(out);
        for (let n = 0; n < 4; n++) {
          const ink = (n + rank) % 2 ? J.bone : J.red, xc = x0 + (n + 0.5) * q;
          b.box(xc, y0, z, q, SECTION_W - 1.6, SECTION_W - 1.6, { lit: ink.shade, shade: ink.shade });
          for (const sy of [-1, 1]) for (const sz of [-1, 1]) b.box(xc, y0 + sy * h, z + sz * h, q, 1.5, 1.5, ink);
          for (const sx of [-1, 1]) { b.box(xc + sx * (q / 2 - 0.6), y0, z - h, 1.2, SECTION_W, 1.2, ink); b.box(xc + sx * (q / 2 - 0.6), y0, z + h, 1.2, SECTION_W, 1.2, ink); b.box(xc + sx * (q / 2 - 0.6), y0 + h, z, 1.2, 1.2, SECTION_W, ink); }
          b.bar(xc - q / 2, y0 + h, z - h, xc + q / 2, y0 + h, z + h, 1, ink); b.bar(xc - q / 2, y0 + h, z + h, xc + q / 2, y0 + h, z - h, 1, ink);
        }
        for (const tx of [8, SECTION_LEN - 8]) b.box(x0 + tx, 0.5, z, 2, 1, SECTION_W + 4, J.timber);
        sb.box(x0 + SECTION_LEN / 2, y0, z, SECTION_LEN, SECTION_W + 1.5, SECTION_W + 1.5, null);
        if (k === SECTION_N - 1) await ctx.yield();                 // after each full rank
      }
      await ctx.yield();
      // south-east: the siding, a narrow bed with its own two rails, a tractor at its north end and a row of wagons behind it
      {
        const z0 = LINE_FROM + 20, len = (WAGONS + 1) * 40 + 30, zc = z0 + len / 2;
        b.slab([[SIDING_X - 8, 0], [SIDING_X + 8, 0], [SIDING_X + 6.5, 1.4], [SIDING_X - 6.5, 1.4]], 'xy', z0, z0 + len, I.salt);
        b.box(SIDING_X, 1.6, zc, 11, 0.4, len - 4, I.iron); sb.box(SIDING_X, 0.7, zc, 16, 1.4, len, null);
        for (const s of [-1, 1]) b.box(SIDING_X + s * 4, 2.05, zc, 0.8, 0.5, len - 4, I.bone);
        for (let k = 0; k <= WAGONS; k++) {
          const z = z0 + 28 + k * 40;
          if (k === 0) {                                             // the tractor: black iron, a brass boiler band and funnel
            b.box(SIDING_X, 6.2, z, 9, 7.6, 26, I.iron); b.box(SIDING_X, 10.6, z + 7, 9.6, 1.6, 10, I.brass); b.cyl(SIDING_X, 12.4, z - 8, 'y', 1.6, 2.1, 4.6, 10, I.brass);
            b.box(SIDING_X, 10.3, z - 2, 6, 0.9, 12, dark); sb.box(SIDING_X, 6.5, z, 9.6, 9, 26, null); sb.box(SIDING_X, 12.4, z - 8, 3.4, 4.6, 3.4, null);
          } else {                                                   // a flat wagon and its load: two mast sections' worth of banded timber
            const ink = k % 2 ? I.red : I.bone;
            b.box(SIDING_X, 3.4, z, 9, 2, 32, I.iron); b.box(SIDING_X, 4.6, z, 9.6, 0.5, 33, I.brass);
            b.box(SIDING_X, 7.4, z - 8, 7.4, 5, 15, ink); b.box(SIDING_X, 7.4, z + 8, 7.4, 5, 15, k % 3 ? I.timber : I.bone);
            sb.box(SIDING_X, 5.2, z, 9.6, 9.6, 33, null);
          }
          for (const dz of [-9, 9]) for (const s of [-1, 1]) b.cyl(SIDING_X + s * 4.7, 2.6, z + dz, 'x', 1.5, 1.5, 0.7, 10, I.brass, true, I.iron);
        }
      }
      // south-west: salt heaps in a rank, each a low cone with its lit and shaded sides and its long shadow
      for (let r = 0; r < HEAP_ROWS; r++) for (let c = 0; c < HEAP_COLS; c++) {
        const x = -52 - c * 46, z = LINE_FROM + 52 + r * 72, rad = 17 - 2 * ((r + c) % 2), hgt = 13 - 2 * ((r + 2 * c) % 3);
        b.cyl(x, hgt / 2, z, 'y', rad, 2.2, hgt, 9, I.salt, true); sb.cyl(x, hgt / 2, z, 'y', rad, 2.2, hgt, 9, null, false);
      }
      for (let d = HEAP_FROM; d < HEAP_TO; d += HEAP_EVERY) for (const x of [-60, -116, -172, -228]) {
        const rad = 20 + 8 * (d / HEAP_TO), hgt = 14 + 7 * (d / HEAP_TO);
        b.cyl(x, hgt / 2, d, 'y', rad, 2.4, hgt, 9, inksAt(d).salt, true); sb.cyl(x, hgt / 2, d, 'y', rad, 2.4, hgt, 9, null, false);
      }
      // and across the line from each row of heaps a long low shed, square to the line: bone walls, a flat red roof
      for (let d = HEAP_FROM; d < HEAP_TO; d += HEAP_EVERY) {
        const len = 64 + 30 * (d / HEAP_TO), wide = 16 + 8 * (d / HEAP_TO), x = 40 + len / 2, J = inksAt(d);
        b.box(x, 4, d, len, 8, wide, J.bone); b.box(x, 8.6, d, len + 3, 1.2, wide + 3, J.red); sb.box(x, 4.6, d, len + 3, 9.2, wide + 3, null);
        for (let k = 1; k < 6; k++) b.box(40 + (k / 6) * len, 3.4, d - wide / 2 - 0.1, 5, 5.2, 0.3, J.dark);
      }
      const line = S.mesh(b), lineShadow = S.shadowOf(sb);
      line.frustumCulled = false; scene.add(lineShadow, line);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the haul road and its trains
    // A graded road runs beside the lane on its north side from HAUL_X0 to HAUL_X1: an eastward lane HAUL_OFF m north of the
    // lane's line and a westward lane 2 HAUL_R m further north, joined by a half round at each end, so the road is one closed
    // loop. On it HAUL_TRAINS trains roll by the clock alone at HAUL_SPEED m/s, evenly spaced round the loop: a black and brass
    // tractor and HAUL_WAGONS flat wagons, HAUL_PITCH m from car to car, each wagon carrying five of the learners' plain timber poles, their red
    // tips forward.
    const haulLen = (HAUL_X1 - HAUL_X0) * laneLen, haulLoop = 2 * haulLen + 2 * Math.PI * HAUL_R, haulTurn = Math.atan2(-LANE_K, 1);
    const haulAt = new THREE.Matrix4().makeRotationY(haulTurn).setPosition(HAUL_X0, 0, laneZ(HAUL_X0) - HAUL_OFF);      // the road's own frame: x along the eastward lane from its west end, z to its right
    // the place q metres round the loop from the eastward lane's west end, in the road's frame: [x, z, the heading's cosine and sine]
    const haulPt = [0, 0, 1, 0];
    const haulOn = (q) => {
      q = ((q % haulLoop) + haulLoop) % haulLoop;
      if (q < haulLen) { haulPt[0] = q; haulPt[1] = 0; haulPt[2] = 1; haulPt[3] = 0; return haulPt; }
      q -= haulLen;
      if (q < Math.PI * HAUL_R) { const a = q / HAUL_R; haulPt[0] = haulLen + Math.sin(a) * HAUL_R; haulPt[1] = -HAUL_R + Math.cos(a) * HAUL_R; haulPt[2] = Math.cos(a); haulPt[3] = -Math.sin(a); return haulPt; }
      q -= Math.PI * HAUL_R;
      if (q < haulLen) { haulPt[0] = haulLen - q; haulPt[1] = -2 * HAUL_R; haulPt[2] = -1; haulPt[3] = 0; return haulPt; }
      const a = (q - haulLen) / HAUL_R; haulPt[0] = -Math.sin(a) * HAUL_R; haulPt[1] = -HAUL_R - Math.cos(a) * HAUL_R; haulPt[2] = -Math.cos(a); haulPt[3] = Math.sin(a); return haulPt;
    };
    let poseTrains;
    {
      const fb = S.batch(), one = (c) => ({ lit: c, shade: c });
      fb.m = haulAt;
      // the road: each lane a flat graded band with a lilac edge each side and two ruts; each half round a fan of the same
      for (const [w, ink] of [[7.5, one(P.joint)], [6.6, one(P.plates[2])]]) {
        for (const z of [0, -2 * HAUL_R]) fb.quad([0, 0, z - w], [0, 0, z + w], [haulLen, 0, z + w], [haulLen, 0, z - w], ink);
        for (const [x, sgn] of [[haulLen, 1], [0, -1]]) for (let k = 0; k < 10; k++) {
          const a0 = (k / 10) * Math.PI, a1 = ((k + 1) / 10) * Math.PI, r0 = Math.max(0, HAUL_R - w), r1 = HAUL_R + w;
          const pt = (a, r) => [x + sgn * Math.sin(a) * r, 0, -HAUL_R + Math.cos(a) * r];
          if (sgn > 0) fb.quad(pt(a0, r0), pt(a0, r1), pt(a1, r1), pt(a1, r0), ink); else fb.quad(pt(a0, r1), pt(a0, r0), pt(a1, r0), pt(a1, r1), ink);
        }
      }
      for (const z0 of [0, -2 * HAUL_R]) for (const z of [-2.3, 2.3]) fb.quad([0, 0, z0 + z - 0.6], [0, 0, z0 + z + 0.6], [haulLen, 0, z0 + z + 0.6], [haulLen, 0, z0 + z - 0.6], one(P.joint));
      const road = S.mesh(fb, S.materials.inkFloor); road.renderOrder = ORD.crust + 0.01; road.frustumCulled = false;
      scene.add(road);
      await ctx.yield();
      // the cars, drawn along x on the road: the tractor, a wagon, and a flat puff of salt dust
      const tb = S.batch(), tsb = S.batch(true), wb = S.batch(), wsb = S.batch(true), pb = S.batch();
      tb.box(0, 3.6, 0, 11, 4.4, 4.6, I.iron); tb.box(-3.2, 6.6, 0, 4.2, 2.4, 4.8, I.iron); tb.box(-3.2, 8, 0, 5, 0.5, 5.4, I.brass);
      tb.cyl(1.6, 4.6, 0, 'x', 2.5, 2.5, 6.2, 10, I.iron, true, I.brass); tb.cyl(3.4, 7.6, 0, 'y', 0.7, 1, 2.6, 8, I.brass); tb.box(5.7, 2.2, 0, 0.6, 1.6, 5.2, I.red);
      for (const x of [-3.6, 0, 3.6]) for (const s of [-1, 1]) tb.cyl(x, 1.6, s * 2.5, 'z', 1.6, 1.6, 0.6, 10, I.brass, true, I.iron);
      tsb.box(0, 3.6, 0, 11.4, 7.2, 5, null);
      wb.box(0, 2.2, 0, 13, 0.9, 4.6, I.iron); wb.box(0, 2.8, 0, 13.4, 0.3, 4.9, I.brass);
      for (const [y, zs] of [[3.6, [-1.4, 0, 1.4]], [4.9, [-0.7, 0.7]]]) for (const z of zs) { wb.box(-1, y, z, 10.8, 1.3, 1.3, I.timber); wb.box(5.4, y, z, 2, 1.34, 1.34, I.red); }      // five poles, red tips forward
      for (const x of [-5.6, 0, 5.6]) for (const z of [-2.2, 2.2]) wb.box(x, 4.4, z, 0.4, 3, 0.4, I.bone);
      for (const x of [-4.2, 4.2]) for (const s of [-1, 1]) wb.cyl(x, 1.2, s * 2.3, 'z', 1.2, 1.2, 0.5, 10, I.brass, true, I.iron);
      wsb.box(0, 3, 0, 13.4, 6, 4.9, null);
      pb.ball(0, 0, 0, 1, I.salt, 4, 7);
      const inst = (g, mat, n, of) => { const m = new THREE.InstancedMesh(g.isBufferGeometry ? g : g.geometry(), mat, n); m.frustumCulled = false; if (of) { m.instanceMatrix = of.instanceMatrix; m.renderOrder = ORD.shadow; } else { m.renderOrder = ORD.body; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); } return m; };
      const tractors = inst(tb, S.materials.ink, HAUL_TRAINS), wagons = inst(wb, S.materials.ink, HAUL_TRAINS * HAUL_WAGONS), puffs = inst(pb, S.materials.ink, HAUL_TRAINS * 3);
      scene.add(inst(tsb, S.materials.shadow, HAUL_TRAINS, tractors), inst(wsb, S.materials.shadow, HAUL_TRAINS * HAUL_WAGONS, wagons), tractors, wagons, puffs);
      const HM = new THREE.Matrix4();
      // the matrix of a thing riding round the loop: q its place, (bx, by, bz) its place in the car's own frame (x forward), (sx, sy, sz) its scale
      const carAt = (q, bx = 0, by = 0, bz = 0, sx = 1, sy = 1, sz = 1) => {
        const p = haulOn(q), c = p[2], n = p[3];
        HM.set(c * sx, 0, -n * sz, p[0] + c * bx - n * bz, 0, sy, 0, by, n * sx, 0, c * sz, p[1] + n * bx + c * bz, 0, 0, 0, 1);
        return HM.premultiply(haulAt);
      };
      poseTrains = (time) => {
        for (let n = 0; n < HAUL_TRAINS; n++) {
          const head = HAUL_SPEED * time + (n / HAUL_TRAINS) * haulLoop;
          tractors.setMatrixAt(n, carAt(head));
          for (let c = 1; c <= HAUL_WAGONS; c++) wagons.setMatrixAt(n * HAUL_WAGONS + c - 1, carAt(head - c * HAUL_PITCH));
          for (let k = 0; k < 3; k++) {                              // dust behind the tractor's wheels, each puff growing and thinning in turn
            const tau = (time * 0.45 + k / 3 + n * 0.21) % 1, sc = (0.8 + 2.2 * tau) * (1 - tau * tau);
            puffs.setMatrixAt(n * 3 + k, carAt(head, -6.5 - 7 * tau, 0.8 + 1.2 * tau, k % 2 ? 2.6 : -2.6, sc * 1.5, sc * 0.5, sc));
          }
        }
        tractors.instanceMatrix.needsUpdate = true; wagons.instanceMatrix.needsUpdate = true; puffs.instanceMatrix.needsUpdate = true;
      };
      poseTrains(0);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the way out: a hoop of two bands round the opening
    // The hoop is RING_DEEP m thick each way. A ribbon flies from its rim at each angle of RIBBON_AT (degrees in the route's
    // last frame, from its right hand upward: its lower right, away from the sun and under the storks' line), each RIBBON_SIDE m out to the right and
    // RIBBON_BACK m back along the route, RIBBON_WIDE m wide at the rim and half that at its forked end, drooping RIBBON_DROOP m
    // and turning over once (RIBBON_TWIST half turns) along its length.
    const END = path.end.clone(), RING_IN = 12.4, RING_MID = 14.6, RING_OUT = 18, RING_DEEP = 1.1;
    const RIBBON_AT = [-12, -40, -70], RIBBON_SIDE = 15, RIBBON_BACK = 5, RIBBON_DROOP = 5, RIBBON_TWIST = 1, RIBBON_WIDE = 4.4;
    const pennantInk = I.brass;
    {
      const b = S.batch(), sb = S.batch(true), f = path.frameAt(1, new THREE.Matrix4());
      b.m = f; sb.m = f;
      const p = (a, r, z) => [Math.cos(a) * r, Math.sin(a) * r, z], D = RING_DEEP;
      for (let k = 0; k < 48; k++) {                               // two flat bands, bone inside red lead
        const a0 = (k / 48) * Math.PI * 2, a1 = ((k + 1) / 48) * Math.PI * 2;
        for (const [r0, r1, ink] of [[RING_IN, RING_MID, I.bone], [RING_MID, RING_OUT, I.red]]) {
          b.quad(p(a0, r0, D), p(a0, r1, D), p(a1, r1, D), p(a1, r0, D), ink);
          b.quad(p(a1, r0, -D), p(a1, r1, -D), p(a0, r1, -D), p(a0, r0, -D), ink);
        }
        b.quad(p(a0, RING_OUT, D), p(a0, RING_OUT, -D), p(a1, RING_OUT, -D), p(a1, RING_OUT, D), I.red);
        b.quad(p(a1, RING_IN, D), p(a1, RING_IN, -D), p(a0, RING_IN, -D), p(a0, RING_IN, D), I.bone);
        sb.quad(p(a0, RING_IN, 0), p(a1, RING_IN, 0), p(a1, RING_OUT, 0), p(a0, RING_OUT, 0), null);
      }
      b.m = null; sb.m = null;
      const wb = S.batch(), ex = new THREE.Vector3(), ey = new THREE.Vector3(), ez = new THREE.Vector3(), o = new THREE.Vector3();
      f.extractBasis(ex, ey, ez);
      const run = Math.hypot(RIBBON_SIDE, RIBBON_BACK), nx = -RIBBON_BACK / run, nz = RIBBON_SIDE / run;      // square to the ribbon's run, level
      RIBBON_AT.forEach((deg, k) => {
        const a = deg * DEG, ca = Math.cos(a), sa = Math.sin(a), N = 16, rr = RING_OUT + 0.3;
        const C = (u, v) => {                                      // u 0..1 along the ribbon, v -1..1 across it
          const w = (RIBBON_WIDE / 2) * (1 - 0.5 * u), tw = u * RIBBON_TWIST * Math.PI, cv = v * w * Math.cos(tw), sv = v * w * Math.sin(tw);
          const X = ca * rr + u * RIBBON_SIDE + sv * nx, Y = sa * rr + cv - u * u * RIBBON_DROOP, Z = D + u * RIBBON_BACK + sv * nz, amp = 1.6 * u;
          o.copy(END).addScaledVector(ex, X).addScaledVector(ey, Y).addScaledVector(ez, Z);
          const wx = nx * amp, wy = 0.3 * amp, wz = nz * amp;
          return [o.x, o.y, o.z, ex.x * wx + ey.x * wy + ez.x * wz, ex.y * wx + ey.y * wy + ez.y * wz, ex.z * wx + ey.z * wy + ez.z * wz, -u * 3.2 + k * 1.9];
        };
        for (let n = 0; n < N; n++) {
          const u0 = n / N, u1 = (n + 1) / N;
          if (n < N - 1) wb.quadW2(C(u0, -1), C(u1, -1), C(u1, 1), C(u0, 1), pennantInk);
          else { wb.quadW2(C(u0, -1), C(u1, -1), C(u0 + 0.02, -0.1), C(u0, 0), pennantInk); wb.quadW2(C(u0, 0), C(u0 + 0.02, 0.1), C(u1, 1), C(u0, 1), pennantInk); }
          sb.quad(C(u0, -1), C(u1, -1), C(u1, 1), C(u0, 1), null);
        }
      });
      const flags = S.mesh(wb, S.materials.inkWave); flags.frustumCulled = false;
      const ring = S.mesh(b); ring.frustumCulled = false; scene.add(S.shadowOf(sb), ring, flags);
    }
    await ctx.yield();

    // ------------------------------------------------------------ clear air: the great machine, the school, the sisters, the
    // yards, the storks, the haul road and the way out against the route; the working line and the brine channel are not
    // tested (by their places neither comes within 120 m of the route in space); the crust is not tested: it lies on the floor under the lane and
    // round the mast, no ridge over 1.6 m high, and the route is never under 36 m.
    // Tested every LEN / NS metres of route: fixed bodies by their boxes, moving ones over the whole clock at a
    // step of 0.25 s (a learner by the round its pole's whole sweep stays in, a sister by the ring hers does).
    const each = {};                                               // the least clear air to each kind of body, in metres
    const take = (d, w) => { if (!(each[w] <= d)) each[w] = d; };
    const boxD = (x, y, z, x0, x1, y0, y1, z0, z1) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1), Math.max(z0 - z, 0, z - z1));
    const flightPts = [], ov = {};                                 // every flight's line, a point every 5 m, with its birds' reach
    for (const F of hero.anchors.storkFlights) for (let q = 0; q < F.length; q += 5) { F.at(q, ov); flightPts.push(ov.x, ov.y, ov.z, F.reach); }
    const reach = LEARNER.L + 2, tLevel = Math.hypot(path.endTangent.x, path.endTangent.z);      // the hoop stands upright, square to the last leg's level heading
    for (let i = 0; i <= NS; i++) {
      const x = RX[i], y = RY[i], z = RZ[i];
      take(boxD(x, y, z, -15.5, 15.5, 0, 3.4, -137, 137), 'the great track');
      take(Math.min(boxD(x, y, z, -13.5, 13.5, 0, 9.7, 125, 134), boxD(x, y, z, -13.5, 13.5, 0, 9.7, -134, -125)), 'a buffer stop');
      take(Math.min(boxD(x, y, z, -78, 78, 0, 10, 148, 268), boxD(x, y, z, -78, 78, 0, 10, -268, -148)), 'a yard');
      for (const q of learners) {
        // a pole's whole sweep: within 92 m of its hinge, which keeps to LEARNER.reach either side of the track's middle
        const sweep = Math.hypot(Math.max(0, Math.abs(z - q.z) - LEARNER.reach), y - LEARNER.hingeY) - reach, dx = Math.max(0, Math.abs(x - q.x) - 3);
        take(sweep > 0 ? Math.hypot(dx, sweep) : dx, 'a learner');
        take(boxD(x, y, z, q.x - 5.4, q.x + 5.4, 0, 8.2, q.z - 46.4, q.z + 42.4), 'a learner');
        take(boxD(x, y, z, q.x - 27, q.x + 27, 0, 2.6, q.z - tipReach - 59, q.z + tipReach + 59), 'a dust puff');
      }
      for (const q of sisters) take(Math.hypot(x - q.x, z - q.z) - (q.fallen ? 540 : 160), 'a sister');
      const rho = Math.hypot(x, z);
      take(Math.hypot(Math.max(0, rho - 33.5, 13.5 - rho), Math.max(0, 507 - y, y - 563)), 'the storks on their rings');
      for (let k = 0; k < flightPts.length; k += 4) take(Math.hypot(x - flightPts[k], y - flightPts[k + 1], z - flightPts[k + 2]) - flightPts[k + 3], 'a wedge of storks');      // the birds keep within reach of their flight's line
      if (x < HAUL_X1 + 30) take(Math.hypot(Math.max(0, Math.abs(z - laneZ(x) + HAUL_OFF + HAUL_R) / laneLen - HAUL_R - 4), Math.max(0, y - 10)), 'the haul road and its trains');
      const ex = x - END.x, ey = y - END.y, ez = z - END.z, along = Math.abs((ex * path.endTangent.x + ez * path.endTangent.z) / tLevel), off = Math.sqrt(Math.max(0, ex * ex + ey * ey + ez * ez - along * along));
      take(Math.hypot(Math.max(0, along - RING_DEEP), Math.max(0, RING_IN - off, off - RING_OUT)), 'the ring of the way out');
      const back = -((ex * path.endTangent.x + ez * path.endTangent.z) / tLevel);      // metres short of the ring along the last leg
      take(Math.hypot(Math.max(0, -back - 2, back - RIBBON_BACK - 4), Math.max(0, RING_OUT - 4 - off)), 'the ribbons of the way out');      // they keep outside the hoop's rim, less their flutter
      if (i % 100 === 0) await ctx.yield();
    }
    const nearMast = [];
    for (let i = 0; i <= NS; i++) if (Math.hypot(RX[i], RZ[i]) < 320) nearMast.push(i);
    for (let step = 0; step < PERIOD * 4; step++) {
      const t = step * 0.25, a = lean(t), c = cart(t), sn = Math.sin(a), cs = Math.cos(a);
      for (const i of nearMast) {
        const x = RX[i], y = RY[i], z = RZ[i];
        const f = Math.min(1, Math.max(0, ((y - HINGE_Y) * cs + (z - c) * sn) / MAST_L)), my = HINGE_Y + f * MAST_L * cs, mz = c + f * MAST_L * sn;
        take(Math.hypot(x, y - my, z - mz) - ((22 - 13 * f) / 2) * Math.SQRT2 - 1, 'the mast');
        for (const g of hero.anchors.galleries) take(Math.hypot(x, y - HINGE_Y - g.s * cs, z - c - g.s * sn) - g.radius - 17, 'a gallery and its pennants');
        take(Math.hypot(x, y - HINGE_Y - hero.anchors.ball.s * cs, z - c - hero.anchors.ball.s * sn) - hero.anchors.ball.radius - 7, 'the ball and its nest');
        take(boxD(x, y, z, -18, 18, 0, 58, c - 52, c + 52), 'the cart and its dust');
      }
      if (step % 16 === 0) await ctx.yield();                       // the page is offered its turn every 16 clock steps (4 s of the clock)
    }
    let least = Infinity, what = '';
    for (const w in each) { each[w] = Math.round(each[w] * 10) / 10; if (each[w] < least) { least = each[w]; what = w; } }
    const clearance = { least, what, each };

    return {
      scene, path, duration, pace, pois, clearance,
      seen: { sCrown, sSwing, covered, south: south.map((q) => ({ hinge: [q.x, LEARNER.hingeY, q.z - LEARNER.reach], a: q.a, b: q.b, offset: q.offset })) },
      camera: { fov: FOV, near: 1, far: 12000, lookAhead: LOOK_FAR, sway: 1, bank: 0 },
      portal: { shape: 'circle', radius: 12, color: '#F4B183', glow: 0, halo: false, frame: 0, veil: '#' + P.bands[5].getHexString(), blendDistance: 25, revealDistance: 260, drawWithin: Math.round(LEN - sEast2) },
      post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      // everything is posed from the clock alone
      update(dt, time) {
        hero.update(dt, time);
        poseSchool(time, false);
        poseSisters(time, false);
        poseTrains(time); poseBars(time);
      },
      dispose() { scene.traverse((o) => { if (o.isInstancedMesh) o.dispose(); }); hero.dispose(); },
    };
  },
};
