// Sophronia, the Fair That Stays (Invisible Cities, Italo Calvino, 1923 to 1985): the hero set piece and the makers.
//
// A city of two halves on a plain. One half is a great fair (a lattice wheel of small open cages, a white timber
// switchback, a chain swing, swing boats, a riders' drum, a great tent), rooted like an old town;
// the other is an old town of limestone and marble that is being taken away, piece by piece, on road wagons.
//
// THE STONE HALF STANDS IN THE AIR: every stone building, the obelisk, the urns, the tanks, the standing chimney
// and the gas standards stand 1.2 to 1.8 m clear on CRIB STACKS of pale timber with A SHORT PALE BEARER over each
// stack (bearerInto) and a pale sole plate round each plinth's foot, open air between; nothing under it is a dark
// slab. Steps end short of the ground on jacks with a timber ramp. It is a standing state: no law moves any of it.
// THE SENTENCE WITHOUT THE BOOK:
//   ONE PALACE STANDS HALF TAKEN DOWN by the square (palaceDownInto): taken apart, not broken; its own top set
//   down beside it in its yard (yardInto);
//   THE WORKS ARE COLD: no smoke anywhere; their one chimney stands cold on its skids (edgeInto);
//   LIFTING EYES are small iron eyes on bolted plates with a rope sling, in pairs at lifting points only
//   (ringsInto, the unit shape `ring`); the obelisk stands in a timber cradle with rope slings (obeliskInto);
//   WHERE A BUILDING HAS GONE ITS PLAN IS LEFT (lotInto): one closed outline of low dark bearers along its
//   walls' lines, its doorstep on jacks at the street's edge, THE FLOOR IT LEAVES room by room in warm tones
//   (boards, tiles, kitchen flags: paintGround), a hearth stone, a cellar hatch, three low lanterns at the kerb,
//   one or three of its own pieces on cribs waiting on that floor (planStreet), and its street: kerb, pavement,
//   gas standards, a tub with a clipped ball either side of the doorstep, a dry trough, a bench, bollards;
//   THE WAY OUT is a narrow rutted lane (laneMesh: true relief) with ROAD WAGONS on spoked wheels standing
//   singly along it (trailerInto, wheelInto), every drawbar pointing away from the town, each with one great
//   piece of this town (the loads' makers); beyond stands the caravan (caravanInto);
//   THE FAIR IS OLD AND ROOTED and stands close by the lane from the first frame: a hedged close with a gate
//   under a hoop of lamps, old limes hung with lamps, festoons, booths, six swing boats behind the hedge
//   (planDress, planBoats, pleasureInto, boatsInto), great swing boats at its north-east corner, ALONG THE SEAM
//   BESIDE THE LEFT STREET A LIT BAND (planSeam: tall old limes ringed with lamps in a chase, festoons from
//   tree to tree, four masts with pennants and festoons, two booths), pleasure
//   grounds of lamp-lined walks round three round points, and round the swing a hedged garden of beds in
//   flower, raked walks and festoons (gardenInto). Nothing of the fair is on wheels.
// NO FLAG is banded or charged: see flagsInto. The far plain is land: fields in strips, hedge lines and hedgerow
// trees, a far road (planFields, plainInto, paintFields); by the lane it is a summer meadow.
// THE WORLD'S OWN HOUR IS DUSK, and the fair is lit by its lamps. From under EVERY lifted building hang STORM
// LANTERNS (about one every 6 m, steady, of one plain colour: skidsInto), one stands at every wagon's load and at
// every emptied lot. The stone half's lights are of these two kinds only: single plain lanterns and sparse gas
// standards; strings and many small lamps are the fair's alone. No light is made for any of this: the lanterns'
// and lamps' wash on what stands by them, and the last sun's on the stone half's cornices, pediments, dome and
// obelisk (AFTER), is baked by place (the kit's flood); their pools on the ground are painted by place
// (groundSheet); on the gallery's boards they are a flat mesh by place (makePoolMesh).
// A FILTER BY A PIXEL'S FOOTPRINT, the one thing here that takes the eye (makeLampField; the fireworks' sparks
// take the very same: makeFireField): a lamp smaller on the picture than two pixels is drawn at two pixels and
// its brightness is scaled by its own area over the drawn area, so it gives no more light than its own. The
// lamps and the sparks take the scene's own haze by the scene's own figure, as every body does; the far plain's
// disc takes no more than a share of it at dusk (groundSheet). Nothing else reads the eye: the kit's flowers are
// drawn without the kit's fade by distance, and no dust is drawn.
//
// HOW THE PLACE IS MADE. planHead(seed, vary) and PLAN_STEPS are arithmetic only: they lay the two halves, the route
// and every mover's law in the plan's own frame, so the same plan is replayed under node for the camera and the
// clearances.
// THE FRAME: z runs along the seam (the entry end at +z); d is metres across it, the fair at d < 0 and the stone
// half at d > 0 (the fair's close by the lane lies north of the town's edge, on the lane's fair hand); the
// world's x is hand * d (the hand is the seed's). Heights are metres over the plain (y = 0).
//
// WHAT MOVES, AND BY WHAT (every law below takes the world's clock and the plan's numbers, which are the seed's;
// none takes u, the metres flown, the lens's place, our nearness to anything or a share of the flight):
//   wheelAngle(P, t)        the wheel's turn: a constant rate, never stopping
//   cagePose(P, i, t, out)  a cage on its pin: level, rocking a little on a phase of its own
//   swingPose(P, i, t, out) a seat of the chain swing: flung out by the turn, the crown tilting in a slow wave
//   trainS(P, k, t)         a train's metres along the closed track: slow on the climbs, quick over the rises
//   trackAt(P, s, out)      the track's own line, tangent and bank at s (the cars and the rails share it)
//   trapezeAngle(P, i, t)   a trapeze's swing
//   boatAngle(P, row, i, t) a swing boat's swing on its rods: empty, on a phase and a period of its own
//   fireAge(P, k, t), fireSpark(P, k, i, t, out)   a rocket's age in the even loop of 40 s, and a spark's place
//                           and light (the same law is written in the sparks' own vertex code: makeFireField)
//   and, by the clock alone in their own materials: the fair's lamps' chase and small flicker (the seam band's
//   lamps in a deeper chase of long runs, each ring and swag from a place of its own), the lanterns' and
//   gas flames' slow breath, each on a phase of its own (makeLampField), the cloth's wave
//   (makeClothMaterial), the leaves' sway (the kit's wind, the world file). The pools on the ground and the baked
//   wash on the walls are still: nothing pulses in unison.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { SURF, makeBuilder } from '../kit/structures.js';
import * as flora from '../kit/flora.js';

export const DURATION = 49;
const TAU = Math.PI * 2, DEG = Math.PI / 180;
// every stream of the world, by name: each is made from the world's seed and its name and draws from no other
// (a group of things that was added later, or whose number the route decides, has a stream of its own, so that it
// deals no other group anew: fronts, square, town, edge, wing, west, avenue, seam, fore, lawn, palace, pleasure,
// garden). Only streams that are drawn from are made. A few more are made by name where they are used, in the
// same way (the seed and a name): the limes' shapes, cribs, sleepers, movers, fields, plain, paint, detail and
// meadow here; ivy, bedsnew, the tufts' and the meadow's sets in the world file.
const STREAMS = ['lay', 'sky', 'track', 'trains', 'wheel', 'swing', 'tent', 'stone', 'plots', 'trailers', 'booths', 'trees',
  'lamps', 'beds', 'ground', 'far', 'fronts', 'square', 'town', 'edge', 'wing', 'west', 'avenue', 'seam', 'tufts',
  'fore', 'lawn', 'boats', 'fire', 'caravan', 'road', 'lane', 'palace', 'pleasure', 'garden'];

// ---------------------------------------------------------------- the plan's head: the hand, the sizes, the places
export function planHead(seed, vary = {}) {
  const R = {}; for (const n of STREAMS) R[n] = makeRng(hashSeed('half-city-of-the-fair:' + n + ':' + seed));
  const r = R.lay;
  const P = { seed, R, hand: r() < 0.5 ? -1 : 1 };
  const hint = vary.hour;
  // the world's own hour is DUSK, the last minutes of sun, one standing minute for the whole flight; a visit's
  // hint shows the same place at that hour
  P.hour = hint === 'day' || hint === 'night' || hint === 'dawn' ? hint : 'dusk';
  P.density = clamp(vary.density ?? 1, 0.7, 1.3);
  P.rare = !!vary.rare;
  // the wheel: its size, its cages, the heading of its plane (from +d toward +z), which way it turns
  // (the plane is turned 33 to 37 degrees from the seam's cross line, so that the gallery heads north-east and the
  // arc of headings the line never takes is 123 to 127 degrees wide: room for the sun 60 degrees and more from every gaze)
  const W = P.wheel = { R: r.range(31.5, 35), n: r.int(18, 22), phi: r.range(33, 37) * DEG, d: -99 + r.range(-3, 3), z: 100 + r.range(-4, 4), turn: r() < 0.5 ? -1 : 1, rate: r.range(0.078, 0.092), a0: r.range(0, TAU) };
  W.hubY = W.R + 6.5;
  // The low sun (and at night the moon, by the same bearing). The line heads south, west, north and at last
  // north-east along the gallery (heading phi), and never between that last heading and south; no gaze is pulled
  // into that arc either. The sun stands exactly in its middle: 61.5 to 63.5 degrees from either end of it.
  // sunAz runs from +d toward +z.
  P.sunEl = r.range(2, 5);
  P.sunAz = (W.phi - Math.PI / 2) / 2;
  P.windA = r.range(0, TAU); P.haze = r.range(0, 1);
  // the stone half: where its emptied corner ends (z) and how wide the plots lie (d); dome and chimney
  P.edgeZ = 190 - r.range(48, 105); P.plotD = 116;
  // the stone street's middle: the plain road runs straight into it. zTown: the town's edge, where the lane runs
  // into the street; paveW: the outer edge of the street's west pavement, metres west of its middle
  P.DS = 48; P.zTown = 226; P.paveW = 8.5;
  P.domeH = r.range(40, 46); P.chimH = r.range(46, 52); P.nTrailers = r.int(8, 10);
  // the fair: where the midway, the swing, the drum and the tent stand
  P.DM = -100; P.RS = 24; P.DA = P.DM - 2 * P.RS; P.ZC = -25 + r.range(-4, 4);
  P.swing = { d: P.DM - P.RS, z: -115 + r.range(-5, 5) };
  P.tent = { d: P.DA - 36, z: -78 + r.range(-5, 5), r: 26, h: 22 };
  // (the drum stands by the avenue's start, 40 m north of the swing's axis and 30 m east of the avenue's line:
  // south of the crossing's line, 100 m and more from the wheel's tower)
  P.drum = { d: P.DM - 18, z: P.swing.z + 40 + r.range(-2, 2), r: 8, h: 9 };
  // the frame: a place (d, z) to the world's x, z; a heading (from +d toward +z) to a unit [x, z]
  P.X = (d) => P.hand * d;
  P.at = (d, y, z) => [P.hand * d, y, z];
  P.dir = (a) => [P.hand * Math.cos(a), Math.sin(a)];
  return P;
}

// ---------------------------------------------------------------- the wheel's gallery and the route
// The line is laid first; every mover is then placed clear of it by rule (see the world file's head).
export function planRoute(P) {
  const W = P.wheel, c = Math.cos(W.phi), s = Math.sin(W.phi);
  // e runs along the wheel's plane, nrm is its axle toward the gallery's side (the city's side), both in (d, z)
  W.e = [c, s]; W.nrm = [s, -c];
  // the gallery's line lies 11.4 m from the wheel's middle plane (8.3 m from everything that turns), the lens
  // 1.5 m over the hub's height
  W.off = 11.4; W.galY = W.hubY + 1.5;
  // the ring stands where the rim crosses the hub's height. THE RISING ARC is a right-hand turn of 40 m radius,
  // tangent to the avenue (d = DA, heading +z) and to the gallery's line: it comes onto that line at sJ, 73 to
  // 90 m before the ring (the seed's wheel decides), so the lens is level with the hub and 11.4 m from the plane
  // when the rim's near end and its cages pass, 13 m and more before the hub
  W.sEnd = W.R + 1;
  W.gal = (q, o = W.off) => [W.d + W.nrm[0] * o + W.e[0] * q, W.z + W.nrm[1] * o + W.e[1] * q];
  const Ra = 40; W.sJ = (P.DA + Ra * (1 - W.nrm[0]) - W.d - W.nrm[0] * W.off) / W.e[0];
  const J = W.gal(W.sJ), C = [J[0] + W.nrm[0] * Ra, J[1] + W.nrm[1] * Ra], tau1 = Math.PI / 2 - W.phi;
  P.arc = { Ra, C, tau1, J };
  const pts = [], add = (d, y, z) => pts.push(P.at(d, y, z));
  // the carters' lane runs straight into the stone street (d = DS). The line begins 90 m before the plots' head
  // (z = 286) and flies level at 4.6 m, the middle height of the loads on the standing wagons and of the swing
  // boats' sweep, along the lane, between the emptied plots and down the street's first part; it climbs to the
  // column heads only before the bank
  const zs = P.edgeZ + 4, yRoad = P.yRoad = 4.6, yLow = P.yLow = 4.6, zIn = P.zIn = 286;
  // THE CARTERS' LANE's own middle at z (metres across the plan): a narrow lane that wanders a little either
  // side of the line from the plain to the town's edge (z 226), where it runs straight into the left street;
  // behind the entry it straightens again before it bends away (planTrailers: the road's knots). The seed's phase.
  P.lanePh = P.R.lane.range(0, TAU); P.laneW = 3.2;
  P.laneD = (z) => { const e = smoothstep(196, P.zTown, z); return P.DS + 0.8 * e + 1.8 * e * (1 - smoothstep(278, 300, z)) * Math.sin(z / 22 + P.lanePh); };
  add(P.DS, yRoad, zIn); add(P.DS, yRoad, zIn - 23); add(P.DS, yRoad, zIn - 46); add(P.DS, yRoad, zIn - 69);
  for (let k = 1; k <= 4; k++) { const t = k / 5; add(P.DS, lerp(yRoad, yLow, smoothstep(0, 1, t)), lerp(zIn - 69, zs, t)); }
  add(P.DS, yLow, zs);
  // down the street: low past the cribs for its first part, then rising to the column heads before the bank,
  // to where the turn into the square begins
  const Rt = 40, zt = P.ZC + Rt, ns = Math.max(3, Math.ceil((zs - zt) / 24)), zUp = P.zUp = P.ZC + 30 + 66;
  for (let k = 1; k <= ns; k++) { const z = lerp(zs, zt, k / ns); add(P.DS, lerp(yLow, 10.5, 1 - smoothstep(zUp - 44, zUp, z)), z); }
  // the turn across the square toward the seam
  P.turn = { d: P.DS - Rt, z: zt, r: Rt };
  for (const a of [15, 30, 45, 60, 75, 90]) add(P.DS - Rt + Rt * Math.cos(a * DEG), lerp(10.5, 9, a / 90), zt - Rt * Math.sin(a * DEG));
  // across the seam and under the switchback's two runs
  add(-10, 8.4, P.ZC); add(-30, 8, P.ZC); add(-48, 8, P.ZC);
  // the turn down the midway
  const Rm = P.Rm = 34, mc = [P.DM + Rm, P.ZC - Rm];
  for (const a of [0, 15, 30, 45, 60, 75, 90]) add(mc[0] - Rm * Math.sin(a * DEG), 8, mc[1] + Rm * Math.cos(a * DEG));
  // down the midway to the swing, rising to the height of its flying seats
  const SW = P.swing, RS = P.RS, ySw = 13.5, z0 = mc[1], nm = Math.max(2, Math.ceil((z0 - SW.z) / 24));
  for (let k = 1; k < nm; k++) add(P.DM, lerp(8, ySw, smoothstep(0, 1, k / nm)), lerp(z0, SW.z, k / nm));
  // round the swing, 24 m from its axis: 8.7 m and more beyond the widest reach of its seats
  SW.routeR = RS; SW.routeY = ySw;
  for (const a of [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]) add(SW.d + RS * Math.cos(a * DEG), ySw, SW.z - RS * Math.sin(a * DEG));
  // up the avenue past the tent and the drum, and the rising turn beside the wheel
  const la = C[1] - SW.z, Lr = la + Ra * tau1, ease = (t) => t * t * (3 - 2 * t), yAt = (m) => ySw + (W.galY - ySw) * ease(clamp(m / Lr, 0, 1));
  const na = Math.max(2, Math.ceil(la / 24));
  for (let k = 1; k <= na; k++) add(P.DA, yAt(la * k / na), lerp(SW.z, C[1], k / na));
  const nr = Math.max(3, Math.ceil(tau1 / (15 * DEG)));
  for (let k = 1; k <= nr; k++) { const t = tau1 * k / nr; add(C[0] - Ra * Math.cos(t), yAt(la + Ra * t), C[1] + Ra * Math.sin(t)); }
  // level and straight along the gallery to the ring
  for (let k = 1; k <= 5; k++) { const g = W.gal(lerp(W.sJ, W.sEnd, k / 5)); add(g[0], W.galY, g[1]); }
  const path = P.path = makePath(pts), L = P.L = path.length;
  // the line at every half metre, and a grid over it, for every test of clear air
  const n = P.n = Math.ceil(L / 0.5) + 1, S = P.line = new Float32Array(n * 3), v = new THREE.Vector3(), cell = 8, grid = P.grid = new Map();
  for (let i = 0; i < n; i++) {
    path.posAtDist(Math.min(L, i * 0.5), v); S[i * 3] = v.x; S[i * 3 + 1] = v.y; S[i * 3 + 2] = v.z;
    const k = Math.floor(v.x / cell) + ':' + Math.floor(v.z / cell); let g = grid.get(k); if (!g) grid.set(k, g = []); g.push(i);
  }
  // the least distance from a point to the line (searched out to max metres; max + 1 where nothing is that near)
  P.gap = (x, y, z, max = 16) => {
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell), rc = Math.ceil(max / cell); let best = (max + 1) * (max + 1);
    for (let a = cx - rc; a <= cx + rc; a++) for (let b = cz - rc; b <= cz + rc; b++) {
      const g = grid.get(a + ':' + b); if (!g) continue;
      for (const i of g) { const dx = S[i * 3] - x, dy = S[i * 3 + 1] - y, dz = S[i * 3 + 2] - z, q = dx * dx + dy * dy + dz * dz; if (q < best) best = q; }
    }
    return Math.sqrt(best);
  };
  // the same for a straight member from a to b (sampled every 0.5 m), and for a place in the plan's frame
  P.gapSeg = (a, b, max = 16) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), m = Math.max(1, Math.ceil(len / 0.5)); let best = max + 1;
    for (let i = 0; i <= m; i++) { const t = i / m, g = P.gap(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), max); if (g < best) best = g; }
    return best;
  };
  P.gapD = (d, y, z, max = 16) => P.gap(P.hand * d, y, z, max);
  // the line's distance in plan (x, z only), for things that stand from the ground up to any height
  P.gapXZ = (x, z, max = 16) => {
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell), rc = Math.ceil(max / cell); let best = (max + 1) * (max + 1), by = 0;
    for (let a = cx - rc; a <= cx + rc; a++) for (let b = cz - rc; b <= cz + rc; b++) {
      const g = grid.get(a + ':' + b); if (!g) continue;
      for (const i of g) { const dx = S[i * 3] - x, dz = S[i * 3 + 2] - z, q = dx * dx + dz * dz; if (q < best) { best = q; by = S[i * 3 + 1]; } }
    }
    return { dist: Math.sqrt(best), y: by };
  };
  return P;
}

// ---------------------------------------------------------------- the switchback: its closed track and the trains' law
// Two long runs parallel to the seam (the east one runs away from the entry, the west one back), joined by two
// half-round turns. s is metres along the closed loop from the north end of the east run.
export function planTrack(P) {
  const r = P.R.track, T = P.track = { dE: -38, dW: -68, rT: 15, zN: 46, zS: -166 };
  const Ls = T.zN - T.zS, La = Math.PI * T.rT, LT = T.LT = 2 * Ls + 2 * La, mid = (T.dE + T.dW) / 2;
  T.Ls = Ls; T.La = La;
  // the plan (d, z) and the heading's unit at s
  T.plan = (s0, out) => {
    const s = ((s0 % LT) + LT) % LT;
    if (s < Ls) { out[0] = T.dE; out[1] = T.zN - s; out[2] = 0; out[3] = -1; out[4] = 0; return out; }
    if (s < Ls + La) { const a = (s - Ls) / T.rT; out[0] = mid + T.rT * Math.cos(a); out[1] = T.zS - T.rT * Math.sin(a); out[2] = -Math.sin(a); out[3] = -Math.cos(a); out[4] = 1; return out; }
    if (s < 2 * Ls + La) { out[0] = T.dW; out[1] = T.zS + (s - Ls - La); out[2] = 0; out[3] = 1; out[4] = 0; return out; }
    const a = (s - 2 * Ls - La) / T.rT; out[0] = mid - T.rT * Math.cos(a); out[1] = T.zN + T.rT * Math.sin(a); out[2] = Math.sin(a); out[3] = Math.cos(a); out[4] = 1; return out;
  };
  // where the two runs cross over the route's line (z = ZC): a crest stands over each crossing
  const sPE = T.sPE = T.zN - P.ZC, sPW = T.sPW = Ls + La + (P.ZC - T.zS), yS = 5.5;
  // the rises: knots (s, height) round the loop, valley and crest by turns; the seed deals heights and places
  const lo = () => r.range(6, 8), j = (a) => r.range(-a, a);
  const K = [[0, yS], [6, yS], [sPE, r.range(27, 30)]];
  if (r() < 0.5) {
    K.push([sPE + 38 + j(4), lo()], [sPE + 74 + j(4), r.range(19, 23)], [sPE + 110 + j(4), lo()]);
  } else {
    K.push([sPE + 34 + j(3), lo()], [sPE + 60 + j(3), r.range(18, 22)], [sPE + 86 + j(3), lo()], [sPE + 106 + j(3), r.range(12, 15)], [sPE + 126 + j(3), lo()]);
  }
  K.push([Ls + La * 0.5 + j(5), r.range(14, 17)], [Ls + La + 30 + j(5), lo()]);
  if (r() < 0.6) K.push([sPW - 66 + j(4), r.range(13, 16)], [sPW - 34 + j(3), r.range(7, 9)]);
  K.push([sPW, r.range(17.5, 20)], [sPW + 32 + j(3), r.range(6.5, 8)], [sPW + 52 + j(3), r.range(10, 12.5)], [2 * Ls + La, yS], [LT, yS]);
  T.knots = K;
  T.yAt = (s0) => {
    const s = ((s0 % LT) + LT) % LT; let i = 0; while (i < K.length - 2 && K[i + 1][0] <= s) i++;
    const a = K[i], b = K[i + 1], t = clamp((s - a[0]) / Math.max(b[0] - a[0], 1e-6), 0, 1);
    return a[1] + (b[1] - a[1]) * (0.5 - 0.5 * Math.cos(Math.PI * t));
  };
  // the trains' speed at s: hauled slowly up the first climb, then by the fall from the first crest; slow in the station
  const yTop = K[2][1], vLift = 4.2, vSta = 3.4, sSta = 2 * Ls + La;
  T.vAt = (s0) => {
    const s = ((s0 % LT) + LT) % LT, free = Math.sqrt(vLift * vLift + 12 * Math.max(0, yTop - T.yAt(s)));
    if (s <= sPE) return lerp(vSta, vLift, smoothstep(0, 10, s));
    const run = lerp(vLift, free, smoothstep(sPE, sPE + 14, s));
    return lerp(run, vSta, smoothstep(sSta - 26, sSta, s));
  };
  // the clock of one round: seconds to reach s (a table every half metre), and its inverse
  const n = Math.ceil(LT / 0.5), tab = T.tab = new Float32Array(n + 1), ds = LT / n; let acc = 0;
  for (let i = 0; i < n; i++) { tab[i] = acc; acc += ds / T.vAt((i + 0.5) * ds); }
  tab[n] = acc; T.period = acc; T.ds = ds;
  T.sAtTime = (t0) => {
    const t = ((t0 % acc) + acc) % acc; let a = 0, b = n;
    while (b - a > 1) { const m = (a + b) >> 1; if (tab[m] <= t) a = m; else b = m; }
    return (a + (t - tab[a]) / Math.max(tab[a + 1] - tab[a], 1e-6)) * ds;
  };
  // the trains: FIVE, evenly round the clock of one round (about 12 s apart) with a small draw each: by the clock's
  // own law one is always on the first climb to the crest over the crossing (the climb takes 18 s of the round),
  // and the others are on the runs beyond it. Nothing here reads the line, the lens or the film.
  const rt = P.R.trains; T.nTrains = 5; T.nCars = 6; T.pitch = 3.0;
  T.offsets = []; for (let k = 0; k < T.nTrains; k++) T.offsets.push(acc * k / T.nTrains + rt.range(-1.5, 1.5));
  T.t0 = rt.range(0, acc);
  return P;
}
// a train's metres along the loop at the world's clock t (seconds): the clock and the plan's numbers only
export function trainS(P, k, t) { const T = P.track; return T.sAtTime(t + T.t0 + T.offsets[k]); }
// the track's own line at s: place, tangent, the side toward the right of travel and the up of the banked rails
export function trackAt(P, s, o) {
  const T = P.track, q = trackAt.q, e = 0.25; T.plan(s, q);
  const y = T.yAt(s), dy = (T.yAt(s + e) - T.yAt(s - e)) / (2 * e), k = 1 / Math.hypot(1, dy), h = P.hand;
  // the bank: into the turn, rising over the first and falling over the last 12 m of each half round
  const sm = ((s % T.LT) + T.LT) % T.LT, inA = sm - T.Ls, inB = sm - 2 * T.Ls - T.La;
  const turn = (inA > -6 && inA < T.La + 6) ? smoothstep(-6, 8, inA) * (1 - smoothstep(T.La - 8, T.La + 6, inA)) : (inB > -6) ? smoothstep(-6, 8, inB) * (1 - smoothstep(T.La - 8, T.La + 6, inB)) : (sm < 6 ? 1 - smoothstep(-6, 6, sm) : 0);
  const roll = 0.3 * turn;
  o.x = h * q[0]; o.y = y; o.z = q[1];
  o.tx = h * q[2] * k; o.ty = dy * k; o.tz = q[3] * k;
  // the right of travel in the plan (the turns of this loop are right-hand turns in the plan's frame)
  const rx = q[3], rz = -q[2], c = Math.cos(roll), sn = Math.sin(roll);
  o.sx = h * rx * c; o.sy = -sn; o.sz = rz * c;
  o.ux = o.sy * o.tz - o.sz * o.ty; o.uy = o.sz * o.tx - o.sx * o.tz; o.uz = o.sx * o.ty - o.sy * o.tx;
  if (o.uy < 0) { o.ux = -o.ux; o.uy = -o.uy; o.uz = -o.uz; }
  o.roll = roll; o.d = q[0];
  return o;
}
trackAt.q = [0, 0, 0, 0, 0];

// ---------------------------------------------------------------- the wheel, the swing, the trapezes: sizes and laws
export function planMovers(P) {
  const W = P.wheel, rw = P.R.wheel, h = P.hand;
  // the wheel in the world: its hub, the unit along its plane, its axle's unit toward the gallery
  W.c = [h * W.d, W.hubY, W.z]; W.ex = h * W.e[0]; W.ez = W.e[1]; W.nx = h * W.nrm[0]; W.nz = W.nrm[1];
  // a cage hangs 0.5 m under its pin and is 3.0 m high, 2.6 m long in the wheel's plane, 2.2 m deep along the axle
  // (THE CAGES ARE SMALL, OPEN AND MANY: one hangs from a pin at every node of the rim, twice the spokes'
  // number (W.nc); each is 2.4 m high under its pin, 1.7 m long in the wheel's plane and 1.4 m deep along the axle)
  W.cage = { drop: 0.45, h: 2.4, len: 1.7, deep: 1.4 }; W.nc = W.n * 2;
  W.rock = []; for (let i = 0; i < W.n; i++) W.rock.push([rw.range(0.025, 0.06), rw.range(0.9, 1.4), rw.range(0, TAU)]);
  // the swept slab of everything that turns (rims, spokes, cages and their rock): metres either side of the plane
  W.slab = 3.1;
  // the chain swing: a tower 26 m tall, a crown 7.5 m in radius at 21.5 m, chains 9.5 m long
  const S = P.swing, rs = P.R.swing;
  S.h = 26; S.crownY = 21.5; S.rc = 7.5; S.chain = 9.5; S.n = rs.int(20, 24);
  S.rate = rs.range(0.7, 0.8) * (rs() < 0.5 ? -1 : 1); S.a0 = rs.range(0, TAU);
  // the fling of the chains by the turn: tan(b) = w^2 (rc + chain sin b) / g, solved by a few rounds
  let b = 0.6; for (let i = 0; i < 20; i++) b = Math.atan(S.rate * S.rate * (S.rc + S.chain * Math.sin(b)) / 9.81);
  S.fling = b; S.wave = 0.06; S.tilt = 0.07; S.waveRate = rs.range(0.16, 0.24); S.w0 = rs.range(0, TAU);
  S.seatPh = []; for (let i = 0; i < S.n; i++) S.seatPh.push(rs.range(0, TAU));
  // the widest reach of a seat from the swing's axis (the fling at its greatest, the crown's tilt, the seat's own half)
  S.reach = S.rc + S.chain * Math.sin(S.fling + S.wave + S.tilt) + 0.6;
  S.c = [h * S.d, 0, S.z];
  // the trapezes at the middle of the great tent: each a bar on two ropes from the ridge wire
  const T = P.tent, rt = P.R.tent; T.c = [h * T.d, 0, T.z]; T.traps = [];
  const nt = rt.int(3, 4);
  // (ropes 8.5 to 10.5 m: the bars swing 9 to 11 m over the ring, under the height of the drawn-up eave; a bar's
  // ends pass 0.8 m from the king poles, and two bars on one wire never reach each other)
  for (let i = 0; i < nt; i++) { const len = rt.range(8.5, 10.5); T.traps.push({ off: (i - (nt - 1) / 2) * 5.2, y: 19.5, len, amp: rt.range(0.28, 0.45), w: Math.sqrt(9.81 / len), ph: rt.range(0, TAU) }); }
  // the tent's long axis lies along z; its open quarter looks at the avenue's start (see tentInto)
  return P;
}
// the wheel's turn at the world's clock t: a constant rate from a start of the seed's; it never stops
export function wheelAngle(P, t) { const W = P.wheel; return W.a0 + W.turn * W.rate * t; }
// cage i at clock t: o.x, o.y, o.z is its pin on the rim; o.rock is its roll about the axle (it hangs level)
export function cagePose(P, i, t, o) {
  const W = P.wheel, a = wheelAngle(P, t) + i * TAU / W.nc, ca = Math.cos(a), sa = Math.sin(a), k = W.rock[i % W.n];
  o.x = W.c[0] + W.R * ca * W.ex; o.y = W.c[1] + W.R * sa; o.z = W.c[2] + W.R * ca * W.ez;
  o.rock = k[0] * Math.sin(t * k[1] + k[2] + (i >= W.n ? 2.1 : 0));
  return o;
}
// the swing's turn, and seat i at clock t: o.px.. its pivot on the crown, o.x.. the seat, o.fling its chain's angle
export function swingAngle(P, t) { const S = P.swing; return S.a0 + S.rate * t; }
export function swingPose(P, i, t, o) {
  const S = P.swing, a = swingAngle(P, t) + i * TAU / S.n, ca = Math.cos(a), sa = Math.sin(a);
  // the crown tilts toward a bearing that goes slowly round: a seat on the high side flies higher and wider
  const wa = S.w0 + S.waveRate * t, lift = Math.cos(a - wa);
  const py = S.crownY + S.rc * Math.sin(S.tilt) * lift, pr = S.rc;
  const fl = S.fling + S.wave * lift + 0.012 * Math.sin(t * 1.7 + S.seatPh[i]);
  o.px = S.c[0] + pr * ca; o.py = py; o.pz = S.c[2] + pr * sa;
  const rr = pr + S.chain * Math.sin(fl);
  o.x = S.c[0] + rr * ca; o.y = py - S.chain * Math.cos(fl); o.z = S.c[2] + rr * sa;
  o.fling = fl; o.a = a; o.ca = ca; o.sa = sa;
  return o;
}
// trapeze i's swing (radians from the plumb) at clock t
export function trapezeAngle(P, i, t) { const q = P.tent.traps[i]; return q.amp * Math.sin(t * q.w + q.ph); }

// ---------------------------------------------------------------- the stone half: its streets, square and buildings
// A building: d, z its middle; w its front's length, dp its depth, h the height of its cornice; face the heading its
// front looks along (from +d toward +z, radians); near: built with every mark (the far ones keep skids, rings, seams).
export function planStone(P) {
  const r = P.R.stone, B = P.stone = { houses: [] }, ZC = P.ZC, DS = P.DS;
  const sqN = B.sqN = ZC + 30, sqS = B.sqS = ZC - 24, E = 0, Wst = Math.PI, N = Math.PI / 2;
  // EVERY building stands in the air: `lift` is the height of its plinth's foot over the ground (1.2, 1.5 or 1.8 m:
  // two, three or four courses of crib timbers under its long skids). `style` picks its front among the plain kinds.
  // (q: the stream of the building's group; both dice are drawn for every building, whatever it then keeps)
  const add = (o, q = r) => {
    const tn = q(), rf = q();
    o.id = B.houses.length; o.tint = o.tint ?? tn; o.roof = o.roof || (rf < 0.6 ? 'hip' : 'flat');
    const k = (o.tint * 7.3) % 1; o.lift = o.lift || (k < 0.4 ? 1.5 : k < 0.9 ? 1.8 : 1.3); o.style = o.style ?? Math.floor(o.tint * 97) % 4;
    B.houses.push(o); return o;
  };
  // a row of buildings along z between z0 and z1 (z0 > z1): equal lots with garden gaps between them
  const row = (z0, z1, d0, d1, face, lot, gap, hr, extra, q = r) => {
    const len = z0 - z1, n = Math.max(1, Math.round(len / lot)), w = (len - (n - 1) * gap) / n, out = [];
    for (let i = 0; i < n; i++) out.push(add({ d: (d0 + d1) / 2, z: z0 - w / 2 - i * (w + gap), w, dp: d1 - d0, h: q.range(hr[0], hr[1]), face, ...(extra || {}) }, q));
    return out;
  };
  // WEST of the street (the fair's side) the whole row has gone to the trailers: its lots stand empty with their crib
  // stacks left (low and dark, in the plan of each house), so that from the street's whole length the fair is seen across them
  B.gone = [];
  // Nearest the square, opposite the bank, stands THE PALACE HALF TAKEN DOWN (B.down: its ground storey
  // whole, its walls ending in one level course; palaceDownInto), 34 m long, its front 11.5 m from the street's
  // middle; north of it its own yard, 21 m, where its top is set down in the order it came off (B.yard); the
  // rest of the row has gone: lots with a garden gap between them, as before
  B.down = { d: DS - 11.5 - 11, z: sqN + 2 + 17, w: 34, dp: 22, face: E, lift: 1.5 };
  B.yard = { d0: 12, d1: DS - 6, z0: sqN + 39, z1: sqN + 60 };
  { const z0 = P.edgeZ - 1, zB = sqN + 64, len = z0 - zB, n = Math.max(1, Math.round(len / 38)), w = (len - (n - 1) * 14) / n;
    for (let i = 0; i < n; i++) B.gone.push({ d: (10 + DS - 8.5) / 2, z: z0 - w / 2 - i * (w + 14), w, dp: DS - 8.5 - 10, face: E, lift: i % 2 ? 1.8 : 1.5 }); }
  B.court = null;
  // east of the street: THE BANK by the square behind its row of great columns under a pediment
  // (DE: the east row's building line, 13.5 m from the street's middle: no front nearer the line than 12 m. THE
  // BANK STANDS SET BACK 6 m BEHIND THAT LINE (BANK_BACK): its wall 19.5 m from the street's middle, its row of
  // columns 16.7 m, the cornice over them 16 m: nothing of its portico but the foot of its steps' ramp lies
  // within 12 m of the line, so that its pediment is not cut by the picture's edge beside the lens)
  const DE = B.DE = DS + 13.5, BANK_BACK = 6;
  add({ d: DE + 19 + BANK_BACK, z: sqN + 1 + 20, w: 40, dp: 38, h: r.range(17, 18.5), face: Wst, near: true, roof: 'flat', kind: 'bank', lift: 1.5, portico: { n: 8, colH: 11, pediment: true } });
  // the building next in turn stands at the street's mouth, east of the road and 27 m back from it, its end toward
  // the plain: that front (36 m long, facing the emptied plots) is the one half lowered; its shear-legs stand 24 m
  // and more from the line and the derrick beside it 19 m, both seen whole from the road. Behind it the east row
  // runs on to the bank.
  const hd0 = 26, hz = Math.max(P.edgeZ - 1 - hd0, sqN + 51 + 4);
  // (THE FIRST ROW TOWARD THE ROAD stands 1.8 m clear: this front, the fronts east of the plots, the hall, the works,
  // the tanks and the goods shed; the east row's number is the route's, and it is the last thing its stream deals)
  B.half = add({ d: DE + 18 + 14, z: hz + hd0 / 2, w: 36, dp: hd0, h: r.range(16, 19), face: N, near: true, half: true, roof: 'flat', lift: 1.8, first: true });
  if (hz - 10 - (sqN + 51) > 16) row(hz - 10, sqN + 51, DE, DE + 36, Wst, 40, 10, [17, 25], { near: true });
  // east of the plots, facing them: fronts that still stand
  row(186, Math.max(P.edgeZ + 2, 133), P.plotD + 2, P.plotD + 30, Wst, 38, 9, [16, 24], { near: true, lift: 1.8, first: true }, P.R.fronts);

  // the square's south side: THE PALACE closes the street's vista (a pedimented centre, pilasters, a balustrade and
  // urns), THE SCHOOL with its open belfry beside it; fronts on the east side
  const sq = P.R.square;
  B.palace = add({ d: DS, z: sqS - 3 - 13, w: 46, dp: 26, h: sq.range(20.5, 22.5), face: N, near: true, roof: 'hip', kind: 'palace', lift: 1.8 }, sq);
  B.school = add({ d: DS + 23 + 8 + 17, z: sqS - 3 - 11, w: 34, dp: 22, h: 12.5, face: N, near: true, roof: 'hip', kind: 'school', belfry: true, lift: 1.5 }, sq);
  row(sqN, sqS, 110, 140, Wst, 28, 8, [16, 22], { near: true }, sq);
  // the obelisk on its steps, outside the turn of the route (14 m beyond the line)
  const ta = sq.range(48, 60) * DEG, tr = P.turn;
  B.obelisk = { d: tr.d + (tr.r + 14) * Math.cos(ta), z: tr.z - (tr.r + 14) * Math.sin(ta), h: sq.range(23, 26) };
  // the rest of the town: rows south of the square and behind the fronts, plainer and further off
  const tw = P.R.town;
  row(sqS - 36, -186, 10, DS - 8.5, E, 40, 10, [17, 25], {}, tw);
  row(sqS - 38, -186, DS + 8.5, 104, Wst, 44, 10, [14, 22], {}, tw);
  for (const [d0, d1] of [[120, 158], [170, 206]]) for (const [z0, z1] of [[84, sqN + 10], [sqS - 10, -110], [-122, -186]]) {
    const a0 = tw.range(0, 4), a1 = tw.range(0, 4), fc = tw() < 0.5 ? Wst : E;
    row(z0, z1, d0 + a0, d1 - a1, fc, 34, 9, [12, 20], {}, tw);
  }
  // THE DOMED HALL (taller than all, its dome on a drum of columns), THE WORKS in grey cement with a toothed roof
  // and its one cold chimney, the tanks and the goods shed by the carters' road: all on cribs like the rest, east
  // of the street's rows
  B.hall = { d: 153, z: 108, r: 20, h: P.domeH + 7, lift: 1.8, cornice: 19 };
  const eg = P.R.edge;
  // (THE WORKS ARE COLD. Their one chimney stands on its skids, cold, whole and plumb, without smoke. No chimney
  // lies anywhere)
  B.works = { d: 192, z: 150, w: 44, dp: 30, h: 14, chim: [[178, 138]], chimH: P.chimH, lift: 1.8 };
  B.tanks = []; for (let i = 0; i < 5; i++) B.tanks.push({ d: 162 + (i % 2) * 27 + eg.range(-2, 2), z: 198 + Math.floor(i / 2) * 27 + eg.range(-2, 2), r: eg.range(8, 10.5), h: eg.range(12, 16.5), lift: 1.8 });
  B.shed = { d: 128, z: 238, w: 56, dp: 18, h: 8, face: Wst, lift: 1.8 };
  // the town's south wing: the stone half turns the fair's far corner and closes the midway's vista: four lots facing
  // north across the turf, the one on the midway's own axis a temple front (six columns under a pediment)
  // EACH ITS OWN BUILDING, of the east half's stones: a limestone front of giant pilasters under a balustrade; the
  // marble temple front, tallest; a low mansarded house under copper; a tall front with a raised attic and a belfry
  const wg = P.R.wing; B.wing = [];
  const wk = [{ w: 44, h: [16.5, 18], tint: 0.08, style: 1, roof: 'flat' }, { w: 40, h: [23, 24.5], tint: 0.5, style: 0, roof: 'hip', kind: 'temple', portico: { n: 6, colH: 10.5, pediment: true }, lift: 1.8 },
    { w: 34, h: [13, 14.5], tint: 0.72, style: 2, roof: 'flat' }, { w: 40, h: [19, 21], tint: 0.27, style: 3, roof: 'flat', belfry: true }];
  for (let i = 0; i < 4; i++) B.wing.push(add({ ...wk[i], d: P.DM + 54 * (1 - i), z: -229, dp: 26, h: wg.range(wk[i].h[0], wk[i].h[1]), face: N, near: true }, wg));
  // and its west range BESIDE THE AVENUE (their faces 42 m west of the line): four fronts facing east, the southmost
  // a palace front that closes the view under the switchback (the crossing's own heading runs at it; it stands
  // 14 m north of that line, clear of the riders' drum); the others stand on the avenue's left hand to its end
  // (THREE fronts stand; the range's far end, toward the wheel, is an emptied lot: its front has gone to the
  // wagons and the plan of it is left: low dark crib stacks on a paler rectangle)
  const wr = P.R.west; B.west = [];
  for (const k of [0, 1, 2]) B.west.push(add({ d: -202, z: ZC + 14 + 56 * k, w: k ? 40 : 46, dp: 24, h: k ? wr.range(16, 20) : wr.range(21, 23), face: E, near: true }, wr));
  B.west[0].kind = 'palace'; B.west[0].roof = 'hip'; B.west[0].lift = 1.8;
  B.westGone = { d: -202, z: ZC + 14 + 56 * 3, w: 40, dp: 24, face: E, lift: 1.8, portico: false };
  // A STONE FRONT ON ITS LIT CRIBS DIRECTLY BEHIND THE FIRST STANDING WAGONS, north of the lane across
  // the plots' head: its front 21 m from the line, 10 m behind the wagons (a stream of its own; the last house
  // of the list, so that no other building's number changes)
  B.frontHouse = add({ d: DS + 21 + 10, z: 219.5, w: 31, dp: 20, h: P.R.palace.range(15, 17.5), face: Wst, near: true, lift: 1.8, first: true, roof: 'hip' }, P.R.palace);
  // the emptied plots: lots where fronts stood (plotsInto: the plan of each house left on the ground)
  const pl = P.R.plots; B.plots = [];
  // (they are the lots of the street's two rows, carried on toward the plain: west of the road, and east of it
  // from where the lowered front will lie)
  // (the east lots lie behind the standing trailers' verge, from 15 m off the line)
  for (const [d0, d1, zEnd] of [[10, DS - 8.5, P.edgeZ + 2], [DE + 1.5, DE + 36, B.half.z + hd0 / 2 + 22]]) for (let z = 186; z - 16 > zEnd; z -= 31) {
    const dp = Math.min(pl.range(21, 25), z - zEnd - 1), w = d1 - d0 - pl.range(0, 3);
    B.plots.push({ d: d0 + (d1 - d0) / 2, z: z - dp / 2, w, dp, pegs: pl.int(4, 6), stack: pl() < 0.5 });
  }
  return P;
}

// THE STANDING WAGONS on the stone verge of the carters' lane: seven to nine in file, singly, a little askew,
// their near edge 8.5 m and more from the line: one behind the entry; the first ahead of it stands 37 m and more
// from the entry's lens (whole in the first frame: the dome or the standing portico); then down past the plots
// to the street's mouth (none before a standing front, none on the lane across the plots' head). Each is a ROAD
// WAGON on four spoked wheels with a drawbar, and EVERY DRAWBAR POINTS AWAY FROM THE TOWN. Each carries one
// great piece of the town: the hall's own copper dome in small, a length of portico, lengths of the cornice and
// the balustrade that the fronts wear, glazed windows in their stone frames, a pediment, column drums, a stair.
export function planTrailers(P) {
  const r = P.R.trailers, T = P.trailers = [];
  const loads = r() < 0.5 ? ['drums', 'dome', 'portico', 'corbal', 'window', 'pediment', 'drums', 'stair', 'urn']
    : ['urn', 'portico', 'dome', 'window', 'corbal', 'drums', 'pediment', 'stair', 'drums'];
  // (a wagon is 19 m long with its drawbar: 24 m apart, no wagon's drawbar reaches the next one's tail by 4.5 m)
  const zk = [308, 240, 216, 181, 157, 133, 109, 85, 61], zLow = P.stone.half.z - 13 - 7;
  for (let k = 0; k < P.nTrailers; k++) {
    // (every place draws its dice; then the rule of the standing fronts says whether a wagon stands there)
    const dd = r.range(-0.35, 0.35), yaw = r.range(-0.035, 0.035);
    if (k >= zk.length || zk[k] - 8 < zLow) continue;
    T.push({ d: P.DS + 10.8 + dd, z: zk[k], face: Math.PI / 2 + yaw, load: loads[k], k });
  }
  // A SECOND STANDING LINE ALONG THE SEAM, on the stone side's kerb, clear of the fair's limes: six
  // more wagons loaded with marble, three either side of the crossing, their drawbars toward the road out
  // (their loads are BARE MARBLE, roped and wedged, no sheet over any. A stream of their own.)
  const rs = P.R.seam, sl = ['pediment', 'drums', 'balustrade', 'cornice', 'balustrade', 'drums'], sh = rs() < 0.5 ? 0 : 3;
  for (let k = 0; k < 6; k++) { const sg = k < 3 ? 1 : -1; T.push({ d: 5, z: P.ZC + sg * (26 + 24 * (k % 3)), face: Math.PI / 2, load: sl[(k + sh) % 6], k: 10 + k, seam: true }); }
  // THE HALF-TAKEN-DOWN PALACE'S ONE WAGON, in its yard, loaded with lengths of its own cornice, its drawbar
  // toward the lane out
  const Y = P.stone.yard;
  T.push({ d: Y.d0 + 5, z: Y.z0 + 9.5, face: Math.PI / 2, load: 'cornice', k: 20, yard: true });
  // THE STANDING CARAVAN along the carters' road toward the horizon: wagons standing singly with gaps on the
  // road's outer verge, a little askew, each with one bare marble load (columns upright under their
  // entablature, a dome, a pediment's frame) and a lantern; drawbars down and pointing away from the town,
  // wheels chocked; no law moves any of them
  const rc = P.R.caravan, C = P.caravan = [], rd = P.DS + 0.8;
  // (the road's own line beyond the entry, as knots [z, d]: straight north behind the entry for 30 m, then
  // bending over to the fair's hand and running WEST across the plain 85 to 100 m north of the fair's close,
  // 270 m and less from the rising turn, and away north-west toward the horizon)
  P.roadKnots = [[300, rd], [318, rd - 4], [332, rd - 22], [341, rd - 60], [347, rd - 140], [356, rd - 260], [400, rd - 330], [900, rd - 380], [2600, rd - 440]];
  P.roadD = (z) => { const K = P.roadKnots; if (z <= K[0][0]) return rd; let i = 0; while (i < K.length - 2 && K[i + 1][0] <= z) i++; return K[i][1] + (z - K[i][0]) * (K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]); };
  // the far road's least distance from a place (d, z) of the plan
  P.roadDist = (d, z) => {
    const K = P.roadKnots; let best = 1e9;
    for (let i = 0; i + 1 < K.length; i++) {
      const az = K[i][0], ad = K[i][1], bz = K[i + 1][0] - az, bd = K[i + 1][1] - ad, t = clamp(((z - az) * bz + (d - ad) * bd) / (bz * bz + bd * bd), 0, 1);
      best = Math.min(best, Math.hypot(z - az - bz * t, d - ad - bd * t));
    }
    return best;
  };
  // (the caravan stands along the road BY THE ROAD'S OWN LENGTH, from 46 m along it (55 m behind the entry and
  // 25 m aside) on for 1,500 m: each wagon 7 to 10 m off the road's middle on its outer verge, along the road's
  // heading, askew; big: the first fourteen are the great drays, a third larger than the town's wagons)
  const poly = P.roadKnots;
  for (let s = 46, i = 0, s0 = 0; s < 1546;) {
    // (every wagon draws its dice; then its place along the road is found)
    const gap = rc.range(30, 56), dd = rc.range(-1.4, 1.4), yaw = rc.range(-0.14, 0.14), kind = rc.int(0, 2);
    let len = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]);
    while (s - s0 > len && i < poly.length - 2) { s0 += len; i++; len = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]); }
    const uz = (poly[i + 1][0] - poly[i][0]) / len, ud = (poly[i + 1][1] - poly[i][1]) / len, t = s - s0, off = 9.4 + dd;
    C.push({ d: poly[i][1] + ud * t + uz * off, z: poly[i][0] + uz * t - ud * off, face: Math.atan2(uz, ud) + yaw, kind, big: C.length < 14 });
    s += gap + (C.length <= 14 ? 6 : 0);
  }
  return P;
}

// THE SWING BOATS: rows of boats on an iron frame (a top beam on raking legs, brick footings in the turf). Each boat
// hangs by four rods from its own pivot on the beam and swings empty across the beam's line, on a phase and a
// period of its own. A row stands in its frame with the beam along +Z (the heading `face`).
export function planBoats(P) {
  const r = P.R.boats, rows = P.boats = [
    // BY THE LANE, right behind the close's east hedge, their beam 14 m from the line and along it: six boats
    // that swing toward the lane and away (their widest reach 9.3 m from the line), 44 to 64 m ahead of the entry
    { d: P.DS - 14, z: 232, face: Math.PI / 2, n: 6, sc: 1.2 },
    // AT THE FAIR'S NORTH-EAST CORNER, seen across the emptied plots from the left street: six great boats,
    // their beam along the seam
    { d: -14, z: 172, face: Math.PI / 2, n: 6, sc: 1.6 },
    // ON THE SOUTH-WEST LAWN, between the swing's garden and the south-west round point:
    // five boats on a lit beam along the seam's heading, their beam 5.5 m west of the avenue's line carried
    // south and 43 m south of the swing's axis: 15 m and more outside the line's round. A pull of the gaze aims
    // at their beam over the round's first quarter (planFilm). Their dice are a stream of their own (garden),
    // drawn after the two older rows' dice.
    { d: P.DA - 5.5, z: P.swing.z - 43, face: Math.PI / 2, n: 5, sc: 1.3, own: P.R.garden }];
  // (sc: the row's own size; the boats by the lane are a fifth larger than the unit, the corner's three fifths:
  // great boats 9 m tall on their frame, 62 m from the line across the plots)
  for (const q of rows) {
    const rq = q.own || r;
    q.pitch = 3.3 * q.sc; q.H = 5.6 * q.sc; q.L = 4.2 * q.sc; q.b = [];
    for (let i = 0; i < q.n; i++) q.b.push({ amp: rq.range(0.45, 0.8), w: Math.sqrt(9.81 / q.L) * rq.range(0.95, 1.05), ph: rq.range(0, TAU), col: i % 4 });
  }
  return P;
}
// boat i of a row at the world's clock t: its swing in radians from the plumb (the clock and the plan's numbers only)
export function boatAngle(P, row, i, t) { const q = P.boats[row].b[i]; return q.amp * Math.sin(t * q.w + q.ph); }

// THE FIREWORKS over the fields beyond the fair's west hedge, past the tent (away from the stone half): eight
// rockets, one every five seconds of an even loop of 40 s on the world's clock, its phase the seed's. Each rises
// for 2.2 s and bursts into one plain round of sparks that hangs, falls and fades for 3.4 s: one is always rising
// or hanging, never two bursts at once; no build-up and no end. Every spark stays 120 m and more from the line
// (counted on seeds 1 to 300: 140 m), and 290 m and more on the fair's side of the seam.
export function planFire(P) {
  const r = P.R.fire, n = 8, F = P.fire = { n, period: 40, t0: r.range(0, 40), rise: 2.2, hang: 3.4, sparks: 56, trail: 6, rockets: [], dirs: [] };
  // (their field lies south-west of the tent, beyond the fair's far corner: from the road, the street and the
  // midway the bursts stand over the tent and the fair's limes, clear of every stone front)
  for (let k = 0; k < n; k++) F.rockets.push({ d: r.range(-372, -318), z: P.tent.z + r.range(-125, -30), h: r.range(62, 88), R: r.range(20, 27), col: k % 5, sway: r.range(-6, 6) });
  // the sparks' own directions: points spread evenly over a ball (a spiral), the same for every rocket
  for (let i = 0; i < F.sparks; i++) { const y = 1 - 2 * (i + 0.5) / F.sparks, rr = Math.sqrt(1 - y * y), a = i * 2.39996; F.dirs.push([rr * Math.cos(a), y, rr * Math.sin(a), r.range(0.72, 1)]); }
  return P;
}
// the age in seconds of rocket k at the world's clock t (0 at its launch; the loop's 40 s)
export function fireAge(P, k, t) { const F = P.fire, a = (t + F.t0 - k * F.period / F.n) % F.period; return a < 0 ? a + F.period : a; }
// spark i of rocket k at the world's clock t: its place in the world (o.x, o.y, o.z) and its light o.b (0: out).
// i < trail: the rising head and its tail; i >= trail: the burst's sparks. The same law is written in the sparks'
// own vertex code (makeFireField); this one is for the counts.
export function fireSpark(P, k, i, t, o) {
  const F = P.fire, q = F.rockets[k], a = fireAge(P, k, t), x0 = P.X(q.d);
  o.b = 0; o.x = x0; o.y = 0; o.z = q.z;
  if (i < F.trail) {
    const ar = a - i * 0.07; if (ar < 0 || a > F.rise) return o;
    const s = ar / F.rise; o.y = q.h * (1 - (1 - s) * (1 - s)); o.x = x0 + q.sway * s; o.b = 1 - i / F.trail; return o;
  }
  const s = a - F.rise; if (s < 0 || s > F.hang) return o;
  const u = F.dirs[i - F.trail], e = q.R * u[3] * (1 - Math.exp(-2.4 * s));
  o.x = x0 + q.sway + u[0] * e; o.y = q.h + u[1] * e - 1.3 * s * s; o.z = q.z + u[2] * e; o.b = Math.pow(1 - s / F.hang, 1.5);
  return o;
}

// THE LIMES' OWN REACH. The limes are the kit's oak shape, three shapes to a seed (two near
// ones drawn by turns, one coarser far one), made HERE, once, so that the plan can place every lime BY ITS LEAVES
// and the world can draw the very same shapes (P.limes). For each near shape, by bands of 0.75 m of height at the
// unit size (15 m tall): the greatest reach from the trunk's foot of any corner of leaf or bough WITH THE WIND'S
// BOUND ADDED (the kit's sway law at the world's wind strength LIME_WIND with its gust at the full: 1.4603 m to a
// unit of a corner's sway weight and 0.1065 m to a unit of its flutter weight, times the strength and the tree's
// size), each band widened to the greatest of its two neighbours either side (a leaf's face spans bands).
// LIME_SINK is the kit's own sinking of a plant into the ground (a share of its height), given by the world.
export const LIME_WIND = 0.8, LIME_SINK = 0.03;
const LIME_COL = { leaf: '#3f6b3a', bark: '#6b4a30', barkDark: '#3e2a1a' };
export function planLimes(P) {
  const mk = (name, detail) => flora.oakGeometry({ rng: makeRng(hashSeed('half-city-of-the-fair:' + name + ':' + P.seed)), detail, height: 15, ...LIME_COL });
  const near = [mk('lime0', 1), mk('lime1', 1)], far = [mk('limeFar', 0)];
  const reach = (g) => {
    const p = g.attributes.position, w = g.attributes.wind, raw = new Float64Array(24), bands = new Float64Array(24); let pad = 0;
    for (let i = 0; i < p.count; i++) {
      const e = LIME_WIND * (1.4603 * w.getX(i) + 0.1065 * w.getY(i)), k = clamp(Math.floor(p.getY(i) / 0.75), 0, 23), r = Math.hypot(p.getX(i), p.getZ(i)) + e;
      if (r > raw[k]) raw[k] = r;
      if (e > pad) pad = e;
    }
    for (let k = 0; k < 24; k++) for (let j = Math.max(0, k - 2); j <= Math.min(23, k + 2); j++) bands[k] = Math.max(bands[k], raw[j]);
    return { bands, pad };
  };
  // (reachFar: the far shape's own bands, for the seam's tall limes, which wear that shape: planSeam)
  P.limes = { near, far, reach: near.map(reach), reachFar: reach(far[0]) };
  return P;
}
// whether a lime of height h at the world's (x, z), drawn with the near shape v, keeps EVERY LEAF AT THE WIND'S
// BOUND `air` metres and more from the line (the shape's bands as rings about the trunk, sunk as the kit sinks it)
// (v under nought: the far shape)
export function limeClear(P, x, z, h, v, air) {
  const s = h / 15, R = v < 0 ? P.limes.reachFar : P.limes.reach[v], S = P.line, rmax = 15 * s + air + 1, cell = 8, cx = Math.floor(x / cell), cz = Math.floor(z / cell), rc = Math.ceil(rmax / cell);
  for (let a = cx - rc; a <= cx + rc; a++) for (let c = cz - rc; c <= cz + rc; c++) {
    const g = P.grid.get(a + ':' + c); if (!g) continue;
    for (const i of g) {
      const rho = Math.hypot(S[i * 3] - x, S[i * 3 + 2] - z), py = S[i * 3 + 1]; if (rho > rmax) continue;
      for (let k = 0; k < 24; k++) {
        if (!R.bands[k]) continue;
        const y0 = (k * 0.75 - 15 * LIME_SINK - R.pad) * s, y1 = ((k + 1) * 0.75 - 15 * LIME_SINK + R.pad) * s;
        if (Math.hypot(Math.max(0, rho - R.bands[k] * s), Math.max(0, y0 - py, py - y1)) < air) return false;
      }
    }
  }
  return true;
}

// The fair's and the seam's standing dress, laid by rule from the line (see the world file's head):
// booths in two rows along the midway, their fronts 7.5 m from the line; old limes in a double row along the seam,
// between the switchback's two runs and round the fair's edge, none with its trunk nearer the line than 9 m plus
// half its crown where the line passes lower than its top; gas standards on the stone kerb; hedges; flower beds.
export function planDress(P) {
  const D = P.dress = { booths: [], trees: [], gas: [], hedges: [], beds: [], poles: [] }, S = P.swing, T = P.track, W = P.wheel;
  const rb = P.R.booths, rt = P.R.trees, rbd = P.R.beds, dm = P.DM;
  const awn = [0, 1, 2, 0, 2, 1];
  // (the fair's north-east corner is the great swing boats on their lit beam, the row of booths, the limes hung
  // with lamps and the hedge)
  for (const side of [1, -1]) {
    const zEnd = side > 0 ? S.z - 8 : S.z + S.reach + 8;
    for (let z = P.ZC - 37, k = 0; z - 3 > zEnd; z -= 8.2, k++) {
      // (every place draws its dice, then the rule of the drum says whether a booth stands there)
      const d = dm + side * 10, dd = Math.hypot(d - P.drum.d, z - P.drum.z), h = rb.range(3.4, 4.2), star = rb() < 0.5, roof = rb() < 0.5 ? 'hip' : 'gable';
      if (dd < P.drum.r + 7) continue;
      D.booths.push({ d, z, side, h, col: awn[(k + (side > 0 ? 0 : 3)) % 6], star, roof });
    }
    // the poles of the festoons, 8.2 m from the line (none within the drum's walk)
    for (let z = P.ZC - 34; z > S.z + (side > 0 ? -14 : S.reach + 5); z -= 12.3) { if (Math.hypot(dm + side * 8.2 - P.drum.d, z - P.drum.z) < P.drum.r + 4.5) continue; D.poles.push({ d: dm + side * 8.2, z, h: 6.6 }); }
  }
  // the festoons' strings: from pole to pole along each side, and across the midway from each east pole to its
  // fellow (a: one end, b: the other, as [d, z]; h: the poles' height; sag in metres; n: its lamps)
  D.strings = [];
  for (let i = 0; i + 1 < D.poles.length; i++) { const a = D.poles[i], c = D.poles[i + 1]; if (a.d === c.d && a.z - c.z < 13) D.strings.push({ a: [a.d, a.z], b: [c.d, c.z], h: a.h, sag: 1.1, n: 8 }); }
  for (const a of D.poles) if (a.d > dm && D.poles.some((c) => c.d < dm && c.z === a.z)) D.strings.push({ a: [a.d, a.z], b: [2 * dm - a.d, a.z], h: a.h, sag: 1.6, n: 11, chase: true });
  // THE AVENUE, filled: booths on both hands (clear of the tent's open side and of the drum), a round bed
  // in every third place, and LAMP ARCHES over the path every 16 m (their crowns 3.5 m and more under the line)
  D.arches = [];
  const za0 = S.z + S.reach + 12, za1 = P.arc.C[1] - 4;
  const ra = P.R.avenue;
  for (let z = za0 + 4, k = 0; z < za1 - 3; z += 9.4, k++) for (const side of [1, -1]) {
    const d = P.DA + side * 11.5, bc = ra.int(0, 3), h = ra.range(3.4, 4.2), star = ra() < 0.5, roof = ra() < 0.5 ? 'hip' : 'gable';
    if (side < 0 && z < P.tent.z + 34) continue;
    if (side > 0 && Math.hypot(d - P.drum.d, z - P.drum.z) < P.drum.r + 9) continue;
    if (k % 3 === 2) { D.beds.push({ d: P.DA + side * 10.5, z, rx: 2.6, rz: 2.6, col: bc }); continue; }
    D.booths.push({ d, z, side, h, col: awn[(k + (side > 0 ? 1 : 4)) % 6], star, roof });
  }
  for (let z = za0; z < za1 + 30; z += 16) D.arches.push({ z });
  // THE FAIR'S CLOSE BY THE LANE: the fair's ground runs on north of the lane across the plots' head in
  // a hedged close whose EAST HEDGE STANDS 7.6 m FROM THE LINE (its face 6.5 m), from 30 m ahead of the entry
  // down to that lane. Its north-east corner is cut off: there stands the open gate under one plain hoop of
  // lamps, facing the lane and whoever comes down it. Inside: a walk west from the gate under festoons, a row
  // of booths facing it, old limes over the north hedge; right behind the east hedge the six swing boats
  // (planBoats) with a lime at each end of their frame, and a festoon on white poles in the hedge's own line
  const Fo = P.fore = { d0: -62, d1: P.DS - 7.6, z0: 204, z1: 256, ch: 6.5, gz: 248.5 }, rf = P.R.fore;
  D.gates = [{ a: [Fo.d1, Fo.z1 - Fo.ch], b: [Fo.d1 - Fo.ch, Fo.z1], post: 4.2 }];
  // (the booths stand south of the walk and face north, toward the walk and whoever comes down the lane)
  for (let k = 0; k < 5; k++) { const h = rf.range(3.4, 4.2), star = rf() < 0.5, roof = rf() < 0.5 ? 'hip' : 'gable'; D.booths.push({ d: 22 - k * 8.4, z: Fo.gz - 8.5, side: 0, face: Math.PI / 2, h, col: awn[(k + 2) % 6], star, roof }); }
  { const np = D.poles.length;
    for (const dz of [-3.4, 3.4]) for (let d = 26; d > -40; d -= 11.5) D.poles.push({ d, z: Fo.gz + dz, h: 6.6 });
    for (let i = np; i + 1 < D.poles.length; i++) { const a = D.poles[i], c = D.poles[i + 1]; if (a.z === c.z) D.strings.push({ a: [a.d, a.z], b: [c.d, c.z], h: a.h, sag: 1.0, n: 8 }); }
    for (let i = np; i < D.poles.length; i++) { const a = D.poles[i]; if (a.z < Fo.gz) D.strings.push({ a: [a.d, a.z], b: [a.d, a.z + 6.8], h: a.h, sag: 1.0, n: 7, chase: true }); }
    // the festoon in the east hedge's own line: a pole every 11 m from beside the gate's post to the south corner
    const nq = D.poles.length;
    for (let k = 0; k <= 4; k++) D.poles.push({ d: Fo.d1, z: lerp(Fo.z1 - Fo.ch - 1.5, Fo.z0, k / 4), h: 6.4, head: true });
    for (let i = nq; i + 1 < D.poles.length; i++) { const a = D.poles[i], c = D.poles[i + 1]; D.strings.push({ a: [a.d, a.z], b: [c.d, c.z], h: a.h, sag: 0.9, n: 9, chase: i % 2 === 0 }); } }
  // THE PLEASURE GROUNDS: THREE ROUND POINTS, each a ring walk of pale gravel with walks radiating from
  // it toward the rides, every walk lined with lamp posts, parterres and benches between the walks:
  //   the bandstand's, on the lawn inside the rising turn (two walks crossing at it);
  //   the north lawn's, between the wheel and the fair's north-east corner (eight walks);
  //   the south-west lawn's, between the swing, the tent and the south wing (eight walks).
  // A walk ends where it would run into a ride, a booth, the trestle or the fair's edge (blocked, below).
  const Lw = P.lawn = { d: P.arc.C[0], z: P.arc.C[1] }, rl = P.R.lawn, rp = P.R.pleasure;
  D.band = { d: Lw.d, z: Lw.z, r: 4.6 };
  for (let k = 0; k < 8; k++) { const h = rl.range(3.4, 4.2), star = rl() < 0.5, roof = rl() < 0.5 ? 'hip' : 'gable'; D.booths.push({ d: -78, z: P.ZC + 12 + k * 8.3, side: 1, h, col: awn[(k + 1) % 6], star, roof }); }
  // (at the fair's north-east corner a row of five faces east, toward the seam and the left street beyond it)
  for (let k = 0; k < 5; k++) { const h = rl.range(3.4, 4.2), star = rl() < 0.5, roof = rl() < 0.5 ? 'hip' : 'gable'; D.booths.push({ d: -38, z: 150 + k * 8.3, side: -1, h, col: awn[(k + 4) % 6], star, roof }); }
  const R2 = { d: -62, z: 158, r: 9 }, R3 = { d: P.DA - 24, z: S.z - 46, r: 9 };
  // (a row of four by the south-west round point, facing it: a stream of their own)
  for (let k = 0; k < 4; k++) { const h = rp.range(3.4, 4.2), star = rp() < 0.5, roof = rp() < 0.5 ? 'hip' : 'gable'; D.booths.push({ d: R3.d - 12.6 + k * 8.4, z: R3.z - 18, side: 0, face: Math.PI / 2, h, col: awn[(k + 3) % 6], star, roof }); }
  P.rounds = [{ d: Lw.d, z: Lw.z, r: 9 }, R2, R3];
  // whether a place of the fair's ground is taken by a ride, the trestle, a booth, a boat's frame or the edge
  // (m: metres of margin)
  const zw = P.ZC + 14;
  const blocked = (d, z, m = 0) => {
    if (d > -9 - m || d < -238 + m || z < -208 + m || (z > 195 - m && (d < Fo.d0 + 2 + m || z > Fo.z1 - 2 - m))) return true;
    const x = P.X(d), wx = (x - W.c[0]) * W.ex + (z - W.c[2]) * W.ez, wo = (x - W.c[0]) * W.nx + (z - W.c[2]) * W.nz;
    if (Math.abs(wx) < W.R + 4 + m && wo > -11 - m && wo < 22 + m) return true;
    if (z < T.zN + 2 + m && z > T.zS - 2 - m && (Math.abs(d - T.dE) < 4.5 + m || Math.abs(d - T.dW) < 4.5 + m)) return true;
    if ((z > T.zN - 2 || z < T.zS + 2) && Math.abs(Math.hypot(d - (T.dE + T.dW) / 2, z - (z > 0 ? T.zN : T.zS)) - T.rT) < 4.5 + m) return true;
    if (d < T.dE + 7 + m && d > T.dE - 1 && z > T.zN - 17 - m && z < T.zN + 3 + m) return true;
    if (Math.hypot(d - S.d, z - S.z) < S.reach + 2.5 + m || Math.hypot(d - P.drum.d, z - P.drum.z) < P.drum.r + 3.5 + m) return true;
    if (Math.abs(d - P.tent.d) < 21.5 + m && Math.abs(z - P.tent.z) < 29.5 + m) return true;
    if (d < -176 + m && z > zw - 30 - m && z < zw + 194 + m) return true;
    for (const q of D.booths) { const al = q.face === Math.PI / 2 ? d - q.d : z - q.z, ac = q.face === Math.PI / 2 ? z - q.z : d - q.d; if (Math.abs(al) < 3.6 + m && Math.abs(ac) < 5.2 + m) return true; }
    for (const q of P.boats) if (Math.abs(z - q.z) < q.n * q.pitch / 2 + 1.5 + m && Math.abs(d - q.d) < 4 * q.sc + 1.4 + m) return true;
    return false;
  };
  // THE WALKS (their middles are the ground's painting, their lamps stand either side): the walk in from the gate
  // and down to the north round point; from the seam to the wheel's foot; the avenue's walk on north and its branch
  // to the wheel; the midway's walk on south to the temple front; then every round point's ring and its spokes
  P.walks = [[[Fo.d1 - Fo.ch / 2, Fo.z1 - Fo.ch / 2], [31, Fo.gz], [-40, Fo.gz], [-44, 200], [R2.d + 4, R2.z + 8.5]], [[-7, W.z], [W.d + 16, W.z]],
    [[P.DA, Lw.z + 34], [P.DA, 190]], [[P.DA, W.z + 30], [W.d - 20, W.z + 8]], [[P.DM - 3, S.z - 16], [P.DM, S.z - 40], [P.DM, -206]],
    [[Lw.d, Lw.z - 34], [Lw.d, Lw.z + 34]], [[Lw.d - 27, Lw.z], [Lw.d + 24, Lw.z]]];
  P.rings = [];
  for (const q of P.rounds) {
    const ring = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU; ring.push([q.d + q.r * Math.cos(a), q.z + q.r * Math.sin(a)]); }
    P.rings.push(ring);
    if (q === P.rounds[0]) continue;
    for (let k = 0; k < 8; k++) {
      // a spoke: from the ring outward for 34 m, cut short where the ground is taken
      const a = (k + 0.5) / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a); let len = 0;
      while (len < 34 && !blocked(q.d + (q.r + len + 2) * ca, q.z + (q.r + len + 2) * sa, 1.5)) len += 2;
      if (len >= 8) P.walks.push([[q.d + q.r * ca, q.z + q.r * sa], [q.d + (q.r + len) * ca, q.z + (q.r + len) * sa]]);
    }
  }
  // THE SWING'S GARDEN (the line's round passes over it at 13.5 m, 24 m from the swing's
  // axis). All of it is laid about the swing's axis by the swing's own reach (Gd.a: degrees round the axis from
  // the midway's side through the south to the avenue's side, the way the line goes):
  //   a low clipped hedge ring 2.2 m outside the seats' widest reach, open where the walks come in;
  //   A RING WALK OF RAKED GRAVEL 4.4 m wide (its middle 5.1 m outside that reach: 3.6 m inside the line's round);
  //   round the walk's outside, on the south half the line flies over, FIVE BEDS IN FLOWER (Gd.beds: from, to in
  //   degrees, colour), each edged with a low clipped hedge and lit by three low lamps; between the beds the two
  //   walks go out: one to the south walk's head (at 37 degrees), one to the south-west round point (at 133);
  //   A FESTOON on white poles round the walk's outer edge (Gd.poles, degrees: none on a walk) and across the
  //   walk from every pole of Gd.cross to a pole at the hedge ring (its lamps 6.6 m and more under the line);
  //   young limes hung with lamps 5.5 m outside the line's round (below, with the other limes).
  const Gd = D.garden = { rh: S.reach + 2.2, rw: S.reach + 5.1, ww: 4.4, rb0: S.reach + 8.1, rb1: S.reach + 11.3, beds: [[9, 30, 1], [44, 66, 3], [72, 98, 0], [104, 126, 2], [140, 161, 1]], rp: S.reach + 7.7, rl: S.reach + 14.2,
    poles: [-4, 12, 30, 44, 57, 69, 85, 101, 114, 126, 140, 156, 172, 188], cross: [12, 30, 44, 57, 85, 114, 126, 140, 156], ri: S.reach + 2.8 };
  Gd.at = (r, a) => [S.d + r * Math.cos(a * DEG), S.z - r * Math.sin(a * DEG)];
  Gd.ring = []; for (let i = 0; i <= 64; i++) Gd.ring.push(Gd.at(Gd.rw, i / 64 * 360));
  { const e = Gd.rw + Gd.ww / 2, ul = Math.hypot(S.d - R3.d, S.z - R3.z);
    Gd.links = [[Gd.at(e, 37), [P.DM - 3, S.z - 16]], [Gd.at(e, 133), [R3.d + R3.r * (S.d - R3.d) / ul, R3.z + R3.r * (S.z - R3.z) / ul]]];
    for (const w of Gd.links) P.walks.push(w); }
  // (six lamps to a string along the walk's edge, five to a string across it; all of them run in the chase)
  { const np = D.poles.length;
    for (const a of Gd.poles) { const p = Gd.at(Gd.rp, a); D.poles.push({ d: p[0], z: p[1], h: 6.6 }); }
    for (let i = np; i + 1 < np + Gd.poles.length; i++) { const a = D.poles[i], c = D.poles[i + 1]; D.strings.push({ a: [a.d, a.z], b: [c.d, c.z], h: a.h, sag: 0.8, n: 6, chase: true }); }
    for (const a of Gd.cross) { const p = Gd.at(Gd.rp, a), q = Gd.at(Gd.ri, a); D.poles.push({ d: q[0], z: q[1], h: 6.6 }); D.strings.push({ a: p, b: q, h: 6.6, sag: 0.6, n: 5, chase: true }); } }
  // (and FESTOONS OVER THE SOUTH WALK, from the garden toward the temple front: four pairs of white poles 5.2 m
  // either side of the walk's middle (2.3 m outside its lamp posts' lines), 12 m apart; a string of seven lamps
  // across the walk at every pair, running in the chase, and strings of eight along both sides)
  { const np = D.poles.length;
    for (let z = S.z - 44; z > S.z - 90; z -= 12) for (const sg of [-1, 1]) D.poles.push({ d: P.DM + sg * 5.2, z, h: 6.6 });
    for (let i = np; i < D.poles.length; i += 2) {
      const a = D.poles[i], c = D.poles[i + 1];
      D.strings.push({ a: [a.d, a.z], b: [c.d, c.z], h: 6.6, sag: 0.9, n: 7, chase: true });
      if (i + 2 < D.poles.length) for (const k of [0, 1]) D.strings.push({ a: [D.poles[i + k].d, D.poles[i + k].z], b: [D.poles[i + 2 + k].d, D.poles[i + 2 + k].z], h: 6.6, sag: 1.0, n: 8 });
    } }
  // the lamp posts: either side of every walk by turns, 2.9 m from its middle, about every 7.5 m; eight round
  // every ring; none where the ground is taken, none within 5 m of the line
  D.walkLamps = [];
  const post = (d, z) => { if (!blocked(d, z, -1.2) && P.gapD(d, 3.9, z, 8) > 5) D.walkLamps.push({ d, z }); };
  for (const w of P.walks) for (let i = 0, side = 1; i + 1 < w.length; i++) {
    const a = w[i], c = w[i + 1], len = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.round(len / 7.5)), ux = (c[0] - a[0]) / len, uz = (c[1] - a[1]) / len;
    for (let k = 0; k < n; k++, side = -side) { const t = (k + 0.5) / n; post(lerp(a[0], c[0], t) - uz * 2.9 * side, lerp(a[1], c[1], t) + ux * 2.9 * side); }
  }
  for (const q of P.rounds) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; post(q.d + (q.r + 2.6) * Math.cos(a), q.z + (q.r + 2.6) * Math.sin(a)); }
  // the parterres (a clipped square round a bed): three by the bandstand as before, four by each other round point
  // (THE LATER BEDS ARE A LIST OF THEIR OWN, D.bedsNew, drawn and flowered AFTER the older beds (D.beds) and
  // from a stream of their own, so that no older bed's flowers are dealt anew by them: the parterres' beds here)
  D.bedsNew = [];
  D.parterres = [{ d: Lw.d + 15, z: Lw.z - 18 }, { d: Lw.d - 15, z: Lw.z + 17 }, { d: Lw.d + 15, z: Lw.z + 17 }];
  for (const q of D.parterres) D.bedsNew.push({ d: q.d, z: q.z, rx: 2.4, rz: 2.4, col: rl.int(0, 3) });
  for (const q of [R2, R3]) for (let k = 0; k < 4; k++) {
    const a = k / 4 * TAU, d = q.d + 25 * Math.cos(a), z = q.z + 25 * Math.sin(a), col = rp.int(0, 3);
    if (blocked(d, z, 7)) continue;
    D.parterres.push({ d, z }); D.bedsNew.push({ d, z, rx: 2.4, rz: 2.4, col });
  }
  // the benches: four round every ring between its lamps, each facing the middle (plain garden benches, empty)
  D.benches = [];
  for (const q of P.rounds) for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * TAU + (q === P.rounds[0] ? Math.PI / 4 : 0); D.benches.push({ d: q.d + (q.r + 3.4) * Math.cos(a), z: q.z + (q.r + 3.4) * Math.sin(a), a }); }
  // (through: a lime grown up through the swing boats' frame, which the frame's rule lets stand)
  const tree = (d, z, h, rq = rt, through = false) => {
    const x = P.X(d), cr = h * 0.36, g = P.gapXZ(x, z, 24), rot = rq.range(0, TAU);
    // (no lime within the swing boats' frames, the round points' rings or the parterres)
    if (!through) for (const q of P.boats) { if (Math.abs(z - q.z) < q.n * q.pitch / 2 + 3 + cr && Math.abs(d - q.d) < 4 * q.sc + 1.5 + cr) return; }
    for (const q of P.rounds) if (Math.hypot(d - q.d, z - q.z) < q.r + 4 + cr * 0.5) return;
    for (const q of D.parterres) if (Math.hypot(d - q.d, z - q.z) < 8 + cr) return;
    // (nor on a walk's middle)
    for (const w of P.walks) for (let i = 0; i + 1 < w.length; i++) {
      const a = w[i], c = w[i + 1], vx = c[0] - a[0], vz = c[1] - a[1], t = clamp(((d - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz), 0, 1);
      if (Math.hypot(d - a[0] - vx * t, z - a[1] - vz * t) < 4.2) return;
    }
    // (no lime on the west range's ground nor between its fronts and the avenue)
    if (d > -222 - cr && d < -160 && z > zw - 30 - cr && z < zw + 194 + cr) return;
    if (g.dist < 9 + cr * 0.5 && g.y < h + 4) return;
    // BY ITS LEAVES: a lime within 70 m of the line is drawn with a near shape (which of
    // the two, its own number in the list says); it stands at its drawn height when every leaf at the wind's
    // bound keeps 2.55 m of air from the line; else it is a younger tree of 0.85, 0.7 or 0.56 of that height,
    // the first that does; else it does not stand
    let hh = h;
    if (P.gapXZ(x, z, 70).dist < 70) { hh = 0; for (const k of [1, 0.85, 0.7, 0.56]) if (limeClear(P, x, z, h * k, D.trees.length % 2, 2.55)) { hh = h * k; break; } if (!hh) return; }
    // clear of the wheel's sweep, the switchback's bents and trains, the swing's reach, the drum and the tent
    const wx = (x - W.c[0]) * W.ex + (z - W.c[2]) * W.ez, wo = (x - W.c[0]) * W.nx + (z - W.c[2]) * W.nz;
    if (Math.abs(wx) < W.R + cr + 3 && wo > -8 - cr && wo < 20 + cr) return;
    if (z < T.zN + T.rT + 5 + cr && z > T.zS - T.rT - 5 - cr && (Math.abs(d - T.dE) < 4.5 + cr || Math.abs(d - T.dW) < 4.5 + cr)) return;
    if ((z > T.zN - 2 || z < T.zS + 2) && Math.abs(Math.hypot(d - (T.dE + T.dW) / 2, z - (z > 0 ? T.zN : T.zS)) - T.rT) < 5 + cr) return;
    if (Math.hypot(d - S.d, z - S.z) < S.reach + cr + 3) return;
    if (Math.hypot(d - P.drum.d, z - P.drum.z) < P.drum.r + cr + 4) return;
    if (Math.abs(d - P.tent.d) < 21 + cr && Math.abs(z - P.tent.z) < 29 + cr) return;
    for (const q of D.booths) if (Math.abs(d - q.d) < 4 + cr * 0.7 && Math.abs(z - q.z) < 4 + cr * 0.7) return;
    D.trees.push({ d, z, h: hh, cr: hh * 0.36, rot });
  };
  // the seam's double row; the infield between the runs; beside the wheel; the fair's far edges
  // (along the street's length the row is single and wide apart, so that the fair is seen across the gone row's lots)
  for (let z = 176, k = 0; z > -190; z -= 15, k++) {
    // (both places of this step draw their dice; then the open stretch beside the gone row says which stand)
    const open = z > P.stone.sqN - 20 && z < 200;
    const a = [-8.5 + rt.range(-0.6, 0.6), z + rt.range(-1.5, 1.5), rt.range(12, 15)], c = [-16 + rt.range(-0.6, 0.6), z - 7.5 + rt.range(-1.5, 1.5), rt.range(12, 15)];
    if (!open || k % 2 === 0) tree(a[0], a[1], a[2]);
    if (k % 2 && !open) tree(c[0], c[1], c[2]);
  }
  for (let z = T.zN - 6; z > T.zS + 4; z -= 15) tree((T.dE + T.dW) / 2 + rt.range(-2, 2), z + rt.range(-3, 3), rt.range(15, 20));
  for (let i = 0; i < 26; i++) tree(rt.range(-128, -24), rt.range(58, 172), rt.range(12, 18));
  // (the west edge's row of limes, behind the west range)
  for (let z = 190; z > -196; z -= 14) tree(-232 + rt.range(-3, 3), z + rt.range(-3, 3), rt.range(13, 19));
  // (along the south edge one lime stands in each gap between the wing's fronts, none before a front)
  for (const gd of [-19, -73, -127, -181]) tree(gd + rt.range(-2, 2), -205 + rt.range(-3, 3), rt.range(13, 18));
  for (let d = -152; d > -216; d -= 14) tree(d + rt.range(-3, 3), 186 + rt.range(-5, 5), rt.range(13, 19));
  for (let i = 0; i < 16; i++) { const d = rt.range(-212, -160), z = rt.range(-176, 170), h = rt.range(12, 17); tree(d, z, h); }
  // (THE OLD LIMES OF THE CLOSE: one at each end of the swing boats' frame, grown up through it, 14 m from the
  // line; one in the close's south-east corner; three over the north hedge between the festoon's poles; one west)
  { const Bq = P.boats[0], e = Bq.n * Bq.pitch / 2 + 1.4;
    for (const [d, z, th] of [[Bq.d, Bq.z + e, 1], [Bq.d, Bq.z - e, 1], [Fo.d1 - 5.4, Fo.z0 + 4.6, 0], [20.2, 252.6, 0], [-2.8, 252.9, 0], [-25.8, 252.6, 0], [-50, 232, 0]]) {
      const jd = rf.range(-0.4, 0.4), jz = rf.range(-0.4, 0.4), h = rf.range(13, 16);
      tree(d + (th ? 0 : jd), z + (th ? 0 : jz), h, rf, !!th);
    } }
  // (THE GARDEN'S YOUNG LIMES, six round the south half, 8.4 to 9.6 m tall, their crowns'
  // tops 3 m and more under the line; the garden's own stream; every place draws its dice before the rules decide)
  { const rg = P.R.garden;
    for (const a of [14, 66, 92, 118, 150, 170]) { const h = rg.range(8.4, 9.6), ja = rg.range(-3, 3), p = Gd.at(Gd.rl, a + ja); tree(p[0], p[1], h, rg); } }
  // gas standards along the stone kerb of the seam (d = 6): one every 15 m exactly, none within 4.5 m of the line,
  // none within 12 m of a wagon standing on that kerb
  for (let z = 180; z > -190; z -= 15) { const g = P.gapXZ(P.X(6), z, 12); if (g.dist > 4.5 && !P.trailers.some((q) => q.seam && Math.abs(q.z - z) < 12)) D.gas.push({ d: 6, z }); }
  // THE SQUARE ON ITS FEAST EVENING (the stone half's own dress, plain and sparser than the fair's): gas standards
  // in a row along its north and its south side, none within 6 m of the line; two great gas standards of three
  // mantles on stone feet where the dry fountains stood (no basin anywhere in the stone half); young clipped
  // trees in tubs (every one a ball) in a row before the palace either side of its steps and along the bank's flank
  const Bs = P.stone, gasAt = (d, z) => { if (P.gapXZ(P.X(d), z, 12).dist > 6) D.gas.push({ d, z, sq: true }); };
  for (let d = 62; d <= 104; d += 14) gasAt(d, Bs.sqN - 7);
  for (let d = 14; d <= 104; d += 15) if (Math.abs(d - P.DS) > 12) gasAt(d, Bs.sqS + 8);
  // THE LEFT STREET: where the west row has gone its street is left: its kerb, its pavement and its
  // gas standards, on the kerb 6.2 m west of the line, one every 26 m from the plots' head to the half palace's
  // yard (none before the palace's porch; the east side is lit by the wagons' lanterns)
  for (let z = 183; z > Bs.down.z + Bs.down.w / 2 + 4; z -= 26) gasAt(P.DS - 7.0, z);
  // WHERE THE LANE MEETS THE STREET: the street's stones, its kerbs and its verge begin
  // at the plots' head (z 198.5: the ground's painting and dressInto), and a gas standard stands behind each kerb
  // there, 7.0 m west and 8.6 m east of the line, so that the lane's end lies in their two pools of light
  P.streetHead = 198.5;
  gasAt(P.DS - 7.0, P.streetHead - 2); gasAt(P.DS + 8.6, P.streetHead - 2);
  D.grand = [{ d: P.DS + 19, z: P.ZC - 8 }, { d: P.DS + 41, z: P.ZC + 9 }].filter((q) => P.gapXZ(P.X(q.d), q.z, 12).dist > 7);
  D.tubs = [];
  for (const sg of [-1, 1]) for (const o of [20, 27, 34]) D.tubs.push({ d: P.DS + sg * o, z: Bs.sqS + 5, ball: true });
  for (let d = 64; d <= 100; d += 9) D.tubs.push({ d, z: Bs.sqN - 3, ball: true });
  D.tubs = D.tubs.filter((q) => P.gapXZ(P.X(q.d), q.z, 12).dist > 6);
  // clipped hedges along the fair's side of the seam walk, broken where paths and the line cross (none whose
  // middle lies within 12 m of the crossing: no hedge stands under or beside the line there)
  for (let z = 176; z > -188; z -= 13) { if (Math.abs(z - 6.5 - P.ZC) < 12) continue; D.hedges.push({ d: -5.2, z: z - 6.5, w: 1.3, len: 10.4, h: 1.25 }); }
  // the fair's ground ENDS AT A HEDGE (and a ditch and the fields beyond it, in the ground's painting): along its
  // north edge and its west edge either side of the west range; THE CLOSE BY THE LANE IS HEDGED ALL ROUND, thick
  // and clipped (2 m through, 2 m high), with the open gate across its cut north-east corner and no hedge
  // between it and the fair's own lawn
  D.hedges.push({ d: -151.5, z: 198, w: 180.7, len: 1.7, h: 1.7, edge: true });
  D.hedges.push({ d: -241, z: -5, w: 1.7, len: 406, h: 1.7, edge: true });
  D.hedges.push({ d: Fo.d1, z: (Fo.z0 + Fo.z1 - Fo.ch) / 2 - 0.6, w: 2, len: Fo.z1 - Fo.ch - Fo.z0 - 1.2, h: 2, edge: true, thick: true });
  D.hedges.push({ d: (Fo.d0 + Fo.d1 - Fo.ch) / 2 - 0.6, z: Fo.z1, w: Fo.d1 - Fo.ch - Fo.d0 - 1.2, len: 2, h: 2, edge: true, thick: true }, { d: Fo.d0, z: (198 + Fo.z1) / 2, w: 1.7, len: Fo.z1 - 198, h: 1.9, edge: true });
  D.hedges.push({ d: (Fo.d1 - 8) / 2, z: Fo.z0, w: Fo.d1 + 8 + 2, len: 2, h: 2, edge: true, thick: true }, { d: -8, z: 201, w: 1.7, len: 6, h: 1.9, edge: true });
  // flower beds: long ones by the hedge, round ones at the wheel's foot and by the swing, one in the middle of
  // each round point but the bandstand's (with a tall standard of five lamps in it: D.clusters), and a long one
  // inside the close's east hedge either side of the boats
  for (let z = 150; z > -170; z -= 26) { const bc = rbd.int(0, 3); if (Math.abs(z - 13 - P.ZC) < 12) continue; D.beds.push({ d: -12.2, z: z - 13, rx: 1.7, rz: 5.5, col: bc }); }
  for (const sg of [-1, 1]) D.beds.push({ d: W.d - W.nrm[0] * 17 + W.e[0] * sg * 12, z: W.z - W.nrm[1] * 17 + W.e[1] * sg * 12, rx: 4, rz: 4, col: sg > 0 ? 1 : 3 });
  D.clusters = [];
  for (const q of [R2, R3]) { D.beds.push({ d: q.d, z: q.z, rx: 3.4, rz: 3.4, col: q === R2 ? 2 : 0 }); D.clusters.push({ d: q.d, z: q.z }); }
  D.beds.push({ d: Fo.d1 - 2.3, z: Fo.z0 + 3.2, rx: 1.1, rz: 2.2, col: 1 }, { d: Fo.d1 - 2.3, z: Fo.z1 - Fo.ch - 4.4, rx: 1.1, rz: 2.4, col: 3 });
  return P;
}

// THE FAIR'S LIT EDGE ALONG THE SEAM, SEEN FROM THE LEFT STREET ACROSS THE GONE ROW'S LOTS (D.seam). Laid AFTER
// the whole older plan, from a stream of its own, into lists of its own: no older lime, booth, pole, string or
// lamp is dealt anew by it, and none of the older rules reads these lists.
//   limes: TALL OLD LIMES in the seam row's empty places beside the gone row (where the older row stands 30 m
//     apart): 18.5 to 21 m at z 131 and 71, lower toward the square (17 to 19 m at z 41, 15 to 17 m at z 11); each
//     wears the far shape (the world draws them in a set of their own) and stands only where every leaf at the
//     wind's bound keeps 12 m and more from the line and no older lime's trunk is within 9 m. Their dice are
//     drawn before the rules decide.
//   rings: THE LIMES ARE HUNG WITH LAMPS IN THE CHASE: round each tall lime five rings of lamps on its crown's
//     outer leaves (from a third of its height to its head), and three rings round the crown of every older lime
//     of the row beside the lots (at its widest and above); each ring's radius is the shape's own reach at that
//     height, less a fifth; a lamp every 2 m.
//   swags: FESTOONS FROM TREE TO TREE, and from mast to mast (below): see at the list.
//   masts: north of the limes, before the great swing boats, FOUR TALL WHITE MASTS in the hedge's own line
//     (5.2 m west of the seam's middle, a metre outside the boats' sweep), 13 m apart, each with a lamp and a
//     pennant at its head; from mast to mast three festoons, one over the other, running in the chase.
//   booths: TWO BOOTHS with striped awnings under the limes, facing the seam and the street beyond it (at z 124
//     and z 46, between the long flower beds): rooted like the rest, nothing on wheels.
export function planSeam(P) {
  const D = P.dress, r = makeRng(hashSeed('half-city-of-the-fair:seam2:' + P.seed)), Sm = D.seam = { limes: [], rings: [], swags: [], masts: [], booths: [] };
  const ringOf = (t, R, k, n0) => { const s = t.h / 15, rad = R.bands[k] * s * 0.82, y = ((k + 0.5) * 0.75 - 15 * LIME_SINK) * s; Sm.rings.push({ d: t.d, z: t.z, y, r: rad, n: Math.max(n0, Math.round(TAU * rad / 2.0)), ph: t.rot }); };
  // (v: the shape each wears: -1 the far shape; 0 or 1 would be a near shape, card by card: none wears one, for
  // the triangles' sake)
  for (const [z0, h0, h1, v] of [[131, 18.5, 21, -1], [71, 18.5, 21, -1], [41, 17, 19, -1], [11, 15, 17, -1]]) {
    const d = -9.3 + r.range(-0.5, 0.5), z = z0 + r.range(-1.5, 1.5), h = r.range(h0, h1), rot = r.range(0, TAU);
    if (!limeClear(P, P.X(d), z, h, v, 12) || D.trees.some((t) => Math.hypot(t.d - d, t.z - z) < 9)) continue;
    const t = { d, z, h, rot, v }; Sm.limes.push(t);
    for (const k of v === 1 ? [8, 12, 16, 19, 21] : [5, 9, 13, 17, 20]) ringOf(t, v < 0 ? P.limes.reachFar : P.limes.reach[v], k, 8);
  }
  // (the older limes of the row beside the lots: one ring each, at the height where its own near shape is widest)
  D.trees.forEach((t, i) => {
    if (t.d < -10.5 || t.d > -7 || t.z > 152 || t.z < P.stone.sqN - 22) return;
    const R = P.limes.reach[i % 2]; let k = 6; for (let j = 7; j <= 15; j++) if (R.bands[j] > R.bands[k]) k = j;
    ringOf(t, R, k, 8); for (const j of [k + 4, k + 8]) if (R.bands[j]) ringOf(t, R, j, 8);
  });
  // swags: FESTOONS FROM TREE TO TREE IN THE CHASE, on the row's street side: from each lime's ring (the tall
  // limes' middle ring) to the next lime's ring, two swags, one deeper than the other, a lamp to the metre; none
  // where the crowns' rings meet, none longer than 30 m, none with an end nearer the line than 14 m
  const row = [];
  for (const q of Sm.rings) { const o = row.find((t) => t.d === q.d && t.z === q.z); if (!o) row.push({ d: q.d, z: q.z, y: q.y, r: q.r, n: 1 }); else if (++o.n === 2) { o.y = q.y; o.r = q.r; } }
  row.sort((a, c) => c.z - a.z);
  for (let i = 0; i + 1 < row.length; i++) {
    const A = row[i], C = row[i + 1], a = [A.d + A.r * 0.7, A.z - A.r * 0.7], c = [C.d + C.r * 0.7, C.z + C.r * 0.7], len = a[1] - c[1];
    if (len < 2.5 || len > 30 || P.gapXZ(P.X(a[0]), a[1], 40).dist < 14 || P.gapXZ(P.X(c[0]), c[1], 40).dist < 14) continue;
    const n = Math.max(3, Math.round(len / 0.75));
    Sm.swags.push({ a, b: c, ya: A.y, yb: C.y, sag: 0.9 + len * 0.07, n }, { a, b: c, ya: A.y - 0.5, yb: C.y - 0.5, sag: 2.2 + len * 0.13, n });
  }
  for (const z of [189, 176, 163, 150]) Sm.masts.push({ d: -5.2, z, h: 11, col: Sm.masts.length % 4 });
  for (let i = 0; i + 1 < Sm.masts.length; i++) { const a = Sm.masts[i], c = Sm.masts[i + 1]; for (const [h, sag] of [[10.7, 1.5], [8.6, 1.4], [6.5, 1.3]]) Sm.swags.push({ a: [a.d, a.z], b: [c.d, c.z], ya: h, yb: h, sag, n: 14 }); }
  const awn = [1, 2];
  [124, 46].forEach((z, k) => { const h = r.range(3.4, 4.2), star = r() < 0.5, roof = r() < 0.5 ? 'hip' : 'gable'; Sm.booths.push({ d: -13.2, z, side: -1, h, col: awn[k], star, roof }); });
  return P;
}

// a near building on the left street's stone side, between the square and the street's head (the street's own
// fronts), and the end of it that looks up the street or toward it (+1 or -1 along its frame's X)
const streetFront = (P, H) => !!H.near && H.d > P.DS && H.d < P.DS + 60 && H.z > P.stone.sqN - 12 && H.z < P.streetHead + 30;
const streetEnd = (P, F) => { const o0 = F.p(0, 0, 0), o1 = F.p(1, 0, 0); return (o1[2] - o0[2]) - P.hand * (o1[0] - o0[0]) > 0 ? 1 : -1; };
// THE STREET'S OWN LEFT THINGS AND THE TOWN'S PIECES ON CRIBS (D.street). Laid after everything older, by the
// plan's own measures alone: NO DIE IS DRAWN here, and no older list is read by anything older.
//   pieces: ON THE FLOOR OF EACH EMPTIED LOT of the street's fair side, THE HOUSE'S OWN PIECES ON CRIBS, waiting
//     for their wagon: one to a lot, three on a lot longer than 40 m; 5.6 m inside the house's street wall (14 m
//     and more from the street's middle), clear of the bearers' inner lines; in turn down the street: a column's
//     two drums in cradles, a length of cornice with a length of balustrade, a glazed window in its stone frame
//     standing propped, a small copper cupola; each with a storm lantern on a crook.
//   tubs: a low old tub with a clipped ball either side of each lot's doorstep.
//   trough, benches, bollards: in the gaps between the lots (and the palace's yard), on the pavement: a dry stone
//     horse trough in the first gap from the north, a stone bench in the second, two stone bollards at the kerb
//     in each of the first three.
//   under: MORE LANTERN FLAMES UNDER EACH OF THE STREET'S FRONTS (and under the half palace's street front): a
//     row hung from the skids along the front's foot and along the end it shows the street, one every 3.3 m.
//   doors: a storm lantern on an iron bracket either side of each plain front's door.
export function planStreet(P) {
  const D = P.dress, B = P.stone, DS = P.DS, St = D.street = { pieces: [], tubs: [], bollards: [], trough: null, benches: [], under: [], doors: [] };
  const lots = B.plots.filter((q) => q.d < DS).map((q) => [q.d - q.w / 2, q.d + q.w / 2, q.z - q.dp / 2, q.z + q.dp / 2]).concat(B.gone.map((q) => [q.d - q.dp / 2, q.d + q.dp / 2, q.z - q.w / 2, q.z + q.w / 2])).sort((a, c) => c[3] - a[3]);
  let kind = 0;
  for (const [, d1, z0, z1] of lots) {
    const c0 = z0 + 1.2, c1 = z1 - 1.2, zm = (z0 + z1) / 2;
    for (const f of c1 - c0 > 40 ? [0.85, 0.62, 0.2] : [0.72]) { St.pieces.push({ d: d1 - 1.2 - 5.6, z: lerp(c0, c1, f), kind: kind % 4, tint: 0.24 + (kind % 3) * 0.2 }); kind++; }
    for (const sg of [-1, 1]) St.tubs.push({ d: d1 - 0.75, z: zm + sg * 2.75 });
  }
  const iv = lots.map((q) => [q[2], q[3]]).concat([[B.yard.z0, B.yard.z1]]).sort((a, c) => c[1] - a[1]);
  let g = 0;
  for (let i = 0; i + 1 < iv.length; i++) {
    const z1 = iv[i][0], z0 = iv[i + 1][1], w = z1 - z0, zm = (z0 + z1) / 2; if (w < 3 || w > 16) continue;
    if (g === 0) St.trough = { d: DS - 7.1, z: zm }; else if (g === 1) St.benches.push({ d: DS - 7.6, z: zm });
    if (g < 3) for (const sg of [-1, 1]) St.bollards.push({ d: DS - 5.95, z: zm + sg * Math.min(1.6, w / 2 - 0.4) });
    g++;
  }
  for (const H of B.houses) {
    if (!streetFront(P, H)) continue;
    const F = frameAt(P, H.d, H.z, H.face), hw = H.w / 2, hd = H.dp / 2, lift = H.lift || 1.5, y = lift - SKID, sxS = streetEnd(P, F), zf = hd + (H.portico ? 2.85 : -0.35);
    if (!H.half) for (let i = 0, n = Math.max(2, Math.round(2 * (hw - 1.5) / 3.3)); i <= n; i++) St.under.push(F.p(lerp(-hw + 1.5, hw - 1.5, i / n), y, zf));
    for (let i = 0, n = Math.max(2, Math.round(2 * (hd - 1.5) / 3.3)); i <= n; i++) St.under.push(F.p(sxS * (hw - 0.35), y, lerp(-hd + 1.5, hd - 1.5, i / n)));
    if (!H.half && !H.kind) for (const e of [-1, 1]) St.doors.push({ a: F.p(e * 2.6, lift + 3.9, hd), b: F.p(e * 2.6, lift + 3.95, hd + 0.6) });
  }
  { const Dn = B.down, F = frameAt(P, Dn.d, Dn.z, Dn.face), hw = Dn.w / 2, y = Dn.lift - SKID;
    for (let i = 0, n = Math.max(2, Math.round(2 * (hw - 1.5) / 3.3)); i <= n; i++) St.under.push(F.p(lerp(-hw + 1.5, hw - 1.5, i / n), y, Dn.dp / 2 - 0.35)); }
  return P;
}

// the whole plan, in the order of its steps (each step is plain arithmetic; the world breathes between them)
// (planSeam and planStreet are the last steps: they lay their own lists after everything older)
export const PLAN_STEPS = [planRoute, planTrack, planMovers, planStone, planTrailers, (P) => planBents(P), planBoats, planFire, planLimes, planDress, planSeam, planStreet];

// ---------------------------------------------------------------- the film's law: marks on the line, pace, gaze
// The marks are metres along the line where it meets places of the plan (sOf: the line's nearest point to a place
// of the plan). The pace and every gaze pull begin and end at marks; every pull aims at a place the plan names, by
// the plan's own figures. The same law is replayed under node for the counts.
export function planFilm(P) {
  const Lp = P.L, sOf = (d, z, from = 0) => { let best = 1e9, bi = 0; const x = P.X(d); for (let i = Math.floor(from * 2); i < P.n; i++) { const dx = P.line[i * 3] - x, dz = P.line[i * 3 + 2] - z, q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } } return bi * 0.5; };
  const T = P.track, S = P.swing, Tn = P.tent, Hh = P.stone.hall, Wh = P.wheel, T1 = P.turn, B0 = P.boats[0], B1 = P.boats[1], B2 = P.boats[2];
  // THE TURNS' OWN ENDS: the turn across the square, the turn down the midway, the round of the swing, the avenue's
  // end where the rising arc begins, and the arc's end where the line joins the gallery
  const sSq = sOf(P.DS, T1.z), sSqEnd = sOf(T1.d, P.ZC, sSq), sMid = sOf(P.DM + P.Rm, P.ZC, sSqEnd), sMidEnd = sOf(P.DM, P.ZC - P.Rm, sMid);
  const sSw = sOf(P.DM, S.z, sMidEnd), sSwEnd = sOf(P.DA, S.z, sSw + 20), sArc = sOf(P.DA, P.arc.C[1], sSwEnd), sJ = Lp - (Wh.sEnd - Wh.sJ);
  // ON THE LANE AND THE STREET: the town's edge (z = zTown, where the lane runs into the street: the lane's boats
  // stand abeam there, their beam's middle 6 m behind the lens); where the far end of the lane's boats' beam is
  // abeam (half the row's length south of its middle); the same for the corner's great boats
  const sTow = sOf(P.DS, P.zTown), sBoat = sOf(P.DS, B0.z - B0.n * B0.pitch / 2), sHalf = sOf(P.DS, B1.z - B1.n * B1.pitch / 2);
  // where the line, turning across the square, leaves the street over the outer edge of its west pavement
  // (paveW metres west of the street's middle: a turn of radius r has gone r * acos(1 - paveW / r) metres there)
  const sKerb = sSq + T1.r * Math.acos(1 - P.paveW / T1.r);
  // where the line passes under the switchback's west run (d = dW) on the crossing; the round's south point
  // (a quarter of the round); where the tent's king pole is abeam on the avenue; where the avenue meets the
  // crossing's own line carried west (z = ZC)
  const sUnder = sOf(T.dW, P.ZC, sSqEnd), sSouth = sOf(S.d, S.z - P.RS, sSw), sTent = sOf(P.DA, Tn.z, sSwEnd), sCross = sOf(P.DA, P.ZC, sSwEnd);
  // (and where the line, on the crossing, is midway between the switchback's two runs)
  const sInfield = sOf((T.dE + T.dW) / 2, P.ZC, sSqEnd);
  // (and where the swing's own pull begins: 8 m down the midway's straight; and where its coming ends: 32 m on)
  const sAppr = sMidEnd + 8, sFull = sAppr + 32;
  // THE PACE (only its shape matters: the engine fits it to the film's length). The lane is flown 0.15 quicker
  // than the street, eased off between the two rows of boats' far ends (sBoat, sHalf). Each turn is flown slower
  // by 15 m over its radius (0.375 at the 40 m turns, 0.44 at the midway's 34 m, 0.625 round the swing's 24 m:
  // the tighter the turn, the slower), eased in and out over 24 m, the spacing of the line's knots on its
  // straights. The midway turn's slowing begins midway between the switchback's two runs; the round's begins
  // half-way down the midway's straight, so it never meets the slowing of the turn before it.
  const EASE = 24, win = (s, a, b2) => smoothstep(a - EASE, a + EASE * 0.4, s) * (1 - smoothstep(b2 - EASE * 0.4, b2 + EASE, s)), slow = (r) => 15 / r;
  const pace = (u) => { const s = u * Lp; return 1.08 + 0.15 * (1 - smoothstep(sBoat, sHalf, s)) - slow(T1.r) * win(s, sSq, sSqEnd) - slow(P.Rm) * win(s, sInfield, sMidEnd) - slow(P.RS) * win(s, (sMidEnd + sSw) / 2, sSwEnd) - slow(P.arc.Ra) * win(s, sArc, sJ); };
  // a row of boats is aimed at its beam's middle, at the middle height of its rods (where its boats swing)
  const row = (q) => P.at(q.d, q.H - q.L / 2, q.z);
  // THE SWING'S PULL: its target, and its aim while it comes. The pull's share of the gaze should come as
  // want = 1 - (1 - x / 32) ^ 1.5 of its full (x: metres past sAppr: quick at first, where the swing stands nearly
  // ahead, easing out to the full at sFull); the engine's bell gives have = smoothstep over the bell's own coming
  // (sCome metres). Where want is the lesser, swingAim(u, out) writes into out a point as far off as the swing, on
  // a bearing between the line's own look (the chord to 16 m ahead, the camera's look ahead) and the swing, the
  // swing's share of it want / have; elsewhere, and from sFull on, it answers false: the aim is the target itself
  const swingAt = [S.c[0], (S.crownY + S.crownY - S.chain * Math.cos(S.fling)) / 2, S.c[2]], _eye = [0, 0, 0], _fwd = [0, 0, 0];
  const lineAt = (s, o) => { const q = clamp(s * 2, 0, P.n - 1.001), i = Math.floor(q), t = q - i; for (let k = 0; k < 3; k++) o[k] = lerp(P.line[i * 3 + k], P.line[i * 3 + 3 + k], t); return o; };
  const sCome = (sSwEnd - 2 - sAppr) * 0.19;
  const swingAim = (u, out) => {
    const s = u * Lp; if (s <= sAppr || s >= sFull) return false;
    const want = 1 - Math.pow(1 - (s - sAppr) / (sFull - sAppr), 1.5), have = smoothstep(sAppr, sAppr + sCome, s); if (want >= have) return false;
    const k = want / have; lineAt(s, _eye); lineAt(Math.min(Lp, s + 16), _fwd);
    const fx = _fwd[0] - _eye[0], fy = _fwd[1] - _eye[1], fz = _fwd[2] - _eye[2], fl = Math.hypot(fx, fy, fz) || 1;
    const tx = swingAt[0] - _eye[0], ty = swingAt[1] - _eye[1], tz = swingAt[2] - _eye[2], tl = Math.hypot(tx, ty, tz) || 1;
    const mx = lerp(fx / fl, tx / tl, k), my = lerp(fy / fl, ty / tl, k), mz = lerp(fz / fl, tz / tl, k), ml = Math.hypot(mx, my, mz) || 1;
    out[0] = _eye[0] + mx / ml * tl; out[1] = _eye[1] + my / ml * tl; out[2] = _eye[2] + mz / ml * tl;
    return true;
  };
  // ONE PULL AT A TIME: each begins at the mark where the one before it ends, or later; none is in force with
  // another (the engine's own bell is nought outside a pull's two marks). A pull's weight is the share of the gaze
  // it takes at its full; its fade is the share of its own length over which it comes in and goes out.
  const pulls = [
    // the lane's swing boats, the fair's lit edge: from the entry (the engine lets a pull in over the line's
    // first twenty-fifth) to the town's edge, where they stand abeam
    { at: row(B0), from: 0, to: sTow / Lp, weight: 0.4, fade: 0.4 },
    // THE FAIR'S NORTH-EAST CORNER across the emptied plots: the great swing boats' lit beam there: from the
    // town's edge until that beam's far end is abeam
    { at: row(B1), from: sTow / Lp, to: sHalf / Lp, weight: 0.4, fade: 0.45 },
    // the east run's crest where it stands over the crossing's line: down the whole street and into the turn,
    // until the line leaves the street
    { at: P.at(T.dE, T.yAt(T.sPE), P.ZC), from: sHalf / Lp, to: sKerb / Lp, weight: 0.76, fade: 0.22 },
    // the swing's axis at the height of its flying seats: from under the switchback's west run, round the turn
    // and onto the midway's straight (sAppr: 8 m past the turn's end; the swing stands whole in the picture there
    // by the line's own look)
    // (a lighter pull than before, with a longer share of fade: it comes in over 30 m at the rate it always did)
    { at: [S.c[0], S.crownY - S.chain * Math.cos(S.fling), S.c[2]], from: sUnder / Lp, to: sAppr / Lp, weight: 0.33, fade: 0.5 },
    // THE SWING ITSELF, DOWN THE MIDWAY AND ROUND THE ROUND: its axis half-way between its flying seats and its
    // crown, from the midway's straight to 2 m before the round's end. In the round the line passes 24 m from
    // the axis and the seats fly 15 m out: the gaze is held on the ride (its mast, its whole crown and the seats
    // that fly past the lens) and never left on an edge of it, 73 parts in a hundred, which keeps the gaze within
    // 75 degrees of the heading (the camera's law); it goes out over the last 22 to 25 m before its end.
    // IT COMES GENTLY, OVER 32 m (sAppr to sFull): the engine's bell has one fade for a pull's coming and its
    // going, so the longer coming is said by the pull's aim (swingAim, above): the bell comes in over its own 22
    // to 25 m as before, and from some 10 m in the aim is held back between the line's own look and the swing, so
    // that the pull's share eases out to its full at 32 m; from sFull on the aim is the swing itself and the pull
    // is at its full, as it always was.
    { at: swingAt, aim: swingAim, from: sAppr / Lp, to: (sSwEnd - 2) / Lp, weight: 0.73, fade: 0.19 },
    // the tent's ring at the height of its first trapeze's bar: from the round's end up the avenue until the
    // tent's king pole is abeam (a short window: a light pull, so that it comes and goes no quicker than before)
    { at: [Tn.c[0], Tn.traps[0].y - Tn.traps[0].len, Tn.c[2]], from: (sSwEnd - 2) / Lp, to: sTent / Lp, weight: 0.24, fade: 0.5 },
    // the domed hall at its own place, at the height of its cornice: from the tent abeam to the crossing's line
    { at: P.at(Hh.d, Hh.cornice, Hh.z), from: sTent / Lp, to: sCross / Lp, weight: 0.4, fade: 0.5 },
    // THE WHEEL'S HUB: from the crossing's line, up the avenue's last part and round the rising arc, to where the
    // line joins the gallery (it is nought there: the gallery's own look is the line's)
    { at: [Wh.c[0], Wh.c[1], Wh.c[2]], from: sCross / Lp, to: sJ / Lp, weight: 0.55, fade: 0.4 },
  ];
  return { marks: { sBoat, sTow, sHalf, sKerb, sSq, sSqEnd, sUnder, sMid, sMidEnd, sAppr, sFull, sSw, sSouth, sSwEnd, sTent, sCross, sArc, sJ }, pace, pulls };
}

// ---------------------------------------------------------------- colours (linear) and small helpers of the makers
const hex = (s) => { const c = new THREE.Color(s); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// the stone half's pennants: slate and copper green, a little paler than the roofs they fly over
const STONE_PEN = [[0.16, 0.2, 0.25], [0.13, 0.42, 0.33]];
export const COL = {
  lime: hex('#e2cc9c'), marble: hex('#f0ece2'), cement: hex('#a9a69d'), slate: hex('#4f5b66'), copper: hex('#4f9480'),
  cream: hex('#e6dcc4'), red: hex('#8c2f2a'), green: hex('#1f4d3a'), white: hex('#e9e6dc'),
  timber: hex('#a07f50'), iron: hex('#2c3035'), tarp: hex('#a39a6e'), rope: hex('#57482f'), gravel: hex('#bca87f'), turf: hex('#5f7d3e'),
  brick: hex('#8a4a36'), moss: hex('#4a6a34'), dark: [0.012, 0.012, 0.018],
  accents: ['#d24b3a', '#e9b23c', '#2f6f8f', '#f2efe4'].map(hex), lamp: hex('#ffd27a'), lampCore: hex('#ff9a4a'),
};
// a frame standing at (d, z) of the plan whose +Z looks along the heading `face`: its yaw in the world and its point maker
export function frameAt(P, d, z, face) {
  const f = P.dir(face), yaw = Math.atan2(f[0], f[1]), c = Math.cos(yaw), s = Math.sin(yaw), x0 = P.hand * d;
  return { yaw, x: x0, z, p: (lx, ly, lz) => [x0 + lx * c + lz * s, ly, z - lx * s + lz * c] };
}
// the lists of the small things drawn as instances: each a unit shape with a place, a yaw and three sizes
// (cloth is a second builder: everything that the wind moves; see clothInto)
// (cribs: the pale timbers of the crib stacks under the lifted buildings, washed by the lanterns; lanterns: the
// storm lanterns' own small bodies, drawn only near the line)
// (lampsLate: the lamps of the late makers (seamInto, streetInto), kept apart so that the lamps' field takes them
// AFTER every older lamp and no older lamp's die is dealt anew)
export function makeLists() { return { sleepers: [], cribs: [], lanterns: [], rings: [], members: [], lamps: [], lampsLate: [], trapLamps: [], flags: [], shadows: [], trees: [], bushes: [], solids: [], pegs: [], irons: [], ivy: [], pools: [], cloth: makeBuilder(4096) }; }
// a timber sleeper or a balk: a box sx (along its length), sy, sz lying at yaw
const sleeper = (I, p, yaw, len, th = 0.3, wd = 0.34) => I.sleepers.push([p[0], p[1], p[2], yaw, len, th, wd]);
// a forged lifting ring hanging at p, its plane's normal at yaw; s is its outer diameter
const ring = (I, p, yaw, s = 1) => I.rings.push([p[0], p[1], p[2], yaw, s]);
// a lamp: a small warm point at p; kind 0 stands, 1 goes round with the wheel, 2 with the swing's crown; ch is its
// place along a chase of light (0..1 round a rim or along a ridge; negative: no chase)
// (col: 0 the fair's warm lamp, 1 its deeper core; 2 a STORM LANTERN of the stone half, 3 one of its gas
// standards: these two are of one plain colour each, take no part in any chase and do not flicker; their flames
// breathe slowly, each on a round of its own: makeLampField)
const lamp = (I, p, size = 1, kind = 0, ch = -1, col = 0) => I.lamps.push([p[0], p[1], p[2], size, kind, ch, col]);
// a storm lantern hanging at p (the point it hangs from): its flame 0.42 m under that, its small body of glass
// and iron drawn where the line passes within 75 m in plan (nearLine)
// (ONE KIND OF LANTERN IN THE STONE HALF, of one size and light: LANTERN, on every skid,
// crook, wagon and trailer of the caravan alike)
const LANTERN = 0.95;
const lantern = (I, p, body) => { I.lamps.push([p[0], p[1] - 0.42, p[2], LANTERN, 0, -1, 2]); if (body) I.lanterns.push([p[0], p[1], p[2]]); };

// ---------------------------------------------------------------- the stone half's makers
// What every stone building stands on: CRIB STACKS of sleepers laid crosswise in two to four courses, long
// iron skids on them with their ends turned up like a sledge's, and OPEN AIR between the stacks: the plinth's foot is
// Y0 metres over the ground (the building's own lift, set by each maker before it builds) and one sees through under it.
let Y0 = 1.5;
const SKID = 0.34;
// AFTER: the last light's share on the stone half's high parts (cornices, pediments, the dome, the obelisk's
// point): 1 at dusk, 0 at every other hour. It is the kit's baked wash laid by place on those parts (no light is
// made): buildStone sets it from the plan's hour before anything is built.
let AFTER = 0;
// A BEARER (nothing under the stone half is a dark slab): pale new timber, squared, its sawn end grain a
// shade darker at both ends. It takes the lanterns' wash as the builder's flood stands when it is laid.
const PALE = mul(mix3(COL.timber, COL.cream, 0.55), 1.12);
// (ends: 1 the end grain at a, 2 at q, 3 both, 0 neither: an end under a building is not drawn)
function bearerInto(b, a, q, w = 0.44, h = SKID, ends = 3) {
  b.surf(SURF.PLAIN).col(PALE, 0.92, 1.05); b.beam(a, q, w, h);
  const l = Math.hypot(q[0] - a[0], q[1] - a[1], q[2] - a[2]) || 1, u = [(q[0] - a[0]) / l, (q[1] - a[1]) / l, (q[2] - a[2]) / l];
  b.col(mul(PALE, 0.66), 1, 1);
  for (const [p, s, e] of [[a, -1, 1], [q, 1, 2]]) if (ends & e) b.beam([p[0] - s * u[0] * 0.01, p[1] - s * u[1] * 0.01, p[2] - s * u[2] * 0.01], [p[0] + s * u[0] * 0.025, p[1] + s * u[1] * 0.025, p[2] + s * u[2] * 0.025], w * 0.8, h * 0.8);
}
// one crib stack at the frame's (x, z) under a skid at `lift`: every timber where the line passes near, else one block
// (PALE TIMBER STACKED CROSSWISE: two balks to a course with air between them, each course across the one under
// it, their sawn ends showing. lit: under a standing building, where the lanterns wash them (the list `cribs`);
// else left on an emptied lot, pale and unlit (the sleepers' list, its pale kind))
function cribAt(I, F, x, z, lift, full, lit = true) {
  const n = lift < 1.35 ? 2 : lift < 1.65 ? 3 : 4, ch = (lift - SKID) / n, out = lit ? I.cribs : I.sleepers;
  if (!full) { const p = F.p(x, (lift - SKID) / 2, z); out.push([p[0], p[1], p[2], F.yaw, 1.5, lift - SKID, 1.5, 0.9, 1]); return; }
  for (let k = 0; k < n; k++) for (const sg of [-0.5, 0.5]) {
    const alongX = k % 2 === 1, p = alongX ? F.p(x, ch * (k + 0.5), z + sg) : F.p(x + sg, ch * (k + 0.5), z);
    out.push([p[0], p[1], p[2], alongX ? F.yaw : F.yaw + Math.PI / 2, 1.7, ch - 0.03, 0.36, 1.0, 1]);
  }
  const q = F.p(x, 0, z); I.shadows.push({ kind: 'pole', p: q, h: lift, w: 1.5 });
}
// the skids of a building (its half width hw, from z0 to z1 in its frame) and the cribs under them, a stack at each
// end and about every `step` metres; the soffit over the open air lies in shade
// STORM LANTERNS hang from the skids of every lifted building, about one every 6 m along each skid, between the
// crib stacks (their flames 0.9 to 1.4 m over the ground): by the hour's one law they wash the soffit, the sill
// girder, the skids, the plinth's foot and the cribs' faces (the kit's baked flood: no light is made) and lay a
// warm pool on the gravel (the ground's painting).
function skidsInto(b, I, F, hw, z0, z1, full, step = 6, sill = 0.42) {
  const lift = Y0, len = z1 - z0, zc = (z0 + z1) / 2, ys = lift - SKID / 2;
  // the soffit: the building's bearers and boards seen from below, in the lanterns' light
  b.flood(1.9, lift - 0.5, 1.4);
  b.surf(SURF.PLAIN).col(mix3(COL.timber, COL.lime, 0.35), 0.9, 0.9); b.quad([-hw, lift - 0.02, z0], [hw, lift - 0.02, z0], [hw, lift - 0.02, z1], [-hw, lift - 0.02, z1]);
  // a sole plate of pale new timber round the plinth's foot, over the open air, in the lanterns' light (nothing
  // under the stone half is a dark slab)
  if (sill > 0) { b.flood(1.0, lift - 0.5, 1.4); b.surf(SURF.PLAIN).col(mul(PALE, 0.9), 0.9, 1.05); b.box(-hw - sill, lift, z0 - sill, hw + sill, lift + 0.45, z1 + sill, { top: true }); }
  b.flood(1.3, lift - 0.5, 1.4);
  // (the first row toward the road, its stacks 11 m apart, stands on two skids only: few stacks, wide open air)
  const rails = len > 20 && step < 10 ? [z0 + 1.1, zc, z1 - 1.1] : len > 7 ? [z0 + 1.1, z1 - 1.1] : [zc], nx = Math.max(1, Math.round(2 * hw / step));
  for (const z of rails) {
    // (no long dark skid. Over every crib stack lies A SHORT BEARER OF PALE NEW TIMBER, its sawn ends
    // showing; the two end ones reach 1.2 m beyond the walls)
    for (let i = 0; i <= nx; i++) {
      const x = lerp(-hw + 0.9, hw - 0.9, i / nx);
      bearerInto(b, [i === 0 ? -hw - 1.2 : x - 1.25, ys, z], [i === nx ? hw + 1.2 : x + 1.25, ys, z], 0.44, SKID, (i === 0 ? 1 : 0) + (i === nx ? 2 : 0));
      cribAt(I, F, x, z, lift, full);
    }
    // the lanterns of this skid: one or two to a bay, none on a middle skid's ends
    const bay = 2 * (hw - 0.9) / nx, m = Math.max(1, Math.round(bay / 6.5)), outer = z === rails[0] || z === rails[rails.length - 1];
    for (let i = 0; i < nx; i++) for (let j = 0; j < m; j++) lantern(I, F.p(lerp(-hw + 0.9, hw - 0.9, (i + (j + 0.5) / m) / nx), lift - SKID, z + (outer ? Math.sign(z - zc) * 0.35 : 0)), full && outer);
  }
  b.flood(0);
}
// whether a thing at the frame's foot is near enough to the line to be built with every timber
const nearLine = (P, F, m = 75) => P.gapXZ(F.x, F.z, m).dist < m;
// the stone of a building by its draw: honey limestone, marble or cement
const stoneOf = (t) => (t < 0.45 ? mix3(COL.lime, COL.marble, t * 1.4) : t < 0.8 ? mix3(COL.marble, COL.lime, (t - 0.45) * 0.8) : mul(mix3(COL.lime, COL.marble, (t - 0.8) * 2), 0.96));
// bolted seams: an iron strap down each side of a corner, and flanged joints down the long walls
function seamsInto(b, hw, hd, y0, y1, near) {
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2);
  const t = 0.07, sw = 0.46;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    b.box(Math.min(sx * hw, sx * (hw - sw)), y0, sz > 0 ? hd : -hd - t, Math.max(sx * hw, sx * (hw - sw)), y1, sz > 0 ? hd + t : -hd, { top: false });
    b.box(sx > 0 ? hw : -hw - t, y0, Math.min(sz * hd, sz * (hd - sw)), sx > 0 ? hw + t : -hw, y1, Math.max(sz * hd, sz * (hd - sw)), { top: false });
  }
  if (!near) return;
  const nx = Math.round(2 * hw / 10), nz = Math.round(2 * hd / 10);
  for (let i = 1; i < nx; i++) { const x = lerp(-hw, hw, i / nx); for (const sz of [-1, 1]) b.box(x - 0.15, y0, sz > 0 ? hd : -hd - t, x + 0.15, y1, sz > 0 ? hd + t : -hd, { top: false }); }
  for (let i = 1; i < nz; i++) { const z = lerp(-hd, hd, i / nz); for (const sx of [-1, 1]) b.box(sx > 0 ? hw : -hw - t, y0, z - 0.15, sx > 0 ? hw + t : -hw, y1, z + 0.15, { top: false }); }
}
// LIFTING EYES along a cornice: small plain iron eyes on bolted plates, each with its short rope sling,
// IN REGULAR PAIRS (the two 1.2 m apart) at the lifting points only: a pair near each end of every side and one
// about every `step` metres between them, on the cornice's own face; never on a wall's face
function ringsInto(I, F, hw, hd, y, step, out = 0.02) {
  const side = (len, at, yaw) => { const n = Math.max(1, Math.round((2 * len - 3) / step)); for (let i = 0; i <= n; i++) { const c = lerp(-len + 1.5, len - 1.5, i / n); for (const e of [-0.6, 0.6]) ring(I, at(c + e), yaw); } };
  side(hw, (x) => F.p(x, y, hd + out), F.yaw); side(hw, (x) => F.p(x, y, -hd - out), F.yaw + Math.PI);
  side(hd, (z) => F.p(hw + out, y, z), F.yaw + Math.PI / 2); side(hd, (z) => F.p(-hw - out, y, z), F.yaw - Math.PI / 2);
}
// the storeys of a front between the plinth course (yP) and the frieze (yF): a rusticated ground storey, a tall main
// storey, then one or two lower ones: no two of the same height
function storeysOf(H, yP, yF) {
  const hG = H.kind ? 5.0 : 4.4 + (H.style % 2) * 0.5, hN = 4.3, R = yF - yP - hG - hN;
  if (R < -0.6) return [(yF - yP) * 0.54, (yF - yP) * 0.46];
  if (R < 2.3) return [hG, hN + R];
  if (R < 5.6) return [hG, hN, R];
  return [hG, hN, R * 0.56, R * 0.44];
}
// a stone building in its own frame (front on +Z): H is the plan's record (the half-lowered one is built without its
// front wall: that lies beside it). Each front is told apart: see frontInto. Yields between its pieces.
export function* stoneHouseInto(b, P, H, I) {
  Y0 = H.lift || 1.5;
  const F = frameAt(P, H.d, H.z, H.face), hw = H.w / 2, hd = H.dp / 2, top = H.h, near = !!H.near, st = stoneOf(H.tint), seed = H.tint, sty = H.style | 0;
  b.tr(F.x, 0, F.z, F.yaw);
  skidsInto(b, I, F, hw, -hd, hd + (H.portico ? 3.2 : 0), nearLine(P, F), H.first ? 11 : near ? 6 : 9);
  const yP = Y0 + 0.9, yF = top - 1.1, fl = storeysOf(H, yP, yF), bay = [3.3, 3.6, 3.9, 3.45][sty];
  // THE STREET'S OWN FRONTS: a near building on the left street's stone side, between the square and the street's
  // head. A third and more of its windows are lit warm, and THE END IT SHOWS THE STREET (sxS: its end that looks
  // up the street or toward it) wears a sill under every main window and a hood over every upper one, like its
  // front: no flat wall toward the line.
  const street = near && H.d > P.DS && H.d < P.DS + 60 && H.z > P.stone.sqN - 12 && H.z < P.streetHead + 30;
  const o0 = F.p(0, 0, 0), o1 = F.p(1, 0, 0), sxS = (o1[2] - o0[2]) - P.hand * (o1[0] - o0[0]) > 0 ? 1 : -1;
  // (the plinth course takes the lanterns' wash at its foot)
  b.flood(1.35, Y0, 1.2);
  b.surf(SURF.MASONRY, 0, 0.8).col(mul(st, 0.84), 0.82, 1); b.box(-hw - 0.25, Y0, -hd - 0.25, hw + 0.25, yP, hd + 0.25, { m: 1 });
  b.flood(0);
  let y = yP;
  for (let k = 0; k < fl.length; k++) {
    const h = fl[k], y1 = y + h, ground = k === 0, attic = k >= 2;
    // (the third argument is the storey's own share of lit windows: a few on most fronts, more on one in four
    // and on the street's own)
    b.surf(ground ? SURF.ARCHED : SURF.WINDOW, (seed + k * 0.37) % 1, H.id % 4 === 2 ? 2.4 : street ? 2.6 : 1).col(mul(st, ground ? 0.85 : attic ? 1.03 : 1), ground ? 0.88 : 1, ground ? 1 : 0.9);
    const o = { cellW: attic && sty % 2 ? bay / 2 : ground && sty === 2 ? bay * 1.2 : bay, cellH: h };
    if (!H.half) b.wall(-hw, hd, hw, hd, y, y1, o);
    b.wall(hw, hd, hw, -hd, y, y1, o); b.wall(hw, -hd, -hw, -hd, y, y1, o); b.wall(-hw, -hd, -hw, hd, y, y1, o);
    // THE FRONTS' RELIEF (near buildings; their front and both ends). The ground storey: rusticated piers
    // between its arches, proud of the wall, their feet in the lanterns' light (the warm band along a lifted
    // front's foot). Every upper window of the front: a stone hood over it that throws shade, and on the main
    // storey a sill; on the ends, hoods on the main storey.
    if (near) {
      const nf = Math.max(1, Math.round(2 * hw / o.cellW)), ns = Math.max(1, Math.round(2 * hd / o.cellW));
      if (ground) {
        b.flood(1.0, yP + 0.4, 2.4); b.surf(SURF.MASONRY, 0, 1.2).col(mul(st, 0.93), 0.84, 1.02);
        if (!H.half) for (let i = 0; i <= nf; i++) { const x = clamp(-hw + i * 2 * hw / nf, -hw + 0.42, hw - 0.42); b.box(x - 0.42, y, hd, x + 0.42, y1 - 0.25, hd + 0.15, { m: 1, top: false }); }
        for (let i = 0; i <= ns; i++) { const z = clamp(-hd + i * 2 * hd / ns, -hd + 0.42, hd - 0.42); for (const sx of [-1, 1]) b.box(sx > 0 ? hw : -hw - 0.15, y, z - 0.42, sx > 0 ? hw + 0.15 : -hw, y1 - 0.25, z + 0.42, { m: 1, top: false }); }
        b.flood(0);
      } else {
        b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.7, 1);
        if (!H.half) ledgesInto(b, [-hw, hd], [hw, hd], 0, 1, nf, y, h, k === 1);
        if (k === 1) { ledgesInto(b, [hw, hd], [hw, -hd], 1, 0, ns, y, h, street && sxS > 0); ledgesInto(b, [-hw, -hd], [-hw, hd], -1, 0, ns, y, h, street && sxS < 0); }
        else if (street) { if (sxS > 0) ledgesInto(b, [hw, hd], [hw, -hd], 1, 0, ns, y, h, false); else ledgesInto(b, [-hw, -hd], [-hw, hd], -1, 0, ns, y, h, false); }
      }
    }
    // a string course over each storey but the last, the one over the rusticated storey the deeper
    if (k < fl.length - 1) { const pr = ground ? 0.3 : 0.16, th = ground ? 0.5 : 0.28; b.surf(SURF.PLAIN).col(mul(st, 1.07), 0.9, 1); b.box(-hw - pr, y1 - th / 2, -hd - pr, hw + pr, y1 + th / 2, hd + pr, { top: true, bottom: true }); }
    y = y1;
  }
  // frieze (darker under the cornice, in its shade) and a deep cornice in two members. THE LAST LIGHT lies on the
  // cornice's faces at dusk (AFTER: the baked wash, by place); its soffits are drawn apart, in shade
  b.surf(SURF.MASONRY, 0, 0.7).col(mul(st, 0.96), 1, 0.7); b.box(-hw, yF, -hd, hw, top - 0.3, hd, { top: false, m: 1 });
  b.flood(AFTER * 1.3, 999, 1);
  b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.85, 1);
  b.box(-hw - 0.45, top - 0.62, -hd - 0.45, hw + 0.45, top - 0.3, hd + 0.45, { top: false });
  b.box(-hw - 1.0, top - 0.3, -hd - 1.0, hw + 1.0, top + 0.4, hd + 1.0, {});
  b.flood(0); b.col(mul(st, 0.55), 1, 1);
  b.quad([-hw - 0.45, top - 0.62, -hd - 0.45], [hw + 0.45, top - 0.62, -hd - 0.45], [hw + 0.45, top - 0.62, hd + 0.45], [-hw - 0.45, top - 0.62, hd + 0.45]);
  b.quad([-hw - 1.0, top - 0.3, -hd - 1.0], [hw + 1.0, top - 0.3, -hd - 1.0], [hw + 1.0, top - 0.3, hd + 1.0], [-hw - 1.0, top - 0.3, hd + 1.0]);
  yield;
  const roofY = top + 0.4;
  if (sty === 2 && !H.kind && near) {
    // a mansard: copper slopes to a flat
    b.surf(SURF.TILES).col(COL.copper, 0.9, 1.1); b.frustum(0, 0, 2 * hw - 0.6, 2 * hd - 0.6, 2 * hw - 5, 2 * hd - 5, roofY, roofY + 3.1, { top: false });
    b.surf(SURF.PLAIN).col(mul(COL.copper, 0.7), 1, 1); b.box(-hw + 2.5, roofY + 3.1, -hd + 2.5, hw - 2.5, roofY + 3.3, hd - 2.5, { top: true });
  } else if (H.roof === 'hip' && !(sty === 3 && near && !H.kind)) { b.surf(SURF.TILES).col(COL.slate, 1, 1.1); b.hip(-hw + 0.2, -hd + 0.2, hw - 0.2, hd - 0.2, roofY, Math.min(hd, hw) * 0.42, { overhang: 0, ridge: 0.5 }); }
  else {
    // a flat roof behind a parapet (a balustrade on the near ones), a small copper lantern roof at its middle
    b.surf(near ? SURF.SLIT : SURF.MASONRY, 0.2, near ? 0 : 0.7).col(mul(st, 1.0), 1, 1); b.box(-hw + 0.4, roofY, -hd + 0.4, hw - 0.4, roofY + 1.05, hd - 0.4, near ? { cellW: 0.5, cellH: 1.05, capColor: mul(st, 1.08) } : { m: 1, capColor: mul(COL.copper, 0.9) });
    if (near && sty !== 3) { b.surf(SURF.TILES).col(COL.copper, 0.9, 1.1); b.hip(-hw * 0.5, -hd * 0.5, hw * 0.5, hd * 0.5, roofY + 0.2, 2.6, { overhang: 0.3, ridge: 0.6 }); }
  }
  seamsInto(b, hw + 0.01, hd + 0.01, Y0, top - 0.3, near);
  if (near) ringsInto(I, F, hw + 1.0, hd + 1.0, top + 0.05, 7.2);
  I.shadows.push({ kind: 'box', d: H.d, z: H.z, face: H.face, hw: hw + 1.0, hd: hd + 1.0, y0: Y0, h: top + (H.roof === 'hip' ? 2.5 : 1.5) });
  I.solids.push({ kind: 'box', F, hw: hw + 1.0, hd: hd + 1.0, h: top + 1.5, id: H.id });
  yield;
  if (near) yield* frontInto(b, P, H, I, F, st, fl, yP, yF, bay);
  if (H.portico) yield* porticoInto(b, P, H, I, F, st);
  if (H.belfry) belfryInto(b, H, st, top);
  b.pop();
  // A PENNANT ON THE ROOF of the bank, the palaces, the school, the temple front and of
  // EVERY front that stands by the line but the half front: one plain field of slate or of copper green on a
  // white staff, streaming in the one wind (the stone half's own; see flagsInto). It tells the wind, nothing else.
  if (H.kind || H.belfry || (near && !H.half)) {
    const mans = sty === 2 && !H.kind && near, yr = H.belfry ? top + 0.45 + Math.min(H.dp, H.w) * 0.189 + 6.3 : mans ? roofY + 3.3 : H.roof === 'hip' && !(sty === 3 && near && !H.kind) ? roofY + Math.min(hd, hw) * 0.42 : near && sty !== 3 ? roofY + 2.8 : roofY + 1.05;
    I.flags.push({ p: F.p(0, yr - 0.2, 0), len: H.kind ? 6.8 : 5.4, h: H.kind ? 2.0 : 1.6, pole: H.belfry ? 3.2 : 4.8, rgb: STONE_PEN[H.id % 2], pennant: true });
  }
}
// stone hoods (and sills) along one wall of a storey, one to each of its n windows: the wall runs from a to q in
// the building's frame (along X or along Z), (ox, oz) is its outward unit; y its foot, h its height
function ledgesInto(b, a, q, ox, oz, n, y, h, sill) {
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.19) / n, t1 = (i + 0.81) / n, x0 = lerp(a[0], q[0], t0), x1 = lerp(a[0], q[0], t1), z0 = lerp(a[1], q[1], t0), z1 = lerp(a[1], q[1], t1);
    const ledge = (ya, yb, out) => b.box(Math.min(x0, x1, x0 + ox * out), ya, Math.min(z0, z1, z0 + oz * out), Math.max(x0, x1, x0 + ox * out), yb, Math.max(z0, z1, z0 + oz * out), { bottom: true });
    ledge(y + h * 0.82, y + h * 0.82 + 0.24, 0.32);
    if (sill) ledge(y + h * 0.2 - 0.17, y + h * 0.2, 0.22);
  }
}
// steps before a front (sw wide, from z0 outward, their head at yTop): a flight that ENDS SHORT OF THE GROUND on screw
// jacks, a timber ramp laid from the ground to its lowest tread. Nothing of it moves.
function stepsInto(b, st, sw, z0, yTop, ramp = 1) {
  const yb = Math.max(0.6, Y0 * 0.45), n = Math.max(3, Math.round((yTop - yb) / 0.32)), rh = (yTop - yb) / n, run = 0.46;
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.98), 0.9, 1);
  for (let k = 0; k < n; k++) b.box(-sw / 2, Math.max(yb - rh, yTop - rh * (k + 1) - 0.3), z0 + run * k, sw / 2, yTop - rh * k, z0 + run * (k + 1), { m: 1, bottom: true });
  const zl = z0 + run * n, zj = zl - run * 0.9, rl = Math.max(1.8, yb * 2.6) * ramp, rw = Math.min(3.0, sw * 0.45);
  for (let i = 0; i < 5; i++) { const x = lerp(-sw / 2 + 0.6, sw / 2 - 0.6, i / 4); b.surf(SURF.STEEL).col(COL.iron, 1, 1.3); b.cyl(x, 0.12, zj, 0.16, 0.12, yb - rh - 0.12, 7); b.cbox(x, 0, zj, 0.6, 0.12, 0.6); }
  b.surf(SURF.PLANKS).col(COL.timber, 0.9, 1.1);
  b.quad([-rw / 2, 0.06, zl + rl], [rw / 2, 0.06, zl + rl], [rw / 2, yb - rh + 0.04, zl - 0.15], [-rw / 2, yb - rh + 0.04, zl - 0.15], [0, 0, 3, 4]);
  for (const sx of [-1, 1]) b.beam([sx * rw * 0.42, yb - rh - 0.1, zl - 0.15], [sx * rw * 0.42, 0.0, zl + rl], 0.18, 0.2);
  return zl + rl;
}
// SHUTTERS on the main storey's windows of a front: two leaves of painted boards to each window, folded
// back flat against the wall either side of it
function shuttersInto(b, hw, hd, bay, yM, h, paint) {
  const n = Math.max(1, Math.round(2 * hw / bay)), cw = 2 * hw / n;
  b.surf(SURF.PLANKS).col(paint, 0.9, 1.05);
  for (let i = 0; i < n; i++) for (const [t0, t1] of [[0.1, 0.232], [0.768, 0.9]]) b.box(-hw + (i + t0) * cw, yM + h * 0.2, hd, -hw + (i + t1) * cw, yM + h * 0.8, hd + 0.07, {});
}
// A BALCONY before the middle windows of a front's main storey: a stone slab on four consoles, a
// balustrade round it (hx: its half length)
function balconyInto(b, hd, hx, yM, st) {
  b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.75, 1); b.box(-hx, yM - 0.12, hd, hx, yM + 0.12, hd + 1.15, { bottom: true });
  for (let i = 0; i < 4; i++) { const x = lerp(-hx + 0.4, hx - 0.4, i / 3); b.box(x - 0.14, yM - 0.7, hd, x + 0.14, yM - 0.12, hd + 0.7, { bottom: true, top: false }); }
  b.surf(SURF.SLIT, 0.2, 0).col(mul(st, 1.03), 1, 1);
  b.box(-hx, yM + 0.12, hd + 0.98, hx, yM + 1.0, hd + 1.12, { cellW: 0.5, cellH: 0.88, capColor: mul(st, 1.1) });
  for (const sx of [-1, 1]) b.box(sx > 0 ? hx - 0.14 : -hx, yM + 0.12, hd, sx > 0 ? hx : -hx + 0.14, yM + 1.0, hd + 0.98, { cellW: 0.5, cellH: 0.88, capColor: mul(st, 1.1) });
}
// what tells a near front apart, by its kind and style (the builder stands in the building's frame)
function* frontInto(b, P, H, I, F, st, fl, yP, yF, bay) {
  const hw = H.w / 2, hd = H.dp / 2, top = H.h, sty = H.style | 0, yM = yP + fl[0];
  if (H.kind === 'palace') { yield* palaceFrontInto(b, P, H, I, F, st, fl, yP, yF); return; }
  if (H.kind || H.half) return;
  if (sty === 0) {
    // quoins: rusticated blocks up the front's corners beside the iron seams, a doorway under a hood at the middle
    b.surf(SURF.MASONRY, 0, 1.5).col(mul(st, 0.9), 0.9, 1);
    for (const sx of [-1, 1]) b.box(sx > 0 ? hw - 1.7 : -hw + 0.55, yP, hd, sx > 0 ? hw - 0.55 : -hw + 1.7, yF, hd + 0.14, { m: 1 });
    b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.9, 1); b.box(-2.1, yP + 3.5, hd, 2.1, yP + 3.9, hd + 0.9, { bottom: true, top: true });
    for (const sx of [-1, 1]) b.cbox(sx * 1.8, yP, hd + 0.55, 0.5, 3.5, 0.5, {});
    shuttersInto(b, hw, hd, bay, yM, fl[1], [0.2, 0.27, 0.24]);
  } else if (sty === 1) {
    // giant pilasters over the upper storeys, a cap and a foot block to each
    const nb = Math.max(2, Math.round(2 * hw / bay)), stp = nb > 7 ? 2 : 1;
    for (let i = 0; i <= nb; i += stp) {
      const x = lerp(-hw + 0.5, hw - 0.5, i / nb);
      b.surf(SURF.FLUTED, 0, 0.4).col(mul(st, 1.06), 0.9, 1); b.box(x - 0.36, yM + 0.6, hd, x + 0.36, yF - 0.5, hd + 0.24, { cellW: 0.12 });
      b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.9, 1); b.box(x - 0.5, yF - 0.5, hd, x + 0.5, yF, hd + 0.34, { bottom: true }); b.box(x - 0.48, yM + 0.25, hd, x + 0.48, yM + 0.6, hd + 0.3, { top: true });
    }
    balconyInto(b, hd, bay * 1.5, yM, st);
  } else if (sty === 2) {
    shuttersInto(b, hw, hd, bay, yM, fl[1], [0.2, 0.25, 0.33]);
  } else if (sty === 3) {
    balconyInto(b, hd, bay * 2.5, yM, st);
    // a raised centre: an attic block over the middle with upright windows, its own cornice and a low copper roof
    const cw = hw * 0.36, y0 = top + 0.4, y1 = y0 + 3.0;
    b.surf(SURF.WINDOW, (H.tint + 0.5) % 1, 1).col(mul(st, 1.02), 1, 1); b.box(-cw, y0, -hd + 1.4, cw, y1, hd - 0.2, { cellW: bay, cellH: 3.0, top: false });
    b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.85, 1); b.box(-cw - 0.4, y1, -hd + 1.0, cw + 0.4, y1 + 0.4, hd + 0.2, { bottom: true });
    b.surf(SURF.TILES).col(COL.copper, 0.9, 1.1); b.hip(-cw, -hd + 1.4, cw, hd - 0.2, y1 + 0.4, 1.8, { overhang: 0, ridge: 0.5 });
  }
  yield;
}
// THE PALACE front: a centre standing proud under a pediment with six giant pilasters, three tall arches in its
// rusticated storey, a balustrade with urns along the parapet either side, the steps on jacks before it
function* palaceFrontInto(b, P, H, I, F, st, fl, yP, yF) {
  const hw = H.w / 2, hd = H.dp / 2, top = H.h, cw = hw * 0.4, zf = hd + 1.5, yM = yP + fl[0];
  b.surf(SURF.MASONRY, 0, 0.8).col(mul(st, 0.84), 0.82, 1); b.box(-cw - 0.25, Y0, hd, cw + 0.25, yP, zf + 0.25, { m: 1, bottom: true });
  b.surf(SURF.ARCHED, H.tint, 1).col(mul(st, 0.85), 0.88, 1); b.box(-cw, yP, hd, cw, yM, zf, { cellW: 2 * cw / 3, cellH: fl[0], top: false });
  b.surf(SURF.WINDOW, (H.tint + 0.3) % 1, 1).col(mul(st, 1.03), 1, 1); b.box(-cw, yM, hd, cw, yF, zf, { cellW: 2 * cw / 5, cellH: yF - yM, top: false });
  b.surf(SURF.PLAIN).col(mul(st, 1.07), 0.9, 1); b.box(-cw - 0.3, yM - 0.25, hd, cw + 0.3, yM + 0.25, zf + 0.3, { top: true, bottom: true });
  b.surf(SURF.MASONRY, 0, 0.7).col(mul(st, 1.02), 1, 1); b.box(-cw, yF, hd, cw, top - 0.3, zf, { top: false, m: 1 });
  b.flood(AFTER * 1.3, 999, 1); b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.8, 1); b.box(-cw - 1.0, top - 0.3, hd, cw + 1.0, top + 0.4, zf + 1.0, { bottom: true, top: true }); b.flood(0);
  for (let i = 0; i < 6; i++) {
    const x = lerp(-cw + 0.5, cw - 0.5, i / 5);
    b.surf(SURF.FLUTED, 0, 0.4).col(mul(st, 1.08), 0.9, 1); b.box(x - 0.42, yM + 0.25, zf, x + 0.42, yF - 0.5, zf + 0.26, { cellW: 0.14 });
    b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.9, 1); b.box(x - 0.56, yF - 0.5, zf, x + 0.56, yF, zf + 0.36, { bottom: true });
  }
  yield;
  // the pediment over the centre, small lifting eyes in pairs on its shoulders
  const eY = top + 0.4, rise = cw * 0.42, a = -cw - 1.0, c = cw + 1.0, zt = zf + 0.6;
  // (the pediment holds the last light at dusk)
  b.flood(AFTER * 1.4, 999, 1);
  b.surf(SURF.PLAIN).col(mul(st, 0.95), 1, 1); b.tri([a + 0.8, eY, zt], [c - 0.8, eY, zt], [0, eY + rise - 0.4, zt]);
  b.col(mul(st, 1.1), 1, 1); b.beam([a, eY + 0.2, zt + 0.1], [0, eY + rise + 0.2, zt + 0.1], 0.9, 0.5); b.beam([c, eY + 0.2, zt + 0.1], [0, eY + rise + 0.2, zt + 0.1], 0.9, 0.5);
  b.flood(0);
  b.surf(SURF.TILES).col(COL.slate, 1, 1.1);
  b.quad([a, eY + 0.3, zt + 0.4], [0, eY + rise + 0.3, zt + 0.4], [0, eY + rise + 0.3, hd - 3], [a, eY + 0.3, hd - 3], [0, 0, 6, 3]);
  b.quad([0, eY + rise + 0.3, zt + 0.4], [c, eY + 0.3, zt + 0.4], [c, eY + 0.3, hd - 3], [0, eY + rise + 0.3, hd - 3], [0, 0, 6, 3]);
  for (const t of [0.12, 0.16, 0.84, 0.88]) ring(I, F.p(lerp(a, c, t), eY + 0.2 + rise * (1 - Math.abs(t * 2 - 1)), zt + 0.57), F.yaw);
  // the balustrade along the parapet either side of the centre, an urn on a block at every third of it
  for (const sx of [-1, 1]) {
    b.surf(SURF.SLIT, 0.2, 0).col(mul(st, 1.02), 1, 1);
    b.box(sx > 0 ? cw + 1.2 : -hw - 0.6, eY, hd + 0.3, sx > 0 ? hw + 0.6 : -cw - 1.2, eY + 1.0, hd + 0.62, { cellW: 0.5, cellH: 1.0, capColor: mul(st, 1.1) });
    b.surf(SURF.PLAIN).col(st, 0.9, 1.05);
    for (let i = 0; i < 3; i++) { const x = sx * lerp(cw + 2.2, hw, i / 2); b.cbox(x, eY + 1.0, hd + 0.46, 0.7, 0.3, 0.7, {}); b.lathe(x, eY + 1.3, hd + 0.46, [[0.2, 0], [0.16, 0.2], [0.48, 0.6], [0.5, 0.95], [0.34, 1.1], [0.4, 1.2]], 8); }
  }
  yield;
  const zEnd = stepsInto(b, st, 2 * cw - 1.6, zf + 0.25, yP);
  I.solids.push({ kind: 'box', F, hw: cw + 1.1, z0: hd, z1: zEnd, h: eY + rise + 0.6, id: H.id });
  // skids and cribs under the centre and the steps' head
  b.flood(1.2, Y0 - 0.5, 1.4); bearerInto(b, [-cw - 1.2, Y0 - SKID / 2, zf - 0.4], [cw + 1.2, Y0 - SKID / 2, zf - 0.4]); b.flood(0);
  for (let i = 0; i <= 3; i++) cribAt(I, F, lerp(-cw + 0.6, cw - 0.6, i / 3), zf - 0.4, Y0, true);
  // R1: two great urns before the front, each on its pedestal on ITS OWN pair of skids over two crib stacks
  for (const sx of [-1, 1]) {
    const ux = sx * (cw + 5.2), uz = hd + 4.4, w = F.p(ux, 0, uz);
    b.flood(1.0, Y0 - 0.5, 1.4);
    for (const dz of [-0.65, 0.65]) bearerInto(b, [ux - 1.9, Y0 - SKID / 2, uz + dz], [ux + 1.9, Y0 - SKID / 2, uz + dz], 0.3, SKID);
    b.flood(0);
    cribAt(I, F, ux - 1.2, uz, Y0, true); cribAt(I, F, ux + 1.2, uz, Y0, true);
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.95), 0.85, 1); b.cbox(ux, Y0, uz, 2.2, 0.4, 2.0, { m: 1, bottom: true }); b.cbox(ux, Y0 + 0.4, uz, 1.5, 1.5, 1.5, { m: 1 });
    b.surf(SURF.PLAIN).col(st, 0.92, 1.05); b.cbox(ux, Y0 + 1.9, uz, 1.8, 0.25, 1.8, {});
    b.lathe(ux, Y0 + 2.15, uz, [[0.4, 0], [0.3, 0.35], [0.85, 1.0], [0.95, 1.7], [0.6, 2.0], [0.75, 2.2]], 10);
    I.shadows.push({ kind: 'pole', p: [w[0], 0, w[2]], h: Y0 + 4.3, w: 1.6 }); I.solids.push({ kind: 'round', p: [w[0], 0, w[2]], r: 2.2, h: Y0 + 4.5 });
  }
}
// one fluted column standing at (x, z) on y0, its shaft's foot radius r, its whole height h (base and head included)
function columnInto(b, x, y0, z, r, h, st) {
  b.surf(SURF.PLAIN).col(mul(st, 1.04), 0.9, 1);
  b.cbox(x, y0, z, r * 2.9, 0.28, r * 2.9); b.cyl(x, y0 + 0.28, z, r * 1.3, r * 1.12, 0.32, 12, { cap: false });
  const s0 = y0 + 0.6, s1 = y0 + h - 0.85;
  b.surf(SURF.FLUTED, 0, 1).col(mul(st, 1.08), 0.92, 1);
  b.lathe(x, s0, z, [[r, 0], [r * 0.99, (s1 - s0) * 0.33], [r * 0.93, (s1 - s0) * 0.7], [r * 0.84, s1 - s0]], 12, { smooth: true, uvBand: [20, 0, 1] });
  b.surf(SURF.PLAIN).col(mul(st, 1.06), 0.95, 1);
  b.lathe(x, s1, z, [[r * 0.84, 0], [r * 0.9, 0.12], [r * 1.3, 0.5]], 12, { smooth: true });
  b.cbox(x, s1 + 0.5, z, r * 3, 0.35, r * 3);
}
// a timber cradle round a column's drum: four balks clamped round the shaft, wedges under them
function cradleInto(b, x, y, z, r) {
  const a = r + 0.34, t = 0.32;
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.1);
  b.beam([x - a - 0.5, y, z + a], [x + a + 0.5, y, z + a], t, t); b.beam([x - a - 0.5, y, z - a], [x + a + 0.5, y, z - a], t, t);
  b.beam([x + a, y + t, z - a - 0.5], [x + a, y + t, z + a + 0.5], t, t); b.beam([x - a, y + t, z - a - 0.5], [x - a, y + t, z + a + 0.5], t, t);
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(x + sx * a, y - 0.26, z + sz * a, 0.2, 0.9, 0.2);
}
// the portico before a front: a floor on the skids, a row of columns in cradles, an entablature, a pediment or a
// plain attic; steps that rest on jacks and wedges
function* porticoInto(b, P, H, I, F, st) {
  const q = H.portico, hd = H.dp / 2, n = q.n, sp = n > 6 ? 4.6 : 3.6, pw = (n - 1) * sp + 1.9, r = n > 6 ? 0.66 : 0.58, ys = Y0 + 0.5, zc = hd + 2.1, capY = ys + q.colH;
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.95), 0.85, 1); b.box(-pw / 2 - 0.5, Y0, hd, pw / 2 + 0.5, ys, hd + 3.2, { m: 1 });
  for (let i = 0; i < n; i++) {
    const x = -pw / 2 + 0.95 + i * sp;
    columnInto(b, x, ys, zc, r, q.colH, st);
    cradleInto(b, x, ys + q.colH * 0.3, zc, r * 0.99); cradleInto(b, x, ys + q.colH * 0.66, zc, r * 0.93);
    if (i % 3 === 2) yield;
  }
  // long walers tie the cradles of the row together
  b.surf(SURF.PLANKS).col(mul(COL.timber, 0.92), 0.9, 1.1);
  for (const k of [0.3, 0.66]) for (const sz of [-1, 1]) b.beam([-pw / 2 - 0.4, ys + q.colH * k + 0.66, zc + sz * (r + 0.7)], [pw / 2 + 0.4, ys + q.colH * k + 0.66, zc + sz * (r + 0.7)], 0.26, 0.3);
  // entablature
  b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 1.03), 0.95, 1); b.box(-pw / 2 - 0.2, capY, hd, pw / 2 + 0.2, capY + 1.0, hd + 3.0, { m: 1, bottom: true });
  // (the entablature's cornice and the pediment hold the last light at dusk)
  b.flood(AFTER * 1.3, 999, 1);
  b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.85, 1); b.box(-pw / 2 - 0.65, capY + 1.0, hd, pw / 2 + 0.65, capY + 1.45, hd + 3.5, { bottom: true });
  b.flood(0);
  const eY = capY + 1.45;
  if (q.pediment) {
    const rise = pw * 0.17, a = -pw / 2 - 0.65, c = pw / 2 + 0.65, zf = hd + 3.5, zt = hd + 3.1;
    b.flood(AFTER * 1.4, 999, 1);
    b.surf(SURF.PLAIN).col(mul(st, 0.93), 1, 1); b.tri([a + 1, eY, zt], [c - 1, eY, zt], [0, eY + rise - 0.5, zt]);
    b.col(mul(st, 1.08), 1, 1);
    // the raking cornices, the roof behind them
    b.beam([a, eY + 0.2, zf - 0.3], [0, eY + rise + 0.2, zf - 0.3], 0.9, 0.5); b.beam([c, eY + 0.2, zf - 0.3], [0, eY + rise + 0.2, zf - 0.3], 0.9, 0.5);
    b.flood(0);
    b.surf(SURF.TILES).col(COL.slate, 1, 1.1);
    b.quad([a, eY + 0.3, zf], [0, eY + rise + 0.3, zf], [0, eY + rise + 0.3, hd], [a, eY + 0.3, hd], [0, 0, 6, 3]); b.quad([0, eY + rise + 0.3, zf], [c, eY + 0.3, zf], [c, eY + 0.3, hd], [0, eY + rise + 0.3, hd], [0, 0, 6, 3]);
    // a pair of lifting eyes on each shoulder of the pediment's raking cornice
    for (const t of [0.1, 0.14, 0.86, 0.9]) ring(I, F.p(lerp(a, c, t), eY + 0.2 + rise * (1 - Math.abs(t * 2 - 1)), zf + 0.17), F.yaw);
    I.pedTop = F.p(0, eY + rise, zf);
  } else {
    for (const i of [0, n - 1]) for (const e of [-0.6, 0.6]) ring(I, F.p(-pw / 2 + 0.95 + i * sp + e, eY - 0.22, hd + 3.52), F.yaw);
  }
  yield;
  // the steps: a flight that ends short of the ground on screw jacks, a timber ramp laid to it
  const zEnd = stepsInto(b, st, pw - 2.4, hd + 3.2, ys, 0.8);
  I.solids.push({ kind: 'box', F, hw: pw / 2 + 0.7, z0: hd, z1: zEnd, h: eY + (q.pediment ? pw * 0.17 + 0.6 : 0.2), id: H.id });
}
// the school's small open belfry: four posts, a little roof, a bell hanging still
function belfryInto(b, H, st, top) {
  const y = top + 0.45 + Math.min(H.dp, H.w) * 0.21 * 0.9, s = 1.5;
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 1.02), 0.9, 1); b.cbox(0, y - 1.6, 0, 3.6, 2.2, 3.6, { m: 1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * s, y + 0.6, sz * s, 0.42, 3.4, 0.42);
  b.surf(SURF.TILES).col(COL.copper, 0.9, 1.1); b.hip(-s - 0.4, -s - 0.4, s + 0.4, s + 0.4, y + 4.0, 2.4, { overhang: 0.35, ridge: 0 });
  b.surf(SURF.STEEL).col(mul(COL.copper, 0.6), 1, 1.2); b.cyl(0, y + 1.9, 0, 0.75, 0.3, 1.1, 8); b.beam([-s, y + 3.2, 0], [s, y + 3.2, 0], 0.16, 0.16);
}

// the half-lowered front: the building's front wall lies leaned out over the plot on timber falsework, shear-legs
// astride it and a derrick beside it, their tackle rigged and at rest. Nothing of it moves.
export function* halfFrontInto(b, P, H, I) {
  Y0 = H.lift || 1.5;
  const F = frameAt(P, H.d, H.z, H.face), hw = H.w / 2, hd = H.dp / 2, top = H.h, st = stoneOf(H.tint), Hs = top - Y0 - 0.3, al = 38 * DEG;
  b.tr(F.x, 0, F.z, F.yaw);
  // the rooms behind the opened side: floors, a back wall and two cross walls, in shade
  const yP = Y0 + 0.9, nfl = Math.max(2, Math.round((top - 1 - yP) / 3.9)), fh = (top - 1 - yP) / nfl, inC = mul(COL.cream, 0.62);
  b.surf(SURF.PLAIN).col(inC, 0.8, 1);
  b.wall(-hw + 0.5, -hd + 0.5, hw - 0.5, -hd + 0.5, Y0, top - 0.3); b.wall(-hw + 0.5, hd, -hw + 0.5, -hd + 0.5, Y0, top - 0.3); b.wall(hw - 0.5, -hd + 0.5, hw - 0.5, hd, Y0, top - 0.3);
  for (const x of [-hw / 3, hw / 3]) { b.wall(x - 0.2, hd, x - 0.2, -hd + 0.5, Y0, top - 0.3); b.wall(x + 0.2, -hd + 0.5, x + 0.2, hd, Y0, top - 0.3); b.wall(x - 0.2, hd, x + 0.2, hd, Y0, top - 0.3); }
  for (let k = 0; k <= nfl; k++) { const y = k === 0 ? Y0 + 0.2 : yP + fh * k; b.col(mul(COL.timber, 0.7), 1, 1); b.box(-hw + 0.5, y - 0.3, -hd + 0.5, hw - 0.5, y, hd - 0.1, { bottom: true }); }
  yield;
  // the front itself, leaned out by 38 degrees about its foot
  const pz = hd + 0.9, py = Y0 - 0.15;
  b.push(new THREE.Matrix4().makeTranslation(0, py, pz).multiply(new THREE.Matrix4().makeRotationX(al)));
  b.surf(SURF.ARCHED, H.tint, 0).col(st, 0.9, 1); b.wall(-hw, 0.25, hw, 0.25, 0.9, 0.9 + fh, { cellW: 3.3, cellH: fh });
  for (let k = 1; k < nfl; k++) { b.surf(SURF.WINDOW, (H.tint + k * 0.37) % 1, 0).col(st, 1, 1); b.wall(-hw, 0.25, hw, 0.25, 0.9 + fh * k, 0.9 + fh * (k + 1), { cellW: 3.3, cellH: fh }); }
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.95), 1, 1); b.wall(-hw, 0.25, hw, 0.25, 0, 0.9, { m: 1 }); b.wall(-hw, 0.25, hw, 0.25, 0.9 + fh * nfl, Hs, { m: 1 });
  b.surf(SURF.PLAIN).col(mul(st, 0.8), 1, 1); b.box(-hw, 0, -0.25, hw, Hs, 0.24, { bottom: true });
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); for (const sx of [-1, 1]) b.box(sx > 0 ? hw - 0.46 : -hw, 0, 0.25, sx > 0 ? hw : -hw + 0.46, Hs, 0.33, { top: false });
  b.pop();
  const sl = (s, x, o = 0) => [x, py + s * Math.cos(al) - o * Math.sin(al), pz + s * Math.sin(al) + o * Math.cos(al)];
  for (const x of [-hw + 1.5, 0, hw - 1.5]) for (const e of [-0.6, 0.6]) ring(I, F.p(...sl(Hs - 0.25, x + e, 0.28)), F.yaw);
  // the falsework under it: rows of posts with a cap balk and raking braces, standing on sleepers
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.1);
  for (const s of [Hs * 0.42, Hs * 0.74]) {
    const q = sl(s, 0, -0.3), n = Math.max(3, Math.round(H.w / 5));
    b.beam([-hw + 0.6, q[1] - 0.2, q[2]], [hw - 0.6, q[1] - 0.2, q[2]], 0.4, 0.4);
    for (let i = 0; i <= n; i++) { const x = lerp(-hw + 1, hw - 1, i / n); b.beam([x, 0.3, q[2]], [x, q[1] - 0.4, q[2]], 0.36, 0.36); b.beam([x, 0.3, q[2] + q[1] * 0.45], [x, q[1] - 0.8, q[2]], 0.26, 0.26); }
    sleeper(I, F.p(0, 0.15, q[2]), F.yaw, H.w + 1); sleeper(I, F.p(0, 0.15, q[2] + q[1] * 0.45), F.yaw, H.w + 1);
  }
  yield;
  // the shear-legs: two poles astride the front, lashed at the head, a tackle down to the front's upper edge
  const ax = [0, 26, pz + Hs * 0.62], tp = sl(Hs, 0, 0.3);
  b.surf(SURF.LACQUER).col(mul(COL.timber, 0.8), 0.85, 1.1);
  for (const sx of [-1, 1]) b.beam([sx * (hw + 3.5), 0.2, ax[2] + 2], [sx * 0.3, ax[1], ax[2]], 0.5, 0.5);
  b.surf(SURF.PLAIN).col(COL.rope, 1, 1);
  b.beam([0, ax[1] - 0.6, ax[2]], [tp[0], tp[1] + 2.4, tp[2]], 0.12, 0.12);
  for (const sx of [-1, 1]) b.beam([0, tp[1] + 2.2, tp[2]], [sx * hw * 0.5, tp[1] + 0.2, tp[2]], 0.09, 0.09);
  for (const sx of [-1, 1]) b.beam([0, ax[1], ax[2]], [sx * (hw + 2.5), 0.2, ax[2] + 7], 0.1, 0.1);
  b.beam([0, ax[1], ax[2]], [0, top + 0.5, -hd + 1], 0.1, 0.1);
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); b.cbox(0, ax[1] - 1.5, ax[2], 0.7, 1.1, 0.5); b.cbox(tp[0], tp[1] + 2.0, tp[2], 0.7, 1.0, 0.5); for (const sx of [-1, 1]) b.cbox(sx * (hw + 2.5), 0, ax[2] + 7, 1.2, 0.7, 1.2);
  // the derrick: a mast on a sleeper base with a long jib over the plot, its block and hook hanging still
  // (it stands off the building's end toward the line, 19 m from it, on the lot left open between this building
  // and the street; its guys go down on the building's side and behind it, none toward the road)
  const ea = F.p(hw + 8, 0, pz + 15), eb = F.p(-hw - 8, 0, pz + 15), zs = P.gapXZ(ea[0], ea[2], 90).dist <= P.gapXZ(eb[0], eb[2], 90).dist ? 1 : -1, mx = zs * (hw + 8), mz = pz + 15, mh = 31, jb = [mx - zs * 15, 25, mz - 6];
  b.surf(SURF.STEEL).col(mul(COL.green, 1.3), 0.9, 1.15);
  b.beam([mx, 0.6, mz], [mx, mh, mz], 0.8, 0.8); b.beam([mx, 2.2, mz], jb, 0.6, 0.6);
  b.surf(SURF.PLAIN).col(COL.rope, 1, 1);
  b.beam([mx, mh, mz], jb, 0.1, 0.1); b.beam(jb, [jb[0], 15.5, jb[2]], 0.1, 0.1);
  for (const g of [[mx - zs * 9, mz + 12], [mx + zs * 4, mz + 13], [mx + zs * 1, mz - 17]]) { b.beam([mx, mh, mz], [g[0], 0.3, g[1]], 0.1, 0.1); b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); b.cbox(g[0], 0, g[1], 1.1, 0.6, 1.1); b.surf(SURF.PLAIN).col(COL.rope, 1, 1); }
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.25); b.cbox(jb[0], 14.3, jb[2], 0.9, 1.3, 0.6); b.cyl(jb[0], 13.2, jb[2], 0.1, 0.1, 1.1, 5); b.cbox(mx - zs * 1.6, 0.6, mz, 2.4, 1.8, 2.0);
  for (const dz of [-1.4, 1.4]) sleeper(I, F.p(mx, 0.15, mz + dz), F.yaw, 5);
  b.pop();
  I.shadows.push({ kind: 'pole', p: F.p(mx, 0, mz), h: mh, w: 1 }, { kind: 'pole', p: F.p(0, 0, ax[2]), h: ax[1], w: 1.2 });
}

// a low crib stack on the ground at (x, z): two courses of two balks, turned by yaw (k7: its tone; 0.3 old and dark)
function cribLow(I, x, z, yaw = 0, k7 = 0.4) {
  for (let k = 0; k < 2; k++) {
    const yk = yaw + (k ? Math.PI / 2 : 0), vx = Math.sin(yk), vz = Math.cos(yk);
    for (const sg of [-0.48, 0.48]) I.cribs.push([x + vx * sg, 0.17 + k * 0.32, z + vz * sg, yk, 1.5, 0.3, 0.34, k7]);
  }
}
// a storm lantern on an iron crook standing on the ground at (x, z), its arm toward (ax, az)
function lanternCrook(b, I, x, z, ax = 0.3, az = 0) {
  b.flood(0); b.surf(SURF.STEEL).col(mul(COL.iron, 1.5), 1, 1.2);
  b.beam([x, 0, z], [x, 1.75, z], 0.07, 0.07); b.beam([x, 1.75, z], [x + ax, 1.68, z + az], 0.05, 0.05); b.cbox(x, 0, z, 0.4, 0.06, 0.4, {});
  lantern(I, [x + ax, 1.66, z + az], true);
}
// THE PALACE HALF TAKEN DOWN (the book's sentence as a standing state, the same on every seed at every clock). It
// stands on the street's fair side by the square, on its skids and lit cribs like every building.
// TAKEN APART, NOT BROKEN: its ground storey is whole and finished on all four sides (a rusticated storey of
// arched glazed windows, some shuttered, ONE LIT; its door under a porch of four columns that stand against the
// wall, full height, with their capitals and a level architrave across them and the porch's flat roof on that; a
// gas lamp on a bracket by the door; its worn steps on their jacks).
// ITS WALLS END ONE COURSE ABOVE THE UPPER SILLS IN ONE LEVEL LINE, ALL ROUND. Over the string
// course the upper storey's wall stands 1.11 m: its breast to the sills, then ONE COURSE of stone (0.36 m). Where
// an upper window stood NOTHING STANDS in the gap (no sash, no jamb, no glass): the window leaves A SHALLOW WIDE
// NOTCH, 1.3 m wide and one course deep, with its sill under it; the piers' top beds lie open with their dowel
// holes, every stone whole. No head, no lintel, no cornice above: a low level wall with shallow notches.
// FROM ABOVE IT IS OPEN TO THE SKY: no roof, no parapet: the wall tops one level bed of stone (notched only where
// a window stood), and within, 1.1 m below, the swept bare floor of the upper storey with five low closed crates.
// No crane, scaffold, ladder, hoarding, heap, dust or broken thing; nothing hangs in a sling.
// ITS OWN TOP STANDS BESIDE IT in its yard (yardInto) in the order it came off.
export function* palaceDownInto(b, P, I) {
  const D = P.stone.down, F = frameAt(P, D.d, D.z, D.face), hw = D.w / 2, hd = D.dp / 2, st = stoneOf(0.36);
  Y0 = D.lift;
  // (yF: the upper floor, the string course's top; yS: the upper windows' sills; yT: THE LEVEL LINE, one course
  // of 0.36 m above those sills)
  const yP = Y0 + 0.9, hG = 4.6, yG = yP + hG, yF = yG + 0.25, yS = yF + 0.75, yT = yS + 0.36, nb = 9, bay = 2 * hw / nb, nz = 6, bz = 2 * hd / nz, o = { cellW: bay, cellH: hG }, oz = { cellW: bz, cellH: hG };
  b.tr(F.x, 0, F.z, F.yaw);
  skidsInto(b, I, F, hw, -hd, hd, true, 6);
  b.flood(1.35, Y0, 1.2);
  b.surf(SURF.MASONRY, 0, 0.8).col(mul(st, 0.84), 0.82, 1); b.box(-hw - 0.25, Y0, -hd - 0.25, hw + 0.25, yP, hd + 0.25, { m: 1 });
  b.flood(0);
  // the ground storey's walls: the front's third bay is the lit window
  const xl = -hw + bay * 2;
  b.surf(SURF.ARCHED, 0.21, 0).col(mul(st, 0.88), 0.9, 1); b.wall(-hw, hd, xl, hd, yP, yG, o);
  b.surf(SURF.ARCHED, 0.21, 9).col(mul(st, 0.88), 0.9, 1); b.wall(xl, hd, xl + bay, hd, yP, yG, o);
  b.surf(SURF.ARCHED, 0.21, 0).col(mul(st, 0.88), 0.9, 1); b.wall(xl + bay, hd, hw, hd, yP, yG, o);
  b.wall(hw, hd, hw, -hd, yP, yG, oz); b.wall(hw, -hd, -hw, -hd, yP, yG, o); b.wall(-hw, -hd, -hw, hd, yP, yG, oz);
  // rusticated piers between the windows on the front and both ends (their feet in the lanterns' light)
  b.flood(1.0, yP + 0.5, 2.6);
  b.surf(SURF.MASONRY, 0, 1.2).col(mul(st, 0.93), 0.84, 1.02);
  for (let i = 0; i <= nb; i++) { const x = clamp(-hw + i * bay, -hw + 0.45, hw - 0.45); b.box(x - 0.45, yP, hd, x + 0.45, yG - 0.25, hd + 0.15, { m: 1, top: false }); }
  for (let i = 0; i <= nz; i++) { const z = clamp(-hd + i * bz, -hd + 0.45, hd - 0.45); for (const sx of [-1, 1]) b.box(sx > 0 ? hw : -hw - 0.15, yP, z - 0.45, sx > 0 ? hw + 0.15 : -hw, yG - 0.25, z + 0.45, { m: 1, top: false }); }
  b.flood(0);
  // closed shutters on three of the front's windows (dull green boards, two leaves each)
  b.surf(SURF.PLANKS).col([0.1, 0.17, 0.13], 0.9, 1.05);
  for (const i of [0, 5, 7]) { const x = -hw + (i + 0.5) * bay; for (const sx of [-0.5, 0.5]) b.box(x + sx - 0.47, yP + 0.95, hd + 0.02, x + sx + 0.47, yP + 3.25, hd + 0.08, {}); }
  // the string course
  b.surf(SURF.PLAIN).col(mul(st, 1.07), 0.9, 1); b.box(-hw - 0.3, yG - 0.25, -hd - 0.3, hw + 0.3, yF, hd + 0.3, { top: true, bottom: true });
  yield;
  // THE UPPER STOREY'S FOOT: one side at a time in a frame turned so that the wall runs along X with its outer
  // face at z = half (len: the side's length; n: its windows; inset: the ends' two sides stop short of the
  // corners, which are the front's and the back's; full: no longer read, every side is built alike)
  const t = 0.75, ww = 0.65, cap = { m: 1, capStyle: SURF.MASONRY, capM: 0.8, capColor: mul(st, 1.12) }, M4 = new THREE.Matrix4();
  const side = (rot, half, len, n, inset, full) => {
    const x0 = -len / 2 + inset, x1 = len / 2 - inset, zs = half - t / 2, xc = (i) => -len / 2 + (i + 0.5) * len / n;
    b.push(M4.makeRotationY(rot));
    b.surf(SURF.MASONRY, 0, 0.9).col(st, 0.95, 1); b.box(x0, yF, half - t, x1, yS, half, cap);
    for (let i = 0; i <= n; i++) {
      const xa = i === 0 ? x0 : xc(i - 1) + ww, xb = i === n ? x1 : xc(i) - ww, xm = (xa + xb) / 2;
      b.surf(SURF.MASONRY, 0, 0.9).col(st, 0.95, 1); b.box(xa, yS, half - t, xb, yT, half, cap);
      // (the dowel hole of the pier's top bed)
      b.surf(SURF.PLAIN).col([0.05, 0.045, 0.04], 1, 1); b.quad([xm - 0.08, yT + 0.012, zs + 0.08], [xm + 0.08, yT + 0.012, zs + 0.08], [xm + 0.08, yT + 0.012, zs - 0.08], [xm - 0.08, yT + 0.012, zs - 0.08]);
    }
    for (let i = 0; i < n; i++) {
      const x = xc(i);
      // NOTHING STANDS IN THE GAP: no sash, no glass, no jamb. The window's place is a shallow wide notch one
      // course deep; under it its moulded sill, which is all that is left of the window
      b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.88, 1.02);
      b.box(x - ww - 0.3, yS - 0.14, half, x + ww + 0.3, yS, half + 0.16, { bottom: true });
    }
    b.pop();
  };
  side(0, hd, 2 * hw, nb, 0, true); yield;
  side(Math.PI / 2, hw, 2 * hd, nz, t, true); side(-Math.PI / 2, hw, 2 * hd, nz, t, true); yield;
  side(Math.PI, hd, 2 * hw, nb, 0, false);
  yield;
  // within: the swept floor of boards at the upper storey's own level, and five closed crates set square in one
  // corner (low crates, 0.5 to 0.9 m: none stands over the level line, which is 1.11 m over the floor)
  b.surf(SURF.PLANKS).col(mix3(COL.timber, COL.cream, 0.45), 0.9, 1.02); b.box(-hw + t, yF - 0.2, -hd + t, hw - t, yF, hd - t, { sides: false, capM: 0.6 });
  b.surf(SURF.PLANKS).col(mul(COL.timber, 1.05), 0.85, 1.05);
  for (const [cx, cz, sx, sy, sz] of [[-hw + 3.2, -hd + 3, 2.2, 0.85, 1.5], [-hw + 6, -hd + 3, 1.8, 0.7, 1.5], [-hw + 3.2, -hd + 5.3, 2.2, 0.65, 1.4], [-hw + 8.6, -hd + 3, 1.6, 0.9, 1.5], [-hw + 6, -hd + 5.3, 1.8, 0.5, 1.4]]) {
    b.cbox(cx, yF, cz, sx, sy, sz, { m: 0.8, capColor: mul(COL.timber, 1.2) });
    for (const e of [-1, 1]) b.cbox(cx + e * (sx / 2 - 0.18), yF, cz, 0.12, sy + 0.03, sz + 0.06, {});
  }
  yield* palacePorchInto(b, P, I, F, D, st, yP, yG, bay);
  // (the lifting eyes stand on the upper storey's breast, under the windows' sills)
  ringsInto(I, F, hw, hd, yF + 0.3, 7.6, 0.02);
  b.pop();
  I.shadows.push({ kind: 'box', d: D.d, z: D.z, face: D.face, hw, hd, y0: Y0, h: yT });
  I.solids.push({ kind: 'box', F, hw: hw + 0.4, hd: hd + 0.4, h: yT + 0.3, id: 'down' });
  yield* yardInto(b, P, I, st);
}
// the palace's porch: a floor at the ground storey's level, FOUR COLUMNS standing against the wall either side of
// the door, full height with their capitals, a level architrave across them and the porch's flat roof on that
// (nothing stands open to the sky); the door in its stone surround, a gas lamp on a bracket; the steps on jacks
function* palacePorchInto(b, P, I, F, D, st, yP, yG, bay) {
  const hd = D.dp / 2, pw = 4 * bay, zc = hd + 2.45, r = 0.42, colH = yG - 0.55 - yP;
  b.flood(1.0, yP, 2.5);
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.95), 0.85, 1); b.box(-pw / 2 - 0.3, Y0, hd, pw / 2 + 0.3, yP, hd + 3.2, { m: 1 });
  b.flood(0);
  for (const k of [-1.5, -0.5, 0.5, 1.5]) columnInto(b, k * bay, yP, zc, r, colH, st);
  yield;
  b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 1.03), 0.95, 1); b.box(-pw / 2 + 0.1, yG - 0.55, hd, pw / 2 - 0.1, yG + 0.05, hd + 3.0, { m: 1, bottom: true });
  b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.85, 1); b.box(-pw / 2 - 0.3, yG + 0.05, hd, pw / 2 + 0.3, yG + 0.4, hd + 3.4, { bottom: true });
  // the door in the middle bay: two leaves of dark green boards in a stone surround, a plain hood
  b.surf(SURF.PLANKS).col([0.07, 0.12, 0.1], 0.9, 1.05); b.box(-0.95, yP, hd + 0.02, 0.95, yP + 3.3, hd + 0.1, {});
  b.surf(SURF.PLAIN).col(mul(st, 1.06), 0.9, 1);
  for (const sx of [-1, 1]) b.box(sx > 0 ? 0.95 : -1.3, yP, hd, sx > 0 ? 1.3 : -0.95, yP + 3.5, hd + 0.2, {});
  b.box(-1.5, yP + 3.5, hd, 1.5, yP + 3.85, hd + 0.3, { bottom: true });
  // the lamp on its bracket by the door (a gas mantle, steady)
  b.surf(SURF.STEEL).col(COL.green, 0.8, 1.1); b.beam([2.1, yP + 2.9, hd + 0.1], [2.1, yP + 3.1, hd + 0.75], 0.05, 0.05);
  b.flood(3, yP + 3.5, 2).surf(SURF.PLAIN).col([0.95, 0.92, 0.66], 1, 1).cbox(2.1, yP + 2.62, hd + 0.75, 0.26, 0.42, 0.26, {}); b.flood(0);
  lamp(I, F.p(2.1, yP + 2.85, hd + 0.75), 1.3, 0, -1, 3);
  const zEnd = stepsInto(b, st, pw - 1.6, hd + 3.2, yP, 0.5);
  I.solids.push({ kind: 'box', F, hw: pw / 2 + 0.6, z0: hd, z1: zEnd, h: yG + 0.6, id: 'down' });
  // a skid and its cribs under the porch's front
  b.flood(1.2, Y0 - 0.5, 1.4); bearerInto(b, [-pw / 2 - 0.8, Y0 - SKID / 2, hd + 2.6], [pw / 2 + 0.8, Y0 - SKID / 2, hd + 2.6]); b.flood(0);
  for (let i = 0; i <= 3; i++) cribAt(I, F, lerp(-pw / 2 + 0.4, pw / 2 - 0.4, i / 3), hd + 2.6, Y0, true);
}
// THE PALACE'S YARD: ITS OWN TOP, SET DOWN BESIDE IT IN THE ORDER IT CAME OFF, every piece whole. In its south
// half its PEDIMENT LIES FLAT ON ITS BACK on low cribs, whole, its one moulded face to the sky (12 m and more from
// the street's middle); then, in neat stacks square to one another: three lengths of its moulded
// cornice (the fronts' own), four lengths of its balustrade lying flat in a stack of two layers, four squared
// blocks of its upper wall in two tiers with bearers between, its roof's copper sheets, its slates, its roof
// timbers bundled. A small lifting eye on the
// stones, a rope sling round each stack of roof stuff; three storm lanterns. Its one wagon stands at the yard's
// back, its drawbar toward the lane out (planTrailers).
function* yardInto(b, P, I, st) {
  const Y = P.stone.yard, zc = (Y.z0 + Y.z1) / 2, X = P.X;
  // THE PEDIMENT LIES FLAT ON ITS BACK in the yard's south half, across the yard (its length across the street's
  // line, its nearest stone 12 m from the street's middle), on five low crib stacks: its sawn back down, ITS ONE
  // MOULDED FACE TO THE SKY (the bed course and the level cornice along its south edge, the two raking cornices
  // rising north to the apex, the sunk field between them, and at the field's middle A SMALL CARVED ROSETTE of
  // eight plain leaves round a boss: no figure, no face). It lies 0.66 m up and is 0.8 m through: a carved stone
  // laid down, nothing like a tent or a roof. No frame, no prop: nothing of it stands. A lifting eye at each end.
  const G = frameAt(P, Y.d1 - 12.3, zc - 9.3, -Math.PI / 2), flat = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  // (the frame's +Z looks south: the pediment's rise runs north from its bed, toward the frame's -Z)
  // (four of its five cribs here; the fifth, under its apex, is laid with the wall's stones below, so that the
  // yard lays as many balks as before and every older balk keeps its place in the list and its tone)
  for (const [lx, lz] of [[-4.6, -0.4], [4.6, -0.4], [-2.4, -1.2], [2.4, -1.2]]) { const p = G.p(lx, 0, lz); cribLow(I, p[0], p[2], G.yaw, 0.34); }
  b.tr(G.x, 0.66 + 0.3, G.z, G.yaw);
  b.push(flat);
  b.flood(0.7, 1.2, 3.5);
  pedimentShape(b, st, 6.0, 3.2, 0.3);
  // (its sunk field lies in the shade of its own cornices: a darker stone than the mouldings round it)
  b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 0.5), 0.92, 1.04); b.tri([-5.3, 0.97, 0.02], [5.3, 0.97, 0.02], [0, 0.95 + 3.2 - 0.6, 0.02]);
  // the rosette, cut in the field: eight leaves (each two facets, one in light and one in shade) round a boss
  { const cy = 0.95 + 1.2, r0 = 0.16, r1 = 0.62;
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU, a0 = a - 0.3, a1 = a + 0.3, tip = [r1 * Math.cos(a), cy + r1 * Math.sin(a), 0.03], mid = [r0 * Math.cos(a), cy + r0 * Math.sin(a), 0.11];
      b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.9, 1.02); b.tri(mid, [0.42 * Math.cos(a0), cy + 0.42 * Math.sin(a0), 0.03], tip);
      b.col(mul(st, 0.66), 0.95, 1.02); b.tri(mid, tip, [0.42 * Math.cos(a1), cy + 0.42 * Math.sin(a1), 0.03]);
    }
    b.col(mul(st, 1.04), 0.9, 1.02); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, c = (k + 1) / 6 * TAU; b.tri([0, cy, 0.14], [r0 * Math.cos(a), cy + r0 * Math.sin(a), 0.1], [r0 * Math.cos(c), cy + r0 * Math.sin(c), 0.1]); } }
  b.flood(0);
  b.pop();
  b.pop();
  for (const lx of [-6.3, 6.3]) ring(I, G.p(lx, 0.66 + 0.45, -0.4), G.yaw + Math.sign(lx) * Math.PI / 2);
  // (one lantern by the street before the stacks, one at the pediment's street end, 10.5 m from the street's middle)
  lanternCrook(b, I, X(Y.d1 - 2.3), zc + 2.2, 0, 0.3); lanternCrook(b, I, X(Y.d1 - 4.6), zc - 7.2, 0, -0.3);
  yield;
  // a pale bearer on the ground under a stack, along the world's x at (x, z), len long
  const bearer = (x, z, len) => I.cribs.push([x, 0.13, z, 0, len, 0.26, 0.3, 1.0]);
  b.flood(0.8, 1, 2.5);
  // the cornice: three lengths abreast, each 5 m (in the yard's north half, north of the lying pediment)
  let cx = X(Y.d1 - 13.6), cz = zc + 5.5;
  for (const dz of [-1.6, 1.6]) bearer(cx, cz + dz, 4.3);
  b.tr(cx, 0, cz, 0);
  for (const lx of [-1.38, 0, 1.38]) corniceLen(b, st, lx, 0.26, -2.5, 2.5);
  b.pop();
  for (const lx of [-1.38, 0, 1.38]) { ring(I, [cx + lx, 0.6, cz + 2.52], 0); ring(I, [cx + lx, 0.6, cz - 2.52], Math.PI); }
  // THE BALUSTRADE LIES FLAT IN A STACK: four lengths of 4 m, two abreast in two layers
  // on bearers, battens between the layers; each length on its side, so that its foot, its row of balusters and
  // its rail lie side by side and look up. By the street, north of the pediment (its near edge 13.6 m from the
  // street's middle).
  { const bx = X(Y.d1 - 8.9), bz = zc + 5.3;
    for (const dz of [-1.3, 1.3]) bearer(bx, bz + dz, 2.9);
    b.tr(bx, 0, bz, 0);
    for (const lx of [-0.66, 0.66]) { balFlat(b, st, lx, 0.26, -2, 2, false); balFlat(b, st, lx, 0.84, -2, 2, true); }
    b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const dz of [-1.3, 0, 1.3]) b.box(-1.3, 0.74, dz - 0.07, 1.3, 0.84, dz + 0.07, {});
    b.pop();
    ring(I, [bx, 0.5, bz + 2.02], 0); }
  yield;
  // THE UPPER WALL'S OWN STONES, SQUARED: four dressed blocks of its ashlar in a square stack of two tiers, two
  // abreast, on two bearers, WITH TWO TIMBER BEARERS BETWEEN THE TIERS (every face flat, every edge square: a
  // stack of cut stone; nothing rounded lies in the yard)
  cx = X(Y.d1 - 17.6); cz = zc - 2.0;
  { const p = G.p(0, 0, -2.2); cribLow(I, p[0], p[2], G.yaw, 0.34); }
  for (const dz of [-0.8, 0.8]) bearer(cx, cz + dz, 3.0);
  for (const dz of [-0.8, 0.8]) I.cribs.push([cx, 0.26 + 0.62 + 0.06, cz + dz, 0, 3.0, 0.12, 0.16, 1.0]);
  for (let tier = 0; tier < 2; tier++) {
    const y = 0.26 + tier * 0.74;
    for (const lx of [-0.71, 0.71]) { b.surf(SURF.MASONRY, 0, 0.7).col(mul(st, tier ? 1.0 : 0.95), 0.9, 1.03); b.cbox(cx + lx, y, cz, 1.3, 0.62, 2.5, { m: 1, capColor: mul(st, 1.08) }); }
  }
  for (const sx of [-1, 1]) ring(I, [cx + sx * 1.37, 1.3, cz + 0.6], sx * Math.PI / 2);
  // the roof's copper: four sheets' thickness in a neat stack, a rope sling round it
  cz = zc + 1.4;
  for (const dz of [-0.9, 0.9]) bearer(cx, cz + dz, 2.0);
  for (let k = 0; k < 4; k++) { b.surf(SURF.STEEL).col(mul(COL.copper, k % 2 ? 0.9 : 1.05), 0.9, 1.1); b.cbox(cx + (k % 2 ? 0.04 : -0.04), 0.26 + k * 0.19, cz, 1.6, 0.16, 2.8, {}); }
  for (const dz of [-0.8, 0.8]) { rope(b, [cx - 0.86, 0.26, cz + dz], [cx - 0.86, 1.05, cz + dz], 0.07); rope(b, [cx - 0.86, 1.05, cz + dz], [cx + 0.86, 1.05, cz + dz], 0.07); rope(b, [cx + 0.86, 1.05, cz + dz], [cx + 0.86, 0.26, cz + dz], 0.07); }
  // the slates: two stacks on edge
  for (const dz of [5.2, 7.3]) {
    bearer(cx, zc + dz - 0.5, 1.7); bearer(cx, zc + dz + 0.5, 1.7);
    b.surf(SURF.MASONRY, 0, 0.3).col(COL.slate, 0.9, 1.1); b.cbox(cx, 0.26, zc + dz, 1.4, 0.95, 1.6, { m: 4, capColor: mul(COL.slate, 1.25) });
    rope(b, [cx - 0.74, 0.26, zc + dz], [cx - 0.74, 1.25, zc + dz], 0.07); rope(b, [cx - 0.74, 1.25, zc + dz], [cx + 0.74, 1.25, zc + dz], 0.07); rope(b, [cx + 0.74, 1.25, zc + dz], [cx + 0.74, 0.26, zc + dz], 0.07);
  }
  // the roof timbers: six old beams 8 m long in a bundle of two layers along the yard's north side, two slings
  // (6.7 m long, between the yard's wagon and the pediment's west end)
  const tx0 = Math.min(X(Y.d1 - 21.5), X(Y.d1 - 14.8)), tz = Y.z1 - 1.1;
  bearer(tx0 + 1.3, tz, 1.3); bearer(tx0 + 5.4, tz, 1.3);
  b.surf(SURF.PLANKS).col(mul(COL.timber, 0.62), 0.9, 1.05);
  for (let l = 0; l < 2; l++) for (let i = 0; i < 3; i++) b.box(tx0, 0.26 + l * 0.3, tz - 0.5 + i * 0.34, tx0 + 6.7, 0.26 + l * 0.3 + 0.28, tz - 0.5 + i * 0.34 + 0.3, { m: 0.6 });
  b.flood(0);
  for (const dx of [1.7, 5.0]) { rope(b, [tx0 + dx, 0.26, tz - 0.56], [tx0 + dx, 0.9, tz - 0.56], 0.07); rope(b, [tx0 + dx, 0.9, tz - 0.56], [tx0 + dx, 0.9, tz + 0.54], 0.07); rope(b, [tx0 + dx, 0.9, tz + 0.54], [tx0 + dx, 0.26, tz + 0.54], 0.07); }
  lanternCrook(b, I, X(Y.d1 - 14.6), zc - 0.4, 0.3, 0);
}
// the open court in the west row: a low marble balustrade on the street's side with a gap at its middle, two urns
// on plinths (each on its own small skid), clipped box in tubs
export function* courtInto(b, P, I) {
  const C = P.stone.court; if (!C) return;
  const F = frameAt(P, C.d, C.z, C.face), hw = C.w / 2, hd = C.dp / 2, st = COL.marble;
  b.tr(F.x, 0, F.z, F.yaw);
  for (const sg of [-1, 1]) {
    b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 0.95), 0.9, 1); b.box(sg > 0 ? 4 : -hw, 0, hd - 0.5, sg > 0 ? hw : -4, 0.35, hd, { m: 1 });
    b.surf(SURF.PLAIN).col(mul(st, 1.05), 0.9, 1); b.box(sg > 0 ? 4 : -hw, 1.0, hd - 0.45, sg > 0 ? hw : -4, 1.18, hd - 0.05, { bottom: true });
    for (let x = 4.3; x < hw; x += 0.7) b.cbox(sg * x, 0.35, hd - 0.25, 0.2, 0.65, 0.2, {});
    // an urn on a plinth by the gap, on a skid of its own
    const ux = sg * 5.2, uz = hd - 3;
    for (const dz of [-0.7, 0.7]) sleeper(I, F.p(ux, 0.15, uz + dz), F.yaw, 2.6);
    b.surf(SURF.STEEL).col(COL.iron, 1, 1.15); for (const dx of [-0.7, 0.7]) b.beam([ux + dx, 0.5, uz - 1.6], [ux + dx, 0.5, uz + 1.6], 0.3, 0.36);
    b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 0.95), 0.9, 1); b.cbox(ux, 0.7, uz, 1.5, 1.3, 1.5, { m: 1 });
    b.surf(SURF.PLAIN).col(st, 0.9, 1.05); b.lathe(ux, 2.0, uz, [[0.3, 0], [0.22, 0.25], [0.7, 0.8], [0.8, 1.3], [0.6, 1.45], [0.7, 1.6]], 12);
  }
  b.surf(SURF.PLAIN).col(COL.moss, 0.55, 1.05);
  for (let i = 0; i < 4; i++) for (const sg of [-1, 1]) { const x = sg * (9 + (i >> 1) * 8), z = (i % 2 ? -1 : 1) * hd * 0.45; b.cbox(x, 0.9, z, 1.6, 1.5, 1.6, { capColor: mul(COL.moss, 1.2) }); b.surf(SURF.PLANKS).col(COL.green, 0.85, 1); b.cbox(x, 0, z, 1.3, 0.9, 1.3, {}); b.surf(SURF.PLAIN).col(COL.moss, 0.55, 1.05); }
  b.pop();
  yield;
}
// the plain monument: a great obelisk on five broad steps and a moulded die, on its own skids (its steps' edge
// 8.7 m from the line, which passes at twice their height). No collar and no ring on its shaft. It
// stands IN A TIMBER CRADLE: two frames of pale balks clamped round the shaft with packing blocks at its corners,
// four posts between the frames, four short rakers from the die's cap to the lower frame, and rope slings (pale
// hemp) lying ready down each face from the upper frame to the lower. Nothing stands at its foot or on its steps.
// At dusk its upper shaft and point hold the last light (AFTER, see buildStone).
export function obeliskInto(b, P, I) {
  Y0 = 1.2;
  const O = P.stone.obelisk, F = frameAt(P, O.d, O.z, 0), st = COL.marble, h = O.h;
  b.tr(F.x, 0, F.z, F.yaw);
  skidsInto(b, I, F, 5.2, -5.2, 5.2, true, 6, 0);
  b.flood(0.7, Y0, 5);
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.95), 0.85, 1);
  for (let k = 0; k < 5; k++) b.cbox(0, Y0 + k * 0.42, 0, 10.4 - k * 1.5, 0.42, 10.4 - k * 1.5, { m: 1 });
  const y0 = Y0 + 2.1;
  b.cbox(0, y0, 0, 3.4, 2.6, 3.4, { m: 1 });
  b.surf(SURF.PLAIN).col(mul(st, 1.06), 0.9, 1); b.cbox(0, y0 + 2.6, 0, 3.9, 0.32, 3.9, { bottom: true }); b.cbox(0, y0 - 0.02, 0, 3.8, 0.3, 3.8, {});
  const ys = y0 + 2.92, hs = h - 2.2 - ys, ym = ys + hs * 0.66, wm = lerp(2.5, 1.5, 0.66);
  b.surf(SURF.PLAIN).col(st, 0.92, 1.02); b.frustum(0, 0, 2.5, 2.5, wm, wm, ys, ym, { top: false });
  // (the shaft's upper third and its point: the last light on it at dusk)
  b.flood(AFTER * 1.5, 999, 1); b.col(st, 1, 1.04); b.frustum(0, 0, wm, wm, 1.5, 1.5, ym, h - 2.2, { top: false }); b.frustum(0, 0, 1.5, 1.5, 0, 0, h - 2.2, h);
  b.flood(0);
  // the cradle: two frames of balks, packing at the corners, posts between them, rakers from the die's cap
  const fr = [0.24, 0.56].map((t) => [ys + hs * t, lerp(2.5, 1.5, t) / 2]);
  for (const [y, a] of fr) {
    const e = a + 0.17;
    b.surf(SURF.PLANKS).col(mul(COL.timber, 1.05), 0.85, 1.05);
    for (const sg of [-1, 1]) { b.beam([-e - 0.5, y, sg * e], [e + 0.5, y, sg * e], 0.3, 0.3); b.beam([sg * e, y + 0.3, -e - 0.5], [sg * e, y + 0.3, e + 0.5], 0.3, 0.3); }
    b.col(mix3(COL.timber, COL.cream, 0.55), 0.9, 1.05);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * a, y - 0.4, sz * a, 0.3, 1.1, 0.3, {});
  }
  b.surf(SURF.PLANKS).col(mul(COL.timber, 0.95), 0.85, 1.05);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a0 = fr[0][1] + 0.5, a1 = fr[1][1] + 0.5;
    b.beam([sx * a0, fr[0][0] + 0.3, sz * a0], [sx * a1, fr[1][0], sz * a1], 0.24, 0.24);
    b.beam([sx * 1.75, ys, sz * 1.75], [sx * a0, fr[0][0] - 0.15, sz * a0], 0.26, 0.26);
  }
  // the slings: pale hemp, one down each face from the upper frame to the lower, and two turns round the shaft
  b.surf(SURF.PLAIN).col(mix3(COL.rope, COL.cream, 0.5), 0.9, 1.1);
  for (let k = 0; k < 4; k++) { const ca = Math.cos(k * Math.PI / 2), sa = Math.sin(k * Math.PI / 2), a0 = fr[0][1] + 0.36, a1 = fr[1][1] + 0.36; b.beam([ca * a1, fr[1][0] + 0.2, sa * a1], [ca * a0, fr[0][0] + 0.2, sa * a0], 0.09, 0.09); }
  for (const t of [0.6, 0.63]) { const y = ys + hs * t, a = lerp(2.5, 1.5, t) / 2 + 0.05; for (const sg of [-1, 1]) { b.beam([-a, y, sg * a], [a, y, sg * a], 0.09, 0.09); b.beam([sg * a, y, -a], [sg * a, y, a], 0.09, 0.09); } }
  b.pop();
  I.shadows.push({ kind: 'pole', p: [F.x, 0, F.z], h, w: 2.4 }); I.solids.push({ kind: 'box', F, hw: 5.3, hd: 5.3, h, id: 'obelisk' });
}
// THE SQUARE'S OWN DRESS (planDress: no basin, no bowl, no water anywhere in the stone half). Where the
// fountains stood stand TWO GREAT GAS STANDARDS, each of three mantles on a tall iron post on a stepped stone foot,
// the foot on its own skids over lit crib stacks; and young clipped trees in tubs, every one a ball, every tub on
// a small skid of two timbers and two iron runners
export function squareInto(b, P, I) {
  const st = COL.marble;
  for (const q of P.dress.grand) {
    Y0 = 1.2;
    const F = frameAt(P, q.d, q.z, 0);
    b.tr(F.x, 0, F.z, F.yaw);
    skidsInto(b, I, F, 2.2, -2.2, 2.2, true, 6, 0);
    b.flood(0.9, Y0 + 1, 3);
    b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 0.95), 0.86, 1.02);
    for (let k = 0; k < 3; k++) b.cbox(0, Y0 + k * 0.4, 0, 4.4 - k * 1.1, 0.4, 4.4 - k * 1.1, { m: 1 });
    b.surf(SURF.PLAIN).col(mul(st, 1.04), 0.9, 1.02); b.cbox(0, Y0 + 1.2, 0, 1.5, 1.3, 1.5, {}); b.cbox(0, Y0 + 2.5, 0, 1.8, 0.22, 1.8, { bottom: true });
    b.flood(0);
    const yb = Y0 + 2.72, yt = yb + 5.4;
    b.surf(SURF.STEEL).col(COL.green, 0.8, 1.1); b.lathe(0, yb, 0, [[0.34, 0], [0.2, 0.5], [0.12, 1.4], [0.09, 5.4]], 8, { smooth: true });
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * TAU + 0.5, ax = Math.cos(a) * 1.05, az = Math.sin(a) * 1.05;
      b.surf(SURF.STEEL).col(COL.green, 0.8, 1.1); b.beam([0, yt - 0.5, 0], [ax, yt - 0.1, az], 0.07, 0.07); b.frustum(ax, az, 0.6, 0.6, 0.1, 0.1, yt + 0.5, yt + 0.8, { bottom: true });
      b.flood(3, yt + 2, 2).surf(SURF.PLAIN).col([0.95, 0.92, 0.66], 1, 1).cbox(ax, yt - 0.08, az, 0.36, 0.58, 0.36, {}); b.flood(0);
      lamp(I, F.p(ax, yt + 0.4, az), 1.9, 0, -1, 3);
    }
    b.pop();
    I.shadows.push({ kind: 'pole', p: [F.x, 0, F.z], h: yt, w: 1.2 }); I.solids.push({ kind: 'round', p: [F.x, 0, F.z], r: 3.2, h: yt + 1.2 });
  }
  for (const q of P.dress.tubs) {
    const p = P.at(q.d, 0, q.z);
    // (its two balks and its two runners are pale new timber)
    for (const dz of [-0.5, 0.5]) I.sleepers.push([p[0], 0.16, p[2] + dz, 0, 1.7, 0.3, 0.3, 1.0, 1]);
    b.tr(p[0], 0.32, p[2], 0);
    b.flood(0.6, 0, 3); for (const sx of [-0.5, 0.5]) bearerInto(b, [sx, 0.09, -1.0], [sx, 0.09, 1.0], 0.16, 0.18);
    // (a white-painted tub with a darker band, pale in the gas light; the young tree's clipped green takes the
    // same light)
    b.flood(0.9, 0, 60);
    b.surf(SURF.LACQUER).col(COL.white, 0.9, 1.04); b.cbox(0, 0.18, 0, 1.5, 1.15, 1.5, { capColor: [0.1, 0.07, 0.05] });
    b.col(mul(COL.green, 1.6), 0.9, 1.05); b.cbox(0, 1.05, 0, 1.58, 0.14, 1.58, {});
    b.surf(SURF.PLAIN).col(COL.rope, 0.9, 1.1); b.cyl(0, 1.33, 0, 0.09, 0.07, 0.9, 6, { cap: false });
    b.col(mul(mix3(COL.moss, COL.turf, 0.5), 1.55), 0.72, 1.15);
    b.sphere(0, 3.25, 0, 1.2, 9, 6);
    b.flood(0);
    b.pop();
    I.shadows.push({ kind: 'pole', p: [p[0], 0, p[2]], h: 3.6, w: 1.6 }); I.solids.push({ kind: 'round', p: [p[0], 0, p[2]], r: 1.4, h: 4.8 });
  }
}
// THE DOMED HALL, taller than all: a round body of marble on cribs (a rusticated foot, a storey of arches, a storey of
// round lights), a deep cornice, then a drum ringed by sixteen columns under its own entablature, the copper dome with
// bolted ribs on that, a lantern, a pennant; small lifting eyes in pairs round the cornice
export function* hallInto(b, P, I) {
  const Hh = P.stone.hall, F = frameAt(P, Hh.d, Hh.z, Math.PI), R = Hh.r, st = COL.marble, top = Hh.h;
  Y0 = Hh.lift || 1.8;
  const yd = Hh.cornice, yc = yd + 1.3, hc = 7.2, rD = R - 5.2, rC = R - 2.4;
  b.tr(F.x, 0, F.z, F.yaw);
  skidsInto(b, I, F, R + 1, -R - 1, R + 1, nearLine(P, F), 10, 0);
  b.surf(SURF.MASONRY, 0, 0.8).col(mul(st, 0.86), 0.85, 1); b.cbox(0, Y0, 0, 2 * R + 2, 3.0, 2 * R + 2, { m: 1 });
  b.surf(SURF.ARCHED, 0.3, 1).col(mul(st, 0.92), 0.92, 1); b.lathe(0, Y0 + 3.0, 0, [[R, 0], [R, 8.2]], 24, { cellW: 3.6, cellH: 8.2 });
  b.surf(SURF.WINDOW, 0.6, 1).col(st, 0.95, 1); b.lathe(0, Y0 + 11.2, 0, [[R, 0], [R, yd - Y0 - 11.2]], 24, { cellW: 3.6, cellH: yd - Y0 - 11.2 });
  b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.9, 1); b.lathe(0, Y0 + 11.0, 0, [[R, 0], [R + 0.3, 0.1], [R + 0.3, 0.4], [R, 0.5]], 24);
  b.flood(AFTER * 1.3, 999, 1); b.lathe(0, yd, 0, [[R, 0], [R + 1.0, 0.4], [R + 1.0, 1.3], [rD, 1.3]], 24); b.flood(0);
  yield;
  // the drum and its ring of columns
  b.surf(SURF.WINDOW, 0.45, 1).col(mul(st, 0.98), 0.95, 1); b.lathe(0, yc, 0, [[rD, 0], [rD, hc + 1.4]], 20, { cellW: 3.2, cellH: hc + 1.4 });
  for (let k = 0; k < 16; k++) {
    const a = (k + 0.5) / 16 * TAU, x = Math.sin(a) * rC, z = Math.cos(a) * rC;
    b.surf(SURF.FLUTED, 0, 0.5).col(mul(st, 1.06), 0.9, 1); b.cyl(x, yc + 0.4, z, 0.62, 0.52, hc - 0.8, 8);
    b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.9, 1); b.cbox(x, yc, z, 1.5, 0.4, 1.5, {}); b.cbox(x, yc + hc - 0.4, z, 1.5, 0.4, 1.5, {});
  }
  b.lathe(0, yc + hc, 0, [[rD, 0], [rC + 1.0, 0], [rC + 1.3, 0.5], [rC + 1.3, 1.4], [rD + 0.2, 1.4]], 20);
  yield;
  const y0 = yc + hc + 1.4, dh = top - 6 - y0, prof = []; for (let i = 0; i <= 7; i++) { const a = i / 7 * Math.PI / 2; prof.push([(rD + 0.2) * Math.cos(a) + 0.01, dh * Math.sin(a)]); }
  // (AT DUSK THE DOME HOLDS THE LAST LIGHT: its copper warms to rose-gold toward the crown and gives back the
  // baked wash, more the higher; at every other hour it is plain green copper)
  b.flood(AFTER * 2.6, 999, 1);
  b.surf(SURF.STEEL).col(COL.copper, 0.85, 1.12); b.lathe(0, y0, 0, prof, 24, { smooth: true, colors: prof.map((q, i) => mix3(mul(COL.copper, 0.85 + 0.27 * i / 7), [0.86, 0.52, 0.36], AFTER * 0.62 * i / 7)) });
  b.flood(0);
  b.col(mul(COL.copper, 0.55), 1, 1);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, ca = Math.cos(a), sa = Math.sin(a); for (let i = 0; i < 7; i++) b.beam([prof[i][0] * ca, y0 + 0.05 + prof[i][1], prof[i][0] * sa], [prof[i + 1][0] * ca, y0 + 0.05 + prof[i + 1][1], prof[i + 1][0] * sa], 0.34, 0.2); }
  yield;
  const yl = y0 + dh;
  b.surf(SURF.SLIT, 0.2, 0).col(st, 0.95, 1); b.lathe(0, yl - 0.4, 0, [[2.3, 0], [2.3, 3.6]], 10, { cellW: 1.4, cellH: 3.6 });
  b.flood(AFTER * 2.6, 999, 1); b.surf(SURF.STEEL).col(mix3(COL.copper, [0.86, 0.52, 0.36], AFTER * 0.6), 0.9, 1.1); b.lathe(0, yl + 3.2, 0, [[2.8, 0], [1.6, 1.4], [0.2, 2.4], [0, 2.8]], 10, { smooth: true }); b.flood(0);
  for (let k = 0; k < 8; k++) for (const e of [-0.6, 0.6]) { const a = (k + 0.5) / 8 * TAU + e / (R + 1); ring(I, F.p(Math.sin(a) * (R + 1.02), yd + 0.85, Math.cos(a) * (R + 1.02)), F.yaw + a); }
  b.pop();
  I.flags.push({ p: [F.x, yl + 6, F.z], len: 6, h: 2.2, pole: 5.5, rgb: STONE_PEN[1], pennant: true });
  I.shadows.push({ kind: 'box', d: Hh.d, z: Hh.z, face: Math.PI, hw: R, hd: R, y0: Y0, h: top - 8 }); I.solids.push({ kind: 'box', F, hw: R + 1, hd: R + 1, h: top, id: 'hall' });
}
// the works with its one tall cold chimney, the tanks, the goods shed: at the town's far edge
export function* edgeInto(b, P, I) {
  const B = P.stone, Wk = B.works, F = frameAt(P, Wk.d, Wk.z, Math.PI), st = COL.cement, hw = Wk.w / 2, hd = Wk.dp / 2;
  // THE WORKS: grey cement on cribs, long ribbon lights, a toothed roof of six bays (slate slopes, glazed uprights)
  Y0 = Wk.lift || 1.5;
  b.tr(F.x, 0, F.z, F.yaw);
  skidsInto(b, I, F, hw, -hd, hd, nearLine(P, F), 11);
  b.surf(SURF.MASONRY, 0, 0.8).col(mul(st, 0.8), 0.85, 1); b.box(-hw - 0.2, Y0, -hd - 0.2, hw + 0.2, Y0 + 1.2, hd + 0.2, { m: 1 });
  b.surf(SURF.RIBBON, 0.4, 0.6).col(st, 0.85, 1); b.box(-hw, Y0 + 1.2, -hd, hw, Wk.h, hd, { top: false, cellW: 5, cellH: Wk.h - Y0 - 1.2 });
  b.surf(SURF.PLAIN).col(mul(st, 1.1), 0.9, 1); b.box(-hw - 0.4, Wk.h, -hd - 0.4, hw + 0.4, Wk.h + 0.5, hd + 0.4, { bottom: true, top: true });
  const nt = 6, tw = 2 * hw / nt, th = 4.2, yr = Wk.h + 0.5;
  for (let k = 0; k < nt; k++) {
    const x0 = -hw + k * tw, x1 = x0 + tw;
    b.surf(SURF.TILES).col(COL.slate, 1, 1.1); b.quad([x0, yr, hd], [x1, yr + th, hd], [x1, yr + th, -hd], [x0, yr, -hd], [0, 0, 3, 8]);
    b.surf(SURF.RIBBON, 0.2, 0.8).col(mul(st, 0.9), 1, 1); b.wall(x1, hd, x1, -hd, yr, yr + th, { cellW: 4, cellH: th });
    b.surf(SURF.PLAIN).col(mul(st, 0.95), 1, 1); b.tri([x0, yr, hd], [x1, yr, hd], [x1, yr + th, hd]); b.tri([x1, yr, -hd], [x0, yr, -hd], [x1, yr + th, -hd]);
  }
  b.pop();
  I.shadows.push({ kind: 'box', d: Wk.d, z: Wk.z, face: Math.PI, hw, hd, y0: Y0, h: Wk.h + 4 });
  yield;
  // THE WORKS ARE COLD: no smoke, no steam, no fire rises anywhere in the stone half. THE ONE CHIMNEY
  // STANDS on its skids, cold: pale cement, its iron bands, no soot, plumb.
  const ch = Wk.chimH, s1 = (ch - 7) * 0.6, s2 = ch - 7.6, prof = [[2.5, 0], [1.9, s1], [1.5, s2], [1.75, ch - 6.9], [1.75, ch - 6.2]], pale = mix3(COL.cement, COL.marble, 0.5);
  const shaft = () => {
    b.surf(SURF.MASONRY, 0, 0.6).col(pale, 0.92, 1.05); b.lathe(0, 0, 0, prof, 12, { m: 1 });
    b.surf(SURF.STEEL).col(mul(COL.iron, 1.7), 1, 1.2); for (const t of [0.2, 0.45, 0.7, 0.92]) { const rr = lerp(2.5, 1.5, t) + 0.08; b.lathe(0, s2 * t, 0, [[rr, 0], [rr, 0.4]], 12); }
  };
  for (const [cd, cz] of Wk.chim) {
    const G = frameAt(P, cd, cz, 0);
    b.tr(G.x, 0, G.z, G.yaw);
    skidsInto(b, I, G, 3.4, -3.4, 3.4, nearLine(P, G), 6, 0.1);
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(pale, 0.9), 0.85, 1); b.cbox(0, Y0, 0, 6.2, 5, 6.2, { m: 1 });
    b.tr(0, Y0 + 5, 0, 0); shaft(); b.pop();
    b.pop();
    I.shadows.push({ kind: 'pole', p: [G.x, 0, G.z], h: ch, w: 4 });
    yield;
  }
  // (no chimney lies anywhere; the one cold standing stack says the works are out)
  // the tanks: riveted drums, each on two skids over four crib stacks, a ring of lifting eyes at the shoulder
  for (const t of B.tanks) {
    const G = frameAt(P, t.d, t.z, 0), full = nearLine(P, G), lift = t.lift || 1.5;
    b.tr(G.x, 0, G.z, G.yaw);
    b.surf(SURF.STEEL).col(COL.iron, 1, 1.15);
    b.flood(1.1, lift - 0.5, 1.4);
    for (const sz of [-0.5, 0.5]) { bearerInto(b, [-t.r - 1.2, lift - SKID / 2, sz * t.r], [t.r + 1.2, lift - SKID / 2, sz * t.r]); for (const kx of [-0.8, 0.8]) cribAt(I, G, kx * t.r, sz * t.r, lift, full); lantern(I, G.p(0, lift - SKID, sz * t.r), full); }
    b.surf(SURF.PLAIN).col(mul(COL.iron, 2.2), 1, 1); b.disc(0, lift - 0.01, 0, t.r, 14, false);
    b.flood(0);
    // (oxide red plates: riveted iron among the marble and the cement)
    b.surf(SURF.STEEL).col(mix3(COL.brick, COL.iron, 0.3), 0.9, 1.15); b.lathe(0, lift, 0, [[t.r, 0], [t.r, t.h], [t.r * 0.3, t.h + 1.6], [0, t.h + 1.7]], 16, { m: 1 });
    b.col(mul(COL.iron, 1.6), 1, 1.2); for (const k of [0.33, 0.66]) b.lathe(0, lift + t.h * k, 0, [[t.r + 0.07, 0], [t.r + 0.07, 0.3]], 16);
    for (let k = 0; k < 3; k++) for (const e of [-0.6, 0.6]) { const a = k / 3 * TAU + e / t.r; ring(I, G.p(Math.sin(a) * (t.r + 0.02), lift + t.h - 0.25, Math.cos(a) * (t.r + 0.02)), G.yaw + a); }
    b.pop();
    I.shadows.push({ kind: 'box', d: t.d, z: t.z, face: 0, hw: t.r * 0.85, hd: t.r * 0.85, y0: lift, h: lift + t.h });
  }
  yield;
  // the goods shed by the carters' road: planked, on cribs, a loading platform and three wide doors along its front
  const Sh = B.shed, G = frameAt(P, Sh.d, Sh.z, Sh.face), sw = Sh.w / 2, sd = Sh.dp / 2;
  Y0 = Sh.lift || 1.2;
  b.tr(G.x, 0, G.z, G.yaw);
  skidsInto(b, I, G, sw, -sd, sd + 2.4, nearLine(P, G), 11);
  b.surf(SURF.PLANKS).col(mix3(COL.cement, COL.timber, 0.45), 0.85, 1); b.box(-sw, Y0, -sd, sw, Sh.h, sd, { top: false, m: 0.5 });
  b.col(mul(COL.timber, 0.9), 0.9, 1.05); b.box(-sw, Y0 - 0.02, sd, sw, Y0 + 0.2, sd + 2.4, { top: true, bottom: true });
  b.surf(SURF.PLANKS).col(mul(COL.green, 1.5), 0.85, 1); for (const k of [-1, 0, 1]) b.box(k * sw * 0.6 - 2.6, Y0 + 0.2, sd, k * sw * 0.6 + 2.6, Y0 + 4.2, sd + 0.12, { m: 0.5 });
  b.surf(SURF.TILES).col(COL.slate, 1, 1.1); b.gable(-sw, -sd, sw, sd, Sh.h, 4.5, { overhang: 1.6, wallColor: mix3(COL.cement, COL.timber, 0.45) });
  b.pop();
  I.shadows.push({ kind: 'box', d: Sh.d, z: Sh.z, face: Sh.face, hw: sw, hd: sd, y0: Y0, h: Sh.h + 3 });
}

// ---------------------------------------------------------------- what the wind moves: the cloth builder's own code
// Cloth is built in a second builder whose `win` carries the wave's law in place of a surface: surf(rate, phase, amp)
// (rate in radians a second, 1..9; phase 0..1; amp in metres along the normal). A vertex's u is its freedom (0 at a
// lashed edge, 1 where it flies), its v the metres along the wave. The world's cloth material reads them.
const cloth = (c, rate, phase, amp) => c.surf(rate, phase, amp);
// a sheet of cloth: fn(u, w) its place, free(u, w) its freedom (0 lashed .. 1 flying), along(u, w) the metres along
// its wave, colorFn(u, w) its colour. One side is built; the cloth's material draws both.
function sheet(c, nu, nv, fn, free, along, colorFn) {
  const v0 = c.nv; c.grid(nu, nv, fn, { colorFn });
  for (let j = 0, i = v0; j <= nv; j++) for (let k = 0; k <= nu; k++, i++) { c.U[i * 2] = free(k / nu, j / nv); c.U[i * 2 + 1] = along(k / nu, j / nv); }
}
// a rope from a to b: a stout hawser, 0.11 m through
const rope = (b, a, q, w = 0.11) => { b.surf(SURF.PLAIN).col(COL.rope, 0.9, 1.1); b.beam(a, q, w, w); };
// a stake standing at p with a painted head (an instance of the sleepers' box and a small cap in the builder)
const stake = (I, p, h = 1.1) => I.pegs.push([p[0], p[1], p[2], h]);

// WHERE A BUILDING HAS GONE ITS PLAN IS LEFT. lotInto lays one lot by the plan's own
// rectangle (d0..d1 across, z0..z1 along; sd: +1 when its street lies toward +d, -1 toward -d):
//   ONE CLOSED OUTLINE OF LOW DARK BEARERS along the lines of the house's four walls, 1.2 m inside the lot's edge:
//   old brown balks 0.36 m wide and 0.3 m high laid end to end, butted, round all four sides without a break; and
//   the lines of two inner walls (one across the house, one from that to the back wall): the plan of a house.
//   No stack, no short bar standing by itself, nothing in rows;
//   THE FLOOR THE HOUSE LEAVES, ROOM BY ROOM (lotRooms; the ground's painting): boards in two woods, red tiles,
//   buff and red tiles, kitchen flags, each room in a warm tone of its own with a dark line where a partition
//   stood; A HEARTH STONE against the back wall of the back room and A CELLAR HATCH of planks in its stone curb;
//   three STORM LANTERNS, LOW AND AT THE KERB ONLY: one set down on a low kerb stone at each street corner of the
//   lot and one left on the doorstep's cheek (no crook, no post: nothing stands round the floor);
//   ITS DOORSTEP at the street's side: three worn stone steps left standing on four screw jacks.
// The wheel marks that curve from the lot onto the lane are the ground's painting (paintGround). No peg, no cord.
// lotRooms: the rooms of a lot's floor by the lot's own measures alone (no die): the three cells the bearers' two
// inner lines leave, each cut into rooms about 10 m across, of uneven widths; kind: 0 oak boards, 1 darker
// boards laid the other way, 2 red tiles, 3 buff and red tiles, 4 kitchen flags (neighbours always differ).
function lotRooms(d0, d1, z0, z1, sd) {
  const a0 = d0 + 1.2, a1 = d1 - 1.2, c0 = z0 + 1.2, c1 = z1 - 1.2, zc = lerp(c0, c1, 0.42), dB = sd > 0 ? a0 : a1, dS = sd > 0 ? a1 : a0, dm = lerp(dB, dS, 0.45), rooms = [];
  const cut = (n, o) => { const w = []; let sum = 0, acc = 0; for (let i = 0; i < n; i++) { w.push(1 + 0.4 * (((i * 2 + o) % 3) - 1)); sum += w[i]; } return [0].concat(w.map((v) => (acc += v) / sum)); };
  [[dB, dS, c0, zc], [dB, dm, zc, c1], [dm, dS, zc, c1]].forEach(([da, db, za, zb], ci) => {
    const nd = Math.max(1, Math.round(Math.abs(db - da) / 10)), nz = Math.max(1, Math.round((zb - za) / 10)), fd = cut(nd, ci), fz = cut(nz, ci + 1);
    for (let i = 0; i < nd; i++) for (let j = 0; j < nz; j++) rooms.push({ d0: lerp(da, db, fd[i]), d1: lerp(da, db, fd[i + 1]), z0: lerp(za, zb, fz[j]), z1: lerp(za, zb, fz[j + 1]), kind: (i * 2 + j * 3 + ci * 2) % 5, cell: ci });
  });
  return rooms;
}
function lotInto(b, P, I, d0, d1, z0, z1, sd) {
  const X = P.X, a0 = d0 + 1.2, a1 = d1 - 1.2, c0 = z0 + 1.2, c1 = z1 - 1.2, zc = lerp(c0, c1, 0.42), dB = sd > 0 ? a0 : a1, dS = sd > 0 ? a1 : a0, dm = lerp(dB, dS, 0.45);
  // a wall's line from (da, za) to (db, zb), along d or along z: balks of 5 m or a little less, butted end to end
  // (old balks of weathered brown oak, the sleepers' own dark timber: low and dark round the floor's rooms)
  const wallLine = (da, za, db, zb) => {
    const len = Math.hypot(db - da, zb - za), n = Math.max(1, Math.round(len / 5)), alongZ = Math.abs(zb - za) > Math.abs(db - da);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; I.sleepers.push([X(lerp(da, db, t)), 0.15, lerp(za, zb, t), alongZ ? Math.PI / 2 : 0, len / n - 0.03, 0.3, 0.36, 0.8]); }
  };
  // (the four sides run 0.18 m past the corners, so that the outline is closed at every corner)
  wallLine(a0 - 0.18, c0, a1 + 0.18, c0); wallLine(a0 - 0.18, c1, a1 + 0.18, c1); wallLine(a0, c0 + 0.18, a0, c1 - 0.18); wallLine(a1, c0 + 0.18, a1, c1 - 0.18);
  wallLine(Math.min(a0, a1) + 0.18, zc, Math.max(a0, a1) - 0.18, zc); wallLine(dm, zc + 0.18, dm, c1 - 0.18);
  // the lanterns (the town's one lantern): two set down on low kerb stones at the lot's street corners, outside
  // the bearers' outline, and one on the doorstep's north cheek: three to a lot, as before, and in the same order
  { const zmL = (z0 + z1) / 2, deL = sd > 0 ? d1 - 0.2 : d0 + 0.2, ks = stoneOf(0.3);
    for (const [d, z, y] of [[dS + sd * 0.62, c0 + 0.4, 0.3], [dS + sd * 0.62, c1 - 0.4, 0.3], [deL - sd * 0.7, zmL + 1.6, 0.42 + 0.86]]) {
      const x = X(d);
      if (y < 0.5) { b.flood(0.5, 0.5, 1.2); b.surf(SURF.MASONRY, 0, 0.5).col(mul(ks, 0.78), 0.85, 1); b.cbox(x, 0, z, 0.56, y, 0.56, { m: 1, capColor: mul(ks, 0.9) }); b.flood(0); }
      lantern(I, [x, y + 0.62, z], true);
    } }
  // THE HEARTH STONE against the back wall of the back room (a worn slab, its top dark with old fires) and THE
  // CELLAR HATCH in the room beside it (two leaves of old planks lying shut in a low stone curb, an iron strap)
  { const rooms = lotRooms(d0, d1, z0, z1, sd), rb = rooms.find((q) => q.cell === 1), rc = rooms.find((q) => q.cell === 2), ks = stoneOf(0.3);
    const hz = (rb.z0 + rb.z1) / 2, hd = dB + sd * 0.85;
    b.flood(0); b.surf(SURF.MASONRY, 0, 0.5).col(mul(ks, 0.7), 0.85, 1); b.cbox(X(hd), 0, hz, 1.2, 0.16, 2.6, { m: 1, capColor: mul(ks, 0.3) });
    const cd = lerp(rc.d0, rc.d1, 0.3), cz = lerp(rc.z0, rc.z1, 0.62), cx = X(cd);
    b.col(mul(ks, 0.74), 0.85, 1); b.cbox(cx, 0, cz, 2.3, 0.2, 1.9, { m: 1, capColor: mul(ks, 0.84) });
    b.surf(SURF.PLANKS).col(mul(COL.timber, 0.55), 0.85, 1.05); b.cbox(cx, 0.2, cz, 1.8, 0.07, 1.4, { m: 0.6 });
    b.surf(SURF.STEEL).col(mul(COL.iron, 1.4), 1, 1.2); b.cbox(cx, 0.27, cz, 0.08, 0.03, 1.4, {}); }
  // the doorstep: three steps of worn stone between two stone cheeks, the lowest toward the street, on four
  // screw jacks (weathered like the fronts, in the lantern's low light: a flight of steps, nothing like a bench)
  const zm = (z0 + z1) / 2, de = sd > 0 ? d1 - 0.2 : d0 + 0.2, st = stoneOf(0.3), yb = 0.42;
  b.flood(0.35, 0.6, 1.5);
  for (let k = 0; k < 3; k++) {
    const da = de - sd * 0.42 * k, db = de - sd * 1.5;
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.74), 0.8, 1); b.box(Math.min(X(da), X(db)), yb, zm - 1.4, Math.max(X(da), X(db)), yb + 0.17 * (k + 1), zm + 1.4, { m: 1, bottom: k === 0, capColor: mul(st, 0.82) });
  }
  for (const sg of [-1, 1]) { const da = de + sd * 0.1, db = de - sd * 1.5; b.col(mul(st, 0.7), 0.8, 1); b.box(Math.min(X(da), X(db)), yb, zm + sg * 1.6 - 0.2, Math.max(X(da), X(db)), yb + 0.86, zm + sg * 1.6 + 0.2, { m: 1, bottom: true, capColor: mul(st, 0.8) }); }
  b.flood(0); b.surf(SURF.STEEL).col(mul(COL.iron, 1.5), 1, 1.25);
  for (const dd of [0.25, 1.25]) for (const dz of [-1.1, 1.1]) { const x = X(de - sd * dd); b.cbox(x, 0, zm + dz, 0.42, 0.08, 0.42, {}); b.cyl(x, 0.08, zm + dz, 0.09, 0.07, yb - 0.08, 6, { cap: false }); }
}
// the emptied plots at the town's edge (planStone: plots), each the lot of a front that has gone
export function* plotsInto(b, P, I) {
  for (const q of P.stone.plots) { lotInto(b, P, I, q.d - q.w / 2, q.d + q.w / 2, q.z - q.dp / 2, q.z + q.dp / 2, q.d < P.DS ? 1 : -1); yield; }
}
// THE ROW THAT HAS GONE to the wagons (the street's fair side) and the west range's emptied lot: the same
export function* goneInto(b, P, I) {
  // (no die is drawn for a lot any more: nothing in it is dealt)
  for (const q of P.stone.gone.concat(P.stone.westGone ? [P.stone.westGone] : [])) { lotInto(b, P, I, q.d - q.dp / 2, q.d + q.dp / 2, q.z - q.w / 2, q.z + q.w / 2, 1); yield; }
}

// A ROAD WAGON standing in its own frame (its length along Z, THE DRAWBAR AT +Z): a long stone dray. A
// timber bed (hl its half length) 3.4 m wide, its deck 1.42 m up, on iron-shod axles with SPOKED ROAD WHEELS
// that stand outside the bed (the hind pair 1.56 m across, the fore pair 1.24 m under a turning fore-carriage);
// the drawbar is a timber pole with two hounds, laid down on a block before the wagon, a small iron eye at its
// tip; a chock at every wheel. Nothing is coupled to it. axles: [z, radius] of each pair, the last the fore one.
const DECK = 1.42;
const WPAINT = [0.3, 0.2, 0.1];
// one spoked wheel at (x, z), its axle along X: an iron tyre on a timber felloe, ten spokes, a hub with its cap
function wheelInto(b, x, z, r) {
  const m = new THREE.Matrix4();
  b.push(m.makeRotationZ(Math.PI / 2).setPosition(x, r, z));
  b.surf(SURF.STEEL).col(mul(COL.iron, 1.3), 1, 1.1); b.lathe(0, 0, 0, [[r - 0.1, -0.07], [r, -0.07], [r, 0.07], [r - 0.1, 0.07], [r - 0.1, -0.07]], 12);
  b.surf(SURF.PLAIN).col(WPAINT, 1, 1.1);
  b.lathe(0, 0, 0, [[0.01, -0.17], [0.2, -0.08], [0.2, 0.08], [0.01, 0.17]], 6);
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, ca = Math.cos(a), sa = Math.sin(a); b.beam([0.17 * ca, 0, 0.17 * sa], [(r - 0.09) * ca, 0, (r - 0.09) * sa], 0.07, 0.06); }
  b.pop();
}
function trailerInto(b, I, F, hl = 8, axles = [[-hl + 2.6, 0.78], [hl - 2.2, 0.62]]) {
  b.surf(SURF.PLANKS).col(mul(COL.timber, 0.78), 0.9, 1.05);
  for (const x of [-1.2, 1.2]) b.box(x - 0.16, 0.98, -hl, x + 0.16, 1.27, hl, { bottom: true });
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2);
  const nc = Math.round(hl / 2);
  for (let i = 0; i <= nc; i++) { const z = lerp(-hl, hl, i / nc); b.box(-1.7, 1.05, z - 0.1, 1.7, 1.27, z + 0.1, {}); }
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); b.box(-1.7, 1.27, -hl, 1.7, DECK, hl, { m: 0.6 });
  // stanchions along the deck's edges, for the ropes
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2);
  const ns = Math.round(hl);
  for (let i = 0; i <= ns; i++) for (const x of [-1.66, 1.66]) { const z = lerp(-hl + 0.2, hl - 0.2, i / ns); b.box(x - 0.06, DECK, z - 0.06, x + 0.06, DECK + 0.5, z + 0.06, {}); }
  for (const [z, r] of axles) {
    b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); b.box(-1.95, r - 0.09, z - 0.09, 1.95, r + 0.09, z + 0.09, { bottom: true });
    b.surf(SURF.PLANKS).col(mul(COL.timber, 0.72), 0.9, 1.05); b.box(-1.45, r + 0.09, z - 0.2, 1.45, 0.98, z + 0.2, {});
    for (const sx of [-1, 1]) {
      wheelInto(b, sx * 2.02, z, r);
      b.surf(SURF.PLANKS).col(mul(COL.timber, 0.8), 1, 1);
      for (const dz of [-1, 1]) b.frustum(sx * 2.02, z + dz * (r * 0.72 + 0.1), 0.44, 0.5, 0.44, 0.14, 0, 0.3, {});
    }
  }
  // the fore-carriage's ring under the bed, the drawbar and its hounds, the block it lies on, the eye at its tip
  const zf = axles[axles.length - 1][0], rf = axles[axles.length - 1][1], zt = hl + 2.9;
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); b.cyl(0, 0.9, zf, 0.95, 0.95, 0.08, 12);
  b.surf(SURF.PLANKS).col(mul(COL.timber, 0.78), 0.9, 1.05);
  b.beam([0, rf, zf], [0, 0.36, zt - 0.3], 0.17, 0.19);
  for (const sx of [-1, 1]) b.beam([sx * 0.95, rf, zf + 0.1], [0, rf - 0.12, zf + 2.3], 0.11, 0.13);
  b.beam([-0.75, 0.4, zt - 0.55], [0.75, 0.4, zt - 0.55], 0.1, 0.1);
  b.cbox(0, 0, zt - 0.7, 0.55, 0.26, 0.4, {});
  b.surf(SURF.STEEL).col(mul(COL.iron, 1.4), 1, 1.2);
  const loop = []; for (let k = 0; k <= 6; k++) { const a = k / 6 * TAU; loop.push([0.13 * Math.cos(a), 0.36, zt - 0.14 + 0.13 * Math.sin(a)]); }
  b.tube(loop, 0.03, 3);
}
// THE TRAILER'S LANTERN: one storm lantern on an iron crook at the deck's edge toward the road (sd: that side of
// the trailer's own frame), hung beside the load at z: it lights the marble (the load's baked flood) and nothing else
function lanternPost(b, I, F, sd, z) {
  b.flood(0); b.surf(SURF.STEEL).col(mul(COL.iron, 1.4), 1, 1.2);
  b.beam([sd * 1.66, DECK, z], [sd * 1.66, DECK + 2.9, z], 0.08, 0.08); b.beam([sd * 1.66, DECK + 2.9, z], [sd * 1.5, DECK + 2.82, z], 0.06, 0.06);
  lantern(I, F.p(sd * 1.5, DECK + 2.8, z), true);
}
// ropes thrown over a load at z: from the deck's edge up over a ridge (x = 0 at height y1, half width hx) and down
function ropesOver(b, z, hx, y1) {
  rope(b, [-1.66, DECK + 0.4, z], [-hx, y1, z]); rope(b, [-hx, y1 + 0.02, z], [hx, y1 + 0.02, z]); rope(b, [hx, y1, z], [1.66, DECK + 0.4, z]);
}
// A PEDIMENT of bare marble in its own frame (X along its length, Y up its rise, Z through it).
// IT IS A SHALLOW TRIANGULAR FRONT, NOT A RIDGE. It has ONE moulded face, toward +Z: a bed course, a
// level cornice and two raking cornices, each of three members that step out 0.5 m in all (the fronts' own deep
// moulded frame), round one plain sunk field (the tympanum: no round window, no ring, no figure, no face). Its
// back, at z = -t, is one flat sawn plane. From that plane to its foremost moulding it is t + 0.5 m through:
// 0.8 m for a length of 12.5 m. Stone-coloured throughout.
function pedimentShape(b, st, hl, rise, t) {
  const top = 0.95 + rise;
  b.surf(SURF.MASONRY, 0, 0.7).col(mul(st, 0.94), 0.9, 1.02); b.box(-hl, 0, -t, hl, 0.5, 0.18, { m: 1 });
  b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.82, 1); b.box(-hl - 0.28, 0.5, -t, hl + 0.28, 0.78, 0.5, { bottom: true });
  b.col(mul(st, 0.98), 0.85, 1); b.box(-hl - 0.1, 0.78, -t, hl + 0.1, 0.95, 0.34, {});
  // the sunk field, and the flat back
  b.surf(SURF.PLAIN).col(mul(st, 0.8), 0.92, 1.04); b.tri([-hl + 0.5, 0.95, 0], [hl - 0.5, 0.95, 0], [0, top - 0.5, 0]);
  b.col(mul(st, 0.9), 0.95, 1); b.tri([hl, 0.95, -t + 0.01], [-hl, 0.95, -t + 0.01], [0, top, -t + 0.01]);
  // the raking cornices: three members, the outer the deepest, each a little under and inside the last
  for (const sx of [-1, 1]) for (const [dy, zf, k] of [[0.16, 0.5, 1.1], [-0.14, 0.34, 0.9], [-0.42, 0.18, 1.0]]) {
    b.surf(SURF.PLAIN).col(mul(st, k), 0.9, 1.03); b.beam([sx * (hl + 0.22), 0.95 + dy, (zf - t) / 2], [0, top + dy, (zf - t) / 2], zf + t, 0.3);
  }
  return top + 0.3;
}
// A PEDIMENT ON A WAGON LIES FLAT ON ITS BACK (on every wagon, the lane's as the seam's;
// none stands on a deck): along the deck on bearers, its bed at one edge of the deck and its head at the other,
// its moulded face to the sky, roped down; a lifting eye at each end
function pedimentLoad(b, I, F, st) {
  const hl = 6.0, rise = 2.1, t = 0.3, m = new THREE.Matrix4();
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const z of [-5, -2.5, 0, 2.5, 5]) b.cbox(0, DECK, z, 3.2, 0.32, 0.36, {});
  // (its length along the deck, its rise across it, its face upward)
  m.makeRotationY(-Math.PI / 2).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).setPosition(-1.62, DECK + 0.32 + t, 0);
  b.push(m); pedimentShape(b, st, hl, rise, t); b.pop();
  for (const z of [-4.4, 4.4]) ropesOver(b, z, 1.5, DECK + 0.32 + t + 0.56);
  for (const z of [-5.6, 5.6]) ring(I, F.p(-1.66, DECK + 0.5 + t, z), F.yaw - Math.PI / 2);
  return DECK + 0.32 + t + 0.9;
}
// ONE COLUMN IN ITS PIECES: four great FLUTED drums lying in file along the deck, each in a timber cradle, a hand's
// breadth of air between them so that every joint shows its sawn bed and dowel hole; its capital and its base
// stand beside them at the file's end (twenty flutes to a drum, cut in the stone: the kit's fluted surface; a
// fine joint line round each drum's middle, where two stones of the shaft meet)
function drumsLoad(b, I, F, st) {
  const m = new THREE.Matrix4(), r = 1.0, len = 2.35, y = DECK + 0.34 + r;
  for (let i = 0; i < 4; i++) {
    const z = -7.4 + i * 2.75;
    b.push(m.makeRotationX(Math.PI / 2).setPosition(0, y, z));
    b.surf(SURF.FLUTED, 0, 1).col(st, 0.92, 1.04); b.lathe(0, 0, 0, [[r, 0], [r, len]], 16, { smooth: true, uvBand: [20, 0, 1] });
    b.surf(SURF.PLAIN).col(mul(st, 0.6), 1, 1); b.lathe(0, len / 2 - 0.025, 0, [[r * 1.004, 0], [r * 1.004, 0.05]], 16);
    b.col(mul(st, 0.84), 1, 1); b.disc(0, len, 0, r * 0.97, 16); b.disc(0, 0, 0, r * 0.97, 16, false);
    b.col([0.05, 0.05, 0.06], 1, 1); b.disc(0, len + 0.01, 0, 0.17, 8); b.disc(0, -0.01, 0, 0.17, 8, false);
    b.pop();
    // the cradle: two bearers across the deck with chocks either side of the drum, and a rope over
    b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05);
    for (const dz of [0.55, len - 0.55]) { b.cbox(0, DECK, z + dz, 3.3, 0.34, 0.32, {}); for (const sx of [-1, 1]) b.frustum(sx * 0.98, z + dz, 0.75, 0.32, 0.2, 0.32, DECK + 0.34, DECK + 0.95, {}); }
    ropesOver(b, z + len / 2, 1.02, y + r + 0.05);
  }
  // the capital (a necking, the swelling round, the square abacus) and the base (a square plinth, two rounds)
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const z of [4.3, 6.75]) b.cbox(0, DECK, z, 3.0, 0.22, 2.0, {});
  b.surf(SURF.PLAIN).col(mul(st, 1.03), 0.9, 1.04);
  b.lathe(0, DECK + 0.22, 4.3, [[0.9, 0], [0.96, 0.12], [0.9, 0.24], [0.98, 0.5], [1.24, 0.95]], 14, { smooth: true }); b.cbox(0, DECK + 1.17, 4.3, 2.6, 0.36, 2.6, { bottom: true });
  b.cbox(0, DECK + 0.22, 6.75, 2.5, 0.42, 2.5, {}); b.lathe(0, DECK + 0.64, 6.75, [[1.2, 0], [1.3, 0.14], [1.2, 0.3], [1.02, 0.36], [1.12, 0.5], [1.0, 0.62], [0.94, 0.62]], 14, { smooth: true });
  for (const z of [4.3, 6.75]) ropesOver(b, z, 1.3, DECK + (z < 5 ? 1.58 : 1.3));
  return y + r;
}
// THE SMALL DOME, whole, on a timber ring across the deck: THE HALL'S OWN DOME IN SMALL: a low marble
// drum with its moulding, a shell of green copper with eight darker copper ribs, and its lantern on top (a
// little round of slit lights under a copper cap); guy ropes down to the deck, a lifting eye either side of the
// drum; two roped stacks of its cornice blocks at the deck's ends. No sheet lies on it.
function domeLoad(b, I, F, st) {
  const R = 2.45, y0 = DECK + 0.5, prof = [];
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05);
  for (const z of [-2.3, 0, 2.3]) b.cbox(0, DECK, z, 5.4, 0.5, 0.4, {});
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.95), 0.88, 1.02); b.lathe(0, y0, 0, [[R + 0.12, 0], [R + 0.12, 0.7]], 16, { m: 1 });
  b.surf(SURF.PLAIN).col(mul(st, 1.07), 0.85, 1); b.lathe(0, y0 + 0.7, 0, [[R + 0.12, 0], [R + 0.34, 0.1], [R + 0.34, 0.3], [R, 0.36]], 16);
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; prof.push([R * Math.cos(a) + 0.01, R * 0.94 * Math.sin(a)]); }
  const ys = y0 + 1.06;
  b.surf(SURF.STEEL).col(COL.copper, 0.85, 1.12); b.lathe(0, ys, 0, prof.slice(0, 6).concat([[0.62, R * 0.94 * Math.sin(5.4 / 6 * Math.PI / 2)]]), 16, { smooth: true });
  b.col(mul(COL.copper, 0.55), 1, 1);
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a); for (let i = 0; i < 5; i++) b.beam([prof[i][0] * ca, ys + 0.05 + prof[i][1], prof[i][0] * sa], [prof[i + 1][0] * ca, ys + 0.05 + prof[i + 1][1], prof[i + 1][0] * sa], 0.26, 0.16); }
  const top = ys + R * 0.94;
  // the lantern: a marble round of slit lights, a copper cap and its knob
  b.surf(SURF.SLIT, 0.2, 0).col(st, 0.95, 1); b.lathe(0, top - 0.42, 0, [[0.62, 0], [0.62, 1.25]], 8, { cellW: 0.5, cellH: 1.25 });
  b.surf(SURF.STEEL).col(COL.copper, 0.9, 1.1); b.lathe(0, top + 0.83, 0, [[0.8, 0], [0.5, 0.5], [0.08, 0.9], [0.01, 1.2]], 8, { smooth: true });
  for (const sx of [-1, 1]) ring(I, F.p(sx * (R + 0.14), y0 + 0.5, 0), F.yaw + sx * Math.PI / 2);
  for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * TAU, sx = Math.sin(a), cz = Math.cos(a); rope(b, [(R + 0.3) * sx * 0.72, ys + R * 0.6, (R + 0.3) * cz * 0.72], [Math.sign(sx) * 1.66, DECK + 0.4, cz * (R + 1.5)], 0.09); }
  for (const z of [-5.6, 5.6]) {
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.97), 0.9, 1.03); b.box(-1.25, DECK + 0.2, z - 1.2, 1.25, DECK + 0.95, z + 1.2, { m: 1 });
    b.surf(SURF.PLAIN).col(mul(st, 1.06), 0.88, 1); b.box(-1.05, DECK + 0.95, z - 1.2, 1.05, DECK + 1.5, z + 1.2, {}); b.box(-1.4, DECK + 1.5, z - 1.2, 1.4, DECK + 1.72, z + 1.2, { bottom: true });
    b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const dz of [-0.8, 0.8]) b.cbox(0, DECK, z + dz, 3.0, 0.2, 0.3, {});
    ropesOver(b, z, 1.45, DECK + 1.78);
  }
  return top + 2.0;
}
// A LENGTH OF PORTICO, whole and standing: four fluted columns on their piece of the stylobate, each in a timber
// cradle, under their own length of entablature and cornice with a strip of the coffered ceiling behind it; the
// cut ends clean, with iron bolt plates; small lifting eyes on the cornice; guy ropes from its head to the deck
// (sd: the side toward the road: the columns stand on that side of the deck, the ceiling's strip on the other)
function porticoLoad(b, I, F, st, sd = -1) {
  const y0 = DECK + 0.3, ys = y0 + 0.6, colH = 6.2, r = 0.47, cap = ys + colH, hl = 5.7, zc = [-4.35, -1.45, 1.45, 4.35], cx = sd * 0.35;
  // a box between two places across the deck, given for the side sd = -1 and mirrored for the other
  const bx = (x0, ya, z0, x1, yb, z1, o) => b.box(Math.min(-sd * x0, -sd * x1), ya, z0, Math.max(-sd * x0, -sd * x1), yb, z1, o);
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const z of [-5, -2.5, 0, 2.5, 5]) b.cbox(0, DECK, z, 3.3, 0.3, 0.4, {});
  b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.94), 0.86, 1.02); b.box(-1.5, y0, -hl - 0.3, 1.5, ys, hl + 0.3, { m: 1 });
  for (const z of zc) { columnInto(b, cx, ys, z, r, colH, st); cradleInto(b, cx, ys + colH * 0.42, z, r * 0.97); }
  // the walers that tie the four cradles
  b.surf(SURF.PLANKS).col(mul(COL.timber, 0.92), 0.9, 1.1);
  for (const sx of [-1, 1]) b.beam([cx + sx * (r + 0.72), ys + colH * 0.42 + 0.66, -hl], [cx + sx * (r + 0.72), ys + colH * 0.42 + 0.66, hl], 0.24, 0.28);
  // the entablature over the columns, its cornice, and the strip of ceiling behind it with four sunk coffers
  b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 1.0), 0.92, 1.02); bx(-1.1, cap, -hl, 0.4, cap + 1.0, hl, { m: 1, bottom: true });
  b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.84, 1); bx(-1.5, cap + 1.0, -hl - 0.12, 0.6, cap + 1.42, hl + 0.12, { bottom: true });
  b.col(mul(st, 0.96), 0.9, 1); bx(0.4, cap + 0.5, -hl, 1.6, cap + 0.86, hl, { bottom: true });
  const qa = Math.min(-sd * 0.62, -sd * 1.42), qb = Math.max(-sd * 0.62, -sd * 1.42);
  b.col(mul(st, 0.7), 1, 1); for (const z of zc) b.quad([qa, cap + 0.49, z - 1.05], [qb, cap + 0.49, z - 1.05], [qb, cap + 0.49, z + 1.05], [qa, cap + 0.49, z + 1.05]);
  // the cut ends: iron plates bolted on, at both ends of the entablature and of the stylobate
  b.surf(SURF.STEEL).col(mul(COL.iron, 1.5), 1, 1.2);
  for (const sz of [-1, 1]) { bx(-0.95, cap + 0.12, sz > 0 ? hl : -hl - 0.07, 0.25, cap + 0.88, sz > 0 ? hl + 0.07 : -hl, {}); b.box(-1.2, y0 + 0.1, sz > 0 ? hl + 0.3 : -hl - 0.37, 1.2, ys - 0.1, sz > 0 ? hl + 0.37 : -hl - 0.3, {}); }
  for (const z of [-4.7, -3.5, 3.5, 4.7]) ring(I, F.p(sd * 1.52, cap + 1.2, z), F.yaw + sd * Math.PI / 2);
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) rope(b, [cx + sx * 0.7, cap + 0.2, sz * (hl - 0.3)], [sx * 1.66, DECK + 0.4, sz * 7.6], 0.1);
  return cap + 1.42;
}
// THE STANDING CARAVAN along the carters' road beyond the city (see planTrailers): each a trailer told at its
// distance (a deck on four wheels, the drawbar down on its prop) with ONE bare marble load and one storm lantern
// beside the load. None moves. Every load is SQUARED OR LAID FLAT, so that none is a peak,
// a dome or a roof on posts from the gallery: three great squared blocks in steps (kind 0); five column shafts
// lying along the deck, three under two (kind 1); three lengths of cornice laid flat in a stepped stack (kind 2).
export function* caravanInto(b, P, I) {
  const st = COL.marble; let n = 0;
  for (const q of P.caravan) {
    // (big: the nearest fourteen are the great drays, a third larger than the town's wagons)
    const F = frameAt(P, q.d, q.z, q.face), sc = q.big ? 1.35 : 1;
    b.tr(F.x, 0, F.z, F.yaw, sc);
    b.flood(0); b.surf(SURF.PLANKS).col(COL.timber, 0.8, 1); b.box(-1.7, 0.95, -8, 1.7, DECK, 8, { bottom: true });
    b.surf(SURF.STEEL).col(mul(COL.iron, 1.3), 1, 1.1);
    for (const z of [-5.2, 5.2]) for (const x of [-1.9, 1.9]) b.cbox(x, 0, z, 0.22, 1.5, 1.5, {});
    // (its drawbar laid down before it, pointing away from the town; a timber chock at every wheel)
    b.surf(SURF.PLANKS).col(mul(COL.timber, 0.8), 1, 1); b.beam([0, 0.7, 8], [0, 0.3, 10.9], 0.2, 0.2);
    b.surf(SURF.PLANKS).col(COL.timber, 0.8, 1); for (const z of [-5.2, 5.2]) for (const x of [-1.6, 1.6]) b.cbox(x, 0, z + 0.8, 0.4, 0.26, 0.4, {});
    // (the load's marble takes its one lantern's wash as every wagon's load in the town does: the same flood)
    b.flood(1.05, DECK + 1.8, 5.5);
    if (q.kind === 0) {
      b.surf(SURF.PLAIN).col(st, 0.88, 1.04);
      for (const [z0, z1, h] of [[-6.2, -1.6, 2.9], [-1.2, 2.8, 2.1], [3.2, 6.2, 1.3]]) b.box(-1.45, DECK + 0.2, z0, 1.45, DECK + 0.2 + h, z1, {});
    } else if (q.kind === 1) {
      const m = new THREE.Matrix4();
      b.surf(SURF.PLAIN).col(st, 0.86, 1.05);
      for (const [x, y] of [[-1.05, 0.75], [0, 0.75], [1.05, 0.75], [-0.52, 1.66], [0.52, 1.66]]) {
        b.push(m.makeRotationX(Math.PI / 2).setPosition(x, DECK + y, -5.6)); b.lathe(0, 0, 0, [[0.01, 0], [0.52, 0], [0.52, 11.2], [0.01, 11.2]], 8, { smooth: true }); b.pop();
      }
    } else {
      b.surf(SURF.PLAIN).col(st, 0.88, 1.04);
      b.box(-1.45, DECK + 0.2, -6.2, 1.45, DECK + 0.8, 6.2, {}); b.box(-1.2, DECK + 0.9, -5.6, 1.2, DECK + 1.45, 5.6, {});
      b.col(mul(st, 1.06), 0.9, 1.03); b.box(-0.9, DECK + 1.55, -4.8, 0.9, DECK + 2.05, 4.8, {});
    }
    b.flood(0);
    b.pop();
    // (its one lantern hangs on a short iron at the trailer's end toward the city, before the load)
    const la = F.p(0, (DECK + 2.3) * sc, 7.5 * sc), lb = F.p(0, (DECK + 2.3) * sc, -7.5 * sc), le = la[2] < lb[2] ? 7.5 : -7.5;
    b.tr(F.x, 0, F.z, F.yaw, sc); b.surf(SURF.STEEL).col(mul(COL.iron, 1.3), 1, 1.1); b.beam([0, DECK, le], [0, DECK + 2.4, le], 0.14, 0.14); b.pop();
    // (THE TOWN'S ONE LANTERN, of the town's one size and light, 0.95 m: no greater lamp stands on the caravan)
    I.lamps.push([...(le > 0 ? la : lb), LANTERN, 0, -1, 2]);
    if (++n % 8 === 0) yield;
  }
}
// A STAIR: one plain flight of marble steps as it stood, its low end at the deck's tail and its head on a timber
// crib, the cheek walls raking with it; its four screw jacks stand on the deck before the lowest step
function stairLoad(b, I, F, st) {
  const n = 11, run = 0.98, rise = 0.3, z0 = -6.6, y0 = DECK + 0.3;
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const z of [-5.6, -2.8, 0, 2.8, 5.6]) b.cbox(0, DECK, z, 3.3, 0.3, 0.4, {});
  for (let k = 0; k < n; k++) {
    // each step a block from the flight's raking underside to its tread, its nosing a paler line
    const z = z0 + k * run, yt = y0 + 0.35 + (k + 1) * rise, yb = k < 3 ? y0 : y0 + (k - 2) * rise;
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.96), 0.86, 1.02); b.box(-1.2, yb, z, 1.2, yt, z + run, { m: 1, bottom: true, capColor: mul(st, 1.08) });
  }
  const zt = z0 + n * run, yT = y0 + 0.35 + n * rise;
  b.surf(SURF.PLAIN).col(mul(st, 1.04), 0.88, 1.03);
  for (const sx of [-1, 1]) { b.beam([sx * 1.36, y0 + 0.75, z0], [sx * 1.36, yT + 0.4, zt], 0.3, 0.9); b.cbox(sx * 1.36, y0, z0 - 0.2, 0.44, 1.5, 0.6, {}); b.cbox(sx * 1.36, yT - 0.5, zt + 0.1, 0.44, 1.5, 0.6, {}); }
  // the crib under its head: pale balks crosswise; wedges under the flight's middle
  // (pale sawn timber, lighter than the deck)
  b.surf(SURF.LACQUER).col(mix3(COL.timber, COL.lime, 0.6), 0.9, 1.06);
  for (let l = 0; l < 7; l++) for (const sg of [-0.75, 0.75]) { if (l % 2) b.cbox(sg, y0 + l * 0.33, zt - 1.3, 0.3, 0.3, 2.3, {}); else b.cbox(0, y0 + l * 0.33, zt - 1.3 + sg, 2.6, 0.3, 0.3, {}); }
  for (const z of [z0 + 4.4, z0 + 6.6]) b.cbox(0, y0, z, 2.2, y0 + (z - z0 - 2.9) / run * rise - y0 + 0.02, 0.4, {});
  // the jacks: an iron screw on a square foot, a cap plate
  b.surf(SURF.STEEL).col(mul(COL.iron, 1.5), 1, 1.25);
  for (const x of [-1.05, -0.35, 0.35, 1.05]) { b.cbox(x, DECK, z0 - 0.95, 0.5, 0.1, 0.5, {}); b.cyl(x, DECK + 0.1, z0 - 0.95, 0.13, 0.1, 0.8, 7); b.cbox(x, DECK + 0.9, z0 - 0.95, 0.36, 0.08, 0.36, {}); }
  for (const z of [z0 + 1.5, z0 + 4.4, z0 + 7.4]) ropesOver(b, z, 1.55, y0 + 0.5 + ((z - z0) / run + 1) * rise + 1.0);
  ring(I, F.p(0, yT + 0.2, zt + 0.5), F.yaw, 1.0);
  return yT + 1.0;
}
// an open crate of slats at z on the deck (its top off: the lid leans against its end), hx by hz by h
function crateOpen(b, z, hx, hz, h, lidSide) {
  b.surf(SURF.PLANKS).col(mul(COL.timber, 1.12), 0.85, 1.05);
  b.box(-hx, DECK, z - hz, hx, DECK + 0.14, z + hz, {});
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(sx * hx, DECK, z + sz * hz, 0.16, h, 0.16, {});
  for (const y of [0.45, 0.5 * h + 0.2, h - 0.1]) {
    for (const sx of [-1, 1]) b.beam([sx * hx, DECK + y, z - hz], [sx * hx, DECK + y, z + hz], 0.06, 0.3);
    for (const sz of [-1, 1]) b.beam([-hx, DECK + y, z + sz * hz], [hx, DECK + y, z + sz * hz], 0.06, 0.3);
  }
  // the lid, taken off and leaned against the crate's end
  b.beam([0, DECK + 0.06, z + lidSide * (hz + 1.25)], [0, DECK + h * 0.92, z + lidSide * (hz + 0.12)], 2 * hx, 0.1);
}
// AN URN IN A CRATE WITH ITS TOP OFF: a great plain marble urn standing in an open crate of slats, its shoulders and
// lip over the crate's edge; beside it its pedestal, roped, and a second open crate with a plain capital
function urnLoad(b, I, F, st) {
  crateOpen(b, -4.7, 1.5, 1.5, 2.3, 1);
  b.surf(SURF.PLAIN).col(st, 0.88, 1.05);
  b.lathe(0, DECK + 0.14, -4.7, [[0.62, 0], [0.62, 0.22], [0.36, 0.5], [0.3, 0.86], [0.8, 1.5], [1.22, 2.3], [1.3, 2.9], [1.02, 3.3], [0.78, 3.45], [0.86, 3.62], [1.0, 3.7], [0.8, 3.7]], 14, { smooth: true });
  b.col([0.05, 0.05, 0.06], 1, 1); b.disc(0, DECK + 3.82, -4.7, 0.8, 14);
  // the pedestal: a moulded foot, the die, a cap; on bearers, roped
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const dz of [-0.8, 0.8]) b.cbox(0, DECK, dz + 0.4, 3.0, 0.22, 0.3, {});
  b.surf(SURF.PLAIN).col(mul(st, 1.05), 0.86, 1); b.cbox(0, DECK + 0.22, 0.4, 2.4, 0.36, 2.4, {});
  b.surf(SURF.MASONRY, 0, 0.5).col(mul(st, 0.96), 0.88, 1.03); b.cbox(0, DECK + 0.58, 0.4, 1.9, 1.5, 1.9, { m: 1 });
  b.surf(SURF.PLAIN).col(mul(st, 1.07), 0.86, 1); b.cbox(0, DECK + 2.08, 0.4, 2.3, 0.3, 2.3, { bottom: true });
  ropesOver(b, 0.4, 1.2, DECK + 2.42);
  // the second crate: a plain capital on its abacus
  crateOpen(b, 5.0, 1.45, 1.45, 1.5, -1);
  b.surf(SURF.PLAIN).col(mul(st, 1.03), 0.9, 1.04);
  b.cbox(0, DECK + 0.14, 5.0, 2.3, 0.34, 2.3, {}); b.lathe(0, DECK + 0.48, 5.0, [[1.12, 0], [0.9, 0.42], [0.82, 0.62], [0.88, 0.74], [0.82, 0.86]], 14, { smooth: true }); b.disc(0, DECK + 1.34, 5.0, 0.82, 14);
  return DECK + 3.9;
}
// one length of the fronts' deep cornice lying at x from z0 to z1 on y0, its bed down and its dentils upward
function corniceLen(b, st, x, y0, z0, z1) {
  b.surf(SURF.MASONRY, 0, 0.7).col(mul(st, 0.95), 0.92, 1.03); b.box(x - 0.62, y0, z0, x + 0.62, y0 + 0.55, z1, { m: 1 });
  b.surf(SURF.PLAIN).col(mul(st, 1.05), 0.95, 1.03); b.box(x - 0.5, y0 + 0.55, z0, x + 0.5, y0 + 0.85, z1, {}); b.box(x - 0.36, y0 + 0.85, z0, x + 0.36, y0 + 1.2, z1, {});
  b.col(mul(st, 0.9), 1, 1); for (let zz = z0 + 0.3; zz < z1 - 0.2; zz += 0.6) b.box(x - 0.58, y0 + 0.55, zz, x + 0.58, y0 + 0.72, zz + 0.3, {});
}
// one length of the fronts' balustrade LYING FLAT on its side at x from z0 to z1 on y0 (the yard's stack): its
// foot along one edge, its rail along the other, and between them its balusters lying side by side, a hand's
// breadth of shadow between every two (bars: the upper layer, whose balusters are seen; the lower is plain)
function balFlat(b, st, x, y0, z0, z1, bars) {
  b.surf(SURF.PLAIN).col(mul(st, 0.95), 0.9, 1); b.box(x - 0.6, y0, z0, x - 0.38, y0 + 0.44, z1, {});
  b.col(mul(st, 1.08), 0.9, 1); b.box(x + 0.34, y0, z0, x + 0.6, y0 + 0.48, z1, {});
  if (!bars) { b.col(mul(st, 0.7), 0.9, 1); b.box(x - 0.38, y0 + 0.08, z0 + 0.1, x + 0.34, y0 + 0.36, z1 - 0.1, {}); return; }
  b.col([0.1, 0.09, 0.08], 1, 1); b.quad([x - 0.38, y0 + 0.1, z1], [x + 0.34, y0 + 0.1, z1], [x + 0.34, y0 + 0.1, z0], [x - 0.38, y0 + 0.1, z0]);
  b.col(st, 0.9, 1.03); for (let zz = z0 + 0.12; zz < z1 - 0.2; zz += 0.3) b.box(x - 0.38, y0 + 0.14, zz, x + 0.34, y0 + 0.32, zz + 0.17, { top: true });
}
// one length of the fronts' balustrade stood on edge at x from z0 to z1 on y0: a foot, the balusters, the rail
function balLen(b, st, x, y0, z0, z1) {
  b.surf(SURF.PLAIN).col(mul(st, 0.95), 0.9, 1); b.box(x - 0.24, y0, z0, x + 0.24, y0 + 0.22, z1, {});
  b.surf(SURF.SLIT, 0.2, 0).col(st, 1, 1); b.box(x - 0.16, y0 + 0.22, z0 + 0.1, x + 0.16, y0 + 1.0, z1 - 0.1, { cellW: 0.5, cellH: 0.78, top: false });
  b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.9, 1); b.box(x - 0.26, y0 + 1.0, z0, x + 0.26, y0 + 1.2, z1, { bottom: true });
}
// lengths of THE DEEP CORNICE THAT THE FRONTS WEAR lying along the deck on bearers, their dentils upward, wedged
// and roped down (xs: where each file of two lengths lies across the deck; bare: no bearers and ropes of its own)
function corniceLoad(b, I, F, st, xs = [-0.8, 0.8], bare = false) {
  b.surf(SURF.PLANKS).col(mul(COL.timber, 1.05), 0.85, 1.05);
  if (!bare) for (const z of [-6.2, -2.1, 2.1, 6.2]) b.box(-1.55, DECK, z - 0.16, 1.55, DECK + 0.26, z + 0.16, {});
  const y0 = DECK + 0.26;
  for (const x of xs) for (const [z0, z1] of [[-7.0, -0.25], [0.25, 7.0]]) {
    corniceLen(b, st, x, y0, z0, z1);
    b.surf(SURF.PLANKS).col(COL.timber, 0.8, 1); for (const zz of [z0 + 1, z1 - 1]) for (const sx of [-1, 1]) b.box(x + sx * 0.62, y0, zz - 0.2, x + sx * 0.82, y0 + 0.22, zz + 0.2, {});
  }
  if (!bare) for (const z of [-5, -1.6, 1.6, 5]) ropesOver(b, z, 1.5, y0 + 1.25);
  for (const sz of [-1, 1]) ring(I, F.p(xs[0], y0 + 0.3, sz * 7.02), F.yaw + (sz > 0 ? 0 : Math.PI));
  return y0 + 1.3;
}
// lengths of THE FRONTS' BALUSTRADE stood on edge on bearers, roped down (xs, bare: as the cornice's)
function balustradeLoad(b, I, F, st, xs = [-0.95, 0, 0.95], bare = false) {
  b.surf(SURF.PLANKS).col(mul(COL.timber, 1.05), 0.85, 1.05);
  if (!bare) for (const z of [-6.5, -2.2, 2.2, 6.5]) b.box(-1.5, DECK, z - 0.14, 1.5, DECK + 0.24, z + 0.14, {});
  const y0 = DECK + 0.24;
  for (const x of xs) for (const [z0, z1] of [[-7.2, -0.3], [0.3, 7.2]]) balLen(b, st, x, y0, z0, z1);
  if (!bare) for (const z of [-5, -1.6, 1.6, 5]) ropesOver(b, z, 1.5, y0 + 1.25);
  for (const sz of [-1, 1]) ring(I, F.p(xs[xs.length - 1], y0 + 0.11, sz * 7.22), F.yaw + (sz > 0 ? 0 : Math.PI));
  return y0 + 1.3;
}
// A LENGTH OF THE VERY CORNICE AND A LENGTH OF THE VERY BALUSTRADE that the street's fronts wear, on one wagon
//: the cornice's file on the side toward the lane, two files of balustrade beside it
function corbalLoad(b, I, F, st, sd) {
  corniceLoad(b, I, F, st, [sd * 0.85]);
  return balustradeLoad(b, I, F, st, [-sd * 0.3, -sd * 1.1], true);
}
// GLAZED WINDOWS IN THEIR STONE FRAMES: three tall windows of a front, each a whole piece of its wall
// (the stone round it, its sill, its hood, the glazed sash within: the kit's own window, the same glass and bars
// as the fronts', unlit), standing upright along the deck on bearers, their faces toward the lane, propped
// behind by raking timbers, wedged and roped; a lifting eye at each top corner
function windowLoad(b, I, F, st, sd) {
  const y0 = DECK + 0.3, w = 3.3, h = 4.6, t = 0.5, xf = sd * 0.35, xb = xf - sd * t;
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const z of [-6, -3, 0, 3, 6]) b.cbox(0, DECK, z, 3.3, 0.3, 0.4, {});
  for (const zc of [-5.0, 0, 5.0]) {
    b.surf(SURF.WINDOW, 0.35 + zc * 0.05, 0).col(st, 0.92, 1.02);
    if (sd > 0) b.wall(xf, zc + w / 2, xf, zc - w / 2, y0, y0 + h, { cellW: w, cellH: h }); else b.wall(xf, zc - w / 2, xf, zc + w / 2, y0, y0 + h, { cellW: w, cellH: h });
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.9), 0.9, 1); b.box(Math.min(xb, xf - sd * 0.02), y0, zc - w / 2, Math.max(xb, xf - sd * 0.02), y0 + h, zc + w / 2, { m: 1, capColor: mul(st, 1.05) });
    b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.85, 1);
    b.box(Math.min(xf, xf + sd * 0.3), y0 + h * 0.82, zc - w * 0.37, Math.max(xf, xf + sd * 0.3), y0 + h * 0.82 + 0.24, zc + w * 0.37, { bottom: true });
    b.box(Math.min(xf, xf + sd * 0.22), y0 + h * 0.2 - 0.16, zc - w * 0.34, Math.max(xf, xf + sd * 0.22), y0 + h * 0.2, zc + w * 0.34, { bottom: true });
    b.surf(SURF.PLANKS).col(COL.timber, 0.82, 1.05);
    for (const dz of [-1.1, 1.1]) { b.beam([xb, y0 + h * 0.68, zc + dz], [-sd * 1.5, DECK + 0.12, zc + dz], 0.16, 0.18); b.frustum(xf + sd * 0.3, zc + dz, 0.5, 0.4, 0.14, 0.4, y0, y0 + 0.34, {}); }
    ropesOver(b, zc, 0.5, y0 + h + 0.04);
    for (const sz of [-1, 1]) ring(I, F.p(xf + sd * 0.02, y0 + h - 0.3, zc + sz * (w / 2 - 0.3)), F.yaw + sd * Math.PI / 2);
  }
  return y0 + h;
}
// the standing train: each trailer with its load. Nothing here is given a law of movement.
export function* trailersInto(b, P, I) {
  const LZ = { portico: 0, dome: 3.7, drums: 3.6, pediment: 0, stair: -7.75, urn: -1.4, balustrade: 0, cornice: 0, corbal: 0, window: 2.5 };
  for (const q of P.trailers) {
    // (EVERY LOAD IS BARE MARBLE: white on the seam, white to pale honey on the road; no sheet lies on any.
    // sd: the side of the trailer's own frame that looks toward the road's middle)
    const F = frameAt(P, q.d, q.z, q.face), st = q.seam ? COL.marble : mix3(COL.marble, COL.lime, 0.06 + 0.2 * ((q.k * 0.37) % 1)), sd = -P.hand * Math.sign(q.d - P.DS);
    b.tr(F.x, 0, F.z, F.yaw);
    trailerInto(b, I, F);
    // (the load takes its lantern's light: strongest at the lantern's height and under it, fading up the stone)
    b.flood(1.05, DECK + 1.8, 5.5);
    const top = q.load === 'pediment' ? pedimentLoad(b, I, F, st) : q.load === 'drums' ? drumsLoad(b, I, F, st) : q.load === 'dome' ? domeLoad(b, I, F, st) : q.load === 'balustrade' ? balustradeLoad(b, I, F, st)
      : q.load === 'cornice' ? corniceLoad(b, I, F, st) : q.load === 'portico' ? porticoLoad(b, I, F, st, sd) : q.load === 'stair' ? stairLoad(b, I, F, st)
        : q.load === 'corbal' ? corbalLoad(b, I, F, st, sd) : q.load === 'window' ? windowLoad(b, I, F, st, sd) : urnLoad(b, I, F, st);
    lanternPost(b, I, F, sd, LZ[q.load] ?? 0);
    b.pop();
    I.shadows.push({ kind: 'box', d: q.d, z: q.z, face: q.face, hw: 1.7, hd: 8, h: top * 0.8 });
    I.solids.push({ kind: 'box', F, hw: 2.15, hd: 11, h: top + 1.5, id: 'trailer' + q.k });
    yield;
  }
}

// ---------------------------------------------------------------- the fair's makers
// a straight member from a to q (a timber of the white trestle, or an iron of the lattice): w across, h deep
const mem = (I, a, q, w = 0.26, h = w) => I.members.push([a[0], a[1], a[2], q[0], q[1], q[2], w, h]);
const iron = (I, a, q, w = 0.2, h = w) => I.irons.push([a[0], a[1], a[2], q[0], q[1], q[2], w, h]);

// The switchback's bents: where each stands along the loop (metres). Two bents stand 5.5 m either side of the
// route's line where it passes under each run (an 11 m portal bay); the rest follow every 6 m or so.
export function planBents(P) {
  const T = P.track, out = [], zc = P.ZC, runs = [[0, T.zN, -1], [T.Ls + T.La, T.zS, 1]];
  for (const [s0, z0, sg] of runs) {
    // z along this run goes z0 + sg * (s - s0); the bents at zc +- 5.5, then every 6 m both ways to the run's ends
    const zs = [];
    for (let z = zc + 5.5; z <= T.zN - 2.5; z += 6) zs.push(z);
    for (let z = zc - 5.5; z >= T.zS + 2.5; z -= 6) zs.push(z);
    zs.push(T.zN, T.zS);
    for (const z of zs) out.push({ s: s0 + (z - z0) * sg, portal: z === zc + 5.5 ? (sg < 0 ? 1 : -1) : z === zc - 5.5 ? (sg < 0 ? -1 : 1) : 0 });
  }
  for (const s0 of [T.Ls, 2 * T.Ls + T.La]) for (let k = 1; k < 8; k++) out.push({ s: s0 + T.La * k / 8, portal: 0 });
  out.sort((a, q) => a.s - q.s);
  // portal: +1 marks the bent whose NEXT bay (toward greater s) is the portal bay
  for (let i = 0; i < out.length; i++) out[i].open = out[i].portal === 1 && out[(i + 1) % out.length].portal === -1;
  T.bents = out; T.clearY = 12.6;
  return P;
}
// one bent's own points at s: tops and feet of its two posts, its girt levels
function bentAt(P, s, o) {
  const k = trackAt(P, s, bentAt.o), sl = Math.hypot(k.sx, k.sz) || 1, sx = k.sx / sl, sz = k.sz / sl, y = k.y - 0.5;
  const sp = 1.15 + 0.1 * y;
  const kx = k.x, kz = k.z;
  o.y = y; o.x = kx; o.z = kz; o.sx = sx; o.sz = sz; o.sp = sp;
  o.levels = []; for (let h = y - 4.4; h > 2.2; h -= 4.4) o.levels.push(h);
  // a post's point at height h on side sg: it rakes from 1.15 m at the top out to sp at the ground
  o.at = (sg, h) => { const w = lerp(sp, 1.15, clamp(h / y, 0, 1)) * sg; return [kx + sx * w, h, kz + sz * w]; };
  return o;
}
bentAt.o = {};
export function* trestleInto(b, P, I) {
  const T = P.track, B = T.bents, n = B.length, cur = {}, nxt = {};
  for (let i = 0; i < n; i++) {
    const A = bentAt(P, B[i].s, cur), ys = [A.y, ...A.levels];
    // the bent: two raking posts, a cap, girts and a cross of braces in every panel; brick footings sunk in the turf
    for (const sg of [-1, 1]) {
      mem(I, A.at(sg, 0.45), A.at(sg, A.y), 0.36, 0.36);
      const f = A.at(sg, 0);
      b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.cbox(f[0], -0.2, f[2], 1.3, 0.75, 1.3, { m: 1, capColor: COL.moss });
    }
    mem(I, A.at(-1.25, A.y), A.at(1.25, A.y), 0.34, 0.34);
    for (let l = 0; l < ys.length; l++) {
      const y1 = ys[l], y0 = l + 1 < ys.length ? ys[l + 1] : 0.6;
      if (l > 0) mem(I, A.at(-1, y1), A.at(1, y1), 0.24, 0.24);
      if (y1 - y0 > 1.6) { mem(I, A.at(-1, y0), A.at(1, y1), 0.2, 0.2); mem(I, A.at(1, y0), A.at(-1, y1), 0.2, 0.2); }
    }
    // the bay to the next bent: ledgers at every level both have, and a brace in every panel, both sides. In the
    // portal bay nothing lies under clearY; a truss under the rails carries the bay.
    const N = bentAt(P, B[(i + 1) % n].s, nxt), open = B[i].open, m = Math.min(A.levels.length, N.levels.length);
    for (const sg of [-1, 1]) {
      let pa = A.at(sg, A.y), pn = N.at(sg, N.y);
      for (let l = 0; l <= m; l++) {
        const la = l < m ? A.at(sg, A.levels[l]) : A.at(sg, 0.6), ln = l < m ? N.at(sg, N.levels[l]) : N.at(sg, 0.6);
        if (open && Math.min(la[1], ln[1]) < T.clearY) break;
        if (l < m) mem(I, la, ln, 0.22, 0.22);
        if (l % 2 === 0) mem(I, la, pn, 0.2, 0.2); else mem(I, pa, ln, 0.2, 0.2);
        pa = la; pn = ln;
      }
      if (open) {
        // the truss: a lower chord 3 m under the rails and three panels of braces
        const h = 3.0, q = (t, dy) => { const a = A.at(sg, A.y - dy), c = N.at(sg, N.y - dy); return [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)]; };
        mem(I, q(0, h), q(1, h), 0.3, 0.3);
        for (let k = 0; k < 4; k++) { mem(I, q(k / 4, k % 2 ? 0 : h), q((k + 1) / 4, k % 2 ? h : 0), 0.22, 0.22); if (k) mem(I, q(k / 4, 0), q(k / 4, h), 0.2, 0.2); }
      }
    }
    lamp(I, A.at(-1.35, A.y + 1.0), 0.8, 0, (B[i].s / T.LT) % 1, 0); lamp(I, A.at(1.35, A.y + 1.0), 0.8, 0, (B[i].s / T.LT) % 1, 0);
    if (i % 12 === 11) yield;
  }
}
// the rails: two white stringers under two iron rails, ties across, following the track's own line and bank;
// and the station at the north end of the east run: a deck beside the rails under a striped roof
export function* railsInto(b, P, I) {
  const T = P.track, o = {}, step = 2, n = Math.round(T.LT / step);
  const pt = (k, side, up) => [k.x + k.sx * side + k.ux * up, k.y + k.sy * side + k.uy * up, k.z + k.sz * side + k.uz * up];
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const k = trackAt(P, i * T.LT / n, o), cur = [pt(k, -0.72, -0.28), pt(k, 0.72, -0.28), pt(k, -0.6, 0.02), pt(k, 0.6, 0.02)];
    // lamps along both edges of the track, every 2 m: the ridge and every rise are drawn in points
    if (i < n) { lamp(I, pt(k, -1.25, 0.05), 0.8, 0, i / n, 0); lamp(I, pt(k, 1.25, 0.05), 0.8, 0, i / n, 0); }
    if (prev) {
      b.surf(SURF.PLANKS).col(COL.white, 0.9, 1.05); b.beam(prev[0], cur[0], 0.3, 0.44); b.beam(prev[1], cur[1], 0.3, 0.44);
      b.surf(SURF.STEEL).col(COL.iron, 1, 1.3); b.beam(prev[2], cur[2], 0.12, 0.14); b.beam(prev[3], cur[3], 0.12, 0.14);
      mem(I, pt(k, -1.05, -0.06), pt(k, 1.05, -0.06), 0.24, 0.12);
      const h = trackAt(P, (i - 0.5) * T.LT / n, railsInto.o); mem(I, pt(h, -1.05, -0.06), pt(h, 1.05, -0.06), 0.24, 0.12);
    }
    prev = cur;
    if (i % 60 === 59) yield;
  }
  // the station: on the seam's side of the east run's north end
  const y = 5.5 - 0.5, d0 = T.dE + 1.3, d1 = T.dE + 5.2, z0 = T.zN - 15, z1 = T.zN + 1;
  const F = frameAt(P, (d0 + d1) / 2, (z0 + z1) / 2, 0), hw = (z1 - z0) / 2, hd = (d1 - d0) / 2;
  b.tr(F.x, 0, F.z, F.yaw);
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); b.box(-hw, y - 0.25, -hd, hw, y, hd, { bottom: true, m: 0.5 });
  for (let i = 0; i <= 4; i++) for (const z of [-hd + 0.2, hd - 0.2]) {
    const x = lerp(-hw + 0.3, hw - 0.3, i / 4);
    b.surf(SURF.PLANKS).col(COL.white, 0.9, 1.05); b.cbox(x, 0.4, z, 0.3, y + 3.6, 0.3, {});
    b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.cbox(x, -0.2, z, 1.0, 0.7, 1.0, { m: 1, capColor: COL.moss });
  }
  b.surf(SURF.STRIPES, 0, 0).col(COL.red, 0.9, 1.05); b.gable(-hw - 0.6, -hd - 0.7, hw + 0.6, hd + 0.7, y + 3.4, 1.3, { overhang: 0 });
  b.surf(SURF.PLANKS).col(COL.white, 0.9, 1.05); b.box(-hw, y + 0.95, hd - 0.12, hw, y + 1.07, hd, {}); b.box(-hw, y + 0.5, hd - 0.1, hw, y + 0.58, hd, {});
  // the stair down to the walk
  for (let k = 0; k < 12; k++) b.box(-hw - 0.5 - k * 0.42, y - 0.4 - k * 0.4, -hd + 0.2, -hw - 0.05 - k * 0.42, y - k * 0.4, hd - 0.2, {});
  b.pop();
  for (let i = 0; i <= 6; i++) lamp(I, F.p(lerp(-hw, hw, i / 6), y + 3.3, hd + 0.7), 0.9, 0, -1, 0);
  I.shadows.push({ kind: 'box', d: (d0 + d1) / 2, z: (z0 + z1) / 2, face: 0, hw, hd, h: y + 4 });
}
railsInto.o = {};

// THE WHEEL. Its turning part is laid in the wheel's own frame (x along its plane, y up, z along the axle, the hub
// at the origin) and turned as one about z by wheelAngle; its tower and gallery stand in the world.
// A riveted lattice wheel of its own form: each side a rim of two rings laced together, an inner ring, flat spokes
// in pairs laced like ladders, rods to the half nodes; a pin across the two sides at every cage.
export function wheelPartsInto(P, I) {
  const W = P.wheel, R = W.R, n = W.n, zr = 1.62, out = I.wheelIrons = [], N2 = n * 2;
  const m = (a, q, w, h = w) => out.push([a[0], a[1], a[2], q[0], q[1], q[2], w, h]);
  const at = (r, k, z) => { const a = k * TAU / N2; return [r * Math.cos(a), r * Math.sin(a), z]; };
  const Ri = R - 2.6, Rm = R * 0.56, rh = 2.6;
  for (const z of [-zr, zr]) {
    for (let k = 0; k < N2; k++) {
      m(at(R, k, z), at(R, k + 1, z), 0.42, 0.34); m(at(Ri, k, z), at(Ri, k + 1, z), 0.34, 0.3);
      m(at(Ri, k, z), at(R, k + 1, z), 0.2, 0.16); m(at(R, k, z), at(Ri, k, z), 0.22, 0.16);
      if (k % 2 === 0) {
        // a ladder spoke: two flats 0.9 m apart at the rim, closing on the hub, with rungs
        const a = k * TAU / N2, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
        const sp = (r, off) => [r * ca + px * off, r * sa + py * off, z];
        for (const sg of [-1, 1]) m(sp(rh, sg * 0.35), sp(Ri, sg * 0.75), 0.26, 0.2);
        for (let j = 1; j <= 7; j++) { const r = lerp(rh, Ri, j / 8), o = lerp(0.35, 0.75, j / 8); m(sp(r, -o), sp(lerp(rh, Ri, (j + 1) / 8), lerp(0.35, 0.75, (j + 1) / 8)), 0.14, 0.12); }
        m(at(Rm, k, z), at(Rm, k + 2, z), 0.24, 0.2);
      } else { m(at(rh, k - 1, z), at(Ri, k, z), 0.11, 0.11); m(at(rh, k + 1, z), at(Ri, k, z), 0.11, 0.11); }
    }
  }
  for (let k = 0; k < N2; k++) {
    // across the two sides: the cage's pin at every whole node, a tie at every half node of the outer ring
    m(at(R, k, -zr), at(R, k, zr), 0.26, 0.26);
    if (k % 2) m(at(Rm, k + 1, -zr), at(Rm, k + 1, zr), 0.18, 0.18);
  }
  // the lamps: along both faces of the rim and out along every spoke, each with its place in the chase
  const lit = I.wheelLamps = [];
  for (const z of [-zr - 0.3, zr + 0.3]) {
    // (EVERY LAMP OF THE WHEEL STANDS APART FROM ITS NEIGHBOURS, so that single lamps are
    // told on the rim wherever a pixel can part them: four to a half bay of the rim, 1.0 m across and 1.2 to
    // 1.5 m apart (they were six of 1.35 m, 0.8 to 1.0 m apart, and ran together into one white band from the
    // gallery); the inner ring's 0.85 m and 1.7 m apart; eight of 0.9 m to a spoke; twelve of 0.85 m round the hub)
    for (let k = 0; k < N2 * 4; k++) { const a = k * TAU / (N2 * 4); lit.push([(R + 0.2) * Math.cos(a), (R + 0.2) * Math.sin(a), z, 1.0, 1, k / (N2 * 4), 0]); }
    for (let k = 0; k < N2 * 2; k++) { const a = (k + 0.5) * TAU / (N2 * 2); lit.push([Rm * Math.cos(a), Rm * Math.sin(a), z, 0.85, 1, 1 + k / (N2 * 2), 1]); }
    for (let k = 0; k < n; k++) for (let j = 1; j <= 8; j++) { const a = k * TAU / n, r = lerp(rh, Ri, j / 9); lit.push([r * Math.cos(a), r * Math.sin(a), z, 0.9, 1, 2 + j / 9, 1]); }
    for (let k = 0; k < 12; k++) { const a = k * TAU / 12; lit.push([3.0 * Math.cos(a), 3.0 * Math.sin(a), z + Math.sign(z) * 0.5, 0.85, 1, k / 12, 0]); }
  }
  return out.length;
}
// the wheel's tower and its high gallery, standing in the world: wp(x, y, o) is a point x metres along the wheel's
// plane from the hub's foot, y over the ground and o metres along the axle toward the gallery
export function* wheelTowerInto(b, P, I) {
  const W = P.wheel, hy = W.hubY, wp = (x, y, o) => [W.c[0] + W.ex * x + W.nx * o, y, W.c[2] + W.ez * x + W.nz * o];
  const lerp3 = (a, q, t) => [lerp(a[0], q[0], t), lerp(a[1], q[1], t), lerp(a[2], q[2], t)];
  // a laced leg between two chords a0-a1 and c0-c1
  const leg = (a0, a1, c0, c1, n, w) => {
    iron(I, a0, a1, w); iron(I, c0, c1, w);
    for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n; iron(I, lerp3(a0, a1, t0), lerp3(c0, c1, t1), w * 0.5); iron(I, lerp3(c0, c1, t0), lerp3(a0, a1, t0), w * 0.45); }
  };
  const foot = (p) => { b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.cbox(p[0], -0.2, p[2], 2.6, 1.0, 2.6, { m: 1, capColor: COL.moss }); };
  for (const sg of [-1, 1]) {
    const ot = sg * 3.7, of = sg * 8.6, fx = hy * 0.36;
    for (const sx of [-1, 1]) {
      leg(wp(sx * 0.2, hy + 0.6, ot), wp(sx * (fx + 1.1), 0.7, of), wp(-sx * 0.9, hy - 0.6, ot), wp(sx * (fx - 1.1), 0.7, of), 13, 0.42);
      foot(wp(sx * fx, 0, of));
      for (let j = 1; j <= 17; j++) lamp(I, lerp3(wp(sx * 0.2, hy + 0.6, ot + sg * 0.3), wp(sx * (fx + 1.1), 0.7, of + sg * 0.3), j / 18), 0.9, 0, -1, 0);
    }
    // two laced girts across each frame
    for (const t of [0.36, 0.68]) { const y = lerp(hy, 0.7, t), x = fx * t, o = lerp(ot, of, t); leg(wp(-x, y + 0.8, o), wp(x, y + 0.8, o), wp(-x - 0.8, y - 0.8, o), wp(x + 0.8, y - 0.8, o), Math.round(4 + t * 8), 0.26); }
    // the bearing's cheek (pale green paint, in the hub's lamps' light)
    b.flood(0.7, 999, 1); b.surf(SURF.STEEL).col(mix3(COL.green, COL.cream, 0.6), 0.9, 1.1); const c = wp(0, hy, ot);
    b.tr(c[0], 0, c[2], Math.atan2(W.ex, W.ez)); b.box(-0.5, hy - 1.5, -1.5, 0.5, hy + 1.5, 1.5, { bottom: true }); b.pop(); b.flood(0);
  }
  // the axle and the hub's flanges: a lathe laid along the axle
  const M = new THREE.Matrix4(), e3 = new THREE.Vector3(W.ex, 0, W.ez), n3 = new THREE.Vector3(W.nx, 0, W.nz), z3 = new THREE.Vector3().crossVectors(e3, n3);
  M.makeBasis(e3, n3, z3).setPosition(W.c[0] - W.nx * 4.4, hy, W.c[2] - W.nz * 4.4);
  b.push(M);
  b.flood(0.7, 999, 1); b.surf(SURF.STEEL).col(mul(COL.iron, 1.5), 1, 1.2); b.lathe(0, 0, 0, [[0.9, 0], [0.9, 8.8]], 12);
  // (the hub's flanges are painted pale straw, its barrel cream: no red, nothing dark)
  b.col(hex('#e9d9a6'), 0.9, 1.1); b.lathe(0, 2.3, 0, [[1.0, 0], [2.9, 0.3], [2.9, 0.7], [1.6, 1.0], [1.6, 3.2], [2.9, 3.5], [2.9, 3.9], [1.0, 4.2]], 16);
  b.col(COL.cream, 1, 1); b.lathe(0, 0, 0, [[0.01, 0], [1.3, 0]], 12); b.lathe(0, 8.8, 0, [[1.3, 0], [0.01, 0]], 12);
  b.flood(0);
  b.pop();
  yield;
  yield* galleryInto(b, P, I, wp);
}
// The high boarding gallery: a plank deck 3.0 m under the lens's line, 7.6 m wide (its rails and lamp standards
// 3.7 m either side of the line), from 2 m before the line joins it to 2 m past the ring; on raking iron bents.
function* galleryInto(b, P, I, wp) {
  const W = P.wheel, yd = W.galY - 3.0, q0 = W.sJ - 2, q1 = W.sEnd + 2, oi = W.off - 3.95, oo = W.off + 3.95, len = q1 - q0;
  W.deck = { y: yd, q0, q1, oi, oo };
  const F = { x: wp((q0 + q1) / 2, 0, W.off)[0], z: wp((q0 + q1) / 2, 0, W.off)[2], yaw: Math.atan2(W.ex, W.ez) };
  // in this frame +Z runs along the wheel's plane (q), X across the deck
  const sx = Math.sign(Math.cos(F.yaw) * W.nx - Math.sin(F.yaw) * W.nz) || 1, hl = len / 2;
  b.tr(F.x, 0, F.z, F.yaw);
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); b.box(-3.95, yd - 0.3, -hl, 3.95, yd, hl, { bottom: true, m: 0.6 });
  b.surf(SURF.STEEL).col(COL.green, 0.9, 1.15);
  for (const x of [-3.85, 3.85]) {
    b.box(x - 0.16, yd - 0.95, -hl, x + 0.16, yd - 0.3, hl, { bottom: true });
    b.box(x - 0.07, yd + 1.05, -hl, x + 0.07, yd + 1.17, hl, { bottom: true }); b.box(x - 0.05, yd + 0.55, -hl, x + 0.05, yd + 0.63, hl, { bottom: true });
    for (let z = -hl; z <= hl + 0.01; z += len / Math.round(len / 2.2)) b.box(x - 0.07, yd, z - 0.07, x + 0.07, yd + 1.05, z + 0.07, {});
  }
  // the boarding stage toward the wheel, at the hub
  const zh = -(q0 + q1) / 2;
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); b.box(-sx > 0 ? 3.95 : -6.2, yd - 0.3, zh - 5, -sx > 0 ? 6.2 : -3.95, yd, zh + 5, { bottom: true, m: 0.6 });
  b.pop();
  // lamp standards on both rails
  const ns = Math.round(len / 6.6);
  for (let i = 0; i <= ns; i++) for (const o of [oi + 0.1, oo - 0.1]) {
    const q = lerp(q0, q1, i / ns), a = wp(q, yd, o), t = wp(q, yd + 2.6, o);
    iron(I, a, t, 0.14); lamp(I, [t[0], t[1] + 0.2, t[2]], 1.55, 0, -1, 0);
    // (a warm pool on the deck's boards under each standard, by place: I.pools, makePoolMesh)
    const c = wp(q, yd, o < W.off ? o + 0.9 : o - 0.9); I.pools.push([c[0], yd + 0.03, c[2], 2.5, 0.2]);
  }
  yield;
  // the bents under the deck and the trusses between them
  const nb = 4, lerp3 = (a, c, t) => [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)];
  for (let i = 0; i <= nb; i++) {
    const q = lerp(q0 + 1.5, q1 - 1.5, i / nb), yt = yd - 0.95, ti = wp(q, yt, oi + 0.3), to = wp(q, yt, oo - 0.3), fi = wp(q, 0.6, oi - 0.6), fo = wp(q, 0.6, oo + 5.5);
    iron(I, ti, fi, 0.44); iron(I, to, fo, 0.44); iron(I, ti, to, 0.3);
    const nl = Math.round(yt / 6.4);
    for (let l = 0; l < nl; l++) {
      const t0 = l / nl, t1 = (l + 1) / nl;
      if (l) iron(I, lerp3(ti, fi, t0), lerp3(to, fo, t0), 0.24);
      iron(I, lerp3(ti, fi, t0), lerp3(to, fo, t1), 0.2); iron(I, lerp3(to, fo, t0), lerp3(ti, fi, t1), 0.2);
    }
    for (const f of [fi, fo]) { b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.cbox(f[0], -0.2, f[2], 2.2, 0.9, 2.2, { m: 1, capColor: COL.moss }); }
    if (i < nb) {
      const qn = lerp(q0 + 1.5, q1 - 1.5, (i + 1) / nb);
      for (const o of [oi + 0.3, oo - 0.3]) {
        iron(I, wp(q, yt - 2.8, o), wp(qn, yt - 2.8, o), 0.3);
        for (let k = 0; k < 6; k++) iron(I, wp(lerp(q, qn, k / 6), k % 2 ? yt - 2.8 : yt, o), wp(lerp(q, qn, (k + 1) / 6), k % 2 ? yt : yt - 2.8, o), 0.2);
      }
    }
  }
}

// ---------------------------------------------------------------- the unit shapes of the instanced things
// Each is built once at the origin; the world draws it many times. Pale parts take an instance's own paint.
export function unitShapes() {
  const U = {}, mk = () => makeBuilder(256), W1 = [1, 1, 1];
  // a timber: a unit box along Z (the members' and sleepers' shape), planked; an iron: the same, riveted
  let b = U.timber = mk(); b.surf(SURF.PLANKS).col(W1, 0.92, 1.04); b.box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, { bottom: true, m: 1 });
  // (the fair's irons and its white timbers stand in the fair's own lamplight: a baked wash, the hour's law)
  b = U.iron = mk(); b.flood(0.6, -1, 60); b.surf(SURF.STEEL).col(W1, 0.9, 1.1); b.box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, { bottom: true });
  b = U.timberLit = mk(); b.flood(0.8, -1, 60); b.surf(SURF.LACQUER).col(W1, 0.92, 1.04); b.box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, { bottom: true });
  // a crib's balk: pale sawn timber, its two ends darker with the end grain, washed by the lanterns under the building
  b = U.crib = mk(); b.flood(1.6, -1, 60);
  b.surf(SURF.LACQUER).col(W1, 0.9, 1.04); b.wall(0.5, 0.5, 0.5, -0.5, -0.5, 0.5); b.wall(-0.5, -0.5, -0.5, 0.5, -0.5, 0.5);
  b.quad([-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]); b.quad([-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]);
  b.surf(SURF.PLAIN).col([0.62, 0.5, 0.36], 0.9, 1.05); b.wall(-0.5, 0.5, 0.5, 0.5, -0.5, 0.5); b.wall(0.5, -0.5, -0.5, -0.5, -0.5, 0.5);
  // a storm lantern hanging from the origin: a wire bail, an iron cap and foot, the lit glass between them
  b = U.lantern = mk(); b.surf(SURF.STEEL).col(mul(COL.iron, 1.4), 1, 1.2);
  for (const sx of [-1, 1]) b.beam([0, 0, 0], [sx * 0.13, -0.22, 0], 0.025, 0.025);
  b.cyl(0, -0.27, 0, 0.15, 0.07, 0.08, 6); b.cyl(0, -0.62, 0, 0.13, 0.15, 0.08, 6);
  b.flood(1.5, 0, 9).surf(SURF.PLAIN).col([1.0, 0.72, 0.34], 1, 1).cyl(0, -0.54, 0, 0.1, 0.12, 0.27, 6, { cap: false }); b.flood(0);
  // a swing boat hung from its pivot (the origin) on four iron rods 4.2 m long: a plain crescent hull in one paint
  // with a cream gunwale, two thwarts; it swings in its own X-Y plane
  b = U.boat = mk(); const BL = 4.2;
  b.flood(0.7, -BL - 1, 60);
  b.surf(SURF.STEEL).col(mul(COL.iron, 1.3), 1.2, 1.4); for (const z of [-0.5, 0.5]) for (const x of [-1.2, 1.2]) b.beam([0, 0, z * 0.5], [x, -BL + 0.5, z], 0.06, 0.06);
  b.surf(SURF.LACQUER).col(W1, 0.8, 1.05);
  b.grid(8, 4, (u, w) => { const s = 2 * u - 1, th = (w - 0.5) * Math.PI, hw = 0.56 * (1 - 0.5 * s * s * s * s); return [s * 1.6, -BL + 0.5 + 0.5 * s * s - 0.62 * Math.cos(th) * (1 - 0.3 * s * s), hw * Math.sin(th)]; },
    { double: true, colorFn: (u, w) => (w < 0.13 || w > 0.87 ? COL.cream : W1) });
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); for (const x of [-0.95, 0.65]) b.box(x, -BL + 0.2, -0.46, x + 0.3, -BL + 0.26, 0.46, {});
  b.flood(0);
  // A LIFTING EYE: a small bolted iron plate 0.3 m square against the stone (in the XY plane, facing
  // +Z), a plain eye a hand's breadth across standing out of it, and its short sling of pale hemp through the eye
  b = U.ring = mk(); b.surf(SURF.STEEL).col(mul(COL.iron, 1.5), 1, 1.3);
  // (36 triangles: the plate, the eye as a small upright lug, the sling)
  b.box(-0.15, -0.15, 0, 0.15, 0.15, 0.03, {}); b.box(-0.025, -0.085, 0.03, 0.025, 0.085, 0.19, {});
  b.surf(SURF.PLAIN).col(mix3(COL.rope, COL.cream, 0.45), 0.9, 1.1); b.beam([0, 0.02, 0.13], [0, -0.5, 0.1], 0.08, 0.04);
  // a stake with a painted head
  b = U.stake = mk(); b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); b.box(-0.07, 0, -0.07, 0.07, 0.86, 0.07, {});
  b.surf(SURF.PLAIN).col(COL.accents[0], 1, 1); b.box(-0.08, 0.86, -0.08, 0.08, 1.1, 0.08, {});
  // A CAGE OF THE WHEEL: SMALL AND OPEN. It hangs from its pin (the origin) by two pairs of iron straps:
  // a light painted canopy, four slim cream posts, a low tub of painted panels with a cream rail, a board floor;
  // between the rail and the canopy it stands open on all four sides. It takes the wheel's lamps' wash.
  b = U.cage = mk(); const cl = 0.85, cd = 0.7, yt = -0.45, yb = -2.85;
  b.flood(0.55, -1, 60);
  b.surf(SURF.STEEL).col(mul(COL.iron, 1.6), 1, 1.2);
  for (const z of [-0.6, 0.6]) { b.beam([0, 0.05, z], [-0.5, yt - 0.25, z], 0.06, 0.1); b.beam([0, 0.05, z], [0.5, yt - 0.25, z], 0.06, 0.1); }
  b.surf(SURF.LACQUER).col(W1, 0.85, 1.02); b.hip(-cl - 0.12, -cd - 0.12, cl + 0.12, cd + 0.12, yt - 0.42, 0.42, { overhang: 0, ridge: 0.5 });
  b.col(COL.cream, 0.95, 1.05);
  for (const x of [-cl, cl]) for (const z of [-cd, cd]) b.box(x - 0.035, yb + 0.8, z - 0.035, x + 0.035, yt - 0.42, z + 0.035, { top: false });
  b.col(W1, 0.82, 1); b.box(-cl, yb, -cd, cl, yb + 0.8, cd, { top: false });
  b.col(COL.cream, 1, 1); b.box(-cl - 0.03, yb + 0.8, -cd - 0.03, cl + 0.03, yb + 0.88, cd + 0.03, { bottom: true });
  b.col(mul(COL.timber, 1.1), 0.8, 0.9); b.box(-cl, yb - 0.06, -cd, cl, yb, cd, { bottom: true });
  b.flood(0);
  // a car of the switchback: +Z forward, the rails' level at y = 0
  b = U.car = mk();
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); b.box(-0.66, 0.08, -1.25, 0.66, 0.3, 1.25, { bottom: true });
  for (const z of [-0.8, 0.8]) for (const x of [-0.6, 0.6]) b.box(x - 0.06, 0.0, z - 0.2, x + 0.06, 0.4, z + 0.2, {});
  b.surf(SURF.LACQUER).col(W1, 0.85, 1); b.box(-0.8, 0.3, -1.3, 0.8, 1.02, 1.3, { top: false });
  b.frustum(0, 1.5, 1.6, 0.5, 1.2, 0.2, 0.3, 1.2, {});
  b.surf(SURF.PLAIN).col(COL.cream, 1, 1); b.box(-0.84, 1.02, -1.34, 0.84, 1.1, 1.34, {});
  b.surf(SURF.PLANKS).col(COL.timber, 0.8, 1); for (const z of [-0.95, 0.1]) { b.box(-0.72, 0.55, z, 0.72, 0.66, z + 0.55, {}); b.box(-0.72, 0.55, z - 0.1, 0.72, 1.3, z, {}); }
  // a seat of the swing: hung from its pivot (the origin) on two chains 9.5 m long; the chains are drawn stout
  b = U.seat = mk(); const L = 9.5;
  b.surf(SURF.STEEL).col(COL.iron, 1.2, 1.4); for (const z of [-0.3, 0.3]) { b.beam([0, 0, z * 0.5], [0, -L + 0.75, z], 0.07, 0.07); }
  b.surf(SURF.LACQUER).col(W1, 0.9, 1); b.box(-0.32, -L, -0.36, 0.32, -L + 0.08, 0.36, { bottom: true }); b.box(-0.36, -L, -0.36, -0.3, -L + 0.75, 0.36, {});
  b.surf(SURF.STEEL).col(COL.iron, 1.2, 1.4); for (const z of [-0.34, 0.34]) b.box(-0.3, -L + 0.36, z - 0.02, 0.34, -L + 0.4, z + 0.02, {});
  return U;
}

// THE CHAIN SWING: one plain painted column on a low panelled house; its crown (built apart, at the origin, and turned and tilted
// by the world from swingAngle and the wave) carries the canopy, the arms and the rim that the chains hang from
export function swingInto(b, P, I) {
  const S = P.swing, c = S.c;
  b.tr(c[0], 0, c[2], 0);
  b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.lathe(0, -0.2, 0, [[5.2, 0], [5.2, 0.8], [4.6, 0.8]], 16, { m: 1 });
  // a low eight-sided house of plain painted boards (one colour, no bands: a pale green, in the light of
  // the lamps round its eaves by place, so that it is no dark block under the swing)
  b.flood(1.0, 999, 1); b.surf(SURF.PLAIN).col(mix3(COL.green, COL.cream, 0.38), 0.92, 1.05); b.lathe(0, 0.6, 0, [[4.2, 0], [4.2, 3.4]], 8, {}); b.flood(0);
  b.surf(SURF.PLAIN).col(COL.cream, 0.95, 1.05); b.lathe(0, 4.0, 0, [[4.5, 0], [4.5, 0.4], [2.0, 1.3]], 16);
  // G3(d): the mast is ONE plain painted column, slender, with a moulded foot and two iron collars: no bands
  const mh = S.crownY - 5.3;
  b.surf(SURF.PLAIN).col(COL.cream, 0.96, 1.04); b.lathe(0, 5.3, 0, [[1.5, 0], [1.5, 0.5], [1.05, 0.9], [0.95, mh * 0.5], [0.8, mh - 1.2], [1.3, mh - 0.6]], 12);
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); b.lathe(0, 5.3 + mh * 0.5, 0, [[1.02, 0], [1.02, 0.25]], 12);
  b.surf(SURF.STEEL).col(COL.iron, 1, 1.2); b.lathe(0, S.crownY - 0.6, 0, [[1.6, 0], [1.6, 0.6]], 12);
  b.pop();
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; lamp(I, [c[0] + 4.6 * Math.cos(a), 4.3, c[2] + 4.6 * Math.sin(a)], 0.9, 0, k / 16, 0); }
  // the lamp crown: two rings of lamps under the canopy, and one ring at the mast's middle collar
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; lamp(I, [c[0] + 1.45 * Math.cos(a), S.crownY - 0.9, c[2] + 1.45 * Math.sin(a)], 0.9, 0, k / 12, 0); lamp(I, [c[0] + 1.2 * Math.cos(a + 0.26), S.crownY - 1.7, c[2] + 1.2 * Math.sin(a + 0.26)], 0.8, 0, k / 12 + 0.5, 0); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; lamp(I, [c[0] + 1.15 * Math.cos(a), 5.4 + mh * 0.5, c[2] + 1.15 * Math.sin(a)], 0.8, 0, -1, 0); }
  I.shadows.push({ kind: 'pole', p: [c[0], 0, c[2]], h: S.h, w: 4 }); I.shadows.push({ kind: 'disc', p: [c[0], 0, c[2]], h: S.crownY, r: S.rc + 1 });
  // the crown, about its own middle at the chains' pivots' height
  const g = I.crown = makeBuilder(1024), rc = S.rc, n = S.n;
  g.surf(SURF.STEEL).col(COL.iron, 1, 1.2);
  for (let k = 0; k < n; k++) { const a = k / n * TAU, a1 = (k + 1) / n * TAU; g.beam([rc * Math.cos(a), 0, rc * Math.sin(a)], [rc * Math.cos(a1), 0, rc * Math.sin(a1)], 0.22, 0.3); g.beam([1.5 * Math.cos(a), 0.9, 1.5 * Math.sin(a)], [rc * Math.cos(a), 0.05, rc * Math.sin(a)], 0.14, 0.2); }
  // the canopy: a striped cone over the arms, a scalloped valance at its edge, a gilt ball on top
  const acc = COL.accents;
  g.surf(SURF.CANVAS).grid(n * 2, 3, (u, w) => { const a = u * TAU, r = lerp(1.3, rc + 1.0, w), y = lerp(S.h - S.crownY - 0.4, 0.5, Math.pow(w, 0.8)); return [r * Math.cos(a), y, r * Math.sin(a)]; },
    { flip: true, double: true, colorFn: (u, w) => (Math.floor(u * n * 2 + 1e-4) % 2 ? mul(COL.cream, 1 - 0.1 * w) : mul(COL.red, 1.05 - 0.12 * w)) });
  for (let k = 0; k < n * 2; k++) {
    const a0 = k / (n * 2) * TAU, a1 = (k + 1) / (n * 2) * TAU, am = (a0 + a1) / 2, r = rc + 1.0;
    g.surf(SURF.CANVAS).col(k % 2 ? COL.cream : acc[1], 1, 1);
    g.tri([r * Math.cos(a0), 0.5, r * Math.sin(a0)], [r * Math.cos(am), -0.5, r * Math.sin(am)], [r * Math.cos(a1), 0.5, r * Math.sin(a1)]);
    g.tri([r * Math.cos(a1), 0.5, r * Math.sin(a1)], [r * Math.cos(am), -0.5, r * Math.sin(am)], [r * Math.cos(a0), 0.5, r * Math.sin(a0)]);
  }
  g.surf(SURF.LACQUER).col(acc[1], 1, 1.2); g.sphere(0, S.h - S.crownY + 0.1, 0, 0.6, 8, 5);
  const cl = I.crownLamps = [];
  for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * TAU; cl.push([(rc + 1.05) * Math.cos(a), 0.6, (rc + 1.05) * Math.sin(a), 1.0, 2, k / (n * 2), 0]); }
  for (let k = 0; k < n; k++) for (let j = 1; j <= 3; j++) { const a = k / n * TAU, r = lerp(1.5, rc, j / 4); cl.push([r * Math.cos(a), lerp(0.9, 0.05, j / 4) - 0.2, r * Math.sin(a), 0.75, 2, 2 + j / 4, 1]); }
}

// THE RIDERS' DRUM (G3a): told by its form alone. A tall plain timber drum, OPEN to the sky, of upright staves
// bound by iron hoops and propped by raking timbers; an outside stair to a railed walk round its top; a canvas
// awning over that walk only. Nothing lettered, no figure, no machine: within, the bare boards of wall and floor.
export function drumInto(b, P, I) {
  const D = P.drum, x0 = P.X(D.d), z0 = D.z, R = D.r, h = D.h, c = I.cloth, yw = h - 1.4;
  const at = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  b.tr(x0, 0, z0, 0);
  b.surf(SURF.PLANKS).col(COL.timber, 0.62, 0.8); b.lathe(0, -0.2, 0, [[R + 0.35, 0], [R + 0.35, 0.6], [R + 0.05, 0.6]], 24, { m: 1 });
  // the staves, upright and unpainted, outside and in
  // (A MADE THING: the wall is drawn stave by stave, one groove to each board 0.33 m wide, warm in the
  // light of the lamps under its walk; above the walk a band of boards painted red and cream in the awning's lamps)
  b.flood(1.0, 999, 1); b.surf(SURF.FLUTED, 0, 1).col(mul(COL.timber, 1.12), 0.72, 1.25); b.lathe(0, 0.4, 0, [[R, 0], [R, h - 0.4]], 32, { uvBand: [Math.round(TAU * R / 0.33), 0, 1] });
  b.flood(1.5, 999, 1); b.surf(SURF.STRIPES, 0, 0).col(COL.red, 0.95, 1.05); b.lathe(0, yw + 0.2, 0, [[R + 0.03, 0], [R + 0.03, h - yw - 0.2]], 32, { uvBand: [Math.round(TAU * R / 1.2), 0, 1] });
  b.flood(0);
  b.col(COL.timber, 0.6, 0.8); b.grid(24, 1, (u, w) => { const q = at(R - 0.22, u * TAU); return [q[0], lerp(h, 0.5, w), q[1]]; }, { double: true });
  b.col(COL.timber, 0.5, 0.6); b.disc(0, 0.5, 0, R - 0.2, 24);
  // the iron hoops, in the same light
  b.flood(0.9, 999, 1); b.surf(SURF.STEEL).col(mul(COL.iron, 1.7), 1, 1.25); for (const y of [1.0, 2.7, 4.4, 6.1, 7.4]) b.lathe(0, y, 0, [[R + 0.09, 0], [R + 0.09, 0.26]], 32);
  b.flood(0);
  // raking props all round, foot to waist
  b.surf(SURF.PLANKS).col(COL.timber, 0.7, 0.9);
  for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * TAU; if (a > 0.5 && a < 2.9) continue; const p0 = at(R + 1.85, a), p1 = at(R + 0.1, a); b.beam([p0[0], 0, p0[1]], [p1[0], 4.6, p1[1]], 0.2, 0.26); }
  // the walk round the top, its brackets and its rail
  b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05); b.lathe(0, yw, 0, [[R, 0], [R + 1.6, 0], [R + 1.6, 0.2], [R, 0.2]], 24);
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * TAU, p0 = at(R + 1.55, a), p1 = at(R + 0.1, a), a1 = (k + 1) / 24 * TAU, q0 = at(R + 1.55, a1);
    b.cbox(p0[0], yw + 0.2, p0[1], 0.1, 1.1, 0.1, {}); b.beam([p1[0], yw - 1.5, p1[1]], [p0[0], yw, p0[1]], 0.12, 0.14);
    b.beam([p0[0], yw + 1.3, p0[1]], [q0[0], yw + 1.3, q0[1]], 0.1, 0.08); b.beam([p0[0], yw + 0.75, p0[1]], [q0[0], yw + 0.75, q0[1]], 0.06, 0.06);
  }
  // the outside stair: a winding flight with its outer string and rail, in the light of the lamps on its rail
  b.flood(1.1, 999, 1); b.surf(SURF.PLAIN).col(mul(COL.timber, 1.15), 0.85, 1.1);
  for (let k = 0; k < 22; k++) {
    const a = 0.6 + k * 0.1, y = (k + 1) / 22 * yw; b.tr((R + 0.95) * Math.cos(a), 0, (R + 0.95) * Math.sin(a), -a);
    b.box(-0.8, y - 0.14, -0.45, 0.8, y, 0.45, { bottom: true }); b.box(0.72, y, -0.05, 0.8, y + 1.05, 0.05, {}); if (k % 4 === 0) b.box(0.66, 0, -0.08, 0.82, y - 0.14, 0.08, {}); b.pop();
    if (k % 3 === 1) lamp(I, [x0 + (R + 1.71) * Math.cos(a), y + 1.3, z0 + (R + 1.71) * Math.sin(a)], 0.95, 0, -1, 0);
  }
  b.flood(0); b.surf(SURF.PLANKS);
  // the lamps under the walk, all round: they light the staves
  for (let k = 0; k < 24; k++) { const a = (k + 0.5) / 24 * TAU; lamp(I, [x0 + (R + 0.9) * Math.cos(a), yw - 0.3, z0 + (R + 0.9) * Math.sin(a)], 0.95, 0, -1, 0); }
  // the awning's posts and its inner ring beam
  b.col(COL.white, 0.85, 1.0);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, p0 = at(R + 0.05, a), a1 = (k + 1) / 12 * TAU, q0 = at(R + 0.05, a1); b.cbox(p0[0], h, p0[1], 0.16, 2.9, 0.16, {}); b.beam([p0[0], h + 2.9, p0[1]], [q0[0], h + 2.9, q0[1]], 0.14, 0.14); }
  b.pop();
  // the awning: one ring of plain canvas over the walk, high at the drum's lip, low at its outer hem, lashed at both
  c.tr(x0, 0, z0, 0);
  cloth(c, 1, (x0 * 0.07 + z0 * 0.03) % 1, 0.12);
  sheet(c, 36, 3, (u, w) => { const q = at(lerp(R + 0.05, R + 1.95, w), u * TAU); return [q[0], lerp(h + 3.0, h + 1.75, w), q[1]]; },
    (u, w) => Math.sin(Math.PI * w), (u, w) => u * 36 + w * 2, (u, w) => mul(COL.cream, (w > 0.8 ? 0.78 : 1) * (1 - 0.1 * w)));
  c.pop();
  for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; lamp(I, [x0 + (R + 1.98) * Math.cos(a), h + 1.6, z0 + (R + 1.98) * Math.sin(a)], 1.15, 0, k / 48, 0); }
  for (let k = 0; k < 24; k++) { const a = (k + 0.5) / 24 * TAU; lamp(I, [x0 + (R - 0.1) * Math.cos(a), h + 2.7, z0 + (R - 0.1) * Math.sin(a)], 0.9, 0, -1, 0); }
  I.flags.push({ p: [x0 + R, h + 3.0, z0], len: 4, h: 1.2, pole: 2.6, col: 1, pennant: true });
  I.shadows.push({ kind: 'disc', p: [x0, 0, z0], h: h + 2, r: R + 1.5 });
  I.solids.push({ kind: 'round', p: [x0, 0, z0], r: R + 2, h: h + 7 });
}

// THE GREAT TENT: 52 m long on two king poles, its long axis along the seam. Its quarter toward the avenue's start
// (the south-east, where the line comes off the swing's round) is drawn up on tall poles to 15.5 m, the wall rolled
// up under it, higher than the line passes: so the ring, the empty tiers and the trapezes swinging at its middle
// stand open to the line from the swing's round and along the avenue's first metres, with lamps within.
// In its frame +Z looks across the avenue.
const tentEave = (th) => {
  const cx = Math.cos(th), sz = Math.sin(th), a = 7, rr = 19, t = Math.abs(sz) > 1e-6 && Math.abs(cx) * rr / Math.abs(sz) <= a ? rr / Math.abs(sz) : a * Math.abs(cx) + Math.sqrt(rr * rr - a * a * sz * sz);
  return [cx * t, sz * t];
};
// (TH0: the middle of the open side as an angle round the tent's own frame; tentInto sets it from the plan)
let TH0 = Math.PI / 2;
const tentOpen = (th) => { let q = Math.abs(th - TH0) % TAU; if (q > Math.PI) q = TAU - q; return 1 - smoothstep(0.5, 0.78, q); };
export function* tentInto(b, P, I) {
  const T = P.tent, F = T.F = frameAt(P, T.d, T.z, 0), c = I.cloth, top = T.h, he = (th) => 7.5 + 8 * tentOpen(th);
  const stripe = (u, w, k0, k1) => (Math.floor(u * 64 + 1e-4) % 2 ? mul(COL.cream, k0) : mul(COL.red, k1));
  // the open side's middle looks at the avenue's start: the line's own point where it comes off the swing's round
  { const dx = P.X(P.DA) - F.x, dz = P.swing.z - F.z, cy = Math.cos(F.yaw), sy = Math.sin(F.yaw); TH0 = Math.atan2(dx * sy + dz * cy, dx * cy - dz * sy); if (TH0 < 0) TH0 += TAU; }
  c.tr(F.x, 0, F.z, F.yaw);
  cloth(c, 1, (F.x * 0.05 + F.z * 0.02) % 1, 0.2);
  sheet(c, 64, 7, (u, w) => {
    const th = u * TAU, E = tentEave(th), ax = clamp(E[0], -7, 7), h = he(th);
    return [lerp(ax, E[0], w), h + (top - h) * Math.pow(1 - w, 1.7), lerp(0, E[1], w)];
  }, (u, w) => Math.sin(Math.PI * clamp(w, 0, 1)) * (1 - 0.5 * Math.abs(Math.sin(u * TAU * 6))), (u, w) => u * 60 + w * 5, (u, w) => stripe(u, w, 1.02 - 0.16 * w, 1.1 - 0.2 * w));
  yield;
  // the walls: lashed at the eave and the ground; on the open side rolled up under the eave
  cloth(c, 1, (F.x * 0.05 + F.z * 0.02 + 0.4) % 1, 0.1);
  sheet(c, 64, 2, (u, w) => { const th = u * TAU, E = tentEave(th), h = he(th), y0 = lerp(0, h - 0.9, tentOpen(th)); return [E[0], lerp(h, y0, w), E[1]]; },
    (u, w) => Math.sin(Math.PI * w), (u, w) => u * 60, (u, w) => stripe(u, w, 0.98 - 0.1 * w, 1.0 - 0.1 * w));
  // the scalloped valance all round the eave, free at its points
  cloth(c, 5, 0.3, 0.12);
  sheet(c, 128, 1, (u, w) => { const th = u * TAU, E = tentEave(th), h = he(th), k = 1 + 0.012 * w; return [E[0] * k, h + 0.05 - w * (0.5 + 0.7 * Math.abs(Math.sin(u * 64 * Math.PI))), E[1] * k]; },
    (u, w) => w, (u, w) => u * 120, (u, w) => (Math.floor(u * 64 + 1e-4) % 2 ? COL.accents[1] : COL.cream));
  c.pop();
  yield;
  b.tr(F.x, 0, F.z, F.yaw);
  // king poles and the ridge wire, quarter poles, side poles
  for (const x of [-7, 7]) { b.surf(SURF.STRIPES, 0, 2).col(COL.red, 0.9, 1.05); b.cyl(x, 0, 0, 0.3, 0.2, top + 3, 8, { cap: true }); }
  b.surf(SURF.STEEL).col(COL.iron, 1.2, 1.4); b.beam([-7, T.traps[0].y + 0.1, 0], [7, T.traps[0].y + 0.1, 0], 0.1, 0.1);
  for (const dz of [-2.4, 2.4]) b.beam([-12, T.traps[0].y, dz], [12, T.traps[0].y, dz], 0.1, 0.1);
  b.surf(SURF.PLANKS).col(COL.white, 0.9, 1.05);
  for (let k = 0; k < 14; k++) { const th = (k + 0.5) / 14 * TAU, E = tentEave(th), ax = clamp(E[0], -7, 7), w = 0.6, h = he(th); b.cyl(lerp(ax, E[0], w), 0, E[1] * w, 0.13, 0.11, h + (top - h) * Math.pow(1 - w, 1.7) - 0.1, 6); }
  for (let k = 0; k < 30; k++) { const th = (k + 0.5) / 30 * TAU, E = tentEave(th); b.cyl(E[0], 0, E[1], 0.1, 0.1, he(th), 6); }
  // the ring: a sawdust floor, a painted curb; the tiers round the far side and the ends, empty
  b.surf(SURF.PLAIN).col(mul(COL.gravel, 1.2), 1, 1); b.disc(0, 0.06, 0, 7, 24);
  b.surf(SURF.STRIPES, 0, 0).col(COL.red, 0.95, 1.05); b.lathe(0, 0, 0, [[7.3, 0], [7.3, 0.55], [6.9, 0.55], [6.9, 0.06]], 24, { cellW: 1.9, cellH: 1 });
  b.surf(SURF.PLANKS).col(COL.timber, 0.8, 1.05);
  for (let s = 0; s < 5; s++) for (let k = 0; k < 48; k++) {
    const t0 = k / 48 * TAU, t1 = (k + 1) / 48 * TAU; if (tentOpen((t0 + t1) / 2) > 0.02) continue;
    const E0 = tentEave(t0), E1 = tentEave(t1), k0 = 0.56 + s * 0.08, k1 = k0 + 0.08, y = 0.8 + s * 0.85;
    b.quad([E0[0] * k0, y, E0[1] * k0], [E1[0] * k0, y, E1[1] * k0], [E1[0] * k1, y, E1[1] * k1], [E0[0] * k1, y, E0[1] * k1]);
    b.quad([E0[0] * k0, y - 0.85, E0[1] * k0], [E1[0] * k0, y - 0.85, E1[1] * k0], [E1[0] * k0, y, E1[1] * k0], [E0[0] * k0, y, E0[1] * k0]);
  }
  b.pop();
  for (let k = 0; k < 28; k++) { const th = (k + 0.5) / 28 * TAU, E = tentEave(th), ax = clamp(E[0], -7, 7); lamp(I, F.p(lerp(ax, E[0], 0.6), 9.5, E[1] * 0.6), 1.1, 0, k / 28, 0); }
  for (let k = 0; k < 64; k++) { const th = k / 64 * TAU, E = tentEave(th); lamp(I, F.p(E[0] * 1.02, he(th) + 0.25, E[1] * 1.02), 0.9, 0, k / 64, 0); }
  // lamps within: along the two wires the trapezes hang from, round the ring's curb, and a second ring on the canvas
  for (const dz of [-2.4, 2.4]) for (let k = 0; k <= 12; k++) lamp(I, F.p(lerp(-12, 12, k / 12), T.traps[0].y - 0.25, dz), 1.0, 0, k / 12, 1);
  for (let k = 0; k < 20; k++) { const a = k / 20 * TAU; lamp(I, F.p(7.4 * Math.cos(a), 0.8, 7.4 * Math.sin(a)), 0.8, 0, k / 20, 0); }
  for (let k = 0; k < 24; k++) { const th = (k + 0.5) / 24 * TAU, E = tentEave(th), ax = clamp(E[0], -7, 7), h = he(th); lamp(I, F.p(lerp(ax, E[0], 0.3), h + (top - h) * Math.pow(0.7, 1.7) + 0.3, E[1] * 0.3), 1.0, 0, k / 24, 0); }
  for (let k = 0; k <= 8; k++) lamp(I, F.p(lerp(-7, 7, k / 8), top + 0.4, 0), 1.0, 0, k / 8, 1);
  for (const x of [-7, 7]) { const p = F.p(x, top + 3, 0); I.flags.push({ p, len: 5.5, h: 1.5, pole: 0.2, col: x < 0 ? 0 : 1, pennant: true }); for (let j = 0; j < 6; j++) lamp(I, F.p(x, 10 + j * 1.8, 0.4), 0.9, 0, -1, 0); }
  T.pivots = T.traps.map((q, i) => F.p(q.off, q.y, i % 2 ? 2.4 : -2.4));
  // five lamps under each trapeze's bar: they swing with it (their places are metres from the bar's middle; the
  // lamps' material adds the bar's place, which the trapeze's own law of the clock gives)
  for (let i = 0; i < T.traps.length; i++) for (const e of [-1.2, -0.6, 0, 0.6, 1.2]) I.trapLamps.push([Math.sin(F.yaw) * e, -0.28, Math.cos(F.yaw) * e, 1.0, 3 + i, -1, 1]);
  I.shadows.push({ kind: 'box', d: T.d, z: T.z, face: 0, hw: 23, hd: 17, h: 12 });
  I.solids.push({ kind: 'box', F, hw: 26.5, hd: 19.5, h: top + 4 });
}

// the booths of the midway: a planked box with a counter and a painted back, a striped roof, a canvas awning out
// front on two poles (it flutters), a row of lamps on the fascia; stars and stripes for ornament, no word anywhere
// ONE BOOTH of the plan's record q (boothsInto builds the older ones with it, seamInto the seam's two)
function boothInto(b, P, I, q) {
  const c = I.cloth, acc = COL.accents;
  {
    const F = frameAt(P, q.d, q.z, q.face ?? (q.side > 0 ? Math.PI : 0)), hw = 3.0, hd = 2.2, h = q.h, paint = acc[q.col];
    b.tr(F.x, 0, F.z, F.yaw);
    // (the booth stands in its own lamps' light: its painted boards, counter and striped roof take their wash)
    b.flood(1.0, 1.2, 3.2);
    b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.box(-hw - 0.15, -0.2, -hd - 0.15, hw + 0.15, 0.35, hd + 0.15, { m: 1, capColor: COL.moss });
    b.surf(SURF.LACQUER).col(mix3(paint, COL.cream, 0.35), 0.85, 1.02);
    b.wall(hw, hd, hw, -hd, 0.35, h, { m: 0.5 }); b.wall(hw, -hd, -hw, -hd, 0.35, h, { m: 0.5 }); b.wall(-hw, -hd, -hw, hd, 0.35, h, { m: 0.5 });
    // the counter and the back wall seen over it: a painted panel with a star or a scroll band
    b.surf(SURF.STRIPES, 0, 0).col(paint, 0.9, 1.05); b.box(-hw, 0.35, hd - 0.5, hw, 1.25, hd, { cellW: 0.75, cellH: 1 });
    b.surf(SURF.PLAIN).col(COL.cream, 1, 1); b.box(-hw - 0.05, 1.25, hd - 0.6, hw + 0.05, 1.35, hd + 0.1, {});
    b.surf(SURF.LACQUER).col(mul(paint, 0.8), 0.9, 1.1); b.quad([-hw, 0.35, -hd + 0.06], [hw, 0.35, -hd + 0.06], [hw, h, -hd + 0.06], [-hw, h, -hd + 0.06]);
    if (q.star) {
      b.surf(SURF.PLAIN).col(acc[(q.col + 1) % 3 === q.col ? 3 : (q.col + 1) % 3], 1, 1);
      for (let k = 0; k < 5; k++) { const a0 = k / 5 * TAU + Math.PI / 2, a1 = a0 + TAU / 10, a2 = a0 - TAU / 10, z = -hd + 0.1, y = (h + 0.35) / 2 + 0.3; b.tri([0, y, z], [0.36 * Math.cos(a2), y + 0.36 * Math.sin(a2), z], [0.95 * Math.cos(a0), y + 0.95 * Math.sin(a0), z]); b.tri([0, y, z], [0.95 * Math.cos(a0), y + 0.95 * Math.sin(a0), z], [0.36 * Math.cos(a1), y + 0.36 * Math.sin(a1), z]); }
    } else { b.surf(SURF.STRIPES, 0, 2).col(acc[(q.col + 2) % 3], 1, 1); b.quad([-hw + 0.5, 1.9, -hd + 0.1], [hw - 0.5, 1.9, -hd + 0.1], [hw - 0.5, 2.7, -hd + 0.1], [-hw + 0.5, 2.7, -hd + 0.1], [0, 0, 6, 1]); }
    b.surf(SURF.PLAIN).col(COL.cream, 1, 1); b.box(-hw - 0.1, h - 0.45, hd - 0.1, hw + 0.1, h, hd + 0.08, {});
    b.surf(SURF.STRIPES, 0, 0).col(paint, 0.9, 1.05);
    if (q.roof === 'hip') b.hip(-hw - 0.3, -hd - 0.3, hw + 0.3, hd + 0.3, h, 1.5, { overhang: 0, ridge: 0.45 }); else b.gable(-hw - 0.3, -hd - 0.3, hw + 0.3, hd + 0.3, h, 1.4, { overhang: 0 });
    b.surf(SURF.LACQUER).col(COL.white, 0.9, 1.05); for (const x of [-hw + 0.1, hw - 0.1]) b.cbox(x, 0, hd + 2.4, 0.12, h - 0.75, 0.12, {});
    b.flood(0);
    b.pop();
    c.tr(F.x, 0, F.z, F.yaw);
    cloth(c, 4, (q.z * 0.13) % 1, 0.1);
    sheet(c, 8, 3, (u, w) => [lerp(-hw, hw, u), lerp(h - 0.3, h - 0.9, w) - (w > 0.84 ? 0.3 * (0.4 + 0.6 * Math.abs(Math.sin(u * 8 * Math.PI))) : 0), hd + (w > 0.84 ? 2.42 : w * 2.4 / 0.84 * 0.84)],
      (u, w) => (w > 0.84 ? 1 : Math.sin(Math.PI * w / 0.84) * 0.7), (u, w) => u * 6 + w * 2, (u, w) => (Math.floor(u * 8 + 1e-4) % 2 ? COL.cream : paint));
    c.pop();
    for (let k = 0; k <= 10; k++) lamp(I, F.p(lerp(-hw, hw, k / 10), h - 0.2, hd + 0.2), 0.9, 0, -1, 0);
    for (const sx of [-1, 1]) for (let k = 1; k <= 4; k++) lamp(I, F.p(sx * (hw + 0.15), h - 0.2, lerp(hd, -hd, k / 4)), 0.8, 0, -1, 0);
    I.flags.push({ p: F.p(0, h + 1.3, 0), len: 2.2, h: 0.7, pole: 1.5, col: (q.col + 1) % 4, pennant: true });
    I.shadows.push({ kind: 'box', d: q.d, z: q.z, face: 0, hw: 2.5, hd: 3.2, h: h + 1 }); I.solids.push({ kind: 'box', F, hw: hw + 0.4, hd: hd + 2.6, h: h + 1.6 });
  }
}
// a festoon: a string of n lamps from a to c (the world's [x, z] each) hung at y with a sag, on a pale wire of
// four chords along the lamps' own curve; in the chase or steady
function hangString(I, a, c, y, sag, n, chase, size = 0.85) {
  const at = (t) => [lerp(a[0], c[0], t), y - sag * Math.sin(Math.PI * t), lerp(a[1], c[1], t)];
  for (let k = 0; k < 4; k++) mem(I, at(k / 4), at((k + 1) / 4), 0.06, 0.06);
  for (let k = 1; k < n + 1; k++) { const t = k / (n + 1); lamp(I, at(t), size, 0, chase ? t : -1, k % (chase ? 4 : 3) === 0 ? 1 : 0); }
}
export function* boothsInto(b, P, I) {
  const D = P.dress;
  let n = 0;
  for (const q of D.booths) {
    boothInto(b, P, I, q);
    if (++n % 4 === 0) yield;
  }
  // THE FESTOONS (planDress: poles, strings): every string hangs from two white poles that are seen, on a WIRE
  // that is seen (a pale painted wire in four chords along the lamps' own sag), its lamps along it. Those ACROSS
  // the midway the line passes OVER (their lowest lamp 3.0 m and more under it).
  // (head: a pole that is also one of the fair's lamp standards, a great lamp at its head: the poles in the
  // line of the close's east hedge)
  for (const q of D.poles) { const x = P.X(q.d); mem(I, [x, 0, q.z], [x, q.h + 0.3, q.z], 0.2, 0.2); if (q.head) lamp(I, [x, q.h + 0.75, q.z], 1.7, 0, -1, 0); I.shadows.push({ kind: 'pole', p: [x, 0, q.z], h: q.h, w: 0.4 }); }
  const hang = (a, c, y, sag, n, chase, size = 0.85) => hangString(I, a, c, y, sag, n, chase, size);
  for (const s of D.strings) hang([P.X(s.a[0]), s.a[1]], [P.X(s.b[0]), s.b[1]], s.h, s.sag, s.n, s.chase);
  // Festoons OVERHEAD on the crossing, where the line flies at 8 to 8.8 m: tall white masts 7.5 m either side
  // of the line (none within 6 m of the switchback's two runs), a string of lamps from each to its fellow, its
  // lowest lamp 2.9 m and more above the line; and strings from mast to mast along each side where no run lies between
  const md = [-14, -26, -48, -58, -74], mh = 12.7;
  for (let i = 0; i < md.length; i++) {
    const x = P.X(md[i]);
    for (const sg of [-1, 1]) {
      const z = P.ZC + sg * 7.5; mem(I, [x, 0, z], [x, mh, z], 0.26, 0.26); I.shadows.push({ kind: 'pole', p: [x, 0, z], h: mh, w: 0.5 });
      lamp(I, [x, mh + 0.2, z], 1.3, 0, -1, 1);
      if (i === 0) hang([x, z], [P.X(md[i + 1]), z], mh - 0.3, 0.7, 7, false);
    }
    hang([x, P.ZC - 7.5], [x, P.ZC + 7.5], mh - 0.3, 1.0, 15, true, 0.9);
  }
  for (const q of D.arches || []) {
    let prev = null;
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * k / 12, p = [P.X(P.DA + 7 * Math.cos(a)), 6.4 + 3.3 * Math.sin(a), q.z];
      if (prev) { mem(I, prev, p, 0.16, 0.16); lamp(I, [(prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2 - 0.15, q.z], 0.9, 0, k / 12, 0); }
      lamp(I, [p[0], p[1] - 0.15, p[2]], 0.9, 0, k / 12, k % 3 === 0 ? 1 : 0);
      prev = p;
    }
    for (const sg of [-1, 1]) { const x = P.X(P.DA + sg * 7); mem(I, [x, 0, q.z], [x, 6.4, q.z], 0.26, 0.26); I.shadows.push({ kind: 'pole', p: [x, 0, q.z], h: 6.4, w: 0.5 }); }
  }
}

// THE PLEASURE GROUNDS' OWN THINGS (planDress): the gate's hoop of lamps in the close's east hedge; the lamp posts
// of the walks; the bandstand at the middle of the lawn inside the rising turn; the clipped parterres.
export function* pleasureInto(b, P, I) {
  const D = P.dress, foot = (x, z, s = 1.1) => { b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.cbox(x, -0.2, z, s, 0.7, s, { m: 1, capColor: COL.moss }); };
  // THE GATE: two white posts on brick footings in the hedge's gap, ivy at their feet, and one plain round hoop
  // of lamps from post to post like the avenue's arches (no board, no face, no box: it stands open)
  // (the gate stands across the close's cut corner, from post a to post b of the plan, facing the lane)
  for (const g of D.gates) {
    const ax = P.X(g.a[0]), az = g.a[1], bx = P.X(g.b[0]), bz = g.b[1], cx = (ax + bx) / 2, cz = (az + bz) / 2, hx = (bx - ax) / 2, hz = (bz - az) / 2, r = Math.hypot(hx, hz); let prev = null;
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * k / 12, p = [cx + hx * Math.cos(a), g.post + r * Math.sin(a), cz + hz * Math.cos(a)];
      if (prev) { mem(I, prev, p, 0.16, 0.16); lamp(I, [(prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2 - 0.15, (prev[2] + p[2]) / 2], 1.05, 0, k / 12, 0); }
      lamp(I, [p[0], p[1] - 0.15, p[2]], 1.05, 0, k / 12, k % 3 === 0 ? 1 : 0);
      prev = p;
    }
    for (const [x, z] of [[ax, az], [bx, bz]]) {
      mem(I, [x, 0, z], [x, g.post, z], 0.3, 0.3); foot(x, z, 1.3);
      I.ivy.push([x, 0.9, z, 1.5]); I.shadows.push({ kind: 'pole', p: [x, 0, z], h: g.post + 2, w: 0.5 });
    }
  }
  // the walks' lamp posts: a white post on a brick foot, one lamp at its head
  for (const q of D.walkLamps) { const x = P.X(q.d); mem(I, [x, 0, q.z], [x, 3.7, q.z], 0.16, 0.16); lamp(I, [x, 3.9, q.z], 1.5, 0, -1, 0); }
  // THE ROUND POINTS' TALL STANDARDS: a white post in the middle bed, four arms and a head, five lamps
  for (const q of D.clusters) {
    const x = P.X(q.d);
    mem(I, [x, 0, q.z], [x, 6.2, q.z], 0.24, 0.24); lamp(I, [x, 6.5, q.z], 1.7, 0, -1, 0);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4, e = [x + 1.3 * Math.cos(a), 5.3, q.z + 1.3 * Math.sin(a)]; mem(I, [x, 5.0, q.z], e, 0.1, 0.1); lamp(I, [e[0], 5.5, e[2]], 1.5, 0, -1, k % 2); }
    I.shadows.push({ kind: 'pole', p: [x, 0, q.z], h: 6.4, w: 0.5 }); I.solids.push({ kind: 'round', p: [x, 0, q.z], r: 1.8, h: 7.2 });
  }
  // THE OLD LIMES ARE HUNG WITH LAMPS: a ring of seven under each crown's edge and four nearer the
  // trunk, hanging still (the leaves move in the wind; the lamps are the lamps' own field and do not)
  for (const t of D.trees) {
    const x = P.X(t.d);
    for (let k = 0; k < 7; k++) { const a = t.rot + k / 7 * TAU; lamp(I, [x + 0.72 * t.cr * Math.cos(a), 0.37 * t.h, t.z + 0.72 * t.cr * Math.sin(a)], 0.85, 0, -1, k % 3 === 0 ? 1 : 0); }
    for (let k = 0; k < 4; k++) { const a = t.rot + 0.5 + k / 4 * TAU; lamp(I, [x + 0.36 * t.cr * Math.cos(a), 0.31 * t.h, t.z + 0.36 * t.cr * Math.sin(a)], 0.8, 0, -1, 0); }
  }
  yield;
  // THE BENCHES: plain garden benches round every ring, each facing the ring's middle, empty: two iron
  // ends, a seat and a back of white-painted slats, in the walk lamps' light
  b.flood(0.9, 0.6, 3);
  for (const q of D.benches) {
    b.tr(P.X(q.d), 0, q.z, Math.atan2(-P.hand * Math.cos(q.a), -Math.sin(q.a)));
    b.surf(SURF.STEEL).col(mul(COL.green, 1.6), 0.9, 1.1); for (const sx of [-0.85, 0.85]) { b.box(sx - 0.03, 0, -0.22, sx + 0.03, 0.44, 0.24, {}); b.box(sx - 0.03, 0.44, -0.26, sx + 0.03, 0.92, -0.2, {}); }
    b.surf(SURF.LACQUER).col(COL.white, 0.9, 1.04); b.box(-0.95, 0.42, -0.2, 0.95, 0.47, 0.26, { bottom: true }); b.box(-0.95, 0.6, -0.27, 0.95, 0.9, -0.23, {});
    b.pop();
    I.solids.push({ kind: 'round', p: [P.X(q.d), 0, q.z], r: 1.1, h: 1.1 });
  }
  b.flood(0);
  // THE BANDSTAND: an eight-sided floor on a brick base with three steps, eight white posts, a rail, a low
  // green roof with a knob; lamps under its eave and one ring within; a few empty chairs and stands on its floor
  const Bd = D.band, bx = P.X(Bd.d), R = Bd.r, at8 = (k, r) => [r * Math.cos((k + 0.5) / 8 * TAU), r * Math.sin((k + 0.5) / 8 * TAU)];
  b.tr(bx, 0, Bd.z, 0);
  b.flood(1.0, 3.6, 3);
  // (the eight-sided base, floor and roof are turned so that their corners stand at the posts)
  const turn8 = new THREE.Matrix4().makeRotationY(Math.PI / 8);
  b.push(turn8);
  b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.82, 1); b.lathe(0, -0.2, 0, [[R + 0.5, 0], [R + 0.5, 1.0], [R + 0.3, 1.1]], 8, { m: 1 });
  b.surf(SURF.PLANKS).col(COL.timber, 0.9, 1.05); b.lathe(0, 0.9, 0, [[R + 0.3, 0], [0.01, 0.02]], 8);
  b.pop();
  for (let k = 0; k < 3; k++) b.box(R + 0.05 + k * 0.4, -0.2, -1.2, R + 0.45 + k * 0.4, 0.7 - k * 0.3, 1.2, {});
  for (let k = 0; k < 8; k++) {
    const p = at8(k, R), q = at8(k + 1, R);
    b.surf(SURF.LACQUER).col(COL.white, 0.9, 1.05); b.cyl(p[0], 0.9, p[1], 0.11, 0.09, 3.3, 6, { cap: false });
    if (k !== 7) { b.beam([p[0], 1.85, p[1]], [q[0], 1.85, q[1]], 0.08, 0.1); b.beam([p[0], 1.35, p[1]], [q[0], 1.35, q[1]], 0.05, 0.05); }
    b.beam([p[0], 4.15, p[1]], [q[0], 4.15, q[1]], 0.14, 0.22);
  }
  b.push(turn8); b.surf(SURF.TILES).col(mul(COL.green, 1.9), 0.85, 1.1); b.lathe(0, 4.2, 0, [[R + 0.9, 0], [R - 1.2, 0.8], [1.2, 2.1], [0.4, 2.5]], 8); b.pop();
  b.surf(SURF.LACQUER).col(COL.accents[1], 1, 1.2); b.lathe(0, 6.7, 0, [[0.4, 0], [0.5, 0.3], [0.2, 0.7], [0.01, 1.3]], 6, { smooth: true });
  // the empty chairs in an arc, and three stands
  b.surf(SURF.PLANKS).col(mul(COL.timber, 0.75), 0.9, 1.05);
  for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.42, cx = -2.6 * Math.cos(a), cz = 2.6 * Math.sin(a); b.cbox(cx, 0.92, cz, 0.42, 0.45, 0.42, {}); b.cbox(cx - 0.2 * Math.cos(a), 1.37, cz + 0.2 * Math.sin(a), 0.1, 0.5, 0.42, {}); }
  b.surf(SURF.STEEL).col(mul(COL.iron, 1.6), 1, 1.2); for (const dz of [-1.1, 0, 1.1]) { b.cyl(-1.5, 0.92, dz, 0.03, 0.03, 1.15, 4, { cap: false }); b.beam([-1.42, 2.02, dz - 0.25], [-1.42, 2.02, dz + 0.25], 0.03, 0.34); }
  b.flood(0);
  b.pop();
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; lamp(I, [bx + (R + 0.75) * Math.cos(a), 4.05, Bd.z + (R + 0.75) * Math.sin(a)], 0.95, 0, k / 16, 0); }
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; lamp(I, [bx + 2.2 * Math.cos(a), 5.0, Bd.z + 2.2 * Math.sin(a)], 0.9, 0, -1, 1); }
  I.shadows.push({ kind: 'disc', p: [bx, 0, Bd.z], h: 4.5, r: R + 0.8 }); I.solids.push({ kind: 'round', p: [bx, 0, Bd.z], r: R + 1.2, h: 8.2 });
  yield;
  // THE PARTERRES: a square of low clipped hedge with an opening in each side and a clipped cone at each corner,
  // round the bed at its middle
  for (const q of D.parterres) {
    const x = P.X(q.d), s = 5.2;
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const sg of [-1, 1]) {
      b.surf(SURF.PLAIN).col(COL.moss, 0.6, 1.15);
      b.frustum(x + ax * s + (ax ? 0 : sg * 3.1), q.z + az * s + (az ? 0 : sg * 3.1), ax ? 1.1 : 3.6, az ? 1.1 : 3.6, ax ? 0.8 : 3.4, az ? 0.8 : 3.4, 0, 0.95, { capColor: mul(COL.moss, 1.3) });
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.surf(SURF.PLAIN).col(mul(COL.moss, 1.1), 0.6, 1.2); b.lathe(x + sx * s, 0, q.z + sz * s, [[0.75, 0], [0.8, 0.5], [0.45, 1.5], [0.02, 2.3]], 7, { smooth: true }); }
  }
}

// (the fair's rides are the wheel, the switchback, the swing, the drum, the tent and the swing boats)

// THE SWING BOATS' FRAMES (planBoats): for each row an iron top beam on A-frames, one between every two boats and
// one at each end, their legs on brick footings sunk in the turf, ivy at the end frames' feet; lamps along the
// beam and down the end legs. The boats themselves are the movers' (makeMovers), hung from the beam's pivots.
export function boatsInto(b, P, I) {
  for (const q of P.boats) {
    // (sc is the row's own size; the frame's legs stand 2.5 m times sc either side of the beam)
    const F = frameAt(P, q.d, q.z, q.face), n = q.n, H = q.H, z0 = -n * q.pitch / 2, lx = 2.5 * q.sc;
    q.F = F; q.pivots = [];
    for (let i = 0; i <= n; i++) {
      const z = z0 + i * q.pitch;
      for (const sx of [-1, 1]) {
        // (the frame's iron is painted white like the fair's other standing work, and takes the lamps' wash)
        mem(I, F.p(sx * lx, 0.3, z), F.p(sx * 0.12, H + 0.1, z), 0.24, 0.24);
        const f = F.p(sx * lx, 0, z); b.surf(SURF.MASONRY, 0, 0.45).col(COL.brick, 0.8, 1); b.cbox(f[0], -0.2, f[2], 1.0, 0.65, 1.0, { m: 1, capColor: COL.moss });
        const end = i === 0 || i === n, nl = end ? 7 : 3;
        if (end) I.ivy.push([f[0], 0.8, f[2], 1.4]);
        for (let j = 1; j <= nl; j++) lamp(I, F.p(sx * lerp(lx, 0.12, j / (nl + 1)), lerp(0.3, H + 0.1, j / (nl + 1)), z + (i ? 0.2 : -0.2)), 0.95, 0, -1, 0);
      }
      mem(I, F.p(-lx * 0.57, H * 0.45, z), F.p(lx * 0.57, H * 0.45, z), 0.12, 0.12);
      if (i < n) { mem(I, F.p(0, H, z), F.p(0, H, z + q.pitch), 0.26, 0.3); q.pivots.push(F.p(0, H, z + q.pitch / 2)); }
    }
    for (let k = 0; k <= n * 4; k++) lamp(I, F.p(0, H + 0.35, z0 + k * q.pitch / 4), 1.05, 0, k / (n * 4), k % 4 === 0 ? 1 : 0);
    I.shadows.push({ kind: 'box', d: q.d, z: q.z, face: q.face, hw: 0.4, hd: -z0, y0: H - 1, h: H });
    I.solids.push({ kind: 'box', F, hw: 5 * q.sc, hd: -z0 + 1, h: H + 1 });
  }
}

// THE SWING'S GARDEN (planDress, D.garden): what stands of it. Round the swing a low clipped
// hedge ring with four openings (a clipped ball at each side of each); outside the ring walk, on the south half the
// line flies over, five beds: dark earth in an arc, edged all round with a low clipped hedge, a clipped ball at
// each corner, and three low white lamp posts to a bed (one at each end by the walk, one behind its middle). The
// hedges and the earth take the low lamps' wash by place (the kit's flood); the beds' flowers are the world's
// flora, the walk a ribbon of the ground (walkRibbons), the festoon and the limes the dress's own lists.
export function* gardenInto(b, P, I) {
  const Gd = P.dress.garden, W = (r, a) => { const p = Gd.at(r, a); return [P.X(p[0]), p[1]]; };
  // (a footprint in the builder's own sense, whichever hand the fair lies on)
  const turn = (poly) => { let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], c = poly[(i + 1) % poly.length]; s += a[0] * c[1] - c[0] * a[1]; } return s > 0 ? poly.reverse() : poly; };
  // a length of clipped hedge from a to c: w wide at its foot, h high, battered, its top paler
  const hedge = (a, c, w, h) => {
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]) + 0.1;
    b.tr((a[0] + c[0]) / 2, 0, (a[1] + c[1]) / 2, Math.atan2(c[0] - a[0], c[1] - a[1]));
    b.surf(SURF.PLAIN).col(COL.moss, 0.55, 1.12); b.frustum(0, 0, w, len, w * 0.68, len, 0, h, { capColor: mul(COL.moss, 1.32) });
    b.pop();
  };
  const ball = (p, r, y) => { b.surf(SURF.PLAIN).col(mul(COL.moss, 1.1), 0.6, 1.2); b.sphere(p[0], y, p[1], r, 6, 4); };
  b.flood(0.75, 0.4, 2.2);
  // the ring: sixty lengths of 6 degrees; the openings are two lengths each, at the two walks that come in from
  // the south and at two places on the north half
  const open = [5, 6, 21, 22, 37, 38, 51, 52];
  for (let i = 0; i < 60; i++) {
    if (open.includes(i)) continue;
    hedge(W(Gd.rh, i * 6), W(Gd.rh, i * 6 + 6), 1.0, 0.95);
    if (open.includes(i + 1)) ball(W(Gd.rh, i * 6 + 6), 0.78, 1.0);
    if (open.includes((i + 59) % 60)) ball(W(Gd.rh, i * 6), 0.78, 1.0);
  }
  yield;
  for (const [a0, a1] of Gd.beds) {
    const r0 = Gd.rb0, r1 = Gd.rb1, n = Math.round((a1 - a0) / 4), da = (a1 - a0) / n;
    for (let k = 0; k < n; k++) {
      const a = a0 + k * da;
      b.surf(SURF.PLAIN).col([0.07, 0.045, 0.03], 1, 1); b.prism(turn([W(r0 + 0.3, a), W(r1 - 0.3, a), W(r1 - 0.3, a + da), W(r0 + 0.3, a + da)]), 0, 0.26, {});
      hedge(W(r0 + 0.2, a), W(r0 + 0.2, a + da), 0.5, 0.55); hedge(W(r1 - 0.2, a), W(r1 - 0.2, a + da), 0.5, 0.55);
    }
    for (const a of [a0, a1]) { hedge(W(r0, a), W(r1, a), 0.5, 0.55); for (const r of [r0 + 0.2, r1 - 0.2]) ball(W(r, a), 0.5, 0.62); }
    // the low lamps: a white post 1.15 m tall, one lamp at its head
    for (const [r, a] of [[r0 - 0.45, a0 + 2.5], [r0 - 0.45, a1 - 2.5], [r1 + 0.55, (a0 + a1) / 2]]) {
      const p = W(r, a); mem(I, [p[0], 0, p[1]], [p[0], 1.15, p[1]], 0.1, 0.1); lamp(I, [p[0], 1.32, p[1]], 1.2, 0, -1, 0);
    }
  }
  b.flood(0);
}

// the seam's and the fair's ground dress: the stone kerb and its gas standards, clipped hedges, the beds' earth
// and edging, ivy on the lower trestle bents (the ivy's leaves are the world's flora; here only where it grows)
export function* dressInto(b, P, I) {
  const D = P.dress, T = P.track, o = {};
  b.surf(SURF.MASONRY, 0, 0.5).col(COL.marble, 0.85, 1);
  for (let z = 186; z > -190; z -= 31.5) { const a = P.at(7.0, 0, z), q = P.at(7.5, 0.32, z - 31); b.box(Math.min(a[0], q[0]), 0, q[2], Math.max(a[0], q[0]), 0.32, a[2], { m: 1 }); }
  // THE LEFT STREET'S KERB: where the west row has gone its street is left. A kerb of stone in lengths
  // of 1.8 m along the pavement's edge, 5.6 m west of the line, from the square to the plots' head; dropped for
  // 5 m where the wagons came out of each lot and of the palace's yard, and before the half palace's steps
  { const Bs = P.stone, Y = Bs.yard, outs = Bs.gone.map((q) => q.z + 3).concat(Bs.plots.filter((q) => q.d < P.DS).map((q) => q.z + 3), [(Y.z0 + Y.z1) / 2]);
    // THE STREET'S HEAD: that kerb runs on to the head (P.streetHead: where the flags end
    // and the lane begins); an east kerb stands along the head's last 13 m, 7.5 m east of the line; and both turn
    // outward at the head in a return of two lengths, across the pavement's end. Beyond them lie the verges.
    const zh = P.streetHead, kerb = (d0, z0, d1, z1) => { const a = P.at(d0, 0, z0), q = P.at(d1, 0.17, z1); b.box(Math.min(a[0], q[0]), 0, a[2], Math.max(a[0], q[0]), 0.17, q[2], { m: 1 }); };
    let zl = Bs.sqN + 1;
    for (; zl < zh - 1.8; zl += 1.85) {
      if (outs.some((oz) => Math.abs(zl + 0.9 - oz) < 2.5) || Math.abs(zl + 0.9 - Bs.down.z) < 8.6) continue;
      kerb(P.DS - 5.75, zl, P.DS - 5.45, zl + 1.8);
    }
    if (zh - zl > 0.1) kerb(P.DS - 5.75, zl, P.DS - 5.45, zh);
    for (let k = 1; k <= 7; k++) kerb(P.DS + 7.5, zh - 1.85 * k, P.DS + 7.8, zh - 1.85 * k + 1.8);
    for (let k = 0; k < 2; k++) { kerb(P.DS - 5.8 - 1.85 * (k + 1), zh - 0.3, P.DS - 5.8 - 1.85 * k, zh); kerb(P.DS + 7.85 + 1.85 * k, zh - 0.3, P.DS + 7.85 + 1.85 * (k + 1), zh); } }
  for (const g of D.gas) {
    const p = P.at(g.d, 0, g.z);
    // (each standard of the stone half stands on a small skid of its own: two timbers, two iron runners)
    // (two pale balks, two pale runners and a block of stone for its foot: no dark sledge)
    for (const dz of [-0.55, 0.55]) I.sleepers.push([p[0], 0.16, p[2] + dz, 0, 1.7, 0.3, 0.3, 1.0, 1]);
    b.tr(p[0], 0.5, p[2], 0);
    b.flood(0.9, 0.5, 4); for (const sx of [-0.4, 0.4]) bearerInto(b, [sx, -0.09, -0.95], [sx, -0.09, 0.95], 0.16, 0.2);
    b.surf(SURF.MASONRY, 0, 0.5).col(mul(COL.marble, 0.84), 0.85, 1); b.cbox(0, 0, 0, 1.0, 0.42, 1.0, { m: 1 }); b.flood(0);
    b.surf(SURF.STEEL).col(COL.green, 0.8, 1.1); b.cyl(0, 0, 0, 0.2, 0.14, 1.0, 8); b.cyl(0, 1.0, 0, 0.08, 0.06, 3.0, 6); b.beam([-0.5, 3.6, 0], [0.5, 3.6, 0], 0.06, 0.06);
    b.cbox(0, 3.9, 0, 0.34, 0.1, 0.34, { bottom: true }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam([sx * 0.15, 4.0, sz * 0.15], [sx * 0.26, 4.62, sz * 0.26], 0.04, 0.04);
    b.frustum(0, 0, 0.62, 0.62, 0.1, 0.1, 4.62, 4.92, { bottom: true });
    // (the mantle's glass: it glows by the hour's law, like every lamp's)
    b.flood(3, 5, 2).surf(SURF.PLAIN).col([0.95, 0.92, 0.66], 1, 1).cbox(0, 4.02, 0, 0.36, 0.58, 0.36, {}); b.flood(0);
    b.pop();
    lamp(I, [p[0], 4.8, p[2]], 1.9, 0, -1, 3);
    I.shadows.push({ kind: 'pole', p: [p[0], 0, p[2]], h: 5.3, w: 0.5 });
  }
  yield;
  // THE HEDGES ARE CLIPPED TO A FORM: battered sides (broad at the foot, narrower at the top) under a paler top;
  // a short one by the seam walk ends in a clipped ball at each end, a long boundary one has a taller square pier
  // every 13 m or so and at its ends
  for (const h of D.hedges) {
    const cx = P.X(h.d), alongD = h.w > h.len, L = alongD ? h.w : h.len;
    b.surf(SURF.PLAIN).col(COL.moss, 0.55, 1.12);
    b.frustum(cx, h.z, h.w, h.len, alongD ? h.w : h.w * 0.6, alongD ? h.len * 0.6 : h.len, 0, h.h, { capColor: mul(COL.moss, 1.32) });
    if (!h.edge) for (const sg of [-1, 1]) { b.col(mul(COL.moss, 1.1), 0.6, 1.2); b.sphere(cx, h.h + 0.2, h.z + sg * (h.len / 2 - 0.55), 0.82, 7, 5); }
    else {
      const n = Math.max(1, Math.round(L / 13));
      for (let i = 0; i <= n; i++) { const o = lerp(-L / 2 + 0.6, L / 2 - 0.6, i / n); b.col(mul(COL.moss, 1.05), 0.55, 1.15); b.frustum(alongD ? cx + o : cx, alongD ? h.z : h.z + o, 2.3, 2.3, 1.5, 1.5, 0, h.h + 0.75, { capColor: mul(COL.moss, 1.35) }); }
    }
    I.shadows.push({ kind: 'box', d: h.d, z: h.z, face: Math.PI / 2, hw: h.w / 2, hd: h.len / 2, h: h.h });
    // (A THICK HEDGE IS LEAF, NOT A BOX: within 36 m of the line the kit's own bushes stand close along
    // its top, and on the east hedge's face toward the lane; they are the world's flora, like the ivy)
    if (h.thick) for (let o = -L / 2 + 0.7, k = 0; o < L / 2 - 0.5; o += 1.15, k++) {
      const d = alongD ? h.d + o : h.d, z = alongD ? h.z : h.z + o;
      if (P.gapXZ(P.X(d), z, 38).dist > 36) continue;
      I.ivy.push([P.X(d), h.h + 0.05, z, 1.0 + 0.16 * Math.sin(k * 2.7)]);
      if (!alongD) I.ivy.push([P.X(d + 0.85), 1.05, z + 0.55, 0.95 + 0.1 * Math.sin(k * 1.9)]);
    }
  }
  // (the older beds first, then the later ones: D.bedsNew)
  for (const q of D.beds.concat(D.bedsNew)) {
    const p = P.at(q.d, 0, q.z), poly = [], poly2 = [];
    for (let k = 0; k < 14; k++) { const a = -k / 14 * TAU; poly.push([p[0] + q.rx * Math.cos(a), p[2] + q.rz * Math.sin(a)]); poly2.push([p[0] + (q.rx + 0.3) * Math.cos(a), p[2] + (q.rz + 0.3) * Math.sin(a)]); }
    b.surf(SURF.MASONRY, 0, 0.3).col(COL.brick, 0.9, 1); b.prism(poly2, 0, 0.22, {});
    b.surf(SURF.PLAIN).col([0.07, 0.045, 0.03], 1, 1); b.prism(poly, 0.2, 0.3, {});
  }
  yield;
  // ivy: on the lower third of the lower bents, most of them
  for (let i = 0; i < T.bents.length; i++) {
    const A = bentAt(P, T.bents[i].s, o); if (A.y > 15 || (i * 7 + P.seed) % 5 === 0) continue;
    for (const sg of [-1, 1]) for (let k = 0; k < 2; k++) { const p = A.at(sg, 0.7 + k * 1.7); I.ivy.push([p[0], p[1], p[2], 1.7 - k * 0.3]); }
  }
}
// THE LATE MAKERS (seamInto, streetInto) are built after every older maker but the flags'. Whatever they push
// into a list of instanced things comes AFTER every older thing of that list, so that no older thing's die is
// dealt anew (the timbers', cribs' and members' tones are dealt in their lists' order); and THEIR LAMPS GO TO A
// LIST OF THEIR OWN (I.lampsLate), which the lamps' field takes last of all. `late` lends that list to an
// older maker's code (a booth, a festoon, a lantern) for as long as it runs.
function late(I, fn) { const keep = I.lamps; I.lamps = I.lampsLate; try { fn(); } finally { I.lamps = keep; } }
// THE FAIR'S LIT EDGE ALONG THE SEAM (planSeam): its two booths; the four tall white masts before the swing
// boats, a lamp and a long pennant at each head; the rings of lamps round the limes' crowns and the festoons from
// tree to tree and from mast to mast, in the deep chase. (The tall limes themselves are the world's: a set of
// their own.)
export function* seamInto(b, P, I) {
  const Sm = P.dress.seam;
  for (const q of Sm.booths) { late(I, () => boothInto(b, P, I, q)); yield; }
  late(I, () => {
    for (const q of Sm.masts) {
      const x = P.X(q.d);
      mem(I, [x, 0, q.z], [x, q.h, q.z], 0.24, 0.24); lamp(I, [x, q.h + 0.25, q.z], 1.5, 0, -1, 1);
      I.shadows.push({ kind: 'pole', p: [x, 0, q.z], h: q.h, w: 0.5 });
      I.flags.push({ p: [x, q.h + 0.4, q.z], len: 4.6, h: 1.3, pole: 2.4, col: q.col, pennant: true });
    }
    // (the band's own lamps run in THE DEEP CHASE: a place of 4 to 5, see the lamps' field; each ring and each
    // swag starts its run at a place of its own, by its number in its list: no two run in step)
    let j = 0;
    for (const q of Sm.rings) {
      const x = P.X(q.d), ph = (j++ * 0.37) % 1;
      for (let k = 0; k < q.n; k++) { const a = q.ph + k / q.n * TAU; lamp(I, [x + q.r * Math.cos(a), q.y, q.z + q.r * Math.sin(a)], 1.6, 0, 4 + (k / q.n + ph) % 1, k % 4 === 0 ? 1 : 0); }
    }
    for (const s of Sm.swags) {
      const at = (t) => [P.X(lerp(s.a[0], s.b[0], t)), lerp(s.ya, s.yb, t) - s.sag * Math.sin(Math.PI * t), lerp(s.a[1], s.b[1], t)], ph = (j++ * 0.37) % 1;
      for (let k = 0; k < 2; k++) mem(I, at(k / 2), at((k + 1) / 2), 0.06, 0.06);
      for (let k = 1; k <= s.n; k++) { const t = k / (s.n + 1); lamp(I, at(t), 1.5, 0, 4 + (t * 0.5 + ph) % 1, k % 4 === 0 ? 1 : 0); }
    }
  });
}
// ONE OF THE TOWN'S OWN PIECES ON CRIBS (planStreet: pieces), standing on the floor of an emptied lot in its own
// frame (its length along the street; sx: the hand toward the street), washed by its one lantern:
//   0 A COLUMN'S TWO DRUMS IN CRADLES, lying in file on two long balks, fluted, each joint's sawn bed and dowel
//     hole showing; 1 A LENGTH OF THE FRONTS' CORNICE, dentils up, AND A LENGTH OF THEIR BALUSTRADE on edge, side
//     by side on two bearers; 2 A GLAZED WINDOW IN ITS STONE FRAME, upright on bearers, its glass toward the
//     street, its hood and sill on it, two raking props behind; 3 A SMALL COPPER CUPOLA whole on its low stone
//     drum, on bearers. Each weathered like the fronts (stoneOf); each with a storm lantern on a crook beside it.
function pieceInto(b, P, I, q) {
  const x = P.X(q.d), sx = P.hand, st = stoneOf(q.tint), m = new THREE.Matrix4();
  const balk = (x0, z0, x1, z1, h = 0.28) => { b.surf(SURF.PLANKS).col(mul(COL.timber, 1.02), 0.85, 1.05); b.box(x0, 0, z0, x1, h, z1, {}); };
  b.tr(x, 0, q.z, 0);
  b.flood(0.8, 1, 2.6);
  if (q.kind === 0) {
    const r = 0.9, len = 2.3, y = 0.28 + 0.3 + r;
    for (const sg of [-1, 1]) balk(sg * 0.75 - 0.15, -2.75, sg * 0.75 + 0.15, 2.75);
    for (let i = 0; i < 2; i++) {
      const z = -2.6 + i * 2.9;
      b.push(m.makeRotationX(Math.PI / 2).setPosition(0, y, z));
      b.surf(SURF.FLUTED, 0, 1).col(st, 0.92, 1.04); b.lathe(0, 0, 0, [[r, 0], [r, len]], 12, { smooth: true, uvBand: [20, 0, 1] });
      b.surf(SURF.PLAIN).col(mul(st, 0.84), 1, 1); b.disc(0, len, 0, r * 0.97, 12); b.disc(0, 0, 0, r * 0.97, 12, false);
      b.col([0.05, 0.05, 0.06], 1, 1); b.disc(0, len + 0.01, 0, 0.16, 6); b.disc(0, -0.01, 0, 0.16, 6, false);
      b.pop();
      b.surf(SURF.PLANKS).col(COL.timber, 0.85, 1.05);
      for (const dz of [0.5, len - 0.5]) { b.cbox(0, 0.28, z + dz, 2.5, 0.3, 0.3, {}); for (const e of [-1, 1]) b.frustum(e * 0.92, z + dz, 0.7, 0.3, 0.2, 0.3, 0.58, 1.1, {}); }
    }
  } else if (q.kind === 1) {
    for (const z of [-1.7, 1.7]) balk(-1.6, z - 0.15, 1.6, z + 0.15, 0.26);
    corniceLen(b, st, -sx * 0.6, 0.26, -2.5, 2.5); balLen(b, st, sx * 0.85, 0.26, -2.4, 2.4);
  } else if (q.kind === 2) {
    const y0 = 0.3, w = 3.0, h = 4.2, xf = sx * 0.3, xb = xf - sx * 0.5;
    for (const z of [-1.1, 1.1]) balk(-1.7, z - 0.2, 1.7, z + 0.2, 0.3);
    b.surf(SURF.WINDOW, (0.35 + q.tint) % 1, 0).col(st, 0.92, 1.02);
    if (sx > 0) b.wall(xf, w / 2, xf, -w / 2, y0, y0 + h, { cellW: w, cellH: h }); else b.wall(xf, -w / 2, xf, w / 2, y0, y0 + h, { cellW: w, cellH: h });
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.9), 0.9, 1); b.box(Math.min(xb, xf - sx * 0.02), y0, -w / 2, Math.max(xb, xf - sx * 0.02), y0 + h, w / 2, { m: 1, capColor: mul(st, 1.05) });
    b.surf(SURF.PLAIN).col(mul(st, 1.08), 0.85, 1);
    b.box(Math.min(xf, xf + sx * 0.3), y0 + h * 0.82, -w * 0.37, Math.max(xf, xf + sx * 0.3), y0 + h * 0.82 + 0.24, w * 0.37, { bottom: true });
    b.box(Math.min(xf, xf + sx * 0.22), y0 + h * 0.2 - 0.16, -w * 0.34, Math.max(xf, xf + sx * 0.22), y0 + h * 0.2, w * 0.34, { bottom: true });
    b.surf(SURF.PLANKS).col(COL.timber, 0.82, 1.05);
    for (const dz of [-1.0, 1.0]) b.beam([xb, y0 + h * 0.68, dz], [-sx * 1.6, 0.12, dz], 0.16, 0.18);
  } else {
    const R = 1.25, y1 = 0.28 + 0.5, prof = [], ae = Math.PI / 2 * 0.92;
    for (const z of [-0.8, 0.8]) balk(-1.6, z - 0.15, 1.6, z + 0.15);
    b.surf(SURF.MASONRY, 0, 0.6).col(mul(st, 0.95), 0.88, 1.02); b.lathe(0, 0.28, 0, [[R + 0.08, 0], [R + 0.08, 0.5]], 10, { m: 1 });
    b.surf(SURF.PLAIN).col(mul(st, 1.07), 0.85, 1); b.lathe(0, y1, 0, [[R + 0.08, 0], [R + 0.24, 0.08], [R + 0.24, 0.22], [R, 0.27]], 10);
    for (let i = 0; i <= 5; i++) { const a = i / 5 * ae; prof.push([R * Math.cos(a) + 0.01, R * 1.05 * Math.sin(a)]); }
    b.surf(SURF.STEEL).col(COL.copper, 0.85, 1.12); b.lathe(0, y1 + 0.27, 0, prof, 10, { smooth: true });
    b.col(mul(COL.copper, 0.7), 0.9, 1.1); b.lathe(0, y1 + 0.23 + R * 1.05 * Math.sin(ae), 0, [[0.24, 0], [0.3, 0.12], [0.1, 0.34], [0.14, 0.5], [0.01, 0.78]], 6, { smooth: true });
  }
  b.flood(0);
  b.pop();
  lanternCrook(b, I, x + sx * 2.3, q.z + 1.7, -sx * 0.3, 0);
}
// THE STREET'S OWN LEFT THINGS AND THE TOWN'S PIECES ON CRIBS (planStreet): a late maker; its lamps go to the
// late list, its solids to the builder.
export function* streetInto(b, P, I) {
  const St = P.dress.street, ks = stoneOf(0.3);
  for (const q of St.pieces) { late(I, () => pieceInto(b, P, I, q)); yield; }
  // the tubs (old dark green paint, a clipped ball of box in each), the bollards, the dry trough, the bench
  for (const q of St.tubs) {
    const x = P.X(q.d);
    b.flood(0.4, 0.5, 1.6); b.surf(SURF.LACQUER).col(mul(COL.green, 1.5), 0.85, 1.04); b.cbox(x, 0, q.z, 0.86, 0.6, 0.86, { capColor: [0.1, 0.07, 0.05] });
    b.surf(SURF.PLAIN).col(mul(mix3(COL.moss, COL.turf, 0.5), 1.3), 0.72, 1.15); b.sphere(x, 1.08, q.z, 0.56, 7, 5);
  }
  b.flood(0); b.surf(SURF.MASONRY, 0, 0.5);
  for (const q of St.bollards) { const x = P.X(q.d); b.col(mul(ks, 0.8), 0.85, 1); b.cyl(x, 0, q.z, 0.21, 0.17, 0.8, 8, { cap: false }); b.cbox(x, 0.8, q.z, 0.46, 0.1, 0.46, { capColor: mul(ks, 0.9) }); }
  if (St.trough) {
    const x = P.X(St.trough.d), z = St.trough.z, dk = mul(ks, 0.3);
    b.col(mul(ks, 0.76), 0.85, 1);
    for (const dz of [-0.9, 0.9]) b.cbox(x, 0, z + dz, 0.7, 0.22, 0.4, {});
    b.box(x - 0.45, 0.22, z - 1.3, x + 0.45, 0.4, z + 1.3, { bottom: true, capColor: dk });
    for (const e of [-1, 1]) b.box(Math.min(x + e * 0.45, x + e * 0.33), 0.4, z - 1.3, Math.max(x + e * 0.45, x + e * 0.33), 0.82, z + 1.3, { capColor: mul(ks, 0.9) });
    for (const e of [-1, 1]) b.box(x - 0.33, 0.4, Math.min(z + e * 1.3, z + e * 1.17), x + 0.33, 0.82, Math.max(z + e * 1.3, z + e * 1.17), { capColor: mul(ks, 0.9) });
  }
  for (const q of St.benches) {
    const x = P.X(q.d);
    b.col(mul(ks, 0.78), 0.85, 1); for (const dz of [-0.8, 0.8]) b.cbox(x, 0, q.z + dz, 0.44, 0.42, 0.3, {});
    b.box(x - 0.27, 0.42, q.z - 1.1, x + 0.27, 0.56, q.z + 1.1, { bottom: true, capColor: mul(ks, 0.92) });
  }
  yield;
  // the lantern flames under the fronts (no body: they hang behind the sill) and the door lanterns on brackets
  late(I, () => {
    for (const p of St.under) lantern(I, p, false);
    b.flood(0); b.surf(SURF.STEEL).col(mul(COL.iron, 1.5), 1, 1.2);
    for (const q of St.doors) { b.beam(q.a, q.b, 0.06, 0.06); lantern(I, [q.b[0], q.b[1] - 0.03, q.b[2]], true); }
  });
}
// every flag and pennant, flying downwind from its pole by the one wind (built last, into the cloth).
// THE RULE OF THE FLAGS: each is ONE plain field of one colour, a pennant or a plain oblong: the fair's in one of
// its four accents, the stone half's in slate or copper green (f.rgb); this maker has no way to draw a band, a
// cross, a disc or two colours on one cloth, so the rule holds for every seed and every deal.
export function flagsInto(b, P, I) {
  const c = I.cloth, wx = Math.cos(P.windA), wz = Math.sin(P.windA), acc = COL.accents;
  for (const f of I.flags) {
    const top = [f.p[0], f.p[1] + f.pole, f.p[2]], col = f.rgb || acc[f.col % 4];
    if (f.pole > 0.5) { b.surf(SURF.PLANKS).col(COL.white, 0.9, 1.05); b.beam(f.p, top, 0.14, 0.14); }
    cloth(c, 7, (f.p[0] * 0.17 + f.p[2] * 0.11) % 1, f.h * 0.22);
    sheet(c, 8, 2, (u, w) => { const hh = f.pennant ? f.h * (1 - u * 0.92) : f.h; return [top[0] + wx * u * f.len, top[1] - (f.h - hh) * 0.5 - w * hh - u * u * f.len * 0.14, top[2] + wz * u * f.len]; },
      (u, w) => u, (u, w) => u * f.len * 1.6 + w * 0.6, () => col);
  }
}

// ---------------------------------------------------------------- everything standing, in the order it is built
// b takes the stone and the fair's solids, I the lists of instanced things and the cloth. The same generator is
// replayed under node for the counts; it yields between pieces so that no step of the build is long.
// THE PLAIN'S OWN DRESS (R5, G2). By the carters' lane: grey field stones on its verges (no stack, no peg). Far
// out: the hedgerow trees along the fields' hedge lines,
// dark lumps 380 to 1,700 m from the world's middle, none within 45 m of the far road (so none behind the entry).
export function* plainInto(b, P, I) {
  const r = makeRng(hashSeed('half-city-of-the-fair:plain:' + P.seed));
  // (no stack of spare sleepers and no peg stands by the lane. The six places' dice are still drawn, so
  // that the far trees' own dice are what they were)
  for (let k = 0; k < 6; k++) { r.range(0, 2); r.range(-3, 3); r.range(-0.3, 0.3); r.int(3, 5); }
  // STONES ON THE LANE'S VERGES: some forty grey field stones, a hand to a forearm across, half sunk, on both
  // verges from the ruts' shoulders to 8.6 m off the lane's middle; none within the close's hedge (the lane's
  // own stream: every stone's dice are drawn before the hedge's rule decides)
  const rl = P.R.lane, Fo = P.fore;
  b.flood(0).surf(SURF.PLAIN);
  for (let k = 0; k < 90; k++) {
    const z = rl.range(201, 294), sd = rl() < 0.5 ? -1 : 1, off = rl.range(3.1, 8.6), rad = rl.range(0.1, 0.34), tn = rl.range(0.7, 1.05), d = P.laneD(z) + sd * off;
    // (every second stone only, smaller and greyer than first laid: grey field stone, half sunk)
    if (k % 2 || (d < Fo.d1 + 1.6 && z < Fo.z1 + 1.6)) continue;
    b.col(mul(mix3(COL.cement, COL.slate, 0.3), tn * 0.8), 0.7, 1.1); b.sphere(P.X(d), rad * 0.15, z, rad * 0.75, 5, 3, { sy: 0.6 });
  }
  yield;
  const Fd = P.fields || (P.fields = planFields(P));
  b.surf(SURF.PLAIN);
  const lump = (u, v) => {
    const x = u * Fd.ca - v * Fd.sa, z = u * Fd.sa + v * Fd.ca, rr = Math.hypot(x, z), h = r.range(11, 19), w = r.range(7, 12);
    // (none on the city's own ground, within 60 m of the carters' road, on the far cross road or on the meadow by the lane)
    if (rr > 1700 || (Math.abs(x) < 352 && z > -302 && z < 422) || (z > 300 && P.roadDist(P.hand * x, z) < 60) || (Math.abs(z - 950) < 75) || (Math.abs(P.hand * x - 131) < 160 && z > 140 && z < 560)) return;
    b.col(COL.moss, 0.5, 0.8); b.lathe(x, 0, z, [[w * 0.55, 0], [w, h * 0.38], [w * 0.7, h * 0.8], [0.4, h]], 6);
  };
  for (const B of Fd.blocks) {
    if (B.hu) for (let v = B.v0 + r.range(10, 90); v < B.v1; v += r.range(60, 190)) lump(B.u0 + r.range(-2, 2), v);
    if (B.hv) for (let u = B.u0 + r.range(10, 90); u < B.u1; u += r.range(60, 190)) lump(u, B.v0 + r.range(-2, 2));
    yield;
  }
}
export function* buildStone(b, P, I) {
  AFTER = P.hour === 'dusk' ? 1 : 0;
  for (const H of P.stone.houses) if (!H.court) yield* stoneHouseInto(b, P, H, I);
  yield* courtInto(b, P, I);
  yield* palaceDownInto(b, P, I);
  yield* halfFrontInto(b, P, P.stone.half, I);
  obeliskInto(b, P, I); yield;
  yield* hallInto(b, P, I);
  yield* edgeInto(b, P, I);
  yield* plotsInto(b, P, I);
  yield* goneInto(b, P, I);
  yield* plainInto(b, P, I);
  yield* trailersInto(b, P, I);
  yield* caravanInto(b, P, I);
  squareInto(b, P, I);
}
export function* buildTrestle(b, P, I) {
  yield* trestleInto(b, P, I);
  yield* railsInto(b, P, I);
}
export function* buildFair(b, P, I) {
  wheelPartsInto(P, I); yield;
  yield* wheelTowerInto(b, P, I);
  swingInto(b, P, I); yield;
  drumInto(b, P, I); yield;
  yield* tentInto(b, P, I);
  yield* boothsInto(b, P, I);
  yield* pleasureInto(b, P, I);
  boatsInto(b, P, I); yield;
  yield* gardenInto(b, P, I);
  yield* dressInto(b, P, I);
  // (the late makers, after every older one: see `late`)
  yield* seamInto(b, P, I); yield* streetInto(b, P, I);
  flagsInto(b, P, I);
}
export function* buildAll(b, P, I) { yield* buildStone(b, P, I); yield* buildTrestle(b, P, I); yield* buildFair(b, P, I); }

// ---------------------------------------------------------------- the instanced things, made into meshes
const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _c = new THREE.Color();
// the matrix of a member from a to q: the unit box's Z along it, w across (horizontal), h deep
function memberMatrix(k, out) {
  const dx = k[3] - k[0], dy = k[4] - k[1], dz = k[5] - k[2], len = Math.hypot(dx, dy, dz) || 1e-3;
  _z.set(dx / len, dy / len, dz / len);
  if (Math.abs(_z.y) > 0.999) _x.set(1, 0, 0); else _x.set(-_z.z, 0, _z.x).normalize();
  _y.crossVectors(_z, _x);
  out.makeBasis(_x, _y, _z);
  const e = out.elements; e[0] *= k[6]; e[1] *= k[6]; e[2] *= k[6]; e[4] *= k[7]; e[5] *= k[7]; e[6] *= k[7]; e[8] *= len; e[9] *= len; e[10] *= len;
  e[12] = (k[0] + k[3]) / 2; e[13] = (k[1] + k[4]) / 2; e[14] = (k[2] + k[5]) / 2;
  return out;
}
const lin = (c, k = 1) => _c.setRGB(c[0] * k, c[1] * k, c[2] * k);
function membersMesh(geo, mat, list, paint, vary, seed) {
  const n = list.length, mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); mesh.count = n;
  const r = makeRng(hashSeed('half-city-of-the-fair:paint:' + seed));
  for (let i = 0; i < n; i++) { mesh.setMatrixAt(i, memberMatrix(list[i], _m)); mesh.setColorAt(i, lin(paint, 1 - vary * r())); }
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  return mesh;
}
// the standing instances: sleepers, stakes, rings, the trestle's timbers, the tower's and gallery's irons
export function* standingMeshes(P, I, G, mats, group) {
  const fac = mats.facades;
  // sleepers: dark creosoted balks (a box, its length along X at its yaw)
  let n = I.sleepers.length, mesh = new THREE.InstancedMesh(G.timber, fac, Math.max(1, n)); mesh.count = n;
  const r = makeRng(hashSeed('half-city-of-the-fair:sleepers:' + P.seed)), e = new THREE.Euler(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  // (no black box anywhere: an old balk is weathered brown oak)
  const tar = mix3(COL.timber, [0.12, 0.08, 0.05], 0.45);
  // (a sleeper is dark creosoted timber; its pale kind is fresh sawn wood: the spare stacks and the cribs left on emptied lots)
  const pale = mul(mix3(COL.timber, COL.cream, 0.5), 1.25);
  for (let i = 0; i < n; i++) { const k = I.sleepers[i], v = r(); _m.compose(p.set(k[0], k[1], k[2]), q.setFromEuler(e.set(0, k[3] + Math.PI / 2, 0)), s.set(k[6], k[5], k[4])); mesh.setMatrixAt(i, _m); mesh.setColorAt(i, k[8] ? lin(pale, (0.82 + 0.3 * v) * (k[7] || 1)) : lin(tar, (0.8 + 0.5 * v) * (k[7] || 1))); }
  mesh.frustumCulled = false; group.add(mesh);
  yield;
  // the crib stacks under the standing buildings (pale balks with their end grain), and the storm lanterns' bodies
  const rc = makeRng(hashSeed('half-city-of-the-fair:cribs:' + P.seed));
  n = I.cribs.length; mesh = new THREE.InstancedMesh(G.crib, fac, Math.max(1, n)); mesh.count = n;
  for (let i = 0; i < n; i++) { const k = I.cribs[i]; _m.compose(p.set(k[0], k[1], k[2]), q.setFromEuler(e.set(0, k[3] + Math.PI / 2, 0)), s.set(k[6], k[5], k[4])); mesh.setMatrixAt(i, _m); mesh.setColorAt(i, lin(pale, (0.8 + 0.3 * rc()) * (k[7] || 1))); }
  mesh.frustumCulled = false; group.add(mesh);
  n = I.lanterns.length; mesh = new THREE.InstancedMesh(G.lantern, fac, Math.max(1, n)); mesh.count = n;
  for (let i = 0; i < n; i++) { const k = I.lanterns[i]; _m.makeTranslation(k[0], k[1], k[2]); mesh.setMatrixAt(i, _m); }
  mesh.frustumCulled = false; group.add(mesh);
  yield;
  n = I.pegs.length; mesh = new THREE.InstancedMesh(G.stake, fac, Math.max(1, n)); mesh.count = n;
  for (let i = 0; i < n; i++) { const k = I.pegs[i]; _m.makeScale(1, k[3] / 1.1, 1).setPosition(k[0], k[1], k[2]); mesh.setMatrixAt(i, _m); }
  mesh.frustumCulled = false; group.add(mesh);
  // the lifting eyes, at their own size: only those within 48 m in plan of one of the line's coarse knots (one
  // every 10 m) are drawn: a rule by place, the same for every lens
  const coarse = []; for (let i = 0; i < P.n; i += 20) coarse.push(P.line[i * 3], P.line[i * 3 + 2]);
  const near = I.rings.filter((k) => { for (let i = 0; i < coarse.length; i += 2) if (Math.hypot(coarse[i] - k[0], coarse[i + 1] - k[2]) < 48) return true; return false; });
  n = near.length; mesh = new THREE.InstancedMesh(G.ring, fac, Math.max(1, n)); mesh.count = n;
  for (let i = 0; i < n; i++) { const k = near[i]; _m.makeRotationY(k[3]).setPosition(k[0], k[1], k[2]); mesh.setMatrixAt(i, _m); }
  mesh.frustumCulled = false; group.add(mesh); I.ringsDrawn = n;
  yield;
  group.add(membersMesh(G.timberLit, fac, I.members, COL.white, 0.1, P.seed));
  yield;
  group.add(membersMesh(G.iron, fac, I.irons, mix3(COL.green, COL.cream, 0.12), 0.12, P.seed + 1));
}

// THE MOVERS' MESHES. Everything here is made once; move(t) only places what was made, from the laws at the head
// of this file (the world's clock t and the plan's numbers: nothing else comes in).
export function makeMovers(P, I, G, mats, group) {
  const fac = mats.facades, W = P.wheel, S = P.swing, T = P.track, acc = COL.accents, o = {};
  const r = makeRng(hashSeed('half-city-of-the-fair:movers:' + P.seed));
  // the wheel: a frame at the hub whose X lies along the wheel's plane; inside it the turning part
  const frame = new THREE.Group(); frame.position.set(W.c[0], W.c[1], W.c[2]); frame.rotation.y = Math.atan2(-W.ez, W.ex); frame.updateMatrix(); frame.matrixAutoUpdate = false;
  const turning = new THREE.Group(); turning.matrixAutoUpdate = false; frame.add(turning);
  turning.add(membersMesh(G.iron, fac, I.wheelIrons, mix3(COL.cream, COL.white, 0.5), 0.08, P.seed + 2));
  // (the cages' paints, by turns: cream, garden green, straw, cream, pale green, sand; none red, none dark)
  const cages = new THREE.InstancedMesh(G.cage, fac, W.nc), CP = [COL.cream, hex('#5c9468'), hex('#e4d9a8'), COL.cream, hex('#86b38c'), hex('#d9c7a0')]; cages.frustumCulled = false; frame.add(cages);
  for (let i = 0; i < W.nc; i++) cages.setColorAt(i, lin(CP[i % 6], 0.92 + 0.16 * r()));
  group.add(frame);
  // the trains' cars
  const nc = T.nTrains * T.nCars, cars = new THREE.InstancedMesh(G.car, fac, nc); cars.frustumCulled = false; group.add(cars);
  for (let k = 0; k < T.nTrains; k++) for (let j = 0; j < T.nCars; j++) cars.setColorAt(k * T.nCars + j, lin(acc[k % 3], j === 0 ? 1.1 : 0.95));
  // the swing's seats on their chains, and its crown
  const seats = new THREE.InstancedMesh(G.seat, fac, S.n); seats.frustumCulled = false; group.add(seats);
  for (let i = 0; i < S.n; i++) seats.setColorAt(i, lin(acc[i % 4], 1));
  const crown = new THREE.Mesh(G.crown, fac); crown.frustumCulled = false; crown.matrixAutoUpdate = false; group.add(crown);
  // the trapezes: a bar on two ropes, the unit iron drawn thin
  const tp = P.tent.traps, traps = new THREE.InstancedMesh(G.iron, fac, tp.length * 3); traps.frustumCulled = false; group.add(traps);
  for (let i = 0; i < tp.length * 3; i++) traps.setColorAt(i, i % 3 === 2 ? lin(COL.accents[1], 2.2) : lin(COL.white, 1.8));
  // the swing boats: every boat of both rows, each at its own pivot on its row's beam, turned to its row's heading
  const bn = P.boats.reduce((a, row) => a + row.n, 0), boats = new THREE.InstancedMesh(G.boat, fac, bn), boatBase = [], rz = new THREE.Matrix4(); boats.frustumCulled = false; group.add(boats);
  P.boats.forEach((row, ri) => row.pivots.forEach((pv, i) => { boatBase.push({ ri, i, m: new THREE.Matrix4().makeRotationY(row.F.yaw).scale(new THREE.Vector3(row.sc, row.sc, row.sc)).setPosition(pv[0], pv[1], pv[2]) }); boats.setColorAt(boatBase.length - 1, lin(acc[row.b[i].col % 3], 0.95)); }));
  const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), ax = new THREE.Vector3(), seg = [0, 0, 0, 0, 0, 0, 0.07, 0.07];
  const wheelM = new THREE.Matrix4(), crownM = new THREE.Matrix4(), tyaw = P.tent.F.yaw, tcx = Math.cos(tyaw), tsx = Math.sin(tyaw);
  // the middle of each trapeze's bar at the clock: the lamps under the bars take it
  const trapP = [0, 1, 2, 3].map(() => new THREE.Vector3());
  function move(t) {
    // the wheel and its cages
    const a = wheelAngle(P, t);
    turning.matrix.makeRotationZ(a); turning.matrixWorldNeedsUpdate = true;
    wheelM.multiplyMatrices(frame.matrix, turning.matrix);
    for (let i = 0; i < W.nc; i++) { cagePose(P, i, t, o); const ai = a + i * TAU / W.nc; _m.makeRotationZ(o.rock).setPosition(W.R * Math.cos(ai), W.R * Math.sin(ai), 0); cages.setMatrixAt(i, _m); }
    cages.instanceMatrix.needsUpdate = true;
    // the trains: every car on the track's own line, its floor on the banked rails
    for (let k = 0; k < T.nTrains; k++) { const s0 = trainS(P, k, t); for (let j = 0; j < T.nCars; j++) {
      trackAt(P, s0 - j * T.pitch, o);
      _y.set(o.ux, o.uy, o.uz); _z.set(o.tx, o.ty, o.tz); _x.crossVectors(_y, _z).normalize(); _y.crossVectors(_z, _x);
      _m.makeBasis(_x, _y, _z).setPosition(o.x + o.ux * 0.1, o.y + o.uy * 0.1, o.z + o.uz * 0.1); cars.setMatrixAt(k * T.nCars + j, _m);
    } }
    cars.instanceMatrix.needsUpdate = true;
    // the swing: the crown turns and tilts, each seat's chains lie from its pivot to its seat
    const sa = swingAngle(P, t), wa = S.w0 + S.waveRate * t;
    q.setFromAxisAngle(ax.set(-Math.sin(wa), 0, Math.cos(wa)), S.tilt); q2.setFromAxisAngle(ax.set(0, 1, 0), -sa); q.multiply(q2);
    crown.matrix.compose(p.set(S.c[0], S.crownY, S.c[2]), q, one); crown.matrixWorldNeedsUpdate = true; crownM.copy(crown.matrix);
    for (let i = 0; i < S.n; i++) {
      swingPose(P, i, t, o);
      _y.set(o.px - o.x, o.py - o.y, o.pz - o.z).normalize(); _z.set(-o.sa, 0, o.ca); _x.crossVectors(_y, _z).normalize(); _z.crossVectors(_x, _y);
      _m.makeBasis(_x, _y, _z).setPosition(o.px, o.py, o.pz); seats.setMatrixAt(i, _m);
    }
    seats.instanceMatrix.needsUpdate = true;
    // the trapezes: two ropes and a bar, swung along the tent's long axis
    for (let i = 0; i < tp.length; i++) {
      const g = trapezeAngle(P, i, t), pv = P.tent.pivots[i], L = tp[i].len, sx = Math.sin(g) * L, dy = -Math.cos(g) * L;
      const bx = pv[0] + tcx * sx, bz = pv[2] - tsx * sx, by = pv[1] + dy;
      trapP[i].set(bx, by, bz);
      for (let k = 0; k < 2; k++) { const dzl = k ? 1.1 : -1.1; seg[0] = pv[0] + tsx * dzl; seg[1] = pv[1]; seg[2] = pv[2] + tcx * dzl; seg[3] = bx + tsx * dzl; seg[4] = by; seg[5] = bz + tcx * dzl; seg[6] = seg[7] = 0.16; traps.setMatrixAt(i * 3 + k, memberMatrix(seg, _m)); }
      seg[0] = bx - tsx * 1.3; seg[1] = by; seg[2] = bz - tcx * 1.3; seg[3] = bx + tsx * 1.3; seg[4] = by; seg[5] = bz + tcx * 1.3; seg[6] = seg[7] = 0.26; traps.setMatrixAt(i * 3 + 2, memberMatrix(seg, _m));
    }
    traps.instanceMatrix.needsUpdate = true;
    // the swing boats: each swings about its beam on its own phase (boatAngle)
    for (let k = 0; k < boatBase.length; k++) { const B = boatBase[k]; _m.multiplyMatrices(B.m, rz.makeRotationZ(boatAngle(P, B.ri, B.i, t))); boats.setMatrixAt(k, _m); }
    boats.instanceMatrix.needsUpdate = true;
  }
  return { move, wheelM, crownM, trapP };
}

// ---------------------------------------------------------------- the lamps: small sharp points with a little glow
// One draw call of instanced sprites (no real light). A lamp of kind 1 goes round with the wheel, of kind 2 with
// the swing's crown (the two matrices come from the movers), of kind 3 to 6 with a trapeze's bar (its middle's
// place comes from the movers). uOn is the hour's (by day the lamps are out); the chase and the flicker run on the
// world's clock.
export function makeLampField(P, I, hour) {
  // (the late makers' lamps last of all: every older lamp keeps its place in the field and its own die)
  const all = I.lamps.concat(I.wheelLamps, I.crownLamps, I.trapLamps, I.lampsLate), n = all.length;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const a = new Float32Array(n * 4), c = new Float32Array(n * 4), r = P.R.lamps;
  for (let i = 0; i < n; i++) { const k = all[i]; a[i * 4] = k[0]; a[i * 4 + 1] = k[1]; a[i * 4 + 2] = k[2]; a[i * 4 + 3] = k[3]; c[i * 4] = k[4]; c[i * 4 + 1] = k[5]; c[i * 4 + 2] = k[6]; c[i * 4 + 3] = r(); }
  g.setAttribute('la', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('lb', new THREE.InstancedBufferAttribute(c, 4)); g.instanceCount = n;
  const on = hour === 'day' ? 0 : hour === 'dawn' ? 0.8 : 1;
  // (uLan: the storm lanterns' amber; uGas: the gas mantles' pale light; uOwn: a lamp's own brightness)
  const uniforms = { uTime: { value: 0 }, uOn: { value: on }, uVH: { value: 450 }, uWheel: { value: new THREE.Matrix4() }, uCrown: { value: new THREE.Matrix4() }, uA: { value: new THREE.Color().setRGB(COL.lamp[0], COL.lamp[1], COL.lamp[2]) }, uB: { value: new THREE.Color().setRGB(COL.lampCore[0], COL.lampCore[1], COL.lampCore[2]) },
    uLan: { value: new THREE.Color('#ffae5c') }, uGas: { value: new THREE.Color('#f2efbe') }, uOwn: { value: 2.2 }, uFogD: { value: 0.0012 }, uTrap: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 la; attribute vec4 lb;
      uniform float uTime, uOn, uFogD, uVH; uniform mat4 uWheel, uCrown; uniform vec3 uTrap[4];
      varying vec2 vQ; varying float vI; varying float vK; varying float vF;
      void main(){
        vec4 wp = vec4(la.xyz, 1.);
        if (lb.x > 2.5) wp.xyz += uTrap[int(lb.x - 2.5)]; else if (lb.x > 1.5) wp = uCrown * wp; else if (lb.x > .5) wp = uWheel * wp;
        vec4 mv = viewMatrix * wp;
        // the chase: along a rim (0..1) or out along a spoke (2..3); a lamp without a place only flickers a little
        float ch = lb.y, run = 1.;
        if (ch >= 2.) run = .55 + .45 * step(.5, fract(ch - 2. - uTime * .35));
        else if (ch >= 0.) run = .6 + .4 * step(.34, fract(ch * 8. - uTime * .5));
        // (THE DEEP CHASE of the seam's band, a place of 4 to 5: a round of 1 s; three long runs to a ring or
        // a swag, half of its lamps sunk low at any time, so that whole arcs of lamps run round the crowns)
        if (ch >= 4.) run = .14 + .86 * step(.5, fract((ch - 4.) * 3. - uTime));
        float fl = .9 + .1 * sin(uTime * (5. + lb.w * 7.) + lb.w * 60.);
        // a storm lantern or a gas mantle takes no part in a chase and does not flicker: ITS FLAME BREATHES, slowly,
        // by 8 parts in a hundred either way, on a round of 3 to 5 s and a phase of its own (lb.w: the lamp's own die)
        if (lb.z > 1.5) { run = 1.; fl = .92 + .08 * sin(uTime * (1.3 + lb.w * .8) + lb.w * 60.); }
        float dist = -mv.z;
        vK = lb.z;
        // THE LAMPS' FILTER BY A PIXEL'S FOOTPRINT. px: the metres one pixel covers at the lamp (from the projection
        // and the picture's height uVH). A lamp whose own half size is under two pixels is drawn at two pixels and
        // gives NO MORE LIGHT than its own: its brightness is scaled by its own area over the drawn area (vF * vF).
        // The lamp's own brightness is the same at every distance; only the haze takes from it, and that is THE
        // SCENE'S OWN HAZE BY THE SCENE'S OWN FIGURE (uFogD: the scene's density; the kept share is the scene's
        // exp of minus the square of density times depth: 0.79 to 0.88 at 600 m at dusk, as for every other body).
        float own = la.w * .5, px = 2. * dist / (projectionMatrix[1][1] * uVH);
        float sz = max(own, px * 2.);
        vF = own / sz;
        vI = uOn * run * fl * exp(-dist * dist * uFogD * uFogD) * vF * vF;
        sz *= step(.01, uOn);
        mv.xy += position.xy * sz;
        vQ = position.xy;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uA, uB, uLan, uGas; uniform float uOwn; varying vec2 vQ; varying float vI; varying float vK; varying float vF;
      void main(){
        float d = length(vQ); if (d > 1.) discard;
        // a filtered lamp's core is one soft blob: its edge e wider, its height lower by the same areas
        float e = mix(.8, .34, vF), h = .06 + .5 * e;
        float core = (1. - smoothstep(.12, e, d)) * (.0529 / (h * h)), glow = (1. - d); glow *= glow;
        vec3 tint = vK > 2.5 ? uGas : vK > 1.5 ? uLan : mix(uA, uB, vK * .6);
        vec3 col = tint * (core * 3.6 + glow * .8) + vec3(1., .95, .8) * core * 1.4;
        // (uOwn: the lamp's own brightness, the same for every lamp at every distance)
        gl_FragColor = vec4(col * vI * uOwn, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, material, uniforms, count: n };
}

// THE FIREWORKS' SPARKS (planFire): one draw call of instanced points, drawn by the lamps' own filter (a spark
// smaller than two pixels is drawn at two pixels and its light scaled by its own area over the drawn area). Each
// spark's place and light are the law of fireSpark, written here for the vertex: the world's clock (uTime) and
// the plan's numbers only. uOn is the hour's (they burn at dusk and at night; by day and at dawn none is drawn).
// uVH is the lamps' own uniform: the one line that copies the picture's height serves both.
export function makeFireField(P, hour, uVH) {
  const F = P.fire, per = F.trail + F.sparks, n = F.n * per, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const a = new Float32Array(n * 4), c = new Float32Array(n * 4), d = new Float32Array(n * 4);
  for (let k = 0; k < F.n; k++) for (let i = 0; i < per; i++) {
    const q = F.rockets[k], j = (k * per + i) * 4, u = i < F.trail ? [0, 0, 0, 1] : F.dirs[i - F.trail];
    a[j] = P.X(q.d); a[j + 1] = q.z; a[j + 2] = q.h; a[j + 3] = q.R;
    // (the launch's own offset on the loop; the spark's number, negative for the rising head and its tail)
    c[j] = q.sway; c[j + 1] = F.t0 - k * F.period / F.n; c[j + 2] = q.col; c[j + 3] = i < F.trail ? -1 - i : i - F.trail;
    d[j] = u[0]; d[j + 1] = u[1]; d[j + 2] = u[2]; d[j + 3] = u[3];
  }
  g.setAttribute('fa', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('fb', new THREE.InstancedBufferAttribute(c, 4)); g.setAttribute('fc', new THREE.InstancedBufferAttribute(d, 4)); g.instanceCount = n;
  const on = hour === 'dusk' || hour === 'night' ? 1 : 0;
  const uniforms = { uTime: { value: 0 }, uOn: { value: on }, uVH, uFogD: { value: 0.001 }, uRise: { value: F.rise }, uHang: { value: F.hang }, uPeriod: { value: F.period }, uTrail: { value: F.trail },
    uCols: { value: ['#ffd27a', '#ff9a4a', '#fff0d0', '#ff6a4a', '#ffc49a'].map((h) => new THREE.Color(h)) } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 fa; attribute vec4 fb; attribute vec4 fc;
      uniform float uTime, uOn, uFogD, uVH, uRise, uHang, uPeriod, uTrail; uniform vec3 uCols[5];
      varying vec2 vQ; varying float vI; varying float vF; varying vec3 vC;
      void main(){
        float age = mod(uTime + fb.y + uPeriod * 2., uPeriod), light = 0.;
        vec3 wp = vec3(fa.x, 0., fa.y);
        if (fb.w < 0.) {
          // the rising head and its tail: each a little behind the last
          float i = -fb.w - 1., ar = age - i * .07;
          if (ar >= 0. && age <= uRise) { float s = ar / uRise; wp.y = fa.z * (1. - (1. - s) * (1. - s)); wp.x += fb.x * s; light = 1. - i / uTrail; }
        } else {
          // the burst: one plain round that spreads, hangs, falls and fades
          float s = age - uRise;
          if (s >= 0. && s <= uHang) { float e = fa.w * fc.w * (1. - exp(-2.4 * s)); wp += vec3(fb.x + fc.x * e, fa.z + fc.y * e - 1.3 * s * s, fc.z * e); light = pow(1. - s / uHang, 1.5); }
        }
        vec4 mv = viewMatrix * vec4(wp, 1.);
        float dist = -mv.z, own = fb.w < 0. ? .7 : .95, px = 2. * dist / (projectionMatrix[1][1] * uVH);
        // the lamps' filter by a pixel's footprint: never under two pixels, never more light than its own; the
        // scene's own haze by the scene's own figure. A spark is left out only when its own light is out (the
        // hour's uOn, the law's light): nothing here is hidden by the eye's distance.
        float sz = max(own, px * 2.);
        vF = own / sz;
        vI = uOn * light * exp(-dist * dist * uFogD * uFogD) * vF * vF;
        sz *= step(.004, uOn * light);
        mv.xy += position.xy * sz;
        vQ = position.xy; vC = fb.w < 0. ? vec3(1., .82, .55) : uCols[int(fb.z + .5)];
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vI; varying float vF; varying vec3 vC;
      void main(){
        float d = length(vQ); if (d > 1.) discard;
        // (the lamps' own core: a filtered spark's edge e is wider and its height lower by the same areas)
        float e = mix(.8, .34, vF), h = .06 + .5 * e;
        float core = (1. - smoothstep(.12, e, d)) * (.0529 / (h * h)), glow = (1. - d); glow *= glow;
        gl_FragColor = vec4((vC * (core * 2.6 + glow * .7) + vec3(1., .95, .85) * core * .8) * vI * 1.6, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, material, uniforms, count: n };
}

// THE LAMPS' POOLS ON BOARDS: where a lamp stands over a deck that is not the ground (the gallery's), its
// warm pool lies on the boards BY PLACE: a flat fan of two rings, warm at its middle and nothing at its rim, added
// to what is under it. One mesh, one material of its own (freed in dispose); made once, never moved, never
// switched. By day the lamps are out and no pool is made. No light is made.
export function makePoolMesh(P, I, hour) {
  if (hour === 'day' || !I.pools.length) return null;
  const seg = 16, nv = 1 + seg * 2, n = I.pools.length, pos = new Float32Array(n * nv * 3), col = new Float32Array(n * nv * 3), idx = [], k0 = hour === 'dawn' ? 0.6 : 1;
  for (let i = 0; i < n; i++) {
    const q = I.pools[i], v0 = i * nv, put = (j, x, z, s) => { const o = (v0 + j) * 3; pos[o] = x; pos[o + 1] = q[1]; pos[o + 2] = z; col[o] = s; col[o + 1] = s * 0.74; col[o + 2] = s * 0.46; };
    put(0, q[0], q[2], q[4] * k0);
    for (let j = 0; j < seg; j++) {
      const a = j / seg * TAU, ca = Math.cos(a), sa = Math.sin(a), j1 = (j + 1) % seg;
      put(1 + j, q[0] + ca * q[3] * 0.45, q[2] + sa * q[3] * 0.45, q[4] * k0 * 0.5); put(1 + seg + j, q[0] + ca * q[3], q[2] + sa * q[3], 0);
      idx.push(v0, v0 + 1 + j1, v0 + 1 + j, v0 + 1 + j, v0 + 1 + j1, v0 + 1 + seg + j1, v0 + 1 + j, v0 + 1 + seg + j1, v0 + 1 + seg + j);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 1;
  return { mesh, material, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- the cloth's material and the long shadows
// The cloth: a Lambert material whose vertices ride a wave along their normal (see `cloth` above). uTime is the
// world's clock; nothing else moves it.
export function makeClothMaterial(glow) {
  const uniforms = { uTime: { value: 0 }, uGlow: { value: glow } };
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime; sh.uniforms.uGlow = uniforms.uGlow;
    sh.vertexShader = 'attribute vec3 win;\nuniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed = vec3(position);\n transformed += normal * (win.z * uv.x * sin(win.y * 6.2832 + uv.y - uTime * win.x));');
    sh.fragmentShader = 'uniform float uGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * uGlow;');
  };
  mat.customProgramCacheKey = () => 'half-city-cloth';
  return { material: mat, uniforms };
}
// THE GROUND: the plain's own sheet, painted once from above into one picture (an offscreen canvas for a texture):
// turf and worn paths on the fair's side, gravel and paving on the stone side, the carters' road; and over it the
// long shadows of every standing thing, drawn first into a mask of their own (their union: no place is darkened
// twice). sx, sz: the unit toward the light on the ground; el: its height in radians; tint: the shadow's colour (css).
const GX0 = -330, GX1 = 330, GZ0 = -280, GZ1 = 400, GN = 2048;
const newCanvas = (n) => (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(n, n) : Object.assign(document.createElement('canvas'), { width: n, height: n }));
export function* groundSheet(P, I, sx, sz, el, tint, pal) {
  const N = GN, x0 = GX0, x1 = GX1, z0 = GZ0, z1 = GZ1, k = 1 / Math.tan(el), cap = 150;
  const cv = newCanvas(N);
  const g = cv.getContext('2d'), X = (x) => (x - x0) / (x1 - x0) * N, Z = (z) => (z - z0) / (z1 - z0) * N;
  g.fillStyle = '#fff'; g.fillRect(0, 0, N, N); g.fillStyle = tint; g.strokeStyle = tint; g.lineCap = 'round';
  const sh = (p, h) => { const L = Math.min(h * k, cap); return [p[0] - sx * L, p[2] - sz * L]; };
  const hull = (pts) => {
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop(); return lo.concat(up);
  };
  const fill = (pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1])))); g.closePath(); g.fill(); };
  const line = (a, b, w) => { g.lineWidth = Math.max(1, w * N / (x1 - x0)); g.beginPath(); g.moveTo(X(a[0]), Z(a[1])); g.lineTo(X(b[0]), Z(b[1])); g.stroke(); };
  for (const s of I.shadows) {
    if (s.kind === 'box') {
      const F = frameAt(P, s.d, s.z, s.face), pts = [];
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) { const p = F.p(cx * s.hw, 0, cz * s.hd); pts.push(sh(p, s.y0 || 0), sh(p, s.h)); }
      fill(hull(pts));
    } else if (s.kind === 'pole') line([s.p[0], s.p[2]], sh(s.p, s.h), s.w);
    else if (s.kind === 'disc') { const c = sh(s.p, s.h); g.beginPath(); g.ellipse(X(c[0]), Z(c[1]), s.r * N / (x1 - x0), s.r * N / (z1 - z0), 0, 0, TAU); g.fill(); }
  }
  // the trestle: the rails' line and every bent, thrown along the ground
  const T = P.track, o = {}; let prev = null;
  for (let i = 0; i <= 260; i++) { const q = trackAt(P, i / 260 * T.LT, o), c = sh([q.x, 0, q.z], q.y); if (prev) line(prev, c, 2.2); prev = c; }
  for (const B of T.bents) { const q = trackAt(P, B.s, o); line([q.x, q.z], sh([q.x, 0, q.z], q.y), 1.1); }
  // the wheel: its rim's ring (the same at every clock), its tower's legs, the gallery
  const W = P.wheel; prev = null;
  for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, x = W.c[0] + W.R * Math.cos(a) * W.ex, z = W.c[2] + W.R * Math.cos(a) * W.ez, c = sh([x, 0, z], Math.max(0, W.c[1] + W.R * Math.sin(a))); if (prev) line(prev, c, 1.6); prev = c; }
  for (const m of I.irons) if (m[6] > 0.25) line(sh([m[0], 0, m[2]], m[1]), sh([m[3], 0, m[5]], m[4]), m[6] * 2.2);
  if (W.deck) { const D = W.deck, wp = (q, oo) => [W.c[0] + W.ex * q + W.nx * oo, 0, W.c[2] + W.ez * q + W.nz * oo]; fill(hull([sh(wp(D.q0, D.oi), D.y), sh(wp(D.q1, D.oi), D.y), sh(wp(D.q1, D.oo), D.y), sh(wp(D.q0, D.oo), D.y)])); }
  // the trees: a crown's blot and a trunk's line each
  for (const t of P.dress.trees) { const p = [P.X(t.d), 0, t.z], c = sh(p, t.h * 0.62); line([p[0], p[2]], c, 0.8); g.beginPath(); g.ellipse(X(c[0]), Z(c[1]), (t.cr + Math.min(0.2 * t.h * k, 40)) * N / (x1 - x0), t.cr * N / (z1 - z0), Math.atan2(sz, sx), 0, TAU); g.fill(); }
  // (the seam's tall limes, planSeam: the same blot and line, their crowns 0.45 of their height in radius)
  for (const t of P.dress.seam.limes) { const p = [P.X(t.d), 0, t.z], c = sh(p, t.h * 0.62), cr = t.h * 0.45; line([p[0], p[2]], c, 0.8); g.beginPath(); g.ellipse(X(c[0]), Z(c[1]), (cr + Math.min(0.2 * t.h * k, 40)) * N / (x1 - x0), cr * N / (z1 - z0), Math.atan2(sz, sx), 0, TAU); g.fill(); }
  yield;
  const out = yield* paintGround(P, I, cv, pal);
  return out;
}
const css = (c, k = 1) => { _c.setRGB(c[0] * k, c[1] * k, c[2] * k); return '#' + _c.getHexString(); };
// how many times over the ground gives back its second picture (the lamps' pools: see groundSheet)
const POOL = 2.8;
// THE GREEN OF THE LANE: how thickly summer tufts of grass stand at (d, z) by the carters' lane: on its
// grass crown; thick on both verges from the ruts' shoulders to 9 m off its middle, thinning to 34 m; none in
// the ruts, none within the close's hedges or on the gate's apron, none on the first front's swept ground,
// none on the lane across the plots' head
export function tuftsAt(P, d, z) {
  if (z < 199.5 || z > 296) return 0;
  const off = Math.abs(d - P.laneD(z)), Fo = P.fore, Bh = P.stone.frontHouse;
  if (d < Fo.d1 + 1.5 && z < Fo.z1 + 1.5) return 0;
  if (d > Bh.d - Bh.dp / 2 - 4 && Math.abs(z - Bh.z) < Bh.w / 2 + 4) return 0;
  if (off < 0.75) return 0.6;
  if (off < 2.95) return 0;
  return off < 9 ? 0.9 : clamp(0.9 - (off - 9) / 25 * 0.8, 0, 0.9);
}
// the tufts' own places: every candidate's dice are drawn (place, keep, size, turn, kind) before tuftsAt decides
// (a generator: it yields every 1,024 candidates so that no step of the build is long)
export function* tuftPoints(P, n = 6000) {
  const r = P.R.tufts, out = [];
  for (let k = 0; k < n * 3 && out.length < n; k++) {
    if ((k & 1023) === 1023) yield;
    const d = P.DS + r.range(-36, 36), z = r.range(199.5, 296), keep = r(), s = r.range(0.55, 1.0), rot = r.range(0, TAU), v = r() < 0.7 ? 0 : 1;
    if (keep < tuftsAt(P, d, z)) out.push({ x: P.X(d), y: 0, z, s, rot, v });
  }
  return out;
}
// (the plain by the lane is a summer meadow, green; no stubble)
export const PLAIN = mix3(COL.turf, COL.gravel, 0.24);
// THE MEADOW'S FLOWERS by the lane: daisies, buttercups and poppies of the plain itself, small, on both
// verges from the ruts' shoulders to 12 m off the lane's middle, where the tufts' own rule lets grass stand (none
// in the close, none on the first front's ground, none on the lane). A stream of their own; every candidate's
// dice are drawn before the rule decides.
export function meadowFlowers(P, n = 340) {
  const r = makeRng(hashSeed('half-city-of-the-fair:meadow:' + P.seed)), out = [];
  for (let k = 0; k < n * 3 && out.length < n; k++) {
    const z = r.range(200, 295), sd = r() < 0.5 ? -1 : 1, off = r.range(3.3, 12), s = r.range(0.24, 0.4), rot = r.range(0, TAU), d = P.laneD(z) + sd * off;
    if (tuftsAt(P, d, z) > 0.3) out.push({ x: P.X(d), y: 0, z, s, rot, v: 0 });
  }
  return out;
}
// THE FAR PLAIN IS LAND (R5, G2): fields in strips between hedge lines, a far road, the same picture on the near
// sheet and on the far disc. The pattern lies in its own frame (u, v), turned a little from the seam's about the
// world's origin, so that the fair's straight hedge cuts the strips aslant. Quiet colours near the plain's own.
const FIELD = ['#b3a268', '#6f8747', '#8a7250', '#5d783f', '#bfb383', '#a1975c', '#7d8a4e'].map(hex), FE = 3100, FAR_E = 2400;
export function planFields(P) {
  const r = makeRng(hashSeed('half-city-of-the-fair:fields:' + P.seed)), ang = r.range(0.14, 0.3) * (r() < 0.5 ? -1 : 1);
  const cuts = () => { const o = [-FE]; while (o[o.length - 1] < FE) o.push(o[o.length - 1] + r.range(230, 430)); return o; };
  const us = cuts(), vs = cuts(), blocks = [];
  for (let i = 0; i + 1 < us.length; i++) for (let j = 0; j + 1 < vs.length; j++) {
    const along = r() < 0.5, strips = [], span = along ? us[i + 1] - us[i] : vs[j + 1] - vs[j], base = r.int(0, FIELD.length - 1), one = r() < 0.25;
    // a block is one crop in a few shades, in strips; one block in four is a single meadow
    // (the strips differ in tone: stubble, plough, clover and fallow side by side)
    for (let t = 0; t < span;) { const w = one ? span : r.range(22, 64); strips.push([t, Math.min(span, t + w), r() < 0.7 ? base : r.int(0, FIELD.length - 1), r.range(0.76, 1.14)]); t += w; }
    blocks.push({ u0: us[i], u1: us[i + 1], v0: vs[j], v1: vs[j + 1], along, strips, hu: r() < 0.8, hv: r() < 0.8 });
  }
  return { ang, blocks, ca: Math.cos(ang), sa: Math.sin(ang) };
}
// paints the fields into g, whose pixel (px, pz) is the world's ((x - x0) * sc, (z - z0) * sz); hw: a hedge's width
function paintFields(g, P, x0, z0, sc, sz, hw) {
  const Fd = P.fields || (P.fields = planFields(P));
  g.save(); g.translate(-x0 * sc, -z0 * sz); g.scale(sc, sz); g.rotate(Fd.ang);
  for (const B of Fd.blocks) for (const t of B.strips) {
    g.fillStyle = css(FIELD[t[2]], t[3]);
    if (B.along) g.fillRect(B.u0 + t[0], B.v0, t[1] - t[0] + 0.6, B.v1 - B.v0 + 0.6); else g.fillRect(B.u0, B.v0 + t[0], B.u1 - B.u0 + 0.6, t[1] - t[0] + 0.6);
  }
  // lanes: a pale cart track along one edge of every third block, inside its hedge
  g.fillStyle = css(COL.gravel, 1.0); g.globalAlpha = 0.7;
  Fd.blocks.forEach((B, i) => { if (i % 3 === 0) g.fillRect(B.u0 + hw, B.v0, hw * 0.8, B.v1 - B.v0); else if (i % 3 === 1) g.fillRect(B.u0, B.v0 + hw, B.u1 - B.u0, hw * 0.8); });
  g.globalAlpha = 1; g.fillStyle = css(COL.moss, 0.62);
  for (const B of Fd.blocks) { if (B.hu) g.fillRect(B.u0 - hw / 2, B.v0, hw, B.v1 - B.v0); if (B.hv) g.fillRect(B.u0, B.v0 - hw / 2, B.u1 - B.u0, hw); }
  g.restore();
  // the meadow by the carters' road, open and unhedged, north of the city; the road itself on to the horizon and
  // one far cross road
  const X = (d) => (P.X(d) - x0) * sc, Z = (z) => (z - z0) * sz, rd = P.DS + 3;
  g.fillStyle = css(PLAIN);
  for (const [m, al] of [[40, 0.35], [20, 0.5], [0, 1]]) { g.globalAlpha = al; g.fillRect(Math.min(X(-12 - m), X(262 + m)), Z(150), Math.abs(X(262 + m) - X(-12 - m)), (480 + m - 150) * sz); }
  g.globalAlpha = 1; g.strokeStyle = css(hex('#9a8463'), 1.04); g.lineCap = 'round'; g.lineJoin = 'round';
  // (the carters' lane beyond the city follows the plan's knots, narrow, of packed earth; the far cross road meets it)
  g.lineWidth = Math.max(6.4 * sc, 1.6); g.beginPath(); P.roadKnots.forEach((k, i) => (i ? g.lineTo(X(k[1]), Z(k[0])) : g.moveTo(X(k[1]), Z(k[0])))); g.stroke();
  g.lineWidth = Math.max(8 * sc, 1.3); g.beginPath(); g.moveTo(X(-FAR_E - 100), Z(1010)); g.lineTo(X(-700), Z(930)); g.lineTo(X(P.roadD(900)), Z(900)); g.lineTo(X(1100), Z(960)); g.lineTo(X(FAR_E + 100), Z(880)); g.stroke();
}
// THE DETAIL PICTURE: one small tiling picture, 512 texels over 6 m of ground (1.17 cm to a texel), made
// once from a stream of its own and freed in dispose. Its three channels are three patterns, each about a middle
// grey (the sheet's material multiplies the ground's colour by them; far off they melt to that grey):
//   red: FLAGSTONES 1.5 m by 0.75 m in a running bond, each stone of its own tone with a worn edge, the joints
//        4.7 cm wide and dark;
//   green: MOWN GRASS: a fine grain and thousands of short blades, lighter and darker;
//   blue: PACKED EARTH AND GRIT: a fine grain and small pebbles, each with a pale top and a dark foot.
function detailPicture(seed) {
  const n = 512, cv = newCanvas(n), g = cv.getContext('2d'), id = g.createImageData(n, n), d = id.data, r = makeRng(hashSeed('half-city-of-the-fair:detail:' + seed));
  const cw = n / 4, rh = n / 8, tone = [];
  for (let i = 0; i < 32; i++) tone.push(r.range(0.42, 0.64));
  for (let y = 0; y < n; y++) {
    const row = Math.floor(y / rh), yy = y - row * rh;
    for (let x = 0; x < n; x++) {
      const xs = (x + (row % 2) * cw / 2) % n, col = Math.floor(xs / cw), xx = xs - col * cw, i = (y * n + x) * 4;
      const joint = yy < 2 || yy >= rh - 2 || xx < 2 || xx >= cw - 2, edge = yy < 5 || yy >= rh - 5 || xx < 5 || xx >= cw - 5;
      d[i] = 255 * (joint ? 0.15 : tone[row * 4 + col] - (edge ? 0.07 : 0) + r.range(-0.045, 0.045));
      d[i + 1] = 255 * (0.5 + r.range(-0.12, 0.12)); d[i + 2] = 255 * (0.49 + r.range(-0.08, 0.08)); d[i + 3] = 255;
    }
  }
  const at = (x, y, c) => (((y % n) + n) % n * n + ((x % n) + n) % n) * 4 + c;
  // the blades: short strokes 3 to 7 texels long, leaning a little
  for (let k = 0; k < 3000; k++) {
    const x = r.int(0, n - 1), y = r.int(0, n - 1), len = r.int(3, 7), v = r() < 0.5 ? 42 : -46, sl = r.int(-1, 1);
    for (let j = 0; j < len; j++) { const i = at(x + Math.round(sl * j / 3), y + j, 1); d[i] = clamp(d[i] + v, 0, 255); }
  }
  // the pebbles: 2 to 7 cm across
  for (let k = 0; k < 460; k++) {
    const x = r.int(0, n - 1), y = r.int(0, n - 1), rad = r.range(0.9, 3.1), v = r.range(0.14, 0.32);
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const q = Math.hypot(dx, dy);
      if (q <= rad) d[at(x + dx, y + dy, 2)] = 255 * (0.5 + v * (1 - q / (rad + 1))); else if (q <= rad + 1 && dy > 0) d[at(x + dx, y + dy, 2)] = 255 * 0.3;
    }
  }
  g.putImageData(id, 0, 0);
  return cv;
}
// THE LANE'S OWN RELIEF: a ribbon laid on the sheet along the carters' lane (P.laneD) from the street's
// stones at the plots' head to 4 m behind the entry: TWO RUTS worn 15 cm into the packed earth, a GRASS CROWN
// between them, a low green shoulder to each verge. It wears the sheet's own pictures (the same place of the
// ground's painting, pools and detail) and a colour to every corner: the ruts' beds darker, the crown and the
// shoulders green. Its relief sinks to nothing over its last 8 m toward the street.
function laneMesh(P, material) {
  // across the lane: [metres from its middle, height, colour]
  const half = [[0, 0.27, [0.66, 0.98, 0.5]], [0.95, 0.2, [0.86, 0.97, 0.72]], [1.25, 0.05, [0.7, 0.68, 0.66]], [1.9, 0.05, [0.72, 0.7, 0.68]], [2.15, 0.17, [1, 1, 1]], [3.0, 0.21, [0.76, 0.96, 0.6]], [3.6, -0.04, [0.8, 0.95, 0.66]]];
  // (the ribbon begins at the street's head, where the flags now end)
  const prof = half.slice(1).reverse().map((q) => [-q[0], q[1], q[2]]).concat(half), nc = prof.length, z0 = Math.floor(P.streetHead), z1 = 290, nr = z1 - z0 + 1;
  const pos = new Float32Array(nr * nc * 3), col = new Float32Array(nr * nc * 3), uv = new Float32Array(nr * nc * 2), idx = [];
  for (let i = 0; i < nr; i++) {
    const z = z0 + i, t = smoothstep(z0, z0 + 8, z), c = P.laneD(z), wob = 0.13 * Math.sin(z / 5.3 + P.lanePh * 2) + 0.07 * Math.sin(z / 1.9 + P.lanePh);
    for (let j = 0; j < nc; j++) {
      // (the columns run toward +x on either hand, so that every face looks up)
      const q = prof[P.hand > 0 ? j : nc - 1 - j], k = (i * nc + j), deep = Math.abs(q[0]) > 1 && Math.abs(q[0]) < 2 ? 0.035 * Math.sin(z / 3.1 + q[0] * 2 + P.lanePh) : 0;
      const x = P.X(c + q[0] + (Math.abs(q[0]) < 3 ? wob : 0));
      pos[k * 3] = x; pos[k * 3 + 1] = q[1] < 0 ? q[1] : 0.025 + t * (q[1] + deep); pos[k * 3 + 2] = z;
      col[k * 3] = lerp(1, q[2][0], t); col[k * 3 + 1] = lerp(1, q[2][1], t); col[k * 3 + 2] = lerp(1, q[2][2], t);
      uv[k * 2] = (x - GX0) / (GX1 - GX0); uv[k * 2 + 1] = (z - GZ0) / (GZ1 - GZ0);
      if (i + 1 < nr && j + 1 < nc) { const a = k, e = k + 1, f = k + nc + 1, h = k + nc; idx.push(a, f, e, a, h, f); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  return mesh;
}
// THE GARDEN'S WALKS ARE CRISP. The walks the line's round looks down on (the swing's ring
// walk, the south-west round point's ring, and every walk that begins within 80 m of the swing's axis) are RIBBONS
// laid on the sheet like the lane's: flat, a few centimetres up, wearing the sheet's own pictures at their place
// (so the lamps' pools and the long shadows lie on them) and a colour to every corner: RAKED in stripes 0.3 to
// 0.45 m wide along the walk, paler and darker by turns, between two dark clipped borders 0.4 m wide. Their edges
// are geometry, so they are sharp at every distance; the sheet under them is painted gravel a little narrower.
export function crispWalks(P) {
  const S = P.swing, Gd = P.dress.garden, near = (p, m) => Math.hypot(p[0] - S.d, p[1] - S.z) < m, out = [{ pts: Gd.ring, w: Gd.ww, y: 0.07, n: 12 }];
  P.rounds.forEach((q, i) => { if (near([q.d, q.z], 70)) out.push({ pts: P.rings[i], w: 4.0, y: 0.06, n: 8 }); });
  for (const w of P.walks) if (near(w[0], 80)) out.push({ pts: w, w: 4.4, y: 0.045, n: 8 });
  return out;
}
export function walkRibbons(P) {
  const pos = [], col = [], uv = [], idx = [], EDGE = [0.3, 0.44, 0.22];
  for (const c of crispWalks(P)) {
    const pts = c.pts.map((p) => [P.X(p[0]), p[1]]), n = pts.length, closed = Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]) < 1e-6, nrm = [];
    // at every knot the walk's own cross direction (the mean of its two lengths' normals, lengthened at a bend)
    for (let i = 0; i < n; i++) {
      const ia = i > 0 ? i - 1 : closed ? n - 2 : -1, ib = i < n - 1 ? i + 1 : closed ? 1 : -1, p = pts[i];
      const dirTo = (a, q) => { const x = q[0] - a[0], z = q[1] - a[1], l = Math.hypot(x, z); return [x / l, z / l]; };
      const t0 = ia >= 0 ? dirTo(pts[ia], p) : dirTo(p, pts[ib]), t1 = ib >= 0 ? dirTo(p, pts[ib]) : t0;
      let nx = -(t0[1] + t1[1]), nz = t0[0] + t1[0]; const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
      const k = 1 / Math.max(0.5, nx * -t0[1] + nz * t0[0]);
      nrm.push([nx * k, nz * k]);
    }
    // the stripes across: a border, the raked stripes, a border
    const hw = c.w / 2, cuts = [-hw, -hw + 0.4], tones = [EDGE];
    for (let j = 1; j <= c.n; j++) { cuts.push(-hw + 0.4 + (c.w - 0.8) * j / c.n); tones.push(j % 2 ? [1.07, 1.06, 1.04] : [0.83, 0.82, 0.8]); }
    cuts.push(hw); tones.push(EDGE);
    for (let j = 0; j + 1 < cuts.length; j++) {
      const v0 = pos.length / 3, t = tones[j];
      for (let i = 0; i < n; i++) for (const e of [cuts[j], cuts[j + 1]]) {
        const x = pts[i][0] + nrm[i][0] * e, z = pts[i][1] + nrm[i][1] * e;
        pos.push(x, c.y, z); col.push(t[0], t[1], t[2]); uv.push((x - GX0) / (GX1 - GX0), (z - GZ0) / (GZ1 - GZ0));
      }
      // (the cross direction is the walk's own left hand, so every face looks up whichever way its knots run)
      for (let i = 0; i + 1 < n; i++) { const a = v0 + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  return { pos, col, uv, idx };
}
function ribbonMesh(R, material) {
  const geo = new THREE.BufferGeometry(), nv = R.pos.length / 3, nrm = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) nrm[i * 3 + 1] = 1;
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(R.pos), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(R.col), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(R.uv), 2)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); geo.setIndex(R.idx);
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  return mesh;
}
function* paintGround(P, I, mask, pal) {
  const N = GN, cv = newCanvas(N), g = cv.getContext('2d'), sc = N / (GX1 - GX0), sz = N / (GZ1 - GZ0);
  const X = (d) => (P.X(d) - GX0) * sc, Z = (z) => (z - GZ0) * sz, r = P.R.ground, S = P.swing, B = P.stone, W = P.wheel;
  // a rectangle of the plan (d0..d1, z0..z1) and a path of the plan stroked w metres wide
  const rect = (d0, z0, d1, z1) => g.fillRect(Math.min(X(d0), X(d1)), Z(z0), Math.abs(X(d1) - X(d0)), Z(z1) - Z(z0));
  // (ways: every path stroked here, kept for the picture of the kinds of ground: each is earth or gravel)
  // (soft 1: a path with a soft worn edge; soft 2: a path with a plain edge; soft 0: a plain stroke over a path,
  // which is not a path of its own)
  const ways = [];
  const way = (pts, w, col, soft = 1) => {
    if (soft) ways.push([pts, soft === 1 ? w : w / 0.9]);
    g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = col;
    for (const [k, al] of soft === 1 ? [[1.5, 0.3], [1.15, 0.45], [0.85, 1]] : [[1, 1]]) { g.globalAlpha = al; g.lineWidth = w * k * sc; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1])))); g.stroke(); }
    g.globalAlpha = 1;
  };
  const turf = css(COL.turf), gravel = css(COL.gravel), pave = css(mix3(COL.marble, COL.gravel, 0.35)), worn = css(mix3(COL.gravel, COL.timber, 0.4), 0.9), earth = css(COL.gravel, 0.8);
  g.fillStyle = css(PLAIN); g.fillRect(0, 0, N, N);
  paintFields(g, P, GX0, GZ0, sc, sz, 4.4);
  // the meadow by the road: one quiet field, mottled paler and darker in soft patches (no band, no stripe)
  const rr = P.R.road;
  for (let i = 0; i < 260; i++) { g.globalAlpha = 0.07; g.fillStyle = rr() < 0.5 ? css(COL.gravel, 1.2) : css(COL.moss, 0.95); g.beginPath(); g.ellipse(X(rr.range(-60, 262)), Z(rr.range(200, 400)), rr.range(5, 17) * sc, rr.range(4, 12) * sz, rr.range(0, 3), 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  yield;
  // the fair's lawn ends STRAIGHT at its hedges (north at z 198, west at d -241), a ditch outside them and the
  // fields beyond (G2: no soft curve like a shore); mown in stripes, mottled; then the stone half's gravel
  // (the close by the road is the same lawn, hedged all round, its ditch outside its north and east hedges)
  const Fo = P.fore;
  g.fillStyle = css(COL.turf, 0.5); rect(-245.4, 199.6, Fo.d0 - 1.6, 201.6); rect(-245.4, -214, -243.4, 201.6);
  // (no ditch along the close's east hedge: there the lane's green verge runs to the hedge's foot)
  rect(Fo.d0 - 3.6, 201.6, Fo.d0 - 1.6, Fo.z1 + 3.6); rect(Fo.d0 - 3.6, Fo.z1 + 1.6, Fo.d1 - Fo.ch, Fo.z1 + 3.6);
  g.fillStyle = css(COL.turf, 0.8); rect(-243.4, 197, -8, 199.6); rect(-243.4, -214, -240, 199.6); rect(Fo.d0 - 1.6, 198, Fo.d1 + 1.6, Fo.z1 + 1.6);
  g.fillStyle = turf; rect(-240, -212, -7, 197); rect(Fo.d0, 196, Fo.d1 - 0.6, Fo.z1 - 0.6);
  // (the mower's stripes, 2.6 m each: from above the lawn is a pattern, never one dark sheet)
  g.fillStyle = css(COL.turf, 1.5); g.globalAlpha = 0.46; for (let d = -238; d < -9; d += 5.2) rect(d, -212, d + 2.6, 197);
  g.globalAlpha = 1;
  for (let i = 0; i < 420; i++) { g.globalAlpha = 0.1; g.fillStyle = r() < 0.5 ? css(COL.turf, 1.35) : css(COL.moss, 0.8); g.beginPath(); g.ellipse(X(r.range(-232, -7)), Z(r.range(-212, 192)), r.range(3, 11) * sc, r.range(3, 11) * sc, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 60; i++) { g.globalAlpha = 0.1; g.fillStyle = rr() < 0.5 ? css(COL.turf, 1.35) : css(COL.moss, 0.8); g.beginPath(); g.ellipse(X(rr.range(Fo.d0 + 4, Fo.d1 - 4)), Z(rr.range(Fo.z0, Fo.z1 - 4)), rr.range(3, 9) * sc, rr.range(3, 9) * sc, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  yield;
  g.fillStyle = gravel; g.globalAlpha = 0.5; rect(3, -203, 258, 196); g.globalAlpha = 1; rect(7, -197, 250, 190);
  for (let i = 0; i < 300; i++) { g.globalAlpha = 0.08; g.fillStyle = r() < 0.5 ? css(COL.gravel, 1.25) : css(COL.gravel, 0.75); g.beginPath(); g.ellipse(X(r.range(7, 250)), Z(r.range(-197, 190)), r.range(3, 10) * sc, r.range(3, 10) * sc, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // the yard of the first row toward the road (the lowered front, the fronts east of the plots, the works, the shed,
  // the tanks): pale raked gravel under and behind them
  g.fillStyle = css(COL.gravel, 1.3);
  // (and round the stone front that stands by the lane behind the first wagons)
  for (const [m, al] of [[7, 0.22], [3.5, 0.35], [0, 0.7]]) { g.globalAlpha = al; rect(B.DE + 2 - m, P.edgeZ - 30 - m, 216 + m, 196 + m); rect(P.plotD + 4 - m, 196, 216 + m, 272 + m); rect(B.frontHouse.d - B.frontHouse.dp / 2 - 5 - m, 196, P.plotD + 4, B.frontHouse.z + B.frontHouse.w / 2 + 5 + m); }
  g.globalAlpha = 1;
  // the seam's walk and the lane across the plots' head
  way([[0, 190], [0, -197]], 13, css(COL.gravel, 1.12));
  // (that lane stops 13 m short of the street's middle on the fair's side and begins again
  // 16 m beyond it, so that no bare earth lies across the street's head: there are the verges, below)
  way([[2, 197], [P.DS - 13, 197]], 8, gravel); way([[P.DS + 16, 197], [P.plotD + 30, 197]], 8, gravel);
  // THE CARTERS' LANE: a NARROW lane of packed earth, 6.6 m from verge to verge, duller and warmer than
  // the stone half's gravel. It wanders a little (P.laneD) and runs into the street's stones at the plots' head.
  // Its two ruts and its grass crown are TRUE RELIEF (laneMesh); here its earth, its verges' rougher green, and
  // the wheel marks that curve off it to every standing wagon's tail
  const laneC = css(hex('#9a8463')), laneP = [];
  for (let z = 300; z >= 186; z -= 3) laneP.push([P.laneD(z), z]);
  for (let z = 298; z > 199; z -= 2.4) {
    const o = rr.range(-3, 3), hw = rr.range(6, 11), hl = rr.range(4, 8), tn = rr.range(0.9, 1.08);
    g.globalAlpha = 0.3; g.fillStyle = css(mix3(COL.turf, COL.gravel, 0.3), tn); g.beginPath(); g.ellipse(X(P.laneD(z) + o), Z(z), hw * sc, hl * sz, 0, 0, TAU); g.fill();
  }
  g.globalAlpha = 1; way(laneP, 6.2, laneC);
  // WHERE THE LANE MEETS THE STREET: either side of the lane's last 8 m a GREEN VERGE, from
  // the lane's shoulder out to 12.5 m from the street's middle, up to the kerbs' returns at the street's head
  // (P.streetHead; the kerbs and the two gas standards there are dressInto's and planDress's)
  g.fillStyle = css(mix3(COL.turf, PLAIN, 0.5), 0.95); g.globalAlpha = 0.85;
  for (const sg of [-1, 1]) rect(P.DS + sg * 3.3, P.streetHead + 0.2, P.DS + sg * 12.5, P.streetHead + 8);
  g.globalAlpha = 1;
  // a pair of wheel marks along a curve from a0 to a1 (its two handles c0, c1), each 0.95 m off the curve's middle
  const track = (a0, c0, c1, a1, al = 0.36) => {
    const at = (t, i) => { const u = 1 - t; return u * u * u * a0[i] + 3 * u * u * t * c0[i] + 3 * u * t * t * c1[i] + t * t * t * a1[i]; };
    g.globalAlpha = al; g.strokeStyle = css(hex('#77654a')); g.lineWidth = 0.7 * sc; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const e of [-0.95, 0.95]) {
      g.beginPath();
      for (let k = 0; k <= 14; k++) { const t = k / 14, td = at(t + 0.02, 0) - at(t - 0.02, 0), tz = at(t + 0.02, 1) - at(t - 0.02, 1), tl = Math.hypot(td, tz) || 1, d = at(t, 0) - tz / tl * e, z = at(t, 1) + td / tl * e; if (k) g.lineTo(X(d), Z(z)); else g.moveTo(X(d), Z(z)); }
      g.stroke();
    }
    g.globalAlpha = 1;
  };
  for (const q of P.trailers) if (!q.seam && !q.yard && q.z < 300) track([P.laneD(q.z - 31) + 0.3, q.z - 31], [P.laneD(q.z - 22) + 0.8, q.z - 22], [q.d - 0.6, q.z - 19], [q.d, q.z - 8]);
  // THE LEFT STREET AND THE SQUARE: flagstones, their joints the detail picture's (no joint is painted
  // here). The street runs from the square to the plots' head: a carriageway of darker stone whose north end
  // runs out raggedly into the lane's earth, the gone row's own paler pavement behind its kerb on the fair's
  // side, and paving on to the east row's fronts
  const pe = B.DE - P.DS - 0.5, flagC = mix3(COL.marble, COL.gravel, 0.35);
  // (the pavement and the carriageway run on to the street's head, P.streetHead, where the
  // kerbs turn out; only between the lane's two verges do the last flags run a little raggedly into its earth)
  g.fillStyle = pave; rect(P.DS - P.paveW, B.sqN, P.DS - 5.4, P.streetHead); rect(P.DS + 7.5, B.sqN, P.DS + pe, P.edgeZ + 2); rect(10, B.sqS, 110, B.sqN);
  g.fillStyle = css(flagC, 0.84); rect(P.DS - 5.4, B.sqN, P.DS + 7.5, P.streetHead);
  for (let i = 0; i < 26; i++) { g.globalAlpha = 0.75; g.beginPath(); g.ellipse(X(P.DS - 3.1 + i * 0.25 + rr.range(-0.6, 0.6)), Z(P.streetHead + rr.range(-0.5, 1.4)), rr.range(0.8, 1.6) * 0.6 * sc, rr.range(1, 2.4) * 0.6 * sz, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // the south wing's forecourt of gravel, a paved walk along its fronts
  g.fillStyle = gravel; g.globalAlpha = 0.5; rect(-238, -252, -18, -206); g.globalAlpha = 1; rect(-234, -248, -22, -210);
  g.fillStyle = pave; rect(-230, -216, -24, -211);
  // WHERE A HOUSE HAS GONE ITS PLAN IS LEFT: its lot a rectangle of trodden earth, and within the outline of its
  // walls (where the low dark bearers lie: lotInto) THE FLOOR THE HOUSE LEAVES, ROOM BY ROOM (lotRooms), each room
  // in a warm tone of its own and none pale: wide oak boards, darker boards laid the other way, red tiles, buff
  // and red tiles (0.65 m to a tile), kitchen flags; a dark line where each partition stood; a pair of wheel
  // marks curving out of its street side toward the way out. (lotTiles: the tiled and flagged rooms, for the
  // picture of the kinds of ground: the detail picture's joints show there)
  // (the page is handed back before the lots and after each: a lot's rooms are many small strokes)
  yield;
  const lotC = css(mix3(COL.gravel, hex('#77654a'), 0.6), 0.96), lotTiles = [];
  const ROOM = [['#96724a', '#84633f', '#8d6a45'], ['#6f5237', '#62472e', '#69492f'], ['#a8623f', '#935237'], ['#b4925f', '#9a5a3c'], ['#8d8370', '#857b69']];
  const lot = (d0, d1, z0, z1, sd) => {
    g.fillStyle = lotC; g.globalAlpha = 0.92; rect(d0, z0, d1, z1); g.globalAlpha = 1;
    for (const q of lotRooms(d0, d1, z0, z1, sd || 1)) {
      const x0 = Math.round(Math.min(X(q.d0), X(q.d1))), x1 = Math.round(Math.max(X(q.d0), X(q.d1))), y0 = Math.round(Z(q.z0)), y1 = Math.round(Z(q.z1)), tn = ROOM[q.kind];
      g.fillStyle = tn[0]; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      if (q.kind === 0) for (let y = y0, k = 0; y < y1; y += 2, k++) { if (k % 2) { g.fillStyle = tn[1 + (k >> 1) % 2]; g.fillRect(x0, y, x1 - x0, Math.min(2, y1 - y)); } }
      else if (q.kind === 1) for (let x = x0, k = 0; x < x1; x += 2, k++) { if (k % 2) { g.fillStyle = tn[1 + (k >> 1) % 2]; g.fillRect(x, y0, Math.min(2, x1 - x), y1 - y0); } }
      else if (q.kind < 4) { g.fillStyle = tn[1]; for (let y = y0, j = 0; y < y1; y += 2, j++) for (let x = x0 + (j % 2) * 2; x < x1; x += 4) g.fillRect(x, y, Math.min(2, x1 - x), Math.min(2, y1 - y)); }
      if (q.kind >= 2) lotTiles.push(q);
      // (the partition's line: a dark stroke one texel wide round the room)
      g.strokeStyle = '#4a3a2c'; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
    }
    if (!sd) return;
    const de = sd > 0 ? d1 : d0, zm = (z0 + z1) / 2;
    track([de - sd * 3, zm + 2], [de + sd * 4, zm + 2.5], [P.DS - sd * 1.6, zm + 8], [P.DS - sd * 1.3, zm + 19], 0.3);
  };
  for (const q of B.plots) { lot(q.d - q.w / 2, q.d + q.w / 2, q.z - q.dp / 2, q.z + q.dp / 2, q.d < P.DS ? 1 : -1); yield; }
  for (const q of B.gone) { lot(q.d - q.dp / 2, q.d + q.dp / 2, q.z - q.w / 2, q.z + q.w / 2, 1); yield; }
  // the worn paths of the fair: the crossing, the midway, the ring round the swing, the avenue, the aprons
  const ringPts = (cd, cz, rr, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; o.push([cd + rr * Math.cos(a), cz + rr * Math.sin(a)]); } return o; };
  // gravel walks under the worn middles of the crossing, the midway and the avenue; bare earth under the swing
  const gw = css(COL.gravel, 1.06);
  // (no worn ring round the swing and no worn way south of it: there the garden's raked
  // walks lie (crispWalks); the midway's worn way runs on to 9 m before the swing's cross line, where it meets
  // the garden's ring walk)
  way([[-6, P.ZC], [P.DM, P.ZC]], 10.5, gw); way([[P.DM, P.ZC + 4], [P.DM, S.z + 9]], 13, gw); way([[P.DA, S.z], [P.DA, W.z - 20]], 12.5, gw);
  g.fillStyle = worn; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(X(S.d), Z(S.z), 17.5 * sc, 17.5 * sz, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
  way([[-6, P.ZC], [P.DM, P.ZC]], 6.5, worn); way([[P.DM, P.ZC + 4], [P.DM, S.z + 9]], 9, worn);
  way([[P.DA, S.z], [P.DA, W.z - 20]], 8, worn); way([[P.DM, P.ZC], [P.DA, P.ZC + 10]], 5, worn);
  way(ringPts(P.drum.d, P.drum.z, P.drum.r + 3.5, 28), 4, worn); way([[P.tent.d + 19, P.tent.z - 16], [P.tent.d + 23, P.tent.z], [P.tent.d + 19, P.tent.z + 16]], 9, worn);
  way([[-7, W.z], [W.d + 14, W.z], [W.d, W.z - 22], [P.DA, W.z - 30]], 6, worn); way(ringPts(S.d, S.z, 5.5, 20), 3, worn);
  for (const q of P.dress.booths) { if (q.side) way([[q.d - q.side * 3.5, q.z - 3], [q.d - q.side * 3.5, q.z + 3]], 3, worn); else way([[q.d - 3, q.z + 3.6], [q.d + 3, q.z + 3.6]], 3, worn); }
  // THE PLEASURE GROUNDS' WALKS: gravel with a trodden middle: from the gate through the close and down to the
  // wheel, from the seam to the wheel, the avenue's walk on to the north hedge; the two walks that cross at the
  // bandstand and the ring round it; a trodden strip under each row of swing boats
  const Lw = P.lawn;
  // (PALE gravel on the walks, the rings of the three round points and their spokes; a trodden middle a shade
  // darker; an apron of the same gravel from the gate to the lane)
  const pw = css(mix3(COL.gravel, COL.marble, 0.45), 1.14), pt = css(mix3(COL.gravel, COL.marble, 0.25), 1.02);
  // (THE APRON ENDS AT THE LANE'S VERGE, 3.9 m from the lane's middle, with a plain edge: no soft round end of it
  // lies over the lane's rut or its crown)
  way([[Fo.d1 - Fo.ch / 2, Fo.z1 - Fo.ch / 2], [P.laneD(Fo.z1 + 1) - 6.2, Fo.z1 + 0.4]], 4.6, pw, 2);
  // (the garden's walks are ribbons with plain edges, painted further down: crispWalks)
  const crisp = crispWalks(P), isCrisp = (w) => crisp.some((c) => c.pts === w);
  for (const w of P.walks) if (!isCrisp(w)) { way(w, 5.2, pw); way(w, 2.2, pt, 0); }
  for (const w of P.rings) if (!isCrisp(w)) { way(w, 4.6, pw); way(w, 2.0, pt, 0); }
  // THE SWING'S GARDEN: from the hedge ring out to the limes the lawn is laid again, clean
  // and mown, over whatever worn path ran there (clipped to the garden's own round, between the midway's end and
  // the avenue's start); then the garden's walks in their gravel with a plain edge, 0.5 m narrower than their
  // ribbons (walkRibbons), whose dark clipped borders lie over the paint's edge
  // (gardenPath: that round as a path of a drawing whose pixels are k times the painting's)
  const gardenPath = (c, k) => {
    const Gd = P.dress.garden, cx = X(S.d) * k, cz = Z(S.z) * k, a0 = Math.atan2(-Math.sin(4 * DEG), P.hand * Math.cos(4 * DEG)), a1 = Math.atan2(-Math.sin(176 * DEG), P.hand * Math.cos(176 * DEG));
    c.beginPath(); c.arc(cx, cz, (Gd.rl + 2.5) * sc * k, a0, a1, P.hand > 0); c.arc(cx, cz, (Gd.rh - 0.5) * sc * k, a1, a0, P.hand < 0); c.closePath();
  };
  g.save(); gardenPath(g, 1); g.clip();
  g.fillStyle = turf; rect(S.d - 42, S.z - 42, S.d + 42, S.z + 42);
  g.fillStyle = css(COL.turf, 1.5); g.globalAlpha = 0.46; for (let d = -238; d < -9; d += 5.2) if (Math.abs(d - S.d) < 42) rect(d, S.z - 42, d + 2.6, S.z + 42);
  g.globalAlpha = 1; g.restore();
  for (const c of crisp) way(c.pts, c.w - 0.5, pw, 2);

  for (const q of P.boats) { const hl = q.n * q.pitch / 2 + 1; way(q.face === 0 ? [[q.d - hl, q.z], [q.d + hl, q.z]] : [[q.d, q.z - hl], [q.d, q.z + hl]], 7, worn); }
  g.globalAlpha = 1;
  // the west range's paved forecourt beyond the lawn, and the palace's on the square
  g.fillStyle = gravel; rect(-220, P.ZC + 14 - 28, -180, P.ZC + 14 + 192); g.fillStyle = pave; rect(-190, P.ZC + 14 - 26, -182, P.ZC + 14 + 190);
  // (the range's far lot stands emptied: bare earth where its front stood)
  if (B.westGone) { const q = B.westGone; lot(q.d - q.dp / 2, q.d + q.dp / 2, q.z - q.w / 2, q.z + q.w / 2, 0); }
  yield;
  // grain, then the shadows (one multiply of the mask), then the picture's edge melts into the plain
  const nz = newCanvas(128), gn = nz.getContext('2d'), id = gn.createImageData(128, 128), rn = P.R.far;
  for (let i = 0; i < 128 * 128; i++) { const v = 205 + Math.floor(rn() * 50); id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  gn.putImageData(id, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(nz, 'repeat'); g.fillRect(0, 0, N, N);
  yield;
  g.drawImage(mask, 0, 0); g.globalCompositeOperation = 'source-over';
  yield;
  // the far plain's own picture: the same fields, 4.7 m to a pixel, darkened by the grain's mean so that the near
  // sheet's edge does not show; its rim melts to one quiet colour (the disc beyond it holds that colour)
  const FN = 1024, fc = newCanvas(FN), fg = fc.getContext('2d'), fs = FN / (2 * FAR_E);
  fg.fillStyle = css(PLAIN); fg.fillRect(0, 0, FN, FN);
  paintFields(fg, P, -FAR_E, -FAR_E, fs, fs, 7);
  const rg = fg.createRadialGradient(FN / 2, FN / 2, FN * 0.36, FN / 2, FN / 2, FN * 0.5), pc = [0, 1, 2].map((i) => Math.round(Math.pow(lerp(PLAIN[i], FIELD[1][i], 0.3), 1 / 2.2) * 255)).join(',');
  rg.addColorStop(0, 'rgba(' + pc + ',0)'); rg.addColorStop(1, 'rgba(' + pc + ',1)'); fg.fillStyle = rg; fg.fillRect(0, 0, FN, FN);
  fg.globalCompositeOperation = 'multiply'; fg.fillStyle = 'rgb(230,230,230)'; fg.fillRect(0, 0, FN, FN);
  yield;
  // THE LAMPS' POOLS, PAINTED BY PLACE (no light is made): a second, smaller picture of the same sheet holds what
  // the ground gives back of itself: everywhere the hour's share of its own colour (pal.lift), and under every
  // standing lamp, lantern and gas mantle lower than 15 m a soft warm pool, wider and fainter the higher the lamp
  // hangs. Where lamps stand close (a booth's fascia, a festoon, an arch, the trestle's rails) their pools run
  // together. By day no lamp burns and the picture is the plain share alone (pal.pools false).
  let glowCv = null;
  if (pal.pools) {
    // (the second picture is given back POOL times over, and the plain share is written that much lower, so that
    // a full pool gives back more than the ground's own colour: a pool of light, not a paler patch)
    const GP = 1024, k = GP / N, lc = newCanvas(GP), lg = lc.getContext('2d'), lv = Math.round(Math.pow(pal.lift / POOL, 1 / 2.2) * 255);
    lg.fillStyle = 'rgb(' + lv + ',' + lv + ',' + lv + ')'; lg.fillRect(0, 0, GP, GP);
    // one soft warm blot, drawn once and stamped for every lamp
    const blot = newCanvas(64), bg = blot.getContext('2d'), gr = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(244,178,98,1)'); gr.addColorStop(0.4, 'rgba(236,164,90,0.55)'); gr.addColorStop(1, 'rgba(226,150,84,0)'); bg.fillStyle = gr; bg.fillRect(0, 0, 64, 64);
    let done = 0;
    // (the older lamps, then the late makers': a pool under each, by the same rule)
    for (const q of I.lamps.concat(I.lampsLate)) {
      if (q[1] > 15) continue;
      const rad = (2.4 + q[1] * 1.1) * (q[6] === 2 ? 1.45 : 1), al = clamp(0.36 * q[3] * q[3] * (q[6] === 2 ? 3.6 : q[6] === 3 ? 2.6 : 1) * 3 / (3 + q[1]), 0.03, 0.8);
      lg.globalAlpha = al; lg.drawImage(blot, ((q[0] - GX0) * sc - rad * sc) * k, ((q[2] - GZ0) * sz - rad * sz) * k, 2 * rad * sc * k, 2 * rad * sz * k);
      if ((++done & 255) === 255) yield;
    }
    glowCv = newCanvas(GP); const gg = glowCv.getContext('2d');
    gg.drawImage(cv, 0, 0, GP, GP); gg.globalCompositeOperation = 'multiply'; gg.drawImage(lc, 0, 0);
    yield;
  }
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const glowTex = glowCv ? new THREE.CanvasTexture(glowCv) : null; if (glowTex) { glowTex.flipY = false; glowTex.colorSpace = THREE.SRGBColorSpace; glowTex.anisotropy = 2; }
  // THE KINDS OF GROUND: a small picture of the same sheet, 0.64 m to a texel: red where stone is laid
  // (the street, the square, the paved walks), blue where earth, gravel or grit lies (the lane, the stone half's
  // yards, every walk and worn path), green where grass grows (the lawns, the verges, the plain). The sheet's
  // material reads it to choose which of the detail picture's three patterns shows at a place.
  const KN = 1024, kc = newCanvas(KN), kg = kc.getContext('2d'), kk = KN / N;
  const krect = (d0, z0, d1, z1) => kg.fillRect(Math.min(X(d0), X(d1)) * kk, Z(z0) * kk, Math.abs(X(d1) - X(d0)) * kk, (Z(z1) - Z(z0)) * kk);
  kg.lineJoin = 'round'; kg.lineCap = 'round';
  kg.fillStyle = '#00ff00'; kg.fillRect(0, 0, KN, KN);
  kg.fillStyle = '#0000ff'; kg.strokeStyle = '#0000ff';
  krect(3, -203, 258, 196); krect(P.plotD + 4, 196, 216, 272); krect(-238, -252, -18, -206); krect(-220, P.ZC + 14 - 28, -180, P.ZC + 14 + 192);
  krect(B.frontHouse.d - B.frontHouse.dp / 2 - 5, 196, P.plotD + 4, B.frontHouse.z + B.frontHouse.w / 2 + 5);
  const kway = (w) => { kg.lineWidth = w[1] * 0.9 * sc * kk; kg.beginPath(); w[0].forEach((p, i) => (i ? kg.lineTo(X(p[0]) * kk, Z(p[1]) * kk) : kg.moveTo(X(p[0]) * kk, Z(p[1]) * kk))); kg.stroke(); };
  for (const w of ways) kway(w);
  // (the garden's round: grass again, then its own walks' grit)
  kg.save(); gardenPath(kg, kk); kg.clip(); kg.fillStyle = '#00ff00'; kg.fillRect(0, 0, KN, KN); kg.restore();
  kg.fillStyle = '#0000ff';
  for (const c of crisp) kway([c.pts, (c.w - 0.5) / 0.9]);
  kg.fillStyle = '#ff0000';
  krect(P.DS - P.paveW, B.sqN, P.DS + B.DE - P.DS - 0.5, 186); krect(10, B.sqS, 110, B.sqN); krect(-230, -216, -24, -211); krect(-190, P.ZC + 14 - 26, -182, P.ZC + 14 + 190);
  krect(P.DS - P.paveW, 186, P.DS + 7.5, P.streetHead);
  for (const q of lotTiles) krect(q.d0, q.z0, q.d1, q.z1);
  const kindTex = new THREE.CanvasTexture(kc); kindTex.flipY = false; kindTex.colorSpace = THREE.NoColorSpace;
  yield;
  // THE GROUND IS CRISP NEAR THE LENS: the detail picture (detailPicture: 512 texels over 6 m, 1.17 cm to a
  // texel, tiling) multiplies the sheet's colour and what the sheet gives back of itself, by the kind of ground.
  // Its grass and its earth are read a second time 5.3 times larger (31.6 m to a repeat, 6.2 cm to a texel), so
  // that the fine picture's repeat does not show from the trestle's and the gallery's height
  const detTex = new THREE.CanvasTexture(detailPicture(P.seed)); detTex.flipY = false; detTex.colorSpace = THREE.NoColorSpace; detTex.wrapS = detTex.wrapT = THREE.RepeatWrapping; detTex.anisotropy = 8;
  yield;
  // the sheet gives back a share of its own colour whatever the light (pal.lift), so no shaded ground goes black
  // (with the pools, that share is the second picture's own; without them, the first picture's by pal.lift)
  // (vc: with a colour to every corner, for the lane's own relief, which wears the same pictures)
  // THE POOLS ARE STILL: no pool swells or sinks, and nothing of the ground pulses in unison (the
  // flames breathe each on a phase of its own in the lamps' own field; the ground does not follow them).
  // breath: [the plain share times 1.5, the swell: NOUGHT at every hour, the clock: never set]; the sheet's
  // material keeps the term, which multiplies by one.
  const breath = { value: new THREE.Vector3(pal.lift / POOL * 1.5, 0, 0) };
  const sheetMat = (vc) => {
    const m = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: glowTex || tex, emissiveIntensity: glowTex ? POOL : pal.lift, vertexColors: vc });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uDet = { value: detTex }; sh.uniforms.uKind = { value: kindTex }; sh.uniforms.uBreath = breath;
      sh.vertexShader = 'varying vec2 vShUv;\nvarying vec2 vDetUv;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvShUv = uv;\n\tvDetUv = position.xz / 6.0;');
      sh.fragmentShader = 'uniform sampler2D uDet;\nuniform sampler2D uKind;\nuniform vec3 uBreath;\nvarying vec2 vShUv;\nvarying vec2 vDetUv;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', '#include <map_fragment>\n\tvec3 gKd = texture2D( uKind, vShUv ).rgb;\n\tvec3 gDt = texture2D( uDet, vDetUv ).rgb - 0.5;\n\tvec3 gDc = texture2D( uDet, vDetUv * 0.19 + 0.31 ).rgb - 0.5;\n\tfloat gDet = 1.0 + 1.7 * dot( gDt, gKd ) + 1.3 * dot( gDc.gb, gKd.gb );\n\tdiffuseColor.rgb *= gDet;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= gDet;\n\t#ifdef USE_COLOR\n\ttotalEmissiveRadiance *= vColor.rgb;\n\t#endif\n\tfloat gPl = clamp( ( emissiveColor.r / max( sampledDiffuseColor.r, 0.04 ) - uBreath.x ) * 4.0, 0.0, 1.0 );\n\ttotalEmissiveRadiance *= 1.0 + uBreath.y * gPl * sin( uBreath.z * 1.7 );');
    };
    m.customProgramCacheKey = () => 'half-city-of-the-fair-ground' + (vc ? '-vc' : '');
    return m;
  };
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([GX0, 0, GZ0, GX1, 0, GZ0, GX1, 0, GZ1, GX0, 0, GZ1]), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)); geo.setIndex([0, 2, 1, 0, 3, 2]);
  const mesh = new THREE.Mesh(geo, sheetMat(false)); mesh.frustumCulled = false;
  const lane = laneMesh(P, sheetMat(true));
  // the plain beyond, to a true horizon: one great disc a hand's breadth under the sheet
  const farTex = new THREE.CanvasTexture(fc); farTex.flipY = false; farTex.colorSpace = THREE.SRGBColorSpace; farTex.anisotropy = 8;
  const farGeo = new THREE.CircleGeometry(4600, 48).rotateX(-Math.PI / 2), fp = farGeo.attributes.position, fu = farGeo.attributes.uv;
  for (let i = 0; i < fp.count; i++) fu.setXY(i, (fp.getX(i) + FAR_E) / (2 * FAR_E), (fp.getZ(i) + FAR_E) / (2 * FAR_E));
  const far = new THREE.Mesh(farGeo, new THREE.MeshLambertMaterial({ map: farTex, emissive: 0xffffff, emissiveMap: farTex, emissiveIntensity: pal.lift }));
  far.position.y = -0.12; far.frustumCulled = false;
  // THE FAR PLAIN KEEPS ITS FIELDS TO THE HORIZON. The disc's colour goes over to pal.farTint BY PLACE, between
  // 350 and 1,400 m from the plan's middle (at dusk a warm dark tone; at the other hours no tint: [1, 1, 1]). It
  // takes the scene's own haze by the scene's own figure, but never more than pal.farCap of it (at dusk 0.72, so
  // that the strips and the hedge lines stand to the plain's rim; at the other hours the whole haze: 1). Both
  // are the hour's, set once at the build.
  const farTint = pal.farTint || [1, 1, 1], farCap = pal.farCap == null ? 1 : pal.farCap;
  far.material.onBeforeCompile = (sh) => {
    sh.uniforms.uFarTint = { value: new THREE.Vector3(farTint[0], farTint[1], farTint[2]) }; sh.uniforms.uFogCap = { value: farCap };
    sh.vertexShader = 'varying vec2 vFarXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvFarXZ = position.xz;');
    sh.fragmentShader = 'uniform vec3 uFarTint;\nuniform float uFogCap;\nvarying vec2 vFarXZ;\n' + sh.fragmentShader.replace('#include <fog_fragment>',
      '#ifdef USE_FOG\n\tfloat farFog = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n\tgl_FragColor.rgb *= mix( vec3( 1.0 ), uFarTint, smoothstep( 350.0, 1400.0, length( vFarXZ ) ) );\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, min( farFog, uFogCap ) );\n#endif');
  };
  far.material.customProgramCacheKey = () => 'half-city-of-the-fair-far';
  // (the garden's walks: ribbons in the lane's own material, see walkRibbons)
  const walks = ribbonMesh(walkRibbons(P), lane.material);
  return { mesh, far, lane, walks, breath, texture: tex, farTexture: farTex, glowTexture: glowTex, detailTexture: detTex, kindTexture: kindTex };
}
