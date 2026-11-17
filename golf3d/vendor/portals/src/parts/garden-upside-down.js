// The Garden Upside Down: the parts. THE ELM that hangs crown-down like a chandelier over the sky (buildHero), THE GRAIN
// of pollen whose one round mouth is the exit opening (buildGrain), and the one light law every material of the hanging
// country shares (gardenShared): a sun UNDERFOOT, a pale fill from below, green dusk from above, light through thin
// leaves, and the two crawling nets of water light, with the haze of the water.
//
// The elm and the grain are the same on every seed: each is dealt from a stream of its own with a fixed name.
// Nothing here reads the lens to place, hide or move a thing; shaders read the eye only for the haze, the view vector
// of a glint and the width of a thin stalk far off.
import * as THREE from 'three';
import { makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const SUN_AT = { off: 13, low: 17 }, GRAIN_K = 7 / 5;
// ------------------------------------------------------------------ the place (metres); the eye is upright, the garden hangs
export const GARDEN = {
  R: 250, RIM_Y: 18, RIM_R: 249.4,
  // the direction TOWARD the sun. THE LOW SUN STANDS BY A RULE OF THE PLACE (round five, the join 5 to 6): its
  // bearing is taken from the last straight, the heading of the join's last 60 m (the mouth's axis, -Z), turned
  // SUN_AT.off degrees to the right hand, SUN_AT.low degrees below the level: whoever flies the last straight has
  // the sun beyond the grain a little off the axis. It is under the horizon and lights from below, and it rakes:
  // every hanging thing has a lit side and a shade side. THE TWO ANGLES' REASONS: low (17): the brief's hour is
  // morning, the sun still under the level; at 17 degrees a ray that comes in just under the rim climbs
  // 250 tan 17 = 76 m across the ball's half width, to the turf of the vault's middle: the whole underside of the
  // meadow is lit, from the side and from below (lower, the middle would lie dark; higher, the light would no
  // longer rake). off (13): from the first metre of the last straight the grain's outline (body and spines, 25.2 m
  // at 79.6 m) stands 17.6 degrees about the axis; 13 to the right with 17 down is 21.3 degrees off the axis, so
  // the sun stands clear of the grain's outline by 3.7 degrees there (beside its lower right spines, never behind it)
  SUN: [Math.sin(SUN_AT.off * DEG) * Math.cos(SUN_AT.low * DEG), -Math.sin(SUN_AT.low * DEG), -Math.cos(SUN_AT.off * DEG) * Math.cos(SUN_AT.low * DEG)],
  KNOLL: { x: -58, z: -32, deep: 44, s2: 4050 },
  // the elm's crown is broad and tiered: 60 m across the entry's axis (crownR: the join sheet's figure, the crown from
  // the axis to 14 degrees right of it), 85 m along that axis (crownZ), 55 m deep from the fork down; its middle stands
  // crownDz metres from the trunk's line along the axis (toward the sun's side, south)
  ELM: { x: 30, y: 111, z: -66, trunk: 83, crownR: 30, crownZ: 42.5, crownDz: -8, crownTop: 28, crownLow: -27 },
  // THE GRAIN IS BIG (round five; the join 5 to 6: the opening's radius is 7 in place of 5): the grain and its rim
  // are GRAIN_K times their first measures ABOUT THE MOUTH'S CENTRE, which stands where it stood (x -20, y -40, in
  // the plane z -205): the body's radius, the spines, the mouth and the rim all in the one measure
  GRAIN: { x: -20, y: -40, z: -205 - 14 * GRAIN_K, body: 14 * GRAIN_K, spine: 4 * GRAIN_K, mouthR: 5 * GRAIN_K, rimR: 7.6 * GRAIN_K, keep: 32, k: GRAIN_K, tube: 9 },
};
// THE MEADOW ROLLS, BY A RULE AND A STREAM (round five): long waves of the turf and HANGING HILLOCKS, all dealt from
// the fixed stream 'garden-upside-down:the roll' (the same on every seed; nothing is typed, hollows and brows fall
// where they fall). ROLL is the rule: waves (how many), half (metres of half height), length (metres from brow to
// brow), each with a drawn bearing and phase; hills (how many shares of the round), ring (how far from the ball's
// upright axis), deep (metres a hillock hangs down), wide (its round's measure, metres). THE GATES, in metres: the
// whole roll is nought at the rim (the join's level circle stands) and nought at the elm's root (the tree hangs
// where it hung; gate: the metres over which the roll comes back); a hillock's share is left empty where its middle
// would stand within keepElm metres of the elm's trunk line (the tree hangs free against the sky) or within
// keepKnoll metres of the knoll's middle (the knoll is the one hill the line goes under).
// ONE TABLE for the processor and for every shader (gRoll below).
const ROLL = { waves: 3, half: [2.4, 4.6], length: [150, 260], hills: 8, ring: [105, 190], deep: [14, 26], wide: [26, 40], gate: 34, keepElm: 95, keepKnoll: 115 };
export const RELIEF = (() => {
  const rng = makeRng(hashSeed('garden-upside-down:the roll')), waves = [], hills = [], E = GARDEN.ELM, K = GARDEN.KNOLL;
  for (let i = 0; i < ROLL.waves; i++) { const a = rng.range(ROLL.half[0], ROLL.half[1]), k = TAU / rng.range(ROLL.length[0], ROLL.length[1]), b = rng() * TAU; waves.push([a, Math.cos(b) * k, Math.sin(b) * k, rng() * TAU]); }
  const a0 = rng() * TAU;
  for (let i = 0; i < ROLL.hills; i++) {
    const a = a0 + (i + rng.range(-0.3, 0.3)) / ROLL.hills * TAU, r = rng.range(ROLL.ring[0], ROLL.ring[1]), deep = rng.range(ROLL.deep[0], ROLL.deep[1]), wide = rng.range(ROLL.wide[0], ROLL.wide[1]), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - E.x, z - E.z) < ROLL.keepElm || Math.hypot(x - K.x, z - K.z) < ROLL.keepKnoll) continue;
    hills.push([x, z, deep, wide]);
  }
  return { waves, hills, gate: ROLL.gate };
})();
export const roll = (x, z) => {
  const E = GARDEN.ELM, q = (x * x + z * z) / (GARDEN.RIM_R * GARDEN.RIM_R); let s = 0;
  for (const [a, kx, kz, ph] of RELIEF.waves) s += a * Math.sin(x * kx + z * kz + ph);
  for (const [hx, hz, deep, wide] of RELIEF.hills) s -= deep * Math.exp(-((x - hx) ** 2 + (z - hz) ** 2) / (wide * wide));
  return s * Math.max(0, 1 - q * q) * (1 - Math.exp(-((x - E.x) ** 2 + (z - E.z) ** 2) / (RELIEF.gate * RELIEF.gate)));
};
// the vault: the height of the turf's face over (x, z); the knoll is the second term, a hill of the meadow hanging
// down; the third is the roll of the meadow
export const yg = (x, z) => {
  const K = GARDEN.KNOLL, r2 = (x * x + z * z) / (GARDEN.RIM_R * GARDEN.RIM_R);
  return GARDEN.RIM_Y + 102 * Math.sqrt(Math.max(0, 1 - r2)) - K.deep * Math.exp(-((x - K.x) ** 2 + (z - K.z) ** 2) / K.s2) + roll(x, z);
};
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// ------------------------------------------------------------------ two small textures of our own (freed in dispose)
// the net of water light: bright lines round dark cells, one tile, made once
async function netTexture(ctx, size) {
  // the pattern repeats twice across the tile each way: one quarter is worked out and laid four times
  const data = new Uint8Array(size * size * 4), t = 23.4, inten = 0.005, h = size / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < h; x++) {
      const px = (x / h) * TAU - 250, py = (y / h) * TAU - 250;
      let ix = px, iy = py, c = 1;
      for (let n = 0; n < 5; n++) {
        const tt = t * (1 - 3.5 / (n + 1));
        const nx = px + Math.cos(tt - ix) + Math.sin(tt + iy), ny = py + Math.sin(tt - iy) + Math.cos(tt + ix);
        ix = nx; iy = ny;
        c += 1 / Math.hypot(px / (Math.sin(ix + tt) / inten), py / (Math.cos(iy + tt) / inten));
      }
      c = 1.17 - Math.pow(c / 5, 1.4);
      const v = Math.round(clamp(Math.pow(Math.abs(c), 8), 0, 1) * 255);
      for (let q = 0; q < 4; q++) { const k = ((y + (q >> 1) * h) * size + x + (q & 1) * h) * 4; data[k] = data[k + 1] = data[k + 2] = v; data[k + 3] = 255; }
      if (x % 64 === 63) await ctx.yield();
    }
  }
  return dataTexture(data, size);
}
function dataTexture(data, size) {
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}
// tiling noise: R and G two cloudy sums, B fine grain, A rounded cells (pebbles, bark plates)
async function noiseTexture(ctx, size) {
  const rng = makeRng(hashSeed('garden-upside-down:noise'));
  const lat = (P) => { const a = new Float32Array(P * P); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const octs = [[lat(8), 8], [lat(16), 16], [lat(32), 32], [lat(64), 64]], octs2 = [[lat(4), 4], [lat(8), 8], [lat(16), 16], [lat(32), 32]];
  const fine = [lat(128), 128];
  const val = (L, P, u, v) => {
    const x = u * P, y = v * P, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), a = x0 % P, b = (x0 + 1) % P, c = (y0 % P) * P, d = ((y0 + 1) % P) * P;
    return lerp(lerp(L[c + a], L[c + b], sx), lerp(L[d + a], L[d + b], sx), sy);
  };
  const sum = (O, u, v) => { let s = 0, w = 0, a = 1; for (const [L, P] of O) { s += a * val(L, P, u, v); w += a; a *= 0.5; } return s / w; };
  const C = 12, cell = []; for (let i = 0; i < C * C; i++) cell.push([rng(), rng()]);
  await ctx.yield();
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, k = (y * size + x) * 4;
      data[k] = Math.round(255 * sum(octs, u, v)); data[k + 1] = Math.round(255 * sum(octs2, u, v));
      data[k + 2] = Math.round(255 * (0.6 * val(fine[0], fine[1], u, v) + 0.4 * val(octs[3][0], 64, u, v)));
      const cx = Math.floor(u * C), cy = Math.floor(v * C); let best = 9;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const q = cell[((cy + j + C) % C) * C + ((cx + i + C) % C)], dx = cx + i + q[0] - u * C, dy = cy + j + q[1] - v * C;
        best = Math.min(best, dx * dx + dy * dy);
      }
      data[k + 3] = Math.round(255 * clamp(1 - Math.sqrt(best) * 1.1, 0, 1));
      if (x % 64 === 63) await ctx.yield();
    }
  }
  return dataTexture(data, size);
}
// ------------------------------------------------------------------ the one light law
// Vertex side: the place of the fragment, and the sway every hanging thing shares (the slow tremble of the whole drop,
// in waves that cross the vault at 12 m a second, and the shudder that enters at the east rim every 14 s and crosses
// the country in 5 s). Both read the thing's own root and the world clock only.
const GV = /* glsl */`
uniform float uTime; uniform vec4 uShud;
varying vec3 vWp;
vec2 gSway(vec2 root, float ph) {
  float tr = sin(uTime * 1.1 - (root.x * .8 + root.y * .6) * .0917 + ph) * .65 + sin(uTime * .63 + root.y * .05 + ph * 1.7) * .35;
  float tl = mod(uTime + uShud.x, 14.) - (250. - root.x) * .01;
  float env = smoothstep(0., 1., tl) * (1. - smoothstep(1.4, 4.6, tl));
  return vec2(tr, env * sin(tl * 2.3));
}
`;
// the same law on the processor, for what must follow a swaying thing (a bee on a flower) and for the counts
export function swayAt(x, z, ph, time, shudPhase) {
  const tr = Math.sin(time * 1.1 - (x * 0.8 + z * 0.6) * 0.0917 + ph) * 0.65 + Math.sin(time * 0.63 + z * 0.05 + ph * 1.7) * 0.35;
  const tl = ((time + shudPhase) % 14 + 14) % 14 - (250 - x) * 0.01;
  const env = smoothstep(0, 1, tl) * (1 - smoothstep(1.4, 4.6, tl));
  return [tr, env * Math.sin(tl * 2.3)];
}
// the mist at the rim: from (metres from the ball's upright axis where it begins), low and full (the heights between
// which it comes on: it lies on the land, over the rim's level, never on the sky under it)
const MIST = { from: 226, low: 10, full: 24 };
// Fragment side: light from below, the fill, the dusk that deepens by place (under the turf, inside the elm's crown),
// light through thin things, the nets, the haze.
const fl = (v) => (Number.isInteger(v) ? v + '.' : String(v));
const GF = /* glsl */`
uniform float uTime, uFogK, uFogKLand; uniform vec3 uSun, uSunCol, uFill, uDusk, uThru, uFogLo, uFogHi, uFogSun, uFarLand, uNa, uNb, uElmR; uniform vec4 uElm;
uniform sampler2D uNet, uNoise;
uniform vec4 uPool[10], uPoolSw[10]; uniform vec3 uPoolDir;
varying vec3 vWp;
// THE POOLS OF LIGHT: a place stands in a shaft's light where it lies inside that shaft's round, measured square to
// the sun's direction from the shaft's own axis, which sways about its foot on the world clock as the shaft is
// drawn. uPool: foot and half width; uPoolSw: the sweep (radians), its period, its phase, the strength.
float gPool(vec3 p) {
  float s = 0.;
  for (int i = 0; i < 10; i++) {
    vec3 v = p - uPool[i].xyz; float along = -dot(v, uSun);
    vec3 off = v + uSun * along - uPoolDir * (along * uPoolSw[i].x * sin(uTime * 6.2831853 / uPoolSw[i].y + uPoolSw[i].z));
    s += uPoolSw[i].w * (1. - smoothstep(uPool[i].w * .4, uPool[i].w * 1.05, length(off)));
  }
  return min(s, 1.);
}
// the roll of the meadow (RELIEF's own numbers), metres; under nought the turf hangs lower there (a brow)
float gRoll(vec2 p) {
  float q = dot(p, p) / 62200.36; vec2 e = p - vec2(${fl(GARDEN.ELM.x)}, ${fl(GARDEN.ELM.z)}), h;
  float s = ${RELIEF.waves.map(([a, kx, kz, ph]) => `${fl(a)} * sin(dot(p, vec2(${fl(kx)}, ${fl(kz)})) + ${fl(ph)})`).join(' + ')};
${RELIEF.hills.map(([hx, hz, deep, wide]) => `  h = p - vec2(${fl(hx)}, ${fl(hz)}); s -= ${fl(deep)} * exp(-dot(h, h) / ${fl(wide * wide)});`).join('\n')}
  return s * max(1. - q * q, 0.) * (1. - exp(-dot(e, e) / ${fl(RELIEF.gate * RELIEF.gate)}));
}
float gYg(vec2 p) {
  vec2 k = p + vec2(58., 32.);
  return 18. + 102. * sqrt(max(1. - dot(p, p) / 62200.36, 0.)) - 44. * exp(-dot(k, k) / 4050.) + gRoll(p);
}
// two layers of bright cells, 6 to 9 m across, projected along the sun's direction, crawling on the world clock
float gNet(vec3 p) {
  vec2 q = vec2(dot(p, uNa), dot(p, uNb));
  float a = texture2D(uNet, q * .033 + uTime * vec2(.013, .008)).r;
  float b = texture2D(uNet, q.yx * .027 + vec2(.37, .11) - uTime * vec2(.007, .011)).r;
  return clamp(a + b * .8, 0., 1.4);
}
// how deep in the green dusk a place lies: 1 at the turf and in the heart of the crown, 0 in the open
float gDusk(vec3 p) {
  float turf = gYg(p.xz) - p.y;
  vec3 e = (p - uElm.xyz) / uElmR;
  return max(1. - smoothstep(0., 12., turf), 1. - smoothstep(.55, 1.05, length(e)));
}
// THE LONG SHADE OF THE ELM: paint on a face, by where the face stands. The crown (its own round, uElm and uElmR)
// stands between some places and the low sun: a place is in its shade where the straight line from it toward the sun
// passes through that round. The crown's own leaves are not asked (they have their own law of openness): the shade
// begins a third of the crown's width behind it. 1 in the sun, less in the shade.
float gSunlit(vec3 p) {
  vec3 q = (uElm.xyz - p) / uElmR, d = uSun / uElmR;
  float t = max(dot(q, d) / dot(d, d), 0.), m = length(q - d * t);
  return 1. - .8 * (1. - smoothstep(.62, 1.1, m)) * smoothstep(1.05, 1.45, length(q));
}
// alb: the thing's own colour; N: its face toward the eye (so light THROUGH a thing is seen only from its shade side); thin: how much light comes through it; ao: 0 hidden to 1 open;
// netK: how much of the nets it takes
vec3 gShade(vec3 alb, vec3 N, float thin, float ao, float netK) {
  float nl = dot(N, uSun), down = .5 - .5 * N.y, dusk = gDusk(vWp);
  float turf = gYg(vWp.xz) - vWp.y;
  // THE LOW SUN REACHES IN UNDER THE TURF ONLY SO FAR: its light comes in from the side through all that hangs,
  // so a place takes less of it the nearer it is to the turf (full from 30 m under the turf, three tenths at it).
  // THE ROLL OF THE MEADOW: what hangs from a brow (the turf lower than the vault's even round) stands out into the
  // low light and takes more of it; what hangs in a hollow takes less and lies in the blue-green shade. By the
  // face's own place; only within 70 m of the turf (the elm's crown and the grain are not asked).
  float brow = clamp(-gRoll(vWp.xz) / 8., -1., 1.) * (1. - smoothstep(30., 70., turf));
  // WHERE A SHAFT STANDS the low sun reaches right up to the turf, and stronger: a pool of gold light
  float pool = gPool(vWp);
  float sun = mix(gSunlit(vWp) * mix(.3, 1., smoothstep(2., 30., turf)) * (1. + .5 * brow), 2.1, pool);
  float net = gNet(vWp) * mix(.15, .55, smoothstep(-.25, .35, nl)) * netK * smoothstep(0., 4., turf);
  // the fill: pale sky from below, green dusk from above; the side of a thing that is turned from the sun takes less
  // of the sky's fill, so that its shade is plainly darker and green-blue
  vec3 fill = mix(uDusk * (1. + .55 * dusk), uFill * (1. - .45 * dusk), down) * mix(.62, 1., smoothstep(-.6, .5, nl)) * (1. + .22 * brow);
  vec3 c = alb * (uSunCol * max(nl, 0.) * ao * sun * (1. + 1.4 * net) + fill * (.4 + .6 * ao) + uSunCol * net * .12 * ao * sun);
  // light THROUGH a thin thing whose far side faces the sun: it glows young yellow-green, up to 1.6 times its lit colour
  c += uThru * (alb.g * 1.4) * thin * max(-nl, 0.) * ao * sun * (1. + .9 * net) * (uSunCol.g * .58);
  // in a pool the light is scattered among all that hangs: every face takes some of it, gold-green
  c += alb * vec3(1.3, 1., .38) * (pool * (.5 + .4 * ao));
  // a lit thing is never a lamp: the sum bends over softly near white (the glows named are added after this law)
  float top = max(c.r, max(c.g, c.b));
  return c / (1. + max(top - .8, 0.) * .75);
}
// the haze of the water, warm BY PLACE: pale gold where the sight line runs toward the sun, blue away from it
vec3 gHaze(vec3 dir, float y) {
  float tow = clamp(dot(dir, uSun), 0., 1.);
  return mix(mix(uFogLo, uFogHi, smoothstep(0., 20., y)), uFogSun, tow * tow * tow * tow * tow * tow * .5);
}
// THE LAND STANDS BACK IN ITS OWN HAZE (round five), by where a thing stands: what hangs from the vault (over the
// rim's level) fades with its distance in a thicker haze than the open sky under it, so the far meadow, its
// hillocks and its far trees are paler and bluer plane behind plane; and AT THE RIM STANDS A MIST: within
// ${fl(GARDEN.RIM_R - MIST.from)} m of the rim's circle everything of the land goes into the pale mist the sky has at the level, wholly at the
// rim itself. The mist is a place of the world (the round of the rim, over the level): nothing asks where the eye is.
float gMist(vec3 p) { return smoothstep(${fl(MIST.from)}, ${fl(GARDEN.RIM_R)}, length(p.xz)) * smoothstep(${fl(MIST.low)}, ${fl(MIST.full)}, p.y); }
vec3 gFog(vec3 c) {
  vec3 v = vWp - cameraPosition; float d = length(v), land = smoothstep(${fl(MIST.low)}, ${fl(MIST.full + 12)}, vWp.y), k = mix(uFogK, uFogKLand, land);
  float f = 1. - exp(-pow(d * k, 2.)), m = gMist(vWp);
  // THE FAR MEADOW HAS ITS OWN SOFT FAR COLOUR (round six): what hangs from the vault fades, with its distance and
  // in the rim's mist, into a blue green (uFarLand: the meadow's own green gone into the air), never into the pale
  // of the sky: the land's edge meets the sky as land
  vec3 far = mix(gHaze(v / max(d, 1e-3), vWp.y), uFarLand, land * .78);
  return mix(c, far, 1. - (1. - f) * (1. - m * m * .9));
}
`;
// The shared uniforms (one object each, so the clock is set once), the two chunks and the textures.
export async function gardenShared(ctx, opts = {}) {
  const S = new THREE.Vector3().fromArray(GARDEN.SUN);
  const na = new THREE.Vector3().crossVectors(S, new THREE.Vector3(1, 0, 0)).normalize(), nb = new THREE.Vector3().crossVectors(S, na).normalize();
  const net = await netTexture(ctx, 256); await ctx.yield();
  const noise = await noiseTexture(ctx, 256); await ctx.yield();
  const E = GARDEN.ELM, col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const U = {
    uTime: { value: 0 }, uShud: { value: new THREE.Vector4(opts.shudPhase ?? 0, opts.shudBlade ?? 0.07, opts.shudElm ?? 0.017, 0) },
    uSun: { value: S }, uSunCol: { value: col(opts.sun ?? '#FFE6A8', opts.sunK ?? 1.9) },
    uFill: { value: col('#BFDDF6', 0.6) }, uDusk: { value: col('#1F5A46', 0.33) }, uThru: { value: col('#B9EE7C', 1) },
    uFogLo: { value: col(opts.haze ?? '#7DB6F0', 0.74) }, uFogHi: { value: col('#A8CCEA', 0.78) }, uFogSun: { value: col(opts.hazeSun ?? '#FFE9B4', 0.95) }, uFarLand: { value: col('#7FB3A6', 0.75) }, uFogK: { value: 0.0016 }, uFogKLand: { value: 0.002 },
    uNa: { value: na }, uNb: { value: nb }, uNet: { value: net }, uNoise: { value: noise },
    uElm: { value: new THREE.Vector4(E.x, (E.crownTop + E.crownLow) / 2, E.z + E.crownDz, E.crownR) },
    uElmR: { value: new THREE.Vector3(E.crownR, (E.crownTop - E.crownLow) / 2 + 1, E.crownZ) },
    // the pools of light: set by the world from its own shafts (ten places; an unused one has no strength)
    uPool: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 1)) }, uPoolSw: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 1, 0, 0)) },
    uPoolDir: { value: new THREE.Vector3().crossVectors(new THREE.Vector3().crossVectors(S, new THREE.Vector3(0, 1, 0)).normalize(), S).negate() },
  };
  return { U, GV, GF, sun: S, net, noise, dispose() { net.dispose(); noise.dispose(); } };
}
// ------------------------------------------------------------------ motes: pollen, seeds, the grain's dust (a MEDIUM)
// Each mote has a place of its own in the world and rises there on the world clock inside a span of its own, wrapping
// with a fade at both ends. A mote's size is in METRES at every distance. A gold mote is a medium: it thins to
// nothing only close to the lens (opacity by true distance from 2.5 m down to 0.6 m, no step). A parachute seed
// (kind 1) and every mote of a mesh made with opts.body (leaves, petals) is a BODY: its world keeps its whole column
// off the line by place, and it does not thin toward the eye.
// list rows: [x, y, z, rise m/s, phase 0..1, size m, span m, kind (0 gold mote, 1 parachute seed)]
// opts.leaf: every mote of the mesh is a leaf (an oval that turns as it goes), in opts.color
export function moteMesh(shared, list, opts = {}) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const n = list.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4);
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  list.forEach((m, i) => {
    a.set([m[0], m[1], m[2], m[3]], i * 4); b.set([m[4], m[5], m[6], m[7]], i * 4);
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], m[k]); hi[k] = Math.max(hi[k], m[k] + (k === 1 ? m[6] : 0)); }
  });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(b, 4));
  g.instanceCount = n;
  const c = new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2);
  g.boundingSphere = new THREE.Sphere(c, Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + 4);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uGold: { value: new THREE.Color(opts.color ?? '#F2B63A').multiplyScalar(opts.glow ?? 1.6) }, uLeaf: { value: opts.leaf ? 1 : 0 }, uBody: { value: opts.body ? 1 : 0 } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime, uLeaf, uBody; attribute vec4 iA, iB; varying vec2 vQ; varying vec3 vWp; varying float vFade, vKind, vSpin;
      void main() {
        vSpin = iB.x * 37. + uTime * (.5 + iB.x) * uLeaf;
        float k = fract(iB.x + uTime * iA.w / max(iB.z, 1.));
        vec3 p = iA.xyz + vec3(sin(uTime * .7 + iB.x * 40.) * .4, k * iB.z, cos(uTime * .5 + iB.x * 23.) * .4);
        vec4 wp = modelMatrix * vec4(p, 1.);
        vec4 mv = viewMatrix * wp;
        float d = length(mv.xyz);
        mv.xy += position.xy * iB.y;
        vQ = position.xy; vWp = wp.xyz; vKind = iB.w;
        vFade = mix(smoothstep(.6, 2.5, d), 1., max(step(.5, iB.w), uBody)) * smoothstep(0., .08, k) * (1. - smoothstep(.92, 1., k));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold, uFogLo; uniform float uFogK, uLeaf; varying vec2 vQ; varying vec3 vWp; varying float vFade, vKind, vSpin;
      void main() {
        float r = length(vQ), cs = cos(vSpin), sn = sin(vSpin);
        // a leaf: a pointed oval seen flat or edge on as it turns
        vec2 lq = vec2(vQ.x * cs - vQ.y * sn, (vQ.x * sn + vQ.y * cs) * (1.6 + 1.2 * sin(vSpin * .7)));
        float leaf = 1. - smoothstep(.7, 1., length(lq) + abs(lq.x) * .25);
        // a round mote; a seed is a soft tuft of down with a pale heart
        float tuft = (1. - smoothstep(0., 1., r)) * .55 + (1. - smoothstep(0., .3, r)) * .4;
        float a = mix(mix(1. - smoothstep(.35, 1., r), tuft, vKind), leaf, uLeaf) * vFade;
        if (a < .01) discard;
        vec3 c = mix(uGold, vec3(1.25, 1.22, 1.1), vKind);
        float f = 1. - exp(-pow(distance(vWp, cameraPosition) * uFogK, 2.));
        gl_FragColor = vec4(mix(c, uFogLo, f), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 6;
  return mesh;
}
// ------------------------------------------------------------------ THE GRAIN of pollen: the thing round the exit opening
// Origin at the ball's centre, the mouth facing +Z. Inside radius 5 of the axis nothing is built: the wall is open
// there and the rim's inner edge is the opening's edge. The grain never turns, drifts, bobs or breathes: no vertex of
// body, rim or wart moves; only light moves, and spine tips flex by 0.1 m at most.
const GRAIN_FIXED = 'garden-upside-down:the grain';
// a unit direction from the polar angle th (from +Z) and the azimuth ph about Z
const dirOf = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
// scattered places on a ball, no two nearer than sep (an angle), by dart throwing from a seeded stream
async function scatterOnBall(ctx, rng, count, sep, thMin, thMax, taken = []) {
  const out = [], cs = Math.cos(sep);
  for (let tries = 0; out.length < count && tries < count * 60; tries++) {
    if (tries % 12 === 11) await ctx.yield();
    const z = lerp(Math.cos(thMax), Math.cos(thMin), rng()), ph = rng() * TAU, s = Math.sqrt(Math.max(0, 1 - z * z));
    const d = [s * Math.cos(ph), s * Math.sin(ph), z];
    let ok = true;
    for (const o of out) if (o[0] * d[0] + o[1] * d[1] + o[2] * d[2] > cs) { ok = false; break; }
    if (ok) for (const o of taken) if (o.d[0] * d[0] + o.d[1] * d[1] + o.d[2] * d[2] > Math.cos(o.keep)) { ok = false; break; }
    if (ok) out.push(d);
  }
  return out;
}
// the body: a ball lathed about Z from the rim's foot to the back pole, a little lumpy (a still shape)
async function grainBody(ctx, R, thOpen, rng) {
  const NU = 64, NV = 46, pos = [], nor = [], idx = [];
  const lump = []; for (let i = 0; i < 9; i++) lump.push([rng.range(1.5, 4), rng() * TAU, rng.range(1.5, 4), rng() * TAU]);
  const rad = (th, ph) => { let s = 0; for (const l of lump) s += Math.sin(th * l[0] + l[1]) * Math.sin(ph * Math.round(l[2]) + l[3]); return R * (1 + 0.006 * s * smoothstep(thOpen, thOpen + 0.5, th)); };
  for (let j = 0; j <= NV; j++) {
    const th = lerp(thOpen, Math.PI, j / NV);
    for (let i = 0; i <= NU; i++) { const ph = i / NU * TAU, d = dirOf(th, ph), r = rad(th, ph); pos.push(d[0] * r, d[1] * r, d[2] * r); nor.push(d[0], d[1], d[2]); }
    if (j % 4 === 3) await ctx.yield();
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
// the rim: a thick raised lip like the lip of a jar, lathed about Z. Profile (radius, z) in the grain's first
// measures, times GRAIN.k: the throat at radius 5.0,
// the foremost face in the plane z = front from the inner edge outward, a round shoulder, down into the ball.
function grainRim(front, R) {
  const zOn = (r) => Math.sqrt(R * R - r * r);
  const k = GARDEN.GRAIN.k, prof = [[5.02, 3.4], [5.02, 0.22], [5.07, 0.07], [5.2, 0], [6.75, 0], [7.2, 0.12], [7.5, 0.45], [7.6, 0.95], [7.56, 1.5]].map(([r, back]) => [r * k, front - back * k]);
  prof.push([7.42 * k, zOn(7.42 * k) + 0.1 * k], [7.25 * k, zOn(7.25 * k) - 0.35 * k]);
  const NU = 72, pos = [], idx = [], n = prof.length;
  for (let j = 0; j < n; j++) for (let i = 0; i <= NU; i++) { const ph = i / NU * TAU; pos.push(prof[j][0] * Math.cos(ph), prof[j][0] * Math.sin(ph), prof[j][1]); }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  // faceted where the profile turns sharply, smooth round the lathe: split by profile ring
  const flat = g.toNonIndexed(); flat.computeVertexNormals();
  const p = flat.attributes.position, nm = flat.attributes.normal;
  // smooth the normals round the axis: every vertex takes the normal of its profile segment turned to its own azimuth
  for (let i = 0; i < p.count; i += 3) {
    for (let k = 0; k < 3; k++) {
      const x = p.getX(i + k), y = p.getY(i + k), r = Math.hypot(x, y) || 1, nx = nm.getX(i + k), ny = nm.getY(i + k), nr = Math.hypot(nx, ny);
      const sign = (nx * x + ny * y) >= 0 ? 1 : -1;
      nm.setXYZ(i + k, sign * nr * x / r, sign * nr * y / r, nm.getZ(i + k));
    }
  }
  return flat;
}
// one spine: a bent cone along +Y, its foot at the origin; aTip runs 0 at the foot to 1 at the tip
function spineGeometry() {
  const NU = 7, NV = 4, pos = [], nor = [], tip = [], idx = [];
  for (let j = 0; j <= NV; j++) {
    const t = j / NV, r = 0.5 * Math.pow(1 - t, 0.8) * (1 + 0.5 * Math.exp(-t * 9)) + 0.015, bend = 0.09 * t * t;
    for (let i = 0; i <= NU; i++) { const a = i / NU * TAU; pos.push(Math.cos(a) * r + bend, t, Math.sin(a) * r); nor.push(Math.cos(a), 0.14, Math.sin(a)); tip.push(t); }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1)); g.setIndex(idx);
  return g;
}
// one wart: a low round dome on +Y
function wartGeometry() {
  const g = new THREE.SphereGeometry(1, 6, 2, 0, TAU, 0, Math.PI / 2); g.deleteAttribute('uv');
  return g;
}
// a frame whose +Y is the direction d, rolled by roll about it
function frameOn(d, roll, out = new THREE.Quaternion()) {
  out.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d[0], d[1], d[2]));
  return out.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roll));
}
const GRAIN_VERT = /* glsl */`
attribute float aTip; uniform float uFlex; uniform vec3 uPh;
varying vec3 vLp, vN; varying float vTip, vSpark;
void main() {
  vec4 lp = vec4(position, 1.); vec3 n = normal; vTip = aTip; vSpark = 0.;
  #ifdef USE_INSTANCING
    // THE TIPS SPARKLE IN TURN: each spine has a beat of its own on the world clock (its foot's place gives the beat
    // and the moment); for a short while in every beat its tip flashes
    float beat = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    vSpark = pow(max(sin(uTime * (.55 + .5 * beat) + beat * 61.), 0.), 28.);
    // spine tips flex a little on the world clock (0.1 m at most); bodies, rim and warts have uFlex 0
    lp.xz += uFlex * aTip * aTip * vec2(sin(uTime * 1.7 + uPh.y + instanceMatrix[3].x), cos(uTime * 1.3 + uPh.z + instanceMatrix[3].y)) / max(length(instanceMatrix[0].xyz), .2);
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vLp = lp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vec4 wp = modelMatrix * lp; vWp = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GRAIN_FRAG = /* glsl */`
uniform vec3 uGold, uAmber, uPale, uPh; uniform float uKind, uGlint; uniform vec4 uFur[12];
varying vec3 vLp, vN; varying float vTip, vSpark;
float rindH(vec3 p, vec3 n, float s) {
  vec3 w = n * n;
  vec4 a = texture2D(uNoise, p.yz * s), b = texture2D(uNoise, p.zx * s), c = texture2D(uNoise, p.xy * s);
  vec4 m = a * w.x + b * w.y + c * w.z;
  return m.a * .65 + m.b * .35;
}
vec3 bump(vec3 N, float h, float k) {
  vec3 dpx = dFdx(vWp), dpy = dFdy(vWp); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 g = sign(det) * (hx * r1 + hy * r2);
  return normalize(abs(det) * N - k * g);
}
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWp);
  if (!gl_FrontFacing) N = -N;
  vec3 ln = normalize(vLp);
  // the pebbled rind: grains of a tenth to a third of a metre, and a slower mottle
  float h = rindH(vLp, abs(ln), .24), mott = rindH(vLp, abs(ln), .05);
  // the fine grain fades by ITS OWN WIDTH AS DRAWN (how many metres of the rind one drawn point spans), never
  // by how far the eye is; the slow mottle is always felt
  float span = fwidth(vLp.x) + fwidth(vLp.y) + fwidth(vLp.z);
  vec3 Nb = bump(N, h, (uKind > 1.5 ? .012 : .04) * (1. - smoothstep(.08, .32, span)));
  Nb = bump(Nb, mott, uKind > 1.5 ? .05 : .32);
  // furrows: a few shallow grooves from the back toward the mouth, each on a wandering meridian of its own
  float th = acos(clamp(ln.z, -1., 1.)), ph = atan(ln.y, ln.x + 1e-5), rs = 14. * sin(th), fur = 0.;
  for (int i = 0; i < 12; i++) {
    vec4 f = uFur[i];
    float dd = abs(mod(ph - f.x - f.y * sin(th * f.z + f.w) + 3.14159265, 6.2831853) - 3.14159265) * rs;
    fur = max(fur, (1. - smoothstep(.07, .3, dd)) * step(.5, f.y + 1.));
  }
  fur *= smoothstep(.72, .98, th) * (1. - smoothstep(2.72, 2.95, th)) * step(uKind, .5);
  vec3 alb = uGold * mix(.74, 1.12, h) * mix(.86, 1.08, mott);
  alb = mix(alb, alb * vec3(.5, .36, .22), fur * .85);
  float ao = 1. - .45 * fur;
  if (uKind > .5 && uKind < 1.5) ao *= mix(.55, 1., smoothstep(0., .22, length(vLp) - ${(14 * GRAIN_K).toFixed(2)}));
  // spines: pale gold, half clear toward the tip
  float tip = uKind > 1.5 ? vTip : 0.;
  alb = mix(alb, uPale, tip * .8 * mix(.35, 1., smoothstep(-.2, .5, dot(N, uSun))));
  // the lip of the mouth is round like the lip of a jar: its face turns outward from its crown line (a fifth of the mouth's radius outside the opening)
  if (uKind > 2.5) { float rr = length(vLp.xy); Nb = normalize(Nb + vec3(vLp.xy / max(rr, .01), 0.) * clamp((rr - ${(5.95 * GRAIN_K).toFixed(2)}) / ${(0.9 * GRAIN_K).toFixed(2)}, -1., 1.) * .9); }
  // LIT FROM ONE SIDE by the low sun: the side toward it is bright gold, the side away from it a deep amber (the
  // sky's fill hardly tells there; the light that soaks into the wall is the grain's own amber on every side)
  float nl = dot(Nb, uSun), lit = smoothstep(-.2, .5, nl);
  vec3 c = gShade(alb, Nb, 0., ao, 1.) * mix(.24, .74, lit);
  c += uAmber * mix(.75, 1.1, h) * mix(.5, .3, lit) * ao;
  c += uSunCol * pow(max(dot(Nb, normalize(uSun + V)), 0.), 22.) * .35 * ao * step(0., nl);
  // spine tips: clear gold that catches the light, and a glint that runs over the ball in a slow wave
  float rim = pow(max(1. - abs(dot(N, V)), 0.), 2.);
  float wave = pow(.5 + .5 * sin(uTime * 1.25 + uPh.x - dot(ln, vec3(.6, .5, .62)) * 5.5), 6.);
  c += uPale * tip * tip * (.6 + 1.2 * rim + uGlint * wave * smoothstep(.55, 1., tip)) * mix(.16, 1., lit);
  c += vec3(1., .86, .5) * vSpark * smoothstep(.6, 1., tip) * (1.2 + 2.6 * lit);
  // THE LOW SUN STANDS BEYOND THE GRAIN: seen against it (the sight from this place of the rind running toward the
  // sun) the outline burns gold, the spines most of all, for they are half clear and the light comes through them
  float against = pow(max(dot(-V, uSun), 0.), 3.);
  c += vec3(1., .74, .26) * against * (rim * rim * (.5 + 2.2 * tip) + tip * tip * .9) * ao;
  // the lip of the mouth takes the light: a ring of pale gold round the dark opening (its own lit face, no card);
  // THE INNER LIP IS A LIT DOORWAY: the lip is thin, and on the arc where the sun stands behind its wall (the sun's
  // side and under) the light comes through it, gold, strongest at the throat
  if (uKind > 2.5) {
    float rr = length(vLp.xy), arc = dot(vLp.xy / max(rr, .01), normalize(uSun.xy + 1e-4));
    c += uPale * (.2 + .45 * rim) + vec3(1., .7, .22) * smoothstep(-.25, .75, arc) * (1. - smoothstep(${(5.2 * GRAIN_K).toFixed(2)}, ${(6.6 * GRAIN_K).toFixed(2)}, rr)) * 1.25;
  }
  gl_FragColor = vec4(gFog(c), 1.);
}`;
export async function buildGrain(ctx, opts = {}) {
  const G = GARDEN.GRAIN, R = G.body, own = !opts.shared, shared = opts.shared || await gardenShared(ctx, opts);
  const rng = makeRng(hashSeed(GRAIN_FIXED)), rBody = rng.fork('body'), rSpine = rng.fork('spines'), rWart = rng.fork('warts'), rFur = rng.fork('furrows'), rDust = rng.fork('dust');
  await ctx.yield();
  const object = new THREE.Group(); object.name = 'the grain';
  const front = R, K = G.k, thOpen = Math.asin(7.3 * K / R);
  // the phases of the grain's own clocks (the glint's wave, the two swings of the spines' tips), drawn once from a
  // fixed stream by name: the grain is the join's and the same on every seed
  const rClock = makeRng(hashSeed(GRAIN_FIXED + ':clock')), clockPh = new THREE.Vector3(rClock() * TAU, rClock() * TAU, rClock() * TAU);
  const fur = [];
  const nFur = 11;
  for (let i = 0; i < 12; i++) fur.push(i < nFur ? new THREE.Vector4((i + rFur.range(-0.32, 0.32)) / nFur * TAU, rFur.range(0.05, 0.16), rFur.range(1.5, 3.5), rFur() * TAU) : new THREE.Vector4(0, -2, 0, 0));
  const mat = (kind, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uGold: { value: new THREE.Color('#E9B32A') }, uAmber: { value: new THREE.Color('#8A5A14').multiplyScalar(0.9) }, uPale: { value: new THREE.Color('#FFE9A6') },
      uKind: { value: kind }, uGlint: { value: kind === 2 ? 2.2 : 0 }, uFlex: { value: kind === 2 ? 0.1 : 0 }, uFur: { value: fur }, uPh: { value: clockPh } },
    vertexShader: shared.GV + GRAIN_VERT, fragmentShader: shared.GF + GRAIN_FRAG, ...extra,
  });
  await ctx.yield();
  const body = new THREE.Mesh(await grainBody(ctx, R, thOpen, rBody), mat(0)); body.name = 'grain body'; object.add(body);
  await ctx.yield();
  const rimGeo = grainRim(front, R);
  await ctx.yield();
  const rim = new THREE.Mesh(rimGeo, mat(3, { side: THREE.DoubleSide })); rim.name = 'grain rim'; object.add(rim);
  await ctx.yield();
  // the spines: none within G.keep degrees of the mouth's axis; the first ring leans outward like a crown
  const keep = G.keep * Math.PI / 180, spines = [];
  const nRing = 15;
  for (let i = 0; i < nRing; i++) {
    const ph = (i + rSpine.range(-0.3, 0.3)) / nRing * TAU, th = keep + rSpine.range(0.035, 0.1), lean = rSpine.range(0.2, 0.34);
    spines.push({ d: dirOf(th, ph), ax: dirOf(th + lean, ph), keep: 0.2 });
  }
  for (const d of await scatterOnBall(ctx, rSpine, 138, 0.235, keep + 0.2, Math.PI, spines)) spines.push({ d, ax: null, keep: 0.2 });
  await ctx.yield();
  const spineMesh = new THREE.InstancedMesh(spineGeometry(), mat(2), spines.length); spineMesh.name = 'grain spines';
  await ctx.yield();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3();
  let tipNear = 1e9;
  spines.forEach((s, i) => {
    const ax = s.ax || [s.d[0] + rSpine.range(-0.12, 0.12), s.d[1] + rSpine.range(-0.12, 0.12), s.d[2] + rSpine.range(-0.12, 0.12)];
    const l = Math.hypot(ax[0], ax[1], ax[2]), a = [ax[0] / l, ax[1] / l, ax[2] / l], len = rSpine.range(3.3 * K, G.spine), thick = rSpine.range(1.1, 1.4) * K;
    frameOn(a, rSpine() * TAU, Q); P.set(s.d[0], s.d[1], s.d[2]).multiplyScalar(R - 0.2); Sc.set(thick, len, thick);
    spineMesh.setMatrixAt(i, M.compose(P, Q, Sc));
    s.tip = [P.x + a[0] * len, P.y + a[1] * len, P.z + a[2] * len]; s.len = len;
    if (s.tip[2] > 0) tipNear = Math.min(tipNear, Math.hypot(s.tip[0], s.tip[1]));
  });
  object.add(spineMesh);
  await ctx.yield();
  // the warts: low round domes scattered singly between the spines, no two alike, never in rows
  const warts = await scatterOnBall(ctx, rWart, 300, 0.076, keep + 0.07, Math.PI - 0.03, spines.map((s) => ({ d: s.d, keep: 0.085 })));
  await ctx.yield();
  const wartMesh = new THREE.InstancedMesh(wartGeometry(), mat(1), warts.length); wartMesh.name = 'grain warts';
  await ctx.yield();
  warts.forEach((d, i) => {
    const w = rWart.range(0.25, 0.55) * K, e = rWart.range(0.8, 1.25);
    frameOn(d, rWart() * TAU, Q); P.set(d[0], d[1], d[2]).multiplyScalar(R - 0.03); Sc.set(w * e, rWart.range(0.2, 0.27) * K, w / e);
    wartMesh.setMatrixAt(i, M.compose(P, Q, Sc));
  });
  object.add(wartMesh);
  await ctx.yield();
  // its own gold dust (a medium): every mote rises in a column of its own that stands outside the ball's outline seen
  // from above and, BY PLACE, outside the tube of radius GRAIN.tube round the line into the mouth and the 3 m before
  // its plane.
  // A world that knows the line gives opts.onSight(x, y0, y1, z, size) (the grain's own frame): true where an upright
  // column stands on a sight from that line to the mouth; such a column is not built.
  const dust = [], tube = G.tube + 1.5;
  for (let tries = 0; dust.length < 240 && tries < 4000; tries++) {
    if (tries % 16 === 15) await ctx.yield();
    const a = rDust() * TAU, r = rDust.range(R + G.spine + 1.5, R + 22 * K), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < tube && z > 0) continue;
    const span = rDust.range(14, 30), y0 = rDust.range(-24, 20 - span * 0.4), rise = rDust.range(0.5, 1.6), ph = rDust(), size = rDust.range(0.09, 0.22);
    if (opts.onSight && opts.onSight(x, y0, y0 + span, z, size)) continue;
    dust.push([x, y0, z, rise, ph, size, span, 0]);
  }
  await ctx.yield();
  const dustMesh = moteMesh(shared, dust, { glow: 1.6 }); dustMesh.name = 'grain dust'; object.add(dustMesh);
  await ctx.yield();
  // ITS HALO OF DUST (a medium, the fixed stream 'halo'): soft puffs of the finest gold dust standing round the ball,
  // brighter on the sun's side, each breathing on the world clock. BY PLACE every puff, its whole ball, stands outside
  // the tube round the line into the mouth and off every sight the world names (opts.onSight), so none lies over the
  // opening.
  const rHalo = rng.fork('halo'), halo = [];
  // (fifteen puffs: eight numbers a puff)
  for (let tries = 0; halo.length < 15 * 8 && tries < 2400; tries++) {
    if (tries % 8 === 7) await ctx.yield();
    const d = dirOf(Math.acos(rHalo.range(-1, 1)), rHalo() * TAU), rad = rHalo.range(2.4, 5), r = R + G.spine * 0.5 + rad * 0.5 + rHalo.range(0, 7), x = d[0] * r, y = d[1] * r, z = d[2] * r;
    if (z + rad > 0 && Math.hypot(x, y) < tube + rad) continue;
    if (opts.onSight && opts.onSight(x, y - rad, y + rad, z, rad)) continue;
    halo.push(x, y, z, rad, rHalo() * TAU, 0.12 + 0.88 * smoothstep(-0.4, 0.7, d[0] * shared.sun.x + d[1] * shared.sun.y + d[2] * shared.sun.z), 0, 0);
  }
  await ctx.yield();
  const hg = new THREE.InstancedBufferGeometry(), hb = new THREE.InstancedInterleavedBuffer(new Float32Array(halo), 8);
  hg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); hg.setIndex([0, 1, 2, 0, 2, 3]);
  hg.setAttribute('iA', new THREE.InterleavedBufferAttribute(hb, 4, 0)); hg.setAttribute('iB', new THREE.InterleavedBufferAttribute(hb, 4, 4)); hg.instanceCount = halo.length / 8;
  hg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), R + G.spine + 26);
  const haloMesh = new THREE.Mesh(hg, new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uGold: { value: new THREE.Color('#FFB93A') } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: shared.GV + /* glsl */`
      attribute vec4 iA, iB; varying vec2 vQ; varying float vB;
      void main() {
        vec4 wp = modelMatrix * vec4(iA.xyz, 1.), mv = viewMatrix * wp; mv.xy += position.xy * iA.w * (1. + .1 * sin(uTime * .35 + iB.x));
        vQ = position.xy; vB = iB.y * (.8 + .2 * sin(uTime * .5 + iB.x * 3.)); vWp = wp.xyz; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: shared.GF + /* glsl */`
      uniform vec3 uGold; varying vec2 vQ; varying float vB;
      void main() { float e = 1. - dot(vQ, vQ); if (e < 0.) discard; gl_FragColor = vec4(uGold * (.5 + .5 * vB), e * e * .16 * vB); }`,
  }));
  haloMesh.name = 'grain halo'; haloMesh.renderOrder = 3; object.add(haloMesh);
  return {
    object, radius: R + G.spine, height: 2 * (R + G.spine), center: new THREE.Vector3(0, 0, 0), ground: false,
    anchors: { portalCentre: new THREE.Vector3(0, 0, front), exitDir: new THREE.Vector3(0, 0, -1), rimInner: G.mouthR, rimOuter: G.rimR, spineTipNear: tipNear, dustTube: tube },
    spines,
    update(dt, time) { if (own) shared.U.uTime.value = time; },
    dispose() { if (own) shared.dispose(); },
  };
}
// ------------------------------------------------------------------ THE ELM that hangs like a chandelier
// Origin at the root on the turf, -Y running down the trunk (it is built hanging). The same tree on every seed.
const ELM_FIXED = 'garden-upside-down:the elm';
// trunk: root to fork; low: root to the lowest spray; rx, rz: the crown's half widths across and along the entry's
// axis; dz: the crown's middle stands this far from the trunk's line along that axis (it reaches toward the sun's
// side as far as the join's figure lets it: south); rootR: the root flare's half width on the turf; trunkR: the
// trunk's half thickness at the roof and at the fork
const ELM_DIM = { trunk: GARDEN.ELM.trunk, low: GARDEN.ELM.y - GARDEN.ELM.crownLow, rx: GARDEN.ELM.crownR, rz: GARDEN.ELM.crownZ, dz: GARDEN.ELM.crownDz, rootR: 15.5, trunkR: [4.5, 3.0], roots: 7 };
// THE TIERS: three floors of drooping sprays with sky between them, not a round mass. Each: its upper and its lower
// height (metres under the root), the share of the crown's plan it fills, the number of its leaf masses
const ELM_TIERS = [{ y0: -84, y1: -99, f: 0.74, n: 30 }, { y0: -104, y1: -122, f: 1, n: 52 }, { y0: -127, y1: -138, f: 0.62, n: 18 }];
// the flat sprays of a tier lie in its upper part; from the outer ones DROOPING SPRAYS hang down to its lower height
const ELM_DROOP = { room: 6, from: 0.5, share: 0.7 };
// THE LEAF MASSES ARE ROUNDED AND OF UNLIKE SIZE, WITH LIGHT BETWEEN THEM: a mass is ELM_MASS.rx metres in half width
// (drawn so that a few are great and many small: three to one), nearly as tall as wide (ELM_MASS.round of its
// width, or as tall as its tier's whole depth lets it be), and no two stand nearer than ELM_MASS.apart of their
// two half widths together; a mass carries leaves by its skin's area, ELM_MASS.leaves of them a square metre,
// between ELM_MASS.count[0] and ELM_MASS.count[1]
const ELM_MASS = { rx: [2.7, 8.2], few: 2, round: [0.72, 0.96], apart: 0.8, leaves: 0.5, count: [60, 400] };
// how far a place of the plan (metres from the trunk's line) stands in the crown's outline: 1 on the outline
export const elmPlanAt = (x, z) => Math.hypot(x / ELM_DIM.rx, (z - ELM_DIM.dz) / ELM_DIM.rz);
// the lowest leaves over a place of the plan (metres under the root; 0 where no tier hangs over it)
export const elmLowAt = (x, z) => { const e = elmPlanAt(x, z); for (let k = ELM_TIERS.length - 1; k >= 0; k--) if (e <= ELM_TIERS[k].f) return ELM_TIERS[k].y1; return 0; };
// a tube along a list of points with a radius at each: appended to arrays; uv = (metres round, metres along)
function tubeInto(A, pts, radii, sides, ph0 = 0) {
  const n = pts.length, T = new THREE.Vector3(), Nrm = new THREE.Vector3(), B = new THREE.Vector3(), prevT = new THREE.Vector3(), q = new THREE.Quaternion();
  const base = A.pos.length / 3; let along = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    if (i === 0) { Nrm.set(1, 0, 0); if (Math.abs(T.x) > 0.9) Nrm.set(0, 0, 1); Nrm.addScaledVector(T, -Nrm.dot(T)).normalize(); }
    else { q.setFromUnitVectors(prevT, T); Nrm.applyQuaternion(q).addScaledVector(T, -Nrm.dot(T)).normalize(); along += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); }
    prevT.copy(T); B.crossVectors(T, Nrm);
    for (let k = 0; k <= sides; k++) {
      const an = k / sides * TAU + ph0, c = Math.cos(an), s = Math.sin(an), r = typeof radii === 'function' ? radii(i, an) : radii[i];
      const nx = Nrm.x * c + B.x * s, ny = Nrm.y * c + B.y * s, nz = Nrm.z * c + B.z * s;
      A.pos.push(pts[i][0] + nx * r, pts[i][1] + ny * r, pts[i][2] + nz * r); A.nor.push(nx, ny, nz); A.uv.push(k / sides * TAU * (typeof radii === 'function' ? 2.6 : radii[i]), along);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * (sides + 1) + k, b = a + sides + 1; A.idx.push(a, a + 1, b, a + 1, b + 1, b); }
}
// a limb as a bent line: from p0, leaving along d0, arriving at p1 from above (it droops into its end)
function limbPoints(p0, d0, p1, n, sag, gnarl = 0) {
  const out = [], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const c1 = [p0[0] + d0[0] * L * 0.4, p0[1] + d0[1] * L * 0.4, p0[2] + d0[2] * L * 0.4], c2 = [p1[0], p1[1] + L * sag, p1[2]];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3;
    // a gnarled limb kinks from side to side between its ends (by its own place: the same tree on every seed)
    const k = gnarl * Math.sin(Math.PI * t), kx = k * Math.sin(i * 2.3 + p1[0] * 0.7), ky = k * 0.5 * Math.sin(i * 1.7 + p1[2] * 0.9), kz = k * Math.sin(i * 2.9 + p1[1] * 0.3);
    out.push([a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0] + kx, a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1] + ky, a * p0[2] + b * c1[2] + c * c2[2] + d * p1[2] + kz]);
  }
  return out;
}
// The tree's plan: the leaf masses of the three tiers (flat drooping sprays, no two crowding each other, the rim's
// hanging lower than the middle's), THREE GREAT BOUGHS that leave the trunk early and sweep down and outward to the
// broad middle tier, five boughs from the fork to the upper tier, the middle limb down to the lowest tier, the arms
// of each, and a twig from the nearest limb to every mass.
async function elmPlan(ctx) {
  const rng = makeRng(hashSeed(ELM_FIXED + ':tiers')), D = ELM_DIM, limbs = [], masses = [], perches = [];
  // a place of the crown's plan: a share of the outline (0 the middle, 1 the outline) at an angle, at a height
  const pol = (e, a, y) => [Math.cos(a) * e * D.rx, y, D.dz + Math.sin(a) * e * D.rz];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const taper = (n, r0, r1) => { const a = []; for (let i = 0; i <= n; i++) a.push(lerp(r0, r1, Math.pow(i / n, 0.8))); return a; };
  const fork = [0, -D.trunk, 0];
  // the lowest spray, on the trunk's own line
  masses.push({ c: [0, -D.low + 4.2, 0], rx: 4.4, ry: 4.2, tier: 2 });
  for (let tier = 0; tier < ELM_TIERS.length; tier++) {
    const T = ELM_TIERS[tier];
    for (let i = 0; i < T.n; i++) for (let tries = 0; tries < 200; tries++) {
      if (tries % 24 === 0) await ctx.yield();
      const rx = lerp(ELM_MASS.rx[0], ELM_MASS.rx[1], Math.pow(rng(), ELM_MASS.few)), ry = Math.min(rx * rng.range(ELM_MASS.round[0], ELM_MASS.round[1]), (T.y0 - T.y1) / 2), a = rng() * TAU;
      const e = Math.min(Math.sqrt(rng.range(tier === 2 ? 0.02 : 0.1, 1)) * T.f, T.f - rx / Math.hypot(Math.cos(a) * D.rx, Math.sin(a) * D.rz));
      // the rim's sprays hang lower than the middle's: the tier droops
      const c = pol(e, a, clamp(lerp(T.y0 - ry, T.y1 + ELM_DROOP.room + ry, clamp(Math.pow(e / T.f, 1.6) * rng.range(0.7, 1.15), 0, 1)), T.y1 + ry, T.y0 - ry));
      let ok = true;
      for (const m of masses) { const d = Math.hypot(c[0] - m.c[0], (c[1] - m.c[1]) * 1.3, c[2] - m.c[2]); if (d < (rx + m.rx) * ELM_MASS.apart) { ok = false; break; } }
      if (!ok) continue;
      masses.push({ c, rx, ry, tier });
      // a drooping spray under an outer mass: narrow and long, hanging to the tier's lower height
      if (e / T.f > ELM_DROOP.from && rng() < ELM_DROOP.share) {
        const hx = rng.range(2.0, 3.0), hy = Math.min(rng.range(3.4, 5.2), (c[1] - ry * 0.4 - T.y1) / 2), oa = a + rng.range(-0.8, 0.8), q = [c[0] + Math.cos(oa) * rx * 0.5, c[1] - ry * 0.4 - hy, c[2] + Math.sin(oa) * rx * 0.5];
        if (hy > 2 && elmPlanAt(q[0], q[2]) + hx / Math.min(D.rx, D.rz) <= T.f) masses.push({ c: q, rx: hx, ry: hy, tier, droop: true });
      }
      break;
    }
  }
  await ctx.yield();
  const arm = (from, a, e, y, r0, n = 6, sides = 6) => { const tip = pol(e, a, y), d = norm([tip[0] - from[0], -0.35 * Math.hypot(tip[0] - from[0], tip[2] - from[2]), tip[2] - from[2]]); limbs.push({ pts: limbPoints(from, d, tip, n, 0.22, 0.5), rad: taper(n, r0, r0 * 0.42), sides }); };
  // THE THREE GREAT BOUGHS: they leave the trunk 43, 53 and 63 m under the root (the south one first) and sweep down
  // and outward to the middle tier; each bears three arms to that tier's rim and one up to the upper tier
  const B = ELM_TIERS[1], A = ELM_TIERS[0], C = ELM_TIERS[2];
  [[-TAU / 4, -43], [TAU * 0.09, -53], [TAU * 0.43, -63]].forEach(([az, y0]) => {
    const d0 = norm([Math.cos(az), -0.42, Math.sin(az)]), r0 = lerp(D.trunkR[0], D.trunkR[1], -y0 / D.trunk);
    const pts = limbPoints([d0[0] * r0 * 0.6, y0, d0[2] * r0 * 0.6], d0, pol(0.62, az, B.y0 - 2), 13, 0.3, 1.3);
    limbs.push({ pts, rad: taper(13, 2.6, 1.1), sides: 10, great: true });
    arm(pts[11], az + rng.range(-0.1, 0.1), 0.93, lerp(B.y0, B.y1, 0.6), 1.0, 7);
    arm(pts[10], az - rng.range(0.42, 0.6), 0.86, lerp(B.y0, B.y1, 0.5), 0.9);
    arm(pts[10], az + rng.range(0.42, 0.6), 0.86, lerp(B.y0, B.y1, 0.5), 0.9);
    arm(pts[6], az + rng.range(-0.3, 0.3), A.f * 0.9, lerp(A.y0, A.y1, 0.6), 0.75);
  });
  await ctx.yield();
  // five boughs from the fork to the upper tier, each with two arms to its rim
  for (let i = 0; i < 5; i++) {
    const az = (i + 0.5 + rng.range(-0.2, 0.2)) / 5 * TAU, d0 = norm([Math.cos(az), -0.5, Math.sin(az)]);
    const pts = limbPoints([d0[0] * 1.4, fork[1] + 1.5, d0[2] * 1.4], d0, pol(A.f * 0.5, az, A.y0 - 4), 8, 0.25, 0.7);
    limbs.push({ pts, rad: taper(8, 1.6, 0.7), sides: 8 });
    arm(pts[6], az - rng.range(0.25, 0.45), A.f * 0.88, lerp(A.y0, A.y1, 0.65), 0.55);
    arm(pts[6], az + rng.range(0.25, 0.45), A.f * 0.88, lerp(A.y0, A.y1, 0.65), 0.55);
  }
  await ctx.yield();
  // the middle limb, down from the fork to the lowest tier, with four arms into the middle tier's heart and four
  // into the lowest tier
  const mid = [[0, fork[1] + 2, 0], [0.8, -96, D.dz * 0.25], [-0.6, -108, D.dz * 0.5], [0.4, -120, D.dz * 0.75], [0, -129, D.dz * 0.9]];
  limbs.push({ pts: mid, rad: taper(4, 1.5, 0.6), sides: 8 });
  for (let k = 0; k < 4; k++) { arm(mid[2], (k + rng.range(-0.2, 0.2)) / 4 * TAU + 0.6, 0.4, lerp(B.y0, B.y1, 0.35), 0.6); arm(mid[3], (k + 0.5 + rng.range(-0.2, 0.2)) / 4 * TAU, C.f * 0.7, lerp(C.y0, C.y1, 0.5), 0.5); }
  // a twig from the nearest place on any limb to every mass
  await ctx.yield();
  const nodes = []; for (const l of limbs) l.pts.forEach((p, i) => { if (i > 1) nodes.push(p); });
  for (let mi = 0; mi < masses.length; mi++) {
    if (mi % 8 === 7) await ctx.yield();
    const m = masses[mi], end = [m.c[0], m.c[1] + m.ry * 0.3, m.c[2]]; let best = null, bd = 1e9;
    for (const p of nodes) { const d = Math.hypot(p[0] - end[0], (p[1] - end[1]) * 1.4 + 4, p[2] - end[2]); if (d < bd) { bd = d; best = p; } }
    const out = norm([end[0] - best[0], -0.4 * Math.hypot(end[0] - best[0], end[2] - best[2]), end[2] - best[2]]);
    limbs.push({ pts: limbPoints(best, out, end, 5, 0.3), rad: taper(5, 0.4, 0.13), sides: 5 });
  }
  return { limbs, masses, perches, rng };
}
// the wood: THE ROOT FLARE on the roof (seven buttress roots like fins, 28 to 34 m across, each running out over the
// turf as a root), the trunk (9 m thick at the roof, 6 at the fork), the limbs, the spurs the birds sit on
async function elmWood(plan, ctx) {
  const D = ELM_DIM, E = GARDEN.ELM, A = { pos: [], nor: [], uv: [], idx: [] }, rng = plan.rng.fork('wood');
  const wob = []; for (let i = 0; i < 4; i++) wob.push([rng.range(0.02, 0.07), rng() * TAU]);
  const pts = [], ys = [];
  for (let i = 0; i <= 30; i++) ys.push(6 - (D.trunk + 6) * Math.pow(i / 30, 1.3));
  ys.push(-D.trunk - 1.6, -D.trunk - 2.8, -D.trunk - 3.3);
  for (const y of ys) pts.push([0.6 * Math.sin(y * wob[0][0] + wob[0][1]), y, 0.6 * Math.sin(y * wob[1][0] + wob[1][1])]);
  const ph = rng() * TAU, amp = []; for (let i = 0; i < D.roots; i++) amp.push(rng.range(0.86, 1.1));
  const lobeOf = (an) => Math.floor((((an + ph / D.roots) / TAU) % 1 + 1) % 1 * D.roots + 0.5) % D.roots;
  const radius = (i, an) => {
    const y = ys[i], t = clamp(-y / D.trunk, 0, 1), capT = clamp((-y - D.trunk) / 3.3, 0, 1);
    const lobe = Math.pow(0.5 + 0.5 * Math.cos(D.roots * an + ph), 3);
    const flare = (D.rootR - D.trunkR[0]) * amp[lobeOf(an)] * Math.exp(Math.min(y, 1.5) / 7) * (0.2 + 0.8 * lobe) + 0.5 * Math.exp(y / 22) * lobe;
    return (lerp(D.trunkR[0], D.trunkR[1], t) + flare) * Math.sqrt(Math.max(1 - capT * capT, 0.0004));
  };
  await ctx.yield();
  tubeInto(A, pts, radius, 42);
  await ctx.yield();
  // the roots: from each buttress's foot out over the turf, wandering, sinking into it at their ends
  const turf = (x, z) => yg(E.x + x, E.z + z) - E.y;
  for (let k = 0; k < D.roots; k++) {
    const az = (k * TAU - ph) / D.roots, reach = rng.range(21, 28), bend = rng.range(-0.3, 0.3), rp = [], rr = [];
    for (let j = 0; j <= 7; j++) {
      const r = lerp(D.rootR * 0.62, reach, j / 7), a = az + bend * (j / 7) ** 2 + 0.06 * Math.sin(j * 1.9 + k), x = Math.cos(a) * r, z = Math.sin(a) * r;
      rp.push([x, turf(x, z) - lerp(1.5, 0.5, j / 7) + (j === 7 ? 1.4 : 0), z]); rr.push(lerp(1.5, 0.3, Math.pow(j / 7, 0.7)));
    }
    tubeInto(A, rp, rr, 7, rng() * TAU);
    await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < plan.limbs.length; i++) { const l = plan.limbs[i]; tubeInto(A, l.pts, l.rad, l.sides, rng() * TAU); if (i % 6 === 5) await ctx.yield(); }
  await ctx.yield();
  // twelve spurs: bare twigs that stand out level a little under the leaves, where the birds sit head down
  const cands = plan.masses.filter((m) => { const r = Math.hypot(m.c[0], m.c[2]); return m.tier > 0 && r > 6 && r < 27; });
  const step = cands.length / 12;
  for (let k = 0; k < 12 && cands.length; k++) {
    const m = cands[Math.floor(k * step) % cands.length], a = rng() * TAU, d = [Math.cos(a), 0, Math.sin(a)], y = m.c[1] - m.ry - 0.9;
    const from = [m.c[0] - d[0] * m.rx * 0.5, m.c[1] - m.ry * 0.5, m.c[2] - d[2] * m.rx * 0.5], mid = [m.c[0], y, m.c[2]];
    const tip = [m.c[0] + d[0] * 2.6, y + 0.15, m.c[2] + d[2] * 2.6];
    tubeInto(A, [from, [lerp(from[0], mid[0], 0.6), y + 0.8, lerp(from[2], mid[2], 0.6)], mid, tip], [0.22, 0.18, 0.14, 0.06], 5);
    plan.perches.push({ p: [m.c[0] + d[0] * 0.9, y - 0.14, m.c[2] + d[2] * 0.9], dir: d });
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2)); g.setIndex(A.idx);
  return g;
}
// how open a place of the crown is to the low sun: 1 on the crown's side toward the sun and on its outer flank, less
// in its heart and on the far side (where the light comes THROUGH the leaves instead)
function elmOpen(p, o, sun) {
  const D = ELM_DIM, facing = clamp(0.5 + 0.62 * (o[0] * sun[0] + o[1] * sun[1] + o[2] * sun[2]), 0, 1), hl = Math.hypot(sun[0], sun[2]) || 1;
  const side = (p[0] / D.rx * sun[0] + (p[2] - D.dz) / D.rz * sun[2]) / hl, flank = smoothstep(0.55, 0.95, elmPlanAt(p[0], p[2])) * 0.8;
  return facing * Math.max(smoothstep(-0.5, 0.6, side), flank, 0.26);
}
const LEAF_UV = [[0, 0], [1, 0], [0, 1], [1, 1], [0, -1], [1, -1]];
// the dark inner body of every leaf mass (a lumpy ball) and the toothed leaves wrapped round it
async function elmFoliage(ctx, plan, sun) {
  const rng = plan.rng.fork('leaves'), ico = new THREE.IcosahedronGeometry(1, 1), ip = ico.attributes.position;
  const areaOf = (m) => 4 * Math.PI * Math.pow((2 * Math.pow(m.rx * m.ry, 1.6) + Math.pow(m.rx * m.rx, 1.6)) / 3, 1 / 1.6);
  const counts = plan.masses.map((m) => Math.round(clamp(areaOf(m) * ELM_MASS.leaves, ELM_MASS.count[0], ELM_MASS.count[1]))), total = counts.reduce((a, b) => a + b, 0), nb = plan.masses.length * ip.count;
  const B = { pos: new Float32Array(nb * 3), nor: new Float32Array(nb * 3), open: new Float32Array(nb) };
  const L = { pos: new Float32Array(total * 18), nor: new Float32Array(total * 18), uv: new Float32Array(total * 12), piv: new Float32Array(total * 18), leaf: new Float32Array(total * 18) }, idx = new Uint32Array(total * 12);
  let nLeaf = 0, bv = 0, mi = 0;
  await ctx.yield();
  for (const m of plan.masses) {
    const s1 = rng() * 9, s2 = rng() * 9;
    for (let i = 0; i < ip.count; i++) {
      const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i), k = 0.8 * (1 + 0.13 * Math.sin(x * 4 + s1) * Math.sin(y * 3.3 + s2) + 0.08 * Math.sin(z * 5 + s1 * 2));
      const p = [m.c[0] + x * m.rx * k, m.c[1] + y * m.ry * k, m.c[2] + z * m.rx * k];
      B.pos.set(p, bv * 3); B.nor.set([x, y, z], bv * 3); B.open[bv++] = elmOpen(p, [x, y, z], sun);
    }
    const n = counts[mi++];
    for (let j = 0; j < n; j++) {
      if (j % 12 === 0) await ctx.yield();
      const oy = rng.range(-1, 1), oa = rng() * TAU, os = Math.sqrt(1 - oy * oy), o = [os * Math.cos(oa), oy, os * Math.sin(oa)], q = rng.range(0.87, 1.1);
      const c = [m.c[0] + o[0] * m.rx * q, m.c[1] + o[1] * m.ry * q, m.c[2] + o[2] * m.rx * q];
      // the leaf hangs: its tip points down and outward
      let t = [o[0] * 0.6 + rng.range(-0.35, 0.35), -rng.range(0.55, 1.1), o[2] * 0.6 + rng.range(-0.35, 0.35)]; let l = Math.hypot(t[0], t[1], t[2]); t = [t[0] / l, t[1] / l, t[2] / l];
      const tw = rng.range(-0.7, 0.7); let dn = o[0] * t[0] + o[1] * t[1] + o[2] * t[2];
      let nn = [o[0] - t[0] * dn + tw * (t[1] * o[2] - t[2] * o[1]), o[1] - t[1] * dn + tw * (t[2] * o[0] - t[0] * o[2]), o[2] - t[2] * dn + tw * (t[0] * o[1] - t[1] * o[0])];
      l = Math.hypot(nn[0], nn[1], nn[2]) || 1; nn = [nn[0] / l, nn[1] / l, nn[2] / l];
      const sd = [t[1] * nn[2] - t[2] * nn[1], t[2] * nn[0] - t[0] * nn[2], t[0] * nn[1] - t[1] * nn[0]];
      const len = rng.range(1.6, 2.2) * 1.3, w = len * rng.range(0.27, 0.34), fold = rng.range(0.15, 0.4), open = elmOpen(c, o, sun), ph = rng() * TAU, tone = rng();
      const base = nLeaf * 6; let vi = base;
      for (const [u, v] of LEAF_UV) {
        const a = (u - 0.5) * len, b = v * w, e = Math.abs(v) * w * fold;
        L.pos[vi * 3] = c[0] + t[0] * a + sd[0] * b + nn[0] * e; L.pos[vi * 3 + 1] = c[1] + t[1] * a + sd[1] * b + nn[1] * e; L.pos[vi * 3 + 2] = c[2] + t[2] * a + sd[2] * b + nn[2] * e;
        // the shading normal leans from the leaf's own face toward the mass's outward side, and each half toward its fold
        const fx = nn[0] * 0.55 + o[0] * 0.45 - sd[0] * v * fold * 0.6, fy = nn[1] * 0.55 + o[1] * 0.45 - sd[1] * v * fold * 0.6, fz = nn[2] * 0.55 + o[2] * 0.45 - sd[2] * v * fold * 0.6, fl = Math.hypot(fx, fy, fz) || 1;
        L.nor[vi * 3] = fx / fl; L.nor[vi * 3 + 1] = fy / fl; L.nor[vi * 3 + 2] = fz / fl; L.uv[vi * 2] = u; L.uv[vi * 2 + 1] = v;
        L.piv[vi * 3] = c[0]; L.piv[vi * 3 + 1] = c[1]; L.piv[vi * 3 + 2] = c[2]; L.leaf[vi * 3] = ph; L.leaf[vi * 3 + 1] = open; L.leaf[vi * 3 + 2] = tone; vi++;
      }
      idx.set([base, base + 1, base + 3, base, base + 3, base + 2, base, base + 4, base + 5, base, base + 5, base + 1], nLeaf * 12);
      nLeaf++;
    }
    await ctx.yield();
  }
  await ctx.yield();
  const bodies = new THREE.BufferGeometry();
  bodies.setAttribute('position', new THREE.BufferAttribute(B.pos, 3)); bodies.setAttribute('normal', new THREE.BufferAttribute(B.nor, 3));
  bodies.setAttribute('aOpen', new THREE.BufferAttribute(B.open, 1));
  const leaves = new THREE.BufferGeometry();
  leaves.setAttribute('position', new THREE.BufferAttribute(L.pos, 3)); leaves.setAttribute('normal', new THREE.BufferAttribute(L.nor, 3));
  leaves.setAttribute('uv', new THREE.BufferAttribute(L.uv, 2)); leaves.setAttribute('aPivot', new THREE.BufferAttribute(L.piv, 3));
  leaves.setAttribute('aLeaf', new THREE.BufferAttribute(L.leaf, 3)); leaves.setIndex(new THREE.BufferAttribute(idx, 1));
  ico.dispose();
  return { bodies, leaves, nLeaf };
}
const ELM_VERT = /* glsl */`
attribute vec3 aPivot, aLeaf; attribute float aOpen; uniform float uLeafy;
varying vec3 vN, vLp; varying vec2 vUv; varying vec3 vLeaf;
void main() {
  vec3 p = position; vUv = uv; vLeaf = uLeafy > .5 ? aLeaf : vec3(0., aOpen, 0.);
  // every leaf flutters about its own middle; the boughs breathe a third of a metre
  if (uLeafy > .5) p += normal * sin(uTime * (3.1 + aLeaf.z * 2.4) + aLeaf.x + uv.x * 2.) * .15 * (uv.x + .3 * abs(uv.y));
  vec3 q = uLeafy > .5 ? aPivot : position;
  p.y += .3 * sin(uTime * .45 + q.x * .13 + q.z * .17) * smoothstep(3., 24., length(q.xz)) * step(q.y, -80.);
  vLp = p; vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(p, 1.); vWp = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const WOOD_FRAG = /* glsl */`
uniform vec3 uBarkA, uBarkB, uMoss; uniform vec2 uMossDir;
varying vec3 vN, vLp; varying vec2 vUv;
void main() {
  vec3 N = normalize(vN);
  // furrowed bark: long ridges down the limb, a finer crackle across them
  float ridge = texture2D(uNoise, vec2(vUv.x * .085, vUv.y * .011)).r, fine = texture2D(uNoise, vec2(vUv.x * .31, vUv.y * .07)).g;
  float h = ridge * .68 + fine * .32, plate = smoothstep(.36, .6, h);
  vec3 dpx = dFdx(vWp), dpy = dFdy(vWp); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  N = normalize(abs(det) * N - .55 * sign(det) * (hx * r1 + hy * r2));
  vec3 alb = mix(uBarkA, uBarkB, plate) * mix(.8, 1.1, fine);
  // moss on the side toward the brook
  float m = smoothstep(.05, .7, dot(normalize(vN.xz + 1e-4), uMossDir)) * smoothstep(.38, .6, texture2D(uNoise, vUv * .034).g + .25 * plate);
  alb = mix(alb, uMoss * mix(.7, 1.15, fine), m * .85);
  // a limb seen against the light is no dark hose: the low sun comes round its edge (a warm rim, strongest where the
  // sight runs toward the sun), and the sky under it lends the bark a little of its own colour everywhere
  vec3 V = normalize(cameraPosition - vWp), sunT = uSunCol / max(uSunCol.r, 1e-3);
  float rim = pow(1. - max(dot(normalize(vN), V), 0.), 2.6) * (.15 + .85 * max(dot(-V, uSun), 0.));
  gl_FragColor = vec4(gFog(gShade(alb, N, 0., mix(.55, 1., plate), .8) + alb * uFill * .22 + sunT * vec3(1., .82, .55) * rim * .6 * gSunlit(vWp)), 1.);
}`;
const LEAF_FRAG = /* glsl */`
uniform vec3 uLeafA, uLeafB, uLeafDeep; uniform float uLeafy;
varying vec3 vN, vLp; varying vec2 vUv; varying vec3 vLeaf;
void main() {
  vec3 N = normalize(vN);
  if (uLeafy > .5) {
    // A SPRAY cut from the card: a twig down its middle, six toothed elm leaves to each side by turns and one at the
    // tip, each leaf-sized (a third of the card long), pointed, leaning toward the spray's tip
    float u = clamp(vUv.x, 0., 1.), v = abs(vUv.y), side = step(0., vUv.y);
    float cu = u * 6.6 + side * .5 - v * .55, k = floor(cu), a = fract(cu) - .5;
    float b = clamp(v / (.92 - .22 * step(4.5, k)), 0., 1.2);
    float wl = .4 * pow(max(sin(3.14159 * pow(clamp(b, 0., 1.), .78)), 0.), .8) * (1. + .12 * abs(fract(b * 7.) * 2. - 1.));
    float leaf = step(abs(a), wl) * step(b, 1.) * step(k, 5.5) * step(-.5, k);
    // the leaf at the tip lies along the twig
    float tu = (u - .8) / .2, tw = .3 * pow(max(sin(3.14159 * pow(clamp(tu, 0., 1.), .8)), 0.), .8) * (1. + .12 * abs(fract(tu * 7.) * 2. - 1.));
    float tip = step(0., tu) * step(v, tw), twig = step(v, .035) * step(u, .82);
    if (leaf + tip + twig < .5) discard;
    if (!gl_FrontFacing) N = -N;
    float rib = mix(abs(a) / max(wl, .02), v / max(tw, .02), tip * (1. - leaf)), across = mix(b, tu, tip * (1. - leaf));
    float vein = smoothstep(.16, .0, rib) + .5 * smoothstep(.14, .0, abs(fract(across * 6. - rib * .9) - .5)) * step(.12, rib);
    vec3 alb = mix(uLeafA, uLeafB, clamp(vLeaf.z + .25 * (fract(k * .37 + vLeaf.x) - .5), 0., 1.)) * (1. - .2 * vein);
    alb = mix(alb, uLeafDeep * .8, twig * (1. - leaf) * (1. - tip));
    alb = mix(uLeafDeep, alb, .35 + .65 * vLeaf.y);
    gl_FragColor = vec4(gFog(gShade(alb, N, .95, .18 + .82 * vLeaf.y, 1.)), 1.);
  } else {
    // the dark inner body of a leaf mass: deep green, mottled like leaves in shade
    vec3 w = abs(N); w /= (w.x + w.y + w.z);
    float mott = texture2D(uNoise, vLp.yz * .21).g * w.x + texture2D(uNoise, vLp.zx * .21).g * w.y + texture2D(uNoise, vLp.xy * .21).g * w.z;
    vec3 alb = mix(uLeafDeep, mix(uLeafDeep, uLeafA, .6), smoothstep(.3, .7, mott));
    gl_FragColor = vec4(gFog(gShade(alb, N, .3, (.5 + .5 * vLeaf.y) * mix(.7, 1., mott), .8)), 1.);
  }
}`;
export async function buildHero(ctx, opts = {}) {
  const own = !opts.shared, shared = opts.shared || await gardenShared(ctx, opts), D = ELM_DIM;
  const object = new THREE.Group(); object.name = 'the elm';
  const plan = await elmPlan(ctx); await ctx.yield();
  const woodGeo = await elmWood(plan, ctx); await ctx.yield();
  const fol = await elmFoliage(ctx, plan, GARDEN.SUN); await ctx.yield();
  const col = (h, k = 1) => ({ value: new THREE.Color(h).multiplyScalar(k) });
  const mossDir = new THREE.Vector2(opts.mossDir ? opts.mossDir[0] : -1, opts.mossDir ? opts.mossDir[1] : -0.12).normalize();
  const wood = new THREE.Mesh(woodGeo, new THREE.ShaderMaterial({
    uniforms: { ...shared.U, uLeafy: { value: 0 }, uBarkA: col('#65574A'), uBarkB: col('#A08E78'), uMoss: col('#7C9C4C'), uMossDir: { value: mossDir } },
    vertexShader: shared.GV + ELM_VERT, fragmentShader: shared.GF + WOOD_FRAG }));
  wood.name = 'elm wood'; object.add(wood);
  await ctx.yield();
  const leafU = (leafy) => ({ ...shared.U, uLeafy: { value: leafy }, uLeafA: col('#3FA64A'), uLeafB: col('#63B43C'), uLeafDeep: col('#1E5A3A') });
  const bodies = new THREE.Mesh(fol.bodies, new THREE.ShaderMaterial({ uniforms: leafU(0), vertexShader: shared.GV + ELM_VERT, fragmentShader: shared.GF + LEAF_FRAG }));
  bodies.name = 'elm leaf bodies'; object.add(bodies);
  await ctx.yield();
  const leaves = new THREE.Mesh(fol.leaves, new THREE.ShaderMaterial({ uniforms: leafU(1), vertexShader: shared.GV + ELM_VERT, fragmentShader: shared.GF + LEAF_FRAG, side: THREE.DoubleSide }));
  leaves.name = 'elm leaves'; object.add(leaves);
  for (const m of [wood, bodies, leaves]) { m.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -D.low / 2, D.dz / 2), D.low / 2 + 16); }
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  return {
    object, radius: D.rz, height: D.low, center: new THREE.Vector3(0, -(D.trunk + D.low) / 2, D.dz), ground: false,
    anchors: { root: V([0, 0, 0]), fork: V([0, -D.trunk, 0]), lowest: V([0, -D.low, 0]), crownCentre: V([0, -(D.trunk + D.low) / 2, D.dz]), crownRadius: D.rz,
      perches: plan.perches.map((p) => ({ at: V(p.p), dir: V(p.dir) })) },
    masses: plan.masses, leafCount: fol.nLeaf,
    // the swing of the whole tree about its root (the shudder's law is the world's): an angle in radians
    swing(angle) { object.rotation.z = angle; },
    update(dt, time) { if (own) shared.U.uTime.value = time; },
    dispose() { if (own) shared.dispose(); },
  };
}
