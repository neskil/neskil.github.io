// fern-sea-midnight: THE GREEN ARCTIC SEA, 49 million years ago (middle Eocene, the Azolla interval; Ellesmere, 78 N).
// Flown as a stilt-legged duck (Presbyornis) through a low gold Arctic morning: a polar ocean whose whole surface
// is a floating lawn of fern lifts on a swell and shows itself a sea, while hornless brontotheres wade it
// chest-deep and tear lanes of glittering black water that heal behind them.
//
// WORLD SPACE == the hero's "sea space": the herd wades toward +Z (north-west). North = (-0.707, 0, 0.707),
// east = (-0.707, 0, -0.707); the low sun stands in the north-east (-X). Water at rest is y = 0.
// Nothing here uses three.js lights: every material is lit by the hero's shared uniforms (sun, sky, swell).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { buildHero, makeBrontoHerd, SWELL_GLSL, SHADE_GLSL, WING, ROUTE, herdD, layoutRoute } from '../parts/fern-sea-midnight.js';

const TAU = Math.PI * 2, { DUR, HERD_SPEED, A_LEN, N2, E2 } = ROUTE;
// The first crest is keyed to the journey, not the clock: at u = CREST.u its top lies CREST.s metres north of the entry point and it comes
// south at the swell's own 10 m/s (CREST.c metres per unit u at this world's pace); from CREST.free on, the swell runs on the clock again.
const CREST = { u: 0.05, s: 48, c: 444, free: 0.09, top: 1.25 };
const PAL = ['#2FA35A', '#A8432B', '#14110D', '#F0C060', '#5B6478', '#8DB25A', '#F4EFE6'];
const col = (h) => new THREE.Color(h);

// three hours / weathers (brief: variations). sun = unit vector toward the sun.
const MOODS = {
  gold: { sun: [-0.955, 0.122, -0.27], sunCol: '#F0C060', sunK: 2.6, zen: '#8FC3CF', hor: '#F4E6C4', fog: '#D9D6B8', fogD: 0.0021, shade: 1,
    sky: { zenith: '#5AA6C8', mid: '#9FCDD4', horizon: '#F5E3BA', horizonPow: 8, scatterColor: '#F6CE80', scatter: 0.5, scatterPow: 9, sunIntensity: 11, sunSize: 1.3, sunGlow: 0.8 },
    exposure: 1.0, tint: '#fff6e6', shadowTint: '#0a1c22', rain: 0 },
  noon: { sun: [0.60, 0.44, -0.67], sunCol: '#FFF0D2', sunK: 3.3, zen: '#7FB2DC', hor: '#E6ECE4', fog: '#C6DCDF', fogD: 0.0017, shade: 1,
    sky: { zenith: '#4F9BD6', mid: '#9CCBE0', horizon: '#E4EEE8', scatterColor: '#FFF4DC', scatter: 0.25, sunIntensity: 12, sunSize: 1.2, sunGlow: 0.6 },
    exposure: 0.96, tint: '#ffffff', shadowTint: '#061a2a', rain: 0 },
  drizzle: { sun: [-0.955, 0.2, -0.27], sunCol: '#C9C4B4', sunK: 1.5, zen: '#9AA3A8', hor: '#C9C8BC', fog: '#C2C5BA', fogD: 0.003, shade: 0,
    sky: { zenith: '#7F8B94', mid: '#A3AAAB', horizon: '#E6E3D2', horizonPow: 5, scatterColor: '#E6DDBE', scatter: 0.35, sunIntensity: 0, sunSize: 1.3, sunGlow: 0.5 },
    exposure: 1.12, tint: '#f4f6f2', shadowTint: '#10201e', rain: 1 },
};

// ---------------------------------------------------------------- one lit shader for everything the world adds
// Lit like the hero (no three.js lights): shared uniforms U give sun, sky and the swell. Geometry comes from the
// kit's F.Geo (color, aAnim, aPivot); instances carry iA (x, y, z, yaw) and iB (scale, phase, v, w).
// `deform` is GLSL that may move p / n in model space (vars: t = time + phase, sc, ph, iA, iB, aAnim, aPivot, uAct).
function makeLit(U, o = {}) {
  const vert = /* glsl */`
${SWELL_GLSL}
attribute vec3 color; attribute vec4 aAnim; attribute vec3 aPivot; attribute vec4 iA, iB;
uniform float uFloat; uniform vec4 uAct; uniform vec2 uWind;
varying vec3 vCol, vN, vPosW, vModel; varying float vK; varying vec4 vA;
#include <fog_pars_vertex>
vec3 rotX(vec3 p, vec3 c, float a){ p -= c; float cs = cos(a), sn = sin(a); return vec3(p.x, cs * p.y - sn * p.z, sn * p.y + cs * p.z) + c; }
vec3 rotY(vec3 p, vec3 c, float a){ p -= c; float cs = cos(a), sn = sin(a); return vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z) + c; }
vec3 rotZ(vec3 p, vec3 c, float a){ p -= c; float cs = cos(a), sn = sin(a); return vec3(cs * p.x - sn * p.y, sn * p.x + cs * p.y, p.z) + c; }
void main(){
  vec3 p = position, n = normal; float sc = iB.x, ph = iB.y, t = uTime + iB.y * 40.; vec3 tint = vec3(1.); float k = 0.;
  vec3 root = iA.xyz; float yaw = iA.w;
  ${o.deform || ''}
  float cy = cos(yaw), sy = sin(yaw);
  vec3 q = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z) * sc;
  vec2 g; float cr; vec3 sw = swellAt(root.xz, g, cr);
  root += sw * uFloat; q.y += dot(g, q.xz) * uFloat;
  ${o.world || ''}
  vec3 pw = (modelMatrix * vec4(root + q, 1.)).xyz;
  vN = mat3(modelMatrix) * vec3(cy * n.x + sy * n.z, n.y, -sy * n.x + cy * n.z); vCol = color * tint; vPosW = pw; vModel = position; vK = k; vA = aAnim;
  vec4 mvPosition = viewMatrix * vec4(pw, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  const frag = /* glsl */`
uniform vec3 uCamL, uSunDir, uSunCol, uSkyZen, uSkyHor, uBounce; uniform vec4 uLook;   // key gain, fill gain, translucency, rim
uniform vec2 uKeyG;   // x: how far the key is pulled toward white (0 gold .. 1 neutral), y: a floor of sky light so nothing goes black
uniform float uTime;
varying vec3 vCol, vN, vPosW, vModel; varying float vK; varying vec4 vA;
#include <fog_pars_fragment>
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
${o.pars || ''}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 toCam = uCamL - vPosW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  vec3 alb = vCol; float k = vK; vec3 m = vModel; vec3 emit = vec3(0.);
  ${o.pattern || ''}
  float ndl = dot(N, uSunDir), key = smoothstep(-0.12, 0.8, ndl);
  vec3 fill = mix(uBounce, mix(uSkyZen, vec3(0.62), 0.4), N.y * 0.5 + 0.5) * uLook.y;
  float nv = clamp(dot(N, V), 0., 1.), rim = (1. - nv) * (1. - nv);
  float back = max(-ndl, 0.) * max(dot(-V, uSunDir), 0.);                     // light through needles and feathers
  vec3 keyC = mix(uSunCol, vec3(dot(uSunCol, vec3(0.3, 0.6, 0.1))), uKeyG.x);
  vec3 c = alb * (fill + uSkyHor * uKeyG.y + keyC * (key * uLook.x + back * uLook.z)) + uSunCol * alb * rim * smoothstep(-0.2, 0.5, ndl) * uLook.w + emit;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uFloat: { value: o.float ? 1 : 0 }, uAct: { value: new THREE.Vector4() },
    uWind: { value: new THREE.Vector2(0.8, 0.6) }, uBounce: { value: o.bounce || col(PAL[0]).multiplyScalar(0.42) },
    uLook: { value: new THREE.Vector4(o.key ?? 0.36, o.fill ?? 0.8, o.trans ?? 0, o.rim ?? 0.25) }, uKeyG: { value: new THREE.Vector2(o.keyGrey ?? 0, o.floor ?? 0) }, ...(o.uniforms || {}) };
  return new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, fog: true, side: o.side ?? THREE.DoubleSide });
}
// instances: list of { x, y, z, yaw, s, ph, v, w }
function instanced(geo, mat, list, name) {
  const g = new THREE.InstancedBufferGeometry(); g.index = geo.index;
  for (const k of Object.keys(geo.attributes)) g.setAttribute(k, geo.attributes[k]);
  const n = Math.max(1, list.length), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
  list.forEach((a, i) => { iA.set([a.x, a.y || 0, a.z, a.yaw || 0], i * 4); iB.set([a.s ?? 1, a.ph ?? 0, a.v ?? 0, a.w ?? 0], i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = list.length;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = name || ''; m.visible = list.length > 0;
  return m;
}
const C3 = (h, k = 1) => col(h).multiplyScalar(k);

// ---------------------------------------------------------------- the forest that tells the date
// A feathered bough: a flat spray of needles in opposite pairs (the comb is cut in the fragment shader from aAnim.zw).
function bough(g, base, az, len, o) {
  const N = o.seg || 4, ea = [], eb = [], ca = o.c0, cb = o.c1 || o.c0, roll = o.roll || 0, rise = o.rise || 0, droop = o.droop ?? 0.18;
  const dx = Math.cos(az), dz = Math.sin(az), lx = -dz * Math.cos(roll), ly = Math.sin(roll), lz = dx * Math.cos(roll);
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1), w = (o.width ?? 0.3) * len * (0.12 + Math.sqrt(Math.max(0, 4 * s * (1 - s))) * (1 - 0.35 * s));
    const cx = base[0] + dx * len * s, cy = base[1] + rise * len * s - droop * len * s * s, cz = base[2] + dz * len * s;
    ea.push([cx + lx * w, cy + ly * w, cz + lz * w]); eb.push([cx - lx * w, cy - ly * w, cz - lz * w]);
  }
  const r = g.strip(ea, eb, ca, cb), i0 = r[0];
  g.anim(r, (x, y, z, i) => [0.25 + 0.75 * (Math.floor((i - i0) / 2) / (N - 1)), 1, Math.floor((i - i0) / 2) / (N - 1) * len * (o.comb ?? 1), (i - i0) % 2 ? -1 : 1]);
  return r;
}
// fluted, buttressed bole: a tube whose rings are pinched into ribs near the water
function bole(g, H, r0, sides, c0, c1, flutes, o = {}) {
  const ys = [-1.5, 0, 0.8, 2.2, 6, H * 0.45, H * 0.75, H * 0.96, H], rr = [1.25, 1.0, 0.8, 0.55, 0.4, 0.3, 0.17, 0.05, 0];
  const bend = o.bend || 0, r = g.tube(ys.map((y) => [bend * Math.sin(y / H * 2.2), y, 0]), rr.map((k) => k * r0), sides, c0, c1);
  g.move(r, (p) => { const a = Math.atan2(p.z, p.x), k = 0.34 * (1 - smoothstep(0.5, 7, p.y)), f = 1 + k * Math.cos(a * flutes) - k * 0.4; p.x *= f; p.z *= f; });
  g.paint(r, (x, y, z, c) => { const a = Math.atan2(z, x), k = 0.5 + 0.5 * Math.cos(a * flutes); c.multiplyScalar(lerp(1, 0.62 + 0.55 * k, 1 - smoothstep(0.5, 8, y))); });
  return r;
}
// Dawn redwood (Metasequoia): one dead-straight trunk on a swollen fluted base, a narrow cone of level feather boughs.
function redwoodGeo(rng, hi) {
  const g = new F.Geo(), H = 30, bark = C3('#6E5C50', 0.74), bark2 = C3('#584A40', 0.7);
  bole(g, H, 1.25, hi ? 21 : 7, bark, bark2, 7);
  // Near trees: many SHORT, level sprays in close tiers (a conifer's shelves of fine foliage, never long hanging fronds);
  // far trees: fewer, longer cards that give the same narrow cone at range.
  const g0 = C3('#3F7A3A', 0.72), g1 = C3('#86B052', 0.8), tiers = hi ? 20 : 13, per = hi ? 8 : 4;
  for (let t = 0; t < tiers; t++) {
    const y = lerp(hi ? 9 : 6.5, H - 0.8, t / (tiers - 1)), L = hi ? 0.7 + 3.1 * Math.pow(1 - t / (tiers - 1), 0.8) : 0.8 + 5.0 * Math.pow(1 - t / (tiers - 1), 0.8), off = rng() * TAU;
    for (let k = 0; k < per; k++) bough(g, [0, y + rng.range(-0.3, 0.3), 0], off + (k / per) * TAU + rng.range(-0.25, 0.25), L * rng.range(hi ? 0.6 : 0.8, 1.12),
      hi ? { c0: g0, c1: g1, roll: (k % 2 ? 1 : -1) * rng.range(0.0, 0.3), droop: rng.range(0.02, 0.16), rise: rng.range(-0.03, 0.12), width: 0.36, seg: 3 }
        : { c0: g0, c1: g1, roll: (k % 2 ? 1 : -1) * rng.range(0.1, 0.8), droop: rng.range(0.1, 0.34), rise: rng.range(-0.08, 0.16), width: 0.3, seg: 3 });
  }
  return g.build();
}
// Swamp cypress (Glyptostrobus): shorter, a forked crown as broad as it is tall, upswept sprays.
function cypressGeo(rng, hi) {
  const g = new F.Geo(), H = 16, bark = C3('#685A50', 0.7), bark2 = C3('#52463E', 0.66);
  bole(g, H * 0.62, 0.95, hi ? 10 : 6, bark, bark2, 6, { bend: 0.5 });
  const forks = [];
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + rng.range(-0.4, 0.4), top = [Math.cos(a) * rng.range(2.2, 3.4), H * rng.range(0.86, 1), Math.sin(a) * rng.range(2.2, 3.4)];
    const r = g.tube([[0.3, H * 0.42, 0], [top[0] * 0.45, H * 0.66, top[2] * 0.45], top], [0.22, 0.14, 0.03], 5, bark, bark2); g.anim(r, () => [0.1, 0, 0, 0]); forks.push(top); }
  const g0 = C3('#3A6630', 0.6), g1 = C3('#86A24C', 0.7), n = hi ? 70 : 26;
  for (let i = 0; i < n; i++) { const f = forks[i % 3], s = rng.range(0.3, 1), y = lerp(H * 0.42, f[1], s) + rng.range(-0.5, 0.8);
    bough(g, [f[0] * s * 0.6, y, f[2] * s * 0.6], rng() * TAU, rng.range(2.6, 4.6) * (1.15 - 0.5 * s), { c0: g0, c1: g1, roll: rng.range(-0.9, 0.9), droop: 0.1, rise: rng.range(0.1, 0.45), width: 0.26, seg: hi ? 4 : 3 }); }
  return g.build();
}
// (polish 1) THE TREES BESIDE THE ROUTE (within 17 m): no long flat card anywhere near the lens. Every bough is a thin sagging branch
// carrying short feathered sprays in opposite pairs, each drooping at its tip: the soft layered foliage of a deciduous conifer.
function sprayBranch(g, rng, base, az, L, o) {
  const dx = Math.cos(az), dz = Math.sin(az), sag = o.sag ?? rng.range(0.1, 0.22), up = o.up ?? 0.1;
  const at = (s) => [base[0] + dx * L * s, base[1] + up * L * s - sag * L * s * s, base[2] + dz * L * s];
  const r = g.tube([at(0), at(0.5), at(1)], [o.r0 || 0.07, (o.r0 || 0.07) * 0.55, 0.012], 3, o.tw, o.tw); g.anim(r, () => [0.1, 0, 0, 0]);
  const n = Math.max(1, Math.min(o.max || 4, Math.round(L / (o.step || 0.8))));
  for (let i = 1; i <= n; i++) { const s = i / (n + 0.4), b = at(s);
    for (const sd of [-1, 1]) bough(g, b, az + sd * rng.range(0.7, 1.15), rng.range(0.65, 1.0) * (1.15 - 0.3 * s) * (o.len || 1), { c0: o.c0, c1: o.c1, roll: sd * rng.range(0.1, 0.5), droop: rng.range(0.25, 0.5), rise: o.rise ?? rng.range(-0.05, 0.1), width: 0.42, seg: 3 }); }
  bough(g, at(0.92), az, rng.range(0.7, 1.0) * (o.len || 1), { c0: o.c0, c1: o.c1, roll: rng.range(-0.3, 0.3), droop: 0.4, rise: o.rise ?? 0, width: 0.42, seg: 3 });
}
function redwoodNearGeo(rng) {
  const g = new F.Geo(), H = 30, bark = C3('#6E5C50', 0.74), bark2 = C3('#584A40', 0.7), tw = C3('#5A4636', 0.6), c0 = C3('#3F7A3A', 0.72), c1 = C3('#86B052', 0.8);
  bole(g, H, 1.25, 21, bark, bark2, 7);
  const tiers = 13, per = 5;
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1), y = lerp(8.5, H - 1.2, f), Lb = 0.9 + 3.3 * Math.pow(1 - f, 0.8), off = rng() * TAU;
    for (let k = 0; k < per; k++) sprayBranch(g, rng, [0, y + rng.range(-0.35, 0.35), 0], off + (k / per) * TAU + rng.range(-0.25, 0.25), Lb * rng.range(0.7, 1.1), { tw, c0, c1, len: 1.25 });
  }
  return g.build();
}
function cypressNearGeo(rng) {
  const g = new F.Geo(), H = 16, bark = C3('#685A50', 0.7), bark2 = C3('#52463E', 0.66), c0 = C3('#3A6630', 0.6), c1 = C3('#86A24C', 0.7);
  bole(g, H * 0.62, 0.95, 14, bark, bark2, 6, { bend: 0.5 });
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + rng.range(-0.4, 0.4), top = [Math.cos(a) * rng.range(2.2, 3.4), H * rng.range(0.86, 1), Math.sin(a) * rng.range(2.2, 3.4)];
    const P = [[0.3, H * 0.42, 0], [top[0] * 0.45, H * 0.66, top[2] * 0.45], top], r = g.tube(P, [0.22, 0.14, 0.03], 5, bark, bark2); g.anim(r, () => [0.1, 0, 0, 0]);
    for (let i = 0; i < 12; i++) { const s = 0.25 + 0.75 * i / 11, q = s < 0.5 ? P[0].map((v, j) => lerp(v, P[1][j], s * 2)) : P[1].map((v, j) => lerp(v, P[2][j], s * 2 - 1));
      sprayBranch(g, rng, q, a + rng.range(-2.2, 2.2), rng.range(1.7, 3.0) * (1.15 - 0.4 * s), { tw: bark2, c0, c1, r0: 0.05, up: rng.range(0.1, 0.4), sag: 0.12, rise: rng.range(0.05, 0.3), max: 5, len: 1.0, step: 0.55 }); }
    for (let i = 0; i < 4; i++) bough(g, top, a + i * 1.6 + rng.range(-0.4, 0.4), rng.range(1.2, 1.8), { c0, c1, roll: rng.range(-0.5, 0.5), droop: 0.3, rise: 0.5, width: 0.42, seg: 3 }); }
  return g.build();
}
// Ginkgo (brief: 8 on the levees, 12 m): a grey trunk, a few rising limbs, and fan leaves in spur clusters (each cluster one fan a
// hand and a half across, notched in the middle), fresh yellow-green, lit through by the low sun.
function ginkgoGeo(rng) {
  const g = new F.Geo(), bark = C3('#6E6458', 0.6), bark2 = C3('#57504A', 0.55), l0 = C3('#5E8E34', 0.75), l1 = C3('#A9C24E', 0.85), H = 12;
  g.tube([[0, -0.6, 0], [0.05, 2, 0], [-0.05, 5, 0.05], [0, 8.5, 0], [0, H - 1, 0]], [0.36, 0.26, 0.2, 0.12, 0.03], 7, bark, bark2);
  const leaf = (c, rad) => { const a = rng() * TAU, tilt = rng.range(-0.5, 0.3), sp = rng.range(0.7, 1.0), pts = [c];
    for (let i = 0; i <= 4; i++) { const b = a + (i / 4 - 0.5) * 2 * sp, rr = rad * (i === 2 ? 0.8 : 1); pts.push([c[0] + Math.cos(b) * rr, c[1] + tilt * rad - 0.15 * rad * Math.abs(i - 2), c[2] + Math.sin(b) * rr]); }
    const q = g.fan(pts, l0, l1); g.anim(q, () => [1, 0, 0, 0]); };
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + rng.range(-0.3, 0.3), y0 = rng.range(3.2, 7.5), L = rng.range(2.4, 3.8) * (1.25 - y0 / 12), end = [Math.cos(a) * L, y0 + L * 0.55, Math.sin(a) * L];
    g.tube([[0, y0, 0], [end[0] * 0.55, y0 + L * 0.2, end[2] * 0.55], end], [0.1, 0.06, 0.02], 4, bark, bark2);
    for (let i = 0; i < 13; i++) { const t = rng.range(0.25, 1.05); leaf([end[0] * t + rng.range(-0.5, 0.5), y0 + L * 0.55 * t * t + rng.range(-0.3, 0.6), end[2] * t + rng.range(-0.5, 0.5)], rng.range(0.42, 0.66)); } }
  for (let i = 0; i < 28; i++) { const a = rng() * TAU, y = rng.range(7.5, H), rr = (H + 0.6 - y) * 0.42 * Math.sqrt(rng()); leaf([Math.cos(a) * rr, y, Math.sin(a) * rr], rng.range(0.42, 0.62)); }
  return g.build();
}
// Horsetail clump: jointed green rods, a whorl of thread branches at every joint.
function horsetailGeo(rng) {
  const g = new F.Geo(), c0 = C3('#3E6B32', 0.8), c1 = C3('#8FB55A', 0.9), jn = C3('#2A2A1C', 0.7);
  for (let s = 0; s < 3; s++) {
    const bx = rng.range(-0.35, 0.35), bz = rng.range(-0.35, 0.35), H = rng.range(1.1, 1.7), lean = rng.range(-0.12, 0.12), J = 6, pts = [], rad = [];
    for (let j = 0; j <= J; j += 2) { pts.push([bx + lean * j / J * H, H * j / J, bz]); rad.push(0.028 * (1 - 0.7 * j / J)); }      // (polish k1) a straight rod needs four rings, not seven (the triangles go to the far ducks)
    const r = g.tube(pts, rad, 3, c0, c1); g.anim(r, (x, y) => [y / H, 0, 0, 0]);
    g.paint(r, (x, y, z, c) => { if (Math.abs(((y / H) * J + 0.5) % 1 - 0.5) < 0.01 && y > 0.05) c.lerp(jn, 0.6); });
    for (let j = 1; j <= J - 1; j++) for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + j, y = H * j / J, x = bx + lean * j / J * H, L = 0.34 * (1 - 0.5 * j / J), ca = Math.cos(a), sa = Math.sin(a);
      const r2 = g.fan([[x, y, bz], [x + ca * L - sa * 0.014, y + L * 0.75, bz + sa * L + ca * 0.014], [x + ca * L + sa * 0.014, y + L * 0.75 - 0.03, bz + sa * L - ca * 0.014]], c0, c1);
      g.anim(r2, (px, py) => [py / H, 0, 0, 0]);
    }
  }
  return g.build();
}
// Royal fern: a shuttlecock of arching fronds a metre high.
function fernGeo(rng) {
  const g = new F.Geo(), c0 = C3('#3C7A34', 0.8), c1 = C3('#A4C05A', 0.9);
  for (let k = 0; k < 8; k++) bough(g, [0, 0.02, 0], k / 8 * TAU + rng.range(-0.3, 0.3), rng.range(0.9, 1.3), { c0, c1, roll: rng.range(-0.4, 0.4), droop: 0.75, rise: 1.0, width: 0.24, seg: 5, comb: 2.4 });
  return g.build();
}
// A mudbank: a low drying mound, cracked and wet at the rim (unit radius; scaled by the instance, stretched by iB.z).
function mudGeo(rng) {
  const g = new F.Geo(), c = C3('#8C7C66', 0.85), NR = 7, NA = 22, rows = [];
  for (let i = 0; i <= NR; i++) { const row = [], r = i / NR;
    for (let j = 0; j < NA; j++) { const a = j / NA * TAU, rr = r * (1 + 0.16 * Math.sin(a * 3 + 1) + 0.1 * Math.sin(a * 5));
      row.push(g.v(Math.cos(a) * rr, (1 - r * r) * (1 - r * r) * 1.0 - 0.6 * r * r * r, Math.sin(a) * rr, c)); } rows.push(row); }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const j1 = (j + 1) % NA; g.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j1]); }
  return g.build();
}

// ---------------------------------------------------------------- Presbyornis: a duck on stilts
// Flying: goose body 0.5 m, thin neck a third of the length held straight out, small round head with a broad flat
// bill, long legs trailing well past the tail with webbed feet; span 1.5 m. aAnim: x = distance along the wing (0..1),
// y = side (+1 / -1; 0 = body), z = 1 on the trailing legs.
function duckFlyGeo(hi) {
  const g = new F.Geo(), grey = C3('#8E96A3', 0.62), dark = C3('#5E6672', 0.55), cream = C3('#EFE6D0', 0.62), black = C3('#16161A', 0.6), white = C3('#F4F2EA', 0.75), slate = C3('#4A5260', 0.6), leg = C3('#6A6258', 0.6);
  const S = hi ? 8 : 4;
  g.loft([{ z: -0.27, y: 0.01, rx: 0, ry: 0 }, { z: -0.2, y: 0.01, rx: 0.045, ry: 0.035 }, { z: -0.06, y: 0, rx: 0.085, ry: 0.075 }, { z: 0.08, y: 0, rx: 0.09, ry: 0.08 }, { z: 0.2, y: 0.01, rx: 0.06, ry: 0.055 }, { z: 0.27, y: 0.02, rx: 0.03, ry: 0.03 }],
    { sides: S, top: grey, belly: cream, flat: 0.15 });
  g.tube([[0, 0.02, 0.25], [0, 0.03, 0.42], [0, 0.04, 0.56]], [0.03, 0.02, 0.019], hi ? 6 : 3, grey, grey);                    // the neck, straight out
  g.blob(0, 0.045, 0.6, 0.034, 0.034, 0.05, dark, grey, hi ? 6 : 3, hi ? 4 : 2);                                              // small round head
  g.loft([{ z: 0.63, y: 0.04, rx: 0.02, ry: 0.016 }, { z: 0.69, y: 0.034, rx: 0.026, ry: 0.009 }, { z: 0.735, y: 0.03, rx: 0.03, ry: 0.006 }, { z: 0.75, y: 0.03, rx: 0, ry: 0 }], { sides: hi ? 4 : 3, top: slate, belly: slate });   // the flat bill
  if (hi) { g.blob(0.031, 0.055, 0.61, 0.007, 0.007, 0.007, black, black, 4, 2); g.blob(-0.031, 0.055, 0.61, 0.007, 0.007, 0.007, black, black, 4, 2); }
  g.fan([[0, 0.01, -0.2], [0.07, 0.01, -0.3], [0.03, 0.012, -0.36], [-0.03, 0.012, -0.36], [-0.07, 0.01, -0.3]], dark, black);    // tail
  for (const sx of [-1, 1]) {                                                                                                // legs out behind, feet past the tail
    const r = g.tube([[sx * 0.04, -0.04, -0.12], [sx * 0.035, -0.03, -0.38], [sx * 0.03, -0.02, -0.56]], [0.012, 0.008, 0.007], 3, leg, leg); g.anim(r, () => [0, 0, 1, 0]);
    const r2 = g.fan([[sx * 0.03, -0.02, -0.55], [sx * 0.065, -0.02, -0.66], [sx * 0.03, -0.025, -0.69], [sx * -0.005, -0.02, -0.66]], leg, slate); g.anim(r2, () => [0, 0, 1, 0]);
  }
  // wings: arm to the wrist, hand to the tip; leading edge forward. Grey, a white bar, black tips.
  const stations = hi ? [0, 0.18, 0.36, 0.52, 0.68, 0.82, 0.93, 1] : [0, 0.4, 0.75, 1];
  for (const sx of [-1, 1]) {
    const le = [], te = [], cl = [], ct = [];
    for (const s of stations) {
      const x = sx * (0.07 + 0.68 * s), sweep = s < 0.45 ? 0.05 * s : 0.0225 - 0.2 * (s - 0.45), chord = lerp(0.24, 0.2, Math.min(1, s / 0.5)) * (s > 0.6 ? 1 - 0.85 * Math.pow((s - 0.6) / 0.4, 1.6) : 1);
      le.push([x, 0.03, 0.1 + sweep]); te.push([x, 0.02, 0.1 + sweep - chord]);
      cl.push(s > 0.8 ? black : grey); ct.push(s > 0.72 ? black : s > 0.3 ? white : dark);
    }
    const r = g.strip(le, te, cl, ct), i0 = r[0], n = stations.length;
    g.anim(r, (x, y, z, i) => [stations[Math.min(n - 1, Math.floor((i - i0) / 2))], sx, 0, 0]);
  }
  return g.build();
}
// Sitting on the mat: body low, neck up, head turning (aAnim.x = 1 on neck and head).
function duckSitGeo() {
  const g = new F.Geo(), grey = C3('#8E96A3', 0.44), cream = C3('#EFE6D0', 0.4), black = C3('#16161A', 0.6), slate = C3('#4A5260', 0.6), dark = C3('#5E6672', 0.4), white = C3('#F4F2EA', 0.6);
  const body = g.loft([{ z: -0.3, y: 0.14, rx: 0, ry: 0 }, { z: -0.2, y: 0.11, rx: 0.06, ry: 0.06, top: black }, { z: -0.03, y: 0.09, rx: 0.1, ry: 0.09 }, { z: 0.13, y: 0.1, rx: 0.09, ry: 0.085 }, { z: 0.22, y: 0.12, rx: 0, ry: 0 }], { sides: 5, top: grey, belly: cream });
  // (polish k1) painted plumage: dove grey, a darker back, cream only where the belly meets the water, black tail, a white bar on the folded wing (it was half cream: a white decoy)
  g.paint(body, (x, y, z, c) => { c.copy(y < 0.06 ? cream : grey); if (y > 0.155) c.lerp(dark, 0.7); if (z < -0.18) c.lerp(black, 0.85); else if (z < -0.02 && z > -0.16 && y > 0.07 && y < 0.15 && Math.abs(x) > 0.05) c.lerp(white, 0.75); });
  const r = g.tube([[0, 0.13, 0.16], [0, 0.26, 0.2], [0, 0.36, 0.2]], [0.03, 0.02, 0.022], 3, grey, grey); g.anim(r, (x, y) => [clamp((y - 0.13) / 0.2, 0, 1), 0, 0, 0]);
  const r2 = g.loft([{ z: 0.17, y: 0.37, rx: 0, ry: 0 }, { z: 0.21, y: 0.375, rx: 0.033, ry: 0.032 }, { z: 0.26, y: 0.36, rx: 0.026, ry: 0.016, top: slate }, { z: 0.35, y: 0.345, rx: 0.03, ry: 0.007, top: slate }, { z: 0.36, y: 0.345, rx: 0, ry: 0, top: slate }], { sides: 4, top: grey, belly: grey });
  g.anim(r2, () => [1, 0, 0, 0]);
  // (polish k1) contact: the bird presses a dent into the lawn, a dark wet oval under the hull (aAnim.y = 1; folded away beyond 40 m)
  const wet = C3('#0C1C12', 0.5), c0 = g.v(0, 0.014, -0.03, wet); g.a[c0 * 4 + 1] = 1;
  const rim = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, v = g.v(Math.sin(a) * 0.2, 0.012, -0.03 + Math.cos(a) * 0.34, wet); g.a[v * 4 + 1] = 1; rim.push(v); }
  for (let i = 0; i < 5; i++) g.tri(c0, rim[i], rim[(i + 1) % 5]);
  return g.build();
}
// (polish k1) THE FAR DUCK, for the rafts and wheels that are never nearer than 26 m (brief: 2,400 on the mat and 600 flying; techNotes: cheap
// sitting instances): eight triangles. A roofed body, neck and head as one upright blade, two wings folded away while it sits.
// aAnim: x = 1 on neck and head, y = wing side (+1 / -1).
function duckFarGeo() {
  const g = new F.Geo(), grey = C3('#8E96A3', 0.6), dark = C3('#5E6672', 0.55), cream = C3('#EFE6D0', 0.5), black = C3('#16161A', 0.6), slate = C3('#4A5260', 0.6);
  const A = (i, x, y) => { g.a[i * 4] = x; g.a[i * 4 + 1] = y; return i; };
  const T = g.v(0, 0.14, -0.3, black), B = g.v(0, 0.13, 0.2, grey), Lf = g.v(-0.105, 0.065, -0.03, cream), Rt = g.v(0.105, 0.065, -0.03, cream), Up = g.v(0, 0.2, -0.04, dark);
  g.tri(Up, T, Lf); g.tri(Up, Lf, B); g.tri(Up, B, Rt); g.tri(Up, Rt, T);
  const n0 = A(g.v(0, 0.12, 0.13, grey), 1, 0), n1 = A(g.v(0, 0.12, 0.22, grey), 1, 0), n2 = A(g.v(0, 0.41, 0.2, dark), 1, 0), n3 = A(g.v(0, 0.345, 0.37, slate), 1, 0), n4 = A(g.v(0, 0.33, 0.2, grey), 1, 0);
  g.tri(n0, n1, n2); g.tri(n2, n3, n4);                                                              // the neck and the head with its bill, side on
  for (const sx of [-1, 1]) { const w0 = A(g.v(sx * 0.07, 0.15, 0.09, grey), 0, sx), w1 = A(g.v(sx * 0.07, 0.15, -0.15, grey), 0, sx), w2 = A(g.v(sx * 0.74, 0.15, -0.07, black), 1, sx); g.tri(w0, w1, w2); }
  return g.build();
}
const DUCK_FAR = /* glsl */`
  { float fl = step(0.5, iB.z);                                    // 0: sits on the mat and lifts with the wave; 1: wheels far out
    float tau = (uAct.x - iB.w) * 42., on = max(step(0., tau), fl); tau = max(tau, 0.); float cl = 1. - exp(-min(tau / 2.2, 20.));
    float side = aAnim.y, beat = t * 25.1 + ph * 40.;
    sc *= 1. + 1.1 * smoothstep(70., 320., length(root.xz - uCamL.xz));                               // far out a bird is still a dot, not a flicker
    if (abs(side) > 0.5) { float ang = 0.6 * sin(beat) + 0.12, d = max(abs(p.x) - 0.07, 0.);
      p = mix(vec3(side * 0.07, 0.13, p.z * 0.6 - 0.05), vec3(side * (0.07 + d * cos(ang)), p.y + d * sin(ang), p.z), on); }
    else if (aAnim.x > 0.5) { p = rotX(p, vec3(0., 0.12, 0.17), 1.2 * on); n = rotX(n, vec3(0.), 1.2 * on); }
    if (fl < 0.5) { root.xz += vec2(sin(yaw), cos(yaw)) * (tau * 3. + 7.5 * tau * cl); root.y += (2.5 + 13. * ph) * cl + 0.3 * sin(t * 1.3) * cl;
      yaw += (ph - 0.5) * 0.9 * smoothstep(3., 10., tau); p.y += 0.012 * sin(t * 2.3) * (1. - on); }
    else { float R = max(iB.w, 1.), th = uTime * 9.5 / R + yaw + (ph - 0.5) * 1.3;
      root.xz += vec2(cos(th), sin(th)) * R * (1. + 0.22 * sin(th * 2. + ph * 9.)); root.y += 2.2 * sin(th * 3. + ph * 20.);
      yaw = atan(-sin(th), cos(th)); p = rotZ(p, vec3(0.), 0.3); n = rotZ(n, vec3(0.), 0.3); }
    sc *= 1. - on * (1. - smoothstep(18., 32., length(root - uCamL))); }      // a far bird in the air is never shown close to the lens
`;
// (polish k1, brief: "the lowest boughs trailing in the water ... dipping as the swell lifts the lawn against them") THE LOWEST TIER of a dawn redwood beside the
// route: four long thin boughs that leave the bole a little above the swollen base, sag under their own sprays and trail their tips in the water. They
// fan through 200 degrees about the model's +Z; the instance turns that side away from the route, so no bough ever reaches toward the lens.
function redwoodSkirtGeo(rng) {
  const g = new F.Geo(), tw = C3('#5A4636', 0.6), c0 = C3('#3F7A3A', 0.72), c1 = C3('#86B052', 0.8);
  for (let k = 0; k < 4; k++) { const az = Math.PI / 2 + (k - 1.5) * 0.92 + rng.range(-0.2, 0.2), y = rng.range(3.3, 4.7), Lb = rng.range(3.5, 4.5), up = 0.04;
    sprayBranch(g, rng, [0, y, 0], az, Lb, { tw, c0, c1, len: 1.3, up, sag: (y - 0.1) / Lb + up, max: 5, step: 0.8, r0: 0.06, rise: -0.1 }); }
  return g.build();
}
const DUCK_FLAP = /* glsl */`
  { float beat = t * uAct.z, cyc = fract(t / 3.1 + iB.y), flap = 1. - smoothstep(0.66, 0.72, cyc) * (1. - smoothstep(0.93, 0.99, cyc));   // a glide in every three seconds
    float land = step(2.5, iB.z) * step(iB.z, 3.5);
    if (aAnim.z > 0.5) { p = rotX(p, vec3(0., -0.04, -0.12), -1.1 * land); }
    float a1 = (0.5 * sin(beat) + 0.1) * flap + 0.1 * (1. - flap) + 0.6 * land, a2 = 0.3 * sin(beat - 1.2) * flap - 0.1;
    float side = aAnim.y, d = max(abs(p.x) - 0.07, 0.), ang = a1 + a2 * aAnim.x;
    if (abs(side) > 0.5) { p.y += d * sin(ang); p.x = side * (0.07 + d * cos(ang)); n = normalize(vec3(-side * sin(ang) * n.y, n.y * cos(ang), n.z) + vec3(0., 1e-4, 0.)); }
    p.y += 0.035 * cos(beat) * flap * (1. - abs(side)) - aAnim.z * 0.01 * sin(t * 3.); }
`;

// ---------------------------------------------------------------- Gastornis: a flightless plant-eater 2 m tall
// Side silhouette: a skull 0.45 m long that is nearly all deep, tall, narrow, BLUNT beak; thick neck; barrel body
// carried level; wings lost in shaggy hair-like plumage; massive legs, three thick toes. Model: nose +Z, feet y = 0.
// aAnim: x = neck weight (0 body .. 1 head), z = 1 on the legs (planted), w = 1 on hard parts (beak, shanks).
function gastornisGeo(rng) {
  const g = new F.Geo(), coat = C3('#3B3230', 0.75), coat2 = C3('#5A4A40', 0.75), cream = C3('#E9DDC0', 0.62), ivory = C3('#E8DCC0', 0.68), horn = C3('#8A7A60', 0.6), black = C3('#0C0A0A', 1), shank = C3('#6E6252', 0.6);
  const body = g.loft([{ z: -0.72, y: 0.98, rx: 0, ry: 0 }, { z: -0.58, y: 1.03, rx: 0.15, ry: 0.16 }, { z: -0.34, y: 1.1, rx: 0.29, ry: 0.29 }, { z: -0.05, y: 1.14, rx: 0.36, ry: 0.36 }, { z: 0.2, y: 1.18, rx: 0.34, ry: 0.35 },
    { z: 0.38, y: 1.25, rx: 0.24, ry: 0.27 }, { z: 0.5, y: 1.3, rx: 0.1, ry: 0.12 }, { z: 0.54, y: 1.31, rx: 0, ry: 0 }], { sides: 14, top: coat, belly: coat2 });
  g.paint(body, (x, y, z, c) => { if (z > 0.22 && y < 1.3) c.lerp(cream, smoothstep(0.2, 0.36, z) * smoothstep(1.34, 1.2, y)); });
  const neck = g.tube([[0, 1.26, 0.34], [0, 1.48, 0.47], [0, 1.68, 0.53], [0, 1.86, 0.55]], [0.2, 0.17, 0.15, 0.14], 10, coat, coat);
  g.anim(neck, (x, y) => [smoothstep(1.2, 1.86, y), 0, 0, 0]);
  g.paint(neck, (x, y, z, c) => { if (z > 0.5 && y < 1.6) c.lerp(cream, 0.7 * smoothstep(1.62, 1.4, y)); });
  const head = g.loft([{ z: 0.44, y: 1.9, rx: 0, ry: 0 }, { z: 0.5, y: 1.9, rx: 0.085, ry: 0.1 }, { z: 0.6, y: 1.9, rx: 0.085, ry: 0.135 }, { z: 0.7, y: 1.885, rx: 0.062, ry: 0.15, top: ivory, belly: ivory },
    { z: 0.8, y: 1.865, rx: 0.05, ry: 0.135, top: ivory, belly: ivory }, { z: 0.88, y: 1.84, rx: 0.04, ry: 0.1, top: ivory, belly: horn }, { z: 0.925, y: 1.815, rx: 0.028, ry: 0.055, top: horn, belly: horn }, { z: 0.935, y: 1.81, rx: 0, ry: 0, top: horn }],
    { sides: 10, top: coat, belly: coat, square: 0.25 });
  g.anim(head, (x, y, z) => [1, 0, 0, z > 0.66 ? 1 : 0]);
  for (const sx of [-1, 1]) {
    const eye = g.blob(sx * 0.082, 1.94, 0.6, 0.012, 0.02, 0.02, black, black, 5, 3); g.anim(eye, () => [1, 0, 0, 2]);
    const wing = g.blob(sx * 0.34, 1.2, 0.02, 0.05, 0.15, 0.26, coat, coat2, 6, 4);
    const thigh = g.blob(sx * 0.2, 0.95, -0.06, 0.14, 0.24, 0.2, coat, coat2, 7, 4); g.anim(thigh, () => [0, 0, 1, 0]);
    const tib = g.tube([[sx * 0.2, 0.86, -0.05], [sx * 0.2, 0.66, -0.1], [sx * 0.2, 0.5, -0.17]], [0.1, 0.065, 0.05], 7, coat2, shank); g.anim(tib, () => [0, 0, 1, 0]);
    const tar = g.tube([[sx * 0.2, 0.5, -0.17], [sx * 0.2, 0.26, -0.1], [sx * 0.2, 0.07, -0.04]], [0.052, 0.045, 0.055], 7, shank, shank); g.anim(tar, () => [0, 0, 1, 1]);
    for (const tx of [-0.14, 0, 0.14]) { const toe = g.tube([[sx * 0.2, 0.06, -0.04], [sx * 0.2 + tx * 0.6, 0.04, 0.1], [sx * 0.2 + tx, 0.02, 0.22 - Math.abs(tx) * 0.3]], [0.04, 0.034, 0.016], 5, shank, horn); g.anim(toe, () => [0, 0, 1, 1]); }
  }
  // shag: hair-like feathers break the outline along back, rump, flanks and thighs
  for (let i = 0; i < 110; i++) {
    const z = rng.range(-0.62, 0.36), th = rng.range(-2.4, 2.4), rx = 0.36 * Math.sqrt(Math.max(0.05, 1 - ((z + 0.05) / 0.66) ** 2)), cy = 1.14 + z * 0.12;
    const bx = Math.sin(th) * rx, by = cy + Math.cos(th) * rx, L = rng.range(0.1, 0.2), w = 0.035;
    g.fan([[bx, by, z + w], [bx * 1.12, by - L * 0.55 + Math.cos(th) * 0.03, z - L], [bx, by, z - w]], rng.chance(0.3) ? coat2 : coat, coat);
  }
  for (let i = 0; i < g.n; i++) if (g.a[i * 4] > 0.999) { g.p[i * 3] *= 1.3; g.p[i * 3 + 1] = 1.87 + (g.p[i * 3 + 1] - 1.87) * 1.3; g.p[i * 3 + 2] = 0.52 + (g.p[i * 3 + 2] - 0.52) * 1.3; }   // the skull: nearly a quarter of the bird
  for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 1.6; g.fan([[Math.sin(a) * 0.12, 1.04, -0.6], [Math.sin(a) * 0.26, 0.86 - 0.05 * Math.cos(a * 2), -0.84], [Math.sin(a) * 0.12 + 0.05, 1.0, -0.62]], coat, coat2); }
  return g.build();
}
const GASTORNIS_DEFORM = /* glsl */`
  { float alert = clamp(uAct.x - iB.w * 0.25, 0., 1.), cr = 0.5 + 0.5 * sin(t * 0.8); cr = cr * cr * (1. - alert) * iB.z;
    float a = 0.95 * cr - 0.1 * alert + 0.02 * sin(t * 1.7), w = aAnim.x, body = 1. - aAnim.z;
    vec3 NP = vec3(0., 1.3, 0.36);
    p = rotX(p, NP, a * w); n = rotX(n, vec3(0.), a * w);
    float yw = uAct.y * alert * w + 0.25 * sin(t * 0.37) * w * (1. - cr);
    p = rotY(p, NP, yw); n = rotY(n, vec3(0.), yw);
    p = rotX(p, vec3(0., 0.95, -0.05), 0.22 * cr * body); n = rotX(n, vec3(0.), 0.22 * cr * body);
    p.x *= 1. + 0.02 * sin(t * 1.3) * (1. - w) * body; k = aAnim.w; }
`;
const GASTORNIS_PATTERN = /* glsl */`
  { float hair = vnoise(vec2(m.x * 46. + m.z * 12., m.y * 8.)) * 0.6 + vnoise(vec2(m.x * 15. + m.z * 31., m.y * 3.)) * 0.4;
    float near = 1. - smoothstep(25., 70., dist);
    if (k < 0.5) alb *= 1. + (hair - 0.5) * 0.7 * near;
    else if (k < 1.5) { alb *= 1. - 0.75 * smoothstep(0.012, 0.004, abs(m.y - (1.852 - (m.z - 0.6) * 0.16))) * step(0.6, m.z) * step(0.03, abs(m.x)); alb *= 0.9 + 0.2 * vnoise(m.zy * 60.); }
    else emit = uSunCol * 0.25 * smoothstep(0.6, 0.95, dot(N, normalize(uSunDir + V + vec3(0., 1e-3, 0.)))); }
`;
// An alligator hauled out, seen only at range: a blunt-snouted ridged log. And the fallen redwood that drifts on the mat.
function gatorGeo() {
  const g = new F.Geo(), top = C3('#3A3E30', 0.7), bel = C3('#8A8468', 0.6);
  const r = g.loft([{ z: -0.95, y: 0.05, rx: 0, ry: 0 }, { z: -0.6, y: 0.07, rx: 0.05, ry: 0.06 }, { z: -0.2, y: 0.1, rx: 0.14, ry: 0.11 }, { z: 0.2, y: 0.11, rx: 0.17, ry: 0.12 }, { z: 0.5, y: 0.1, rx: 0.13, ry: 0.1 }, { z: 0.66, y: 0.09, rx: 0.09, ry: 0.06 }, { z: 0.86, y: 0.08, rx: 0.075, ry: 0.035 }, { z: 0.9, y: 0.08, rx: 0, ry: 0 }], { sides: 8, top, belly: bel, flat: 0.6 });
  g.move(r, (p) => { if (p.y > 0.14) p.y += 0.025 * Math.sin(p.z * 40); });
  return g.build();
}
function logGeo(rng) {
  const g = new F.Geo(), bark = C3('#6A4E40', 0.62), bark2 = C3('#523C32', 0.56), wet = C3('#2E2622', 0.7), pts = [], rad = [];
  for (let i = 0; i <= 10; i++) { const s = i / 10; pts.push([0.25 * Math.sin(s * 5), 0.12 + 0.1 * Math.sin(s * 3), -11 + 22 * s]); rad.push(lerp(0.62, 0.2, s) * (i === 0 || i === 10 ? 0.6 : 1) * (1 + 0.5 * Math.exp(-s * 14))); }
  const r = g.tube(pts, rad, 10, bark, bark2); g.paint(r, (x, y, z, c) => { if (y < 0.02) c.lerp(wet, 0.8); });
  for (let k = 0; k < 7; k++) { const z = rng.range(-6, 9), a = rng.range(-1.2, 1.2), L = rng.range(0.8, 2.4); g.tube([[0, 0.3, z], [Math.sin(a) * L * 0.6, 0.3 + Math.cos(a) * L * 0.6, z + 0.2], [Math.sin(a) * L, 0.3 + Math.cos(a) * L * 0.9, z + 0.5]], [0.11, 0.08, 0.05], 5, bark, bark2); }      // (polish k1) broken boughs: stout and blunt, in the trunk's own bark
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + 0.4, L = 0.6 + 0.5 * ((k * 7) % 3) / 2; g.tube([[0, 0.15, -10.6], [Math.cos(a) * 0.7 * L, 0.2 + Math.sin(a) * 0.7 * L, -11.2], [Math.cos(a) * 1.2 * L, 0.2 + Math.sin(a) * 1.2 * L, -11.5], [Math.cos(a + 0.5) * 1.5 * L, 0.2 + Math.sin(a + 0.5) * 1.5 * L, -11.6]], [0.24, 0.16, 0.1, 0.06], 5, bark, bark); }   // the root plate
  return g.build();
}


export default {
  id: 'fern-sea-midnight',
  name: 'The Green Arctic Sea',
  category: 'prehistoric',
  weirdness: 0.45,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // ---- which morning is it (seeded; the viewer's wished hour is honoured where this world has one)
    const mroll = vary.mood ?? rng();
    let moodName = mroll < 0.12 ? 'drizzle' : mroll < 0.3 ? 'noon' : 'gold';      // (polish k1) gold four in the morning is the brief's default hour: seven mornings in ten. The test seeds 3, 21 and 8 stay a gold, a noon and a drizzle morning; seed 7 stays gold
    if (vary.hour === 'day') moodName = 'noon'; else if (vary.hour === 'dawn' || vary.hour === 'golden') moodName = 'gold';
    const M = MOODS[moodName], rare = !!vary.rare;
    const lroll = rng(), late = (vary.mood !== undefined ? (vary.mood * 7.3) % 1 : lroll) > 0.72 ? 1 : 0;                               // late season: two thirds rust
    const cast = { herd: Math.round(clamp(rng.range(20, 27) * dens, 20, 25)), calves: rng.chance(0.75) ? 6 : 0, swell: rng.range(1.2, 2.0), ducks: Math.round(rng.range(1500, 3000) * dens) };
    const sunDir = new THREE.Vector3(...M.sun).normalize(), sunCol = col(M.sunCol).multiplyScalar(M.sunK);
    const xr = ctx.core.makeRng(ctx.core.hashSeed('fern-sea-k1:' + (ctx.seed ?? 0)));      // (polish k1) a stream of its own for what this round adds: no draw is taken from ctx.rng, so every seeded roll stays as it was
    await ctx.yield();
    const lay = await layoutRoute(ctx.yield), path = lay.path;
    await ctx.yield();
    const at = (u, side = 0, fwd = 0, y = 0) => {                       // a point beside the path: side > 0 is to the right
      const p = path.pointAt(u), t = path.tangentAt(u); const l = Math.hypot(t.x, t.z) || 1;
      return new THREE.Vector3(p.x + (-t.z / l) * side + (t.x / l) * fwd, y, p.z + (t.x / l) * side + (t.z / l) * fwd);
    };
    const uOf = (q) => path.nearestXZ(q[0], q[2]).u, uC0 = uOf(lay.c0), uC1 = uOf(lay.c1), uD1 = uOf(lay.d1), uBull = uOf(lay.cBull), uGap = uOf(lay.cGap), uEnd = uOf(lay.cEnd), uWave = uEnd - 0.022, uDL = uOf(lay.dl);
    await ctx.yield();
    // ---- where the forest stands (all trees are rooted in the water: these are drowned swamp points)
    const L = path.length, S0 = path.pointAt(0), exitDir = lay.exitDir, pEnd = path.pointAt(1);
    CREST.c = 1.14 * L; CREST.free = 60 / L;                            // the first crest meets us about 40 m out, whatever the route's length
    const trees = [];                                                    // { x, z, s, kind: 0 redwood | 1 cypress, hi, lean, yaw }
    const clearOf = (x, z, r) => path.nearestXZ(x, z).dist > r && trees.every((t) => Math.hypot(t.x - x, t.z - z) > 5.5);
    const plant = (x, z, kind, hi, o = {}) => { const t = { x, z, kind, hi, s: (kind ? rng.range(0.85, 1.15) : rng.range(0.87, 1.07)) * (o.s || 1), yaw: rng() * TAU, lean: o.lean || 0, ph: rng() }; if (o.yaw !== undefined) t.yaw = o.yaw; trees.push(t); return t; };
    // the entry colonnade: two boles frame the first view, a grove beside and behind
    const gate = [at(31 / L, 6.8), at(31 / L, -7.0)]; plant(gate[0].x, gate[0].z, 0, 1, { s: 1.04 }); plant(gate[1].x, gate[1].z, 0, 1);
    for (let i = 0, tries = 0; i < 20 && tries < 400; tries++) {
      if (tries % 4 === 3) await ctx.yield();
      const fwd = rng.range(-70, 58), side = (rng.chance(0.5) ? 1 : -1) * rng.range(11, 70), p = at(0, side, fwd), kind = rng.chance(0.3) ? 1 : 0;
      if (Math.hypot(p.x - S0.x, p.z - S0.z) < 17 || !clearOf(p.x, p.z, kind ? 12 : 9.5)) continue;
      plant(p.x, p.z, kind, 1); i++;
    }
    for (const [sd, fw] of [[33, 78], [41, 90], [-26, 84], [-34, 100]]) { const p = at(0, sd, fw); if (clearOf(p.x, p.z, 11) && path.nearestXZ(p.x, p.z).u < 0.14) plant(p.x, p.z, 0, 1); }   // (polish 3) never among the herd
    await ctx.yield();
    // the west point (left of the start) and the east spit behind the ring, running north-north-west
    for (let i = 0, tries = 0; i < 20 && tries < 300; tries++) {
      const x = S0.x + 0.7071 * rng.range(110, 260) + N2[0] * rng.range(-90, 70), z = S0.z + 0.7071 * rng.range(110, 260) + N2[1] * rng.range(-90, 70);
      if (clearOf(x, z, 30)) { plant(x, z, rng.chance(0.35) ? 1 : 0, 0); i++; }
      if (tries % 4 === 3) await ctx.yield();
    }
    await ctx.yield();
    const ax = [-0.3827, 0.9239], px = [0.9239, 0.3827], spitC = [pEnd.x + exitDir[0] * 52, pEnd.z + exitDir[1] * 52];
    for (let i = 0, tries = 0; i < 24 && tries < 600; tries++) {
      if (tries % 4 === 3) await ctx.yield();
      const t = rng.range(-235, 58), w = rng.range(-1, 1) * lerp(26, 12, smoothstep(0, 58, t)), x = spitC[0] + ax[0] * t + px[0] * w, z = spitC[1] + ax[1] * t + px[1] * w;
      if (Math.hypot(x - pEnd.x, z - pEnd.z) < 27 || !clearOf(x, z, 22)) continue;
      plant(x, z, rng.chance(0.28) ? 1 : 0, Math.hypot(x - pEnd.x, z - pEnd.z) < 50 ? 1 : 0); i++;
    }
    for (const [f, sd] of [[30, 0], [37, 7], [34, -8]]) { const dx = S0.x - pEnd.x, dz = S0.z - pEnd.z, l = Math.hypot(dx, dz); plant(pEnd.x + dx / l * f - dz / l * sd, pEnd.z + dz / l * f + dx / l * sd, sd > 0 ? 1 : 0, 1); }   // these hide the ring from the entry
    for (const [f, sd, kind] of [[25, -5, 1], [26, 4, 1], [24, 12, 1], [27, -13, 1], [43, 3, 0], [45, -4, 0], [47, 11, 0], [44, -12, 0]]) { const dx = S0.x - pEnd.x, dz = S0.z - pEnd.z, l = Math.hypot(dx, dz), x = pEnd.x + dx / l * f - dz / l * sd, z = pEnd.z + dz / l * f + dx / l * sd;
      if (path.nearestXZ(x, z).dist > 10) plant(x, z, kind, 1); }                                          // (review 2) a closer, broader screen: the ring is not seen from the river mouth
    // (review 3) and from the low opening the ring is not to be seen either: a tree on each sight line from the first 45 m of the route
    for (const [uu, f, kind] of [[0.02, 31, 0], [0.04, 34, 1], [0.055, 30, 0], [0.068, 35, 0]]) { const q = path.pointAt(uu), dx = q.x - pEnd.x, dz = q.z - pEnd.z, l = Math.hypot(dx, dz), x = pEnd.x + dx / l * f, z = pEnd.z + dz / l * f;
      if (path.nearestXZ(x, z).dist > 10 && trees.every((t) => Math.hypot(t.x - x, t.z - z) > 3.5)) plant(x, z, kind, 1); }
    // (polish 1) the exit gate: two upright fluted boles frame the ring as two frame the entry (no trunk leans across it), a few more behind
    const uArch = 1 - 44 / L, uFam = 0.79, famAt = at(uFam, -7, 12.5), cowAt = at(uArch + 0.013, 10.2, 0), isleC = at(uD1, ROUTE.RD, 0);   // (polish 3) the family wades on the sun side of the left bend; isleC: the island the last sweep rounds
    { const p0 = at(uArch + 0.04, 10.5), p1 = at(uArch, -11.5); plant(p0.x, p0.z, 0, 1, { s: 0.98 }); plant(p1.x, p1.z, 0, 1, { s: 1.03 }); }
    for (const [sd, fw] of [[19, -6], [25, 7], [17, 16], [-21, 9], [-17, -14]]) { const p = at(uArch, sd, fw); plant(p.x, p.z, Math.abs(sd) > 20 ? 1 : 0, 1, { s: 0.9 }); }
    // (polish 2) THE DROWNED FOREST of legs D and E: dawn redwoods and swamp cypresses standing in open black water on both sides of the
    // route from the end of the wading line to the ring, a near row 8 to 13 m off and a broken second row behind it; the route winds
    // between the boles with the low sun behind them, and the last hundred metres are an avenue with the ring at its end.
    const uGrove = lerp(uC1, uD1, 0.5), groveC = at(uGrove, 0, 0), uF0 = uC1 - 0.035;
    for (let uu = uF0, k = 0; uu < 0.985; uu += 9.5 / L, k++) {
      if (k % 4 === 3) await ctx.yield();
      for (const sd of [-1, 1]) for (const row of [0, 1]) {
        const lat = row ? rng.range(17, 33) : rng.range(8.3, 13.5) + (uu > 0.9 ? 9 : 0), fw = rng.range(-3.5, 3.5), kind = rng.chance(row ? 0.5 : 0.42) ? 1 : 0, keep = rng.chance(row ? 0.55 : uu < uC1 ? 0.55 : 0.82), p = at(uu, sd * lat, fw);
        if (!keep || path.nearestXZ(p.x, p.z).dist < 8.1 || Math.hypot(p.x - famAt.x, p.z - famAt.z) < 7.5 || Math.hypot(p.x - cowAt.x, p.z - cowAt.z) < 6.5 || trees.some((t) => Math.hypot(t.x - p.x, t.z - p.z) < 5.5)) continue;
        plant(p.x, p.z, kind, 1, { s: kind ? rng.range(0.95, 1.15) : rng.range(0.85, 1.0) });
      }
    }
    // (polish 3) THE ISLAND the last sweep rounds: a tight stand of redwood and cypress at the centre of the turn, so the ring comes out
    // from behind it as we straighten; and a tree on each sight line from the forest legs to the ring (it is never glimpsed between trunks)
    for (let k = 0; k < 16; k++) { const a = k * 2.4, r = 3 + 15 * Math.sqrt((k + 0.5) / 16), x = isleC.x + Math.cos(a) * r, z = isleC.z + Math.sin(a) * r;
      if (path.nearestXZ(x, z).dist > 9.5 && Math.hypot(x - cowAt.x, z - cowAt.z) > 6.5 && trees.every((t) => Math.hypot(t.x - x, t.z - z) > 4.2)) plant(x, z, k % 3 === 1 ? 1 : 0, 1, { s: k % 3 === 1 ? 1.12 : 0.95 }); }
    for (let k = 0; k < 15; k++) { const uu = 0.55 + 0.02 * k, q = path.pointAt(uu), dx = q.x - pEnd.x, dz = q.z - pEnd.z, l = Math.hypot(dx, dz);
      for (const f of [26, 38]) { const x = pEnd.x + dx / l * f, z = pEnd.z + dz / l * f;
        if (path.nearestXZ(x, z).dist > 12 && trees.every((t) => Math.hypot(t.x - x, t.z - z) > 4.6)) plant(x, z, f < 30 ? 1 : 0, 1, { s: 1.1 }); } }
    // (polish k1) THE RIGHT-HAND GATE BOLE stands 3.8 m further out (after every seeded planting, so no roll changes): from u 0.03 to 0.06 it stood between
    // the eye and the shelf, a trunk across the middle of the frame; now the bull and the cow on their shelf are seen between the two boles.
    { const g0 = trees[0]; for (const sd of [10.6, 11.8, 9.6]) { const q = at(31 / L, sd); if (trees.every((t) => t === g0 || Math.hypot(t.x - q.x, t.z - q.z) > 5.5)) { g0.x = q.x; g0.z = q.z; break; } } }
    await ctx.yield();
    // ---- redwood shadow bars, baked once: 1 = lit. Each tree lays a trunk bar and a long tapering crown.
    const SR = [Math.min(...trees.map((t) => t.x)) - 30, Math.min(...trees.map((t) => t.z)) - 30, Math.max(...trees.map((t) => t.x)) + 250, Math.max(...trees.map((t) => t.z)) + 110], SW = 1024;   // (polish 1) fitted to the forest: the bars run 250 m down-sun
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(SW, SW) : Object.assign(document.createElement('canvas'), { width: SW, height: SW });
    await ctx.yield();
    const c2 = cv.getContext('2d'); c2.fillStyle = '#fff'; c2.fillRect(0, 0, SW, SW);
    await ctx.yield();
    if (M.shade > 0) {
      const sl = Math.hypot(sunDir.x, sunDir.z) || 1, dx = -sunDir.x / sl, dz = -sunDir.z / sl, K = Math.min(5.2, 1 / Math.max(0.05, Math.tan(Math.asin(sunDir.y))));   // (polish 3) bars short and narrow enough to lie apart, with lit lawn between them
      const X = (x) => (x - SR[0]) / (SR[2] - SR[0]) * SW, Z = (z) => (z - SR[1]) / (SR[3] - SR[1]) * SW;
      c2.globalCompositeOperation = 'darken';                              // overlapping bars do not add up to black
      const poly = (pts, a) => { const v = Math.round(255 * (1 - a)); c2.fillStyle = `rgb(${v},${v},${v})`; c2.beginPath(); pts.forEach((q, i) => (i ? c2.lineTo(X(q[0]), Z(q[1])) : c2.moveTo(X(q[0]), Z(q[1])))); c2.closePath(); c2.fill(); };
      for (let ti = 0; ti < trees.length; ti++) {
        const t = trees[ti]; if (ti % 3 === 2) await ctx.yield();
        const H = (t.kind ? 16 : 30) * t.s * Math.cos(t.lean), len = H * K, w0 = 1.3 * t.s, wc = (t.kind ? 3.2 : 2.1) * t.s, c0 = (t.kind ? 0.4 : 0.22) * len;
        const P = (al, w) => [t.x + dx * al - dz * w, t.z + dz * al + dx * w];
        for (const [gr, a] of [[1.5, 0.3], [0.7, 0.6]]) poly([P(0, w0 * gr), P(c0, w0 * gr), P(c0 + len * 0.06, wc * gr), P(len * 0.6, wc * gr * 0.75), P(len, 0.4), P(len * 0.6, -wc * gr * 0.75), P(c0 + len * 0.06, -wc * gr), P(c0, -w0 * gr), P(0, -w0 * gr)], a);
      }
    }
    await ctx.yield();
    const shadowTex = new THREE.CanvasTexture(cv); shadowTex.flipY = false; shadowTex.colorSpace = THREE.NoColorSpace;
    shadowTex.wrapS = shadowTex.wrapT = THREE.ClampToEdgeWrapping; shadowTex.minFilter = THREE.LinearFilter; shadowTex.generateMipmaps = false;
    await ctx.yield();
    // ---- the hero: the breathing fern sea, its echelon and its rafts (world space == its sea space)
    const hero = await buildHero(ctx, { palette: PAL, detail, seaRadius: 640, swell: cast.swell, shelf: { x: -70, z: -50, radius: 250, damp: 0.22 }, herd: cast.herd, calves: cast.calves,
      ducks: Math.round(110 * dens), herdSpeed: HERD_SPEED, herdStart: 0, fan: { x: S0.x - N2[0] * 18, z: S0.z - N2[1] * 18, radius: 50 },
      sunDir: M.sun, sunColor: M.sunCol, shadowTex, shadowRect: SR, lateSeason: late * 0.85 });
    const U = hero.uniforms, seaU = hero.seaMaterial.uniforms;
    U.uChan.value.set(S0.x + N2[0] * 20 - E2[0] * 7, S0.z + N2[1] * 20 - E2[1] * 7, 13, 21);   // (polish 3) the full swell stops short of the bull's shelf: he stands whole   // the river channel under our first 50 m: the swell comes in at full height there (and is damped again before the bull's shelf)
    U.uChanG.value = CREST.top / (cast.swell * 0.5);
    seaU.uFanAxis.value.set(N2[0], N2[1]);                             // along our entry line the fan's edge lies where the first crest needs it (41 m out)
    seaU.uSeason.value.x = late ? 0.5 : 0.6; seaU.uLeads.value.set(1.5, 0.74, 34, 0.4);   // (polish 3) the lawn is whole: open water only in what the wind has torn (rare leads) and hair cracks along each crest
                              // emerald with rust patches, or two thirds rust
    if (M.rain > 0) seaU.uGold.value.set(0.42, 0.45, 0.44);
    if (moodName === 'noon') seaU.uGold.value.set(1.0, 1.0, 1.0);          // at noon the glitter is white            // under drizzle the open water glints pewter, not gold
    hero.setLight({ sunDir, sunColor: sunCol, skyZenith: col(M.zen), skyHorizon: col(M.hor) });
    { const q = at(0.54, 0, 0); seaU.uLoose.value.set(q.x, q.z, 30, 1); }      // (polish 4) where we skim into the grove the swell has worked the mat loose: black cracks blazing toward the sun
    seaU.uRing.value.set(pEnd.x, pEnd.z, 7, 7); seaU.uRingCol.value.set('#CFEFE2');
    const reflD = new Float64Array(8), reflI = new Int32Array(8);       // (polish 2) the eight boles nearest ahead of the eye lay their reflections: chosen every frame
    scene.add(hero.object);
    await ctx.yield();
    // ---- sky, haze
    const sky = makeSky({ rng, preset: moodName === 'drizzle' ? 'overcast' : 'day', ...M.sky, sunDirection: sunDir.clone(), sunColor: M.sunCol, ground: '#1E2E28', groundFalloff: 30, clouds: moodName === 'drizzle' ? { coverage: 0.66, softness: 0.3, opacity: 0.97, scale: 1.15, absorb: 2.1, detail: 0.7, silver: 1.3, haze: 0.34, lit: '#F1EEE2', shade: '#4F5C66' } : false, clouds2: moodName === 'drizzle' ? false : { coverage: 0.3, opacity: 0.35 } });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(col(M.fog), M.fogD);
    await ctx.yield();
    // ---- trees: one fluted trunk with feather boughs per kind and level of detail, instanced; needles stream in a light air
    const treeOpts = { key: 0.36, fill: 0.9, trans: 0.62, rim: 0.75, keyGrey: 0.35, floor: 0.2,
      deform: /* glsl */`{ float w = aAnim.x * aAnim.y; k = aAnim.y;
        float sway = sin(t * 1.3 + p.y * 0.35 + p.x * 0.5) * 0.5 + sin(t * 2.9 + p.z * 0.8) * 0.2;
        p.xz += uWind * (sway * 0.24 * w); p.y += 0.13 * w * sin(t * 1.7 + p.x);
        p = rotX(p, vec3(0.), iB.z); n = rotX(n, vec3(0.), iB.z);
        tint = vec3(1.) + iB.w * vec3(0.14, 0.05, -0.06); }`,
      pattern: /* glsl */`{ float nearK = 1. - smoothstep(40., 120., dist);
        if (k > 0.5) { float v = abs(vA.w), side = sign(vA.w + 1e-4), lobe = abs(fract(vA.z * 1.7 + 0.5 * step(0., side)) - 0.5) * 2., fine = abs(fract(vA.z * 44. + v * 9.) - 0.5) * 2.;
          float lim = 0.5 + 0.5 * (1. - lobe * lobe) - 0.2 * fine * fine;                          // sprays of soft flat needles: a scalloped edge with a fine fringe
          float gap = vnoise(vec2(vA.z * 3.1 + side * 7., v * 3.));
          if (v > mix(0.85, lim, smoothstep(0., 0.6, nearK)) || (gap > 0.8 && v > 0.25 && nearK > 0.5)) discard;
          alb *= (0.72 + 0.4 * (1. - v)) * (0.8 + 0.4 * vnoise(vec2(vA.z * 8., vA.w * 3.))) * (0.9 + 0.2 * fine * nearK);
        } else { float strip = vnoise(vec2(m.x * 9. + m.z * 7., m.y * 0.45)), fib = vnoise(vec2(m.x * 34. + m.z * 29., m.y * 1.4));
          alb *= 0.5 + 0.62 * strip * mix(0.5, 1., nearK) + 0.14 * (1. - nearK); alb *= 0.74 + 0.5 * fib * nearK; alb *= vec3(0.92, 0.9, 0.95);        // stringy bark in vertical strips
          float fl = cos(atan(m.z, m.x + 1e-4) * 7.);                                              // the flutes of the swollen base: lit ribs, shaded grooves
          alb *= mix(1., 0.5 + 0.62 * smoothstep(-0.7, 0.8, fl), (1. - smoothstep(1., 9., m.y)) * nearK);
          alb *= mix(0.62, 1., smoothstep(-0.15, 0.4, vPosW.y)); emit = alb * (uSkyHor * 0.3 + uSunCol * 0.1 * smoothstep(9., 0., vPosW.y)); } }` }, treeMat = makeLit(U, treeOpts);   // the shaded side of a bole takes the sky and the glitter off the water: never a black slab
    trees.forEach((t) => { const d = path.nearestXZ(t.x, t.z).dist; t.lod = d < 10.7 ? 2 : d < 72 ? 1 : 0; });
    const tl = (kind, lod) => trees.filter((t) => t.kind === kind && t.lod === lod).map((t) => ({ x: t.x, y: 0, z: t.z, yaw: t.yaw, s: t.s, ph: t.ph, v: t.lean, w: rng.range(-1, 1) }));
    const grng = rng.fork('plants');
    await ctx.yield();
    scene.add(instanced(redwoodGeo(grng, true), treeMat, tl(0, 1), 'redwoods'));
    await ctx.yield();
    scene.add(instanced(redwoodGeo(grng, false), treeMat, tl(0, 0), 'redwoods-far'));
    await ctx.yield();
    scene.add(instanced(cypressGeo(grng, true), treeMat, tl(1, 1), 'cypress'));
    await ctx.yield();
    scene.add(instanced(cypressGeo(grng, false), treeMat, tl(1, 0), 'cypress-far'));
    await ctx.yield();
    const rwNear = redwoodNearGeo(grng);
    await ctx.yield();
    scene.add(instanced(rwNear, treeMat, tl(0, 2), 'redwoods-near'));
    await ctx.yield();
    scene.add(instanced(cypressNearGeo(grng), treeMat, tl(1, 2), 'cypress-near'));
    await ctx.yield();
    // (polish k1) the lowest boughs of the redwoods beside the route trail in the water and ride the swell (see redwoodSkirtGeo)
    { const skirtMat = makeLit(U, { ...treeOpts, world: /* glsl */`q.y += sw.y * (1. - smoothstep(0.25, 2.8, position.y));` }), list = [];
      const near = trees.filter((t) => t.kind === 0 && t.lod > 0).map((t) => ({ t, nr: path.nearestXZ(t.x, t.z) })).filter((e) => e.nr.dist < 46).sort((a, b) => a.nr.dist - b.nr.dist).slice(0, Math.round(24 * detail));
      for (const { t, nr } of near) { const q = path.pointAt(nr.u), ox = t.x - q.x, oz = t.z - q.z;
        list.push({ x: t.x, y: 0, z: t.z, yaw: Math.atan2(ox, oz) + xr.range(-0.45, 0.45), s: t.s, ph: t.ph, v: 0, w: xr.range(-1, 1) }); }
      scene.add(instanced(redwoodSkirtGeo(xr), skirtMat, list, 'redwood-skirts')); }
    // knee roots ring every cypress: pegs the swell drowns and bares
    const kneeG = new F.Geo(); kneeG.tube([[0, -0.5, 0], [0.02, 0.25, 0], [0, 0.62, 0.02], [0, 0.72, 0.02]], [0.13, 0.085, 0.045, 0], 5, C3('#5A4434', 0.7), C3('#7A5C44', 0.75));
    const knees = [];
    for (const t of trees) if (t.kind === 1) for (let k = 0, n = t.lod > 1 ? 11 : t.lod ? 6 : 3; k < n; k++) { const a = rng() * TAU, d = rng.range(1.6, 4.6); knees.push({ x: t.x + Math.cos(a) * d, z: t.z + Math.sin(a) * d, y: 0, s: rng.range(0.5, 1.15), yaw: a, ph: rng() }); }
    scene.add(instanced(kneeG.build(), treeMat, knees, 'knees'));
    await ctx.yield();
    // ---- mudbanks: the entry shelf, the Gastornis bank, the exit outlier, and others off both points
    const tanYaw = (u) => { const t = path.tangentAt(u); return Math.atan2(t.x, t.z); };
    const bank = (p, r, stretch, h, yaw) => ({ x: p.x, z: p.z, y: 0, s: r, v: stretch, w: h, yaw, ph: rng() });
    const uShelf = lay.shelfAlong / L, uGast = 0.18;   // the Gastornis bank lies inside the left-hand arc, three quarters round it
    const banks = [bank(at(uShelf, 8.4, 1.6), 6.6, 1.4, 0.8, tanYaw(uShelf)), bank(at(uGast, 11.5), 7.5, 1.8, 0.7, tanYaw(uGast)), bank(at(uArch + 0.013, 11.6, 0), 5.2, 1.7, 0.75, tanYaw(uArch))];
    for (let i = 0, tries = 0; i < 7 && tries < 200; tries++) {
      const t = trees[rng.int(0, trees.length - 1)], a = rng() * TAU, d = rng.range(14, 30), x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
      if (path.nearestXZ(x, z).dist < 34 || banks.some((b) => Math.hypot(b.x - x, b.z - z) < 40)) continue;
      banks.push(bank({ x, z }, rng.range(7, 11), rng.range(1.4, 2), 0.6, rng() * TAU)); i++;
    }
    // (polish 4) LUSH BANKS BESIDE THE ROUTE: low mud islets thick with horsetail and royal fern (no grass, no reeds: there are none yet),
    // one on the left of the first leg, one where we skim into the grove, one in the glade, one behind the wading family
    for (const [uu, sd, fw, r] of [[0.125, -13.5, 0, 5], [0.5, 12.5, 0, 5.5], [0.655, -13, 0, 5], [uFam, -14.5, 14, 5.5]]) { const b = bank(at(uu, sd, fw), r, 1.5, 0.6, tanYaw(uu) + 0.4); b.lush = 1; banks.push(b); }
    // (polish k1, brief: "two tapir-like Thuliadanta on the far spit", at range only) a mudbank off the far tip of the east spit, at least 80 m from the route
    let tb = null; for (let t = 100; t <= 190 && !tb; t += 6) for (const w of [0, 9, -9, 18, -18]) { const x = spitC[0] + ax[0] * t + px[0] * w, z = spitC[1] + ax[1] * t + px[1] * w;
      if (!tb && path.nearestXZ(x, z).dist > 80 && trees.every((q) => Math.hypot(q.x - x, q.z - z) > 10) && banks.every((b) => Math.hypot(b.x - x, b.z - z) > 26)) tb = { x, z, y: 0, s: 7.5, v: 1.7, w: 0.6, yaw: Math.atan2(ax[0], ax[1]), ph: 0.37 }; }
    if (!tb) tb = { x: spitC[0] + ax[0] * 150, z: spitC[1] + ax[1] * 150, y: 0, s: 7.5, v: 1.7, w: 0.6, yaw: Math.atan2(ax[0], ax[1]), ph: 0.37 };
    const bankY = (b, x, z) => { const dx = x - b.x, dz = z - b.z, c = Math.cos(b.yaw), sn = Math.sin(b.yaw), lz = (dx * sn + dz * c) / (b.s * b.v), lx = (dx * c - dz * sn) / b.s, r = Math.min(1, Math.hypot(lx, lz)); return b.w * ((1 - r * r) ** 2 - 0.6 * r * r * r); };
    const onBank = (b, rMax = 0.8, rng = ctx.rng) => { const a = rng() * TAU, r = Math.sqrt(rng()) * rMax, lx = Math.cos(a) * r * b.s, lz = Math.sin(a) * r * b.s * b.v, c = Math.cos(b.yaw), sn = Math.sin(b.yaw); const x = b.x + lx * c + lz * sn, z = b.z - lx * sn + lz * c; return { x, z, y: bankY(b, x, z) }; };
    const mudMat = makeLit(U, { key: 0.38, fill: 1.0, rim: 0.2, floor: 0.2, pars: SHADE_GLSL,
      deform: /* glsl */`{ p.z *= iB.z; p.y *= (p.y < 0. ? 5. : 1.) * iB.w / max(sc, 1e-3); n = normalize(vec3(n.x, n.y * 6., n.z)); }`,
      pattern: /* glsl */`{ float cr = vnoise(vPosW.xz * 2.3), fine = vnoise(vPosW.xz * 17.), cr2 = vnoise(vPosW.xz * 0.9 + 7.), peb = vnoise(vPosW.xz * 43.);
        alb *= 0.72 + 0.3 * cr + 0.22 * fine + 0.12 * peb;
        float dry = smoothstep(0.16, 0.42, vPosW.y), nearK = 1. - smoothstep(18., 60., dist);
        float ck = max(smoothstep(0.035, 0.008, abs(cr - 0.5)), 0.8 * smoothstep(0.03, 0.006, abs(cr2 - 0.5)));        // drying cracks: plates a stride and a body across
        ck = max(ck, 0.7 * smoothstep(0.05, 0.015, abs(vnoise(vPosW.xz * 6.1 + 3.) - 0.5)) * nearK);                     // and a finer net close to
        alb *= 1. - 0.55 * ck * dry;
        alb *= 1. + 0.18 * (vnoise(vPosW.xz * 0.9 + 7.) - 0.5) + 0.25 * step(0.78, peb) * nearK;                           // paler plates, shell grit
        alb = mix(alb * 0.5, alb, smoothstep(-0.05, 0.4, vPosW.y));                                         // wet and dark at the rim
        alb = mix(alb, vec3(0.06, 0.17, 0.05), smoothstep(0.5, 0.62, vnoise(vPosW.xz * 61.) * 0.5 + vnoise(vPosW.xz * 23.) * 0.3 + vnoise(vPosW.xz * 3.1) * 0.2) * smoothstep(0.2, 0.05, vPosW.y) * smoothstep(-0.12, 0.0, vPosW.y) * 0.75);   // fine fern flecks stranded at the rim
        alb = mix(vec3(0.05, 0.045, 0.04), alb, smoothstep(-0.3, 0.02, vPosW.y));                           // the drowned skirt: dark wet mud
        emit = mix(uSkyZen, uSkyHor, 0.6) * 0.16 * smoothstep(0.4, 0.02, vPosW.y) * smoothstep(-0.1, 0.02, vPosW.y) * (0.5 + cr);
        alb *= mix(vec3(1.), vec3(0.34, 0.42, 0.56), castShade(vPosW.xz, normalize(uSunDir.xz + vec2(1e-4)))); }` });   // (polish 4) every animal on the mud lays its long shadow and stands on it
    await ctx.yield();
    scene.add(instanced(mudGeo(grng), mudMat, banks.concat([tb]), 'mudbanks'));
    await ctx.yield();
    // horsetails and royal ferns on the banks (never grass: there is none yet)
    const plantMat = makeLit(U, { key: 0.42, fill: 0.8, trans: 0.6, rim: 0.3,
      deform: /* glsl */`{ float w = aAnim.x; k = aAnim.y; p.xz += uWind * (w * w * 0.1 * sin(t * 2.1 + p.y * 2. + iB.y * 20.)); }`,
      pattern: /* glsl */`{ if (k > 0.5) { float v = abs(vA.w), comb = abs(fract(vA.z * 7.) - 0.5) * 2.; if (v > 1. - (0.25 + 0.5 * comb) * (1. - smoothstep(15., 50., dist))) discard; alb *= 0.75 + 0.4 * (1. - v); } }` });
    const horsetails = [], ferns = [];
    banks.forEach((b, i) => {
      const nh = Math.round((i === 1 ? 80 : i < 3 ? 40 : b.lush ? 46 : 8) * detail), nf = Math.round((i === 1 ? 30 : i < 3 ? 26 : b.lush ? 30 : 8) * detail);
      for (let k = 0; k < nh; k++) { const q = onBank(b, 0.85); if (q.y < 0.12 || path.nearestXZ(q.x, q.z).dist < (i < 2 ? 11 : i === 2 ? 11.4 : 5.2)) continue; horsetails.push({ ...q, y: q.y - 0.03, s: rng.range(0.8, 1.2), yaw: rng() * TAU, ph: rng() }); }
      for (let k = 0; k < nf; k++) { const q = onBank(b, 0.9); if (q.y < 0.08 || path.nearestXZ(q.x, q.z).dist < (i < 2 ? 11 : i === 2 ? 11.4 : 5.2)) continue; ferns.push({ ...q, y: q.y - 0.03, s: rng.range(0.7, 1.1), yaw: rng() * TAU, ph: rng() }); }
    });
    for (let k = 0; k < Math.round(12 * detail); k++) { const q = onBank(tb, 0.85, xr); if (q.y > 0.1) (k % 3 ? horsetails : ferns).push({ ...q, y: q.y - 0.03, s: xr.range(0.8, 1.15), yaw: xr() * TAU, ph: xr() }); }
    await ctx.yield();
    scene.add(instanced(horsetailGeo(grng), plantMat, horsetails, 'horsetails'), instanced(fernGeo(grng), plantMat, ferns, 'royal-ferns'));
    await ctx.yield();
    // ginkgos on the levees: two behind the Gastornis, one on the exit bank beside the Thuliadanta, one on each of five far banks
    { const gk = [], put = (b, p) => gk.push({ x: p.x, z: p.z, y: Math.max(0, bankY(b, p.x, p.z)) - 0.1, s: grng.range(0.85, 1.1), yaw: grng() * TAU, ph: grng() });
      put(banks[1], at(uGast, 13.8, 3.6)); put(banks[1], at(uGast, 13.2, -4.2)); put(banks[2], at(uArch + 0.013, 15.2, 5));
      banks.slice(3, 8).filter((b) => !b.lush).forEach((b) => put(b, { x: b.x + 1.5, z: b.z - 1 }));
      scene.add(instanced(ginkgoGeo(grng), plantMat, gk, 'ginkgos')); }
    await ctx.yield();
    // alligators as ridged logs on the far banks, and the 22 m fallen redwood adrift on the mat with ducks along it
    const plainMat = makeLit(U, { key: 0.4, fill: 0.75, rim: 0.3, pattern: /* glsl */`{ alb *= 0.8 + 0.4 * vnoise(m.xz * vec2(30., 6.) + m.y * 9.); }` });
    const gators = []; banks.slice(3).filter((b) => !b.lush).forEach((b) => { for (let k = 0; k < 2; k++) { const q = onBank(b, 0.6); gators.push({ ...q, y: q.y + 0.02, s: 0.97, yaw: rng() * TAU, ph: rng() }); } });
    // (polish k1, brief: "at range only (beyond 70 m): twelve blunt-snouted alligators 1.8 m") the model is 1.85 m long, so its scale is 0.97 (it was 1.8: 3.3 m);
    // one that lay nearer the route than 72 m is hauled out on a bank that lies far enough off (or on the spit's far bank) instead
    { const farB = banks.slice(3).filter((b) => !b.lush && path.nearestXZ(b.x, b.z).dist > 72 + b.s * b.v).concat([tb]);
      gators.forEach((gt, i) => { if (path.nearestXZ(gt.x, gt.z).dist >= 72) return; const b = farB[i % farB.length];
        for (let tries = 0; tries < 8; tries++) { const q = onBank(b, 0.6, xr); if (path.nearestXZ(q.x, q.z).dist >= 72 || tries === 7) { gt.x = q.x; gt.z = q.z; gt.y = q.y + 0.02; break; } } });
      if (gators.length > 12) gators.length = 12; }
    scene.add(instanced(gatorGeo(), plainMat, gators, 'alligators'));
    const floatMat = makeLit(U, { key: 0.44, fill: 0.95, rim: 0.9, keyGrey: 0.5, floor: 0.2, float: true, pattern: /* glsl */`{ float ang = atan(m.y - 0.12, m.x + 1e-4);      // (polish 3) the drifting trunk: furrowed bark in long strips, fern riding on its back, wet-dark at the waterline
        float strip = vnoise(vec2(ang * 5., m.z * 0.35)), fib = vnoise(vec2(ang * 19., m.z * 1.6)), fur = smoothstep(0.4, 0.5, vnoise(vec2(ang * 8. + 3., m.z * 0.2)));
        alb *= (0.5 + 0.7 * strip) * (0.7 + 0.5 * fib) * (1. - 0.45 * fur);
        float top = smoothstep(0.3, 0.8, N.y) * smoothstep(0.42, 0.6, vnoise(m.xz * vec2(2.3, 0.9) + 7.) * 0.6 + vnoise(m.xz * 9.) * 0.4);
        alb = mix(alb, vec3(0.05, 0.17, 0.05) * (0.7 + 0.6 * fib), top * 0.75);
        alb *= mix(0.4, 1., smoothstep(0.0, 0.32, vPosW.y));
        emit = alb * (uSkyHor * 0.34 + uSunCol * 0.07) + uSunCol * alb * 0.5 * smoothstep(0.55, 0.95, N.y) * smoothstep(0.25, 0.7, 1. - abs(dot(N, V))); }` });      // (polish k1) the shaded side takes the sky, the upper edge a warm line of sun: red-brown wood, never a black cutout
    const uLog = uDL - 0.005, logP = at(uLog, -9, 3), logYaw = tanYaw(uLog) + 0.3;      // (polish 3) the fallen redwood lies in the glade of the left bend, ducks along it
    scene.add(instanced(logGeo(grng), floatMat, [{ x: logP.x, z: logP.z, y: 0, yaw: logYaw, s: 1, ph: 0.3 }], 'fallen-redwood'));
    seaU.uLogA.value.set(logP.x, logP.z, Math.sin(logYaw), Math.cos(logYaw)); seaU.uLogB.value.set(10.6, 0.62);      // (polish k1) the sea knows where the trunk lies: contact shade, fern against its flank, its dark image on the water
    seaU.uGrove.value.set(groveC.x, groveC.z, 100, 1);                                                               // and all the water of the drowned forest mirrors trunks and crowns, not a blank sky
    await ctx.yield();
    // shed needle sprays and cones afloat on the mat (brief: flora), riding the swell: small things with edges all along the route
    { const g = new F.Geo(), n0 = C3('#6E5630', 0.55), n1 = C3('#94804A', 0.6), cone = C3('#4A3826', 0.6), cone2 = C3('#66503A', 0.6);
      bough(g, [0, 0.03, 0], 0.2, 0.78, { c0: n0, c1: n1, width: 0.46, seg: 3, droop: 0, rise: 0, comb: 3 });
      bough(g, [0.1, 0.035, 0.05], 1.5, 0.5, { c0: n1, c1: n0, width: 0.5, seg: 3, droop: 0, rise: 0, comb: 3 });
      g.blob(0.3, 0.045, -0.2, 0.04, 0.04, 0.055, cone2, cone, 4, 2); g.blob(-0.15, 0.04, 0.28, 0.035, 0.035, 0.05, cone2, cone, 4, 2);
      const litterMat = makeLit(U, { key: 0.42, fill: 0.9, rim: 0.2, float: true, deform: /* glsl */`{ k = aAnim.y; }`,
        pattern: /* glsl */`{ if (k > 0.5) { float v = abs(vA.w), comb = abs(fract(vA.z * 7.) - 0.5) * 2.; if (v > 1. - (0.2 + 0.5 * comb) * (1. - smoothstep(12., 40., dist))) discard; alb *= 0.8 + 0.4 * (1. - v); } }` });
      const litter = [], nl = Math.round(360 * detail);
      for (let i = 0, tries = 0; litter.length < nl && tries < nl * 4; tries++, i++) { const uu = rng.range(0.06, 0.97), p = at(uu, (rng.chance(0.5) ? 1 : -1) * (2.5 + 42 * rng() * rng()), 0);
        if (banks.some((b) => Math.hypot(b.x - p.x, b.z - p.z) < b.s * b.v)) continue;
        litter.push({ x: p.x, z: p.z, y: 0.0, yaw: rng() * TAU, s: rng.range(0.6, 1.25), ph: rng() }); if (i % 90 === 89) await ctx.yield(); }
      scene.add(instanced(g.build(), litterMat, litter, 'needle-sprays')); }
    await ctx.yield();
    // ---- Gastornis: an adult pair and a youngster cropping horsetail tops on their bank; heads lift as we pass
    const gb = banks[1], gastMat = makeLit(U, { key: 0.44, fill: 1.0, trans: 0.15, rim: 0.9, floor: 0.22, deform: GASTORNIS_DEFORM, pattern: GASTORNIS_PATTERN });
    const gast = [[5.6, -3.5, 1, 0.3], [8.2, 1.5, 0.94, -0.5], [7.4, 5.5, 0.65, 0.9]].map(([sd, fw, s, turn], i) => { const p = at(uGast, sd, fw); return { x: p.x, z: p.z, y: Math.max(0.1, bankY(gb, p.x, p.z)) - 0.02, s, yaw: tanYaw(uGast) - 2.4 - turn, ph: rng(), v: 1, w: i }; });
    await ctx.yield();
    scene.add(instanced(gastornisGeo(grng), gastMat, gast, 'gastornis'));
    await ctx.yield();
    // ---- brontotheres that stand whole: a bull and a cow on the entry shelf (they step off and sink), a family at the exit bank
    const sb = banks[0], eb = banks[2];
    const stand = (p, b, s, kind, yaw) => ({ x: p.x, z: p.z, s, kind, ph: rng(), tint: rng.range(-1, 1), depth: -Math.max(0.1, bankY(b, p.x, p.z)), yaw });
    // The bull stands at the rim of the shelf, ahead-right of us, heading across our bows and away (so we come up on his
    // flank, broadside, with the low sun behind him) and steps off that way: forefeet through the lawn first, then down to
    // the chest as we draw level. The cow stays whole on the mud a body-length behind him.
    const shelfYaw = tanYaw(uShelf) + 0.45, WALK = 3.0;
    U.uWalk.value = WALK;
    const shelfList = [stand(at(uShelf, 3.9, 0), sb, 1.14, 4, shelfYaw)];      // (polish k1) kind 4: a bank BULL, with the brief's blunt canine tusks (kind 3 is a bank cow, 5 a bank calf)
    const shelfHerd = makeBrontoHerd(U, PAL, shelfList, { detail: 1, geometry: hero.brontoGeometry }); hero.object.add(shelfHerd.mesh);   // (the hero's shaders work in sea space: its children ride with it)
    await ctx.yield();
    const UE = { ...U, uSink: { value: 0 } };                           // the exit family never sinks
    const exYaw = tanYaw(uFam) - 1.2, wade = (p, s, yaw, d) => ({ x: p.x, z: p.z, s, kind: s > 1.05 ? 4 : s < 0.6 ? 5 : 3, ph: rng(), tint: rng.range(-1, 1), depth: d * s, yaw });
    const famP = famAt, fb = banks[3] || eb;
    // the cow on the entry shelf; the family knee-deep in a glade of the drowned forest, broadside under the low sun; a cow and her calf
    // standing whole on the mudbank beside the avenue, sun-lit, as we run in to the ring; two tapir-like Thuliadanta at range on a far bank
    // (polish k1, brief: "a tusked bull and a cow stand whole on a mud shelf ... then step off and sink through the lawn to their chests, a black
    // sparkling ring tearing open round each") THE COW STEPS OFF TOO. She stands where she stood, follows the bull down the mud as he goes in
    // (her feet on the mud's own slope all the way: uBankA / uBankB give the shader the bank's shape) and sinks at its rim, her own ring opening.
    const COW_WALK = 7.6, cowA = stand(at(uShelf, 9.2, 1.2), sb, 0.95, 3, shelfYaw + 0.5);
    const UC = { ...U, uSink: { value: 0 }, uWalk: { value: 0 } }, cowHerd = makeBrontoHerd(UC, PAL, [cowA], { geometry: shelfHerd.geometry }); hero.object.add(cowHerd.mesh);
    cowHerd.material.uniforms.uBankA.value.set(sb.x, sb.z, sb.yaw, sb.s); cowHerd.material.uniforms.uBankB.value.set(sb.v, sb.w);
    const exitList = [wade(at(uFam, -4.3, 6.6), 1.14, exYaw - 0.1, 0.24), wade(at(uFam, -3.4, 15.5), 0.95, exYaw + 0.3, 0.27), wade(at(uFam, -1.8, 17.8), 0.5, exYaw + 0.1, 0.24),
      stand(at(uArch + 0.013, 8.9, -2.0), eb, 1.0, 3, tanYaw(uArch) + 0.5), stand(at(uArch + 0.013, 10.3, 1.6), eb, 0.5, 5, tanYaw(uArch) + 0.15),
    ];
    const farList = [stand({ x: tb.x + 1.2, z: tb.z + 0.6 }, tb, 0.6, 3, tb.yaw + 1.2), stand({ x: tb.x - 1.6, z: tb.z - 1.2 }, tb, 0.56, 3, tb.yaw + 0.5)];      // (polish k1) the two Thuliadanta stand on the far spit's bank (they stood on the first bank)
    for (let i = 0; i < 4; i++) { const q = at(lerp(uC1 + 0.012, 0.975, i / 3), 0, 0); seaU.uPools.value[i].set(q.x, q.z, 15, 30); }
    seaU.uPools.value[4].set(exitList[0].x, exitList[0].z, 3.7, 1.4); seaU.uPools.value[5].set((exitList[1].x + exitList[2].x) / 2, (exitList[1].z + exitList[2].z) / 2, 3.9, 1.6);   // (polish 3) the family stands in water it has torn open      // the forest stands in open water
    const exitHerd = makeBrontoHerd(UE, PAL, exitList, { geometry: shelfHerd.geometry }); hero.object.add(exitHerd.mesh);
    // (polish 4) LONG SHADOWS: whatever stands whole lays a shadow eight times its height down-sun across mud and carpet, and a soft shade at its feet
    const shadK = M.shade > 0 ? Math.min(8, 1 / Math.max(0.05, Math.tan(Math.asin(sunDir.y)))) : 0.6, shadV = U.uShad.value;
    [shelfList[0], cowA, exitList[0], exitList[1], exitList[2], exitList[3], exitList[4]].forEach((a, i) => shadV[i].set(a.x, a.z, 0.44 * a.s, 1.25 * a.s * shadK));
    gast.forEach((a, i) => shadV[7 + i].set(a.x, a.z, 0.4 * a.s, 1.9 * a.s * shadK));
    await ctx.yield();
    hero.object.add(makeBrontoHerd(UE, PAL, farList, { detail: 0.5, material: exitHerd.material }).mesh);
    await ctx.yield();
    // ---- Presbyornis: rafts sitting all over the mat (they ride the swell), a wave of them lifting ahead of us on
    // leg C, wheeling flocks far out, four flockmates holding station ahead, and our own two wingtips.
    const birdLook = { key: 0.36, fill: 0.95, trans: 0.2, rim: 0.3, keyGrey: 0.6, floor: 0.06, bounce: col('#7C8478').multiplyScalar(0.5) };   // dove grey stays grey: no emerald fill, a paler key
    const sitMat = makeLit(U, { ...birdLook, trans: 0, float: true,
      deform: /* glsl */`{ float w = aAnim.x, look = 0.9 * sin(t * 0.43 + ph * 20.) * w; p = rotY(p, vec3(0., 0.13, 0.16), look); n = rotY(n, vec3(0.), look);
        float gone = iB.w < 0. ? 1. - smoothstep(-iB.w, -iB.w + 0.004, uAct.x) : smoothstep(iB.w, iB.w + 0.004, uAct.x); sc *= 1. - gone; root.y += 0.012 * sin(t * 2.3) + iA.y * 0.;
        k = position.y; float dcm = length(root.xz - uCamL.xz); sc *= smoothstep(3.6, 5.6, dcm); p.xz *= 1. - aAnim.y * smoothstep(26., 40., dcm); }`,      // (polish k1) no sitting bird under the lens, cut by the frame (the hero's rafts have the same rule)
      pattern: /* glsl */`{ alb *= mix(0.42, 1., smoothstep(0.015, 0.1, k)); }` });      // a dark wet line where the hull meets the mat: it sits IN the lawn
    const flyDeform = DUCK_FLAP + /* glsl */`
      if (iB.z < 0.5) { float tau = (uAct.x - iB.w) * 42., on = step(0., tau); tau = max(tau, 0.); float cl = 1. - exp(-tau / 2.2);
        root.xz += vec2(sin(yaw), cos(yaw)) * (tau * 3. + 7.5 * tau * cl); root.y += (2.5 + 13. * ph) * cl + 0.3 * sin(t * 1.3) * cl;
        yaw += (ph - 0.5) * 0.9 * smoothstep(3., 10., tau); sc *= on * smoothstep(0., 0.25, tau);
        p = rotX(p, vec3(0.), -0.4 * (1. - cl)); n = rotX(n, vec3(0.), -0.4 * (1. - cl)); }
      else if (iB.z < 1.5) { float R = iB.w, th = uTime * 9.5 / max(R, 1.) + yaw + (ph - 0.5) * 1.3;
        root.xz += vec2(cos(th), sin(th)) * R * (1. + 0.22 * sin(th * 2. + ph * 9.)); root.y += 2.2 * sin(th * 3. + ph * 20.);
        yaw = atan(-sin(th), cos(th)); p = rotZ(p, vec3(0.), 0.3); n = rotZ(n, vec3(0.), 0.3); }
      else if (iB.z > 2.5) { float dl = uAct.x - iB.w, h = 1. - smoothstep(-0.05, 0.004, dl);      // landing on the lawn: down the last metres nose-up, legs reaching
        root.y += 0.26 + 5.5 * h * h; root.xz -= vec2(sin(yaw), cos(yaw)) * (h * 16.);
        float pit = -0.8 * (1. - 0.6 * h); p = rotX(p, vec3(0.), pit); n = rotX(n, vec3(0.), pit);
        sc *= 1. - smoothstep(0.012, 0.016, dl); }
      else { root.y += uAct.w; float wx = uAct.x * 31. + ph * 9., wy = uAct.x * 43. + ph * 5., wz = uAct.x * 23. + ph * 7.;      // flockmates drift, swap height, drop back
        root += vec3(1.25 * sin(wx) + 0.14 * sin(t * 0.61 + 1.), 0.6 * sin(wy) + 0.12 * sin(t * 0.9), 1.7 * sin(wz) + 0.2 * sin(t * 0.37));
        p = rotZ(p, vec3(0.), -0.3 * cos(wx) + 0.1 * sin(t * 0.61 + 2.5)); n = rotZ(n, vec3(0.), -0.3 * cos(wx)); }`;
    // no lifting or wheeling bird may come nearer the lens than 4.5 m: it is eased aside, whole
    const keepOff = /* glsl */`{ vec3 dc = root - uCamL + vec3(0., 1e-3, 0.); float dl = length(dc); root += dc / dl * max(0., 11. - dl) * 1.15; }`;

    const flyMat = makeLit(U, { ...birdLook, deform: flyDeform, world: keepOff });
    let farMat = null;
    flyMat.uniforms.uAct.value.z = TAU * 4;
    const herdXs = hero.herd.map((a) => a.x), offLane = (x, z) => herdXs.every((hx) => Math.abs(x - hx) > 3.1) || z < -75 || z > 140;
    const sit = [], fly = [], nSit = Math.min(430, Math.round(cast.ducks * 0.3 * detail));
    const addRaft = (cx, cz, r, n, trig, big = 1) => { const yaw0 = rng() * TAU;
      for (let i = 0; i < n; i++) { const a = rng() * TAU, d = Math.sqrt(rng()) * r, x = cx + Math.cos(a) * d * 1.4, z = cz + Math.sin(a) * d * 0.8, nr = path.nearestXZ(x, z);
        if (nr.dist < 5 || (!trig && !offLane(x, z)) || banks.some((b) => Math.hypot(b.x - x, b.z - z) < b.s * b.v)) continue;
        const tr = trig ? trig(x, z, nr) : 9;
        sit.push({ x, z, y: 0.01, yaw: yaw0 + rng.range(-0.8, 0.8), s: rng.range(0.92, 1.12) * big, ph: rng(), w: tr });
        if (tr < 9) { const t = path.tangentAt(nr.u), sgn = ((x - path.pointAt(nr.u).x) * -t.z + (z - path.pointAt(nr.u).z) * t.x) > 0 ? 1 : -1, ang = Math.atan2(t.x, t.z) + sgn * rng.range(0.35, 0.95);   // away from the route, onward
          fly.push({ x, z, y: 0.25, yaw: ang, s: rng.range(0.95, 1.1), ph: rng(), v: 0, w: tr }); } } };
    // the wave: rafts beside leg C from u 0.44, each bird lifting as we come within ~14 m, so the wave runs away ahead
    for (let k = 0; k < 12; k++) { const uu = lerp(uWave - 0.055, uWave + 0.06, k / 11), sd = (k % 2 ? 1 : -1) * rng.range(9, 24), p = at(uu, sd, 0);
      addRaft(p.x, p.z, rng.range(4, 8), Math.round(rng.range(12, 22) * detail), (x, z, nr) => clamp(nr.u - (22 + nr.dist * 0.5) / L + rng.range(-0.006, 0.006), uWave - 0.08, uWave + 0.12));
      if (k % 3 === 2) await ctx.yield(); }
    await ctx.yield();
    { const p = at(47 / L, -8, 0); addRaft(p.x, p.z, 5.5, Math.round(28 * detail)); const p2 = at(49 / L, 6.5, 0); addRaft(p2.x, p2.z, 3.5, Math.round(14 * detail)); const q = at(96 / L, -3, 14); addRaft(q.x, q.z, 7, Math.round(30 * detail)); }   // the rafts that ride the first crest
    // (review 3) leg D and E: rafts close beside the route that never lift (the wave has passed), the big one where the veiled sun swings in,
    // and seven birds that come in to land among it as we arrive, each punching a small black hole in the lawn that closes again
    const uRaft = lerp(uC1, uDL, 0.24), landers = [];      // (polish 3) the birds come down ahead of us as we enter the grove, each tearing a hole a wingspan across
    for (const [uu, sd, r, n] of [[uRaft, -2.5, 6, 48], [lerp(uC1, uD1, 0.36), -8, 4, 20], [lerp(uC1, uD1, 0.52), 8, 4, 18], [lerp(uC1, uD1, 0.66), -11, 4.5, 22], [uD1 - 0.05, -7.5, 4, 18], [uD1 + 0.03, -8, 4.5, 22], [uD1 + 0.085, 8.5, 4, 16], [0.135, -7.5, 3.5, 16], [0.215, -8, 4, 18], [0.262, -7, 3, 14], [0.305, 8.5, 3.5, 14]]) {   // (polish 4) and rafts in the foreground of the early legs
      const p = at(uu, sd, 0); addRaft(p.x, p.z, r, Math.round(n * Math.max(detail, 0.8)), undefined, 1.22); }
    for (let k = 0; k < 7; k++) { const uu = uRaft - 0.014 + 0.006 * k, p = at(uu, -(3.3 + 1.3 * ((k * 3) % 5)), rng.range(-1.5, 1.5)), ut = uRaft - 0.05 + 0.0045 * k, yaw = tanYaw(uu) - 0.9 + rng.range(-0.3, 0.3);
      landers.push({ x: p.x, z: p.z, ut });
      fly.push({ x: p.x, z: p.z, y: 0.02, yaw, s: 1.22, ph: rng(), v: 3, w: ut });
      sit.push({ x: p.x, z: p.z, y: 0.01, yaw, s: 1.22, ph: rng(), w: -(ut + 0.012) }); }
    await ctx.yield();
    const sit0 = sit.length;
    for (let guard = 0; sit.length < nSit && guard < 400; guard++) { const uu = rng.range(0.02, 0.98), p = at(uu, (rng.chance(0.5) ? 1 : -1) * rng.range(8, 95), 0); addRaft(p.x, p.z, rng.range(3, 9), rng.int(8, 26)); if (guard % 5 === 4) await ctx.yield(); }
    { const far = sit.splice(sit0); far.forEach((d, i) => { if (i % 5 < 2) sit.push(d); }); }   // (polish 1) thin the far scattered rafts: triangles go to the trees and the herd
    for (let k = 0; k < 9; k++) { const s = (k - 4) * 2.3 + rng.range(-0.5, 0.5), c = Math.cos(logYaw), sn = Math.sin(logYaw); sit.push({ x: logP.x + sn * s, z: logP.z + c * s, y: 0.66, yaw: logYaw + 1.57 + rng.range(-0.5, 0.5), s: 1.05, ph: rng(), w: 9 }); }
    await ctx.yield();
    scene.add(instanced(duckSitGeo(), sitMat, sit, 'ducks-sitting'));
    await ctx.yield();
    // wheeling flocks (time-keyed): over the first crest, over the echelon, out at sea, off the spit
    const wheels = [[at(0.09, -30, 70), 16, 34], [at(uGap, -60, 60), 22, 46], [at(lerp(uC1, uD1, 0.4), -70, 20), 30, 60], [at(0.88, -50, 40), 20, 40], [at(uC0, -90, 80), 34, 70]];
    for (const [c, h, R] of wheels) { const fp = rng() * TAU, n = Math.round(rng.range(15, 22) * detail * dens);
      for (let i = 0; i < n; i++) fly.push({ x: c.x + rng.range(-7, 7), y: h + rng.range(-5, 5), z: c.z + rng.range(-7, 7), yaw: fp, s: rng.range(0.95, 1.1), ph: rng(), v: 1, w: R * rng.range(0.85, 1.15) }); }
    await ctx.yield();
    scene.add(instanced(duckFlyGeo(false), flyMat, fly, 'ducks-flying'));
    await ctx.yield();
    // (polish k1, brief: 2,400 on the mat and 600 flying, 1,500 to 3,000 by seed; about 900 were drawn) THE FAR RAFTS AND WHEELS, eight triangles a bird,
    // none nearer the route than 26 m: big rafts on the mat ahead of leg C that lift in one wave running away from us (each bird by its distance from where
    // the wave starts), the rafts that ride the first crest, rafts scattered over the bay, and wheels far out. All from this round's own random stream.
    { const farD = [], ducksAll = Math.min(3000, cast.ducks), nearSit = sit.length + Math.round(110 * dens * detail);
      const nFar = clamp(Math.round(0.8 * ducksAll * detail) - nearSit, 0, 1400), nFly = clamp(Math.round(0.2 * ducksAll * detail) - 101, 0, 320);
      const O = path.pointAt(0.445), okAt = (x, z) => path.nearestXZ(x, z).dist > 26 && offLane(x, z) && banks.every((b) => Math.hypot(b.x - x, b.z - z) > b.s * b.v + 1) && trees.every((t) => Math.abs(t.x - x) > 2.6 || Math.abs(t.z - z) > 2.6);
      const farRaft = (c, r, n, wave) => { const yaw0 = xr() * TAU, tq = path.nearestXZ(c.x, c.z), tg = path.tangentAt(tq.u), pq = path.pointAt(tq.u), sgn = ((c.x - pq.x) * -tg.z + (c.z - pq.z) * tg.x) > 0 ? 1 : -1;
        for (let i = 0; i < n; i++) { const a = xr() * TAU, d = Math.sqrt(xr()) * r, x = c.x + Math.cos(a) * d * 1.5, z = c.z + Math.sin(a) * d * 0.8; if (!okAt(x, z)) continue;
          const tr = wave ? clamp(0.447 + Math.hypot(x - O.x, z - O.z) / (4.4 * L) + xr.range(-0.004, 0.004), 0.44, 0.57) : 9;
          farD.push({ x, z, y: 0.01, yaw: wave ? Math.atan2(tg.x, tg.z) - sgn * (sgn < 0 ? xr.range(0.55, 1.15) : xr.range(1.8, 2.4)) : yaw0 + xr.range(-0.8, 0.8), s: xr.range(0.95, 1.2), ph: xr(), v: 0, w: tr }); } };
      const nWave = Math.round(nFar * 0.6), nCrest = Math.round(nFar * 0.12);
      for (let guard = 0; farD.length < nWave && guard < 90; guard++) { farRaft(xr.chance(0.75) ? at(xr.range(0.46, 0.64), -xr.range(28, 100), 0) : at(xr.range(0.46, 0.6), xr.range(28, 62), 0), xr.range(7, 14), xr.int(28, 60), true); if (guard % 3 === 2) await ctx.yield(); }
      for (let guard = 0; farD.length < nWave + nCrest && guard < 40; guard++) { farRaft(at(xr.range(50, 105) / L, (xr.chance(0.5) ? -1 : 1) * xr.range(28, 75), 0), xr.range(6, 12), xr.int(24, 46), false); if (guard % 3 === 2) await ctx.yield(); }
      for (let guard = 0; farD.length < nFar && guard < 140; guard++) { farRaft(at(xr.range(0.03, 0.97), (xr.chance(0.5) ? -1 : 1) * xr.range(34, 190), 0), xr.range(5, 12), xr.int(14, 40), false); if (guard % 3 === 2) await ctx.yield(); }
      if (farD.length > nFar) farD.length = nFar;
      const farWheels = [[at(0.1, -150, 90), 26, 50], [at(0.24, -165, 30), 34, 58], [at(0.36, -170, -10), 22, 46], [at(0.33, 150, 40), 30, 54], [at(0.5, -160, 40), 40, 60], [at(0.66, -170, 20), 30, 50], [at(0.86, -170, 30), 26, 46]];      // never nearer the route than about 80 m
      farWheels.forEach(([c, h, R], k) => { const fp = xr() * TAU, n = Math.round(nFly / farWheels.length);
        for (let i = 0; i < n; i++) farD.push({ x: c.x + xr.range(-9, 9), y: h + xr.range(-6, 6), z: c.z + xr.range(-9, 9), yaw: fp, s: xr.range(0.95, 1.15), ph: xr(), v: 1, w: R * xr.range(0.8, 1.2) }); });
      await ctx.yield();
      farMat = makeLit(U, { ...birdLook, float: true, deform: DUCK_FAR });
      scene.add(instanced(duckFarGeo(), farMat, farD, 'ducks-far')); }
    await ctx.yield();
    // everything carried with the camera lives under ONE group (hidden while we are only seen through a portal)
    const rideGroup = new THREE.Group(); rideGroup.name = 'ride'; rideGroup.matrixAutoUpdate = false; scene.add(rideGroup);
    const escMat = makeLit(U, { ...birdLook, deform: flyDeform });
    escMat.uniforms.uAct.value.z = TAU * 4;
    const escorts = instanced(duckFlyGeo(true), escMat, [[-2.3, 0.9, -8.6], [2.1, 0.5, -8.1], [-0.9, 1.9, -10.6], [1.6, 2.3, -11.6]].map((q) => ({ x: q[0], y: q[1], z: q[2], yaw: Math.PI, s: 1, ph: rng(), v: 2 })), 'escorts');
    // (polish 1) our own wingtips are gone from the picture: what we ride is told by the flockmates ahead and the beat of the flight
    rideGroup.add(escorts); rideGroup.visible = false;
    await ctx.yield();
    // ---- the squall: a slate cell out to sea, toward the sun from the arc of leg D, trailing a slanting rain veil the low sun burns through
    // (review 3: one tall sheet, cloud above and rain below; on drizzle mornings the same sheet, grey, stands as rain shafts round the bay)
    const drz = moodName === 'drizzle', sl2 = Math.hypot(sunDir.x, sunDir.z) || 1, sx2 = sunDir.x / sl2, sz2 = sunDir.z / sl2,
      veilC = new THREE.Vector3(lay.c1[0] + sx2 * 380 + sz2 * 250, 0, lay.c1[2] + sz2 * 380 - sx2 * 250);   // out to sea, left of the sun as leg C sees it
    const veilMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uK: { value: 0 }, uSun: { value: sunDir }, uCol: { value: drz ? col('#6F797E').multiplyScalar(0.62) : col(PAL[4]).multiplyScalar(0.55) },
        uGold: { value: drz ? col('#9AA2A2').multiplyScalar(0.8) : sunCol.clone().multiplyScalar(0.55) }, uTop: { value: drz ? col('#8E979A') : col('#E9D9B4') }, uCam: U.uCamL },
      vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform float uTime, uK; uniform vec3 uSun, uCol, uGold, uTop, uCam; varying vec2 vUv; varying vec3 vW;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main(){ float x = clamp(vUv.x, 0., 1.), y = clamp(vUv.y, 0., 1.);
          vec2 q = vec2(x * 54. + y * 15., y * 3.4 + uTime * 0.25);
          float st = 0.55 * vn(q) + 0.45 * vn(q * vec2(2.7, 1.) + 9.);                                     // slanting streaks, falling
          float envX = smoothstep(0., 0.2, x) * smoothstep(1., 0.8, x);
          float bank = 0.6 + 0.4 * vn(vec2(x * 5. + uTime * 0.02, 3.));
          float rainA = envX * smoothstep(0.68, 0.5, y) * (0.35 + 0.65 * smoothstep(0., 0.35, y)) * bank * (0.4 + 0.6 * st) * uK;
          float cn = 0.6 * vn(vec2(x * 4.3 + uTime * 0.008, y * 5.5)) + 0.4 * vn(vec2(x * 12., y * 14. + 3.));
          float dome = 1. - abs(x - 0.5) * 2.;                                                              // the cell: flat dark belly, heaped top
          float cellA = 0.3 * smoothstep(0.08, 0.3, x) * smoothstep(0.92, 0.7, x) * smoothstep(0.47, 0.58, y + (cn - 0.5) * 0.06) * (1. - smoothstep(0.62 + 0.3 * dome, 0.72 + 0.3 * dome, y + (cn - 0.5) * 0.3));
          vec3 V = normalize(vW - uCam + vec3(0., 1e-3, 0.)); float toSun = max(dot(V, uSun), 0.); toSun *= toSun; toSun *= toSun;
          vec3 rainC = mix(uCol, uGold, clamp(toSun * (0.35 + 0.9 * st), 0., 1.));
          vec3 cellC = mix(uCol * 0.85, uTop, smoothstep(0.66, 1.0, y + (cn - 0.5) * 0.25) * (0.3 + 0.6 * cn)) + uGold * toSun * 0.1;
          float aR = clamp(rainA, 0., 0.9), aC = cellA * 0.93, al = max(aR, aC);
          gl_FragColor = vec4(mix(rainC, cellC, aC / max(aR + aC, 1e-3)), al); }` });
    const veilGeo = new THREE.PlaneGeometry(340, 270);
    const mkVeil = (x, z, yaw, sc, name) => { const m = new THREE.Mesh(veilGeo, veilMat); m.position.set(x, 132 * sc, z); m.scale.setScalar(sc); m.rotation.y = yaw; m.renderOrder = 4; m.frustumCulled = false; m.name = name; scene.add(m); return m; };
    const veil = mkVeil(veilC.x, veilC.z, Math.atan2(lay.c1[0] - veilC.x, lay.c1[2] - veilC.z), 0.8, 'rain-veil');
    // drizzle mornings: two more shafts stand out to sea, north and north-west of the bay (made on every morning, shown only on those)
    { const bay = [lay.c1[0], lay.c1[2]], face = (x, z) => Math.atan2(bay[0] - x, bay[1] - z);      // each shaft faces the bay, so the route never sees one edge-on
      const n1 = mkVeil(bay[0] - 170, bay[1] + 340, face(bay[0] - 170, bay[1] + 340), 0.8, 'rain-shaft-1'), n2 = mkVeil(bay[0] + 330, bay[1] + 190, face(bay[0] + 330, bay[1] + 190), 0.75, 'rain-shaft-2'); n1.visible = n2.visible = drz; }
    // warm drizzle in the air (drizzle mornings only): short falling streaks wrapped in a box that follows the eye
    { const NR = moodName === 'drizzle' ? Math.round(1700 * detail) : 1, rA = new Float32Array(NR * 4);
      for (let i = 0; i < NR; i++) rA.set([rng(), rng(), rng(), rng()], i * 4);
      const rg = new THREE.InstancedBufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); rg.setIndex([0, 1, 2, 0, 2, 3]);
      rg.setAttribute('iA', new THREE.InstancedBufferAttribute(rA, 4)); rg.instanceCount = NR;
      const rainMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { uTime: U.uTime, uCamL: U.uCamL, uCol: { value: col('#E4E6DE') } },
        vertexShader: /* glsl */`uniform float uTime; uniform vec3 uCamL; attribute vec4 iA; varying float vA;
          void main(){ vec3 box = vec3(26., 12., 26.);
            vec3 sp = iA.xyz * box; sp.y -= uTime * (7. + 3. * iA.w); sp.x += uTime * 0.8;
            vec3 w = mod(sp - uCamL + box * 0.5, box) - box * 0.5;                       // wrapped round the eye
            vec3 pw = uCamL + w + vec3(0.16, 1., 0.05) * (position.y * (0.1 + 0.09 * iA.w));
            vec4 mv = viewMatrix * vec4(pw, 1.); float d = max(-mv.z, 0.1);
            mv.x += position.x * max(0.004, 0.0016 * d);                                 // never thinner than about 1.5 pixels
            vA = smoothstep(0.6, 2.5, d) * (1. - smoothstep(9., 13., length(w))) * (0.5 + 0.5 * iA.w);
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; varying float vA; void main(){ gl_FragColor = vec4(uCol * 0.7, 0.1 * vA); }` });
      const rainM = new THREE.Mesh(rg, rainMat); rainM.frustumCulled = false; rainM.renderOrder = 5; rainM.name = 'drizzle'; rainM.visible = moodName === 'drizzle'; scene.add(rainM); }
    await ctx.yield();
    let clouds = null;
    if (moodName !== 'drizzle') {
      clouds = makeCloudField({ rng, sky, fogFade: 0.3, puffs: 34, opacity: 0.9, wind: [1.2, 0, 0.5],
        at: [[veilC.x - 60, 215, veilC.z + 20, 300], [-250, 120, 420, 210], [90, 135, 520, 240], [-470, 110, 190, 190]] });
      scene.add(clouds.object);
    }
    await ctx.yield();
    // ---- (polish 3) MIST LYING IN BANDS, and the low sun's shafts through it: wide low sheets that turn to face the eye, standing on the
    // water between the boles of the drowned forest and far out on the lawn. Each is soft, streaked along its length and never nearer
    // the lens than 9 m (it fades out), so it is always a band of lit air behind something, never a blob in front. Where a band lies
    // between us and the sun it carries rays fanning from the sun's place in the sky.
    { const mr = rng.fork('mist'), list = [], put = (p, y, w, h, a) => list.push({ x: p.x, y, z: p.z, w, h, ph: mr(), a });
      for (let uu = uC1 - 0.05, k = 0; uu < 0.99; uu += 7.5 / L, k++) for (const sd of [-1, 1]) {
        const lat = mr.range(11, 44), p = at(uu, sd * lat, mr.range(-4, 4)); if (path.nearestXZ(p.x, p.z).dist < 10) continue;
        put(p, mr.range(0.0, 1.2), mr.range(24, 44), mr.range(3, 6), mr.range(0.16, 0.26)); }
      for (let k = 0; k < 9; k++) { const p = at(mr.range(0.0, 0.12), (k % 2 ? 1 : -1) * mr.range(14, 60), mr.range(-10, 30)); put(p, mr.range(0.1, 1.0), mr.range(24, 40), mr.range(2, 3.4), mr.range(0.2, 0.32)); }
      for (let k = 0; k < 26; k++) { const uu = mr.range(0.1, 0.62), sd = k % 3 === 0 ? 1 : -1, p = at(uu, sd * mr.range(55, 230), mr.range(-30, 60));      // far bands out on the sea, most of them toward the sun
        put(p, mr.range(0.2, 2.5), mr.range(70, 150), mr.range(3, 6.5), mr.range(0.2, 0.34)); }
      const mg = new THREE.InstancedBufferGeometry(), n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      list.forEach((m, i) => { iA.set([m.x, m.y, m.z, m.w], i * 4); iB.set([m.h, m.ph, 0, m.a], i * 4); });
      mg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); mg.setIndex([0, 1, 2, 0, 2, 3]);
      mg.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); mg.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); mg.instanceCount = n;
      const mistMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
        uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uMist: { value: col(M.hor).lerp(col(M.zen), 0.25).multiplyScalar(drz ? 0.6 : 0.78) }, uGold: { value: sunCol.clone().multiplyScalar(drz ? 0 : moodName === 'noon' ? 0.25 : 0.6) }, uK: { value: moodName === 'noon' ? 0.55 : 1 } },
        vertexShader: /* glsl */`uniform vec3 uSunDir; attribute vec4 iA, iB; varying vec2 vUv; varying vec3 vW, vClip, vSunC; varying vec4 vI; varying float vAsp;
          void main(){ vec3 c = iA.xyz; vec2 tc = cameraPosition.xz - c.xz; vec2 r = normalize(vec2(tc.y, -tc.x) + vec2(1e-4, 0.));
            vec3 w = c + vec3(r.x, 0., r.y) * (position.x * iA.w) + vec3(0., position.y * iB.x, 0.);
            vUv = vec2(position.x + 0.5, position.y); vW = w; vI = vec4(iA.w, iB.x, iB.y, iB.w);
            vec4 cp = projectionMatrix * viewMatrix * vec4(w, 1.); vClip = cp.xyw;
            vec4 sc = projectionMatrix * viewMatrix * vec4(cameraPosition + uSunDir * 900., 1.); vSunC = sc.xyw;
            vAsp = projectionMatrix[1][1] / max(projectionMatrix[0][0], 1e-4); gl_Position = cp; }`,
        fragmentShader: /* glsl */`uniform float uTime, uK; uniform vec3 uMist, uGold; varying vec2 vUv; varying vec3 vW, vClip, vSunC; varying vec4 vI; varying float vAsp;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
          void main(){ float x = clamp(vUv.x, 0., 1.), y = clamp(vUv.y, 0., 1.), wd = clamp(vI.x, 1., 400.), ph = clamp(vI.z, 0., 1.);
            float n = 0.6 * vn(vec2(x * wd * 0.11 + ph * 37. + uTime * 0.02, y * 2.2 + ph * 3.)) + 0.4 * vn(vec2(x * wd * 0.37 - uTime * 0.03, y * 5. + 7. + ph * 11.));
            float env = smoothstep(0., 0.3, x) * smoothstep(1., 0.7, x) * smoothstep(0., 0.22, y) * smoothstep(1., 0.12 + 0.3 * n, y);
            float d = clamp(length(vW - cameraPosition), 0., 2000.);
            float a = env * smoothstep(0.2, 0.7, n) * smoothstep(14., 48., d) * (1. - smoothstep(300., 520., d)) * clamp(vI.w, 0., 1.) * uK;
            vec2 ndc = clamp(vClip.xy / max(vClip.z, 1e-3), -4., 4.), sn = clamp(vSunC.xy / max(abs(vSunC.z), 1e-3), -4., 4.);
            vec2 dd = (ndc - sn) * vec2(clamp(vAsp, 0.2, 5.), 1.); float rr = clamp(length(dd), 0., 8.);
            float ang = atan(dd.y, abs(dd.x) + 1e-4);
            float ray = smoothstep(0.42, 0.8, 0.6 * vn(vec2(ang * 9., 1.5)) + 0.4 * vn(vec2(ang * 23., 5.5)));
            float sunK = step(0., vSunC.z) * exp(-rr * 1.5);
            vec3 c = uMist + uGold * (sunK * (0.3 + 1.0 * ray));
            a *= 1. + 1.3 * sunK * ray;
            gl_FragColor = vec4(min(c, vec3(2.5)), clamp(a, 0., 0.62)); }` });
      const mist = new THREE.Mesh(mg, mistMat); mist.frustumCulled = false; mist.renderOrder = 3; mist.name = 'mist-bands'; scene.add(mist); }
    await ctx.yield();
    // ---- low forested hills behind us in blue haze (south), no snow anywhere
    { const g = new F.Geo(), c0 = C3('#3E5E56', 0.55), c1 = C3('#56786A', 0.6), N = 72, top = [], bot = [];
      for (let i = 0; i <= N; i++) { const a = lerp(-0.25, 2.6, i / N), R = 600 + 60 * ctx.noise.n2(i * 0.11, 3), x = Math.cos(a - 1.9) * R, z = 25 + Math.sin(a - 1.9) * R;
        const h = (24 + 46 * (0.5 + 0.5 * ctx.noise.fbm2(i * 0.09, 7, 3)) + 5 * ctx.noise.n2(i * 0.9, 1)) * smoothstep(0, 0.12, i / N) * smoothstep(1, 0.88, i / N);
        top.push([x, h, z]); bot.push([x, -2, z]); }
      g.strip(top, bot, c1, c0);
      scene.add(instanced(g.build(), makeLit(U, { key: 0.2, fill: 0.9, rim: 0 }), [{ x: 0, y: 0, z: 0 }], 'hills')); }
    await ctx.yield();
    // ---- the rare event: a gust opens a lead of black water right across the bay, and it zips shut as we cross it
    const uLeadX = uGap, leadP = path.pointAt(uLeadX), lt = path.tangentAt(uLeadX), la0 = Math.atan2(lt.z, lt.x) + Math.PI / 2 + 0.3;
    seaU.uLead.value.set(leadP.x, leadP.z, Math.cos(la0), Math.sin(la0));
    const shelfAt = shelfList.map((a) => [a.x, a.z, Math.sin(a.yaw), Math.cos(a.yaw)]), gaze = new THREE.Vector3(), gaze2 = new THREE.Vector3(), camS = new THREE.Vector3(), camP = new THREE.Vector3(), g0 = new THREE.Vector3(gast[0].x, 1.5, gast[0].z);
    const squallV = new THREE.Vector3(veilC.x, 34, veilC.z - 50), laneP = { x: logP.x - Math.sin(logYaw) * 13 + Math.cos(logYaw) * 1.5, z: logP.z - Math.cos(logYaw) * 13 - Math.sin(logYaw) * 1.5 };   // (polish 3) the black water the drifting trunk has torn along its flank
    seaU.uRustAt.value.set(at(uEnd, -50, 25).x, at(uEnd, -50, 25).z, 95, 0.04);
    const rainC = at(uEnd, -45, 25), exitFam = new THREE.Vector3(exitList[0].x, 1.2, exitList[0].z), shelfV = new THREE.Vector3(shelfList[0].x, 1.0, shelfList[0].z), logV = new THREE.Vector3(logP.x, 0.6, logP.z);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();
    const sinkAt = (u) => smoothstep(uShelf - 2.5 / L, uShelf + 6 / L, u), shelfG = new THREE.Vector3(), cowTear = new THREE.Vector3();
    // the first crest's clock (see CREST): the phase offset that puts its top where the journey wants it
    const sw1 = U.uSw1.value, swW = U.uSwW.value.x; let swPh = 0;
    const plateau = (u, a, b, w) => smoothstep(a - w, a + w, u) * (1 - smoothstep(b - w, b + w, u));
    return {
      scene, path, duration: DUR, title: 'The Green Arctic Sea · 49 million years ago', ride: 'none', companion: 'none', style: 'none',
      pace: (u) => 1.08 - 0.52 * plateau(u, uShelf - 0.028, uShelf + 0.012, 0.012) + 0.1 * plateau(u, 0.13, uC0, 0.03) - 0.34 * plateau(u, uBull - 0.03, uEnd, 0.04) - 0.12 * plateau(u, uC1 + 0.03, uD1, 0.04),
      camera: { fov: 52, near: 0.3, far: 1200, lookAhead: 20, sway: 0.4, bank: 0.15, nearThrough: 0.3 },
      pois: [
        { at: (time, u) => { const k = sinkAt(u), w = WALK * k * k; return shelfG.set(shelfV.x + shelfAt[0][2] * w, lerp(1.0, 0.75, k), shelfV.z + shelfAt[0][3] * w); }, from: uShelf - 0.075, to: uShelf + 0.02, weight: 0.85, fade: 0.25 },
        { at: g0, from: uGast - 0.05, to: uGast + 0.008, weight: 0.6 },
        // leg C: first the bull as we cross his bows, then the gaze rides out along the line of waders toward the sun, 16 m ahead of us
        { at: (time, u) => gaze2.set(-4.0, 0.9, herdD(u) + 0.6), from: uC0 - 0.05, to: uBull + 0.012, weight: 0.8, fade: 0.3 },
        { at: (time, u) => { path.pointAt(u, camS); const sA = (camS.x - WING.o[0]) * lay.ech[0] + (camS.z - herdD(u) - WING.o[1]) * lay.ech[1] - 6.5 - 3.4 * Math.max(0, camS.y - 1.3); return gaze.set(WING.o[0] + lay.ech[0] * sA, 0.6, herdD(u) + WING.o[1] + lay.ech[1] * sA); }, from: uBull - 0.012, to: uEnd - 0.01, weight: 0.85, fade: 0.12 },
        { at: logV, from: uLog - 0.07, to: uLog + 0.004, weight: 0.6 },
        { at: exitFam, from: uFam - 0.06, to: uFam + 0.022, weight: 0.7, fade: 0.3 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#CFEFE2', glow: 1, revealDistance: 190 },
      post: { exposure: M.exposure, bloom: { strength: 0.4, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.06, tint: M.tint, shadowTint: M.shadowTint, vignette: 0.15, grain: 0 } },
      update(dt, time, camera, u) {
        // scripted beats are keyed to u; the swell, wing beats, wind and breath run on the clock
        hero.setProgress(u);
        if (u <= CREST.free) { const sc = CREST.s + CREST.c * (CREST.u - u), ph = sw1.z * (sw1.x * (S0.x + N2[0] * sc) + sw1.y * (S0.z + N2[1] * sc)) - Math.PI / 2 - swW * time + 0.3 * Math.sin(time * 0.5) * (1 - smoothstep(0, 0.012, u));
          swPh = ph - TAU * Math.floor(ph / TAU); }
        U.uSwPh.value = swPh;
        const sink = sinkAt(u) * (1 - smoothstep(0.5, 0.55, u));   // the shelf pair step off and sink through the lawn beside us
        U.uSink.value = sink; U.uLift.value = smoothstep(uWave - 0.09, uWave - 0.01, u);
        const ring = smoothstep(0.08, 0.3, sink) * (0.6 + 1.15 * smoothstep(0.45, 1, sink));          // a hole opens round the forefeet as they go through, then round the whole animal
        { const a = shelfAt[0], w = WALK * sink * sink + 0.55 - 0.3 * smoothstep(0.5, 1, sink); hero.setTear(0, a[0] + a[2] * w, a[1] + a[3] * w, ring);
          const ws = WALK * sink * sink; shadV[0].set(a[0] + a[2] * ws, a[1] + a[3] * ws, 0.5 * (1 - 0.6 * sink), shadV[0].w); }
        { const E = smoothstep(0.078, 0.114, u) * (1 - smoothstep(0.5, 0.55, u)), w = COW_WALK * E, cx = cowA.x + Math.sin(cowA.yaw) * w, cz = cowA.z + Math.cos(cowA.yaw) * w;
          let gy = bankY(sb, cx, cz); if (gy < 0) gy *= 2.6; const sk = smoothstep(0.05, -0.75, gy);      // 0 on the mud .. 1 chest-deep (the shader walks her down the same slope)
          UC.uWalk.value = w; UC.uSink.value = sk;
          const rg = smoothstep(0.08, 0.3, sk) * (0.6 + 1.1 * smoothstep(0.45, 1, sk));
          cowTear.set(cx + Math.sin(cowA.yaw) * 0.45, cz + Math.cos(cowA.yaw) * 0.45, rg); shadV[1].set(cx, cz, 0.42 * (1 - 0.6 * sk), shadV[1].w); }
        camP.setFromMatrixPosition(camera.matrixWorld);
        { const e = camera.matrixWorld.elements, fx = camP.x - e[8] * 9, fz = camP.z - e[10] * 9; reflD.fill(1e12);
          for (let i = 0; i < trees.length; i++) { const t = trees[i], d = (t.x - fx) * (t.x - fx) + (t.z - fz) * (t.z - fz); if (d >= reflD[7]) continue;
            let k = 7; while (k > 0 && reflD[k - 1] > d) { reflD[k] = reflD[k - 1]; reflI[k] = reflI[k - 1]; k--; } reflD[k] = d; reflI[k] = i; }
          for (let i = 0; i < 8; i++) { const t = trees[reflI[i]]; seaU.uRefl.value[i].set(t.x, t.z, 1.5 * t.s, (t.kind ? 16 : 30) * t.s); } }
        if (M.rain > 0) seaU.uRain.value.set(camP.x, camP.z, 420, 0.42);                                    // drizzle: the whole sea freckled
        else seaU.uRain.value.set(rainC.x, rainC.z, 70, 0.5 * smoothstep(uGap, uGap + 0.08, u) * (1 - smoothstep(uD1 - 0.04, uD1 + 0.04, u)));
        for (let i = 0; i < landers.length; i++) { const l = landers[i]; hero.setTear(1 + i, l.x, l.z, 1.1 * smoothstep(l.ut - 0.003, l.ut + 0.004, u) * (1 - smoothstep(l.ut + 0.05, l.ut + 0.11, u))); }
        if (u < 0.3) hero.setTear(7, cowTear.x, cowTear.y, cowTear.z);                                      // the cow's own ring (the last lander's hole, far later in the flight, shares the slot)
        if (u > 0.56) { seaU.uLead.value.set(laneP.x, laneP.z, Math.sin(logYaw), Math.cos(logYaw)); seaU.uLeadB.value.set(1.3, 0, 27, 0); }      // the last healing lane, toward the ring
        else { seaU.uLead.value.set(leadP.x, leadP.z, Math.cos(la0), Math.sin(la0)); if (!rare) seaU.uLeadB.value.set(-1000, 0, 0, 0); }
        if (rare && u <= 0.56) {                                                                            // the lead opens with the gust, then zips shut from one end
          const open = smoothstep(uLeadX - 0.16, uLeadX - 0.07, u), shut = smoothstep(uLeadX - 0.012, uLeadX + 0.06, u);
          seaU.uLeadB.value.set(open > 0 && shut < 1 ? 10 : -1000, lerp(-230, 230, shut), lerp(-230, 230, open), 0);
        }
        hero.object.position.set(0, 0, herdD(u));
        hero.update(dt, time, camera, u * DUR);
        sky.update(dt, time, camera);
        if (clouds) clouds.update(dt, time, camera);
        flyMat.uniforms.uAct.value.x = u; sitMat.uniforms.uAct.value.x = u; escMat.uniforms.uAct.value.x = u; farMat.uniforms.uAct.value.x = u;
        escMat.uniforms.uAct.value.w = 1.5 * plateau(u, 0.028, 0.085, 0.014);        // the flockmates lift over the first crest while we skim under them
        const alert = smoothstep(uGast - 0.07, uGast - 0.03, u) * (1 - smoothstep(uGast + 0.06, uGast + 0.12, u));
        gastMat.uniforms.uAct.value.set(alert, clamp(Math.atan2(camP.x - g0.x, camP.z - g0.z) - gast[0].yaw, -1.1, 1.1), 0, 0);
        veilMat.uniforms.uK.value = drz ? 0.8 : moodName === 'noon' ? 0.22 : 0.55;
        veil.position.z = veilC.z + 14 * Math.sin(time * 0.05);
        // our own bird: hidden while this world is only a picture inside the previous portal
        rideGroup.visible = u > 0 && !ctx.through;
        rideGroup.matrix.copy(camera.matrixWorld); rideGroup.matrixWorldNeedsUpdate = true;
      },
      dispose() { if (sky.dispose) sky.dispose(); },

    };




  },
};
