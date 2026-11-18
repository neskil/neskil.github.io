// Lamps Under the Roots: the plan of the island and THE WORKS, its one buried, tended concrete station (the hero set piece).
// Inspired by the television series Lost (2004) and built round six of its known places, each made from words alone
// in forms of our own: THE WRECK on the beach (the broken middle of an airliner in the sand) with THE CAMP beside it,
// THE SHIP (a wooden sailing ship of long ago wrecked in the basin, far from any sea; its place is dealt here), THE HATCH in the forest
// floor (a steel door with one small window in a dug pit, a shaft of pale light standing out of its glass), THE
// RADIO MAST on the Works' highest roof (a lattice mast, a red lamp blinking at its head) and THE HEART of the island
// (a low wide cave mouth in the basin's far wall pouring golden light, the basin's water running into it). A wild
// island alone in the sea whose old concrete rooms someone still keeps lit under the roots. No person, nothing
// lettered, no numeral, no emblem.
//
// REAL SOURCES: a fringing reef and a palm beach; coast-battery casemates, observation slits, vent cowls, glass-block
// pavement lights (here as kerbs that light sideways), sunk courts, weather posts; strangler figs; clear-water rift
// fissures, limestone boil springs, mist over warm water.
// THE FIXED HOUR: the last hour of sun, bearing 292, 12 to 17 degrees up by the seed's 'sun' stream. Light differs by place only.
// THE AXES: metres; e runs east, n north, y up from mean sea level; world (x, y, z) = (e, y, -n); the origin is the entry.
// A bearing is clockwise from north. A lit thing's SPINE METRES are its n minus 138 (the brow).
// This file holds the plan as plain numbers (layout(seed, vary): the line, the ground rule, every dealt thing as a body,
// every count of a row), so that a count in node reads the same plan the page draws, and buildHero(), the Works alone.
// THE RAMP'S PLAN (how the line leaves the court): the ramp runs from the court's north end (n 352, floor y 9) up to
// the terrace (n 392, y 15.5). Its WEST edge lies on e -18: west of it the yard and the open-fronted room keep the
// floor at y 9, so that edge is a retaining wall UNDER the ramp, never a wall beside the lens. Its EAST wall stands
// 6 m right of the line throughout. The line leaves by the ramp's open top, 4.5 m or more over the terrace's lip;
// no fern and no root curtain stands on that lip within 6 m of the crossing (curtains hang on the court's long
// walls only). The stair into the court is 11 m wide.
// Every thing stands where this plan puts it, by its place and for the reason given there.
// BROUGHT IN: smax and smin (the ground rule's smooth maximum and minimum) follow the quadratic smooth minimum
// published by Inigo Quilez (his article on smooth minimum; MIT licence).
import * as THREE from 'three';
import { makeRng, hashSeed, makeNoise, clamp, lerp, smoothstep } from '../kit/core.js';

const RAD = Math.PI / 180, TAU = Math.PI * 2;
// plan (e, y, n) to world [x, y, z]
export const toWorld = (e, y, n) => [e, y, -n];
// a unit step on a bearing, in the plan: [de, dn]
export const onBearing = (deg) => [Math.sin(deg * RAD), Math.cos(deg * RAD)];
// every stream of the seed, by name: a stream of its own from the world's seed and the name, drawing from no parent
export const STREAMS = ['sun', 'weather', 'palms', 'forest', 'glades', 'understory', 'floor', 'fallen', 'lianas', 'roots', 'fittings', 'pots', 'lamps', 'cracks', 'mist', 'clouds', 'flocks', 'birds', 'ferns', 'far', 'drips', 'rings', 'sea', 'rill', 'falls', 'brook', 'land', 'sedge', 'gusts', 'leaves', 'steam', 'shafts', 'spray', 'reef', 'stones', 'springs', 'sway', 'rare', 'shapes', 'wreck', 'ship', 'camp', 'heart', 'rimfalls', 'walls', 'boulders', 'flowers', 'mast', 'props', 'pebbles', 'pit'];
export const streamOf = (seed, name) => makeRng(hashSeed('lamps-under-the-roots:' + name + ':' + seed));
// the one set of streams of a visit: made once (by the page, or by the plan when it is asked alone) and handed on
export const makeStreams = (seed) => { const S = {}; for (const name of STREAMS) S[name] = streamOf(seed, name); return S; };

// ---------------------------------------------------------------- places of the plan (e, n), heights y
export const K = {
  SEA: 0, FLOOR: 9, LIP: 15.5, MEADOW: 22, WATER: 21.6,
  // the brow: 16 m long and 5 m tall in the bank behind the beach, one slit a metre tall
  BROW: { e: -22, n: 137, face: 160, w: 16, y0: 4.6, y1: 9.6, slit: [7.5, 8.5] },
  // the bank door: a casemate face 6.4 m wide and 4.6 m tall, set square into the stream's west bank; its doorway
  // (3.4 m wide, 3.8 m tall) stands in the face's middle, 0.9 m deep
  DOOR: { e: 0, n: 181, face: 150, w: 6.4, y0: 9, y1: 13.6, dw: 3.4, dh: 3.8, du: 0, deep: 0.9 },
  ROOF: { e0: -33, e1: 5, n0: 207, n1: 273, row: 332 },
  STAIR: { e: -16.7, w: 11, n0: 272, n1: 298, flights: [13, 11, 13] },
  COURT: { e0: -22.7, e1: -10.7, n0: 298, n1: 352, wall: 6.5 },
  // THE RAMP'S PLAN: from the court's north end (n 352, floor y 9) up to the terrace (n 392, y 15.5). Its WEST edge
  // lies on e -18 (west of it the yard and the room keep the floor at y 9, so that edge is a retaining wall UNDER the
  // ramp, never a wall beside the lens); its EAST wall stands 6 m right of the line throughout (e -10.5 at n 352 to
  // e -3.4 at n 384). The line leaves by the ramp's open top, 4.5 m or more over the terrace's lip.
  RAMP: { n0: 352, n1: 392, west: -18, right: 6 },
  ROOM: { e0: -30, e1: -18, n0: 373.5, n1: 382.5, fig: [-32, 378], door: 376 },
  POST: { e0: 0, e1: 6, n0: 447.5, n1: 456.5, floor: 29, h: 3 },
  SILL: { e: 13, n: 446, y: 28 },
  SPRING: { e: 12, n: 663 },
  BASIN: { e: 15, n: 630, re: 130, rn: 165 },
  PEAK: { e: -290, n: 790, y: 214 },
  ROOFFIG: [-30, 238],
};

// ---------------------------------------------------------------- the line: fourteen pieces by place
// ['s', metres] a straight; ['a', degrees (right is +), radius] a bend. Each bend goes round a thing of the island:
// the door's bank, the roof fig, the stair head, the room, the sill post; then, in the basin, RIGHT off the main rift
// to run beside the second rift (its water eight metres to the left), LEFT across that rift's mouth where its steam
// lies low, and a last straight of 66 m over the Springhead's water (no long straight onto one thing).
const PIECES = [['s', 128], ['a', 24, 90], ['a', -52, 65], ['s', 28], ['a', 28, 80], ['s', 62], ['a', 22, 100], ['s', 40], ['a', -22, 110], ['s', 6], ['a', 22, 110], ['s', 30], ['a', -44, 100], ['s', 66]];
// lens height by the thing under the line, at metres of the line (smoothed below so that bends of height run on 80 m
// or more): 4.5 m and more over every lip of the Works the line crosses (the roof's east lip, the stair's head, the
// terrace's lip at the ramp's top), 3.5 m over the court's floor, 33 on the sill (its ground 28), 7.6 to 8 m over the meadow
const HEIGHTS = [[0, 4], [95, 4], [128, 6], [186, 12], [218, 20.3], [288, 20.3], [316, 12.5], [351, 12.5], [401.6, 20.3], [459, 33.6], [512, 29.6], [695.4, 30]];
// pace by metres of the line (m/s): the sea fast, gully and roof slower, stair, court and ramp slowest, the basin faster
const PACE = [[0, 17], [100, 17], [128, 13], [253, 13], [270, 12], [392, 12], [410, 14], [474, 14], [500, 16], [540, 16.5], [695.4, 16.5]];
const piecewise = (T, s, ease) => {
  if (s <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (s <= T[i][0]) { const t = (s - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return lerp(T[i - 1][1], T[i][1], ease ? t * t * (3 - 2 * t) : t); }
  return T[T.length - 1][1];
};
export const speedAt = (s) => piecewise(PACE, s, true);
// the plan of the line walked in short steps: [e, n, metres, bearing in degrees]
function walkLine(step = 2) {
  const out = []; let e = 0, n = 0, h = 0, s = 0;
  const put = () => out.push([e, n, s, h / RAD]);
  put();
  for (const p of PIECES) {
    if (p[0] === 's') { const k = Math.ceil(p[1] / step), d = p[1] / k; for (let i = 0; i < k; i++) { e += Math.sin(h) * d; n += Math.cos(h) * d; s += d; put(); } }
    else {
      const a = p[1] * RAD, R = p[2], sg = Math.sign(a), ce = e + sg * R * Math.cos(h), cn = n - sg * R * Math.sin(h), len = Math.abs(a) * R, k = Math.ceil(len / step);
      const h0 = h;
      for (let i = 1; i <= k; i++) { h = h0 + a * i / k; e = ce - sg * R * Math.cos(h); n = cn + sg * R * Math.sin(h); s += len / k; put(); }
    }
  }
  return out;
}
const LINE2 = walkLine(2), LINE_LEN = LINE2[LINE2.length - 1][2];
// the lens height at metres of the line: the table above, averaged twice over 9 m either side
const heightRaw = (s) => piecewise(HEIGHTS, clamp(s, 0, LINE_LEN), false);
const heightAtS = (s) => { let a = 0, w = 0; for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j += 3) { a += heightRaw(s + i + j); w++; } return a / w; };
// the route's knots in world metres, one every 6 m of the line
export function routeKnots() {
  const out = [];
  for (let i = 0; i < LINE2.length; i += 3) { const p = LINE2[i]; out.push(toWorld(p[0], heightAtS(p[2]), p[1])); }
  const last = LINE2[LINE2.length - 1]; if ((LINE2.length - 1) % 3) out.push(toWorld(last[0], heightAtS(last[2]), last[1]));
  return out;
}
// the line's plan point at metres s: [e, n, bearing]
export function lineAt(s) {
  s = clamp(s, 0, LINE_LEN); let lo = 0, hi = LINE2.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (LINE2[m][2] <= s) lo = m; else hi = m; }
  const a = LINE2[lo], b = LINE2[hi], t = (s - a[2]) / Math.max(1e-6, b[2] - a[2]);
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[3], b[3], t)];
}
export const LINE_METRES = LINE_LEN;
// nearest point of the line's plan to (e, n): [distance, metres of the line]
export function nearLine(e, n) {
  let best = 1e18, bi = 0;
  for (let i = 0; i < LINE2.length; i += 2) { const de = LINE2[i][0] - e, dn = LINE2[i][1] - n, d = de * de + dn * dn; if (d < best) { best = d; bi = i; } }
  for (let i = Math.max(0, bi - 2); i <= Math.min(LINE2.length - 1, bi + 2); i++) { const de = LINE2[i][0] - e, dn = LINE2[i][1] - n, d = de * de + dn * dn; if (d < best) { best = d; bi = i; } }
  return [Math.sqrt(best), LINE2[bi][2]];
}
export const lensHeightAt = heightAtS;
// THE LIPS THE LINE CROSSES: where it comes over the roof's east lip, where it leaves the slab at the stair's head and
// where it tops the ramp at the terrace's lip. The lens is at its lowest over the Works there, so no fern (tree fern
// or undergrowth) stands within 6 m of these three places, its fronds' reach counted.
export const LIP_CROSSINGS = [(q) => q[0] < K.ROOF.e1 && q[1] > K.ROOF.n0, (q) => q[1] > K.STAIR.n0, (q) => q[1] > K.RAMP.n1].map((over) => { let s = 0; while (s < LINE_LEN && !over(lineAt(s))) s += 0.25; const q = lineAt(s); return [q[0], q[1]]; });
export const nearLipCrossing = (e, n, m) => LIP_CROSSINGS.some((q) => Math.hypot(q[0] - e, q[1] - n) < m);
// the way out: where the line ends, facing back down its last straight
export const RING = (() => { const p = LINE2[LINE2.length - 1]; return { e: p[0], n: p[1], y: 30, heading: p[3] }; })();
// ---------------------------------------------------------------- the ground rule (the same on every seed)
const NZ = makeNoise(hashSeed('lamps-under-the-roots:island'));
// smax, smin: the quadratic smooth maximum and minimum in the form Inigo Quilez published: BROUGHT IN, see the head.
const smax = (a, b, k) => { const h = clamp(0.5 + 0.5 * (a - b) / k, 0, 1); return lerp(b, a, h) + k * h * (1 - h); };
const smin = (a, b, k) => -smax(-a, -b, k);
// distance from (e, n) to the segment a-b of a polyline, and the share along it: [metres, t]
const segQ = (e, n, a, b) => { const ue = b[0] - a[0], un = b[1] - a[1], l2 = ue * ue + un * un, t = l2 ? clamp(((e - a[0]) * ue + (n - a[1]) * un) / l2, 0, 1) : 0; return [Math.hypot(e - a[0] - ue * t, n - a[1] - un * t), t]; };
// THE OUTLINE: our own bent teardrop about the island's middle; the waterline passes (0, 95) where the line comes in
const ISL = { e: -45, n: 770, a: 475, b: 675 };
const shoreK = (th) => 1 + 0.06 * Math.sin(2 * th + 0.6) + 0.045 * Math.sin(3 * th + 2.1) + 0.025 * Math.sin(5 * th + 0.4);
const shoreQ = (e, n, f) => { const de = e - ISL.e, dn = n - ISL.n, th = Math.atan2(de, dn), k = shoreK(th) * f; return Math.hypot(de / (ISL.a * (1 + 0.12 * Math.cos(th)) * k), dn / (ISL.b * k)); };
const SHORE_F = shoreQ(0, 95, 1);
// metres inland of the waterline (negative: out to sea)
export function shoreDist(e, n) { const q = shoreQ(e, n, SHORE_F), r = Math.hypot(e - ISL.e, n - ISL.n); return r * (1 - q) / Math.max(q, 1e-4); }
// THE RIDGES: a horseshoe open to the south round the basin. Each vertex: [e, n, crest height, half breadth]
const RIDGES = [
  [[-290, 790, 214, 150], [-215, 640, 122, 105], [-126, 502, 50, 62], [-100, 400, 34, 50], [-92, 300, 30, 46], [-86, 215, 26, 42], [-78, 160, 15, 38]],
  [[-290, 790, 214, 150], [-190, 930, 172, 130], [-30, 985, 150, 120], [120, 930, 142, 115], [182, 800, 136, 105], [165, 660, 130, 96], [150, 545, 84, 76], [112, 475, 48, 52], [92, 385, 38, 50], [80, 300, 34, 48], [70, 220, 28, 44], [62, 160, 16, 38]],
  [[-72, 453, 31, 22], [13, 449, 28, 21], [78, 451, 32, 22]],
];
function ridgeField(e, n) {
  let y = 0;
  for (const R of RIDGES) for (let i = 0; i + 1 < R.length; i++) {
    const a = R[i], b = R[i + 1], q = segQ(e, n, a, b), H = lerp(a[2], b[2], q[1]), Wd = lerp(a[3], b[3], q[1]), x = q[0] / Wd;
    if (x < 5) y = smax(y, H / (1 + x * x), 5);
  }
  return y;
}
// THE STREAM: its course from the main rift's south tip to the beach [e, n, bed y]. ONE stream, and it runs OUT of the
// basin: its bed falls all the way (the sill's ground stands at y 28, so the rill leaves by a cleft cut through it).
export const STREAM = [[13.4, 500, 21.3], [13.3, 470, 21.15], [13, 446, 21.0], [13.6, 437, 19.2], [14.6, 428, 17.4], [16, 419, 15.6], [17.4, 409, 13.8], [18.6, 400, 12.1], [20.5, 380, 11.6], [22, 330, 10.9], [21, 273, 10.1], [18, 232, 9.5], [13.4, 205, 9], [13.4, 191, 8.4], [12.2, 178, 7.6], [9, 163, 6.2], [3.5, 146, 4.2], [0.5, 128, 2.5], [0, 112, 1.1], [0, 96, 0.05]];
// FIVE CASCADES between n 400 and n 446: the bed climbs 8.9 m in five chutes (each a short run, then a drop of 1.8 m
// over dark rock), never a rimmed pool
export const cascadeBed = (n) => { const x = clamp((n - 400) / 46, 0, 1) * 5, i = Math.min(4, Math.floor(x)), f = x - i; return 12.1 + 8.9 * (i + smoothstep(0.7, 1, f)) / 5; };
// the stream's course in short steps, in world metres over its bed: [x, y, z, n]
export function streamPoints(n0, n1, step = 1.5, lift = 0.05) {
  const out = [];
  for (let i = 0; i + 1 < STREAM.length; i++) { const a = STREAM[i], b = STREAM[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(len / step));
    for (let j = 0; j < k; j++) { const t = j / k, n = lerp(a[1], b[1], t); if (n > n1 || n < n0) continue; const e = lerp(a[0], b[0], t); out.push([e, (n > 400 && n < 446 ? cascadeBed(n) : lerp(a[2], b[2], t)) + lift, -n, n]); } }
  return out;
}
// the stream's centre (e) at a given n
export const streamE = (n) => { for (let i = 0; i + 1 < STREAM.length; i++) { const a = STREAM[i], b = STREAM[i + 1]; if ((n - a[1]) * (n - b[1]) <= 0 && a[1] !== b[1]) return lerp(a[0], b[0], (n - a[1]) / (b[1] - a[1])); } return STREAM[0][0]; };
// the stream's bed and the distance to its course: [metres aside, bed y, n of the nearest point, steepness of its banks]
export function streamAt(e, n) {
  let best = 1e9, y = 0, nn = 0;
  for (let i = 0; i + 1 < STREAM.length; i++) { const a = STREAM[i], b = STREAM[i + 1]; if (Math.min(a[1], b[1]) - n > best || n - Math.max(a[1], b[1]) > best) continue; const q = segQ(e, n, a, b); if (q[0] < best) { best = q[0]; y = lerp(a[2], b[2], q[1]); nn = lerp(a[1], b[1], q[1]); } }
  if (nn > 400 && nn < 446) y = cascadeBed(nn);
  return [best, y, nn];
}
// the stream's mouth: where its course meets the waterline
// the n of the waterline at e (the beach where the line comes in)
const shoreN = (e) => { let lo = 40, hi = 200; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (shoreDist(e, m) > 0) hi = m; else lo = m; } return hi; };
export const MOUTH = (() => { for (let n = 150; n > 96.2; n -= 0.25) { const e = streamE(n); if (shoreDist(e, n) <= 0) return { e, n }; } const q = STREAM[STREAM.length - 1]; return { e: q[0], n: q[1] }; })();
// THE RIFTS: five long narrow fissures fanning unevenly from the Springhead (a fan, never a ring), 2 to 7 m wide,
// kinked every 10 to 20 m [e, n, breadth]. ALL FIVE lie on the approach's side of the Springhead, so that the whole
// fan is seen from the sill: 0 the main rift south (the stream leaves by its tip); 1 the second rift,
// south-south-east, which the line runs beside and crosses at its mouth; 2 west; 3 south-east, the longest;
// 4 south-west. North of the Springhead no rift runs: the lit water there is the Springhead's own pool
const SP = K.SPRING;
export const RIFTS = [
  [[11, 642, 6], [8, 629, 4.5], [9.5, 614, 6.5], [3.5, 598, 3.5], [2, 580, 5.5], [-1.5, 564, 3], [4.5, 546, 5], [7.5, 531, 2.8], [11.5, 516, 4.2], [13.4, 500, 2.5]],
  [[18.5, 646, 6.5], [21, 634, 5], [24.5, 622, 6.8], [26.5, 610, 4], [29.5, 599, 6], [31, 586, 3.6], [32.6, 574, 5.6], [31, 562, 3.2], [29.5, 549, 5], [25.5, 540, 3], [23.5, 532, 2.4]],
  [[2, 662, 6], [-12, 657, 4.5], [-28, 649, 6.5], [-44, 641, 3.5], [-60, 629, 5.5], [-76, 620, 3], [-92, 606, 4.5]],
  [[23, 652, 7], [36, 643, 5], [50, 631, 7], [62, 618, 4.5], [78, 599, 6.5], [90, 584, 4], [104, 566, 5.5], [114, 552, 3.2], [124, 540, 2.6]],
  [[4, 650, 5.5], [-6, 638, 4], [-17, 626, 6], [-27, 611, 3.5], [-39, 597, 5.2], [-47, 581, 3], [-55, 566, 4.4], [-59, 552, 2.6], [-62, 540, 2.2]],
];
// THE HEART OF THE ISLAND: a low wide cave mouth in the basin's far wall, pouring warm golden light, with the basin's
// water running into it. It stands where the far wall's foot meets the meadow beyond the way out: 86 m on along the
// bearing the line flies its last stretch on, and 30 m to the west of that bearing (straight behind the way out, the
// way out's own disc would stand before it from the basin's middle to the end). It looks out on the Springhead.
// { e, n: the middle of its sill; face: the bearing it looks out on; hw: half its breadth; h: its height over its
// water; y: its water's level }. The flight never enters it, and nothing of its inside is made but light.
export const HEART = (() => { const b = onBearing(RING.heading), w = onBearing(RING.heading - 90), e = RING.e + b[0] * 86 + w[0] * 30, n = RING.n + b[1] * 86 + w[1] * 30;
  return { e, n, face: Math.atan2(SP.e - e, SP.n - n) / RAD, hw: 10, h: 6, y: K.WATER - 0.63 }; })();
// THE SHIP: a wrecked wooden sailing ship lying on the meadow east of the Springhead, the great fall behind it as
// the line sees it. { e, n: the middle of its keel; bow: the bearing its bow points on; heel: degrees it lies over
// toward the line; len: its length }. nearShip: whether a place lies under it or under its leaning masts
export const SHIP = { e: 35, n: 705, bow: 150, heel: 17, len: 50 };
export const nearShip = (e, n, m = 0) => { const u = onBearing(SHIP.bow), de = e - SHIP.e, dn = n - SHIP.n, al = de * u[0] + dn * u[1], ac = de * u[1] - dn * u[0]; return Math.abs(al) < SHIP.len / 2 + 2 + m && ac > -8 - m && ac < 16 + m; };
// THE RUN TO THE HEART: the one stream the basin's waters gather into, from the north end of the Springhead's pool to
// the mouth and a little way in under its brow: kinked, 5 to 9 m wide, running down three low steps [e, n, breadth]
export const HEART_RUN = (() => { const a = [SP.e - 7.5, 701], f = onBearing(HEART.face), z = [HEART.e - f[0] * 2.5, HEART.n - f[1] * 2.5], d = [z[0] - a[0], z[1] - a[1]], l = Math.hypot(d[0], d[1]), s = [d[1] / l, -d[0] / l];
  return [[a[0], a[1], 6], [a[0] + d[0] * 0.33 + s[0] * 3.5, a[1] + d[1] * 0.33 + s[1] * 3.5, 5], [a[0] + d[0] * 0.68 - s[0] * 3, a[1] + d[1] * 0.68 - s[1] * 3, 6.5], [z[0], z[1], 9]]; })();
// THE FALLS FROM THE RIM, three, each dropping into a recess of the wall from a notch that runs up to the rim:
// east, where the south-east rift ends in the wall; west, 34 m into the wall beyond the west rift's far end; north,
// where the ray from the basin's middle on bearing 6 has climbed 34 m of the far wall. { e, n: the foot of the head
// wall, under the lip; o: the unit step out of the wall toward the basin; len: the recess's length; w0: half its
// breadth at its open end; pool: the middle of the pool the water falls into }
const fallOf = (name, e, n, out, len, w0) => { const o = onBearing(out); return { name, e, n, o, out, len, w0, pool: [e + o[0] * 7, n + o[1] * 7] }; };
export const FALLS = (() => { const R3 = RIFTS[3], z3 = R3[R3.length - 1], y3 = R3[R3.length - 2], b3 = Math.atan2(z3[0] - y3[0], z3[1] - y3[1]) / RAD, h3 = onBearing(b3);
  const R2 = RIFTS[2], z2 = R2[R2.length - 1], b2 = Math.atan2(z2[0] - K.BASIN.e, z2[1] - K.BASIN.n) / RAD, h2 = onBearing(b2), hN = onBearing(6);
  return [fallOf('east', z3[0] + h3[0] * 7, z3[1] + h3[1] * 7, b3 + 180, 44, 19), fallOf('west', z2[0] + h2[0] * 34, z2[1] + h2[1] * 34, b2 + 180, 40, 18), fallOf('north', K.BASIN.e + hN[0] * 172, K.BASIN.n + hN[1] * 172, 186, 36, 17)]; })();
// (the south-east rift's far end is the east fall's pool; the west rift runs on into the wall's recess to the west
// fall's pool: each rift is fed by its fall)
RIFTS[3][RIFTS[3].length - 1][2] = 9;
RIFTS[2].push([(RIFTS[2][RIFTS[2].length - 1][0] + FALLS[1].pool[0]) / 2 - 1.5, (RIFTS[2][RIFTS[2].length - 1][1] + FALLS[1].pool[1]) / 2 + 2, 3.4], [FALLS[1].pool[0], FALLS[1].pool[1], 9]);
// THE NORTH RUN: the north fall's water, from its pool across the north meadow to the Springhead pool's north end,
// where the run to the heart begins [e, n, breadth]
export const NORTH_RUN = [[FALLS[2].pool[0], FALLS[2].pool[1], 9], [26, 772, 3.4], [19.5, 748, 3], [11, 722, 3.6], [SP.e - 6.5, 703, 5]];
const RUNS = [HEART_RUN, NORTH_RUN];
// the level of the run to the heart, by the metres along it: three steps of 0.21 m down from the pool's level
const RUN_LEN = (() => { let l = 0; for (let i = 0; i + 1 < HEART_RUN.length; i++) l += Math.hypot(HEART_RUN[i + 1][0] - HEART_RUN[i][0], HEART_RUN[i + 1][1] - HEART_RUN[i][1]); return l; })();
export const RUN_STEPS = [0.3 * RUN_LEN, 0.55 * RUN_LEN, 0.8 * RUN_LEN];
export const runWater = (along) => K.WATER + 0.02 - 0.21 * (smoothstep(RUN_STEPS[0] - 0.5, RUN_STEPS[0] + 0.5, along) + smoothstep(RUN_STEPS[1] - 0.5, RUN_STEPS[1] + 0.5, along) + smoothstep(RUN_STEPS[2] - 0.5, RUN_STEPS[2] + 0.5, along));
// the Springhead's pool of open water: brimming, uneven, no rim and no stone; 24 m across, from n 640 on south to
// n 704, where it is drawn out north behind the way out to a narrow end (its own pool, not an arm of the fan)
export function springLens(e, n) { const north = smoothstep(663, 704, n), de = (e - SP.e + 7 * north) / ((12 + 1.6 * Math.sin(n * 0.21) + 1.2 * Math.sin(n * 0.083 + 1)) * (1 - 0.5 * north)), dn = (n - 663) / (n > 663 ? 41 : 23); return 1 - Math.hypot(de, dn); }
// metres from (e, n) to the nearest water's edge in the basin (negative inside the water's breadth), which water
// (0 to 4: a rift; 5: the Springhead; 6: the run to the heart; 7: the north run), and metres along it from its head
// (each rift's stretches with the box they lie in, half their greatest breadth, their length and the metres before them)
const boxesOf = (R) => { let run = 0; const out = []; for (let i = 0; i + 1 < R.length; i++) { const a = R[i], b = R[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); out.push([Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), 0.5 * Math.max(a[2], b[2]) + 1e-6, L, run]); run += L; } return out; };
const RIFT_BOX = RIFTS.map(boxesOf), RUN_BOX = RUNS.map(boxesOf);
export function riftAt(e, n) {
  let best = 1e9, which = -1, along = 0;
  for (let r = 0; r < RIFTS.length; r++) { const R = RIFTS[r], G = RIFT_BOX[r]; for (let i = 0; i + 1 < R.length; i++) { const g = G[i];
    // (a stretch whose box lies farther off than the best found, its half breadth counted, cannot be nearer)
    if ((e < g[0] ? g[0] - e : e - g[1]) - g[4] > best || (n < g[2] ? g[2] - n : n - g[3]) - g[4] > best) continue;
    const q = segQ(e, n, R[i], R[i + 1]), d = q[0] - 0.5 * lerp(R[i][2], R[i + 1][2], q[1]); if (d < best) { best = d; which = r; along = g[6] + g[5] * q[1]; } } }
  const L = springLens(e, n); if (L > -1) { const d = -L * 11; if (d < best) { best = d; which = 5; along = 0; } }
  for (let r = 0; r < RUNS.length; r++) { const R = RUNS[r], G = RUN_BOX[r]; for (let i = 0; i + 1 < R.length; i++) { const g = G[i];
    if ((e < g[0] ? g[0] - e : e - g[1]) - g[4] > best || (n < g[2] ? g[2] - n : n - g[3]) - g[4] > best) continue;
    const q = segQ(e, n, R[i], R[i + 1]), d = q[0] - 0.5 * lerp(R[i][2], R[i + 1][2], q[1]); if (d < best - 0.05) { best = d; which = 6 + r; along = g[6] + g[5] * q[1]; } } }
  return [best, which, along];
}
// how full the water's own light is at a place: full within 60 m of the Springhead, two thirds at 150 m
export const waterLightAt = (e, n) => lerp(1, 0.66, smoothstep(60, 150, Math.hypot(e - SP.e, n - 663)));
// the sea's bed by metres out from the waterline: lagoon, reef crest with coral heads, the outer slope
function seaBed(x, e, n) {
  let y = -0.25 - 2.0 * smoothstep(0, 22, x);
  y += 1.75 * smoothstep(40, 56, x) * (1 - smoothstep(64, 74, x));
  y -= 26 * smoothstep(66, 150, x) + 40 * smoothstep(150, 500, x);
  const c = NZ.n2(e * 0.11 + 3, n * 0.11 - 7), c2 = NZ.n2(e * 0.045 - 11, n * 0.045 + 5);
  y += 0.45 * smoothstep(0.25, 0.7, c) * smoothstep(44, 56, x) * (1 - smoothstep(64, 72, x));
  y += 0.9 * smoothstep(0.35, 0.8, c2) * smoothstep(8, 20, x) * (1 - smoothstep(40, 50, x));
  return y;
}
// the Works' terrace: the valley floor west of the stream by n (bank top, the roof's level, the climb to the sill)
const TERRACE = [[132, 8.5], [150, 9.5], [186, 15.5], [396, 15.5], [446, 27.6], [456, 28]];
// a cut with a level or sloping floor inside a rectangle of the plan, its sides hidden in the concrete walls round it
// A CUT IN THE GROUND under a concrete floor: the rectangle of the floor, and on which sides (west, east, south,
// north) a wall stands. At a walled side the ground drops into a trench under the floor slab (4.5 m down within 3 m
// of the wall's face) and climbs back to grade inside the wall's own thickness (0.15 to 1.05 m behind its face), so
// that the ground's mesh never shows through a floor at a wall's foot and no ditch lies behind a wall. At an open
// side the ground meets the floor's level over 2.4 m and there is no trench.
const cutRect = (y, e, n, e0, e1, n0, n1, floor, wW = 1, wE = 1, wS = 1, wN = 1) => {
  const dW = e0 - e, dE = e - e1, dS = n0 - n, dN = n - n1, NO = -1e9;
  const tW = Math.max(wW ? dW : NO, wE ? dE : NO, wS ? dS : NO, wN ? dN : NO), tO = Math.max(wW ? NO : dW, wE ? NO : dE, wS ? NO : dS, wN ? NO : dN);
  if (tW >= 1.05 || tO >= 2.4) return y;
  const base = floor - 0.35 - 4.5 * smoothstep(-3, -0.4, tW) * (1 - smoothstep(-3, -0.6, tO));
  return Math.min(y, lerp(base, y, Math.max(tW > 0 ? smoothstep(0.15, 1.05, tW) : 0, tO > 0 ? smoothstep(0, 2.4, tO) : 0)));
};
// the ramp's middle line by n (it follows the line of flight, bending right) and its floor
export const rampMid = (n) => (n <= 345.8 ? -16.7 : n <= 383.3 ? 83.3 - Math.sqrt(1e4 - (n - 345.8) * (n - 345.8)) : -9.4 + (n - 383.3) * 0.404);
export const rampY = (n) => lerp(K.FLOOR, K.LIP, clamp((n - K.RAMP.n0) / (K.RAMP.n1 - K.RAMP.n0), 0, 1));
// THE STAIR CUT IN THE GROUND: three flights of 13, 11 and 13 risers with two landings between, 26 m from the roof's
// lip down to the court's floor. Each tread: [n where it begins, n where it ends, its top's height]
export const STEPS = (() => {
  const S = K.STAIR, risers = S.flights.reduce((a, b) => a + b, 0), rise = (K.LIP - K.FLOOR) / risers, land = 2.3, tread = (S.n1 - S.n0 - land * (S.flights.length - 1)) / risers, out = [];
  let n = S.n0, y = K.LIP;
  S.flights.forEach((f, fi) => { for (let i = 0; i < f; i++) { y -= rise; const last = i === f - 1 && fi < S.flights.length - 1; out.push([n, n + tread + (last ? land : 0), y]); n += tread + (last ? land : 0); } });
  return out;
})();
export const stairY = (n) => { if (n <= K.STAIR.n0) return K.LIP; for (const t of STEPS) if (n < t[1]) return t[2] + (K.LIP - K.FLOOR) / 37 * clamp(1 - (n - t[0]) / 0.58, 0, 1); return K.FLOOR; };
// THE DOOR'S DRAW: before the apron's wall the bank is worn down into a short open draw that fans out southward and
// falls to the stream, so that the casemate stands at the draw's head, in plain sight from the stream below it:
// [how far the bank is cut there, 0 to 1; the draw's floor]. The apron's own front stands over it as a low wall.
const DRAW_AX = onBearing(K.DOOR.face + 18), DOOR_AX = onBearing(K.DOOR.face);
export function drawAt(e, n) {
  const de = e - K.DOOR.e, dn = n - K.DOOR.n, out = de * DRAW_AX[0] + dn * DRAW_AX[1], before = de * DOOR_AX[0] + dn * DOOR_AX[1];
  if (out < 4 || out > 52 || before < 5.2) return 0;
  const al = Math.abs(de * DRAW_AX[1] - dn * DRAW_AX[0]), hw = 4.5 + 0.36 * (out - 4);
  if (al > hw + 5) return 0;
  return smoothstep(5.2, 6.8, before) * (1 - smoothstep(hw, hw + 5, al)) * (1 - smoothstep(44, 52, out));
}
const drawFloor = (e, n) => K.FLOOR - 1.5 - 0.13 * Math.max(0, (e - K.DOOR.e) * DRAW_AX[0] + (n - K.DOOR.n) * DRAW_AX[1] - 6);
// THE HATCH IN THE FOREST FLOOR lies in that draw, the small clearing between the beach and the Works that the line
// crosses low: a steel hatch flat in the ground over the Works' first buried chamber (the one the bank door opens
// on, which runs out under the draw), 21.5 m out from the door along the draw and 6.5 m to its west side. The earth
// is dug away round it (half a metre down, three metres across) and lies thrown up in an uneven low bank about the
// hollow. The same place on every seed. [plan e, n]
const HATCH_AT = (() => { const a = onBearing(K.DOOR.face + 18), w = onBearing(K.DOOR.face + 108); return [K.DOOR.e + a[0] * 21.5 + w[0] * 6.5, K.DOOR.n + a[1] * 21.5 + w[1] * 6.5]; })();
const HEART_F = onBearing(HEART.face);
// the pit's spoil: three heaps [e, n, breadth, height] at 4.6 to 5 m from the hatch, west-north-west, north-north-west and north-north-east of it
export const SPOIL = [[285, 4.6, 1.5, 1.1], [335, 5.0, 1.7, 1.3], [25, 4.8, 1.4, 0.9]].map(([brg, d, r, h]) => { const b = onBearing(brg); return [HATCH_AT[0] + b[0] * d, HATCH_AT[1] + b[1] * d, r, h]; });
// (the hatch as built: its place, the hollow's floor, the door's half breadth, the height its shaft of light stands to)
export const hatchPlan = () => ({ e: HATCH_AT[0], n: HATCH_AT[1], y: groundAt(HATCH_AT[0], HATCH_AT[1]), half: 1.1, beam: 24 });
// THE GROUND at plan (e, n): metres over mean sea level (under the sea: the bed)
export function groundAt(e, n) {
  const d = shoreDist(e, n);
  if (d < 0) return seaBed(-d, e, n);
  // beach, the bank behind it, the lowland
  let y = 2.5 * Math.pow(clamp(d / 30, 0, 1), 0.85) + 6 * smoothstep(33, 46, d) + 4 * smoothstep(60, 220, d);
  const inland = smoothstep(40, 110, d);
  y = smax(y, ridgeField(e, n) * inland, 6);
  // the Works' terrace between the two shoulders
  if (n > 120 && n < 475) {
    const wT = smoothstep(128, 150, n) * (1 - smoothstep(454, 472, n)), T = piecewise(TERRACE, n, false) + 0.2 * Math.max(0, Math.abs(e + 14) - 42);
    // (toward either coast the shoulders fall to the shore at a slope a dune keeps: no sea cliff stands at the beach's ends)
    if (wT > 0) y = lerp(y, smax(y, Math.min(T, 4 + 0.45 * d), 4), wT);
  }
  y += (0.45 * NZ.fbm2(e * 0.045, n * 0.045, 3) + 0.12 * NZ.n2(e * 0.21, n * 0.21)) * smoothstep(34, 60, d);
  // the basin: a level meadow inside the horseshoe
  const B = K.BASIN, rho = Math.hypot((e - B.e) / B.re, (n - B.n) / B.rn);
  if (rho < 1.1) { const m = 1 - smoothstep(0.8, 1.06, rho); y = lerp(y, K.MEADOW + 0.22 * NZ.n2(e * 0.06, n * 0.06), m); }
  // the basin's walls are rock in big forms, not in layers: buttresses that stand out of the wall from foot to rim
  // (some 30 to 60 m from one to the next, standing further out the higher they go), deep gullies between them, a
  // few broad uneven ledges, and lumps by a field of the place (not where the line comes in over the sill)
  if (rho > 0.88 && rho < 1.6 && y > K.MEADOW + 2) { const h = y - K.MEADOW, k = smoothstep(2, 10, h) * (1 - smoothstep(1.3, 1.6, rho)) * Math.max(smoothstep(500, 530, n), smoothstep(45, 75, Math.abs(e - B.e)));
    if (k > 0) { const an = Math.atan2(e - B.e, n - B.n); const bt = Math.sin(an * 9 + 1.9 * Math.sin(an * 4 + 0.7)), hk = Math.min(h, 46); y += k * (0.2 * hk * bt * Math.abs(bt) + 0.1 * hk * NZ.fbm2(e * 0.018 + 3, n * 0.018 - 5, 2) + 0.8 * Math.sin(h / (17 + 6 * Math.sin(an * 3 + 1)) * TAU + 3.1 * Math.sin(an * 5 + 0.6)) - 3.4 * Math.pow(Math.max(0, Math.sin(an * 23 + 1.7 * Math.sin(an * 7))), 6)); } }
  // THE FALLS: behind each head wall a notch 3 m deep runs up to the rim (the water comes down it); before it the
  // wall stands back in a recess at the meadow's level, 7 m either side at the head wall and widening to its open end
  if (rho > 0.7) for (const F of FALLS) { const de = e - F.e, dn = n - F.n; if (Math.abs(de) > 75 || Math.abs(dn) > 75) continue;
    const s = de * F.o[0] + dn * F.o[1], al = Math.abs(de * F.o[1] - dn * F.o[0]);
    const gw = F.name === 'north' ? 9 : 0; if (s < 0.5 && s > -70 && al < 7 + gw) y -= (3.2 + 0.3 * gw) * (1 - smoothstep(2.5 + gw, 7 + gw, al)) * smoothstep(0.5, -2, s) * (1 - smoothstep(50, 70, -s));
    if (s > -2.5 && s < F.len + 6) { const hw = lerp(7 + gw, F.w0 + gw, clamp(s / F.len, 0, 1)), W = (1 - smoothstep(hw, hw + 4, al)) * smoothstep(-2.5, 0, s) * (1 - smoothstep(F.len - 6, F.len + 6, s)); if (W > 0) y = Math.min(y, lerp(y, K.MEADOW + 0.15, W)); } }
  // THE HEART: before its mouth the wall's foot stands back (open meadow for some 8 m); under its brow the cave's
  // floor lies at its water's level for 3 m in
  const hde = e - HEART.e, hdn = n - HEART.n, hOut = hde * HEART_F[0] + hdn * HEART_F[1], hAl = Math.abs(hde * HEART_F[1] - hdn * HEART_F[0]);
  if (hOut > -3.2 && hOut < 10 && hAl < HEART.hw + 6) { if (hOut > 0.5) y = Math.min(y, lerp(K.MEADOW + 0.1, y, clamp(smoothstep(5, 10, hOut) + smoothstep(HEART.hw + 1.5, HEART.hw + 6, hAl), 0, 1))); else if (hAl < HEART.hw + 0.5) y = Math.min(y, HEART.y + 0.12); }
  // the Works' level pads and cuts: roof glade, stair, court, yard, ramp, room
  const R = K.ROOF, C = K.COURT, M = K.ROOM;
  { const t = Math.max(R.e0 - 6 - e, e - R.e1, R.n0 - 8 - n, n - 400, 0); if (t < 8 && e < 6.5) y = lerp(K.LIP - 0.25, y, smoothstep(0, 8, t)); }
  if (n > 268 && n < 300) y = cutRect(y, e, n, K.STAIR.e - K.STAIR.w / 2, K.STAIR.e + K.STAIR.w / 2, K.STAIR.n0, K.STAIR.n1 + 1, stairY(n) - 0.2, 1, 1, 0, 0);
  y = cutRect(y, e, n, C.e0, C.e1, C.n0, C.n1, K.FLOOR, 1, 1, 0, 0);
  // the yard and the room keep the court's floor west of e -18; the ramp climbs east of it (see THE RAMP'S PLAN)
  if (n > 347 && n < 385 && e < K.RAMP.west + 0.6) { const tW = Math.max(M.e0 - e, C.n1 - 1 - n, n - M.n1), k = Math.max(tW > 0 ? smoothstep(0.15, 1.05, tW) : 0, clamp((e - K.RAMP.west + 0.2) / 0.8, 0, 1));
    if (k < 1) y = Math.min(y, lerp(K.FLOOR - 0.35 - 4.5 * smoothstep(-3, -0.4, tW) * (1 - smoothstep(-21.5, -19.5, e)), y, k)); }
  if (n > 349 && n < 395) y = cutRect(y, e, n, K.RAMP.west, rampMid(n) + K.RAMP.right, 351, 392.5, rampY(n) - 0.05, 0, 1, 0, 0);
  // the door's apron: a swept shelf before the casemate face, 1.5 m over the stream. Behind the face's plane the bank
  // closes on the casemate's ends within 0.8 m; before it the shelf widens with the two splayed wing walls
  { const f = onBearing(K.DOOR.face), de = e - K.DOOR.e, dn = n - K.DOOR.n, out = de * f[0] + dn * f[1], al = Math.abs(de * f[1] - dn * f[0]), edge = out < 0 ? 2.4 : 3.4 + 0.7 * Math.min(out, 3), wide = out < 0 ? 0.8 : 2.6;
    if (out > -2.2 && out < 7 && al < edge + wide) y = Math.min(y, lerp(K.FLOOR - 0.3, y, clamp(smoothstep(5, 7, out) + smoothstep(edge, edge + wide, al), 0, 1))); }
  { const d = drawAt(e, n); if (d > 0) y = Math.min(y, lerp(y, Math.max(drawFloor(e, n), streamAt(e, n)[1] + 0.5), d)); }
  // the hatch's pit: dug 0.6 m down for 2.4 m about the door, its edge worn to a slope; the spoil lies thrown up
  // in three heaps on its west and north sides (none toward the beach and none toward the line: the door lies in
  // open sight from both)
  { const dh = Math.hypot(e - HATCH_AT[0], n - HATCH_AT[1]); if (dh < 10) { y -= 0.6 * (1 - smoothstep(2.4, 3.6, dh));
    for (const hp of SPOIL) { const d2 = (e - hp[0]) * (e - hp[0]) + (n - hp[1]) * (n - hp[1]); if (d2 < hp[2] * hp[2] * 6) y += hp[3] * Math.exp(-d2 / (hp[2] * hp[2])); } } }
  // THE BANK STANDS BACK through the gully and before the door (line metres 160 to 206): within 8.5 m of the line
  // no ground stands higher than 1.4 m under the lens's own height there; beyond that it may rise one in one
  if (n > 148 && n < 216 && e > -14 && e < 34) { const q = nearLine(e, n); if (q[0] < 18 && q[1] > 154 && q[1] < 211) { const cap = heightAtS(q[1]) - 1.4 + Math.max(0, q[0] - 8.5);
    if (y > cap) y = lerp(y, cap, smoothstep(154, 162, q[1]) * (1 - smoothstep(204, 211, q[1]))); } }
  // the brow's forecourt: a level shelf before its face, cut into the bank behind the beach
  { const W = K.BROW, f = onBearing(W.face), de = e - W.e, dn = n - W.n, out = de * f[0] + dn * f[1], al = de * f[1] - dn * f[0]; if (out > -2.2 && out < 11 && Math.abs(al) < 12) y = Math.min(y, lerp(W.y0 - 0.25, y, clamp(smoothstep(4.5, 11, out) + smoothstep(8.6, 12, Math.abs(al)), 0, 1))); }
  // the stream's gully (14 m wide, banks to 8 m), its cleft through the sill, its rill in the meadow
  if (n > 90 && n < 503 && Math.abs(e - 10) < 40) {
    const s = streamAt(e, n), steep = 1.5 + 1.1 * smoothstep(425, 440, s[2]) * (1 - smoothstep(462, 476, s[2])), half = n > 460 ? 1.4 : n > 400 ? 2.2 : 2.6;
    // beside the cascades the WEST bank (the line's side) is laid back to a broad open slope, so that the white water
    // lies in sight from the climb; the east bank keeps its steep rock under the cascade wall
    const west = e < streamE(s[2]) ? smoothstep(394, 404, s[2]) * (1 - smoothstep(436, 446, s[2])) : 0;
    const bank = s[0] <= half ? 0 : (s[0] - half) * lerp(steep, 0.5, west);
    y = Math.min(y, s[1] - 0.25 + bank);
  }
  // the rifts: the water stands 0.4 m under the meadow (brimming at the Springhead); the bed falls away inside the
  // edge. Along a fissure the ground gives way 0.7 m before the water's edge: the lip's own broken rock stands there
  // (the two runs have no lip: their banks fall to the water in a pace, their beds lie under a pace of water)
  if (rho < 1.12) { const r = riftAt(e, n), rift = r[1] < 5, d = r[0] + (rift ? 0.7 : 0), top = r[1] === 6 ? runWater(r[2]) - 0.3 : K.WATER + (rift ? -0.25 : r[1] === 7 ? -0.3 : 0.02);
    if (d < 0.9) y = Math.min(y, d >= 0 ? lerp(top, y, smoothstep(0, 0.9, d)) : Math.max(r[1] > 5 ? top - 0.85 : K.WATER - 1.9, top + d * 1.5)); }
  // the rock over and beside the heart's mouth: shoulders at either end of it, and behind its cave a brow that
  // stands 3 m and more over the mouth's top
  if (hOut < 1.5 && hOut > -16 && hAl < HEART.hw + 10) {
    if (hOut <= -3.2) { const k = smoothstep(-3.2, -4.4, hOut) * (1 - smoothstep(HEART.hw + 3, HEART.hw + 10, hAl)); if (k > 0) y = Math.max(y, lerp(y, HEART.y + HEART.h + 3.2 + 0.7 * (-hOut - 3.2), k)); }
    else if (hAl > HEART.hw + 0.5) { const k = smoothstep(HEART.hw + 0.5, HEART.hw + 2, hAl) * (1 - smoothstep(HEART.hw + 5, HEART.hw + 10, hAl)) * smoothstep(1.5, -0.5, hOut); if (k > 0) y = Math.max(y, lerp(y, HEART.y + HEART.h + 1.6, k)); } }
  return y;
}

// ---------------------------------------------------------------- THE WORKS: one station, rectangles only (the same on every seed)
// A block of concrete in the plan: centre (e, n), y0 to y1, half length along its own axis, half depth across, the bearing
// its length runs on. tone: 0 wall, 1 floor or slab, 2 timber, 3 white enamel or paint, 4 zinc.
// extra.open: lit openings in one long face: { side (+1: the face that looks along bearing brg + 90; -1 the other),
// u (metres along from the centre), w (the lit pane's width), v0, v1 (its heights), kind: 'slit' | 'window' | 'door' |
// 'doorway' }. Every opening is a splayed hollow 0.45 m deep with a dark reveal and a full warm pane behind it, and no
// lit pane is under a metre in its small dimension. extra.rise: the top climbs by this much along the length.
const blk = (k, e, n, y0, y1, hl, hd, brg = 90, tone = 0, extra = null) => ({ k, e, n, y0, y1, hl, hd, brg, tone, ...(extra || {}) });
const along = (o, brg, d) => { const b = onBearing(brg); return [o[0] + b[0] * d, o[1] + b[1] * d]; };
// the court's lit windows (five in the west wall, six in the east), one lit doorway to each wall: n of each
export const WINDOWS = { west: [303.5, 311.5, 327.5, 336, 345], east: [302.5, 310, 317.5, 325, 340.5, 347.5] };
export const DOORWAYS = { west: 319.5, east: 333 };
// THE COURT'S CONDUIT in three lengths [wall (1 west, -1 east), from n, to n]: on the west wall either side of its
// doorway; on the east wall from the stair's foot to its doorway, where the run turns in through the wall
export const CONDUIT = [[1, K.COURT.n0 + 0.4, DOORWAYS.west - 1.4], [1, DOORWAYS.west + 1.4, K.COURT.n1 - 0.4], [-1, K.COURT.n0 + 0.4, DOORWAYS.east - 1.4]];
// the east edge of the ramp's floor, 6 m right of the line
export const rampEast = (n) => rampMid(n) + K.RAMP.right;
export const PILASTERS = { west: [305.4, 313.1, 321.4, 331.7, 338.2, 351], east: [304.2, 313.75, 323.3, 339.05, 350] };
export function worksBlocks() {
  const B = [], D = K.DOOR, R = K.ROOF, C = K.COURT, M = K.ROOM, F = K.FLOOR, L = K.LIP, S = K.STAIR, wT = 1.1;
  // THE BROW: the seaward post in the bank behind the beach: one slit a metre tall under a roof lip that overhangs 0.6 m
  { const W = K.BROW, o = [W.e, W.n], f = W.face, back = along(o, f + 180, 1.6), lip = along(o, f + 180, 1.1);
    B.push(blk('the brow', back[0], back[1], W.y0 - 3.6, W.y1, W.w / 2, 1.6, f + 90, 0, { open: [{ side: -1, u: 0, w: 9, v0: W.slit[0], v1: W.slit[1], kind: 'slit' }] }));
    B.push(blk('the brow', lip[0], lip[1], W.y1, W.y1 + 0.5, W.w / 2 + 0.6, 1.7, f + 90, 1)); }
  // THE BANK DOOR: an upright casemate face with one deep doorway in its middle under a roof lip that overhangs
  // 0.4 m, two short wing walls splayed 35 degrees whose tops fall away from the face, a swept apron with a low wall
  { const o = [D.e, D.n], f = D.face, back = along(o, f + 180, 1.5), lip = along(o, f + 180, 1.3);
    B.push(blk('the door\'s face', back[0], back[1], F - 0.5, D.y1, D.w / 2, 1.5, f + 90, 0, { open: [{ side: -1, u: D.du, w: D.dw, v0: F, v1: F + D.dh, kind: 'door', deep: D.deep, splay: 0.14 }] }));
    B.push(blk('the door\'s face', lip[0], lip[1], D.y1, D.y1 + 0.45, D.w / 2 + 0.5, 1.7, f + 90, 1));
    for (const s of [1, -1]) { const end = along(o, f + s * 90, D.w / 2 + 0.2), mid = along(end, f + s * 35, 1.1); B.push(blk('the door\'s wing walls', mid[0], mid[1], F - 1.5, 11.4, 1.1, 0.4, f + s * 35, 0, { rise: -2.2 })); }
    const ap = along(o, f, 2.6); B.push(blk('the apron', ap[0], ap[1], F - 2.2, F, 3.6, 2.7, f + 90, 1));
    const aw = along(o, f, 5.1); B.push(blk('the apron wall', aw[0], aw[1], F, F + 0.55, 3.6, 0.22, f + 90)); }
  // two walls on the stream's east bank, facing the Works: the gully's east wall and the training wall beside the roof
  B.push(blk('the east wall', 18.6, 188, 9.3, 12.2, 16.05, 0.4, 4.3), blk('the training wall', 22.45, 240, 10.9, 13.9, 28.2, 0.4, 6));
  // THE ROOF: one bare slab among roots
  B.push(blk('the roof slab', (R.e0 + R.e1) / 2, (R.n0 + R.n1) / 2, L - 0.9, L, (R.n1 - R.n0) / 2, (R.e1 - R.e0) / 2, 0, 1));
  // THE STAIR'S side walls (11 m apart) and THE COURT'S long walls, each under a coping that overhangs the court by 0.6 m
  for (const s of [-1, 1]) B.push(blk('the stair\'s walls', S.e + s * (S.w / 2 + wT / 2), (S.n0 + S.n1) / 2, F - 0.5, L + 0.4, (S.n1 - S.n0) / 2 + 0.6, wT / 2, 0));
  const win = (n, mid) => ({ u: n - mid, w: 1.4, v0: 11.7, v1: 13.5, kind: 'window' }), dwy = (n, mid) => ({ u: n - mid, w: 1.2, v0: F, v1: F + 2.2, kind: 'doorway' }), cm = (C.n0 + C.n1) / 2, ch = (C.n1 - C.n0) / 2;
  B.push(blk('the court\'s walls', C.e0 - wT / 2, cm, F - 0.5, L, ch, wT / 2, 0, 0, { open: [...WINDOWS.west.map((n) => ({ side: 1, ...win(n, cm) })), { side: 1, ...dwy(DOORWAYS.west, cm) }] }));
  B.push(blk('the court\'s walls', C.e1 + wT / 2, cm, F - 0.5, L, ch, wT / 2, 0, 0, { open: [...WINDOWS.east.map((n) => ({ side: -1, ...win(n, cm) })), { side: -1, ...dwy(DOORWAYS.east, cm) }] }));
  B.push(blk('the court\'s copings', C.e0 - wT / 2 + 0.3, cm, L, L + 0.4, ch, wT / 2 + 0.3, 0, 1), blk('the court\'s copings', C.e1 + wT / 2 - 0.3, cm, L, L + 0.4, ch, wT / 2 + 0.3, 0, 1));
  B.push(blk('the court\'s floor', (C.e0 + C.e1) / 2, cm, F - 0.4, F, ch, (C.e1 - C.e0) / 2, 0, 1));
  // PILASTERS at the court's bays: shallow piers 0.6 m wide standing 0.14 m proud of each long wall from the floor to
  // the coping, each between two openings and a metre and more from any lamp and any root curtain of its wall
  for (const n of PILASTERS.west) B.push(blk('the court\'s pilasters (west)', C.e0 + 0.07, n, F, L, 0.3, 0.07, 0));
  for (const n of PILASTERS.east) B.push(blk('the court\'s pilasters (east)', C.e1 - 0.07, n, F, L, 0.3, 0.07, 0));
  // THE YARD west of the ramp (floor y 9): its west wall runs on as the room's back wall; a short south wall
  { const cn = (C.n1 - 1 + M.n1) / 2 + 0.55; B.push(blk('the yard\'s walls', M.e0 - wT / 2, cn, F - 0.5, L, (M.n1 - C.n1 + 1) / 2 + 0.55, wT / 2, 0, 0, { open: [{ side: 1, u: M.door - cn, w: 1.2, v0: F, v1: F + 2.2, kind: 'doorway', leaf: 1 }] })); }
  B.push(blk('the yard\'s walls', (M.e0 + C.e0) / 2 - 0.5, C.n1 - 1.55, F - 0.5, L + 0.4, (C.e0 - M.e0) / 2 - 0.6, wT / 2, 90));
  B.push(blk('the yard\'s floor', (M.e0 + K.RAMP.west) / 2, (C.n1 - 1 + M.n0) / 2, F - 0.4, F, (M.n0 - C.n1 + 1) / 2, (K.RAMP.west - M.e0) / 2, 0, 1));
  // THE RAMP: its east wall in five straight lengths 6 m right of the line; under its west edge a retaining wall
  // whose top climbs with the ramp (a kerb 0.15 m over it)
  for (let i = 0; i < 5; i++) { const n0 = 352 + i * 8, n1 = n0 + 8, e0 = rampEast(n0) + wT / 2, e1 = rampEast(n1) + wT / 2, brg = Math.atan2(e1 - e0, n1 - n0) / RAD;
    B.push(blk('the ramp\'s east wall', (e0 + e1) / 2, (n0 + n1) / 2, F - 0.5, L + 0.4, Math.hypot(e1 - e0, n1 - n0) / 2 + 0.12, wT / 2, brg)); }
  B.push(blk('the ramp\'s west edge', K.RAMP.west + 0.25, (352 + M.n0) / 2, F - 0.5, rampY(352) + 0.15, (M.n0 - 352) / 2, 0.25, 0, 0, { rise: rampY(M.n0) - rampY(352) }));
  // THE ROOM (open-fronted on purpose, whole): west wall and north wall full height. The lit doorway onward stands in
  // the WEST wall (the room's side wall as it is come upon from the court), 2.8 m west of the table's end, with a leaf
  // ajar; the north wall behind the table is plain concrete with one shelf. On the yard a parapet 1.2 m high from the
  // ramp to the table's west end, the way in left open west of it; seven square piers carry the roof lip; on the ramp
  // the ramp's retaining wall rising a metre over the ramp, with two more piers
  B.push(blk('the room\'s walls', (M.e0 + M.e1) / 2 + 0.3, M.n1 + wT / 2, F - 0.5, L, (M.e1 - M.e0) / 2 + 0.85, wT / 2, 90));
  B.push(blk('the room\'s shelf', M.e0 + 6.2, M.n1 - 0.17, F + 1.44, F + 1.5, 2.9, 0.17, 90, 1, { tilt: 0 }));
  B.push(blk('the room\'s parapet', (M.e0 + 2.8 + M.e1) / 2, M.n0 + 0.25, F - 0.4, F + 1.2, (M.e1 - M.e0 - 2.8) / 2, 0.25, 90));
  for (let i = 0; i < 7; i++) B.push(blk('the room\'s piers', M.e0 + 0.25 + i * (M.e1 - M.e0 - 0.5) / 6, M.n0 + 0.25, i < 2 ? F - 0.4 : F + 1.2, L - 0.45, 0.25, 0.25, 90));
  B.push(blk('the room\'s ramp side', M.e1 + 0.25, (M.n0 + M.n1) / 2, F - 0.5, rampY(M.n0) + 1.0, (M.n1 - M.n0) / 2, 0.25, 0, 0, { rise: rampY(M.n1) - rampY(M.n0) }));
  for (const n of [378, M.n1 - 0.25]) B.push(blk('the room\'s piers', M.e1 + 0.25, n, rampY(n) + 1.0, L - 0.45, 0.25, 0.25, 0));
  B.push(blk('the room\'s floor', (M.e0 + M.e1) / 2, (M.n0 + M.n1) / 2, F - 0.4, F, (M.n1 - M.n0) / 2, (M.e1 - M.e0) / 2, 0, 1));
  // its roof: one slab cracked along ONE root line (e -24.5): the east part lies level on the piers with its lip
  // out 0.6 m; the west part is lifted 1.1 m along the crack by the fig's root under it, hinged on the back wall
  B.push(blk('the room\'s roof', (-24.5 + M.e1 + 0.3) / 2, (M.n0 - 0.6 + M.n1) / 2, L - 0.45, L, (M.n1 - M.n0 + 0.6) / 2, (M.e1 + 0.3 + 24.5) / 2, 0, 1, { tilt: 0 }));
  B.push(blk('the room\'s roof', (M.e0 - 24.5) / 2, (M.n0 - 0.6 + M.n1) / 2, L - 0.45 + 0.55, L + 0.55, (M.n1 - M.n0 + 0.6) / 2, (24.5 + M.e0) / -2, 0, 1, { tilt: 11.5 }));
  // inside: a long plain table on two trestles, a bench that is a slab on two blocks
  B.push(blk('the room\'s table', M.e0 + 6.2, M.n0 + 3.2, F + 0.82, F + 0.9, 3.4, 0.5, 90, 2, { tilt: 0 }), blk('the room\'s bench', M.e0 + 6.2, M.n0 + 1.9, F + 0.42, F + 0.5, 2.8, 0.2, 90, 1, { tilt: 0 }));
  for (const s of [-2.3, 2.3]) B.push(blk('the table\'s trestles', M.e0 + 6.2 + s, M.n0 + 3.2, F, F + 0.82, 0.05, 0.42, 90, 2), blk('the bench\'s blocks', M.e0 + 6.2 + s * 0.9, M.n0 + 1.9, F, F + 0.42, 0.15, 0.18, 90, 0));
  // THE SILL POST: a weather post on the sill's left shoulder, floor y 29, a slit a metre tall round its north-east
  // corner (7 m of the east face, 3.5 m of the north face), a roof lip out 0.6 m
  { const Q = K.POST, f0 = Q.floor, top = f0 + Q.h, nm = (Q.n0 + Q.n1 - 0.8) / 2;
    B.push(blk('the sill post', (Q.e0 + Q.e1) / 2, nm, f0 - 1.5, top, (Q.n1 - 0.8 - Q.n0) / 2, (Q.e1 - Q.e0) / 2, 0, 0, { open: [{ side: 1, u: (Q.n1 - 0.8 - 6.2 + Q.n1 - 0.8) / 2 - nm, w: 6.2, v0: f0 + 1.2, v1: f0 + 2.2, kind: 'slit', toEnd: 1 }] }));
    // the north face: plain to the west; to the east the slit runs on round the corner as one opening (a lit core
    // set 0.45 m in, between a lower and an upper length of wall)
    B.push(blk('the sill post', Q.e0 + 1.25, Q.n1 - 0.4, f0 - 1.5, top, 1.25, 0.4, 90), blk('the sill post', Q.e0 + 4.25, Q.n1 - 0.4, f0 - 1.5, f0 + 1.2, 1.75, 0.4, 90));
    B.push(blk('the sill post', Q.e0 + 4.25, Q.n1 - 0.4, f0 + 2.2, top, 1.75, 0.4, 90, 0, { under: 1 }), blk('the sill post (lit core)', Q.e0 + 4.025, Q.n1 - 0.625, f0 + 1.2, f0 + 2.2, 1.525, 0.175, 90, 5));
    B.push(blk('the sill post', (Q.e0 + Q.e1) / 2, (Q.n0 + Q.n1) / 2, top, top + 0.45, (Q.n1 - Q.n0) / 2 + 0.6, (Q.e1 - Q.e0) / 2 + 0.6, 0, 1));
    // on its roof: a closed white louvred box on one concrete plinth
    B.push(blk('the screen\'s plinth', 1.4, 450.6, top + 0.45, top + 1.65, 0.3, 0.3, 0), blk('the louvred screen', 1.4, 450.6, top + 1.65, top + 2.35, 0.4, 0.4, 0, 3)); }
  // the cascades' east wall: a low training wall whose top climbs with the white water
  // (no wall stands along the cascades: its top stood out of the east bank as a pale flat sliver beside the line)
  return B;
}

// ---------------------------------------------------------------- fittings: kerbs, cowls, lamps, pots
// TEN LIGHT WELLS as kerbs in one row on bearing 332 along the roof, from above the door's bank to the stair head, and
// one at the sill's south foot (none north of the sill: amber stays out of the basin): [e, n, ground y]
export function kerbs() {
  const out = [], b = onBearing(K.ROOF.row);
  for (let i = 0; i < 10; i++) out.push([0.5 + b[0] * 5.94 * i, 218.8 + b[1] * 5.94 * i, K.LIP]);
  out.push([4, 440, groundAt(4, 440)]);
  return out;
}
// ELEVEN VENT COWLS: one behind the brow, seven on the roof (each 6 m or more from any kerb, each on a concrete
// plinth that carries a lamp), three on the post's roof: [e, n, group]. None stands on the meadow: nothing small
// lies beside the line where it comes into the basin. Of the eleven only the post's three are BUILT (gone: false): the
// brow's and the roof's are places alone, and on the roof each place keeps its lamp on a short post
const COWL_AT = [[-24.6, 141.8, 0], [0.5, 243, 1], [-12.5, 226, 1], [-24, 214, 1], [-28, 252, 1], [-5.5, 264, 1], [-21, 237, 1], [-10, 210, 1], [4.5, 448.6, 2], [1.5, 453.6, 2], [4.4, 455.4, 2]];
export function cowls(rng) {
  const out = COWL_AT.map(([e, n, g]) => ({ e, n, group: g, gone: g !== 2, plinth: g === 1 ? 0.9 : 0, y: g === 1 ? K.LIP + 0.9 : g === 2 ? K.POST.floor + K.POST.h + 0.45 : groundAt(e, n) + 0.2, h: g === 1 ? rng.range(0.9, 1.7) : rng.range(1.5, 2.6), bent: false, turn: rng.range(0, 360) }));
  // how many of the roof's seven carry a bent head (one, two, five or six), and how many of the brow's one and the
  // post's three beside them: each pair is one whose kinds, on the roof and in all, come to counts the owner's terms
  // allow
  const r = rng.pick([1, 2, 5, 6]), o = rng.pick({ 1: [0, 1, 4], 2: [0, 3, 4], 5: [0, 1, 4], 6: [0, 3, 4] }[r]);
  rng.shuffle(out.filter((c) => c.group === 1)).slice(0, r).forEach((c) => { c.bent = true; });
  rng.shuffle(out.filter((c) => c.group === 0 || c.group === 2)).slice(0, o).forEach((c) => { c.bent = true; });
  return out;
}
// POTS of seedlings ('pots'), each [e, n, y, size, leaves of its tuft (five to seven), turn]: a row of five to seven on
// the apron's wall, on the room's table and on the shelf behind it; a row of six or seven at the foot of each of the
// court's long walls; one on each of the west wall's five window sills. By these ranges no row, no place (the room
// 10 to 14, the court 17 to 19) and no whole (32 to 40) comes to a count the owner's terms do not allow
export function potRows(rng) {
  const D = K.DOOR, M = K.ROOM, C = K.COURT, F = K.FLOOR, aw = along([D.e, D.n], D.face, 5.1);
  const pot = (e, n, y) => [e, n, y, rng.range(0.8, 1.2), rng.int(5, 7), rng.range(0, 360)];
  const row = (o, brg, len, y, k) => { const out = []; for (let i = 0; i < k; i++) { const q = along(o, brg, (i - (k - 1) / 2) * len / 7 + rng.range(-0.12, 0.12)); out.push(pot(q[0], q[1], y)); } return out; };
  return [{ k: 'the apron wall', pots: row(aw, D.face + 90, 6.6, F + 0.55, rng.pick([5, 6, 7])) }, { k: 'the room\'s table', pots: row([M.e0 + 6.2, M.n0 + 3.2], 90, 5.6, F + 0.9, rng.pick([5, 6, 7])) },
    { k: 'the room\'s shelf', pots: row([M.e0 + 6.2, M.n1 - 0.17], 90, 5, F + 1.5, rng.pick([5, 6, 7])) },
    { k: 'the foot of the court\'s west wall', pots: row([C.e0 + 0.4, 308], 0, 13, F, rng.pick([6, 7])) }, { k: 'the foot of the court\'s east wall', pots: row([C.e1 - 0.4, 341.5], 0, 11, F, rng.pick([6, 7])) },
    { k: 'the sills of the court\'s west wall', pots: WINDOWS.west.map((n) => pot(C.e0 + 0.12, n + rng.range(-0.3, 0.3), 11.4)) }];
}
// LAMPS. Every lamp is carried by concrete within its reach: 'soffit' a bulkhead lamp under a roof lip, 'niche' one on a
// wall's face, 'pendant' an enamel shade on a stem from the slab over it. No post, no wire. On any one structure 3, 5,
// 6 or 7, but the bank door, which carries ONE caged lamp under its lintel. The 'lamps' stream deals which of the
// training wall's seven places carry a lamp (five or all seven of them), and each lamp's waver and phase. The owner's numbers are kept off each structure, each wall, each kind, the whole,
// and each group of structures that stand as one place: the outfall (door, apron, east wall, training wall), the
// sunken court (stair, court, yard and ramp, room) and the sill (cascades, post).
export function lamps(rng) {
  const out = [], C = K.COURT, M = K.ROOM, S = K.STAIR, F = K.FLOOR, L = K.LIP, W = K.BROW, D = K.DOOR, Q = K.POST;
  const put = (group, kind, e, n, y, face = 0, drop = 0) => out.push({ group, kind, e, n, y, face, drop, spine: n - 138, waver: 1, phase: 0 });
  for (const s of [-5.5, 0, 5.5]) { const p = along(along([W.e, W.n], W.face, 0.28), W.face + 90, s); put('brow', 'soffit', p[0], p[1], W.y1 - 0.14, W.face); }
  // the door: ONE caged lamp under its lintel, 0.3 m inside the reveal
  { const p = along([D.e, D.n], D.face + 180, 0.3); put('door', 'soffit', p[0], p[1], F + D.dh - 0.14, D.face); out[out.length - 1].caged = true; }
  for (let k = 0; k < 6; k++) { const p = along(along([18.6, 188], 4.3, -13.5 + k * 5.4), 274.3, 0.4); put('east wall', 'niche', p[0], p[1], 11.5, 274.3); }
  const count = rng.pick([5, 7]), which = rng.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, count).sort((a, b) => a - b);
  for (const k of which) { const p = along(along([22.45, 240], 6, -27 + k * 9), 276, 0.4); put('training wall', 'niche', p[0], p[1], 13.2, 276); }
  for (const c of COWL_AT) if (c[2] === 1) { const p = along(c, 62, 0.45); put('roof', 'niche', p[0], p[1], L + 0.55, 62); }
  for (const n of [277, 285, 293]) for (const s of [-1, 1]) put('stair', 'niche', S.e + s * S.w / 2, n, stairY(n) + 1.9, s < 0 ? 90 : 270);
  for (const n of [307.5, 323.5, 340.6]) put('court', 'niche', C.e0, n, 13.6, 90);
  for (const n of [306.2, 321.3, 344]) put('court', 'niche', C.e1, n, 13.6, 270);
  // the yard's west wall: a lamp every 7 m from its south corner to the room's front
  for (const n of [355.5, 362.5, 369.5]) put('ramp', 'niche', M.e0, n, 12.2, 90);
  for (const n of [357, 366, 375]) put('ramp', 'niche', rampEast(n), n, rampY(n) + 1.9, 270);
  for (const n of [376.4, 380]) for (const e of [-28, -25.6, -23.2]) put('room', 'pendant', e, n, 11.4, 0, L - 0.45 - 11.58);
  for (const n of [402, 411, 420, 429, 437]) { const s = streamAt(21, n), c = along([21, 419], -7.5, n - 419), p = along(c, 262.5, 0.4); put('cascades', 'niche', p[0], p[1], s[1] + 2.4, 262.5); }
  for (const n of [450.5, 453, 455.5]) put('post', 'soffit', Q.e1 + 0.3, n, Q.floor + Q.h - 0.14, 90);
  for (const e of [1, 3, 5]) put('post', 'soffit', e, Q.n0 - 0.3, Q.floor + Q.h - 0.14, 180);
  for (const l of out) { l.waver = rng.range(0.5, 1.5); l.phase = rng(); }
  return out;
}
// THE WRECK ON THE BEACH (the same place on every seed; its details are dealt on 'wreck'): the broken middle of an
// airliner lies on the sand east of the stream's mouth, beside the line where it makes its landfall and never across
// it. The tube's middle stands 28 m east of the mouth and 12 m up the beach from the waterline; it lies up the beach
// (its length along bearing 162, the torn seaward end by the wash), so that its long west side takes the low sun and
// looks toward the line; a wing stub stands driven into the sand behind it; an engine pod lies half buried in
// the wash at the water's edge, toward the stream. No lettering, stripe, fin or mark on it; no fire, smoke, figure or body.
export const WRECK = (() => { const e = MOUTH.e + 28, n = shoreN(e) + 12, brg = 162, pe = e - 12; return { e, n, brg, half: 11.5, r: 2, wing: along(along([e, n], brg, 5), brg - 90, 8.5), pod: [pe, shoreN(pe) - 1.3] }; })();
export function dealWreck(rng) {
  const W = WRECK, ax = onBearing(W.brg), len = rng.range(21.5, 24), roll = rng.range(9, 17) * rng.sign(), windows = [rng.int(25, 32), rng.int(25, 32)];
  const a = [W.e - ax[0] * len / 2, W.n - ax[1] * len / 2], b = [W.e + ax[0] * len / 2, W.n + ax[1] * len / 2];
  // (half sunk in the sand, the seaward end the deeper; a side's row of window holes is 25 to 32: by its range never
  // a count the owner's terms do not allow)
  const tube = { a: [a[0], groundAt(a[0], a[1]) + 0.95, a[1]], b: [b[0], groundAt(b[0], b[1]) + 0.35, b[1]], r: W.r, roll, windows, jag: rng.range(0, 100) };
  const wing = { e: W.wing[0], n: W.wing[1], y: groundAt(W.wing[0], W.wing[1]) - 1.2, brg: W.brg + rng.range(20, 50), rise: rng.range(48, 62), span: rng.range(7, 8.5) };
  const pod = { e: W.pod[0], n: W.pod[1], y: Math.max(0, groundAt(W.pod[0], W.pod[1])) + 0.3, brg: rng.range(100, 160), tilt: rng.range(6, 14), r: 1.15, len: 3.3 };
  // a scatter of small pale debris (9 to 14 pieces) and a few seat frames (3 or 5) from the tube up the beach to the
  // tree line: none within 7 m of the line, in the stream, on the tube or on another piece
  const bits = [], want = rng.int(9, 14), seats = rng.pick([3, 5]);
  for (let i = 0; i < 400 && bits.length < want + seats; i++) { const seat = bits.length >= want, e = W.e + rng.range(-17, 21), d = seat ? rng.range(15, 34) : rng.range(5, 40), n = shoreN(e) + d, size = seat ? 1 : rng.range(0.5, 1.7), rot = rng.range(0, 360), tilt = seat ? (rng() < 0.4 ? rng.range(70, 95) : rng.range(-6, 6)) : rng.range(4, 26), kind = seat ? 2 : rng() < 0.4 ? 1 : 0;
    if (nearLine(e, n)[0] < 7 || streamAt(e, n)[0] < 4.5 || onWorks(e, n, 0.8) || bits.some((q) => Math.hypot(q.e - e, q.n - n) < 2.2)) continue;
    bits.push({ e, n, y: groundAt(e, n), size, rot, tilt, kind }); }
  const cnt = (s) => bits.filter((q) => (q.kind === 2) === s).length;
  while (BARRED.has(cnt(false))) bits.splice(bits.map((q) => q.kind === 2).lastIndexOf(false), 1);
  while (BARRED.has(cnt(true))) bits.pop();
  return { tube, wing, pod, bits };
}
// THE LOOKS: one pull at a time, each on a thing at its own PLACE: [name, plan (e, n, y), weight, the metres from
// which it is seen]. The roof has two (the fig's bole, then the kerb row's north end by the stair head); the climb
// holds the cascades' white water; in the basin the eye goes east first, to the far rift under its tall mist, so that
// the way out does not stand dead ahead from the sill on, then to the second rift's lit water beside the line.
// A WINDOW IS FOUND FROM THE THING'S PLACE ALONE: it opens at the first metre of the line (none in the first 40 m)
// at which the thing stands within its seeing distance and within 50 degrees of the heading; it closes where the
// line passes the thing: the last metre before it stands 70 degrees off the heading (a gaze is held within 75; a
// thing that lies close beside the line is let go sooner, at its own angle, so that the eye does not swing).
// Where two windows would overlap, the earlier closes as the later opens: one pull at a time.
const LOOK_THINGS = [
  ['the wreck on the beach', [WRECK.e, WRECK.n, 2.6], 0.5, 120],
  ['the hatch in the forest floor', [HATCH_AT[0], HATCH_AT[1], K.FLOOR - 3.2], 0.7, 62, 42],
  ['the bank door', [K.DOOR.e, K.DOOR.n, K.FLOOR + 2.0], 0.6, 31],
  ['the roof fig\'s bole', [K.ROOFFIG[0], K.ROOFFIG[1], 22], 0.36, 62],
  ['the kerb row\'s north end', [kerbs()[9][0], kerbs()[9][1], K.LIP + 1], 0.42, 45],
  ['the room\'s lamps', [K.ROOM.e0 + 5.5, (K.ROOM.n0 + K.ROOM.n1) / 2 - 0.5, 11.2], 0.55, 90],
  ['the cascades\' white water', [streamE(440), 440, 20.5], 0.42, 50],
  ['the post\'s slit', [K.POST.e1, 453, K.POST.floor + 1.7], 0.4, 30],
  ['the south-east rift under its mist', [RIFTS[3][5][0], RIFTS[3][5][1], 24], 0.6, 140],
  ['the second rift\'s water', [RIFTS[1][4][0], RIFTS[1][4][1], K.WATER], 0.36, 50],
];
export const LOOKS = (() => { const out = [];
  for (const [name, at, weight, reach, shut = 70] of LOOK_THINGS) { let from = -1, to = -1;
    for (let s = 40; s <= LINE_LEN; s += 1) { const q = lineAt(s), d = Math.hypot(at[0] - q[0], at[1] - q[1]), off = Math.abs(((Math.atan2(at[0] - q[0], at[1] - q[1]) / RAD - q[2] + 540) % 360) - 180);
      if (from < 0) { if (d <= reach && off <= 50) from = s; } else if (off > shut) break; else to = s; }
    if (from >= 0 && to > from) out.push({ name, at, from, to, weight }); }
  out.sort((a, b) => a.from - b.from); for (let i = 0; i + 1 < out.length; i++) if (out[i].to > out[i + 1].from) out[i].to = out[i + 1].from;
  return out.filter((k) => k.to - k.from >= 8); })();
// metres flown (in three dimensions) at the line's plan metres s, and the whole
const D3 = (() => { const t = [0]; let d = 0; for (let i = 1; i < LINE2.length; i++) { const a = LINE2[i - 1], b = LINE2[i]; d += Math.hypot(b[0] - a[0], b[1] - a[1], heightAtS(b[2]) - heightAtS(a[2])); t.push(d); } return t; })();
export const flownAt = (s) => { s = clamp(s, 0, LINE_LEN); let lo = 0, hi = LINE2.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (LINE2[m][2] <= s) lo = m; else hi = m; } return lerp(D3[lo], D3[hi], (s - LINE2[lo][2]) / Math.max(1e-6, LINE2[hi][2] - LINE2[lo][2])); };
export const FLOWN = D3[D3.length - 1];
export const planAt = (d) => { d = clamp(d, 0, FLOWN); let lo = 0, hi = D3.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D3[m] <= d) lo = m; else hi = m; } return lerp(LINE2[lo][2], LINE2[hi][2], (d - D3[lo]) / Math.max(1e-6, D3[hi] - D3[lo])); };

// ---------------------------------------------------------------- what grows (dealt): palms, forest, tree ferns
// is (e, n) on or beside a built thing of the Works (with a margin in metres)?
let WB = null;
// THE GREAT BANYAN ('banyan'): one great tree on the roof's west side, where the roof meets the stair down to the
// court (BANYAN: its foot, e, n; H its height). Its stems, boughs, crown and the roots that stand under its boughs
// keep 9 m and more in plan from the line. Buttress roots as thick as a thigh cross the paving (none nearer the line
// than 6.5 m). One great root runs to the stair's west wall and along the court's west coping, 6 m from the line,
// and curtains of aerial roots fall from it down the wall to the treads and the court's floor, clear of the windows
// and the doorway. LANTERNS hang in it: 22 to 27 (never a barred count, in all or at one place): under the boughs
// over the roof, three down the stair's wall, ten down the court's wall, each with its own phase for its sway.
export const BANYAN = { e: -29.5, n: 263, H: 27.5 };
export function dealBanyan(rng) {
  const B = BANYAN, y0 = K.LIP, R = K.ROOF, C = K.COURT, out = { stems: [], boughs: [], crown: [], props: [], butt: [], arm: [], curtains: [], lanterns: [] };
  const far = (e, n) => nearLine(e, n)[0], unbar = (l) => { while (BARRED.has(l.length)) l.pop(); return l; };
  for (let k = 0; k < 7; k++) { const a = k * 0.8976 + rng.range(-0.2, 0.2), r0 = k === 0 ? 0 : rng.range(1.3, 2.1), top = rng.range(9.5, 13), rr = k === 0 ? 1.5 : rng.range(0.7, 1.1), ca = Math.cos(a), sa = Math.sin(a), d1 = r0 * 0.7 + rng.range(0.03, 0.09) * top;
    out.stems.push([[B.e + ca * r0 * 1.3, y0 - 0.3, B.n + sa * r0 * 1.3, rr * 1.6], [B.e + ca * r0, y0 + 1.7, B.n + sa * r0, rr], [B.e + ca * r0 * 0.7 + rng.range(-0.5, 0.5), y0 + top * 0.3, B.n + sa * r0 * 0.7 + rng.range(-0.5, 0.5), rr * 0.9], [B.e + ca * r0 * 0.75 + rng.range(-0.6, 0.6), y0 + top * 0.62, B.n + sa * r0 * 0.75 + rng.range(-0.6, 0.6), rr * 0.78], [B.e + ca * d1, y0 + top, B.n + sa * d1, rr * 0.6]]); }
  // the crown: wide and low-domed, each mass 9 m and more from the line by its own radius; a bough runs to each
  for (let k = 0; k < 24; k++) { const a = k * 2.39996 + rng.range(-0.3, 0.3), r = rng.range(5.4, 7.6); let d = 2.5 + 12.5 * Math.sqrt((k + 0.5) / 24), e = 0, n = 0, ok = false;
    for (let t = 0; t < 12 && !ok; t++, d *= 0.82) { e = B.e + Math.cos(a) * d; n = B.n + Math.sin(a) * d; ok = far(e, n) - r >= 9.2; }
    if (ok) out.crown.push([e, y0 + B.H * (0.52 + 0.25 * (1 - d / 15)) + rng.range(-1, 1), n, r, r * rng.range(0.5, 0.62)]); }
  unbar(out.crown);
  for (const c of out.crown) { const d = Math.hypot(c[0] - B.e, c[2] - B.n), y1 = c[1] - c[4] * 0.5; out.boughs.push([[B.e + (c[0] - B.e) * 0.08, y0 + rng.range(8.5, 11.5), B.n + (c[2] - B.n) * 0.08, 0.5], [B.e + (c[0] - B.e) * 0.55, y1 - 1.2 - 0.12 * d, B.n + (c[2] - B.n) * 0.55, 0.34], [c[0], y1, c[2], 0.16]]); }
  // roots standing under the boughs: down to the paving where the bough is over the slab
  // (each [e, y of its top, n, radius, drift e, drift n, y of its foot]: the paving, or the air for a root still growing)
  for (const b of out.boughs) { const g = []; for (const t of [rng.range(0.15, 0.34), rng.range(0.38, 0.56), rng.range(0.6, 0.78), rng.range(0.82, 0.98)]) { const e = b[1][0] + (b[2][0] - b[1][0]) * t, n = b[1][2] + (b[2][2] - b[1][2]) * t, y = b[1][1] + (b[2][1] - b[1][1]) * t;
    const slab = e > R.e0 + 0.6 && e < R.e1 - 0.6 && n > R.n0 + 0.6 && n < R.n1 - 0.6, down = slab && rng() < 0.55;
    if (far(e, n) >= 9.5 && Math.hypot(e - B.e, n - B.n) > 3.4 && rng() < 0.9) g.push([e, y, n, down ? rng.range(0.12, 0.3) : rng.range(0.04, 0.09), rng.range(-0.25, 0.25), rng.range(-0.25, 0.25), down ? y0 : Math.max(y0 + 2.6, y - rng.range(3, 8))]); }
    out.props.push(...unbar(g)); }
  unbar(out.props);
  // buttress roots across the paving: nine, from south round by east to north, each ending short of the line's 6.5 m,
  // of the slab's edge, of a lamp post
  const posts = [...kerbs().map((q) => [q[0], q[1]]), ...COWL_AT.filter((q) => q[2] === 1).map((q) => [q[0], q[1]])];
  for (let k = 0; k < 9; k++) { const a = (-104 + k * 26 + rng.range(-7, 7)) * RAD, len = rng.range(8, 15), ph = rng.range(0, 6.28), pts = [];
    for (let j = 0; j <= 9; j++) { const t = j / 9, d = 1.3 + len * t, w = 1.0 * Math.sin(j * 1.25 + ph) * t, e = B.e + Math.cos(a) * d - Math.sin(a) * w, n = B.n + Math.sin(a) * d + Math.cos(a) * w, r = 0.33 - 0.25 * t;
      if (j > 0 && (far(e, n) < 6.5 + r || e > R.e1 - 0.8 || e < R.e0 + 0.5 || n < R.n0 + 0.8 || n > R.n1 - 0.5 || posts.some((q) => Math.hypot(q[0] - e, q[1] - n) < 0.8))) break;
      pts.push([e, y0 + r * 0.55, n, r]); }
    if (pts.length > 1) out.butt.push(pts); }
  unbar(out.butt);
  // the great root: from the foot to the roof's north edge, then along the stair's west wall and the court's coping
  out.arm.push([B.e + 1.3, y0 + 1.5, B.n + 1.4, 0.4], [B.e + 3.4, y0 + 0.5, B.n + 5.0, 0.34], [-24.4, y0 + 0.3, R.n1 - 1.6, 0.3], [-23.2, y0 + 0.42, R.n1 + 1.2, 0.28]);
  for (let n = R.n1 + 4; n <= C.n0 + 37; n += 3) out.arm.push([-23.02 + 0.1 * Math.sin(n * 0.7), y0 + 0.4 + 0.24 * (1 - (n - R.n1) / 70), n, 0.27 - 0.17 * (n - R.n1) / 62]);
  // curtains of aerial roots down the wall: two on the stair, five in the court ([n0, n1] each)
  const groups = [[278.5, 282.5, 0], [289, 293, 0], [299.6, 302.4, 1], [305.2, 310.2, 1], [313, 318.2, 1], [321, 326.4, 1], [329, 334.8, 1]]; let strands = 0;
  for (const [n0, n1, court] of groups) { const face = court ? C.e0 + 0.6 : K.STAIR.e - K.STAIR.w / 2, k = rng.pick([7, 9, 10, 11]), g = [];
    for (let i = 0; i < k; i++) { const n = n0 + (n1 - n0) * (i + rng.range(0.15, 0.85)) / k, foot = stairY(n), low = rng() < 0.55 ? foot + 0.02 : foot + rng.range(0.4, 2.6), r = rng.range(0.035, 0.1);
      if (low > y0 - 0.6) continue; g.push({ n, e: face + 0.12 + rng.range(0, 0.22), top: y0 + 0.42, low, r, drift: rng.range(-0.45, 0.45), ph: rng.range(0, 6.28) }); }
    strands += unbar(g).length; out.curtains.push({ n0, n1, court, face, strands: g }); }
  if (BARRED.has(strands)) out.curtains[out.curtains.length - 1].strands.pop();
  // the lanterns: ten down the court's wall (two a curtain), three down the stair's, the rest under the boughs
  const N = rng.pick([22, 24, 25, 26, 27]), lan = (e, n, y, top) => out.lanterns.push({ e, n, y, top, ph: rng(), size: rng.range(0.26, 0.38) });
  for (const g of out.curtains) if (g.court) for (const t of [rng.range(0.14, 0.42), rng.range(0.58, 0.86)]) { const y = K.FLOOR + rng.range(2.4, 5.3); lan(g.face + 0.4, g.n0 + (g.n1 - g.n0) * t, y, y0 + 0.3); }
  for (const n of [280.5 + rng.range(-1, 1), 286.5 + rng.range(-1, 1), 291 + rng.range(-1, 1)]) { const y = Math.min(y0 - 0.9, stairY(n) + rng.range(2.3, 3.6)); lan(K.STAIR.e - K.STAIR.w / 2 + 0.5, n, y, y0 + 0.3); }
  for (let t = 0, made = 0; made < N - 13 && t < 900; t++) { const c = out.crown[rng.int(0, out.crown.length - 1)], a = rng.range(0, 6.2832), d = c[3] * Math.sqrt(rng()) * 0.8, e = c[0] + Math.cos(a) * d, n = c[2] + Math.sin(a) * d, top = c[1] - c[4] * 0.55, y = y0 + rng.range(2.3, 9);
    if (far(e, n) < 9.3 || e < R.e0 + 0.6 || e > R.e1 - 0.6 || n > R.n1 - 0.6 || n < R.n0 + 0.6 || Math.hypot(e - B.e, n - B.n) < 2.6 || y > top - 0.8 || out.lanterns.some((q) => Math.hypot(q.e - e, q.n - n) < 1.5)) continue;
    lan(e, n, y, top); made++; }
  while (BARRED.has(out.lanterns.length) || BARRED.has(out.lanterns.length - 13)) out.lanterns.pop();
  return out;
}
export function onWorks(e, n, m = 0) {
  if (!WB) WB = worksBlocks().map((b) => { const r = b.brg * RAD; return [b.e, b.n, Math.sin(r), Math.cos(r), b.hl, b.hd]; });
  for (const b of WB) { const de = e - b[0], dn = n - b[1]; if (Math.abs(de * b[2] + dn * b[3]) < b[4] + m && Math.abs(de * b[3] - dn * b[2]) < b[5] + m) return true; }
  const R = K.ROOF; if (e > R.e0 - m && e < R.e1 + m && n > R.n0 - m && n < R.n1 + m) return true;
  // (the wreck's place on the beach is kept clear of what grows)
  { const W = WRECK, ax = onBearing(W.brg), de = e - W.e, dn = n - W.n, t = clamp(de * ax[0] + dn * ax[1], -W.half, W.half);
    if (Math.hypot(de - ax[0] * t, dn - ax[1] * t) < W.r + 2.2 + m || Math.hypot(e - W.wing[0], n - W.wing[1]) < 3.5 + m || Math.hypot(e - W.pod[0], n - W.pod[1]) < 2.5 + m) return true; }
  // (the door's draw is kept open: nothing that grows tall stands in it, so the door is seen from the stream)
  if (drawAt(e, n) > 0.2 || Math.hypot(e - HATCH_AT[0], n - HATCH_AT[1]) < 9.5 + m) return true;
  if (n > 271 && n < 393 && e > (n > 351 ? K.ROOM.e0 : K.COURT.e0) - 1.2 - m && e < (n > 351 ? rampEast(n) : K.COURT.e1) + 1.2 + m) return true;
  return false;
}
// a palm's crown as a leaning drum [plan axes e, y, n]: the fronds' reach and sway about the leaning trunk, from the
// lowest frond tips to the top
export function palmCrown(p) { const b = onBearing(p.brg), sl = Math.sin(p.lean * RAD), cl = Math.cos(p.lean * RAD); return { base: [p.e, p.y, p.n], axis: [b[0] * sl, cl, b[1] * sl], y0: 0.5 * p.H, y1: 1.08 * p.H, r: 0.61 * p.H + 1.05 }; }
export function drumDist(q, d) {
  const vx = q[0] - d.base[0], vy = q[1] - d.base[1], vz = q[2] - d.base[2], t = vx * d.axis[0] + vy * d.axis[1] + vz * d.axis[2];
  const dr = Math.hypot(vx - t * d.axis[0], vy - t * d.axis[1], vz - t * d.axis[2]) - d.r, dy = Math.max(d.y0 - t, t - d.y1), o = Math.hypot(Math.max(dr, 0), Math.max(dy, 0));
  return o > 0 ? o : Math.max(dr, dy);
}
// the height of what a thing stands on at (e, n): a floor of the Works (the roof slab, the stair, the court, the yard
// and the room, the ramp), or the ground
export function standAt(e, n) {
  const R = K.ROOF, C = K.COURT, M = K.ROOM, S = K.STAIR;
  if (e > R.e0 && e < R.e1 && n > R.n0 && n < R.n1) return K.LIP;
  if (Math.abs(e - S.e) < S.w / 2 && n >= S.n0 && n <= S.n1) return stairY(n);
  if (e > C.e0 && e < C.e1 && n > C.n0 && n < C.n1) return K.FLOOR;
  if (n >= C.n1 && n < M.n1 && e > M.e0 && e < K.RAMP.west) return K.FLOOR;
  if (n >= K.RAMP.n0 && n <= K.RAMP.n1 && e >= K.RAMP.west && e < rampEast(n)) return rampY(n);
  return groundAt(e, n);
}
// PALMS ('palms'): leaning coconut palms on the beach's back and, one in eight, on the banks of the lower gully between
// the stream's mouth and the brow's bank; none nearer the line than 6 m. West of the stream 17 to 22 stand, east of it
// 14 or 17 (31 to 39 in all). Each leans seaward and toward the stream's mouth: its lean's bearing is due south turned
// to the mouth's side, by 24 degrees far from the mouth and up to 38 beside it (and its own dealt play)
export function dealPalms(rng) {
  const want = [rng.int(17, 22), rng.pick([14, 17])], have = [0, 0], out = [];
  for (let i = 0; i < 470 && have[0] + have[1] < want[0] + want[1]; i++) {
    const c = { e: rng.range(-80, 80), d: rng.range(11, 46), kind: rng.int(0, 2), s: rng.range(0.9, 1.08), rot: rng.range(0, TAU), lean: rng.range(8, 22), ld: rng.range(-40, 40), gully: rng() < 0.125, gn: rng(), gs: rng.sign() };
    let e = c.e, n = shoreN(c.e) + c.d;
    if (c.gully) { n = lerp(MOUTH.n + 14, K.BROW.n + 22, c.gn); e = streamE(n) + c.gs * lerp(4, 9, c.d / 46); }
    const bank = e < streamE(Math.max(n, MOUTH.n)) ? 0 : 1, dl = nearLine(e, n)[0];
    if (have[bank] >= want[bank] || dl < 6 || Math.hypot(e - K.BROW.e, n - K.BROW.n) < 9 || streamAt(e, n)[0] < 3.5 || onWorks(e, n, 2)) continue;
    if (out.some((q) => Math.hypot(q.e - e, q.n - n) < 3.4)) continue;
    const toMouth = MOUTH.e - e, brg = 180 - Math.sign(toMouth) * (24 + 14 * smoothstep(60, 10, Math.abs(toMouth))) + c.ld * 0.5;
    const palm = { e, n, y: groundAt(e, n) - 0.25, kind: c.kind, s: c.s, rot: c.rot, lean: c.lean, brg, H: [12, 14, 16][c.kind] * c.s, bank };
    // no crown within 5 m of the lens, over the line or beside it: the crown's whole drum (reach and sway) against the line
    if (dl < 34) { const D = palmCrown(palm); let near = 1e9; for (const q of LINE2) { if (q[2] > 240) break; near = Math.min(near, drumDist([q[0], heightAtS(q[2]), q[1]], D)); } if (near < 5.2) continue; }
    out.push(palm); have[bank]++;
  }
  // where the beach gave fewer places than were wanted, a bank's count is still one the owner's terms allow
  for (const b of [0, 1]) while (BARRED.has(out.filter((q) => q.bank === b).length)) out.splice(out.map((q) => q.bank).lastIndexOf(b), 1);
  while (BARRED.has(out.length)) out.pop();
  return out;
}
// THE GREAT PLANTS OF THE FOREST: five kinds that differ in outline (the same shapes on every seed; which stands where,
// how tall, how thick and how it leans is dealt). Leaf masses are given as shares of the plant's height:
// [east, up, north, radius, flatness].
//   giant:   a buttressed emergent, 28 to 45 m, its trunk 1.5 to 3 m thick, plank buttresses 3 to 6 m out, a wide
//            crown in three layers (five masses, three, one)
//   canopy:  a round-headed tree of the forest's roof, 17 to 26 m
//   slender: a slender pale tree, 13 to 20 m, standing in a close group of three, five or six; a small high crown
//   fig:     a strangler fig, 20 to 30 m: many stems round a hollow, aerial roots to the ground, a broad low dome
//   parasol: a bare straight bole, 22 to 33 m, under one flat plate of leaves
const ringOf = (k, rad, up, r, flat, turn = 0) => Array.from({ length: k }, (_, i) => { const a = turn + (i / k) * TAU; return [Math.cos(a) * rad * (0.86 + 0.28 * ((i * 7) % 3) / 2), up + 0.02 * ((i * 5) % 3 - 1), Math.sin(a) * rad * (0.86 + 0.28 * ((i * 4) % 3) / 2), r * (0.9 + 0.1 * ((i * 3) % 3)), flat]; });
export const TREE_KINDS = [
  { name: 'giant', H: [28, 45], thick: [0.75, 1.5], lean: 4, top: 0.74, far: 5, masses: [...ringOf(5, 0.25, 0.75, 0.15, 0.5, 0.4), ...ringOf(3, 0.13, 0.87, 0.14, 0.55, 1.3), [0.01, 0.97, 0.0, 0.12, 0.6]] },
  { name: 'canopy', H: [17, 26], thick: [0.3, 0.48], lean: 7, top: 0.68, far: 3, masses: [...ringOf(3, 0.16, 0.78, 0.2, 0.72, 0.2), [0.03, 0.92, -0.02, 0.19, 0.75], [-0.2, 0.7, 0.14, 0.14, 0.7]] },
  { name: 'slender', H: [13, 20], thick: [0.14, 0.22], lean: 9, top: 0.8, far: 3, masses: [[0.02, 0.9, 0.0, 0.15, 0.95], [-0.1, 0.8, 0.07, 0.11, 0.8], [0.1, 0.76, -0.08, 0.1, 0.8]] },
  { name: 'fig', H: [20, 30], thick: [1.1, 1.7], lean: 3, top: 0.5, far: 5, masses: [...ringOf(5, 0.3, 0.66, 0.2, 0.6, 0.9), [0.0, 0.84, 0.03, 0.24, 0.62], [0.12, 0.76, -0.16, 0.17, 0.6]] },
  { name: 'parasol', H: [22, 33], thick: [0.26, 0.4], lean: 5, top: 0.86, far: 3, masses: [...ringOf(5, 0.2, 0.92, 0.14, 0.34, 0.7), [0.0, 0.95, 0.0, 0.15, 0.4]] },
];
// one plant: its foot, height, thickness (its trunk's radius), turn, lean (degrees, toward bearing lb) and its leaf
// masses at their places in the plan
const treeAt = (e, n, kind, H, thick, rot, lean = 0, lb = 0, group = -1) => {
  const y = groundAt(e, n) - 0.3, c = Math.cos(rot), s = Math.sin(rot), T = TREE_KINDS[kind], tl = Math.tan(lean * RAD), b = onBearing(lb);
  return { e, n, y, H, rot, kind, thick, lean, lb, group, big: thick / (0.036 * H),
    clumps: T.masses.map((q) => ({ e: e + (q[0] * c + q[2] * s) * H + b[0] * tl * q[1] * H, y: y + q[1] * H, n: n + (-q[0] * s + q[2] * c) * H + b[1] * tl * q[1] * H, r: q[3] * H, flat: q[4] })) };
};
// the top of a plant's trunk, leaning as it leans: [e, y, n]
export const trunkTop = (t) => { const b = onBearing(t.lb), tl = Math.tan(t.lean * RAD), h = TREE_KINDS[t.kind].top * t.H; return [t.e + b[0] * tl * h, t.y + h, t.n + b[1] * tl * h]; };
// the hero figs stand where the plan sets them: over the roof slab's west edge, at the room's back, and on the bank
// over the door (its roots come down the door's face)
export const DOORFIG = along(along([K.DOOR.e, K.DOOR.n], K.DOOR.face + 180, 8), K.DOOR.face + 90, 3);
export const FIGS = [[K.ROOFFIG[0], K.ROOFFIG[1], 30, 1.6], [K.ROOM.fig[0], K.ROOM.fig[1], 28, 1.45], [DOORFIG[0], DOORFIG[1], 24, 1.25]];
// GLADES ('glades'): four to six small openings in the forest, 12 to 60 m from the line between the brow and the
// sill, each 8 to 14 m in radius, where no great plant stands (the low sun comes in to the forest floor there); and
// one by the plan, round the post on the sill: the last sunlit ground before the peak's shade. [e, n, radius]
// the forest's floor lies between two places of the plan, the brow's bank and the sill's crest: their line metres,
// found by the nearest point of the line
export const floorSpan = () => [nearLine(K.BROW.e, K.BROW.n)[1], nearLine(K.SILL.e, K.SILL.n)[1]];
export function dealGlades(rng) {
  const out = [[(K.POST.e0 + K.POST.e1) / 2 + 6, (K.POST.n0 + K.POST.n1) / 2 - 2, 17]], want = rng.pick([4, 5, 6]), [s0, s1] = floorSpan();
  for (let i = 0; i < 60 && out.length < want + 1; i++) { const s = rng.range(s0 + 14, s1 - 6), side = rng.sign(), off = rng.range(12, 60), r = rng.range(8, 14), q = lineAt(s), b = onBearing(q[2] + 90), e = q[0] + b[0] * side * off, n = q[1] + b[1] * side * off;
    if (onWorks(e, n, r * 0.5) || out.some((g) => Math.hypot(g[0] - e, g[1] - n) < g[2] + r + 6)) continue; out.push([e, n, r]); }
  if (out.length === 4) out.pop();
  return out;
}
// THE FOREST'S PLAN ('forest'): uneven. A slow field of chance (laid by the stream) makes close stands, thin woods and
// open ground with lone giants; glades are left open. Every cell of a 10.5 m lattice makes the same draws whether a
// plant stands in it or not. By place: no trunk on the beach's sand, on or beside the Works, in the stream's bed, in
// the basin or in a glade; a giant's trunk no nearer the line than 14 m (its buttresses reach 6 m), a canopy tree's
// 8 m, a slender tree's 6.5 m; no leaf mass within 5.5 m of the lens. No two neighbours of a kind are alike in size
// and lean.
// THE RADIO MAST stands on the post's roof, the Works' highest roof, which closes the view down the court's length:
// its foot [e, n], the roof's top (y) and its height (H). A three-legged steel lattice, stayed to the roof and to
// the ground west of it (no stay goes toward the line).
export const MAST = { e: 2.6, n: 453.6, y: K.POST.floor + K.POST.h + 0.45, H: 40 };
// THE MAST'S HEAD IS KEPT IN SIGHT from the sea, the beach and the court: the sight lines from every tenth metre of
// the line's first 130 m, and from every sixth metre of the line along the stair, the court and the ramp, to the
// mast's head (from the court to its middle too). No great tree's crown stands across them.
const MAST_SIGHT = (() => { const out = [], head = MAST.y + MAST.H; for (let s = 0; s <= 130; s += 10) { const q = lineAt(s); out.push([q[0], q[1], heightAtS(s), head]); }
  for (let s = 0; s < LINE_LEN; s += 6) { const q = lineAt(s); if (q[1] > K.COURT.n0 - 20 && q[1] < K.RAMP.n1) out.push([q[0], q[1], heightAtS(s), head], [q[0], q[1], heightAtS(s), MAST.y + 0.55 * MAST.H]); }
  return out; })();
export const acrossMastSight = (e, n, top, r) => { for (const q of MAST_SIGHT) { const de = MAST.e - q[0], dn = MAST.n - q[1], t = ((e - q[0]) * de + (n - q[1]) * dn) / (de * de + dn * dn); if (t <= 0.02 || t >= 0.985) continue;
  if (Math.hypot(e - q[0] - de * t, n - q[1] - dn * t) < r && top > q[2] + (q[3] - q[2]) * t - 1) return true; } return false; };
// THE SUN'S LANES: the low sun (bearing 292) comes to the roof and to the court down two open lanes in the forest
// west of them, as long shafts with the trunks' long shadows beside them: no great tree stands with its crown
// across a lane, from the roof's (the court's) west edge out to 95 m up the sun's bearing. [where a lane meets the edge]
const SUN_B = onBearing(292), LANES = [[K.ROOF.e0, 241], [K.COURT.e0, 323]];
export const inSunLane = (e, n, r) => LANES.some((q) => { const de = e - q[0], dn = n - q[1], al = de * SUN_B[0] + dn * SUN_B[1]; return al > -3 && al < 95 && Math.abs(de * SUN_B[1] - dn * SUN_B[0]) < 2 + r; });
const runAll = (it) => { let r; while (!(r = it.next()).done); return r.value; };
export const dealForest = (rng, glades) => runAll(dealForestSteps(rng, glades));
function* dealForestSteps(rng, glades) {
  const out = [], CELL = 10.5, ox = rng.range(0, 900), oz = rng.range(0, 900);
  FIGS.forEach((f, i) => out.push(treeAt(f[0], f[1], 3, f[2], f[3], 0.7 * f[1], i === 2 ? 2 : 1, 100 + 70 * i)));
  const free = (e, n, m) => !(shoreDist(e, n) < 50 || onWorks(e, n, m) || streamAt(e, n)[0] < 6.5 + m * 0.25 || Math.hypot((e - K.BASIN.e) / K.BASIN.re, (n - K.BASIN.n) / K.BASIN.rn) < 1.04 || glades.some((g) => Math.hypot(g[0] - e, g[1] - n) < g[2]));
  let group = 0;
  for (let j = 0; j < 37; j++) { if (j % 6 === 5) yield; for (let i = 0; i < 22; i++) {
    const e = -114 + (i + rng.range(0.08, 0.92)) * CELL, n = 128 + (j + rng.range(0.08, 0.92)) * CELL, kd = rng(), sz = rng(), th = rng(), rot = rng.range(0, TAU), ln = rng(), lb = rng.range(0, 360), keep = rng(), gk = rng.pick([3, 5, 6]), gs = rng.fork('stems');
    const dl = nearLine(e, n)[0], f = NZ.fbm2(e / 46 + ox, n / 46 + oz, 2), dense = smoothstep(-0.05, 0.3, f), open = smoothstep(-0.05, -0.32, f);
    if (keep > lerp(0.34, 0.97, dense) * (dl > 60 ? 0.6 : 1)) continue;
    // which kind: lone giants on open ground and as emergents in a stand; slender groups and figs near the line;
    // the forest's roof is canopy trees
    const kind = kd < 0.1 + 0.5 * open ? 0 : dl < 62 && kd > 0.955 ? 3 : dl < 70 && kd > 0.8 - 0.1 * dense ? 2 : kd < 0.3 + 0.5 * open ? 4 : 1, T = TREE_KINDS[kind];
    if (dl < [14, 8, 6.5, 14, 8][kind] || !free(e, n, [7, 4.5, 3, 7, 4.5][kind]) || out.some((t) => t.kind === 3 && Math.hypot(t.e - e, t.n - n) < 14)) continue;
    const H = lerp(T.H[0], T.H[1], sz), thick = lerp(T.thick[0], T.thick[1], 0.6 * sz + 0.4 * th), lean = T.lean * ln;
    if (inSunLane(e, n, 0.22 * H) || (n > 140 && Math.abs(e) < 40 && acrossMastSight(e, n, groundAt(e, n) + H, 0.3 * H + 1.5))) continue;
    if (kind !== 2) { out.push(treeAt(e, n, kind, H, thick, rot, lean, lb)); continue; }
    // a close group of slender trees: its stems within 4.2 m, each of its own height and lean, leaning outward
    for (let k = 0; k < gk; k++) { const a = (k / gk) * TAU + gs.range(-0.5, 0.5), d = k === 0 ? 0 : gs.range(1.6, 4.2), se = e + Math.cos(a) * d, sn = n + Math.sin(a) * d, sh = H * gs.range(0.74, 1.12), sl = gs.range(1, 9);
      if (nearLine(se, sn)[0] < 6.5 || !free(se, sn, 2)) continue; out.push(treeAt(se, sn, 2, sh, thick * gs.range(0.8, 1.15), gs.range(0, TAU), sl, k === 0 ? lb : Math.atan2(Math.cos(a), Math.sin(a)) / RAD, group)); }
    { let k = 0; for (const t of out) if (t.group === group) k++; if (k === 4 || k === 8) out.pop(); }
    group++;
  } }
  yield;
  // no two neighbours of a kind alike in size and lean: the later one of such a pair is made a sixth taller or
  // shorter and leans three degrees more
  for (let i = 0; i < out.length; i++) for (let j = 0; j < i; j++) { const a = out[i], b = out[j]; if (a.kind !== b.kind || Math.hypot(a.e - b.e, a.n - b.n) > 16) continue;
    if (Math.abs(a.H / b.H - 1) < 0.1 && Math.abs(a.lean - b.lean) < 2) { const k = (i % 2 ? 1.17 : 0.85), T = TREE_KINDS[a.kind]; out[i] = treeAt(a.e, a.n, a.kind, clamp(a.H * k, T.H[0] * 0.8, T.H[1] * 1.05), a.thick, a.rot, a.lean + 3, a.lb, a.group); } }
  // no kind's total, and no whole, comes to a count the owner's terms do not allow: the last dealt plant of the kind is
  // left out (never a hero fig; of the slender trees one whose group stays three, five or more, or else a whole
  // group of three)
  for (let g = 0; g < 40; g++) { const tot = [0, 0, 0, 0, 0]; for (const t of out) tot[t.kind]++; let k = tot.findIndex((c) => BARRED.has(c)); if (k < 0 && BARRED.has(out.length)) k = 1; if (k < 0) break;
    const size = (gr) => out.filter((q) => q.group === gr).length; let i = out.length - 1;
    for (; i >= FIGS.length; i--) { const t = out[i]; if (t.kind !== k) continue; if (k === 2) { const m = size(t.group) - 1; if (m < 3 || m === 4 || m === 8) continue; } break; }
    if (i >= FIGS.length) { out.splice(i, 1); continue; }
    if (k !== 2) break;
    const last = out.map((t) => t.kind === 2 && size(t.group) === 3).lastIndexOf(true); if (last < 0) break; const gr = out[last].group; for (let j = out.length - 1; j >= 0; j--) if (out[j].group === gr) out.splice(j, 1); }
  // no mass's leaves (its reach and sway: 1.5 times its core and 0.7 m) within 5 m of the lens, by place
  for (const t of out) { t.clumps = t.clumps.filter((c) => { const q = nearLine(c.e, c.n); return Math.hypot(q[0], c.y - heightAtS(q[1])) > c.r * 1.5 + 0.7 + 5; }); if (t.clumps.length === 4 || t.clumps.length === 8) t.clumps.pop(); }
  return out;
}
// THE FOREST'S FLOOR AND UNDERSTORY ('understory'). Everything here stands between two places of the plan, the brow's
// bank and the sill's crest (turned into line metres by the nearest point of the line): thick within 25 m of the line,
// thinner out to 48 m. By place: nothing on the Works (1.2 m), in the stream's bed, on ground steeper than one in one
// or within 7.5 m of a lip the line crosses; within 7 m of the line's track nothing taller than 1.2 m; a sapling
// stands 9 m and more from it. Kinds: 0 low fern, 1 broad-leaved plant, 2 seedling, 3 shrub (1 to 3 m), 4 sapling
// (2 to 6 m). Dealt in lots (the plan rests between them): lot k of `lots`.
export function dealUnderstory(rng, out, count) {
  const [s0, s1] = floorSpan();
  for (let i = 0; i < count; i++) { const far = rng() < 0.22, s = rng.range(s0, s1), side = rng.sign(), u = rng(), kd = rng(), sz = rng(), rot = rng.range(0, TAU), off = far ? lerp(25, 48, u) : 4.8 + 20.2 * Math.pow(u, 1.3);
    const q = lineAt(s), b = onBearing(q[2] + 90), e = q[0] + b[0] * side * off, n = q[1] + b[1] * side * off, dl = nearLine(e, n)[0];
    let kind = kd < 0.36 ? 0 : kd < 0.62 ? 1 : kd < 0.86 ? 2 : kd < 0.95 ? 3 : 4; if (kind === 4 && dl < 9) kind = 2; if (kind === 3 && dl < 7) kind = 1;
    if (dl < 4.8 || onWorks(e, n, 1.2) || streamAt(e, n)[0] < 2.9 || nearLipCrossing(e, n, 7.5)) continue;
    const h = groundAt(e, n); if (Math.abs(groundAt(e + 0.8, n) - h) > 0.8 || Math.abs(groundAt(e, n + 0.8) - h) > 0.8) continue;
    out.push({ e, n, y: h - 0.05, kind, H: [lerp(0.5, 1.1, sz), lerp(0.5, 1.2, sz), lerp(0.3, 0.9, sz), lerp(1, 3, sz), lerp(2, 6, sz)][kind], rot }); }
}
// STONES ('floor'): mossed boulders, 0.4 to 1.5 m, most of them on the stream's banks in the gully (2.4 to 7 m from the
// water), the rest on the forest's floor within 30 m of the line: [e, n, y, breadth, turn, flatness]
export function dealStones(rng) {
  const out = [], [s0, s1] = floorSpan();
  for (let i = 0; i < 150; i++) { const bank = rng() < 0.62, s = rng.range(s0, s1), side = rng.sign(), u = rng(), w = rng.range(0.4, 1.5), rot = rng.range(0, TAU), fl = rng.range(0.45, 0.8); let e, n;
    if (bank) { const k = rng.range(0, STREAM.length - 1.001), a = STREAM[Math.floor(k)], b = STREAM[Math.floor(k) + 1], t = k % 1, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, d = lerp(2.4, 7, u); e = lerp(a[0], b[0], t) + side * (b[1] - a[1]) / len * d; n = lerp(a[1], b[1], t) - side * (b[0] - a[0]) / len * d; if (n < 150 || n > 470) continue; }
    else { const q = lineAt(s), b = onBearing(q[2] + 90), off = lerp(6, 30, u); e = q[0] + b[0] * side * off; n = q[1] + b[1] * side * off; }
    if (nearLine(e, n)[0] < 5.5 || onWorks(e, n, 1) || streamAt(e, n)[0] < 2.2 || nearLipCrossing(e, n, 7.5) || out.some((q) => Math.hypot(q[0] - e, q[1] - n) < (q[3] + w) * 0.7)) continue;
    out.push([e, n, groundAt(e, n) - 0.25 * w * fl, w, rot, fl]); }
  return out;
}
// FALLEN TRUNKS ('fallen'): five to seven great trunks lying on the forest's floor, 8 to 16 m long, 9 to 30 m from the
// line, none on the Works or across the stream: { a: [e, y, n], b: [e, y, n], r }
export function dealFallen(rng) {
  const out = [], want = rng.pick([5, 6, 7]), [s0, s1] = floorSpan();
  for (let i = 0; i < 90 && out.length < want; i++) { const s = rng.range(s0, s1), side = rng.sign(), off = rng.range(9, 30), brg = rng.range(0, 360), len = rng.range(8, 16), r = rng.range(0.35, 0.6);
    const q = lineAt(s), b = onBearing(q[2] + 90), d = onBearing(brg), ce = q[0] + b[0] * side * off, cn = q[1] + b[1] * side * off, P2 = [-0.5, -0.25, 0, 0.25, 0.5].map((t) => [ce + d[0] * len * t, cn + d[1] * len * t]);
    if (P2.some((p) => nearLine(p[0], p[1])[0] < 8 || onWorks(p[0], p[1], 2) || streamAt(p[0], p[1])[0] < 4.5)) continue;
    const ya = groundAt(P2[0][0], P2[0][1]), yb = groundAt(P2[4][0], P2[4][1]); if (Math.abs(ya - yb) > 2.2 || out.some((f) => Math.hypot((f.a[0] + f.b[0]) / 2 - ce, (f.a[2] + f.b[2]) / 2 - cn) < 22)) continue;
    out.push({ a: [P2[0][0], ya + r * 0.7, P2[0][1]], b: [P2[4][0], yb + r * 0.55, P2[4][1]], r }); }
  return out;
}
// LIANAS AND AERIAL ROOTS ('lianas'): on every giant and fig within 46 m of the line, and on one canopy tree in
// three. A giant carries three or five lianas hanging free from its leaf masses, 6 to 14 m long, ending 3 m and more
// over the ground, which sway (four seconds, each on its own phase); one that does not sway comes down to the ground
// and roots there (a top in the leaves, a foot in the earth; none such stands on the Works). A fig lets five to seven
// aerial roots down to the ground (they do not sway). None within 5.5 m of the line. { e, n, y, len, r, amp, ph, own }
export function dealLianas(rng, trees) {
  const out = [];
  trees.forEach((t, ti) => { const k = t.kind === 0 ? rng.pick([3, 5]) : t.kind === 3 ? rng.pick([5, 6, 7]) : rng() < 0.33 ? rng.pick([1, 2]) : 0, fr = rng.fork('one');
    if ((t.kind !== 0 && t.kind !== 3 && t.kind !== 1) || nearLine(t.e, t.n)[0] > 46 || !t.clumps.length) return;
    for (let i = 0; i < k; i++) { const c = t.clumps[fr.int(0, t.clumps.length - 1)], a = fr.range(0, TAU), d = fr.range(0.15, 0.6) * c.r, e = c.e + Math.cos(a) * d, n = c.n + Math.sin(a) * d, y = c.y - 0.3 * c.r * c.flat, g = groundAt(e, n), fig = t.kind === 3;
      const free = fig ? 0 : fr.range(6, 14), r = fig ? fr.range(0.06, 0.16) : fr.range(0.025, 0.055), amp = fig || fr() < 0.4 ? 0 : fr.range(0.25, 0.5), ph = fr.range(0, TAU);
      // (one that does not sway comes down to the ground and roots there: it has a top in the leaves and a foot)
      const down = fig || amp === 0, len = down ? y - g + 0.3 : Math.min(free, y - g - 3);
      if (len < 3 || nearLine(e, n)[0] < 5.5 + amp || Math.hypot(e - K.DOOR.e, n - K.DOOR.n) < 18 || (down && (onWorks(e, n, 0.6) || streamAt(e, n)[0] < 2.5))) continue; out.push({ e, n, y, len, r, amp, ph, own: ti, fig }); }
    if (BARRED.has(out.filter((v) => v.own === ti).length)) out.pop(); });
  return out;
}
// TREE FERNS ('ferns', on three forks taken at its head: 'stream', 'line', 'lips'): along the stream's banks beside
// the Works (4.5 to 10 m from the water, 7.5 m and more from the line); and in the basin as tall dark shapes, 6 to
// 10 m, standing 3 to 8 m BACK from a rift's lip: beside the line one every 30 to 33 m, 8 to 20 m from it, from where
// a lip first lies within their reach of the line (found along the line) and its dealt play of up to 6 m; and others
// along the far lips. None within 60 m of the way out. A fern is a plant: it takes sun and sky only.
// THE SIGHT LINES TO THE WAY OUT: from every fifth metre of the line, from the basin's rim on, to the way out's disc
// (7 m about its middle). A thing of breadth r "stands before the way out" where it lies within r of that cone.
const SIGHT = (() => { const out = []; for (let s = nearLine(K.SILL.e, K.SILL.n)[1]; s < LINE_LEN - 8; s += 5) { const q = lineAt(s); out.push([q[0], q[1]]); } return out; })();
export const beforeWayOut = (e, n, r) => { for (const q of SIGHT) { const de = RING.e - q[0], dn = RING.n - q[1], t = clamp(((e - q[0]) * de + (n - q[1]) * dn) / (de * de + dn * dn), 0, 1), d = Math.hypot(e - q[0] - de * t, n - q[1] - dn * t); if (d < r + 7 * t + 1.5) return true; } return false; };
export function dealFerns(rng) {
  const out = [], rs = rng.fork('stream'), rl = rng.fork('line'), rf = rng.fork('lips');
  const tryAt = (e, n, s, rot, kind, H, near = 7.5, set = 0) => { if (nearLine(e, n)[0] < near || onWorks(e, n, 1.5) || shoreDist(e, n) < 46) return false; if (Math.hypot(e - RING.e, n - RING.n) < 60) return false;
    if (n > 480 && groundAt(e, n) > K.MEADOW + 1.2) return false;
    if (n > 480 && beforeWayOut(e, n, 0.42 * H * s + 1)) return false;
    if (n > 480 && nearShip(e, n, 3)) return false;
    if (nearLipCrossing(e, n, 6 + 0.42 * H * s + 0.5)) return false;
    if (out.some((f) => Math.hypot(f.e - e, f.n - n) < 3.2)) return false; out.push({ e, n, y: groundAt(e, n) - 0.15, s, rot, kind, H: H * s, basin: n > 480, set }); return true; };
  for (let i = 0; i < STREAM.length - 1; i++) { const a = STREAM[i], b = STREAM[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = rs.range(0, 6); t < len; t += rs.range(5, 10)) { const side = rs.sign(), off = rs.range(4.5, 10), s = rs.range(0.7, 1.2), rot = rs.range(0, TAU), kind = rs.int(0, 1), k = t / len; if (a[1] > 470 || a[1] < 150) continue; tryAt(lerp(a[0], b[0], k) + side * off, lerp(a[1], b[1], k) + rs.range(-2, 2), s, rot, kind, 5.5); } }
  // beside the line in the basin: from the first metre of the line (past the sill) at which a rift's lip lies within
  // 17 m of it, every 30 to 33 m, the nearest spot that is 3 to 8 m back from a lip
  let first = nearLine(K.SILL.e, K.SILL.n)[1]; while (first < LINE_LEN && riftAt(lineAt(first)[0], lineAt(first)[1])[0] > 17) first += 1;
  for (let s = first + rl.range(0, 6); s < LINE_LEN - 62; s += rl.range(30, 33)) { const q = lineAt(s), side = rl.sign(), sc = rl.range(0.95, 1.2), rot = rl.range(0, TAU), kind = rl.int(0, 1), H = rl.range(6.4, 8.4); let done = false;
    for (const sd of [side, -side]) { if (done) break; const b = onBearing(q[2] + sd * 90);
      for (let d = Math.max(8.5, 0.42 * H * sc + 5.2); d <= 20 && !done; d += 0.75) { const e = q[0] + b[0] * d, n = q[1] + b[1] * d, r = riftAt(e, n)[0]; if (r >= 3 && r <= 8) done = tryAt(e, n, sc, rot, kind, H, 8, 1); } } }
  // along the far lips
  for (const R of RIFTS) for (let i = 0; i < R.length - 1; i++) { const a = R[i], b = R[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / len, nn = -(b[0] - a[0]) / len;
    for (let t = rf.range(2, 12); t < len; t += rf.range(16, 30)) { const side = rf.sign(), k = t / len, w = lerp(a[2], b[2], k) / 2 + rf.range(3.2, 7.6), s = rf.range(0.95, 1.2), rot = rf.range(0, TAU), kind = rf.int(0, 1), H = rf.range(6.2, 8.3); const e = lerp(a[0], b[0], k) + side * nx * w, n = lerp(a[1], b[1], k) + side * nn * w; if (riftAt(e, n)[0] >= 3) tryAt(e, n, s, rot, kind, H, 20, 2); } }
  // no set of them (beside the line, in the basin, by the stream, all) comes to a count the owner's terms do not allow:
  // the last dealt of a set is left out
  const drop = (is) => { const i = out.map(is).lastIndexOf(true); if (i >= 0) out.splice(i, 1); }, cnt = (is) => out.filter(is).length;
  for (let g = 0; g < 12; g++) { if (BARRED.has(cnt((f) => f.set === 1))) drop((f) => f.set === 1); else if (BARRED.has(cnt((f) => f.basin))) drop((f) => f.set === 2); else if (BARRED.has(cnt((f) => !f.basin)) || BARRED.has(out.length)) drop((f) => f.set === 0); else break; }
  return out;
}
// BOULDERS ('boulders'): rock fallen from the basin's walls lies on its floor in clusters, one great stone and two to
// five lesser ones about it, mossed on top. None within 11 m of the line, none in the water, none about the way out
// or before it, none on the heart's forecourt or in a fall's pool. Each is [e, n, ground, breadth, turn, height as a
// share of breadth, cluster].
export function dealBoulders(rng) {
  const out = [], B = K.BASIN;
  const okAt = (e, n, r) => nearLine(e, n)[0] > 11 + r && riftAt(e, n)[0] > 1.6 + r && Math.hypot(e - RING.e, n - RING.n) > 32 && Math.hypot(e - HEART.e, n - HEART.n) > 16 && !FALLS.some((F) => Math.hypot(e - F.pool[0], n - F.pool[1]) < 9 + r)
    && !beforeWayOut(e, n, r) && !out.some((q) => Math.hypot(q[0] - e, q[1] - n) < 0.6 * (q[3] + 2 * r));
  for (let c = 0, tries = 0; c < 17 && tries < 400; tries++) { const a = rng.range(0, TAU), rho = Math.sqrt(rng.range(0.02, 0.9)), e = B.e + Math.sin(a) * rho * B.re, n = B.n + Math.cos(a) * rho * B.rn, br = rng.range(2.4, 4.4), g = groundAt(e, n);
    if (n < 478 || g > K.MEADOW + 2.5 || g < K.MEADOW - 0.3 || !okAt(e, n, br / 2) || nearShip(e, n, 3)) continue;
    const set = [[e, n, g, br, rng.range(0, TAU), rng.range(0.55, 0.82), c]], want = [2, 4, 5][rng.int(0, 2)];
    for (let j = 0, t2 = 0; j < want && t2 < 30; t2++) { const b = rng.range(0, TAU), d = rng.range(0.5, 1) * (br * 0.6 + 2.6), s = rng.range(0.7, 1.9), se = e + Math.sin(b) * d, sn = n + Math.cos(b) * d, sg = groundAt(se, sn);
      if (sg > K.MEADOW + 3 || sg < K.MEADOW - 0.3 || !okAt(se, sn, s / 2) || set.some((q) => Math.hypot(q[0] - se, q[1] - sn) < 0.45 * (q[3] + s))) continue; set.push([se, sn, sg, s, rng.range(0, TAU), rng.range(0.5, 0.85), c]); j++; }
    while (BARRED.has(set.length)) set.pop();
    out.push(...set); c++; }
  // (the whole is counted too, and the last cluster after any stone is left out)
  for (let g = 0; g < 9 && out.length && (BARRED.has(out.length) || BARRED.has(out.filter((q) => q[6] === out[out.length - 1][6]).length)); g++) out.pop();
  return out;
}
// counts the owner's terms do not allow in any set a visitor could count (a set, in no order)
export const BARRED = new Set([23, 8, 108, 15, 4, 42, 16]);
// a count that would fall on one of them takes the next number over
export const offBarred = (n) => { while (BARRED.has(n)) n++; return n; };
// the wind blows toward bearing 120 (plan e, n)
export const WIND = onBearing(120);
export const UNDER_KINDS = ['low ferns', 'broad-leaved plants', 'seedlings', 'shrubs', 'saplings'];
// how many of a great plant's leaf masses are drawn when it stands far from the line: its kind's number (three or
// five), never more than it has, and never four
export const farMasses = (have, far) => { const k = Math.min(have, far); return k === 4 ? 3 : k; };
// the cascades' chutes, found on the stream's bed itself: every stretch of n over which the bed climbs:
// [n of its foot, n of its lip, y of its foot, y of its lip]
export const CHUTES = (() => { const out = []; let n0 = -1; for (let n = 399; n <= 447; n += 0.25) { const up = cascadeBed(n + 0.25) - cascadeBed(n) > 0.004; if (up && n0 < 0) n0 = n; if (!up && n0 >= 0) { out.push([n0, n, cascadeBed(n0), cascadeBed(n)]); n0 = -1; } } return out; })();
// metres from a point to a straight course between two points
const segPoint = (ax, ay, az, bx, by, bz, px, py, pz) => { const ux = bx - ax, uy = by - ay, uz = bz - az, l2 = ux * ux + uy * uy + uz * uz, t = l2 ? clamp(((px - ax) * ux + (py - ay) * uy + (pz - az) * uz) / l2, 0, 1) : 0; return Math.hypot(ax + ux * t - px, ay + uy * t - py, az + uz * t - pz); };
// FALLING LEAVES ('leaves'): each a small body on a course known from the start. It leaves a leaf mass of a great
// plant that stands within 34 m of the line, falls 8 to 15 m (never into the ground) in 9 to 14 s and drifts down
// the wind as it falls. A leaf whose whole course (its flutter counted) comes within 2.6 m of the lens anywhere along
// the line, tested metre by metre, is left out. { e, y, n: where it starts; e1, y1, n1: where it ends; per, ph, tw, size }
export const dealLeaves = (rng, trees, density) => runAll(dealLeavesSteps(rng, trees, density));
function* dealLeavesSteps(rng, trees, density) {
  const out = [], near = trees.filter((t) => t.clumps.length && nearLine(t.e, t.n)[0] < 34), want = Math.round(150 * density);
  for (let i = 0; i < want && near.length; i++) { if (i % 30 === 29) yield; const t = near[rng.int(0, near.length - 1)], c = t.clumps[rng.int(0, t.clumps.length - 1)], a = rng.range(0, TAU), d = rng.range(0, 0.8) * c.r, per = rng.range(9, 14), ph = rng(), tw = rng.range(0, TAU), size = rng.range(0.1, 0.17), fall = rng.range(8, 15);
    const e = c.e + Math.cos(a) * d, n = c.n + Math.sin(a) * d, y = c.y - 0.3 * c.r * c.flat, e1 = e + WIND[0] * 0.45 * per, n1 = n + WIND[1] * 0.45 * per, y1 = Math.max(y - fall, groundAt(e1, n1) + 0.2);
    if (y - y1 < 4) continue;
    let hit = false; const s0 = Math.max(0, nearLine(e, n)[1] - 40); for (let s = s0; s < s0 + 80 && s <= LINE_LEN && !hit; s += 1) { const q = lineAt(s); hit = segPoint(e, y, n, e1, y1, n1, q[0], heightAtS(s), q[1]) < 2.6 + 0.85; }
    if (!hit) out.push({ e, y, n, e1, y1, n1, per, ph, tw, size }); }
  while (BARRED.has(out.length)) out.pop();
  return out;
}
// how many of them a slow device shows
export const leavesShown = (k, thin) => { let n = Math.round(k * thin); while (n > 0 && BARRED.has(n)) n--; return n; };
// DRIPS ('drips'): five along the room's roof lip (onto the yard's parapet, or the floor where the way in stands
// open), and one from the longest root of each of the court's curtains onto the court's rain sheet, where it rings
// the water. { e, n, y0, y1, per, ph, on }
export function dealDrips(rng, roots) {
  const out = [], M = K.ROOM;
  for (let i = 0; i < 5; i++) { const e = -29 + i * 2.3 + rng.range(-0.4, 0.4); out.push({ e, n: M.n0 - 0.1, y0: K.LIP - 0.5, y1: K.FLOOR + (e < M.e0 + 2.8 ? 0.02 : 1.22), per: rng.range(1.8, 3.6), ph: rng(), on: 'along the room\'s roof lip' }); }
  roots.counts.forEach((k, id) => { let best = null; for (const c of roots.curtains) if (c.of === id && (!best || c.len > best.len)) best = c; if (best) out.push({ e: best.e, n: best.n, y0: best.y - best.len, y1: K.FLOOR + 0.02, per: rng.range(2.2, 4.2), ph: rng(), on: 'from the court\'s root curtains' }); });
  return out;
}
// WISPS OF STEAM ('steam'): three at every cowl, each on its own phase: { cowl, ph, lag, size }
export function dealWisps(rng, cw) {
  const out = []; cw.forEach((c, i) => { const ph = rng(), size = rng.range(0.8, 1.15); for (let k = 0; k < 3; k++) out.push({ cowl: i, ph, lag: k / 3, size }); }); return out;
}
// SUN SHAFTS ('shafts'): thin slanted streaks of lit vapour along the sun's rays where steam or spray crosses a gold
// streak: over three or five of the roof's cowls (which, is dealt) and over the two upper chutes of the cascades.
// The page shows a shaft only where the sun reaches its place. { e, n, y, len, w, ph }
export function dealShafts(rng, cw) {
  const out = [], want = rng.pick([3, 5]), roof = rng.shuffle(cw.filter((c) => c.group === 1));
  // (a shaft lies along the sun's rays, which stand 12 to 17 degrees up on bearing 292: one whose course at either
  // height would come within 2.6 m of the lens anywhere along the line is not dealt)
  const clear = (q) => [12, 17].every((el) => { const [a, b] = shaftEnds(q, el); for (let s = Math.max(0, nearLine(q.e, q.n)[1] - 30 - q.len), s1 = s + 60 + 2 * q.len; s <= s1 && s <= LINE_LEN; s += 1) { const l = lineAt(s); if (segPoint(a[0], a[1], a[2], b[0], b[1], b[2], l[0], heightAtS(s), l[1]) < 3.3 + q.w / 2) return false; } return true; });
  let got = 0;
  for (const c of roof) { const q = { e: c.e, n: c.n, y: c.y + c.h + rng.range(1.2, 2.4), len: rng.range(6, 9), w: rng.range(0.7, 1.4), ph: rng(), on: 'the roof' }; if (got < want && clear(q)) { out.push(q); got++; } }
  if (got === 4) out.pop();
  // (no shaft stands over the cascades: beside the stream a lone streak read as a pale flat wedge, not as light)
  // THE FOREST'S SHAFTS: many, where the low sun comes down through the crowns beside the line from the gully to
  // the ramp; each shows only where the sun's map says the sun reaches along it
  for (let k = 0, tries = 0; k < 27 && tries < 500; tries++) { const s = rng.range(112, 470), l = lineAt(s), l2 = lineAt(Math.min(LINE_LEN, s + 1)), hx = l2[0] - l[0], hn = l2[1] - l[1], hl = Math.hypot(hx, hn) || 1, sd = rng.sign(), d = rng.range(7, 30), e = l[0] + sd * hn / hl * d, n = l[1] - sd * hx / hl * d;
    const q = { e, n, y: groundAt(e, n) + rng.range(5, 11), len: rng.range(13, 22), w: rng.range(1.6, 3.2), ph: rng(), on: 'the forest' }; if (onWorks(e, n, 2) || !clear(q)) continue; out.push(q); k++; }
  // THE BASIN'S SHAFTS: seven broad ones streaming in over the west rim. Each lies along a ray of the sun that
  // lands high on the east wall (34 to 50 m over the meadow, where the wall is lit) and runs back from there
  // toward the sun, high over the meadow: a ray that reaches the wall is lit along its whole length
  { const sb = onBearing(292), cs = Math.cos(14.5 * RAD), sn = Math.sin(14.5 * RAD);
    for (let k = 0; k < 7; k++) { const n = rng.range(560, 725), hgt = K.MEADOW + rng.range(34, 50), len = rng.range(95, 135), w = rng.range(7, 12), ph = rng(); let e = K.BASIN.e + 40; while (e < K.BASIN.e + 190 && groundAt(e, n) < hgt) e += 2;
      const q = { e: e + sb[0] * cs * len / 3, n: n + sb[1] * cs * len / 3, y: hgt + 1.5 + sn * len / 3, len, w, ph, on: 'the basin' }; if (clear(q)) out.push(q); } }
  while (BARRED.has(out.length)) out.pop();
  return out;
}
// a shaft's two ends [e, y, n] when the sun stands `el` degrees up: it lies along the ray through its place, a third
// of its length below the place and two thirds above
export const shaftEnds = (q, el) => { const b = onBearing(292), c = Math.cos(el * RAD), s = Math.sin(el * RAD), d = [b[0] * c, s, b[1] * c]; return [[q.e - d[0] * q.len / 3, q.y - d[1] * q.len / 3, q.n - d[2] * q.len / 3], [q.e + d[0] * q.len * 2 / 3, q.y + d[1] * q.len * 2 / 3, q.n + d[2] * q.len * 2 / 3]]; };
// SPRAY AT THE CHUTES ('spray'; a medium): two puffs of white vapour rising from the churned pool at each chute's
// foot, each on its own phase: { e, n, y, ph, size }
export function dealSpray(rng) {
  const out = []; for (const c of CHUTES) for (let k = 0; k < 2; k++) { const n = c[0] - rng.range(0.4, 1.6); out.push({ e: streamE(n) + rng.range(-0.8, 0.8), n, y: c[2] + 0.2, ph: rng(), size: rng.range(1.1, 1.7), chute: c[0] }); } return out;
}
// SMALL PLANTS IN THE CONCRETE'S CRACKS ('floor', its fork 'cracks'): seedlings and small ferns, 0.18 to 0.5 m, rooted
// in the roof slab's joints (the joints of its 3.1 m bays; none on a kerb, a cowl's plinth or the swept path beside
// the kerb row) and along the feet of the court's two long walls (none in a doorway, none on a pot)
export function dealCrackPlants(rng, kb, cw, pots) {
  const out = [], R = K.ROOF, C = K.COURT, rb = onBearing(R.row), o = kb[0];
  for (let i = 0; i < 70; i++) { const ax = rng() < 0.5, a = rng(), b = rng(), H = rng.range(0.18, 0.5), rot = rng.range(0, TAU), kind = rng() < 0.6 ? 2 : 0;
    const e = ax ? Math.round(lerp(R.e0 + 1.6, R.e1 - 1.6, a) / 3.1) * 3.1 : lerp(R.e0 + 1.2, R.e1 - 1.2, a), n = ax ? lerp(R.n0 + 1.2, R.n1 - 1.2, b) : Math.round(lerp(R.n0 + 1.6, R.n1 - 1.6, b) / 3.1) * 3.1;
    const ac = (e - o[0]) * rb[1] - (n - o[1]) * rb[0];
    if (Math.abs(ac - 3) < 1.1 || kb.some((q) => Math.hypot(q[0] - e, q[1] - n) < 1.5) || cw.some((c) => Math.hypot(c.e - e, c.n - n) < 1.3)) continue;
    out.push({ e, n, y: K.LIP - 0.02, kind, H, rot, on: 'the roof slab\'s joints' }); }
  for (let i = 0; i < 34; i++) { const west = rng() < 0.5, n = rng.range(C.n0 + 0.6, C.n1 - 0.6), H = rng.range(0.18, 0.45), rot = rng.range(0, TAU), kind = rng() < 0.6 ? 2 : 0, e = west ? C.e0 + rng.range(0.16, 0.3) : C.e1 - rng.range(0.16, 0.3);
    if (Math.abs(n - (west ? DOORWAYS.west : DOORWAYS.east)) < 1.0 || pots.some((r) => r.pots.some((q) => Math.hypot(q[0] - e, q[1] - n) < 0.6)) || (west ? PILASTERS.west : PILASTERS.east).some((pn) => Math.abs(pn - n) < 0.45)) continue;
    out.push({ e, n, y: K.FLOOR - 0.02, kind, H, rot, on: 'the feet of the court\'s walls' }); }
  for (const on of ['the roof slab\'s joints', 'the feet of the court\'s walls']) while (BARRED.has(out.filter((q) => q.on === on).length)) out.splice(out.map((q) => q.on).lastIndexOf(on), 1);
  while (BARRED.has(out.length)) out.splice(out.map((q) => q.on).lastIndexOf('the roof slab\'s joints'), 1);
  return out;
}
// THE LIPS OF THE RIFTS ('stones'): the meadow's own limestone, broken at each fissure, the same rock on both sides.
// Each side of each rift is one run of places along its edge: { e, n: the water's edge there (the rift's own breadth
// and a jagged play of -0.2 to 0.7 m), nx, nn: the way from the water, h: how far the rock stands over the meadow
// there (0.2 to 1.2 m, rising and falling along the run, falling short at breaks), w: how far back its crown lies
// (1.4 to 3.2 m), tilt: how its top leans (-0.5 to 0.5), fine: within 60 m of the line }. No block, no row, no
// stack, no step, no slab: one unbroken irregular edge. None on the Springhead's pool (open water, no rim) and none
// where the basin's wall takes the lip's place.
export function dealLips(rng) {
  const ox = rng.range(0, 400), oz = rng.range(0, 400), out = [];
  RIFTS.forEach((R, ri) => { for (const side of [1, -1]) { const run = []; let s = 0;
    const put = (ce, cn, half, nx, nn, u, fine) => { const jag = clamp(0.25 + 0.45 * NZ.n2((ce + ox) * 0.9, (cn + oz) * 0.9) + 0.22 * NZ.n2((ce + ox) * 2.3, (cn + oz) * 2.3), -0.2, 0.7), e = ce + nx * (half + jag), n = cn + nn * (half + jag);
      if (springLens(e, n) > -0.06 || groundAt(e + nx * 2.5, n + nn * 2.5) > K.MEADOW + 0.6) { if (run.length && !run[run.length - 1].gap) run.push({ gap: true }); return; }
      const hN = 0.5 + 0.5 * NZ.n2(u * 0.13 + ri * 7.1 + side * 3.3 + ox, oz), brk = smoothstep(0.28, 0.4, NZ.n2(u * 0.8 + ox, ri * 5.7 + side * 2.1 + oz));
      run.push({ e, n, nx, nn, h: (0.2 + 1.0 * smoothstep(0.15, 0.85, hN)) * (1 - 0.7 * brk), w: 1.4 + 1.8 * clamp(0.5 + 0.5 * NZ.n2(u * 0.17 + 9, oz + ri), 0, 1), tilt: clamp(NZ.n2(u * 0.21 + 3, ox + side), -0.5, 0.5), fine }); };
    for (let i = 0; i < R.length - 1; i++) { const a = R[i], b = R[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / len * side, nn = -(b[0] - a[0]) / len * side;
      const fine = nearLine((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)[0] < 60, step = fine ? 0.8 : 2.4;
      for (let t = 0; t < len; t += step) { const k = t / len; put(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k) / 2, nx, nn, s + t, fine); }
      s += len; }
    // round the rift's tip (on one side's run only): the lip closes the fissure's end
    if (side > 0) { const a = R[R.length - 2], b = R[R.length - 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), te = (b[0] - a[0]) / len, tn = (b[1] - a[1]) / len;
      for (let k = 0; k <= 6; k++) { const th = (k / 6) * Math.PI, c = Math.cos(th), sn = Math.sin(th); put(b[0], b[1], b[2] / 2, tn * c + te * sn, -te * c + tn * sn, s + k * 0.8, nearLine(b[0], b[1])[0] < 60); } }
    out.push({ rift: ri, side, run }); } });
  return out;
}
// THIRTEEN SIDE CRACKS ('cracks'): narrow water, 0.5 to 2 m wide, leaving a main rift at a slant; three on three of
// the rifts and two on the other two (which, is dealt), so that no rift carries a count the owner's terms do not
// allow: [rift, e0, n0, e1, n1, breadth]
export function dealCracks(rng) {
  const out = [], want = rng.shuffle([3, 3, 3, 2, 2]);
  RIFTS.forEach((R, ri) => { let have = 0;
    for (let g = 0; g < 160 && have < want[ri]; g++) { const i = rng.int(0, R.length - 2), k = rng(), a = R[i], b = R[i + 1], brg = Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD + rng.sign() * rng.range(35, 70), len = rng.range(12, 30), w = rng.range(0.5, 2);
      const e0 = lerp(a[0], b[0], k), n0 = lerp(a[1], b[1], k), d = onBearing(brg), e1 = e0 + d[0] * (len + lerp(a[2], b[2], k) / 2), n1 = n0 + d[1] * (len + lerp(a[2], b[2], k) / 2);
      if (springLens(e1, n1) > -0.3 || riftAt(e1, n1)[0] < 4 || Math.hypot(e1 - RING.e, n1 - RING.n) < 26 || out.some((c) => Math.hypot(c[3] - e1, c[4] - n1) < 12)) continue;
      // a crack lies in the meadow's floor for its whole length: none climbs the basin's wall (no water runs down into the basin)
      if ([0.25, 0.5, 0.75, 1].some((t) => groundAt(lerp(e0, e1, t), lerp(n0, n1, t)) > K.MEADOW + 0.45)) continue;
      out.push([ri, e0, n0, e1, n1, w]); have++; } });
  return out;
}
// CORAL HEADS on the reef's crest ('reef'): low broad many-lobed heads, each 2.2 to 4.4 m across and at most a third
// as tall as it is broad, of five to seven knobbed lobes. Six to eleven lie UNDER the water (their tops 0.25 to
// 0.9 m down) and are seen through it; two or three stand awash (their tops a hand over the still water) and carry
// foam. { e, n, w, top, awash, lobes: [[de, dn, radius, height] ...] }
export function dealCorals(rng) {
  const under = rng.pick([6, 7, 9, 10, 11]), awash = under === 6 ? 3 : rng.pick([2, 3]), k = under + awash, out = [], wet = rng.shuffle(Array.from({ length: k }, (_, i) => i < awash));
  for (let i = 0; i < k; i++) { const e = (i - (k - 1) / 2) * 13 + rng.range(-5, 5), n = shoreN(e) - rng.range(52, 66), w = rng.range(2.2, 4.4), top = wet[i] ? rng.range(0.05, 0.14) : -rng.range(0.25, 0.9), tall = w / rng.range(3.2, 4.4), lobes = [];
    for (let j = 0, m = rng.int(5, 7); j < m; j++) { const a = (j / m) * TAU + rng.range(-0.3, 0.3), d = j ? rng.range(0.22, 0.4) * w : 0; lobes.push([Math.cos(a) * d, Math.sin(a) * d, rng.range(0.2, 0.3) * w, tall * (j ? rng.range(0.6, 0.95) : 1)]); }
    out.push({ e, n, w, top, awash: wet[i], tall, lobes }); }
  return out;
}
// TWO FAR FLOCKS of white birds ('flocks'), nine to eleven each, every bird 150 m and more from the line and from the
// way out. One circles over the forested shoulder WEST of the Works: its centre is the highest ground found on the
// Works' own latitude (its dealt play north or south) between 190 and 330 m west of the line. The other circles over
// the basin's NORTH-EAST wall: its centre lies on a dealt bearing of 40 to 56 degrees from the basin's middle, at the
// first place outward of the meadow that stands 150 m and its loop's radius from the line and the way out. Each
// flies 30 to 45 m over its ground, and starts its loop at a dealt place in it. { e, n, y, r, birds, phase }
export function dealFlocks(rng) {
  const a = rng.pick([9, 10, 11]), b = rng.pick([9, 10, 11]), out = [];
  { const n = (K.ROOF.n0 + K.COURT.n1) / 2 + rng.range(-40, 40), r = 40, le = lineAt(nearLine(-200, n)[1])[0]; let best = le - 190 - r, top = -1e9;
    for (let e = le - 190 - r; e > le - 330; e -= 6) { const g = groundAt(e, n); if (g > top) { top = g; best = e; } }
    out.push({ e: best, n, y: top + rng.range(30, 45), r, birds: a, phase: rng.range(0, TAU) }); }
  { const B = K.BASIN, th = rng.range(40, 56), d = onBearing(th), r = 46; let rho = 1.05, e = 0, n = 0;
    for (; rho < 2.4; rho += 0.03) { e = B.e + d[0] * B.re * rho; n = B.n + d[1] * B.rn * rho; if (nearLine(e, n)[0] >= 150 + r && Math.hypot(e - RING.e, n - RING.n) >= 150 + r) break; }
    out.push({ e, n, y: groundAt(e, n) + rng.range(30, 45), r, birds: b, phase: rng.range(0, TAU) }); }
  return out;
}

// GREAT ROOTS ON THE CONCRETE ('roots'): body-thick roots (0.4 to 0.6 m through at the thick end) on every stretch of
// the Works. Each: { pts: [[e, y, n], ...], r, r1 (its two ends' half thickness), on }. On no face do they cover a third.
//   the bank door: two come from the door's fig over the bank and the roof lip and down the casemate's face, one
//     either side of the doorway, to the apron; a third leaves the west one and crosses the lintel
//   the roof: five ribbons run from the roof fig's foot across the slab toward the line and stop 7 m short of it
//     (or at the slab's edge), with seven side roots among them (one or two a ribbon)
//   the room: three lie over the lifted west part of its roof; two go down through the one crack to the floor
// THE COURT'S ROOT CURTAINS: aerial roots hanging from the copings in six heavy curtains, three a wall, each 1.5 to
// 4 m wide and 3.2 to 5.4 m long (most of the way down the 6.5 m wall), each a mass of nine to thirteen roots of
// unequal thickness (27 to 39 on a wall, 54 to 78 in all). Each stands between openings, 1.2 m and more from every
// lamp along its wall, and no two face each other across the court; none on a lip the line crosses. Each root:
// { e, n, y, len, r, ph, side, of (its curtain) }; it sways on a four-second period, its phase by the 'sway' stream.
export const CURTAINS = { west: [[300.3, 1.5, 2.4], [315.5, 1.8, 3], [348.8, 1.5, 2.4]], east: [[319.15, 1.5, 1.5], [329, 2.2, 4], [336.7, 1.8, 3.2]] };
export function dealRoots(rng, sw, lp = []) {
  const strands = [], curtains = [], counts = [], C = K.COURT, D = K.DOOR, f = D.face, o = [D.e, D.n], R = K.ROOF, L = K.LIP, F = K.FLOOR, top = D.y1 + 0.45;
  const at = (u, front) => along(along(o, f + 90, u), f, front);
  for (const [u, w] of [[-2.55, -1], [2.6, 1]]) { const pts = [[DOORFIG[0], groundAt(DOORFIG[0], DOORFIG[1]) + 0.5, DOORFIG[1]]], wob = rng.range(-0.25, 0.25), r = rng.range(0.2, 0.3);
    { const q = at(u * 0.8 - 1, -4.2); pts.push([q[0], groundAt(q[0], q[1]) + 0.12, q[1]]); } { const q = at(u, -2.4); pts.push([q[0], Math.max(groundAt(q[0], q[1]), top) + 0.15, q[1]]); }
    for (const [front, y, du] of [[-1.0, top + r * 0.8, 0], [0.42 + r * 0.5, top + r * 0.3, 0.05], [0.44 + r * 0.6, top - 0.5, 0.12], [r * 0.8, D.y1 - 0.5, 0.2], [r * 0.75, 11.6, 0.34 + wob], [r * 0.7, 10.2, 0.5 + wob], [r * 0.8 + 0.1, F + 0.3, 0.75], [0.9, F + 0.08, 1.5]]) { const q = at(u + du * w, front); pts.push([q[0], y, q[1]]); }
    strands.push({ pts, r, r1: r * 0.5, on: 'the door\'s face' }); }
  { const pts = []; for (const [u, y] of [[2.62, 13.16], [1.3, 13.36], [0.1, 13.3], [-0.9, 13.4], [-1.6, 13.32]]) { const q = at(u, 0.2); pts.push([q[0], y + rng.range(-0.03, 0.03), q[1]]); } strands.push({ pts, r: 0.15, r1: 0.07, on: 'the door\'s face' }); }
  // the roof's ribbons
  const onSlab = (e, n) => e > R.e0 + 0.6 && e < R.e1 - 0.6 && n > R.n0 + 0.6 && n < R.n1 - 0.6, side = rng.shuffle([2, 1, 2, 1, 1]);
  const ribbon = (e0, n0, brg, len, r, r1, lift) => { const pts = [], wig = rng.range(-1, 1), ph = rng.range(0, 6); let e = e0, n = n0, b = brg;
    for (let d = 0; d <= len; d += 2.2) { const t = d / len; if (d > 0 && (!onSlab(e, n) || nearLine(e, n)[0] < 7)) break; pts.push([e, L + 0.05 + lerp(r, r1, t) * 0.55 + lift * (1 - t) * (1 - t), n]); b = brg + 24 * wig * Math.sin(d * 0.3 + ph); const q = along([e, n], b, 2.2); e = q[0]; n = q[1]; }
    return pts; };
  for (let i = 0; i < 5; i++) { const brg = 38 + i * 25 + rng.range(-7, 7), st = along(K.ROOFFIG, brg, 1.6), r = rng.range(0.22, 0.32), pts = ribbon(st[0], st[1], brg, rng.range(20, 30), r, 0.09, 0.55);
    if (pts.length > 2) strands.push({ pts, r, r1: 0.09, on: 'the roof' });
    for (let j = 0; j < side[i]; j++) { const k = Math.min(pts.length - 2, 2 + rng.int(0, 3) + j * 2), q = pts[Math.max(1, k)], sb = ribbon(q[0], q[2], brg + rng.sign() * rng.range(25, 50), rng.range(5, 9), r * 0.55, 0.06, 0); if (sb.length > 1) strands.push({ pts: sb, r: r * 0.55, r1: 0.06, on: 'the roof (side roots)' }); } }
  // the room
  for (let i = 0; i < 3; i++) { const n0 = 375.4 + i * 2.1 + rng.range(-0.4, 0.4), pts = [], r = rng.range(0.2, 0.28);
    for (let k = 0; k <= 5; k++) { const t = k / 5, e = K.ROOM.fig[0] + 1.2 + t * 7.4; pts.push([e, (t < 0.85 ? lerp(17.1, 16.72, t / 0.85) : lerp(16.72, 15.58, (t - 0.85) / 0.15)) + r * 0.4, n0 + Math.sin(t * 4 + i) * 0.5]); }
    strands.push({ pts, r, r1: r * 0.55, on: 'the room\'s roof' }); }
  for (const n0 of [378.8, 381.2]) { const n = n0 + rng.range(-0.25, 0.25), r = rng.range(0.13, 0.2), lean = rng.range(-0.3, 0.3); strands.push({ pts: [[-25.6, 16.4, n - 0.3], [-24.5, 15.7, n], [-24.45 + lean * 0.3, 13.4, n + lean * 0.2], [-24.4 + lean, 11, n + lean * 0.4], [-24.4 + lean * 1.2, F + 0.05, n + lean * 0.5]], r, r1: r * 0.8, on: 'the room (through its roof)' }); }
  // the court's curtains
  for (const sd of ['west', 'east']) CURTAINS[sd].forEach(([n0, w0, w1]) => { const w = rng.range(w0, w1), k = rng.int(9, 13), len = rng.range(3.6, 5.2), id = counts.length; counts.push(0);
    for (let i = 0; i < k; i++) { const n = n0 + (i + 0.5 - k / 2) * w / k + rng.range(-0.08, 0.08), thick = rng() < 0.3, e = sd === 'west' ? C.e0 + rng.range(0.3, 0.62) : C.e1 - rng.range(0.3, 0.62);
      if (lp.some((l) => l.group === 'court' && Math.abs(l.e - (sd === 'west' ? C.e0 : C.e1)) < 0.5 && Math.abs(l.n - n) < 1.2)) continue;
      curtains.push({ e, n, y: L - 0.02, len: len * rng.range(0.72, 1) * (1 - 0.35 * Math.abs(i + 0.5 - k / 2) / k), r: thick ? rng.range(0.07, 0.13) : rng.range(0.025, 0.05), ph: sw(), side: sd, of: id }); counts[id]++; } });
  return { strands, curtains, counts };
}
// SURFACE ROOTS ('roots', its fork 'floor'): three or five great roots run out over the ground from the foot of every
// giant and fig within 34 m of the line, 4 to 9 m long, stopping short of the Works and of the stream
export function dealSurfaceRoots(rng, trees) {
  const out = [];
  trees.forEach((t, ti) => { if ((t.kind !== 0 && t.kind !== 3) || nearLine(t.e, t.n)[0] > 34) return; const k = rng.pick([3, 5]), a0 = rng.range(0, 360);
    for (let i = 0; i < k; i++) { const brg = a0 + (i / k) * 360 + rng.range(-20, 20), len = rng.range(4, 9), r = rng.range(0.12, 0.22) * Math.min(1.4, t.big || 1), pts = [], wig = rng.range(-1, 1);
      for (let d = 0.6 * t.thick; d <= len; d += 1.3) { const q = along([t.e, t.n], brg + 18 * wig * Math.sin(d * 0.6), d); if (onWorks(q[0], q[1], 0.5) || streamAt(q[0], q[1])[0] < 2.6) break; pts.push([q[0], groundAt(q[0], q[1]) + r * 0.35 + 0.5 * Math.max(0, 1 - d / 2.2), q[1]]); }
      if (pts.length > 2) out.push({ pts, r, r1: 0.05, on: 'the forest\'s floor', own: ti }); }
    if (BARRED.has(out.filter((v) => v.own === ti).length)) out.pop(); });
  return out;
}
// THE BASIN'S MIST ('mist'): a medium, never a body: vapour lit from below by the water it stands on. It rises from a
// rift's EAST lip and leans down the wind (toward bearing 120). By place: over any rift within 25 m of the line (or
// of the line carried on 160 m past the way out) it stays under 2 m; tall thin sheets, 6 to 14 m high and 7 to 13 m broad, stand in depth
// over rifts 25 m and more aside, 35 m and more aside of the way out's axis and 60 m and more from the way out, and
// no two of them stand as a pair (none mirrors another across that axis). Along the two long edges of the
// Springhead's pool north of the way out stand sheets of 2.5 to 4.5 m, 9 m and more aside of the axis, their tops
// under the way out's centre. [e, n, base y, breadth, height, tall, phase, period, rift]
export const asideOfWay = (e, n) => { const d = nearLine(e, n)[0], b = onBearing(RING.heading), de = e - RING.e, dn = n - RING.n, t = clamp(de * b[0] + dn * b[1], 0, 160); return Math.min(d, Math.hypot(de - b[0] * t, dn - b[1] * t)); };
export function dealMist(rng) {
  const out = [], hb = onBearing(RING.heading);
  // (the rifts whose far ends lie farthest from the line are dealt first: their walls of vapour stand whole, and a
  // rift nearer the line gives way where one of its sheets would mirror theirs)
  const order = RIFTS.map((R, i) => [nearLine(R[R.length - 1][0], R[R.length - 1][1])[0], i]).sort((p, q) => q[0] - p[0]).map((q) => q[1]);
  order.forEach((ri) => { const R = RIFTS[ri]; for (let i = 0; i < R.length - 1; i++) { const a = R[i], b = R[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / len, nn = -(b[0] - a[0]) / len, east = nx >= 0 ? 1 : -1;
    for (let t = rng.range(0, 4); t < len; t += rng.range(3.5, 6)) { const k = t / len, half = lerp(a[2], b[2], k) / 2, e = lerp(a[0], b[0], k) + east * nx * half * 0.6, n = lerp(a[1], b[1], k) + east * nn * half * 0.6;
      const aside = asideOfWay(e, n), ph = rng(), per = rng.range(20, 30), wantTall = rng() < 0.24, w = rng.range(7, 13), h = rng.range(5, 10), lw = rng.range(4, 7), lh = rng.range(1.2, 1.9);
      const de = e - RING.e, dn = n - RING.n, far = Math.hypot(de, dn);
      let tall = wantTall && aside >= 25 && far >= 60 && (far > 150 || aside >= 35) && !FALLS.some((F) => Math.hypot(e - F.pool[0], n - F.pool[1]) < 34);
      // never a pair: no tall sheet stands within 13 m (a sheet's own breadth) of another's mirror place across the way
      // out's axis
      if (tall) { const al = de * hb[0] + dn * hb[1], ac = de * hb[1] - dn * hb[0], me = RING.e + hb[0] * al - hb[1] * ac, mn = RING.n + hb[1] * al + hb[0] * ac; if (out.some((m) => m[5] && Math.hypot(m[0] - me, m[1] - mn) < 13)) tall = false; }
      out.push(tall ? [e, n, K.WATER, w, h, 1, ph, per, ri] : [e, n, K.WATER, lw, lh, 0, ph, per, ri]); } } });
  // the Springhead: low wisps over its domes; and the walls along its pool's two edges north of the way out
  for (const q of SPRINGS) for (let j = 0; j < 2; j++) out.push([q[0] + rng.range(-3, 3), q[1] + rng.range(-3, 3), K.WATER, rng.range(4, 6.5), rng.range(1.2, 1.8), 0, rng(), rng.range(18, 28), RIFTS.length]);
  for (const sd of [1, -1]) for (let n = 676 + rng.range(0, 3); n < 703; n += rng.range(3.5, 5.5)) { let e = SP.e; while (springLens(e, n) > 0.12 && Math.abs(e - SP.e) < 30) e += sd * 0.5;
    const h = rng.range(2.5, 4.5), w = rng.range(4, 6.5), ph = rng(), per = rng.range(20, 30); if (asideOfWay(e, n) >= 9 && springLens(e, n) > -0.2) out.push([e, n, K.WATER, w, h, 2, ph, per, RIFTS.length + 1]); }
  // the heart's breath: vapour standing over the run before the mouth (never nearer the way out's axis than some
  // 17 m); it takes the mouth's gold, as all vapour near the mouth does, by its place
  { const rh = rng.fork('heart'); for (let d = 4 + rh.range(0, 3); d < 44; d += rh.range(4.5, 7.5)) { const sd = rh.range(-7, 7) * (0.5 + d / 60);
    out.push([HEART.e + HEART_F[0] * d + HEART_F[1] * sd, HEART.n + HEART_F[1] * d - HEART_F[0] * sd, K.WATER, rh.range(6, 10), rh.range(2.4, 4.2), 2, rh(), rh.range(20, 30), RIFTS.length + 2]); } }
  // the sheets are counted too: on no rift and in all do the tall sheets, the low sheets or all the sheets come to a
  // count the owner's terms do not allow (a sheet over a rift is left out, the last dealt of its kind first)
  const cnt = (t, ri) => out.filter((m) => (t < 0 || m[5] === t) && (ri < 0 || m[8] === ri)).length;
  const bad = () => { for (let ri = 0; ri <= RIFTS.length + 2; ri++) for (const t of [2, 1, 0]) if (BARRED.has(cnt(t, ri))) return [t, ri]; for (const t of [2, 1, 0]) if (BARRED.has(cnt(t, -1))) return [t, -1]; return BARRED.has(out.length) ? [0, -1] : null; };
  for (let g = 0, b; g < 80 && (b = bad()); g++) { let i = out.length - 1; while (i >= 0 && !(out[i][5] === b[0] && out[i][8] !== RIFTS.length && (b[1] < 0 || out[i][8] === b[1]))) i--; if (i < 0) break; out.splice(i, 1); }
  return out;
}

// ---------------------------------------------------------------- the whole plan of one visit, as plain numbers
// SEVEN SPRINGS dome the Springhead's water in a loose scatter (never a ring): [e, n, breadth]
export const SPRINGS = [[10.5, 650, 3.2], [17.8, 655.5, 2.4], [8.2, 664, 2.8], [15.2, 671.5, 3.6], [20.4, 667, 2.2], [12.6, 680.5, 2.6], [17.4, 644.5, 2.0]];
const cap = (k, a, b, r) => ({ k, a, b, r });
// (the plan is made in short steps, so that a page that builds it can rest between them)
export function layout(seed, vary, S) { const it = layoutSteps(seed, vary, S); let r; while (!(r = it.next()).done); return r.value; }
export async function layoutAsync(seed, vary, wait, S) { const it = layoutSteps(seed, vary, S); let r; while (!(r = it.next()).done) if (wait) await wait(); return r.value; }
function* layoutSteps(seed, vary = { hour: 'any', rare: false, density: 1, mood: 0.5 }, S = makeStreams(seed)) {
  const knots = routeKnots(), bodies = [], rows = [];
  const W3 = (e, y, n) => [e, y, -n], row = (k, n) => rows.push({ k, n });
  for (const b of worksBlocks()) { const tilt = b.tilt ? Math.sin(b.tilt * RAD) * b.hd : 0, parts = b.rise ? offBarred(Math.ceil(b.hl / 1.5)) : 1, ob = onBearing(b.brg);
    // a block whose top climbs is counted in short lengths, each to its own top
    for (let i = 0; i < parts; i++) { const a0 = -b.hl + (2 * b.hl * i) / parts, a1 = -b.hl + (2 * b.hl * (i + 1)) / parts, am = (a0 + a1) / 2, top = b.y1 + (b.rise || 0) * (a1 + b.hl) / (2 * b.hl);
      bodies.push({ k: b.k, c: W3(b.e + ob[0] * am, (b.y0 + top) / 2, b.n + ob[1] * am), h: [(a1 - a0) / 2, (top - b.y0) / 2 + tilt, b.hd], yaw: (90 - b.brg) * RAD }); } }
  yield;
  const cw = cowls(S.fittings), kb = kerbs(), lp = lamps(S.lamps), dip = S.lamps.fork('dip').range(0, 13), palms = dealPalms(S.palms), glades = dealGlades(S.glades);
  yield;
  const trees = yield* dealForestSteps(S.forest, glades);
  yield;
  const under = []; for (let k = 0; k < 6; k++) { dealUnderstory(S.understory, under, Math.round(250 * vary.density)); yield; }
  const stones = dealStones(S.floor), fallen = dealFallen(S.fallen), lianas = dealLianas(S.lianas, trees), sroots = dealSurfaceRoots(S.roots.fork('floor'), trees);
  yield;
  const ferns = dealFerns(S.ferns), boulders = dealBoulders(S.boulders), lips = dealLips(S.stones), cracks = dealCracks(S.cracks), mist = dealMist(S.mist), roots = dealRoots(S.roots, S.sway, lp), corals = dealCorals(S.reef), flocks = dealFlocks(S.flocks), pots = potRows(S.pots);
  yield;
  // the tall understory is counted too: shrubs and saplings, each kind's whole; and the stones
  for (const kd of [3, 4]) while (BARRED.has(under.filter((u) => u.kind === kd).length)) under.splice(under.map((u) => u.kind).lastIndexOf(kd), 1);
  while (BARRED.has(stones.length)) stones.pop();
  const leaves = yield* dealLeavesSteps(S.leaves, trees, vary.density);
  yield;
  const drips = dealDrips(S.drips, roots), wisps = dealWisps(S.steam, cw), shafts = dealShafts(S.shafts, cw), cplants = dealCrackPlants(S.floor.fork('cracks'), kb, cw, pots), spray = dealSpray(S.spray);
  yield;
  for (const c of cw) bodies.push(cap('cowls', W3(c.e, c.y - c.plinth - 0.3, c.n), W3(c.e, c.y + c.h + 0.4, c.n), 0.75));
  for (const q of kb) bodies.push({ k: 'kerbs (light wells)', c: W3(q[0], q[2] + 0.81, q[1]), h: [0.16, 0.81, 0.16], yaw: (90 - K.ROOF.row) * RAD });
  for (const l of lp) { const q = lampPoint(l); bodies.push(cap('lamps', W3(q[0], q[1], q[2]), W3(l.e, l.y + 0.2 + (l.drop || 0), l.n), 0.35)); }
  for (const r of pots) for (const q of r.pots) bodies.push(cap('pots of seedlings', W3(q[0], q[2], q[1]), W3(q[0], q[2] + 0.55, q[1]), 0.3));
  { const D = K.DOOR, o = along([D.e, D.n], D.face + 180, D.deep - 0.45); bodies.push({ k: 'the door\'s leaves (one ajar)', c: W3(o[0], K.FLOOR + D.dh / 2, o[1]), h: [D.dw / 2 + 0.1, D.dh / 2, 0.6], yaw: (90 - D.face - 90) * RAD }); }
  { const Q = K.POST, top = Q.floor + Q.h + 0.45; bodies.push(cap('the wind cups on their pole (their whole turn)', W3(4.5, top, 451.6), W3(4.5, top + 1.8, 451.6), 0.45)); }
  for (const q of palms) { const b = onBearing(q.brg), sl = Math.sin(q.lean * RAD), cl = Math.cos(q.lean * RAD), top = [q.e + b[0] * sl * 0.8 * q.H, q.y + cl * 0.8 * q.H, q.n + b[1] * sl * 0.8 * q.H];
    bodies.push(cap('palms: trunks', W3(q.e, q.y, q.n), W3(top[0], top[1], top[2]), 1.3), { k: 'palms: crowns (reach and sway)', drum: (() => { const D = palmCrown(q); return { base: W3(D.base[0], D.base[1], D.base[2]), axis: [D.axis[0], D.axis[1], -D.axis[2]], y0: D.y0, y1: D.y1, r: D.r }; })() }); }
  yield;
  for (const t of trees) { const top = trunkTop(t), nm = TREE_KINDS[t.kind].name;
    bodies.push(cap('great plants: trunks (' + nm + ')', W3(t.e, t.y, t.n), W3(top[0], top[1], top[2]), t.thick + 0.15));
    if (t.kind === 0 || t.kind === 3) bodies.push(cap('great plants: buttresses and stems at the foot (' + nm + ')', W3(t.e, t.y, t.n), W3(t.e, t.y + 3.5, t.n), 4 * t.thick));
    for (const c of t.clumps) bodies.push(cap('great plants: leaf masses (reach and sway)', W3(c.e, c.y, c.n), W3(c.e, c.y, c.n), c.r * 1.5 + 0.7));
  }
  for (const f of ferns) bodies.push(cap('tree ferns: stems', W3(f.e, f.y, f.n), W3(f.e, f.y + 0.85 * f.H, f.n), 0.5), cap('tree ferns: crowns (reach and sway)', W3(f.e, f.y + 0.8 * f.H, f.n), W3(f.e, f.y + 0.98 * f.H, f.n), 0.42 * f.H + 0.5));
  for (const r of [...roots.strands, ...sroots]) for (let i = 0; i + 1 < r.pts.length; i++) bodies.push(cap(r.on === 'the forest\'s floor' ? 'surface roots' : 'great roots on the concrete', W3(r.pts[i][0], r.pts[i][1], r.pts[i][2]), W3(r.pts[i + 1][0], r.pts[i + 1][1], r.pts[i + 1][2]), r.r + 0.1));
  for (const c of roots.curtains) bodies.push(cap('the court\'s root curtains (their whole sway)', W3(c.e, c.y, c.n), W3(c.e, c.y - c.len, c.n), 0.5));
  for (const u of under) bodies.push(cap('understory: ' + UNDER_KINDS[u.kind], W3(u.e, u.y, u.n), W3(u.e, u.y + u.H * 0.8, u.n), u.kind < 3 ? 0.55 * u.H + 0.2 : 0.4 * u.H + 0.3));
  for (const q of stones) bodies.push(cap('mossed stones', W3(q[0], q[2] + q[3] * 0.3, q[1]), W3(q[0], q[2] + q[3] * 0.3, q[1]), q[3] * 0.62));
  for (const f of fallen) bodies.push(cap('fallen trunks', W3(f.a[0], f.a[1], f.a[2]), W3(f.b[0], f.b[1], f.b[2]), f.r + 0.15));
  for (const v of lianas) bodies.push(cap(v.fig ? 'aerial roots of the figs' : 'lianas (their whole sway)', W3(v.e, v.y, v.n), W3(v.e, v.y - v.len, v.n), v.r + v.amp + 0.15));
  for (const u of cplants) bodies.push(cap('small plants in the concrete\'s cracks', W3(u.e, u.y, u.n), W3(u.e, u.y + u.H * 0.8, u.n), 0.55 * u.H + 0.2));
  for (const q of shafts) for (const el of [12, 17]) { const [a, b] = shaftEnds(q, el); bodies.push(cap('sun shafts (a medium; their whole length at the sun\'s two heights)', W3(a[0], a[1], a[2]), W3(b[0], b[1], b[2]), q.w / 2)); }
  const wreck = dealWreck(S.wreck), hatch = hatchPlan();
  bodies.push(cap('the hatch in the forest floor (door, collar)', W3(hatch.e, hatch.y + 0.2, hatch.n), W3(hatch.e, hatch.y + 0.2, hatch.n), 1.75), cap('the hatch\'s shaft of light (a medium; its whole cone)', W3(hatch.e, hatch.y + 0.3, hatch.n), W3(hatch.e, hatch.y + hatch.beam, hatch.n), 1.5));
  { const t = wreck.tube, w = wreck.wing, q = wreck.pod, wb = onBearing(w.brg), cr = Math.cos(w.rise * RAD) * w.span, pb = onBearing(q.brg);
    bodies.push(cap('the wreck: the fuselage tube', W3(t.a[0], t.a[1], t.a[2]), W3(t.b[0], t.b[1], t.b[2]), t.r + 0.15), cap('the wreck: the wing stub', W3(w.e, w.y, w.n), W3(w.e + wb[0] * cr, w.y + Math.sin(w.rise * RAD) * w.span, w.n + wb[1] * cr), 2.3),
      cap('the wreck: the engine pod', W3(q.e - pb[0] * q.len / 2, q.y, q.n - pb[1] * q.len / 2), W3(q.e + pb[0] * q.len / 2, q.y, q.n + pb[1] * q.len / 2), q.r + 0.1));
    for (const d of wreck.bits) bodies.push(cap(d.kind === 2 ? 'the wreck: seat frames' : 'the wreck: debris', W3(d.e, d.y, d.n), W3(d.e, d.y + (d.kind === 2 ? 1.1 : 0.3), d.n), d.kind === 2 ? 1.0 : 0.6 * d.size + 0.2)); }
  for (const q of spray) bodies.push(cap('spray at the chutes (a medium; its whole rise)', W3(q.e, q.y, q.n), W3(q.e, q.y + 2.2, q.n), 0.6 * q.size));
  for (const lf of leaves) bodies.push(cap('falling leaves (their whole course)', W3(lf.e, lf.y, lf.n), W3(lf.e1, lf.y1, lf.n1), 0.85));
  for (const strip of lips) { const run = strip.run; for (let i = 0; i + 1 < run.length; i += 4) { const a = run[i], b = run[Math.min(run.length - 1, i + 4)]; if (a.gap || b.gap) continue; const h = Math.max(a.h, b.h);
    bodies.push(cap('the rifts\' lips (broken limestone)', W3(a.e + a.nx, K.MEADOW + h * 0.4, a.n + a.nn), W3(b.e + b.nx, K.MEADOW + h * 0.4, b.n + b.nn), 1.2 + h * 0.6)); } }
  for (const c of corals) bodies.push({ k: 'coral heads', c: W3(c.e, c.top - c.tall / 2, c.n), h: [c.w / 2 + 0.3, c.tall / 2 + 0.2, c.w / 2 + 0.3], yaw: 0 });
  for (const f of flocks) bodies.push(cap('far flocks (their whole loop)', W3(f.e, f.y, f.n), W3(f.e, f.y, f.n), f.r + 12));
  yield;
  // EVERY COUNT A VISITOR COULD COUNT, each counted from the lists that the builders turn into things one for one
  // (what the Works' own geometry holds is counted by its builder as it builds: see tallyOf)
  const by = (list, key) => { const m = {}; for (const x of list) m[typeof key === 'function' ? key(x) : x[key]] = (m[typeof key === 'function' ? key(x) : x[key]] || 0) + 1; return m; }, G = by(lp, 'group'), CG = by(cw, 'group'), blocks = worksBlocks(), nk = (k) => blocks.filter((b) => b.k === k).length;
  const each = (label, m) => { for (const [k, n] of Object.entries(m)) row(label + k, n); }, one = (label, m) => { for (const n of Object.values(m)) row(label, n); }, sum = (k, n) => rows.push({ k, n, sum: true });
  row('the wreck: window holes along its one side', wreck.tube.windows[0]); row('the wreck: window holes along its other side', wreck.tube.windows[1]); row('the wreck: pieces of debris', wreck.bits.filter((d) => d.kind !== 2).length); row('the wreck: seat frames', wreck.bits.filter((d) => d.kind === 2).length);
  row('palms, all', palms.length); row('palms west of the stream\'s mouth', palms.filter((q) => q.bank === 0).length); row('palms east of the stream\'s mouth', palms.filter((q) => q.bank === 1).length);
  row('lamps, all', lp.length); each('lamps on: ', G); each('lamps of the kind: ', by(lp, 'kind')); each('lamps on one face of: ', by(lp.filter((l) => l.kind === 'niche' || l.kind === 'soffit'), (l) => l.group + ', facing ' + Math.round(l.face)));
  one('lamps in one row of the room', by(lp.filter((l) => l.group === 'room'), (l) => l.n.toFixed(1)));
  // places where several structures stand as one: the outfall, the sunken court, the sill
  row('lamps at the outfall (door, east wall, training wall)', G.door + G['east wall'] + G['training wall']); row('lamps of the sunken court (stair, court, yard and ramp, room)', G.stair + G.court + G.ramp + G.room); row('lamps of the sill (cascades, post)', G.cascades + G.post);
  // sums of neighbouring rows that are never seen as one group (the lead's ruling: they stand; listed, not ruled)
  sum('lamps of the stair and the court', G.stair + G.court); sum('lamps of the court, the yard and the ramp', G.court + G.ramp); sum('lamps of the yard, the ramp and the room', G.ramp + G.room);
  sum('lamps below the roof (brow, door, east wall, training wall)', G.brow + G.door + G['east wall'] + G['training wall']); sum('lamps on the sunken court\'s walls (stair, court, yard and ramp)', G.stair + G.court + G.ramp);
  row('cowls, all', cw.length); ['behind the brow', 'on the roof', 'on the post', 'at the meadow\'s edge (unlit)'].forEach((k, i) => row('cowls ' + k, CG[i]));
  row('bent-head cowls, all', cw.filter((c) => c.bent).length); row('straight cowls, all', cw.filter((c) => !c.bent).length); row('bent-head cowls on the roof', cw.filter((c) => c.bent && c.group === 1).length); row('straight cowls on the roof', cw.filter((c) => !c.bent && c.group === 1).length);
  row('kerbs on the roof (one row)', kb.filter((q) => q[2] === K.LIP).length); row('kerbs, all', kb.length); row('kerbs and cowls on the roof', kb.filter((q) => q[2] === K.LIP).length + CG[1]); row('kerbs and cowls, all', kb.length + cw.length);
  const opens = blocks.flatMap((b) => (b.open || []).map((o) => ({ ...o, on: b.k, wall: b.k + (b.e < -16.7 ? ' (west)' : ' (east)') })));
  each('lit openings of the kind: ', by(opens, 'kind')); each('lit openings in: ', by(opens, 'wall')); each('windows in: ', by(opens.filter((o) => o.kind === 'window'), 'wall')); row('lit openings of the whole station', opens.length);
  row('lit openings in the court', opens.filter((o) => o.on === 'the court\'s walls').length);
  each('roots of the kind: great roots on ', by(roots.strands, 'on')); row('great roots on the concrete, all', roots.strands.length); one('surface roots at one great plant', by(sroots, 'own'));
  roots.counts.forEach((k) => row('roots in one root curtain', k)); each('root curtains on the court\'s wall: ', by(roots.counts.map((k, i) => ({ side: i < CURTAINS.west.length ? 'west' : 'east' })), 'side')); each('roots of all the curtains on the court\'s wall: ', by(roots.curtains, 'side'));
  row('root curtains, all', roots.counts.length); row('roots in all the root curtains', roots.curtains.length);
  each('blocks of the Works named: ', by(blocks.filter((b) => /trestles|bench\'s blocks|plinth|piers|pilasters|room\'s roof|ramp\'s east wall|wing walls|stair\'s walls|copings|sill post$/.test(b.k)), 'k'));
  pots.forEach((r) => row('pots in the row on ' + r.k, r.pots.length)); row('pots in the room (table and shelf)', pots[1].pots.length + pots[2].pots.length); row('pots in the court (two feet and the sills)', pots[3].pots.length + pots[4].pots.length + pots[5].pots.length);
  row('pots on the court\'s west wall (foot and sills)', pots[3].pots.length + pots[5].pots.length); row('pots, all', pots.reduce((a, r) => a + r.pots.length, 0)); row('rows of pots', pots.length); for (const r of pots) for (const q of r.pots) row('leaves in a pot\'s tuft', q[4]);
  K.STAIR.flights.forEach((f, i) => row('stair risers, flight ' + (i + 1), f)); row('stair risers, all', STEPS.length); row('stair flights', K.STAIR.flights.length); row('stair landings', K.STAIR.flights.length - 1);
  row('main rifts', RIFTS.length); row('side cracks', cracks.length); each('side cracks on rift ', by(cracks, (c) => c[0] + 1)); row('rifts and cracks', RIFTS.length + cracks.length); row('springs', SPRINGS.length);
  row('tree ferns in the basin', ferns.filter((f) => f.basin).length); row('tree ferns beside the line in the basin', ferns.filter((f) => f.set === 1).length); row('tree ferns by the stream', ferns.filter((f) => !f.basin).length); row('tree ferns, all', ferns.length);
  row('great plants', trees.length); row('hero figs (the roof\'s, the room\'s, the door\'s)', FIGS.length); row('kinds of great plant', TREE_KINDS.length);
  TREE_KINDS.forEach((t) => { row('great plants of the kind: ' + t.name, trees.filter((q) => TREE_KINDS[q.kind] === t).length); row('leaf masses of a ' + t.name, t.masses.length); row('leaf masses drawn on a far ' + t.name, farMasses(t.masses.length, t.far)); });
  row('glades', glades.length); one('slender trees standing in one group', by(trees.filter((t) => t.group >= 0), 'group'));
  each('understory of the kind: ', by(under.filter((u) => u.kind > 2), (u) => UNDER_KINDS[u.kind])); row('mossed stones', stones.length); row('fallen trunks', fallen.length);
  one('lianas or aerial roots on one great plant', by(lianas, 'own'));
  row('coral heads', corals.length); row('coral heads awash', corals.filter((c) => c.awash).length); row('coral heads under the water', corals.filter((c) => !c.awash).length); for (const c of corals) row('lobes of one coral head', c.lobes.length);
  row('flocks', flocks.length); flocks.forEach((f, i) => row('birds in flock ' + (i + 1), f.birds)); row('birds, all', flocks[0].birds + flocks[1].birds);
  row('chutes of the cascades', CHUTES.length); one('puffs of spray at one chute', by(spray, 'chute')); row('puffs of spray, all', spray.length); one('wisps of steam at one cowl', by(wisps, 'cowl')); row('wisps of steam, all', wisps.length);
  each('drips: ', by(drips, 'on')); row('drips, all', drips.length); row('falling leaves', leaves.length); row('falling leaves on a slow device', leavesShown(leaves.length, 0.5)); row('sun shafts under the forest', shafts.length); each('sun shafts over ', by(shafts, 'on')); each('small plants in ', by(cplants, 'on')); row('small plants in the concrete\'s cracks, all', cplants.length);
  row('mist sheets, all', mist.length); row('tall mist sheets, all', mist.filter((m) => m[5] === 1).length); row('low mist sheets, all', mist.filter((m) => m[5] === 0).length); row('wisps over the Springhead', mist.filter((m) => m[8] === RIFTS.length).length); row('mist walls along the Springhead\'s pool', mist.filter((m) => m[5] === 2).length);
  RIFTS.forEach((R, i) => { row('tall mist sheets on rift ' + (i + 1), mist.filter((m) => m[5] === 1 && m[8] === i).length); row('low mist sheets on rift ' + (i + 1), mist.filter((m) => m[5] === 0 && m[8] === i).length); });
  return {
    knots, pace: (u) => speedAt(planAt(u * FLOWN)) / 15,
    bodies, rows, streams: S, dip, cowls: cw, kerbs: kb, lamps: lp, palms, trees, glades, under, stones, boulders, fallen, lianas, sroots, ferns, lips, cracks, mist, roots, corals, flocks, pots, leaves, drips, wisps, shafts, cplants, spray, wreck, hatch,
  };
}

// ---------------------------------------------------------------- geometry: flat quads gathered into one mesh
const _col = new THREE.Color();
export const lin = (hex) => { _col.set(hex); return [_col.r, _col.g, _col.b]; };
export const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export class Acc {
  constructor() { this.p = []; this.nr = []; this.c = []; this.g = []; this.sk = []; this.i = []; this.stain = null; this.skin = [0, 0, 0]; this.wave = [0, 0]; }
  // a flat quad a b c d, cut into cells no longer than `cell` metres. glow: its own light; spine: the spine metres its
  // light dips by; this.wave [phase, breadth]: the dealt waver of the lamp whose own light this is. this.skin [kind, top, foot] is carried to every vertex as (kind, metres under the coping or sill
  // over it, metres over its foot): kind 1 concrete, 2 a roof slab (it holds puddles), 3 the court's wet floor, 0 none
  quad(a, b, c, d, col, cell = 2.2, glow = 0, spine = 0) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const nu = Math.max(1, Math.ceil(Math.hypot(ux, uy, uz) / cell)), nv = Math.max(1, Math.ceil(Math.hypot(vx, vy, vz) / cell)), base = this.p.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const s = i / nu, t = j / nv, w0 = (1 - s) * (1 - t), w1 = s * (1 - t), w2 = s * t, w3 = (1 - s) * t;
      const x = a[0] * w0 + b[0] * w1 + c[0] * w2 + d[0] * w3, y = a[1] * w0 + b[1] * w1 + c[1] * w2 + d[1] * w3, z = a[2] * w0 + b[2] * w1 + c[2] * w2 + d[2] * w3;
      const k = this.stain && !glow ? this.stain(x, y, z, ny, col) : col;
      this.p.push(x, y, z); this.nr.push(nx, ny, nz); this.c.push(k[0], k[1], k[2]); this.g.push(glow, spine, this.wave[0], this.wave[1]); this.sk.push(glow ? 0 : this.skin[0], this.skin[1] - y, y - this.skin[2]);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = base + j * (nu + 1) + i; this.i.push(k, k + 1, k + nu + 2, k, k + nu + 2, k + nu + 1); }
  }
  // the same quad, turned so its front looks along `out`
  face(a, b, c, d, out, col, cell, glow, spine) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    const dot = (uy * vz - uz * vy) * out[0] + (uz * vx - ux * vz) * out[1] + (ux * vy - uy * vx) * out[2];
    if (dot >= 0) this.quad(a, b, c, d, col, cell, glow, spine); else this.quad(a, d, c, b, col, cell, glow, spine);
  }
  // an upright block in the plan: centre (e, n), y0 to y1, half length hl along bearing brg, half depth hd across it.
  // o.tilt (degrees) leans it about its length; o.top, o.side: colours; o.skip: faces left out ('t', 'b', 'a+', 'a-', 'c+', 'c-')
  box(e, n, y0, y1, hl, hd, brg, col, o = {}) {
    const b = brg * RAD, ax = Math.sin(b), az = -Math.cos(b), cx = Math.cos(b), cz = Math.sin(b), ym = (y0 + y1) / 2, hh = (y1 - y0) / 2;
    const t = (o.tilt || 0) * RAD, ct = Math.cos(t), st = Math.sin(t), skip = o.skip || 'b', cell = o.cell ?? 2.2, gl = o.glow || 0, sp = o.spine || 0;
    const rise = o.rise || 0, slope = o.slope || 0;
    const P = (a, c, h) => { const c2 = c * ct - h * st, h2 = c * st + h * ct; return [e + ax * a + cx * c2, ym + h2 + ((h > 0 ? rise : 0) + slope) * (a + hl) / (2 * hl), -n + az * a + cz * c2]; };
    const D = (a, c, h) => [ax * a + cx * (c * ct - h * st), c * st + h * ct, az * a + cz * (c * ct - h * st)];
    const top = o.top || col, side = o.side || col;
    if (!skip.includes('t')) this.face(P(-hl, -hd, hh), P(hl, -hd, hh), P(hl, hd, hh), P(-hl, hd, hh), D(0, 0, 1), top, cell, gl, sp);
    if (!skip.includes('b')) this.face(P(-hl, -hd, -hh), P(hl, -hd, -hh), P(hl, hd, -hh), P(-hl, hd, -hh), D(0, 0, -1), side, cell, gl, sp);
    if (!skip.includes('c+')) this.face(P(-hl, hd, -hh), P(hl, hd, -hh), P(hl, hd, hh), P(-hl, hd, hh), D(0, 1, 0), side, cell, gl, sp);
    if (!skip.includes('c-')) this.face(P(-hl, -hd, -hh), P(hl, -hd, -hh), P(hl, -hd, hh), P(-hl, -hd, hh), D(0, -1, 0), side, cell, gl, sp);
    if (!skip.includes('a+')) this.face(P(hl, -hd, -hh), P(hl, hd, -hh), P(hl, hd, hh), P(hl, -hd, hh), D(1, 0, 0), side, cell, gl, sp);
    if (!skip.includes('a-')) this.face(P(-hl, -hd, -hh), P(-hl, hd, -hh), P(-hl, hd, hh), P(-hl, -hd, hh), D(-1, 0, 0), side, cell, gl, sp);
  }
  // ONE LONG FACE OF A WALL WITH LIT OPENINGS. The face stands `off` metres across a block's axis (its sign says which
  // side it looks to). Each opening: { u, w, v0, v1, kind, toEnd, deep, splay }: the wall is laid round a hole `splay`
  // (0.3 m) wider than the pane on every side (not below a door); four dark splays run `deep` (0.45 m) in to the pane;
  // the pane is the room's own warm light. Over every opening a lintel stands 6 cm proud; under a window a sill
  // 0.24 m proud. A window carries bars (six panes); a slit carries two steel shutters folded back on the wall.
  wallFace(e, n, brg, off, y0, y1, hl, opens, col, T, spine) {
    const b = brg * RAD, ax = Math.sin(b), az = -Math.cos(b), cx = Math.cos(b), cz = Math.sin(b), sg = off < 0 ? -1 : 1, out = [cx * sg, 0, cz * sg];
    const Pt = (u, v, d = 0) => [e + ax * u + cx * (off - sg * d), v, -n + az * u + cz * (off - sg * d)];
    const H = opens.map((h) => { const floor = h.kind === 'door' || h.kind === 'doorway', S = h.splay ?? 0.3, Dp = h.deep ?? 0.45, p0 = h.u - h.w / 2, p1 = h.toEnd ? hl : h.u + h.w / 2; return { ...h, floor, S, Dp, p0, p1, u0: p0 - S, u1: h.toEnd ? hl : p1 + S, w0: floor ? h.v0 : h.v0 - S, w1: h.v1 + S }; }).sort((a, c) => a.u0 - c.u0);
    const rect = (u0, u1, v0, v1) => { if (u1 - u0 > 1e-3 && v1 - v0 > 1e-3) this.face(Pt(u0, v0), Pt(u1, v0), Pt(u1, v1), Pt(u0, v1), out, col, 2.2); };
    const top = this.skin[1];
    let u = -hl; for (const h of H) { rect(u, h.u0, y0, y1); if (!h.floor) this.skin[1] = h.w0; rect(h.u0, h.u1, y0, h.w0); this.skin[1] = top; rect(h.u0, h.u1, h.w1 + (h.w1 + 0.28 < y1 ? 0.28 : 0), y1); u = h.u1; } rect(u, hl, y0, y1);
    for (const h of H) { const um = (h.u0 + h.u1) / 2, uh = (h.u1 - h.u0) / 2;
      if (h.w1 + 0.28 < y1) { const c = Pt(um, 0, -0.03); this.skin[1] = h.w1 + 0.28; this.box(c[0], -c[2], h.w1, h.w1 + 0.28, uh + (h.toEnd ? 0 : 0.18), 0.03, brg, T.slab, { skip: 'b', cell: 2.2 }); }
      if (h.kind === 'window') { const c = Pt(um, 0, -0.08); this.skin[1] = h.w0; this.box(c[0], -c[2], h.w0 - 0.12, h.w0, uh + 0.14, 0.16, brg, T.slab, { skip: '', cell: 2.2 }); }
      this.skin[1] = top; }
    const keep = this.stain, ks = this.skin[0]; this.stain = null; this.skin[0] = 0;
    for (const h of H) { const Dp = h.Dp;
      const mid = Pt((h.u0 + h.u1) / 2, (h.w0 + h.w1) / 2, -2), sp = (a, b2, c, d) => { const q = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2]; this.face(a, b2, c, d, [mid[0] - q[0], mid[1] - q[1], mid[2] - q[2]], T.reveal, 9, -1, 0); };
      sp(Pt(h.u0, h.w0), Pt(h.p0, h.v0, Dp), Pt(h.p0, h.v1, Dp), Pt(h.u0, h.w1));
      if (!h.toEnd) sp(Pt(h.u1, h.w0), Pt(h.p1, h.v0, Dp), Pt(h.p1, h.v1, Dp), Pt(h.u1, h.w1));
      sp(Pt(h.u0, h.w1), Pt(h.p0, h.v1, Dp), Pt(h.p1, h.v1, Dp), Pt(h.u1, h.w1));
      if (!h.floor) sp(Pt(h.u0, h.w0), Pt(h.p0, h.v0, Dp), Pt(h.p1, h.v0, Dp), Pt(h.u1, h.w0));
      // the pane: the room's own light, a little fuller toward its head
      const vm = h.v0 + (h.v1 - h.v0) * 0.45;
      this.face(Pt(h.p0, h.v0, Dp), Pt(h.p1, h.v0, Dp), Pt(h.p1, vm, Dp), Pt(h.p0, vm, Dp), out, T.lit, 99, 1.85, spine(h.u));
      this.face(Pt(h.p0, vm, Dp), Pt(h.p1, vm, Dp), Pt(h.p1, h.v1, Dp), Pt(h.p0, h.v1, Dp), out, T.lit, 99, 2.05, spine(h.u));
      const bar = (u0, u1, v0, v1) => this.face(Pt(u0, v0, Dp - 0.04), Pt(u1, v0, Dp - 0.04), Pt(u1, v1, Dp - 0.04), Pt(u0, v1, Dp - 0.04), out, T.reveal, 99, -1, 0);
      if (h.kind === 'window') { const w2 = (h.p0 + h.p1) / 2, v3 = (h.v1 - h.v0) / 3; bar(w2 - 0.03, w2 + 0.03, h.v0, h.v1); bar(h.p0, h.p1, h.v0 + v3 - 0.025, h.v0 + v3 + 0.025); bar(h.p0, h.p1, h.v0 + 2 * v3 - 0.025, h.v0 + 2 * v3 + 0.025); }
      if (h.kind === 'slit') for (const sd of h.toEnd ? [-1] : [-1, 1]) { const c0 = sd < 0 ? h.u0 - 0.08 - 0.8 : h.u1 + 0.08, c1 = c0 + 0.8;
        this.face(Pt(c0, h.w0 + 0.1, -0.05), Pt(c1, h.w0 + 0.1, -0.05), Pt(c1, h.w1 - 0.1, -0.05), Pt(c0, h.w1 - 0.1, -0.05), out, T.steel, 99, 0, 0);
        for (const ue of [c0, c1]) this.face(Pt(ue, h.w0 + 0.1, 0), Pt(ue, h.w0 + 0.1, -0.05), Pt(ue, h.w1 - 0.1, -0.05), Pt(ue, h.w1 - 0.1, 0), [ax * (ue === c0 ? -1 : 1), 0, az * (ue === c0 ? -1 : 1)], T.steel, 99, 0, 0);
        this.face(Pt(c0, h.w1 - 0.1, 0), Pt(c1, h.w1 - 0.1, 0), Pt(c1, h.w1 - 0.1, -0.05), Pt(c0, h.w1 - 0.1, -0.05), [0, 1, 0], T.steel, 99, 0, 0); }
    }
    this.stain = keep; this.skin[0] = ks;
  }
  // an upright round of `sides` flat faces between two heights (never eight sides); cap: a flat top
  tube(e, n, y0, y1, r0, r1, sides, col, cap = true, glow = 0, spine = 0) {
    const R = (k, r, y) => { const a = (k / sides) * TAU; return [e + Math.cos(a) * r, y, -n + Math.sin(a) * r]; };
    for (let k = 0; k < sides; k++) { const a = ((k + 0.5) / sides) * TAU; this.face(R(k, r0, y0), R(k + 1, r0, y0), R(k + 1, r1, y1), R(k, r1, y1), [Math.cos(a), 0.01, Math.sin(a)], col, 9, glow, spine); }
    if (cap) for (let k = 0; k < sides; k++) this.face(R(k, r1, y1), R(k + 1, r1, y1), [e, y1, -n], [e, y1, -n], [0, 1, 0], col, 9, glow, spine);
  }
  get triangles() { return this.i.length / 3; }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nr, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.g, 4)); g.setAttribute('aSkin', new THREE.Float32BufferAttribute(this.sk, 3));
    g.setIndex(this.i); g.computeBoundingSphere(); g.computeBoundingBox(); return g;
  }
}
// THE LAMPS' SHARED DIP, as shader text: to 0.7 for 0.8 s every 13 s, running up the spine at 30 metres a second from
// ONE dealt place in its cycle (uLampDip, 0 to 13 s, by the 'lamps' stream), and each lamp's own dealt waver (ph: its
// phase 0 to 1, am: its breadth 0.5 to 1.5; a light that is no lamp's carries 0, 0). sp: spine metres; t: the clock
export const DIP_GLSL = /* glsl */`
uniform float uLampDip;
float lampDip(float sp, float t, float ph, float am) {
  float c = fract((t + uLampDip - sp / 30.0) / 13.0) * 13.0;
  float dip = 1.0 - 0.3 * smoothstep(0.0, 0.14, c) * (1.0 - smoothstep(0.66, 0.8, c));
  return dip * (1.0 + 0.05 * am * sin(t * (5.0 + ph * 4.0) + ph * 40.0));
}`;
// THE CONCRETE'S SKIN, by place, as shader text: board marks 0.28 m high and pour lines every 1.4 m on upright faces,
// joints every 3.1 m, dark streaks under every coping and sill (vSkin.y: metres under it), a damp band at the foot
// (vSkin.z: metres over it), moss in joints and on faces that look north, cracks. On a roof slab: bays between joints
// and shallow puddles; the court's floor: one thin sheet of rain water. Returns the colour and how wet the place is.
const winLines = (list, door) => list.map((n) => `a = max(a, lurWin(hn, hy, ${n.toFixed(1)}, 0.7, 11.7, 13.5));`).join(' ') + ` a = max(a, lurWin(hn, hy, ${door.toFixed(1)}, 0.6, 9.0, 11.2));`;
export const SKIN_GLSL = /* glsl */`
uniform vec3 uSkyHi; uniform vec3 uSkyLo; uniform vec3 uMoss; uniform vec3 uPane; uniform float uCourtSun;
uniform vec4 uRing[6]; uniform float uRingF[6];
vec2 lurRings(vec3 w, float t) {
  vec2 rip = vec2(0.0);
  for (int i = 0; i < 6; i++) {
    vec2 d = w.xz - uRing[i].xy; float l = length(d) + 1e-3;
    float age = fract(t / max(uRing[i].z, 0.5) + uRing[i].w) * uRing[i].z - uRingF[i];
    float r = 0.2 + 0.6 * age;
    float k = step(0.0, age) * (1.0 - smoothstep(0.35, 1.0, age / max(uRing[i].z - uRingF[i], 0.3))) * exp(-(l - r) * (l - r) * 26.0);
    rip += (d / l) * (k * sin((l - r) * 24.0) * 0.45);
  }
  return rip;
}
float lurH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float lurN(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lurH(i), lurH(i + vec2(1.0, 0.0)), f.x), mix(lurH(i + vec2(0.0, 1.0)), lurH(i + vec2(1.0, 1.0)), f.x), f.y); }
float lurF(vec2 p) { return 0.6 * lurN(p) + 0.3 * lurN(p * 2.3 + 7.1) + 0.1 * lurN(p * 5.1 + 3.3); }
float lurWin(float n, float y, float c, float hw, float y0, float y1) {
  return (1.0 - smoothstep(hw - 0.08, hw + 0.08, abs(n - c))) * smoothstep(y0 - 0.06, y0 + 0.06, y) * (1.0 - smoothstep(y1 - 0.06, y1 + 0.06, y)); }
vec4 lurSkin(vec3 col, vec3 w, vec3 n, vec3 sk) {
  float kind = floor(sk.x + 0.5);
  if (kind < 0.5) return vec4(col, 0.0);
  float up = step(0.6, n.y);
  vec2 tg = normalize(vec2(-n.z, n.x) + vec2(1e-4, 0.0));
  float u = mix(dot(w.xz, tg), w.x, up); float v = mix(w.y, w.z, up);
  float bh = mix(0.28, 3.1, up);
  float tone = (0.9 + 0.16 * lurH(vec2(floor(v / bh), floor(u / 3.1) + 3.0 * up))) * (0.95 + 0.08 * lurH(vec2(floor(v / 1.4), 7.0 + up)));
  float db = (0.5 - abs(fract(v / bh) - 0.5)) * bh; float dj = (0.5 - abs(fract(u / 3.1) - 0.5)) * 3.1; float dp = (0.5 - abs(fract(v / 1.4) - 0.5)) * 1.4;
  float lb = 1.0 - smoothstep(0.004, mix(0.025, 0.05, up), db); float lj = 1.0 - smoothstep(0.01, 0.045, dj); float lp = (1.0 - smoothstep(0.0, 0.05, dp)) * (1.0 - up);
  float mz = lurF(vec2(u, v) * 0.45 + 11.0);
  float st = smoothstep(0.5, 0.85, lurN(vec2(u * 2.1, v * 0.11 + 1.7))) * (1.0 - smoothstep(0.3, 4.0, sk.y)) * (1.0 - up);
  float wash = (1.0 - smoothstep(0.0, 0.7, sk.y)) * 0.25 * (1.0 - up);
  float damp = (1.0 - smoothstep(0.05, 0.5 + 0.4 * lurN(vec2(u * 0.8, 2.0)), sk.z)) * (1.0 - up);
  float crack = (1.0 - smoothstep(0.004, 0.014, abs(lurN(vec2(u, v) * 0.55 + 20.0) - 0.5))) * step(0.55, lurN(vec2(u, v) * 0.13 + 5.0));
  float north = clamp(-n.z, 0.0, 1.0);
  float moss = mix(smoothstep(0.56 - 0.2 * north - 0.25 * lj - 0.22 * damp, 0.78, mz), clamp(max(lj, lb) * smoothstep(0.25, 0.55, mz) + smoothstep(0.62, 0.8, mz), 0.0, 1.0), up);
  vec3 c = col * tone * (1.0 - 0.12 * lb * (1.0 - up) - 0.3 * max(lj, lb * up) - 0.1 * lp - 0.45 * crack);
  c = mix(c, c * vec3(0.5, 0.56, 0.52), clamp(st * 0.8 + wash, 0.0, 1.0));
  c = mix(c, c * vec3(0.55, 0.62, 0.58), damp * 0.7);
  c = mix(c, uMoss * (0.7 + 0.5 * mz), moss * 0.75);
  float wet = up * (kind > 2.5 ? 1.0 : kind > 1.5 ? smoothstep(0.6, 0.64, lurF(w.xz * 0.16 + 31.0)) : 0.0);
  if (kind > 1.5 && kind < 2.5 && up > 0.5) {
    vec2 q = w.xz - vec2(${kerbs()[0][0].toFixed(2)}, ${(-kerbs()[0][1]).toFixed(2)}); vec2 rd = vec2(${onBearing(K.ROOF.row)[0].toFixed(4)}, ${(-onBearing(K.ROOF.row)[1]).toFixed(4)});
    float al = dot(q, rd); float ac = dot(q, vec2(-rd.y, rd.x));
    float dk = max(abs(al - 5.94 * clamp(floor(al / 5.94 + 0.5), 0.0, 9.0)), abs(ac)) - 0.95;
    float lf = lurF(w.xz * 0.9 + 17.0);
    float path = 1.0 - smoothstep(0.6, 1.0, abs(ac - 3.0));
    float litter = clamp(smoothstep(0.5, 0.68, lf) * 0.75 + (1.0 - smoothstep(0.0, 0.9, dk - 0.6 * lf + 0.25)), 0.0, 1.0) * (1.0 - path);
    c = mix(c, vec3(0.4, 0.3, 0.14) * (0.6 + 0.8 * lurN(w.xz * 7.0)), litter * 0.85);
    c = mix(c, c * 1.07, path * 0.5); wet *= 1.0 - litter;
  }
  return vec4(c, wet);
}
vec3 lurMirror(vec3 w, vec3 eye, float kind, float t, vec2 rip) {
  vec3 V = normalize(w - eye);
  vec3 R = normalize(vec3(V.x + rip.x, max(-V.y, 0.02), V.z + rip.y));
  float fr = 0.04 + 0.96 * pow(1.0 - clamp(-V.y, 0.0, 1.0), 5.0);
  vec3 refl = mix(uSkyLo, uSkyHi, clamp(R.y * 1.6, 0.0, 1.0));
  if (kind > 2.5) {
    float east = step(0.0, R.x); float rx = R.x >= 0.0 ? max(R.x, 1e-3) : min(R.x, -1e-3);
    float tx = (mix(${(K.COURT.e0).toFixed(2)}, ${(K.COURT.e1).toFixed(2)}, east) - w.x) / rx;
    float hy = w.y + R.y * tx; float hn = -(w.z + R.z * tx); float a = 0.0;
    if (east > 0.5) { ${winLines(WINDOWS.east, DOORWAYS.east)} } else { ${winLines(WINDOWS.west, DOORWAYS.west)} }
    vec3 wall = mix(vec3(0.07, 0.14, 0.14), vec3(0.9, 0.46, 0.17), east * smoothstep(uCourtSun - 0.3, uCourtSun + 0.3, hy));
    wall = mix(wall, uPane * lampDip(hn - 138.0, t, 0.0, 0.0), a);
    refl = mix(refl, wall, (1.0 - smoothstep(${(K.LIP + 0.3).toFixed(2)}, ${(K.LIP + 0.5).toFixed(2)}, hy)) * step(${K.COURT.n0.toFixed(1)}, hn) * step(hn, ${K.COURT.n1.toFixed(1)}));
    fr = max(fr, 0.16 * a);
  }
  return refl * fr;
}`;
// concrete, timber, enamel: sun and sky by the scene's lights (the sun's shade by the sun map, see underSun); lamp
// light as the surface's own colour times the lamps' colour (aGlow.x up to 1.6), dipping by spine metres (aGlow.y)
// and wavering with the lamp it comes from (aGlow.z, aGlow.w); from 1.75 up aGlow.x is a thing's OWN light (a lit
// pane, a bulb): its colour times (aGlow.x - 1); below 0: a dark reveal that takes no lamp light
export function lampLitMaterial(U, o = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLampTime = U.time; sh.uniforms.uLampCol = U.lampCol; sh.uniforms.uLampDip = U.dip; sh.uniforms.uSkyHi = U.skyHi; sh.uniforms.uSkyLo = U.skyLo; sh.uniforms.uMoss = U.moss; sh.uniforms.uPane = U.pane; sh.uniforms.uCourtSun = U.courtSun; sh.uniforms.uRing = U.ring; sh.uniforms.uRingF = U.ringF;
    sh.vertexShader = 'attribute vec4 aGlow;\nattribute vec3 aSkin;\nvarying vec4 vGlow;\nvarying vec3 vSkin;\nvarying vec3 vSkinW;\nvarying vec3 vSkinN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGlow = aGlow; vSkin = aSkin; vSkinW = (modelMatrix * vec4(transformed, 1.0)).xyz; vSkinN = normal;');
    sh.fragmentShader = 'uniform float uLampTime;\nuniform vec3 uLampCol;\nvarying vec4 vGlow;\nvarying vec3 vSkin;\nvarying vec3 vSkinW;\nvarying vec3 vSkinN;\n' + DIP_GLSL + SKIN_GLSL + '\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n  vec4 lurSk = lurSkin(diffuseColor.rgb, vSkinW, normalize(vSkinN), vSkin);\n  diffuseColor.rgb = lurSk.rgb * (1.0 - 0.5 * lurSk.a);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += mix(uLampCol * min(max(vGlow.x, 0.0), 1.6), vec3(max(vGlow.x - 1.0, 0.0)), step(1.75, vGlow.x)) * diffuseColor.rgb * lampDip(vGlow.y, uLampTime, vGlow.z, vGlow.w);\n  if (lurSk.a > 0.0) totalEmissiveRadiance += lurSk.a * lurMirror(vSkinW, cameraPosition, floor(vSkin.x + 0.5), uLampTime, 0.014 * (vec2(lurN(vSkinW.xz * 2.6 + uLampTime * 0.21), lurN(vSkinW.zx * 2.6 - uLampTime * 0.19)) - 0.5) + (vSkin.x > 2.5 ? lurRings(vSkinW, uLampTime) : vec2(0.0)));');
  };
  return m;
}

// The lamps' pools on a thing that is not the Works' own concrete (the ground, a root): the thing carries, vertex by
// vertex, how much lamp light reaches it by place (aLampG.x, as aGlow.x above), the spine metres of the lamps that
// light it (aLampG.y) and their dealt waver (aLampG.z, aLampG.w), so that the pool dips and wavers with its lamp.
export function underLamps(mat, U, key) {
  const prev = mat.onBeforeCompile, pk = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => { if (prev) prev.call(mat, sh, r);
    sh.uniforms.uLampTime = U.time; sh.uniforms.uLampCol = U.lampCol; sh.uniforms.uLampDip = U.dip;
    sh.vertexShader = 'attribute vec4 aLampG;\nvarying vec4 vLampG;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLampG = aLampG;');
    sh.fragmentShader = 'uniform float uLampTime;\nuniform vec3 uLampCol;\nvarying vec4 vLampG;\n' + DIP_GLSL + '\n' + sh.fragmentShader
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uLampCol * max(vLampG.x, 0.0) * diffuseColor.rgb * lampDip(vLampG.y, uLampTime, vLampG.z, vLampG.w);');
  };
  mat.customProgramCacheKey = () => pk() + '|lamps:' + key; mat.needsUpdate = true;
}

// ---------------------------------------------------------------- THE SUN'S SHADE, laid once across the sun's rays
// A plane across the sun's rays holds, for every ray that crosses the island near the line, how far toward the sun the
// nearest thing on that ray stands and how whole its shade is (a trunk, a wall: whole; a crown's broken edge and the
// gaps of sky inside it: partial). A place is in shade where a thing stands on its ray nearer the sun than itself.
// The plane is laid from the things' own places when the world is built; it is the same from every side.
// box: [u0, u1, v0, v1, t0] in metres of that plane (u across, v up it, t toward the sun); du, dv: one cell.
export function makeSunMap(sd, box, du = 0.3, dv = 0.12) {
  const al = Math.hypot(sd[2], sd[0]), ax = [sd[2] / al, 0, -sd[0] / al], ay = [sd[1] * ax[2] - sd[2] * ax[1], sd[2] * ax[0] - sd[0] * ax[2], sd[0] * ax[1] - sd[1] * ax[0]];
  // (the box may be given as the places it must hold, each [x, y, z])
  if (Array.isArray(box[0])) { const b = [1e9, -1e9, 1e9, -1e9, 1e9]; for (const q of box) { const u = q[0] * ax[0] + q[1] * ax[1] + q[2] * ax[2], v = q[0] * ay[0] + q[1] * ay[1] + q[2] * ay[2], t = q[0] * sd[0] + q[1] * sd[1] + q[2] * sd[2];
    b[0] = Math.min(b[0], u); b[1] = Math.max(b[1], u); b[2] = Math.min(b[2], v); b[3] = Math.max(b[3], v); b[4] = Math.min(b[4], t); } b[4] -= 40; box = b; }
  const [u0, u1, v0, v1, t0] = box, W = Math.ceil((u1 - u0) / du), H = Math.ceil((v1 - v0) / dv), D = new Uint16Array(W * H), O = new Uint8Array(W * H), OS = new Uint8Array(W * H), TS = 32;
  const U = (x, y, z) => (x * ax[0] + y * ax[1] + z * ax[2] - u0) / du, V = (x, y, z) => (x * ay[0] + y * ay[1] + z * ay[2] - v0) / dv, T = (x, y, z) => x * sd[0] + y * sd[1] + z * sd[2];
  const code = (t) => Math.max(1, Math.min(65535, Math.round((t - t0) * TS)));
  // a smooth field of chance, 64 by 128 cells, that repeats: the broken edge of a crown and its gaps of sky
  const NZ = new Uint8Array(64 * 128); { let q = 20041; const lat = new Float32Array(256); for (let i = 0; i < 256; i++) { q = (q * 1103515245 + 12345) & 0x7fffffff; lat[i] = (q >> 8) / 8388608; }
    for (let j = 0; j < 128; j++) for (let i = 0; i < 64; i++) { const fx = i / 4, fy = j / 8, ix = Math.floor(fx), iy = Math.floor(fy), a = fx - ix, b = fy - iy, g = (x, y) => lat[((y & 15) << 4) | (x & 15)];
      NZ[j * 64 + i] = 255 * ((g(ix, iy) * (1 - a) + g(ix + 1, iy) * a) * (1 - b) + (g(ix, iy + 1) * (1 - a) + g(ix + 1, iy + 1) * a) * b); } }
  // a round thing seen along the ray (sq: how flat it lies). leaf 0: whole. leaf > 0: whole at its heart, broken toward
  // its edge, with gaps
  const disc = (x, y, z, r, leaf = 0, sq = 1) => {
    const cu = U(x, y, z), cv = V(x, y, z), c = code(T(x, y, z)), ru = r / du, rv = r * sq / dv, j0 = Math.max(0, Math.ceil(cv - rv)), j1 = Math.min(H - 1, Math.floor(cv + rv));
    for (let j = j0; j <= j1; j++) { const dy = (j - cv) / rv, hw = ru * Math.sqrt(Math.max(0, 1 - dy * dy)), i0 = Math.max(0, Math.ceil(cu - hw)), i1 = Math.min(W - 1, Math.floor(cu + hw));
      for (let i = i0, k = j * W + i0; i <= i1; i++, k++) { let o = 255;
        if (leaf > 0) { const dx = (i - cu) / ru, n = NZ[((j & 127) << 6) | (i & 63)] / 255, q = Math.sqrt(dx * dx + dy * dy) + leaf * (n - 0.5), n2 = NZ[(((j + 37) & 127) << 6) | ((i + 21) & 63)];
          o = q < 0.6 ? 255 : q > 0.98 ? 0 : 255 * (0.98 - q) / 0.38; if (n2 > 176) o *= 0.15; if (o < 8) continue; } else OS[k] = 255;
        if (o > O[k]) O[k] = o; if (c > D[k]) D[k] = c; } }
  };
  // a limb or trunk from a to b [x, y, z, radius]: round things in a row
  const seg = (a, b, leaf = 0) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.ceil(len / Math.max(0.2, 0.6 * Math.min(a[3], b[3]))));
    for (let i = 0; i <= n; i++) { const t = i / n; disc(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, leaf); } };
  // a flat three-cornered face (whole shade), corners as [x, y, z]
  const tri = (A, B, C) => {
    const xa = U(...A), ya = V(...A), ta = T(...A), xb = U(...B), yb = V(...B), tb = T(...B), xc = U(...C), yc = V(...C), tc = T(...C), ar = (xb - xa) * (yc - ya) - (xc - xa) * (yb - ya);
    if (Math.abs(ar) < 1e-6) return; const i0 = Math.max(0, Math.floor(Math.min(xa, xb, xc))), i1 = Math.min(W - 1, Math.ceil(Math.max(xa, xb, xc))), j0 = Math.max(0, Math.floor(Math.min(ya, yb, yc))), j1 = Math.min(H - 1, Math.ceil(Math.max(ya, yb, yc)));
    for (let j = j0; j <= j1; j++) for (let i = i0, k = j * W + i0; i <= i1; i++, k++) { const w0 = ((xb - i) * (yc - j) - (xc - i) * (yb - j)) / ar, w1 = ((xc - i) * (ya - j) - (xa - i) * (yc - j)) / ar, w2 = 1 - w0 - w1;
      if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue; const c = code(ta * w0 + tb * w1 + tc * w2); O[k] = 255; OS[k] = 255; if (c > D[k]) D[k] = c; }
  };
  // an upright block of the plan (centre e, n; y0 to y1; half length hl on bearing brg, half depth hd; its top may rise along its length)
  const block = (b) => { const r = b.brg * RAD, sx = Math.sin(r), sz = -Math.cos(r), cx = Math.cos(r), cz = Math.sin(r), P8 = [];
    for (const h of [0, 1]) for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P8.push([b.e + sx * a * b.hl + cx * c * b.hd, h ? b.y1 + (b.rise || 0) * (a + 1) / 2 : b.y0, -b.n + sz * a * b.hl + cz * c * b.hd]);
    for (const [i, j, k, l] of [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) { tri(P8[i], P8[j], P8[k]); tri(P8[i], P8[k], P8[l]); } };
  const texture = () => { const px = new Uint8Array(W * H * 4); for (let k = 0; k < W * H; k++) { px[k * 4] = D[k] >> 8; px[k * 4 + 1] = D[k] & 255; px[k * 4 + 2] = O[k]; px[k * 4 + 3] = OS[k]; }
    const tx = new THREE.DataTexture(px, W, H, THREE.RGBAFormat, THREE.UnsignedByteType); tx.magFilter = tx.minFilter = THREE.NearestFilter; tx.generateMipmaps = false; tx.needsUpdate = true; return tx; };
  // is the place inside the plane's box (with a margin in metres)? how whole is the shade there (0 lit .. 1 whole)?
  const holds = (x, y, z, m = 0) => { const u = U(x, y, z) * du, v = V(x, y, z) * dv; return u > m && v > m * 0.3 && u < W * du - m && v < H * dv - m * 0.3; };
  const shadeAt = (x, y, z) => { const i = Math.round(U(x, y, z)), j = Math.round(V(x, y, z)); if (i < 0 || j < 0 || i >= W || j >= H) return 0; const k = j * W + i; return D[k] > code(T(x, y, z) + 0.6) ? O[k] / 255 : 0; };
  return { W, H, ax, ay, sd, disc, seg, tri, block, texture, holds, shadeAt, box: [u0, v0, 1 / du, 1 / dv], dep: [t0, 1 / TS, W, H] };
}
// the shader's reading of that plane and of the ground's own long shade (the ridges', the peak's: the ground kit's
// map). The crowns move in the wind, so the broken part of a shade (leaves) is read a hand's breadth aside, to and
// fro on the world's clock: the gold streaks tremble; a wall's or a trunk's shade stands still. On the rare visit
// the one wide cloud's shade (uSunCloud: its place along the wind, its half breadth, its depth) takes the sun's
// light away under it, the gold streaks with the rest.
export const SUN_GLSL = /* glsl */`
uniform sampler2D uSunMap; uniform sampler2D uSunTerr; uniform vec4 uSunBox; uniform vec4 uSunDep; uniform vec4 uSunTerrBox; uniform vec3 uSunAx; uniform vec3 uSunAy; uniform vec3 uSunSd;
uniform float uSunTime; uniform vec4 uSunCloud;
vec2 lurOcc(ivec2 q, float t) {
  if (q.x < 0 || q.y < 0 || q.x >= int(uSunDep.z) || q.y >= int(uSunDep.w)) return vec2(0.0);
  vec4 c = texelFetch(uSunMap, q, 0);
  return c.ba * step(t, uSunDep.x + (c.r * 65280.0 + c.g * 255.0) * uSunDep.y);
}
vec2 lurTap(vec3 w, float t) {
  vec2 g = (vec2(dot(w, uSunAx), dot(w, uSunAy)) - uSunBox.xy) * uSunBox.zw - 0.5;
  ivec2 q = ivec2(floor(g)); vec2 f = fract(g);
  return mix(mix(lurOcc(q, t), lurOcc(q + ivec2(1, 0), t), f.x), mix(lurOcc(q + ivec2(0, 1), t), lurOcc(q + ivec2(1, 1), t), f.x), f.y);
}
vec2 lurSun(vec3 w, float nl) {
  vec4 sm = texture2D(uSunTerr, (w.xz - uSunTerrBox.xy) * uSunTerrBox.zw);
  float vis = max(sm.r, smoothstep(sm.b - 0.5, sm.b + 3.0, w.y));
  vis *= 1.0 - uSunCloud.z * (1.0 - smoothstep(uSunCloud.y * 0.5, uSunCloud.y, abs(dot(w.xz, vec2(0.866, 0.5)) - uSunCloud.x)));
  float t = dot(w, uSunSd) + 0.3 + 0.55 * (1.0 - clamp(nl, 0.0, 1.0));
  vec2 still = lurTap(w, t);
  vec2 moved = lurTap(w + (uSunAx * sin(uSunTime * 1.9 + w.x * 0.31 + w.z * 0.23) + uSunAy * sin(uSunTime * 1.3 + w.z * 0.37 - w.x * 0.17)) * 0.13, t);
  float whole = still.y; float all = max(whole, clamp(moved.x - moved.y, 0.0, 1.0));
  return vis * (1.0 - vec2(all, max(whole, all * 0.5)));
}`;
// THE LIGHT OF TWO PLACES, by place: the heart's gold pours out of its mouth across the meadow, the water and the
// rock about it (uHeart: the middle of the mouth and its strength; uHeartF: the way it looks out, in the plan); the
// hatch's pale light stands in its shaft (uHatch: the glass and its strength) and lands on what is round it. A place
// takes each by its distance and by how it is turned to it; nothing here reads the eye. w: the place; nw: its normal.
export const PLACE_LIGHT_GLSL = /* glsl */`
uniform vec4 uHeart; uniform vec3 uHeartC; uniform vec2 uHeartF; uniform vec4 uHatch; uniform vec3 uHatchC;
vec3 lurPlaceLight(vec3 w, vec3 nw) {
  vec3 gd = uHeart.xyz - w; float gl = dot(gd, gd);
  float g = uHeart.w * smoothstep(-3.0, 6.0, dot(w.xz - uHeart.xz, uHeartF)) / (1.0 + gl * 0.0016) * (1.0 - smoothstep(120.0, 200.0, sqrt(gl))) * (0.3 + 0.7 * max(dot(nw, gd) * inversesqrt(max(gl, 1e-4)), 0.0));
  float hy = clamp(w.y, uHatch.y + 0.3, uHatch.y + 12.0); vec3 hd = vec3(uHatch.x, hy, uHatch.z) - w; float hl = dot(hd, hd);
  float h = uHatch.w * mix(1.0, 0.3, (hy - uHatch.y) / 12.0) / (1.0 + hl * 0.03) * (1.0 - smoothstep(14.0, 30.0, sqrt(hl))) * (0.3 + 0.7 * max(dot(nw, hd) * inversesqrt(max(hl, 1e-4)), 0.0));
  return uHeartC * g + uHatchC * h;
}`;
// Lay the sun's shade on a lit material (Lambert or Standard, the kit's own included): where a place is in shade the
// sun's own light is taken away and the sky's fill stays. The low sun's light counts whole on any face it reaches
// (a floor under a 14 degree sun is as gold as a wall): the face's turn from the sun only fades it in.
// leaf: the material is the plants' own; its leaves take another crown's shade as half (light goes on through
// leaves), a trunk's or a wall's whole.
export function underSun(mat, U, key, leaf = false) {
  if (!mat || mat.userData.lurSun) return; mat.userData.lurSun = true;
  const prev = mat.onBeforeCompile, pk = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => { if (prev) prev.call(mat, sh, r);
    if (!sh.fragmentShader.includes('#include <lights_fragment_end>') || !sh.fragmentShader.includes('vViewPosition')) return;
    for (const k of ['uSunMap', 'uSunTerr', 'uSunBox', 'uSunDep', 'uSunTerrBox', 'uSunAx', 'uSunAy', 'uSunSd', 'uSunTime', 'uSunCloud', 'uHatch', 'uHatchC', 'uHeart', 'uHeartC', 'uHeartF']) sh.uniforms[k] = U[k];
    sh.fragmentShader = SUN_GLSL + PLACE_LIGHT_GLSL + '\nfloat lurSV = 1.0;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
      { vec3 lurHW = (-vViewPosition) * mat3(viewMatrix) + cameraPosition; reflectedLight.indirectDiffuse += diffuseColor.rgb * lurPlaceLight(lurHW, normalize(normal * mat3(viewMatrix))); }
      #if NUM_DIR_LIGHTS > 0
      { vec3 lurW = (-vViewPosition) * mat3(viewMatrix) + cameraPosition; float lurNL = dot(normal, directionalLights[0].direction);
        vec2 lurS2 = lurSun(lurW, lurNL); lurSV = ${leaf ? 'mix(lurS2.x, lurS2.y, clamp(vFlora.x, 0.0, 1.0))' : 'lurS2.x'};
        reflectedLight.directDiffuse *= lurSV * clamp(lurNL * 4.0, 0.0, 1.0) / max(lurNL, 0.05); reflectedLight.directSpecular *= lurSV; }
      #endif`).replace('reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb', 'reflectedLight.directDiffuse += lurSV * directionalLights[0].color * diffuseColor.rgb');
  };
  mat.customProgramCacheKey = () => pk() + '|sun:' + key; mat.needsUpdate = true;
}

// ---------------------------------------------------------------- THE WORKS as geometry
// lit: a lit pane's own amber (it shows as #ffb45a through the page's film curve)
export const TONE = { wall: lin('#b4b2a4'), slab: lin('#bfbbac'), timber: lin('#8d7250'), enamel: lin('#f2f0e6'), zinc: lin('#9aa59d'), lit: [3.1, 1.0, 0.22], reveal: lin('#3f5a52'),
  steel: lin('#5f7068'), lichen: lin('#7f9a5e'), paint: lin('#a9b89a'), clay: lin('#c56a3a'), dark: lin('#4a5650'), gutter: lin('#8a9189'), glass: lin('#ffe2a8'), leaf: lin('#5fa043') };
// lichen and weather on concrete, by place: grey-green blooms, more on tops and near the ground, a little cell-to-cell change
const concreteStain = (x, y, z, ny, col) => {
  const top = ny > 0.5, f = NZ.fbm2(x * (top ? 0.34 : 0.13) + 11.3, z * (top ? 0.34 : 0.13) - 4.1, 3) + 0.35 * NZ.n2(x * 0.7 + y * 0.9, z * 0.7 - y * 0.6), li = smoothstep(0.02, 0.62, f + (top ? 0.1 : 0));
  const k = mix3(col, TONE.lichen, li * (top ? 0.24 : 0.5)), d = (top ? 0.95 : 0.9) + (top ? 0.07 : 0.14) * NZ.n2(x * 0.37 - 2, z * 0.37 + y * 0.31);
  return [k[0] * d, k[1] * d, k[2] * d];
};
// what the builder counts as it builds (the count reads these, not typed numbers)
export const tallyOf = (A, name, by = 1) => { A.tally = A.tally || {}; A.tally[name] = (A.tally[name] || 0) + by; };
export function worksGeometry(plan) {
  const A = new Acc(), T = TONE, C = K.COURT, F = K.FLOOR, L = K.LIP, S = K.STAIR, Lp = plan.lamps, spineOf = (n) => n - 138;
  const tones = [T.wall, T.slab, T.timber, T.enamel, T.zinc, T.lit];
  const concrete = (kind, top, foot) => { A.stain = concreteStain; A.skin = [kind, top, foot]; }, plain = () => { A.stain = null; A.skin = [0, 0, 0]; };
  for (const b of worksBlocks()) {
    const col = tones[b.tone] || T.wall, own = b.tone === 5; let skip = b.under || b.tilt !== undefined || b.tone === 2 ? '' : 'b';
    if (b.tone >= 2) plain(); else concrete(b.k === 'the court\'s floor' ? 3 : b.k === 'the roof slab' ? 2 : 1, b.y1 + Math.max(0, b.rise || 0), b.y0 + 0.5);
    if (b.open) for (const sd of [1, -1]) { const list = b.open.filter((o) => o.side === sd); if (!list.length) continue; const ob = onBearing(b.brg); skip += sd > 0 ? ' c+' : ' c-';
      A.wallFace(b.e, b.n, b.brg, sd * b.hd, b.y0, b.y1, b.hl, list, col, T, (u) => b.n + ob[1] * u - 138);
      // a plank leaf standing ajar in a doorway: hinged on one jamb 0.3 m inside the reveal, swung 32 degrees out
      for (const o of list) if (o.leaf) { plain(); const nb = b.brg + 90 * sd, hg = along(along([b.e, b.n], b.brg, o.u - o.leaf * o.w / 2), nb, b.hd - 0.3), lb = o.leaf > 0 ? b.brg + sd * 32 : b.brg + 180 - sd * 32, c = along(hg, lb, o.w / 2);
        A.box(c[0], c[1], o.v0 + 0.02, o.v1 - 0.02, o.w / 2, 0.03, lb, T.paint, { skip: '', cell: 0.3 }); tallyOf(A, 'leaves ajar in the room\'s doorway'); concrete(1, b.y1, b.y0 + 0.5); } }
    A.box(b.e, b.n, b.y0, b.y1, b.hl, b.hd, b.brg, col, { tilt: b.tilt || 0, rise: b.rise || 0, glow: own ? 1.95 : 0, spine: spineOf(b.n), skip, cell: own ? 99 : 2.2 });
  }
  // THE STAIR: every tread in two halves either side of a drain channel 0.4 m wide down its middle; a pipe rail on the west wall
  for (const t of STEPS) { const hw = (S.w / 2 - 0.2) / 2, m = (t[0] + t[1]) / 2, hl = (t[1] - t[0]) / 2; concrete(1, t[2] + 9, t[2] - 0.5);
    for (const sd of [-1, 1]) A.box(S.e + sd * (0.2 + hw), m, t[2] - 0.5, t[2], hl, hw, 0, T.slab, { skip: 'b a-' + (sd < 0 ? ' c-' : ' c+'), cell: 3 });
    plain(); A.box(S.e, m, t[2] - 0.6, t[2] - 0.16, hl, 0.2, 0, T.gutter, { skip: 'b a- c+ c-', cell: 9 }); }
  plain();
  A.box(S.e - S.w / 2 + 0.12, (S.n0 + S.n1) / 2, L + 0.97, L + 1.03, (S.n1 - S.n0) / 2 - 0.6, 0.03, 0, T.steel, { skip: '', slope: -(L - F), cell: 99 });
  for (let n = S.n0 + 0.8; n < S.n1 - 0.6; n += 4.9) { A.box(S.e - S.w / 2 + 0.06, n, stairY(n) + 0.9, stairY(n) + 1.0, 0.03, 0.06, 0, T.steel, { skip: 'b', cell: 99 }); tallyOf(A, 'brackets of the stair\'s pipe rail'); }
  // THE COURT'S CONDUIT: a pipe run 2.2 m over the floor in three lengths (each lamp's feed comes through the wall
  // behind it: no upright runs to a lamp, so that no lamp reads as standing on a post)
  for (const [sd, n0, n1] of CONDUIT) { A.box((sd > 0 ? C.e0 : C.e1) + sd * 0.07, (n0 + n1) / 2, F + 2.17, F + 2.23, (n1 - n0) / 2, 0.03, 0, T.steel, { skip: '', cell: 99 }); tallyOf(A, 'lengths of conduit in the court'); }
  // THE RAMP'S FLOOR: from the court's floor up to the terrace, between its west edge on e -18 and its east wall
  for (let n = K.RAMP.n0; n < K.RAMP.n1; n += 4) { const n1 = n + 4, w = K.RAMP.west; concrete(1, rampY(n) + 9, rampY(n) - 3);
    A.face([w, rampY(n), -n], [rampEast(n), rampY(n), -n], [rampEast(n1), rampY(n1), -n1], [w, rampY(n1), -n1], [0, 1, 0], T.slab, 2.2, 0, 0); }
  // THE BANK DOOR'S LEAVES: two upright leaves of seven planks each (1.7 m wide, 3.8 m tall) standing inside the deep
  // doorway, three strap hinges a leaf; the west leaf shut, the east leaf ajar by half a metre at its free edge; a
  // bar latch across the shut leaf. Each plank takes its own tone
  { const D = K.DOOR, f = D.face, o = [D.e, D.n], d0 = D.deep - 0.18, inn = (u, d) => along(along(o, f + 90, u), f + 180, d), a = Math.asin(0.5 / 1.7) / RAD, pw = 1.7 / 7, hg = inn(D.du - 1.7, d0); plain();
    const tone = (i) => { const v = 0.78 + 0.34 * Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453 % 1); return [T.paint[0] * v, T.paint[1] * v, T.paint[2] * v]; };
    for (let i = 0; i < 7; i++) { const c1 = inn(D.du + (i + 0.5) * pw, d0), c2 = along(hg, f + 90 - a, (i + 0.5) * pw); tallyOf(A, 'planks of the door\'s shut leaf'); tallyOf(A, 'planks of the door\'s leaf ajar');
      A.box(c1[0], c1[1], F + 0.02, F + D.dh, pw / 2 - 0.004, 0.045, f + 90, tone(i), { skip: '', cell: 99 }); A.box(c2[0], c2[1], F + 0.02, F + D.dh, pw / 2 - 0.004, 0.045, f + 90 - a, tone(i + 7), { skip: '', cell: 99 }); }
    for (const y of [F + 0.5, F + 1.9, F + 3.3]) { const s1 = along(inn(D.du + 1.25, d0), f, 0.055), s2 = along(along(hg, f + 90 - a, 0.42), f - a, 0.055); tallyOf(A, 'strap hinges on a door leaf', 0.5);
      A.box(s1[0], s1[1], y, y + 0.1, 0.42, 0.012, f + 90, T.dark, { skip: '', cell: 99 }); A.box(s2[0], s2[1], y, y + 0.1, 0.42, 0.012, f + 90 - a, T.dark, { skip: '', cell: 99 }); }
    const lt = along(inn(D.du + 0.5, d0), f, 0.075); A.box(lt[0], lt[1], F + 1.55, F + 1.65, 0.6, 0.02, f + 90, T.dark, { skip: '', cell: 99 });
    // THE DOOR IS THE HATCH: on the shut leaf one small round glass port, lit from within, in a steel rim; and on the
    // bar latch a wheel handle of five spokes standing a hand's breadth off the leaf on its hub. No sign or mark.
    { const fo = onBearing(f), out = [fo[0], 0, -fo[1]], at = (u, y, off) => { const q = along(inn(u, d0), f, off); return [q[0], y, -q[1]]; };
      const ringOf = (uc, yc, r0, r1, off, col, glow) => { for (let k = 0; k < 12; k++) { const a0 = (k / 12) * TAU, a1 = ((k + 1) / 12) * TAU;
        A.face(at(uc + Math.cos(a0) * r0, yc + Math.sin(a0) * r0, off), at(uc + Math.cos(a0) * r1, yc + Math.sin(a0) * r1, off), at(uc + Math.cos(a1) * r1, yc + Math.sin(a1) * r1, off), at(uc + Math.cos(a1) * r0, yc + Math.sin(a1) * r0, off), out, col, 99, glow, glow ? spineOf(D.n) : 0); } };
      ringOf(D.du + 0.85, F + 2.6, 0.012, 0.17, 0.062, T.lit, 1.95); ringOf(D.du + 0.85, F + 2.6, 0.17, 0.25, 0.075, T.dark, 0); tallyOf(A, 'glass ports in the bank door');
      const hub = along(inn(D.du + 0.5, d0), f, 0.12); A.box(hub[0], hub[1], F + 1.55, F + 1.65, 0.05, 0.07, f + 90, T.steel, { skip: '', cell: 99 });
      ringOf(D.du + 0.5, F + 1.6, 0.25, 0.31, 0.19, T.steel, 0);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3, ca = Math.cos(a), sa = Math.sin(a), w = 0.022; tallyOf(A, 'spokes of the bank door\'s wheel');
        A.face(at(D.du + 0.5 - sa * w, F + 1.6 + ca * w, 0.185), at(D.du + 0.5 + sa * w, F + 1.6 - ca * w, 0.185), at(D.du + 0.5 + ca * 0.27 + sa * w, F + 1.6 + sa * 0.27 - ca * w, 0.185), at(D.du + 0.5 + ca * 0.27 - sa * w, F + 1.6 + sa * 0.27 + ca * w, 0.185), out, T.steel, 99, 0, 0); } } }
  concrete(1, 0, 0);
  return { A, Lp };
}
// where a lamp's light leaves it: a niche lamp stands 0.35 m out of its wall on the bearing it faces
export const lampPoint = (l) => { if (l.kind === 'niche') { const p = along([l.e, l.n], l.face, 0.35); return [p[0], l.y, p[1]]; } return [l.e, l.y - (l.kind === 'soffit' ? 0.12 : 0.08), l.n]; };
// EVERY PLACE THAT THROWS WARM LIGHT on what stands by it, as [x, y, z, spine metres, strength, phase, breadth]:
// each lamp; each lit window, doorway and slit (from 0.7 m before its pane); each kerb's two glass faces; and the bank
// door's leaf ajar, whose light lies as a wedge straight out across the apron toward the stream
export function lightPoints(plan) {
  const out = plan.lamps.map((l) => { const p = lampPoint(l); return [p[0], p[1], -p[2], l.spine, 1, l.phase, l.waver]; });
  for (const b of worksBlocks()) if (b.open) for (const o of b.open) { if (o.kind === 'door') continue; const q = along(along([b.e, b.n], b.brg, o.u), b.brg + 90 * o.side, b.hd + 0.7);
    out.push([q[0], o.kind === 'doorway' ? o.v0 + 1.3 : (o.v0 + o.v1) / 2, -q[1], q[1] - 138, o.kind === 'slit' ? 0.45 : 0.6, 0, 0]); }
  for (const q of plan.kerbs) out.push([q[0], q[2] + 1.47, -q[1], q[1] - 138, 0.9, 0, 0]);
  { const D = K.DOOR; for (let d = 0.6; d < 9; d += 1.4) { const c = along(along([D.e, D.n], D.face, d), D.face + 90, -0.1 - d * 0.06); out.push([c[0], K.FLOOR + 1.1, -c[1], D.n - 138, 0.95 - 0.07 * d, 0, 0]); } }
  return out;
}
// kerbs, cowls, pots and the lamps' own bodies
export function fittingsGeometry(A, plan) {
  const Lp = plan.lamps, T = TONE, spineOf = (n) => n - 138;
  const concrete = (top, foot) => { A.stain = concreteStain; A.skin = [1, top, foot]; }, plain = () => { A.stain = null; A.skin = [0, 0, 0]; };
  // THE LIGHT WELLS' LAMPS: each a slim dark post 1.4 m tall on a small foot plate with a small glowing head under a
  // cap (no block stands on the roof: the light is kept, the cube is gone)
  plain();
  for (const q of plan.kerbs) { const [e, n, y] = q, r = K.ROOF.row;
    A.box(e, n, y, y + 0.05, 0.16, 0.16, r, T.dark, { skip: 'b', cell: 99 }); A.box(e, n, y + 0.05, y + 1.36, 0.035, 0.035, r, T.dark, { skip: 'b t', cell: 99 });
    A.box(e, n, y + 1.36, y + 1.58, 0.1, 0.1, r, T.glass, { glow: 3.6, spine: spineOf(n), skip: '', cell: 99 }); A.box(e, n, y + 1.58, y + 1.62, 0.15, 0.15, r, T.dark, { skip: 'b', cell: 99 }); }
  // VENT COWLS: a weathered sheet-steel pipe on a concrete collar (on the roof: on a square plinth that carries a
  // lamp); a turned cap or a bent head
  for (const c of plan.cowls) { const r = 0.2 + 0.05 * (c.h - 0.9);
    if (c.plinth) { const lp2 = along([c.e, c.n], 62, 0.45); plain(); A.box(lp2[0], lp2[1], c.y - c.plinth, c.y - c.plinth + 0.42, 0.04, 0.04, 62, T.dark, { skip: 'b', cell: 99 }); continue; }
    if (c.gone) continue;
    concrete(c.y, c.y - (c.plinth || 0.4));
    if (c.plinth) A.box(c.e, c.n, c.y - c.plinth - 0.2, c.y, 0.45, 0.45, 62, T.wall, { skip: 'b' }); else A.tube(c.e, c.n, c.y - 0.4, c.y + 0.2, r + 0.2, r + 0.16, 10, T.wall);
    plain(); A.stain = (x, y, z, ny, col) => { const v = 0.8 + 0.3 * NZ.n2(x * 3.1 + y * 2.3, z * 3.1 - y * 1.7), ru = smoothstep(0.25, 0.7, NZ.n2(x * 1.3 + 9, y * 2.9 + z * 1.3)) * 0.35; return [col[0] * v + 0.2 * ru, col[1] * v * (1 - 0.3 * ru), col[2] * v * (1 - 0.55 * ru)]; };
    A.tube(c.e, c.n, c.y, c.y + c.h, r, r, 10, T.zinc, false);
    if (c.bent) { const d = along([c.e, c.n], c.turn, r * 2.0); A.box(d[0], d[1], c.y + c.h - 0.12, c.y + c.h + r * 1.5, r * 2.3, r * 1.05, c.turn, T.zinc, { skip: '' }); }
    else { A.tube(c.e, c.n, c.y + c.h + 0.1, c.y + c.h + 0.36, r * 2.0, r * 0.5, 10, T.zinc, true); A.tube(c.e, c.n, c.y + c.h - 0.02, c.y + c.h + 0.1, r * 0.7, r * 2.0, 10, T.dark, false); } }
  plain();
  // POTS of seedlings: a clay pot and a tuft of five to seven leaves (a plant: it takes sun and sky only, never lamp
  // light); each leaf a narrow blade arching out of the pot on its own bearing
  for (const row of plan.pots) for (const p of row.pots) { const s = p[3], y0 = p[2] + 0.2 * s;
    A.tube(p[0], p[1], p[2], y0, 0.085 * s, 0.12 * s, 10, T.clay, true);
    for (let k = 0; k < p[4]; k++) { const brg = p[5] + (k / p[4]) * 360 + 17 * Math.sin(k * 2.4), d = onBearing(brg), c = onBearing(brg + 90), w = 0.035 * s, r1 = (0.1 + 0.05 * Math.sin(k * 1.7 + 1)) * s, r2 = r1 * 2.1, h1 = (0.2 + 0.05 * Math.cos(k * 2.1)) * s, h2 = h1 * 1.25;
      const P0 = (r, h, sd) => [p[0] + d[0] * r + c[0] * w * sd, y0 + h, -(p[1] + d[1] * r + c[1] * w * sd)];
      for (const sd of [1, -1]) { A.face(P0(0.02, 0, -1), P0(0.02, 0, 1), P0(r1, h1, 1.6), P0(r1, h1, -1.6), [sd * d[0], 0.6, -sd * d[1]], T.leaf, 99, -1, 0); A.face(P0(r1, h1, -1.6), P0(r1, h1, 1.6), P0(r2, h2, 0.3), P0(r2, h2, -0.3), [sd * d[0], 0.6, -sd * d[1]], T.leaf, 99, -1, 0); } } }
  // LAMPS: a bulkhead lamp under a roof lip, a bulkhead lamp on a wall's face, or a white enamel shade on a stem
  // from the slab over it; each bulb's own light, wavering by its lamp's dealt phase and breadth. The bank door's
  // one lamp stands in a cage of five steel bars
  for (const l of Lp) { const sp = l.spine, bulb = () => { A.wave = [l.phase, l.waver]; }, body = () => { A.wave = [0, 0]; };
    if (l.kind === 'soffit') { A.box(l.e, l.n, l.y, l.y + 0.14, 0.2, 0.1, l.face + 90, T.enamel, { skip: 't', cell: 99 }); bulb(); A.box(l.e, l.n, l.y - 0.07, l.y, 0.14, 0.07, l.face + 90, T.glass, { glow: 3.4, spine: sp, skip: 't', cell: 99 }); body();
      if (l.caged) { for (const u of [-0.2, -0.1, 0, 0.1, 0.2]) { const c = along([l.e, l.n], l.face + 90, u); A.box(c[0], c[1], l.y - 0.15, l.y - 0.135, 0.008, 0.12, l.face + 90, T.dark, { skip: '', cell: 99 }); tallyOf(A, 'bars of the door lamp\'s cage'); }
        for (const d of [-0.12, 0.12]) { const c = along([l.e, l.n], l.face, d); A.box(c[0], c[1], l.y - 0.15, l.y, 0.21, 0.008, l.face + 90, T.dark, { skip: 'b t', cell: 99 }); } } }
    else if (l.kind === 'niche') { const p = along([l.e, l.n], l.face, 0.07), q = along([l.e, l.n], l.face, 0.16);
      A.box(p[0], p[1], l.y - 0.13, l.y + 0.13, 0.18, 0.07, l.face + 90, T.enamel, { skip: '', cell: 99 }); bulb(); A.box(q[0], q[1], l.y - 0.08, l.y + 0.08, 0.12, 0.03, l.face + 90, T.glass, { glow: 3.4, spine: sp, skip: '', cell: 99 }); body(); }
    else { A.box(l.e, l.n, l.y + 0.16, l.y + 0.18 + l.drop, 0.012, 0.012, 0, T.dark, { skip: 'b t', cell: 99 }); A.tube(l.e, l.n, l.y, l.y + 0.18, 0.3, 0.05, 10, T.enamel, true);
      const R = (k, r) => { const a = (k / 10) * TAU; return [l.e + Math.cos(a) * r, l.y + 0.01, -l.n + Math.sin(a) * r]; }; bulb();
      for (let k = 0; k < 10; k++) A.face(R(k, 0.29), R(k + 1, 0.29), [l.e, l.y + 0.01, -l.n], [l.e, l.y + 0.01, -l.n], [0, -1, 0], T.enamel, 99, 2.2, sp);
      A.box(l.e, l.n, l.y - 0.13, l.y - 0.01, 0.05, 0.05, 0, T.glass, { glow: 3.6, spine: sp, skip: 't', cell: 99 }); body(); } }
  A.stain = concreteStain;
}
// WARM LIGHT BY PLACE on every surface that has no light of its own: each light point reaches three to six metres
// about it; the surface carries the strength, the spine metres and the waver of what lights it
// how much lamp light reaches a place that looks along (nx, ny, nz): [strength (as aGlow.x), spine metres, phase,
// breadth of waver], or null where none does. pts: lightPoints(plan)
export function lampLightAt(pts, x, y, z, nx, ny, nz) {
  let sum = 0, sp = 0, ph = 0, am = 0;
  for (const l of pts) { const dx = l[0] - x, dy = l[1] - y, dz = l[2] - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 > 42) continue;
    const d = Math.sqrt(d2) + 1e-3, fc = 0.28 + 0.72 * Math.max(0, (dx * nx + dy * ny + dz * nz) / d), w = l[4] * fc / (1 + d2 / 4.5) * smoothstep(6.5, 2.4, d);
    sum += w; sp += w * l[3]; ph += w * l[5]; am += w * l[6]; }
  return sum > 0 ? [Math.min(2.4, sum * 2.4), sp / sum, ph / sum, am / sum] : null;
}
export function bakeLamps(A, P, i0 = 0, i1 = A.p.length / 3) {
  for (let i = i0; i < i1; i++) {
    const k = i * 3, g = i * 4; if (A.g[g] !== 0) continue; const x = A.p[k], y = A.p[k + 1], z = A.p[k + 2]; let sum = 0, sp = 0, ph = 0, am = 0;
    for (const l of P) { const dx = l[0] - x, dy = l[1] - y, dz = l[2] - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 > 42) continue;
      const d = Math.sqrt(d2) + 1e-3, fc = 0.28 + 0.72 * Math.max(0, (dx * A.nr[k] + dy * A.nr[k + 1] + dz * A.nr[k + 2]) / d), w = l[4] * fc / (1 + d2 / 4.5) * smoothstep(6.5, 2.4, d);
      sum += w; sp += w * l[3]; ph += w * l[5]; am += w * l[6]; }
    if (sum > 0) { A.g[g] = Math.min(2.4, sum * 2.4); A.g[g + 1] = sp / sum; A.g[g + 2] = ph / sum; A.g[g + 3] = am / sum; }
  }
}
// the lamps' halos in the air, one draw. A halo is light scattered by the air about its lamp: it is as wide and as
// strong at any distance from the eye; far off the air between dims it (air by distance, the scene's own haze law)
export function lampHalos(Lp, U) {
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const at = [], sp = [];
  for (const l of Lp) { const p = lampPoint(l); at.push(p[0], p[1], -p[2]); sp.push(l.spine, l.phase, l.waver); }
  g.setAttribute('aAt', new THREE.InstancedBufferAttribute(new Float32Array(at), 3)); g.setAttribute('aSp', new THREE.InstancedBufferAttribute(new Float32Array(sp), 3)); g.instanceCount = Lp.length;
  const m = new THREE.ShaderMaterial({ uniforms: { uTime: U.time, uLampDip: U.dip, uCol: U.haloCol, uSize: { value: 1.7 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`attribute vec3 aAt; attribute vec3 aSp; uniform float uTime, uSize; varying vec2 vUv; varying float vK;` + DIP_GLSL + /* glsl */`
      void main() { vUv = position.xy; vec4 mv = viewMatrix * vec4(aAt, 1.0); float d = length(mv.xyz); mv.xy += position.xy * uSize; gl_Position = projectionMatrix * mv;
        vK = lampDip(aSp.x, uTime, aSp.y, aSp.z) * exp(-d / 460.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUv; varying float vK;
      void main() { float r2 = dot(vUv, vUv); float a = (exp(-r2 * 5.5) * 0.3 + exp(-r2 * 60.0) * 0.9) * (1.0 - smoothstep(0.7, 1.0, r2)); gl_FragColor = vec4(uCol * a * vK, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6; return mesh;
}
// the hero's shared values: the clock, the lamps' colour and the one dealt place of their dip in its cycle, the sky's
// two colours as a wet floor mirrors them, moss, a lit pane's amber, the height on the court's east wall up to
// which the west wall's shade stands at this hour, and the six places on the court's rain sheet where a drop from a
// root curtain lands and rings the water (ring: x, z, its period, its phase; ringF: the seconds its drop falls)
export function worksUniforms() { return { time: { value: 0 }, dip: { value: 0 }, lampCol: { value: new THREE.Color('#ff9226').multiplyScalar(3.3) }, haloCol: { value: new THREE.Color('#ff8a30').multiplyScalar(1.7) },
  skyHi: { value: new THREE.Color(0.3, 0.72, 0.8) }, skyLo: { value: new THREE.Color(1.5, 0.72, 0.32) }, moss: { value: new THREE.Color(...TONE.lichen) }, pane: { value: new THREE.Color(3.0, 0.95, 0.2) }, courtSun: { value: 12.6 },
  ring: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 1, 0)) }, ringF: { value: [9, 9, 9, 9, 9, 9] } }; }
// THE HERO: the whole station as one mesh and the lamps' halos. opts.plan (the visit's plan; made here when the hero
// is asked alone), opts.seed, opts.uniforms (the world's shared clock and lamp colour), opts.sun: the sun map's
// uniforms (the shade of every thing along the sun's rays). It stands alone when it is given a seed (opts.seed or
// ctx.seed); with none it takes the seed hashed from the part's own name, so a viewer that builds the hero alone still has its Works.
export async function buildHero(ctx = {}, opts = {}) {
  const seed = opts.seed ?? ctx.seed ?? hashSeed('lamps-under-the-roots');
  const own = !opts.uniforms, U = opts.uniforms || worksUniforms(), wait = async () => { if (ctx.yield) await ctx.yield(); };
  const plan = opts.plan || layout(seed), { A, Lp } = worksGeometry(plan); await wait(); fittingsGeometry(A, plan); await wait();
  U.dip.value = plan.dip;
  plan.drips.filter((d) => d.y1 < K.FLOOR + 0.1 && d.e > K.COURT.e0 && d.e < K.COURT.e1 && d.n > K.COURT.n0 && d.n < K.COURT.n1).slice(0, 6).forEach((d, i) => { U.ring.value[i].set(d.e, -d.n, d.per, d.ph); U.ringF.value[i] = Math.sqrt(Math.max(0.1, d.y0 - d.y1) / 4.9); });
  const pts = lightPoints(plan), nv = A.p.length / 3; for (let i = 0; i < nv; i += 2500) { bakeLamps(A, pts, i, Math.min(nv, i + 2500)); await wait(); }
  const object = new THREE.Group(), geo = A.geometry(), mat = lampLitMaterial(U), mesh = new THREE.Mesh(geo, mat), halos = lampHalos(Lp, U);
  if (opts.sun) underSun(mat, opts.sun, 'works');
  object.add(mesh, halos); object.name = 'the Works';
  // radius, height, center, ground, groundY: the part viewer's hints (it frames the hero alone by them);
  // tally: what the builder counted as it built
  return { object, radius: 190, height: 40, center: new THREE.Vector3(-10, 16, -300), ground: true, groundY: 8.4, tally: A.tally,
    update(dt, time) { if (own) U.time.value = time; },
    dispose() { geo.dispose(); mat.dispose(); halos.geometry.dispose(); halos.material.dispose(); } };
}
