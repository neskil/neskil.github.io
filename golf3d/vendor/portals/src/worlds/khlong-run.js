// THE KHLONG RUN. Golden hour in old Bangkok from the garlanded prow of a long-tail boat: 345 m of canal between
// teak stilt houses, washing lines and footbridges, then out through its mouth onto the great river, straight at a
// porcelain-crusted temple spire (the hero, src/parts/khlong-run.js) with a thunderhead standing off to the right.
// World space is the hero's: origin = prang centre at water level, +X east, the camera travels -Z (north);
// N (metres north of the entry) = 690 - z. The canal runs N 0..345, the river z 345..78, the portal stands at z = 86.
// Looks by seed / ctx.vary.hour: golden (default), storm-passed (washed clear air, the cloud nearer with rain shafts),
// dawn (sun behind and to the right, mist, mackerel sky, alms boats), festival night (two thousand floating candles,
// string lights, sky lanterns, the prang floodlit). Rare event: a procession of gilded royal barges crossing the river.
// The open river is a water avenue: two rows of banner poles and tiered umbrellas on the temple's axis, strings of pennants from
// pole to pole, salas on piles and knots of vendor boats, all mirrored in a river that runs from deep bronze to luminous gold.
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as S from '../kit/structures.js';
import { buildHero, makeAcc, tri, quad, quadO, box, spike, place, hall, clothStrip, mul, mix3 } from '../parts/khlong-run.js';

const TAU = Math.PI * 2, Z0 = 690, MOUTH = 345;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mixn = (a, b, t) => a + (b - a) * t;
const bell = (x, c, w) => { const t = (x - c) / w; return Math.exp(-t * t); };
const s2 = (t) => { const s = Math.sin(Math.PI * sat(t)); return s * s; };
const PALETTE = ['#5A3A22', '#4F5B3C', '#FFC76B', '#F3EEDF', '#D8622A', '#2E6B4C', '#494A6E'];
const _col = new THREE.Color();
const L = (h, k = 1) => { _col.set(h); return [_col.r * k, _col.g * k, _col.b * k]; };

// ---------- the canal's plan (also written into the shaders: keep the two in step) ----------
const canalX = (n) => 11 * s2((n - 48) / 145) - 11 * s2((n - 193) / 145);
const canalDX = (n) => (canalX(n + 0.5) - canalX(n - 0.5));
const canalHW = (n) => 4.5 + 3.5 * (1 - sstep(8, 30, n)) + 2.5 * sstep(160, 172, n) * (1 - sstep(208, 222, n));
// the boat's line: swerves round the vendor boats, slaloms the market, clears the rice barge, arcs on the river
const swerve = (n) => 1.25 * bell(n, 85, 13) - 1.25 * bell(n, 130, 13) + 1.5 * Math.sin((n - 166) / 34 * TAU) * sstep(160, 170, n) * (1 - sstep(204, 216, n))
  - 1.5 * bell(n, 302, 17) - 5 * s2((n - 405) / 125);
const BRIDGES = [
  { n: 60, type: 'flat', soffit: 3.8 }, { n: 100, type: 'flat', soffit: 4.0 }, { n: 145, type: 'hump', soffit: 4.3 },
  { n: 190, type: 'flat', soffit: 3.5 }, { n: 228, type: 'hump', soffit: 4.2 }, { n: 262, type: 'arch', soffit: 4.1 },
  { n: 320, type: 'roofed', soffit: 3.9 }, { n: 343, type: 'hump', soffit: 4.4 },
];
const SLUICE_N = 281, BARGE_N = 302;
const GLSL_PLAN = /* glsl */`
  float kS2(float t){ float s = sin(3.14159265 * clamp(t, 0., 1.)); return s * s; }
  float cxOf(float n){ return 11. * kS2((n - 48.) / 145.) - 11. * kS2((n - 193.) / 145.); }
  float hwOf(float n){ return 4.5 + 3.5 * (1. - smoothstep(8., 30., n)) + 2.5 * smoothstep(160., 172., n) * (1. - smoothstep(208., 222., n)); }
  float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float h31(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
  // shade of the sun-side bank over the canal: gaps in that bank let bars of light through (uBar row 0)
  uniform sampler2D uBar; uniform vec4 uSunK;       // side (+1 sun in the west), dN per metre across, tan(elevation), strength
  float canalShade(vec3 p){
    float n = 690. - p.z;
    float zone = smoothstep(-70., -50., n) * (1. - smoothstep(350., 370., n));
    float cxn = cxOf(n), hwn = hwOf(n);
    float d = uSunK.x > 0. ? p.x - (cxn - hwn - 1.6) : (cxn + hwn + 1.6) - p.x;
    vec4 t = texture2D(uBar, vec2((n - uSunK.y * d + 70.) / 450., .125));
    float gap = uSunK.x > 0. ? t.r : t.a, hgt = (uSunK.x > 0. ? t.g : t.b) * 16.;
    float ys = hgt - d * uSunK.z;
    return zone * uSunK.w * (1. - gap) * (1. - smoothstep(ys - .45, ys + .45, p.y)) * smoothstep(.2, 1.6, d);
  }
`;

// ---------- looks ----------
const LOOKS = {
  golden: {
    title: 'The Khlong Run', sunAz: 255, sunEl: 13,
    sky: { preset: 'goldenHour', zenith: '#3f6fae', mid: '#8fa9c4', horizon: '#FFC76B', ground: '#5c5836', horizonPow: 3.0, scatterColor: '#ffae52', scatter: 0.85, scatterPow: 4,
      sunColor: '#ffe0a0', sunSize: 1.6, sunIntensity: 11, sunGlow: 0.9, clouds: { coverage: 0.3, scale: 1.25, lit: '#ffe2b4', shade: '#a98478', opacity: 0.8, haze: 0.5 },
      clouds2: { coverage: 0.4, stretch: 1, opacity: 0.35, lit: '#fff0d2', shade: '#d6a98c' }, lightColor: '#ffc27a', lightIntensity: 3.3, ambientColor: '#8fa6d8', groundLight: '#7a6c44', ambientIntensity: 1.25 },
    fog: '#f0be82', density: 0.00095, sun: '#ffc070', sunK: 2.25, skyFill: '#a6aecb', fillK: 1.15, gnd: '#9a7646', gndK: 1.0, bounce: '#cf9f5c', bars: 1,
    waterDeep: '#3d4526', riverDeep: '#474322', brass: '#f0a240', glint: 0.9, cloud: 1, cloudNear: 1, night: 0, wet: 0, mist: 0, exposure: 1.0,
    // the river's own mirror ramp (bright gold at the horizon, bronze, then slate where a facet looks up) and the gains of its brass: without
    // them gold and sky blue average to a pale cream sheet; with them the near water is deep and the far water luminous
    ramp: ['#f2a84e', '#8a6a34', '#3c466c'], rivK: [1, 0.8, 0.5, 0.46], mirror: { k: [1.0, 0.42, 1.0], gold: ['#fff2cc', 1.8] },
    grade: { saturation: 1.1, contrast: 1.06, tint: '#fff6e6', shadowTint: '#0a0c1c' }, portal: '#ffd68a', spray: '#fff0cc', motes: '#ffd890',
  },
  storm: {
    title: 'The Khlong Run, After the Rain', sunAz: 252, sunEl: 17,
    sky: { preset: 'goldenHour', zenith: '#2f66b4', mid: '#7fa6d4', horizon: '#f6d49a', ground: '#4f5638', horizonPow: 3.6, scatterColor: '#ffbe6a', scatter: 0.7, scatterPow: 5,
      sunColor: '#fff0c4', sunSize: 1.4, sunIntensity: 12, sunGlow: 0.6, clouds: { coverage: 0.36, scale: 1.1, lit: '#fff0d4', shade: '#76749a', opacity: 0.9, haze: 0.4 },
      clouds2: false, lightColor: '#ffd9a0', lightIntensity: 3.4, ambientColor: '#86a8e6', groundLight: '#6c6c48', ambientIntensity: 1.25 },
    fog: '#e6cfa6', density: 0.00062, sun: '#ffd08a', sunK: 2.2, skyFill: '#9fb0d2', fillK: 1.2, gnd: '#7a7a4c', gndK: 1.0, bounce: '#b88a46', bars: 1,
    waterDeep: '#34422a', riverDeep: '#3a4428', brass: '#e2a850', glint: 0.95, cloud: 1, cloudNear: 1.7, night: 0, wet: 1, mist: 0, exposure: 0.98,
    ramp: ['#e9c27a', '#7c7a44', '#2e4f86'], rivK: [1, 0.9, 0.6, 0.44], mirror: { k: [1.0, 0.42, 1.0], gold: ['#fff2cc', 1.8] },
    grade: { saturation: 1.16, contrast: 1.08, tint: '#fbf8f0', shadowTint: '#081020' }, portal: '#ffe0a0', spray: '#ffffff', motes: '#fff0c0',
  },
  dawn: {
    title: 'The Khlong Run at First Light', sunAz: 108, sunEl: 9,
    sky: { preset: 'dawn', zenith: '#3a5c9c', mid: '#93a2c8', horizon: '#f6c2a8', ground: '#5c5c50', horizonPow: 3.0, scatterColor: '#ffc48e', scatter: 0.7, scatterPow: 4,
      sunColor: '#ffdcb4', sunSize: 1.7, sunIntensity: 11, sunGlow: 0.8, stars: 0,
      clouds: { coverage: 0.56, scale: 2.6, softness: 0.2, lit: '#ffd9c8', shade: '#8f8cb4', opacity: 0.78, detail: 0.3, haze: 0.35 }, clouds2: false,
      lightColor: '#ffc8a0', lightIntensity: 2.8, ambientColor: '#93a4d8', groundLight: '#6c6468', ambientIntensity: 1.35 },
    fog: '#e8c4b4', density: 0.0013, sun: '#ffb884', sunK: 2.1, skyFill: '#a8a8c8', fillK: 1.15, gnd: '#8a7868', gndK: 1.0, bounce: '#c8907a', bars: 0.85,
    waterDeep: '#3c4638', riverDeep: '#4a4466', brass: '#ffb690', glint: 1.05, mirrorHor: '#ffe0c8', scatK: 0.95, cloud: 0, cloudNear: 1, night: 0, wet: 0.3, mist: 1, exposure: 1.02,
    ramp: ['#f4c9b4', '#9c8494', '#4a5278'], rivK: [1, 0.9, 0.7, 0.42],
    grade: { saturation: 1.04, contrast: 1.04, tint: '#fff2ee', shadowTint: '#0c1024' }, portal: '#ffd2b0', spray: '#fff0e8', motes: '#ffe0c8',
  },
  night: {
    title: 'The Khlong Run, Festival of Floating Candles', sunAz: 248, sunEl: 34,
    sky: { preset: 'night', zenith: '#040a1c', mid: '#0c1c40', horizon: '#1c3462', ground: '#08101c', bodies: [{ elevation: 34, azimuth: 248, size: 2.3, phase: 1, intensity: 1.0, dark: 0.03, glow: 0.2, glowColor: '#a8c0ff' }], key: 0,
      milkyWay: 0.5, clouds: { coverage: 0.26, softness: 0.4, lit: '#8a9ed0', shade: '#18244a', opacity: 0.8 }, lightColor: '#a8c0ff', lightIntensity: 1.5, ambientColor: '#4a62a8', groundLight: '#3a2c20', ambientIntensity: 1.6 },
    fog: '#16284c', density: 0.0011, sun: '#9fb8ff', sunK: 0.5, skyFill: '#3a54a0', fillK: 0.6, gnd: '#4a3420', gndK: 0.6, bounce: '#3a2a1a', bars: 0.6,
    waterDeep: '#0a1420', riverDeep: '#101c30', brass: '#9fb8ff', glint: 0.5, cloud: 0, cloudNear: 1, night: 1, wet: 0.2, mist: 0, exposure: 1.25,
    grade: { saturation: 1.12, contrast: 1.05, tint: '#f4f4ff', shadowTint: '#04081a' }, portal: '#ffc880', spray: '#a8c0f0', motes: '#ffb060',
  },
};

// ---------- geometry helpers on top of the hero's accumulator ----------
const toGeo = (A) => {
  const g = new THREE.BufferGeometry(), n = A.count;
  g.setAttribute('position', new THREE.BufferAttribute(A.pos.slice(0, n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(A.nrm.slice(0, n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(A.col.slice(0, n * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(A.uv.slice(0, n * 2), 2));
  g.setAttribute('aMat', new THREE.BufferAttribute(A.mat.slice(0, n), 1));
  g.setAttribute('aSway', new THREE.BufferAttribute(A.sway.slice(0, n), 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  A.count = 0; A.uv.fill(0, 0, n * 2); A.sway.fill(0, 0, n); A.resetT();
  return g;
};
// everything emitted since `from` swings together (hanging baskets, parasols, cages): sway amount and phase
const setSway = (A, from, sw, phase) => { for (let i = from; i < A.count; i++) { A.sway[i] = sw; A.uv[i * 2] = phase; } };
// beam between two points (local space), w wide and h deep, four long faces
function beam(A, p, q, w, h, col, m) {
  const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], dl = Math.hypot(dx, dy, dz) || 1;
  let sx = dz, sy = 0, sz = -dx; let sl = Math.hypot(sx, sz);
  if (sl < 1e-4) { sx = 1; sz = 0; sl = 1; }
  sx *= w / 2 / sl; sz *= w / 2 / sl;
  const tx = (sy * dz - sz * dy) / dl, ty = (sz * dx - sx * dz) / dl, tz = (sx * dy - sy * dx) / dl, tl = Math.hypot(tx, ty, tz) || 1, k = h / 2 / tl;
  const ux = tx * k, uy = ty * k, uz = tz * k, c = [[1, 1], [-1, 1], [-1, -1], [1, -1]], mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4];
    quadO(A, [p[0] + sx * a[0] + ux * a[1], p[1] + uy * a[1], p[2] + sz * a[0] + uz * a[1]], [p[0] + sx * b[0] + ux * b[1], p[1] + uy * b[1], p[2] + sz * b[0] + uz * b[1]],
      [q[0] + sx * b[0] + ux * b[1], q[1] + uy * b[1], q[2] + sz * b[0] + uz * b[1]], [q[0] + sx * a[0] + ux * a[1], q[1] + uy * a[1], q[2] + sz * a[0] + uz * a[1]], mid, col, m);
  }
}
// eight-sided lathe: rings [[y, r], ...] centred on x,z
function lathe(A, x, y, z, rings, col, m, sides = 8, cap = true) {
  for (let k = 0; k < rings.length - 1; k++) {
    const [y0, r0] = rings[k], [y1, r1] = rings[k + 1], c0 = mul(col, 0.72 + 0.28 * k / (rings.length - 1)), c1 = mul(col, 0.72 + 0.28 * (k + 1) / (rings.length - 1));
    for (let i = 0; i < sides; i++) {
      const a = i / sides * TAU, b = (i + 1) / sides * TAU, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const p0 = [x + ca * r0, y + y0, z + sa * r0], p1 = [x + cb * r0, y + y0, z + sb * r0], p2 = [x + cb * r1, y + y1, z + sb * r1], p3 = [x + ca * r1, y + y1, z + sa * r1];
      if (r1 < 1e-3) tri(A, p0, p3, p1, c0, c1, c0, m); else if (r0 < 1e-3) tri(A, p0, p3, p2, c0, c1, c1, m); else quad(A, p0, p3, p2, p1, col, m, c0, c1, c1, c0);
    }
  }
  if (cap) { const [yt, rt] = rings[rings.length - 1]; if (rt > 1e-3) for (let i = 0; i < sides; i++) { const a = i / sides * TAU, b = (i + 1) / sides * TAU; tri(A, [x, y + yt, z], [x + Math.cos(b) * rt, y + yt, z + Math.sin(b) * rt], [x + Math.cos(a) * rt, y + yt, z + Math.sin(a) * rt], col, col, col, m); } }
}
const ball = (A, x, y, z, rad, col, m = 11, sides = 8) => lathe(A, x, y + rad, z, [[-rad, 0], [-rad * 0.7, rad * 0.72], [0, rad], [rad * 0.7, rad * 0.72], [rad, 0]], col, m, sides, false);
const ring = (A, x, y, z, R, rr, col, m = 11, sides = 12) => lathe(A, x, y, z, [[0, R], [rr, R + rr], [2 * rr, R], [rr, R - rr], [0, R]], col, m, sides, false);
// thin sagging line as a ribbon the shader keeps at least a pixel and a half wide (aMat 9, uv.y = side)
function wire(A, p, q, sag, segs, col) {
  let prev = null;
  for (let i = 0; i <= segs; i++) {
    const f = i / segs, c = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f - sag * 4 * f * (1 - f), p[2] + (q[2] - p[2]) * f];
    if (prev) quad(A, [prev[0], prev[1] - 0.012, prev[2]], [c[0], c[1] - 0.012, c[2]], [c[0], c[1] + 0.012, c[2]], [prev[0], prev[1] + 0.012, prev[2]], col, 9, null, null, null, null, [0, -1], [0, -1], [0, 1], [0, 1]);
    prev = c;
  }
}
const wireY = (p, q, sag, f) => p[1] + (q[1] - p[1]) * f - sag * 4 * f * (1 - f);
// a soft lump: a jittered bipyramid whose normals radiate from its middle, so it shades round (aMat 7 flowers, 11 fruit)
function blob(A, r, x, y, z, sx, sy, sz, c, m = 7) {
  const s0 = A.count, rot = r.range(0, TAU), j = () => r.range(0.8, 1.15), eq = [], ns = 5;
  for (let k = 0; k < ns; k++) { const a = rot + k * TAU / ns + r.range(-0.25, 0.25), q = j(); eq.push([x + Math.cos(a) * sx * q, y + r.range(-0.25, 0.25) * sy, z + Math.sin(a) * sz * q]); }
  const top = [x + r.range(-0.2, 0.2) * sx, y + sy * j() * 0.8, z + r.range(-0.2, 0.2) * sz], bot = [x, y - sy * j() * 0.7, z], hi = mul(c, 1.1), lo = mul(c, 0.68);
  for (let k = 0; k < ns; k++) { const p = eq[k], q = eq[(k + 1) % ns]; tri(A, p, top, q, c, hi, c, m); tri(A, q, bot, p, c, lo, c, m); }
  let cx = 0, cy = 0, cz = 0; const P = A.pos, N = A.nrm, n = A.count - s0;
  if (n <= 0) return;
  for (let i = s0; i < A.count; i++) { cx += P[i * 3]; cy += P[i * 3 + 1]; cz += P[i * 3 + 2]; }
  cx /= n; cy /= n; cz /= n;
  for (let i = s0; i < A.count; i++) { const dx = P[i * 3] - cx, dy = P[i * 3 + 1] - cy, dz = P[i * 3 + 2] - cz, l = Math.hypot(dx, dy, dz) || 1; N[i * 3] = dx / l; N[i * 3 + 1] = dy / l; N[i * 3 + 2] = dz / l; }
}
// an rng of its own for a prop at a place: props that were rebuilt draw from this, after running the draws of what they
// replace dry (A.count rewound), so that every seed keeps the town it had
const rngAt = (A, x, y, z, tag = '') => makeRng('k' + Math.round((A.tx + x) * 61) + ':' + Math.round(y * 67) + ':' + Math.round((A.tz + z) * 71) + tag);
// bracts and petals: n small bright triangles standing off a point at every angle, so the outline is ragged
function petals(A, r, x, y, z, rad, col, n, big = 1) {
  for (let i = 0; i < n; i++) {
    const a = r.range(0, TAU), e = r.range(-0.6, 1.3), ce = Math.cos(e), dx = Math.cos(a) * ce, dz = Math.sin(a) * ce;
    const px = x + dx * rad, py = y + Math.sin(e) * rad * 0.8, pz = z + dz * rad, sz = r.range(0.07, 0.125) * big, b = r.range(0, TAU), c = mul(col, r.range(0.95, 1.4));
    const ux = Math.cos(b) * sz, uy = r.range(-0.5, 0.5) * sz, uz = Math.sin(b) * sz, vx = -Math.sin(b) * sz * 0.6 + dx * sz * 0.6, vy = sz * r.range(0.4, 1.0), vz = Math.cos(b) * sz * 0.6 + dz * sz * 0.6;
    tri(A, [px - ux, py - uy, pz - uz], [px + ux, py + uy, pz + uz], [px + vx, py + vy, pz + vz], c, c, mul(c, 1.15), 7);
  }
}
// a mass of flowers and leaves: n lumps scattered through an ellipsoid, each its own shade and bristling with petals, some plain leaf
const LEAF_C = [0.07, 0.2, 0.05];
function clump(A, r, x, y, z, rx, ry, rz, col, n, o = {}) {
  const leaf = o.leaf ?? 0.25, pr = o.piece || [0.17, 0.27], m = o.m ?? 7, np = m === 7 ? (o.petals ?? 5) : 0;
  for (let i = 0; i < n; i++) {
    const a = r.range(0, TAU), rr = Math.sqrt(r()), h = r.range(-1, 1), sz = r.range(pr[0], pr[1]), isLeaf = r.chance(leaf);
    const px = x + Math.cos(a) * rr * rx, py = y + h * ry, pz = z + Math.sin(a) * rr * rz;
    if (isLeaf && m === 7) {   // a spray of leaves, not a lump
      const c0 = A.count; blob(A, r, px, py, pz, sz, sz * r.range(0.7, 1.0), sz, mul(LEAF_C, r.range(0.7, 1.3)), m); A.count = c0;
      const lr = rngAt(A, px, py, pz); petals(A, lr, px, py, pz, sz * 1.3, mul(LEAF_C, lr.range(0.8, 1.6)), lr.int(5, 6), Math.min(2.2, Math.max(1, sz / 0.1)));
      continue;
    }
    blob(A, r, px, py, pz, sz, sz * r.range(0.7, 1.0), sz, isLeaf ? mul(LEAF_C, r.range(0.7, 1.3)) : mul(col, r.range(0.62, 0.95) * (np ? 1 : 1.25)), m);
    if (np && !isLeaf) petals(A, r, px, py, pz, sz * 1.02, col, np);
  }
}
// a trailing strand of blossom hanging from x,y,z
function strand(A, r, x, y, z, len, col) {
  const n = Math.max(2, Math.round(len / 0.2));
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n, sz = 0.13 - 0.07 * f, px = x + r.range(-0.05, 0.05), py = y - f * len, pz = z + r.range(-0.05, 0.05), lf = r.chance(0.25);
    blob(A, r, px, py, pz, sz, sz * 1.4, sz, lf ? mul(LEAF_C, 1.1) : mul(col, r.range(0.65, 0.95)));
    if (!lf) petals(A, r, px, py, pz, sz * 1.05, col, 3);
  }
}

// ---------- the world's surface material: one cheap program for every house, bridge, boat, prop and cloth ----------
// aMat: 0 painted boards, 1 teak planks, 2 corrugated tin (uv in metres), 3 shutter panel (uv 0..1), 4 cloth (sways along its
// normal, uv.x = phase), 5 gilt / marigold, 6 concrete and stucco, 7 flowers and leaves, 8 earth, 9 wire, 10 fretwork eave board
// (cut out), 11 plain matte (sways sideways, uv.x = phase), 12 dark interior (lit at night), 13 lamp bulb, 14 oar
function makeKhlongMaterial(U) {
  return new THREE.ShaderMaterial({
    vertexColors: true, side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uBnc: { value: new THREE.Vector2(4.5, 1) }, ...U },
    vertexShader: /* glsl */`
      attribute float aMat, aSway;
      uniform float uTime; uniform vec3 uBoat;
      varying vec3 vW, vN, vC, vO, vNo; varying vec2 vUv; varying float vMat;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position, n = normal; vC = color;
        vO = position; vNo = normal;
        #ifdef USE_INSTANCING
          p = (instanceMatrix * vec4(p, 1.)).xyz; n = mat3(instanceMatrix) * n;
        #endif
        #ifdef USE_INSTANCING_COLOR
          if (aMat < .5) vC *= instanceColor;
        #endif
        vec4 w = modelMatrix * vec4(p, 1.);
        n = normalize(mat3(modelMatrix) * n + vec3(0., 1e-6, 0.));
        if (abs(aSway) > 1e-4) {
          float ph = uv.x * 6.2832; vec2 db = w.xz - uBoat.xy;
          float gust = 1. + 2.2 * uBoat.z * exp(-dot(db, db) / 110.);
          if (aMat > 3.5 && aMat < 4.5) {
            float a1 = w.y * 2.3 + w.x * .7 + w.z * .5 + uTime * 3.3 + ph, a2 = w.y * 1.1 - uTime * 1.9 + ph * 1.7;
            w.xyz += n * aSway * gust * (sin(a1) * .34 + sin(a2) * .26);
            if (aMat > 4.1) {   // silk ribbons: a quick ripple runs down the tail and turns the normal with it, so the sheen travels
              float a3 = uv.y * 17. - uTime * 11. + ph; vec3 tg = normalize(cross(n, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.));
              w.xyz += n * sin(a3) * .03 * uv.y; n = normalize(n + tg * cos(a3) * .5 * uv.y);
            }
          } else if (aMat > 13.5) {
            float s = sin(uTime * 2.3); w.y += aSway * (.5 + .5 * s) * .95; w.x -= aSway * cos(uTime * 2.3) * 1.2;
          } else {
            float a = uTime * (1.5 + fract(ph * 3.3)) + ph;
            w.x += aSway * gust * sin(a) * .5; w.z += aSway * gust * cos(a * .83 + 1.) * .5;
          }
        }
        if (aMat > 8.5 && aMat < 9.5) w.y += uv.y * max(0., distance(w.xyz, cameraPosition) * .0012 - .012);
        vW = w.xyz; vN = n; vUv = uv; vMat = aMat;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uSkyC, uGndC, uBounce, uLampC; uniform float uTime, uNight, uWet, uObj; uniform vec2 uBnc;
      varying vec3 vW, vN, vC, vO, vNo; varying vec2 vUv; varying float vMat;
      #include <fog_pars_fragment>
      ${GLSL_PLAN}
      void main(){
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        float k = floor(vMat + .5);
        vec3 alb = vC, glow = vec3(0.); float spec = 0., wrap = 0., silk = 0.;
        vec3 tp = mix(vW, vO, uObj), tn = mix(N, normalize(vNo + vec3(0., 1e-6, 0.)), uObj);
        vec2 q = abs(tn.y) > .7 ? tp.xz : vec2(tp.z * tn.x - tp.x * tn.z, tp.y);
        float fw = fwidth(q.x) + fwidth(q.y), lod = clamp(1. - fw * 5., 0., 1.);
        float fsb = fwidth(vUv.x), cl = clamp(1. - fsb * 14., 0., 1.);
        float n1 = vn(q * .45), n2 = vn(vec2(q.x * 2.3, q.y * .25) + 7.), n3 = vn(q * 3.1);
        float tide = (1. - smoothstep(.2, .85 + .5 * n1, vW.y)) * (1. - uObj);
        if (k < .5) {
          float b = q.y / .21, bh = h21(vec2(floor(b), floor(q.x / 2.6 + floor(b) * .37)));
          alb *= mix(1., .8 + .34 * bh, lod);
          alb *= 1. - lod * .42 * smoothstep(.8, 1., fract(b));
          alb = mix(alb, vec3(.2, .17, .14) * (.7 + .6 * n3), smoothstep(.6, .84, n1 * .62 + n3 * .46) * .38);
          alb *= 1. - .34 * smoothstep(.5, .95, n2);
          alb = mix(alb, vec3(.1, .12, .065), tide * .5);
        } else if (k < 1.5) {
          float pl = q.x / .19, ph = h21(vec2(floor(pl), 3.));
          alb *= mix(1., .72 + .5 * ph, lod) * (.84 + .32 * vn(vec2(q.x * 11., q.y * .9)));
          alb *= 1. - lod * .42 * smoothstep(.84, 1., abs(fract(pl) - .5) * 2.);
          alb = mix(alb, vec3(.1, .115, .065), tide * .45); spec = .12 * tide;
        } else if (k < 2.5) {
          alb *= 1. + .24 * sin(vUv.x * 62.83) * cl;
          float rust = smoothstep(.5, .82, vn(vUv * vec2(.7, .45) + vC.r * 31.) * .72 + n3 * .36 + .3 * smoothstep(.55, 1., fract(vUv.y / 1.9)));
          alb = mix(alb, vec3(.27, .1, .04) * (.7 + .6 * n3), rust * .72);
          alb *= 1. - .3 * step(.95, fract(vUv.y / 1.9)) * cl;
          spec = .55 * (1. - rust);
        } else if (k < 3.5) {
          vec2 e = min(vUv, 1. - vUv); float frame = step(min(e.x, e.y * 1.6), .1);
          float lou = mix(.5 + .55 * fract(vUv.y * 9.), 1.05, frame);
          float top = step(.76, vUv.y) * (1. - frame);
          vec2 dq = fract(vec2(vUv.x * 3., vUv.y * 9.)) - .5;
          alb *= mix(lou, 1.1 - .85 * step(abs(dq.x) + abs(dq.y), .3), top) * (.85 + .3 * n3);
        } else if (k < 4.5) {
          silk = step(4.1, vMat);
          float acr = 1. - abs(clamp((vMat - 4.2) * 5., 0., 1.) * 2. - 1.);            // 0 at the selvedges, 1 along the middle
          alb *= mix(.95 + .1 * step(.5, fract(vUv.y * 3.)), (gl_FrontFacing ? 1. : .75) * (.8 + .3 * acr), silk); wrap = .45;
          alb *= 1. + mix(.7, .9, silk) * max(dot(-N, uSun), 0.);
          silk *= .45 + .55 * acr;
        } else if (k < 5.5) {
          glow = vC * (.3 + .25 * uNight + vUv.y); spec = .5;     // uv.y: extra gilt glow (the royal barges)
        } else if (k < 6.5) {
          float m1 = n1, m2 = n2, m3 = n3; vec2 sq = vec2(vUv.x, vW.z + vW.x * .3);
          if (vUv.y > 1.5) { m1 = vn(sq * .45 + 2.); m2 = vn(sq * 1.1 + 7.); m3 = vn(sq * 3.1); }
          alb *= .8 + .32 * m3 * m1; alb *= 1. - .4 * smoothstep(.45, .9, m2 * .7 + m1 * .4);
          if (vUv.y > 1.5) {   // an arch's soffit: the marks of the formwork boards, weeping stains, damp low on both sides
            float sb = vUv.x / .48, bl = clamp(1. - fsb * 6., 0., 1.), bh = h21(vec2(floor(sb), 9.));
            alb *= mix(1., .93 + .12 * bh, bl) * (1. - bl * .13 * smoothstep(.9, 1., abs(fract(sb) - .5) * 2.));
            alb *= 1. - .26 * smoothstep(.5, .8, vn(sq * vec2(.8, 1.5) + 3.));
            alb = mix(alb, vec3(.06, .08, .05) * (.7 + .6 * m3), smoothstep(.56, .92, vUv.y - 2. + .22 * (m1 - .5)) * .7);
          }
          alb = mix(alb, vec3(.075, .09, .05), tide * .65);
        } else if (k < 7.5) {
          // flowers and leaves: two octaves of soft noise pick petal or leaf, fading to the mean colour with distance
          vec2 fq = q + tp.yz * vec2(.37, .29);
          float fa = vn(fq * 9.), fb2 = vn(fq * 23. + 4.7), fl = smoothstep(.35, .65, fa * .6 + fb2 * .4);
          float isLeaf = step(vC.r, vC.g) * step(vC.b, vC.g);
          vec3 leafC = mix(vec3(.05, .15, .035) * (.7 + .8 * fb2), vC * (.5 + .8 * fa), isLeaf);
          vec3 petC = vC * mix(.78 + .5 * fb2, .62 + .6 * fb2, isLeaf);
          fl = mix(.56, fl, lod);
          alb = mix(leafC, petC, fl); wrap = .55;
          glow = petC * fl * (1. - isLeaf) * .12 * (1. - .8 * uNight);
          alb *= 1. + .55 * fl * max(dot(N, uSun), 0.) * (1. - isLeaf);
        } else if (k < 8.5) {
          alb *= .65 + .7 * n1; alb = mix(alb, vec3(.09, .15, .045) * (.7 + .6 * n3), smoothstep(.4, .7, vn(q * .21 + 3.)));
        } else if (k < 9.5) {
          wrap = 1.;
        } else if (k < 10.5) {
          float s = abs(sin(vUv.x * 3.14159265));
          if (vUv.y < .6 * (1. - s) || length(vec2(fract(vUv.x + .5) - .5, (vUv.y - .58) * .9)) < .13) discard;
        } else if (k < 11.5) {
          spec = .1;
        } else if (k < 12.5) {
          // a dim room, not a hole: the paler shapes of a curtain or a shelf inside
          float room = smoothstep(.5, .6, vn(q * vec2(1.6, .8) + 3.));
          alb = vec3(.085, .065, .05) + vec3(.03, .02, .012) * n3 + vec3(.12, .08, .05) * room * (.75 + .25 * sin(q.x * 37.));
          glow = vec3(1., .6, .26) * uNight * 1.7 * step(.42, h21(floor(q / vec2(1.7, 2.6)) + 5.)) * (.75 + .25 * sin(uTime * 2.3 + q.x * 3.));
        } else if (k < 13.5) {
          glow = vC * (.25 + 5.5 * uNight) * (.8 + .2 * sin(uTime * 3.1 + vW.x * 7. + vW.z * 5.));
        }
        alb *= 1. - .22 * uWet;
        float sh = canalShade(vW);
        float ndl = dot(N, uSun), dif = max(mix(ndl, ndl * .5 + .5, wrap), 0.) * (1. - sh);
        if (k > 3.5 && k < 4.5) dif = max(dif, abs(ndl) * .8 * (1. - sh));
        vec3 hemi = mix(uGndC, uSkyC, N.y * .5 + .5);
        vec3 bnc = uBounce * max(dot(N, normalize(vec3(-uSun.x, .25, -uSun.z))), 0.) * (.35 + .65 * sh);
        vec3 col = alb * (uSunCol * dif + hemi + bnc);
        col += alb * uLampC * uNight * exp(-max(vW.y, 0.) * .16);
        // light thrown back up off the water: it crawls over piles, deck undersides and bridge soffits
        float wb = .6 + .4 * vn(vW.xz * 1.5 + vec2(uTime * .6, vW.y * 1.3 - uTime * .45));
        col += alb * mix(uBounce, vec3(dot(uBounce, vec3(.3, .55, .15))), .4) * 1.6 * uBnc.y * wb * (1. - smoothstep(.3, uBnc.x, vW.y)) * (.35 + .65 * max(-N.y, 0.)) * (1. - .85 * max(N.y, 0.)) * (1. - .6 * uNight);
        // a knee on the brightest lit surfaces (a pale wall or a backlit cloth in a bar of sun), so they stay a colour and do not
        // clip to a white hole under the bloom; highlights, glints and lamps are added after it
        col /= 1. + .7 * max(max(col.r, max(col.g, col.b)) - 1.25, 0.);
        vec3 V = normalize(cameraPosition - vW), H = normalize(uSun + V + vec3(0., 1e-4, 0.));
        float sp = max(dot(N, H), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
        col += uSunCol * sp * (spec + .35 * uWet) * (1. - sh) * step(0., ndl);
        if (silk > 0.) {   // satin: a broad highlight in the cloth's own colour, a white core, and sky on the grazing faces
          float nh = max(dot(N, H), 0.), s4 = nh * nh, rim = max(1. - abs(dot(N, V)), 0.); s4 *= s4; s4 *= s4;
          col += (alb * 1.3 + .25) * uSunCol * s4 * silk * (1. - sh) + alb * uSkyC * silk * .7 * rim * rim;
        }
        col += glow;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- water: one opaque sheet for canal and river ----------
// sky mirror with the sun's scatter, ripples that calm with distance, the banks' shadow and its bars of light, a
// view-correct fake mirror of the two walls of houses (uBar rows 1 and 2), brass glitter on the river, rings, wakes
function makeWaterMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uSkyC, uGndC, uBounce, uZen, uHor, uScat, uDeepC, uDeepR, uBrass, uLampC, uBoat;
      uniform float uTime, uNight, uGlint, uFerryK; uniform vec4 uRing[5]; uniform vec3 uBoil; uniform vec4 uOwn, uFerry;
      uniform vec3 uRamp[3], uBankC, uPoleA[14], uPoleB[14]; uniform vec4 uRivK, uPole[14];
      varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_PLAN}
      vec3 skyCol(vec3 r){
        float y = max(r.y, 0.); vec3 c = mix(uHor, uZen, pow(y, .5));
        float s = max(dot(normalize(r.xz + vec2(1e-5)), normalize(uSun.xz + vec2(1e-5))), 0.);
        return c + uScat * s * s * exp(-y * 3.);
      }
      vec2 rip(vec2 p, float t){
        vec2 a = p * 1.3 + vec2(t * .5, t * .31), b = p * 3.1 - vec2(t * .7, t * .43);
        return (vec2(vn(a), vn(a + 13.7)) - .5) + .5 * (vec2(vn(b), vn(b + 5.3)) - .5);
      }
      // one octave of sun glitter: jittered world-anchored cells, each a facet that winks on and off; asp narrows the
      // dot across the line of sight so that, foreshortened, it lands on the screen as a point and not a dash
      float glit(vec2 p, float sc, float thr, vec2 vd, float asp){
        vec2 pc = p * sc, id = floor(pc), cf = fract(pc) - .5;
        float h = h21(id + sc * 3.7);
        cf -= (vec2(h21(id + 17.3), h21(id + 7.1)) - .5) * .56;
        float al = dot(cf, vd), ac = dot(cf, vec2(-vd.y, vd.x));
        float on = step(thr, h21(id + floor(uTime * (2.5 + 3. * h) + h * 7.) * .37));
        return on * (1. - smoothstep(.05, .2, length(vec2(al * 1.15, ac * asp)))) * (.5 + h);
      }
      void main(){
        // the apron under the way in (y < 0) is shaded as the surface its ray crossed on the way down: through a portal the
        // sunken part of the opening then shows the water lying between the viewer and the entry, with no seam at the waterline
        vec3 wp = vW;
        if (vW.y < -.02) { vec3 rd = vW - cameraPosition; wp = cameraPosition + rd * clamp(cameraPosition.y / max(-rd.y, 1e-4), 0., 1.); wp.y = 0.; }
        vec2 p = wp.xz; float n = 690. - p.y;
        vec3 Vv = cameraPosition - wp; float dist = length(Vv); Vv /= max(dist, 1e-4);
        float river = smoothstep(338., 360., n);
        float cxn = cxOf(n), hwn = hwOf(n), lat = p.x - cxn;
        // ripples: small and quick in the canal, a longer chop on the river running with the stream; both calm with distance
        float pch = vn(p * .033 + vec2(uTime * .012, 0.)), streak = vn(vec2(p.x * .012 + uTime * .008, p.y * .075));
        float ruf = mix(1., .55 + .9 * smoothstep(.25, .75, pch * .6 + streak * .4), river);
        float amp = mix(.085, .26, river) * ruf / (1. + dist * mix(.03, .012, river));
        vec2 g = rip(p * mix(1., .42, river) + vec2(uTime * .25 * river, 0.), uTime) * amp;
        g += (vec2(vn(p * .13 + vec2(uTime * .22, 0.)), vn(p * .13 + vec2(7.3 - uTime * .17, uTime * .1))) - .5) * .11 * river / (1. + dist * .004);
        // three finer octaves hammer the surface near the boat; each fades out before it would shimmer
        float fwp = fwidth(p.x) + fwidth(p.y);
        vec2 q3 = p * 2.7 + vec2(uTime * .6, -uTime * .45), q6 = p * 6.5 + vec2(uTime * 1.1, -uTime * .7), q15 = p * 15. - vec2(uTime * 1.7, -uTime * 1.5);
        vec2 hf = (vec2(vn(q3), vn(q3 + 23.3)) - .5) * 1.1 * clamp(1. - fwp * 2., 0., 1.)
          + (vec2(vn(q6), vn(q6 + 19.1)) - .5) * clamp(1. - fwp * 4.5, 0., 1.)
          + (vec2(vn(q15), vn(q15 + 31.7)) - .5) * .6 * clamp(1. - fwp * 10., 0., 1.);
        g += hf * mix(.075, .2, river) * ruf / (1. + dist * .035);
        // rings, boiling catfish, the long-tail's own bow wave
        float foam = 0.;
        for (int i = 0; i < 5; i++) { vec2 d = p - uRing[i].xy; float r = length(d), w = uRing[i].z;
          float a = uRing[i].w * exp(-abs(r - w) * 1.6) * smoothstep(0., .8, w);
          g += d / max(r, .05) * sin((r - w) * 5.) * a * .22; foam += a * .12; }
        vec2 db = p - uBoil.xy; float bl = uBoil.z * exp(-dot(db, db) / 5.);
        g += (vec2(vn(p * 4. + uTime * 3.), vn(p * 4. - uTime * 2.6)) - .5) * bl * .55; foam += bl * smoothstep(.62, .8, vn(p * 5. + uTime * 2.)) * .5;
        vec2 dw = p - uBoat.xy; vec2 fwd = uOwn.xy; float al = dot(dw, fwd), ac = dot(dw, vec2(-fwd.y, fwd.x));
        float vee = exp(-abs(abs(ac) - (.75 + max(-al, 0.) * .36)) * 2.2) * (1. - smoothstep(-1., 3.5, al)) * smoothstep(-34., -6., al) * uOwn.z;
        g += vec2(-fwd.y, fwd.x) * sign(ac) * vee * .3; foam += vee * (.35 + .5 * vn(p * 3. - uTime * 2.));
        foam += exp(-ac * ac * 1.2) * (1. - smoothstep(-3., -.5, al)) * smoothstep(-22., -3., al) * uOwn.z * (.3 + .5 * vn(p * 2.5 + uTime));
        // the ferry's wash (uFerry: stern xz, heading xz): two foam arms opening behind it and a churned lane between,
        // lying across our course on the open river so that something slides past the prow after the burst
        // on brass water white foam does not read, so the wash is drawn as it looks against the light: two bands of
        // smoothed, darker water with a bright crest along each, and a few slow swells between them
        float fwash = 0., fcrest = 0.;
        { vec2 df = p - uFerry.xy; float fs = max(-dot(df, uFerry.zw), 0.), fc = dot(df, vec2(-uFerry.w, uFerry.z)), fsg = fc < 0. ? -1. : 1.;
          float fk = uFerryK * smoothstep(0., 8., fs) * exp(-fs / 110.), fsp = 2.6 + fs * .15, fd = abs(fc) - fsp;
          float fwn = vn(p * .55 + vec2(uTime * .2, 0.));
          float farm = exp(-fd * fd / (2.2 + fs * .03)), fmid = (1. - smoothstep(fsp * .45, fsp, abs(fc))) * exp(-fs / 60.);
          g += vec2(-uFerry.w, uFerry.z) * fsg * fk * (farm * .3 + .12 * fmid * sin(abs(fc) * 1.7 - uTime * 1.3));
          fwash = fk * (farm * (.55 + .45 * fwn) + fmid * .3 * smoothstep(.35, .7, fwn));
          fcrest = fk * exp(-(fd - 1.5) * (fd - 1.5) / .5) * smoothstep(.3, .62, vn(p * vec2(.9, 2.6) - vec2(uTime * .6, 0.)));
          foam += fcrest * .5; }
        vec3 N = normalize(vec3(-g.x, 1., -g.y));
        vec3 R = reflect(-Vv, N); R.y = abs(R.y) + .02; R = normalize(R);
        float fr = clamp(1. - dot(N, Vv), 0., 1.); float fres = .03 + .97 * fr * fr * fr * fr * fr;
        vec3 sky = skyCol(R);
        // the river's mirror ramp (a look may give one): gold where a facet reflects the horizon, bronze, then slate where it looks up
        sky = mix(sky, mix(mix(uRamp[0], uRamp[1], smoothstep(0., .13, R.y)), uRamp[2], smoothstep(.1, .46, R.y)), uRivK.x * river);
        float sh = canalShade(vec3(wp.x + g.x * 9., .05, wp.z + g.y * 9.));
        // the walls of the canal mirrored: where the reflected ray meets a bank below its roof line
        float canal = (1. - river) * smoothstep(-70., -50., n);
        float side = R.x < 0. ? -1. : 1.;
        float tb = (cxn + side * (hwn + 1.2) - p.x) / (abs(R.x) < 1e-3 ? side * 1e-3 : R.x);
        float hy = tb * R.y, nh = n - tb * R.z;
        vec4 wall = texture2D(uBar, vec2((nh + 70.) / 450., side < 0. ? .375 : .625));
        float jag = (vn(vec2(p.x * 2.4 + uTime * .3, n * .3)) - .5) * 3.4 + (vn(vec2(p.x * 6.1 - uTime * .5, n * .9)) - .5) * 1.4;
        float isWall = canal * (1. - smoothstep(wall.a * 16. - 1.3, wall.a * 16. + 1.3, hy + jag)) * step(0., tb) * step(.02, wall.a);
        vec3 wc = wall.rgb * wall.rgb;
        wc *= (.62 + .6 * vn(vec2(nh * .75, hy * .9))) * (.8 + .4 * step(.5, fract(nh / 2.4 + .2 * sin(hy * 2.))));
        isWall *= .72 + .28 * smoothstep(.3, .7, vn(p * 2.3 + vec2(uTime * .5, -uTime * .3)));
        float wl = uSunK.x * side < 0. ? 0. : (1. - canalShade(vec3(p.x + R.x * tb, hy, wp.z + R.z * tb)));
        wc *= uSunCol * wl * .8 + mix(uGndC, uSkyC, .5) + uBounce * .5 + uLampC * uNight * 1.6;
        vec3 refl = mix(sky, wc, isWall * .68);
        // on the river: the far bank's trees and whatever stands in the water along our avenue (banner poles, tiered umbrellas,
        // salas) lie mirrored on it. The exact mirror ray is used, drawn out and broken by two slow noises, not the facet's own
        // ray, so that each reflection hangs under its object as a column of dashes
        { vec3 Rm = vec3(-Vv.x, max(Vv.y, 1e-3), -Vv.z); float rl = max(length(Rm.xz), 1e-3); vec2 rn = Rm.xz / rl; float slope = Rm.y / rl;
          float wv = vn(vec2(p.x * 1.3 + uTime * .35, p.y * .55 - uTime * .8)) - .5, wv2 = vn(vec2(p.x * .6 - uTime * .2, p.y * 2.1 + uTime * 1.3));
          float mbrk = .4 + .6 * smoothstep(.3, .62, wv2);
          float tz = (p.y - 74.) / max(-rn.y, 1e-3), xb = p.x + rn.x * tz, hb = (6. + 10. * vn(vec2(xb * .045, 3.))) * smoothstep(64., 92., abs(xb));
          float isBank = step(0., tz) * step(1e-3, -rn.y) * step(.5, hb) * (1. - smoothstep(hb - 1.5, hb + 1.5, slope * tz * (1. + wv * .6)));
          vec3 mc = uBankC; float mcov = isBank * .85;
          for (int i = 0; i < 14; i++) {
            vec4 P4 = uPole[i]; float wide = step(5., P4.w), tier = step(15., P4.w), off = P4.w * (1. - wide), hw = mix(.62, P4.w - 10. - 10. * tier, wide);
            vec2 d = P4.xy - p; float t = dot(d, rn), y = slope * t * (1. + wv * .3), lat = d.x * rn.y - d.y * rn.x, sft = .08 + t * .012;
            float wob = wv * (.3 + t * .02), on = step(0., t) * step(.01, P4.z) * step(y, P4.z);
            float cb = (1. - smoothstep(hw, hw + sft, abs(lat + off * (rn.y < 0. ? -1. : 1.) + wob))) * step(P4.z * mix(mix(.28, .16, wide), .45, tier), y);
            float cp = (1. - smoothstep(.16 + t * .004, .2 + t * .004 + sft, abs(lat + wob))) * (1. - wide);
            float c = max(cb, cp * .8) * on;
            vec3 ci = mix(uPoleA[i], uPoleB[i], step(.5, fract(y / max(P4.z * .16, .5))) * step(cp, cb));
            mc = mix(mc, ci, step(mcov, c) * step(.001, c)); mcov = max(mcov, c);
          }
          refl = mix(refl, mc, mcov * mbrk * river); }
        // body colour
        vec3 body = mix(uDeepC, uDeepR * (.72 + .5 * ruf), river) * (uSunCol * (.16 + .5 * max(uSun.y, 0.)) * (1. - sh) + uSkyC * .9 + uGndC * .4);
        vec3 col = mix(body, refl, clamp(fres * 1.15 + .08, 0., 1.));
        // the sun: a broad brass sheen and hard glitter (hashed facets that turn on and off as we move)
        float sd = max(dot(R, uSun), 0.), s2 = sd * sd, s8 = s2 * s2 * s2 * s2, s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
        vec2 gc = floor(p * mix(3., 1.2, river) / (1. + dist * .02));
        float tw = step(.55, h21(gc + floor(uTime * 3.) * .37)) * .6 + .4;
        col += uBrass * (s8 * mix(.3, .55, river) + s64 * s64 * 7. * tw) * (1. - sh) * (1. - isWall * .7) * uGlint;
        // hammered brass: every facet tilted toward the sun catches the bright western horizon; strongest on the sun's side
        vec2 sunAz = normalize(uSun.xz + vec2(1e-5)), vd = -Vv.xz / max(length(Vv.xz), 1e-3);
        float az = dot(vd, sunAz), sunny = smoothstep(-.95, .65, az);
        float tiltS = dot(-g, sunAz), lit = (1. - sh) * (1. - isWall * .7) * uGlint;
        col += uBrass * smoothstep(.015, .11, tiltS) * (.12 + .3 * sunny) * mix(.25, 1., river) * lit * mix(1., uRivK.y, river);
        col *= 1. - uRivK.w * river * smoothstep(.01, .1, -tiltS);
        // glitter: jittered facets in three world-anchored octaves chosen by distance, so they stream past with the water;
        // dense in a 40 m path lying from the boat toward the sun's bearing, thinning to a scatter on the far side
        float along = dot(dw, sunAz), perp = dot(dw, vec2(-sunAz.y, sunAz.x));
        float gpath = exp(-perp * perp / 420.) * smoothstep(-6., 10., along);
        float dens = clamp(.2 + .55 * sunny + .5 * gpath, 0., 1.) * (.45 + .55 * ruf);
        float lv = log2(clamp(dist, 3., 400.) / 3.), l0 = floor(lv), lf = lv - l0, sc0 = 2.6 * exp2(-l0);
        float asp = clamp(dist / 2.2, 1., 4.), thr = 1. - .5 * dens;
        float spk = glit(p + g * 1.5, sc0, thr, vd, asp) * (1. - lf) + glit(p + g * 1.5, sc0 * .5, thr, vd, asp) * lf
          + .6 * glit(p - g * 1.5 + 41.3, sc0 * 1.37, thr + .08, vd, asp);
        col += uBrass * spk * 5.5 * (.35 + .65 * sunny) * river * lit * (1. - clamp(foam, 0., 1.)) / (1. + dist * .004);
        col += uBrass * (.05 + .1 * sunny * sunny) * river * uGlint * uRivK.z;
        col = mix(col, body * 1.3 + sky * .12, clamp(fwash * 1.6, 0., .9) * river);
        col += uSunCol * fcrest * .9 * (1. - sh) * river;
        col = mix(col, vec3(.8, .78, .7) * (uSunCol * .5 * (1. - sh) + uSkyC), clamp(foam, 0., 1.));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

const FOG_K = /* glsl */`
  #ifdef USE_FOG
    float fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogK = 0.;
  #endif`;
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ---------- the thunderhead: one card at infinity in the north-east, baked side light, a slow glow breathing inside ----------
function makeThunderhead(U, look) {
  const D = 3000, near = look.cloudNear, w = 2600 * near, h = 1100 * near;
  const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - 60, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: U.uTime, uLit: { value: new THREE.Color('#ffd8a4') }, uShade: { value: new THREE.Color('#8684ad') }, uHaze: { value: new THREE.Color(look.sky.horizon) },
      uGlowC: { value: new THREE.Color('#ff7a6a') }, uRain: { value: look.wet > 0.9 ? 1 : 0 }, uK: { value: look.cloud } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uRain, uK; uniform vec3 uLit, uShade, uHaze, uGlowC; varying vec2 vUv;
      float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      float fb(vec2 p){ return .5 * vn(p) + .26 * vn(p * 2.07 + 3.1) + .15 * vn(p * 4.3 + 7.7) + .09 * vn(p * 8.9 + 1.3); }
      float lobe(vec2 p, vec2 c, vec2 r){ return 1. - length((p - c) / r); }
      float smx(float a, float b, float k){ float h = clamp(.5 + .5 * (a - b) / k, 0., 1.); return mix(b, a, h) + k * h * (1. - h); }   // a soft max: lobes melt into each other
      float dens(vec2 p){
        float d = lobe(p, vec2(-.2, .34), vec2(.36, .5));                 // the main tower, then turrets of several heights on both flanks
        d = smx(d, lobe(p, vec2(-.52, .2), vec2(.26, .3)) * .9, .1);
        d = smx(d, lobe(p, vec2(-.76, .1), vec2(.2, .17)) * .8, .1);
        d = smx(d, lobe(p, vec2(-.4, .55), vec2(.19, .25)) * .85, .1);
        d = smx(d, lobe(p, vec2(.1, .3), vec2(.27, .38)) * .92, .1);
        d = smx(d, lobe(p, vec2(.36, .16), vec2(.25, .22)) * .85, .1);
        d = smx(d, lobe(p, vec2(.0, .6), vec2(.24, .24)) * .85, .1);
        d = smx(d, lobe(p, vec2(.6, .08), vec2(.2, .13)) * .7, .1);
        d = smx(d, lobe(p, vec2(-.16, .66), vec2(.2, .22)) * .9, .1);
        d = smx(d, lobe(p, vec2(.16, .62), vec2(.17, .2)) * .8, .1);
        // cauliflower heads stand out along the tower's west flank
        d = smx(d, lobe(p, vec2(-.62, .36), vec2(.12, .12)) * .8, .06);
        d = smx(d, lobe(p, vec2(-.55, .49), vec2(.1, .1)) * .8, .06);
        d = smx(d, lobe(p, vec2(-.71, .25), vec2(.11, .1)) * .75, .06);
        d = smx(d, lobe(p, vec2(-.5, .66), vec2(.1, .09)) * .75, .06);
        d = smx(d, lobe(p, vec2(-.9, .15), vec2(.1, .085)) * .7, .06);
        d = smx(d, lobe(p, vec2(-.33, .76), vec2(.09, .08)) * .7, .06);
        float n = fb(p * vec2(3.2, 3.6) + vec2(uTime * .004, 0.)) + .07 * (vn(p * 19. + 2.3) - .5), na = fb(vec2(p.x * 1.6 - uTime * .006, p.y * 7.));
        // the anvil: a flat-topped wedge, thick where the towers punch into it, short to the left and drawn out thin to
        // the right; its underside is ragged
        float sx = p.x - .02, t = clamp(abs(sx) / (sx > 0. ? .92 : .33), 0., 1.);
        float topY = .92 - .1 * t * t + .15 * (fb(vec2(p.x * 3.1 - uTime * .004, 1.)) - .5) + .05 * (vn(vec2(p.x * 13., 2.)) - .5) + .03 * sin(p.x * 7.3 + 1.), botY = mix(.67, .885, pow(t, .7)) + .09 * (fb(vec2(p.x * 5., 3.)) - .5) * (1. - .6 * t);
        float anvil = min(min((topY - p.y) / .2, (p.y - botY) / .1), (1. - t) * 1.6);
        d = smx(d, clamp(anvil, -1., 1.) * .8, .06);
        float puff = 1. - abs(2. * vn(p * 8.5 + 11.) - 1.);                // billows: small round heads on every silhouette below the anvil
        d += mix((n - .5) * .9 + (puff - .55) * .13, (na - .5) * .42, smoothstep(.66, .8, p.y));
        return d * smoothstep(.02, .12, p.y + (n - .5) * .08);
      }
      void main(){
        vec2 p = vec2((vUv.x - .5) * 2.37, vUv.y);
        float d = dens(p), dl = dens(p + vec2(-.14, .05));                    // light the big forms, not the noise
        float top = smoothstep(.64, .78, p.y);
        float a = smoothstep(.0, mix(.1, .3, top), d);
        // the ice sheet is drawn out to the right in streaks
        a *= mix(1., smoothstep(.22, .7, vn(vec2(p.x * 2.2 - uTime * .006, p.y * 34.)) * .6 + vn(vec2(p.x * 5. - uTime * .01, p.y * 80.)) * .4), top * smoothstep(.25, 1., p.x));
        a *= 1. - .9 * top * smoothstep(.3, .95, p.x + .25 * (fb(p * vec2(2.3, 9.) + 4.) - .5));     // the tail thins out and breaks up; it never ends in a ruled edge
        // side light: the west flank peach and gold, the shade gathered on the base and the east side, with a soft edge
        float lit = clamp(.56 + (d - dl) * 1.1 + .3 * (.2 - p.x) - .34 * (1. - smoothstep(.02, .36, p.y)), 0., 1.);
        float bump = fb(p * 9. + 2.) - fb(p * 9. + vec2(-.25, .1) + 2.);
        lit = clamp(lit + bump * .3, 0., 1.);
        vec3 shd = mix(uShade * mix(.8, 1.1, smoothstep(.1, .8, p.y)), uLit, .2 * smoothstep(.2, .7, p.y));
        vec3 col = mix(shd, uLit, smoothstep(.08, .92, lit));
        col = mix(col, uLit * 1.04 + .05, smoothstep(.72, .9, p.y) * .55);                        // the anvil's ice sheet is a little paler
        col = mix(col, uShade * 1.1, (1. - smoothstep(.64, .94, p.y)) * top * .15 * smoothstep(-.3, .12, p.x));   // and its underside lies in soft shade
        // a thin gold rim along the sunward silhouette
        col += uLit * .25 * smoothstep(0., .1, d) * (1. - smoothstep(.1, .28, d)) * (1. - smoothstep(-.1, .2, p.x));
        // the glow inside: two slow swells, each a few seconds to rise and fade, never a flash
        float s1 = sin(uTime * 1.31) * .5 + .5, s2 = sin(uTime * .83 + 2.1) * .5 + .5;
        float g1 = exp(-dot(p - vec2(-.24, .4), p - vec2(-.24, .4)) / .012) * s1 * s1 * s1;
        float g2 = exp(-dot(p - vec2(.04, .5), p - vec2(.04, .5)) / .009) * s2 * s2 * s2;
        col += uGlowC * (g1 * .8 + g2 * .6) * smoothstep(.25, .6, d) * (.5 + 1. * fb(p * 6. + 5.));
        // leaning rain shafts under the base when the storm has just passed over
        float rs = uRain * (1. - smoothstep(.0, .34, p.y)) * smoothstep(-.75, -.6, p.x) * (1. - smoothstep(.0, .2, p.x)) * smoothstep(.35, .7, vn(vec2((p.x + p.y * .35) * 14., 1.7)));
        col = mix(col, uShade * .9, rs * (1. - a)); a = max(a, rs * .55);
        float hz = .05 + .5 * exp(-p.y * 7.);                                  // the apricot haze lies on the base only
        col = mix(col, uHaze, hz);
        gl_FragColor = vec4(col, a * uK * smoothstep(.0, .03, vUv.x) * (1. - smoothstep(.97, 1., vUv.x)));
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -0.6;
  const dir = new THREE.Vector3(0.5, 0, -0.866);
  mesh.rotation.y = -Math.PI / 6;
  const cp = new THREE.Vector3();
  return { mesh, follow(cam) { cam.getWorldPosition(cp); mesh.position.set(cp.x + dir.x * D, 0, cp.z + dir.z * D); } };
}

// ---------- spray: two bow sheets and droplets in boat space; one premultiplied mesh ----------
function makeSpray(rng, U, count) {
  const P = [], Q = [], I = [];
  const add = (x, y, z, a, b, c, d) => { P.push(x, y, z); Q.push(a, b, c, d); return P.length / 3 - 1; };
  for (const sd of [-1, 1]) {
    const seg = 10, base = P.length / 3;
    for (let i = 0; i <= seg; i++) {
      const s = i / seg, z = -3.3 + 2.9 * s, x = sd * (0.3 + 2.25 * Math.pow(s, 0.85)), hh = 0.75 * Math.sin(Math.PI * Math.min(1, (s + 0.04) * 1.05));
      add(x, -1.52, z, s, 0, sd, 0); add(x + sd * 0.45 * hh, -1.5 + hh, z + 0.25, s, 1, sd, 0);
    }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  for (let i = 0; i < count; i++) {
    const sd = rng.sign(), r1 = rng(), r2 = rng(), r3 = rng(), b = P.length / 3;
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) add(c[0], c[1], 0, r1, 2 + r2, sd, r3);
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uTime: U.uTime, uCol: U.uSprayC, uK: U.uSprayK },
    vertexShader: /* glsl */`
      attribute vec4 aQ; uniform float uTime; varying vec4 vQ; varying vec2 vC; varying float vA;
      void main(){
        vQ = aQ; vC = position.xy; vA = 1.;
        vec4 mv;
        if (aQ.y > 1.5) {
          float r1 = aQ.x, r2 = aQ.y - 2., r3 = aQ.w, t = fract(uTime * (.8 + r1 * .7) + r2 * 7.);
          vec3 p0 = vec3(aQ.z * (.4 + r3 * 1.1), -1.45, -3.1 + r2 * 1.5);
          vec3 v = vec3(aQ.z * (1.2 + 2.6 * r1), 2.4 + 2. * r2, 1.5 + 3.5 * r3);
          vec3 p = p0 + v * t * .8 + vec3(0., -4.9 * t * t * .64, 0.);
          mv = modelViewMatrix * vec4(p, 1.); mv.xy += position.xy * (.009 + .017 * r3);
          vA = (1. - t) * smoothstep(0., .08, t);
        } else {
          vec3 p = position; p.y += aQ.y * .09 * sin(uTime * 9. + aQ.x * 14.); p.x += aQ.z * aQ.y * .06 * sin(uTime * 6.3 + aQ.x * 9.);
          mv = modelViewMatrix * vec4(p, 1.);
        }
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uK; uniform vec3 uCol; varying vec4 vQ; varying vec2 vC; varying float vA;
      float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float a;
        if (vQ.y > 1.5) { a = (1. - smoothstep(.3, 1., dot(vC, vC))) * vA * .9; }
        else {
          float s = vQ.x, v = vQ.y;
          float n = vn(vec2(s * 9. - uTime * 5., v * 3. + vQ.z)) * .6 + vn(vec2(s * 23. - uTime * 9., v * 7.)) * .4;
          a = smoothstep(.34 + .4 * v, .8 + .2 * v, n + .25 * (1. - v)) * smoothstep(0., .08, s) * (1. - smoothstep(.55, 1., s)) * (1. - v * v) * .8;
        }
        gl_FragColor = vec4(uCol * uK * a, a * .85);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
  return mesh;
}

// ---------- egrets: instanced, posed on the CPU (stand, flush, fly), wings beaten in the vertex shader ----------
function makeEgrets(count, U) {
  const P = [], W = [], K = [], NN = [];
  // one triangle, wound so that its face normal points along `want` (lit from the sun, two-sided)
  const t3 = (a, b, c, wa, wb, wc, kind, want) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
    if (l < 1e-9) return;
    nx /= l; ny /= l; nz /= l;
    if (nx * want[0] + ny * want[1] + nz * want[2] < 0) { const t = b; b = c; c = t; const tw = wb; wb = wc; wc = tw; nx = -nx; ny = -ny; nz = -nz; }
    P.push(...a, ...b, ...c); W.push(wa, wb, wc); K.push(kind, kind, kind); NN.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  };
  const out = (a, b, c, o) => [(a[0] + b[0] + c[0]) / 3 - o[0], (a[1] + b[1] + c[1]) / 3 - o[1], (a[2] + b[2] + c[2]) / 3 - o[2]];
  // four-sided tube between two points on the centre plane (neck, head, bill, legs)
  const seg = (p, q, r0, r1, kind) => {
    const dy = q[1] - p[1], dz = q[2] - p[2], dl = Math.hypot(dy, dz) || 1, u = [0, dz / dl, -dy / dl], x = [1, 0, 0], d = [x, u, [-1, 0, 0], [0, -u[1], -u[2]]], mid = [0, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    for (let i = 0; i < 4; i++) {
      const e = d[i], f = d[(i + 1) % 4];
      const a = [p[0] + e[0] * r0, p[1] + e[1] * r0, p[2] + e[2] * r0], b = [p[0] + f[0] * r0, p[1] + f[1] * r0, p[2] + f[2] * r0];
      const c = [q[0] + f[0] * r1, q[1] + f[1] * r1, q[2] + f[2] * r1], g = [q[0] + e[0] * r1, q[1] + e[1] * r1, q[2] + e[2] * r1];
      t3(a, b, c, 0, 0, 0, kind, out(a, b, c, mid)); t3(a, c, g, 0, 0, 0, kind, out(a, c, g, mid));
    }
  };
  // body: a spindle
  const nose = [0, 0.05, 0.3], tail = [0, 0.0, -0.27], top = [0, 0.105, 0.0], belly = [0, -0.085, -0.02], O = [0, 0.01, 0];
  for (const sd of [-1, 1]) {
    const side = [sd * 0.088, 0.02, 0.0];
    for (const [a, b, c] of [[nose, top, side], [top, tail, side], [nose, side, belly], [side, tail, belly]]) t3(a, b, c, 0, 0, 0, 0, out(a, b, c, O));
  }
  // neck drawn back in an S, head, bill, trailing legs
  seg([0, 0.04, 0.25], [0, 0.155, 0.36], 0.04, 0.03, 0); seg([0, 0.155, 0.36], [0, 0.11, 0.47], 0.03, 0.026, 0); seg([0, 0.11, 0.47], [0, 0.175, 0.55], 0.026, 0.03, 0);
  seg([0, 0.175, 0.55], [0, 0.18, 0.64], 0.036, 0.026, 0); seg([0, 0.18, 0.64], [0, 0.16, 0.86], 0.02, 0.004, 3);
  for (const sd of [-1, 1]) seg([sd * 0.02, -0.03, -0.2], [sd * 0.02, -0.065, -0.5], 0.013, 0.009, 2);
  // wings in two segments: arm, then a longer hand that lags and bends (aW 0 at the root, .5 at the wrist, 1 at the tip)
  const up = [0, 1, 0];
  for (const sd of [-1, 1]) {
    const y = 0.04, rL = [sd * 0.05, y, 0.17], rT = [sd * 0.05, y, -0.15], mL = [sd * 0.42, y, 0.16], mT = [sd * 0.42, y, -0.18];
    const hL = [sd * 0.72, y, 0.1], hT = [sd * 0.68, y, -0.2], tip = [sd * 0.97, y, -0.07];
    t3(rL, mL, mT, 0, sd * 0.5, sd * 0.5, 0, up); t3(rL, mT, rT, 0, sd * 0.5, 0, 0, up);
    t3(mL, hL, hT, sd * 0.5, sd * 0.8, sd * 0.78, 0, up); t3(mL, hT, mT, sd * 0.5, sd * 0.78, sd * 0.5, 0, up); t3(hL, tip, hT, sd * 0.8, sd, sd * 0.78, 0, up);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); g.setAttribute('aN', new THREE.Float32BufferAttribute(NN, 3));
  const iPos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const iDir = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iPos', iPos); g.setAttribute('iDir', iDir); g.instanceCount = count;
  const m = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...fogU(), uTime: U.uTime, uLitC: U.uEgretLit, uShadeC: U.uEgretShade, uSun: U.uSun },
    vertexShader: /* glsl */`
      attribute float aW, aK; attribute vec3 iPos, aN; attribute vec4 iDir; uniform float uTime; varying vec3 vNn; varying float vK;
      #include <fog_pars_vertex>
      void main(){
        float fly = iDir.z, wt = abs(aW), sg = aW < 0. ? -1. : 1.;
        // far birds are drawn a little larger than life so the line still reads as birds, not specks
        vec3 p = position * 1.25 * (1. + clamp((distance(iPos, cameraPosition) - 22.) * .017, 0., 1.8)), n = aN;
        float ph = uTime * (5.5 + iDir.w * 1.5) + iDir.w * 40.;
        float flap = sin(ph - wt * 1.15) * fly;
        if (wt > 0.) {
          float lift = flap * .6 + .2 * fly;
          p.x *= mix(.16, 1., fly) * (1. - .1 * wt * abs(flap));
          p.y += wt * lift - wt * wt * .16 * (1. - flap) * fly; p.z -= wt * .1 * (1. - fly);
          n = normalize(vec3(-sg * (lift - wt * .3 * (1. - flap) * fly), 1., 0.));
        }
        float a = (1. - fly) * 1.15, ca = cos(a), sa = sin(a);
        p = vec3(p.x, p.y * ca + p.z * sa, p.z * ca - p.y * sa); n = vec3(n.x, n.y * ca + n.z * sa, n.z * ca - n.y * sa);
        p.y += (1. - fly) * .62;
        vec3 w = iPos + vec3(p.x * iDir.x + p.z * iDir.y, p.y, -p.x * iDir.y + p.z * iDir.x);
        vNn = vec3(n.x * iDir.x + n.z * iDir.y, n.y, -n.x * iDir.y + n.z * iDir.x); vK = aK;
        vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLitC, uShadeC, uSun; varying vec3 vNn; varying float vK;
      #include <fog_pars_fragment>
      void main(){
        vec3 N = normalize(vNn + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
        float nl = dot(N, uSun), l = clamp(.5 + .38 * nl + .22 * abs(nl), 0., 1.);        // white feathers glow a little when backlit
        vec3 c = mix(uShadeC * (.85 + .15 * N.y), uLitC, l * l * (3. - 2. * l));
        if (vK > 1.5) c = (vK > 2.5 ? vec3(.62, .43, .07) : vec3(.15, .14, .13)) * (.5 + .6 * l);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return { mesh, pos: iPos.array, dir: iDir.array, touch() { iPos.needsUpdate = true; iDir.needsUpdate = true; } };
}

// ---------- wakes of the other boats (instanced quads on the water), the sluice's bead curtain, floating candles ----------
function makeWakeMaterial(U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uTime: U.uTime, uCol: U.uFoamC },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec2 vWp;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 lp = vec4(position, 1.);
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp;
        #endif
        vec4 w = modelMatrix * lp; vWp = w.xz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uCol; varying vec2 vUv; varying vec2 vWp;
      #include <fog_pars_fragment>
      float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float along = vUv.x, across = abs(vUv.y - .5) * 2., spread = .1 + .9 * along;
        float n = vn(vWp * .5 + vec2(uTime * .3, 0.)) * .6 + vn(vWp * 1.7 - uTime * .5) * .4;
        float core = (1. - smoothstep(0., spread * .5, across)) * (1. - along) * (1. - along);
        float arms = (1. - smoothstep(.03, .15, abs(across - spread * .9))) * (1. - along);
        float a = clamp(core * 1.5 + arms * .8, 0., 1.) * smoothstep(.25, .7, n + core * .5) * smoothstep(0., .03, along);
        gl_FragColor = vec4(uCol, a * .8);
        #include <fog_fragment>
      }`,
  });
}
function makeBeadMaterial(U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uTime: U.uTime, uCol: U.uSprayC, uSK: U.uSprayK, uK: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; varying float vWy; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vWy = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uK, uSK; uniform vec3 uCol; varying vec2 vUv; varying float vWy;
      float h11(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      // one layer of falling streaks: every column has its own place, speed, spacing and length; the head of a drop is
      // sharp and its tail fades upward, about six times as long as the drop is wide
      float rainL(vec2 uv, float cols, float seed, float fw){
        float cx = uv.x * cols + seed, ci = floor(cx), hs = h11(ci + seed * 3.1), h2 = h11(ci * 1.7 + 57.3 + seed);
        float cf = fract(cx) - .5 - (h2 - .5) * .62, wd = max(.1, fw * cols * .9);
        float core = 1. - smoothstep(wd * .3, wd, abs(cf));
        float per = .5 + 1.1 * h2, sp = 3.4 + 3. * hs, ym = uv.y * 4.6;
        float f = fract(ym / per + uTime * sp / per + hs * 9.), len = (.14 + .24 * hs) / per;
        float drop = smoothstep(0., .03, f) * (1. - smoothstep(.03, len, f));
        float thread = step(.8, h2) * .28 * (.6 + .4 * sin(ym * 6. + uTime * 8. + hs * 30.));      // a few columns still pour in a thin thread
        return core * (drop * step(.22, hs) + thread) * min(1., .1 / wd * 1.7);
      }
      void main(){
        float fw = fwidth(vUv.x);
        float a = rainL(vUv, 84., 0., fw) + .6 * rainL(vUv + vec2(0., .37), 53., 11.3, fw);
        a *= .7 * (.45 + .55 * vUv.y);
        // a line of foam and splashes where the curtain meets the water
        float sx = vUv.x * 120., hp = h11(floor(sx) + floor(uTime * 7. + h11(floor(sx)) * 5.) * 13.7);
        float foam = (1. - smoothstep(.02, .2 + .25 * hp, abs(vWy - .05))) * (.35 + .65 * hp);
        a = clamp(a + foam * .5, 0., .75) * uK * step(-.05, vWy);
        gl_FragColor = vec4(uCol * (.42 + .95 * uSK) * a, a * .55);
      }`,
  });
}
function makeCandles(pts, U) {
  // two quads to a candle: the flame (a billboard, never under two pixels) and its reflection, a streak lying on the
  // water from the flame toward the viewer, as long on the screen as the flame is tall
  const n = pts.length / 3, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, 0, 1, 0.5, 0, 1, 0.5, 1, 1, -0.5, 1, 1], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(pts), 3)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uTime: U.uTime },
    vertexShader: /* glsl */`
      attribute vec3 iP; uniform float uTime; varying vec3 vC; varying float vF;
      #include <fog_pars_vertex>
      void main(){
        float ph = iP.z * 6.2832;
        vec3 w = vec3(iP.x + .5 * sin(uTime * .21 + ph) + uTime * .05 * (iP.z - .5), .16 + .03 * sin(uTime * 1.7 + ph * 3.), iP.y + .5 * cos(uTime * .17 + ph * 1.3));
        float fl = .75 + .25 * sin(uTime * (7. + iP.z * 5.) + ph * 9.);
        vec4 mvPosition;
        if (position.z < .5) {
          mvPosition = viewMatrix * vec4(w, 1.);
          float size = max(.34, -mvPosition.z * .011);
          vC = vec3(position.xy * 2., 0.); vF = fl * min(1., .34 / size * 2.1);
          mvPosition.xy += position.xy * size * vec2(1., 1.5); mvPosition.y += size * .3;
        } else {
          vec2 tc = cameraPosition.xz - w.xz; float d = max(length(tc), .5); tc /= d;
          float he = max(cameraPosition.y - .035, .3), th = atan(he, d);
          float dl = max(.8 * he / (d * d + he * he), .0085);            // 0.8 m of water near by, never under about three pixels
          float d1 = min(he / tan(min(th + dl * position.y, 1.5)), d);   // how far from the eye this end of the streak lies
          float wd = max(.08, d1 * .0032);
          vec3 q = vec3(w.x + tc.x * (d - d1) - tc.y * position.x * wd * 2., .035, w.z + tc.y * (d - d1) + tc.x * position.x * wd * 2.);
          mvPosition = viewMatrix * vec4(q, 1.);
          vC = vec3(position.x * 2., position.y, 1.); vF = fl * min(1., .08 / wd * 2.4);
        }
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec3 vC; varying float vF;
      #include <fog_pars_fragment>
      void main(){
        float a;
        if (vC.z < .5) { float r2 = dot(vC.xy, vC.xy); a = exp(-r2 * 14.) + .2 * exp(-r2 * 3.) * (1. - smoothstep(.6, 1., r2)); }
        else a = (1. - smoothstep(.15, 1., abs(vC.x))) * (1. - vC.y) * smoothstep(0., .06, vC.y) * .42 * (.6 + .4 * sin(vC.y * 19. - uTime * 6. + vF * 20.));
        ${FOG_K}
        gl_FragColor = vec4(vec3(1., .62, .22) * a * 3.2 * vF * (1. - .7 * fogK), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

// threads of incense smoke rising from the spirit houses: one mesh of thin ribbons that waver and thin out
function makeIncense(pts, U) {
  const P = [], Q = [], I = [], rows = 8;
  pts.forEach((p, k) => {
    const b = P.length / 3, ph = (k * 0.618) % 1;
    for (let i = 0; i <= rows; i++) for (const sd of [-1, 1]) { P.push(p[0], p[1], p[2]); Q.push(sd, i / rows, ph); }
    for (let i = 0; i < rows; i++) { const a = b + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 3)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uTime: U.uTime, uCol: U.uSprayC, uBoat: U.uBoat },
    vertexShader: /* glsl */`
      attribute vec3 aQ; uniform float uTime; uniform vec3 uBoat; varying vec3 vQ; varying float vA;
      void main(){
        float f = aQ.y, ph = aQ.z * 6.2832, w2 = f * f; vec3 w = position;
        vec2 db = w.xz - uBoat.xy; float gust = uBoat.z * exp(-dot(db, db) / 90.);
        w.y += f * 1.35;
        w.x += (sin(f * 5. + uTime * 1.3 + ph) * .1 + sin(f * 11. - uTime * 2.1 + ph * 2.) * .04) * w2 + w2 * .12;
        w.z += cos(f * 4. + uTime * 1.1 + ph * 1.7) * .08 * w2 - w2 * (.1 + 1.1 * gust);
        vec4 mv = viewMatrix * vec4(w, 1.);
        float thin = .012 + .05 * f, wid = max(thin, -mv.z * .0017);
        mv.x += aQ.x * wid; vQ = aQ; vA = thin / wid * (1. - smoothstep(45., 100., -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; varying vec3 vQ; varying float vA;
      void main(){
        float a = (1. - vQ.x * vQ.x) * (1. - vQ.y) * smoothstep(0., .1, vQ.y) * .5 * vA;
        gl_FragColor = vec4(uCol * .8 * a, a);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'incense';
  return mesh;
}

// ---------- colours (linear) ----------
function makeColours(rng, look) {
  const C = {
    teak: L('#7d6046'), teakD: L('#3d2814'), pile: L('#7f6e5a'), teakR: L('#77492f'), dark: L('#120d0a'), white: L('#e9e2d0'), cream: L('#d8caa6'),
    mint: L('#8fc2a6'), blue: L('#6f97bd'), blueD: L('#3c5f8a'), ochre: L('#c48f38'), teal: L(PALETTE[5], 1.1), red: L('#b83a26'), roofRed: L('#8c3524'),
    tin: L('#aeb4b8'), tinRust: L('#8a5a3a'), tinGreen: L('#3f6b54'), tinBlue: L('#5a7f9c'), earth: L('#3a2e1c'), concrete: L('#b9b2a0'), stucco: L('#e4dcc8'),
    gold: L('#e2a43a'), marigold: L('#f09a14'), jasmine: L('#f4f0e2'), terra: L('#a8552e'), jar: L('#4a2a16'), leaf: L('#3f7a34'), banana: L('#6f9c34'), bananaStem: L('#7c8a3a'),
    boug: L('#d2267e'), bougO: L('#ee6a2a'), orchid: L('#9a4ad0'), orchidW: L('#efe6f2'), lotus: L('#f29ab8'), saffron: L('#f08a1c'), tar: L('#15110e'), steel: L('#8c9296'),
    pomelo: L('#b9c84a'), mango: L('#f2a622'), rambutan: L('#c8322a'), charcoal: L('#1a1614'), silver: L('#c9cdd0'),
  };
  C.styles = [
    { wall: C.teak, trim: C.cream, shut: C.teal }, { wall: C.mint, trim: C.white, shut: C.teakD }, { wall: C.blue, trim: C.white, shut: C.white },
    { wall: C.ochre, trim: C.teakD, shut: C.teal }, { wall: C.cream, trim: C.teal, shut: C.blueD }, { wall: C.teakR, trim: C.ochre, shut: C.cream },
  ];
  C.roofs = [C.tin, C.tin, C.tinRust, C.roofRed, C.tinGreen, C.tinBlue];
  C.cloth = [L('#f2efe6'), L('#c8493a'), L('#4a6fa8'), L('#e0bc54'), L('#d87a98'), L('#4f9a74'), L('#e0883a'), L('#7a5a9c'), L('#2f3e6a'), L('#e8e0d0')];
  C.wash = C.cloth.concat(C.cloth.map((c) => mix3(mul(c, 0.75), C.cream, 0.3)), [C.white, C.cream]);
  C.parasol = rng.shuffle([L(PALETTE[4], 1.15), L('#ec5a94'), L('#3fa05a'), L('#f2c03a')]);
  C.cargo = look.mist > 0.5 ? [C.silver, C.saffron, C.gold] : rng.pick([[C.pomelo, C.mango, C.rambutan], [C.mango, C.lotus, C.pomelo], [C.rambutan, C.pomelo, C.charcoal], [C.lotus, C.orchidW, C.marigold]]);
  return C;
}
// vertical panel standing on p..q, h tall, uv 0..1 (shutters, doors)
const panel = (A, p, q, h, col, m) => quad(A, p, q, [q[0], q[1] + h, q[2]], [p[0], p[1] + h, p[2]], col, m, null, null, null, null, [0, 0], [1, 0], [1, 1], [0, 1]);

function banana(A, r, x, y, z, sc, C) {
  box(A, x, y, z, 0.26 * sc, 2.0 * sc, 0.26 * sc, C.bananaStem, 11, { taper: 0.7, noTop: true, ao: 0.6 });
  const nf = r.int(5, 7), a0 = r.range(0, TAU);
  for (let i = 0; i < nf; i++) {
    const a = a0 + i / nf * TAU + r.range(-0.3, 0.3), ca = Math.cos(a), sa = Math.sin(a), len = r.range(1.9, 2.7) * sc, ph = r(), up = r.range(0.55, 1.0);
    let px = x, py = y + 1.95 * sc, pz = z, w0 = 0.12 * sc;
    for (let k = 0; k < 3; k++) {
      const st = len / 3, nx = px + ca * st * (1 - 0.1 * k), ny = py + (up - k * 0.62) * st, nz = pz + sa * st * (1 - 0.1 * k), w1 = (k === 2 ? 0.1 : 0.36) * sc, s0 = A.count;
      const col = mul(C.banana, 0.8 + 0.2 * k + r.range(-0.08, 0.08));
      quad(A, [px - sa * w0, py, pz + ca * w0], [px + sa * w0, py, pz - ca * w0], [nx + sa * w1, ny, nz - ca * w1], [nx - sa * w1, ny, nz + ca * w1], col, 7);
      for (let j = s0; j < A.count; j++) { A.uv[j * 2] = ph; }
      // sway grows toward the tip: the two far vertices of each triangle pair
      const sw0 = 0.05 * k * sc, sw1 = 0.05 * (k + 1) * sc; A.sway[s0] = sw0; A.sway[s0 + 1] = sw0; A.sway[s0 + 2] = sw1; A.sway[s0 + 3] = sw0; A.sway[s0 + 4] = sw1; A.sway[s0 + 5] = sw1;
      px = nx; py = ny; pz = nz; w0 = w1;
    }
  }
}
function spiritHouse(A, r, x, y, z, C) {
  box(A, x, y, z, 0.16, 1.3, 0.16, C.white, 6, { taper: 0.8 });
  box(A, x, y + 1.3, z, 0.84, 0.07, 0.84, C.white, 6);
  box(A, x, y + 1.37, z, 0.42, 0.34, 0.42, r.chance(0.5) ? C.red : C.white, 0);
  spike(A, x, y + 1.71, z, 0.66, 0.66, 0.44, C.roofRed, 0); spike(A, x, y + 2.02, z, 0.1, 0.1, 0.42, C.gold, 5);
  const s0 = A.count;
  for (const dx of [-0.26, 0.26]) box(A, x + dx, y + 1.0, z + 0.38, 0.07, 0.36, 0.07, C.marigold, 5);
  setSway(A, s0, 0.03, r());
  box(A, x - 0.26, y + 1.37, z + 0.28, 0.09, 0.13, 0.09, C.red, 13); box(A, x + 0.2, y + 1.37, z + 0.3, 0.12, 0.05, 0.12, C.marigold, 5);
}

// hanging cloth in one colour (aMat 4), top edge pA..pB
function cloth(A, pA, pB, len, n, col, phase, sw0, sw1) {
  const s0 = A.count; clothStrip(A, pA, pB, len, n, () => col, phase, sw0, sw1, 0);
  for (let i = s0; i < A.count; i++) A.mat[i] = 4;
}
// ---------- one canal house. Local frame: +Z toward the canal, origin on the veranda's front edge at water level ----------
function house(A, r, B, o, C) {
  const W = o.W, hw = W / 2, st = o.style, deckY = o.deckY, ver = o.ver, D = o.D, fl = o.floors, wh = 2.7, H = fl * wh, zf = -ver;
  A.setT(B.x, 0, B.z, B.rot, 1);
  const wall = mul(st.wall, r.range(0.84, 1.12)), trim = st.trim, teakD = C.teakD, pileD = o.pile || 1.3;
  const nx = Math.max(2, Math.round(W / 2.4));
  for (let i = 0; i <= nx; i++) {
    const x = -hw + 0.22 + (W - 0.44) * i / nx;
    for (const z of [-0.16, zf - 0.1, -D + 0.3]) box(A, x + r.range(-0.04, 0.04), -pileD, z, 0.2, deckY + pileD - 0.14, 0.2, C.pile, 1, { noTop: true, ao: 0.65 });
  }
  box(A, 0, deckY - 0.52, -0.16, W - 0.3, 0.14, 0.1, C.pile, 1);
  box(A, 0, deckY - 0.15, -D / 2, W, 0.15, D, C.teak, 1, { bottom: true, ao: 0.75 });
  box(A, 0, deckY, (zf - D) / 2, W - 0.24, H, D + zf, wall, 0, { noTop: true, ao: 0.8 });
  for (const sx of [-1, 1]) box(A, sx * (hw - 0.13), deckY, zf + 0.02, 0.14, H, 0.08, trim, 0, { noTop: true });
  if (fl > 1) box(A, 0, deckY + wh - 0.08, zf + 0.03, W - 0.2, 0.16, 0.07, trim, 0);
  // doors, windows, shutters
  const ns = Math.max(2, Math.round((W - 0.8) / 1.85)), door = r.int(0, ns - 1), z = zf + 0.025;
  for (let f = 0; f < fl; f++) for (let i = 0; i < ns; i++) {
    const x = -hw + 0.4 + (W - 0.8) * (i + 0.5) / ns, y0 = deckY + f * wh;
    if (f === 0 && i === door) {
      quad(A, [x - 0.48, y0, z], [x + 0.48, y0, z], [x + 0.48, y0 + 2.05, z], [x - 0.48, y0 + 2.05, z], C.dark, 12);
      box(A, x, y0 + 2.05, z + 0.03, 1.2, 0.12, 0.08, trim, 0);
      for (const sx of [-1, 1]) box(A, x + sx * 0.54, y0, z + 0.03, 0.1, 2.05, 0.08, trim, 0, { noTop: true });
      const a = r.range(0.35, 1.25);
      panel(A, [x - 0.48, y0 + 0.03, z + 0.02], [x - 0.48 + 0.92 * Math.cos(a), y0 + 0.03, z + 0.02 + 0.92 * Math.sin(a)], 1.98, st.shut, 3);
      continue;
    }
    const yb = y0 + 0.95, t = r();
    box(A, x, yb - 0.07, z + 0.06, 1.12, 0.07, 0.15, trim, 0); box(A, x, yb + 1.15, z + 0.04, 1.12, 0.09, 0.1, trim, 0);
    if (t < 0.25) { panel(A, [x - 0.46, yb, z + 0.02], [x + 0.46, yb, z + 0.02], 1.15, st.shut, 3); continue; }
    quad(A, [x - 0.45, yb, z], [x + 0.45, yb, z], [x + 0.45, yb + 1.15, z], [x - 0.45, yb + 1.15, z], C.dark, 12);
    if (t < 0.62) {
      for (const sx of [-1, 1]) { const b = r.range(0.2, 1.25); panel(A, [x + sx * 0.46, yb, z + 0.02], [x + sx * (0.46 + 0.45 * Math.cos(b)), yb, z + 0.02 + 0.45 * Math.sin(b)], 1.15, st.shut, 3); }
    } else {
      const out = r.range(0.3, 0.6);
      quad(A, [x - 0.46, yb + 0.1, z + out], [x + 0.46, yb + 0.1, z + out], [x + 0.46, yb + 1.17, z + 0.03], [x - 0.46, yb + 1.17, z + 0.03], st.shut, 3, null, null, null, null, [0, 0], [1, 0], [1, 1], [0, 1]);
      beam(A, [x + 0.3, yb, z + 0.04], [x + 0.3, yb + 0.12, z + out], 0.03, 0.03, teakD, 1);
    }
    if (r.chance(0.3)) { box(A, x, yb - 0.3, z + 0.16, 0.9, 0.16, 0.2, C.terra, 11); clump(A, r, x, yb + 0.0, z + 0.18, 0.42, 0.1, 0.09, r.pick([C.boug, C.orchidW, C.marigold, C.leaf]), 5, { piece: [0.1, 0.16] }); }
  }
  // the side wall that faces a gap (and the arriving boat): windows with shutters, a small tin hood, a flower box
  if (o.side) {
    const sd = o.side, xw = sd * (hw - 0.09), span = D + zf - 1.6, nw = Math.max(1, Math.round(span / 2.5)), r0 = r;
    if (o.sideR) r = o.sideR;
    for (let f = 0; f < fl; f++) for (let i = 0; i < nw; i++) {
      const zc = zf - 0.8 - span * (i + 0.5) / nw, yb = deckY + f * wh + 0.95;
      quadO(A, [xw, yb, zc - 0.45], [xw, yb, zc + 0.45], [xw, yb + 1.15, zc + 0.45], [xw, yb + 1.15, zc - 0.45], [0, yb, zc], C.dark, 12);
      box(A, xw + sd * 0.04, yb - 0.07, zc, 0.14, 0.07, 1.12, trim, 0); box(A, xw + sd * 0.03, yb + 1.15, zc, 0.1, 0.09, 1.12, trim, 0);
      for (const e of [-1, 1]) { const b = r.range(0.25, 1.2); panel(A, [xw + sd * 0.02, yb, zc + e * 0.46], [xw + sd * (0.02 + 0.45 * Math.sin(b)), yb, zc + e * (0.46 + 0.45 * Math.cos(b))], 1.15, st.shut, 3); }
      if (f === 0 || r.chance(0.5)) quadO(A, [xw, yb + 1.62, zc - 0.75], [xw, yb + 1.62, zc + 0.75], [xw + sd * 0.7, yb + 1.3, zc + 0.75], [xw + sd * 0.7, yb + 1.3, zc - 0.75], [xw, yb, zc], mul(r.pick(C.roofs), 0.95), 2, null, null, null, null, [0, 0], [1.5, 0], [1.5, 0.77], [0, 0.77]);
      if (r.chance(0.45)) { box(A, xw + sd * 0.16, yb - 0.3, zc, 0.2, 0.16, 0.9, C.terra, 11); clump(A, r, xw + sd * 0.18, yb, zc, 0.09, 0.1, 0.42, r.pick([C.boug, C.orchidW, C.marigold, C.orchid]), 5, { piece: [0.1, 0.16] }); }
    }
    box(A, sd * (hw - 0.1), deckY + (fl > 1 ? wh - 0.08 : H - 0.2), (zf - D) / 2, 0.07, 0.16, D + zf, trim, 0);
    r = r0;
  }
  // balcony on two-storey houses, with washing over the rail
  if (o.balcony) {
    const by = deckY + wh, bz = zf + 1.0;
    box(A, 0, by - 0.1, zf + 0.5, W - 0.5, 0.1, 1.0, C.teak, 1, { bottom: true });
    box(A, 0, by + 0.8, bz - 0.04, W - 0.5, 0.07, 0.08, trim, 0);
    for (let x = -hw + 0.3; x <= hw - 0.28; x += 0.42) box(A, x, by, bz - 0.04, 0.045, 0.8, 0.045, trim, 0, { noTop: true });
    for (const sx of [-1, 1]) { box(A, sx * (hw - 0.3), deckY, bz - 0.06, 0.1, wh - 0.1, 0.1, C.pile, 1, { noTop: true }); }
    for (let x = -hw + 0.6; x < hw - 1.2; x += r.range(0.9, 1.7)) if (r.chance(0.6)) cloth(A, [x, by + 0.88, bz + 0.03], [x + r.range(0.5, 0.8), by + 0.88, bz + 0.03], r.range(0.5, 0.9), 2, r.pick(C.wash), r(), 0.01, 0.1);
  }
  // veranda rail, with a gap where the steps go down into the water
  const xs = r.range(-hw + 1.3, hw - 1.3), railY = deckY + 0.82;
  if (o.rail) for (const [xa, xb] of [[-hw + 0.06, xs - 0.6], [xs + 0.6, hw - 0.06]]) {
    if (xb - xa < 0.5) continue;
    box(A, (xa + xb) / 2, railY, -0.07, xb - xa, 0.07, 0.09, trim, 0); box(A, (xa + xb) / 2, deckY + 0.12, -0.07, xb - xa, 0.05, 0.06, trim, 0);
    const nb = Math.round((xb - xa) / 0.36);
    for (let k = 0; k <= nb; k++) { const pw = k % 4 === 0 ? 0.09 : 0.045; box(A, xa + (xb - xa) * k / nb, deckY, -0.07, pw, 0.82, pw, trim, 0, { noTop: true }); }
    if (r.chance(0.35)) cloth(A, [xa + 0.3, railY + 0.08, -0.02], [xa + 1.2, railY + 0.08, -0.02], 0.7, 2, r.pick(C.wash), r(), 0.01, 0.08);
  }
  const nst = Math.floor((deckY + 0.05) / 0.3);
  for (let k = 0; k < nst; k++) box(A, xs, deckY - (k + 1) * 0.3 - 0.06, 0.12 + k * 0.1, 1.05, 0.06, 0.26, C.teak, 1, { bottom: true });
  for (const sx of [-1, 1]) beam(A, [xs + sx * 0.56, deckY - 0.1, 0.0], [xs + sx * 0.56, -0.25, 0.14 + nst * 0.1], 0.06, 0.2, C.pile, 1);
  // tin awning on posts, fretwork fascia
  const yA = deckY + 2.5, yB = deckY + 2.02, z1 = 0.3, tinC = mul(r.pick(C.roofs), r.range(0.8, 1.1));
  if (o.awning) {
    const sl = Math.hypot(z1 - zf, yA - yB);
    quad(A, [-hw, yB, z1], [hw, yB, z1], [hw, yA, zf], [-hw, yA, zf], tinC, 2, null, null, null, null, [0, 0], [W, 0], [W, sl], [0, sl]);
    for (const x of [-hw + 0.12, xs - 0.62, xs + 0.62, hw - 0.12]) box(A, x, deckY, 0.0, 0.09, yB - deckY - 0.02, 0.09, trim, 0, { noTop: true });
    quad(A, [-hw, yB - 0.27, z1], [hw, yB - 0.27, z1], [hw, yB, z1], [-hw, yB, z1], trim, 10, null, null, null, null, [0, 0], [W / 0.34, 0], [W / 0.34, 1], [0, 1]);
  }
  // roof
  const yR = deckY + H, roofC = mul(r.pick(C.roofs), r.range(0.8, 1.1)), xe = hw + 0.35;
  let top;
  if (o.gableFront) {
    const rise = r.range(2.0, 3.0), zA = zf + 0.8, zB = -D - 0.3, sl = Math.hypot(xe, rise + 0.2);
    for (const sx of [-1, 1]) {
      quadO(A, [sx * xe, yR - 0.2, zA], [sx * xe, yR - 0.2, zB], [0, yR + rise, zB], [0, yR + rise, zA], [0, yR - 3, (zA + zB) / 2], roofC, 2, null, null, null, null, [0, 0], [zA - zB, 0], [zA - zB, sl], [0, sl]);
      beam(A, [sx * (xe + 0.04), yR - 0.3, zA + 0.05], [0, yR + rise + 0.06, zA + 0.05], 0.07, 0.26, trim, 0);
    }
    for (const zg of [zf, -D]) quadO(A, [-hw + 0.12, yR, zg], [hw - 0.12, yR, zg], [0.01, yR + rise - 0.1, zg], [-0.01, yR + rise - 0.1, zg], [0, yR, (zf - D) / 2], wall, 0);
    panel(A, [-0.38, yR + 0.2, zf + 0.03], [0.38, yR + 0.2, zf + 0.03], 0.8, st.shut, 3);
    spike(A, 0, yR + rise, zA, 0.12, 0.12, 0.75, trim, 0);
    top = yR + rise;
  } else {
    const rise = r.range(1.4, 2.2), zA = zf + 0.7, zB = -D - 0.4, zm = (zA + zB) / 2, sl = Math.hypot(zA - zm, rise + 0.2);
    quad(A, [-xe, yR - 0.2, zA], [xe, yR - 0.2, zA], [xe, yR + rise, zm], [-xe, yR + rise, zm], roofC, 2, null, null, null, null, [0, 0], [2 * xe, 0], [2 * xe, sl], [0, sl]);
    quad(A, [xe, yR - 0.2, zB], [-xe, yR - 0.2, zB], [-xe, yR + rise, zm], [xe, yR + rise, zm], mul(roofC, 0.9), 2, null, null, null, null, [0, 0], [2 * xe, 0], [2 * xe, sl], [0, sl]);
    for (const sx of [-1, 1]) quadO(A, [sx * (hw - 0.12), yR, zf], [sx * (hw - 0.12), yR, -D], [sx * (hw - 0.12), yR + rise - 0.1, zm - 0.01], [sx * (hw - 0.12), yR + rise - 0.1, zm + 0.01], [0, yR, zm], wall, 0);
    quad(A, [-xe, yR - 0.48, zA], [xe, yR - 0.48, zA], [xe, yR - 0.2, zA], [-xe, yR - 0.2, zA], trim, 10, null, null, null, null, [0, 0], [2 * xe / 0.34, 0], [2 * xe / 0.34, 1], [0, 1]);
    box(A, 0, yR + rise - 0.03, zm, 2 * xe, 0.08, 0.3, mul(roofC, 0.8), 2);
    top = yR + rise;
  }
  // roof clutter: dish, tank, bougainvillea pouring over the eave
  if (r.chance(0.3)) { const dx = r.range(-hw + 0.8, hw - 0.8); box(A, dx, yR, zf - 0.8, 0.05, top - yR + 0.7, 0.05, C.steel, 11, { noTop: true }); lathe(A, dx, top + 0.55, zf - 0.8, [[0, 0.05], [0.12, 0.34], [0.16, 0.4]], C.white, 11, 8, false); }
  if (r.chance(0.4)) {
    const bx = r.sign() * (hw - 0.9), bc = r.chance(0.75) ? C.boug : r.pick([C.bougO, C.orchidW]), s0 = A.count, by = o.awning ? yB : yR - 0.3, bz = o.awning ? z1 : zf + 0.7;
    clump(A, r, bx, by + 0.28, bz - 0.85, 0.95, 0.22, 0.8, bc, 13); clump(A, r, bx - 0.4, by + 0.55, bz - 1.8, 0.7, 0.24, 0.6, bc, 8);
    clump(A, r, bx + 0.15, by - 0.2, bz - 0.02, 0.75, 0.3, 0.16, bc, 9, { piece: [0.14, 0.23] });
    for (let k = 0; k < 4; k++) strand(A, r, bx + r.range(-0.85, 0.95), by - 0.35, bz + r.range(-0.05, 0.08), r.range(0.5, 1.25), bc);
    setSway(A, s0, 0.035, r());
  }
  // things hanging under the eave: orchid baskets, a bird cage, lanterns
  const hy = o.awning ? yB - 0.3 : yR - 0.5, hz = o.awning ? z1 - 0.16 : zf + 0.55;
  for (let x = -hw + 0.5 + r.range(0, 0.5); x < hw - 0.4; x += r.range(1.0, 1.7)) {
    const t = r(), s0 = A.count, len = r.range(0.25, 0.5);
    if (Math.abs(x - xs) < 0.7 && !o.awning) continue;
    box(A, x, hy - len, hz, 0.018, len, 0.018, C.dark, 11, { noTop: true });
    if (t < 0.56) {
      const fc = r.pick([C.orchid, C.orchid, C.orchidW, C.boug]);
      box(A, x, hy - len - 0.17, hz, 0.24, 0.17, 0.24, C.pile, 1, { taper: 1.35 });
      clump(A, r, x, hy - len + 0.08, hz, 0.17, 0.08, 0.17, fc, 4, { piece: [0.1, 0.15], leaf: 0.35 }); strand(A, r, x + r.range(-0.12, 0.12), hy - len - 0.14, hz + 0.05, r.range(0.3, 0.6), fc);
    } else if (t < 0.7) {
      box(A, x, hy - len - 0.36, hz, 0.26, 0.3, 0.26, C.ochre, 11, { taper: 0.92 }); spike(A, x, hy - len - 0.06, hz, 0.28, 0.28, 0.14, C.ochre, 11);
    } else if (t < 0.92) {
      box(A, x, hy - len - 0.3, hz, 0.2, 0.28, 0.2, r.pick([C.red, C.marigold, C.jasmine]), 13, { taper: 0.9 }); box(A, x, hy - len - 0.44, hz, 0.04, 0.14, 0.04, C.gold, 5);
    }
    setSway(A, s0, 0.055, r());
  }
  // on the deck: glazed water jars, a row of pots, crates, washing on a line
  for (let j = r.int(1, 2); j > 0; j--) { const jx = r.range(-hw + 0.5, hw - 0.5), sc = r.range(0.8, 1.15); lathe(A, jx, deckY, zf + 0.42, [[0, 0.2 * sc], [0.28 * sc, 0.36 * sc], [0.6 * sc, 0.31 * sc], [0.72 * sc, 0.2 * sc]], mul(C.jar, r.range(0.8, 1.5)), 11); }
  const px0 = r.range(-hw + 0.4, 0), pn = r.int(3, 6);
  for (let j = 0; j < pn; j++) { const x = px0 + j * 0.34; if (x > hw - 0.3) break; box(A, x, deckY, -0.3, 0.2, 0.2, 0.2, C.terra, 11, { taper: 1.25 }); const ph2 = r.range(0.16, 0.3), c0 = A.count, pc = mul(r.pick([C.orchid, C.orchidW, C.banana, C.boug, C.marigold]), r.range(0.8, 1.15)); blob(A, r, x, deckY + 0.24 + ph2 * 0.6, -0.3, 0.17, ph2, 0.17, pc); A.count = c0;
    clump(A, rngAt(A, x, deckY, -0.3, 'pot'), x, deckY + 0.36, -0.3, 0.13, 0.12, 0.13, pc, 4, { piece: [0.07, 0.11], petals: 4, leaf: 0.3 }); }
  if (r.chance(0.5)) { const cx = r.range(-hw + 0.6, hw - 0.6); box(A, cx, deckY, zf + 0.5, 0.6, 0.42, 0.5, C.teak, 1); if (r.chance(0.5)) box(A, cx + 0.05, deckY + 0.42, zf + 0.5, 0.5, 0.36, 0.44, mul(C.teak, 1.2), 1); }
  if (o.awning && r.chance(0.55)) {
    const ly = yB + 0.12, lz = -0.55, xa = -hw + 0.3, xb = hw - 0.3;
    wire(A, [xa, ly, lz], [xb, ly, lz], 0.06, 4, C.dark);
    for (let x = xa + 0.3; x < xb - 0.9; x += r.range(0.75, 1.2)) cloth(A, [x, ly - 0.04, lz], [x + r.range(0.45, 0.7), ly - 0.04, lz], r.range(0.55, 0.95), 2, r.pick(C.wash), r(), 0.01, 0.12);
  }
  A.resetT();
  return { top, xs, color: wall };
}

// ---------- gaps between houses: piers with a spirit house, market stalls, gardens, bridge landings ----------
function gapLot(A, r, B, o, C) {
  const W = o.W, hw = W / 2, c = Math.cos(B.rot), s = Math.sin(B.rot), out = {};
  const toW = (x, y, z) => [B.x + x * c + z * s, y, B.z - x * s + z * c];
  A.setT(B.x, 0, B.z, B.rot, 1);
  box(A, 0, -1.2, -7.2, W + 1.6, 1.78, 10, C.earth, 8, { taper: 0.97 });
  { // the bank is held by a plank revetment on piles, so the lot never reads as a bare slab of earth
    const zr = o.kind === 'pier' || o.kind === 'market' || o.kind === 'landing' ? -2.12 : 0.36;
    box(A, 0, -1.2, zr, W + 1.5, 1.72, 0.1, C.pile, 1, { ao: 0.7 }); box(A, 0, 0.5, zr + 0.02, W + 1.5, 0.1, 0.2, mul(C.pile, 1.15), 1);
    for (let k = 0; k < 4; k++) box(A, -hw - 0.5 + (W + 1.0) * k / 3, -1.3, zr + 0.15, 0.2, 2.1, 0.2, mul(C.pile, 0.9), 1, { ao: 0.65 });
  }
  if (o.kind === 'pier' || o.kind === 'market' || o.kind === 'landing') {
    const dy = o.kind === 'landing' ? 1.2 : 0.95, len = o.kind === 'market' ? 2.7 : 3.4;
    box(A, 0, dy - 0.12, -(len + 0.3) / 2, W - 0.3, 0.12, len + 0.3, C.teak, 1, { bottom: true, ao: 0.6 });
    for (const sx of [-1, 1]) for (const z of [-0.15, -len]) box(A, sx * (hw - 0.35), -1.3, z, 0.18, dy + 1.18, 0.18, C.pile, 1, { noTop: true, ao: 0.65 });
    if (o.kind === 'pier') {
      if (o.spirit) { spiritHouse(A, r, -hw + 0.8, dy, -1.7, C); out.spirit = toW(-hw + 0.54, dy + 1.5, -1.42); }
      lathe(A, hw - 0.95, dy, -1.4, [[0, 0.3], [0.3, 0.46], [0.42, 0.42]], mul(C.jar, 1.7), 11);
      box(A, hw - 0.95, dy + 0.4, -1.4, 0.62, 0.03, 0.62, C.leaf, 7); spike(A, hw - 0.85, dy + 0.43, -1.35, 0.13, 0.13, 0.32, C.lotus, 11);
      const ph = r.range(2.2, 2.9); box(A, hw - 0.22, -1.3, 0.3, 0.2, ph + 1.3, 0.2, C.pile, 1, { taper: 0.85, ao: 0.65 }); out.post = toW(hw - 0.22, ph, 0.3);
      for (let k = 0; k < 3; k++) box(A, -0.2, dy - (k + 1) * 0.3 - 0.06, 0.13 + k * 0.1, 1.0, 0.06, 0.26, C.teak, 1, { bottom: true });
      out.steps = toW(-0.2, 0.12, 0.3);
    } else if (o.kind === 'market') {
      const cc = C.parasol[o.i % 4], yc = dy + 2.15, ph = r();
      for (const sx of [-1, 1]) for (const z of [-0.06, -len + 0.2]) box(A, sx * (hw - 0.3), dy, z, 0.07, z > -0.5 ? 1.82 : 2.12, 0.07, C.pile, 1, { noTop: true });
      quad(A, [-hw + 0.1, yc - 0.32, 0.28], [hw - 0.1, yc - 0.32, 0.28], [hw - 0.1, yc, -len + 0.2], [-hw + 0.1, yc, -len + 0.2], cc, 4, null, null, null, null, [ph, 0], [ph, 0], [ph, 1], [ph, 1]);
      cloth(A, [-hw + 0.1, yc - 0.32, 0.29], [hw - 0.1, yc - 0.32, 0.29], 0.26, 1, mul(cc, 1.15), ph, 0.02, 0.09);
      let k = 0;
      for (let x = -hw + 0.55; x < hw - 0.4; x += 0.62) { box(A, x, dy, -0.5, 0.52, 0.3, 0.5, C.teak, 1); clump(A, r, x, dy + 0.37, -0.5, 0.17, 0.05, 0.16, C.cargo[(o.i + k++) % 3], 5, { piece: [0.085, 0.12], leaf: 0.08, m: 11 }); }
      box(A, 0, dy, -1.6, W - 1.2, 0.8, 0.7, mul(C.teak, 1.15), 1); clump(A, r, 0, dy + 0.88, -1.6, (W - 1.5) / 2, 0.06, 0.24, C.cargo[(o.i + 1) % 3], Math.round(W * 3), { piece: [0.09, 0.13], leaf: 0.08, m: 11 });
      const s0 = A.count; box(A, hw - 0.5, yc - 0.75, 0.1, 0.18, 0.24, 0.18, r.pick([C.red, C.marigold]), 13, { taper: 0.9 }); setSway(A, s0, 0.05, r());
    }
  } else {
    box(A, 0, -1.2, -1.0, W + 0.3, 1.75, 2.6, C.earth, 8, { taper: 0.9 });
    banana(A, r, r.range(-0.6, 0.6), 0.5, -1.5, r.range(0.9, 1.2), C);
    for (let k = 0; k < 3; k++) { const s0 = A.count, bh = r.range(0.45, 0.85); clump(A, r, r.range(-hw + 0.5, hw - 0.5), 0.5 + bh * 0.5, r.range(-1.1, -0.45), r.range(0.35, 0.6), bh * 0.42, r.range(0.3, 0.5), r.pick([C.leaf, C.boug, C.marigold, C.orchidW]), 7, { leaf: 0.4 }); setSway(A, s0, 0.02, r()); }
    for (let x = -hw + 0.15; x <= hw - 0.1; x += 0.3) box(A, x, 0.2, -0.22, 0.06, 0.75, 0.04, C.white, 0, { noTop: true });
    box(A, 0, 0.72, -0.22, W - 0.2, 0.05, 0.05, C.white, 0);
  }
  banana(A, r, r.range(-hw, hw) * 0.6, 0.55, r.range(-6.0, -4.2), r.range(1.0, 1.45), C);
  if (o.pole) {
    const px = hw - 0.45, top = 8.4;
    box(A, px, 0.4, -1.0, 0.22, top - 0.4, 0.22, C.concrete, 6, { taper: 0.7, noTop: true });
    box(A, px, top - 0.75, -1.0, 0.1, 0.1, 1.5, C.teakD, 1); box(A, px, top - 1.9, -1.0, 0.3, 0.5, 0.36, C.steel, 6);
    out.pole = [toW(px, top - 0.62, -0.35), toW(px, top - 0.62, -1.0), toW(px, top - 0.62, -1.65)];
  }
  A.resetT();
  return out;
}
function backHouse(A, r, B, W, D, H, wall, roofC, C, base = 0.5) {
  A.setT(B.x, 0, B.z, B.rot, 1);
  if (base > 1) for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(A, sx * (W / 2 - 0.3), -1.3, sz * (D / 2 - 0.3), 0.24, base + 1.3, 0.24, C.pile, 1, { noTop: true, ao: 0.65 });
  box(A, 0, base, 0, W, H, D, wall, 0, { noTop: true, ao: 0.7, bottom: base > 1 });
  const rise = r.range(1.5, 2.6), xe = W / 2 + 0.4, ze = D / 2 + 0.4, yR = base + H, sl = Math.hypot(ze, rise);
  quad(A, [-xe, yR - 0.15, ze], [xe, yR - 0.15, ze], [xe, yR + rise, 0], [-xe, yR + rise, 0], roofC, 2, null, null, null, null, [0, 0], [2 * xe, 0], [2 * xe, sl], [0, sl]);
  quad(A, [xe, yR - 0.15, -ze], [-xe, yR - 0.15, -ze], [-xe, yR + rise, 0], [xe, yR + rise, 0], mul(roofC, 0.9), 2, null, null, null, null, [0, 0], [2 * xe, 0], [2 * xe, sl], [0, sl]);
  for (const sx of [-1, 1]) quadO(A, [sx * W / 2, yR, D / 2], [sx * W / 2, yR, -D / 2], [sx * W / 2, yR + rise - 0.1, -0.01], [sx * W / 2, yR + rise - 0.1, 0.01], [0, yR, 0], wall, 0);
  const nw = Math.max(2, Math.round(W / 2.5));
  for (let i = 0; i < nw; i++) { const x = -W / 2 + W * (i + 0.5) / nw; for (let y = base + 1.2; y + 1.3 < yR; y += 2.7) quad(A, [x - 0.45, y, D / 2 + 0.03], [x + 0.45, y, D / 2 + 0.03], [x + 0.45, y + 1.2, D / 2 + 0.03], [x - 0.45, y + 1.2, D / 2 + 0.03], C.dark, 12); }
  // gable ends and the back wall: shuttered windows under small tin hoods, so no wall that faces the water is blank
  const shut = mul(r.pick([C.teal, C.cream, C.blueD, C.white, C.teakD]), 0.95), y = base + 1.2, two = y + 3.9 < yR;
  for (const sx of [-1, 1]) for (let i = 0, nz = D > 6 ? 2 : 1; i < nz; i++) for (let f = 0; f < (two ? 2 : 1); f++) {
    const xw = sx * (W / 2 + 0.03), zc = -D / 2 + D * (i + 0.5) / nz, yb = y + f * 2.7;
    quadO(A, [xw, yb, zc - 0.45], [xw, yb, zc + 0.45], [xw, yb + 1.2, zc + 0.45], [xw, yb + 1.2, zc - 0.45], [0, yb, zc], C.dark, 12);
    for (const e of [-1, 1]) { const b = r.range(0.25, 1.2); panel(A, [xw + sx * 0.02, yb, zc + e * 0.46], [xw + sx * (0.02 + 0.45 * Math.sin(b)), yb, zc + e * (0.46 + 0.45 * Math.cos(b))], 1.2, shut, 3); }
    box(A, xw + sx * 0.04, yb - 0.08, zc, 0.14, 0.08, 1.14, mul(shut, 1.1), 0);
    if (f === 0 || two) quadO(A, [xw, yb + 1.68, zc - 0.78], [xw, yb + 1.68, zc + 0.78], [xw + sx * 0.72, yb + 1.34, zc + 0.78], [xw + sx * 0.72, yb + 1.34, zc - 0.78], [xw, yb, zc], mul(roofC, 0.95), 2, null, null, null, null, [0, 0], [1.56, 0], [1.56, 0.8], [0, 0.8]);
  }
  for (let i = 0; i < nw; i++) {
    const x = -W / 2 + W * (i + 0.5) / nw, zb = -D / 2 - 0.03;
    if (i % 2) { panel(A, [x + 0.46, y, zb], [x - 0.46, y, zb], 1.2, shut, 3); continue; }
    quad(A, [x + 0.45, y, zb], [x - 0.45, y, zb], [x - 0.45, y + 1.2, zb], [x + 0.45, y + 1.2, zb], C.dark, 12);
    for (const e of [-1, 1]) { const b = r.range(0.25, 1.2); panel(A, [x + e * 0.46, y, zb - 0.02], [x + e * (0.46 + 0.45 * Math.cos(b)), y, zb - 0.02 - 0.45 * Math.sin(b)], 1.2, shut, 3); }
  }
  A.resetT();
  return yR + rise;
}

// ---------- footbridges. Local X spans the canal, +Z faces the arriving boat ----------
function bridge(A, r, B, o, C, bulbs) {
  const c = Math.cos(B.rot), s = Math.sin(B.rot), toW = (x, y, z) => [B.x + x * c + z * s, y, B.z - x * s + z * c];
  A.setT(B.x, 0, B.z, B.rot, 1);
  const type = o.type, half = o.hw + 1.7, wd = 1.9, sof = o.soffit, seg = 12, endY = 1.3, arch = type === 'arch', a = o.hw + 0.25;
  const deckC = arch ? C.stucco : C.teak, dm = arch ? 6 : 1, railC = type === 'flat' ? o.pipe : arch ? C.white : mul(C.teakR, 1.15);
  const topY = (x) => { const t = Math.abs(x) / half;
    if (type === 'hump') return sof + 0.22 - (sof + 0.22 - endY) * Math.pow(t, 2.3);
    if (arch) return sof + 0.55 - 0.3 * t * t;
    return t < 0.7 ? sof + 0.2 : sof + 0.2 - (sof + 0.2 - endY) * (t - 0.7) / 0.3; };
  const archY = (x) => sof * Math.sqrt(Math.max(0, 1 - (x / a) * (x / a)));
  const arcS = (x) => { const th = Math.asin(Math.max(-1, Math.min(1, x / a))); return 30 + th * (a + sof) / 2; };   // metres round the barrel, near enough (never under 20, so uv.x cannot be mistaken for a sway phase)
  const lampC = [C.red, C.marigold, L('#3fa05a'), L('#4a8ae0'), L('#ec5a94')];
  for (let i = 0; i < seg; i++) {
    const x0 = -half + 2 * half * i / seg, x1 = -half + 2 * half * (i + 1) / seg, y0 = topY(x0), y1 = topY(x1), xm = (x0 + x1) / 2, ins = [xm, (y0 + y1) / 2 - 0.1, 0];
    quad(A, [x0, y0, wd / 2], [x1, y1, wd / 2], [x1, y1, -wd / 2], [x0, y0, -wd / 2], deckC, dm);
    if (arch) {
      // the barrel is cut four times finer than the deck so that it reads as a curve from the boat passing under it; its
      // soffit carries smooth normals and uv = (metres round the arch, 2 + nearness to the springing), which the concrete
      // shader turns into formwork board marks and a damp band low on both sides
      for (let j = 0; j < 4; j++) {
        const xa = x0 + (x1 - x0) * j / 4, xb = x0 + (x1 - x0) * (j + 1) / 4, ya = topY(xa), yb = topY(xb), xc = (xa + xb) / 2;
        const u0 = Math.abs(xa) < a ? archY(xa) : -1.3, u1 = Math.abs(xb) < a ? archY(xb) : -1.3;
        for (const z of [wd / 2, -wd / 2]) quadO(A, [xa, u0, z], [xb, u1, z], [xb, yb, z], [xa, ya, z], [xc, (ya + u0) / 2, 0], C.stucco, 6);
        const sA = arcS(xa), sB = arcS(xb), tA = Math.min(1, Math.abs(xa) / a), tB = Math.min(1, Math.abs(xb) / a), i0 = A.count;
        quadO(A, [xa, u0, wd / 2], [xb, u1, wd / 2], [xb, u1, -wd / 2], [xa, u0, -wd / 2], [xc, 99, 0], mul(C.stucco, 0.75), 6, null, null, null, null, [sA, 2 + tA], [sB, 2 + tB], [sB, 2 + tB], [sA, 2 + tA]);
        if (Math.abs(xa) < a && Math.abs(xb) < a) for (let v = i0; v < A.count; v++) {
          const lx = Math.abs(A.uv[v * 2] - sA) < 1e-5 ? xa : xb, ly = archY(lx); let nx = -lx / (a * a), ny = -Math.max(ly, 0.3) / (sof * sof); const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
          A.nrm[v * 3] = nx * A.c; A.nrm[v * 3 + 1] = ny; A.nrm[v * 3 + 2] = -nx * A.s;
        }
      }
      for (const z of [wd / 2 - 0.08, -wd / 2 + 0.08]) { quadO(A, [x0, y0, z], [x1, y1, z], [x1, y1 + 0.78, z], [x0, y0 + 0.78, z], [xm, y0, 0], C.white, 6); quadO(A, [x0, y0, z], [x1, y1, z], [x1, y1 + 0.78, z], [x0, y0 + 0.78, z], [xm, y0, z * 3], C.white, 6); }
    } else {
      quadO(A, [x0, y0 - 0.2, wd / 2], [x1, y1 - 0.2, wd / 2], [x1, y1 - 0.2, -wd / 2], [x0, y0 - 0.2, -wd / 2], [xm, 99, 0], mul(C.pile, 1.15), 1);
      for (const z of [wd / 2, -wd / 2]) quadO(A, [x0, y0 - 0.2, z], [x1, y1 - 0.2, z], [x1, y1, z], [x0, y0, z], ins, C.pile, 1);
      for (const z of [0.55, -0.55]) beam(A, [x0, y0 - 0.3, z], [x1, y1 - 0.3, z], 0.14, 0.2, mul(C.pile, 0.85), 1);
      for (const z of [wd / 2 - 0.06, -wd / 2 + 0.06]) {
        beam(A, [x0, y0 + 0.85, z], [x1, y1 + 0.85, z], 0.07, 0.07, railC, 0);
        if (type !== 'hump') beam(A, [x0, y0 + 0.45, z], [x1, y1 + 0.45, z], 0.05, 0.05, railC, 0);
        else beam(A, [x0, y0 + 0.1, z], [x1, y1 + 0.85, z], 0.04, 0.04, railC, 0);
      }
    }
    for (const z of [wd / 2 - 0.06, -wd / 2 + 0.06]) {
      if (!arch) box(A, x0, y0, z, 0.08, 0.9, 0.08, railC, 0, { noTop: true });
      else if (i % 3 === 1) { const s0 = A.count; box(A, x0, y0 + 0.78, z, 0.3, 0.24, 0.3, C.terra, 11, { taper: 1.2 }); const pc = r.chance(0.8) ? C.boug : C.bougO; clump(A, r, x0, y0 + 1.22, z, 0.36, 0.2, 0.28, pc, 6, { piece: [0.15, 0.24] }); strand(A, r, x0 + r.range(-0.2, 0.2), y0 + 1.0, z + (z > 0 ? 0.24 : -0.24), r.range(0.5, 0.9), pc); setSway(A, s0 + 30, 0.02, r()); }
      const lc = lampC[(i + (z > 0 ? 0 : 2)) % 5], ly = y0 + (arch ? 0.84 : 0.95);
      box(A, x0, ly, z, 0.09, 0.11, 0.09, lc, 13); if (bulbs && i % 2 === 0) bulbs.push(toW(x0, ly + 0.05, z), lc);
    }
  }
  if (arch) {
    for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) box(A, sx * (half + 0.25 + k * 0.5), -1.3, 0, 0.5, sof + 0.25 - k * 0.5 + 1.3, wd, C.stucco, 6);
    // creepers hang from the ring low on both sides, clear of the boat's box
    const vr = rngAt(A, 0, sof, 0, 'archvine');
    for (const [vx, vz] of [[-4.05, 1], [-3.45, -1], [-3.1, 1], [3.05, -1], [3.5, 1], [3.95, -1], [4.15, 1], [-3.8, -1]]) {
      const s0 = A.count, z = vz * (wd / 2 + 0.03), y = archY(vx) - 0.02, len = vr.range(0.45, 1.0);
      strand(A, vr, vx, y, z, Math.min(len, y - 1.75), mul(LEAF_C, vr.range(1.5, 2.3)));
      if (vr.chance(0.6)) clump(A, vr, vx, y + 0.02, z, 0.22, 0.08, 0.1, mul(LEAF_C, 2.0), 4, { leaf: 1, piece: [0.1, 0.16] });   // sprays of leaves, not lumps: a lump in the arch's shade reads as a stone
      setSway(A, s0, 0.035, vr());
    }
  } else {
    for (const sx of [-1, 1]) for (const z of [wd / 2 - 0.1, -wd / 2 + 0.1]) { box(A, sx * (o.hw - 0.12), -1.3, z, 0.2, topY(o.hw - 0.12) + 1.1, 0.2, C.pile, 1, { noTop: true, ao: 0.65 }); box(A, sx * half, -1.3, z, 0.2, endY + 1.1, 0.2, C.pile, 1, { noTop: true, ao: 0.65 }); }
    for (const sx of [-1, 1]) beam(A, [sx * (o.hw - 0.12), 0.4, 0], [sx * (o.hw - 0.12), topY(o.hw - 0.12) - 0.3, 0], 0.08, 0.08, C.pile, 1);
  }
  if (type === 'roofed') {
    const xr = half * 0.7, yd = sof + 0.2, roofC = mul(C.tinRust, 1.1);
    for (const sx of [-1, 1]) for (const z of [wd / 2 - 0.06, -wd / 2 + 0.06]) for (const f of [0.15, 0.95]) box(A, sx * xr * f, yd, z, 0.09, 2.15, 0.09, C.teakD, 1, { noTop: true });
    quad(A, [-xr - 0.4, yd + 2.1, wd / 2 + 0.35], [xr + 0.4, yd + 2.1, wd / 2 + 0.35], [xr + 0.4, yd + 2.85, 0], [-xr - 0.4, yd + 2.85, 0], roofC, 2, null, null, null, null, [0, 0], [2 * xr, 0], [2 * xr, 1.5], [0, 1.5]);
    quad(A, [xr + 0.4, yd + 2.1, -wd / 2 - 0.35], [-xr - 0.4, yd + 2.1, -wd / 2 - 0.35], [-xr - 0.4, yd + 2.85, 0], [xr + 0.4, yd + 2.85, 0], roofC, 2, null, null, null, null, [0, 0], [2 * xr, 0], [2 * xr, 1.5], [0, 1.5]);
    quad(A, [-xr - 0.4, yd + 1.84, wd / 2 + 0.35], [xr + 0.4, yd + 1.84, wd / 2 + 0.35], [xr + 0.4, yd + 2.1, wd / 2 + 0.35], [-xr - 0.4, yd + 2.1, wd / 2 + 0.35], C.cream, 10, null, null, null, null, [0, 0], [2 * xr / 0.34, 0], [2 * xr / 0.34, 1], [0, 1]);
  }
  A.resetT();
}
function sluice(A, B, hw, C) {
  A.setT(B.x, 0, B.z, B.rot, 1);
  const r = makeRng('ksluice'), pitch = [0.035, 0.045, 0.03], algae = [0.05, 0.085, 0.03], rustC = L('#6a3a1c'), grn = L('#3fa05a');
  for (const sx of [-1, 1]) {
    const px = sx * (hw + 1.0), fx = (y) => sx * (hw + 0.2 + 0.08 * (y + 1.3) / 9.7 - 0.014), fz = (y) => 1.15 - 0.115 * (y + 1.3) / 9.7 + 0.014;
    box(A, px, -1.3, 0, 1.6, 9.7, 2.3, C.concrete, 6, { taper: 0.9 });
    box(A, sx * (hw + 0.1), -1.3, 0, 0.3, 8.9, 0.5, mul(C.steel, 0.6), 6, { noTop: true });
    box(A, sx * (hw + 3.4), -1.3, 0, 3.4, 3.1, 1.0, C.concrete, 6);
    box(A, px, 8.4, 0.9, 0.08, 1.0, 0.08, C.steel, 11); box(A, px, 8.9, 0.5, 0.1, 0.12, 0.1, sx > 0 ? C.red : grn, 13);
    // the face on the canal (x = fx) and the face we come at (z = fz): a pitch-black tide coat with a ragged edge, pour
    // lines, runs of rust and algae from every joint, timber fenders, a depth gauge, striped gate guides
    const face = (k, u0, u1, y0, y1, c0, c1, m = 6, off = 0) => {      // k 0: canal face, u runs along z; k 1: south face, u runs along x
      const P = (u, y) => (k ? [px + u, y, fz(y) + off] : [fx(y) - sx * off, y, u]);
      quadO(A, P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1), [px, (y0 + y1) / 2, 0], c0, m, c0, c0, c1, c1);
    };
    for (const k of [0, 1]) {
      const half = k ? 0.76 : 1.1, nT = k ? 5 : 7;
      for (let i = 0; i < nT; i++) { const u0 = -half + 2 * half * i / nT, top = 1.05 + 0.5 * r(), ca = mix3(pitch, algae, 0.7); face(k, u0, u0 + 2 * half / nT, -0.6, top, pitch, ca); face(k, u0, u0 + 2 * half / nT, top, top + 0.45, ca, mul(C.concrete, 0.82)); }
      for (const y of [2.55, 5.0]) face(k, -half, half, y, y + 0.05, mul(C.concrete, 0.5), mul(C.concrete, 0.5), 6, 0.004);
      for (let i = 0; i < (k ? 4 : 7); i++) {
        const u = r.range(-half + 0.1, half - 0.1), wd = r.range(0.07, 0.2), yt = r.pick([7.45, 5.0, 2.55, 7.45]), ln = r.range(1.6, 4.2), dark = r.chance(0.45) ? rustC : mul(algae, 1.2);
        const P = (uu, y) => (k ? [px + uu, y, fz(y) + 0.006] : [fx(y) - sx * 0.006, y, uu]), c1 = mul(C.concrete, 0.9), yb = Math.max(1.3, yt - ln);
        quadO(A, P(u - wd * 0.2, yb), P(u + wd * 0.2, yb), P(u + wd, yt), P(u - wd, yt), [px, yt, 0], c1, 6, c1, c1, mix3(c1, dark, 0.8), mix3(c1, dark, 0.8));
      }
    }
    for (const z of [-0.82, 0.82]) box(A, sx * (hw + 0.13), -1.0, z, 0.2, 3.5, 0.24, mul(C.teakD, 1.5), 1, { ao: 0.5 });
    { // depth gauge: a white board with red and black marks every 20 cm, the metres in longer red bars
      const gz = 0.42, gx = (y, o) => fx(y) - sx * o;
      quadO(A, [gx(0.2, 0.03), 0.2, gz - 0.17], [gx(0.2, 0.03), 0.2, gz + 0.17], [gx(4.0, 0.03), 4.0, gz + 0.17], [gx(4.0, 0.03), 4.0, gz - 0.17], [px, 2, 0], mul(C.white, 0.95), 11);
      for (let i = 0; i < 18; i++) { const y = 0.4 + i * 0.2, m5 = i % 5 === 3, w0 = m5 ? -0.15 : (i % 2 ? -0.15 : 0), w1 = m5 ? 0.15 : (i % 2 ? 0 : 0.15);
        quadO(A, [gx(y, 0.04), y, gz + w0], [gx(y, 0.04), y, gz + w1], [gx(y, 0.04), y + 0.1, gz + w1], [gx(y, 0.04), y + 0.1, gz + w0], [px, y, 0], m5 ? C.red : C.tar, 11); }
    }
    for (let i = 0; i < 9; i++) { const y = 0.7 + i * 0.42, gx2 = sx * (hw - 0.058);   // warning stripes on the gate guide
      quadO(A, [gx2, y, -0.25], [gx2, y, 0.25], [gx2, y + 0.42, 0.25], [gx2, y + 0.42, -0.25], [px, y, 0], i % 2 ? C.white : C.red, 11);
      quadO(A, [sx * (hw - 0.05), y, 0.256], [sx * (hw + 0.25), y, 0.256], [sx * (hw + 0.25), y + 0.42, 0.256], [sx * (hw - 0.05), y + 0.42, 0.256], [px, y, 0], i % 2 ? C.white : C.red, 11); }
    // a lamp on a bracket, a cap slab, and weeds, a potted bougainvillea and a marigold string on the low wall
    beam(A, [px, 5.9, 1.0], [px - sx * 0.1, 6.25, 1.75], 0.06, 0.06, C.steel, 11);
    lathe(A, px - sx * 0.1, 6.02, 1.75, [[0, 0.24], [0.14, 0.07], [0.2, 0.05]], C.tinGreen, 11, 8, false); box(A, px - sx * 0.1, 5.93, 1.75, 0.13, 0.11, 0.13, C.marigold, 13);
    box(A, px, 8.4, 0, 1.62, 0.14, 2.24, mul(C.concrete, 0.86), 6);
    const wx = sx * (hw + 3.6), s0 = A.count;
    box(A, wx, 1.8, 0.1, 0.46, 0.36, 0.46, C.terra, 11, { taper: 1.25 });
    clump(A, r, wx, 2.5, 0.1, 0.5, 0.3, 0.42, r.chance(0.6) ? C.boug : C.bougO, 9, { piece: [0.16, 0.26] });
    for (let k = 0; k < 3; k++) strand(A, r, wx + r.range(-0.4, 0.4), 2.3, 0.45 + r.range(0, 0.1), r.range(0.6, 1.3), C.boug);
    setSway(A, s0 + 30, 0.02, r());
    clump(A, r, sx * (hw + 2.3), 1.86, 0.3, 0.5, 0.1, 0.2, mul(LEAF_C, 1.6), 5, { leaf: 1, piece: [0.1, 0.16] });
    for (let k = 0; k < 2; k++) strand(A, r, sx * (hw + 2.0 + k * 1.9), 1.8, 0.52, r.range(0.5, 1.0), mul(LEAF_C, 2.2));
    for (let k = 0; k < 7; k++) ball(A, sx * (hw + 0.5) + sx * k * 0.11, 4.62 - 0.1 * Math.sin(Math.PI * k / 6), fz(4.6) + 0.03, 0.05, k % 2 ? C.marigold : mul(C.jasmine, 1.05), 5, 6);
  }
  // the beam across, its warning stripes and name board, the keeper's hut, a pipe rail with posts
  box(A, 0, 7.5, 0, 2 * hw + 3.6, 0.9, 1.7, C.concrete, 6);
  { const n = Math.round((2 * hw + 3.4) / 0.42), x0 = -(n * 0.42) / 2;
    for (let i = 0; i < n; i++) quadO(A, [x0 + i * 0.42, 7.5, 0.856], [x0 + (i + 1) * 0.42, 7.5, 0.856], [x0 + (i + 1) * 0.42 + 0.2, 7.76, 0.856], [x0 + i * 0.42 + 0.2, 7.76, 0.856], [0, 7.6, 0], i % 2 ? mul(C.marigold, 0.9) : C.tar, 11);
    quadO(A, [-1.5, 7.86, 0.858], [1.5, 7.86, 0.858], [1.5, 8.3, 0.858], [-1.5, 8.3, 0.858], [0, 8, 0], mul(C.blueD, 1.1), 0);
    quadO(A, [-1.3, 8.02, 0.862], [1.3, 8.02, 0.862], [1.3, 8.14, 0.862], [-1.3, 8.14, 0.862], [0, 8, 0], C.white, 11);
    for (const [u0, u1, dark] of [[-3.1, -2.3, rustC], [2.0, 2.5, algae], [3.3, 3.9, rustC], [-4.4, -4.0, algae]]) { const c1 = mul(C.concrete, 0.9), c0 = mix3(c1, dark, 0.75); quadO(A, [u0 + 0.25, 7.5, 0.853], [u1 - 0.2, 7.5, 0.853], [u1, 8.4, 0.853], [u0, 8.4, 0.853], [0, 8, 0], c1, 6, c1, c1, c0, c0); }
  }
  box(A, 0, 8.4, 0, 2.3, 1.5, 1.9, C.tinGreen, 0); spike(A, 0, 9.9, 0, 2.8, 2.4, 0.7, C.tinRust, 2);
  quadO(A, [-0.7, 8.85, 0.955], [0.7, 8.85, 0.955], [0.7, 9.5, 0.955], [-0.7, 9.5, 0.955], [0, 9, 0], C.dark, 12);
  box(A, 0, 9.25, 0.84, 2 * hw + 3.2, 0.06, 0.06, C.steel, 11); box(A, 0, 8.85, 0.84, 2 * hw + 3.2, 0.04, 0.04, C.steel, 11);
  for (let x = -(hw + 1.5); x <= hw + 1.51; x += (2 * hw + 3) / 8) if (Math.abs(x) > 1.3) box(A, x, 8.4, 0.84, 0.06, 0.88, 0.06, C.steel, 11, { noTop: true });
  A.resetT();
}
function sluiceGate(A, hw, C) {
  // a painted steel gate: sea-green plate, darker ribs and braces, a narrow wet band at the foot, a hazard strip on the
  // lip, a number board and a depth scale, runs of rust, and lanterns and a garland hung under the lip for the festival
  const w = 2 * hw + 0.2, g = mul(C.tinGreen, 1.3), gd = mul(C.tinGreen, 0.92), wet = mix3([0.02, 0.035, 0.025], g, 0.5), wetR = mix3([0.02, 0.035, 0.025], gd, 0.5), yW = 0.6, riv = mul(C.silver, 0.6);
  const rustC = L('#8a4a22'), r = makeRng('kgate');
  const xs = [0, 1, 2, 3, 4, 5].map((i) => -w / 2 + 0.1 + (w - 0.2) * i / 5);
  box(A, 0, 0, 0, w, yW, 0.2, wet, 11, { bottom: true, ao: 0.7, noTop: true }); box(A, 0, yW, 0, w, 3.6 - yW, 0.2, g, 11);
  quad(A, [-w / 2, yW, 0.108], [w / 2, yW, 0.108], [w / 2, 3.6, 0.108], [-w / 2, 3.6, 0.108], g, 2, mul(g, 0.8), mul(g, 0.8), g, g, [0, 0.2], [w * 0.5, 0.2], [w * 0.5, 1.7], [0, 1.7]);
  quad(A, [-w / 2, 0, 0.108], [w / 2, 0, 0.108], [w / 2, yW, 0.108], [-w / 2, yW, 0.108], wet, 11);
  for (let i = 0; i < 26; i++) { const x0 = -w / 2 + w * i / 26, h = 0.06 + 0.2 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1);
    quadO(A, [x0, yW, 0.112], [x0 + w / 26, yW, 0.112], [x0 + w / 26 * 0.8, yW + h, 0.112], [x0 + w / 26 * 0.3, yW + h, 0.112], [0, 1, 0], wet, 2, wet, wet, mix3(wet, g, 0.7), mix3(wet, g, 0.7)); }
  for (const y of [0.42, 1.2, 2.3, 3.35]) box(A, 0, y, 0.16, w, 0.16, 0.14, y < yW ? wetR : gd, 2);
  xs.forEach((x, i) => {
    box(A, x, 0, 0.15, 0.14, yW, 0.12, wetR, 2, { noTop: true, ao: 0.7 }); box(A, x, yW, 0.15, 0.14, 3.6 - yW, 0.12, gd, 2, { noTop: true });
    for (let y = 0.72; y < 3.5; y += 0.31) box(A, x, y, 0.215, 0.06, 0.06, 0.03, riv, 11);
    if (i < 5) {   // a diagonal brace in each bay of the upper panels, and a row of rivets along the top and middle ribs
      const x1 = xs[i + 1], up = i % 2 === 0;
      beam(A, [x + 0.07, up ? 1.36 : 2.3, 0.135], [x1 - 0.07, up ? 2.3 : 1.36, 0.135], 0.09, 0.05, gd, 2);
      beam(A, [x + 0.07, up ? 3.35 : 2.46, 0.135], [x1 - 0.07, up ? 2.46 : 3.35, 0.135], 0.09, 0.05, gd, 2);
      for (let k = 1; k < 6; k++) for (const y of [2.35, 3.4]) box(A, x + (x1 - x) * k / 6, y, 0.232, 0.05, 0.05, 0.02, riv, 11);
      // rust weeps down the plate from the rib joints
      for (let k = r.int(1, 2); k > 0; k--) { const rx = x + r.range(0.25, x1 - x - 0.25), yt = r.pick([3.3, 2.26, 1.16]), ln = r.range(0.5, 1.0), wd = r.range(0.05, 0.11), c0 = mix3(g, rustC, 0.85);
        quadO(A, [rx - wd * 0.25, Math.max(yW + 0.05, yt - ln), 0.114], [rx + wd * 0.25, Math.max(yW + 0.05, yt - ln), 0.114], [rx + wd, yt, 0.114], [rx - wd, yt, 0.114], [0, 1, 0], g, 11, g, g, c0, c0); }
    }
  });
  { // the lip: a yellow and black hazard strip the whole width
    const n = Math.round(w / 0.4), dx = w / n;
    for (let i = 0; i < n; i++) { const x0 = -w / 2 + i * dx; quadO(A, [x0, 0.0, 0.245], [x0 + dx, 0.0, 0.245], [x0 + dx + 0.16, 0.34, 0.245], [x0 + 0.16, 0.34, 0.245], [0, 0.2, 0], i % 2 ? mul(C.marigold, 1.05) : C.tar, 11); }
    box(A, 0, -0.07, 0.04, w, 0.08, 0.42, mul(C.steel, 0.5), 11, { bottom: true });
  }
  { // a white number board in the second bay (seven-segment figures) and a red and white depth scale in the fourth
    const seg = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 7: 'abc', 8: 'abcdefg' };
    const bx = (xs[1] + xs[2]) / 2, by = 2.52, z = 0.246, d1 = r.pick([1, 2, 3]), d2 = r.pick([0, 2, 4, 5, 7, 8]);
    quadO(A, [bx - 0.62, by, z], [bx + 0.62, by, z], [bx + 0.62, by + 0.78, z], [bx - 0.62, by + 0.78, z], [0, by, 0], mul(C.white, 1.05), 11);
    [d1, d2].forEach((d, k) => {
      const cx = bx - 0.27 + k * 0.54, cy = by + 0.39, sw = 0.15, sh = 0.26, t = 0.035;
      const S = { a: [cx - sw, cy + sh, cx + sw, cy + sh], g: [cx - sw, cy, cx + sw, cy], d: [cx - sw, cy - sh, cx + sw, cy - sh], f: [cx - sw, cy, cx - sw, cy + sh], b: [cx + sw, cy, cx + sw, cy + sh], e: [cx - sw, cy - sh, cx - sw, cy], c: [cx + sw, cy - sh, cx + sw, cy] };
      for (const ch of seg[d]) { const q = S[ch]; quadO(A, [q[0] - t, q[1] - t, z + 0.004], [q[2] + t, q[1] - t, z + 0.004], [q[2] + t, q[3] + t, z + 0.004], [q[0] - t, q[3] + t, z + 0.004], [0, by, 0], C.tar, 11); }
    });
    const gx = (xs[3] + xs[4]) / 2;
    quadO(A, [gx - 0.16, 0.5, z], [gx + 0.16, 0.5, z], [gx + 0.16, 3.2, z], [gx - 0.16, 3.2, z], [0, 1, 0], mul(C.white, 1.05), 11);
    for (let i = 0; i < 13; i++) { const y = 0.58 + i * 0.2, m5 = i % 5 === 2, x0 = m5 ? -0.16 : (i % 2 ? -0.16 : 0), x1 = m5 ? 0.16 : (i % 2 ? 0 : 0.16);
      quadO(A, [gx + x0, y, z + 0.004], [gx + x1, y, z + 0.004], [gx + x1, y + 0.1, z + 0.004], [gx + x0, y + 0.1, z + 0.004], [0, 1, 0], m5 ? C.red : C.tar, 11); }
  }
  { // five paper lanterns and a swag of marigold and jasmine hang under the lip, swinging
    const lc = [C.red, C.marigold, L('#ec5a94'), C.marigold, C.red];
    for (let i = 0; i < 5; i++) { const x = -w * 0.36 + w * 0.18 * i, s0 = A.count, len = 0.16 + 0.07 * (i % 2);
      box(A, x, -0.07 - len, 0.2, 0.02, len, 0.02, C.dark, 11, { noTop: true });
      lathe(A, x, -0.07 - len - 0.36, 0.2, [[0, 0.06], [0.07, 0.15], [0.18, 0.19], [0.29, 0.15], [0.36, 0.06]], lc[i], 13, 8, false);
      box(A, x, -0.07 - len - 0.5, 0.2, 0.04, 0.14, 0.04, C.gold, 5);
      setSway(A, s0, 0.05, 0.13 + i * 0.19); }
    for (let b = 0; b < 4; b++) { const xa = -w * 0.36 + w * 0.18 * b, xb = xa + w * 0.18, s0 = A.count;
      for (let k = 1; k < 9; k++) { const f = k / 9; ball(A, xa + (xb - xa) * f, -0.1 - 0.3 * 4 * f * (1 - f), 0.2, 0.05, k % 2 ? C.marigold : mul(C.jasmine, 1.05), 5, 6); }
      setSway(A, s0, 0.02, 0.4 + b * 0.23); }
  }
  for (const sx of [-1, 1]) { box(A, sx * w * 0.3, 3.6, 0, 0.1, 4.2, 0.1, C.steel, 11, { noTop: true }); box(A, sx * w * 0.3, 3.6, 0, 0.34, 0.26, 0.3, mul(C.steel, 0.6), 11, { taper: 0.6 }); }
}
function washLine(A, r, B, hw, y, C, win) {
  A.setT(B.x, 0, B.z, B.rot, 1);
  const p = [-hw - 1.5, y + r.range(-0.3, 0.3), 0], q = [hw + 1.5, y + r.range(-0.3, 0.3), 0], sag = 0.4, len = q[0] - p[0];
  wire(A, p, q, sag, 8, C.dark);
  const faded = (c) => r.chance(0.6) ? mix3(mul(c, 0.75), C.cream, 0.3) : c;
  let f = 0.07 + r.range(0, 0.04);
  while (f < 0.9) {
    const t = r(), wd = t < 0.4 ? r.range(0.62, 0.8) : t < 0.75 ? r.range(0.6, 0.9) : r.range(0.45, 0.7), f2 = Math.min(0.95, f + wd / len), ph = r(), cc = faded(r.pick(C.cloth));
    const xa = p[0] + len * f, xb = p[0] + len * f2, ya = wireY(p, q, sag, f) - 0.02, yb = wireY(p, q, sag, f2) - 0.02;
    if (win && xb > -B.x - 1.5 && xa < -B.x + 1.5) { f = f2 + 0.02; continue; }
    if (t < 0.4) {           // a shirt: body and two short sleeves
      const sl = 0.16, ym = (ya + yb) / 2;
      cloth(A, [xa + sl, ym, 0], [xb - sl, ym, 0], r.range(0.6, 0.75), 3, cc, ph, 0.02, 0.16);
      cloth(A, [xa, ya, 0], [xa + sl, ym, 0], 0.25, 1, mul(cc, 0.92), ph, 0.02, 0.08); cloth(A, [xb - sl, ym, 0], [xb, yb, 0], 0.25, 1, mul(cc, 0.92), ph, 0.02, 0.08);
    } else if (t < 0.75) {   // a long sarong with bands of a second colour
      const c2 = faded(r.pick(C.cloth)), s0 = A.count, band = r.int(1, 2);
      clothStrip(A, [xa, ya, 0], [xb, yb, 0], r.range(1.2, 1.5), 6, (row) => (row === band || row === 5 ? c2 : cc), ph, 0.02, 0.26, 0);
      for (let i = s0; i < A.count; i++) A.mat[i] = 4;
    } else cloth(A, [xa, ya, 0], [xb, yb, 0], r.range(0.5, 0.8), 2, cc, ph, 0.02, 0.14);   // a towel
    f = f2 + r.range(0.012, 0.075);
  }
  A.resetT();
}
// both banks' lots along the canal: houses, with a gap every one or two (forced at every bridge and at the sluice)
function layoutBank(r) {
  const forced = BRIDGES.map((b) => b.n).concat([SLUICE_N]).sort((a, b) => a - b), lots = [];
  let n = -46 + r.range(0, 3), since = 0, fi = 0, mi = 0;
  while (n < 336) {
    while (fi < forced.length && forced[fi] + 1.7 <= n + 0.01) fi++;
    const fg = forced[fi], market = n > 161 && n < 214;
    let type = since >= r.int(1, 2) ? 'gap' : 'house', w = type === 'gap' ? (market ? r.range(4.4, 5.4) : r.range(2.6, 4.2)) : (market ? r.range(6, 7) : r.range(6.6, 9.4)), kind = '';
    if (fg !== undefined && n + w > fg - 1.7) {
      if (fg - 1.7 - n >= 5.4 && type === 'house') w = fg - 1.7 - n; else { type = 'gap'; w = fg + 1.7 - n; kind = 'landing'; }
    }
    if (type === 'gap' && !kind) kind = market ? 'market' : r.chance(0.58) ? 'pier' : 'garden';
    lots.push({ n0: n, n1: n + w, type, kind, i: mi++ });
    since = type === 'gap' ? 0 : since + 1; n += w;
  }
  return lots;
}

// ---------- boats ----------
// lofted open hull along local X. st: [[x, halfWidth, gunwaleY, bottomY], ...]
function hull(A, st, colOut, mOut, colIn, mIn, capCol) {
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1], xm = (a[0] + b[0]) / 2, ym = (a[2] + a[3]) / 2;
    for (const s of [-1, 1]) {
      quadO(A, [a[0], a[3], s * a[1] * 0.42], [b[0], b[3], s * b[1] * 0.42], [b[0], b[2], s * b[1]], [a[0], a[2], s * a[1]], [xm, ym, 0], colOut, mOut, mul(colOut, 0.6), mul(colOut, 0.6), colOut, colOut);
      quadO(A, [a[0], a[3] + 0.1, s * a[1] * 0.42], [b[0], b[3] + 0.1, s * b[1] * 0.42], [b[0], b[2], s * (b[1] - 0.05)], [a[0], a[2], s * (a[1] - 0.05)], [xm, ym, s * 60], colIn, mIn);
      if (capCol) beam(A, [a[0], a[2], s * a[1]], [b[0], b[2], s * b[1]], 0.09, 0.06, capCol, 0);
    }
    quadO(A, [a[0], a[3] + 0.1, a[1] * 0.42], [b[0], b[3] + 0.1, b[1] * 0.42], [b[0], b[3] + 0.1, -b[1] * 0.42], [a[0], a[3] + 0.1, -a[1] * 0.42], [xm, -9, 0], colIn, mIn);
  }
}
const parasol = (A, x, y, z, rad, col, C, r) => {
  const s0 = A.count;
  box(A, x, y, z, 0.035, 1.75, 0.035, C.teakD, 11, { noTop: true });
  lathe(A, x, y + 1.5, z, [[0, rad], [0.34, 0.04]], col, 11, 10, false);
  for (let i = 0; i < 10; i += 2) { const a = i / 10 * TAU, b = (i + 1) / 10 * TAU; tri(A, [x, y + 1.84, z], [x + Math.cos(b) * rad, y + 1.5, z + Math.sin(b) * rad], [x + Math.cos(a) * rad, y + 1.5, z + Math.sin(a) * rad], mul(col, 0.72), mul(col, 0.72), mul(col, 0.72), 11); }
  setSway(A, s0, 0.04, r());
};
// variant 0 fruit, 1 flowers, 2 noodle pots, 3 an empty moored sampan under a tarpaulin
function sampan(A, r, v, C, pad = false) {
  const st = [[-2.8, 0.06, 0.62, 0.3], [-2.0, 0.36, 0.42, -0.05], [-0.8, 0.54, 0.33, -0.15], [0.8, 0.54, 0.33, -0.15], [2.0, 0.36, 0.42, -0.05], [2.8, 0.06, 0.62, 0.3]];
  hull(A, st, C.white, 0, C.teak, 1, C.teakD);
  for (const x of [-1.5, 1.5]) box(A, x, 0.26, 0, 0.16, 0.05, 0.9, C.teak, 1);
  if (v === 3) {
    box(A, -0.3, 0.05, 0, 1.9, 0.34, 0.8, r.pick([C.blueD, C.tinGreen, C.cream]), 11, { taper: 0.8 }); lathe(A, 1.3, 0.0, 0, [[0, 0.24], [0.1, 0.26], [0.12, 0.12]], C.ochre, 11);
    beam(A, [-2.2, 0.5, 0.3], [0.8, 0.42, 0.42], 0.06, 0.04, C.teakR, 1);
    return;
  }
  if (v === 2) {
    box(A, -0.5, 0, 0, 1.3, 0.34, 0.74, C.charcoal, 11);
    for (const x of [-0.85, -0.15]) { lathe(A, x, 0.34, 0, [[0, 0.25], [0.36, 0.27]], C.steel, 11, 8, false); box(A, x, 0.69, 0, 0.42, 0.02, 0.42, L('#d9c9a0'), 11); }
    box(A, 0.55, 0, 0.1, 0.5, 0.4, 0.5, C.teak, 1); for (let k = 0; k < 4; k++) box(A, 0.45 + (k % 2) * 0.22, 0.4, -0.02 + (k >> 1) * 0.22, 0.17, 0.09, 0.17, C.white, 11, { taper: 1.3 });
  } else {
    for (const x of [-1.25, -0.5, 0.25]) {
      box(A, x, 0.0, 0, 0.66, 0.2, 0.74, C.ochre, 1, { taper: 1.12 });
      const cc = v === 1 ? r.pick([C.lotus, C.orchidW, C.marigold, C.orchid]) : C.cargo[Math.round(x + 9) % 3];
      clump(A, r, x, 0.3, 0, 0.22, 0.07, 0.25, cc, 7, { piece: [0.09, 0.13], leaf: v === 1 ? 0.3 : 0.06, m: v === 1 ? 7 : 11 });
    }
  }
  parasol(A, 1.15, 0.2, 0, 1.0, C.parasol[v], C, r);
  box(A, 1.55, 0.12, 0, 0.3, 0.14, 0.34, C.teak, 1);
  if (pad) {   // someone sits in the stern under a straw hat, paddling (the oar is aMat 14: it dips and sweeps)
    const sc = r.pick([C.blueD, C.white, C.saffron, C.red, C.cream]), straw = L('#d2b676');
    box(A, -1.82, 0.26, 0, 0.3, 0.5, 0.36, sc, 11, { taper: 0.78 }); box(A, -1.82, 0.76, 0, 0.17, 0.17, 0.17, L('#8a5a3a'), 11);
    lathe(A, -1.82, 0.88, 0, [[0, 0.34], [0.05, 0.22], [0.18, 0.02]], straw, 11, 10, false);
    const g = [-1.7, 0.62, 0.2], b = [-2.25, -0.05, 1.05], c = [-2.15, -0.05, 1.08], d = [-1.64, 0.62, 0.22], e = [-2.42, -0.3, 1.3], f = [-2.2, -0.3, 1.36], u = [0, 0], oc = mul(C.teakR, 1.2);
    tri(A, g, b, c, oc, oc, oc, 14, u, u, u, 0, 0.3, 0.3); tri(A, g, c, d, oc, oc, oc, 14, u, u, u, 0, 0.3, 0);
    tri(A, b, e, f, oc, oc, oc, 14, u, u, u, 0.3, 0.38, 0.38); tri(A, b, f, c, oc, oc, oc, 14, u, u, u, 0.3, 0.38, 0.3);
  }
}
// teak rice barge (or sand lighter), 24 m, bow toward +X
function riceBarge(A, r, C, sand) {
  const st = [[-12, 0.8, 2.3, -0.4], [-10, 2.6, 1.9, -0.6], [-5, 3.0, 1.7, -0.6], [6, 3.0, 1.7, -0.6], [10, 2.5, 1.95, -0.5], [12, 0.6, 2.6, -0.2]];
  hull(A, st, mix3(C.tar, C.teakR, 0.6), 1, C.teak, 1, C.teakR);
  for (const s of [-1, 1]) { beam(A, [-10, 1.2, s * 2.72], [10, 1.25, s * 2.62], 0.12, 0.16, C.teakR, 1); for (const x of [-7, -2, 3, 8]) lathe(A, x, 0.7, s * 3.05, [[0, 0.3], [0.2, 0.36], [0.4, 0.3]], C.charcoal, 11, 6); }
  box(A, 0, 1.2, 0, 21, 0.4, 5.4, C.teak, 1);
  if (sand) { box(A, -1, 1.6, 0, 14, 1.5, 4.6, L('#cdb27c'), 8, { taper: 0.5 }); box(A, 3, 1.6, 0.3, 6, 1.9, 3.8, L('#d6bc86'), 8, { taper: 0.35 }); }
  else {
    const n = 7, x0 = -7.5, x1 = 6.5, rad = 2.95, col = mul(C.teakR, 1.05);
    for (let i = 0; i < n; i++) {
      const a = Math.PI * i / n, b = Math.PI * (i + 1) / n;
      quadO(A, [x0, 1.6 + Math.sin(a) * 1.9, Math.cos(a) * rad], [x1, 1.6 + Math.sin(a) * 1.9, Math.cos(a) * rad], [x1, 1.6 + Math.sin(b) * 1.9, Math.cos(b) * rad], [x0, 1.6 + Math.sin(b) * 1.9, Math.cos(b) * rad], [0, 1, 0], mul(col, 0.8 + 0.25 * Math.sin((a + b) / 2)), 2, null, null, null, null, [a * 2, 0], [a * 2, x1 - x0], [b * 2, x1 - x0], [b * 2, 0]);
      for (const x of [x0, x1]) quadO(A, [x, 1.6, Math.cos(a) * rad], [x, 1.6 + Math.sin(a) * 1.9, Math.cos(a) * rad], [x, 1.6 + Math.sin(b) * 1.9, Math.cos(b) * rad], [x, 1.6, Math.cos(b) * rad], [0, 2, 0], C.teak, 1);
    }
  }
  const hc = r.pick([C.mint, C.blue, C.cream, C.ochre]);
  box(A, -8.9, 1.6, 0, 2.6, 2.1, 3.8, hc, 0, { noTop: true }); spike(A, -8.9, 3.7, 0, 3.2, 4.4, 0.8, mul(C.tinRust, 1.1), 2);
  for (const s of [-1, 1]) quadO(A, [-9.6, 2.4, s * 1.92], [-8.2, 2.4, s * 1.92], [-8.2, 3.3, s * 1.92], [-9.6, 3.3, s * 1.92], [-8.9, 2.5, 0], C.dark, 12);
  wire(A, [-7.4, 3.5, -1.6], [-7.4, 3.5, 1.6], 0.1, 3, C.dark);
  for (let k = 0; k < 3; k++) cloth(A, [-7.4, 3.44, -1.3 + k * 0.9], [-7.4, 3.44, -0.7 + k * 0.9], r.range(0.6, 0.9), 2, r.pick(C.cloth), r(), 0.02, 0.14);
  box(A, 10.6, 1.9, 0, 0.3, 0.9, 0.3, C.teakD, 1); box(A, 11.4, 2.5, 0, 0.5, 0.25, 0.9, C.steel, 11);
}
function tug(A, r, C) {
  const st = [[-5, 1.2, 1.3, -0.4], [-3.5, 1.9, 1.15, -0.6], [1, 2.0, 1.2, -0.6], [4, 1.3, 1.6, -0.4], [5.2, 0.2, 2.0, 0]];
  hull(A, st, r.pick([C.blueD, C.red, C.tinGreen]), 0, C.teak, 1, C.white);
  box(A, 0, 1.0, 0, 8.6, 0.2, 3.4, C.teak, 1);
  box(A, 0.6, 1.2, 0, 3.2, 2.0, 2.6, C.white, 0, { noTop: true }); box(A, 0.6, 3.2, 0, 3.8, 0.14, 3.2, C.tinRust, 2);
  for (const s of [-1, 1]) quadO(A, [-0.7, 2.2, s * 1.32], [1.9, 2.2, s * 1.32], [1.9, 2.95, s * 1.32], [-0.7, 2.95, s * 1.32], [0.6, 2.5, 0], C.dark, 12);
  quadO(A, [2.22, 2.2, -1.0], [2.22, 2.2, 1.0], [2.22, 2.95, 1.0], [2.22, 2.95, -1.0], [0, 2.5, 0], C.dark, 12);
  lathe(A, -1.6, 1.2, 0, [[0, 0.42], [2.4, 0.36], [2.5, 0.4], [3.0, 0.38]], C.red, 11, 8); lathe(A, -1.6, 4.2, 0, [[0, 0.39], [0.3, 0.38]], C.charcoal, 11, 8);
  for (const s of [-1, 1]) for (const x of [-3, -1, 1, 3]) lathe(A, x, 0.5, s * 2.05, [[0, 0.3], [0.2, 0.36], [0.4, 0.3]], C.charcoal, 11, 6);
  box(A, 2.6, 3.34, 0, 0.06, 1.6, 0.06, C.steel, 11); box(A, 2.6, 4.9, 0, 0.14, 0.14, 0.14, C.marigold, 13);
  const s0 = A.count; cloth(A, [-4.6, 3.0, 0], [-3.9, 3.0, 0], 0.5, 2, C.red, r(), 0.03, 0.2); box(A, -4.6, 1.2, 0, 0.05, 1.85, 0.05, C.steel, 11); void s0;
}
function ferry(A, r, C) {
  const st = [[-9, 1.6, 1.5, -0.4], [-7, 2.5, 1.3, -0.6], [6, 2.5, 1.3, -0.6], [8.4, 1.5, 1.6, -0.3], [9.4, 0.3, 1.9, 0]];
  hull(A, st, C.white, 0, C.teak, 1, r.pick([C.red, C.saffron]));
  box(A, -0.5, 1.15, 0, 15.5, 0.18, 4.6, C.teak, 1);
  for (const s of [-1, 1]) { beam(A, [-8, 0.75, s * 2.56], [7, 0.75, s * 2.56], 0.1, 0.3, C.saffron, 0); for (let x = -7; x <= 6; x += 2.6) { box(A, x, 1.33, s * 2.3, 0.1, 2.2, 0.1, C.white, 0, { noTop: true }); lathe(A, x + 1.2, 0.5, s * 2.62, [[0, 0.3], [0.2, 0.36], [0.4, 0.3]], C.charcoal, 11, 6); }
    box(A, -0.5, 2.1, s * 2.3, 13, 0.07, 0.07, C.white, 0); }
  box(A, -0.5, 3.5, 0, 15, 0.16, 5.3, L(PALETTE[4], 1.1), 2); box(A, -0.5, 3.3, 0, 14.6, 0.2, 5.0, C.white, 0);
  box(A, 4.2, 3.66, 0, 2.4, 1.7, 2.4, C.white, 0, { noTop: true }); box(A, 4.2, 5.36, 0, 2.9, 0.12, 2.9, L(PALETTE[4], 1.1), 2);
  quadO(A, [5.42, 4.3, -1.0], [5.42, 4.3, 1.0], [5.42, 5.1, 1.0], [5.42, 5.1, -1.0], [4, 4.6, 0], C.dark, 12);
  for (let x = -6.5; x < 3; x += 1.5) box(A, x, 1.33, 0, 0.5, 0.45, 3.4, mul(C.blueD, 1.2), 0);
  box(A, -7.6, 3.66, 0, 0.06, 2.0, 0.06, C.steel, 11); cloth(A, [-7.6, 5.6, 0], [-6.7, 5.6, 0], 0.6, 2, C.red, r(), 0.03, 0.2);
}
function farLongtail(A, r, C) {
  const st = [[-5, 0.5, 0.7, 0], [-3, 0.75, 0.6, -0.15], [2, 0.7, 0.62, -0.15], [4.6, 0.3, 1.0, 0.2], [6.2, 0.05, 1.9, 1.3]];
  hull(A, st, C.white, 0, C.teak, 1, C.red);
  for (const x of [-2.5, 1.5]) for (const s of [-1, 1]) box(A, x, 0.6, s * 0.6, 0.05, 1.25, 0.05, C.steel, 11, { noTop: true });
  box(A, -0.5, 1.85, 0, 4.6, 0.06, 1.5, C.parasol[1], 4); box(A, -4.4, 0.7, 0, 0.9, 0.6, 0.6, C.charcoal, 11); beam(A, [-4.6, 1.0, 0], [-8.6, 0.1, 0], 0.07, 0.07, C.steel, 11);
  const s0 = A.count; for (let k = 0; k < 4; k++) box(A, 5.4 + k * 0.12, 1.2 + k * 0.1, 0, 0.14, 0.5, 0.14, C.cloth[(k + 1) % 8], 4); setSway(A, s0, 0, 0);
}
// a gilded neck or tail in the barge's centre plane: a round tube tapering along a smooth curve through pts ([x, y]),
// its faces alternately bright and deep gold like scales, with a crest of flame-shaped scales down one side (crest +-1)
function giltNeck(A, pts, w0, w1, C, crest) {
  const N = 12, S = [], cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  for (let i = 0; i <= N; i++) {
    const f = i / N * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(f)), t = f - k;
    const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
    S.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t), 0, 0]);
  }
  for (let i = 0; i <= N; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(N, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; S[i][2] = -(b[1] - a[1]) / l; S[i][3] = (b[0] - a[0]) / l; }
  const rad = (i) => w0 + (w1 - w0) * Math.pow(i / N, 0.8);
  const ringAt = (i) => { const q = S[i], rr = rad(i), o = []; for (let j = 0; j < 6; j++) { const an = (j + 0.5) / 6 * TAU, c = Math.cos(an) * rr * 1.3, z = Math.sin(an) * rr; o.push([q[0] + q[2] * c, q[1] + q[3] * c, z]); } return o; };
  let prev = ringAt(0);
  for (let i = 1; i <= N; i++) {
    const cur = ringAt(i), a = S[i - 1], b = S[i], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0];
    for (let j = 0; j < 6; j++) { const j2 = (j + 1) % 6; quadO(A, prev[j], prev[j2], cur[j2], cur[j], mid, mul(C.gold, (i + j) % 2 ? 1.12 : 0.74), 5); }
    // a flame scale standing off the back, swept toward the tip
    const r0 = rad(i - 1) * 1.3, r1 = rad(i) * 1.3, h = 0.25 + 1.5 * r0, tx = b[0] - a[0], ty = b[1] - a[1];
    const pa = [a[0] + a[2] * crest * r0 * 0.9, a[1] + a[3] * crest * r0 * 0.9, 0], pb = [b[0] + b[2] * crest * r1 * 0.9, b[1] + b[3] * crest * r1 * 0.9, 0];
    const ap = [mid[0] + (a[2] + b[2]) / 2 * crest * (r0 + h) + tx * 0.75, mid[1] + (a[3] + b[3]) / 2 * crest * (r0 + h) + ty * 0.75, 0];
    for (const z of [-0.06, 0.06]) tri(A, [pa[0], pa[1], z * 2], [pb[0], pb[1], z * 2], [ap[0], ap[1], z], i % 2 ? C.gold : C.red, i % 2 ? C.gold : C.red, mul(C.gold, 1.3), 5);
    prev = cur;
  }
  return S[N];
}
// a kranok flame in the centre plane: three leaning tongues, gold with a red heart
function giltFlame(A, x, y, sc, lean, C) {
  for (const [dx, w, h, c] of [[0, 0.5, 1.9, C.gold], [-0.42 * lean, 0.36, 1.25, C.gold], [0.3 * lean, 0.3, 0.95, C.gold], [0, 0.22, 1.1, C.red]]) for (const z of [-0.07, 0.07]) {
    const zz = c === C.red ? z * 1.6 : z;
    tri(A, [x + (dx - w / 2) * sc, y, zz * 2], [x + (dx + w / 2) * sc, y, zz * 2], [x + (dx + lean * h * 0.42) * sc, y + h * sc, zz * 0.3], c, c, mul(c, 1.35), 5);
    tri(A, [x + (dx - w / 2) * sc, y, zz * 2], [x + (dx + w / 2) * sc, y, zz * 2], [x + dx * sc, y - 0.3 * sc, zz], c, c, mul(c, 0.8), 5);
  }
}
// gilded royal barge, 45 m, bow toward +X: swan-necked prow, curled stern, pavilion, forty oars a side beating together
function royalBarge(A, r, C, k) {
  const st = [[-22.5, 0.3, 3.4, 1.9], [-20, 1.2, 1.9, -0.2], [-12, 1.6, 1.55, -0.3], [0, 1.7, 1.5, -0.3], [12, 1.5, 1.55, -0.3], [19, 0.9, 2.1, -0.1], [22.5, 0.2, 3.9, 2.3]];
  hull(A, st, C.gold, 5, C.red, 0, C.red);
  for (const s of [-1, 1]) { beam(A, [-19, 0.75, s * 1.42], [18, 0.8, s * 1.38], 0.08, 0.4, C.red, 0); beam(A, [-19, 0.25, s * 1.1], [18, 0.3, s * 1.05], 0.06, 0.16, C.jasmine, 0); }
  // swan or naga neck at the bow, 12 m above the water, and the curled stern
  const neck = (k % 2 ? [[22.5, 3.0], [24.6, 5.0], [25.3, 7.3], [24.6, 8.8], [25.9, 9.3]] : [[22.5, 3.0], [24.2, 5.4], [24.0, 7.6], [25.0, 9.0], [26.4, 8.7]]).map(([x, y]) => [x, 3.9 + (y - 3.0) * 1.3]);
  { // the neck, a head with a beak and a flame crest, a red tassel swinging from the beak
    const e = giltNeck(A, neck, 0.42, 0.2, C, 1), hx = e[0] + 0.25, hy = e[1];
    lathe(A, hx, hy - 0.42, 0, [[0, 0.06], [0.12, 0.34], [0.42, 0.46], [0.7, 0.34], [0.84, 0.06]], C.gold, 5, 8, false);
    beam(A, [hx + 0.3, hy + 0.02, 0], [hx + 1.0, hy - 0.2, 0], 0.26, 0.24, C.red, 0); beam(A, [hx + 1.0, hy - 0.2, 0], [hx + 1.45, hy - 0.52, 0], 0.14, 0.12, C.red, 0);
    for (const z of [-0.36, 0.36]) box(A, hx + 0.16, hy + 0.02, z, 0.14, 0.14, 0.06, C.dark, 11);
    giltFlame(A, hx - 0.1, hy + 0.34, 0.95, -1, C);
    const s0 = A.count, ph = r();
    cloth(A, [hx + 1.3, hy - 0.5, -0.16], [hx + 1.3, hy - 0.5, 0.16], 2.6, 6, C.red, ph, 0.03, 0.42);
    ball(A, hx + 1.3, hy - 0.72, 0, 0.17, C.gold, 5, 6); void s0;
  }
  const tail = [[-22.5, 2.6], [-24.2, 4.4], [-24.7, 6.4], [-23.9, 7.7], [-23.0, 7.4]].map(([x, y]) => [x, 3.4 + (y - 2.6) * 1.3]);
  { // the stern curls up and over into a flame, with a long red pennant streaming from it
    const e = giltNeck(A, tail, 0.4, 0.13, C, 1);
    giltFlame(A, e[0] + 0.1, e[1] - 0.1, 1.15, 1, C);
    const top = tail[3];
    box(A, top[0] - 0.9, top[1] + 0.2, 0, 0.07, 2.6, 0.07, C.gold, 5, { noTop: true });
    { const s0 = A.count; clothStrip(A, [top[0] - 0.9, top[1] + 2.7, 0], [top[0] - 1.75, top[1] + 2.7, 0], 4.2, 8, (row) => (row === 1 || row === 6 ? C.gold : C.red), 0.37 + k * 0.21, 0.04, 0.7, 0.16); for (let i = s0; i < A.count; i++) A.mat[i] = 4; }
    spike(A, top[0] - 0.9, top[1] + 2.8, 0, 0.16, 0.16, 0.6, C.gold, 5);
  }
  // a two-tiered pavilion amidships and five tall tiered parasols
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(A, -3 + sx * 1.8, 1.5, sz * 1.05, 0.16, 2.9, 0.16, C.gold, 5, { noTop: true });
  box(A, -3, 4.4, 0, 4.8, 0.22, 3.0, C.red, 0); spike(A, -3, 4.62, 0, 4.4, 2.8, 1.2, C.gold, 5);
  box(A, -3, 5.2, 0, 2.3, 0.7, 1.4, C.red, 0, { noTop: true }); box(A, -3, 5.9, 0, 3.0, 0.16, 2.0, C.red, 0); spike(A, -3, 6.06, 0, 2.7, 1.8, 1.2, C.gold, 5); spike(A, -3, 7.0, 0, 0.5, 0.5, 2.4, C.gold, 5);
  cloth(A, [-4.8, 4.4, 1.4], [-1.2, 4.4, 1.4], 0.8, 2, C.red, r(), 0.02, 0.12); cloth(A, [-4.8, 4.4, -1.4], [-1.2, 4.4, -1.4], 0.8, 2, C.red, r(), 0.02, 0.12);
  for (const x of [6, 10.5, 15, -9.5, -14]) { const s0 = A.count; box(A, x, 1.5, 0, 0.07, 4.6, 0.07, C.gold, 5, { noTop: true }); for (let t = 0; t < 5; t++) lathe(A, x, 4.0 + t * 0.52, 0, [[0, 0.95 - t * 0.17], [0.3, 0.1]], t % 2 ? C.gold : C.jasmine, t % 2 ? 5 : 11, 8, false); spike(A, x, 6.6, 0, 0.12, 0.12, 0.7, C.gold, 5); setSway(A, s0, 0.02, r()); }
  // oarsmen in red along both sides, and the oars (aMat 14: sway = distance out along the loom)
  for (let i = 0; i < 40; i++) {
    const x = -17 + i * 0.86;
    for (const s of [-1, 1]) {
      box(A, x, 1.5, s * 1.15, 0.3, 0.6, 0.36, C.red, 11, { taper: 0.75 });
      const g = [x, 1.75, s * 1.55], b = [x - 0.5, 0.0, s * 4.6], c = [x - 0.4, 0.0, s * 4.6], d = [x + 0.06, 1.75, s * 1.55], bl = [x - 0.6, -0.25, s * 5.2], bl2 = [x - 0.25, -0.25, s * 5.2];
      const rc = C.red, gc = C.gold, u = [0, 0];
      tri(A, g, b, c, rc, rc, rc, 14, u, u, u, 0, 1, 1); tri(A, g, c, d, rc, rc, rc, 14, u, u, u, 0, 1, 0);
      tri(A, b, bl, bl2, gc, gc, gc, 14, u, u, u, 1, 1.2, 1.2); tri(A, b, bl2, c, gc, gc, gc, 14, u, u, u, 1, 1.2, 1);
    }
  }
}
// a plank pier on piles from a pile house's steps out toward the channel, with a T-head: a parasol, a lotus tub, crates,
// a mooring post with a pennant. Local frame = the house's (+Z toward the channel). Returns the head's centre [x, z].
function pilePier(A, r, B, px, len, C, col) {
  A.setT(B.x, 0, B.z, B.rot, 1);
  const y = 0.95, hz = len + 1.1;
  box(A, px, y - 0.1, (0.55 + len) / 2, 1.3, 0.1, len - 0.55, C.teak, 1, { bottom: true, ao: 0.7 });
  for (let z = 1.0; z < len - 0.2; z += 2.3) for (const sx of [-1, 1]) box(A, px + sx * 0.6, -1.3, z, 0.16, y + 1.22, 0.16, C.pile, 1, { noTop: true, ao: 0.65 });
  box(A, px, y - 0.1, hz, 3.6, 0.1, 2.2, C.teak, 1, { bottom: true, ao: 0.7 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(A, px + sx * 1.65, -1.3, hz + sz * 0.95, 0.18, y + 1.22 + (sx > 0 && sz > 0 ? 1.5 : 0), 0.18, C.pile, 1, { noTop: sx < 0 || sz < 0, ao: 0.65 });
  for (const sx of [-1, 1]) beam(A, [px + sx * 0.36, y - 0.05, 1.0], [px + sx * 0.36, 2.05, 0.08], 0.06, 0.12, C.pile, 1);   // a ladder up to the veranda
  for (let k = 1; k < 5; k++) box(A, px, y - 0.05 + k * 0.22, 1.0 - k * 0.184, 0.72, 0.04, 0.12, C.teak, 1, { bottom: true });
  for (let z = 1.3; z < len; z += 1.15) box(A, px - 0.6, y, z, 0.05, 0.75, 0.05, C.white, 0, { noTop: true });
  if (len > 1.6) box(A, px - 0.6, y + 0.75, (1.3 + len) / 2, 0.06, 0.05, len - 1.3, C.white, 0);
  parasol(A, px - 0.7, y, hz - 0.2, 1.15, col, C, r);
  box(A, px - 0.75, y, hz + 0.45, 0.62, 0.36, 0.5, C.teak, 1); clump(A, r, px - 0.75, y + 0.44, hz + 0.45, 0.24, 0.07, 0.2, r.pick(C.cargo), 7, { piece: [0.09, 0.13], leaf: 0.08, m: 11 });
  lathe(A, px + 0.75, y, hz - 0.45, [[0, 0.3], [0.3, 0.46], [0.42, 0.42]], mul(C.jar, 1.7), 11);
  box(A, px + 0.75, y + 0.4, hz - 0.45, 0.62, 0.03, 0.62, C.leaf, 7); spike(A, px + 0.85, y + 0.43, hz - 0.4, 0.13, 0.13, 0.34, C.lotus, 11);
  cloth(A, [px + 1.65, y + 2.6, hz + 0.95], [px + 1.65, y + 2.6, hz + 1.5], 0.36, 1, r.pick([C.red, C.saffron, C.white]), r(), 0.02, 0.12);
  { const s0 = A.count; box(A, px + 1.5, y + 1.75, hz + 0.95, 0.22, 0.3, 0.22, r.pick([C.red, C.marigold]), 13, { taper: 0.9 }); setSway(A, s0, 0.04, r()); }
  A.resetT();
}
// a tall temple banner pole standing in the river: red, gilt-capped, with a long striped banner (cloth, aMat 4)
function bannerPole(A, r, x, z, h, C, cols, dir) {
  beam(A, [x, -0.8, z], [x, h, z], 0.3, 0.3, mul(C.red, 0.9), 11);
  box(A, x, 0.9, z, 0.5, 0.5, 0.5, C.gold, 5, { taper: 0.8 }); box(A, x, h - 2.6, z, 0.26, 0.2, 0.26, C.gold, 5); spike(A, x, h, z, 0.3, 0.3, 1.2, C.gold, 5);
  box(A, x + dir * 0.75, h - 0.7, z, 1.7, 0.12, 0.12, C.gold, 5);
  const s0 = A.count, len = h - 3.6, n = 14, ph = r();
  clothStrip(A, [x + dir * 0.3, h - 0.76, z + 0.02], [x + dir * 1.5, h - 0.76, z + 0.02], len, n, (row) => (row < 2 || row > n - 3 ? cols[0] : cols[1 + (Math.floor((row - 2) / 2) % 2)]), ph, 0.03, 0.55, 0.12);
  for (let i = s0; i < A.count; i++) A.mat[i] = 4;
}
// a white tiered umbrella of state on a tall red pole standing in the river: seven shrinking tiers with gilt valances, a gilt spire
function chatra(A, r, x, z, h, C) {
  beam(A, [x, -0.8, z], [x, h - 1.0, z], 0.26, 0.26, mul(C.red, 0.9), 11); box(A, x, 0.9, z, 0.46, 0.46, 0.46, C.gold, 5, { taper: 0.8 });
  const s0 = A.count, n = 7, y0 = h * 0.42, st = (h - 1.3 - y0) / n, white = mul(C.jasmine, 0.92);
  for (let t = 0; t < n; t++) {
    const rad = 1.35 - t * 0.155, y = y0 + t * st;
    lathe(A, x, y, z, [[0, rad], [st * 0.62, 0.14]], white, 11, 10, false);
    lathe(A, x, y - 0.24, z, [[0, rad * 1.02], [0.24, rad]], C.gold, 5, 10, false);
  }
  spike(A, x, h - 1.3, z, 0.24, 0.24, 1.3, C.gold, 5);
  setSway(A, s0, 0.02, r());
}
// a string of pennants from p to q (aMat 4: each hangs from the line and flutters)
function pennants(A, r, p, q, cols, k0) {
  const len = Math.hypot(q[0] - p[0], q[2] - p[2]), sag = 0.6 + len * 0.045, np = Math.max(2, Math.floor(len / 0.95));
  wire(A, p, q, sag, 10, [0.05, 0.04, 0.035]);
  const at = (f, dy) => [p[0] + (q[0] - p[0]) * f, wireY(p, q, sag, f) + dy, p[2] + (q[2] - p[2]) * f];
  for (let i = 1; i < np; i++) {
    const c = cols[(i + k0) % cols.length], ph = r();
    tri(A, at((i - 0.27) / np, -0.02), at((i + 0.27) / np, -0.02), at(i / np, -0.74), c, c, mul(c, 0.85), 4, [ph, 0], [ph, 0], [ph, 1], 0.012, 0.012, 0.13);
  }
}
// a small open sala on piles in the river: a deck, four posts, a two-tiered roof with a gilt finial, lanterns, steps
function riverSala(A, r, x, z, rot, C) {
  A.setT(x, 0, z, rot, 1);
  const y = 1.7, roofA = L(PALETTE[4], 1.05), roofB = L(PALETTE[5], 1.0);
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 0, 1]) box(A, sx * 2.4, -1.3, sz * 2.4, 0.26, y + 1.2, 0.26, C.pile, 1, { noTop: true, ao: 0.6 });
  box(A, 0, y - 0.14, 0, 5.8, 0.14, 5.8, C.teak, 1, { bottom: true, ao: 0.7 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(A, sx * 2.3, y, sz * 2.3, 0.2, 3.0, 0.2, mul(C.red, 0.95), 0, { noTop: true });
  for (const sx of [-1, 1]) { box(A, sx * 2.6, y + 0.75, 0, 0.07, 0.07, 4.6, C.white, 0); for (let k = -5; k <= 5; k++) box(A, sx * 2.6, y, k * 0.44, 0.05, 0.75, 0.05, C.white, 0, { noTop: true }); }
  box(A, 0, y + 0.75, -2.6, 4.6, 0.07, 0.07, C.white, 0); for (let k = -5; k <= 5; k++) box(A, k * 0.44, y, -2.6, 0.05, 0.75, 0.05, C.white, 0, { noTop: true });
  box(A, 0, y + 3.0, 0, 6.6, 0.16, 6.6, C.cream, 0); spike(A, 0, y + 3.16, 0, 6.9, 6.9, 1.5, roofA, 0);
  box(A, 0, y + 3.9, 0, 3.0, 0.7, 3.0, mul(C.red, 0.9), 0, { noTop: true }); box(A, 0, y + 4.6, 0, 4.0, 0.14, 4.0, C.cream, 0); spike(A, 0, y + 4.74, 0, 4.2, 4.2, 1.5, roofB, 0);
  spike(A, 0, y + 6.0, 0, 0.3, 0.3, 1.9, C.gold, 5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) spike(A, sx * 3.3, y + 3.16, sz * 3.3, 0.3, 0.3, 0.9, C.gold, 5, sx * 0.3, sz * 0.3);
  quadO(A, [-3.3, y + 2.72, 3.31], [3.3, y + 2.72, 3.31], [3.3, y + 3.0, 3.31], [-3.3, y + 3.0, 3.31], [0, y, 0], C.cream, 10, null, null, null, null, [0, 0], [6.6 / 0.34, 0], [6.6 / 0.34, 1], [0, 1]);
  for (let k = 0; k < 5; k++) { const s0 = A.count, lx = -2.0 + k; box(A, lx, y + 2.3, 2.45, 0.24, 0.34, 0.24, [C.red, C.marigold, L('#ec5a94')][k % 3], 13, { taper: 0.9 }); box(A, lx, y + 2.64, 2.45, 0.02, 0.36, 0.02, C.dark, 11, { noTop: true }); setSway(A, s0, 0.05, r()); }
  for (let k = 0; k < 9; k++) ball(A, -2.0 + k * 0.5, y + 2.95 - 0.28 * Math.sin(Math.PI * (k % 4) / 4 + 0.4), 2.62, 0.06, k % 2 ? C.marigold : mul(C.jasmine, 1.05), 5, 6);
  spiritHouse(A, r, -1.7, y, -1.6, C);
  lathe(A, 1.6, y, -1.5, [[0, 0.34], [0.34, 0.5], [0.48, 0.46]], mul(C.jar, 1.7), 11); box(A, 1.6, y + 0.46, -1.5, 0.7, 0.03, 0.7, C.leaf, 7);
  { const s0 = A.count; for (let k = 0; k < 4; k++) cloth(A, [-2.25 + k * 1.15, y + 0.85, 2.62], [-1.35 + k * 1.15, y + 0.85, 2.62], r.range(0.6, 0.8), 3, mul(C.saffron, r.range(0.85, 1.15)), r(), 0.01, 0.13); void s0; }
  for (let k = 0; k < 5; k++) box(A, 0, y - (k + 1) * 0.32 - 0.06, 3.05 + k * 0.16, 1.2, 0.06, 0.3, C.teak, 1, { bottom: true });
  A.resetT();
}
function buoy(A, x, z, col, C, r) {
  const s0 = A.count;
  lathe(A, x, -0.3, z, [[0, 0.55], [0.75, 0.6], [0.9, 0.3]], col, 11, 8); lathe(A, x, 0.6, z, [[0, 0.32], [1.3, 0.1]], col, 11, 6, false);
  box(A, x, 1.9, z, 0.05, 0.6, 0.05, C.steel, 11); box(A, x, 2.5, z, 0.16, 0.16, 0.16, col, 13);
  setSway(A, s0, 0.09, r());
}
function monitorGeo(A, C) {
  const c = L('#2c2f22'), c2 = L('#4a4a2a');
  box(A, 0.15, 0.03, 0, 0.75, 0.15, 0.24, c, 11, { taper: 0.8 }); box(A, 0.68, 0.06, 0, 0.34, 0.1, 0.14, c2, 11, { taper: 0.6, ox: 0.06 });
  beam(A, [-0.2, 0.09, 0], [-0.75, 0.06, 0.1], 0.14, 0.1, c, 11); beam(A, [-0.75, 0.06, 0.1], [-1.15, 0.04, 0.02], 0.07, 0.05, c2, 11);
  for (const sx of [-0.1, 0.42]) for (const s of [-1, 1]) beam(A, [sx, 0.07, s * 0.1], [sx + 0.08, 0.0, s * 0.3], 0.06, 0.05, c, 11);
}

// ---------- our long-tail, in boat space: the eye is the origin, forward is -Z, the water lies at y = -1.5 ----------
function ownBoat(A, r, C0, ribbons, tassel) {
  const C = { ...C0, teak: L(PALETTE[0], 1.7) };
  // the first two stations lie behind the eye and are never seen from it: they are what a viewer sees of us through the
  // previous world's portal, where the boat lies a length inside the entry with its stern toward them
  const st = [[3.5, 0.5, -0.98, -1.34], [2.5, 0.7, -1.07, -1.4], [1.2, 0.76, -1.10, -1.42], [-0.6, 0.75, -1.11, -1.42], [-1.7, 0.62, -1.10, -1.40], [-2.6, 0.42, -1.05, -1.34], [-3.4, 0.2, -0.97, -1.2]];
  const turq = L('#1fa39a'), red = L('#c0281e');
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1], zm = (a[0] + b[0]) / 2;
    quadO(A, [-a[1] + 0.06, a[3], a[0]], [a[1] - 0.06, a[3], a[0]], [b[1] - 0.06, b[3], b[0]], [-b[1] + 0.06, b[3], b[0]], [0, -9, zm], mul(C.teak, 0.6), 1);
    for (const s of [-1, 1]) {
      quadO(A, [s * (a[1] - 0.06), a[3], a[0]], [s * (b[1] - 0.06), b[3], b[0]], [s * b[1], b[2], b[0]], [s * a[1], a[2], a[0]], [s * 9, -1, zm], mul(C.teak, 0.85), 1);
      quadO(A, [s * a[1], a[2], a[0]], [s * b[1], b[2], b[0]], [s * (b[1] + 0.1), b[2], b[0]], [s * (a[1] + 0.1), a[2], a[0]], [0, -9, zm], turq, 11);
      quadO(A, [s * (a[1] + 0.1), a[2], a[0]], [s * (b[1] + 0.1), b[2], b[0]], [s * (b[1] + 0.05), b[2] - 0.34, b[0]], [s * (a[1] + 0.05), a[2] - 0.34, a[0]], [0, -1.2, zm], red, 11);
      if (i < 3) quadO(A, [s * (a[1] + 0.05), a[2] - 0.34, a[0]], [s * (b[1] + 0.05), b[2] - 0.34, b[0]], [s * b[1] * 0.5, b[3] - 0.12, b[0]], [s * a[1] * 0.5, a[3] - 0.12, a[0]], [0, -1.2, zm], mul(C.teak, 0.62), 1);   // the planking below the stripe, seen only from astern
    }
  }
  box(A, 0, -1.2, -2.25, 0.96, 0.05, 0.26, mul(C.teak, 1.15), 1);
  const hwAt = (z) => { for (let i = 0; i < st.length - 1; i++) if (z <= st[i][0] && z >= st[i + 1][0]) { const f = (st[i][0] - z) / (st[i][0] - st[i + 1][0]); return st[i][1] + (st[i + 1][1] - st[i][1]) * f; } return 0.7; };
  const flY = (z) => { for (let i = 0; i < st.length - 1; i++) if (z <= st[i][0] && z >= st[i + 1][0]) { const f = (st[i][0] - z) / (st[i][0] - st[i + 1][0]); return st[i][3] + (st[i + 1][3] - st[i][3]) * f; } return -1.42; };
  for (let z = 3.0; z > -2.55; z -= 0.4) box(A, 0, flY(z), z, 2 * hwAt(z) - 0.14, 0.05, 0.07, mul(C.teak, 0.95), 1);
  { // transom with its garland, stern deck, the engine, a thwart and the boatman's hat
    quadO(A, [-0.57, -1.3, 3.5], [0.57, -1.3, 3.5], [0.6, -0.98, 3.5], [-0.6, -0.98, 3.5], [0, -1.2, 0], red, 11);
    quadO(A, [-0.25, -1.48, 3.5], [0.25, -1.48, 3.5], [0.57, -1.3, 3.5], [-0.57, -1.3, 3.5], [0, -1.2, 0], mul(C.teak, 0.62), 1);
    quadO(A, [-0.3, -1.24, 3.515], [0.3, -1.24, 3.515], [0.3, -1.06, 3.515], [-0.3, -1.06, 3.515], [0, -1.2, 0], mul(C.cream, 0.9), 11);
    for (const sx of [-0.18, 0, 0.18]) quadO(A, [sx - 0.045, -1.195, 3.53], [sx + 0.045, -1.195, 3.53], [sx + 0.045, -1.105, 3.53], [sx - 0.045, -1.105, 3.53], [0, -1.2, 0], sx ? turq : red, 11);
    box(A, 0, -0.98, 3.5, 1.3, 0.05, 0.12, turq, 11);
    box(A, 0, -1.13, 3.0, 1.12, 0.05, 1.0, mul(C.teak, 1.1), 1);
    box(A, 0, -1.08, 2.85, 0.4, 0.28, 0.56, C.charcoal, 11, { taper: 0.85 }); box(A, 0, -0.8, 2.82, 0.28, 0.13, 0.32, red, 11, { taper: 0.9 });
    for (const sx of [-1, 1]) { const s0 = A.count; for (let k = 0; k <= 8; k++) { const f = k / 8; ball(A, sx * (0.12 + 0.36 * f), -1.02 - 0.13 * Math.sin(Math.PI * f), 3.56, 0.03, mul(C.jasmine, 1.05), 11, 6); } box(A, sx * 0.3, -1.3, 3.56, 0.09, 0.14, 0.09, mul(tassel, 1.2), 5, { taper: 0.5 }); setSway(A, s0, 0.006, 0.3 + 0.2 * sx); }
    box(A, 0, -1.2, 1.8, 2 * hwAt(1.8) - 0.06, 0.05, 0.28, mul(C.teak, 1.1), 1);
    lathe(A, 0.24, -1.15, 1.8, [[0, 0.3], [0.05, 0.2], [0.17, 0.02]], L('#c2a56c'), 11, 10, false);
    box(A, -0.28, -1.15, 1.8, 0.34, 0.045, 0.22, mul(ribbons[1], 0.85), 4);
  }
  for (const z of [-0.45, -1.35]) box(A, 0, -1.2, z, 2 * hwAt(z) - 0.06, 0.05, 0.28, mul(C.teak, 1.1), 1);
  { // the offering bowl: a footed brass bowl heaped with lotus and marigold heads, ringed with jasmine
    const bx = -0.26, bz = -1.85, by = flY(bz);
    lathe(A, bx, by, bz, [[0, 0.09], [0.025, 0.12], [0.05, 0.1], [0.09, 0.19], [0.17, 0.235], [0.2, 0.25], [0.215, 0.24], [0.19, 0.2]], mul(C.gold, 0.62), 11, 12, false);
    clump(A, r, bx, by + 0.215, bz, 0.15, 0.03, 0.15, mul(C.lotus, 0.8), 5, { piece: [0.05, 0.075], leaf: 0, petals: 5 });
    clump(A, r, bx, by + 0.235, bz, 0.12, 0.03, 0.12, mul(tassel, 0.7), 5, { piece: [0.045, 0.07], leaf: 0.2, petals: 5 });
    for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; ball(A, bx + Math.cos(a) * 0.258, by + 0.175 - 0.02 * Math.abs(Math.sin(a * 2)), bz + Math.sin(a) * 0.258, 0.028, mul(C.jasmine, 1.05), 11, 6); }
  }
  { // what a boatman keeps on the floor: a coil of rope, folded sarongs and jasmine garlands on two thwarts, two pomelos and a mango
    const hemp = L('#c2a56c'), rx = 0.3, rz = -1.92, ry = flY(rz);
    for (const [R, dy] of [[0.2, 0], [0.14, 0], [0.08, 0], [0.17, 0.05], [0.11, 0.05]]) ring(A, rx, ry + dy, rz, R, 0.03, mul(hemp, 0.85 + 0.3 * dy / 0.05 * 0.5), 11, 12);
    beam(A, [rx + 0.2, ry + 0.03, rz], [rx + 0.12, ry + 0.03, rz + 0.5], 0.05, 0.05, hemp, 11);
    for (const [tz, tx] of [[-2.25, -0.2], [-0.45, 0.28]]) { box(A, tx, -1.15, tz, 0.36, 0.045, 0.24, mul(ribbons[4], 0.8), 4); box(A, tx + 0.01, -1.105, tz + 0.01, 0.34, 0.04, 0.23, mul(ribbons[1], 0.85), 4); box(A, tx - 0.01, -1.065, tz - 0.01, 0.32, 0.035, 0.11, mul(ribbons[4], 0.9), 4); }
    ball(A, 0.24, flY(-0.9) + 0.06, -0.9, 0.085, mul(C0.mango, 0.8));
    ball(A, -0.34, flY(-0.98), -0.98, 0.105, mul(C0.pomelo, 0.85)); ball(A, -0.13, flY(-0.84), -0.84, 0.095, mul(C0.pomelo, 0.95));
    for (const [zg, half] of [[-2.11, 0.4], [-1.2, 0.5]]) {
      const s0 = A.count;
      for (let k = 0; k <= 18; k++) { const f = k / 18; ball(A, -half + 2 * half * f, -1.2 - 0.09 * Math.sin(Math.PI * f), zg + 0.012, 0.027, mul(C.jasmine, 1.05), 11, 6); }
      for (const sx of [-1, 1]) box(A, sx * half, -1.37, zg + 0.012, 0.1, 0.16, 0.1, mul(tassel, 1.2), 5, { taper: 0.5 });
      setSway(A, s0, 0.008, r());
    }
  }
  lathe(A, 0.24, flY(-0.9), -0.9, [[0, 0.2], [0.05, 0.23], [0.1, 0.19], [0.1, 0.1], [0.02, 0.09]], mul(C.cream, 0.85), 11, 10, false);
  cloth(A, [0.12, -1.17, -1.5], [0.52, -1.17, -1.5], 0.24, 1, mul(ribbons[2], 0.9), r(), 0.0, 0.015);
  // foredeck and the long upswept stem
  quadO(A, [-0.42, -1.05, -2.6], [0.42, -1.05, -2.6], [0.2, -0.97, -3.4], [-0.2, -0.97, -3.4], [0, -9, -3], mul(C.teak, 1.1), 1);
  for (const s of [-1, 1]) { quadO(A, [s * 0.3, -0.97, -3.4], [0, -0.95, -3.85], [0, -1.3, -3.7], [s * 0.26, -1.3, -3.4], [0, -1.2, -3.3], red, 11); quadO(A, [s * 0.2, -0.97, -3.4], [s * 0.3, -0.97, -3.4], [0, -0.95, -3.85], [0, -0.96, -3.8], [0, -9, -3.5], turq, 11); }
  beam(A, [0, -1.06, -3.2], [0, -0.95, -3.85], 0.2, 0.2, mul(C.teak, 1.1), 1); beam(A, [0, -0.95, -3.85], [0, -0.8, -4.22], 0.13, 0.15, mul(C.teak, 1.2), 1);
  spike(A, 0, -0.74, -4.22, 0.1, 0.1, 0.14, C.gold, 5, 0, -0.06);
  // seven silk ribbons wound round the stem, their long tails streaming back in our wind: each tail curves and droops,
  // and its phase advances along its length so a wave runs down it
  for (let i = 0; i < 7; i++) {
    const t = i / 6, zc = -3.58 - t * 0.52, yc = -0.99 + t * 0.2, col = ribbons[i];
    box(A, 0, yc - 0.1, zc, 0.19 - t * 0.05, 0.21 - t * 0.04, 0.062, col, 4);
    const s = i % 2 ? 1 : -1, len = r.range(1.3, 1.9), ph = r(), dx = s * r.range(0.42, 0.6), dy = r.range(-0.04, 0.14), dz = 0.9, dl = Math.hypot(dx, dy, dz);
    const curl = r.range(-0.05, 0.2) * s, droop = r.range(0.04, 0.12);
    const at = (f) => { const g = f * len / dl; return [s * 0.08 + dx * g + curl * f * f, Math.max(-0.98, yc + dy * g - droop * f * f), zc + dz * g]; };   // tails stay outside and above the gunwales
    // twenty stations: the silk turns a little about its own run, its normals are smooth along the tail, and the last
    // fifth splits into a forked tip. aMat 4.2..4.4 marks silk and carries the coordinate across the ribbon
    const NS = 20, wR = 0.036, S = [];
    for (let k = 0; k <= NS; k++) {
      const f = k / NS, c = at(f), a = at(Math.max(0, f - 0.02)), b = at(Math.min(1, f + 0.02)), tw = 0.55 * Math.sin(ph * TAU + f * 5.2) * Math.min(1, f * 4);
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const wx = Math.sin(tw) * wR, wy = Math.cos(tw) * wR;                              // the width vector, upright when tw = 0
      let nx = ty * 0 - tz * wy, ny = tz * wx - tx * 0, nz = tx * wy - ty * wx; const nl = Math.hypot(nx, ny, nz) || 1;
      S.push({ c, w: [wx, wy, 0], n: [nx / nl, ny / nl, nz / nl], f, sw: 0.03 + 0.37 * f, uv: [ph + f * 0.42, f] });
    }
    const pt = (st2, e) => [st2.c[0] + st2.w[0] * e, st2.c[1] + st2.w[1] * e, st2.c[2] + st2.w[2] * e];
    const silkTri = (ka, ea, kb, eb, kc, ec) => {
      const i0 = A.count, sa = S[ka], sb = S[kb], sc2 = S[kc];
      tri(A, pt(sa, ea), pt(sb, eb), pt(sc2, ec), col, col, col, 4, sa.uv, sb.uv, sc2.uv, sa.sw, sb.sw, sc2.sw);
      if (A.count === i0) return;
      const sg = A.nrm[i0 * 3] * sa.n[0] + A.nrm[i0 * 3 + 1] * sa.n[1] + A.nrm[i0 * 3 + 2] * sa.n[2] < 0 ? -1 : 1;   // keep the smooth normal on the side the winding faces
      [[sa, ea], [sb, eb], [sc2, ec]].forEach(([q, e], j) => { A.nrm[(i0 + j) * 3] = sg * q.n[0]; A.nrm[(i0 + j) * 3 + 1] = sg * q.n[1]; A.nrm[(i0 + j) * 3 + 2] = sg * q.n[2]; A.mat[i0 + j] = 4.3 + 0.1 * Math.max(-1, Math.min(1, e)); });
    };
    const strip = (k, a0, a1, b0, b1) => { silkTri(k, a0, k + 1, b0, k + 1, b1); silkTri(k, a0, k + 1, b1, k, a1); };
    for (let k = 0; k < NS; k++) {
      const g0 = Math.max(0, (S[k].f - 0.8) / 0.2), g1 = Math.max(0, (S[k + 1].f - 0.8) / 0.2);
      if (g1 <= 0) strip(k, -1, 1, -1, 1);
      else { strip(k, 1.3 * g0, 1 + 0.3 * g0, 1.3 * g1, 1 + 0.3 * g1); strip(k, -1 - 0.3 * g0, -1.3 * g0, -1 - 0.3 * g1, -1.3 * g1); }
    }
  }
  // jasmine garlands over the stem, each strand ending in a marigold tassel
  for (let g = 0; g < 3; g++) {
    const zc = -3.68 - g * 0.2, yc = -0.95 + g * 0.075, gl = 0.38 + 0.08 * g;
    for (const s of [-1, 1]) {
      const s0 = A.count, n = 8;
      for (let k = 0; k <= n; k++) { const f = k / n; box(A, s * (0.11 + 0.1 * Math.sin(f * 2.6)), yc - f * gl - 0.04, zc + 0.04 * f, 0.08, 0.08, 0.08, mul(C.jasmine, 1.15), 11, { ao: 0.9 }); }
      box(A, s * 0.17, yc - gl - 0.24, zc + 0.04, 0.15, 0.17, 0.15, mul(tassel, 1.3), 5, { taper: 0.5 });
      setSway(A, s0, 0.045, r());
    }
  }
}

export default {
  id: 'khlong-run',
  name: 'The Khlong Run',
  category: 'city',
  weirdness: 0.1,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, det = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    const vr = rng.fork('look'), pick = vr.pick(['golden', 'golden', 'golden', 'golden', 'storm', 'storm', 'dawn', 'night']);
    const lookId = { golden: 'golden', dawn: 'dawn', night: 'night', day: 'storm' }[vary.hour] || pick;
    const look = LOOKS[lookId], rare = !!vary.rare, night = look.night, duration = 44;
    const scene = new THREE.Scene();
    const skyOpts = { rng, ...look.sky, bake: night > 0, renderer: ctx.renderer };
    if (!night) { skyOpts.sunElevation = look.sunEl; skyOpts.sunAzimuth = look.sunAz; }
    const sky = makeSky(skyOpts); scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(new THREE.Color(look.fog), look.density);
    const rig = makeLightRig(sky, { bounce: 0.35 }); scene.add(rig.object);
    const SUN = (night ? sky.lightDirection : sky.sunDirection).clone().normalize();
    const C = makeColours(rng.fork('colours'), look);
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

    // ---- path: N 0..604 along the canal's line, then the river; uOfN maps metres north to path progress ----
    const pts = [];
    for (let i = 0; i <= 50; i++) { const n = 604 * i / 50; pts.push([canalX(n) + swerve(n), 1.5, Z0 - n]); }
    const path = makePath(pts);
    const uOfN = (n) => path.nearestXZ(canalX(n) + swerve(n), Z0 - n).u;

    // ---- shared uniforms ----
    const sx = Math.abs(SUN.x) < 0.05 ? 0.05 : SUN.x;
    const barTex = new THREE.DataTexture(new Uint8Array(512 * 4 * 4), 512, 4, THREE.RGBAFormat);
    barTex.minFilter = barTex.magFilter = THREE.LinearFilter; barTex.wrapS = barTex.wrapT = THREE.ClampToEdgeWrapping;
    const U = {
      uTime: { value: 0 }, uSun: { value: SUN }, uSunCol: { value: col(look.sun, look.sunK) }, uSkyC: { value: col(look.skyFill, look.fillK) }, uGndC: { value: col(look.gnd, look.gndK) },
      uBounce: { value: col(look.bounce, 0.95) }, uLampC: { value: col('#ff9a44', 0.6) }, uNight: { value: night }, uWet: { value: look.wet }, uObj: { value: 0 },
      uBoat: { value: new THREE.Vector3(0, Z0, 0) }, uBar: { value: barTex }, uSunK: { value: new THREE.Vector4(sx < 0 ? 1 : -1, SUN.z / Math.abs(sx), SUN.y / Math.abs(sx), look.bars) },
      uZen: { value: sky.zenithColor.clone() }, uHor: { value: look.mirrorHor ? col(look.mirrorHor) : sky.horizonColor.clone() }, uScat: { value: col(look.sky.scatterColor || '#000000', night ? 0 : (look.scatK ?? 0.55)) },
      uFerry: { value: new THREE.Vector4(0, 0, -1, 0) }, uFerryK: { value: 0 },
      uDeepC: { value: col(look.waterDeep) }, uDeepR: { value: col(look.riverDeep) }, uBrass: { value: col(look.brass, look.sunK * 0.9) }, uGlint: { value: look.glint },
      uRing: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 0, 0, 0)) }, uBoil: { value: new THREE.Vector3(0, 0, 0) }, uOwn: { value: new THREE.Vector4(0, -1, 1, 0) },
      uSprayC: { value: col(look.spray) }, uSprayK: { value: 1 }, uFoamC: { value: col(look.spray, night ? 0.3 : 0.8) },
      uEgretLit: { value: col(night ? '#b8c8f0' : '#fff4dc', night ? 0.5 : 1.3) }, uEgretShade: { value: col(night ? '#33406a' : '#d6cbbd', night ? 0.6 : 0.95) },
      // the river's mirror: its ramp and gains (rivK: ramp on/off, hammered brass, lift, trough), the far bank's colour, and what stands
      // in the water along the avenue (uPole: x, z, height, then a banner's offset, or 10 + half width for a sala, or 20 + half width for a tiered umbrella; two colours each), filled in below
      uRamp: { value: (look.ramp || ['#000000', '#000000', '#000000']).map((h) => col(h)) }, uRivK: { value: new THREE.Vector4(...(look.rivK || [0, 1, 1, 0.36])) },
      uBankC: { value: new THREE.Color(0.05, 0.075, 0.03).multiply(col(look.sun, look.sunK * 0.35).add(col(look.skyFill, look.fillK))) },
      uPole: { value: Array.from({ length: 14 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uPoleA: { value: Array.from({ length: 14 }, () => new THREE.Color(0, 0, 0)) }, uPoleB: { value: Array.from({ length: 14 }, () => new THREE.Color(0, 0, 0)) },
    };
    if (night) for (const c of [U.uHor.value, U.uZen.value]) { const l = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; c.lerp(new THREE.Color(l * 0.85, l, l * 1.3), 0.45); }   // the river mirrors a quieter blue than the sky's
    const matK = makeKhlongMaterial(U), matMove = makeKhlongMaterial({ ...U, uObj: { value: 1 } }), matWater = makeWaterMaterial(U);
    await ctx.yield();

    // ---- the hero: the river temple ----
    const hero = await buildHero(ctx, { palette: PALETTE, sunDir: SUN, prangScale: 1.25, column: night ? 0.55 : 1 });
    hero.uniforms.uGold.value.copy(night ? col('#cfe0ff', 0.9) : look.mirror ? col(look.mirror.gold[0], look.mirror.gold[1]) : col(look.brass, 1.0).lerp(col('#ff8a2a'), 0.25));
    // the temple's reflection: on the river's deep bronze its own cream and slate now stand out, so only its gain, the depth of its
    // dashes and the width of the gold column are retuned (a look may still give mirror.lit and mirror.shade)
    if (look.mirror) { if (look.mirror.lit) hero.uniforms.uLit.value.copy(col(look.mirror.lit)); if (look.mirror.shade) hero.uniforms.uShade.value.copy(col(look.mirror.shade)); hero.uniforms.uMK.value.fromArray(look.mirror.k); }
    hero.setSun(SUN, look.sun, look.glint * (night ? 0.6 : 1));
    if (night) { hero.uniforms.uFillGnd.value.set(0.7, 0.62, 0.48); hero.uniforms.uFillSky.value.set(0.27, 0.3, 0.44); }
    scene.add(hero.object);
    const AN = hero.anchors;
    await ctx.yield();

    // ---- water ----
    const waterGeo = new THREE.PlaneGeometry(5200, 1500, 1, 1); waterGeo.rotateX(-Math.PI / 2); waterGeo.translate(0, 0, 60 + 750);
    const water = new THREE.Mesh(waterGeo, matWater); water.renderOrder = 1; scene.add(water);
    { // an apron under the surface behind the way in: seen through the previous world's portal, the part of the opening
      // that lies below the waterline shows rippling water instead of the sky's floor; the riding camera never sees it
      const ag = new THREE.BufferGeometry(), x = 90, za = Z0 + 1, zb = Z0 - 50, ya = -6.2, yb = -0.05;
      ag.setAttribute('position', new THREE.Float32BufferAttribute([-x, ya, za, x, ya, za, x, yb, zb, -x, yb, zb], 3));
      ag.setIndex([0, 1, 2, 0, 2, 3]); ag.computeVertexNormals();
      const apron = new THREE.Mesh(ag, matWater); apron.renderOrder = 1; apron.frustumCulled = false; apron.name = 'apron'; scene.add(apron);
    }

    // ---- the canal: lots on both banks, built in 50 m chunks ----
    const A = makeAcc(120000);
    const banks = [{ s: -1, lots: layoutBank(rng.fork('west')) }, { s: 1, lots: layoutBank(rng.fork('east')) }];
    { // the temple-school pier on the right bank of the market
      const gaps = banks[1].lots.filter((l) => l.type === 'gap' && l.kind !== 'landing').sort((a, b) => Math.abs((a.n0 + a.n1) / 2 - 207) - Math.abs((b.n0 + b.n1) / 2 - 207));
      if (gaps[0]) { gaps[0].kind = 'pier'; gaps[0].school = true; }
    }
    const frameAt = (n, s) => { const dx = canalDX(n), len = Math.hypot(1, dx), hwn = canalHW(n); return { x: canalX(n) + s * hwn / len, z: Z0 - n + s * hwn * dx / len, rot: Math.atan2(-s / len, -s * dx / len), dx, len }; };
    const local = (B, x, z) => { const c = Math.cos(B.rot), s = Math.sin(B.rot); return [B.x + x * c + z * s, B.z - x * s + z * c]; };
    const pathClear = (x, z) => path.nearestXZ(x, z).dist;
    const moored = [], posts = [], poles = [], bulbs = [], gardens = [], incense = [], riverBoats = [];
    // what stands and floats out on the open river hangs under one group, shown from u 0.35 on: until then the canal's bends hide the river
    const riverG = new THREE.Group(); riverG.name = 'river-life'; scene.add(riverG);
    let school = null, monitorAt = null;
    const washNs = [38, 74, 88, 116, 131, 160, 244, 252, 298, 310, 333], pipeC = rng.pick([C.blue, C.white, C.mint]);
    const flush = async (name) => { if (A.count > 0) { const m = new THREE.Mesh(toGeo(A), matK); m.name = name; scene.add(m); } await ctx.yield(); };
    for (let ci = 0; ci < 8; ci++) {
      const nA = -50 + ci * 50, nB = nA + 50;
      for (const bank of banks) { let nl = 0; for (const lot of bank.lots) {
        const mid = (lot.n0 + lot.n1) / 2;
        if (mid < nA || mid >= nB) continue;
        if (++nl % 3 === 0) await ctx.yield();
        const s = bank.s, W = lot.n1 - lot.n0, B = frameAt(mid, s), r = rng.fork('lot' + lot.i + s);
        if (lot.type === 'house') {
          const fl = r.chance(0.42) ? 2 : 1, o = { W: W - 0.5, style: C.styles[r.int(0, 5)], deckY: r.range(1.15, 1.5), ver: r.range(1.3, 1.9), D: r.range(6, 8), floors: fl, rail: r.chance(0.8), gableFront: r.chance(0.38) };
          o.balcony = fl === 2 && r.chance(0.6); o.awning = !o.balcony && r.chance(0.85);
          { const prev = bank.lots[bank.lots.indexOf(lot) - 1]; o.side = s; if (prev && prev.type !== 'gap') o.sideR = makeRng('kside' + ctx.seed + ':' + lot.i + ':' + s); }
          const res = house(A, r, B, o, C);
          lot.top = res.top; lot.color = res.color;
          if (r.chance(0.5)) { const lx = res.xs + r.sign() * 2.1, [mx, mz] = local(B, lx, 0.8); if (Math.abs(lx) < W / 2 && pathClear(mx, mz) > 2.6 && mid > 16) moored.push({ x: mx, z: mz, rot: B.rot + r.range(-0.06, 0.06), v: 3, n: mid }); }
          const bd = r.range(6, 9), [bx, bz] = local(B, r.range(-1, 1), -(o.D + r.range(3.5, 7) + bd / 2));
          backHouse(A, r, { x: bx, z: bz, rot: B.rot }, W + r.range(-1, 2), bd, r.range(4.5, 8.5), mul(r.pick(C.styles).wall, r.range(0.7, 1.0)), mul(r.pick(C.roofs), r.range(0.75, 1.05)), C);
        } else {
          const out = gapLot(A, r, B, { W, kind: lot.kind, spirit: lot.school || r.chance(0.7), i: lot.i, pole: s > 0 && lot.kind !== 'market' }, C);
          lot.top = 0; lot.color = C.leaf;
          if (out.post) posts.push({ p: out.post, n: mid, s });
          if (out.pole) poles.push({ p: out.pole, n: mid });
          if (out.spirit) incense.push(out.spirit);
          if (lot.kind === 'garden' || lot.kind === 'pier') gardens.push({ B, W, n: mid, s });
          if (lot.school) {
            school = { B, n: mid, steps: out.steps };
            A.setT(B.x, 0, B.z, B.rot, 1);
            box(A, 0, 1.75, -2.6, W - 0.6, 0.06, 0.06, C.teakD, 1); for (const sx2 of [-1, 1]) box(A, sx2 * (W / 2 - 0.4), 0.95, -2.6, 0.07, 0.85, 0.07, C.teakD, 1, { noTop: true });
            for (let x = -W / 2 + 0.5; x < W / 2 - 0.9; x += 0.85) cloth(A, [x, 1.8, -2.57], [x + 0.75, 1.8, -2.57], r.range(0.6, 0.78), 3, mul(C.saffron, r.range(0.85, 1.15)), r(), 0.01, 0.13);
            A.resetT();
          } else if (out.steps && !monitorAt && mid > 205 && mid < 250 && s < 0) monitorAt = { p: out.steps, n: mid, rot: B.rot };
        }
      } await flush('canal' + ci + (bank.s < 0 ? 'w' : 'e')); }
      for (const b of BRIDGES) if (b.n >= nA && b.n < nB) bridge(A, rng.fork('br' + b.n), { x: canalX(b.n), z: Z0 - b.n, rot: Math.atan2(-canalDX(b.n), 1) }, { type: b.type, soffit: b.soffit, hw: canalHW(b.n), pipe: pipeC }, C, bulbs);
      await ctx.yield();
      if (SLUICE_N >= nA && SLUICE_N < nB) { sluice(A, { x: canalX(SLUICE_N), z: Z0 - SLUICE_N, rot: Math.atan2(-canalDX(SLUICE_N), 1) }, canalHW(SLUICE_N), C); await ctx.yield(); }
      for (const wn of washNs) if (wn >= nA && wn < nB) washLine(A, rng.fork('wash' + wn), { x: canalX(wn), z: Z0 - wn, rot: Math.atan2(-canalDX(wn), 1) }, canalHW(wn), rng.range(5.4, 6.7), C, wn < 120);
      if (ci === 7) { // the last houses stand on piles out in the river and frame the doorway of gold
        for (const s of [-1, 1]) for (const n of [351.5, 361.5]) {
          const r = rng.fork('pile' + n + s);
          house(A, r, { x: s * 4.7, z: Z0 - n, rot: Math.atan2(-s, 0) }, { W: 9, style: C.styles[r.int(0, 5)], deckY: 2.1, pile: 1.6, ver: 1.5, D: 6.5, floors: 1, rail: true, gableFront: n > 360, balcony: false, awning: n < 360, side: n < 360 ? s : -s }, C);
        }
        washLine(A, makeRng('kpilewash' + ctx.seed), { x: 0, z: Z0 - 356.6, rot: 0 }, 4.7, 5.9, C, true);   // one last line of washing across the mouth, parted round the spire
        await flush('canal7p');
        // the village goes on out into the river, opening like a funnel: three more pile houses a side, each with a plank
        // pier reaching to 5.5 m from our line, a parasol at its head and a sampan moored there (these rock in our wake)
        for (const s of [-1, 1]) {
          [372, 382.5, 394.5].forEach((n, k) => {
            const r = makeRng('kpile2:' + ctx.seed + ':' + n + ':' + s), xh = 10.5 + k * 3, B = { x: s * xh, z: Z0 - n, rot: Math.atan2(-s, 0) }, two = k === 1 ? s > 0 : k === 2 && s < 0;
            const res = house(A, r, B, { W: r.range(7.6, 8.8), style: C.styles[r.int(0, 5)], deckY: 2.1, pile: 1.6, ver: 1.5, D: 6.5, floors: two ? 2 : 1, rail: true, gableFront: k === 1, balcony: two, awning: !two, side: s }, C);
            const px = Math.max(-1.2, Math.min(1.2, res.xs)), len = xh - 5.5 - 2.2;
            pilePier(A, r, B, px, len, C, C.parasol[(k + (s > 0 ? 1 : 3)) % 4]);
            const [bx, bz] = local(B, px + r.range(-0.4, 0.4), len + 2.2 + 0.72);
            riverBoats.push({ x: bx, z: bz, rot: Math.PI / 2 + r.range(-0.08, 0.08), v: k === 1 ? 3 : 4 + (k + (s > 0 ? 0 : 1)) % 2, n, vendor: true });
          });
          { const pm = new THREE.Mesh(toGeo(A), matK); pm.name = 'pile' + (s < 0 ? 'w' : 'e'); riverG.add(pm); }
          await ctx.yield();
        }
      }
      await flush('canal' + ci);
    }
    // bar texture: row 0 = gaps and roof heights of both banks, rows 1 and 2 = the two walls' colour and height (for the water)
    {
      const d = barTex.image.data, lotAt = (lots, n) => { for (const l of lots) if (n >= l.n0 && n < l.n1) return l; return null; };
      for (let i = 0; i < 512; i++) {
        const n = -70 + 450 * (i + 0.5) / 512, lw = lotAt(banks[0].lots, n), le = lotAt(banks[1].lots, n);
        const gw = !lw || lw.type === 'gap' ? 1 : 0, ge = !le || le.type === 'gap' ? 1 : 0;
        d[i * 4] = gw * 255; d[i * 4 + 1] = Math.min(255, (lw && lw.top || 0) / 16 * 255); d[i * 4 + 2] = Math.min(255, (le && le.top || 0) / 16 * 255); d[i * 4 + 3] = ge * 255;
        [lw, le].forEach((l, k) => {
          const o = (512 * (k + 1) + i) * 4, c = l && l.type === 'house' ? l.color : [0.05, 0.1, 0.03], h = l ? (l.type === 'house' ? l.top : 3.5) : 0;
          d[o] = Math.sqrt(sat(c[0])) * 255; d[o + 1] = Math.sqrt(sat(c[1])) * 255; d[o + 2] = Math.sqrt(sat(c[2])) * 255; d[o + 3] = Math.min(255, h / 16 * 255);
        });
      }
      barTex.needsUpdate = true;
    }
    const gapOpen = (n) => { const lots = banks[U.uSunK.value.x > 0 ? 0 : 1].lots; for (let i = 0; i < lots.length; i++) { const l = lots[i]; if (n >= l.n0 && n < l.n1) return l.type === 'gap' ? 1 : 0; } return 1; };

    // ---- wires and mynas, land, the moored rice barge, river-bank houses, buoys: one more static mesh ----
    poles.sort((a, b) => a.n - b.n);
    { const r = rng.fork('wires');
      for (let i = 0; i < poles.length - 1; i++) if (poles[i + 1].n - poles[i].n < 60) for (let k = 0; k < 3; k++) {
        const p = poles[i].p[k], q = poles[i + 1].p[k]; wire(A, p, q, 0.45, 6, C.dark);
        if (k === 0) for (let m = r.int(0, 4); m > 0; m--) { const f = r.range(0.15, 0.85); box(A, p[0] + (q[0] - p[0]) * f, wireY(p, q, 0.45, f) + 0.01, p[2] + (q[2] - p[2]) * f, 0.1, 0.17, 0.2, C.charcoal, 11, { taper: 0.6 }); }
      }
      for (const s of [-1, 1]) for (let n = -330; n < MOUTH; n += 10) {
        const n1 = Math.min(MOUTH, n + 10), e0 = canalX(n) + s * (canalHW(n) + 3.6), e1 = canalX(n1) + s * (canalHW(n1) + 3.6), za = Z0 - n, zb = Z0 - n1, far = s * 1100;
        quadO(A, [e0, 0.55, za], [e1, 0.55, zb], [far, 0.55, zb], [far, 0.55, za], [0, -50, za], C.earth, 8);
        quadO(A, [e0, 0.55, za], [e1, 0.55, zb], [e1, -1.2, zb], [e0, -1.2, za], [s * 500, 0, za], mul(C.earth, 0.7), 8);
      }
      for (const s of [-1, 1]) {
        quadO(A, [s * 8.1, 0.55, Z0 - MOUTH], [s * 1100, 0.55, Z0 - MOUTH], [s * 1100, -1.2, Z0 - MOUTH], [s * 8.1, -1.2, Z0 - MOUTH], [0, 0, 600], mul(C.earth, 0.7), 8);
        box(A, s * 833, -1.6, -211, 1534, 4.1, 578, C.earth, 8, { ao: 0.6 });
        quadO(A, [s * 66, -1.6, 78.05], [s * 600, -1.6, 78.05], [s * 600, 2.5, 78.05], [s * 66, 2.5, 78.05], [0, 0, 0], mul(C.stucco, 0.8), 6);
        await ctx.yield();
        for (let k = 0; k < 11; k++) { const rr = rng.fork('rb' + k + s); backHouse(A, rr, { x: s * (17 + k * 10.5 + rr.range(-1.5, 1.5)), z: Z0 - MOUTH - 3.5 - rr.range(0, 2), rot: Math.PI }, rr.range(6.5, 9), rr.range(5, 7), rr.range(3, 5.5), mul(rr.pick(C.styles).wall, rr.range(0.8, 1.1)), mul(rr.pick(C.roofs), rr.range(0.8, 1.1)), C, rr.range(1.8, 2.4)); }
      }
      box(A, 0, -1.6, -290, 132, 4.1, 420, C.earth, 8);
      await ctx.yield();
      { const n = BARGE_N, dx = canalDX(n); A.setT(canalX(n) + canalHW(n) - 1.85, 0, Z0 - n, Math.atan2(1, dx), 0.6); riceBarge(A, rng.fork('moorbarge'), C, false); A.resetT(); }
      const br = rng.fork('buoys');
      for (const [n, side] of [[388.5, 1], [404, -1], [424, -1], [452, 1], [476, 1], [500, 1], [520, 1], [556, -1], [584, 1]]) buoy(A, canalX(n) + swerve(n) + side * br.range(5.5, 8), Z0 - n, side > 0 ? C.red : L('#2f9a52'), C, br);
      const sr = rng.fork('stakes');
      for (const [n, lat] of [[381, 12.5], [409, -19.5], [489, -21], [529, 13], [559, -23.5], [577, 14]]) {
        const x0 = swerve(n) + lat, z0 = Z0 - n, slant = sr.range(-0.35, 0.35), np = sr.int(5, 7);
        for (let k = 0; k < np; k++) {
          const px = x0 + slant * k * 1.7 + sr.range(-0.15, 0.15), pz = z0 - k * 1.7, ph = sr.range(1.9, 3.5), ln = sr.range(-0.12, 0.12);
          beam(A, [px, -0.6, pz], [px + ln, ph, pz + sr.range(-0.1, 0.1)], 0.075, 0.075, mul(C.pile, sr.range(0.9, 1.5)), 1);
          if (k === 0 || sr.chance(0.25)) cloth(A, [px + ln, ph - 0.05, pz], [px + ln + 0.42, ph - 0.05, pz], 0.3, 1, sr.pick([C.red, C.white, C.saffron]), sr(), 0.02, 0.12);
        }
        wire(A, [x0, 0.5, z0], [x0 + slant * (np - 1) * 1.7, 0.5, z0 - (np - 1) * 1.7], 0.25, 6, C.dark);
      }
      { const pr = makeRng('kpoolstakes' + ctx.seed);   // mooring stakes with pennants stand round the turning pool
        for (const [n, lat] of [[4, -6.9], [7.5, -7.2], [11, -6.8], [5, 7.0], [12.5, 6.7], [17, 6.4], [18.5, -6.3]]) {
          const px = canalX(n) + lat, pz = Z0 - n, ph = pr.range(2.0, 3.4), ln = pr.range(-0.14, 0.14);
          beam(A, [px, -0.6, pz], [px + ln, ph, pz + pr.range(-0.1, 0.1)], 0.09, 0.09, mul(C.pile, pr.range(0.9, 1.3)), 1);
          cloth(A, [px + ln, ph - 0.05, pz], [px + ln + (lat > 0 ? -0.5 : 0.5), ph - 0.05, pz], 0.34, 1, pr.pick([C.red, C.white, C.saffron, C.marigold]), pr(), 0.02, 0.12);
        } }
      const m = new THREE.Mesh(toGeo(A), matK); m.name = 'misc'; m.frustumCulled = false; scene.add(m);
      await ctx.yield();
      // ---- the open river's own furniture, drawn from rngs of their own: a rice barge moored along our course to
      // starboard (its flank slides past 8 m off), a little sala on piles to port, and a water gate of two tall banner
      // poles before the last straight ----
      { const rr = makeRng('kriver' + ctx.seed);
        A.setT(10.2, 0, Z0 - 410.5, Math.PI / 2, 0.8); riceBarge(A, rr, C, false); A.resetT();
        for (const [bx, bn] of [[7.2, 398.2], [7.3, 421.6]]) { beam(A, [bx, -0.6, Z0 - bn], [bx + 0.1, 3.1, Z0 - bn], 0.16, 0.16, C.pile, 1); cloth(A, [bx + 0.1, 3.0, Z0 - bn], [bx - 0.5, 3.0, Z0 - bn], 0.36, 1, rr.pick([C.red, C.saffron]), rr(), 0.02, 0.12); }
        await ctx.yield();
        riverSala(A, rr, -22.5, Z0 - 473, Math.PI / 2 - 0.25, C);
        riverBoats.push({ x: -17.6, z: Z0 - 468.6, rot: Math.PI / 2 - 0.2, v: 3, n: 468.6, vendor: true }, { x: -18.0, z: Z0 - 478.8, rot: Math.PI / 2 - 0.45, v: 5, n: 478.8, vendor: true });
        await ctx.yield();
        const bc = [[C.red, C.marigold, C.jasmine], [L('#ec5a94'), C.jasmine, C.marigold], [C.saffron, C.red, C.jasmine], [C.marigold, L('#3fa05a'), C.jasmine]];
        [[-8.6, 546, 11.5, 1], [8.8, 547, 12.5, -1], [-9.4, 506, 9.5, 1], [9.6, 514, 10, -1]].forEach(([bx, bn, h, dir], i) => bannerPole(A, rr, canalX(bn) + swerve(bn) + bx, Z0 - bn, h, C, bc[i], dir));
        await ctx.yield();
        // ---- the water avenue. From the ferry's lane to the landing the last 150 m run between two rows of tall things that
        // stand in the river on the temple's axis: more banner poles, a pair of white tiered umbrellas, strings of pennants
        // from pole to pole (two lines of perspective that meet at the portal) and a second sala to starboard. Everything is
        // drawn from an rng of its own. The water mirrors each of them (uPole).
        { const ar = makeRng('kavenue' + ctx.seed), stand = [], mir = [];
          [[-8.6, 546, 11.5, 1], [8.8, 547, 12.5, -1], [-9.4, 506, 9.5, 1], [9.6, 514, 10, -1]].forEach(([bx, bn, h, dir], i) => stand.push([canalX(bn) + swerve(bn) + bx, bn, h, dir, bc[i]]));
          for (const [x, bn, h, dir, ci] of [[-10.2, 446, 12.5, 1, 2], [10.5, 447, 11.5, -1, 0], [-10.6, 482, 11, 1, 1], [10.2, 483, 12, -1, 3], [-9.6, 572, 10.5, 1, 3], [9.6, 573, 11.5, -1, 1]]) {
            const ph = ar();
            if (rare && bn < 461) continue;   // the royal barges are rowed through this water
            bannerPole(A, makeRng('kpole' + bn + ':' + ctx.seed + ph), x, Z0 - bn, h, C, bc[ci], dir); stand.push([x, bn, h, dir, bc[ci]]);
          }
          for (const p of stand) mir.push([p[0], Z0 - p[1], p[2], p[3] * 0.9, p[4][1], p[4][2]]);
          for (const sx of [-1, 1]) { chatra(A, ar, sx * 7.2, Z0 - 529, 10.5, C); mir.push([sx * 7.2, Z0 - 529, 9.4, 21.1, mul(C.jasmine, 0.92), C.gold]); }
          await ctx.yield();
          const pc = [C.red, C.marigold, C.jasmine, L('#ec5a94'), L('#3fa05a'), C.saffron];
          for (const side of [-1, 1]) {
            const row = stand.filter((p) => (p[0] < 0 ? -1 : 1) === side && p[1] > 470).sort((a, b) => a[1] - b[1]);
            for (let k = 0; k + 1 < row.length; k++) pennants(A, ar, [row[k][0], row[k][2] - 0.35, Z0 - row[k][1]], [row[k + 1][0], row[k + 1][2] - 0.35, Z0 - row[k + 1][1]], pc, k * 2 + (side > 0 ? 3 : 0));
          }
          await ctx.yield();
          riverSala(A, ar, 17.5, Z0 - 501, -Math.PI / 2 + 0.9, C);
          const roofC = L(PALETTE[4], 1.05), redC = mul(C.red, 0.6);
          mir.push([-22.5, Z0 - 473, 8.4, 13.3, roofC, redC], [17.5, Z0 - 501, 8.4, 13.3, roofC, redC]);
          const lk = new THREE.Color(look.sun).multiplyScalar(look.sunK * 0.4).add(new THREE.Color(look.skyFill).multiplyScalar(look.fillK * 0.75));
          mir.slice(0, 14).forEach((m, i) => { U.uPole.value[i].set(m[0], m[1], m[2], m[3]); U.uPoleA.value[i].setRGB(m[4][0] * lk.r, m[4][1] * lk.g, m[4][2] * lk.b); U.uPoleB.value[i].setRGB(m[5][0] * lk.r, m[5][1] * lk.g, m[5][2] * lk.b); });
        }
        const rm = new THREE.Mesh(toGeo(A), matK); rm.name = 'riverlife'; riverG.add(rm);
      }
    }
    await ctx.yield();

    // ---- instanced sampans: moored ones, the two vendor boats we swerve round, eight in the floating market ----
    const boatList = moored.slice();
    { const r = rng.fork('vendors');
      const put = (n, lat, v, yaw) => { const B = frameAt(n, 0), x = canalX(n) + lat / B.len, z = Z0 - n + lat * B.dx / B.len; boatList.push({ x, z, rot: Math.atan2(1, B.dx) + yaw, v, n, vendor: true }); };
      put(85, -1.45, 0, 0.12); put(130, 1.5, 2, -0.1);
      for (let k = 0; k < 8; k++) { const n = 168 + k * 5.6 + r.range(-0.8, 0.8), sw = swerve(n), lat = (sw > 0 ? -1 : 1) * r.range(3.4, 4.6); put(n, lat, k % 3 === 2 ? 2 : k % 2, r.range(-0.3, 0.3)); }
      put(236, 2.9, 1, 0.15); put(322, 2.6, 0, -0.12);

      for (const [n, lat, v] of [[483, 9, 0], [416, -17.5, 1], [503, -19.5, 3], [538, 10, 2], [567, -6.6, 1], [586, 11.5, 3]]) boatList.push({ x: swerve(n) + lat, z: Z0 - n + r.range(-2, 2), rot: r.range(0, TAU), v, n, vendor: true });
      put(9.5, -5.0, 1, 0.14); put(15.5, 5.2, 0, -0.2);   // two vendors lie in the turning pool, either side of the way in
      put(3.5, 5.7, 3, 0.1); put(24.5, 4.1, 1, -0.12);    // and two more, so the view through the portal has boats on both sides
      // the floating market spills out onto the river: vendor sampans with someone paddling (variants 4..6), close on
      // both sides of our line all the way to the temple, clear of the ferry's lane (N 429-449) and of the barge train
      const mr = makeRng('kmarket' + ctx.seed);
      for (const [n, lat, v] of [[386, -3.7, 4], [402, 4.1, 5], [409, -4.6, 6], [418, 4.4, 4], [419.5, -3.9, 5], [457, 3.8, 6], [453, -4.4, 4], [461.5, 6.2, 5], [461, -3.8, 4], [489, 4.4, 5], [494, -4.7, 6], [497, 10.8, 4], [506, -3.9, 5], [512, 3.8, 4], [524, -4.6, 6], [533, 4.3, 5], [541, -4.4, 4], [551, 4.9, 6], [562, -5.2, 5]]) {
        const x = canalX(n) + swerve(n) + lat, z = Z0 - n;
        const yaw = mr.range(-0.45, 0.45);
        if (rare && n > 444 && n < 459) continue;   // the royal barges' oars sweep this water
        if (pathClear(x, z) >= 3) riverBoats.push({ x, z, rot: Math.PI / 2 + yaw, v, n, vendor: true });
      }
      // and more of them: knots of two and three vendors inside the avenue, from the ferry's lane to the landing
      const mr2 = makeRng('kmarket2' + ctx.seed);
      for (const [n, lat, v] of [[447, -7.2, 5], [448.5, 3.9, 4], [468, -6.6, 6], [471.5, -4.2, 4], [476, -7.4, 5], [486, -4.3, 5], [503.5, 4.3, 6], [498.5, -8.0, 4], [517.5, -4.1, 5],
        [545, 4.2, 5], [549.5, 7.3, 6], [550, -3.9, 4], [569, 4.4, 5], [574, -4.3, 6], [578.5, 4.0, 4]]) {
        const x = canalX(n) + swerve(n) + lat, z = Z0 - n, yaw = mr2.range(-0.5, 0.5);
        if (rare && n > 444 && n < 459) continue;
        if (pathClear(x, z) >= 3) riverBoats.push({ x, z, rot: Math.PI / 2 + yaw, v, n, vendor: true });
      }
      for (const b of riverBoats) boatList.push(b);
    }
    const sampans = [];
    for (let v = 0; v < 7; v++) {
      const list = boatList.filter((b) => b.v === v); if (!list.length) continue;
      if (v > 3) sampan(A, makeRng('ksampan' + v + ':' + ctx.seed), v - 4, C, true); else sampan(A, rng.fork('sampan' + v), v, C);
      const im = new THREE.InstancedMesh(toGeo(A), matMove, list.length); im.frustumCulled = false; im.name = 'sampans' + v;
      const hc = v > 3 ? makeRng('khulls' + v + ':' + ctx.seed) : rng.fork('hulls' + v), tint = new THREE.Color();
      list.forEach((b, i) => { b.ph = hc.range(0, TAU); b.u = uOfN(b.n); const c = hc.pick([C.white, C.mint, C.blue, C.ochre, C.teak, C.red, C.cream]); im.setColorAt(i, tint.setRGB(c[0] * 1.2, c[1] * 1.2, c[2] * 1.2)); });
      (v > 3 ? riverG : scene).add(im); sampans.push({ im, list });
    }
    const noodle = boatList.find((b) => b.v === 2 && b.n < 140);

    // ---- the river: the barge train (or, rarely, the royal procession), ferries, far long-tails, wakes ----
    // the royal procession is rowed slowly: the last barge lies broadside across our bow from the burst on (its flank and oars fill the
    // right of the frame from u 0.62) and its stern clears our line at u 0.695, so that the curled stern post slides by to starboard at 0.74
    const train = { z: rare ? 240 : 222, v: rare ? 3.15 : 0.45, uPass: rare ? 0.695 : uOfN(470), stern: rare ? canalX(450) + swerve(450) : 4.6, off: 0, mesh: null };
    { const r = rng.fork('train');
      if (rare) { const CR = { ...C, gold: mul(C.gold, 0.78), red: mul(C.red, 1.25) }; for (let k = 0; k < 3; k++) { A.setT(-22.5 - k * 65, 0, 0, 0, 1); royalBarge(A, r, CR, k); } train.off = 175;
        for (let i = 0; i < A.count; i++) if (A.mat[i] === 5) A.uv[i * 2 + 1] = 0.2; }
      else {
        const sand = r.chance(0.35);
        A.setT(-5.2, 0, 0, 0, 1); tug(A, r, C);
        for (let k = 0; k < 4; k++) { const cx = -32.2 - k * 26.5; A.setT(cx, 0, 0, 0, 1); riceBarge(A, r, C, sand); A.resetT(); wire(A, [cx + 12, 2.3, 0], [k ? cx + 14.5 : -10.2, k ? 2.2 : 1.5, 0], 0.5, 5, C.dark); }
        train.off = 123.7;
      }
      train.mesh = new THREE.Mesh(toGeo(A), matMove); train.mesh.frustumCulled = false; train.mesh.name = 'train'; scene.add(train.mesh);
    }
    ferry(A, rng.fork('ferry'), C);
    const ferries = new THREE.InstancedMesh(toGeo(A), matMove, 2); ferries.frustumCulled = false; scene.add(ferries);
    ferries.setColorAt(0, new THREE.Color(1.15, 1.1, 1.0)); ferries.setColorAt(1, new THREE.Color(1.0, 1.1, 1.2));
    farLongtail(A, rng.fork('lt'), C);
    const longtails = new THREE.InstancedMesh(toGeo(A), matMove, 5); longtails.frustumCulled = false; scene.add(longtails);
    const ltr = rng.fork('ltlanes'), lanes = [0, 1, 2].map((i) => ({ z: [136, 186, 300][i] + ltr.range(-8, 8), dir: i === 1 ? -1 : 1, v: ltr.range(10.5, 13.5), x0: ltr.range(-600, 600) }));
    for (let i = 0; i < 5; i++) longtails.setColorAt(i, new THREE.Color().fromArray(ltr.pick([C.blue, C.mint, C.ochre, C.red, C.white])).multiplyScalar(1.2));
    const wakeGeo = new THREE.PlaneGeometry(1, 1); wakeGeo.rotateX(-Math.PI / 2); wakeGeo.translate(0.5, 0, 0);
    const wakes = new THREE.InstancedMesh(wakeGeo, makeWakeMaterial(U), rare ? 19 : 13); wakes.frustumCulled = false; wakes.renderOrder = 3; scene.add(wakes);
    const ferryA = { x0: 80, z0: 258, x1: -200, z1: 245, len: Math.hypot(280, 13), u0: uOfN(352), t0: 0.321 };
    const uWakeBump = uOfN(437), uLtB = uOfN(520);
    const tugSmoke = !rare ? fx.makeSmokeColumn({ rng: rng.fork('smoke'), time: U.uTime, position: [0, 4.6, train.z], height: 26, radius: [0.4, 5], size: [1.6, 9], count: Math.round(46 * det), color: '#5a5048', colorTop: '#a8988a',
      shadowColor: '#2c2622', opacity: 0.6, wind: [1.6, 0, -0.4], sunDir: SUN.toArray(), sunColor: look.sun }) : null;
    if (tugSmoke) scene.add(tugSmoke.object);
    const steam = noodle ? fx.makeSmokeColumn({ rng: rng.fork('steam'), time: U.uTime, position: [noodle.x, 0.75, noodle.z], height: 3.6, radius: [0.2, 1.0], size: [0.5, 1.7], count: Math.round(26 * det), color: '#f4efe6', colorTop: '#fff8ec',
      shadowColor: '#b0a89c', ambient: '#8a8478', opacity: 0.34, rate: 0.22, wind: [0.1, 0, -0.3], sunDir: SUN.toArray(), sunColor: look.sun }) : null;
    if (steam) scene.add(steam.object);
    await ctx.yield();
    // a second noodle boat steams among the market boats on the river
    const noodle2 = riverBoats.find((b) => b.v === 6 && b.n > 440 && b.n < 470) || riverBoats.find((b) => b.v === 6);
    const steam2 = noodle2 ? fx.makeSmokeColumn({ rng: makeRng('ksteam2' + ctx.seed), time: U.uTime, position: [noodle2.x, 0.75, noodle2.z], height: 4.2, radius: [0.2, 1.1], size: [0.5, 1.9], count: Math.round(20 * det), color: '#f4efe6', colorTop: '#fff8ec',
      shadowColor: '#b0a89c', ambient: '#8a8478', opacity: 0.36, rate: 0.22, wind: [0.25, 0, -0.2], sunDir: SUN.toArray(), sunColor: look.sun }) : null;
    if (steam2) riverG.add(steam2.object);
    await ctx.yield();

    // ---- our own long-tail: prow, gunwales, ribbons, garlands, spray ----
    const boat = new THREE.Group(); boat.name = 'longtail';
    { const r = rng.fork('ownboat'), rib = r.shuffle(['#d9281e', '#ee6a9c', '#f2c62a', '#f0841a', '#2f9a4e', '#2f6fd0', '#f2efe6']).map((h) => { const c = L(h), l = 0.3 * c[0] + 0.6 * c[1] + 0.1 * c[2]; return mix3(c, [l, l, l], 0.2); });
      ownBoat(A, r, C, rib, r.chance(0.7) ? C.marigold : L('#ec5a94'));
      await ctx.yield();
      const hullMesh = new THREE.Mesh(toGeo(A), matMove); hullMesh.frustumCulled = false; boat.add(hullMesh);
      boat.add(makeSpray(r, U, Math.round(620 * det)));
    }
    scene.add(boat);
    await ctx.yield();

    // ---- the sluice gate and its bead curtain, the parasol on the second bridge, the leaper, two water monitors ----
    const sl = { n: SLUICE_N, x: canalX(SLUICE_N), z: Z0 - SLUICE_N, rot: Math.atan2(-canalDX(SLUICE_N), 1), u: uOfN(SLUICE_N) };
    sluiceGate(A, canalHW(SLUICE_N), C);
    const matGate = makeKhlongMaterial({ ...U, uObj: { value: 1 }, uBnc: { value: new THREE.Vector2(16, 2.6) } });   // same program as matMove: only the reach and gain of the water's bounce differ
    const gate = new THREE.Mesh(toGeo(A), matGate); gate.position.set(sl.x, 0.25, sl.z); gate.rotation.y = sl.rot; scene.add(gate);
    const beadMat = makeBeadMaterial(U), bead = new THREE.Mesh(new THREE.PlaneGeometry(2 * canalHW(SLUICE_N), 4.6), beadMat); bead.position.set(0, -2.3, 0.02); bead.renderOrder = 5; gate.add(bead);
    const b2 = BRIDGES[1], walkB = { x: canalX(b2.n), z: Z0 - b2.n, rot: Math.atan2(-canalDX(b2.n), 1), u: uOfN(b2.n) };
    { const r = rng.fork('walker'); parasol(A, 0, 0.35, 0, 0.75, C.parasol[2], C, r); box(A, 0.05, 0, 0, 0.3, 1.45, 0.24, L('#2a2420'), 11, { taper: 0.7 }); }
    const walker = new THREE.Mesh(toGeo(A), matMove); scene.add(walker);
    box(A, 0, -0.25, 0, 0.22, 0.5, 0.16, L('#8a5a3a'), 11, { taper: 0.8 }); box(A, 0, 0.25, 0, 0.15, 0.16, 0.15, L('#2a1a10'), 11);
    const leaper = new THREE.Mesh(toGeo(A), matMove); scene.add(leaper);
    const leapLot = banks[1].lots.find((l) => l.type === 'gap' && l.n0 > 222 && l.kind !== 'landing') || banks[1].lots.find((l) => l.type === 'gap' && l.n0 > 215);
    const leap = { B: frameAt((leapLot.n0 + leapLot.n1) / 2, 1), u: uOfN((leapLot.n0 + leapLot.n1) / 2 - 26) };
    monitorGeo(A, C);
    const monGeo = toGeo(A), monitors = [new THREE.Mesh(monGeo, matMove), new THREE.Mesh(monGeo, matMove)];
    const ms = AN.monitorSteps[0];
    const monDef = [
      monitorAt ? { x: monitorAt.p[0], y: 0.42, z: monitorAt.p[2], rot: monitorAt.rot - Math.PI / 2, u: uOfN(monitorAt.n - 24) } : { x: -30, y: -5, z: 400, rot: 0, u: 2 },
      { x: ms.x, y: ms.y + 0.05, z: ms.z + 0.2, rot: -Math.PI / 2, u: uOfN(604 - 46) },
    ];
    monitors.forEach((m) => scene.add(m));
    const boil = school ? local(school.B, 0.4, 2.3) : [0, 0];
    U.uBoil.value.set(boil[0], boil[1], school ? 1 : 0);

    // ---- egrets: five flush from mooring posts ahead of the bow, four stand at the temple, forty cross the river in a line ----
    const NE = 61, egrets = makeEgrets(NE, U); scene.add(egrets.mesh);
    const flushers = [30, 106, 152, 238, 300].map((tn, i) => {
      let best = null; for (const p of posts) if (!p.used && Math.abs(p.n - tn) < 24 && (!best || Math.abs(p.n - tn) < Math.abs(best.n - tn))) best = p;
      if (best) best.used = true;
      const n = best ? best.n : tn, s = best ? best.s : (i % 2 ? 1 : -1), p = best ? best.p : [canalX(n) + s * (canalHW(n) - 0.2), 2.4, Z0 - n];
      return { p, n, s, lat: p[0] - canalX(n), uT: uOfN(n - 30) };
    });
    await ctx.yield();

    // ---- the north bank beyond the temple: far viharns and chedis (the hero's own material), a hazy line of trees ----
    { const r = rng.fork('farbank'), HA = makeAcc(30000);
      await ctx.yield();
      const Ch = { stone: L('#b8ad98'), stucco: L('#ddd5c0'), ochre: C.ochre, pedRed: L('#7c211b'), gold: C.gold, white: L(PALETTE[3], 0.84), teak: C.teak, roofA: L(PALETTE[4], 0.95), roofA2: L(PALETTE[2], 0.8), roofB: L(PALETTE[5], 0.9) };
      for (const [x, z, rot, sc] of [[-152, 34, 0, 1.0], [-262, 8, Math.PI / 2, 1.25], [168, 26, 0, 1.1], [296, -6, Math.PI / 2, 0.95], [-470, 0, 0, 1.4], [520, 4, 0, 1.3]]) {
        if (r.chance(0.3)) { const t = Ch.roofA; Ch.roofA = Ch.roofB; Ch.roofB = t; }
        hall(HA, { x, y: 2.5, z, rot, sc }, Ch, { W: 6.5, L: 13, wallH: 7.5, tiers: r.int(2, 4) });
      }
      await ctx.yield();
      for (const [x, z, sc] of [[-204, 40, 1], [118, 52, 0.8], [228, 30, 1.2], [-330, 20, 1.4], [400, 10, 1.5], [-96, 20, 0.7]]) {
        place(HA, { x, y: 2.5, z, rot: 0, sc }, 0, 0, 0);
        box(HA, 0, 0, 0, 7, 1.6, 7, Ch.white, 0, { taper: 0.9 }); box(HA, 0, 1.6, 0, 5.4, 1.4, 5.4, Ch.white, 0, { taper: 0.8 }); box(HA, 0, 3.0, 0, 4.2, 4.2, 4.2, Ch.white, 0, { taper: 0.4 });
        box(HA, 0, 7.2, 0, 1.6, 0.8, 1.6, Ch.white, 0); spike(HA, 0, 8.0, 0, 1.2, 1.2, 7.5, Ch.gold, 2); HA.resetT();
      }
      await ctx.yield();
      const fm = new THREE.Mesh(toGeo(HA), hero.object.getObjectByName('temple').material); fm.name = 'far-temples'; scene.add(fm);
      await ctx.yield();
      // tree-line silhouettes: three ranks, darker and nearer first
      for (let rank = 0; rank < 3; rank++) for (let x = -1700; x < 1700; x += r.range(10, 22)) {
        if (Math.abs(x) < 72 + rank * 10) continue;
        const z = 44 - rank * 70 - r.range(0, 40), w = r.range(12, 26), h = r.range(8, 17) + rank * 3, c = mul(mix3(L('#33441f'), L('#55602c'), r()), 0.8 + 0.25 * rank), y0 = 2.4;
        const p = [[x - w / 2, y0], [x - w * 0.42, y0 + h * 0.62], [x - w * 0.14, y0 + h], [x + w * 0.2, y0 + h * 0.9], [x + w * 0.45, y0 + h * 0.55], [x + w / 2, y0]];
        for (let i = 1; i < 5; i++) tri(A, [p[0][0], p[0][1], z], [p[i + 1][0], p[i + 1][1], z], [p[i][0], p[i][1], z], mul(c, 0.7), c, c, 11);
        if (r.chance(0.3)) { const px = x + r.range(-4, 4), ph = h + r.range(4, 9), lean = r.range(-2, 2); beam(A, [px, y0, z + 1], [px + lean, y0 + ph, z + 1], 0.5, 0.5, L('#4a3c28'), 11);
          for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, fx2 = Math.cos(a) * 4.2, fy = Math.sin(a) * 2.6 - 0.6; tri(A, [px + lean, y0 + ph, z + 1], [px + lean + fx2, y0 + ph + fy, z + 1], [px + lean + fx2 * 0.55, y0 + ph + fy * 0.5 + 0.9, z + 1], c, c, c, 11); } }
      }
      const tm = new THREE.Mesh(toGeo(A), matK); tm.name = 'treeline'; scene.add(tm);
    }
    await ctx.yield();

    // ---- flora: coconut palms over the canal, rain trees and frangipani on the temple bank, hyacinth rafts ----
    const fr = rng.fork('flora'), wind = flora.makeWind({ direction: [0.25, -0.95], strength: 0.9 });
    await ctx.yield();
    const leafOpts = { size: 512 };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMap = flora.makeLeafTexture(leafOpts);   // the kit's leaf atlas is one long step by itself: keep it alone between two yields; a quarter of the pixels is plenty for palms 8 m and more from the eye
    await ctx.yield();
    const fmat = flora.windMaterial({ wind, map: leafMap });
    await ctx.yield();
    const fl = [];
    { const variants = [];
      variants.push(flora.palmGeometry({ rng: fr.fork('p1'), detail: 1, height: 12, curve: 0.55 })); await ctx.yield();
      variants.push(flora.palmGeometry({ rng: fr.fork('p2'), detail: 1, height: 14.5, curve: 0.85 })); await ctx.yield();
      variants.push(flora.palmGeometry({ rng: fr.fork('p3'), detail: 0, height: 11.5 })); await ctx.yield();
      variants.push(flora.oakGeometry({ rng: fr.fork('o1'), detail: 2, height: 13, leaf: '#3f6b2a' })); await ctx.yield();
      variants.push(flora.cherryGeometry({ rng: fr.fork('c1'), detail: 1, height: 7, leaf: '#f4ecdc' })); await ctx.yield();
      variants.push(flora.oakGeometry({ rng: fr.fork('o2'), detail: 0, height: 11, leaf: '#3a6430' })); await ctx.yield();
      // palms are kept off the sight line from the entry to the spire, so its tip stands over the vanishing point
      const pp = [], add = (x, y, z, s, v) => { const rot = fr.range(0, TAU), n = Z0 - z; if (v <= 2 && n > 25 && n < 300 && x > -17 && x < 9.5) return; pp.push({ x, y, z, s, rot, v, u: 0, d: 0 }); };
      for (const bank of banks) for (const lot of bank.lots) {
        const B = frameAt((lot.n0 + lot.n1) / 2, bank.s);
        if (lot.type === 'house') { if (fr.chance(0.55 * dens)) { const [x, z] = local(B, fr.range(-3, 3), -fr.range(9.5, 17)); add(x, 0.5, z, fr.range(0.8, 1.2), fr.int(0, 1)); } }
        else if (lot.kind !== 'market' && fr.chance(0.55)) { const [x, z] = local(B, fr.range(-0.8, 0.8), -fr.range(3.0, 5.0)); add(x, 0.5, z, fr.range(0.85, 1.1), fr.int(0, 1)); }
      }
      for (const tn of [48, 178, 296]) for (const s of [-1, 1]) {   // palms leaning in from both banks close the slot overhead at three places
        let best = null; for (const g of gardens) if (g.s === s && (!best || Math.abs(g.n - tn) < Math.abs(best.n - tn))) best = g;
        if (best) { const [x, z] = local(best.B, 0, -2.5); add(x, 0.45, z, 1.12, 1); }
      }
      add(-96, 2.5, 50, 2.0, 3); add(108, 2.5, 42, 2.2, 3); add(-74, 2.5, 66, 0.85, 4); add(77, 2.5, 64, 0.9, 4); add(-86, 2.5, 70, 0.7, 4); add(92, 2.5, 69, 0.75, 4);
      for (const s of [-1, 1]) {
        for (let k = 0; k < 9; k++) add(s * (72 + k * 24 + fr.range(-6, 6)), 2.5, fr.range(36, 70), fr.range(0.85, 1.25), fr.int(0, 2));
        for (let x = 80; x < 560; x += fr.range(14, 24)) add(s * x, 2.5, fr.range(-60, 22), fr.range(1.2, 2.0), 5);
        for (let x = 22; x < 250; x += fr.range(12, 22)) add(s * x, 0.5, Z0 - MOUTH + fr.range(10, 34), fr.range(0.85, 1.2), 2);
      }
      for (let x = -56; x <= 56; x += 16) add(x + fr.range(-4, 4), 2.5, fr.range(-110, -64), fr.range(1.4, 2.0), 5);
      await ctx.yield();
      const sc = flora.makeScatter({ rng: fr.fork('sc'), points: pp, variants, material: fmat, tint: 0.14, tilt: 0.07 }); scene.add(sc.object); fl.push(sc);
      // water hyacinth with lilac spikes: rafts along the canal's edges and beside our line on the river
      const lp = [], rafts = [], pad = (x, z, s) => lp.push({ x, y: 0.03, z, s, rot: fr.range(0, TAU), u: 0, d: 0 });
      for (let n = 24; n < 338; n += fr.range(9, 17)) {
        const s = fr.sign(), B = frameAt(n, s), [cx, cz] = local(B, 0, 1.25);
        if (pathClear(cx, cz) < 3.1) continue;
        rafts.push([cx, 0.8, cz]); for (let k = Math.round(6 * dens); k > 0; k--) pad(cx + fr.range(-1.0, 1.0), cz + fr.range(-1.7, 1.7), fr.range(0.5, 0.95));
      }
      for (const [n, lat] of [[372, -5.5], [384, 6.5], [397, -8], [410, 7.5], [421, -6], [452, -6.5], [463, -9], [486, -7], [497, 6.5], [509, -8.5], [521, 8], [535, -5.5], [548, 6.5], [562, -8], [576, 8], [589, -6]]) {
        const cx = canalX(n) + swerve(n) + lat, cz = Z0 - n;
        for (let k = Math.round(13 * dens); k > 0; k--) { const a = fr.range(0, TAU), rr = 2.6 * Math.sqrt(fr()); pad(cx + Math.cos(a) * rr * 1.4, cz + Math.sin(a) * rr, fr.range(0.55, 1.0)); }
      }
      // three rafts in the turning pool, so the first view through a portal has a foreground
      { const pr = makeRng('kpool' + ctx.seed);
        for (const [n, lat] of [[6, -3.7], [11.5, 5.4], [15.5, -3.3], [3.5, 4.2], [9, 3.3], [13, -5.8], [19.5, 3.0], [1.5, -5.6], [9.5, 6.2], [16, -5.7], [21.5, -3.6], [26, -3.4], [2.2, 3.5], [4.5, -5.9], [16.5, 3.6]]) { /* all ahead of the entry: anything behind it is cut away in the view through the portal */ const cx = canalX(n) + lat, cz = Z0 - n; rafts.push([cx, 0.8, cz]);
          for (let k = Math.round(14 * dens); k > 0; k--) { const a = pr.range(0, TAU), rr = Math.sqrt(pr()); lp.push({ x: cx + Math.cos(a) * rr * 0.9, y: 0.03, z: cz + Math.sin(a) * rr * 1.8, s: pr.range(0.5, 0.95), rot: pr.range(0, TAU), u: 0, d: 0 }); } } }
      await ctx.yield();
      // more rafts close beside our line where the river opens (N 372-427, short of the ferry's lane), and on every raft out
      // here a standing crop of leaves and lilac spikes, so that it has some height from an eye 1.5 m up; all drawn from an
      // rng of their own and added after everything else, so that every seed keeps the river it had
      { const hr = makeRng('khyacinth' + ctx.seed), lilac = L('#b79be8'), up = [];
        for (const [n, lat] of [[372, -5.5], [384, 6.5], [397, -8], [410, 7.5], [421, -6], [452, -6.5], [463, -9], [486, -7], [497, 6.5]]) up.push([canalX(n) + swerve(n) + lat, Z0 - n, 2.6]);
        for (const [n, lat, rad] of [[376, 9.5, 2.4], [380, -11.5, 3], [390, -5.2, 1.8], [401, 12, 3], [404, 5.4, 1.9], [415, -5.4, 2], [424, 6.2, 2.4], [427, 13, 3], [426, -12.5, 2.6]]) {
          const cx = canalX(n) + swerve(n) + lat, cz = Z0 - n; up.push([cx, cz, rad]); rafts.push([cx, 0.8, cz]);
          for (let k = Math.round(11 * dens * rad / 2.4); k > 0; k--) { const a = hr.range(0, TAU), rr = rad * Math.sqrt(hr()); lp.push({ x: cx + Math.cos(a) * rr * 1.4, y: 0.03, z: cz + Math.sin(a) * rr, s: hr.range(0.55, 1.0), rot: hr.range(0, TAU), u: 0, d: 0 }); }
        }
        for (const [cx, cz, rad] of up) for (let k = 0; k < 7; k++) {
          const a = hr.range(0, TAU), rr = rad * Math.sqrt(hr()) * 0.85, x = cx + Math.cos(a) * rr * 1.4, z = cz + Math.sin(a) * rr, s0 = A.count;
          clump(A, hr, x, 0.14, z, 0.42, 0.1, 0.36, mul(LEAF_C, 2.2), 5, { leaf: 1, piece: [0.12, 0.2] });
          for (let j = hr.int(1, 3); j > 0; j--) { const sx = x + hr.range(-0.3, 0.3), sz = z + hr.range(-0.3, 0.3), h = hr.range(0.3, 0.48); lathe(A, sx, 0.06, sz, [[0, 0.035], [h * 0.45, 0.075], [h, 0]], lilac, 7, 5, false); }
          setSway(A, s0, 0.03, hr());
        }
        await ctx.yield();
        // lotus beds close beside our line all the way across (none lay between N 427 and 452): wide rafts of pads with a
        // standing crop of saucer leaves on stalks, pink buds and open flowers, nodding in the wind
        { const lr = makeRng('klotus' + ctx.seed), leafC = mul(C.leaf, 1.15);
          for (const [n, lat, rad] of [[432, 4.3, 3.5], [441, -4.7, 3.5], [447, 6.2, 2.6], [458, -6.4, 3.0], [474, 4.8, 3.2], [478, -4.6, 3.5], [503, -5.0, 3.0], [520, 4.6, 3.2], [536, -4.4, 3.0], [556, 5.0, 2.8], [423, -5.2, 3.0]]) {
            const cx = canalX(n) + swerve(n) + lat, cz = Z0 - n, sd = lat < 0 ? -1 : 1; rafts.push([cx, 0.8, cz]);
            for (let k = Math.round(22 * dens * rad / 3.5); k > 0; k--) { const a = lr.range(0, TAU), rr = rad * Math.sqrt(lr()); const x = cx + Math.cos(a) * rr * 0.8 + sd * 0.6, z = cz + Math.sin(a) * rr * 1.5; if (Math.abs(x - canalX(n) - swerve(Z0 - z)) > 2.5) lp.push({ x, y: 0.03, z, s: lr.range(0.6, 1.1), rot: lr.range(0, TAU), u: 0, d: 0 }); }
            for (let k = 0; k < 12; k++) {
              const a = lr.range(0, TAU), rr = rad * Math.sqrt(lr()) * 0.9, x = cx + Math.cos(a) * rr * 0.8 + sd * 0.9, z = cz + Math.sin(a) * rr * 1.5, s0 = A.count, h = lr.range(0.28, 0.8);
              if (Math.abs(x - canalX(n) - swerve(Z0 - z)) < 2.9) continue;
              box(A, x, 0, z, 0.035, h, 0.035, mul(leafC, 0.7), 7, { noTop: true });
              if (k % 3 === 0) {   // a bud or an open flower
                const open = lr.chance(0.5), pc = mul(C.lotus, lr.range(0.95, 1.25));
                lathe(A, x, h, z, open ? [[0, 0.03], [0.07, 0.17], [0.16, 0.2], [0.2, 0.08]] : [[0, 0.03], [0.1, 0.085], [0.26, 0]], pc, 7, 6, false);
                if (open) petals(A, lr, x, h + 0.12, z, 0.2, pc, 9, 1.6);
              } else { const rl = lr.range(0.3, 0.5), tl = lr.range(-0.12, 0.12); lathe(A, x, h, z, [[0, 0.02], [0.05 + tl, rl * 0.7], [0.03 - tl, rl]], mul(leafC, lr.range(0.85, 1.25)), 7, 7, false); }
              setSway(A, s0, 0.035, lr());
            }
          }
        }
        const hm = new THREE.Mesh(toGeo(A), matK); hm.name = 'hyacinth'; riverG.add(hm);
        // one more channel buoy, close on our right among the hyacinth at N 411: a mesh of its own, so that it can nod
        buoy(A, 0, 0, L('#e8b422'), C, hr);
        const nb = new THREE.Mesh(toGeo(A), matMove); nb.name = 'nodding-buoy'; nb.position.set(canalX(411) + swerve(411) + 6.1, 0, Z0 - 411); scene.add(nb);
        fl.nod = { mesh: nb, u: uOfN(411), ph: hr.range(0, TAU) };
      }
      await ctx.yield();
      const lily = flora.makeLilyPads({ rng: fr.fork('lily'), points: lp, material: fmat, flowers: true, petal: '#b79be8', petalTip: '#e2d6fa', pad: '#3f7a34' }); scene.add(lily.object); fl.push(lily);
      fl.rafts = rafts;
    }
    await ctx.yield();

    // ---- fauna from the kit: swallows over the river, dragonflies over the hyacinth, mynas lifting off the wires ----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    // (flock cure 1) every kit creature keeps 2.0 m of clear air from the flown line, BY PLACE. The birds, bird by bird: each course stays where it is
    // laid, a bird whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each), the deal is held at
    // three scatters, and each has a small wander of its own written out so that the lane it leaves about the line stays narrow. The two wheels are
    // dealt anew for every seed: each takes the route from well before any loop the kit can deal nears it to the end; the two crossings take the
    // part of the route their course comes within 45 m of. Each call is a build step of its own, and the wheels are made by the kit's stepped maker
    // (the same flock to the bit), which hands the page a frame between its slices.
    const clearOf = (from, to) => ({ path, dist: 2, each: true, from, to, step: 2 });
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('swifts'), species: 'swifts', count: Math.round(26 * det), wander: [2, 1.2, 2, 0.7], maxSigma: 3, keepClear: clearOf(0.4, 1), center: [-18, 8, 236], radius: 62 }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('swifts2'), species: 'swifts', count: Math.round(14 * det), wander: [2, 1.2, 2, 0.7], maxSigma: 3, keepClear: clearOf(0.55, 1), center: [26, 11, 150], radius: 44 }, ctx.yield));
    await ctx.yield();
    // The dragonflies hover about the rafts' own places with half the maker's own roam to either hand, and the kit keeps them clear by place (its
    // keepClear for insects): an anchor whose whole flight would come within 2 m of the flown line is moved level, straight away from it.
    if (fl.rafts.length) fauna.add(F.makeDragonflies({ rng: rng.fork('dragon'), positions: fl.rafts, roam: [1.2, 0.7, 0.75, 0], keepClear: { path, dist: 2, from: 0, to: 1, step: 0.5 }, count: Math.round(34 * det), size: 2.2 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('myna'), species: 'crows', count: 8, size: 0.4, wander: [0.6, 0.4, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0.30, 0.65), palette: { body: '#3a2a1e', belly: '#4a3626', wingC: '#2a1e16', tip: '#f4f0e2', head: '#12100e', beak: '#f2c62a', legC: '#f2c62a', tailC: '#1c1612' }, cross: { path, u: uOfN(252), lead: 34, height: 6.5, angle: 40, span: 150, duration } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('myna2'), species: 'crows', count: 6, size: 0.4, wander: [0.6, 0.4, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0.03, 0.35), palette: { body: '#3a2a1e', belly: '#4a3626', wingC: '#2a1e16', tip: '#f4f0e2', head: '#12100e', beak: '#f2c62a', legC: '#f2c62a', tailC: '#1c1612' }, cross: { path, u: uOfN(70), lead: 30, height: 7.5, angle: -55, span: 130, duration } }));

    // ---- air: gold motes; the thunderhead; a pale skyline in the north-west; what each look adds ----
    await ctx.yield();
    const fxs = fx.fxGroup(); scene.add(fxs.object);
    fxs.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'pollen', time: U.uTime, count: Math.round(700 * det), color: look.motes, size: [0.02, 0.05] }));
    if (incense.length) scene.add(makeIncense(incense, U));
    const thunder = look.cloud > 0 ? makeThunderhead(U, look) : null; if (thunder) scene.add(thunder.mesh);
    await ctx.yield();
    const smats = S.makeMaterials({ night: night * 0.9 });
    smats.setSky({ top: look.sky.zenith, horizon: look.sky.horizon, sun: look.sun, sunDir: SUN.toArray() });
    const skyline = S.makeSkyline({ rng: rng.fork('skyline'), mats: smats, radius: 3400, count: 44, layers: 2, arc: [Math.PI + 0.5, Math.PI + 1.25], maxHeight: 250, baseY: -20, clusters: 2,
      ...(night ? {} : { color: '#' + new THREE.Color('#7d86ac').lerp(new THREE.Color(look.fog), 0.25).getHexString(), haze: look.fog, hazeAmount: [0.3, 0.66] }) }); scene.add(skyline.object);
    if (look.mist > 0.5) fxs.add(fx.makeGroundFog({ time: U.uTime, layers: 5, size: 520, y: 0.15, height: 3.4, color: '#f4dccf', opacity: 0.16, coverage: 0.56, sunDir: SUN.toArray(), sunColor: look.sun }));
    // at first light the mist also lies in banks on the first 150 m of the river, so the water has depth beyond the mouth
    if (look.mist > 0.5) fxs.add(fx.makeMist({ rng: makeRng('krivermist' + ctx.seed), time: U.uTime, count: Math.round(30 * det), area: [460, 2.5, 150], center: [0, 2.4, 268], size: [24, 52], color: '#f8e2d6', opacity: 0.17, drift: [0.5, 0, 0.12], flatten: 0.3 }));
    if (look.wet > 0.9) fxs.add(fx.makeParticles({ rng: rng.fork('drips'), preset: 'rain', time: U.uTime, count: Math.round(420 * det), box: [26, 12, 26], opacity: 0.5 }));
    if (night) {
      const cr = rng.fork('candles'), cp = [], nC = Math.round(2000 * det);
      for (let i = 0; i < nC; i++) {
        if (i % 10 < 3) { const n = cr.range(-40, 345), hwn = canalHW(n) - 0.7; cp.push(canalX(n) + cr.range(-hwn, hwn), Z0 - n, cr()); }
        else {   // on the river they gather along our own line, so the water ahead of the prow is full of flames
          const g = cr.gauss(), k = cr(), z = cr.range(82, 344), ph = cr(), n = Z0 - z; let off = g * (12 + 60 * k);
          if (Math.abs(off) < 1.8) off = (off < 0 ? -1 : 1) * (1.8 + Math.abs(off));
          cp.push(canalX(n) + swerve(n) + off, z, ph);
        }
      }
      for (let i = 0; i < 44; i++) { const n = cr.range(-34, 18); cp[i * 3] = canalX(n) + cr.sign() * cr.range(2.6, 7); cp[i * 3 + 1] = Z0 - n; }   // thirty of them ring the turning pool
      scene.add(makeCandles(cp, U));
      fxs.add(fx.makeLanterns({ rng: rng.fork('lanterns'), time: U.uTime, count: Math.round(90 * det), center: [0, 70, 250], area: [560, 120, 420], size: 1.9, floor: 8 }));
      const gp = [], gc = []; for (let i = 0; i < bulbs.length && gp.length < 120; i += 2) { gp.push(bulbs[i]); gc.push(new THREE.Color().fromArray(bulbs[i + 1])); }
      if (gp.length) fxs.add(fx.makeGlows({ positions: gp, colors: gc, size: 1.0, intensity: 1.6, flicker: 0.25, time: U.uTime }));
    }
    await ctx.yield();

    // ---- per-frame ----
    const V = new THREE.Vector3(), V2 = new THREE.Vector3(), T = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), M = new THREE.Matrix4();
    const ONE = new THREE.Vector3(1, 1, 1), SC = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0), CW = new THREE.Vector3();
    const P0 = path.pointAt(0, new THREE.Vector3()), T0 = path.tangentAt(0, new THREE.Vector3()).normalize(), WAIT = 3.6, uBoard = uOfN(11.5);
    const uMouth = uOfN(350), fdx = ferryA.x1 - ferryA.x0, fdz = ferryA.z1 - ferryA.z0, thA = Math.atan2(-fdz, fdx);
    const eP = egrets.pos, eD = egrets.dir, posts4 = AN.egretPosts, sunW = U.uSunK.value.x > 0 ? 1 : -1;
    const EG0 = new THREE.Vector3(), EG1 = new THREE.Vector3();
    const egLead = (uu, out) => {   // where the skein's leader flies when we are at uu
      path.pointAt(Math.min(1, uu), out);
      const n = Z0 - out.z + 34 - 14 * sstep(0.6, 0.72, uu) + 40 * sstep(0.78, 0.9, uu);
      out.set(swerve(n) - 50 + 36 * sstep(0.585, 0.645, uu) + 14 * sstep(0.645, 0.75, uu), 2.3 + 30 * sstep(0.76, 0.9, uu), Z0 - n);
      return out;
    };
    const setEgret = (i, x, y, z, fx2, fz2, fly, ph) => { const l = Math.hypot(fx2, fz2) || 1; eP[i * 3] = x; eP[i * 3 + 1] = y; eP[i * 3 + 2] = z; eD[i * 4] = fz2 / l; eD[i * 4 + 1] = fx2 / l; eD[i * 4 + 2] = fly; eD[i * 4 + 3] = ph; };
    const wakeAt = (i, x, z, th, len, wid, up) => { E.set(up ? -Math.PI / 2 : 0, th + Math.PI, 0, 'YXZ'); Q.setFromEuler(E); M.compose(V.set(x, up ? 1.0 : 0.05, z), Q, SC.set(len, 1, wid)); wakes.setMatrixAt(i, M); };
    function update(dt, time, camera, u) {
      U.uTime.value = time; riverG.visible = u > 0.35;
      // our boat rides with the camera; while this world is only seen through a portal it waits at the entry
      path.pointAt(u, V); path.tangentAt(u, T); path.tangentAt(Math.min(1, u + 0.015), V2);
      camera.getWorldPosition(CW);
      // seen through a portal (u = 0, the camera still behind the entry plane) the boat lies a boat's length inside the
      // entry, stern toward the viewer; the camera then comes aboard over the first second, the stern sliding out under
      // the frame, so there is no jump at the crossing and nothing is ever cut by the portal's plane
      const sIn = (CW.x - P0.x) * T0.x + (CW.y - P0.y) * T0.y + (CW.z - P0.z) * T0.z, riding = u > 0 || sIn >= 0, turn = T.z * V2.x - T.x * V2.z;
      const ahead = WAIT * (1 - sstep(0, uBoard, u));
      const wb = (u - uWakeBump) / 0.011, bump = Math.exp(-wb * wb) * Math.cos(wb * 2.2);
      // on a tall, narrow screen the eye sits further forward in the boat: the floor and its cargo slide out under the
      // frame and what is left of the vehicle is the foredeck's wedge, the stem and its ribbons
      const tall = Math.min(1.05, 2.4 * Math.max(0, 1 - (camera.aspect || 1)));
      if (riding) boat.position.copy(CW).addScaledVector(T, ahead - tall); else boat.position.copy(P0).addScaledVector(T0, WAIT - tall);
      boat.position.y += 0.015 * Math.sin(time * 2.3) + 0.01 * Math.sin(time * 3.7 + 1) + 0.05 * bump - 0.08 * (1 - Math.min(1, camera.aspect || 1));   // a touch lower on tall screens; any more would put the floor under water
      boat.rotation.set(0.006 * Math.sin(time * 1.9) + 0.004 * Math.sin(time * 3.1) + 0.026 * bump, Math.atan2(-T.x, -T.z) + Math.max(-0.035, Math.min(0.035, turn * 2.5)), 0, 'YXZ');
      const tl = Math.hypot(T.x, T.z) || 1, bn = Z0 - boat.position.z;
      U.uBoat.value.set(boat.position.x, boat.position.z, 1);
      U.uOwn.value.set(T.x / tl, T.z / tl, riding ? sstep(0, uBoard, u) : 0, 0);
      const dS = sunW > 0 ? boat.position.x - (canalX(bn) - canalHW(bn) - 1.6) : (canalX(bn) + canalHW(bn) + 1.6) - boat.position.x;
      const lit = bn > 352 ? 1 : mixn(1 - 0.72 * look.bars, 1, gapOpen(bn - 3.2 - U.uSunK.value.y * dS)), kS = dt > 0 ? Math.min(1, dt * 9) : 1;
      U.uSprayK.value += (lit * (night ? 0.55 : 1.05) * (riding ? sstep(0, uBoard, u) : 0) - U.uSprayK.value) * kS;
      // sampans bob, and rock hard in our wake once we have passed
      for (let g = 0; g < sampans.length; g++) {
        const im = sampans[g].im, list = sampans[g].list;
        for (let i = 0; i < list.length; i++) {
          const b = list[i], since = (u - b.u) * duration, wk = since > 0 ? Math.exp(-since * 0.45) * Math.min(1, since * 3) : 0;
          E.set((0.035 + 0.17 * wk) * Math.sin(time * (1.3 + 2.4 * wk) + b.ph), b.rot, 0.018 * Math.sin(time * 0.9 + b.ph * 2), 'YXZ'); Q.setFromEuler(E);
          M.compose(V.set(b.x, 0.03 * Math.sin(time * 1.1 + b.ph) + 0.05 * wk * Math.sin(time * 3 + b.ph), b.z), Q, ONE); im.setMatrixAt(i, M);
        }
        im.instanceMatrix.needsUpdate = true;
      }
      // the barge train (or the royal procession) creeps east; the ferry cuts across ahead of the burst; long-tails race far off
      const tx = train.stern + train.off + train.v * (u - train.uPass) * duration;
      train.mesh.position.set(tx, 0.03 * Math.sin(time * 0.7), train.z);
      if (tugSmoke) { tugSmoke.uniforms.uBase.value.set(tx - 6.8, 4.6, train.z); tugSmoke.update(dt, time, camera); }
      if (steam) steam.update(dt, time, camera); if (steam2) steam2.update(dt, time, camera);
      const ft = rare ? 1.12 : Math.max(0, Math.min(1.12, ferryA.t0 + 8 * (u - ferryA.u0) * duration / ferryA.len)),   // parked at the far landing while the procession owns the river
      fax = ferryA.x0 + fdx * ft, faz = ferryA.z0 + fdz * ft;
      Q.setFromAxisAngle(YA, thA); M.compose(V.set(fax, 0.03 * Math.sin(time * 0.9), faz), Q, ONE); ferries.setMatrixAt(0, M);
      const fbz = 215 + 98 * Math.sin(time * 0.045), fbd = Math.cos(time * 0.045) >= 0 ? -Math.PI / 2 : Math.PI / 2;
      Q.setFromAxisAngle(YA, fbd); M.compose(V.set(430, 0.03 * Math.sin(time * 0.8 + 2), fbz), Q, ONE); ferries.setMatrixAt(1, M);
      ferries.instanceMatrix.needsUpdate = true;
      { const nd = fl.nod, since = (u - nd.u) * duration, wk = since > 0 ? Math.exp(-since * 0.35) * Math.min(1, since * 3) : 0;   // the buoy nods, and rolls hard in our wake
        nd.mesh.rotation.set(0.1 * Math.sin(time * 1.35 + nd.ph) + 0.2 * wk * Math.sin(time * 3.1), 0, 0.08 * Math.sin(time * 1.1 + nd.ph * 2) + 0.16 * wk * Math.cos(time * 2.7)); nd.mesh.position.y = 0.04 * Math.sin(time * 1.2 + nd.ph); }
      U.uFerry.value.set(fax - fdx / ferryA.len * 8, faz - fdz / ferryA.len * 8, fdx / ferryA.len, fdz / ferryA.len); U.uFerryK.value = rare ? 0 : sstep(0, 0.04, ft) * (1 - sstep(1.0, 1.11, ft));
      wakeAt(0, tx - train.off + 2, train.z, 0, rare ? 90 : 30, rare ? 13 : 15, false);
      const fm = ft > 0.001 && ft < 1.119 ? 1 : 0.02;
      wakeAt(1, fax - Math.cos(thA) * 8, faz + Math.sin(thA) * 8, thA, 52 * fm, 13, false);
      wakeAt(2, 430, fbz + (fbd < 0 ? -8 : 8), fbd, 44, 12, false);
      for (let i = 0; i < 3; i++) {
        const ln = lanes[i], xr = ln.x0 + ln.dir * ln.v * time, x = xr - 1400 * Math.floor((xr + 700) / 1400), th = ln.dir > 0 ? 0 : Math.PI;
        Q.setFromAxisAngle(YA, th); M.compose(V.set(x, 0.12 + 0.05 * Math.sin(time * 5 + i), ln.z), Q, ONE); longtails.setMatrixAt(i, M);
        wakeAt(3 + i, x - ln.dir * 4.5, ln.z, th, 40, 5.5, false); wakeAt(6 + i, x - ln.dir * 7.5, ln.z, th, 8, 2.4, true);
      }
      // two long-tails keyed to our progress: one plugging north ahead on our left that we slowly overhaul, one coming
      // back from the temple landing that passes close on our right; both throw a rooster tail
      { // the first waits off the pile village at N 406 and sets off north as we burst out, 12 m off our port bow, outside the avenue's port row of poles: we close
        // on it across the river and pass it at about u 0.81 (its lane is kept clear of buoys, stakes and the ferry)
        const na = Math.max(406, 406 + 9 * (u - 0.5846) * duration), za = Z0 - na, xa = -12.6 - 0.02 * (na - 406), mva = na > 406.05 ? 1 : 0.02;
        const zb = Math.max(96, 170 + 13 * (u - uLtB) * duration), kb = zb < 170 ? 0.2 : 0.5, xb = 20 - kb * (zb - 170), mvb = zb > 96.1 ? 1 : 0.02;
        const tha = Math.atan2(9, -0.18), thb = Math.atan2(-13, -13 * kb), bob = 0.05 * Math.sin(time * 5.3);
        Q.setFromAxisAngle(YA, tha); M.compose(V.set(xa, 0.12 + bob * mva, za), Q, ONE); longtails.setMatrixAt(3, M);
        Q.setFromAxisAngle(YA, thb); M.compose(V.set(xb, 0.12 - bob * mvb, zb), Q, ONE); longtails.setMatrixAt(4, M);
        wakeAt(9, xa - Math.cos(tha) * 4.5, za + Math.sin(tha) * 4.5, tha, 34 * mva, 5, false); wakeAt(10, xa - Math.cos(tha) * 7.5, za + Math.sin(tha) * 7.5, tha, 6 * mva, 2.0, true);
        wakeAt(11, xb - Math.cos(thb) * 4.5, zb + Math.sin(thb) * 4.5, thb, 40 * mvb, 5.5, false); wakeAt(12, xb - Math.cos(thb) * 7.5, zb + Math.sin(thb) * 7.5, thb, 8 * mvb, 2.4, true);
      }
      // the royal oars churn a line of foam along each side of each barge
      if (rare) for (let k = 0; k < 3; k++) for (let e = 0; e < 2; e++) wakeAt(13 + k * 2 + e, tx - 22.5 - k * 65 + 19, train.z + (e ? 5.0 : -5.0), 0, 40, 1.9, false);
      longtails.instanceMatrix.needsUpdate = true; wakes.instanceMatrix.needsUpdate = true;
      // the sluice lifts as we come, dripping; a parasol crosses the second bridge; someone leaps from a pier
      const lift = sstep(sl.u - 0.078, sl.u - 0.014, u);
      gate.position.y = 0.25 + lift * 4.35; beadMat.uniforms.uK.value = sstep(0.05, 0.5, lift) * (1 - sstep(sl.u + 0.05, sl.u + 0.13, u));
      const wf = sat((u - (walkB.u - 0.09)) / 0.12), wx = -3.7 + 7.4 * wf, wstep = wf > 0 && wf < 1 ? 0.03 : 0.006;   // waits at the bridge's end until we come
      walker.position.set(walkB.x + wx * Math.cos(walkB.rot), b2.soffit + 0.2 + wstep * Math.abs(Math.sin(time * 5.5)), walkB.z - wx * Math.sin(walkB.rot));
      const tq = (u - leap.u) * duration / 0.95, lz = tq < 0 ? -0.3 : -0.3 + 2.9 * Math.min(tq, 1), ly = tq < 0 ? 1.45 : 1.45 + 2.3 * tq - 3.9 * tq * tq;
      const lc = Math.cos(leap.B.rot), ls = Math.sin(leap.B.rot), lx = leap.B.x + lz * ls, lzz = leap.B.z + lz * lc;
      leaper.position.set(lx, tq > 1.05 ? -6 : ly, lzz); leaper.rotation.set(tq > 0 ? tq * 5.5 : 0, leap.B.rot, 0, 'YXZ');
      const lr = Math.max(0, (tq - 1) * 0.95 * 1.5);
      U.uRing.value[2].set(leap.B.x + 2.6 * ls, leap.B.z + 2.6 * lc, lr, tq > 1 ? Math.max(0, 1 - lr / 5.5) : 0);
      for (let i = 0; i < 2; i++) {
        const d = monDef[i], k = sstep(d.u, d.u + 0.03, u), cx = Math.cos(d.rot), sz = -Math.sin(d.rot), rr = Math.max(0, u - d.u - 0.02) * duration * 1.3;
        monitors[i].position.set(d.x + cx * 1.8 * k, d.y - 0.75 * k * k, d.z + sz * 1.8 * k);
        monitors[i].rotation.set(0, d.rot + 0.12 * Math.sin(time * 0.7 + i * 2) * (1 - k), -0.45 * sstep(0.15, 0.8, k), 'YXZ');
        U.uRing.value[i].set(d.x + cx * 2.0, d.z + sz * 2.0, rr, k > 0.6 ? Math.max(0, 1 - rr / 5.5) : 0);
      }
      for (let i = 0; i < 2; i++) { const f = time * 0.33 + i * 0.5, ff = f - Math.floor(f); U.uRing.value[3 + i].set(boil[0] + (i ? 0.9 : -0.7), boil[1] + (i ? -0.5 : 0.6), ff * 2.8, U.uBoil.value.z * 0.8 * (1 - ff)); }
      // egrets
      for (let i = 0; i < 5; i++) {
        const e = flushers[i], tau = (u - e.uT) * duration, ph = 0.13 + i * 0.19;
        if (tau <= 0) { setEgret(i, e.p[0], e.p[1], e.p[2], -e.s, 0.4, 0, ph); continue; }
        if (tau > 10) { setEgret(i, 0, -40, 0, 0, 1, 1, ph); continue; }
        const ne = e.n + 17 * tau, pk = Math.max(0, tau - 3.0), lat = e.lat * (1 - 0.75 * sstep(0, 1.6, tau)) + e.s * pk * pk * 2.4;
        setEgret(i, canalX(ne) + lat, e.p[1] + 0.4 + Math.min(tau * 1.9, 5.2) + pk * 1.6, Z0 - ne, canalDX(ne) + e.s * pk * 4.8 / 17, -1, sstep(0, 0.35, tau), ph);
      }
      for (let i = 0; i < 4; i++) { const p = posts4[i % posts4.length]; setEgret(5 + i, p.x, p.y, p.z, i % 2 ? 0.5 : -0.5, 1, 0, 0.3 + i * 0.17); }
      // forty cross the river in a line, low from the south-west across our bow and climbing away north-east over the temple
      // against the thunderhead; the last one crosses our course some 30 m ahead (u about 0.855), never over the boat
      const lead = 17 * (u - 0.68) * duration;
      for (let i = 0; i < 40; i++) {
        const si = lead - i * 3.3, off = 1.1 * Math.sin(i * 1.7), x = 0.75 * si + 0.66 * off, z = 140 - 0.66 * si + 0.75 * off;
        const y = 5.5 + 0.7 * Math.sin(i * 0.45 - time * 0.8) + 0.33 * Math.max(0, si - 34) + 0.2 * Math.max(0, -si - 150);
        setEgret(9 + i, x, y, z, 0.75, -0.66, 1, (i * 0.137) % 1);
      }
      // twelve more skim the water ahead of our bow in a loose V while the river is widest: they come in from the port side
      // as we burst out, hold 15 to 30 m ahead of the prow while they drift across our course, then lift away to starboard
      { const live = u > 0.57 && u < 0.9;
        if (live) { egLead(u, EG0); egLead(u + 0.003, EG1); EG1.sub(EG0); }
        const hl = Math.hypot(EG1.x, EG1.z) || 1, hx = EG1.x / hl, hz = EG1.z / hl;
        for (let i = 0; i < 12; i++) {
          const ph = (0.21 + i * 0.173) % 1, rk = (i + 1) >> 1, sd = i % 2 ? 1 : -1;
          if (!live) { setEgret(49 + i, 0, -40, 0, 0, 1, 1, ph); continue; }
          const back = rk * 1.5 + 0.4 * Math.sin(i * 2.1 + time * 0.31), side = sd * rk * 1.15 + 0.3 * Math.sin(i * 1.3 + time * 0.23);
          setEgret(49 + i, EG0.x - hx * back - hz * side, EG0.y + 0.22 * rk + 0.22 * Math.sin(time * 0.9 + i * 1.7), EG0.z - hz * back + hx * side, hx, hz, 1, ph);
        } }
      egrets.touch();
      // sky, light, kit systems, the hero
      if (thunder) thunder.follow(camera);
      sky.update(dt, time, camera); rig.update(dt, time, camera);
      for (let i = 0; i < fl.length; i++) fl[i].update(dt, time, camera);
      fauna.update(dt, time, camera, u); fxs.update(dt, time, camera);
      smats.update(dt, time); skyline.update(dt, time, camera);
      hero.setProgress(sstep(uMouth - 0.06, uMouth + 0.02, u)); hero.uniforms.uTip.value = 1 + Math.max(2 * (1 - sstep(0.12, 0.18, u)), 1.3 * sstep(uMouth - 0.05, uMouth, u) * (1 - sstep(0.8, 0.9, u))); hero.update(dt, time, camera);
    }
    await ctx.yield();
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 6000); path.pointAt(0, c0.position); c0.lookAt(0, 1.5, 0); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await sky.prewarm(ctx.renderer, null, scene);

    const top = AN.prangTop, uB = uOfN(MOUTH), poiV = new THREE.Vector3();
    return {
      scene, path, duration,
      title: look.title + (rare ? ': the Royal Barges' : ''),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 16, sway: 0.35, bank: 0 },
      pois: [
        // in the canal the gaze leaves the axis three times for something on a bank ahead (the first bridge's landing to port, the
        // market's first stalls to port, the pier beyond the market where someone leaps, to starboard), so that the slot is not one centred view
        { at: [canalX(68) - 7.5, 2.4, Z0 - 68], from: 0.05, to: 0.108, weight: 0.5, fade: 0.3 },
        { at: [canalX(172) - 9, 2.2, Z0 - 172], from: 0.215, to: 0.278, weight: 0.5, fade: 0.3 },
        { at: [canalX(226) + 7.5, 2.6, Z0 - 226], from: 0.305, to: 0.368, weight: 0.5, fade: 0.3 },
        { at: [0, 46, 80], from: uB - 0.04, to: uB + 0.22, weight: 0.5, fade: 0.25 },             // the burst: lift the gaze to the spire, so it and the cloud own the upper half
        { at: (time, u) => poiV.set(top.x, top.y * (0.5 + 0.28 * sstep(0.8, 0.93, u)), top.z), from: uOfN(430), to: 0.985, weight: 0.6, fade: 0.25 },    // hold the prang while we arc round the barges
      ],
      portal: { shape: 'circle', radius: AN.portalSeat.radius, color: look.portal, glow: 1.3, revealDistance: 300 },
      post: {
        exposure: look.exposure,
        bloom: { strength: night ? 0.55 : 0.4, radius: 0.65, threshold: night ? 0.85 : 0.96 },
        grade: { saturation: look.grade.saturation, contrast: look.grade.contrast, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
