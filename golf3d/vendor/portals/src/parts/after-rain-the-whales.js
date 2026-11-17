// After the Rain, the Whales: THE CITY. An everyday modern glass city at dusk just after rain:
// a wide avenue of plane trees under open sky, towers of both sides on their podiums, three cross streets, a stepped
// plaza, a roof garden, an open square, a terrace and a free-standing twisted stone arch that holds the portal.
// Everything is our own drawing from the brief's words and public facts on cities. Nothing is lettered.
// The world sets neither portal.drawWithin nor portal.drawIn: the ring stands whole at every metre.
// Axes: x EAST, y up, z SOUTH; the flight goes north (toward -z). Street level y 0. Metres.
// LIGHT BY PLACE: the low sun reaches a face only where no building of the sun's side stands in its way; this is
// worked out in the shaders from the buildings' own boxes (the numbers the faces are built from), never from the lens,
// the clock or the metres flown. The animals part's shadows (arwShade) multiply the sun's share on the same faces.
import * as THREE from 'three';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const MAXB = 24, SQ_LAMPS = 16, POOLS = 18;

// The light and air of the hour. sunDir points TO the sun. Colours are linear.
export function cityEnv(hour) {
  const h = hour === 'dawn' || hour === 'day' || hour === 'night' ? hour : 'golden';
  const deg = Math.PI / 180;
  const dir = (el, azWestOfNorth) => new THREE.Vector3(-Math.sin(azWestOfNorth * deg) * Math.cos(el * deg), Math.sin(el * deg), -Math.cos(azWestOfNorth * deg) * Math.cos(el * deg));
  const E = {
    golden: { sunDir: dir(9, 40), sun: '#ffbc74', sunK: 2.6, zen: '#3a477a', mid: '#676c9e', hor: '#ffb672', cool: '#8581a8', lit: '#ffa878', dark: '#4a5180', sky: '#808cc8', ground: '#a08f96', fog: '#c79c8e', fogCool: '#7d83ae', glow: 1.15 },
    dawn: { sunDir: dir(9, -40), sun: '#ffc9a0', sunK: 2.3, zen: '#52648f', mid: '#8a90b8', hor: '#ffd0aa', cool: '#a9abc8', lit: '#ffc0a4', dark: '#5e678e', sky: '#8e9bcb', ground: '#a3949a', fog: '#d1bcb8', fogCool: '#adb0c8', glow: 1 },
    day: { sunDir: dir(57, 34), sun: '#fff1dc', sunK: 2.2, zen: '#5f82b8', mid: '#9db4d6', hor: '#e2e6ea', cool: '#c3cfdf', lit: '#f6f1ea', dark: '#7a88a6', sky: '#a3b6da', ground: '#a8a39c', fog: '#cfd5dc', fogCool: '#bcc7d6', glow: 0.5 },
    night: { sunDir: dir(3, 40), sun: '#ff9c6a', sunK: 0, zen: '#2c3a72', mid: '#4d5a96', hor: '#f0a27c', cool: '#6f77a8', lit: '#c98e8c', dark: '#3b4474', sky: '#98a6de', ground: '#7a7896', fog: '#8f86a6', fogCool: '#6f78a6', glow: 0.8 },
  }[h];
  const c = (k) => new THREE.Color(E[k]);
  const env = {
    hour: h, sunDir: E.sunDir.clone().normalize(), sunK: E.sunK,
    sunColor: c('sun').multiplyScalar(E.sunK > 0 ? E.sunK : 0.45), skyColor: c('sky'), groundColor: c('ground'),
    fogColor: c('fog'), fogNear: 70, fogFar: h === 'night' ? 1300 : 1700,
    zen: c('zen'), mid: c('mid'), hor: c('hor'), cool: c('cool'), cloudLit: c('lit'), cloudDark: c('dark'), fogCool: c('fogCool'), glow: E.glow,
    lamps: h === 'night' ? 1 : h === 'day' ? 0.12 : 0.55,
    // the share of the lamp standards that is lit, steady, by the hour (which of them: each lamp's own draw)
    lampShare: h === 'night' ? 1 : h === 'day' ? 0.05 : h === 'dawn' ? 0.5 : 0.8,
    // the wet's ceiling: the brightest any puddle or wet paving may stand, set against the hour's exposure as the
    // world sets it (1.6 at night, 0.94 by day, else 1.2), so that the lens never sees it over 0.85
    wetCap: 0.33 / (h === 'night' ? 1.6 : h === 'day' ? 0.94 : 1.2),
  };
  return env;
}

// a small tileable noise texture: r smooth fbm, g a second fbm, b white. Made once per build from a stream of our own.
async function makeNoiseTexture(rng, ctx) {
  const S = 256, data = new Uint8Array(S * S * 4);
  const lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const octs = [[8, 0.5], [16, 0.25], [32, 0.15], [64, 0.1]];
  for (let ch = 0; ch < 2; ch++) {
    const f = new Float32Array(S * S);
    for (const [n, amp] of octs) {
      const L = lat(n), k = n / S;
      for (let y = 0; y < S; y++) {
        const fy = y * k, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = (y0 % n) * n, yb = ((y0 + 1) % n) * n;
        for (let x = 0; x < S; x++) {
          const fx = x * k, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % n, xb = (x0 + 1) % n;
          f[y * S + x] += amp * lerp(lerp(L[ya + xa], L[ya + xb], sx), lerp(L[yb + xa], L[yb + xb], sx), sy);
        }
      }
      // (the stream is our own, so a pause between two octaves lets no other draw in)
      await ctx.yield();
    }
    for (let i = 0; i < S * S; i++) data[i * 4 + ch] = clamp(Math.round(f[i] * 255), 0, 255);
  }
  for (let i = 0; i < S * S; i++) { data[i * 4 + 2] = Math.floor(rng() * 256); data[i * 4 + 3] = 255; }
  await ctx.yield();
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

// GLSL shared by every material of the city: noise, the sky as a function of a direction (the dome draws it and the
// glass and the wet street mirror it), the haze, and the sun's way through the buildings' boxes.
const GLSL_COMMON = /* glsl */`
uniform sampler2D tNoise; uniform float uTime; uniform vec3 uPortal, uPortalCol;
uniform vec3 uSunDir, uSunCol, uZen, uMid, uHor, uCool, uCloudLit, uCloudDark, uFogWarm, uFogCool, uSkyAmb, uGroundAmb;
uniform vec2 uSunAz; uniform float uSunK, uFogK, uGlow, uLamps, uLampShare; uniform float uLampDraw[38];
uniform vec4 uBox[${MAXB}]; uniform float uBoxH[${MAXB}];
float gNzLod = 0.;
float nz(vec2 p){ return textureLod(tNoise, p, gNzLod).r; }
float nz2(vec2 p){ return textureLod(tNoise, p, gNzLod).g; }
float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float azWarm(vec3 d){ vec2 h = d.xz; float l = max(length(h), 1e-4); return clamp(dot(h / l, uSunAz) * .5 + .5, 0., 1.); }
// the clear sky: slate and blue-violet above, apricot and pale gold low on the sun's side
vec3 arwSkyBase(vec3 d, float sunShare){
  float up = clamp(d.y, 0., 1.), w = azWarm(d); float w2 = w * w * w;
  vec3 hor = mix(uCool, uHor, w2);
  vec3 c = mix(uMid, uZen, clamp(up * 1.6, 0., 1.));
  float hb = 1. - up; hb *= hb; hb *= hb;
  c = mix(c, hor, clamp(hb * (0.55 + 0.45 * w2) * 1.25, 0., 1.));
  float sd = clamp(dot(d, uSunDir), 0., 1.); float s4 = sd * sd; s4 *= s4; float s16 = s4 * s4; s16 *= s16; float s64 = s16 * s16; s64 *= s64;
  float s256 = s64 * s64; s256 *= s256; float s2k = s256 * s256; s2k *= s2k; s2k *= s2k;
  c += uSunCol * uGlow * (s4 * .045 + s16 * .09 + s64 * .13 * sunShare + s256 * .14 * sunShare + s2k * 5. * sunShare * step(0.001, uSunK));
  return c;
}
// the lifting cloud deck: rgb colour, a cover
vec4 arwCloud(vec3 d){
  float up = max(d.y, 0.); vec2 p = d.xz / (up + .12);
  float w = azWarm(d); float low = 1. - clamp(up * 2.2, 0., 1.);
  vec2 q = p * .055 + vec2(uTime * .0040, uTime * .0023);
  float n = nz(q) * .62 + nz2(q * 2.7 + .31) * .38 + (nz(q * 6.3 + .7) - .5) * .11;
  float edge = mix(.35, .72, w * w * low);
  float cover = smoothstep(edge, edge + .2, n) * smoothstep(.015, .10, d.y);
  float thick = smoothstep(edge, edge + .42, n);
  float under = w * w * (.16 + .84 * low);
  vec3 col = mix(uCloudDark * (1.05 - .35 * thick), uCloudLit * (1.03 - .3 * thick), clamp(under * 1.25, 0., 1.));
  col += uSunCol * .16 * w * w * w * (1. - thick) * uGlow;
  return vec4(col, cover * .93);
}
vec3 arwSky(vec3 d, float sunShare){
  vec3 dn = normalize(d + vec3(0., 1e-5, 0.));
  vec4 cl = arwCloud(dn);
  vec3 c = arwSkyBase(dn, sunShare * (1. - cl.a));
  c = mix(c, cl.rgb, cl.a);
  vec3 hz = mix(uFogCool, uFogWarm, azWarm(dn));
  // low over the land the sky is seen through the same haze as the far land is: where it would stand darker than the
  // haze the hills fade into (cloud shade on the side away from the sun), it runs to the haze's own colour, wholly up
  // to 4 degrees and less and less up to 14, so no pale band of hills stands hard against a darker sky at any hour
  float lc = dot(c, vec3(.3, .6, .1)), lh = dot(hz, vec3(.3, .6, .1));
  c = mix(c, hz, smoothstep(.24, .07, dn.y) * smoothstep(0., .35 * lh, lh - lc));
  float below = smoothstep(.02, -.12, dn.y);
  return mix(c, hz * (1. - .25 * below), max(below, smoothstep(.07, 0., dn.y) * .55));
}
vec3 arwHaze(vec3 col, vec3 wp){
  vec3 v = wp - cameraPosition; float dist = length(v);
  float dn = dist * uFogK * (1. + 1.2 * exp(-max(wp.y, 0.) * .03));
  float f = 1. - exp(-dn * dn * 1.9 - dn * .3);
  vec3 hz = mix(uFogCool, uFogWarm, azWarm(v / max(dist, 1e-3)));
  return mix(col, hz, clamp(f, 0., .96));
}
// a lamp standard of the kerb lattice (index k, side -1 or 1): lit, steady, where its own draw from the lamps' stream
// lies under the hour's share; none stands in a cross street's roadway
float lampOn(float k, float side){ int i = int(clamp(k + 9., 0., 18.)) * 2 + (side > 0. ? 1 : 0); return step(uLampDraw[i], uLampShare); }
float lampHere(float lz){ float a = step(-5.5, lz) * step(lz, 19.5), b = step(-127.5, lz) * step(lz, -98.5), c = step(-238.5, lz) * step(lz, -223.5); return (1. - max(a, max(b, c))) * step(-262., lz) * step(lz, 320.); }
// how much of a ray from p along d gets past the buildings' boxes (1 clear, 0 blocked), soft at the edges
float cityRay(vec3 p, vec3 d, float soft){
  vec3 sg = vec3(d.x < 0. ? -1. : 1., d.y < 0. ? -1. : 1., d.z < 0. ? -1. : 1.);
  vec3 inv = sg / max(abs(d), vec3(1e-4));
  float lit = 1.;
  for (int i = 0; i < ${MAXB}; i++) {
    vec4 b = uBox[i]; float h = uBoxH[i];
    vec3 t0 = (vec3(b.x, -1., b.y) - p) * inv, t1 = (vec3(b.z, h, b.w) - p) * inv;
    vec3 a = min(t0, t1), c = max(t0, t1);
    float tn = max(max(a.x, a.y), a.z), tf = min(min(c.x, c.y), c.z);
    lit *= 1. - clamp((tf - max(tn, 0.)) / soft, 0., 1.);
  }
  return lit;
}
// THE WET'S CEILING, one law for every puddle and all wet paving: its colour never stands over uWetCap in its
// brightest channel (set against the hour's exposure so that the lens sees it under 0.85 and under the bloom's
// threshold); under three quarters of the ceiling nothing is changed, over it the light is rolled off softly and
// keeps its hue, so what lies in the light (joints, bands, a pool's rim) is kept.
uniform float uWetCap;
vec3 arwCeil(vec3 c){ float m = max(c.r, max(c.g, c.b)), k = uWetCap * .75, s = uWetCap - k; return m > k ? c * ((k + s * (1. - exp(-(m - k) / s))) / m) : c; }
// THE RAIN'S POOLS on the square's and the terrace's paving, each where the plan laid it ([x, z, 1 / half breadth,
// 1 / half length]): 1 inside a pool, 0 outside, the rim a little uneven by the stone's own noise (nse, 0 to 1) and
// soft over a hand's breadth. All of it by place.
uniform vec4 uPool[${POOLS}];
float arwPools(vec2 xz, float nse){
  float m = 0.;
  for (int j = 0; j < ${POOLS}; j++) { vec4 q = uPool[j]; float e = length((xz - q.xy) * q.zw) + (nse - .5) * .2; m = max(m, 1. - smoothstep(.94, 1., e)); }
  return m;
}
// the arch's own long shadow: a point looks along the sun to the arch's plane (z -292) and asks whether a leg stands there
float archShade(vec3 p){
  float t = (-292. - p.z) / min(uSunDir.z, -.05);
  float hx = abs(p.x + t * uSunDir.x), hy = p.y + t * uSunDir.y;
  float s = clamp((hy - 5.) / 27.5, 0., 1.);
  float hw = mix(2.3, .9, s), soft = .22 + max(t, 0.) * .014;
  float sh = smoothstep(hw - soft, hw + soft, abs(hx - 9.6 * sqrt(max(1. - s * s, 0.))));
  return mix(1., sh, step(.5, t) * step(4.6, hy) * step(hy, 32.8) * step(.001, uSunK));
}
`;
export { layPlan, makeSunAt };
// THE PLAN OF A VISIT, dealt before anything is built, from streams of its own taken once in one list: the towers,
// their corners, the trees (the crowns' shapes and every tree's place and height); and, by rule with no draw, every
// lamp standard. What the animals part needs of it: env.sunBlocks, the towers of the sun's side as thin walls
// [z from, z to, x, height] that shade as the towers' boxes do; plan.standards, every lamp head [x, y, z];
// plan.treesLaid, every tree [x, ground y, z, height, kind].
export async function cityPlan(ctx, env, path) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('arw-city-' + name + ':' + ctx.seed));
  const P = { towers: stream('towers'), corners: stream('corners'), trees: stream('trees'), squareTrees: stream('square-trees'), median: stream('median') };
  const plan = layPlan(P.towers, env);
  // CORNERS, by a stream of their own: of the tall towers that are plain boxes, three in five (dealt by the seed) get
  // rounded corners (four flats to the quarter turn) or cut corners (one flat)
  const rcn = P.corners;
  const plainTall = [...plan.east, ...plan.west].flatMap((b) => b.t).filter((t) => t.h > 60 && !t.round && !t.setbacks && !t.fins && !t.crown);
  const dealt = plainTall.map((t) => ({ t, key: rcn(), cut: rcn() < 0.5, c: rcn.range(2.6, 4.2) })).sort((a, b) => a.key - b.key);
  dealt.forEach((o, k) => { if (k < Math.ceil(dealt.length * 0.6)) o.t.corner = { seg: o.cut ? 1 : 4, c: o.cut ? o.c : o.c + 1.6 }; });
  const sx = env.sunDir.x, sz = env.sunDir.z, west = sx < 0, blocks = [];
  for (const b of west ? plan.west : plan.east) for (const t of b.t) {
    const shift = (sz * (t.x1 - t.x0)) / Math.max(0.05, Math.abs(sx));
    blocks.push([t.z0 - Math.max(0, shift), t.z1 - Math.min(0, shift), west ? t.x1 : t.x0, t.h]);
  }
  env.sunBlocks = blocks.slice(0, 8);
  env.sunAt = makeSunAt(plan.boxes, env);
  plan.lamps = lampStandards();
  plan.standards = plan.lamps.map(([x, z, , , h]) => [x + (x > 0 ? -1.4 : 1.4), h - 0.3, z]);
  plan.trees = await layTrees(ctx, P.trees, path, plan, P.squareTrees, P.median);
  plan.treesLaid = [...plan.trees.list.map((t) => t.slice(0, 5)), ...stepPlanters().filter(([x, , z]) => tubClear(path, x, z)).map(([x, y, z]) => [x, y, z, 4.6, 1])];
  // the arch's measures as the animals take them: its plane, its feet either side of the axis, half a foot's breadth,
  // the terrace it stands on, its crown's height over the terrace
  plan.arch = { z: ARCH.z, foot: ARCH.half, leg: ARCH.broad / 2, base: ARCH.foot, rise: ARCH.rise };
  return plan;
}

// ---------------------------------------------------------------- geometry: quads with a style of wall
// fa = [style, seed, bay width m, floor height m]; uv in metres (u along the wall, v up).
// styles: 0 plain stone or roof, 1 punched windows in stone, 2 curtain wall, 3 glass behind fins, 4 terracotta panels,
// 5 bronze glass in bands, 6 stone ribs and glass, 7 podium bays (stone piers, tall glass, spandrel), 8 planted roof,
// 9 lamp head, 10 traffic lamp, 11 a roof lower than the flight (garden or working roof), 12 lantern, 13 bollard head
function makeGeo() {
  const P = [], N = [], U = [], C = [], F = [], I = [];
  const g = {
    tris: 0,
    quad(a, b, c, d, n, uv, col, fa) {
      const i = P.length / 3;
      P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
      // (n is one normal for the quad, or four, one to each corner, where the wall is round)
      for (let k = 0; k < 4; k++) { const m = Array.isArray(n[0]) ? n[k] : n; N.push(m[0], m[1], m[2]); C.push(col[0], col[1], col[2]); F.push(fa[0], fa[1], fa[2], fa[3]); }
      U.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[3]);
      I.push(i, i + 1, i + 2, i, i + 2, i + 3); g.tris += 2;
    },
    // an upright box; faces: w e s n t (west, east, south, north, top); roof takes roofFa and roofCol
    box(x0, x1, y0, y1, z0, z1, col, fa, roofCol, roofFa, faces = 'wesnt') {
      if (faces.includes('w')) g.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [z0, y0, z1, y1], col, fa);
      if (faces.includes('e')) g.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [z1, y0, z0, y1], col, fa);
      if (faces.includes('s')) g.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [x0, y0, x1, y1], col, fa);
      if (faces.includes('n')) g.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [x1, y0, x0, y1], col, fa);
      if (faces.includes('t')) g.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [x0, z1, x1, z0], roofCol || col, roofFa || [0, fa[1], 3, 3]);
    },
    toGeometry() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      geo.setAttribute('fa', new THREE.Float32BufferAttribute(F, 4));
      geo.setIndex(I); geo.computeBoundingSphere();
      return geo;
    },
  };
  return g;
}

const VERT_WALL = /* glsl */`
attribute vec4 fa; attribute vec3 color;
varying vec3 vW, vN, vC; varying vec2 vUv; varying vec4 vFa;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = color; vUv = uv; vFa = fa;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// The wall of every building: stone, panels and surrounds lit by the sky and, where it reaches, the sun; glass that
// mirrors the sky and the towers opposite; a fifth of the panes lit behind blinds. No inside is drawn.
const fragWall = (animalsGlsl) => /* glsl */`
varying vec3 vW, vN, vC; varying vec2 vUv; varying vec4 vFa;
${GLSL_COMMON}
${animalsGlsl}
// EVERY EDGE OF A WALL'S PATTERN IS TAKEN OVER THE PIXEL'S OWN FOOTPRINT: bandAA is the share of a footprint w (in
// cells) about x that lies in the band a..b of every cell, so a band's edge holds clean however the wall is turned and a
// band too fine to tell runs to its own mean; holeAA is an opening about a cell's middle (half breadths h)
float bandI(float x, float a, float b){ return floor(x) * (b - a) + clamp(fract(x) - a, 0., b - a); }
float bandAA(float x, float a, float b, float w){ return (bandI(x + .5 * w, a, b) - bandI(x - .5 * w, a, b)) / w; }
vec2 holeAA(vec2 q, vec2 h, vec2 w){ return 1. - smoothstep(h - w, h + w, q); }
void main(){
  vec3 n = normalize(vN); vec3 Vd = vW - cameraPosition; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-3);
  float style = floor(vFa.x + .5), seed = floor(vFa.y * 128. + .5) / 128.;
  vec2 cs = vec2(max(vFa.z, .4), max(vFa.w, .4));
  vec2 cell = vUv / cs; vec2 fw = fwidth(cell); float lod = clamp(1.3 - max(fw.x, fw.y) * 1.6, 0., 1.);
  vec2 aw = clamp(fw, vec2(.002), vec2(4.)), bfw = vec2(fwidth(vUv.x), fwidth(vW.y)); float lvw = clamp(fwidth(vUv.y) / .3, .002, 8.), shopK = 1.;
  vec2 id = floor(cell), f = fract(cell);
  float rnd = hash21(id + seed * 311.7), rnd2 = hash21(id * 1.7 + seed * 91.3 + 7.);
  // g: glass share, sp: spandrel or panel share (the rest is surround or stone); avg: the glass share seen from far
  float g = 0., sp = 0., avg = 0., rel = 0., jamb = 0., baseLit = 0.;
  float lant = step(11.5, style) * step(style, 12.5), roofK = step(10.5, style) * step(style, 11.5);
  // a window in stone sits back in its wall: the pane is found along the eye's own line through the opening, so the
  // jambs, the head and the sill show (the tangent along the wall is read from the wall's own metres)
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); vec2 dux = dFdx(vUv), duy = dFdy(vUv);
  vec3 tu = normalize((dpx * duy.y - dpy * dux.y) * sign(dux.x * duy.y - duy.x * dux.y) + vec3(1e-6, 0., 1e-6));
  vec2 po = vec2(dot(V, tu), V.y) / max(-dot(V, n), .25) / cs;
  vec3 surCol = vC, spCol = vC * .55, tint = vec3(.78, .86, .95);
  if (style < .5) { g = 0.; rel = smoothstep(.035, .0, min(f.x, f.y)) * 1.1; }
  else if (style < 1.5) { vec2 q = abs(f - vec2(.5, .54)), q2 = abs(f + po * .42 - vec2(.5, .54)); vec2 o1 = holeAA(q, vec2(.26, .31), aw * .7), o2 = holeAA(q2, vec2(.26, .31), aw * .7), o3 = holeAA(q, vec2(.3, .35), aw * .7); float op = o1.x * o1.y; g = op * o2.x * o2.y; jamb = op - g; avg = .30; rel = o3.x * o3.y * (1. - op); }
  else if (style < 2.5) { float bx = bandAA(cell.x, .035, .965, aw.x); g = bx * bandAA(cell.y, .2, 1., aw.y); sp = bx * bandAA(cell.y, 0., .2, aw.y); avg = .74; spCol = vC * .42; tint = vec3(.72, .84, .98); }
  else if (style < 3.5) { float bx = bandAA(cell.x, .14, .86, aw.x); g = bx * bandAA(cell.y, .16, 1., aw.y); sp = bx * bandAA(cell.y, 0., .16, aw.y); avg = .6; spCol = vC * .5; rel = 1. - bx; tint = vec3(.70, .88, .90); }
  else if (style < 4.5) { vec2 q = abs(f - vec2(.5, .5)), q2 = abs(f + po * .32 - vec2(.5, .5)); vec2 o1 = holeAA(q, vec2(.2, .36), aw * .7), o2 = holeAA(q2, vec2(.2, .36), aw * .7), o3 = holeAA(q, vec2(.24, .4), aw * .7); float op = o1.x * o1.y; g = op * o2.x * o2.y; jamb = op - g; avg = .26; rel = o3.x * o3.y * (1. - op); }
  else if (style < 5.5) { g = bandAA(cell.x, .03, .97, aw.x) * bandAA(cell.y, .3, 1., aw.y); sp = bandAA(cell.y, 0., .3, aw.y); avg = .68; spCol = vC * .5; tint = vec3(1., .80, .56); }
  else if (style < 6.5) { float bx = bandAA(cell.x, .3, .97, aw.x); g = bx * bandAA(cell.y, .12, 1., aw.y); sp = bandAA(cell.y, 0., .12, aw.y) * bandAA(cell.x, .3, 1., aw.x); avg = .58; spCol = vC * .35; tint = vec3(.76, .85, .96); }
  else if (style < 7.5) { g = bandAA(cell.x, .2, .98, aw.x) * bandAA(cell.y, .1, .86, aw.y) * (1. - bandAA(cell.x, .448, .472, aw.x)) * (1. - bandAA(cell.x, .708, .732, aw.x)) * (1. - bandAA(cell.y, .488, .512, aw.y)); sp = bandAA(cell.y, .86, 1., aw.y) * bandAA(cell.x, .2, 1., aw.x); avg = .6; spCol = vC * .62; tint = vec3(.74, .84, .94); }
  else if (lant > .5) { g = bandAA(cell.x, .07, .93, aw.x) * bandAA(cell.y, .05, 1., aw.y); avg = .86; tint = vec3(1., .93, .82); }
  else { g = 0.; }
  // the base of every building that stands on the street: a glazed ground floor of double height (7.4 m), its bays
  // twice the wall's own, a transom at 4.2 m, warm light behind half of its panes
  if (style > .5 && style < 7.5 && abs(n.y) < .5 && vW.y < 7.4 && vW.y > 0. && vW.z > -262.5) {
    float bk = cs.x * (cs.x > 5. ? 1. : 2.); vec2 bc = vec2(vUv.x / bk, vW.y / 7.4), bw = clamp(bfw / vec2(bk, 7.4), vec2(.002), vec2(4.));
    g = bandAA(bc.x, .05, .95, bw.x) * bandAA(bc.y, .07, .93, bw.y) * (1. - bandAA(bc.y, .558, .582, bw.y));
    sp = 0.; rel = 0.; jamb = 0.; avg = .78; tint = vec3(.88, .91, .93); baseLit = 1.;
    rnd = hash21(vec2(floor(bc.x), 7.) + seed * 51.); rnd2 = hash21(vec2(floor(bc.x), 3.) + seed * 17.);
    // north of street B every base is a row of SHOPFRONTS: three panes to the bay between slim mullions, dark glass,
    // every bay lit warm behind (each to its own strength), brightest under its ceiling and dimmer down to the stall
    if (vW.z < ${(SHOP_Z + 0.1).toFixed(1)}) {
      g *= 1. - bandAA(bc.x * 3. + .5, .47, .53, bw.x * 3.);
      shopK = (.45 + .95 * smoothstep(.07, .57, bc.y)) * (.7 + .6 * rnd2); rnd *= .5; tint = vec3(.62, .68, .74);
    }
  }
  g = mix(avg, g, lod); sp *= lod;
  // by the deal of each wall's own number, a glass wall carries a plant floor every eighteen floors (its first by the
  // wall's number): a dark louvred band with no glass, so no tall wall is one grid from foot to top
  float mech = bandAA((cell.y + floor(seed * 18.)) / 18., 0., 1. / 18., aw.y / 18.) * step(1.5, style) * step(style, 6.5) * (1. - step(3.5, style) * step(style, 4.5)) * step(12., vW.y);
  g *= 1. - mech; sp = mix(sp, 1., mech); rel *= 1. - mech;
  // stone, panels and surrounds
  float grain = nz(vUv * .09 + seed) * .5 + nz2(vUv * .9) * .5;
  vec3 alb = mix(surCol, spCol, sp) * (.82 + .36 * grain) * (1. - .22 * rel * lod);
  if (style > 7.5 && style < 8.5) { float pl = nz(vUv * .035 + seed * 3.); alb = mix(vC, vec3(.10, .17, .07), smoothstep(.45, .6, pl)) * (.8 + .4 * grain); }
  float streak = nz(vec2(vUv.x * .21, vUv.y * .012) + seed * 5.);
  alb *= 1. - .2 * smoothstep(.5, .8, streak) * step(.5, style) ;
  alb *= 1. - .5 * jamb * lod;
  alb *= 1. - mech * (.3 + .25 * bandAA(vUv.y / .3, .5, 1., lvw));
  // every roof lower than the flight is a roof at work or a roof garden, dealt in cells of 7 m by the roof's own seed:
  // wet paving, planting beds, glowing skylights, gravel, timber decks; paths of paving run between the cells
  vec2 rc = vW.xz / 7.; vec2 rf = fract(rc), ri = floor(rc); float rl = clamp(1.3 - max(fwidth(rc.x), fwidth(rc.y)) * 1.6, 0., 1.);
  float rk = hash21(ri + seed * 77.), inset = step(.09, rf.x) * step(rf.x, .91) * step(.09, rf.y) * step(rf.y, .91);
  vec2 rs = vW.xz / vec2(.9, .6); vec2 rsf = abs(fract(rs) - .5);
  float rjt = smoothstep(.44, .5, max(rsf.x, rsf.y)) * clamp(1.4 - max(fwidth(rs.x), fwidth(rs.y)) * 3., 0., 1.);
  vec3 pav = vec3(.33, .31, .29) * (.85 + .3 * hash21(floor(rs))) * (1. - .4 * rjt);
  vec3 bed = mix(vec3(.045, .09, .03), vec3(.12, .19, .055), nz2(vW.xz * .8 + seed)) * (.75 + .5 * nz(vW.xz * 2.3));
  vec3 grav = vec3(.21, .205, .2) * (.7 + .6 * nz2(vW.xz * 3.1));
  vec3 deck = vec3(.22, .14, .085) * (.8 + .4 * hash21(vec2(floor(vW.x / .16), ri.y)));
  float isBed = step(rk, .30) * inset * rl * roofK, isSkyL = step(.30, rk) * step(rk, .39) * inset * rl * roofK;
  vec3 ralb = mix(pav, bed, isBed); ralb = mix(ralb, grav, step(.39, rk) * step(rk, .50) * rl); ralb = mix(ralb, deck, step(.50, rk) * step(rk, .60) * inset * rl);
  alb = mix(alb, ralb, roofK);
  // the animals' shadows are deepened (the world's turn must tell) and lie on glass too, as a dimmer mirror
  float ash = arwShade(vW); ash = ash * ash * ash; float lit0 = cityRay(vW + n * .08, uSunDir, 5.);
  float sunVis = lit0 * ash * archShade(vW + n * .3);
  float ndl = min(max(dot(n, uSunDir), 0.), .7) * uSunK;
  vec3 amb = uSkyAmb * (.62 + .38 * n.y) + uGroundAmb * .30 * (1. - n.y) * exp(-max(vW.y, 0.) * .02);
  float inSun = clamp(sunVis * ndl * 2.5, 0., 1.);
  amb *= mix(vec3(1.33, 1.40, 1.64), vec3(1.), inSun);
  if (style < .5) alb *= .88 + .24 * rnd * lod;
  vec3 matte = alb * (amb + uSunCol * ndl * sunVis * .80);
  // GLASS, one rule for every pane: it shows the sky's own colours in the mirrored direction (rose and gold toward the
  // low sun, blue-violet away from it, the cloud's lit edges), dark where a tower of the plan stands in the mirrored
  // ray, more of a mirror the more it is seen along itself. Each pane leans a hair its own way and no sheet is flat,
  // so the mirrored sky breaks from pane to pane and bends a little inside each.
  vec3 tx = normalize(vec3(n.z, 0., -n.x) + vec3(1e-4, 0., 0.));
  vec2 wv = vec2(nz(vUv * .37 + seed * 9.), nz2(vUv * .41 + 3.7)) - .5;
  vec3 gn = normalize(n + (tx * ((rnd - .5) * .05 + wv.x * .035) + vec3(0., 1., 0.) * ((rnd2 - .5) * .05 + wv.y * .035)) * lod);
  vec3 R = reflect(V, gn);
  float fres = .40 + .60 * pow(1. - clamp(dot(-V, gn), 0., 1.), 3.);
  float open = cityRay(vW + n * .6, R, 4.);
  // (the mirrored sky's cloud is read as finely as the wall's own pattern can be told: at its finest on a near wall,
  // so no pane shows it in coarse blots, and coarser, as before, where the panes run together)
  gNzLod = 2.2 * (1. - lod); vec3 sk = arwSky(R, sunVis * open); gNzLod = 0.;
  vec3 opp = (uSkyAmb * .22 + uSunCol * .03) * (.75 + .5 * nz(R.zy * 2.3 + R.x));
  vec3 refl = mix(opp, sk, open);
  vec3 glass = refl * mix(tint, vec3(1.), .45) * fres * (.6 + .4 * mix(1., ash, lit0)) + tint * uSkyAmb * .07 + uSunCol * mix(tint, vec3(1.), .6) * ndl * sunVis * .34;
  // glass turned to the sun carries the sun's own glow where its mirror looks toward it (a broad warm sheen about the
  // mirrored sun, broken from pane to pane by each pane's lean)
  float sg = max(dot(R, uSunDir), 0.); sg *= sg; sg *= sg; sg *= sg;
  glass += uSunCol * mix(tint, vec3(1.), .5) * sg * .16 * sunVis * open * step(.001, ndl) * uSunK;
  // lit rooms behind: warm, each blind at its own height; the glazed base is lit behind half of its panes, a lantern
  // behind all of them
  // (by the deal of each wall's own number: a tower's share of lit panes is its own, one in fourteen to one in five,
  // and on one floor in eight the lights are on along the floor, three panes in five; steady, no clock)
  float tShare = mix(.07, .20, hash21(vec2(seed * 57.3, 1.7))), flOn = step(hash21(vec2(id.y * 1.31, seed * 131.1)), .125);
  float onP = max(step(rnd, mix(tShare, .6, flOn) * (.6 + .8 * uLamps)) * (1. - .75 * inSun), max(baseLit * step(rnd, .5), lant)) * lod;
  float blind = max(smoothstep(-aw.y, .02 + aw.y, f.y - (.2 + .55 * rnd2)), max(baseLit, lant));
  vec3 pane = mix(vec3(1., .76, .46), vec3(1., .88, .70), step(.6, rnd2)) * (.5 + .55 * blind) * (.6 + .5 * hash21(id + 3.3)) * (.6 + .9 * lant) * (1. - .22 * baseLit) * shopK;
  glass = mix(glass, glass * .4 + pane, onP);
  glass = mix(glass, vec3(1., .84, .6) * 1.3, lant * (1. - lod) * .8);
  glass += vec3(1., .80, .55) * avg * .09 * uLamps * (1. - lod) * step(.5, style);
  // from afar, where the panes can no longer be told apart, a few lit rooms still show, in groups of floors: on the far
  // city only (beyond the avenue's own lots, x within 100 m and z from the steps to 345), so that no wall near the line
  // carries blocks coarser than its own panes
  glass += vec3(1., .78, .5) * step(.88, hash21(floor(vUv / vec2(9., 8.)) + seed * 13.)) * (1. - lod) * (.35 + .5 * uLamps) * step(.5, style) * step(style, 7.5) * max(step(100., abs(vW.x)), max(step(vW.z, -262.), step(345., vW.z)));
  vec3 col = mix(matte, glass, g);
  // stone that lies flat under the sky (the terrace, the treads, the plaza's levels, roofs) is wet: slabs of their own
  // tone, puddles, the sky in them, and before the arch the portal's light standing mirrored in the wet
  if ((style < .5 || roofK > .5) && n.y > .9) {
    float pn = nz(vW.xz * .023 + seed) * .6 + nz2(vW.xz * .075) * .4;
    float pud = smoothstep(.5, .63, pn) * (1. - isBed);
    // the terrace holds the rain in its paving's low places as the square does (uPool); no other puddle lies on it
    float onT = step(vW.z, -262.5) * step(4.9, vW.y) * step(vW.y, 5.1);
    float poolT = onT * arwPools(vW.xz, nz2(vW.xz * .06)); pud = mix(pud, poolT, onT);
    float fr = 1. - clamp(dot(-V, gn), 0., 1.); float fr2 = fr * fr; float f5 = .04 + .96 * fr2 * fr2 * fr;
    vec3 wetc = col * (.40 + .20 * rnd * lod) * (1. - .28 * pud) * mix(1., .74, step(vW.z, -262.5));
    // the terrace's paving in two stones, as the square's: bays of 12 m, every other one a shade deeper, between dark
    // bands 1.2 m broad on every bay line
    float bandT =step(abs(fract(vW.x / 12. + .5) - .5), .05) + step(abs(fract(vW.z / 12.) - .5), .05);
    wetc *= (1. - .6 * clamp(bandT, 0., 1.) * onT) * (1. - .16 * mod(floor(vW.x / 12. + .5) + floor(vW.z / 12.), 2.) * onT);
    float rz = min(R.z, -.02); float tz = (-292. - vW.z) / rz; vec3 hit = vW + R * tz;
    float sft = .5 + max(tz, 0.) * .07;
    float pm = smoothstep(6. + sft, 6. - sft, abs(hit.x)) * smoothstep(9. + sft * 2., 9. - sft * 2., abs(hit.y - 15.)) * step(-291.5, vW.z) * step(0., tz) * step(vW.z, -240.);
    wetc = mix(wetc, col, isBed);
    // THE RING IN A PUDDLE, one rule for every puddle: the ring's mirror image tops the mirror's own light up to the
    // four fifths of the wet's ceiling (uWetCap) and never past it,
    // in the ring's own hue, and it is seen through shallow water: the stone's joints and its dark bands stand darker
    // in it. So a puddle before the arch glows warm, shows its paving and its own rim, and never burns out.
    vec4 am = arwMirror(vW, R); vec3 mirB = mix(refl, am.rgb, clamp(am.a, 0., 1.));
    vec3 ringHue = uPortalCol / max(max(uPortalCol.r, uPortalCol.g), max(uPortalCol.b, 1e-3));
    float ringTop = max(uWetCap * .8 - max(mirB.r, max(mirB.g, mirB.b)), 0.);
    vec3 mir = mirB + ringHue * ringTop * pm * (1. - .5 * rel * lod) * (1. - .5 * clamp(bandT, 0., 1.) * onT);
    // (the terrace's dark bands are a rough stone: they mirror a third as much, so its grid tells in the wet too)
    col = mix(wetc, mir, clamp(f5 * mix(.5, 1., pud) + pud * .05 + poolT * .2, 0., 1.) * (1. - isBed) * (1. - .65 * clamp(bandT, 0., 1.) * onT * (1. - poolT)));
  }
  col = mix(col, vec3(1., .82, .58) * (.5 + .4 * uLamps) * (.7 + .3 * step(.04, abs(fract(rc.x * 3.) - .5))), isSkyL);
  vec3 pl = vW - uPortal; col += alb * (1. - g) * uPortalCol * 70. / (dot(pl, pl) + 60.) * max(dot(n, normalize(-pl)), 0.15) * step(vW.z, -255.);
  if ((style < .5 || roofK > .5) && n.y > .9) col = arwCeil(col);
  if (style > 8.5 && style < 9.5) { float on = step(vFa.y, uLampShare); col = mix(vC * .25, vec3(1., .80, .55) * 4.5, on); }
  if (style > 12.5) col = vec3(1., .80, .55) * 3.2;
  if (style > 9.5 && style < 10.5) { float ph = fract(uTime / 26. + vFa.z); float gr = step(ph, .42), am = step(.42, ph) * step(ph, .5), rd = step(.5, ph);
    float which = vFa.y < .25 ? rd : (vFa.y < .75 ? am : gr); vec3 lc = vFa.y < .25 ? vec3(1., .12, .08) : (vFa.y < .75 ? vec3(1., .62, .1) : vec3(.15, 1., .45));
    col = mix(vec3(.02), lc * 3.2, which); }
  gl_FragColor = vec4(arwHaze(col, vW), 1.);
}`;

function wallMaterial(U, animals) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_WALL, fragmentShader: fragWall(animals.glsl) });
}

// ---------------------------------------------------------------- the plan: every building as its boxes (dealt by the seed)
const COL = {
  lime: lin('#c6bca6'), granite: lin('#958e88'), terra: lin('#a9684e'), bronze: lin('#5a4634'), steel: lin('#8a9aac'),
  dark: lin('#33373e'), conc: lin('#a8a49c'), roof: lin('#5d5f66'), pale: lin('#a8a090'), blue: lin('#6f8298'), green: lin('#78958c'),
};
function layPlan(r, env) {
  const hv = (h) => Math.round(h * r.range(0.93, 1.07));
  const sd = () => r.range(0.05, 0.95);
  // one rule for the west towers (the brief: towers on low podiums with gaps so the low sun comes through): each shaft
  // stands on the north three quarters of its block, the south quarter stays a low podium roof
  const northPart = (zNorth, zSouth) => zNorth + (zSouth - zNorth) * 0.75;
  const east = [
    { n: 'E1', z0: 150, z1: 300, pod: 16, px: 72, podCol: COL.lime, t: [{ x0: 32, x1: 66, z0: 160, z1: 290, h: hv(120), style: 1, col: COL.lime, bay: 3.4, fl: 3.9, crown: 3 }] },
    { n: 'E2', z0: 60, z1: 150, pod: 14, px: 66, podCol: COL.granite, t: [{ x0: 33, x1: 57, z0: 68, z1: 142, h: hv(180), style: 3, col: COL.steel, bay: 3.0, fl: 4.0, fins: 1 }] },
    { n: 'E3', z0: 22, z1: 60, pod: 0, px: 60, podCol: COL.terra, t: [{ x0: 26, x1: 60, z0: 22, z1: 60, h: hv(45), style: 4, col: COL.terra, bay: 3.2, fl: 3.75, garden: 1 }] },
    { n: 'E4', z0: -50, z1: -8, pod: 0, px: 44, podCol: COL.pale, plaza: 1, t: [{ x0: 44, x1: 82, z0: -48, z1: -12, h: hv(150), style: 2, col: COL.green, bay: 1.6, fl: 3.9, round: 1 }] },
    { n: 'E5', z0: -96, z1: -50, pod: 18, px: 72, podCol: COL.bronze, t: [{ x0: 31, x1: 66, z0: -93, z1: -53, h: hv(200), style: 5, col: COL.bronze, bay: 1.8, fl: 3.85, setbacks: 1 }] },
    { n: 'E6', z0: -222, z1: -130, pod: 20, px: 92, podCol: COL.lime, roofGarden: 1, t: [
      { x0: 64, x1: 84, z0: -162, z1: -138, h: hv(110), style: 2, col: COL.blue, bay: 1.5, fl: 3.8 },
      { x0: 66, x1: 86, z0: -216, z1: -192, h: hv(140), style: 6, col: COL.pale, bay: 2.4, fl: 3.8 }] },
    { n: 'E7', z0: -262, z1: -240, pod: 0, px: 56, podCol: COL.granite, t: [{ x0: 26, x1: 56, z0: -262, z1: -240, h: hv(24), style: 1, col: COL.granite, bay: 3.6, fl: 4.0 }] },
  ];
  const west = [
    { n: 'W0', z0: 262, z1: 330, pod: 10, px: -64, podCol: COL.granite, t: [{ x0: -58, x1: -40, z0: 262, z1: northPart(262, 330), h: hv(140), style: 5, col: COL.bronze, bay: 1.8, fl: 3.9 }] },
    { n: 'W1', z0: 150, z1: 240, pod: 10, px: -64, podCol: COL.conc, t: [{ x0: -58, x1: -40, z0: 150, z1: northPart(150, 240), h: hv(160), style: 2, col: COL.steel, bay: 1.5, fl: 3.9 }] },
    { n: 'W2', z0: 35, z1: 115, pod: 10, px: -64, podCol: COL.pale, t: [{ x0: -58, x1: -40, z0: 35, z1: northPart(35, 115), h: hv(130), style: 6, col: COL.pale, bay: 2.6, fl: 3.8 }] },
    { n: 'W3', z0: -96, z1: -8, pod: 8, px: -64, podCol: COL.granite, t: [{ x0: -58, x1: -40, z0: -96, z1: northPart(-96, -8), h: hv(170), style: 2, col: COL.blue, bay: 3.0, fl: 4.0 }] },
    { n: 'W5', z0: -262, z1: -240, pod: 0, px: -44, podCol: COL.lime, t: [{ x0: -44, x1: -26, z0: -262, z1: -240, h: hv(22), style: 4, col: COL.lime, bay: 3.4, fl: 3.7 }] },
    { n: 'WS1', z0: -178, z1: -130, pod: 0, px: -160, podCol: COL.conc, t: [{ x0: -160, x1: -124, z0: -178, z1: -130, h: hv(26), style: 1, col: COL.conc, bay: 3.2, fl: 3.6 }] },
    { n: 'WS2', z0: -222, z1: -184, pod: 0, px: -160, podCol: COL.terra, t: [{ x0: -164, x1: -124, z0: -222, z1: -184, h: hv(31), style: 4, col: COL.terra, bay: 3.2, fl: 3.6 }] },
  ];
  for (const b of [...east, ...west]) { b.seed = sd(); for (const t of b.t) t.seed = sd(); }
  // the boxes that stand in the sun's way and in the mirrors: [x0, z0, x1, z1, h]
  const boxes = [];
  for (const b of east) { if (b.pod > 0) boxes.push([26, b.z0, b.px, b.z1, b.pod]); for (const t of b.t) boxes.push([t.x0, t.z0, t.x1, t.z1, t.h]); }
  for (const b of west) { if (b.pod > 0) boxes.push([b.px, b.z0, -26, b.z1, b.pod]); for (const t of b.t) boxes.push([t.x0, t.z0, t.x1, t.z1, t.h]); }
  return { east, west, boxes };
}

// the same law as the shader's cityRay, on the processor (for what is tinted per thing: tree crowns, lamps)
function makeSunAt(boxes, env) {
  const d = env.sunDir;
  return (x, y, z, soft = 5) => {
    if (env.sunK <= 0) return 0;
    let lit = 1;
    for (const b of boxes) {
      let tn = -1e9, tf = 1e9;
      const lo = [b[0], -1, b[1]], hi = [b[2], b[4], b[3]], p = [x, y, z], dd = [d.x, d.y, d.z];
      for (let k = 0; k < 3; k++) {
        const inv = 1 / (Math.abs(dd[k]) < 1e-4 ? (dd[k] < 0 ? -1e-4 : 1e-4) : dd[k]);
        const a = (lo[k] - p[k]) * inv, c = (hi[k] - p[k]) * inv;
        tn = Math.max(tn, Math.min(a, c)); tf = Math.min(tf, Math.max(a, c));
      }
      lit *= 1 - clamp((tf - Math.max(tn, 0)) / soft, 0, 1);
    }
    return lit;
  };
}

// walls of the plan in their first form: podium, tower, roof
function buildWalls(g, plan) {
  for (const b of [...plan.east, ...plan.west]) {
    const eastSide = b.n[0] === 'E';
    if (b.pod > 0) {
      const x0 = eastSide ? 26 : b.px, x1 = eastSide ? b.px : -26;
      // (a podium north of street B is a street wall: windows in stone, three rows over its shopfronts; see enrich)
      g.box(x0, x1, 0, b.pod, b.z0, b.z1, b.podCol, b.z1 <= SHOP_Z ? [1, b.seed, 3.2, 3.7] : [7, b.seed, 6.4, b.pod / 2], COL.roof, [11, b.seed, 3, 3]);
    }
    for (const t of b.t) {
      const y0 = b.pod > 0 ? b.pod : 0;
      if (t.round || t.setbacks || t.corner) continue;
      g.box(t.x0, t.x1, y0, t.h, t.z0, t.z1, t.col, [t.style, t.seed, t.bay, t.fl], t.garden ? COL.terra : COL.roof, [t.h < 34 ? 11 : 0, t.seed, 3, 3]);
    }
  }
}

// ---------------------------------------------------------------- the ground: street, pavements, square, far streets
const VERT_GROUND = /* glsl */`
varying vec3 vW;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const fragGround = (animalsGlsl) => /* glsl */`
varying vec3 vW;
${GLSL_COMMON}
${animalsGlsl}
float band(float x, float a, float b){ return step(a, x) * step(x, b); }
uniform vec3 uSqLamp[${SQ_LAMPS}];
void main(){
  vec3 p = vW; vec3 Vd = p - cameraPosition; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-3);
  float ax = abs(p.x), z = p.z;
  float fwp = max(fwidth(p.x), fwidth(p.z));
  // where we are: the avenue between the faces, a cross street, the square, or the far city's ground
  float inAve = step(ax, 26.) * step(-262., z);
  float cA = band(z, -8., 22.), cB = band(z, -130., -96.), cC = band(z, -240., -222.);
  float cross = max(cA, max(cB, cC));
  float crossRoad = max(band(z, -4., 18.), max(band(z, -126., -100.), band(z, -237., -225.)));
  float sq = band(p.x, -120., -26.) * band(z, -215., -135.);
  float road = max(inAve * band(ax, 4., 15.) * step(-237., z), crossRoad * step(-262., z)) * (1. - sq);
  float median = inAve * step(ax, 4.) * (1. - crossRoad) * step(${MEDIAN_END.toFixed(1)}, z);
  float far = (1. - inAve) * (1. - cross) * (1. - sq);
  // far streets: a plain grid of dark streets between pale blocks
  vec2 gq = abs(fract(vec2(p.x + 13., z + 4.) / vec2(92., 118.)) - .5) * vec2(92., 118.);
  float farRoad = far * step(min(gq.x, gq.y), 7.) * step(26.5, ax);
  road = max(road, farRoad);
  // materials
  float n1 = nz(p.xz * .013), n2 = nz2(p.xz * .06), n3 = nz(p.xz * .31 + .37);
  vec3 asph = vec3(.028, .031, .04) * (.8 + .5 * n3);
  vec2 sl = p.xz / vec2(1.2, .6); sl.x += .5 * floor(sl.y); vec2 sf = abs(fract(sl) - .5);
  float joint = smoothstep(.46, .5, max(sf.x, sf.y)) * clamp(1.4 - fwp * 3., 0., 1.);
  vec3 slab = vec3(.36, .335, .30) * (.86 + .28 * hash21(floor(sl))) * (1. - .45 * joint);
  vec2 bq = p.xz / 3.; vec2 bf = abs(fract(bq) - .5);
  float bj = smoothstep(.47, .5, max(bf.x, bf.y)) * clamp(1.4 - fwp, 0., 1.);
  // the square's paving in two stones: bays of 12 by 10 m of a pale honed stone in slabs of 3 m, every other bay a
  // shade deeper, between bands 1.2 m broad of a dark flamed stone on every bay line (x = 12 k, z = 10 k); the benches,
  // planters, standards and vents stand by this grid
  vec2 by = vec2(p.x / ${SQ_BAY[0].toFixed(1)}, z / ${SQ_BAY[1].toFixed(1)}); vec2 bd = abs(fract(by + .5) - .5) * vec2(${SQ_BAY[0].toFixed(1)}, ${SQ_BAY[1].toFixed(1)});
  float be = clamp(fwp, .02, .55);
  float bandS = mix(.21, 1. - smoothstep(.6 - be, .6 + be, min(bd.x, bd.y)), clamp(2.2 - fwp * 1.2, 0., 1.));
  float chk = mod(floor(by.x) + floor(by.y), 2.);
  vec3 sqc = mix(vec3(.30, .28, .25), vec3(.235, .222, .21), chk) * (.9 + .2 * hash21(floor(bq))) * (1. - .4 * bj);
  sqc = mix(sqc, vec3(.075, .08, .095) * (.85 + .3 * n3), bandS);
  vec3 soil = mix(vec3(.09, .075, .05), vec3(.07, .12, .045), smoothstep(.35, .6, n2)) * (.8 + .5 * n3);
  vec3 alb = mix(slab, sqc, sq);
  alb = mix(alb, asph, road);
  // plain lane lines: two dashed lines and two edge lines to each carriageway
  float lane = inAve * (1. - cross) * step(-222., z);
  float dash = step(fract(z / 9.), .34);
  float ln = (smoothstep(.16, .08, abs(ax - 7.7)) + smoothstep(.16, .08, abs(ax - 11.3))) * dash + smoothstep(.14, .07, abs(ax - 4.35)) + smoothstep(.14, .07, abs(ax - 14.65));
  alb = mix(alb, vec3(.62, .62, .58), clamp(ln, 0., 1.) * lane * .85 * clamp(1.5 - fwp * 2., 0., 1.));
  float kerb = inAve * (1. - crossRoad) * step(-237., z) * (smoothstep(.22, .12, abs(ax - 15.2)) + smoothstep(.22, .12, abs(ax - 3.8)) * step(-222., z));
  alb = mix(alb, soil, median * step(ax, 3.6));
  alb = mix(alb, vec3(.55, .53, .5), clamp(kerb, 0., 1.));
  // wet: a film nearly everywhere, puddles along the kerbs, in dips and in the joints; dry under the trees;
  // on the square's honed paving the water stands broad and shallow with a clean edge
  float underTree = inAve * (1. - cross) * (smoothstep(5.5, 3., abs(ax - 17.5)) * .7 + smoothstep(7., 4., ax)) * smoothstep(.3, .6, n2 + n1 * .5);
  float gutter = road * smoothstep(1.6, .2, abs(ax - 14.4)) * inAve;
  float pud = smoothstep(.52 + .03 * sq, .62 - .04 * sq, n1 * .55 + n2 * .45 + gutter * .34 + joint * .1 * (1. - road) + sq * .06) * (1. - median);
  // THE SQUARE HOLDS THE RAIN in its paving's low places: broad shallow pools laid by the seed (uPool), clear of every
  // bench, planter, tree pit and vent; no other puddle lies on the square, and the paving between the pools is wet and
  // darker. A pool is the stone's own wet at its smoothest: it mirrors the sky and whatever stands over it.
  float rain = sq * arwPools(p.xz, n2);
  pud = mix(pud, rain, sq);
  float film = clamp(.55 + .6 * (n2 - .4) + road * .2 - underTree * .7, 0.05, 1.) * (1. - .8 * median);
  float wet = clamp(max(pud, film * .62), 0., 1.);
  alb *= (1. - .45 * wet) * (1. - .2 * sq * (1. - rain));
  // light by place: the sun through the buildings, the animals' shadows, the sky, the portal's light
  float ash = arwShade(p); ash = ash * ash * ash;
  float sunVis = cityRay(p + vec3(0., .1, 0.), uSunDir, 7.) * ash * archShade(p);
  vec3 amb = uSkyAmb * (.80 - .25 * inAve * smoothstep(8., 3., abs(ax - 17.5)) * (1. - cross)) * mix(vec3(1.31, 1.36, 1.56), vec3(1.), sunVis);
  vec3 pl = p - uPortal; float pd2 = dot(pl, pl);
  vec3 portalL = uPortalCol * 60. / (pd2 + 80.) * step(-340., z);
  vec3 dif = alb * (amb + uSunCol * uSunK * (min(uSunDir.y, .25) * 1.7 + .08) * sunVis + portalL);
  // the mirror: broken and soft, strongest at grazing angles; puddles lie flat, the film is rough
  vec2 rip = (vec2(nz(p.xz * .9 + uTime * .02), nz2(p.xz * .9 - uTime * .017)) - .5) * mix(.16, .012, pud);
  vec3 nn = normalize(vec3(rip.x, 1., rip.y));
  vec3 R = reflect(V, nn); R.y = abs(R.y) + .002;
  float cosv = clamp(dot(-V, nn), 0., 1.); float fr = 1. - cosv; float fr2 = fr * fr; float fres = .03 + .97 * fr2 * fr2 * fr;
  float open = cityRay(p + vec3(0., .2, 0.), R, 5.);
  gNzLod = mix(4.2, 2., pud); vec3 sk = arwSky(R, sunVis * open); gNzLod = 0.;
  vec3 opp = (uSkyAmb * .26 + uSunCol * .04) * (.8 + .4 * nz(R.xz * 2.1));
  vec3 refl = mix(opp, sk, open);
  vec4 am = arwMirror(p, R); refl = mix(refl, am.rgb, clamp(am.a, 0., 1.));
  // the lamp standards of both kerbs: a warm pool under each lit head and its long smear in the wet
  float lk0 = floor((z - 24.) / 30. + .5); float sideL = p.x < 0. ? -1. : 1.; vec3 lampC = vec3(1., .78, .50);
  float smear = 0., pool = 0.;
  for (int j = -3; j <= 3; j++) {
    float lk = lk0 + float(j), lz = 24. + lk * 30.;
    for (int q = 0; q < 2; q++) {
      float sd = q == 0 ? -1. : 1.; float on = lampOn(lk, sd) * lampHere(lz);
      vec3 Lp = vec3(sd * 16.1, 8.7, lz); vec3 toL = Lp - p; float al = dot(toL, R);
      vec3 off = toL - R * al; float along = max(al, .5);
      float dv = off.y / (along * .30 + .4), dh = length(off.xz) / (along * .035 + .28);
      smear += on * step(0., al) * exp(-(dv * dv + dh * dh)) * 26. / (along + 12.);
      vec2 dl = toL.xz; pool += on * exp(-dot(dl, dl) / 46.);
    }
  }
  dif += alb * lampC * pool * 1.5 * inAve;
  refl += lampC * smear * 5. * inAve;
  // the square's standards (heads 7.7 m up): the same pool under each lit head and its smear in the wet stone
  if (sq > .5) {
    float poolS = 0., smearS = 0.;
    for (int j = 0; j < ${SQ_LAMPS}; j++) {
      vec3 Lq = uSqLamp[j]; float on = step(Lq.z, uLampShare);
      vec3 toL = vec3(Lq.x, 7.7, Lq.y) - p; float al = dot(toL, R);
      vec3 off = toL - R * al; float along = max(al, .5);
      float dv = off.y / (along * .30 + .4), dh = length(off.xz) / (along * .035 + .28);
      smearS += on * step(0., al) * exp(-(dv * dv + dh * dh)) * 26. / (along + 12.);
      vec2 dl = toL.xz; poolS += on * exp(-dot(dl, dl) / 40.);
    }
    dif += alb * lampC * poolS * 1.5; refl += lampC * smearS * 5.;
  }
  float drain = road * inAve * step(abs(ax - 14.55), .28) * step(abs(fract(z / 15.) - .5), .03) * (1. - cross);
  dif *= 1. - .8 * drain;
  float nearWet = max(max(inAve, cross * step(ax, 240.)), sq);
  // (the flamed bands are rough: they mirror a third as much as the honed bays, so the grid tells in the wet too)
  float gloss = mix(wet * (.72 + .5 * sq), 1., pud) * mix(.12, 1., nearWet) * (1. - .65 * sq * bandS * (1. - rain));
  vec3 col = mix(dif, refl * 1.2, clamp(fres * gloss + pud * .09 * nearWet + rain * .2, 0., 1.));
  col += uPortalCol * pud * 14. / (pd2 + 120.) * step(-340., z) * nearWet;
  col = arwCeil(col);
  gl_FragColor = vec4(arwHaze(col, p), 1.);
}`;

const VERT_SKY = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position * 3000. + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const FRAG_SKY = /* glsl */`
varying vec3 vDir;
${GLSL_COMMON}
void main(){ vec3 d = normalize(vDir); gl_FragColor = vec4(arwSky(d, 1.), 1.); }`;

// ---------------------------------------------------------------- THE LOW LAND round the bluff
// The city stands on a bluff 26 m high (about the height of the low buildings at its head, so the lower town's roofs
// and trees stand in the open just under its rim: the brief's low roofs under the open bright sky). Its north rim is
// the foot of the steps (z -262), its west rim runs a street's breadth beyond the last row of lots (x -330), and the
// terrace is its prow. ONE LAW lays all the land below, by the bearing about the arch (0 north, east positive) and
// the distance from the bluff (the greater of the distance from the rims and the distance from the prow): a valley
// floor with a town at the bluff's foot (streets, plots, gardens, garden trees, a few lamps, houses), fields and tree
// lines beyond and up the lower slope, then three wooded ridges, each higher and each of uneven height by its
// bearing, that close the horizon. The valley is narrow in the west and north-west and opens into the plain where
// the far city stands. Nothing on it mirrors anything. Heights, crops, houses, trees and lamps come from the land's
// own stream.
const RIM_N = -262, RIM_W = -330, RIM_E = 1400, RIM_S = 1400, LAND_Y = -26, PROW = 60, LAND_R = 4400, VALLEY = 380, TOWN = 560;
// the far city's three depths: [towers, nearest m, farthest m, lowest, highest, narrowest, broadest], and its bearings
const FAR_CITY = [[16, 520, 900, 150, 260, 30, 52], [22, 900, 1500, 200, 340, 36, 66], [28, 1500, 2600, 260, 460, 48, 96]], FAR_B0 = 0.14, FAR_B1 = 1.75;
function makeLand(r) {
  const tabs = [0, 1, 2].map(() => Array.from({ length: 64 }, () => r()));
  const und = Array.from({ length: 32 * 32 }, () => r());
  const seedUV = [r(), r(), r(), r()];
  const n1 = (tab, x) => { const n = tab.length, f = ((x % n) + n) % n, i = Math.floor(f), t = f - i, u = t * t * (3 - 2 * t); return tab[i] + (tab[(i + 1) % n] - tab[i]) * u; };
  const fbm = (tab, x) => n1(tab, x) * 0.6 + n1(tab, x * 2.3 + 17) * 0.28 + n1(tab, x * 5.1 + 41) * 0.12;
  const n2 = (x, z) => {
    const fx = ((x % 32) + 32) % 32, fz = ((z % 32) + 32) % 32, ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz, ux = tx * tx * (3 - 2 * tx), uz = tz * tz * (3 - 2 * tz);
    const a = und[iz * 32 + ix], b = und[iz * 32 + ((ix + 1) % 32)], c = und[((iz + 1) % 32) * 32 + ix], d = und[((iz + 1) % 32) * 32 + ((ix + 1) % 32)];
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uz);
  };
  const inside = (x, z) => (z >= RIM_N && x >= RIM_W && x <= RIM_E) || (Math.abs(x) <= PROW && z >= -330 && z <= RIM_N);
  const bluffDist = (x, z) => Math.min(Math.hypot(Math.max(RIM_W - x, x - RIM_E, 0), Math.max(RIM_N - z, 0)), Math.hypot(Math.max(Math.abs(x) - PROW, 0), Math.max(-330 - z, z - RIM_N, 0)));
  const bearing = (x, z) => Math.atan2(x, -(z + 292));
  const dist = (x, z) => Math.max(bluffDist(x, z), Math.hypot(x, z + 292) - PROW);
  // the valley's breadth: narrow where the hills stand close, opening over three quarters of a radian to the plain,
  // which is as broad as the far city reaches; the town's belt opens with it
  const plain = FAR_CITY[2][2] + 100;
  const valleyW = (th) => lerp(VALLEY, plain, sstep(FAR_B0 - 0.75, FAR_B0, th));
  const townEdge = (th) => lerp(TOWN, plain, sstep(FAR_B0 - 0.35, FAR_B0, th));
  const law = (x, z) => {
    const th = bearing(x, z), d = dist(x, z) - valleyW(th);
    const roll = (n2(x / 180, z / 180) - 0.5) * 14 + (n2(x / 57 + 9.1, z / 57 + 3.7) - 0.5) * 5;
    if (d <= 0) return LAND_Y + roll * 0.12;
    const H1 = 50 + 85 * fbm(tabs[0], th * 2.9 + 7), H2 = 90 + 100 * fbm(tabs[1], th * 4.5 + 3), H3 = 90 + 90 * fbm(tabs[2], th * 6 + 11), k = sstep(0, 450, d);
    return LAND_Y + 60 * k + 40 * sstep(450, 2600, d) + H1 * sstep(350, 800, d) * (1 - 0.6 * sstep(800, 1350, d))
      + H2 * sstep(1250, 2000, d) * (1 - 0.5 * sstep(2000, 2600, d)) + H3 * sstep(2500, 3300, d) + roll * (0.12 + 0.88 * k);
  };
  // where the hills come up against the city's rim the land meets it 3 m under the rim's wall and rises from there no
  // steeper than one in two (so the land never stands over the rim's own line)
  const height = (x, z) => Math.min(law(x, z), bluffDist(x, z) * 0.5 - 3);
  return { height, dist, bearing, valleyW, townEdge, inside, bluffDist, seedUV, sheds: [] };
}
const VERT_LAND = /* glsl */`
attribute vec4 aLaw; attribute float aKind; attribute vec3 color;
varying vec3 vW, vN, vCol; varying vec4 vLaw; varying float vKind;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vCol = color; vLaw = aLaw; vKind = aKind; gl_Position = projectionMatrix * viewMatrix * wp; }`;
// vLaw on the land: distance from the bluff, distance beyond the valley's far side, the sun's share, the town's edge;
// on a house: its own number, 0, the sun's share, 0
const FRAG_LAND = /* glsl */`
varying vec3 vW, vN, vCol; varying vec4 vLaw; varying float vKind;
${GLSL_COMMON}
uniform vec4 uLand;
void main(){
  vec3 p = vW, N = normalize(vN);
  float fw = max(fwidth(p.x), fwidth(p.z));
  vec2 wq = vec2(abs(N.x) > .5 ? p.z : p.x, p.y) / vec2(2.8, 2.9);
  float wlod = clamp(1.5 - max(fwidth(wq.x), fwidth(wq.y)) * 2.2, 0., 1.);
  float sun = vLaw.z, ndl = clamp(dot(N, uSunDir), 0., 1.);
  vec3 amb = uSkyAmb * (.55 + .30 * N.y) * mix(vec3(1.31, 1.36, 1.56), vec3(1.), sun);
  vec3 alb, glow = vec3(0.);
  if (vKind > .5) {
    // a house or a shed of the town: plain walls with a few lit windows, a tiled or a flat roof
    alb = vCol;
    if (vKind < 1.5) {
      vec2 wi = floor(wq), wf = fract(wq);
      float win = step(.24, wf.x) * step(wf.x, .76) * step(.30, wf.y) * step(wf.y, .78);
      float share = .14 * (.6 + .8 * uLamps), lit = step(hash21(wi + vLaw.x * 91.), share);
      alb = mix(alb, vec3(.03, .035, .05), win * wlod * (1. - lit));
      glow = vec3(1., .78, .5) * mix(.27 * share, win * lit, wlod) * 1.5;
    }
  } else {
    float s = vLaw.x, d = vLaw.y;
    float nA = nz(p.xz * .0019 + uLand.xy), nB = nz2(p.xz * .0083 + uLand.zw), nC = nz(p.xz * .037 + uLand.yx), nD = nz2(p.xz * .19 + uLand.wz);
    // the law's belts, their edges uneven: the town on the valley floor near the bluff, woods from the upper slope on
    float town = (1. - smoothstep(vLaw.w - 130., vLaw.w, s + (nA - .5) * 190.)) * (1. - smoothstep(-70., -20., d));
    float wood = smoothstep(280., 400., d + (nB - .5) * 150.);
    // FIELDS: a patchwork of plots, each with a crop of its own; a hedge round every plot, a tree line round some, small woods
    vec2 fq = p.xz / vec2(88., 124.) + vec2(nA, nB) * .35; vec2 fi = floor(fq), ff = abs(fract(fq) - .5);
    float fk = hash21(fi + uLand.xy * 61.), fk2 = hash21(fi + uLand.zw * 47. + 3.1);
    vec3 field = mix(vec3(.075, .105, .04), vec3(.20, .165, .085), step(.42, fk));
    field = mix(field, vec3(.085, .066, .05), step(.68, fk));
    field = mix(field, vec3(.10, .14, .05), step(.86, fk));
    field *= .86 + .28 * nC;
    float lodF = clamp(1.6 - fw / 9., 0., 1.);
    float hedge = smoothstep(.455, .48, max(ff.x, ff.y)) * lodF;
    float line = smoothstep(.43, .47, max(ff.x, ff.y)) * step(.55, fk2) * lodF;
    float copse = smoothstep(.62, .7, nB + nC * .3) * step(.3, fk2);
    vec3 green = vec3(.022, .042, .020) * (.7 + .8 * nD);
    alb = mix(field, green, clamp(max(max(hedge, line), copse), 0., 1.));
    // WOODS on the hills: crowns in dark greens, the first yellow of the season, a few clearings low down
    vec3 woodc = mix(vec3(.020, .040, .020), vec3(.045, .062, .026), nC) * (.6 + .9 * nD);
    woodc = mix(woodc, vec3(.11, .085, .03), smoothstep(.66, .8, nD) * .5);
    float clearing = smoothstep(.7, .78, nB) * (1. - smoothstep(900., 1400., d));
    alb = mix(alb, mix(woodc, field, clearing), wood);
    // THE TOWN: streets in two directions, plots with gardens and yards between them
    vec2 tq = p.xz / vec2(56., 44.); vec2 tf = fract(tq);
    float lodT = clamp(1.6 - fw / 5., 0., 1.);
    float street = max(step(tf.x, .125), step(tf.y, .136));
    float pk = hash21(floor(p.xz / 14.) + uLand.zw * 29.);
    vec3 plot = mix(vec3(.060, .095, .038), vec3(.17, .16, .14), step(.62, pk)) * (.8 + .4 * nD);
    plot = mix(plot, green, step(.86, pk));
    vec3 townc = mix(plot, vec3(.038, .040, .048), street * mix(.35, 1., lodT));
    alb = mix(alb, townc, town);
    // the town's street lamps: a lamp stands at a share of the corners, and of those the hour's share is lit; each lays
    // a warm pool on its street (drawn no finer than the screen can hold it)
    vec2 cq = floor(tq + .5); vec2 dl = p.xz - (cq * vec2(56., 44.) + vec2(3.5, 3.));
    float has = step(hash21(cq + uLand.xy * 83.), .6) * step(hash21(cq + uLand.zw * 71. + 9.7), uLampShare);
    float sg = 55. + fw * fw * .5;
    glow = vec3(1., .78, .5) * has * town * exp(-dot(dl, dl) / sg) * (55. / sg) * 1.6 * (alb * 2.5 + .25);
  }
  vec3 col = alb * (amb + uSunCol * uSunK * ndl * sun * 1.15) + glow;
  gl_FragColor = vec4(arwHaze(col, p), 1.);
}`;
// the land's mesh: the ground on rays from the arch (rows by the law's own distances), the town's houses on a lattice of
// plots between its streets, and the sheds the far stream deals; the sun's share is worked out once, at build, by
// walking from each place toward the sun over the land's own heights
async function buildLand(ctx, land, env, U, r, density) {
  const P = [], N = [], C = [], LW = [], K = [], I = [];
  const sh = Math.hypot(env.sunDir.x, env.sunDir.z) || 1, sdx = env.sunDir.x / sh, sdz = env.sunDir.z / sh, tanEl = env.sunDir.y / sh;
  const sunAt = (x, y, z) => {
    if (!(env.sunK > 0)) return 0;
    let vis = 1;
    for (let k = 1, t = 0; k <= 16 && vis > 0; k++) { t += 40 * k; const qx = x + sdx * t, qz = z + sdz * t, ry = y + 2 + tanEl * t; if (ry > 470) break; vis = Math.min(vis, sstep(-4, 14, ry - (land.inside(qx, qz) ? 0 : land.height(qx, qz)))); }
    return vis;
  };
  // the ground
  // from the south end of the west rim round to the east end of the north rim (bearings about the arch)
  const cols = 196, th0 = Math.atan2(RIM_W, -(RIM_S + 292)), th1 = Math.atan2(RIM_E, -(RIM_N + 292));
  const valleyRows = [0, 0.12, 0.3, 0.52, 0.76, 1], hillRows = [70, 150, 240, 340, 450, 560, 680, 800, 930, 1080, 1220, 1350, 1500, 1700, 1850, 2000, 2200, 2400, 2600, 2850, 3100, 3300, 3550];
  const rows = valleyRows.length + hillRows.length;
  for (let i = 0; i <= cols; i++) {
    const th = lerp(th0, th1, i / cols), dx = Math.sin(th), dz = -Math.cos(th);
    let r0 = 0; for (let rr = LAND_R; rr > 0; rr -= 4) if (land.inside(dx * rr, -292 + dz * rr)) { r0 = rr; break; }
    const sAt = (rr) => land.dist(dx * rr, -292 + dz * rr);
    const rOf = (s) => { let a = r0, b = LAND_R; if (sAt(b) <= s) return b; for (let k = 0; k < 28; k++) { const m = (a + b) / 2; if (sAt(m) < s) a = m; else b = m; } return (a + b) / 2; };
    const s0 = sAt(r0), vw = land.valleyW(th);
    for (let j = 0; j < rows; j++) {
      const s = j < valleyRows.length ? lerp(Math.min(s0, vw), vw, valleyRows[j]) : vw + hillRows[j - valleyRows.length];
      const rr = j === 0 ? Math.max(0, r0 - 0.5) : rOf(s), x = dx * rr, z = -292 + dz * rr, y = land.height(x, z), e = 6;
      const hx = (land.height(x + e, z) - land.height(x - e, z)) / (2 * e), hz = (land.height(x, z + e) - land.height(x, z - e)) / (2 * e), nl = Math.hypot(hx, 1, hz);
      P.push(x, y, z); N.push(-hx / nl, 1 / nl, -hz / nl); C.push(0, 0, 0); K.push(0);
      const sv = land.dist(x, z); LW.push(sv, sv - vw, sunAt(x, y, z), land.townEdge(th));
    }
    if (i % 12 === 11) await ctx.yield();
  }
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows - 1; j++) { const a = i * rows + j, b = a + rows; I.push(a, b + 1, a + 1, a, b, b + 1); }
  // houses and sheds: quads of their own in the same mesh
  const quad = (a, b, c, d, n, col, kind, law) => {
    const i0 = P.length / 3;
    for (const v of [a, b, c, d]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); K.push(kind); LW.push(law[0], 0, law[1], 0); }
    I.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
  };
  const walls = (x0, x1, y0, y1, z0, z1, col, law) => {
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], col, 1, law); quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], col, 1, law);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], col, 1, law); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], col, 1, law);
  };
  // THE TOWN'S HOUSES AND GARDEN TREES, from the land's stream: two plots by two in every block between the streets
  // (the streets run along the low edges of blocks of 56 by 44 m); each plot takes all its draws (a house, its ridge
  // along or across its street, and two trees beside it), and they stand where the law has the town's first belt
  const wallCols = [COL.lime, COL.pale, COL.conc, COL.terra, COL.granite], tiles = [lin('#5a3a2e'), lin('#4a4a52'), lin('#6b4a3a'), lin('#3c4044')];
  const greens = [lin('#22381a'), lin('#2c4620'), lin('#384a1e'), lin('#56501e')];
  // a garden tree's crown: eight faces round a middle belt, its top and its underside
  const crown = (x, y0, y1, z, rad, col, law) => {
    const i0 = P.length / 3, ym = y0 + (y1 - y0) * 0.45;
    for (const v of [[x, y1, z, 0, 1, 0], [x, y0, z, 0, -1, 0], [x + rad, ym, z, 1, 0, 0], [x, ym, z + rad, 0, 0, 1], [x - rad, ym, z, -1, 0, 0], [x, ym, z - rad, 0, 0, -1]]) {
      P.push(v[0], v[1], v[2]); N.push(v[3], v[4], v[5]); C.push(col[0], col[1], col[2]); K.push(2); LW.push(law[0], 0, law[1], 0);
    }
    for (let k = 0; k < 4; k++) { const a = i0 + 2 + k, b = i0 + 2 + ((k + 3) % 4); I.push(i0, a, b, i0 + 1, b, a); }
  };
  const share = 0.72 * Math.min(1, density);
  const nb = Math.ceil((TOWN + PROW + 56) / 56), bj0 = Math.floor((-292 - TOWN - PROW - 44) / 44), bj1 = Math.ceil(RIM_N / 44);
  for (let bi = -nb; bi < nb; bi++) {
    for (let bj = bj0; bj < bj1; bj++) for (let q = 0; q < 4; q++) {
      const here = r(), w = r.range(9, 15), dd = r.range(7, 10.5), h = r.range(5.5, 9.5), jx = r.range(-2.5, 2.5), jz = r.range(-2, 2), col = wallCols[Math.floor(r() * wallCols.length)], tile = tiles[Math.floor(r() * tiles.length)], sd = r(), rise = r.range(2.2, 3.4), across = r() < 0.4;
      const tr = [0, 1].map(() => [r() < 0.5 ? -1 : 1, r.range(-3.5, 3.5), r.range(6, 11.5), r.range(0.36, 0.5), greens[Math.floor(r() * greens.length)], r()]);
      const x = bi * 56 + 20 + (q % 2) * 24 + jx, z = bj * 44 + 16.25 + (q > 1 ? 18.5 : 0) + jz, th = land.bearing(x, z);
      if (land.bluffDist(x, z) < 18 || land.dist(x, z) > Math.min(TOWN, land.valleyW(th)) - 50) continue;
      for (let k = 0; k < 2; k++) {
        const [sg, off, ht, rk, gc, gs] = tr[k], rad = ht * rk;
        const tx = k === 0 ? x + sg * (w / 2 + rad + 1) : x + off, tz = k === 0 ? z + off : z + sg * (dd / 2 + rad + 1), ty = land.height(tx, tz);
        crown(tx, ty + ht * 0.2, ty + ht, tz, rad, gc, [gs, sunAt(tx, ty + ht, tz)]);
      }
      if (here > share) continue;
      const x0 = x - w / 2, x1 = x + w / 2, z0 = z - dd / 2, z1 = z + dd / 2, y0 = LAND_Y - 1.5, y1 = LAND_Y + h, y2 = y1 + rise, law = [sd, sunAt(x, y1, z)];
      walls(x0, x1, y0, y1, z0, z1, col, law);
      if (across) {
        // the ridge runs north and south: slopes to the west and east, gables north and south
        const nl = Math.hypot(rise, w / 2);
        quad([x0, y1, z0], [x0, y1, z1], [x, y2, z1], [x, y2, z0], [-rise / nl, w / 2 / nl, 0], tile, 2, law);
        quad([x1, y1, z1], [x1, y1, z0], [x, y2, z0], [x, y2, z1], [rise / nl, w / 2 / nl, 0], tile, 2, law);
        quad([x0, y1, z1], [x1, y1, z1], [x, y2, z1], [x, y2, z1], [0, 0, 1], col, 1, law); quad([x1, y1, z0], [x0, y1, z0], [x, y2, z0], [x, y2, z0], [0, 0, -1], col, 1, law);
      } else {
        const nl = Math.hypot(rise, dd / 2);
        quad([x0, y1, z1], [x1, y1, z1], [x1, y2, z], [x0, y2, z], [0, dd / 2 / nl, rise / nl], tile, 2, law);
        quad([x0, y2, z], [x1, y2, z], [x1, y1, z0], [x0, y1, z0], [0, dd / 2 / nl, -rise / nl], tile, 2, law);
        quad([x0, y1, z0], [x0, y1, z1], [x0, y2, z], [x0, y2, z], [-1, 0, 0], col, 1, law); quad([x1, y1, z1], [x1, y1, z0], [x1, y2, z], [x1, y2, z], [1, 0, 0], col, 1, law);
      }
    }
    if ((bi + nb) % 6 === 5) await ctx.yield();
  }
  // the sheds and halls the far stream deals on the valley floor: plain walls, a flat roof
  for (const [x, z, w, d, h, col, sd] of land.sheds) {
    const law = [sd, sunAt(x, LAND_Y + h, z)], x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y1 = LAND_Y + h;
    walls(x0, x1, LAND_Y - 1.5, y1, z0, z1, col, law);
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [col[0] * 0.5, col[1] * 0.5, col[2] * 0.52], 2, law);
  }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aLaw', new THREE.Float32BufferAttribute(LW, 4)); geo.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1));
  geo.setIndex(I); geo.computeBoundingSphere();
  U.uLand = { value: new THREE.Vector4(land.seedUV[0], land.seedUV[1], land.seedUV[2], land.seedUV[3]) };
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_LAND, fragmentShader: FRAG_LAND }));
  mesh.frustumCulled = false;
  return { mesh, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- the city
export async function buildCity(ctx, opts = {}) {
  const core = ctx.core;
  const stream = (name) => core.makeRng(core.hashSeed('arw-city-' + name + ':' + ctx.seed));
  // every stream of the city, taken once, in this order
  const R = { noise: stream('noise'), far: stream('far'), lamps: stream('lamps'),
    traffic: stream('traffic'), square: stream('square'), leaves: stream('leaves'), sky: stream('sky'), garden: stream('garden'), birds: stream('birds'), farEast: stream('far-east'), roofs: stream('roofs'), parked: stream('parked'), tubs: stream('tubs'), lowland: stream('lowland'), squareLamps: stream('square-lamps'), tops: stream('tops'), pools: stream('pools') };
  const env = opts.env || cityEnv(ctx.vary && ctx.vary.hour);
  const animals = opts.animals || { glsl: 'float arwShade(vec3 p){ return 1.; } vec4 arwMirror(vec3 p, vec3 r){ return vec4(0.); } float arwStir(vec3 p){ return 0.; }', uniforms: {} };
  const path = opts.path;
  const detail = ctx.quality && ctx.quality.detail ? ctx.quality.detail : 1;
  const density = (ctx.vary && ctx.vary.density) || 1;
  const root = new THREE.Group(); root.name = 'arw-city';
  const updaters = [];
  let triangles = 0, drawCalls = 0;
  const add = (mesh, tris) => { root.add(mesh); triangles += tris; drawCalls += 1; return mesh; };

  const plan = opts.plan || await cityPlan(ctx, env, path);
  const sunAt = makeSunAt(plan.boxes, env);
  env.sunAt = sunAt;
  const land = makeLand(R.lowland);
  const noiseTex = await makeNoiseTexture(R.noise, ctx);
  await ctx.yield();
  const boxV = [], boxH = [];
  for (let i = 0; i < MAXB; i++) {
    const b = plan.boxes[i];
    boxV.push(b ? new THREE.Vector4(b[0], b[1], b[2], b[3]) : new THREE.Vector4(9e4, 9e4, 9e4, 9e4)); boxH.push(b ? b[4] : -2);
  }
  const az = new THREE.Vector2(env.sunDir.x, env.sunDir.z).normalize();
  const U = {
    tNoise: { value: noiseTex }, uTime: { value: 0 },
    uSunDir: { value: env.sunDir.clone() }, uSunCol: { value: env.sunColor.clone() }, uSunAz: { value: az }, uSunK: { value: env.sunK > 0 ? 1 : 0 },
    uZen: { value: env.zen }, uMid: { value: env.mid }, uHor: { value: env.hor }, uCool: { value: env.cool },
    uCloudLit: { value: env.cloudLit }, uCloudDark: { value: env.cloudDark }, uFogWarm: { value: env.fogColor }, uFogCool: { value: env.fogCool },
    uSkyAmb: { value: env.skyColor.clone().multiplyScalar(1.25) }, uGroundAmb: { value: env.groundColor.clone() },
    uFogK: { value: 0.00052 }, uGlow: { value: env.glow }, uLamps: { value: env.lamps },
    uLampShare: { value: env.lampShare }, uLampDraw: { value: new Array(38).fill(2) },
    uSqLamp: { value: Array.from({ length: SQ_LAMPS }, () => new THREE.Vector3(0, 0, 2)) },
    uBox: { value: boxV }, uBoxH: { value: boxH },
    uWetCap: { value: env.wetCap || 0.275 },
    uPool: { value: layPools(R.pools).slice(0, POOLS).map((q) => new THREE.Vector4(q[0], q[1], 1 / q[2], 1 / q[3])) },
    uPortal: { value: new THREE.Vector3(0, 15, -292) }, uPortalCol: { value: new THREE.Color('#ffe6c4') },
  };
  // the animals part's uniforms, by reference
  for (const k of Object.keys(animals.uniforms || {})) U[k] = animals.uniforms[k];
  const wallMat = wallMaterial(U, animals);
  const groundMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_GROUND, fragmentShader: fragGround(animals.glsl) });

  // the sky
  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_SKY, fragmentShader: FRAG_SKY, side: THREE.BackSide, depthWrite: false }));
  skyMesh.renderOrder = -1; skyMesh.frustumCulled = false; add(skyMesh, 960);

  // the ground of the city on its bluff
  const gg = new THREE.BufferGeometry();
  const GP = [RIM_W, 0, RIM_S, RIM_E, 0, RIM_S, RIM_E, 0, RIM_N, RIM_W, 0, RIM_N];
  gg.setAttribute('position', new THREE.Float32BufferAttribute(GP, 3)); gg.setIndex([0, 1, 2, 0, 2, 3]); gg.computeBoundingSphere();
  add(new THREE.Mesh(gg, groundMat), 2);

  const g = makeGeo();
  buildWalls(g, plan);
  await ctx.yield();
  // first form of the steps, the terrace and the arch (boxes)
  for (let i = 0; i < 20; i++) g.box(-26, 26, 0, (i + 1) * 0.25, -262 - (i + 1) * 0.7, -262 - i * 0.7, COL.pale, [0, 0.3, 1.2, 0.25], COL.pale, [0, 0.3, 1.2, 0.6], 'st');
  g.box(-60, 60, LAND_Y - 2, 5, -330, -276, COL.pale, [0, 0.4, 2.4, 1.2], COL.pale, [0, 0.4, 2.4, 1.2]);
  g.box(-60, -26, LAND_Y - 2, 5, -276, -262, COL.pale, [0, 0.4, 2.4, 1.2], COL.pale, [0, 0.4, 2.4, 1.2]);
  g.box(26, 60, LAND_Y - 2, 5, -276, -262, COL.pale, [0, 0.4, 2.4, 1.2], COL.pale, [0, 0.4, 2.4, 1.2]);
  // the bluff's walls under its north and west rims, and a parapet along both
  g.box(RIM_W - 0.5, -60, LAND_Y - 2, 0, RIM_N - 0.5, RIM_N, COL.granite, [0, 0.5, 3, 1.5], COL.granite, null, 'n');
  g.box(60, RIM_E, LAND_Y - 2, 0, RIM_N - 0.5, RIM_N, COL.granite, [0, 0.5, 3, 1.5], COL.granite, null, 'n');
  g.box(RIM_W - 0.5, RIM_W, LAND_Y - 2, 0, RIM_N - 0.5, RIM_S, COL.granite, [0, 0.5, 3, 1.5], COL.granite, null, 'w');
  g.box(RIM_W, -60.5, 0, 1.1, RIM_N - 0.5, RIM_N - 0.1, COL.granite, [0, 0.4, 2.4, 1.1]); g.box(60.5, RIM_E, 0, 1.1, RIM_N - 0.5, RIM_N - 0.1, COL.granite, [0, 0.4, 2.4, 1.1]);
  g.box(RIM_W - 0.5, RIM_W - 0.1, 0, 1.1, RIM_N - 0.5, RIM_S, COL.granite, [0, 0.4, 2.4, 1.1]);
  const roofTrees = enrich(g, plan, R.garden, R.roofs, path, R.tops);
  await ctx.yield();
  const lampList = buildFurniture(g, R.lamps, plan.lamps, R.squareLamps);
  // the square's standards (its three edges and its own), for their pools of light on its wet stone: [x, z, draw] of each head
  lampList.filter((l) => l[0] > -121 && l[0] < -26 && l[2] > -216 && l[2] < -134).slice(0, SQ_LAMPS).forEach((l, i) => U.uSqLamp.value[i].set(l[0], l[2], l[5]));
  // the kerb lattice's draws, for the street's own lamp light (a place of the lattice with no lamp keeps a draw over every share)
  for (const l of lampList) if (l[3] >= -9 && l[3] <= 9) U.uLampDraw.value[(l[3] + 9) * 2 + (l[4] > 0 ? 1 : 0)] = l[5];
  buildSquare(g);
  buildArch(g);
  await ctx.yield();
  buildTerraceAndFar(g, R.far, env, density * (0.6 + 0.4 * detail), R.farEast, land);
  await ctx.yield();
  const walls = add(new THREE.Mesh(g.toGeometry(), wallMat), g.tris);
  walls.frustumCulled = false;
  await ctx.yield();
  // the low land round the bluff
  const lowland = await buildLand(ctx, land, env, U, R.lowland, density);
  add(lowland.mesh, lowland.triangles);
  await ctx.yield();

  // trees
  const trees = await buildTrees(ctx, plan.trees, env, sunAt, path, detail, roofTrees, R.tubs);
  root.add(trees.object); triangles += trees.triangles; drawCalls += trees.drawCalls;
  updaters.push((dt, time) => trees.update(time));
  await ctx.yield();

  // traffic, lamp glows, the far flock
  const traffic = buildTraffic(R.traffic, U, animals, density, detail, R.parked);
  for (const m of traffic.meshes) add(m, 0); triangles += traffic.triangles;
  add(buildGlows(lampList, U), lampList.length * 2);
  const nBirds = Math.round(72 * (0.5 + 0.5 * detail)); add(buildBirds(R.birds, U, nBirds), nBirds * 2);
  await ctx.yield();
  // air: leaves falling from the planes, steam from the square's two vent stacks, thin mist low in the cross streets
  const tU = { value: 0 }, air = fx.fxGroup(); root.add(air.object);
  air.add(fx.makeParticles({ rng: R.leaves, preset: 'leaves', time: tU, count: Math.round(1150 * density * detail), box: [60, 30, 70], size: [0.11, 0.24], colors: ['#8d9a3a', '#c9b24a', '#5d7a30'], velocity: [0.5, -1.1, 0.7], lightDir: [env.sunDir.x, env.sunDir.y, env.sunDir.z] }));
  await ctx.yield();
  // each steam column starts inside its vent stack's mouth, as thin there as the mouth, and rises to 17 m as before
  for (const [x, z] of STEAM_VENTS) air.add(fx.makeSmokeColumn({ rng: R.square, time: tU, position: [x, VENT.stack - 0.3, z], height: 17 - VENT.stack, radius: [VENT.mouth * 0.7, 4.5], size: [VENT.mouth * 2.6, 9], count: 46, color: '#e6e1e2', colorTop: '#f3eeee', shadowColor: '#9a98b4', ambient: '#8e8ca8', opacity: 0.42, rate: 0.09, wind: [0.5, 0, 0.35], sunDir: [env.sunDir.x, env.sunDir.y, env.sunDir.z], sunColor: env.sunColor }));
  const mp = [];
  for (const zc of [7, -113, -231]) for (let i = 0; i < 16; i++) { const sx = i % 2 ? 1 : -1; mp.push([sx * (34 + R.square.range(0, 190)), R.square.range(1.5, 4.5), zc + R.square.range(-7, 7)]); }
  for (let i = 0; i < 10; i++) mp.push([R.square.range(-116, -32), R.square.range(1.5, 3.5), R.square.range(-212, -138)]);
  air.add(fx.makeMist({ rng: R.square, time: tU, positions: mp, count: mp.length, size: [16, 32], color: '#d8ccd2', opacity: 0.17, drift: [0.5, 0, 0.12] }));
  triangles += 520 * 2 + 46 * 4 + mp.length * 2; drawCalls += 4;
  updaters.push((dt, time, camera) => { tU.value = time; air.update(dt, time, camera); });
  await ctx.yield();

  // lights for the kit's plants (the city's own materials take their light from the uniforms above)
  const hemi = new THREE.HemisphereLight(env.skyColor.clone(), env.groundColor.clone().multiplyScalar(0.6), 3.2);
  const sun = new THREE.DirectionalLight(env.sunColor.clone(), env.sunK > 0 ? 1.6 : 0.0);
  sun.position.copy(env.sunDir).multiplyScalar(400); root.add(hemi, sun, sun.target);
  const lights = [hemi, sun], lightBase = { hemi: hemi.intensity, sun: sun.intensity };

  return {
    object: root, env, lights, lightBase, uniforms: U, plan,
    anchors: { arch: [0, 15, -292], square: [-70, 0, -175], plaza: [36, 3, -30] },
    update(dt, time, camera) { U.uTime.value = time; for (const f of updaters) f(dt, time, camera); },
    dispose() { noiseTex.dispose(); },
    get triangles() { return triangles; }, get drawCalls() { return drawCalls; },
  };
}

// ---------------------------------------------------------------- street furniture, the terrace, the arch, the far city
// planters on the steps, in four rows (beside both cheek walls and half way to the axis), one to every 3.4 m of the
// flight: [x, the planter's top, z]; each stands on its own tread
function stepPlanters() {
  const out = [];
  for (const x of [-23.2, -11.6, 11.6, 23.2]) for (let k = 0; k < 4; k++) { const z = -264.5 - k * 3.4; out.push([x, Math.ceil((-262 - z) / 0.7) * 0.25 + 0.8, z]); }
  return out;
}
const LAMP_Z0 = 24, LAMP_DZ = 30;
// the median ends at the south side of the lane before the steps (cross street C)
const MEDIAN_END = -222;
const inCrossRoad = (z) => (z > -5.5 && z < 19.5) || (z > -127.5 && z < -98.5) || (z > -238.5 && z < -223.5);
// EVERY LAMP STANDARD, by rule and in the furniture's order: [x, z, index, side, height]. The kerb lattice (one every
// 30 m on both kerbs, none in a cross street's roadway), the square's south, north and west edges (one every 26 m),
// the foot of the steps and the terrace.
function lampStandards() {
  const out = [];
  for (let k = -9; k <= 9; k++) { const z = LAMP_Z0 + k * LAMP_DZ; if (inCrossRoad(z)) continue; out.push([17.5, z, k, 1, 9], [-17.5, z, k, -1, 9]); }
  let k = 60;
  for (let x = -39; x >= -117; x -= 26) out.push([x, -137, k++, -1, 8], [x, -213, k++, -1, 8]);
  for (let z = -163; z >= -189; z -= 26) out.push([-118, z, k++, -1, 8]);
  for (const [x, z] of [[-9, -256], [9, -256], [-21, -258], [21, -258], [-30, -284], [30, -284], [-30, -318], [30, -318], [-52, -300], [52, -300]]) out.push([x, z, k++, x < 0 ? -1 : 1, z < -270 ? 12 : 8]);
  // the square's own standards, last in the list: on the north-south bands between its rows of benches and planters,
  // at the middles of the two bays where the benches stand (their draws come from a stream of their own: the sixth number)
  for (const x of [-36, -60, -84]) for (const z of [SQ_ROW_Z - SQ_BAY[1], SQ_ROW_Z - 3 * SQ_BAY[1]]) out.push([x, z, k++, -1, 8, 1]);
  return out;
}
// THE SQUARE DRESSED (x -120 to -26, z -215 to -135), on its paving's own grid: bays of 12 m (east to west) by 10 m
// between band lines at x = 12 k and z = 10 k. North of the grove, on every second north-south band (SQ_ROWS), a row:
// a long planter of low clipped shrubs at the middle of every second bay and two benches back to back at the bays
// between. The square's own standards stand on the bands between the rows (lampStandards), its three more planes on
// the westmost band (layTrees). Nothing built here is taller than a vent's stack; all of it lies over 40 m from the line.
const SQ_BAY = [12, 10], SQ_ROWS = [-48, -72, -96], SQ_ROW_Z = -165;
// THE TWO STEAM VENTS, each at the middle of a bay of that grid, in the open north of the grove (x -72 to -60 by
// z -190 to -180; x -96 to -84 by z -170 to -160): a square kerbed grating VENT.across broad with dark bars, and on it
// a round stack VENT.stack tall of grey painted steel, one plain colour, a darker rim round its open mouth (radius
// VENT.mouth). Nothing lettered, no bands.
const STEAM_VENTS = [[-66, -185], [-90, -165]], VENT = { across: 2.4, stack: 3, mouth: 0.42 };
// THE RAIN'S POOLS, laid by the seed from a stream of their own as [x, z, half breadth, half length]: broad shallow
// pools of rain in the paving's low places (no basin, nothing built: the stone's own wet). ON THE SQUARE each lies
// inside one column of bays between two north-south bands (so clear of every row of benches and planters, every
// standard and the west planes' pits, which all stand on those bands), in its north or its south half (clear of the
// vent between them); the twelve such places less the one a vent stands in take a key each, and the nine lowest keys
// hold a pool, which then takes its four draws (breadth, length, where it lies in its place). ON THE TERRACE nine
// places hold one each: three on the middle walk (before the arch, and two behind it), four between the two columns of
// benches, two between the two rows of clipped trees; each takes the same four draws. By their measures the pools
// cover a tenth to a sixth of either paving.
function layPools(r) {
  const out = [], put = (xc, zc, rx, rz, mx, mz) => out.push([xc + r.range(-1, 1) * (mx - rx), zc + r.range(-1, 1) * (mz - rz), rx, rz]);
  const places = [];
  for (let c = 1; c <= 6; c++) for (const zc of [-172, -198]) { const xc = -114 + c * SQ_BAY[0]; if (!STEAM_VENTS.some(([vx, vz]) => Math.abs(vx - xc) < 6 && Math.abs(vz - zc) < 12)) places.push([xc, zc]); }
  const dealt = places.map((s) => ({ s, key: r() })).sort((a, b) => a.key - b.key).slice(0, 9);
  for (const { s } of dealt) put(s[0], s[1], r.range(3.4, 3.8), r.range(8.5, 10), 3.8, 10);
  put(0, -282, r.range(7.8, 8.5), r.range(4, 4.5), 8.5, 4.5);
  for (const zc of [-304, -320]) put(0, zc, r.range(9.5, 10.5), r.range(5.8, 6.5), 10.5, 6.5);
  for (const x of [-25, 25]) for (const zc of [-294, -317]) put(x, zc, r.range(3, 3.3), r.range(9, 10), 3.3, 10);
  for (const x of [-43, 43]) put(x, -303, r.range(2.5, 2.7), r.range(10, 12), 2.7, 12);
  return out;
}
function buildSquare(g) {
  const gr = COL.granite, planted = lin('#2c4a24'), shrub = lin('#27451f'), timber = lin('#6b5a48'), metal = lin('#2b2e33'), pit = lin('#1a1c20');
  // a long planter (6 by 1.6 m, its long side north and south) with three low clipped shrubs, standing on y
  const planter = (x, y, z) => {
    g.box(x - 0.8, x + 0.8, y, y + 0.55, z - 3, z + 3, gr, [0, 0.6, 2, 0.55], planted, [8, 0.52, 3, 3]);
    for (const dz of [-2, 0, 2]) {
      g.box(x - 0.62, x + 0.62, y + 0.55, y + 1.05, z + dz - 0.85, z + dz + 0.85, shrub, [8, 0.31 + dz * 0.07, 3, 3]);
      g.box(x - 0.42, x + 0.42, y + 1.05, y + 1.3, z + dz - 0.6, z + dz + 0.6, shrub, [8, 0.36 + dz * 0.07, 3, 3]);
    }
  };
  // the terrace's middle walk takes the same planters, a row at either hand just inside its lit bollards, one at the
  // middle of each of its paving's bays (12 m) north of the steps; none is taller than 1.3 m, 8.7 m under the line
  for (const x of [-14, 14]) for (let z = -288; z > -328; z -= 12) planter(x, 5, z);
  for (const x of SQ_ROWS) for (let k = 0; k < 5; k++) {
    const z = SQ_ROW_Z - k * SQ_BAY[1];
    if (k % 2 === 0) planter(x, 0, z);
    else for (const sx of [-1, 1]) {
      const bx = x + sx * 1.15;
      g.box(bx - 0.3, bx + 0.3, 0, 0.45, z - 1.2, z + 1.2, gr, [0, 0.3, 2, 1]); g.box(bx - 0.34, bx + 0.34, 0.45, 0.52, z - 1.3, z + 1.3, timber, [0, 0.3, 2, 1]);
    }
  }
  const steel = lin('#7d838a'), a = VENT.across / 2, w = 0.22;
  for (const [x, z] of STEAM_VENTS) {
    // the kerb: four stones round the grating; the pit under the bars (dark, unlit); the bars
    g.box(x - a, x + a, 0, 0.2, z - a, z - a + w, gr, [0, 0.5, 1.2, 0.2]); g.box(x - a, x + a, 0, 0.2, z + a - w, z + a, gr, [0, 0.5, 1.2, 0.2]);
    g.box(x - a, x - a + w, 0, 0.2, z - a + w, z + a - w, gr, [0, 0.5, 1.2, 0.2]); g.box(x + a - w, x + a, 0, 0.2, z - a + w, z + a - w, gr, [0, 0.5, 1.2, 0.2]);
    g.box(x - a + w, x + a - w, 0, 0.05, z - a + w, z + a - w, pit, [9, 2, 0, 0], pit, [9, 2, 0, 0], 't');
    for (let i = -5; i <= 5; i++) g.box(x - a + w, x + a - w, 0.05, 0.16, z + i * 0.17 - 0.035, z + i * 0.17 + 0.035, metal, [0, 0.2, 9, 9]);
    // the stack: a round pipe on a collar, one plain grey as the street's painted steel, a darker rim at its open mouth, dark inside
    const tube = (rad, y0, y1, col) => {
      for (let k = 0; k < 8; k++) {
        const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2, am = (a0 + a1) / 2;
        const A = [x + rad * Math.cos(a0), z + rad * Math.sin(a0)], B = [x + rad * Math.cos(a1), z + rad * Math.sin(a1)];
        g.quad([B[0], y0, B[1]], [A[0], y0, A[1]], [A[0], y1, A[1]], [B[0], y1, B[1]], [Math.cos(am), 0, Math.sin(am)], [4.6, y0 + 3, 4.4, y1 + 3], col, [0, 0.2, 9, 9]);
      }
    };
    tube(VENT.mouth + 0.14, 0.16, 0.5, metal);
    tube(VENT.mouth, 0.5, VENT.stack - 0.14, steel);
    tube(VENT.mouth + 0.05, VENT.stack - 0.14, VENT.stack + 0.08, metal);
    const m = VENT.mouth * 0.72; g.box(x - m, x + m, VENT.stack - 0.12, VENT.stack - 0.04, z - m, z + m, pit, [9, 2, 0, 0], pit, [9, 2, 0, 0], 't');
  }
}
function buildFurniture(g, r, standards, rOwn = r) {
  const metal = lin('#2b2e33'), stone = COL.pale;
  // benches, planters and bollards along the pavements (plain stone and metal)
  for (let z = 292; z > -250; z -= 15) {
    if (inCrossRoad(z) || inCrossRoad(z - 4) || inCrossRoad(z + 4)) continue;
    for (const side of [-1, 1]) {
      const x = side * (20.6 + r.range(-0.4, 0.4)), kind = r();
      if (kind < 0.4) { g.box(x - 0.3, x + 0.3, 0, 0.45, z - 1.1, z + 1.1, stone, [0, 0.3, 2, 1]); g.box(x - 0.34, x + 0.34, 0.45, 0.52, z - 1.2, z + 1.2, lin('#6b5a48'), [0, 0.3, 2, 1]); }
      else if (kind < 0.75) { g.box(x - 0.9, x + 0.9, 0, 0.7, z - 0.9, z + 0.9, stone, [0, 0.6, 2, 1], lin('#2f4a26'), [8, 0.6, 3, 3]); }
      else for (let i = -2; i <= 2; i++) g.box(side * 15.8 - 0.09, side * 15.8 + 0.09, 0, 0.9, z + i * 1.6 - 0.09, z + i * 1.6 + 0.09, metal, [0, 0.2, 9, 9]);
    }
  }
  // LAMP STANDARDS: each takes one draw from the lamps' stream, in the furniture's order. The draw rides in the head's
  // own numbers and in its glow's, and the head is lit, steady, where the draw lies under the hour's share.
  const lamps = [];
  for (const [x, z, k, side, h, own] of standards) {
    const d = own ? rOwn() : r(), sx = x > 0 ? -1 : 1;
    g.box(x - 0.11, x + 0.11, 0, h, z - 0.11, z + 0.11, metal, [0, 0.2, 9, 9]);
    g.box(Math.min(x, x + sx * 1.5), Math.max(x, x + sx * 1.5), h - 0.12, h + 0.06, z - 0.07, z + 0.07, metal, [0, 0.2, 9, 9]);
    g.box(Math.min(x + sx * 0.9, x + sx * 1.9), Math.max(x + sx * 0.9, x + sx * 1.9), h - 0.3, h - 0.12, z - 0.22, z + 0.22, metal, [9, d, k, side], metal, [9, d, k, side]);
    lamps.push([x + sx * 1.4, h - 0.3, z, k, side, d]);
  }
  // traffic lamps at the corners of the cross streets: a post, a plain head of three lamps
  const signal = (x, z, face, phase) => {
    g.box(x - 0.09, x + 0.09, 0, 4.6, z - 0.09, z + 0.09, metal, [0, 0.2, 9, 9]);
    const dz = face === 's' ? 0.16 : face === 'n' ? -0.16 : 0, dx = face === 'e' ? 0.16 : face === 'w' ? -0.16 : 0;
    g.box(x - 0.2 + dx, x + 0.2 + dx, 3.4, 4.6, z - 0.2 + dz, z + 0.2 + dz, metal, [0, 0.2, 9, 9]);
    for (let i = 0; i < 3; i++) {
      const y = 3.55 + i * 0.36;
      g.box(x - 0.13 + dx * 1.3, x + 0.13 + dx * 1.3, y, y + 0.26, z - 0.13 + dz * 1.3, z + 0.13 + dz * 1.3, metal, [10, i * 0.5, phase, 0], metal, [10, i * 0.5, phase, 0], face);
    }
  };
  // each crossing takes its phase from the lamps' stream; its cross heads run half a period after its avenue heads
  for (const [za, zb] of [[-4, 18], [-126, -100], [-237, -225]]) {
    const ph = r();
    signal(15.6, zb + 1.2, 's', ph); signal(-15.6, za - 1.2, 'n', ph); signal(3.2, zb + 1.2, 's', ph); signal(-3.2, za - 1.2, 'n', ph);
    signal(16.6, za - 0.6, 'e', ph + 0.5); signal(-16.6, zb + 0.6, 'w', ph + 0.5);
  }
  return lamps;
}

// THE ARCH: one free-standing arch of pale stone, two legs that rise from the terrace, turn a quarter turn as they
// rise and meet. Each leg is a broad flat stone, 4.6 by 1.5 m at the foot and 2.6 by 1.1 m at the crown: at the foot its
// broad face looks down the avenue, at the crown it looks across the opening. The legs follow a quarter ellipse, so the
// crown is round. Our own form: nothing built on or behind it.
const ARCH = { z: -292, foot: 5, half: 9.6, rise: 27.5, n: 48, broad: 4.6 };
const archCentre = (s) => { const a = (Math.PI / 2) * s; return [ARCH.half * Math.cos(a), ARCH.foot + ARCH.rise * Math.sin(a)]; };
function buildArch(g) {
  const col = lin('#d0c6b2'), N = ARCH.n;
  const ring = (s, sign) => {
    const [cx, cy] = archCentre(s), e = 1e-3, [ax, ay] = archCentre(Math.min(1, s + e)), [bx, by] = archCentre(Math.max(0, s - e));
    let tx = ax - bx, ty = ay - by; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    // in-plane normal (pointing outward) and the depth axis
    const nx = ty, ny = -tx, hb = (ARCH.broad - 2.0 * s) / 2, ht = (1.5 - 0.4 * s) / 2, th = (Math.PI / 2) * s, cth = Math.cos(th), sth = Math.sin(th);
    const out = [];
    for (const [e, f] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) { const c = e * hb * cth - f * ht * sth, d = e * hb * sth + f * ht * cth; out.push([sign * (cx + nx * c), cy + ny * c, ARCH.z + d]); }
    return out;
  };
  for (const sign of [1, -1]) {
    let prev = ring(0, sign), v = 0;
    for (let i = 1; i <= N; i++) {
      const s = i / N, cur = ring(s, sign), dv = Math.hypot(cur[0][0] - prev[0][0], cur[0][1] - prev[0][1]);
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) % 4; let a = prev[k], b = prev[k2], c = cur[k2], d = cur[k];
        if (sign > 0) { const t = a; a = b; b = t; const t2 = c; c = d; d = t2; }
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = d[0] - a[0], wy = d[1] - a[1], wz = d[2] - a[2];
        let n = [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / nl, n[1] / nl, n[2] / nl];
        g.quad(a, b, c, d, n, [k * 3, v, k * 3 + 2.4, v + dv], col, [0, 0.77, 2.4, 1.1]);
      }
      prev = cur; v += dv;
    }
  }
  // the low plinth under the opening and the feet's pads
  g.box(-6.9, 6.9, 5, 6, ARCH.z - 2.2, ARCH.z + 2.2, col, [0, 0.7, 2.4, 0.5], col, [0, 0.7, 2.4, 1.2]);
  g.box(-8.6, 8.6, 5, 5.5, ARCH.z - 3.4, ARCH.z + 3.4, col, [0, 0.7, 2.4, 0.5], col, [0, 0.7, 2.4, 1.2]);
  for (const sx of [-1, 1]) g.box(sx * ARCH.half - 3.2, sx * ARCH.half + 3.2, 5, 5.35, ARCH.z - 2.4, ARCH.z + 2.4, col, [0, 0.7, 2.4, 0.35], col, [0, 0.7, 2.4, 1.2]);
}

// A TOP OF ITS KIND on a far tower that has none, by the tower's own number (its wall's draw; no new draw): under 0.35
// a stepped top (one setback, two under 0.18), under 0.65 a plant room behind a screen, else a plant room and a mast
function farTop(g, cx, cz, w, d, top, sd, col, fa) {
  const dk = [col[0] * 0.72, col[1] * 0.72, col[2] * 0.72], roofFa = [0, sd, 3, 3];
  if (sd < 0.35) {
    g.box(cx - w / 3, cx + w / 3, top, top + 7.8, cz - d / 3, cz + d / 3, col, fa, COL.roof, roofFa);
    if (sd < 0.18) g.box(cx - w / 5, cx + w / 5, top + 7.8, top + 15.6, cz - d / 5, cz + d / 5, col, fa, COL.roof, roofFa);
  } else if (sd < 0.65) g.box(cx - w / 2 + 2.5, cx + w / 2 - 2.5, top, top + 3.6, cz - d / 2 + 2.5, cz + d / 2 - 2.5, dk, [0, sd, 1.2, 3.6], COL.roof, roofFa);
  else {
    g.box(cx - w / 6, cx + w / 6, top, top + 5, cz - d / 6, cz + d / 6, dk, [0, sd, 3, 5], COL.roof, roofFa);
    g.box(cx - 0.45, cx + 0.45, top + 5, top + 5 + 12 + (sd - 0.65) * 60, cz - 0.45, cz + 0.45, lin('#3a3e46'), [0, 0.2, 9, 9]);
  }
}
// the terrace's edge walls, and the far city: towers of many kinds fading into haze, lower roofs beyond the bluff
function buildTerraceAndFar(g, r, env, density, rEast, land) {
  const pale = COL.pale;
  // parapets round the terrace (1.1 m), open toward the steps
  g.box(-60, 60, 5, 6.1, -330.5, -330, pale, [0, 0.4, 2.4, 1.1]);
  g.box(-60.5, -60, 5, 6.1, -330, -262, pale, [0, 0.4, 2.4, 1.1]); g.box(60, 60.5, 5, 6.1, -330, -262, pale, [0, 0.4, 2.4, 1.1]);
  g.box(-60, -26.4, 5, 6.1, -262.5, -262, pale, [0, 0.4, 2.4, 1.1]); g.box(26.4, 60, 5, 6.1, -262.5, -262, pale, [0, 0.4, 2.4, 1.1]);
  // cheek walls of the steps
  g.box(-26.4, -26, 0, 6.1, -276, -262, pale, [0, 0.4, 2.4, 1.1]); g.box(26, 26.4, 0, 6.1, -276, -262, pale, [0, 0.4, 2.4, 1.1]);
  // the far city on a loose grid; on the sun's side no tower may stand in the sun's way to the avenue
  const sunWest = env.sunDir.x < 0, tan = env.sunDir.y / Math.max(0.05, Math.hypot(env.sunDir.x, env.sunDir.z)), ax = Math.max(0.2, Math.abs(env.sunDir.x) / Math.hypot(env.sunDir.x, env.sunDir.z));
  const styles = [1, 2, 2, 5, 6, 3, 4], cols = [COL.lime, COL.steel, COL.blue, COL.bronze, COL.pale, COL.green, COL.terra, COL.conc, COL.granite];
  let n = 0;
  for (let gx = -9; gx <= 9; gx++) for (let gz = -3; gz <= 12; gz++) {
    const cx = gx * 78 + r.range(-12, 12), cz = gz * 92 + r.range(-14, 14) + 40, keep = r(), hh = r(), w = r.range(26, 44), d = r.range(26, 46), st = styles[Math.floor(r() * styles.length)], col = cols[Math.floor(r() * cols.length)], sd = r();
    if (Math.abs(cx) < 100 && cz < 345) continue;
    if (cx > -175 && cx < 0 && cz < 345) continue;
    if (Math.abs(cx) < 46) continue;
    if (cx - w / 2 < RIM_W + 14) continue;   // none stands beyond the bluff's west rim
    if (cz - d / 2 < -258) continue;
    if (keep > 0.9 * Math.min(1, density)) continue;
    const dist = Math.hypot(cx, cz - 20);
    let h = 34 + hh * hh * 190 * (0.6 + 0.4 * Math.min(1, dist / 500));
    const sunny = env.sunK > 0 && tan < 0.5 && ((sunWest && cx < 0) || (!sunWest && cx > 0));
    if (sunny) h = Math.min(h, 18 + (tan * (Math.abs(cx) - 30)) / ax);
    if (cx < -100 && cz < -110) h = Math.min(h, 25 + hh * 15);
    g.box(cx - w / 2, cx + w / 2, 0, h, cz - d / 2, cz + d / 2, col, [st, sd, st === 2 || st === 5 ? 2.0 : 3.3, 3.9], COL.roof, [0, sd, 3, 3]);
    if (h > 90 && hh > 0.5) g.box(cx - w / 4, cx + w / 4, h, h + 9 + hh * 14, cz - d / 4, cz + d / 4, col, [st, sd, 3.3, 3.9], COL.roof, [0, sd, 3, 3]);
    else if (h > 50 && !sunny) farTop(g, cx, cz, w, d, h, sd, col, [st, sd, st === 2 || st === 5 ? 2.0 : 3.3, 3.9]);
    n++;
  }
  for (let gx = 0; gx < 5; gx++) for (let gz = 0; gz < 9; gz++) {
    const cx = -90 - gx * 46 + r.range(-6, 6), z0 = 318 - gz * 50, hh = r(), w = r.range(26, 38), d = r.range(30, 42), st = styles[Math.floor(r() * styles.length)], col = cols[Math.floor(r() * cols.length)], sd = r();
    let cz = z0 + r.range(-4, 4);
    if (cz - d / 2 < 26 && cz + d / 2 > -12) cz = cz > 7 ? 26 + d / 2 + 2 : -12 - d / 2 - 2;
    if (cz - d / 2 < -92) continue;
    const cap = env.sunK > 0 && sunWest && tan < 0.5 ? 14 + (tan * (Math.abs(cx) + w / 2 - 30)) / ax : 60;
    const h = Math.min(cap, 16 + hh * 40);
    g.box(cx - w / 2, cx + w / 2, 0, h, cz - d / 2, cz + d / 2, col, [st, sd, st === 2 || st === 5 ? 2.0 : 3.3, 3.8], COL.roof, [11, sd, 3, 3]);
  }
  // sheds and halls of the town under the bluff, to the north and north-west: each takes its draws, and stands where the
  // low land's law has the valley floor (the land's own mesh builds them)
  for (let i = 0; i < 90; i++) {
    const x = r.range(-1100, 700), z = r.range(-1500, -360), w = r.range(18, 60), d = r.range(18, 60), h = r.range(6, 24), col = cols[Math.floor(r() * cols.length)], sd = r();
    if (land.dist(x, z) < land.valleyW(land.bearing(x, z)) - 40) land.sheds.push([x, z, w, d, h, col, sd]);
  }
  // THE FAR CITY in three depths on the low land, from just east of north round to the east (never in the bright
  // north-west, never behind the arch): each depth has its own number, distance, height and breadth
  for (const [count, d0, d1, h0, h1, w0, w1] of FAR_CITY) {
    for (let i = 0; i < Math.round(count * Math.min(1.2, density)); i++) {
      const ang = rEast.range(FAR_B0, FAR_B1), dist = rEast.range(d0, d1), x = Math.sin(ang) * dist, z = -292 - Math.cos(ang) * dist, w = rEast.range(w0, w1), d = rEast.range(w0, w1), h = rEast.range(h0, h1), st = styles[Math.floor(rEast() * styles.length)], col = cols[Math.floor(rEast() * cols.length)], sd = rEast();
      if (z > -300 || x < 60) continue;
      g.box(x - w / 2, x + w / 2, LAND_Y - 2, LAND_Y + h, z - d / 2, z + d / 2, col, [st, sd, 4.2, 4.4], COL.roof, [0, sd, 3, 3]);
      if (h > (h0 + h1) / 2) g.box(x - w / 4, x + w / 4, LAND_Y + h, LAND_Y + h + 14, z - d / 4, z + d / 4, col, [st, sd, 4.2, 4.4], COL.roof, [0, sd, 3, 3]);
      else farTop(g, x, z, w, d, LAND_Y + h, sd, col, [st, sd, 4.2, 4.4]);
    }
  }
  // the terrace dressed: stone benches, planters at the head of the steps
  const gr = COL.granite, plantedT = lin('#2c4a24'), metalT = lin('#2b2e33');
  // planters up the steps (their trees are the tree builder's), benches under the grove, between its trees
  for (const [x, y, z] of stepPlanters()) g.box(x - 1.1, x + 1.1, y - 1.9, y, z - 1.1, z + 1.1, gr, [0, 0.6, 1.1, 0.95], plantedT, [8, 0.47, 3, 3]);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) g.box(-40 - i * 11.5 - 5.75 - 1.6, -40 - i * 11.5 - 5.75 + 1.6, 0, 0.48, -141 - row * 13 - 0.4, -141 - row * 13 + 0.4, gr, [0, 0.6, 1.6, 0.48]);
  // lit bollards along both sides of the terrace's middle walk, one every 5.5 m
  for (const x of [-16, 16]) for (let z = -282; z > -328; z -= 5.5) { g.box(x - 0.08, x + 0.08, 5, 5.72, z - 0.08, z + 0.08, metalT, [0, 0.2, 9, 9]); g.box(x - 0.11, x + 0.11, 5.72, 5.9, z - 0.11, z + 0.11, metalT, [13, 0.5, 9, 9], metalT, [13, 0.5, 9, 9]); }
  for (const x of [-31, -19, 19, 31]) for (const z of [-286, -299, -312]) g.box(x - 1.7, x + 1.7, 5, 5.5, z - 0.45, z + 0.45, gr, [0, 0.6, 1.7, 0.5]);
  for (const x of [-23, -13, 13, 23]) g.box(x - 2.3, x + 2.3, 5, 5.75, -280.2, -277.8, gr, [0, 0.6, 2.3, 0.75], plantedT, [8, 0.4 + x * 0.01, 3, 3]);
  return n;
}

// ---------------------------------------------------------------- trees (the kit's broadleaves as old planes), tinted by the sun's place
// THE TREES AS THE PLAN LAYS THEM, from the trees' own stream: the crowns' shapes first, then every tree's place and
// height. The city builds them later and goes on in the same stream.
async function layTrees(ctx, r, path, plan, rSq = r, rMed = r) {
  // the planes' leaves in the kerb trees' own lighter greens, so a crown reads as leaves in the evening light
  const pal = { leaf: '#3a6e30', leafLight: '#93a244', leafDark: '#1d4426', bark: '#a9a08a', barkDark: '#5c5648' };
  const big = [], small = [];
  // four shapes of plane: one in full leaf and three lighter; every plane takes one of the four by its draw
  for (let i = 0; i < 4; i++) { big.push(flora.oakGeometry({ rng: r, height: 16, detail: i === 0 ? 2 : 1, fullness: 0.74, ...pal })); await ctx.yield(); }
  for (let i = 0; i < 2; i++) { small.push(flora.oakGeometry({ rng: r, height: 9, detail: 0, fullness: 0.8, leaf: '#3a6e30', leafLight: '#93a244', leafDark: '#1d4426', bark: '#8f8674', barkDark: '#4c463c' })); await ctx.yield(); }
  // every tree: [x, ground y, z, height, kind 0 big 1 small]
  const list = [];
  // THE MEDIAN'S PLANES: ONE STAGGERED ROW, kept as street trees are. The median has a place every 6.6 m; every place
  // by rule (no deal) only every second place carries a plane, on alternate sides of the
  // axis, so a plane stands every 13.2 m. The row is open at every cross street and once in the middle of every block,
  // 20 m and more from crown to crown (medianGaps), so the two carriageways show between the crowns from above. Every
  // plane is kept to one height (medianKeep): the dealt height only says how far under it a plane stands (up to an
  // eighth). None stands beyond the median's end.
  const keep = medianKeep(path), gaps = medianGaps(keep);
  // (NO DRAW IS TAKEN THAT NOTHING READS: the row has a stream of its own, here and when it is built (the sixth
  // number), and only a place where a plane stands takes its three draws)
  for (let i = 0; ; i += 2) {
    const z0 = MEDIAN_Z0 - i * MEDIAN_DZ; if (z0 < MEDIAN_END + 1.5) break;
    if (gaps.some(([a, b]) => z0 > a && z0 < b)) continue;
    const jx = rMed.range(-0.35, 0.35), h = rMed.range(15, 17), z = z0 + rMed.range(-0.8, 0.8);
    // (the seventh number: a plane kept this small takes one of the three lighter crowns, never the finest one)
    list.push([((i / 2) % 2 ? 2.3 : -2.3) + jx, 0, z, (keep * h) / 17, 0, rMed, 1]);
  }
  // the kerbs' smaller trees, one between every two lamp standards on both sides; a place in a cross street's way
  // carries none and takes no draw
  for (let k = -9; k <= 9; k++) {
    const z = LAMP_Z0 + k * LAMP_DZ + 15;
    if (inCrossRoad(z) || inCrossRoad(z + 5) || inCrossRoad(z - 5) || z < -252) continue;
    for (const side of [-1, 1]) { const hh = r.range(7.2, 9.4), zt = z + r.range(-1, 1); list.push([side * 17.5, 0, zt, hh, 1]); }
  }
  // the grove of fourteen in the southern third of the square
  for (let i = 0; i < 14; i++) list.push([-40 - (i % 7) * 11.5 + r.range(-2, 2) * 0.15, 0, -141 - Math.floor(i / 7) * 13 + r.range(-2, 2) * 0.15, r.range(10, 12), 0]);
  // the roof garden on the broad podium of the east side, the roof garden of the terracotta mid-rise
  const e6 = plan.east[5], e3 = plan.east[2];
  for (let i = 0; i < 10; i++) list.push([31 + (i % 2) * 13 + r.range(-2, 2), e6.pod, -140 - Math.floor(i / 2) * 17 + r.range(-3, 3), r.range(6, 8.5), 1]);
  for (let i = 0; i < 5; i++) list.push([32 + r.range(0, 22), e3.t[0].h, 28 + i * 6.5, r.range(4, 5.5), 1]);
  // clipped trees in two rows at each side of the terrace; forecourt trees in the gaps of the west side
  for (let i = 0; i < 5; i++) for (const x of [-48, -38, 38, 48]) list.push([x, 5, -284 - i * 9.5, 7.4, 1]);
  for (const [x, z] of [[-36, 126], [-36, 139], [-50, 132], [-34, 250], [-48, 252], [-36, 30], [-48, 28], [-112, -205], [-100, -210]]) list.push([x, 0, z, r.range(8, 10.5), 1]);
  for (const [x, z] of [[30, -40], [34, -22], [39, -44]]) list.push([x, x > 36 ? 4 : 2, z, 5.5, 1]);
  // three more of the square's planes along its west side, on its westmost band (x -108), at the grove's own spacing
  // north from the grove's last row; dealt, here and when built, from a stream of their own (the sixth number)
  for (let i = 1; i <= 3; i++) list.push([-108 + rSq.range(-0.3, 0.3), 0, -154 - i * 11.5 + rSq.range(-0.3, 0.3), rSq.range(10, 12), 0, rSq]);
  clearCrowns(list, path);
  return { rng: r, big, small, list };
}
// THE HEIGHT THE MEDIAN'S PLANES ARE KEPT TO, one measure of the avenue taken once from the route's line: 9 m, and
// half a metre more for a crown's sway, under the lowest height the line has anywhere above the median.
const MEDIAN_Z0 = 297, MEDIAN_DZ = 6.6;
function medianKeep(path) {
  const p = new THREE.Vector3(); let low = 1e9;
  for (let m = 0; m <= path.length; m += 1) { path.posAtDist(m, p); if (p.z >= MEDIAN_END && p.y < low) low = p.y; }
  return low - 9.5;
}
// WHERE THE ROW IS OPEN, [z north, z south] of each stretch whose places carry no plane.
// At a cross street: wherever a trunk could stand in the carriageway (a place's own play along the row is 0.8 m).
// In the middle of every block (between two carriageways, or a carriageway and an end of the row): as many places as
// leave 20 m clear between the crowns either side, and no more. With n places empty the trunks either side stand
// n + 1 spacings apart, and a kept crown reaches about 0.55 of its height (the kit's planes reach 0.53 to 0.66 of
// their height on their longest side), so n is the least for which (n + 1) x 13.2 m holds 20 m and two reaches: two
// places at the kept height, 39.6 m from trunk to trunk and about 28 m from crown to crown.
function medianGaps(keep) {
  const step = 2 * MEDIAN_DZ, n = Math.ceil((20 + 2 * 0.55 * keep) / step - 1), out = [], ends = [MEDIAN_Z0];
  for (const [zn, zs] of [[-5.5, 19.5], [-127.5, -98.5]]) { out.push([zn - 0.8, zs + 0.8]); ends.push(zs, zn); }
  ends.push(MEDIAN_END);
  for (let k = 0; k + 1 < ends.length; k += 2) { const mid = (ends[k] + ends[k + 1]) / 2; out.push([mid - (n * step) / 2, mid + (n * step) / 2]); }
  return out;
}
// the law of clear air: no crown within 3.2 m of the route's line (the crown sways: 0.8 m more)
const clearCrowns = (list, path) => { for (const t of list) { const q = path.nearestXZ(t[0], t[2]); if (q.dist < 11) t[3] = Math.min(t[3], q.y - t[1] - 5.8); } };
async function buildTrees(ctx, laid, env, sunAt, path, detail, roofTrees = [], rTubs = laid.rng) {
  const wind = flora.makeWind({ direction: [0.5, 0.86], strength: 1.75, speed: 1.2 });
  // LEAVES IN THE LOW SUN, by what the kit's leaf light allows: the light that comes through a leaf seen against the
  // sun (the kit's backlight, at its own full strength) takes the hour's sun colour half way from a leaf's yellow, and
  // the soft edge of light scattered inside a crown is whole (wrap 1); the shade under the sky is a little lighter
  const sunHue = env.sunColor.clone(); sunHue.multiplyScalar(1 / Math.max(sunHue.r, sunHue.g, sunHue.b, 1e-3));
  const matOpts = { wind, backlight: 1.0, backlightTint: new THREE.Color('#e6d27a').lerp(sunHue, 0.5), wrap: 1, ambient: 1.5, leafAmbient: 1.45, sheen: 0.5 };
  await flora.prepareLeafTexture(matOpts, ctx.yield);
  const mat = flora.windMaterial(matOpts);
  const r = laid.rng, big = laid.big, small = laid.small, list = laid.list.slice();
  // the trees in the steps' planters and in the roofs' tubs come last and are dealt from a stream of their own; a
  // planter nearer the line than TUB_CLEAR carries no tree and takes no draw
  const late = [...stepPlanters().filter(([x, , z]) => tubClear(path, x, z)).map(([x, y, z]) => [x, y, z, 4.6, 1, rTubs]), ...roofTrees.map((t) => [t[0], t[1], t[2], t[3], 1, rTubs])];
  clearCrowns(late, path); list.push(...late);
  const group = new THREE.Group(); let tris = 0, calls = 0;
  const q4 = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s3 = new THREE.Vector3();
  const sets = [...big.map((g, i) => ({ g, kind: 0, items: [], fine: i === 0 })), ...small.map((g) => ({ g, kind: 1, items: [] }))];
  for (const t of list) { const cand = sets.filter((s) => s.kind === t[4] && !(t[6] && s.fine)), rq = t[5] || r; cand[Math.floor(rq() * cand.length)].items.push(t); }
  for (const s of sets) {
    const H = s.g.userData.height || (s.kind ? 9 : 16), put = [];
    for (const t of s.items) {
      const rq = t[5] || r, k = t[3] / H, wide = k * rq.range(0.95, 1.15);
      e.set(rq.range(-0.03, 0.03), rq.range(0, Math.PI * 2), rq.range(-0.03, 0.03)); q4.setFromEuler(e);
      const lit = sunAt(t[0], t[1] + t[3] * 0.8, t[2], 8), yel = rq.range(0, 1), br = rq.range(0.85, 1.1);
      p.set(t[0], t[1] - 0.05, t[2]); s3.set(wide, k, wide);
      // a crown the low sun reaches (no tower in the sun's way) is warm and bright, one in a tower's shade cool
      put.push([new THREE.Matrix4().compose(p, q4, s3), new THREE.Color().setRGB(br * lerp(0.74, 1.22, lit) * (1 + 0.1 * yel), br * lerp(0.86, 1.1, lit) * (1 + 0.03 * yel), br * lerp(1.0, 0.66, lit) * (1 - 0.12 * yel))]);
    }
    if (!put.length) continue;
    const mesh = new THREE.InstancedMesh(s.g, mat, put.length);
    put.forEach(([m, col], i) => { mesh.setMatrixAt(i, m); mesh.setColorAt(i, col); });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere(); mesh.frustumCulled = false;
    group.add(mesh); tris += (s.g.userData.triangles || s.g.index.count / 3) * put.length; calls++;
  }
  return { object: group, triangles: tris, drawCalls: calls, wind, list, update(time) { wind.update(time); } };
}

// ---------------------------------------------------------------- traffic: plain cars with mirror-dark glass on one long circuit
// of the avenue (north up the east carriageway, round the median's end at the lane before the steps, south down the west one,
// and round again far to the south in the haze), all on the clock; parked cars in the cross streets.
// the circuit's two ends (the far turn in the haze to the south, the turn round the median's end), a car's length, and
// the least clear way between two cars of one lane, nose to tail along the lane
const CAR_ZS = 640, CAR_ZN = -224, CAR_LEN = 4.4, CAR_GAP = 10;
const VERT_CAR = /* glsl */`
attribute vec4 aCar; attribute float kind;
varying vec3 vW, vN; varying float vKind, vSeed, vMove; varying vec2 vUv;
uniform float uTime;
void main(){
  float r = aCar.y, ZS = ${CAR_ZS.toFixed(1)}, ZN = ${CAR_ZN.toFixed(1)}, L1 = ZS - ZN, arc = 3.14159265 * r, tot = 2. * L1 + 2. * arc;
  vec2 c, fwd; float mv = step(.01, aCar.z);
  if (mv > .5) {
    float s = mod(aCar.x + aCar.z * uTime, tot);
    if (s < L1) { c = vec2(r, ZS - s); fwd = vec2(0., -1.); }
    else if (s < L1 + arc) { float a = (s - L1) / r; c = vec2(r * cos(a), ZN - r * sin(a)); fwd = vec2(-sin(a), -cos(a)); }
    else if (s < 2. * L1 + arc) { c = vec2(-r, ZN + (s - L1 - arc)); fwd = vec2(0., 1.); }
    else { float a = (s - 2. * L1 - arc) / r; c = vec2(-r * cos(a), ZS + r * sin(a)); fwd = vec2(sin(a), cos(a)); }
  } else { c = aCar.xy; fwd = aCar.w > 0. ? vec2(1., 0.) : vec2(-1., 0.); }
  vec2 right = vec2(-fwd.y, fwd.x);
  vec2 xz = c + right * position.x - fwd * position.z;
  vec2 nxz = right * normal.x - fwd * normal.z;
  vW = vec3(xz.x, position.y, xz.y); vN = vec3(nxz.x, normal.y, nxz.y); vKind = kind; vSeed = fract(abs(aCar.w) * 7.31 + aCar.x * .013); vMove = mv; vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const fragCar = (animalsGlsl) => /* glsl */`
varying vec3 vW, vN; varying float vKind, vSeed, vMove; varying vec2 vUv;
${GLSL_COMMON}
${animalsGlsl}
void main(){
  vec3 n = normalize(vN), V = normalize(vW - cameraPosition);
  float sunVis = cityRay(vW + vec3(0., .3, 0.), uSunDir, 6.) * arwShade(vW);
  vec3 R = reflect(V, n); R.y = abs(R.y);
  float fres = .08 + .92 * pow(1. - clamp(dot(-V, n), 0., 1.), 4.);
  gNzLod = 3.; vec3 sk = arwSky(R, sunVis); gNzLod = 0.;
  float s = floor(vSeed * 64.) / 64. + .004;
  vec3 body = s < .2 ? vec3(.55, .56, .58) : s < .38 ? vec3(.06, .065, .08) : s < .55 ? vec3(.72, .72, .70) : s < .68 ? vec3(.10, .15, .30) : s < .8 ? vec3(.32, .07, .06) : s < .9 ? vec3(.30, .28, .25) : vec3(.12, .2, .18);
  vec3 col = body * (uSkyAmb * (.6 + .4 * n.y) + uSunCol * uSunK * max(dot(n, uSunDir), 0.) * sunVis) + sk * fres * .6;
  if (vKind > .5 && vKind < 1.5) col = sk * (fres * .9 + .06) * vec3(.8, .9, 1.);
  if (vKind > 1.5 && vKind < 2.5) col = mix(vec3(.5), vec3(1., .93, .78) * 6., vMove);
  if (vKind > 2.5) col = mix(vec3(.12, .01, .01), vec3(1., .07, .04) * 3.2, vMove);
  if (vKind < -.5) col = vec3(.015, .015, .018);
  gl_FragColor = vec4(arwHaze(col, vW), 1.);
}`;
const FRAG_POOL = /* glsl */`
varying vec3 vW, vN; varying float vKind, vSeed, vMove; varying vec2 vUv;
${GLSL_COMMON}
void main(){
  float a = (1. - vUv.y); a *= a; float e = 1. - clamp(abs(vUv.x - .5) * 2., 0., 1.); a *= e * e;
  vec3 c = vKind < 4.5 ? vec3(1., .88, .66) * .55 : vec3(1., .10, .06) * .32;
  float wetK = .55 + .9 * nz(vW.xz * .06);
  gl_FragColor = vec4(c * a * vMove * wetK * (1. - clamp(length(vW - cameraPosition) * uFogK * 1.5, 0., .9)), 1.);
}`;
function buildTraffic(r, U, animals, density, detail, rPark = r) {
  const P = [], N = [], K = [], UV = [], I = [], P2 = [], K2 = [], UV2 = [], I2 = [];
  const quad = (a, b, c, d, n, kind, pool) => {
    const TP = pool ? P2 : P, TK = pool ? K2 : K, TU = pool ? UV2 : UV, TI = pool ? I2 : I, i = TP.length / 3;
    TP.push(...a, ...b, ...c, ...d); TK.push(kind, kind, kind, kind); TU.push(0, 0, 1, 0, 1, 1, 0, 1); TI.push(i, i + 1, i + 2, i, i + 2, i + 3);
    if (!pool) for (let k = 0; k < 4; k++) N.push(n[0], n[1], n[2]);
  };
  const box = (x0, x1, y0, y1, z0, z1, kind) => {
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], kind); quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], kind);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], kind); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], kind);
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], kind);
  };
  // a plain saloon: forward is -z. body, cabin of dark glass, wheels, lamps
  box(-0.9, 0.9, 0.32, 0.98, -2.2, 2.2, 0); box(-0.8, 0.8, 0.98, 1.5, -0.7, 1.5, 1); box(-0.82, 0.82, 1.5, 1.54, -0.75, 1.55, 0);
  for (const [x, z] of [[-0.92, -1.4], [0.92, -1.4], [-0.92, 1.4], [0.92, 1.4]]) box(x - 0.12, x + 0.12, 0, 0.66, z - 0.34, z + 0.34, -1);
  for (const x of [-0.62, 0.62]) {
    quad([x + 0.2, 0.62, -2.21], [x - 0.2, 0.62, -2.21], [x - 0.2, 0.84, -2.21], [x + 0.2, 0.84, -2.21], [0, 0, -1], 2);
    quad([x - 0.22, 0.66, 2.21], [x + 0.22, 0.66, 2.21], [x + 0.22, 0.86, 2.21], [x - 0.22, 0.86, 2.21], [0, 0, 1], 3);
  }
  // the lamps' light lying on the wet street: ahead warm, behind red (drawn added)
  quad([1.7, 0.06, -2.0], [-1.7, 0.06, -2.0], [-3.2, 0.06, -17], [3.2, 0.06, -17], [0, 1, 0], 4, true);
  quad([-1.4, 0.06, 2.0], [1.4, 0.06, 2.0], [2.2, 0.06, 8.5], [-2.2, 0.06, 8.5], [0, 1, 0], 5, true);
  const cars = [];
  const nMove = Math.max(6, Math.round(52 * density * (0.5 + 0.5 * detail)));
  // MOVING CARS, LANE BY LANE. Every car takes its three draws (its lane, its place within its share, its colour).
  // Each lane's cars are then laid round that lane's own circuit (two straights and two half turns of the lane's
  // radius), one to each equal share of it and by its draw within its share; the ends of every share stay free, so
  // two neighbours' middles are never nearer than a car's length and CAR_GAP (10 m nose to tail along the lane, which
  // is over 8 m as the crow flies on the tighter turn); a lane takes no more cars than that spacing lets in. All cars
  // of a lane run at one speed, so the spacing holds at every second.
  const lanes = [[], []];
  for (let i = 0; i < nMove; i++) { const lane = r() < 0.6 ? 0 : 1, at = r.range(0.1, 0.9), sd = r.range(0.05, 0.95); lanes[lane].push([at, sd]); }
  lanes.forEach((list, lane) => {
    const rad = lane ? 9.6 : 6.0, tot = 2 * (CAR_ZS - CAR_ZN) + 2 * Math.PI * rad, least = CAR_LEN + CAR_GAP;
    const n = Math.min(list.length, Math.floor(tot / least)), share = tot / Math.max(1, n), free = Math.min(0.5, least / (2 * share));
    for (let k = 0; k < n; k++) cars.push([(k + lerp(free, 1 - free, (list[k][0] - 0.1) / 0.8)) * share, rad, lane ? 9.5 : 11.5, list[k][1]]);
  });
  for (const zc of [-2.7, 16.7, -124.7, -101.3]) for (let x = 34; x < 190; x += 6.4) for (const sx of [-1, 1]) {
    // parked cars are dealt from a stream of their own; every place takes its three draws, whether a car stands or not
    const here = rPark(), dx = rPark.range(-0.6, 0.6), ph = rPark.range(0.05, 0.95);
    if (here > 0.5 * Math.min(1.2, density)) continue;
    cars.push([sx * x + dx, zc, 0, ph * (zc === -2.7 || zc === -124.7 ? 1 : -1)]);
  }
  const inst = new THREE.InstancedBufferAttribute(new Float32Array(cars.flat()), 4);
  const mk = (pos, kind, uv, idx, nor) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('kind', new THREE.Float32BufferAttribute(kind, 1)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor || new Array(pos.length).fill(0).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
    g.setIndex(idx); g.setAttribute('aCar', inst); g.instanceCount = cars.length; return g;
  };
  const m1 = new THREE.Mesh(mk(P, K, UV, I, N), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_CAR, fragmentShader: fragCar(animals.glsl) }));
  const m2 = new THREE.Mesh(mk(P2, K2, UV2, I2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_CAR, fragmentShader: FRAG_POOL, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m1.frustumCulled = false; m2.frustumCulled = false; m2.renderOrder = 1;
  return { meshes: [m1, m2], triangles: (I.length / 3 + I2.length / 3) * cars.length, count: cars.length };
}

// ---------------------------------------------------------------- lamp glows (a soft dab at each lit head) and the far flock
const VERT_GLOW = /* glsl */`
attribute vec4 aLamp;
varying vec2 vQ; varying float vOn;
uniform float uLampShare;
void main(){
  vQ = position.xy; vOn = step(aLamp.w, uLampShare);
  vec4 mv = viewMatrix * vec4(aLamp.xyz, 1.); mv.xy += position.xy * 1.25;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG_GLOW = /* glsl */`
varying vec2 vQ; varying float vOn;
void main(){ float d = clamp(dot(vQ, vQ), 0., 1.); float a = (1. - d); a *= a; gl_FragColor = vec4(vec3(1., .78, .5) * (a * a * 1.2 + a * .1) * vOn, 1.); }`;
function buildGlows(lampList, U) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aLamp', new THREE.InstancedBufferAttribute(new Float32Array(lampList.flatMap((l) => [l[0], l[1], l[2], l[5]])), 4));
  g.instanceCount = lampList.length;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_GLOW, fragmentShader: FRAG_GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.frustumCulled = false; m.renderOrder = 2; return m;
}
// two flocks of small birds, one far and one nearer above the square: each bird a pair of beating wings, each flock on a slow round of its own
const VERT_BIRD = /* glsl */`
attribute vec4 aBird;
uniform float uTime; uniform vec2 uFlock; varying float vShade;
void main(){
  float ph = aBird.w * 6.2832, nearF = step(.5, aBird.w);
  float t = uTime * mix(.16, .23, nearF) + aBird.x * .02 + mix(uFlock.x, uFlock.y, nearF);
  // two flocks: one far over the west, one nearer on a round above the square (never lower than 30 m: far above the line)
  vec3 c = mix(vec3(-150. + cos(t) * 70., 78. + sin(t * 1.7) * 9., -215. + sin(t) * 55.), vec3(-66. + cos(t) * 40., 58. + sin(t * 1.3) * 5., -176. + sin(t) * 44.), nearF);
  vec3 off = vec3(aBird.x, max(aBird.y, -8.), aBird.z) + vec3(sin(uTime * .5 + ph), sin(uTime * .37 + ph * 2.), cos(uTime * .43 + ph)) * 3.;
  vec2 fwd = normalize(vec2(-sin(t), cos(t))); vec2 right = vec2(-fwd.y, fwd.x);
  float flap = sin(uTime * 7. + ph * 3.) * .9;
  vec3 lp = position; lp.y += abs(lp.x) * flap * .55;
  vec3 wp = c + off + vec3(right * lp.x + fwd * lp.z, lp.y).xzy;
  vShade = .5 + .5 * flap;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const FRAG_BIRD = /* glsl */`
varying float vShade;
uniform vec3 uFogCool;
void main(){ gl_FragColor = vec4(mix(vec3(.05, .055, .075), uFogCool, .35 + .1 * vShade), 1.); }`;
function buildBirds(r, U, n) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.9, 0, 0.1, 0, 0, -0.28, 0, 0, 0.3, 0.9, 0, 0.1], 3)); g.setIndex([0, 2, 1, 1, 2, 3]);
  const a = []; for (let i = 0; i < n; i++) a.push(r.gauss() * 16, r.gauss() * 6, r.gauss() * 16, r());
  g.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); g.instanceCount = n;
  // where each flock stands on its round when the clock starts: two draws after the birds' own
  U.uFlock = { value: new THREE.Vector2(r() * Math.PI * 2, r() * Math.PI * 2) };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_BIRD, fragmentShader: FRAG_BIRD, side: THREE.DoubleSide }));
  m.frustumCulled = false; return m;
}

// ---------------------------------------------------------------- relief: what makes the boxes buildings
function prismWall(g, pts, y0, y1, col, fa, world = false) {
  let u = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let ua = u, ub = u + len;
    if (world && Math.abs(b[0] - a[0]) < 1e-6) { ua = a[1]; ub = b[1]; } else if (world && Math.abs(b[1] - a[1]) < 1e-6) { ua = a[0]; ub = b[0]; }
    // a point of a round corner carries the corner's own outward normal (its third and fourth numbers), so the wall is
    // lit and mirrors as a round wall and its bands run round the turn unbroken; a flat wall keeps its one normal
    const flat = [(b[1] - a[1]) / len, 0, -(b[0] - a[0]) / len], na = a.length > 3 ? [a[2], 0, a[3]] : flat, nb = b.length > 3 ? [b[2], 0, b[3]] : flat;
    g.quad([b[0], y0, b[1]], [a[0], y0, a[1]], [a[0], y1, a[1]], [b[0], y1, b[1]], [nb, na, na, nb], [ub, y0, ua, y1], col, fa);
    u += len;
  }
}
// a rectangle with round corners (seg flats to the quarter turn, each point with its outward normal) or, with one flat
// to the corner, cut corners (plain flats)
function roundRect(x0, x1, z0, z1, rad, seg = 12) {
  const pts = [], cs = [[x1 - rad, z0 + rad, -90], [x1 - rad, z1 - rad, 0], [x0 + rad, z1 - rad, 90], [x0 + rad, z0 + rad, 180]];
  for (const [cx, cz, a0] of cs) for (let i = 0; i <= seg; i++) { const a = ((a0 + (90 * i) / seg) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); pts.push(seg > 1 ? [cx + rad * c, cz + rad * s, c, s] : [cx + rad * c, cz + rad * s]); }
  return pts;
}
// THE STREET WALLS OF SHOPS: every block whose south end lies at or north of street B's north side (z -130)
const SHOP_Z = -130;
// AN AWNING in a plain colour over one shopfront: a sloped cloth from the wall (4.6 m up) out 1.9 m and down to 3.5 m,
// a valance 0.3 m deep, closed at both ends; four plain colours in turn by the bay's own number along its street.
// Nothing is on it. alongZ: the wall runs north and south at x = f (else east and west at z = f); s: the way out.
const AWN = ['#8c3b2e', '#3f5f4a', '#b98a3a', '#34465e'].map((h) => lin(h));
function awning(g, alongZ, f, s, a, b, k) {
  const col = AWN[((k % 4) + 4) % 4], o = f + s * 1.9, fa = [0, 0.3, 9, 9], uv = [3, 3, 5, 5];
  const P = (al, out, y) => (alongZ ? [out, y, al] : [al, y, out]), V = (al, out, y) => (alongZ ? [out, y, al] : [al, y, out]);
  // each face is turned to look the way its normal does
  const face = (p, q, r2, t, n) => {
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], w = [r2[0] - p[0], r2[1] - p[1], r2[2] - p[2]];
    const c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    if (c[0] * n[0] + c[1] * n[1] + c[2] * n[2] < 0) g.quad(t, r2, q, p, n, uv, col, fa); else g.quad(p, q, r2, t, n, uv, col, fa);
  };
  const nl = Math.hypot(1.1, 1.9);
  face(P(a, f, 4.6), P(b, f, 4.6), P(b, o, 3.5), P(a, o, 3.5), V(0, (s * 1.1) / nl, 1.9 / nl));
  face(P(a, o, 3.2), P(b, o, 3.2), P(b, o, 3.5), P(a, o, 3.5), V(0, s, 0));
  for (const [e, d] of [[a, -1], [b, 1]]) face(P(e, f, 4.6), P(e, o, 3.5), P(e, o, 3.2), P(e, f, 4.3), V(d, 0, 0));
}
// NO TREE IN A TUB OR A PLANTER stands nearer the route's line than this, measured in plan from the path, once, at
// build (m): a roof's place nearer than that takes the pergola, a planter of the steps nearer than that stays open
const TUB_CLEAR = 14;
const tubClear = (path, x, z) => !path || path.nearestXZ(x, z).dist >= TUB_CLEAR;
function enrich(g, plan, r, rr, path, rt = rr) {
  const dk = (c, k = 0.86) => [c[0] * k, c[1] * k, c[2] * k], planted = lin('#2c4a24'), timber = lin('#5a4030');
  for (const b of [...plan.east, ...plan.west]) {
    const east = b.n[0] === 'E';
    if (b.pod > 0) {
      const xf = east ? 26 : -26, sx = east ? -1 : 1, faces = east ? 'wsn' : 'esn', shops = b.z1 <= SHOP_Z;
      // stone piers at every bay (on a street wall of shops: on the bay lines, between the shopfronts), a cornice, a base course
      const p0 = shops ? -0.54 : 0.1;
      for (let k = shops ? Math.ceil((b.z0 + 0.54) / 6.4) : Math.ceil(b.z0 / 6.4); k * 6.4 + (shops ? 0.54 : 1.2) < b.z1; k++) g.box(Math.min(xf, xf + sx * 0.5), Math.max(xf, xf + sx * 0.5), 0, b.pod, k * 6.4 + p0, k * 6.4 + p0 + 1.08, dk(b.podCol, 0.95), [0, b.seed, 1.2, 0.6], b.podCol, null, faces);
      g.box(Math.min(xf, xf + sx * 0.75), Math.max(xf, xf + sx * 0.75), b.pod - 0.7, b.pod + 0.5, b.z0, b.z1, dk(b.podCol, 0.9), [0, b.seed, 2.4, 1.2], COL.roof, null, faces + 't');
      g.box(Math.min(xf, xf + sx * 0.2), Math.max(xf, xf + sx * 0.2), 0, 0.8, b.z0, b.z1, dk(b.podCol, 0.7), [0, b.seed, 2.4, 0.8], null, null, faces + 't');
      if (shops) {
        // A STREET WALL (every podium between street B and the terrace): at street level a shopfront in every bay of
        // 6.4 m between the piers, each under its awning; a fascia over the shops; above it three rows of windows set
        // back in the stone (one to every 3.2 m), a slim pilaster between the two windows of a bay, a sill course
        // under every row; the cornice. The same on the podium's two ends, as far as 60 m from the avenue's axis.
        for (let k = Math.ceil(b.z0 / 6.4); (k + 1) * 6.4 <= b.z1; k++) {
          awning(g, true, xf, sx, k * 6.4 + 0.75, (k + 1) * 6.4 - 0.75, k);
          g.box(Math.min(xf, xf + sx * 0.3), Math.max(xf, xf + sx * 0.3), 7.4, b.pod - 0.7, k * 6.4 + 2.98, k * 6.4 + 3.42, dk(b.podCol, 0.95), [0, b.seed, 1.2, 0.6], null, null, faces);
        }
        g.box(Math.min(xf, xf + sx * 0.62), Math.max(xf, xf + sx * 0.62), 6.85, 7.5, b.z0, b.z1, dk(b.podCol, 0.8), [0, b.seed, 2.4, 0.65], null, null, faces + 't');
        for (let y = 7.4 + 3.7; y < b.pod - 1.5; y += 3.7) g.box(Math.min(xf, xf + sx * 0.6), Math.max(xf, xf + sx * 0.6), y - 0.22, y, b.z0, b.z1, dk(b.podCol, 0.88), [0, b.seed, 9, 9], null, null, faces + 't');
        const xa = Math.min(xf, b.px), xb = Math.max(xf, b.px);
        for (const [zf, sz] of [[b.z0, -1], [b.z1, 1]]) {
          g.box(xa, xb, b.pod - 0.7, b.pod + 0.5, Math.min(zf, zf + sz * 0.5), Math.max(zf, zf + sz * 0.5), dk(b.podCol, 0.9), [0, b.seed, 2.4, 1.2], COL.roof, null, 'wesnt');
          for (let k = Math.ceil((xa + 0.5) / 6.4); (k + 1) * 6.4 <= xb && Math.abs((k + 0.5) * 6.4) < 60; k++) awning(g, false, zf, sz, k * 6.4 + 0.75, (k + 1) * 6.4 - 0.75, k);
        }
      } else {
        g.box(Math.min(xf, xf + sx * 2.8), Math.max(xf, xf + sx * 2.8), 4.7, 5.0, b.z0 + 2, b.z1 - 2, dk(b.podCol, 0.6), [0, b.seed, 2.4, 0.3], dk(b.podCol, 0.5), [0, b.seed, 3, 3], faces + 't');
        if (b.pod >= 14) g.box(Math.min(xf, xf + sx * 0.45), Math.max(xf, xf + sx * 0.45), b.pod * 0.5 - 0.3, b.pod * 0.5 + 0.3, b.z0, b.z1, dk(b.podCol, 0.9), [0, b.seed, 2.4, 0.6], null, null, faces + 't');
      }
      // a parapet round the podium's roof
      const xo = east ? b.px : b.px, x0 = Math.min(xf, xo), x1 = Math.max(xf, xo);
      g.box(x0, x1, b.pod, b.pod + 1.0, b.z0, b.z0 + 0.4, dk(b.podCol), [0, b.seed, 2.4, 1]); g.box(x0, x1, b.pod, b.pod + 1.0, b.z1 - 0.4, b.z1, dk(b.podCol), [0, b.seed, 2.4, 1]);
    }
    for (const t of b.t) {
      const y0 = b.pod > 0 ? b.pod : 0, w = t.x1 - t.x0, d = t.z1 - t.z0;
      // from the tops' stream, one draw where a mast can stand (a tower over 100 m: under a half a mast, and the same
      // draw gives its height) and one where a band of balconies can (a tall tower with a flat street face: under a half
      // a band, and the same draw gives its place); a tower that can carry neither takes no draw
      const canBal = !t.round && !t.fins && !t.setbacks && t.h > 60;
      const dMast = t.h > 100 ? rt() : 1, mastH = lerp(14, 26, Math.min(1, dMast * 2)), dBal = canBal ? rt() : 1, balAt = lerp(0.25, 0.75, Math.min(1, dBal * 2));
      if (!(b.pod > 0)) {
        // a tower that stands on the pavement itself carries the podiums' canopy over its own glazed base
        const xf = east ? t.x0 : t.x1, sx = east ? -1 : 1, cin = t.round ? 7 : t.corner ? t.corner.c + 0.5 : 2;
        if (b.z1 <= SHOP_Z && Math.abs(xf) < 34) {
          // (a low block north of street B: an awning over every shopfront of its avenue face and of its south front)
          const bk = t.bay * (t.bay > 5 ? 1 : 2);
          for (let k = Math.ceil((t.z0 + 0.5) / bk); (k + 1) * bk <= t.z1; k++) awning(g, true, xf, sx, k * bk + 0.75, (k + 1) * bk - 0.75, k);
          for (let k = Math.ceil((t.x0 + 0.5) / bk); (k + 1) * bk <= t.x1; k++) awning(g, false, t.z1 + 0.45, 1, k * bk + 0.75, (k + 1) * bk - 0.75, k);
        } else if (Math.abs(xf) < 34 && t.z1 - t.z0 > 2 * cin + 4) g.box(Math.min(xf, xf + sx * 2.8), Math.max(xf, xf + sx * 2.8), 4.7, 5.0, t.z0 + cin, t.z1 - cin, dk(t.col, 0.6), [0, t.seed, 2.4, 0.3], dk(t.col, 0.5), [0, t.seed, 3, 3], (east ? 'wsn' : 'esn') + 't');
      }
      if (t.round) {
        prismWall(g, roundRect(t.x0, t.x1, t.z0, t.z1, 7), y0, t.h, t.col, [t.style, t.seed, t.bay, t.fl]);
        prismWall(g, roundRect(t.x0 + 2, t.x1 - 2, t.z0 + 2, t.z1 - 2, 6), t.h, t.h + 6, dk(t.col), [3, t.seed, 1.6, 6]);
        g.box(t.x0 + 1, t.x1 - 1, t.h - 0.2, t.h, t.z0 + 1, t.z1 - 1, COL.roof, [0, t.seed, 3, 3]);
      }
      if (t.corner) {
        // the body by its outline, and a roof that follows it
        const pts = roundRect(t.x0, t.x1, t.z0, t.z1, t.corner.c, t.corner.seg > 1 ? 10 : 1), q = pts.slice().reverse();
        prismWall(g, pts, y0, t.h, t.col, [t.style, t.seed, t.bay, t.fl], true);
        for (let i = 1; i + 2 < q.length; i += 2) g.quad([q[0][0], t.h, q[0][1]], [q[i][0], t.h, q[i][1]], [q[i + 1][0], t.h, q[i + 1][1]], [q[i + 2][0], t.h, q[i + 2][1]], [0, 1, 0], [q[0][0], q[0][1], q[i + 1][0], q[i + 1][1]], COL.roof, [0, t.seed, 3, 3]);
      }
      if (t.setbacks) {
        for (let k = 0; k * 46 < t.h - y0; k++) {
          const ya = y0 + k * 46, yb = Math.min(t.h, ya + 46), x0 = t.x0 + k * 2.8, z0 = t.z0 + k * 1.8, z1 = t.z1 - k * 1.8;
          g.box(x0, t.x1, ya, yb, z0, z1, t.col, [t.style, t.seed, t.bay, t.fl], planted, [8, t.seed, 3, 3]);
          // the planted setback: a bed along the edge
          if (k > 0) g.box(x0 - 2.6, x0 - 0.3, ya, ya + 0.9, z0 - 1.4, z1 + 1.4, dk(t.col, 0.7), [0, t.seed, 2, 0.9], planted, [8, t.seed + 0.2, 3, 3]);
        }
      }
      if (t.crown) for (let i = 1; i <= t.crown; i++) g.box(t.x0 + i * 3.2, t.x1 - i * 3.2, t.h + (i - 1) * 7, t.h + i * 7, t.z0 + i * 9, t.z1 - i * 9, t.col, [t.style, t.seed, t.bay, t.fl], COL.roof, [0, t.seed, 3, 3]);
      if (t.fins) {
        const xf = east ? t.x0 : t.x1, sx = east ? -1 : 1;
        for (let k = Math.ceil(t.z0 / t.bay); k * t.bay < t.z1; k++) g.box(Math.min(xf, xf + sx * 0.85), Math.max(xf, xf + sx * 0.85), y0, t.h + 2.5, k * t.bay - 0.13, k * t.bay + 0.13, lin('#b9c2cc'), [0, t.seed, 9, 9], null, null, east ? 'wsn' : 'esn');
        g.box(t.x0 + 3, t.x1 - 3, t.h, t.h + 8, t.z0 + 5, t.z1 - 5, dk(t.col, 0.8), [3, t.seed, 3, 8]);
      }
      if (t.garden) {
        g.box(t.x0, t.x1, t.h, t.h + 1.1, t.z0, t.z0 + 0.4, dk(t.col), [0, t.seed, 2, 1]); g.box(t.x0, t.x1, t.h, t.h + 1.1, t.z1 - 0.4, t.z1, dk(t.col), [0, t.seed, 2, 1]);
        g.box(t.x0, t.x0 + 0.4, t.h, t.h + 1.1, t.z0, t.z1, dk(t.col), [0, t.seed, 2, 1]);
        g.box(t.x0 + 1.5, t.x1 - 8, t.h, t.h + 0.5, t.z0 + 1.5, t.z1 - 1.5, dk(t.col, 0.6), [0, t.seed, 2, 0.5], planted, [8, t.seed, 3, 3]);
        // balcony slabs every second floor on the street face
        for (let y = y0 + t.fl * 2; y < t.h - 2; y += t.fl * 2) g.box(t.x0 - 0.9, t.x0, y - 0.18, y, t.z0 + 1, t.z1 - 1, dk(t.col, 0.8), [0, t.seed, 2, 0.2], null, null, 'wsnt');
      }
      // RELIEF on the street face, as geometry up to 84 m: piers between the windows, sills, ribs, sun ledges, by the
      // wall's kind; the painted grid is laid in world metres, so piers stand on its bay lines and ledges under its floors
      if (!t.round && !t.fins) {
        const xf = east ? t.x0 : t.x1, sx = east ? -1 : 1, fc = east ? 'wsn' : 'esn', top = Math.min(t.h, y0 + (t.setbacks ? 46 : 84)), st = t.style;
        const cc = t.corner ? t.corner.c : 0, zc0 = t.z0 + cc, zc1 = t.z1 - cc;
        const rib = (z, dep, wid, col) => { if (z - wid / 2 > zc0 && z + wid / 2 < zc1) g.box(Math.min(xf, xf + sx * dep), Math.max(xf, xf + sx * dep), y0, top, z - wid / 2, z + wid / 2, col, [0, t.seed, 9, 9], null, null, fc); };
        const ledge = (y, dep, th, col) => g.box(Math.min(xf, xf + sx * dep), Math.max(xf, xf + sx * dep), y - th, y, zc0, zc1, col, [0, t.seed, 9, 9], null, null, fc + 't');
        const fl0 = Math.ceil((y0 + 1.5) / t.fl) * t.fl;
        if (st === 1 || st === 4) {
          for (let k = Math.ceil(t.z0 / t.bay); k * t.bay <= t.z1; k++) rib(k * t.bay, 0.45, t.bay * 0.36, dk(t.col, 1.05));
          for (let y = fl0; y < top; y += t.fl) ledge(y + t.fl * 0.17, 0.55, 0.22, dk(t.col, 0.9));
        } else if (st === 5) {
          for (let y = fl0; y < top; y += t.fl) ledge(y + t.fl * 0.3, 0.6, 0.16, dk(t.col, 1.35));
          for (let k = Math.ceil(t.z0 / (t.bay * 4)); k * t.bay * 4 <= t.z1; k++) rib(k * t.bay * 4, 0.34, 0.3, dk(t.col, 1.15));
        } else if (st === 6) {
          for (let k = Math.ceil(t.z0 / t.bay); k * t.bay <= t.z1; k++) rib(k * t.bay + t.bay * 0.15, 0.6, t.bay * 0.28, dk(t.col, 1.04));
          for (let y = fl0 + t.fl * 3; y < top; y += t.fl * 4) ledge(y, 0.75, 0.3, dk(t.col, 0.9));
        } else if (st === 2) {
          for (let k = Math.ceil(t.z0 / (t.bay * 2)); k * t.bay * 2 <= t.z1; k++) rib(k * t.bay * 2, 0.3, 0.14, lin('#aab4c0'));
          for (let y = fl0 + t.fl * 5; y < top; y += t.fl * 6) ledge(y + t.fl * 0.2, 0.42, 0.25, dk(t.col, 0.8));
        }
      }
      // the low blocks at the foot of the avenue show their south fronts to the lens: piers, sills, a cornice, an attic
      if (b.n === 'E7' || b.n === 'W5') {
        for (let k = Math.ceil(t.x0 / t.bay); k * t.bay <= t.x1; k++) g.box(k * t.bay - t.bay * 0.18, k * t.bay + t.bay * 0.18, 0, t.h, t.z1, t.z1 + 0.45, dk(t.col, 1.05), [0, t.seed, 9, 9], null, null, 'swe');
        for (let y = t.fl; y < t.h - 1; y += t.fl) g.box(t.x0, t.x1, y + t.fl * 0.17 - 0.22, y + t.fl * 0.17, t.z1, t.z1 + 0.55, dk(t.col, 0.9), [0, t.seed, 9, 9], null, null, 'swet');
        g.box(t.x0 - 0.5, t.x1 + 0.5, t.h - 0.6, t.h + 0.6, t.z0 - 0.5, t.z1 + 0.6, dk(t.col, 0.85), [0, t.seed, 2.4, 1.2], COL.roof, [11, t.seed, 3, 3]);
        g.box(t.x0 + 4, t.x1 - 4, t.h + 0.6, t.h + 4.4, t.z0 + 4, t.z1 - 4, dk(t.col, 0.9), [1, t.seed, 3, 3.8], COL.roof, [11, t.seed, 3, 3]);
      }
      // A CROWN OF ITS KIND on every tall tower that has none yet: curtain walls end in a lit lantern, ribbed stone in
      // fins that run past the roof, bronze in two planted setbacks; the others keep a plant room behind screens
      if (!t.garden && !t.round && !t.crown && !t.fins && t.h > 40) {
        const top = t.h, ph = 5 + r() * 4, ci = (t.corner ? t.corner.c : 0) + 2.5;
        if (t.style === 2) {
          g.box(t.x0 + ci, t.x1 - ci, top, top + ph + 4, t.z0 + ci, t.z1 - ci, dk(t.col, 1.1), [12, t.seed, t.bay * 2, ph + 4], COL.roof, [0, t.seed, 3, 3]);
          g.box(t.x0 + ci - 0.5, t.x1 - ci + 0.5, top + ph + 4, top + ph + 4.5, t.z0 + ci - 0.5, t.z1 - ci + 0.5, dk(t.col, 0.6), [0, t.seed, 3, 0.5]);
        } else if (t.style === 6) {
          for (let k = Math.ceil((t.z0 + ci) / t.bay); k * t.bay < t.z1 - ci; k++) for (const x of [t.x0, t.x1]) g.box(x - 0.3, x + 0.3, top - 1, top + 6.5, k * t.bay + t.bay * 0.15 - 0.2, k * t.bay + t.bay * 0.15 + 0.2, dk(t.col, 1.04), [0, t.seed, 9, 9]);
          g.box(t.x0 + ci, t.x1 - ci, top, top + ph, t.z0 + ci, t.z1 - ci, dk(COL.conc, 0.75), [0, t.seed, 3, 3]);
        } else if (t.style === 5 && !t.setbacks) {
          for (let k = 1; k <= 2; k++) g.box(t.x0 + ci * k, t.x1 - ci * k, top + (k - 1) * 8, top + k * 8, t.z0 + ci * k, t.z1 - ci * k, t.col, [t.style, t.seed, t.bay, t.fl], planted, [8, t.seed, 3, 3]);
        } else {
          g.box(t.x0 + w * 0.25, t.x1 - w * 0.25, top, top + ph, t.z0 + d * 0.3, t.z1 - d * 0.3, dk(COL.conc, 0.75), [0, t.seed, 3, 3]);
          g.box(t.x0 + 0.3, t.x1 - 0.3, top, top + 1.6, t.z0 + 0.3, t.z0 + 0.7, dk(t.col, 0.7), [0, t.seed, 3, 1.6]); g.box(t.x0 + 0.3, t.x1 - 0.3, top, top + 1.6, t.z1 - 0.7, t.z1 - 0.3, dk(t.col, 0.7), [0, t.seed, 3, 1.6]);
        }
      }
      // BY THE DEAL: on half of the towers over 100 m a mast stands on the roof's middle, through whatever crowns the
      // tower (the tallest crown is 21 m), its upper two thirds a thin pole
      if (t.h > 100 && dMast < 0.5) {
        const mx = (t.x0 + t.x1) / 2, mz = (t.z0 + t.z1) / 2, foot = t.h + 22, mc = lin('#3a3e46');
        g.box(mx - 0.6, mx + 0.6, t.h, foot + mastH * 0.35, mz - 0.6, mz + 0.6, mc, [0, 0.2, 9, 9]);
        g.box(mx - 0.22, mx + 0.22, foot + mastH * 0.35, foot + mastH, mz - 0.22, mz + 0.22, mc, [0, 0.2, 9, 9]);
      }
      // BY THE DEAL: on half of the tall towers with a flat street face, a band of balconies up that face, 6 to 7 m broad
      // on the wall's own bay lines: a slab at every floor and a dark balustrade
      if (canBal && dBal < 0.5) {
        const xf = east ? t.x0 : t.x1, sx = east ? -1 : 1, cc = (t.corner ? t.corner.c : 0) + 1.5, wide = t.bay * (t.bay < 2.2 ? 4 : 2);
        const zs = Math.round(lerp(t.z0 + cc, t.z1 - cc - wide, balAt) / t.bay) * t.bay, fc = east ? 'wsn' : 'esn', rail = lin('#2b2e33');
        for (let y = Math.ceil((y0 + 8) / t.fl) * t.fl; y < t.h - t.fl; y += t.fl) {
          g.box(Math.min(xf, xf + sx * 1.3), Math.max(xf, xf + sx * 1.3), y - 0.2, y, zs, zs + wide, dk(t.col, 0.8), [0, t.seed, 9, 9], null, null, fc + 't');
          g.box(Math.min(xf + sx * 1.22, xf + sx * 1.3), Math.max(xf + sx * 1.22, xf + sx * 1.3), y, y + 1.05, zs, zs + wide, rail, [0, t.seed, 9, 9], null, null, 'wesn');
        }
      }
    }
  }
  // the roof garden's lawn on the broad east podium
  const e6 = plan.east[5];
  g.box(27.2, 60, e6.pod, e6.pod + 0.35, e6.z0 + 1.5, e6.z1 - 1.5, dk(COL.lime, 0.6), [0, 0.5, 2, 0.35], planted, [8, 0.33, 3, 3]);
  // THE STEPPED PLAZA at the corner: three stone terraces rising east from the pavement to y 6, wide steps in the middle
  // and planted beds at the sides
  const xs = [29.5, 34.3, 39.1, 44], ys = [0, 2, 4, 6], st = COL.pale;
  for (let i = 0; i < 3; i++) {
    g.box(xs[i], 44, ys[i], ys[i + 1], -50, -8, st, [0, 0.45, 1.2, 0.5], st, [0, 0.45, 1.2, 0.6], 'wsnt');
    for (let j = 0; j < 4; j++) g.box(xs[i] - (4 - j) * 0.56, xs[i], ys[i], ys[i] + (j + 1) * 0.5, -37, -21, st, [0, 0.45, 1.2, 0.5], st, [0, 0.45, 1.2, 0.6], 'wsnt');
    for (const [za, zb] of [[-49, -38.5], [-19.5, -9]]) g.box(xs[i] + 0.8, xs[i + 1] - 0.5, ys[i + 1], ys[i + 1] + 0.55, za, zb, dk(st, 0.75), [0, 0.5, 2, 0.55], planted, [8, 0.61 + i * 0.1, 3, 3]);
  }
  // ROOFS AT WORK, by a stream of their own: every podium roof is walked in cells of 13 m; a cell that stands clear of
  // the towers on the podium takes, by the deal, a small tree in a tub, a pergola, a water tank on legs or a plant
  // room; the rest stay open (the roof's own paving, beds and skylights). A tub's place nearer the route's line than
  // TUB_CLEAR in plan takes the pergola instead (the measure is taken once, here, from the path)
  const roofTrees = [];
  for (const b of [...plan.east, ...plan.west]) {
    if (!(b.pod > 0)) continue;
    const east = b.n[0] === 'E', xa = east ? 26 : b.px, xb = east ? b.px : -26, y = b.pod;
    for (let x = xa + 4.5; x < xb - 3; x += 13) for (let z = b.z0 + 4.5; z < b.z1 - 3; z += 13) {
      const kind = rr(), cx = x + rr.range(-2, 2), cz = z + rr.range(-2, 2), hh = rr();
      if (b.t.some((t) => cx > t.x0 - 3.5 && cx < t.x1 + 3.5 && cz > t.z0 - 3.5 && cz < t.z1 + 3.5)) continue;
      if (b.roofGarden && cx < 62) continue;   // the broad east podium keeps its lawn and its own trees
      const near = !tubClear(path, cx, cz);
      if (kind < 0.3 && !near) { g.box(cx - 0.9, cx + 0.9, y, y + 0.7, cz - 0.9, cz + 0.9, dk(COL.conc, 0.8), [0, 0.4, 2, 0.7], planted, [8, 0.4, 3, 3]); roofTrees.push([cx, y + 0.7, cz, 4.2 + hh * 1.6]); }
      else if (kind < 0.5) {
        for (const [px, pz] of [[-1.8, -1.3], [1.8, -1.3], [-1.8, 1.3], [1.8, 1.3]]) g.box(cx + px - 0.08, cx + px + 0.08, y, y + 2.5, cz + pz - 0.08, cz + pz + 0.08, timber, [0, 0.3, 9, 9]);
        for (const pz of [-1.3, 1.3]) g.box(cx - 2.1, cx + 2.1, y + 2.5, y + 2.66, cz + pz - 0.07, cz + pz + 0.07, timber, [0, 0.3, 9, 9]);
        for (let i = -3; i <= 3; i++) g.box(cx + i * 0.6 - 0.05, cx + i * 0.6 + 0.05, y + 2.66, y + 2.76, cz - 1.6, cz + 1.6, timber, [0, 0.3, 9, 9]);
      } else if (kind < 0.64) {
        g.box(cx - 0.9, cx + 0.9, y, y + 1.3, cz - 0.9, cz + 0.9, dk(COL.dark, 0.9), [0, 0.3, 9, 9]);
        g.box(cx - 1.25, cx + 1.25, y + 1.3, y + 3.5 + hh, cz - 1.25, cz + 1.25, timber, [0, 0.6, 0.35, 9], dk(COL.dark, 1.2), [0, 0.6, 3, 3]);
      } else if (kind < 0.78) g.box(cx - 2.4, cx + 2.4, y, y + 3 + hh, cz - 1.7, cz + 1.7, dk(COL.conc, 0.8), [0, 0.5, 1.2, 0.4], COL.roof, [0, 0.5, 3, 3]);
    }
  }
  return roofTrees;
}
