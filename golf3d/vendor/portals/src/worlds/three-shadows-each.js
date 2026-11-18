// Three Shadows Each: a rose-tan salt flat set with slender natural stone needles under three suns of three colours
// that wander, cross, swell and shrink. Every needle throws three coloured shadows that turn like the hands of clocks
// that never agree; frost whitens the plain outward from cold hollows that lie all over it and smokes off along its
// edges when a sun comes near. A few true giants (250 to 400 m) stand far apart on the open salt; the flight is led
// round two of them, one on each hand; one has toppled against its neighbour and rests on it, and the flight passes
// under the leaning stone. The hero (src/parts/three-shadows-each.js) is the tallest of them, one rock among rocks;
// the ring stands by its foot over a brine pool.
//
// THE PLACE IS DEALT BY THE SEED (layPlan below): where the giants stand, which has toppled onto which, the pass
// under it, the two giants on the way, the tallest and the ring, the brine channel, the needles that stand alone,
// and so the line of the flight, its length (about 1,150 to 1,485 m) and how long it lasts (the length over 26 m a
// second: 44 to 57 s). Typed are only the entry's own things: the entry pool and the first grove.
//
// WHAT `time` IS (found in src/core/engine.js and src/main.js, written here as the task asks):
//   update(dt, time, camera, u): `time` is this world's own clock in seconds. The engine adds each update's dt to it
//   from the first time the world is drawn, which is while it is seen through the portal before it (then u is 0 and
//   the camera is the opening's). So a visitor crosses in with the clock anywhere from about 0 to 150 s and can leave
//   near 275 s; pace and hurry change the flight's speed and never this clock.
//
// THE THREE SUNS' LAW (the brief's one declared thing on the world's clock): makeSunLaw() below. Each sun's bearing,
// height and apparent size is a sum of slow sines of unlike periods (23 to 41 s, dealt by the seed) with seeded
// phases: a pure function of the clock, the same for every visitor of a seed, never a loop within the flight, nothing
// integrated, nothing started by the visitor. Shadows, light, sky, frost, the frost's front and its smoke are pure
// functions of that law's state and of place. SINCE ROUND SEVEN update() ALSO TAKES THE SHARE OF THE ROUTE FLOWN (u),
// for three things and no more, each a pure function of that share (THE ROW AND THE RISING, in build()): the row
// the three suns draw into over the last places of the route, the rising of the loose things (uRise), and the
// frost's leaving of the ground as they rise. Before the place where the line leaves the level top none of the
// three has begun, and nothing of the place reads the share flown.
//
// SHADOWS ARE PAINT ON THE GROUND: instanced strips, one for every needle and sun, laid in the vertex shader from the
// sun's direction. Each takes exactly its own sun's light off the ground under it (the buffer's alpha keeps, for one
// sun at a time, how much of that sun's light reaches a pixel, so two shadows of one sun never take its light twice):
// under one shadow the ground is lit by the other two suns and the sky, which is the shadow's true hue.
//
// This world sets neither portal.drawWithin nor portal.drawIn: the ring stands whole at every metre. Its reveal
// distance is the length of the last way down to the ring's pool (set where the world is returned).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed, makeNoise } from '../kit/core.js';
import { buildHero, makeNeedleGeometry, makeHeapGeometry, makeGiant, mergeGeoms, heapStones, keepStones, makePyramid, PYRAMID, PYRAMID_DRESS, makeBoulderGeometry, makeRising } from '../parts/three-shadows-each.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// ---------------------------------------------------------------- THE THREE SUNS' LAW
// Star kinds: an A star (blue-white, hot, high), a G star (white-yellow) and a K star (orange-red: small when far, the
// one that swells most when it comes near). col: the light's colour (linear); S: brightness of the face; r0..r1:
// apparent radius in degrees; g: how seldom it swells; disc: the face's
// radiance in the sky (its limb; the heart of the face is hotter and whiter).
const KINDS = [
  { col: [0.5, 0.74, 1.0], S: 1.0, r0: 1.7, r1: 3.5, g: 1.0, disc: [0.8, 1.5, 3.3] },
  { col: [1.0, 0.85, 0.48], S: 0.95, r0: 2.0, r1: 4.2, g: 1.2, disc: [3.1, 2.2, 0.7] },
  { col: [1.0, 0.33, 0.1], S: 1.3, r0: 1.7, r1: 6.4, g: 1.8, disc: [3.3, 0.7, 0.14] },
];
// A DECLARED CHOICE OF THE DESIGN (SUN_AXIS, bearing 0: due north): the suns of this place keep to its northern
// sky, and the flight heads north, into the light. So the three are in the sky ahead for most of every flight, seen
// to wander, cross, swell and shrink there, and the shadows of the stones ahead fall toward whoever flies. The
// middle of the three wanders about a bearing of its own that the seed deals within a quarter of a radian of that
// axis. SUN_FLOOR: the height in degrees that the floor below works toward for the highest of the three.
const SUN_FLOOR = 14, SUN_AXIS = 0;

// rs: a stream of its own (the seed deals every period and phase); shift: seconds added to the clock (the seed's own).
// Returns state(t, out): fills out.sun[i] = { az, el, rad (radians), dir [x,y,z], up, flux, near } and out.heat.
function makeSunLaw(rs, shift) {
  // THE THREE ARE NEVER IN ONE ROW AND NEVER OVER ONE ANOTHER. They are the three corners of a triangle that is never
  // flat and never regular (sides of about 16, 21 and 28 degrees of sky): each sun stands on its own ray from a common
  // middle, the rays of unlike lengths and unlike gaps, each swaying by 11 degrees and breathing by an eighth. The
  // middle wanders 17 degrees either way about its own bearing and about 14 degrees up; the triangle turns slowly to
  // and fro through more than a full quarter either way, so each sun in its turn climbs high, sinks to the horizon
  // (and under it for a while: two up and one down) and passes over or under a neighbour's bearing, and no two
  // shadows ever turn or stretch alike. The floor lifts all three alike by whatever the highest lacks to SUN_FLOOR
  // (14 degrees); it is a soft floor, so the highest can stand a little under that: at 13.3 degrees or more
  // (scratchpad/three-shadows-each/floor.mjs counts 13.47 at least over seeds 1 to 400 and clocks 0 to 300 s). (Counted over many seeds and clocks: scratchpad/three-shadows-each/law3.mjs.)
  // The 21 slow sines: one period drawn in each of 21 equal parts of 23 to 41 s (so no two are alike), dealt out by a
  // shuffle, each with a phase of its own.
  const NP = 21, per = []; for (let k = 0; k < NP; k++) per.push(23 + (k + rs.range(0.15, 0.85)) * 18 / NP);
  rs.shuffle(per);
  let q = 0; const sine = () => ({ w: TAU / per[q++], p: rs.range(0, TAU) });
  const suns = [0, 1, 2].map((i) => ({ s: [sine(), sine(), sine(), sine(), sine()], k: KINDS[i] }));
  const f = [sine(), sine(), sine(), sine(), sine(), sine()];
  // where the turning stands at the clock's zero, which sun has which corner, which way round the three stand, the middle's own bearing
  const th0 = rs.range(0, TAU), corner = rs.shuffle([0, 1, 2]), way = rs.chance(0.5) ? 1 : -1, az0 = SUN_AXIS + rs.range(-0.25, 0.25);
  // the triangle's three corners from its middle: how far (degrees) and at what bearing round it (radians)
  const RAY = [15.6, 10, 13.3], PHI = [-0.096, 1.876, 3.368];
  // (two slow sines of unlike periods as one wandering measure in -1..1)
  const two = (a, b, t) => 0.6 * Math.sin(a.w * t + a.p) + 0.4 * Math.sin(b.w * t + b.p);
  return function state(t0, out) {
    const t = t0 + shift; let sm = 0;
    const cAz = az0 + 0.3 * two(f[0], f[1], t), cEl = 14.5 + 2.5 * two(f[2], f[3], t), th = th0 + 2.2 * two(f[4], f[5], t);
    for (let i = 0; i < 3; i++) {
      const s = suns[i].s, k = suns[i].k, o = out.sun[i];
      const psi = th + way * PHI[corner[i]] + 0.19 * two(s[0], s[1], t);
      const ray = RAY[corner[i]] * (1 + 0.12 * Math.sin(s[2].w * t + s[2].p));
      o.elDeg = cEl + ray * Math.sin(psi);
      o.az = cAz + ray * Math.cos(psi) * DEG / Math.max(Math.cos(o.elDeg * DEG), 0.8);
      const sz = 0.5 + 0.5 * (0.68 * Math.sin(s[3].w * t + s[3].p) + 0.32 * Math.sin(s[4].w * t + s[4].p));
      o.near = Math.pow(clamp(sz, 0, 1), k.g);
      o.radDeg = k.r0 + (k.r1 - k.r0) * o.near;
      sm += Math.exp(0.3 * o.elDeg);
    }
    // the floor: whatever the highest sun lacks to SUN_FLOOR degrees is added to all three, smoothly
    const top = Math.log(sm) / 0.3, lift = Math.log(1 + Math.exp(0.45 * (SUN_FLOOR - top))) / 0.45;
    let heat = 0;
    for (let i = 0; i < 3; i++) {
      const o = out.sun[i], k = suns[i].k, el = (o.elDeg + lift) * DEG, ce = Math.cos(el);
      o.el = el; o.rad = o.radDeg * DEG;
      o.dir[0] = Math.sin(o.az) * ce; o.dir[1] = Math.sin(el); o.dir[2] = -Math.cos(o.az) * ce;
      o.up = smoothstep(-1.5 * DEG, 4.5 * DEG, el);
      o.flux = k.S * Math.pow(o.radDeg, 1.6) * o.up;
      heat += o.flux * Math.max(0, o.dir[1] + 0.12);
    }
    out.heat = heat;
    return out;
  };
}
// THE COLD: how cold the plain is, from the law's heat alone: it falls with the logarithm of the heat, with no flat
// ends (the two numbers are the middle and the spread of the heat's logarithm over many seeds and clocks:
// scratchpad/three-shadows-each/law3.mjs). Frost lies wherever a place's own measure (tseTheta in the ground's
// shader: cold hollows all over the plain, one to about every HOLLOW_CELL metres) is under it, so frost edges stand
// all over the plain at every clock and travel as the suns swell and shrink.
const coldOf = (heat) => (1.86 - Math.log(Math.max(heat, 0.5))) / 0.85, HOLLOW_CELL = 200;
// THE GROUND ANSWERS SLOWLY: its cold at a clock is the mean of the law's cold over the three seconds before it (seven
// states of the same law half a second apart), so the edges race and never jump. A pure function of the clock:
// nothing is kept from one update to the next.
const groundCold = (law, t, st) => { let s = 0; for (let k = 0; k < 7; k++) s += coldOf(law(t - 0.5 * k, st).heat); return s / 7; };
// WHAT THE PLAIN SHOWS OF IT: the cold set against the places' own measures. It is bent so that it never leaves the
// range the cold hollows span (frost always stands about every hollow, bare crust always lies between them).
const seenCold = (c) => 0.8 * Math.tanh(c / 0.7);
export { makeSunLaw, KINDS, coldOf, groundCold, seenCold, HOLLOW_CELL };
export const newSunState = () => ({ heat: 0, sun: [0, 1, 2].map(() => ({ az: 0, el: 0, elDeg: 0, rad: 0, radDeg: 0, near: 0, up: 0, flux: 0, dir: [0, 1, 0] })) });

// ---------------------------------------------------------------- GLSL shared by the dome, the ground and the strips
const CELL = '1.15';
// the white salt of a shore and the air's own blue over the haze: one number each for the shaders that paint them
// and for the light that the loose stone takes from them
const SALT_WHITE = [0.86, 0.84, 0.8], AIR_BLUE = [0.085, 0.3, 0.56];
// ROW_LIGHT: what the row's light adds on the pyramid's stair once the row stands, as a share of the three suns'
// light together (the stair is turned from the row, which stands beyond the pyramid, and has only the sky's and
// the salt's light: this about doubles it, so the stair stands lit and is never white).
const ROW_LIGHT = 0.8;
const SALT_GLSL = `vec3(${SALT_WHITE.join(', ')})`, BLUE_GLSL = `vec3(${AIR_BLUE.join(', ')})`;
const NOISE_GLSL = /* glsl */`
float tseHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float tseNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(tseHash(i), tseHash(i + vec2(1., 0.)), f.x), mix(tseHash(i + vec2(0., 1.)), tseHash(i + vec2(1., 1.)), f.x), f.y); }
float tseFbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * tseNoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= .5; } return s; }
`;
const SKY_GLSL = /* glsl */`
uniform vec3 uSunDir[3]; uniform vec3 uSunDisc[3]; uniform vec3 uSunGlow[3]; uniform float uSunRad[3];
uniform vec3 uSunE[3]; uniform vec3 uAmb; uniform vec3 uSkyTint; uniform vec3 uCloudCol; uniform vec4 uCirrus;
uniform float uTime; uniform float uFogK; uniform vec4 uFar; uniform vec2 uRowLit;
${NOISE_GLSL}
// the air: the sky's colour in a direction with each sun's glow; no cloud, no discs
vec3 tseAir(vec3 d){
  float h = clamp(d.y, 0., 1.);
  vec3 c = mix(vec3(0.6, 0.42, 0.31), ${BLUE_GLSL}, smoothstep(0., .16, h));
  c = mix(c, vec3(0.018, 0.12, 0.31), smoothstep(.08, .7, h)) * uSkyTint;
  for (int i = 0; i < 3; i++){
    float ang = sqrt(max(2. - 2. * dot(d, uSunDir[i]), 0.)), r = max(uSunRad[i], 1e-4);
    c += uSunGlow[i] * (.9 * exp(-ang / (2. * r)) + .25 * exp(-ang / (6. * r)) + .06 * exp(-ang / .6));
  }
  return c;
}
// WHAT BRINE GIVES BACK OF THE AIR: its blue and a pale cool horizon, a little of the sky's own tint; never the suns'
// warm glow, never the warm haze under the far ranges (no water of this place lies as a warm-tinted patch)
vec3 tseAirCool(vec3 d){ float h = clamp(d.y, 0., 1.);
  vec3 c = mix(vec3(.6, .68, .74), ${BLUE_GLSL}, smoothstep(0., .2, h));
  return mix(c, vec3(.018, .12, .31), smoothstep(.08, .7, h)) * mix(vec3(dot(uSkyTint, vec3(.3333))), uSkyTint, .4); }
vec3 tseCloud(vec3 c, vec3 d){
  float up = smoothstep(.03, .3, d.y);
  vec2 q = d.xz / (max(d.y, 0.) + .16);
  q = vec2(q.x * uCirrus.x + q.y * uCirrus.y, -q.x * uCirrus.y + q.y * uCirrus.x);
  float n = tseFbm(vec2(q.x * .55 + uTime * .006 + uCirrus.z, q.y * 3.4 + uCirrus.w));
  float m = tseNoise(q * .7 + 5.);
  return mix(c, uCloudCol, smoothstep(.46, .76, n) * smoothstep(.22, .7, m) * up * .7);
}
// THE FAR RANGES: three layers of mountains round the whole basin, painted on the sky (they are 7 to 9 km off and
// about half a kilometre high: nothing of the flight moves against them). Serrated crests; each layer high to one side and low to another, with a gap;
// each farther one paler in the haze, and the haze takes the colour of whichever sun stands over it. NO CREST STANDS
// HIGHER THAN 4.2 DEGREES over the level (the crests' height is bent over to that bound), so that the far giants,
// which stand nearer and are dealt taller than that from every place of the flight, always stand clear above them.
vec3 tseFar(vec3 c, vec3 d){
  float el = d.y / max(length(d.xz), 1e-4);
  if (el > .08) return c;
  float th = atan(d.x, -d.z); vec2 ring = vec2(cos(th), sin(th));
  vec3 hz = tseAir(normalize(vec3(d.x, .02, d.z))), sun = uAmb * 1.6;
  for (int i = 0; i < 3; i++) sun += uSunE[i] * (.3 + .7 * max(dot(normalize(vec3(-d.x, .5, -d.z)), uSunDir[i]), 0.));
  for (int k = 2; k >= 0; k--){
    float fk = float(k), ph = uFar.x + fk * 1.9;
    float gq = sin(.5 * (th - uFar.y - fk * .7)) / .16, env = (.3 + .7 * smoothstep(-.6, .75, sin(th + ph))) * (1. - .88 * exp(-gq * gq));
    vec2 q = ring * (4.2 + fk * 2.3) + uFar.zw + fk * 13.7;
    float n = tseFbm(q), nr = 1. - abs(2. * tseFbm(q * 2.6 + 5.) - 1.), h = .012 + .062 * (1. - exp(-(.118 - fk * .03) * env * (.2 + .78 * n + .6 * nr * nr) / .062));
    float m = 1. - smoothstep(h - .0012, h + .0012, el);
    if (m > .0){
      float rel = clamp(el / max(h, 1e-3), 0., 1.), gul = tseNoise(q * 5.5 + vec2(rel * 3.2, 0.));
      vec3 rock = vec3(.3, .23, .215) * sun * (.5 + .5 * rel + .4 * (gul - .5));
      vec3 lay = mix(rock, hz, .44 + fk * .19);
      c = mix(c, mix(hz, lay, smoothstep(.0, .016, el)), m);
    }
  }
  return c;
}
// the sky as seen: air, thin high cloud, the three discs (a white-hot heart, a coloured limb) and the far ranges
// THE AIR ABOUT THE ROW BRIGHTENS TO ONE HALO THAT JOINS THE THREE DISCS: light about the straight stretch of sky
// from the lowest disc to the highest, strongest on it (some three and a half degrees wide: a little wider than the
// largest disc) and thinning over some ten degrees; it gathers by the fourth power of the row's own measure
// (uRowLit.x), so only as the three come together; it adds the suns' own glow and takes nothing: the sky stays daylit.
vec3 tseHalo(vec3 d){
  vec3 ab = uSunDir[0] - uSunDir[2]; float t = clamp(dot(d - uSunDir[2], ab) / max(dot(ab, ab), 1e-6), 0., 1.), dh = length(d - uSunDir[2] - ab * t), k = uRowLit.x * uRowLit.x;
  return (uSunGlow[0] + uSunGlow[1] + uSunGlow[2]) * (k * k * (.55 * exp(-dh * dh / .0036) + .16 * exp(-dh * dh / .03)));
}
vec3 tseSky(vec3 d){
  vec3 c = tseCloud(tseAir(d), d) + tseHalo(d);
  for (int i = 0; i < 3; i++){
    float ang = sqrt(max(2. - 2. * dot(d, uSunDir[i]), 0.)), r = max(uSunRad[i], 1e-4);
    float x = clamp(ang / r, 0., 1.), mu = sqrt(max(1. - x * x, 0.));
    float edge = 1. - smoothstep(r - max(.0014, r * .05), r + .0008, ang);
    vec3 face = uSunDisc[i] * (.45 + .75 * mu) + vec3(max(uSunDisc[i].r, uSunDisc[i].b)) * mu * mu * mu * mu * .42;
    c = mix(c, face, edge);
  }
  return tseFar(c, d);
}
float tseFog(float d){ float x = d * uFogK; return 1. - exp(-x * x); }
`;

// THE COLD FIELD (shared by the ground, the strips and the vapour): a place's own measure; frost lies wherever the
// cold the ground has (uCold.x, from the law alone) is over it. The plain is set all over with COLD HOLLOWS, one to
// about every 200 by 300 m (the longer way along a bearing the seed deals, uCold.zw), each at a place of its own in
// its cell: the measure is lowest at a hollow's middle and rises away from it, so frost grows outward from every
// hollow as the cold rises and shrinks back to it when a sun comes near. The cold never reaches the bottom of a
// hollow nor the ground farthest from all of them, so on any seed and at any clock the plain is neither wholly
// white nor wholly bare, and frost edges with their vapour stand all over it. The edges are bent by the place's own
// noise, held back by the groves and the hollow about the giants (which frost first and thaw last), and fingered.
const THETA_GLSL = /* glsl */`
uniform sampler2D tField; uniform vec4 uField; uniform vec4 uCold; uniform vec3 uHollow;
// how far a place is from the nearest cold hollow, in cells
float tseHol(vec2 x){
  vec2 n = floor(x), f = fract(x); float d = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j)), o = vec2(tseHash(n + g + 7.7), tseHash(n + g + 43.3)) * .9 + .05; d = min(d, length(g + o - f));
  }
  return d;
}
float tseTheta(vec2 p, float grove){
  vec2 w = p + 140. * (vec2(tseNoise(p * .0037 + 3.), tseNoise(p * .0037 + 71.)) - .5) + 36. * (vec2(tseNoise(p * .019 + 9.), tseNoise(p * .019 + 27.)) - .5);
  vec2 q = vec2(dot(w, uCold.zw) / 1.5, dot(w, vec2(-uCold.w, uCold.z))) / max(uField.w, 1.), hq = (p - uHollow.xy) / max(uHollow.z, 1.);
  return -1.15 + 2.25 * smoothstep(0., .8, tseHol(q)) - .3 * grove - .25 * exp(-dot(hq, hq))
    + (tseNoise(p * .04) - .5) * .24 + (tseFbm(p * .085 + 5.) - .5) * .3 + (tseNoise(p * .7) - .5) * .1;
}
// how much vapour lies at a place whose measure is th: a little way in over the frost that is going (about 8 m),
// trailing over the crust it has just left (about 35 m); strongest while the plain thaws fast (uCold.y)
float tseBand(float th){ float bd = uCold.x - th, bx = bd / (bd > 0. ? .1 : .45); return exp(-bx * bx) * (.25 + .75 * uCold.y); }
`;
const GROUND_GLSL = THETA_GLSL + /* glsl */`
uniform vec3 uCrust; uniform vec3 uRim; uniform vec3 uSeam; uniform vec3 uBrine; uniform vec3 uFrostCol;
struct TseSurf { vec3 alb; vec3 n; float pool; float frost; float th; float deep; float mid; };
// BRINE LIES IN POOLS, NEVER IN PUDDLES: over .5 of the baked field is brine. The field carries the pools alone (the
// build takes out of it everything that is under 15 m across, gives every pool a middle of deep brine, and lets
// the salt of a shore reach 18 m from a pool and no farther). The shore is made ragged by reading the field a little aside (the place
// bent by up to 2 m, slowly), never by adding to it: a bent shore is still one shore, so no puddle can part from a
// pool and none can stand alone. (Before this a fine noise was added to the field: wherever the field lay near its
// threshold it cut wet patches of 2 to 7 m loose beside the pools and raised others on open ground, each with its
// own hard edge, its own pale salt and a sun's warm glow in it.)
vec2 tsePoolAt(vec2 p){ vec2 q = vec2(p.x * .81 - p.y * .59, p.x * .59 + p.y * .81);
  return p + (vec2(tseNoise(q * .07), tseNoise(q * .07 + 31.)) - .5) * 3.2 + (vec2(tseNoise(q * .19 + 7.), tseNoise(q * .19 + 53.)) - .5) * .8; }
// salt polygons: x = distance to the nearest seam (in cells), yz = the direction to that seam
vec3 tseCells(vec2 x){
  vec2 n = floor(x), f = fract(x), mg = vec2(0.), mr = vec2(0.); float md = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j)), o = vec2(tseHash(n + g), tseHash(n + g + 71.7)) * .96 + .02, r = g + o - f; float d = dot(r, r);
    if (d < md){ md = d; mr = r; mg = g; }
  }
  float e = 8.; vec2 en = vec2(0., 1.);
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++){
    vec2 g = mg + vec2(float(i), float(j)), o = vec2(tseHash(n + g), tseHash(n + g + 71.7)) * .96 + .02, r = g + o - f;
    vec2 dr = r - mr; float l2 = dot(dr, dr);
    if (l2 > 1e-5){ vec2 u = dr / sqrt(max(l2, 1e-5)); float d = dot(.5 * (mr + r), u); if (d < e){ e = d; en = u; } }
  }
  return vec3(e, en);
}
// the larger order of salt polygons: how far a place is from the border between its two nearest centres (in cells)
float tseSeam(vec2 x){
  vec2 n = floor(x), f = fract(x); float d1 = 8., d2 = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j)), o = vec2(tseHash(n + g + 19.3), tseHash(n + g + 53.1)) * .8 + .1, r = g + o - f; float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(max(d2, 0.)) - sqrt(max(d1, 0.));
}
// how much of a sun's light the rough crust takes at a slant: more than the cosine law for a low sun
float tseLit(vec3 n, vec3 d){ float c = max(dot(n, d), 0.); return 1.12 * c / (c + .12); }
// the ground at a place: its colour, its facing, how much of it is brine, how much frost. fw: a pixel in cells.
TseSurf tseSurfAt(vec2 p, float fw){
  TseSurf s; s.n = vec3(0., 1., 0.); s.frost = 0.;
  float big = tseFbm(p * .013 + 3.7), mid = tseNoise(p * .21);
  vec3 alb = uCrust * (.8 + .4 * big);
  alb = mix(alb, alb * vec3(1.1, .95, .84), smoothstep(.35, .7, tseNoise(p * .034 + 11.)));
  // THE CRUST IN TWO ORDERS, IN PATCHES: small polygons inside large ones with heavier raised seams; patches of
  // rough crust (strong ridges) and of smooth crust (faint ones); long low welts of salt that wander over it. NO
  // TILE: the ground both orders are laid on is pulled about by the place's own noise (at two scales each, by
  // about two fifths of its own measure), so the polygons are unlike in size and shape (the small ones from half a
  // metre to 2 m across, the large from 4 to 14 m: three to one and more), their borders bend, and no rows run
  // through them; every border is broken (it fades out along about a third of its length) and of a width that
  // changes along it. Each is kept as far as its own lines are wider than a pixel's footprint and then falls
  // to the floor's mean tone (as a filtered pattern does): the large order and the welts hold into the middle distance.
  float rough = smoothstep(.38, .62, tseNoise(p * .012 + 31.)), fw2 = fw * ${CELL} / 9., det2 = 1. - smoothstep(.1, .45, fw2), seam2 = 0.;
  if (det2 > .001){
    float e2 = tseSeam((p + 18. * vec2(tseNoise(p * .024 + 3.), tseNoise(p * .024 + 47.)) + 4. * vec2(tseNoise(p * .1 + 61.), tseNoise(p * .1 + 83.))) / 9.);
    seam2 = (1. - smoothstep(.02, .04 + .07 * tseNoise(p * .17 + 3.) + fw2, e2)) * det2 * (.3 + .7 * smoothstep(.3, .55, tseNoise(p * .11 + 77.)));
    alb = mix(alb, uRim * .98, seam2 * (.35 + .3 * rough));
  }
  { float wq = tseNoise(p * .028 + 13.), wl = smoothstep(.93, .99, 1. - abs(2. * wq - 1.)) * (1. - smoothstep(.6, 2.5, fw * ${CELL}));
    alb = mix(alb, uRim, wl * .45); }
  float det = 1. - smoothstep(.07, .3, fw), rdg = 0., r3 = 0., det3 = 0., grit = .5, gritD = 0.; vec3 tilt3 = vec3(0.);
  if (det > .001){
    vec2 wp = p + 4. * vec2(tseNoise(p * .11), tseNoise(p * .11 + 40.)) + .9 * vec2(tseNoise(p * .45 + 9.), tseNoise(p * .45 + 23.));
    vec3 c = tseCells(wp / ${CELL});
    // salt polygons 1 to 3 m across: a fine raised ridge of pale salt along every border, a hairline crack on its crest
    float e = c.x, brk = .25 + .75 * smoothstep(.3, .55, tseNoise(wp * .37 + 5.));
    float ridge = (1. - smoothstep(.015, .03 + .055 * tseNoise(wp * .53 + 9.) + fw * .9, e)) * (.1 / (.1 + fw)) * brk, crack = (1. - smoothstep(.0, .011 + fw * .6, e)) * (.012 / (.012 + fw)) * brk;
    ridge *= .35 + .75 * rough; crack *= .3 + .8 * rough; rdg = ridge * det;
    vec3 a2 = mix(alb * (.88 + .24 * mid) * (.92 + .16 * tseNoise(p * 3.1)), uRim, ridge * .8); a2 = mix(a2, uSeam, crack * .15);
    alb = mix(alb, a2, det);
    float sl = smoothstep(.006, .03, e) * (1. - smoothstep(.04, .1, e));
    s.n = normalize(vec3(-c.y * sl * .32 * det * (.4 + .8 * rough), 1., -c.z * sl * .32 * det * (.4 + .8 * rough)));
  }
  // NEAR THE EYE THE GROUND SHOWS ITS FINER MEASURE: inside every polygon small plates a hand or two across with
  // thin raised edges of pale salt (their ground pulled about like the larger orders', so no rows run through
  // them), and grit at two finer measures laid across one another. Each is kept only while it is wider than what
  // one dot of the screen covers there, like every order of the crust. THE HOAR SHOWS IT TOO (below): frost lies
  // thinner on every raised edge, of the polygons and of the small plates, takes the grit's grain, and keeps the
  // plates' own slopes, so frosted ground near the eye is no smooth white.
  { float fwm = fw * ${CELL}; det3 = 1. - smoothstep(.03, .09, fwm); gritD = 1. - smoothstep(.012, .035, fwm);
    if (det3 > .001){
      vec2 gp = p + .3 * vec2(tseNoise(p * 1.3 + 3.), tseNoise(p * 1.3 + 57.)) + .07 * vec2(tseNoise(p * 5.1 + 21.), tseNoise(p * 5.1 + 33.)), gr = vec2(gp.x * .8 - gp.y * .6, gp.x * .6 + gp.y * .8);
      vec3 c3 = tseCells(gp * 4.6); float f3 = fwm * 4.6, brk3 = .2 + .8 * smoothstep(.3, .6, tseNoise(gp * 2.3 + 15.));
      r3 = (1. - smoothstep(.03, .08 + .1 * tseNoise(gp * 3.7 + 9.) + f3, c3.x)) * (.12 / (.12 + f3)) * brk3 * (.45 + .55 * rough) * det3;
      grit = tseNoise(gp * 17.) * .55 + tseNoise(gr * 41.) * .45;
      alb = mix(alb * mix(1., .86 + .28 * grit, gritD), uRim, r3 * .55);
      tilt3 = vec3(-c3.y, 0., -c3.z) * (smoothstep(.01, .06, c3.x) * (1. - smoothstep(.08, .2, c3.x)) * .2 * det3 * brk3);
    } }
  vec2 fuv = (p - uField.xy) / (2. * uField.z) + .5; float fo = 3.4 / (2. * uField.z);
  vec4 fld = texture2D(tField, fuv);
  vec2 puv = (tsePoolAt(p) - uField.xy) / (2. * uField.z) + .5;
  float tA = texture2D(tField, puv + vec2(fo, fo)).r, tB = texture2D(tField, puv + vec2(-fo, fo)).r, tC = texture2D(tField, puv + vec2(fo, -fo)).r, tD = texture2D(tField, puv - vec2(fo, fo)).r;
  fld.r = .25 * (tA + tB + tC + tD);
  // (the way to the brine on the ground: up the field, from the same four readings)
  vec2 pg = vec2(tA + tC - tB - tD, tA + tB - tC - tD); pg /= max(length(pg), 1e-4);
  float pf = fld.r, pm = smoothstep(.492, .508, pf);
  // FROST lies plainly white wherever the cold holds; its edge is feathered and fingered by the fine noise of the
  // place's measure. The hoar is thin where it is young or going (for about forty metres behind its edge the
  // crust's colour shows through it) and deep behind that; the raised seams of the large polygons stand a little out of it.
  s.th = tseTheta(p, fld.g);
  float fin = uCold.x - s.th;
  s.frost = smoothstep(-.04, .04, fin) * (1. - pm);
  float hoar = (1. - .5 * rdg) * (1. - .4 * r3) * mix(1., .84 + .32 * (tseNoise(p * 2.7 + 5.) * .5 + tseNoise(vec2(p.x * .8 - p.y * .6, p.x * .6 + p.y * .8) * 6.3) * .5), det);
  alb = mix(alb, uFrostCol * (.9 + .1 * tseNoise(p * 1.9)) * mix(1., .9 + .2 * grit, gritD) * mix(vec3(.86, .93, 1.), vec3(1.), hoar) * hoar, s.frost * (.5 + .22 * smoothstep(0., .5, fin) + .14 * smoothstep(.3, .7, tseNoise(p * .23 + 3.))) * (1. - .4 * seam2) * (1. - .5 * rdg) * (1. - .45 * r3));
  s.n = normalize(mix(s.n, vec3(0., 1., 0.), s.frost * .6) + tilt3);
  // THE SHORE MELTS INTO THE CRUST AND FALLS TO THE WATER: a pale bloom of salt that begins raggedly 8 to 18 m out
  // and thickens toward the water; A CRUST OF WHITE SALT from about 6 m out; then A DARK BAND OF DAMP SALT over the
  // last metre and a half, where the brine has wetted the crust (the same salt, darker by half and cooler).
  // A POOL LIES IN A HOLLOW: over those last metres the ground falls to the water (its facing leans toward the
  // brine by up to three tenths), so every sun lights the bank that faces it and leaves the other in half shade.
  // THE BRINE IS PALE IN ITS SHALLOWS AND DARK IN ITS MIDDLE: for the first 6 m from the shore its bed shows
  // through it, white salt under a hand of brine (a pale blue-green: never the dry crust's grey or tan), deepening
  // to dark brine (s.deep: how far the brine has deepened; s.mid: how far it lies toward a pool's middle, from 3 m
  // to 12 m from the shore). No brine has a colour of its own that is not blue, slate or the sky over it.
  float salt = smoothstep(.2 + .16 * tseNoise(p * .045 + 17.), .49, pf) * (1. - pm), crustW = smoothstep(.40, .45 + .012 * tseNoise(p * .8), pf) * (1. - pm);
  float damp = smoothstep(.462 + .01 * tseNoise(p * .5 + 9.), .49, pf) * (1. - pm);
  alb = mix(alb, ${SALT_GLSL}, salt * .5); alb = mix(alb, ${SALT_GLSL}, crustW * .85);
  alb = mix(alb, alb * vec3(.44, .48, .54), damp * .9);
  s.n = normalize(s.n + vec3(pg.x, 0., pg.y) * (smoothstep(.40, .475, pf) * (1. - pm) * .3));
  s.deep = smoothstep(.5, .6, pf); s.mid = smoothstep(.55, .7, pf);
  s.alb = mix(alb, mix(${SALT_GLSL} * vec3(.36, .68, .84), uBrine, s.deep), pm); s.n = normalize(mix(s.n, vec3(0., 1., 0.), pm)); s.pool = pm;
  return s;
}
// how much of what is seen at a place of brine is the sky's mirror (the rest is its bed in the suns' light): three
// fifths seen from straight above, all of it at a slant; only the pale shallows show their bed
float tseFres(vec3 V, TseSurf s){ return mix(.62, 1., pow(1. - clamp(V.y, 0., 1.), 3.2)) * (.3 + .7 * s.deep) * s.pool; }
// how much of what is seen at a place is the vapour that lies on it (the frost's edge smoking off, in drifting wisps)
float tseVeil(vec2 p, TseSurf s){
  float puff = tseNoise(p * .045 + vec2(uTime * .09, -uTime * .06)) * .6 + tseNoise(p * .12 - vec2(uTime * .16, uTime * .11)) * .4;
  return clamp(tseBand(s.th) * (1. - s.pool) * (.35 + .65 * smoothstep(.3, .7, puff)) * 1.1, 0., .7);
}
`;

const DOME_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const DOME_FRAG = SKY_GLSL + /* glsl */`
varying vec3 vD;
void main(){ vec3 d = vD / max(length(vD), 1e-4); gl_FragColor = vec4(d.y < 0. ? tseAir(normalize(vec3(d.x, .02, d.z))) : tseSky(d), 1.); }`;

const GROUND_VERT = /* glsl */`
invariant gl_Position;
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GROUND_FRAG = SKY_GLSL + GROUND_GLSL + /* glsl */`
uniform vec4 uMir[48]; uniform vec4 uWave[6]; uniform vec4 uRuf; uniform vec4 uPyrAt; uniform vec3 uPyrIs; uniform vec3 uSalt; uniform vec3 uSkyFill;
varying vec3 vW;
void main(){
  vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 V = toEye / max(dist, 1e-3);
  vec2 p = vW.xz; float fw = max(fwidth(p.x), fwidth(p.y)) / ${CELL};
  TseSurf s = tseSurfAt(p, fw);
  vec3 col = s.alb * uAmb;
  for (int i = 0; i < 3; i++) col += s.alb * uSunE[i] * tseLit(s.n, uSunDir[i]);
  if (s.pool > .001){
    // brine mirrors the air and the three discs along the mirrored line, and IT IS WATER: FINE RIPPLES TRAVEL OVER IT
    // WITH THE CLOCK, AND THEY MAKE NO GRID. Six trains of ripples (uWave) all run one way, within an eighth of a
    // radian of the place's wind, so no two of them cross at any angle near a right one; their lengths are unlike
    // (a quarter of a metre to 3.4 m), each has its own seeded phase and its own steady rate, and their crests are
    // bent by the place's noise. EVERY TRAIN IS BROKEN INTO RUFFLES OF ITS OWN SIZE: it runs only in patches some
    // three of its lengths long and half as wide, which travel with it at half its speed, so near the eye the
    // brine shows short broken ruffles of unlike sizes and never one even weave. Each train is told as far as its
    // length is some ten times a pixel's footprint and is gone at two and a half times (as a filtered pattern
    // goes). The wind does not lie evenly on a pool: slow patches of ruffled brine drift over it (ruf: they lie where
    // two dice of the ripples' own stream put them and drift along the place's wind, the larger at 1.4 m a second
    // and the smaller at 0.8), where the
    // ripples stand higher and, too far off to be told one by one, give back the air from a little higher up, so
    // the far brine carries drifting streaks of deeper blue on its pale mirror. Everything here is a sine or a
    // noise of the clock at a steady rate: bounded, and nothing of it grows with the clock. (No noise of the
    // ground's own lattice tilts the brine: every noise here is read on ground turned off the lattice's lines.)
    float rip = 1. - smoothstep(.15, 1.2, fw), fwm = fw * ${CELL};
    vec2 pr = vec2(p.x * .81 - p.y * .59, p.x * .59 + p.y * .81);
    vec2 rw = vec2(uRuf.x * .81 - uRuf.y * .59, uRuf.x * .59 + uRuf.y * .81);
    float ruf = smoothstep(.3, .72, tseNoise(pr * .043 + uRuf.zw - rw * (uTime * .06)) * .65 + tseNoise(pr * .13 + uRuf.wz - rw * (uTime * .108)) * .35);
    vec2 rn = vec2(0.);
    float bend = (tseNoise(pr * .09 + 3.) - .5) * 6., told = 0.;
    for (int i = 0; i < 6; i++){
      vec4 wv6 = uWave[i]; float k = length(wv6.xy), see = 1. - smoothstep(.1, .4, fwm * k / 6.2832); vec2 wd = wv6.xy / k;
      vec2 wq = vec2(dot(p, wd) * k * .053 - uTime * wv6.w * .0265, dot(p, vec2(-wd.y, wd.x)) * k * .106) + float(i) * 17.3;
      rn += wd * cos(dot(p, wv6.xy) + bend * (1. + .4 * float(i)) - uTime * wv6.w + wv6.z) * see * smoothstep(.3, .7, tseNoise(wq)) * (.018 + .04 * ruf); told += see / 6.;
    }
    vec3 nr = normalize(vec3(rn.x, 1., rn.y));
    vec3 R = reflect(-V, nr); R.y = abs(R.y) + .003 + .035 * ruf * (1. - told); R = normalize(R);
    // BRINE IS A MIRROR AT EVERY ANGLE (dense and calm): seen from straight above it gives back three fifths of the air all the same; only its shallows show their bed
    float fres = tseFres(V, s);
    // THE NEEDLES MIRRORED: the tallest needles of the pools' shores (uMir: x, z, half width, height) stand upside down in
    // the brine along the same mirrored line, as upright stones that taper, swell and bow as the needles do, soft at the
    // edge and fainter the higher up the stone (so the images soften away from the far shore); the ripples bend them sideways
    vec3 sky = tseAirCool(R); float rl = max(length(R.xz), 1e-4), slope = R.y / rl, hit = 0.; vec2 rd = R.xz / rl;
    float wv = (tseNoise(vec2(dot(p, vec2(-rd.y, rd.x)) * .21, dot(p, rd) * .8 + uTime * .4)) - .5) * (1. - smoothstep(.25, 1.4, fw));
    // THE BRINE IS A MIRROR, NOT A STAIN. EACH SUN'S OWN DISC stands in it where the mirrored line meets that sun
    // (a little dimmer than the sun; the ripples break it near the eye and leave it whole far off), and the halo
    // that joins the three when the row stands; what stands on the shore is drawn over them.
    sky += tseHalo(R) * .8;
    for (int i = 0; i < 3; i++){
      float ang = sqrt(max(2. - 2. * dot(R, uSunDir[i]), 0.)), r = max(uSunRad[i], 1e-4);
      sky = mix(sky, uSunDisc[i] * .85, (1. - smoothstep(r * .85, r * 1.15 + .004, ang)) * smoothstep(-.02, .03, uSunDir[i].y));
    }
    // THE PYRAMID MIRRORED WITH ITS OWN LIT COLOURS AND PARTS: along the mirrored line the brine gives back the
    // pyramid's outline (its base as broad as it is seen from that side, narrowing evenly to the house on its
    // top) and the risers of the side that looks back along that line (from under the brine's level only the
    // faces that stand are seen), IN THE STONE'S OWN LAW OF LIGHT: each sun by how far the riser is turned to
    // it (the stone's own wrap), half the sky's lamp and half the air's blue from above, and from below half
    // of what the white salt gives off under the light that falls on level ground; every tier with its lit
    // edge, the shade under that edge and its darkening to the foot (the dress's own shares), and on the
    // side toward the ring the paler stair with its steps (the joints, streaks and mottle of single stones
    // are not carried); a quarter of that light is lost in the mirror and the brine's own colour fills a
    // share of it back, so the whole stands no more than about a fifth dimmer than the thing; the ripples
    // bend its edge.
    { vec2 dp = uPyrAt.xy - p; float t = dot(dp, rd), y = t * slope;
      if (t > 0. && y < uPyrIs.y){
        float ca = dot(rd, uPyrAt.zw), sa = rd.x * uPyrAt.w - rd.y * uPyrAt.z;
        float q = y / uPyrIs.y, r = mix(uPyrIs.x, uPyrIs.z, q) * (abs(ca) + abs(sa));
        float ls = dp.x * rd.y - dp.y * rd.x + wv * t * .03, lat = abs(ls);
        vec2 fh = abs(ca) >= abs(sa) ? -sign(ca) * uPyrAt.zw : sign(sa) * vec2(-uPyrAt.w, uPyrAt.z);
        vec3 fn = vec3(fh.x, 0., fh.y), gnd = uAmb, lit = vec3(0.);
        for (int i = 0; i < 3; i++){ float c = max(uSunDir[i].y, 0.); gnd += uSunE[i] * 1.12 * c / (c + .12); lit += uSunE[i] * max((dot(fn, uSunDir[i]) + .42) / 1.42, 0.); }
        lit += .5 * (uAmb + vec3(.1, .13, .17) + uSkyFill + vec3(.86, .84, .8) * gnd);
        float hh = 1. - fract(y / 16.5), lip = 1. - smoothstep(.06, .1, hh), stair = (abs(ca) >= abs(sa) && ca > 0. ? 1. : 0.) * (1. - smoothstep(26., 32., lat));
        vec3 pc = vec3(.64, .47, .37) * lit * mix(1., .58, smoothstep(.7, 1., hh)) * (1. + .16 * lip) * (1. - .3 * (1. - lip) * (1. - smoothstep(.12, .3, hh))) * (1. - .1 * smoothstep(.8, 1., fract(y / 4.125)));
        pc = mix(pc, pc * vec3(1.14, 1.12, 1.08) * (.92 + .14 * step(.5, fract(y / 4.125))), stair);
        // (the row's light on the stair stands in the brine as it stands on the stone: above the light's front only)
        float qy = ${(PYRAMID.tier * PYRAMID.tiers + 8).toFixed(1)} * (1. - uRowLit.y) - 8.;
        pc += vec3(.64, .47, .37) * (uSunE[0] + uSunE[1] + uSunE[2]) * (${ROW_LIGHT.toFixed(2)} * uRowLit.x * smoothstep(qy - 8., qy + 8., y) * stair);
        sky = mix(sky, pc * .74, (1. - smoothstep(r - 2., r + 3. + t * .01, lat)) * (1. - smoothstep(.96, 1., q)));
      } }
    for (int i = 0; i < 48; i++){
      vec4 m = uMir[i]; vec2 dp = m.xy - p; float t = dot(dp, rd), y = t * slope;
      if (t > 0. && y < m.w){
        float mz = max(m.z, .1), q = y / max(m.w, 1e-3), r = mz * (.22 + .78 * pow(max(1. - q, 0.), .75)) * (1. + .22 * sin(y * 4.4 / mz + m.x * .37) + .12 * sin(y * 9.7 / mz + m.y * .53)) + .1;
        float lat = dp.x * rd.y - dp.y * rd.x + mz * .5 * sin(q * 5. + m.x) * q + wv * t * .03;
        hit = max(hit, (1. - smoothstep(r * .5, r * 1.25 + t * .012, abs(lat))) * (1. - smoothstep(.2, .85, q)));
      }
    }
    // A POOL FAR OFF IS NO FLAT PATCH: where the mirrored line, followed 40, 110 and 240 m out over the ground,
    // comes among standing needles (the field's own count of how thick they stand), the brine gives back their
    // dark heads as a broken row, each as tall as the line's slope lets it show; so a far pool carries the dark
    // stones of its far shore under the pale air of the horizon. A HEAD IS A PLACE OF THE SHORE: how tall it stands
    // is read at the shore's own place on the ground (ps), in the world's metres, on ground turned off the lattice's
    // lines like every noise here, in cells 4 m wide (about a needle's width), and never along the eye's own line:
    // so a head belongs to a spot of the far shore, stands as tall whoever looks and passes with the shore. (Where
    // such a cell is narrower than a dot of the screen its height cannot be drawn and is left at the mean of all.)
    for (int j = 0; j < 3; j++){
      float t = j == 0 ? 40. : j == 1 ? 110. : 240.; vec2 ps = p + rd * t;
      float dn = texture2D(tField, (ps - uField.xy) / (2. * uField.z) + .5).g;
      vec2 qs = vec2(ps.x * .81 - ps.y * .59, ps.x * .59 + ps.y * .81) * .25; float fs = max(fwidth(qs.x), fwidth(qs.y));
      float hn = (8. + 34. * mix(tseNoise(qs), .5, smoothstep(.5, 1.5, fs))) * smoothstep(.08, .5, dn);
      hit = max(hit, (1. - smoothstep(hn * .6, hn + .01, t * slope)) * .8);
    }
    sky = mix(sky, mix(vec3(.27, .245, .23) * (uAmb * 2.2 + (uSunE[0] + uSunE[1] + uSunE[2]) * .22), sky, .35), hit * .85);
    // THE SUNS ON THE BRINE: each a smooth path of PALE light (its own colour drawn seven tenths of the way to
    // white: at no strength can a sun's light on water lie between the brine's blue and white as a warm tint). The
    // ripples' slopes are spread like a bell, so a sun's image is soft at its edge and drawn out toward the eye where
    // the brine is seen at a slant. There is no wider glitter round it: a pool beside a sun's path is not washed in that sun's colour.
    for (int i = 0; i < 3; i++){
      vec3 hv = V + uSunDir[i]; hv /= max(length(hv), 1e-4); vec2 sl2 = hv.xz / max(hv.y, 1e-3);
      float r = max(uSunRad[i], 1e-4), s2 = .0022 + r * r * .25;
      float up = smoothstep(-.02, .03, uSunDir[i].y), sq = dot(sl2, sl2);
      sky += mix(uSunDisc[i], vec3(dot(uSunDisc[i], vec3(.3, .5, .2))), .7) * exp(-sq / (2. * s2)) * min(1., .55 * r * r / s2) * up;
    }
    // (the ring is not mirrored: the brine could give back only an empty hoop, never what the ring shows)
    // THE DEEP MIDDLE OF A POOL IS DARKER: toward its middle the brine gives back a third less of the air, as slate
    // (seen at a low angle the middle is a whole mirror too: the darkening holds only where the eye looks down into it)
    col = mix(col, sky * mix(vec3(1.), vec3(.6, .66, .74), s.mid * smoothstep(.08, .45, V.y)), fres);
  }
  // THE FRONT'S SMOKE: the frost smokes off. Along its edge a low white vapour lies on the ground in drifting wisps
  // (and stands a little off it as low puffs, drawn by their own mesh):
  // a little way in over the frost that is going (about 20 m) and trailing over the crust it has just left (about
  // 70 m), strongest while the plain thaws fast, a thin mist at the edge while it holds or freezes
  vec3 vapL = uAmb * 2.4 + (uSunE[0] + uSunE[1] + uSunE[2]) * .5;
  col = mix(col, vapL, tseVeil(p, s));
  vec3 hz = tseAir(normalize(vec3(-V.x, .02, -V.z)));
  gl_FragColor = vec4(mix(col, hz, tseFog(dist)), 1.);
}`;

// A shadow strip: laid on the ground from a needle's foot away from one sun, as long as the needle's height over the
// tangent of that sun's height (at most 8 heights), with the needle's own taper and a half shadow as wide as the
// sun's disc makes it. It writes how much of that sun's light it takes (rgb) and how much it covers (alpha).
const STRIP_VERT = /* glsl */`
attribute vec4 aFoot; attribute vec4 aTip;
uniform vec3 uDir; uniform float uTanR;
varying vec3 vW; varying vec4 vS; varying vec2 vT; varying float vLh;
void main(){
  float sy = max(uDir.y, 1e-3), cot = min(sqrt(max(1. - sy * sy, 0.)) / sy, 8.);
  float hl = max(length(uDir.xz), 1e-4); vec2 away = -uDir.xz / hl;
  vec2 ax = aTip.xy + away * (aFoot.w * cot);
  float L = max(length(ax), 1e-3); vec2 ad = ax / L, pd = vec2(-ad.y, ad.x);
  float pen = uTanR * aFoot.w / sy, hw = max(aFoot.z * .62, .85) + pen + .06;
  float along = position.y * 1.1 - .04;
  vec2 g = aFoot.xy + ad * (along * L) + pd * (position.x * 2. * hw);
  vW = vec3(g.x, 0., g.y); vS = vec4(position.x * 2. * hw, along, aFoot.z * .5, pen); vT = aTip.zw; vLh = L / max(aFoot.w, 1e-3);
  gl_Position = projectionMatrix * viewMatrix * vec4(g.x, 0., g.y, 1.);
}`;
const STRIP_FRAG = SKY_GLSL + GROUND_GLSL + /* glsl */`
uniform vec3 uDir; uniform vec3 uE; uniform float uCapFade; uniform float uShade; uniform float uMode;
varying vec3 vW; varying vec4 vS; varying vec2 vT; varying float vLh;
void main(){
  float dist = length(cameraPosition - vW);
  vec2 p = vW.xz; float fw = max(fwidth(p.x), fwidth(p.y)) / ${CELL}, fa = fwidth(vS.x);
  TseSurf s = tseSurfAt(p, fw);
  float a = vS.x, v = clamp(vS.y, 0., 1.), tr = vT.y < 0. ? -vT.y : clamp(vT.y, .3, .5);
  float hwN = max(vS.z * 1.2, .8) * (tr + (1. - tr) * pow(max(1. - v, 0.), clamp(vT.x, .3, 2.)));
  float f = max(vS.w, 0.) * v + fa * .7 + .03;
  float cov = clamp((min(a + f, hwN) - max(a - f, -hwN)) / (2. * f), 0., 1.);
  cov *= smoothstep(-.04, .0, vS.y) * (1. - smoothstep(.86, 1.06, vS.y)) * (1. - uCapFade * smoothstep(.5, 1., v));
  // WHAT THE STRIP TAKES IS EXACTLY WHAT THE GROUND HAS OF ITS SUN at that place, term for term as the ground's
  // shader lays it (so no colour can be taken under nought): the sun's light on the crust, less the share of the
  // place that is the brine's mirror and the share that is vapour; and of the vapour, the half of the sun's light it carries
  float veil = tseVeil(p, s);
  vec3 mine = uE * tseLit(s.n, uDir), c = s.alb * mine * (1. - tseFres((cameraPosition - vW) / max(dist, 1e-3), s)) * (1. - veil) + uE * .5 * veil;
  // RIME KEPT BY THE SHADE (the second pass of the strips, uMode 1): inside a shadow that truly shades, within about
  // one and a half heights of the stone that throws it, a fine even rime comes sooner and stays longer, feathered
  // at its edge; it is lit by the other two suns and the sky. The buffer's alpha keeps it from being laid twice.
  vec3 rest = uAmb;
  for (int i = 0; i < 3; i++) rest += uSunE[i] * tseLit(s.n, uSunDir[i]);
  float share = dot(mine, vec3(.333)) / max(dot(rest, vec3(.333)), 1e-3);
  rest = max(rest - mine, vec3(0.));
  float core = smoothstep(-.05, .05, uCold.x + uShade - s.th) * (1. - s.frost) * (1. - s.pool) * (1. - smoothstep(.2, 1., abs(a) / max(hwN, .05)))
    * (1. - smoothstep(.4, .9, v)) * (1. - smoothstep(.45, 1.5, v * vLh)) * smoothstep(.1, .3, share) * cov * .62;
  // the rime is never brighter than the lit ground beside it: shade is darker than light everywhere
  float la = dot(s.alb, vec3(.333)), lf = dot(uFrostCol * .95, vec3(.333));
  core = min(core, cov * clamp((.88 / max(1. - share, .05) - 1.) * la / max(lf - la, 1e-3), 0., 1.));
  vec4 shadow = vec4(c * cov * (1. - tseFog(dist)), cov);
  vec4 frost = vec4((uFrostCol * .95 - s.alb) * rest * core * (1. - tseFog(dist)), core);
  gl_FragColor = mix(shadow, frost, uMode);
}`;
const RESET_FRAG = /* glsl */`uniform float uA; void main(){ gl_FragColor = vec4(0., 0., 0., uA); }`;

// THE RISING OF LOOSE STONE (the heaps at the needles' feet, the giants' rubble, the loose stones of the last plain;
// NOT THE PYRAMID'S BLOCKS: the pyramid stays whole, every block of it is given the dice of a thing that stays, and
// what this law says of a great block below moves nothing now). Every loose thing carries four dice of its own (aRise: the share of the rising's
// measure at which it leaves the ground; its top height in metres, which the earliest reach at the ring; how fast it turns
// as it climbs, in radians a metre; a level bearing), and every stone of it its own middle and one die more
// (aStone): the stones of one heap leave one after another (each up to a fifth of the heap's remaining measure
// later), climb to unlike heights (the least to half the heap's) and turn each about its own middle, so a heap
// comes apart as it rises and never climbs as one clump. A stone's height is how far the measure has passed its own
// start, to the power 1.7, times its own top height: it lets go slowly and then gathers (the earliest climb at
// about 35 m a second by the ring), and a stone that leaves late is still low when the measure is whole, so there
// are stones at every height all the way. It turns as it climbs and drifts a twentieth of its climb along its own
// bearing.
// WHAT THE CLOCK GIVES A RISEN STONE IS BOUNDED, AND NOTHING OF IT GROWS WITH THE CLOCK: no term multiplies the
// running clock by a measure of place. Every steady turn comes from the metres climbed alone. The clock gives two
// things and no more, each a sine of the clock at the stone's own rate with its own seeded phase: a ride up and
// down of 0.8 m at most, brought in over the first 3 m off the ground, and a sway about the stone's own axis that
// is a share of that stone's own lean (RISE_SWAY of it, a third, to either hand; to and fro once in 10 to 44 s
// for a stone, in 52 to 157 s for a great block), as a thing that hangs in the air does: THE SWAY NEVER TAKES THE
// LEAN AWAY (the stone leans between two thirds and four thirds of its own lean), and it comes in over the same
// metres as the lean itself. So the risen stones are never still, even to an eye that is held
// in one place, and a stone at a place looks the same whenever the visitor came in, but for that ride and that sway.
// A GREAT BLOCK OF THE PYRAMID TAKES NO TURN AT ALL, by the climb or by the clock, UNTIL IT STANDS CLEAR OF ITS BED
// BY HALF ITS OWN WIDTH (uClear, read from the block's own shape: 7.5 m; nought for every other loose thing): its
// turn and its sway count from there. A pure function of the rising's measure (uRise), the clock and those dice,
// with nothing kept from one moment to the next: at nought every stone lies exactly where it was laid.
// NO RISEN STONE HANGS DEAD LEVEL: AS IT LEAVES ITS BED A LOOSE STONE TAKES A LEAN OF ITS OWN, about that same axis
// and the way it will go on turning: RISE_LEAN radians (20 to 52 degrees, by its own die), brought in over its
// first metre off the ground by the metres climbed and by nothing else (no clock is in it, so two visitors see the
// same lean). A great block leans by half as much and over its own half width once it stands clear. The same
// measure of that first metre (vTseOpen) opens the stone's underside to the light of the plain below it.
const RISE_SWAY = 1 / 3, RISE_LEAN = [0.35, 0.9];
const RISE_HEAD = /* glsl */`
attribute vec4 aRise; attribute vec4 aStone; uniform float uRise; uniform float uTime; uniform float uClear; varying float vTseOpen;
mat3 tseTurn(vec3 k, float a){ float c = cos(a), s = sin(a), t = 1. - c;
  return mat3(t * k.x * k.x + c, t * k.x * k.y + s * k.z, t * k.x * k.z - s * k.y, t * k.x * k.y - s * k.z, t * k.y * k.y + c, t * k.y * k.z + s * k.x, t * k.x * k.z + s * k.y, t * k.y * k.z - s * k.x, t * k.z * k.z + c); }`;
const RISE_TURN = /* glsl */`
  float tseS0 = aRise.x + .2 * aStone.w * (1. - aRise.x), tseB = aRise.w + aStone.w * 40.;
  float tseUp = pow(max(uRise - tseS0, 0.), 1.7) * aRise.y * (1. - .5 * fract(aStone.w * 7.31));
  float tseOff = smoothstep(0., 3., tseUp), tseFree = max(tseUp - uClear, 0.);
  vTseOpen = smoothstep(0., 1. + uClear, tseFree);
  float tseLean = (${RISE_LEAN[0].toFixed(2)} + ${(RISE_LEAN[1] - RISE_LEAN[0]).toFixed(2)} * fract(tseB * 2.17)) * (aRise.z < 0. ? -1. : 1.) / (1. + .1 * uClear);
  mat3 tseR = tseTurn(normalize(vec3(cos(tseB), .35, sin(tseB))), tseLean * vTseOpen * (1. + ${RISE_SWAY.toFixed(3)} * sin(uTime * clamp(abs(aRise.z) * 12., .04, .6) + tseB * 5.)) + tseFree * aRise.z);
  objectNormal = tseR * objectNormal;`;
// (EVERY STONE CLIMBS STRAIGHT UP, WHATEVER WAY IT LIES: the climb, the drift and the ride of an instanced stone are
// brought into its instance's own space by the inverse of that instance's matrix, which then carries them back)
const RISE_MOVE = /* glsl */`
  transformed = aStone.xyz + tseR * (transformed - aStone.xyz);
  vec3 tseGo = vec3(cos(tseB) * .05, 1., sin(tseB) * .05) * tseUp; tseGo.y += sin(uTime * (.5 + .5 * fract(tseB * 1.37)) + tseB * 9.) * .8 * tseOff;
#ifdef USE_INSTANCING
  tseGo = inverse(mat3(instanceMatrix)) * tseGo;
#endif
  transformed += tseGo;`;

// THE FRONT'S SMOKE STANDS A LITTLE OFF THE GROUND: low puffs of white vapour, wide and flat (9 to 18 m across, 1.5 to
// 2.8 m high: never a column, never as high as the line of flight), one to about every 18 m of the plain on a
// jittered lattice dealt by a stream of its own. A puff shows only where the vapour lies (the same band along the
// frost's edge as on the ground, by the same measure of the place and the same law), swells and thins in its own
// time and drifts a few metres to and fro; everywhere else it has no size. Each stands upright and turns about its
// own upright axis to face whoever looks, as vapour has no face. NO PUFF STANDS IN THE LINE'S OWN LANE: one dealt
// within 19 m of the line on the ground (its own half width at most 9 m, its drift 3 m, and 7 m of clear air)
// has no size at any time (the mark under nought in its third number).
const PUFF_VERT = /* glsl */`
attribute vec4 aPuff;
uniform float uTime;
${NOISE_GLSL}
${THETA_GLSL}
varying vec3 vW; varying vec3 vQ; varying float vA;
void main(){
  vec2 p = aPuff.xy + 3. * vec2(sin(uTime * .21 + aPuff.w * 40.), cos(uTime * .17 + aPuff.w * 23.));
  vec4 fld = texture2D(tField, (p - uField.xy) / (2. * uField.z) + .5);
  float a = tseBand(tseTheta(p, fld.g)) * (1. - smoothstep(.47, .5, fld.r)) * (.55 + .45 * sin(uTime * (.5 + .5 * aPuff.w) + aPuff.w * 60.));
  float on = smoothstep(.04, .2, a) * step(0., aPuff.z), w = (9. + 9. * aPuff.z) * on, h = (1.5 + 1.3 * aPuff.z) * on;
  vec2 toEye = cameraPosition.xz - p; vec2 side = vec2(toEye.y, -toEye.x) / max(length(toEye), 1e-3);
  vW = vec3(p.x + side.x * position.x * w, position.y * h, p.y + side.y * position.x * w);
  vQ = vec3(position.x * 2., position.y, aPuff.w); vA = a;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const PUFF_FRAG = SKY_GLSL + /* glsl */`
varying vec3 vW; varying vec3 vQ; varying float vA;
void main(){
  // soft at both sides and on the ground, ragged and thin at the top
  float n = tseNoise(vec2(vQ.x * 1.7 + vQ.z * 31., vQ.y * 1.3 - uTime * .12 + vQ.z * 17.)), top = .35 + .6 * n;
  float body = max(1. - vQ.x * vQ.x, 0.) * (1. - smoothstep(top * .3, top, vQ.y)) * smoothstep(0., .1, vQ.y);
  vec3 vapL = uAmb * 2.4 + (uSunE[0] + uSunE[1] + uSunE[2]) * .5;
  gl_FragColor = vec4(vapL, clamp(vA, 0., 1.) * body * body * .5 * (1. - tseFog(length(cameraPosition - vW))));
}`;

// ---------------------------------------------------------------- THE STONE
// THE STONE IS BEDDED, NEVER COURSED. Two families of marks and no third:
//   LEVEL ones, functions of the height across the beds alone (bent a little by the place: THE BEDS ARE NEARLY
//   LEVEL LAYERS AND NO TWO BEND ALIKE: a bed's bending is broad, one swell wider than a giant, and gentle, no
//   bed rising by more than about one in six, and it drifts sideways as the beds climb, each of its three parts
//   its own way, so no line of bends can run down a trunk; the laminae's crinkle drifts likewise): uneven beds 1 to 5 m
//   thick, each of its own tone and hardness, a soft parting between them, thin laminae (about a third of a metre)
//   inside each; hard beds stand out as ledges and soft ones are eaten back (up to four tenths of a metre);
//   UPRIGHT ones, functions of the place across the stone and, slowly, of the height: run-off flutes half a metre and
//   more across, facets, pits and a grain. NO DARK LINE OF A CRACK STANDS ON ANY STONE (there was a law of thin dark
//   cracks; a crack's bends could close on a near trunk into a shape that reads as a sign scratched there, so the
//   law is taken out whole and nothing stands in its place). NO UPRIGHT MARK READS A BED'S NUMBER, ITS EDGES OR ITS HARDNESS:
//   each runs on through every bed it meets and meanders as it climbs (the whole pattern is drawn sideways by up
//   to a metre and a half either way, another way every 8 m or so of height, and slides slowly besides); the
//   flutes are of two widths laid over one another, and flutes and facets come and go with slow patches of their
//   own across the stone and up it, so they are of unlike spacing, length and depth and cross many beds. By this law no mark can begin and end at one bed's two edges,
//   and no bed can be cut into pieces: there is nothing that could lay a course.
// The beds are level in a standing stone and lie across the length of the toppled one (uBedAxis, uBedFoot). The lowest
// metres of every stone are darker (damp from the ground), by metres and not by the stone's size. tseRel is the
// stone's RELIEF in metres, which turns the light (STONE_RELIEF). Each part is drawn only while it is wider than
// what one dot of the screen covers, so nothing of it swims.
const STONE_BEDS = /* glsl */`#include <color_fragment>
  float tseH = dot(vTseP - uBedFoot, uBedAxis); vec2 tseX = (vTseP - uBedAxis * tseH).xz;
  float tseDip = (tseNoise(tseX * .016 + vec2(tseH * .0047, -tseH * .0031)) - .5) * 2. + (tseNoise(tseX * .05 + vec2(-tseH * .013, tseH * .017) + 7.) - .5) * .5
    + (tseNoise(tseX * .31 + vec2(tseH * .21, tseH * .13) + 19.) - .5) * .1;
  float tseY0 = tseH * .42 + tseDip, tseY = tseY0 + (tseNoise(vec2(tseY0 * .8, 3.3)) - .5) * .9;
  float tseBi = floor(tseY), tseBf = fract(tseY), tseFw = fwidth(tseY), tseDet = 1. - smoothstep(.6, 2., tseFw);
  float tseTone = tseHash(vec2(tseBi, 3.7)), tseHard = tseHash(vec2(tseBi, 8.1));
  float tsePart = (1. - smoothstep(.0, .035 + tseFw, min(tseBf, 1. - tseBf))) * tseDet * (.3 + .7 * tseHard);
  float tseDot = max(fwidth(tseX.x) + fwidth(tseX.y), fwidth(tseH)), tsePd = 1. - smoothstep(.06, .2, tseDot);
  float tsePit = tseNoise(tseX * 1.9 + tseH * 1.3) * .6 + mix(.5, tseNoise(tseX * 4.7 - tseH * 3.1), tsePd) * .4;
  float tseMot = tseNoise(tseX * .37 + tseH * .23) * .6 + tseNoise(tseX.yx * .9 - tseH * .5 + 4.) * .4;
  float tseBig = tseNoise(vec2(tseH * .07 + tseDip * .2, 1.3));
  float tseFd = 1. - smoothstep(.25, .7, fwidth(tseX.x) + fwidth(tseX.y));
  vec2 tseXw = tseX + (vec2(tseNoise(vec2(tseH * .13, 7.)), tseNoise(vec2(tseH * .13, 19.))) - .5) * 3.2;
  float tseGd = 1. - smoothstep(.03, .14, fwidth(vTseP.y) + fwidth(vTseP.x) + fwidth(vTseP.z));
  float tseGr = tseNoise(tseX * 9. + tseH * 7.) * .55 + tseNoise(tseX.yx * 23. - tseH * 19.) * .45;
  float tsePale = step(.8, tseHash(vec2(tseBi, 5.3))) * tseDet;
  float tseLy = tseY * 8. + (tseNoise(tseX * 1.1 + vec2(tseH * .31, -tseH * .2)) - .5) * 1.2, tseLf = fract(tseLy), tseLd = 1. - smoothstep(.5, 1.6, fwidth(tseLy)), tseLr = 1. - smoothstep(.12, .35, fwidth(tseLy));
  float tseLt = tseHash(vec2(floor(tseLy), 1.7));
  float tseL2 = tseLy * 5. + (tseNoise(tseX * 3.3 + vec2(tseH * 1.1, -tseH * .7)) - .5) * 1.6, tseL2w = fwidth(tseL2), tseL2d = 1. - smoothstep(.3, 1.1, tseL2w), tseL2f = fract(tseL2);
  float tseL2t = tseHash(vec2(floor(tseL2), 4.9)), tseL2p = (1. - smoothstep(0., .1 + tseL2w, min(tseL2f, 1. - tseL2f))) * tseL2d * (.4 + .6 * tseHash(vec2(floor(tseL2), 9.3)));
  float tseG2d = 1. - smoothstep(.008, .04, fwidth(vTseP.y) + fwidth(vTseP.x) + fwidth(vTseP.z));
  vec2 tseXr = vec2(tseX.x * .8 - tseX.y * .6, tseX.x * .6 + tseX.y * .8);
  float tseG2 = tseNoise(tseX * 43. + tseH * 37.) * .5 + tseNoise(tseXr * 101. - tseH * 89.) * .5;
  diffuseColor.rgb *= mix(1., .78 + .4 * tseTone, tseDet) * (.82 + .3 * tseBig) * (.8 + .36 * tsePit) * (.76 + .46 * tseMot) * (1. - .46 * tsePart)
    * mix(1., .84 + .32 * tseGr, tseGd) * (1. + .3 * tsePale) * mix(1., .84 + .32 * tseLt, tseLd) * mix(.72, 1., smoothstep(0., 7., vTseP.y))
    * mix(1., .87 + .26 * tseL2t, tseL2d) * (1. - .2 * tseL2p) * mix(1., .84 + .32 * tseG2, tseG2d);
  float tseFl = tseNoise(tseXw * 1.3 + vec2(tseH * .05, -tseH * .037)) * .55 + tseNoise(tseXw * .47 + vec2(-tseH * .043, tseH * .031) + 17.) * .45;
  float tseFm = smoothstep(.35, .65, tseNoise(tseX * .21 + tseH * .06 + 31.)) * (.25 + .75 * smoothstep(.3, .7, tseNoise(vec2(tseH * .09 + 3., tseX.x * .05 + tseX.y * .07))));
  float tseEw = .1 + tseFw * 1.5;
  float tseRel = (tseHard - .45) * .8 * (1. - smoothstep(.12, .4, tseFw)) * smoothstep(0., tseEw, tseBf) * smoothstep(0., tseEw, 1. - tseBf) + (tseFl - .5) * .5 * tseFm * tseFd
    + (tseLt - .5) * .14 * smoothstep(0., .3, tseLf) * smoothstep(0., .3, 1. - tseLf) * tseLr + (tsePit - .5) * .25 * tsePd
    + (tseL2t - .5) * .025 * smoothstep(0., .3, tseL2f) * smoothstep(0., .3, 1. - tseL2f) * tseL2d + (tseG2 - .5) * .006 * tseG2d;
  float tseFk = tseFd * (.3 + .7 * smoothstep(.3, .7, tseNoise(tseX * .13 + tseH * .07 + 51.)));
  vec3 tseFac = vec3((tseNoise(tseXw * .55 + vec2(tseH * .04, 0.)) - .5) * tseFk, (tseBf - .5) * .5 * (.3 + .7 * tseHard) * tseDet, (tseNoise(tseXw * .55 + vec2(31., tseH * .04)) - .5) * tseFk) * vec3(.55, .5, .55);`;
// the relief turns the light: the stone's facing is tipped by each bed's own facet and by the slope of its relief.
// Each mark of the relief fades out before it is smaller than the screen's own dots (a bed's ledge under about four
// dots, a lamina under about five, a pit where a dot is a fifth of a metre), so far stone is smooth and never speckled
// (metres of relief to a metre of stone, from the screen's own neighbouring dots; bounded, so a face seen edge on
// is never torn)
const STONE_RELIEF = /* glsl */`#include <normal_fragment_maps>
  { vec3 tseNn = normal + (viewMatrix * vec4(tseFac, 0.)).xyz; normal = tseNn / max(length(tseNn), 1e-4);
    vec3 tsePx = dFdx(-vViewPosition), tsePy = dFdy(-vViewPosition), tseR1 = cross(tsePy, normal), tseR2 = cross(normal, tsePx);
    float tseDt = dot(tsePx, tseR1);
    vec3 tseG = (dFdx(tseRel) * tseR1 + dFdy(tseRel) * tseR2) * sign(tseDt) / max(abs(tseDt), 1e-7);
    tseG *= min(1., 1.6 / max(length(tseG), 1e-4));
    normal = normalize(normal - tseG); }`;

// ---------------------------------------------------------------- THE PLAN OF THE PLACE, DEALT BY THE SEED
// World metres, x east, z south; the entry stands at (0, 0) and heads north. TYPED here are only the entry's own
// things (the design's first beat) and the measures of the place: the entry pool, the first grove past it, the pace,
// the lanes. EVERYTHING ELSE IS DEALT by streams of their own and differs by seed: where the family of giants
// stands, which of them has toppled onto which, where the tallest stands and the ring at its foot, the ring's pool,
// the brine channel, the needles that stand alone, and so the route itself, its length and how long the flight lasts.
// typed: the entry pool (middle x, z; its long axis; half length, half width) and the first grove (x, z, radius, needles)
const ENTRY_POOL = [14, -40, 0, -1, 42, 30], FIRST = [-4, -124, 38, 46];
// PACE: metres a second (the flight lasts the route's length over it). LANE, GIANT_LANE: no common needle stands
// nearer the line of flight than 10 m (so that no stone comes into the lens as a blur), no giant's body nearer than 25 m. ALONE_R: the bare floor about a needle that
// stands alone. TOP: the height of the one rise. RING_Y: the ring's middle over its pool. SPACING: giants stand 150 m
// and more apart. FIELD_AT, FIELD_HALF: the middle and half size of the baked square of ground that holds every route.
const PACE = 26, LANE = 10, GIANT_LANE = 25, ALONE_R = 40, TOP = 70, RING_Y = 9, SPACING = 150;
const FIELD_AT = [0, -660], FIELD_HALF = 1280, FIELD_N = 512;
// THE PYRAMID (the one worked thing of the place, alone on open salt beyond the ring; the journey's end).
// Its measures are the part file's (a base of 690 m, 330 m high: half again what they were). ITS PLACE: straight
// on beyond the ring along the last line of the flight, its middle PYR_AWAY metres beyond the ring (882 m: its
// near side 537 m beyond the ring, its top 20.5 degrees over the level from the ring): it stands over the whole
// plain from the level top and fills the sky behind the ring. The row of the three suns
// follows its top by rule (ROW, in build()).
const PYR_HALF = PYRAMID.half, PYR_H = PYRAMID.height, PYR_AWAY = 882;
const rot2 = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
const unit2 = (x, z) => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };

// THE FAMILY OF GIANTS (stream 'tse-giants'; every die is drawn before any test). Great slender needles, 250 to 400 m
// (several times the tallest common needle), nine and more times as tall as wide at the foot, 150 m and more apart on
// open salt. Their middle is dealt 800 to 900 m from the entry (from the least that the rise, a level top and the
// way down to the pass need before it, to a hundred metres more), within 6 degrees of north. The first stands at the
// middle; its near neighbour 150 to 185 m from it at a dealt bearing; the others at a dealt bearing and distance, kept
// where they stand 150 m from all before them. THE ONE AT THE MIDDLE HAS TOPPLED onto whichever stands nearest it: it
// leans at 55 to 63 degrees from the level and rests part way up its length on that neighbour's blunt head (the
// neighbour is as tall as the leaning stone's underside there), its top lying on past it by a fifth to three tenths
// of the way it has come (60 to 110 m; it is never longer than 395 m). THE PASS is the
// place under the leaning stone, 0.56 of the way from its foot to the neighbour's. THE TALLEST (the hero, 400 m)
// stands 320 to 380 m beyond the pass, 41 to 49 degrees to one side of the way through it, AND ALWAYS TO THE SIDE
// THE TOPPLED STONE LEANS TO, away from its foot (HERO_HAND, HERO_OFF: the die that dealt the side before now deals
// only how far to it). So the ring and the pyramid beyond it lie well to one hand of the pass: seen from the
// level top and from the way down, the pyramid stands clear of the toppled stone, which rises to the other hand
// of it, and the line turns to the pyramid only after it has gone under the stone. THE RING stands 70 m from
// the tallest one's foot; two more giants are dealt about it.
const HERO_HAND = -1, HERO_OFF = [0.72, 0.14], CLEAR = 6, LOOK_LEAD = 30, LOOK_ON = 130, LOOK_HELD = 100;
function dealFamily(rG) {
  const cB = rG.range(-0.1, 0.1), cR = rG.range(800, 900), C = [Math.sin(cB) * cR, -Math.cos(cB) * cR], cand = [];
  for (let k = 0; k < 18; k++) {
    const a = rG.range(0, TAU), q = rG(), d = k === 0 ? 0 : k === 1 ? SPACING + 35 * q : 70 + 270 * Math.sqrt(q);
    cand.push({ x: C[0] + Math.cos(a) * d, z: C[1] + Math.sin(a) * d, h: rG.range(250, 340), sl: rG.range(9, 11), blunt: rG.chance(0.2) });
  }
  const leanQ = rG(), overQ = rG.range(0.22, 0.3), heroQ = rG.range(-1, 1), heroR = rG.range(320, 380), heroSide = rG.chance(0.5) ? 1 : -1;
  const poolHalf = rG.range(110, 130), byRing = [];
  for (let k = 0; k < 6; k++) byRing.push({ a: rG.range(0, TAU), d: rG.range(SPACING, 250), h: rG.range(250, 330), sl: rG.range(9, 11) });
  const far = (list, x, z) => list.every((g) => Math.hypot(g.x - x, g.z - z) >= SPACING);
  let fam = [];
  cand.forEach((c, k) => { if (fam.length < 6 && far(fam, c.x, c.z)) fam.push({ x: c.x, z: c.z, h: c.h, w: c.h / c.sl, blunt: c.blunt, who: 'family' + k }); });
  // the toppled one and the neighbour it rests on
  const top = fam[0]; let nb = fam[1];
  for (const g of fam) if (g !== top && Math.hypot(g.x - top.x, g.z - top.z) < Math.hypot(nb.x - top.x, nb.z - top.z)) nb = g;
  const D = Math.hypot(nb.x - top.x, nb.z - top.z), u = unit2(nb.x - top.x, nb.z - top.z);
  const lean = Math.min((56 + 7 * leanQ) * DEG, Math.acos(1.22 * D / 395)), reach = D / Math.cos(lean), len = Math.min(reach * (1 + overQ), 395), wT = len / 10;
  Object.assign(top, { h: len * Math.sin(lean), w: wT, blunt: false, leanTo: [u[0] * len * Math.cos(lean), u[1] * len * Math.cos(lean)], bow: [0, 0], lean, len });
  Object.assign(nb, { h: (D - 0.3 * wT) * Math.tan(lean) + 3, blunt: true }); nb.w = nb.h / 9.5; top.who = 'pass-toppled'; nb.who = 'pass-rest';
  const pass = [top.x + u[0] * D * 0.56, top.z + u[1] * D * 0.56], under = (0.56 * D - 0.4 * wT) * Math.tan(lean);
  // the way through the pass: straight on from the entry where that crosses the pair's line at 55 degrees or more, else turned to 55
  const m0 = unit2(pass[0], pass[1]), A50 = 55 * DEG;
  let a = Math.atan2(u[0] * m0[1] - u[1] * m0[0], u[0] * m0[0] + u[1] * m0[1]);
  if (Math.abs(a) < A50) a = a < 0 ? -A50 : A50; else if (Math.abs(a) > Math.PI - A50) a = a < 0 ? A50 - Math.PI : Math.PI - A50;
  const heroB = (a < 0 ? -1 : 1) * HERO_HAND * (HERO_OFF[0] + HERO_OFF[1] * Math.abs(heroQ));
  const dir = rot2(u, a), hd = rot2(dir, heroB), H = [pass[0] + hd[0] * heroR, pass[1] + hd[1] * heroR];
  const after = [pass[0] + dir[0] * 80, pass[1] + dir[1] * 80], e0 = unit2(H[0] - after[0], H[1] - after[1]);
  const ring = [H[0] + heroSide * 70 * e0[1] - 6 * e0[0], H[1] - heroSide * 70 * e0[0] - 6 * e0[1]];
  const endDir = unit2(ring[0] - after[0], ring[1] - after[1]), run = Math.hypot(ring[0] - after[0], ring[1] - after[1]);
  // THE WAY BEYOND THE PASS KEEPS CLEAR OF EVERY GIANT BUT THE PAIR BY SIX OF THAT GIANT'S OWN THICKNESSES (CLEAR:
  // from the line to the giant's flank). So the tallest does not stand at the mark H that the ring is laid from
  // (70 m from the ring): it stands abeam of the ring, six of its thicknesses and 8 m from the line, ON THE HAND AWAY
  // FROM THE PASS: the level top lies on the pass's hand of the last line, so the ground between the level top and
  // the pyramid reaches far out on that hand at the ring and only a little way on the other; there the tallest
  // stands clear of it (of all the giants only the pair of the pass and the two of the way, which the line is led
  // by, may stand on that ground).
  const en = [-endDir[1], endDir[0]], hs = (pass[0] - ring[0]) * en[0] + (pass[1] - ring[1]) * en[1] < 0 ? 1 : -1, hOff = (CLEAR + 0.5) * 40 + 8;
  const hero = { x: ring[0] + hs * en[0] * hOff, z: ring[1] + hs * en[1] * hOff, h: 400, w: 40, hero: true, who: 'tallest' };
  // the family keeps 150 m from the tallest too (the pair always does)
  fam = fam.filter((g) => g === top || g === nb || far([hero], g.x, g.z));
  // two more by the ring: kept where they stand 150 m from every other and six of their own thicknesses from the last line of the flight
  const byR = [];
  byRing.forEach((c, k) => {
    const x = H[0] + Math.cos(c.a) * c.d, z = H[1] + Math.sin(c.a) * c.d, t = clamp((x - after[0]) * endDir[0] + (z - after[1]) * endDir[1], 0, run + 80);
    if (byR.length < 2 && Math.hypot(x - after[0] - endDir[0] * t, z - after[1] - endDir[1] * t) >= (CLEAR + 0.5) * c.h / c.sl + 8 && far([hero, ...fam, ...byR], x, z)) byR.push({ x, z, h: c.h, w: c.h / c.sl, who: 'ring' + k });
  });
  return { C, giants: [hero, ...fam, ...byR], top, nb, pass, dir, after, ring, endDir, under, passH: clamp(0.28 * under, 28, 38),
    ringPool: [ring[0] - 90 * endDir[0], ring[1] - 90 * endDir[1], endDir[0], endDir[1], poolHalf, 44] };
}

// THE PLAN: the family, then the line of the flight led by the places, the brine, the line's height by one law, the
// needles that stand alone and the far giants. A pure function of the seed; the world is built from it.
export function layPlan(seedStr) {
  const stream = (name) => makeRng(hashSeed(name + ':' + seedStr));
  const rA = stream('tse-alone'), rW = stream('tse-way'), rF = stream('tse-far'), noise = makeNoise(hashSeed('tse-noise:' + seedStr));
  const F = dealFamily(stream('tse-giants')), P = F.pass, e = F.endDir;
  // the pyramid's place (dir: the way from the ring to it, which its stair faces back along)
  const away = PYR_AWAY, pyr = { x: F.ring[0] + e[0] * away, z: F.ring[1] + e[1] * away, dir: [e[0], e[1]], half: PYR_HALF, h: PYR_H, away };
  // THE LINE ON THE GROUND. From the entry straight north over the entry pool to the far end of its long axis
  // (through the first grove, which stands astride it). From there to the place 110 m before the pass it is LED ROUND
  // TWO MORE GIANTS, passed close, one on each hand (stream 'tse-way'): each stands a little to one side of the
  // straight way between those two places (the first 0.26 to 0.32 of the way along it, the second 0.68 to 0.74; 0 to
  // 30 m aside; 260 to 340 m tall), and the line goes by on its other side at the giants' lane and 8 to 16 m more,
  // running there as the straight way runs: so the line swings one way and then the other and never heads at one
  // thing for long. The second is passed on the hand toward which the way through the pass turns from the straight
  // way (so that the line comes round it into the pass in one sweep), the first on the other hand. The line comes to
  // the place 110 m before the pass heading the way through it, goes straight through
  // the pass and 80 m on, and takes one long bend to the ring's line, which it joins 100 m before the ring. Every
  // bend is a cubic between two places with a heading at each (knots at its even thirds).
  const S1 = [0, ENTRY_POOL[1] - ENTRY_POOL[4]], A1 = [P[0] - F.dir[0] * 110, P[1] - F.dir[1] * 110], back = (m) => [F.ring[0] - m * e[0], F.ring[1] - m * e[1]];
  // a bend between two places with a heading at each (a cubic; m: the straight distance between them)
  const bend = (p0, t0, p1, t1, t) => {
    const m = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), t2 = t * t, t3 = t2 * t, a = 2 * t3 - 3 * t2 + 1, b = (t3 - 2 * t2 + t) * m, c = 3 * t2 - 2 * t3, d = (t3 - t2) * m;
    return [a * p0[0] + b * t0[0] + c * p1[0] + d * t1[0], a * p0[1] + b * t0[1] + c * p1[1] + d * t1[1]];
  };
  const kn = [[0, 0], [0, S1[1] / 2], S1], NORTH = [0, -1];
  const cv = unit2(A1[0] - S1[0], A1[1] - S1[1]), cn = [-cv[1], cv[0]], wayLen = Math.hypot(A1[0] - S1[0], A1[1] - S1[1]), way = [], wk = [];
  let side = F.dir[0] * cn[0] + F.dir[1] * cn[1] < 0 ? 1 : -1;
  for (let k = 0; k < 2; k++) {
    const f = k === 0 ? rW.range(0.26, 0.32) : rW.range(0.68, 0.74), aside = rW.range(0, 30) * side, h = rW.range(260, 340), w = h / rW.range(9, 10.5), by = GIANT_LANE + 1.05 * w + rW.range(8, 16);
    const g = { x: S1[0] + cv[0] * f * wayLen + cn[0] * aside, z: S1[1] + cv[1] * f * wayLen + cn[1] * aside, h, w, way: true, who: 'way' + k };
    way.push(g); wk.push([g.x - cn[0] * side * by, g.z - cn[1] * side * by]); side = -side;
  }
  const third = (p0, t0, p1, t1) => [bend(p0, t0, p1, t1, 1 / 3), bend(p0, t0, p1, t1, 2 / 3), p1];
  kn.push(...third(S1, NORTH, wk[0], cv), ...third(wk[0], cv, wk[1], cv), ...third(wk[1], cv, A1, F.dir));
  const L0 = back(100);
  kn.push(P, F.after, bend(F.after, F.dir, L0, e, 1 / 3), bend(F.after, F.dir, L0, e, 2 / 3), L0, back(56), back(28), F.ring);
  const flat = makePath(kn.map((q) => [q[0], 0, q[1]])), FL = flat.length, RT = [], v = new THREE.Vector3();
  for (let d = 0; d <= FL; d += 2) { flat.posAtDist(d, v); RT.push(v.x, v.z); }
  const sOf = (x, z) => { let best = 1e9, at = 0; for (let i = 0; i < RT.length; i += 2) { const q = Math.hypot(RT[i] - x, RT[i + 1] - z); if (q < best) { best = q; at = i; } } return at; };
  const sS1 = sOf(S1[0], S1[1]), sP = sOf(P[0], P[1]);
  // (N) THE PYRAMID IS SEEN WHOLE ACROSS OPEN GROUND. The fan of a place of the way: the ground between it and the
  // pyramid's near side, that side taken a fifth wider on each hand. WHERE THE PAIR OF THE PASS HAS FALLEN BEHIND
  // (sLook): THE FIRST PLACE BEYOND THE PASS FROM WHICH, AND FROM EVERY PLACE AFTER IT TO THE RING, THE PAIR LIES IN NO
  // FAN: neither the foot of the stone the toppled one rests on nor any of the toppled one's length on the ground
  // (each by half its thickness); never later than LOOK_ON and LOOK_HELD metres before the ring, so that the look
  // at the pyramid can stand whole over the last LOOK_HELD metres. THE GIANTS' AVENUE is all the
  // fans of the level top (from the place the line reaches it to the place it leaves it) and all the
  // fans from that place to the ring: no giant stands in it (`open`), and none but the pair stands within CLEAR
  // of its own thicknesses of the way beyond the pass. Needles' groves, pools and frost may lie there: they are low.
  const pn = [-e[1], e[0]], nearA = [pyr.x - e[0] * pyr.half + pn[0] * pyr.half * 1.2, pyr.z - e[1] * pyr.half + pn[1] * pyr.half * 1.2], nearB = [pyr.x - e[0] * pyr.half - pn[0] * pyr.half * 1.2, pyr.z - e[1] * pyr.half - pn[1] * pyr.half * 1.2];
  const toSeg = (x, z, ax, az, bx, bz) => { const ex = bx - ax, ez = bz - az, t = clamp(((x - ax) * ex + (z - az) * ez) / Math.max(ex * ex + ez * ez, 1e-9), 0, 1); return Math.hypot(x - ax - ex * t, z - az - ez * t); };
  const inFan = (ax, az, x, z, m) => {
    const s1 = (nearA[0] - ax) * (z - az) - (nearA[1] - az) * (x - ax), s2 = (nearB[0] - nearA[0]) * (z - nearA[1]) - (nearB[1] - nearA[1]) * (x - nearA[0]), s3 = (ax - nearB[0]) * (z - nearB[1]) - (az - nearB[1]) * (x - nearB[0]);
    if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return true;
    return Math.min(toSeg(x, z, ax, az, nearA[0], nearA[1]), toSeg(x, z, nearA[0], nearA[1], nearB[0], nearB[1]), toSeg(x, z, nearB[0], nearB[1], ax, az)) < m;
  };
  const pairAt = [[F.nb.x, F.nb.z, 0.5 * F.nb.w]]; for (let k = 0; k <= 12; k++) pairAt.push([F.top.x + F.top.leanTo[0] * k / 12, F.top.z + F.top.leanTo[1] * k / 12, 0.5 * F.top.w]);
  let sLook = sP; for (let i = RT.length - 2; i > sP; i -= 2) if (pairAt.some((q) => inFan(RT[i], RT[i + 1], q[0], q[1], q[2]))) { sLook = i + 2; break; }
  sLook = Math.min(sLook, RT.length - 2 - LOOK_ON - LOOK_HELD);
  const inGiantAve = (x, z, m) => { for (let i = 2 * Math.ceil(sTop / 2), i1 = 2 * Math.floor(sD0 / 2); i <= i1; i = i < i1 && i + 8 > i1 ? i1 : i + 8) if (inFan(RT[i], RT[i + 1], x, z, m)) return true; for (let i = sLook; i < RT.length; i += 8) if (inFan(RT[i], RT[i + 1], x, z, m)) return true; return inFan(RT[RT.length - 2], RT[RT.length - 1], x, z, m); };
  const wayGap = (x, z) => { let best = 1e9; for (let i = sP; i < RT.length; i += 2) { const q = Math.hypot(RT[i] - x, RT[i + 1] - z); if (q < best) best = q; } return best; };
  const open = (g) => wayGap(g.x, g.z) - 0.5 * g.w >= CLEAR * g.w && !inGiantAve(g.x, g.z, 0.5 * g.w);
  // THE LINE'S HEIGHT BY PLACES AND ONE GREATEST SLOPE. Each climb or way down is an eased ramp (ease: half a
  // straight ramp, half an eased one, so its steepest part is one and a quarter times its mean slope), and none is
  // laid steeper than SLOPE (15 degrees at its steepest; the line through its knots, one about every 40 m, comes
  // out at 15.0 to 15.4 degrees at its steepest by seed). THE RISE begins where the line leaves the first grove's
  // rim and brings the line from the crust's 8 m to the top abeam of the second giant on the way (or later, where
  // that slope asks for more room); THE TOP is held from there, level over the whole plain, until the way down must
  // begin; THE WAY DOWN (as long as that slope makes it: 156 to 190 m) ends where the lens comes under the leaning
  // stone's near edge; under the stone the line is LEVEL for the stone's own span over it (the stone's width over
  // the sine of the angle at which the line crosses it: 17 to 24 m either side of the pass); from its far edge
  // one last way down (as long as the place gives, so gentler) to the ring's height, level over the last 100 m.
  // THE BRINE CHANNEL runs under the line from the entry pool to the place where the rise has lifted the line
  // 25 m over it (through the first groves; the line climbs out of it).
  const SLOPE = Math.tan(15 * DEG), rampLen = (dh) => 1.25 * Math.abs(dh) / SLOPE, topH = TOP;
  let sR0 = sS1; for (let i = sS1; i < sS1 + 300 && i < RT.length; i += 2) if (Math.hypot(RT[i] - FIRST[0], RT[i + 1] - FIRST[1]) < FIRST[2]) sR0 = i;
  const pairU = unit2(F.nb.x - F.top.x, F.nb.z - F.top.z), span = 0.5 * F.top.w / Math.max(Math.abs(F.dir[0] * pairU[1] - F.dir[1] * pairU[0]), 0.5);
  const sTop = Math.max(sOf(wk[1][0], wk[1][1]), sR0 + rampLen(TOP - 8)), sL0 = sP - span, sL1 = sP + span, sD0 = sL0 - rampLen(TOP - F.passH);
  const ease = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return 0.5 * (t + t * t * (3 - 2 * t)); };
  // (the channel's end: the metre of the rise at which the line stands 25 m over the brine's 5 m, found on the ramp itself)
  let sCE = sR0; while (sCE < sTop && 5 + (TOP - 5) * ease(sR0, sTop, sCE) < 25) sCE += 2;
  // the channel's half width along its length: 6 m, opening to pools of up to 15 m, closing over its last 50 m
  // (how far east or west of the entry the channel's own line strays, and 60 m: brine of the channel is looked for only inside that)
  let chanX = 0; for (let i = 0; i <= sCE && i < RT.length; i += 2) chanX = Math.max(chanX, Math.abs(RT[i])); chanX += 60;
  const chanW = (s) => (6 + 9 * smoothstep(-0.1, 0.6, noise.n2(s * 0.017, 3.1))) * (1 - smoothstep(sCE - 50, sCE, s));
  // BRINE (metres inside, negative outside, by the field's own measure): the broad pools and the small ones of the
  // brine field, the entry's pool and the ring's (one shore law: bays and spits by the place's own noise), the
  // channel; and brine yields to every great stone (dry ground for 0.8 of its width and 5 m about its foot)
  const poolSD = (x, z) => {
    let sd = Math.max((noise.fbm2(x * 0.0052 + 7.1, z * 0.0052 - 3.3, 3) - 0.37) * 200, (noise.fbm2(x * 0.021 + 1.3, z * 0.021 + 5.9, 2) - 0.45) * 46);
    // the brine field thins out toward the baked square's bound: over its last few hundred metres (sooner here, later
    // there, by the place's own noise) the pools shrink to nothing, so none is cut off along the square's straight side
    const rim = FIELD_HALF - Math.max(Math.abs(x - FIELD_AT[0]), Math.abs(z - FIELD_AT[1]));
    if (rim < 480) sd -= 260 * (1 - smoothstep(60, 360, rim + 120 * noise.n2(x * 0.004 + 31.7, z * 0.004 - 12.9)));
    if (rim - 60 < sd) sd = rim - 60;
    const shore = noise.fbm2(x * 0.023 + 3.7, z * 0.023 + 9.1, 2) * 9;
    // (THE BUILD'S TIME: each of the three measures below is first weighed by squares, and Math.hypot is taken only
    // where it can change the figure; what is left out could not have changed it, so the figure is the same to its
    // last digit. A typed pool is left out when its oval lies farther off than the figure reaches, with a millionth
    // of its half width to spare; a great stone when its dry ring does; of the channel's points only the nearest
    // by squares, to a part in a thousand million, are measured.)
    for (const t of [ENTRY_POOL, F.ringPool]) {
      const dx = x - t[0], dz = z - t[1], a = (dx * t[2] + dz * t[3]) / t[4], b = (-dx * t[3] + dz * t[2]) / t[5];
      const m = 1 - (sd - shore) / t[5] + 1e-6; if (m < 0 || a * a + b * b > m * m * (1 + 1e-9)) continue;
      const q = (1 - Math.hypot(a, b)) * t[5] + shore; if (q > sd) sd = q;
    }
    if (z < 40 && z > -(sCE + 60) && Math.abs(x) < chanX) {
      const i0 = Math.max(0, sS1 - 20); let q0 = 1e300;
      for (let i = i0; i <= sCE && i < RT.length; i += 2) { const dx = RT[i] - x, dz = RT[i + 1] - z, q = dx * dx + dz * dz; if (q < q0) q0 = q; }
      const lim = q0 * (1 + 1e-9); let best = 1e9, at = 0;
      for (let i = i0; i <= sCE && i < RT.length; i += 2) { const dx = RT[i] - x, dz = RT[i + 1] - z; if (dx * dx + dz * dz <= lim) { const q = Math.hypot(dx, dz); if (q < best) { best = q; at = i; } } }
      const q = chanW(at) - best + shore * 0.3; if (q > sd) sd = q;
    }
    for (const g of great) {
      const dx = x - g[0], dz = z - g[1], r = sd + (g[2] * 0.8 + 5);
      if (r >= 0 && dx * dx + dz * dz > r * r * (1 + 1e-9)) continue;
      const dh = Math.hypot(dx, dz) - (g[2] * 0.8 + 5); if (dh < sd) sd = dh;
    }
    return sd;
  };
  const lineGap = (x, z) => { let best = 1e9; for (let i = 0; i < RT.length; i += 2) { const q = Math.hypot(RT[i] - x, RT[i + 1] - z); if (q < best) best = q; } return best; };
  // a giant whose body or fallen stone (a foot's width about its middle) would lie within GIANT_LANE of the line does not stand (the pair and the tallest never do)
  const giants = F.giants.filter((g) => g.hero || g === F.top || g === F.nb || (lineGap(g.x, g.z) >= GIANT_LANE + 1.05 * g.w && way.every((q) => Math.hypot(g.x - q.x, g.z - q.z) >= SPACING) && open(g)));
  giants.push(...way);   // (and no giant of the family stands within 150 m of the two on the way)
  const great = giants.map((g) => [g.x, g.z, g.w]);   // the great stones that brine yields to: the giants that stand, then the needles that stand alone
  // THE NEEDLES THAT STAND ALONE (stream 'tse-alone'): three, each an eighth to a sixth as tall as the giant it
  // stands by (31 to 64 m: about the height of the tallest common needles, so the eye has the giant's measure
  // beside it) and as slender as the needles of the groves (six to nine and a half times as tall as wide), each
  // at the foot of a giant: one by each of the two giants on the way and one by the tallest. Each stands beside its giant as
  // the line goes by (60 to 110 degrees round the giant from the line's nearest place, before it or beyond it), four
  // fifths of the giant's width, two of its own and 3 to 9 m from the giant's middle. Of its two dealt places (every
  // die drawn before any test) it takes the first that lies clear of the lane and of every other giant's bare ring
  // (if neither did, the clearer).
  const alones = [];
  for (const g of [way[0], way[1], F.giants[0]]) {
    const h = g.h * rA.range(0.12, 0.16), w = h / rA.range(6, 9.5), yaw = rA.range(0, TAU), vs = rA();
    const first = rA.chance(0.5) ? 1 : -1, round = [rA.range(60, 110) * DEG * first, -rA.range(60, 110) * DEG * first], d = 0.8 * g.w + 2 * w + rA.range(3, 9);
    let best = 1e9, bi = 0; for (let i = 0; i < RT.length; i += 2) { const q = Math.hypot(RT[i] - g.x, RT[i + 1] - g.z); if (q < best) { best = q; bi = i; } }
    const toLine = unit2(RT[bi] - g.x, RT[bi + 1] - g.z), dealt = round.map((a) => { const r = rot2(toLine, a); return [g.x + r[0] * d, g.z + r[1] * d]; });
    const clear = (q) => Math.min(lineGap(q[0], q[1]) - LANE - 2 * w, ...giants.filter((o) => o !== g).map((o) => Math.hypot(q[0] - o.x, q[1] - o.z) - o.w * 1.5 - 14 - 2 * w));
    const at = dealt.find((q) => clear(q) >= 0) || dealt.reduce((p0, q) => (clear(q) > clear(p0) ? q : p0));
    alones.push({ x: at[0], z: at[1], h, w, yaw, v: vs });
  }
  for (const a of alones) great.push([a.x, a.z, a.w]);
  // (and to the pyramid: dry ground under it and 40 m about its corners)
  great.push([pyr.x, pyr.z, (pyr.half * 1.42 + 35) / 0.8]);
  // THE LINE'S HEIGHT, one law along the whole of it: 5 m over brine and its shore, 8 m over dry crust 50 m and more
  // from any; the rise, the top, the way down, the level span under the leaning stone and the last way down as said above
  const base = (x, z) => 5 + 3 * smoothstep(10, 50, -poolSD(x, z));
  const heightAt = (s, x, z) => {
    const b = base(x, z); let h = lerp(b, topH, ease(sR0, sTop, s));
    h = lerp(h, F.passH, ease(sD0, sL0, s));
    return lerp(h, RING_Y, ease(sL1, FL - 100, s));
  };
  // the route: knots at even metres of that line (about every 40 m), each at the law's height
  const n = Math.round(FL / 40), route = [];
  for (let k = 0; k <= n; k++) { const s = FL * k / n; flat.posAtDist(s, v); route.push([v.x, heightAt(s, v.x, v.z), v.z]); }
  const path = makePath(route);
  // THE FAR GIANTS (stream 'tse-far'): forty of the same kind standing 1.5 to 2.6 km from the plain's middle all
  // round, beyond the last of the common needles, 350 to 400 m tall, hazed by their distance: from every place of
  // the flight (never higher than the top's 70 m, never farther than 3.4 km from one of them) the head of each
  // stands over the highest the far ranges' crests can be
  const farG = [];
  // (the pyramid stands alone: a far giant dealt within 250 m of its corners does not stand, nor one dealt in the giants' avenue; every die is drawn before those tests)
  for (let k = 0; k < 40; k++) { const a = rF.range(0, TAU), d = 1500 + 1100 * Math.sqrt(rF()), h = rF.range(350, 400), g = { x: FIELD_AT[0] + Math.cos(a) * d, z: FIELD_AT[1] + Math.sin(a) * d, h, w: h / rF.range(9, 11), yaw: rF.range(0, TAU), v: rF() };
    if (Math.hypot(g.x - pyr.x, g.z - pyr.z) >= pyr.half * 1.42 + 250 && !inGiantAve(g.x, g.z, 0.5 * g.w)) farG.push(g); }
  return { F, giants, alones, farG, pyr, path, flat, RT, sS1, sR0, sTop, sD0, sL0, sL1, sCE, sP, sLook, topH, poolSD, noise, ring: [F.ring[0], RING_Y, F.ring[1]], endDir: e, duration: Math.round(path.length / PACE * 10) / 10 };
}

export default {
  id: 'three-shadows-each',
  name: 'Three Shadows Each',
  category: 'screen',
  placeKind: 'alien',
  screen: '3 Body Problem',
  screenYear: '2024',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.75,
  async build(ctx) {
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, seedStr = String(ctx.seed);
    // every stream is made from the world's seed and a name: none draws from another
    const stream = (name) => makeRng(hashSeed(name + ':' + seedStr));
    const rLaw = stream('tse-law'), rShape = stream('tse-shape'), rHero = stream('tse-hero');
    const rLook = stream('tse-look'), rUnder = stream('tse-under');
    // (the world does not read the visit's hour: it is daylit throughout, and the law's own clock is dealt by the seed)
    const law = makeSunLaw(rLaw, rLaw.range(0, 600));
    const mood = vary.mood ?? 0.5, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const plan = layPlan(seedStr), path = plan.path, poolSD = plan.poolSD, giants = plan.giants, RING = plan.ring, END_DIR = plan.endDir, PASS = plan.F.pass, PYR = plan.pyr;
    await ctx.yield();
    // THE ROW AND THE RISING ARE TIED TO THE LAST PLACES OF THE ROUTE, and to nothing else (the brief's round seven
    // declares this one tie of the sky to places of the line). Both are pure functions of where the eye is on the
    // line, with no clock in them. Before the place where the line leaves the level top (UT) the suns keep their
    // wandering law untouched, number for number.
    // THE ROW: from the place where the line leaves the level top to come down (UT) to the place where it comes
    // level under the leaning stone (UU) the three suns leave their wandering and draw steadily into one upright row
    // over the pyramid, on its bearing from the last line: the orange one lowest and largest (2.4 degrees in
    // radius), the yellow over it (1.5), the blue-white highest and smallest (1.0): the nearest the largest. THE
    // ROW'S HEIGHTS FOLLOW THE PYRAMID'S TOP BY RULE, AND NONE IS TYPED: the lowest disc stands clear of the top
    // as the top is seen from the ring (its middle the top's height over the level, its own radius and 0.4 of a
    // degree: 23.3 degrees), and each next disc stands clear of the one under it by half a degree of sky (27.7
    // and 30.7). The row stands whole where the eye comes under the leaning stone. On one bearing, the three
    // shadows of every stone swing together into one.
    // THE RISING begins there, under the leaning stone: its measure (uRise) is the share of the way from that place
    // to the ring that the eye has flown, evenly: nought under the stone, one at the ring.
    const UT = plan.sD0 / plan.flat.length, UU = plan.sL0 / plan.flat.length, ROW_AZ = Math.atan2(END_DIR[0], -END_DIR[1]);
    // (each sun: its height in the row, its radius, how near it stands; all in degrees but the last)
    const ROW = [[0, 1.0, 0.25], [0, 1.5, 0.45], [0, 2.4, 1]];
    ROW[2][0] = Math.atan(PYR.h / PYR.away) / DEG + ROW[2][1] + 0.4; ROW[1][0] = ROW[2][0] + ROW[2][1] + ROW[1][1] + 0.5; ROW[0][0] = ROW[1][0] + ROW[1][1] + ROW[0][1] + 0.5;
    const ROW_EL = (ROW[0][0] + ROW[1][0] + ROW[2][0]) / 3 * DEG;
    const rowAt = (u) => smoothstep(UT, UU, u), riseAt = (u) => clamp((u - UU) / (1 - UU), 0, 1);
    // whether a place lies on the pyramid's own ground: inside its base's square and m metres about it
    const onPyramid = (x, z, m) => { const dx = x - PYR.x, dz = z - PYR.z; return Math.max(Math.abs(dx * PYR.dir[0] + dz * PYR.dir[1]), Math.abs(-dx * PYR.dir[1] + dz * PYR.dir[0])) < PYR.half + m; };
    // THE AVENUE: A PLACE ON THE GROUND THAT NOTHING RISES FROM AND NOTHING RISES INTO, so that the pyramid stands
    // whole between two rising curtains from the first moment of the rising to the ring. It is all the ground
    // between the last way and the pyramid's near side: every place on a straight line from a place of the last way
    // (from where the line comes level under the leaning stone to the ring) to a place of that near side, the near
    // side taken a fifth wider on each hand. Where the last way runs straight at the pyramid this is the one
    // triangle between the place under the leaning stone and the two near corners; where the way bends (it does
    // on about half of all seeds) it is that triangle and the like triangle from every later place of the way. It
    // is laid as those triangles from a place of the way every 8 m. inAvenue(x, z, m): whether a place lies in it
    // or within m metres of it (m: a thing's own reach and its greatest drift, and half a metre for the 8 m).
    const AVE = (() => {
      const v = new THREE.Vector3(), L = path.length, tips = [], mx = PYR.x - PYR.dir[0] * PYR.half, mz = PYR.z - PYR.dir[1] * PYR.half, wx = -PYR.dir[1] * PYR.half * 1.2, wz = PYR.dir[0] * PYR.half * 1.2;
      for (let s = UU * L; s < L + 8; s += 8) { path.posAtDist(Math.min(s, L), v); tips.push(v.x, v.z); }
      const box = [1e9, -1e9, 1e9, -1e9], c = [mx + wx, mz + wz, mx - wx, mz - wz];
      for (let i = 0; i < tips.length + 4; i += 2) { const x = i < tips.length ? tips[i] : c[i - tips.length], z = i < tips.length ? tips[i + 1] : c[i - tips.length + 1]; box[0] = Math.min(box[0], x); box[1] = Math.max(box[1], x); box[2] = Math.min(box[2], z); box[3] = Math.max(box[3], z); }
      return { tips, c, box };
    })();
    // metres from a place to a stretch of a straight line
    const toStretch = (x, z, ax, az, bx, bz) => { const ex = bx - ax, ez = bz - az, t = clamp(((x - ax) * ex + (z - az) * ez) / Math.max(ex * ex + ez * ez, 1e-9), 0, 1); return Math.hypot(x - ax - ex * t, z - az - ez * t); };
    const inAvenue = (x, z, m) => {
      const { tips, c, box } = AVE; m += 0.5;
      if (x < box[0] - m || x > box[1] + m || z < box[2] - m || z > box[3] + m) return false;
      for (let i = 0; i < tips.length; i += 2) {
        const ax = tips[i], az = tips[i + 1];
        const s1 = (c[0] - ax) * (z - az) - (c[1] - az) * (x - ax), s2 = (c[2] - c[0]) * (z - c[1]) - (c[3] - c[1]) * (x - c[0]), s3 = (ax - c[2]) * (z - c[3]) - (az - c[3]) * (x - c[2]);
        if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return true;
        if (toStretch(x, z, ax, az, c[0], c[1]) < m || toStretch(x, z, ax, az, c[2], c[3]) < m) return true;
      }
      return toStretch(x, z, c[0], c[1], c[2], c[3]) < m;
    };
    const sunsAt = (time, u, out) => {
      law(time, out);
      const R = rowAt(u);
      if (R > 0) for (let i = 0; i < 3; i++) {
        const o = out.sun[i], dAz = ((ROW_AZ - o.az) % TAU + TAU + Math.PI) % TAU - Math.PI, az = o.az + dAz * R, el = lerp(o.el, ROW[i][0] * DEG, R), ce = Math.cos(el);
        o.az = az; o.el = el; o.radDeg = lerp(o.radDeg, ROW[i][1], R); o.rad = o.radDeg * DEG; o.near = lerp(o.near, ROW[i][2], R);
        o.dir[0] = Math.sin(az) * ce; o.dir[1] = Math.sin(el); o.dir[2] = -Math.cos(az) * ce;
        o.up = smoothstep(-1.5 * DEG, 4.5 * DEG, el); o.flux = KINDS[i].S * Math.pow(o.radDeg, 1.6) * o.up;
      }
      return out;
    };

    // the route at even metres (every 2 m): what every clearance below is tested against
    const RT = []; { const v = new THREE.Vector3(); for (let d = 0; d <= path.length; d += 2) { path.posAtDist(d, v); RT.push(v.x, v.y, v.z); } }
    const RN = RT.length / 3;
    await ctx.yield();
    // least distance from the route's line to an upright body at (x, z), h tall and `reach` wide about its axis
    // (THE BUILD'S TIME: the point of the line that is nearest on the ground is found by squares and measured; then
    // only the points that lie no farther off on the ground than that measure and the body's reach are measured
    // too, for no other can come nearer: the same least distance, to its last digit, as a scan of every point)
    const routeGapAt = (k, x, z, h, reach) => { const dxz = Math.hypot(RT[k] - x, RT[k + 2] - z) - reach, dy = RT[k + 1] - h; return dy > 0 ? Math.hypot(Math.max(dxz, 0), dy) : dxz; };
    const routeGap = (x, z, h, reach) => {
      let q0 = 1e300, k0 = 0; for (let k = 0; k < RN * 3; k += 3) { const dx = RT[k] - x, dz = RT[k + 2] - z, q = dx * dx + dz * dz; if (q < q0) { q0 = q; k0 = k; } }
      let best = routeGapAt(k0, x, z, h, reach); const r = best + reach, lim = r * r * (1 + 1e-9);
      for (let k = 0; k < RN * 3; k += 3) { const dx = RT[k] - x, dz = RT[k + 2] - z; if (dx * dx + dz * dz <= lim) { const d = routeGapAt(k, x, z, h, reach); if (d < best) best = d; } }
      return best;
    };
    // how near the route passes (metres, the route's height counted in): decides which needles are built in detail
    // (the same way: the nearest point on the ground is measured first, and then only those that lie no farther off
    // on the ground than that measure less the line's least height)
    let RYMIN = 1e9; for (let i = 0; i < RN; i += 2) RYMIN = Math.min(RYMIN, RT[i * 3 + 1]);
    const routeNear = (x, z) => {
      let q0 = 1e300, k0 = 0; for (let k = 0; k < RN * 3; k += 6) { const dx = RT[k] - x, dz = RT[k + 2] - z, q = dx * dx + dz * dz; if (q < q0) { q0 = q; k0 = k; } }
      let best = Math.hypot(RT[k0] - x, RT[k0 + 2] - z) + RT[k0 + 1]; const r = best - RYMIN, lim = r * r * (1 + 1e-9);
      for (let k = 0; k < RN * 3; k += 6) { const dx = RT[k] - x, dz = RT[k + 2] - z; if (dx * dx + dz * dz <= lim) { const d = Math.hypot(dx, dz) + RT[k + 1]; if (d < best) best = d; } }
      return best;
    };

    // GROVES, EACH DEALT BY A STREAM OF ITS OWN (its group's name and its number in the group: tse-grove-first,
    // tse-grove-ring1, tse-grove-way7, tse-grove-plain41; THE GROVE AT A GIANT'S FOOT BY WHAT THAT GIANT IS IN THE
    // PLAN, never by its number in the list of those that stand: tse-grove-giant-tallest, -pass-toppled,
    // -pass-rest, -family and its number among the eighteen dealt, -ring and its number among the six dealt,
    // -way and its number). The stream deals that grove's own
    // measures, where they are dealt, and then every one of its candidates with all seven of its dice: so a giant
    // more or less, 40 m of route more or less or a thinner plain never deals another grove anew.
    const groves = [], grove = (name, make) => { const r = stream('tse-grove-' + name), g = make(r); if (g) { g.rng = r; groves.push(g); } };
    // a thin one about every giant's foot; the first grove (typed: the entry's own)
    giants.forEach((g) => grove('giant-' + g.who, () => ({ x: g.x, z: g.z, r: 60 + g.w, n: 9, big: 0.9 })));
    grove('first', () => ({ x: FIRST[0], z: FIRST[1], r: FIRST[2], n: FIRST[3], big: 0.8, tall: true }));
    // BY THE RING'S POOL: three or four groves (the count from the stream tse-ring), each at a bearing of its own
    // round the pool's middle, its middle 20 to 60 m outside the pool's oval there, 40 to 58 m in radius, 34 to 52
    // needles; one that would have its middle inside a giant's bare ring is not laid (every die is drawn before
    // that test). Their needles keep off the brine by the one shore law, like all others.
    { const T = plan.F.ringPool, nRing = 3 + (stream('tse-ring').chance(0.5) ? 1 : 0);
      for (let i = 0; i < nRing; i++) grove('ring' + i, (r) => {
        const a = r.range(0, TAU), out = r.range(20, 60), rad = r.range(40, 58), n = Math.round(r.range(34, 52));
        const ca = Math.cos(a), sa = Math.sin(a), rho = 1 / Math.hypot(ca / T[4], sa / T[5]) + out;
        const x = T[0] + (ca * T[2] - sa * T[3]) * rho, z = T[1] + (ca * T[3] + sa * T[2]) * rho;
        return giants.every((g) => Math.hypot(x - g.x, z - g.z) >= g.w * 1.5 + 12) ? { x, z, r: rad, n, big: 0.8, tall: true } : null;
      }); }
    // BESIDE THE ROUTE the plain is set with groves: one about every 40 m of it, to the left and the right in turn,
    // 16 to 50 m off its line, so that needles of many heights stand close on both sides and the way bends between
    // them (the lane keeps every stone 10 m and more from the line). The series begins where the line leaves the
    // first grove's rim, plus a phase of its own step that the seed deals (stream tse-under, which also deals the
    // first one's hand), and ends at the near end of the ring's pool.
    { const fv = new THREE.Vector3(); let sFirst = plan.sS1;
      for (let d = plan.sS1; d < plan.sS1 + 300; d += 2) { path.posAtDist(d, fv); if (Math.hypot(fv.x - FIRST[0], fv.z - FIRST[1]) < FIRST[2]) sFirst = d; }
      let side = rUnder.chance(0.5) ? 1 : -1, i = 0;
      for (let d = sFirst + rUnder.range(0, 40); d < path.length - 90 - plan.F.ringPool[4]; d += 40, i++) {
        const sd = side; side = -side;
        grove('way' + i, (r) => {
          const dd = d + r.range(-16, 16), pp = path.posAtDist(dd, new THREE.Vector3()), tt = path.tangentAtDist(dd, new THREE.Vector3());
          const off = r.range(16, 50) * sd, tl = Math.hypot(tt.x, tt.z) || 1;
          return { x: pp.x - (tt.z / tl) * off, z: pp.z + (tt.x / tl) * off, r: r.range(30, 48), n: Math.round(r.range(22, 38)), big: r.range(0.6, 1), tall: true };
        });
      } }
    // and those dealt by chance over the whole plain. THE PLAIN IS NO EVEN CARPET: of these groves a needle stands
    // only where the plain lies in a hollow (`hollowAt`: the plain's own slow field, hollows some 200 m across on a
    // little under half of the ground, where the frost gathers, since the frost keeps to the groves); between the
    // hollows lie open salt, the pools and the lanes of shadow. More groves are dealt than before (100 for 60), so
    // that the hollows stand full. No needle is dealt outside a grove.
    const MID = FIELD_AT, nGroves = Math.round(100 * dens), hollowAt = (x, z) => plan.noise.n2(x * 0.0026 + 41.9, z * 0.0026 + 23.3) > 0.05;
    for (let i = 0; i < nGroves; i++) grove('plain' + i, (r) => {
      const a = r.range(0, TAU), rr = 1500 * Math.pow(r(), 0.78), rad = r.range(28, 70), n = Math.round(r.range(12, 40)), big = r.range(0.25, 1);
      return { x: MID[0] + Math.cos(a) * rr, z: MID[1] + Math.sin(a) * rr, r: rad, n, big, plain: true };
    });
    const fieldData = new Uint8Array(FIELD_N * FIELD_N * 4), wet = new Float32Array(FIELD_N * FIELD_N);
    await ctx.yield();
    for (let j = 0; j < FIELD_N; j++) {
      const z = FIELD_AT[1] + ((j + 0.5) / FIELD_N * 2 - 1) * FIELD_HALF;
      for (let i = 0; i < FIELD_N; i++) {
        const x = FIELD_AT[0] + ((i + 0.5) / FIELD_N * 2 - 1) * FIELD_HALF, k = j * FIELD_N + i;
        wet[k] = clamp(0.5 + poolSD(x, z) / 60, 0, 1); fieldData[k * 4 + 3] = 255;
      }
      if (j % 4 === 3) await ctx.yield();
    }
    // THE BRINE THAT IS DRAWN LIES IN POOLS, NEVER IN PUDDLES. Of the plan's brine (which keeps every stone off it as
    // before) the ground shows only what is a pool: every place of it lies in a square of three cells of the field
    // by three (15 m by 15 m) that is brine all through by the plan. So a pool is nowhere under 15 m across, and
    // thinner arms, necks and lesser patches are not drawn. Inside a pool the field is at least what the metres to
    // its own shore give (so every pool deepens to dark brine: its middle lies 7 m and more inside); outside the
    // pools the field falls off by the metres to the nearest pool (the white crust for the last 3 m of a shore,
    // the pale bloom to 18 m out, nothing beyond) wherever the plan's own figure does not fall faster. So no wet
    // patch and no patch of salt lies alone on the plain or beside a pool, at any size under a pool's.
    { const N = FIELD_N, cell = 2 * FIELD_HALF / N, D1 = cell, D2 = cell * Math.SQRT2, pool = new Uint8Array(N * N);
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) { const c = j * N + i; let all = true;
          for (let b = -N; b <= N && all; b += N) for (let a = -1; a <= 1; a++) if (!(wet[c + b + a] > 0.5)) { all = false; break; }
          if (all) for (let b = -N; b <= N; b += N) for (let a = -1; a <= 1; a++) pool[c + b + a] = 1; }
        if (j % 32 === 31) await ctx.yield();
      }
      // metres from every cell to the nearest cell that is marked nought in `far` (two sweeps, eight neighbours)
      const sweep = async (far) => {
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) { const c = j * N + i; let d = far[c];
            if (i > 0) d = Math.min(d, far[c - 1] + D1);
            if (j > 0) { d = Math.min(d, far[c - N] + D1); if (i > 0) d = Math.min(d, far[c - N - 1] + D2); if (i < N - 1) d = Math.min(d, far[c - N + 1] + D2); }
            far[c] = d; }
          if (j % 32 === 31) await ctx.yield();
        }
        for (let j = N - 1; j >= 0; j--) {
          for (let i = N - 1; i >= 0; i--) { const c = j * N + i; let d = far[c];
            if (i < N - 1) d = Math.min(d, far[c + 1] + D1);
            if (j < N - 1) { d = Math.min(d, far[c + N] + D1); if (i < N - 1) d = Math.min(d, far[c + N + 1] + D2); if (i > 0) d = Math.min(d, far[c + N - 1] + D2); }
            far[c] = d; }
          if (j % 32 === 0) await ctx.yield();
        }
      };
      const toPool = new Float32Array(N * N), toShore = new Float32Array(N * N);
      for (let c = 0; c < N * N; c++) { toPool[c] = pool[c] ? 0 : 1e9; toShore[c] = pool[c] ? 1e9 : 0; }
      await ctx.yield(); await sweep(toPool); await sweep(toShore);
      for (let c = 0; c < N * N; c++) {
        if ((c & 32767) === 32767) await ctx.yield();
        fieldData[c * 4] = Math.round(clamp(pool[c] ? Math.max(wet[c], Math.min(0.5 + (toShore[c] - 0.5 * cell) / 60, 0.7)) : Math.min(wet[c], 0.5 - (toPool[c] - 0.5 * cell) / 60), 0, 1) * 255);
      }
    }
    const fieldTex = new THREE.DataTexture(fieldData, FIELD_N, FIELD_N, THREE.RGBAFormat);
    fieldTex.minFilter = fieldTex.magFilter = THREE.LinearFilter; fieldTex.wrapS = fieldTex.wrapT = THREE.ClampToEdgeWrapping; fieldTex.needsUpdate = true;
    await ctx.yield();

    // ------------------------------------------------------------ the hero and the needles' field
    // THE STONE'S OWN MATERIAL, one for all stone under the same three suns. bedAxis, bedFoot: the way the stone's beds
    // were laid and its foot (straight up from the ground for every standing stone; along its own length for the one
    // that has toppled, which carries its beds across its length as it lay when it stood). rise: loose stone, which
    // takes the law of the rising; clear: the metres such a thing must stand over its bed before it takes any turn.
    // pyr (the matrix that brings a place of the world into the pyramid's own axes): the pyramid's dressed stone,
    // which carries the part's law of courses and joints where the standing stone has its beds and its relief,
    // and takes the plain's light on its faces as a loose stone in the air does (it stands over the open salt).
    const stoneOf = (bedAxis, bedFoot, rise = false, clear = 0, pyr = null) => {
      const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uSunDir = U.uSunDir; sh.uniforms.uSunE = U.uSunE; sh.uniforms.uBedAxis = { value: bedAxis }; sh.uniforms.uBedFoot = { value: bedFoot };
        if (rise) { sh.uniforms.uRise = U.uRise; sh.uniforms.uTime = U.uTime; sh.uniforms.uClear = { value: clear }; }
        if (rise || pyr) { sh.uniforms.uSalt = U.uSalt; sh.uniforms.uSkyFill = U.uSkyFill; }
        if (pyr) { sh.uniforms.uPyrInv = { value: pyr }; sh.uniforms.uRowLit = U.uRowLit; }
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTseP;' + (pyr ? '\nattribute float aPyr; varying float vTsePyrK;' : '') + (rise ? RISE_HEAD : ''))
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vTseP = (instanceMatrix * vec4(position, 1.)).xyz;\n#else\n vTseP = position;\n#endif' + (pyr ? '\n vTsePyrK = aPyr;' : '') + (rise ? RISE_MOVE : ''));
        if (rise) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>' + RISE_TURN);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTseP;\nuniform vec3 uSunDir[3]; uniform vec3 uSunE[3]; uniform vec3 uBedAxis; uniform vec3 uBedFoot;\n'
          + (rise ? 'varying float vTseOpen;\n' : '') + (rise || pyr ? 'uniform vec3 uSalt; uniform vec3 uSkyFill;\n' : '') + (pyr ? 'varying float vTsePyrK; uniform mat4 uPyrInv; uniform vec2 uRowLit;\n' : '') + NOISE_GLSL)
          .replace('#include <color_fragment>', pyr ? '#include <color_fragment>' + PYRAMID_DRESS : STONE_BEDS)
          .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          // rough stone takes a low sun's light a little way round its flank: each sun rims the needles in its own hue
          { vec3 tseN = inverseTransformDirection(normal, viewMatrix);
            for (int i = 0; i < 3; i++){ float nl = dot(tseN, uSunDir[i]); reflectedLight.directDiffuse += diffuseColor.rgb * uSunE[i] * (max((nl + .42) / 1.42, 0.) - max(nl, 0.)); }` + (rise || pyr ? `
            // A LOOSE STONE THAT HAS LEFT ITS BED IS LIT FROM BELOW BY THE PLAIN AND FROM ABOVE BY THE AIR: its faces
            // take the salt's light by how far they are turned down and the air's blue by how far they are turned up
            // (the pyramid's own stone takes both at all times: it stands over the open salt)
            reflectedLight.indirectDiffuse += diffuseColor.rgb * (uSalt * (.5 - .5 * tseN.y) + uSkyFill * (.5 + .5 * tseN.y)) * ${pyr ? '1.' : 'vTseOpen'};` : '') + (pyr ? `
            // WHEN THE ROW STANDS, ITS LIGHT RUNS DOWN THE STAIR: the share of the row's light a place of the pyramid
            // takes (tseQ, by the dress: the stair, its walls and the house whole, a tier's lit edge more, above
            // the light's front only) times the three suns' light together and ROW_LIGHT. Lit stone and no more.
            reflectedLight.directDiffuse += diffuseColor.rgb * (uSunE[0] + uSunE[1] + uSunE[2]) * (${ROW_LIGHT.toFixed(2)} * tseQ);` : '') + ` }`);
        if (!pyr) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', STONE_RELIEF);
      };
      mat.customProgramCacheKey = () => 'tse-stone-18' + (rise ? '-loose' : '') + (pyr ? '-pyr' : '');
      return mat;
    };
    const stoneMat = stoneOf(new THREE.Vector3(0, 1, 0), new THREE.Vector3()), looseMat = stoneOf(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), true);
    looseMat.side = THREE.DoubleSide;   // (a heap's stone has no underside of its own: turned in the air it shows its inside as stone)
    // every loose shape carries, at each vertex, its own stone's middle and that stone's own die (aStone): a heap's
    // stones from the stream given (tse-heap-stones); a single stone or block its own middle and no die
    const stonesOf = (geo, r) => {
      const n = geo.attributes.position.count, a = new Float32Array(n * 4);
      if (r) for (const q of heapStones(geo)) { const d = r(); for (let i = q.v0; i < q.v0 + 13; i++) a.set([q.cx, q.cy, q.cz, d], i * 4); }
      else { geo.computeBoundingBox(); const c = geo.boundingBox.getCenter(new THREE.Vector3()); for (let i = 0; i < n; i++) a.set([c.x, c.y, c.z, 0], i * 4); }
      geo.setAttribute('aStone', new THREE.BufferAttribute(a, 4)); return geo;
    };
    // a loose thing's own dice for the rising (each from a stream of its own: a giant's rubble from tse-rise- and what the
    // giant is, a heap from its needle's die, a loose stone from the stream of its home's try): when it leaves
    // the ground (0 to 0.9 of the measure, the more of them the earlier: two thirds have left at 0.4), its top height
    // (80 to 340 m, the early ones highest), how fast it turns as it climbs (either way), the bearing of its axis.
    // A LOOSE THING KEEPS THE LINE'S CLEAR AIR BY ITS OWN REACH: it rises only if it lies 14 m and twelve times its
    // own reach from the line on the ground (riseLane); one that lies nearer stays where it lies.
    // FEWER PIECES IN THE AIR: OF THE HEAPS AT THE NEEDLES' FEET ONE IN TWO RISES, by a die of its own; the other
    // stays where it lies.
    // EVERY DEAL THAT A TEST CAN TURN AWAY HAS A STREAM OF ITS OWN: the four dice of a thing that rises come from its
    // own stream (a giant's rubble: tse-rise- and that giant's own name in the plan; a loose stone's: its own, see THE LOOSE STONES), and A HEAP'S FIVE
    // DICE COME FROM ITS OWN NEEDLE'S DIE (the stream tse-heap- and that die, the needle's own number from its
    // grove's stream: first the four of the rising, then whether it rises at all), as a needle's seven dice come
    // from its grove's stream: so a needle more or less never deals another heap or any stone anew.
    const HEAP_RISE = 0.5;
    const riseDiceOf = (rRise) => () => { const q = rRise(); return [0.9 * q * q, (80 + 260 * rRise()) * (1 - 0.5 * q), rRise.range(0.012, 0.05) * (rRise.chance(0.5) ? 1 : -1), rRise.range(0, TAU)]; };
    const riseLane = (reach) => 14 + 12 * reach;
    // metres on the ground from a place to the line of flight
    // (the nearest point of the line is found by squares; the answer is the least Math.hypot among the points that are as near
    // to a part in a thousand million: the same number, to its last digit, as a scan of every point)
    // (ONE PASS OVER THE LINE, THE SAME ANSWER AS TWO: the least squared metres are found, and with them every
    // place of the line that lies within a part in a thousand million of that least is kept by the way (GAPC: a place
    // so kept is dropped again only when a nearer one puts it outside that part); the answer is the least of
    // their true metres, as it was when the whole line was gone over a second time for them)
    const GAPC = new Int32Array(RN + 1);
    const lineGapFrom = (x, z, i0) => {
      let q0 = 1e300, nc = 0;
      for (let k = i0 * 3; k < RN * 3; k += 3) {
        const dx = RT[k] - x, dz = RT[k + 2] - z, q = dx * dx + dz * dz;
        if (q < q0) { if (q * (1 + 1e-9) < q0) nc = 0; q0 = q; GAPC[nc++] = k; } else if (q <= q0 * (1 + 1e-9)) GAPC[nc++] = k;
      }
      const lim = q0 * (1 + 1e-9); let best = 1e9;
      for (let c = 0; c < nc; c++) { const k = GAPC[c], dx = RT[k] - x, dz = RT[k + 2] - z; if (dx * dx + dz * dz <= lim) { const d = Math.hypot(dx, dz); if (d < best) best = d; } }
      return best;
    };
    const lineGapXZ = (x, z) => lineGapFrom(x, z, 0);
    // THE STONE IS OF ITS PLACE: two kinds of the same bedded stone, the buff and a darker grey-brown, lie over the
    // plain in districts several hundred metres across that pass into one another (the place's own noise; about a
    // third of the plain is of the darker). Every stone, small or giant, takes the kind of the ground it stands on,
    // so no stone is paler than its neighbours.
    const DARK = [0.6, 0.53, 0.54];
    const kindAt = (x, z) => smoothstep(0.1, 0.35, plan.noise.n2(x * 0.0021 + 11.3, z * 0.0021 - 4.7));
    const kindOn = (geom, x, z) => { const c = geom.attributes.color, k = kindAt(x, z), m = DARK.map((q) => lerp(1, q, k)); for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * m[0], c.getY(i) * m[1], c.getZ(i) * m[2]); };
    const hero = await buildHero(ctx, { rng: rHero, material: stoneMat, height: giants[0].h, width: giants[0].w, fused: 0 });
    hero.object.position.set(giants[0].x, 0, giants[0].z); scene.add(hero.object);
    hero.object.traverse((o) => { if (o.isMesh) kindOn(o.geometry, giants[0].x, giants[0].z); });
    await ctx.yield();
    // THE GIANTS' RUBBLE IS LOOSE STONE: every stone of every giant's heap lies in one mesh of its own, with its own
    // middle and its own dice for the rising. THE WAY UNDER THE LEANING STONE IS CLEAR: no stone of its rubble lies
    // within RUBBLE_LANE (40 m) of the line on the ground, by its own reach (the rubble is strewn toward the pass,
    // and its stones, some of them 10 m and more across, lay as near as 7 m to the line).
    const rubbles = [], RUBBLE_LANE = 40;
    const loose = (g, x, z, riseDice) => {
      kindOn(g, x, z);
      const n = g.attributes.position.count, aS = new Float32Array(n * 4), aR = new Float32Array(n * 4);
      // (a stone of the rubble that lies inside its own lane of the line stays where it lies: the great stones by the line do not rise;
      // nor does one in the avenue or within its own reach and greatest drift of it; every die is drawn before those tests)
      for (const q of heapStones(g)) { const d = riseDice(), dd = lineGapXZ(q.cx, q.cz) < riseLane(q.rad) || inAvenue(q.cx, q.cz, q.rad + 0.05 * d[1]) ? [1, 0, 0, 0] : d; for (let i = q.v0; i < q.v0 + 13; i++) { aS.set([q.cx, q.cy, q.cz, 0], i * 4); aR.set(dd, i * 4); } }
      g.setAttribute('aStone', new THREE.BufferAttribute(aS, 4)); g.setAttribute('aRise', new THREE.BufferAttribute(aR, 4)); rubbles.push(g);
    };
    hero.rubble.translate(giants[0].x, 0, giants[0].z); loose(hero.rubble, giants[0].x, giants[0].z, riseDiceOf(stream('tse-rise-' + giants[0].who)));
    // the rest of the family in one mesh. A GIANT'S STREAMS GO BY WHAT IT IS IN THE PLAN, NOT BY ITS NUMBER IN THE
    // LIST: its shape and rubble (tse-giant- and its name), its rubble's dice of rising (tse-rise- and its name)
    // and the grove at its foot; so a giant kept or turned away by a test never deals another giant anew.
    // (the toppled one in a mesh of its own, with the same stone turned as it fell: its beds lie across its own length)
    const famParts = [], famCast = [], leanParts = []; let leanMat = stoneMat;
    for (let k = 1; k < giants.length; k++) {
      const g = giants[k], gi = makeGiant(stream('tse-giant-' + g.who), { x: g.x, z: g.z, h: g.h, w: g.w, broken: !!g.blunt, leanTo: g.leanTo || null, bow: g.bow || null });
      for (const part of gi.parts) kindOn(part, g.x, g.z);
      if (g.leanTo) { leanParts.push(...gi.parts); leanMat = stoneOf(new THREE.Vector3(g.leanTo[0], g.h, g.leanTo[1]).normalize(), new THREE.Vector3(g.x, 0, g.z)); } else famParts.push(...gi.parts);
      if (g.leanTo) keepStones(gi.rubble, (q) => lineGapXZ(q.cx, q.cz) - q.rad >= RUBBLE_LANE);
      loose(gi.rubble, g.x, g.z, riseDiceOf(stream('tse-rise-' + g.who)));
      famCast.push(...gi.casters); await ctx.yield();
    }
    { const rubble = new THREE.Mesh(mergeGeoms(rubbles, [['aStone', 4], ['aRise', 4]]), looseMat); rubble.name = 'tse-rubble'; rubble.frustumCulled = false; scene.add(rubble); }
    const famGeo = mergeGeoms(famParts), fam = new THREE.Mesh(famGeo, stoneMat); fam.name = 'tse-giants'; fam.frustumCulled = false; scene.add(fam);
    { const leanMesh = new THREE.Mesh(mergeGeoms(leanParts), leanMat); leanMesh.name = 'tse-giants'; leanMesh.frustumCulled = false; scene.add(leanMesh); }
    await ctx.yield();
    // EVERY CANDIDATE'S DICE ARE DRAWN BEFORE ANY TEST, from its own grove's stream: its place, height, width, turn
    // and shape, then its seven further dice (the lean and its bearing, the kind, the cluster, its bearing and size,
    // and its place in the order of standing). A needle is six to nine and a half times as tall as wide (a small
    // one is never under a metre wide). Outside the groves no needle is dealt.
    const d7 = (r) => [r(), r(), r(), r(), r(), r(), r()];
    const cand = [];
    const aloneGap = (x, z) => { let best = 1e9; for (const a of plan.alones) best = Math.min(best, Math.hypot(x - a.x, z - a.z)); return best; };
    for (const g of groves) { await ctx.yield(); const r = g.rng; for (let k = 0; k < g.n * 3; k++) {
      const a = r.range(0, TAU), d = g.r * Math.sqrt(-Math.log(1 - r() * 0.985)) * 0.62, core = Math.exp(-d / g.r);
      const hk = r(), hr = r(), h = g.tall ? (15 + 30 * Math.pow(hk, 1.4)) * (0.9 + 0.2 * hr) : hk < 0.14 ? 5 + 5 * hr : hk < 0.8 - 0.3 * g.big * core ? 10 + 15 * hr : 25 + 20 * hr;
      cand.push({ x: g.x + Math.cos(a) * d, z: g.z + Math.sin(a) * d, h, w: clamp(h / r.range(6, 9.5), 1, 5), yaw: r.range(0, TAU), v: r(), g, d6: d7(r) });
    } }
    // THE ORDER OF STANDING is each candidate's own seventh die: where the count of needles is full, what is left
    // out is left out evenly over the whole plain, never one kind of place or one end of a list. The needles that
    // stand alone come first (dealt whole by the plan; they do not lean, carry no lesser needle and take no dice).
    cand.sort((p, q) => p.d6[6] - q.d6[6]);
    cand.unshift(...plan.alones.map((a) => ({ x: a.x, z: a.z, h: a.h, w: a.w, yaw: a.yaw, v: a.v, g: null, alone: true, d6: [1, 0, 0, 1, 0, 0, 0] })));
    await ctx.yield();
    // stone shapes: eight detailed needles for near the route, four plain ones for the middle distance, four for
    // the far plain, four heaps. Every needle ends in a point and is nowhere wider than it is lower down (the maker's law).
    const nearG = [], midG = [], farG = [], heapG = [];
    for (let i = 0; i < 8; i++) nearG.push(makeNeedleGeometry(rShape, { rings: 14, sides: 9, lumps: 12 }));
    await ctx.yield();
    for (let i = 0; i < 4; i++) midG.push(makeNeedleGeometry(rShape, { rings: 8, sides: 7, lumps: 8 }));
    for (let i = 0; i < 4; i++) farG.push(makeNeedleGeometry(rShape, { rings: 4, sides: 6, lumps: 4 }));
    for (let i = 0; i < 4; i++) heapG.push(makeHeapGeometry(rShape, { count: 5 }));
    { const rHS = stream('tse-heap-stones'); for (const g of heapG) stonesOf(g, rHS); }
    await ctx.yield();
    const needles = [], grid = new Map(), GC = 16, MAXN = Math.round((2450 + 250 * dens) * (0.55 + 0.45 * detail)), BARE = 60;
    const gkey = (x, z) => Math.floor(x / GC) * 4096 + Math.floor(z / GC);
    const crowded = (x, z, w, min) => {
      const cx = Math.floor(x / GC), cz = Math.floor(z / GC);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const l = grid.get((cx + a) * 4096 + cz + b); if (!l) continue;
        for (const n of l) if (Math.hypot(n.x - x, n.z - z) < Math.max(min, 1.5 * (n.w + w))) return true;
      }
      return false;
    };
    const put = (n) => { const k = gkey(n.x, n.z); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(n); needles.push(n); };
    for (const nd of hero.needles) put({ x: giants[0].x + nd.x, z: giants[0].z + nd.z, w: nd.w, h: nd.h, tx: nd.tipX, tz: nd.tipZ, pw: nd.pw, tipR: nd.tipR, hero: true });
    for (const nd of famCast) put({ x: nd.x, z: nd.z, w: nd.w, h: nd.h, tx: nd.tipX, tz: nd.tipZ, pw: nd.pw, tipR: nd.tipR, hero: true });
    // THE PYRAMID THROWS ITS THREE SHADOWS LIKE EVERY STONE: one more caster of the strips, as wide as its base and
    // as high as it stands, narrowing evenly to the width of the house on its terrace (the mark under nought in its
    // last number: the strip's law takes that share as it is given)
    put({ x: PYR.x, z: PYR.z, w: 2 * PYR.half, h: PYR.h, tx: 0, tz: 0, pw: 1, tipR: -PYRAMID.top / PYRAMID.half, hero: true, pyr: true });
    // ONE NEEDLE IS NOT LIKE THE NEXT: about a fifth lean (3 to 12 degrees); one in fourteen is a very thin tall one
    // (28 to 52 m, thirteen times as tall as wide); one in thirty-three stands much taller (46 to 80 m); inside a
    // grove one in six has one or two lesser needles grown into its foot and one in twelve a twin of nearly its own
    // height fused to it at the foot (a needle that stands apart from the groves stands single); the stone's kind
    // is of its place (above). No stump stands and no length lies fallen anywhere on the plain: the one fallen
    // stone of the place is the toppled giant, with one heap of rubble where it broke.
    let tested = 0;
    const tipV = new THREE.Vector3(), upV = new THREE.Vector3(0, 1, 0), tiltAx = new THREE.Vector3();
    const place = (c, x, z, w, h, yaw, vsel, lone) => {
      const D = c.d6, tilt = !c.alone && D[0] < 0.22 ? 0.05 + 0.16 * (D[0] / 0.22) : 0, ta = D[1] * TAU;
      const rn = routeNear(x, z), tier = rn < 100 ? 0 : rn < 250 ? 1 : 2, isNear = tier === 0, nv = isNear ? 8 : 4, vi = Math.floor(vsel * nv) % nv;
      const g = [nearG, midG, farG][tier][vi], reach = w * Math.max(g.userData.reach, 1.5) + h * Math.sin(tilt);
      if (c.g && c.g.plain && !hollowAt(x, z)) return false;
      let free = c.alone || aloneGap(x, z) > ALONE_R;
      // the giants stand on open salt: no common needle within a foot's width and 12 m of a giant's foot (the needles that stand alone stand at a giant's foot by the plan), none within BARE of the pass under the leaning one
      for (const gi of giants) if (Math.hypot(x - gi.x, z - gi.z) < (c.alone ? gi.w * 0.8 + reach : gi.w * 1.5 + reach + 12)) free = false;
      if (!free || (!c.alone && Math.hypot(x - PASS[0], z - PASS[1]) < BARE + reach)) return false;
      // the entry's own bare box: from 4 m before the entry to 75 m behind it and 17 m to either side, by the stone's own reach
      if (z > -4 && z < 75 + reach && Math.abs(x) < 17 + reach) return false;
      // the pyramid stands alone on open salt: no needle on its ground nor within 60 m of it
      if (onPyramid(x, z, 60 + reach)) return false;
      if (poolSD(x, z) > -(1.5 + 0.8 * w)) return false;
      if (lone && crowded(x, z, w, tier < 2 ? 9 : 5)) return false;
      if (tier < 2 && routeGap(x, z, h * 1.03, reach) < LANE) return false;
      // where the tip stands over the foot: the shape's own lean, turned by the yaw, then the needle's lean
      tipV.set(g.userData.tipX * w, h, g.userData.tipZ * w).applyAxisAngle(upV, yaw).applyAxisAngle(tiltAx.set(Math.cos(ta), 0, Math.sin(ta)), tilt);
      put({ x, z, w, h, hs: tipV.y, yaw, tilt, ta, tx: tipV.x, tz: tipV.z, pw: g.userData.pw, tipR: g.userData.tipR, alone: !!c.alone, near: isNear, tier, vi, hv: Math.floor(vsel * 977) % 4, tint: (vsel * 131.7) % 1, die: vsel });
      return true;
    };
    for (const c of cand) {
      if (needles.length >= MAXN) break;
      if (++tested % 100 === 0) await ctx.yield();
      const D = c.d6;
      if (!c.alone && D[2] > 0.97) { c.h = 46 + 34 * ((D[2] - 0.97) / 0.03); c.w = c.h / 7.5; }
      else if (!c.alone && D[2] > 0.9) { c.h = 28 + 24 * ((D[2] - 0.9) / 0.07); c.w = c.h / 13; }
      if (!place(c, c.x, c.z, c.w, c.h, c.yaw, c.v, true)) continue;
      // lesser needles grown into its foot
      if (c.g && D[3] < 0.16) for (let q = 0, nc = D[3] < 0.05 ? 2 : 1; q < nc; q++) {
        const a = D[4] * TAU + q * 2.3, w2 = c.w * (0.55 + 0.3 * D[5]), h2 = c.h * (0.45 + 0.4 * ((D[5] * 7.3 + q * 0.37) % 1)), dd = (c.w + w2) * 0.42;
        place(c, c.x + Math.cos(a) * dd, c.z + Math.sin(a) * dd, w2, h2, (D[4] * 11 + q) % TAU, (c.v * 3.7 + 0.31 * (q + 1)) % 1, false);
      }
      // a twin of nearly its own height, fused to it at the foot
      if (c.g && D[3] >= 0.16 && D[3] < 0.24) {
        const a = D[4] * TAU, w2 = c.w * (0.85 + 0.15 * D[5]), dd = (c.w + w2) * 0.36;
        place(c, c.x + Math.cos(a) * dd, c.z + Math.sin(a) * dd, w2, c.h * (0.8 + 0.17 * D[5]), (D[4] * 11) % TAU, (c.v * 3.7 + 0.31) % 1, false);
      }
    }
    await ctx.yield();
    // how thick the needles stand, blurred, into the field's second channel (frost keeps to the groves)
    { const dn = new Float32Array(FIELD_N * FIELD_N), cell = (2 * FIELD_HALF) / FIELD_N, R = 9;
      for (let q = 0; q < needles.length; q++) {
        if (q % 200 === 199) await ctx.yield();
        const n = needles[q], ci = Math.floor((n.x - FIELD_AT[0] + FIELD_HALF) / cell), cj = Math.floor((n.z - FIELD_AT[1] + FIELD_HALF) / cell);
        for (let b = -R; b <= R; b++) for (let a = -R; a <= R; a++) { const i = ci + a, j = cj + b; if (i < 0 || j < 0 || i >= FIELD_N || j >= FIELD_N) continue; dn[j * FIELD_N + i] += 0.2 * Math.exp(-(a * a + b * b) / 22); }
      }
      for (let k = 0; k < dn.length; k++) { if ((k & 32767) === 32767) await ctx.yield(); fieldData[k * 4 + 1] = Math.round(Math.min(1, dn[k]) * 255); }
      fieldTex.needsUpdate = true; }
    await ctx.yield();
    const dummy = new THREE.Object3D();
    // metres on the ground from a place to the last way of the flight (from 30 m before the place under the leaning stone, where the rising begins, to the ring)
    const LAST_I = Math.max(0, Math.floor((UU * path.length - 30) / 2));
    const lastGap = (x, z) => lineGapFrom(x, z, LAST_I);
    const instance = (geom, list, heap, name) => {
      if (!list.length) return null;
      const m = new THREE.InstancedMesh(geom, heap ? looseMat : stoneMat, list.length); m.name = name;
      // (a heap is loose stone: its own dice for the rising; one in two stays by its own die; one that lies inside
      // its lane of the last way of the flight, a heap's stone reaching half its needle's width, stays where it
      // lies, so that nothing climbs through the line; so does one that lies in the avenue or within its own reach
      // and greatest drift of it; every die is drawn before those tests)
      if (heap) { const aR = new Float32Array(list.length * 4); list.forEach((n, i) => { const rH = stream('tse-heap-' + n.die), d = riseDiceOf(rH)(), stays = rH() >= HEAP_RISE; aR.set(stays || lastGap(n.x, n.z) < riseLane(0.5 * n.w) || inAvenue(n.x, n.z, 1.7 * n.w + 0.05 * d[1]) ? [1, 0, 0, 0] : d, i * 4); }); geom.setAttribute('aRise', new THREE.InstancedBufferAttribute(aR, 4)); }
      const qy = new THREE.Quaternion();
      list.forEach((n, i) => {
        dummy.position.set(n.x, 0, n.z);
        if (heap) dummy.quaternion.setFromAxisAngle(upV, n.yaw * 1.7); else dummy.quaternion.setFromAxisAngle(tiltAx.set(Math.cos(n.ta || 0), 0, Math.sin(n.ta || 0)), n.tilt || 0).multiply(qy.setFromAxisAngle(upV, n.yaw));
        dummy.scale.set(n.w, heap ? n.w : n.h, n.w); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      });
      const tc = new THREE.Color();
      // (each stone's own tone: within a seventh of its neighbours', a little to the red or the blue; then the kind of its place)
      list.forEach((n, i) => { const q = (n.tint ?? 0.5), k = 0.93 + 0.14 * ((q * 7.3) % 1), kd = kindAt(n.x, n.z); tc.setRGB(k * (0.96 + 0.08 * q) * lerp(1, DARK[0], kd), k * (0.98 + 0.03 * q) * lerp(1, DARK[1], kd), k * (1.05 - 0.1 * q) * lerp(1, DARK[2], kd)); m.setColorAt(i, tc); });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.frustumCulled = false; scene.add(m); return m;
    };
    for (let v = 0; v < 8; v++) instance(nearG[v], needles.filter((n) => !n.hero && n.near && n.vi === v), false, 'tse-needle-near');
    await ctx.yield();
    for (let v = 0; v < 4; v++) instance(midG[v], needles.filter((n) => !n.hero && n.tier === 1 && n.vi === v), false, 'tse-needle-mid');
    for (let v = 0; v < 4; v++) instance(farG[v], needles.filter((n) => !n.hero && n.tier === 2 && n.vi === v), false, 'tse-needle-far');
    await ctx.yield();
    for (let v = 0; v < 4; v++) instance(heapG[v], needles.filter((n) => !n.hero && n.near && n.hv === v), true, 'tse-heap');
    // the far giants: the far plain's plain shapes at a giant's size (they throw no strips: no shadow of theirs reaches the plain that is flown)
    for (let v = 0; v < 4; v++) instance(farG[v], plan.farG.filter((n) => Math.floor(n.v * 4) % 4 === v).map((n) => ({ x: n.x, z: n.z, w: n.w, h: n.h, yaw: n.yaw, tint: n.v })), false, 'tse-far-giant');
    await ctx.yield();

    // ------------------------------------------------------------ THE PYRAMID: its solid (the stone's own beds are its courses) and the blocks of its upper courses, which stay on their beds
    const pyr = makePyramid(stream('tse-pyramid')), pyrYaw = Math.atan2(-PYR.dir[0], -PYR.dir[1]), pyrM = new THREE.Matrix4().makeRotationY(pyrYaw).setPosition(PYR.x, 0, PYR.z);
    pyr.solid.applyMatrix4(pyrM);
    const pyrInv = pyrM.clone().invert();
    { const m = new THREE.Mesh(pyr.solid, stoneOf(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), false, 0, pyrInv)); m.name = 'tse-pyramid'; m.frustumCulled = false; scene.add(m); }
    { const tc = new THREE.Color(), rB = stream('tse-pyramid-blocks');
      // (the blocks' own stone: the loose stone's, with the measure a block must stand clear of its bed before it
      // takes any turn: half its own width, read from its shape)
      pyr.blockGeo.computeBoundingBox(); const blockSize = pyr.blockGeo.boundingBox.getSize(new THREE.Vector3());
      const blockMat = stoneOf(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), true, 0.5 * Math.max(blockSize.x, blockSize.z), pyrInv); blockMat.side = THREE.DoubleSide;
      const lay = (geo, list) => {
        const m = new THREE.InstancedMesh(geo, blockMat, list.length), aR = new Float32Array(list.length * 4); m.name = 'tse-pyramid-block';
        list.forEach((b, i) => {
          dummy.position.set(b[0], b[1], b[2]).applyMatrix4(pyrM); dummy.quaternion.setFromAxisAngle(upV, pyrYaw); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
          const k = rB.range(0.93, 1.05); tc.setRGB(k, k * rB.range(0.98, 1.01), k * rB.range(0.96, 1.02)); m.setColorAt(i, tc);
          // THE PYRAMID STAYS WHOLE: NO STONE LEAVES IT. Its top, its house and its courses stand as built to the
          // end; what rises toward the row is the plain's own loose stone, beside the avenue. NO DICE OF RISING
          // ARE DRAWN FOR A BLOCK: the stream tse-pyramid-blocks deals each block's tone (three dice) and
          // nothing else, and every block is given the dice of a thing that stays on its bed ([1, 0, 0, 0]).
          aR.set([1, 0, 0, 0], i * 4);
        });
        stonesOf(geo, null).setAttribute('aRise', new THREE.InstancedBufferAttribute(aR, 4));
        m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.frustumCulled = false; scene.add(m);
      };
      lay(pyr.blockGeo, pyr.blocks); lay(pyr.doorGeo, [pyr.door]); }
    await ctx.yield();

    // ------------------------------------------------------------ THE LOOSE THINGS OF THE LAST PLAIN
    // HOMES BY THE LAST WAY (every loose thing that is laid for the rising lies at one): a place on the ground beside
    // a stretch of the line or of its straight run on beyond the ring toward the pyramid (s0 to s1, metres along
    // it); to either hand; evenly thick over the first 60 m from the line (so no row of them stands along it) and
    // thinning away from it to 440 m; AND NEVER WITHIN 14 M OF THE LINE ON THE GROUND, so that whatever climbs from
    // a home climbs beside the line and never through it. A home gives its place and its metres from the line. ok:
    // what the ground there must be.
    // THE TWO CURTAINS STAND ALONG THE AVENUE'S EDGES: where the avenue (or, beyond its far end, the pyramid's own
    // ground) lies beside the line, a home's metres from the line are counted from the avenue's edge on its own
    // hand and not from the line (`edge`), so the loose things lie thickest just outside the avenue and thin away
    // from it, and what rises stands close about the pyramid to either hand.
    const homeV = new THREE.Vector3(), homeT = new THREE.Vector3(), homeXZ = [0, 0];
    // the place d metres to one hand of the line at sm metres along it (beyond the ring: of its straight run on)
    const homeAt = (sm, side, d) => {
      if (sm <= path.length) { path.posAtDist(sm, homeV); path.tangentAtDist(sm, homeT); const tl = Math.hypot(homeT.x, homeT.z) || 1; homeXZ[0] = homeV.x - homeT.z / tl * d * side; homeXZ[1] = homeV.z + homeT.x / tl * d * side; }
      else { homeXZ[0] = RING[0] + END_DIR[0] * (sm - path.length) - END_DIR[1] * d * side; homeXZ[1] = RING[2] + END_DIR[1] * (sm - path.length) + END_DIR[0] * d * side; }
      return homeXZ;
    };
    // (TRIES: the most tries a home may take before the dealing gives up; typed far above any need: the beads, which
    // must find brine, take 7.5 to 15.5 tries a home on sixty seeds, every other kind under 6)
    // A HOME KEEPS THE NUMBER OF ITS TRY AMONG THE TRIES DEALT (`tries`): what lies at a home takes its own dice from a
    // stream named by that number, never by its number among the homes kept; so a home let in or turned away by a
    // test never deals the stone or the piece of another home anew.
    const TRIES = 200;
    const dealHomes = async (r, n, s0, s1, ok, least = 14, edge = null) => {
      const out = [], tries = [];
      for (let k = 0; k < n * TRIES && out.length < n * 3; k++) {
        if (k % 120 === 119) await ctx.yield();
        const sm = r.range(s0, s1), side = r.chance(0.5) ? 1 : -1, q = r(), d = (edge ? Math.max(least, edge(sm, side)) : least) + 426 * (0.3 * q + 0.7 * q * q * q);
        // (what the ground there must be is asked first, the metres to the line only of a place that passes: the
        // same homes, found with less work)
        const hq = homeAt(sm, side, d), x = hq[0], z = hq[1];
        if (ok(x, z)) { const gap = lineGapXZ(x, z); if (gap >= least) { out.push(x, z, gap); tries.push(k); } }
      }
      const kept = new Float32Array(out); kept.tries = tries; return kept;
    };
    // the avenue's edge beside the line: at every 8 m of the line, from 100 m before the place under the leaning stone
    // to the pyramid's far side, and to each hand, the first metres from the line (by sixes) that lie clear of the
    // avenue by 30 m and of the pyramid's own ground by 40 m
    const EDGE_S0 = UU * path.length - 100, EDGE_S1 = path.length + PYR.away + PYR.half, EDGE_N = Math.ceil((EDGE_S1 - EDGE_S0) / 8), edgeAt = [new Float32Array(EDGE_N + 1), new Float32Array(EDGE_N + 1)];
    for (let i = 0; i <= EDGE_N; i++) {
      if (i % 8 === 7) await ctx.yield();
      const sm = EDGE_S0 + (EDGE_S1 - EDGE_S0) * i / EDGE_N;
      for (let h = 0; h < 2; h++) { let e = 14; for (; e < 1500; e += 6) { const q = homeAt(sm, h ? 1 : -1, e); if (!onPyramid(q[0], q[1], 40) && !inAvenue(q[0], q[1], 30)) break; } edgeAt[h][i] = e; }
    }
    const aveEdge = (sm, side) => { const f = clamp((sm - EDGE_S0) / (EDGE_S1 - EDGE_S0), 0, 1) * EDGE_N, i = Math.min(EDGE_N - 1, Math.floor(f)), pr = edgeAt[side > 0 ? 1 : 0]; return Math.max(pr[i], pr[i + 1]); };
    const dryHome = (x, z) => poolSD(x, z) < -1.5 && giants.every((g) => Math.hypot(x - g.x, z - g.z) > g.w + 4) && !onPyramid(x, z, 40);
    // (no loose stone is laid in the avenue, nor within 27 m of it: the avenue's ground and its edges lie bare of loose stone)
    // AND NO EVEN SCATTER OF LOOSE STONE LIES ON THE PLAIN: a loose stone lies in a hollow, among the standing stones
    // of its groves, where they shed it (the same field as the groves'); the open salt between lies bare of it.
    const looseHome = (x, z) => hollowAt(x, z) && dryHome(x, z) && !inAvenue(x, z, 27);
    // THE LOOSE STONES (streams tse-loose-way, tse-loose-beyond, tse-loose-shapes, and one for every stone): single stones on the dry crust at such homes, a third sunk, of the stone
    // of their place, each a closed lump of twenty faces with its own dice for the rising. FEWER AND LARGER THAN
    // THEY WERE, SO THAT A RISEN STONE IS A BOULDER AND NOT A CHIP: 1,100 BY THE LAST WAY (from 100 m before the
    // place under the leaning stone to the ring) and 1,200 BEYOND THE RING, beside the avenue and on beside the
    // pyramid itself to its far side (2,300 in all: half of what lay there). They lie thickest along the
    // avenue's edges and along the pyramid's flanks (the homes' rule above). A stone's measure is one metre to 3.2 m by the line and up to three times that far
    // from it (so the far ones are seen), and never more than a sixteenth of its ground to the line less ten
    // metres: passing abeam, none stands wider than about seven degrees in the eye. A STONE HAS ROOM WHERE IT
    // LIES: its reach is never more than its ground to the flank of the nearest needle or giant (and never under
    // 0.4 m), so no standing stone grows out of a boulder. It lies as it fell, turned any way. A STONE THAT COULD
    // COME INTO THE AVENUE (within its own reach and its greatest drift of it) STAYS WHERE IT LIES; every die is
    // drawn before that test.
    // (the homes by the last way and the homes beyond the ring from a stream each, the six shapes from a third; EVERY
    // STONE'S OWN DICE (its measure, its turn, its tint, then its four of the rising) FROM A STREAM OF ITS OWN, named
    // by its call and the number of its home's try among the tries dealt: tse-loose-way-412, tse-loose-beyond-97;
    // which of the six shapes it has goes by that number too. A home let in or turned away deals no other stone anew.)
    { const rLS = stream('tse-loose-shapes'), tc = new THREE.Color();
      const hmA = await dealHomes(stream('tse-loose-way'), 1100, UU * path.length - 100, path.length, looseHome, 14, aveEdge), hmB = await dealHomes(stream('tse-loose-beyond'), 1200, path.length, path.length + PYR.away + PYR.half, looseHome, 14, aveEdge);
      const homes = []; for (const [hm, call] of [[hmA, 'tse-loose-way-'], [hmB, 'tse-loose-beyond-']]) for (let i = 0; i < hm.length; i += 3) homes.push({ x: hm[i], z: hm[i + 1], gap: hm[i + 2], n: hm.tries[i / 3], own: call + hm.tries[i / 3] });
      // metres of free ground round a place: to the flank of the nearest needle or giant (within `lim` metres; `lim` if none is so
      // near; the giants by their own list and their greater measure, not by the shapes that throw their shadows)
      const roomAt = (x, z, lim) => {
        let room = lim;
        // (the needles are asked for by the squares of their own grid that the place's `lim` reaches: the same needles as when every one was gone through)
        for (let a = Math.floor((x - lim) / GC), a1 = Math.floor((x + lim) / GC); a <= a1; a++) for (let b = Math.floor((z - lim) / GC), b1 = Math.floor((z + lim) / GC); b <= b1; b++) {
          const l = grid.get(a * 4096 + b); if (!l) continue;
          for (const n of l) { if (n.hero) continue; const dx = n.x - x, dz = n.z - z; if (dx > lim || dx < -lim || dz > lim || dz < -lim) continue; const d = Math.hypot(dx, dz) - 0.5 * n.w; if (d < room) room = d; }
        }
        for (const g of giants) { const d = Math.hypot(g.x - x, g.z - z) - g.w; if (d < room) room = d; }
        return room;
      };
      for (let v = 0; v < 6; v++) {
        const geo = makeBoulderGeometry(rLS, 20), list = homes.filter((h) => h.n % 6 === v);
        geo.computeBoundingSphere(); const reach0 = geo.boundingSphere.radius + geo.boundingSphere.center.length();
        const m = new THREE.InstancedMesh(geo, looseMat, list.length), aR = new Float32Array(list.length * 4); m.name = 'tse-loose';
        list.forEach((h, i) => {
          const rL = stream(h.own);
          const w0 = Math.min((1.0 + 2.2 * Math.pow(rL(), 2)) * (1 + Math.min(h.gap, 300) / 150), Math.max(0.4, (h.gap - 10) / 16));
          const w = Math.min(w0, Math.max(0.4, roomAt(h.x, h.z, reach0 * w0 + 3) / reach0));
          // (it lies as it fell: turned any way about any axis)
          const ax = rL.range(0, TAU), ay = rL.range(-1, 1), ar = Math.sqrt(1 - ay * ay);
          dummy.position.set(h.x, 0.2 * w, h.z); dummy.quaternion.setFromAxisAngle(tiltAx.set(Math.cos(ax) * ar, ay, Math.sin(ax) * ar), rL.range(0, TAU)); dummy.scale.set(w, w, w); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
          const k = rL.range(0.8, 1.05), kd = kindAt(h.x, h.z); tc.setRGB(k * lerp(1, DARK[0], kd), k * lerp(1, DARK[1], kd), k * lerp(1, DARK[2], kd)); m.setColorAt(i, tc);
          const d = riseDiceOf(rL)(); aR.set(inAvenue(h.x, h.z, reach0 * w + 0.05 * d[1]) ? [1, 0, 0, 0] : d, i * 4);
        });
        stonesOf(geo, null).setAttribute('aRise', new THREE.InstancedBufferAttribute(aR, 4));
        m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.frustumCulled = false; scene.add(m);
        await ctx.yield();
      } }

    // THE BRINE'S MIRROR: the 48 needles that stand tallest over brine, wherever it lies (height over the metres to the
    // nearest brine, the nearer the line of flight the sooner; the giants among them), are mirrored by the ground's own shader
    const mirList = [];
    for (const n of needles) { if (n.pyr) continue; const out = Math.max(0, -poolSD(n.x, n.z)); if (out < (n.hero ? 420 : 70)) mirList.push({ n, s: n.h / (out + 12) / (1 + routeNear(n.x, n.z) / 150) }); }
    mirList.sort((a, b) => b.s - a.s);
    const mir = [];
    for (let i = 0; i < 48; i++) { const m = mirList[i]; mir.push(m ? new THREE.Vector4(m.n.x + (m.n.tx || 0) * 0.3, m.n.z + (m.n.tz || 0) * 0.3, m.n.w * 0.5, m.n.h) : new THREE.Vector4(0, 0, 0, -1)); }
    // ------------------------------------------------------------ uniforms shared by the sky, the ground and the strips
    const v3 = () => new THREE.Vector3(), colV = (hex, k = 1) => { const c = lin(hex); return new THREE.Vector3(c[0] * k, c[1] * k, c[2] * k); };
    const ca = rLook.range(0, TAU), fa = rLook.range(0, TAU);
    // THE BRINE'S RIPPLES (stream tse-ripples): the place's wind has one bearing; six trains of ripples run within
    // an eighth of a radian of it (so none crosses another), of lengths from a quarter of a metre to 3.4 m (each
    // within a seventh of its own), each with its own phase; a train's rate is half that of free ripples of its
    // length on water (the brine is dense and calm).
    // THE RUFFLED PATCHES take their place on the ground from the same stream (two dice, drawn after the trains', so
    // no train is dealt anew) and their drift from the same wind.
    const rRip = stream('tse-ripples'), wind = rRip.range(0, TAU);
    const waves = [0.25, 0.42, 0.7, 1.2, 2.0, 3.4].map((len) => { const b = wind + rRip.range(-0.125, 0.125), k = TAU / (len * rRip.range(0.86, 1.14)); return new THREE.Vector4(Math.cos(b) * k, Math.sin(b) * k, rRip.range(0, TAU), 0.5 * Math.sqrt(9.81 * k)); });
    const ruffle = new THREE.Vector4(Math.cos(wind), Math.sin(wind), rRip.range(0, 64), rRip.range(0, 64));
    const crust = new THREE.Vector3(0.45, 0.315, 0.255).lerp(new THREE.Vector3(0.45, 0.34, 0.235), mood * 0.8);
    const U = {
      uSunDir: { value: [v3(), v3(), v3()] }, uSunDisc: { value: [v3(), v3(), v3()] }, uSunGlow: { value: [v3(), v3(), v3()] },
      uSunRad: { value: [0.05, 0.05, 0.05] }, uSunE: { value: [v3(), v3(), v3()] }, uAmb: { value: v3() },
      uSkyTint: { value: new THREE.Vector3(1, 1, 1) }, uCloudCol: { value: v3() },
      uCirrus: { value: new THREE.Vector4(Math.cos(ca), Math.sin(ca), rLook.range(0, 50), rLook.range(0, 50)) },
      uTime: { value: 0 }, uFogK: { value: 1 / lerp(6200, 4800, mood) },
      uFar: { value: new THREE.Vector4(rLook.range(0, TAU), rLook.range(0, TAU), rLook.range(0, 40), rLook.range(0, 40)) }, uHollow: { value: new THREE.Vector3(plan.F.C[0], plan.F.C[1], 2 * SPACING) },
      uMir: { value: mir }, tField: { value: fieldTex }, uField: { value: new THREE.Vector4(FIELD_AT[0], FIELD_AT[1], FIELD_HALF, HOLLOW_CELL) },
      uCrust: { value: crust }, uRim: { value: colV('#f0dccb') }, uSeam: { value: colV('#5b4038') }, uBrine: { value: new THREE.Vector3(0.016, 0.06, 0.075) },
      uFrostCol: { value: new THREE.Vector3(0.8, 0.86, 0.96) }, uCold: { value: new THREE.Vector4(0, 0, Math.cos(fa), Math.sin(fa)) },
      // the rising's measure (0 before the event, 1 at the ring) and the way to the row of the three suns (its bearing, and the mean of its three heights)
      uSalt: { value: v3() }, uSkyFill: { value: v3() }, uWave: { value: waves }, uRuf: { value: ruffle },
      // the pyramid for the brine's mirror: its middle and the way it faces; its half base, its height, the half width of its top
      uPyrAt: { value: new THREE.Vector4(PYR.x, PYR.z, PYR.dir[0], PYR.dir[1]) }, uPyrIs: { value: new THREE.Vector3(PYR.half, PYR.h, PYRAMID.top) },
      uRise: { value: 0 }, uRowLit: { value: new THREE.Vector2() }, uRowDir: { value: new THREE.Vector3(Math.sin(ROW_AZ) * Math.cos(ROW_EL), Math.sin(ROW_EL), -Math.cos(ROW_AZ) * Math.cos(ROW_EL)) },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    const groundGeo = new THREE.PlaneGeometry(13000, 13000, 40, 40); groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG }));
    ground.renderOrder = -5; ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ------------------------------------------------------------ the shadow strips: one for every needle and sun
    const NS = needles.length, aFoot = new Float32Array(NS * 4), aTip = new Float32Array(NS * 4);
    needles.forEach((n, i) => { aFoot.set([n.x, n.z, n.w, n.hs ?? n.h], i * 4); aTip.set([n.tx, n.tz, n.pw, n.tipR], i * 4); });
    const stripGeo = new THREE.InstancedBufferGeometry();
    stripGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0]), 3));
    stripGeo.setIndex([0, 1, 2, 2, 1, 3]);
    stripGeo.setAttribute('aFoot', new THREE.InstancedBufferAttribute(aFoot, 4)); stripGeo.setAttribute('aTip', new THREE.InstancedBufferAttribute(aTip, 4));
    stripGeo.instanceCount = NS;
    // THE BUFFER'S ALPHA IS THE STRIPS' LEDGER, AND IT IS ONE ON THE GROUND ALONE. For one sun at a time it keeps how
    // much of that sun's light still reaches a place, and a strip takes its light times that. Before the first sun's
    // strips it is set to nought over the whole screen (whatever was drawn before with an alpha of its own, such as
    // the ring's halo, which the kit adds to the buffer alpha and all, must not be read as light still to be taken);
    // then, before every sun's strips, to one on the ground and nowhere else: by the ground's own mesh drawn once more
    // (the same vertices by the same law, so the same depth to the last bit, and it shows only where the ground
    // itself shows). So a strip finds nothing to take on a stone, a heap or the ring, whatever row of them it reaches
    // over; and the ground's light is never taken twice. After the last strips the alpha is one over the whole screen
    // again. (Before this the first sun's shadows inside the halo's square took their light twice, and every strip
    // took the ground's light off the lowest row of the stones that stand on it: both left dots with no green or blue.)
    const stripU = [], ledgerBlend = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.ZeroFactor };
    const groundOnly = new THREE.ShaderMaterial({ uniforms: { uA: { value: 1 } }, vertexShader: GROUND_VERT, fragmentShader: RESET_FRAG, ...ledgerBlend,
      polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -2 });
    const whole = (a) => new THREE.ShaderMaterial({ uniforms: { uA: { value: a } }, vertexShader: DOME_VERT, fragmentShader: RESET_FRAG, ...ledgerBlend, side: THREE.BackSide, depthTest: false });
    const ledger = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; scene.add(m); };
    ledger(dome.geometry, whole(0), 8); ledger(groundGeo, groundOnly, 9);
    // (the strips lie in the ground's own plane and are drawn toward the eye by one dot's depth, so that they lie over the ground they are paint on)
    const STRIP_LIFT = -1;
    for (let i = 0; i < 3; i++) {
      const su = { ...U, uDir: { value: U.uSunDir.value[i] }, uE: { value: U.uSunE.value[i] }, uTanR: { value: 0.05 }, uCapFade: { value: 0 }, uShade: { value: 0.45 }, uMode: { value: 0 } };
      const mat = new THREE.ShaderMaterial({ uniforms: su, vertexShader: STRIP_VERT, fragmentShader: STRIP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendEquation: THREE.ReverseSubtractEquation, blendSrc: THREE.DstAlphaFactor, blendDst: THREE.OneFactor,
        blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        polygonOffset: true, polygonOffsetFactor: STRIP_LIFT, polygonOffsetUnits: -8 });
      const strips = new THREE.Mesh(stripGeo, mat); strips.frustumCulled = false; strips.renderOrder = 10 + i * 2; scene.add(strips); stripU.push(su);
      ledger(groundGeo, groundOnly, 11 + i * 2);
      // the same strips once more for the frost the shade keeps: added light, laid once however many shadows cross
      const fmat = new THREE.ShaderMaterial({ uniforms: { ...su, uMode: { value: 1 } }, vertexShader: STRIP_VERT, fragmentShader: STRIP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstAlphaFactor, blendDst: THREE.OneFactor,
        blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        polygonOffset: true, polygonOffsetFactor: STRIP_LIFT, polygonOffsetUnits: -8 });
      const fs = new THREE.Mesh(stripGeo, fmat); fs.frustumCulled = false; fs.renderOrder = 16 + i; scene.add(fs);
    }
    ledger(dome.geometry, whole(1), 19);
    await ctx.yield();

    // ------------------------------------------------------------ the vapour's puffs (stream 'tse-vapour': a place in its own cell of the lattice, a size, a time of its own)
    { const rVap = stream('tse-vapour'), PN = 141, cell = 2 * FIELD_HALF / PN, aPuff = new Float32Array(PN * PN * 4), PUFF_LANE = 19, laneBox = [1e9, -1e9, 1e9, -1e9];
      for (let i = 0; i < RN; i++) { laneBox[0] = Math.min(laneBox[0], RT[i * 3] - PUFF_LANE); laneBox[1] = Math.max(laneBox[1], RT[i * 3] + PUFF_LANE); laneBox[2] = Math.min(laneBox[2], RT[i * 3 + 2] - PUFF_LANE); laneBox[3] = Math.max(laneBox[3], RT[i * 3 + 2] + PUFF_LANE); }
      for (let j = 0; j < PN; j++) {
        for (let i = 0; i < PN; i++) {
          const x = FIELD_AT[0] - FIELD_HALF + (i + rVap()) * cell, z = FIELD_AT[1] - FIELD_HALF + (j + rVap()) * cell, size = rVap(), own = rVap();
          aPuff.set([x, z, x > laneBox[0] && x < laneBox[1] && z > laneBox[2] && z < laneBox[3] && lineGapXZ(x, z) < PUFF_LANE ? -1 : size, own], (j * PN + i) * 4);
        }
        if (j % 24 === 23) await ctx.yield();
      }
      const puffGeo = new THREE.InstancedBufferGeometry();
      puffGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0]), 3));
      puffGeo.setIndex([0, 1, 2, 2, 1, 3]);
      puffGeo.setAttribute('aPuff', new THREE.InstancedBufferAttribute(aPuff, 4)); puffGeo.instanceCount = PN * PN;
      const puffs = new THREE.Mesh(puffGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      puffs.frustumCulled = false; puffs.renderOrder = 30; scene.add(puffs); }
    await ctx.yield();

    // ------------------------------------------------------------ THE SMALL RISEN THINGS (the part's makeRising): THREE OF ITS FOUR KINDS
    // Plates of the crust and the frost's glitter leave dry homes; beads of brine leave homes 2 m and more inside a
    // drawn pool's shore; all by the last way (from 60 m before the place under the leaning stone) and on to 400 m
    // beyond the ring. A plate's home lies 16 m and more from the line on the ground (its half width and its drift
    // taken off, 11 m of clear air stay). NO ROPES OF BRINE: a thread of water standing straight up out of a pool
    // is a pole planted in it, a made thing, and a bead over it would make a pin; the part's fourth kind is given
    // no homes and is not built.
    const brineAt = (x, z) => { const c = 2 * FIELD_HALF / FIELD_N, i = Math.floor((x - FIELD_AT[0] + FIELD_HALF) / c), j = Math.floor((z - FIELD_AT[1] + FIELD_HALF) / c); return i < 0 || j < 0 || i >= FIELD_N || j >= FIELD_N ? 0 : fieldData[(j * FIELD_N + i) * 4] / 255; };
    let rising = null;
    // (a stream of its own for each kind's homes, by name: tse-homes-beads, tse-homes-plates, tse-homes-frost; and for
    // EVERY PIECE'S OWN DICE FROM A STREAM OF ITS OWN, named by its kind and the number of its home's try among the
    // tries dealt: tse-pieces-plates-88, tse-pieces-frost-1203, tse-pieces-beads-5)
    { const s0 = UU * path.length - 60, s1 = path.length + 400, PIECES = { 'tse-rise-plates': 'plates', 'tse-rise-glitter': 'frost', 'tse-rise-beads': 'beads', 'tse-rise-ropes': 'ropes' };
      // (none of them has a home in the avenue or within its own half width and drift of it: 4 m for a bead, 6 m for a plate,
      // 3 m for the frost; like the loose stones they lie thickest along the avenue's edges)
      const beads = await dealHomes(stream('tse-homes-beads'), 900, s0, s1, (x, z) => brineAt(x, z) > 0.535 && !inAvenue(x, z, 4), 14, aveEdge);
      const plates = await dealHomes(stream('tse-homes-plates'), 2200, s0, s1, (x, z) => dryHome(x, z) && !inAvenue(x, z, 6), 16, aveEdge), glitter = await dealHomes(stream('tse-homes-frost'), 1700, s0, s1, (x, z) => dryHome(x, z) && !inAvenue(x, z, 3), 14, aveEdge);
      await ctx.yield();
      rising = makeRising({ rng: stream('tse-rise-small'), rngOf: (name) => stream('tse-pieces-' + PIECES[name]), rngAt: (name, n) => stream('tse-pieces-' + PIECES[name] + '-' + n), U, glsl: SKY_GLSL, homes: { plates, glitter, beads } }); scene.add(rising.group); }
    await ctx.yield();

    // ------------------------------------------------------------ lights: the three suns and the sky, set from the law at every update
    const lights = [0, 1, 2].map(() => { const l = new THREE.DirectionalLight(0xffffff, Math.PI); scene.add(l); scene.add(l.target); return l; });
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1); scene.add(hemi);
    scene.fog = new THREE.FogExp2(0xffffff, U.uFogK.value);
    const st = newSunState(), st2 = newSunState(), EXPO = 1.34, lookV = new THREE.Vector3(), SKY_SHARE = [1.0, 0.8, 0.55];

    const applyLaw = (time, u) => {
      sunsAt(time, u, st);
      const rise = riseAt(u); U.uRise.value = rise;
      // THE ROW'S LIGHT ON THE PYRAMID: it is there by the row's own measure (the halo about the row and the light
      // on the house and the top of the stair gather as the three suns draw into the row), and once the row
      // stands it comes down the stair by the rising's measure: at the terrace where the eye comes level under
      // the leaning stone, at the stair's foot where the eye reaches the ring. Both are the one declared tie of
      // the sky to places of the line; no clock is in either.
      U.uRowLit.value.set(rowAt(u), rise);
      let tot = 0; for (let i = 0; i < 3; i++) tot += st.sun[i].flux;
      const gain = EXPO / (3 + tot), amb = U.uAmb.value.set(0.05, 0.075, 0.115), cloud = U.uCloudCol.value.set(0.3, 0.33, 0.38);
      const fogC = scene.fog.color.setRGB(0.62, 0.43, 0.31), bounce = hemi.groundColor.setRGB(0, 0, 0);
      let sr = amb.x, sg = amb.y, sb = amb.z, tr = 0.3, tg = 0.3, tb = 0.34;
      for (let i = 0; i < 3; i++) {
        const o = st.sun[i], k = KINDS[i], low = smoothstep(0, 0.3, o.dir[1]), e = o.flux * gain;
        const cr = k.col[0], cg = k.col[1] * lerp(0.7, 1, low), cb = k.col[2] * lerp(0.5, 1, low);
        U.uSunDir.value[i].set(o.dir[0], o.dir[1], o.dir[2]);
        const E = U.uSunE.value[i].set(cr * e, cg * e, cb * e), c = Math.max(o.dir[1], 0), w = 1.12 * c / (c + 0.12);
        sr += E.x * w; sg += E.y * w; sb += E.z * w;
        const sk = e * SKY_SHARE[i]; tr += cr * sk; tg += cg * sk; tb += cb * sk;
        U.uSunDisc.value[i].set(k.disc[0], k.disc[1] * lerp(0.7, 1, low), k.disc[2] * lerp(0.5, 1, low)).multiplyScalar(0.25 + 0.75 * o.up);
        const gl = 0.3 * o.up * (0.6 + 0.5 * o.near);
        U.uSunGlow.value[i].set(cr * gl, cg * gl, cb * gl);
        U.uSunRad.value[i] = o.rad;
        fogC.r += cr * gl * 0.12; fogC.g += cg * gl * 0.12; fogC.b += cb * gl * 0.12;
        stripU[i].uTanR.value = Math.tan(o.rad) * 0.14;
        stripU[i].uCapFade.value = smoothstep(4.5, 8, Math.cos(o.el) / Math.max(Math.sin(o.el), 1e-3));
      }
      // THE LIGHT'S BALANCE: the light that falls on level ground, summed, is pulled a little more than half way to one
      // calm warm white, so the floor keeps near its own rose-tan and yet takes the suns' colour (amber when the orange
      // sun is strongest, white under all three), while the strong colour lives in the shadows and on the lit stone. A
      // pure function of the law's state (the suns' own heights and sizes): nothing here reads where the eye stands or looks.
      const lum = (sr + sg + sb) / 3, wr = lerp(1, 1.07 * lum / sr, 0.55), wg = lerp(1, lum / sg, 0.55), wb = lerp(1, 0.9 * lum / sb, 0.55);
      // THE SKY'S STATE follows the suns that are up: the air is as blue as the white and the yellow sun make it, and
      // turns amber and dusty when only the orange one stands; it has a floor of its own light and never goes dark
      const kr = lerp(1, tr / 1.0, 0.7), kg = lerp(1, tg / 0.88, 0.55), kb = lerp(1, tb / 0.84, 0.7);
      U.uSkyTint.value.set(kr, kg, kb); fogC.r *= kr; fogC.g *= kg; fogC.b *= kb;
      amb.x *= wr; amb.y *= wg; amb.z *= wb;
      for (let i = 0; i < 3; i++) {
        const o = st.sun[i], E = U.uSunE.value[i]; E.x *= wr; E.y *= wg; E.z *= wb;
        lights[i].position.set(o.dir[0] * 900, o.dir[1] * 900, o.dir[2] * 900); lights[i].color.setRGB(E.x, E.y, E.z);
        amb.addScaledVector(E, 0.085); cloud.addScaledVector(E, 0.55);
        const s2 = (0.25 + Math.max(o.dir[1], 0)) * 0.42; bounce.r += E.x * s2 * crust.x; bounce.g += E.y * s2 * crust.y; bounce.b += E.z * s2 * crust.z;
      }
      // the cold: the ground's, from the law alone; the thaw's speed from the same half a second earlier (nothing is kept from one update to the next)
      // (as the ground lets go its frost leaves it too, as glitter: what the plain shows of the cold sinks by the rising's own measure)
      const cNow = seenCold(groundCold(law, time, st2));
      U.uCold.value.x = cNow - 0.9 * rise; U.uCold.value.y = smoothstep(0.004, 0.05, (seenCold(groundCold(law, time - 0.5, st2)) - cNow) / 0.5);
      // THE LIGHT A LOOSE STONE TAKES ONCE IT HAS LEFT ITS BED (the stone's own law brings it in over its first
      // metre off the ground). FROM BELOW, THE SALT'S: what the white salt of the plain gives off under these suns
      // (its own white times the light that falls on level ground, sun by sun as the ground's shader lays it), less
      // the share the sky's lamp already gives every stone from below. FROM ABOVE, THE AIR'S BLUE: half the blue
      // the sky itself is painted with, in the sky's own tint. Both are pure functions of the law's state.
      { let gr = amb.x, gg = amb.y, gb = amb.z;
        for (let i = 0; i < 3; i++) { const c = Math.max(st.sun[i].dir[1], 0), w = 1.12 * c / (c + 0.12), E = U.uSunE.value[i]; gr += E.x * w; gg += E.y * w; gb += E.z * w; }
        U.uSalt.value.set(Math.max(SALT_WHITE[0] * gr - bounce.r, 0), Math.max(SALT_WHITE[1] * gg - bounce.g, 0), Math.max(SALT_WHITE[2] * gb - bounce.b, 0));
        const t = U.uSkyTint.value; U.uSkyFill.value.set(0.5 * AIR_BLUE[0] * t.x, 0.5 * AIR_BLUE[1] * t.y, 0.5 * AIR_BLUE[2] * t.z); }
      hemi.color.setRGB((amb.x + 0.1) * Math.PI, (amb.y + 0.13) * Math.PI, (amb.z + 0.17) * Math.PI); bounce.multiplyScalar(Math.PI);
    };
    applyLaw(0, 0);
    // THE LOOK AT THE SUN (the design's first: a gentle pull toward whichever sun is the event, the one that is
    // swelling; the second, down at the shadow field, is set out with the pois below). Its anchor is that sun's own place in the sky by the law, a pure function of the clock: each sun counts
    // by how near it has come (the fourth power of `near`, and only while it is up), so the pull passes smoothly from
    // one sun to the next. No lift, no offset, no clamp: the gaze turns by three tenths of the angle between the ride's
    // own heading and that sun. It holds from the entry to the start of the last straight 100 m before the ring,
    // rising over the entry pool's length and falling over as many metres at its far end.
    const lookSt = newSunState();
    const look = (time, u) => {
      path.posAtDist(u * path.length, lookV); sunsAt(time, u, lookSt);
      let x = 0, y = 0, z = 0;
      for (let i = 0; i < 3; i++) { const o = lookSt.sun[i], k = o.up * (0.02 + Math.pow(o.near, 4)); x += o.dir[0] * k; y += o.dir[1] * k; z += o.dir[2] * k; }
      const l = Math.hypot(x, y, z) || 1;
      return lookV.set(lookV.x + x / l * 3000, lookV.y + y / l * 3000, lookV.z + z / l * 3000);
    };
    const lookEnd = path.length - 100, poolLen = ENTRY_POOL[4] - ENTRY_POOL[1], lookOn = LOOK_LEAD + Math.max(LOOK_ON, plan.sLook - plan.sP);

    return {
      scene, path, duration: plan.duration, counted: { candidates: cand.length, tested, needles: needles.length, full: MAXN, alone: needles.filter((n) => n.alone).length },
      camera: { fov: 54, near: 0.3, far: 6500, lookAhead: 24, sway: 0.5, bank: 0.3 },
      pois: [
        { at: look, from: 0, to: lookEnd / path.length, weight: 0.3, fade: poolLen / lookEnd, arc: true },
        // THE LOOK DOWN AT THE SHADOW FIELD (the design's second look: "on the climb, down at the shadow field"): from
        // the place where the rise begins to the place where the line comes level under the leaning stone, the gaze
        // turns half way toward the ground at the pass, so that it tips down a little over the plain of shadows
        // and frost; it lets go over the way down's own length and comes on over as many metres of the rise.
        // BOTH ITS ENDS ARE PLACES OF THE PLAN. Through the pass the eye looks along the way.
        { at: [PASS[0], 0, PASS[1]], from: plan.sR0 / plan.flat.length, to: plan.sL0 / plan.flat.length, weight: 0.5, fade: (plan.sL0 - plan.sD0) / (plan.sL0 - plan.sR0), arc: true },
        // THE LOOK AT THE PYRAMID COMES ON AS THE PAIR OF THE PASS FALLS BEHIND, BY THE METRES FLOWN BEYOND IT: it
        // begins LOOK_LEAD metres before the place under the leaning stone and is whole LOOK_ON metres beyond that
        // place (30 and 130 m, typed: the metres the eye needs for that turn at the flight's pace: the turn is
        // some sixty degrees at the most, and the way's own bend, which begins 80 m beyond the pass, swings the
        // heading the same way by up to thirty degrees a second; spread over these 160 m the gaze never turns
        // faster than twenty; under the stone itself it has turned a twelfth of the angle, five degrees at
        // the most, so through the pass the eye looks along the way), or it is whole at the plan's place sLook
        // where that is later (the first place from which the pair of the pass stands before no part of the
        // pyramid). From there to the ring the gaze turns by 85 parts in a
        // hundred of the angle toward the pyramid's top: a place of the plan and nothing else. IT HOLDS TO THE
        // RING: its window ends as many metres beyond the ring as it took to come on, so its own letting go
        // would begin at the ring itself.
        { at: [PYR.x, PYR.h, PYR.z], from: (plan.sP - LOOK_LEAD) / plan.flat.length, to: 1 + lookOn / plan.flat.length, weight: 0.85, fade: lookOn / (plan.flat.length + lookOn - plan.sP + LOOK_LEAD), arc: true },
      ],
      // (the ring begins to show what lies beyond it where the last way down to its pool begins: at the leaning stone's far edge)
      portal: { shape: 'circle', radius: 7, color: '#ffd9a8', glow: 1.1, revealDistance: Math.round(path.length - plan.sL1) },
      // (THE GRADE TAKES NOTHING DARK UNDER NOUGHT: its contrast of 1.05 pulls a fortieth off every colour, which left
      // dark warm ground, where the shadows of all three suns cross, and dark stone with red alone and no green or
      // blue. The shadows' tint gives that fortieth back in the dark and fades out toward the light, so the
      // contrast holds in the light and a shaded place keeps the sky's own colour.)
      post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#3f3f3f', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) { U.uTime.value = time; applyLaw(time, u || 0); },
      // everything build() made: every mesh of the scene gives up its geometry and its material (the dome, the ground,
      // the strips and their planes, the stone and its instance buffers, the hero), then the baked field and the shapes
      dispose() {
        scene.traverse((o) => { if (!o.isMesh) return; o.geometry.dispose(); o.material.dispose(); if (o.isInstancedMesh) o.dispose(); });
        for (const g of [...nearG, ...midG, ...farG, ...heapG, famGeo]) g.dispose();
        fieldTex.dispose(); hero.dispose(); stoneMat.dispose(); if (rising) rising.dispose();
      },
    };
  },
};
