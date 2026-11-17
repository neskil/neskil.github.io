// Striped Tents Round a White Fire: the hero set piece and the builders of everything that stands in the place.
// A night place of black and white striped tents set ring within ring round a fire of white flame, inside an iron fence
// in a meadow of fields, hedges and a far wood. buildHero lays out and builds the tents (canvas with the moon's and the
// fire's shade baked in, ropes and pegs, pennants, small lights scattered over all the cloth), the snow room behind one
// open flap, the fence and gate, the ground with its worn paths, and the fire. The other builders (clock, garden of
// ice, cloud steps, candle tree, visitors, meadow) are called by the world file. Everything is lit by one shared set of
// uniforms (moon, sky fill, fire). Whatever moves here moves by the world clock alone.
// TWO LOCKS show a flown tent's inside by the eye's distance to its openings and by nothing else (a level of detail by where the eye is: within the range the inside is shown, beyond it a plain sheet stands in each opening): the garden of ice within 140 m of either of its flaps, in plan; the cloud steps within 220 m of its flap, in plan, or of the middle of its open crown.
// THE GROUND'S NEAR GRAIN is laid by the eye's distance to a place of the ground and by nothing else (a level of detail by where the eye is, never by where it looks): its finest grain, 6 to 9 cm, stands whole within NEAR_GRAIN[0] = 28 m of the eye and is gone at NEAR_GRAIN[1] = 42 m, fading evenly between, and before it is finer than a pixel.
//
// World metres. The route's first point is (0, 8.5, 0), heading -Z. The fire stands at (0, 0, -250). A place written
// (r, b) lies r metres from the fire at bearing b degrees, measured from +Z round toward +X.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180;
export const FIRE = [0, -250];
export const at = (r, b) => [FIRE[0] + r * Math.sin(b * RAD), FIRE[1] + r * Math.cos(b * RAD)];
const head = (h) => [Math.sin(h * RAD), Math.cos(h * RAD)];
const leftOf = (h) => [h[1], -h[0]];
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// the places of the plan (the brief's own measures)
export const PLACES = {
  fenceR: 190, courtR: 45, rings: [68, 108, 155],
  gate: at(190, 197), clock: at(98, 205),
  mouth: [[-27, -97], [30, -98]], laneTent: [-6, -140],
  garden: { c: [-99, -310], flaps: [[-64, -326], [-134, -294]], len: 82, wid: 42, top: 26 },
  steps: { flap: [-150, -255], heading: 10, len: 90, wid: 44, wall0: 16, wall1: 58, mast: 80, mastOff: 18, crownAlong: 74, crownY: 55, crownR: 11 },
  tree: at(110, 121), ringY: 24, ringR: 7.5, treeTop: 38, limbOff: 9.5,
  gaps: [24, 100, 200],
};

// ---------------------------------------------------------------- the route
// Every control point is found from the places: the fence's circle, the rings' gaps, the fire's circle, the flaps, the
// cloud steps' own axis, the high turn's circle and the last straight into the candle tree.
export function layRoute() { const laid = routePoints(); return routeOf(makePath(laid.pts), laid); }
// the route's control points, from the places
export function routePoints() {
  const P = PLACES, pts = [], S = P.steps;
  const push = (xz, y) => pts.push([xz[0], y, xz[1]]);
  // level and straight from the entry to the fence line
  push([0, 0], 8.5); push([0, FIRE[1] + P.fenceR], 8.5);
  // the lane: the mouth between the two outer tents, then each ring through its gap, the lanes between at their middles
  push([(P.mouth[0][0] + P.mouth[1][0]) / 2, (P.mouth[0][1] + P.mouth[1][1]) / 2], 8);
  push(at((P.rings[2] + P.rings[1]) / 2, 5.5), 7); push(at(P.rings[1], 10.5), 6.5);
  push(at((P.rings[1] + P.rings[0]) / 2, 16.5), 6); push(at(P.rings[0], P.gaps[0]), 6); push(at(P.courtR, 33), 6);
  // round the fire on a true circle, the fire to the left
  const arcR = 30, b0 = 53, b1 = 165, nArc = 7;
  for (let i = 0; i <= nArc; i++) push(at(arcR, lerp(b0, b1, i / nArc)), i === 0 || i === nArc ? 6.2 : 6.5);
  // out by the gap at bearing 200 and along the lane, the clock abeam
  push(at(P.courtR, 186), 6); const gap = at(P.rings[0], P.gaps[2]); push(gap, 6);
  const fA = P.garden.flaps[0], fB = P.garden.flaps[1];
  {
    const dx = fA[0] - gap[0], dz = fA[1] - gap[1], l = Math.hypot(dx, dz), t = ((P.clock[0] - gap[0]) * dx + (P.clock[1] - gap[1]) * dz) / l;
    const foot = [gap[0] + dx / l * t, gap[1] + dz / l * t], off = Math.hypot(foot[0] - P.clock[0], foot[1] - P.clock[1]);
    push([P.clock[0] + (foot[0] - P.clock[0]) * 16.5 / off, P.clock[1] + (foot[1] - P.clock[1]) * 16.5 / off], 5.5);
  }
  // the garden of ice: flap to flap, bowed 7.3 m to the right so the walk bends gently left
  {
    const dx = fB[0] - fA[0], dz = fB[1] - fA[1], l = Math.hypot(dx, dz), hx = dx / l, hz = dz / l;
    push(fA, 4.5);
    for (const t of [0.26, 0.53, 0.79]) { const k = 7.3 * 4 * t * (1 - t); push([fA[0] + dx * t - hz * k, fA[1] + dz * t + hx * k], 3.5); }
    push(fB, 4);
    // the lane to the cloud steps: the middle of the arc of radius 30 that joins the garden's line to the steps' axis
    const h2 = head(S.heading), den = hx * h2[1] - hz * h2[0];
    const s = ((S.flap[0] - fB[0]) * h2[1] - (S.flap[1] - fB[1]) * h2[0]) / den, X = [fB[0] + hx * s, fB[1] + hz * s];
    const bx = -hx + h2[0], bz = -hz + h2[1], bl = Math.hypot(bx, bz), half = Math.acos(clamp(-hx * h2[0] - hz * h2[1], -1, 1)) / 2;
    const reach = 30 * (1 / Math.sin(half) - 1);
    push([X[0] + bx / bl * reach, X[1] + bz / bl * reach], 4.5);
  }
  // the cloud steps: in at the flap and up the tent's own axis to the crown and out
  const ax = head(S.heading);
  for (const [d, y] of [[0, 5], [12, 6], [24, 9.5], [36, 16.5], [48, 27], [61, 40.5], [S.crownAlong, S.crownY - 0.5]]) push([S.flap[0] + ax[0] * d, S.flap[1] + ax[1] * d], y);
  // the high turn: a true circle of radius 70 that ends on the last straight; the straight is laid back from the tree.
  // The line leaves the hoop steeply enough to clear its upper rim by 4 m, stops climbing within 40 m beyond the
  // crown and tops out at 72 m.
  const hOut = 148, hs = head(hOut), runLen = 190, turnR = 70;
  const S0 = [P.tree[0] - hs[0] * runLen, P.tree[1] - hs[1] * runLen], lo = leftOf(hs), C = [S0[0] + lo[0] * turnR, S0[1] + lo[1] * turnR];
  const yTurn = [67, 71.2, 71.8, 71, 69.5, 67, 63, 58];
  for (let i = 0; i < yTurn.length; i++) { const l = leftOf(head(lerp(S.heading, hOut, i / (yTurn.length - 1)))); push([C[0] - l[0] * turnR, C[1] - l[1] * turnR], yTurn[i]); }
  for (const [d, y] of [[25, 51], [50, 43.5], [75, 36], [95, 30.5], [112, 26.5], [122, 24.5], [130, P.ringY], [160, P.ringY], [runLen, P.ringY]]) push([S0[0] + hs[0] * d, S0[1] + hs[1] * d], y);
  return { pts, C, S0, hs, arcR };
}
// the route's own measures, from its path
export function routeOf(path, laid) {
  const { pts, C, S0, hs, arcR } = laid;
  // eyes along the route at every 2 m, for every clearance test
  const n = Math.ceil(path.length / 2), eyes = new Float32Array((n + 1) * 3), v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { path.posAtDist(Math.min(path.length, i * 2), v); eyes[i * 3] = v.x; eyes[i * 3 + 1] = v.y; eyes[i * 3 + 2] = v.z; }
  // smallest distance from a point to the route's line, in three dimensions
  const dist = (x, y, z) => { let b = Infinity; for (let i = 0; i <= n; i++) { const dx = eyes[i * 3] - x, dy = eyes[i * 3 + 1] - y, dz = eyes[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  // metres along the route of the eye nearest to a place (in plan, within a span of metres)
  const metreNear = (x, z, m0 = 0, m1 = path.length) => { let b = Infinity, bi = 0; for (let i = Math.floor(m0 / 2); i <= Math.min(n, Math.ceil(m1 / 2)); i++) { const dx = eyes[i * 3] - x, dz = eyes[i * 3 + 2] - z, d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } } return bi * 2; };
  // whether any eye of the route lies within r metres of a point (the same test as dist, found through a grid of cells)
  const grids = [12, 48].map((cell) => { const map = new Map(); for (let i = 0; i <= n; i++) { const k = ((Math.floor(eyes[i * 3] / cell) + 512) * 1024 + Math.floor(eyes[i * 3 + 1] / cell) + 512) * 1024 + Math.floor(eyes[i * 3 + 2] / cell) + 512; let a = map.get(k); if (!a) map.set(k, a = []); a.push(i); } return { cell, map }; });
  const near = (x, y, z, r) => {
    const g = r <= grids[0].cell ? grids[0] : r <= grids[1].cell ? grids[1] : null; if (!g) return dist(x, y, z) < r;
    const cx = Math.floor(x / g.cell), cy = Math.floor(y / g.cell), cz = Math.floor(z / g.cell), r2 = r * r;
    for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iy = cy - 1; iy <= cy + 1; iy++) for (let iz = cz - 1; iz <= cz + 1; iz++) {
      const a = g.map.get(((ix + 512) * 1024 + iy + 512) * 1024 + iz + 512); if (!a) continue;
      for (const i of a) { const dx = eyes[i * 3] - x, dy = eyes[i * 3 + 1] - y, dz = eyes[i * 3 + 2] - z; if (dx * dx + dy * dy + dz * dz < r2) return true; }
    }
    return false;
  };
  return { points: pts, path, eyes, count: n + 1, dist, near, metreNear, turnCentre: C, straightStart: S0, hOut: hs, arcR };
}

// ---------------------------------------------------------------- the light all things share
// One set of uniforms: the moon (key), the slate fill from above and below, the white fire (second key, with the bars
// of its staves' shadow), the haze, the wind and the world clock. The fire's two slow wavers take their phases from
// o.phases (drawn by the caller from a stream of their own).
export function makeLight(o = {}) {
  const moonDir = (o.moonDir ? o.moonDir.clone() : new THREE.Vector3(0.676, 0.469, 0.568)).normalize();
  const c3 = (hex, k = 1) => { const c = lin(hex); return new THREE.Vector3(c[0] * k, c[1] * k, c[2] * k); };
  // strengths are those of the brief's lamps (moon 1.6, fill 1.0) brought to what a matte surface gives back (over pi);
  // the fill is lifted so that a white stripe in shade keeps a third of its lit brightness
  const wind = o.wind ?? 0.5, wd = head(250), fireBase = c3('#f4f7ff', o.fire ?? 2), ph = o.phases || [0, 0, 0, 0];
  const U = {
    uMoonDir: { value: moonDir }, uMoonCol: { value: c3(o.moonColor || '#dfe6f2', (o.moon ?? 1.6) / Math.PI) },
    uSkyCol: { value: c3(o.sky || '#8b9cba', (o.fill ?? 1.0) / Math.PI) }, uGndCol: { value: c3(o.ground || '#5f6770', (o.fill ?? 1.0) / Math.PI) },
    uFirePos: { value: new THREE.Vector3(FIRE[0], 9, FIRE[1]) }, uFireCol: { value: fireBase.clone() }, uFireSway: { value: 0 },
    uFogCol: { value: c3(o.fog || '#2b3443') }, uFogDen: { value: o.fogDensity ?? 0.0011 },
    uTime: { value: 0 }, uWind: { value: new THREE.Vector4(wd[0], wd[1], 0.35 + wind * 0.9, 0.6 + wind * 0.8) },
    uSnow: { value: o.snow ? 1 : 0 },
    // the low mist: the level of its noise at which it begins and the span over which it thickens, and the distances
    // from the fire between which it comes on (it lies on the meadow and reaches a little way in through the railings);
    // where its banks lie when the world clock starts is dealt by the meadow's builder
    uMistLaw: { value: new THREE.Vector4(0.47, 0.09, PLACES.fenceR - 30, PLACES.fenceR + 4) }, uMistOff: { value: new THREE.Vector2(0, 0) },
  };
  return {
    uniforms: U, moonDir, wind, windDir: wd,
    update(time) {
      U.uTime.value = time;
      const k = 1 + 0.09 * Math.sin(time * 1.7 + ph[0]) + 0.06 * Math.sin(time * 2.9 + ph[1]);
      U.uFireCol.value.copy(fireBase).multiplyScalar(k);
      U.uFireSway.value = 0.05 * Math.sin(time * 0.83 + ph[2]) + 0.028 * Math.sin(time * 1.9 + ph[3]);
    },
  };
}

export const LIGHT_GLSL = /* glsl */`
uniform vec3 uMoonDir, uMoonCol, uSkyCol, uGndCol, uFirePos, uFireCol, uFogCol;
uniform float uFogDen, uTime, uFireSway, uSnow;
uniform vec4 uWind;
float nfHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float nfNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(nfHash(i), nfHash(i + vec2(1., 0.)), f.x), mix(nfHash(i + vec2(0., 1.)), nfHash(i + vec2(1., 1.)), f.x), f.y); }
float nfFbm(vec2 p) { return .5 * nfNoise(p) + .25 * nfNoise(p * 2.03 + 7.1) + .125 * nfNoise(p * 4.1 + 3.3) + .0625 * nfNoise(p * 8.3 + 1.7); }
vec3 nfHemi(vec3 n) { return mix(uGndCol, uSkyCol, clamp(n.y * .5 + .5, 0., 1.)); }
vec3 nfMoon(vec3 n, float wrap) { return uMoonCol * clamp((dot(n, uMoonDir) + wrap) / (1. + wrap), 0., 1.); }
// the sixteen bars of shadow the fire's staves throw: 1 lit, toward 0 in a bar
float nfBars(vec3 p) {
  vec2 d = p.xz - uFirePos.xz; float r = max(length(d), .001);
  float a = atan(d.x, (abs(d.x) + abs(d.y) < 1e-4) ? 1. : d.y) + uFireSway;
  float t = abs(fract(a * (16. / 6.2831853)) - .5) * 2.;
  float soft = .05 + r * .0016;
  float bar = smoothstep(.72 - soft, .72 + soft, t);
  float rr = max(r, 6.5), hmax = (8. - p.y * 5.5 / rr) / (1. - 5.5 / rr);
  float deep = clamp((hmax - 1.5) / 10., 0., 1.);
  return 1. - bar * deep * smoothstep(5.8, 8., r);
}
float nfFireAtt(vec3 p) { float d = length(uFirePos - p); return pow(clamp(1. - d / 130., 0., 1.), 2.) / (1. + d * d / 1100.); }
vec3 nfFire(vec3 p, vec3 n, float wrap) {
  vec3 L = uFirePos - p; float d = max(length(L), .01); L /= d;
  return uFireCol * nfFireAtt(p) * clamp((dot(n, L) + wrap) / (1. + wrap), 0., 1.) * nfBars(p);
}
vec3 nfFog(vec3 c, float dist) { return mix(c, uFogCol, clamp(1. - exp(-uFogDen * uFogDen * dist * dist), 0., 1.)); }
// the gusts that cross the field: -1..1 at a place and a time
float nfGust(vec2 xz, float ph) {
  float a = dot(xz, uWind.xy) * .045 - uTime * uWind.w * .9 + ph;
  return sin(a) * .6 + sin(a * 2.3 + dot(xz, vec2(-uWind.y, uWind.x)) * .06 + 1.7) * .4;
}
`;
// THE LOW MIST. A bank of mist is as thick as its own place makes it, and looks the same from everywhere. nfMist says
// how thick it lies at a place, 0 to 1: one slow noise fixed in the world that drifts down the wind on the clock, so
// that it stands in long low banks with open grass between; it comes on from a little inside the railings outward and
// is gone before the wood. lay is how high in the bank one asks, in steps of 1.6 m from 0.9 m up: the higher, the less
// ground the mist covers, and every height has its own slip of the noise, so that a bank is a body with a core and
// thin skirts and has depth when one looks along it. Nothing in it asks where the eye is.
// IT LIES IN BANDS WITH CLEAR GRASS BETWEEN: long banks some 20 to 40 m through that lie along the wind, with lanes of
// clear grass as wide between them, the whole drifting down the wind with the banks' own noise. And none lies on the
// entry's axis behind the entry: within 20 m of that axis (the strip of open grass the plan keeps there) from the entry
// outward there is no mist, and it comes on over the next 12 m to the side.
const MIST_GLSL = /* glsl */`
uniform vec4 uMistLaw; uniform vec2 uMistOff;
float nfMist(vec2 xz, float lay) {
  vec2 q = (xz + uMistOff - uWind.xy * uTime * .7) * .0075; float r = length(xz - uFirePos.xz);
  float m = nfFbm(q * vec2(1., .5) + vec2(q.y * .5, 0.) + lay * vec2(.05, .03)) * .8 + .2 * nfNoise(q * 4.1 + lay * 3.), lo = uMistLaw.x + .07 * lay;
  vec2 b = xz + uMistOff - uWind.xy * uTime * .7; float bands = smoothstep(.4, .56, nfNoise(vec2(dot(b, vec2(-uWind.y, uWind.x)) / 26., dot(b, uWind.xy) / 170.) + lay * .09));
  float axis = 1. - (1. - smoothstep(20., 32., abs(xz.x - uFirePos.x))) * smoothstep(-6., 6., xz.y);
  return smoothstep(lo, lo + uMistLaw.y, m) * bands * axis * smoothstep(uMistLaw.z, uMistLaw.w, r) * (1. - smoothstep(540., 690., r));
}
`;

// pauses by the size of the work done: w is a rough measure of that work; the frame is handed back once about a
// frame's worth has gathered (36 of them), so that the build neither holds a frame back nor waits on frames it does
// not need; a pause with no measure always hands the frame back (the result of a build never depends on where it
// pauses)
const metered = (ctx) => { let acc = 0; return (w = 36) => { acc += w; if (acc < 36) return undefined; acc = 0; return ctx.yield(); }; };

// ---------------------------------------------------------------- a small geometry writer
class Geo {
  // (the lists of an attribute are typed and grow by doubling, so that writing a large mesh leaves nothing behind to be
  // cleared away while the world is being built)
  constructor(spec) { this.spec = spec; this.keys = Object.keys(spec); this.sizes = this.keys.map((k) => spec[k]); this.cap = 2048; this.bufs = this.sizes.map((sz) => new Float32Array(this.cap * sz)); this.idx = []; this.n = 0; }
  v(vals) {
    const keys = this.keys, sizes = this.sizes, n = this.n;
    if (n === this.cap) { this.cap *= 2; this.bufs = this.bufs.map((b, j) => { const nb = new Float32Array(this.cap * sizes[j]); nb.set(b); return nb; }); }
    const bufs = this.bufs;
    for (let j = 0; j < keys.length; j++) {
      const x = vals[keys[j]], b = bufs[j], sz = sizes[j], o = n * sz;
      if (sz === 1) b[o] = x; else { b[o] = x[0]; b[o + 1] = x[1]; if (sz > 2) { b[o + 2] = x[2]; if (sz > 3) b[o + 3] = x[3]; } }
    }
    return this.n++;
  }
  attr(j) { return new THREE.BufferAttribute(this.bufs[j].slice(0, this.n * this.sizes[j]), this.sizes[j]); }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  build() {
    const g = new THREE.BufferGeometry();
    for (let j = 0; j < this.keys.length; j++) g.setAttribute(this.keys[j], this.attr(j));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : this.idx);
    // (every mesh made here is drawn whether or not its bounds are in view, so the bounds are one wide round)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(FIRE[0], 0, FIRE[1]), 3000);
    return g;
  }
  // the same, pausing between the attributes of a large mesh
  async buildIn(pause) {
    const g = new THREE.BufferGeometry();
    for (let j = 0; j < this.keys.length; j++) { g.setAttribute(this.keys[j], this.attr(j)); await pause(); }
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : this.idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(FIRE[0], 0, FIRE[1]), 3000);
    return g;
  }
  get triangles() { return this.idx.length / 3; }
}
// many pieces gathered into one mesh: each is written on its own and all are laid end to end at the last, so that no
// list grows long while it is being written
class Pieces {
  constructor(spec) { this.spec = spec; this.keys = Object.keys(spec); this.parts = []; this.n = 0; this.ni = 0; }
  // a piece: { n, a: one typed list for each attribute in the spec's order, idx }
  add(piece) { const v0 = this.n; this.parts.push({ v0, a: piece.a, idx: piece.idx }); this.n += piece.n; this.ni += piece.idx.length; return v0; }
  async buildIn(pause) {
    const g = new THREE.BufferGeometry();
    for (let j = 0; j < this.keys.length; j++) {
      const sz = this.spec[this.keys[j]], arr = new Float32Array(this.n * sz);
      for (const p of this.parts) arr.set(p.a[j], p.v0 * sz);
      g.setAttribute(this.keys[j], new THREE.BufferAttribute(arr, sz)); await pause();
    }
    const idx = new Uint32Array(this.ni); let o = 0;
    for (const p of this.parts) { const src = p.idx, v0 = p.v0; for (let i = 0; i < src.length; i++) idx[o + i] = src[i] + v0; o += src.length; }
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(FIRE[0], 0, FIRE[1]), 3000);
    return g;
  }
  get triangles() { return this.ni / 3; }
}
// a tube along a list of points with radii, into a Geo that carries position, normal and whatever `extra(i, t)` gives
function tubeInto(G, pts, radii, sides, extra, capEnd = false) {
  const rows = [], up0 = new THREE.Vector3(0, 1, 0), tan = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3(), pos3 = [0, 0, 0], nrm3 = [0, 0, 0];
  let prevN = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    tan.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    if (!prevN) { nrm.copy(Math.abs(tan.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up0).addScaledVector(tan, -tan.dot(Math.abs(tan.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up0)).normalize(); }
    else nrm.copy(prevN).addScaledVector(tan, -tan.dot(prevN)).normalize();
    prevN = nrm.clone(); bin.crossVectors(tan, nrm).normalize();
    const row = [], r = radii[i], rec = { position: pos3, normal: nrm3, ...(extra ? extra(i, i / (pts.length - 1)) : null) };
    for (let k = 0; k <= sides; k++) {
      const an = k / sides * TAU, cx = Math.cos(an), sx = Math.sin(an);
      nrm3[0] = nrm.x * cx + bin.x * sx; nrm3[1] = nrm.y * cx + bin.y * sx; nrm3[2] = nrm.z * cx + bin.z * sx;
      pos3[0] = pts[i][0] + nrm3[0] * r; pos3[1] = pts[i][1] + nrm3[1] * r; pos3[2] = pts[i][2] + nrm3[2] * r;
      row.push(G.v(rec));
    }
    rows.push(row);
  }
  for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < sides; k++) G.quad(rows[i][k], rows[i][k + 1], rows[i + 1][k + 1], rows[i + 1][k]);
  if (capEnd) {
    const i = pts.length - 1, ex = extra ? extra(i, 1) : {}, c = G.v({ position: pts[i], normal: [tan.x, tan.y, tan.z], ...ex });
    for (let k = 0; k < sides; k++) G.tri(rows[i][k], rows[i][k + 1], c);
  }
}

// ---------------------------------------------------------------- tents: shape
// A tent is a footprint (a circle, a six-sided figure, or a stadium round a ridge of half-length L), a wall, and a roof
// profile: a list of [f, g] from the eave (1, 0) to the top, f the share of the radius left, g the share of the rise.
const bell = (s) => 0.5 - 0.5 * Math.cos(Math.PI * s);
function roofProfile(kind, sag, rows) {
  const out = [];
  if (kind === 1) {
    // a raised lantern crown: the sweep, a short upright drum, a small cap over it
    for (const [x, g] of [[0, 0], [0.2, 0.07], [0.4, 0.19], [0.58, 0.35], [0.7, 0.49], [0.78, 0.62]]) out.push([1 - x, g]);
    out.push([0.22, 0.75], [0.27, 0.76], [0.13, 0.89], [0.012, 1]);
    return out;
  }
  for (let k = 0; k <= rows; k++) {
    const g = k / rows;
    if (kind === 4) out.push([Math.max(0.012, Math.pow(0.5 + 0.5 * Math.cos(Math.PI * Math.pow(g, 0.85)), 0.72)), g]);
    else if (kind === 5) out.push([1 - 0.4 * g, g]);
    else if (kind === 6) { const f = Math.max(0.012, 1 - g); out.push([f, 1 - f * f]); }
    else { const x = Math.pow(g, 1 / sag); out.push([Math.max(0.012, 1 - x), g]); }
  }
  return out;
}
// the footprint at q metres round the perimeter (local frame, ridge along x): point, outward normal, ridge anchor
function perimAt(T, q) {
  const { L, R } = T, capLen = Math.PI * R;
  if (T.hex) {
    const side = Math.min(5, Math.floor(q / R + 1e-6)), t = q / R - side, a0 = side * TAU / 6, a1 = a0 + TAU / 6, am = (a0 + a1) / 2;
    return [R * lerp(Math.cos(a0), Math.cos(a1), t), R * lerp(Math.sin(a0), Math.sin(a1), t), Math.cos(am), Math.sin(am), 0];
  }
  if (q < capLen) { const a = q / R - Math.PI / 2; return [L + R * Math.cos(a), R * Math.sin(a), Math.cos(a), Math.sin(a), L]; }
  q -= capLen;
  if (q < 2 * L) return [L - q, R, 0, 1, L - q];
  q -= 2 * L;
  if (q < capLen) { const a = q / R + Math.PI / 2; return [-L + R * Math.cos(a), R * Math.sin(a), Math.cos(a), Math.sin(a), -L]; }
  q -= capLen;
  return [-L + q, -R, 0, -1, -L + q];
}
const perimeterOf = (T) => (T.hex ? 6 * T.R : 4 * T.L + TAU * T.R);
const wallOf = (T, lx) => (T.wallAt ? T.wallAt(lx) : T.wall);
const peakOf = (T, cx) => (T.peakAt ? T.peakAt(cx) : T.peak);
// the tent as a solid: its reach from the ridge at a height, and a place's distance from the ridge in plan
function reachAt(T, y, lx = 0) {
  const w = wallOf(T, lx), pk = peakOf(T, clamp(lx, -T.L, T.L));
  if (y <= w) return T.R;
  if (y >= pk) return 0;
  const g = (y - w) / (pk - w), pr = T.prof;
  for (let i = 1; i < pr.length; i++) if (g <= pr[i][1]) { const a = pr[i - 1], b = pr[i]; return T.R * lerp(a[0], b[0], (g - a[1]) / Math.max(1e-6, b[1] - a[1])); }
  return 0;
}
function toLocal(T, x, z) { const dx = x - T.x, dz = z - T.z; return [dx * T.cr + dz * T.sr, -dx * T.sr + dz * T.cr]; }
function toWorld(T, lx, lz) { return [T.x + lx * T.cr - lz * T.sr, T.z + lx * T.sr + lz * T.cr]; }
// how far outside the tent's canvas a point is (metres; under 0 inside), mast and pennant counted as a thin top
function outsideBy(T, x, y, z) {
  const dx = x - T.x, dz = z - T.z, lx = dx * T.cr + dz * T.sr, lz = -dx * T.sr + dz * T.cr, cx = clamp(lx, -T.L, T.L), d = Math.hypot(lx - cx, lz), top = peakOf(T, cx) + (T.mast || 0);
  // (far off, the distance to its bounding round or to its top is near enough, and never more than the true one)
  if (d - T.R > 20 || y - top > 20) return Math.max(d - T.R, y - top);
  let best = Infinity;
  for (let k = 0; k <= 8; k++) { const yy = top * k / 8, r = Math.max(reachAt(T, yy, lx), yy <= top ? 0.3 : 0), e = Math.hypot(Math.max(0, d - r), y - yy); if (e < best) best = e; }
  const rr = reachAt(T, y, lx);
  if (y <= top && d < Math.max(rr, 0.3)) return d - Math.max(rr, 0.3);
  return best;
}
// the smallest clearance between a tent and the route's eyes
export function tentClear(T, route) {
  // (eyes further than 14 m beyond the tent's reach, or as far above its top, cannot be the nearest that matters)
  let best = Infinity; const E = route.eyes, reach = T.L + T.R + 14, over = peakOf(T, 0) + (T.mast || 0) + 14 + (T.peakAt ? 60 : 0);
  for (let i = 0; i < route.count; i++) {
    const x = E[i * 3], y = E[i * 3 + 1], z = E[i * 3 + 2];
    if (Math.abs(x - T.x) > reach || Math.abs(z - T.z) > reach || y > over) continue;
    const lx = (x - T.x) * T.cr + (z - T.z) * T.sr, lz = -(x - T.x) * T.sr + (z - T.z) * T.cr, cx = clamp(lx, -T.L, T.L);
    if (Math.hypot(lx - cx, lz) - T.R > 14) continue;
    const e = outsideBy(T, x, y, z); if (e < best) best = e;
  }
  return best;
}
// the gap in plan between two tents' walls
function tentGap(A, B) {
  // (far apart, the gap between their bounding rounds is near enough and is never more than the true gap)
  const far = Math.hypot(A.x - B.x, A.z - B.z) - A.L - A.R - B.L - B.R; if (far > 14) return far;
  // (a round tent's ridge is one point: its middle)
  let best = Infinity; const ni = A.L > 0 ? 2 : 0, nj = B.L > 0 ? 2 : 0;
  for (let i = -ni; i <= ni; i++) {
    const ax = A.x + A.L * i / 2 * A.cr, az = A.z + A.L * i / 2 * A.sr;
    for (let j = -nj; j <= nj; j++) { const d = Math.hypot(ax - B.x - B.L * j / 2 * B.cr, az - B.z - B.L * j / 2 * B.sr) - A.R - B.R; if (d < best) best = d; }
  }
  return best;
}
function finishTent(T) {
  T.cr = Math.cos(T.rot); T.sr = Math.sin(T.rot);
  T.prof = roofProfile(T.kind, T.sag, T.rows);
  // stripes: an even count, with a pole at every second seam and a string of lights down the roof at every sp-th seam
  const per = perimeterOf(T), k = T.strK || 3;
  if (T.hex) { const j = Math.max(1, Math.round(per / T.swWant / 12)); T.n = 12 * j; T.sp = 2 * j; }
  else { const nStr = Math.max(3, Math.round(per / (T.swWant * 2 * k))); T.n = 2 * k * nStr; T.sp = 2 * k; }
  T.sw = per / T.n; T.per = per; T.slope = Math.hypot(T.R, T.peak - T.wall);
  return T;
}

// ---------------------------------------------------------------- tents: canvas geometry
const TENT_SPEC = { position: 3, normal: 3, aS: 1, aP: 4, aDoor: 4, aK: 4, aVis: 2 };
// one column of a tent's canvas, as its mesh has it: j counts half stripes round the foot. Writes the world points of
// its rows (wall foot, wall middle, eave, the roof's rows, two of the valance) into pts and gives the column's measures.
function tentColumn(T, j, pts) {
  const segs = T.n * 2, prof = T.prof, nR = prof.length, q = (((j % segs) + segs) % segs) * T.per / segs, s = j / 2, pm = perimAt(T, q), px = pm[0], pz = pm[1], nx = pm[2], nz = pm[3], cx = pm[4], b = bell(s);
  const eaveY = wallOf(T, px) - T.eaveSag * b, pk = peakOf(T, cx), inb = -0.1 * b;
  const W = (k, lx, y, lz) => { pts[k * 3] = T.x + lx * T.cr - lz * T.sr; pts[k * 3 + 1] = y; pts[k * 3 + 2] = T.z + lx * T.sr + lz * T.cr; };
  W(0, px, 0, pz); W(1, px + nx * inb, eaveY * 0.5, pz + nz * inb); W(2, px, eaveY, pz);
  for (let r = 0; r < nR; r++) {
    // (a roof drawn to its top closes there: no slit is left along a ridge)
    const f = prof[r][0] <= 0.0121 ? 0 : prof[r][0], g = prof[r][1], rx = cx + (px - cx) * f, ry = T.roofAt ? T.roofAt(rx, f) - T.eaveSag * b * f : lerp(eaveY, pk, g);
    W(3 + r, rx, ry - T.roofSag * b * 4 * g * (1 - g) * f, pz * f);
  }
  W(3 + nR, px + nx * 0.1, eaveY + 0.03, pz + nz * 0.1); W(4 + nR, px + nx * 0.24, eaveY - T.val, pz + nz * 0.24);
  return { q, s, b, ox: nx * T.cr - nz * T.sr, oz: nx * T.sr + nz * T.cr };
}
// a place on a tent's cloth, on the mesh itself: s stripes round the foot, hh up it (0 to 1 the wall from foot to eave,
// 1 to 2 the roof from eave to top). Gives the point, the cloth's outward normal, the level way along the cloth, how
// many stripes a metre that way crosses, and how far the cloth there bellies in a gust (as its vertices do). cols: a
// Map of this tent's columns already worked out, so that many places on one tent work each column once.
const columnOf = (T, j, cols) => { let c = cols.get(j); if (!c) { const p = new Float64Array((T.prof.length + 5) * 3); c = { p, m: tentColumn(T, j, p) }; cols.set(j, c); } return c; };
function clothAt(T, s, hh, cols) {
  const j0 = Math.floor(s * 2), fs = s * 2 - j0, ca = columnOf(T, j0, cols), cb = columnOf(T, j0 + 1, cols), A = ca.m, B = cb.m, CA = ca.p, CB = cb.p, pr = T.prof, nR = pr.length;
  let k0, fh, v0, v1;
  if (hh <= 1) { k0 = hh < 0.5 ? 0 : 1; fh = hh * 2 - k0; v0 = k0; v1 = 1 - k0; }
  else {
    const g = hh - 1; let r = 1; while (r < nR - 1 && pr[r][1] < g) r++;
    k0 = 2 + r; fh = clamp((g - pr[r - 1][1]) / Math.max(1e-6, pr[r][1] - pr[r - 1][1]), 0, 1); v0 = 0.7 * Math.sin(Math.PI * pr[r - 1][1]); v1 = 0.7 * Math.sin(Math.PI * pr[r][1]);
  }
  const a = k0 * 3, c = a + 3, p = [0, 0, 0], dS = [0, 0, 0], dH = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const p00 = CA[a + i], p01 = CA[c + i], p10 = CB[a + i], p11 = CB[c + i];
    p[i] = lerp(lerp(p00, p01, fh), lerp(p10, p11, fh), fs); dS[i] = lerp(p10 - p00, p11 - p01, fh); dH[i] = lerp(p01 - p00, p11 - p10, fs);
  }
  const ls = Math.hypot(dS[0], dS[1], dS[2]) || 1e-6, n = [dH[1] * dS[2] - dH[2] * dS[1], dH[2] * dS[0] - dH[0] * dS[2], dH[0] * dS[1] - dH[1] * dS[0]], ln = Math.hypot(n[0], n[1], n[2]) || 1e-6;
  const sg = (n[0] * A.ox + n[1] * 0.4 + n[2] * A.oz) < 0 ? -1 : 1;
  return { p, n: [n[0] / ln * sg, n[1] / ln * sg, n[2] / ln * sg], t: [dS[0] / ls, dS[1] / ls, dS[2] / ls], perM: 0.5 / ls, belly: lerp(A.b, B.b, fs) * lerp(v0, v1, fh), q: A.q + fs * T.per / (T.n * 2) };
}
function tentInto(T) {
  const segs = T.n * 2, per = T.per, prof = T.prof, nR = prof.length, rows = 3 + nR + 2, nv = (segs + 1) * rows;
  const aPos = new Float32Array(nv * 3), aNrm = new Float32Array(nv * 3), aS = new Float32Array(nv), aP = new Float32Array(nv * 4), aDoor = new Float32Array(nv * 4), aK = new Float32Array(nv * 4), aVis = new Float32Array(nv * 2).fill(1);
  const idx = new Uint32Array(segs * (nR + 2) * 6);
  let v = 0, ii = 0;
  // every column of the canvas: three points up the wall, the roof's rows, two of the valance; written straight into
  // the mesh (heights h: wall 0, 0.5, 1; roof 1 + rise; valance 3, 4)
  const pts = new Float64Array(rows * 3), aK1 = T.sp * T.sw;
  for (let j = 0; j <= segs; j++) {
    const col = tentColumn(T, j, pts), q = col.q, s = col.s, ox = col.ox, oz = col.oz;
    let dq = 999, door = null;
    for (const d of T.doors) { const e = ((q - d.q + per * 1.5) % per) - per / 2; if (Math.abs(e) < Math.abs(dq)) { dq = e; door = d; } }
    const d1 = door ? door.hw : 0, d2 = door ? door.h : 0, d3 = door ? door.open : 0;
    for (let k = 0; k < rows; k++) {
      let n0 = ox, n1 = 0, n2 = oz, h = k === 0 ? 0 : k === 1 ? 0.5 : k === 2 ? 1 : k >= 3 + nR ? k - nR : 1 + prof[k - 3][1];
      if (k >= 3 && k < 3 + nR) {
        // a roof vertex's normal from the slope of its own column: square to the run of the canvas, in the plane of up and out
        const k0 = Math.max(3, k - 1), k1 = Math.min(2 + nR, k + 1), a = (pts[k1 * 3] - pts[k0 * 3]) * ox + (pts[k1 * 3 + 2] - pts[k0 * 3 + 2]) * oz, bb = pts[k1 * 3 + 1] - pts[k0 * 3 + 1], l = Math.hypot(a, bb);
        if (l < 1e-6) { n0 = ox * 0.5; n1 = 0.86; n2 = oz * 0.5; } else if (bb >= 0) { n0 = ox * bb / l; n1 = -a / l; n2 = oz * bb / l; } else { n0 = -ox * bb / l; n1 = a / l; n2 = -oz * bb / l; }
      }
      const o3 = v * 3, o4 = v * 4;
      aPos[o3] = pts[k * 3]; aPos[o3 + 1] = pts[k * 3 + 1]; aPos[o3 + 2] = pts[k * 3 + 2]; aNrm[o3] = n0; aNrm[o3 + 1] = n1; aNrm[o3 + 2] = n2; aS[v] = s;
      aP[o4] = h; aP[o4 + 1] = T.gust ?? T.phase; aP[o4 + 2] = T.sw; aP[o4 + 3] = T.slope; aDoor[o4] = door ? dq : 999; aDoor[o4 + 1] = d1; aDoor[o4 + 2] = d2; aDoor[o4 + 3] = d3;
      aK[o4] = s / T.sp; aK[o4 + 1] = aK1; aK[o4 + 2] = T.poleLights || 0; aK[o4 + 3] = T.interior; v++;
    }
  }
  const quad = (a, b, c, d) => { idx[ii] = a; idx[ii + 1] = b; idx[ii + 2] = c; idx[ii + 3] = a; idx[ii + 4] = c; idx[ii + 5] = d; ii += 6; };
  for (let j = 0; j < segs; j++) {
    const a = j * rows, b = a + rows;
    for (let r = 0; r < 2; r++) quad(a + r, a + r + 1, b + r + 1, b + r);
    for (let r = 0; r < nR - 1; r++) quad(a + 3 + r, a + 4 + r, b + 4 + r, b + 3 + r);
    quad(a + 4 + nR, a + 3 + nR, b + 3 + nR, b + 4 + nR);
  }
  return { n: nv, a: [aPos, aNrm, aS, aP, aDoor, aK, aVis], idx };
}
// places on a tent the other things hang from: the eave (g = 0) or the roof at s stripes round and g up its rise
function tentPoint(T, s, g, lift = 0) {
  const q = ((s % T.n) + T.n) % T.n * T.sw, [px, pz, nx, nz, cx] = perimAt(T, q), b = bell(s), eaveY = wallOf(T, px) - T.eaveSag * b, pk = peakOf(T, cx);
  if (g <= 0) { const w = toWorld(T, px + nx * lift, pz + nz * lift); return [w[0], eaveY, w[1]]; }
  const pr = T.prof; let f = pr[pr.length - 1][0];
  for (let i = 1; i < pr.length; i++) if (g <= pr[i][1] + 1e-6) { const a = pr[i - 1], c = pr[i]; f = lerp(a[0], c[0], (g - a[1]) / Math.max(1e-6, c[1] - a[1])); break; }
  const rx = cx + (px - cx) * f, w = toWorld(T, rx, pz * f);
  return [w[0], (T.roofAt ? T.roofAt(rx, f) - T.eaveSag * b * f : lerp(eaveY, pk, g)) + lift, w[1]];
}
// the tops a mast stands on: one for a round tent, the ridge's ends for a long one
function tentTops(T) {
  if (T.special === 'collar' || T.special === 'steps') return [];
  const xs = T.L > 0 ? (T.special ? [-T.L, 0, T.L] : [-T.L, T.L]) : [0];
  return xs.map((lx) => { const w = toWorld(T, lx, 0); return [w[0], peakOf(T, lx), w[1]]; });
}

// ---------------------------------------------------------------- tents: shade baked into the canvas
// Every canvas vertex carries how much of the moon and how much of the fire it sees past the other tents, each of them
// taken as the solid its canvas encloses. A taller neighbour's shadow lies on a lower roof and wall; canvas that lies
// behind another tent as seen from the fire is in that tent's shadow.
async function shadeInto(T, arrays, tents, moonDir, pause) {
  const pos = arrays.a[0], nrm = arrays.a[1], vis = arrays.a[6], n = arrays.n, fy = 7, reach = T.L + T.R;
  const ml = Math.hypot(moonDir.x, moonDir.z) || 1, ux = moonDir.x / ml, uz = moonDir.z / ml;
  const fdx = FIRE[0] - T.x, fdz = FIRE[1] - T.z, fl = Math.hypot(fdx, fdz) || 1, vx = fdx / fl, vz = fdz / fl;
  const toMoon = [], toFire = [];
  for (const B of tents) {
    if (B === T) continue;
    const dx = B.x - T.x, dz = B.z - T.z, rr = reach + B.L + B.R;
    const am = dx * ux + dz * uz, cm = Math.abs(dx * uz - dz * ux); if (cm < rr && am > -rr && am < B.peak * ml / Math.max(0.12, moonDir.y) + rr) toMoon.push(B);
    const af = dx * vx + dz * vz, cf = Math.abs(dx * vz - dz * vx); if (cf < rr && af > -rr && af < fl + rr) toFire.push(B);
  }
  // one ray against one tent's solid: how deep inside it the ray from (x, y, z) along (dx, dy, dz) runs, up to the
  // length far. The ray is written in a typed list (x, y, z, dx, dy, dz, far) and the deepest of all asks is kept in
  // run[0], so that some millions of asks leave nothing behind to be cleared away.
  const run = new Float64Array(1), ray = new Float64Array(7);
  const rayInto = (B) => {
    const x = ray[0], y = ray[1], z = ray[2], dx = ray[3], dy = ray[4], dz = ray[5], far = ray[6];
    const ox = x - B.x, oz = z - B.z, rb = B.L + B.R, a = dx * dx + dz * dz, b = ox * dx + oz * dz, c = ox * ox + oz * oz - rb * rb, disc = b * b - a * c;
    if (disc <= 0 || a < 1e-6) return;
    const sq = Math.sqrt(disc); let t0 = Math.max(0.6, (-b - sq) / a), t1 = Math.min(far, (-b + sq) / a);
    if (dy > 1e-4) t1 = Math.min(t1, (B.peak - y) / dy);
    if (t1 <= t0) return;
    for (let i = 0; i < 4; i++) {
      const t = t0 + (t1 - t0) * (i + 0.5) / 4, px = ox + dx * t, pz = oz + dz * t, lx = px * B.cr + pz * B.sr, lz = -px * B.sr + pz * B.cr, ex = lx - Math.max(-B.L, Math.min(B.L, lx));
      const d = reachAt(B, y + dy * t, lx) - Math.sqrt(ex * ex + lz * lz); if (d > run[0]) run[0] = d;
    }
  };
  const seen = (depth) => 1 - clamp((depth + 0.4) / 2.2, 0, 1);
  // every second column of the canvas is asked (a column is half a stripe); the columns between take the mean of
  // their two neighbours
  const rows = Math.round(n / (T.n * 2 + 1)), cols = T.n * 2 + 1;
  let done = 0;
  for (let j = 0; j < cols; j += 2) for (let k = 0; k < rows; k++) {
    const v = j * rows + k, x = pos[v * 3] + nrm[v * 3] * 0.4, y = pos[v * 3 + 1] + nrm[v * 3 + 1] * 0.4 + 0.1, z = pos[v * 3 + 2] + nrm[v * 3 + 2] * 0.4;
    // (cloth that faces away from a light takes none of it and is not asked; nor is cloth beyond the fire's reach of 130 m)
    const nx = nrm[v * 3], ny = nrm[v * 3 + 1], nz = nrm[v * 3 + 2];
    // (once a ray runs 1.8 m deep in a solid the cloth is in full shade: no further tent is asked)
    run[0] = -9; ray[0] = x; ray[1] = y; ray[2] = z; ray[3] = moonDir.x; ray[4] = moonDir.y; ray[5] = moonDir.z; ray[6] = 400;
    if (nx * moonDir.x + ny * moonDir.y + nz * moonDir.z > -0.3) for (let b = 0; b < toMoon.length && run[0] <= 1.8; b++) rayInto(toMoon[b]);
    vis[v * 2] = seen(run[0]);
    const gx = FIRE[0] - x, gy = fy - y, gz = FIRE[1] - z, gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
    run[0] = -9; ray[3] = gx / gl; ray[4] = gy / gl; ray[5] = gz / gl; ray[6] = gl - 3;
    if (gl < 132 && nx * gx + ny * gy + nz * gz > -0.3 * gl) for (let b = 0; b < toFire.length && run[0] <= 1.8; b++) rayInto(toFire[b]);
    vis[v * 2 + 1] = seen(run[0]);
    if (++done % 300 === 0) await pause(12);
  }
  for (let j = 1; j < cols - 1; j += 2) for (let k = 0; k < rows; k++) { const v = (j * rows + k) * 2, a = v - rows * 2, b = v + rows * 2; vis[v] = (vis[a] + vis[b]) / 2; vis[v + 1] = (vis[a + 1] + vis[b + 1]) / 2; }
}

// ---------------------------------------------------------------- what an opening shows when its inside is not drawn
// A flown tent's inside is drawn within a distance of its own openings (its flaps, its crown). Beyond that every opening
// shows a pale sheet standing a little way in, of the colour of what is within: brightest at its foot behind a flap, in
// its middle under the crown. It is drawn exactly when the inside is not, so no opening is ever seen empty.
// list: { c: middle, u: half its width, v: half its height (vectors in metres), col, round }
function standInMesh(L, list) {
  const G = new Geo({ position: 3, aQ: 2, aC: 4 });
  for (const s of list) {
    const k = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => G.v({ position: [s.c[0] + s.u[0] * a + s.v[0] * b, s.c[1] + s.u[1] * a + s.v[1] * b, s.c[2] + s.u[2] * a + s.v[2] * b], aQ: [a, b], aC: [s.col[0], s.col[1], s.col[2], s.round ? 1 : 0] }));
    G.quad(k[0], k[1], k[2], k[3]);
  }
  const mesh = new THREE.Mesh(G.build(), new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aQ; attribute vec4 aC; varying vec3 vW; varying vec2 vQ; varying vec4 vC;
      void main() { vW = position; vQ = aQ; vC = aC; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying vec2 vQ; varying vec4 vC;
      ${LIGHT_GLSL}
      void main() {
        float foot = 1. - smoothstep(-1., .5, vQ.y), disc = 1. - smoothstep(.1, 1., length(vQ));
        float k = mix(.1 + .9 * foot, .15 + .85 * disc, step(.5, vC.a)) * (.8 + .4 * nfFbm(vW.xz * .3 + vW.y * .2));
        gl_FragColor = vec4(nfFog(vC.rgb * k, length(cameraPosition - vW)), 1.);
      }`,
  }));
  mesh.frustumCulled = false; mesh.visible = false;
  return mesh;
}

// ---------------------------------------------------------------- the snow room
// The tent beside the lane in whose flap stands open is a room: dark cloth, a floor of snow under one pale lamp, and
// snow falling the whole height of its wall. A tongue of that snow lies out through the flap onto the lane.
function snowRoom(L, door, rng, detail) {
  const T = door.tent, D0 = T.doors[0], lamp = [T.x, T.wall * 0.86, T.z], G = new Geo({ position: 3, aI: 2 }), object = new THREE.Group();
  // the floor: the tent's own footprint, drawn in by 0.3 m
  const mid = G.v({ position: [T.x, 0.07, T.z], aI: [0, 0] }), N = 48; let prev = -1;
  for (let i = 0; i <= N; i++) {
    const pq = perimAt(T, T.per * (i % N) / N), w = toWorld(T, pq[0] - pq[2] * 0.3, pq[1] - pq[3] * 0.3), v = G.v({ position: [w[0], 0.07, w[1]], aI: [0, 0] });
    if (prev >= 0) G.tri(mid, v, prev);
    prev = v;
  }
  // the tongue: from half a metre inside the flap to 9 m out, as wide as the flap and narrowing, its rim broken by drift
  const ox = door.out.x, oz = door.out.z, sx = -oz, sz = ox, rows = 6, cols = 6, grid = [];
  for (let j = 0; j < rows; j++) {
    const along = -0.5 + 9.5 * j / (rows - 1), wide = lerp(D0.hw + 0.8, D0.hw * 0.45, j / (rows - 1));
    for (let i = 0; i < cols; i++) {
      const s = i / (cols - 1) * 2 - 1, rim = Math.max(Math.abs(s), j / (rows - 1));
      grid.push(G.v({ position: [door.at.x + ox * along + sx * s * wide, 0.05, door.at.z + oz * along + sz * s * wide], aI: [clamp(along / 1.5, 0, 1), along < 0.5 ? 0 : rim] }));
    }
  }
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const a = grid[j * cols + i], b = a + 1, c = grid[(j + 1) * cols + i], d = c + 1; G.quad(a, c, d, b); }
  const U = { ...L.uniforms, uLamp: { value: new THREE.Vector4(lamp[0], lamp[1], lamp[2], 0.95) } };
  const floor = new THREE.Mesh(G.build(), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aI; varying vec3 vW; varying vec2 vI;
      void main() { vW = position; vI = aI; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec4 uLamp; varying vec3 vW; varying vec2 vI;
      ${LIGHT_GLSL}
      void main() {
        float n1 = nfFbm(vW.xz * .45), n2 = nfNoise(vW.xz * 3.1);
        if (vI.y + .34 * n1 + .1 * n2 > .93) discard;
        vec3 up = normalize(vec3((n1 - .5) * .7, 1., (nfFbm(vW.xz * .45 + 7.3) - .5) * .7));
        vec3 toL = uLamp.xyz - vW; float d = length(toL);
        vec3 lampL = vec3(.86, .92, 1.04) * uLamp.w * clamp(dot(up, toL / max(d, .01)), 0., 1.) / (1. + d * d * .02);
        vec3 light = lampL + (nfHemi(up) + nfMoon(up, .1) + nfFire(vW, up, .1)) * vI.x + uSkyCol * .05;
        vec3 col = vec3(.84, .86, .9) * (.8 + .3 * n1) * (.94 + .12 * n2) * light;
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW)), 1.);
      }`,
  }));
  floor.frustumCulled = false; object.add(floor);
  // the snow within: flakes that fall from the eave's height to the floor and begin again, and the lamp itself
  const n = Math.round(1100 * detail) + 1, aP = new Float32Array(n * 3), aSeed = new Float32Array(n * 4), top = T.wall + 1.5;
  aP.set(lamp, 0); aSeed.set([0, 0, 0.3, 3.2], 0);
  for (let i = 1; i < n; i++) {
    const lx = rng.range(-T.L - T.R, T.L + T.R), lz = rng.range(-T.R, T.R), cx = clamp(lx, -T.L, T.L), ok = Math.hypot(lx - cx, lz) < T.R * (T.hex ? 0.8 : 1) - 0.7, w = toWorld(T, ok ? lx : cx * 0.6, ok ? lz : lz * 0.4);
    aP.set([w[0], rng() * top, w[1]], i * 3); aSeed.set([rng(), 0.6 + 0.6 * rng(), rng.range(0.03, 0.075), 1], i * 4);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 3)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); g.instanceCount = n;
  const flakes = new THREE.Mesh(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...U, uTop: { value: top } },
    vertexShader: /* glsl */`
      attribute vec3 aP; attribute vec4 aSeed; uniform float uTime, uTop; uniform vec4 uLamp; varying vec2 vQ; varying float vA;
      void main() {
        float fall = aSeed.y, lampIs = step(2., aSeed.w);
        vec3 p = aP; p.y = mix(uTop - mod(uTop - aP.y + uTime * fall, uTop), aP.y, lampIs);
        p.xz += (1. - lampIs) * .22 * vec2(sin(uTime * .7 + aSeed.x * 40.), cos(uTime * .53 + aSeed.x * 23.));
        vec4 mv = viewMatrix * vec4(p, 1.); float dist = length(mv.xyz), k = max(aSeed.z, .0014 * dist), d = distance(p, uLamp.xyz);
        mv.xy += position.xy * k; vQ = position.xy;
        vA = aSeed.w * (aSeed.z * aSeed.z) / (k * k) * mix(.25 + 1.1 / (1. + d * d * .03), 1., lampIs);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vA;
      void main() { float a = 1. - smoothstep(.35, 1., length(vQ)); gl_FragColor = vec4(vec3(.88, .93, 1.04) * a * vA, 1.); }`,
  }));
  flakes.frustumCulled = false; flakes.renderOrder = 2; object.add(flakes);
  return object;
}

// ---------------------------------------------------------------- tents: the deal
// Three tents are flown through and stand where the plan puts them: the garden of ice, the cloud steps and the candle
// tree's collar. Three more are fixed by the route (the two at the lane's mouth and the tall one the lane bends round).
// Every other tent is dealt on its ring, then settled: slid along its ring or drawn smaller until it keeps 8 m from the
// route's line in three dimensions, a lane from every other tent, and clear of the clock's round and the gate lane.
// Last, the tents beside the lanes the line takes on foot are set back to 12 m from it (THE LANES' WALLS, below).
const LANE_WALL = 12;
function dealTents(route, rng, vary, pause) {
  const P = PLACES, tents = [], kinds = [], dens = vary.density ?? 1;
  const bag = () => { if (!kinds.length) { kinds.push(0, 1, 2, 3, 4); rng.shuffle(kinds); } return kinds.pop(); };
  const bearingOf = (x, z) => Math.atan2(x - FIRE[0], z - FIRE[1]) / RAD;
  // the door stands in the middle of a panel, where the wall faces a direction (dx, dz)
  const doorToward = (T, dx, dz, hw, h, open) => {
    let bq = 0, bd = -2;
    for (let i = 0; i < T.n / 2; i++) { const q = (2 * i + 1) * T.sw, p = perimAt(T, q), w = toWorld(T, p[2], p[3]), d = (w[0] - T.x) * dx + (w[1] - T.z) * dz; if (d > bd) { bd = d; bq = q; } }
    T.doors.push({ q: bq, hw, h, open });
  };
  const draw = (ring, x, z, dia, peak, kind) => {
    const small = ring === 3, T = { ring, x, z, kind, dia, peak, L: 0, R: dia / 2, hex: kind === 3, rot: rng() * TAU, doors: [], interior: 0 };
    if (kind === 2) { T.L = T.R * rng.range(0.45, 0.8); T.R *= 0.82; T.rot = Math.atan2(x - FIRE[0], -(z - FIRE[1])) + rng.range(-0.25, 0.25); }
    T.wall = small ? rng.range(2.4, 3.2) : clamp(dia * rng.range(0.2, 0.27), 3.8, 7.2);
    T.sag = kind === 3 ? rng.range(1.05, 1.25) : rng.range(1.35, 1.9); T.rows = 6; T.eaveSag = rng.range(0.15, 0.4) * (small ? 0.5 : 1); T.roofSag = rng.range(0.1, 0.35) * (small ? 0.4 : 1);
    T.val = rng.range(0.5, 0.85) * (small ? 0.6 : 1); T.swWant = small ? rng.range(1.2, 1.5) : rng.range(1.2, 2.6); T.strK = small ? 2 : rng.pick([2, 3, 3, 4]);
    T.phase = rng() * TAU; T.tone = rng.range(0.92, 1.04); T.mast = small ? 1.4 : rng.range(2.6, 4.4); T.pennant = rng.chance(0.5) ? 1 : 0;
    T.doorSide = rng.chance(0.5) ? 1 : -1; T.doorW = rng.range(1.5, 2.1) * (small ? 0.6 : 1); T.doorH = small ? 2.1 : rng.range(3.2, 4); T.doorOpen = rng.chance(0.3) ? 1 : 0;
    return finishTent(T);
  };
  const resize = (T, k) => { T.R *= k; T.L *= k; T.dia *= k; T.peak = Math.max(T.peak * (0.5 + 0.5 * k), T.wall + 3); finishTent(T); };
  const keep = [[P.clock[0], P.clock[1], 14]];
  for (let i = 1; i <= 11; i++) keep.push([lerp(P.gate[0], P.clock[0], i / 12), lerp(P.gate[1], P.clock[1], i / 12), 8]);
  // (beside is set once every tent is dealt: how near a tent's canvas stands to the lanes the line takes on foot)
  let beside = null;
  const fault = (T, lane) => {
    let f = Math.max(0, 8 - tentClear(T, route), beside ? LANE_WALL - beside(T) : 0);
    for (const o of tents) f = Math.max(f, (o.special ? lane + 2 : lane) - tentGap(T, o));
    for (const k of keep) { if (Math.hypot(T.x - k[0], T.z - k[1]) > k[2] + T.R + T.L) continue; for (let i = -1; i <= 1; i++) { const w = toWorld(T, T.L * i, 0); f = Math.max(f, k[2] + T.R - Math.hypot(w[0] - k[0], w[1] - k[1])); } }
    return f;
  };
  // the same question as a yes or no, the cheap parts first (for the probe of a ring's free arcs)
  const stands = (T, lane) => {
    for (const o of tents) if ((o.special ? lane + 2 : lane) - tentGap(T, o) > 0) return false;
    for (const k of keep) { if (Math.hypot(T.x - k[0], T.z - k[1]) > k[2] + T.R + T.L) continue; for (let i = -1; i <= 1; i++) { const w = toWorld(T, T.L * i, 0); if (k[2] + T.R - Math.hypot(w[0] - k[0], w[1] - k[1]) > 0) return false; } }
    return 8 - tentClear(T, route) <= 0;
  };
  const place = (T, r, b) => { const p = at(r, b); const d = T.rot - Math.atan2(T.x - FIRE[0], -(T.z - FIRE[1])); T.x = p[0]; T.z = p[1]; if (T.kind === 2) T.rot = Math.atan2(p[0] - FIRE[0], -(p[1] - FIRE[1])) + d; T.cr = Math.cos(T.rot); T.sr = Math.sin(T.rot); T.b = b; T.r = r; };
  // slide along the ring or draw smaller until nothing is at fault; false when the tent cannot stand
  const settle = async (T, r, b, minDia, lane, fixed) => {
    place(T, r, b);
    for (let it = 0; it < 18; it++) {
      if (it) await pause(2);
      const f = fault(T, lane); if (f <= 0) return true;
      if (!fixed && it % 3 !== 2) {
        const step = Math.min(4, 1 + f * 0.25) / r / RAD, b0 = T.b;
        place(T, r, b0 + step); const f1 = fault(T, lane); place(T, r, b0 - step); const f2 = fault(T, lane);
        if (Math.min(f1, f2) < f - 0.05) { place(T, r, f1 < f2 ? b0 + step : b0 - step); continue; }
        place(T, r, b0);
      }
      resize(T, 0.9); if (T.dia < minDia) return false;
    }
    return fault(T, lane) <= 0;
  };
  const door = (T) => { const dx = FIRE[0] - T.x, dz = FIRE[1] - T.z, l = Math.hypot(dx, dz) || 1, s = T.ring === 0 ? 1 : T.doorSide; T.doors.length = 0; doorToward(T, dx / l * s, dz / l * s, T.doorW, T.doorH, T.doorOpen); };
  const finish = (T) => { door(T); tents.push(T); return T; };
  // THE LANES' WALLS. Where the line goes on foot (its eye under 10 m: over the meadow, down the lanes, round the fire
  // and on to the flap of the cloud steps) a tent beside it is a wall of canvas beside a lane: its canvas keeps
  // LANE_WALL metres from the line. Once all are dealt, each tent that stands nearer (and no other) is settled again
  // where it stands, by the same steps as before: slid along its ring or drawn smaller until it keeps that distance,
  // its lane from every other tent and the clock's round and the gate lane; one that cannot is left out.
  // It is a second pass over the finished deal, and not a wider keep in the deal itself, because the deal draws from
  // one stream tent after tent: a wider keep there would change what every later tent draws and so move the whole
  // camp, where this pass moves only the tents that stood too near.
  const lanesWalls = async () => {
    const E = route.eyes, foot = []; for (let i = 0; i < route.count; i++) if (E[i * 3 + 1] < 10) foot.push(i);
    beside = (T) => { let b = Infinity; const reach = T.L + T.R + LANE_WALL + 2; for (const i of foot) { const x = E[i * 3], z = E[i * 3 + 2]; if (Math.abs(x - T.x) > reach || Math.abs(z - T.z) > reach) continue; const e = outsideBy(T, x, E[i * 3 + 1], z); if (e < b) b = e; } return b; };
    const moved = [];
    for (const T of tents.slice()) {
      if (T.special || beside(T) >= LANE_WALL) continue;
      const at0 = tents.indexOf(T), was = [T.b ?? bearingOf(T.x, T.z), T.dia]; tents.splice(at0, 1);
      const small = T.ring === 3, ok = await settle(T, Math.hypot(T.x - FIRE[0], T.z - FIRE[1]), bearingOf(T.x, T.z), small ? 5 : 13, small ? 6 : 9, small);
      if (ok) { door(T); tents.splice(at0, 0, T); }
      moved.push({ ring: T.ring, from: was, to: ok ? [T.b, T.dia] : null });
      await pause(4);
    }
    return moved;
  };
  return { tents, bag, draw, settle, finish, resize, place, fault, stands, bearingOf, dens, keep, doorToward, lanesWalls, footGap: (T) => (beside ? beside(T) : Infinity) };
}

async function layTents(route, rng, vary, pause) {
  const P = PLACES, D = dealTents(route, rng, vary, pause), Gd = P.garden, S = P.steps, base = { ring: 4, doors: [], pennant: 1 };
  // the garden of ice: an oval lying from flap to flap
  const gd = [Gd.flaps[1][0] - Gd.flaps[0][0], Gd.flaps[1][1] - Gd.flaps[0][1]];
  const garden = finishTent({ ...base, special: 'garden', x: Gd.c[0], z: Gd.c[1], kind: 0, L: (Gd.len - Gd.wid) / 2, R: Gd.wid / 2, dia: Gd.wid, rot: Math.atan2(gd[1], gd[0]),
    wall: 11, peak: Gd.top, sag: 1.45, rows: 8, eaveSag: 0.3, roofSag: 0.3, val: 0.9, swWant: 2.4, strK: 3, tone: 1, mast: 4, interior: 1, poleLights: 2.8, doors: [] });
  garden.doors.push({ q: Math.PI * garden.R / 2, hw: 6.5, h: 10, open: 2 }, { q: Math.PI * garden.R * 1.5 + 2 * garden.L, hw: 6.5, h: 10, open: 2 });
  // the cloud steps: tall and not wide, its wall rising along its axis from the flap end to the high end
  const ax = head(S.heading), half = S.len / 2, ramp = (lx) => lerp(S.wall0, S.wall1, clamp((lx + half) / S.len, 0, 1));
  // (the roof hangs in sags from rib to rib, a rib every 15 m down from the crown: 3.8 m deep at the middle of a bay)
  const ribSag = (lx) => { const d = lx + half - S.crownAlong, sn = Math.sin(Math.PI * d / 15); return 3.8 * sn * sn * smoothstep(S.crownR, S.crownR + 6, Math.abs(d)); };
  const plane = (lx) => ramp(lx) - ribSag(lx);
  const steps = finishTent({ ...base, special: 'steps', x: S.flap[0] + ax[0] * half, z: S.flap[1] + ax[1] * half, kind: 6, L: (S.len - S.wid) / 2, R: S.wid / 2, dia: S.wid, rot: Math.atan2(ax[1], ax[0]),
    wall: S.wall0, peak: S.wall1 + 5, wallAt: plane, peakAt: (cx) => plane(cx) + 5, roofAt: (lx, f) => plane(lx) + 5 * (1 - f * f),
    sag: 1, rows: 8, eaveSag: 0.85, roofSag: 0.25, val: 1, swWant: 2.5, strK: 3, tone: 1, mast: 0, interior: 2.6, poleLights: 3.5, doors: [] });
  steps.doors.push({ q: Math.PI * steps.R * 1.5 + 2 * steps.L, hw: 6.5, h: 10, open: 2 });
  // the candle tree's collar: a low ring of canvas round an open hoop
  const collar = finishTent({ ...base, special: 'collar', x: P.tree[0], z: P.tree[1], kind: 5, L: 0, R: 25, dia: 50, rot: 0.4, wall: 9, peak: 17, sag: 1, rows: 4,
    eaveSag: 0.3, roofSag: 0.05, val: 0.8, swWant: 2.2, strK: 3, tone: 1, mast: 0, interior: 0.75, doors: [] });
  D.tents.push(garden, steps, collar);
  await pause();
  // fixed by the route: the two tents of the lane's mouth and the tall tent the lane bends round
  const fixedAt = async (xz, ring, dia, peak, minDia) => {
    const T = D.draw(ring, xz[0], xz[1], dia, peak, D.bag());
    if (await D.settle(T, Math.hypot(xz[0] - FIRE[0], xz[1] - FIRE[1]), D.bearingOf(xz[0], xz[1]), minDia, 9, true)) D.finish(T);
  };
  await fixedAt(P.mouth[0], 2, rng.range(24, 29), 28, 16); await pause(); await fixedAt(P.mouth[1], 2, rng.range(22, 27), 24, 16); await pause(); await fixedAt(P.laneTent, 1, rng.range(22, 27), 34, 16); await pause();
  // the inner ring: a tent either side of each gap the route takes, the arcs between filled evenly
  const r0 = P.rings[0], inner = [];
  for (const [g, off] of [[P.gaps[0], 0], [P.gaps[1], 19], [P.gaps[2], 0]]) for (const sg of [-1, 1]) {
    const T = D.draw(0, 0, 0, off ? rng.range(18, 21) : rng.range(18, 24), off ? rng.range(26, 28) : rng.range(18, 28), D.bag());
    const b = g + sg * (off || T.L + T.R + 12.5) / r0 / RAD;
    if (await D.settle(T, r0, b, 14, 9)) { D.finish(T); inner.push(((T.b % 360) + 360) % 360); }
    await pause();
  }
  inner.sort((a, b) => a - b);
  for (let i = 0; i < inner.length; i++) {
    const a = inner[i], gapDeg = (i + 1 < inner.length ? inner[i + 1] : inner[0] + 360) - a;
    if (gapDeg < 62) continue;
    const k = Math.max(1, Math.round(gapDeg / rng.range(40, 52)) - 1);
    for (let j = 1; j <= k; j++) {
      const T = D.draw(0, 0, 0, rng.range(18, 24), rng.range(18, 28), D.bag());
      if (await D.settle(T, r0, a + gapDeg * j / (k + 1) + rng.range(-3, 3), 14, 9)) D.finish(T);
      await pause();
    }
  }
  // the middle ring and the outer ring are dealt arc by arc. A ring's free arcs are the bearings at which a tent of the
  // ring's least size stands clear of the route, the clock's round, the gate lane and all that already stands (the
  // garden's tent, the tallest tent, the collar, the tents the route fixes): the ring closes up to those. The free length
  // is shared out at one pitch, so every arc takes the tents it holds, and along an arc the tents stand with like gaps.
  const dealRing = async (ring, r, want, minDia, lane, dia, peak) => {
    const probe = finishTent({ ring, x: 0, z: 0, kind: 0, dia: minDia, peak: 20, L: 0, R: minDia / 2, hex: false, rot: 0, doors: [], interior: 0, wall: 4, sag: 1.5, rows: 6,
      eaveSag: 0.2, roofSag: 0.2, val: 0.6, swWant: 2, strK: 2, phase: 0, tone: 1, mast: 2, pennant: 0 });
    const N = 720, ok = new Uint8Array(N), mPer = r * RAD * 360 / N;
    for (let i = 0; i < N; i++) { D.place(probe, r, i * 360 / N); ok[i] = D.stands(probe, lane) ? 1 : 0; if (i % 60 === 59) await pause(8); }
    let start = 0; while (start < N - 1 && ok[start]) start++;
    const arcs = []; let free = 0;
    for (let i = 0; i < N;) {
      if (!ok[(start + i) % N]) { i++; continue; }
      let n = 0; while (i + n < N && ok[(start + i + n) % N]) n++;
      const span = (n - 1) * mPer + minDia; arcs.push({ s0: (start + i) * mPer - minDia / 2, span }); free += span + lane; i += n;
    }
    const pitch = Math.max(minDia + lane, free / Math.max(1, want));
    for (const A of arcs) {
      const k = Math.max(1, Math.min(Math.round((A.span + lane) / pitch), Math.floor((A.span + lane) / (minDia + lane)))), row = [];
      let sum = 0;
      for (let j = 0; j < k; j++) { const T = D.draw(ring, 0, 0, rng.range(dia[0], dia[1]), rng.range(peak[0], peak[1]), D.bag()); T.ext = 2 * (T.L + T.R); sum += T.ext; row.push(T); }
      const room = A.span - (k - 1) * lane;
      if (sum > room) { const f = room / sum; sum = 0; for (const T of row) { D.resize(T, f); T.ext = 2 * (T.L + T.R); sum += T.ext; } }
      const e = Math.max(0, room - sum) / (k + 1);
      let s = A.s0 + e;
      for (const T of row) {
        if (await D.settle(T, r, (s + T.ext / 2) / (r * RAD), minDia * 0.8, lane)) D.finish(T);
        s += T.ext + lane + e; await pause(1);
      }
    }
  };
  await dealRing(1, P.rings[1], rng.int(13, 17) - 3, 17, 9, [22, 30], [26, 44]);
  await dealRing(2, P.rings[2], rng.int(20, 25) - 3, 16, 9, [20, 30], [20, 32]);
  // small tents in the lanes between the rings
  const nSmall = Math.round(rng.int(12, 20) * D.dens);
  for (let i = 0, got = 0; i < nSmall * 6 && got < nSmall; i++) {
    const T = D.draw(3, 0, 0, rng.range(6, 9), rng.range(7, 11), rng.pick([0, 0, 3, 4]));
    if (await D.settle(T, (rng.chance(0.5) ? (P.rings[0] + P.rings[1]) / 2 : (P.rings[1] + P.rings[2]) / 2) + rng.range(-5, 5), rng() * 360, 5, 6, true)) { D.finish(T); got++; }
    await pause(1);
  }
  const moved = await D.lanesWalls();
  return { tents: D.tents, garden, steps, collar, D, moved };
}

// ---------------------------------------------------------------- tents: the canvas shader
// Stripes are drawn from the stripe coordinate each vertex carries (whole numbers are seams), so they run up the wall
// and on up the roof to the peak. The canvas bellies between its poles as gusts cross the field.
function tentMaterial(L, hole) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...L.uniforms, ...moonShaft(L), uHole: { value: hole }, uRing: { value: new THREE.Vector4(PLACES.tree[0], PLACES.ringY, PLACES.tree[1], 1.3) } },
    vertexShader: /* glsl */`
      attribute float aS; attribute vec4 aP, aDoor, aK; attribute vec2 aVis;
      varying vec3 vW, vN; varying float vS; varying vec4 vP, vDoor, vK; varying vec2 vVis;
      ${LIGHT_GLSL}
      void main() {
        vec3 p = position, n = normal; float h = aP.x;
        float b = .5 - .5 * cos(3.14159265 * aS);
        float vert = h <= 1. ? sin(3.14159265 * clamp(h, 0., 1.)) : (h < 2.5 ? .7 * sin(3.14159265 * clamp(h - 1., 0., 1.)) : 0.);
        float g = nfGust(p.xz, aP.y), k = (.1 + .26 * uWind.z) * g * vert;
        vec3 T = cross(n, vec3(0., 1., 0.)); float tl = length(T); T = tl > 1e-3 ? T / tl : vec3(1., 0., 0.);
        p += n * k * b;
        n = normalize(n - T * (k * 1.5708 * sin(3.14159265 * aS) / max(aP.z, .2)));
        if (h > 2.5) { float f = (h - 3.) * (.12 + .2 * uWind.z); p += normal * f * sin(aS * 2.4 + uTime * (2.2 + uWind.w) + aP.y * 3.); }
        vW = p; vN = n; vS = aS; vP = aP; vDoor = aDoor; vK = aK; vVis = aVis;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vS; varying vec4 vP, vDoor, vK; varying vec2 vVis;
      uniform vec4 uHole, uRing;
      ${LIGHT_GLSL} ${SHAFT_GLSL}
      void main() {
        float h = vP.x, sw = max(vP.z, .2), y = vW.y, s = vS;
        if (vK.w > 8.5) {
          // the hem of the crown's cut edge (hemInto): plain canvas rolled over the hoop's bar, a round with a lit side
          // and a side in its own shade. The lamps stand on it toward the middle of the opening and light the side
          // turned to them; the moon and the sky light it from above
          vec3 nr = normalize(vK.xyz), toC = normalize(uHole.xyz - vW);
          float weave = nfFbm(vec2(s * sw * 5., nr.y * 3. + nr.x * 2.));
          vec3 lightR = nfHemi(nr) + nfMoon(nr, .22) * vVis.x + ${IVORY} * .5 * pow(clamp(dot(nr, toC) * .5 + .5, 0., 1.), 1.5);
          gl_FragColor = vec4(nfFog(${CANVAS_IN} * (.8 + .4 * weave) * lightR, length(cameraPosition - vW)), 1.);
          return;
        }
        if (distance(vW, uHole.xyz) < uHole.w) discard;
        bool val = h > 2.5;
        float sx = 2. * fract(s) - 1.;
        if (val && (h - 3.) > .5 + .5 * sqrt(clamp(1. - sx * sx, 0., 1.))) discard;
        // the door: an opening whose cloth is drawn back and hangs gathered in folds beside it, or a laced flap parted at the foot
        float dq = abs(vDoor.x), hw = vDoor.y, dh = max(vDoor.z, .1), open = vDoor.w, dark = 0., gather = 0., lace = 0., fold = 1., sG = s, hem = 0.;
        if (hw > 0. && h <= 1.001) {
          float t = y / dh;
          if (open > 1.5) {
            float ow = t < 1. ? hw * sqrt(clamp(1. - t * t * .8, 0., 1.)) + .05 * sin(y * 2.1 + vP.y) : -1.;
            if (dq < ow) discard;
            // the cloth of the opening is gathered into the two metres beside it: its stripes crowd toward the edge
            float e = max(dq - ow, 0.), G = 2.2, wide = max(ow, 0.) + G, cc = wide * pow(clamp(e / G, 1e-4, 1.), G / wide);
            gather = (1. - smoothstep(0., G, e)) * (1. - smoothstep(1., 1.2, t));
            sG = s + sign(vDoor.x) * (mix(e + max(ow, 0.), cc, step(e, G)) - dq) / sw * step(t, 1.);
            fold = mix(1., .3 + .7 * (.5 + .5 * cos(cc * 7.)), gather);
            lace = (1. - smoothstep(.04, .13, e)) * step(t, 1.) * step(.4, fract(y * 2.6));
            // (the cut edge is turned back and sewn down: a hem a hand wide all the way round the opening)
            hem = (1. - smoothstep(.2, .27, e)) * (1. - smoothstep(1.02, 1.06, t));
          } else {
            float part = hw * (open > .5 ? .5 : .12) * clamp(1. - t * 1.15, 0., 1.);
            dark = (1. - smoothstep(part - .06, part + .06, dq)) * step(t, 1.);
            lace = (1. - smoothstep(.03, .09, abs(dq - part - .12))) * step(t, 1.05) * step(.5, fract(y * 2.2));
            gather = (1. - smoothstep(0., hw, dq)) * step(t, 1.1) * .5;
            fold = 1. - .35 * gather * (.6 + .4 * sin(dq * 9.));
          }
        }
        float w = fwidth(s) * 1.2 * (1. + 3. * gather);
        float tri = abs(fract(sG * .5 + (val ? .5 : 0.)) - .5) * 2.;
        float stripe = mix(smoothstep(.5 - w, .5 + w, tri), .5, smoothstep(.3, .9, w));
        float tone = .93 + .1 * fract(vP.y * 7.31);
        float grain = nfFbm(vec2(s * sw * .6 + vW.y * .15, vW.y * .55 + s * .7));
        vec3 alb = mix(vec3(.030, .032, .038), vec3(.80, .79, .755) * tone, stripe) * (.84 + .3 * grain);
        float seam = 1. - smoothstep(.02, .09 + w * sw, abs(fract(s + .5) - .5) * sw);
        alb *= 1. - .22 * seam;
        alb *= fold;
        if (val) {
          // THE SCALLOPED EAVE HAS FORM (every tent's alike). Each scallop hangs bellied: full and lighter at its middle,
          // drawn in and shaded toward the two points it hangs from. Along its lower edge a rope is sewn in, a round a
          // hand thick of pale hemp, lit on its upper side and in its own shade beneath. Along its top runs the eave's
          // rolled hem, a round of the same thickness, and under that hem its shadow lies on the scallop's first
          // decimetres. (Each round is 0.13 of the scallop's own height across: a hand on the tallest tent's scallops,
          // which hang a metre, and less on a small tent's.) No line is drawn anywhere.
          float hv = h - 3., full = sqrt(clamp(1. - sx * sx, 0., 1.)), e = clamp((.5 + .5 * full - hv) / .13, 0., 1.), t = clamp(hv / .13, 0., 1.);
          alb *= (.76 + .3 * full) * (1. - .5 * (1. - smoothstep(1., 3.4, hv / .13)));
          alb = mix(alb, vec3(.5, .49, .46) * (.4 + .6 * sqrt(1. - (2. * e - 1.) * (2. * e - 1.))) * (.5 + .7 * e), 1. - smoothstep(.8, 1., e));
          alb = mix(alb, alb * (.4 + .6 * sqrt(1. - (2. * t - 1.) * (2. * t - 1.))) * (1.3 - .7 * t) * 2., 1. - smoothstep(.8, 1., t));
        }
        alb = mix(alb, vec3(.012, .012, .014), dark); alb = mix(alb, vec3(.5, .49, .46), lace * (1. - dark));
        vec3 n = normalize(vN); bool inside = !gl_FrontFacing && !val;
        if (!gl_FrontFacing) n = -n;
        float up = clamp(n.y, 0., 1.);
        alb = mix(alb, vec3(.8, .82, .85), uSnow * step(1., h) * (1. - step(2.5, h)) * smoothstep(.45, .9, up) * (.1 + .5 * nfNoise(vW.xz * .8)));
        vec3 light = nfHemi(n) + nfMoon(n, .22) * vVis.x + nfFire(vW, n, .2) * vVis.y;
        light += uMoonCol * clamp(-dot(n, uMoonDir), 0., 1.) * .1 * stripe * vVis.x;
        // the ring in the candle tree lights the canvas round it with its own ivory, from its own place: strongly
        // on the roof of the tent it stands in, and as a wash on the roofs that face it within 80 m
        vec3 toR = uRing.xyz - vW; float dR = max(length(toR), .01);
        light += ${IVORY} * uRing.w * pow(clamp(1. - dR / 80., 0., 1.), 2.) / (1. + dR * dR / 1400.) * clamp((dot(n, toR / dR) + .25) / 1.25, 0., 1.);
        vec3 col = alb * light;
        // taut canvas has a sheen: looked at low across it toward the moon it shines along its crests, pale on the
        // white stripes and faint on the black
        vec3 toEye = normalize(cameraPosition - vW); float graze = 1. - clamp(dot(n, toEye), 0., 1.);
        float sheen = pow(clamp(dot(n, normalize(uMoonDir + toEye)), 0., 1.), 14.) * (.15 + .85 * graze * graze * graze);
        col += uMoonCol * sheen * (.1 + .5 * stripe) * vVis.x * (inside ? 0. : 1.) * (.75 + .5 * grain);
        // (outside, the hem is a doubled band of the same cloth, a little darker at its stitching)
        col *= 1. - .3 * hem * step(.5, fract(y * 3.1));
        // THE LAMPS OF THE CROWN'S HOOP ON THE TALLEST TENT'S OWN CLOTH (its roof outside, its inside): the ring's own
        // law (ringLamps), by the cloth's own place alone. The hem's roll stands between the lamps and the first
        // decimetres of cloth beyond it: a soft shadow lies under the hem there. Outside, the pool lies on the roof's
        // own stripes (on the cloth's albedo: it leaves the black stripes black) under the moon's own shading and
        // the small lights
        float dCut = max(distance(vW, uHole.xyz) - uHole.w, 0.);
        float ring = step(1.5, vK.w) * ringLamps(vW) * smoothstep(.1, .8, dCut);
        if (!inside && !val) col += ${IVORY} * alb * .42 * ring * step(1.001, h);
        if (inside) {
          // within, the cloth is night-dark and reads as cloth: every panel bellies in between its seams and hangs
          // in soft creases, the seams are sewn lines, a pole of pale wood stands at every rib with small lights up
          // it (each with its round pool on the cloth), the foot of the wall is soiled where the ground is trodden
          // against it, and an opening's edge is a pale hem. It is lifted to its lit tone only where the glow of what
          // stands inside reaches it (low down in the garden of ice, all the way up among the cloud steps), where
          // the night comes in at the open crown and where the moon's shaft lands, and falls to shade above
          float many = step(1.5, vK.w), wI = vK.w - 2. * many, room = step(.95, vK.w);
          float du = abs(fract(vK.x + .5) - .5) * vK.y, wallH = h <= 1. ? y / max(h, .02) : 1e3;
          float glow = wI * (.3 * many + exp(-max(y, 0.) / 7.)) + .9 * many * exp(-distance(vW, uHole.xyz) / 14.);
          float moonPatch = inShaft(vW) * many * (.35 + .65 * clamp(dot(n, -uShaftDir), 0., 1.));
          float panel = .5 + .5 * cos(6.2831853 * s), crease = nfNoise(vec2(s * sw * 2.3, y * .22 + s * 1.7));
          float drape = (.5 + .7 * panel) * (.78 + .44 * crease) * (.82 + .36 * grain);
          // (round the crown's hoop the cloth takes the ivory of the lights on its iron)
          float hoop = many * exp(-max(distance(vW, uHole.xyz) - uHole.w, 0.) / 3.5);
          float lit = (.009 + .016 * clamp(glow, 0., 1.6) + .055 * moonPatch) * drape * fold;
          lit *= 1. - .45 * seam;
          // the lights up the poles: one every vK.z metres from 2.4 m up to a metre and a half under the eave, and on
          // up the same ribs under the roof at every half of that in height
          float sp = max(vK.z, 1.) * (h > 1.001 ? .5 : 1.), yk = 2.4 + sp * floor(max(y - 2.4, 0.) / sp + .5);
          float on = step(.5, vK.z) * max(step(yk, wallH - 1.5) * step(h, 1.001), step(1.001, h)) * (1. - step(dq, hw + .5) * step(yk, dh + .5) * step(.001, hw));
          // (a pool is measured on the cloth: across to its rib, and along the cloth's own slope to its light's height)
          float pd = length(vec2(du, (y - yk) / max(sqrt(max(1. - n.y * n.y, 0.)), .2))), pool = on * exp(-pd * pd * .55);
          // (and the string under the eave: a light every three quarters of a stripe, each with its pool)
          float de = abs(fract((s - .375) / .75 + .5) - .5) * .75 * sw, he = y - .95 * wallH;
          pool += step(.5, vK.z) * step(h, 1.001) * exp(-(de * de + he * he) * .9);
          // the pole itself: a round of pale wood a hand and a half wide, lit by the room below and by its own lights
          float pole = room * (1. - smoothstep(.075, .1 + w * sw, du)) * step(h, 1.001), round = sqrt(clamp(1. - du * du / .01, 0., 1.));
          float soil = 1. - .55 * (1. - smoothstep(0., .9, y)) * step(h, 1.001);
          // lit canvas by its lamps: round the cut edge that the hoop's lamps stand on (the ring's law above), and down
          // the wall within 7 m of the string of lamps under the eave (strongest at the lamps and gone at 7 m; the
          // string's lamps are small beside the hoop's, and a tent with no lamps up its poles has no string within),
          // the inner face takes the lamps' ivory. THERE ARE NO STRIPES INSIDE: the lit cloth is plain canvas of one
          // warm grey ivory, with its seams, its grain, its creases and its bellying. Where the moon's shaft lands it
          // lays a pale patch on that same plain canvas, in which the seams show. By the cloth's own place alone
          float byEave = step(.5, vK.z) * step(h, 1.001) * pow(clamp(1. - abs(he) / 7., 0., 1.), 2.);
          // (lit, a panel's bellying is a soft shade from its seam to its middle and no more: the deep shade that models
          // the dark cloth would stand as bands on the lit, and bands round the hoop read as stripes)
          vec3 canvas = ${CANVAS_IN} * (.86 + .2 * panel) * (.84 + .32 * crease) * (.86 + .28 * grain) * fold * (1. - .45 * seam) * soil;
          col = vec3(.93, .97, 1.06) * lit * soil + ${IVORY} * (pool * .045 * (.6 + .4 * panel) + hoop * .022 * drape) + vec3(.9, .9, .86) * lace * .03;
          col += ${IVORY} * canvas * (.42 * ring + .1 * byEave) + uMoonCol * canvas * moonPatch * .8;
          col = mix(col, vec3(.6, .53, .42) * (.02 + .034 * clamp(glow, 0., 1.6) + .05 * pool) * (.35 + .65 * round), pole);
          col = mix(col, vec3(.86, .86, .82) * (.022 + .03 * clamp(glow, 0., 1.6)) * (.75 + .25 * step(.5, fract(y * 3.1))), hem);
        }
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW)), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the ground: meadow, trodden grass, curved paths of grit
// One baked map of the plan (460 m square round the fire): red the grit paths, green the moon's shadows of the tents,
// blue the dark behind each tent as seen from the fire.
const MAP_HALF = 230;
// A second map of the same square says how far a place lies from the middle line of the nearest lane: 1 on the line,
// falling evenly to 0 at WAY_REACH metres from it and beyond. It is written as WAY_STEPS nested strokes of every lane's
// own line (each 0.3 m narrower a side than the last: finer than the map's own grain, so the fall is even), the
// nearest lane winning where two meet. The courtyard and the clock's round have no middle line and stand at 0.
// Its green says the same of the cart's way alone (the lanes a cart takes, named where the map is written).
const WAY_REACH = 4.8, WAY_STEPS = 16;
// (the wear map's own measures: how far out from a tent's wall the grass is left standing; the farthest lane a door's
// worn way goes to; the radius of the ring trodden round the fire)
const WALL_GRASS = 2.4, DOOR_WEAR = 45, FIRE_RING = 16, POOL_GAIN = 2.0, STAKE_WEAR = 2.3, COURT_GRIT = 0.8, NEAR_GRAIN = [28, 42], SNOW_OFF = [30, 76];
// THE WICKET: the fence's small opening for those who come on foot over the meadow (the gate, at bearing 197, is the
// cart track's). Its bearing from the fire, half its width, its place on the fence's circle. The bearing is a measure
// of the plan, typed as the gate's is, and nothing else in the place gives it. What can be said of it standing there:
// it lies between the bearing of the left tent of the lane's mouth (350.0) and that of the mouth's middle (0.6), 14.5 m
// along the fence to the left of the mouth as one comes to it from the meadow; counted round the fence from the gate
// by rising bearing it opens 523 m on, 2.8 m beyond the 163rd post. It is not found from the tents about it: the
// two rules that offer themselves (the bearing of the tall tent the lane bends round, or midway between the mouth's
// left tent and its middle) would each shift it by more than two metres along the fence.
const WICKET = { b: 356.2, half: 1.5, at: at(190, 356.2) };
// THE FOOTPATH across the meadow to the wicket. Its four knots in the meadow are typed too: a path trodden by feet,
// laid by hand as a line that bends a few degrees at each knot. What can be said of it standing there: it begins 583 m
// from the fire, 37 m and more short of the wood's edge, and comes in at 402, 313 and 255 m from the fire, always 6 to
// 7 degrees to the left of the bearing the lane's mouth lies on, to end at the wicket, where the trodden walk round the
// outside of the fence takes it up. It passes through no gap of a hedge: the hedges that run out from the fence stand
// 40 degrees and more from it, and where the field it crosses has the hedge in arcs that hedge is not broken for it.
// It does not meet the cart track, which leaves by the gate on the far side of the fire: the gate, 374 m from the
// wicket, is the nearest the two come.
const FOOTPATH = [[-58, 330], [-44, 150], [-30, 62], [-23, 4], WICKET.at];
// (the shaders' own value noise, for a builder that must know where a shader's wandering line lies)
const hash2 = (x, y) => { const fr = (v) => v - Math.floor(v); let a = fr(Math.fround(x * 0.1031)), b = fr(Math.fround(y * 0.1031)), c = a; const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return fr((a + b) * c); };
const noise2 = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), fx), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), fx), fy); };
// how far a place lies from the footpaths (they wander a few metres either side of their lines, as the ground's shader draws them)
const footOff = (x0, z0) => {
  const wx = (noise2(x0 * 0.045 + 9, z0 * 0.045 + 9) - 0.5) * 9, wz = (noise2(x0 * 0.045 + 23, z0 * 0.045 + 23) - 0.5) * 9, r = Math.hypot(x0 - FIRE[0], z0 - FIRE[1]), f = smoothstep(3, 30, r - PLACES.fenceR), x = x0 + wx * f, z = z0 + wz * f;
  let best = Infinity;
  for (let i = 0; i < FOOTPATH.length - 1; i++) { const a = FOOTPATH[i], b = FOOTPATH[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); }
  return Math.min(best, Math.abs(Math.hypot(x0 + wx - FIRE[0], z0 + wz - FIRE[1]) - PLACES.fenceR - 6));
};
async function bakeGroundMap(tents, route, moonDir, rng, pause) {
  const N = 1024, k = N / (2 * MAP_HALF), px = (x) => (x - FIRE[0] + MAP_HALF) * k, pz = (z) => (z - FIRE[1] + MAP_HALF) * k, P = PLACES;
  const mk = (n) => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, n, n); g.lineCap = 'round'; g.lineJoin = 'round'; return [c, g]; };
  // (the shadows are drawn at half the size and laid over the paths enlarged, which softens their edges)
  const [cv, g] = mk(N), [cs, gs] = mk(N / 2); gs.scale(0.5, 0.5);
  // THE WEAR MAP, a third map of the same square, for the ground's shader alone. Red: where feet have worn the ground
  // off the paths (before every door and from it to the nearest lane or to the courtyard; round the fire and in to it
  // from the gaps of the inner ring). Green: the strip along every tent's wall where no one walks and the grass is
  // left standing (WALL_GRASS metres out from the canvas). Blue: the tents' moon shadows again, at the map's full
  // grain, so that a shadow's edge on the ground is an edge.
  const [ce, ge] = mk(N); ge.globalCompositeOperation = 'lighter';
  await pause();
  // paths: the courtyard, two looping lanes between the rings, a walk inside the fence, the clock's round, the gate lane
  g.strokeStyle = g.fillStyle = 'rgb(255,0,0)';
  // (every path is drawn twice: a fringe at half strength a metre wider either side, where the ground's shader breaks
  // the grit up into the grass, then its worn middle)
  const half = 'rgba(255,0,0,0.5)', full = 'rgb(255,0,0)';
  const disc = (x, z, r) => { for (const [c, e] of [[half, 1.3], [full, -0.5]]) { g.fillStyle = c; g.beginPath(); g.arc(px(x), pz(z), (r + e) * k, 0, TAU); g.fill(); } };
  // (a lane that takes lantern stakes is kept in lanes: its line, its width, how far off its middle the stakes stand
  // and the span their spacing is drawn from)
  const lanes = [], lane = (pts, w, off, gap) => { lanes.push({ pts, w, off, gap }); line(pts, w); };
  const ways = [], line = (pts, w) => { ways.push({ pts, w }); for (const [c, e] of [[half, 2.4], [full, -0.8]]) { g.strokeStyle = c; g.lineWidth = (w + e) * k; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(px(q[0]), pz(q[1])) : g.moveTo(px(q[0]), pz(q[1])))); g.stroke(); } };
  disc(FIRE[0], FIRE[1], P.courtR); disc(P.clock[0], P.clock[1], 12);
  const loops = [[(P.rings[0] + P.rings[1]) / 2, 5.5], [(P.rings[1] + P.rings[2]) / 2, 5], [P.fenceR - 11, 3.2]], ph = [rng() * TAU, rng() * TAU, rng() * TAU];
  const loopR = (i, b) => loops[i][0] + (i < 2 ? 3.5 * Math.sin(3 * b * RAD + ph[i]) + 2 * Math.sin(5 * b * RAD + ph[i] * 2) : 0);
  loops.forEach((lp, i) => { const pts = []; for (let b = 0; b <= 360; b += 3) pts.push(at(loopR(i, b), b)); lane(pts, lp[1], lp[1] / 2 + 1.3, i < 2 ? [13, 18] : [16, 22]); });
  lane([P.gate, P.clock], 6.5, 4.6, [10, 13]); line([at(P.fenceR + 30, 197), P.gate], 5);
  // (from the wicket a foot's width of trodden ground goes in to the walk round the inside of the fence)
  line([at(P.fenceR + 2, WICKET.b), at(P.fenceR - 11, WICKET.b)], 2.4);
  // under the route where it goes on foot height: the lane in, the lanes on to the garden of ice and the cloud steps
  // (these are the lanes the line flies along: their stakes stand in twos, one either side of the grit, as near the
  // lane's middle as the line that flies over it lets a stake stand (flownOff, by the line's own height over each
  // 2 m mark of the lane; never nearer the grit than any other lane's stakes stand to theirs, half the lane's width
  // and 1.3 m), at a spacing drawn once for the lane from FLOWN_GAP)
  const walk = (m0, m1) => { const pts = [], offs = []; for (let i = Math.floor(m0 / 2); i <= Math.ceil(m1 / 2); i++) { pts.push([route.eyes[i * 3], route.eyes[i * 3 + 2]]); offs.push(Math.max(5.5 / 2 + 1.3, flownOff(route.eyes[i * 3 + 1]))); } lane(pts, 5.5, offs, FLOWN_GAP); lanes[lanes.length - 1].twos = true; };
  const mA = route.metreNear(0, FIRE[1] + P.fenceR - 11, 0, 120), mB = route.metreNear(P.garden.flaps[0][0], P.garden.flaps[0][1], 250, 500);
  const mC = route.metreNear(P.garden.flaps[1][0], P.garden.flaps[1][1], 350, 560), mD = route.metreNear(P.steps.flap[0], P.steps.flap[1], 400, 600);
  walk(mA, mB); walk(mC, mD);
  // THE CART'S WAY, on the plan's own lanes: in by the gate and up the gate lane to the clock's round; from the
  // courtyard's rim out by the lane the clock stands beside to the garden's near flap (the garden's own walk takes it
  // on between its two flaps, each wide enough for a cart), and from the garden's far flap to the tallest tent's
  // door. Only there do wheels go: every other lane, the lane in from the meadow among them, is a trodden path.
  // (the lane out of the courtyard: the flown lane from its last 2 m mark inside the courtyard's round on)
  const laneOut = ways[ways.length - 2].pts, laneDoor = ways[ways.length - 1].pts; let iRim = laneOut.length - 1; while (iRim > 0 && Math.hypot(laneOut[iRim][0] - FIRE[0], laneOut[iRim][1] - FIRE[1]) > P.courtR) iRim--;
  const cartWay = [[at(P.fenceR + 30, 197), P.gate, P.clock], laneOut.slice(iRim), laneDoor];
  await pause();
  // curved links through each ring between neighbouring tents (courtIn: the bearings at which a way comes into the
  // courtyard: the three gaps the plan fixes and every link through the inner ring)
  const courtIn = P.gaps.slice();
  for (let ring = 0; ring < 3; ring++) {
    const bs = tents.filter((t) => t.ring === ring).map((t) => ((t.b % 360) + 360) % 360).sort((a, b) => a - b);
    for (let i = 0; i < bs.length; i++) {
      const b0 = bs[i], b1 = i + 1 < bs.length ? bs[i + 1] : bs[0] + 360; if (b1 - b0 < 16 || rng.chance(0.25)) continue;
      const bm = (b0 + b1) / 2, rIn = ring === 0 ? P.courtR : loopR(ring - 1, bm), rOut = loopR(ring, bm + 8), pts = [];
      for (let j = 0; j <= 8; j++) pts.push(at(lerp(rIn, rOut, j / 8), bm + 8 * (j / 8) * (j / 8)));
      line(pts, 4); if (ring === 0) courtIn.push(bm);
    }
  }
  // moon shadows of the tents: the canvas's reach at each height, slid down the moon's line onto the ground
  await pause();
  const sl = 1 / Math.max(0.15, moonDir.y), mx = -moonDir.x * sl, mz = -moonDir.z * sl;
  gs.strokeStyle = gs.fillStyle = 'rgb(0,255,0)'; ge.strokeStyle = ge.fillStyle = 'rgb(0,0,255)';
  const cap = (G2, a, b, r) => { if (r <= 0) return; G2.beginPath(); if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5) { G2.arc(px(a[0]), pz(a[1]), r * k, 0, TAU); G2.fill(); } else { G2.lineWidth = 2 * r * k; G2.moveTo(px(a[0]), pz(a[1])); G2.lineTo(px(b[0]), pz(b[1])); G2.stroke(); } };
  for (const [ti, T] of tents.entries()) {
    if ((ti + 1) % 4 === 0) await pause(4);
    const top = peakOf(T, T.L), n = Math.max(6, Math.ceil(top / 1.2));
    for (let i = 0; i <= n; i++) {
      const y = top * i / n, a = toWorld(T, -T.L, 0), b = toWorld(T, T.L, 0), ra = reachAt(T, y, -T.L), rb = reachAt(T, y, T.L);
      if (ra > 0 && rb > 0) { cap(gs, [a[0] + mx * y, a[1] + mz * y], [b[0] + mx * y, b[1] + mz * y], Math.min(ra, rb)); cap(ge, [a[0] + mx * y, a[1] + mz * y], [b[0] + mx * y, b[1] + mz * y], Math.min(ra, rb)); }
      else if (rb > 0) { cap(gs, [b[0] + mx * y, b[1] + mz * y], [b[0] + mx * y, b[1] + mz * y], rb); cap(ge, [b[0] + mx * y, b[1] + mz * y], [b[0] + mx * y, b[1] + mz * y], rb); }
    }
  }
  // the dark behind each tent as the fire sees it: a wedge from the tent's two sides out to the map's edge
  await pause();
  gs.strokeStyle = gs.fillStyle = 'rgb(0,0,255)'; gs.globalCompositeOperation = 'lighter';
  for (const [ti, T] of tents.entries()) {
    if ((ti + 1) % 8 === 0) await pause(4);
    for (let j = -1; j <= 1; j++) {
      const c = toWorld(T, T.L * j, 0), dx = c[0] - FIRE[0], dz = c[1] - FIRE[1], d = Math.hypot(dx, dz), r = T.R * 0.86; if (d < r + 1 || d > 200) continue;
      const ux = dx / d, uz = dz / d, far = 2.2 * MAP_HALF / d, e1 = [c[0] - uz * r, c[1] + ux * r], e2 = [c[0] + uz * r, c[1] - ux * r];
      gs.beginPath(); gs.moveTo(px(e1[0]), pz(e1[1])); gs.lineTo(px(FIRE[0] + (e1[0] - FIRE[0]) * far), pz(FIRE[1] + (e1[1] - FIRE[1]) * far));
      gs.lineTo(px(FIRE[0] + (e2[0] - FIRE[0]) * far), pz(FIRE[1] + (e2[1] - FIRE[1]) * far)); gs.lineTo(px(e2[0]), pz(e2[1])); gs.closePath(); gs.fill();
    }
  }
  await pause();
  g.globalCompositeOperation = 'lighter'; g.imageSmoothingEnabled = true; g.drawImage(cs, 0, 0, N, N);
  await pause();
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4;
  tex.userData.lanes = lanes;
  // the lanes' middle lines
  const [cw, gw] = mk(N); gw.globalCompositeOperation = 'lighten';
  for (let s = WAY_STEPS; s >= 1; s--) {
    gw.strokeStyle = `rgb(${Math.round(255 * (1 - (s - 0.5) / WAY_STEPS))},0,0)`; gw.lineWidth = 2 * WAY_REACH * s / WAY_STEPS * k;
    for (const { pts } of ways) { gw.beginPath(); pts.forEach((q, i) => (i ? gw.lineTo(px(q[0]), pz(q[1])) : gw.moveTo(px(q[0]), pz(q[1])))); gw.stroke(); }
    // (green: the same measure taken from the cart's way alone)
    gw.strokeStyle = `rgb(0,${Math.round(255 * (1 - (s - 0.5) / WAY_STEPS))},0)`;
    for (const pts of cartWay) { gw.beginPath(); pts.forEach((q, i) => (i ? gw.lineTo(px(q[0]), pz(q[1])) : gw.moveTo(px(q[0]), pz(q[1])))); gw.stroke(); }
    if (s % 4 === 1) await pause();
  }
  const way = new THREE.CanvasTexture(cw); way.flipY = false; way.wrapS = way.wrapT = THREE.ClampToEdgeWrapping; way.anisotropy = 4;
  tex.userData.way = way; tex.userData.ways = ways;
  // the wear of feet and the grass left standing (the wear map's red and green)
  await pause();
  const stroke = (pts, w, v, ch) => { ge.strokeStyle = ch === 0 ? `rgb(${v},0,0)` : `rgb(0,${v},0)`; ge.lineWidth = w * k; ge.beginPath(); pts.forEach((q, i) => (i ? ge.lineTo(px(q[0]), pz(q[1])) : ge.moveTo(px(q[0]), pz(q[1])))); ge.stroke(); };
  // (a worn way: its middle worn through, a skirt 0.8 m wide either side half worn)
  const worn = (pts, w) => { stroke(pts, w + 1.6, 96, 0); stroke(pts, w, 159, 0); };
  // (the nearest point of any lane's middle line to a place, and how far it is)
  const nearWay = (x, z) => { let best = Infinity, bq = null; for (const { pts } of ways) for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz); if (d < best) { best = d; bq = [qx, qz]; } } return [best, bq]; };
  for (const [ti, T] of tents.entries()) {
    if (T.special !== 'collar') { const a = toWorld(T, -T.L, 0), b = toWorld(T, T.L, 0); stroke([a, [b[0] + 0.01, b[1]]], 2 * (T.R + WALL_GRASS), 255, 1); }
    for (const d of T.doors) {
      const pq = perimAt(T, d.q), w = toWorld(T, pq[0], pq[1]), o = toWorld(T, pq[0] + pq[2], pq[1] + pq[3]), ox = o[0] - w[0], oz = o[1] - w[1], A = [w[0] + ox * 3, w[1] + oz * 3];
      // before the door: trodden as wide as the flap and a pace more, three metres out
      worn([[w[0] - ox * 0.5, w[1] - oz * 0.5], A], 2 * d.hw + 1);
      // and on to the nearest lane, or to the courtyard's rim where that is nearer, unless a tent stands in the way
      const [dl, q] = nearWay(A[0], A[1]), rf = Math.hypot(A[0] - FIRE[0], A[1] - FIRE[1]), toRim = rf > P.courtR ? rf - P.courtR : Infinity;
      const B = toRim < dl ? [FIRE[0] + (A[0] - FIRE[0]) * (P.courtR - 2) / rf, FIRE[1] + (A[1] - FIRE[1]) * (P.courtR - 2) / rf] : q;
      if (!B || Math.min(dl, toRim) > DOOR_WEAR) continue;
      let free = true; for (let j = 1; j < 8 && free; j++) { const x = lerp(A[0], B[0], j / 8), z = lerp(A[1], B[1], j / 8); if (tents.some((o2) => planOut(o2, x, z) < 0.6)) free = false; }
      if (free) worn([A, B], 1.6);
    }
    if (ti % 12 === 11) await pause(4);
  }
  // the courtyard: a ring trodden round the fire where one can stand its heat, and a way in to it from every gap
  { const ring = []; for (let b = 0; b <= 360; b += 6) ring.push(at(FIRE_RING, b)); worn(ring, 7);
    for (const b of courtIn) worn([at(P.courtR + 3, b), at(FIRE_RING + 1, b)], 4); }
  await pause();
  const wear = new THREE.CanvasTexture(ce); wear.flipY = false; wear.wrapS = wear.wrapT = THREE.ClampToEdgeWrapping; wear.anisotropy = 4;
  tex.userData.wear = wear;
  // (a stake's foot: whoever tends a lantern walks round its stake, and the grass there is trodden short in a round of
  // STAKE_WEAR metres; written once the stakes stand, on every lane alike)
  tex.userData.wearStakes = (lamps) => { ge.fillStyle = 'rgb(118,0,0)'; for (const l of lamps) { ge.beginPath(); ge.arc(px(l.x), pz(l.z), STAKE_WEAR * k, 0, TAU); ge.fill(); } wear.needsUpdate = true; };
  return tex;
}

// ---------------------------------------------------------------- lantern stakes along the lanes
// Along every lane of the plan iron stakes stand with a small lantern at the head, at a spacing drawn once for that lane,
// on alternate sides just off its grit. A stake is left out where its head would come within 9 m of the route's line,
// within 2 m of any canvas or 6 m of a door, in the fire's courtyard, on the clock's round or the gate lane's mouth,
// or within 7 m of a stake that already stands.
// THE FLOWN PATHS ARE LIT IN TWOS. Along the lanes the line itself flies (the lane in from the walk inside the fence to
// the garden's flap by way of the courtyard, and the lane on from the garden's far flap to the tallest tent's door)
// the stakes stand in twos, one either side of the grit and square across from each other, every 7 to 10 m along it
// (one draw for the lane): two rows of lit rounds going away down the path, each round's edge lying on the grit.
// A STAKE OF THE TWOS KEEPS FLOWN_KEEP METRES OF CLEAR AIR TO THE LINE, WHOLE (for the twos alone; every other stake
// keeps its head 9 m from the line): the stake, its cap and its lantern's dab all lie within STAKE_REACH of its
// upright axis, from the ground to STAKE_REACH over its head. So a two stands as near the lane's middle as the line
// over it lets the tallest stake stand (flownOff: the nearer the higher the line flies there), and is left out
// where its own whole body would come within FLOWN_KEEP of any part of the line (twoNear, below).
// They are laid last, from a stream of their own (rt): every other lane keeps its own spacing, its draws and its
// stakes as they were; a stake of the twos stands FLOWN_APART metres or more from any other stake and gives way to a
// thing of the camp (the things' places are settled first: planThings).
const FLOWN_KEEP = 6.5, STAKE_REACH = 0.4, STAKE_TOP = 3.4 + STAKE_REACH, FLOWN_GAP = [7, 10], FLOWN_APART = 4.5;
// (how far off the lane's middle a two stands where the line flies y metres up over the lane: the least distance at
// which the tallest stake's whole body keeps FLOWN_KEEP, with 0.12 m in hand for the lane's bends)
const flownOff = (y) => Math.sqrt(Math.max(0, (FLOWN_KEEP + STAKE_REACH + 0.12) ** 2 - Math.max(0, y - STAKE_TOP) ** 2));
function layLamps(lanes, route, tents, rng) {
  const P = PLACES, lamps = [];
  const doors = []; for (const T of tents) for (const d of T.doors) { const pq = perimAt(T, d.q); doors.push(toWorld(T, pq[0], pq[1])); }
  // (whether a two's whole body comes within FLOWN_KEEP of the line: its axis at four heights from the ground to
  // STAKE_REACH over its head, each against the line's marks; the 0.1 m is for the 2 m between two marks of the line)
  const twoNear = (x, z, h) => { for (let j = 0; j <= 3; j++) if (route.near(x, (h + STAKE_REACH) * j / 3, z, FLOWN_KEEP + STAKE_REACH + 0.1)) return true; return false; };
  // (a stake stands clear of the line, the fire's round, the clock, the gate and the wicket, of every door, of the
  // stakes of the list by apart metres and of every wall by wall metres)
  const clear = (list, x, z, h, apart, wall, two) => {
    if ((two ? twoNear(x, z, h) : route.near(x, h, z, 9)) || Math.hypot(x - FIRE[0], z - FIRE[1]) < P.courtR + 2 || Math.hypot(x - P.clock[0], z - P.clock[1]) < 13 || Math.hypot(x - P.gate[0], z - P.gate[1]) < 6 || Math.hypot(x - WICKET.at[0], z - WICKET.at[1]) < 9) return false;
    if (doors.some((d) => Math.hypot(d[0] - x, d[1] - z) < 6) || list.some((l) => Math.hypot(l.x - x, l.z - z) < apart)) return false;
    return !tents.some((T) => Math.hypot(T.x - x, T.z - z) < T.L + T.R + 4 && outsideBy(T, x, 1, z) < wall);
  };
  // (one side and the other by turns down a lane: the lanes not flown)
  for (const ln of lanes) {
    if (ln.twos) continue;
    const gap = rng.range(ln.gap[0], ln.gap[1]); let run = rng() * gap, side = rng.chance(0.5) ? 1 : -1;
    for (let i = 1; i < ln.pts.length; i++) {
      const a = ln.pts[i - 1], b = ln.pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1e-6;
      for (; run <= l; run += gap, side = -side) {
        const t = run / l, h = rng.range(2.6, 3.4), ph = rng() * 100, x = a[0] + dx * t - dz / l * ln.off * side, z = a[1] + dz * t + dx / l * ln.off * side;
        if (clear(lamps, x, z, h, 7, 2)) lamps.push({ x, z, h, ph });
      }
      run -= l;
    }
  }
  // (the twos, once the things' places are known: a stake stands 1.6 m clear of a thing's round, as a thing does of a stake)
  lamps.twos = (rt, things) => { for (const ln of lanes) {
    if (!ln.twos) continue;
    const gap = rt.range(ln.gap[0], ln.gap[1]); let run = rt() * gap;
    for (let i = 1; i < ln.pts.length; i++) {
      const a = ln.pts[i - 1], b = ln.pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1e-6;
      for (; run <= l; run += gap) for (const side of [1, -1]) {
        const t = run / l, off = lerp(ln.off[i - 1], ln.off[i], t), h = rt.range(2.6, 3.4), ph = rt() * 100, x = a[0] + dx * t - dz / l * off * side, z = a[1] + dz * t + dx / l * off * side;
        if (clear(lamps, x, z, h, FLOWN_APART, 2, true) && !things.some((q) => Math.hypot(q[0] - x, q[1] - z) < 1.6 + q[2])) lamps.push({ x, z, h, ph, twos: true });
      }
      run -= l;
    }
  } };
  return lamps;
}

// the light that lies on the ground, in one small map of the plan. Red: the pool the small lights of a tent lay about
// it (for the tents that never nap: strongest at the wall's foot and gone within a few metres, with a faint apron that
// reaches 46 m; a napping tent's pool is worked out in the ground's shader, where it goes down and comes back with that
// tent's lights). Green: the round pool under each lantern stake. Blue: the wedge of light that lies out on the ground
// before the open mouth of a tent whose inside is lit.
const GLOW_REACH = 46, NAP_MAX = 18, GLOW_N = 512;
// (a lantern stake's pool on the ground reaches this far from it: the map below lays its last light there (its round
// is drawn LAMP_POOL / 0.7 wide and is dark from 0.7 of that on), and a rope's ray by a lantern ends there: one
// measure for both)
const LAMP_POOL = 9.1;
function bakeGlowMap(tents, lamps) {
  const N = GLOW_N; let k = N / (2 * MAP_HALF), cv = document.createElement('canvas'); cv.width = cv.height = N; let g = cv.getContext('2d');
  const px = (x) => (x - FIRE[0] + MAP_HALF) * k, pz = (z) => (z - FIRE[1] + MAP_HALF) * k;
  g.fillStyle = '#000'; g.fillRect(0, 0, N, N); g.globalCompositeOperation = 'lighter';
  for (const T of tents) {
    if (T.special === 'collar' || (T.nap && T.nap[0] > 0)) continue;
    const n = Math.max(1, Math.ceil(T.L / (T.R * 0.7)));
    for (let j = -n; j <= n; j++) {
      const c = toWorld(T, n ? T.L * j / n : 0, 0), x = px(c[0]), y = pz(c[1]), r0 = T.R * 0.8, span = T.R * 0.2 + GLOW_REACH, r = (T.R + GLOW_REACH) * k, v = 200 / (0.6 * (2 * n + 1) + 0.4);
      const gr = g.createRadialGradient(x, y, r0 * k, x, y, r), stop = (o, f) => gr.addColorStop(clamp((T.R * 0.2 + o) / span, 0, 1), `rgb(${Math.round(v * f)},0,0)`);
      stop(-T.R * 0.2, 1); stop(0, 1); stop(2.5, 0.62); stop(6, 0.3); stop(12, 0.13); stop(26, 0.05); gr.addColorStop(1, '#000');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }
  // (the ring in the candle tree lays its own round on the ground under it)
  { const x = px(PLACES.tree[0]), y = pz(PLACES.tree[1]), r = 62 * k, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgb(120,0,0)'); gr.addColorStop(0.35, 'rgb(70,0,0)'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  // (from here on the map's own canvas, twice as fine: the tents' glow is laid into it and the rest drawn on it)
  { const fine = document.createElement('canvas'); fine.width = fine.height = 2 * N; const gf = fine.getContext('2d'); gf.imageSmoothingEnabled = true; gf.drawImage(cv, 0, 0, 2 * N, 2 * N); gf.globalCompositeOperation = 'lighter'; cv = fine; g = gf; k *= 2; }
  // (a lantern's frame has four bars: each lays a dark spoke across the pool from the stake's foot to the pool's rim,
  // at the lantern's own turn, soft at its sides: the pool is laid three times over, once whole and twice with the
  // spokes left out, the second time broader, the three shares making up the whole light between the spokes.
  // A LANTERN'S POOL IS A ROUND OF LIGHT WITH AN EDGE: brightest at the stake's foot, still more than half as bright
  // 3.4 m out, and there the lantern's cap cuts it off: by 4.4 m from the stake it has stepped down to a seventh of
  // its heart, a faint spill that is a thirtieth at 5.7 m and gone 9 m from the stake (so that two rows of pools lay no veil over the path between them). So that this edge is an edge on the ground, the lanterns'
  // pools and the doors' wedges are written at twice the grain of the tents' soft glow: the map is 2 * GLOW_N across,
  // the tents' glow drawn at GLOW_N and laid into it enlarged)
  for (const l of lamps) {
    const x = px(l.x), y = pz(l.z), r = LAMP_POOL / 0.7 * k, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgb(0,255,0)'); gr.addColorStop(0.1, 'rgb(0,218,0)'); gr.addColorStop(0.28, 'rgb(0,154,0)'); gr.addColorStop(0.34, 'rgb(0,36,0)'); gr.addColorStop(0.44, 'rgb(0,8,0)'); gr.addColorStop(0.7, '#000'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.globalAlpha = 0.385; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    for (const [half, al] of [[0.05, 0.315], [0.11, 0.3]]) {
      g.globalAlpha = al; g.beginPath(); g.rect(x - r, y - r, 2 * r, 2 * r);
      for (let q = 0; q < 4; q++) { const a = l.ph * 0.0628 + q * Math.PI / 2; g.moveTo(x + Math.sin(a) * 0.7 * k, y + Math.cos(a) * 0.7 * k); g.lineTo(x + Math.sin(a - half) * r, y + Math.cos(a - half) * r); g.lineTo(x + Math.sin(a + half) * r, y + Math.cos(a + half) * r); g.closePath(); }
      g.fill('evenodd');
    }
  }
  g.globalAlpha = 1;
  // (a wedge is laid three times over, each narrower, so that its sides are soft)
  for (const T of tents) for (const d of T.doors) {
    if (d.open < 1.5) continue;
    const pq = perimAt(T, d.q), w = toWorld(T, pq[0], pq[1]), o = toWorld(T, pq[0] + pq[2], pq[1] + pq[3]), ox = o[0] - w[0], oz = o[1] - w[1], reach = 14 + 2.2 * d.hw;
    const gr = g.createLinearGradient(px(w[0]), pz(w[1]), px(w[0] + ox * reach), pz(w[1] + oz * reach));
    gr.addColorStop(0, 'rgb(0,0,80)'); gr.addColorStop(0.3, 'rgb(0,0,44)'); gr.addColorStop(1, '#000'); g.fillStyle = gr;
    for (const f of [1, 0.66, 0.33]) {
      const a = d.hw * f, b = (d.hw + reach * 0.42) * f, q = (al, sd) => [px(w[0] + ox * al - oz * sd), pz(w[1] + oz * al + ox * sd)], p0 = q(-0.5, -a), p1 = q(reach, -b), p2 = q(reach, b), p3 = q(-0.5, a);
      g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.lineTo(p3[0], p3[1]); g.closePath(); g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
  return tex;
}
// the small lights' and the lanterns' own colour as light on a thing: the palette's ivory, a breath warmer than the fire
const IVORY = 'vec3(1., .905, .716)';
// the inside of the cloth where lamps or the moon light it: plain canvas of one warm grey ivory (no stripes inside)
const CANVAS_IN = 'vec3(.47, .455, .42)';
// THE LONG GRASS'S SHEEN. Where long grass stands its seed heads lie as a pale cast over the meadow's dark grass. In
// the open meadow that cast is a soft sheen under the moon: SHEEN_OPEN of the pale tone where the grass stands whole
// (in the middle of a drift with the gust on it), less toward a drift's edge and next to nothing between drifts, so
// that it comes and goes with the drifts and with the gusts that cross them. Among the tents it is the faint cast
// it was.
const SHEEN_OPEN = 0.78;
// THE WIND'S WAVES OVER THE LONG GRASS. Where a gust lays the grass over, its seed heads turn to the moon together and a
// pale band of sheen runs over the meadow: each band some 8 to 25 m long across the wind and a few metres through,
// travelling down the wind at 3 m a second in the lightest air the place has and 6 in the strongest, on the world's
// clock. 0 between bands, 1 in the middle of one. The ground's shader and the tufts' ask the same law.
const WINDBAND_GLSL = /* glsl */`
float nfWindBand(vec2 xz) {
  vec2 q = vec2(dot(xz, uWind.xy) - (3. + 3.33 * (uWind.z - .35)) * uTime, dot(xz, vec2(-uWind.y, uWind.x)));
  return smoothstep(.5, .72, .65 * nfNoise(q * vec2(.17, .07) + 17.) + .35 * nfNoise(q * vec2(.31, .12) + 29.));
}
`;
// THE MEADOW BY THE LINE LIES IN SWATHES. Between the entry and the fence (the band about the line where the grass
// is left long) the long grass stands in swathes 4 to 12 m broad that run across the moon's usual bearing and wander a
// few metres as they go, each in its own lane of SWATHE_LANE metres, its breadth changing slowly along it and here
// and there tapering to nothing for a stretch (there the mown ground runs through); between
// two swathes lies a mown strip, darker, with a clear edge. A swathe stands 0.9 m over the strip: its moonward edge is
// a crest the moon catches, its far flank lies in shade, and it lays its moon shadow on the strip beyond, as long as
// the moon's height and bearing make it (uMoonDir, whatever the hour). x: 1 in a swathe; y: 1 on its crest; z: 1 in
// its shade. The edge goes soft with the ground a pixel covers (px). The tufts' builder asks the same law (swatheAt).
const SWATHE_LANE = 16, SWATHE_AX = [0.819, 0.574];
const SWATHE_GLSL = /* glsl */`
vec3 nfSwathe(vec2 xz, float px) {
  vec2 ax = vec2(${SWATHE_AX[0]}, ${SWATHE_AX[1]}), q = vec2(dot(xz, ax), dot(xz, vec2(-ax.y, ax.x)));
  q.x += 9. * (nfNoise(q * vec2(.024, .016) + 5.) - .5) + 1.6 * (nfNoise(q * .13 + 9.) - .5);
  float c = floor(q.x / ${SWATHE_LANE}.), u = q.x - (c + .5) * ${SWATHE_LANE}.;
  float w = (5.6 + 6. * nfNoise(vec2(c * 7.31, q.y * .017) + 41.)) * smoothstep(.22, .38, nfNoise(vec2(c * 3.73, q.y * .028) + 77.));
  float ml = max(length(uMoonDir.xz), 1e-3), ma = dot(uMoonDir.xz, ax) / ml, e = u * (ma < 0. ? -1. : 1.), ed = max(.12, px * .7);
  float h = (1. - smoothstep(-ed, ed, abs(u) - .5 * w)) * step(.6, w), len = .9 * ml / max(uMoonDir.y, .15) * abs(ma);
  float crest = h * smoothstep(.5 * w - 1.6 - ed, .5 * w - .7, e);
  float flank = h * (1. - smoothstep(-.5 * w + .2, -.5 * w + 1. + ed, e)), thrown = (1. - h) * step(e, 0.) * (1. - smoothstep(.45 * len, len + ed, -e - .5 * w));
  return vec3(h, crest, max(flank, thrown));
}
`;
const swatheAt = (x, z) => {
  const q0 = x * SWATHE_AX[0] + z * SWATHE_AX[1], qy = -x * SWATHE_AX[1] + z * SWATHE_AX[0], qx = q0 + 9 * (noise2(q0 * 0.024 + 5, qy * 0.016 + 5) - 0.5) + 1.6 * (noise2(q0 * 0.13 + 9, qy * 0.13 + 9) - 0.5);
  const c = Math.floor(qx / SWATHE_LANE), u = qx - (c + 0.5) * SWATHE_LANE, w = (5.6 + 6 * noise2(c * 7.31 + 41, qy * 0.017 + 41)) * smoothstep(0.22, 0.38, noise2(c * 3.73 + 77, qy * 0.028 + 77));
  return Math.abs(u) < 0.5 * w;
};
// THE GROUND ABOUT A TUFT OF GRASS: the tone the ground's shader lays at a place of the meadow, or of the untrodden
// grass among the tents, at the mean of its fine grains (its slow noise, the open meadow's paler cast, each field's
// own tone and mown strips, the long grass's sheen in its drifts and gusts, thin snow), said again for the tufts'
// own shader, which asks it once at each tuft's foot
const MEADOW_GLSL = /* glsl */`
uniform float uFenceR, uRingR, uField[8];
${WINDBAND_GLSL} ${SWATHE_GLSL}
vec3 nfMeadowAt(vec2 xz) {
  vec2 d = xz - uFirePos.xz; float r = length(d), inF = 1. - smoothstep(uFenceR - 3., uFenceR + 2., r), tall = 0.;
  vec3 g = mix(vec3(.028, .032, .031), vec3(.046, .051, .05), nfFbm(xz * .045)) * mix(1.7, 1., inF);
  if (r > uFenceR - 6.) {
    float ang = atan(d.x, d.y), sec = 0.; for (int i = 0; i < 8; i++) sec += step(uField[i], ang);
    float fid = nfHash(vec2(sec, step(uRingR, r)) + 3.), fd = fid * 6.283;
    float byLine = (1. - smoothstep(48., 80., abs(xz.x))) * step(uFirePos.z, xz.y) * (1. - inF);
    tall = max(step(.45, fid) * .55 * (1. - byLine), byLine * nfSwathe(xz, .5).x);
    g *= mix(.62 + .16 * smoothstep(-.3, .3, sin(dot(xz, vec2(cos(fd), sin(fd))) * .9 + .75)), 1., tall) * (.86 + .28 * fract(fid * 7.3));
  }
  float longG = max(max(smoothstep(.35, .75, nfFbm(xz * .012 + 3.)) * .5, inF * .8), tall) * mix(.22, 1., smoothstep(.4, .62, nfFbm(xz * .07 + 5.))) * .86 * (.88 + .12 * nfGust(xz, 0.));
  g = mix(g, vec3(.455, .5, .495), clamp(longG * mix(${SHEEN_OPEN.toFixed(2)} * (.82 + .9 * nfWindBand(xz)), .11, inF), 0., 1.));
  return mix(g, vec3(.8, .82, .86), uSnow * .32 * smoothstep(${SNOW_OFF[0]}., ${SNOW_OFF[1]}., r));
}
`;
// THE APRON'S RAYS AND THE RAILINGS' SHADOWS. The lantern stakes that stand within FAN_IN metres of the fence throw
// their light out through the railings onto the grass: on the line from a lantern to a place on the grass stands one
// point of the fence, and what stands in the fence there (an upright every 0.24 m, a post every 3.2 m, as the fence's
// own shader draws them along its own count of metres; nothing in the gate's and the wicket's openings) cuts its bar
// out of that lantern's light. So the light reaches out from the fence's foot as a fan of pale and dark rays about
// each lantern, the bars widening with the fan and softening with the lantern's own width, the whole falling away to
// nothing FAN_REACH metres from the lantern; the lower rail lays one dark line across each fan just beyond the fence.
// A lantern is no point: an upright, 0.034 m broad, throws its bar only on the first metres past the fence and its
// shade is gone to an even quarter by a quarter of the way out from the lantern, so the long rays are the posts',
// and they too grow fainter as they grow broader. Under snow the fans add a third of their light (the hour's law
// keeps a night of snow as light as it was); the bars are cut from that third.
// The moon lays the same railings' shadow the other way: a place is in it where the moon's line from that place
// meets the fence's circle under the fence's height.
// (the lanterns are handed to the shader by the bearing they stand at from the fire: FAN_K equal parts of the round,
// in each the two that stand nearest the fence; a place asks the five parts about its own bearing)
const FAN_K = 48, FAN_IN = 24, FAN_REACH = 70, FAN_LIGHT = 1.4, FAN_SNOW = 0.35, FENCE_GATE_B = 197, FENCE_GATE_HALF = 3.6;
// a lantern's light on the ground l metres from it, of 1 (GLSL)
const FAN_FALL = (l) => `(pow(clamp(1. - ${l} / ${FAN_REACH.toFixed(1)}, 0., 1.), 2.) / (1. + ${l} / 18.))`;
const fanOf = (lamps) => {
  const fan = [], inBy = (l) => PLACES.fenceR - Math.hypot(l.x - FIRE[0], l.z - FIRE[1]);
  for (let k = 0; k < FAN_K; k++) fan.push(new THREE.Vector4(1e6, 1e6, 1e6, 1e6));
  for (const l of lamps.filter((l) => inBy(l) > 0 && inBy(l) < FAN_IN).sort((a, b) => inBy(a) - inBy(b))) {
    const b = Math.atan2(l.x - FIRE[0], l.z - FIRE[1]), v = fan[Math.min(FAN_K - 1, Math.floor(((b + TAU) % TAU) / TAU * FAN_K))];
    if (v.x > 1e5) { v.x = l.x; v.y = l.z; } else if (v.z > 1e5) { v.z = l.x; v.w = l.z; }
  }
  return fan;
};
function groundMaterial(L, map, tents, lamps) {
  const napA = [], napB = [];
  for (const T of tents) if (T.nap && T.nap[0] > 0 && napA.length < NAP_MAX) { const a = toWorld(T, -T.L, 0), b = toWorld(T, T.L, 0); napA.push(new THREE.Vector4(a[0], a[1], b[0], b[1])); napB.push(new THREE.Vector4(T.R, T.nap[0], T.nap[1], 1)); }
  // (the places left over stand far off and carry no light)
  while (napA.length < NAP_MAX) { napA.push(new THREE.Vector4(1e6, 1e6, 1e6, 1e6)); napB.push(new THREE.Vector4(0, 1, 0, 0)); }
  const track = []; for (let i = 0; i < 8; i++) track.push(new THREE.Vector2(0, 1e5 + i));
  // the ground cloths (their places are written in once the camp's things stand; an empty place lies far off)
  const clothA = [], clothB = []; for (let i = 0; i < CLOTH_MAX; i++) { clothA.push(new THREE.Vector4(1e6, 1e6, 1, 0)); clothB.push(new THREE.Vector4(1, 1, 1, 0)); }
  // the footpath trodden across the meadow from behind the entry to the path that goes round the outside of the fence
  const foot = FOOTPATH.map((q) => new THREE.Vector2(q[0], q[1]));
  return new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms, tMap: { value: map }, tWay: { value: map.userData.way }, tWear: { value: map.userData.wear }, tGlow: { value: bakeGlowMap(tents, lamps) }, uNapA: { value: napA }, uNapB: { value: napB }, uFenceR: { value: PLACES.fenceR }, uCourtR: { value: PLACES.courtR },
      uClothA: { value: clothA }, uClothB: { value: clothB }, uTrack: { value: track }, uFoot: { value: foot }, uField: { value: new Float32Array(8).fill(99) }, uRingR: { value: 1e5 }, uMist: { value: 0 }, uFan: { value: fanOf(lamps) } },
    vertexShader: 'varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      varying vec3 vW; uniform sampler2D tMap, tGlow, tWay, tWear; uniform float uFenceR, uCourtR, uRingR, uField[8]; uniform vec4 uNapA[${NAP_MAX}], uNapB[${NAP_MAX}], uClothA[${CLOTH_MAX}], uClothB[${CLOTH_MAX}]; uniform vec2 uTrack[8], uFoot[${FOOTPATH.length}];
      ${LIGHT_GLSL} ${WINDBAND_GLSL} ${SWATHE_GLSL}
      float segDist(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a, ap = p - a; return length(ap - ab * clamp(dot(ap, ab) / max(dot(ab, ab), 1e-4), 0., 1.)); }
      uniform vec4 uFan[${FAN_K}];
      // metres along the fence's railings at a place of its circle (q from the fire), by the fence's own count: from the
      // gate round to the wicket, and from the wicket on round to the gate; under 0 in the two openings
      float fenceAlong(vec2 q) {
        float b = mod(atan(q.x, q.y) - ${(FENCE_GATE_B * RAD).toFixed(6)}, 6.2831853), gh = ${FENCE_GATE_HALF.toFixed(1)} / uFenceR, wb = ${(((WICKET.b - FENCE_GATE_B + 360) % 360) * RAD).toFixed(6)}, wh = ${WICKET.half.toFixed(2)} / uFenceR;
        if (b < gh || b > 6.2831853 - gh || abs(b - wb) < wh) return -1.;
        return (b < wb ? b - gh : b - wb - wh) * uFenceR;
      }
      // what stands in the fence s metres along it, as a shadow soft metres blurred: x a post's bar, y an upright's
      vec2 fenceBars(float s, float soft) {
        float qc = abs(fract(s / 3.2) - .5) * 3.2, cx = abs(fract(s / .24) - .5) * .24, sp = .085 + soft, su = .017 + soft;
        return step(0., s) * vec2(1. - smoothstep(.5 * sp, 1.3 * sp, qc), 1. - smoothstep(.5 * su, 1.3 * su, cx));
      }
      void main() {
        vec2 d = vW.xz - uFirePos.xz, uv = d / ${(2 * MAP_HALF).toFixed(1)} + .5; float r = length(d), inMap = step(max(abs(uv.x - .5), abs(uv.y - .5)), .499);
        vec3 m = texture2D(tMap, clamp(uv, 0., 1.)).rgb * inMap, lay = texture2D(tGlow, clamp(uv, 0., 1.)).rgb * inMap;
        // (the wear map: x where feet have worn the ground off the paths, y the grass left standing along a wall, z the
        // tents' moon shadows with an edge)
        vec3 wr = texture2D(tWear, clamp(uv, 0., 1.)).rgb * inMap;
        float inF = 1. - smoothstep(uFenceR - 3., uFenceR + 2., r), dist = length(cameraPosition - vW);
        // every grain is written in world metres and goes to its mean before it is finer than the ground one pixel
        // covers (the mean of that patch's long and short sides), so that nothing crawls or smears at a grazing view
        float px = sqrt(max(length(dFdx(vW.xz)) * length(dFdy(vW.xz)), 1e-8));
        float k1 = 1. - smoothstep(5., 22., px), k2 = 1. - smoothstep(.45, 2., px), k3 = 1. - smoothstep(.06, .26, px), k4 = 1. - smoothstep(.012, .05, px);
        float n1 = mix(.5, nfFbm(vW.xz * .045), k1), n2 = mix(.5, nfFbm(vW.xz * .6 + 31.), k2), n3 = mix(.5, nfNoise(vW.xz * 4.3), k3);
        // (two grains laid across each other, so that neither one's own grid of cells shows in the grass under the eye)
        float n4 = mix(.5, nfNoise(mat2(.8, .6, -.6, .8) * vW.xz * 5.9 + 17.), k3), fine = clamp(.5 + (n3 + n4 - 1.) * .7, 0., 1.);
        float speck = mix(.5, nfNoise(vW.xz * 31.), k4);
        // meadow: short dark grass; in swathes long grass stands, its seed heads pale under the moon, and the wind lays
        // it over in long waves that cross the field. Inside the fence the grass is trodden; the paths are grit
        float wave = nfGust(vW.xz, 0.) * .5 + .5, swathe = smoothstep(.35, .75, nfFbm(vW.xz * .012 + 3.));
        float tall = 0., heads = clamp(.5 + (n2 - .5) * 1.1 + (fine - .5) * .5, 0., 1.), footD = 1e5;
        // TONES BY PLACE. Grass no one walks on is dark under the moon, in the meadow and between the tents alike;
        // where feet go it is trodden short and stands a shade lighter; a lane is trodden earth and grit, lighter
        // again and lightest down its middle; the courtyard round the fire keeps its pale grit
        // (the open meadow's grass stands a shade paler under the moon than the rank grass among the tents)
        // INSIDE THE FENCE THE GROUND'S TONE GOES BY CAUSE: the rank grass is the night meadow's own dark, one tone
        // (the slow noise that mottles the open meadow is left out there), the trodden grass the palette's trodden
        // ground a step lighter, with no blot of its own; what makes shapes on them is wear, the moon's shadows, the
        // pools and the grass left standing along the walls
        vec3 meadow = mix(vec3(.028, .032, .031), vec3(.046, .051, .05), mix(n1, .42, inF)) * (.72 + .56 * fine) * mix(1.7, .86, inF);
        vec3 trod = mix(vec3(.041, .046, .047), vec3(.056, .061, .062), .5 + (n2 - .5) * .35) * (.8 + .4 * fine) * (.9 + .2 * speck);
        // long grass stands in drifts some ten to twenty metres across, its seed heads pale under the moon in streaks
        float drift = smoothstep(.4, .62, nfFbm(vW.xz * .07 + 5.));
        // the meadow beyond the fence lies in fields between its hedges: each has its own length of grass (long grass
        // stands paler under the moon and shows the gusts; mown grass lies darker, in strips), a cart track of pale
        // earth goes out from the gate, a path is trodden round the outside of the fence and a footpath comes to it
        // across the meadow; the grass stands long along the line from the entry to the fence
        float trackD = 1e5, lane = 0., midT = 0., byBand = 0.; vec3 sw3 = vec3(0.);
        if (r > uFenceR - 6.) {
          float ang = atan(d.x, d.y), sec = 0.; for (int i = 0; i < 8; i++) sec += step(uField[i], ang);
          float fid = nfHash(vec2(sec, step(uRingR, r)) + 3.), fd = fid * 6.283;
          // (by the line the long grass stands in its swathes, a mown strip between each two: SWATHE_GLSL)
          float byLine = (1. - smoothstep(48., 80., abs(vW.x))) * step(uFirePos.z, vW.z);
          byBand = byLine * (1. - inF); sw3 = nfSwathe(vW.xz, px) * byBand;
          tall = max(step(.45, fid) * .55 * (1. - byLine), byLine * sw3.x);
          float strip = sin(dot(vW.xz, vec2(cos(fd), sin(fd))) * .9 + n2 * 1.5);
          meadow *= mix(.62 + .16 * smoothstep(-.3, .3, strip), 1., tall) * (.86 + .28 * fract(fid * 7.3));
          for (int i = 0; i < 7; i++) trackD = min(trackD, segDist(vW.xz, uTrack[i], uTrack[i + 1]));
          // (the cart track: two ruts of bare earth 1.5 m apart, and between them a strip of grass the wheels never touch)
          float tq = trackD + (n3 - .5) * .3, rut = 1. - smoothstep(.14, .42, abs(tq - .75));
          midT = 1. - smoothstep(.3, .55, tq);
          lane = (1. - smoothstep(1.2, 2.6, trackD + (n2 - .5) * 1.6)) * (.45 + .55 * rut) * (1. - .85 * midT);
          // (a footpath wanders a few metres either side of its line, and comes straight to the wicket over its last 30 m)
          vec2 wob = (vec2(nfNoise(vW.xz * .045 + 9.), nfNoise(vW.xz * .045 + 23.)) - .5) * 9., wq = vW.xz + wob * smoothstep(3., 30., r - uFenceR);
          for (int i = 0; i < ${FOOTPATH.length - 1}; i++) footD = min(footD, segDist(wq, uFoot[i], uFoot[i + 1]));
          footD = min(footD, abs(length(vW.xz + wob - uFirePos.xz) - uFenceR - 6.));
        }
        // paths are grit worn through the trodden grass: whole in the middle, and at the edge the turf stops at a crisp
        // ragged line (the edge wanders with the grass's own grains over a metre, but the step from turf to grit is a
        // hand wide), with a lip of dark turf standing a little over the grit along it
        float worn = m.r + (n2 - .5) * .5 + (n3 - .5) * .22, grit = smoothstep(.47, .55, worn), lip = smoothstep(.36, .47, worn) * (1. - smoothstep(.47, .53, worn));
        // where no one walks inside the fence (off every path and its fringe, 4.8 m and more from a lane's middle):
        // there the long grass stands in its drifts too, along the fence and between the tents' backs
        // (on the ground itself long grass shows as a paler cast where its seed heads stand thick: among the tents a
        // faint one, in the open meadow the sheen said above; its bodies stand over it)
        vec2 ways = texture2D(tWay, clamp(uv, 0., 1.)).rg * inMap; float way = ways.r, wild = (1. - smoothstep(.05, .45, worn)) * (1. - smoothstep(0., .3, way + (n2 - .5) * .1));
        // (inside the fence the long grass stands where it is left: along the walls, by the wear map, and not in drifts)
        float standing = wr.y * (1. - smoothstep(.1, .5, wr.x));
        float longG = max(max(swathe * .5 * (1. - inF) * (1. - byBand), wild * inF * standing), tall) * mix(mix(.22, 1., drift), 1., max(inF, byBand)) * (.72 + .28 * heads) * (.76 + .24 * wave);
        // THE OPEN MEADOW IS GRASS IN THE WIND, by the metres of the place. Its grass stands in tussocks half a metre
        // to three metres across with hollows between them (the body darker in a hollow, the pale cast of the seed
        // heads gathered on the crowns); here and there a swathe is lodged, combed flat down the wind in streaks a
        // metre wide; the seed heads on the crowns are fine bright flecks; and the wind's waves cross it as pale
        // bands. Each goes to its mean before it is finer than the ground a pixel covers. Inside the fence the
        // trodden ground keeps its own law, and the rank grass no one walks on stands in the same tussocks (rank)
        float open = 1. - inF, kT = 1. - smoothstep(.7, 3., px), rank = max(open, wild * .85);
        vec2 tq = vW.xz + (vec2(n3, n4) - .5) * .6, wnd = vec2(dot(vW.xz, uWind.xy), dot(vW.xz, vec2(-uWind.y, uWind.x)));
        float tus = mix(.5, .6 * nfNoise(tq * .55 + 41.) + .4 * nfNoise(mat2(.8, .6, -.6, .8) * tq * 1.4 + 63.), kT);
        float lodged = smoothstep(.5, .7, nfNoise(vW.xz * .055 + 11.)) * (mix(.5, nfNoise(wnd * vec2(.2, 1.1) + 7.), kT) - .5);
        float fleck = mix(.1, smoothstep(.68, .86, nfNoise(vW.xz * 8.5 + 3.)), k3) * smoothstep(.42, .7, tus), band = nfWindBand(vW.xz);
        meadow *= mix(1., .5 + tus, rank);
        float pale = longG * mix(${SHEEN_OPEN.toFixed(2)} * (.7 + .6 * heads), .16 + .2 * heads, inF);
        pale = clamp(pale * mix(1., (.3 + 1.4 * tus) * (1. + 1.1 * lodged) * (.82 + .9 * band), rank), 0., 1.);
        // (a swathe's crest takes the moon and stands palest; its far flank and the strip in its shadow lie dark)
        pale = clamp(pale * mix(1., .86 + .5 * sw3.y, byBand) * (1. - .62 * sw3.z), 0., 1.);
        meadow = mix(meadow * (1. + 2.9 * byBand * (1. - sw3.x)), vec3(.455, .5, .495) * (.78 + .44 * fine), pale) * (1. - .45 * sw3.z);
        meadow = mix(meadow, vec3(.66, .7, .69), open * fleck * .7 * smoothstep(.1, .5, longG));
        vec3 earth = vec3(.14, .141, .134) * (.8 + .3 * n2) * (.8 + .4 * speck);
        meadow = mix(meadow, earth, lane);
        meadow = mix(meadow, vec3(.024, .028, .027) * (.8 + .4 * fine), midT * .8 * (1. - smoothstep(1.2, 2.6, trackD)));
        // a footpath is a dark worn line: damp earth trodden bare a metre and a half wide, the grass trodden short and
        // dark for a metre more to either side
        float trodW = (1. - smoothstep(.9, 2.2, footD + (n2 - .5) * 1.4)) * (1. - inF);
        meadow = mix(meadow, vec3(.03, .034, .033) * (.8 + .4 * fine), trodW * .8);
        meadow = mix(meadow, earth * .34, (1. - smoothstep(.45, 1., footD + (n2 - .5) * .7 + (n3 - .5) * .3)) * (1. - inF) * .92);
        vec3 gritC = vec3(.232, .24, .25) * (.92 + .1 * n2) * (.74 + .3 * fine + .22 * speck);
        // THE LANE'S FLOOR, by the metres a place lies from its lane's middle line (across): worn most down the middle;
        // footprints 0.2 to 0.3 m across, most in the middle; straw in flecks 0.04 by 0.35 m and sawdust in soft
        // patches 2 m across; and on the cart's way alone (by the metres from that way's own middle line) two wheel
        // ruts 1.5 m apart, each 0.25 m wide, broken here and there: no other lane has them. Each grain goes to
        // its own mean before it is finer than the ground one pixel covers: the ruts between 0.12 and 0.5 m of
        // ground to the pixel, the prints between 0.06 and 0.26 m, the straw between 0.02 and 0.08 m
        float onWay = smoothstep(0., .1, way), across = (1. - way) * ${WAY_REACH.toFixed(1)} + (n2 - .5) * .3, mid = (1. - smoothstep(.4, 2.4, across)) * onWay;
        float kr = 1. - smoothstep(.12, .5, px), ks = 1. - smoothstep(.02, .08, px);
        float acrossCart = (1. - ways.g) * ${WAY_REACH.toFixed(1)} + (n2 - .5) * .3;
        float onCart = smoothstep(0., .1, ways.g), ruts = (1. - smoothstep(.09, .2, abs(acrossCart - .75))) * onCart * (.35 + .65 * smoothstep(.3, .55, nfFbm(vW.xz * .11 + 13.)));
        // (a print: in rather more than half of the ground's cells of 0.59 m an oval 0.1 by 0.28 m lies at its own place and turn)
        vec2 pc = vW.xz * 1.7, ci = floor(pc); float h1 = nfHash(ci + 5.), h2 = nfHash(ci + 17.), h3 = nfHash(ci + 29.), an = h3 * 6.283;
        vec2 po = fract(pc) - vec2(.25 + .5 * h1, .25 + .5 * h2); po = vec2(po.x * cos(an) + po.y * sin(an), po.y * cos(an) - po.x * sin(an));
        float printsAll = mix(.035, (1. - smoothstep(.55, 1., length(po * vec2(11.8, 4.2)))) * step(.45, fract(h3 * 7.)), k3), prints = printsAll * (.35 + .65 * mid);
        float straw = max(step(.9, nfNoise(vec2(vW.x * 23. + vW.z * 4., vW.z * 2.7 - vW.x * .6))), step(.9, nfNoise(vec2(vW.z * 21. - vW.x * 5., vW.x * 2.9 + vW.z * .5) + 9.)));
        straw = mix(.06, straw, ks) * smoothstep(.45, .7, nfFbm(vW.xz * .35 + 71.));
        float sawAll = smoothstep(.5, .72, nfFbm(vW.xz * .5 + 91.)), saw = sawAll * (.3 + .7 * mid);
        // (THE GRIT OF A PATH IS THE PALEST GROUND OF ITS LANE, paler again down its worn middle)
        vec3 laneC = mix(vec3(.13, .134, .138), vec3(.178, .183, .188), mid) * (.92 + .1 * n2) * (.74 + .3 * fine + .22 * speck);
        laneC = mix(laneC, vec3(.2, .196, .186) * (.8 + .4 * fine), saw * .55) * (1. - .36 * mix(.3 * onCart, ruts, kr)) * (1. - .5 * prints);
        float court = 1. - smoothstep(uCourtR - 2., uCourtR + 5., r);
        // THE COURTYARD'S FLOOR is the most trodden ground of the camp and has no middle: its pale grit takes the
        // lanes' own grain evenly all over, the footprints as thick as down a lane's middle, sawdust in its soft
        // patches and straw in flecks at half a lane's share (no ruts: the cart's way ends at its rim)
        gritC = mix(gritC, vec3(.2, .196, .186) * (.8 + .4 * fine), sawAll * .32) * (1. - .5 * printsAll);
        // (trodden: the fringe of every path, and the ground within reach of a lane's middle)
        float tread = max(smoothstep(.08, .5, worn), smoothstep(.02, .5, way + (n2 - .5) * .12) * .7);
        // (trodden turf is not whole: here and there, in patches 0.4 to 1 m across, the earth shows through it; and
        // the grit of a lane carries its stones, pale pebbles two fingers to a hand across)
        float bald = smoothstep(.56, .7, mix(.5, nfNoise(mat2(.8, .6, -.6, .8) * vW.xz * 1.6 + 53.), k2)) * (.5 + .5 * n3);
        float stone = mix(.07, smoothstep(.74, .86, nfNoise(vW.xz * 13. + 37.)), k3);
        // (worn ways off the paths, by the wear map: the turf trodden short at their skirts, the bare earth through
        // down their middles; the edge wanders with the grass's own grains and is a hand wide)
        float wornT = smoothstep(.2, .5, wr.x + (n2 - .5) * .22 + (n3 - .5) * .14), bare = smoothstep(.62, .9, wr.x + (n3 - .5) * .3 + (n2 - .5) * .16);
        vec3 inside = mix(meadow, mix(trod, earth * .82, max(bald * .8, bare * .88)), max(max(tread, court), wornT));
        // (THE COURTYARD'S FLOOR IS WORN WHERE FEET GO: a ring round the fire where the crowd walks about it, and a
        // way in from every gap of the inner ring, the grit trodden into the dark earth there, by the wear map)
        vec3 alb = mix(mix(meadow, inside, inF), mix(laneC, gritC * ${COURT_GRIT.toFixed(2)} * (1. - .5 * wornT), court) * (1. + .5 * stone), grit * inF) * (1. - .26 * lip * inF);
        alb = mix(alb, vec3(.36, .345, .3), straw * max(grit, tread) * inF * (1. - .5 * court) * .8);
        // CRISP NEAR THE EYE (NEAR_GRAIN): within 28 m of where the eye is the turf and the grit carry a grain one
        // scale finer than the rest, in world metres (two grains of 9 and 6 cm laid across each other, drawn up to
        // a crisp fleck: grass in clumps a hand across, the grit's small stones); it fades evenly to its mean by
        // 42 m from the eye, and wherever a pixel covers more than 2 to 6 cm of ground (it is gone before its finer
        // grain is as fine as a pixel), so that it never shimmers
        float k5 = (1. - smoothstep(.02, .06, px)) * (1. - smoothstep(${NEAR_GRAIN[0]}., ${NEAR_GRAIN[1]}., dist));
        if (k5 > 0.) alb *= 1. + (smoothstep(.3, .7, .55 * nfNoise(vW.xz * 11.3 + 7.) + .45 * nfNoise(mat2(.8, .6, -.6, .8) * vW.xz * 17. + 43.)) - .5) * mix(.6, .34, grit * inF) * k5;
        // snow lies thin on everything, and none near the fire, whose heat takes it off the courtyard (on the courtyard's grit as it
        // always did: none within 16 m, whole from 58 m) and thins it on the grass for 30 m beyond the rim (SNOW_OFF:
        // whole from 76 m).
        // ON THE SNOW NIGHT THE LANES ARE TRODDEN: where feet go beside a path (its fringe, the ground within reach of
        // a lane's middle) and down the bare middle of a worn way the snow is trodden off, with the path's own crisp
        // edge, and the worn turf shows dark; the grit keeps the thin share it had; off the ways the snow lies a little
        // deeper inside the fence (and on the meadow's mown strips, where nothing stands through it), the grass's own grain and its tussocks standing through it, and the wind has laid it
        // in low drifts across its bearing (2 m by 6 m), each paler on its crown
        float trodS = max(tread, smoothstep(.5, .8, wr.x + (n3 - .5) * .2)) * inF * (1. - grit), offS = inF * (1. - trodS) * (1. - grit) * (1. - court);
        float driftS = mix(.5, nfNoise(wnd * vec2(.16, .5) + 3.), kT), lie = clamp(.12 + .4 * n2 + .07 * offS + .1 * byBand * (1. - sw3.x) + (.5 * (fine - .5) + .34 * (tus - .5) + .3 * (driftS - .5)) * (1. - grit) * (1. - court), 0., 1.);
        alb = mix(alb, vec3(.8, .82, .86) * (.88 + .24 * driftS), uSnow * lie * (1. - .85 * trodS) * (1. - grit * .6) * smoothstep(mix(${SNOW_OFF[0]}., 16., court), mix(${SNOW_OFF[1]}., 58., court), r));
        // THE GROUND CLOTHS, drawn where the plan laid them (uClothA: a cloth's middle and the turn of its length;
        // uClothB: half its length, half its width, a stripe's breadth, its own key). A cloth's outline wanders a
        // hand's breadth (a rumpled edge); one corner is turned back over the cloth along a slanting fold and shows
        // the plain underside, the ground bare where the corner lay; one fold crosses it, lit on its moonward side
        // and shaded on the other; the cloth lies in soft billows; its stripes run across its length, within a pale hem a hand
        // wide, and go to their mean before they are finer than a pixel. On a night of snow, snow lies along its windward edge, in the
        // fold and in the billows' hollows, and the stripes show between. It takes the ground's own light below.
        float cloth = 0.;
        if (inF > .5) for (int i = 0; i < ${CLOTH_MAX}; i++) {
          vec4 ca = uClothA[i], cb = uClothB[i]; vec2 dq = vW.xz - ca.xy;
          if (dot(dq, dq) > dot(cb.xy, cb.xy) + 2.) continue;
          vec2 q = vec2(dq.x * ca.z + dq.y * ca.w, dq.y * ca.z - dq.x * ca.w);
          vec2 rim = cb.xy + .16 * (vec2(nfNoise(vec2(q.y * 1.7, cb.w * 37.)), nfNoise(vec2(q.x * 1.7, cb.w * 91.))) - .5);
          vec2 e = abs(q) - rim; float out0 = max(e.x, e.y), aw = max(px * .7, .012);
          vec2 sg = vec2(cb.w < .5 ? -1. : 1., fract(cb.w * 4.) < .5 ? -1. : 1.), cq = q * sg - cb.xy;
          float turn = .55 + .6 * fract(cb.w * 9.), sT = (cq.x + cq.y) * .7071 + turn; vec2 mq = cq - 1.4142 * sT;
          float on = (1. - smoothstep(-aw, aw, out0)) * (1. - smoothstep(-aw, aw, sT));
          float flap = (1. - smoothstep(-aw, aw, max(mq.x, mq.y))) * step(sT, 0.), flapShade = step(sT, 0.) * step(0., max(mq.x, mq.y)) * (1. - smoothstep(0., .16, max(mq.x, mq.y)));
          float sp = q.x / cb.z + cb.w * 2., sw = px / cb.z * 1.2, stripe = mix(smoothstep(.5 - sw, .5 + sw, abs(fract(sp * .5) - .5) * 2.), .5, smoothstep(.3, .9, sw));
          float bil = .65 * nfNoise(q * 1.1 + cb.w * 53.) + .35 * nfNoise(q * 2.7 + cb.w * 11.);
          float fd = q.x - (fract(cb.w * 13.) - .5) * cb.x + .14 * (nfNoise(vec2(q.y * .9, cb.w * 7.)) - .5), ms = dot(ca.zw, uMoonDir.xz) < 0. ? -1. : 1.;
          float foldLit = 1. + .34 * ms * clamp(fd / .1, -1., 1.) * exp(-abs(fd) / .4) - .3 * exp(-fd * fd / .003);
          float hem = smoothstep(-.17 - aw, -.17 + aw, out0);
          vec3 cc = mix(mix(vec3(.03, .031, .034), vec3(.5, .5, .48), max(stripe, hem * .85)), vec3(.27, .262, .245), flap) * (.8 + .34 * bil) * foldLit * (1. - .45 * flapShade * (1. - flap));
          float wSide = dot(vec2(-ca.w, ca.z), uWind.xy) < 0. ? -1. : 1.;
          float sn = max(max(smoothstep(.45, .1, rim.y - q.y * wSide + .5 * (nfNoise(q * vec2(.8, 2.3) + 5.) - .5)), smoothstep(.34, .06, abs(fd + .1 * ms))), smoothstep(.42, .28, bil));
          cc = mix(cc, vec3(.8, .82, .86), uSnow * sn * (.75 + .25 * nfNoise(q * 6.)));
          // (the ground just outside the cloth lies in the shade of its lifted edge)
          alb *= 1. - .3 * (1. - on) * (1. - smoothstep(0., .14, out0)) * step(sT, 0.);
          alb = mix(alb, cc, on); cloth = max(cloth, on);
        }
        vec3 up = vec3(0., 1., 0.);
        // the moon, less the tents' shadows (a tent hides a part of the sky too from the ground it shades); the fire,
        // a white round that falls away with distance, barred by its staves and dark behind every tent it cannot see past
        float fa = nfFireAtt(vW), ndl = (clamp(uFirePos.y / max(length(uFirePos - vW), 1.), 0., 1.) + .55) / 1.55;
        // the railings' shadow by the moon: the height at which the moon's line from this place meets the fence's
        // circle (posts to 3.1 m, uprights to 2.8 m, the two rails at 0.32 and 2.3 m), crisp at the fence's foot and
        // softer with the height; an upright's goes to its mean where a pixel covers more ground than it is wide
        float kU = 1. - smoothstep(.04, .14, px), fsh = 0.;
        vec2 md = uMoonDir.xz / max(uMoonDir.y, .15); float ma = dot(md, md), mb = dot(d, md), disc = mb * mb - ma * (r * r - uFenceR * uFenceR);
        if (disc > 0. && abs(r - uFenceR) < 3.3 * sqrt(ma)) {
          float sq = sqrt(disc), y1 = (-mb - sq) / ma, yh = y1 >= 0. ? y1 : (-mb + sq) / ma;
          if (yh >= 0. && yh < 3.1) {
            float fs = fenceAlong(d + md * yh), sf = .008 + .012 * yh; vec2 fb = fenceBars(fs, sf);
            float rails = max(1. - smoothstep(.035, .05 + 2. * sf, abs(yh - .32)), 1. - smoothstep(.035, .05 + 2. * sf, abs(yh - 2.3))) * step(0., fs);
            fsh = max(max(fb.x, rails), mix(.14 * step(0., fs), fb.y, kU) * step(yh, 2.8));
          }
        }
        // THE FIRE'S ROUND ON THE GROUND, by the metres from the fire (the same on every pass). The floor takes the
        // fire's light more strongly than a standing thing does and keeps it farther out (fireG: the grit is darker
        // at the hearth, COURT_GRIT, so that a lit place near the fire is little brighter than it was and the
        // shadows in the round are deeper); on the floor a stave's bar is whole shadow, from the hearth to the rim and
        // beyond; and the hearth's own wall, 1.5 m high about a fire that burns low in it, lays a shadow at its foot,
        // deep at the wall and gone 10.5 m from the middle, out of which the sixteen bars run
        float fireG = (${(2.05 / COURT_GRIT).toFixed(3)} + 2.2 * smoothstep(14., 60., r)) * (1. - .85 * (1. - smoothstep(5.4, 10.5, r))), barG = 1. - min((1. - nfBars(vW)) * 1.4, 1.);
        vec3 light = nfHemi(up) * (1. - .5 * wr.z) + uMoonCol * uMoonDir.y * (1. - .88 * wr.z) * (1. - .8 * fsh) + uFireCol * fa * ndl * .8 * fireG * barG * (1. - .9 * m.b);
        // the small lights' pools at the walls' feet (a napping tent's goes down and comes back with its lights)
        float pool = lay.r * 1.275;
        if (r < uFenceR + 60.) for (int i = 0; i < ${NAP_MAX}; i++) {
          vec4 a = uNapA[i], b = uNapB[i]; float e = segDist(vW.xz, a.xy, a.zw) - b.x * .8, c = fract(uTime / max(b.y, 1.) + b.z);
          float lit = .2 + .8 * (1. - clamp((c - .56) / .16, 0., 1.) * (1. - clamp((c - .82) / .16, 0., 1.)));
          float f = 1. - clamp(e / ${(GLOW_REACH + 0.01).toFixed(2)}, 0., 1.), t = clamp(1. - e / 9., 0., 1.);
          pool += b.w * lit * step(0., e) * (.13 * f * f + .87 * t * t * t);
        }
        // (inside the fence the small lights' glow lies at the walls' feet: where many tents' far skirts add up to an
        // even veil over a lane, seven eighths of that veil is left out, so that the lanes keep their dark and a
        // lantern's pool, a wall's foot and a doorway's light stand out of it; the full glow at a wall's foot stays)
        pool = mix(pool, pool * smoothstep(.1, .8, pool), .88 * inF);
        // the lanterns' light through the railings (the five parts of the round about this place's bearing, two
        // lanterns in each): the fan's widening at this place is mag; an upright's bar goes to its mean where a pixel
        // covers more ground than the bars stand apart
        float fan = 0.;
        if (r > uFenceR - 6. && r < uFenceR + ${FAN_REACH.toFixed(1)}) {
          float k0 = floor(mod(atan(d.x, d.y), 6.2831853) * ${(FAN_K / TAU).toFixed(5)});
          for (int j = 0; j < 10; j++) {
            vec4 two = uFan[int(mod(k0 + float(j / 2) + ${(FAN_K - 2).toFixed(1)}, ${FAN_K.toFixed(1)}))];
            vec2 c = (j - (j / 2) * 2 == 0 ? two.xy : two.zw) - uFirePos.xz, dp = d - c; float l = max(length(dp), .01);
            vec2 u = dp / l; float bq = dot(c, u), tq = -bq + sqrt(max(bq * bq - dot(c, c) + uFenceR * uFenceR, 0.)), beyond = l - tq, mag = l / max(tq, 1.);
            float fs = fenceAlong(c + u * tq), there = step(0., fs) * step(0., beyond), far = max(beyond, 0.) / l; vec2 fb = fenceBars(fs, .1 * far);
            float comb = mix(mix(.25, fb.y, 1. - smoothstep(.2, .5, px / (.24 * mag))), .25, smoothstep(.04, .25, far));
            float rail = 1. - smoothstep(.05 + .03 * beyond, .12 + .08 * beyond, abs(beyond - .12 * tq));
            fan += ${FAN_FALL('l')} * (1. - max(max(fb.x * (1. - .5 * far), comb), rail) * there);
          }
        }
        light += ${IVORY} * (pool * .85 + lay.g * ${POOL_GAIN.toFixed(1)} + ${FAN_LIGHT.toFixed(2)} * mix(1., ${FAN_SNOW.toFixed(2)}, uSnow) * fan * smoothstep(uFenceR - 6., uFenceR - 1., r)) + vec3(.86, .92, 1.04) * lay.b * .7;
        gl_FragColor = vec4(nfFog(alb * light, dist), 1.);
      }`,
  });
}

// a stream of draws of its own for each new thing, made from the world's seed and a name
export const stream = (ctx, name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));

// THE HOOP LIES IN THE ROOF. The canvas shader cuts the tallest tent's roof along the round of crown.w metres about
// the crown; the hoop of the crown is bar iron (HOOP_BAR metres in radius) lying in that cut edge, sewn into the
// cloth's hem (hemInto), so the hem is what is seen of it. Its middle line is
// the line along which the cloth's own mesh (the columns the canvas is written from) meets that round, found edge by
// edge of the mesh: it rises to the poles and dips with the cloth between them all the way round, as the cut edge
// does. u, v: two ways across the opening, by which the edge's points are put in order round the crown.
// Gives the points in that order (the last is the first again), each one's angle, where on the cloth each lies (sg: s
// stripes round the foot, running on round the ring without a break, and g up the roof's rise), and the edge's place
// at an angle (x, y, z, s, g).
const HOOP_BAR = 0.08;
function cutEdge(T, crown, u, v) {
  const segs = T.n * 2, nR = T.prof.length, c = [crown.x, crown.y, crown.z], R = crown.w, cols = [], found = [];
  for (let j = 0; j <= segs; j++) { const p = new Float64Array((nR + 5) * 3); tentColumn(T, j, p); cols.push(p); }
  // where a straight edge of the mesh goes through the round (twice, if it does so twice)
  const cross = (A, a, B, b, sA, gA, sB, gB) => {
    const dx = B[b] - A[a], dy = B[b + 1] - A[a + 1], dz = B[b + 2] - A[a + 2], ox = A[a] - c[0], oy = A[a + 1] - c[1], oz = A[a + 2] - c[2];
    const qa = dx * dx + dy * dy + dz * dz, qb = ox * dx + oy * dy + oz * dz, disc = qb * qb - qa * (ox * ox + oy * oy + oz * oz - R * R);
    if (qa < 1e-12 || disc < 0) return;
    for (const t of [(-qb - Math.sqrt(disc)) / qa, (-qb + Math.sqrt(disc)) / qa]) if (t >= 0 && t <= 1) {
      const p = [A[a] + dx * t, A[a + 1] + dy * t, A[a + 2] + dz * t], e = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
      found.push({ p, a: Math.atan2(e[0] * v[0] + e[1] * v[1] + e[2] * v[2], e[0] * u[0] + e[1] * u[1] + e[2] * u[2]), s: lerp(sA, sB, t), g: lerp(gA, gB, t) });
    }
  };
  // (the roof's triangles: between two columns, each row's edge, each column's edge up to the next row, and the slant between)
  for (let j = 0; j < segs; j++) for (let r = 0; r < nR; r++) {
    const k = (3 + r) * 3, g0 = T.prof[r][1]; cross(cols[j], k, cols[j + 1], k, j / 2, g0, (j + 1) / 2, g0);
    if (r < nR - 1) { const g1 = T.prof[r + 1][1]; cross(cols[j], k, cols[j], k + 3, j / 2, g0, j / 2, g1); cross(cols[j], k, cols[j + 1], k + 3, j / 2, g0, (j + 1) / 2, g1); }
  }
  found.sort((p, q) => p.a - q.a);
  // (a crossing at a corner of the mesh is found by every edge that meets there: one of them is kept)
  const kept = []; for (const f of found) { const l = kept[kept.length - 1] || found[found.length - 1]; if (Math.hypot(f.p[0] - l.p[0], f.p[1] - l.p[1], f.p[2] - l.p[2]) > 0.12) kept.push(f); }
  const pts = kept.map((f) => f.p), ang = kept.map((f) => f.a), n = pts.length; pts.push(pts[0]); ang.push(ang[0] + TAU);
  // (the stripe count runs on round the ring: where it would step back by the tent's whole count it is carried on)
  const sg = []; for (const f of kept) { const l = sg[sg.length - 1]; sg.push([l ? f.s + T.n * Math.round((l[0] - f.s) / T.n) : f.s, f.g]); }
  sg.push([sg[0][0] + T.n * Math.round((sg[n - 1][0] - sg[0][0]) / T.n), sg[0][1]]);
  const at = (a) => {
    a = ang[0] + ((((a - ang[0]) % TAU) + TAU) % TAU); let i = 0; while (i < n - 1 && ang[i + 1] < a) i++;
    const t = clamp((a - ang[i]) / Math.max(1e-9, ang[i + 1] - ang[i]), 0, 1), p = pts[i], q = pts[i + 1];
    return [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t), lerp(sg[i][0], sg[i + 1][0], t), lerp(sg[i][1], sg[i + 1][1], t)];
  };
  return { pts, ang, sg, at };
}

// THE HEM OF THE CROWN'S CUT EDGE. The cloth is turned over the hoop's bar and sewn down: all along the cut edge a round
// of plain canvas a hand and a half thick (HOOP_BAR in radius) with the bar inside it. It is cloth, so it is written
// into the canvas's own mesh and rides the cloth in the gusts as the edge itself does: every ring of it carries its
// edge point's place on the cloth (the stripe count, the height up the roof, the cloth's own normal there, by which
// the canvas shader moves it), and its own round's normal goes in aK with the mark 9, by which the shader knows the hem.
function hemInto(T, hoop) {
  const pts = hoop.pts, n = pts.length - 1, sides = 6, nv = (n + 1) * sides, cols = new Map();
  const aPos = new Float32Array(nv * 3), aNrm = new Float32Array(nv * 3), aS = new Float32Array(nv), aP = new Float32Array(nv * 4), aDoor = new Float32Array(nv * 4), aK = new Float32Array(nv * 4), aVis = new Float32Array(nv * 2).fill(1);
  const idx = new Uint32Array(n * sides * 6);
  for (let i = 0; i <= n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], sg = hoop.sg[i], c = clothAt(T, ((sg[0] % T.n) + T.n) % T.n, 1 + sg[1], cols).n;
    // the ring's two ways: the cloth's normal made square to the edge's run, and across both
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const d = c[0] * tx + c[1] * ty + c[2] * tz; let ux = c[0] - tx * d, uy = c[1] - ty * d, uz = c[2] - tz * d; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
    for (let k = 0; k < sides; k++) {
      const th = k / sides * TAU, cs = Math.cos(th), sn = Math.sin(th), dx = ux * cs + vx * sn, dy = uy * cs + vy * sn, dz = uz * cs + vz * sn, v = i * sides + k, o3 = v * 3, o4 = v * 4;
      aPos[o3] = p[0] + dx * HOOP_BAR; aPos[o3 + 1] = p[1] + dy * HOOP_BAR; aPos[o3 + 2] = p[2] + dz * HOOP_BAR; aNrm[o3] = c[0]; aNrm[o3 + 1] = c[1]; aNrm[o3 + 2] = c[2]; aS[v] = sg[0];
      aP[o4] = 1 + sg[1]; aP[o4 + 1] = T.gust ?? T.phase; aP[o4 + 2] = T.sw; aP[o4 + 3] = T.slope; aDoor[o4] = 999; aK[o4] = dx; aK[o4 + 1] = dy; aK[o4 + 2] = dz; aK[o4 + 3] = 9;
    }
  }
  for (let i = 0, ii = 0; i < n; i++) for (let k = 0; k < sides; k++, ii += 6) {
    const a = i * sides + k, b = i * sides + (k + 1) % sides, c = (i + 1) * sides + (k + 1) % sides, d = (i + 1) * sides + k;
    idx[ii] = a; idx[ii + 1] = b; idx[ii + 2] = c; idx[ii + 3] = a; idx[ii + 4] = c; idx[ii + 5] = d;
  }
  return { n: nv, a: [aPos, aNrm, aS, aP, aDoor, aK, aVis], idx };
}

// masts with their pennants, guy ropes, the gate's posts and the candle tree's hoop
async function heroIron(B) {
  const { forks, route, L, lay, tents, object, pause } = B, P = PLACES, S = P.steps, rr = forks.ropes;
  const I = new Geo(IRON_SPEC), SG = new Geo(SHADE_SPEC), pennants = [], ropes = [], wood = () => ({ aC: 3.4 }), iron = () => ({ aC: 1 });
  // a rope hangs in a shallow sag from its top to an iron peg driven in aslant, and the peg lays a small shadow
  const rope = (top, peg, ph, w, sag) => {
    const pts = [], n = 6, dx = peg[0] - top[0], dz = peg[2] - top[2], l = Math.hypot(dx, dz) || 1;
    for (let k = 0; k <= n; k++) { const t = k / n; pts.push([lerp(top[0], peg[0], t), lerp(top[1], peg[1], t) - sag * 4 * t * (1 - t), lerp(top[2], peg[2], t)]); }
    ropes.push({ pts, ph, w });
    tubeInto(I, [[peg[0] + dx / l * 0.16, -0.1, peg[2] + dz / l * 0.16], [peg[0] - dx / l * 0.1, 0.42, peg[2] - dz / l * 0.1]], [0.035, 0.045], 4, iron, true);
    shadowInto(SG, [peg[0], peg[2]], 0.2, 0.5, L.moonDir, 0.7);
    return pts;
  };
  const mast = (x, y0, z, y1, r0, r1, len, white) => {
    tubeInto(I, [[x, y0, z], [x, y1, z]], [r0, r1], 6, wood, true);
    const top = [x, y1 - 0.25, z]; if (!route.near(top[0], top[1], top[2], 8)) pennants.push({ at: top, len, ph: rr() * TAU, white, wid: len * 0.2 });
  };
  for (const T of tents) {
    for (const t of tentTops(T)) mast(t[0], t[1] - 1.2, t[2], t[1] + T.mast, 0.13, 0.07, T.ring === 3 ? rr.range(1.1, 1.5) : rr.range(2.3, 3.6), T.pennant);
    if (T.special === 'collar') continue;
    // a guy rope from every second pole to a peg; none within 8.5 m of the route (rope, peg and all), none where a flap or another tent stands
    for (let s = 0; s < T.n; s += 4) {
      const q = s * T.sw, pm = perimAt(T, q), top = tentPoint(T, s, 0, 0.15), reach = Math.min(top[1] * 0.75, 13) + 1, o = toWorld(T, pm[0] + pm[2] * reach, pm[1] + pm[3] * reach), peg = [o[0], 0.12, o[1]];
      const mid = [(top[0] + peg[0]) / 2, (top[1] + peg[1]) / 2 - 0.12, (top[2] + peg[2]) / 2], ph = rr() * TAU;
      if (T.doors.some((d) => Math.abs(((q - d.q + T.per * 1.5) % T.per) - T.per / 2) < d.hw + 1.2)) continue;
      if (route.near(top[0], top[1], top[2], 8.5) || route.near(peg[0], peg[1], peg[2], 8.5) || route.near(mid[0], mid[1], mid[2], 8.5)) continue;
      if (tents.some((o2) => o2 !== T && Math.hypot(o2.x - peg[0], o2.z - peg[2]) < o2.L + o2.R + 1 && outsideBy(o2, peg[0], 0.3, peg[2]) < 0.6)) continue;
      rope(top, peg, ph, 0.045, 0.02 * Math.hypot(top[0] - peg[0], top[1] - peg[1], top[2] - peg[2]));
    }
    await pause(3);
  }
  // the cloud steps' twin masts either side of its axis at the high end (the hoop of its crown lies in the hem of the
  // roof's cut edge, which is cloth: see hemInto)
  const st = lay.steps, mastTops = [];
  for (const sg of [-1, 1]) { const w = toWorld(st, 37, sg * S.mastOff); tubeInto(I, [[w[0], 0, w[1]], [w[0], S.mast * 0.5, w[1]], [w[0], S.mast, w[1]]], [0.5, 0.4, 0.24], 8, wood, true); mastTops.push([w[0], S.mast, w[1]]); pennants.push({ at: [w[0], S.mast - 0.4, w[1]], len: 5.5, ph: rr() * TAU, white: sg > 0 ? 1 : 0, wid: 1.1 }); }
  // guy ropes fan from the head of each twin mast, out over the eave to pegs beyond the wall: six to a mast, to the
  // mast's own side of the tent; none that would come within 8 m of the line or run through another tent
  for (const [mi, sg] of [-1, 1].entries()) {
    const m = mastTops[mi], out = toWorld(st, 37, sg * (S.mastOff + 10)), ob = Math.atan2(out[0] - m[0], out[1] - m[2]) / RAD;
    for (let k = 0; k < 6; k++) {
      const b = ob + (k - 2.5) * 27 + rr.range(-6, 6), h = head(b), reach = rr.range(46, 58), top = [m[0], S.mast - 2.5 - (k % 2) * 3, m[2]], peg = [m[0] + h[0] * reach, 0.12, m[2] + h[1] * reach], ph = rr() * TAU;
      let ok = true;
      for (let j = 0; j <= 12 && ok; j++) { const t = j / 12, x = lerp(top[0], peg[0], t), y = lerp(top[1], peg[1], t) - 6 * t * (1 - t), z = lerp(top[2], peg[2], t);
        if (route.near(x, y, z, 8.6) || tents.some((o2) => Math.hypot(o2.x - x, o2.z - z) < o2.L + o2.R + 1 && outsideBy(o2, x, y, z) < 0.5)) ok = false; }
      if (ok) rope(top, peg, ph, 0.085, 1.5);
    }
  }
  await pause();
  const ringOf = (c, u, v, r, tube, n) => { const pts = []; for (let k = 0; k <= n; k++) { const a = k / n * TAU, cs = Math.cos(a) * r, sn = Math.sin(a) * r; pts.push([c[0] + u[0] * cs + v[0] * sn, c[1] + u[1] * cs + v[1] * sn, c[2] + u[2] * cs + v[2] * sn]); } tubeInto(I, pts, pts.map(() => tube), 6, iron); };
  await pause();
  ringOf([P.tree[0], 17, P.tree[1]], [1, 0, 0], [0, 0, 1], 15, 0.32, 48);
  await pause();
  // the gate: two plain posts
  const gb = 197 * RAD, tang = [Math.cos(gb), -Math.sin(gb)];
  for (const sg of [-1, 1]) { const x = P.gate[0] + tang[0] * 3.6 * sg, z = P.gate[1] + tang[1] * 3.6 * sg; tubeInto(I, [[x, 0, z], [x, 6, z]], [0.24, 0.2], 8, iron, true); }
  // the wicket: two posts no higher than the fence's own
  { const wb = WICKET.b * RAD, wt = [Math.cos(wb), -Math.sin(wb)]; for (const sg of [-1, 1]) { const x = WICKET.at[0] + wt[0] * WICKET.half * sg, z = WICKET.at[1] + wt[1] * WICKET.half * sg; tubeInto(I, [[x, 0, z], [x, 3.15, z]], [0.13, 0.11], 6, iron, true); } }
  // the lantern stakes: a thin iron stake, a small cap over the lantern at its head (the flame is one of the small
  // lights), and the stake's own thin shadow from the moon
  for (const l of B.lamps) {
    tubeInto(I, [[l.x, -0.1, l.z], [l.x, l.h - 0.12, l.z]], [0.055, 0.04], 4, iron); tubeInto(I, [[l.x, l.h + 0.16, l.z], [l.x, l.h + 0.4, l.z]], [0.2, 0.025], 4, iron, true);
    shadowInto(SG, [l.x, l.z], 0.14, l.h, L.moonDir, 0.6);
  }
  await pause();
  // THE ROPES' SHADOWS BY THE LANTERNS. A lantern stake lays the shadow of every guy rope pegged within its pool
  // (LAMP_POOL metres) as a ray on the ground from the peg straight away from the lantern: as far as the rope's point
  // at seven tenths of the lantern's height throws it, ending at the pool's edge or at the first canvas it meets,
  // and fainter the farther the peg stands from the lantern. (the moon's shadows of the ropes are laid with the camp's
  // things; these go into the pegs' own shadow mesh: no rope, peg or lantern is added or moved)
  const shadeLine = (a, b, w0, w1, k) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.6) return; const vx = -dz / l, vz = dx / l;
    const id = [[-1, 0], [1, 0], [1, 1], [-1, 1]].map(([sd, t]) => SG.v({ position: [lerp(a[0], b[0], t) + vx * lerp(w0, w1, t) * sd, 0.06, lerp(a[1], b[1], t) + vz * lerp(w0, w1, t) * sd], aS: [sd, t, k] }));
    SG.quad(id[0], id[1], id[2], id[3]);
  };
  for (const [ri, r] of ropes.entries()) {
    const top = r.pts[0], peg = r.pts[r.pts.length - 1];
    for (const l of B.lamps) {
      const d = Math.hypot(peg[0] - l.x, peg[2] - l.z); if (d > LAMP_POOL - 1 || d < 0.5) continue;
      let q = top; for (let k = r.pts.length - 1; k > 0; k--) if (r.pts[k - 1][1] >= 0.7 * l.h) { const a = r.pts[k], b = r.pts[k - 1], t = (0.7 * l.h - a[1]) / (b[1] - a[1] || 1); q = [lerp(a[0], b[0], t), 0.7 * l.h, lerp(a[2], b[2], t)]; break; }
      const f = l.h / (l.h - Math.min(q[1], 0.7 * l.h)), ex = l.x + (q[0] - l.x) * f - peg[0], ez = l.z + (q[2] - l.z) * f - peg[2], el = Math.hypot(ex + peg[0] - l.x, ez + peg[2] - l.z);
      let cut = el > LAMP_POOL ? clamp((LAMP_POOL - d) / (el - d || 1), 0, 1) : 1;
      const by = tents.filter((o) => Math.hypot(o.x - peg[0], o.z - peg[2]) < o.L + o.R + LAMP_POOL + 1);
      for (let j = 1; j <= 6; j++) { const t = cut * j / 6; if (by.some((o) => planOut(o, peg[0] + ex * t, peg[2] + ez * t) < 0.2)) { cut *= (j - 1) / 6; break; } }
      shadeLine([peg[0], peg[2]], [peg[0] + ex * cut, peg[2] + ez * cut], 0.05, 0.05 + 0.03 * Math.hypot(ex, ez) * cut, 0.6 * (1 - d / LAMP_POOL));
    }
    if (ri % 40 === 39) await pause();
  }
  const ironMesh = new THREE.Mesh(await I.buildIn(pause), ironMaterial(L)); ironMesh.frustumCulled = false;
  object.add(ironMesh);
  await pause();
  object.add(await ropeMesh(L, ropes, pause));
  await pause();
  const pegShade = new THREE.Mesh(SG.build(), shadowMaterial(L)); pegShade.frustumCulled = false; pegShade.renderOrder = 1; object.add(pegShade);
  B.ropes = ropes;
  await pause();
  object.add(pennantMesh(L, pennants));
  B.mastTops = mastTops; B.ironMat = ironMesh.material;
  await pause();
}
// ---------------------------------------------------------------- the things of a camp
// What stands about where tents are pitched and struck: trunks, crates, barrels, buckets, folded canvas, coils of rope,
// ladders and handcarts, plain made and unlettered, in black, grey and white. Each is written into one mesh (THING tones:
// the share of white in its paint) and lays the moon's shadow of its own size beside it.
const THING = { black: 1.1, dark: 2.4, grey: 4.2, pale: 6.5, white: 9.5 };
// (boxes, turned shapes and thin tubes written straight into the things' own lists: p positions, n normals, c tones, i corners)
const BOX_FACES = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]]], BOX_CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
function thingBox(G, c, s, k, rot) {
  const cr = Math.cos(rot), sr = Math.sin(rot), hx = s[0] / 2, hy = s[1] / 2, hz = s[2] / 2;
  for (const [n, u, v] of BOX_FACES) {
    const nx = n[0] * cr + n[2] * sr, nz = -n[0] * sr + n[2] * cr, v0 = G.p.length / 3;
    for (let q = 0; q < 4; q++) { const a = BOX_CORNERS[q][0], b = BOX_CORNERS[q][1], lx = (n[0] + u[0] * a + v[0] * b) * hx, ly = (n[1] + u[1] * a + v[1] * b) * hy, lz = (n[2] + u[2] * a + v[2] * b) * hz;
      G.p.push(c[0] + lx * cr + lz * sr, c[1] + ly, c[2] - lx * sr + lz * cr); G.n.push(nx, n[1], nz); G.c.push(k); }
    G.i.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
  }
}
function thingLathe(G, c, prof, sides, k) {
  const m = prof.length, v0 = G.p.length / 3;
  for (let i = 0; i <= sides; i++) { const a = i / sides * TAU, cs = Math.sin(a), sn = Math.cos(a);
    for (let j = 0; j < m; j++) { const q = prof[j], p0 = prof[Math.max(0, j - 1)], p1 = prof[Math.min(m - 1, j + 1)], dr = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dr, dy) || 1;
      G.p.push(c[0] + cs * q[0], c[1] + q[1], c[2] + sn * q[0]); G.n.push(cs * dy / l, -dr / l, sn * dy / l); G.c.push(k); } }
  for (let i = 0; i < sides; i++) for (let j = 0; j < m - 1; j++) { const a = v0 + i * m + j; G.i.push(a, a + m, a + m + 1, a, a + m + 1, a + 1); }
}
// (a thin tube of one radius along a few points; across it one way lies level, the other square to that and to the run)
function thingTube(G, pts, r, sides, k) {
  const m = pts.length, v0 = G.p.length / 3;
  for (let i = 0; i < m; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)], q = pts[i]; let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let ux = -tz, uz = tx; const ul = Math.hypot(ux, uz); if (ul < 0.05) { ux = 1; uz = 0; } else { ux /= ul; uz /= ul; }
    const wx = ty * uz, wy = tz * ux - tx * uz, wz = -ty * ux;
    for (let e = 0; e < sides; e++) { const an = e / sides * TAU, cs = Math.cos(an), sn = Math.sin(an), nx = ux * cs + wx * sn, ny = wy * sn, nz = uz * cs + wz * sn; G.p.push(q[0] + nx * r, q[1] + ny * r, q[2] + nz * r); G.n.push(nx, ny, nz); G.c.push(k); }
  }
  for (let i = 0; i < m - 1; i++) for (let e = 0; e < sides; e++) { const a = v0 + i * sides + e, b = v0 + i * sides + (e + 1) % sides; G.i.push(a, b, b + sides, a, b + sides, a + sides); }
}
const thingShapes = {
  // a trunk with a lid and two straps; s: its length
  trunk(G, c, rot, s, k) { const w = s * 0.52, h = s * 0.46; thingBox(G, [c[0], c[1] + h * 0.4, c[2]], [s, h * 0.8, w], k, rot); thingBox(G, [c[0], c[1] + h * 0.9, c[2]], [s * 1.03, h * 0.2, w * 1.05], k * 0.8, rot);
    for (const e of [-0.3, 0.3]) { const cr = Math.cos(rot), sr = Math.sin(rot); thingBox(G, [c[0] + e * s * cr, c[1] + h * 0.5, c[2] - e * s * sr], [s * 0.05, h * 1.02, w * 1.08], THING.black, rot); }
    return h; },
  // a crate of boards with a batten round its top
  crate(G, c, rot, s, k) { thingBox(G, [c[0], c[1] + s * 0.5, c[2]], [s, s, s], k, rot); thingBox(G, [c[0], c[1] + s * 0.93, c[2]], [s * 1.06, s * 0.1, s * 1.06], k * 0.7, rot); return s; },
  // a barrel with two iron hoops
  barrel(G, c, s, k) { const r = s * 0.3; thingLathe(G, c, [[0, s], [r * 0.86, s], [r * 1.05, s * 0.5], [r * 0.86, 0]], 6, k);
    for (const y of [0.24, 0.76]) thingLathe(G, c, [[r * 1.02, s * (y - 0.035)], [r * 1.02, s * (y + 0.035)]], 6, THING.black); return s; },
  bucket(G, c, s, k) { thingLathe(G, c, [[s * 0.42, 0], [s * 0.55, s], [s * 0.4, s * 0.1], [0, s * 0.1]], 5, k); return s; },
  // canvas folded in slabs, the stripe of each fold showing
  canvas(G, c, rot, s, n) { for (let i = 0; i < n; i++) thingBox(G, [c[0], c[1] + 0.05 + i * 0.1, c[2]], [s * (1 - 0.04 * i), 0.1, s * 0.62 * (1 - 0.05 * i)], i % 2 ? THING.black : THING.white, rot + i * 0.06); return n * 0.1; },
  // a coil of rope lying flat: two turns
  coil(G, c, s) { const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 7 * TAU, r = s * (0.5 - 0.02 * i); pts.push([c[0] + Math.cos(a) * r, c[1] + 0.045 + 0.008 * i, c[2] + Math.sin(a) * r]); } thingTube(G, pts, 0.045, 3, THING.pale); return 0.2; },
  // a ladder leaning on a wall: its feet at c, its head h up and `lean` nearer the wall, which lies the way (ox, oz)
  ladder(G, c, ox, oz, h, lean) { const sx = -oz * 0.24, sz = ox * 0.24;
    for (const e of [-1, 1]) thingTube(G, [[c[0] + sx * e, c[1], c[2] + sz * e], [c[0] + sx * e + ox * lean, c[1] + h, c[2] + sz * e + oz * lean]], 0.035, 3, THING.grey);
    for (let y = 0.4; y < h - 0.2; y += 0.4) { const t = y / h; thingTube(G, [[c[0] - sx + ox * lean * t, c[1] + y, c[2] - sz + oz * lean * t], [c[0] + sx + ox * lean * t, c[1] + y, c[2] + sz + oz * lean * t]], 0.022, 3, THING.grey); }
    return h; },
  // a handcart at rest: a bed on two wheels, tipped onto its two handles; (ox, oz) the way its handles point
  cart(G, c, ox, oz, k) { const rot = Math.atan2(-oz, ox), px = -oz, pz = ox;
    thingBox(G, [c[0], c[1] + 0.62, c[2]], [1.7, 0.08, 0.95], k, rot);
    for (const e of [-1, 1]) { thingBox(G, [c[0] + px * 0.47 * e, c[1] + 0.78, c[2] + pz * 0.47 * e], [1.7, 0.26, 0.04], k, rot);
      const wc = [c[0] + px * 0.56 * e - ox * 0.1, c[1] + 0.46, c[2] + pz * 0.56 * e - oz * 0.1], rim = [];
      for (let i = 0; i <= 8; i++) { const a = i / 8 * TAU; rim.push([wc[0] + ox * Math.cos(a) * 0.46, wc[1] + Math.sin(a) * 0.46, wc[2] + oz * Math.cos(a) * 0.46]); }
      thingTube(G, rim, 0.035, 3, THING.black);
      for (const a of [0.4, 1.97]) thingTube(G, [[wc[0] - ox * Math.cos(a) * 0.44, wc[1] - Math.sin(a) * 0.44, wc[2] - oz * Math.cos(a) * 0.44], [wc[0] + ox * Math.cos(a) * 0.44, wc[1] + Math.sin(a) * 0.44, wc[2] + oz * Math.cos(a) * 0.44]], 0.02, 3, THING.dark);
      thingTube(G, [[c[0] + px * 0.4 * e + ox * 0.8, c[1] + 0.6, c[2] + pz * 0.4 * e + oz * 0.8], [c[0] + px * 0.4 * e + ox * 1.95, c[1] + 0.05, c[2] + pz * 0.4 * e + oz * 1.95]], 0.028, 3, THING.dark); }
    return 0.95; },
};
// The things' own matte paint under the light all things share: the moon (none where a tent's shadow lies over the
// thing: the ground's own baked shadow, read at the place where the moon's ray through the thing meets the ground),
// the sky, the fire, and the pools the small lights and the lanterns lay (those of the tents that never nap, as the
// tufts of grass take them)
function thingMaterial(L, map, glow) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...L.uniforms, tMap: { value: map }, tGlow: glow },
    vertexShader: 'attribute float aC; varying vec3 vW, vN; varying float vC; void main(){ vW = position; vN = normal; vC = aC; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vC; uniform sampler2D tMap, tGlow;
      ${LIGHT_GLSL}
      void main() {
        vec3 n = normalize(vN), Lf = normalize(uFirePos - vW);
        vec3 alb = vec3(.035, .037, .042) * vC * (.82 + .36 * nfNoise(vW.xz * 7. + vW.y * 9.));
        vec2 uv = (vW.xz - uFirePos.xz) / ${(2 * MAP_HALF).toFixed(1)} + .5, us = uv - uMoonDir.xz * (vW.y / max(uMoonDir.y, .15)) / ${(2 * MAP_HALF).toFixed(1)};
        float shade = texture2D(tMap, clamp(us, 0., 1.)).g; vec3 lay = texture2D(tGlow, clamp(uv, 0., 1.)).rgb;
        // (the ground under a thing is its own dark: the lower faces and the foot take less of the sky)
        float foot = .55 + .45 * smoothstep(0., .5, vW.y);
        vec3 light = nfHemi(n) * foot * (1. - .5 * shade) + nfMoon(n, .15) * (1. - .88 * shade) + uFireCol * nfFireAtt(vW) * clamp(dot(n, Lf), 0., 1.) * nfBars(vW)
          + ${IVORY} * (lay.r * 1.08 + lay.g * ${POOL_GAIN.toFixed(1)}) * (.55 + .45 * clamp(n.y + .6, 0., 1.));
        gl_FragColor = vec4(nfFog(alb * light, length(cameraPosition - vW)), 1.);
      }`,
  });
}
// WHERE THEY STAND, by a rule of each tent's own foot and door and of the lanes' edges, the same for every tent and
// lane: beside a door (to one side of it, six times in ten) and at one place for every 46 m of a tent's wall, a
// metre or so out from the canvas; and along a lane every 30 to 46 m, on alternate sides, a metre beyond its grit.
// What stands at a place is drawn for it. Nothing stands with any part within THING_KEEP metres of the route's line,
// in the fire's courtyard or within 3 m of its rim, on the clock's round, at the gate or the wicket, under the candle
// tree, on a lane, against another tent, at a lantern stake or within 2.2 m of another group.
const THING_KEEP = 3.2;
// every piece of every lane's line, kept in the cells of a grid it could matter to (those within 9 m of it): how far a
// place lies from the nearest lane's edge and from the nearest lane's middle (9 m and more given as 9)
function wayGrid(ways) {
  const CELL = 12, cells = new Map(), key = (cx, cz) => (cx + 512) * 1024 + cz + 512;
  for (const { pts, w } of ways) for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i];
    for (let cx = Math.floor((Math.min(a[0], b[0]) - 9) / CELL); cx <= Math.floor((Math.max(a[0], b[0]) + 9) / CELL); cx++) for (let cz = Math.floor((Math.min(a[1], b[1]) - 9) / CELL); cz <= Math.floor((Math.max(a[1], b[1]) + 9) / CELL); cz++) { const k = key(cx, cz); let l = cells.get(k); if (!l) cells.set(k, l = []); l.push(a[0], a[1], b[0], b[1], w / 2); } }
  const least = (x, z, half) => { const l = cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL))); let best = 9; if (!l) return best;
    for (let i = 0; i < l.length; i += 5) { const dx = l[i + 2] - l[i], dz = l[i + 3] - l[i + 1], t = clamp(((x - l[i]) * dx + (z - l[i + 1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(x - l[i] - dx * t, z - l[i + 1] - dz * t) - half * l[i + 4]; if (d < best) best = d; }
    return best; };
  return { edge: (x, z) => least(x, z, 1), mid: (x, z) => least(x, z, 0) };
}
// how far a place lies outside a tent's wall, in plan (under 0 within it; 4 m and more given as no less than 4)
const planOut = (T, x, z) => { const dx = x - T.x, dz = z - T.z, far = T.L + T.R + 4; if (dx > far || dx < -far || dz > far || dz < -far) return 4; const lx = dx * T.cr + dz * T.sr; return Math.hypot(lx - clamp(lx, -T.L, T.L), dz * T.cr - dx * T.sr) - T.R; };
// GROUND CLOTHS. Striped cloths of the tents' own black and white lie on the ground along the lanes the line flies on
// foot (from the walk inside the fence to the courtyard's rim, and from the rim on the way out to the garden's flap):
// one before the door of every tent whose door stands within CLOTH_REACH metres of that line (the nearest thirteen),
// laid along the wall across the doorway; one on the outside of each of the path's three sharpest bends, beside the
// grit; and one beside the path at every station, 14 m apart along the whole of both lanes on alternate sides, where
// one can lie. The table holds CLOTH_MAX: where more would come, every second PAIR of stations is left out, by the
// stations' order (a pair is one station on either hand, so the stations that stay still stand to both sides by
// turns; a cloth lies at each only where one can lie).
// A cloth beside the path has two places, each measured square to the path at its station. Its own: its near edge
// CLOTH_BESIDE metres from the lane's middle, beside the grit. If it cannot lie there by the tests below, the same
// cloth lies behind the lanterns' row if the same tests let it lie there, and nowhere if not: its near edge then
// CLOTH_BEHIND metres from the lane's middle, which is the farthest out that a lantern of the twos can stand
// (flownOff's greatest, under a line that flies no higher than STAKE_TOP) and CLOTH_STAKE metres more, the room
// every cloth keeps to a stake.
// Each is 3 to 6 m by 2 to 4 m, a little askew, its stripes 0.5 to 0.8 m broad across its length, with an iron peg
// at each corner; the ground's shader draws the cloth (its rumpled edge, a fold, a turned corner) and lights it as
// the ground under it is lit. None lies on a path's grit or fringe, in the courtyard, on the clock's round, against
// another tent's canvas, under a stake or on a rope's peg, or within CLOTH_APART metres of another cloth (the two
// rounds about their middles that hold them whole stand that far apart, so no two cloths can touch); a trunk or a
// barrel of the camp may stand on a cloth (the things stand where they stood). Nothing is asked of the eye.
const CLOTH_MAX = 16, CLOTH_REACH = 30, CLOTH_BESIDE = 4.9, CLOTH_STAKE = 0.6, CLOTH_APART = 1, CLOTH_BEHIND = flownOff(0) + CLOTH_STAKE;
function layCloths(B, grid, G) {
  const { forks, route, tents, lamps } = B, P = PLACES, rc = forks.cloths, E = route.eyes, cloths = [];
  const mA = route.metreNear(0, FIRE[1] + P.fenceR - 11, 0, 120), inCourt = (i) => Math.hypot(E[i * 3] - FIRE[0], E[i * 3 + 2] - FIRE[1]) < P.courtR;
  let iIn = mA / 2; while (iIn < route.count - 1 && !inCourt(iIn)) iIn++;
  let iOut = iIn; while (iOut < route.count - 1 && inCourt(iOut)) iOut++;
  const iFlap = route.metreNear(P.garden.flaps[0][0], P.garden.flaps[0][1], iOut * 2, iOut * 2 + 200) / 2, spans = [[mA / 2, iIn], [iOut, iFlap]];
  const fromLine = (x, z) => { let b = Infinity; for (const [i0, i1] of spans) for (let i = i0; i <= i1; i++) { const d = Math.hypot(E[i * 3] - x, E[i * 3 + 2] - z); if (d < b) b = d; } return b; };
  const pegs = B.ropes.map((r) => r.pts[r.pts.length - 1]);
  const stands = (c, own) => {
    const ca = Math.cos(c.rot), sa = Math.sin(c.rot), within = (x, z, e) => Math.abs((x - c.x) * ca + (z - c.z) * sa) < c.hl + e && Math.abs((z - c.z) * ca - (x - c.x) * sa) < c.hw + e;
    for (const [u, v] of [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c.x + u * c.hl * ca - v * c.hw * sa, z = c.z + u * c.hl * sa + v * c.hw * ca, rf = Math.hypot(x - FIRE[0], z - FIRE[1]);
      if (rf < P.courtR + 1.5 || rf > P.fenceR - 4 || Math.hypot(x - P.clock[0], z - P.clock[1]) < 13 || grid.edge(x, z) < 1.25) return false;
      if (tents.some((T) => T !== own && planOut(T, x, z) < 0.8)) return false;
    }
    return !(lamps.some((l) => within(l.x, l.z, CLOTH_STAKE)) || pegs.some((q) => within(q[0], q[2], 0.35)) || cloths.some((o) => Math.hypot(o.x - c.x, o.z - c.z) < Math.hypot(o.hl, o.hw) + Math.hypot(c.hl, c.hw) + CLOTH_APART));
  };
  // (where a cloth comes to lie: its own place, or behind the lanterns' row, or nowhere)
  const lies = (c, own) => (stands(c, own) ? c : c.behind && stands(c.behind, own) ? c.behind : null);
  // (a place: a point, the way the cloth's length lies, the way out from the wall or the path, how far out its near
  // edge lies; every place asked takes its six draws whether or not a cloth comes to lie there)
  const dealt = (x, z, ax, az, ox, oz, base, door, own, hold) => {
    const len = rc.range(3, 6), dep = rc.range(2, 4), askew = rc.range(0.08, 0.22) * (rc() < 0.5 ? 1 : -1), sw = rc.range(0.5, 0.8), key = rc(), hl = len / 2, hw = dep / 2, e = base + hw + Math.abs(Math.sin(askew)) * hl;
    const c = { x: x + ox * e, z: z + oz * e, rot: Math.atan2(az, ax) + askew, hl, hw, sw, key, door };
    if (!door) c.behind = { ...c, x: x + ox * (e - base + CLOTH_BEHIND), z: z + oz * (e - base + CLOTH_BEHIND) };
    if (hold) return c;
    const k = lies(c, own);   // (the doors' thirteen and the bends' three cannot pass the table's sixteen)
    if (!k) return false;
    cloths.push(k); return true;
  };
  const doors = [];
  for (const T of tents) { if (T.special) continue; for (const d of T.doors) { const pq = perimAt(T, d.q), w = toWorld(T, pq[0], pq[1]), o = toWorld(T, pq[0] + pq[2], pq[1] + pq[3]), far = fromLine(w[0], w[1]); if (far < CLOTH_REACH) doors.push({ T, w, ox: o[0] - w[0], oz: o[1] - w[1], far }); } }
  doors.sort((a, b) => a.far - b.far);
  for (const q of doors.slice(0, CLOTH_MAX - 3)) dealt(q.w[0], q.w[1], -q.oz, q.ox, q.ox, q.oz, 0.7, true, q.T);
  // beside the path: the path's own tangent at an eye and the way out from it to one side (sg 0: the outside of the bend there)
  const beside = (i, sg, hold) => {
    let tx = E[(i + 1) * 3] - E[(i - 1) * 3], tz = E[(i + 1) * 3 + 2] - E[(i - 1) * 3 + 2]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const inX = (E[(i - 4) * 3] + E[(i + 4) * 3]) / 2 - E[i * 3], inZ = (E[(i - 4) * 3 + 2] + E[(i + 4) * 3 + 2]) / 2 - E[i * 3 + 2], s = sg || ((-tz * inX + tx * inZ) > 0 ? -1 : 1);
    return dealt(E[i * 3], E[i * 3 + 2], tx, tz, -tz * s, tx * s, CLOTH_BESIDE, false, null, hold);
  };
  const turnAt = (i) => { const h = (j) => Math.atan2(E[(j + 1) * 3] - E[(j - 1) * 3], E[(j + 1) * 3 + 2] - E[(j - 1) * 3 + 2]), t = h(i + 4) - h(i - 4); return Math.abs(Math.atan2(Math.sin(t), Math.cos(t))); };
  const bends = [], taken = [];
  for (const [i0, i1] of spans) for (let i = i0 + 5; i <= i1 - 5; i++) bends.push([turnAt(i), i]);
  bends.sort((a, b) => b[0] - a[0]);
  for (const [, i] of bends) { if (taken.length >= 3) break; if (taken.some((j) => Math.abs(j - i) < 15)) continue; taken.push(i); beside(i, 0); }
  // THE STATIONS: every 14 m along the whole of both lanes, one side and the other by turns. Every station takes its
  // draws, and a cloth lies at each where one can lie by the tests above. The table holds CLOTH_MAX places: where the
  // doors', the bends' and the stations' cloths would together be more, every second pair of stations is left out,
  // by the stations' order (and of the pairs left every second again, while there are still too many): the pairs
  // that stay keep one station on either hand. No count stops the laying part way down a lane.
  let side = 1; const asked = [], laid = cloths.length;
  for (const [i0, i1] of spans) for (let i = i0 + 5; i <= i1 - 5; i += 7, side = -side) asked.push(beside(i, side, true));
  for (let every = 1; ; every *= 2) {
    cloths.length = laid;
    if (every > asked.length) break;
    asked.forEach((c, j) => { const k = (j >> 1) % every === 0 && lies(c, null); if (k) cloths.push(k); });
    if (cloths.length <= CLOTH_MAX) break;
  }
  // an iron peg at each corner, driven in aslant, its head leaning out from the cloth
  for (const c of cloths) { const ca = Math.cos(c.rot), sa = Math.sin(c.rot);
    for (const [u, v] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = c.x + u * c.hl * ca - v * c.hw * sa, z = c.z + u * c.hl * sa + v * c.hw * ca, lx = (u * ca - v * sa) * 0.06, lz = (u * sa + v * ca) * 0.06; thingTube(G, [[x - lx, -0.05, z - lz], [x + lx, 0.3, z + lz]], 0.03, 3, THING.black); } }
  return cloths;
}
// THE THINGS' PLACES ARE SETTLED FIRST (before the flown lanes' stakes are set in twos, which give way to them): every
// place takes its draws and is tested against the stakes that stand (those of the lanes not flown); what stands is
// kept with its draws (x, z, its round, its kind, the way out, the five draws, the wall's height, how far out) and
// built later by campThings, in the same order
async function planThings(B, map, stakes) {
  const { forks, route, tents, pause } = B, P = PLACES, rg = forks.things, grid = wayGrid(map.userData.ways), placed = [];
  const free = (x, z, rad, T, laneBy) => {
    if (route.near(x, 1.2, z, THING_KEEP + rad + 0.3) || Math.hypot(x - FIRE[0], z - FIRE[1]) < P.courtR + 3 + rad || Math.hypot(x - P.clock[0], z - P.clock[1]) < 14 + rad) return false;
    if (Math.hypot(x - P.gate[0], z - P.gate[1]) < 8 || Math.hypot(x - WICKET.at[0], z - WICKET.at[1]) < 6 || Math.hypot(x - P.tree[0], z - P.tree[1]) < 22 || Math.hypot(x - FIRE[0], z - FIRE[1]) > P.fenceR - 2 - rad) return false;
    if (grid.edge(x, z) <= laneBy + rad || tents.some((o) => o !== T && planOut(o, x, z) < 1.2 + rad)) return false;
    return !(stakes.some((l) => Math.hypot(l.x - x, l.z - z) < 1.6 + rad) || placed.some((q) => Math.hypot(q[0] - x, q[1] - z) < 2.2 + rad + q[2]));
  };
  const kindOf = (u, table) => { let a = 0; for (const [k, w] of table) { a += w; if (u < a) return k; } return table[table.length - 1][0]; };
  const atDoor = [['stack', 0.4], ['barrels', 0.3], ['buckets', 0.15], ['canvas', 0.15]], atFoot = [['stack', 0.26], ['barrels', 0.22], ['canvas', 0.16], ['ladder', 0.12], ['cart', 0.1], ['buckets', 0.14]], atLane = [['barrels', 0.35], ['stack', 0.35], ['cart', 0.3]];
  const radOf = { stack: 1.25, barrels: 1.3, canvas: 1.5, ladder: 0.9, cart: 2.1, buckets: 1.2 };
  // (every place takes its six draws whether or not anything comes to stand there)
  // (a cart stands a metre further out than the rest; a ladder's head leans on the wall, which needs 3.7 m of wall)
  const site = (table, x, z, ox, oz, T, laneBy, wall, outD) => { const u = [rg(), rg(), rg(), rg(), rg()], kind = kindOf(rg(), table), rad = radOf[kind];
    if (kind === 'ladder' && wall < 3.7) return;
    const e = kind === 'cart' ? 1.0 : 0, px = x + ox * e, pz = z + oz * e;
    if (free(px, pz, rad, T, laneBy)) placed.push([px, pz, rad, kind, ox, oz, u, wall, outD]); };
  for (const [ti, T] of tents.entries()) {
    if (T.special === 'collar') continue;
    const per = perimeterOf(T), outAt = (q, e) => { const pm = perimAt(T, ((q % per) + per) % per), w = toWorld(T, pm[0] + pm[2] * e, pm[1] + pm[3] * e); return [w[0], w[1], pm[2] * T.cr - pm[3] * T.sr, pm[2] * T.sr + pm[3] * T.cr, pm[4]]; };
    for (const d of T.doors) { const sg = rg() < 0.5 ? 1 : -1, by = d.hw + 1.3 + rg() * 0.9, keep = rg() < 0.6, o = outAt(d.q + sg * by, 1.0); if (keep) site(atDoor, o[0], o[1], o[2], o[3], T, 0.4, wallOf(T, o[4]), 1.0); else for (let i = 0; i < 6; i++) rg(); }
    const n = Math.max(1, Math.round(per / 46));
    for (let i = 0; i < n; i++) { const q = (i + rg()) * per / n, outD = 1.0 + rg() * 0.6, o = outAt(q, outD), nearDoor = T.doors.some((d) => Math.abs(((q - d.q + per * 1.5) % per) - per / 2) < d.hw + 3.4);
      if (nearDoor) for (let j = 0; j < 6; j++) rg(); else site(atFoot, o[0], o[1], o[2], o[3], T, 0.4, wallOf(T, o[4]), outD); }
    if (ti % 6 === 5) await pause();
  }
  for (const ln of map.userData.lanes) {
    const gap = rg.range(30, 46); let run = rg() * gap, side = rg() < 0.5 ? 1 : -1;
    for (let i = 1; i < ln.pts.length; i++) { const a = ln.pts[i - 1], b = ln.pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1e-6;
      for (; run <= l; run += gap, side = -side) { const t = run / l, ox = -dz / l * side, oz = dx / l * side, e = ln.w / 2 + 1.0 + 1.3; site(atLane, a[0] + dx * t + ox * e, a[1] + dz * t + oz * e, ox, oz, null, 0.6, 0, e); }
      run -= l; }
    await pause();
  }
  return { placed, grid };
}
async function campThings(B, map, glow) {
  const { forks, route, L, tents, object, pause, lamps } = B, P = PLACES, G = { p: [], n: [], c: [], i: [] }, SG = new Geo(SHADE_SPEC), grid = B.wayGrid = B.plan.grid, placed = B.plan.placed;
  const tones = [THING.black, THING.black, THING.dark, THING.dark, THING.grey, THING.grey, THING.pale], pick = (u) => tones[Math.min(tones.length - 1, Math.floor(u * tones.length))];
  const shade = (x, z, r, h) => shadowInto(SG, [x, z], r, h, L.moonDir, 0.75);
  // a group of things at a place: out (ox, oz) is the way from the wall or the lane's middle; u: five draws
  const group = (kind, x, z, ox, oz, u, wall, outD) => {
    const tx = -oz, tz = ox, rot = Math.atan2(-tz, tx) + (u[1] - 0.5) * 0.5, S = thingShapes;
    if (kind === 'stack') {
      const big = u[2] < 0.5, s0 = big ? 1.05 + u[3] * 0.3 : 0.7 + u[3] * 0.22, h0 = big ? S.trunk(G, [x, 0, z], rot, s0, pick(u[4])) : S.crate(G, [x, 0, z], rot, s0, pick(u[4]));
      const h1 = u[0] * 7 % 1 < 0.7 ? (big ? S.crate(G, [x + tx * 0.12, h0, z + tz * 0.12], rot + 0.3, 0.42 + u[2] * 0.2, pick(u[3])) : S.trunk(G, [x, h0, z], rot + 0.2, s0 * 0.86, pick(u[3]))) : 0;
      S.crate(G, [x + tx * (s0 * 0.5 + 0.55), 0, z + tz * (s0 * 0.5 + 0.55)], rot - 0.25, 0.5 + u[1] * 0.25, pick(u[2] * 3 % 1)); shade(x + tx * 0.3, z + tz * 0.3, 0.75, h0 + h1);
    } else if (kind === 'barrels') {
      const n = 1 + Math.floor(u[2] * 1.99); for (let i = 0; i < n; i++) { const e = (i - (n - 1) / 2) * 0.68, bx = x + tx * e + ox * (i % 2) * 0.12, bz = z + tz * e + oz * (i % 2) * 0.12, bs = 0.86 + ((u[3] * (i + 2)) % 1) * 0.16; S.barrel(G, [bx, 0, bz], bs, pick((u[4] + i * 0.37) % 1)); }
      S.bucket(G, [x + tx * (n * 0.34 + 0.4) + ox * 0.3, 0, z + tz * (n * 0.34 + 0.4) + oz * 0.3], 0.3, pick(u[1])); shade(x, z, 0.34 * n + 0.2, 0.95);
    } else if (kind === 'canvas') {
      const sc = 1.3 + u[2] * 0.4, n = 3 + Math.floor(u[3] * 2.99); S.canvas(G, [x, 0, z], rot, sc, n); S.coil(G, [x + tx * (sc * 0.5 + 0.5), 0, z + tz * (sc * 0.5 + 0.5)], 0.62 + u[4] * 0.2); shade(x, z, 0.7, n * 0.1 + 0.1);
    } else if (kind === 'ladder') {
      const h = Math.min(wall - 0.3, 3.3 + u[2] * 0.8); S.ladder(G, [x, 0, z], -ox, -oz, h, outD - 0.06); S.bucket(G, [x + tx * 0.55 + ox * 0.2, 0, z + tz * 0.55 + oz * 0.2], 0.3, pick(u[3])); shade(x, z, 0.3, h * 0.8);
    } else if (kind === 'cart') {
      const sg = u[2] < 0.5 ? 1 : -1; S.cart(G, [x, 0, z], tx * sg, tz * sg, pick(u[3] * 0.6)); S.crate(G, [x - tx * sg * 0.3, 0.66, z - tz * sg * 0.3], rot + 0.2, 0.5 + u[4] * 0.2, pick(u[4] * 0.7)); shade(x, z, 0.95, 1.2);
    } else {
      const n = 2 + Math.floor(u[2] * 1.99); for (let i = 0; i < n; i++) { const a = u[3] * TAU + i * 2.2, bx = x + Math.cos(a) * 0.36, bz = z + Math.sin(a) * 0.36; S.bucket(G, [bx, 0, bz], 0.28 + ((u[4] * (i + 3)) % 1) * 0.08, pick((u[1] + i * 0.41) % 1)); }
      S.coil(G, [x + tx * 0.95, 0, z + tz * 0.95], 0.6 + u[4] * 0.2); shade(x, z, 0.55, 0.32);
    }
  };
  for (const [i, q] of placed.entries()) { group(q[3], q[0], q[1], q[4], q[5], q[6], q[7], q[8]); if (i % 24 === 23) await pause(); }
  await pause();
  // THE GUY ROPES' MOON SHADOWS: a thin line on the ground from each peg to where the moon throws the rope's head, as
  // far as the first canvas it meets; none for a rope on its tent's shaded side (it lies in the tent's own shadow)
  // and none from the head of a mast
  const hl = Math.hypot(L.moonDir.x, L.moonDir.z) || 1, ux = -L.moonDir.x / hl, uz = -L.moonDir.z / hl, sl = hl / Math.max(L.moonDir.y, 0.12);
  for (const [ri, r] of B.ropes.entries()) {
    const top = r.pts[0], peg = r.pts[r.pts.length - 1], ox = peg[0] - top[0], oz = peg[2] - top[2], ol = Math.hypot(ox, oz) || 1; if (top[1] > 18 || (ox * ux + oz * uz) / ol > 0.3) continue;
    const ex = top[0] + ux * top[1] * sl - peg[0], ez = top[2] + uz * top[1] * sl - peg[2], el = Math.hypot(ex, ez) || 1; let cut = 1;
    const by = tents.filter((o) => Math.hypot(o.x - peg[0], o.z - peg[2]) < o.L + o.R + el + 1);
    for (let j = 1; j <= 8 && cut === 1; j++) { const x = peg[0] + ex * j / 8, z = peg[2] + ez * j / 8; if (by.some((o) => planOut(o, x, z) < 0.2)) cut = (j - 1) / 8; }
    if (cut * el < 1.5) continue;
    const wx = -ez / el * 0.08, wz = ex / el * 0.08, id = [[-1, 0], [1, 0], [1, cut], [-1, cut]].map(([e, t]) => SG.v({ position: [peg[0] + ex * t + wx * e, 0.06, peg[2] + ez * t + wz * e], aS: [e, 0.3, 0.5] }));
    SG.quad(id[0], id[1], id[2], id[3]);
    if (ri % 150 === 149) await pause();
  }
  await pause();
  // the ground cloths, laid once the things stand, and told to the ground's shader
  B.cloths = layCloths(B, grid, G);
  B.cloths.forEach((c, i) => { B.groundU.uClothA.value[i].set(c.x, c.z, Math.cos(c.rot), Math.sin(c.rot)); B.groundU.uClothB.value[i].set(c.hl, c.hw, c.sw, c.key); });
  await pause();
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3)); geo.setAttribute('aC', new THREE.Float32BufferAttribute(G.c, 1));
  geo.setIndex(G.i); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(FIRE[0], 0, FIRE[1]), 3000);
  const mesh = new THREE.Mesh(geo, thingMaterial(L, map, glow)); mesh.frustumCulled = false; object.add(mesh);
  const shadeMesh = new THREE.Mesh(SG.build(), shadowMaterial(L)); shadeMesh.frustumCulled = false; shadeMesh.renderOrder = 1; object.add(shadeMesh);
  B.things = { placed, mesh, shade: shadeMesh };
  await pause();
}
// LONG GRASS IN DRIFTS. The ground's shader lays long grass in drifts where no one walks (its own slow noise, said
// again here); near the route's line, wherever the line goes lower than 14 m, the drifts have bodies: clumps of tall
// tufts with seed heads that bend in the gusts. A clump is tried at places drawn about the line (4 to 40 m from it,
// thicker nearer) and stands where the drift is, off every path and its fringe and 4.8 m and more from a lane's
// middle, outside every canvas, clear of the camp's things and of the ground cloths, and its middle 4.4 m and more
// from the line; in the meadow it
// keeps off the footpaths as the meadow's own tufts do.
const fbm2 = (x, y) => 0.5 * noise2(x, y) + 0.25 * noise2(x * 2.03 + 7.1, y * 2.03 + 7.1) + 0.125 * noise2(x * 4.1 + 3.3, y * 4.1 + 3.3) + 0.0625 * noise2(x * 8.3 + 1.7, y * 8.3 + 1.7);
const driftAt = (x, z) => smoothstep(0.4, 0.62, fbm2(x * 0.07 + 5, z * 0.07 + 5));
async function driftGrass(B, map, gu) {
  const { forks, route, L, tents, object, pause, detail } = B, P = PLACES, rg = forks.drifts, E = route.eyes, low = [], N = Math.round(2000 * (detail ?? 1));
  for (let i = 0; i < route.count; i++) if (E[i * 3 + 1] < 14) low.push(i);
  const grid = B.wayGrid;
  // (no clump stands on a ground cloth or within half a metre of its edge)
  const onCloth = (x, z) => B.cloths.some((c) => { const ca = Math.cos(c.rot), sa = Math.sin(c.rot); return Math.abs((x - c.x) * ca + (z - c.z) * sa) < c.hl + 0.9 && Math.abs((z - c.z) * ca - (x - c.x) * sa) < c.hw + 0.9; });
  const aO = new Float32Array(N * 4); let n = 0;
  for (let t = 0; n < N && t < N * 5; t++) {
    const i = low[Math.floor(rg() * low.length)], a = rg() * TAU, d = 4 + 36 * rg() * rg(), x = E[i * 3] + Math.cos(a) * d, z = E[i * 3 + 2] + Math.sin(a) * d, k = 3 + Math.floor(rg() * 3), ph = rg() * TAU, r = Math.hypot(x - FIRE[0], z - FIRE[1]);
    if (t % 150 === 149) await pause();
    // (the tests that cost least come first)
    if (Math.abs(r - P.fenceR) < 1.5 || route.near(x, 0.9, z, 4.4)) continue;
    if (r < P.fenceR && (r < P.courtR + 2.5 || Math.hypot(x - P.clock[0], z - P.clock[1]) < 14 || grid.edge(x, z) < 1.3 || grid.mid(x, z) < 4.8 || tents.some((o) => planOut(o, x, z) < 1.0))) continue;
    if (driftAt(x, z) < 0.5 || (r > P.fenceR ? footOff(x, z) < 1.6 : B.things.placed.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + 0.9) || onCloth(x, z))) continue;
    for (let j = 0; j < k && n < N; j++, n++) { const b = ph + j * 2.4, e = 0.25 + 0.2 * j; aO.set([x + Math.cos(b) * e, z + Math.sin(b) * e, 0.62 + ((ph * (j + 2)) % 1) * 0.5, (ph * (j + 1) * 0.37) % 1], n * 4); }
  }
  const mesh = await grassMesh(L, null, 0, pause, gu, { aO, n }, map); object.add(mesh); B.drifts = mesh;
  await pause();
}
// the small lights: scattered by a seeded draw over the whole cloth of every tent, walls and roofs alike, uneven (thick
// in patches, thin between); a few on the tallest tent's twin masts; a string across a lane between one pair of
// neighbouring tops in six. None within 8 m of the route's line.
async function heroLights(B) {
  const { forks, route, L, tents, object, pause, dens, detail } = B, rl = forks.lights, rs = forks.strings, rm = forks.mastLights, list = [], S = PLACES.steps;
  // the cloth of every tent in square metres: its wall, and its roof by its rows' shares of the radius
  const meas = tents.map((T) => { const pr = T.prof; let mf = 0; for (let i = 1; i < pr.length; i++) mf += (pr[i][0] + pr[i - 1][0]) / 2 * (pr[i][1] - pr[i - 1][1]); return { wall: T.per * (wallOf(T, -T.L) + wallOf(T, T.L)) / 2, roof: T.per * T.slope * mf, mf }; });
  const area = meas.reduce((a, m) => a + m.wall + m.roof, 0), perM2 = 8300 * Math.min(1.3, dens) * detail / area / 0.61;
  const hash = (i, j, k) => { const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); };
  // patches: a smooth value over the cloth, some 7 m across
  const clump = (T, s, hh) => { const u = s * T.sw / 7, v = hh * 3.1, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv); return lerp(lerp(hash(i, j, T.phase), hash(i + 1, j, T.phase), su), lerp(hash(i, j + 1, T.phase), hash(i + 1, j + 1, T.phase), su), sv); };
  for (const [ti, T] of tents.entries()) {
    const m = meas[ti], n = Math.round((m.wall + m.roof) * perM2), wallShare = m.wall / (m.wall + m.roof), pr = T.prof, cols = new Map();
    // (only a tent that stands near the line at all has its lights asked one by one)
    const close = route.near(T.x, T.peak / 2, T.z, Math.hypot(T.L + T.R + 3, T.peak / 2 + 6) + 8.5);
    for (let i = 0; i < n; i++) {
      const u1 = rl(), u2 = rl(), u3 = rl(), u4 = rl(), ph = rl() * 100, s = u2 * T.n;
      let hh = 0.07 + 0.9 * u3;
      if (u1 >= wallShare) {
        // up the roof by its area
        let acc = 0, g = 0.5; const want = u3 * m.mf;
        for (let r = 1; r < pr.length; r++) { const w = (pr[r][0] + pr[r - 1][0]) / 2 * (pr[r][1] - pr[r - 1][1]); if (acc + w >= want) { g = lerp(pr[r - 1][1], pr[r][1], (want - acc) / Math.max(w, 1e-9)); break; } acc += w; }
        hh = 1 + clamp(g, 0.02, 0.94);
      }
      if (i % 100 === 99) await pause(9);
      if (u4 > 0.22 + 0.78 * clump(T, s, hh)) continue;
      const c = clothAt(T, s, hh, cols), p = [c.p[0] + c.n[0] * 0.12, c.p[1] + c.n[1] * 0.12, c.p[2] + c.n[2] * 0.12];
      if (hh <= 1 && T.doors.some((d) => Math.abs(((c.q - d.q + T.per * 1.5) % T.per) - T.per / 2) < d.hw + 0.4 && p[1] < d.h + 0.4)) continue;
      if (T.special === 'steps' && Math.hypot(p[0] - B.crown.x, p[1] - B.crown.y, p[2] - B.crown.z) < S.crownR + 0.8) continue;
      if (close && route.near(p[0], p[1], p[2], 8.3)) continue;
      list.push({ p, cloth: c.p, n: c.n, t: c.t, perM: c.perM, belly: c.belly, gph: T.gust ?? T.phase, ph, nap: T.nap, s });
    }
    await pause(3);
  }
  B.clothLights = list.length;
  // a tent the line goes through wears its own string of small lights: one along the wall just under the scalloped
  // edge of the eave and one high on the roof along its ridge (round its hoop, where it has one), a light every
  // three quarters of a stripe, each with its pool on the cloth; and the hoop of the tallest tent's crown carries
  // lights round its iron. None within 8.3 m of the route's line.
  const rg = forks.eaves;
  for (const T of [B.lay.garden, B.lay.steps, B.lay.collar]) {
    const cols = new Map();
    for (const hh of [0.95, 1.9]) for (let s = 0.375; s < T.n; s += 0.75) {
      const ph = rg() * 100, c = clothAt(T, s, hh, cols), p = [c.p[0] + c.n[0] * 0.14, c.p[1] + c.n[1] * 0.14, c.p[2] + c.n[2] * 0.14];
      if (T.special === 'steps' && Math.hypot(p[0] - B.crown.x, p[1] - B.crown.y, p[2] - B.crown.z) < S.crownR + 0.8) continue;
      if (route.near(p[0], p[1], p[2], 8.3)) continue;
      list.push({ p, cloth: c.p, n: c.n, t: c.t, perM: c.perM, belly: c.belly, gph: T.gust ?? T.phase, ph, nap: T.nap, s, size: 0.42 });
    }
    // (a room's eave string has its twin on the inside of the same cloth, light for light)
    if (T.poleLights) for (let s = 0.375; s < T.n; s += 0.75) {
      const ph = rg() * 100, c = clothAt(T, s, 0.95, cols), p = [c.p[0] - c.n[0] * 0.2, c.p[1] - c.n[1] * 0.2, c.p[2] - c.n[2] * 0.2];
      if (!route.near(p[0], p[1], p[2], 8.3)) list.push({ p, ph, size: 0.34 });
    }
    await pause(6);
  }
  // the lights up the poles of the two rooms: on the inside of the cloth at every rib, one every few metres (the
  // garden's 2.8, the cloud steps' 3.5) from 2.4 m up to a metre and a half under the eave, none in a door's opening,
  // and on under the roof up the same ribs at every half of that in height; none within 8.3 m of the route's line;
  // the cloth's shader lays each one's pool at the same places
  const rp = forks.poles;
  for (const T of [B.lay.garden, B.lay.steps]) {
    const cols = new Map();
    for (let k = 0; k * T.sp < T.n - 0.5; k++) {
      const s = k * T.sp, top = clothAt(T, s, 1, cols), wallH = top.p[1];
      for (let yk = 2.4; yk <= wallH - 1.5; yk += T.poleLights) {
        const ph = rp() * 100, c = clothAt(T, s, yk / wallH, cols), p = [c.p[0] - c.n[0] * 0.22, yk, c.p[2] - c.n[2] * 0.22];
        if (T.doors.some((d) => Math.abs(((c.q - d.q + T.per * 1.5) % T.per) - T.per / 2) < d.hw + 0.5 && yk < d.h + 0.5) || route.near(p[0], p[1], p[2], 8.3)) continue;
        list.push({ p, ph, size: 0.34 });
      }
      // (and on under the roof, up the same rib: one at every half spacing of height from the eave to the ridge)
      const dy = T.poleLights / 2; let prev = top;
      for (let j = 1; j <= 32; j++) {
        const c = clothAt(T, s, 1 + 0.94 * j / 32, cols), y0 = prev.p[1], y1 = c.p[1];
        if (y1 > y0) for (let yk = 2.4 + dy * Math.ceil((y0 - 2.4) / dy); yk < y1; yk += dy) {
          const f = (yk - y0) / (y1 - y0), ph = rp() * 100, p = [lerp(prev.p[0], c.p[0], f) - c.n[0] * 0.22, yk - c.n[1] * 0.22, lerp(prev.p[2], c.p[2], f) - c.n[2] * 0.22];
          if ((T.special === 'steps' && Math.hypot(p[0] - B.crown.x, p[1] - B.crown.y, p[2] - B.crown.z) < S.crownR + 0.8) || route.near(p[0], p[1], p[2], 8.3)) continue;
          list.push({ p, ph, size: 0.3 });
        }
        prev = c;
      }
    }
    await pause(6);
  }
  // (the hoop's lights: 48 round it at even angles, each on the hem at its own place, on the hem's side toward the
  // middle of the opening, where neither the hem nor the cloth stands before it from within the tent or from above it)
  { const n = 48, c = B.crown, off = HOOP_BAR + 0.14;
    for (let k = 0; k < n; k++) { const e = B.hoop.at(k / n * TAU), d = [c.x - e[0], c.y - e[1], c.z - e[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, p = [e[0] + d[0] / l * off, e[1] + d[1] / l * off, e[2] + d[2] / l * off], ph = rg() * 100; if (!route.near(p[0], p[1], p[2], 8.3)) list.push({ p, ph, size: 0.42 }); } }
  // a few on each of the tallest tent's twin masts
  for (const top of B.mastTops) for (let k = 0; k < 9; k++) { const a = rm() * TAU, p = [top[0] + Math.cos(a) * 0.5, lerp(24, S.mast - 2, (k + rm()) / 9), top[2] + Math.sin(a) * 0.5], ph = rm() * 100; if (!route.near(p[0], p[1], p[2], 8)) list.push({ p, ph, loose: 0.3 }); }
  // a string across a lane: from one tent's top to a neighbour's, hanging in a curve, only where it stays above 14 m
  const tall = tents.filter((T) => !T.special && T.ring !== 3 && T.peak >= 17);
  const hang = (A, Bp, sagK) => {
    const d = Math.hypot(A[0] - Bp[0], A[1] - Bp[1], A[2] - Bp[2]), n = Math.round(d / 1.55), pts = [];
    for (let k = 1; k < n; k++) { const t = k / n, y = lerp(A[1], Bp[1], t) - d * sagK * 4 * t * (1 - t); pts.push([lerp(A[0], Bp[0], t), y, lerp(A[2], Bp[2], t)]); }
    if (pts.some((q) => q[1] < 14 || route.near(q[0], q[1], q[2], 8) || tents.some((T) => Math.hypot(T.x - q[0], T.z - q[2]) < T.L + T.R + 1 && outsideBy(T, q[0], q[1], q[2]) < 0.7))) return;
    for (const q of pts) list.push({ p: q, ph: rs() * 100, loose: 1.5 });
  };
  for (let i = 0; i < tall.length; i++) {
    const A = tall[i];
    for (let j = i + 1; j < tall.length; j++) {
      const Bt = tall[j], d = Math.hypot(A.x - Bt.x, A.z - Bt.z); if (d < 26 || d > 62) continue;
      const pick = rs.chance(1 / 6), sagK = rs.range(0.07, 0.12), ta = tentTops(A)[0], tb = tentTops(Bt)[0];
      if (pick && !A.strung && !Bt.strung) { A.strung = Bt.strung = true; hang([ta[0], ta[1] + 0.5, ta[2]], [tb[0], tb[1] + 0.5, tb[2]], sagK); }
    }
    if (i % 8 === 7) await pause();
  }
  // the lanterns at the heads of the stakes along the lanes: a clear bright point, two and a half times a small
  // light's brightness, its whole dab 0.8 m across (twice the width of the lantern's cap) and its halo within that
  for (const l of B.lamps) list.push({ p: [l.x, l.h + 0.02, l.z], ph: l.ph, size: 0.4, bright: 1.5 });
  B.lightCount = list.length;
  object.add(lightsMesh(L, list)); await pause(); object.add(poolMesh(L, list.filter((l) => l.cloth)));
  await pause();
}

// ---------------------------------------------------------------- the hero: the whole place by night
export async function buildHero(ctx, opts = {}) {
  // every stream of draws, in one list, before any loop runs
  const forks = { tents: stream(ctx, 'tents'), gusts: stream(ctx, 'gusts in the three fixed tents'), naps: stream(ctx, 'napping tents'), map: stream(ctx, 'ground map'), ropes: stream(ctx, 'ropes and pennants'), lights: stream(ctx, 'small lights'),
    mastLights: stream(ctx, 'lights on the masts'), room: stream(ctx, 'snow in the snow room'), strings: stream(ctx, 'strings across the lanes'), fence: stream(ctx, 'fence'), fire: stream(ctx, 'white fire'), sparks: stream(ctx, 'fire sparks'), smoke: stream(ctx, 'fire smoke'), lamps: stream(ctx, 'lantern stakes'), lampsFlown: stream(ctx, 'lantern stakes in twos along the flown paths'), eaves: stream(ctx, 'strings of the flown tents'), poles: stream(ctx, 'lights up the poles'), patches: stream(ctx, 'light patches of the three fixed tents'), things: stream(ctx, 'things of the camp'), cloths: stream(ctx, 'ground cloths'), drifts: stream(ctx, 'long grass in drifts') };
  const vary = opts.vary || ctx.vary || { density: 1, mood: 0.5 }, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
  const route = opts.route || layRoute(), L = opts.light || makeLight({}), P = PLACES, S = P.steps, E = route.eyes;
  // (a pause is asked for after work of a known size: small pieces of work are counted up until they come to one
  // step's worth, and only then is the frame handed back; a pause asked without a size always hands it back)
  const object = new THREE.Group(), pause = metered(ctx), parts = [];
  const lay = await layTents(route, forks.tents, vary, pause), tents = lay.tents;
  lay.steps.slope = 23; lay.collar.slope = 12.8;
  // where the gusts stand in the cloth of the three tents the plan fixes when the world clock starts, on a stream of
  // their own (every dealt tent's is drawn with the tent)
  for (const T of [lay.garden, lay.steps, lay.collar]) T.gust = forks.gusts() * TAU;
  // and the key by which their small lights lie in patches (a dealt tent's is drawn with the tent), on a stream of its own
  for (const T of [lay.garden, lay.steps, lay.collar]) T.phase = forks.patches() * TAU;
  // the lane in: from the fence line to the courtyard's rim; the lane on: from the gap at bearing 200 to the garden's flap
  let mRim = 0; for (let i = 0; i < route.count; i++) if (Math.hypot(E[i * 3] - FIRE[0], E[i * 3 + 2] - FIRE[1]) < P.courtR) { mRim = i * 2; break; }
  const mFence = route.metreNear(0, FIRE[1] + P.fenceR, 0, 120), gap2 = at(P.rings[0], P.gaps[2]);
  const mGap2 = route.metreNear(gap2[0], gap2[1], mRim, 500), mFlapA = route.metreNear(P.garden.flaps[0][0], P.garden.flaps[0][1], mRim, 500);
  // how near a tent's wall stands to a stretch of the route (in plan), and at which metre
  const beside = (T, m0, m1) => { let b = Infinity, bm = 0; for (let i = Math.floor(m0 / 2); i <= Math.ceil(m1 / 2); i++) { const d = Math.hypot(E[i * 3] - T.x, E[i * 3 + 2] - T.z) - T.R - T.L; if (d < b) { b = d; bm = i * 2; } } return [b, bm]; };
  // the tents' naps, a habit of the place on the world clock: one draw over all the tents of the rings and the small
  // ones alike gives each its turn in an order, a period of 50 to 90 s and a place in the round of phases; the first
  // of that order nap (one tent in eight; in the early hour one in three), their phases spread evenly round the period
  const early = opts.early ?? (vary.hour === 'golden' || vary.hour === 'day'), ringed = tents.filter((T) => T.special !== 'collar'), order = ringed.map((_, i) => i);
  forks.naps.shuffle(order);
  const nNap = Math.max(1, Math.round(ringed.length / (early ? 3 : 8)));
  order.forEach((ti, k) => { const period = forks.naps.range(50, 90), jit = forks.naps(); ringed[ti].nap = k < nNap ? [period, (k + jit) / nNap] : [0, 0]; });
  lay.collar.nap = [0, 0];
  // two open flaps beside the way: snow blows out of the tent nearest the lane in (a tent of the rings: it is a room one
  // sees into), feathers out of the tent nearest the lane on
  const openDoor = (m0, m1, room) => {
    let best = null; for (const T of tents) { if (T.special || (room && T.ring === 3)) continue; const n = beside(T, m0, m1); if (!best || n[0] < best.n[0]) best = { T, n }; }
    // (the room's flap stands open up the lane, toward the line as it stands 36 m before the tent; the other faces the line abeam)
    const T = best.T, i = Math.max(0, best.n[1] / 2 - (room ? 18 : 0)), dx = E[i * 3] - T.x, dz = E[i * 3 + 2] - T.z, l = Math.hypot(dx, dz) || 1;
    T.doors.length = 0;
    if (room) { T.interior = 0.9; lay.D.doorToward(T, dx / l, dz / l, 3.3, Math.min(5, T.wall - 0.3), 2); } else lay.D.doorToward(T, dx / l, dz / l, 2.3, 4.2, 1);
    const pq = perimAt(T, T.doors[0].q), w = toWorld(T, pq[0], pq[1]), o = toWorld(T, pq[2], pq[3]);
    return { at: new THREE.Vector3(w[0], 1.9, w[1]), out: new THREE.Vector3(o[0] - T.x, 0, o[1] - T.z).normalize(), tent: T };
  };
  const snowDoor = openDoor(mFence + 40, mRim, true), featherDoor = openDoor(mGap2, mFlapA, false);
  await pause();
  // the canvas of every tent in one mesh
  const G = new Pieces(TENT_SPEC);
  for (const T of tents) { const cloth = tentInto(T); await pause(6); await shadeInto(T, cloth, tents, L.moonDir, pause); T.v0 = G.add(cloth); T.v1 = G.n; await pause(1); }
  const ax = head(S.heading), crown = new THREE.Vector4(S.flap[0] + ax[0] * S.crownAlong, S.crownY, S.flap[1] + ax[1] * S.crownAlong, S.crownR);
  // the crown's cut edge (the line the hoop's bar lies along, kept for the lights that sit on it) and its hem
  const rise = Math.atan2(S.wall1 - S.wall0, S.len), hoop = cutEdge(lay.steps, crown, [ax[1], 0, -ax[0]], [ax[0] * Math.cos(rise), Math.sin(rise), ax[1] * Math.cos(rise)]);
  G.add(hemInto(lay.steps, hoop));
  const canvas = new THREE.Mesh(await G.buildIn(pause), tentMaterial(L, crown)); canvas.frustumCulled = false; object.add(canvas);
  object.add(snowRoom(L, snowDoor, forks.room, detail));
  await pause();
  // the ground
  const map = await bakeGroundMap(tents, route, L.moonDir, forks.map, pause);
  const lamps = layLamps(map.userData.lanes, route, tents, forks.lamps), plan = await planThings({ forks, route, tents, pause }, map, lamps);
  lamps.twos(forks.lampsFlown, plan.placed); map.userData.wearStakes(lamps);
  await pause();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(2400, 64).rotateX(-Math.PI / 2).translate(FIRE[0], 0, FIRE[1]), groundMaterial(L, map, tents, lamps)); ground.frustumCulled = false; ground.name = 'ground'; object.add(ground);
  await pause();
  const built = { ctx, opts, forks, vary, detail, dens, route, L, lay, tents, object, parts, crown, pause, lamps, plan, hoop, groundU: ground.material.uniforms };
  await heroIron(built); await heroLights(built); await campThings(built, map, ground.material.uniforms.tGlow); await driftGrass(built, map, ground.material.uniforms);
  object.add(fenceMesh(L, ground.material.uniforms.tGlow));
  await pause();
  const fire = await buildWhiteFire(ctx, L, { rng: forks.fire, sparks: forks.sparks, smoke: forks.smoke, detail }); object.add(fire.object); parts.push(fire);
  const hero = {
    object, radius: 150, height: 60, center: new THREE.Vector3(FIRE[0], 14, FIRE[1]), ground: false,
    // (the ground is level: the meadow, the trodden grass and the paths all lie at height 0)
    heightAt: () => 0,
    route, light: L, tents, lay, forks, canvas, ground, parts, lamps, things: built.things, cloths: built.cloths, drifts: built.drifts, snowDoor, featherDoor, fire, metres: { fence: mFence, rim: mRim, gap2: mGap2, flapA: mFlapA },
    anchors: {
      fire: new THREE.Vector3(FIRE[0], 9, FIRE[1]), clock: new THREE.Vector3(P.clock[0], 6, P.clock[1]),
      gardenOfIceFlaps: P.garden.flaps.map((f) => new THREE.Vector3(f[0], 4, f[1])), cloudStepsFlap: new THREE.Vector3(S.flap[0], 5, S.flap[1]),
      cloudStepsCrown: new THREE.Vector3(crown.x, crown.y, crown.z), candleTree: new THREE.Vector3(P.tree[0], 0, P.tree[1]), portalSeat: new THREE.Vector3(P.tree[0], P.ringY, P.tree[1]),
    },
    update(dt, time, camera) { if (!opts.light) L.update(time); for (const p of parts) p.update?.(dt, time, camera); },
    dispose() {},
  };
  return hero;
}

// ---------------------------------------------------------------- the white fire
// Our own ironwork: a low round hearth 9 m across and 1.5 m high; from its rim sixteen flat staves 8 m tall, straight,
// tapering, leaning outward 12 degrees, bound by two plain hoops at 3 and 6 m. White flame stands inside and above.
function slabInto(G, a, b, tan, rad, w0, w1, th, extra) {
  // a flat tapering bar from a to b: width along tan, thickness along rad
  const c = (p, w, st, sr) => [p[0] + tan[0] * w * st + rad[0] * th * sr, p[1] + tan[1] * w * st + rad[1] * th * sr, p[2] + tan[2] * w * st + rad[2] * th * sr];
  const face = (p0, p1, p2, p3, n) => { const i = [p0, p1, p2, p3].map((p) => G.v({ position: p, normal: n, ...extra })); G.quad(i[0], i[1], i[2], i[3]); };
  const neg = (v) => [-v[0], -v[1], -v[2]];
  face(c(a, w0, -1, 1), c(a, w0, 1, 1), c(b, w1, 1, 1), c(b, w1, -1, 1), rad); face(c(a, w0, 1, -1), c(a, w0, -1, -1), c(b, w1, -1, -1), c(b, w1, 1, -1), neg(rad));
  face(c(a, w0, 1, 1), c(a, w0, 1, -1), c(b, w1, 1, -1), c(b, w1, 1, 1), tan); face(c(a, w0, -1, -1), c(a, w0, -1, 1), c(b, w1, -1, 1), c(b, w1, -1, -1), neg(tan));
}
export async function buildWhiteFire(ctx, L, o = {}) {
  const rng = o.rng || stream(ctx, 'white fire'), detail = o.detail ?? 1, object = new THREE.Group(), F = [FIRE[0], 0, FIRE[1]], time = { value: 0 };
  const I = new Geo(IRON_SPEC), iron = { aC: 1 }, lean = 12 * RAD, R0 = 4.5, H = 8;
  // hearth: an outer wall, a rim, an inner wall down into the dark
  const prof = [[R0 + 0.15, 0], [R0 + 0.15, 1.5], [R0 - 0.45, 1.5], [R0 - 0.45, 0.5]], nA = 48, rows = [];
  for (let k = 0; k <= nA; k++) { const a = k / nA * TAU, cs = Math.sin(a), sn = Math.cos(a), row = []; prof.forEach((q, j) => { const nr = j < 2 ? [cs, 0, sn] : j === 2 ? [0, 1, 0] : [-cs, 0, -sn]; row.push(G_v(I, [F[0] + cs * q[0], q[1], F[2] + sn * q[0]], nr, iron)); }); rows.push(row); }
  for (let k = 0; k < nA; k++) for (let j = 0; j < prof.length - 1; j++) I.quad(rows[k][j], rows[k + 1][j], rows[k + 1][j + 1], rows[k][j + 1]);
  for (let k = 0; k < 16; k++) {
    const a = (k + 0.5) / 16 * TAU, cs = Math.sin(a), sn = Math.cos(a), rad = [cs * Math.cos(lean), -Math.sin(lean), sn * Math.cos(lean)], tan = [sn, 0, -cs];
    const foot = [F[0] + cs * (R0 - 0.1), 1.45, F[2] + sn * (R0 - 0.1)], tip = [foot[0] + cs * Math.sin(lean) * H, foot[1] + Math.cos(lean) * H, foot[2] + sn * Math.sin(lean) * H];
    slabInto(I, foot, tip, tan, rad, 0.27, 0.1, 0.045, iron);
  }
  for (const h of [3, 6]) { const r = R0 - 0.1 + Math.tan(lean) * (h - 1.45) + 0.07, pts = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * TAU; pts.push([F[0] + Math.sin(a) * r, h, F[2] + Math.cos(a) * r]); } tubeInto(I, pts, pts.map(() => 0.085), 5, () => iron); }
  const ironMesh = new THREE.Mesh(I.build(), ironMaterial(L)); ironMesh.frustumCulled = false; object.add(ironMesh);
  await ctx.yield();
  // flames: eight to twelve separate tongues about a white-hot bed low in the hearth; each a sheet that turns about its
  // own upright line to face the eye, with a grey see-through body, a bright edge and a tip that tears away and climbs
  const nF = 8 + Math.floor(rng() * 5), fg = new THREE.InstancedBufferGeometry(), fp = [], fi = [], SY = 12;
  for (let j = 0; j <= SY; j++) for (const x of [-1, 0, 1]) fp.push(x, j / SY, 0);
  for (let j = 0; j < SY; j++) for (let i = 0; i < 2; i++) { const a = j * 3 + i; fi.push(a, a + 1, a + 4, a, a + 4, a + 3); }
  fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setIndex(fi);
  const iP = new Float32Array(nF * 4), iD = new Float32Array(nF * 4), a0 = rng() * TAU, tips = [];
  for (let i = 0; i < nF; i++) {
    const mid = i < 2, a = a0 + (i + rng.range(-0.3, 0.3)) / nF * TAU, r = mid ? rng.range(0, 0.7) : rng.range(1.5, 2.9), tall = mid ? rng.range(11.5, 13.5) : rng.range(6.5, 10.5);
    const wide = mid ? rng.range(1.5, 1.9) : rng.range(1.0, 1.5);
    iP.set([F[0] + Math.sin(a) * r, 0.9, F[2] + Math.cos(a) * r, mid ? 0 : a], i * 4);
    iD.set([wide, tall, rng() * 10, rng.range(0.6, 1.3)], i * 4);
    tips.push([Math.sin(a) * r, 0.9 + tall * 0.8, Math.cos(a) * r]);
  }
  fg.setAttribute('iPos', new THREE.InstancedBufferAttribute(iP, 4)); fg.setAttribute('iDat', new THREE.InstancedBufferAttribute(iD, 4)); fg.instanceCount = nF;
  const flameMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { ...L.uniforms, uGain: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec4 iPos; attribute vec4 iDat; varying vec2 vUv; varying float vSeed;
      ${LIGHT_GLSL}
      void main() {
        vec3 toEye = cameraPosition - iPos.xyz; toEye.y = 0.; float l = length(toEye); toEye = l > 1e-3 ? toEye / l : vec3(0., 0., 1.);
        vec3 right = vec3(toEye.z, 0., -toEye.x); float y = position.y;
        vec3 p = iPos.xyz + right * position.x * iDat.x * 1.6 + vec3(0., y * iDat.y, 0.);
        // tongues part from one another as they rise, lean down the wind and bow to its gusts
        float part = step(.001, iPos.w);
        p.xz += vec2(sin(iPos.w), cos(iPos.w)) * part * y * y * 1.5;
        p.xz += uWind.xy * y * y * iDat.w * (.5 + 2.4 * uWind.z) * (.6 + .8 * nfGust(iPos.xz, iDat.z));
        p += right * sin(uTime * 1.1 + iDat.z) * .3 * y;
        vUv = vec2(position.x * 1.6, y); vSeed = iDat.z;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vSeed; uniform float uGain;
      ${LIGHT_GLSL}
      void main() {
        float x = vUv.x, y = vUv.y, t = uTime, s = vSeed;
        // the tongue's middle line wavers more toward its tip; its edge ripples upward
        float mid = (nfNoise(vec2(y * 2.4 - t * 1.1 + s * 5., s)) - .5) * 1.5 * y;
        float rip = nfNoise(vec2(y * 6. - t * 2.6 + s * 3., s * 7.3)) - .5;
        float body = .78, taper = pow(clamp(1. - y / body, 0., 1.), .65);
        float w = (.3 + .7 * smoothstep(0., .14, y)) * taper * (.8 + .7 * rip);
        float d = abs(x - mid) / max(w, .03);
        float inside = (1. - smoothstep(.9, 1., d)) * step(y, body);
        float rim = smoothstep(.45, .9, d) * inside;
        // the tip tears: shreds of it break away and climb, thinning as they go
        float tear = nfFbm(vec2(x * 2.6 + s * 9., y * 5.5 - t * 3.1));
        float high = smoothstep(.5, 1., y), shred = smoothstep(.42 + .3 * high, .52 + .3 * high, tear);
        float lane = 1. - smoothstep(.12, .5, abs(x - mid));
        float torn = shred * lane * smoothstep(.52, .7, y) * (1. - smoothstep(.8, 1., y));
        float hollow = .55 + .45 * nfNoise(vec2(x * 3. + s, y * 7. - t * 2.));
        float low = (1. - smoothstep(0., .2, y)) * (1. - clamp(d, 0., 1.));
        float keep = mix(1., shred, smoothstep(.45, body, y));
        vec3 col = vec3(.5, .56, .68) * .17 * hollow * inside * keep + vec3(1., 1., 1.03) * (rim * 1. * keep + torn * .75 + low * .7);
        gl_FragColor = vec4(col * uGain * smoothstep(0., .03, y), 1.);
      }`,
  });
  const flames = new THREE.Mesh(fg, flameMat); flames.frustumCulled = false; flames.renderOrder = 2; object.add(flames);
  // the bed of the fire: white-hot in the hearth's well, seen from above and between the staves' feet
  const bed = new THREE.Mesh(new THREE.CircleGeometry(R0 - 0.45, 28), new THREE.ShaderMaterial({ uniforms: L.uniforms,
    vertexShader: /* glsl */`varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      varying vec2 vP;
      ${LIGHT_GLSL}
      void main() { float r = length(vP) / ${(R0 - 0.45).toFixed(2)}, n = nfFbm(vP * 1.3 + vec2(0., uTime * .25)); gl_FragColor = vec4(vec3(.95, .97, 1.) * (.25 + 1.5 * (1. - smoothstep(.15, 1., r + (n - .5) * .5))), 1.); }`,
  }));
  bed.rotation.x = -Math.PI / 2; bed.position.set(F[0], 1.05, F[2]); object.add(bed);
  await ctx.yield();
  const sparks = sparkMesh(L, o.sparks || stream(ctx, 'fire sparks'), Math.round(2600 * detail), F, tips); object.add(sparks);
  const wd = L.windDir, wk = 1.2 + 5 * L.wind;
  const smoke = fx.makeSmokeColumn({ rng: o.smoke || stream(ctx, 'fire smoke'), time, position: [F[0], 12, F[2]], height: 30, radius: [2, 8], size: [5, 13], count: 26, color: '#7d8491', colorTop: '#8f96a2', shadowColor: '#3b3f46', ambient: '#20242b',
    hot: '#e4e9f4', hotFalloff: 12, opacity: 0.1, rate: 0.05, wind: [wd[0] * wk, 0, wd[1] * wk], bend: 0.5 + 0.5 * L.wind, sunDir: [L.moonDir.x, L.moonDir.y, L.moonDir.z], sunColor: '#dfe6f2', rim: 0.2 });
  object.add(smoke.object);
  return { object, update(dt, t, camera) { time.value = t; smoke.update(dt, t, camera); } };
}
const G_v = (G, p, n, ex) => G.v({ position: p, normal: n, ...ex });
// white sparks streaming up from the tongues' tips to 90 m over the fire, each some tenths of a metre across; they lean
// down the wind as they rise, and one in five is caught by it and carried off low over the roofs
function sparkMesh(L, rng, n, F, tips) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const tip = tips[Math.floor(rng() * tips.length)];
    iA.set([rng(), 1 / rng.range(7, 14), rng.range(0.1, 1.5), rng() * TAU], i * 4); iB.set([rng.range(0.12, 0.3), rng(), rng() < 0.2 ? rng.range(0.5, 1) : 0, rng()], i * 4);
    iC.set(tip, i * 3);
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 3)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...L.uniforms, uBase: { value: new THREE.Vector3(F[0], 0, F[2]) } },
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; attribute vec3 iC; varying vec2 vC; varying float vI; uniform vec3 uBase;
      ${LIGHT_GLSL}
      void main() {
        float life = fract(uTime * iA.y + iA.x), blown = iB.z;
        float h = pow(life, .85) * mix(82., 30., blown);
        float ang = iA.w + life * (3. + iB.y * 7.), rad = iA.z * (1. + life * 5.) + sin(life * 17. + iA.x * 30.) * (.25 + life * 1.8);
        vec3 p = uBase + iC + vec3(sin(ang) * rad, h, cos(ang) * rad);
        p.xz += uWind.xy * (life * life * (3. + 40. * max(uWind.z - .3, 0.)) + blown * life * (30. + 60. * uWind.z));
        p.y += blown * sin(life * 9. + iA.w) * 2.5;
        vec4 mv = viewMatrix * vec4(p, 1.); float d = max(-mv.z, .1), want = d * .0019, sz = max(iB.x, want), keep = iB.x / sz;
        vI = smoothstep(0., .03, life) * (1. - smoothstep(.7, 1., life)) * (.6 + .4 * sin(uTime * (5. + iB.y * 9.) + iA.x * 60.)) * keep * keep;
        vC = position.xy; mv.xy += position.xy * sz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vC; varying float vI;
      void main() { float r2 = dot(vC, vC); if (r2 > 1.) discard; gl_FragColor = vec4(vec3(.96, .97, 1.) * (exp(-r2 * 18.) * 5.5 + exp(-r2 * 4.) * (1. - r2) * .9) * vI, 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- iron and wood: masts, the gate's posts, hoops, the fire's ironwork
const IRON_SPEC = { position: 3, normal: 3, aC: 1 };
function ironMaterial(L) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...L.uniforms },
    vertexShader: 'attribute float aC; varying vec3 vW, vN; varying float vC; void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; vN = normalize(mat3(modelMatrix) * normal); vC = aC; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }',
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vC;
      ${LIGHT_GLSL}
      void main() {
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 V = normalize(cameraPosition - vW), Lf = normalize(uFirePos - vW);
        float rough = nfNoise(vW.xz * 3. + vW.y * 5.);
        vec3 alb = vec3(.035, .037, .042) * vC * (.8 + .4 * rough);
        vec3 light = nfHemi(n) + nfMoon(n, .1) + uFireCol * nfFireAtt(vW) * clamp(dot(n, Lf), 0., 1.);
        float sm = pow(clamp(dot(n, normalize(uMoonDir + V)), 0., 1.), 24.), sf = pow(clamp(dot(n, normalize(Lf + V)), 0., 1.), 16.);
        vec3 col = alb * light + (uMoonCol * sm * .5 + uFireCol * nfFireAtt(vW) * sf * .12) * (.25 + .1 * vC);
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW)), 1.);
      }`,
  });
}
// ropes: thin ribbons that turn about their own line to face the eye, never under a pixel and a half wide
async function ropeMesh(L, ropes, pause) {
  // ropes are ribbons that turn to the eye, shaded round across their width, with the twist of their strands in the grain
  let nP = 0, nS = 0; for (const r of ropes) { nP += r.pts.length; nS += r.pts.length - 1; }
  const pos = new Float32Array(nP * 6), dir = new Float32Array(nP * 6), side = new Float32Array(nP * 8), along = new Float32Array(nP * 2), idx = new Uint32Array(nS * 6);
  let v = 0, ii = 0;
  for (const [ri, r] of ropes.entries()) {
    const base = v, n = r.pts.length; let run = 0;
    for (let i = 0; i < n; i++) {
      const a = r.pts[Math.max(0, i - 1)], b = r.pts[Math.min(n - 1, i + 1)], d0 = b[0] - a[0], d1 = b[1] - a[1], d2 = b[2] - a[2], l = Math.hypot(d0, d1, d2) || 1, t = i / (n - 1), q = r.pts[i];
      if (i) run += Math.hypot(q[0] - r.pts[i - 1][0], q[1] - r.pts[i - 1][1], q[2] - r.pts[i - 1][2]);
      for (let k = 0; k < 2; k++, v++) {
        pos[v * 3] = q[0]; pos[v * 3 + 1] = q[1]; pos[v * 3 + 2] = q[2]; dir[v * 3] = d0 / l; dir[v * 3 + 1] = d1 / l; dir[v * 3 + 2] = d2 / l;
        side[v * 4] = k ? 1 : -1; side[v * 4 + 1] = r.ph; side[v * 4 + 2] = Math.sin(Math.PI * t) * (r.shiver ?? 1); side[v * 4 + 3] = r.w ?? 0.04; along[v] = run;
      }
    }
    for (let i = 0; i < n - 1; i++, ii += 6) { const a = base + i * 2; idx[ii] = a; idx[ii + 1] = a + 1; idx[ii + 2] = a + 3; idx[ii + 3] = a; idx[ii + 4] = a + 3; idx[ii + 5] = a + 2; }
    if (ri % 120 === 119) await pause();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3)); g.setAttribute('aSide', new THREE.BufferAttribute(side, 4)); g.setAttribute('aRun', new THREE.BufferAttribute(along, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  await pause();
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...L.uniforms, uCol: { value: new THREE.Vector3(0.5, 0.455, 0.36) } },
    vertexShader: /* glsl */`
      attribute vec3 aDir; attribute vec4 aSide; attribute float aRun; varying vec3 vA; varying vec3 vW;
      ${LIGHT_GLSL}
      void main() {
        vec3 p = position; p += vec3(-uWind.y, 0., uWind.x) * sin(uTime * (7. + uWind.w * 3.) + aSide.y) * .035 * aSide.z * uWind.z;
        vec3 toEye = cameraPosition - p; float d = length(toEye);
        vec3 sv = cross(aDir, toEye); float sl = length(sv); sv = sl > 1e-4 ? sv / sl : vec3(1., 0., 0.);
        float want = d * .0018, w = max(aSide.w, want);
        vA = vec3(clamp(aSide.w / max(want, 1e-4), 0., 1.), aSide.x, aRun / max(aSide.w, .01)); vW = p;
        gl_Position = projectionMatrix * viewMatrix * vec4(p + sv * aSide.x * w * .5, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vA; varying vec3 vW; uniform vec3 uCol;
      ${LIGHT_GLSL}
      void main() {
        // round: full along its middle, falling away to its edges; its strands wind round it once in three widths
        float across = vA.y, curve = sqrt(max(1. - across * across, 0.)), strand = .78 + .22 * sin(vA.z * 2.1 + across * 2.6);
        float wide = vA.x, tone = mix(.8, (.35 + .65 * curve) * strand, wide);
        vec3 light = nfHemi(vec3(0., 1., 0.)) + uMoonCol * .7 + uFireCol * nfFireAtt(vW) * .7;
        gl_FragColor = vec4(nfFog(uCol * light * tone, length(cameraPosition - vW)), clamp(vA.x, 0., 1.) * .95);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 1;
  return mesh;
}
// pennants: one on every mast, streaming down the wind
function pennantMesh(L, list) {
  const SEG = 8, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) for (const c of [-1, 1]) pos.push(i / SEG, c, 0);
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const iP = new Float32Array(list.length * 3), iD = new Float32Array(list.length * 4);
  list.forEach((p, i) => { iP.set(p.at, i * 3); iD.set([p.len, p.ph, p.white, p.wid], i * 4); });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iP, 3)); g.setAttribute('iDat', new THREE.InstancedBufferAttribute(iD, 4)); g.instanceCount = list.length;
  const m = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...L.uniforms },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iDat; varying vec3 vW, vN; varying float vT;
      ${LIGHT_GLSL}
      void main() {
        float a = position.x, c = position.y, len = iDat.x, st = clamp(uWind.z, 0., 1.4);
        vec3 wd = vec3(uWind.x, 0., uWind.y), sd = vec3(-uWind.y, 0., uWind.x);
        float ph = a * 7. - uTime * (3. + 4. * uWind.w) + iDat.y, wv = sin(ph) * a * (.1 + .12 * st) * len;
        float droop = a * a * len * clamp(.75 - st * .55, .05, .8);
        vec3 p = iPos + wd * a * len * (.55 + .4 * clamp(st, 0., 1.)) + sd * wv + vec3(0., c * iDat.w * (1. - a * .85) - droop + .04 * sin(ph * .7 + 1.) * a, 0.);
        vW = p; vN = normalize(sd + wd * (-cos(ph) * .6)); vT = iDat.z;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vT;
      ${LIGHT_GLSL}
      void main() {
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 alb = mix(vec3(.03, .032, .038), vec3(.78, .77, .74), vT);
        vec3 light = nfHemi(n) + nfMoon(n, .5) + nfFire(vW, n, .5);
        gl_FragColor = vec4(nfFog(alb * light, length(cameraPosition - vW)), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the small lights: dabs sized in metres
// Each light: a place, a phase of its own, a size in metres; one that lies on a tent's cloth also carries the cloth's
// normal and how far it bellies there (so it rides the canvas in the gusts) and its tent's nap. Everything a light does
// it does on the world clock alone.
const NAP_GLSL = /* glsl */`
// a light's state: its own slow twinkle; now and then it goes dark and wakes again; and its tent's nap (per: the tent's
// period in seconds, 0 for a tent that does not nap; tph: its phase): for most of a period the tent stands full, then
// its lights go out a few at a time, each on its own offset, it rests for a tenth of the period with a fifth of them
// still lit, and they wake a few at a time
float napLight(float ph, float per, float tph) {
  float tw = .78 + .22 * sin(uTime * (.7 + fract(ph * 3.7) * 1.3) + ph * 11.);
  float cyc = fract(uTime / (22. + 30. * fract(ph * 5.3)) + fract(ph * 1.7));
  float own = 1. - smoothstep(0., .012, cyc) * (1. - smoothstep(.05, .075, cyc));
  float c = fract(uTime / max(per, 1.) + tph), o1 = fract(ph * 7.13), o2 = fract(ph * 2.71 + .37);
  float gone = smoothstep(.56 + .16 * o1, .57 + .16 * o1, c), back = smoothstep(.82 + .16 * o2, .83 + .16 * o2, c);
  float tent = 1. - gone * (1. - back) * step(.5, per) * step(.2, fract(ph * 9.7));
  return tw * own * tent;
}
`;
// the instance attributes both meshes of the lights read: iPos (place, gust phase of its tent), iN (the cloth's normal,
// its belly there), iA (phase, the tent's nap period and phase, the stripe it lies on), iT (dabs: size, sway on a
// string, how much brighter than a small light of the cloth it burns; pools: the level way along the cloth and the stripes a metre of it crosses)
function lightAttributes(g, list, pool) {
  const n = list.length, iP = new Float32Array(n * 4), iN = new Float32Array(n * 4), iA = new Float32Array(n * 4), iT = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const l = list[i], o = i * 4, p = pool ? l.cloth : l.p, nr = l.n || [0, 0, 0], nap = l.nap || [0, 0];
    iP[o] = p[0]; iP[o + 1] = p[1]; iP[o + 2] = p[2]; iP[o + 3] = l.gph || 0; iN[o] = nr[0]; iN[o + 1] = nr[1]; iN[o + 2] = nr[2]; iN[o + 3] = l.belly || 0;
    iA[o] = l.ph; iA[o + 1] = nap[0]; iA[o + 2] = nap[1]; iA[o + 3] = l.s || 0;
    if (pool) { iT[o] = l.t[0]; iT[o + 1] = l.t[1]; iT[o + 2] = l.t[2]; iT[o + 3] = l.perM; } else { iT[o] = l.size ?? 0.36; iT[o + 1] = l.loose || 0; iT[o + 2] = l.bright || 0; }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iN', new THREE.InstancedBufferAttribute(iN, 4)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 4));
  g.instanceCount = n;
}
// the dabs: each turns about its own place to face the eye; far off it keeps an angle's width and dims to hold its energy
export function lightsMesh(L, list, o = {}) {
  const g = new THREE.InstancedBufferGeometry(); lightAttributes(g, list, false);
  const col = lin(o.color || '#fff4dc');
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...L.uniforms, uCol: { value: new THREE.Vector3(col[0], col[1], col[2]) }, uGain: { value: o.gain ?? 3.2 }, uMinAng: { value: o.minAngle ?? 0.0021 }, uSway: { value: o.sway ?? 0.05 } },
    vertexShader: /* glsl */`
      attribute vec4 iPos, iN, iA, iT; varying vec2 vC; varying float vI;
      uniform float uMinAng, uSway;
      ${LIGHT_GLSL} ${NAP_GLSL}
      void main() {
        vec3 p = iPos.xyz; float ph = iA.x;
        p += iN.xyz * (.1 + .26 * uWind.z) * nfGust(iPos.xz, iPos.w) * iN.w;
        p += vec3(uWind.x, 0., uWind.y) * sin(uTime * 1.3 + ph) * uSway * uWind.z * iT.y;
        vec4 mv = viewMatrix * vec4(p, 1.); float d = max(-mv.z, .1);
        float want = d * uMinAng, sz = max(iT.x, want), keep = iT.x / sz;
        float fog = exp(-uFogDen * uFogDen * d * d * .6);
        vI = napLight(ph, iA.y, iA.z) * keep * keep * fog * (1. + iT.z); vC = position.xy;
        mv.xy += position.xy * sz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vC; varying float vI; uniform vec3 uCol; uniform float uGain;
      void main() {
        float r2 = dot(vC, vC); if (r2 > 1.) discard;
        float core = exp(-r2 * 26.), halo = exp(-r2 * 5.) * (1. - r2);
        gl_FragColor = vec4(uCol * (core * uGain + halo * .35 * uGain) * vI, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}
// the pools: a soft round of light 1.5 m wide lying on the cloth under each light, white on a white stripe and all but
// nothing on a black one; it rides the cloth with its light and goes and comes with it
function poolMesh(L, list) {
  const g = new THREE.InstancedBufferGeometry(); lightAttributes(g, list, true);
  const col = lin('#fff4dc');
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...L.uniforms, uCol: { value: new THREE.Vector3(col[0], col[1], col[2]) }, uGain: { value: 0.62 }, uHalf: { value: 1.15 } },
    vertexShader: /* glsl */`
      attribute vec4 iPos, iN, iA, iT; varying vec2 vC; varying float vI, vS;
      uniform float uHalf;
      ${LIGHT_GLSL} ${NAP_GLSL}
      void main() {
        vec3 n = iN.xyz, t1 = iT.xyz, t2 = cross(n, t1);
        vec3 p = iPos.xyz + n * ((.1 + .26 * uWind.z) * nfGust(iPos.xz, iPos.w) * iN.w + .05) + (t1 * position.x + t2 * position.y) * uHalf;
        float d = length(cameraPosition - p);
        vC = position.xy; vS = iA.w + position.x * uHalf * iT.w;
        vI = napLight(iA.x, iA.y, iA.z) * exp(-uFogDen * uFogDen * d * d * .6);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vC; varying float vI, vS; uniform vec3 uCol; uniform float uGain;
      void main() {
        float r2 = dot(vC, vC); if (r2 > 1.) discard;
        float w = fwidth(vS) * 1.2, tri = abs(fract(vS * .5) - .5) * 2.;
        float stripe = mix(smoothstep(.5 - w, .5 + w, tri), .5, smoothstep(.3, .9, w));
        gl_FragColor = vec4(uCol * mix(.035, .79, stripe) * exp(-r2 * 4.5) * (1. - r2) * uGain * vI, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// ---------------------------------------------------------------- the fence: plain iron railings with spear tips, drawn on a strip
// Uprights every 0.24 m with spear tips, two rails, a post with a ball at its head every 3.2 m. The iron is dark; the
// moon glints down the moonward flank of every upright and the lights that stand near lay a little ivory on it. Far
// off the uprights melt into a veil no heavier than the share of the view they really cover, so that the ground shows
// through, while the posts and rails stay drawn a pixel wide.
function fenceMesh(L, glow) {
  const P = PLACES, R = P.fenceR, H = 3.5, pos = [], uv = [], idx = [], gateB = 197, gateHalf = 3.6 / R / RAD;
  const strip = (pts) => {
    let len = 0; const base = pos.length / 3;
    pts.forEach((q, i) => { if (i) len += Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]); pos.push(q[0], 0, q[1], q[0], H, q[1]); uv.push(len, 0, len, H); });
    for (let i = 0; i < pts.length - 1; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  };
  // the fence goes round from the gate to the wicket and from the wicket on to the gate
  const arc = (b0, b1) => { const pts = []; for (let b = b0; b < b1; b += 0.5) pts.push(at(R, b)); pts.push(at(R, b1)); strip(pts); }, wkHalf = WICKET.half / R / RAD;
  arc(gateB + gateHalf, WICKET.b - wkHalf); arc(WICKET.b + wkHalf, gateB + 360 - gateHalf);
  // the wicket's two leaves stand open inward
  { const wd = [Math.sin(WICKET.b * RAD), Math.cos(WICKET.b * RAD)], wt = [wd[1], -wd[0]];
    for (const sg of [-1, 1]) { const hinge = [WICKET.at[0] + wt[0] * WICKET.half * sg, WICKET.at[1] + wt[1] * WICKET.half * sg], sw = [-wd[0] * 0.9 + wt[0] * 0.44 * sg, -wd[1] * 0.9 + wt[1] * 0.44 * sg]; strip([hinge, [hinge[0] + sw[0] * 0.7, hinge[1] + sw[1] * 0.7], [hinge[0] + sw[0] * 1.4, hinge[1] + sw[1] * 1.4]]); } }
  // the gate's two leaves stand open inward
  const gdir = [Math.sin(gateB * RAD), Math.cos(gateB * RAD)], tang = [gdir[1], -gdir[0]];
  for (const sg of [-1, 1]) { const hinge = [P.gate[0] + tang[0] * 3.6 * sg, P.gate[1] + tang[1] * 3.6 * sg], sw = [-gdir[0] * 0.92 + tang[0] * 0.38 * sg, -gdir[1] * 0.92 + tang[1] * 0.38 * sg]; strip([hinge, [hinge[0] + sw[0] * 1.7, hinge[1] + sw[1] * 1.7], [hinge[0] + sw[0] * 3.4, hinge[1] + sw[1] * 3.4]]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...L.uniforms, tGlow: glow },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW; uniform sampler2D tGlow;
      ${LIGHT_GLSL}
      void main() {
        float x = vUv.x, y = vUv.y, fx = max(fwidth(x), 1e-4), fy = max(fwidth(y), 1e-4);
        float cx = (fract(x / .24) - .5) * .24, px = abs(cx), tip = clamp((y - 2.5) / .3, 0., 1.), top = 1. - smoothstep(2.8 - fy, 2.8 + fy, y);
        float bw = .017 * (1. - tip) + .002, bar = (1. - smoothstep(bw, bw + fx, px)) * top;
        float sp = abs(y - 2.47), sw = .04 * clamp(1. - sp / .1, 0., 1.), spear = (1. - smoothstep(sw, sw + fx, px)) * step(sp, .1);
        float bars = mix(max(bar, spear), .15 * top, smoothstep(.05, .17, fx));
        float rw = max(.035, .55 * fy), rail = max(1. - smoothstep(rw, rw + fy, abs(y - .32)), 1. - smoothstep(rw, rw + fy, abs(y - 2.3))) * min(1., .035 / rw + .5);
        float qc = (fract(x / 3.2) - .5) * 3.2, qx = abs(qc), pw = max(.085, .55 * fx);
        float post = (1. - smoothstep(pw, pw + fx, qx)) * (1. - smoothstep(3.1 - fy, 3.1 + fy, y));
        float ball = 1. - smoothstep(max(.14, .7 * fx), max(.14, .7 * fx) + max(fx, fy), length(vec2(qx, y - 3.24)));
        float solid = max(max(rail, post), ball), cover = clamp(max(bars, solid), 0., 1.);
        if (cover < .01) discard;
        vec3 n = normalize(vec3(vW.x - uFirePos.x, 0., vW.z - uFirePos.z) + vec3(1e-4, 0., 0.));
        // the moonward flank of an upright (the fence runs along (n.z, -n.x) as x grows)
        float along = dot(vec2(n.z, -n.x), uMoonDir.xz), sideC = mix(cx, qc, step(bars, solid) * step(rail, post));
        float flank = mix(smoothstep(-.004, .008, sideC * sign(along)), .5, smoothstep(.05, .17, fx)) * abs(along);
        vec2 uv = (vW.xz - uFirePos.xz) / ${(2 * MAP_HALF).toFixed(1)} + .5; vec3 lay = texture2D(tGlow, clamp(uv, 0., 1.)).rgb;
        vec3 col = vec3(.05, .052, .058) * (nfHemi(n) * 1.3 + uMoonCol * (.25 + .5 * abs(dot(n, uMoonDir)))) + uMoonCol * (.02 + .1 * flank) + ${IVORY} * (lay.g + .5 * lay.r) * .06;
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW)), cover);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 1;
  return mesh;
}

// ---------------------------------------------------------------- things made of parts that move: one writer, one shader
// Every vertex carries its colour, how brightly it glows of itself, and a motion: a turn about an axis through a pivot,
// its angle a function of the world clock (so it reads at every phase).
const MOVE_SPEC = { position: 3, normal: 3, aCol: 4, aPiv: 3, aAx: 3, aMo: 4, aF: 3 };
const STILL = { aPiv: [0, 0, 0], aAx: [0, 1, 0], aMo: [0, 0, 0, 0], aF: [0, 0, 0] };
function boxInto(G, c, s, ex, rotY = 0) {
  const cr = Math.cos(rotY), sr = Math.sin(rotY), R = (v) => [v[0] * cr + v[2] * sr, v[1], -v[0] * sr + v[2] * cr];
  const faces = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]]];
  for (const [n, u, v] of faces) {
    const id = [];
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const l = [0, 1, 2].map((k) => (n[k] + u[k] * a + v[k] * b) * s[k] / 2), w = R(l);
      id.push(G.v({ position: [c[0] + w[0], c[1] + w[1], c[2] + w[2]], normal: R(n), ...STILL, ...ex }));
    }
    G.quad(id[0], id[1], id[2], id[3]);
  }
}
// a turned shape round an upright axis: profile of [radius, height]
function latheInto(G, c, prof, sides, ex) {
  const rows = [];
  for (let k = 0; k <= sides; k++) {
    const a = k / sides * TAU, cs = Math.sin(a), sn = Math.cos(a), row = [];
    prof.forEach((q, j) => {
      const p0 = prof[Math.max(0, j - 1)], p1 = prof[Math.min(prof.length - 1, j + 1)], dr = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dr, dy) || 1;
      row.push(G.v({ position: [c[0] + cs * q[0], c[1] + q[1], c[2] + sn * q[0]], normal: [cs * dy / l, -dr / l, sn * dy / l], ...STILL, ...ex }));
    });
    rows.push(row);
  }
  for (let k = 0; k < sides; k++) for (let j = 0; j < prof.length - 1; j++) G.quad(rows[k][j], rows[k + 1][j], rows[k + 1][j + 1], rows[k][j + 1]);
}
const MOVE_GLSL = /* glsl */`
float mvAngle(vec4 m, float time) {
  float k = m.x, t = time * m.w + m.y;
  if (k < .5) return 0.;
  if (k < 1.5) return m.z * (.3333 + .6667 * pow(clamp(.5 + .5 * sin(t), 0., 1.), .7));
  if (k < 2.5) { float c = t / 6.2831853; return (floor(c) + smoothstep(.7, 1., fract(c))) * 1.5707963; }
  if (k < 3.5) return m.z * sin(t);
  if (k < 4.5) return t;
  return m.z * (.55 + .45 * sin(t) + .12 * sin(t * 2.7));
}
vec3 mvTurn(vec3 v, vec3 ax, float a) { float c = cos(a), s = sin(a); return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1. - c); }
`;
function movingMaterial(L, o = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...L.uniforms, uFace: { value: o.face ?? 0.5 }, uHour: { value: o.hour ?? 0 } },
    vertexShader: /* glsl */`
      attribute vec4 aCol, aMo; attribute vec3 aPiv, aAx, aF; varying vec3 vW, vN, vF; varying vec4 vCol;
      ${LIGHT_GLSL} ${MOVE_GLSL}
      void main() {
        float a = mvAngle(aMo, uTime);
        vec3 p = aPiv + mvTurn(position - aPiv, aAx, a), n = mvTurn(normal, aAx, a);
        vW = (modelMatrix * vec4(p, 1.)).xyz; vN = normalize(mat3(modelMatrix) * n); vCol = aCol; vF = aF;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vF; varying vec4 vCol; uniform float uFace, uHour;
      ${LIGHT_GLSL}
      void main() {
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 alb = vCol.rgb, glow = vCol.rgb * vCol.a;
        float aw = fwidth(length(vF.xy)) + 1e-4;
        if (vF.z > .5) {
          // the face: a disc whose grey deepens through the night, twelve points of light, two plain hands
          vec2 q = vF.xy; float r = length(q);
          float ang = atan(q.x, (abs(q.x) + abs(q.y) < 1e-5) ? 1. : q.y);
          vec3 face = vec3(uFace);
          float ring = 1. - smoothstep(.02, .02 + aw, abs(r - .93));
          float dotA = abs(fract(ang * 12. / 6.2831853 + .5) - .5) * 6.2831853 / 12. * r, dotR = abs(r - .78);
          float pt = 1. - smoothstep(.035, .035 + aw, length(vec2(dotA, dotR)));
          // (the hour it shows when the world clock starts is dealt by the seed; the long hand goes twelve times round
          // for the short hand's once, as on any clock)
          float a2 = uTime * .21 / 12. + uHour, a1 = a2 * 12.;
          vec2 h1 = vec2(sin(a1), cos(a1)), h2 = vec2(sin(a2), cos(a2));
          float l1 = clamp(dot(q, h1), 0., .7), l2 = clamp(dot(q, h2), 0., .46);
          float hand = max(1. - smoothstep(.022, .022 + aw, length(q - h1 * l1)), 1. - smoothstep(.034, .034 + aw, length(q - h2 * l2)));
          vec3 handC = uFace > .45 ? vec3(.03) : vec3(.8);
          alb = mix(face, handC, max(hand, ring)) * step(r, 1.) + alb * step(1., r);
          // the twelve points: bright on a dark face, faint on a pale one; pale hands keep a little light of their own
          glow = (vec3(1., .96, .86) * (uFace > .45 ? .5 : 3.2) * pt + face * .18 + (uFace > .45 ? 0. : .22) * hand * (1. - pt)) * step(r, 1.);
        }
        vec3 light = nfHemi(n) + nfMoon(n, .15) + nfFire(vW, n, .2);
        gl_FragColor = vec4(nfFog(alb * light + glow, length(cameraPosition - vW)), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the clock that is never still
// A broad dark cabinet of ironwork from the ground up, 9.9 m to the tips of its spears, the case 4 m wide, on a stepped
// plinth on its round of grit, standing on that round toward the lane so that the case is 11.5 m from the route's line.
// Corner posts, riveted straps, lattice panels, a glazed lower door whose dim pane shows a vaulted chamber and in it
// the pendulum, a rod and a round turned bob of iron, swinging; above the door four open niches two by two, each a
// chamber 0.42 m deep with a dim iron back on which the light behind lies as a soft pool, each with one moving thing
// of our own wrought of dark iron with body, a turned edge and its own shade (a boat rocking over waves of rolled
// iron scrolls, a mill wheel of two rims and twelve floats turning over its race, fish leaping one after another in
// an arc, a kite on a wire that climbs and dips); above them one face: a disc, twelve points of
// light, two plain hands. The same on the other side, back to back: one face looks up the lane to the fire, one down
// the gate lane to the gate. Four tall leaves of dark iron, pale-framed and riveted, hang on the corner posts and
// swing between a third open and full open, clear of every niche; a low drum with a plain vane turns a quarter at a
// time on top. Everything moves on the world clock.
export async function buildClock(ctx, L, o = {}) {
  const rng = o.rng || stream(ctx, 'clock'), G = new Geo(MOVE_SPEC), P = PLACES;
  // where its works stand when the world clock starts, on a stream of their own: the hour on the face, the first of
  // the four fish (the others follow a quarter turn apart), the nearer row of waves (the further lags it by 2.1)
  const works = stream(ctx, 'clock works'), hour = works() * TAU, fish0 = works() * TAU, wave0 = works() * TAU;
  const dark = [0.03, 0.032, 0.037, 0], iron = [0.05, 0.052, 0.058, 0], mid = [0.13, 0.135, 0.145, 0], back = [0.46, 0.47, 0.48, 0.5], leafIron = [0.06, 0.063, 0.07, 0.1], leafEdge = [0.32, 0.32, 0.31, 0.1];
  const box = (c, s, col, ex, rot) => boxInto(G, c, s, { aCol: col, ...ex }, rot || 0);
  const tri = (a, b, c, col, ex) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(n[0], n[1], n[2]) || 1; const id = [a, b, c].map((p) => G.v({ position: p, normal: [n[0] / l, n[1] / l, n[2] / l], ...STILL, aCol: col, ...ex })); G.tri(id[0], id[1], id[2]); };
  // a face wound to agree with the normal written into its first point, so that the side that is lit is the side that is seen
  const wound = (a, b, c) => {
    const p = G.bufs[0], n = G.bufs[1], ux = p[b * 3] - p[a * 3], uy = p[b * 3 + 1] - p[a * 3 + 1], uz = p[b * 3 + 2] - p[a * 3 + 2], vx = p[c * 3] - p[a * 3], vy = p[c * 3 + 1] - p[a * 3 + 1], vz = p[c * 3 + 2] - p[a * 3 + 2];
    if ((uy * vz - uz * vy) * n[a * 3] + (uz * vx - ux * vz) * n[a * 3 + 1] + (ux * vy - uy * vx) * n[a * 3 + 2] < 0) G.tri(a, c, b); else G.tri(a, b, c);
  };
  const wound4 = (a, b, c, d) => { wound(a, b, c); wound(a, c, d); };
  // plinth, the lit core (it shows between the bars of the pierced panels on the two sides, and nowhere else), side plates above the pierced panels, cornice
  box([0, 0.2, 0], [5.6, 0.4, 4.2], dark); box([0, 0.55, 0], [5.0, 0.3, 3.6], dark); box([0, 0.85, 0], [4.5, 0.3, 3.1], iron);
  box([0, 5.0, 0], [3.6, 8.0, 1.5], back);
  for (const sx of [-1, 1]) {
    box([sx * 1.95, 6.05, 0], [0.08, 5.9, 2.4], dark); box([sx * 1.95, 1.12, 0], [0.08, 0.24, 2.4], dark);
    for (let k = -4; k <= 4; k++) box([sx * 1.95, 2.1, k * 0.27], [0.07, 1.9, 0.07], iron);
    for (const sz of [-1, 1]) {
      box([sx * 1.9, 5.1, sz * 1.2], [0.24, 8.2, 0.24], iron);
      box([sx * 1.9, 9.55, sz * 1.2], [0.08, 0.5, 0.08], iron);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) tri([sx * 1.9 + dx * 0.11, 9.6, sz * 1.2 + dz * 0.11], [sx * 1.9 - dz * 0.11 * 0, 9.92, sz * 1.2], [sx * 1.9 - dx * 0.11, 9.6, sz * 1.2 - dz * 0.11], iron);
    }
  }
  box([0, 9.15, 0], [4.5, 0.3, 3.1], dark);
  await ctx.yield();
  // the two faces of the case, back to back (sz 1: toward the fire; -1: toward the gate)
  for (const sz of [1, -1]) {
    const rot = sz > 0 ? 0 : Math.PI, W = (x, y, z) => [x * sz, y, z * sz], zf = 1.26;
    // straps across, with rivets; the post between the niches; lattice panels beside the door; the door's frame and glazing bars
    for (const y of [1.08, 3.0, 4.66, 6.36]) { box(W(0, y, zf), [3.9, 0.16, 0.1], iron, null, rot); for (let k = -5; k <= 5; k++) box(W(k * 0.34 + 0.17, y, zf + 0.07), [0.06, 0.06, 0.05], mid, null, rot); }
    box(W(0, 4.66, zf), [0.14, 3.3, 0.1], iron, null, rot);
    for (const sx of [-1, 1]) {
      box(W(sx * 1.27, 2.04, zf - 0.12), [1.1, 1.8, 0.04], dark, null, rot);
      for (let k = -2; k <= 2; k++) for (const sl of [-1, 1]) { const c = W(sx * 1.27 + k * 0.27, 2.04, zf - 0.06), a = sl * 0.42; const id = []; for (const [u, v] of [[-0.03, -0.95], [0.03, -0.95], [0.03, 0.95], [-0.03, 0.95]]) id.push(G.v({ position: [c[0] + (u * Math.cos(a) - v * Math.sin(a)) * sz, c[1] + u * Math.sin(a) + v * Math.cos(a), c[2]], normal: W(0, 0, 1), ...STILL, aCol: iron })); G.quad(id[0], id[1], id[2], id[3]); }
      box(W(sx * 0.72, 2.04, zf), [0.1, 1.78, 0.1], iron, null, rot);
    }
    box(W(0, 2.04, zf), [0.035, 1.78, 0.04], iron, null, rot); box(W(0, 2.3, zf), [1.34, 0.035, 0.04], iron, null, rot);
    // the pendulum behind the door: its pivot under the sill and its swing (it is wrought further down, in its chamber)
    const swing = { aPiv: W(0, 2.92, 0.98), aAx: [0, 0, 1], aMo: [3, rng() * TAU, 0.3, 2.7] };
    // the plate round the face, and the face itself: 2.5 m across
    box(W(0, 7.72, zf - 0.1), [3.8, 2.56, 0.06], dark, null, rot);
    { const id = []; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) id.push(G.v({ position: W(u * 1.3, 7.72 + v * 1.3, zf), normal: W(0, 0, 1), ...STILL, aCol: dark, aF: [u * 1.04, v * 1.04, 1] })); G.quad(id[0], id[1], id[2], id[3]); }
    await ctx.yield();
    // the four moving things, each alone in its niche (the opening 1.71 m wide, 1.5 m high), wrought of dark iron with body
    const zt = 1.02, at2 = (x, y) => W(x, y, zt);
    // IRON WITH BODY. A piece is a plate some centimetres thick: its face dark iron with a soft sheen (the light it takes
    // is a law of the piece, written into its points), round it a turned edge that is pale where the light behind
    // catches it, and behind the edge a wall. Points are given on the case's face: x to the right as one looks at it, y up.
    // (mo: the piece's motion; where it is a law of the point, the piece is carried without turning and its edge is lit as its face is)
    const put = (x, y, z, n, col, mo) => { const hung = typeof mo === 'function'; return G.v({ position: W(x, y, z), normal: hung ? W(0, 0, 1) : W(n[0], n[1], n[2]), ...STILL, aCol: col, ...(hung ? mo(x, y) : mo) }); };
    const ironF = [0.055, 0.058, 0.064], sheen = (lo, hi, ya, yb) => (x, y) => [...ironF, lerp(lo, hi, smoothstep(ya, yb, y))];
    const rimC = [0.22, 0.22, 0.21, 0.6], wallC = [0.07, 0.072, 0.08, 0.3], rivetC = [0.3, 0.3, 0.29, 0.4];
    // the turned edge and the wall along a run of outline points p (o: their outward normals, q: the points set in by the edge)
    const edging = (p, o, q, z, t, e, mo, shut, rim) => {
      const fz = z + t / 2, a = [], b = [], c = [];
      p.forEach((pt, i) => {
        const n = o[i];
        a.push(put(q[i][0], q[i][1], fz, [n[0] * 0.6, n[1] * 0.6, 0.8], rim, mo)); b.push(put(pt[0], pt[1], fz - e, [n[0] * 0.8, n[1] * 0.8, 0.6], rim, mo));
        c.push(put(pt[0], pt[1], fz - e, [n[0], n[1], 0], wallC, mo), put(pt[0], pt[1], z - t / 2, [n[0], n[1], 0], wallC, mo));
      });
      for (let i = 0, m = p.length, last = shut ? m : m - 1; i < last; i++) { const j = (i + 1) % m; wound4(a[i], b[i], b[j], a[j]); wound4(c[i * 2], c[i * 2 + 1], c[j * 2 + 1], c[j * 2]); }
    };
    // a plate cut to an outline that bulges nowhere inward (its points go round anticlockwise)
    const plate = (pts, z, mo, o) => {
      const m = pts.length, t = o.t ?? 0.05, e = o.e ?? 0.028, out = [], inn = [];
      for (let i = 0; i < m; i++) {
        const p0 = pts[(i + m - 1) % m], p = pts[i], p1 = pts[(i + 1) % m];
        let ax = p[1] - p0[1], ay = p0[0] - p[0], bx = p1[1] - p[1], by = p[0] - p1[0];
        const la = Math.hypot(ax, ay) || 1, lb = Math.hypot(bx, by) || 1;
        ax /= la; ay /= la; bx /= lb; by /= lb;
        const k = Math.max(0.35, 1 + ax * bx + ay * by), nx = (ax + bx) / k, ny = (ay + by) / k, l = Math.hypot(nx, ny) || 1;
        out.push([nx / l, ny / l]); inn.push([p[0] - nx * e, p[1] - ny * e]);
      }
      const cx = pts.reduce((s, q) => s + q[0], 0) / m, cy = pts.reduce((s, q) => s + q[1], 0) / m, fz = z + t / 2;
      const heart = put(cx, cy, fz, [0, 0, 1], o.face(cx, cy), mo), ring = inn.map((q) => put(q[0], q[1], fz, [0, 0, 1], o.face(q[0], q[1]), mo));
      for (let i = 0; i < m; i++) wound(heart, ring[i], ring[(i + 1) % m]);
      edging(pts, out, inn, z, t, e, mo, true, o.rim || rimC);
    };
    // a bar that runs along a line: st are stations across it, each [a point on one side, the point opposite]
    const band = (st, z, mo, o) => {
      const t = o.t ?? 0.05, e0 = o.e ?? 0.02, fz = z + t / 2, A = [], B = [], nA = [], nB = [], iA = [], iB = [], fa = [], fb = [];
      for (const [a, b] of st) {
        const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1e-6, e = Math.min(e0, l * 0.35), ux = dx / l, uy = dy / l;
        A.push(a); B.push(b); nA.push([ux, uy]); nB.push([-ux, -uy]); iA.push([a[0] - ux * e, a[1] - uy * e]); iB.push([b[0] + ux * e, b[1] + uy * e]);
      }
      iA.forEach((q, i) => { fa.push(put(q[0], q[1], fz, [0, 0, 1], o.face(q[0], q[1]), mo)); fb.push(put(iB[i][0], iB[i][1], fz, [0, 0, 1], o.face(iB[i][0], iB[i][1]), mo)); });
      for (let i = 0, m = st.length, last = o.shut ? m : m - 1; i < last; i++) { const j = (i + 1) % m; wound4(fa[i], fb[i], fb[j], fa[j]); }
      edging(A, nA, iA, z, t, e0, mo, !!o.shut, o.rim || rimC); edging(B, nB, iB, z, t, e0, mo, !!o.shut, o.rim || rimC);
    };
    const rivet = (x, y, z, mo, s = 0.036) => box(W(x, y, z), [s, s, 0.02], rivetC, mo, rot);
    // THE FOUR NICHES. Behind each opening lies a chamber 0.42 m deep, from the straps' backs to a back of dim grey iron
    // that stands 0.04 m before the core. The light behind lies on that back as a pool: brightest behind the thing and
    // falling to under a third of that toward the corners. Floor, ceiling and both sides are iron and take what the
    // pool throws on them: most where they meet the back, little at the front. The chambers part at the shelf behind
    // the middle strap and at the wall behind the middle post; their outer sides line the case's side plates. side: -1
    // the left pair, 1 the right; ya to yb the chamber's height; (px, py) where the pool is brightest; slot: the fish's
    // chamber, whose floor has a dark slot the fish rise through.
    const zb = 0.79, zs = 1.21, cloth = [0.05, 0.05, 0.048], lining = [0.07, 0.072, 0.078];
    const chamber = (side, ya, yb, px, py, slot) => {
      const xi = side * 0.03, xo = side * 1.905, nx = 8, ny = 7, rows = [];
      const pool = (x, y) => 0.3 + 4.5 * Math.exp(-(((x - px) / 0.6) ** 2 + ((y - py) / 0.5) ** 2));
      for (let j = 0; j <= ny; j++) {
        const row = [];
        for (let i = 0; i <= nx; i++) { const x = lerp(xi, xo, i / nx), y = lerp(ya, yb, j / ny); row.push(put(x, y, zb, [0, 0, 1], [...cloth, pool(x, y)], null)); }
        rows.push(row);
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) wound4(rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]);
      // a lining: along the back's edge from p0 to p1, n its normal, from depth z0 to z1, taking the shares k0 and k1 of the pool beside it
      const line = (p0, p1, n, z0, z1, k0, k1, seg) => {
        const id = [];
        for (let i = 0; i <= seg; i++) { const x = lerp(p0[0], p1[0], i / seg), y = lerp(p0[1], p1[1], i / seg), g = pool(x, y) * 0.7; id.push(put(x, y, z0, n, [...lining, g * k0], null), put(x, y, z1, n, [...lining, g * k1], null)); }
        for (let i = 0; i < seg; i++) wound4(id[i * 2], id[i * 2 + 1], id[i * 2 + 3], id[i * 2 + 2]);
      };
      if (slot) { line([xi, ya], [xo, ya], [0, 1, 0], zb, 0.965, 0.62, 0.42, nx); line([xi, ya], [xo, ya], [0, 1, 0], 0.965, 1.075, 0, 0, nx); line([xi, ya], [xo, ya], [0, 1, 0], 1.075, zs, 0.3, 0.16, nx); }
      else line([xi, ya], [xo, ya], [0, 1, 0], zb, zs, 0.62, 0.16, nx);
      line([xi, yb], [xo, yb], [0, -1, 0], zb, zs, 0.62, 0.16, nx);
      line([xi, ya], [xi, yb], [side, 0, 0], zb, zs, 0.62, 0.16, ny);
      // (the outer side ends at the corner post's back)
      line([xo, ya], [xo, yb], [-side, 0, 0], zb, 1.08, 0.62, 0.24, ny);
    };
    chamber(-1, 4.63, 6.4, -0.95, 5.5); chamber(1, 4.63, 6.4, 0.95, 5.5); chamber(-1, 3.02, 4.6, -1.1, 3.62, true); chamber(1, 3.02, 4.6, 1.15, 3.75);
    // (the sill's shelf is closed from beneath)
    box(W(0, 3.0, 1.0), [3.81, 0.012, 0.42], dark, null, rot);
    // THE DOOR'S CHAMBER. Behind its glazing bars the door shows a chamber as the niches do, and in it the pendulum. The
    // back is the same dim iron 0.04 m before the core, with a lower pool that lies behind the bob's swing. The sides
    // stand 0.82 m either way, clear of the bob at the ends of its swing. The ceiling is a vault: it springs from the
    // sides and rises 0.87 m to its crown under the sill, and so passes beneath the arc the fish leap next door; an
    // iron plate with a turned edge shuts the corners over the vault. Floor, sides and vault take what the pool throws.
    { const xw = 0.82, ya = 1.1, ys = 2.1, yc = 2.97, zv = 1.1, nx = 8, ny = 8, rows = [], arc = [], arcN = [];
      // (the turned edges in this chamber are a dimmer iron than the niches', so that the pane stays under the niches' pools)
      const paneRim = [0.15, 0.15, 0.145, 0.45];
      const pool = (x, y) => 0.22 + 2.0 * Math.exp(-((x / 0.7) ** 2 + ((y - 1.75) / 0.62) ** 2));
      for (let j = 0; j <= ny; j++) {
        const row = [];
        for (let i = 0; i <= nx; i++) { const x = lerp(-xw, xw, i / nx), y = lerp(ya, yc, j / ny); row.push(put(x, y, zb, [0, 0, 1], [...cloth, pool(x, y)], null)); }
        rows.push(row);
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) wound4(rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]);
      // a lining along a run of the back's edge (n: its normal, or one for each point), from depth z0 to z1, taking the shares k0 and k1 of the pool beside it
      const strip = (pts, n, z0, z1, k0, k1) => {
        const id = [];
        pts.forEach((p, i) => { const g = pool(p[0], p[1]) * 0.7, m = Array.isArray(n[0]) ? n[i] : n; id.push(put(p[0], p[1], z0, m, [...lining, g * k0], null), put(p[0], p[1], z1, m, [...lining, g * k1], null)); });
        for (let i = 0; i + 1 < pts.length; i++) wound4(id[i * 2], id[i * 2 + 1], id[i * 2 + 3], id[i * 2 + 2]);
      };
      const run = (p0, p1, seg) => { const r = []; for (let i = 0; i <= seg; i++) r.push([lerp(p0[0], p1[0], i / seg), lerp(p0[1], p1[1], i / seg)]); return r; };
      // (the floor and the sides end at the back of the lattice panels' plates; between the door's posts the floor runs on to the strap)
      strip(run([-xw, ya], [xw, ya], nx), [0, 1, 0], zb, 1.12, 0.62, 0.26);
      strip(run([-0.7, ya], [0.7, ya], nx), [0, 1, 0], 1.12, zs, 0.26, 0.16);
      for (const sd of [-1, 1]) strip(run([sd * xw, ya], [sd * xw, ys], 4), [-sd, 0, 0], zb, 1.12, 0.62, 0.26);
      for (let k = 0; k <= 14; k++) { const a = k / 14 * Math.PI, cs = Math.cos(a), sn = Math.sin(a), l = Math.hypot(cs / xw, sn / (yc - ys)) || 1; arc.push([xw * cs, ys + (yc - ys) * sn]); arcN.push([-cs / xw / l, -sn / (yc - ys) / l, 0]); }
      strip(arc, arcN, zb, zv, 0.62, 0.28);
      // the plate over the vault: dark iron up to the sill's shelf, a turned edge 0.03 m broad along the vault's line
      { const a = [], b = [], c = [];
        arc.forEach((p, i) => { const n = arcN[i]; a.push(put(p[0], p[1], zv, [n[0] * 0.6, n[1] * 0.6, 0.8], paneRim, null)); b.push(put(p[0] - n[0] * 0.03, p[1] - n[1] * 0.03, zv, [0, 0, 1], [...ironF, 0.3], null)); c.push(put(p[0], 2.994, zv, [0, 0, 1], [...ironF, 0.1], null)); });
        for (let i = 0; i + 1 < arc.length; i++) { wound4(a[i], a[i + 1], b[i + 1], b[i]); wound4(b[i], b[i + 1], c[i + 1], c[i]); } }
      // the pendulum, where it always hung: a rod of iron 0.05 m broad from the pivot, and on it a round bob 0.8 m
      // across, turned: a broad edge that takes the light, a face of dark iron lightest at its heart, a boss and a rivet
      band([[[0.025, 2.9], [-0.025, 2.9]], [[0.025, 2.0], [-0.025, 2.0]]], 0.98, swing, { t: 0.04, e: 0.012, rim: paneRim, face: sheen(0.75, 0.3, 2.0, 2.9) });
      const dome = (r, lo, hi) => (x, y) => [...ironF, lerp(hi, lo, smoothstep(0, r, Math.hypot(x, y - 1.68)))];
      const disc = (r, m) => { const pts = []; for (let k = 0; k < m; k++) { const a = k / m * TAU; pts.push([Math.cos(a) * r, 1.68 + Math.sin(a) * r]); } return pts; };
      plate(disc(0.4, 20), 0.98, swing, { t: 0.06, e: 0.045, rim: paneRim, face: dome(0.4, 0.3, 1.5) });
      plate(disc(0.15, 12), 1.015, swing, { t: 0.05, e: 0.025, rim: paneRim, face: dome(0.15, 0.7, 1.7) });
      box(W(0, 1.68, 1.05), [0.06, 0.06, 0.02], paneRim, swing, rot); }
    // THE FIGURES' IRON. The boat, the fish and the kite are wrought as the wheel and the bob are: a body 0.07 to 0.09 m
    // thick whose chamfered edge is the same dark iron as its face (edge), and on it a second level that stands proud by
    // 0.015 to 0.025 m with a chamfer of its own; a face that swells is lightest at its heart (heartAt); a stud is dim
    // iron (studAt); a straight bar is a plate shut all round (bar: from one end to the other, w to either side)
    const edge = [0.075, 0.078, 0.085, 0.7], stud = [0.16, 0.16, 0.155, 0.45];
    const heartAt = (hx, hy, r, lo, hi) => (x, y) => [...ironF, lerp(hi, lo, smoothstep(0, r, Math.hypot(x - hx, y - hy)))];
    const bar = (xa, ya, xb, yb, w) => { const dx = xb - xa, dy = yb - ya, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w; return [[xa - nx, ya - ny], [xb - nx, yb - ny], [xb + nx, yb + ny], [xa + nx, ya + ny]]; };
    const studAt = (x, y, z, mo, s = 0.036) => box(W(x, y, z), [s, s, 0.02], stud, mo, rot);
    // upper left: a boat rocking over two rows of waves, each wave a scroll of rolled iron bar standing on a low rail
    { const cx = -0.95, y0 = 4.8, rock = { aPiv: at2(cx, y0 + 0.2), aAx: [0, 0, sz], aMo: [3, rng() * TAU, 0.34, 1.5] };
      // the hull, 1.5 m long and 0.09 m thick, with its sheer and the turn of its bilge; on it the second level: the
      // gunwale's rail, two strakes laid along the hull with four studs through the upper one, and the thwart the mast
      // is stepped through; the mast and its knob; two sails that belly, the larger on its boom. (The boat keeps
      // between the two rows of waves: nothing of it stands further forward than 0.074 m before its middle.)
      plate([[cx - 0.5, y0 + 0.34], [cx + 0.5, y0 + 0.34], [cx + 0.66, y0 + 0.42], [cx + 0.75, y0 + 0.56], [cx - 0.75, y0 + 0.56], [cx - 0.62, y0 + 0.4]], zt, rock, { t: 0.09, e: 0.035, rim: edge, face: sheen(0.2, 0.75, y0 + 0.34, y0 + 0.56) });
      plate(bar(cx - 0.74, y0 + 0.56, cx + 0.74, y0 + 0.56, 0.025), zt + 0.035, rock, { t: 0.06, e: 0.014, rim: edge, face: sheen(0.9, 1.3, y0 + 0.53, y0 + 0.59) });
      for (const [ya, xa, xb] of [[0.475, -0.63, 0.65], [0.4, -0.5, 0.5]]) plate(bar(cx + xa, y0 + ya, cx + xb, y0 + ya, 0.015), zt + 0.045, rock, { t: 0.03, e: 0.01, rim: edge, face: sheen(0.6, 1.0, y0 + ya - 0.015, y0 + ya + 0.015) });
      for (let k = 0; k < 4; k++) studAt(cx - 0.42 + k * 0.28, y0 + 0.475, zt + 0.064, rock, 0.022);
      plate(bar(cx - 0.09, y0 + 0.56, cx + 0.19, y0 + 0.56, 0.045), zt + 0.042, rock, { t: 0.06, e: 0.012, rim: edge, face: sheen(1.0, 1.5, y0 + 0.5, y0 + 0.62) });
      band([[[cx + 0.075, y0 + 0.53], [cx + 0.025, y0 + 0.53]], [[cx + 0.075, y0 + 1.475], [cx + 0.025, y0 + 1.475]]], zt, rock, { t: 0.07, e: 0.016, rim: edge, face: sheen(0.2, 0.75, y0 + 0.5, y0 + 1.475) });
      box(at2(cx + 0.05, y0 + 1.455), [0.08, 0.06, 0.09], stud, rock, rot);
      plate([[cx + 0.11, y0 + 0.62], [cx + 0.7, y0 + 0.62], [cx + 0.11, y0 + 1.45]], zt, rock, { t: 0.06, e: 0.03, rim: edge, face: heartAt(cx + 0.307, y0 + 0.897, 0.3, 0.3, 1.2) });
      plate([[cx - 0.5, y0 + 0.62], [cx, y0 + 0.62], [cx, y0 + 1.25]], zt, rock, { t: 0.06, e: 0.03, rim: edge, face: heartAt(cx - 0.167, y0 + 0.83, 0.25, 0.3, 1.2) });
      plate(bar(cx + 0.09, y0 + 0.625, cx + 0.72, y0 + 0.625, 0.02), zt + 0.02, rock, { t: 0.06, e: 0.012, rim: edge, face: sheen(0.9, 1.3, y0 + 0.6, y0 + 0.65) });
      // the two rows of waves (the nearer 0.3 m high, the further 0.38 m): four scrolls to a row, the rows out of step,
      // each row swaying as one; a row keeps within its chamber at the whole of its sway
      for (const [dz, hgt, ph, xs, per] of [[0.1, 0.3, wave0, -0.66, 0.36], [-0.08, 0.38, wave0 + 2.1, -0.8, 0.4]]) {
        const sway = { aPiv: W(cx, y0 - 2, zt + dz), aAx: [0, 0, sz], aMo: [3, ph, 0.045, 1.5] }, yb = y0 + 0.02, z = zt + dz, tone = sheen(0.15, 0.8, yb - 0.1, yb + hgt);
        // (the rail's foot stands behind the strap)
        band([[[cx + xs - 0.02, yb + 0.012], [cx + xs - 0.02, yb - 0.12]], [[cx + xs + 3 * per + 0.25 + 0.34 * hgt, yb + 0.012], [cx + xs + 3 * per + 0.25 + 0.34 * hgt, yb - 0.12]]], z, sway, { t: 0.05, e: 0.012, face: tone });
        for (let i = 0; i < 4; i++) {
          const x0 = cx + xs + i * per, R = 0.42 * hgt, C = [x0 + 0.25, yb + 0.56 * hgt], Lx = C[0] - R, st = [];
          const across = (q, n, w) => st.push([[q[0] + n[0] * w, q[1] + n[1] * w], [q[0] - n[0] * w, q[1] - n[1] * w]]);
          // the wave's back: a sweep up from the rail to the scroll's side
          for (let k = 0; k < 4; k++) { const q = k / 4, tx = (Lx - x0) * 2 * (1 - q), ty = (C[1] - yb) * 2 * q, l = Math.hypot(tx, ty) || 1; across([lerp(x0, Lx, 1 - (1 - q) * (1 - q)), lerp(yb, C[1], q * q)], [-ty / l, tx / l], 0.019); }
          // the crest rolled over and in on itself, a turn and a third, the bar thinner toward the scroll's middle
          for (let k = 0; k <= 16; k++) { const q = k / 16, a = Math.PI - q * 2.6 * Math.PI, r = R * (1 - 0.75 * q), n = [Math.cos(a), Math.sin(a)]; across([C[0] + r * n[0], C[1] + r * n[1]], n, lerp(0.019, 0.011, q)); }
          band(st, z, sway, { t: 0.05, e: 0.011, face: tone });
        }
      } }
    // upper right: a mill wheel 1.44 m across turning over its race: two rims, an outer hoop 0.16 m broad and an
    // inner one, and between them twelve floats, flat boards set across from rim to rim and standing proud of both;
    // eight spokes from the inner rim to a hub with its rivet. Under it the race, a trough of iron with a low lip
    // toward us and a higher board behind, into which the lowest floats dip; in the trough a little water, three
    // scrolls of rolled iron bar
    { const wx = 0.95, wy = 5.5, c = at2(wx, wy), turn = { aPiv: c, aAx: [0, 0, sz], aMo: [4, rng() * TAU, 0, 1.5] }, Ro = 0.72;
      // (a wheel's face takes its light by how far a point stands from the hub, so that it reads the same at every turn)
      const round = (r) => (x, y) => [...ironF, lerp(0.25, 0.7, smoothstep(0, r, Math.hypot(x - wx, y - wy)))];
      const hoop = (r, half, m, e) => { const st = []; for (let k = 0; k < m; k++) { const a = k / m * TAU, cs = Math.cos(a), sn = Math.sin(a); st.push([[wx + cs * (r + half), wy + sn * (r + half)], [wx + cs * (r - half), wy + sn * (r - half)]]); } band(st, zt, turn, { t: 0.05, e, shut: true, face: round(Ro) }); };
      hoop(0.64, 0.08, 24, 0.018); hoop(0.37, 0.05, 20, 0.016);
      // a board along the radius at the angle a, from r0 to r1, w to either side
      const radial = (a, r0, r1, w) => { const cs = Math.cos(a), sn = Math.sin(a); return [[r0, -w], [r1, -w], [r1, w], [r0, w]].map(([r, v]) => [wx + cs * r - sn * v, wy + sn * r + cs * v]); };
      for (let k = 0; k < 12; k++) plate(radial(k / 12 * TAU, 0.35, Ro, 0.03), zt + 0.01, turn, { t: 0.09, e: 0.012, face: round(Ro) });
      for (let k = 0; k < 8; k++) { const q = radial((k + 0.5) / 8 * TAU, 0.07, 0.34, 0.028); band([[q[3], q[0]], [q[2], q[1]]], zt, turn, { t: 0.035, e: 0.01, face: round(Ro) }); }
      { const pts = []; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; pts.push([wx + Math.cos(a) * 0.13, wy + Math.sin(a) * 0.13]); }
        plate(pts, zt, turn, { t: 0.07, e: 0.03, face: round(0.13) }); rivet(wx, wy, zt + 0.045, turn, 0.05); }
      // the race: its floor and two ends, the board behind the wheel, the lip before it (the wheel's foot stands 0.14 m under the lip's top)
      const x0 = 0.11, x1 = 1.76, yf = 4.66, lipY = 4.92, rect = (ya, yb) => [[x0, ya], [x1, ya], [x1, yb], [x0, yb]];
      // (the floor and the ends are set 0.01 m inside the two boards' outline, so that no two faces lie in one plane)
      box(W((x0 + x1) / 2, yf + 0.02, 1.045), [x1 - x0 - 0.02, 0.02, 0.25], dark, null, rot);
      for (const x of [x0 + 0.025, x1 - 0.025]) box(W(x, (yf + lipY) / 2, 1.045), [0.03, lipY - yf - 0.02, 0.25], [...ironF, 0.3], null, rot);
      plate(rect(yf, 5.04), 0.93, null, { t: 0.03, e: 0.025, face: sheen(0.12, 0.55, yf, 5.04) });
      plate(rect(yf, lipY), 1.17, null, { t: 0.04, e: 0.03, face: sheen(0.15, 0.75, yf, lipY) });
      // the water: a low rail behind the lip and on it three scrolls as the boat's waves are, swaying as one in step with the wheel
      { const yb = 4.84, hgt = 0.24, z = 1.115, per = 0.46, xs = wx - 0.61, sway = { aPiv: W(wx, yb - 2, z), aAx: [0, 0, sz], aMo: [3, turn.aMo[1], 0.03, 1.5] }, tone = sheen(0.9, 2.2, yb - 0.1, yb + hgt);
        band([[[xs - 0.02, yb + 0.012], [xs - 0.02, yb - 0.1]], [[xs + 2 * per + 0.31, yb + 0.012], [xs + 2 * per + 0.31, yb - 0.1]]], z, sway, { t: 0.04, e: 0.012, face: tone });
        for (let i = 0; i < 3; i++) {
          const xa = xs + i * per, R = 0.42 * hgt, C = [xa + 0.2, yb + 0.56 * hgt], Lx = C[0] - R, st = [];
          const across = (q, n, w) => st.push([[q[0] + n[0] * w, q[1] + n[1] * w], [q[0] - n[0] * w, q[1] - n[1] * w]]);
          for (let k = 0; k < 4; k++) { const q = k / 4, tx = (Lx - xa) * 2 * (1 - q), ty = (C[1] - yb) * 2 * q, l = Math.hypot(tx, ty) || 1; across([lerp(xa, Lx, 1 - (1 - q) * (1 - q)), lerp(yb, C[1], q * q)], [-ty / l, tx / l], 0.019); }
          for (let k = 0; k <= 12; k++) { const q = k / 12, a = Math.PI - q * 2.6 * Math.PI, r = R * (1 - 0.75 * q), n = [Math.cos(a), Math.sin(a)]; across([C[0] + r * n[0], C[1] + r * n[1]], n, lerp(0.019, 0.011, q)); }
          band(st, z, sway, { t: 0.04, e: 0.011, face: tone });
        } } }
    // lower left: four fish that leap one after another in an arc out of the slot in the sill, each bent along its
    // leap: a full body 0.07 m thick, a narrow wrist, a spread tail; its back takes more light than its belly. On the
    // body the second level: a flank that swells, a long round plate lightest at its heart, and before it the gill
    // line, a bent bar raised across the body behind the eye's stud; the fin on its back is set off, a thinner plate
    // whose face lies under the body's. (A fish passes the slot whole: nothing of it stands further forward than
    // 0.053 m before its middle.)
    for (let k = 0; k < 4; k++) {
      const fx0 = -1.2, fy0 = 3.12, c = at2(fx0, fy0), leap = { aPiv: c, aAx: [0, 0, sz], aMo: [4, k * Math.PI / 2 + fish0, 0, 1.6] }, rho = 0.56, st = [];
      const back = (x, y) => [...ironF, lerp(0.12, 0.8, smoothstep(rho - 0.1, rho + 0.1, Math.hypot(x - fx0, y - fy0)))];
      // along the fish from its nose, 0.25 m before the top of the arc, to its tail, 0.44 m behind: half its depth there
      for (const [d, h] of [[-0.25, 0.004], [-0.21, 0.045], [-0.13, 0.078], [-0.02, 0.085], [0.1, 0.075], [0.2, 0.045], [0.27, 0.03], [0.34, 0.06], [0.44, 0.125]]) {
        const a = -d / rho, sn = -Math.sin(a), cs = Math.cos(a);
        st.push([[fx0 + sn * (rho + h), fy0 + cs * (rho + h)], [fx0 + sn * (rho - h), fy0 + cs * (rho - h)]]);
      }
      band(st, zt, leap, { t: 0.07, e: 0.028, rim: edge, face: back });
      // (a place on the fish: d along it from the top of the arc, h out from the arc's line)
      const on = (d, h) => [fx0 + Math.sin(d / rho) * (rho + h), fy0 + Math.cos(d / rho) * (rho + h)], heart = on(0.04, 0), flank = [];
      plate([on(-0.02, 0.07), on(0.14, 0.05), on(0.135, 0.115), on(0.06, 0.122)], zt, leap, { t: 0.04, e: 0.014, rim: edge, face: back });
      for (let i = 0; i < 8; i++) flank.push(on(0.04 + 0.13 * Math.cos(i / 8 * TAU), 0.048 * Math.sin(i / 8 * TAU)));
      plate(flank, zt + 0.038, leap, { t: 0.03, e: 0.02, rim: edge, face: heartAt(heart[0], heart[1], 0.11, 0.5, 1.5) });
      band([[on(-0.119, 0.062), on(-0.137, 0.062)], [on(-0.099, 0), on(-0.117, 0)], [on(-0.119, -0.062), on(-0.137, -0.062)]], zt + 0.038, leap, { t: 0.03, e: 0.005, rim: edge, face: () => [...ironF, 1.3] });
      studAt(fx0 - Math.sin(0.16 / rho) * (rho + 0.02), fy0 + Math.cos(0.16 / rho) * (rho + 0.02), zt + 0.043, leap, 0.03);
    }
    // lower right: a kite on a wire that climbs and dips: the wire a thin rod from its stud by the sill; the kite a
    // plate 0.07 m thick, lightest at its heart, and on it the second level: its two spars laid across it as bars and,
    // where they cross, a round boss with its stud
    { const kx = 0.2, ky = 3.14, c = at2(kx, ky), fly = { aPiv: c, aAx: [0, 0, sz], aMo: [5, rng() * TAU, 0.62, 1.6] }, ex = kx + 1.3, ey = ky + 0.25, spar = () => [...ironF, 1.4], boss = [];
      band([[[kx - 0.0027, ky + 0.014], [kx + 0.0027, ky - 0.014]], [[ex - 0.0027, ey + 0.014], [ex + 0.0027, ey - 0.014]]], zt, fly, { t: 0.025, e: 0.006, rim: edge, face: sheen(0.3, 0.7, ky, ey) });
      studAt(kx, ky, zt + 0.02, fly, 0.06);
      plate([[ex + 0.3, ey + 0.06], [ex, ey + 0.3], [ex - 0.22, ey - 0.04], [ex + 0.02, ey - 0.3]], zt + 0.02, fly, { t: 0.07, e: 0.035, rim: edge, face: heartAt(ex + 0.008, ey + 0.004, 0.26, 0.25, 1.1) });
      plate(bar(ex + 0.0185, ey - 0.262, ex + 0.0015, ey + 0.262, 0.016), zt + 0.062, fly, { t: 0.03, e: 0.008, rim: edge, face: spar });
      plate(bar(ex - 0.19, ey - 0.034, ex + 0.262, ey + 0.053, 0.016), zt + 0.064, fly, { t: 0.03, e: 0.008, rim: edge, face: spar });
      for (let i = 0; i < 8; i++) boss.push([ex + 0.008 + 0.05 * Math.cos(i / 8 * TAU), ey + 0.004 + 0.05 * Math.sin(i / 8 * TAU)]);
      plate(boss, zt + 0.085, fly, { t: 0.04, e: 0.02, rim: edge, face: heartAt(ex + 0.008, ey + 0.004, 0.05, 0.7, 1.7) });
      studAt(ex + 0.008, ey + 0.004, zt + 0.115, fly, 0.03); }
    await ctx.yield();
  }
  // four tall leaves on the corner posts: shut, a leaf lies along the side of the case; it swings out between a third
  // open and full open, where it stands in line with the face, so it is never before a niche
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const hinge = [sx * 2.05, 3.75, sz * 1.2], ex = { aPiv: hinge, aAx: [0, 1, 0], aMo: [1, rng() * TAU, -sx * sz * Math.PI / 2, rng.range(0.38, 0.5)] };
    // a leaf, 0.96 m wide, 5.1 m high and 0.05 m thick as it was: a pale frame 0.07 m broad round two faces of dark
    // iron set flush in it, two straps across them and four rivets through each strap; it is the same seen from
    // either side
    const lx = sx * 2.05, lz = sz * 0.72;
    for (const dx of [-0.025, 0.025]) { const id = []; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) id.push(G.v({ position: [lx + dx, 3.75 + v * 2.48, lz + u * 0.41], normal: [Math.sign(dx), 0, 0], ...STILL, aCol: leafIron, ...ex })); wound4(id[0], id[1], id[2], id[3]); }
    for (const y of [1.235, 6.265]) box([lx, y, lz], [0.05, 0.07, 0.96], leafEdge, ex);
    for (const z of [0.275, 1.165]) box([lx, 3.75, sz * z], [0.05, 5.1, 0.07], leafEdge, ex);
    for (const y of [2.35, 5.15]) { box([lx, y, lz], [0.066, 0.13, 0.82], mid, ex); for (let k = 0; k < 4; k++) box([lx, y, sz * (0.39 + k * 0.22)], [0.09, 0.045, 0.045], leafEdge, ex); }
    for (const hy of [1.6, 3.75, 5.9]) box([sx * 2.05, hy, sz * 1.2], [0.1, 0.22, 0.1], mid, ex);
  }
  // the drum on top with its plain vane
  const drum = { aPiv: [0, 9.6, 0], aAx: [0, 1, 0], aMo: [2, rng() * TAU, 0, 0.75] };
  box([0, 9.5, 0], [1.5, 0.4, 1.5], iron, drum); box([0, 9.76, 0], [1.0, 0.12, 1.0], dark, drum); box([0.55, 9.9, 0], [1.9, 0.05, 0.05], iron, drum);
  tri([1.5, 9.99, 0], [1.9, 9.9, 0], [1.5, 9.81, 0], iron, drum);
  await ctx.yield();
  const face = o.face ?? 0.11, mesh = new THREE.Mesh(G.build(), movingMaterial(L, { face, hour })); mesh.frustumCulled = false;
  // where it stands and how it is turned: by the two lanes that meet at its round
  const route = o.route, gap = at(P.rings[0], P.gaps[2]), toGap = [gap[0] - P.clock[0], gap[1] - P.clock[1]], toGate = [P.gate[0] - P.clock[0], P.gate[1] - P.clock[1]], lg = Math.hypot(toGap[0], toGap[1]), lt = Math.hypot(toGate[0], toGate[1]);
  const front = [toGap[0] / lg - toGate[0] / lt, toGap[1] / lg - toGate[1] / lt], here = [P.clock[0], P.clock[1]];
  if (route) { const m = route.metreNear(P.clock[0], P.clock[1], o.span[0], o.span[1]), i = m / 2, dx = route.eyes[i * 3] - P.clock[0], dz = route.eyes[i * 3 + 2] - P.clock[1], d = Math.hypot(dx, dz), k = Math.max(0, d - 13.5) / d; here[0] += dx * k; here[1] += dz * k; }
  mesh.position.set(here[0], 0, here[1]); mesh.rotation.y = Math.atan2(front[0], front[1]); mesh.updateMatrixWorld(true);
  const object = new THREE.Group(); object.add(mesh);
  await ctx.yield();
  // a few small lights along the strap over the niches, on both faces
  const lamps = [], ry = mesh.rotation.y, cr = Math.cos(ry), sr = Math.sin(ry);
  for (const sz of [-1, 1]) for (let k = -2; k <= 2; k++) { const lx = k * 0.8, lz = sz * 1.42; lamps.push({ p: [here[0] + lx * cr + lz * sr, 6.5, here[1] - lx * sr + lz * cr], ph: rng() * 100, size: 0.26 }); }
  object.add(lightsMesh(L, lamps));
  await ctx.yield();
  return { object, height: 9.9, at: here, triangles: G.triangles, update() {} };
}

// ---------------------------------------------------------------- branches: one grower for the ice trees and the candle tree
// aI: brightness, glow inside, frost, spare; aT: how far a point trembles (under 0: water runs under it) and its phase
const SOLID_SPEC = { position: 3, normal: 3, aI: 4, aT: 2 };
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
// grows a curved, tapering branch and its children; out.runs collects every branch's points and radii; it pauses
// (o.pause) before each branch of the first three orders, so that no tree is one long step
async function growBranch(G, rng, p0, dir, len, r0, depth, o, out) {
  if (depth <= 2 && o.pause) await o.pause();
  const nseg = Math.max(3, Math.round(len / o.seg)), pts = [[p0.x, p0.y, p0.z]], radii = [r0], d = dir.clone().normalize(), p = p0.clone(), frames = [d.clone()];
  for (let i = 1; i <= nseg; i++) {
    d.x += rng.range(-1, 1) * o.wobble; d.z += rng.range(-1, 1) * o.wobble; d.y += rng.range(-0.6, 1) * o.wobble + o.lift * (depth > 0 ? 1 : 0.2); d.normalize();
    p.addScaledVector(d, len / nseg);
    if (o.stop && o.stop(p, radii[radii.length - 1])) break;
    pts.push([p.x, p.y, p.z]); radii.push(lerp(r0, r0 * o.taper, Math.pow(i / nseg, 0.8))); frames.push(d.clone());
  }
  if (pts.length < 3) return;
  const sides = depth === 0 ? o.sides : Math.max(4, o.sides - depth * 2), last = pts.length - 1;
  const i0 = G.idx.length;
  tubeInto(G, pts, radii, sides, (i, t) => ({ aI: o.attr(depth, t, radii[i], pts[i]), aT: [0, 0] }), true);
  if (out.thick && depth <= (o.thickTo ?? -1)) out.thick.push([i0, G.idx.length]);
  out.runs.push({ pts, radii, depth, frames });
  if (depth >= o.depth) return;
  const kids = o.kids(depth, rng);
  for (let k = 0; k < kids; k++) {
    const t = depth === 0 ? rng.range(o.fork0, 1) : rng.range(0.3, 1), i = Math.min(last, Math.max(1, Math.round(t * last))), base = frames[i];
    const side = new THREE.Vector3(rng.range(-1, 1), rng.range(-0.2, 0.9), rng.range(-1, 1)); side.addScaledVector(base, -side.dot(base)).normalize();
    const cd = base.clone().multiplyScalar(Math.cos(o.spread)).addScaledVector(side, Math.sin(o.spread) * rng.range(0.7, 1.2)).normalize();
    await growBranch(G, rng, v3(pts[i]), cd, len * o.shrink * rng.range(0.75, 1.1), radii[i] * 0.62, depth + 1, o, out);
  }
}

// ---------------------------------------------------------------- ice: one shader for everything in the garden
// Ice is clear: one sees through it. A thick body is drawn twice: first its far wall (a cold slate depth with bubbles,
// drawn a little inside its skin so that it shows bent), then its near skin, clear where it is seen square on and white
// where the sight grazes it, with a soft white core up its middle, veins, glints that shift with the angle of view, and
// frost where frost lies. Thin things (leaves, petals, lattice, twigs) are one skin, nearly clear with white edges. The
// light has no source to be found: it is brightest low down and dies upward. Colours go out multiplied by their cover.
const ICE_GLSL = /* glsl */`
float iceLevel(float y) { return mix(1., .12, smoothstep(0., 18., y)); }
const vec3 ICE_SLATE = vec3(.212, .262, .337), ICE_WHITE = vec3(.97, .985, 1.);
// the far wall of a thick body, seen from inside
vec4 iceDepth(vec3 p, vec3 n, vec3 V) {
  float ndv = clamp(dot(n, V), 0., 1.), lev = iceLevel(p.y);
  float streak = nfNoise(vec2(p.x + p.z, p.y * .35) * 2.6 + n.xz * 3.);
  float bub = smoothstep(.83, .9, nfNoise(p.xz * 8. + p.y * 5.3)) + smoothstep(.86, .9, nfNoise(p.xz * 19. - p.y * 13.)) * .6;
  float vein = (1. - smoothstep(0., .03, abs(nfFbm(p.xz * 1.9 + p.y * 2.3) - .5)));
  vec3 e = ICE_SLATE * (.16 + .3 * lev) * (.5 + .5 * streak) + ICE_WHITE * (bub * .3 + vein * .16) * (.35 + .65 * lev);
  return vec4(e, .42 + .3 * (1. - ndv));
}
// the near skin; glow is the strength of the core, frost how much frost lies here, thick whether a far wall stands behind
vec4 iceSkin(vec3 p, vec3 n, vec3 V, float glow, float frost, float thick) {
  float ndv = clamp(dot(n, V), 0., 1.), lev = iceLevel(p.y), grainy = nfNoise(p.xz * 9. + p.y * 7.);
  float rim = smoothstep(.5, .95, 1. - ndv), core = pow(ndv, 9.) * glow * thick * (.3 + .7 * lev);
  float vein = (1. - smoothstep(0., .035, abs(nfFbm(p.xz * 1.9 + p.y * 2.3 + 4.) - .5))) * (.4 + .6 * lev);
  float sheen = pow(clamp(n.y * .5 + .5, 0., 1.), 6.) * lev;
  float glint = step(.972, nfNoise(p.xz * 21. + p.y * 17. + V.xz * 6.)) * (.4 + .6 * lev);
  float lit = rim * (.3 + .62 * lev) + core * .62 + vein * .3 + sheen * .14 + glint * .8;
  float cover = .05 + .9 * rim + core * .42 + vein * .45 + sheen * .12 + glint;
  lit = mix(lit, (.34 + .14 * grainy) * (.45 + .55 * lev), frost); cover = mix(cover, .9, frost);
  return vec4(ICE_WHITE * lit + ICE_SLATE * .03 * thick, clamp(cover, 0., 1.));
}
`;
// far: the pass of the far walls (of the thick bodies only); else the pass of the skins
function iceMaterial(L, far = false) {
  return new THREE.ShaderMaterial({
    side: far ? THREE.BackSide : THREE.DoubleSide, transparent: true, premultipliedAlpha: true, depthWrite: false, uniforms: { ...L.uniforms, uInset: { value: far ? 1 : 0 } },
    vertexShader: /* glsl */`
      attribute vec4 aI; attribute vec2 aT; uniform float uTime, uInset; varying vec3 vW, vN; varying vec4 vI; varying vec2 vT;
      void main() {
        mat4 m = modelMatrix; float ph = aT.y;
      #ifdef USE_INSTANCING
        m = modelMatrix * instanceMatrix; ph += fract(dot(instanceMatrix[3].xz, vec2(.37, .71)));
      #endif
        vec3 p = position - normal * aI.w * uInset; float w = max(aT.x, 0.);
        p += normal * w * .05 * sin(uTime * (5. + 3. * fract(ph * 7.3)) + ph * 40.) + vec3(.04, 0., .03) * w * sin(uTime * 1.3 + ph * 9.);
        vW = (m * vec4(p, 1.)).xyz; vN = normalize(mat3(m) * normal); vI = aI; vT = aT; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec4 vI; varying vec2 vT;
      ${LIGHT_GLSL} ${ICE_GLSL}
      void main() {
        vec3 n = normalize(vN), V = normalize(cameraPosition - vW); float thick = step(.0001, vI.w);
      ${far ? /* glsl */`
        vec4 c = iceDepth(vW, -n, V); c.rgb *= vI.x;` : /* glsl */`
        if (!gl_FrontFacing && thick > .5) discard;
        if (dot(n, V) < 0.) n = -n;
        // frost ferns that grow and clear on the trunks: each patch on its own slow round, a third always growing
        vec2 cell = floor(vW.xz * .45 + vW.y * .2), fq = fract(vW.xz * .45 + vW.y * .2) - .5;
        float ph = nfHash(cell), grow = abs(fract(uTime * .045 + ph) * 2. - 1.), fern = nfFbm(vW.xz * 2.3 + vW.y * 1.9 + ph * 9.);
        float frost = vI.z * (1. - smoothstep(grow * .75, grow * .75 + .12, length(fq) * (.7 + .6 * fern)));
        // water running under a clear skin: bright beads going down
        float run = step(vT.x, -.5) * smoothstep(.55, .95, nfNoise(vec2(vT.y * 31., vW.y * 1.6 + uTime * 1.7)));
        // a leaf or a petal: white along its edge and its midrib (aT.x is its share of the way from rib to edge)
        float blade = step(.001, vT.x) * (smoothstep(.55, 1., vT.x) + (1. - smoothstep(0., .12, vT.x)) * .6);
        vec4 c = iceSkin(vW, n, V, vI.y, clamp(frost, 0., 1.), thick);
        c.rgb += ICE_WHITE * (run * .9 + blade * .5 * iceLevel(vW.y)); c.a = clamp(c.a + run * .7 + blade * .6, 0., 1.); c.rgb *= vI.x;`}
        float dist = length(cameraPosition - vW), fogK = exp(-uFogDen * uFogDen * dist * dist);
        gl_FragColor = vec4(c.rgb * fogK, c.a);
      }`,
  });
}
// the far-wall pass draws only the triangles marked thick while a mesh was built: the same vertices, fewer triangles
function thickPart(geo, ranges) {
  const g = new THREE.BufferGeometry(), src = geo.index.array, n = ranges.reduce((s, r) => s + r[1] - r[0], 0), idx = new (src.constructor)(n);
  let k = 0; for (const [a, b] of ranges) { idx.set(src.subarray(a, b), k); k += b - a; }
  for (const key of Object.keys(geo.attributes)) g.setAttribute(key, geo.attributes[key]);
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = geo.boundingSphere;
  return g;
}

// a turned form about any axis: prof is [radius, height] rows; lobes swell it into petals; M places it
function turnedInto(G, M, prof, sides, ex, lobes = 0, amp = 0, twist = 0) {
  const rows = [], p = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(M), pos3 = [0, 0, 0], nrm3 = [0, 0, 0], rec = { position: pos3, normal: nrm3, ...ex };
  for (let j = 0; j < prof.length; j++) {
    const a = prof[Math.max(0, j - 1)], b = prof[Math.min(prof.length - 1, j + 1)], dr = b[0] - a[0], dh = b[1] - a[1], l = Math.hypot(dr, dh) || 1, row = [];
    for (let k = 0; k <= sides; k++) {
      const an = k / sides * TAU, sw = 1 + amp * Math.cos(lobes * an + twist * j), r = prof[j][0] * sw;
      p.set(r * Math.cos(an), prof[j][1], r * Math.sin(an)).applyMatrix4(M); n.set(Math.cos(an) * dh / l, -dr / l, Math.sin(an) * dh / l).applyMatrix3(nm).normalize();
      pos3[0] = p.x; pos3[1] = p.y; pos3[2] = p.z; nrm3[0] = n.x; nrm3[1] = n.y; nrm3[2] = n.z;
      row.push(G.v(rec));
    }
    rows.push(row);
  }
  for (let j = 0; j < rows.length - 1; j++) for (let k = 0; k < sides; k++) G.quad(rows[j][k], rows[j + 1][k], rows[j + 1][k + 1], rows[j][k + 1]);
}
const UP = new THREE.Vector3(0, 1, 0);
// the matrix that stands a form at a place with its own up along `dir`
function standAt(pos, dir, scale = 1) {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(dir[0], dir[1], dir[2]).normalize());
  return new THREE.Matrix4().compose(new THREE.Vector3(pos[0], pos[1], pos[2]), q, new THREE.Vector3(scale, scale, scale));
}
function blockInto(G, c, s, rotY, ex) {
  const cr = Math.cos(rotY), sr = Math.sin(rotY), hx = s[0] / 2, hy = s[1] / 2, hz = s[2] / 2;
  const W = (x, y, z) => [c[0] + x * cr + z * sr, c[1] + y, c[2] - x * sr + z * cr], N = (x, y, z) => [x * cr + z * sr, y, -x * sr + z * cr];
  for (const [n, u, v] of [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]]]) {
    const id = [];
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) id.push(G.v({ position: W((n[0] + a * u[0] + b * v[0]) * hx, (n[1] + a * u[1] + b * v[1]) * hy, (n[2] + a * u[2] + b * v[2]) * hz), normal: N(n[0], n[1], n[2]), ...ex }));
    G.quad(id[0], id[1], id[2], id[3]);
  }
}
// an ice rose: an open cup of five petals, a closer cup within, a bud
function roseInto(G, pos, dir, size, rng, ex) {
  const M = standAt(pos, dir, size), tw = rng.range(-0.3, 0.3);
  turnedInto(G, M, [[0.06, 0], [0.3, 0.06], [0.5, 0.2], [0.56, 0.36]], 10, ex, 5, 0.09, tw);
  turnedInto(G, new THREE.Matrix4().multiplyMatrices(M, new THREE.Matrix4().makeRotationY(0.63)), [[0.05, 0.06], [0.22, 0.14], [0.31, 0.3], [0.25, 0.44]], 10, ex, 5, 0.08, -tw);
  turnedInto(G, M, [[0.04, 0.12], [0.13, 0.22], [0.13, 0.36], [0.0, 0.47]], 5, ex);
}

// things that drift within a box in their mesh's own frame: frost falling, motes rising, wisps streaming
function driftMesh(L, rng, n, o) {
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) seed[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...L.uniforms, uBox: { value: new THREE.Vector3(...o.box) }, uMid: { value: new THREE.Vector3(...o.mid) }, uVel: { value: new THREE.Vector3(...o.vel) }, uSz: { value: new THREE.Vector2(...o.size) },
      uGain: { value: o.gain ?? 1 }, uStretch: { value: o.stretch ?? 1 }, uOval: { value: new THREE.Vector2(...(o.oval || [1e4, 1e4])) }, uRoof: { value: new THREE.Vector3(...(o.roof || [1e4, 1e4, 1])) }, uSoft: { value: o.soft ?? 0 }, uWob: { value: o.wobble ?? 0.3 }, uThin: { value: o.thin ?? 0 }, uFull: { value: o.full ?? 0 } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform vec3 uBox, uMid, uVel, uRoof; uniform vec2 uSz, uOval; uniform float uTime, uWob, uSoft, uStretch, uThin; varying vec2 vQ; varying float vA, vSd;
      void main() {
        vec3 p = aSeed.xyz * uBox + uVel * uTime * (.6 + .8 * aSeed.w);
        p.xz += uWob * vec2(sin(uTime * .7 + aSeed.w * 40.), cos(uTime * .55 + aSeed.w * 23.));
        p = mod(p, uBox) - .5 * uBox;
        vec3 e = abs(p) / (.5 * uBox); float edge = 1. - smoothstep(.8, 1., max(e.x, max(e.y, e.z)));
        // a stream that thins as it goes down its box (uThin): whole where it begins, gone at the far end
        float gone = clamp(p.x / uBox.x + .5, 0., 1.); edge *= 1. - uThin * gone * sqrt(gone);
        p += uMid;
        // inside the oval of a tent only: uOval is the half length of its ridge and its radius
        float d = length(vec2(max(abs(p.x) - uOval.x, 0.), p.z)); edge *= 1. - smoothstep(uOval.y - 3., uOval.y - 1., d);
        // and under its roof: uRoof is the wall's height at one end, at the other, and the half length between
        float top = mix(uRoof.x, uRoof.y, clamp(p.x / (2. * uRoof.z) + .5, 0., 1.)); edge *= 1. - smoothstep(top - 4., top - 1., p.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.); float dist = length(mv.xyz), sz = mix(uSz.x, uSz.y, aSeed.w * aSeed.w), k = max(sz, .0016 * dist);
        mv.xy += position.xy * k * (1. + uThin * gone) * vec2(uStretch, 1.); vQ = position.xy; vSd = aSeed.w;
        float tw = mix(.35 + .65 * step(.55, fract(aSeed.w * 91. + uTime * (.4 + aSeed.x))), 1., uSoft);
        vA = edge * (sz * sz) / (k * k) * smoothstep(.4, 2., dist) * tw;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uGain, uSoft, uFull; varying vec2 vQ; varying float vA, vSd;
      ${LIGHT_GLSL}
      void main() {
        // a mote is a small round; a wisp (uSoft) is a soft patch torn ragged, no two alike; a puff (uFull) is torn less
        float r = length(vQ), torn = exp(-r * r * 3.) * smoothstep(.2 - .16 * uFull, .65 - .2 * uFull, nfFbm(vQ * vec2(1.2, 2.2) + vSd * 37.)) * 1.6;
        float a = mix(1. - smoothstep(.3, 1., r), torn, uSoft) * vA; if (a < .004) discard;
        gl_FragColor = vec4(vec3(.96, .98, 1.) * uGain * a, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// whether a place lies under the roof of one of the two tents that are flown through (1) or not (0): each tent as
// its middle and turn (uTG, uTS: x, z, cos, sin), its oval and heights (uOG: half ridge, radius, wall, peak; uOS: half
// ridge, radius, wall at the flap end, wall at the high end)
const ROOF_GLSL = /* glsl */`
uniform vec4 uTG, uOG, uTS, uOS;
float underRoofs(vec3 p) {
  vec2 d = p.xz - uTG.xy, l = vec2(d.x * uTG.z + d.y * uTG.w, -d.x * uTG.w + d.y * uTG.z);
  float r = length(vec2(max(abs(l.x) - uOG.x, 0.), l.y)) / uOG.y;
  float under = step(r, 1.) * step(p.y, uOG.z + (uOG.w - uOG.z) * pow(clamp(1. - r, 0., 1.), 1.45));
  d = p.xz - uTS.xy; l = vec2(d.x * uTS.z + d.y * uTS.w, -d.x * uTS.w + d.y * uTS.z);
  r = length(vec2(max(abs(l.x) - uOS.x, 0.), l.y)) / uOS.y;
  float span = uOS.x + uOS.y, top = mix(uOS.z, uOS.w, clamp((l.x + span) / (2. * span), 0., 1.)) + 5. * (1. - clamp(r * r, 0., 1.));
  return max(under, step(r, 1.) * step(p.y, top));
}
`;
function roofUniforms(lay) {
  const g = lay.garden, s = lay.steps, S = PLACES.steps;
  return { uTG: { value: new THREE.Vector4(g.x, g.z, g.cr, g.sr) }, uOG: { value: new THREE.Vector4(g.L, g.R, g.wall, g.peak) }, uTS: { value: new THREE.Vector4(s.x, s.z, s.cr, s.sr) }, uOS: { value: new THREE.Vector4(s.L, s.R, S.wall0, S.wall1) } };
}
// Snow that falls over the whole place on a rare night. It stands in the world: a chain of boxes laid end to end along
// the route's line from the meadow to the tree, each 50 m of the line long (so that it lies about the line on the
// turns), 44 m wide and as tall as the line's own rise in it with 14 m below and 18 above, with flakes by its volume.
// A flake is plain, soft and round, sized in metres; one that lies under the roof of the garden of ice or of the
// cloud steps is not drawn, wherever the eye is.
export function fallingSnow(L, rng, route, lay, count, vel) {
  const E = route.eyes, boxes = [], WIDE = 44; let vol = 0;
  for (let m0 = 0; m0 < route.path.length - 4; m0 += 50) {
    const i0 = Math.floor(m0 / 2), i1 = Math.min(route.count - 1, Math.floor((m0 + 50) / 2));
    let lo = Infinity, hi = -Infinity; for (let i = i0; i <= i1; i++) { lo = Math.min(lo, E[i * 3 + 1]); hi = Math.max(hi, E[i * 3 + 1]); }
    const y0 = Math.max(0, lo - 14), y1 = hi + 18, dx = E[i1 * 3] - E[i0 * 3], dz = E[i1 * 3 + 2] - E[i0 * 3 + 2], l = Math.hypot(dx, dz) || 1;
    const b = { c: [(E[i0 * 3] + E[i1 * 3]) / 2, (y0 + y1) / 2, (E[i0 * 3 + 2] + E[i1 * 3 + 2]) / 2], dir: [dx / l, dz / l], len: l + 14, h: y1 - y0 }; b.vol = b.len * b.h * WIDE; vol += b.vol; boxes.push(b);
  }
  const per = boxes.map((b) => Math.round(count * b.vol / vol)), n = per.reduce((a, k) => a + k, 0), g = new THREE.InstancedBufferGeometry();
  const aSeed = new Float32Array(n * 4), aC = new Float32Array(n * 3), aD = new Float32Array(n * 4); let o = 0;
  boxes.forEach((b, bi) => { for (let k = 0; k < per[bi]; k++, o++) { aSeed.set([rng(), rng(), rng(), rng()], o * 4); aC.set(b.c, o * 3); aD.set([b.dir[0], b.dir[1], b.len, b.h], o * 4); } });
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 3)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(aD, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...L.uniforms, ...roofUniforms(lay), uVel: { value: new THREE.Vector3(vel[0], vel[1], vel[2]) }, uSz: { value: new THREE.Vector2(0.035, 0.1) }, uWide: { value: WIDE } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed, aD; attribute vec3 aC; uniform vec3 uVel; uniform vec2 uSz; uniform float uWide; varying vec2 vQ; varying float vA;
      ${LIGHT_GLSL} ${ROOF_GLSL}
      void main() {
        vec3 box = vec3(aD.z, aD.w, uWide);
        vec3 v = vec3(uVel.x * aD.x + uVel.z * aD.y, uVel.y, -uVel.x * aD.y + uVel.z * aD.x) * (.7 + .6 * aSeed.w);
        vec3 q = aSeed.xyz * box + v * uTime; q.xz += .5 * vec2(sin(uTime * .6 + aSeed.w * 40.), cos(uTime * .47 + aSeed.w * 23.));
        q = mod(q, box) - .5 * box;
        vec3 e = abs(q) / (.5 * box); float edge = 1. - smoothstep(.85, 1., max(e.x, max(e.y, e.z)));
        vec3 p = aC + vec3(q.x * aD.x - q.z * aD.y, q.y, q.x * aD.y + q.z * aD.x);
        edge *= 1. - underRoofs(p);
        vec4 mv = viewMatrix * vec4(p, 1.); float dist = length(mv.xyz), sz = mix(uSz.x, uSz.y, aSeed.w * aSeed.w), k = max(sz, .0016 * dist);
        mv.xy += position.xy * k; vQ = position.xy;
        vA = edge * (sz * sz) / (k * k) * smoothstep(.5, 2.5, dist) * exp(-uFogDen * uFogDen * dist * dist);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vA;
      void main() { float a = (1. - smoothstep(.25, 1., length(vQ))) * vA; if (a < .004) discard; gl_FragColor = vec4(vec3(.9, .93, 1.) * a, 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { object: mesh, count: n, boxes };
}

// ---------------------------------------------------------------- the garden of ice
// The floor of ice flags inside the oval, the ice path along the walk, frost ferns that grow and clear, and (kind 1)
// sheets of mist that creep a little above it. Drawn in the tent's own frame: x along the ridge, z across.
function gardenFloorMaterial(L, T, bow, kind, uprights = []) {
  // uprights: what stands on the floor and shows in it, [x, z, height, half width] in the tent's frame
  const N = 20, pil = []; for (let i = 0; i < N; i++) { const u = uprights[i] || [0, 0, 0, 0]; pil.push(new THREE.Vector4(u[0], u[1], u[2], u[3])); }
  return new THREE.ShaderMaterial({
    transparent: kind === 1, depthWrite: kind !== 1, polygonOffset: kind !== 1, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...L.uniforms, uOval: { value: new THREE.Vector2(T.L, T.R) }, uBow: { value: new THREE.Vector3(bow[0], bow[1], bow[2]) }, uPil: { value: pil }, uTent: { value: new THREE.Vector4(T.x, T.z, T.cr, T.sr) } },
    vertexShader: /* glsl */`
      uniform vec4 uTent; varying vec3 vW; varying vec3 vP; varying vec3 vEye;
      void main() {
        vP = position; vW = (modelMatrix * vec4(position, 1.)).xyz; vec2 e = cameraPosition.xz - uTent.xy;
        vEye = vec3(e.x * uTent.z + e.y * uTent.w, cameraPosition.y, -e.x * uTent.w + e.y * uTent.z);
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec2 uOval; uniform vec3 uBow; uniform vec4 uPil[${N}]; varying vec3 vW; varying vec3 vP; varying vec3 vEye;
      ${LIGHT_GLSL}
      void main() {
        float d = length(vec2(max(abs(vP.x) - uOval.x, 0.), vP.z)); if (d > uOval.y + .1) discard;
        float pz = uBow.x + uBow.y * vP.x + uBow.z * vP.x * vP.x, off = abs(vP.z - pz), dist = length(cameraPosition - vW);
        float wall = smoothstep(uOval.y - 9., uOval.y - .5, d);
      #if ${kind} == 1
        // mist: thicker over the path and against the wall, creeping across. Its strength is its own place's alone (its
        // noise, how far from the path and from the wall it lies): the lens goes 1.5 m and more over the highest sheet
        // and never through one, so nothing here asks where the eye is
        vec2 q = vP.xz * .12 + vec2(uTime * .035, -uTime * .02) * (1. + vP.y);
        float m = nfFbm(q + vP.y * 3.) * (.55 + .45 * nfNoise(q * 2.7 - uTime * .05));
        float a = smoothstep(.3, .75, m) * (.3 + .4 * (1. - smoothstep(2., 9., off)) + .3 * wall);
        gl_FragColor = vec4(nfFog(vec3(.5, .51, .52), dist), a * .31);
      #else
        // flags: courses across the walk, each flag its own clear grey; pale joints; the path one long band of smooth ice
        vec2 g = vec2(vP.x * .42, (vP.z - pz) * .5); float course = floor(g.x); g.y += .5 * mod(course, 2.) + .23 * nfHash(vec2(course, 3.));
        vec2 cell = floor(g), f = fract(g); float edge = min(min(f.x, 1. - f.x) * 2.4, min(f.y, 1. - f.y) * 2.), joint = smoothstep(.0, .06, edge);
        float tone = .5 + .2 * nfHash(cell) + .1 * nfFbm(vP.xz * 1.7), path = 1. - smoothstep(2.2, 4.2, off);
        float flag = tone * .15 * mix(.8, 1., joint) + (1. - joint) * .06;
        // cracks and depth under the skin
        flag *= .9 + .2 * smoothstep(.48, .5, nfFbm(vP.xz * .9 + 13.));
        // frost ferns on the flags: fine needles that grow out from a seed in every cell of 1.2 m and clear again, a
        // third of the cells always growing
        vec2 fc = floor(vP.xz * .83), fq = fract(vP.xz * .83) - .5; float ph = nfHash(fc + 5.), grow = abs(fract(uTime * .04 + ph) * 2. - 1.);
        // (a guard: at a fern's very middle both of atan's arguments are nought and the angle is not defined; there it
        // is taken as nought. Nowhere else is anything changed, and at the middle the fern's needles meet in any case)
        float rr = length(fq), ang = atan(fq.y, (abs(fq.x) + abs(fq.y) < 1e-5) ? 1. : fq.x);
        float needle = 1. - smoothstep(0., .16, abs(nfNoise(vec2(ang * 3.2 + ph * 20., rr * 3.)) - .5));
        float barb = 1. - smoothstep(0., .2, abs(nfNoise(vec2(ang * 11. + ph * 9., rr * 26.)) - .5));
        float fern = needle * (.55 + .45 * barb) * (1. - smoothstep(grow * .5, grow * .5 + .06, rr)) * (.4 + .6 * nfHash(fc));
        flag = mix(flag, .42, fern * .8);
        // the path: smooth ice, a pale grey that holds the low light, with a long sheen toward the eye
        vec3 V = normalize(vec3(vEye.x - vP.x, vEye.y, vEye.z - vP.z));
        float fres = pow(1. - clamp(V.y, 0., 1.), 4.), rough = nfFbm(vP.xz * vec2(.6, 2.6));
        float ice = .13 + .05 * rough + .1 * fres;
        // what stands on the floor shows in it as a soft upright streak, drawn out toward the eye
        float streak = 0.;
        for (int i = 0; i < ${N}; i++) {
          vec4 u = uPil[i]; vec2 ab = u.xy - vEye.xz, qp = vP.xz - vEye.xz; float l2 = max(dot(ab, ab), 1.), t = dot(qp, ab) / l2;
          // (a guard: the eye's height over the floor divides here; with an eye at the floor or under it the quotient would
          // have no bound or change sign, so the divisor is held at a centimetre or more and the share between 0 and 1.
          // Over the floor, where every eye of the line is, nothing is changed)
          float side = abs(qp.x * ab.y - qp.y * ab.x) / sqrt(l2), t0 = clamp(vEye.y / max(vEye.y + max(u.z, .01), .01), 0., 1.);
          streak += step(.01, u.w) * (1. - smoothstep(u.w * .4 * t, u.w * (1.2 + 1.5 * (1. - t)) * t + .02, side)) * smoothstep(t0, mix(t0, 1., .35), t) * (1. - smoothstep(.97, 1., t)) * (.35 + .65 * t);
        }
        streak = clamp(streak, 0., 1.6) * (.75 + .5 * nfNoise(vP.xz * vec2(1.3, 9.)));
        float lit = mix(flag, ice, path) + streak * (.1 + .12 * path);
        lit *= mix(1., .62, wall);
        // against the wall the ice gives out into dark trodden earth, raggedly, over the last metre and a half
        float earth = smoothstep(uOval.y - 2.3, uOval.y - .8, d + (nfFbm(vP.xz * .7 + 3.) - .5) * 1.5);
        lit = mix(lit, .014 + .012 * nfNoise(vP.xz * 2.3), earth);
        float glint = step(.972, nfNoise(vP.xz * 23. + cameraPosition.xz * 1.5)) * .3 * (1. - earth);
        gl_FragColor = vec4(nfFog(vec3(.97, .985, 1.) * (lit + glint), dist), 1.);
      #endif
      }`,
  });
}
// one arch of ice lattice across the walk: two rails with crossed bars between, hung with roses
async function archInto(G, rng, at, tan, o) {
  const sideV = [-tan[1], tan[0]], rail = (off) => {
    const pts = [];
    for (let k = 0; k <= 28; k++) {
      const s = k / 28, leg = o.leg / (2 * o.leg + Math.PI * o.half * 0.9);
      let u, y;
      if (s < leg) { u = -o.half; y = s / leg * o.leg; } else if (s > 1 - leg) { u = o.half; y = (1 - s) / leg * o.leg; }
      else { const a = (s - leg) / (1 - 2 * leg) * Math.PI; u = -o.half * Math.cos(a); y = o.leg + (o.top - o.leg) * Math.sin(a); }
      pts.push([at[0] + sideV[0] * u + tan[0] * off, y, at[1] + sideV[1] * u + tan[1] * off]);
    }
    return pts;
  };
  const A = rail(-o.deep / 2), B = rail(o.deep / 2), ice = { aI: [1, 0.55, 0.25, 0], aT: [0, 0] }, thin = { aI: [1, 0.4, 0.1, 0], aT: [0, 0] };
  tubeInto(G, A, A.map(() => 0.11), 5, () => ice); tubeInto(G, B, B.map(() => 0.11), 5, () => ice);
  for (let k = 0; k < 28; k++) { if (k % 10 === 0) await o.pause(); tubeInto(G, [A[k], B[k + 1]], [0.045, 0.045], 4, () => thin); tubeInto(G, [B[k], A[k + 1]], [0.045, 0.045], 4, () => thin); }
  // roses: hung all along, facing down the walk and inward
  const mid = [at[0], o.leg, at[1]];
  for (let i = 0; i < o.roses; i++) {
    const k = 2 + Math.floor(rng() * 25), w = rng(), p = [lerp(A[k][0], B[k][0], w), lerp(A[k][1], B[k][1], w), lerp(A[k][2], B[k][2], w)], sg = rng.chance(0.5) ? 1 : -1;
    const dir = [(mid[0] - p[0]) * 0.07 + tan[0] * sg * 0.7, (mid[1] - p[1]) * 0.07 - 0.25, (mid[2] - p[2]) * 0.07 + tan[1] * sg * 0.7];
    o.out.push(standAt(p, dir, rng.range(0.75, 1.25)).multiply(new THREE.Matrix4().makeRotationY(rng() * TAU)));
  }
}

// the fountain: a basin, a plain column, three stacked dishes, and threads of water frozen as they fell
function fountainInto(G, rng, c, thick) {
  const ice = (b, g, f) => ({ aI: [b, g, f, 0.07], aT: [0, 0] }), M = (y) => new THREE.Matrix4().makeTranslation(c[0], y, c[1]), i0 = G.idx.length;
  turnedInto(G, M(0), [[5.4, 0], [5.4, 0.75], [5.0, 0.9], [4.6, 0.75], [4.6, 0.5], [0, 0.5]], 28, ice(1, 0.5, 0.35));
  turnedInto(G, M(0.5), [[1.0, 0], [0.75, 0.5], [0.55, 1.4], [0.5, 4.2], [0.36, 6.3], [0.3, 7.0], [0.42, 7.15], [0.16, 7.35], [0.0, 7.5]], 12, ice(1, 0.75, 0.1));
  const dishes = [[2.5, 3.5], [4.75, 2.45], [6.6, 1.5]];
  for (const [y, r] of dishes) turnedInto(G, M(y), [[0.5, -0.55], [r * 0.55, -0.42], [r * 0.9, -0.16], [r, 0.02], [r * 0.97, 0.1], [r * 0.82, -0.02], [r * 0.4, -0.2], [0.45, -0.2]], 24, ice(1.05, 0.7, 0.12));
  thick.push([i0, G.idx.length]);
  // threads from each rim to the dish or the basin below, a few hanging short as icicles
  for (let i = 0; i < dishes.length; i++) {
    const [y, r] = dishes[i], below = i ? dishes[i - 1] : [0.6, 4.4], n = Math.round(r * 9);
    for (let k = 0; k < n; k++) {
      const a = (k + rng.range(-0.3, 0.3)) / n * TAU, short = rng.chance(0.3), fall = short ? rng.range(0.3, 1.1) : y - below[0] + 0.1, out = short ? 0 : rng.range(0.05, 0.4), pts = [], rad = [];
      for (let j = 0; j <= 5; j++) { const t = j / 5, rr = r * 0.99 + out * Math.sqrt(t); pts.push([c[0] + Math.cos(a) * rr, y - fall * t, c[1] + Math.sin(a) * rr]); rad.push(short ? 0.05 * (1 - t) + 0.006 : lerp(0.05, 0.03, t)); }
      const ph = rng();
      tubeInto(G, pts, rad, 4, () => ({ aI: [1.05, 0.6, 0, 0], aT: [short ? 0 : -1, ph] }), false);
    }
  }
}
// the ice bench, the low hedges and the beds of ice flowers that give the size of the place
function benchInto(G, c, rot, thick) {
  const i0 = G.idx.length, ex = { aI: [1, 0.55, 0.3, 0.03], aT: [0, 0] }, cr = Math.cos(rot), sr = Math.sin(rot), W = (x, y, z) => [c[0] + x * cr + z * sr, y, c[1] - x * sr + z * cr];
  blockInto(G, W(0, 0.5, 0), [2.6, 0.14, 0.7], rot, ex); blockInto(G, W(0, 0.98, -0.3), [2.6, 0.7, 0.1], rot, ex);
  for (const sx of [-1, 1]) blockInto(G, W(sx * 1.05, 0.22, 0), [0.16, 0.44, 0.6], rot, ex);
  thick.push([i0, G.idx.length]);
}
function bedInto(G, rng, c, rad, n, out) {
  turnedInto(G, new THREE.Matrix4().makeTranslation(c[0], 0, c[1]), [[rad, 0], [rad * 0.96, 0.22], [rad * 0.7, 0.36], [0, 0.42]], 14, { aI: [1, 0.4, 0.4, 0], aT: [0, 0] });
  // each flower is one of two forms (a cup, a spike) on a stem a metre tall, set down leaning and scaled
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU, r = rad * 0.85 * Math.sqrt(rng()), h = rng.range(0.6, 1.5);
    out[rng.chance(0.5) ? 0 : 1].push(standAt([c[0] + Math.cos(a) * r, 0.3, c[1] + Math.sin(a) * r], [rng.range(-0.12, 0.12), 1, rng.range(-0.12, 0.12)], h).multiply(new THREE.Matrix4().makeRotationY(rng() * TAU)));
  }
}
// the two flower forms, a metre tall: a thin stem with a head that trembles
function flowerForm(kind) {
  const G = new Geo(SOLID_SPEC), M = new THREE.Matrix4().makeTranslation(0, 1, 0).multiply(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5)), ex = { aI: [1.05, 0.85, 0.1, 0], aT: [0.3, 0] };
  tubeInto(G, [[0, 0, 0], [0.02, 0.5, 0], [0, 1, 0]], [0.03, 0.025, 0.02], 3, (j) => ({ aI: [1, 0.4, 0, 0], aT: [j * 0.15, 0] }));
  if (kind === 0) turnedInto(G, M, [[0.05, 0], [0.34, 0.12], [0.5, 0.34], [0.4, 0.42]], 6, ex, 6, 0.3);
  else turnedInto(G, M, [[0.04, 0], [0.2, 0.2], [0.16, 0.5], [0, 0.8]], 5, ex);
  return G;
}
function hedgeInto(G, rng, line, thick) {
  // line: [x, z] points 2 m apart; a clipped bank of clear ice with a rounded top, frost in patches on it
  const i0 = G.idx.length, pts = line.map((p) => [p[0], 0.55, p[1]]), ph = rng() * 9;
  const rows = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1, sx = -(b[2] - a[2]) / l, sz = (b[0] - a[0]) / l, row = [];
    const sw = 1 + 0.12 * Math.sin(i * 1.7 + ph), end = Math.min(1, Math.min(i, pts.length - 1 - i) * 0.6 + 0.25);
    for (const [u, y, nx, ny] of [[-0.55, 0, -1, 0], [-0.6, 0.7, -0.9, 0.4], [-0.3, 1.12, -0.4, 0.9], [0.3, 1.12, 0.4, 0.9], [0.6, 0.7, 0.9, 0.4], [0.55, 0, 1, 0]])
      row.push(G.v({ position: [pts[i][0] + sx * u * sw * end, y * sw * end, pts[i][2] + sz * u * sw * end], normal: [sx * nx, ny, sz * nx], aI: [1, 0.5, 0.3, 0.1], aT: [0, 0] }));
    rows.push(row);
  }
  for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < 5; k++) G.quad(rows[i][k], rows[i][k + 1], rows[i + 1][k + 1], rows[i + 1][k]);
  if (thick) thick.push([i0, G.idx.length]);
}

// clear leaves on the fine boughs of an ice tree: each a curved blade 0.25 to 0.4 m long, cupped about its midrib and
// drooping to its tip, white along rib and edge, trembling from its stem; none within `clear` metres of the line
function leavesInto(G, rng, runs, perPoint, keep) {
  const d = new THREE.Vector3(), s = new THREE.Vector3(), n = new THREE.Vector3();
  for (const run of runs) {
    if (run.depth < 2) continue;
    for (let i = 1; i < run.pts.length; i++) for (let k = 0; k < perPoint; k++) {
      const p = run.pts[i]; d.set(rng.range(-1, 1), rng.range(-0.9, 0.5), rng.range(-1, 1)).normalize(); s.set(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1));
      s.addScaledVector(d, -s.dot(d)).normalize(); n.crossVectors(d, s); const len = rng.range(0.25, 0.4), wid = len * 0.3, ph = rng();
      if (keep && !keep(p[0] + d.x * len, p[1] + d.y * len, p[2] + d.z * len)) continue;
      const at = (t, side, lift) => [p[0] + d.x * (0.06 + len * t) + s.x * wid * side + n.x * lift, p[1] + d.y * (0.06 + len * t) + s.y * wid * side + n.y * lift, p[2] + d.z * (0.06 + len * t) + s.z * wid * side + n.z * lift];
      const v = (pos, w, nn) => G.v({ position: pos, normal: nn, aI: [1.05, 0.45, 0, 0], aT: [w, ph] });
      const nl = [n.x - s.x * 0.5, n.y - s.y * 0.5, n.z - s.z * 0.5], nr = [n.x + s.x * 0.5, n.y + s.y * 0.5, n.z + s.z * 0.5], nm = [n.x, n.y, n.z];
      const base = v(at(0, 0, 0), 0.02, nm), rib = v(at(0.5, 0, -len * 0.05), 0.02, nm), tip = v(at(1, 0, -len * 0.22), 1, nm), lf = v(at(0.45, -1, len * 0.07), 1, nl), rt = v(at(0.45, 1, len * 0.07), 1, nr);
      G.tri(base, lf, rib); G.tri(base, rib, rt); G.tri(lf, tip, rib); G.tri(rib, tip, rt);
    }
  }
}

// Builds the inside of the garden of ice in the tent's own frame (x from flap to flap, z across), and shows it while
// the eye is within `o.near` metres of either flap.
export async function buildGardenOfIce(ctx, L, o = {}) {
  const forks = { plan: stream(ctx, 'garden of ice'), fountain: stream(ctx, 'fountain'), hedges: stream(ctx, 'ice hedges'), beds: stream(ctx, 'ice flower beds'), trees: stream(ctx, 'ice trees'), vault: stream(ctx, 'ice boughs over the walk'), leaves: stream(ctx, 'ice leaves'), frost: stream(ctx, 'frost falling') };
  const T = o.tent, route = o.route, dens = clamp(o.density ?? 1, 0.6, 1.4), near = o.near ?? 140, rng = forks.plan, P = PLACES;
  const object = new THREE.Group(); object.position.set(T.x, 0, T.z); object.rotation.y = -T.rot; object.updateMatrixWorld(true);
  // the walk in the tent's frame: the eyes of the route that lie under this canvas
  const walk = [];
  for (let i = 0; i < route.count; i++) { const x = route.eyes[i * 3], y = route.eyes[i * 3 + 1], z = route.eyes[i * 3 + 2]; if (outsideBy(T, x, y, z) < 1) { const l = toLocal(T, x, z); walk.push([l[0], y, l[1]]); } }
  walk.sort((a, b) => a[0] - b[0]);
  const pz = (lx) => { let i = 1; while (i < walk.length - 1 && walk[i][0] < lx) i++; const a = walk[i - 1], b = walk[i]; return lerp(a[2], b[2], clamp((lx - a[0]) / Math.max(1e-6, b[0] - a[0]), 0, 1)); };
  const tanAt = (lx) => { const dz = (pz(lx + 1) - pz(lx - 1)) / 2, l = Math.hypot(1, dz); return [1 / l, dz / l]; };
  const offWalk = (x, y, z) => { let best = Infinity; for (const w of walk) { const e = (w[0] - x) * (w[0] - x) + (w[1] - y) * (w[1] - y) + (w[2] - z) * (w[2] - z); if (e < best) best = e; } return Math.sqrt(best); };
  const span = T.L + T.R, bow = [pz(0), (pz(30) - pz(-30)) / 60, (pz(30) + pz(-30) - 2 * pz(0)) / 1800];
  // floor and mist
  const fg = new THREE.PlaneGeometry(2 * span, 2 * T.R, 1, 1); fg.rotateX(-Math.PI / 2); fg.translate(0, 0.04, 0);
  const uprights = [], floorMat = gardenFloorMaterial(L, T, bow, 0, uprights), floor = new THREE.Mesh(fg, floorMat); object.add(floor);
  const mg = new THREE.BufferGeometry(), mp = [], mi = [];
  [0.5, 1.1, 1.8].forEach((y, k) => { mp.push(-span, y, -T.R, span, y, -T.R, span, y, T.R, -span, y, T.R); mi.push(k * 4, k * 4 + 2, k * 4 + 1, k * 4, k * 4 + 3, k * 4 + 2); });
  mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); mg.setIndex(mi);
  const mist = new THREE.Mesh(mg, gardenFloorMaterial(L, T, bow, 1)); mist.renderOrder = 5; object.add(mist);
  // the trellis walk, the court with its fountain and bench, beds and hedges: one mesh
  await ctx.yield();
  const G = new Geo(SOLID_SPEC), first = -span + 7, step = 5.5, roseAt = [], flowerAt = [[], []], thick = [];
  for (let k = 0; k < 5; k++) { const lx = first + k * step, tn = tanAt(lx); for (const sg of [-1, 1]) uprights.push([lx - tn[1] * sg * 7, pz(lx) + tn[0] * sg * 7, 9, 0.45]); }
  for (let k = 0; k < 5; k++) { const lx = first + k * step; await archInto(G, rng, [lx, pz(lx)], tanAt(lx), { half: 7, leg: 4.5, top: 11, deep: 1.3, roses: Math.round(14 * dens), out: roseAt, pause: () => ctx.yield() }); await ctx.yield(); }
  // (the roses are one form set down many times, each turned its own way)
  const RG = new Geo(SOLID_SPEC); roseInto(RG, [0, 0, 0], [0, 1, 0], 1, rng, { aI: [1.05, 0.8, 0.12, 0], aT: [0, 0] });
  const roses = new THREE.InstancedMesh(RG.build(), iceMaterial(L), roseAt.length); roseAt.forEach((m, i) => roses.setMatrixAt(i, m)); roses.frustumCulled = false; object.add(roses);
  await ctx.yield();
  const court = first + 4 * step + 12, fc = [court, pz(court) - 12];
  fountainInto(G, forks.fountain, fc, thick); uprights.push([fc[0], fc[1], 8, 0.9]);
  await ctx.yield();
  benchInto(G, [court, pz(court) + 8.2], Math.PI, thick);
  const along = (x0, x1, off) => { const line = []; for (let x = x0; x <= x1 + 1e-6; x += 2) line.push([x, pz(x) + off]); return line; };
  const hr = forks.hedges, br = forks.beds;
  hedgeInto(G, hr, along(court - 9, court - 2.6, 9), thick); hedgeInto(G, hr, along(court + 2.6, court + 9, 9), thick);
  { const arc = []; for (let k = 0; k <= 12; k++) { const a = Math.PI * (1.08 + 0.84 * k / 12); arc.push([fc[0] + Math.cos(a) * 7.6, fc[1] + Math.sin(a) * 7.6]); } hedgeInto(G, hr, arc, thick); }
  await ctx.yield();
  const treeX = [court + 12, court + 20, court + 28];
  for (const sg of [-1, 1]) { hedgeInto(G, hr, along(treeX[0] + 2, treeX[1] - 2, sg * 8.8), thick); hedgeInto(G, hr, along(treeX[1] + 2, treeX[2] - 2, sg * 8.8), thick); }
  for (const [lx, off] of [[first + step * 0.5, 9.6], [first + step * 2.5, -9.6], [first + step * 3.5, 9.8], [first + step * 1.5, -9.4], [court - 8, -7.6], [court + 8.5, -7.4], [treeX[2] + 5, 6.8], [treeX[2] + 5, -6.8]])
    { bedInto(G, br, [lx, pz(lx) + off], br.range(1.5, 2.3), Math.round(br.range(18, 26) * dens), flowerAt); await ctx.yield(); }
  const flowerTris = [0, 1].map((k) => { const FG = flowerForm(k), im = new THREE.InstancedMesh(FG.build(), iceMaterial(L), flowerAt[k].length); flowerAt[k].forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; im.renderOrder = 4; object.add(im); return FG.triangles * flowerAt[k].length; });
  await ctx.yield();
  const things = new THREE.Mesh(await G.buildIn(() => ctx.yield()), iceMaterial(L)); object.add(things);
  const thingsFar = new THREE.Mesh(thickPart(things.geometry, thick), iceMaterial(L, true)); object.add(thingsFar);
  await ctx.yield();
  // six ice trees in pairs across the walk, their boughs meeting over it; no bough within 5 m of the line or 1 m of the canvas
  const TG = new Geo(SOLID_SPEC), tr = forks.trees, world = (p) => { const w = toWorld(T, p.x, p.z); return [w[0], p.y, w[1]]; };
  const ease = metered(ctx);
  const grow = { pause: () => ease(0.6), seg: 1.3, wobble: 0.13, lift: 0.05, taper: 0.5, sides: 8, depth: 3, fork0: 0.5, spread: 0.75, shrink: 0.66, kids: (d) => (d === 0 ? tr.int(5, 6) : d === 1 ? 3 : 2),
    thickTo: 1, attr: (d, t, r) => [1, 0.55 + 0.35 * clamp(r * 2, 0, 1), d === 0 ? 0.3 : 0.12, d <= 1 ? Math.min(0.12, r * 0.35) : 0],
    stop: (p, r) => { const w = world(p); return p.y > 15 || offWalk(p.x, p.y, p.z) < 5.3 + r || outsideBy(T, w[0], w[1], w[2]) > -1 - r; } };
  const clearOfLine = (x, y, z) => offWalk(x, y, z) > 5.3, treeThick = [], lr = forks.leaves, vr = forks.vault;
  let tall = 0;
  for (const lx of treeX) for (const sg of [-1, 1]) {
    const out = { runs: [], thick: treeThick }, base = new THREE.Vector3(lx + tr.range(-1, 1), 0, pz(lx) + sg * tr.range(8.3, 9.3));
    await growBranch(TG, tr, base, new THREE.Vector3(0, 1, -sg * 0.1), tr.range(8, 9.5), tr.range(0.42, 0.56), 0, grow, out);
    uprights.push([base.x, base.z, 11, 0.6]);
    await ctx.yield();
    // boughs that arch over the walk from this tree and meet those of the tree across it 11 to 13 m up; twigs hang
    // from them, so that the walk between the trees goes under a vault
    for (let k = 0; k < 3; k++) {
      const x1 = base.x + vr.range(-4.5, 4.5), top = vr.range(11, 13), z1 = pz(x1) - sg * vr.range(0.2, 1.6), y0 = vr.range(6.2, 8), r0 = vr.range(0.13, 0.17);
      const a = [base.x, y0, base.z - sg * 0.2], c = [lerp(base.x, x1, 0.4), top + 2.2, lerp(base.z, z1, 0.42)], pts = [], rad = [], n = 9;
      for (let j = 0; j <= n; j++) { const t = j / n, u = 1 - t; pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * x1, u * u * a[1] + 2 * u * t * c[1] + t * t * top, u * u * a[2] + 2 * u * t * c[2] + t * t * z1]); rad.push(lerp(r0, 0.05, t)); }
      const i0 = TG.idx.length;
      tubeInto(TG, pts, rad, 6, (i) => ({ aI: [1, 0.6, 0.15, Math.min(0.12, rad[i] * 0.35)], aT: [0, 0] }), true); treeThick.push([i0, TG.idx.length]);
      for (let j = 3; j <= n; j += 2) {
        const dir = new THREE.Vector3(vr.range(-1, 1), vr.range(-0.5, 0.6), vr.range(-1, 1)).normalize();
        await growBranch(TG, vr, v3(pts[j]), dir, vr.range(2.2, 3.6), rad[j] * 0.6, 2, grow, out);
      }
    }
    await ctx.yield();
    for (let i = 0; i < out.runs.length; i += 5) { leavesInto(TG, lr, out.runs.slice(i, i + 5), 2, clearOfLine); await ease(2.5); }
    for (const run of out.runs) for (const q of run.pts) tall = Math.max(tall, q[1]);
    await ctx.yield();
  }
  const trees = new THREE.Mesh(await TG.buildIn(() => ctx.yield()), iceMaterial(L)); object.add(trees);
  const treesFar = new THREE.Mesh(thickPart(trees.geometry, treeThick), iceMaterial(L, true)); object.add(treesFar);
  uprights.forEach((u, i) => { if (i < floorMat.uniforms.uPil.value.length) floorMat.uniforms.uPil.value[i].set(u[0], u[1], u[2], u[3]); });
  for (const m of [thingsFar, treesFar]) { m.frustumCulled = false; m.renderOrder = 3; }
  for (const m of [things, trees, roses]) m.renderOrder = 4;
  await ctx.yield();
  const frost = driftMesh(L, forks.frost, Math.round(1500 * dens), { box: [2 * span, 14, 2 * T.R], mid: [0, 7, 0], vel: [0.12, -0.55, 0.07], size: [0.02, 0.05], gain: 2.4, oval: [T.L, T.R] }); object.add(frost);
  for (const m of [floor, mist, things, trees]) m.frustumCulled = false;
  // the whole: the inside, and the sheets its two flaps show when it is not drawn
  const flaps = P.garden.flaps, fa = [flaps[1][0] - flaps[0][0], flaps[1][1] - flaps[0][1]], fl = Math.hypot(fa[0], fa[1]), whole = new THREE.Group();
  const sheets = standInMesh(L, flaps.map((f, i) => { const sg = i ? -1 : 1, ix = fa[0] / fl * sg, iz = fa[1] / fl * sg; return { c: [f[0] + ix * 3, 5.5, f[1] + iz * 3], u: [-iz * 8.5, 0, ix * 8.5], v: [0, 5.5, 0], col: [0.07, 0.086, 0.115] }; }));
  whole.add(object, sheets);
  return { object: whole, forks, triangles: G.triangles + TG.triangles + RG.triangles * roseAt.length + flowerTris[0] + flowerTris[1], tallest: tall, fountain: toWorld(T, fc[0], fc[1]), court: toWorld(T, court, pz(court)), courtSpan: [toWorld(T, court - 9, pz(court - 9)), toWorld(T, court + 9, pz(court + 9))], walk,
    update(dt, time, camera) { const e = camera.matrixWorld.elements, x = e[12], z = e[14]; object.visible = Math.min(Math.hypot(x - flaps[0][0], z - flaps[0][1]), Math.hypot(x - flaps[1][0], z - flaps[1][1])) < near; sheets.visible = !object.visible; } };
}

// ---------------------------------------------------------------- the cloud steps
// A platform of cloud: a handful of soft lumps round a middle, flattened; each lump is one round form set down by the
// vertex shader, swollen and dented by its own seed so that no two are alike. lumps: [centre xyz, phase, offset xyz,
// radius, brightness, bob, squash, seed].
function cloudLumps(list, rng, c, R, lumps, bright, phase, amp) {
  list.push([c[0], c[1], c[2], phase, 0, 0, 0, R * 0.62, bright, amp, 0.5, rng() * 9]);
  for (let k = 0; k < lumps; k++) { const a = (k + rng.range(-0.3, 0.3)) / lumps * TAU, d = R * rng.range(0.42, 0.62), r = R * rng.range(0.36, 0.5); list.push([c[0], c[1], c[2], phase, Math.cos(a) * d, rng.range(-0.06, 0.1) * R, Math.sin(a) * d, r, bright, amp, rng.range(0.45, 0.62), rng() * 9]); }
}
function cloudGeometry(list) {
  const g = new THREE.InstancedBufferGeometry(), base = new THREE.SphereGeometry(1, 8, 6), n = list.length, aC = new Float32Array(n * 4), aL = new Float32Array(n * 4), aB = new Float32Array(n * 4);
  g.setAttribute('position', base.getAttribute('position')); g.setIndex(base.getIndex());
  list.forEach((l, i) => { aC.set(l.slice(0, 4), i * 4); aL.set(l.slice(4, 8), i * 4); aB.set(l.slice(8, 12), i * 4); });
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); g.setAttribute('aL', new THREE.InstancedBufferAttribute(aL, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.instanceCount = n;
  return g;
}
// cloud lit from within: pale all through, brighter on top and along its upper edge, grey beneath; the moon's shaft
// (uShaft: the middle of the crown's hoop and its radius; uShaftN: the way the hoop's round faces, which is the
// roof's own slope; uShaftDir: the way the light goes) whitens whatever stands in it. The shaft is the light that
// comes through the hoop and nothing more: a place is in it when the way back toward the moon from that place goes
// through the hoop's round. The moon stands low against the roof's slope, so the light comes in as a wide thin sheet
// under the roof; it comes on over the first 4 m of its way and falls away from its middle to its side, so that
// where it lands on cloud or cloth it is a soft patch with no straight edge. A moon below the roof's slope sends none
// ringLamps: THE LIGHT OF THE HOOP'S RING OF LAMPS at a place, for cloth and cloud alike. The lamps stand round the
// hoop (its radius R, in its own plane). Each lamp's light falls with the square of the distance, and summed round
// the whole ring that comes to 1 over (the distance to the ring's nearest point times the distance to its farthest):
// that law, set to 1 at a metre outside the ring in its plane. Past two and a quarter radii from the ring it has sunk
// under a third of the dark cloth's own night level, and it is let go from there to three radii, without an edge.
const SHAFT_GLSL = /* glsl */`
uniform vec4 uShaft; uniform vec3 uShaftDir, uShaftN;
float inShaft(vec3 p) { float dn = dot(uShaftDir, uShaftN), t = dot(p - uShaft.xyz, uShaftN) / min(dn, -.03); return smoothstep(-.02, -.08, dn) * smoothstep(0., 4., t) * (1. - smoothstep(uShaft.w * .15, uShaft.w, length(p - uShaftDir * t - uShaft.xyz))); }
float ringLamps(vec3 p) { vec3 q = p - uShaft.xyz; float R = uShaft.w / .95, h = dot(q, uShaftN), rho = length(q - uShaftN * h), dA = max(length(vec2(rho - R, h)), 1.), dB = length(vec2(rho + R, h)); return (2. * R + 1.) / (dA * dB) * (1. - smoothstep(2.25 * R, 3. * R, dA)); }
`;
// its uniforms, made once for a light: the middle of the crown's hoop with its radius, the way the hoop faces (up,
// leaning back down the roof's slope) and the way the moon's light goes
function moonShaft(L) {
  if (!L.shaft) {
    const S = PLACES.steps, ax = head(S.heading), md = L.moonDir, slope = Math.atan2(S.wall1 - S.wall0, S.len);
    L.shaft = { uShaft: { value: new THREE.Vector4(S.flap[0] + ax[0] * S.crownAlong, S.crownY, S.flap[1] + ax[1] * S.crownAlong, S.crownR * 0.95) }, uShaftDir: { value: new THREE.Vector3(-md.x, -md.y, -md.z) },
      uShaftN: { value: new THREE.Vector3(-ax[0] * Math.sin(slope), Math.cos(slope), -ax[1] * Math.sin(slope)) } };
  }
  return L.shaft;
}
function cloudMaterial(L, shaft) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms, ...shaft },
    vertexShader: /* glsl */`
      attribute vec4 aC, aL, aB; uniform float uTime; varying vec3 vW, vN; varying vec2 vB; varying float vUp;
      void main() {
        vec3 n = position; float j0 = aB.w, sy = aB.z * (n.y > 0. ? 1. : .7);
        float bump = 1. + .09 * sin(n.x * 5.1 + j0) * sin(n.z * 4.3 + j0 * 1.7) + .05 * sin(n.y * 7. + j0 * 2.3);
        vec3 p = aC.xyz + aL.xyz + vec3(n.x, n.y * sy, n.z) * aL.w * bump;
        p.y += aB.y * sin(uTime * (.55 + .5 * fract(aC.w * 5.7)) + aC.w * 40.);
        vUp = p.y - aC.y; vB = aB.xy;
        // the normal leans toward the whole platform's own round, so the light runs across its lumps without a crease
        vec3 whole = normalize((aL.xyz + vec3(n.x, n.y * sy, n.z) * aL.w) * vec3(1., 2.6, 1.) + vec3(0., 1e-4, 0.));
        vW = (modelMatrix * vec4(p, 1.)).xyz; vN = normalize(mat3(modelMatrix) * mix(normalize(vec3(n.x * sy, n.y, n.z * sy)), whole, .85)); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec2 vB; varying float vUp;
      ${LIGHT_GLSL} ${SHAFT_GLSL}
      void main() {
        vec3 n = normalize(vN), V = normalize(cameraPosition - vW);
        float up = n.y * .5 + .5, edge = 1. - clamp(abs(dot(n, V)), 0., 1.), soft = nfFbm(vW.xz * .7 + vW.y * .9);
        // lit from within: pale all through, brightest above and along the upper edge, shadowed beneath; the body's own
        // outline is hidden in the soft puffs that wrap it
        float dist = length(cameraPosition - vW);
        float lit = .12 + .7 * smoothstep(.1, .95, up) + .28 * edge * edge * smoothstep(-.4, .6, n.y) + .14 * (soft - .5);
        vec3 col = vec3(.96, .975, 1.) * lit * vB.x;
        col += uMoonCol * inShaft(vW) * (.9 + 2.2 * clamp(dot(n, uMoonDir), 0., 1.));
        // the lamps of the crown's hoop light the cloud near them as they light the cloth (the ring's own law): on the
        // side a lump turns to the hoop, and along its upper edge
        col += ${IVORY} * .42 * ringLamps(vW) * (.25 + .75 * clamp(dot(n, normalize(uShaft.xyz - vW)), 0., 1.) + .6 * edge * edge * smoothstep(-.4, .6, n.y));
        // thin veils hang in the air of the tent: what is far stands greyer and dimmer than what is near
        col = mix(col, vec3(.085, .09, .1), 1. - exp(-dist / 95.));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// soft cloud wrapped round every lump of a platform, and thin veils hanging between the platforms: round patches that
// face the eye, thinning to nothing at their rims. A lump's patch is a little wider than the lump as it shows from
// where the eye is and stands just before its outline, lit as the lump's own rim is, so that no platform has an edge.
// list rows: [centre xyz, size, the platform's phase, its bob, brightness (under 0.3: a veil), the lump's squash]
// A row whose brightness is under 0 is of THE MOON'S SHAFT: -1 a wisp, -2 a mote. Such a patch has no light of its own
// and hides nothing: it is seen only by the moon's light on it, exactly where it stands in the shaft (the same test
// that whitens cloud and cloth), so that together they are the shaft's lit body, a plain slanting beam from the hoop,
// and on a night whose moon stands below the roof's slope none of them shows. A mote is a small round that never
// draws under a pixel and a half across (dimmer for it, as the tent's other motes are) and twinkles as they do.
function cloudPuffs(L, shaft, list) {
  const g = new THREE.InstancedBufferGeometry(), n = list.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4);
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  list.forEach((l, i) => { a.set(l.slice(0, 4), i * 4); b.set(l.slice(4, 8), i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, premultipliedAlpha: true, depthWrite: false, uniforms: { ...L.uniforms, ...shaft },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB; uniform float uTime; varying vec2 vC; varying vec4 vD; varying vec3 vW;
      void main() {
        vec3 c = iA.xyz; c.y += iB.y * sin(uTime * (.55 + .5 * fract(iB.x * 5.7)) + iB.x * 40.);
        vec3 wc = (modelMatrix * vec4(c, 1.)).xyz, V = cameraPosition - wc; float dist = length(V); V /= max(dist, .001);
        vec3 right = normalize(cross(vec3(0., 1., 0.), V) + vec3(1e-4, 0., 0.)), upB = cross(V, right);
        float level = sqrt(max(1. - V.y * V.y, 0.)), tall = sqrt(iB.w * iB.w * level * level + V.y * V.y);
        float mote = step(iB.z, -1.5), sz = mix(iA.w, max(iA.w, .0016 * dist), mote);
        vW = wc + V * sz * .22 + (right * position.x + upB * position.y * tall) * sz;
        float tw = .35 + .65 * step(.55, fract(iB.x * 91. + uTime * (.4 + fract(iB.x * 17.3))));
        vC = position.xy; vD = vec4(mix(level, iA.w * iA.w / (sz * sz) * tw, mote), iB.z, fract(iB.x * 91.7) * 30., dist);
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vC; varying vec4 vD; varying vec3 vW;
      ${LIGHT_GLSL} ${SHAFT_GLSL}
      void main() {
        float r = length(vC), veil = step(vD.y, .3), billow = nfFbm(vC * 1.9 + vD.z + vec2(uTime * .03, 0.));
        if (vD.y < -.5) {
          // of the moon's shaft: its light on a wisp (soft, torn by its own billow) or on a mote, added to what is behind
          float seen = vD.y < -1.5 ? (1. - smoothstep(.3, 1., r)) * vD.x * 2.2 : (1. - smoothstep(.1, 1., r)) * (.35 + .65 * billow) * .13;
          gl_FragColor = vec4(uMoonCol * inShaft(vW) * seen * smoothstep(.6, 2.5, length(cameraPosition - vW)) * exp(-vD.w / 95.), 0.);
          return;
        }
        float ny = vC.y / max(r, .001) * vD.x;
        float body = (1. - smoothstep(.66, 1., r + (billow - .5) * .32)) * mix(.5, 1., smoothstep(.3, .68, r)), thin = (1. - smoothstep(.1, 1., r)) * (.4 + .6 * billow) * .06;
        // (cloud is air one may pass through: a patch thins inside 0.6 to 2.5 m of the lens, by the distance of the
        // very place on the patch that is drawn, and no further off)
        float a = mix(body, thin, veil) * smoothstep(.6, 2.5, length(cameraPosition - vW));
        float lit = mix((.12 + .7 * smoothstep(.1, .95, ny * .5 + .5) + .28 * smoothstep(-.4, .6, ny)) * vD.y, .22, veil);
        vec3 col = vec3(.96, .975, 1.) * lit + uMoonCol * inShaft(vW) * mix(.9 + 2.2 * clamp(ny, 0., 1.), .5, veil);
        // (and the hoop's lamps on it by the ring's own law, as on the lump it wraps: most along its upper edge)
        col += ${IVORY} * .42 * ringLamps(vW) * mix(.35 + .65 * smoothstep(-.3, .9, ny), .4, veil);
        col = mix(col, vec3(.085, .09, .1), 1. - exp(-vD.w / 95.));
        gl_FragColor = vec4(col * a, a);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// the floor of the cloud steps: white spheres packed side by side (drawn into one surface), lit from above by the
// platforms through a small map of their light, with real spheres (kind 1, instanced) lying on top
function sphereFloorMaterial(L, T, map, kind, shaft) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms, ...shaft, uMap: { value: map }, uOval: { value: new THREE.Vector2(T.L, T.R) } },
    vertexShader: /* glsl */`
      attribute vec4 aO; varying vec3 vW, vN, vP;
      void main() {
      #if ${kind} == 1
        vec3 p = position * aO.w + vec3(aO.x, aO.y, aO.z);
      #else
        vec3 p = position;
      #endif
        vP = p; vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(p, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec2 uOval; varying vec3 vW, vN, vP;
      ${LIGHT_GLSL} ${SHAFT_GLSL}
      void main() {
        float d = length(vec2(max(abs(vP.x) - uOval.x, 0.), vP.z)); if (d > uOval.y + .1) discard;
        vec2 muv = vec2(vP.x / (2. * (uOval.x + uOval.y)) + .5, vP.z / (2. * uOval.y) + .5);
        float glow = textureLod(uMap, muv, 0.).r, shade = 1.; vec3 n = normalize(vN);
      #if ${kind} != 1
        // the packed spheres: the nearest of the nine round about, shaded as a dome with dark between
        vec2 g = vP.xz * 1.15, ci = floor(g), cf = fract(g); float best = 9.; vec2 bo = vec2(0.);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j)), c = o + .5 + .36 * (vec2(nfHash(ci + o), nfHash(ci + o + 17.)) - .5) - cf; float e = dot(c, c);
          if (e < best) { best = e; bo = c; }
        }
        float r2 = clamp(best / .3, 0., 1.), dome = sqrt(1. - r2 * .96);
        n = normalize(vec3(-bo.x * 1.6, dome, -bo.y * 1.6)); shade = .3 + .7 * dome;
      #endif
        // lit in pools under the platforms, grey between them, higher on the swells than in the hollows, and dimmer
        // with distance: seen from high on the climb the floor lies far down, small and dim
        float dist = length(cameraPosition - vW), rise = clamp((vP.y - 1.4) / 1.4, -1., 1.);
        float lit = (.03 + .7 * glow * glow) * (.3 + .7 * clamp(n.y, 0., 1.)) * shade * (.75 + .25 * rise) + .04 * (1. - clamp(n.y, 0., 1.)) * glow;
        vec3 col = vec3(.96, .975, 1.) * lit + uMoonCol * inShaft(vW) * clamp(dot(n, uMoonDir), 0., 1.) * 1.6;
        col = mix(col, vec3(.07, .075, .085), 1. - exp(-dist / 80.));
        // toward the wall the floor goes down into the dark at its foot, raggedly, over the last three metres
        col = mix(col, vec3(.011, .012, .014), smoothstep(uOval.y - 3.4, uOval.y - .7, d + (nfNoise(vP.xz * .8 + 5.) - .5) * 1.4));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}
// Builds the inside of the cloud steps in the tent's own frame (x along its axis from the flap end to the high end),
// and shows it while the eye is within `o.near` metres of the tent.
export async function buildCloudSteps(ctx, L, o = {}) {
  const forks = { near: stream(ctx, 'cloud platforms by the line'), far: stream(ctx, 'cloud platforms beyond'), floor: stream(ctx, 'white spheres'), air: stream(ctx, 'wisps and motes'), motes: stream(ctx, 'motes'), slipped: stream(ctx, 'cloud out of the crown'), puffs: stream(ctx, 'puffs out of the crown'), wrap: stream(ctx, 'soft cloud round the platforms'), veils: stream(ctx, 'cloud veils'), beam: stream(ctx, 'wisps and motes in the moon shaft') };
  const T = o.tent, route = o.route, P = PLACES, S = P.steps, dens = clamp(o.density ?? 1, 0.6, 1.4), near = o.near ?? 220, span = T.L + T.R;
  const object = new THREE.Group(), indoors = new THREE.Group(), inner = new THREE.Group(); inner.position.set(T.x, 0, T.z); inner.rotation.y = -T.rot; indoors.add(inner); object.add(indoors); object.updateMatrixWorld(true);
  const walk = [];
  for (let i = 0; i < route.count; i++) { const x = route.eyes[i * 3], y = route.eyes[i * 3 + 1], z = route.eyes[i * 3 + 2]; if (outsideBy(T, x, y, z) < 1) { const l = toLocal(T, x, z); walk.push([l[0], y, l[1]]); } }
  // a platform is a flat round body: R across the level, 0.45 R up and down; its reach toward a direction bounds it
  const reach = (R, ux, uy, uz) => R * Math.hypot(ux, 0.45 * uy, uz);
  const clearOf = (c, R, list, pad) => { for (const w of list) { const dx = w[0] - c[0], dy = w[1] - c[1], dz = w[2] - c[2], l = Math.hypot(dx, dy, dz) || 1e-6; if (l - reach(R, dx / l, dy / l, dz / l) - (w[3] ? reach(w[3], dx / l, dy / l, dz / l) : 0) < pad) return false; } return true; };
  const within = (c, R) => {
    if (c[1] - 0.45 * R < 1.6) return false;
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, w = toWorld(T, c[0] + Math.cos(a) * R, c[2] + Math.sin(a) * R); if (outsideBy(T, w[0], c[1] + 0.45 * R, w[1]) > -1.2) return false; }
    return true;
  };
  // no platform lies under the line: in plan its body keeps a metre and a half from the line wherever the line goes above it
  const underLine = (c, R) => walk.some((w) => w[1] > c[1] && Math.hypot(w[0] - c[0], w[2] - c[2]) < R + 1.5 + bob);
  const placed = [], lumpList = [], puffList = [], bob = 0.4, rw = forks.wrap;
  const put = (rng, c, R, lumps) => {
    const n0 = lumpList.length; placed.push([c[0], c[1], c[2], R]); cloudLumps(lumpList, rng, c, R, lumps, rng.range(0.9, 1.1), rng(), rng.range(0.2, bob));
    // soft cloud about every lump: one patch about its middle, a little wider than the lump
    for (let i = n0; i < lumpList.length; i++) { const l = lumpList[i]; puffList.push([l[0] + l[4], l[1] + l[5], l[2] + l[6], l[7] * rw.range(1.28, 1.4), l[3], l[9], l[8], l[10]]); }
  };
  // by the line: one after another up the climb, to either side by turns, each 5 to 9 m off and none under the line
  const nNear = Math.max(32, Math.round(38 * dens)), rn = forks.near, tl = new THREE.Vector3(), sv = new THREE.Vector3(), wv = new THREE.Vector3(), dv = new THREE.Vector3();
  for (let k = 0; k < nNear; k++) {
    const i = clamp(Math.round(lerp(2, walk.length - 3, (k + rn()) / nNear)), 1, walk.length - 2), e = walk[i], a = walk[i - 1], b = walk[i + 1];
    tl.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); sv.crossVectors(tl, UP).normalize(); wv.crossVectors(sv, tl);
    for (let t = 0; t < 16; t++) {
      const phi = (k % 2 ? 1 : -1) * rn.range(0.35, 2.1), R = rn.range(2.5, 6.5), gap = rn.range(5, 9) + bob;
      dv.copy(wv).multiplyScalar(-Math.cos(phi)).addScaledVector(sv, Math.sin(phi));
      const off = gap + reach(R, dv.x, dv.y, dv.z), c = [e[0] + dv.x * off, e[1] + dv.y * off, e[2] + dv.z * off];
      if (within(c, R) && !underLine(c, R) && clearOf(c, R, walk, 5 + bob) && clearOf(c, R, placed, 0.8)) { put(rn, c, R, rn.int(6, 8)); break; }
    }
    if (k % 8 === 7) await ctx.yield();
  }
  // beyond: through the dark of the tent, none nearer the line than 9 m
  const nFar = Math.max(44 - placed.length, Math.round(30 * dens)), rf = forks.far, plane = (lx) => lerp(S.wall0, S.wall1, clamp((lx + span) / (2 * span), 0, 1));
  for (let k = 0, t = 0; k < nFar && t < nFar * 30; t++) {
    const R = rf.range(2.5, 5.5), lx = rf.range(-span + 5, span - 5), c = [lx, rf.range(3, plane(lx) - 3), rf.range(-T.R + 4, T.R - 4)];
    if (within(c, R) && !underLine(c, R) && clearOf(c, R, walk, 9 + bob) && clearOf(c, R, placed, 1.5)) { put(rf, c, R, rf.int(4, 6)); k++; if (k % 8 === 0) await ctx.yield(); }
    if (t % 60 === 59) await ctx.yield();
  }
  // the moon's shaft: from the crown the way the light goes, as far as the canvas or the floor
  const ax = head(S.heading), top = [S.flap[0] + ax[0] * S.crownAlong, S.crownY, S.flap[1] + ax[1] * S.crownAlong], md = o.moonDir, dir = [-md.x, -md.y, -md.z];
  // the sheets its flap and its crown show when the inside is not drawn: one upright behind the flap, one lying 4 m
  // under the crown along the roof's own slope
  const rise = Math.atan2(S.wall1 - S.wall0, S.len), cr = Math.cos(rise) * 13.5, sr = Math.sin(rise) * 13.5;
  const sheets = standInMesh(L, [
    { c: [S.flap[0] + ax[0] * 3, 5.5, S.flap[1] + ax[1] * 3], u: [-ax[1] * 8.5, 0, ax[0] * 8.5], v: [0, 5.5, 0], col: [0.08, 0.086, 0.1] },
    { c: [top[0], top[1] - 4, top[2]], u: [-ax[1] * 13.5, 0, ax[0] * 13.5], v: [ax[0] * cr, sr, ax[1] * cr], col: [0.11, 0.117, 0.135], round: true }]);
  object.add(sheets);
  let len = 6; while (len < 120 && top[1] + dir[1] * len > 1 && outsideBy(T, top[0] + dir[0] * len, top[1] + dir[1] * len, top[2] + dir[2] * len) < 2) len += 2;
  await ctx.yield();
  const shaft = moonShaft(L);
  const clouds = new THREE.Mesh(cloudGeometry(lumpList), cloudMaterial(L, shaft)); inner.add(clouds);
  await ctx.yield();
  // thin veils hanging in the air between the platforms, under the canvas and off the line. A veil is a round patch
  // that turns about its own middle: with the fifth of its size that it stands toward the eye, no place on it lies
  // further from its middle than 1.024 of its size, and it bobs 0.6 m. That reach is kept 2 m clear of the route's
  // line (every eye of it, with 0.1 m for the 2 m between eyes), as a platform's skin is kept 5 m: a veil that fails
  // is dealt again, up to 30 times, and then left out
  { const rv = forks.veils, nV = Math.round(40 * dens), vBob = 0.6;
    for (let k = 0; k < nV; k++) for (let t = 0; t < 30; t++) {
      const lx = rv.range(-span + 6, span - 6), c = [lx, rv.range(4, Math.max(8, plane(lx) - 7)), rv.range(-T.R + 7, T.R - 7)], size = rv.range(9, 16), ph = rv(), w = toWorld(T, c[0], c[2]);
      if (route.dist(w[0], c[1], w[1]) - size * Math.hypot(1, 0.22) - vBob < 2.1) continue;
      puffList.push([c[0], c[1], c[2], size, ph, vBob, 0.2, 1]); break;
    } }
  // THE MOON'S SHAFT AS A BODY. The moon's light through the hoop is a wide thin sheet lying close under the roof, and
  // it is seen by the wisps and motes that stand in it: they are dealt through its own length, from the hoop to where
  // its middle goes out at the cloth, and across the hoop's own round, each kept only where the shaft's light on it
  // is a quarter of full or more, a metre or more inside the canvas, and clear of the route's line by the veils' own
  // rule (2.1 m beyond its reach and its bob). They show by that light alone (cloudPuffs), so the shaft ends where
  // the light ends, and under a moon too low to send a shaft none is dealt.
  { const rb = forks.beam, c0 = shaft.uShaft.value, sn = shaft.uShaftN.value, R0 = c0.w, cs = Math.cos(rise), sb = Math.sin(rise), dnn = dir[0] * sn.x + dir[1] * sn.y + dir[2] * sn.z;
    const lit = (x, y, z) => { const t = ((x - c0.x) * sn.x + (y - c0.y) * sn.y + (z - c0.z) * sn.z) / Math.min(dnn, -0.03); return smoothstep(-0.02, -0.08, dnn) * smoothstep(0, 4, t) * (1 - smoothstep(R0 * 0.15, R0, Math.hypot(x - dir[0] * t - c0.x, y - dir[1] * t - c0.y, z - dir[2] * t - c0.z))); };
    const deal = (n, s0, s1, kind, bobK) => { for (let k = 0; k < n; k++) for (let t = 0; t < 12; t++) {
      const along = rb.range(2, len), a = rb() * TAU, q = R0 * Math.sqrt(rb()), u = Math.cos(a) * q, v = Math.sin(a) * q, size = rb.range(s0, s1), ph = rb();
      const x = c0.x + dir[0] * along - ax[1] * u + ax[0] * cs * v, y = c0.y + dir[1] * along + sb * v, z = c0.z + dir[2] * along + ax[0] * u + ax[1] * cs * v;
      if (lit(x, y, z) < 0.25 || outsideBy(T, x, y, z) > -1 || route.dist(x, y, z) - size * Math.hypot(1, 0.22) - bobK < 2.1) continue;
      const l = toLocal(T, x, z); puffList.push([l[0], y, l[1], size, ph, bobK, kind, 1]); break;
    } };
    deal(Math.round(90 * dens), 2.5, 4.5, -1, 0.6); deal(Math.round(600 * dens), 0.03, 0.06, -2, 0.6); }
  inner.add(cloudPuffs(L, shaft, puffList));
  await ctx.yield();
  // cloud slipping out of the crown: thin torn wisps and a few small soft puffs that leave over the hoop's downwind rim
  // and stream away down the wind at the hoop's own height, thinning as they go and gone within 60 m. Their box begins
  // over the downwind half of the hoop and lies down the wind (its own frame: x down the wind from the hoop's middle).
  const wd = L.windDir, ws = 1.6 + 3.4 * L.wind, slip = new THREE.Group(); slip.position.set(top[0], top[1] + 1.5, top[2]); slip.rotation.y = Math.atan2(-wd[1], wd[0]); object.add(slip);
  slip.add(driftMesh(L, forks.slipped, Math.round(70 * dens), { box: [60, 7, 20], mid: [30 + S.crownR * 0.6, 0, 0], vel: [ws, 0.12, 0], size: [1.4, 4.2], stretch: 2.4, gain: 0.075, soft: 1, wobble: 0.8, thin: 1 }));
  slip.add(driftMesh(L, forks.puffs, 9, { box: [60, 5, 14], mid: [30 + S.crownR * 0.6, 0.5, 0], vel: [ws * 0.8, 0.1, 0], size: [3.2, 5.5], stretch: 1.3, gain: 0.1, soft: 1, wobble: 0.5, thin: 1, full: 1 }));
  await ctx.yield();
  // the light the platforms throw on the floor, as a small map in the tent's frame
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g2 = cv.getContext('2d'); g2.fillStyle = '#000'; g2.fillRect(0, 0, 128, 64); g2.globalCompositeOperation = 'lighter';
  for (const [x, y, z, R] of placed) {
    const px = (x / (2 * span) + 0.5) * 128, py = (z / (2 * T.R) + 0.5) * 64, pr = (R * 1.3 + y * 0.3) * 128 / (2 * span), v = Math.round(255 * clamp(0.95 / (1 + y / 7), 0.06, 1));
    const gr = g2.createRadialGradient(px, py, 0, px, py, pr); gr.addColorStop(0, `rgb(${v},${v},${v})`); gr.addColorStop(1, '#000'); g2.fillStyle = gr; g2.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  const map = new THREE.CanvasTexture(cv); map.flipY = false; map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; map.generateMipmaps = false; map.minFilter = THREE.LinearFilter;
  await ctx.yield();
  // the floor lies level at the flap and in swells and hollows from there on in (full by 28 m from the flap)
  const swell = (x, z) => 0.3 + (0.9 * Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.17 + 0.4) + 0.5 * Math.sin(x * 0.23 + z * 0.19) + 1.1) * smoothstep(-span, -span + 28, x);
  const fg = new THREE.PlaneGeometry(2 * span, 2 * T.R, 44, 18); fg.rotateX(-Math.PI / 2);
  { const fp = fg.getAttribute('position'); for (let i = 0; i < fp.count; i++) fp.setY(i, swell(fp.getX(i), fp.getZ(i))); }
  const floor = new THREE.Mesh(fg, sphereFloorMaterial(L, T, map, 0, shaft)); inner.add(floor);
  // real spheres on top: thickest along the middle, under the route's line
  const rs = forks.floor, detail = ctx.quality?.detail ?? 1, nS = Math.round(900 * clamp(dens, 0.8, 1.1) * (detail > 0.7 ? 1 : 0.6)), sg = new THREE.InstancedBufferGeometry(), base = new THREE.IcosahedronGeometry(1, 0), aO = new Float32Array(nS * 4);
  for (const k of ['position', 'normal']) sg.setAttribute(k, base.getAttribute('position'));
  sg.setIndex(base.getIndex());
  let ballTop = 0;
  // (real spheres lie only within 40 m of the line; beyond, the floor's own drawn spheres do)
  const farFromLine = (x, z) => { for (const w of walk) if (Math.hypot(w[0] - x, w[1] - 1, w[2] - z) < 40) return false; return true; };
  for (let i = 0, t = 0; i < nS && t < nS * 12; t++) {
    const r = rs.range(0.28, 0.62) * (rs.chance(0.06) ? 1.7 : 1), lx = rs.range(-span + 1, span - 1), lz = (rs() + rs() - 1) * (T.R - 1), up = rs.range(0.55, 0.95);
    if (t % 500 === 499) await ctx.yield();
    if (farFromLine(lx, lz)) continue;
    const y = swell(lx, lz) + r * up; aO.set([lx, y, lz, r], i * 4); ballTop = Math.max(ballTop, y + r); i++;
  }
  sg.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 4)); sg.instanceCount = nS;
  const balls = new THREE.Mesh(sg, sphereFloorMaterial(L, T, map, 1, shaft)); inner.add(balls);
  await ctx.yield();
  // wisps streaming up to the crown, and motes
  const roof = [S.wall0, S.wall1, span], ra = forks.air;
  const wisps = driftMesh(L, ra, Math.round(260 * dens), { box: [2 * span, 60, 2 * T.R], mid: [0, 30, 0], vel: [0.9, 1.3, 0], size: [1.2, 3.2], gain: 0.05, soft: 1, wobble: 1.2, oval: [T.L, T.R], roof });
  const motes = driftMesh(L, forks.motes, Math.round(1100 * dens), { box: [2 * span, 60, 2 * T.R], mid: [0, 30, 0], vel: [0.1, 0.25, 0.05], size: [0.025, 0.06], gain: 2.2, oval: [T.L, T.R], roof });
  inner.add(wisps, motes);
  for (const m of [clouds, floor, balls]) m.frustumCulled = false;
  return { object, forks, platforms: placed.length, under: placed.filter((q) => underLine(q, q[3])).length, triangles: lumpList.length * 120 + nS * 32 + 2, shaftLength: len, floorTop: ballTop, walk,
    // the drawn floor's height at a place, and the spheres that lie on it (tent's own frame: x, y, z, radius)
    floorAt: (x, z) => { const l = toLocal(T, x, z); return swell(l[0], l[1]); }, spheres: aO,
    // (drawn within its distance of the flap, in plan, or of the open crown)
    update(dt, time, camera) { const e = camera.matrixWorld.elements; indoors.visible = Math.min(Math.hypot(e[12] - S.flap[0], e[14] - S.flap[1]), Math.hypot(e[12] - top[0], e[13] - top[1], e[14] - top[2])) < near; sheets.visible = !indoors.visible; } };
}

// ---------------------------------------------------------------- the candle tree
// Bare black wood: a dull sheen from the moon, a low ivory light from its own candles (aI.y), wax run down the upper
// sides of the boughs (aI.z).
function barkMaterial(L) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms },
    vertexShader: /* glsl */`
      attribute vec4 aI; varying vec3 vW, vN; varying vec4 vI;
      void main() { vW = (modelMatrix * vec4(position, 1.)).xyz; vN = normalize(mat3(modelMatrix) * normal); vI = aI; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec4 vI;
      ${LIGHT_GLSL}
      void main() {
        vec3 n = normalize(vN), V = normalize(cameraPosition - vW);
        // wax: white ropes that have run down the bark from the candles, a hand wide and one to three metres long,
        // thickest on the upper side; the bark between them stays black
        float ridge = nfNoise(vec2(vW.x * 2.1 + vW.z * 2.1, vW.y * .45));
        float rope = smoothstep(.66, .74, nfNoise(vec2(vW.x * 4.3 + vW.z * 3.7, vW.y * .42))) * (.45 + .55 * smoothstep(-.6, .5, n.y));
        float drip = smoothstep(.55, .9, n.y) * smoothstep(.5, .66, nfNoise(vW.xz * 2.6 + vW.y * .7));
        float wax = vI.z * clamp(rope + drip * .8, 0., 1.);
        vec3 alb = mix(vec3(.02, .019, .022) * (.6 + .8 * ridge), vec3(.72, .69, .6), wax);
        // the candles' light: small pools on the upper side about them, more on the wax than on the bark
        float pool = vI.y * smoothstep(.2, .9, n.y) * smoothstep(.35, .75, nfNoise(vW.xz * .9 + vW.y * .6 + 3.));
        // (the wax lies under the crown's own boughs and candles: little of the sky and the moon finds it, the flames do)
        vec3 light = (nfHemi(n) + nfMoon(n, .15)) * (1. - .62 * wax) + nfFire(vW, n, .2) + vec3(1., .9, .72) * pool * (.5 + 1.6 * wax);
        float rim = pow(1. - clamp(dot(n, V), 0., 1.), 4.);
        vec3 col = alb * light + (uMoonCol * .03 + vec3(1., .9, .72) * vI.y * .06) * rim;
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW)), 1.);
      }`,
  });
}
// candles (kind 0: six-sided wax bodies) and their flames (kind 1: small upright sheets that face the eye)
// list: [x, y, z, height, radius, phase, run, along]; a flame passes along the boughs marked run > 0
function candleMesh(L, list, kind) {
  const g = new THREE.InstancedBufferGeometry(), n = list.length, aO = new Float32Array(n * 4), aQ = new Float32Array(n * 4);
  if (kind === 0) { const c = new THREE.CylinderGeometry(1, 1.12, 1, 5, 1, true); c.translate(0, 0.5, 0); g.setAttribute('position', c.getAttribute('position')); g.setAttribute('normal', c.getAttribute('normal')); g.setIndex(c.getIndex()); }
  else { g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); }
  list.forEach((c, i) => { aO.set([c[0], c[1], c[2], c[3]], i * 4); aQ.set([c[4], c[5], c[6], c[7]], i * 4); });
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 4)); g.instanceCount = n;
  const flame = kind === 1, m = new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms }, transparent: flame, depthWrite: !flame, blending: flame ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */`
      attribute vec4 aO, aQ; uniform float uTime; uniform vec4 uWind; varying vec3 vW, vN; varying vec2 vQ; varying float vH, vA;
      void main() {
      #if ${kind} == 0
        vec3 p = vec3(position.x * aQ.x, position.y * aO.w, position.z * aQ.x) + aO.xyz; vH = position.y; vA = 1.; vQ = vec2(0.);
        vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(p, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      #else
        // the flame stands on the wick: 0.35 to 0.6 m tall by its own draw; its patch is a metre wide for the glow it
        // lays about itself, and never smaller on screen than a point of light
        float tall = .35 + .25 * fract(aQ.y * 7.7), reach = .5;
        vec3 base = aO.xyz + vec3(0., aO.w + tall * .5, 0.); vW = (modelMatrix * vec4(base, 1.)).xyz; vN = vec3(0., 1., 0.);
        vec4 mv = viewMatrix * vec4(vW, 1.); float dist = length(mv.xyz), k = max(reach, .0018 * dist);
        float fl = .86 + .14 * sin(uTime * (9. + 5. * fract(aQ.y * 3.3)) + aQ.y * 50.) + .1 * sin(uTime * 3.1 + aQ.y * 17.);
        // a flame passing from candle to candle along a bough: each flares as it goes by
        float pass = aQ.z > 0. ? 1. - smoothstep(0., .07, abs(fract(uTime * .09 + aQ.z) - aQ.w)) : 0.;
        mv.xy += position.xy * k;
        // (in the patch's own measure: the flame's half height and half width, its lean with the wind and its flicker)
        vQ = position.xy * k; vH = tall * .5 * fl * (1. + .8 * pass); vA = (reach * reach) / (k * k) * (1. + 2.5 * pass);
        vN = vec3(.05 * sin(uTime * 2.3 + aQ.y * 30.) + .1 * uWind.z, 0., 0.);
        gl_Position = projectionMatrix * mv;
      #endif
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec2 vQ; varying float vH, vA;
      ${LIGHT_GLSL}
      void main() {
      #if ${kind} == 0
        vec3 n = normalize(vN); float top = smoothstep(.35, 1., vH);
        vec3 col = vec3(.6, .575, .5) * ((nfHemi(n) + nfMoon(n, .2)) * .22 + vec3(1., .88, .66) * (.03 + 1.2 * top * top));
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW)), 1.);
      #else
        // a teardrop: round below, drawn to a point above, leaning; about it a soft round glow half a metre out
        float y = vQ.y / max(vH, .01), w = .5 + .5 * clamp(y, -1., 1.), x = (vQ.x - vN.x * (y + 1.)) / max(vH * .42 * (.28 + .72 * (1. - w) * (1. - w * .35)), .004);
        float d = length(vec2(x, y * (y > 0. ? 1. : 1.5)));
        float a = 1. - smoothstep(.25, 1., d), core = 1. - smoothstep(0., .75, d);
        float halo = 1. - smoothstep(0., .5, length(vQ)); halo *= halo;
        // (the glow is laid on the bark and the wax by their own shader; in the air about a flame there is only a breath of it,
        // or the hundreds of them would add up to a grey veil over the black wood)
        vec3 col = mix(vec3(1., .8, .5), vec3(1., .91, .72), core) * ((1. + 1.3 * core) * a + .004 * halo);
        gl_FragColor = vec4(col * vA, 1.);
      #endif
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; if (flame) mesh.renderOrder = 3;
  return mesh;
}

// Builds the candle tree: the trunk through the collar tent, the fork, the two great limbs either side of the ring, the
// hoop of wood that seats the portal, the boughs of the crown and the candles on them. No wood or candle comes within
// 8 m of the route's line.
export async function buildCandleTree(ctx, L, o = {}) {
  const forks = { wood: stream(ctx, 'candle tree boughs'), candles: stream(ctx, 'candles'), flame: stream(ctx, 'flame along the boughs') };
  // where the passing flame stands on its first bough when the world clock starts (the boughs follow a seventh apart)
  const flame0 = 0.02 + 0.98 * forks.flame();
  const P = PLACES, route = o.route, dens = clamp(o.density ?? 1, 0.6, 1.4), rng = forks.wood, c0 = P.tree, G = new Geo(SOLID_SPEC);
  // the frame of the last straight: along the flight, and across it
  const E = route.eyes, n = route.count, ax = new THREE.Vector3(E[(n - 1) * 3] - E[(n - 6) * 3], 0, E[(n - 1) * 3 + 2] - E[(n - 6) * 3 + 2]).normalize(), side = new THREE.Vector3(-ax.z, 0, ax.x);
  const wood = (glow, wax) => ({ aI: [1, glow, wax, 0], aT: [0, 0] }), at3 = (s, y, a = 0) => [c0[0] + side.x * s + ax.x * a, y, c0[1] + side.z * s + ax.z * a];
  const forkY = 14, top = P.treeTop, off = P.limbOff, ringY = P.ringY, runs = [];
  // the eyes of the route that pass within 70 m of the tree in plan: the only ones that can come within 8 m of its wood
  const by = []; for (let i = 0; i < n; i++) if (Math.hypot(E[i * 3] - c0[0], E[i * 3 + 2] - c0[1]) < 70) by.push(E[i * 3], E[i * 3 + 1], E[i * 3 + 2]);
  const lineDist = (x, y, z) => { let b = Infinity; for (let i = 0; i < by.length; i += 3) { const d = (by[i] - x) ** 2 + (by[i + 1] - y) ** 2 + (by[i + 2] - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
  // trunk: 4 m thick, flared at the root
  tubeInto(G, [at3(0, -0.5), at3(0, 1.2), at3(0.15, 4), at3(-0.1, 9), at3(0, forkY)], [3.3, 2.4, 2.05, 2.0, 2.1], 14, () => wood(0.12, 0));
  // the two limbs: out from the fork, up either side of the ring, a little inward again at the top
  for (const sg of [-1, 1]) {
    const pts = [], rad = [], ctl = [[0, forkY - 1.5, 0], [0.42, forkY + 1.2, 0.2], [0.78, forkY + 4.2, 0.2], [1.02, ringY - 2.5, 0], [1.1, ringY + 2, 0], [1.08, ringY + 6.5, 0.3], [0.95, top - 3.5, 0.8], [0.8, top, 1.2]];
    for (let i = 0; i < ctl.length - 1; i++) for (let k = 0; k < 4; k++) { const t = k / 4, a = ctl[i], b = ctl[i + 1]; pts.push(at3(sg * off * lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t))); }
    pts.push(at3(sg * off * 0.8, top, 1.2));
    // eased through the corners
    for (let pass = 0; pass < 2; pass++) for (let i = 1; i < pts.length - 1; i++) for (let k = 0; k < 3; k++) pts[i][k] = (pts[i - 1][k] + 2 * pts[i][k] + pts[i + 1][k]) / 4;
    for (let i = 0; i < pts.length; i++) rad.push(lerp(1.45, 0.3, Math.pow(i / (pts.length - 1), 0.85)));
    tubeInto(G, pts, rad, 10, (i) => wood(0.25 + 0.35 * i / pts.length, 0.6), true);
    runs.push({ pts, radii: rad, depth: 0, sg });
  }
  await ctx.yield();
  // the seat of the portal: a hoop of wood round the ring, in the plane across the flight
  const hoop = [], hr = P.ringR + 0.9;
  for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU; hoop.push(at3(Math.cos(a) * hr, ringY + Math.sin(a) * hr, 0.15)); }
  tubeInto(G, hoop, hoop.map(() => 0.34), 7, () => wood(0.5, 0.7));
  for (const sg of [-1, 1]) tubeInto(G, [at3(sg * hr, ringY, 0.15), at3(sg * (off * 1.08 - 0.5), ringY + 0.4, 0.05)], [0.3, 0.34], 6, () => wood(0.4, 0.5));
  runs.push({ pts: hoop.slice(2, 19), radii: hoop.map(() => 0.34), depth: 1, sg: 0 });
  // the boughs: outward, upward and beyond; stopped at 8 m from the line, at the crown's width and over the collar's roof
  const keep = 8, wide = 17, low = 18.5, lowIn = 13.5;
  const ease = metered(ctx);
  const grow = { pause: () => ease(0.3), seg: 1.5, wobble: 0.16, lift: 0.06, taper: 0.42, sides: 7, depth: 3, fork0: 0.3, spread: 0.7, shrink: 0.62, kids: (d) => (d === 1 ? rng.int(3, 4) : d === 2 ? rng.int(2, 3) : 0),
    attr: (d, t) => [1, 0.5 + 0.2 * t, 0.75, 0],
    stop: (p, r) => { const rr = Math.hypot(p.x - c0[0], p.z - c0[1]); return p.y > top + 1 || p.y < (rr < 12 ? lowIn : low) || rr > wide || lineDist(p.x, p.y, p.z) < keep + r + 0.4; } };
  const growOver = { ...grow, lift: 0.012, wobble: 0.1, stop: (p, r) => p.y > top + 3 || Math.hypot(p.x - c0[0], p.z - c0[1]) > wide || lineDist(p.x, p.y, p.z) < keep + r + 0.4 };
  for (const limb of runs.slice(0, 2)) {
    // boughs leave the limb to every side, unevenly: outward, forward and back along the flight, up, and some down
    // under the ring, so that the crown is one round head and not two fans
    const nb = rng.int(15, 17);
    for (let k = 0; k < nb; k++) {
      const i = Math.round(lerp(limb.pts.length * 0.2, limb.pts.length - 1, (k + rng()) / nb)), p = limb.pts[Math.min(limb.pts.length - 1, i)], out = { runs: [] }, axc = rng.range(-1.3, 1.3);
      const d = new THREE.Vector3().copy(side).multiplyScalar(limb.sg * rng.range(0.15, 1)).addScaledVector(ax, axc); d.y = p[1] > ringY && rng.chance(0.22) ? rng.range(-0.4, 0.1) : rng.range(0.1, 0.95);
      await growBranch(G, rng, v3(p), d, rng.range(7, 11.5) * (1 + 0.5 * Math.min(1, Math.abs(axc))), limb.radii[Math.min(limb.radii.length - 1, i)] * 0.55 + 0.08, 1, grow, out);
      for (const r of out.runs) runs.push(r);
      if (k % 3 === 2) await ctx.yield();
    }
    // over the ring and under it: boughs from the limb's head run in nearly level across the ring's crown (between
    // the 8 m kept from the line and 3 m over the limbs' tops they do not curl up as the others do), and a few from
    // its foot pass in beneath the ring, so that the two limbs' heads close into one
    for (let k = 0; k < 8; k++) {
      const over = k < 6, f = over ? rng.range(0.8, 0.98) : rng.range(0.1, 0.22), i = Math.min(limb.pts.length - 1, Math.round(limb.pts.length * f)), out = { runs: [] };
      const d = new THREE.Vector3().copy(side).multiplyScalar(-limb.sg * rng.range(0.6, 1)).addScaledVector(ax, rng.range(-0.8, 0.8)); d.y = over ? rng.range(-0.04, 0.24) : rng.range(-0.15, 0.1);
      await growBranch(G, rng, v3(limb.pts[i]), d, over ? rng.range(9, 13.5) : rng.range(6, 9), limb.radii[i] * 0.55 + 0.1, 1, over ? growOver : grow, out);
      for (const r of out.runs) runs.push(r);
    }
    await ctx.yield();
  }
  const tree = new THREE.Mesh(await G.buildIn(() => ctx.yield()), barkMaterial(L)); tree.frustumCulled = false;
  await ctx.yield();
  // candles: along the upper side of every bough, limb and the hoop's upper half, a pace or so apart
  const rc = forks.candles, spots = [];
  runs.forEach((run, ri) => {
    let acc = rc.range(0, 0.9), total = 0; const lens = [];
    for (let i = 1; i < run.pts.length; i++) { const a = run.pts[i - 1], b = run.pts[i]; lens.push(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); total += lens[i - 1]; }
    let done = 0;
    for (let i = 1; i < run.pts.length; i++) {
      const a = run.pts[i - 1], b = run.pts[i], l = lens[i - 1], steep = Math.abs(b[1] - a[1]) / Math.max(l, 1e-6);
      while (acc < l) { const t = acc / l, r = lerp(run.radii[i - 1], run.radii[i], t); if (steep < 0.93 && r > 0.035) spots.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + r * 0.8, lerp(a[2], b[2], t), ri, (done + acc) / Math.max(total, 1e-6), run.depth]); acc += rc.range(0.3, 0.52); }
      acc -= l; done += l;
    }
  });
  await ctx.yield();
  // (draws in place: a shuffle by this stream, then as many as the density asks)
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rc() * (i + 1)), t = spots[i]; spots[i] = spots[j]; spots[j] = t; }
  const want = Math.min(spots.length, clamp(Math.round(1800 * dens), 1600, 2000)), list = [];
  for (let i = 0; i < spots.length && list.length < want; i++) { const s = spots[i], h = rc.range(0.6, 1.1), pass = s[5] === 1 && s[3] % 3 === 0; if (lineDist(s[0], s[1] + h + 0.6, s[2]) >= keep + 0.6) list.push([s[0], s[1], s[2], h, rc.range(0.075, 0.11), rc(), pass ? flame0 + (s[3] % 7) / 7 : 0, s[4]]); }
  await ctx.yield();
  const object = new THREE.Group(); object.add(tree, candleMesh(L, list, 0)); await ctx.yield(); object.add(candleMesh(L, list, 1));
  await ctx.yield();
  return { object, forks, candles: list.length, spots: spots.length, triangles: G.triangles + list.length * 18, update() {} };
}

// ---------------------------------------------------------------- visitors
// Plain dark upright shapes, 1.7 m tall, strolling to and fro each on its own short walk; about one in twelve wears a
// scrap of red at the neck. None is ever within `o.keep` metres of the route's line, at any point of its walk.
export async function buildVisitors(ctx, L, o = {}) {
  const forks = { lane: stream(ctx, 'visitors in the gate lane'), lanes: stream(ctx, 'visitors in the lanes'), court: stream(ctx, 'visitors in the courtyard'), steps: stream(ctx, 'visitors in the cloud steps') };
  let rng = forks.lane; const P = PLACES, route = o.route, tents = o.tents, keep = o.keep ?? 40, dens = clamp(o.density ?? 1, 0.6, 1.4), want = Math.round(rng.int(220, 300) * dens);
  const free = (x, y, z) => { if (route.near(x, y + 0.9, z, keep + 0.5)) return false; for (const T of tents) { if (T === o.within || Math.abs(x - T.x) > T.L + T.R + 2 || Math.abs(z - T.z) > T.L + T.R + 2) continue; const l = toLocal(T, x, z), cx = clamp(l[0], -T.L, T.L); if (Math.hypot(l[0] - cx, l[1]) < T.R + 1.6) return false; } return true; };
  const list = [], gate = P.gate, clock = P.clock, lane = [clock[0] - gate[0], clock[1] - gate[1]], laneLen = Math.hypot(lane[0], lane[1]), ln = [lane[0] / laneLen, lane[1] / laneLen];
  const tryWalk = (x, z, dx, dz, len, y = 0) => {
    for (let k = 0; k <= 4; k++) if (!free(x + dx * len * k / 4, y, z + dz * len * k / 4)) return false;
    list.push([x, y, z, rng(), dx * len, dz * len, rng.range(0.7, 1.25) / len, rng.range(0.92, 1.08), rng.range(0.5, 1.2), rng.chance(1 / 12) ? 1 : 0]); return true;
  };
  const shares = [[0.34, () => { const t = rng.range(-0.22, 0.95), w = rng.range(-5.5, 5.5), sg = rng.chance(0.7) ? 1 : -1; return [gate[0] + ln[0] * laneLen * t - ln[1] * w, gate[1] + ln[1] * laneLen * t + ln[0] * w, ln[0] * sg, ln[1] * sg, rng.range(8, 20)]; }],
    [0.42, () => { const r = rng.pick([(P.rings[0] + P.rings[1]) / 2, (P.rings[1] + P.rings[2]) / 2, P.rings[2] + 16]) + rng.range(-5, 5), b = rng() * 360, p = at(r, b), sg = rng.chance(0.5) ? 1 : -1, tb = (b + 90 + rng.range(-25, 25)) * RAD; return [p[0], p[1], Math.sin(tb) * sg, Math.cos(tb) * sg, rng.range(6, 16)]; }],
    [0.24, () => { const p = at(rng.range(30, 45), rng.range(255, 345)), a = rng() * TAU; return [p[0], p[1], Math.cos(a), Math.sin(a), rng.range(3, 8)]; }]];
  for (const [si, [share, draw]] of shares.entries()) {
    rng = [forks.lane, forks.lanes, forks.court][si];
    const n = Math.round(want * share);
    for (let got = 0, t = 0; got < n && t < n * 25; t++) {
      const [x, z, dx, dz, len] = draw(), end = [x + dx * len, z + dz * len];
      if (Math.hypot(end[0] - FIRE[0], end[1] - FIRE[1]) < 12 || Math.hypot(x - FIRE[0], z - FIRE[1]) < 12) continue;
      if (tryWalk(x, z, dx, dz, len)) got++;
      if (t % 60 === 59) await ctx.yield();
    }
    await ctx.yield();
  }
  // a few at the foot of the high wall in the cloud steps, far below the climb
  rng = forks.steps;
  if (o.within) { const T = o.within; for (let k = 0, t = 0; k < 9 && t < 200; t++) { const w = toWorld(T, rng.range(T.L + 4, T.L + T.R - 4), rng.range(-T.R + 6, T.R - 6)), a = rng() * TAU; if (tryWalk(w[0], w[1], Math.cos(a), Math.sin(a), rng.range(1.5, 4), o.floorTop ?? 1)) k++; } }
  const mesh = figureMesh(L, list);
  return { object: mesh, forks, count: list.length, red: list.filter((v) => v[9]).length, list, triangles: list.length * 60, update() {} };
}
// A far figure: a small dark shape that walks to and fro along its own straight walk on the world's clock.
// rows: [start x y z, phase, the walk's x and z, to-and-fros a second, height, tone, a scrap of red at the neck or not]
const WALK_GLSL = /* glsl */`
vec3 walkAt(vec4 aA, vec4 aB, float time) { float tri = abs(fract(time * aB.z + aA.w) * 2. - 1.), ease = tri * tri * (3. - 2. * tri); return vec3(aA.x + aB.x * ease, aA.y, aA.z + aB.y * ease); }
`;
export function figureMesh(L, list) {
  const body = new Geo({ position: 3, normal: 3 });
  { const prof = [[0.13, 0], [0.2, 0.8], [0.25, 1.12], [0.24, 1.36], [0.09, 1.46], [0.12, 1.6], [0, 1.7]], rows = [];
    for (let j = 0; j < prof.length; j++) { const a = prof[Math.max(0, j - 1)], b = prof[Math.min(prof.length - 1, j + 1)], dr = b[0] - a[0], dh = b[1] - a[1], l = Math.hypot(dr, dh) || 1, row = []; for (let k = 0; k <= 5; k++) { const an = k / 5 * TAU; row.push(body.v({ position: [prof[j][0] * Math.cos(an), prof[j][1], prof[j][0] * 0.72 * Math.sin(an)], normal: [Math.cos(an) * dh / l, -dr / l, Math.sin(an) * dh / l] })); } rows.push(row); }
    for (let j = 0; j < rows.length - 1; j++) for (let k = 0; k < 5; k++) body.quad(rows[j][k], rows[j + 1][k], rows[j + 1][k + 1], rows[j][k + 1]); }
  const g = new THREE.InstancedBufferGeometry(), bg = body.build(), n = list.length, aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aC = new Float32Array(n * 2);
  g.setAttribute('position', bg.getAttribute('position')); g.setAttribute('normal', bg.getAttribute('normal')); g.setIndex(bg.getIndex());
  list.forEach((v, i) => { aA.set([v[0], v[1], v[2], v[3]], i * 4); aB.set([v[4], v[5], v[6], v[7]], i * 4); aC.set([v[8], v[9]], i * 2); });
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 2)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms },
    vertexShader: /* glsl */`
      attribute vec4 aA, aB; attribute vec2 aC; uniform float uTime; varying vec3 vW, vN; varying vec2 vC; varying float vY;
      ${WALK_GLSL}
      void main() {
        float stride = uTime * 5.5 + aA.w * 40.;
        vec3 p = position * aB.w; vY = position.y;
        p.x += .03 * sin(stride) * position.y; p.y += .025 * abs(sin(stride));
        p += walkAt(aA, aB, uTime);
        vC = aC; vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(p, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec2 vC; varying float vY;
      ${LIGHT_GLSL}
      void main() {
        // (the scrap of red: a scarf from the neck down over the shoulders and breast, half a metre of the figure's height)
        vec3 n = normalize(vN); float scrap = step(.5, vC.y) * step(.98, vY) * step(vY, 1.5);
        vec3 alb = mix(vec3(.035, .036, .04) * vC.x, vec3(.58, .006, .028), scrap);
        vec3 col = alb * (nfHemi(n) + nfMoon(n, .3) + nfFire(vW, n, .3) * nfBars(vW)) + vec3(.58, .006, .028) * scrap * .22;
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW)), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}
// lanterns carried by walkers. A LANTERN'S LIGHT HAS ONE SIZE IN THE WORLD AT EVERY DISTANCE: a small ivory light at the
// hand, 0.44 m across, with a faint soft glow 1 m across about it (one patch for both); its pool of 2 m on the ground;
// and its halo where it goes through the mist, as strong as the mist is thick at the lantern's own place. All of them
// go with the walker and are the same from everywhere
function lanternMesh(L, list) {
  const g = new THREE.InstancedBufferGeometry(), n = list.length, aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), q = [-1, -1, 1, -1, 1, 1, -1, 1], pos = [], idx = [];
  for (let k = 0; k < 3; k++) { for (let i = 0; i < 4; i++) pos.push(q[i * 2], q[i * 2 + 1], k); idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  list.forEach((v, i) => { aA.set([v[0], v[1], v[2], v[3]], i * 4); aB.set([v[4], v[5], v[6], v[7]], i * 4); });
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...L.uniforms },
    vertexShader: /* glsl */`
      attribute vec4 aA, aB; varying vec4 vC;
      ${LIGHT_GLSL} ${MIST_GLSL} ${WALK_GLSL}
      void main() {
        vec3 c = walkAt(aA, aB, uTime); vec2 side = normalize(vec2(aB.y, -aB.x) + 1e-5) * .35;
        // (the first four corners are the light with its glow, turned to the eye: a patch half a metre to a side of the
        // lantern, measured in the light's own half width of 0.22 m; the next four its pool, flat on the ground; the
        // last four its halo. vC: the place on the patch, the strength of the light or pool or halo, that of the glow)
        if (position.z < .5) { vec4 mv = viewMatrix * vec4(c + vec3(side.x, .95, side.y), 1.); mv.xy += position.xy * .5; gl_Position = projectionMatrix * mv; vC = vec4(position.xy * (.5 / .22), 1.6, .5); }
        else if (position.z < 1.5) { gl_Position = projectionMatrix * viewMatrix * vec4(c + vec3(side.x + position.x * 2., .09, side.y + position.y * 2.), 1.); vC = vec4(position.xy, .2, 0.); }
        else { vec4 mv = viewMatrix * vec4(c + vec3(side.x, 1.1, side.y), 1.); mv.xy += position.xy * 3.2; gl_Position = projectionMatrix * mv; vC = vec4(position.xy, .2 * nfMist(c.xz, 0.), 0.); }
      }`,
    fragmentShader: /* glsl */`
      varying vec4 vC;
      void main() {
        // (the light, pool or halo falls away to the rim of its own round; the glow to the rim of the light's patch)
        float r2 = dot(vC.xy, vC.xy), f = max(1. - r2, 0.), g = max(1. - r2 * ${(0.22 * 0.22 / 0.25).toFixed(4)}, 0.), v = vC.z * f * f + vC.w * g;
        if (v < 1e-4) discard;
        gl_FragColor = vec4(${IVORY} * v, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- the meadow round the fence
// A night meadow from the fence to the wood, level: fields parted by hedges (straight out from the fence, and one in
// arcs round it) with gaps and gates; hedgerow trees with their moon shadows; a cart track from the gate out to an
// opening in the wood, and a path trodden round the outside of the fence, with far walkers on both; low mist in sheets;
// grass and seed heads by the line; the wood itself. From the entry to the fence, for 62 m either side of the line,
// and for 20 m either side of the entry's own axis for 345 m behind it, nothing stands above the grass.
const openGrass = (x, z) => (z > -62 && z <= 30 && Math.abs(x) < 62) || (z > 30 && z < 345 && Math.abs(x) < 20);
// the wood's edge at a bearing: a broken line with bays (and an opening where the track goes in, cut by the builder)
const woodEdgeAt = (b, W) => {
  let r = 620 + 34 * Math.sin((b * 3 + W.ph[0]) * RAD) + 22 * Math.sin((b * 7 + W.ph[1]) * RAD);
  for (const [bb, deep, wide] of W.bays) { const d = Math.abs(((b - bb + 540) % 360) - 180); if (d < wide) r += deep * (0.5 + 0.5 * Math.cos(Math.PI * d / wide)); }
  // (behind the entry the wood stands back in a bay of its own: its edge lies 640 m from the fire on the entry's axis,
  // 390 m behind the entry, and comes forward again over 12 degrees to either side)
  const d0 = Math.abs(((b + 540) % 360) - 180);
  return d0 < 12 ? Math.max(r, 640 - 3.5 * d0) : r;
};
export function meadowPlan(ctx) {
  const forks = { hedges: stream(ctx, 'field hedges'), track: stream(ctx, 'cart track'), wood: stream(ctx, 'the wood') }, P = PLACES, rh = forks.hedges, rt = forks.track, rw = forks.wood;
  const W = { ph: [rw() * 360, rw() * 360], bays: [] };
  for (let k = 0, n = rw.int(2, 3); k < n; k++) W.bays.push([rw.range(40, 320), rw.range(50, 90), rw.range(12, 20)]);
  // the cart track: from the gate straight out, bending a little at every knot, to the wood
  const track = [], gateB = 197; let tb = gateB;
  for (let k = 0; k < 8; k++) { const r = lerp(P.fenceR, woodEdgeAt(gateB, W) + 30, k / 7); if (k > 1) tb += rt.range(-3.5, 3.5); track.push(at(r, tb)); }
  const offTrack = (x, z) => { let best = Infinity; for (let i = 0; i < 7; i++) { const a = track[i], b = track[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return best; };
  // hedges: four or five straight out from near the fence to near the wood, none within 25 degrees of the entry's
  // bearing or 10 of the gate's; one more in arcs round the fence at its own radius, in up to three of the fields
  const nRad = rh.int(4, 5), bearings = [], hedges = [], ringR = rh.range(370, 430);
  for (let k = 0; k < nRad; k++) { let b = 30 + (k + 0.5 + rh.range(-0.22, 0.22)) * 300 / nRad; if (Math.abs(b - gateB) < 10) b += b < gateB ? -12 : 12; bearings.push(b); }
  const lineOf = (pts) => {
    // a hedge is broken where the track or the open grass crosses it, and by one or two gaps of its own
    const len = pts.length, gaps = [rh.int(4, len - 5)]; if (len > 30 && rh.chance(0.6)) gaps.push(rh.int(4, len - 5));
    let run = [];
    pts.forEach((q, i) => { const cut = openGrass(q[0], q[1]) || offTrack(q[0], q[1]) < 6 || gaps.some((gi) => Math.abs(i - gi) < 1); if (cut) { if (run.length > 2) hedges.push(run); run = []; } else run.push(q); });
    if (run.length > 2) hedges.push(run);
    return gaps.map((gi) => pts[gi]);
  };
  const gates = [];
  for (const b of bearings) { const r0 = P.fenceR + rh.range(26, 40), r1 = woodEdgeAt(b, W) - rh.range(15, 30), pts = []; for (let r = r0; r <= r1; r += 6) pts.push(at(r, b)); gates.push(...lineOf(pts).map((q) => [q[0], q[1], b + 90])); }
  const sorted = bearings.slice().sort((a, b) => a - b), arcs = Math.min(8 - nRad, rh.int(1, 3)), sectors = sorted.map((b, i) => [b, i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360]);
  rh.shuffle(sectors);
  for (const [b0, b1] of sectors.slice(0, arcs)) { const pts = []; for (let b = b0; b <= b1; b += 0.9) pts.push(at(ringR, b)); gates.push(...lineOf(pts).map((q) => [q[0], q[1], 0])); }
  return { forks, W, track, offTrack, bearings, ringR, hedges, gates, fields: nRad + arcs, gateB };
}

// leaf masses at night: dark, the moon on their tops and their moonward sides, darker low and within
function foliageMaterial(L) {
  return new THREE.ShaderMaterial({
    uniforms: { ...L.uniforms },
    vertexShader: /* glsl */`
      attribute float aC; varying vec3 vW, vN; varying float vC;
      ${LIGHT_GLSL}
      void main() {
        vec3 p = position; p.xz += uWind.xy * (.05 + .1 * uWind.z) * nfGust(position.xz, aC * 6.) * max(position.y - 2., 0.) * .12;
        vW = p; vN = normal; vC = aC; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vC;
      ${LIGHT_GLSL}
      void main() {
        vec3 n = normalize(vN); float clump = nfFbm(vW.xz * .9 + vW.y * 1.3), fine = nfNoise(vW.xz * 4.1 + vW.y * 3.3);
        n = normalize(n + (vec3(clump, fine, 1. - clump) - .5) * .9);
        vec3 alb = vec3(.05, .062, .054) * (.55 + .9 * clump) * (.8 + .4 * vC);
        vec3 col = alb * (nfHemi(n) * (.45 + .55 * smoothstep(0., 4., vW.y)) + nfMoon(n, .25) * 1.5 * (.4 + .6 * fine));
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW) * .6), 1.);
      }`,
  });
}
// shadows the moon lays on the grass: flat dark patches, soft at their rims (aS: across, along, strength)
function shadowMaterial(L) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...L.uniforms },
    vertexShader: 'attribute vec3 aS; varying vec3 vS; varying vec3 vW; void main(){ vS = aS; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      varying vec3 vS, vW;
      ${LIGHT_GLSL}
      void main() {
        float a = (1. - smoothstep(.55, 1., abs(vS.x))) * (1. - smoothstep(.6, 1., vS.y)) * smoothstep(0., .04, vS.y) * vS.z;
        float d = length(cameraPosition - vW); a *= exp(-uFogDen * uFogDen * d * d);
        gl_FragColor = vec4(vec3(.008, .01, .014), a);
      }`,
  });
}
const LEAF_SPEC = { position: 3, normal: 3, aC: 1 }, SHADE_SPEC = { position: 3, aS: 3 };
// a round crown: a twenty-sided ball pushed about by its own seed, flatter beneath
function crownInto(G, rng, c, rx, ry, tone, detail = 1) {
  const base = crownInto.base[detail] || (crownInto.base[detail] = new THREE.IcosahedronGeometry(1, detail)), bp = base.getAttribute('position'), ph = [rng() * 9, rng() * 9, rng() * 9], ids = [];
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), k = 1 + 0.22 * Math.sin(x * 3.1 + ph[0]) * Math.sin(z * 2.7 + ph[1]) + 0.14 * Math.sin(y * 4.3 + ph[2]), sy = y < 0 ? 0.55 : 1;
    ids.push(G.v({ position: [c[0] + x * rx * k, c[1] + y * ry * k * sy, c[2] + z * rx * k], normal: [x, y * (y < 0 ? 0.5 : 1) + 0.15, z], aC: tone }));
  }
  for (let i = 0; i < ids.length; i += 3) G.tri(ids[i], ids[i + 1], ids[i + 2]);
}
crownInto.base = {};
// the moon's shadow of something standing at `foot` with a round top `r` wide, `h` up: a soft patch lying away from the moon
function shadowInto(G, foot, r, h, moonDir, strength) {
  const hl = Math.hypot(moonDir.x, moonDir.z) || 1, ux = -moonDir.x / hl, uz = -moonDir.z / hl, len = Math.min(h * hl / Math.max(moonDir.y, 0.12), 90) + r, vx = -uz, vz = ux;
  const P = (s, t) => [foot[0] + ux * len * t + vx * r * s, 0.06, foot[1] + uz * len * t + vz * r * s];
  const id = [[-1, 0], [1, 0], [1, 1], [-1, 1]].map(([s, t]) => G.v({ position: P(s * (1 + 0.25 * t), t), aS: [s, t, strength] }));
  G.quad(id[0], id[1], id[2], id[3]);
}

// o: { route, hero (for the ground's shader and the plan's places), hour, density, detail }
export async function buildMeadow(ctx, L, o = {}) {
  const plan = meadowPlan(ctx), P = PLACES, route = o.route, dens = clamp(o.density ?? 1, 0.6, 1.4), late = o.hour === 'late', pause = () => ctx.yield();
  const forks = { ...plan.forks, trees: stream(ctx, 'hedgerow trees'), grass: stream(ctx, 'meadow grass'), walkers: stream(ctx, 'meadow walkers'), lanterns: stream(ctx, 'walkers with lanterns'), mist: stream(ctx, 'where the mist lies'), road: stream(ctx, 'lanterns on the road') };
  const object = new THREE.Group(), G = new Geo(LEAF_SPEC), SG = new Geo(SHADE_SPEC), rh = forks.hedges, rt = forks.trees, md = L.moonDir;
  // the ground's shader is told where the fields' hedges and the track lie
  const gu = o.hero.ground.material.uniforms;
  plan.track.forEach((q, i) => gu.uTrack.value[i].set(q[0], q[1]));
  plan.bearings.forEach((b, i) => { gu.uField.value[i] = (b > 180 ? b - 360 : b) * RAD; }); gu.uRingR.value = plan.ringR;
  // hedges: a rounded bank of leaves 2 to 4 m high, its height and width its own along its length, with its shadow
  const spots = [];
  for (const [hi, run] of plan.hedges.entries()) {
    const rows = [], ph = rh() * 9, tone = rh.range(0.3, 0.9);
    for (let i = 0; i < run.length; i++) {
      const a = run[Math.max(0, i - 1)], b = run[Math.min(run.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, sx = -(b[1] - a[1]) / l, sz = (b[0] - a[0]) / l;
      const end = Math.min(1, Math.min(i, run.length - 1 - i) * 0.5 + 0.35), h = (3 + Math.sin(i * 0.9 + ph) * 0.6 + rh.range(-0.4, 0.4)) * end, w = (1.25 + 0.25 * Math.sin(i * 1.7 + ph * 2)) * end, row = [];
      for (const [u, y, nx, ny] of [[-1, 0, -1, 0.1], [-0.92, 0.62, -0.8, 0.5], [0, 1, 0, 1], [0.92, 0.62, 0.8, 0.5], [1, 0, 1, 0.1]]) row.push(G.v({ position: [run[i][0] + sx * u * w, y * h, run[i][1] + sz * u * w], normal: [sx * nx, ny, sz * nx], aC: tone }));
      rows.push(row);
      if (i > 0 && i < run.length - 1) spots.push([run[i][0], run[i][1], hi, i]);
      if (i < run.length - 1) { const hl = Math.hypot(md.x, md.z) || 1, ux = -md.x / hl, uz = -md.z / hl, len = Math.min(h * hl / Math.max(md.y, 0.12), 40), n = run[i + 1];
        const id = [[run[i], 0], [n, 0], [n, 1], [run[i], 1]].map(([q, t]) => SG.v({ position: [q[0] + ux * len * t, 0.05, q[1] + uz * len * t], aS: [0, t, 0.5] })); SG.quad(id[0], id[1], id[2], id[3]); }
    }
    for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < 4; k++) G.quad(rows[i][k], rows[i + 1][k], rows[i + 1][k + 1], rows[i][k + 1]);
    if (hi % 4 === 3) await pause();
  }
  // a gate of dark bars in some of the gaps
  for (const [x, z, b] of plan.gates) { if (!rh.chance(0.5) || openGrass(x, z) || plan.offTrack(x, z) < 8) continue; const h = head(b + 90); for (const sgn of [-1, 1]) boxInto(G, [x + h[0] * 2.4 * sgn, 0.8, z + h[1] * 2.4 * sgn], [0.22, 1.6, 0.22], { aC: 0 }); for (const y of [0.45, 0.85, 1.25]) boxInto(G, [x, y, z], [0.07, 0.09, 4.8], { aC: 0 }, Math.atan2(h[0], h[1])); }
  await pause();
  // hedgerow trees: thirty to fifty along the hedges, 10 to 18 m tall with round crowns, each with its long shadow
  const nTrees = Math.min(50, Math.round(rt.int(30, 46) * Math.min(dens, 1.1))), trees = [];
  for (let t = 0; trees.length < nTrees && t < nTrees * 30; t++) {
    const s = spots[rt.int(0, spots.length - 1)], h = rt.range(10, 18), r = h * rt.range(0.3, 0.4);
    if (openGrass(s[0], s[1]) || plan.offTrack(s[0], s[1]) < r + 4 || trees.some((q) => Math.hypot(q[0] - s[0], q[1] - s[1]) < 24) || route.near(s[0], h * 0.6, s[1], r + 12)) continue;
    trees.push([s[0], s[1], h, r]);
    tubeInto(G, [[s[0], 0, s[1]], [s[0] + rt.range(-0.3, 0.3), h * 0.3, s[1] + rt.range(-0.3, 0.3)], [s[0], h * 0.55, s[1]]], [h * 0.035, h * 0.028, h * 0.02], 5, () => ({ aC: 0 }));
    crownInto(G, rt, [s[0], h * 0.66, s[1]], r, h * 0.36, rt.range(0.4, 1));
    shadowInto(SG, [s[0], s[1]], r * 1.05, h * 0.8, md, 0.62);
    if (trees.length % 8 === 0) await pause();
  }
  const leaves = new THREE.Mesh(await G.buildIn(pause), foliageMaterial(L)); leaves.frustumCulled = false; object.add(leaves);
  await pause();
  const parts = [], out = { object, forks, plan, trees, hedges: plan.hedges, fields: plan.fields, parts, update(dt, time, camera) { for (const p of parts) p.update?.(dt, time, camera); } };
  await meadowWood(ctx, L, out, SG); await pause();
  const shade = new THREE.Mesh(SG.build(), shadowMaterial(L)); shade.frustumCulled = false; shade.renderOrder = 1; object.add(shade);
  // (in the last hour the mist lies deeper: it begins at a lower level of its noise)
  if (late) L.uniforms.uMistLaw.value.x = 0.44;
  L.uniforms.uMistOff.value.set(forks.mist.range(0, 4000), forks.mist.range(0, 4000));
  object.add(mistSheets(L, late, gu.tGlow)); await pause();
  // the halos of the lantern stakes that stand where the mist reaches
  object.add(haloMesh(L, (o.hero.lamps || []).filter((l) => Math.hypot(l.x - FIRE[0], l.z - FIRE[1]) > P.fenceR - 30).map((l) => [l.x, l.h, l.z, 3.4])));
  // far walkers on the track and on the path round the fence, in twos and threes, to and fro on the world's clock; here
  // and there the first of a group carries a lantern; none of them comes within 40 m of the line at any step of its walk
  const rk = forks.walkers, rl = forks.lanterns, walkers = [], lamps = [];
  const group = (x, z, dx, dz, len) => {
    for (let k = 0; k <= 6; k++) if (route.near(x + dx * len * k / 6, 0.9, z + dz * len * k / 6, 41.5) || openGrass(x + dx * len * k / 6, z + dz * len * k / 6)) return false;
    const n = rk.chance(0.55) ? 2 : 3, ph = rk(), rate = rk.range(0.7, 1.1) / len, lit = rl.chance(0.3);
    for (let j = 0; j < n; j++) { const s = (j - (n - 1) / 2) * 0.7, back = rk.range(-0.5, 0.5), row = [x - dz * s + dx * back, 0, z + dx * s + dz * back, ph, dx * len, dz * len, rate, rk.range(0.92, 1.08), rk.range(0.5, 1.2), rk.chance(1 / 12) ? 1 : 0]; walkers.push(row); if (lit && j === 0) lamps.push(row); }
    return true;
  };
  for (let k = 0, n = Math.round(8 * dens), t = 0; k < n && t < 200; t++) { const i = rk.int(0, 6), a = plan.track[i], b = plan.track[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), len = rk.range(30, 55), f = rk.range(0, Math.max(0.01, 1 - len / l)), sg = rk.chance(0.5) ? 1 : -1, dx = (b[0] - a[0]) / l, dz = (b[1] - a[1]) / l;
    if (group(a[0] + (b[0] - a[0]) * (sg > 0 ? f : f + len / l), a[1] + (b[1] - a[1]) * (sg > 0 ? f : f + len / l), dx * sg, dz * sg, len)) k++; }
  for (let k = 0, n = Math.round(9 * dens), t = 0; k < n && t < 300; t++) { const b = rk.range(0, 360), p = at(P.fenceR + 6 + rk.range(-0.5, 0.5), b), sg = rk.chance(0.5) ? 1 : -1, tb = (b + 90) * RAD;
    if (group(p[0], p[1], Math.sin(tb) * sg, Math.cos(tb) * sg, rk.range(22, 40))) k++; }
  // a line of lantern bearers on the cart track, from 30 m outside the gate to the wood: one every 16 to 26 m (the
  // spacing drawn for each), each going to and fro along its own 18 to 34 m of the track on the world clock, each
  // with a lantern; none where its walk would come within 40 m of the line or onto the open grass
  const rr = forks.road, road = [];
  { const tr = plan.track; let lens = [], total = 0; for (let i = 0; i < 7; i++) { const l = Math.hypot(tr[i + 1][0] - tr[i][0], tr[i + 1][1] - tr[i][1]); lens.push(l); total += l; }
    for (let d = 30 + rr.range(0, 12); d < total - 40; d += rr.range(16, 26)) {
      let i = 0, e = d; while (i < 6 && e > lens[i]) { e -= lens[i]; i++; }
      const a = tr[i], b = tr[i + 1], dx = (b[0] - a[0]) / lens[i], dz = (b[1] - a[1]) / lens[i], len = rr.range(18, 34), sg = rr.chance(0.5) ? 1 : -1, side = rr.range(-1.1, 1.1), ph = rr(), rate = rr.range(0.7, 1.1) / len, tall = rr.range(0.92, 1.08), tone = rr.range(0.5, 1.2);
      const x = a[0] + dx * e - dz * side - dx * sg * len / 2, z = a[1] + dz * e + dx * side - dz * sg * len / 2;
      let ok = true; for (let k = 0; k <= 6 && ok; k++) if (route.near(x + dx * sg * len * k / 6, 0.9, z + dz * sg * len * k / 6, 41.5) || openGrass(x + dx * sg * len * k / 6, z + dz * sg * len * k / 6)) ok = false;
      if (ok) road.push([x, 0, z, ph, dx * sg * len, dz * sg * len, rate, tall, tone, 0]);
    } }
  object.add(figureMesh(L, walkers.concat(road)), lanternMesh(L, lamps.concat(road))); out.walkers = walkers.concat(road); out.lanterns = lamps.length + road.length; out.road = road.length;
  await pause();
  object.add(await grassMesh(L, forks.grass, Math.round(6200 * (o.detail ?? 1)), pause, gu)); await pause();
  return out;
}
// the wood: single crowns along its broken edge in two rows, a dark wall of trunks and shade behind them, an opening
// where the cart track goes in, and two or three copses standing out in the fields
async function meadowWood(ctx, L, M, SG) {
  const plan = M.plan, rw = plan.forks.wood, G = new Geo(LEAF_SPEC), W = plan.W, trackB = Math.atan2(plan.track[7][0] - FIRE[0], plan.track[7][1] - FIRE[1]) / RAD;
  const open = (b) => Math.abs(((b - trackB + 540) % 360) - 180) < 1.6;
  for (let row = 0; row < 2; row++) for (let b = rw() * 1.2; b < 360; ) {
    const r = woodEdgeAt(b, W) + row * 15 + rw.range(-4, 4), h = rw.range(12, 18) + row * 4, p = at(r, b);
    if (!open(b)) crownInto(G, rw, [p[0], h * 0.6, p[1]], h * rw.range(0.4, 0.5), h * 0.42, rw.range(0.3, 1), 0);
    b += (11 + rw.range(-2, 5)) / r / RAD; if (G.n % 3000 < 60) await ctx.yield();
  }
  // the dark behind the crowns
  { const rows = []; for (let k = 0; k <= 180; k++) { const b = k * 2, p = at(woodEdgeAt(b, W) + 26, b), q = at(woodEdgeAt(b, W) + 26, b + 0.01); rows.push([G.v({ position: [p[0], -0.5, p[1]], normal: [0, 0.2, 0], aC: 0 }), G.v({ position: [p[0], open(b) ? 4 : 15 + 5 * Math.sin(k * 1.3), p[1]], normal: [0, 0.6, 0], aC: 0 })]); }
    for (let k = 0; k < 180; k++) G.quad(rows[k][0], rows[k + 1][0], rows[k + 1][1], rows[k][1]); }
  // copses out in the fields, clear of the open grass, the track and the hedges' own trees
  M.copses = [];
  for (let k = 0, n = rw.int(2, 3), t = 0; k < n && t < 60; t++) {
    const c = at(rw.range(450, 540), rw.range(35, 325));
    if (openGrass(c[0], c[1]) || plan.offTrack(c[0], c[1]) < 40 || M.copses.some((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < 120)) continue;
    M.copses.push(c); k++;
    for (let j = 0, m = rw.int(8, 12); j < m; j++) { const a = rw() * TAU, d = 16 * Math.sqrt(rw()), h = rw.range(11, 17), x = c[0] + Math.cos(a) * d, z = c[1] + Math.sin(a) * d; crownInto(G, rw, [x, h * 0.6, z], h * 0.42, h * 0.42, rw.range(0.4, 1), 0); if (j % 3 === 0) shadowInto(SG, [x, z], h * 0.45, h * 0.8, L.moonDir, 0.6); }
  }
  const mesh = new THREE.Mesh(await G.buildIn(() => ctx.yield()), foliageMaterial(L)); mesh.frustumCulled = false; mesh.material.side = THREE.DoubleSide; M.object.add(mesh);
}
// low mist on the meadow. THE RULE: a bank of mist is as thick as its own place makes it, and looks the same from
// everywhere. It is drawn as five thin level sheets between half a metre and 3 m up (MIST_Y), fixed in the world; a
// sheet's strength at a place is nfMist at that place and that height times ONE constant for the sheet (MIST_SHEET;
// in the last hour the night's own thicker one, MIST_SHEET_LATE), and nothing else. Where every sheet lies full, the
// five together hide MIST_FULL of the ground under them, the same share for whoever looks and from wherever: 0.83
// (0.87 in the last hour). The lower sheets reach further out than the higher ones and each has its own slip of the
// noise, so a bank is thickest in its core and thins to nothing at soft uneven edges. It is lit grey-white by the
// moon and, near the fence (it reaches a little way in through the railings), by the lights that stand in it; hedge
// tops and trees stand out of it. It takes the world's haze as every surface does.
const MIST_Y = [0.5, 1.1, 1.7, 2.3, 2.9], MIST_SHEET = 0.3, MIST_SHEET_LATE = 0.34;
export const MIST_FULL = (late) => 1 - Math.pow(1 - (late ? MIST_SHEET_LATE : MIST_SHEET), MIST_Y.length);
function mistSheets(L, late, glow) {
  // (each sheet is a flat ring of 24 sides from inside the fence, where the mist's law has not yet begun, to beyond where it ends)
  const g = new THREE.BufferGeometry(), pos = [], lay = [], idx = [], N = 24, r0 = PLACES.fenceR - 32, r1 = 700;
  MIST_Y.forEach((y) => { const o = pos.length / 3, k = (y - 0.9) / 1.6; for (let i = 0; i <= N; i++) { const a = i / N * TAU, s = Math.sin(a), c = Math.cos(a); pos.push(FIRE[0] + s * r0, y, FIRE[1] + c * r0, FIRE[0] + s * r1, y, FIRE[1] + c * r1); lay.push(k, k); if (i < N) idx.push(o + i * 2, o + i * 2 + 1, o + i * 2 + 3, o + i * 2, o + i * 2 + 3, o + i * 2 + 2); } });
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(lay, 1)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...L.uniforms, uThick: { value: late ? MIST_SHEET_LATE : MIST_SHEET }, uFenceR: { value: PLACES.fenceR }, tGlow: glow },
    vertexShader: 'attribute float aL; varying float vL; varying vec3 vW; void main(){ vL = aL; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      uniform float uThick, uFenceR; uniform sampler2D tGlow; varying float vL; varying vec3 vW;
      ${LIGHT_GLSL} ${MIST_GLSL}
      void main() {
        // (the sheet's strength: how thick the mist lies at this place and height, times the sheet's one constant)
        float a = nfMist(vW.xz, vL) * uThick;
        // the mist is lit by the moon, and by the tents' small lights and the lanterns where it lies near them
        vec2 uv = (vW.xz - uFirePos.xz) / ${(2 * MAP_HALF).toFixed(1)} + .5; vec3 lit = texture2D(tGlow, clamp(uv, 0., 1.)).rgb * step(max(abs(uv.x - .5), abs(uv.y - .5)), .499);
        vec3 col = vec3(.52, .55, .6) * (nfHemi(vec3(0., 1., 0.)) + uMoonCol * .68) + ${IVORY} * (.3 * lit.r + .5 * lit.g);
        gl_FragColor = vec4(nfFog(col, length(cameraPosition - vW) * .5), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}
// a halo in the mist: about a light that stands where the mist lies a soft round glows, as bright as the mist is thick
// at the light's own place at that time (list: x, y, z of the light and the halo's radius in metres)
function haloMesh(L, list) {
  const g = new THREE.InstancedBufferGeometry(), n = list.length, aH = new Float32Array(n * 4);
  list.forEach((v, i) => aH.set(v, i * 4));
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...L.uniforms },
    vertexShader: /* glsl */`
      attribute vec4 aH; varying vec3 vC;
      ${LIGHT_GLSL} ${MIST_GLSL}
      void main() { vec4 mv = viewMatrix * vec4(aH.xyz, 1.); mv.xy += position.xy * aH.w; vC = vec3(position.xy, nfMist(aH.xz, 0.)); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      varying vec3 vC;
      void main() { float r2 = dot(vC.xy, vC.xy); if (r2 > 1. || vC.z < .01) discard; float f = 1. - r2; gl_FragColor = vec4(${IVORY} * .2 * vC.z * f * f, 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}
// THE TUFTS STAND THINNER FAR FROM EVERY LANE. Where no one comes the long grass's tufts are fewer: a tuft (the
// meadow's own and the drifts' alike) that stands more than TUFT_FAR[0] metres from the middle of every lane of the
// camp keeps its place only by a share that falls evenly to TUFT_SHARE at TUFT_FAR[1] metres and beyond. Which tufts
// go is settled by each tuft's own place (the shaders' hash of it), by no draw. Inside the fence no place lies so far
// from a lane and every tuft stands.
// (to a place outside the fence the nearest piece of a lane is one on the walk round the inside of the fence, which
// lies 11 m within it all the way round, or beyond that walk: only those pieces are measured; and they are measured
// at the corners of a grid of TUFT_CELL metres, each corner when it is first asked for, a tuft reading its own
// metres between the four corners about it, which is true to within a metre at such distances)
const TUFT_FAR = [60, 85], TUFT_SHARE = 0.6, TUFT_CELL = 12;
function tuftStands(ways) {
  const P = PLACES, rim = P.fenceR - 12, seg = [], fromFire = (x, z) => Math.hypot(x - FIRE[0], z - FIRE[1]), corners = new Map();
  for (const { pts } of ways) for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1]; if (fromFire(a[0], a[1]) >= rim || fromFire(b[0], b[1]) >= rim) seg.push(a[0], a[1], dx, dz, dx * dx + dz * dz || 1); }
  const away = (cx, cz) => {
    const key = (cx + 512) * 1024 + cz + 512; let d = corners.get(key); if (d !== undefined) return d;
    const x = cx * TUFT_CELL, z = cz * TUFT_CELL; let best = Infinity;
    for (let i = 0; i < seg.length; i += 5) {
      const ax = x - seg[i], az = z - seg[i + 1], t = clamp((ax * seg[i + 2] + az * seg[i + 3]) / seg[i + 4], 0, 1), ex = ax - seg[i + 2] * t, ez = az - seg[i + 3] * t, d2 = ex * ex + ez * ez;
      if (d2 < best) best = d2;
    }
    corners.set(key, d = Math.sqrt(best)); return d;
  };
  return (x, z) => {
    if (fromFire(x, z) < P.fenceR) return true;
    const gx = x / TUFT_CELL, gz = z / TUFT_CELL, cx = Math.floor(gx), cz = Math.floor(gz), fx = gx - cx, fz = gz - cz;
    const d = lerp(lerp(away(cx, cz), away(cx + 1, cz), fx), lerp(away(cx, cz + 1), away(cx + 1, cz + 1), fx), fz);
    return d <= TUFT_FAR[0] || hash2(x * 7.31, z * 7.31) <= lerp(1, TUFT_SHARE, smoothstep(TUFT_FAR[0], TUFT_FAR[1], d));
  };
}
// grass by the line: tufts of four thin blades leaning to all sides and a slim seed head on its stalk, each tuft its
// own size, bowing to the gusts; thick within 35 m of the line from the entry to the fence and thinning to nothing
// 100 m from it, and along the outside of the fence; the blades near the ground's own grey at the foot and paler
// toward the tip where the moon catches them, the seed heads a little paler still
async function grassMesh(L, rng, n, pause, gu, given = null, map = null) {
  const g = new THREE.InstancedBufferGeometry(), pos = [], kind = [], wide = [], idx = [], P = PLACES;
  // (aW: the side a vertex lies to of its own blade or head, by which it is kept a pixel wide far off)
  for (let b = 0; b < 4; b++) { const a = b / 4 * TAU + 0.4 + 0.5 * (b % 2), c = Math.cos(a), s = Math.sin(a), o = pos.length / 3, w = 0.034, lean = 0.2 + 0.1 * b; pos.push(-s * w, 0, c * w, s * w, 0, -c * w, c * lean, 0.55 + 0.15 * b, s * lean); kind.push(0, 0, 0.6); wide.push(-s, c, s, -c, 0, 0); idx.push(o, o + 1, o + 2); }
  { const o = pos.length / 3; pos.push(-0.016, 0, 0, 0.016, 0, 0, 0.05, 1.12, 0.02, 0.05, 1.04, 0.02, 0.1, 1.22, 0.04, 0.06, 1.46, 0.03, 0.008, 1.22, 0.01); kind.push(0, 0, 0.5, 1, 1, 1, 1); wide.push(-1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, -1, 0); idx.push(o, o + 1, o + 2, o + 3, o + 4, o + 5, o + 3, o + 5, o + 6); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kind, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(wide, 2)); g.setIndex(idx);
  // (given: tufts whose places are already dealt; then nothing is drawn here)
  const aO = given ? given.aO : new Float32Array(n * 4); let got = given ? given.n : 0;
  for (let t = 0; !given && got < n && t < n * 8; t++) {
    const x = rng.range(-100, 100), z = rng.range(-88, 45), size = rng.range(0.4, 1), ph = rng(), keep = rng(), r = Math.hypot(x - FIRE[0], z - FIRE[1]) - P.fenceR;
    if (t % 400 === 399) await pause();
    if (r < 1.5) continue;
    const dLine = Math.hypot(x, z - clamp(z, FIRE[1] + P.fenceR, 0)), p = Math.max(1 - smoothstep(35, 100, dLine), 0.7 * (1 - smoothstep(4, 16, r)) * (1 - smoothstep(55, 98, dLine)));
    if (keep > p || footOff(x, z) < 1.6) continue;
    aO.set([x, z, size, ph], got * 4); got++;
  }
  // (the tufts that do not stand, by the rule of the lanes above, are taken out here, after the dealing: no draw is moved)
  const stands = tuftStands(gu.tMap.value.userData.ways); let kept = 0;
  // (and by the line a tuft stands only in a swathe: on a mown strip it is taken out, by its own place, in the share
  // by which the band holds there)
  const mown = (x, z) => z > FIRE[1] && Math.hypot(x - FIRE[0], z - FIRE[1]) > P.fenceR && !swatheAt(x, z) && hash2(x * 3.17, z * 3.17) < 1 - smoothstep(48, 80, Math.abs(x));
  for (let i = 0; i < got; i++) { if (i % 800 === 799) await pause(); if (!stands(aO[i * 4], aO[i * 4 + 1]) || (!given && mown(aO[i * 4], aO[i * 4 + 1]))) continue; if (kept < i) aO.copyWithin(kept * 4, i * 4, i * 4 + 4); kept++; }
  got = kept;
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 4)); g.instanceCount = got;
  const m = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...L.uniforms, tGlow: gu.tGlow, uFenceR: gu.uFenceR, uField: gu.uField, uRingR: gu.uRingR, tMap: { value: map }, uShade: { value: map ? 1 : 0 }, uFan: gu.uFan },
    vertexShader: /* glsl */`
      attribute vec4 aO; attribute float aK; attribute vec2 aW; varying vec3 vW, vG; varying float vK, vF;
      uniform vec4 uFan[${FAN_K}];
      ${LIGHT_GLSL} ${MEADOW_GLSL}
      void main() {
        vG = nfMeadowAt(aO.xy);
        // (a tuft by the fence stands in the lanterns' light as the ground about it does: the same lanterns by the
        // same law, at the tuft's foot, less the railings' mean share outside the fence)
        vec2 fd = aO.xy - uFirePos.xz; float fr = length(fd), fk = floor(mod(atan(fd.x, fd.y), 6.2831853) * ${(FAN_K / TAU).toFixed(5)}); vF = 0.;
        if (fr > uFenceR - 6. && fr < uFenceR + ${FAN_REACH.toFixed(1)}) for (int j = 0; j < 10; j++) {
          vec4 two = uFan[int(mod(fk + float(j / 2) + ${(FAN_K - 2).toFixed(1)}, ${FAN_K.toFixed(1)}))]; float l = length(aO.xy - (j - (j / 2) * 2 == 0 ? two.xy : two.zw));
          vF += ${FAN_FALL('l')};
        }
        vF *= smoothstep(uFenceR - 6., uFenceR - 1., fr) * mix(1., .7, step(uFenceR, fr));
        float ca = cos(aO.w * 6.283), sa = sin(aO.w * 6.283), far = length(cameraPosition - vec3(aO.x, 0., aO.y));
        vec3 q = position + vec3(aW.x, 0., aW.y) * max(far * .0011 - .03, 0.) / max(aO.z * 1.6, .1);
        vec3 p = vec3(q.x * ca - q.z * sa, q.y, q.x * sa + q.z * ca) * aO.z * vec3(1.6, 1., 1.6);
        float bend = (.12 + .2 * uWind.z) * (nfGust(aO.xy, aO.w * 6.) + .6) * p.y * p.y / max(aO.z, .1);
        p.xz += uWind.xy * bend; vK = aK;
        vW = p + vec3(aO.x, 0., aO.y); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vG; varying float vK, vF; uniform sampler2D tGlow, tMap; uniform float uShade, uFenceR;
      ${LIGHT_GLSL}
      void main() {
        float head = step(.9, vK);
        // (the grass about it, standing up: four fifths of that tone at the foot, 1.3 times it at a blade's tip, one
        // and a half times it on the seed head; each tuft a little its own, never lighter than that)
        vec3 alb = vG * mix(mix(.8, 1.3, clamp(vK / .6, 0., 1.)), 1.5, head) * (.7 + .3 * nfNoise(vW.xz * .7));
        // (the tufts take the same glow of the tents' lights and the lanterns as the ground they stand on)
        vec2 uv = (vW.xz - uFirePos.xz) / ${(2 * MAP_HALF).toFixed(1)} + .5; vec3 lay = texture2D(tGlow, clamp(uv, 0., 1.)).rgb;
        // (tufts that stand among the tents lose the moon where a tent's shadow lies over them; the moon lies on a
        // tuft as it lies on the level ground about it)
        float shade = uShade > .5 ? texture2D(tMap, clamp(uv - uMoonDir.xz * (vW.y / max(uMoonDir.y, .15)) / ${(2 * MAP_HALF).toFixed(1)}, 0., 1.)).g : 0.;
        // (inside the fence the far skirts of the small lights' glow are left out as on the ground, and a lantern's pool is as strong)
        float pl = lay.r * 1.08; pl = mix(pl, pl * smoothstep(.1, .8, pl), .88 * (1. - smoothstep(uFenceR - 3., uFenceR + 2., length(vW.xz - uFirePos.xz))));
        vec3 light = nfHemi(vec3(0., 1., 0.)) * (1. - .5 * shade) + uMoonCol * uMoonDir.y * (1. - .88 * shade) + ${IVORY} * (pl + lay.g * ${POOL_GAIN.toFixed(1)} + ${FAN_LIGHT.toFixed(2)} * mix(1., ${FAN_SNOW.toFixed(2)}, uSnow) * vF);
        gl_FragColor = vec4(nfFog(alb * light, length(cameraPosition - vW)), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.grassCount = got;
  return mesh;
}

// how far under the canvas of a flown tent (the garden of ice, the cloud steps) a point lies (metres; 0 outside them)
export const underCanvas = (lay, x, y, z) => Math.max(0, -Math.min(outsideBy(lay.garden, x, y, z), outsideBy(lay.steps, x, y, z)));
