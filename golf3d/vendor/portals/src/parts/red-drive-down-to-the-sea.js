// The red banks of the drive (hero set piece of red-drive-down-to-the-sea) and the lie of the estate.
// Two things live here so the world file and the judging viewer share them:
//   1. the estate's plan as plain arithmetic (makeLayout): the route, the ground's height, the drive, the cut, the lawn,
//      the valley and the cove, all in world metres (+X east and inland, -X west and seaward, +Z south, sea level y 0);
//   2. the bank builder (buildBank) with its three materials (leaf mass with a painted flower layer, built flower heads,
//      leaf whorls), and buildHero: one straight 60 m length of the cut for judging alone.
// Every shader here lights by one shared law (ESTATE_GLSL): sun, sky fill, moving sun spots under leaves, the baked
// shade of banks and house, cloud shadow, haze. Light differs by place because of the place, never by the flight: of
// the eye the law takes the angle of sight (a sheen, a mirror) and, for the haze alone, the length of the eye's line.
// (The eye's distance does one thing more here, to paint and not to light: a bank's painted flowers, its heads' petals
// and the fallen petals on the drive go over to their own mean colour far off.)
import * as THREE from 'three';
import { makeRng, makeNoise, hashSeed, makePath, clamp, lerp, smoothstep } from '../kit/core.js';

export const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------------------------------------------------------------- the estate's fixed places (world metres)
export const PLACE = {
  entry: [520, 30], straightEnd: [460, 30], eastMouth: [220, 24], bend: [130, 46], westMouth: [40, 6],
  houseCentre: [-120, -70], houseAxis: [-0.865, 0.502], houseFront: [0.5, 0.866], houseLength: 86, houseDepth: 16,
  frontDistance: 31, lawnCorner: [-215, 45], valleyAxis: [-0.866, 0.5], valleyLength: 220, beachDepth: 45,
  ringBeyondTide: 30, ringHeight: 9.4, ringRadius: 8.6, groundLawn: 30,
  // the route passes along the whole front 23 m from its wall (frontDistance less half the house's depth), level with the
  // first floor's sills (sill metres over the lawn); it turns onto the front's line on an arc of turnRadius
  // (the arc's corner lies turnLead metres short of the east end, so the line is within 30 m of the wall when that end
  // comes abeam); past the seaward end it keeps that height for holdLength metres while the lawn falls away (the level
  // run); where the level run ends the line starts down into the hollow, and there the valley's first azaleas stand
  sill: 6.6, turnRadius: 45, turnLead: 9, holdLength: 60,
};
// riding heights over the ground, by place (rule R2 of the route)
export const RIDE = { gravel: 3.0, lawnEdge: 4.2, lawn: 5.6, head: 7.0, valley: 5.0, valleyLow: 4.8 };

// ---------------------------------------------------------------- the vault's trunks, by place
// THE VERGE'S RULE: a drive kept for carriages has a kept verge. No part of any trunk (its foot's swell and its roots
// counted: FOOT times its radius from its axis) stands nearer the drive's middle line than VERGE metres, measured to the
// NEAREST point of the whole line: a bend that comes back past a trunk counts as much as the stretch it stands beside.
export const VERGE = 6, FOOT = 2.05;
// The trunks of the drive's wood: [{ x, z, r, m, d, great, nx, nz }] (r: radius at a man's height; m: metres of the route
// beside it; d: metres from the line; great: of the avenue; nx, nz: the way to the drive from an avenue trunk). rp deals the avenue (its steps,
// girths and stand-off), rd the trees beyond it; gaps: the glades, which stay open.
//  - the avenue: a great beech either side at dealt steps of 12 to 19 m, 0.55 to 1.05 m in radius, its bark 0.3 to
//    1.8 m outside the verge; behind the entry the lane widens as it did (5.6 m and 15 m more in every 340 m back);
//  - beyond it, to 60 m off the line and as far as 8 m short of the cut's east mouth: one beech to a 10 m square
//    (behind the entry one to a 16 m square, outside the widening lane), 0.28 to 0.6 m in radius.
export function vaultTrunks(Lo, M, gaps, rp, rd, density) {
  const T = Lo.tables, ra = [0, 0, 0], out = [], E = PLACE.entry;
  const clearOf = (x, z, pad) => gaps.every((g) => Math.hypot(x - g.x, z - g.z) > g.r + pad);
  for (const side of [1, -1]) for (let m = -BEHIND + 6; m < M.east - 5; m += rp.range(12, 19)) {
    const r = rp.range(0.55, 1.05), extra = rp.range(0.3, 1.8), k = T.B + Math.round(m), k2 = Math.min(k + 2, T.n - 1), tx = T.X[k2] - T.X[k], tz = T.Z[k2] - T.Z[k], tl = Math.hypot(tx, tz) || 1;
    const off = Math.max(VERGE + FOOT * r + extra, 5.6 + FOOT * r + 15 * -m / 340), nx = tz / tl * side, nz = -tx / tl * side, x = T.X[k] + nx * off, z = T.Z[k] + nz * off;
    if (!clearOf(x, z, 1.5 + FOOT * r) || Lo.routeDist(x, z) < VERGE + FOOT * r) continue;
    out.push({ x, z, r, m, d: off, great: 1, nx: -nx, nz: -nz });
  }
  for (let gz = -72; gz < 132; gz += 2) for (let gx = 200; gx < E[0] + BEHIND; gx += 2) {
    const back = gx >= E[0], cw = back ? 16 : 10;
    if (gx % cw || (gz + 72) % cw) continue;
    const x = gx + rd.range(1, cw - 1), z = gz + rd.range(1, cw - 1), dr = rd(), r = rd.range(0.28, 0.6);
    Lo.routeAt(x, z, ra);
    const d = back ? Math.abs(z - E[1]) : ra[0], m = back ? E[0] - x : ra[1];
    if (back ? d < 8.5 + FOOT * r + 15 * (x - E[0]) / 340 || d > 60 : !(d > 12.5 && d < 60 && m < M.east - 8)) continue;
    if (dr > (back ? 0.6 : 0.85) * density || Lo.woodIn(x, z) < 0.5 || !clearOf(x, z, 2 + FOOT * r)) continue;
    out.push({ x, z, r, m, d, great: 0, nx: 0, nz: 0 });
  }
  return out;
}

// ---------------------------------------------------------------- the vault's standing gaps (plain arithmetic)
// Where the boughs of neighbouring beeches do not meet, a gap some metres across stands in the vault's roof and the sun
// comes down it: a shaft in the air, a pool of light on the floor. gapField(qx, qz): how open the roof stands over a
// place, 0 to 1, a field of the place alone, given at the FOOT OF THE SUN'S RAY through it (the place where that ray
// meets the level y = 0, as the dapple takes it: so a shaft, its pool on the floor and what grows in the pool are one
// law). Two crossed waves, each bent by the other: the gaps lie about 22 m apart and no two are alike. From 0.72 the
// roof begins to open (GAP_OPEN), from 0.92 it is as open as it gets: a pool some 10 m across with a core of 5 m.
// Counted over 32 million places: the roof begins to open over 0.21 of the floor, is as open as it gets over 0.05 of
// it, and its mean openness is 0.13. The numbers are written once, here; the shader's esGap is made of them.
const GAP = [0.21, 1.7, 0.13, 0.6, 0.19, 1.3, 0.11, 2.1];
export const GAP_OPEN = [0.72, 0.92];
export const gapField = (qx, qz) => 0.5 + 0.5 * Math.sin(qx * GAP[0] + GAP[1] * Math.sin(qz * GAP[2] + GAP[3])) * Math.sin(qz * GAP[4] + GAP[5] * Math.sin(qx * GAP[6] + GAP[7]));

// ---------------------------------------------------------------- shared shader law
export const ESTATE_GLSL = /* glsl */`
uniform float uTime, uFogDen;
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uLeafFill, uPortalCol, uCloud;
uniform sampler2D tPlace;
uniform vec4 uPlaceBox, uWind, uPortal;
uniform vec2 uCanopy, uCloudOff;
float esH(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 esH2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float esN(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(esH(i), esH(i + vec2(1., 0.)), f.x), mix(esH(i + vec2(0., 1.)), esH(i + vec2(1., 1.)), f.x), f.y);
}
float esF(vec2 p){ return esN(p) * .5 + esN(p * 2.03 + 7.1) * .3 + esN(p * 4.1 + 3.7) * .2; }
vec4 esPlace(vec3 p){ return texture2D(tPlace, clamp((p.xz - uPlaceBox.xy) * uPlaceBox.zw, 0., 1.)); }
// THE VAULT: where the place map's leaf cover is written whole (the great beeches of the drive, see the world's
// buildEstate) the wood is a vault: 1 under it, 0 everywhere else (the cut, the lawn and the valley write 0.92 at most).
// Every term of the vault below is multiplied by this measure, so where it is 0 the light is what it was, bit for bit.
// (Toward the cut's east mouth the cover is written down by an even ramp, and the measure falls with it from 1 at 33 m
// short of the mouth to 0 at 16.5 m short: no line lies across the drive.)
float esVault(vec4 pl){ return smoothstep(.935, .99, pl.r); }
// (the vault's standing gaps: gapField of this file, at the foot of the sun's ray)
float esGap(vec2 q){ return .5 + .5 * sin(q.x * ${GAP[0]} + ${GAP[1]} * sin(q.y * ${GAP[2]} + ${GAP[3]})) * sin(q.y * ${GAP[4]} + ${GAP[5]} * sin(q.x * ${GAP[6]} + ${GAP[7]})); }
// (v: the vault's measure; under it the sun comes through fewer and smaller gaps: small shifting patches of gold.
// Under a standing gap of the vault (g) the leaves let far more of it through: most of the pool's middle is lit, the
// leaves' shadows moving in it. Where v is 0, g is 0 and the law is what it was, bit for bit)
float esDapple(vec3 p, float v){
  vec2 q = p.xz - uSunDir.xz * (p.y / max(uSunDir.y, .25));
  vec2 w = uWind.xy * uWind.z;
  vec2 wob = vec2(sin(uTime * .5 + q.y * .07), cos(uTime * .43 + q.x * .06)) * .22;
  float a = esN(q * .42 + w * uTime * .11 + wob);
  float b = esN(q * 1.15 - w * uTime * .07 + 13.);
  float g = v > 0. ? .28 * v * smoothstep(${GAP_OPEN[0]}, ${GAP_OPEN[1]}, esGap(q)) : 0.;
  return smoothstep(.5 + .12 * v - g, .63 + .11 * v - g, a * .68 + b * .32);
}
// drifting cloud shadow: the field stands where this visit's dealt offset puts it and drifts 6 m a second with the wind;
// its law leaves any place in the sun for more than half of any minute (the worst minute found in the field is 0.46 in shade)
float esCloudShade(vec3 p){
  vec2 q = (p.xz + uCloudOff - uWind.xy * uTime * 6.) / max(uCloud.y, 1.);
  return 1. - uCloud.x * smoothstep(.61, .75, esF(q));
}
float esSun(vec3 p, vec4 pl){
  float top = pl.g * 80. - 10.;
  float vis = smoothstep(-1.4, 1.4, p.y - top);
  // leaves overhead count up to the height of the crowns' tops (uCanopy: where the crowns begin to thin, where they end)
  // (the vault's crowns stand 9 to 11 m higher than the rest of the wood's)
  float v = esVault(pl), cover = pl.r * (1. - smoothstep(uCanopy.x + 9. * v, uCanopy.y + 11. * v, p.y));
  return vis * mix(1., esDapple(p, v), cover) * esCloudShade(p);
}
vec3 esFill(vec3 n, vec4 pl){
  vec3 h = mix(uGndCol, uSkyCol, n.y * .5 + .5);
  h = mix(h, uLeafFill * (.76 + .24 * n.y), pl.r * .85);
  // (under the vault the shade is deep: half the light of the wood's other shade)
  h *= mix(1., .5, esVault(pl));
  h *= mix(vec3(1.), vec3(1.8, 1.08, 1.), pl.b * .6);
  return h + uSunCol * vec3(.62, .22, .18) * (pl.b * uCloud.z);
}
vec3 esPortal(vec3 p, vec3 n){
  vec3 d = uPortal.xyz - p; float l = length(d);
  float k = exp(-l * l / max(uPortal.w * uPortal.w, 1.));
  return uPortalCol * k * (.35 + .65 * clamp(dot(n, d / max(l, 1e-3)), 0., 1.));
}
vec3 esLight(vec3 albedo, vec3 n, vec3 p, float ao, float wrap){
  vec4 pl = esPlace(p);
  float ndl = clamp((dot(n, uSunDir) + wrap) / (1. + wrap), 0., 1.);
  // a cloud overhead takes the sun and some of the sky's light with it
  vec3 e = uSunCol * ndl * esSun(p, pl) + esFill(n, pl) * (ao * (.6 + .4 * esCloudShade(p))) + esPortal(p, n);
  return albedo * e * .3183;
}
vec3 esFog(vec3 c, vec3 p){
  float d = length(p - cameraPosition), f = 1. - exp(-uFogDen * uFogDen * d * d);
  float s = pow(clamp(dot(normalize(p - cameraPosition), uSunDir), 0., 1.), 6.);
  c = mix(c, uFogCol + uSunCol * .05 * s, clamp(f, 0., 1.));
  // under leaves the air is a green dusk; how much of it lies between the eye and the thing is counted along the
  // line between them, at three places on it, by the leaves over each
  // (vlt: how much of that line lies under the vault, counted at the same three places; there the dusk is a paler,
  // bluer haze and thickens sooner, so that trunk behind trunk stands paler and bluer into the wood's depth)
  float under = 0., vlt = 0.;
  for (int i = 0; i < 3; i++) {
    vec3 q = mix(cameraPosition, p, .2 + .3 * float(i));
    vec4 pq = esPlace(q); float vq = esVault(pq), low = 1. - smoothstep(uCanopy.x - 5. + 9. * vq, uCanopy.x + 3. + 11. * vq, q.y);
    under += pq.r * low; vlt += vq * low * .3333;
  }
  vec3 dusk = mix(uLeafFill * vec3(.05, .07, .045), uFogCol * vec3(.1, .15, .16), vlt);
  return mix(c, dusk, under * .3333 * (1. - exp(-d * d * 1.3e-4 * (1. + vlt))));
}
// What the air lets through of a light that stands in it at p (the vault's shafts are such a light): esFog is two
// veils, the haze and the dusk under leaves, each a mix toward the air's own colour, so of an added light the air
// passes (1 - the haze's share) times (1 - the dusk's share): esFog's answer for white less its answer for black,
// taken once. The numbers are esFog's own, line for line.
float esAir(vec3 p){
  float d = length(p - cameraPosition), f = 1. - exp(-uFogDen * uFogDen * d * d);
  float under = 0., vlt = 0.;
  for (int i = 0; i < 3; i++) {
    vec3 q = mix(cameraPosition, p, .2 + .3 * float(i));
    vec4 pq = esPlace(q); float vq = esVault(pq), low = 1. - smoothstep(uCanopy.x - 5. + 9. * vq, uCanopy.x + 3. + 11. * vq, q.y);
    under += pq.r * low; vlt += vq * low * .3333;
  }
  return (1. - clamp(f, 0., 1.)) * (1. - under * .3333 * (1. - exp(-d * d * 1.3e-4 * (1. + vlt))));
}
vec3 esSway(vec3 p, float h){
  float ph = dot(p.xz, uWind.xy) * .09 - uTime * uWind.w * .8;
  float g = sin(ph) * .6 + sin(ph * 2.3 + 1.7) * .25 + sin(p.x * .31 + p.z * .27 + uTime * 1.9) * .15;
  float a = uWind.z * .3 * clamp(h / 14., 0., 1.);
  return vec3(uWind.x * g * a, -abs(g) * a * .15, uWind.y * g * a);
}
`;

// One set of uniform objects for every estate material of a world (or of the judging viewer). The world writes the
// hour's light into them once at build; only uTime changes afterwards.
export function makeEstateUniforms(o = {}) {
  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  let place = o.place;
  if (!place) {
    // a plain place: no leaves overhead, sun everywhere, the red bounce of the cut
    place = new THREE.DataTexture(new Uint8Array([0, 0, 200, 0]), 1, 1, THREE.RGBAFormat);
    place.needsUpdate = true;
  }
  const sun = v3(o.sunDir || [0.53, 0.67, 0.53]).normalize();
  return {
    uTime: { value: 0 }, uFogDen: { value: o.fogDensity ?? 0.0011 },
    uSunDir: { value: sun }, uSunCol: { value: v3(o.sunColor || [3.4, 3.05, 2.5]) },
    uSkyCol: { value: v3(o.skyColor || [0.62, 0.92, 1.36]) }, uGndCol: { value: v3(o.groundColor || [0.17, 0.24, 0.08]) },
    uFogCol: { value: v3(o.fogColor || [0.48, 0.62, 0.74]) }, uLeafFill: { value: v3(o.leafFill || [0.3, 0.62, 0.2]) },
    uPortalCol: { value: v3(o.portalColor || [0, 0, 0]) }, uCloud: { value: v3(o.cloud || [0, 90, 0]) },
    tPlace: { value: place }, uPlaceBox: { value: new THREE.Vector4(...(o.placeBox || [0, 0, 1, 1])) },
    uWind: { value: new THREE.Vector4(...(o.wind || [0.966, -0.259, 1, 1])) },
    uPortal: { value: new THREE.Vector4(...(o.portal || [0, -999, 0, 30])) }, uCanopy: { value: new THREE.Vector2(...(o.canopy || [46, 56])) },
    uCloudOff: { value: new THREE.Vector2(...(o.cloudOffset || [0, 0])) },
  };
}

// ---------------------------------------------------------------- the estate's plan (plain arithmetic, nothing drawn)
// smooth curve through [x, y] nodes (Catmull-Rom tangents), flat beyond both ends
const hermite = (nodes, x) => {
  const n = nodes.length;
  if (x <= nodes[0][0]) return nodes[0][1];
  if (x >= nodes[n - 1][0]) return nodes[n - 1][1];
  let i = 0; while (x > nodes[i + 1][0]) i++;
  const x0 = nodes[i][0], x1 = nodes[i + 1][0], h = x1 - x0, t = (x - x0) / h, y0 = nodes[i][1], y1 = nodes[i + 1][1];
  const m0 = i > 0 ? (y1 - nodes[i - 1][1]) / (x1 - nodes[i - 1][0]) : (y1 - y0) / h;
  const m1 = i < n - 2 ? (nodes[i + 2][1] - y0) / (nodes[i + 2][0] - x0) : (y1 - y0) / h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
};
// signed distance to a closed polygon [[x, z], ...] (negative inside)
const sdPolygon = (x, z, P) => {
  let d = Infinity, inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const ax = P[j][0], az = P[j][1], ex = P[i][0] - ax, ez = P[i][1] - az, wx = x - ax, wz = z - az;
    const t = clamp((wx * ex + wz * ez) / (ex * ex + ez * ez), 0, 1), dx = wx - ex * t, dz = wz - ez * t;
    d = Math.min(d, dx * dx + dz * dz);
    if ((P[i][1] > z) !== (az > z) && x < ex * (z - az) / ez + ax) inside = !inside;
  }
  return (inside ? -1 : 1) * Math.sqrt(d);
};
// distance to an open polyline [[x, z], ...]
const distPolyline = (x, z, P) => {
  let d = Infinity;
  for (let i = 0; i < P.length - 1; i++) {
    const ax = P[i][0], az = P[i][1], ex = P[i + 1][0] - ax, ez = P[i + 1][1] - az, wx = x - ax, wz = z - az;
    const t = clamp((wx * ex + wz * ez) / (ex * ex + ez * ez), 0, 1), dx = wx - ex * t, dz = wz - ez * t;
    d = Math.min(d, dx * dx + dz * dz);
  }
  return Math.sqrt(d);
};

// ground under the drive and the lawn, as the land falls gently from the wood to the house (a rule of x alone)
const BASE_NODES = [[0, 30], [40, 30.5], [85, 30.6], [130, 30.8], [175, 31.2], [220, 31.6], [265, 32.2], [310, 32.6], [360, 33.2], [410, 33.6], [460, 34]];
// the fall of the lawn's hollow and of the valley floor along the valley's axis (metres from the lawn's seaward corner)
const FLOOR_NODES = [[-100, 30], [-50, 26.5], [0, 22], [20, 20], [220, 2], [265, 0], [295, -2.2], [420, -7]];
// the open lawn (wood and garden stand outside it)
const LAWN = [[52, -30], [52, 46], [-58, 100], [-188, 126], [-262, 82], [-286, 8], [-250, -96], [-170, -152], [-60, -176], [16, -136]];
// how far behind the entry the drive, the ground and the wood go on along the entry's own axis
export const BEHIND = 400;

export function makeLayout(seed) { const it = layoutSteps(seed); let r = it.next(); while (!r.done) r = it.next(); return r.value; }

// The same plan made in steps (a generator: the world's build hands the page back between them, makeLayout runs them
// through at once). The steps change nothing of what is made.
export function* layoutSteps(seed) {
  // every seeded stream of the plan, taken once, in this order
  const rRoute = makeRng(hashSeed('route:' + seed)), rGround = makeRng(hashSeed('ground:' + seed));
  const noise = makeNoise(hashSeed('estate-noise:' + seed));
  const mirror = rRoute.chance(0.5) ? -1 : 1, swing = [0, 1, 2, 3].map(() => rRoute.range(0.56, 0.76));
  const streamPhase = rGround.range(0, TAU), coastPhase = rGround.range(0, 50);
  const P = PLACE, A = P.valleyAxis, AL = [A[1], -A[0]];
  const toValley = (x, z) => [(x - P.lawnCorner[0]) * A[0] + (z - P.lawnCorner[1]) * A[1], (x - P.lawnCorner[0]) * AL[0] + (z - P.lawnCorner[1]) * AL[1]];
  const fromValley = (s, l) => [P.lawnCorner[0] + A[0] * s + AL[0] * l, P.lawnCorner[1] + A[1] * s + AL[1] * l];
  const mouth = fromValley(P.valleyLength, 0), tide = fromValley(P.valleyLength + P.beachDepth, 0);
  const ring = fromValley(P.valleyLength + P.beachDepth + P.ringBeyondTide, 0);
  // the route's plan points: [x, z, riding height over the ground] (the last three ride level at the ring's height)
  const axisZ = (x) => 30 - (460 - x) * (6 / 240);
  const sw = (x, zBrief, k) => axisZ(x) + mirror * swing[k] * (zBrief - axisZ(x));
  const hf = P.houseFront, hc = P.houseCentre, ha = P.houseAxis, fd = P.frontDistance, hl = P.houseLength / 2;
  const front = (t) => [hc[0] + hf[0] * fd + ha[0] * t, hc[1] + hf[1] * fd + ha[1] * t];
  // from the cut's west mouth the line runs straight for the front's east end (the house's front wide before it), turns
  // left onto the front's own line on an arc whose corner is the east end abeam, runs along the whole front, keeps on
  // level past the seaward end while the lawn falls away, and comes down the hollow to the valley's head
  const fE = front(-hl - P.turnLead), fW = front(hl), wm = P.westMouth, sillY = P.groundLawn + P.sill;
  const d1 = [fE[0] - wm[0], fE[1] - wm[1]], dl = Math.hypot(d1[0], d1[1]), c1 = [d1[0] / dl, d1[1] / dl];
  const half = Math.acos(clamp(c1[0] * ha[0] + c1[1] * ha[1], -1, 1)) / 2, tl = P.turnRadius * Math.tan(half);
  const bis = [ha[0] - c1[0], ha[1] - c1[1]], bl = Math.hypot(bis[0], bis[1]), arcIn = P.turnRadius * (1 / Math.cos(half) - 1);
  const arc0 = [fE[0] - c1[0] * tl, fE[1] - c1[1] * tl], arcM = [fE[0] + bis[0] / bl * arcIn, fE[1] + bis[1] / bl * arcIn], arc1 = front(-hl - P.turnLead + tl);
  const hold1 = front(hl + P.holdLength / 2), hold2 = front(hl + P.holdLength), head = fromValley(10, -10);
  // a plan point: [x, z, riding height over the ground] or, with a fourth number, [x, z, 0, the line's own height]
  const plan = [
    [P.entry[0], P.entry[1], RIDE.gravel], [490, 30, RIDE.gravel], [P.straightEnd[0], P.straightEnd[1], RIDE.gravel],
    [410, sw(410, 42, 0), RIDE.gravel], [360, sw(360, 22, 1), RIDE.gravel], [310, sw(310, 38, 2), RIDE.gravel], [265, sw(265, 20, 3), RIDE.gravel],
    [P.eastMouth[0], P.eastMouth[1], RIDE.gravel], [175, 35, RIDE.gravel], [P.bend[0], P.bend[1], RIDE.gravel], [85, 26, RIDE.gravel],
    [P.westMouth[0], P.westMouth[1], RIDE.gravel], [(wm[0] + arc0[0]) / 2, (wm[1] + arc0[1]) / 2, RIDE.lawnEdge], [arc0[0], arc0[1], RIDE.lawn],
    [arcM[0], arcM[1], 0, sillY - 0.4], [arc1[0], arc1[1], 0, sillY], [fW[0], fW[1], 0, sillY], [hold1[0], hold1[1], 0, sillY], [hold2[0], hold2[1], 0, sillY],
    [head[0], head[1], RIDE.head], [-262, 78, RIDE.valley], [-310, 112, RIDE.valley], [-357, 134, RIDE.valleyLow],
  ];
  const level = [mouth, [(mouth[0] + ring[0]) / 2, (mouth[1] + ring[1]) / 2], ring];
  return yield* finishLayout({ seed, noise, mirror, swing, streamPhase, coastPhase, toValley, fromValley, mouth, tide, ring, plan, level, front, fE, fW, arc0, arc1, hold2 });
}

function* finishLayout(S) {
  const { toValley, plan, level } = S, P = PLACE;
  const pathOf = (ys) => makePath(plan.map((p, i) => [p[0], ys ? ys[i] : 0, p[1]]).concat(level.map((p) => [p[0], ys ? P.ringHeight : 0, p[1]])), { samples: 1200 });
  // the route's line as metre samples, with the drive's run behind the entry (negative metres) before them
  const tables = (path, withGrid) => {
    const L = path.length, N = Math.ceil(L), B = BEHIND, n = B + N + 1, X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let k = 0; k < n; k++) { path.posAtDist(Math.min(k - B, L), v); X[k] = v.x; Y[k] = v.y; Z[k] = v.z; }
    // the route's sideways place in the valley's own frame, by metres along the valley's axis (-110 to 300)
    const LR0 = -110, LRN = 411, lrT = new Float32Array(LRN).fill(NaN);
    let ps = NaN, pl = 0;
    for (let k = B; k < n; k++) {
      const q = toValley(X[k], Z[k]);
      if (ps === ps && q[0] > ps) for (let i = Math.max(0, Math.ceil(ps - LR0)); i <= Math.min(LRN - 1, Math.floor(q[0] - LR0)); i++) lrT[i] = lerp(pl, q[1], (i + LR0 - ps) / (q[0] - ps));
      if (!(q[0] <= ps)) { ps = q[0]; pl = q[1]; }
    }
    let first = 0; while (first < LRN && lrT[first] !== lrT[first]) first++;
    for (let i = 0; i < LRN; i++) if (lrT[i] !== lrT[i]) lrT[i] = i < first ? lrT[first] : lrT[i - 1];
    const lr = (s) => { const f = clamp(s - LR0, 0, LRN - 1.001), i = Math.floor(f); return lerp(lrT[i], lrT[i + 1], f - i); };
    const T = { path, L, N, B, n, X, Y, Z, lr, routeDist: () => 0 };
    if (!withGrid) return T;
    // a 4 m grid of the nearest route sample, for quick questions of "how far from the route's line"
    const CELL = 4, REACH = 72, x0 = Math.min(...X) - REACH, z0 = Math.min(...Z) - REACH, gx = Math.ceil((Math.max(...X) + REACH - x0) / CELL) + 1, gz = Math.ceil((Math.max(...Z) + REACH - z0) / CELL) + 1;
    const gi = new Int32Array(gx * gz).fill(-1), gd = new Float32Array(gx * gz).fill(1e9), R = Math.ceil(REACH / CELL);
    for (let k = 0; k < n; k += 3) {
      const ci = Math.round((X[k] - x0) / CELL), cj = Math.round((Z[k] - z0) / CELL);
      for (let j = Math.max(0, cj - R); j <= Math.min(gz - 1, cj + R); j++) for (let i = Math.max(0, ci - R); i <= Math.min(gx - 1, ci + R); i++) {
        const dx = x0 + i * CELL - X[k], dz = z0 + j * CELL - Z[k], d = dx * dx + dz * dz, c = j * gx + i;
        if (d < gd[c]) { gd[c] = d; gi[c] = k; }
      }
    }
    // nearest point of the route's line to (x, z): out = [distance, metres from the entry, metres to the left of travel]
    T.routeAt = (x, z, out) => {
      const i = Math.round((x - x0) / CELL), j = Math.round((z - z0) / CELL);
      const k0 = i >= 0 && j >= 0 && i < gx && j < gz ? gi[j * gx + i] : -1;
      if (k0 < 0 || gd[j * gx + i] > REACH * REACH) { out[0] = REACH; out[1] = NaN; out[2] = 0; return out; }
      let best = 1e9, bm = 0, bl = 0;
      for (let k = Math.max(0, k0 - 5); k < Math.min(n - 1, k0 + 5); k++) {
        const ex = X[k + 1] - X[k], ez = Z[k + 1] - Z[k], wx = x - X[k], wz = z - Z[k], ee = ex * ex + ez * ez;
        const t = clamp((wx * ex + wz * ez) / ee, 0, 1), dx = wx - ex * t, dz = wz - ez * t, d = dx * dx + dz * dz;
        if (d < best) { best = d; bm = k - B + t; bl = (wx * ez - wz * ex) / Math.sqrt(ee); }
      }
      out[0] = Math.sqrt(best); out[1] = bm; out[2] = bl; return out;
    };
    const tmp = [0, 0, 0];
    T.routeDist = (x, z) => T.routeAt(x, z, tmp)[0];
    // metres from the entry of the route's nearest point to a place (exact scan)
    T.metreOf = (x, z) => { let best = 1e18, bk = 0; for (let k = B; k < n; k++) { const d = (X[k] - x) ** 2 + (Z[k] - z) ** 2; if (d < best) { best = d; bk = k; } } return bk - B; };
    return T;
  };
  return yield* groundAndPlaces(S, pathOf, tables);
}

function* groundAndPlaces(S, pathOf, tables) {
  const { noise, toValley, fromValley, plan } = S, P = PLACE;
  const flat = pathOf(null);
  yield;
  let T = tables(flat, false);
  yield;
  // (the lawn's edge fades out over 10 m beyond its outline: 12 m and more outside the outline's own box it is 0, with
  // no measuring to the outline's sides)
  const LB = [Math.min(...LAWN.map((q) => q[0])) - 12, Math.min(...LAWN.map((q) => q[1])) - 12, Math.max(...LAWN.map((q) => q[0])) + 12, Math.max(...LAWN.map((q) => q[1])) + 12];
  const lawnIn = (x, z) => (x <= LB[0] || z <= LB[1] || x >= LB[2] || z >= LB[3] ? 0 : 1 - smoothstep(-6, 10, sdPolygon(x, z, LAWN)));
  // the valley's and the cove's cross-section at (s along the axis, l to the left of it): [floor centre, half floor, slope width]
  const floorHalf = (s) => lerp(6.5, 35, smoothstep(196, 230, s));
  const slopeWidth = (s) => lerp(60, 38.5, smoothstep(-10, 45, s)) - 22.5 * smoothstep(204, 250, s);
  const streamAt = (s) => T.lr(s) + 7 + 1.3 * Math.sin(s * 0.085 + S.streamPhase) + 0.6 * Math.sin(s * 0.27 + 2 * S.streamPhase);
  // the cove's rock flanks stand in buttresses and gullies: metres by which a flank's foot is set in or out, along it
  // (none above the cove: no noise is asked for where its weight is 0; the same in coastAt and in ground's upper slopes)
  const flankInset = (s, left) => (s <= 206 ? 0 : smoothstep(206, 236, s) * (4.5 * noise.n2(s * 0.075 + 1.7, left ? 3.1 : 7.9) + 2 * noise.n2(s * 0.21 + 4.2, left ? 5.5 : 9.3)));
  const coastAt = (s, l, a) => {
    const head = smoothstep(33, 46, a) * (1 - smoothstep(78, 108, a));
    return 243 + 14 * noise.n2(l * 0.012 + S.coastPhase, 0.5) + (head > 0 ? head * (110 + 12 * noise.n2(l * 0.05, 3.3)) : 0);
  };
  // the open ground that falls away to the sea, in the valley's frame: metres past its brow (negative before it). The brow
  // runs beside the line from just past the house's seaward end, keeps behind the azaleas of the valley's upper right
  // side (a low bank there, no wood on it: rimLow) and swings out round the wooded rim lower down
  const rimLow = (s) => smoothstep(-40, 10, s) * (1 - smoothstep(110, 170, s));
  const fallPast = (s, l) => lerp(lerp(-30, -75, smoothstep(-50, 40, s)), -93, smoothstep(110, 170, s)) - l;
  // 1 on the fall, 0 off it; and the bay that lies at its foot (1 = sea)
  const seaFall = (s, l) => smoothstep(-85, -45, s) * smoothstep(0, 14, fallPast(s, l));
  const bayIn = (s, l) => smoothstep(-85, -45, s) * smoothstep(112, 138, fallPast(s, l) + 9 * noise.n2(s * 0.021 + S.coastPhase, 6.1));
  // the stream comes down in three small falls: at three of its rows of stones (dealt with the rows, on the stones' own
  // stream) the bed is built up behind the row and drops 0.75 m at it; under the middle one lies a pool.
  // stair(s): metres the bed stands over the valley's own fall; pool(s): 1 along the pool
  const falls = stoneRows(S.seed).falls;
  const stair = (s) => falls.reduce((h, f) => h + 0.75 * (smoothstep(f - 14, f - 0.3, s) - smoothstep(f - 0.3, f + 0.5, s)), 0);
  const pool = (s) => smoothstep(falls[1] + 0.3, falls[1] + 2, s) - smoothstep(falls[1] + 7, falls[1] + 11, s);
  const ground = (x, z) => {
    const base = hermite(BASE_NODES, x), v = toValley(x, z), s = v[0], l = v[1], k = smoothstep(-135, -100, s);
    // (the land's own roll: none within 7 m of the route's line and none on the lawn, and no noise is asked for there)
    const far = smoothstep(7, 24, T.routeDist(x, z)), rough = far > 0 ? 1 - lawnIn(x, z) : 0;
    const und = rough > 0 ? 0.9 * noise.fbm2(x * 0.011 + 3.1, z * 0.011 - 1.7, 2) * far * rough : 0;
    if (k <= 0) return base + und;
    const lc = T.lr(s) + 2.5, a = Math.abs(l - lc), F = hermite(FLOOR_NODES, s), side = l > lc ? 1 : -1;
    let top = s <= 0 ? base : 30 - 14 * smoothstep(40, 260, s) + 2 * side * smoothstep(60, 240, s);
    top += und + (s > 20 ? 1.3 * smoothstep(20, 60, s) * noise.fbm2(x * 0.03 + 9.2, z * 0.03 + 4.4, 2) : 0);
    // there the lawn and then the heath fall away, steeply at first and ever more gently, to a low shore
    const hs = seaFall(s, l);
    if (side < 0) top = lerp(top, F + 7, rimLow(s));
    if (hs > 0) top = lerp(top, top * (1 - 1.03 * (1 - Math.exp(-Math.max(0, fallPast(s, l)) / 45))), hs);
    const coast = coastAt(s, l, a), land = (1 - smoothstep(coast - 20, coast + 5, s)) * (1 - bayIn(s, l));
    // the land by the sea is rock under thin turf: ledges and gullies, none on the valley's floor or the shingle
    const af = a + flankInset(s, side > 0);
    const rocky = smoothstep(214, 246, s) * land * smoothstep(floorHalf(s) + 2, floorHalf(s) + 12, af);
    const ledges = rocky > 0 ? rocky * (2.4 * (1 - Math.abs(noise.n2(x * 0.07 + 5.3, z * 0.07 - 2.1))) - 1.2 + 0.9 * (1 - Math.abs(noise.n2(x * 0.19 - 1.4, z * 0.19 + 8.8)))) : 0;
    top = lerp(-3.5 - 0.02 * Math.max(0, s - coast), top * (1 - 0.45 * smoothstep(275, 362, s)), land);
    let hv = F + (top - F) * smoothstep(0, 1, (af - floorHalf(s)) / slopeWidth(s)) + ledges;
    if (s > 12 && s < 266) {
      const ds = Math.abs(l - streamAt(s));
      hv -= 0.7 * (1 - smoothstep(0.5, 2.1, ds)) * smoothstep(12, 22, s) * (1 - 0.6 * smoothstep(222, 250, s));
      hv += (stair(s) - 0.35 * pool(s)) * (1 - smoothstep(2.4, 4.8, ds));
    }
    return lerp(base + und, hv, k);
  };
  // heights of the route's points: the ground under each plus the riding height of its place
  const ys = plan.map((p) => (p.length > 3 ? p[3] : ground(p[0], p[1]) + p[2])), risen = pathOf(ys);
  yield;
  T = tables(risen, true);
  yield;
  const path = T.path, ra = [0, 0, 0];
  const M = {
    straight: T.metreOf(P.straightEnd[0], P.straightEnd[1]), east: T.metreOf(P.eastMouth[0], P.eastMouth[1]), bend: T.metreOf(P.bend[0], P.bend[1]),
    west: T.metreOf(P.westMouth[0], P.westMouth[1]), turn: T.metreOf(S.arc0[0], S.arc0[1]), onFront: T.metreOf(S.arc1[0], S.arc1[1]), houseW: T.metreOf(S.fW[0], S.fW[1]),
    holdEnd: T.metreOf(S.hold2[0], S.hold2[1]), corner: T.metreOf(P.lawnCorner[0], P.lawnCorner[1]), mouth: T.metreOf(S.mouth[0], S.mouth[1]),
  };
  // the valley's head: where the level run ends and the line starts down into the hollow; the first azaleas stand
  // beside the line from there on (headS: that place in metres along the valley's axis, negative above the lawn's corner)
  const headS = toValley(S.hold2[0], S.hold2[1])[0];
  M.head = M.holdEnd;
  // the gravel goes on under the route from the cut's west mouth to where the route turns for the front; there it leaves
  // for the porch on the east gable and its forecourt
  const sweep = [[S.arc0[0], S.arc0[1]], [S.arc0[0] - 13, S.arc0[1] - 12], [-63, -78], [-70, -92]];
  const forecourt = [-72, -97, 9];
  // metres to the middle of the gravel and its half width there: the drive under the route as far as the west mouth, then the sweep
  const drive = (x, z, out) => {
    T.routeAt(x, z, ra);
    const onRoute = ra[1] === ra[1] && ra[1] <= M.turn + 0.5, inCut = onRoute ? smoothstep(M.east - 14, M.east + 6, ra[1]) : 1;
    // the drive is 3.2 to 3.8 m wide in the wood (its width wanders along it), 7 m between the banks, 5 m over the lawn
    const wide = onRoute ? 1.75 + 0.15 * Math.sin(ra[1] * 0.063 + S.streamPhase) : 2.5;
    let d = onRoute ? ra[0] : 1e3, hw = lerp(lerp(wide, 3.5, inCut), 2.5, onRoute ? smoothstep(M.west, M.west + 40, ra[1]) : 1);
    if (x < S.arc0[0] + 12 && z < -30) {
      const ds = distPolyline(x, z, sweep), df = Math.hypot(x - forecourt[0], z - forecourt[1]) - forecourt[2] + 2.5;
      const d2 = Math.min(ds, df);
      if (d2 < d) { d = d2; hw = 2.5; }
    }
    out[0] = d; out[1] = hw; return out;
  };
  // the cut: 1 between the east and west mouths (0 outside), by the nearest route metre
  const cutSpan = (m) => smoothstep(M.east - 2, M.east + 6, m) * (1 - smoothstep(M.west - 6, M.west + 2, m));
  // where the wood stands: land that is not lawn, not the cut's strip, not the valley's flowered sides, not beach or sea
  const woodIn = (x, z) => {
    T.routeAt(x, z, ra);
    const cut = ra[1] === ra[1] ? cutSpan(ra[1]) * (1 - smoothstep(36, 44, ra[0])) : 0;
    const v = toValley(x, z), lc = T.lr(v[0]) + 2.5, a = Math.abs(v[1] - lc);
    const valley = smoothstep(-12, 6, v[0]) * (1 - smoothstep(50, 62, a));
    // (no tree stands on the headlands or the land by the sea: the wood ends 232 m down the valley's axis)
    const sea = Math.max(smoothstep(coastAt(v[0], v[1], a) - 34, coastAt(v[0], v[1], a) - 22, v[0]), smoothstep(222, 232, v[0]));
    return (1 - lawnIn(x, z)) * (1 - cut) * (1 - valley) * (1 - sea) * (1 - seaFall(v[0], v[1])) * (1 - (v[1] < lc ? rimLow(v[0]) : 0));
  };
  return {
    seed: S.seed, noise, toValley, fromValley, tide: S.tide, ring: S.ring, path, tables: T, places: M, headS, ground, lawnIn, woodIn, seaFall, cutSpan, drive, floorHalf, flankInset, streamAt, falls, pool, sweep, forecourt,
    routeAt: T.routeAt, routeDist: T.routeDist, lr: T.lr,
  };
}

// ---------------------------------------------------------------- the bank builder
// A bank is a chain of great rounded bushes grown into one mass beside a line. buildBank returns, in chunks along the
// line: the lumpy mass (a grid over the bank's cross-section, with the places of flower and of leaf written into its
// vertices from the bank's own form), the built flower heads and the leaf whorls as instance matrices.
//   o.line   [[x, z], ...] at about 1 m steps: the drive's middle line (a bank), or a bush's own short axis
//   o.side   +1 the bank stands left of the line, -1 right of it, 0 a free-standing bush astride the line
//   o.foot(s), o.thick(s), o.tall(s)   metres from the line to the nearer foot; thickness; scale of the dome heights
//   o.lean   metres the upper face leans toward the line; o.domeHalf, o.domeHigh   [lo, hi] of the domes
//   o.groundAt(x, z), o.rng, o.heavy (the heavy-flowering year: flower over the whole face, heads an eighth more and
//   an eighth larger), o.perM2 (flower heads per square metre of flower)
//   o.feet [lo, hi] metres up over which a bush's flower begins; o.lumpAmp scale of the bulges (small bushes take small ones)
//   o.thin (a stream of its own), o.lineDist(x, z), o.headNear, o.headFar   the thinning of built heads and whorls by place
export async function buildBank(o, yieldFn) {
  const rng = o.rng, line = o.line, side = o.side, bush = side === 0, heavy = !!o.heavy;
  const nl = line.length, cum = [0];
  for (let i = 1; i < nl; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const LEN = cum[nl - 1], ds = o.cell || 0.95, ns = Math.max(4, Math.round(LEN / ds)), NT = o.rows || 28;
  const foot = o.foot || (() => 11), thick = o.thick || (() => 12), tall = o.tall || (() => 1), leanM = o.lean ?? 5.5;
  const dHalf = o.domeHalf || [4, 8], dHigh = o.domeHigh || [12, 16];
  // the chain of domes, then the smaller bulges on them
  const domes = [];
  for (let s = -dHalf[0] * 0.4; s < LEN + dHalf[0] * 0.4;) {
    const r = rng.range(dHalf[0], dHalf[1]), c = s + r * 0.85;
    domes.push({ c, r, h: rng.range(dHigh[0], dHigh[1]), b: rng.range(0, 1.8) * (bush ? 0.4 : 1) }); s += r * rng.range(1.5, 1.8);
  }
  const lumps = [], nLump = Math.round(LEN * (o.lumps ?? 0.6)) + (bush ? 6 : 0);
  for (let i = 0; i < nLump; i++) lumps.push({ s: rng.range(0, LEN), t: rng.range(0.08, bush ? 2.9 : 2.2), r: rng.range(1.8, 3.6), a: rng.range(0.45, 1.15) * (rng.chance(0.22) ? -0.8 : 1) * (o.lumpAmp ?? 1) });
  const seedN = rng.range(0, 100);
  const vn = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const h = (i, j) => hash1(i * 57.3 + j * 131.7 + seedN);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
  };
  const lineAt = (s) => {
    let i = 0; while (i < nl - 2 && cum[i + 1] < s) i++;
    const t = clamp((s - cum[i]) / Math.max(cum[i + 1] - cum[i], 1e-6), 0, 1), ex = line[i + 1][0] - line[i][0], ez = line[i + 1][1] - line[i][1], el = Math.hypot(ex, ez) || 1;
    return [lerp(line[i][0], line[i + 1][0], t), lerp(line[i][1], line[i + 1][1], t), ex / el, ez / el];
  };
  // columns: everything that depends on the place along the line only
  const NV = NT + 1, cols = [];
  const th = (j) => Math.PI * Math.pow(j / NT, bush ? 1 : 1.3);
  for (let i = 0; i <= ns; i++) {
    const s = LEN * i / ns, q = lineAt(s), sd = side >= 0 ? 1 : -1, ox = q[3] * sd, oz = -q[2] * sd;
    let km = 0, H = 0, bul = 0;
    for (const d of domes) { const k = Math.sqrt(Math.max(0, 1 - ((s - d.c) / (1.15 * d.r)) ** 2)); if (k > km) km = k; H = Math.max(H, d.h * (0.7 + 0.3 * k)); bul = Math.max(bul, d.b * k); }
    const wFull = thick(s), endR = Math.min(wFull * 0.5, 6.5), dEnd = Math.min(s, LEN - s), e = Math.sqrt(Math.max(0, 1 - (1 - clamp(dEnd / endR, 0, 1)) ** 2));
    const ek = Math.max(e, 0.04), w = wFull * (0.78 + 0.22 * km) * ek, h = H * tall(s) * (0.25 + 0.75 * ek);
    const c = bush ? 0 : foot(s) + wFull * 0.5, near = lumps.filter((l) => Math.abs(l.s - s) < l.r * 2);
    cols.push({ s, x: q[0], z: q[1], ox, oz, tx: q[2], tz: q[3], w, h, c, km, bul: bul * ek, e, near, hol: 1 - smoothstep(0.25, 0.75, km) });
  }
  if (yieldFn) await yieldFn();
  return bankMesh({ o, rng, bush, heavy, ns, NT, NV, cols, th, vn, leanM, LEN, feet: o.feet || [0.7, 1.9] }, yieldFn);
}

async function bankMesh(B, yieldFn) {
  const { o, bush, heavy, ns, NT, NV, cols, th, vn, leanM } = B;
  const n = (ns + 1) * NV, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), mask = new Float32Array(n * 4), aux = new Float32Array(n * 2);
  const groundAt = o.groundAt || (() => 0), sink = o.sink ?? 0.25;
  // (what goes by the row alone is worked once for the whole bank: its angle, its place across and up the form, how
  // much of the lean and of the front's swell it takes)
  const rows = []; for (let j = 0; j < NV; j++) { const t = th(j), cs = Math.cos(t); rows.push([t, Math.sign(cs) * Math.pow(Math.abs(cs), 0.6), Math.pow(Math.sin(t), 0.55), 1 - smoothstep(1.22, 2.27, t), bush ? 1 : 1 - smoothstep(1.4, 2.4, t)]); }
  for (let i = 0; i <= ns; i++) {
    const c = cols[i], hw = c.w * 0.5;
    const gF = groundAt(c.x + c.ox * (c.c - hw), c.z + c.oz * (c.c - hw)), gB = groundAt(c.x + c.ox * (c.c + hw), c.z + c.oz * (c.c + hw));
    let arc = 0;
    for (let j = 0; j < NV; j++) {
      const row = rows[j], t = row[0], k = (i * NV + j);
      let u = -hw * row[1], y = c.h * row[2];
      if (!bush) u -= leanM * c.e * Math.pow(y / Math.max(c.h, 0.1), 1.4) * row[3];
      const ry = y - 0.3 * c.h, rl = Math.hypot(u, ry) || 1;
      let lump = 0;
      for (const l of c.near) { const d2 = ((c.s - l.s) / l.r) ** 2 + ((t - l.t) * 11 / l.r) ** 2; if (d2 < 6) lump += l.a * Math.exp(-d2); }
      const disp = (c.bul * row[4] * Math.pow(Math.sin(Math.PI * clamp(y / Math.max(c.h, 0.1), 0, 1)), 0.7) + lump + 0.3 * (vn(c.s * 0.55, t * 6) - 0.5) + 0.18 * (vn(c.s * 1.7, t * 19) - 0.5)) * c.e;
      u += (u / rl) * disp; y = Math.max(0, y + Math.max(ry / rl, -0.2) * disp);
      const g = lerp(gF, gB, clamp((u + hw) / Math.max(c.w, 0.1), 0, 1));
      pos[k * 3] = c.x + c.ox * (c.c + u); pos[k * 3 + 1] = g + y - sink; pos[k * 3 + 2] = c.z + c.oz * (c.c + u);
      if (j > 0) arc += Math.hypot(pos[k * 3] - pos[k * 3 - 3], pos[k * 3 + 1] - pos[k * 3 - 2], pos[k * 3 + 2] - pos[k * 3 - 1]);
      uv[k * 2] = c.s + (o.uvOffset || 0); uv[k * 2 + 1] = arc;
      aux[k * 2] = y; aux[k * 2 + 1] = clamp(-Math.min(0, lump) / 0.8, 0, 1);
    }
  }
  if (yieldFn) await yieldFn();
  // normals from the grid's own neighbours, turned outward; then the places of flower and leaf, from the form alone
  for (let i = 0; i <= ns; i++) for (let j = 0; j < NV; j++) {
    const k = i * NV + j, c = cols[i], a = (Math.min(ns, i + 1) * NV + j) * 3, b = (Math.max(0, i - 1) * NV + j) * 3, d = (i * NV + Math.min(NT, j + 1)) * 3, e = (i * NV + Math.max(0, j - 1)) * 3;
    const sx = pos[a] - pos[b], sy = pos[a + 1] - pos[b + 1], sz = pos[a + 2] - pos[b + 2], tx = pos[d] - pos[e], ty = pos[d + 1] - pos[e + 1], tz = pos[d + 2] - pos[e + 2];
    let nx = ty * sz - tz * sy, ny = tz * sx - tx * sz, nz = tx * sy - ty * sx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const cx = c.x + c.ox * c.c, cz = c.z + c.oz * c.c, y = aux[k * 2];
    if (nx * (pos[k * 3] - cx) + ny * (y - 0.3 * c.h) + nz * (pos[k * 3 + 2] - cz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
    nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz;
    const backW = bush ? 0 : smoothstep(0.15, 0.55, nx * c.ox + nz * c.oz) * (1 - smoothstep(0.55, 0.85, ny)), cav = aux[k * 2 + 1];
    const feet = smoothstep(B.feet[0], B.feet[1], y), open = feet * (1 - 0.85 * Math.max(c.hol * c.e, cav * 0.8));
    mask[k * 4] = (1 - backW) * (heavy ? 1 : bush ? feet : open);
    // (the feet stand in shade stained red by the flowers over them, never black)
    mask[k * 4 + 1] = (0.68 + 0.32 * smoothstep(0, 6, y)) * (1 - 0.4 * c.hol) * (1 - 0.45 * cav);
    mask[k * 4 + 2] = smoothstep(0.62, 0.97, y / Math.max(c.h, 1));
    mask[k * 4 + 3] = y;
  }
  if (yieldFn) await yieldFn();
  return bankChunks({ ...B, n, pos, nor, uv, mask, aux }, yieldFn);
}

async function bankChunks(B, yieldFn) {
  const { o, rng, heavy, ns, NT, NV, cols, LEN, pos, nor, uv, mask } = B;
  const per = Math.max(1, Math.round((o.chunk || 30) / (LEN / ns))), chunks = [];
  const perM2 = (o.perM2 ?? 1.5) * (heavy ? 1.12 : 1), leafM2 = o.leafM2 ?? 1.9, sizes = (o.headSize || [0.42, 0.62]).map((x) => x * (heavy ? 1.15 : 1));
  const thinDraw = o.thin && o.lineDist ? o.thin : null, headNear = o.headNear ?? 16, headFar = o.headFar ?? 30;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), nv = new THREE.Vector3();
  // which way round the grid's triangles go, so that the outward side is the front face
  const k0 = Math.floor(ns / 2) * NV + Math.floor(NT / 3), ax = pos[(k0 + NV) * 3] - pos[k0 * 3], ay = pos[(k0 + NV) * 3 + 1] - pos[k0 * 3 + 1], az = pos[(k0 + NV) * 3 + 2] - pos[k0 * 3 + 2];
  const bx = pos[(k0 + 1) * 3] - pos[k0 * 3], by = pos[(k0 + 1) * 3 + 1] - pos[k0 * 3 + 1], bz = pos[(k0 + 1) * 3 + 2] - pos[k0 * 3 + 2];
  const flip = (ay * bz - az * by) * nor[k0 * 3] + (az * bx - ax * bz) * nor[k0 * 3 + 1] + (ax * by - ay * bx) * nor[k0 * 3 + 2] < 0;
  for (let c0 = 0, done = 0; c0 < ns; c0 += per) {
    const c1 = Math.min(ns, c0 + per), nc = c1 - c0 + 1, g = new THREE.BufferGeometry(), a = c0 * NV, b = (c1 + 1) * NV;
    g.setAttribute('position', new THREE.BufferAttribute(pos.slice(a * 3, b * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor.slice(a * 3, b * 3), 3));
    g.setAttribute('aUv', new THREE.BufferAttribute(uv.slice(a * 2, b * 2), 2));
    g.setAttribute('aMask', new THREE.BufferAttribute(mask.slice(a * 4, b * 4), 4));
    const idx = [], heads = [], headTint = [], leaves = [], leafTint = [];
    for (let i = 0; i < nc - 1; i++) for (let j = 0; j < NT; j++) {
      // (the page is asked back after every 48 columns of cells, about 10 ms of work, however long the chunks are)
      if (yieldFn && j === 0 && ++done % 48 === 0) await yieldFn();
      const p = i * NV + j, r = p + NV;
      if (flip) idx.push(p, p + 1, r, r, p + 1, r + 1); else idx.push(p, r, p + 1, p + 1, r, r + 1);
      // flower heads and leaf whorls of this cell, by its area and by how much of it is flower
      const ka = a + p, kb = ka + NV, kc = kb + 1, kd = ka + 1;
      const area = Math.hypot(pos[kb * 3] - pos[ka * 3], pos[kb * 3 + 1] - pos[ka * 3 + 1], pos[kb * 3 + 2] - pos[ka * 3 + 2]) * Math.hypot(pos[kd * 3] - pos[ka * 3], pos[kd * 3 + 1] - pos[ka * 3 + 1], pos[kd * 3 + 2] - pos[ka * 3 + 2]);
      const fl = (mask[ka * 4] + mask[kb * 4] + mask[kc * 4] + mask[kd * 4]) / 4, thin = (mask[ka * 4 + 2] + mask[kc * 4 + 2]) / 2;
      const backish = cols[c0 + i].ox * nor[ka * 3] + cols[c0 + i].oz * nor[ka * 3 + 2] > 0.45 && !B.bush;
      const nh = Math.floor(area * perM2 * fl * (1 + 0.5 * thin) + rng()), nlf = Math.floor(area * leafM2 * (1 - fl) * (backish ? 0.3 : 1) + rng());
      for (let e = 0; e < nh + nlf; e++) {
        const s = rng(), t = rng(), w0 = (1 - s) * (1 - t), w1 = s * (1 - t), w2 = s * t, w3 = (1 - s) * t, head = e < nh;
        const mix = (A, st, off) => A[ka * st + off] * w0 + A[kb * st + off] * w1 + A[kc * st + off] * w2 + A[kd * st + off] * w3;
        const jit = head ? 0.42 : 0.8, proud = head ? rng.range(0.1, 0.3) : rng.range(0.0, 0.25), size = head ? rng.range(sizes[0], sizes[1]) : rng.range(0.75, 1.25), roll = rng.range(0, TAU), tone = rng.range(0.78, 1.16);
        nv.set(mix(nor, 3, 0) + rng.range(-jit, jit), mix(nor, 3, 1) + rng.range(-jit, jit), mix(nor, 3, 2) + rng.range(-jit, jit)).normalize();
        if (head && mix(mask, 4, 0) < 0.4) continue;
        q.setFromUnitVectors(up, nv).multiply(q2.setFromAxisAngle(up, roll));
        v.set(mix(pos, 3, 0), mix(pos, 3, 1), mix(pos, 3, 2)).addScaledVector(nv, proud);
        // built heads and whorls stand at full size wherever they are; their number is thinned by place: each takes one
        // dealt draw against its own distance from the route's line (all within headNear of it, none beyond headFar)
        if (thinDraw && thinDraw() < smoothstep(headNear, headFar, o.lineDist(v.x, v.z))) continue;
        m4.compose(v, q, sc.set(size, size, size));
        const M = head ? heads : leaves, Tn = head ? headTint : leafTint;
        for (let z = 0; z < 16; z++) M.push(m4.elements[z]);
        Tn.push(tone, mix(mask, 4, 2), mix(mask, 4, 1), mix(mask, 4, 3));
      }
    }
    g.setIndex(idx); g.computeBoundingSphere();
    chunks.push({ geometry: g, heads: new Float32Array(heads), headTint: new Float32Array(headTint), leaves: new Float32Array(leaves), leafTint: new Float32Array(leafTint), sphere: g.boundingSphere });
  }
  if (yieldFn) await yieldFn();
  // the upper front edge of the bank (where spent flowers come loose) and every vertex, for whoever needs the bank's shape
  const edge = [];
  for (let i = 0; i <= ns; i += 2) { const k = i * NV + Math.round(NT * 0.5); edge.push([pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2], cols[i].ox, cols[i].oz]); }
  return { chunks, length: LEN, edge, eachVertex: (fn) => { for (let k = 0; k < B.n; k++) fn(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]); } };
}

// ---------------------------------------------------------------- the banks' three materials
const BANK_VERT_PARS = /* glsl */`
varying vec3 vW, vN, vP; varying vec2 vUv2; varying vec4 vMask;
`;
// flower cells and one head's pattern (the ground's spent flowers and pebbles use the cells too)
export const BANK_GLSL = /* glsl */`
// nearest flower cell: xy = offset to its middle, z = its own number, w = how near the seam to the next cell
vec4 esCell(vec2 p){
  vec2 ip = floor(p), fp = fract(p), bo = vec2(0.); float b1 = 9., b2 = 9., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j)), d = g + esH2(ip + g) * .76 + .12 - fp; float dd = dot(d, d);
    if (dd < b1){ b2 = b1; b1 = dd; bo = d; id = esH(ip + g + 3.7); } else if (dd < b2) b2 = dd;
  }
  return vec4(bo, id, sqrt(b2) - sqrt(b1));
}
// one flower head's own pattern at l (-1..1 across the head): lobes of the trumpets, a darker throat, a rim
float esHead(vec2 l, float id){
  float r = length(l), a = atan(l.y, l.x + 1e-4);
  float lobes = .5 + .5 * cos(a * 5. + id * 40.) * cos(r * 9. + id * 9.);
  float k = mix(.8, 1.1, smoothstep(.2, .85, lobes) * smoothstep(.2, .55, r));
  k *= mix(.5, 1., smoothstep(.02, .32, r));
  return k * mix(1., .72, smoothstep(.8, 1.02, r));
}
`;
const BANK_FRAG_PARS = BANK_GLSL + /* glsl */`
uniform vec3 uRed, uRedThru, uLeafCol, uRose; uniform float uThru, uFull, uHeadR, uBush;
varying vec3 vW, vN, vP; varying vec2 vUv2; varying vec4 vMask;
vec3 esThrough(vec3 n, vec3 p, float thin){
  vec3 v = normalize(cameraPosition - p);
  float toward = pow(clamp(dot(-v, uSunDir) * .5 + .5, 0., 1.), 3.);
  float behind = clamp(.35 - dot(n, uSunDir), 0., 1.);
  return uRedThru * uSunCol * (uThru * thin * toward * behind * esCloudShade(p) * .3183);
}
`;
export function makeBankMaterials(U, o = {}) {
  const own = {
    uRed: { value: new THREE.Vector3(...lin(o.red || '#b0101c')).multiplyScalar(o.redGain ?? 1.2) },
    uRedThru: { value: new THREE.Vector3(...lin(o.through2 || '#e02a2a')) }, uLeafCol: { value: new THREE.Vector3(...lin(o.leaf || '#27502c')) }, uThru: { value: o.through ?? 1.5 },
    uRose: { value: new THREE.Vector3(...lin(o.rose || '#d63a52')) }, uFull: { value: o.heavy ? 1.3 : (o.full ?? 0.64) }, uHeadR: { value: o.headR ?? 0.36 }, uBush: { value: o.bush ? 1 : 0 },
  };
  const uniforms = { ...U, ...own };
  const mass = new THREE.ShaderMaterial({
    uniforms, fog: false,
    vertexShader: ESTATE_GLSL + BANK_VERT_PARS + /* glsl */`
      attribute vec2 aUv; attribute vec4 aMask;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.);
        vP = wp.xyz;
        wp.xyz += esSway(wp.xyz, aMask.w);
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv2 = aUv; vMask = aMask;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: ESTATE_GLSL + BANK_FRAG_PARS + /* glsl */`
      void main(){
        vec3 n = normalize(vN), t = normalize(cross(n, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), b = cross(t, n);
        float dist = length(vW - cameraPosition), near = 1. - smoothstep(70., 190., dist);
        // a bank's flowers are laid out by its own metres (along it, up its face); a free-standing bush's by where it stands
        vec2 q = vUv2;
        if (uBush > .5) q = abs(n.y) > .62 ? vP.xz : (abs(n.x) > abs(n.z) ? vP.zy : vP.xy);
        vec4 c = esCell(q / .44);
        vec2 l = c.xy / .52;
        float isFlower = smoothstep(.36, .6, vMask.x * uFull + (c.z - .5) * .5);
        // between two heads the leaves under them show
        isFlower *= mix(.3 + uHeadR, 1. - smoothstep(uHeadR, uHeadR + .16, length(c.xy) + (esN(q * 9.) - .5) * .12), near);
        // the painted flower: every cell a domed head of its own tone and tilt, a dark seam between heads
        float tone = .66 + .56 * esH(vec2(c.z * 91.7, 3.1));
        vec3 petal = mix(uRed, uRose, smoothstep(.45, 1., esH(vec2(c.z * 17.3, 5.))) * .7) * tone;
        float pat = mix(1., esHead(l, c.z) * mix(.45, 1., smoothstep(.0, .1, c.w)), near);
        vec3 nf = normalize(n - (t * l.x + b * l.y) * (.85 * near) + (t * (esH(vec2(c.z, 7.)) - .5) + b * (esH(vec2(c.z, 9.)) - .5)) * (.5 * near));
        vec3 v = normalize(cameraPosition - vW);
        vec3 red = esLight(petal * pat, nf, vW, vMask.y, .4) + esThrough(nf, vW, vMask.z) * uRed.r * 1.6 * pat;
        red += uSkyCol * (.035 * pow(1. - clamp(dot(nf, v), 0., 1.), 2.)) * vMask.y;
        // the leaf: dark whorls with the sky's sheen on their upper faces
        vec4 lc = esCell(q / .34 + 17.);
        float blade = .5 + .5 * cos(atan(lc.y, lc.x + 1e-4) * 7. + lc.z * 30.);
        vec3 nl = normalize(n + (t * lc.x + b * lc.y) * (1.1 * near));
        vec3 leaf = esLight(uLeafCol * mix(1., .55 + .9 * blade, near), nl, vW, vMask.y * mix(1., smoothstep(0., .14, lc.w) * .6 + .4, near), .2);
        leaf += uSkyCol * (.05 * pow(1. - clamp(dot(nl, v), 0., 1.), 3.) + .03 * clamp(nl.y, 0., 1.)) * vMask.y;
        gl_FragColor = vec4(esFog(mix(leaf, red, isFlower), vW), 1.);
      }`,
  });
  return finishBankMaterials(uniforms, mass);
}

function finishBankMaterials(uniforms, mass) {
  const INST_VERT = /* glsl */`
    attribute vec4 aTint; varying vec2 vL; varying vec4 vTint;
    void main(){
      mat4 im = modelMatrix * instanceMatrix;
      vec3 org = im[3].xyz;
      vec4 wp = im * vec4(position, 1.);
      wp.xyz += esSway(org, aTint.w) + normalize(mat3(im) * vec3(0., 1., 0.)) * (.035 * min(aTint.w, 1.) * sin(uTime * 2.1 + aTint.x * 50.));
      vW = wp.xyz; vP = org; vN = normalize(mat3(im) * normal); vL = position.xz * 2.; vTint = aTint; vUv2 = vec2(0.); vMask = vec4(0.);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const head = new THREE.ShaderMaterial({
    uniforms, fog: false, side: THREE.DoubleSide,
    vertexShader: ESTATE_GLSL + BANK_VERT_PARS + INST_VERT,
    fragmentShader: ESTATE_GLSL + BANK_FRAG_PARS + /* glsl */`
      varying vec2 vL; varying vec4 vTint;
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float near = 1. - smoothstep(70., 190., length(vW - cameraPosition));
        float pat = mix(.93, esHead(vL, vTint.x), near);
        float hh = fract(vTint.x * 37.7);
        vec3 petal = mix(uRed, uRose, smoothstep(.45, 1., hh) * .7) * (.66 + .56 * fract(vTint.x * 91.3));
        // one truss in seven is still in bud: darker, closer, a point of deeper red at its middle
        float bud = step(.857, fract(vTint.x * 53.3));
        petal = mix(petal, petal * vec3(.6, .42, .5), bud * smoothstep(.15, .6, length(vL)));
        vec3 v = normalize(cameraPosition - vW);
        vec3 c = esLight(petal * pat, n, vW, vTint.z, .45) + esThrough(n, vW, vTint.y) * uRed.r * 1.6 * pat;
        c += uSkyCol * (.035 * pow(1. - clamp(dot(n, v), 0., 1.), 2.)) * vTint.z;
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  });
  const leaf = new THREE.ShaderMaterial({
    uniforms, fog: false, side: THREE.DoubleSide,
    vertexShader: ESTATE_GLSL + BANK_VERT_PARS + INST_VERT,
    fragmentShader: ESTATE_GLSL + BANK_FRAG_PARS + /* glsl */`
      varying vec2 vL; varying vec4 vTint;
      void main(){
        float r = length(vL), a = atan(vL.y, vL.x + 1e-4);
        float lobe = pow(clamp(.5 + .5 * cos(a * 7. + vTint.x * 30.), 0., 1.), .4);
        if (r > .22 + .76 * lobe) discard;
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 v = normalize(cameraPosition - vW);
        float rib = 1. - smoothstep(.0, .12, abs(sin(a * 3.5 + vTint.x * 15.)));
        vec3 c = esLight(uLeafCol * vTint.x * (.9 + .5 * rib + .5 * r), n, vW, vTint.z, .25);
        c += uSkyCol * (.05 * pow(1. - clamp(dot(n, v), 0., 1.), 3.) + .035 * clamp(n.y, 0., 1.)) * vTint.z;
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  });
  // a flower head: a low dome of six triangles, 1 m across before its instance's scale; a leaf whorl: one square
  const hp = [0, 0.3, 0], hn = [0, 1, 0], hi = [];
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; hp.push(Math.cos(a) * 0.52, -0.04, Math.sin(a) * 0.52); hn.push(Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8); hi.push(0, 1 + (k + 1) % 6, 1 + k); }
  const headGeometry = new THREE.BufferGeometry();
  headGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); headGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(hn, 3)); headGeometry.setIndex(hi);
  const leafGeometry = new THREE.BufferGeometry();
  leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5], 3));
  leafGeometry.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3)); leafGeometry.setIndex([0, 2, 1, 0, 3, 2]);
  const inst = (base, mat, mats, tints, sphere) => {
    const g = base.clone(), count = mats.length / 16, m = new THREE.InstancedMesh(g, mat, Math.max(count, 1));
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(count ? tints : new Float32Array(4), 4));
    if (count) m.instanceMatrix = new THREE.InstancedBufferAttribute(mats, 16);
    m.count = count; m.boundingSphere = new THREE.Sphere(sphere.center.clone(), sphere.radius + 2);
    return m;
  };
  // the three draws of every chunk of a built bank, as one group
  const assemble = (bank) => {
    const group = new THREE.Group(), parts = [];
    for (const c of bank.chunks) {
      const m = new THREE.Mesh(c.geometry, mass), h = inst(headGeometry, head, c.heads, c.headTint, c.sphere), l = inst(leafGeometry, leaf, c.leaves, c.leafTint, c.sphere);
      group.add(m, h, l); parts.push({ mass: m, heads: h, leaves: l, sphere: c.sphere });
    }
    return { group, parts, triangles: bank.chunks.reduce((t, c) => t + c.geometry.index.count / 3 + c.heads.length * 6 / 16 + c.leaves.length / 8, 0) };
  };
  return { mass, head, leaf, uniforms, headGeometry, leafGeometry, assemble };
}

// ---------------------------------------------------------------- the drive's ground between the banks
// albedo of the drive and its verges at xz, d metres from the gravel's middle line (half width hw), with spent red
// flowers lying on it (red 0..1: how thickly, a rule of the place: thick at the banks' feet, thin in the middle)
export const DRIVE_GLSL = /* glsl */`
uniform vec3 uGravel, uGrassA, uGrassB, uFallen;
vec3 esGravel(vec2 p){
  float n = esN(p * 9.) * .5 + esN(p * 23.) * .5, big = esN(p * .6 + 4.);
  float rake = .5 + .5 * sin(p.x * 3.1 + p.y * 28. + esN(p * .9) * 5.);
  return uGravel * (.8 + .3 * n) * (.9 + .16 * big) * (.96 + .06 * rake);
}
vec3 esGrass(vec2 p){
  float n = esN(p * 5.) * .55 + esN(p * 19.) * .45;
  return mix(uGrassA, uGrassB, n) * (.85 + .3 * esN(p * .8 + 9.));
}
float esFallenAt(vec2 p, float red){
  vec4 c = esCell(p / .17);
  float r = length(c.xy);
  // (where nothing lies, red is 0 and no cell may show: a cell's own number can be 0 too)
  return step(c.z, red * .9 - .003) * (1. - smoothstep(.28, .5, r)) * (.7 + .3 * esH(vec2(c.z * 31., 2.)));
}
vec3 esDriveAlbedo(vec2 p, float d, float hw, float red){
  float edge = hw + (esN(p * 1.3) - .5) * .5;
  vec3 a = mix(esGravel(p), esGrass(p), smoothstep(edge - .12, edge + .16, d));
  float near = 1. - smoothstep(25., 70., length(vec3(p.x, 0., p.y) - vec3(cameraPosition.x, 0., cameraPosition.z)));
  float f = mix(red * .45, esFallenAt(p, red), near);
  return mix(a, uFallen * (.75 + .5 * esH(floor(p / .17))), f);
}
`;
export const driveUniforms = () => ({
  uGravel: { value: new THREE.Vector3(...lin('#d9cdb4')) }, uGrassA: { value: new THREE.Vector3(...lin('#3d6a2c')) },
  uGrassB: { value: new THREE.Vector3(...lin('#6a9a3c')) }, uFallen: { value: new THREE.Vector3(...lin('#a0141e')) },
});

// ---------------------------------------------------------------- the hero alone: one straight 60 m length of the cut
export async function buildHero(ctx, opts = {}) {
  const seed = ctx.seed ?? 1, object = new THREE.Group(), LEN = opts.length || 60;
  const rL = makeRng(hashSeed('bank-left:' + seed)), rR = makeRng(hashSeed('bank-right:' + seed));
  const U = opts.uniforms || makeEstateUniforms({}), mats = makeBankMaterials(U, { heavy: !!opts.heavy });
  U.uCloud.value.z = 1;
  const line = []; for (let z = LEN / 2; z >= -LEN / 2; z -= 1) line.push([0, z]);
  const banks = [];
  for (const [side, rng, off] of [[1, rL, 0], [-1, rR, 500]]) {
    const bank = await buildBank({ line, side, rng, heavy: !!opts.heavy, uvOffset: off, foot: () => 11, thick: () => 12, chunk: 30 }, ctx.yield);
    const built = mats.assemble(bank); object.add(built.group); banks.push(built);
  }
  // the gravel, the verges and the spent flowers lying on them
  const gu = { ...U, ...driveUniforms() };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(64, LEN + 30, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: gu, fog: false,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: ESTATE_GLSL + BANK_GLSL + DRIVE_GLSL + /* glsl */`
      varying vec3 vW;
      void main(){
        float d = abs(vW.x), red = mix(.1, .7, smoothstep(2., 10.5, d)) * (1. - smoothstep(12., 15., d));
        vec3 c = esLight(esDriveAlbedo(vW.xz, d, 3.5, red), vec3(0., 1., 0.), vW, 1., 0.);
        gl_FragColor = vec4(esFog(c, vW), 1.);
      }`,
  }));
  ground.position.y = 0.02; object.add(ground);
  return {
    object, radius: 34, height: 16, center: new THREE.Vector3(0, 6, 0), ground: true, groundY: 0, banks, uniforms: U,
    update(dt, time) { U.uTime.value = time; },
  };
}

// ---------------------------------------------------------------- the stream's stones and the birds' standing courses (plain arithmetic)
// rows of stones lie across the stream every 22 to 28 m down the valley (the water breaks white on them): their metres
// down the valley's axis, from a stream of their own. Three of the rows carry a small fall (rows.falls, in their order
// down the valley): each is picked by a draw on the same stream from the rows between the first and the last
export function stoneRows(seed) {
  const rng = makeRng(hashSeed('stones:' + seed)), rows = [];
  for (let s = 20; s < 215; s += rng.range(22, 28)) rows.push(s);
  const inner = rows.slice(1, -1), falls = [];
  for (let k = 0; k < 3 && inner.length; k++) falls.push(inner.splice(Math.floor(rng() * inner.length), 1)[0]);
  rows.falls = falls.sort((a, b) => a - b);
  return rows;
}
// Every flock flies one closed loop for ever on the world's clock. Each loop is laid by the place it belongs to and
// keeps clear air from the route's line by place: the loop's own distance from the line, less the flock's spread and
// wander, stays over 2 m at every point of the loop, so it holds at every clock.
export function lifeCourses(Lo) {
  const P = PLACE, M = Lo.places, T = Lo.tables, out = [];
  const loop = (cx, cz, ax, az, ra, rb, yAt, n = 24) => {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, u = Math.cos(a) * ra, w = Math.sin(a) * rb, x = cx + ax * u - az * w, z = cz + az * u + ax * w; pts.push([x, yAt(x, z, a), z]); }
    return pts;
  };
  const over = (h, wave) => (x, z, a) => Lo.ground(x, z) + h + wave * Math.sin(a * 2 + 1);
  const dirAt = (m) => { const k = T.B + Math.round(m), dx = T.X[k + 2] - T.X[k], dz = T.Z[k + 2] - T.Z[k], l = Math.hypot(dx, dz) || 1; return [T.X[k], T.Z[k], dx / l, dz / l]; };
  // wood pigeons: an oval through the avenue at the wood's middle (half way between the end of the entry's straight and
  // the cut's east mouth), crossing over the drive 10 to 12.5 m up, under the boughs
  const w = dirAt((M.straight + M.east) / 2);
  out.push({ name: 'pigeons', pts: loop(w[0], w[1], w[2], w[3], 22, 34, over(11.2, 1.1)), spread: [4, 1.2, 7], wander: [1.2, 0.8, 1.2] });
  // rooks: over the cut's first leg (about the middle between its east mouth and its bend), 31 to 37 m up: they cross and
  // recross the strip of sky between the banks' crests, seen from the drive below; they keep to the cut
  const r = dirAt((M.east + M.bend) / 2);
  out.push({ name: 'rooks', pts: loop(r[0], r[1], r[2], r[3], 58, 40, over(34, 3)), spread: [10, 3, 14], wander: [3, 2, 3] });
  // swallows: low over the lawn before the house, a long narrow loop 14 m to the left of the line that runs along the
  // front, beside the front's western three quarters (clear of where the route comes onto that line)
  const hc = P.houseCentre, hf = P.houseFront, ha = P.houseAxis, sw = P.frontDistance + 14, st = P.houseLength / 8;
  out.push({ name: 'swallows', pts: loop(hc[0] + hf[0] * sw + ha[0] * st, hc[1] + hf[1] * sw + ha[1] * st, ha[0], ha[1], 0.35 * P.houseLength, 4, (x, z, a) => Lo.ground(x, z) + 4.4 + 1.2 * Math.sin(a * 3)), spread: [2.5, 1, 7], wander: [1.2, 0.7, 1.5] });
  // gulls: one loop out over the water beyond the ring, one round each headland
  const A = P.valleyAxis, end = P.valleyLength + P.beachDepth + P.ringBeyondTide;
  const g0 = Lo.fromValley(end + 78, 0), g1 = Lo.fromValley(end - 8, 78), g2 = Lo.fromValley(end - 8, -74);
  out.push({ name: 'gulls-sea', pts: loop(g0[0], g0[1], A[0], A[1], 44, 32, (x, z, a) => 19 + 5 * Math.sin(a * 2)), spread: [9, 3, 12], wander: [3, 2, 3] });
  out.push({ name: 'gulls-left', pts: loop(g1[0], g1[1], A[0], A[1], 30, 24, (x, z, a) => 31 + 4 * Math.sin(a * 2)), spread: [6, 2.5, 9], wander: [2.5, 1.5, 2.5] });
  out.push({ name: 'gulls-right', pts: loop(g2[0], g2[1], A[0], A[1], 28, 22, (x, z, a) => 27 + 4 * Math.sin(a * 2)), spread: [6, 2.5, 9], wander: [2.5, 1.5, 2.5] });
  // wagtails: low along the stream about the row of stones that lies nearest the valley's middle
  const rows = stoneRows(Lo.seed), mid = P.valleyLength / 2, ws = rows.reduce((b, s) => (Math.abs(s - mid) < Math.abs(b - mid) ? s : b), rows[0]), wq = Lo.fromValley(ws, Lo.streamAt(ws));
  out.push({ name: 'wagtails', pts: loop(wq[0], wq[1], A[0], A[1], 20, 1.1, over(1.2, 0.3), 16), spread: [0.6, 0.3, 3], wander: [0.4, 0.3, 0.4] });
  return out;
}
