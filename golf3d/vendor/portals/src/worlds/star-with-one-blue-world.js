// A Star with One Blue World: black space, one boiling white gold star in its crown of streamers, one blue and
// white globe, and the globe's one small moon of ice.
// We fly at the star with its world a dark bead on its face, swing out wide through the star's wind, see the world
// once as a small half world beside its star, turn before the star's face beside its great arch of fire, come back
// to the world full and blue with its moon beside it, pass low round its day side over seas and storms and across
// its line of dusk, go out beside its shadow along the river of embers to the moon, round the moon's night side,
// and come down into the shadow: the dark world rises over the moon's limb onto its star, a ring of fire that
// closes to a full eclipse as we fly into the night face.
//
// AXES: the world's centre is the origin; the star's centre is (0, 0, -900); +Z is the shadow's axis; +Y is up.
// THE EXIT OPENING is the world's night face: the disc of radius 24 in the plane z = 0, facing +Z. Nothing is built
// in it or before it: the day half of the globe, its air and the night limb (a ring of the night half's own surface)
// stand round it (src/parts/star-with-one-blue-world.js), their skin 0.6 m over the opening's radius, so that the
// opening's own edge lies inside the ball. The ring of light round it is the star behind the world.
// ONE LIGHT: the star. Whatever it does not light is black, but for the copper of the river of embers (the light
// of all the world's dusks, bent round it into the edge of its shadow). Light differs by where a thing stands (in
// the star's light, in the world's shadow, in the shade the world casts on its moon, how far from the star), never
// by the metres flown.
// MEDIA (flown through): the wind's far points, its near dashes, its long streaks and the embers of the shadow's
// edge. Each gives way to the lens as a medium does, by true distance and close to it: no light within 0.8 m of the
// lens, its whole light from 3 m (a dash or a thread: at its nearest point to the lens). Besides, BY PLACE and by
// nothing of the eye: the long streaks keep off the line flown (a thread has no light if any point of it comes within
// STREAK_CLEAR metres of the route in its whole course, and its whole light from STREAK_FULL metres); a near dash or
// an ember has no light while its own place lies within NEAR_CLEAR metres of the line flown and its whole light from
// NEAR_WHOLE metres (THE LANE), and is never broader than THREAD_FINE of its least distance from that line.
// All of them part round the moon.
// THE ONE LAW OF THE EYE (declared; the join sheet's THE EMBERS AND THE BEAD): a streak of the wind or an ember is a
// glowing thread, and the eye gets of it what it sees of its length: nothing of one seen end on. It holds for every
// streak at every place. For the embers the entry's bead does not rest on it: the sleeve has a gap before the bead
// by place. The wind's own dashes between the entry and the bead stand in the star's full light, and are end on there.
// BODIES (passed by): the globe, the star, the moon. No body moves on a course; the moon stands still and turns.
// DECLARED PACING: none. Nothing here follows the metres flown; the eclipse is made by where the line goes.
import * as THREE from 'three';
import { makePath, clamp, smoothstep, bell } from '../kit/core.js';
import { buildHero, buildStar, buildMoon, NOISE_GLSL, BALL_GLSL, SKIN_OVER } from '../parts/star-with-one-blue-world.js';

const R_OPEN = 24;                      // the exit opening's radius: the disc of the world's night face (the join sheet's)
const R_WORLD = R_OPEN + SKIN_OVER;     // the ball as it is built round the opening: its skin stands that far over the opening's radius (the part's rule)
const STAR = [0, 0, -900], R_STAR = 265;
const SPIN_AXIS = [0.643, 0.766, 0];   // the world's axis of spin: the line of dusk passes over the top
const R_MOON = 23, MOON_OFF = 63, MOON_Z = 205;   // the moon of ice: its radius; its centre's distance from the shadow's axis, on the last turn's own side; its z
const DURATION = 50;                     // seconds of the flight
const LOOK_AHEAD = 20;                  // metres of the line ahead that the gaze rests on
const WIND = 18;                       // the wind's speed, metres a second, straight out from the star
// the wind's long streaks keep off the line flown BY PLACE: a thread with any point within STREAK_CLEAR metres of the
// route has no light, and its light is whole from STREAK_FULL metres (a thread's least distance from the route is a
// number of its own place: it lies on one ray from the star for its whole course on the clock)
const STREAK_CLEAR = 6, STREAK_FULL = 12;
// and no long thread stands FAT beside the line: a thread is never broader than THREAD_FINE of its least distance from
// the route (so the nearest the line ever passes is a hair, a seventh of a degree across where it is nearest, and its
// light is less by as much as it is finer); a thread that keeps THREAD_BROAD metres and more from the route is as dealt
const THREAD_FINE = 0.005, THREAD_BROAD = 0.1 / THREAD_FINE;
// THE MEDIUM'S LAW FOR A THREAD (any dash of the wind, near spark, long thread or ember alike): it has no light with
// its nearest point within THREAD_NEAR_NONE metres of the eye and its whole light from THREAD_NEAR_FULL metres: the
// far points' own figures (nearLens). A medium gives way close to the lens and no farther off.
const THREAD_NEAR_NONE = 0.8, THREAD_NEAR_FULL = 3;
// THE LANE ALONG THE LINE FLOWN, for the near dashes and the embers alike (both are flown through, and a thread 0.3 to
// 5.8 m long is no point: beside the lens it would stand as a bar). BY PLACE: a thread has no light while its own
// place lies within NEAR_CLEAR metres of the route (the law of clear air, 2.0 m, kept by place) and its whole light
// from NEAR_WHOLE metres (the distance from which the medium's own law leaves a thread whole). It is a lane that
// stands in the world along the whole route whether anyone flies it or not; the making counts it (laneCount, below).
// LANE_SLACK: the route is counted as straight between its places every 2 m and a thread's course to an eighth of a
// metre; a tenth of a metre covers what lies between. LANE_SEEK: how near a place of the route must stand to a
// thread's course for a pass to be counted at all (a line that comes within NEAR_WHOLE of the course has a place
// within 3.2 m of it). LANE_NEAR, LANE_EMBER: how many passes a near dash and an ember carry each (one with more
// takes the least distance of the others for its whole course).
const NEAR_CLEAR = 2, NEAR_WHOLE = 3, LANE_SLACK = 0.1, LANE_SEEK = NEAR_WHOLE + 0.75, LANE_NEAR = 4, LANE_EMBER = 2;
const LANE_IN = 25.5, LANE_OUT = 44, LANE_Z0 = 22, LANE_Z1 = 230;   // the ember sleeve round the shadow's black core
const LANE_CORE = 27, LANE_RISE = 85, LANE_FULL = 140;   // its brightest distance from the axis; the z by which it is full; the z from which it thins, steadily, to nothing at LANE_Z1
const LANE_SOFT = 9;   // metres: how broadly the river's strength falls off outward from its core (a bell: no edge)
// THE SLEEVE'S GAP BEFORE THE BEAD: an ember has no light where a straight line from any place of the entry's first
// stretch through it goes on to pass within GAP_CLEAR metres of the ball's skin, and its whole light where that line
// passes GAP_FULL metres and more from the skin (a law of the ember's own place: on the entry's side of the shadow's
// axis it takes the sleeve's inner 8 m at z 230 and less toward the world, within about 50 degrees of that side)
const GAP_CLEAR = 1.5, GAP_FULL = 5;
// the great arch of fire (placed in the part by the star's own geometry and by the route): its height, as a share of
// the star's radius (least and most, by the seed: taller than the star's radius, so that it is great); how near the
// route its top reaches (least and most metres, by the seed: its lean is found from that); and the clear air that
// every strand of it keeps from the whole route at any breath or sway (metres: one breadth of its own rope)
const GREAT = { height: [1.1, 1.25], reach: [120, 180], clear: 40 };
const PART_BOW = 2.2, PART_WAKE = 4;   // where the wind begins to part before the moon and where it has closed behind it, in moon radii
// how far from the line through the moon's middle along the wind the parting reaches, in metres: as far as the edge of
// the shadow's black core where the parting begins (the wind's line through the moon stands MOON_OFF from the axis
// at the moon and nearer by the star's distance upwind), so that the parting carries nothing into the core
const PART_REACH = MOON_OFF * (MOON_Z - STAR[2] - PART_BOW * R_MOON) / (MOON_Z - STAR[2]) - LANE_IN;

// THE ROUTE: the brief's knots as written (to the hundredth: at this spacing a knot rounded to the tenth costs a fifth
// of a turn's radius). Entry (40, 0, 400) heading at the star's centre; the first 60 m level on that axis; the last
// TURN.axisZ metres straight and level down the shadow's axis to the centre of the night face.
const KNOTS = [
  [40, 0, 400], [39.08, 0, 370.01], [38.15, 0, 340.03],
  // the right turn (radius 110) and out along the wide left (radius 250), rising to y 8
  [37.77, 0, 326.28], [37.79, 0, 312.54], [38.94, 0, 298.84], [41.7, 0.12, 285.38], [46.12, 0.63, 272.37], [52.12, 1.44, 260.01],
  [59.62, 2.48, 248.49], [68.49, 3.64, 238], [78.6, 4.82, 228.7], [89.69, 5.94, 220.57], [101.36, 6.91, 213.3], [113.84, 7.64, 205.92],
  [131.5, 8, 194.57], [155.92, 8, 175.1], [177.72, 8, 152.74], [196.59, 8, 127.79], [208.72, 8, 107.44], [215.96, 8, 92.73],
  // the firmer left (radius 130) by abeam of the world
  [222.16, 8, 77.72], [227.17, 8, 62.26], [230.48, 8, 46.36], [231.78, 8, 30.18], [231.06, 8, 13.95], [228.38, 8, -2.06],
  [224.25, 8, -17.78], [219.51, 8, -33.48],
  // on toward the star, straight, coming down to y 1
  [212.43, 7.69, -56.62], [201.91, 6.26, -91.04], [191.38, 4.2, -125.47], [180.86, 2.08, -159.9], [176.89, 1.39, -172.86],
  // the far turn (radius 97) as far as its apex, 4 m down, heading -X: from there the line is laid by rule (layTail)
  [173.36, 0.86, -184.43], [169.77, 0.39, -196.09], [165.99, -0.07, -207.58], [161.52, -0.47, -218.87], [155.94, -0.83, -229.66],
  [149.09, -1.24, -239.68], [141.07, -1.7, -248.74], [131.96, -2.17, -256.76], [121.91, -2.64, -263.58], [111.09, -3.07, -269.09],
  [99.72, -3.43, -273.19], [87.87, -3.72, -275.86], [75.79, -3.91, -277.03], [63.65, -4, -276.68],
];

// FROM THE FAR TURN'S END the route is laid by rule (no typed knots): back to the world, once round its day side low
// over seas and weather, across the line of dusk, out beside the shadow to the moon, round the moon's night side and
// down onto the shadow's axis. Each number is a measure of the place.
const PASS = {
  roll: 23.5,      // the pass's plane holds the shadow's axis and leans this far from level about it, as the last turn's plane does: the line leaves over the dusk on the upper left (x under 0)
  from: 15,        // where the line comes onto the ball's own curve: degrees past the place right under the star
  to: 98,         // where it leaves that curve: 90 is the line of dusk
  high: 43.6, cross: 34.5,   // metres from the world's centre: round the day side; over the line of dusk
  sink: 5,        // degrees past the place under the star: from here the line sinks toward the dusk
  join: 46,        // radius of the arc that brings the line onto the curve
};
const TURN = { radius: MOON_OFF, lift: 23.5, axisZ: MOON_Z };   // the last turn: its radius, the tilt of its plane about the shadow's axis, where it meets the axis. It goes round the moon's middle: its centre is the moon's own (the moon's distance from the axis, the moon's z), so the eye keeps MOON_OFF metres from the moon's middle all the way round and the turn ends on the axis. By day the moon is passed abeam, half lit and then waning; behind it the moon hides the whole world, its night face a black disc 2 asin(R_MOON / MOON_OFF), about 43 degrees, broad before the star; the world comes out from behind its limb where the eye is about 12.4 degrees off the shadow's axis (the join sheet's moon ruling as amended on 10-12: by the lower bound by place the hollow is not seen from there)
function layTail() {
  const D = Math.PI / 180, V = (x, y, z) => new THREE.Vector3(x, y, z), Z = V(0, 0, 1), ease = (t) => smoothstep(0, 1, t);
  // the pass round the day side: the ball's own curve in the plane of the shadow's axis and `toDusk`; t is the angle from the place under the star
  const toDusk = V(-Math.cos(PASS.roll * D), Math.sin(PASS.roll * D), 0);
  const radAt = (t) => PASS.high + (PASS.cross - PASS.high) * ease((t - PASS.sink) / (90 - PASS.sink));
  const at = (t) => V().addScaledVector(toDusk, Math.sin(t * D)).addScaledVector(Z, -Math.cos(t * D)).multiplyScalar(radAt(t)), headAt = (t) => at(t + 0.05).sub(at(t - 0.05)).normalize();
  const pts = [], push = (v) => pts.push([v.x, v.y, v.z]);
  // one cubic between two places with their headings; a and b are the lengths of its handles
  const cubic = (p0, t0, p1, t1, a, b, count) => { const c0 = p0.clone().addScaledVector(t0, a), c1 = p1.clone().addScaledVector(t1, -b);
    for (let i = 1; i < count; i++) { const s = i / count, q = 1 - s; push(V(0, 0, 0).addScaledVector(p0, q * q * q).addScaledVector(c0, 3 * q * q * s).addScaledVector(c1, 3 * q * s * s).addScaledVector(p1, s * s * s)); } };
  // back to the world: from the far turn's apex (heading -X) a quarter turn onto the straight that runs along +Z at the
  // world, to the side of it away from the dusk; then one arc of radius `join` that turns the heading from +Z onto the pass
  const joinAt = at(PASS.from), arcCentre = joinAt.clone().addScaledVector(joinAt, PASS.join / radAt(PASS.from));   // the arc ends where the pass begins, on the pass's own heading heading there
  const arcAt = (h) => arcCentre.clone().addScaledVector(toDusk, -PASS.join * Math.sin(h * D)).addScaledVector(Z, PASS.join * Math.cos(h * D));   // h: the heading there, in degrees from `toDusk` toward +Z
  const arcIn = arcAt(90), apex = V(KNOTS[KNOTS.length - 1][0], KNOTS[KNOTS.length - 1][1], KNOTS[KNOTS.length - 1][2]), quarter = apex.x - arcIn.x;
  const straight = arcIn.z - (apex.z + quarter), sinkAt = (way) => apex.y + (arcIn.y - apex.y) * ease(way / (0.5 * Math.PI * quarter + straight));   // the line comes down to the pass's own plane along the quarter turn and the straight
  const nQuarter = Math.max(3, Math.round(0.5 * Math.PI * quarter / 9)), nStraight = Math.max(2, Math.round(straight / 24));
  for (let i = 1; i <= nQuarter; i++) { const a = 0.5 * Math.PI * i / nQuarter; push(V(apex.x - quarter * Math.sin(a), sinkAt(quarter * a), apex.z + quarter * (1 - Math.cos(a)))); }
  for (let i = 1; i < nStraight; i++) push(V(arcIn.x, sinkAt(0.5 * Math.PI * quarter + straight * i / nStraight), apex.z + quarter + straight * i / nStraight));
  const nArc = Math.max(2, Math.round((90 - PASS.from) * D * PASS.join / 9));
  for (let i = 0; i < nArc; i++) push(arcAt(90 + (PASS.from - 90) * i / nArc));
  // round the day side and across the line of dusk: a knot every 9 m
  const count = Math.round((PASS.to - PASS.from) * D * PASS.high / 9);
  for (let i = 0; i <= count; i++) push(at(PASS.from + (PASS.to - PASS.from) * i / count));
  const last = at(PASS.to), lastHead = headAt(PASS.to);
  // out beside the shadow to where the last turn begins, heading +Z; then the half circle in the plane of the shadow's
  // axis and `out`, down onto the axis, heading -Z
  const out = V(-Math.cos(TURN.lift * D), Math.sin(TURN.lift * D), 0), centre = V(0, 0, TURN.axisZ).addScaledVector(out, TURN.radius), begin = V(0, 0, TURN.axisZ).addScaledVector(out, 2 * TURN.radius);
  cubic(last, lastHead, begin, Z, 90, 110, 12);
  const nTurn = Math.round(Math.PI * TURN.radius / 9);
  for (let i = 0; i < nTurn; i++) { const th = Math.PI * i / nTurn; push(centre.clone().addScaledVector(out, TURN.radius * Math.cos(th)).add(V(0, 0, TURN.radius * Math.sin(th)))); }
  // the last straight, level, down the shadow's axis
  for (const z of [TURN.axisZ, 150, 130, 100, 60, 30, 0]) pts.push([0, 0, z]);
  return { pts, centre, begin, out, passAt: at };
}

export default {
  id: 'star-with-one-blue-world',
  name: 'A Star with One Blue World',
  category: 'sky',
  media: ['space'],
  weirdness: 0.5,
  async build(ctx) {
    const { core } = ctx;
    // every stream of this world, in one fixed list, each made from the seed and a name (none draws from a parent).
    // The three bodies take their own inside the part: 'blue-world', 'star' and 'moon'.
    const fork = (name) => core.makeRng(core.hashSeed(name + ':' + ctx.seed));
    const rTemper = fork('temper'), rWeather = fork('weather'), rSuns = fork('far-suns'), rBand = fork('far-band'), rWind = fork('wind'), rNear = fork('near-sparks'), rEmber = fork('embers'), rStreak = fork('wind-streaks'), rBright = fork('bright-suns'), rStream = fork('ember-streams');
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), mood = clamp(vary.mood ?? 0.5, 0, 1);
    // by the seed: the star's temper (the rare one is the vast arch), the world's weather
    const temperDraw = rTemper.pick(['calm', 'restless']), temper = vary.rare ? 'vast' : temperDraw;
    const weather = rWeather.pick(['clear', 'whorls', 'belt']);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#010207');
    // the curve is laid first on the route's first knots alone, in a step of its own, and then whole: so that no one
    // step of the making holds the page long
    await ctx.yield();
    makePath(KNOTS.slice(0, 4));
    await ctx.yield();
    makePath(KNOTS.slice(0, 12));
    await ctx.yield();
    const TAIL = layTail(), ROUTE = KNOTS.concat(TAIL.pts);
    await ctx.yield();
    const path = makePath(ROUTE), L = path.length;
    await ctx.yield();

    // ---- places on the route, found on the built path itself (metres of way from the start)
    const STEP = 0.5, NP = Math.ceil(L / STEP), px = new Float32Array(NP + 1), py = new Float32Array(NP + 1), pz = new Float32Array(NP + 1);
    { const v = new THREE.Vector3(); for (let i = 0; i <= NP; i++) { path.posAtDist(Math.min(L, i * STEP), v); px[i] = v.x; py[i] = v.y; pz[i] = v.z; if (i % 200 === 199) await ctx.yield(); } }
    await ctx.yield();
    // the way at which the route is nearest a place of the world
    const wayOf = (x, y, z) => { let b = Infinity, bi = 0; for (let i = 0; i <= NP; i++) { const d = (px[i] - x) ** 2 + (py[i] - y) ** 2 + (pz[i] - z) ** 2; if (d < b) { b = d; bi = i; } } return Math.min(L, bi * STEP); };
    // the first way after `from` at which a rule of the place turns true
    const wayWhere = (from, test) => { for (let i = Math.ceil(from / STEP); i <= NP; i++) if (test(px[i], py[i], pz[i], i)) return Math.min(L, i * STEP); return L; };
    const offAxis = (x, y, z) => Math.atan2(Math.hypot(x, y), z) * 180 / Math.PI;   // the eye's angle off the shadow's axis, seen from the world's centre
    const W = {
      entryEnd: wayOf(38.15, 0, 340.03),
      zoneIn: wayWhere(0, (x, y, z) => offAxis(x, y, z) > 22),                 // the eye passes 22 degrees off the axis
      zoneOut: wayWhere(0, (x, y, z) => offAxis(x, y, z) > 68),                // and 68 degrees: the half world may be looked at
      farIn: wayOf(180.86, 2.08, -159.9), farApex: wayOf(63.65, -4, -276.68),
      turnIn: wayOf(TAIL.begin.x, TAIL.begin.y, TAIL.begin.z), axis: wayOf(0, 0, TURN.axisZ),
    };
    const height = (x, y, z) => Math.hypot(x, y, z) - R_WORLD;                // over the world's ground
    W.lowIn = wayWhere(W.farApex, (x, y, z) => height(x, y, z) < 20);          // the low pass: within 20 m of the ground
    W.dusk = wayWhere(W.lowIn, (x, y, z, i) => z > 0 && pz[Math.min(NP, i + Math.round(30 / STEP))] > 20);   // the plane of dusk, crossed for good at the low pass's end
    W.lowOut = wayWhere(W.dusk, (x, y, z) => height(x, y, z) > 20);
    W.turnApex = wayWhere(W.turnIn, (x, y, z, i) => pz[Math.min(NP, i + 1)] < z);   // the last turn's farthest point from the world

    await ctx.yield();

    // ---- THE LOOKS: one at a time, each a window in metres of way between two places, each rising from nothing.
    // THE HOLLOW RULE (join sheet): between zoneIn and zoneOut, and from the dusk plane to the place on the last turn where the moon hides
    // the whole world (W.worldHid, before the turn's apex; the world stays hidden past the apex), no look is on the world. On the wide left the look is on the star's middle and so weak that the world's near edge
    // stays outside the widest picture (56 degrees and more from its middle); where the gaze leans farther for the
    // star's sake (round the right turn and in the hollow) it stops HOLLOW_KEEP degrees from the world's near edge.
    const starC = new THREE.Vector3(STAR[0], STAR[1], STAR[2]), worldC = new THREE.Vector3(0, 0, 0);
    const moonC = TAIL.out.clone().multiplyScalar(MOON_OFF).setZ(MOON_Z);
    // on the star's near face, half way from its middle to its edge on the far turn's inner side: under the great arch
    const starLimb = starC.clone().add(new THREE.Vector3(-0.5, 0, Math.sqrt(0.75)).multiplyScalar(R_STAR));
    // THE STAR, then THE HALF WORLD AND ITS STAR: one look, from the place on the right turn where the line ahead has
    // the world's near edge HOLLOW_KEEP degrees off it (W.starSide) to the far turn's first knot, its aim and its
    // weight both laws of the place.
    // (0) Round the right turn and in the hollow the star stays in the picture's side, in part or whole, as far as
    //     the hollow rule lets it (the law stands where the gaze is turned, below).
    // (1) On the wide left, in the hollow, it is on the star's middle and never on the world: its weight rises to
    //     STAR_PULL by the middle of that stretch and on to STAR_NEAR where the eye stands 68 degrees off the axis.
    // (2) From there, over PAIR_RISE metres, it goes over to THE PAIR: while the two bodies, from far edge to far
    //     edge, stand no wider than PAIR_FIT degrees the gaze rests midway between those edges, both whole. Where
    //     they stand wider the gaze keeps the star (its far edge half of PAIR_FIT from the gaze, and nearer by half
    //     of what they stand wider, PAIR_IN degrees at the most) and the half world falls behind.
    // (3) Over the PAIR_FALL metres before the far turn's first knot it goes back to the line ahead, which there has
    //     the star whole before it; the next look (on the star's near limb, under the great arch) rises from that knot.
    const STAR_PULL = 0.34, STAR_NEAR = 0.8, PAIR_FIT = 88, PAIR_IN = 10, PAIR_RISE = 36, PAIR_FALL = 120, HOLLOW_KEEP = 62;
    // how wide the two bodies stand from a place, from the star's far edge to the world's far edge, in degrees
    const pairWidth = (x, y, z) => { const sx = STAR[0] - x, sy = STAR[1] - y, sz = STAR[2] - z, dS = Math.hypot(sx, sy, sz), dW = Math.hypot(x, y, z);
      return (Math.acos(clamp(-(sx * x + sy * y + sz * z) / (dS * dW), -1, 1)) + Math.asin(Math.min(1, R_STAR / dS)) + Math.asin(Math.min(1, R_WORLD / dW))) * 180 / Math.PI; };
    W.pairWide = wayWhere(W.zoneOut, (x, y, z) => pairWidth(x, y, z) > PAIR_FIT);   // from here the two bodies stand wider than PAIR_FIT: the half world falls behind
    // where, round the right turn, the line ahead first has the world's near edge HOLLOW_KEEP degrees off it: from here the gaze can lean back toward the star
    W.starSide = wayWhere(W.entryEnd, (x, y, z, i) => { const j = Math.min(NP, i + Math.round(LOOK_AHEAD / STEP)), hx = px[j] - x, hy = py[j] - y, hz = pz[j] - z, dW = Math.hypot(x, y, z);
      return Math.acos(clamp(-(hx * x + hy * y + hz * z) / (Math.hypot(hx, hy, hz) * dW), -1, 1)) - Math.asin(Math.min(1, R_WORLD / dW)) > HOLLOW_KEEP * Math.PI / 180; });
    const pairEye = new THREE.Vector3(), pairS = new THREE.Vector3(), pairW = new THREE.Vector3(), pairAxis = new THREE.Vector3(), pairOn = new THREE.Vector3(), pairP = new THREE.Vector3(), pairStar = new THREE.Vector3(), pairTry = new THREE.Vector3();
    const starLook = (time, u) => {
      const d = clamp(u, 0, 1) * L, RAD = Math.PI / 180; path.posAtDist(d, pairEye);
      path.posAtDist(Math.min(L, d + LOOK_AHEAD), pairOn).sub(pairEye).normalize();
      pairS.copy(starC).sub(pairEye); const dS = pairS.length(); pairS.divideScalar(dS);
      pairW.copy(worldC).sub(pairEye); const dW = pairW.length(); pairW.divideScalar(dW);
      const aS = Math.asin(Math.min(1, R_STAR / dS)), aW = Math.asin(Math.min(1, R_WORLD / dW)), sep = Math.acos(clamp(pairS.dot(pairW), -1, 1));
      const wide = sep + aS + aW - PAIR_FIT * RAD;
      const ang = wide <= 0 ? (sep + aW - aS) / 2 : PAIR_FIT * RAD / 2 - aS - Math.min(PAIR_IN * RAD, wide / 2);
      pairAxis.crossVectors(pairS, pairW).normalize(); pairP.copy(pairS).applyAxisAngle(pairAxis, Math.max(0, ang));
      // the aim: the star's middle, then the pair
      const rise = smoothstep(W.zoneOut, W.zoneOut + PAIR_RISE, d);
      pairStar.copy(pairS); pairS.lerp(pairP, rise).normalize();
      const mid = 0.5 * (W.zoneIn + W.zoneOut);
      const hold = (STAR_PULL * smoothstep(W.zoneIn, mid, d) + (STAR_NEAR - STAR_PULL) * smoothstep(mid, W.zoneOut, d) + (1 - STAR_NEAR) * rise) * (1 - smoothstep(W.farIn - PAIR_FALL, W.farIn, d));
      const swing = Math.acos(clamp(pairOn.dot(pairS), -1, 1)); if (swing < 1e-4) return pairOn.multiplyScalar(500).add(pairEye);
      pairAxis.crossVectors(pairOn, pairS).normalize();
      // (0) THE STAR KEPT IN THE PICTURE'S SIDE, round the right turn and in the hollow: where the weight above would
      //     leave the star's far edge more than half of PAIR_FIT from the gaze, the gaze leans on toward the star's
      //     middle until that edge stands there, but never so far that the world's near edge comes within HOLLOW_KEEP
      //     degrees of the gaze (the hollow rule: that edge outside the widest picture, 56 degrees, of either eased
      //     camera). Where the line ahead itself has the world nearer than that, nothing is added.
      let lean = swing * hold;
      if (d < W.zoneOut) {
        const SIDE = PAIR_FIT * RAD / 2, KEEP = HOLLOW_KEEP * RAD;
        const offStar = (a) => Math.acos(clamp(pairTry.copy(pairOn).applyAxisAngle(pairAxis, a).dot(pairStar), -1, 1)) + aS;
        const offWorld = (a) => Math.acos(clamp(pairTry.copy(pairOn).applyAxisAngle(pairAxis, a).dot(pairW), -1, 1)) - aW;
        if (offStar(lean) > SIDE && offWorld(lean) > KEEP) {
          let lo = lean, hi = swing;
          for (let i = 0; i < 14; i++) { const mid = 0.5 * (lo + hi); if (offStar(mid) > SIDE) lo = mid; else hi = mid; }
          if (offWorld(hi) < KEEP) { lo = lean; for (let i = 0; i < 14; i++) { const mid = 0.5 * (lo + hi); if (offWorld(mid) < KEEP) hi = mid; else lo = mid; } hi = lo; }
          lean = hi;
        }
      }
      return pairOn.applyAxisAngle(pairAxis, lean).multiplyScalar(500).add(pairEye);
    };
    // the lean toward the ground on the pass round the day side (none where the aim itself would stand steeper than
    // LEAN_STEEP degrees, whole where it stands under LEAN_LEVEL: a gaze near the upright turns the picture over on
    // itself; on this route the aim is nowhere steeper than the pass's own tilt). THE AIM IS A LAW OF THE
    // PLACE: the gaze rests LIMB_IN degrees inside the world's limb, on the side of the line ahead; so that, far off,
    // where the ball stands smaller than that, it rests on the world's middle and the ball is whole in the picture,
    // and, low over the ground, the lit limb with its air crosses the picture from top to bottom LIMB_IN degrees
    // beyond its middle, the day side on the one hand and the sky on the other (never the ball cut by the picture's
    // edge with the rest empty).
    const LEAN_LEVEL = 35, LEAN_STEEP = 60, LIMB_IN = 16, leanEye = new THREE.Vector3(), leanOn = new THREE.Vector3(), leanTo = new THREE.Vector3(), leanAxis = new THREE.Vector3();
    const groundLean = (time, u) => {
      const d = clamp(u, 0, 1) * L; path.posAtDist(d, leanEye); path.posAtDist(Math.min(L, d + LOOK_AHEAD), leanOn).sub(leanEye).normalize();
      const far = leanEye.length(); leanTo.copy(leanEye).multiplyScalar(-1 / Math.max(far, 1e-6));
      const out = Math.max(0, Math.asin(Math.min(1, R_WORLD / Math.max(far, R_WORLD))) - LIMB_IN * Math.PI / 180), apart = Math.acos(clamp(leanOn.dot(leanTo), -1, 1));
      if (apart > out + 1e-4) { leanAxis.crossVectors(leanTo, leanOn).normalize(); leanTo.applyAxisAngle(leanAxis, out); } else leanTo.copy(leanOn);
      const steep = Math.asin(clamp(Math.abs(leanTo.y), 0, 1)) * 180 / Math.PI, level = 1 - smoothstep(LEAN_LEVEL, LEAN_STEEP, steep);
      // ONE LOOK from the far turn's apex to the plane of dusk, its rise, its hold and its fall its own law of the way
      // (so that no two pulls add): it rises over LOOK_EASE.world metres from the apex to WORLD_HOLD of the way from
      // the line ahead to the aim (the world brought in as the star's limb leaves, and held ahead down the straight),
      // goes on to the whole of it over LOW_RISE metres from LOW_LEAD metres before the low pass, and lets go over
      // the LOOK_EASE.ground metres before the plane of dusk (the hollow rule: from that plane no look is on the world).
      const share = level * (WORLD_HOLD + (1 - WORLD_HOLD) * smoothstep(W.lowIn - LOW_LEAD, W.lowIn - LOW_LEAD + LOW_RISE, d))
        * smoothstep(W.farApex, W.farApex + LOOK_EASE.world, d) * (1 - smoothstep(W.dusk - LOOK_EASE.ground, W.dusk, d));
      const swing = Math.acos(clamp(leanOn.dot(leanTo), -1, 1));
      if (swing > 1e-4 && share > 0) { leanAxis.crossVectors(leanOn, leanTo); if (leanAxis.lengthSq() > 1e-10) leanOn.applyAxisAngle(leanAxis.normalize(), swing * share); }
      return leanOn.multiplyScalar(60).add(leanEye);
    };
    // the look on the moon: toward its middle, but never farther than MOON_LEAN degrees from the line ahead (a law of
    // angle). MOON_LEAN is such that on the last turn the gaze stands about GAZE_REACH degrees from the heading and
    // no more than half a degree beyond it: the line ahead is a chord of the turn and lies asin(LOOK_AHEAD / 2 radius)
    // inside the heading. On the outward leg the gaze rests on the moon's middle, on its last 45 m up to 15 degrees
    // short of it and still on the disc. Round the last turn the moon stands abeam and its middle lies
    // beyond the gaze, toward the beam; where the world bound below bites, the gaze is taken off the moon altogether;
    // from where the moon hides the world the gaze comes back toward it: the black disc before the star.
    const TURN_RATE = 27, V_SLOW = 14;   // the turn law of the pace (below): the gaze is to turn no faster than TURN_RATE degrees a second, and no speed under V_SLOW is asked for its sake
    const GAZE_REACH = 75;   // degrees: how far the gaze may stand from the heading (the crew's measure for both cameras)
    const MOON_SEEN = 50, MOON_LEAN = GAZE_REACH - Math.asin(LOOK_AHEAD / (2 * TURN.radius)) * 180 / Math.PI, MOON_HOLD = 60, WORLD_GRAZE = 8, WORLD_KEEP = 62.5, moonEye = new THREE.Vector3(), moonOn = new THREE.Vector3(), moonTo = new THREE.Vector3(), moonAxis = new THREE.Vector3(), moonTry = new THREE.Vector3();
    const moonLook = (time, u) => {
      const d = clamp(u, 0, 1) * L; path.posAtDist(d, moonEye); path.posAtDist(Math.min(L, d + LOOK_AHEAD), moonOn).sub(moonEye).normalize();
      moonTo.copy(moonC).sub(moonEye).normalize();
      const ang = Math.acos(clamp(moonOn.dot(moonTo), -1, 1)); let lean = Math.min(ang, MOON_LEAN * Math.PI / 180);
      if (ang < 1e-4) return moonOn.multiplyScalar(60).add(moonEye);
      moonAxis.crossVectors(moonOn, moonTo).normalize();
      // never on the world: the gaze stays WORLD_KEEP degrees from the world's near edge (the moon ruling's 62 and
      // the half degree the eased camera may run on) until the place where the moon hides the WHOLE world (W.worldHid);
      // from there the bound lets go evenly, by TURN_RATE / V_SLOW degrees a metre (what the turn law allows at its
      // slowest speed) less the turning of the world's own direction (never more than one radian in the eye's
      // distance from it). By the pace law's own measure the gaze then turns a little more than that law allows at
      // V_SLOW (up to a tenth more, for about half a second where the hiding begins). The gaze comes back toward the moon: the black disc with the star's crown
      // round its limb, the world behind it. The gaze begins to turn where the hiding begins and turns evenly; the
      // eased cameras round its beginning and its end.
      // The gaze is held off by leaning less far toward the moon: as far as the lean can go from the line ahead without
      // coming that near the world. Where the whole lean passes the world by more than WORLD_GRAZE degrees beyond that,
      // the lean is full; where it passes nearer, the lean stops short toward the place where it is nearest the world
      // (so, the bound let go, the gaze rests toward the hidden world and is on it as it comes out).
      const keep = Math.max(0, WORLD_KEEP * Math.PI / 180 + Math.asin(Math.min(1, R_WORLD / moonEye.length())) - Math.max(0, d - W.worldHid) * (TURN_RATE / V_SLOW * Math.PI / 180 - 1 / moonEye.length()));
      moonTo.copy(moonEye).multiplyScalar(-1).normalize();
      const nearAt = (a) => Math.acos(clamp(moonTry.copy(moonOn).applyAxisAngle(moonAxis, a).dot(moonTo), -1, 1));
      let nearest = 0, least = nearAt(0), cross = -1;
      for (let k = 1; k <= 30; k++) { const a = lean * k / 30, n = nearAt(a); if (cross < 0 && n < keep) cross = k; if (n < least) { least = n; nearest = a; } }
      for (let i = 0, w = lean / 30; i < 8; i++) { w *= 0.5; for (const a of [nearest - w, nearest + w]) if (a >= 0 && a <= lean) { const n = nearAt(a); if (n < least) { least = n; nearest = a; } } }
      if (nearAt(0) < keep) lean = 0;
      else if (least < keep) { let lo = 0, hi = nearest; for (let i = 0; i < 14; i++) { const mid = 0.5 * (lo + hi); if (nearAt(mid) < keep) hi = mid; else lo = mid; } lean = lo; }
      else lean = nearest + (lean - nearest) * smoothstep(0, WORLD_GRAZE * Math.PI / 180, least - keep);
      moonOn.applyAxisAngle(moonAxis, lean);
      return moonOn.multiplyScalar(60).add(moonEye);
    };
    // where the outward leg has the moon within MOON_SEEN degrees of its heading; where, on the last turn, the eye is 12 degrees off the shadow's axis (the world's first edge has come out from behind the moon's limb about 2 m of way before, at 12.4 degrees)
    W.moonIn = wayWhere(W.dusk, (x, y, z, i) => { const j = Math.min(NP, i + 1), hx = px[j] - x, hy = py[j] - y, hz = pz[j] - z, mx = moonC.x - x, my = moonC.y - y, mz = moonC.z - z;
      return hx * mx + hy * my + hz * mz > Math.cos(MOON_SEEN * Math.PI / 180) * Math.hypot(hx, hy, hz) * Math.hypot(mx, my, mz); });
    W.worldOut = wayWhere(W.turnApex, (x, y, z) => offAxis(x, y, z) < 12);
    // where, on the last turn, the moon first hides the WHOLE world (the world's disc wholly behind the moon's, as the line sees them)
    W.worldHid = wayWhere(W.turnIn, (x, y, z) => { const mx = moonC.x - x, my = moonC.y - y, mz = moonC.z - z, dM = Math.hypot(mx, my, mz), dW = Math.hypot(x, y, z);
      return Math.acos(clamp(-(mx * x + my * y + mz * z) / (dM * dW), -1, 1)) + Math.asin(Math.min(1, R_WORLD / dW)) < Math.asin(Math.min(1, R_MOON / dM)); });
    // a look's window between two places, with the metres of way over which it rises at its beginning and falls at its end
    const win = (a, b, ease) => ({ from: a / L, to: b / L, fade: ease / (b - a) });
    const LOW_LEAD = 110, LOW_RISE = 60, WORLD_HOLD = 0.6;   // the world's look: metres before the low pass at which it begins to go over from holding the world ahead to resting inside its limb, the metres that takes, and its share of the way while it holds the world ahead
    const LOOK_EASE = { pair: 5, limb: 80, world: 70, ground: 40, face: 120 };   // those metres, look by look (the moon's is MOON_HOLD; the pair's rise and fall are its own law, its window only closes it)
    const pois = [
      { at: starLook, ...win(W.starSide, W.farIn, LOOK_EASE.pair), weight: 1, arc: true, steady: true },     // the star, then the half world and its star (its rise and fall are its own)
      { at: starLimb, ...win(W.farIn, W.farApex, LOOK_EASE.limb), weight: 0.7 },                           // round the far turn: the star's face under the great arch
      { at: groundLean, ...win(W.farApex, W.dusk, LOOK_EASE.pair), weight: 1, arc: true },     // from the far turn's apex the world is brought in as the star's limb leaves and held ahead, whole and growing, down the straight; then down to the day side and round it the gaze rests inside the world's limb; let go before the plane of dusk (its rise, hold and fall are its own: groundLean)
      { at: moonLook, ...win(W.moonIn, W.worldOut + MOON_HOLD, MOON_HOLD), weight: 1, arc: true, steady: true },     // round the moon, until the world has come out from behind its limb
      { at: worldC, ...win(wayWhere(W.turnApex, (x, y, z) => offAxis(x, y, z) < 9), L, LOOK_EASE.face), weight: 0.3, arc: true },
    ];

    await ctx.yield();

    // ---- PACE BY THE GAZE (only the shape matters; the engine scales it to the duration). One law for every bend and
    // every look alike: the gaze (the line LOOK_AHEAD metres on, drawn aside by the looks above exactly as the engine
    // mixes them) turns no faster than TURN_RATE degrees a second; the speed that allows is never under V_SLOW or over
    // V_FAST, is taken down LAG metres before it is needed (the engine eases the speed over about that way) and is
    // smoothed. Named stretches fly under a cap of their own.
    const V_FAST = 95, GAZE_STEP = 2, NG = Math.ceil(L / GAZE_STEP);
    const EASE = 1.4, FLOOR = V_FAST * 0.35 / 2.5, REACH = 2.5, PACE_KEYS = 64, KEY_REACH = 0.5, PACE_TRIALS = 24;
    const PAIR_EASE = 30;   // metres over which the pair's cap lets go after its end
    // a cap: from, to (metres of way), metres a second, and, where it is given, the metres over which it lets go after its end
    const CAPS = [
      [0, W.entryEnd + 40, 68],                    // the entry and the first of the right turn: the star and its bead
      [W.zoneIn - 75, W.zoneIn + 10, 28],          // round the right turn, as the eye comes to the hollow's first place: slow enough that the eased camera keeps up with the gaze and the world leaves the picture in time
      [W.zoneOut - 60, W.pairWide, 24, PAIR_EASE], // where the half world may first be looked at: slow enough that the eased camera brings it in beside its star while both still stand whole; it lets go from the place where they stand too wide for that, over PAIR_EASE metres
      [W.lowOut, W.turnIn, 52],                    // out beside the shadow, the moon ahead
      [W.axis, L, 58],                             // the last straight: the eclipse is not hurried
    ];
    const paced = new Float32Array(PACE_KEYS + 1);
    {
      const eye = new THREE.Vector3(), on = new THREE.Vector3(), dir = new THREE.Vector3(), to = new THREE.Vector3(), axis = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), turn = new THREE.Matrix4();
      const gaze = [], wish = new Float32Array(NG + 1), want = new Float32Array(NG + 1).fill(V_FAST), ask = new Float32Array(NG + 1);
      for (let i = 0; i <= NG; i++) {
        const d = Math.min(L, i * GAZE_STEP), u = d / L, guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
        path.posAtDist(d, eye); path.posAtDist(d + LOOK_AHEAD, on); dir.subVectors(on, eye).normalize();
        for (const look of pois) {
          const w = bell(u, look.from, look.to, look.fade) * look.weight * guard;
          if (w <= 0.001) continue;
          to.copy(typeof look.at === 'function' ? look.at(0, u) : look.at).sub(eye).normalize();
          if (look.arc) { const ang = Math.acos(clamp(dir.dot(to), -1, 1)); if (ang > 1e-4) { axis.crossVectors(dir, to); if (axis.lengthSq() < 1e-8) axis.copy(UP); else axis.normalize(); dir.applyAxisAngle(axis, ang * Math.min(1, w)); } }
          else dir.multiplyScalar(1 - w).addScaledVector(to, w).normalize();
        }
        gaze.push(new THREE.Quaternion().setFromRotationMatrix(turn.lookAt(eye, on.copy(eye).add(dir), UP)));
        if (i % 24 === 23) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i <= NG; i++) {
        const a = Math.max(0, i - 1), b = Math.min(NG, i + 1), perMetre = gaze[a].angleTo(gaze[b]) / ((b - a) * GAZE_STEP);
        let v = clamp(TURN_RATE * Math.PI / 180 / Math.max(perMetre, 1e-6), V_SLOW, V_FAST);
        for (const c of CAPS) { const d = i * GAZE_STEP, ease = c[3] || 0; if (d >= c[0] && d <= c[1] + ease) v = Math.min(v, d <= c[1] ? c[2] : c[2] + (V_FAST - c[2]) * smoothstep(0, ease, d - c[1])); }
        wish[i] = v;
      }
      // the speed wanted: under the wish everywhere, and such as the engine's easing can reach (it nears the speed asked
      // at EASE a second, and asks no less than FLOOR): slowed in time before a bend, let go after it
      want[NG] = wish[NG];
      for (let i = NG - 1; i >= 0; i--) want[i] = Math.min(wish[i], want[i + 1] + GAZE_STEP * EASE * REACH * (want[i + 1] - FLOOR) / want[i + 1]);
      for (let i = 1; i <= NG; i++) want[i] = Math.min(want[i], want[i - 1] + GAZE_STEP * EASE * REACH * (V_FAST - want[i - 1]) / want[i - 1]);
      // the speed asked: the speed wanted, asked for as far ahead as the easing lags behind (1 / EASE seconds of way)
      for (let i = 0; i <= NG; i++) ask[i] = want[Math.min(NG, i + Math.round(want[i] / EASE / GAZE_STEP))];
      // the engine keeps PACE_KEYS values of it and goes straight between them: each begins as the least asked within
      // KEY_REACH key lengths of it, so that no bend falls between two keys unheeded
      const perMetre = new Float32Array(NG + 1);
      for (let i = 0; i <= NG; i++) { const a = Math.max(0, i - 1), b = Math.min(NG, i + 1); perMetre[i] = gaze[a].angleTo(gaze[b]) / ((b - a) * GAZE_STEP); }
      for (let k = 0; k <= PACE_KEYS; k++) {
        const mid = k * NG / PACE_KEYS, half = KEY_REACH * NG / PACE_KEYS; let least = V_FAST;
        for (let i = Math.max(0, Math.ceil(mid - half)); i <= Math.min(NG, Math.floor(mid + half)); i++) least = Math.min(least, ask[i]);
        paced[k] = least;
      }
      await ctx.yield();
      // then the keys are evened by trial: the flight is reckoned as the engine will fly it (its own scaling of the keys
      // to the duration, its own easing of the speed), the gaze's fastest turning near each key is read off, and each
      // key is moved toward the speed at which that turning would be the same everywhere. The best trial is kept.
      const best = new Float32Array(PACE_KEYS + 1), rate = new Float32Array(PACE_KEYS + 1), DT = 1 / 30; let bestPeak = 1e9;
      for (let trial = 0; trial <= PACE_TRIALS; trial++) {
        let inv = 0; for (let k = 0; k < PACE_KEYS; k++) inv += 2 / (paced[k] + paced[k + 1]);
        const scale = (L / DURATION) * inv / PACE_KEYS; rate.fill(0);
        let dist = 0, speed = scale * paced[0], peak = 0;
        while (dist < L - 1) {
          const x = dist / L * PACE_KEYS, k = Math.min(PACE_KEYS - 1, Math.floor(x)), target = scale * (paced[k] + (paced[k + 1] - paced[k]) * (x - k));
          speed += (target - speed) * (1 - Math.exp(-DT * EASE)); dist += speed * DT;
          const turning = speed * perMetre[Math.min(NG, Math.round(dist / GAZE_STEP))], near = Math.min(PACE_KEYS, Math.round(x));
          rate[near] = Math.max(rate[near], turning); peak = Math.max(peak, turning);
        }
        if (peak < bestPeak) { bestPeak = peak; best.set(paced); }
        if (trial === PACE_TRIALS) break;
        let sum = 0, n = 0; for (let k = 0; k <= PACE_KEYS; k++) if (rate[k] > 0.5 * peak) { sum += Math.log(rate[k]); n++; }
        const even = Math.exp(sum / Math.max(1, n));
        for (let k = 0; k <= PACE_KEYS; k++) paced[k] = clamp(paced[k] * clamp(Math.pow(even / Math.max(rate[k], 1e-4), 0.5), 0.85, 1.15), FLOOR, V_FAST);
        if (trial % 4 === 3) await ctx.yield();
      }
      paced.set(best);
    }
    const pace = (u) => { const x = clamp(u, 0, 1) * PACE_KEYS, k = Math.min(PACE_KEYS - 1, Math.floor(x)); return (paced[k] + (paced[k + 1] - paced[k]) * (x - k)) / V_FAST * 2.5; };

    // ================================================================ the far sky: small still suns and one faint band
    const uTime = { value: 0 }, uBufH = { value: 450 }, uWorld = { value: worldC }, uBallR = { value: R_WORLD }, uStar = { value: starC };
    let sunMat;
    {
      // many faint, some clear, a few dozen bright: a bright one is also a wider one
      const n = 6500, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const z = rSuns() * 2 - 1, a = rSuns() * Math.PI * 2, r = Math.sqrt(1 - z * z), b = 0.16 + 0.9 * Math.pow(rSuns(), 5);
        pos[i * 3] = Math.cos(a) * r * 2500; pos[i * 3 + 1] = z * 2500; pos[i * 3 + 2] = Math.sin(a) * r * 2500;
        const tint = rSuns(), gold = tint < 0.2 ? 1 : 0, blue = tint > 0.78 ? 1 : 0;
        col[i * 3] = b * (0.86 + 0.14 * gold - 0.22 * blue); col[i * 3 + 1] = b * (0.89 - 0.09 * gold - 0.06 * blue); col[i * 3 + 2] = b * (0.95 - 0.42 * gold + 0.05 * blue);
        // one in six wavers over 2 to 6 seconds
        const wav = rSuns() < 1 / 6;
        tw[i * 4] = rSuns() * 6.283; tw[i * 4 + 1] = 6.283 / (2 + 4 * rSuns()); tw[i * 4 + 2] = wav ? 0.45 : 0; tw[i * 4 + 3] = 0.003 + 0.011 * b * b * b;
        if (i % 500 === 499) await ctx.yield();
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aTw', new THREE.BufferAttribute(tw, 4));
      sunMat = new THREE.ShaderMaterial({
        uniforms: { uTime, uBufH, uWorld, uBallR },
        vertexShader: /* glsl */`
          attribute vec3 aCol; attribute vec4 aTw; uniform float uTime, uBufH, uBallR; uniform vec3 uWorld; varying vec3 vCol;
          ${BALL_GLSL}
          void main(){
            float vis=ballMiss(cameraPosition-uWorld, normalize(position), uBallR);
            vec4 p=projectionMatrix*viewMatrix*vec4(cameraPosition+position,1.);
            float px=aTw.w*projectionMatrix[1][1]*uBufH*.5, sz=max(px,1.6);
            vCol=aCol*(1.+aTw.z*sin(uTime*aTw.y+aTw.x))*(px*px)/(sz*sz)*step(.5,vis);
            gl_PointSize=sz; gl_Position=vis<.5 ? vec4(2.,2.,2.,1.) : p;
          }`,
        fragmentShader: /* glsl */`precision highp float; varying vec3 vCol;
          void main(){ float r=clamp(length(gl_PointCoord-.5)*2.,0.,1.); gl_FragColor=vec4(vCol*(1.-r*r)*(1.-r*r)*1.6,1.); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const suns = new THREE.Points(g, sunMat);
      suns.frustumCulled = false; suns.renderOrder = -2; scene.add(suns);
      await ctx.yield();
      // a few bright ones among them, each of its own size and colour: gold, blue white, rose, white
      const nb = 46, bpos = new Float32Array(nb * 3), bcol = new Float32Array(nb * 3), btw = new Float32Array(nb * 4);
      const HUES = [[1, 0.8, 0.5], [0.66, 0.8, 1], [1, 0.62, 0.6], [1, 0.97, 0.9], [0.8, 0.88, 1]];
      for (let i = 0; i < nb; i++) {
        const z = rBright() * 2 - 1, a = rBright() * Math.PI * 2, r = Math.sqrt(1 - z * z), b = 1.1 + 1.5 * rBright(), hue = HUES[Math.floor(rBright() * HUES.length) % HUES.length];
        bpos[i * 3] = Math.cos(a) * r * 2500; bpos[i * 3 + 1] = z * 2500; bpos[i * 3 + 2] = Math.sin(a) * r * 2500;
        bcol[i * 3] = b * hue[0]; bcol[i * 3 + 1] = b * hue[1]; bcol[i * 3 + 2] = b * hue[2];
        btw[i * 4] = rBright() * 6.283; btw[i * 4 + 1] = 6.283 / (3 + 5 * rBright()); btw[i * 4 + 2] = 0.3; btw[i * 4 + 3] = 0.012 + 0.016 * rBright();
      }
      const gb = new THREE.BufferGeometry();
      gb.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); gb.setAttribute('aCol', new THREE.BufferAttribute(bcol, 3)); gb.setAttribute('aTw', new THREE.BufferAttribute(btw, 4));
      const bright = new THREE.Points(gb, sunMat);
      bright.frustumCulled = false; bright.renderOrder = -2; scene.add(bright);
    }
    await ctx.yield();

    // the band of far light: aslant across the +Z side of the sky (the side we look to beside the shadow). Its tilt
    // and tint are the seed's: gold or blue white, both rich, with dark rifts down its middle. A dome that follows the
    // eye, and a crowd of faint suns along it. On the same dome the thin violet cloud of the deep sky, which stands
    // thickest in two fields of the far sky, each a fixed direction: round -Z (the star's part of the sky) and round
    // -X (abeam of the line from the star to its world).
    {
      const tilt = rBand.range(0.45, 1.1) * rBand.sign(), kind = rBand.pick(['gold', 'blue']);
      const cdir = new THREE.Vector3(rBand.range(-0.3, 0.3), rBand.range(-0.15, 0.3), 1).normalize();
      const along = new THREE.Vector3(Math.cos(tilt), Math.sin(tilt), 0).addScaledVector(cdir, -(Math.cos(tilt) * cdir.x + Math.sin(tilt) * cdir.y)).normalize();
      const norm = new THREE.Vector3().crossVectors(cdir, along).normalize();
      const strength = 1, tint = new THREE.Color(kind === 'blue' ? '#B9D2FF' : '#FFDDA6');
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
        uniforms: { uWorld, uBallR, uN: { value: norm }, uC: { value: cdir }, uA: { value: along }, uTint: { value: new THREE.Vector3(tint.r, tint.g, tint.b) }, uGain: { value: 0.21 * strength }, uQuiet: { value: TAIL.out },
          uOff: { value: new THREE.Vector3(rBand.range(0, 30), rBand.range(0, 30), rBand.range(0, 30)) } },
        vertexShader: /* glsl */`varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*viewMatrix*vec4(cameraPosition+position*2400.,1.); }`,
        fragmentShader: /* glsl */`precision highp float;
          uniform vec3 uWorld, uN, uC, uA, uTint, uOff, uQuiet; uniform float uBallR, uGain; varying vec3 vD;
          ${NOISE_GLSL}${BALL_GLSL}
          float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vn3(p); p=p*2.03+7.1; a*=.5; } return s; }
          float fbm3(vec3 p){ float a=.5, s=0.; for(int i=0;i<3;i++){ s+=a*vn3(p); p=p*2.03+7.1; a*=.5; } return s*1.14; }
          void main(){
            vec3 d=normalize(vD); float lat=dot(d,uN), al=dot(d,uC), lon=atan(dot(d,uA), al+1e-6);
            // THE BAND: a river of far suns seen edge on. Its width swells and narrows along it. Its light is star
            // cloud (heaps of it, and a grain fine to the pixel); a golden heart where the band passes its own
            // middle (uC); dark lanes down it that bend and fork, with finer threads of dark beside them; knots of
            // young blue white suns where the star cloud is thick; and here and there a cloud of rose.
            float w=.06+.06*vn3(d*2.3+uOff.zxy), prof=exp(-lat*lat/(2.*w*w)), skirt=exp(-lat*lat/(12.*w*w));
            float cl=smoothstep(.28,.8,fbm(d*6.+uOff)), grain=fbm3(d*33.+uOff.yzx);
            float heart=exp(-lon*lon/.42-lat*lat/.02);
            float bend=(fbm(d*4.+uOff.yzx)-.5)*6.;
            float dust=smoothstep(.42,.66,fbm(vec3(lon*2.4, lat*24.+bend, 3.)+uOff.yzx))*exp(-lat*lat/.006);
            float fine=1.-abs(2.*vn3(vec3(lon*7., lat*62.+bend*2.5, 9.)+uOff)-1.);
            dust=max(dust, .5*smoothstep(.8,.97,fine)*smoothstep(.3,.6,cl)*exp(-lat*lat/.012));
            float I=prof*(.1+1.5*cl*sqrt(cl))*(.5+1.*grain)*(.6+.8*vn3(d*13.+uOff))+heart*(.7+.6*grain)+.22*skirt*(.3+.7*cl);
            I*=1.-.9*dust;
            float knot=smoothstep(.6,.95,vn3(d*27.+uOff.zxy+5.))*smoothstep(.3,.7,cl)*prof*(1.-dust);
            // a knot is a soft glow with a swarm of small young suns in it (no flat patch of white)
            knot=knot*knot*(.5+2.6*smoothstep(.62,.9,vn3(d*120.+uOff.yzx)));
            float rose=smoothstep(.7,.9,vn3(d*5.3+uOff.zxy+17.))*exp(-lat*lat/(5.*w*w))*(.35+.65*fbm3(d*14.+uOff));
            float fore=mix(.3, 1., smoothstep(-.4,.7,al));
            // blue white at its edges, the seed's tint through its middle, gold at its heart; redder by the lanes
            vec3 sunC=mix(mix(vec3(.66,.78,1.), uTint, .7*prof), vec3(1.,.8,.5), heart)*mix(vec3(1.), vec3(1.,.66,.44), dust);
            vec3 col=(sunC*I+vec3(.7,.84,1.)*knot*2.2+vec3(1.,.34,.44)*rose*.55+vec3(.6,.73,1.)*.04*exp(-abs(lat)/.28))*fore*uGain;
            // the deep of the sky is not empty: thin far clouds of blue and violet, with true dark between them
            float n1=fbm(d*1.7+uOff.zxy), n2=fbm(d*4.3+uOff.yzx+n1*2.2), rdg=1.-abs(2.*n2-1.);
            float neb=smoothstep(.36,.8,n1)*(.18+.82*rdg*rdg*rdg);
            // it is thickest, and violet, in two fields of the far sky: round -Z, the star's part of the sky (but not
            // in the sector on the moon's side of the shadow's axis: there the sky is left dark, as the crown is
            // quiet there), and round -X, abeam of the line from the star to its world
            vec2 side=d.xy/max(length(d.xy),1e-4);
            float byStar=exp(-(1.+d.z)*9.)*(1.-.92*smoothstep(.1,.7,dot(side,uQuiet.xy))*smoothstep(.08,.25,length(d.xy)));
            float low=max(byStar, exp(-(1.+d.x)*7.));
            col+=mix(mix(vec3(.12,.17,.36), vec3(.3,.16,.34), smoothstep(.35,.65,fbm(d*1.1+uOff+9.))), vec3(.36,.2,.5), low)*neb*(.17+.22*low);
            gl_FragColor=vec4(col*ballMiss(cameraPosition-uWorld, d, uBallR),1.);
          }`,
        side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      dome.frustumCulled = false; dome.renderOrder = -3; scene.add(dome);
      await ctx.yield();
      const n = 8000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const a = rBand.gauss() * 1.1, lat = rBand.gauss() * 0.085, b = (0.08 + 0.5 * Math.pow(rBand(), 3)) * (0.5 + 0.5 * strength);
        const dx = cdir.x * Math.cos(a) + along.x * Math.sin(a), dy = cdir.y * Math.cos(a) + along.y * Math.sin(a), dz = cdir.z * Math.cos(a) + along.z * Math.sin(a);
        const x = dx + norm.x * lat, y = dy + norm.y * lat, z = dz + norm.z * lat, l = 2500 / Math.hypot(x, y, z);
        pos[i * 3] = x * l; pos[i * 3 + 1] = y * l; pos[i * 3 + 2] = z * l;
        col[i * 3] = b * tint.r; col[i * 3 + 1] = b * tint.g; col[i * 3 + 2] = b * tint.b;
        tw[i * 4] = rBand() * 6.283; tw[i * 4 + 1] = 2; tw[i * 4 + 2] = 0; tw[i * 4 + 3] = 0.003;
        if (i % 500 === 499) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aTw', new THREE.BufferAttribute(tw, 4));
      const crowd = new THREE.Points(g, sunMat); crowd.frustumCulled = false; crowd.renderOrder = -2; scene.add(crowd);
    }
    await ctx.yield();

    // ================================================================ the star's wind
    // The wind streams straight out from the star at WIND metres a second. It is laid in the wind's own coordinates:
    // (across, across, out), where `out` is the distance from the star's centre and `across` the direction from the
    // star, in metres at the world's distance. A spark keeps its direction and only its `out` grows, so its course is
    // a ray from the star; the box of sparks wraps round the eye in those coordinates. Light BY PLACE: it falls with
    // the square of the distance from the star, it is nothing in the world's shadow (within 26 m of the +Z axis on
    // the night side, full by 40 m), and a third inside the ember sleeve; nothing shows inside or behind the ball.
    // THE WIND PARTS ROUND THE MOON (sparks, near sparks and embers alike): a thing that would stream through the moon
    // is carried out from the line through the moon's middle along the wind, round a long smooth shape that holds the
    // moon: it begins PART_BOW moon radii upwind and closes PART_WAKE radii downwind. The wind within PART_REACH
    // metres of that line is pressed, evenly, into the room between the shape and that reach (so it is nowhere piled
    // into a film, and it runs denser beside the moon: the wind breaking on it); farther out it is not turned, so
    // nothing is carried into the shadow's black core. Behind the moon there is a wake with nothing in it.
    const WIND_GLSL = /* glsl */`
      uniform float uTime, uBufH, uBallR, uMoonR; uniform vec3 uStar, uWorld, uMoon;
      ${BALL_GLSL}
      vec3 partRound(vec3 p){
        vec3 w=normalize(uMoon-uStar), d=p-uMoon; float z=dot(d,w); vec3 r=d-w*z; float r2=max(dot(r,r),1e-4);
        float g=smoothstep(-${PART_BOW.toFixed(1)}*uMoonR,-.4*uMoonR,z)*(1.-smoothstep(.6*uMoonR,${PART_WAKE.toFixed(1)}*uMoonR,z));
        float room=clamp(1.-r2/${(PART_REACH * PART_REACH).toFixed(1)},0.,1.);
        return p+r*(sqrt((r2+1.1*g*uMoonR*uMoonR*room)/r2)-1.);
      }
      vec3 toWind(vec3 p){ vec3 d=p-uStar; return vec3(d.xy/max(d.z,1.)*900., length(d)); }
      vec3 fromWind(vec3 w){ return uStar+normalize(vec3(w.xy,900.))*w.z; }
      vec3 windPlace(vec3 base, float box){
        vec3 e=toWind(cameraPosition), q=base; q.z+=uTime*${WIND.toFixed(1)};
        return partRound(fromWind(e+mod(q-e+box*.5, box)-box*.5));
      }
      float sleeve(vec3 pw){ float ax=length(pw.xy);
        return smoothstep(${(LANE_IN - 1).toFixed(1)},${(LANE_IN + 1).toFixed(1)},ax)*(1.-smoothstep(${(LANE_OUT - 2).toFixed(1)},${LANE_OUT.toFixed(1)},ax))
          *smoothstep(${(LANE_Z0 - 4).toFixed(1)},${(LANE_Z0 + 4).toFixed(1)},pw.z)*(1.-smoothstep(${(LANE_Z1 - 8).toFixed(1)},${LANE_Z1.toFixed(1)},pw.z)); }
      // the wind's light at a place p (world coordinates), and whether the eye can see that place at all
      float windLight(vec3 p){
        vec3 ds=p-uStar, pw=p-uWorld; float d2=max(dot(ds,ds),1.);
        float lit=min(160000./d2, 3.);
        lit*=mix(1., smoothstep(26.,40.,length(pw.xy)), smoothstep(-3.,3.,pw.z));
        lit*=1.-.667*sleeve(pw);
        lit*=smoothstep(uBallR+.7, uBallR+1.6, length(pw));
        return lit*ballBefore(cameraPosition-uWorld, pw, uBallR);
      }
      float nearLens(vec3 p){ return smoothstep(.8,3.,length(p-cameraPosition)); }
    `;
    const windU = { uTime, uBufH, uBallR, uStar, uWorld, uMoon: { value: moonC }, uMoonR: { value: R_MOON } };
    const gold = new THREE.Color('#FFE9B0');
    {
      // the far set: gold points in a box 240 on a side
      const n = Math.round(9000 * detail * density), BOX = 240, pos = new Float32Array(n * 3), rnd = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = rWind() * BOX; pos[i * 3 + 1] = rWind() * BOX; pos[i * 3 + 2] = rWind() * BOX;
        rnd[i * 4] = 0.1 + 0.2 * Math.pow(rWind(), 2); rnd[i * 4 + 1] = rWind() * 6.283; rnd[i * 4 + 2] = 1.5 + 4 * rWind(); rnd[i * 4 + 3] = 0.55 + 0.75 * rWind();
        if (i % 700 === 699) await ctx.yield();
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
      const sparks = new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: { ...windU, uTwinkle: { value: 0.2 + 0.45 * mood }, uCol: { value: new THREE.Vector3(gold.r, gold.g, gold.b) } },
        vertexShader: /* glsl */`attribute vec4 aRnd; uniform float uTwinkle; uniform vec3 uCol; varying vec3 vCol;
          ${WIND_GLSL}
          void main(){
            vec3 p=windPlace(position, ${BOX.toFixed(1)});
            float dist=max(length(p-cameraPosition),.01);
            float px=aRnd.x*projectionMatrix[1][1]*uBufH*.5/dist, sz=clamp(px,1.5,40.);
            float lit=windLight(p)*nearLens(p)*aRnd.w*(1.+uTwinkle*sin(uTime*aRnd.z+aRnd.y));
            vCol=uCol*lit*px*px/(sz*sz);   // a point never drawn smaller than a pixel and a half: its light is thinned by the square of what that adds, whatever the distance
            gl_PointSize=sz; gl_Position=lit<=.0005 ? vec4(2.,2.,2.,1.) : projectionMatrix*viewMatrix*vec4(p,1.);
          }`,
        fragmentShader: /* glsl */`precision highp float; varying vec3 vCol;
          void main(){ float r=clamp(length(gl_PointCoord-.5)*2.,0.,1.); gl_FragColor=vec4(vCol*(1.-r*r)*(1.-r*r)*1.5,1.); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      sparks.frustumCulled = false; sparks.renderOrder = 4; scene.add(sparks);
    }
    await ctx.yield();

    // ---- THE ROUTE AS THE WIND'S THREADS COUNT IT: its places every 2 m of way in the star's frame (rx, ry, rz), their
    // directions from the star in the wind's across coordinates (ra, rb), a thousand over their z from the star (rk:
    // the across reach of a metre there, with a tenth to spare), and how far along the wind they stand from the
    // moon's middle (rm). The wind's parting round the moon acts between Z0 and Z1 of that.
    const RS = 4, NR = Math.ceil(NP / RS) + 1, rx = new Float32Array(NR), ry = new Float32Array(NR), rz = new Float32Array(NR), ra = new Float32Array(NR), rb = new Float32Array(NR), rm = new Float32Array(NR), rk = new Float32Array(NR);
    const mw = moonC.clone().sub(starC).normalize(), outM = moonC.distanceTo(starC), Z0 = -PART_BOW * R_MOON, Z1 = PART_WAKE * R_MOON;
    for (let i = 0; i < NR; i++) { const j = Math.min(NP, i * RS), x = px[j] - STAR[0], y = py[j] - STAR[1], z = pz[j] - STAR[2], zz = Math.max(z, 1);
      rx[i] = x; ry[i] = y; rz[i] = z; ra[i] = x / zz * 900; rb[i] = y / zz * 900; rk[i] = 1000 / zz;
      rm[i] = (px[j] - moonC.x) * mw.x + (py[j] - moonC.y) * mw.y + (pz[j] - moonC.z) * mw.z; }
    const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    await ctx.yield();
    // the shader's partRound, on a place v in the star's frame (moved in place)
    const partPlace = (v) => {
      const cx = v[0] - (moonC.x - STAR[0]), cy = v[1] - (moonC.y - STAR[1]), cz = v[2] - (moonC.z - STAR[2]), z = cx * mw.x + cy * mw.y + cz * mw.z;
      const ox = cx - mw.x * z, oy = cy - mw.y * z, oz = cz - mw.z * z, r2 = Math.max(ox * ox + oy * oy + oz * oz, 1e-4);
      const g = sstep(-PART_BOW * R_MOON, -0.4 * R_MOON, z) * (1 - sstep(0.6 * R_MOON, PART_WAKE * R_MOON, z)), k = Math.sqrt((r2 + 1.1 * g * R_MOON * R_MOON * clamp(1 - r2 / (PART_REACH * PART_REACH), 0, 1)) / r2) - 1;
      v[0] += ox * k; v[1] += oy * k; v[2] += oz * k;
    };
    // ---- THE LANE'S COUNT (NEAR_CLEAR, NEAR_WHOLE), for ONE COURSE of a thread: the straight line of the world that
    // the thread runs along on the clock (from O along the unit U, in the star's frame; s metres from O, from sA to
    // sB). Where the wind's parting round the moon can carry the thread aside (s from pA to pB) its place is counted
    // as the shader lays it.
    // A PASS is a stretch of route samples that stand within LANE_SEEK of the course (and the parting's reach). Along
    // it and a little beyond, at every metre of s, the thread's distance from the route is taken; that gives where on
    // the course the thread is nearest the line (s), how near (less LANE_SLACK), and the least rate at which that
    // distance grows along the course while it is under NEAR_WHOLE, before that place and after it: so the lane as
    // the shader lays it (lanePass: near and rate times the metres along, squared, added, the root) is nowhere
    // narrower than the count. Each pass is added to `out` as [0, s, near, rates] (the first for the course's own
    // number; the two rates in one number: the one before in whole steps of 1/LANE_PACK times LANE_PACK, the one
    // after as the part under 1). It returns the course's least distance from the route (for the thread's breadth).
    // `list`, `count`: the route samples to count against, rising, and how many of them.
    const laneV = [0, 0, 0], laneProf = [], LANE_PACK = 4096;
    let laneO = laneV, laneU = laneV, lanePush = 0;   // the course in hand, and how far the parting can carry it aside
    const lanePlace = (s) => { laneV[0] = laneO[0] + laneU[0] * s; laneV[1] = laneO[1] + laneU[1] * s; laneV[2] = laneO[2] + laneU[2] * s; };
    // the thread's distance from the route (its places a to b, and the route's two straight pieces that meet at the
    // nearest of them), its middle s metres along the course in hand, as the parting lays it
    const laneDist = (s, a, b) => {
      lanePlace(s); if (lanePush > 0) partPlace(laneV);
      let best = Infinity, ib = a; for (let i = a; i <= b; i++) { const dx = rx[i] - laneV[0], dy = ry[i] - laneV[1], dz = rz[i] - laneV[2], d2 = dx * dx + dy * dy + dz * dz; if (d2 < best) { best = d2; ib = i; } }
      for (let i = Math.max(0, ib - 1); i <= Math.min(NR - 2, ib); i++) {
        const ex = rx[i + 1] - rx[i], ey = ry[i + 1] - ry[i], ez = rz[i + 1] - rz[i], dx = laneV[0] - rx[i], dy = laneV[1] - ry[i], dz = laneV[2] - rz[i];
        const t = clamp((dx * ex + dy * ey + dz * ez) / Math.max(ex * ex + ey * ey + ez * ez, 1e-9), 0, 1), d2 = (dx - ex * t) ** 2 + (dy - ey * t) ** 2 + (dz - ez * t) ** 2; if (d2 < best) best = d2; }
      return Math.sqrt(best);
    };
    // ONE PASS of the course in hand: the route's places i0 to i1 stand near it, their feet on it from t0 to t1
    const lanePassCount = (i0, i1, t0, t1, sA, sB, out) => {
      const pad = LANE_SEEK + lanePush + 2, more = Math.ceil(pad / 2) + 1, a = Math.max(0, i0 - more), b = Math.min(NR - 1, i1 + more), s0 = Math.max(sA, t0 - pad), s1 = Math.min(sB, t1 + pad), prof = laneProf;
      let at = s0, near = Infinity; prof.length = 0;
      for (let s = s0; s <= s1; s += 1) { const d = laneDist(s, a, b); prof.push(s, d); if (d < near) { near = d; at = s; } }
      for (let step = 0.5; step > 0.1; step *= 0.5) { const mid = at; for (let side = -1; side <= 1; side += 2) { const s = mid + side * step; if (s >= sA && s <= sB) { const d = laneDist(s, a, b); if (d < near) { near = d; at = s; } } } }
      near = Math.max(0, near - LANE_SLACK);
      if (near < NEAR_WHOLE) {
        let before = 1, after = 1;
        // the two rates: the lane as laid must nowhere give a thread more than the count gives it (the count
        // matters between NEAR_CLEAR, under which there is no light anyway, and NEAR_WHOLE)
        for (let j = 0; j < prof.length; j += 2) { const ds = Math.abs(prof[j] - at), d = Math.max(near, NEAR_CLEAR, prof[j + 1] - LANE_SLACK); if (ds < 1 || d >= NEAR_WHOLE) continue;
          const rate = Math.sqrt(d * d - near * near) / ds; if (prof[j] < at) before = Math.min(before, rate); else after = Math.min(after, rate); }
        out.push([0, at, near, Math.floor(before * LANE_PACK) + Math.max(0, Math.min(after, 0.999) - 0.0005)]);
      }
      return near;
    };
    const laneCount = (O, U, sA, sB, pA, pB, list, count, out) => {
      laneO = O; laneU = U; lanePush = 0;
      // how far the parting can carry this course aside: counted every 2 m of it, and a metre for what lies between
      for (let s = pA; s <= pB; s += 2) { lanePlace(s); const x = laneV[0], y = laneV[1], z = laneV[2]; partPlace(laneV); lanePush = Math.max(lanePush, Math.sqrt((laneV[0] - x) ** 2 + (laneV[1] - y) ** 2 + (laneV[2] - z) ** 2)); }
      if (lanePush > 0) lanePush += 1;
      let least = Infinity, i0 = -1, i1 = -1, t0 = 0, t1 = 0;
      for (let q = 0; q < count; q++) {
        const i = list[q], ex = rx[i] - O[0], ey = ry[i] - O[1], ez = rz[i] - O[2], t = clamp(ex * U[0] + ey * U[1] + ez * U[2], sA, sB), d = Math.sqrt((ex - U[0] * t) ** 2 + (ey - U[1] * t) ** 2 + (ez - U[2] * t) ** 2);
        const aside = lanePush > 0 && rm[i] > Z0 - 8 && rm[i] < Z1 + 8 ? lanePush : 0;
        if (d < LANE_SEEK + aside) {
          if (i0 >= 0 && i - i1 <= 2) { i1 = i; if (t < t0) t0 = t; if (t > t1) t1 = t; }
          else { if (i0 >= 0) least = Math.min(least, lanePassCount(i0, i1, t0, t1, sA, sB, out)); i0 = i1 = i; t0 = t1 = t; }
        } else if (d - aside < least) least = d - aside;
      }
      if (i0 >= 0) least = Math.min(least, lanePassCount(i0, i1, t0, t1, sA, sB, out));
      return least;
    };
    // a set of n short dashes: four corners each, all four at the dash's own place; the vertex shader lays the dash
    // along a line of the world (the wind's) and turns the thin sheet about that line to face the eye
    const dashGeometry = async (n, fill, every = 400) => {
      const pos = new Float32Array(n * 12), cor = new Float32Array(n * 8), rnd = new Float32Array(n * 16), idx = new Uint32Array(n * 6), p = [0, 0, 0], r = [0, 0, 0, 0];
      const C = [-1, -1, 1, -1, 1, 1, -1, 1];
      for (let i = 0; i < n; i++) {
        fill(p, r, i);
        for (let k = 0; k < 4; k++) {
          const v = i * 4 + k;
          pos[v * 3] = p[0]; pos[v * 3 + 1] = p[1]; pos[v * 3 + 2] = p[2];
          rnd[v * 4] = r[0]; rnd[v * 4 + 1] = r[1]; rnd[v * 4 + 2] = r[2]; rnd[v * 4 + 3] = r[3];
          cor[v * 2] = C[k * 2]; cor[v * 2 + 1] = C[k * 2 + 1];
        }
        const o = i * 6, q = i * 4;
        idx[o] = q; idx[o + 1] = q + 1; idx[o + 2] = q + 2; idx[o + 3] = q; idx[o + 4] = q + 2; idx[o + 5] = q + 3;
        if (i % every === every - 1) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(cor, 2)); g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      return g;
    };
    const DASH_FRAG = /* glsl */`precision highp float; varying vec3 vCol; varying vec2 vQ;
      void main(){ float x=clamp(vQ.x,-1.,1.), y=clamp(abs(vQ.y),0.,1.), x2=x*x;
        gl_FragColor=vec4(vCol*(1.-y*y)*(1.-x2*x2*x2)*(.2+.8*smoothstep(-1.,.7,x)),1.); }`;
    // vertexMain gives the dash's place p, its line `along`, its light `lit` and its colour `tint`.
    // aRnd: (length, thickness, twinkle phase, brightness). `fine`: the breadth the dash is drawn with, its dealt
    // thickness or less. The dash is never drawn thinner than a pixel and a half; where that draws it broader than
    // its dealt thickness its light is thinned to match, and its brightness is never more than dealt.
    const DASH_BODY = (fine) => /* glsl */`
        vec3 toEye=cameraPosition-p; float dist=max(length(toEye),.01);
        vec3 across=normalize(cross(along,toEye)+vec3(1e-6,0.,0.));
        float th=max(${fine}, 1.5*dist/(projectionMatrix[1][1]*uBufH*.5));
        // a streak is a glowing thread: the eye gets of it what it sees of its length (nothing of one seen end on)
        lit*=length(cross(along,toEye))/dist;
        // the medium's law, at the thread's nearest point to the lens (one number for the whole thread, so it thins as one)
        float nearD=length(toEye-along*clamp(dot(toEye,along), -.5*aRnd.x, .5*aRnd.x));
        lit*=smoothstep(${THREAD_NEAR_NONE.toFixed(1)},${THREAD_NEAR_FULL.toFixed(1)},nearD)*aRnd.w*(min(aRnd.y,th)/th)*(1.+uTwinkle*sin(uTime*(2.+aRnd.z)+aRnd.z*40.));
        vQ=aCorner; vCol=tint*lit;
        gl_Position=lit<=.0005 ? vec4(2.,2.,2.,1.) : projectionMatrix*viewMatrix*vec4(p+along*aCorner.x*aRnd.x*.5+across*aCorner.y*th*.5,1.);`;
    const dashMaterial = (vertexMain, uniforms, laws = '', fine = 'aRnd.y') => new THREE.ShaderMaterial({
      uniforms: { ...windU, uTwinkle: { value: 0.2 + 0.45 * mood }, ...uniforms },
      vertexShader: /* glsl */`attribute vec2 aCorner; attribute vec4 aRnd; uniform float uTwinkle; uniform vec3 uCol; varying vec3 vCol; varying vec2 vQ;
        ${WIND_GLSL}
        ${laws}
        void main(){ ${vertexMain} ${DASH_BODY(fine)} }`,
      fragmentShader: DASH_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    // THE LANE IN THE SHADER, for a set of dashes that carries `count` passes each (aPass0 and on: which copy of the
    // course, where on it the thread is nearest the route, how near, the two rates) and its own breadth (aFine). lanePass:
    // the light the lane leaves a thread whose middle stands at s on the course `code` and that reaches `reach` metres
    // either way along it: by its nearest end's distance from the route as the count has it. It reads the thread's
    // own place and numbers of the making; nothing of the eye.
    const LANE_GLSL = (count) => /* glsl */`
        attribute float aFine; attribute vec4 ${Array.from({ length: count }, (_, k) => 'aPass' + k).join(', ')};
        float lanePass(vec4 P, float code, float s, float reach){ float ds=max(abs(s-P.y)-reach,0.), rate=s<P.y ? floor(P.w)/${LANE_PACK.toFixed(1)} : fract(P.w);
          return abs(code-P.x)<.5 ? smoothstep(${NEAR_CLEAR.toFixed(1)},${NEAR_WHOLE.toFixed(1)},sqrt(P.z*P.z+rate*rate*ds*ds)) : 1.; }
        float lane(float code, float s, float reach){ return ${Array.from({ length: count }, (_, k) => `lanePass(aPass${k},code,s,reach)`).join('*')}; }`;
    // a thread's passes ([course, s, near, rates] each) into the set's table, the nearest first, `count` of them; what
    // the others leave of its light for its whole course is handed back
    const NO_PASS = [1e4, 0, NEAR_WHOLE, 0];
    const lanePut = (table, i, count, found) => {
      found.sort((a, b) => a[2] - b[2]); let rest = 1;
      for (let k = 0; k < Math.max(count, found.length); k++) { if (k < count) table.set(found[k] || NO_PASS, (i * count + k) * 4); else rest *= sstep(NEAR_CLEAR, NEAR_WHOLE, found[k][2]); }
      return rest;
    };
    // the lane's numbers as attributes of a set of n dashes, the same on a dash's four corners
    const laneAttributes = (g, n, count, fine, table) => {
      const f = new Float32Array(n * 4); for (let v = 0; v < n * 4; v++) f[v] = fine[v >> 2];
      g.setAttribute('aFine', new THREE.BufferAttribute(f, 1));
      for (let k = 0; k < count; k++) { const a = new Float32Array(n * 16);
        for (let i = 0; i < n; i++) { const o = (i * count + k) * 4; for (let v = i * 16; v < i * 16 + 16; v += 4) { a[v] = table[o]; a[v + 1] = table[o + 1]; a[v + 2] = table[o + 2]; a[v + 3] = table[o + 3]; } }
        g.setAttribute('aPass' + k, new THREE.BufferAttribute(a, 4)); }
    };
    {
      // the near sparks: the same wind seen close, fine gold dashes along the wind's own line, in a box 60 on a side.
      // THE LANE AND THE BREADTH BY PLACE, counted here once, after a spark's own seven draws (so the stream deals as
      // before): a spark lies on one ray from the star for its whole course on the clock, and so does every copy of it
      // in the box. Every route sample is counted against the copy of the ray nearest it (a sample farther from that
      // copy than FAR is past counting; near the moon, where the parting can carry the spark aside, than FAR_MOON);
      // each copy's passes by the route are the lane's (laneCount); the least distance of all the copies sets the
      // breadth: never broader than THREAD_FINE of it, never under THREAD_FINE of NEAR_CLEAR.
      const n = Math.round(3000 * detail * density), BOX = 60, FAR = 0.05 / THREAD_FINE + LANE_SLACK, FAR_MOON = Math.max(FAR, LANE_SEEK + 1.05 * R_MOON + 2);
      const moonA = (moonC.x - STAR[0]) / (moonC.z - STAR[2]) * 900, moonB = (moonC.y - STAR[1]) / (moonC.z - STAR[2]) * 900, ORIGIN = [0, 0, 0];
      const fine = new Float32Array(n), table = new Float32Array(n * LANE_NEAR * 4);
      // the route's across coordinates and each sample's reach, in boxes
      const fa = new Float64Array(NR), fb = new Float64Array(NR), fl = new Float64Array(NR);
      for (let j = 0; j < NR; j++) { fa[j] = ra[j] / BOX; fb[j] = rb[j] / BOX; fl[j] = (rm[j] > Z0 - 8 && rm[j] < Z1 + 8 ? FAR_MOON : FAR) * rk[j] / BOX; }
      // the copies of a spark's ray that the route comes near: each its number (cCode: m + 64 k), its boxes from the
      // dealt one (cM, cK) and the route samples within its reach (cList, cN of them)
      const cCode = [], cM = [], cK = [], cN = [], cList = [], dir = [0, 0, 0], found = [];
      const g = await dashGeometry(n, (p, r, i) => { p[0] = rNear() * BOX; p[1] = rNear() * BOX; p[2] = rNear() * BOX; r[0] = 0.3 + 0.5 * rNear(); r[1] = 0.03 + 0.02 * rNear(); r[2] = rNear() * 3; r[3] = 0.7 + 0.6 * rNear();
        const bx = p[0], by = p[1], ax = bx / BOX, ay = by / BOX; let nc = 0, least = Infinity; found.length = 0;
        for (let j = 0; j < NR; j++) {
          // which copy of the ray is nearest this sample (m, k boxes from the dealt one), and is the sample within reach of it
          const dx = fa[j] - ax, m = Math.floor(dx + 0.5); if (dx - m > fl[j] || dx - m < -fl[j]) continue;
          const dy = fb[j] - ay, k = Math.floor(dy + 0.5); if (dy - k > fl[j] || dy - k < -fl[j]) continue;
          const code = m + 64 * k; let c = 0; while (c < nc && cCode[c] !== code) c++;
          if (c === nc) { if (c === cList.length) cList.push(new Int32Array(NR)); cCode[c] = code; cM[c] = m; cK[c] = k; cN[c] = 0; nc++; }
          cList[c][cN[c]++] = j;
        }
        // the one copy that passes the moon nearest may be parted round it: between Z0 and Z1 of the moon along the wind
        const moonM = Math.floor((moonA - bx) / BOX + 0.5), moonK = Math.floor((moonB - by) / BOX + 0.5);
        for (let c = 0; c < nc; c++) {
          const ux = bx + cM[c] * BOX, uy = by + cK[c] * BOX, ul = Math.sqrt(ux * ux + uy * uy + 810000), from = found.length, byMoon = cM[c] === moonM && cK[c] === moonK;
          dir[0] = ux / ul; dir[1] = uy / ul; dir[2] = 900 / ul;
          least = Math.min(least, laneCount(ORIGIN, dir, 0, Infinity, byMoon ? outM + Z0 - 4 : 1, byMoon ? outM + Z1 + 4 : 0, cList[c], cN[c], found));
          for (let q = from; q < found.length; q++) found[q][0] = cCode[c];
        }
        r[3] *= lanePut(table, i, LANE_NEAR, found); fine[i] = Math.min(r[1], THREAD_FINE * Math.max(least, NEAR_CLEAR)); }, 2);
      laneAttributes(g, n, LANE_NEAR, fine, table);
      await ctx.yield();
      // the spark's place as the wind lays it (windPlace, written out: its wind coordinates w are the lane's: which
      // copy of its ray it is, and how far out from the star it stands)
      const near = new THREE.Mesh(g, dashMaterial(/* glsl */`
        vec3 e=toWind(cameraPosition), q=position; q.z+=uTime*${WIND.toFixed(1)};
        vec3 w=e+mod(q-e+${(BOX / 2).toFixed(1)}, ${BOX.toFixed(1)})-${(BOX / 2).toFixed(1)};
        vec3 p=partRound(fromWind(w)); vec3 along=normalize(p-uStar);
        float lit=3.*windLight(p)*lane(floor((w.x-position.x)/${BOX.toFixed(1)}+.5)+64.*floor((w.y-position.y)/${BOX.toFixed(1)}+.5), w.z, .5*aRnd.x); vec3 tint=uCol;`,
        { uCol: { value: new THREE.Vector3(gold.r, gold.g, gold.b) } }, LANE_GLSL(LANE_NEAR), 'aFine'));
      near.frustumCulled = false; near.renderOrder = 4; scene.add(near);
    }
    await ctx.yield();
    {
      // the wind's long streaks: the same wind between the far points and the near dashes, long thin gold threads
      // along the star's own rays in a box 190 on a side, so that the wind is seen to stream FROM the star: every
      // thread points at it, and their light is the wind's (stronger toward the star by the square of the distance).
      // KEPT OFF THE LINE BY PLACE (STREAK_CLEAR, STREAK_FULL): a thread lies on one ray from the star for its whole
      // course on the clock, and so does every copy of it in the box. So its least distance from the whole route is
      // counted here once, at the making: every copy of its ray against every 2 m of the route; and where its ray
      // passes the moon within the parting's reach, the thread as the parting lays it there (its middle carried
      // out, its length straight along the star's ray through that middle). That number alone sets its light.
      const n = Math.round(1500 * detail * density), BOX = 190;
      const FAR = Math.max(STREAK_FULL, THREAD_BROAD) + 0.25, reach = rk.map((k) => FAR * k);
      const moonA = (moonC.x - STAR[0]) / (moonC.z - STAR[2]) * 900, moonB = (moonC.y - STAR[1]) / (moonC.z - STAR[2]) * 900;
      await ctx.yield();
      const wrapBox = (d) => d - BOX * Math.round(d / BOX);
      // the least distance from the route of the thread whose ray has the across coordinates (bx, by), `len` metres long
      const leastFromRoute = (bx, by, len) => {
        let best = FAR * FAR;
        // the copy of this ray nearest the moon's own ray: is it within the parting's reach?
        const mux = moonA + wrapBox(bx - moonA), muy = moonB + wrapBox(by - moonB), mul = Math.hypot(mux, muy, 900);
        const parted = Math.hypot(mux - moonA, muy - moonB) * (outM + Z1) / 900 < PART_REACH + 2;
        for (let i = 0; i < NR; i++) {
          const dx = wrapBox(bx - ra[i]); if (dx > reach[i] || dx < -reach[i]) continue;
          const dy = wrapBox(by - rb[i]); if (dy > reach[i] || dy < -reach[i]) continue;
          const ux = ra[i] + dx, uy = rb[i] + dy;
          if (parted && rm[i] > Z0 - FAR && rm[i] < Z1 + FAR && Math.abs(ux - mux) < 1 && Math.abs(uy - muy) < 1) continue;   // counted below, as the parting lays it
          const ul = Math.hypot(ux, uy, 900), t = (rx[i] * ux + ry[i] * uy + rz[i] * 900) / ul;
          const qx = rx[i] - ux / ul * t, qy = ry[i] - uy / ul * t, qz = rz[i] - 900 / ul * t, d2 = qx * qx + qy * qy + qz * qz; if (d2 < best) best = d2;
        }
        if (parted) {
          const ux = mux / mul, uy = muy / mul, uz = 900 / mul, h = len * 0.5, reach2 = PART_REACH * PART_REACH;
          for (let s = outM + Z0 - 2 * FAR; s <= outM + Z1 + 2 * FAR; s += 2) {
            // the shader's partRound, for the thread's middle at s metres from the star
            let cx = STAR[0] + ux * s - moonC.x, cy = STAR[1] + uy * s - moonC.y, cz = STAR[2] + uz * s - moonC.z;
            const z = cx * mw.x + cy * mw.y + cz * mw.z, ox = cx - mw.x * z, oy = cy - mw.y * z, oz = cz - mw.z * z, r2 = Math.max(ox * ox + oy * oy + oz * oz, 1e-4);
            const g = sstep(-PART_BOW * R_MOON, -0.4 * R_MOON, z) * (1 - sstep(0.6 * R_MOON, PART_WAKE * R_MOON, z)), k = Math.sqrt((r2 + 1.1 * g * R_MOON * R_MOON * clamp(1 - r2 / reach2, 0, 1)) / r2) - 1;
            cx += ox * k + moonC.x - STAR[0]; cy += oy * k + moonC.y - STAR[1]; cz += oz * k + moonC.z - STAR[2];
            const cl = Math.hypot(cx, cy, cz), vx = cx / cl, vy = cy / cl, vz = cz / cl;
            for (let i = 0; i < NR; i++) { if (!(rm[i] > Z0 - FAR && rm[i] < Z1 + FAR)) continue;
              const ex = rx[i] - cx, ey = ry[i] - cy, ez = rz[i] - cz, a = clamp(ex * vx + ey * vy + ez * vz, -h, h);
              const qx = ex - vx * a, qy = ey - vy * a, qz = ez - vz * a, d2 = qx * qx + qy * qy + qz * qz; if (d2 < best) best = d2; }
          }
        }
        return Math.sqrt(best) - 0.25;   // the route is counted every 2 m: a quarter of a metre covers what lies between
      };
      const g = await dashGeometry(n, (p, r) => { p[0] = rStreak() * BOX; p[1] = rStreak() * BOX; p[2] = rStreak() * BOX; r[0] = 5 + 9 * rStreak(); r[1] = 0.05 + 0.05 * rStreak(); r[2] = rStreak() * 3; r[3] = 0.6 + 0.7 * rStreak();
        const least = leastFromRoute(p[0], p[1], r[0]), broad = r[1];
        r[1] = Math.min(broad, THREAD_FINE * Math.max(least, STREAK_CLEAR)); r[3] *= sstep(STREAK_CLEAR, STREAK_FULL, least) * r[1] / broad; }, 1);
      const streaks = new THREE.Mesh(g, dashMaterial(/* glsl */`
        vec3 p=windPlace(position, ${BOX.toFixed(1)}); vec3 along=normalize(p-uStar);
        float lit=2.6*windLight(p); vec3 tint=uCol;`, { uCol: { value: new THREE.Vector3(gold.r, gold.g, gold.b) } }));
      streaks.frustumCulled = false; streaks.renderOrder = 4; scene.add(streaks);
    }
    await ctx.yield();

    {
      // THE EMBER LANE: the edge of the world's shadow made visible. A sleeve round the shadow's black core, from
      // LANE_IN to LANE_OUT metres from the +Z axis and from z LANE_Z0 to LANE_Z1, in which the wind burns copper and
      // rose: the light of all this world's dusks, bent round it into the edge of its shadow. A set of its own, fixed
      // in the world, moved by the wind's law (along +Z, wrapped along the sleeve), lit by its own place only:
      // strongest at its core, 27 m from the axis, falling off outward as a bell LANE_SOFT metres broad and nothing at
      // LANE_OUT (no edge across its width); rising from z LANE_Z0 to LANE_RISE, and from z LANE_FULL thinning
      // steadily to nothing at LANE_Z1 (no end of it is an edge: it runs out thin where the moon stands).
      // IT RUNS IN STREAMS: the embers' strength goes in long skeins that wind round the sleeve and are carried along it
      // with the wind (a law of each ember's own place in the flow: three slow waves round and along the sleeve, their
      // phases from a stream of their own), so that the river is braided and no stretch of it is an even band.
      // Each ember is a long thin streak along the wind: broad in the picture from the side, next to nothing end on from afar.
      // Inside LANE_IN metres of the axis there is nothing. An ember is hidden only where the ball truly stands before
      // it (as the sparks are). THE ENTRY'S BEAD is kept BY PLACE: the sleeve has a gap where a sight line from the
      // entry's first stretch to the bead's disc crosses it (beadGap below; the law of the eye is not counted on for it).
      // The dark face on the last straight is kept by the sleeve's place: nothing of it within LANE_IN metres of the axis.
      // THE LANE AND THE BREADTH BY PLACE, as the near dashes have them (the route crosses the sleeve once, on the outward leg): an ember
      // runs along one line of the world for its whole course on the clock (its distance from the axis and its angle
      // round it are its own; z from LANE_Z0 to LANE_Z1), parted round the moon where the wind is. Counted once, after
      // the ember's own draws, against the route samples that stand within EMBER_FAR metres of the sleeve (as far as
      // the broadest ember's breadth is set by its distance, and 6 m more for what the parting can carry an ember aside).
      const n = Math.round(8000 * detail * density), span = LANE_Z1 - LANE_Z0, EMBER_FAR = 0.09 / THREAD_FINE + LANE_SLACK + 6;
      const fine = new Float32Array(n), table = new Float32Array(n * LANE_EMBER * 4), byRoute = [], AXIS = [0, 0, 1], course = [0, 0, -STAR[2]], found = [];
      for (let j = 0; j < NR; j++) { const off = Math.sqrt((rx[j] + STAR[0]) ** 2 + (ry[j] + STAR[1]) ** 2), z = rz[j] + STAR[2];
        if (off > LANE_IN - EMBER_FAR && off < LANE_OUT + EMBER_FAR && z > LANE_Z0 - EMBER_FAR && z < LANE_Z1 + EMBER_FAR) byRoute.push(j); }
      const partA = moonC.z + Z0 - 8, partB = moonC.z + Z1 + 8;   // the z between which the moon's parting can reach an ember
      const skein = [rStream() * Math.PI * 2, rStream() * Math.PI * 2, rStream() * Math.PI * 2], TAU = Math.PI * 2;
      const g = await dashGeometry(n, (p, r, i) => {
        p[0] = LANE_IN + (LANE_OUT - LANE_IN) * Math.pow(rEmber(), 1.5); p[1] = rEmber() * Math.PI * 2; p[2] = rEmber() * span;
        r[0] = 2.2 + 3.6 * rEmber(); r[1] = 0.04 + 0.05 * rEmber(); r[2] = rEmber() * 3; r[3] = 3 + 4 * rEmber();
        // the skeins: whole turns round the sleeve and whole waves along its length, so that the flow wraps without a seam
        const along = TAU * p[2] / span, s = 0.5 + 0.22 * Math.sin(2 * p[1] + 3 * along + skein[0]) + 0.18 * Math.sin(3 * p[1] - 5 * along + skein[1]) + 0.1 * Math.sin(p[1] + 8 * along + skein[2]);
        r[3] *= 0.3 + 1.9 * s * s;
        found.length = 0; course[0] = Math.cos(p[1]) * p[0] - STAR[0]; course[1] = Math.sin(p[1]) * p[0] - STAR[1];
        const least = laneCount(course, AXIS, LANE_Z0, LANE_Z1, Math.max(LANE_Z0, partA), Math.min(LANE_Z1, partB), byRoute, byRoute.length, found);
        r[3] *= lanePut(table, i, LANE_EMBER, found); fine[i] = Math.min(r[1], THREAD_FINE * Math.max(least, NEAR_CLEAR));
      }, 25);
      await ctx.yield();
      laneAttributes(g, n, LANE_EMBER, fine, table);
      await ctx.yield();
      const embers = new THREE.Mesh(g, dashMaterial(/* glsl */`
        float er=position.x, ez=${LANE_Z0.toFixed(1)}+mod(position.z+uTime*${WIND.toFixed(1)}, ${span.toFixed(1)});
        vec3 pw=vec3(cos(position.y)*er, sin(position.y)*er, ez), p=partRound(uWorld+pw), along=normalize(partRound(uWorld+pw+vec3(0.,0.,1.))-p);
        float k=clamp((er-${LANE_IN.toFixed(1)})/${(LANE_OUT - LANE_IN).toFixed(1)},0.,1.);
        float lit=1.35*smoothstep(${LANE_IN.toFixed(1)},${LANE_CORE.toFixed(1)},er)*exp(-k*k*${((LANE_OUT - LANE_IN) * (LANE_OUT - LANE_IN) / (LANE_SOFT * LANE_SOFT)).toFixed(2)})*(1.-smoothstep(.6,1.,k))
          *smoothstep(${LANE_Z0.toFixed(1)},${LANE_RISE.toFixed(1)},ez)*(1.-smoothstep(${LANE_FULL.toFixed(1)},${LANE_Z1.toFixed(1)},ez))
          *ballBefore(cameraPosition-uWorld, p-uWorld, uBallR)*beadGap(p-uWorld)*lane(0., ez, .5*aRnd.x);
        vec3 tint=mix(mix(vec3(1.,.5,.18), vec3(1.,.33,.34), smoothstep(0.,.45,k)), vec3(.8,.17,.1), smoothstep(.4,1.,k));`,
        { uEntryA: { value: path.posAtDist(0, new THREE.Vector3()).sub(worldC) }, uEntryB: { value: path.posAtDist(W.entryEnd, new THREE.Vector3()).sub(worldC) } }, /* glsl */`
        uniform vec3 uEntryA, uEntryB;   // the two ends of the entry's first stretch, from the world's centre
        // the sleeve's gap before the bead (GAP_CLEAR, GAP_FULL), for an ember at q from the world's centre: how far
        // from the centre the line from a place of the entry through q passes beyond q, the least of four such places
        float beadGap(vec3 q){ float m=1e9;
          for(int i=0;i<4;i++){ vec3 e=mix(uEntryA,uEntryB,float(i)/3.), d=q-e; float l=length(d); d/=l;
            m=min(m, dot(-e,d)>l ? length(cross(e,d)) : length(q)); }
          return smoothstep(uBallR+${GAP_CLEAR.toFixed(1)}, uBallR+${GAP_FULL.toFixed(1)}, m); }
        ${LANE_GLSL(LANE_EMBER)}`, 'aFine'));
      embers.frustumCulled = false; embers.renderOrder = 4; scene.add(embers);
    }
    await ctx.yield();

    // ================================================================ the two bodies
    // the storms' track of latitude is the one the low pass follows: the least and the most latitude of the ground
    // under the pass, from where it comes in to the line of dusk
    const spin = new THREE.Vector3().fromArray(SPIN_AXIS).normalize(); let trackLo = 90, trackHi = -90;
    for (let t = PASS.from; t <= 90; t += 5) { const lat = Math.asin(TAIL.passAt(t).normalize().dot(spin)) * 180 / Math.PI; trackLo = Math.min(trackLo, lat); trackHi = Math.max(trackHi, lat); }
    const hero = await buildHero(ctx, { radius: R_OPEN, limbDeg: 52, weather, density, spinAxis: SPIN_AXIS, whorlTrack: [trackLo, trackHi] });
    scene.add(hero.object);
    await ctx.yield();
    // the great arch's feet stand on the star's limb toward THE FAR TURN'S CENTRE in plan: the centre of the
    // circle through three places of that turn (its first knot, its apex and the place midway between them by way)
    const turnCentre = (() => { const A = path.posAtDist(W.farIn, new THREE.Vector3()), B = path.posAtDist(0.5 * (W.farIn + W.farApex), new THREE.Vector3()), C = path.posAtDist(W.farApex, new THREE.Vector3());
      const a2 = A.x * A.x + A.z * A.z, b2 = B.x * B.x + B.z * B.z, c2 = C.x * C.x + C.z * C.z, d = 2 * (A.x * (B.z - C.z) + B.x * (C.z - A.z) + C.x * (A.z - B.z));
      return new THREE.Vector3((a2 * (B.z - C.z) + b2 * (C.z - A.z) + c2 * (A.z - B.z)) / d, 0, (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d); })();
    // the whole route, every 2 m, in the star's frame: the arch keeps GREAT.clear metres from all of it
    const routePlaces = []; for (let i = 0; i <= NP; i += 4) routePlaces.push(new THREE.Vector3(px[i] - STAR[0], py[i] - STAR[1], pz[i] - STAR[2]));
    await ctx.yield();
    const star = await buildStar(ctx, { radius: R_STAR, temper, worldCentre: worldC, worldRadius: R_WORLD,
      great: { foot: turnCentre.clone().sub(starC).setY(0).normalize(), height: GREAT.height, reach: GREAT.reach, clear: GREAT.clear, places: routePlaces },
      // THE CROWN'S QUIET SIDE (the join sheet's law of this world's entry: one dark bead on the star's face, and no
      // second dark body against the crown): the sector of the crown toward the moon's side of the shadow's axis
      quiet: TAIL.out });
    star.object.position.copy(starC); scene.add(star.object);
    await ctx.yield();
    // the moon of ice, standing still inside the last turn in the outer shade of the world
    const moon = await buildMoon(ctx, { radius: R_MOON, starCentre: starC, starRadius: R_STAR, worldCentre: worldC, worldRadius: R_WORLD, laneCore: LANE_CORE, laneFull: LANE_FULL, laneZ1: LANE_Z1 });
    moon.object.position.copy(moonC); scene.add(moon.object);
    await ctx.yield();

    const size = new THREE.Vector2();
    return {
      scene, path, duration: DURATION, moon: { centre: moonC, radius: R_MOON }, pace, pois,
      camera: { fov: 62, near: 0.5, far: 4000, lookAhead: LOOK_AHEAD, sway: 0.4, bank: 0.2 },
      // the join sheet's EXIT of 7, field by field: the world's night face
      portal: { shape: 'circle', radius: 24, style: 'corona', halo: false, color: '#BFD8FF', glow: 1, revealDistance: 170, blendDistance: 25 },
      post: { exposure: 1.0, bloom: { strength: 0.35, radius: 0.5, threshold: 1.0 }, grade: { saturation: 1.05, vignette: 0.2, grain: 0.02 } },
      update(dt, time, camera) {
        uTime.value = time;
        uBufH.value = ctx.renderer.getDrawingBufferSize(size).y;
        hero.update(dt, time, camera); star.update(dt, time, camera); moon.update(dt, time, camera);
      },
    };
  },
};
