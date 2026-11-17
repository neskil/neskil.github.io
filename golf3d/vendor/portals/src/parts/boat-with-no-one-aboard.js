// THE BOAT WITH NO ONE ABOARD: the hero part. One endless sea whose colour, swell, foam and light are read from a
// table by world z, so that seven seas lie one behind the other and weather joins them; the sky ceiling that reads
// the same table; and the archipelago of stars (heaps of sharp points under open doors of light, with gold birds).
// Space: the voyage runs toward -Z, s = -z is metres from the entry, y = 0 is mean sea level.
// Everything here is placed by world coordinates handed in by the world file.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';

export const CEIL = 420;
// half the width of the straight, full-height middle of every roller (m): the route keeps within 8 m of the axis over
// the bar, the hull is 2.1 m to a side, and 2 m to spare
export const ROLL_FLAT = 12;
// half the length of a join between two seas (m)
export const JOIN = 25;
// the red wall's air, and the squall's: metres of each to one optical depth (the squall's air is deep enough
// to stand before the wall as a dark bank from the ice sea, and thin enough that the wall stands ahead from inside it)
export const RED_DEPTH = 3.5, SQUALL_DEPTH = 14;
const TW = 512, ROWS = 14, SMIN = -300, SMAX = 1748;
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const linear = lin;

// the six swells every sea shares (wavelength m, heading from +Z in radians, share of the sea's amplitude, phase)
export const SWELLS = [[61, 0.18, 0.34, 0.3], [43, -0.42, 0.24, 2.1], [29, 0.66, 0.17, 4.4], [19, -0.95, 0.12, 1.2], [11.5, 1.3, 0.08, 5.3], [6.7, -1.7, 0.05, 3.7]];
const G = 9.81;
const swellK = SWELLS.map(([l, th, a, ph]) => { const k = 2 * Math.PI / l; return { k, dx: Math.sin(th), dz: Math.cos(th), a, w: Math.sqrt(G * k), ph }; });

// One sea is a stop of the table: a plateau from a to b (metres of the voyage) and its values. Between two plateaus
// the values run smoothly from one to the other (the joins). All colours linear.
const KEYS3 = ['deep', 'crest', 'foam', 'glow', 'skyHi', 'skyLo', 'fog', 'key', 'amb', 'keyDir'];
const KEYS1 = ['swell', 'foamAmt', 'rough', 'under', 'stars', 'cloud', 'dens', 'rainbow', 'phos', 'milk', 'chop', 'spec', 'fogH'];
const DEF = { deep: [0, 0, 0], crest: [0, 0, 0], foam: [1, 1, 1], glow: [0, 0, 0], skyHi: [0, 0, 0], skyLo: [0, 0, 0], fog: [0, 0, 0], key: [0, 0, 0], amb: [0.1, 0.1, 0.1], keyDir: [0, 1, 0],
  swell: 0.3, foamAmt: 0.3, rough: 0.5, under: 0, stars: 0, cloud: 0.5, dens: 1 / 900, rainbow: 0, phos: 0, milk: 0, chop: 0.5, spec: 0.5, fogH: 0 };

// the seven seas and their joins, from the places P of this visit (see the world file) and its look V
export function seaStops(P, V) {
  const hue = (hex, k, shift) => { const c = new THREE.Color(hex); c.offsetHSL(shift, 0, 0); return [c.r * k, c.g * k, c.b * k]; };
  const m = V.mood - 0.5, cs = V.coastSide, is = V.iceSide, R = V.river;
  // ONE RULE FOR EVERY JOIN: 50 m of weather centred on the join's own place: a sea's plateau ends J before the place
  // and the next begins J beyond it. Weather that stands in a join is a point stop at the join's centre (the dawn at
  // the violet sea's edge, the mist where the ice sea begins, the squall midway between its near face and the red
  // wall, held to a quarter of the wall's thickness before its near face). The red wall holds its own colour over the
  // middle half of its thickness.
  const J = JOIN, q = (P.wall1 - P.wall0) / 4, sq = (P.squall + P.wall0) / 2;
  const stops = [
    // far astern, beyond where the sea ends 200 m behind the entry: the river's own dusk (or dawn, noon, night) low on the sky
    { a: -1e4, b: -200 - J, ...R, skyLo: R.astern, fog: R.astern.map((v) => v * 0.8) },
    { a: -200 + J, b: P.bar - J, ...R },
    // the bar: bottle green rollers under slate
    { a: P.bar + J, b: P.milk - J, deep: hue('#0b4a36', 0.3, m * 0.05), crest: hue('#46d89a', 0.5, m * 0.05), foam: lin('#f2faf4', 1), glow: hue('#0f6b4a', 0.12, m * 0.05),
      skyHi: lin('#3c4c62', 0.95), skyLo: lin('#93aab2', 0.9), fog: lin('#7c949c', 0.8), key: lin('#cfe4e0', 0.9), keyDir: [0.2, 0.7, -0.6], amb: lin('#647a82', 0.9),
      swell: 0.3, foamAmt: 0.42, rough: 0.7, cloud: 0.9, dens: 1 / 800, chop: 0.9, spec: 0.5 },
    // the milk sea: the water is the light under a deep blue night with stars and cloud lit from below
    { a: P.milk + J, b: P.green - J, deep: lin('#4c6a8a', 0.5), crest: lin('#c4d2e2', 0.7), foam: lin('#ffffff', 0.95), glow: lin('#dfe8e6', 0.09),
      skyHi: lin('#0f1c40', 1), skyLo: lin('#5c79a8', 0.85), fog: lin('#415a84', 0.85), key: lin('#dfe8ee', 0.25), keyDir: [0, 1, 0], amb: lin('#9db2c4', 0.75),
      swell: 0.15, foamAmt: 0.25, rough: 0.35, under: 1, stars: 1, cloud: 0.5, dens: 1 / 900, milk: 1, chop: 0.3, spec: 0.15 },
    // the green night: dark water, snow lit from below, phosphorus
    { a: P.green + J, b: P.violet - J, deep: hue('#06281c', 1.0, m * 0.04), crest: hue('#1c8a58', 0.9, m * 0.04), foam: lin('#d2f0dc', 0.9), glow: hue('#0e6a44', 0.6, m * 0.04),
      skyHi: lin('#08161c', 1), skyLo: lin('#0e3428', 0.9), fog: lin('#0c2c22', 0.9), key: lin('#9fe0b8', 0.3), keyDir: [0, 1, 0], amb: lin('#2c6a50', 0.7),
      swell: 0.3, foamAmt: 0.12, rough: 0.5, under: 0.35, stars: 0.8, cloud: 0.4, dens: 1 / 700, phos: 1, chop: 0.6, spec: 0.3 },
    // the dawn that stands in the join (a point stop: weather, not a sea)
    { a: P.violet, b: P.violet, deep: lin('#3a2a50', 0.8), crest: lin('#d8a8a0', 0.9), foam: lin('#fff0d8', 0.95), glow: lin('#5a3a40', 0.3),
      skyHi: lin('#6a4a78', 0.9), skyLo: lin('#ffe6b0', 0.95), fog: lin('#f2d2a4', 0.8), key: lin('#ffe6b0', 1.0), keyDir: [0.5 * -cs, 0.3, -0.8], amb: lin('#8a6a80', 0.8),
      swell: 0.3, foamAmt: 0.3, rough: 0.5, stars: 0.2, cloud: 0.5, dens: 1 / 520, chop: 0.5, spec: 0.6 },
    // the violet sea under a low blotted sun
    { a: P.violet + J, b: P.ice - J, deep: hue('#1a0c2e', 1.0, m * 0.06), crest: hue('#7a3cc0', 0.9, m * 0.06), foam: lin('#ecd2f4', 0.9), glow: hue('#34125a', 0.3, m * 0.06),
      skyHi: hue('#4a2470', 0.85, m * 0.05), skyLo: lin('#b4503c', 0.85), fog: lin('#7a3a58', 0.75), key: lin('#ff8a44', 1.5), keyDir: [0.72 * -cs, 0.2, -0.62], amb: hue('#46286c', 0.8, m * 0.05),
      swell: 0.34, foamAmt: 0.3, rough: 0.55, cloud: 0.75, dens: 1 / 900, rainbow: 1, chop: 0.55, spec: 1.0 },
    // the join's mist, violet, 30 m high
    { a: P.ice, b: P.ice, deep: lin('#3c3460', 0.8), crest: lin('#b0a0d0', 0.9), foam: lin('#f4ecff', 0.95), glow: lin('#4a4070', 0.2),
      skyHi: lin('#8a7cae', 0.8), skyLo: lin('#b4a4cc', 0.85), fog: lin('#a898c4', 0.8), key: lin('#e8e0ff', 0.6), keyDir: [0.4 * is, 0.5, -0.7], amb: lin('#7c70a0', 0.8),
      swell: 0.25, foamAmt: 0.25, rough: 0.4, cloud: 0.6, dens: 1 / 150, chop: 0.4, spec: 0.3, fogH: 1 },
    // the ice sea: pearl and silver, a sea that shines
    { a: P.ice + J, b: P.squall - J, deep: lin('#3f6f9a', 0.55), crest: lin('#cfd9e0', 0.85), foam: lin('#ffffff', 0.95), glow: lin('#8fa8ba', 0.12),
      skyHi: lin('#9db0c6', 0.8), skyLo: lin('#e4e8ea', 0.85), fog: lin('#c0cad6', 0.8), key: lin('#f6f8ff', 1.3), keyDir: [0.5 * -is, 0.32, -0.8], amb: lin('#7f95ad', 0.85),
      swell: 0.24, foamAmt: 0.2, rough: 0.35, cloud: 0.65, dens: 1 / 800, chop: 0.4, spec: 1.2 },
    // the squall line: a dark slate storm, from its middle to the red wall's near face (which is a join of a quarter
    // of the wall's thickness either side of that face)
    { a: sq, b: P.wall0 - q, deep: lin('#101822', 1), crest: lin('#3c4c60', 0.9), foam: lin('#dfe6ee', 0.9), glow: [0, 0, 0],
      skyHi: lin('#323c4a', 0.9), skyLo: lin('#3a4452', 0.9), fog: lin('#2c3542', 0.9), key: lin('#aab8cc', 0.5), keyDir: [0, 0.8, -0.4], amb: lin('#39445a', 0.8),
      swell: 0.5, foamAmt: 0.8, rough: 0.9, cloud: 1, dens: 1 / SQUALL_DEPTH, chop: 1, spec: 0.3 },
    // inside the red wall. THE WALL IS WEATHER: red air so deep (RED_DEPTH m to one depth) that an eye in it sees
    // nothing but the wall, and the sea beyond comes clear only where this air thins, over the join to the blue sea
    { a: P.wall0 + q, b: P.wall1 - q, deep: lin('#3a0c08', 1), crest: lin('#c22a12', 0.8), foam: lin('#ffd0a0', 0.9), glow: lin('#5a1408', 0.4),
      skyHi: lin('#c22a12', 0.9), skyLo: lin('#d8401a', 0.9), fog: lin('#c22a12', 0.85), key: lin('#ffb060', 1.0), keyDir: [0, 0.6, -0.7], amb: lin('#a03018', 0.9),
      swell: 0.45, foamAmt: 0.6, rough: 0.8, cloud: 1, dens: 1 / RED_DEPTH, chop: 0.9, spec: 0.5 },
    // the sea of the funnels of fire: deep ultramarine, fire low on the sea-line
    { a: P.wall1 + J, b: P.star - J, deep: hue('#070d34', 1.0, m * 0.03), crest: hue('#2038c4', 0.9, m * 0.03), foam: lin('#cdd8ff', 0.9), glow: hue('#0a1658', 0.3, m * 0.03),
      skyHi: hue('#16289c', 1.0, m * 0.03), skyLo: hue('#1a2a90', 0.9, m * 0.03), fog: hue('#131c6c', 0.9, m * 0.03), key: lin(V.fire, 0.7), keyDir: [0.85, 0.25, -0.3], amb: hue('#1c2c98', 0.8, m * 0.03),
      swell: 0.5, foamAmt: 0.35, rough: 0.6, cloud: 0.35, dens: 1 / 1000, chop: 0.7, spec: 1.0 },
    // the star sea
    { a: P.star + J, b: 1e4, deep: lin('#060a24', 1), crest: lin('#141c58', 0.9), foam: lin('#efe6c8', 0.9), glow: [0, 0, 0],
      skyHi: lin('#04071a', 1), skyLo: lin('#0c1238', 1), fog: lin('#0a0f30', 1), key: lin('#ffe2a0', 0.9), keyDir: [0, 0.3, -0.95], amb: lin('#34325c', 0.9),
      swell: 0.22, foamAmt: 0.12, rough: 0.3, under: 0.3, stars: 1, cloud: 0.05, dens: 1 / 1400, chop: 0.3, spec: 0.8 },
  ];
  return stops.map((s) => ({ ...DEF, ...s }));
}

// WEATHER BY PLACE: what belongs to a sea, as a function of the voyage metre alone (rows 11 to 13 of the table).
// Each ramps over the join it belongs to (2 x JOIN m about the join's own place). A row is read AT THE PLACE OF
// THE THING IT RULES (the sky's place in a direction, a stroke's own place, a face of ice, the water under a
// road of light), or, for a medium that is where the eye is (rain, snow, petals, the bar's wash), where that is:
//  roads  the ice sea's own water, which bears the roads of light of the two mock suns: from the mist's join as
//         far as the squall's cloud stands over it (from where the squall's air begins to the squall's middle).
//         (The suns themselves are in no row: each stands in its own sea's sky at one strength: the sky's sunSeen.)
//  fire   the fire low on the sea-line and its roads on the water, beyond the red wall
//  bolt   the squall's lightning: over the ice sea and inside the squall, not within the red wall's own colour
//  rain   in the squall;  snow  in the green night;  petals  along the flower coast
//  bar    awash: from the first roller's foot (rising to its crest) to the last roller's foot (falling from its crest)
export function weatherAt(P, s) {
  if (P.violet === undefined) return { roads: 0, fire: 0, bolt: 0, rain: 0, snow: 0, petals: 0, bar: 0 };
  const J = JOIN, sq = (P.squall + P.wall0) / 2, wq = (P.wall1 - P.wall0) / 4, into = (p) => smoothstep(p - J, p + J, s);
  const squall = smoothstep(P.squall - J, sq, s), wall = smoothstep(sq, P.wall0 + wq, s), blue = smoothstep(P.wall1 - wq, P.wall1 + J, s);
  return { roads: into(P.ice) * (1 - squall), fire: blue, bolt: into(P.ice) * (1 - wall),
    rain: squall * (1 - wall), snow: into(P.green) * (1 - into(P.violet)), petals: into(P.coast0) * (1 - into(P.coast1)),
    bar: smoothstep(P.bar, P.crest[0], s) * (1 - smoothstep(P.crest[2], P.crest[2] + 35, s)) };
}

// The table and what reads it on the CPU. P: places, V: this visit's look (mood, sides, swellK, river colours).
// The table's numbers. fill(share) writes the texels up to that share of the table's length (a build may rest
// between runs; the summed fog needs them in order); makeSeas fills whatever is left.
export function seaTable(P, V, stops = seaStops(P, V)) {
  const data = new Float32Array(TW * ROWS * 4), half = new Uint16Array(TW * ROWS * 4), ds = (SMAX - SMIN) / (TW - 1); let od = 0, done = 0;
  const put = (row, i, c, a) => { const o = (row * TW + i) * 4; data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = a; };
  const fill = (share = 1) => {
    const to = Math.min(TW, Math.round(share * TW));
    for (let i = done; i < to; i++) {
      // (the two stops this texel lies between, found once)
      const s = SMIN + i * ds; let j = 0; while (j < stops.length - 1 && s > stops[j + 1].a) j++;
      const A = stops[j], flat = s <= A.b || j === stops.length - 1, B = flat ? A : stops[j + 1], t = flat ? 0 : smoothstep(A.b, B.a, s);
      const v = (k) => lerp(A[k], B[k], t), c = (k) => mix3(A[k], B[k], t), dens = v('dens'); od += dens * ds;
      put(0, i, c('deep'), v('swell') * V.swellK); put(1, i, c('crest'), v('foamAmt')); put(2, i, c('foam'), v('rough')); put(3, i, c('glow'), v('under'));
      put(4, i, c('skyHi'), v('stars')); put(5, i, c('skyLo'), v('cloud')); put(6, i, c('fog'), dens); put(7, i, [v('rainbow'), v('phos'), v('milk')], v('chop'));
      put(8, i, c('key'), v('spec')); put(9, i, c('keyDir'), od); put(10, i, c('amb'), v('fogH'));
      const w = weatherAt(P, s); put(11, i, [0, w.roads, w.fire], w.bolt); put(12, i, [w.rain, w.snow, w.petals], 0); put(13, i, [w.bar, 0, 0], 0);
      for (let r = 0; r < ROWS; r++) { const o = (r * TW + i) * 4; for (let k = 0; k < 4; k++) half[o + k] = THREE.DataUtils.toHalfFloat(data[o + k]); }
    }
    done = Math.max(done, to);
  };
  return { stops, data, half, ds, fill };
}
export function makeSeas(P, V, stops = seaStops(P, V), table = null) {
  const T = table || seaTable(P, V, stops); T.fill(1);
  const data = T.data, half = T.half, ds = T.ds; stops = T.stops;
  const valueAt = (s, key) => {
    let i = 0; while (i < stops.length - 1 && s > stops[i + 1].a) i++;
    const A = stops[i]; if (s <= A.b || i === stops.length - 1) return A[key];
    const B = stops[i + 1], t = smoothstep(A.b, B.a, s);
    return typeof A[key] === 'number' ? lerp(A[key], B[key], t) : mix3(A[key], B[key], t);
  };
  const tex = new THREE.DataTexture(half, TW, ROWS, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  // one row of the table at s, linear between texels: out = [r, g, b, a]
  const row = (r, s, out = [0, 0, 0, 0]) => {
    const f = clamp((s - SMIN) / ds, 0, TW - 1.001), i = Math.floor(f), t = f - i, o = (r * TW + i) * 4;
    for (let k = 0; k < 4; k++) out[k] = lerp(data[o + k], data[o + 4 + k], t);
    return out;
  };
  // the standing rollers of the bar: a fixed profile along the voyage, full height for 150 m either side of the axis
  const ext = [[P.bar, 0], [P.crest[0], 2.2], [(P.crest[0] + P.crest[1]) / 2, -2.2], [P.crest[1], 3.0], [(P.crest[1] + P.crest[2]) / 2, -3.0], [P.crest[2], 2.5], [P.crest[2] + 35, 0]];
  // Two profiles through the same crests and troughs. The water itself is peaked: from each trough it rises as the
  // square of the cosine step, so the crests are narrow and the troughs long. The ride is the plain cosine step, which
  // lies on the water at every crest and trough and above it between: the eye's line and our hull follow the ride.
  const prof = (s, peaked) => {
    if (s <= ext[0][0] || s >= ext[6][0]) return 0;
    let i = 0; while (s > ext[i + 1][0]) i++;
    const t = (s - ext[i][0]) / (ext[i + 1][0] - ext[i][0]), c = 0.5 - 0.5 * Math.cos(Math.PI * t), a = ext[i][1], b = ext[i + 1][1];
    if (!peaked) return lerp(a, b, c);
    const q = b > a ? c : 1 - c; return Math.min(a, b) + Math.abs(b - a) * q * q;
  };
  const rollerS = (s) => prof(s, true), rideS = (s) => prof(s, false);
  const rollerEnv = (x) => 1 - smoothstep(150, 200, Math.abs(x));
  // Across the voyage each crest line wanders to and fro (up to 17 m) and heaves in height (by a third), so no crest lies straight
  // from hand to hand. Within ROLL_FLAT m of the axis (the route's widest offset over the bar, the hull's half beam
  // and a margin) the crest is straight and of its full height: there the ride is exact. V.roll: three seeded phases.
  const RW = V.roll || [0, 0, 0], wanderK = (x) => smoothstep(ROLL_FLAT, ROLL_FLAT + 58, Math.abs(x));
  const wander = (x) => wanderK(x) * (11 * Math.sin(x * 0.019 + RW[0]) + 6 * Math.sin(x * 0.047 + RW[1]));
  const heave = (x) => 1 + wanderK(x) * (0.2 * Math.sin(x * 0.031 + RW[2]) + 0.13 * Math.sin(x * 0.083 + RW[0] * 2) - 0.08);
  const tmp = [0, 0, 0, 0];
  // the swell alone at a place and a moment (m over the standing surface)
  // the table's own metre for a place: the same as seaS in the shaders
  const nightAt = (x, z) => {
    const s = -z, BS = uniforms.uBlueStar.value, B = uniforms.uBay.value; if (s < BS.x) return 0;
    let n = smoothstep(-30, 30, s - (B.x + B.y * Math.max(Math.abs(x) - B.z, 0)));
    for (const I of uniforms.uIsl.value) if (I.z >= 1) n = Math.max(n, smoothstep(1.75, 1.15, Math.hypot(x - I.x, z - I.y) / I.z));
    return n;
  };
  const sOf = (x, z) => { const s = -z, BS = uniforms.uBlueStar.value; return s < BS.x ? s : lerp(BS.x, Math.max(s, BS.y), nightAt(x, z)); };
  const swellAt = (x, z, t) => {
    const A = row(0, sOf(x, z), tmp)[3]; let h = 0;
    for (const w of swellK) h += A * w.a * Math.sin(w.k * (w.dx * x + w.dz * z) - w.w * t + w.ph);
    return h;
  };
  const standingAt = (x, z) => rollerS(-z + wander(x)) * heave(x) * rollerEnv(x), rideAt = (x, z) => rideS(-z + wander(x)) * heave(x) * rollerEnv(x);
  const heightAt = (x, z, t) => standingAt(x, z) + swellAt(x, z, t);
  // THE DEPTH OF WEATHER BETWEEN TWO PLACES, on the processor: the same law as the shaders' seaDepth (the table's fog
  // summed along the ray), for things the kit draws, which cannot read the table themselves. dim: what is left of a
  // light through that depth (the shaders' seaDim). fogShare: where along the ray the fog is seen (the shaders' seaFogAt).
  const tA = [0, 0, 0, 0], tB = [0, 0, 0, 0];
  const depth = (ax, ay, az, bx, by, bz) => {
    const d = Math.hypot(bx - ax, by - ay, bz - az), dz = Math.abs(bz - az);
    const avg = lerp(row(6, -az, tA)[3], Math.abs(row(9, -bz, tA)[3] - row(9, -az, tB)[3]) / Math.max(dz, 1), smoothstep(2, 14, dz));
    return avg * d * lerp(1, Math.exp(-Math.max(0.5 * (by + ay) - 6, 0) / 14), row(10, -(az + bz) / 2, tA)[3]);
  };
  const dim = (ax, ay, az, bx, by, bz, hold = 0) => { const tau = depth(ax, ay, az, bx, by, bz); return Math.exp(-tau * (1 - hold * (1 - smoothstep(1, 3, tau)))); };
  const fogShare = (az, bz, tau) => {
    const dz = Math.max(Math.abs(bz - az), 1e-3), o0 = row(9, -az, tA)[3], tot = Math.abs(row(9, -bz, tA)[3] - o0), want = tot * Math.min(0.4, 0.7 / Math.max(tau, 1e-3));
    let a = 0, fa = 0, b = 1, fb = tot, m = 4 / dz;
    for (let i = 0; i < 4; i++) { if (m < b) { const fm = Math.abs(row(9, -lerp(az, bz, m), tA)[3] - o0); if (fm < want) { a = m; fa = fm; } else { b = m; fb = fm; } } m *= 4; }
    return a + (b - a) * clamp((want - fa) / Math.max(fb - fa, 1e-6), 0, 1);
  };
  // THE RED AIR'S FOLDS, BAKED: a tile of 256 by 256 (GLSL redTile), 16 cells of the longest folds across it either
  // way. The pattern b is four octaves of value noise (each half the cell and 0.62 the weight of the one before,
  // the sum brought to 0 to 1); every octave's lattice repeats across the tile (16, 32, 64, 128 cells), its numbers
  // a hash of the cell and the octave alone (no stream's draw). The tile holds what a sheet shows of it, ready:
  // first channel THE BANK'S DARK SHARE (the denser half of the pattern: nothing at b = 0.5, nine tenths at 0.68
  // and over), second THE RIFT'S LIT SHARE (the thinner half: nothing at 0.5, whole at 0.32 and under: its thinnest
  // twentieth), third the first octave alone (the longest folds: the sea's own shade). Half floats, filtered, no
  // mipmaps: one read gives a sheet's picture at a place.
  const FT = 256, foldData = new Uint16Array(FT * FT * 4), foldH = (x, y, o) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(o + 1, 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) & 255) / 255; };
  { const lat = [0, 1, 2, 3].map((o) => { const n = 16 << o, a = new Float32Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) a[y * n + x] = foldH(x, y, o); return a; });
    const one = new Float32Array(4);
    for (let y = 0; y < FT; y++) for (let x = 0; x < FT; x++) { let amp = 0.5, sum = 0;
      for (let o = 0; o < 4; o++) { const n = 16 << o, fx = (x + 0.5) / FT * n, fy = (y + 0.5) / FT * n, ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy, sx = ux * ux * (3 - 2 * ux), sy = uy * uy * (3 - 2 * uy), L = lat[o], x1 = (ix + 1) % n, y1 = (iy + 1) % n;
        one[o] = lerp(lerp(L[iy * n + ix], L[iy * n + x1], sx), lerp(L[y1 * n + ix], L[y1 * n + x1], sx), sy); sum += amp * one[o]; amp *= 0.62; }
      const q = (y * FT + x) * 4, b = sum / 1.1214; foldData[q] = THREE.DataUtils.toHalfFloat(0.9 * smoothstep(0.5, 0.68, b)); foldData[q + 1] = THREE.DataUtils.toHalfFloat(1 - smoothstep(0.32, 0.5, b)); foldData[q + 2] = THREE.DataUtils.toHalfFloat(one[0]); foldData[q + 3] = THREE.DataUtils.toHalfFloat(1); } }
  const foldTex = new THREE.DataTexture(foldData, FT, FT, THREE.RGBAFormat, THREE.HalfFloatType);
  foldTex.magFilter = THREE.LinearFilter; foldTex.minFilter = THREE.LinearFilter; foldTex.wrapS = foldTex.wrapT = THREE.RepeatWrapping; foldTex.generateMipmaps = false; foldTex.needsUpdate = true;
  const uniforms = { tTable: { value: tex }, uTime: { value: 0 }, uBufH: { value: 450 }, uIsl: { value: Array.from({ length: NISL }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uBay: { value: new THREE.Vector4(1e6, 3, 60, 0) }, uBlueStar: { value: new THREE.Vector2(1e6, 1e6) }, uExt: { value: ext.map((e) => new THREE.Vector2(e[0], e[1])) },
    uRollPh: { value: new THREE.Vector3(RW[0], RW[1], RW[2]) }, uFold: { value: new THREE.Vector2(0, 0) }, uSheet: { value: new THREE.Vector4(0, 1, 0, 12) }, uSheetAir: { value: 0 }, tFold: { value: foldTex } };
  return { stops, tex, row, valueAt, rollerS, rideS, rideAt, rollerEnv, swellAt, standingAt, heightAt, nightAt, sOf, uniforms, ext, wander, heave, depth, dim, fogShare };
}

// GLSL every material of this world shares: the table, the fog between the eye and a point (the optical depth of a
// medium layered along z is exact from the summed row), and the light of the sea a thing stands in.
export const NISL = 4;
export const GLSL_SEAS = /* glsl */`
uniform sampler2D tTable; uniform float uTime; uniform vec4 uIsl[${NISL}]; uniform vec4 uBay; uniform vec2 uBlueStar;
#define TUS(s) clamp(((s) - (${SMIN.toFixed(1)})) / ${(SMAX - SMIN).toFixed(1)}, 0., 1.)
vec4 seaRowS(float r, float s){ return textureLod(tTable, vec2(TUS(s) * ${((TW - 1) / TW).toFixed(6)} + ${(0.5 / TW).toFixed(6)}, (r + .5) / ${ROWS.toFixed(1)}), 0.); }
vec4 seaRow(float r, float z){ return seaRowS(r, -z); }
// the star sea is a bay of night that opens ahead in the blue sea, and a pool of night round each near star island
float seaNightW(vec2 xz, float w){
  float s = -xz.y; if (s < uBlueStar.x) return 0.;
  float n = smoothstep(-w, w, s - (uBay.x + uBay.y * max(abs(xz.x) - uBay.z, 0.)));
  for (int i = 0; i < ${NISL}; i++){ vec4 I = uIsl[i]; n = max(n, step(1., I.z) * smoothstep(1.75, 1.15, length(xz - I.xy) / max(I.z, 1.))); }
  return n;
}
float seaNight(vec2 xz){ return seaNightW(xz, 30.); }
float seaSW(vec2 xz, float w){ float s = -xz.y; return s < uBlueStar.x ? s : mix(uBlueStar.x, max(s, uBlueStar.y), seaNightW(xz, w)); }
float seaS(vec2 xz){ return seaSW(xz, 30.); }
vec4 seaAt(float r, vec2 xz){ return seaRowS(r, seaS(xz)); }
// THE DEPTH OF WEATHER between the eye and a place: the table's own fog summed along the ray (exact for a medium that
// is layered along the voyage: the summed row 9). Every thing of this world takes its fog from this one depth.
float seaDepth(vec3 wp){
  float zc = cameraPosition.z, zf = wp.z, d = distance(cameraPosition, wp), dz = abs(zf - zc);
  float avg = mix(seaRow(6., zc).a, abs(seaRow(9., zf).a - seaRow(9., zc).a) / max(dz, 1.), smoothstep(2., 14., dz));
  float hf = mix(1., exp(-max(.5 * (wp.y + cameraPosition.y) - 6., 0.) / 14.), seaRow(10., mix(zc, zf, .5)).a);
  return avg * d * hf;
}
// THE FOG'S COLOUR IS THE AIR'S WHERE THE FOG IS SEEN: the place along the ray at which the depth from the eye
// reaches two fifths of the whole (thin air: near the ray's middle), and never more than 0.7 of a depth (deep
// weather: the air by the eye; so nothing beyond a wall of weather is fogged to the colour of the sea beyond it).
// Found on the summed row: 4, 16, 64 and 256 m of voyage from the eye are tried, then one straight step between
// the two that hold the place (no jump from ray to ray). Returns the share of the ray.
float seaFogAt(float zc, float zf, float tau){
  float dz = max(abs(zf - zc), 1e-3), o0 = seaRow(9., zc).a, tot = abs(seaRow(9., zf).a - o0), want = tot * min(.4, .7 / max(tau, 1e-3));
  float a = 0., fa = 0., b = 1., fb = tot, m = 4. / dz;
  for (int i = 0; i < 4; i++){
    if (m < b){ float fm = abs(seaRow(9., mix(zc, zf, m)).a - o0); if (fm < want){ a = m; fa = fm; } else { b = m; fb = fm; } }
    m *= 4.;
  }
  return a + (b - a) * clamp((want - fa) / max(fb - fa, 1e-6), 0., 1.);
}
// THE RED AIR IS FOLDED, AND ITS FOLDS STAND IN THE WORLD; every thing that takes the fog takes them. Where the red
// air lies thick (banks) and where thin (rifts) is read ON TWO FIXED SHEETS OF THE WALL'S OWN AIR, where the ray
// from the eye meets them: ONE UPRIGHT SHEET across the voyage where the red air ends up the voyage (uSheet.z, a
// voyage metre) and ONE LEVEL SHEET at a set height over the mean sea (uSheet.w m) between the red air's two ends
// (uSheet.x: their middle, uSheet.y: half the way between them, voyage metres). A sheet's picture is a law of its
// own two world coordinates and the world clock alone: folds 40 to 120 m long and half as tall, smaller folds on
// them down to 10 m, drifting at about a metre a second (uFold: the visit's own place in the pattern). So an eye
// that moves sees the same bank from another place: a bank on the upright sheet comes nearer, is passed, and is
// seen from its other side astern; a bank on the level sheet comes up from ahead, stands overhead and abeam, and
// goes astern. THE PATTERN IS BAKED IN A SMALL TILE (tFold, made with the table: the bank's dark share, the rift's
// lit share, and the longest folds alone), so a sheet is read with ONE read of that tile: two reads a pixel, and
// little for a driver to compile (the law is in every material that takes the fog).
uniform vec2 uFold; uniform vec4 uSheet; uniform float uSheetAir; uniform sampler2D tFold;
vec3 redTile(vec2 cell){ return textureLod(tFold, (cell + uFold) / 16., 0.).rgb; }
// (a place in the pattern on a level sheet: across and along; the pattern taken 5.3 and 9.7 cells off, so that the
// level sheet and the upright one do not carry one picture)
vec2 redFlat(vec2 xz){ return vec2(xz.x * .011 + uTime * .012 + 5.3, xz.y * .015 + uTime * .007 + 9.7); }
// WHAT A RAY FROM THE EYE SHOWS OF THE FOLDED AIR (plain: the air's one colour). A BANK is the plain colour
// deepening to dark crimson at its heart; A RIFT is open air lit by the fire that burns low on the sea-line beyond
// the wall: a brighter vermilion, to orange where the rift opens toward that fire (ahead up the voyage and within
// a few degrees of the sea-line). THE UPRIGHT SHEET shows to a ray that meets it beyond the eye: nothing within 3
// degrees of edge-on and whole from 17 (a sheet seen along itself is no picture), and BY THE AIR BETWEEN THE EYE
// AND IT, as any thing in weather: the table's summed fog between the two voyage metres (uSheetAir, found each
// frame where the eye is), taken along the ray: nothing where no air lies between (the eye is in the sheet), whole
// from one depth. So the eye goes through it with no step, and nothing here reads how far the eye is from anything
// but as depth of air. THE LEVEL SHEET shows to a ray that rises to it (nothing under 2 degrees of rise, whole
// from 12: lower rays meet it too far off) where the place they meet lies between the red air's two ends (going
// out over 20 m about each end), and there it stands before the upright sheet. Where neither shows, the air is its
// plain colour. It is the air's own law, no body: it reads the ray, the eye's place and the world's sheets, and
// nothing else. (The weights are straight ramps: there is nothing to see of their corners in this air.)
vec3 redFold(vec3 plain, vec3 dir){
  vec3 eye = cameraPosition; float se = -eye.z, ds = -dir.z, ad = max(abs(ds), .05), tU = (uSheet.z - se) * ds / (ad * ad);
  float wU = step(0., tU) * clamp(ad * 4. - .2, 0., 1.) * min(uSheetAir / ad, 1.);
  vec2 pU = eye.xy + dir.xy * tU, pL = eye.xz + dir.xz * (max(uSheet.w - eye.y, 0.) / max(dir.y, .03));
  float wL = clamp(dir.y * 6. - .2, 0., 1.) * clamp(.5 - (abs(-pL.y - uSheet.x) - uSheet.y) / 20., 0., 1.);
  vec2 f = mix(redTile(vec2(pU.x * .011 + uTime * .012, pU.y * .024 - uTime * .004)).rg * wU, redTile(redFlat(pL)).rg, wL);
  return mix(mix(plain, vec3(.12, .003, .012), f.r), mix(vec3(.74, .055, .012), vec3(.95, .2, .03), smoothstep(-.3, .6, ds) * exp(-abs(dir.y) * 7.)), f.g);
}
// THE FOG'S COLOUR for a thing at wp behind tau depths of air: the air's colour where the fog is seen (seaFogAt),
// FOLDED where that air is the red wall's: by the red air's share of the table's air at that place (its fog a
// tenth of a depth to the metre: none; a quarter: whole) and by the depth of air before the thing (under one
// depth the plain colour: a thing so near stands in the air about the eye; from three depths the folds whole:
// there the thing itself is lost, and its fog shows what the wall's own cloud shows along the same ray).
vec3 seaFogCol(vec3 wp, float tau){
  vec3 fp = mix(cameraPosition, wp, seaFogAt(cameraPosition.z, wp.z, tau)); vec4 air = seaAt(6., fp.xz);
  float w = smoothstep(.09, .25, air.a) * smoothstep(1., 3., tau);
  if (w > .004) air.rgb = mix(air.rgb, redFold(air.rgb, normalize(wp - cameraPosition)), w);
  return air.rgb;
}
// keep: how much of a light holds against thin air. Nothing holds against deep weather: the hold is whole up to
// one depth and gone at three (the squall and the red wall close over every light alike).
vec3 seaFog(vec3 col, vec3 wp, float keep){
  float tau = seaDepth(wp), f = 1. - exp(-tau);
  return mix(col, seaFogCol(wp, tau), f * (1. - keep * (1. - smoothstep(1., 3., tau))));
}
// what is left of a light seen through the weather. It holds against thin air by a share (hold) of the depth (0: as any
// surface) up to one depth; from one depth to three the hold goes: deep weather closes over every light alike.
float seaDim(vec3 wp, float hold){ float tau = seaDepth(wp); return exp(-tau * (1. - hold * (1. - smoothstep(1., 3., tau)))); }
vec3 seaLight(vec3 n, vec3 wp, vec3 albedo, float wrap){
  float s = seaS(wp.xz);
  vec3 hi = seaRowS(10., s).rgb, lo = seaRowS(3., s).rgb * 1.6 + seaRowS(0., s).rgb * .5;
  vec4 key = seaRowS(8., s); vec3 kd = seaRowS(9., s).xyz; kd /= max(length(kd), 1e-3);
  float nl = clamp((dot(n, kd) + wrap) / (1. + wrap), 0., 1.);
  return albedo * (mix(lo, hi, n.y * .5 + .5) + key.rgb * nl);
}
`;

export const NDOOR = 12;
// the share of a door's radius inside which its rent is whole (its torn edge lies between that and the full radius);
// the pillar of light under a door is as wide as that clear opening
export const PILLAR = 0.86;
// lanterns and funnels of fire whose light lies on the water (the sea's shader mirrors them)
export const NLAMP = 24, NFUN = 6;
// the bergs whose places the sea's own face takes (the great bergs of the ice sea and the squall's)
export const NBERG = 12;
// The sky is a ceiling CEIL m up that reads the table at the z where a ray meets it, so the next sea's light stands
// ahead and the last astern; low on the sky the light of the sea 300 m on in that direction. Doors of pale gold are
// discs in the ceiling over the star islands. skyCol(dir, from, detail): detail 1 adds star points.
export const GLSL_SKY = /* glsl */`
uniform vec4 uDoors[${NDOOR}]; uniform vec4 uDoorK[${NDOOR}]; uniform vec4 uSunA; uniform vec4 uSunB; uniform vec3 uDogA; uniform vec3 uDogB; uniform vec3 uDawn; uniform vec4 uFire; uniform float uFlash; uniform vec2 uSquall; uniform float uWall; uniform vec4 uFar; uniform vec4 uRed; uniform vec4 uSunSea;
float skyStars(vec3 d){
  vec3 p = d * 150., c = floor(p), f = fract(p); vec3 o = hash33(c) * .7 + .15;
  float r = length(f - o), b = hash13(c + 7.3);
  float tw = .7 + .3 * sin(uTime * (.4 + b * .9) + b * 40.);
  return smoothstep(.085, .02, r) * step(.62, b) * (b * b) * 3.2 * tw;
}
// A SUN STANDS IN ITS OWN SEA'S SKY AT ONE STRENGTH, FOR EVER, AND IS SEEN FROM ANY SEA; ONLY THE WEATHER BETWEEN
// THE EYE AND IT DIMS IT. A disc's strength is a constant of its own sea (sun.w; the cloud that stands over that sea
// is in the constant: the disc's own dull colour; the suns stand low, under the ceiling, and a ray at their
// heights has not climbed to the ceiling in the length of the voyage to their seas, so no other sea's cloud
// stands between and the sky's cloud cover takes nothing of them). What a place sees of it is that constant
// times what the table's summed fog lets through between that place and the nearest metre of the sun's own sea
// (sea: that sea's first and last metre between its joins), WHICHEVER WAY THAT SEA LIES: the sun is a thing of its
// sea. From before its sea the ray toward it runs on up the voyage into that sea's clear air; inside it nothing is
// between; from beyond it the sun is still held to stand in that sea's sky, and the air counted is the air the
// place has between itself and that sea, astern. The depth is the summed row between the two voyage metres, taken
// along the ray (metres of ray to a metre of voyage in the sun's bearing), as the doors take the squall's and the
// red wall's air: here every air of the table counts, haze, dawn, mist, squall and wall alike. One value for the
// disc, its glow and its mock suns. The table holds no weight of a sun to be read at or ahead of whoever looks
// (row 11 keeps one weight, the roads of the two mock suns on the ice sea's water, read at the water's own place:
// a road on the water is the water's): nothing comes on, there is only air between.
float sunSeen(vec4 sun, vec2 sea, float fs){
  return sun.w * exp(-abs(seaRowS(9., clamp(fs, sea.x, sea.y)).a - seaRowS(9., fs).a) / max(abs(sun.z), .02));
}
// A MOCK SUN IS A SOFT PATCH ON THE RING AND HAS NO DISC. It lies where the ring (22 degrees from the white sun)
// passes the mock sun's own bearing: longer along the ring than across it (3 by 1.5 degrees to half strength), its
// brightest part a sixteenth of the white sun's disc; pale red-brown on its inner edge, toward the sun, white in its
// middle, and bluish white in a faint tail that runs out away from the sun (3 degrees to 1/e). ONE LAW WHEREVER
// A MOCK SUN IS DRAWN (the open sky and what mirrors it, the squall's cloud); what a place sees of it is the white
// sun's own sunSeen. cb: the cosine of the angle from the white sun; al2: mockAl2 below.
vec3 mockSun(float cb, float al2){
  float rho = (.927 - cb) / .375, core = exp(-min(rho * rho / .000247 + al2 / .000987, 30.));
  float tail = smoothstep(0., .02, rho) * exp(-min(max(rho, 0.) / .055 + al2 / .0005, 30.));
  vec3 tint = mix(mix(vec3(1., .95, .86), vec3(1., .62, .4), smoothstep(-.004, -.022, rho)), vec3(.8, .88, 1.), smoothstep(.004, .03, rho));
  return tint * (.34 * core + .1 * tail);
}
// (the square of the angle, in radians, that a ray lies ALONG the ring from a mock sun's bearing: its angle from
// that bearing less its part across the ring)
float mockAl2(vec3 dir, vec3 dog, float cb){
  float c0 = dot(dog, uSunB.xyz), rd = (c0 - cb) / sqrt(max(1. - c0 * c0, .01));
  return max(2. * (1. - dot(dir, dog)) - rd * rd, 0.);
}
// A PATCH LIES ON ITS AIR AND IS NO LIGHT OF ITS OWN: what a mock sun adds to the air it is drawn on (the open sky,
// the squall's cloud) is never more than that air's own lightness at its place, so a patch at the most doubles
// the air it lies on: whole on the ice sea's pearl, a faint paling on the squall's dark cloud. ONE LAW FOR EVERY AIR.
vec3 mockOn(vec3 air, vec3 lit){
  return lit * min(1., dot(air, vec3(.3, .5, .2)) / max(dot(lit, vec3(.3, .5, .2)), 1e-4));
}
// reach: how the squall closes the sky. 0: closed at the squall's middle (no light of the seas beyond it);
// 1: open beyond it; under 0: the place's own, BY THE SQUALL'S AIR BEFORE THE EYE (below)
vec3 skyColR(vec3 dir, vec3 from, float detail, float reach){
  float e = max(dir.y, 0.); vec2 h = dir.xz / max(length(dir.xz), 1e-4);
  float tn = max(e, .04) / sqrt(max(1. - e * e, 1e-4));
  // the colour of the sky is that of the sea a little way on in that direction: 26 m of rise to a metre of table
  float run = 240. * (1. - exp(-26. / tn / 240.));
  // (the edge of the bay of night is wide in the sky and torn like cloud: the place read wanders sideways with a
  // noise of the direction, so no edge stands straight up the sky)
  vec2 wq = vec2(-h.y, h.x) * ((fbmLo(h * 2.2 + vec2(e * 5., 0.)) - .5) * 220.);
  float s = seaSW(from.xz + h * run + wq, 260.), s2 = seaSW(from.xz + h * run * .6 + wq * .6, 260.), s3 = seaSW(from.xz + h * run * .25 + wq * .25, 260.);
  // THE SQUALL AND THE RED WALL CLOSE THE VIEW AS WEATHER DOES. The sky is found twice: closed (nothing of the
  // table beyond the squall's middle is read) and open (read as far as the red wall's far face; beyond the
  // wall's own colour as wide as the weather is deep: the reach grows to the whole table by what the red air
  // between the place the sky is seen from and that air's far end lets through, the summed fog). The two are
  // mixed by what the squall's air between the eye and the wall's near face lets through (the summed fog): so
  // the red sky comes up through the squall as that air thins before the eye, with no step at any place.
  float fs = -from.z, open = max(uWall - 5., fs) + 400. * exp(-max(seaRowS(9., uRed.z).a - seaRowS(9., clamp(fs, uRed.x, uRed.z)).a, 0.));
  float w = reach < 0. ? exp(-max(seaRowS(9., uRed.x).a - seaRowS(9., min(fs, uRed.x)).a, 0.)) : reach;
  float sc = min(s, uSquall.x), sc2 = min(s2, uSquall.x), sc3 = min(s3, uSquall.x); s = min(s, open); s2 = min(s2, open); s3 = min(s3, open);
  // one graded dome: the mean of the seas from here to the reach in that direction, the far one's low light on the sea-line
  vec4 hi = mix(seaRowS(4., sc) + seaRowS(4., sc2) + seaRowS(4., sc3), seaRowS(4., s) + seaRowS(4., s2) + seaRowS(4., s3), w) / 3.;
  vec4 lo = mix(.5 * seaRowS(5., sc) + .3 * seaRowS(5., sc2) + .2 * seaRowS(5., sc3), .5 * seaRowS(5., s) + .3 * seaRowS(5., s2) + .2 * seaRowS(5., s3), w);
  // THE WEATHER OF THE SKY ITSELF (the table's row 11: the fire, the lightning) BY THE SKY'S OWN
  // WEIGHTS: read at the same places of the table as the sky's colour in this direction and mixed as that colour
  // is (the low light's weights near the sea-line, the dome's mean higher up). So the fire lies along the blue
  // sea's sea-line and the lightning lights the squall's own cloud, as the dome's colours lie: THE DOME'S OWN LAW,
  // for what is the sky's own colour. (The two suns are no part of it: sunSeen, above.)
  vec4 e1 = seaRowS(11., sc), e2 = seaRowS(11., sc2), e3 = seaRowS(11., sc3), e4 = seaRowS(11., s), e5 = seaRowS(11., s2), e6 = seaRowS(11., s3);
  vec4 ev = mix(mix(.5 * e1 + .3 * e2 + .2 * e3, .5 * e4 + .3 * e5 + .2 * e6, w), mix(e1 + e2 + e3, e4 + e5 + e6, w) / 3., 1. - exp(-e * 5.));
  s = mix(sc, s, w);
  vec2 qc = from.xz + h * min(380. / tn, 5000.);
  float cl = fbmLo(qc * vec2(.0023, .0046) + vec2(uTime * .004, 0.));
  float cov = smoothstep(.62 - .5 * lo.a, .95 - .5 * lo.a, cl + .25 * lo.a);
  vec3 top = mix(hi.rgb, mix(hi.rgb * .5, lo.rgb * 1.05 + hi.rgb * .25, cl * cl), cov * .85);
  top += uFlash * ev.a * vec3(.55, .65, 1.) * (.35 + cov) * smoothstep(60., 0., abs(s - uSquall.x) - uSquall.y);
  // far lightning: the cloud round the stroke's own place lights up
  { vec2 fd = (qc - uFar.xy) / 300.; top += uFar.z * vec3(.5, .62, 1.) * (.25 + cov) * exp(-min(dot(fd, fd), 30.)); }
  float up = 1. - exp(-e * 5.);
  vec3 col = mix(lo.rgb, top, up);
  // THE ICE SEA'S SKY IS GRADED BY THE WHITE SUN'S BEARING AND BY HEIGHT. Its pearl is the table's (rows 4 and 5);
  // the grade is a share of that pearl, weighed by the table's own weight of the ice sea at the sky's place in
  // this direction (ev.y, row 11: whole over the ice sea, nothing over any other), so it comes and goes through
  // that sea's joins as its sky does and no other sea's sky takes any of it. Low and toward the white sun's
  // bearing the pearl is warmed (a sixth more red, a quarter less blue: a low sun's own band, whole within some 20
  // degrees of the bearing, gone 70 degrees off it); round from there, on the ice front's hand and astern, it is
  // cooler and deeper (to two thirds); overhead it is deepest and bluest (to a half). So white ice in the
  // sun stands against a sky darker than itself overhead and on the ice's hand.
  { float sunW = smoothstep(.35, .95, dot(h, uSunB.xz / max(length(uSunB.xz), 1e-3)));
    col *= mix(vec3(1.), mix(mix(vec3(.66, .76, .93), vec3(1.16, 1., .72), sunW), vec3(.52, .65, .9), up), ev.y); }
  if (detail > .5) col += skyStars(dir) * hi.a * up * (1. - cov);
  float runFull = (${CEIL.toFixed(1)} - min(from.y, 400.)) / max(e, .012) * sqrt(max(1. - e * e, 0.));
  // doors
  vec2 dh = from.xz + h * min(runFull, 4200.); float door = 0.;
  float halo = 0.;
  // each door is a rent torn in the night: its outline its own (stretched and turned, ragged by noise), a lit torn
  // rim, and through it a brighter sky thick with stars
  float rim = 0., dseed = 0.;
  for (int i = 0; i < ${NDOOR}; i++){ vec4 D = uDoors[i], K = uDoorK[i]; vec2 dq = dh - D.xy, dl = vec2(dq.x * K.x + dq.y * K.y, dq.y * K.x - dq.x * K.y) * vec2(K.z, 1. / max(K.z, .2));
    float q0 = length(dq) / max(D.z, 1.), q = length(dl) / max(D.z, 1.);
    if (q0 < 2.6){ q += (fbmLo(dq * .021 + K.w) - .5) * .95 + (vnoise(dq * .083 + K.w * 1.7) - .5) * .3;
      float rent = D.w * smoothstep(1., ${PILLAR.toFixed(2)}, q); if (rent > door){ door = rent; dseed = K.w; }
      rim = max(rim, D.w * smoothstep(.1, 0., abs(q - .95))); }
    halo += D.w * exp(-q0 * q0 * .7); }
  // A DOOR STANDS OPEN ALWAYS. It is closed to a ray only by weather: by the depth of the squall's and the red
  // wall's air along the ray from the place it is seen from to the ceiling (the table's summed fog between the
  // two voyage metres, within the stretch where that weather stands; metres of ray to a metre of voyage as the
  // red air takes them). From the blue sea on, no such air lies on the way.
  float w0 = uSquall.x - uSquall.y - ${JOIN.toFixed(1)}, wa = clamp(fs, w0, uRed.z), wb = clamp(-dh.y, w0, uRed.z);
  float seen = step(runFull, 4200.) * smoothstep(.0, .05, e) * exp(-abs(seaRowS(9., wb).a - seaRowS(9., wa).a) / max(abs(dir.z), .02));
  vec3 through = vec3(.08, .15, .5) * (.6 + .8 * fbmLo(dh * .011 + dseed)) + vec3(.12, .1, .04);
  if (detail > .5) through += (skyStars(dir * 1.9 + dseed) * 4. + skyStars(dir * .8 - dseed) * 6.) * vec3(1., .95, .8);
  col = mix(col, through, door * seen) + vec3(1.2, .92, .44) * rim * (1. - door * .5) * seen + vec3(.36, .27, .13) * min(halo, 1.5) * .3 * seen;
  // the low blotted sun of the violet sea, the small white sun of the ice sea
  float ca = dot(dir, uSunA.xyz), evA = sunSeen(uSunA, uSunSea.xy, fs), evB = sunSeen(uSunB, uSunSea.zw, fs);
  if (evA > .001){
    float disc = smoothstep(.99905, .99935, ca);
    vec2 sp = (dir.xy - uSunA.xy) * 60. + dir.z * 13.; float blot = smoothstep(.52, .7, vnoise(sp * 1.7 + 3.)) * .9 + smoothstep(.6, .8, vnoise(sp * 4.3)) * .5;
    col = mix(col, vec3(3.4, .95, .28) * (1. - clamp(blot, 0., .93)), disc * evA);
    col += vec3(1.1, .32, .12) * evA * (pow(clamp(ca, 0., 1.), 60.) * .5 + pow(clamp(ca, 0., 1.), 900.) * .9) * (1. - disc);
  }
  float cb = dot(dir, uSunB.xyz);
  if (evB > .001){
    // THE RING IS A SHARE OF THE SKY IT STANDS ON: 22 degrees about the white sun the sky's own colour at that
    // place is lifted by a share (a tenth; 0.18 beside the two mock suns and over the ring's top; nothing at the
    // sea-line, whole from some 7 degrees up), so the ring is rose on a rose sky and pale on a pale one, and on
    // a dark sky there is next to nothing of it. It goes with the white sun by the sun's own law (evB).
    float ring = (clamp(cb, 0., 1.) - .927) / .011, alA = mockAl2(dir, uDogA, cb), alB = mockAl2(dir, uDogB, cb);
    float share = (.1 + .08 * max(max(exp(-min(alA / .02, 30.)), exp(-min(alB / .02, 30.))), smoothstep(uSunB.y + .18, uSunB.y + .34, dir.y))) * smoothstep(0., .12, dir.y);
    col *= 1. + evB * share * exp(-min(ring * ring, 30.));
    col += evB * (vec3(5., 5.2, 5.6) * smoothstep(.99982, .99992, cb) + vec3(.55, .58, .64) * pow(clamp(cb, 0., 1.), 220.) + vec3(.2, .22, .26) * pow(clamp(cb, 0., 1.), 24.));
    // two mock suns stand 22 degrees to either side of it at its own height, on the ring: soft patches, no discs
    col += mockOn(col, evB * (mockSun(cb, alA) + mockSun(cb, alB)));
  }
  // THE DAWN STANDS IN ITS JOIN: a slab of pale light across the voyage, 2 x JOIN m thick about the join's own place
  // (uDawn.x, a voyage metre), thinning upward (1/e at 10 m). A ray takes of it what lies beyond the eye along that
  // ray, at the height where the ray meets the slab; it is dimmed by the haze the table holds between (row 9) and
  // by its range (1/e at 120 m, half the sky's own reach). So it is a light ahead from the seas before it, all
  // round within it, and astern beyond it; brightest toward the low sun's hand (uDawn.y).
  { float az = max(abs(dir.z), .2), dzs = (-uDawn.x - from.z) * (dir.z < 0. ? -1. : 1.), tm = (max(dzs, 0.) + ${(0.4 * JOIN).toFixed(1)}) / az;
    float slab = smoothstep(${(-JOIN).toFixed(1)}, ${JOIN.toFixed(1)}, dzs) * exp(-max(from.y + e * tm, 0.) / 10.);
    float haze = exp(-abs(seaRowS(9., uDawn.x).a - seaRow(9., from.z).a) / az - min(tm, 3000.) / 120.);
    col += vec3(1., .9, .69) * uDawn.z * slab * haze * (.6 + .4 * smoothstep(-.3, .9, h.x * uDawn.y)); }
  // fire low along the sea-line to port and starboard
  float fl = vnoise(vec2(atan(h.x, -h.y) * 26., uTime * .7)) * .6 + vnoise(vec2(atan(h.x, -h.y) * 71., uTime * 1.6)) * .4;
  col += uFire.rgb * ev.z * exp(-e / (.02 + .032 * fl)) * (1. - seaNightW(from.xz + h * 650., 150.)) * (.5 + 1.1 * fl);
  return col;
}
vec3 skyCol(vec3 dir, vec3 from, float detail){ return skyColR(dir, from, detail, -1.); }
`;

// THE RED WALL'S AIR as a ray sees it. The wall is weather: red air by world place (the table's fog), from its near
// face (uRed.x) to where the blue sea's air begins (uRed.z), up to its ragged top (uRed.w m). Its cloud (red folds,
// gold patches that crawl, a few smears of clear blue) is a pattern of the place, of one size and one strength in
// world metres. A ray shows the cloud AT THE PLACE WHERE THE DEPTH OF RED AIR ALONG IT REACHES ONE (or half of all
// the red air it meets, where that is less), found on the table's summed fog; and it shows of that cloud
// the share the whole depth of red air along the ray gives. So the wall is a wall from outside, air all round from
// inside, and thins away with the air itself; nothing in it reads how far the eye is from anything.
// Returns (the cloud's colour, its share). WALL_CELLS: gold cells to a unit of the pattern (a cell is an eighth of a metre).
export const WALL_CELLS = 160;
export const GLSL_REDAIR = /* glsl */`
uniform vec2 uWallOff;
// cells in space: (distance to the nearest cell wall, the cell's own number)
vec2 wallCells(vec3 x){
  vec3 n = floor(x), f = fract(x), r1 = vec3(8.), r2 = vec3(8.); float d1 = 64., d2 = 64., id = 0.;
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec3 g = vec3(float(i), float(j), float(k)), r = g + hash33(n + g) - f; float d = dot(r, r);
    if (d < d1){ d2 = d1; r2 = r1; d1 = d; r1 = r; id = hash13(n + g + 17.3); } else if (d < d2){ d2 = d; r2 = r; }
  }
  return vec2(dot(.5 * (r1 + r2), normalize(r2 - r1)), id);
}
vec4 redAir(vec3 eye, vec3 dir){
  float se = -eye.z, ds = -dir.z, k = 1. / max(abs(ds), .02);
  float s0 = clamp(se, uRed.x, uRed.z), sX = ds > 0. ? uRed.z : uRed.x, o0 = seaRowS(9., s0).a, tot = abs(seaRowS(9., sX).a - o0), tau = tot * k;
  // the place one depth along the ray (half the whole where the air is thinner than two): eight places across
  // the red air are tried, then one straight step between the two that hold it (no jump from ray to ray)
  float want = min(1., .5 * tau) / k, a = s0, fa = 0., b = sX, fb = tot;
  for (int i = 1; i < 8; i++){ float m = mix(s0, sX, float(i) / 8.), fm = abs(seaRowS(9., m).a - o0); if (fm < want){ a = m; fa = fm; } else if (abs(m - s0) < abs(b - s0)){ b = m; fb = fm; } }
  float sp = a + (b - a) * clamp((want - fa) / max(fb - fa, 1e-6), 0., 1.);
  vec3 p = eye + dir * (abs(sp - se) * k);
  // (the pattern shifts a little across with depth into the wall)
  vec2 w = p.xy - p.z * vec2(.06, .04);
  float c1 = fbm(vec2(w.x * .018 + uTime * .01, w.y * .03) + uWallOff), c2 = fbmLo(vec2(w.x * .05 - uTime * .035, w.y * .06 + uTime * .02));
  vec3 red = mix(vec3(.3, .02, .01), vec3(.8, .1, .03), c1) * (.75 + .5 * c2);
  // the lichens of sun: patches some 30 m across, each a crust of blots a few metres across made of small cells
  // (an eighth of a metre, cells in space: of one shape from every side; from inside the wall, where the pattern
  // stands a depth off, hundreds are in view and never a few great ones)
  vec3 gp = vec3(w.x * .05 + uTime * .03, w.y * .06 - uTime * .012, p.z * .055) + vec3(c1 * .6, c1 * .6, 0.), xc = gp * ${WALL_CELLS.toFixed(1)} + fbmLo(gp.xy * 9.) * 1.6; vec2 cell = wallCells(xc);
  // (anti-aliasing: where a cell is smaller than a pixel or two of the picture it is drawn as the mean of cells,
  // so the far crust is a glow and never a dust of sparks)
  float mean = smoothstep(.4, 1.2, length(fwidth(xc))), edge = mix(smoothstep(.03, .16, cell.x), .7, mean), id = mix(cell.y, .5, mean);
  float gold = smoothstep(.5, .62, fbm(gp.xy)) * smoothstep(.3, .5, fbm(gp * 5. + 3.7)) * edge * (.5 + .5 * id) * smoothstep(.2, .5, vnoise(gp * 31.) + id * .5);
  red = mix(red, mix(vec3(.9, .34, .04), vec3(1.3, .86, .2), id), gold);
  float blue = smoothstep(.68, .76, fbmLo(vec2(w.x * .009 + 7.3, w.y * .028 + 2.1) + uWallOff.yx));
  red = mix(red, vec3(.2, .62, 1.05), blue);
  // THE WALL'S CLOUD STANDS IN ITS NEAR HALF, toward the squall: over the 5 m before the wall's middle (by the
  // place in the wall the ray shows, the same for every eye) folds, lichens and smears go into the plain colour of
  // the red air, and beyond the middle the air is plain. So what stands beyond the wall looms out of one colour,
  // the same that fogs it, and the backstop at the middle is crossed with nothing to show for it.
  // THE WALL'S FOOT IS THE SEA'S PLAIN VAPOUR, by the height over the mean sea of the place in the wall the ray
  // shows (world metres, the same for every eye and from either side): plain under 3 m, the cloud whole from 6 m
  // up. So the wall meets the water in the one colour that fogs the water, and no line stands at the sea's rim.
  // THE PLAIN COLOUR IS THE FOLDED AIR'S (redFold, with the seas' GLSL), read from the same place and by the same
  // share as the fog of a thing far off along this ray (seaFogCol: the place near the eye where that fog is
  // seen, the red air's share of the air there, the depth of red air along the ray), so that a thing lost in
  // the red air is lost in this cloud and stands on it as no shape. (eye is the camera's place in every call.)
  vec3 off = cameraPosition + dir * 3000., fp = mix(cameraPosition, off, seaFogAt(cameraPosition.z, off.z, seaDepth(off)));
  vec3 air = seaRowS(6., sp).rgb; float wf = smoothstep(.09, .25, seaAt(6., fp.xz).a) * smoothstep(1., 3., tau);
  if (wf > .004) air = mix(air, redFold(air, dir), wf);
  red = mix(red, air, max(smoothstep(uRed.y - 5., uRed.y, sp), 1. - smoothstep(3., 6., p.y)));
  float rag = fbmLo(vec2(p.x * .012, uTime * .02)) * 46.;
  return vec4(red, (1. - exp(-tau)) * smoothstep(uRed.w, uRed.w - 70., p.y + rag));
}
`;

export function skyUniforms() {
  return { uDoors: { value: Array.from({ length: NDOOR }, () => new THREE.Vector4(0, 0, 1, 0)) }, uSunA: { value: new THREE.Vector4(0, 0.07, -1, 0) }, uSunB: { value: new THREE.Vector4(0, 0.2, -1, 0) },
    uDawn: { value: new THREE.Vector3(1e6, 1, 0) }, uFire: { value: new THREE.Vector4(1, 0.2, 0.03, 0) }, uFlash: { value: 0 }, uSquall: { value: new THREE.Vector2(735, 20) }, uWall: { value: 775 }, uRed: { value: new THREE.Vector4(1e6, 1e6, 1e6 + 1, 170) }, uWallOff: { value: new THREE.Vector2(0, 0) },
    uSunSea: { value: new THREE.Vector4(0, 0, 0, 0) }, uDoorK: { value: Array.from({ length: NDOOR }, () => new THREE.Vector4(1, 0, 1, 0)) }, uDogA: { value: new THREE.Vector3(0.37, 0.2, -0.9) }, uDogB: { value: new THREE.Vector3(-0.37, 0.2, -0.9) }, uFar: { value: new THREE.Vector4(0, 0, 0, 0) } };
}

// the dome: one sphere on the far plane round whichever camera draws it
export function makeSkyDome(U) {
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: U,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: fx.GLSL_NOISE + GLSL_SEAS + GLSL_SKY + GLSL_REDAIR + /* glsl */`varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); vec3 c = skyCol(d, cameraPosition, 1.); if (d.y < 0.) c = mix(c, seaAt(6., cameraPosition.xz + d.xz / max(length(d.xz), 1e-4) * 300.).rgb, smoothstep(0., -.08, d.y));
        // THE RED WALL IS WEATHER: for an eye that stands in its air the sky is seen through what is left of that air
        // along the ray, so the sky comes clear as the air thins (the same law as the wall's backstop: redAir)
        float se = -cameraPosition.z;
        if (se > uRed.x && se < uRed.z){ vec4 ra = redAir(cameraPosition, d); c = mix(c, ra.rgb, ra.a); }
        gl_FragColor = vec4(c, 1.); }` });
  // (the colour is found from the ray alone, so the dome needs no finer mesh)
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), mat); mesh.renderOrder = -10; mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------ the sea
// fine waves for the normal only (wavelength m, heading, slope), written out so that no loop reads a derivative
const FINE = Array.from({ length: 8 }, (_, j) => [4.9 * Math.pow(0.71, j), 0.3 + (((j * 2.39996) % 3.4) - 1.7) * (0.55 + 0.06 * j), 0.07 + 0.017 * j, j * 1.7]);
const f3 = (v) => v.toFixed(4);
const GLSL_SWELL = SWELLS.map(([l, th, a, ph], i) => {
  const k = 2 * Math.PI / l, w = Math.sqrt(G * k);
  return `{ float p = ${f3(k)} * dot(vec2(${f3(Math.sin(th))}, ${f3(Math.cos(th))}), xz) - ${f3(w)} * uTime + ${f3(ph)}; float f = FADE(${f3(l)}); h += A * ${f3(a)} * sin(p) * f; sl += vec2(${f3(Math.sin(th))}, ${f3(Math.cos(th))}) * (A * ${f3(a * k)} * cos(p) * f); }`;
}).join('\n');
const GLSL_FINE = FINE.map(([l, th, sl, ph]) => {
  const k = 2 * Math.PI / l, w = Math.sqrt(G * k);
  return `{ float p = ${f3(k)} * dot(vec2(${f3(Math.sin(th))}, ${f3(Math.cos(th))}), xz) - ${f3(w)} * uTime + ${f3(ph)}; sl += vec2(${f3(Math.sin(th))}, ${f3(Math.cos(th))}) * (chop * ${f3(sl * 0.62)} * cos(p) * FADE(${f3(l)})); }`;
}).join('\n');
// the rollers' profile and its slope along the voyage, from the seven extrema (uExt): peaked crests over long troughs
const GLSL_ROLL = /* glsl */`
uniform vec2 uExt[7]; uniform vec3 uRollPh;
// (height, its slope along the voyage, its slope across): the crest line wanders and heaves across the voyage
vec3 roller(vec2 xz){
  float ax = abs(xz.x), tk = clamp((ax - ${ROLL_FLAT.toFixed(1)}) / 58., 0., 1.), wk = tk * tk * (3. - 2. * tk), dwk = 6. * tk * (1. - tk) / 58. * sign(xz.x);
  float wv = 11. * sin(xz.x * .019 + uRollPh.x) + 6. * sin(xz.x * .047 + uRollPh.y);
  float dw = dwk * wv + wk * (.209 * cos(xz.x * .019 + uRollPh.x) + .282 * cos(xz.x * .047 + uRollPh.y));
  float hv = 1. + wk * (.2 * sin(xz.x * .031 + uRollPh.z) + .13 * sin(xz.x * .083 + uRollPh.x * 2.) - .08);
  float s = -xz.y + wk * wv, h = 0., d = 0.;
  for (int i = 0; i < 6; i++){ vec2 a = uExt[i], b = uExt[i + 1]; if (s > a.x && s <= b.x){ float w = b.x - a.x, t = (s - a.x) / w, c = .5 - .5 * cos(3.14159 * t), dc = .5 * 3.14159 * sin(3.14159 * t) / w;
      float up = step(a.y, b.y), q = mix(1. - c, c, up); h = min(a.y, b.y) + abs(b.y - a.y) * q * q; d = abs(b.y - a.y) * 2. * q * dc * (up * 2. - 1.); } }
  float env = 1. - smoothstep(150., 200., ax);
  return vec3(h, d, d * dw) * (hv * env);
}`;

const SEA_VERT = /* glsl */`
uniform vec2 uCenter; varying vec3 vWp; varying vec2 vXZ; varying float vH;
` + GLSL_SEAS + GLSL_ROLL + /* glsl */`
#define FADE(l) (1. - smoothstep(l * .25, l * .5, sp))
void main(){
  vec2 xz = position.xz + uCenter; float sp = .088 * length(position.xz);
  float A = seaAt(0., xz).a, h = 0.; vec2 sl = vec2(0.);
  ${GLSL_SWELL}
  vec3 r = roller(xz);
  vXZ = xz; vH = h;
  // the top of a roller leans back against the river's run (a lip): the water above 0.55 of the lowest crest is
  // carried up to 1.7 m upstream
  float lip = smoothstep(1.2, 2.3, r.x); lip *= lip * 1.7;
  vWp = vec3(xz.x - sl.x * 1.6, h + r.x, xz.y - sl.y * 1.6 + lip);
  gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.);
}`;

const SEA_FRAG = fx.GLSL_NOISE + GLSL_SEAS + GLSL_SKY + GLSL_ROLL + /* glsl */`
uniform vec4 uBoat; uniform vec4 uBow; uniform float uBoatK;
uniform vec4 uLampP[${NLAMP}]; uniform vec4 uLampC; uniform vec4 uFunP[${NFUN}]; uniform vec2 uReef;
uniform vec4 uBerg[${NBERG}]; uniform vec4 uBergK[${NBERG}]; uniform vec2 uBergS;
varying vec3 vWp; varying vec2 vXZ; varying float vH;
#define FADE(l) smoothstep(l * .55, l * .2, fp)
// sharp points lying under the surface, in cells of 'cell' metres; fp is the pixel's footprint in metres
float pointLayer(vec2 uv, float cell, float seed, float fp){
  vec2 g = uv / cell, c = floor(g), f = fract(g); vec2 o = hash22(c + seed) * .7 + .15; float b = hash12(c + seed + 3.1);
  float rad = .032 + .034 * b, px = fp / cell, r = length(f - o);
  float tw = .65 + .35 * sin(uTime * (.5 + b) + b * 31.);
  return smoothstep(rad + px, rad * .35, r) * min(1., rad * rad / max(px * px, 1e-5)) * step(.4, b) * tw;
}
void main(){
  vec2 xz = vXZ; vec3 wp = vWp;
  float fp = max(length(dFdx(xz)), length(dFdy(xz)));
  vec3 toEye = cameraPosition - wp; float dist = length(toEye); vec3 v = toEye / max(dist, 1e-3);
  // the join between two seas wanders: tongues of one water in the other
  float zt = seaS(xz + vec2(0., (fbmLo(xz * .011 + vec2(0., uTime * .006)) - .5) * 44.));
  vec4 deep = seaRowS(0., zt), crest = seaRowS(1., zt), foamR = seaRowS(2., zt), glow = seaRowS(3., zt), misc = seaRowS(7., zt), key = seaRowS(8., zt);
  vec3 amb = seaRowS(10., zt).rgb; vec3 kd = seaRowS(9., zt).xyz; kd /= max(length(kd), 1e-3);
  // rougher and calmer patches wander over every sea
  float A = seaAt(0., xz).a, chop = misc.a * (.5 + 1.0 * vnoise(xz * .043 + vec2(uTime * .012, -uTime * .008))), h = 0.; vec2 sl = vec2(0.);
  ${GLSL_SWELL}
  ${GLSL_FINE}
  vec3 rl = roller(xz); sl.y -= rl.y; sl.x += rl.z;
  // two layers of ripples that keep their size in metres
  float rf = FADE(1.2);
  // (each layer drawn out across its own heading, so the bumps are short crests and not scales)
  vec2 q1 = vec2(xz.x * .8 + xz.y * .25, xz.y * 1.9 - xz.x * .3) + vec2(uTime * .23, -uTime * .31), q2 = vec2((xz.x - xz.y) * 1.5, (xz.x + xz.y) * 3.6) - vec2(uTime * .41, uTime * .19);
  vec2 q0 = vec2(xz.x * .3 - xz.y * .12, xz.y * .7 + xz.x * .1) + vec2(-uTime * .11, uTime * .17);
  sl += (vec2(vnoise(q1 + vec2(.3, 0.)) - vnoise(q1 - vec2(.3, 0.)), vnoise(q1 + vec2(0., .3)) - vnoise(q1 - vec2(0., .3))) * .15
       + vec2(vnoise(q2 + vec2(.3, 0.)) - vnoise(q2 - vec2(.3, 0.)), vnoise(q2 + vec2(0., .3)) - vnoise(q2 - vec2(0., .3))) * .1) * foamR.a * rf
     + vec2(vnoise(q0 + vec2(.3, 0.)) - vnoise(q0 - vec2(.3, 0.)), vnoise(q0 + vec2(0., .3)) - vnoise(q0 - vec2(0., .3))) * .2 * chop * FADE(3.2);
  vec3 n = normalize(vec3(-sl.x, 1., -sl.y));
  float nv = clamp(dot(n, v), 0., 1.);
  float rough = 1. - smoothstep(.05, 3., fp);
  float fres = (.02 + .98 * pow(1. - nv, 5.)) * mix(1., .22, misc.b) * mix(1., .4, misc.g) * mix(.55, 1., rough);
  vec3 r = reflect(-v, n); r.y = max(abs(r.y), .13); r = normalize(r);
  vec3 sky = skyCol(r, wp, 0.);
  // the body of the water: dark in the trough, the crest's colour where it is thin and where a face turns to the eye
  float hn = clamp(h / max(A, .05) * .5 + .5, 0., 1.), face = smoothstep(0., .35, dot(n.xz, v.xz));
  float thin = clamp(hn * hn * .35 + hn * face * .5, 0., 1.);
  vec3 body = mix(deep.rgb, crest.rgb, thin * .85) + glow.rgb * (.55 + .45 * hn);
  // a roller is a body: its faces shaded by the key that stands beyond the crest, its trough dark, and the light
  // coming through its top third where the eye looks toward the key
  float onRoll = step(1e-3, abs(rl.x) + abs(rl.y));
  float rkk = clamp(rl.x / 2.4, -1., 1.), rtop = smoothstep(.3, 1., rkk);
  vec3 nr = normalize(vec3(-rl.z * 2.5, 1., rl.y * 2.5));
  float rlit = smoothstep(.3, .95, dot(nr, kd)), back = smoothstep(-.3, .7, dot(-v.xz, kd.xz) / max(length(kd.xz), 1e-3));
  body = mix(body, body * mix(.42, 1.12, rlit) * (1. - .4 * smoothstep(0., -1., rkk)) + crest.rgb * rtop * rtop * (.3 + .75 * back), onRoll);
  // under the surface: star points, rainbow bands, phosphorus
  vec2 par = v.xz / max(v.y, .18);
  float isl = 0.;
  for (int i = 0; i < ${NISL}; i++){ vec4 I = uIsl[i]; isl = max(isl, step(1., I.z) * smoothstep(1.25, .55, length(xz - I.xy) / max(I.z, 1.))); }
  float under = max(glow.a, isl), near = smoothstep(120., 30., dist);
  vec2 dr = vec2(sin(uTime * .05), cos(uTime * .04)) * 2.;
  float pts = pointLayer(xz - par * .8 + dr, 1.15, 1., fp) + .7 * pointLayer(xz - par * 2.2 - dr, 1.9, 5., fp) + .45 * pointLayer(xz - par * 4. + dr.yx, 3.1, 9., fp);
  vec3 gold = mix(vec3(1.6, 1.25, .62), vec3(1.3, 1.35, 1.45), misc.b);
  // (far off the points run together into a faint light of their own; the milk sea is lit already and takes less of it)
  vec3 sub = gold * under * (pts * near * 2.2 + (1. - near) * .16 * mix(1., .45, misc.b) + isl * .22);
  // the rainbows under the water: three long soft arcs lying beside the voyage on the open hand, 24, 36 and 52 m
  // wide with the whole spectrum across each, the nearest edge 16 m off, bowing outward as they run on toward the
  // sea-line (wide, because a band on the water is seen edge on from a boat)
  if (misc.r > .003){
    float off = uBow.z * (xz.x - uBow.x) + (vnoise(xz * .02 + uTime * .03) - .5) * 5., ds = -xz.y - uBow.y; vec3 arcs = vec3(0.);
    for (int i = 0; i < 3; i++){ float fi = float(i), hw = 12. + 6. * fi + 2. * fi * fi, c = 28. + 42. * fi + 12. * fi * fi + (.00016 + .00009 * fi) * ds * ds, t = (off - c) / hw;
      arcs += clamp(.55 + .6 * cos(6.2832 * (t * .36 + vec3(0., .33, .67))), 0., 1.2) * smoothstep(1., .55, abs(t)); }
    sub += arcs * misc.r * 1.6 * (.7 + .3 * vnoise(xz * .7 + uTime * .2));
  }
  float ph = smoothstep(.6, .9, vnoise(xz * .8 + vec2(uTime * .22, 0.))) * smoothstep(.35, .8, vnoise(xz * 4.1 - uTime * .7));
  sub += mix(vec3(1.6, 1.3, .25), vec3(.3, .8, 1.6), smoothstep(.35, .65, vnoise(xz * .21 + uTime * .13))) * ph * misc.g * 2.6 * FADE(2.);
  // the boat's own wash (foam along the hull and a wake astern)
  vec2 bq = xz - uBoat.xy; float lz = dot(bq, uBoat.zw), lx = bq.x * uBoat.w - bq.y * uBoat.z;
  float hw = 2.3 * sqrt(max(1. - pow(clamp((lz - 1.) / 4., 0., 1.), 2.3), 0.));
  float washD = abs(lx) - hw - max(-lz, 0.) * .32;
  float wash = uBoatK * smoothstep(1.6, .0, abs(washD)) * smoothstep(6.8, 4.6, lz) * smoothstep(-70., -4., lz);
  sub += mix(vec3(1.5, 1.25, .25), vec3(.3, .75, 1.5), smoothstep(-2., -30., lz)) * wash * misc.g * 1.2;
  // THE BERGS STAND IN THIS WATER AND THE WATER CARRIES THEM (uBerg: a berg's middle x, z and its half breadth and
  // half length at the waterline; uBergK: the cosine and sine of its turn, its height; a law of the bergs' own
  // places, read only between the first and the last of them along the voyage, uBergS). About each foot the ice
  // that lies under the water shows turquoise through it, out to its own width again beyond the waterline. And
  // where this water's mirrored ray passes a berg below its top, the water shows the berg and not the sky: its
  // shaded side dark blue, its sunlit side pale, broken by the ripples the ray is turned by; no road of light
  // lies on the water there (the suns' roads below are cut by the bergs).
  float bergM = 0., bergSun = 0.;
  if (-xz.y > uBergS.x && -xz.y < uBergS.y){
    vec2 bh = r.xz / max(length(r.xz), 1e-3); float brs = max(length(r.xz), .05), glw = 0.;
    for (int i = 0; i < ${NBERG}; i++){ vec4 B = uBerg[i], K = uBergK[i]; if (B.z < .5) continue;
      vec2 c = wp.xz - B.xy, o = vec2(c.x * K.x - c.y * K.y, c.x * K.y + c.y * K.x) / B.zw, d = vec2(bh.x * K.x - bh.y * K.y, bh.x * K.y + bh.y * K.x) / B.zw;
      glw = max(glw, smoothstep(2., 1., length(o)));
      float ts = -dot(o, d) / max(dot(d, d), 1e-6), y = wp.y + ts * r.y / brs, thin = 1. - .45 * clamp(y / K.z, 0., 1.);
      float m = step(0., ts) * smoothstep(1.05, .8, length(o + d * ts) / thin) * (1. - smoothstep(.85 * K.z, 1.05 * K.z, y));
      if (m > bergM){ bergM = m; bergSun = smoothstep(-.2, .5, dot(-bh, kd.xz / max(length(kd.xz), 1e-3))); } }
    sub += vec3(.06, .5, .46) * glw * glw * (.75 + .25 * vnoise(xz * .9 + uTime * .15));
    sky = mix(sky, mix(vec3(.07, .18, .3), amb * 1.2 + key.rgb * .42, bergSun * .8) * (.82 + .18 * vnoise(vec2(xz.x * 1.7, xz.y * .5 - uTime * .3))), bergM);
  }
  vec3 col = mix(body + sub * (1. - fres * .75), sky, fres);
  // the key's glitter road
  float rk = clamp(dot(r, kd), 0., 1.);
  col += key.rgb * key.a * (pow(rk, 240.) * 3. + pow(rk, 28.) * .1) * rough * (1. - bergM);
  // the two mock suns lay their own roads on the ice sea's water (the table's row at the water's own place, as
  // the key's road is the water's own key): under a soft patch a broad dim glitter, no second sun's bar
  vec4 evw = seaRow(11., xz.y);
  if (evw.y > .001){ float ra = clamp(dot(r, uDogA), 0., 1.), rb = clamp(dot(r, uDogB), 0., 1.);
    col += vec3(.82, .88, 1.) * evw.y * key.a * ((pow(ra, 240.) + pow(rb, 240.)) * .35 + (pow(ra, 40.) + pow(rb, 40.)) * .1) * rough * (1. - bergM); }
  // the mirrored view ray of this water against each lantern: a road of light that lies from under the lamp toward
  // whoever looks, drawn out up and down by the ripples' slopes and wavering with them
  vec3 rm = vec3(-v.x, v.y, -v.z); float rml = max(length(rm.xz), 1e-3);
  if (-xz.y < uLampC.a){
    float wav = (vnoise(vec2(xz.x * .9 + uTime * .5, xz.y * .35 - uTime * .8)) - .5) * .09 + n.x * .22, road = 0.;
    float dash = smoothstep(.3, .62, vnoise(vec2(xz.x * 1.6, xz.y * 1.1 - uTime * .9))) * (.5 + .5 * vnoise(vec2(xz.x * 4., xz.y * 3. + uTime * 1.7)));
    for (int i = 0; i < ${NLAMP}; i++){ vec4 Lp = uLampP[i]; vec3 tl = Lp.xyz - wp; float hl = max(length(tl.xz), 1e-3), dl = max(length(tl), 1e-3);
      float az = (rm.x * tl.z - rm.z * tl.x) / (rml * hl) + wav, el = tl.y / dl - rm.y;
      road += Lp.w * step(0., dot(rm.xz, tl.xz)) * exp(-az * az * 900.) * exp(-el * el * 9.) / (1. + dl * .012); }
    col += uLampC.rgb * road * (.25 + 1.3 * dash) * (1. - misc.b);
  }
  // and against each funnel of fire: a red-gold road on the dark swell
  if (evw.z > .01){
    float wav = n.x * .3, road = 0.;
    for (int i = 0; i < ${NFUN}; i++){ vec4 Fp = uFunP[i]; vec3 tl = vec3(Fp.x, Fp.y, Fp.z) - wp; float hl = max(length(tl.xz), 1e-3), dl = max(length(tl), 1e-3);
      float az = (rm.x * tl.z - rm.z * tl.x) / (rml * hl) + wav, el = tl.y / dl - rm.y, wd = 14. / hl;
      road += Fp.w * step(0., dot(rm.xz, tl.xz)) * exp(-az * az / (wd * wd + .0009)) * exp(-el * el * 2.2) * smoothstep(900., 150., hl); }
    col += uFire.rgb * evw.z * road * (.2 + .5 * vnoise(vec2(xz.x * 1.3, xz.y * .9 - uTime * 1.1))) * rough;
  }
  // mirrors of the star islands: where the reflected ray passes a heap
  vec2 rh = r.xz / max(length(r.xz), 1e-3); float rs = length(r.xz);
  for (int i = 0; i < ${NISL}; i++){ vec4 I = uIsl[i]; vec2 c = I.xy - wp.xz; float al = dot(c, rh), off = abs(c.x * rh.y - c.y * rh.x) / max(I.z, 1.);
    float y = wp.y + al * r.y / max(rs, .05), prof = 1. - smoothstep(.0, 1., off * 1.15); float top = I.w * prof * prof + 4.;
    float m = step(1., I.z) * step(0., al) * prof * smoothstep(top, top * .25, y) * (.55 + .45 * hash12(floor(vec2(off * 40., y * .7)) + floor(xz * 3.)));
    col += vec3(1.5, 1.2, .62) * m * .45 * fres; }
  // foam: born on the crests, ageing into lace; white where the rollers break and at their ends
  float lace = smoothstep(.42, .7, fbm(xz * .42 + vec2(uTime * .03, uTime * .05))) * (.55 + .45 * smoothstep(.3, .7, vnoise(xz * 2.6 + uTime * .1)));
  float patch_ = smoothstep(.7 - .32 * crest.a, .92, fbmLo(xz * .037 + vec2(uTime * .008, 0.)));
  float env = 1. - smoothstep(150., 200., abs(xz.x));
  // which lengths of a roller break: each crest breaks along some of its length and is glass along the rest; on the
  // reef's hand it breaks everywhere
  float reefW = smoothstep(-14., 10., (xz.x - uReef.x) * uReef.y) * step(.5, abs(uReef.y));
  float brk = max(smoothstep(.36, .6, vnoise(vec2(xz.x * .034 + 3., xz.y * .011 + uTime * .04))), reefW);
  float rfoam = 0., fshade = 1.;
  if (onRoll > .5){
    // the lip alone is thick white water (the top quarter metre of a crest, where that length of it breaks); from it
    // a net of foam (cells that keep their size in metres) runs out down the upper lee and thins away, and a thinner
    // lace slides back down the top of the river-side face. Between the threads the green body shows.
    float rc = rl.x / 2.2; vec3 vo = voronoi(vec2(xz.x, xz.y - uTime * 1.3 * sign(rl.y)) * .85 + fbmLo(xz * .31) * .8);
    float net = smoothstep(.13, .02, vo.y) * (.55 + .45 * vo.z);
    float lipF = smoothstep(.86, .99, rc + (vnoise(xz * 1.3 + vec2(0., uTime * .8)) - .5) * .12);
    float lee = smoothstep(.05, -.1, rl.y) * smoothstep(-.2, .9, rc), riv = smoothstep(-.02, .1, rl.y) * smoothstep(.55, .95, rc);
    rfoam = brk * (lipF + net * (lee * .7 + riv * .3)) + step(.02, env) * (1. - env) * smoothstep(.2, 1.5, abs(rl.x) / max(env, .05)) * 1.2;
    float bump = vnoise(xz * 2.3 + vec2(uTime * .3, 0.)) - vnoise(xz * 2.3 + vec2(uTime * .3, 0.) + kd.xz * .35);
    fshade = clamp(.72 + bump * 1.6 + .3 * rlit, 0., 1.);
  }
  float foam = clamp(smoothstep(.62, .98, hn) * crest.a * (.35 + .65 * lace) + patch_ * lace * crest.a + rfoam * (.45 + .55 * lace) + wash * (.5 + .5 * lace), 0., 1.) * mix(1., .6, 1. - rough);
  vec3 foamLit = foamR.rgb * (amb * 1.5 + key.rgb * (.4 + .35 * clamp(dot(n, kd), 0., 1.)) + glow.rgb * 1.2) * mix(vec3(.46, .64, .6), vec3(1.), fshade);
  col = mix(col, foamLit * (.82 + .18 * vnoise(xz * 3.3 + uTime * .2)), foam);
  // UNDER THE RED AIR THE WATER TAKES THE SAME BANKS as moving shade and glow, on its swell as it stands: the sea's
  // own face is a level sheet of the pattern, read at the water's own place by its longest folds alone (shade
  // under a bank, glow under a rift), as much as the air over that water is the red wall's. (The fog over it is
  // folded by the one law: seaFog.)
  float wrW = smoothstep(.09, .25, seaAt(6., xz).a);
  if (wrW > .004) col *= mix(1., mix(.62, 1.38, smoothstep(.64, .36, redTile(redFlat(xz) + vec2(3.1, 1.7)).b)), wrW);
  gl_FragColor = vec4(seaFog(col, wp, 0.), 1.);
}`;

export function makeSea(seas, skyU, opts = {}) {
  const NR = 110, NS = 144, pos = new Float32Array((NR + 1) * NS * 3), idx = [];
  for (let i = 0; i <= NR; i++) { const r = i === 0 ? 0 : 0.4 * Math.pow(1.0885, i); for (let j = 0; j < NS; j++) { const a = j / NS * Math.PI * 2, o = (i * NS + j) * 3; pos[o] = Math.cos(a) * r; pos[o + 2] = Math.sin(a) * r; } }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const U = { ...seas.uniforms, ...skyU, uCenter: { value: new THREE.Vector2() },
    uBoat: { value: new THREE.Vector4(0, 9999, 0, -1) }, uBoatK: { value: 0 }, uBow: { value: new THREE.Vector4(0, 0, 1, 0) },
    uLampP: { value: Array.from({ length: NLAMP }, () => new THREE.Vector4(0, 5, 0, 0)) }, uLampC: { value: new THREE.Vector4(0, 0, 0, -1e6) },
    uFunP: { value: Array.from({ length: NFUN }, () => new THREE.Vector4(0, 40, 0, 0)) }, uReef: { value: new THREE.Vector2(0, 0) },
    uBerg: { value: Array.from({ length: NBERG }, () => new THREE.Vector4(0, 0, 0, 0)) }, uBergK: { value: Array.from({ length: NBERG }, () => new THREE.Vector4(1, 0, 1, 0)) }, uBergS: { value: new THREE.Vector2(1e6, -1e6) } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = -5;
  return { mesh, uniforms: U, follow(x, z) { U.uCenter.value.set(x, z); } };
}

// ------------------------------------------------------------------ the archipelago of stars
// One heap is thousands of sharp points: dense on the water, heaped like land, thinning upward into a column that
// reaches the door in the ceiling. spec: { x, z, R (half its width), H (crest), ring: { inner, crest } or null,
// saddle: { dir (+1: the rim toward +Z), half (m), low (m) } or null, points, column (share), far (bool) }.
// A POINT IS SIZED IN WORLD METRES AND NOTHING ELSE. So that the points beside the visitor's line stay points, a
// point's width is dealt once, here, by its place: STAR_NEAR of its distance from the line (o.lineDist, the world's)
// where that is less than its own drawn width; so much narrower, so much the brighter (its light per width kept).
// height of the heap over a place (m)
export function heapHeight(spec, noise, x, z) {
  const dx = x - spec.x, dz = z - spec.z, rho = Math.hypot(dx, dz), q = rho / spec.R;
  if (q >= 1) return 0;
  const lump = 0.5 + 0.85 * noise.fbm2(x * 0.021 + spec.x * 0.37, z * 0.021 - spec.z * 0.11, 3) + 0.25 * noise.ridged2(x * 0.06, z * 0.06);
  let prof;
  if (spec.ring) { const t = (rho - spec.ring.crest) / (rho < spec.ring.crest ? spec.ring.crest - spec.ring.inner : spec.R - spec.ring.crest); prof = Math.max(0, 1 - t * t); prof *= prof; }
  else prof = Math.pow(1 - Math.pow(q, 1.6), 1.5);
  let h = spec.H * prof * clamp(lump, 0.35, 1.25);
  if (spec.saddle && dz * spec.saddle.dir > 0) { const k = Math.exp(-(dx * dx) / (spec.saddle.half * spec.saddle.half)); h = lerp(h, Math.min(h, spec.saddle.low * prof), k); }
  return h;
}

export const STAR_NEAR = 0.0056;
export async function makeStarIslands(ctx, specs, o) {
  const rng = o.rng, noise = ctx.noise, total = specs.reduce((a, s) => a + s.points, 0);
  const P = new Float32Array(total * 3), A = new Float32Array(total * 4); let n = 0;
  for (const sp of specs) {
    const colR = sp.ring ? [sp.ring.inner, sp.R * 1.05] : [0, sp.R * 0.34];
    for (let i = 0, tries = 0; i < sp.points && tries < sp.points * 6; tries++) {
      const inCol = rng() < sp.column; let x, y, z;
      if (inCol) {
        const a = rng() * Math.PI * 2, t = Math.pow(rng(), 1.9), rr = Math.sqrt(lerp(colR[0] * colR[0], colR[1] * colR[1], rng()));
        x = sp.x + Math.cos(a) * rr; z = sp.z + Math.sin(a) * rr; y = lerp(heapHeight(sp, noise, x, z) * 0.7, CEIL, t);
      } else {
        const a = rng() * Math.PI * 2, rr = sp.R * Math.sqrt(rng());
        x = sp.x + Math.cos(a) * rr; z = sp.z + Math.sin(a) * rr;
        const top = heapHeight(sp, noise, x, z); if (top < 0.6 && rng() < 0.7) continue;
        // most points lie in the heap's skin, the rest inside it down to the water
        y = rng() < 0.62 ? top * (1 - 0.1 * rng() * rng()) : top * Math.pow(rng(), 1.5);
      }
      if (o.clear && !o.clear(x, y, z)) continue;
      const k = n * 3; P[k] = x; P[k + 1] = y + 0.15; P[k + 2] = z;
      const big = rng() < 0.06, size = (sp.far ? 2.4 : 1) * (big ? rng.range(0.5, 0.8) : rng.range(0.16, 0.36)) * (inCol ? 1.25 : 1);
      const wide = o.lineDist ? Math.min(size, STAR_NEAR * o.lineDist(x, y, z)) : size;
      A[n * 4] = wide; A[n * 4 + 1] = rng(); A[n * 4 + 2] = rng(); A[n * 4 + 3] = (inCol ? 0.6 : 1) * size / wide;
      n++; i++;
      if (n % 1500 === 0) await ctx.yield();
    }
    await ctx.yield();
  }
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); quad.setIndex([0, 1, 2, 0, 2, 3]);
  quad.setAttribute('aPos', new THREE.InstancedBufferAttribute(P.subarray(0, n * 3), 3)); quad.setAttribute('aDat', new THREE.InstancedBufferAttribute(A.subarray(0, n * 4), 4));
  quad.instanceCount = n;
  const U = { ...o.seas.uniforms, uGain: { value: 1 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: GLSL_SEAS + /* glsl */`
      attribute vec3 aPos; attribute vec4 aDat; uniform float uBufH; varying vec2 vUv; varying vec4 vCol;
      void main(){
        vec3 c = aPos; c.y += .5 * sin(uTime * .5 + c.x * .013 + c.z * .017) * smoothstep(40., 0., c.y);
        vec4 mv = viewMatrix * vec4(c, 1.); float d = max(-mv.z, .1);
        // a star is sized in metres (aDat.x, dealt at build). Anti-aliasing: it is never drawn thinner than the
        // drawing buffer can hold, its light thinned to match
        float px = 2. / (projectionMatrix[1][1] * max(uBufH, 1.)), want = aDat.x, size = max(want, d * px * 1.25), k = (want * want) / (size * size);
        float tw = .62 + .38 * sin(uTime * (.35 + aDat.y * .9) + aDat.z * 50.);
        vec3 tint = mix(vec3(1., .66, .16), vec3(1., .92, .7), aDat.z * aDat.z);
        vec3 col = tint * 1.9 * aDat.w * tw * k;
        vCol = vec4(col * seaDim(c, .2), 1.); vUv = position.xy;
        mv.xy += position.xy * size; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`varying vec2 vUv; varying vec4 vCol; uniform float uGain;
      void main(){ float r = length(vUv); float a = smoothstep(1., .5, r); gl_FragColor = vec4(vCol.rgb * a * uGain, 1.); }` });
  const mesh = new THREE.Mesh(quad, mat); mesh.frustumCulled = false; mesh.renderOrder = 6;
  return { mesh, uniforms: U, count: n };
}

// ------------------------------------------------------------------ birds as two-triangle wings (gold birds, doves)
// pathGLSL defines: vec3 birdPos(out vec3 fwd, out float vis)  (place, heading, 0..1 visible), reading aA, aB, aC and its
// own uniforms; colGLSL defines: vec3 birdCol(float shade, vec3 wp). aC = (wingspan m, flap phase, flap Hz, tint).
export function birdGeometry(count, aA, aB, aC) {
  const g = new THREE.InstancedBufferGeometry();
  // body edge along +Z, one tip each side; 'wing' is -1 / +1 at the tips and 0 on the body
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.32, 0, 0, -0.3, -1, 0, -0.12, 0, 0, 0.32, 1, 0, -0.12, 0, 0, -0.3]), 3));
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4));
  g.instanceCount = count;
  return g;
}
export function birdMaterial(uniforms, pathGLSL, colGLSL, opts = {}) {
  return new THREE.ShaderMaterial({ uniforms, side: THREE.DoubleSide, ...opts,
    vertexShader: GLSL_SEAS + /* glsl */`
      attribute vec4 aA; attribute vec4 aB; attribute vec4 aC; uniform float uBufH; varying vec3 vCol;
      ` + pathGLSL + colGLSL + /* glsl */`
      void main(){
        vec3 fwd; float vis; vec3 c = birdPos(fwd, vis);
        fwd = normalize(fwd + vec3(0., 1e-4, 0.));
        vec3 side = cross(fwd, vec3(0., 1., 0.)); side = side / max(length(side), 1e-3) ; vec3 up = cross(side, fwd);
        float d = distance(cameraPosition, c), px = 2. / (projectionMatrix[1][1] * max(uBufH, 1.));
        float span = aC.x * .5, size = max(span, d * px * 1.5), k = pow(span / size, 1.2);
        size *= vis;
        float fl = sin(uTime * 6.2832 * aC.z + aC.y * 6.2832) * .95 + .15, w = position.x;
        vec3 p = c + fwd * (position.z * size) + (side * (w * cos(fl)) + up * (abs(w) * sin(fl))) * size;
        vCol = birdCol(.75 + .25 * sin(fl) * abs(w), c) * k * seaDim(c, .1);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }` });
}

// gold birds rising round the star islands in long loose sheets, up the columns and out through the doors.
// Every bird of a sheet climbs at the sheet's one speed; a bird differs from its sheet by a fixed offset in phase and
// a small wobble in height, so a sheet is as thick at any hour of the clock as at the first.
// aA = (island x, island z, radius at the water, angle), aB = (phase, the sheet's climb m/s, radius in the column, turn)
const GOLD_PATH = /* glsl */`
vec3 birdPos(out vec3 fwd, out float vis){
  float HT = ${(CEIL + 12).toFixed(1)}, y = fract(aB.x + uTime * aB.y / HT) * HT + 2.2 * sin(uTime * .37 + aC.y * 6.2832);
  float up = smoothstep(0., 230., y), rho = mix(aA.z, aB.z, up), th = aA.w + aB.w * y * .004 + .12 * sin(y * .027 + aB.x * 40.);
  vis = smoothstep(0., 5., y) * smoothstep(HT, HT - 14., y);
  fwd = vec3(-sin(th) * aB.w * .45, 1., cos(th) * aB.w * .45);
  return vec3(aA.x + cos(th) * rho, y, aA.y + sin(th) * rho);
}`;
const GOLD_COL = /* glsl */`vec3 birdCol(float shade, vec3 wp){ return mix(vec3(1.7, 1.05, .22), vec3(1.8, 1.5, .8), aC.w) * shade; }`;

export async function makeGoldenBirds(ctx, specs, o) {
  const rng = o.rng, total = specs.reduce((a, s) => a + s.birds, 0), aA = new Float32Array(total * 4), aB = new Float32Array(total * 4), aC = new Float32Array(total * 4); let n = 0;
  for (const sp of specs) {
    // sp.rise (optional): how this island's sheets rise: { speed: [lo, hi] m/s, turn: [lo, hi], wide: [lo, hi], from: [lo, hi] m from its middle }
    const sheets = Math.max(3, Math.round(sp.birds / 420)), colR = sp.ring ? [sp.ring.inner + 4, sp.R] : [sp.R * 0.08, sp.R * 0.36], C = sp.rise || {};
    const cs = C.speed || [7, 13], ct = C.turn || [0.5, 1.6], cw = C.wide || [0.25, 0.8], cf = C.from || [sp.R * 0.55, sp.R * 1.2];
    // o.clear(x, y, z) (optional): is this place clear of the visitor's line; o.clearTop: the line's greatest height;
    // o.clearNear(sp): the bearings from this island (256 to the turn) on which the line lies within its reach, or
    // null where the line comes nowhere near. A bird is tested only if its course sweeps one of those bearings.
    const bins = o.clear && o.clearNear ? o.clearNear(sp) : null, near = !!bins, sweep = o.clearTop * 0.004, TB = 256 / 6.2832;
    const courseClear = (k) => {
      const a = aA[k + 3], w = aB[k + 3] * sweep, b0 = Math.floor((a - 0.13 + Math.min(0, w)) * TB), b1 = Math.floor((a + 0.13 + Math.max(0, w)) * TB); let hit = false;
      for (let b = b0; b <= b1 && !hit; b++) hit = bins[((b % 256) + 256) % 256] === 1;
      if (!hit) return true;
      for (let y = 0; y <= o.clearTop; y += 1.5) { const th = a + aB[k + 3] * y * 0.004 + 0.12 * Math.sin(y * 0.027 + aB[k] * 40), rho = aA[k + 2] + (aB[k + 2] - aA[k + 2]) * smoothstep(0, 230, y);
        if (!o.clear(aA[k] + Math.cos(th) * rho, y, aA[k + 1] + Math.sin(th) * rho)) return false; }
      return true; };
    for (let s = 0; s < sheets; s++) {
      const th0 = rng() * 6.283, ph0 = rng(), sp0 = rng.range(cs[0], cs[1]), turn = rng.sign() * rng.range(ct[0], ct[1]), slant = rng.range(-0.5, 0.5), r0 = rng.range(cf[0], cf[1]), rc = rng.range(colR[0], colR[1]), wide = rng.range(cw[0], cw[1]);
      const m = Math.floor(sp.birds / sheets);
      for (let i = 0; i < m; i++, n++) {
        const u = rng.gauss() * wide, v = rng.gauss() * 0.035, k = n * 4;
        aA[k] = sp.x; aA[k + 1] = sp.z; aA[k + 2] = r0 * (1 + 0.1 * rng.gauss()); aA[k + 3] = th0 + u;
        aB[k] = ph0 + v + u * slant * 0.08; aB[k + 1] = sp0; aB[k + 2] = rc * (1 + 0.12 * rng.gauss()); aB[k + 3] = turn;
        aC[k] = (sp.far ? 1.6 : 1) * rng.range(0.42, 0.6); aC[k + 1] = rng(); aC[k + 2] = rng.range(4.5, 7); aC[k + 3] = rng() * rng();
        // (a bird's whole course is a fixed line in the world: where it would pass too near the visitor's line, the
        // bird takes the nearest clear place round its island instead; no draw of the stream is spent on it)
        if (near) { const a0 = aA[k + 3]; for (let t = 1; t <= 40 && !courseClear(k); t++) aA[k + 3] = a0 + (t % 2 ? 1 : -1) * 0.2 * Math.ceil(t / 2); }
        if (n % 1000 === 999) await ctx.yield();
      }
    }
  }
  const U = { ...o.seas.uniforms };
  const mesh = new THREE.Mesh(birdGeometry(n, aA.subarray(0, n * 4), aB.subarray(0, n * 4), aC.subarray(0, n * 4)), birdMaterial(U, GOLD_PATH, GOLD_COL, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.frustumCulled = false; mesh.renderOrder = 7;
  return { mesh, uniforms: U, count: n };
}

// PILLARS OF LIGHT from each heap to its door, with fine gold sparkle rising in them (far off, the sparkle is all
// that is seen of the birds). A PILLAR IS LIGHT WITH NO SKIN TO CROSS: a ray takes of it by its chord through the
// pillar's cylinder, a rule of the world places of eye and ray. The cylinder is drawn only where a ray LEAVES it
// (one place to a ray, from outside and from inside alike), and there the ray is given:
//   the line's own chord through the cylinder as a share of the widest (to the fourth power: thickest through the
//   middle, nothing toward either side), times the share of that chord that lies before the eye (all of it from
//   outside; from inside, what is left between the eye and the place it leaves).
// So from inside the light is all round, and nothing stands where the line goes in: toward the wall just passed
// the chord is nothing, ahead it is whole. The cylinder's radius is the door's clear opening (PILLAR of the door's
// radius, inside which the sky's rent is whole).
export function makeColumns(specs, o) {
  // sp.pillar (optional): this island's own pillar: { width (share of the door's), rise (m/s of its sparkle), low (0..1: how much of its light lies low) }
  const pos = [], ax = [], cl = [], idx = [], NSEG = 28;
  for (const sp of specs) {
    const base = pos.length / 3, K = sp.pillar || {}, r = sp.door * PILLAR * (K.width ?? 1);
    for (let j = 0; j <= NSEG; j++) { const a = j / NSEG * Math.PI * 2; for (const y of [0, CEIL]) { pos.push(sp.x + Math.cos(a) * r, y, sp.z + Math.sin(a) * r); ax.push(sp.x, sp.z, r, sp.far ? 1 : 0.6); cl.push(K.rise ?? 9, K.low ?? 0.5); } }
    for (let j = 0; j < NSEG; j++) { const a = base + j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aAxis', new THREE.Float32BufferAttribute(ax, 4)); g.setAttribute('aPil', new THREE.Float32BufferAttribute(cl, 2)); g.setIndex(idx);
  const U = { ...o.seas.uniforms };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`attribute vec4 aAxis; attribute vec2 aPil; varying vec4 vAxis; varying vec2 vPil; varying vec3 vWp; void main(){ vAxis = aAxis; vPil = aPil; vWp = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + GLSL_SEAS + /* glsl */`varying vec4 vAxis; varying vec2 vPil; varying vec3 vWp;
      // one layer of sparkle on the cylinder: cells 3.4 m across, px the picture's footprint there in cells
      float sparkle(vec2 uv, float px){ vec2 c = floor(uv), f = fract(uv); vec2 o = hash22(c) * .7 + .15; float b = hash12(c + 2.7);
        return smoothstep(.07 + px, .02, length(f - o)) * min(1., .0049 / max(px * px, 1e-5)) * step(.5, b); }
      void main(){
        vec2 n = (vWp.xz - vAxis.xy) / max(vAxis.z, 1.); vec3 v = cameraPosition - vWp; float dh = length(v.xz); vec2 vh = v.xz / max(dh, 1e-3);
        // leave: half the line's chord over the radius, at the place where the ray leaves the cylinder (elsewhere
        // nothing is drawn); share: how much of that chord lies between the eye and this place
        float leave = -dot(n, vh);
        if (leave <= 0.) discard;
        float share = clamp(dh / max(2. * vAxis.z * leave, 1e-3), 0., 1.);
        // (the light is fuller in some places than others: a slow noise of the place round the pillar and the height)
        float ang = atan(n.y, n.x), yk = vWp.y / ${CEIL.toFixed(1)};
        float thick = pow(clamp(leave, 0., 1.), 4.) * share * (.45 + .9 * vnoise(vec3(n * 1.7 + vAxis.xy * .1, vWp.y * .011 - uTime * .015)));
        float body = 2. * thick * (.016 + .1 * vPil.y * (1. - yk) * (1. - yk) + .12 * (1. - vPil.y) * yk * yk * yk);
        // (anti-aliasing: a spark smaller than the picture's own footprint at its place is drawn as wide as that, its light kept)
        vec2 uv = vec2(ang * vAxis.z, vWp.y - uTime * vPil.x) / 3.4; float px = max(length(dFdx(vWp)), length(dFdy(vWp))) / 3.4;
        float spark = (sparkle(uv, px) + sparkle(uv + vec2(41.3, 17.7 + uTime * vPil.x * .09), px)) * vAxis.w;
        vec3 col = vec3(1., .8, .42) * body + vec3(2.2, 1.6, .5) * spark * thick * 1.4;
        gl_FragColor = vec4(col * seaDim(vWp, .3), 1.);
      }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return { mesh, uniforms: U };
}

// The hero alone (the set-piece viewer): the star sea under its own sky with the great ring heap, its door and birds.
export async function buildHero(ctx, opts = {}) {
  const P = { bar: -9000, crest: [-8970, -8915, -8860] };
  const V = { mood: 0.5, coastSide: -1, iceSide: 1, swellK: 1, fire: '#e2461a', river: { astern: [0, 0, 0] } };
  const real = { bar: 110, crest: [140, 195, 250], milk: 250, green: 340, violet: 400, mist: 590, ice: 602.5, squall: 720, wall0: 750, wall1: 775, star: 880 };
  const last = seaStops(real, V).pop(), seas = makeSeas(P, V, [{ ...last, a: -1e5, b: 1e5 }]);
  const skyU = skyUniforms(), sea = makeSea(seas, skyU), dome = makeSkyDome({ ...seas.uniforms, ...skyU });
  const spec = { x: 0, z: 0, R: 80, H: 55, ring: { inner: 45, crest: 62 }, saddle: { dir: 1, half: 22, low: 25 }, points: 16000, column: 0.14, birds: 16000, door: 85 };
  skyU.uDoors.value[0].set(0, 0, 85, 1); seas.uniforms.uIsl.value[0].set(0, 0, 80, 55);
  const rng = ctx.core.makeRng(ctx.core.hashSeed('hero:' + ctx.seed));
  const stars = await makeStarIslands(ctx, [spec], { rng, seas });
  const birds = await makeGoldenBirds(ctx, [spec], { rng, seas }), cols = makeColumns([spec], { seas });
  const object = new THREE.Group(); object.add(dome, sea.mesh, cols.mesh, stars.mesh, birds.mesh);
  const size = new THREE.Vector2(), eye = new THREE.Vector3();
  return {
    object, radius: 80, height: 60, center: new THREE.Vector3(0, 28, 0), ground: false,
    anchors: { portalSeat: new THREE.Vector3(0, 46, 0), saddleLine: [new THREE.Vector3(0, 46, 62), new THREE.Vector3(0, 46, 0)] },
    update(dt, time, camera) {
      seas.uniforms.uTime.value = time; eye.setFromMatrixPosition(camera.matrixWorld); sea.follow(eye.x, eye.z);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); seas.uniforms.uBufH.value = size.y; }
    },
  };
}

// the surface's height over a place, for things that float (vertex shaders): the six swells and the rollers
export const GLSL_FLOAT = GLSL_ROLL + /* glsl */`
float surfaceH(vec2 xz){
  float A = seaAt(0., xz).a, h = 0.;
  ${SWELLS.map(([l, th, a, ph]) => { const k = 2 * Math.PI / l; return `h += A * ${f3(a)} * sin(${f3(k)} * dot(vec2(${f3(Math.sin(th))}, ${f3(Math.cos(th))}), xz) - ${f3(Math.sqrt(G * k))} * uTime + ${f3(ph)});`; }).join('\n  ')}
  return h + roller(xz).x;
}`;
