// The part of the world fields-of-gazing-grain: the road and its heights, the table of hours and the one row of the
// eye's place, the land's law and what stands on it by rule (dealt here, beside the law of the very land
// the world builds), the shared light and air, the wheat that faces the road, the pair of grey horses with the
// carriage's dash rail and lamps, the ground, and the hero alone.
//
// DECLARED HERE AND AT THE HEAD OF THE WORLD:
// (1) THE OWNER'S EXCEPTION, term c, the owner's YES of 23:05 on 10-12: THE HOURS ARE PLACES, and ONE HOUR IS IN THE PICTURE AT A TIME.
//     The whole picture takes one row of one table: the row at THE EYE'S PLACE ON THE ROAD (the road point nearest the
//     eye's own place in the world; makeHours, setEye). What reads the eye's place: the sky, the sun's height, the
//     day's veil, the dusk band, the key (colour, strength, direction), the fill, the shade and the air (colour and
//     reach). It reads no metres flown, no parameter of the route, no clock and no seed: an eye that stood still
//     would stand in one hour, the same on every seed and at every pace. THE JOINS (JOINS), each one smooth blend
//     between two places a person standing there could name, READ FROM makePlaces (HOURPLACES; no metre and no length
//     typed beside them): the yard's gate to the stone gateposts (s 62 to 106); the swell's foot at the hay wagon's
//     gateway to the crest (164 to 214.0); the alder's point abeam to the wet meadow's first fence post (243.6 to
//     290); the plank culvert to the old oak abeam (306 to 344.9); the flood's head on the right hand to the further
//     right-hand elm abeam (366 to 410). OUTSIDE THE JOINS the sun's height falls the whole way from the entry to the
//     culvert (its keys are places too), the day's veil thins with it from the crest (214.0) to the culvert (306),
//     and the afterglow rises from the alder's point abeam, is full where the shore leaves the road (282) and is gone
//     at the flood's head (366). WHAT GIVES LIGHT ITSELF keeps its own law: the lamps and
//     their pool by distance from the flames, the stars, the one moon and the line of first light as constants by
//     direction at one strength (the day's veil outshines them; nothing dims or moves them), and their images in the
//     waters. WHAT STANDS (mist, dew, webs, flowers) stands by its own place for ever (standMist, standDew, read at
//     the thing's own metres) and is only LIT by the eye's row.
// (2) THE WHEAT FACES THE ROAD. Each stalk leans 10 to 20 degrees toward the nearest point of the road's line (less
//     where its foot stands so near that its ear would come within 2.0 m of the line) and its ear is carried up with
//     its broad face square to that line: a fixed rule of the stalk's own place, laid at build. The wind's dip is
//     along the wind and never carries an ear into that clear air. Every block of standing wheat ends in a ragged
//     edge (makeWheat). Nothing of the wheat reads the eye.
// (3) THE PAIR AND THE CARRIAGE are what the ride wears: ONE CONSTANT STATION ON THE EYE (STATION: the dash rail 2.2 m
//     ahead and 1.05 m below, a lamp 0.8 m to each hand, croups 3.2 m, withers 4.5 m and polls 5.7 m ahead, the polls
//     0.35 m below, each horse 0.5 m to its own hand of the line), ONE STATE, one gait on the world clock at every
//     place (buildPair). On the bending, rolling road the world lays the group along the road's own line and slope at
//     the eye's own place; the necks turn into a bend by a fixed share of the road's own turning there, never more
//     than at the road's least bend. The coat's dark, the breath and the moths are read from the table at the pair's
//     own place (the row's sun and the row's dew there), never from metres flown, the route parameter or the clock.
//     In the dark the pair is the same two pale horses, a dark shade of the hour's colour that keeps its form, under
//     the sky's low band; the lamps lay one constant warm edge on the faces turned outward to them (horseMaterial).
// (4) THE LAND IS ONE LAW (makeLand): the country's own height brought to the road's height at the line, the two
//     waters cut by their shores, the long low swell along the reach's southern shore and the whaleback at the crest
//     that keep every water out of sight before the crest. dealLand, dealElms and dealStanding deal the land, the nine
//     great elms and the standing woods from streams of their own by name and seed.
//
// Space: the road first heads toward -Z from the entry at the origin; s = metres of road from the entry; d = metres
// to the right of the road's line. Bearings are degrees to the right of -Z.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeNoise, makeRng, hashSeed } from '../kit/core.js';

export const EYE = 2.6;
// THE ROAD'S LIST: ['straight', metres] or ['bend', degrees to the right, radius]. Nothing in it is tuned to a round
// length: the knots and the end fall where the places put them (by sum 468.3 m).
export const ROADLIST = [['straight', 60], ['bend', -35, 45], ['straight', 30], ['bend', 40, 45], ['straight', 20], ['bend', 47, 55], ['straight', 45],
  ['bend', -30, 60], ['straight', 32], ['bend', -80, 40], ['straight', 90]];
// THE ROAD'S HEIGHT: one fixed function of its metres, the same on every seed, run smooth between these points ([s, y]);
// level behind the entry and from the last point on. Never steeper than 1 in 12.
export const ROADHEIGHTS = [[62, 0], [90, -0.9], [132, 1.3], [164, 0.3], [214, 2.9], [266, 0.3], [306, -0.3], [350, 0.5], [392, 0.3]];
const RAD = Math.PI / 180;
export function roadHeight(s, K = ROADHEIGHTS) {
  const n = K.length;
  if (s <= K[0][0]) return K[0][1];
  if (s >= K[n - 1][0]) return K[n - 1][1];
  let i = 0; while (s > K[i + 1][0]) i++;
  return lerp(K[i][1], K[i + 1][1], smoothstep(K[i][0], K[i + 1][0], s));
}

export function makeRoad(list = ROADLIST, heights = ROADHEIGHTS) {
  const segs = []; let x = 0, z = 0, b = 0, s = 0;
  for (const [kind, v, radius] of list) {
    if (kind === 'straight') { const len = v; segs.push({ s0: s, len, x, z, b, kap: 0 }); x += Math.sin(b) * len; z -= Math.cos(b) * len; s += len; }
    else {
      const R = radius, kap = Math.sign(v) / R, len = Math.abs(v) * RAD * R, cx = x + Math.cos(b) / kap, cz = z + Math.sin(b) / kap;
      segs.push({ s0: s, len, x, z, b, kap, cx, cz });
      b += kap * len; x = cx - Math.cos(b) / kap; z = cz - Math.sin(b) / kap; s += len;
    }
  }
  const L = s, last = segs.length - 1;
  // the road's frame at s: [x, z, bearing]; before the entry and past the end the end straights run on
  const at = (sq, d = 0, out = [0, 0, 0]) => {
    let i = 0; while (i < last && sq > segs[i].s0 + segs[i].len) i++;
    const g = segs[i], t = sq - g.s0; let px, pz, bb = g.b;
    if (g.kap === 0) { px = g.x + Math.sin(g.b) * t; pz = g.z - Math.cos(g.b) * t; }
    else { bb = g.b + g.kap * t; px = g.cx - Math.cos(bb) / g.kap; pz = g.cz - Math.sin(bb) / g.kap; }
    out[0] = px + Math.cos(bb) * d; out[1] = pz + Math.sin(bb) * d; out[2] = bb; return out;
  };
  // the nearest point of the line: s and the signed metres to the right of it
  const locate = (px, pz, out = { s: 0, d: 0 }) => {
    let best = Infinity;
    for (let i = 0; i <= last; i++) {
      const g = segs[i]; let t, qx, qz, bb = g.b;
      if (g.kap === 0) {
        t = (px - g.x) * Math.sin(g.b) - (pz - g.z) * Math.cos(g.b);
        t = clamp(t, i === 0 ? -4000 : 0, i === last ? 6000 : g.len);
        qx = g.x + Math.sin(g.b) * t; qz = g.z - Math.cos(g.b) * t;
      } else {
        const sg = Math.sign(g.kap); let db = Math.atan2(-sg * (pz - g.cz), -sg * (px - g.cx)) - g.b;
        db = Math.atan2(Math.sin(db), Math.cos(db)); t = clamp(db / g.kap, 0, g.len);
        bb = g.b + g.kap * t; qx = g.cx - Math.cos(bb) / g.kap; qz = g.cz - Math.sin(bb) / g.kap;
      }
      const dd = (px - qx) ** 2 + (pz - qz) ** 2;
      if (dd < best) { best = dd; out.s = g.s0 + t; out.d = (px - qx) * Math.cos(bb) + (pz - qz) * Math.sin(bb); }
    }
    return out;
  };
  // the same list for a shader: per piece (x, z, bearing, length) and (curvature, s0, centre x, centre z)
  const segA = [], segB = [];
  for (const g of segs) { segA.push(new THREE.Vector4(g.x, g.z, g.b, g.len)); segB.push(new THREE.Vector4(g.kap, g.s0, g.cx || 0, g.cz || 0)); }
  // the road's height at s, its slope there (rise per metre), and its curvature (to the right positive, 1 / radius)
  const yAt = (sq) => roadHeight(sq, heights), slopeAt = (sq) => (roadHeight(sq + 0.5, heights) - roadHeight(sq - 0.5, heights));
  const kapAt = (sq) => { let i = 0; while (i < last && sq > segs[i].s0 + segs[i].len) i++; return sq < 0 || sq > L ? 0 : segs[i].kap; };
  // the end of piece i (0 based) in metres of road: where a straight or a bend ends
  const knot = (i) => segs[i].s0 + segs[i].len;
  return { segs, L, at, locate, segA, segB, n: segs.length, yAt, slopeAt, kapAt, knot };
}

// GLSL: the exact nearest point of the road's line for a shader that owns the uniforms uSegA / uSegB (NSEG pieces).
// roadSD(xz) = (s, d, and the offset from the line's nearest point). No texture and no derivative is taken inside the loop.
export const GLSL_ROAD = /* glsl */`
uniform vec4 uSegA[NSEG]; uniform vec4 uSegB[NSEG];
vec4 roadSD(vec2 p){
  float best = 1e12; vec4 res = vec4(0.);
  for (int i = 0; i < NSEG; i++) {
    vec4 A = uSegA[i], B = uSegB[i]; float t, bb = A.z; vec2 q;
    if (B.x == 0.) {
      t = (p.x - A.x) * sin(A.z) - (p.y - A.y) * cos(A.z);
      t = clamp(t, i == 0 ? -4000. : 0., i == NSEG - 1 ? 6000. : A.w);
      q = A.xy + vec2(sin(A.z), -cos(A.z)) * t;
    } else {
      float sg = sign(B.x); vec2 v = -sg * (p - B.zw);
      float db = atan(v.y, v.x + sign(v.x + 1e-9) * 1e-7) - A.z;
      db = atan(sin(db), cos(db) + 1e-9); t = clamp(db / B.x, 0., A.w);
      bb = A.z + B.x * t; q = B.zw - vec2(cos(bb), sin(bb)) / B.x;
    }
    vec2 e = p - q; float dd = dot(e, e);
    if (dd < best) { best = dd; res = vec4(B.y + t, dot(e, vec2(cos(bb), sin(bb))), e); }
  }
  return res;
}`;

// ---------------------------------------------------------------- THE TABLE OF HOURS (declared at the head)
// ONE ROW IS IN THE PICTURE AT A TIME: the row at the eye's place on the road (the world hands it to every shader as
// uRow each frame).
export const S_LO = -56, S_HI = 520, NS = 256;
// constants by direction, in no row: the sun's one bearing; the one moon; the star field's pole; the line of first
// light (centred on the last straight's heading, full to 55 degrees either side, nothing beyond 70) and its one star,
// which stands 22 degrees to the left of that heading (bearing -80, 16 up): a far light with a place of its own, over
// the flood's left hand and never over the road's end
export const SUN_BEARING = 80, MOON = { bearing: 2, up: 9, size: 6 }, POLE = { bearing: 145, up: 42 };
export const FIRST = { bearing: -58, full: 55, none: 70, top: 13, star: 16, starBearing: -80 }, AFTERGLOW = { from: 75, peak: 85, to: 105 };
export const linear = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
export const bearingDir = (deg, up = 0) => { const b = deg * RAD, e = up * RAD; return [Math.sin(b) * Math.cos(e), Math.sin(e), -Math.cos(b) * Math.cos(e)]; };
// THE PLACES THE TABLE IS LAID BY, each read from makePlaces on the road's own list (HOURPLACES; metres of road). A place that is a point of the
// land (the alder, the old oak, the flood's head, an elm) is taken ABEAM OF THE ROAD BY SUM (the nearest point of the line: road.locate). No
// metre of a join or of a sun's key is typed here, and no join's length: each is the distance between its two places as they stand.
export const HOURPLACES = (() => {
  const road = makeRoad(), PL = makePlaces(road), abeam = (p) => road.locate(p[0], p[1]).s;
  return { entry: 0, gate: PL.gate, posts: PL.posts, wagon: PL.wagon, crest: PL.crest, alder: abeam(PL.alder), shoreEnd: PL.shore[1], post4: PL.fence4[0], culvert: PL.culvert,
    oak: abeam(PL.oak), floodHead: abeam(PL.floodR), elm: abeam(PL.elmXZ[1]) };
})();
const HP = HOURPLACES;
// THE JOINS, each one smooth blend between two places ([from, to]): the yard's gate to the stone gateposts; the hay wagon's gateway at the swell's
// foot to the crest (the third bend's end); the alder's own point abeam to the wet meadow's first fence post; the plank culvert to the old oak
// abeam; the flood's head on the right hand (where the bank's foot meets its first water) to the further right-hand elm abeam.
export const JOINS = [[HP.gate, HP.posts], [HP.wagon, HP.crest], [HP.alder, HP.post4], [HP.culvert, HP.oak], [HP.floodHead, HP.elm]];
// the six rows: hour 1 (school), 2 (the gold hour in the grain), 3 (the sun on the water), 4 (wet meadow), 5 (the low rise), 6 (last road)
const ROWS = {
  key: [linear('#fff3dc', 1.02), linear('#ffc56a', 1.0), linear('#ffc8a4', 0.85), linear('#8f9aee', 0.9), linear('#c9d6e8', 1.45), linear('#c9d6e8', 1.35)],
  fill: [linear('#b4cde6', 0.5), linear('#a888c8', 0.34), linear('#a868b0', 0.42), linear('#6474d0', 0.62), linear('#4a62b6', 0.62), linear('#445aac', 0.6)],
  shade: [linear('#8a9a84', 0.34), linear('#7a4a50', 0.2), linear('#6a3858', 0.24), linear('#2a3470', 0.22), linear('#1c2a60', 0.18), linear('#1a2656', 0.17)],
  fog: [linear('#b4d0ea', 1), linear('#eebc74', 0.95), linear('#d0745c', 0.8), linear('#44549e', 0.7), linear('#1c2a5c', 0.75), linear('#17234e', 0.75)],
  reach: [1400, 900, 800, 420, 600, 1500],
  top: [linear('#3878d2', 1), linear('#a08e9c', 0.95), linear('#3a2f7c', 0.85), linear('#1c2868', 1.0), linear('#131f48', 1.8), linear('#0f183c', 1.9)],
  low: [linear('#a9cdee', 1.05), linear('#f7a83e', 1.12), linear('#ee6c3c', 1), linear('#4656a8', 1.0), linear('#2c3f86', 1.25), linear('#243474', 1.25)],
  disc: [linear('#fff6e4', 9), linear('#ffe2a8', 8), linear('#f0602c', 5.5), linear('#e2552a', 5), linear('#e2552a', 5), linear('#e2552a', 5)],
  // what STANDS by place (read at a thing's own place, never for how it is lit): dew on the grass, the level mist
  dew: [0, 0, 0.1, 1, 0.8, 0.5], mist: [0, 0, 0.1, 1, 0.42, 0.08],
  // the sky's clouds of the eye's hour: small white clouds; long bands lit from under
  cumulus: [1, 0.25, 0.1, 0, 0, 0], bands: [0, 0.9, 1, 0.5, 0, 0],
};
// the sun's height in degrees over s: one smooth falling curve through places (48 up at the entry and behind it, 34 at
// the yard's gate, 20 at the gateposts, 10 at the swell's foot, 3 at the crest, its centre on the rim where the alder's
// point is abeam, the last of its disc under where the shore leaves the road, 6 under at the culvert, where it stays)
const SUN_KEYS = [[HP.entry, 48], [HP.gate, 34], [HP.posts, 20], [HP.wagon, 10], [HP.crest, 3], [HP.alder, 0], [HP.shoreEnd, -3], [HP.culvert, -6]];
function sunHeight(s) {
  const K = SUN_KEYS, n = K.length;
  if (s <= K[0][0]) return K[0][1];
  if (s >= K[n - 1][0]) return K[n - 1][1];
  let i = 0; while (s > K[i + 1][0]) i++;
  // monotone cubic (the slopes are harmonic means of the chords, nought at the two ends)
  const sl = (j) => (K[j + 1][1] - K[j][1]) / (K[j + 1][0] - K[j][0]);
  const m = (j) => (j <= 0 || j >= n - 1 ? 0 : 2 * sl(j - 1) * sl(j) / (sl(j - 1) + sl(j)));
  const h = K[i + 1][0] - K[i][0], t = (s - K[i][0]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * m(i + 1);
}
// the day's veil (the lit air before every far light alike): whole while the sun's centre is 3 degrees up or more,
// nothing at 6 under. The afterglow's strength: nothing up to where the alder's point is abeam, full where the last
// of the disc goes under (where the shore leaves the road), nothing again at the flood's head.
const veilOf = (sunDeg) => smoothstep(-6, 3, sunDeg);
const duskOf = (s) => smoothstep(HP.alder, HP.shoreEnd, s) * (1 - smoothstep(HP.shoreEnd, HP.floodHead, s));
const hourAt = (s) => { let h = 0; for (const [a, b] of JOINS) h += smoothstep(a, b, s); return h; };

export function makeHours(road, o = {}) {
  const data = new Float32Array(NS * 8 * 4), moon = bearingDir(MOON.bearing, MOON.up);
  const mixRow = (arr, h) => { const i = Math.min(4, Math.floor(h)), t = h - i, a = arr[i], b = arr[i + 1]; return typeof a === 'number' ? lerp(a, b, t) : [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
  for (let i = 0; i < NS; i++) {
    const s = S_LO + (S_HI - S_LO) * (i + 0.5) / NS, h = hourAt(s), sd = sunHeight(s), veil = veilOf(sd), put = (row, c, a) => { const k = (row * NS + i) * 4; data[k] = c[0]; data[k + 1] = c[1]; data[k + 2] = c[2]; data[k + 3] = a; };
    // the key's direction: the sun while it is up (hours 1 to 3), the sky overhead (hour 4), the moon (hours 5 and 6)
    const sun = bearingDir(SUN_BEARING, Math.max(sd, 2)), wSun = 1 - smoothstep(2, 3, h), wMoon = smoothstep(3, 4, h), wUp = 1 - wSun - wMoon;
    const kd = [sun[0] * wSun + moon[0] * wMoon, sun[1] * wSun + moon[1] * wMoon + wUp, sun[2] * wSun + moon[2] * wMoon], kl = Math.hypot(kd[0], kd[1], kd[2]) || 1;
    put(0, mixRow(ROWS.key, h), sd * RAD); put(1, [kd[0] / kl, kd[1] / kl, kd[2] / kl], veil);
    put(2, mixRow(ROWS.fill, h), duskOf(s)); put(3, mixRow(ROWS.shade, h), mixRow(ROWS.dew, h));
    // (in every join alike the sky's low band turns first and its top after: the low band over the join's first seven tenths, the top over its last seven)
    const hf = Math.min(4, Math.floor(h)), hLow = hf + smoothstep(0, 0.7, h - hf), hTop = hf + smoothstep(0.3, 1, h - hf);
    put(4, mixRow(ROWS.fog, h), 1 / mixRow(ROWS.reach, h)); put(5, mixRow(ROWS.top, hTop), mixRow(ROWS.mist, h));
    put(6, mixRow(ROWS.low, hLow), mixRow(ROWS.cumulus, h)); put(7, mixRow(ROWS.disc, h), mixRow(ROWS.bands, h));
  }
  const half = new Uint16Array(data.length); for (let i = 0; i < data.length; i++) half[i] = THREE.DataUtils.toHalfFloat(data[i]);
  const tHours = new THREE.DataTexture(half, NS, 8, THREE.RGBAFormat, THREE.HalfFloatType);
  tHours.magFilter = tHours.minFilter = THREE.LinearFilter; tHours.wrapS = tHours.wrapT = THREE.ClampToEdgeWrapping; tHours.needsUpdate = true;
  // a row of the table at s (linear between its texels), for what is lit on the processor
  const row = (k, s, out = [0, 0, 0, 0]) => {
    const f = clamp((s - S_LO) / (S_HI - S_LO) * NS - 0.5, 0, NS - 1), i = Math.min(NS - 2, Math.floor(f)), t = f - i, a = (k * NS + i) * 4;
    for (let c = 0; c < 4; c++) out[c] = lerp(data[a + c], data[a + 4 + c], t);
    return out;
  };
  // THE ONE ROW of the eye's place, written into the eight vectors every shader shares
  const setEye = (U, s) => { const t = [0, 0, 0, 0]; for (let k = 0; k < 8; k++) { row(k, s, t); U.uRow.value[k].set(t[0], t[1], t[2], t[3]); } };
  return { data, tHours, row, setEye, sunHeight, veilOf, duskOf, hourAt };
}

// A smooth field of s over the ground (so that a thing far from the road takes the row of the road near it with no
// seam where two stretches of road are equally near): the mean of the road's own metres weighted by the inverse
// sixth power of the distance. Baked in short steps; read by every shader and by smapAt on the processor.
export const SMAP = { n: 160, half: 800 };
export async function bakeSmap(road, yieldFn, o = {}) {
  const n = o.fixedS !== undefined ? 2 : SMAP.n, half = SMAP.half, a = road.at(road.L / 2), cx = a[0], cz = a[1];
  const f = new Float32Array(n * n), P = [], q = [0, 0, 0];
  if (o.fixedS !== undefined) f.fill(o.fixedS);
  else {
    for (let s = -400; s <= road.L + 600; s += 5) { road.at(s, 0, q); P.push(q[0], q[1], s); }
    for (let j = 0; j < n; j++) {
      const z = cz - half + (j + 0.5) / n * 2 * half;
      for (let i = 0; i < n; i++) {
        const x = cx - half + (i + 0.5) / n * 2 * half; let sw = 0, ss = 0;
        for (let k = 0; k < P.length; k += 3) { const dx = x - P[k], dz = z - P[k + 1], d2 = dx * dx + dz * dz + 36, w = 1 / (d2 * d2 * d2); sw += w; ss += w * P[k + 2]; }
        f[j * n + i] = ss / sw;
      }
      if (j % 8 === 7 && yieldFn) await yieldFn();
    }
  }
  const half16 = new Uint16Array(n * n); for (let i = 0; i < n * n; i++) half16[i] = THREE.DataUtils.toHalfFloat(f[i]);
  const tex = new THREE.DataTexture(half16, n, n, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  const box = new THREE.Vector4(cx - half, cz - half, 1 / (2 * half), 1 / (2 * half));
  // a second small map: metres from the road's own line (2 m texels over the road's box; 20 and more beyond it), for the mist's corridor
  let x0 = 0, x1 = 1, z0 = 0, z1 = 1, cw = 2, chh = 2, cd = new Float32Array([20, 20, 20, 20]);
  if (o.fixedS === undefined) {
    x0 = 1e9; x1 = -1e9; z0 = 1e9; z1 = -1e9; for (let s = 0; s <= road.L; s += 4) { road.at(s, 0, q); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); }
    x0 -= 14; x1 += 14; z0 -= 14; z1 += 14; cw = Math.ceil((x1 - x0) / 2); chh = Math.ceil((z1 - z0) / 2); cd = new Float32Array(cw * chh); const lc = { s: 0, d: 0 };
    for (let j = 0; j < chh; j++) { for (let i = 0; i < cw; i++) { road.locate(x0 + (i + 0.5) / cw * (x1 - x0), z0 + (j + 0.5) / chh * (z1 - z0), lc); cd[j * cw + i] = Math.min(20, Math.abs(lc.d)); } if (j % 40 === 39 && yieldFn) await yieldFn(); }
  }
  const c16 = new Uint16Array(cd.length); for (let i = 0; i < cd.length; i++) c16[i] = THREE.DataUtils.toHalfFloat(cd[i]);
  const corr = new THREE.DataTexture(c16, cw, chh, THREE.RedFormat, THREE.HalfFloatType);
  corr.magFilter = corr.minFilter = THREE.LinearFilter; corr.wrapS = corr.wrapT = THREE.ClampToEdgeWrapping; corr.needsUpdate = true;
  const corrBox = new THREE.Vector4(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0));
  const smapAt = (x, z) => {
    const u = clamp((x - box.x) * box.z * n - 0.5, 0, n - 1), v = clamp((z - box.y) * box.w * n - 0.5, 0, n - 1);
    const i = Math.min(n - 2, Math.floor(u)), j = Math.min(n - 2, Math.floor(v)), tu = u - i, tv = v - j, k = j * n + i;
    return lerp(lerp(f[k], f[k + 1], tu), lerp(f[k + n], f[k + n + 1], tu), tv);
  };
  return { tex, box, smapAt, corr, corrBox, dispose() { tex.dispose(); corr.dispose(); } };
}

// the uniforms every shader of this world shares (one object each, so one write reaches all). uRow: THE ONE ROW of
// the eye's place. uCastA / uCastB: the great upright things that throw shade (x, z, radius, -; from y, to y,
// strength, -). uLast: the last road as places handed in (s where the flood begins, the bank's height, the flood's
// level, the reach's level); uBankPh: the seed's phases of the bank's broad places.
export const NCAST = 40, REACH_Y = -0.8, FLOOD_Y = -0.9, BANK_Y = 0.3;
export function hourUniforms(hours, smap) {
  const rows = [], ca = [], cb = []; for (let i = 0; i < 8; i++) rows.push(new THREE.Vector4()); for (let i = 0; i < NCAST; i++) { ca.push(new THREE.Vector4(0, 0, 1, 0)); cb.push(new THREE.Vector4(0, 0, 0, 0)); }
  return {
    tHours: { value: hours.tHours }, tSmap: { value: smap.tex }, uSmapBox: { value: smap.box }, uTime: { value: 0 }, uRow: { value: rows },
    uLamp0: { value: new THREE.Vector4(0, -50, 0, 0) }, uLamp1: { value: new THREE.Vector4(0, -50, 0, 0) },
    uWind: { value: new THREE.Vector4(0.8, 0.6, 1, 6) }, uPair: { value: new THREE.Vector4(1e5, 1e5, 0, -1) }, uPairK: { value: new THREE.Vector4(0, 0, 0, 0) },
    tCorr: { value: smap.corr }, uCorrBox: { value: smap.corrBox }, uMistSeed: { value: new THREE.Vector2(0, 0) },
    uCastA: { value: ca }, uCastB: { value: cb }, uLast: { value: new THREE.Vector4(1e5, BANK_Y, FLOOD_Y, REACH_Y) }, uBankPh: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
}
// THE BANK OF THE LAST ROAD, one law on the processor and in the shaders: the water's edge 10 to 13 m from the line,
// the side falling 1.2 m at 1 in 3 to 1 in 5 (a run of 3.6 to 6 m), so the top is broad in places (4 to 9.4 m)
const wob = (t) => 0.6 * Math.sin(t) + 0.4 * Math.sin(t * 2.3 + 1.7);
export const bankEdge = (s, side, ph) => 11.5 + 1.5 * wob(s * 0.09 + side * 2.1 + ph[0]);
export const bankRun = (s, side, ph) => 4.8 + 1.2 * wob(s * 0.13 + side * 4.7 + ph[1]);

export const LAMP_AMBER = linear('#ffb347', 1), DAWN_PEARL = linear('#f3d9c2', 0.16);
const f3 = (c) => `vec3(${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)})`;
const FIRST_DIR = bearingDir(FIRST.bearing, 6), AFTER_DIR = bearingDir(AFTERGLOW.peak, 4);
// GLSL: the light of the ONE ROW (uRow, the eye's place), and what stands by place. hourS(xz) is a thing's own s,
// read only for WHERE things stand: standDew and standMist are the table's standing figures there. hourShade lights
// a surface with the row's key, fill and shade, the first light's pearl (what the day's veil leaves of it) and the
// two lamps; hourFog lays the row's air and the mist between a thing and the eye.
const GLSL_ROW = /* glsl */`
uniform sampler2D tHours, tSmap, tCorr; uniform vec4 uSmapBox, uLamp0, uLamp1, uWind, uCorrBox, uLast, uBankPh; uniform float uTime; uniform vec2 uMistSeed;
uniform vec4 uRow[8];
float hourS(vec2 xz){ return textureLod(tSmap, clamp((xz - uSmapBox.xy) * uSmapBox.zw, 0., 1.), 0.).r; }
vec4 hourRow(float k, float s){ return textureLod(tHours, vec2(clamp((s - (${S_LO}.)) / ${S_HI - S_LO}., .002, .998), (k + .5) / 8.), 0.); }
float standDew(float s){ return hourRow(3., s).a; }
float standMist(float s){ return hourRow(5., s).a; }
float lineDist(vec2 xz){ return textureLod(tCorr, clamp((xz - uCorrBox.xy) * uCorrBox.zw, 0., 1.), 0.).r; }
float hHash(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float hNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hHash(i), hHash(i + vec2(1., 0.)), f.x), mix(hHash(i + vec2(0., 1.)), hHash(i + vec2(1., 1.)), f.x), f.y); }
// the wind's long waves: 0..1, travelling along uWind.xy at uWind.w metres a second, uWind.z scales their length
float hourGust(vec2 xz){ float a = dot(xz, uWind.xy) - uTime * uWind.w; return .5 + .5 * sin(a * (6.2832 / (55. * uWind.z)) + 1.7 * sin(dot(xz, vec2(-uWind.y, uWind.x)) * .021)); }
vec3 lampOne(vec4 lamp, vec3 wp, vec3 N){ vec3 d = lamp.xyz - wp; float r2 = dot(d, d);
  float nl = clamp(dot(N, d) / sqrt(max(r2, 1e-4)) * .6 + .4, 0., 1.);
  return ${f3(LAMP_AMBER)} * (lamp.w * .5 * nl * (1. - smoothstep(20., 81., r2)) / (1. + r2 * .12)); }
vec3 lampLight(vec3 wp, vec3 N){ return lampOne(uLamp0, wp, N) + lampOne(uLamp1, wp, N); }
// small clouds' shadows drifting over the land with the wind (as many as the row's cumulus figure)
float cloudShade(vec2 xz){ float cu = uRow[6].a; if (cu < .01) return 1.;
  vec2 p = xz / 85. - uTime * uWind.xy * .06 + uMistSeed * .37; float n = hNoise(p) * .6 + hNoise(p * 2.3 + 5.) * .3 + hNoise(p * 5.1) * .1;
  return 1. - .45 * cu * smoothstep(.52, .68, n); }
// the first light's pearl on a face turned to it (a far light of one strength; the day's veil outshines it)
vec3 firstLight(vec3 N){ return ${f3(DAWN_PEARL)} * ((1. - uRow[1].a) * clamp(dot(N, ${f3(FIRST_DIR)}) * .7 + .3, 0., 1.)); }
vec3 hourShade0(vec3 alb, vec3 N, vec3 wp, float ao, float sun){
  vec3 L = normalize(uRow[1].xyz + vec3(0., 1e-3, 0.));
  // by night a thing keeps little of its own colour
  alb = mix(alb, vec3(dot(alb, vec3(.3, .55, .15))) * vec3(.72, 1., 1.1), (1. - uRow[1].a) * .58);
  float nl = clamp(dot(N, L), 0., 1.);
  vec3 amb = mix(uRow[3].rgb, uRow[2].rgb, clamp(N.y * .5 + .5, 0., 1.));
  vec3 c = alb * (uRow[0].rgb * (nl * sun * cloudShade(wp.xz)) + amb * ao);
  // the afterglow's thin light on the side toward where the sun went down (its strength is the row's)
  float ag = clamp(dot(N, ${f3(AFTER_DIR)}) * .6 + .4, 0., 1.);
  c += alb * vec3(.5, .6, .26) * (uRow[2].a * ag * ag * .55);
  return c + alb * firstLight(N);
}
vec3 hourShade(vec3 alb, vec3 N, vec3 wp, float ao, float sun){ return hourShade0(alb, N, wp, ao, sun) + alb * lampLight(wp, N); }
// A SHADE UNDER A LOW SUN IS LIT BY THE WHOLE SKY: the row's fill (the sky's top) and its low band alike, at the fill's own strength,
// and greyed by four tenths (what the ground gives back). It keeps the brightness the shade has and changes its hue only, by w (how
// deep in shade), by the day's veil and by the row's sun: whole while the sun stands 3 degrees up or lower, nothing from 10 up. So
// under a high sun and by night nothing changes; under the low sun a shade is a warm brown violet, never the fill's purple alone.
vec3 skyShade(vec3 c, vec3 alb, float w){
  const vec3 LW = vec3(.2126, .7152, .0722);
  vec3 sk = mix(uRow[2].rgb, uRow[6].rgb * (dot(uRow[2].rgb, LW) / max(dot(uRow[6].rgb, LW), 1e-4)), .5);
  sk = alb * mix(sk, vec3(dot(sk, LW)), .4);
  return mix(c, sk * (dot(c, LW) / max(dot(sk, LW), 1e-5)), clamp(w, 0., 1.) * uRow[1].a * (1. - smoothstep(${(3 * RAD).toFixed(4)}, ${(10 * RAD).toFixed(4)}, uRow[0].a)));
}
`;
// GLSL: THE AIR (for fragment shaders: it reads the pixel's footprint). THE MIST OF THE MEADOW IS A MEDIUM WITH A FORM BY
// PLACE: islands of the meadow's own ground (a field in world metres, three sizes, the same from 600 m as from 40 m), each
// island a low heap of mist: its TOP is a height of the place, 0.6 to 3.9 m by the table's standing mist figure there
// times the island's own figure, so it rises from nothing at an island's rim to its most at its middle; its DENSITY is most
// at the ground and falls with the square of the way to that top, to nothing at it. There is no level sheet in it and no
// level edge. Within 10 m of the road's line a top stands at 0.42 of its height (1.6 m at the most, under the eye), whole
// from 19 m off it (a rule of place, read from the map of metres from the line): the ride passes over the mist by the
// road and looks into the banks out in the meadow. The look gathers it in eight steps along the first 200 m it runs
// under 4.1 m, closer set near the eye; what is finer than the pixel's footprint or than a step gives way to its mean,
// size by size (that is all that cures the far shimmer). So a thing standing in it is veiled by the mist before it only:
// a trunk's foot stands darker than the mist that lies behind it. It is lit by the eye's row. The last road's LOW MIST
// lies on the flood and on the bank's wet foot (never on its top), 0.3 to 0.8 m deep over the ground it lies on (the
// bank's own law, bankGround), in long soft islands; it is laid on each face by the face's own place, and gives way to
// the lens only as a medium may: nothing of it within 0.6 m of the lens, whole from 2.5 m.
const GLSL_AIR = /* glsl */`
// (a size of the field, lam metres, under a footprint of w metres: whole while the footprint is smaller, its mean from four times it)
float mistKeep(float lam, float w){ return 1. - smoothstep(lam, lam * 4., w); }
float meadowMist(vec3 ro, vec3 rd, float dist, float pa){
  float t0 = 0., t1 = dist;
  if (abs(rd.y) > 1e-4) { float ta = (4.1 - ro.y) / rd.y, tb = (-.5 - ro.y) / rd.y; t0 = max(0., min(ta, tb)); t1 = min(dist, max(ta, tb)); }
  else if (ro.y > 4.1) return 0.;
  if (t1 <= t0) return 0.;
  float L = min(t1 - t0, 200.), tau = 0.;
  for (int i = 0; i < 8; i++) {
    float f = (float(i) + .5) / 8., t = t0 + L * f * f, dt = L * f * .25;
    vec3 q = ro + rd * t;
    float m = standMist(hourS(q.xz)); if (m < .01) continue;
    float w = max(pa * t, dt * .5), k26 = mistKeep(26., w);
    vec2 p = q.xz + uMistSeed + uTime * vec2(.22, .08);
    float n = .5 + (hNoise(p / 26.) - .5) * .42 * k26 + (hNoise(p / 11.) - .5) * .38 * mistKeep(11., w) + (hNoise(p / 4.3) - .5) * .2 * mistKeep(4.3, w) + .106 * (1. - k26);
    // A FEW CLEAR HEAPS WITH CLEAR AIR BETWEEN: the mist stands only where the field is well over its middle (about a third of the
    // ground, its thick heart a sixth), thicker there; between the heaps the ground is seen plainly. (Where a footprint holds the whole
    // field the figure goes to the heaps' own mean share.)
    float isl = smoothstep(.56, .72, n), top = (.6 + 3.3 * m) * isl * mix(.42, 1., smoothstep(10., 19., lineDist(q.xz)));
    float v = 1. - clamp((q.y + .2) / max(top, .05), 0., 1.);
    tau += dt * .22 * smoothstep(0., .3, m) * isl * v * v;
  }
  return tau;
}
float bankWob(float t){ return .6 * sin(t) + .4 * sin(t * 2.3 + 1.7); }
// the ground of the last road at a place: the bank's top, its side, the flood (the same law the ground is built by)
float bankGround(float s, float ad, float side){
  float e = 11.5 + 1.5 * bankWob(s * .09 + side * 2.1 + uBankPh.x), run = 4.8 + 1.2 * bankWob(s * .13 + side * 4.7 + uBankPh.y);
  return mix(uLast.y, uLast.z, smoothstep(e - run, e, ad));
}
// the low mist's depth of fog over a face at wp: nothing before the flood begins, nothing inside the rails
float lowMist(vec3 wp, float onGround, float w){
  float s = hourS(wp.xz), zone = smoothstep(uLast.x - 4., uLast.x + 14., s);
  if (zone < .004) return 0.;
  float ad = lineDist(wp.xz), g = mix(bankGround(s, ad, 0.), wp.y, onGround);
  vec2 p = wp.xz + uMistSeed * 3.1 + uTime * vec2(.11, .05);
  float k31 = mistKeep(31., w), n = .5 + (hNoise(p / 31.) - .5) * .4 * k31 + (hNoise(p / 12.) - .5) * .4 * mistKeep(12., w) + (hNoise(p / 4.7) - .5) * .2 * mistKeep(4.7, w) + .045 * (1. - k31);
  float deep = .3 + .5 * mix(.5, hNoise(p / 19. + 7.3), mistKeep(19., w));
  float onWater = smoothstep(11., 15., ad), island = smoothstep(mix(.5, .5, onWater), mix(.66, .72, onWater), n) * smoothstep(3.2, 5.2, ad);
  // (it keeps to the flood and the bank's wet foot: none on ground 0.8 m and more over the flood's level, so the bank's top is grass)
  float foot = 1. - smoothstep(uLast.z + .3, uLast.z + .8, mix(bankGround(s, ad, 0.), wp.y, onGround));
  return zone * island * foot * clamp((g + deep - wp.y) / max(deep, .05), 0., 1.) * deep;
}
vec3 hourMist(vec3 c, vec3 wp, float onGround){
  vec3 rd = wp - cameraPosition; float dist = length(rd); rd /= max(dist, 1e-4);
  // the pixel's own angle, and its footprint on the face it shows (taken here, before any branch)
  float pa = length(fwidth(rd)), fw = length(fwidth(wp.xz));
  float tau = meadowMist(cameraPosition, rd, dist, pa);
  tau += min(lowMist(wp, onGround, fw) * .34 / max(abs(rd.y), .1), .8) * smoothstep(.6, 2.5, dist);
  if (tau < 1e-4) return c;
  vec3 mc = (uRow[2].rgb * 1.5 + uRow[0].rgb * mix(.5, .3, 1. - uRow[1].a) + uRow[4].rgb * .3) * mix(1., .66, 1. - uRow[1].a) + firstLight(vec3(0., .5, -.5)) * 1.5;
  return mix(mc, c, exp(-tau));
}
vec3 hourFog(vec3 c, vec3 wp){ return hourMist(mix(uRow[4].rgb, c, exp(-distance(wp, cameraPosition) * uRow[4].a)), wp, 0.); }
vec3 hourFogGround(vec3 c, vec3 wp){ return hourMist(mix(uRow[4].rgb, c, exp(-distance(wp, cameraPosition) * uRow[4].a)), wp, 1.); }
`;
// (GLSL_ROW alone goes into vertex shaders: the air is a fragment's matter)
export const GLSL_HOURS = GLSL_ROW + GLSL_AIR;
export { GLSL_ROW };
// GLSL: THE LONG SHADE OF GREAT THINGS, painted on a face by the face's own place against each caster's place along
// the key of the eye's row (no shadow map). A caster is an upright body: (x, z, radius) from y to y; 1 = lit.
export const GLSL_CAST = /* glsl */`
uniform vec4 uCastA[${NCAST}], uCastB[${NCAST}];
float castShade(vec3 wp, vec3 L){
  float lh = length(L.xz); if (lh < .05) return 1.;
  vec2 ld = L.xz / lh; float tanEl = L.y / lh, sh = 1.;
  for (int i = 0; i < ${NCAST}; i++) {
    vec4 A = uCastA[i], B = uCastB[i]; vec2 e = A.xy - wp.xz;
    float al = dot(e, ld), ac = abs(e.x * ld.y - e.y * ld.x), hy = wp.y + al * tanEl, soft = A.z * .3 + .3 + al * .025;
    float k = (1. - smoothstep(A.z - soft, A.z + soft, ac)) * smoothstep(-A.z * .5, A.z * .5, al) * smoothstep(B.x - soft, B.x + soft, hy) * (1. - smoothstep(B.y - soft * 2., B.y + soft, hy));
    sh *= 1. - B.z * k;
  }
  return sh;
}`;

// ---------------------------------------------------------------- THE LAND: places, zones and the ground's height
// One law of the place, built here so that the world and every sum (the lens over the ground, what hides the water
// and the ring) read the same land. (x, z) are world metres; s, d are metres of road and metres right of its line.
// Places a person standing there could name, in metres of road (where a place is a knot of the road's list it is
// read from the list): the yard's gate, the stone gateposts, the left wall's ends, the hay wagon's gate at the
// swell's foot, the crest, the alder's point abeam, where the shore leaves the road, the wet meadow's first and last
// fence posts, the plank culvert, the flood's head on the right hand (where the bank's foot meets its first water: the
// flood's law begins there), the last bend's end, the ring. spit is the metre of the shore the alder's low point is laid
// from (the land's own figure; the alder's own point stands abeam at 243.6 and the table reads that).
export function makePlaces(road) {
  const k = (i) => road.knot(i), P = (s, d = 0) => { const a = road.at(s, d); return [a[0], a[1]]; }, dirOf = (deg) => [Math.sin(deg * RAD), -Math.cos(deg * RAD)];
  const PL = { bend1: k(0), bend1End: k(1), bend2: k(2), bend2End: k(3), bend3: k(4), crest: k(5), bend4: k(6), bend4End: k(7), bend5: k(8), bendEnd: k(9), ring: road.L,
    gate: 62, picketL: [14, 84], wallR: [16, 58], wallBack: 16, washing: [46, 58, 26], hens: [20, 55], posts: 106, wallL: [140, 172], wagon: 164, railR: [92, 150], reapedR: [150, 205], spit: 246, shore: [234, 282], fence4: [290, 318], culvert: 306, floodHead: 366,
    // hour 1: the worn ring, the schoolhouse (porch front, the body's far end), pump, maples, the white house, the village
    ringC: [-9, -50], ringR: 4.5, porch: [-16.3, -63.9], schoolBack: [-29, -72], pump: [-13, -58], mapleA: [-11, -38], mapleB: [10, -30], mapleC: [-31, -66], mapleD: [-22, -46],
    whiteHouse: [34, -52], village: [-68, -94], meeting: [-118, -138],
    // hour 2: the barn, its silo, the lane of elms; the ridge's bearing to the right of the crest
    barn: [-80, -182], barnHalf: 12, barnWide: 7, silo: [-74, -196], lane: [[-58, -140], [-92, -172]], ridgeBearing: 142,
    // hour 3: the alder on its point; the reach's bearings (its near shore leaves the road toward 62, its far shore runs toward 100, its length toward 80)
    alder: [25, -201], headS: 228, headD: 30, shoreD: 8,
    // hours 4 and 5: the deer, the carr's middle line, the low rise (centre, the bearing of its long axis), its cornice, the old oak
    deer: [[19, -276], [17, -282]], carr: [[-4, -236], [4, -264], [10, -292], [22, -316], [33, -325]], rise: [37.4, -301.9], riseBearing: -18, cornice: [42.0, -287.6], oak: [45.5, -300.6],
    // hour 6: the great elms (metres of road abeam, metres right of the line): the right hand is the open hand
    elms: [[398, 25], [410, 33], [444, -22], [486, -28], [540, -36], [548, -39], [566, 85], [575, 90], [585, 90]] };
  const C = P(PL.crest), hb = road.at(PL.crest)[2];
  // the whaleback's frame: m = metres beyond the ridge line along the road's heading at the crest, n = metres along the ridge to the right
  PL.C = C; PL.fwd = [Math.sin(hb), -Math.cos(hb)]; PL.rgt = dirOf(PL.ridgeBearing);
  PL.head = P(PL.headS, PL.headD); PL.shoreOff = P(PL.shore[1], PL.shoreD); PL.dirNear = dirOf(62); PL.dirFar = dirOf(100); PL.dirSun = dirOf(SUN_BEARING);
  PL.end = P(PL.bendEnd); PL.last = dirOf(road.at(PL.bendEnd + 1)[2] / RAD); PL.floodR = P(PL.floodHead, 11.5); PL.gateP = P(PL.posts); PL.gateDir = dirOf(road.at(PL.posts)[2] / RAD);
  PL.elmXZ = PL.elms.map(([s, d]) => P(s, d)); PL.riseAxis = dirOf(PL.riseBearing);
  return PL;
}

// THE LAND'S LAW. o = { noise (the ground's own stream), gaps ([[s, width]] of the reed belt), bankPh, swell ([ox, oz]) }.
// h = E + near * (the road's height - E at the line's nearest point): the country's own height E (swells in the wheat,
// the whaleback, the low rise, the islands) with the road's own height at the line, run together between 10 and 38 m
// off (under the smallest bend's radius); level across the road itself. Then the waters are cut: the reach by its
// shore (a bank of 1 in 2 at the steepest), the flood by the bank's law. f > 0 means inside a water.
export function makeLand(road, PL, o) {
  const N = o.noise, loc = { s: 0, d: 0 }, q = [0, 0, 0], gaps = o.gaps || [], ph = o.bankPh || [0, 0], sw = o.swell || [0, 0];
  const gapAt = (s) => { let g = 0; for (const [a, w] of gaps) g = Math.max(g, smoothstep(a - 2, a + 1.5, s) * (1 - smoothstep(a + w - 1.5, a + w + 2, s))); return g; };
  // the reach's outline: its head, the shore beside the road, out along its two bearings to the far bank
  const poly = [PL.head, [(PL.head[0] + road.at(PL.shore[0], PL.shoreD)[0]) / 2 + 2, (PL.head[1] + road.at(PL.shore[0], PL.shoreD)[1]) / 2 - 3]];
  for (let s = PL.shore[0]; s <= PL.shore[1] + 1e-6; s += 4) { road.at(s, PL.shoreD, q); poly.push([q[0], q[1]]); }
  poly.push([PL.shoreOff[0] + PL.dirNear[0] * 760, PL.shoreOff[1] + PL.dirNear[1] * 760], [PL.head[0] + PL.dirFar[0] * 760, PL.head[1] + PL.dirFar[1] * 760]);
  const sdPoly = (x, z) => {
    let best = 1e18, inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const ax = poly[j][0], az = poly[j][1], bx = poly[i][0], bz = poly[i][1], ex = bx - ax, ez = bz - az, t = clamp(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez), 0, 1);
      const dx = x - ax - ex * t, dz = z - az - ez * t; best = Math.min(best, dx * dx + dz * dz);
      if ((az > z) !== (bz > z) && x < ax + (z - az) / (bz - az) * ex) inside = !inside;
    }
    return (inside ? 1 : -1) * Math.sqrt(best);
  };
  // which water a place belongs to: the flood lies beyond a line from the meadow's right hand out between the two
  const dv = road.at((PL.shore[1] + PL.floodHead) / 2, 30), dn = [Math.cos(56 * RAD), Math.sin(56 * RAD)];
  const floodSide = (x, z) => ((x - dv[0]) * dn[0] + (z - dv[1]) * dn[1] < 0 ? 1 : 0);
  const segD = (x, z, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], t = clamp(((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez), 0, 1); return Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t); };
  const spit0 = road.at(PL.spit - 2, PL.shoreD - 2).slice(0, 2), spit1 = [PL.alder[0] + (PL.alder[0] - spit0[0]) * 0.12, PL.alder[1] + (PL.alder[1] - spit0[1]) * 0.12];
  const shoreGap = (s) => Math.max(3.2, 3.2 + (road.yAt(s) - REACH_Y) * 2.4);
  const reachF = (x, z, s, d) => {
    if (floodSide(x, z) && d > 0) return -30;
    let f = sdPoly(x, z) + 1.2 * N.n2(x * 0.11, z * 0.11);
    if (d > 0 && d < 14 && s > PL.shore[0] && s < PL.shore[1]) f += gapAt(s) * Math.max(0, PL.shoreD - shoreGap(s)) * (1 - smoothstep(9, 14, d));
    // the alder's low grassy point runs out from the shore to the tree and a little past it
    return Math.min(f, segD(x, z, spit0, spit1) - 4.4);
  };
  // the flood: on the right from where the low rise's far end is abeam, on the left from the last bend's end; its near
  // edge the bank's law; on the left its far shore under the whaleback's foot, opening out beyond the ring
  const carrDist = (x, z) => { let b = 1e9; for (let i = 0; i < PL.carr.length - 1; i++) { const a = PL.carr[i], c = PL.carr[i + 1], ex = c[0] - a[0], ez = c[1] - a[1], t = clamp(((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez), 0, 1); b = Math.min(b, Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t)); } return b; };
  const leftShore = (s) => 62 + 190 * smoothstep(PL.ring - 12, PL.ring + 95, s);
  const floodF = (x, z, s, d) => {
    const side = d < 0 ? -1 : 1, ad = Math.abs(d), from = side > 0 ? PL.floodHead : PL.bendEnd, e = bankEdge(s, side, ph);
    let f = Math.min(ad - e, (s - from) * 1.2 + 2 * N.n2(x * 0.07, z * 0.07 + 3.3));
    if (side < 0) f = Math.min(f, leftShore(s) + 7 * N.n2(x * 0.02 + 9.1, z * 0.02) - ad); else { const g = (x - dv[0]) * dn[0] + (z - dv[1]) * dn[1]; if (g >= 0) f = Math.min(f, -1 - g); }
    // the carr stands on land: no flood within 9 m of its middle line
    f = Math.min(f, carrDist(x, z) - 9);
    return f;
  };
  // THE ISLANDS OF THE GREAT ELMS: old ground the flood left standing, one to each group, by one rule for all of them. Each stands as high
  // over the flood as the road's own bank (BANK_Y), lies long with the flood's run (ISLE.long times as long along the road's heading at its
  // place as across it) and has a shore that wanders by the land's own noise (ISLE.wander of its breadth): ground with a body, a slope and
  // an uneven edge, not a level plate. Across the road its shore lies at ISLE.shore of r (8.7 m about a single elm, 12.6 m
  // about a group), so the water lies between it and the bank.
  const ISLE = { long: 1.7, wander: 0.14, shore: 0.79, top: 0.3, up: BANK_Y - FLOOD_Y, under: 1.6 };
  const isles = []; for (const [x, z] of PL.elmXZ) { const near = isles.find((c) => Math.hypot(c[0] - x, c[1] - z) < 16); if (near) { near[0] = (near[0] + x) / 2; near[1] = (near[1] + z) / 2; near[2] = 16; } else isles.push([x, z, 11]); }
  for (const c of isles) { road.locate(c[0], c[1], loc); const b = road.at(loc.s)[2]; c[3] = Math.sin(b); c[4] = -Math.cos(b); }
  // (the share of the slope's run at which the ground comes down to the water's level: where the smooth step equals up / (up + under))
  let isleT = 0.5; for (let i = 0, lo = 0, hi = 1; i < 30; i++) { isleT = (lo + hi) / 2; if (isleT * isleT * (3 - 2 * isleT) < ISLE.up / (ISLE.up + ISLE.under)) lo = isleT; else hi = isleT; }
  const isleAt = (x, z) => {
    let h = -9;
    for (const [cx, cz, r, hx, hz] of isles) {
      const ex = x - cx, ez = z - cz, a = r * ISLE.top, b = a + (r * ISLE.shore - a) / isleT;
      const dd = Math.hypot((ex * hx + ez * hz) / ISLE.long, ex * hz - ez * hx) * (1 + ISLE.wander * N.n2(x * 0.09 + 5.3, z * 0.09));
      if (dd < b) h = Math.max(h, FLOOD_Y + ISLE.up - (ISLE.up + ISLE.under) * smoothstep(a, b, dd));
    }
    return h;
  };
  const segDist = (x, z, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], t = clamp(((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez), 0, 1); return Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t); };
  const farN = [Math.cos(100 * RAD), Math.sin(100 * RAD)], band = (a, b, w, v) => smoothstep(a - w, a + w, v) * (1 - smoothstep(b - w, b + w, v));
  // ZONES at a place: standing wheat, reaped stubble, rough wet meadow; the two waters; the whaleback's own frame (m, n)
  const zone = (x, z, out = {}) => {
    road.locate(x, z, loc); const s = loc.s, d = loc.d, ad = Math.abs(d), m = (x - PL.C[0]) * PL.fwd[0] + (z - PL.C[1]) * PL.fwd[1], n = (x - PL.C[0]) * PL.rgt[0] + (z - PL.C[1]) * PL.rgt[1];
    const fr = reachF(x, z, s, d), ff = s > PL.floodHead - 30 ? floodF(x, z, s, d) : -50;
    const swellSide = (x - PL.head[0]) * farN[0] + (z - PL.head[1]) * farN[1];
    const reapR = band(PL.reapedR[0], PL.reapedR[1], 1, s) * band(6, 40, 0.6, d);
    const pasture = band(PL.wallL[0] - 2, PL.wallL[1] + 1, 1, s) * band(3.4, 36, 0.8, -d);
    const yard = 1 - smoothstep(20, 24, Math.hypot(x - PL.barn[0], z - PL.barn[1])), lane = 1 - smoothstep(6, 9, segDist(x, z, PL.lane[0], PL.lane[1])), green = 1 - smoothstep(40, 48, segDist(x, z, PL.village, PL.meeting));
    const inS = smoothstep(PL.posts - 1.5, PL.posts + 0.5, s), before = d > 0 ? 1 - smoothstep(4, 7, m) : 1 - smoothstep(-1.5, 0.5, m), right = d > 0 ? smoothstep(3, 9, swellSide) * smoothstep(0, 4, m + 2) : 0;
    out.wheat = inS * Math.max(before, right) * (1 - reapR) * (1 - pasture) * (1 - yard) * (1 - lane) * (1 - green) * (1 - smoothstep(-3, -1, fr)) * (1 - smoothstep(560, 640, ad));
    const flankL = smoothstep(-1.5, 0.5, m) * (d < 0 ? 1 : 0) * (1 - smoothstep(64, 74, ad)) * inS;
    out.reaped = Math.max(reapR, flankL * (1 - smoothstep(PL.shore[1] - 12, PL.shore[1] - 2, s)));
    out.rough = smoothstep(PL.shore[1] - 8, PL.shore[1] + 4, s) * (1 - smoothstep(PL.floodHead - 6, PL.bendEnd, s));
    // WHAT THE GROUND'S SKIN IS PAINTED BY (the dealers above read reaped and rough as they stand): left of the road, where the reaped flank
    // goes down to the wet meadow, the two run on under each other and the skin cuts THE SHORE BETWEEN THEM itself, a line that wanders
    // (shoreEdge; the ground's shader holds its twin)
    out.paintStub = d < 0 ? Math.max(reapR, flankL * (1 - smoothstep(PL.shore[1] + 16, PL.shore[1] + 24, s))) : out.reaped;
    out.paintRough = d < 0 ? smoothstep(PL.shore[1] - 26, PL.shore[1] - 16, s) * (1 - smoothstep(PL.floodHead - 6, PL.bendEnd, s)) : out.rough;
    out.s = s; out.d = d; out.ad = ad; out.m = m; out.n = n; out.reach = fr; out.flood = ff; out.water = Math.max(fr, ff); out.side = floodSide(x, z);
    return out;
  };
  // THE COUNTRY'S OWN HEIGHT: swells in the wheat country, the whaleback across the road at the crest, the low rise
  const hump = (m) => 1 - smoothstep(0, 50, Math.abs(m)), ridgeH = (n) => lerp(o.saddle ?? 2.6, o.shoulder ?? 4.9, smoothstep(0, n > 0 ? (o.shoulderAtR ?? 9) : (o.shoulderAt ?? 25), Math.abs(n))) * (1 - smoothstep(90, 120, Math.abs(n)));
  const riseAt = (x, z) => {
    const ex = x - PL.rise[0], ez = z - PL.rise[1], u = ex * PL.riseAxis[0] + ez * PL.riseAxis[1], v = ex * PL.riseAxis[1] - ez * PL.riseAxis[0], au = Math.abs(u);
    let H = 2.2 * (1 - 0.42 * smoothstep(9, 15, au)); const Re = 6.2 * 1.276;
    if (au > 15) { const t = (au - 15) / Re; if (t >= 1) return 0; H *= (1 - t * t) ** 2; }
    const R = Math.max(7.9, 6.2 * H), r = Math.abs(v) / R; return r >= 1 ? 0 : H * (1 - r * r) ** 2;
  };
  const E = (x, z, s, m, n) => {
    const hp = hump(m), swell = smoothstep(PL.posts - 10, PL.posts + 12, s) * (1 - smoothstep(10, 60, m)) * (1 - 0.7 * hp * (1 - smoothstep(90, 120, Math.abs(n))));
    // the reach lies in a hollow of the country: along its whole southern shore, from where the whaleback's arm ends, the land
    // stands as one long low swell (so that from the school's road and the wheat no water is in sight before the crest)
    const ss = (x - PL.head[0]) * farN[0] + (z - PL.head[1]) * farN[1], tt = (x - PL.head[0]) * PL.dirFar[0] + (z - PL.head[1]) * PL.dirFar[1];
    const rim = (o.rim ?? 4.2) * smoothstep(10, 45, ss) * (1 - smoothstep(80, 140, ss)) * smoothstep(25, 70, tt);
    return swell * (o.swellAmp ?? 2.4) * N.n2((x + sw[0]) / 125, (z + sw[1]) / 125) + ridgeH(n) * hp + riseAt(x, z) + rim;
  };
  // the offset that brings the country to the road's own height at the line, tabled along the road
  const T0 = -420, T1 = Math.ceil(road.L + 720), off = new Float32Array(T1 - T0 + 1);
  for (let i = 0; i < off.length; i++) { const s = T0 + i; road.at(s, 0, q); off[i] = road.yAt(s) - E(q[0], q[1], s, (q[0] - PL.C[0]) * PL.fwd[0] + (q[1] - PL.C[1]) * PL.fwd[1], (q[0] - PL.C[0]) * PL.rgt[0] + (q[1] - PL.C[1]) * PL.rgt[1]); }
  const offAt = (s) => { const f = clamp(s - T0, 0, off.length - 1.001), i = Math.floor(f); return lerp(off[i], off[i + 1], f - i); };
  const zt = {};
  // the ground's height at a place; lift: with the far wheat's surface raised to the ears (what is drawn), or the earth itself
  const heightAt = (x, z, zo = zt, lift = true) => {
    zone(x, z, zo); const s = zo.s, ad = zo.ad;
    let h = E(x, z, s, zo.m, zo.n) + offAt(s) * (1 - smoothstep(10, 38, ad));
    h = lerp(h, road.yAt(s), 1 - smoothstep(2, 6, ad));
    if (lift) h += zo.wheat * (WHEAT.stalk - 0.05) * smoothstep(WHEAT.last - 3, WHEAT.last, ad);
    if (zo.reach > -40) {
      h = Math.min(h, zo.reach < 0 ? REACH_Y + 0.04 - zo.reach / 2 : REACH_Y - 1.3 * smoothstep(0, 6, zo.reach));
      // the alder's point is low: from the shore's own height it falls to half a metre over the water at the tree
      const ex = spit1[0] - spit0[0], ez = spit1[1] - spit0[1], t = clamp(((x - spit0[0]) * ex + (z - spit0[1]) * ez) / (ex * ex + ez * ez), 0, 1);
      if (Math.hypot(x - spit0[0] - ex * t, z - spit0[1] - ez * t) < 9) h = Math.min(h, lerp(road.yAt(PL.spit) + 0.2, REACH_Y + 0.55, smoothstep(0, 0.55, t)));
    }
    if (zo.flood > -12) {
      const run = bankRun(s, zo.d < 0 ? -1 : 1, ph);
      h = lerp(h, FLOOD_Y, smoothstep(-run, 0, zo.flood)); if (zo.flood > 0) h = FLOOD_Y - 1.1 * smoothstep(0, 5, zo.flood);
      h = Math.max(h, isleAt(x, z));
    }
    return h;
  };
  return { gapAt, sdPoly, floodSide, shoreGap, reachF, floodF, leftShore, carrDist, isles, isleAt, zone, heightAt, E, offAt, riseAt, poly, dv, dn };
}

// THE SHORE OF THE WET MEADOW against the worked flank, left of the road: the metre of road at which it lies, ad metres from the line. Beside
// the road it lies where the meadow begins (2 m before where the reach's shore leaves the road); from the verge out it runs on in tongues of
// up to 14 m (never back toward the crest: every shock keeps stubble under it). ph = the seed's bank phases (dealLand's bankPh).
export const shoreEdge = (PL, ad, ph) => PL.shore[1] - 2 + smoothstep(4, 14, ad) * (7 + 7 * wob(ad * 0.19 + ph[3]));
// THE HOLLOWS of the flank's ground: a field of the place (world metres); standing water lies where it is over HOLLOW.at (the shader's twin
// paints the pools; the world sets sedge about them)
export const HOLLOW = { at: 1.1, full: 1.18 };
export const hollowAt = (x, z, ph) => Math.sin(x * 0.21 + ph[2]) * Math.sin(z * 0.17 + ph[3]) + 0.45 * Math.sin(x * 0.083 - z * 0.11 + ph[2] * 1.7);
// A STREAM OF ITS OWN for every thing, by its name and the seed (the world takes all of them at the head of build).
export const streamOf = (seed, name) => makeRng(hashSeed('fields-of-gazing-grain:' + name + ':' + seed));
// the land as the seed deals it (the reed belt's gaps, the bank's broad places, the swells' shapes away from the road);
// road, places and heights at the line are the same on every seed
export function dealLand(seed, tune = {}) {
  const road = makeRoad(), PL = makePlaces(road), rr = streamOf(seed, 'reach'), gaps = [];
  // (no gap where the alder's point leaves the shore)
  let s = PL.shore[0] + rr.range(2, 8); while (s < PL.shore[1] - 8) { const w = rr.range(6, 13); if (s < PL.spit + 8 && s + w > PL.spit - 8) s = PL.spit + 8 + rr.range(0, 3); gaps.push([s, w]); s += w + rr.range(10, 18); }
  const rb = streamOf(seed, 'bank'), bankPh = [rb.range(0, 6.283), rb.range(0, 6.283), rb.range(0, 100), rb.range(0, 100)];
  const rs = streamOf(seed, 'swells'), swell = [rs.range(0, 1000), rs.range(0, 1000)];
  const noise = makeNoise(hashSeed('fields-of-gazing-grain:ground:' + seed));
  return { road, PL, gaps, bankPh, swell, noise, land: makeLand(road, PL, { noise, gaps, bankPh, swell, ...tune }) };
}

// THE GREAT ELMS OF THE LAST ROAD, each from its own draws at its fixed place: a bare trunk to its fork (8.6 m and more
// up), four or five boughs rising steeply and arching out (the vase form), leaf masses at their ends and along their
// upper halves with gaps between. No leaf mass reaches further than 9 m in plan from the trunk's foot, lean and all:
// a mass that would is drawn in toward the trunk at its own height. CLUMP = the radius of one leaf mass of size 1.
export const CLUMP = 3.3;
export function dealElms(seed, PL) {
  const r = streamOf(seed, 'elms'), out = [];
  PL.elmXZ.forEach(([x, z], i) => {
    const H = r.range(26, 32), girth = r.range(0.6, 0.8), fork = r.range(8.6, 11), la = r() * 6.283, lean = r.range(0.01, 0.045), nb = r.int(4, 5), a0 = r() * 6.283, boughs = [], clumps = [];
    const top = [Math.cos(la) * lean * fork, fork, Math.sin(la) * lean * fork];
    const mass = (px, py, pz, sc) => { const rad = CLUMP * sc, d = Math.hypot(px, pz), k = d + rad > 8.9 ? Math.max(0, 8.9 - rad) / d : 1; clumps.push({ x: px * k, y: py, z: pz * k, s: sc, sy: r.range(0.9, 1.12), rot: r() * 6.283 }); };
    for (let b = 0; b < nb; b++) {
      const az = a0 + b / nb * 6.283 + r.range(-0.35, 0.35), reach = r.range(3.4, 5.4), hy = H * r.range(0.74, 0.88) - fork, pts = [];
      for (let k = 0; k <= 5; k++) { const t = k / 5, o = reach * (0.25 * t + 0.75 * t * t), up = hy * (1 - (1 - t) ** 1.6); pts.push([top[0] + Math.cos(az) * o, fork + up, top[2] + Math.sin(az) * o]); }
      boughs.push({ pts, r0: girth * r.range(0.32, 0.42) });
      const at = (t) => { const f = t * 5, j = Math.min(4, Math.floor(f)), u = f - j; return [lerp(pts[j][0], pts[j + 1][0], u), lerp(pts[j][1], pts[j + 1][1], u), lerp(pts[j][2], pts[j + 1][2], u)]; };
      const e = at(1); mass(e[0] + r.range(-0.6, 0.6), e[1] - 2.2, e[2] + r.range(-0.6, 0.6), r.range(1.25, 1.5));
      // the bough's end droops: a mass hanging outside and below it
      mass(e[0] + Math.cos(az) * r.range(1.6, 2.6), e[1] - r.range(7, 10), e[2] + Math.sin(az) * r.range(1.6, 2.6), r.range(1.05, 1.3));
      const m = at(r.range(0.5, 0.66)); mass(m[0] + Math.cos(az) * r.range(1.2, 2.4), m[1] - 2.6, m[2] + Math.sin(az) * r.range(1.2, 2.4), r.range(1.1, 1.35));
      // and low on the bough, about the fork's own height: the crown is full from the fork up (its lowest leaf 8.2 m and more over
      // the foot), never a tuft on a pole
      const lo = at(r.range(0.26, 0.38)); mass(lo[0] + Math.cos(az) * r.range(1.6, 3.2), fork + r.range(-0.4, 2.2), lo[2] + Math.sin(az) * r.range(1.6, 3.2), r.range(1.0, 1.25));
    }
    mass(top[0] + r.range(-1, 1), H - CLUMP * 1.3 * 1.12, top[2] + r.range(-1, 1), r.range(1.2, 1.3));
    out.push({ x, z, H, girth, fork, top, boughs, clumps, near: i < 4 });
  });
  return out;
}

// WHAT STANDS BETWEEN THE EARLIER ROAD AND THE LAST ROAD (the laying of the line that keeps the ring out of every
// earlier picture), dealt here so that the world builds and the sum counts the same trees: THE ALDER CARR, a belt
// 14 m deep along its middle line, with tall reed at its feet; THE THICKET of alder and reed inside the last bend at
// the flood's edge; THE RIDGE WOOD on the whaleback left of the crest. A carr tree stands only on land, 6.5 m and
// more from the road's line and never beyond the line square to the road at the last bend's end. D = dealLand(seed).
export function dealStanding(seed, D, tune = {}) {
  const { road, PL, land } = D, zo = {}, carr = [], reed = [], wood = [];
  const rc = streamOf(seed, 'carr'), rt = streamOf(seed, 'thicket'), rw = streamOf(seed, 'ridgewood');
  // (the belt's own middle line runs up to 8 m past that square line where it lies 20 m and more from the road: there the belt is kept whole)
  const ok = (x, z, clear) => {
    land.zone(x, z, zo); const along = (x - PL.end[0]) * PL.last[0] + (z - PL.end[1]) * PL.last[1];
    return (zo.s <= PL.bendEnd || (along < 9 && zo.ad > 12 && land.carrDist(x, z) < 7.6)) && zo.ad >= clear && zo.water < -0.3;
  };
  for (let i = 0; i < PL.carr.length - 1; i++) {
    const a = PL.carr[i], b = PL.carr[i + 1], ex = b[0] - a[0], ez = b[1] - a[1], len = Math.hypot(ex, ez), nx = -ez / len, nz = ex / len;
    for (let t = 0; t < len; t += (tune.carrStep ?? 3.3)) for (let w = -6; w <= 6.01; w += 3) {
      const u = t + rc.range(-1, 1), v = w + rc.range(-1.1, 1.1), x = a[0] + ex * u / len + nx * v, z = a[1] + ez * u / len + nz * v, h = rc.range(9, 13), r = rc.range(2.1, 3);
      if (ok(x, z, 6.5)) carr.push({ x, z, h, r, rot: rc() * 6.283, lean: [rc.range(-0.05, 0.05), rc.range(-0.05, 0.05)], kind: rc.int(0, 2), inner: Math.abs(w) < 4.5 });
    }
    // reed 3 m tall at the belt's feet: on both its edges and down its middle
    for (let t = 0; t < len; t += 0.8) for (const w of [-7.6, 0, 7.6]) { const u = t + rt.range(-0.3, 0.3), v = w + rt.range(-0.9, 0.9), x = a[0] + ex * u / len + nx * v, z = a[1] + ez * u / len + nz * v; if (ok(x, z, 4.2)) reed.push({ x, z, h: rt.range(2.6, 3.2) }); }
  }
  // the belt's underwood on its road side: sallow bushes 3.4 to 5 m tall in one closed line, so that no sight line runs through under the alders' leaves
  const under = [];
  for (let i = 0; i < PL.carr.length - 1; i++) {
    const a = PL.carr[i], b = PL.carr[i + 1], ex = b[0] - a[0], ez = b[1] - a[1], len = Math.hypot(ex, ez), nx = -ez / len, nz = ex / len;
    const sgn = Math.hypot(a[0] + nx * 5 - PL.rise[0], a[1] + nz * 5 - PL.rise[1]) < Math.hypot(a[0] - nx * 5 - PL.rise[0], a[1] - nz * 5 - PL.rise[1]) ? 1 : -1;
    for (let t = 0; t < len; t += 2.2) { const v = sgn * (6.4 + rc.range(-0.4, 0.4)), u = t + rc.range(-0.3, 0.3), x = a[0] + ex * u / len + nx * v, z = a[1] + ez * u / len + nz * v; if (ok(x, z, 6.5)) under.push({ x, z, h: rc.range(3.6, 5), r: rc.range(2, 2.5), rot: rc() * 6.283 }); }
  }
  // THE THICKET: alder and tall reed at the flood's edge inside the last bend, a band 8 m deep on the land side of the line square to the
  // road at the bend's end, from 7 m to 30 m left of the road (where the belt's own end comes down to the road); never on the low
  // rise above its lowest skirt
  const left = [PL.last[1], -PL.last[0]];
  for (let v = 7; v <= (tune.thicketWide ?? 30); v += 2.6) for (let w = 1; w <= (tune.thicketDeep ?? 8.5); w += 2.5) {
    const vv = v + rt.range(-0.8, 0.8), ww = w + rt.range(-0.8, 0.8), x = PL.end[0] + left[0] * vv - PL.last[0] * ww, z = PL.end[1] + left[1] * vv - PL.last[1] * ww;
    if (ok(x, z, 6.5) && land.riseAt(x, z) < 0.9) carr.push({ x, z, h: rt.range(9, 13), r: rt.range(2.1, 3), rot: rt() * 6.283, lean: [rt.range(-0.05, 0.05), rt.range(-0.05, 0.05)], kind: rt.int(0, 2), inner: w > 2 && w < 7.5 && v > 9 });
  }
  // its road side: one row 6.7 m from the line, crowns 2.7 to 3 m in radius, so that the carr's road side stands 4 to 5 m off
  for (let w = 0.8; w <= 9; w += 2.2) { const vv = 6.7 + rt.range(-0.15, 0.15), x = PL.end[0] + left[0] * vv - PL.last[0] * w, z = PL.end[1] + left[1] * vv - PL.last[1] * w; if (ok(x, z, 6.5)) carr.push({ x, z, h: rt.range(10, 13), r: rt.range(2.7, 3), rot: rt() * 6.283, lean: [0, 0], kind: rt.int(0, 2) }); }
  for (let v = 4.3; v <= 12; v += 0.5) for (let k = 0; k < 3; k++) { const vv = v + rt.range(-0.3, 0.3), ww = rt.range(0.5, 7), x = PL.end[0] + left[0] * vv - PL.last[0] * ww, z = PL.end[1] + left[1] * vv - PL.last[1] * ww; if (ok(x, z, 4.2)) reed.push({ x, z, h: rt.range(2.6, 3.2) }); }
  for (let v = 7; v <= (tune.thicketWide ?? 30); v += 2.2) { const vv = v + rt.range(-0.3, 0.3), ww = rt.range(8.2, 9.2), x = PL.end[0] + left[0] * vv - PL.last[0] * ww, z = PL.end[1] + left[1] * vv - PL.last[1] * ww; if (ok(x, z, 6.5) && land.riseAt(x, z) < 0.9) under.push({ x, z, h: rt.range(3.6, 5), r: rt.range(2, 2.5), rot: rt() * 6.283 }); }
  // the ridge wood: maples and ash 14 to 18 m, from 7 m to 75 m left of the line along the ridge and 30 m deep down the far flank
  for (let n = 7; n <= 75; n += 5.2) for (let m = -2; m <= 30; m += 5.4) {
    const nn = n + rw.range(-1.8, 1.8), mm = m + rw.range(-1.9, 1.9), x = PL.C[0] - PL.rgt[0] * nn + PL.fwd[0] * mm, z = PL.C[1] - PL.rgt[1] * nn + PL.fwd[1] * mm;
    land.zone(x, z, zo); if (zo.ad < 7) continue;
    wood.push({ x, z, h: rw.range(14, 18), r: rw.range(3.6, 5), rot: rw() * 6.283, kind: rw.int(0, 2), inner: m > 4 && m < 24 && n > 13 && n < 70 });
  }
  // its underwood: hazel and saplings 3 to 5 m tall between the trunks, so that no sight line runs under the crowns
  for (let n = 7; n <= 76; n += 3.3) for (let m = -3; m <= 31; m += 3.6) {
    const nn = n + rw.range(-1, 1), mm = m + rw.range(-1.1, 1.1), x = PL.C[0] - PL.rgt[0] * nn + PL.fwd[0] * mm, z = PL.C[1] - PL.rgt[1] * nn + PL.fwd[1] * mm;
    land.zone(x, z, zo); if (zo.ad < 6) continue;
    under.push({ x, z, h: rw.range(3.4, 5.2), r: rw.range(1.9, 2.5), rot: rw() * 6.283 });
  }
  return { carr, reed, wood, under };
}

// ---------------------------------------------------------------- a small mesh builder (position, colour, uv = (kind, param), wind)
// kinds the lit shader knows: 0 plain, 1 clapboard, 2 field stone, 3 shingle, 4 wood grain, 5 cloth (lit through), 6 brass, 7 flame (param = strength), 8 leather, 9 straw, 10 far woods
export function makeGeo() {
  const P = [], C = [], U = [], W = [], I = [], M = new THREE.Matrix4(), v = new THREE.Vector3();
  let col = [1, 1, 1], kind = 0, par = 0, wind = [0, 0, 0, 0], n = 0;
  const g = {
    col(c, k = 1) { col = [c[0] * k, c[1] * k, c[2] * k]; return g; },
    kind(k, p = 0) { kind = k; par = p; return g; },
    wind(a = 0, b = 0, c = 0, d = 0) { wind = [a, b, c, d]; return g; },
    tr(x, y, z, yaw = 0, sc = 1) { M.makeRotationY(yaw); M.scale(v.set(sc, sc, sc)); M.setPosition(x, y, z); return g; },
    pop() { M.identity(); return g; },
    vert(p, c = col, w = wind) { v.set(p[0], p[1], p[2]).applyMatrix4(M); P.push(v.x, v.y, v.z); C.push(c[0], c[1], c[2]); U.push(kind, par); W.push(w[0], w[1], w[2], w[3]); return n++; },
    tri(a, b, c) { const i = g.vert(a); g.vert(b); g.vert(c); I.push(i, i + 1, i + 2); return g; },
    quad(a, b, c, d) { const i = g.vert(a); g.vert(b); g.vert(c); g.vert(d); I.push(i, i + 1, i + 2, i, i + 2, i + 3); return g; },
    // the last four verts, made one by one, as a quad
    face(i) { I.push(i, i + 1, i + 2, i, i + 2, i + 3); return g; },
    // an upright box from (x0, y0, z0) to (x1, y1, z1); faces: which of the six to make
    box(x0, y0, z0, x1, y1, z1, f = {}) {
      if (f.px !== false) g.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
      if (f.nx !== false) g.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      if (f.pz !== false) g.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      if (f.nz !== false) g.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
      if (f.top !== false) g.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
      if (f.bottom) g.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
      return g;
    },
    // a tube through points with a radius each (a number, or [across, up] for an oval), smooth, ends closed by a point
    tube(pts, radii, sides = 6, o = {}) {
      const m = pts.length, base = n, T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Vector3();
      for (let i = 0; i < m; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)]; T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        A.crossVectors(Math.abs(T.y) > 0.95 ? q.set(1, 0, 0) : up, T).normalize(); B.crossVectors(T, A);
        const r = typeof radii === 'number' ? radii : (radii.length === m ? radii[i] : radii), rx = typeof r === 'number' ? r : r[0], ry = typeof r === 'number' ? r : r[1];
        const c = o.colors ? o.colors[i] : col, w = o.winds ? o.winds[i] : wind;
        for (let k = 0; k < sides; k++) { const th = k / sides * 6.2832 + (o.twist || 0); g.vert([pts[i][0] + (A.x * Math.cos(th) * rx + B.x * Math.sin(th) * ry), pts[i][1] + (A.y * Math.cos(th) * rx + B.y * Math.sin(th) * ry), pts[i][2] + (A.z * Math.cos(th) * rx + B.z * Math.sin(th) * ry)], c, w); }
      }
      for (let i = 0; i < m - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, d = b + sides; I.push(a, b, d, a, d, c); }
      if (o.cap !== false) for (const e of [0, m - 1]) { const ci = g.vert(pts[e], o.colors ? o.colors[e] : col, o.winds ? o.winds[e] : wind); for (let k = 0; k < sides; k++) { const a = base + e * sides + k, b = base + e * sides + (k + 1) % sides; if (e) I.push(a, b, ci); else I.push(b, a, ci); } }
      return g;
    },
    get count() { return n; }, get triangles() { return I.length / 3; },
    toGeometry() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('wind', new THREE.Float32BufferAttribute(W, 4));
      geo.setIndex(I); geo.computeVertexNormals(); return geo;
    },
  };
  return g;
}

// ---------------------------------------------------------------- the lit material: vertex colours, the table by place, wind
// o.leaf: kit flora geometry (uv = leaf atlas cell, wind.z = leaf mask) drawn with o.map; otherwise uv = (kind, param).
// o.mirror: the same thing drawn upside down under a water's level (a mirror image for still water); o.level: that level.
export function litMaterial(U, o = {}) {
  const uniforms = { ...U, tLeaf: { value: o.map || null }, uMirror: { value: o.mirror ? 1 : 0 }, uMirrorY: { value: o.level ?? REACH_Y }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uLow: { value: o.low ? 1 : 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: o.side ?? THREE.DoubleSide, defines: o.leaf ? { LEAF: 1 } : {},
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec4 wind;
      varying vec3 vCol, vN, vW; varying vec2 vUv; varying vec4 vWind;
      uniform float uMirror, uMirrorY;
      ${GLSL_ROW}
      void main(){
        #ifdef USE_INSTANCING
          mat4 mm = modelMatrix * instanceMatrix;
        #else
          mat4 mm = modelMatrix;
        #endif
        vec4 wp = mm * vec4(position, 1.);
        vN = normalize(mat3(mm) * normal);
        float sc = length(mm[1].xyz), g = hourGust(wp.xz);
        wp.xz += uWind.xy * (wind.x * sc * (.25 + .95 * g) * .5);
        wp.xyz += wind.y * .05 * sc * vec3(sin(uTime * 6.1 + wp.z * 2.3 + wp.y * 3.1), .5 * sin(uTime * 7.3 + wp.x * 2.9), sin(uTime * 5.3 + wp.x * 2.1 + wp.y * 2.3));
        if (uMirror > .5) { float dp = wp.y - uMirrorY; wp.y = uMirrorY - dp; wp.xz += .012 * dp * vec2(sin(uTime * 1.3 + wp.x * .9 + dp * 1.7), sin(uTime * 1.1 + wp.z * .8 + dp * 1.3)); vN.y = -vN.y; }
        vW = wp.xyz; vCol = color; vUv = uv; vWind = vec4(wind.xyz, g);
        #ifdef USE_INSTANCING_COLOR
          vCol *= instanceColor;
        #endif
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol, vN, vW; varying vec2 vUv; varying vec4 vWind;
      uniform sampler2D tLeaf; uniform float uMirror, uLow; uniform vec3 uTint;
      ${GLSL_HOURS}
      void main(){
        vec3 alb = max(vCol, vec3(0.)) * uTint, N = normalize(vN), V = normalize(cameraPosition - vW);
        float leaf = 0., ao = 1., kd = vUv.x;
        #ifdef LEAF
          leaf = clamp(vWind.z, 0., 1.);
          if (leaf > .5) { vec4 t = texture2D(tLeaf, vUv); if (t.a < .4) discard; alb *= .5 + .95 * t.r; }
          else alb *= .7 + .5 * hNoise(vec2((vW.x + vW.z) * 7., vW.y * 1.1));
          alb *= 1. + .3 * (clamp(vWind.w, 0., 1.) - .4) * leaf;
          kd = 0.;
        #else
          if (!gl_FrontFacing) N = -N;
          if (kd > .5 && kd < 1.5) alb *= .78 + .22 * smoothstep(0., .25, fract(vW.y / .14));
          else if (kd > 1.5 && kd < 2.5) { float row = floor(vW.y * 7.), u = (vW.x + vW.z * .83) * 3.1 + hHash(vec2(row, 3.)) * 9., cell = hHash(vec2(row * 7.3, floor(u))); alb *= (.72 + .45 * cell) * (.85 + .3 * hNoise(vW.xz * 9. + vW.y * 7.)) * (.5 + .5 * smoothstep(0., .22, fract(vW.y * 7.)) * smoothstep(0., .1, fract(u))); }
          else if (kd > 2.5 && kd < 3.5) { float row = floor(vW.y / .2); alb *= (.72 + .28 * smoothstep(0., .3, fract(vW.y / .2))) * (.85 + .3 * hHash(vec2(row, floor((vW.x + vW.z) * 3. + row * .5)))); }
          else if (kd > 3.5 && kd < 4.5) alb *= .75 + .45 * hNoise(vec2((vW.x + vW.z) * 9., vW.y * 1.3));
          else if (kd > 9.5) alb *= (.62 + .5 * hNoise(vW.xz * .045)) * (.8 + .4 * hNoise(vW.xz * .16 + vW.y * .1));
          else if (kd > 8.5) alb *= .7 + .6 * hNoise(vW.xz * 13. + vW.y * 9.);
          else if (kd > 7.5) alb *= .8 + .4 * hNoise(vUv.yy * 0. + vW.xz * 40.);
        #endif
        vec4 key = uRow[0], kdir = uRow[1];
        vec3 L = normalize(kdir.xyz + vec3(0., 1e-3, 0.)), c;
        if (uLow > .5) { N = normalize(vec3(0., 1., 0.) + L * .45 + N * .25); leaf *= .35; }
        if (kd > 6.5 && kd < 7.5) c = alb * vUv.y * (.85 + .15 * sin(uTime * 11. + vW.x * 7.) * sin(uTime * 17.3 + vW.z * 5.));
        else {
          c = hourShade(alb, N, vW, ao, 1. - .55 * leaf);
          float nl = dot(N, L), vl = clamp(dot(V, -L), 0., 1.);
          // leaves: light scattered inside the crown, and light through the leaf when seen against the key
          c += alb * key.rgb * (leaf * cloudShade(vW.xz)) * (.55 * (clamp((nl + .6) / 1.6, 0., 1.)) + .9 * clamp(.25 - nl * .75, 0., 1.) * (.3 + .7 * vl * vl));
          if (kd > 4.5 && kd < 5.5) c += alb * key.rgb * (.55 * clamp(-nl, 0., 1.));
          // straw takes the light through its stalks: a sheaf seen against the key glows at its edges and is never a dark figure
          if (kd > 8.5 && kd < 9.5) c += alb * key.rgb * cloudShade(vW.xz) * (.5 * clamp(-nl, 0., 1.) + .22);
          if (kd > 7.5 && kd < 8.5) { float fr = 1. - clamp(dot(N, V), 0., 1.); vec3 R = reflect(-V, N); float sp = clamp(dot(R, L), 0., 1.); sp *= sp; sp *= sp; sp *= sp; c += uRow[2].rgb * (.05 + .3 * fr * fr) + key.rgb * sp * .25 + lampLight(vW, R) * .15; }
          if (kd > 5.5 && kd < 6.5) { vec3 R = reflect(-V, N); float sp = clamp(dot(R, L), 0., 1.); sp *= sp; sp *= sp; c += (key.rgb * sp * sp + lampLight(vW, R) * 2.) * vec3(1., .82, .5); }
        }
        c = hourFog(c, vW);
        if (uMirror > .5) c = mix(c, uRow[4].rgb * .5, .35) * .8;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  return mat;
}

// ---------------------------------------------------------------- THE PAIR: one horse of true form (drawn twice, mirrored)
// The horse is built in the pair's own frame: y up from the road, 'a' = metres AHEAD of the eye (z = -a), x to the
// right of the horse's own middle. aAnim = (neck weight, strand weight [mane > 0, tail < 0], swing weight
// [leg > 0, ear < 0], phase); aPiv = the pivot of that part.
const COAT = linear('#b9b6ae'), LEATHER = [0.035, 0.026, 0.02], BRASS = linear('#c9a04a'), HOOF = [0.06, 0.055, 0.05];
const TRUNK = [
  // a (ahead), top, bottom, half width, pinch of the top (1 round, more = ridged)
  [2.84, 1.30, 1.02, 0.10, 1.0], [2.92, 1.50, 0.92, 0.22, 0.9], [3.05, 1.60, 0.86, 0.295, 0.8], [3.20, 1.635, 0.84, 0.31, 0.8],
  [3.45, 1.60, 0.86, 0.29, 0.95], [3.75, 1.565, 0.82, 0.315, 1.05], [4.05, 1.56, 0.80, 0.325, 1.1], [4.30, 1.59, 0.80, 0.30, 1.3],
  [4.50, 1.65, 0.82, 0.27, 1.75], [4.70, 1.57, 0.88, 0.255, 1.4], [4.86, 1.42, 0.96, 0.20, 1.1], [4.96, 1.28, 1.04, 0.10, 1.0],
];
const keyAt = (K, a) => {
  let i = 0; while (i < K.length - 2 && a > K[i + 1][0]) i++;
  const t = smoothstep(0, 1, clamp((a - K[i][0]) / (K[i + 1][0] - K[i][0]), 0, 1)); return K[i].map((v, j) => lerp(v, K[i + 1][j], t));
};
const NECK = { crest0: [4.5, 1.65], crest1: [5.66, 2.25], under0: [4.9, 1.02], under1: [5.55, 1.9], dock: [2.93, 1.47] };
const crestAt = (t) => [lerp(NECK.crest0[0], NECK.crest1[0], t), lerp(NECK.crest0[1], NECK.crest1[1], t) + 0.1 * Math.sin(Math.PI * Math.pow(t, 0.85))];
const underAt = (t) => [lerp(NECK.under0[0], NECK.under1[0], t), lerp(NECK.under0[1], NECK.under1[1], t) - 0.035 * Math.sin(Math.PI * t)];

export function horseGeometry(rng) {
  const P = [], C = [], UV = [], AN = [], PV = [], I = []; let n = 0;
  const vert = (x, y, a, c, an = [0, 0, 0, 0], pv = [0, 0, 0], kind = 0, par = 0) => { P.push(x, y, -a); C.push(c[0], c[1], c[2]); UV.push(kind, par); AN.push(an[0], an[1], an[2], an[3]); PV.push(pv[0], pv[1], -pv[2]); return n++; };
  const mulc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  // one ring of a loft: centre (y, a), the ring's own up axis (uy, ua) in the plane of travel, half width, up and down reach
  const SIDES = 20;
  const ring = (cy, ca, uy, ua, w, hu, hd, pinch, col, an, groove = 0) => {
    const base = n;
    for (let k = 0; k < SIDES; k++) {
      const th = k / SIDES * 6.2832, cs = Math.cos(th), sn = Math.sin(th);
      const x = w * Math.sign(cs) * Math.pow(Math.abs(cs), sn > 0 ? pinch : 1), h = (sn > 0 ? hu : hd) * sn - groove * Math.exp(-((x / 0.06) ** 2)) * Math.max(sn, 0);
      // shade baked into the coat: darker under the belly and in the groove along the spine
      const ao = 0.5 + 0.5 * smoothstep(-0.9, 0.35, sn);
      vert(x, cy + uy * h, ca + ua * h, mulc(col, ao), an);
    }
    return base;
  };
  const skin = (r0, r1) => { for (let k = 0; k < SIDES; k++) { const a = r0 + k, b = r0 + (k + 1) % SIDES, c = r1 + k, d = r1 + (k + 1) % SIDES; I.push(a, c, d, a, d, b); } };
  const cap = (r, y, a, c, an, flip) => { const ci = vert(0, y, a, c, an); for (let k = 0; k < SIDES; k++) { const p = r + k, q = r + (k + 1) % SIDES; if (flip) I.push(q, p, ci); else I.push(p, q, ci); } };
  // --- the trunk: quarters, loin, barrel, girth, withers, shoulder, chest
  let prev = -1;
  for (let i = 0; i <= 36; i++) {
    const a = lerp(2.84, 4.96, i / 36), k = keyAt(TRUNK, a), mid = k[2] + 0.56 * (k[1] - k[2]);
    const r = ring(mid, a, 1, 0, k[3], k[1] - mid, mid - k[2], k[4], COAT, [0, 0, 0, 0], a < 3.6 ? 0.03 * (1 - smoothstep(3.2, 3.6, a)) : 0);
    if (prev >= 0) skin(prev, r); else cap(r, mid, a - 0.02, mulc(COAT, 0.6), [0, 0, 0, 0], true);
    prev = r;
  }
  cap(prev, 1.16, 4.99, mulc(COAT, 0.6), [0, 0, 0, 0], false);
  // --- the neck: from the shoulders up to the poll, the crest arched
  prev = -1;
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, cr = crestAt(t), un = underAt(t), my = (cr[1] + un[1]) / 2, ma = (cr[0] + un[0]) / 2, dy = cr[1] - un[1], da = cr[0] - un[0], dl = Math.hypot(dy, da);
    const w = lerp(0.225, 0.1, Math.pow(t, 0.8)), r = ring(my, ma, dy / dl, da / dl, w, dl / 2, dl / 2, lerp(1.5, 1.2, t), COAT, [t, 0, 0, 0]);
    if (prev >= 0) skin(prev, r); prev = r;
  }
  // --- the head: poll, forehead, cheek and jaw, the nose, the muzzle
  const HEAD = [[0, 0.1, 0.165], [0.14, 0.122, 0.17], [0.3, 0.125, 0.16], [0.5, 0.098, 0.125], [0.72, 0.08, 0.095], [0.9, 0.082, 0.085], [1, 0.06, 0.06]];
  for (let i = 1; i <= 12; i++) {
    const t = i / 12, k = keyAt(HEAD, t), top = [lerp(5.66, 6.2, t), lerp(2.25, 1.82, t) + 0.025 * Math.sin(Math.PI * t)], jaw = [lerp(5.55, 6.17, t), lerp(1.9, 1.67, t) - 0.055 * Math.sin(Math.PI * Math.min(1, t * 1.6))];
    const my = (top[1] + jaw[1]) / 2, ma = (top[0] + jaw[0]) / 2, dy = top[1] - jaw[1], da = top[0] - jaw[0], dl = Math.hypot(dy, da);
    const dark = mulc(COAT, lerp(1, 0.45, smoothstep(0.6, 1, t)));
    const r = ring(my, ma, dy / dl, da / dl, k[1], dl / 2, dl / 2, 1.15, dark, [1 + 0.25 * t, 0, 0, 0]);
    skin(prev, r); prev = r;
  }
  cap(prev, 1.74, 6.22, mulc(COAT, 0.35), [1.25, 0, 0, 0], false);
  // --- the ears: cupped leaves, pricked, each on its own pivot
  for (const sx of [-1, 1]) {
    const bx = sx * 0.062, by = 2.255, ba = 5.63, ph = rng.range(0, 6.28), rows = [];
    for (let j = 0; j <= 5; j++) {
      const t = j / 5, wdt = 0.046 * Math.pow(Math.sin(Math.PI * (0.18 + 0.82 * t) * 0.985), 0.8) * (1 - 0.25 * t), row = [];
      for (const k of [-1, -0.5, 0, 0.5, 1]) {
        const cup = (1 - k * k) * wdt * 0.75;
        row.push(vert(bx + sx * (0.03 * t) + k * wdt * 0.9, by + 0.195 * t, ba + 0.07 * t - cup, mulc(COAT, lerp(0.8, 0.5, t)), [1, 0, -t, ph], [bx, by, ba]));
      }
      rows.push(row);
    }
    for (let j = 0; j < 5; j++) for (let k = 0; k < 4; k++) I.push(rows[j][k], rows[j][k + 1], rows[j + 1][k + 1], rows[j][k], rows[j + 1][k + 1], rows[j + 1][k]);
  }
  return { P, C, UV, AN, PV, I, vert, mulc, count: () => n };
}

// mane, tail, legs and harness on the horse built above; returns the finished geometry
export function finishHorse(H, rng) {
  const { P, C, UV, AN, PV, I, vert, mulc } = H;
  const HAIR = [0.62, 0.6, 0.55];
  // a flat strip through points, its width along the axis `wide`; strand weight j / (n - 1) signed by `sign`
  const strip = (pts, wide, w0, col, nw, sign, ph, piv) => {
    const m = pts.length; let base = -1;
    for (let j = 0; j < m; j++) {
      const u = j / (m - 1), hw = w0 * (1 - 0.6 * u) / 2, p = pts[j], c = mulc(col, 0.75 + 0.25 * u), an = [typeof nw === 'function' ? nw(u) : nw, sign * u, 0, ph];
      const i0 = vert(p[0] - wide[0] * hw, p[1], p[2] - wide[1] * hw, c, an, piv); vert(p[0] + wide[0] * hw, p[1], p[2] + wide[1] * hw, c, an, piv);
      if (base >= 0) I.push(base, i0, i0 + 1, base, i0 + 1, base + 1);
      base = i0;
    }
  };
  // --- the mane: 150 strands from the crest, falling to one side (the horse is mirrored so both manes fall inward)
  for (let i = 0; i < 150; i++) {
    const t = clamp((i + rng()) / 150, 0.02, 1), cr = crestAt(t), len = lerp(0.34, 0.2, t) * rng.range(0.75, 1.2), w = lerp(0.225, 0.1, Math.pow(t, 0.8)), hu = 0.5 * Math.hypot(cr[1] - underAt(t)[1], cr[0] - underAt(t)[0]);
    const pts = [], lean = rng.range(-0.02, 0.02), col = mulc(HAIR, rng.range(0.6, 1.25));
    for (let j = 0; j < 5; j++) { const u = j / 4, d = len * Math.pow(u, 1.15); pts.push([0.006 + (w + 0.014) * Math.pow(Math.min(1, d / hu), 0.62), cr[1] + 0.012 - d * 0.93, cr[0] + lean * u - 0.03 * u]); }
    strip(pts, [0, 1], rng.range(0.014, 0.024), col, t, 1, rng.range(0, 6.28), [0, cr[1], cr[0]]);
  }
  // a forelock between the ears
  for (let i = 0; i < 14; i++) {
    const x0 = rng.range(-0.035, 0.035), pts = [], len = rng.range(0.1, 0.17);
    for (let j = 0; j < 4; j++) { const u = j / 3; pts.push([x0 * (1 + u), 2.262 - 0.3 * len * u, 5.67 + len * u]); }
    strip(pts, [1, 0], 0.016, mulc(HAIR, rng.range(0.6, 1.2)), 1.05, 1, rng.range(0, 6.28), [0, 2.26, 5.67]);
  }
  // --- the tail: 150 strands from the dock, out over the quarters and down
  for (let i = 0; i < 150; i++) {
    const x0 = rng.range(-0.035, 0.035), sp = rng.range(-0.1, 0.1) + x0, L = rng.range(0.78, 1.08), back = rng.range(0.1, 0.17), pts = [], col = mulc(HAIR, rng.range(0.55, 1.3));
    for (let j = 0; j < 7; j++) { const u = j / 6; pts.push([x0 + (sp - x0) * Math.pow(u, 0.8), NECK.dock[1] + 0.03 * Math.sin(Math.PI * Math.min(1, u * 2.5)) - L * Math.pow(u, 1.45), NECK.dock[0] - back * Math.sin(Math.PI / 2 * Math.min(1, u * 2.2)) - 0.04 * u]); }
    strip(pts, [1, 0], rng.range(0.014, 0.026), col, 0, -1, rng.range(0, 6.28), [0, NECK.dock[1], NECK.dock[0]]);
  }
  // --- tubes: legs and harness
  const T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Vector3();
  const tube = (pts, radii, sides, col, an, piv = [0, 0, 0], kind = 0) => {
    const m = pts.length, base = H.count();
    for (let i = 0; i < m; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)]; T.set(b[0] - a[0], b[1] - a[1], -(b[2] - a[2])).normalize();
      A.crossVectors(Math.abs(T.y) > 0.95 ? q.set(1, 0, 0) : up, T).normalize(); B.crossVectors(T, A);
      const r = typeof radii === 'number' ? radii : (radii.length === m ? radii[i] : radii), rx = typeof r === 'number' ? r : r[0], ry = typeof r === 'number' ? r : r[1];
      for (let k = 0; k < sides; k++) { const th = k / sides * 6.2832, ox = Math.cos(th) * rx, oy = Math.sin(th) * ry; vert(pts[i][0] + A.x * ox + B.x * oy, pts[i][1] + A.y * ox + B.y * oy, pts[i][2] - (A.z * ox + B.z * oy), typeof col === 'function' ? col(i) : col, typeof an === 'function' ? an(pts[i], i) : an, piv, kind); }
    }
    for (let i = 0; i < m - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, d = b + sides; I.push(a, b, d, a, d, c); }
  };
  const legCol = (i) => (i >= 4 ? HOOF : mulc(COAT, i >= 2 ? 0.5 : 0.72));
  [[-1, 0], [1, Math.PI]].forEach(([sx, ph]) => {
    const hip = [sx * 0.2, 1.25, 3.15], sh = [sx * 0.19, 1.15, 4.76];
    tube([[sx * 0.2, 1.2, 3.12], [sx * 0.22, 0.95, 3.3], [sx * 0.2, 0.56, 2.95], [sx * 0.2, 0.14, 2.98], [sx * 0.2, 0.06, 3.02], [sx * 0.2, 0, 3.04]], [[0.16, 0.27], [0.12, 0.2], 0.075, 0.05, 0.065, 0.075], 8, legCol, (p) => [0, 0, clamp((hip[1] - p[1]) / 0.4, 0, 1), ph], hip);
    tube([[sx * 0.19, 1.1, 4.78], [sx * 0.2, 0.88, 4.66], [sx * 0.19, 0.5, 4.74], [sx * 0.19, 0.14, 4.72], [sx * 0.19, 0.06, 4.76], [sx * 0.19, 0, 4.78]], [[0.12, 0.19], [0.095, 0.14], 0.066, 0.046, 0.06, 0.07], 8, legCol, (p) => [0, 0, clamp((sh[1] - p[1]) / 0.4, 0, 1), ph + Math.PI / 2], sh);
  });
  // harness: collar with brass hames, saddle pad with two rings, back strap, breeching, bridle, reins to the rings, traces
  const arc = (a, t0, t1, lift, m = 12) => { const k = keyAt(TRUNK, a), mid = k[2] + 0.56 * (k[1] - k[2]), pts = []; for (let i = 0; i <= m; i++) { const th = lerp(t0, t1, i / m), cs = Math.cos(th), sn = Math.sin(th); pts.push([(k[3] + lift) * Math.sign(cs) * Math.pow(Math.abs(cs), sn > 0 ? k[4] : 1), mid + ((sn > 0 ? k[1] - mid : mid - k[2]) + lift) * sn, a]); } return pts; };
  const collar = []; for (let i = 0; i <= 18; i++) { const th = i / 18 * 6.2832; collar.push([0.25 * Math.sin(th), 1.3 + 0.4 * Math.cos(th), 4.74 - 0.1 * Math.cos(th)]); }
  tube(collar, [0.05, 0.06], 6, LEATHER, [0.05, 0, 0, 0]);
  for (const sx of [-1, 1]) tube([[sx * 0.05, 1.68, 4.63], [sx * 0.06, 1.8, 4.6], [sx * 0.065, 1.84, 4.59]], [0.016, 0.014, 0.02], 5, BRASS, [0.05, 0, 0, 0], [0, 0, 0], 6);
  tube(arc(4.27, -0.5, Math.PI + 0.5, 0.012), [0.04, 0.014], 5, LEATHER, [0, 0, 0, 0]);
  for (const sx of [-1, 1]) { const ringP = []; for (let i = 0; i <= 8; i++) { const th = i / 8 * 6.2832; ringP.push([sx * 0.1, 1.61 + 0.03 + 0.03 * Math.cos(th), 4.27 + 0.03 * Math.sin(th)]); } tube(ringP, 0.006, 4, BRASS, [0, 0, 0, 0], [0, 0, 0], 6); }
  const strap = []; for (let i = 0; i <= 10; i++) { const a = lerp(4.27, 2.96, i / 10); strap.push([0, keyAt(TRUNK, a)[1] + 0.008, a]); }
  tube(strap, [0.02, 0.008], 4, LEATHER, [0, 0, 0, 0]);
  tube(arc(3.22, 0.1, Math.PI - 0.1, 0.01, 8), [0.022, 0.008], 4, LEATHER, [0, 0, 0, 0]);
  const br = []; for (let i = 0; i <= 6; i++) { const a = lerp(3.4, 2.86, i / 6); br.push([-(keyAt(TRUNK, a)[3] + 0.012), 1.2, a]); }
  br.push([-0.05, 1.2, 2.822], [0.05, 1.2, 2.822]); for (let i = 6; i >= 0; i--) { const a = lerp(3.4, 2.86, i / 6); br.push([keyAt(TRUNK, a)[3] + 0.012, 1.2, a]); }
  tube(br, [0.012, 0.03], 4, LEATHER, [0, 0, 0, 0]);
  for (const sx of [-1, 1]) {
    tube([[sx * 0.27, 1.22, 4.78], [sx * 0.335, 1.12, 4.2], [sx * 0.33, 1.05, 3.5], [sx * 0.34, 0.98, 2.9], [sx * 0.36, 0.92, 2.45]], [0.01, 0.024], 4, LEATHER, [0, 0, 0, 0]);
    const rein = []; for (let i = 0; i <= 8; i++) { const t = i / 8; rein.push([sx * lerp(0.1, 0.075, t), lerp(1.66, 1.8, t) - 0.05 * Math.sin(Math.PI * t), lerp(4.27, 6.1, t)]); }
    tube(rein, [0.004, 0.011], 4, LEATHER, (p, i) => [smoothstep(0, 1, i / 8) * 1.2, 0, 0, 0]);
    tube([[sx * 0.1, 2.2, 5.69], [sx * 0.118, 2.07, 5.8], [sx * 0.09, 1.86, 6.03], [sx * 0.074, 1.78, 6.1]], [0.005, 0.012], 4, LEATHER, (p, i) => [1.05 + 0.06 * i, 0, 0, 0]);
  }
  tube([[-0.1, 2.21, 5.7], [0, 2.262, 5.68], [0.1, 2.21, 5.7]], [0.012, 0.005], 4, LEATHER, [1.05, 0, 0, 0]);
  tube([[-0.082, 1.9, 5.98], [0, 1.975, 5.99], [0.082, 1.9, 5.98], [0, 1.79, 5.94], [-0.082, 1.9, 5.98]], [0.005, 0.011], 4, LEATHER, [1.2, 0, 0, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute('aAnim', new THREE.Float32BufferAttribute(AN, 4)); geo.setAttribute('aPiv', new THREE.Float32BufferAttribute(PV, 3));
  geo.setIndex(I); geo.computeVertexNormals();
  return geo;
}

// the horse's material: solid, opaque, lit by the eye's row like every thing; the gait runs on the world clock.
// uPairK = (the dark's weight, read by the world from the table's sun at the pair's own place: nought while the sun's
// centre stands on the rim or over it, whole when the last of its disc is under; the necks' turn into a bend in radians,
// to the right positive). IN THE DARK THE PAIR IS DARK: the coat keeps COAT_DARK of its own paleness and takes the row's
// key, fill and shade plainly (no lean toward the moon), so that far sides, necks and heads are a dark shade of the hour's
// colour (COAT_HOUR of its hue is the row's fill's). THE COAT'S DARK KEEPS ITS FORM: its light is bent under a ceiling, never cut off
// at it (what the row lays on it, times ceiling / (itself + ceiling)), so the lit side and the shaded side of a quarter, a barrel or a neck
// stay apart and the two horses read as the same pale pair in the dark, not as flat cut-outs. The ceiling is ONE VALUE from the shore's
// end to the ring: COAT_NIGHT of the coat's afternoon value (a tenth: far under the third that is its law), and never over the sky's low
// band of the row; the thin rims of the afterglow and the first light stand at that ceiling and no higher.
// THE LAMPS' LIGHT ON THE PAIR IS ONE CONSTANT, the same at every metre of the road (it only shows as the row's light sinks). A
// carriage lamp is closed toward the pole and behind: it throws its light out to its own side and ahead. So of the pair only the faces
// turned outward to a lamp's own side take it (LAMP_OUT: nothing where a face is turned less than the first figure outward, whole from the
// second): A WARM EDGE down the outer quarter and flank of each horse and on the harness there, never a wash over the quarters. It is
// never brighter than LAMP_MOST of the coat's afternoon value, and it is gone LAMP_REACH metres from the flame (before the withers):
// necks, heads and the brass at the collars take none of it, glints and all; never lit from within.
const COAT_AFTERNOON = 0.55, COAT_DARK = 0.6, COAT_NIGHT = 0.1, COAT_HOUR = 0.65, LAMP_REACH = 2.3, LAMP_OUT = [0.35, 0.8], LAMP_MOST = 0.5;
// how far a rough lit face (the verge's grass, and the coat of the pair standing on it) leans toward the key of the row
const GROUND_LEAN = 0.45;
function horseMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec4 aAnim; attribute vec3 aPiv; attribute vec4 aInst;
      varying vec3 vCol, vN, vW, vL; varying vec2 vUv; varying vec3 vAn;
      uniform vec4 uPairK;
      vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
      uniform float uTime;
      void main(){
        vec3 p = position; float ph = uTime * 5.97 * aInst.y + aInst.x, hw = abs(aAnim.y), s2 = hw * hw;
        // ears flick singly; strands swing (mane with the stride, tail on its own slow beat with a switch now and then)
        if (aAnim.z < 0.) { float fl = max(sin(uTime * .9 + aAnim.w * 3. + aInst.x * 7.), 0.); fl *= fl; fl *= fl; fl *= fl; fl *= fl; vec3 e = p - aPiv; e.yz = rot(e.yz, (.8 * fl + .07 * sin(uTime * 2.3 + aAnim.w)) * -aAnim.z); p = aPiv + e; }
        if (aAnim.y > 0.) { p.x += s2 * (.022 * sin(2. * ph + aAnim.w) + .02 * sin(uTime * 1.7 + aAnim.w * 2.)); p.z += s2 * .02 * sin(2. * ph + aAnim.w * 1.7); p.y += s2 * .012 * sin(2. * ph + aAnim.w); }
        else if (aAnim.y < 0.) { float sx = max(sin(uTime * .53 + aInst.x * 9.), 0.), sx2 = sx * sx, sx4 = sx2 * sx2; float sw = .15 * sin(uTime * 1.1 + aInst.x * 4.) + .45 * sx4 * sx4 * sx2 * sin(uTime * 5.); p.x += s2 * (sw + .03 * sin(uTime * 2.1 + aAnim.w)); p.z += s2 * .035 * sin(2. * ph + aAnim.w); }
        // the neck nods twice a stride and the head turns a little, slowly; in a bend the neck turns into it by the road's curve
        float nod = (.045 * sin(2. * ph + .7) + .02 * sin(uTime * .37 + aInst.x * 3.)) * aAnim.x;
        float turn = (.05 * sin(uTime * .29 + aInst.x * 5.) + .025 * sin(uTime * .83 + aInst.x) + uPairK.y * aInst.w) * aAnim.x;
        vec3 q = p - vec3(0., 1.4, -4.6); q.yz = rot(q.yz, nod); q.xz = rot(q.xz, turn); p = vec3(0., 1.4, -4.6) + q;
        // legs swing from hip and shoulder
        if (aAnim.z > 0.) { vec3 e = p - aPiv; e.yz = rot(e.yz, .3 * sin(ph + aAnim.w) * aAnim.z); p = aPiv + e; }
        // quarters roll, shoulders answer, the whole horse rises and falls twice a stride
        float a = -p.z, rear = 1. - smoothstep(3.3, 4.1, a), fore = smoothstep(3.9, 4.6, a);
        float roll = .05 * sin(ph) * rear - .03 * sin(ph + .9) * fore, cy = p.y - 1.2, px = p.x;
        p.x += -cy * roll + .012 * sin(ph) * rear; p.y += px * roll + .012 * sin(2. * ph);
        mat4 mm = modelMatrix * instanceMatrix;
        vec4 wp = mm * vec4(p, 1.);
        vN = normalize(mat3(mm) * normal); vW = wp.xyz; vL = position; vCol = color * aInst.z; vUv = uv; vAn = aAnim.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol, vN, vW, vL; varying vec2 vUv; varying vec3 vAn;
      uniform vec4 uPairK;
      ${GLSL_HOURS}
      ${GLSL_CAST}
      // a lamp's amber on the pair, by distance from the flame: failing along the barrel, nothing from LAMP_REACH on (the withers stand
      // 2.35 m from the flames): necks and heads take none of it. pairReach: that same reach alone (for the brass's glint of the flame)
      uniform vec4 uPair;
      float pairReach(vec4 lamp, vec3 wp){ return lamp.w * (1. - smoothstep(${(LAMP_REACH * 0.55).toFixed(2)}, ${LAMP_REACH.toFixed(2)}, distance(lamp.xyz, wp))); }
      vec3 pairLamp(vec4 lamp, vec3 wp, vec3 N){ vec3 d = lamp.xyz - wp; float r2 = dot(d, d), q = r2 / 1.44;
        return ${f3(LAMP_AMBER)} * (.55 * clamp(dot(N, d) / sqrt(max(r2, 1e-4)) * .6 + .4, 0., 1.) / (1. + q * q) * pairReach(lamp, wp)); }
      float lumOf(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
      void main(){
        vec3 alb = max(vCol, vec3(0.)), N = normalize(vN), V = normalize(cameraPosition - vW);
        bool thin = abs(vAn.y) > 1e-4 || vAn.z < 0.;
        if (thin && dot(N, V) < 0.) N = -N;
        // the coat: faint dapples over quarters and barrel, the hair's own streaks on mane and tail
        if (vUv.x < .5 && !thin) alb *= .9 + .2 * smoothstep(.35, .75, hNoise(vL.xz * 9. + vL.y * 6.));
        if (abs(vAn.y) > 1e-4) alb *= mix(.8 + .4 * hNoise(vec2(vL.x * 160. + vL.z * 160., vL.y * 3.)), .9, uPairK.x);
        vec3 L = normalize(uRow[1].xyz + vec3(0., 1e-3, 0.));
        float dark = uPairK.x, rim = 1. - clamp(dot(N, V), 0., 1.); rim *= rim * rim;
        // THE COAT TAKES THE HOUR'S KEY AS THE LAND BESIDE IT DOES: by day the lit face leans toward the key by the ground's own figure
        // (GROUND_LEAN: what the grass of the verge takes), both horses alike. Under a sun two degrees up a level back would take
        // a thirtieth of the key and stand flat in the fill alone while the grass beside it glows; with the land's lean the pale
        // coat is rose gold on its sunward side and on its back. In the dark it leans to nothing.
        vec3 Nl = normalize(N + L * (${GROUND_LEAN.toFixed(2)} * (1. - dark))); float sunC = castShade(vW, L);
        vec3 c = hourShade0(alb * mix(1., ${COAT_DARK.toFixed(2)}, dark), Nl, vW, 1., sunC);
        // ITS OWN SHADE BY DAY IS LIT BY THE WHOLE SKY (the fill and the low band alike, as skyShade mixes them for the ground in the pair's
        // shade), AT EVERY HEIGHT OF THE SUN: a warm grey violet in the gold hour, never the fill's purple alone. (The lamps lay no wash
        // on the quarters by day either, so the coat's shade stands as the sky makes it.)
        { float w = (1. - clamp(dot(Nl, L), 0., 1.) * sunC) * (1. - dark) * uRow[1].a;
          vec3 sk = mix(uRow[2].rgb, uRow[6].rgb * (lumOf(uRow[2].rgb) / max(lumOf(uRow[6].rgb), 1e-4)), .5); sk = alb * mix(sk, vec3(lumOf(sk)), .4);
          c = mix(c, sk * (lumOf(c) / max(lumOf(sk), 1e-5)), clamp(w, 0., 1.)); }
        c += alb * uRow[0].rgb * (rim * (.25 + .9 * clamp(dot(L, -V) * .5 + .5, 0., 1.)) * .7 * (1. - .8 * dark));
        // the ceiling of the dark: one value (a tenth of the afternoon coat, far under its third), never over the sky's low band of the row
        float low = lumOf(uRow[6].rgb);
        float ceil0 = min(${(COAT_AFTERNOON * COAT_NIGHT).toFixed(3)}, low);
        c *= mix(1., ceil0 / (lumOf(c) + ceil0), dark);
        c = mix(c, uRow[2].rgb * (dot(c, vec3(.2126, .7152, .0722)) / max(dot(uRow[2].rgb, vec3(.2126, .7152, .0722)), 1e-4)), ${COAT_HOUR.toFixed(2)} * dark);
        // the thin pearl line of the first light along manes, ears and upper edges; the afterglow's thin rim on the sunward side;
        // with them the pair is nowhere brighter than the coat's own ceiling of the dark (so nowhere over the low band)
        c += alb * vec3(.95, .85, .76) * ((1. - uRow[1].a) * rim * clamp(N.y * .6 + .5, 0., 1.) * (thin ? .22 : .4));
        c += alb * vec3(.5, .6, .26) * (uRow[2].a * rim * clamp(dot(N, ${f3(AFTER_DIR)}) * .7 + .3, 0., 1.) * .9);
        // (the brass's glint of the row's key light, the sun's by day, lies under that same ceiling in the dark: no moon's spark on a hame)
        vec3 R = reflect(-V, N);
        if (vUv.x > 5.5) { float sp = clamp(dot(R, L), 0., 1.); sp *= sp; sp *= sp; c += uRow[0].rgb * (sp * sp * (1. - .7 * dark)) * vec3(1., .82, .5); }
        c *= mix(1., min(1., ceil0 / max(lumOf(c), 1e-4)), dark);
        // THE LAMPS' WARM EDGE (one constant): on the faces turned outward to the lamp's own side (the pair's own right hand is
        // (-uPair.w, uPair.z); a horse's outer side is the side it stands on), never over LAMP_MOST of the coat's afternoon value
        float outw = dot(N.xz, vec2(-uPair.w, uPair.z)) * sign(vL.x), most = ${(COAT_AFTERNOON * LAMP_MOST).toFixed(3)};
        vec3 lay = alb * (pairLamp(uLamp0, vW, N) + pairLamp(uLamp1, vW, N)) * smoothstep(${LAMP_OUT[0].toFixed(2)}, ${LAMP_OUT[1].toFixed(2)}, outw);
        if (vUv.x > 5.5) lay += lampLight(vW, R) * (2. * max(pairReach(uLamp0, vW), pairReach(uLamp1, vW))) * vec3(1., .82, .5);
        c += lay * min(1., most / max(lumOf(lay), 1e-4));
        gl_FragColor = vec4(hourFog(c, vW), 1.);
      }`,
  });
}

// THE PAIR AND THE CARRIAGE (declared): two pale grey horses in light harness before the dash rail of an open carriage,
// built in the frame of the road point under the eye (x right, y up from the road, -z ahead). STATION: dash rail 2.2 m
// ahead and 1.05 m under the eye, a lamp on it 0.8 m to either side; croups 3.2 m, withers 4.5 m, polls 5.7 m ahead,
// polls 0.35 m under the eye, each horse 0.5 m off the line. ONE STATE: one gait, head carriage and rhythm on the
// world clock at every place. ON THE BENDING, ROLLING ROAD the station's figures stay: the world lays the group along
// the road's own line and slope from the eye's road point on, heading by the road's bearing at the withers' place;
// the necks turn into a bend by the road's curve there (uPairK.y), the same in every bend of that curve. What it
// wears by place: the eye's row like every thing, and from the shore on a small breath and the lamps' moths.
export const STATION = { rail: 2.2, railDrop: 1.05, lamp: 0.8, croup: 3.2, withers: 4.5, poll: 5.7, pollDrop: 0.35, off: 0.5 };
export function buildPair(ctx, U, rng) {
  const group = new THREE.Group(), geo = finishHorse(horseGeometry(rng), rng), mat = horseMaterial(U);
  const inst = new THREE.InstancedMesh(geo, mat, 2), m = new THREE.Matrix4();
  const k0 = rng.range(0.965, 0.985), ph0 = rng.range(0, 6.28), ph1 = ph0 + rng.range(1.9, 4.2);
  inst.setMatrixAt(0, m.makeScale(k0, k0, k0).setPosition(-STATION.off, 0, 0));
  inst.setMatrixAt(1, m.makeScale(-1, 1, 1).setPosition(STATION.off, 0, 0));
  geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(new Float32Array([ph0, 1, 1, 1, ph1, rng.range(0.955, 0.985), rng.range(0.9, 0.96), -1]), 4));
  inst.frustumCulled = false; group.add(inst);
  // the carriage's front: a curled dash of dark leather, a brass rail on it, two lamps, the pole, the reins looped over the rail
  const g = makeGeo(), railY = EYE - STATION.railDrop, ra = STATION.rail, Z = (a) => -a;
  const prof = [[ra - 0.2, railY - 0.75], [ra - 0.13, railY - 0.5], [ra - 0.07, railY - 0.27], [ra - 0.02, railY - 0.11], [ra + 0.03, railY - 0.03], [ra + 0.1, railY], [ra + 0.16, railY - 0.012]];
  g.col([0.03, 0.026, 0.03]).kind(8);
  for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < 6; k++) {
    const x0 = -0.95 + k * 1.9 / 6, x1 = x0 + 1.9 / 6, e = (x) => 0.04 * (x * x) / 0.9;
    g.quad([x0, prof[i][1] - e(x0), Z(prof[i][0])], [x1, prof[i][1] - e(x1), Z(prof[i][0])], [x1, prof[i + 1][1] - e(x1), Z(prof[i + 1][0])], [x0, prof[i + 1][1] - e(x0), Z(prof[i + 1][0])]);
  }
  g.col(BRASS).kind(6);
  const rail = []; for (let k = 0; k <= 10; k++) { const x = -0.93 + k * 0.186; rail.push([x, railY + 0.065 - 0.04 * x * x / 0.9, Z(ra + 0.1)]); }
  g.tube(rail, 0.013, 6);
  for (const x of [-0.9, -0.45, 0, 0.45, 0.9]) g.tube([[x, railY - 0.02 - 0.04 * x * x / 0.9, Z(ra + 0.1)], [x, railY + 0.065 - 0.04 * x * x / 0.9, Z(ra + 0.1)]], 0.009, 5);
  const lamps = [];
  for (const sx of [-1, 1]) {
    const lx = sx * STATION.lamp, ly = railY + 0.2, lz = Z(ra + 0.02);
    g.col(BRASS).kind(6);
    g.tube([[sx * 0.9, railY - 0.2, Z(ra - 0.03)], [sx * 0.93, railY, Z(ra)], [lx, ly - 0.1, lz]], 0.011, 5);
    g.box(lx - 0.055, ly - 0.1, lz - 0.055, lx + 0.055, ly - 0.075, lz + 0.055, { bottom: true });
    g.box(lx - 0.06, ly + 0.075, lz - 0.06, lx + 0.06, ly + 0.095, lz + 0.06, { bottom: true });
    g.tube([[lx, ly + 0.095, lz], [lx, ly + 0.14, lz], [lx, ly + 0.17, lz]], [0.045, 0.022, 0.026], 6);
    for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.tube([[lx + ax * 0.05, ly - 0.075, lz + az * 0.05], [lx + ax * 0.05, ly + 0.075, lz + az * 0.05]], 0.006, 4);
    // glass panes that glow, and the flame itself
    g.col(LAMP_AMBER).kind(7, 0.75); g.box(lx - 0.047, ly - 0.075, lz - 0.047, lx + 0.047, ly + 0.075, lz + 0.047, { top: false });
    g.kind(7, 4.5); g.tube([[lx, ly - 0.05, lz], [lx, ly - 0.02, lz], [lx, ly + 0.035, lz]], [0.012, 0.016, 0.003], 5);
    lamps.push(new THREE.Vector3(lx, ly, lz));
  }
  g.col([0.2, 0.13, 0.07]).kind(4); g.tube([[0, 0.95, Z(2.3)], [0, 1.0, Z(3.8)], [0, 1.06, Z(5.02)]], 0.035, 6);
  g.tube([[-0.42, 1.08, Z(4.98)], [0, 1.07, Z(5.0)], [0.42, 1.08, Z(4.98)]], 0.025, 5);
  // the reins: from the two rings on each saddle pad back to the rail, over it, and down in one loop (no hand holds them)
  g.col(LEATHER).kind(0);
  for (const hx of [-1, 1]) for (const tx of [-1, 1]) {
    const x0 = hx * STATION.off + tx * 0.1, x1 = hx * 0.13, pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([lerp(x0, x1, t * t), lerp(1.67, railY + 0.085, t) - 0.07 * Math.sin(Math.PI * t), Z(lerp(4.27, ra + 0.1, t))]); }
    g.tube(pts, [0.011, 0.004], 4, { winds: pts.map((p, i) => [0, 0.5 * Math.sin(Math.PI * i / 8), 0, 0]) });
  }
  const loop = []; for (let i = 0; i <= 10; i++) { const t = i / 10, x = lerp(-0.13, 0.13, t); loop.push([x, railY + 0.085 - 0.26 * Math.sin(Math.PI * t) * (1 - 0.3 * Math.sin(Math.PI * t)) - 0.02, Z(ra + 0.1 - 0.1 * Math.sin(Math.PI * t))]); }
  g.tube(loop, [0.011, 0.004], 4, { winds: loop.map((p, i) => [0, 0.6 * Math.sin(Math.PI * i / 10), 0, 0]) });
  const car = new THREE.Mesh(g.toGeometry(), litMaterial(U)); car.frustumCulled = false; group.add(car);
  // what the pair wears from the shore on (uDew: read by the world from the table's dew figure at the pair's own place): moths turning in each lamp's light, a small breath at each muzzle; every phase and rate from the pair's stream
  // THE MOTHS ARE DEALT ALIKE ON EVERY VISIT: nine to a lamp from the pair's stream, then the breath's phases, then, from a fork taken after the
  // stream's last draw, three more to a lamp (what a visit of the greatest density shows over nine). The visit's density only decides how
  // many of each lamp's dealt moths are SHOWN (four at the least); it deals nothing anew.
  const MOTHS = 9, MORE = 3, NM = clamp(Math.round(MOTHS * ((ctx.vary && ctx.vary.density) ?? 1)), 4, MOTHS + MORE), moths = [[], []], breath = [];
  const moth = (r) => [0, r(), r.range(0.14, 0.45), r.range(2.2, 5) * (r() < 0.5 ? -1 : 1)];
  for (let i = 0; i < MOTHS * 2; i++) moths[i < MOTHS ? 0 : 1].push(moth(rng));
  const bph = [rng(), rng()], brt = [rng.range(0.94, 1.06), rng.range(0.94, 1.06)];
  for (let i = 0; i < 6; i++) { const h = i < 3 ? 0 : 1; breath.push([1, (i % 3) / 3 + bph[h] + rng.range(-0.05, 0.05), 1, brt[h]]); }
  const rMore = rng.fork('moths'); for (let i = 0; i < MORE * 2; i++) moths[i < MORE ? 0 : 1].push(moth(rMore));
  const wn = NM * 2 + 6, wA = new Float32Array(wn * 4), wC = new Float32Array(wn * 3);
  for (let i = 0; i < NM * 2; i++) { const h = i < NM ? 0 : 1, l = lamps[h]; wA.set(moths[h][i - h * NM], i * 4); wC.set([l.x, l.y + 0.02, l.z], i * 3); }
  for (let i = 0; i < 6; i++) { const sx = i < 3 ? -1 : 1; wA.set(breath[i], (NM * 2 + i) * 4); wC.set([sx * STATION.off, 1.73, -6.24], (NM * 2 + i) * 3); }
  const wg = new THREE.InstancedBufferGeometry(), quad = new THREE.PlaneGeometry(2, 2); wg.index = quad.index; wg.setAttribute('position', quad.attributes.position);
  wg.setAttribute('aW', new THREE.InstancedBufferAttribute(wA, 4)); wg.setAttribute('aC', new THREE.InstancedBufferAttribute(wC, 3)); wg.instanceCount = wn;
  const uDew = { value: 0 };
  const wear = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: { ...U, uDew }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aW; attribute vec3 aC; uniform float uDew; varying vec2 vUv; varying vec3 vK;
      ${GLSL_ROW}
      void main(){
        vUv = position.xy; vec3 p; float show = uDew;
        if (aW.x < .5) {
          // a moth: round its lamp on its own small way, wings beating
          float th = uTime * aW.w + aW.y * 6.2832, r = aW.z * (.75 + .25 * sin(uTime * 1.3 + aW.y * 9.)), sz = .019 * show;
          vec3 rad = vec3(cos(th), 0., sin(th)), fwd = vec3(-sin(th), 0., cos(th)) * sign(aW.w);
          float fl = .95 * sin(uTime * 52. + aW.y * 30.);
          p = aC + rad * r + vec3(0., .1 * sin(uTime * 2.1 + aW.y * 20.) + .03, 0.) + rad * (position.x * cos(fl) * sz) + vec3(0., abs(position.x) * sin(fl) * sz, 0.) + fwd * (position.y * sz * .7);
          vK = vec3(0., 1., 0.); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
        } else {
          // a breath: let go at the muzzle, left behind by the pair, widening and thinning
          float t = fract(uTime * .62 * aW.w + aW.y), sz = mix(.05, .3, t);
          p = aC + vec3(.05 * sin(aW.y * 40.), .1 * t - .05, .1 + 1.1 * t);
          vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.); mv.xy += position.xy * sz;
          vK = vec3(1., (1. - t) * (1. - t) * smoothstep(0., .12, t) * show, 0.); gl_Position = projectionMatrix * mv;
        }
      }`,
    fragmentShader: /* glsl */`varying vec2 vUv; varying vec3 vK;
      void main(){
        if (vK.x < .5) { float e = length(vUv * vec2(1., 1.25)); if (e > 1.) discard; gl_FragColor = vec4(vec3(.95, .88, .72) * (.55 + .45 * (1. - e)), 1.); }
        else { float a = (1. - smoothstep(.2, 1., length(vUv))) * vK.y * .3; gl_FragColor = vec4(vec3(.62, .64, .7) + ${f3(LAMP_AMBER)} * .12, a); }
      }` }));
  wear.frustumCulled = false; wear.renderOrder = 6; group.add(wear);
  return { object: group, horses: inst, carriage: car, lamps, station: STATION, uDew, triangles: geo.index.count / 3 * 2 + g.triangles + wn * 2 };
}

// ---------------------------------------------------------------- THE WHEAT (the hero; declared at the head)
// Rows run beside the road's line, row behind row, over the rolling ground. Each row is a standing strip of stalks
// and ears: it leans 10 to 20 degrees toward the nearest point of the road's line (a fixed figure of its own place;
// less where its foot's distance leaves less room: rule a of makeWheat)
// and the ears' broad faces lie in the row's own plane, so square to that line. The wind's long waves dip the tops
// along the wind only. From 8 m off the rows wander a little and are seen as lines of ragged tufts of differing
// heights (handed over by the pixel's footprint in the shader), never as a straight toothed sheet.
export const WHEAT = { first: 2.4, last: 44, stalk: 1.1, ear: 0.1, clear: 2.0, side: 1.7 };
export function wheatColours(mood = 0.5) {
  const mixc = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  return { ear: mixc('#f2d688', '#f0b848', mood), straw: mixc('#dcb850', '#d08e2c', mood), shade: mixc('#7a5a1c', '#6e4414', mood) };
}
const rowOffsets = () => { const d = []; let x = WHEAT.first; while (x < 8) { d.push(x); x += 0.32; } while (x < 16) { d.push(x); x += 0.5; } while (x < 28) { d.push(x); x += 0.9; } while (x <= WHEAT.last) { d.push(x); x += 1.6; } return d; };
export function wheatUniforms(U, cols) {
  return { ...U, uEar: { value: cols.ear }, uStraw: { value: cols.straw }, uShadeC: { value: cols.shade } };
}
// o: { from, to (metres of road), valid(x, z, s, d) -> bool, heightAt(x, z), rng, chunk (m), yield (the builder's own, asked every 8 rows) }
// TWO RULES OF EVERY STALK'S OWN PLACE, fixed at build, the same for every row and every block (they draw nothing of the stream: every figure
// the stream deals is dealt at its station in the stream's order):
// (a) CLEAR AIR OVER THE ROAD: no ear comes nearer the road's line than WHEAT.clear metres, lean, wind and all. A stalk leans toward the
//     road by its row's own figure, but no further than its foot's distance leaves it; what room is left to its tip is all the wind may
//     take of it toward the road (the vertex shader holds that room).
// (b) A BLOCK OF STANDING WHEAT ENDS IN A RAGGED EDGE: at both ends of every run of a row the top falls away over the last station or the
//     last two, to a third or a half of the row's height, each end by the row's own hash; a row that stands at a block's side (open ground
//     within WHEAT.side metres on either hand) stands at lesser heights, each station its own, and past the first 8 m from the road (where
//     the rows wander) in tufts with gaps (about a third of its length): the rows of a block's last metres fall away into the open
//     ground each in its own way.
const hash2 = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
const noise1 = (t, k) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return lerp(hash2(i, k), hash2(i + 1, k), u); };
export async function makeWheat(road, WU, o) {
  const offs = rowOffsets(), step = 2, group = new THREE.Group(), q = [0, 0, 0], chunk = o.chunk || 20, parts = new Map();
  const part = (s) => { const k = Math.floor((s - o.from) / chunk); if (!parts.has(k)) parts.set(k, { P: [], R: [], Lv: [], I: [], n: 0 }); return parts.get(k); };
  let rowN = 0;
  for (const side of [-1, 1]) for (const d of offs) {
    if (o.yield && (++rowN % 8) === 0) await o.yield();
    const seed = o.rng(), hRow = (WHEAT.stalk + WHEAT.ear * 0.5) * o.rng.range(0.94, 1.06) * (d > 8 ? o.rng.range(0.9, 1.12) : 1), leanRow = o.rng.range(11.5, 18.5);
    // the row's own wander beside the road (nothing in the first 8 m, up to a third of the rows' spacing further out)
    const wa = d > 8 ? Math.min(0.55, (d - 8) * 0.06) : 0, wp1 = o.rng() * 6.283, wp2 = o.rng() * 6.283, wk1 = o.rng.range(0.05, 0.09), wk2 = o.rng.range(0.13, 0.21);
    // the row's stations, with every draw of the stream
    const st = [];
    for (let s = o.from; s <= o.to + 1e-6; s += step) {
      const jit = (o.rng() - 0.5) * 0.12 + wa * (Math.sin(s * wk1 + wp1) + 0.6 * Math.sin(s * wk2 + wp2)), dd = side * (d + jit); road.at(s, dd, q);
      const x = q[0], z = q[1], b = q[2];
      if (!o.valid(x, z, s, dd)) { st.push(null); continue; }
      st.push({ s, x, z, b, dd, lean: clamp(leanRow + 2.5 * (o.rng() - 0.5), 10, 20) * RAD, hh: hRow * (0.95 + 0.1 * o.rng()) });
    }
    // (b) at a block's side: tufts with gaps, at lesser heights
    for (let i = 0; i < st.length; i++) { const t = st[i]; if (!t) continue;
      road.at(t.s, t.dd + side * WHEAT.side, q); let open = !o.valid(q[0], q[1], t.s, t.dd + side * WHEAT.side);
      if (!open) { road.at(t.s, t.dd - side * WHEAT.side, q); open = !o.valid(q[0], q[1], t.s, t.dd - side * WHEAT.side); }
      if (open) { if (d > 8 && noise1(t.s / 5.5 + seed * 97, 3.1) < 0.36) st[i] = null; else t.hh *= 0.62 + 0.38 * hash2(seed * 51.7, i); } }
    // (b) every run's two ends: the top falls away over the last station, or over the last two, each by the row's own hash
    for (let a = 0; a < st.length; a++) { if (!st[a]) continue; let b = a; while (b + 1 < st.length && st[b + 1]) b++;
      if (b > a) { st[a].hh *= 0.3 + 0.3 * hash2(seed * 7.7, a); st[b].hh *= 0.3 + 0.3 * hash2(seed * 3.3, b); }
      if (b - a >= 4) { st[a + 1].hh *= 0.6 + 0.4 * hash2(seed * 13.1, a); st[b - 1].hh *= 0.6 + 0.4 * hash2(seed * 29.3, b); }
      a = b; }
    let prev = null, len = 0;
    for (const t of st) {
      if (!t) { prev = null; continue; }
      const { s, x, z, b, hh } = t, A = prev ? prev.A : part(s), tx = -side * Math.cos(b), tz = -side * Math.sin(b), y = o.heightAt(x, z);
      // (a) the lean its foot's distance leaves it, and the room left to its tip
      const reach = Math.abs(t.dd) - WHEAT.clear - 0.02, lean = Math.min(t.lean, Math.asin(clamp(reach / hh, Math.sin(2 * RAD), 1))), room = Math.max(0, reach - hh * Math.sin(lean));
      const dl = prev ? Math.hypot(x - prev.x, z - prev.z) : 0; len += dl;
      const i0 = A.n; A.n += 2;
      A.P.push(x, y, z, x, y, z); A.R.push(len, 0, seed, hh, len, 1, seed, hh); A.Lv.push(tx * lean, tz * lean, room, tx * lean, tz * lean, room);
      if (prev) A.I.push(prev.i, i0, i0 + 1, prev.i, i0 + 1, prev.i + 1);
      prev = { i: i0, x, z, s, A };
      // a chunk's last station is drawn again as the next chunk's first, so the row has no gap
      const B = part(s); if (B !== A) { const j0 = B.n; B.n += 2; B.P.push(x, y, z, x, y, z); B.R.push(len, 0, seed, hh, len, 1, seed, hh); B.Lv.push(tx * lean, tz * lean, room, tx * lean, tz * lean, room); prev = { i: j0, x, z, s, A: B }; }
    }
  }
  const mat = wheatMaterial(WU); let tris = 0;
  for (const A of parts.values()) {
    if (!A.I.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(A.P, 3)); geo.setAttribute('aRow', new THREE.Float32BufferAttribute(A.R, 4)); geo.setAttribute('aLean', new THREE.Float32BufferAttribute(A.Lv, 3));
    geo.setIndex(A.I); geo.computeBoundingSphere(); geo.boundingSphere.radius += 2;
    group.add(new THREE.Mesh(geo, mat)); tris += A.I.length / 3;
  }
  return { object: group, material: mat, triangles: tris };
}

function wheatMaterial(WU) {
  return new THREE.ShaderMaterial({
    uniforms: WU, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aRow; attribute vec3 aLean;
      varying vec2 vUv; varying vec3 vW, vN; varying vec4 vRow;
      ${GLSL_ROW}
      void main(){
        vec3 p = position; float ang = length(aLean.xy), g = hourGust(p.xz), dip = .26 * g * g;
        vec2 toRoad = aLean.xy / max(ang, 1e-4);
        // the stalk's own lean toward the road's line, and the wind's dip along the wind. THE WIND NEVER CARRIES A TIP INTO THE ROAD'S CLEAR
        // AIR: what of its push goes toward the road's line beyond the stalk's own room (aLean.z metres, a figure of its place) is left out
        vec3 tip = vec3(toRoad.x * sin(ang), cos(ang), toRoad.y * sin(ang));
        vec2 push = uWind.xy * sin(dip); push -= toRoad * max(dot(push, toRoad) - aLean.z / max(aRow.w, .1), 0.);
        tip.xz += push; tip.y -= 1. - cos(dip);
        p += tip * (aRow.w * aRow.y);
        p.xz += aRow.y * .012 * vec2(sin(uTime * 3.1 + aRow.x * 2.), cos(uTime * 2.7 + aRow.x * 1.7));
        vec4 wp = modelMatrix * vec4(p, 1.);
        vW = wp.xyz; vUv = aRow.xy; vRow = vec4(aRow.z, aRow.w, g, 0.); vN = normalize(vec3(toRoad.x, .4, toRoad.y));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW, vN; varying vec4 vRow;
      uniform vec3 uEar, uStraw, uShadeC;
      ${GLSL_HOURS}
      ${GLSL_PAIRSHADE}
      ${GLSL_CAST}
      // a row seen from afar is a line of TUFTS: each its own height and width, the top falling away between them
      float tuftTop(float x, float w, float seed){ float i = floor(x / w), f = abs(fract(x / w) - .5), h = hHash(vec2(i, seed)), wd = .26 + .2 * hHash(vec2(i * 1.7 + 5., seed));
        return (.7 + .3 * h) * (1. - (.3 + .25 * hHash(vec2(i * 3.1, seed + 9.))) * smoothstep(wd * .35, .5, f)); }
      void main(){
        float x = vUv.x, y = vUv.y, H = vRow.y, fw = fwidth(x), cw = .045;
        float ci = floor(x / cw), fx = fract(x / cw) - .5, h1 = hHash(vec2(ci, vRow.x * 91.)), h2 = hHash(vec2(ci * 1.7 + 3., vRow.x * 57.));
        float topY = .9 + .1 * h1, earLen = .1 / max(H, .2) * (.9 + .25 * h2), earY0 = topY - earLen;
        float dx = abs(fx - (h2 - .5) * .3) * cw, ey = clamp((y - earY0) / earLen, 0., 1.);
        // near: each stalk and its ear (the ear's broad face lies in the row's plane); far: the row as one mass with a ragged top
        float earW = .012 * sqrt(clamp(sin(3.1416 * (.08 + .9 * ey)), 0., 1.));
        float stem = step(dx, .005) * step(y, earY0 + .01), ear = step(dx, earW) * step(earY0, y) * step(y, topY);
        float awn = step(dx, earW + .012 * ey) * step(earY0 + earLen * .2, y) * step(y, topY + .035) * step(hHash(vec2(ci * 1.3 + vRow.x * 17., floor(y * 220.))), .4);
        float nearA = max(max(stem, ear), awn);
        // far: columns of stalks twice as wide at each doubling of the pixel's footprint, each with its own top
        float lf = max(log2(max(fw, 1e-5) / (cw * .6)), 0.), l0 = floor(lf), w0 = cw * exp2(l0), w1 = w0 * 2.;
        float c0 = hNoise(vec2(x / w0 * .7, vRow.x * 71. + l0)), c1 = hNoise(vec2(x / w1 * .7, vRow.x * 71. + l0 + 1.)), colK = mix(c0, c1, fract(lf));
        float tw0 = w0 * 7., tw1 = w1 * 7., tf = mix(tuftTop(x, tw0, vRow.x * 31. + l0), tuftTop(x, tw1, vRow.x * 31. + l0 + 1.), fract(lf));
        float farTop = (.86 + .1 * colK) * tf * (.9 + .1 * hNoise(vec2(x * .9 + vRow.x * 40., vRow.x * 9.)));
        float farA = step(y, farTop);
        float t = smoothstep(cw * .25, cw * .7, fw);
        if (mix(nearA, farA, t) < .5) discard;
        h1 = mix(h1, colK, t);
        float inEar = mix(smoothstep(earY0 - .02, earY0 + .02, y), smoothstep(farTop - .16, farTop - .08, y), t);
        vec3 alb = mix(mix(uShadeC * .7, uStraw, smoothstep(.0, .8, y)) * (.8 + .4 * h2 * (1. - t) + .4 * colK * t), uEar * (.8 + .4 * h1), inEar);
        alb = mix(alb, uEar * 1.2, .5 * vRow.z * vRow.z * smoothstep(.45, 1., y));
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        if (dot(N, V) < 0.) N.xz = -N.xz;
        vec4 key = uRow[0], kdir = uRow[1], fill = uRow[2], shd = uRow[3];
        vec3 L = normalize(kdir.xyz + vec3(0., 1e-3, 0.));
        float nl = dot(N, L), vl = clamp(dot(V, -L), 0., 1.), sh = pairShade(vW, L) * cloudShade(vW.xz) * castShade(vW, L);
        // deep between the rows the light does not reach: the lower the darker
        float depth = smoothstep(0., .75, y), lit = (.25 + .75 * clamp((nl + .5) / 1.5, 0., 1.)) + .7 * clamp(.3 - nl, 0., 1.) * (.3 + .7 * vl * vl) * inEar;
        alb *= .86 + .28 * hNoise(vW.xz * 9. + vW.y * 5.);
        vec3 c = alb * (key.rgb * lit * sh * (.38 + .62 * depth) + mix(shd.rgb, fill.rgb, .5 + .5 * depth) * (.6 + .4 * depth));
        // awns catch a low key as fine bright hairs
        c += key.rgb * uEar * (inEar * step(.9, hHash(vec2(ci * 3.1, floor(y * 90.)))) * (.25 + .75 * vl) * .5 * sh);
        c += alb * lampLight(vW, N) + alb * firstLight(N) * (inEar * .9);
        gl_FragColor = vec4(hourFog(c, vW), 1.);
      }`,
  });
}

// GLSL: the shade the pair and the carriage throw (five soft bodies in the pair's own frame; horses and carriage
// only). 1 = lit. uPair = (x, z of the road point under the eye, the heading's x and z).
export const GLSL_PAIRSHADE = /* glsl */`
uniform vec4 uPair;
float pairBody(vec3 o, vec3 d, vec3 c, vec3 r){ vec3 oc = (o - c) / r, dd = d / r; float b = dot(oc, dd), a = max(dot(dd, dd), 1e-5), c0 = dot(oc, oc) - 1.;
  float h = (b * b - a * c0) / a; return 1. - .85 * smoothstep(0., .55, h) * max(step(b, 0.), step(c0, 0.)); }
float pairShade(vec3 wp, vec3 L){
  vec2 e = wp.xz - uPair.xy, f = uPair.zw, r = vec2(-f.y, f.x);
  vec3 o = vec3(dot(e, r), wp.y, dot(e, f)), d = vec3(dot(L.xz, r), L.y, dot(L.xz, f));
  if (dot(e, e) > 3600.) return 1.;
  float s = pairBody(o, d, vec3(-.5, 1.2, 3.9), vec3(.33, .48, 1.15)) * pairBody(o, d, vec3(.5, 1.2, 3.9), vec3(.33, .48, 1.15));
  s *= pairBody(o, d, vec3(-.5, 1.75, 5.3), vec3(.15, .33, .6)) * pairBody(o, d, vec3(.5, 1.75, 5.3), vec3(.15, .33, .6));
  return s * pairBody(o, d, vec3(0., 1., .3), vec3(.95, .75, 1.7));
}`;
// what the ground shader needs beside the shared uniforms
export function groundUniforms(WU, road, o = {}) {
  return { ...WU, uSegA: { value: road.segA }, uSegB: { value: road.segB }, uRing: { value: new THREE.Vector4(0, 1e5, 4.5, 0) },
    uPuddle: { value: new THREE.Vector2(o.puddleSeed ?? 0.37, 20) }, uShoreS: { value: o.shoreS ?? 1e5 },
    // the school's yard: (its fence's first and last metre of road, the fence's metres from the line, how deep the yard lies); the path from its gate
    // to the porch (two points); where feet have worn it bare (x, z, radius, how bare)
    uYard: { value: new THREE.Vector4(1e5, 1e5, 3.5, 40) }, uPath: { value: new THREE.Vector4(0, 1e5, 0, 1e5) }, uWorn: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 1e5, 1, 0)) } };
}

// THE GROUND: road (pale dirt 3.6 m wide, two ruts 1.5 m apart, a grass strip down the middle), verge, meadow, the
// wheat's floor and its far surface (rows, heads and wind bands by the same lean rule), the reaped strip's stubble in
// rows, the rough wet meadow, the dewed shoulders of the last road, puddles that hold the sky of the eye's hour (and
// its stars), dew where the table's standing figure puts it, the long shade of great things and contact shade at
// their feet. aZone = (wheat, reaped, rough wet ground, which water lies below: 0 the reach, 1 the flood; 4 more on dry land, where nothing is cut).
export function groundMaterial(GU, road) {
  return new THREE.ShaderMaterial({
    uniforms: GU, defines: { NSEG: road.n },
    vertexShader: /* glsl */`
      attribute vec4 aZone; varying vec3 vW, vN; varying vec4 vZone;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vZone = aZone; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec4 vZone;
      uniform vec3 uEar, uStraw, uShadeC; uniform vec4 uRing, uYard, uPath, uWorn[4]; uniform vec2 uPuddle;
      ${GLSL_HOURS}
      ${GLSL_ROAD}
      ${GLSL_PAIRSHADE}
      ${GLSL_CAST}
      uniform float uShoreS;
      // THE FORM OF WORKED GROUND AND OF THE FLANK'S TURF IS IN THE SKIN'S OWN HEIGHT: a height field of the place (world metres; the mesh's 2 m grid
      // cannot carry it), whose slope takes the key and whose crests and humps throw their shade away from the key by its height.
      // Whatever of it is finer than the pixel's footprint gives way to its mean (keep).
      // The hollows: the twin of the part's hollowAt.
      float hollowF(vec2 p){ return sin(p.x * .21 + uBankPh.z) * sin(p.y * .17 + uBankPh.w) + .45 * sin(p.x * .083 - p.y * .11 + uBankPh.z * 1.7); }
      // one size of furrow across the rows: lam metres from crest to crest, amp metres high, u metres across the rows; el = (the key's rise for
      // each metre across the rows, the side it comes from); cap = the most of a furrow its crest may shade. Adds the slope to g; returns the lit share.
      float furrow(float u, float lam, float amp, vec2 el, float cap, float keep, inout float g){
        float ph = u / lam; g -= amp * 6.2832 / lam * sin(6.2832 * ph) * keep;
        float f = clamp(2. * amp / (lam * max(el.x, 1e-3)), 0., cap), q = fract(el.y > 0. ? -ph : ph);
        return 1. - mix(f * .9, (1. - smoothstep(f - .07, f + .07, q)) * smoothstep(0., .07, q), keep);
      }
      // THE SHORE'S LEFT GROUND (the flank from the wheat's end down to the wet meadow): turf in low hummocks and hollows as broad as they
      // are long: a height field of the place in two sizes (4.6 m and 1.9 m, half a metre from hollow to top), nothing in it long in any
      // direction. Returns (the height's slope, the height 0..1, the lit share: a hummock's shade lies away from the key by its height).
      float humH(vec2 p){ return hNoise(p / 4.6 + 7.3) * .65 + hNoise(p / 1.9 + 31.7) * .35; }
      vec4 hummocks(vec2 p, vec3 L){
        const float A = .5, e = .35; float h = humH(p), lh = max(length(L.xz), 1e-3), rise = L.y / lh; vec2 Lh = L.xz / lh;
        vec2 gr = vec2(humH(p + vec2(e, 0.)) - humH(p - vec2(e, 0.)), humH(p + vec2(0., e)) - humH(p - vec2(0., e))) * (A / (2. * e));
        float sh = max((humH(p + Lh * 1.1) - h) * A - rise * 1.1, (humH(p + Lh * 2.4) - h) * A - rise * 2.4);
        return vec4(gr, h, 1. - .7 * smoothstep(-.02, .2, sh));
      }
      // what a level pool shows: the sky of the eye's row along the mirrored look, with the sun's disc, the afterglow, the moon and the first light
      vec3 poolSky(vec3 R){
        float sunH = uRow[0].a, veil = uRow[1].a, night = 1. - veil, bd = degrees(atan(R.x, -R.z + 1e-7)), eD = degrees(asin(clamp(R.y, 0., 1.)));
        vec3 c = mix(uRow[6].rgb, uRow[5].rgb, pow(clamp(R.y, 1e-4, 1.), .42)), sd = vec3(${Math.sin(SUN_BEARING * RAD).toFixed(5)} * cos(sunH), sin(sunH), ${(-Math.cos(SUN_BEARING * RAD)).toFixed(5)} * cos(sunH));
        float cs = clamp(dot(R, sd), 0., 1.), cs8 = pow(cs, 8.);
        c += uRow[7].rgb * (.05 * pow(cs8, 6.) + .02 * cs8) * veil; c = mix(c, uRow[7].rgb, smoothstep(.99855, .99875, cs));
        c += vec3(.5, .62, .26) * (smoothstep(${AFTERGLOW.from}., ${AFTERGLOW.peak}., bd) * (1. - smoothstep(${AFTERGLOW.peak + 1}., ${AFTERGLOW.to}., bd)) * exp(-radians(eD) * 9.) * uRow[2].a * .9);
        float cm = clamp(dot(R, ${f3(bearingDir(MOON.bearing, MOON.up))}), 0., 1.);
        c += vec3(.5, .6, .8) * (.1 * pow(cm, 256.) + .1 * pow(cm, 16.) + .05 * cm * cm * cm) * night; c = mix(c, vec3(.9, .94, 1.) * .95, smoothstep(.99863, .99883, cm) * night);
        float rel = abs(mod(bd - (${FIRST.bearing}.) + 540., 360.) - 180.), up = clamp(eD / ${FIRST.top}., 0., 1.);
        c += mix(vec3(.98, .74, .34), vec3(.94, .84, .76), smoothstep(2.6, 10.5, eD)) * ((1. - smoothstep(${FIRST.full}., ${FIRST.none}., rel)) * (1. - up) * sqrt(1. - up) * (.45 + .55 * (1. - smoothstep(0., 11., eD))) * .88 * night);
        return c;
      }
      void main(){
        float dry = step(2., vZone.w), level = mix(uLast.w, uLast.z, clamp(vZone.w - 4. * dry, 0., 1.));
        if (dry < .5 && vW.y < level - .03) discard;
        vec4 sd = roadSD(vW.xz); float s = sd.x, d = sd.y, ad = abs(d), sH = hourS(vW.xz), px = fwidth(ad), dew = standDew(sH);
        float n1 = hNoise(vW.xz * .23), n2 = hNoise(vW.xz * 2.1), n3 = hNoise(vW.xz * 9.), n4 = hNoise(vW.xz * 31.);
        vec3 L = normalize(uRow[1].xyz + vec3(0., 1e-3, 0.)), N = normalize(vN);
        // THE SHORE BETWEEN THE FLANK AND THE WET MEADOW, left of the road: a line of the place that wanders (the twin of the part's
        // shoreEdge, with a finer wander of its own), the flank's turf on its near side and the meadow's rough ground beyond it
        float left = step(d, 0.), edgeS = uShoreS - 2. + smoothstep(4., 14., ad) * (7. + 7. * bankWob(ad * .19 + uBankPh.w)) + 5. * (n1 - .5);
        float shoreK = smoothstep(-5., 5., s - edgeS), stubW = vZone.y * (1. - left * shoreK), roughW = vZone.z * mix(1., shoreK, left), rim = 4. * shoreK * (1. - shoreK) * left * vZone.y;
        // (left of the road the zone is the flank's turf, right of it the reaped strip's stubble in rows)
        float flankW = stubW * left, stubR = stubW - flankW;
        // the pixel's footprint: across the stubble's rows, and on the ground
        float ru = vW.x * .8 + vW.z * .6, fu = fwidth(ru), fg = length(fwidth(vW.xz));
        // standing water: in the hollows of the flank (level ground only, 7 m and more from the line), and in the shore's wet rim
        float hol = hollowF(vW.xz) + .05 * (n2 - .5), lvl = smoothstep(.988, .996, N.y) * smoothstep(7., 11., ad);
        // (the flank's alone: the wet meadow's own ground is one even rough skin under its dew, with no pools and no humps)
        float pool = max(smoothstep(${HOLLOW.at.toFixed(2)}, ${HOLLOW.full.toFixed(2)}, hol) * stubW * left, rim * smoothstep(.52, .64, hNoise(vW.xz / 3.7 + 11.))) * lvl;
        float damp = max(smoothstep(.8, 1.1, hol) * stubW * left, rim) * lvl;
        // meadow grass, the reaped strip's stubble in rows, rough wet meadow
        vec3 grass = mix(vec3(.085, .17, .04), vec3(.15, .27, .06), n1) * (.7 + .35 * n2 + .25 * n3);
        float srow = smoothstep(.12, .4, abs(fract(ru / .42) - .5));
        vec3 stub = mix(vec3(.33, .27, .13), vec3(.5, .42, .2), n2) * (.62 + .38 * mix(srow, .6, smoothstep(.1, .4, fu))) * (.85 + .3 * n3);
        // the worked land's own height: lands of 8.4 m, the reaper's swaths of 2.1 m (five rows), the rows' own stubble
        float gF = 0., litF = 1.;
        if (stubR > .01) {
          vec2 el = vec2(L.y / max(abs(L.x * .8 + L.z * .6), 1e-3), L.x * .8 + L.z * .6);
          litF = furrow(ru, 8.4, .1, el, .4, 1. - smoothstep(2., 8., fu), gF) * furrow(ru + 1.9 * (n1 - .5), 2.1, .045, el, .55, 1. - smoothstep(.5, 2., fu), gF);
          furrow(ru, .42, .012, el, 0., 1. - smoothstep(.1, .4, fu), gF);
        }
        vec3 rough = mix(vec3(.07, .15, .05), vec3(.13, .22, .07), n2) * (.7 + .5 * n3);
        // the flank's turf: darker and greener in its hollows, paler and drier on its tops
        vec2 gH = vec2(0.); float litH = 1., humK = .5;
        if (flankW > .01) { float keep = 1. - smoothstep(1.5, 5., fg); vec4 hk = hummocks(vW.xz, L); gH = hk.xy * keep; humK = mix(.5, hk.z, keep); litH = mix(1. - .35 * clamp(1. - 2. * L.y, 0., 1.), hk.w, keep); }
        vec3 turf = mix(mix(vec3(.07, .145, .04), vec3(.15, .25, .07), n1), vec3(.3, .27, .12), .45 * smoothstep(.45, .8, humK)) * (.72 + .3 * n2 + .22 * n3) * (.5 + 1. * humK);
        vec3 alb = mix(mix(mix(grass, stub, stubR), turf, flankW), rough, roughW);
        alb = mix(alb, alb * vec3(.5, .46, .44), damp * .85);
        N = normalize(N - (vec3(.8, 0., .6) * (gF * stubR) + vec3(gH.x, 0., gH.y) * flankW) * (1. - pool));
        // the wheat: straw and shade on its floor, and beyond the last standing row its surface of heads
        float g = hourGust(vW.xz), far = smoothstep(${(WHEAT.last - 3).toFixed(1)}, ${(WHEAT.last - 0.5).toFixed(1)}, ad), inWheat = vZone.x * smoothstep(${(WHEAT.first - 0.3).toFixed(1)}, ${(WHEAT.first + 0.2).toFixed(1)}, ad);
        vec3 floorC = mix(uShadeC * .9, uStraw * .8, .35 + .65 * n3 * n2);
        float rows = mix(.8 + .3 * smoothstep(.15, .5, abs(fract(ad / 1.6) - .5)), 1., smoothstep(.25, 1., px));
        vec3 surf = mix(uStraw, uEar * 1.1, .3 + .25 * n2 + .45 * g * g) * rows * (.88 + .24 * n3);
        alb = mix(alb, mix(floorC, surf, far), inWheat);
        // a ring worn bare, the road, its ruts, the grass strip, a pale verge
        float ring = (1. - smoothstep(uRing.z - 1.1, uRing.z + .2 + .5 * (n2 - .5), distance(vW.xz, uRing.xy))) * (.75 + .25 * n3);
        vec3 dirt = mix(vec3(.4, .33, .23), vec3(.56, .48, .36), n2) * (.86 + .28 * n4);
        alb = mix(alb, dirt * .9, ring * .85);
        // THE SCHOOL'S YARD, behind its picket fence from the fence's first metre to its last: a mown lawn in swaths, drifts of white clover and of
        // dandelions in it (each head a point of the place; their mean where a pixel holds many), and worn bare where feet go: the path from the
        // gate to the porch, under each swing, about the pump and before the steps
        float yard = left * smoothstep(uYard.z - .1, uYard.z + .3, ad) * (1. - smoothstep(uYard.w - 8., uYard.w, ad)) * smoothstep(uYard.x - 3., uYard.x + 3., s) * (1. - smoothstep(uYard.y - 3., uYard.y + 3., s)) * (1. - vZone.x);
        if (yard > .01) {
          float sw = smoothstep(-.3, .3, sin((vW.x * .92 - vW.z * .39) * 4.19)) * (1. - smoothstep(.3, 1.2, fg));
          vec3 lawn = grass * vec3(1.06, 1.1, .82) * (.9 + .16 * sw);
          float kf = 1. - smoothstep(.02, .09, fg), drift = smoothstep(.42, .66, hNoise(vW.xz / 3.3 + 5.)), drift2 = smoothstep(.5, .72, hNoise(vW.xz / 4.7 + 23.));
          vec2 c1 = floor(vW.xz / .2), c2 = floor(vW.xz / .3);
          float h1 = hHash(c1), h2 = hHash(c2 + 7.), r1 = .04 + .03 * hHash(c1 + 3.), r2 = .06;
          float dot1 = (1. - smoothstep(r1 * .6, r1, length(vW.xz - (c1 + .3 + .4 * vec2(hHash(c1 + 1.3), hHash(c1 + 2.7))) * .2))) * step(h1, .6 * drift);
          float dot2 = (1. - smoothstep(r2 * .6, r2, length(vW.xz - (c2 + .2 + .6 * vec2(hHash(c2 + 4.1), hHash(c2 + 9.3))) * .3))) * step(h2, .5 * drift2);
          lawn = mix(lawn, vec3(.86, .84, .76), mix(.14 * drift, dot1, kf));   // (the mean is the heads' own share of the ground)
          lawn = mix(lawn, vec3(.95, .7, .06), mix(.06 * drift2, dot2, kf));
          vec2 pa = vW.xz - uPath.xy, pb = uPath.zw - uPath.xy; float worn = 1. - smoothstep(.3, .75 + .5 * (n2 - .5), length(pa - pb * clamp(dot(pa, pb) / dot(pb, pb), 0., 1.)));
          for (int i = 0; i < 4; i++) worn = max(worn, uWorn[i].w * (1. - smoothstep(uWorn[i].z * .45, uWorn[i].z * (1. + .5 * (n2 - .5)), distance(vW.xz, uWorn[i].xy))));
          lawn = mix(lawn, dirt * .92, worn * (.6 + .3 * n3));
          alb = mix(alb, lawn, yard * (1. - ring));
        }
        float roadK = 1. - smoothstep(1.55, 1.9 + .25 * (n2 - .5), ad), rut = (1. - smoothstep(.1, .24, abs(ad - .75))) * roadK;
        float strip = (1. - smoothstep(.12, .3 + .14 * (n3 - .5), ad)) * (.6 + .4 * n2);
        alb = mix(alb, mix(alb, vec3(.2, .3, .09) * (.8 + .4 * n3), .5), (1. - roadK) * (1. - smoothstep(1.9, 3.3, ad)) * (1. - far));
        alb = mix(alb, dirt, roadK); alb = mix(alb, dirt * .7, rut * .75); alb = mix(alb, grass * 1.15, strip * roadK);
        // a puddle in a rut now and then: it holds the sky of the eye's hour
        float cell = floor(s / uPuddle.y), ph = hHash(vec2(cell, uPuddle.x * 97.)), pl = .5 + .75 * hHash(vec2(cell * 3.7, uPuddle.x * 31.));
        float pside = step(.5, hHash(vec2(cell * 1.3, uPuddle.x * 7.))) * 2. - 1.;
        vec2 pq = vec2((s - (cell + .25 + .5 * ph) * uPuddle.y) / pl, (d - pside * .75) / .26);
        float puddle = (1. - smoothstep(.75, 1., dot(pq, pq) + .3 * (n3 - .5))) * roadK;
        // shade: the pair's, the long shade of great things, contact shade at their feet
        float inW = inWheat * far;
        float pSh = pairShade(vW, L), sun = pSh * castShade(vec3(vW.x, vW.y, vW.z), L) * mix(1., litF, stubR * .7) * mix(1., litH, flankW * .9);
        float ao = 1.;
        for (int i = 0; i < ${NCAST}; i++) { vec4 A = uCastA[i], B = uCastB[i]; ao *= 1. - B.w * (1. - smoothstep(.5, 1.5, distance(vW.xz, A.xy) / max(A.z, .1))); }
        // wet ground at the water's edge; dew where it stands (pale and beaded: the last road's shoulders are pale with it)
        float wet = (1. - smoothstep(level + .02, level + .4, vW.y)) * (1. - dry);
        alb = mix(alb, alb * vec3(.45, .42, .4), wet * .8);
        // (the dew lies in patches: grass keeps its own dark between them)
        float dewP = dew * (.3 + .7 * smoothstep(.36, .62, n1 * .65 + n2 * .35));
        // (no dew on standing water)
        dewP *= 1. - pool;
        alb = mix(alb, alb * vec3(.9, 1.05, 1.3) + vec3(.03, .04, .05), dewP * .8 * (1. - roadK) * (1. - inWheat));
        // (the road's dirt takes the key as a level face; the grass strip down its middle leans to it as the verge's grass does)
        vec3 c = hourShade(alb, normalize(N + L * (mix(${GROUND_LEAN.toFixed(2)}, .12, inW) * (1. - roadK * (1. - strip)))), vW, (.55 + .45 * sun) * ao, sun * (.5 + .5 * ao));
        // (under the low sun the whole sky lights what the key does not reach: the ground in the pair's shade, and the road's level dirt by
        // as much as it goes without the key; so neither is more purple than the ground beside it)
        c = skyShade(c, alb, max(1. - pSh, roadK * (1. - strip) * (1. - clamp(dot(N, L), 0., 1.) * sun)));
        c += (uRow[2].rgb + firstLight(vec3(0., 1., 0.)) * 2.) * (dewP * step(.93, n4) * (1. - roadK) * .5);
        // the puddle: the row's sky, the lamps, and by night a few stars as points
        float night = 1. - uRow[1].a, st = step(.985, hHash(floor(vW.xz * 14.) + uPuddle.x)) * night * night;
        vec3 skyC = mix(uRow[6].rgb, uRow[5].rgb, .45) * (.8 + .2 * sin(uTime * 2.3 + vW.x * 5. + vW.z * 3.)) + lampLight(vW, vec3(0., 1., 0.)) * .5 + vec3(.8, .86, 1.) * st * 1.6;
        c = mix(c, skyC, puddle * .9);
        // standing pools: the sky of the eye's row along the mirrored look (the sun, the afterglow, the moon, the first light), stars as points
        if (pool > .003) { vec3 Vp = normalize(cameraPosition - vW), Rp = normalize(vec3(-Vp.x + .02 * (n3 - .5), abs(Vp.y) + .002, -Vp.z + .02 * (n4 - .5)));
          c = mix(c, poolSky(Rp) + vec3(.8, .86, 1.) * st * 1.6 + lampLight(vW, vec3(0., 1., 0.)) * .4, pool * (1. - roadK) * .93); }
        gl_FragColor = vec4(hourFogGround(c, vW), 1.);
      }`,
  });
}

// a plain grid of ground for a patch: positions from heightAt, aZone from zoneAt
export async function groundGrid(xs, zs, heightAt, zoneAt, yieldFn) {
  const nx = xs.length, nz = zs.length, P = new Float32Array(nx * nz * 3), Zn = new Float32Array(nx * nz * 4), zo = [0, 0, 0, 0];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i; P[k * 3] = xs[i]; P[k * 3 + 1] = heightAt(xs[i], zs[j]); P[k * 3 + 2] = zs[j];
      zoneAt(xs[i], zs[j], zo); Zn.set(zo, k * 4);
    }
    if (yieldFn && j % 16 === 15) await yieldFn();
  }
  if (yieldFn) await yieldFn();
  const I32 = new Uint32Array((nx - 1) * (nz - 1) * 6); let q = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; I32[q++] = a; I32[q++] = c; I32[q++] = d; I32[q++] = a; I32[q++] = d; I32[q++] = b; }
  if (yieldFn) await yieldFn();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('aZone', new THREE.BufferAttribute(Zn, 4)); geo.setIndex(new THREE.BufferAttribute(I32, 1)); geo.computeVertexNormals();
  return geo;
}

// A SHOCK OF SHEAVES: five sheaves stood butt-out and heads together, bound at the neck, the ears splayed wide above
// the band; 1.4 m tall. (Straw takes the light through its stalks: kind 9 of the lit material.)
export function shockGeometry() {
  const g = makeGeo(), STRAW = linear('#d8bc70'), EARC = linear('#e8c466'); g.kind(9);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + 0.3, bx = Math.cos(a) * 0.52, bz = Math.sin(a) * 0.52, tx = Math.cos(a) * 0.09, tz = Math.sin(a) * 0.09;
    g.tube([[bx, -0.05, bz], [lerp(bx, tx, 0.5), 0.55, lerp(bz, tz, 0.5)], [tx, 0.98, tz], [tx * 3.4, 1.22, tz * 3.4], [tx * 5.2, 1.4, tz * 5.2]], [0.2, 0.15, 0.08, 0.2, 0.07], 4, { colors: [STRAW.map((v) => v * 0.8), STRAW, STRAW.map((v) => v * 0.9), EARC, EARC.map((v) => v * 1.12)] }); }
  return g.toGeometry();
}

// THE HERO ALONE: a 160 m square of wheat on swells 4 m high that come right to the verge, 80 m of bent, rising road
// through it, a reaped strip on the right with a file of shocks, and the pair standing on the road; the whole patch
// under the gold hour's row of the table (opts.fixedS: the metres of the world's road whose row it takes).
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('hero'), rRows = rng.fork('rows'), rPair = rng.fork('pair'), rSh = rng.fork('shocks');
  const road = makeRoad([['straight', 30], ['bend', -36, 45], ['straight', 22]], [[10, 0], [62, 2]]);
  const fs0 = opts.fixedS ?? 150, hours = makeHours(road), smap = await bakeSmap(road, ctx.yield, { fixedS: fs0 });
  const U = hourUniforms(hours, smap), cols = wheatColours((ctx.vary && ctx.vary.mood) ?? 0.5), WU = wheatUniforms(U, cols), GU = groundUniforms(WU, road);
  hours.setEye(U, fs0);
  const group = new THREE.Group(), mid = road.at(road.L / 2), loc = { s: 0, d: 0 }, q = [0, 0, 0];
  // the country's own height, brought to the road's height at the line with no level shelf beside it
  const E = (x, z) => 2.1 * Math.sin(x * 0.05 + 1) * Math.cos(z * 0.045) + 0.5 * Math.sin(x * 0.021 - z * 0.017);
  const reaped = (s, d) => (s > 14 && s < 66 && d > 5 && d < 13 ? 1 : 0);
  const earthAt = (x, z) => { road.locate(x, z, loc); const ad = Math.abs(loc.d); road.at(loc.s, 0, q); return road.yAt(loc.s) + (E(x, z) - E(q[0], q[1])) * smoothstep(2, 30, ad); };
  const heightAt = (x, z) => { const h = earthAt(x, z), ad = Math.abs(loc.d); return h + (reaped(loc.s, loc.d) ? 0 : (WHEAT.stalk - 0.05) * smoothstep(WHEAT.last - 3, WHEAT.last, ad)); };
  const xs = [], zs = []; for (let i = 0; i <= 64; i++) { xs.push(mid[0] - 80 + i * 2.5); zs.push(mid[1] - 80 + i * 2.5); }
  const ground = new THREE.Mesh(await groundGrid(xs, zs, heightAt, (x, z, o) => { const r = reaped(loc.s, loc.d); o[0] = 1 - r; o[1] = r; o[2] = 0; o[3] = 4; }, ctx.yield), groundMaterial(GU, road));
  group.add(ground); await ctx.yield();
  const wheat = await makeWheat(road, WU, { from: -10, to: road.L + 10, rng: rRows, heightAt: earthAt, valid: (x, z, s, d) => !reaped(s, d), yield: ctx.yield });
  group.add(wheat.object);
  await ctx.yield();
  // the file of shocks down the reaped strip
  const sg = shockGeometry(), solid = litMaterial(U), sm = new THREE.InstancedMesh(sg, solid, 7), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E3 = new THREE.Euler(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3();
  for (let i = 0; i < 7; i++) { const a = road.at(18 + i * 7.2 + rSh.range(-0.6, 0.6), 9 + rSh.range(-0.5, 0.5)), k = rSh.range(0.92, 1.1); M.compose(Pv.set(a[0], earthAt(a[0], a[1]), a[1]), Q.setFromEuler(E3.set(0, rSh() * 6.283, 0)), Sv.set(k, k, k)); sm.setMatrixAt(i, M); }
  sm.instanceMatrix.needsUpdate = true; sm.computeBoundingSphere(); group.add(sm);
  const pair = buildPair(ctx, U, rPair), s0 = road.L / 2 - 4, at = road.at(s0), hx = Math.sin(at[2]), hz = -Math.cos(at[2]), y0 = road.yAt(s0);
  pair.object.position.set(at[0], y0, at[1]); pair.object.rotation.set(Math.atan(road.slopeAt(s0 + STATION.withers * 0.5)), Math.atan2(-hx, -hz), 0, 'YXZ'); pair.object.updateMatrixWorld(true);
  const l0 = pair.lamps[0].clone().applyMatrix4(pair.object.matrixWorld), l1 = pair.lamps[1].clone().applyMatrix4(pair.object.matrixWorld);
  U.uLamp0.value.set(l0.x, l0.y, l0.z, 1); U.uLamp1.value.set(l1.x, l1.y, l1.z, 1); U.uPair.value.set(at[0], at[1], hx, hz);
  group.add(pair.object);
  const c4 = road.at(road.L / 2);
  return {
    object: group, radius: 9, height: 4, center: new THREE.Vector3(c4[0], road.yAt(road.L / 2) + 1.3, c4[1]), ground: false,
    anchors: { seat: new THREE.Vector3(at[0], y0 + EYE, at[1]), lamps: [l0, l1] },
    update(dt, time) { U.uTime.value = time; },
    dispose() { hours.tHours.dispose(); smap.dispose(); },
  };
}
