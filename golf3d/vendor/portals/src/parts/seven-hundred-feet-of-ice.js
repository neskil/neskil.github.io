// Seven Hundred Feet of Ice: the hero set piece and the plan of the place.
//
// The wall of ice runs along X through z = 0 (north is -Z): 213 m high, 14 m wide on top, each face leaning back so the
// foot is 46 m thick. This module holds
//   icePlan(seed, vary)   the whole layout by arithmetic (no picture): the hour, the hand, the road, the route, the castle,
//                         the stair, the cage, what stands on the top, the forests, the grove; every thing tested against
//                         the route at every 2 m with its own measures
//   the makers            the wall (faces, top, lip), the stair, the cage on its chain, what stands on the top, the castle's
//                         towers and halls, the men in black and their riders, the white red-leaved trees' palette,
//                         the ground, flames, spindrift, the sifting snow of the wall's lee, the small falls of ice
//   buildHero(ctx, opts)  the wall alone with its stair, cage and top, for the set-piece viewer
// The plan is drawn in a canonical hand (the visitor travels east along the top); the world mirrors x by plan.hand.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, makeNoise, clamp, lerp, smoothstep } from '../kit/core.js';
import * as flora from '../kit/flora.js';

// (the film is 50 s long: round 4 mending 1; it was 56 s through round 4)
export const WALL_H = 213, TOP_HALF = 7, BATTER = 0.075, DURATION = 50;
// the grove's avenue (metres of the grove's own axis from where the wood opens to the ring) and the ring's own radius
export const AVENUE = 126, RING_R = 7.5;
// how far behind its first point the entry's straight is kept clear and the ground under it kept below the eye
export const BACK = 300;
export const ROAD_HALF = 3, EYE = 2.5;
// THE CLEARANCE OF A STANDING THING THAT IS BUILT OR LIES (a tower, a hall, a stone, a block of ice, a column of smoke):
// its own form, taken a little full, stands MADE metres and more from the line: the law's 2.5 m and half a metre. No
// thing of these kinds is asked for more than this anywhere (round 4 asked 6 to 12 m of the towers, the halls and the
// smoke; that is struck: on seeds 1 to 100 it left out 51 halls, 20 towers and 73 columns of smoke).
const MADE = EYE + 0.5;
// the leaving of the top: the metres over which the nose goes down to the descent's slope, and those of the heading's swing
const LEAVE = 500, LEAVE_TURN = 400;
const DEG = Math.PI / 180;
// the south face's z at height y, without its relief (the north face is the mirror image)
export const faceZ = (y) => TOP_HALF + (WALL_H - clamp(y, 0, WALL_H)) * BATTER;

// ---------------------------------------------------------------------------------------------------------------------
// the plan
// ---------------------------------------------------------------------------------------------------------------------
// the plan in steps: a step ends at every `yield`, so a build can hand the page back between them
export function* icePlanSteps(seed, vary = {}) {
  const S = (name) => makeRng(hashSeed(name + ':' + seed));
  // every stream of the plan, taken here in one list before anything is drawn
  const R = {
    hour: S('ice-hour'), hand: S('ice-hand'), sun: S('ice-sun'), road: S('ice-road'), route: S('ice-route'), castle: S('ice-castle'),
    towers: S('ice-towers'), halls: S('ice-halls'), stair: S('ice-stair'), cage: S('ice-cage'), top: S('ice-top'), sentries: S('ice-sentries'),
    riders: S('ice-riders'), climbers: S('ice-climbers'), forestS: S('ice-forest-south'), forestN: S('ice-forest-north'), trunks: S('ice-trunks'),
    groveFill: S('ice-grove-fill'), outliers: S('ice-grove-outliers'), forestM: S('ice-forest-mid'), mid: S('ice-grove-mid'), elk: S('ice-elk'), ravens: S('ice-ravens'), falls: S('ice-falls'),
    weather: S('ice-weather'), cloud: S('ice-cloud'), sentryAt: S('ice-sentry-at'), fork: S('ice-fork'), holdfast: S('ice-holdfast'), stumps: S('ice-stumps'), block: S('ice-block'), ways: S('ice-ways'), face: S('ice-face-things'), spin: S('ice-spindrift'), sheds: S('ice-snow-sheds'), farS: S('ice-far-south'), farN: S('ice-far-north'), yard: S('ice-yard'), rocks: S('ice-rocks'),
    // (round 3: the things of the descent and of the ring's approach, each from a stream of its own)
    footIce: S('ice-foot-ice'), beltRocks: S('ice-belt-rocks'), beltWood: S('ice-belt-wood'), northFace: S('ice-north-face'),
    // (round 4: the avenue's great trees, the talus at the north foot, the river, the far mountains, the lights of doors and landings)
    avenue: S('ice-avenue'), talus: S('ice-talus'), river: S('ice-river'), mountains: S('ice-mountains'),
    // (round 4 mending 1: the stumps of the way's verges in the wood)
    verge: S('ice-way-verge'),
    // (round 4 mending 2: the castle's threshold, and the place and facing of the way to the grove)
    ward: S('ice-ward'), grovePlace: S('ice-grove-place'),
    // (round 4 mending 2, the way to the grove as a kept way: the old trunks at its two edges in the wood, the young
    // spruce of its verges, its waymarks)
    wayEdge: S('ice-way-edge'), waySpruce: S('ice-way-spruce'), wayMark: S('ice-way-mark'),
  };
  const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
  const noise = makeNoise(hashSeed('ice-land:' + seed));
  const P = { seed, density, rare, R, noise, gaps: {}, dropped: {} };

  // the hour: the viewer's wish if there is one, else the seed's own
  const hd = R.hour();
  P.hour = vary.hour && vary.hour !== 'any' ? vary.hour : hd < 0.46 ? 'day' : hd < 0.68 ? 'golden' : hd < 0.82 ? 'dawn' : 'night';
  P.hand = R.hand() < 0.5 ? -1 : 1;
  // the key light stands in the south, off to the side the visitor travels along the top (canonical: east, +x). The day
  // is a LOW SUN late on a clear cold day: 11 to 13.5 degrees up, 38 to 58 degrees off the road's own line
  const sa = R.sun(), sb = R.sun();
  const off = P.hour === 'day' ? lerp(38, 58, sa) : P.hour === 'golden' ? lerp(52, 70, sa) : P.hour === 'dawn' ? lerp(55, 72, sa) : lerp(18, 42, sa);
  const el = P.hour === 'day' ? lerp(11, 13.5, sb) : P.hour === 'golden' ? lerp(5.5, 8.5, sb) : P.hour === 'dawn' ? lerp(4, 6, sb) : lerp(30, 38, sb);
  P.sunOff = off; P.sunEl = el;
  // canonical direction toward the light (the world mirrors x)
  P.sunDir = [Math.sin(off * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), Math.cos(off * DEG) * Math.cos(el * DEG)];
  const wa = R.weather(), wb = R.weather(), wc = R.weather();
  P.cloud = lerp(0.3, 0.55, wa); P.cloudSpeed = lerp(9, 16, wb); P.snowfall = lerp(0.7, 1.2, wc);
  // where the cloud shadows lie at any clock differs from world to world: the field's own offsets along the wall and across it
  // (in the field's own units, one unit about 590 m along and 435 m across), from the stream ice-cloud
  P.cloudPh = [R.cloud.range(0, 64), R.cloud.range(0, 64)];

  planLand(P);
  planPlaces(P);
  yield;
  yield* planRoute(P);
  yield;
  planTests(P);
  yield;
  planGround(P);
  yield;
  yield* planCastle(P);
  yield;
  planRoad(P);
  yield;
  planStair(P);
  yield;
  yield* planTop(P);
  yield;
  yield* planForests(P);
  yield* planLife(P);
  // (the high ground's sheet is worked out last: it draws no number and nothing of the plan above asks it)
  yield* planHigh(P);
  const M = P.M, L = P.L;
  // THE PULLS OF THE GAZE, each toward a standing place and over a stretch of the line counted in metres from named places
  // (no share of the flight is typed here; no two of them pull at once):
  // 1 on the climb, toward the far country south-east of the wall, 40 m up: a place 1,700 m east of the slant's start
  //   and 520 m south of the climb's line (from 60 m before the line comes abeam of the face to 30 m before it comes
  //   level with the lip)
  // 2 over the lip, toward the snow 140 m south of the south foot, 520 m east of where the line crosses the top (from
  //   30 m before the line comes level with the lip to where it passes over the top's middle: three seconds and more
  //   at the pace flown there; it takes over where the first leaves off)
  // 3 past the top's middle, toward the wood 620 m north of the wall, 1,300 m east of where the line leaves the top
  //   (from where the line passes over the top's middle to 60 m after it begins to sink; it comes on over 140 m and
  //   more)
  // Each place is measured from the wall and the line's own named places; none was taken from a picture.
  // EACH PULL COMES ON AND GOES OFF OVER METRES OF ITS OWN (round 4 mending 2): the first and the second over FADE_M
  // metres at each end (a share of 0.3 of their stretches gave 100 to 115 m, flown in 1.27 to 1.57 s once the film went
  // faster up the face; 150 m is flown in 1.8 s and more at the fastest pace there), the third over 0.45 of its
  // stretch as before (2.17 s and more). As flown: m2-cam.mjs.
  const FADE_M = 150, fadeOf = (a, b) => Math.min(0.5, FADE_M / (b - a));
  P.pois = [
    { at: [P.xTop0 + 1700, 40, P.zClimb + 520], from: (M.face - 60) / L, to: (M.lip - 30) / L, weight: 0.7, fade: fadeOf(M.face - 60, M.lip - 30) },
    { at: [P.xCross + 520, 0, faceZ(0) + 140], from: (M.lip - 30) / L, to: M.cross / L, weight: 0.25, fade: fadeOf(M.lip - 30, M.cross) },
    { at: [P.xOff + 1300, 0, -620], from: M.cross / L, to: (M.off + 60) / L, weight: 0.4, fade: 0.45 },
  ];
  return P;
}
// the whole plan at once (the replay's way)
export function icePlan(seed, vary = {}) {
  const it = icePlanSteps(seed, vary); let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

// the ground's height: slow hills, flattened where men have built, an apron of fallen ice at the wall's foot, the open belt
// of drifted snow north of the wall, the grove's hollow
function planLand(P) {
  const n = P.noise, r = P.R.road;
  // (the road's head, where the visitor comes in, lies 510 to 540 m south of the wall's middle: round 4 mending 1; it lay
  // at 690 to 720 m, and a film of 50 s could not fly that road, the grove's walk and the turns' law together)
  const A = r.range(6, 11), w1 = r.range(70, 95), ph = r.range(0, 6.28), z0 = r.range(510, 540);
  P.zStart = z0; P.zGate = faceZ(0) + 1; P.roadNums = [A, w1, ph, z0];
  // the road's middle line: x at z (canonical). Straight for its first 80 m and where it enters the castle
  P.roadX = (z) => A * Math.sin((z - 215) / w1 + ph) * smoothstep(z0 - 70, z0 - 190, z) * smoothstep(228, 320, z);
  // the riders' way leaves the road at a fork before the place the visitor comes in by, and runs off south-east through the
  // wood: its x at z is the road's right half plus a branch that swings away from the fork (soft: no corner at the fork)
  const rf = P.R.fork, zf = z0 - rf.range(105, 135), fa = rf.range(32, 40) * DEG, fT = Math.tan(fa);
  P.fork = { z: zf, tan: fT, cos: Math.cos(fa), soft: 25, len: 340 };
  P.forkX = (z) => { const u = Math.max(z - zf, 0); return P.roadX(z) + 2.7 + fT * u * u / (u + 25); };
  // how far a place lies from the middle of that side track (99 north of the fork)
  P.forkGap = (x, z) => (z > zf + 6 ? Math.abs(x - P.forkX(z)) * P.fork.cos : 99);
  P.hills = (x, z) => 5.5 * n.fbm2(x * 0.0035 + 3.1, z * 0.0035 - 1.7, 3) + 1.2 * n.n2(x * 0.017, z * 0.017);
  // THE ROAD IS GRADED (round 4 mending 2): a made road does not ride every swell of the land. Its bed's height at a
  // place is the land's long swell along the road's own middle line taken level over BED_SPAN metres of the road (its
  // mean from half that behind to half that ahead), so that the bed's slope changes slowly on every seed. (Mending 1's
  // bed took the swell as it lay: on one seed in three hundred it rose 9 m in 107 m just where the line begins its own
  // rise, and the nose went up ten degrees in under a second and a half.) P.bedY: the bed's height at z, from a table
  // worked out once, every 6 m from the gate to 260 m south of the road's head
  const BED_SPAN = 180, swell = (z) => 5.5 * n.n2(P.roadX(z) * 0.0035 + 3.1, z * 0.0035 - 1.7), bedT = [];
  for (let z = 0; z <= z0 + 266; z += 6) { let sum = 0; for (let k = -6; k <= 6; k++) sum += swell(z + k * BED_SPAN / 12); bedT.push(sum / 13); }
  P.bedY = (z) => { const u = clamp(z / 6, 0, bedT.length - 1.001), i = Math.floor(u); return lerp(bedT[i], bedT[i + 1], u - i); };
  // the wood north of the wall is cut back a long way: its edge at x, RAGGED (bays and headlands some hundreds of metres
  // long and up to 80 m deep, lesser ones on them), never nearer the wall's middle than 204 m
  P.edgeZ = (x) => -(290 + 40 * n.n2(x * 0.006 + 71.3, 3.3) + 32 * n.n2(x * 0.021 + 5.7, 9.1) + 14 * n.n2(x * 0.058 + 2.3, 4.4));
  P.groundAt = (x, z) => {
    const az = Math.abs(z), south = z > 0;
    let h = P.hills(x, z);
    if (south) {
      // the castle's yard and the road's bed lie nearly level
      const yard = smoothstep(300, 215, z) * (1 - smoothstep(170, 260, Math.abs(x)));
      const rx = P.roadX(z), dr = Math.abs(x - rx), bed = 1 - smoothstep(ROAD_HALF + 1, ROAD_HALF + 9, dr), flat = Math.max(bed, yard * 0.85);
      if (flat > 0) h = lerp(h, P.bedY(z), flat);
      h -= 0.35 * (1 - smoothstep(ROAD_HALF - 0.6, ROAD_HALF + 0.8, dr)) * smoothstep(P.zGate, P.zGate + 20, z);
      if (z > zf) h -= 0.3 * (1 - smoothstep(1.3, 2.6, P.forkGap(x, z)));
    } else {
      // the open belt: long drifts and wind-carved ridges lying along the wind, dying out at the wood's edge
      // (the edge is never farther than 376 m)
      const ez = az < 480 ? P.edgeZ(x) : 0, belt = az < 480 ? smoothstep(faceZ(0) + 14, faceZ(0) + 70, az) * smoothstep(ez - 30, ez + 50, z) : 0;
      if (belt > 0) h += belt * (2.1 * n.n2(x * 0.011 + 5, z * 0.021 + 31) + 0.8 * n.n2(x * 0.021 + 9, z * 0.05 - 4));
    }
    // the apron: snow and fallen ice banked against the foot of the wall
    const f = az - faceZ(0);
    if (f > 200) return h;   // (beyond 200 m the banks are about a hundredth of a millimetre high)
    h += 7.5 * Math.exp(-Math.max(f, 0) / 15) * (0.75 + 0.25 * n.n2(x * 0.03, 9.3 + (south ? 0 : 5))) * (south ? smoothstep(7, 19, Math.abs(x)) : 1);
    // north: the snow that pours off the lip lies heaped along the foot
    if (!south) h += 6.5 * Math.exp(-Math.max(f, 0) / 11) * smoothstep(-0.15, 0.55, n.n2(x * 0.045 + 13, 21.7));
    return h;
  };
}

// THE PLACES OF THE PLAN THAT STAND BEFORE THE LINE (round 4 mending 2). Each is set by the wall's own measure (metres
// east of the gate's meridian along the wall, metres out from its foot), by the land (the wood's edge) and by draws of
// its own. The line is laid AFTER them and TO them (planRoute) and has no say in where any of them lies.
function planPlaces(P) {
  // THE CASTLE'S THRESHOLD: where the road comes in among the first halls, on the gate's meridian, 204 to 220 m south of
  // the wall's middle. The three towers that mark it are set about it (planCastle).
  P.ward = { x: 0, z: P.R.ward.range(204, 220) };
  // THE MANNED STRETCH of the wall's top: from 16 m west of the gate's meridian to 1,450 m east of it the top is kept
  // and furnished (planTop), and the snow blows off its lip in plumes; beyond it the top lies bare.
  P.manned = { x0: -16, x1: 1450 };
  // WHAT LIES AT THE WALL'S NORTHERN FOOT, by the wall's own measure (metres east of the gate's meridian):
  // THE TALUS: a great fall of ice lies heaped against the north foot, its middle 1,665 to 1,695 m east of the gate,
  // 300 to 380 m long along the foot and reaching 78 to 96 m out at its middle, 11 to 15 m deep there (its blocks are
  // dealt with the forests, each tested like every other thing)
  const rtl = P.R.talus, rrv = P.R.river, nz = P.noise;
  const tal = P.talus = { x: rtl.range(1665, 1695), half: rtl.range(150, 190), out: rtl.range(78, 96), deep: rtl.range(11, 15) };
  // (how far out from the foot the heap reaches at x, and how deep it lies at a place)
  tal.reach = (x) => { const u = (x - tal.x) / tal.half; return u * u < 1 ? tal.out * Math.pow(1 - u * u, 0.7) : 0; };
  tal.at = (x, z) => { const o = tal.reach(x); if (o <= 0 || z > 0) return 0; const f = -z - faceZ(0), u = (x - tal.x) / tal.half; return tal.deep * (1 - u * u) * (1 - smoothstep(0.1 * o, o, f)) * (0.8 + 0.3 * nz.n2(x * 0.05, z * 0.05 + 3)); };
  // THE FROZEN RIVER: it comes out from under the talus's toe and runs north-east across the open belt into the wood,
  // then north, winding wider, to the edge of sight: its middle's x at z, its half width there (9 m at its head, 3.2 m more
  // in every 100 m, 70 m at the most), and how far a place lies from its middle (measured square to its run). It runs
  // east of the low line and of the grove all the way (counted: the report gives the least distances)
  const rv = P.river = { x: tal.x + rrv.range(-10, 20), z: -(faceZ(0) + 0.9 * tal.out), k: rrv.range(1.0, 1.3), A: rrv.range(70, 105), w: rrv.range(130, 170), ph: rrv.range(0, 6.28) };
  const rvU = (z) => Math.max(-z + rv.z, 0), rvWide = (u) => rv.A * smoothstep(150, 700, u);
  P.riverX = (z) => { const u = rvU(z); return rv.x + 600 * rv.k * (1 - Math.exp(-u / 600)) + rvWide(u) * (Math.sin(u / rv.w + rv.ph) + 0.35 * Math.sin(u / (0.41 * rv.w) + 2.1 * rv.ph)); };
  P.riverHalf = (z) => Math.min(9 + 0.032 * rvU(z), 70);
  P.riverGap = (x, z) => { if (z > rv.z) return Math.hypot(x - rv.x, z - rv.z); const sl = (P.riverX(z - 1) - P.riverX(z + 1)) / 2; return Math.abs(x - P.riverX(z)) / Math.sqrt(1 + sl * sl); };
  // (nothing stands in its bed or on its banks: r is a thing's own reach)
  P.inRiver = (x, z, r) => z < rv.z + 8 + r && P.riverGap(x, z) < P.riverHalf(z) + 2.5 + r;
  // THE HIGH GROUND OF THE NORTH: beyond 1.3 km the land rises in long wooded ridges on either side of the river's
  // valley, and beyond 3.4 km in mountains (to some 900 m), which stand in the sun beyond the reach of the wall's shadow
  const mo = P.R.mountains, mh = [mo.range(0, 50), mo.range(0, 50), mo.range(0, 50)], xcH = 1530;
  P.highAt = (x, z) => {
    if (z > -1300) return 0;
    const v = smoothstep(160, 1100, Math.abs(x - P.riverX(z))), tx = 1 - smoothstep(4200, 5400, Math.abs(x - xcH));
    const foot = smoothstep(1300, 3000, -z) * (34 + 150 * nz.ridged2(x * 0.00042 + mh[0], z * 0.0013 + mh[1], 3)) * v;
    const peak = smoothstep(3400, 5000, -z) * (1 - 0.7 * smoothstep(6000, 7000, -z)) * (200 + 720 * Math.pow(nz.ridged2(x * 0.00036 + mh[2], z * 0.00044 + mh[0], 4), 1.5)) * (0.2 + 0.8 * v);
    return (foot + peak) * tx;
  };
  P.highBox = { x0: xcH - 5400, x1: xcH + 5400, z0: -7000, z1: -1200 };
  { const g2 = P.groundAt; P.groundAt = (x, z) => { const h = g2(x, z); if (z > -faceZ(0) + 2) return h; const d = z < rv.z + 12 ? P.riverGap(x, z) - P.riverHalf(z) : 99; return h + tal.at(x, z) - (d < 4 ? 1.1 * (1 - smoothstep(-1, 4, d)) * smoothstep(rv.z + 12, rv.z - 6, z) : 0); }; }
  // THE GROVE AND THE WAY TO IT. A kept way leaves the wall's northern foot and runs straight to the ring; its axis is
  // laid by three draws of its own: where it crosses the latitude 300 m north of the wall's middle (about where the
  // wood begins), 10 m east to 40 m west of the talus's middle; its facing, 62 to 78 degrees north of the wall's own line
  // (eastward); and how far it runs through the dark wood before the grove's avenue begins, 84 to 104 m.
  const rg = P.R.grovePlace, xw = tal.x - rg.range(-10, 40), aS = rg.range(62, 78) * DEG, Lw = rg.range(84, 104);
  const d = [Math.cos(aS), -Math.sin(aS)], zw = -(faceZ(0) + 44), tw = (zw + 300) / -d[1], A = [xw - d[0] * tw, zw];
  // (the way's foot A is at the toe of the wall's northern apron; C is where the way has come 10 m inside the wood's
  // edge; F is where the avenue begins and E the ring's middle, AVENUE metres on)
  let tc = 0; while (tc < 600 && A[1] + d[1] * tc > P.edgeZ(A[0] + d[0] * tc) - 10) tc += 2;
  const C = [A[0] + d[0] * tc, A[1] + d[1] * tc], F = [C[0] + d[0] * Lw, C[1] + d[1] * Lw], E = [F[0] + AVENUE * d[0], F[1] + AVENUE * d[1]];
  P.axis = { a: A, c: C, d, aS, Lw };
  const pc = [E[0] - 60 * d[0], E[1] - 60 * d[1]];
  // the grove's middle lies on the avenue, 60 m before the ring (r: how far its thickest fall of leaves reaches)
  P.grove = { x: pc[0], z: pc[1], r: P.R.mid.range(18.5, 23), y: 0, F, E }; P.grove.y = P.hills(pc[0], pc[1]) - 1.2;
  // the grove lies in a gentle hollow about the avenue
  const g1 = P.groundAt, fe = [E[0] - F[0], E[1] - F[1]];
  P.groundAt = (x, z) => {
    const h = g1(x, z); if (z > -150) return h;
    const t = clamp(((x - F[0]) * fe[0] + (z - F[1]) * fe[1]) / (AVENUE * AVENUE), 0, 1.25), k = 1 - smoothstep(58, 135, Math.hypot(x - F[0] - fe[0] * t, z - F[1] - fe[1] * t));
    return lerp(h, P.grove.y + 0.7 + 0.14 * (h - P.grove.y), k);
  };
  // (the ring stands 1.3 m clear of the snow)
  P.ring = { x: E[0], y: P.grove.y + 0.7 + RING_R + 1.3, z: E[1], dir: d, r: RING_R };
  // the box the red leaves fall in: over the whole avenue and the ring, 32 m to every side of them, 26 m high
  P.leaves = { center: [(E[0] + F[0]) / 2, P.grove.y + 13, (E[1] + F[1]) / 2], box: [Math.abs(E[0] - F[0]) + 64, 26, Math.abs(E[1] - F[1]) + 64] };
  // THE FINE GROUND NORTH OF THE WALL lies about the made ways: the wall's northern apron for 180 m west of the way's
  // foot, and the way itself to 84 m east of the ring and 96 m north of it
  P.patchN = { x0: A[0] - 180, x1: E[0] + 84, z0: E[1] - 96, z1: -30 };
}

// the route (canonical hand), its samples at every 2 m, the metres of its places and its pace
function* planRoute(P) {
  const r = P.R.route, H = WALL_H, side = -1.8, zs = P.zStart;
  // the road's bed lies level for its first 100 m (the first 60 m of the line are level and straight)
  const g0 = P.groundAt;
  const yBed = g0(side, zs - 100);
  P.groundAt = (x, z) => { const h = g0(x, z); return z > zs - 140 && Math.abs(x) < 240 ? lerp(h, yBed + (h - g0(P.roadX(z), z)) * 0.6, smoothstep(zs - 140, zs - 100, z) * (1 - smoothstep(60, 240, Math.abs(x)))) : h; };
  const g = (x, z) => P.groundAt(x, z);
  const pts = [];
  // 1 the road, a rider's eye over its left half
  for (const d of [0, 30, 60, 90]) pts.push([side, yBed + 3.3, zs - d]);
  // (the line keeps the road's left half, or its left verge, to some 400 m south of the wall's middle; the riders pass
  // on the right. THE ROOM IT HAS: from 1.45 m left of the bed's middle (the riders' heads stay 3 m off) to 2.5 m beyond
  // the bed's left edge; within that room it takes the road's bends as wide as it can: the smoothest curve that keeps
  // inside it, found by easing a string of points, one every 13 m, toward the least bending, 1500 times)
  // (it begins to rise 60 m before it leaves the road: from 3.4 m to 8.6 m over the ground across 140 m)
  let zr = zs - 116; while (zr - 26 > 396) zr -= 26;
  const rise = (z) => lerp(3.4, 8.6, smoothstep(zr + 60, zr - 80, z));
  const zl = []; for (let z = zs - 103; z > zr - 1; z -= 13) zl.push(z);
  const nl = zl.length, xl = zl.map((z) => P.roadX(z) + side), xlo = zl.map((z) => P.roadX(z) - (ROAD_HALF + 2.5)), xhi = zl.map((z) => P.roadX(z) - 1.45);
  for (let it = 0; it < 1500; it++) {
    for (let i = 0; i < nl; i++) {
      // (behind the first of them the line is straight; beyond the last it runs on as it goes)
      const a = i > 1 ? xl[i - 2] : side, b = i > 0 ? xl[i - 1] : side, c = i < nl - 1 ? xl[i + 1] : 2 * xl[i] - b, d = i < nl - 2 ? xl[i + 2] : 2 * c - xl[i];
      xl[i] = clamp(xl[i] - 0.06 * (a - 4 * b + 6 * xl[i] - 4 * c + d), xlo[i], xhi[i]);
    }
    if (it % 300 === 299) yield;
  }
  // 2 into the castle, then a wide right-hand arc up to a line that stands off the south face by a quarter of its height
  //   and more (56 to 64 m at the arc's end), and up beside the face on that line: STRAIGHT in plan and parallel to the
  //   wall, so that the horizon lies level all the way up
  // (every number of the line is drawn here, in its old order; sC0, LS, LN and sN0 are WISHES: see the fit below)
  const yg = g(0, 215), sC0 = r.range(0.5, 0.58), lift = r.range(0, 5), Rt = r.range(128, 142), offC = r.range(56, 64);
  const LS = r.range(85, 105), LN = r.range(70, 95), beta0 = r.range(17, 22) * DEG, sN0 = r.range(0.42, 0.5), Rd = r.range(165, 190);
  const y1 = yg + 78 + lift, zc = faceZ(y1) + offC, x0 = side * 0.7, Zt = zc + Rt, x1 = x0 + Rt;
  // THE LINE IS LAID TO THE GROVE (round 4 mending 2). The grove, the way to it and the way's axis stand in the plan
  // before this (planPlaces); the line's last straight must lie on that axis. Three of the line's own measures give:
  // the climb's slope (0.47 to 0.60; its drawn wish is 0.5 to 0.58), the length of the slant along the top (295 to
  // 360 m; wish 305 to 350) and the length of the descent's straight (110 to 180 m; its wish is what the drawn slope
  // would give). ONE number mu, from -1 to 1, moves all three together from their wishes toward the bounds that carry
  // the low turn's end east (mu over 0) or west (under 0); that end crosses the axis steadily eastward as mu grows, so
  // mu is found by halving. The descent's slope is then what brings it down to 38 m over the ground under the low turn.
  // A FOURTH gives only where the low turn would end more than 40 m past the place where the way enters the wood (the
  // turn would be flown among the trees beside the way): the descent's heading, drawn 17 to 22 degrees north of the
  // wall's own line, is taken lower, to 13 degrees at the least, until the turn ends 40 m past that place.
  // COUNTED on seeds 1 to 300 (m2-facts.mjs): the line's last straight lies on the axis on every seed (to a millimetre);
  // the climb's slope comes to 0.49 to 0.59, the slant to 306 to 351 m, the descent's straight to 113 to 179 m and its
  // slope to 0.42 to 0.50; the heading is lowered on 14 seeds, to 17.0 degrees at the least; the low turn ends from
  // 106 m before the way enters the wood to 40 m past that place.
  const yTopC = H - 60, zS = TOP_HALF + 5.4, zN = -(TOP_HALF + 5.2), yS = H + 7.6, yM = H + 8.2;
  const ax = P.axis, aS = ax.aS, Dt0 = LS + 150 + LN;
  const lay = (mu, more, beta) => {
    const k = Math.abs(mu), sC = lerp(sC0, mu > 0 ? 0.47 : 0.6, k), Dt = lerp(Dt0, mu > 0 ? 360 : 295, k) + more;
    const th0 = Math.atan((zS - zN) / Dt), cb = Math.cos(beta), sb = Math.sin(beta);
    let px = x1 + (yTopC - y1) / sC + 2 * (yS + 1 - yTopC) / sC + 80 + Dt, pz = zN;
    for (let run = 1; run <= LEAVE; run++) { const th = lerp(th0, beta, smoothstep(0, LEAVE_TURN, run)); px += Math.cos(th); pz -= Math.sin(th); }
    const drop = yS - 38 - (P.hills(px + 330 * cb, pz - 330 * sb) + 1), runD = lerp(clamp(drop / sN0 - (LEAVE + 1) / 2, 110, 180), mu > 0 ? 180 : 110, k);
    const gx = px + runD * cb + Rd * (Math.sin(aS) - sb), gz = pz - runD * sb + Rd * (Math.cos(aS) - cb);
    return { mu, more, beta, sC, Dt, runD, sN: drop / ((LEAVE + 1) / 2 + runD), miss: (gx - ax.a[0]) * Math.sin(aS) + (gz - ax.a[1]) * Math.cos(aS), te: (ax.c[0] - gx) * ax.d[0] + (ax.c[1] - gz) * ax.d[1] };
  };
  const onAxis = (beta) => {
    let f = lay(0, 0, beta);
    if (Math.abs(f.miss) < 0.002) return f;
    const sg = f.miss > 0 ? -1 : 1;
    let lo = 0, hi = 1;
    f = lay(sg, 0, beta);
    // (where the three are not enough the slant along the top gives the rest: on no seed of 1 to 300)
    const far = f.miss * sg < 0;
    for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; f = far ? lay(sg, sg * 200 * m, beta) : lay(sg * m, 0, beta); if (f.miss * sg < 0) lo = m; else hi = m; }
    return f;
  };
  let fit = onAxis(beta0);
  if (fit.te < -40) {
    let lo = 13 * DEG, hi = beta0;
    for (let it = 0; it < 10; it++) { const m = (lo + hi) / 2; if (onAxis(m).te < -40) hi = m; else lo = m; }
    fit = onAxis(lo);
  }
  const sC = fit.sC, Dt = fit.Dt, runD = fit.runD, sN = fit.sN, beta = fit.beta, cb = Math.cos(beta), sb = Math.sin(beta);
  P.routeFit = fit;
  // THE LAST OF THE ROAD: the bed swings to the gate's axis by two short bends; the line does not follow them. From its
  // last point on the road's left half it flies ONE gentle circle that touches the castle's arc (its radius, signed, is
  // what the two tangencies give: 644 m and more on seeds 1 to 300), 8 m and more over the ground under it, so
  // that it passes over the riders' half of the road well clear of their heads. (The arc itself begins 181 to 235 m south
  // of the wall's middle, among the castle's first halls.)
  const prx = xl[nl - 1], prz = zl[nl - 1], th1 = Math.atan((xl[nl - 1] - xl[nl - 2]) / 13);
  const n1 = [Math.cos(th1), Math.sin(th1)], w1 = [prx - x0 - Rt, prz - Zt], rho = (Rt * Rt - w1[0] * w1[0] - w1[1] * w1[1]) / (2 * (w1[0] * n1[0] + w1[1] * n1[1] + Rt));
  const cg = [prx + rho * n1[0], prz + rho * n1[1]], dc = [x0 + Rt - cg[0], Zt - cg[1]], dl = Math.hypot(dc[0], dc[1]) * Math.sign(rho);
  const a0 = Math.atan2(-Rt * dc[1] / dl, -Rt * dc[0] / dl), Sg = rho * (a0 - th1);
  const gy = (x, z) => Math.max(g(x, z), g(P.roadX(z), z));
  // (the circle's points, one every 13 m like the road's)
  const cl = []; for (let sg = 13; sg < Sg - 14; sg += 13) { const t = th1 + sg / rho; cl.push([cg[0] - rho * Math.cos(t), cg[1] - rho * Math.sin(t), sg]); }
  // (the arc begins 8.6 m over the highest of the yard's ground that the riders cross before it)
  const ya = Math.max(yg, ...[215, 235, 255, 275].map((z) => g(P.roadX(z) + 2.7, z))) + 8.6, arcS = Rt * (1.5708 - a0), kb = 0.12 * arcS / (y1 - ya), ke = sC * arcS / (y1 - ya);
  // THE HEIGHT OF THE ROAD'S LINE AND OF THE CIRCLE, IN ONE RUN: between a rider's eye (and, from 60 m before the line
  // leaves the road, the rise to 8.6 m) over the ground and 4.5 m more, the smoothest run over the road's rises and dips
  // that meets the arc at the arc's own height and slope. (Round 4 smoothed the road's part alone and laid the circle
  // on the ground's own heights at every 35 m: where the road ends in a hollow the nose went down and then up, ten
  // degrees inside a second and a half on one seed in a hundred.)
  const gl = [...zl.map((z, i) => Math.max(g(xl[i], z), g(P.roadX(z), z)) + rise(z)), ...cl.map((q) => gy(q[0], q[1]) + rise(q[1]))], hl = gl.slice(), nh = hl.length, y00 = yBed + 3.3;
  const rem = Sg - (cl.length ? cl[cl.length - 1][2] : 0), hArc = (s) => ya + 0.12 * (s - rem);
  for (let it = 0; it < 1500; it++) {
    for (let i = 0; i < nh; i++) {
      const a = i > 1 ? hl[i - 2] : y00, b = i > 0 ? hl[i - 1] : y00, c = i < nh - 1 ? hl[i + 1] : hArc(13), d = i < nh - 2 ? hl[i + 2] : hArc(13 * (i - nh + 3));
      hl[i] = clamp(hl[i] - 0.06 * (a - 4 * b + 6 * hl[i] - 4 * c + d), gl[i] - 0.1, gl[i] + 4.5);
    }
    if (it % 300 === 299) yield;
  }
  for (let i = 0; i < nl; i++) pts.push([xl[i], hl[i], zl[i]]);
  for (let i = 0; i < cl.length; i++) pts.push([cl[i][0], hl[nl + i], cl[i][1]]);
  // (the arc rises from a gentle slope at its start to the climb's own slope at its end)
  for (let i = 0; i < 6; i++) { const f = i / 6, a = a0 + (1.5708 - a0) * f; pts.push([x0 + Rt * (1 - Math.cos(a)), ya + (y1 - ya) * (kb * f + (3 - 2 * kb - ke) * f * f + (kb + ke - 2) * f * f * f), Zt - Rt * Math.sin(a)]); }
  const xa = x1 + (yTopC - y1) / sC;
  for (let xc = x1; xc < xa - 30; xc += 55) pts.push([xc, y1 + (xc - x1) * sC, zc]);
  P.xClimb0 = x1; P.yClimb0 = y1; P.slopeClimb = sC; P.turn = { x: x0, z: Zt, R: Rt, a0, rho, len: Sg }; P.zClimb = zc;
  // 3 over to the top: from 60 m under the lip the nose comes level over a run of twice the height still to climb divided by
  //   the slope, and the line closes on the wall, over that run and 80 m more, to 5.4 m outside the southern edge
  // ALONG THE TOP the line is ONE STRAIGHT SLANT, as long as the fit above makes it: it begins 5.4 m outside the southern edge (the sheer
  // face under the right hand, the top and what is kept on it on the left, the wall running to the horizon ahead), passes
  // over the top's middle half-way, and ends 5.2 m outside the northern edge (the north country under the left hand):
  // no bend on the top at all. The run in from the climb ends on the slant's own heading
  const Lr = 2 * (yS + 1 - yTopC) / sC, Lz = Lr + 80;
  const xS0 = xa + Lz, xN1 = xS0 + Dt, m1 = ((zS - zN) / Dt) * Lz / (zc - zS);
  for (let dx = 0; dx < Lz - 20; dx += 45) { const t = dx / Lz; pts.push([xa + dx, dx < Lr ? yTopC + sC * (dx - dx * dx / (2 * Lr)) : lerp(yS + 1, yS, smoothstep(Lr, Lz, dx)), lerp(zc, zS, (3 - m1) * t * t + (m1 - 2) * t * t * t)]); }
  P.xLip = xa + Lr;
  const nT = Math.round(Dt / 55);
  for (let i = 0; i <= nT; i++) { const f = i / nT; pts.push([xS0 + Dt * f, lerp(yS, yM, 4 * f * (1 - f)), lerp(zS, zN, f)]); }
  // (the places of the slant: where it begins, where it comes in over the southern edge, where it goes out over the
  // northern edge, where it ends)
  P.xTop0 = xS0; P.xCross = xS0 + Dt * (zS - TOP_HALF) / (zS - zN); P.xNorth = xS0 + Dt * (zS + TOP_HALF) / (zS - zN); P.xOff = xN1; P.topY = yS; P.zS = zS; P.zN = zN;
  yield;
  // 4 the descent: THE LEAVING OF THE TOP is a run of 500 m out from the northern edge: over its first 400 m the heading
  //   swings to the descent's own, and over the whole of it the nose goes down at one even rate to the descent's slope
  //   (round 4 mending 1: it was 170 m and 250 m, each eased in and out, and the nose went down ten degrees inside a
  //   second and a half on 65 seeds of a hundred); then STRAIGHT in plan, 17 to 22 degrees north of the wall's own line
  //   (a little under that where the fit above lowers it), down over the open belt
  let px = xN1, py = yS, pz = zN;
  const th0 = Math.atan((zS - zN) / Dt);
  for (let run = 1; run <= LEAVE; run++) { const th = lerp(th0, beta, smoothstep(0, LEAVE_TURN, run)), sl = sN * run / LEAVE; px += Math.cos(th); pz -= Math.sin(th); py -= sl; if (run % 50 === 0) pts.push([px, py, pz]); }
  // (the descent's slope is the one that brings it, over the leaving and its own straight, to 38 m over the ground that
  // lies under the low turn: 0.42 to 0.50 on seeds 1 to 300)
  const nD = Math.max(2, Math.round(runD / 55));
  for (let i = 1; i <= nD; i++) { const t = runD * i / nD; pts.push([px + t * cb, py - t * sN, pz - t * sb]); }
  px += runD * cb; py -= runD * sN; pz -= runD * sb;
  P.descent = { x0: xN1, xs: px - runD * cb, x1: px, z1: pz, beta, slope: sN };
  // 5 the low turn (one left turn onto the grove's axis) and the last straight, which lies on the way to the grove: the
  //   last of the belt, 84 to 104 m of the dark wood between the way's old trunks, then the grove's avenue (AVENUE
  //   metres) to the ring E
  const arcAt = (th) => [px + Rd * (Math.sin(th) - sb), pz + Rd * (Math.cos(th) - cb)];
  const d = ax.d, E = P.grove.E, F = P.grove.F, Lw = ax.Lw, yE = P.ring.y, G0 = arcAt(aS);
  // (how far before the wood's edge the low turn ends, along the axis: under 0 if it ends past it; and the length of
  // the last straight, to the ring)
  const te = (ax.c[0] - G0[0]) * d[0] + (ax.c[1] - G0[1]) * d[1], Ls = (E[0] - G0[0]) * d[0] + (E[1] - G0[1]) * d[1];
  yield;
  const yLow = (x, z) => Math.max(P.groundAt(x, z), P.groundAt(x, z - 16), P.groundAt(x, z + 16), P.groundAt(x - 16, z), P.groundAt(x + 16, z), P.groundAt(x, z - 32), P.groundAt(x, z + 32)) + 7.2;
  const arcLen = Rd * (aS - beta), nA = Math.max(3, Math.round(arcLen / 45)), yA1 = yLow(G0[0], G0[1]) + 2.4, kA = clamp(sN * arcLen / Math.max(py - yA1, 1), 1.5, 3.4);
  for (let i = 1; i <= nA; i++) { const t = i / nA, q = arcAt(beta + (aS - beta) * t); pts.push([q[0], Math.max(yA1 + (py - yA1) * Math.pow(1 - t, kA), yLow(q[0], q[1]) + 2.2), q[1]]); }
  const nW = Math.max(1, Math.round((Ls - 130) / 45));
  for (let i = 1; i < nW; i++) { const t = (Ls - 130) * i / nW, x = G0[0] + d[0] * t, z = G0[1] + d[1] * t; pts.push([x, Math.max(lerp(yA1, yE, smoothstep(0, Ls - 135, t)), yLow(x, z) - 1.2), z]); }
  for (const t of [130, 98, 65, 33, 0]) pts.push([E[0] - d[0] * t, yE, E[1] - d[1] * t]);
  P.low = { G0, Rd, te, Lw, Ls, open: F, turn: [px, pz] };
  P.pts = pts;
  yield;
  P.path = makePath(pts);
  yield;
  const L = P.L = P.path.length, v = new THREE.Vector3(), samples = [];
  for (let m = 0; m <= L; m += 2) { P.path.posAtDist(m, v); samples.push([v.x, v.y, v.z, m]); if (m % 200 === 0) yield; }
  P.samples = samples;
  // the metres of the places along the line
  const first = (f, from = 0) => { for (const s of samples) if (s[3] >= from && f(s)) return s[3]; return L; };
  const M = P.M = {};
  M.castle = first((s) => s[2] < 250);
  M.face = first((s) => s[0] > x1 - 20, M.castle);
  M.lip = first((s) => s[1] > H + 1, M.face);
  M.top = first((s) => s[0] > xS0 - 30, M.lip);
  M.cross = first((s) => s[2] < 0, M.top);
  M.north = first((s) => s[2] < -TOP_HALF, M.top);
  M.off = first((s) => s[1] < H - 2, M.north);
  M.trunks = first((s) => s[1] < P.groundAt(s[0], s[2]) + 34, M.off);
  // where the wood opens into the grove: the avenue's length before the ring
  M.open = L - AVENUE; M.grove = M.open;
  // (the two straight stretches, for the count of the camera's roll: the climb beside the face, the descent over the belt)
  M.climb0 = first((s) => s[0] > x1, M.castle); M.climb1 = first((s) => s[0] > xa, M.climb0); M.down0 = first((s) => s[0] > P.descent.xs, M.north); M.down1 = first((s) => s[0] > P.descent.x1, M.down0);
  M.last = L - 100;
  yield;
  // THE PACE (only its shape matters: the engine fits it to the film's 50 s). THE GROVE'S OWN PACE holds from where the
  // wood opens: under old trees whose boughs hang low over fallen leaves a ridden horse is walked, and the film goes at
  // the engine's least pace there (11.2 to 11.8 m/s as flown), so that the ring stands ahead and grows for the film's last
  // ten seconds and more. Before it, by place: the road at one pace; slower round the castle's arc (the arc is a turn of
  // 128 to 142 m radius); faster up beside the face and over the lip; a little slower along the top; fastest down the
  // descent; slower round the low turn (165 to 190 m radius) and along the last straight to the slowing.
  // EVERY CHANGE OF PACE IS A RAMP WITH ITS OWN METRES (P.ramps: where its middle lies by a named place of the line, half
  // its length, the pace it comes to), and each is flown in 1.65 s and more across those metres (m2-cam.mjs counts it as
  // flown; round 4's ramp onto the top took 1.33 to 1.40 s and its slowing 1.15 to 1.23 s). The slowing begins 160 m
  // before the wood opens and is done 50 m before it (the engine reads the pace at 64 places along the line and eases
  // toward it, so it is given room: as flown, 11.9 m/s at most where the wood opens). AS FLOWN, seeds 1 to 300
  // (m1-speeds.mjs): 64 to 67 m/s on the road, 50 to 53 round the castle, 77 to 82 up the face, 71 to 74 over the top,
  // 79 to 83 down the descent, 49 to 64 round the low turn and along the way, 11.2 to 11.8 under the avenue; the film
  // is 48.1 s long.
  const ramp = (m, a, w) => smoothstep(a - w, a + w, m);
  P.ramps = [
    { name: 'into the castle', at: M.castle - 30, half: 70, to: 1.55 },
    { name: 'up the face', at: M.face + 50, half: 65, to: 2.5 },
    { name: 'onto the top', at: M.top - 40, half: 70, to: 2.2 },
    { name: 'down the descent', at: M.off + 110, half: 80, to: 2.5 },
    { name: 'round the low turn', at: M.down1 - 60, half: 80, to: 1.9 },
    { name: 'the slowing', at: M.open - 105, half: 55, to: 0.35 },
  ];
  P.pace = (u) => {
    const m = clamp(u, 0, 1) * L;
    let p = 2.0;
    for (const q of P.ramps) p = lerp(p, q.to, ramp(m, q.at, q.half));
    return p;
  };
  // the line against the ground and against the ice itself
  let gg = 1e9, gw = 1e9;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i], az = Math.abs(s[2]), y = s[1];
    if (az > faceZ(0) + 2.8) gg = Math.min(gg, y - P.groundAt(s[0], s[2]));
    const w = y < H ? az - faceZ(y) - 2.8 : az <= TOP_HALF + 2.8 ? y - H : Math.hypot(az - TOP_HALF - 2.8, y - H);
    gw = Math.min(gw, w);
    if (i % 300 === 299) yield;
  }
  P.gaps.ground = gg; P.gaps.ice = gw;
}

// the line's samples in a grid of 24 m cells, and the tests every thing is put to with its own measures
function planTests(P) {
  const cell = 24, map = new Map(), key = (c, d) => (c + 2048) * 8192 + d + 2048;
  // the entry axis behind the line's first point (its first tangent continued backward, level, BACK metres: round 4, it was
  // 64): the camera that draws this place inside the opening of the world before flies it from far behind, so every thing
  // is put to the same tests against it too. The road runs on south under it, its bed level, to the ground's end
  const tb = P.path.tangentAtDist(0), tl = Math.hypot(tb.x, tb.z) || 1, s0 = P.samples[0];
  P.back = []; for (let d = 0.5; d <= BACK; d += 0.5) P.back.push([s0[0] - (tb.x / tl) * d, s0[1], s0[2] - (tb.z / tl) * d, -d]);
  for (const s of [...P.samples, ...P.back]) { const k = key(Math.floor(s[0] / cell), Math.floor(s[2] / cell)); let a = map.get(k); if (!a) map.set(k, a = []); a.push(s); }
  const near = (x0, x1, z0, z1, f) => {
    for (let c = Math.floor((x0 - 40) / cell); c <= Math.floor((x1 + 40) / cell); c++) for (let d = Math.floor((z0 - 40) / cell); d <= Math.floor((z1 + 40) / cell); d++) { const a = map.get(key(c, d)); if (a) for (const s of a) f(s); }
  };
  const span = (v, a, b) => (v < a ? a - v : v > b ? v - b : 0);
  // the least of a thing's distances from the line. A thing abeam of the line between two samples 2 m apart could stand up
  // to 0.2 m nearer than either sample tells, so wherever a sample comes within 6 m of a thing the line is read every half
  // metre about that sample (the measures written down are true to about a centimetre)
  const fine = new Map(), fv = new THREE.Vector3();
  const fineOf = (s) => { let q = fine.get(s[3]); if (!q) { q = []; for (const o of [-1, -0.5, 0.5, 1]) { const m = s[3] + o; if (m >= 0 && m <= P.L) { P.path.posAtDist(m, fv); q.push([fv.x, fv.y, fv.z, m]); } } fine.set(s[3], q); } return q; };
  const least = (x0, x1, z0, z1, dist) => {
    let best = 99;
    near(x0, x1, z0, z1, (s) => { const d = dist(s); if (d < best) best = d; if (d < 6 && s[3] >= 0) for (const q of fineOf(s)) { const d2 = dist(q); if (d2 < best) best = d2; } });
    return best;
  };
  // an upright cylinder (radius r, y0 to y1); an upright box turned by yaw about its middle; a rod between two points
  P.gapCyl = (x, z, r, y0, y1) => least(x - r, x + r, z - r, z + r, (s) => { const dx = s[0] - x, dz = s[2] - z, a = Math.max(Math.sqrt(dx * dx + dz * dz) - r, 0), b = span(s[1], y0, y1); return Math.sqrt(a * a + b * b); });
  P.gapBox = (cx, cz, yaw, hx, hz, y0, y1) => {
    const c = Math.cos(yaw), sn = Math.sin(yaw), R = Math.hypot(hx, hz);
    return least(cx - R, cx + R, cz - R, cz + R, (s) => { const dx = s[0] - cx, dz = s[2] - cz, lx = dx * c - dz * sn, lz = dx * sn + dz * c, a = span(lx, -hx, hx), b = span(lz, -hz, hz), e = span(s[1], y0, y1); return Math.sqrt(a * a + b * b + e * e); });
  };
  P.gapRod = (a, b, r) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2] || 1;
    return least(Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[2], b[2]), Math.max(a[2], b[2]), (s) => {
      const t = clamp(((s[0] - a[0]) * ab[0] + (s[1] - a[1]) * ab[1] + (s[2] - a[2]) * ab[2]) / l2, 0, 1);
      const ex = s[0] - a[0] - ab[0] * t, ey = s[1] - a[1] - ab[1] * t, ez = s[2] - a[2] - ab[2] * t;
      return Math.sqrt(ex * ex + ey * ey + ez * ez) - r;
    });
  };
  // a thing is kept when its gap is `need` or more; the smallest gap of each kind of kept thing is written down
  P.keep = (kind, gap, need) => { if (gap < need) { P.dropped[kind] = (P.dropped[kind] || 0) + 1; return false; } P.gaps[kind] = Math.min(P.gaps[kind] ?? 99, gap); return true; };
}

// THE DRAWN GROUND AND THE MADE WAYS (round 4 mending 1).
// The ground is DRAWN as three sheets of flat triangles (landSteps): a coarse sheet to the edge of sight and two fine
// patches. Between its lines a sheet lies up to some 3 m under or over the ground's own law (the coarse sheet's cells are
// 36 m by 40 m and more; a fine patch's outer ring is sunk under the coarse sheet). A tree footed on the law's height
// there hung with its end in the air. So the plan holds the sheets' own lines (groundLattice: the makers draw by the same
// ones) and reads the DRAWN ground: drawnAt, the upper of the sheets at a place, by each sheet's own two triangles a cell;
// footAt, the lowest of it under a foot (its middle and eight points of its rim). Every tree's foot is set from that.
export function groundLattice(P) {
  const cell = 3.6, rS = { x0: -172, x1: 172, z0: 20, z1: P.zStart + 112 }, rN = P.patchN;
  const even = (a, b) => { const n = Math.round((b - a) / cell) + 1, out = new Float64Array(n); for (let i = 0; i < n; i++) out[i] = a + (b - a) * i / (n - 1); return out; };
  // the south patch's lines along the road: 3.2 m apart within 42 m of the road's mean line, widening to 9 m at the yard's edge
  const xp = [0]; let stp = 3.2;
  while (xp[xp.length - 1] < rS.x1) { const x = xp[xp.length - 1]; if (x >= 42) stp = Math.min(stp * 1.22, 9); xp.push(Math.min(x + stp, rS.x1)); }
  // the coarse sheet's lines: every 36 m from 760 m west of the gate's meridian to 2,450 m east of it, ever wider beyond; its rows close by the
  // wall's foot, then every 40 m, then 60 m, then wider to the edge of sight
  const xs = [], zs = [];
  let st = 30; for (let x = -790; x > -9500; x -= st) { xs.unshift(x); st *= 1.5; }
  for (let x = -760; x <= 2450; x += 36) xs.push(x);
  st = 30; for (let x = xs[xs.length - 1] + 30; x < 11500; x += st) { xs.push(x); st *= 1.5; }
  const half = [23, 25, 28, 32, 38, 46, 56, 70, 90, 115, 145, 180];
  for (let z = 220; z < 600; z += 40) half.push(z);
  for (let z = 600; z < 1500; z += 60) half.push(z);
  half.push(1600, 1750, 2000, 2400, 3000, 4000, 5600, 8600);
  for (let i = half.length - 1; i >= 0; i--) zs.push(-half[i]);
  for (const z of half) zs.push(z);
  const inside = (x, z, m) => (x > rS.x0 + m && x < rS.x1 - m && z > rS.z0 + m && z < rS.z1 - m) || (x > rN.x0 + m && x < rN.x1 - m && z > rN.z0 + m && z < rN.z1 - m);
  // (how far a point of a sheet is sunk: a fine patch's outer ring 3.2 m; the coarse sheet 1.5 m where it lies 4 m and
  // more inside a fine patch)
  const ring = (q) => (i, j) => (i === 0 || j === 0 || i === q.xs.length - 1 || j === q.zs.length - 1 ? 3.2 : 0);
  const south = { xs: Float64Array.from([...xp.slice(1).reverse().map((v) => -v), ...xp]), zs: even(rS.z0, rS.z1) }, north = { xs: even(rN.x0, rN.x1), zs: even(rN.z0, rN.z1) };
  south.sink = ring(south); north.sink = ring(north);
  return { rS, rN, south, north, coarse: { xs: Float64Array.from(xs), zs: Float64Array.from(zs), sink: (i, j, x, z) => (inside(x, z, 4) ? 1.5 : 0) } };
}
function planGround(P) {
  const La = P.lattice = groundLattice(P), g = P.groundAt;
  const sheets = [La.coarse, La.south, La.north].map((q) => ({ q, xs: q.xs, zs: q.zs, nz: q.zs.length, sink: q.sink, h: new Float64Array(q.xs.length * q.zs.length).fill(NaN), raw: new Float64Array(q.xs.length * q.zs.length).fill(NaN), li: 0, lj: 0 }));
  const find = (a, v) => { let lo = 0, hi = a.length - 1; if (!(v >= a[0] && v <= a[hi])) return -1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m] <= v) lo = m; else hi = m; } return lo; };
  // (a sheet's point: the ground's own law there less its sinking, worked out once)
  // (the ground's own law at a sheet's point is worked out once: the plan asks it for the trees' feet, the build for
  // the sheet itself: P.sheetGround)
  const rawAt = (s, i, j) => { const k = i * s.nz + j; let v = s.raw[k]; if (v !== v) v = s.raw[k] = g(s.xs[i], s.zs[j]); return v; };
  const sheetOf = new Map(sheets.map((s) => [s.q, s]));
  P.sheetGround = (q, i, j) => rawAt(sheetOf.get(q), i, j);
  const at = (s, i, j) => { const k = i * s.nz + j; let v = s.h[k]; if (v !== v) v = s.h[k] = rawAt(s, i, j) - s.sink(i, j, s.xs[i], s.zs[j]); return v; };
  P.drawnAt = (x, z) => {
    let best = -1e9;
    for (let q = 0; q < 3; q++) {
      const s = sheets[q];
      // (the cell asked last is tried first: a foot's nine points lie in one cell or its neighbours)
      let i = s.li, j = s.lj;
      if (!(s.xs[i] <= x && x < s.xs[i + 1])) { i = find(s.xs, x); if (i < 0) continue; s.li = i; }
      if (!(s.zs[j] <= z && z < s.zs[j + 1])) { j = find(s.zs, z); if (j < 0) continue; s.lj = j; }
      const u = (x - s.xs[i]) / (s.xs[i + 1] - s.xs[i]), v = (z - s.zs[j]) / (s.zs[j + 1] - s.zs[j]), ha = at(s, i, j), hc = at(s, i + 1, j + 1);
      // (a cell is two triangles about the diagonal from its first corner to its last)
      const hb = u >= v ? at(s, i + 1, j) : at(s, i, j + 1), h = u >= v ? ha + (hb - ha) * u + (hc - hb) * v : ha + (hb - ha) * v + (hc - hb) * u;
      if (h > best) best = h;
    }
    return best;
  };
  P.footAt = (x, z, r) => { let b = P.drawnAt(x, z); for (let k = 0; k < 8; k++) { const a = k * 0.7854, d = P.drawnAt(x + r * Math.cos(a), z + r * Math.sin(a)); if (d < b) b = d; } return b; };
  // THE MADE WAYS OF THE PLACE: the road (from the gate south to the road's head), the wall itself, and THE WAY TO THE
  // GROVE: a way kept open along the grove's own axis from the toe of the wall's northern apron through the cut-back belt
  // and the dark wood to the ring (P.way: its two ends, its length). They are things of the place: what is said of a
  // tree's or a stone's distance from a way is said of these, never of the line that is flown.
  const E = P.ring, dE = E.dir, zw = -(faceZ(0) + 44), tw = (zw - E.z) / dE[1];
  P.way = { a: [E.x + dE[0] * tw, zw], b: [E.x, E.z], len: -tw };
  const seg = (x, z, ax, az, bx, bz) => { const ux = bx - ax, uz = bz - az, t = clamp(((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz), 0, 1); return Math.hypot(x - ax - ux * t, z - az - uz * t); };
  P.wayDist = (x, z) => seg(x, z, P.way.a[0], P.way.a[1], E.x, E.z);
  // (the wall's stretch between the gate's meridian and the meridian where the way leaves its foot)
  P.wallDist = (x, z) => seg(x, z, 0, 0, P.way.a[0], 0);
  P.roadDist = (x, z) => seg(x, z, 0, 0, 0, P.zStart);
  P.madeDist = (x, z) => Math.min(P.roadDist(x, z), P.wallDist(x, z), P.wayDist(x, z));
}

// THE HIGH GROUND'S SHEET (the far ridges and mountains north of the wall), worked out once in the plan: its points'
// heights (P.high; highlandSteps draws these same numbers) and P.highK: the steepest sight line from the wall's southern
// top edge (z = TOP_HALF, y = WALL_H) up to any point of that sheet, as a slope (metres up in a metre north; a slope is
// greatest at a corner of a flat piece, so the sheet's points are all that need asking). An eye south of that edge and
// under the line of that slope drawn back from the edge can see nothing of the north country: the wall's own body
// stands before all of it. The world's update shows and hides the north by this test and by nothing else.
// WHAT THE WALL HIDES (the world's update asks these two and nothing else about the eye's place). The north is hidden
// while the eye is south of the top's southern edge and under the line drawn back from that edge at the slope P.highK,
// half a metre lower for good measure; the south while the eye is north of the wall's north foot and more than 4 m
// under its top (nothing of the south stands as high as the top).
export const northHidden = (P, y, z) => z > TOP_HALF + 0.5 && y < WALL_H - 0.5 - P.highK * (z - TOP_HALF);
export const southHidden = (y, z) => y < WALL_H - 4 && z < -faceZ(0) - 1;
function* planHigh(P) {
  const b = P.highBox, nx = Math.round((b.x1 - b.x0) / 150) + 1, nz = Math.round((b.z1 - b.z0) / 145) + 1, y = new Float32Array(nx * nz), hs = new Float32Array(nx * nz);
  let K = 0;
  // (the page is handed back after every third line of points)
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = b.x0 + (b.x1 - b.x0) * i / (nx - 1), z = b.z0 + (b.z1 - b.z0) * j / (nz - 1), h = P.highAt(x, z), v = P.groundAt(x, z) + h - 24 * (1 - smoothstep(3, 30, h));
      y[i * nz + j] = v; hs[i * nz + j] = h; K = Math.max(K, (v + 0.01 - WALL_H) / (TOP_HALF - z));
    }
    if (i % 3 === 2) yield;
  }
  P.high = { nx, nz, y, h: hs }; P.highK = K;
}

// THE SMOKE'S MEASURES (the world gives them to the kit's column; the plan tests by them): its height, the spread of the
// column at its foot and its head, a puff's size (its width) at its birth and its end, how many puffs, the wind it
// leans on (the plan's hand), the kit's own bend. A puff a share h of the way up stands at the axis (the chimney's top,
// h of the height up, and h squared times the bend times the height down the wind), off it by its place in the column's
// spread and its sway (1.42 spreads at the most), and is as wide as its size (1.3 times at the most): smokeReach is the
// farthest its edge can stand from the axis at h. A puff is drawn on a square sheet as wide as the puff, turned to the
// eye; the sheet's corners (nothing is drawn in them) stand 0.71 of its width from its middle: smokeCorner is the
// farthest a corner can stand from the axis at h
export const SMOKE = { height: 36, radius: [0.6, 5], size: [3, 12], count: 84, wind: [-1, 0, 0.2], bend: 0.45 };
const smokeAxis = (top, h) => { const wl = Math.hypot(...SMOKE.wind), k = h * h * SMOKE.height * SMOKE.bend / wl; return [top[0] + SMOKE.wind[0] * k, top[1] + h * SMOKE.height + SMOKE.wind[1] * k, top[2] + SMOKE.wind[2] * k]; };
const smokeReach = (h) => 1.42 * lerp(SMOKE.radius[0], SMOKE.radius[1], Math.pow(h, 0.8)) + 0.65 * lerp(SMOKE.size[0], SMOKE.size[1], Math.pow(h, 0.7));
const smokeCorner = (h) => 1.42 * lerp(SMOKE.radius[0], SMOKE.radius[1], Math.pow(h, 0.8)) + 0.92 * lerp(SMOKE.size[0], SMOKE.size[1], Math.pow(h, 0.7));
// THE FALLING LEAVES' MEASURES: how many (at density 1), and the kit's law of nearness for them: none is drawn within
// 2.9 m of the eye and each is whole by 6.5 m (a leaf is 0.32 m across at the most, so nothing of one within 2.5 m)
export const LEAVES = { count: 1300, near: [2.9, 6.5] };

// the castle at the wall's foot: no wall of its own. Towers of grey stone stand about the castle's threshold, where the road
// comes in among the first halls (one tall and slender, one squat and round, one broken and leaning; others farther off, half of them fallen in), timber
// halls along the road, covered ways between them, a gate in the ice. On a rare day a great block of the wall lies fallen and
// shattered at the south foot, old and snowed over (it stands; nothing falls)
function* planCastle(P) {
  const rt = P.R.towers, rh = P.R.halls, rc = P.R.castle, g = P.groundAt, towers = [], halls = [], T = P.ward;
  P.clearings = [];
  // ONE LIST OF WHAT IS BUILT on the ground south of the wall, filled as each kind is dealt and asked by every later kind,
  // so that nothing stands in another: level footprints (a disc; a box turned by its yaw; a rod with a half width).
  // IT HOLDS the towers, the halls, the covered ways, the things of the yard, the men and their beats. NOT IN IT, each
  // kept apart by a rule of its own: the fallen block, the holdfast with its two walls and the waymark (each takes a
  // clearing, P.clearings, which every tower, hall and tree is asked against); the gate in the ice and the stages at the
  // stair's and the cage's foot (they stand hard by the face's foot, where nothing else is dealt). The report's count
  // (r4-count.mjs) measures each of these against the list, the stems and the stones
  const built = P.built = [];
  const disc = (kind, x, z, r, of = null) => built.push({ kind, t: 0, x, z, r, of });
  const boxF = (kind, o) => built.push({ kind, t: 1, x: o.x, z: o.z, c: Math.cos(o.yaw), s: Math.sin(o.yaw), hx: o.hw, hz: o.hl, of: o });
  const rodF = (kind, a, b, r, of = null) => built.push({ kind, t: 2, a, b, r, of });
  const footGap = (q, x, z) => {
    if (q.t === 0) return Math.hypot(x - q.x, z - q.z) - q.r;
    if (q.t === 1) { const dx = x - q.x, dz = z - q.z, lx = Math.abs(dx * q.c - dz * q.s) - q.hx, lz = Math.abs(dx * q.s + dz * q.c) - q.hz; return lx <= 0 && lz <= 0 ? Math.max(lx, lz) : Math.hypot(Math.max(lx, 0), Math.max(lz, 0)); }
    const ax = q.b[0] - q.a[0], az = q.b[1] - q.a[1], u = clamp(((x - q.a[0]) * ax + (z - q.a[1]) * az) / (ax * ax + az * az || 1), 0, 1);
    return Math.hypot(x - q.a[0] - ax * u, z - q.a[1] - az * u) - q.r;
  };
  // the least level distance from a place to what is built (under 0: inside it); pick may leave kinds or one thing out
  P.builtGap = (x, z, pick = null) => { let best = 99; for (const q of built) { if (pick && !pick(q)) continue; const d = footGap(q, x, z); if (d < best) best = d; } return best; };
  // ... and from a rod's middle line, read at every half metre of it
  const rodGap = (a, b, pick = null) => { const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5)); let best = 99; for (let i = 0; i <= n; i++) best = Math.min(best, P.builtGap(lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n), pick)); return best; };
  // the fallen block: three great pieces of one mass and the lesser wreck about them, lying along the foot west of the
  // stair, its middle 98 to 130 m east of the gate's meridian
  const rb = P.R.block, bx = rb.range(98, 130), bz = faceZ(0) + rb.range(28, 34), pieces = [];
  for (let i = 0; i < 19; i++) {
    const big = i < 3, a = rb.range(-0.5, 3.64), rad = rb.range(13, 33), sz = big ? rb.range(4.4, 5.6) : lerp(0.8, 3.1, rb() * rb()), tone = rb();
    const yaw = rb.range(-0.3, 0.3) + (big ? 0 : rb.range(0, 3)), pitch = rb.range(-0.24, 0.24), roll = rb.range(-0.22, 0.22), tall = rb.range(1.1, 1.5), deep = rb.range(1.2, 1.6);
    const x = big ? bx + (i - 1) * 11.4 + rb.range(-0.8, 0.8) : bx + rad * Math.cos(a), z = Math.max(big ? bz + rb.range(-2, 2) : bz + 0.8 * rad * Math.sin(a), faceZ(0) + 5 + sz);
    pieces.push({ x, z, y: g(x, z), hx: sz, hy: big ? sz * tall : sz * 0.7, hz: big ? sz * deep : sz * 0.9, yaw, pitch, roll, tone, big });
  }
  P.block = { x: bx, z: bz, R: 37, pieces, on: false };
  if (P.rare && P.keep('fallen block', P.gapCyl(bx, bz, 37, g(bx, bz) - 4, g(bx, bz) + 21), MADE)) { P.block.on = true; P.clearings.push({ x: bx, z: bz, r: 37 }); }
  const clearOfOthers = (x, z, r) => towers.every((t) => Math.hypot(t.x - x, t.z - z) > t.r + r + 9) && halls.every((h) => Math.hypot(h.x - x, h.z - z) > Math.hypot(h.hw, h.hl) + r + 4)
    && P.clearings.every((c) => Math.hypot(c.x - x, c.z - z) > c.r + r + 3);
  // THE THREE TOWERS OF THE THRESHOLD, each set about the threshold (P.ward) by draws of its own:
  // the tall slender tower, 24 to 31 m west of it: the road passes under it
  const t0 = { x: T.x - rt.range(24, 31), z: T.z + rt.range(-8, 26), r: 5.3, h: rt.range(60, 68), fallen: 0, square: false, cap: 1, seed: rt(), stair: 1, name: 'tall' };
  t0.y = g(t0.x, t0.z) - 0.8;
  // (a tower's footprint: its drum with the batter of its foot; a fallen one with its stones about it)
  const stand = (t) => { towers.push(t); disc('tower', t.x, t.z, t.fallen ? t.r * 1.13 + 2.2 : t.r * 1.15, t); };
  if (P.keep('tall tower', P.gapCyl(t0.x, t0.z, t0.r * 1.3, t0.y - 3, t0.y + t0.h + 9), MADE)) stand(t0);
  // the squat round tower, east of the threshold, its wall 17 to 24 m from it
  const r1 = rt.range(10.5, 12.5), t1 = { x: T.x + r1 + rt.range(17, 24), z: T.z + rt.range(-4, 20), r: r1, h: rt.range(19, 23), fallen: 0, square: false, cap: 2, seed: rt(), stair: 1, name: 'squat' };
  t1.y = g(t1.x, t1.z) - 0.8;
  if (P.keep('squat tower', P.gapCyl(t1.x, t1.z, t1.r * 1.3, t1.y - 3, t1.y + t1.h + 2.6), MADE)) stand(t1);
  // the broken tower, leaning, 46 to 70 m north of the threshold on the west hand: its lean (metres in a metre of
  // height) is toward the south-east
  const la = rt.range(0.3, 1.2), lk = rt.range(0.11, 0.15), t2 = { x: T.x - rt.range(20, 28), z: T.z - rt.range(46, 70), r: 5.8, h: rt.range(23, 29), fallen: 1, square: false, cap: 0, seed: rt(), lean: [lk * Math.cos(la), lk * Math.sin(la)], name: 'leaning' };
  t2.y = g(t2.x, t2.z) - 0.8;
  if (P.keep('leaning tower', P.gapCyl(t2.x + t2.lean[0] * t2.h * 0.5, t2.z + t2.lean[1] * t2.h * 0.5, t2.r * 1.13 + 2.2 + lk * t2.h * 0.5, t2.y - 3, t2.y + t2.h + 2), MADE)) { stand(t2); disc('tower', t2.x + t2.lean[0] * t2.h, t2.z + t2.lean[1] * t2.h, t2.r * 1.13, t2); }
  for (let i = 0; i < 7; i++) {
    const a = (i + rt.range(0.15, 0.85)) / 7 * Math.PI * 2, rad = rt.range(64, 150), h = rt.range(18, 38), r = rt.range(4.6, 7), fallen = rt.chance(0.5) ? 1 : 0, square = rt.chance(0.3), sd = rt();
    const x = -6 + rad * Math.cos(a), z = 138 + rad * 0.62 * Math.sin(a), hh = fallen ? h * lerp(0.3, 0.58, sd) : h;
    const t = { x, z, r: square ? r + 1.6 : r, h: hh, fallen, square, cap: fallen ? 0 : sd < 0.5 ? 1 : 2, seed: sd, y: g(x, z) - 0.8 };
    const road = Math.abs(x - P.roadX(z)) > t.r + 8 && z > faceZ(0) + t.r + 12 && z < 300;
    if (road && clearOfOthers(x, z, t.r) && P.keep(fallen ? 'fallen tower' : 'tower', P.gapCyl(x, z, fallen ? t.r * 1.13 + 2.2 : t.r * 1.3, t.y - 3, t.y + hh + (t.cap === 1 ? t.r + 2 : 2.4)), MADE)) stand(t);
  }
  // the stable: its wide dark doorway faces the road
  const st = { x: -(ROAD_HALF + 10.5), z: rh.range(62, 78), yaw: 0, hw: 4.6, hl: rh.range(10, 12), eave: 5.2, rise: 4.2, ruined: 0, smoke: 1, stable: 1, seed: rh() };
  const hy = (h) => Math.min(g(h.x - h.hw, h.z), g(h.x + h.hw, h.z), g(h.x, h.z - h.hl), g(h.x, h.z + h.hl)) - 0.3;
  st.y = hy(st);
  // (the stable asks the towers already standing: where one stands in it, or within a metre of its walls, the stable is
  // not built. It keeps its place in the list all the same, marked off, so that no other thing of the castle is dealt otherwise)
  const stFoot = { t: 1, x: st.x, z: st.z, c: 1, s: 0, hx: st.hw, hz: st.hl };
  if (P.keep('hall', P.gapBox(st.x, st.z, 0, st.hw + 0.8, st.hl + 0.8, st.y - 2, st.y + st.eave + st.rise + 2.5), MADE)) {
    halls.push(st);
    if (built.some((q) => q.kind === 'tower' && footGap(stFoot, q.x, q.z) < q.r + 1)) { st.off = true; P.dropped['stable in a tower'] = 1; } else boxF('hall', st);
  }
  P.stable = st;
  yield;
  // (two halls are apart when their footprints, each taken as wide as it lies across the road and along it, are 3 m apart)
  const ext = (o) => (Math.abs(Math.sin(o.yaw)) > 0.5 ? [o.hl + 1.2, o.hw + 1.2] : [o.hw + 1.2, o.hl + 1.2]);
  const apart = (a, b) => { const ea = ext(a), eb = ext(b); return Math.abs(a.x - b.x) > ea[0] + eb[0] + 3 || Math.abs(a.z - b.z) > ea[1] + eb[1] + 3; };
  for (let i = 0; i < 11; i++) {
    const z = lerp(84, 254, (i + rh.range(0.1, 0.9)) / 11), sd = i % 2 ? 1 : -1, hw = rh.range(4.8, 6.6), hl = rh.range(10, 16.5), off = rh.range(8.5, 17), turned = rh.chance(0.25), yaw = rh.range(-0.22, 0.22) + (turned ? Math.PI / 2 : 0);
    const eave = rh.range(5.0, 6.8), rise = rh.range(3.8, 5.4), ruined = rh.chance(0.36) ? 1 : 0, smoke = rh.chance(0.85) ? 1 : 0, sdd = rh();
    const x = P.roadX(z) + sd * (off + (turned ? hl : hw) + 1.2), reach = Math.hypot(hw, hl);
    const h = { x, z, yaw, hw, hl, eave, rise, ruined, smoke: ruined ? 0 : smoke, stable: 0, seed: sdd }; h.y = hy(h);
    const free = towers.every((t) => Math.hypot(t.x - x, t.z - z) > t.r * 1.3 + reach + 1.5) && halls.every((o) => apart(o, h));
    if (free && P.clearings.every((c) => Math.hypot(c.x - x, c.z - z) > c.r + reach) && P.keep('hall', P.gapBox(x, z, yaw, hw + 0.8, hl + 0.8, h.y - 2, h.y + eave + rise + 2.5), MADE)) { halls.push(h); boxF('hall', h); }
  }
  halls.forEach((h, i) => { h.i = i; });   // (each hall's own number: the world deals its details by it)
  // the smoke of the chimneys leans west on the wind. Each column is tested BY ITS OWN LAW (round 4; the kit's law of a
  // rising puff, with the measures in SMOKE): in eight lengths of its height, each a rod along the column's bent axis as
  // thick as the farthest a puff's edge can stand from the axis there (its place in the column's spread, its sway, its
  // own radius), and kept where the line stays 3 m clear of every one (MADE: the same clearance as every made thing; the
  // kit thins a puff as the eye comes near it. Round 4 asked 8 m and left out 73 columns on a hundred seeds). THE PUFF AS
  // IT IS MADE (round 4 mending 2): a puff's sheet has corners beyond the puff's own round; the same eight rods, each as
  // thick as the farthest a CORNER can stand from the axis, must stand 2.5 m and more from the line as well, so that
  // no part of any sheet, drawn or not, comes within the law's 2.5 m at any clock (the gap written down for the kind is
  // the lesser of the puff's own and the corners' with half a metre added)
  const smokes = []; let nSm = 0;
  for (const h of halls) {
    h.ch = h.seed < 0.5 ? -1 : 1;
    const c = Math.cos(h.yaw), s = Math.sin(h.yaw), lz = h.ch * (h.hl - 0.75), top = [h.x + lz * s, h.y + h.eave + h.rise + 1.5, h.z + lz * c];
    let gs = 99, gc = 99;
    for (let j = 0; j < 8; j++) { const a = smokeAxis(top, j / 8), b = smokeAxis(top, (j + 1) / 8); gs = Math.min(gs, P.gapRod(a, b, smokeReach((j + 1) / 8))); gc = Math.min(gc, P.gapRod(a, b, smokeCorner((j + 1) / 8))); }
    if (h.smoke && nSm < 5 && P.keep('smoke', Math.min(gs, gc + 0.5), MADE)) { nSm++; if (!h.off) smokes.push(top); }
  }
  yield;
  // the yard's own life: men walking beats along the fronts of the halls; split wood under snow, barrels, a cart with its
  // shafts down, posts for sword-work; braziers with men about them. THE CASTLE'S CLEARED WAY is the road itself, from
  // where it comes in among the halls to the gate in the ice: no thing of the yard has its middle within 7.5 m of the
  // road's middle (the bed's 3 m and 4.5 m of verge kept for carts and riders), on either side, at any place along it.
  // Beyond that each thing stands where its own draws put it, 7.5 to 36 m off the road, clear of the halls, the towers
  // and each other; one is left out only where the line itself would pass within 3 m of its 2.7 m round (2.5 m and half
  // a metre for a made thing): P.keep. (Round 4 kept a lane of 9.5 m about the line's track here; it is struck.)
  const ry = P.R.yard, beats = [], spots = [], things = [], men = [];
  for (let i = 0; i < 9; i++) {
    const pb = ry(), ph = ry(), sp = ry.range(0.85, 1.25), h = halls[i];
    if (!h || h.stable || h.ruined || pb > 0.95 * P.density) continue;
    const sd = h.x < 0 ? 1 : -1, c = Math.cos(h.yaw), s = Math.sin(h.yaw), lx = sd * (h.hw + 2.6), lz = h.hl + 3;
    const a = [h.x + lx * c - lz * s, h.z - lx * s - lz * c], b = [h.x + lx * c + lz * s, h.z - lx * s + lz * c];
    const clear = towers.every((t) => Math.hypot(t.x - a[0], t.z - a[1]) > t.r * 1.3 + 2 && Math.hypot(t.x - b[0], t.z - b[1]) > t.r * 1.3 + 2);
    // (a beat asks what is built: it runs clear of every hall but its own, by a body's width and more)
    if (clear && P.keep('yard walker', P.gapRod([a[0], g(a[0], a[1]) + 1.1, a[1]], [b[0], g(b[0], b[1]) + 1.1, b[1]], 1.3), EYE + 0.2)) {
      const q = { a, b, ph, sp };
      spots.push(q);
      if (rodGap(a, b, (f) => f.of !== h) < 1.0) P.dropped['beat in a building'] = (P.dropped['beat in a building'] || 0) + 1; else { beats.push(q); rodF('beat', a, b, 0.6, q); }
    }
  }
  const offBeat = (x, z) => spots.every((q) => { const ax = q.b[0] - q.a[0], az = q.b[1] - q.a[1], t = clamp(((x - q.a[0]) * ax + (z - q.a[1]) * az) / (ax * ax + az * az), 0, 1); return Math.hypot(x - q.a[0] - ax * t, z - q.a[1] - az * t) > 4; });
  for (let i = 0; i < 18; i++) {
    const z = lerp(64, 268, (i + ry.range(0.1, 0.9)) / 18), sd = ry() < 0.5 ? -1 : 1, off = ry.range(7.5, 36), kd = ry(), rot = ry.range(0, 3.14), sdd = ry(), nm = ry(), a0 = ry.range(0, 6.28);
    const x = P.roadX(z) + sd * off, y = g(x, z), kind = i % 4 === 1 ? 'brazier' : kd < 0.36 ? 'wood' : kd < 0.66 ? 'barrels' : kd < 0.84 ? 'cart' : 'posts';
    const free = offBeat(x, z) && towers.every((t) => Math.hypot(t.x - x, t.z - z) > t.r * 1.3 + 4.5) && halls.every((o) => Math.hypot(o.x - x, o.z - z) > Math.hypot(o.hw, o.hl) + 3.6) && Math.abs(x - (P.stable.x + P.stable.hw + 5)) + Math.abs(z - P.stable.z) * 0.3 > 9;
    if (free && P.keep('yard thing', P.gapCyl(x, z, 2.7, y - 1, y + 4.8), EYE + 0.5)) {
      // (a thing of the yard asks the things already standing: none within its own measure, with the men about a brazier, of another)
      const th = { kind, x, z, rot, seed: sdd }, rad = kind === 'brazier' ? 2.5 : 2.7;
      if (P.builtGap(x, z, (f) => f.kind === 'thing') < rad + 0.3) { P.dropped['yard thing in another'] = (P.dropped['yard thing in another'] || 0) + 1; continue; }
      things.push(th); disc('thing', x, z, rad, th);
      const n = kind === 'brazier' ? 2 + Math.floor(nm * 2.6 * P.density) : 0;
      for (let k = 0; k < n; k++) { const a = a0 + k * 1.9; men.push({ x: x + 1.9 * Math.cos(a), z: z + 1.9 * Math.sin(a), face: Math.atan2(-Math.cos(a), -Math.sin(a)) }); }
    }
  }
  yield;
  // covered ways of timber between a hall and its nearest neighbour on its own side of the road: each from wall to wall,
  // tested as a rod 2 m thick, and kept where it clears the line, the road, every other building and the yard's things, men and beats
  // (they are dealt after the yard, from a stream of their own, and ask it)
  const ways = [], rw = P.R.ways;
  for (const h of halls) {
    let best = null, bd = 70;
    for (const o of [...halls, ...towers]) { if (o === h) continue; const d = Math.hypot(o.x - h.x, o.z - h.z); if (d < bd && (o.x - P.roadX(o.z)) * (h.x - P.roadX(h.z)) > 0) { bd = d; best = o; } }
    const kd = rw();
    if (!best || h.off || best.off || ways.some((w) => w.to === h && w.from === best)) continue;
    const ra = Math.min(h.hw, h.hl) + 0.4, rb2 = best.r ? best.r * 1.02 : Math.min(best.hw, best.hl) + 0.4, dx = (best.x - h.x) / bd, dz = (best.z - h.z) / bd;
    if (bd - ra - rb2 < 5) continue;
    const a = [h.x + dx * ra, h.z + dz * ra], b = [best.x - dx * rb2, best.z - dz * rb2], ya = g(a[0], a[1]), yb = g(b[0], b[1]);
    const others = [...halls, ...towers].every((o) => { if (o === h || o === best) return true; const ax = b[0] - a[0], az = b[1] - a[1], t = clamp(((o.x - a[0]) * ax + (o.z - a[1]) * az) / (ax * ax + az * az), 0, 1); return Math.hypot(o.x - a[0] - ax * t, o.z - a[1] - az * t) > (o.r ? o.r * 1.3 : Math.hypot(o.hw, o.hl)) + 2; });
    if (others && P.keep('covered way', P.gapRod([a[0], ya + 1.8, a[1]], [b[0], yb + 1.8, b[1]], 2.0), EYE + 0.4)) {
      // (a way asks the yard: no thing of it, no man and no beat under its roof or within half a metre of its eaves)
      const w = { a, b, ya, yb, from: h, to: best, open: kd < 0.3 };
      if (rodGap(a, b, (f) => f.kind === 'thing' || f.kind === 'beat') < 1.7 + 0.5) { P.dropped['way through the yard'] = (P.dropped['way through the yard'] || 0) + 1; continue; }
      ways.push(w); rodF('way', a, b, 1.7, w);
    }
  }

  P.castle = { towers, halls: halls.filter((h) => !h.off), ways, gate: { x: 0, z: faceZ(0), w: 5.6, h: 6.6 }, tint: rc.range(0, 1), smokes, yard: { things, men, beats } };
}

// beside the road: a ruined holdfast half under the snow (the stump of a square tower, the stubs of two walls), and at the
// fork a waymark of piled stone. Each stands where it stands for every visitor and is tested like every other thing
function planRoad(P) {
  const r = P.R.holdfast, g = P.groundAt, zs = P.zStart;
  // (it stands 110 to 150 m north of the road's head, 17 to 21 m west of the road's middle, about where the riders' way
  // forks off to the east: south of the castle's first halls)
  const z = zs - r.range(110, 150), off = r.range(17, 21), x = P.roadX(z) - off, yaw = r.range(-0.3, 0.3);
  const t = { x, z, r: 4.2, h: r.range(6.5, 9), fallen: 1, square: true, cap: 0, seed: r(), y: g(x, z) - 0.8 };
  const walls = [];
  for (let k = 0; k < 2; k++) { const a = yaw + (k ? 1.5708 : 3.1416) + r.range(-0.2, 0.2), len = r.range(7, 11), h = r.range(1.7, 3.2), sd = r(); walls.push({ a, len, h, seed: sd }); }
  let gh = P.gapCyl(x, z, t.r * 1.13 + 2.2, t.y - 3, t.y + t.h + 2);
  for (const w of walls) gh = Math.min(gh, P.gapRod([x, t.y + 1.5, z], [x + (w.len + 4.5) * Math.cos(w.a), t.y + 1.5, z + (w.len + 4.5) * Math.sin(w.a)], 2.2));
  P.holdfast = { tower: t, walls, on: P.keep('holdfast', gh, MADE) };
  if (P.holdfast.on) P.clearings.push({ x: x - 3, z: z + 3, r: 15 });
  const wz = P.fork.z + r.range(17, 22), wx = (P.roadX(wz) + ROAD_HALF + P.forkX(wz) - 1.3) / 2, wh = r.range(2.6, 3.4), ws = r();
  P.waymark = { x: wx, z: wz, y: g(wx, wz), h: wh, seed: ws, on: P.keep('waymark', P.gapCyl(wx, wz, 1.0, g(wx, wz) - 1, g(wx, wz) + wh + 0.4), MADE) };
  if (P.waymark.on) P.clearings.push({ x: wx, z: wz, r: 2.5 });
}

// the switchback stair up the south face, the cage on its chain beside it, the crane that winches it
function planStair(P) {
  const r = P.R.stair, rc = P.R.cage, H = WALL_H;
  // (the stair stands 180 to 220 m east of the gate's meridian, the cage 30 to 37 m east of the stair's middle)
  const x = r.range(180, 220), hw = 15, n = 12, dir0 = r.chance(0.5) ? 1 : -1;
  const yb = P.groundAt(x, faceZ(0) + 4) - 0.6, rise = (H - yb) / n;
  // the stair's outer sills stand 5.85 m off the bare face (tested to 5.9 m, to 0.2 m beyond its landings' ends, and to
  // 2.4 m over the lip: a man at its head), the cage's outer bars 5.8 m (tested to 6.4 m); both over their whole height
  const lane = (cx, half, out) => {
    let best = 99;
    const S = P.samples;
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (s[2] < 0 || Math.abs(s[0] - cx) > half + 45) continue;
      const a = Math.max(Math.abs(s[0] - cx) - half, 0), b = Math.max(s[2] - faceZ(s[1]) - out, 0), c = Math.max(s[1] - H - 2.4, 0), d = Math.sqrt(a * a + b * b + c * c);
      if (d < best) best = d;
    }
    return best;
  };
  P.stair = { x, hw, n, rise, dir0, yb, inner: 3.3, width: 2.3, ok: P.keep('stair', lane(x, hw + 2.4, 5.9), EYE) };
  // a lantern hangs at every landing, on the post at its outer corner, 2.3 m over the planks (inside the stair's own
  // measure, which was tested whole): each lights the ice, the timber and the snow about it (the shaders' face list)
  P.stair.lanterns = [];
  if (P.stair.ok) for (let k = 0; k < n; k++) { const dir = k % 2 ? -dir0 : dir0, y = yb + (k + 1) * rise; P.stair.lanterns.push([x + dir * (hw + 0.5), Math.min(y + 2.3, H + 2.3), faceZ(Math.min(y, H)) + 3.3 + 2.0]); }
  const xc = x + hw + rc.range(15, 22), period = rc.range(72, 96), ph = rc();
  // ... and its chain, from the cage's bail to the block at the crane's beak, at every height the cage can hang at
  const cy0 = P.groundAt(xc, faceZ(0) + 5) + 1.2, cy1 = H - 6.5;
  // (two chains, 1.1 m apart: tested as one rod 0.75 m thick)
  let gch = 99; for (let k = 0; k <= 24; k++) { const y = lerp(cy0, cy1, k / 24); gch = Math.min(gch, P.gapRod([xc, y + 3.3, faceZ(y) + 4.7], [xc, H + 12, 14.1], 0.75)); }
  P.cage = { x: xc, period, ph, off: 4.7, y0: cy0, y1: cy1, ok: P.keep('cage', lane(xc, 2.0, 6.4), EYE) && P.keep('chain', gch, EYE) };
}

// WHAT STANDS ON THE TOP: fires and sentries, warming sheds, engines on the north side, cranes on the south side.
// THE KEPT WALK (round 4 mending 1): down the middle of the wall's top, for the whole of its length, runs a walk that is
// swept and gritted: WALK_HALF to either side of the wall's own axis. The men who keep it leave nothing standing on it:
// EVERY THING OF THE TOP STANDS TO ONE OF ITS TWO SIDES, each kind at its own distance from the axis:
//   a fire's basket (0.75 m about its middle) 3.7 to 4.7 m off the axis, its near edge 2.95 m off and more; the men at
//     it on the half ring that lies toward the lip
//   a warming shed 4.9 m off (its near wall 3.35 m); a store 5.3 m off (its near edge 4.2 m); a sentry's beat 5.75 m off
//   an engine's frame 4.75 m off on the north side (its near edge on the walk's own edge), its arm out over the north lip
//   a crane's mast 5.3 m off on the south side (its foot 4.4 m off), its jib out over the south lip; the jib's heel
//     passes over the walk's southern side 8.2 m up
// CRANES STAND AT THEIR STATIONS by the wall's own measure: one at the cage's hoist, and every fourth place along the
// wall (the places lie 15 to 25 m apart: some 80 m) is a station where a crane or a shed stands, a crane at somewhat
// more than half of them. No crane is left out for standing idle anywhere.
// A thing is left out only where THE LINE ITSELF would pass within its TRUE CLEARANCE: 2.5 m and a fifth of a metre
// from the thing's own body, measured in space (P.keep with the thing AS IT IS MADE: a fire with its flame as a drum
// 3.3 m high; a shed and a store as boxes; an engine as its frame's box and three rods, its arm, its sling with the
// pouch, its windlass rope; a crane as three rods, its mast, its jib with the block at the heel, its rope with the
// hook or the idle cage). The line crosses the top 7.6 m and more over it, so fires, sheds, stores and men stand
// under it; an engine or a crane any part of which the line would come within 2.7 m of is not there (m2-true.mjs
// counts every one by its own triangles as built). (Round 4 kept a lane of 6.1 m about the line's
// track for every thing, 15.1 m for cranes, and no idle crane within 60 m of where the line came over the lip: all
// three are struck.)
export const WALK_HALF = 2.2;
function* planTop(P) {
  const r = P.R.top, rs = P.R.sentries, ra = P.R.sentryAt, H = WALL_H, things = [], sentries = [], pacers = [], beatsDealt = [];
  const xa = P.manned.x0, xb = P.manned.x1;
  const lost = (why) => { P.dropped[why] = (P.dropped[why] || 0) + 1; return true; };
  // (a crane is measured in three rods: its mast with its foot; its jib from heel to beak with the block at its heel;
  // the rope with the block at the beak and, on an idle crane, the cage that hangs under it)
  const crane = (x, winch) => {
    const a = P.gapRod([x, H, 5.3], [x, H + 10.4, 5.3], 0.45), b = P.gapRod([x, H + 8.2, 2.4], [x, H + 12.2, 14.2], 0.6), c = P.gapRod([x, H + 12.2, 14.2], [x, H + 3, 14.2], 0.95);
    if (P.keep('crane', Math.min(a, b, c), EYE + 0.2)) things.push({ kind: 'crane', x, z: 5.3, winch });
  };
  crane(P.cage.x, 1);
  let x = xa + r.range(0, 18), i = 0, nFires = 0;
  while (x < xb) {
    const kd = r(), sdr = r(), jit = r(), step = r.range(15, 25), ks = r(), js = r(), nd = rs(), pd = rs(), pl = rs.range(13, 23), pp = rs(), a0 = rs.range(0, 6.28);
    // (each place deals three numbers for the men at its fire from a stream of their own, whether it holds a fire or not)
    const th = [ra(), ra(), ra()];
    const cyc = i % 4, kind = cyc === 0 || cyc === 2 ? 'fire' : cyc === 1 ? (kd < 0.62 ? 'engine' : 'shed') : (kd < 0.55 ? 'crane' : 'shed');
    const sgn = sdr < 0.5 ? -1 : 1;
    if (Math.abs(x - P.cage.x) > 9 && Math.abs(x - P.stair.x) > 5) {
      if (kind === 'fire') {
        const z = sgn * lerp(3.7, 4.7, jit);
        // (a fire that burns lights the snow about it: the shaders' list holds FIRES_TOP of them, and no more are lit)
        if (P.keep('fire', P.gapCyl(x, z, 0.75, H, H + 3.3), EYE + 0.2) && !(nFires >= FIRES_TOP && lost('fire beyond the list'))) {
          nFires++;
          things.push({ kind, x, z, seed: kd });
          const n = 1 + Math.floor(nd * 2.3 * P.density);
          // each man stands at an angle of his own (drawn within his own share of it) on the half ring about the fire that
          // lies toward the edge; one who would stand within a body's width of a man already there is not there
          const here = [];
          for (let k = 0; k < n; k++) {
            const a = 0.2 + 2.74 * (k + 0.2 + 0.6 * th[k]) / n, sx = x + 1.7 * Math.cos(a), sz = z + sgn * 1.125 * Math.sin(a);
            if (here.some((q) => Math.hypot(q[0] - sx, q[1] - sz) < 1.1)) { P.dropped['sentry in a sentry'] = (P.dropped['sentry in a sentry'] || 0) + 1; continue; }
            if (P.keep('sentry', P.gapCyl(sx, sz, 0.45, H, H + 2.2), EYE + 0.1)) { here.push([sx, sz]); sentries.push({ x: sx, z: sz, face: Math.atan2(x - sx, z - sz), ph: a }); }
          }
        }
      } else if (kind === 'shed') {
        const z = sgn * 4.9;
        const hx = lerp(2.0, 4.4, jit);   // sheds of every length
        if (P.keep('shed', P.gapBox(x, z, 0, hx + 0.1, 1.55, H, H + 3.6), EYE + 0.2)) things.push({ kind, x, z, sgn, seed: kd, hx });
      } else if (kind === 'engine') {
        // a great engine for throwing, MEASURED AS IT IS MADE (topInto; round 4 mending 2): its frame, sills, windlass and
        // hung weight as a box 7.1 m high; its long arm as a rod from the hung weight to its tip out over the north
        // edge (the arm stands cocked at an angle of its own); the sling that hangs 4.8 m under the arm's tip with its
        // pouch, as a rod 0.45 m thick; the windlass rope from the foot to the arm, as a rod. It is built still:
        // nothing of it sways
        const tip = lerp(13.5, 16.5, jit), zc = -4.6, g = Math.min(P.gapBox(x, -4.75, 0, 2.75, 2.55, H, H + 7.1), P.gapRod([x, H + 1.4, -2.5], [x, H + tip, zc - 6.6], 0.75),
          P.gapRod([x, H + tip, zc - 6.6], [x, H + tip - 4.94, zc - 6.2], 0.45), P.gapRod([x + 0.4, H + 1.0, zc - 2.3], [x, H + lerp(2.9, tip, 0.72), lerp(zc + 1.45, zc - 6.6, 0.72)], 0.1));
        if (P.keep('engine', g, EYE + 0.2)) things.push({ kind, x, z: zc, seed: kd, tip });
      } else crane(x, 0);
      // across the way from it: a sentry pacing a beat along the edge, or else the wall's stores (barrels of oil and pitch,
      // stones piled for the engines, a rack of spears, split wood stacked under its snow)
      const far = kind === 'engine' ? 1 : kind === 'crane' ? -1 : -sgn;
      if (pd < 0.42 * P.density) {
        const z = far * 5.75;
        if (P.keep('pacer', P.gapBox(x, z, 0, pl / 2, 0.45, H, H + 2.2), EYE + 0.1)) beatsDealt.push({ x, z, len: pl, ph: pp });
      } else {
        const xs = x + (js - 0.5) * 6, z = far * 5.3;
        if (P.keep('store', P.gapBox(xs, z, 0, 1.75, 1.1, H, H + 2.5), EYE + 0.2)) things.push({ kind: 'store', sub: Math.floor(ks * 4), x: xs, z, sgn: far, seed: js });
      }
    }
    x += step; i++;
    if (i % 5 === 0) yield;
  }
  // the beats, now that every thing of the top stands: a beat that would share ground with a beat already kept on its side,
  // or run through a shed, a store, a crane's foot, a fire or the men about it, is not walked (half a metre clear at the least)
  const foot = (q) => (q.kind === 'shed' ? [q.hx + 0.1, 1.55] : q.kind === 'store' ? [1.75, 1.1] : q.kind === 'crane' ? [0.9, 0.9] : q.kind === 'engine' ? [2.75, 2.55] : [0.75, 0.75]);
  for (const b of beatsDealt) {
    const hit = pacers.some((o) => o.z === b.z && Math.abs(o.x - b.x) < (o.len + b.len) / 2 + 0.5)
      || things.some((q) => { const f = foot(q), qz = q.kind === 'engine' ? -4.75 : q.z; return Math.abs(q.x - b.x) < b.len / 2 + f[0] + 0.5 && Math.abs(qz - b.z) < 0.45 + f[1] + 0.3; })
      || sentries.some((q) => Math.abs(q.x - b.x) < b.len / 2 + 0.95 && Math.abs(q.z - b.z) < 1.2);
    if (hit) P.dropped['beat on the top in another'] = (P.dropped['beat on the top in another'] || 0) + 1; else pacers.push(b);
  }
  yield;
  // the kerb of piled ice along both lips, in stretches of 24 m: each stretch is tested as a rod 1.35 m thick, which
  // holds its greatest block however it is turned, and stands where the line keeps its true clearance of it (it does
  // everywhere: the line crosses the top 7.6 m over it; the kerb's own runs and gaps are the maker's, parapetList)
  const parapet = [];
  for (let px = xa; px < xb; px += 24) for (const sg of [-1, 1]) {
    if (P.keep('parapet', P.gapRod([px, H + 0.55, sg * 6.5], [px + 24, H + 0.55, sg * 6.5], 1.35), EYE + 0.2)) parapet.push([px, sg]);
  }
  yield;
  // far fires along the whole top, to the edge of sight both ways, beyond the stretch that is furnished (xa to xb): each
  // a bead of light with its pool of light drawn flat on the ice about it (ONLY A GLOW and its pool: they are not in
  // the shaders' lists)
  const beads = [];
  for (let bx = xa - 2400; bx < xb + 2600; bx += 47) if (bx < xa - 20 || bx > xb + 20) beads.push([bx, H + 1.4, (Math.round(bx / 47) % 2 ? 1 : -1) * 4]);
  P.top = { things, sentries, pacers, beads, parapet, xa, xb };
}

// A kit tree's own measures, taken on its geometry: in each tenth of its height the widest radius WITH its sway at the
// fullest wind. The kit bends a vertex by its own wind.x metres times the plant's scale, the wind's strength (0.8 here)
// and a bend of 1.44 at the most (a gust of 1.1 and a wobble of 0.34); its flutter stays under 0.2 m.
const WIND_K = 0.8 * 1.44, FLUTTER = 0.2, GRID = 0.3;
// every triangle of the tree is walked on a grid (no point of it more than 0.3 m from a grid point): f(x, y, z, sway)
function walkTree(geo, f, y0 = -1e9, y1 = 1e9, skip = null, t0 = 0, t1 = 1e9) {
  const p = geo.attributes.position, w = geo.attributes.wind, ix = geo.index, n = ix ? ix.count : p.count;
  for (let t = t0; t < Math.min(n, t1); t += 3) {
    const a = ix ? ix.getX(t) : t, b = ix ? ix.getX(t + 1) : t + 1, c = ix ? ix.getX(t + 2) : t + 2;
    const ya = p.getY(a), yb = p.getY(b), yc = p.getY(c);
    if (Math.min(ya, yb, yc) > y1 || Math.max(ya, yb, yc) < y0) continue;
    const xa = p.getX(a), xb = p.getX(b), xc = p.getX(c), za = p.getZ(a), zb = p.getZ(b), zc = p.getZ(c);
    if (skip && skip(xa, za, xb, zb, xc, zc)) continue;
    const sw = w ? WIND_K * Math.max(w.getX(a), w.getX(b), w.getX(c)) : 0;
    const e = Math.max(Math.hypot(xa - xb, ya - yb, za - zb), Math.hypot(xb - xc, yb - yc, zb - zc), Math.hypot(xc - xa, yc - ya, zc - za)), m = clamp(Math.ceil(e / 0.5), 1, 40);
    for (let i = 0; i <= m; i++) for (let j = 0; j <= m - i; j++) { const u = i / m, v = j / m, q = 1 - u - v; f(xa * q + xb * u + xc * v, ya * q + yb * u + yc * v, za * q + zb * u + zc * v, sw); }
  }
}
// (no grid here: a triangle's farthest point from the axis is one of its corners, and its widest corner, with the sway,
// is written into every tenth of the height the triangle reaches into, so each tenth is as wide as the tree is there or wider)
function profileOf(geo) {
  const H = geo.userData.height || 1, wide = new Float32Array(10), p = geo.attributes.position, w = geo.attributes.wind, ix = geo.index, n = ix ? ix.count : p.count;
  let rmax = 0, sway = 0, top = 0;
  for (let t = 0; t < n; t += 3) {
    let r = 0, y0 = 1e9, y1 = -1e9;
    for (let k = 0; k < 3; k++) {
      const i = ix ? ix.getX(t + k) : t + k, sw = w ? WIND_K * w.getX(i) : 0, y = p.getY(i);
      r = Math.max(r, Math.hypot(p.getX(i), p.getZ(i)) + sw); if (sw > sway) sway = sw; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    for (let b = clamp(Math.floor(y0 / H * 10), 0, 9), b1 = clamp(Math.floor(y1 / H * 10), 0, 9); b <= b1; b++) if (r > wide[b]) wide[b] = r;
    if (r > rmax) rmax = r; if (y1 > top) top = y1;
  }
  return { H: Math.max(H, top), rmax, wide, sway };
}
// a tree's widest reach and greatest sway by its corners alone (the farthest point of a triangle from the axis is a corner)
function spanOf(geo) {
  const p = geo.attributes.position, w = geo.attributes.wind; let rmax = 0, sway = 0;
  for (let i = 0; i < p.count; i++) { const sw = w ? WIND_K * w.getX(i) : 0, r = Math.hypot(p.getX(i), p.getZ(i)) + sw; if (r > rmax) rmax = r; if (sw > sway) sway = sw; }
  return { rmax, sway };
}
// the wider of two makes of one tree (the near one and the plainer far one), tenth by tenth
function widerOf(a, b) { const wide = new Float32Array(10); for (let i = 0; i < 10; i++) wide[i] = Math.max(a.wide[i], b.wide[i]); return { H: Math.max(a.H, b.H), rmax: Math.max(a.rmax, b.rmax), wide, sway: Math.max(a.sway, b.sway) }; }
// the grid points of a tree within `reach` of the height hl over its foot, each with its sway: [x, z, dy, sway] in fours
// (skip may leave out triangles that cannot matter: its corners are handed to it)
// (the tree's triangles are walked a sixth at a time, a step of the build each)
function* bandPoints(geo, hl, reach, skip = null) {
  const out = [], n = geo.index ? geo.index.count : geo.attributes.position.count, cut = Math.ceil(n / 18) * 3;
  for (let t0 = 0; t0 < n; t0 += cut) { walkTree(geo, (x, y, z, sw) => { out.push(x, z, y - hl, sw); }, hl - reach, hl + reach, skip, t0, t0 + cut); yield; }
  return new Float32Array(out);
}
// how near a straight level line may pass that tree, turned by yaw, with nothing of it (at its fullest sway) within `need`
function lateralOf(pts, yaw, need, toward) {
  const c = Math.cos(yaw), s = Math.sin(yaw); let D = 0;
  for (let i = 0; i < pts.length; i += 4) {
    const nd = need + pts[i + 3], dy = pts[i + 2]; if (Math.abs(dy) >= nd) continue;
    const l = (pts[i] * c + pts[i + 1] * s) * toward[0] + (-pts[i] * s + pts[i + 1] * c) * toward[1];
    D = Math.max(D, l + Math.sqrt(nd * nd - dy * dy));
  }
  return D;
}
// ... and how near the line truly passes it, standing D to the side: the least distance less the sway
function lateralGap(pts, yaw, D, toward) {
  const c = Math.cos(yaw), s = Math.sin(yaw); let gmin = 1e9;
  for (let i = 0; i < pts.length; i += 4) { const l = (pts[i] * c + pts[i + 1] * s) * toward[0] + (-pts[i] * s + pts[i + 1] * c) * toward[1]; gmin = Math.min(gmin, Math.hypot(D - l, pts[i + 2]) - pts[i + 3]); }
  return gmin;
}
export const CONIFER_H = [17, 21, 25], TRUNK_H = [46, 54], WHITE_H = [15, 18, 21];
// THE WAY TO THE GROVE'S OWN MEASURES (planForests says what each is for): its kept half width, its verge beyond, how
// far the wood's great trunks are felled back from its middle; the half width of the avenue's aisle
const WAY_HALF = 9, WAY_VERGE = 5, WAY_FELL = 22, AISLE_HALF = 8.5;
// THE HERD'S MEASURES (round 4 mending 3), handed to the kit's herd maker as they stand here (the world's buildLife):
// how far about the herd's middle the beasts' loops are dealt, how wide a loop is against the kit's own (roam), a
// beast's size, its coat (a dun: not the men's black).
// ELK_ROUND: the farthest any part of any beast can be from the herd's middle BY THE KIT'S OWN NUMBERS (its herd
// maker, grazing: a loop's middle is dealt within the radius, widened by 1.8 at the most where loops crowd; a loop's
// radius is 6 m at the most, times 0.6 and half the species' height (a deer's is 1), times roam; its points lie 1.3
// of that from its middle at the most, taken as 1.4 here for the curve between them), and 2 m for the beast's own
// length before and behind the point it walks on. The report's count reads every loop out of the kit's own table
// and holds it against this (m3-elk.mjs).
export const ELK = { radius: 10, roam: 0.7, size: 1.45, coat: '#8a7256' };
const ELK_ROUND = 1.8 * ELK.radius + 1.4 * 6 * 1.1 * ELK.roam + 2;

// the forests on both sides of the wall (the northern wood cut back behind its open belt) and the grove of white trees
function* planForests(P) {
  const g = P.groundAt, dens = P.density, n = P.noise;
  // a field of cells, each with a place and five numbers of its own; span(z) may give the part of a row that is worth walking;
  // the page is handed back after every `per` cells (fewer where a cell costs more: a tree measured against the line)
  const cells = function* (rng, x0, x1, z0, z1, cell, f, span = null, per = 1100) {
    let since = 0;
    for (let z = z0; z < z1; z += cell) {
      const sp = span ? span(z + cell / 2) : null, xa = sp ? x0 + cell * Math.max(0, Math.floor((sp[0] - x0) / cell) - 1) : x0, xb = sp ? Math.min(x1, sp[1] + cell) : x1;
      for (let x = xa; x < xb; x += cell) { const jx = rng(), jz = rng(), k = rng(), s = rng(), rot = rng(), v = rng(); f(x + jx * cell, z + jz * cell, k, s, rot, v); since++; }
      if (since >= per) { since = 0; yield; }
    }
    yield;
  };
  const clump = (x, z) => 0.62 + 0.55 * n.n2(x * 0.012 + 40, z * 0.012 - 17);
  // how wooded the far country is at a place (0 clearing .. 1 thick stand)
  const wood = P.woodAt = (x, z) => clamp((0.62 + 0.55 * n.n2(x * 0.0045 + 11, z * 0.0045 - 5) + 0.25 * n.n2(x * 0.019, z * 0.019 + 8) - 0.42) * 2.4, 0, 1);
  // the kit's trees of this place are made here, a step each, so that every one is tested with its own measures:
  // slim snow-laden spruces, great dark trunks, the white trees with their dark red leaves (a near make and a plainer far one)
  const pine = { leaf: '#22423a', leafLight: '#32584a', leafDark: '#162e28', bark: '#514a45', barkDark: '#2e2a27' };
  const dark = { leaf: '#2a4a40', leafLight: '#3a6052', leafDark: '#1b322b', bark: '#9a8c80', barkLight: '#b8aa9c', barkDark: '#6a5e56' };
  const bone = { leaf: '#b81a22', leafLight: '#ee4a40', leafDark: '#7a0e16', bark: '#e2dccf', barkDark: '#b4ac9e' };
  const tr = (name) => makeRng(hashSeed('ice-tree-' + name + ':' + P.seed));
  const T = P.trees = { con1: [], con0: [], red1: [], red0: [], white1: [], white0: [], great: [] };
  for (let i = 0; i < 3; i++) {
    T.con1.push(flora.coniferGeometry({ rng: tr('spruce-near' + i), height: CONIFER_H[i], detail: 1, snow: 0.6, slim: 1.25, flex: 0.7, ...pine })); yield;
    T.con0.push(flora.coniferGeometry({ rng: tr('spruce-far' + i), height: CONIFER_H[i], detail: 0, snow: 0.6, slim: 1.25, flex: 0.7, ...pine })); yield;
  }
  for (let i = 0; i < 2; i++) {
    T.red1.push(flora.redwoodGeometry({ rng: tr('trunk-near' + i), height: TRUNK_H[i], detail: 1, girth: 0.05, ...dark })); yield;
    T.red0.push(flora.redwoodGeometry({ rng: tr('trunk-far' + i), height: TRUNK_H[i], detail: 0, girth: 0.05, ...dark })); yield;
  }
  for (let i = 0; i < 3; i++) {
    T.white1.push(flora.birchGeometry({ rng: tr('white-near' + i), height: WHITE_H[i], detail: 1, flex: 0.4, ...bone })); yield;
    T.white0.push(flora.birchGeometry({ rng: tr('white-far' + i), height: WHITE_H[i], detail: 0, flex: 0.4, ...bone })); yield;
  }
  const both = (a, b) => a.map((q, i) => widerOf(profileOf(q), profileOf(b[i])));
  const conP = both(T.con1, T.con0); yield;
  const redP = both(T.red1, T.red0); yield;
  const whiteP = both(T.white1, T.white0); yield;
  // a tree against the line: one drum as wide as its widest; where that comes too near, ten drums, each a tenth of its
  // height and as wide as the tree is there (its sway at the fullest wind inside the measure, the flutter added)
  const TREE = EYE + 0.15;
  const treeGap = (pr, x, z, y, sc) => {
    const g0 = P.gapCyl(x, z, pr.rmax * sc + FLUTTER, y - 0.5, y + pr.H * sc + 0.4); if (g0 >= TREE) return g0;
    let gm = 1e9;
    for (let b = 0; b < 10; b++) gm = Math.min(gm, P.gapCyl(x, z, pr.wide[b] * sc + FLUTTER, y + pr.H * sc * b / 10 - (b ? 0 : 0.5), y + pr.H * sc * (b + 1) / 10 + (b === 9 ? 0.4 : 0)));
    return gm;
  };
  // where no tree of the southern wood may stand, by place: the clearings of made things, the riders' side track, and the
  // way in (no bough within 8.4 m, the opening's half width and 2 m more, of the 30 m of the entry axis behind the first
  // point; and no bough within 2.8 m of that axis for the whole of its BACK metres: the road runs on south there)
  const ax0 = P.samples[0][0], az0 = P.zStart;
  const barred = (x, z, reach) => z > 0 && (P.clearings.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + reach) || P.forkGap(x, z) < reach + 1.7
    || Math.hypot(Math.max(Math.abs(x - ax0) - 8.4, 0), z < az0 ? az0 - z : Math.max(z - az0 - 30, 0)) < reach + 0.25
    || (z > az0 && z < az0 + BACK + 12 && Math.abs(x - ax0) < 2.8 + reach));
  // ONE LIST OF THE STEMS THAT STAND (both woods), filled as each tree is kept and asked by every later tree, stone and
  // fallen trunk: no stem stands in another (boughs may cross, as in any wood). A stem is a disc at its foot: a spruce's
  // 0.85 m in a tree 25 m high, a great trunk's with the swell of its foot, a far pine's a thirtieth of its height
  const stemMap = new Map(), stemKey = (x, z) => (Math.floor(x / 12) + 4096) * 16384 + Math.floor(z / 12) + 4096;
  const stemAdd = (x, z, r) => { const k = stemKey(x, z); let a = stemMap.get(k); if (!a) stemMap.set(k, a = []); a.push(x, z, r); };
  const stemHit = (x, z, r) => {
    for (let cx = -1; cx <= 1; cx++) for (let cz = -1; cz <= 1; cz++) { const a = stemMap.get(stemKey(x + cx * 12, z + cz * 12)); if (a) for (let i = 0; i < a.length; i += 3) { const dx = a[i] - x, dz = a[i + 1] - z, rr = a[i + 2] + r + 0.3; if (dx * dx + dz * dz < rr * rr) return true; } }
    return false;
  };
  const lost = (why) => { P.dropped[why] = (P.dropped[why] || 0) + 1; };
  const CON_STEM = CONIFER_H.map((h) => 0.034 * h);
  // a great trunk's and a white tree's foot at the snow: the widest corner of the flare within 2.2 m of the tree's own foot
  // (measured on both makes of each; a stem asks the list of stems by this, round 4)
  const footOf = (geo) => { const pa = geo.attributes.position; let f = 0; for (let k = 0; k < pa.count; k++) if (pa.getY(k) < 2.2) f = Math.max(f, Math.hypot(pa.getX(k), pa.getZ(k))); return f + 0.1; };
  const RED_FOOT = T.red1.map((q, i) => Math.max(footOf(q), footOf(T.red0[i]))), WHITE_FOOT = T.white1.map((q, i) => Math.max(footOf(q), footOf(T.white0[i])));
  // (all: the list as it was dealt before the tests of round 3, with the trees those tests took out marked off: what picks
  // from a list by number picks as before. veto: a keep-out of round 3 that takes the tree out after its draws)
  // A TREE AND THE LINE: a tree is left out only where the line would pass within its true clearance (treeGap: 2.5 m and
  // 0.15 m from the tree's own form at its fullest sway). (Round 3 kept lanes about the line's track north of the wall,
  // 5.5 m for a spruce, 6.5 m for a white tree, 11 m for a great trunk: they are struck.)
  // EVERY TREE'S FOOT (round 4 mending 1): the stem's end is set under the lowest of the DRAWN ground beneath its foot
  // (P.footAt: the foot's middle and eight points of its rim): a spruce 0.4 m under it, a far pine 0.4 m, a great trunk
  // 0.6 m, a white tree 0.3 m, a great white tree 1.1 m. No end hangs in the air on a slope or between the ground's lines.
  // (o: a young tree's own range of sizes)
  const conifer = (list, kind, x, z, k, s, rot, v, rate, hi = false, all = null, veto = false, o = null) => {
    const vi = Math.floor(v * 3) % 3, sc = o ? lerp(o.sc[0], o.sc[1], s) : lerp(0.76, 1.2, s);
    // (no tree stands in the river's bed or on its banks)
    if (k > rate || barred(x, z, conP[vi].rmax * sc + FLUTTER) || (z < 0 && P.inRiver(x, z, 2))) return;
    const y = P.footAt(x, z, CON_STEM[vi] * sc) - 0.4, gap = treeGap(conP[vi], x, z, y, sc);
    if (gap < TREE) { P.keep(kind, gap, TREE); return; }
    const t = { x, y, z, s: sc, rot: rot * 6.283, v: vi, hi, r: conP[vi].rmax * sc, f: CON_STEM[vi] * sc };
    if (all) all.push(t);
    // a tree asks what is built (its whole reach clear of every hall, tower, covered way, thing of the yard, man and beat)
    // and the stems already standing. (NORTH OF THE WALL IT ASKS THE WAY TOO, round 4 mending 4: the thinning of the
    // verge lets a stem's middle stand a hand's breadth outside the kept width; its foot at the snow must stand
    // wholly outside it, the same ask every lying thing makes. One that fails is not made)
    const why = veto ? 'dark tree by the ring' : z > 0 && z < 340 && P.builtGap(x, z) < t.r + FLUTTER + 0.3 ? 'tree in what is built' : z < 0 && !wayClear(x, z, CON_STEM[vi] * sc) ? 'stem on the way' : stemHit(x, z, CON_STEM[vi] * sc) ? 'stem in a stem' : null;
    if (why) { t.off = true; lost(why); return; }
    P.keep(kind, gap, TREE); stemAdd(x, z, CON_STEM[vi] * sc);
    list.push(t);
  };
  // THE FAR FOREST on both sides: plain dark pines (my own, fifteen triangles each), each tested against the line like
  // every other thing (a drum as wide as its widest bough, its whole height). WHICH MAKE STANDS WHERE is by place: the
  // kit's spruces stand within 80 m of the road's middle and on the castle's ground (nearer the wall than 240 m), within
  // 100 m of the way to the grove, and, as the belt's young growth, within 150 m of the wall's middle or 90 m of the
  // way; the plain pines stand everywhere else that the far stands reach.
  const farS = [], farN = [];
  // THE LEE'S SNOW ON THE FAR PINES (round 4 mending 3): the snow the wind takes off the top sifts down north of the
  // wall, and a plain pine there carries it heavily the nearer it stands to the wall: every one within 450 m of the
  // wall's middle, none beyond 1000 m, between the two a share that falls evenly (which of them: arithmetic on the
  // tree's own place, no draw). The world draws those with the snowed make of the far pine (farPineGeometry).
  const leeSnow = (x, z) => { if (z > 0) return false; const u = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return u - Math.floor(u) < 1 - smoothstep(450, 1000, -z); };
  const cone = (list, x, z, k, s, rot, rate, veto = false, young = false) => {
    if (k > rate) return;
    const h = young ? lerp(9, 19, s) : lerp(16, 33, s);
    if (barred(x, z, 0.24 * h) || (z < 0 && P.inRiver(x, z, 0.2 * h))) return;
    // (its foot: the lowest of the drawn ground under its skirt, out to a fifth of its height; it is drawn 0.4 m under that)
    const y = P.footAt(x, z, 0.2 * h);
    if (!P.keep('far pine', P.gapCyl(x, z, 0.24 * h, y - 0.4, y + h), TREE)) return;
    // (a far pine asks too: the castle's country lies within 330 m of the wall and 260 m of the road)
    if (veto) { lost('dark tree by the ring'); return; }
    if (z > 0 && z < 330 && Math.abs(x) < 260 && P.builtGap(x, z) < 0.24 * h + 0.3) { lost('tree in what is built'); return; }
    if (stemHit(x, z, 0.033 * h)) { lost('stem in a stem'); return; }
    stemAdd(x, z, 0.033 * h);
    list.push({ x, y, z, h, rot: rot * 6.283, r: 0.24 * h, lee: leeSnow(x, z) });
  };
  // south: thick along the road, thinner about the castle, patchy to the edge of sight
  const sNear = [], sMid = [], sNearAll = [], zs = P.zStart;
  yield* cells(P.R.forestS, -52, 56, 232, zs + 96, 9.4, (x, z, k, s, rot, v) => {
    const dr = Math.abs(x - P.roadX(z)), vi = Math.floor(v * 3) % 3, reach = conP[vi].rmax * lerp(0.76, 1.2, s);
    if (dr > 36 || dr < ROAD_HALF + reach + 0.6) return;
    conifer(sNear, 'pine', x, z, k, s, rot, v, 0.74 * dens, dr < 18, sNearAll);
  }, null, 120);
  yield* cells(P.R.forestM, -150, 160, 60, zs + 150, 13.5, (x, z, k, s, rot, v) => {
    const dr = Math.abs(x - P.roadX(z)), yard = smoothstep(300, 236, z) * (1 - smoothstep(120, 200, Math.abs(x)));
    if (dr <= 36 && z >= 232 && z < zs + 96) return;
    if (dr < ROAD_HALF + 8 || z < faceZ(0) + 26) return;
    if (P.castle.towers.some((t) => Math.hypot(t.x - x, t.z - z) < t.r + 9) || P.castle.halls.some((h) => Math.hypot(h.x - x, h.z - z) < Math.hypot(h.hw, h.hl) + 7)) return;
    const rate = 0.62 * dens * (1 - 0.86 * yard) * clump(x, z);
    if (dr > 80 && z >= 240) cone(farS, x, z, k, s, rot, rate); else conifer(sMid, 'pine', x, z, k, s, rot, v, rate);
  }, null, 200);
  // THE FAR STANDS (round 4 mending 1): how thick they stand is the ground's own doing and nothing else's: the place's
  // woodedness (P.woodAt: slow noise of the land), the wood's cut-back edge north of the wall, the river's bed, the
  // clearings of made things. THE BUILT COUNTRY is where the stands are built tree by tree: within FAR_IN of the made
  // ways of the place (P.madeDist: the road, the wall between the gate's meridian and the foot of the way to the grove,
  // the way itself) every cell of 14 m is dealt at the ground's own rate; from FAR_IN to FAR_OUT the share that is built
  // falls evenly to none, and over the same band the snow's PAINTED CROWNS come in (F_SNOW: two turned lattices of
  // 19.8 m cells, one crown to 196 m2 as here, filled at the same rate, by the same distance read from the same three
  // ways: uWay), so that the wood is carried on beyond the built country at the number of trees it has inside it; far
  // off the painted wood is drawn closed, a stand-in's tone. Declared at the world's head. (Round 4
  // thinned the stands by their distance from the line's track, to nothing by 700 m, and painted crowns by the eye's
  // distance, 123 to the hectare over 46 built: both struck.)
  const FAR_IN = 400, FAR_OUT = 500, builtShare = (x, z) => 1 - smoothstep(FAR_IN, FAR_OUT, P.madeDist(x, z));
  const fx0 = -(FAR_OUT + 14), fx1 = Math.max(P.way.a[0], P.ring.x) + FAR_OUT + 14;
  yield* cells(P.R.farS, fx0, fx1, 54, zs + FAR_OUT + 14, 14, (x, z, k, s, rot, v) => {
    if (x > -150 && x < 160 && z < zs + 150) return;
    // (the road runs on south of the place we come in by: no pine within 8 m of its bed's edge)
    if (z > zs && Math.abs(x) < ROAD_HALF + 8) return;
    cone(farS, x, z, k, s, rot, 0.9 * wood(x, z) * (0.6 + 0.4 * dens) * builtShare(x, z));
  }, null, 500);
  // north: the grove about the ring (its great old trees, then its lesser white trees), the dark wood standing back
  // behind it, great dark trunks and spruces in their snow about the way to the grove
  const E = P.ring, pl = P.grove, nNear = [], nMid = [], trunks = [], white = [], nNearAll = [], trunkSpots = [];
  const dE = E.dir, lf = [dE[1], -dE[0]];
  // a place by the grove's own measures: metres along the grove's axis counted from the ring (under 0 before it), metres to
  // the side of that axis, and how far it lies from the avenue itself (the last AVENUE metres of the axis before the ring)
  const along = (x, z) => (x - E.x) * dE[0] + (z - E.z) * dE[1], aside = (x, z) => Math.abs((x - E.x) * dE[1] - (z - E.z) * dE[0]);
  const avDist = (x, z) => { const t = clamp(along(x, z), -AVENUE, 0); return Math.hypot(x - E.x - dE[0] * t, z - E.z - dE[1] * t); };
  // THE WAY TO THE GROVE (round 4 mending 1; P.way), a made thing of the place: a way kept open along the grove's axis
  // from the toe of the wall's northern apron, over the cut-back belt and through the dark wood, to the head of the
  // avenue. ITS OWN WIDTH: WAY_HALF to either side of its middle is kept clear: no tree is rooted there (a spruce's stem
  // stands with its whole foot outside it), and no stone,
  // stump, fallen trunk, cairn, block of the talus or piece of fallen ice lies with any part of it there (round 4
  // mending 4: the heap of fallen ice reaches out past the way's foot, and those who keep the way keep it of that
  // too; the snow's shader draws its trodden track by uWay; the way's waymarks stand in the verge, at the kept
  // width's edge). ITS VERGES, WAY_VERGE more on either side: the
  // wood is cut back
  // and comes again: young spruces only (the thinning runs from none at the way's edge to the wood's own number at the
  // verge's outer edge), stumps, stones and fallen trunks among them; the way's own young spruce lines it there and
  // beyond (below). THE WOOD'S GREAT TRUNKS, as its cells deal them, are felled within WAY_FELL of the way's middle, on
  // both sides, for its whole length (they come in over 6 m beyond that); the way's own edge trunks stand nearer
  // (below). Every measure here is taken from the way's axis; none from the line that is flown.
  // (THE WAY'S SOUTHERN END IS THE TOE OF THE WALL'S NORTHERN APRON, a line along the wall, not a line square to the
  // way: the kept width and the verges run to that toe on both sides. Round 4 mending 3: a square end left a wedge on
  // one side, in which the belt's young spruce could stand within 3 m of the way's foot)
  // (AND THE WAY'S FIRST POINT HAS A ROUND END, round 4 mending 4: behind the first point and south of the toe's line
  // the measure is taken from that point itself, so the kept width and the verge go round the way's foot on every
  // side, whatever the latitude. wayOff: how far a place lies off the way by these measures; far off where the way
  // is not concerned)
  const zToe = P.way.a[1];
  const onWay = (x, z) => { const t = along(x, z); return t < -AVENUE + 6 && (t > -P.way.len || (z < zToe && t > -P.way.len - 30)); };
  const wayOff = (x, z) => (onWay(x, z) ? aside(x, z) : along(x, z) <= -P.way.len ? Math.hypot(x - P.way.a[0], z - P.way.a[1]) : 1e9);
  const ride = (x, z) => smoothstep(WAY_HALF, WAY_HALF + WAY_VERGE, wayOff(x, z));
  const inVerge = (x, z) => onWay(x, z) && aside(x, z) < WAY_HALF + WAY_VERGE;
  // (a thing with a reach of its own keeps the whole of it off the way)
  const wayClear = (x, z, reach) => wayOff(x, z) >= WAY_HALF + reach;
  const rideGreat = (x, z) => (onWay(x, z) ? smoothstep(WAY_FELL, WAY_FELL + 6, aside(x, z)) : 1);
  // THE AVENUE'S AISLE (the grove's plan): from 12 m before the avenue's head to 8 m behind the ring nothing is rooted and
  // nothing lies within AISLE_HALF of the axis and its own measure m more (a white tree's m is 2.5: its stem's middle
  // 11 m off and more; the avenue's two rows stand 22 m and more apart)
  const wet = (x, z, m) => { const t = along(x, z); return t > -(AVENUE + 12) && t < 8 && aside(x, z) < AISLE_HALF + m; };
  // the wood's edge north of the open belt: nothing of the wood stands south of it; the stand feathers in over 34 m
  const edge = (x, z) => smoothstep(P.edgeZ(x), P.edgeZ(x) - 34, z);
  // THE GROVE'S GREAT TREES (round 4): old white trees with thick pale trunks and wide red crowns that meet overhead. Two
  // flank the ring, six pairs stand down both sides of the avenue 18 m apart along it (their stems' middles 12.2 m and more
  // from the axis: the widest corner of a foot's flare, 4 m at the most, stands 8 m and more from it), five stand in an arc
  // behind the ring. Each is one of three makes and is TURNED BY A DRAW OF ITS OWN.
  // THE AISLE'S CLEAR (round 4 mending 2), a law of the grove by its own axis: about the level line through the ring's
  // middle, from the way's foot to the ring's middle, a round of AISLE_CLEAR is kept clear of every bough of the great
  // trees, so that the ring's middle is seen down the whole avenue. A great tree stands back from the axis by its dealt
  // distance or, if its boughs at the round's height reach farther toward the axis at its own turning, by as much more
  // as keeps the whole of it (its own triangles walked on a grid, at their fullest sway) out of the round: a row's tree
  // and the two that flank the ring straight out to the side, a tree of the arc straight out from the ring's middle.
  // Where it then stands the line's only say is its true clearance: one that would have any part of it within 2.5 m of
  // the line is left out (after its draws); so is one that finds no room within 40 m.
  const rav = P.R.avenue, GREAT = [31, 35, 39], NEAR = EYE + GRID + FLUTTER + 0.1;
  P.great = [];
  const tail = [], tm0 = Math.max(P.L - 210, 0) - P.L;
  { const fv = new THREE.Vector3(); for (let m = P.L + tm0; m <= P.L; m += 0.5) { P.path.posAtDist(m, fv); tail.push(fv.x, fv.y, fv.z); } }
  const tn = tail.length / 3;
  // (how far the tail wanders to the side of the grove's axis at the most: a point lying farther to the side of that
  // axis than a measure m and this wander cannot be within m of the tail, and need not be measured)
  let tailDev = 0; for (let j = 0; j < tn; j++) tailDev = Math.max(tailDev, aside(tail[j * 3], tail[j * 3 + 2]));
  tailDev += 1e-6;
  // how far a point lies from the last 210 m of the line (and from the ring's middle, beyond it)
  const tailGap = (x, y, z) => {
    const t = along(x, z); if (t >= 0) return Math.hypot(x - E.x, y - E.y, z - E.z);
    const i = clamp(Math.round((t - tm0) * 2), 0, tn - 1); let b = 1e18;
    for (let j = Math.max(0, i - 3); j <= Math.min(tn - 1, i + 3); j++) { const dx = tail[j * 3] - x, dy = tail[j * 3 + 1] - y, dz = tail[j * 3 + 2] - z, q = dx * dx + dy * dy + dz * dz; if (q < b) b = q; }
    return Math.sqrt(b);
  };
  yield;
  const greatK = [];
  for (let i = 0; i < 3; i++) {
    const geo = flora.oakGeometry({ rng: tr('great' + i), height: GREAT[i], detail: 1, flex: 0.3, ...bone });
    T.great.push(geo);
    yield;
    // its widest reach and sway; its foot's radius at the snow (the widest corner of its flare under 2.2 m, the foot sunk 1.1 m)
    const sp = spanOf(geo), pa = geo.attributes.position; let foot = 0;
    for (let k = 0; k < pa.count; k++) if (pa.getY(k) < 2.2) foot = Math.max(foot, Math.hypot(pa.getX(k), pa.getZ(k)));
    // its grid points in the band about the height of the ring's middle, where the aisle's clear and the line's last
    // straight both lie (triangles that cannot come within the measure of a level line 9.5 m off are left out)
    const hl = E.y - (pl.y + 0.7 - 1.1), reach = NEAR + sp.sway + 2.2;
    const pts = yield* bandPoints(geo, hl, reach, (xa, za, xb, zb, xc, zc) => Math.max(Math.hypot(xa, za), Math.hypot(xb, zb), Math.hypot(xc, zc)) + reach < 9.5);
    greatK.push({ geo, hl, pts, reach: sp.rmax, sway: sp.sway, foot: foot + 0.15 });
    yield;
  }
  const AISLE_CLEAR = NEAR + 0.2;
  // (how far a point lies from the axis of the aisle's clear: the level line through the ring's middle, ending there)
  const axisGap = (x, y, z) => (along(x, z) >= 0 ? Math.hypot(x - E.x, y - E.y, z - E.z) : Math.hypot(aside(x, z), y - E.y));
  const standGreat = function* (x0, z0, ox, oz, vi, yaw, row) {
    const G = greatK[vi], c = Math.cos(yaw), sn = Math.sin(yaw), np = G.pts.length;
    // (a row's tree: the distance its boughs ask is reckoned at once, row being its dealt distance; then, and for a tree
    // of the arc from the first, it is proved where it stands, and moved out half a metre at a time until it is clear;
    // the page is handed back after the reckoning, after every proof and at every 8,192 points of a walk)
    let out = row ? Math.max(0, lateralOf(G.pts, yaw, AISLE_CLEAR, [-ox, -oz]) + 0.01 - row) : 0;
    yield;
    for (let k = 0; k < 80; k++, out += 0.5) {
      const x = x0 + ox * out, z = z0 + oz * out, foot = P.footAt(x, z, G.foot) - 1.1;
      let clear = true;
      for (let i = 0; i < np; i += 4) {
        if ((i & 32767) === 0 && i) yield;
        const lx = G.pts[i], lz = G.pts[i + 1];
        if (axisGap(x + lx * c + lz * sn, foot + G.hl + G.pts[i + 2], z - lx * sn + lz * c) - G.pts[i + 3] < AISLE_CLEAR) { clear = false; break; }
      }
      yield;
      if (!clear) continue;
      let gm = 1e9;
      for (let i = 0; i < np; i += 4) {
        if ((i & 32767) === 0 && i) yield;
        const lx = G.pts[i], lz = G.pts[i + 1], px = x + lx * c + lz * sn, pz = z - lx * sn + lz * c;
        // (a point that cannot be nearer than the nearest found so far is passed over: the result is the same)
        if (aside(px, pz) - tailDev - G.pts[i + 3] >= gm) continue;
        const gp = tailGap(px, foot + G.hl + G.pts[i + 2], pz) - G.pts[i + 3];
        if (gp < gm) gm = gp;
      }
      return { x, y: foot, z, yaw, gap: gm - GRID - FLUTTER, out };
    }
    return null;
  };
  const spots = [];
  // (the two that flank the ring stand 11.8 m and more to either side of it: the edge of the foot 8 m and more from the
  // ring's middle)
  for (const sgn of [1, -1]) spots.push({ t: 3.5, lat: sgn * 11.8, jl: 1.5 });
  for (let i = 0; i < 6; i++) for (const sgn of [1, -1]) spots.push({ t: -(AVENUE - 8) + i * 18, lat: sgn * 12.2, jt: 3, jl: 2.6 });
  // (the arc behind the ring: 22 to 27 m from its middle, so that its outer trees' feet stand clear of the two that flank)
  for (let i = 0; i < 5; i++) spots.push({ a: (i - 2) * 0.55, rad: 22 });
  for (const q of spots) {
    const jt = rav.range(-1, 1), jl = rav(), yaw0 = rav.range(0, 6.283), v = rav();
    const vi = Math.floor(v * 3) % 3; let x, z, ox, oz, row = 0;
    if (q.a !== undefined) { const a = q.a + 0.1 * jt, rad = q.rad + 5 * jl, ca = Math.cos(a), sa = Math.sin(a); ox = ca * dE[0] + sa * lf[0]; oz = ca * dE[1] + sa * lf[1]; x = E.x + rad * ox; z = E.z + rad * oz; }
    else { const t = q.t + (q.jt || 0) * jt, lat = q.lat + Math.sign(q.lat) * q.jl * jl; ox = Math.sign(q.lat) * lf[0]; oz = Math.sign(q.lat) * lf[1]; x = E.x + t * dE[0] + lat * lf[0]; z = E.z + t * dE[1] + lat * lf[1]; row = Math.abs(lat); }
    const st = yield* standGreat(x, z, ox, oz, vi, yaw0, row);
    if (!st) { lost('great white tree with no room'); continue; }
    if (st.gap < EYE) { lost('great white tree too near the line'); continue; }
    if (stemHit(st.x, st.z, greatK[vi].foot)) { lost('stem in a stem'); continue; }
    P.great.push({ x: st.x, y: st.y, z: st.z, yaw: st.yaw, v: vi, D: aside(st.x, st.z), reach: greatK[vi].reach, foot: greatK[vi].foot, out: st.out });
    stemAdd(st.x, st.z, greatK[vi].foot);
    P.gaps['great white tree'] = Math.min(P.gaps['great white tree'] ?? 99, st.gap);
    yield;
  }
  // the lesser white trees fill the grove behind the avenue's trunks and about the ring; a few stand out among the dark
  // trees beside the ride. (m: how far one keeps from the aisle; apart: from the white trees already standing; it may
  // stand under a great tree's crown, 6 m and more from its foot)
  // (the white trees that stand out beside the way keep the avenue's own line: none within the same 11 m of the way's
  // middle anywhere along it)
  const aisle = (x, z, m) => { const t = along(x, z); return t > -P.way.len && t < 8 && aside(x, z) < AISLE_HALF + m; };
  const whiteAt = (x, z, s, rot, v, m = 2.5, apart = 7.5) => {
    const vi = Math.floor(v * 3) % 3, sc = lerp(0.92, 1.36, s);
    if (wet(x, z, m) || aisle(x, z, m) || white.some((w) => Math.hypot(w.x - x, w.z - z) < apart) || P.great.some((w) => Math.hypot(w.x - x, w.z - z) < w.foot + 6) || P.inRiver(x, z, 3)) return;
    const y = P.footAt(x, z, WHITE_FOOT[vi] * sc) - 0.3;
    if (!P.keep('white tree', treeGap(whiteP[vi], x, z, y, sc), TREE)) return;
    if (stemHit(x, z, WHITE_FOOT[vi] * sc)) { lost('stem in a stem'); return; }
    white.push({ x, y, z, s: sc, rot: rot * 6.283, v: vi, hi: P.wayDist(x, z) < 24, r: whiteP[vi].rmax * sc, f: WHITE_FOOT[vi] * sc });
    stemAdd(x, z, WHITE_FOOT[vi] * sc);
  };
  // how deep in the grove a place lies (1 within 34 m of the avenue .. 0 from 60 m): the white trees fill it, the dark trees keep out of it
  const groveAt = (x, z) => 1 - smoothstep(34, 60, avDist(x, z));
  // the dark wood stands back: no dark tree, stone or fallen trunk within 34 m of the avenue or 38 m of the ring
  const nearRing = (x, z) => avDist(x, z) < 34 || Math.hypot(x - E.x, z - E.z) < 38;
  // (the box of the country about the way to the grove: 150 m to either side of its two ends, 110 m beyond the ring)
  const bx0 = Math.min(P.way.a[0], E.x) - 150, bx1 = Math.max(P.way.a[0], E.x) + 150, bz0 = E.z - 110;
  const gx0 = Math.min(E.x, pl.F[0]) - 62, gx1 = Math.max(E.x, pl.F[0]) + 62, gz0 = Math.min(E.z, pl.F[1]) - 62, gz1 = Math.max(E.z, pl.F[1]) + 62;
  yield* cells(P.R.groveFill, gx0, gx1, gz0, gz1, 9.6, (x, z, k, s, rot, v) => {
    const D = avDist(x, z); if (k < 0.5 * (0.6 + 0.4 * dens) * smoothstep(11, 15, D) * (1 - smoothstep(30, 50, D))) whiteAt(x, z, s, rot, v);
  }, null, 360);
  yield* cells(P.R.outliers, bx0, bx1, bz0, -150, 14, (x, z, k, s, rot, v) => {
    const D = avDist(x, z);
    if (D > 50 && P.wayDist(x, z) <= 50 && k < 0.14 * (0.6 + 0.4 * dens) * (1 - smoothstep(60, 150, D)) * ride(x, z) * edge(x, z - 40)) whiteAt(x, z, s, rot, v);
  }, null, 700);
  // what a dark tree, a stone or a fallen trunk keeps clear of in the grove's country: the aisle, every white tree's crown
  // and m more, every great tree's crown and m more
  const taken = (x, z, m) => wet(x, z, m) || white.some((w) => Math.hypot(w.x - x, w.z - z) < w.r + m) || P.great.some((w) => Math.hypot(w.x - x, w.z - z) < w.reach + m);
  // THE WAY'S OWN MEASURE (round 4 mending 2): metres along the way counted on from its foot at the wall's apron; where
  // the wood's edge lies on it and where the avenue's head; a place on it at so many metres along and to one side
  const wayT = (x, z) => along(x, z) + P.way.len, wayWood = P.way.len - AVENUE - P.axis.Lw, wayHead = P.way.len - AVENUE;
  const wayAt = (t, sd) => [P.way.a[0] + dE[0] * t + lf[0] * sd, P.way.a[1] + dE[1] * t + lf[1] * sd];
  // WAYMARKS (round 4 mending 2; a stream of their own): a low broad cairn of pale stones under its snow, wider than it
  // is high and with nothing upright in it (it must read as a heap of stones and as nothing else), one to every
  // WAY_MARK metres or so of the way by the way's own length, between 20 m beyond its foot and the grove's beginning
  // (62 m before the avenue's head: the grove holds its trees and their leaves, nothing else); on one side and the
  // other by turns, AT THE KEPT WIDTH'S EDGE (round 4 mending 3: the whole heap in the verge, its inner rim on the
  // edge or within 0.8 m of it); each tested like every stone. THE CAIRN'S OWN LAW: no young spruce stands with any
  // of its boughs within CAIRN_CLEAR of the heap's rim, so that the cairn is seen where it stands (byCairn: asked by
  // the spruces of the wood about the way, of the belt and of the verges)
  const WAY_MARK = 64, CAIRN_CLEAR = 3, cairns = [];
  const byCairn = (x, z, m) => cairns.some((c) => Math.hypot(c.x - x, c.z - z) < 1.9 + CAIRN_CLEAR + m);
  { const r = P.R.wayMark, t0 = 20, t1 = wayHead - 62, nM = Math.max(2, Math.round((t1 - t0) / WAY_MARK));
    let sd = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < nM; i++) {
      const t = t0 + (i + 0.5 + r.range(-0.14, 0.14)) * (t1 - t0) / nM, off = WAY_HALF + 1.9 + r() * 0.8, rot = r() * 6.283, seed = r();
      const [x, z] = wayAt(t, sd * off), y = P.drawnAt(x, z);
      sd = -sd;
      if (P.inRiver(x, z, 2) || P.talus.at(x, z) > 0.4 || stemHit(x, z, 1.9)) { lost('cairn in another'); continue; }
      if (!P.keep('way cairn', P.gapCyl(x, z, 1.9, y - 1, y + 1.8), MADE)) continue;
      stemAdd(x, z, 1.9);
      cairns.push({ x, y, z, size: 1, rot, cairn: true, seed });
    } }
  // a great dark trunk at a place: it asks the line (its true clearance), the ring's keep-out and the stems already
  // standing, by its FOOT's radius at the snow, the widest corner of its flare
  const trunkAt = (x, z, vi, sc, rot, hi) => {
    const y = P.footAt(x, z, RED_FOOT[vi] * sc) - 0.6, gap = treeGap(redP[vi], x, z, y, sc);
    if (gap < TREE) { P.keep('great trunk', gap, TREE); return; }
    const tk = { x, y, z, s: sc, rot: rot * 6.283, v: vi, hi, f: RED_FOOT[vi] * sc };
    trunkSpots.push(tk);
    if (nearRing(x, z)) { lost('dark tree by the ring'); return; }
    if (stemHit(x, z, RED_FOOT[vi] * sc)) { lost('stem in a stem'); return; }
    P.keep('great trunk', gap, TREE); stemAdd(x, z, RED_FOOT[vi] * sc);
    trunks.push(tk);
  };
  // THE WAY'S EDGES IN THE WOOD (round 4 mending 2; a stream of their own): old trunks left standing along both sides of
  // the way where it runs through the dark wood, two rows to a side: the inner 16.5 to 20 m from the way's middle (the
  // flare of their feet beyond the kept width), one to every EDGE_PITCH metres of the way or so, the outer 27 to 33 m
  // from it and set between them; from the wood's edge to 36 m before the avenue's head (the dark wood stands back
  // from the grove). Each is a great trunk like the wood's own, a little slighter, and is tested like them
  const EDGE_PITCH = 13;
  { const r = P.R.wayEdge, t0 = wayWood + 4, t1 = wayHead - 36, nE = Math.max(1, Math.floor((t1 - t0) / EDGE_PITCH));
    for (const sd of [-1, 1]) for (let row = 0; row < 2; row++) for (let i = 0; i < nE; i++) {
      const t = t0 + (i + 0.5 + 0.5 * row + r.range(-0.1, 0.1)) * (t1 - t0) / nE, off = row ? r.range(27, 33) : r.range(16.5, 20);
      const sc = r.range(0.8, 1.0), rot = r(), vi = r() < 0.5 ? 0 : 1, [x, z] = wayAt(t, sd * off);
      if (taken(x, z, 5) || P.inRiver(x, z, 3)) { lost('great trunk in another'); continue; }
      trunkAt(x, z, vi, sc, rot, row === 0);
    } }
  yield;
  yield* cells(P.R.trunks, bx0, bx1, bz0, -150, 15.5, (x, z, k, s, rot, v) => {
    const vi = v < 0.5 ? 0 : 1, sc = lerp(0.88, 1.12, s), d = P.wayDist(x, z);
    // (the great trunks stand in the old wood within 62 m of the way, back from it by the felling: rideGreat)
    if (d > 62 || taken(x, z, 5) || P.inRiver(x, z, 3) || k > 0.6 * P.density * rideGreat(x, z) * (1 - groveAt(x, z)) * edge(x, z - 12)) return;
    trunkAt(x, z, vi, sc, rot, d < 30);
  }, null, 1300);
  // (a spruce stands clear of every great trunk's place, and its WHOLE REACH, boughs and all, clear of every white tree's
  // crown: round 4, part two. m: the spruce's own widest reach and 0.3 m)
  const far = (x, z, m) => trunkSpots.some((t) => Math.hypot(t.x - x, t.z - z) < 6.5) || taken(x, z, m) || byCairn(x, z, m);
  // THE DARK WOOD ABOUT THE WAY (near and dense): the kit's spruces in their snow, close-grown (a place for one in every
  // 9.5 m, most of them taken), within 100 m of the way to the grove; the plain far pines stand beyond. On the way's
  // verges the spruces are young growth (half to nine tenths of a grown one's size)
  yield* cells(P.R.forestN, bx0 - 60, bx1 + 60, bz0 - 60, -52, 9.5, (x, z, k, s, rot, v) => {
    const d = P.wayDist(x, z), young = inVerge(x, z) ? { sc: [0.52, 0.96] } : null;
    if (d > 100 || far(x, z, conP[Math.floor(v * 3) % 3].rmax * (young ? lerp(0.52, 0.96, s) : lerp(0.76, 1.2, s)) + FLUTTER + 0.3)) return;
    const rate = 0.86 * (0.6 + 0.4 * dens) * ride(x, z) * (0.5 + 0.5 * clump(x, z)) * (1 - groveAt(x, z)) * edge(x, z);
    conifer(d < 42 ? nNear : nMid, 'north spruce', x, z, k, s, rot, v, rate, false, d < 42 ? nNearAll : null, nearRing(x, z), young);
  }, null, 400);
  // (the far stands north of the wall: the ground's own rate inside the built country, as south of it)
  yield* cells(P.R.farN, fx0, fx1, Math.min(P.ring.z, -300) - FAR_OUT - 14, -54, 14, (x, z, k, s, rot, v) => {
    if (x > bx0 - 60 && x < bx1 + 60 && z > bz0 - 60 && P.wayDist(x, z) <= 100) return;
    cone(farN, x, z, k, s, rot, 0.9 * (0.35 + 0.65 * wood(x, z)) * (0.6 + 0.4 * dens) * ride(x, z) * edge(x, z) * builtShare(x, z), nearRing(x, z) || (avDist(x, z) < 110 && taken(x, z, 0.24 * 33 + 0.3)));
  }, null, 500);
  // stones and fallen trunks in the snow of the northern wood, within 46 m of the way (each tested like every other
  // thing; the whole of each lies off the way's kept width: a stone by its own size, a fallen trunk by its length)
  const rocks = [...cairns];
  yield* cells(P.R.rocks, bx0, bx1, bz0, -150, 12, (x, z, k, s, rot, v) => {
    if (k > 0.2 * edge(x, z) * (1 - groveAt(x, z)) || P.wayDist(x, z) > 46 || taken(x, z, 2.5) || P.inRiver(x, z, 6) || trunkSpots.some((t) => Math.hypot(t.x - x, t.z - z) < 6)) return;   // (none in the grove: it holds its white trees and their leaves, nothing else)
    const y = P.drawnAt(x, z), size = lerp(0.7, 2.2, s * s), log = v < 0.24;
    // (a fallen trunk keeps its whole length and its stubs off the way: 5.7 m and 1.3 m; round 4 mending 4, it asked
    // for its length alone and one lay with its stubs a metre over the kept width's edge)
    if (!wayClear(x, z, log ? 7 : size * 1.4)) return;
    if (!P.keep('stone', P.gapCyl(x, z, log ? 5.2 : size * 1.4, y - 1, y + size * 1.2 + 0.6), EYE + 0.5)) return;
    // a stone, and a fallen trunk over its whole length (its butt 5.7 m one way, its top 4.3 m the other, 1.3 m to either
    // side with its stubs), ask the stems already standing and the ring's keep-out
    if (nearRing(x, z)) { lost('dark tree by the ring'); return; }
    if (log) { const c = Math.cos(rot * 6.283), sn = Math.sin(rot * 6.283); for (let l = -5.7; l <= 4.31; l += 0.5) if (stemHit(x + l * c, z - l * sn, 1.3)) { lost('fallen trunk through a stem'); return; } }
    else if (stemHit(x, z, size * 1.4)) { lost('stone in a stem'); return; }
    rocks.push({ x, y, z, size, rot: rot * 6.283, log, seed: v });
    // (it stands in the list of stems from here on, for whatever is dealt after it)
    if (log) { const c = Math.cos(rot * 6.283), sn = Math.sin(rot * 6.283); for (let l = -5; l <= 4.01; l += 1.5) stemAdd(x + l * c, z - l * sn, 1.0); } else stemAdd(x, z, size * 1.4);
  }, null, 2000);
  // stumps of the cut-back wood in the open belt, under their snow: a few, within 150 m of the way; none on the way's
  // kept width. (A low thing sits on the ground as it is drawn: P.drawnAt.)
  yield* cells(P.R.stumps, bx0 - 60, bx1 + 60, -304, -(faceZ(0) + 50), 13, (x, z, k, s, rot, v) => {
    if (k > 0.075 || z < P.edgeZ(x) + 8 || P.wayDist(x, z) > 150 || !wayClear(x, z, 1.9)) return;
    const y = P.drawnAt(x, z);
    if (P.keep('belt stump', P.gapCyl(x, z, 1.9, y - 1, y + 1.7), EYE + 0.5) && !stemHit(x, z, 1.9) && !P.inRiver(x, z, 1.9)) { rocks.push({ x, y, z, size: 1, rot: rot * 6.283, stump: true, seed: v }); stemAdd(x, z, 1.9); }
  }, null, 4000);
  // THE WAY'S VERGES IN THE WOOD (round 4 mending 1, from a stream of their own): the stumps of what was cut to open the
  // way, under their snow, in the two strips from the way's kept width to 3 m beyond the verge's outer edge, between the
  // wood's edge and the avenue's head (the grove itself holds nothing but its trees and their leaves)
  { const wa = P.way.a, wb = pl.F;
    yield* cells(P.R.verge, Math.min(wa[0], wb[0]) - 20, Math.max(wa[0], wb[0]) + 20, Math.min(wa[1], wb[1]) - 20, Math.max(wa[1], wb[1]) + 20, 7, (x, z, k, s, rot, v) => {
      const as = aside(x, z);
      if (k > 0.3 || !onWay(x, z) || as < WAY_HALF + 1.9 || as > WAY_HALF + WAY_VERGE + 3 || z > P.edgeZ(x) - 6 || groveAt(x, z) > 0 || P.inRiver(x, z, 1.9)) return;
      const y = P.drawnAt(x, z);
      if (P.keep('verge stump', P.gapCyl(x, z, 1.9, y - 1, y + 1.7), EYE + 0.5) && !stemHit(x, z, 1.9)) { rocks.push({ x, y, z, size: 1, rot: rot * 6.283, stump: true, seed: v }); stemAdd(x, z, 1.9); }
    }, null, 3000); }
  // ROUND 4, THE TALUS'S BLOCKS: ice that has come down off the face in pieces as big as houses (10 to 30 m across),
  // lying tumbled on the heap at the north foot, the greatest of them out toward its toe; lesser ones between. Each from
  // the talus's own stream, each tested like every other thing (MADE) and none in another.
  // (NONE ON THE WAY, round 4 mending 4: the heap reaches out past the way's foot, and the way is kept: a block any
  // part of which would lie on the kept width is not there. Its whole body is asked: 1.7 of its half width, which
  // holds its farthest corner, the piece split from it and its tilt. The same ask the stumps and the belt's rocks
  // make; the fallen foot ice below makes it too)
  const talus = [], tal = P.talus;
  yield* cells(P.R.talus, tal.x - tal.half, tal.x + tal.half, -(faceZ(0) + tal.out + 10), -(faceZ(0) + 5), 12.5, (x, z, k, s, rot, v) => {
    const o = tal.reach(x), f = -z - faceZ(0);
    if (f > o + 6 || k > 0.62 * P.density + 0.1) return;
    const hs = lerp(3.0, 11.5, s * s) * (0.7 + 0.5 * clamp(f / Math.max(o, 1), 0, 1)), y = g(x, z);
    if (!wayClear(x, z, hs * 1.7)) { lost('talus block on the way'); return; }
    if (!P.keep('talus block', P.gapCyl(x, z, hs * 1.5, y - hs, y + hs * 1.9), MADE)) return;
    if (P.inRiver(x, z, hs) || stemHit(x, z, hs * 1.15)) { lost('talus block in another'); return; }
    stemAdd(x, z, hs * 1.15);
    talus.push({ x, y, z, hs, rot: rot * 6.283, seed: v, tall: 0.6 + 0.7 * k, pitch: (v * 7 % 1 - 0.5) * 0.7, make: Math.floor(v * 3) % 3 });
  }, null, 600);
  P.talusBlocks = talus;
  // THE THINGS OF THE DESCENT, each by place and from a stream of its own, each tested like every other thing and
  // standing clear of the river's bed, of the talus and of the stems and stones already there:
  // 1 the wood's nearest edge is drawn down toward the wall's foot: young spruces (the regrowth of the cut-back ground, 9 to
  //   24 m high: large enough to be told as trees from the descent) standing in COPSES over the open belt, close-grown
  //   in each, the copses thick by the wood's edge and fewer toward the foot; hardly one stands alone
  const belt = [], zFoot = -(faceZ(0) + 44), cx0 = P.way.a[0] - 800, cx1 = P.way.a[0] + 400;
  yield* cells(P.R.beltWood, cx0, cx1, -312, zFoot, 11, (x, z, k, s, rot, v) => {
    const ez = P.edgeZ(x); if (z < ez - 12 || P.inRiver(x, z, 4) || tal.at(x, z) > 0.4) return;
    const toFoot = clamp((z - ez) / (zFoot - ez), 0, 1), copse = smoothstep(0.34 + 0.26 * toFoot, 0.52 + 0.26 * toFoot, n.n2(x * 0.0125 + 91, z * 0.018 - 37));
    const rate = (0.6 + 0.4 * dens) * (0.03 * (1 - toFoot) + 0.95 * copse) * ride(x, z);
    // (which make: the kit's young spruces within 150 m of the wall's middle or 90 m of the way, the plain pines beyond)
    const td = Math.min(P.wallDist(x, z) - 60, P.wayDist(x, z));
    // (a young spruce's whole reach stands clear of every white tree's crown, like its elders')
    if (td > 90) cone(farN, x, z, k, s, rot, rate, false, true); else if (!taken(x, z, conP[Math.floor(v * 3) % 3].rmax * lerp(0.52, 0.96, s) + FLUTTER + 0.3) && !byCairn(x, z, conP[Math.floor(v * 3) % 3].rmax * lerp(0.52, 0.96, s) + FLUTTER + 0.3)) conifer(belt, 'belt spruce', x, z, k, s, rot, v, rate, false, null, false, { sc: [0.52, 0.96] });
  }, null, 200);
  // 2 dark rocks stand through the snow of the belt, singly and in twos and threes
  yield* cells(P.R.beltRocks, cx0, cx1, -300, -(faceZ(0) + 30), 17, (x, z, k, s, rot, v) => {
    if (k > 0.1 + 0.16 * smoothstep(0.5, 0.75, n.n2(x * 0.011 - 23, z * 0.011 + 67)) || z < P.edgeZ(x) + 6) return;
    const y = P.drawnAt(x, z), size = lerp(1.3, 4.6, s * s), reach = size * 2.3;
    if (!wayClear(x, z, reach)) return;
    if (P.inRiver(x, z, reach) || tal.at(x, z) > 0.4 || stemHit(x, z, reach) || rocks.some((q) => Math.hypot(q.x - x, q.z - z) < reach + 2.5)) { lost('belt rock in another'); return; }
    if (!P.keep('belt rock', P.gapCyl(x, z, reach, y - 1, y + size * 1.3 + 0.6), EYE + 0.5)) return;
    stemAdd(x, z, reach);
    rocks.push({ x, y, z, size, rot: rot * 6.283, belt: true, seed: v });
  }, null, 2500);
  // THE WAY'S VERGES, YOUNG SPRUCE (round 4 mending 2; a stream of its own): the regrowth that lines a kept way, in the
  // two strips from the kept width's edge to VERGE_OUT beyond it, along the whole way from its foot to the grove: none
  // at the kept width's edge and the most from the verge's outer edge on (the verge's own law: ride), thin by the wall's
  // foot and thicker, and taller, toward the wood and in it. The near make stands from VERGE_NEAR before the wood's
  // edge on, the plain make nearer the foot. Each is a spruce like the others and is tested like them: clear of the
  // river, the talus, every stem and stone that stands and every white tree's crown
  const VERGE_OUT = 12, VERGE_NEAR = 110;
  { const wa = P.way.a, wb = pl.F, m = WAY_HALF + VERGE_OUT + 4;
    yield* cells(P.R.waySpruce, Math.min(wa[0], wb[0]) - m, Math.max(wa[0], wb[0]) + m, Math.min(wa[1], wb[1]) - m, Math.max(wa[1], wb[1]) + m, 5.5, (x, z, k, s, rot, v) => {
      const as = aside(x, z), t = wayT(x, z);
      if (!onWay(x, z) || as > WAY_HALF + VERGE_OUT || tal.at(x, z) > 0.4) return;
      const toWood = smoothstep(0, wayWood, t), o = { sc: [0.4 + 0.1 * toWood, 0.6 + 0.3 * toWood] };
      const rate = (0.6 + 0.4 * dens) * ride(x, z) * (1 - 0.5 * smoothstep(WAY_HALF + VERGE_OUT - 4, WAY_HALF + VERGE_OUT, as)) * lerp(0.14, 0.8, toWood) * (1 - groveAt(x, z));
      if (far(x, z, conP[Math.floor(v * 3) % 3].rmax * lerp(o.sc[0], o.sc[1], s) + FLUTTER + 0.3)) return;
      conifer(t > wayWood - VERGE_NEAR ? nNear : belt, 'verge spruce', x, z, k, s, rot, v, rate, false, null, nearRing(x, z), o);
    }, null, 700); }
  // 3 the fall of broken ice along the north foot: blocks that have come down off the face, great ones and small, lying
  //   tumbled and half drifted over, thickest hard by the foot and thinning out over 60 m; none with any part of it
  //   on the way's kept width (its whole reach is asked)
  const footIce = [];
  yield* cells(P.R.footIce, cx0, cx1, -(faceZ(0) + 64), -(faceZ(0) + 4), 5.2, (x, z, k, s, rot, v) => {
    const out = -z - faceZ(0), heap = 0.45 + 0.55 * smoothstep(0.35, 0.7, n.n2(x * 0.021 + 55, 7.7));
    if (k > 0.95 * Math.exp(-out / 15) * heap) return;
    const y = g(x, z), size = lerp(0.7, 2.6, s * s) + (s > 0.9 ? lerp(0, 3.4, (s - 0.9) * 10) : 0), reach = size * 1.25;
    if (!wayClear(x, z, reach)) { lost('foot ice on the way'); return; }
    if (P.inRiver(x, z, reach) || stemHit(x, z, reach)) { lost('foot ice in another'); return; }
    if (!P.keep('foot ice', P.gapCyl(x, z, reach, y - 1, y + size * 1.5), EYE + 0.5)) return;
    stemAdd(x, z, reach);
    footIce.push({ x, y, z, size, rot: rot * 6.283, seed: v, var: k * 977 % 1 < 0.5 ? 0 : 1 });
  }, null, 2500);
  P.footIce = footIce;
  P.rocks = rocks;
  yield;
  // A MOUND OF SNOW AT EVERY TREE'S FOOT (round 4 mending 1; every spruce, great trunk, white tree and great white tree):
  // what has slid off its boughs and drifted against its stem: a low swell of the ground itself, 0.9 m wider than the
  // stem's foot all round, its rim on the drawn ground, its top over the drawn ground at the stem by `up`: 0.2 m north
  // of the wall (where the soft dark about a tree's foot lies 0.3 m over the ground, and the swell stays under it),
  // 0.2 m and a tenth of its radius south of it, 0.45 m at most. Each is tested like every made thing (MADE) as a
  // cylinder that holds it whole; one the line would pass nearer is left out. The part's moundsSteps draws them.
  const moundsS = [], moundsN = [];
  const mound = (list, t, f, up) => {
    const R = f + 0.9, y0 = P.footAt(t.x, t.z, R) - 0.25, y1 = P.drawnAt(t.x, t.z) + up + 0.15;
    if (P.keep('mound', P.gapCyl(t.x, t.z, R, y0, y1), MADE)) list.push({ x: t.x, y: y0, z: t.z, r: R, h: y1 - y0, f, up, rot: t.rot ?? t.yaw });
  };
  const upS = (f) => Math.min(0.2 + 0.1 * (f + 0.9), 0.45);
  let mc = 0;
  for (const t of sNear) { mound(moundsS, t, t.f, upS(t.f)); if (++mc % 100 === 0) yield; }
  for (const t of sMid) { mound(moundsS, t, t.f, upS(t.f)); if (++mc % 100 === 0) yield; }
  yield;
  for (const l of [nNear, nMid, belt, trunks, white]) for (const t of l) { mound(moundsN, t, t.f, 0.2); if (++mc % 100 === 0) yield; }
  for (const t of P.great) mound(moundsN, t, t.foot, 0.2);
  yield;
  P.forest = { sNear, sMid, nNear, nMid, trunks, white, farS, farN, sNearAll, nNearAll, belt, moundsS, moundsN };
}

// the life of the place: riders on the road, men on the stair, ravens, the herd of elk in the wood beside the way to
// the grove, the small falls of ice (shards and their
// powder), spindrift, the small things on the face
function* planLife(P) {
  const rr = P.R.riders, rc = P.R.climbers, re = P.R.elk, rv = P.R.ravens, rf = P.R.falls, rp = P.R.spin, g = P.groundAt, H = WALL_H;
  // the riders' course: out of the tunnel's mouth, through the castle and south down the road's right half to the fork,
  // then away south-east by their own track through the wood (it never comes within 60 m of the place the visitor comes in by).
  // Its whole length is tested at once, so the test holds at every clock: a rod 0.9 m thick about the horse, a rod
  // 1.3 m thick about the rider's shoulders, which holds his cloak at its fullest blow
  const course = [], add = (x, z) => { const l = course.length ? course[course.length - 1] : null; course.push([x, g(x, z), z, l ? l[3] + Math.hypot(x - l[0], z - l[2]) : 0]); };
  const zEnd = P.fork.z + P.fork.len, cx = (z) => P.forkX(z) - 2.7 * (1 - smoothstep(faceZ(0) + 6, 72, z));
  for (let z = faceZ(0) - 5; z < zEnd; z += z > P.fork.z ? 4 : 6) add(cx(z), z);
  const Lc = course[course.length - 1][3];
  let gr = 99;
  for (let i = 1; i < course.length; i++) { for (const [hy, rad] of [[1.2, 0.9], [2.25, 1.3]]) gr = Math.min(gr, P.gapRod([course[i - 1][0], course[i - 1][1] + hy, course[i - 1][2]], [course[i][0], course[i][1] + hy, course[i][2]], rad)); if (i % 3 === 0) yield; }
  const nG = clamp(Math.round(3.6 * P.density), 3, 5), groups = [];
  for (let i = 0; i < 5; i++) { const j = rr.range(0.1, 0.9), n = rr.int(5, 8), sp = rr.range(4.3, 5.2); if (i < nG) groups.push({ s0: (0.04 + 0.9 * (i + j) / nG) * Lc, n, gap: sp }); }
  yield;
  P.riders = { course, Lc, speed: rr.range(2.9, 3.5), groups, ok: P.keep('rider', gr, EYE + 0.2) };
  // men on the stair, going up and coming down
  const nC = Math.round(lerp(5, 9, rc()) * P.density), climbers = [];
  for (let i = 0; i < 12; i++) { const ph = rc(), sp = rc.range(0.5, 0.75); if (i < nC) climbers.push({ ph, sp }); }
  P.climbers = climbers;
  // THE ELK (round 4 mending 3): one herd in the dark wood beside the way to the grove, PLACED BY THE WAY'S AXIS AND
  // THE WOOD'S EDGE; nothing of its place is taken from the line. Its middle lies SQUARE OFF THE WAY'S AXIS, on the
  // hand its own draw gives (east or west of the way), by the kept width, the verge, the herd's whole round
  // (ELK_ROUND: no part of a beast can be farther from the middle, by the kit's own numbers) and 2 to 7 m more. So no
  // loop of any beast can come onto the verges, into the avenue's aisle (8.5 m to either side of the same axis) or
  // into the ring's own round (7.5 m about it). ALONG THE WAY it lies abreast of a place 28 to 64 m before the
  // avenue's head, by its own draw, or of the first place farther on (4 m at a time) at which its middle stands
  // ELK_IN (its whole round) and more inside the wood's edge; a herd that finds none before the ring is left out, and so is one whose
  // round would reach the river's bed.
  // THE LINE'S ONLY SAY is the true clearance, asked of the WHOLE ROUND at once (a drum about the middle, from under
  // the lowest ground in it to 4.5 m over the highest: antlers and all). The kit takes a count and a middle, not the
  // loops' places, so a single loop cannot be left out: a herd whose round fails is not made at all. The kit is
  // handed no path and no clear.
  const ELK_IN = ELK_ROUND;
  { const d = P.axis.d, east = [-d[1], d[0]], F = P.grove.F;
    const hand = re.chance(0.5) ? 1 : -1, off = WAY_HALF + WAY_VERGE + ELK_ROUND + re.range(2, 7), back = re.range(28, 64);
    const n = 2 + Math.round(7 * P.density * re.range(0.8, 1.2));
    let t = -back, x = 0, z = 0, ok = false;
    for (; t <= AVENUE; t += 4) { x = F[0] + d[0] * t + hand * east[0] * off; z = F[1] + d[1] * t + hand * east[1] * off; if (z < P.edgeZ(x) - ELK_IN) { ok = true; break; } }
    if (ok && P.inRiver(x, z, ELK_ROUND)) ok = false;
    if (!ok) P.dropped['elk with no place in the wood'] = (P.dropped['elk with no place in the wood'] || 0) + 1;
    else {
      let y0 = 1e9, y1 = -1e9;
      for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const h = g(x + i * ELK_ROUND / 4, z + j * ELK_ROUND / 4); if (h < y0) y0 = h; if (h > y1) y1 = h; }
      ok = P.keep('elk round', P.gapCyl(x, z, ELK_ROUND, y0 - 1, y1 + 4.5), EYE + 0.2);
    }
    P.elk = { x, z, n, radius: ELK.radius, roam: ELK.roam, size: ELK.size, coat: ELK.coat, round: ELK_ROUND, hand, off, t, ok };
  }
  yield;
  P.ravens = { castle: Math.round(13 * P.density * rv.range(0.8, 1.25)), out: Math.round(8 * P.density * rv.range(0.8, 1.25)), ph: rv() };
  // ravens: a flock about the head of the tall tower, and a string that flies a closed round out over the wall and back,
  // its four turning points high over both lands dealt by the ravens' own stream (tested as rods 25 m thick)
  const tw = P.castle.towers.find((t) => t.name === 'tall') || { x: P.ward.x - 28, y: g(P.ward.x - 28, P.ward.z), z: P.ward.z, h: 62 }, rx = tw.x, top = tw.y + tw.h;
  const loop = [[rx + rv.range(-10, 10), top + rv.range(24, 36), tw.z + rv.range(-8, 8)], [rx - rv.range(90, 130), H + rv.range(26, 40), rv.range(8, 28)],
    [rx - rv.range(170, 230), H - rv.range(10, 40), -rv.range(280, 380)], [rx - rv.range(40, 80), H + rv.range(22, 36), -rv.range(30, 70)]];
  let gr2 = 99; for (let i = 0; i < 4; i++) gr2 = Math.min(gr2, P.gapRod(loop[i], loop[(i + 1) % 4], 25));
  P.ravens.loop = P.keep('raven loop', gr2, 20) ? loop : null;
  P.ravens.home = P.keep('raven home', P.gapCyl(rx, tw.z, 62, top - 18, top + 52), 15) ? [rx, top + 16, tw.z] : null;
  // small falls of ice down the south face, between 70 and 590 m east of the gate's meridian: each a place, a period and
  // a phase of its own
  const falls = [];
  for (let i = 0; i < 12; i++) {
    const x = lerp(70, 590, (i + rf()) / 12), y = rf.range(110, 204), period = rf.range(8, 15), ph = rf(), size = rf.range(0.7, 1.4);
    if (Math.abs(x - P.stair.x) < P.stair.hw + 8 || Math.abs(x - P.cage.x) < 8) continue;
    // its whole fall, as its shards are made (the world's falls: each up to 2 m to either side of the fall's place and
    // 5 m out from the ice, the greatest 0.95 m across): 3 m to either side and 6 m out, at every height below its head
    let gp = 99; for (const s of P.samples) { if (s[2] > 0 && Math.abs(s[0] - x) < 30 && s[1] < y + 3) gp = Math.min(gp, Math.hypot(Math.max(Math.abs(s[0] - x) - 3, 0), Math.max(s[2] - faceZ(s[1]) - 6, 0))); }
    if (P.keep('ice fall', gp, MADE)) falls.push({ x, y, period, ph, size });
  }
  P.falls = falls;
  yield;
  // spindrift: plumes off the north lip, veils down the south face
  const plumes = [];
  for (let x = P.manned.x0 - 80; x < P.manned.x1 + 110; x += 15) { const j = rp(), a = rp(), b = rp(); plumes.push({ x: x + j * 9, ph: a * 20, k: lerp(0.6, 1.4, b) }); }
  P.plumes = plumes;
  yield;
  // blown snow as sheets: plumes off the north lip (a flat sheet and an upright one each), veils down the south face, the powder
  // of the falls of ice. Each is a flat sheet: it is tested as rods along its stream, 1.2 m apart and less across its
  // whole width (round 4 mending 2: five rods stood up to 5 m apart, and the line could pass 1.4 m from the sheet
  // between two of them), and kept where the line stays 3 m clear of them (2.9 m and more of the sheet itself)
  const veils = [];
  const sheetGap = (o, a, b) => { const n = Math.max(2, Math.ceil(Math.hypot(b[0], b[1], b[2]) / 2.4)); let gp = 99; for (let i = -n; i <= n; i++) { const f = i / (2 * n), q = [o[0] + b[0] * f, o[1] + b[1] * f, o[2] + b[2] * f]; gp = Math.min(gp, P.gapRod(q, [q[0] + a[0], q[1] + a[1], q[2] + a[2]], 0)); } return gp; };
  const veil = (name, kind, o, a, b, aV, off = false, need = 3) => { if (P.keep(name, sheetGap(o, a, b), need)) veils.push({ kind, x: o[0], o, a, b, aV, off }); };   // off: not of the wall itself
  for (let i = 0; i < plumes.length; i++) {
    const p = plumes[i], len = 58 * p.k;
    veil('plume', 0, [p.x, H + 0.6, -5.5], [len * 0.22, -len * 0.07, -len], [15 * p.k, 0, 3], [p.ph, 0, 1, 0]);
    veil('plume', 0, [p.x + 4, H + 1.4, -6], [len * 0.2, -len * 0.1, -len * 0.9], [0, 9 * p.k, 0], [p.ph + 3, 0, 1, 0]);
    if (i % 2 === 0) veil('veil', 0, [p.x, H - 2, faceZ(H - 2) + 3.2], [8 * p.k, -70 * p.k, 70 * p.k * BATTER + 2], [20, 0, 0], [p.ph + 7, 0, 1, 0.5]);
    // curtains of blown snow sliding down the lower south face to its foot, and cascades pouring off the lip down the lee (north) face
    if (i % 3 === 1) { const y0 = 100 + 55 * (p.k - 0.6), hh = y0 - 6; veil('curtain', 0, [p.x, y0, faceZ(y0) + 3.6], [7 * p.k, -hh, hh * BATTER + 1.5], [22, 0, 0], [p.ph + 11, 0, 1, 0.6]); }
    if (i % 3 === 1) { const hh = 105 * p.k; veil('cascade', 0, [p.x + 5, H - 0.5, -faceZ(H - 0.5) - 3.4], [-7 * p.k, -hh, -hh * BATTER - 2], [19, 0, 0], [p.ph + 5, 0, 1, 1]); }
    if (i % 4 === 3) yield;
  }
  for (const f of falls) veil('powder', 1, [f.x, f.y + 4, faceZ(f.y) + 4.2], [0, -(f.y - 6), (f.y - 6) * BATTER], [5 * f.size, 0, 0], [f.ph * 9, 1, f.period, f.ph]);
  // pines shedding their snow: a fall of powder down the side of a spruce here and there, each on a clock of its own
  const rsh = P.R.sheds;
  for (const [list, n] of [[P.forest.sNearAll, 16], [P.forest.nNearAll, 9]]) {
    for (let i = 0; i < n; i++) {
      const pick = rsh(), per = rsh.range(8, 17), ph = rsh(), sd = rsh(), az = rsh.range(0, 6.283);
      const t = list.length ? list[Math.floor(pick * list.length) % list.length] : null;
      if (t && !t.off) { const h = CONIFER_H[t.v] * t.s, o = 0.07 * h; veil('snow shed', 1, [t.x + o * Math.cos(az), t.y + 0.74 * h, t.z + o * Math.sin(az)], [0.5 * Math.cos(az), -0.7 * h, 0.5 * Math.sin(az)], [-0.26 * h * Math.sin(az), 0, 0.26 * h * Math.cos(az)], [sd * 9, 1, per, ph], true); }
    }
    yield;
  }
  P.veils = veils;
  yield;
  // THE SMALL THINGS ON THE ICE, each of a man's size or a man's making, so that the height is read: shelves of ice with
  // snow on them and icicles under, spalls standing proud, old timber props wedged under a shelf, a rope hanging from an
  // iron ring, a barrel caught on a shelf (the south face); shelves and spalls only on the north face.
  // THEY ARE DEALT OVER THE FACE BY THE FACE'S OWN MEASURE (round 4 mending 2), none by where the line passes: on the
  // south face at places 11.5 m apart from 50 to 570 m east of the gate's meridian (under the manned top, about the
  // stair and the hoist), THREE at each place, one in each third of the face's height, each at a height of its own
  // draw; on the north face at places 13 m apart from 560 to 250 m west of the foot of the way to the grove, one at
  // each, at a height of its own draw between the foot and the lip. One that would stand in another is not there; one is
  // left out by the line only within its true clearance.
  // EACH IS MEASURED AS IT IS MADE (faceInto): the ledge with its snow, its icicles and what stands under it as a box
  // 2.3 m deep from the ice; what hangs far down the lean of the face (a rope with its coil, the columns of a frozen
  // fall) as rods laid along the face itself at every 2 m of height
  const rfc = P.R.face, faceThings = [];
  const hangGap = (side, fx, w, y0, y1, out, r) => { let gp = 99; for (let yy = y0; yy > y1 - 1.99; yy -= 2) { const ya = Math.max(yy, y1), zz = side * (faceZ(ya) + reliefAt(P, fx, ya, side) + out); gp = Math.min(gp, P.gapRod([fx - w / 2, ya, zz], [fx + w / 2, ya, zz], r)); } return gp; };
  const faceGap = (side, kind, fx, y, zf, w, hang, long) => {
    if (kind === 'rope') return Math.min(P.gapBox(fx, zf + side * 0.2, 0, 0.3, 0.5, y - 0.3, y + 0.3), hangGap(side, fx, 0.3, y, y - hang - 0.4, 0.3, 0.45));
    const box = P.gapBox(fx, zf + side * (long ? 1.25 : 0.75), 0, w / 2 + 0.4, long ? 2.05 : 1.55, y - (kind === 'props' ? 4.8 : long ? 5.6 : 4.2), y + 1.7);
    return kind === 'pillar' ? Math.min(box, hangGap(side, fx, w + 0.6, y - 0.4, y - 0.4 - hang, 0.75, 1.3)) : box;
  };
  const inAnother = (side, fx, y, w, hang) => faceThings.some((q) => q.side === side && Math.abs(q.x - fx) < (q.w + w) / 2 + 0.8 && y - hang < q.y + 2 && q.y - q.hang < y + 2) && lostF();
  const lostF = () => { P.dropped['face thing in another'] = (P.dropped['face thing in another'] || 0) + 1; return true; };
  for (let x = 50, i = 0; x < 570; x += 11.5, i++) {
    for (let k = 0; k < 3; k++) {
      const jx = rfc(), jy = rfc(), kd = rfc(), sz = rfc(), sd = rfc();
      const fx = x + jx * 8, y = lerp(7, H - 10, (k + jy) / 3);
      if (Math.abs(fx - P.stair.x) < P.stair.hw + 5 || Math.abs(fx - P.cage.x) < 5) continue;
      const kind = kd < 0.4 ? 'shelf' : kd < 0.6 ? 'props' : kd < 0.78 ? 'rope' : kd < 0.9 ? 'barrel' : 'spall';
      // (a rope ends 2.5 m over the foot at the lowest)
      const w = kind === 'rope' ? 0.7 : lerp(2.4, 6, sz), hang = kind === 'rope' ? Math.min(lerp(14, 34, sz), y - 2.5) : kind === 'props' ? 4.8 : 4.2;
      const zf = faceZ(y) + reliefAt(P, fx, y, 1);
      if (inAnother(1, fx, y, w, hang)) continue;
      if (P.keep('face thing', faceGap(1, kind, fx, y, zf, w, hang, false), MADE)) faceThings.push({ kind, side: 1, x: fx, y, z: zf, w, hang, seed: sd });
    }
    if (i % 3 === 2) yield;
  }
  yield;
  const xw = P.way.a[0];
  for (let x = xw - 560, i = 0; x < xw - 250; x += 13, i++) {
    const jx = rfc(), jy = rfc(), kd = rfc(), sz = rfc(), sd = rfc();
    const fx = x + jx * 8, y = lerp(9, H - 10, jy), kind = kd < 0.7 ? 'shelf' : 'spall', w = lerp(2.4, 6, sz), hang = 4.2;
    const zf = -(faceZ(y) + reliefAt(P, fx, y, -1));
    if (inAnother(-1, fx, y, w, hang)) continue;
    if (P.keep('face thing', faceGap(-1, kind, fx, y, zf, w, hang, false), MADE)) faceThings.push({ kind, side: -1, x: fx, y, z: zf, w, hang, seed: sd });
    if (i % 5 === 4) yield;
  }
  yield;
  // ROUND 3, THE NORTH FACE carries more of its own from 640 m west of the foot of the way to the grove to 230 m east
  // of it, at every height between its foot and its lip (a stream of their own; each tested like the others, and
  // against those already there): long ledges of drifted snow with their fringes of icicles, falls of meltwater frozen
  // into great hanging columns, spalls
  const rn = P.R.northFace;
  for (let x = xw - 640, i = 0; x < xw + 230; x += 9.5, i++) {
    const jx = rn(), jy = rn(), kd = rn(), sz = rn(), sd = rn();
    const fx = x + jx * 7, y = lerp(9, H - 9, jy), kind = kd < 0.6 ? 'shelf' : kd < 0.86 ? 'pillar' : 'spall';
    const w = kind === 'pillar' ? lerp(2.6, 5.6, sz) : kind === 'shelf' ? lerp(4, 12, sz * sz) : lerp(2.4, 6, sz), hang = kind === 'pillar' ? lerp(7, 16, sz) : 5.6;
    const zf = -(faceZ(y) + reliefAt(P, fx, y, -1));
    if (inAnother(-1, fx, y, w, hang)) continue;
    if (P.keep('face thing', faceGap(-1, kind, fx, y, zf, w, hang, true), MADE)) faceThings.push({ kind, side: -1, x: fx, y, z: zf, w, hang, seed: sd, long: 1 });
    if (i % 5 === 4) yield;
  }
  P.faceThings = faceThings;
  yield;
  // the line against the ground once more, now that every thing is planned
  let gg = 99;
  for (const s of P.samples) if (Math.abs(s[2]) > faceZ(0) + 2.8) { const d = s[1] - P.groundAt(s[0], s[2]); if (d < gg) { gg = d; P.groundAtM = s[3]; } }
  P.gaps.ground = gg;
  yield;
  // ... and the entry axis behind the first point against the ground
  let gb = 99; for (const s of P.back) gb = Math.min(gb, s[1] - P.groundAt(s[0], s[2]));
  P.gaps['ground behind the entry'] = gb;
  yield;
}

// the camera's own numbers (the world returns them; the replay reads them)
// (round 4: the line is straight in plan up the face and down the descent, so the engine banks nothing there; in the arcs
// that remain it banks half what it did)
export const CAMERA = { fov: 62, near: 0.3, far: 9000, lookAhead: 30, sway: 1, bank: 0.3 };

// ---------------------------------------------------------------------------------------------------------------------
// light and materials
// ---------------------------------------------------------------------------------------------------------------------
// (wallLit: the share of the key light that reaches a place: none in the wall's own shadow, which the low sun throws some
// hundreds of metres north; whole south of the north face and beyond the shadow's end)
// the values every material of mine shares: one holder each, so one write in update() reaches them all
export function makeUniforms(P) {
  return {
    uSun: { value: new THREE.Vector3(P.sunDir[0] * P.hand, P.sunDir[1], P.sunDir[2]).normalize() },
    uSunCol: { value: new THREE.Color(1, 0.95, 0.88) }, uSky: { value: new THREE.Color(0.3, 0.4, 0.6) }, uGnd: { value: new THREE.Color(0.2, 0.22, 0.26) },
    // the sky's light in the wall's shadow; what that shadow does to the sky light that the engine's one lamp gives the
    // kit's things and the solids (uAmbN)
    uSkyN: { value: new THREE.Color(0.3, 0.4, 0.6) }, uAmbN: { value: new THREE.Color(1, 1, 1) },
    // the cloud shadows' field has a place of its own in every world (two offsets dealt by the seed's stream ice-cloud)
    uCloudPh: { value: new THREE.Vector2(...(P.cloudPh || [0, 0])) },
    uFog: { value: new THREE.Color(0.6, 0.7, 0.82) }, uFogDen: { value: 0.00016 }, uTime: { value: 0 }, uCloudOff: { value: 0 }, uCloudAmt: { value: P.cloud },
    uWet: { value: 1 }, uGlint: { value: 1 }, uHand: { value: P.hand }, uFire: { value: 1 },
    uMist: { value: 0 }, uMistCol: { value: new THREE.Color(0.7, 0.74, 0.8) }, uShadow: { value: 1 },
    uRoad: { value: new THREE.Vector4(P.roadNums[0], P.roadNums[1], P.roadNums[2], P.roadNums[3]) },
    uFork: { value: new THREE.Vector3(...(P.fork ? [P.fork.z, P.fork.tan, P.fork.cos] : [1e6, 0, 1])) },
    // the avenue's two ends (where the wood opens; the ring); the river's and the talus's own numbers (the plan's laws)
    uAve: { value: new THREE.Vector4(P.grove.F[0], P.grove.F[1], P.grove.E[0], P.grove.E[1]) },
    // the way to the grove: its foot at the wall's northern apron, its end at the ring (the plan's P.way)
    uWay: { value: new THREE.Vector4(P.way.a[0], P.way.a[1], P.way.b[0], P.way.b[1]) },
    // the visit's density as the far stands are dealt by it (planForests: 0.6 + 0.4 * density): the painted crowns take the same
    uDens: { value: 0.6 + 0.4 * P.density },
    uRiver: { value: new THREE.Vector4(P.river.x, 600 * P.river.k, P.river.A, P.river.w) }, uRiver2: { value: new THREE.Vector4(P.river.ph, P.river.z, 0, 0) },
    uTalus: { value: new THREE.Vector4(P.talus.x, P.talus.half, P.talus.out, P.talus.deep) },
    // the map of the long shadows south of the wall (the world fills it once, at build, with the part's shadeMapSteps)
    uShadeMap: { value: null }, uShadeBox: { value: new THREE.Vector4(0, 0, 1, 1) },
    // the fires the shaders light by, a list for each stretch (fireLists below: the top's in three runs along the wall, the
    // castle's in two by how far south they stand, the stair's lanterns), and the ring's own light
    uFT: { value: fireList(P) }, uFTcut: { value: new THREE.Vector2(...topCuts(P)) },
    uFYa: { value: Array.from({ length: FIRES_YARD }, () => new THREE.Vector4(1e6, 0, 1e6, 0)) }, uFYb: { value: Array.from({ length: FIRES_YARD }, () => new THREE.Vector4(1e6, 0, 1e6, 0)) }, uFYcut: { value: 150 },
    uFS: { value: Array.from({ length: FIRES_FACE }, (q, i) => { const l = P.stair.lanterns[i]; return l ? new THREE.Vector4(l[0], l[1], l[2], 0.55) : new THREE.Vector4(1e6, 0, 1e6, 0); }) },
    uFSbox: { value: new THREE.Vector2(P.stair.x, P.stair.hw + 12) },
    uRing: { value: new THREE.Vector4(P.ring.x, P.ring.y, P.ring.z, 2.2) },
  };
}
// every fire of the top, in the plan's hand, in the order they stand along the wall (the list's unused places lie a
// thousand kilometres off). The list is read in three runs of 16: topCuts gives the two places along the wall where one
// run hands over to the next (half-way between its last fire and the next run's first). Two fires of the top never stand
// nearer than 30 m to each other (they are dealt at every other place, the places 15 m and more apart) and a fire's light
// dies out by 20 m, so a point seen is lit by fires of its own run or by the nearest fire of the run beside it: the
// shaders test the 16 of the run and the one on either side, 18 in all (round 3 tested all 48)
function fireList(P) {
  const fires = P.top.things.filter((t) => t.kind === 'fire'), out = [];
  for (let i = 0; i < FIRES_TOP; i++) out.push(i < fires.length ? new THREE.Vector2(fires[i].x, fires[i].z) : new THREE.Vector2(1e6, 1e6));
  return out;
}
function topCuts(P) {
  const fires = P.top.things.filter((t) => t.kind === 'fire'), cut = (i) => (fires.length > i ? (fires[i - 1].x + fires[i].x) / 2 : 1e7);
  return [cut(16), cut(32)];
}
// THE CASTLE'S LIGHTS (round 4): the braziers of the yard, the lantern over the door of every hall where men live, the
// shuttered lights that are lit (lamps: what the makers of halls and towers hand back, [x, y, z, size, number]; a lamp
// higher than 4.4 m over the ground, in a tower's light, is ONLY A GLOW and lights nothing). Each lights the snow, the
// stone and the timber about it within 17 m. The shaders read them in two lists, by how far south a light stands: one
// for the points seen north of `cut` (the lights that stand north of cut + 17 m), one for those south of it (the lights
// south of cut - 17 m): a light within 17 m of the cut is in both. THE RULE: each list holds FIRES_YARD lights; they are
// taken in the order braziers, door lanterns, window lights, and one that finds a list it belongs to full IS NOT LIT AT
// ALL (it goes to `dark`: the world draws no flame or glow for it), so that every light that burns lights the ground
export function fireLists(P, lamps) {
  const g = P.groundAt, all = [];
  for (const t of P.castle.yard.things) if (t.kind === 'brazier') all.push({ x: t.x, y: g(t.x, t.z) + 0.9, z: t.z, w: 1, of: t });
  const low = lamps.filter((q) => q[1] - g(q[0], q[2]) < 4.4);
  for (const q of low) if (q[5] === 'door') all.push({ x: q[0], y: q[1] - q[3] / 2, z: q[2], w: 0.75, of: q });
  for (const q of low) if (q[5] === 'window') all.push({ x: q[0], y: q[1] - q[3] / 2, z: q[2], w: 0.4, of: q });
  const zs = all.map((q) => q.z).sort((a, b) => a - b), cut = zs.length ? zs[Math.floor(zs.length / 2)] : 150, a = [], b = [], dark = [];
  for (const q of all) {
    const inA = q.z < cut + 17, inB = q.z >= cut - 17;
    if ((inA && a.length >= FIRES_YARD) || (inB && b.length >= FIRES_YARD)) { dark.push(q.of); continue; }
    if (inA) a.push(q); if (inB) b.push(q);
  }
  return { a, b, cut, dark, lit: all.length - dark.length };
}

// how many fires each of the shaders' lists holds: the top's (in three runs of 16), each of the castle's two, the stair's
export const FIRES_TOP = 48, FIRES_YARD = 24, FIRES_FACE = 16;
// the falling snow's velocity (m/s, in the plan's hand)
export const FLAKE_VEL = [1.2, -2.1, -2.2];
const G_COMMON = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uSkyN, uGnd, uFog, uMistCol, uAmbN;
uniform vec2 uCloudPh;
uniform float uFogDen, uTime, uCloudOff, uCloudAmt, uWet, uGlint, uHand, uFire, uMist, uShadow;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fb(vec2 p){ return .5*vn(p) + .25*vn(p*2.03 + 7.1) + .125*vn(p*4.01 + 3.3) + .0625*vn(p*8.07 + 1.7); }
// THE WEATHER STANDS, BY PLACE (round 4: a clear cold sky; no cloud stands over the north). Every law below reads the
// place of the point seen (vW), never where the eye is (the eye is only the near end of the ray the air is counted along).
// under: how far into the cold lee north of the wall a place lies (not at all south of 40 m north of the wall's middle,
// wholly from 260 m north of it): there the snow lies on every bough
float under(float z){ return smoothstep(40., 260., -z); }
// THE WALL'S OWN SHADOW: a place is lit where the way from it toward the sun clears the wall's top (its edge soft over
// 12 m of height), and everywhere south of the north face. With the sun low the shadow reaches some hundreds of metres
// north; the far wood and the mountains beyond it stand in the sun
float wallLit(vec3 p){
  float k = uSun.y/max(uSun.z, .08), yc = p.y + max(-7. - p.z, 0.)*k;
  return max(smoothstep(${WALL_H - 5}., ${WALL_H + 7}., yc), step(-7.6, p.z)); }
float cloudLit(vec3 p){ return 1. - uCloudAmt*smoothstep(.40, .60, fb(vec2(p.x*.0017 - uCloudOff + uCloudPh.x, p.z*.0023 + uCloudPh.y))); }
// the sky's light at a place: in the wall's shadow a little bluer (no sunlit snow lies about to give its light back)
vec3 skyAt(vec3 p){ return mix(uSkyN, uSky, wallLit(p)); }
vec3 skyAmb(vec3 n){ return mix(uGnd, skyAt(vW), n.y*.5 + .5); }
// THE ONE FOG: the air is thickest at the ground and thins upward (by 350 m), so what is left of a seen point's light
// is counted along the ray through that air: the far wood's floor is veiled, a mountain's head stands clear over it
float fogKeep(vec3 w){
  vec3 e = cameraPosition;
  float y0 = max(min(e.y, w.y), 0.), dy = max(abs(e.y - w.y), .05);
  float q = uFogDen*distance(e, w)*exp(-y0/350.)*350.*(1. - exp(-dy/350.))/dy;
  return exp(-q*q); }
// the mist of a cold morning at the wall's south foot: a layer that thins upward (by 16 m) and lies within 400 m of the foot
float mistBand(float z){ return smoothstep(-10., 30., z)*(1. - smoothstep(140., 400., z)); }
float mistKeep(vec3 w){
  vec3 e = cameraPosition;
  float y0 = max(min(e.y, w.y), 0.), dy = max(abs(e.y - w.y), .05);
  float hf = exp(-y0/16.)*16.*(1. - exp(-dy/16.))/dy;
  float zl = e.y < w.y ? e.z : w.z, zh = e.y < w.y ? w.z : e.z;
  float band = .5*mistBand(zl) + .3*mistBand(mix(zl, zh, .5)) + .2*mistBand(zh);
  return exp(-uMist*hf*band*distance(e, w)); }
vec3 fogged(vec3 c, vec3 w){ return mix(uFog, mix(uMistCol, c, mistKeep(w)), fogKeep(w)); }
// WHERE NO SUN REACHES (the wall's own shadow) the light is the sky's alone. The sky is brightest low down on the sun's
// side and over the open country to the north, so there its light has a side to it: a face turned that way is lighter,
// one turned from it darker, level ground as before (by the seen point's place and the way its face is turned)
float shadeSide(vec3 n, vec3 p){ float s = dot(n, normalize(vec3(uSun.x*1.2, .5, -.55)))*.5 + .5; return 1. + (1. - wallLit(p))*(s*s - .5); }
// FIRELIGHT, BY PLACE: the warm light of the fires that stand on the top (uFT: each fire's x and z in the plan's hand, 1.1 m
// over the top), of the braziers, door lanterns and lit windows of the castle (uFYa, uFYb: x, y, z, strength) and of the
// lanterns at the stair's landings (uFS), on the face of the point seen: it dies out by 20 m (the top's), 17 m (the
// castle's) and 11 m (a lantern's), and flickers on the world's clock, each fire by its own number.
// THE COST, BOUNDED BY PLACE: a point seen is put to the list of where it lies: on the top or the upper 16 m of the
// faces, 18 fires of the top (its run of the wall and the nearest fire on either side); within the stair's own box
// (27 m to either side of its middle, the south face and the ground within 40 m of the wall's middle), the 16 lanterns
// (the stair's head lies in both: 34 tests on that one patch of the top and the face under it); else in the castle's
// country (20 to 320 m south, within 215 m of the gate's line, below 70 m), the 24 lights of its half; everywhere else,
// none. (Round 3 put every point above 197 m to 48 fires and every southern point below 70 m to 16.)
uniform vec2 uFT[${FIRES_TOP}];
uniform vec2 uFTcut, uFSbox;
uniform vec4 uFYa[${FIRES_YARD}], uFYb[${FIRES_YARD}], uFS[${FIRES_FACE}];
uniform float uFYcut;
uniform vec4 uRing;
float fireOn(vec3 L, vec3 n, float reach2, float flick){
  float d2 = dot(L, L);
  if (d2 >= reach2) return 0.;
  float w = 1. - d2/reach2;
  return w*w/(1. + .1*d2)*(.3 + .7*max(dot(n, L)*inversesqrt(d2 + .02), 0.))*(.82 + .18*vn(vec2(uTime*4., flick))); }
vec3 fireAt(vec3 p, vec3 n){
  float s = 0., px = p.x*uHand;
  vec3 nn = vec3(n.x*uHand, n.y, n.z);
  if (p.y > ${WALL_H - 16}.) {
    int lo = px < uFTcut.x ? -1 : px < uFTcut.y ? 15 : 31;
    for (int k = 0; k < 18; k++) {
      int i = lo + k;
      if (i < 0 || i >= ${FIRES_TOP}) continue;
      s += fireOn(vec3(uFT[i].x - px, ${(WALL_H + 1.1).toFixed(1)} - p.y, uFT[i].y - p.z), nn, 400., float(i)*7.3);
    }
  }
  if (p.z > 0. && p.z < 40. && abs(px - uFSbox.x) < uFSbox.y) {
    for (int i = 0; i < ${FIRES_FACE}; i++) s += uFS[i].w*fireOn(uFS[i].xyz - vec3(px, p.y, p.z), nn, 121., float(i)*3.7 + 20.);
  } else if (p.z > 20. && p.z < 320. && abs(px) < 215. && p.y < 70.) {
    if (p.z < uFYcut) { for (int i = 0; i < ${FIRES_YARD}; i++) s += uFYa[i].w*fireOn(uFYa[i].xyz - vec3(px, p.y, p.z), nn, 290., float(i)*5.1 + 60.); }
    else { for (int i = 0; i < ${FIRES_YARD}; i++) s += uFYb[i].w*fireOn(uFYb[i].xyz - vec3(px, p.y, p.z), nn, 290., float(i)*5.1 + 60.); }
  }
  return vec3(1., .5, .17)*(s*uFire*2.8); }
// THE RING'S OWN LIGHT, BY PLACE (round 4): warm gold, a standing pool of it on the snow before the ring and on whatever
// faces it (trunks, boughs, the fallen leaves), the same whether the eye is near or far: strongest hard by the ring,
// dying out by 150 m (uRing: its middle in the plan's hand and how strong it is). The ring is 15 m across, so its light
// comes from all of its round: a face turned half away still takes some of it
vec3 ringAt(vec3 p, vec3 n){
  vec3 L = vec3(uRing.x - p.x*uHand, uRing.y - p.y, uRing.z - p.z); float d2 = dot(L, L);
  if (d2 > 22500.) return vec3(0.);
  float w = 1. - d2/22500.;
  return vec3(1., .80, .50)*(uRing.w*w*w/(1. + d2/1500.)*(.3 + .7*clamp(dot(n, vec3(L.x*uHand, L.y, L.z))*inversesqrt(d2 + .02)*.75 + .25, 0., 1.))); }
`;
const V_WORLD = /* glsl */`
attribute float aRelief;
varying vec3 vP, vW, vN;
varying float vR;
void main(){
  vP = position; vR = aRelief;
  vec4 w = modelMatrix*vec4(position, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
  gl_Position = projectionMatrix*viewMatrix*w;
}`;

// The ice. The wall was BUILT and raised over centuries: the shader works its face out in the face's own metres
// (q: x along the wall, y up; nothing is stretched along a strip), at three scales that come in by distance:
//   the block  THE ICE STANDS IN GREAT LIFTS: courses about 7 m high, their bed joints sunk; within a course the blocks
//              are 8 to 17 m long, their upright joints shallow and faint, each block with a slight tone and tilt of its
//              own (so the sun glints on one and not its neighbour); over the centuries meltwater and rime have
//              sealed the joints over about half the face, in patches; here and there a block has fallen out and left
//              a sharp-edged hollow, deep blue, with snow on its sill; some courses carry a long ledge of snow and a
//              fringe of icicles under it; here and there a seam of clear ice half a metre to two metres wide runs up
//              through many courses, soft-edged, a paler blue; long fractures run slanting through many blocks, clear
//              ice too. Far off the joints are too fine to tell and the face is its layers, ledges, sheets, seams
//              and fractures (the same form, told coarser)
//   the crack  a net of soft fractures a few metres across on one block in ten, spalled faces, frozen meltwater in pale
//              smooth sheets below the ledges, bands of gravel and of dark old ice (thicker toward the foot), rime on the
//              upper courses and on the flanks the wind hits, the layers the ice was laid down in
//   the grain  within a hundred metres: the ice's own grain, fine layers, wisps of milky ice, sparks of frost
// ONE ICE (round 4): the north face is the south face's ice: the same blocks, joints, fractures, ledges and layers by the
// same laws at the same scales; it differs only by standing in the wall's own shade
const F_ICE = /* glsl */`
varying vec3 vP, vW, vN;
varying float vR;
${G_COMMON}
const float CH = 7.2;
// (no two courses are of one height, no two blocks of one length: the face's metres are drawn out and in a little by a noise of their own)
float courseY(vec2 q){ return (q.y + 2.6*vn(vec2(q.y*.21, 1.7)) + 2.2*vn(vec2(q.x*.006, q.y*.03)))/CH; }
// the block at a place: x the distance to its nearer upright joint (m), y its own number, z the metres above its bed joint, w a second number
vec4 blockAt(vec2 q){
  float cy = courseY(q), row = floor(cy), fy = fract(cy);
  float bl = 8. + 9.*h21(vec2(row, 3.7));
  float cx = (q.x + 4.5*vn(vec2(q.x*.07, row*7.3)))/bl + h21(vec2(row, 9.1))*7.;
  float col = floor(cx), fx = fract(cx);
  return vec4(min(fx, 1. - fx)*bl, h21(vec2(col, row)), fy*CH, h21(vec2(col + 17., row)));
}
vec2 vcell(vec2 i, vec2 f, vec2 g, vec2 m){
  vec2 o = vec2(h21(i + g), h21(i + g + 31.7)); float d = length(g + o - f);
  return d < m.x ? vec2(d, m.x) : d < m.y ? vec2(m.x, d) : m; }
// where the joints still show (0 sealed over .. 1 open): patches some tens of metres across
float seamAt(vec2 q){ return smoothstep(.34, .6, vn(q*.043 + 50.)); }
// where the face of a block has fallen out (one block in forty): a part of the block, broken off along a line of its own.
// ON THE SOUTH FACE ONLY, which thaws in the sun and sheds; the north face never thaws and stands whole
float goneAt(vec2 q, vec4 b){ return step(0., vW.z)*step(.976, b.y)*smoothstep(0., .1, min(b.x, min(b.z, CH - b.z)) - .25)*smoothstep(.4, .45, vn(q*.33 + 17.*b.y)); }
// fractures: the distance (m) to the nearest edge of a net of cells about s metres across
float crackAt(vec2 q, float s){
  vec2 p = q/s, i = floor(p), f = fract(p), m = vec2(9.);
  m = vcell(i, f, vec2(-1., -1.), m); m = vcell(i, f, vec2(0., -1.), m); m = vcell(i, f, vec2(1., -1.), m);
  m = vcell(i, f, vec2(-1., 0.), m); m = vcell(i, f, vec2(0., 0.), m); m = vcell(i, f, vec2(1., 0.), m);
  m = vcell(i, f, vec2(-1., 1.), m); m = vcell(i, f, vec2(0., 1.), m); m = vcell(i, f, vec2(1., 1.), m);
  return (m.y - m.x)*s; }
// the face's height over its lean (m): k near (within a few hundred metres), c close (within a hundred), bk how well the
// single blocks can be told at this distance
float iceH(vec2 q, float k, float c, float bk){
  vec4 b = blockAt(q);
  float sm = bk*seamAt(q);
  // THE FACE IS ICE IN GREAT LIFTS (round 4 mending 1): the bed joints between the courses are sunk 0.5 m; the upright
  // joints within a course are sunk a third as deep and narrower, and a block stands in or out of its neighbours by
  // 0.06 m at the most (it was 0.15 m, which with full upright joints read as laid masonry)
  float bedJ = min(b.z, CH - b.z), nearJ = min(b.x, bedJ);
  float h = .5 - sm*.5*max(.34*(1. - smoothstep(0., .5, b.x)), 1. - smoothstep(0., .65, bedJ)) + sm*(b.y - .5)*.12*smoothstep(0., .3, nearJ);
  h -= 1.1*goneAt(q, b);
  h += 1.4*(fb(q*.045 + 3.) - .5);
  h += k*.55*(fb(q*.31 + 11.) - .5);
  h -= k*.12*(1. - smoothstep(0., .4, crackAt(q, 4.2)))*step(.9, b.w)*smoothstep(.3, .55, vn(q*.33 + 7.));
  h += c*(.07*vn(q*5.3) + .03*vn(q*17.));
  return h;
}
void main(){
  vec3 n = normalize(vN);
  float d = distance(vW, cameraPosition), nearK = 1. - smoothstep(160., 600., d), closeK = 1. - smoothstep(25., 110., d);
  float blockK = 1. - smoothstep(90., 300., d);     // a make by distance: the single block is told within a few hundred metres
  vec2 q = vec2(vP.x, vP.y);
  // how much longer a pixel's reach on the face is along the way the eye looks than across it (by the direction to the
  // eye and the face's own lean, nothing else of the eye): a line is drawn that much wider across that way and that much
  // fainter, so that a face seen along its length or straight down its height is not broken into dots
  vec3 v = normalize(cameraPosition - vW);
  float cg = max(dot(n, v), .1), tg2 = (1. - cg*cg)/(cg*cg);
  vec2 tq = v.xy/max(length(v.xy), .001);
  float gx = sqrt(1. + tg2*tq.x*tq.x), gy = sqrt(1. + tg2*tq.y*tq.y), gm = sqrt(1. + .5*tg2);
  float e = (.05 + .0035*d)*min(gm, 3.);
  float h0 = iceH(q, nearK, closeK, blockK), hx = iceH(q + vec2(e, 0.), nearK, closeK, blockK), hy = iceH(q + vec2(0., e), nearK, closeK, blockK);
  vec4 b = blockAt(q);
  float seam = seamAt(q);
  float cy = courseY(q), row = floor(cy), up = b.z, dn = CH - b.z;
  float gone = goneAt(q, b);   // a face fallen out: a sharp-edged hollow, its outline broken
  vec3 nf = normalize(n + vec3((h0 - hx)/e*uHand, (h0 - hy)/e, 0.)*.8 + vec3((b.y - .5)*uHand, b.w - .5, 0.)*.08*(1. - gone)*blockK*seam);
  float hollow = 1. - smoothstep(-1., 1.7, vR);
  float big = fb(q*.008 + 5.), mid = fb(q*.06 + 9.);
  float age = 1. - smoothstep(8., 95., q.y);                                // the oldest ice lies lowest
  // joints: as wide as they can be seen, the bed joints told farther off than the upright ones; none where they are sealed over
  float jw = .05 + .0018*d;
  // (an upright joint is drawn wider and softer than a bed joint and at two fifths of its strength)
  float bedD = min(up, dn), uprD = b.x;
  float joint = .4*(1. - smoothstep(jw*gx*.4, jw*gx*1.8, uprD))/gx*(1. - smoothstep(70., 240., d));
  joint = max(joint, (1. - smoothstep(jw*gy*.5, jw*gy, bedD))/gy*(1. - smoothstep(180., 520., d))*mix(1., .8, smoothstep(70., 240., d)))*seam;
  // a net of fractures on one block in ten, told in part, seen within 300 m (round 4 mending 1: half as many blocks,
  // each fracture three times as wide with a soft edge, and clear ice like the long ones: they had read as marks drawn)
  float cw = .09 + .0022*d, crack = (1. - smoothstep(cw*gm*.2, cw*gm*1.3, crackAt(q, 4.2)))/gm*step(.9, b.w)*smoothstep(.3, .55, vn(q*.33 + 7.))*(1. - smoothstep(90., 300., d))*(1. - gone);
  // long fractures slanting through many blocks: the edges of a net of cells some thirty metres across, told in part.
  // (Round 4 mending 1: fewer of them are told, each wider and soft-edged: seams of clear ice in the white, not lines)
  float fw = .16 + .0016*d;
  float frac = (1. - smoothstep(fw*gm*.15, fw*gm, crackAt(q*vec2(1., .36) + vec2(13., 7.) + 6.*vn(q*.05), 34.)))*smoothstep(.64, .78, vn(q*vec2(.021, .012) + 80.))*(1. - .8*smoothstep(220., 800., d))*(1. - gone)/gm;
  // a great cleft in every other stretch of seventy metres or so, wandering up through many courses (round 4 mending 1:
  // half as many, each 0.5 to 2 m wide with a soft edge: a seam of clear ice, a paler blue than the ice's depths)
  float cc = floor(q.x/70.), cs = h21(vec2(cc, 77.));
  float cx = (cc + .25 + .5*cs)*70. + 5.*(vn(vec2(q.y*.035, cc*3.3)) - .5) + 1.2*(vn(vec2(q.y*.21, cc)) - .5);
  float cy0 = ${WALL_H}.*(.08 + .5*h21(vec2(cc, 13.))), cy1 = cy0 + 30. + 110.*h21(vec2(cc, 29.));
  float cwid = (.25 + .75*vn(vec2(q.y*.06, cc*9.1)))*smoothstep(cy0, cy0 + 12., q.y)*(1. - smoothstep(cy1 - 12., cy1, q.y))*step(.5, h21(vec2(cc, 55.)));
  float cleft = (1. - smoothstep(cwid*.3, cwid + (.5 + .004*d)*gx, abs(q.x - cx)))*step(.001, cwid);
  // ledges of snow on some courses (a bank of snow 0.6 to 0.9 m thick lying on the course's shoulder), the shade under
  // them, a fringe of icicles hanging from them
  float lth = .72;
  // (ROUND 4: ledges, the shade under them and their icicles on the SOUTH face only: on the north face, seen from the
  // descent at a glance along it, they were thin pale streaks with no thickness)
  float southK = step(0., vW.z);
  float lrow = step(lth, h21(vec2(row, 21.)))*southK, lrowUp = step(lth, h21(vec2(row + 1., 21.)))*southK;
  float lpart = smoothstep(.36, .56, vn(vec2(q.x*.017, row*5.7 + 2.)));
  float ledge = lrow*lpart*(1. - smoothstep(.6, .9 + .002*d, up))*(1. - .6*smoothstep(300., 900., d));
  float sill = gone*(1. - smoothstep(.25, .5, up));
  float lpartUp = smoothstep(.36, .56, vn(vec2(q.x*.017, (row + 1.)*5.7 + 2.)));
  float shadeU = lrowUp*lpartUp*(1. - smoothstep(.2, 1.6, dn));
  float ix = floor(q.x/.42), ifx = abs(fract(q.x/.42) - .5)*2.;
  float ilen = (.5 + 5.*pow(h21(vec2(ix, row + 1.)), 2.5))*lrowUp*lpartUp*smoothstep(.4, .7, vn(vec2(q.x*.11, row*3.1 + 7.)));
  // (the single icicles are told while a pixel's reach along the face is well under their spacing; beyond that the same
  // fringe is drawn as the pale band they make together)
  float icFar = max(smoothstep(120., 380., d), smoothstep(.09, .22, .0016*d*gx));
  float icicle = step(dn, ilen)*(1. - smoothstep(.55, .95, ifx/max(1. - dn/max(ilen, .01), .02)))*(1. - icFar);
  float fringe = lrowUp*lpartUp*(1. - smoothstep(0., 2.2, dn))*icFar*.2*(1. - .8*smoothstep(380., 900., d));
  // frozen meltwater: smooth pale sheets a few metres wide that run down from under a ledge and thin out below
  float grp = cy/3., gt = 1. - fract(grp);
  float sheet = smoothstep(.66, .82, vn(vec2(q.x*.21, floor(grp)*7.3 + 1.)))*smoothstep(0., .08, gt)*(1. - smoothstep(.35, 1., gt))*(.6 + .4*uWet)*(1. - .6*smoothstep(300., 900., d));
  nf = normalize(mix(nf, n, .55*sheet));
  // bands of gravel and of dark old ice, wavy, thicker and more of them toward the foot
  float bandN = vn(vec2(q.x*.006 + 3., q.y*.17 + 1.3*vn(q*.013)));
  float band = smoothstep(.79 - .1*age, .85 - .1*age, bandN)*(.55 + .45*vn(q*.9))*(.5 + .5*age + .3*(1. - nearK));
  float grit = band*step(.62, vn(q*3.7))*closeK;
  // rime: on the upper courses, on the flanks the wind hits, on every sill
  float windward = smoothstep(.02, .22, n.x*uHand);
  float rime = clamp(smoothstep(.55, .8, fb(q*.07 + 31.))*(.2 + .8*smoothstep(110., ${WALL_H}., q.y)) + .7*windward*smoothstep(.35, .7, fb(q*.19 + 4.)), 0., 1.);
  float tone = b.y - .5, rowTone = h21(vec2(row, 41.)) - .5;
  // the layers the ice was laid down in: a few metres thick everywhere, finer ones close by
  float strata = .2*(vn(vec2(q.x*.004, q.y*.33 + 2.*vn(q*.015))) - .5) + .1*closeK*(vn(vec2(q.x*.02, q.y*1.6 + 1.5*vn(q*.07))) - .5);
  float dp = clamp(.62 + .26*hollow + .42*(big - .5) + .3*(mid - .5) + .07*tone*blockK*seam + .1*rowTone + strata + .22*age - .3*(h0 - .2), 0., 1.);
  vec3 pale = vec3(.64, .81, .95), deep = vec3(.05, .20, .50), frost = vec3(.88, .93, .98);
  vec3 alb = mix(pale, deep, dp);
  alb = mix(alb, vec3(.24, .30, .36), .5*age*smoothstep(.4, .7, mid));              // dark old ice at the foot
  alb = mix(alb, vec3(.13, .13, .13), band*.7); alb = mix(alb, vec3(.05, .05, .055), grit*.6);
  alb = mix(alb, frost, rime*.7*(1. - band));
  alb = mix(alb, vec3(.70, .88, .97), sheet*.45);
  alb = mix(alb, vec3(.03, .10, .29), joint*.45);
  // (the long fractures and the clefts are clear ice: a paler blue than the joints' depths, laid softly)
  alb = mix(alb, vec3(.20, .42, .72), max(frac*.5, crack*.4));
  float goneK = gone*.34*(.5 + .5*wallLit(vW));
  alb = mix(alb, vec3(.03, .11, .33), goneK);
  alb = mix(alb, vec3(.16, .36, .68), cleft*.62);
  // a line of rime lies on the lip of an open bed joint
  alb = mix(alb, frost, .5*seam*closeK*step(jw, up)*(1. - smoothstep(0., .22, up - jw)));
  alb = mix(alb, vec3(.82, .92, 1.), icicle*.85 + fringe);
  // close by: wisps of milky ice along the layers
  alb = mix(alb, frost, smoothstep(.62, .8, vn(q*vec2(.3, 2.2) + 9.*vn(q*.08)))*.11*closeK*(1. - cleft)*(1. - gone));
  // meltwater runs on the sheets and flashes as it goes (the world's clock)
  float rcx = floor(q.x/1.3), rs = h21(vec2(rcx, 7.));
  float run = (1. - smoothstep(.02, .08 + .0016*d, abs(q.x - (rcx + .5)*1.3 - .3*sin(q.y*.4 + rs*40.))))*step(rs, .5)*sheet*uWet*(1. - smoothstep(180., 520., d));
  float flash = smoothstep(.5, .85, vn(vec2(rcx*7.3, q.y*.22 + uTime*(1.6 + 2.6*rs))));
  float film = smoothstep(.6, .9, vn(vec2(q.x*1.7, q.y*.33 + uTime*2.6)))*sheet*uWet*nearK;
  float snow = max(ledge, sill);
  alb = mix(alb, vec3(.86, .91, .97), snow);
  nf = normalize(mix(nf, vec3(0., 1., 0.), .75*snow));
  float inside = max(max(cleft*.45, goneK), max(joint, max(crack, frac)*.5)*.6);
  float lit = wallLit(vW)*cloudLit(vW)*(1. - .85*inside)*(1. - .7*shadeU*(1. - snow));
  float wrap = clamp((dot(nf, uSun) + .06)/1.06, 0., 1.);
  vec3 hv = normalize(v + uSun + vec3(0., .0001, 0.));
  // the hollows are darker than what stands proud; the open sky lights a flank by the way it is turned
  float ao = (.45 + .55*smoothstep(-.6, .7, h0))*(1. - .55*inside)*(1. - .45*shadeU*(1. - snow))*(1. - .3*hollow);
  vec3 open = normalize(vec3(uSun.x*.6, .35, sign(vW.z)));
  vec3 amb = skyAmb(nf)*(.62 + .7*max(dot(nf, open), 0.) + .5*snow)*shadeSide(nf, vW);
  // (what the sun lights is the ice's frosted skin as much as its blue depth: the lit face takes the sun's own colour)
  // THE LOW SUN'S BAND (by the height of the point seen on the face): up high its light comes through clear air and is
  // rose gold; toward the foot it has come through the ground's haze and is paler and less of it
  float hi = smoothstep(${WALL_H - 120}., ${WALL_H - 6}., vW.y);
  vec3 sunC = uSunCol*mix(vec3(.80, .86, .98), vec3(1.1, .94, .78), hi);
  // (ONE ICE: in the wall's own shade the sky lights the same frosted skin, so the north face is the south face's ice,
  // its blue deeper only by the shade)
  vec3 skin = mix(alb, vec3(.9, .9, .92), .34*(1. - inside));
  vec3 col = skin*sunC*wrap*lit + mix(alb, skin, .8*(1. - wallLit(vW)))*(amb*ao + fireAt(vW, nf)*1.2);
  // light inside the ice: what goes in on the lit side comes out blue from the depths, most in the clefts and the hollows
  col += vec3(.03, .15, .42)*uSunCol*lit*.4*dp*(1. - snow);
  col += vec3(.02, .10, .30)*skyAt(vW)*(.5*dp + max(.6*cleft, .2*gone))*(1. - snow)*(.55 + .45*wallLit(vW));
  float gl = 1. - .8*max(rime, snow);
  float sp = pow(max(dot(nf, hv), 0.), 48.), sp2 = pow(max(dot(nf, hv), 0.), 260.);
  col += uSunCol*lit*gl*(sp*(.3 + .9*sheet + 1.4*run) + sp2*(1.2 + 2.5*sheet + 2.*icicle)*uGlint);
  col += mix(skyAt(vW), uFog, .35)*pow(max(1. - max(dot(nf, v), 0.), 0.), 2.6)*.3*ao*gl;
  col += uSunCol*lit*film*.3;
  col += uSunCol*lit*run*(.15 + 1.3*flash)*nearK;
  vec2 gq = q*8., gc = floor(gq);
  float gp = 1. - smoothstep(0., .42, length(fract(gq) - .5));
  vec3 gn = normalize(nf + (vec3(h21(gc + 3.), h21(gc + 5.), h21(gc + 9.)) - .5)*1.2);
  col += uSunCol*lit*pow(max(dot(gn, hv), 0.), 60.)*step(.94, h21(gc))*gp*5.*uGlint*closeK;
  gl_FragColor = vec4(fogged(col, vW), 1.);
}`;

// the snow: the ground on both sides (uKind 0: the trodden road, the churned yard) and the top of the wall (uKind 1: crushed stone)
const F_SNOW = /* glsl */`
varying vec3 vP, vW, vN;
varying float vR;
uniform vec4 uRoad, uRiver, uRiver2, uTalus, uAve, uWay, uShadeBox;
uniform vec3 uFork;
uniform float uKind, uDens;
uniform sampler2D uShadeMap;
${G_COMMON}
// how far a place lies from a straight way between two places (level metres)
float wayD(vec2 p, vec2 a, vec2 b){ vec2 u = b - a, q = p - a; return length(q - u*clamp(dot(q, u)/dot(u, u), 0., 1.)); }
// the frozen river (the plan's own law, uRiver: its head's x, how far east it swings, how far it winds, the length of a
// wind; uRiver2: its phase, its head's z): its middle's x at z
float riverX(float z){
  float u = max(uRiver2.y - z, 0.), a = uRiver.z*smoothstep(150., 700., u);
  return uRiver.x + uRiver.y*(1. - exp(-u/600.)) + a*(sin(u/uRiver.w + uRiver2.x) + .35*sin(u/(.41*uRiver.w) + 2.1*uRiver2.x)); }
void main(){
  vec3 n = normalize(vN);
  float steep = n.y;
  float d = distance(vW, cameraPosition), nk = 1. - smoothstep(60., 240., d);
  float e0 = fb(vP.xz*.35), e1 = fb(vP.xz*.35 + vec2(.2, 0.)), e2 = fb(vP.xz*.35 + vec2(0., .2));
  n = normalize(n + vec3((e0 - e1)*uHand, 0., e0 - e2)*1.1*nk);
  vec3 alb = vec3(.80, .86, .93)*(.9 + .12*fb(vP.xz*.02));
  // THE FROZEN RIVER: level ice between low banks, old snow lying over most of it, the wind-swept ice bare and dark
  // between the drifts, pale cracks in it close by. (bed: on the ice; bank: the step of drifted snow on either side)
  float bed = 0., bank = 0., ice = 0., rside = 0.;
  if (uKind < .5 && vP.z < uRiver2.y + 14.) {
    float u = uRiver2.y - vP.z, rx = riverX(vP.z), sl = (riverX(vP.z - 1.) - riverX(vP.z + 1.))*.5;
    float rd = abs(vP.x - rx)*inversesqrt(1. + sl*sl), hw = min(9. + .032*max(u, 0.), 70.) + 1.8*(vn(vP.xz*.06 + 3.) - .5);
    float head = smoothstep(0., 14., u), px = .003*d;
    bed = (1. - smoothstep(hw - .3, hw + .5 + px, rd))*head;
    bank = (smoothstep(hw - .2, hw + .4, rd) - smoothstep(hw + .7, hw + 2.8 + px, rd))*head;
    rside = sign(vP.x - rx);
    ice = bed*(1. - .9*smoothstep(.47, .57, fb(vP.xz*.045 + 40.) + .3*(rd/hw - .5)));
  }
  // THE WOOD ON THE GROUND (vR: how wooded a place is). Under the trees the floor lies in their shade, everywhere.
  // BEYOND THE BUILT COUNTRY the wood itself is painted, BY PLACE ALONE: built: how far the place lies from the made
  // ways (the road to its head, the wall from the gate's meridian to the foot of the way to the grove, that way: the
  // plan's P.madeDist, the same three); the painted crowns come in from 400 to 500 m of them, over the very band in
  // which the plan's built stands go out (planForests: FAR_IN, FAR_OUT), filled at the plan's own rate (nine tenths of
  // the place's cover, by the visit's density: uDens): the built wood's own number of trees to the hectare. Each crown
  // is dark with the snow that lies on it, the snow of the floor between. One make by the eye's distance is left, and
  // it is a filter on these same painted crowns: beyond 0.9 to 2.2 km a crown is too small to tell and the painted
  // wood is drawn closed, at eight tenths of the place's cover: darker than its crowns' share of the ground as seen
  // straight down (a fifth of the cover), as a standing wood seen far off and low shows crown before crown and none
  // of its floor (declared at the world's head)
  float cover = smoothstep(.22, .78, clamp(vR, 0., 1.) + (fb(vP.xz*.013) - .5)*.5);
  // (the north country beyond the belt is ONE WOOD to the horizon: its clearings are few and small there)
  cover = max(cover, smoothstep(650., 1400., -vP.z)*(.74 + .26*cover)*(1. - smoothstep(110., 240., vP.y)))*(1. - max(bed, bank));
  float built = min(min(wayD(vP.xz, vec2(0.), vec2(0., uRoad.w)), wayD(vP.xz, vec2(0.), vec2(uWay.x, 0.))), wayD(vP.xz, uWay.xy, uWay.zw));
  float farK = smoothstep(400., 500., built), dotK = 1. - smoothstep(900., 2200., d);
  alb *= mix(vec3(1.), vec3(.44, .49, .58), min(cover*(.8 + .4*fb(vP.xz*.07)), 1.));
  // (two lattices of cells 19.8 m square, turned 27 and 63 degrees from the wall's line, each cell filled at the place's
  // rate with one crown set anywhere in it: together one crown to 196 m2 at full cover and density 1, as the plan deals;
  // no row of them runs along the wall or the road)
  const mat2 TA = mat2(.891, .454, -.454, .891), TB = mat2(.454, .891, -.891, .454);
  vec2 ta = TA*vP.xz/19.8, tb = TB*vP.xz/19.8 + 7.3, ca = floor(ta), cb = floor(tb);
  vec2 oa = fract(ta) - .5 + (vec2(h21(ca + 3.), h21(ca + 17.)) - .5)*.46, ob = fract(tb) - .5 + (vec2(h21(cb + 5.), h21(cb + 23.)) - .5)*.46;
  float fill = cover*.9*uDens;
  float ka = (1. - smoothstep(.17, .35, length(oa)))*step(h21(ca + 29.), fill), kb = (1. - smoothstep(.17, .35, length(ob)))*step(h21(cb + 31.), fill);
  float crown = max(ka, kb);
  vec2 to = ka > kb ? oa*TA : ob*TB;
  vec3 crownCol = mix(vec3(.04, .065, .09), vec3(.42, .48, .57), .22 + .3*vn(vP.xz*.11) + .3*smoothstep(.0, .21, dot(to, uSun.xz*vec2(uHand, 1.))));
  float canopy = farK*cover*mix(.8, min(crown*1.5, 1.), dotK);
  alb = mix(alb, mix(vec3(.05, .075, .10), crownCol, dotK), canopy*.9);
  // bare rock shows on the steep faces of the far mountains
  float rock = (1. - smoothstep(.64, .86, steep))*smoothstep(150., 270., vP.y);
  alb = mix(alb, vec3(.15, .16, .19)*(.7 + .6*fb(vP.xz*.008 + vP.y*.013)), rock*.85);
  // open snow: wind-carved ridges lying along the wind, hard pale crests over blue hollows (the belt north of the wall
  // strongly; the open ground south of it, the verges of the road and the yard's edges more gently)
  float open = uKind < .5 ? (1. - cover)*(1. - bed)*(1. - smoothstep(250., 700., d)) : 0.;
  float beltK = open*(vP.z < 0. ? 1. - smoothstep(-60., -34., vP.z) : .5*smoothstep(24., 44., vP.z));
  vec2 sq = vec2(vP.x*.03 + .5*vn(vP.xz*.02), vP.z*.36);
  float s0 = fb(sq), s1 = fb(sq + vec2(.012, 0.)), s2 = fb(sq + vec2(0., .14));
  n = normalize(n + vec3((s0 - s1)*uHand*.4, 0., s0 - s2)*2.2*beltK);
  n = normalize(n + vec3(-rside*uHand, 0., 0.)*.9*bank);
  alb *= 1. + .16*(smoothstep(.42, .62, s0) - .5)*beltK;
  n = normalize(mix(n, vec3(0., 1., 0.), .9*bed));
  alb = mix(alb, mix(vec3(.19, .29, .41), vec3(.3, .43, .56), fb(vP.xz*.35 + 7.)), ice*.94);
  alb = mix(alb, vec3(.8, .9, 1.), ice*.5*(1. - smoothstep(0., .035, abs(vn(vP.xz*.8 + 3.) - .5)))*(1. - smoothstep(60., 200., d)));
  alb *= 1. - .3*bank*(1. - smoothstep(300., 900., d));
  float grove = 0., kerb = 0.;
  if (uKind < .5) {
    // THE TALUS at the north foot: between its great blocks the heap is broken ice, blue where the snow has not covered it
    float tu = (vP.x - uTalus.x)/uTalus.y, tout = uTalus.z*pow(max(1. - tu*tu, 0.), .7);
    float talus = vP.z < 0. && tout > 0. ? (1. - tu*tu)*(1. - smoothstep(.1*tout, tout, -vP.z - ${faceZ(0).toFixed(1)})) : 0.;
    float rub = vn(vP.xz*.45), rub1 = vn(vP.xz*.45 + vec2(.3, 0.)), rub2 = vn(vP.xz*.45 + vec2(0., .3));
    n = normalize(n + vec3((rub - rub1)*uHand, 0., rub - rub2)*2.6*talus*(1. - smoothstep(200., 600., d)));
    alb = mix(alb, vec3(.40, .60, .84)*(.7 + .5*vn(vP.xz*1.3)), talus*.6*smoothstep(.4, .62, fb(vP.xz*.21 + 5.)));
    float rz = vP.z;
    float rxm = uRoad.x*sin((rz - 215.)/uRoad.y + uRoad.z)*(1. - smoothstep(uRoad.w - 190., uRoad.w - 70., rz))*smoothstep(228., 320., rz);
    float dr = abs(vP.x - rxm), south = step(24., rz);
    // THE ROAD: a trodden way with two sledge ruts worn deep in it, hoof-marks between them; the wind has laid drifts
    // across it in tongues from its windward verge, and the snow thrown up along its edges lies in low pale banks
    float tongue = smoothstep(.5, .72, fb(vec2(vP.x*.11 + 7., vP.z*.045)) - .066*(vP.x - rxm));
    float road = (1. - smoothstep(2.3, 3.6, dr))*south*(1. - .85*tongue);
    float rut = 1. - smoothstep(.1, .34, abs(dr - .78 + .08*(vn(vec2(vP.z*.13, 1.)) - .5)));
    float churn = fb(vec2(vP.x*1.3, vP.z*.5));
    float rbank = (smoothstep(2.5, 3.3, dr) - smoothstep(3.5, 5., dr))*south*smoothstep(26., 40., rz);
    alb = mix(alb, vec3(.88, .92, .98), rbank*.3*(.5 + .5*fb(vP.xz*.5)));
    n = normalize(n + vec3(sign(vP.x - rxm)*uHand, 0., 0.)*.5*(smoothstep(2.5, 3.1, dr) - smoothstep(3.1, 4.4, dr))*south*nk);
    vec2 hq = vP.xz*vec2(1.9, 1.5), hc = floor(hq);
    // (THE TRACKS' FAR TONE, round 4 mending 3: the hoof-marks and the ruts' darkening fade with distance to their own
    // near means, not to nothing: a mark in every other cell of the hoof lattice covers .056 of the ground; a rut's
    // profile is .149 of the road's width and .173 of the way's. A track is as dark far off as it is near. Round 4
    // mending 4: the tracks' grey takes the same filtered rut, so that nothing of a rut is left to shimmer far off)
    float hoof = mix(step(.5, h21(hc))*(1. - smoothstep(.1, .27, length(fract(hq) - .5 + (vec2(h21(hc + 5.), h21(hc + 11.)) - .5)*.4))), .056, smoothstep(30., 90., d));
    // the riders' side track from the fork: a narrower trodden way
    float fu = max(rz - uFork.x, 0.), fxk = rxm + 2.7 + uFork.y*fu*fu/(fu + 25.);
    float trk = (1. - smoothstep(1.1, 2.2, abs(vP.x - fxk)*uFork.z))*step(uFork.x + 6., rz);
    road = max(road, trk*.8);
    alb = mix(alb, vec3(.50, .49, .48)*(.75 + .5*churn), road*(.36 + .2*mix(rut, .149, smoothstep(120., 300., d))));
    alb *= 1. - road*(.28*hoof + .3*mix(rut, .149, smoothstep(120., 300., d)));
    n = normalize(n + vec3(-3.*(dr - .78)*sign(vP.x - rxm)*uHand, 0., 0.)*rut*road*nk);
    // THE WAY TO THE GROVE, TRODDEN (round 4 mending 2; uWay: its two ends in the plan's hand): a track down its middle
    // like the road's, two sledge ruts and the hoof-marks between them, drifts laid across it in tongues, low pale banks
    // along it; from the wall's apron to the avenue's head, where it goes under the leaves. The kept width's two edges
    // show as a low lip of snow where the verges begin (9 m to either side: the plan's WAY_HALF)
    vec2 gwv = uWay.zw - uWay.xy; float gwl = length(gwv); gwv /= gwl;
    vec2 gwq = vP.xz - uWay.xy; float gwt = dot(gwq, gwv), gws = gwq.x*gwv.y - gwq.y*gwv.x, gwr = abs(gws), gwe = gwl - ${AVENUE.toFixed(1)};
    float gwOn = smoothstep(2., 26., gwt)*(1. - smoothstep(gwe - 8., gwe + 22., gwt));
    float gwTongue = smoothstep(.5, .72, fb(vec2(gws*.11 + 19., gwt*.045)) + .066*gws);
    float gway = (1. - smoothstep(1.9, 3.2, gwr))*gwOn*(1. - .85*gwTongue);
    float gwRut = 1. - smoothstep(.1, .34, abs(gwr - .78 + .08*(vn(vec2(gwt*.13, 5.)) - .5)));
    float gwBank = (smoothstep(2.2, 3., gwr) - smoothstep(3.2, 4.6, gwr))*gwOn;
    float gwLip = (smoothstep(7.6, 8.8, gwr) - smoothstep(9.2, 10.6, gwr))*gwOn*(.4 + .6*fb(vec2(gwt*.06, gws*.3)));
    alb = mix(alb, vec3(.88, .92, .98), (gwBank*.3 + gwLip*.22)*(.5 + .5*fb(vP.xz*.5)));
    alb = mix(alb, vec3(.50, .49, .48)*(.75 + .5*churn), gway*(.34 + .2*mix(gwRut, .173, smoothstep(120., 300., d))));
    alb *= 1. - gway*(.28*hoof + .3*mix(gwRut, .173, smoothstep(120., 300., d)));
    vec3 gwn = vec3(gwv.y*uHand, 0., -gwv.x)*sign(gws);
    n = normalize(n + gwn*(.5*(smoothstep(2.2, 2.8, gwr) - smoothstep(2.8, 4., gwr))*gwOn - 3.*(gwr - .78)*gwRut*gway + .35*(smoothstep(7.6, 8.6, gwr) - smoothstep(8.6, 10.4, gwr))*gwOn)*nk);
    float yard = (1. - smoothstep(215., 300., rz))*south*(1. - smoothstep(60., 150., abs(vP.x)));
    alb = mix(alb, vec3(.60, .62, .66), yard*.4*smoothstep(.35, .7, fb(vP.xz*.12)));
    // blue ice shows through the snow of the apron at the wall's foot
    float apron = (1. - smoothstep(26., 44., abs(rz)))*smoothstep(.45, .7, fb(vP.xz*.09 + 3.));
    alb = mix(alb, vec3(.42, .64, .88), apron*.5);
    // FALLEN LEAVES on the snow of the grove: thick under the great trees along the whole avenue and about the ring,
    // thinning outward to nothing by 62 m (uAve: the avenue's two ends in the plan's hand)
    vec2 av = uAve.zw - uAve.xy, ap = vP.xz - uAve.xy;
    float gd = length(ap - av*clamp(dot(ap, av)/dot(av, av), 0., 1.12));
    grove = 1. - smoothstep(16., 62., gd);
    if (grove > 0.) {
      // (they lie in drifts some metres across where the wind has left them, each leaf turned its own way, bare snow between)
      float drift = smoothstep(.26, .6, fb(vP.xz*.13 + 21.));
      vec2 lc = floor(vP.xz*2.4), lo = fract(vP.xz*2.4) - .5 + (vec2(h21(lc + 7.), h21(lc + 13.)) - .5)*.5;
      float la = h21(lc + 19.)*3.1416;
      lo = vec2(lo.x*cos(la) + lo.y*sin(la), (lo.y*cos(la) - lo.x*sin(la))*1.7);
      float leaf = step(1. - (.6*drift + .14)*grove, h21(lc))*(1. - smoothstep(.2, .42, length(lo)))*(1. - smoothstep(50., 130., d));
      // (under the new leaves lies the litter of the old: the snow between them is stained red, most where they lie
      // thickest: a third at the most, by place, the same at every distance. Where the single leaves are too small to
      // tell, from 50 to 130 m of the eye, they are drawn as their own mean and no more: a leaf covers 0.177 of its cell,
      // (.6*drift + .14)*grove of the cells hold one, and the two leaf colours' mean is the colour laid)
      alb = mix(alb, vec3(.66, .12, .11), .33*(.25 + .75*drift)*grove);
      alb = mix(alb, vec3(.785, .135, .11), .177*(.6*drift + .14)*grove*smoothstep(50., 130., d));
      alb = mix(alb, mix(vec3(.62, .07, .08), vec3(.95, .2, .14), h21(lc + 3.)), leaf);
    }
  } else {
    // THE KEPT WALK down the top's middle (the plan's WALK_HALF, ${WALK_HALF} m to either side of the wall's axis): swept, and gritted
    // with crushed stone: grey gravel, snow drifted over it in tongues, blue ice showing where it is worn through. To
    // its two sides, where the things of the top stand, old grit lies thin under the trodden snow out to 4.5 to 5.9 m
    float walk = 1. - smoothstep(${(WALK_HALF - 0.4).toFixed(1)}, ${(WALK_HALF + 0.5).toFixed(1)}, abs(vP.z) + .9*(fb(vP.xz*.21) - .5));
    float way = max(walk, .4*(1. - smoothstep(4.5, 5.9, abs(vP.z) + 1.3*(fb(vP.xz*.21) - .5))));
    vec3 stone = mix(vec3(.30, .31, .35), vec3(.56, .56, .57), vn(vP.xz*7.)*.6 + vn(vP.xz*23.)*.4);
    alb = mix(alb, stone, way*(.34 + .4*smoothstep(.34, .64, fb(vP.xz*.5))));
    alb = mix(alb, vec3(.34, .56, .80), way*.5*smoothstep(.66, .8, fb(vP.xz*.23 + 9.)));
    // two worn tracks down its middle where the patrols ride
    alb *= 1. - .16*way*(1. - smoothstep(.25, .7, abs(abs(vP.z + .6*(fb(vP.xz*.05) - .5)) - 1.1)));
    // the southern kerb's own shadow lies on the snow inside it: as long as the kerb's height (0.9 m, block by block a
    // little more or less) and the sun's height make it, and only where a run of the kerb stands (the part's kerbRun,
    // the same law, for the southern lip)
    float kl = (.75 + .4*vn(vec2(vP.x*.42, 3.)))*uSun.z/max(uSun.y, .09);
    float kr = sin(vP.x*.19 + 2.1*sin(vP.x*.031 + 1.7)) + .5 + .45*sin(vP.x*.047 + 4.1);
    kerb = smoothstep(6.0 - kl - .5, 6.0 - kl + .25, vP.z)*(1. - smoothstep(5.9, 6.3, vP.z))*step(0., uSun.z)*smoothstep(-.05, .1, kr);
  }
  // snow blown along the ground and across the top on the wind: long pale streaks that run over the trodden road, the yard
  // and the stone of the way (they are part of the snow itself, so they lie on the ground wherever it rises and falls)
  // (on the ground it runs along the wall's foot; on the top it crosses the wall from south to north)
  vec2 fl = uKind < .5 ? vP.xz : vec2(vP.z*1.6, vP.x);
  float sn = fb(vec2(fl.x*.045 + uTime*.5, fl.y*.19 + .6*vn(fl*.03)));
  float blow = smoothstep(.5, .74, sn)*(.5 + .5*vn(vec2(fl.x*.21 + uTime*1.7, fl.y*.9)))*(1. - smoothstep(110., 380., d))*(1. - .7*cover);
  alb = mix(alb, vec3(.86, .90, .96), blow*.62);
  // THE LONG SHADOWS OF THE LOW SUN, BY PLACE: what every tree, tower and hall south of the wall takes of the sun's light
  // from the snow about it was worked out once, at build, from each one's own place and height and the sun's direction,
  // and is kept as a soft map of the ground (uShadeMap over uShadeBox, in the plan's hand); the snow reads it where it lies
  float shade = 0.;
  if (uKind < .5 && vP.z > 0.) {
    vec2 suv = (vP.xz - uShadeBox.xy)*uShadeBox.zw, se = min(suv, 1. - suv);
    if (min(se.x, se.y) > 0.) shade = texture2D(uShadeMap, suv).r*smoothstep(0., .02, min(se.x, se.y*2.5));
  }
  float lit = wallLit(vW)*mix(1., cloudLit(vW), .7)*(1. - max(shade, kerb*.9)*uShadow);
  float wrap = clamp((dot(n, uSun) + .22)/1.22, 0., 1.);
  // drifts: their hollows darker, their crests lighter, also where no sun reaches
  vec3 col = alb*(uSunCol*wrap*lit + skyAmb(n)*(.74 + .32*e0 + .26*fb(vP.xz*.045 + 9.))*shadeSide(n, vW) + fireAt(vW, n) + ringAt(vW, n));
  // the blown snow is in the air over the ground: it takes the low sun full on where the ground only takes it at a glance
  col = mix(col, vec3(.93, .96, 1.)*(uSunCol*lit*.85 + skyAmb(vec3(0., 1., 0.))*1.1), blow*.5);
  vec3 v = normalize(cameraPosition - vW), hv = normalize(v + uSun + vec3(0., 1e-4, 0.));
  vec2 gq = vP.xz*9., gc = floor(gq);
  float gp = 1. - smoothstep(0., .42, length(fract(gq) - .5));
  vec3 gn = normalize(n + (vec3(h21(gc + 3.), h21(gc + 5.), h21(gc + 9.)) - .5)*1.3);
  col += uSunCol*lit*pow(max(dot(gn, hv), 0.), 90.)*step(.93, h21(gc))*gp*4.*uGlint*(1. - smoothstep(20., 80., d));
  // SPARKLE TOWARD THE SUN: farther off the crust glitters where the eye looks toward the light (the same mirror's law,
  // told coarser: crystals in cells of 0.7 m, within 40 to 420 m)
  vec2 kq = vP.xz*1.4, kc = floor(kq);
  vec3 kn = normalize(n + (vec3(h21(kc + 3.), h21(kc + 5.), h21(kc + 9.)) - .5)*.9);
  col += uSunCol*lit*pow(max(dot(kn, hv), 0.), 46.)*step(.8, h21(kc + 1.))*(1. - smoothstep(0., .5, length(fract(kq) - .5)))*2.2*uGlint*smoothstep(40., 90., d)*(1. - smoothstep(200., 420., d))*(1. - cover);
  // the river's bare ice gives back the sky at a glance (a mirror's glint)
  col += skyAt(vW)*.3*ice*pow(1. - max(dot(n, v), 0.), 3.);
  gl_FragColor = vec4(fogged(col, vW), 1.);
}`;

// fires: upright sheets that turn about the vertical to face the eye (aFl: size, seed, kind 0 flame, 1 a pool of light lying flat, 2 a far bead,
// 3 a lamp behind a window or over a door)
const V_FLAME = /* glsl */`
attribute vec3 aFl;
varying vec2 vUv;
varying vec3 vFl, vW;
varying float vD;
void main(){
  vUv = uv; vFl = aFl;
  vec4 c = modelMatrix*instanceMatrix*vec4(0., 0., 0., 1.);
  vec3 tc = cameraPosition - c.xyz;
  vD = length(tc);
  vec3 r = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.));
  vec3 wb = c.xyz + r*position.x*aFl.x*.62 + vec3(0., (position.y + .5)*aFl.x, 0.);
  vec3 wf = c.xyz + vec3(position.x, 0., position.y)*aFl.x;
  vW = aFl.z > .5 && aFl.z < 1.5 ? wf : wb;
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.);
}`;
const F_FLAME = /* glsl */`
varying vec2 vUv;
varying vec3 vFl, vW;
varying float vD;
${G_COMMON}
void main(){
  vec3 c = vec3(0.);
  if (vFl.z < .5) {
    float t = uTime*1.9 + vFl.y*37., x = (vUv.x - .5)*2.;
    float wob = (vn(vec2(vUv.y*3. - t*1.7, vFl.y*9.)) - .5)*.7*vUv.y;
    float wide = max((1. - vUv.y)*(.55 + .25*vn(vec2(t*2.3, vFl.y*5.))) + .02, .02);
    float body = 1. - smoothstep(0., 1., abs(x + wob)/wide);
    float lick = vn(vec2(x*3. + vFl.y*11., vUv.y*4. - t*3.));
    float a = body*smoothstep(0., .12, vUv.y)*(.55 + .7*lick);
    c = mix(vec3(1., .26, .03), vec3(1., .78, .32), body*body)*a*4.5;
  } else {
    float r = clamp(length(vUv - .5)*2., 0., 1.), k = (1. - r)*(1. - r);
    float fl = .8 + .2*vn(vec2(uTime*4., vFl.y*7.));
    c = vec3(1., .5, .18)*k*fl*(vFl.z < 1.5 ? .28 : vFl.z < 2.5 ? 3.2*smoothstep(140., 460., vD) : .5 + 3.*k*k);
  }
  gl_FragColor = vec4(c*uFire*fogKeep(vW)*(.35 + .65*mistKeep(vW)), 1.);
}`;

// blown snow and powder: soft sheets whose noise streams along them (aV: seed, kind, period, phase; kind 0 spindrift,
// 1 the powder of a fall of ice, which shows for a part of its period)
const V_VEIL = /* glsl */`
attribute vec4 aV;
varying vec2 vUv;
varying vec3 vW;
varying vec4 vV;
void main(){
  vUv = uv; vV = aV;
  vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const F_VEIL = /* glsl */`
varying vec2 vUv;
varying vec3 vW;
varying vec4 vV;
${G_COMMON}
void main(){
  float sp = vV.y < .5 ? .5 : vV.y < 1.5 ? .9 : .12;
  float n1 = fb(vec2(vUv.x*3. - uTime*sp, vUv.y*2.2 + vV.x*17.));
  float n2 = fb(vec2(vUv.x*7. - uTime*sp*1.7, vUv.y*5. + vV.x*5.));
  float edge = smoothstep(0., .14, vUv.x)*(1. - smoothstep(.45, 1., vUv.x))*(1. - smoothstep(.15, 1., abs(vUv.y - .5)*2.));
  float a = smoothstep(.3, .72, n1*.7 + n2*.3)*edge;
  float ph = fract(uTime/max(vV.z, 1.) + vV.w);
  float pulse = vV.y > .5 && vV.y < 1.5 ? smoothstep(.0, .08, ph)*(1. - smoothstep(.2, .5, ph)) : 1.;
  float lit = wallLit(vW)*cloudLit(vW);
  vec3 col = vec3(.9, .94, 1.)*(uSunCol*lit*.75 + skyAmb(vec3(0., 1., 0.))*(vV.y < .5 ? 1. + .3*vV.w : 1.));
  gl_FragColor = vec4(fogged(col, vW), a*pulse*(vV.y > 1.5 ? .3 : vV.y < .5 ? .55 + .35*vV.w : .55));   // (a sheet of kind 0 may be thicker: its fourth number)
}`;

// the lesser shadows: sheets lying on the snow that take the sun's share of the light away from what is under them
// (drawn by multiplying), none where the wall's own shadow or a cloud's already lies (aSh 1: on the wall's top; 3: the
// dark about a tree's foot where no sun reaches). The long shadows south of the wall are the snow's own (its shade map)
const V_SHADE = /* glsl */`
attribute float aSh;
varying vec2 vUv;
varying vec3 vW;
varying float vSh;
void main(){
  vUv = uv; vSh = aSh;
  vec4 w = modelMatrix*vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const F_SHADE = /* glsl */`
varying vec2 vUv;
varying vec3 vW;
varying float vSh;
${G_COMMON}
void main(){
  float e = (1. - smoothstep(.45, 1., abs(vUv.x*2. - 1.)))*smoothstep(0., .03, vUv.y)*(1. - smoothstep(.62, 1., vUv.y));
  float onTop = 1. - smoothstep(6.3, 7.1, abs(vW.z));
  e *= vSh > .5 && vSh < 1.5 ? onTop : 1.;
  float lit = wallLit(vW)*cloudLit(vW);
  vec3 amb = skyAmb(vec3(0., 1., 0.));
  vec3 full = uSunCol*((uSun.y + .22)/1.22)*lit + amb;
  vec3 ratio = amb/max(full, vec3(1e-5));
  float k = e*uShadow*fogKeep(vW)*mistKeep(vW)*(vSh > 1.5 ? .72 : 1.);
  vec3 f = mix(vec3(1.), ratio, k);
  // in the wall's shadow nothing throws a shadow: a tree only darkens the snow about its own foot
  float rr = length(vUv*2. - 1.);
  if (vSh > 2.5) f = vec3(1. - .4*(1. - smoothstep(.1, 1., rr))*fogKeep(vW));
  gl_FragColor = vec4(f, 1.);
}`;

// THE BLOWN SNOW in the wall's lee is a field fixed in place (round 4: the sky is clear; what falls is the snow the wind
// takes off the top, sifting down north of the wall). Every flake has a home in a lattice of FLAKE_BOX metres; it falls
// and drifts on the world's clock and wraps within its cell. Whether a flake is there is by its OWN place alone (the lee:
// none south of 9 m north of the wall's middle, all of them from 30 m to 170 m north of it, none beyond 330 m, none above
// 244 m). Of that lattice only the cells about the eye are drawn, finer and fainter with distance (a make by distance).
// The field's own law of nearness: no flake is drawn within FLAKE_NEAR[0] m of the eye, a flake is whole by FLAKE_NEAR[1] m.
export const FLAKE_BOX = 72, FLAKE_NEAR = [2.7, 6];
const V_FLAKE = /* glsl */`
attribute vec3 aHome;
attribute vec4 aK;
uniform float uTime, uHand;
varying vec2 vUv;
varying vec3 vW;
varying float vA;
void main(){
  // (the fall's direction is the plan's, mirrored by the world's hand like everything else of the plan)
  vec3 h = aHome + vec3(${FLAKE_VEL[0]}*uHand, ${FLAKE_VEL[1]}, ${FLAKE_VEL[2]})*uTime + vec3(sin(uTime*.9 + aK.y), 0., cos(uTime*.7 + aK.y*1.7))*aK.z;
  vec3 rel = mod(h - cameraPosition + ${FLAKE_BOX / 2}., ${FLAKE_BOX}.) - ${FLAKE_BOX / 2}.;
  vec3 w = cameraPosition + rel;
  float d = length(rel);
  float there = smoothstep(9., 30., -w.z)*(1. - smoothstep(170., 330., -w.z))*(1. - smoothstep(228., 244., w.y));
  vA = there*smoothstep(${FLAKE_NEAR[0]}, ${FLAKE_NEAR[1]}., d)*(1. - smoothstep(${FLAKE_BOX * 0.36}, ${FLAKE_BOX / 2}., d))*aK.w;
  vUv = position.xy; vW = w;
  vec4 mv = viewMatrix*vec4(w, 1.);
  mv.xy += position.xy*aK.x*step(.004, vA);
  gl_Position = projectionMatrix*mv;
}`;
const F_FLAKE = /* glsl */`
varying vec2 vUv;
varying vec3 vW;
varying float vA;
${G_COMMON}
void main(){
  float a = vA*(1. - smoothstep(.25, 1., length(vUv)));
  if (a < .004) discard;
  vec3 col = vec3(.93, .96, 1.)*(skyAmb(vec3(0., 1., 0.))*1.9 + uSunCol*wallLit(vW)*.8);
  gl_FragColor = vec4(fogged(col, vW), a);
}`;
// the field's flakes: homes dealt through the lattice cell, each with a size, a sway and a brightness of its own
export function flakeField(rng, count, mat) {
  // (each flake is drawn as its disc inside ONE triangle that holds it, where a square of two was drawn before: the same disc)
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1.7321, -1, 0, 1.7321, -1, 0, 0, 2, 0]), 3));
  const home = new Float32Array(count * 3), k = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    home[i * 3] = rng() * FLAKE_BOX; home[i * 3 + 1] = rng() * FLAKE_BOX; home[i * 3 + 2] = rng() * FLAKE_BOX;
    k[i * 4] = 0.03 + 0.065 * rng(); k[i * 4 + 1] = rng() * 6.283; k[i * 4 + 2] = 0.15 + 0.5 * rng(); k[i * 4 + 3] = 0.55 + 0.45 * rng();
  }
  g.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 3)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(k, 4));
  g.instanceCount = count;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

export function makeMaterials(U) {
  const sm = (fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: V_WORLD, fragmentShader: fs, ...o });
  return {
    flake: new THREE.ShaderMaterial({ uniforms: U, vertexShader: V_FLAKE, fragmentShader: F_FLAKE, transparent: true, depthWrite: false }),
    ice: sm(F_ICE), snow: sm(F_SNOW, { uKind: { value: 0 } }), top: sm(F_SNOW, { uKind: { value: 1 } }),
    flame: new THREE.ShaderMaterial({ uniforms: U, vertexShader: V_FLAME, fragmentShader: F_FLAME, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    veil: new THREE.ShaderMaterial({ uniforms: U, vertexShader: V_VEIL, fragmentShader: F_VEIL, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    shade: new THREE.ShaderMaterial({ uniforms: U, vertexShader: V_SHADE, fragmentShader: F_SHADE, transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, side: THREE.DoubleSide }),
    solid: placeLit(new THREE.MeshLambertMaterial({ vertexColors: true }), U),
    built: placeLit(new THREE.MeshLambertMaterial({ vertexColors: true }), U, null, true),
  };
}
// The engine has one sun and one sky light for the whole visit, and they fall alike on the kit's trees and on the solids
// (towers, timber, men, stones). This gives such a material the place's own standing weather, worked out for every point
// seen from that point's own place: the sun's share is taken where the wall's shadow lies (and thinned under a passing
// cloud's shadow), the sky's share is a little bluer in that shadow, and the air between (the one fog, the morning's
// mist at the south foot) is counted along the ray, as for the ice and the snow.
// (the solids stand in snow, which gives back much of the light it gets: their share of the sky's light is 1.6 times the lamp's)
// wv: the name of a varying that already holds the point's place in the world (the kit's wind material has one); else one is added
// built: the solid is of stone and timber, and its plain colours are given their courses by the place of each point seen:
// stone in courses about 0.9 m high (no two alike) of stones 1.3 to 2.6 m long, each of a grey of its own; timber in logs
// 0.3 m thick, lighter along their round; nothing on snow or on what faces up; the joints are told within some two hundred metres
const BUILT_GRAIN = /* glsl */`
{ vec3 gN = normalize(cross(dFdx(vW), dFdy(vW)));
  float gd = distance(vW, cameraPosition), gk = 1. - smoothstep(70., 260., gd);
  float gl = dot(diffuseColor.rgb, vec3(.3, .5, .2));
  float wood = step(1.1, diffuseColor.r/max(diffuseColor.b, .004));
  float made = (1. - smoothstep(.4, .5, gl))*(1. - smoothstep(.55, .75, abs(gN.y)));
  float gu = dot(vW.xz, normalize(vec2(-gN.z, gN.x) + vec2(.0001, 0.)));
  float gch = mix(.9, .3, wood), gcy = vW.y/gch + (1. - wood)*.42*vn(vec2(vW.y*1.3, 3.)), grow = floor(gcy), gfy = fract(gcy);
  float gcx = gu/mix(1.3 + 1.3*h21(vec2(grow, 9.)), 3.7, wood) + .5*mod(grow, 2.) + .37*h21(vec2(grow, 5.)), gcol = floor(gcx), gfx = fract(gcx);
  float gj = max(1. - smoothstep(0., .07 + .0012*gd, min(gfy, 1. - gfy)), (1. - wood)*(1. - smoothstep(0., .035 + .0005*gd, min(gfx, 1. - gfx))));
  float gt = h21(vec2(gcol + 3., grow + 11.)) - .5;
  float gr = wood*(.5 - abs(gfy - .5));
  float gm = vn(vW.xz*.9 + vW.y*.7) - .5;
  diffuseColor.rgb *= 1. + made*(gk*(-.32*gj + .5*gr) + .26*gt*(1. - .6*smoothstep(150., 500., gd)) + .22*gm);
}`;
// snow (the kit's trees only): how much snow lies on the tree where it stands in the cold lee north of the wall: in pads on every bough
// whose seen side looks up, lodged in patches on what of a stem looks up and plastered in upright streaks on its windward
// side (by the seen point's place)
const TREE_SNOW = (amount) => /* glsl */`
{ vec3 sN = normalize(cross(dFdx(vW), dFdy(vW)));
  float sLeaf = clamp(vFlora.x*2., 0., 1.);
  // boughs: snow on whatever looks up, lying in pads with the needles dark between them
  float sB = smoothstep(.12, .55, sN.y)*(.5 + .5*smoothstep(.3, .62, vn(vW.xz*2.6 + vW.y*1.3)));
  // stems: lodged in broken patches on whatever of them looks up, plastered in upright streaks on their windward side
  float sW = .75*smoothstep(.45, .85, sN.y)*(.3 + .7*smoothstep(.3, .6, vn(vec2(vW.x*1.7 - vW.z*1.3, vW.y*1.3))))
    + .45*smoothstep(.35, .85, dot(sN, normalize(vec3(uHand, .1, -.3))))*smoothstep(.52, .7, vn(vec2(vW.x*2.3 + vW.z*1.7, vW.y*.4)));
  float sK = mix(sW, sB, sLeaf);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.86, .9, .96), min(sK*under(vW.z)*${amount.toFixed(2)}, 1.));
}`;
export function placeLit(mat, U, wv = null, built = false, snow = 0, lift = 0) {
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(mat, shader, renderer);
    Object.assign(shader.uniforms, U);
    if (!wv) shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vIceW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 iw = vec4(transformed, 1.);\n#ifdef USE_INSTANCING\n iw = instanceMatrix*iw;\n#endif\n vIceW = (modelMatrix*iw).xyz; }');
    shader.fragmentShader = shader.fragmentShader
      .replace(/void\s+main\s*\(\s*\)\s*\{/, `${wv ? '' : 'varying vec3 vIceW;'}\n#define vW ${wv || 'vIceW'}\n${G_COMMON}\nvoid main() {`)
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n reflectedLight.directDiffuse *= wallLit(vW)*mix(1., cloudLit(vW), .7);\n reflectedLight.indirectDiffuse *= mix(uAmbN, vec3(1.), wallLit(vW))' + (wv ? '' : '*1.6') + ';'
        // where no sun reaches, the sky's light has a side to it; the fires' light and the ring's, on the face of the point seen
        + '\n { vec3 pN = normalize(cross(dFdx(vW), dFdy(vW)));\n reflectedLight.indirectDiffuse *= shadeSide(pN, vW)*(1. + ' + lift.toFixed(2) + '*(1. - wallLit(vW)));\n reflectedLight.indirectDiffuse += diffuseColor.rgb*(fireAt(vW, pN) + ringAt(vW, pN)); }')
      .replace('#include <color_fragment>', built ? '#include <color_fragment>\n' + BUILT_GRAIN : wv && snow > 0 ? '#include <color_fragment>\n' + TREE_SNOW(snow) : '#include <color_fragment>')
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb = fogged(gl_FragColor.rgb, vW);');
  };
  mat.customProgramCacheKey = () => prevKey + '|ice-place:' + (wv || 'own') + (built ? ':built' : '') + (snow ? ':snow' + snow : '') + (lift ? ':lift' + lift : '');
  return mat;
}

// ---------------------------------------------------------------------------------------------------------------------
// the wall and the ground (in steps: each `yield` hands the page back)
// ---------------------------------------------------------------------------------------------------------------------
// a sheet of nx by nz points; at(i, j, o) writes [x, y, z, relief]; its normals come along the sheet itself;
// after(i, j) may sink a point once the normals are made (the skirts of the fine patches, the coarse sheet under them)
function* sheet(nx, nz, at, flip, after = null, per = 2800) {
  const pos = new Float32Array(nx * nz * 3), rel = new Float32Array(nx * nz), nor = new Float32Array(nx * nz * 3), o = [0, 0, 0, 0];
  for (let i = 0, since = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) { at(i, j, o); const k = i * nz + j; pos[k * 3] = o[0]; pos[k * 3 + 1] = o[1]; pos[k * 3 + 2] = o[2]; rel[k] = o[3]; }
    since += nz; if (since >= per) { since = 0; yield; }
  }
  const sg = flip ? -1 : 1;
  for (let i = 0, since2 = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const a = Math.min(i + 1, nx - 1) * nz + j, b = Math.max(i - 1, 0) * nz + j, c = i * nz + Math.min(j + 1, nz - 1), d = i * nz + Math.max(j - 1, 0);
      const ux = pos[a * 3] - pos[b * 3], uy = pos[a * 3 + 1] - pos[b * 3 + 1], uz = pos[a * 3 + 2] - pos[b * 3 + 2];
      const vx = pos[c * 3] - pos[d * 3], vy = pos[c * 3 + 1] - pos[d * 3 + 1], vz = pos[c * 3 + 2] - pos[d * 3 + 2];
      const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = sg / (Math.hypot(x, y, z) || 1), k = (i * nz + j) * 3;
      nor[k] = x * l; nor[k + 1] = y * l; nor[k + 2] = z * l;
    }
    since2 += nz; if (since2 >= 18000) { since2 = 0; yield; }
  }
  if (after) for (let i = 0, since3 = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) pos[(i * nz + j) * 3 + 1] -= after(i, j, pos[(i * nz + j) * 3], pos[(i * nz + j) * 3 + 2]);
    since3 += nz; if (since3 >= 12000) { since3 = 0; yield; }
  }
  yield;
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let q = 0;
  for (let i = 0, since4 = 0; i < nx - 1; i++) {
    for (let j = 0; j < nz - 1; j++) {
      const a = i * nz + j, b = a + nz, c = b + 1, d = a + 1;
      if (flip) { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = a; idx[q++] = d; idx[q++] = c; } else { idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = a; idx[q++] = c; idx[q++] = d; }
    }
    since4 += nz; if (since4 >= 40000) { since4 = 0; yield; }
  }
  yield;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('aRelief', new THREE.BufferAttribute(rel, 1)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}
// lines along the wall: fine from 430 m west of the gate's meridian to 1,690 m east of it (the castle, the manned
// stretch, the foot of the way to the grove), then ever wider to the edge of sight both ways
function wallLines(P, fine, range) {
  const xs = [];
  if (range) { const n = Math.ceil((range[1] - range[0]) / fine); for (let i = 0; i <= n; i++) xs.push(lerp(range[0], range[1], i / n)); return xs; }
  const x0 = -430, x1 = 1690;
  let st = fine; for (let x = x0 - fine; x > -9000; x -= st) { xs.unshift(x); st *= 1.45; }
  for (let x = x0; x <= x1; x += fine) xs.push(x);
  st = fine; for (let x = xs[xs.length - 1] + fine; x < 11000; x += st) { xs.push(x); st *= 1.45; }
  return xs;
}
// the relief of a face over its plain lean: buttresses, hollows and flutes, held between -1.2 and 2.8 m, nothing at the lip
function reliefAt(P, x, y, s) {
  const n = P.noise, o = s > 0 ? 0 : 57.3;
  const r = 2.2 * n.fbm2(x * 0.011 + o, y * 0.006 + 2.2, 3) + 1.0 * n.n2(x * 0.05 + o, y * 0.013) + 0.5 * n.n2(x * 0.17 + o, y * 0.04) + 0.7;
  return clamp(r, -1.2, 2.8) * smoothstep(WALL_H, WALL_H - 10, y) * (s > 0 ? Math.max(smoothstep(9, 22, Math.abs(x)), smoothstep(16, 34, y)) : 1);
}
export function* wallSteps(P, range = null) {
  const H = WALL_H, rows = 37, y0 = -8;
  const xsS = wallLines(P, 7, range), xsN = wallLines(P, 15, range);
  const south = yield* sheet(xsS.length, rows, (i, j, o) => { const y = y0 + (H - y0) * j / (rows - 1), r = reliefAt(P, xsS[i], y, 1); o[0] = xsS[i]; o[1] = y; o[2] = faceZ(y) + r; o[3] = r; }, false, null, 7000);
  const north = yield* sheet(xsN.length, rows, (i, j, o) => { const y = y0 + (H - y0) * j / (rows - 1), r = reliefAt(P, xsN[i], y, -1); o[0] = xsN[i]; o[1] = y; o[2] = -faceZ(y) - r; o[3] = r; }, true, null, 7000);
  // the top: a way of crushed stone between low banks of snow, its edges rounded over the lips
  const zt = [-7.5, -7, -6.1, -5, -2.5, 0, 2.5, 5, 6.1, 7, 7.5], n = P.noise;
  const top = yield* sheet(xsS.length, zt.length, (i, j, o) => {
    const x = xsS[i], z = zt[j], az = Math.abs(z);
    o[0] = x; o[2] = z; o[3] = 0;
    o[1] = az > 7.2 ? H - 1.1 : H + (az > 5.5 ? 0.22 + 0.2 * n.n2(x * 0.09, z) : 0.05 * n.n2(x * 0.3, z * 0.3));
  }, true);
  return { south, north, top };
}
// the forest's floor is shaded by its trees: by the far stands' measure outside the road, the yard and the wall's foot
const floorShade = (P, x, z) => {
  const az = Math.abs(z), foot = smoothstep(faceZ(0) + 20, faceZ(0) + 60, az);
  // (the shade of the northern wood's floor deepens over a hundred metres and more from its edge inward: the wood has no
  // outline on the snow that could be seen from above as the edge of a patch)
  if (z < 0) return P.woodAt(x, z) * foot * Math.pow(smoothstep(P.edgeZ(x) + 34, P.edgeZ(x) - 120, z), 1.5);
  const road = smoothstep(ROAD_HALF + 2, ROAD_HALF + 12, Math.abs(x - P.roadX(z))), yard = smoothstep(300, 236, z) * (1 - smoothstep(120, 200, Math.abs(x)));
  return Math.max(P.woodAt(x, z), 0.55 * (1 - smoothstep(30, 60, Math.abs(x - P.roadX(z)))) * smoothstep(250, 300, z)) * foot * road * (1 - yard);
};
// the ground: one wide coarse sheet to the edge of sight, and two fine patches about the made ways (the road and the
// castle; north of the wall its apron, the way to the grove and the grove: the plan's patchN)
export function* landSteps(P) {
  // (the sheets' lines and sinkings are the plan's: groundLattice)
  const La = P.lattice, { rS, rN } = La;
  const lay = function* (q) {
    const nz = q.zs.length;
    return yield* sheet(q.xs.length, nz, (i, j, o) => { o[0] = q.xs[i]; o[2] = q.zs[j]; o[1] = P.sheetGround(q, i, j); o[3] = floorShade(P, o[0], o[2]); }, true, (i, j, x, z) => q.sink(i, j, x, z), 800);
  };
  const south = yield* lay(La.south);
  yield;
  const north = yield* lay(La.north);
  yield;
  const coarse = yield* lay(La.coarse);
  return { coarse, south, north, rS, rN };
}

// ---------------------------------------------------------------------------------------------------------------------
// made things: timber, stone and iron as plain lit solids with their colours in the corners; snow lies on what faces up
// ---------------------------------------------------------------------------------------------------------------------
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const C_TIMBER = lin('#766b5e'), C_BLACK = lin('#24262b'), C_STONE = lin('#9a9a9c'), C_STONE2 = lin('#77777b'), C_SNOW = lin('#e4ecf6');
const C_IRON = lin('#2b2e33'), C_DARK = lin('#050608'), C_ROPE = lin('#4a3f33'), C_HIDE = lin('#3a2c22');
export class Solid {
  constructor(snow = 0.8) { this.p = []; this.c = []; this.n = []; this.snow = snow; }
  tri(a, b, c, col, snow = this.snow) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1, k = Math.min(1, snow * smoothstep(0.4, 0.7, ny / l));
    const r = lerp(col[0], C_SNOW[0], k), g = lerp(col[1], C_SNOW[1], k), bl = lerp(col[2], C_SNOW[2], k);
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.c.push(r, g, bl, r, g, bl, r, g, bl);
    this.n.push(nx / l, ny / l, nz / l, nx / l, ny / l, nz / l, nx / l, ny / l, nz / l);
  }
  // a flat four-cornered face turned to look away from the point `mid`
  face(a, b, c, d, mid, col, snow) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    const out = (uy * vz - uz * vy) * (a[0] - mid[0]) + (uz * vx - ux * vz) * (a[1] - mid[1]) + (ux * vy - uy * vx) * (a[2] - mid[2]);
    if (out >= 0) { this.tri(a, b, c, col, snow); if (c !== d) this.tri(a, c, d, col, snow); } else { this.tri(a, c, b, col, snow); if (c !== d) this.tri(a, d, c, col, snow); }
  }
  // eight corners: a ring of four, then the four over (or beyond) them
  hull(q, col, snow) {
    const m = [0, 0, 0]; for (const v of q) { m[0] += v[0] / 8; m[1] += v[1] / 8; m[2] += v[2] / 8; }
    this.face(q[0], q[1], q[2], q[3], m, col, snow); this.face(q[4], q[5], q[6], q[7], m, col, snow);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.face(q[i], q[j], q[j + 4], q[i + 4], m, col, snow); }
  }
  box(cx, cy, cz, hx, hy, hz, yaw, col, snow) {
    const c = Math.cos(yaw), s = Math.sin(yaw), q = [];
    for (const y of [-hy, hy]) for (const [x, z] of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]) q.push([cx + x * c + z * s, cy + y, cz - x * s + z * c]);
    this.hull(q, col, snow);
  }
  // a squared timber (or bar, or rope) between two points
  beam(a, b, w, h, col, snow) {
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    let sx = dz, sy = 0, sz = -dx; const sl = Math.hypot(sx, sz);
    if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
    const tx = sy * dz - sz * dy, ty = sz * dx - sx * dz, tz = sx * dy - sy * dx, q = [];
    for (const e of [a, b]) for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) q.push([e[0] + sx * u * w / 2 + tx * v * h / 2, e[1] + sy * u * w / 2 + ty * v * h / 2, e[2] + sz * u * w / 2 + tz * v * h / 2]);
    this.hull(q, col, snow);
  }
  // a round body lying (or leaning) between two points, r0 thick at a and r1 at b, its two ends closed in endCol
  // (a trunk, a spar, a barrel on its side); jag draws its far end out into a broken point
  log(a, b, r0, r1, seg, col, snow, endCol = col, jag = 0) {
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    let sx = dz, sz = -dx; const sl = Math.hypot(sx, sz);
    if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
    const tx = -sz * dy, ty = sz * dx - sx * dz, tz = sx * dy, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const ring = (e, r, i, o = 0) => { const an = (i / seg) * 6.2832, c = Math.cos(an) * r, s = Math.sin(an) * r; return [e[0] + sx * c + tx * s + dx * o, e[1] + ty * s + dy * o, e[2] + sz * c + tz * s + dz * o]; };
    const tip = [b[0] + dx * jag, b[1] + dy * jag + r1 * 0.3, b[2] + dz * jag];
    for (let i = 0; i < seg; i++) {
      this.face(ring(a, r0, i), ring(a, r0, i + 1), ring(b, r1, i + 1), ring(b, r1, i), mid, col, snow);
      this.face(ring(a, r0, i), ring(a, r0, i + 1), a, a, mid, endCol, 0);
      this.face(ring(b, r1, i), ring(b, r1, i + 1), tip, tip, mid, endCol, 0);
    }
  }
  // an upright round (or many-sided) body from radius r0 at y to r1 at y + h; tops (if given) breaks its upper edge
  round(x, y, z, r0, r1, h, seg, col, snow, opt = {}) {
    const a0 = opt.yaw || 0, mid = [x, y + h / 2, z], ring = (r, yy, i) => { const a = a0 + (i / seg) * 6.2832; return [x + r * Math.cos(a), yy, z + r * Math.sin(a)]; };
    const ty = (i) => y + h * (opt.tops ? opt.tops[i % seg] : 1);
    for (let i = 0; i < seg; i++) {
      const j = i + 1, a = ring(r0, y, i), b = ring(r0, y, j);
      if (r1 > 0) this.face(a, b, ring(r1, ty(j), j), ring(r1, ty(i), i), mid, col, snow);
      else { const tip = [x, y + h, z]; this.face(a, b, tip, tip, mid, col, snow); }
      if (opt.cap && r1 > 0) { const tip = [x, y + h, z]; this.face(ring(r1, ty(i), i), ring(r1, ty(j), j), tip, tip, [x, y - 9, z], opt.capCol || col, snow); }
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3)); g.computeBoundingSphere();
    return g;
  }
}

// the switchback stair: flights of planks on beams sunk deep into the ice, braced from below, a rail on the open side
export function stairInto(S, P, k0 = 0, k1 = 99) {
  const st = P.stair; if (!st.ok) return;
  const zi = (y) => faceZ(y) + st.inner, zo = (y) => faceZ(y) + st.inner + st.width;
  for (let k = k0; k < Math.min(st.n, k1); k++) {
    const dir = k % 2 ? -st.dir0 : st.dir0, ya = st.yb + k * st.rise, yb = ya + st.rise, xa = st.x - dir * st.hw, xb = st.x + dir * st.hw;
    S.hull([[xa, ya, zi(ya)], [xa, ya, zo(ya)], [xb, yb, zo(yb)], [xb, yb, zi(yb)], [xa, ya - 0.22, zi(ya)], [xa, ya - 0.22, zo(ya)], [xb, yb - 0.22, zo(yb)], [xb, yb - 0.22, zi(yb)]], C_TIMBER);
    S.beam([xa, ya + 1.1, zo(ya)], [xb, yb + 1.1, zo(yb)], 0.12, 0.14, C_TIMBER, 0.3);
    for (let t = 0; t <= 6; t++) {
      const x = lerp(xa, xb, t / 6), y = lerp(ya, yb, t / 6);
      S.beam([x, y - 0.1, zo(y)], [x, y + 1.1, zo(y)], 0.12, 0.12, C_TIMBER, 0);
      S.beam([x, y - 0.3, faceZ(y) - 1.7], [x, y - 0.3, zo(y) + 0.25], 0.34, 0.34, C_BLACK, 0.5);
      S.beam([x, y - 3.4, faceZ(y - 3.4) - 0.8], [x, y - 0.45, zo(y) - 0.1], 0.24, 0.24, C_BLACK, 0.2);
    }
    // the landing where the stair turns
    S.hull([[xb, yb, zi(yb)], [xb, yb, zo(yb)], [xb + dir * 2.2, yb, zo(yb)], [xb + dir * 2.2, yb, zi(yb)], [xb, yb - 0.22, zi(yb)], [xb, yb - 0.22, zo(yb)], [xb + dir * 2.2, yb - 0.22, zo(yb)], [xb + dir * 2.2, yb - 0.22, zi(yb)]], C_TIMBER);
    S.beam([xb + dir * 2.2, yb - 0.3, faceZ(yb) - 1.7], [xb + dir * 2.2, yb - 0.3, zo(yb) + 0.25], 0.34, 0.34, C_BLACK, 0.5);
    // what holds it: under every landing two raking struts from a shoe set in the ice 5.5 m below, a sill between their
    // feet, and a tie along the face from landing to landing
    for (const e of [xb + dir * 0.2, xb + dir * 2.0]) {
      S.beam([e, yb - 5.5, faceZ(yb - 5.5) - 0.9], [e, yb - 0.4, zo(yb) - 0.05], 0.3, 0.3, C_BLACK, 0.25);
      S.box(e, yb - 5.5, faceZ(yb - 5.5) + 0.25, 0.3, 0.3, 0.45, 0, C_TIMBER, 0.6);
    }
    S.beam([xb - dir * 0.3, yb - 5.5, faceZ(yb - 5.5) + 0.4], [xb + dir * 2.1, yb - 5.5, faceZ(yb - 5.5) + 0.4], 0.24, 0.24, C_TIMBER, 0.6);
  }
  // at its foot: a stage of sills on four posts sunk in the snow, where the first flight begins
  const x0 = st.x - st.dir0 * st.hw, y0 = st.yb;
  for (const e of [-1.4, 1.4]) for (const zz of [zi(y0) + 0.2, zo(y0)]) S.beam([x0 + e, y0 - 2.2, zz], [x0 + e, y0 + 0.1, zz], 0.3, 0.3, C_BLACK, 0);
  S.box(x0, y0 - 0.1, (zi(y0) + zo(y0)) / 2 + 0.1, 1.7, 0.12, st.width / 2 + 0.2, 0, C_TIMBER, 0.9);
}
// where a man stands on the stair after walking s metres of it (0 at its foot); the stair's whole length
export function stairAt(P, s, out) {
  const st = P.stair, fl = Math.hypot(2 * st.hw, st.rise), tot = fl * st.n, q = clamp(s, 0, tot - 0.01), k = Math.floor(q / fl), t = (q - k * fl) / fl;
  const dir = k % 2 ? -st.dir0 : st.dir0, y = st.yb + (k + t) * st.rise;
  out[0] = st.x + dir * st.hw * (2 * t - 1); out[1] = y; out[2] = faceZ(y) + st.inner + st.width * 0.5; out[3] = dir;
  return tot;
}

// the small things on the ice (the plan placed and tested each)
export function faceInto(S, P, i0 = 0, i1 = 1e9) {
  const ICE = [0.46, 0.68, 0.9], ICICLE = [0.74, 0.88, 1.0];
  for (let i = i0; i < Math.min(P.faceThings.length, i1); i++) {
    const t = P.faceThings[i], sg = t.side, x = t.x, y = t.y, z = t.z, w = t.w;
    const h = (k) => { const v = Math.sin(k * 57.3 + t.seed * 733.1) * 43758.5453; return v - Math.floor(v); };
    const zat = (yy) => sg * (faceZ(yy) + reliefAt(P, x, yy, sg));
    // (a long ledge is set deeper into the ice, so that its ends are in the face wherever the face swells or falls back)
    const emb = t.long ? 2.2 : 0.6;
    const shelf = (out, th) => {
      // a ledge of the ice itself: thick where it leaves the face, thin at its lip, its two corners broken back
      const root = th * 2.6, lip = th * 0.4, c1 = 0.25 + 0.5 * h(31), c2 = 0.25 + 0.5 * h(32);
      S.hull([[x - w / 2, y - root, z - sg * emb], [x + w / 2, y - root, z - sg * emb], [x + w / 2 - c2, y - lip, z + sg * out * 0.9], [x - w / 2 + c1, y - lip, z + sg * out * 0.9],
        [x - w / 2, y, z - sg * emb], [x + w / 2, y, z - sg * emb], [x + w / 2 - c2 * 0.6, y + 0.06, z + sg * out], [x - w / 2 + c1 * 0.6, y + 0.06, z + sg * out]], ICE, 1);
      // the snow that has drifted on it, banked against the face
      S.hull([[x - w / 2 + 0.1, y + 0.02, z - sg * emb], [x + w / 2 - 0.1, y + 0.02, z - sg * emb], [x + w / 2 - c2, y + 0.05, z + sg * out * 0.92], [x - w / 2 + c1, y + 0.05, z + sg * out * 0.92],
        [x - w / 2 + 0.5, y + 0.55, z - sg * emb], [x + w / 2 - 0.5, y + 0.55, z - sg * emb], [x + w / 2 - c2 - 0.5, y + 0.3, z + sg * out * 0.5], [x - w / 2 + c1 + 0.5, y + 0.3, z + sg * out * 0.5]], C_SNOW, 1);
      // the icicles under its lip, each of a length of its own
      for (let k = 0, n = Math.floor((w - 0.9) / 0.46); k < n; k++) { const len = 0.4 + 3.4 * h(k + 20) * h(k + 40), r = 0.07 + 0.07 * h(k + 60); if (h(k + 80) < 0.7) S.round(x - w / 2 + 0.6 + k * 0.46, y - lip - 0.1 - len, z + sg * out * (0.6 + 0.25 * h(k)), 0.012, r, len, 4, ICICLE, 0); }
    };
    if (t.kind === 'shelf' || (t.kind === 'spall' && t.long)) shelf(1.25, 0.5);   // (on the north face, seen close and along its length, a broken block standing proud is a ledge like the rest)
    else if (t.kind === 'pillar') {
      // a fall of meltwater frozen where it ran: a ledge of snow, and under it great columns of pale ice hanging side by
      // side down the lean of the face, each of a length and a girth of its own, the longest in the middle
      shelf(1.3, 0.5);
      for (let k = 0, n = 4 + Math.floor(h(11) * 5); k < n; k++) {
        const u = (k + 0.5) / n, len = t.hang * (0.45 + 0.55 * h(k + 30)) * (1 - 0.6 * Math.abs(u - 0.5)), r = 0.26 + 0.3 * h(k + 50), px = x - w / 2 + w * u + (h(k + 70) - 0.5) * 0.3, yb = y - 0.4 - len;
        S.log([px, y - 0.4, z + sg * 0.75], [px + (h(k + 90) - 0.5) * 0.3, yb, zat(yb) + sg * (0.3 + r * 0.5)], r, 0.05, 5, ICICLE, 0);
      }
    } else if (t.kind === 'spall') {
      // a broken block standing proud of the face, sharp-edged, snow on its head
      const hh = 1.2 + 2.2 * h(1), out = 0.9 + 0.5 * h(2);
      S.hull([[x - w / 2, y - hh, z - sg * 0.6], [x + w / 2, y - hh, z - sg * 0.6], [x + w / 2 - 0.4 * h(3), y - hh + 0.3, z + sg * out * 0.8], [x - w / 2 + 0.5 * h(4), y - hh, z + sg * out],
        [x - w / 2, y, z - sg * 0.6], [x + w / 2, y, z - sg * 0.6], [x + w / 2 - 0.6 * h(5), y - 0.3 * h(6), z + sg * out], [x - w / 2 + 0.3, y, z + sg * out * 0.7]], [ICE[0] * 0.8, ICE[1] * 0.85, ICE[2]], 0.95);
    } else if (t.kind === 'props') {
      // old timbers wedged under a shelf to hold it: two props, a head-beam, a brace; grey with age, snow on them
      shelf(1.4, 0.45);
      const yb = y - 4.2, zb = zat(yb);
      for (const sx of [-w / 3, w / 3]) S.beam([x + sx, yb, zb + sg * 0.25], [x + sx, y - 0.5, z + sg * 1.05], 0.26, 0.26, C_TIMBER, 0.5);
      S.beam([x - w / 2 + 0.2, y - 0.6, z + sg * 1.05], [x + w / 2 - 0.2, y - 0.6, z + sg * 1.05], 0.24, 0.26, C_TIMBER, 0.6);
      S.beam([x - w / 3, y - 3.2, zat(y - 3.2) + sg * 0.45], [x + w / 3, y - 1.1, z + sg * 0.9], 0.16, 0.16, C_BLACK, 0.3);
      S.beam([x + w / 3, y - 3.2, zat(y - 3.2) + sg * 0.45], [x - w / 3, y - 1.1, z + sg * 0.9], 0.16, 0.16, C_BLACK, 0.3);
      // their footing: a step cut in the ice for the two feet to stand on, a sill laid on it, each prop pinned to the
      // face behind it by a tie
      S.hull([[x - w / 2, yb - 0.55, zb - sg * 0.6], [x + w / 2, yb - 0.55, zb - sg * 0.6], [x + w / 2 - 0.2, yb - 0.55, zb + sg * 0.7], [x - w / 2 + 0.2, yb - 0.55, zb + sg * 0.7],
        [x - w / 2, yb - 0.12, zb - sg * 0.6], [x + w / 2, yb - 0.12, zb - sg * 0.6], [x + w / 2, yb - 0.1, zb + sg * 0.95], [x - w / 2, yb - 0.1, zb + sg * 0.95]], ICE, 1);
      S.beam([x - w / 3 - 0.5, yb, zb + sg * 0.3], [x + w / 3 + 0.5, yb, zb + sg * 0.3], 0.3, 0.26, C_BLACK, 0.5);
      for (const sx of [-w / 3, w / 3]) S.beam([x + sx, y - 2.3, zat(y - 2.3) - sg * 0.5], [x + sx, y - 2.3, zat(y - 2.3) + sg * 0.75], 0.2, 0.2, C_BLACK, 0.4);
    } else if (t.kind === 'rope') {
      // an iron ring driven into the ice, a rope hanging from it down the face, knotted, a frozen coil at its end
      S.box(x, y, z + sg * 0.2, 0.12, 0.12, 0.25, 0, C_IRON, 0);
      const n = 5; for (let k = 0; k < n; k++) { const ya = y - (t.hang * k) / n, yb = y - (t.hang * (k + 1)) / n; S.beam([x + 0.12 * Math.sin(k * 1.7), ya, zat(ya) + sg * 0.3], [x + 0.12 * Math.sin((k + 1) * 1.7), yb, zat(yb) + sg * 0.3], 0.08, 0.08, C_ROPE, 0); }
      S.box(x, y - t.hang - 0.2, zat(y - t.hang) + sg * 0.32, 0.22, 0.2, 0.2, 0.4, C_ROPE, 0.6);
    } else {
      // a barrel that was dropped and caught on a shelf, lying on its side with snow on it
      shelf(1.5, 0.5);
      const bx = x + (h(7) - 0.5) * w * 0.3;
      S.log([bx - 0.55, y + 0.47, z + sg * 0.55], [bx + 0.55, y + 0.47 + 0.15 * h(8), z + sg * 0.75], 0.43, 0.43, 8, C_TIMBER, 0.9, C_HIDE);
    }
  }
}
// the cage's rails up the face (still), the cage itself and one link-length of chain (both moved in update)
export function cageRailsInto(S, P) {
  const c = P.cage; if (!c.ok) return;
  for (const sx of [-1.15, 1.15]) S.beam([c.x + sx, c.y0 - 2, faceZ(c.y0 - 2) + 3.3], [c.x + sx, WALL_H - 1, faceZ(WALL_H - 1) + 3.3], 0.2, 0.24, C_BLACK, 0.2);
  for (let y = c.y0 + 4; y < WALL_H - 4; y += 11) {
    S.beam([c.x - 1.5, y, faceZ(y) + 3.2], [c.x + 1.5, y, faceZ(y) + 3.2], 0.2, 0.2, C_BLACK, 0.5);
    for (const sx of [-1.15, 1.15]) S.beam([c.x + sx, y, faceZ(y) - 1.5], [c.x + sx, y, faceZ(y) + 3.3], 0.26, 0.26, C_BLACK, 0.5);
    // what holds the rails off the ice: under every tie a knee brace from a shoe in the face 3.4 m below, and between
    // the ties a lighter one
    for (const sx of [-1.15, 1.15]) {
      S.beam([c.x + sx, y - 3.4, faceZ(y - 3.4) - 0.8], [c.x + sx, y - 0.15, faceZ(y) + 3.0], 0.22, 0.22, C_BLACK, 0.25);
      S.box(c.x + sx, y - 3.4, faceZ(y - 3.4) + 0.2, 0.22, 0.26, 0.4, 0, C_TIMBER, 0.6);
      if (y + 5.5 < WALL_H - 4) S.beam([c.x + sx, y + 5.5, faceZ(y + 5.5) - 1.2], [c.x + sx, y + 5.5, faceZ(y + 5.5) + 3.3], 0.18, 0.18, C_BLACK, 0.5);
    }
  }
  // at the foot: the rails stand on a sill laid across two more, the cage's landing stage of planks beside it on posts
  const yg = c.y0 - 1.2;
  S.beam([c.x - 1.75, yg + 0.15, faceZ(yg) + 3.3], [c.x + 1.75, yg + 0.15, faceZ(yg) + 3.3], 0.36, 0.34, C_BLACK, 0.6);
  for (const sx of [-1.55, 1.55]) S.beam([c.x + sx, yg + 0.05, faceZ(yg) + 0.6], [c.x + sx, yg + 0.05, faceZ(yg) + 4.4], 0.32, 0.3, C_BLACK, 0.6);
}
export function cageGeometry() {
  const S = new Solid(0.5), w = 1.05, d = 1.0, h = 2.6;
  S.box(0, 0.06, 0, w + 0.08, 0.06, d + 0.08, 0, C_TIMBER, 0); S.box(0, h, 0, w + 0.08, 0.05, d + 0.08, 0, C_IRON);
  for (const [x, z] of [[-w, -d], [w, -d], [w, d], [-w, d]]) S.beam([x, 0, z], [x, h, z], 0.09, 0.09, C_IRON, 0);
  for (let i = 1; i < 5; i++) {
    const t = -1 + (2 * i) / 5;
    S.beam([t * w, 0, d], [t * w, h, d], 0.04, 0.04, C_IRON, 0); S.beam([t * w, 0, -d], [t * w, h, -d], 0.04, 0.04, C_IRON, 0);
    S.beam([w, 0, t * d], [w, h, t * d], 0.04, 0.04, C_IRON, 0); S.beam([-w, 0, t * d], [-w, h, t * d], 0.04, 0.04, C_IRON, 0);
  }
  for (const y of [1.05, h - 0.05]) { S.beam([-w, y, d], [w, y, d], 0.05, 0.05, C_IRON, 0); S.beam([-w, y, -d], [w, y, -d], 0.05, 0.05, C_IRON, 0); S.beam([w, y, -d], [w, y, d], 0.05, 0.05, C_IRON, 0); S.beam([-w, y, -d], [-w, y, d], 0.05, 0.05, C_IRON, 0); }
  // the bail the chain takes hold of
  S.beam([-w, h, 0], [0, h + 0.7, 0], 0.07, 0.07, C_IRON, 0); S.beam([w, h, 0], [0, h + 0.7, 0], 0.07, 0.07, C_IRON, 0);
  return S.geometry();
}
// the cage's two chains, 1.1 m apart at the cage and drawn together at the crane's beak: thick enough to be seen from
// the climb (a unit long; the world stretches them from the cage's bail to the beak)
export function chainGeometry() { const S = new Solid(0); for (const e of [-0.55, 0.55]) S.beam([e, 0, 0], [e * 0.25, 1, 0], 0.24, 0.24, C_IRON, 0); return S.geometry(); }
// where the cage hangs at a clock time: it rides the leaning face up, rests, rides down, rests
export function cageAt(P, time, out) {
  const c = P.cage, ph = (time / c.period + c.ph) % 1, k = ph < 0.42 ? smoothstep(0, 0.42, ph) : ph < 0.5 ? 1 : ph < 0.92 ? 1 - smoothstep(0.5, 0.92, ph) : 0;
  const y = lerp(c.y0, c.y1, k);
  out[0] = c.x; out[1] = y; out[2] = faceZ(y) + c.off;
  return out;
}

// the low edge of piled ice along both lips of the top: rough blocks under snow, each sized, turned and laid by arithmetic
// on its place (one block of ice, drawn as many times as there are blocks). IT IS NOT AN EVEN ROW (round 4 mending 1):
// the blocks were piled as the top was cleared and have stood for years. kerbRun says where along a lip a run of them
// stands (under 0: a gap; about two thirds of a lip's length is run, in runs of 10 to 40 m and gaps of 4 to 18 m, no two
// alike; the snow's shader lays the southern kerb's shadow by the same law). Within a run one place in ten is empty; a
// block is 1.5 to 3.3 m long and 0.4 to 1.1 m high and lies up to 0.6 m out of its place along the lip; one in eight
// (a small one) has fallen on its side toward the walk; one in five is drifted over, a low long hump of snow. The
// plan tested every 24 m of lip as one rod 1.35 m thick (planTop): every block lies inside it
export const kerbRun = (x, sg) => Math.sin(x * 0.19 + 2.1 * Math.sin(x * 0.031 + sg * 1.7)) + 0.5 + 0.45 * Math.sin(x * 0.047 + sg * 4.1);
export function parapetList(P, i0 = 0, i1 = 1e9, out = []) {
  const H = WALL_H, hh = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  for (let i = i0; i < Math.min(P.top.parapet.length, i1); i++) {
    const [px, sg] = P.top.parapet[i];
    for (let k = 0; k < 10; k++) {
      const x0 = px + 1.2 + k * 2.4, a = hh(px + k, sg * 3.1), b = hh(px + k, sg * 7.7 + 2), c = hh(px + k, sg + 9), e = hh(px + k, sg * 5.3 + 4), f = hh(px + k, sg * 2.9 + 6);
      if (kerbRun(x0, sg) < 0 || f < 0.1) continue;
      const x = x0 + (a - 0.5) * 1.2, z = sg * (6.42 + 0.2 * c), yaw = (c - 0.5) * 0.5;
      if (e < 0.125) out.push({ x, y: H + 0.12, z, yaw, sx: 0.78 + 0.3 * a, sy: 0.4 + 0.2 * b, sz: 0.36 + 0.06 * c, pitch: -sg * (1.15 + 0.3 * b) });
      else if (e < 0.325) out.push({ x, y: H + 0.1, z, yaw, sx: 1.25 + 0.4 * a, sy: 0.2 + 0.12 * b, sz: 0.56 + 0.1 * c, pitch: 0 });
      else out.push({ x, y: H + 0.15, z, yaw, sx: 0.75 + 0.6 * a + 0.3 * b * b, sy: 0.4 + 0.7 * b * (0.5 + 0.5 * c), sz: 0.38 + 0.16 * c, pitch: 0 });
    }
  }
  return out;
}
// a block of ice that has come down off the face (one of two makes, a unit across; the plan gives each its size, its turn
// and its tilt): broken, not sawn, no two corners alike; old snow on whatever of it looks up
export function footIceGeometry(which) {
  const S = new Solid(0.96), h = (k) => { const v = Math.sin(k * 37.7 + which * 211.3 + 1.7) * 43758.5453; return v - Math.floor(v); };
  const foot = [], head = [];
  for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.5 * h(k), r = 0.85 + 0.3 * h(k + 7); foot.push([r * Math.cos(a), -0.5, r * Math.sin(a)]); }
  // (which 0: a slab lying aslant, one edge of it high; which 1: a shard standing on its broken end)
  for (let k = 0; k < 5; k++) {
    const a = k * 1.2566 + 0.5 * h(k) + 0.3 * (h(k + 13) - 0.5), r = which ? 0.3 + 0.2 * h(k + 19) : 0.78 + 0.25 * h(k + 19);
    head.push([r * Math.cos(a) + (which ? 0.3 : 0), which ? 0.6 + 0.4 * h(k + 23) : 0.1 + 0.7 * (0.5 + 0.5 * Math.cos(a - 1.1)), r * Math.sin(a) - (which ? 0.15 : 0)]);
  }
  const mid = [0, 0.1, 0], top = which ? [0.36, 1.15, -0.2] : [0.12, 0.6, 0.06];
  for (let k = 0; k < 5; k++) {
    const j = (k + 1) % 5, tone = 0.8 + 0.4 * h(k + 31), col = [0.46 * tone, 0.66 * tone, 0.86 * Math.min(tone, 1.1)];
    S.face(foot[k], foot[j], head[j], head[k], mid, col, 0.6);
    S.face(head[k], head[j], top, top, mid, col, 1);
  }
  return S.geometry();
}
// a block of the talus (one of three makes, a unit to its half width; the plan gives each its size, its height, its turn and
// its tilt): a mass broken off the face, its sides sheer and blue, its corners gone, a lesser piece split from it and leaning
// on it; old snow on whatever of it looks up
export function talusGeometry(which) {
  const S = new Solid(0.97), h = (k) => { const v = Math.sin(k * 51.3 + which * 173.7 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const ring = (y, r, o) => { const q = []; for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 0.5 * (h(k + o) - 0.5), rr = r * (0.8 + 0.4 * h(k + o + 9)); q.push([rr * Math.cos(a), y + 0.14 * (h(k + o + 21) - 0.5), rr * Math.sin(a) * 0.8]); } return q; };
  const r0 = ring(-0.5, 1.0, 0), r1 = ring(0.2, 0.96, 40), r2 = ring(0.74 + 0.2 * which, 0.72, 80), top = [0.1 * (h(3) - 0.5), 0.98 + 0.2 * which, 0.1 * (h(5) - 0.5)], mid = [0, 0.2, 0];
  for (let k = 0; k < 6; k++) {
    const j = (k + 1) % 6, tone = 0.78 + 0.42 * h(k + 60), col = [0.52 * tone, 0.68 * tone, 0.86 * Math.min(tone, 1.12)], col2 = [0.6 * tone, 0.75 * tone, 0.9 * Math.min(tone, 1.1)];
    S.face(r0[k], r0[j], r1[j], r1[k], mid, col, 0.3);
    S.face(r1[k], r1[j], r2[j], r2[k], mid, col2, 0.6);
    S.face(r2[k], r2[j], top, top, mid, col2, 1);
  }
  // the piece split from it
  const o = [1.05 + 0.1 * which, -0.5, 0.25 * (which - 1)], q = [];
  for (const y of [0, 0.62 + 0.1 * which]) for (const [x, z] of [[-0.3, -0.34], [0.36, -0.3], [0.3, 0.36], [-0.34, 0.3]]) q.push([o[0] + x * (y ? 0.7 : 1) - (y ? 0.22 : 0), o[1] + y + 0.1 * h(x * 7 + z * 3 + y), o[2] + z * (y ? 0.75 : 1)]);
  S.hull(q, [0.55, 0.71, 0.88], 0.9);
  return S.geometry();
}
// THE HIGH GROUND OF THE NORTH (the plan's highAt): one sheet of 150 m cells over the country beyond 1.2 km, lifted off the
// ground where the land rises (wooded to some 200 m over the plain, bare above) and sunk under it where it does not
export function* highlandSteps(P) {
  // (its points' heights are the plan's own: P.high, planHigh)
  const b = P.highBox, { nx, nz, y, h } = P.high;
  return yield* sheet(nx, nz, (i, j, o) => {
    const x = b.x0 + (b.x1 - b.x0) * i / (nx - 1), z = b.z0 + (b.z1 - b.z0) * j / (nz - 1), k = i * nz + j;
    o[0] = x; o[2] = z; o[1] = y[k]; o[3] = (0.55 + 0.45 * P.woodAt(x, z)) * (1 - smoothstep(170, 300, h[k]));
  }, true, null, 900);
}
export function iceBlockGeometry() {
  const S = new Solid(0.95);
  S.hull([[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [-0.9, 1, -0.86], [0.94, 0.9, -0.9], [0.88, 1, 0.9], [-0.95, 0.92, 0.84]], [0.46, 0.64, 0.84]);
  return S.geometry();
}
// what stands on the top: fire baskets, warming sheds, engines of war, cranes with long jibs out over the south edge
export function topInto(S, P, range = null, i0 = 0, i1 = 1e9) {
  const H = WALL_H, things = P.top.things;
  for (let i = i0; i < Math.min(things.length, i1); i++) {
    const t = things[i], x = t.x, z = t.z;
    if (range && (x < range[0] + 4 || x > range[1] - 4)) continue;
    if (t.kind === 'fire') {
      S.round(x, H + 0.45, z, 0.42, 0.56, 0.5, 7, C_IRON, 0, { cap: true, capCol: C_DARK });
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + t.seed * 6; S.beam([x + 0.5 * Math.cos(a), H, z + 0.5 * Math.sin(a)], [x + 0.3 * Math.cos(a), H + 0.5, z + 0.3 * Math.sin(a)], 0.07, 0.07, C_IRON, 0); }
    } else if (t.kind === 'shed') {
      const hx = t.hx ?? 2.2, hz = 1.45, e = 2.2, rd = 3.2, sg = t.sgn;
      S.box(x, H + e / 2, z, hx, e / 2, hz, 0, C_TIMBER, 0);
      // a pitched roof, its ridge along the wall; the doorway looks onto the way
      S.hull([[x - hx - 0.1, H + e, z - hz - 0.1], [x + hx + 0.1, H + e, z - hz - 0.1], [x + hx + 0.1, H + e, z + hz + 0.1], [x - hx - 0.1, H + e, z + hz + 0.1],
        [x - hx - 0.1, H + rd, z - 0.05], [x + hx + 0.1, H + rd, z - 0.05], [x + hx + 0.1, H + rd, z + 0.05], [x - hx - 0.1, H + rd, z + 0.05]], C_BLACK);
      S.box(x + (t.seed - 0.5) * 1.6, H + 0.95, z - sg * (hz + 0.02), 0.5, 0.95, 0.03, 0, C_DARK, 0);
    } else if (t.kind === 'engine') {
      // a great engine for throwing: a platform of sills, two A-frames 6.4 m high with their braces, the axle between
      // their heads; the long arm cocked out over the north with its sling hanging; the box of stones, as big as a cart,
      // hung low from its short end; a windlass at the foot with its ropes to the arm
      const zc = z, ax = H + 6.4, tip = t.tip ?? 14, short = [x, H + 2.9, zc + 1.45], long = [x, H + tip, zc - 6.6];
      for (const sx of [-2.3, 2.3]) {
        S.beam([x + sx, H + 0.2, zc - 1.9], [x + sx, H + 0.2, zc + 1.9], 0.42, 0.4, C_TIMBER);
        S.beam([x + sx, H + 0.3, zc - 1.8], [x + sx * 0.62, ax, zc], 0.36, 0.36, C_TIMBER, 0.35); S.beam([x + sx, H + 0.3, zc + 1.8], [x + sx * 0.62, ax, zc], 0.36, 0.36, C_TIMBER, 0.35);
        S.beam([x + sx * 0.9, H + 2.3, zc - 1.25], [x + sx * 0.9, H + 2.3, zc + 1.25], 0.22, 0.22, C_BLACK, 0.6);
        S.beam([x + sx, H + 0.3, zc], [x + sx * 0.62, ax, zc], 0.2, 0.2, C_BLACK, 0);
      }
      for (const sz of [-1.9, 1.9]) S.beam([x - 2.5, H + 0.25, zc + sz], [x + 2.5, H + 0.25, zc + sz], 0.36, 0.34, C_TIMBER);
      S.beam([x - 1.7, ax, zc], [x + 1.7, ax, zc], 0.34, 0.34, C_BLACK, 0.3);
      S.beam(short, long, 0.42, 0.52, C_TIMBER, 0.6);
      S.beam([x - 0.75, short[1], short[2]], [x + 0.75, short[1], short[2]], 0.16, 0.16, C_IRON, 0);
      for (const sx of [-0.7, 0.7]) S.beam([x + sx, short[1], short[2]], [x + sx, H + 2.2, short[2]], 0.09, 0.09, C_IRON, 0);
      S.box(x, H + 1.45, short[2], 0.9, 0.75, 0.8, 0, C_TIMBER, 0.9); S.box(x, H + 2.15, short[2], 0.8, 0.12, 0.7, 0.3, C_STONE2, 0.7);
      S.beam(long, [x + 0.25, long[1] - 4.6, long[2] + 0.4], 0.06, 0.06, C_ROPE, 0); S.beam(long, [x - 0.25, long[1] - 4.6, long[2] + 0.4], 0.06, 0.06, C_ROPE, 0);
      S.box(x, long[1] - 4.8, long[2] + 0.4, 0.3, 0.14, 0.24, 0, C_HIDE, 0);
      S.log([x - 1.5, H + 1.0, zc - 2.3], [x + 1.5, H + 1.0, zc - 2.3], 0.24, 0.24, 7, C_TIMBER, 0.5, C_BLACK);
      for (const sx of [-1.5, 1.5]) S.beam([x + sx, H + 0.3, zc - 2.3], [x + sx, H + 1.3, zc - 2.3], 0.2, 0.24, C_TIMBER, 0);
      S.beam([x + 0.4, H + 1.0, zc - 2.3], [x, lerp(short[1], long[1], 0.72), lerp(short[2], long[2], 0.72)], 0.05, 0.05, C_ROPE, 0);
    } else if (t.kind === 'store') {
      const q = t.seed;
      if (t.sub === 0) {
        // barrels of oil and pitch, lidded with snow
        for (let k = 0; k < 4; k++) S.round(x - 1.0 + (k % 2) * 1.0 + (k > 1 ? 0.5 : 0), H, z + (k > 1 ? 0.5 : -0.4) * t.sgn, 0.43, 0.43, 1.05 + 0.1 * ((k * 7 + Math.floor(q * 9)) % 3), 8, k % 2 ? C_TIMBER : C_HIDE, 0.9, { cap: true });
      } else if (t.sub === 1) {
        // stones piled for the engines
        // (each a rounded stone of six sides, drawn in at its head; a little snow on the heap)
        for (let k = 0; k < 9; k++) { const row = k < 5 ? 0 : k < 8 ? 1 : 2, i = k < 5 ? k : k < 8 ? k - 5 : 0, sx = x - 1.2 + i * 0.6 + row * 0.3, sy = H + row * 0.46, sz = z + ((k * 5 + Math.floor(q * 7)) % 3 - 1) * 0.1; S.round(sx, sy, sz, 0.34, 0.36, 0.3, 6, k % 3 ? C_STONE : C_STONE2, 0.2, { yaw: k * 1.3 + q * 6 }); S.round(sx, sy + 0.3, sz, 0.36, 0.16, 0.24, 6, k % 3 ? C_STONE : C_STONE2, 0.45, { yaw: k * 1.3 + q * 6, cap: true }); }
      } else if (t.sub === 3) {
        // split wood stacked between two posts, its ends to the way, snow on the top course
        for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) { const lx = x - 1.3 + k * 0.5 + (row % 2) * 0.25, ly = H + 0.24 + row * 0.42; S.log([lx, ly, z - 0.45], [lx, ly, z + 0.45], 0.22, 0.2, 5, C_ROPE, row === 2 ? 0.95 : 0.1, C_TIMBER); }
        for (const e of [-1.65, 1.65]) S.beam([x + e, H, z], [x + e, H + 1.7, z], 0.16, 0.16, C_TIMBER, 0.3);
      } else {
        // a rack of spears, their heads up
        S.beam([x - 1.3, H + 1.25, z], [x + 1.3, H + 1.25, z], 0.12, 0.12, C_TIMBER, 0.5);
        for (const e of [-1.3, 1.3]) S.beam([x + e, H, z], [x + e, H + 1.3, z], 0.14, 0.14, C_TIMBER, 0);
        for (let k = 0; k < 7; k++) S.beam([x - 1.05 + k * 0.35, H + 0.05, z + 0.45 * t.sgn], [x - 1.05 + k * 0.35, H + 2.35, z - 0.1 * t.sgn], 0.05, 0.05, k % 3 ? C_ROPE : C_IRON, 0);
      }
    } else {
      // a crane: the mast, the long jib leaning out over the south face, the block at its beak, the rope
      S.box(x, H + 0.12, z, 0.28, 0.12, 0.28, 0, C_BLACK);
      S.beam([x, H, z], [x, H + 10.4, z], 0.4, 0.4, C_TIMBER, 0);
      S.beam([x, H + 8.2, 2.4], [x, H + 12.2, 14.2], 0.3, 0.36, C_TIMBER, 0.6);
      S.box(x, H + 8.3, 2.5, 0.22, 0.26, 0.22, 0, C_STONE2, 0.3);
      S.box(x, H + 12.0, 14.1, 0.16, 0.24, 0.2, 0, C_IRON, 0);
      // (an idle crane's cage hangs under its beak by two chains: a floor of planks, four posts, a roof of iron)
      if (!t.winch) {
        for (const e of [-0.42, 0.42]) S.beam([x + e * 0.3, H + 12, 14.2], [x + e, H + 6.1, 14.2], 0.16, 0.16, C_IRON, 0);
        S.box(x, H + 3.5, 14.2, 0.62, 0.07, 0.56, 0, C_TIMBER, 0); S.box(x, H + 6.05, 14.2, 0.66, 0.06, 0.6, 0, C_IRON, 0.5);
        for (const [ex, ez] of [[-0.58, -0.52], [0.58, -0.52], [0.58, 0.52], [-0.58, 0.52]]) S.beam([x + ex, H + 3.5, 14.2 + ez], [x + ex, H + 6.05, 14.2 + ez], 0.09, 0.09, C_IRON, 0);
      }
    }
  }
}

// the castle: towers of grey stone (standing ones roofed or crowned, fallen ones broken off with their stones about them),
// timber halls under snow, the stable with its dark doorway, the gate of iron bars at the mouth of the tunnel through the ice
// the castle's towers and halls into S, a step each, each from a stream of its own; returns the lamps they hand back
export function* castleSteps(S, P) {
  const lamps = [], seed = P.seed;
  for (let i = 0; i < P.castle.towers.length; i++) { lamps.push(...towerInto(S, P.castle.towers[i], makeRng(hashSeed('ice-tower' + i + ':' + seed)))); yield; }
  for (let i = 0; i < P.castle.halls.length; i++) { lamps.push(...hallInto(S, P.castle.halls[i], makeRng(hashSeed('ice-hall' + P.castle.halls[i].i + ':' + seed)))); yield; }
  return lamps;
}
export function towerInto(S, t, rng) {
  const seg = t.square ? 4 : 12, y0 = t.y - 3, h = t.h + 3, yaw = t.square ? 0.785 + t.seed : t.seed * 6, lamps = [];
  const col = [lerp(C_STONE2[0], C_STONE[0], t.seed), lerp(C_STONE2[1], C_STONE[1], t.seed), lerp(C_STONE2[2], C_STONE[2], t.seed)];
  const d = []; for (let i = 0; i < 48; i++) d.push(rng());
  const tops = []; for (let i = 0; i <= seg; i++) tops.push(t.fallen ? 1 - 0.34 * d[i % seg] : 1);
  const jag = []; for (let i = 0; i < 9; i++) jag.push([d[12 + i * 4], d[13 + i * 4], d[14 + i * 4], d[15 + i * 4]]);
  // the shaft in courses of great stones, each stone of its own grey (the tone comes of the course and the side, not of a draw)
  const tone = (k, i) => { const v = Math.sin(k * 127.1 + i * 311.7 + t.seed * 74.7) * 43758.5453; return v - Math.floor(v); };
  const rad = (f) => t.r * lerp(1, 0.9, f), mid = [t.x, y0 + h / 2, t.z], nb = Math.max(3, Math.ceil(h / 3.6));
  const lx = t.lean ? t.lean[0] : 0, lz = t.lean ? t.lean[1] : 0, ox = (yy) => t.x + lx * Math.max(yy - t.y, 0), oz = (yy) => t.z + lz * Math.max(yy - t.y, 0);
  const at = (i, yy) => { const a = yaw + (i / seg) * 6.2832, r = rad((yy - y0) / h); return [ox(yy) + r * Math.cos(a), yy, oz(yy) + r * Math.sin(a)]; };
  for (let k = 0; k < nb; k++) for (let i = 0; i < seg; i++) {
    const ya = y0 + (h * k) / nb, yb = y0 + (h * (k + 1)) / nb, t0 = y0 + h * tops[i], t1 = y0 + h * tops[i + 1];
    if (ya >= Math.max(t0, t1)) continue;
    const w = tone(k, i), damp = 0.7 + 0.3 * smoothstep(0, 12, ya - t.y), g = (0.88 + 0.2 * w) * damp;
    S.face(at(i, Math.min(ya, t0)), at(i + 1, Math.min(ya, t1)), at(i + 1, Math.min(yb, t1)), at(i, Math.min(yb, t0)), mid, [col[0] * g, col[1] * g, col[2] * g * 1.03], 0.25);
  }
  // a spreading foot, ledges of snow where the courses step in
  S.round(t.x, y0, t.z, t.r * 1.13, t.r * 1.0, 5.5, seg, [col[0] * 0.7, col[1] * 0.7, col[2] * 0.72], 0.9, { yaw });
  // string courses every eight metres or so: a corbel of darker stone, a flat ledge on it where the snow lies
  for (let yy = t.y + 6.5; yy < y0 + h * (t.fallen ? 0.62 : 1) - 4; yy += 8.2) {
    const f = (yy - y0) / h, r = rad(f);
    S.round(ox(yy), yy - 0.5, oz(yy), r, r * 1.09, 0.5, seg, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.82], 0, { yaw });
    S.round(ox(yy), yy, oz(yy), r * 1.09, r * 0.99, 0.1, seg, col, 1, { yaw });
  }
  // a wooden stair winds up the outside of a lived-in tower to a door: planks on brackets, posts and a rail on the open side
  if (t.stair && !t.fallen) {
    const a0 = yaw + t.seed * 4, n = Math.round(lerp(6, 9, t.seed)), da = 3.4 / t.r, rise = 1.45, pt = (k, rr, dy) => { const a = a0 + k * da; return [t.x + rr * Math.cos(a), t.y + 0.9 + k * rise + dy, t.z + rr * Math.sin(a)]; };
    const ri = t.r * 1.0 + 0.1, ro = t.r * 1.0 + 1.35;
    for (let k = 0; k < n; k++) {
      S.hull([pt(k, ri, 0), pt(k, ro, 0), pt(k + 1, ro, 0), pt(k + 1, ri, 0), pt(k, ri, -0.16), pt(k, ro, -0.16), pt(k + 1, ro, -0.16), pt(k + 1, ri, -0.16)], C_TIMBER, 0.85);
      S.beam(pt(k, ro, -0.1), pt(k, ro, 1.15), 0.12, 0.12, C_TIMBER, 0); S.beam(pt(k, ro, 1.1), pt(k + 1, ro, 1.1), 0.1, 0.12, C_TIMBER, 0.4);
      S.beam(pt(k, ri - 0.3, -1.5), pt(k, ro, -0.2), 0.16, 0.16, C_BLACK, 0.2);
    }
    const dq = pt(n, t.r * 0.985, 1.0), da2 = a0 + n * da; S.box(dq[0], dq[1], dq[2], 0.14, 1.0, 0.55, -da2, C_DARK, 0);
    S.hull([pt(n, ri, 0), pt(n, ro, 0), pt(n + 0.8, ro, 0), pt(n + 0.8, ri, 0), pt(n, ri, -0.16), pt(n, ro, -0.16), pt(n + 0.8, ro, -0.16), pt(n + 0.8, ri, -0.16)].map((q, j) => (j % 4 > 1 ? [q[0], pt(n, ri, j > 3 ? -0.16 : 0)[1], q[2]] : q)), C_TIMBER, 0.85);
  }
  if (!t.fallen) {
    const r1 = rad(1);
    S.round(t.x, y0 + h - 0.2, t.z, r1 * 0.98, r1 * 0.98, 0.2, seg, C_STONE2, 0.25, { yaw, cap: true, capCol: C_STONE2 });
    if (t.cap === 1) {
      // a gallery of black timber under the eaves, the roof a cone under snow
      S.round(t.x, y0 + h - 2.6, t.z, r1 * 1.0, r1 * 1.17, 1.1, seg, C_BLACK, 0, { yaw });
      S.round(t.x, y0 + h - 1.5, t.z, r1 * 1.17, r1 * 1.17, 1.5, seg, C_TIMBER, 0, { yaw });
      S.round(t.x, y0 + h, t.z, r1 * 1.3, 0, 1.0 * t.r, seg, C_BLACK, 0.85, { yaw });
    } else {
      S.round(t.x, y0 + h - 1.4, t.z, r1 * 1.0, r1 * 1.1, 1.4, seg, col, 0.2, { yaw });
      for (let i = 0; i < seg; i += t.square ? 1 : 2) { const a = yaw + ((i + 0.5) / seg) * 6.2832, r = r1 * 1.02; S.box(t.x + r * Math.cos(a), y0 + h + 0.7, t.z + r * Math.sin(a), 0.75, 0.7, 0.4, -a + 1.5708, col, 0.6); }
    }
    // narrow lights up the standing towers: most of them dark, some with a lamp behind
    for (let i = 0; i < 7; i++) {
      const a = yaw + jag[i][0] * 6.2832, yy = t.y + 6 + jag[i][1] * (t.h - 12), r = rad((yy - y0) / h) * (t.square ? 0.74 : 0.99);
      S.box(t.x + r * Math.cos(a), yy, t.z + r * Math.sin(a), 0.2, 0.85, 0.2, -a, C_DARK, 0);
      if (jag[i][2] < 0.45) lamps.push([t.x + (r + 0.45) * Math.cos(a), yy, t.z + (r + 0.45) * Math.sin(a), 2.6, jag[i][3]]);
    }
  } else {
    // snow lies inside a broken tower; its fallen stones about its foot (inside the measure the plan tested)
    S.round(ox(y0 + h * 0.6), y0 + h * 0.6, oz(y0 + h * 0.6), t.r * 0.9, t.r * 0.9, 0.2, seg, C_DARK, 0.7, { yaw, cap: true, capCol: C_STONE2 });
    for (let i = 0; i < 9; i++) { const a = jag[i][0] * 6.2832, r = t.r * 1.13 + 0.2 + jag[i][1] * 0.9, b = 0.35 + jag[i][2] * 0.55; S.box(t.x + r * Math.cos(a), t.y + 0.5 + b * 0.5, t.z + r * Math.sin(a), b, b * 0.8, b * 0.9, jag[i][3] * 3, col, 0.7); }
  }
  return lamps;
}
export function hallInto(S, h, rng) {
  const c = Math.cos(h.yaw), s = Math.sin(h.yaw), at = (lx, y, lz) => [h.x + lx * c + lz * s, h.y + y, h.z - lx * s + lz * c];
  const d = []; for (let i = 0; i < 24; i++) d.push(rng());
  const hw = h.hw, hl = h.hl, e = h.eave, top = e + h.rise, open = h.ruined ? lerp(0.25, 0.6, d[0]) : 0, zr = hl - 2 * hl * open, ch = h.ch, door = d[2];
  // footing of stone, walls of black timber
  S.hull([at(-hw, -1.5, -hl), at(hw, -1.5, -hl), at(hw, -1.5, hl), at(-hw, -1.5, hl), at(-hw, 0.7, -hl), at(hw, 0.7, -hl), at(hw, 0.7, hl), at(-hw, 0.7, hl)], C_STONE2, 0.3);
  S.hull([at(-hw + 0.1, 0.7, -hl + 0.1), at(hw - 0.1, 0.7, -hl + 0.1), at(hw - 0.1, 0.7, hl - 0.1), at(-hw + 0.1, 0.7, hl - 0.1), at(-hw + 0.1, e, -hl + 0.1), at(hw - 0.1, e, -hl + 0.1), at(hw - 0.1, e, hl - 0.1), at(-hw + 0.1, e, hl - 0.1)], C_TIMBER, 0.3);
  // the roof over the part that still stands; bare rafters over the part that has fallen in
  S.hull([at(-hw - 0.5, e, -hl - 0.5), at(hw + 0.5, e, -hl - 0.5), at(hw + 0.5, e, zr), at(-hw - 0.5, e, zr), at(-0.08, top, -hl - 0.5), at(0.08, top, -hl - 0.5), at(0.08, top, zr), at(-0.08, top, zr)], C_BLACK, 0.92);
  for (let z = zr + 1.3, k = 0; z < hl; z += 1.9, k++) { S.beam(at(-hw, e, z), at(0, top - 0.4 * d[3 + (k % 10) * 2], z), 0.18, 0.18, C_BLACK, 0.5); if (d[4 + (k % 10) * 2] < 0.6) S.beam(at(hw, e, z), at(0, top - 0.5, z), 0.18, 0.18, C_BLACK, 0.5); }
  // the chimney at one end; the doorway on the side toward the road (the stable's is wide and dark)
  S.hull([at(-0.55, 0, ch * (hl - 1.3)), at(0.55, 0, ch * (hl - 1.3)), at(0.55, 0, ch * (hl - 0.2)), at(-0.55, 0, ch * (hl - 0.2)), at(-0.55, top + 1.5, ch * (hl - 1.3)), at(0.55, top + 1.5, ch * (hl - 1.3)), at(0.55, top + 1.5, ch * (hl - 0.2)), at(-0.55, top + 1.5, ch * (hl - 0.2))], C_STONE, 0.6);
  const sd = h.stable ? 1 : h.x < 0 ? 1 : -1, dw = h.stable ? 1.9 : 0.6, dh = h.stable ? 3.7 : 2.1, dz = h.stable ? 0 : (door - 0.5) * hl;
  S.hull([at(sd * (hw - 0.3), 0.3, dz - dw), at(sd * (hw + 0.06), 0.3, dz - dw), at(sd * (hw + 0.06), 0.3, dz + dw), at(sd * (hw - 0.3), 0.3, dz + dw), at(sd * (hw - 0.3), dh, dz - dw), at(sd * (hw + 0.06), dh, dz - dw), at(sd * (hw + 0.06), dh, dz + dw), at(sd * (hw - 0.3), dh, dz + dw)], C_DARK, 0);
  // small shuttered lights along the side toward the road, a lantern over the door: where men still live, some are lit
  const lamps = [];
  for (let k = 0; k < 3; k++) {
    const lz = (k - 1) * hl * 0.56 + (d[10 + k] - 0.5) * 1.2, q = at(sd * (hw + 0.02), 2.25, lz);
    if (Math.abs(lz - dz) < dw + 0.9 || (h.ruined && lz > zr - 1)) continue;
    S.box(q[0], q[1], q[2], 0.06, 0.42, 0.34, h.yaw, C_DARK, 0);
    if (!h.ruined && d[13 + k] < 0.62) lamps.push([...at(sd * (hw + 0.5), 2.25, lz), 2.3, d[16 + k], 'window']);
  }
  // (where men live the door stands lit: the lantern over it lights the snow before it; the firelight in the doorway
  // itself is only a glow)
  if (!h.ruined) { lamps.push([...at(sd * (hw + 0.7), dh + 0.45, dz), h.stable ? 3.0 : 2.0, d[19], 'door']); if (!h.stable) lamps.push([...at(sd * (hw + 0.12), 1.2 + 1.1, dz), 2.2, d[20], 'glow']); }
  return lamps;
}
// the covered ways between the buildings: posts, a pitched roof of black boards under snow, a low wall of planks on the weather
// side (the open ones have none)
export function waysInto(S, P) {
  for (const w of P.castle.ways) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, sx = uz, sz = -ux, n = Math.max(2, Math.round(len / 3.1));
    const at = (t, side, y) => [w.a[0] + dx * t + sx * side, lerp(w.ya, w.yb, t) + y, w.a[1] + dz * t + sz * side];
    for (let k = 0; k <= n; k++) for (const sd of [-1.25, 1.25]) S.beam(at(k / n, sd, -0.4), at(k / n, sd, 2.5), 0.2, 0.2, C_TIMBER, 0);
    for (const sd of [-1.25, 1.25]) S.beam(at(0, sd, 2.5), at(1, sd, 2.5), 0.2, 0.22, C_TIMBER, 0);
    S.hull([at(0, -1.7, 2.45), at(1, -1.7, 2.45), at(1, 1.7, 2.45), at(0, 1.7, 2.45), at(0, -0.06, 3.5), at(1, -0.06, 3.5), at(1, 0.06, 3.5), at(0, 0.06, 3.5)], C_BLACK, 0.92);
    if (!w.open) S.hull([at(0, -1.3, -0.3), at(1, -1.3, -0.3), at(1, -1.2, -0.3), at(0, -1.2, -0.3), at(0, -1.3, 1.5), at(1, -1.3, 1.5), at(1, -1.2, 1.5), at(0, -1.2, 1.5)], C_TIMBER, 0.2);
  }
}
// the ruined holdfast by the road (its tower's stump is made like any fallen tower): the stubs of its two walls stepping
// down into the snow, fallen stones; the waymark at the fork: a cairn of three courses
export function holdfastInto(S, P, rng) {
  const hf = P.holdfast, d = []; for (let i = 0; i < 24; i++) d.push(rng());
  if (hf.on) {
    const t = hf.tower;
    for (let k = 0; k < hf.walls.length; k++) {
      const w = hf.walls[k], c = Math.cos(w.a), s = Math.sin(w.a);
      for (let j = 0; j < 3; j++) {
        const l0 = t.r * 0.9 + (w.len * j) / 3, l1 = t.r * 0.9 + (w.len * (j + 1)) / 3, hh = w.h * [1, 0.62, 0.3][j] * (0.85 + 0.3 * d[k * 3 + j]), mx = t.x + c * (l0 + l1) / 2, mz = t.z + s * (l0 + l1) / 2;
        S.box(mx, P.groundAt(mx, mz) - 0.6 + (hh + 0.6) / 2, mz, (l1 - l0) / 2 + 0.05, (hh + 0.6) / 2, 0.55, -w.a, j % 2 ? C_STONE2 : C_STONE, 0.95);
      }
      for (let j = 0; j < 4; j++) { const l = t.r + w.len * (0.2 + 0.8 * d[8 + k * 4 + j]), o = (d[16 + k * 4 + j] - 0.5) * 5, b = 0.3 + 0.4 * d[k * 4 + j], x = t.x + c * l - s * o, z = t.z + s * l + c * o; S.box(x, P.groundAt(x, z) + b * 0.4, z, b, b * 0.7, b * 0.85, d[j] * 3, C_STONE, 0.8); }
    }
  }
  const m = P.waymark;
  if (m.on) {
    S.round(m.x, m.y - 0.5, m.z, 1.0, 0.72, m.h * 0.42 + 0.5, 6, C_STONE2, 0.5, { yaw: m.seed * 6 });
    S.round(m.x, m.y + m.h * 0.42, m.z, 0.66, 0.5, m.h * 0.33, 6, C_STONE, 0.5, { yaw: m.seed * 6 + 0.5 });
    S.round(m.x, m.y + m.h * 0.75, m.z, 0.44, 0.3, m.h * 0.25, 5, C_STONE2, 0.9, { yaw: m.seed * 6 + 1.1, cap: true });
    S.round(m.x, m.y + m.h * 0.42 - 0.04, m.z, 0.78, 0.66, 0.05, 6, C_STONE, 1, { yaw: m.seed * 6 }); S.round(m.x, m.y + m.h * 0.75 - 0.04, m.z, 0.56, 0.44, 0.05, 6, C_STONE, 1, { yaw: m.seed * 6 + 0.5 });
  }
}
// the great block of a rare day: pieces of blue ice lying tumbled and split, old: snow lies deep on every face that looks up
export function blockInto(S, P) {
  const b = P.block; if (!b.on) return;
  for (const p of b.pieces) {
    const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw), cp = Math.cos(p.pitch), sp = Math.sin(p.pitch), cr = Math.cos(p.roll), sr = Math.sin(p.roll), q = [];
    const h = (k) => { const v = Math.sin(k * 71.3 + p.tone * 913.7) * 43758.5453; return v - Math.floor(v); };
    let k = 0;
    for (const ly of [-1, 1]) for (const [lx, lz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      // a corner of the piece, drawn in a little and unevenly at its top: broken, not sawn
      const f = ly > 0 ? 0.72 + 0.26 * h(k) : 1 + 0.12 * h(k), x0 = lx * p.hx * f, y0 = ly * p.hy * (ly > 0 ? 0.8 + 0.35 * h(k + 9) : 1), z0 = lz * p.hz * f;
      const y1 = y0 * cp - z0 * sp, z1 = y0 * sp + z0 * cp, x2 = x0 * cr - y1 * sr, y2 = x0 * sr + y1 * cr;
      q.push([p.x + x2 * cy + z1 * sy, p.y + p.hy * (p.big ? 0.66 : 0.5) + y2, p.z - x2 * sy + z1 * cy]); k++;
    }
    const t = p.tone, col = [lerp(0.13, 0.36, t), lerp(0.34, 0.6, t), lerp(0.7, 0.9, t)];
    S.hull(q, col, 0.97);
  }
}
// stones under snow, fallen trunks and stumps in the northern wood and the cairns that mark the way to the grove (the
// plan placed and tested each); a stone's corners are set by arithmetic on its own number
export function rocksInto(S, P, i0 = 0, i1 = 1e9) {
  const BARK = lin('#5a4a40'), WOOD = lin('#a08a6c'), ROCK = lin('#5e6068'), DEADWOOD = lin('#6e6050');
  for (let i = i0; i < Math.min(P.rocks.length, i1); i++) {
    const t = P.rocks[i], c = Math.cos(t.rot), s = Math.sin(t.rot), at = (lx, ly, lz) => [t.x + lx * c + lz * s, t.y + ly, t.z - lx * s + lz * c];
    const h = (k) => { const v = Math.sin(k * 91.7 + t.seed * 517.3) * 43758.5453; return v - Math.floor(v); };
    if (t.cairn) {
      // a waymark: a low broad cairn of pale stones, knee to waist high and wider than it is high, A THICK CUSHION OF
      // SNOW LYING ON EVERY STONE (round 4 mending 3: only the stones' small tops carried snow, and the heap read bare
      // and dark); no pole, and nothing upright in it
      const stone = (ox, oz, z, kk, up) => {
        const lo = [], hi = [], sb = [], su = [], tone = 1.45 + 0.5 * h(kk + 41), col = [ROCK[0] * tone, ROCK[1] * tone, ROCK[2] * tone], mid = at(ox, up + z * 0.3, oz);
        let top = -1e9;
        for (let k = 0; k < 5; k++) {
          const a = k * 1.2566 + 0.6 * h(kk + k + 5), rr = z * (0.9 + 0.3 * h(kk + k + 9)), hy = up + z * (0.6 + 0.25 * h(kk + k + 21)), ca = Math.cos(a + 0.4), sa = Math.sin(a + 0.4);
          lo.push(at(ox + rr * Math.cos(a), up - 0.3, oz + rr * Math.sin(a))); hi.push(at(ox + rr * 0.7 * ca, hy, oz + rr * 0.7 * sa));
          // (the snow on it: the cushion's rim a little under the stone's top edge and beyond it, its shoulder over it)
          sb.push(at(ox + rr * 0.94 * ca, hy - 0.11, oz + rr * 0.94 * sa)); su.push(at(ox + rr * 0.64 * ca, hy + 0.12 + 0.05 * h(kk + k + 31), oz + rr * 0.64 * sa));
          if (hy > top) top = hy;
        }
        const crown = at(ox, top + 0.24 + 0.06 * h(kk + 37), oz);
        for (let k = 0; k < 5; k++) { const j = (k + 1) % 5; S.face(lo[k], lo[j], hi[j], hi[k], mid, col, 0.5); S.face(sb[k], sb[j], su[j], su[k], mid, C_SNOW, 1); S.face(su[k], su[j], crown, crown, mid, C_SNOW, 1); }
      };
      for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 6 * h(51), rr = 0.85 + 0.2 * h(53 + k); stone(rr * Math.cos(a), rr * Math.sin(a), 0.5 + 0.14 * h(57 + k), 70 + k * 40, -0.1); }
      stone(0, 0, 0.95, 0, -0.1);
      for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 6 * h(151), rr = 0.5 + 0.1 * h(153 + k); stone(rr * Math.cos(a), rr * Math.sin(a), 0.42 + 0.1 * h(157 + k), 300 + k * 40, 0.36); }
      stone(0.1 * h(61), 0.1 * h(62), 0.3, 200, 0.6);
    } else if (t.stump) {
      // a stump of the cut-back wood, lidded with snow, a root or two showing
      const r = 0.36 + 0.3 * h(1), hh = 0.55 + 0.7 * h(2);
      S.round(t.x, t.y - 0.5, t.z, r * 1.25, r, hh + 0.5, 8, BARK, 0.95, { cap: true, capCol: WOOD, yaw: h(3) * 6 });
      for (let k = 0; k < 2; k++) { const a = h(4 + k) * 6.283; S.log([t.x + r * 0.8 * Math.cos(a), t.y + 0.25, t.z + r * 0.8 * Math.sin(a)], [t.x + (r + 1.1) * Math.cos(a), t.y - 0.25, t.z + (r + 1.1) * Math.sin(a)], 0.17, 0.08, 5, BARK, 0.9); }
    } else if (t.log) {
      // a fallen trunk: round, tapering, snow lying along its top, its butt broken off in splinters, stubs of boughs
      const r = 0.42 + 0.3 * h(1), lift = 0.45 * h(2);
      // (it lies bedded: a third of its girth under the snow at its butt, its thin end gone under altogether)
      const bed = r * 0.38;
      S.log(at(-4.4, r * 0.72 - bed, 0), at(4.2, r * 0.3 + lift - bed, 0), r, r * 0.7, 9, BARK, 0.95, DEADWOOD, 0.5);
      for (let k = 0; k < 3; k++) { const a = h(6 + k) * 6.283; S.log(at(-4.4 + 0.1, r * 0.72 - bed + 0.6 * r * Math.sin(a), 0.6 * r * Math.cos(a)), at(-5.1 - 0.5 * h(9 + k), r * 0.72 - bed + 0.8 * r * Math.sin(a), 0.8 * r * Math.cos(a)), 0.13, 0.03, 4, DEADWOOD, 0); }
      S.log(at(-1.2 + 2 * h(3), r * 1.3 - bed, 0), at(-0.6 + 2 * h(3), r * 2 + 1.2 - bed, 0.5), 0.1, 0.05, 5, BARK, 0.3);
      S.log(at(1.6 * h(4), r * 1.2 - bed, 0), at(1.6 * h(4) + 0.5, r * 2 + 0.9 - bed, -0.6), 0.09, 0.04, 5, BARK, 0.3);
      S.log(at(2.6, r * 0.9 - bed, 0), at(3.2, r * 0.6 - bed, 1.3 + h(5)), 0.08, 0.04, 5, BARK, 0.6);
    } else {
      // a boulder bedded in the snow: a foot of six corners sunk half a metre under the snow, a shoulder of six drawn in
      // and turned, a crown of three; dark where it is steep, snow on its crown and on whatever of it looks up. A rock
      // of the belt has one or two lesser ones leaning by it
      const boulder = (ox, oz, z, kk) => {
        const foot = [], sh = [], cr = [];
        for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 0.5 * h(kk + k + 5), rr = z * (0.95 + 0.4 * h(kk + k + 9)); foot.push(at(ox + rr * Math.cos(a), -0.55, oz + rr * Math.sin(a))); }
        for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 0.5 * h(kk + k + 5) + 0.35, rr = z * (0.66 + 0.3 * h(kk + k + 17)); sh.push(at(ox + rr * Math.cos(a), z * (0.34 + 0.3 * h(kk + k + 21)), oz + rr * Math.sin(a))); }
        for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 2 * h(kk + 29), rr = z * (0.2 + 0.2 * h(kk + k + 31)); cr.push(at(ox + rr * Math.cos(a), z * (0.72 + 0.34 * h(kk + k + 35)), oz + rr * Math.sin(a))); }
        const mid = at(ox, z * 0.2, oz), tone = 0.8 + 0.5 * h(kk + 41), col = [ROCK[0] * tone, ROCK[1] * tone, ROCK[2] * tone];
        for (let k = 0; k < 6; k++) { const j = (k + 1) % 6; S.face(foot[k], foot[j], sh[j], sh[k], mid, col, 0.5); S.face(sh[k], sh[j], cr[Math.floor(j / 2) % 3], cr[Math.floor(k / 2) % 3], mid, col, 1); }
        S.face(cr[0], cr[1], cr[2], cr[2], mid, col, 1);
      };
      boulder(0, 0, t.size, 0);
      if (t.belt) for (let k = 0, m = 1 + Math.floor(h(51) * 2.2); k < m; k++) { const a = h(53 + k) * 6.283, rr = t.size * (1.15 + 0.35 * h(57 + k)); boulder(rr * Math.cos(a), rr * Math.sin(a), t.size * (0.3 + 0.28 * h(61 + k)), 70 + k * 40); }
    }
  }
}
// the yard's things (the plan placed and tested each): braziers, split wood stacked under snow, barrels, a cart with its
// shafts down, posts for sword-work
export function yardInto(S, P) {
  for (const t of P.castle.yard.things) {
    const x = t.x, z = t.z, y = P.groundAt(x, z) - 0.15, c = Math.cos(t.rot), s = Math.sin(t.rot), q = t.seed;
    const at = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
    const box = (lx, ly, lz, hx, hy, hz, col, snow) => { const o = at(lx, ly, lz); S.box(o[0], o[1], o[2], hx, hy, hz, t.rot, col, snow); };
    if (t.kind === 'brazier') {
      S.round(x, y + 0.55, z, 0.45, 0.6, 0.5, 7, C_IRON, 0, { cap: true, capCol: C_DARK });
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + q * 6; S.beam([x + 0.55 * Math.cos(a), y, z + 0.55 * Math.sin(a)], [x + 0.32 * Math.cos(a), y + 0.6, z + 0.32 * Math.sin(a)], 0.08, 0.08, C_IRON, 0); }
    } else if (t.kind === 'wood') {
      // split wood stacked between two posts: three courses of logs lying across, their ends to the yard, snow on the top course
      for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) { const lx = -1.6 + k * 0.5 + (row % 2) * 0.25, ly = 0.24 + row * 0.42; S.log(at(lx, ly, -0.45), at(lx, ly, 0.45), 0.22, 0.2, 5, C_ROPE, row === 2 ? 0.95 : 0.1, C_TIMBER); }
      for (const e of [-2, 2]) S.beam(at(e, 0, 0), at(e, 1.8, 0), 0.16, 0.16, C_TIMBER, 0.3);
      for (let k = 0; k < 4; k++) S.log(at(-0.4 + k * 0.45, 0.22, 0.85), at(-0.4 + k * 0.45, 0.22, 1.6), 0.2, 0.18, 5, C_ROPE, 0.9, C_TIMBER);
    } else if (t.kind === 'barrels') {
      for (let k = 0; k < 5; k++) { const o = at(-1.1 + (k % 3) * 1.0 + (k > 2 ? 0.5 : 0), 0, k > 2 ? 0.95 : 0); S.round(o[0], o[1], o[2], 0.45, 0.45, 1.1 + 0.12 * ((k * 5 + Math.floor(q * 9)) % 3), 8, k % 2 ? C_TIMBER : C_HIDE, 0.9, { cap: true }); }
    } else if (t.kind === 'cart') {
      box(0, 1.05, 0, 0.85, 0.26, 1.3, C_TIMBER, 0.9);
      for (const e of [-1, 1]) {
        box(e * 0.85, 1.5, 0, 0.05, 0.2, 1.3, C_BLACK, 0.4);
        S.beam(at(e * 0.6, 1.0, 1.3), at(e * 0.6, 0.12, 2.5), 0.1, 0.1, C_TIMBER, 0.5);
        // a wheel of eight sides
        const hub = at(e * 1.04, 0.62, -0.1), inw = at(0, 0.62, -0.1);
        for (let k = 0; k < 8; k++) {
          const p = (a, w) => at(e * (1.04 + w * 0.06), 0.62 + 0.62 * Math.sin(a), -0.1 + 0.62 * Math.cos(a)), a0 = k * 0.7854, a1 = a0 + 0.7854;
          S.face(p(a0, -1), p(a1, -1), p(a1, 1), p(a0, 1), hub, C_BLACK, 0.3);
          S.face(p(a0, 1), p(a1, 1), hub, hub, inw, C_TIMBER, 0);
        }
      }
    } else {
      for (let k = -1; k <= 1; k++) {
        S.beam(at(k * 1.9, 0, 0), at(k * 1.9, 2.0, 0), 0.26, 0.26, C_TIMBER, 0);
        S.beam(at(k * 1.9 - 0.55, 1.45, 0), at(k * 1.9 + 0.55, 1.45, 0), 0.14, 0.14, C_TIMBER, 0.6);
        { const o = at(k * 1.9, 1.98, 0); S.round(o[0], o[1], o[2], 0.2, 0.15, 0.34, 6, C_ROPE, 0.5, { cap: true }); }
      }
    }
  }
}
export function gateInto(S, P) {
  const g = P.castle.gate, y0 = P.groundAt(0, g.z + 3) - 0.6, hw = g.w / 2, zf = (y) => faceZ(y) + 0.25;
  // the mouth of the tunnel: darkness set into the ice, a frame of great timbers, bars of iron before it
  S.hull([[-hw, y0, zf(y0) - 1], [hw, y0, zf(y0) - 1], [hw, y0, zf(y0)], [-hw, y0, zf(y0)], [-hw, y0 + g.h, zf(y0 + g.h) - 1], [hw, y0 + g.h, zf(y0 + g.h) - 1], [hw, y0 + g.h, zf(y0 + g.h)], [-hw, y0 + g.h, zf(y0 + g.h)]], C_DARK, 0);
  for (const sx of [-1, 1]) S.beam([sx * (hw + 0.3), y0, zf(y0) + 0.5], [sx * (hw + 0.3), y0 + g.h + 0.4, zf(y0 + g.h) + 0.5], 0.6, 0.7, C_BLACK, 0.3);
  S.beam([-hw - 0.9, y0 + g.h + 0.5, zf(y0 + g.h) + 0.5], [hw + 0.9, y0 + g.h + 0.5, zf(y0 + g.h) + 0.5], 0.7, 0.7, C_BLACK, 0.8);
  // its two leaves of iron bars stand open for the riders going out
  for (const sx of [-1, 1]) {
    const leaf = (t) => [sx * (hw - hw * 0.94 * t * 0.31), zf(y0) + 0.6 + hw * 0.94 * t * 0.95];
    for (let i = 0; i <= 5; i++) { const q = leaf(i / 5); S.beam([q[0], y0, q[1]], [q[0], y0 + g.h - 0.3, q[1]], 0.1, 0.1, C_IRON, 0); }
    for (let j = 1; j <= 4; j++) { const y = y0 + ((g.h - 0.3) * j) / 4.4, a = leaf(0), b2 = leaf(1); S.beam([a[0], y, a[1]], [b2[0], y, b2[1]], 0.12, 0.1, C_IRON, 0.3); }
  }
}

// the men in black: small, cloaked, hooded, faceless. Their horses: a barrel, a neck, a head, a tail; the legs swing apart
export function figureGeometry() {
  const S = new Solid(0);
  S.round(0, 0, 0, 0.36, 0.2, 1.42, 7, C_BLACK, 0);
  S.round(0, 1.36, 0, 0.21, 0.14, 0.36, 6, C_BLACK, 0, { cap: true });
  return S.geometry();
}
// a rider's cloak blowing: hinged at the shoulders (the origin), streaming along -z, wider toward its hem
export function capeGeometry() {
  const S = new Solid(0);
  S.hull([[-0.24, 0, 0], [0.24, 0, 0], [0.4, -0.12, -0.98], [-0.4, -0.12, -0.98], [-0.24, 0.05, 0], [0.24, 0.05, 0], [0.4, -0.07, -0.98], [-0.4, -0.07, -0.98]], C_BLACK, 0);
  S.hull([[-0.4, -0.12, -0.98], [0.4, -0.12, -0.98], [0.3, -0.28, -1.12], [-0.34, -0.25, -1.1], [-0.4, -0.07, -0.98], [0.4, -0.07, -0.98], [0.3, -0.23, -1.12], [-0.34, -0.2, -1.1]], C_BLACK, 0);
  return S.geometry();
}
export function horseGeometry() {
  const S = new Solid(0);
  S.hull([[-0.3, 0.95, -1.0], [0.3, 0.95, -1.0], [0.3, 0.95, 0.95], [-0.3, 0.95, 0.95], [-0.27, 1.6, -1.0], [0.27, 1.6, -1.0], [0.27, 1.62, 0.95], [-0.27, 1.62, 0.95]], C_HIDE);
  S.beam([0, 1.45, 0.8], [0, 2.02, 1.3], 0.24, 0.42, C_HIDE); S.beam([0, 2.05, 1.22], [0, 1.78, 1.72], 0.2, 0.26, C_HIDE); S.beam([0, 1.55, -1.0], [0, 0.9, -1.25], 0.1, 0.12, C_BLACK);
  return S.geometry();
}
export function legGeometry() { const S = new Solid(0); S.beam([0, 0.05, 0], [0, -1.0, 0], 0.13, 0.15, C_HIDE, 0); return S.geometry(); }
// THE MOUNDS OF SNOW AT THE TREES' FEET (round 4 mending 1), as one piece of the ground for each side of the wall: each
// is a low six-sided swell of the snow against a stem, uneven by its own place: a rim on the drawn ground (0.1 m under
// it), a ring 0.25 to 0.45 m out of the stem at about two thirds of its height, a ring inside the stem and its middle
// at its height (the plan's `up`) over the drawn ground under each point. It is drawn by the ground's own material
// with the floor's own shade (at each point of its rim, and its middle's within), so it is the same snow as the
// ground about it; its rim faces as the ground under it does. No point of it leaves the cylinder the plan tested.
export function* moundsSteps(P, list) {
  const n = 6, per = 3 * n + 1;
  const pos = new Float32Array(list.length * per * 3), nor = new Float32Array(list.length * per * 3), rel = new Float32Array(list.length * per), idx = new Uint32Array(list.length * n * 15);
  let q = 0;
  // (a face is wound to look up)
  const tri = (a, b, c) => {
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2], vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (ny < 0) { const s = b; b = c; c = s; nx = -nx; ny = -ny; nz = -nz; }
    idx[q++] = a; idx[q++] = b; idx[q++] = c;
    for (const k of [a, b, c]) { nor[k * 3] += nx; nor[k * 3 + 1] += ny; nor[k * 3 + 2] += nz; }
  };
  for (let m = 0; m < list.length; m++) {
    const t = list[m], b = m * per, top = t.y + t.h;
    const mid = floorShade(P, t.x, t.z);
    const put = (k, x, z, up, rim = false) => { pos[k * 3] = x; pos[k * 3 + 1] = clamp(P.drawnAt(x, z) + up, t.y, top); pos[k * 3 + 2] = z; rel[k] = rim ? floorShade(P, x, z) : mid; };
    for (let r = 0; r < 3; r++) for (let i = 0; i < n; i++) {
      const a = t.rot + ((i + 0.5 * r) / n) * 6.2832, u = Math.sin(t.x * 12.9898 + t.z * 78.233 + i * 37.7 + r * 91.3) * 43758.5453, w = u - Math.floor(u);
      const rr = r === 0 ? t.r * (0.84 + 0.16 * w) : r === 1 ? t.f + 0.25 + 0.2 * w : Math.max(0.7 * t.f, 0.05);
      put(b + r * n + i, t.x + rr * Math.cos(a), t.z + rr * Math.sin(a), r === 0 ? -0.1 : r === 1 ? t.up * (0.55 + 0.25 * w) : t.up, r === 0);
    }
    put(b + 3 * n, t.x, t.z, t.up);
    for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const j = (i + 1) % n, o = b + r * n, c = o + n; tri(o + i, o + j, c + i); tri(o + j, c + j, c + i); }
    for (let i = 0; i < n; i++) tri(b + 2 * n + i, b + 2 * n + (i + 1) % n, b + 3 * n);
    // (the rim faces as the ground under the mound does: the tilt of its six points' own heights)
    let ym = 0, sx = 0, sz = 0;
    for (let i = 0; i < n; i++) ym += pos[(b + i) * 3 + 1] / n;
    for (let i = 0; i < n; i++) { const k = b + i, dx = pos[k * 3] - t.x, dz = pos[k * 3 + 2] - t.z, q = (pos[k * 3 + 1] - ym) / (dx * dx + dz * dz); sx += q * dx; sz += q * dz; }
    for (let i = 0; i < n; i++) { const k = b + i; nor[k * 3] = -sx * 2 / n; nor[k * 3 + 1] = 1; nor[k * 3 + 2] = -sz * 2 / n; }
    if (m % 40 === 39) yield;
  }
  yield;
  for (let k = 0; k < nor.length; k += 3) { const l = 1 / (Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1); nor[k] *= l; nor[k + 1] *= l; nor[k + 2] *= l; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('aRelief', new THREE.BufferAttribute(rel, 1)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}
// a far pine: three tiers of five sides, each dark at its skirt and snowed toward its top (height 1; the instance gives its
// size). Its lowest tier's skirt comes down to its foot and under it (round 4 mending 1: it hung 0.06 of the tree's
// height over the foot, with no stem under it), so the tree stands in the snow wherever it is seen. Fifteen triangles.
export function farPineGeometry(more = 0, skirt = 0) {
  const dark = lin('#16302a'), pos = [], col = [], idx = [];
  // (more: how much more snow lies on its tops; skirt: the share of snow out on its skirts, more on one bough and less
  // on the next; the boughs of a tier reach out unevenly and droop: all by arithmetic on their number)
  const tier = (y0, r, h, yaw, snow) => {
    const b = pos.length / 3, sk = 0.8 + 0.6 * more;
    for (let i = 0; i < 5; i++) {
      const a = yaw + (i / 5) * 6.2832, u = Math.sin(i * 12.9898 + y0 * 78.233) * 43758.5453, w = u - Math.floor(u), rr = r * (0.75 + 0.38 * w);   // (never wider than the 0.24 of its height the plan tested it by)
      const ss = Math.min(1, skirt * (0.4 + 1.2 * w));
      pos.push(rr * Math.cos(a), y0 - 0.05 * w, rr * Math.sin(a)); col.push(lerp(dark[0] * sk, C_SNOW[0], ss), lerp(dark[1] * sk, C_SNOW[1], ss), lerp(dark[2] * (sk + 0.5 * more), C_SNOW[2], ss));
    }
    const sn = Math.min(1, snow + more);
    pos.push(0, y0 + h, 0); col.push(lerp(dark[0], C_SNOW[0], sn), lerp(dark[1], C_SNOW[1], sn), lerp(dark[2], C_SNOW[2], sn));
    for (let i = 0; i < 5; i++) idx.push(b + i, b + 5, b + ((i + 1) % 5));
  };
  tier(0, 0.21, 0.52, 0, 0.22); tier(0.34, 0.16, 0.4, 0.7, 0.36); tier(0.62, 0.1, 0.38, 0.3, 0.56);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
// THE LONG SHADOWS SOUTH OF THE WALL (round 4): a soft map of the ground, made once at build. Every spruce, far pine,
// tower and hall is laid down along the shadow's way from its own place: as long as its height and the sun's height make
// it (190 m at the most for a tree, 320 m for a tower), as wide as the thing is, drawn in to a point for a tree, darkest
// by its foot and paler toward its end, its edge soft (softer with distance). Where shadows cross the darker one counts.
// The map lies over the fine ground of the road and the castle, 0.62 m to a cell, in the plan's hand; the snow's shader
// reads it by the seen point's place (nothing of it follows the eye, the clock or the flight)
export function* shadeMapSteps(P) {
  const x0 = -186, x1 = 186, z0 = 14, z1 = P.zStart + 118, cell = 0.62, W = Math.ceil((x1 - x0) / cell), Hh = Math.ceil((z1 - z0) / cell), data = new Uint8Array(W * Hh);
  const el = Math.max(P.sunEl, 6) * Math.PI / 180, cot = 1 / Math.tan(el), l = Math.hypot(P.sunDir[0], P.sunDir[2]) || 1, sx = -P.sunDir[0] / l, sz = -P.sunDir[2] / l, rx = -sz, rz = sx, st = 0.42;
  const kx = W / (x1 - x0), kz = Hh / (z1 - z0);
  // a strip from (x, z) along the shadow's way, from a0 to len: half width w0 at its near end and w1 at its far end, dark d0 to d1
  const strip = (x, z, a0, len, w0, w1, d0, d1) => {
    for (let a = a0; a <= len; a += st) {
      const t = (a - a0) / Math.max(len - a0, 1e-3), hw = lerp(w0, w1, t), soft = 0.45 + 0.03 * a, dk = 255 * lerp(d0, d1, t) * (1 - smoothstep(0.8, 1, t)), cx = x + sx * a, cz = z + sz * a, in0 = Math.max(hw - soft, 0), wd = hw + soft;
      for (let b = -wd; b <= wd; b += st) {
        const i = Math.floor((cx + rx * b - x0) * kx), j = Math.floor((cz + rz * b - z0) * kz);
        if (i < 0 || j < 0 || i >= W || j >= Hh) continue;
        const ab = Math.abs(b), v = ab <= in0 ? dk : dk * (1 - smoothstep(in0, wd, ab)), q = j * W + i;
        if (v > data[q]) data[q] = v;
      }
    }
  };
  // (only what can throw its shadow into the map is laid down)
  const can = (x, z, len) => x > x0 - 8 && x < x1 + len + 8 && z > z0 - 8 && z < z1 + len + 8;
  const tree = (x, z, h, r) => { const len = Math.min(h * cot, 190); if (!can(x, z, len)) return; strip(x, z, 0, 0.14 * len, 0.4, 0.4, 0.62, 0.6); strip(x, z, 0.1 * len, len, r, 0.25, 0.86, 0.5); };
  let n = 0;
  for (const t of [...P.forest.sNear, ...P.forest.sMid]) { tree(t.x, t.z, CONIFER_H[t.v] * t.s, t.r); if (++n % 12 === 0 || n < 8) yield; }
  for (const t of P.forest.farS) { if (can(t.x, t.z, 190)) { tree(t.x, t.z, t.h, t.r * 0.9); if (++n % 12 === 0) yield; } }
  yield;
  for (const t of [...P.castle.towers, ...(P.holdfast.on ? [P.holdfast.tower] : [])]) { const h = t.h + (t.cap === 1 ? 0.9 * t.r : 0), len = Math.min(h * cot + t.r, 320); strip(t.x, t.z, -t.r, len, t.r, t.cap === 1 ? 0.5 * t.r : 0.9 * t.r, 0.92, 0.7); yield; }
  for (const h of P.castle.halls) {
    const c = Math.cos(h.yaw), s = Math.sin(h.yaw), w = Math.abs((s * rx + c * rz) * h.hl) + Math.abs((c * rx - s * rz) * h.hw), deep = Math.abs((s * sx + c * sz) * h.hl) + Math.abs((c * sx - s * sz) * h.hw);
    strip(h.x, h.z, -deep, (h.eave + 0.55 * h.rise) * cot + deep, w, 0.8 * w, 0.92, 0.7); yield;
  }
  if (P.waymark.on) strip(P.waymark.x, P.waymark.z, 0, P.waymark.h * cot, 0.8, 0.4, 0.85, 0.6);
  if (P.block.on) for (const q of P.block.pieces) if (q.big) strip(q.x, q.z, -q.hz, 1.5 * q.hy * cot + q.hz, q.hx, 0.8 * q.hx, 0.9, 0.7);
  yield;
  const tex = new THREE.DataTexture(data, W, Hh, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.unpackAlignment = 1; tex.needsUpdate = true;
  return { tex, box: [x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)], W, Hh, data };
}
// The lesser shadows (canonical hand): the dark about the foot of a tree or a stone where no sun reaches (which = 'north'), flat sheets on
// the wall's top behind its sheds, engines, cranes and standing sentries (which = 'top'; range as wallSet's).
export function shadowGeometry(P, which, range = null) {
  const pos = [], uv = [], sh = [], idx = [], g = P.groundAt, el = Math.max(P.sunEl, 6) * Math.PI / 180, cot = 1 / Math.tan(el);
  const l = Math.hypot(P.sunDir[0], P.sunDir[2]) || 1, sx = -P.sunDir[0] / l, sz = -P.sunDir[2] / l, rx = -sz, rz = sx;
  // a strip from (x, z) along the shadow's way: w wide (w1 at its end), len long, in steps of `step`, at height y(x, z)
  const strip = (x, z, w, w1, len, step, y, kind) => {
    const n = Math.max(1, Math.ceil(len / step)), b = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const t = i / n, cx = x + sx * len * t, cz = z + sz * len * t, hw = lerp(w, w1, t) / 2;
      for (const sd of [-1, 1]) { const px = cx + rx * hw * sd, pz = cz + rz * hw * sd; pos.push(px, y(px, pz), pz); uv.push(sd * 0.5 + 0.5, t); sh.push(kind); }
      if (i < n) { const a = b + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  if (which === 'north') {
    // in the wall's shade, where no sun throws a shadow: a soft dark on the snow about the foot of every tree of the
    // kit's that stands north of the wall (every great trunk, 4.2 m about it at size 1; every white tree, 3.0 m; every
    // great white tree, 6.5 m; every spruce of the wood about the way and of the belt, a fifth of its height), of every
    // block of broken ice at the wall's foot, every stone and every fallen trunk. The plain far pines and the stumps have
    // none. Each is a flat square sheet laid 0.3 m over the ground as it is drawn there (P.drawnAt)
    const yg = (x, z) => P.drawnAt(x, z) + 0.3, foot = (x, z, r) => strip(x - sx * r, z - sz * r, 2 * r, 2 * r, 2 * r, r, yg, 3);
    for (const t of P.forest.trunks) foot(t.x, t.z, 4.2 * t.s);
    for (const t of P.forest.white) foot(t.x, t.z, 3.0 * t.s);
    for (const t of P.forest.nNear) foot(t.x, t.z, 0.2 * CONIFER_H[t.v] * t.s);
    for (const t of P.forest.nMid) foot(t.x, t.z, 0.2 * CONIFER_H[t.v] * t.s);
    for (const t of P.great) foot(t.x, t.z, 6.5);
    // (round 3: the young spruces of the belt, the broken ice at the wall's foot, the stones and the fallen trunks)
    for (const t of P.forest.belt) foot(t.x, t.z, 0.2 * CONIFER_H[t.v] * t.s);
    for (const b of P.footIce) foot(b.x, b.z, b.size * 1.5);
    for (const r of P.rocks) {
      if (r.stump) continue;
      if (r.log) { const c = Math.cos(r.rot), sn = Math.sin(r.rot); for (const l of [-2.6, 1.6]) foot(r.x + l * c, r.z - l * sn, 2.5); } else foot(r.x, r.z, r.size * (r.belt ? 2.4 : 1.7));
    }
  } else {
    const yt = () => WALL_H + 0.45, inR = (x) => !range || (x > range[0] + 6 && x < range[1] - 6);
    const cast = (x, z, w, h, w1 = w) => strip(x, z, w, w1, Math.min(h * cot / 0.8, 60), 100, yt, 1);
    for (const t of P.top.things) {
      if (!inR(t.x)) continue;
      if (t.kind === 'shed') cast(t.x, t.z, 2 * (t.hx ?? 2.2), 3.2);
      else if (t.kind === 'engine') { cast(t.x, t.z, 5.2, 6.4, 1.6); cast(t.x, t.z - 2.4, 1.0, t.tip ?? 14, 0.7); }
      else if (t.kind === 'crane') { cast(t.x, t.z, 1.1, 10.4, 0.8); cast(t.x, t.z - 0.4, 1.6, 2.2); }
      else if (t.kind === 'fire') cast(t.x, t.z, 1.5, 1.0);
      else if (t.kind === 'store') cast(t.x, t.z, 2.6, 1.3);
    }
    for (const q of P.top.sentries) if (inR(q.x)) cast(q.x, q.z, 0.8, 1.85, 0.6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  geo.setAttribute('aSh', new THREE.BufferAttribute(new Float32Array(sh), 1)); geo.setIndex(idx);
  return geo;
}
// a sheet for fire (centred, upright) and one for blown snow (from 0 to 1 along its stream)
export function sheetGeometry(stream) {
  const g = new THREE.BufferGeometry(), x0 = stream ? 0 : -0.5, x1 = stream ? 1 : 0.5;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0, -0.5, 0, x1, -0.5, 0, x1, 0.5, 0, x0, 0.5, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
// many of one thing: list[i] gives its matrix through set(i, m, item); extra (a per-thing attribute) is filled by fill(i, item, array)
export function instanced(geo, mat, list, set, extra = null) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1)), m = new THREE.Matrix4();
  mesh.count = list.length;
  let arr = null; if (extra) { arr = new Float32Array(Math.max(list.length, 1) * extra.size); geo.setAttribute(extra.name, new THREE.InstancedBufferAttribute(arr, extra.size)); }
  for (let i = 0; i < list.length; i++) { set(i, m, list[i]); mesh.setMatrixAt(i, m); if (extra) extra.fill(i, list[i], arr); }
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return mesh;
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();
export function matAt(m, x, y, z, yaw, sx, sy = sx, sz = sx, pitch = 0) { _e.set(pitch, yaw, 0, 'YXZ'); _q.setFromEuler(_e); return m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)); }
// a sheet of blown snow from o along a (its length in it) and across b (its width in it)
export function veilMat(m, o, a, b) {
  const nx = a[1] * b[2] - a[2] * b[1], ny = a[2] * b[0] - a[0] * b[2], nz = a[0] * b[1] - a[1] * b[0], l = Math.hypot(nx, ny, nz) || 1;
  return m.set(a[0], b[0], nx / l, o[0], a[1], b[1], ny / l, o[1], a[2], b[2], nz / l, o[2], 0, 0, 0, 1);
}
// the plan's sheets of blown snow, all of them or those of one stretch of the wall
export function veilList(P, range = null) { return P.veils.filter((v) => !range || (v.kind !== 2 && !v.off && v.x > range[0] + 20 && v.x < range[1] - 20)); }

// ---------------------------------------------------------------------------------------------------------------------
// the wall put together: faces, top, stair, cage, what stands on the top, fires, blown snow, the men (canonical hand; the
// caller mirrors the group). range = [x0, x1] makes one stretch of it only (the set-piece viewer's)
// ---------------------------------------------------------------------------------------------------------------------
export function* wallSet(P, U, M, range = null) {
  const H = WALL_H, group = new THREE.Group(), geos = [];
  const add = (mesh) => { group.add(mesh); geos.push(mesh.geometry); return mesh; };
  const w = yield* wallSteps(P, range);
  add(new THREE.Mesh(w.south, M.ice)); add(new THREE.Mesh(w.north, M.ice)); add(new THREE.Mesh(w.top, M.top));
  yield;
  const inR = (x) => !range || (x > range[0] + 4 && x < range[1] - 4);
  const S = new Solid(), S2 = new Solid();
  const stairOn = inR(P.stair.x - P.stair.hw - 3) && inR(P.stair.x + P.stair.hw + 3);
  if (stairOn) for (let k = 0; k < P.stair.n; k++) { stairInto(S, P, k, k + 1); yield; }
  // the lantern at each landing: an iron lamp on its post
  if (stairOn) for (const l of P.stair.lanterns) { S.beam([l[0], l[1] - 2.3, l[2]], [l[0], l[1] - 0.2, l[2]], 0.12, 0.12, C_TIMBER, 0); S.box(l[0], l[1], l[2], 0.17, 0.22, 0.17, 0, C_IRON, 0); }
  const cageOn = P.cage.ok && inR(P.cage.x);
  if (cageOn) cageRailsInto(S, P);
  yield;
  // the small things on the ice (the whole world only: the set piece shows the stair's stretch)
  if (!range) for (let i = 0; i < P.faceThings.length; i += 6) { faceInto(S, P, i, i + 6); yield; }
  add(new THREE.Mesh(S.geometry(), M.built));
  yield;
  for (let i = 0; i < P.top.things.length; i += 3) { topInto(S2, P, range, i, i + 3); yield; }
  add(new THREE.Mesh(S2.geometry(), M.built));
  yield;
  // the low edge of piled ice along both lips
  if (!range) {
    const pb = []; for (let i = 0; i < P.top.parapet.length; i += 12) { parapetList(P, i, i + 12, pb); yield; }
    add(instanced(iceBlockGeometry(), M.solid, pb, (i, m, b) => matAt(m, b.x, b.y, b.z, b.yaw, b.sx, b.sy, b.sz, b.pitch)));
    yield;
  }
  // the cage and its chain
  const cage = add(new THREE.Mesh(cageGeometry(), M.solid)), chain = add(new THREE.Mesh(chainGeometry(), M.solid));
  cage.visible = chain.visible = cageOn; cage.frustumCulled = chain.frustumCulled = false;
  // fires: the flame, the pool of light under it; the far ones as beads
  const fl = [];
  for (const t of P.top.things) if (t.kind === 'fire' && inR(t.x)) fl.push({ x: t.x, y: H + 0.95, z: t.z, a: [2.3, t.seed, 0] }, { x: t.x, y: H + 0.32, z: t.z, a: [10, t.seed, 1] }, { x: t.x, y: H + 1.6, z: t.z, a: [5, t.seed, 2] });
  // the stair's lanterns (each lights the ice and the timber about it: the shaders' face list); the lantern that hangs
  // under the beak of the crane that winches the cage is ONLY A GLOW (it hangs over the drop and lights nothing)
  if (stairOn) P.stair.lanterns.forEach((l, i) => fl.push({ x: l[0], y: l[1] - 0.7, z: l[2], a: [1.0, (i * 0.37) % 1, 3] }));
  if (cageOn) fl.push({ x: P.cage.x, y: H + 10.6, z: 13.4, a: [1.9, 0.5, 3] });
  if (!range) for (const b of P.top.beads) fl.push({ x: b[0], y: H + 2.2, z: b[2], a: [8, (b[0] * 0.013) % 1, 2] }, { x: b[0], y: H + 0.32, z: b[2], a: [10, (b[0] * 0.013) % 1, 1] });
  const flames = add(instanced(sheetGeometry(false), M.flame, fl, (i, m, f) => m.makeTranslation(f.x, f.y, f.z), { name: 'aFl', size: 3, fill: (i, f, arr) => arr.set(f.a, i * 3) }));
  flames.renderOrder = 3;
  const shadows = add(new THREE.Mesh(shadowGeometry(P, 'top', range), M.shade)); shadows.renderOrder = -2;
  yield;
  const vl = veilList(P, range);
  const veils = add(instanced(sheetGeometry(true), M.veil, vl, (i, m, v) => veilMat(m, v.o, v.a, v.b), { name: 'aV', size: 4, fill: (i, v, arr) => arr.set(v.aV, i * 4) }));
  veils.renderOrder = 2;
  yield;
  // the men: sentries at the fires (still), sentries pacing a beat, men on the stair, two in the cage
  const sentries = P.top.sentries.filter((s) => inR(s.x)), pacers = P.top.pacers.filter((s) => inR(s.x)), climbers = P.stair.ok && inR(P.stair.x) ? P.climbers : [];
  const men = [...sentries.map((s) => ({ k: 0, s })), ...pacers.map((s) => ({ k: 1, s })), ...climbers.map((s) => ({ k: 2, s })), ...(cageOn ? [{ k: 3, s: -0.4 }, { k: 3, s: 0.45 }] : [])];
  const figures = add(instanced(figureGeometry(), M.solid, men, (i, m, f) => (f.k === 0 ? matAt(m, f.s.x, H + 0.02, f.s.z, f.s.face, 1.22) : m.makeScale(0, 0, 0))));
  const m4 = new THREE.Matrix4(), c3 = [0, 0, 0], st4 = [0, 0, 0, 0], up = new THREE.Vector3(0, 1, 0), dv = new THREE.Vector3();
  const total = P.stair.ok ? stairAt(P, 0, st4) : 1;
  const update = (time) => {
    cageAt(P, time, c3);
    cage.position.set(c3[0], c3[1], c3[2]);
    // the chain from the cage's bail to the block at the crane's beak
    dv.set(0, H + 12 - (c3[1] + 3.3), 14.1 - c3[2]);
    const len = dv.length(); chain.position.set(c3[0], c3[1] + 3.3, c3[2]); chain.quaternion.setFromUnitVectors(up, dv.multiplyScalar(1 / len)); chain.scale.set(1, len, 1);
    for (let i = sentries.length; i < men.length; i++) {
      const f = men[i];
      if (f.k === 1) {
        const p = f.s, cyc = (time * 0.9) / p.len + p.ph * 2, t = cyc - Math.floor(cyc), tri = t < 0.5 ? t * 2 : 2 - t * 2;
        matAt(m4, p.x + (smoothstep(0, 1, tri) - 0.5) * (p.len - 1.2), H + 0.02, p.z, t < 0.5 ? 1.5708 : -1.5708, 1.22);
      } else if (f.k === 2) {
        const cyc = (time * f.s.sp) / total + f.s.ph * 2, t = (cyc - Math.floor(cyc / 2) * 2), s = (t < 1 ? t : 2 - t) * total;
        stairAt(P, s, st4);
        matAt(m4, st4[0], st4[1], st4[2], (t < 1 ? 1 : -1) * st4[3] * 1.5708, 1.2);
      } else matAt(m4, c3[0] + f.s, c3[1] + 0.12, c3[2] + f.s * 0.5, 0, 1.15);
      figures.setMatrixAt(i, m4);
    }
    figures.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { group, update, geos, counts: { fires: fl.length, veils: vl.length, men: men.length } };
}

// the set piece alone: three hundred metres of the wall about its stair, with the cage, the top and the men on it
export async function buildHero(ctx, opts = {}) {
  const seed = opts.seed ?? ctx.seed;   // the caller's seed: there is no seed of the part's own
  const it = icePlanSteps(seed, opts.vary || ctx.vary || {}); let r = it.next();
  while (!r.done) { await ctx.yield?.(); r = it.next(); }
  const P = r.value, U = makeUniforms(P), M = makeMaterials(U);
  U.uFogDen.value = 0.0006;
  const range = [P.stair.x - 150, P.stair.x + 150];
  const ws = wallSet(P, U, M, range); let q = ws.next();
  while (!q.done) { await ctx.yield?.(); q = ws.next(); }
  const set = q.value, object = new THREE.Group(), yb = P.stair.yb;
  set.group.position.set(-P.stair.x, -yb, 0);
  object.add(set.group); object.scale.x = P.hand;
  return {
    object, radius: 120, height: WALL_H - yb, center: new THREE.Vector3(0, (WALL_H - yb) * 0.5, 0), groundY: 0, plan: P,
    anchors: { stairFoot: new THREE.Vector3(0, 0, faceZ(yb) + 4), lip: new THREE.Vector3(0, WALL_H - yb, 7), cage: new THREE.Vector3((P.cage.x - P.stair.x) * P.hand, 20, faceZ(20) + 4.7) },
    update(dt, time) { U.uTime.value = time; U.uCloudOff.value = time * P.cloudSpeed * 0.0017; set.update(time); },
    dispose() { for (const g of set.geos) g.dispose(); for (const k in M) M[k].dispose(); for (const k in P.trees) for (const g of P.trees[k]) g.dispose(); },
  };
}
