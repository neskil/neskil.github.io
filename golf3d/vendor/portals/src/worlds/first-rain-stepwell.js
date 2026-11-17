// FIRST RAIN STEPWELL: "The Thousand-Stair Rain". Rajasthan in storm light: the first monsoon cloudburst breaks over an
// abandoned stepwell (130 m square, 65 m deep, ten thousand steps) and tier by tier every step becomes a waterfall while
// the green pool climbs. The camera comes in low over mustard and a mud village with the pigeons, tips over the fallen bay
// of the rim gallery and spirals down inside the well to a portal under the pavilion's great arch.
// World coordinates are the brief's and the hero's: +X east (the storm), +Z south, rim at y = 0, floor at y = -65.
// Looks by seed / ctx.vary.hour: storm (sidelong sun under the shelf cloud), dusk (apricot strip, oil lamps, silver water),
// dust (a copper dust front that the rain washes clean). Season: first rain on mustard, or the second week of the monsoon
// (green millet, moss, the pool already a tier up). Cast: pigeons or parakeets leading; langurs or peacocks on the stairs;
// festival leavings or bare stone. Rare event: the cloud tears at u 0.8 and one shaft of sun drops the depth of the well.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as S from '../kit/structures.js';
import { buildHero } from '../parts/first-rain-stepwell.js';

const TAU = Math.PI * 2;
const IMAGE_TO = new THREE.Vector3(0, -53, 38);
const PALETTE = ['#D9A55B', '#8A5A2B', '#1F2347', '#4B5673', '#E3B21A', '#3F7A4E', '#FFE3A1'];
const DUR = 38;
const H = (h) => new THREE.Color(h);
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- looks ----------
const LOOKS = {
  storm: {
    title: 'The Thousand-Stair Rain',
    sky: { preset: 'storm', zenith: '#454c66', mid: '#4a5270', horizon: '#4B5673', ground: '#3a3320', horizonPow: 2.6, midPow: 1.3,
      scatterColor: '#FFE3A1', scatter: 1.5, scatterPow: 2.2, scatterHigh: 0.2, scatterFall: 4.5, sunColor: '#FFD08A', sunSize: 1.5, sunIntensity: 12,
      sunGlow: 1.0, sunGlowTight: 0.45, stars: 0, lightning: 0, clouds: false, clouds2: { coverage: 0.42, stretch: 1, opacity: 0.55, lit: '#ffe6b8', shade: '#6d6a8c', scale: 0.9, haze: 1.2 },
      lightColor: '#ffd79c', lightIntensity: 3.3, ambientColor: '#6a76a8', groundLight: '#7a6238', ambientIntensity: 1.2, lightElevationMin: 10 },
    sunEl: 24, sunAz: 285, heroSun: ['#FFD08A', 1.75], heroFill: ['#586a98', 1.75], skyE: ['#1F2347', 2.4], skyW: ['#FFE3A1', 0.85],
    fog0: '#b9965e', fog1: '#7d8499', dens0: 0.0012, dens1: 0.004, exposure: 0.97, night: 0, lamps: 0, haze: '#6f6c7c',
    shelf: ['#2b3058', '#4a5078', '#b48a5e'], wallLit: '#8a86a4', wallShade: '#3b4168', rain: ['#fff0c8', '#d8d6e8', '#ffe2a0'], gold: [1.7, 1.35, 0.8],
    grade: { saturation: 1.0, contrast: 1.06, tint: '#fff6ea', shadowTint: '#05060f' }, portal: '#ffe3a1', flock: 1,
  },
  dusk: {
    title: 'The Thousand-Stair Rain at Dusk',
    sky: { preset: 'blueHour', zenith: '#30365a', mid: '#3c4268', horizon: '#4a4f74', ground: '#2c2a30', horizonPow: 2.8, midPow: 1.3,
      scatterColor: '#ffab6b', scatter: 1.5, scatterPow: 2.6, scatterHigh: 0.1, scatterFall: 6, sunIntensity: 0, sunGlow: 0.5, stars: 0, bodies: [],
      lightning: 0, clouds: false, clouds2: { coverage: 0.4, stretch: 1, opacity: 0.6, lit: '#f0a880', shade: '#4a4a70', haze: 1.3 },
      lightColor: '#ffc49a', lightIntensity: 1.5, ambientColor: '#5a6cae', groundLight: '#6a5c58', ambientIntensity: 1.3, lightElevationMin: 17, key: 'sun' },
    sunEl: -3, sunAz: 285, heroSun: ['#ffb684', 0.5], heroFill: ['#6c80b8', 1.2], skyE: ['#1a1f44', 2.0], skyW: ['#ffb07a', 0.8],
    fog0: '#5a5670', fog1: '#525a78', dens0: 0.0013, dens1: 0.0038, exposure: 1.12, night: 0.6, lamps: 1, haze: '#5a5e7c',
    shelf: ['#272b4a', '#3e4264', '#c08a6e'], wallLit: '#8a7a94', wallShade: '#33385c', rain: ['#c8d4f0', '#a8b4d8', '#e8d0c0'], gold: [0.7, 0.85, 1.25],
    grade: { saturation: 0.94, contrast: 1.0, tint: '#f4f2ff', shadowTint: '#0b0c16' }, portal: '#ffd9a0', flock: 0.9,
  },
  dust: {
    title: 'Dust Before the Rain',
    sky: { preset: 'storm', zenith: '#3e3440', mid: '#5a4640', horizon: '#8a6238', ground: '#4a3620', horizonPow: 2.0, midPow: 1.2,
      scatterColor: '#ffb060', scatter: 1.3, scatterPow: 2.4, scatterHigh: 0.25, scatterFall: 3.5, sunColor: '#ff9d4a', sunSize: 1.6, sunIntensity: 9,
      sunGlow: 1.3, sunGlowTight: 0.3, stars: 0, lightning: 0, clouds: false, clouds2: false,
      lightColor: '#ffcf98', lightIntensity: 2.9, ambientColor: '#b4a694', groundLight: '#8a6a3c', ambientIntensity: 1.5, lightElevationMin: 10 },
    sunEl: 20, sunAz: 281, heroSun: ['#ffa050', 1.7], heroFill: ['#6a5a66', 2.0], skyE: ['#3a2c38', 2.2], skyW: ['#ffc070', 0.85],
    fog0: '#c08a4a', fog1: '#7d8499', dens0: 0.0032, dens1: 0.004, exposure: 1.06, night: 0, lamps: 0, haze: '#94765a',
    shelf: ['#3a2f3a', '#4e4250', '#e09048'], wallLit: '#7e6a78', wallShade: '#3c3040', wallBase: '#5c4a4e', rain: ['#ffe0b0', '#d8d0d8', '#ffd090'], gold: [1.7, 1.2, 0.65],
    grade: { saturation: 0.9, contrast: 1.07, tint: '#fff2e2', shadowTint: '#0a0a10' }, portal: '#ffe3a1', flock: 1,
    clean: { sun: '#FFD08A', fill: ['#586a98', 1.75], skyE: ['#1F2347', 2.4], light: '#FFD08A', amb: '#6a76a8' },
  },
};

// ---------- tiny vertex-colour geometry builder (for creatures and loose props drawn with a Lambert material) ----------
function makeVB() {
  const pos = [], col = [];
  const b = {
    c: [1, 1, 1], ox: 0, oy: 0, oz: 0, cs: 1, sn: 0, sc: 1,
    at(x, y, z, rot = 0, s = 1) { b.ox = x; b.oy = y; b.oz = z; b.cs = Math.cos(rot); b.sn = Math.sin(rot); b.sc = s; return b; },
    tint(h, k = 1) { const c = H(h); b.c = [c.r * k, c.g * k, c.b * k]; return b; },
    v(p) { const x = p[0] * b.sc, y = p[1] * b.sc, z = p[2] * b.sc; pos.push(b.ox + x * b.cs + z * b.sn, b.oy + y, b.oz - x * b.sn + z * b.cs); col.push(b.c[0], b.c[1], b.c[2]); },
    tri(a, c, d) { b.v(a); b.v(c); b.v(d); },
    quad(a, c, d, e) { b.tri(a, c, d); b.tri(a, d, e); },
    box(x0, y0, z0, x1, y1, z1) {
      const a0 = [x0, y0, z0], a1 = [x1, y0, z0], a2 = [x1, y0, z1], a3 = [x0, y0, z1], t0 = [x0, y1, z0], t1 = [x1, y1, z0], t2 = [x1, y1, z1], t3 = [x0, y1, z1];
      b.quad(a0, t0, t1, a1); b.quad(a1, t1, t2, a2); b.quad(a2, t2, t3, a3); b.quad(a3, t3, t0, a0); b.quad(t0, t3, t2, t1); b.quad(a0, a1, a2, a3);
    },
    // lathe about an axis through (cx, cz); axis 'y' (upright) or 'z' (lying along z, profile y = distance along z)
    lathe(cx, cy, cz, prof, sides = 8, axis = 'y', arc = TAU, a0 = 0) {
      const P = (r, h, a) => axis === 'y' ? [cx + Math.cos(a) * r, cy + h, cz + Math.sin(a) * r] : [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz + h];
      for (let i = 0; i < prof.length - 1; i++) for (let s = 0; s < sides; s++) {
        const a = a0 + (s / sides) * arc, a2 = a0 + ((s + 1) / sides) * arc, [r0, h0] = prof[i], [r1, h1] = prof[i + 1];
        if (r0 < 1e-4) b.tri(P(r0, h0, a), P(r1, h1, a2), P(r1, h1, a)); else if (r1 < 1e-4) b.tri(P(r0, h0, a), P(r0, h0, a2), P(r1, h1, a));
        else b.quad(P(r0, h0, a), P(r0, h0, a2), P(r1, h1, a2), P(r1, h1, a));
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
      g.computeVertexNormals();
      return g;
    },
  };
  return b;
}

// a peacock: body, neck, crest and train. fan = 1 raises the train into a fan; glide = 1 spreads wings and trails the train
function peacock(b, fan = 0, glide = 0) {
  const blue = '#2f6fe0', green = '#3aa66a', bronze = '#a8943c', eye = '#3a72f0';
  b.tint(blue, 0.9); b.lathe(0, glide ? 0 : 0.62, -0.42, [[0, 0], [0.2, 0.18], [0.24, 0.45], [0.18, 0.75], [0, 0.9]], 6, 'z');
  if (!glide) { b.tint('#6a6050'); b.box(-0.09, 0, -0.03, -0.05, 0.5, 0.03); b.box(0.05, 0, -0.03, 0.09, 0.5, 0.03); }
  const ny = glide ? 0.08 : 0.72, nz = 0.38, top = glide ? [0, 0.22, 1.0] : [0, 1.32, 0.52];
  b.tint(blue, 1.15);
  for (const sx of [-1, 1]) b.quad([sx * 0.09, ny, nz - 0.06], [sx * 0.05, top[1], top[2] - 0.05], [0, top[1], top[2] + 0.05], [0, ny, nz + 0.08]);
  b.quad([-0.09, ny, nz - 0.06], [0.09, ny, nz - 0.06], [0.05, top[1], top[2] - 0.05], [-0.05, top[1], top[2] - 0.05]);
  b.box(-0.06, top[1] - 0.02, top[2] - 0.06, 0.06, top[1] + 0.1, top[2] + 0.12);
  b.tint('#d8d0b0'); b.tri([-0.03, top[1] + 0.04, top[2] + 0.12], [0.03, top[1] + 0.04, top[2] + 0.12], [0, top[1] + 0.02, top[2] + 0.24]);
  b.tint(blue, 1.4); for (const dx of [-0.05, 0, 0.05]) b.tri([dx - 0.015, top[1] + 0.1, top[2]], [dx + 0.015, top[1] + 0.1, top[2]], [dx * 2.2, top[1] + 0.3, top[2] - 0.05]);
  const by = glide ? 0.02 : 0.7;
  if (fan) {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a0 = -1.45 + (2.9 * i) / n, a1 = -1.45 + (2.9 * (i + 1)) / n, R = 1.45, z = -0.3;
      b.tint(i % 2 ? green : bronze, 1.0);
      b.quad([Math.sin(a0) * 0.15, by + Math.cos(a0) * 0.15, z], [Math.sin(a1) * 0.15, by + Math.cos(a1) * 0.15, z], [Math.sin(a1) * R, by + Math.cos(a1) * R, z - 0.25], [Math.sin(a0) * R, by + Math.cos(a0) * R, z - 0.25]);
      const am = (a0 + a1) / 2; b.tint(eye, 1.3);
      b.quad([Math.sin(am) * (R - 0.32) - 0.07, by + Math.cos(am) * (R - 0.32), z - 0.3], [Math.sin(am) * (R - 0.32) + 0.07, by + Math.cos(am) * (R - 0.32), z - 0.3],
        [Math.sin(am) * (R - 0.14) + 0.07, by + Math.cos(am) * (R - 0.14), z - 0.3], [Math.sin(am) * (R - 0.14) - 0.07, by + Math.cos(am) * (R - 0.14), z - 0.3]);
    }
  } else {
    const L = glide ? 2.3 : 1.9, drop = glide ? 0.12 : 0.62;
    for (let i = 0; i < 4; i++) {
      const x0 = -0.2 + i * 0.1, x1 = x0 + 0.1, w = 1.7; b.tint(i % 2 ? green : bronze, 0.95);
      b.quad([x0, by, -0.3], [x1, by, -0.3], [x1 * w, by - drop, -0.3 - L], [x0 * w, by - drop, -0.3 - L]);
    }
    b.tint(eye, 1.2); b.quad([-0.2, by - drop * 0.75, -0.3 - L * 0.75], [0.2, by - drop * 0.75, -0.3 - L * 0.75], [0.3, by - drop, -0.3 - L], [-0.3, by - drop, -0.3 - L]);
  }
  if (glide) for (const sx of [-1, 1]) {
    b.tint('#8a6a3a'); b.quad([sx * 0.15, 0.12, 0.3], [sx * 0.95, 0.24, 0.12], [sx * 0.9, 0.2, -0.3], [sx * 0.15, 0.1, -0.25]);
    b.tint('#3a3a44'); b.quad([sx * 0.95, 0.24, 0.12], [sx * 1.3, 0.2, -0.1], [sx * 1.2, 0.18, -0.35], [sx * 0.9, 0.2, -0.3]);
  }
}

// the two peacocks that glide close to the camera are modelled feather by feather (the perched ones above are seen from far off):
// a smooth body, neck, head, beak and crest; each wing an arm of barred coverts, dark secondaries and chestnut primaries with dark
// tips, every flight feather its own rounded blade so the trailing edge is notched and the wingtip fingered, with a little dihedral;
// the train three layers of long tapered feathers, each ending in an eye, so the eyes lie staggered down its last two thirds.
// aF = (across the feather -1..1, along it 0..1, kind + length/10): kind 0 skin, 1 flight feather, 2 train feather, 3 barred covert.
// aW = (wing weight 0..1 from shoulder to tip, train weight in metres from its root, the bird's phase): the vertex shader beats and trails them
function gliderGeometry(birds) {
  const pos = [], col = [], nor = [], fe = [], wt = [];
  let M = [0, 0, 0, 0, 1], ph = 0;
  const C = (h, k = 1) => { const c = H(h); return [c.r * k, c.g * k, c.b * k]; };
  const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const put = (p, n, c, f, w) => {
    const cs = Math.cos(M[3]), sn = Math.sin(M[3]), k = M[4];
    pos.push(M[0] + (p[0] * cs + p[2] * sn) * k, M[1] + p[1] * k, M[2] + (-p[0] * sn + p[2] * cs) * k);
    nor.push(n[0] * cs + n[2] * sn, n[1], -n[0] * sn + n[2] * cs); col.push(c[0], c[1], c[2]); fe.push(f[0], f[1], f[2]); wt.push(w[0], w[1] * k, ph);
  };
  const tri = (a, b, c) => { put(...a); put(...b); put(...c); };
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  const cBlue = C('#1d3f9c'), cNeck = C('#2552c4'), cHead = C('#1f48b0'), cRump = C('#2c6a44'), cBeak = C('#cfc6a8'), cDark = C('#20222c'), cChest = C('#a85c28'), cTip = C('#34261e'),
    cBuff = C('#b89c68'), cGreen = C('#2f7c46'), cBronze = C('#8a7c34'), cCrest = C('#1f6c5c'), cWhite = C('#d8d4c4');
  // one blade: a feather from `base` along unit `dir`, `side` across it, `up` its normal; widths as fractions of w at 0, 0.55, 0.9 and the tip
  const blade = (base, dir, side, up, len, w, c0, c1, kind, wOf, sag = 0, cup = 0) => {
    const st = [[0, 0.55], [0.5, 1], [0.86, 0.8], [1, 0.3]], P = [];
    for (const [v, k] of st) {
      const cx = base[0] + dir[0] * len * v, cy = base[1] + dir[1] * len * v - sag * v * v, cz = base[2] + dir[2] * len * v, hw = w * k * 0.5, row = [];
      for (const q of [-1, 1]) { const p = [cx + side[0] * hw * q, cy + side[1] * hw * q - cup * (q > 0 ? 1 : 0), cz + side[2] * hw * q]; row.push([p, up, mixC(c0, c1, v), [q, v, kind + len / 10], wOf(p, v)]); }
      P.push(row);
    }
    for (let i = 0; i < 3; i++) quad(P[i][0], P[i][1], P[i + 1][1], P[i + 1][0]);
  };
  for (const bd of birds) {
    M = bd; ph = bd[5] || 0;
    const noW = () => [0, 0];
    // body, neck, head and beak: one tube of rings along z, a little flattened
    const ST = [[-0.5, 0.0, 0.0, cRump], [-0.42, 0.09, 0.0, cRump], [-0.25, 0.17, 0.0, mixC(cRump, cBlue, 0.5)], [-0.05, 0.215, 0.0, cBlue], [0.15, 0.21, 0.0, cBlue], [0.3, 0.16, 0.02, cBlue], [0.4, 0.11, 0.04, cNeck],
      [0.56, 0.075, 0.075, cNeck], [0.74, 0.06, 0.12, cNeck], [0.88, 0.055, 0.155, cHead], [0.95, 0.072, 0.17, cHead], [1.02, 0.068, 0.172, cHead], [1.07, 0.036, 0.165, cBeak], [1.17, 0.0, 0.15, cBeak]], NS = 10;
    const ring = (i, a) => { const [z, r, yc, c] = ST[i], ca = Math.cos(a), sa = Math.sin(a), cheek = i >= 10 && i <= 11 && Math.abs(sa) < 0.4;
      return [[ca * r, yc + sa * r * 0.88, z], [ca, sa, 0.15], sa < -0.5 ? mixC(c, cDark, 0.35) : cheek ? cWhite : c, [0, 0, 0], [0, 0]]; };
    for (let i = 0; i < ST.length - 1; i++) for (let j = 0; j < NS; j++) { const a0 = (j / NS) * TAU, a1 = ((j + 1) / NS) * TAU; quad(ring(i, a0), ring(i, a1), ring(i + 1, a1), ring(i + 1, a0)); }
    // crest: five fine stalks, each ending in a small blade
    for (let i = 0; i < 5; i++) { const dx = (i - 2) * 0.028, b0 = [dx * 0.4, 0.235, 0.985], t = [dx * 1.5, 0.39, 0.93 - Math.abs(i - 2) * 0.012], up = [0, 0.3, 1];
      quad([[b0[0] - 0.006, b0[1], b0[2]], up, cCrest, [0, 0, 0], [0, 0]], [[b0[0] + 0.006, b0[1], b0[2]], up, cCrest, [0, 0, 0], [0, 0]], [[t[0] + 0.005, t[1], t[2]], up, cCrest, [0, 0, 0], [0, 0]], [[t[0] - 0.005, t[1], t[2]], up, cCrest, [0, 0, 0], [0, 0]]);
      quad([[t[0] - 0.022, t[1], t[2]], up, cCrest, [0, 0, 0], [0, 0]], [[t[0], t[1] - 0.02, t[2]], up, cCrest, [0, 0, 0], [0, 0]], [[t[0] + 0.022, t[1], t[2]], up, cCrest, [0, 0, 0], [0, 0]], [[t[0], t[1] + 0.045, t[2] - 0.006], up, cHead, [0, 0, 0], [0, 0]]); }
    // wings
    for (const sx of [-1, 1]) {
      const S = [sx * 0.13, 0.1, 0.24], Wr = [sx * 0.6, 0.17, 0.31], T = [sx * 1.08, 0.27, 0.06];
      const bone = (t) => (t < 0.55 ? [lerp(S[0], Wr[0], t / 0.55), lerp(S[1], Wr[1], t / 0.55), lerp(S[2], Wr[2], t / 0.55)] : [lerp(Wr[0], T[0], (t - 0.55) / 0.45), lerp(Wr[1], T[1], (t - 0.55) / 0.45), lerp(Wr[2], T[2], (t - 0.55) / 0.45)]);
      const wOfX = (p) => [clamp((Math.abs(p[0]) - 0.13) / 0.95, 0, 1), 0], chord = (t) => 0.25 * (1 - 0.55 * t), up = [-sx * 0.12, 1, 0.05];
      // the arm: barred coverts from the leading edge back to where the flight feathers are rooted, cambered a little
      const NA = 7;
      for (let i = 0; i < NA; i++) {
        const t0 = i / NA, t1 = (i + 1) / NA, a = bone(t0), b = bone(t1), c0 = chord(t0), c1 = chord(t1);
        const V = (p, dz, cam, t, v) => { const q = [p[0], p[1] + cam, p[2] - dz]; return [q, up, mixC(cBuff, cDark, 0.25 + 0.3 * t), [0, v, 3 + t], wOfX(q)]; };
        quad(V(a, -0.02, -0.01, t0, 0), V(b, -0.02, -0.01, t1, 0), V(b, c1 * 0.5, 0.022, t1, 0.5), V(a, c0 * 0.5, 0.022, t0, 0.5));
        quad(V(a, c0 * 0.5, 0.022, t0, 0.5), V(b, c1 * 0.5, 0.022, t1, 0.5), V(b, c1, 0.0, t1, 1), V(a, c0, 0.0, t0, 1));
      }
      // sixteen flight feathers: secondaries pointing back, primaries swinging outward to the fingered tip
      const NF = 16;
      for (let i = 0; i < NF; i++) {
        const t = i / (NF - 1), a = bone(t), base = [a[0], a[1] - 0.004 - 0.002 * i, a[2] - chord(t) * 0.8], ang = lerp(-0.12, 1.3, Math.pow(t, 1.6));
        const dir = [sx * Math.sin(ang), -0.03, -Math.cos(ang)], side = [sx * Math.cos(ang), 0, Math.sin(ang)];
        const len = 0.4 + 0.24 * Math.sin(Math.PI * clamp((t - 0.25) / 0.95, 0, 1)), prim = smoothstep(0.42, 0.6, t);
        blade(base, dir, side, up, len, 0.125 - 0.03 * prim, mixC(cDark, cChest, prim), mixC(cDark, cTip, prim), 1, wOfX, 0.02, 0.014);
      }
    }
    // the train: three layers streaming behind, long over short, each feather ending in an eye
    const root = [0, 0.05, -0.4];
    const layer = (n, spread, l0, l1, lift, sag) => { for (let i = 0; i < n; i++) {
      const q = n === 1 ? 0 : i / (n - 1) * 2 - 1, ang = q * spread, len = lerp(l1, l0, Math.abs(q)) * (0.94 + 0.12 * hash1(i * 7.3 + n * 3.1 + ph));
      const dir = [Math.sin(ang), -0.035, -Math.cos(ang)], side = [Math.cos(ang), 0, Math.sin(ang)], c = i % 2 ? cGreen : cBronze;
      blade([root[0] + q * 0.1, root[1] + lift, root[2]], dir, side, [0, 1, 0], len, 0.2, mixC(c, cDark, 0.35), c, 2, (p, v) => [0, v * len], sag * len, 0); } };
    layer(7, 0.34, 0.55, 0.85, 0.05, 0.02);
    layer(8, 0.27, 1.05, 1.5, 0.03, 0.035);
    layer(9, 0.2, 1.75, 2.35, 0.0, 0.05);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aF', new THREE.Float32BufferAttribute(fe, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(wt, 3));
  return g;
}
const GLIDER_VERT = /* glsl */`
attribute vec3 aF; attribute vec3 aW;
uniform float uTime, uAmp;
varying vec3 vC; varying vec3 vW; varying vec3 vN; varying vec3 vF;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; vC = color; vF = aF;
  float ph = aW.z, beat = sin(uTime*2.2 + ph)*0.8 + sin(uTime*4.4 + ph*1.7)*0.2;
  p.y += aW.x*aW.x*beat*uAmp - beat*uAmp*0.16;                                  // the wings beat slowly from the shoulder and the body rides against them
  p.z -= aW.x*aW.x*cos(uTime*2.2 + ph)*uAmp*0.25;
  p.y += aW.y*0.05*sin(uTime*3.1 - aW.y*1.5 + ph);                              // the train trails and ripples toward its tips
  p.x += aW.y*0.035*sin(uTime*2.3 - aW.y*1.1 + ph*2.);
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
  vN = mat3(modelMatrix)*(normal + vec3(0., aW.x*beat*0.5, 0.));
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GLIDER_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uAmb;
varying vec3 vC; varying vec3 vW; varying vec3 vN; varying vec3 vF;
#include <fog_pars_fragment>
void main(){
  vec3 N = vN / max(length(vN), 1e-5);
  vec3 Vv = cameraPosition - vW; vec3 V = Vv / max(length(Vv), 1e-4);
  if (dot(N, V) < 0.) N = -N;
  vec3 alb = vC;
  float kind = floor(vF.z + 0.001), len = (vF.z - kind)*10., ax = abs(vF.x), gloss = 0.5;
  if (kind > 0.5 && kind < 2.5) {                                               // a feather: its shaft, its barbs, a darker edge
    float barb = 0.8 + 0.2*sin(vF.y*len*45. + ax*5.);
    alb *= barb * (1. - 0.3*smoothstep(0.55, 1., ax));
    alb = mix(alb, alb*1.7 + 0.03, smoothstep(0.16, 0.05, ax)*0.55);
  }
  if (kind > 1.5 && kind < 2.5) {                                               // the eye at a train feather's end
    vec2 q = vec2(vF.x*0.085, (vF.y - 0.86)*len) / 0.075;
    float r = length(q*vec2(1., 0.8));
    vec3 eye = mix(vec3(0.015, 0.02, 0.11), vec3(0.03, 0.24, 0.4), smoothstep(0.3, 0.42, r));
    eye = mix(eye, vec3(0.4, 0.25, 0.06), smoothstep(0.6, 0.72, r));
    eye = mix(eye, vec3(0.2, 0.36, 0.11), smoothstep(0.92, 1.05, r));
    alb = mix(eye, alb, smoothstep(1.15, 1.4, r));
    gloss = 0.6;
  }
  if (kind > 2.5) { float t = vF.z - 3.; alb *= 0.5 + 0.5*smoothstep(0.35, 0.5, abs(fract(vF.y*3.5 + t*13.) - 0.5)*2.); gloss = 0.2; }
  if (kind < 0.5) gloss = 0.8;
  float nl = abs(dot(N, uSunDir)), fr = 1. - abs(dot(N, V));
  vec3 col = alb * (uAmb*(0.9 + 0.35*N.y) + uSunCol*(0.2 + 0.6*nl));
  col += (alb*1.6 + vec3(0.01, 0.03, 0.04)) * gloss * (fr*fr*0.55*(uAmb + uSunCol*0.5));     // the sheen of the neck and train as they turn
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------- shared GLSL ----------
const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm4(vec2 p){ return vn(p)*0.5 + vn(p*2.03 + 11.7)*0.25 + vn(p*4.1 + 5.3)*0.125 + vn(p*8.3 + 2.1)*0.0625; }
`;

// the shelf cloud: one sheet of scrolling noise 380 m up, covering everything east of a ragged edge that slides west with u
const SHELF_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const SHELF_FRAG = /* glsl */`
uniform float uTime, uEdge, uFlash, uTear;
uniform vec3 uDark, uMid, uLit, uHaze, uCam, uFlashPos, uTearPos;
varying vec3 vW;
${NOISE}
void main(){
  vec2 p = vW.xz;
  vec2 q = p*0.00105 + vec2(uTime*0.006, uTime*0.0012);
  float n = fbm4(q);
  float n2 = fbm4(q*3.3 + vec2(uTime*0.011, 3.7));
  float n3 = fbm4(q*3.3 + vec2(uTime*0.011 - 0.05, 3.7));        // the same lumps a step toward the sun: their lit side
  float edge = uEdge + (n - 0.47)*620. + (n2 - 0.5)*170.;
  float cover = smoothstep(edge - 30., edge + 260., p.x);
  float tear = uTear * (1. - smoothstep(60., 210., length((p - uTearPos.xz)*vec2(1., 0.6)) + (n2 - 0.5)*160.));
  cover *= 1. - tear;
  if (cover < 0.004) discard;
  float lip = 1. - smoothstep(0., 520., p.x - edge);
  float body = n*0.55 + n2*0.45;
  vec3 col = mix(uDark, uMid, smoothstep(0.32, 0.78, body));
  float lit = clamp((n2 - n3)*9. + 0.5, 0., 1.);
  col = mix(col, uLit, clamp(lip*lip*(0.25 + 0.75*lit) + lit*0.1, 0., 1.));
  col += uLit * uTear * 1.6 * (1. - smoothstep(200., 420., length((p - uTearPos.xz)*vec2(1., 0.6)))) * (0.4 + 0.6*n2);
  float d = length(vW - uCam);
  col = mix(col, uHaze, smoothstep(1400., 5600., d)*0.9);
  float fd = length(p - uFlashPos.xz);
  col += uFlash * vec3(0.5, 0.56, 1.0) * exp(-fd*fd/(1100.*1100.)) * (0.35 + 0.65*n2);
  gl_FragColor = vec4(col, cover*(0.93 + 0.07*n2));
}`;

// the cloud wall: cumulonimbus towers at three depths round the eastern sky, an anvil, a dark foot with rain under it, and the two flickers deep inside it
const WALL_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const WALL_FRAG = /* glsl */`
uniform float uTime;
uniform vec2 uFlash;
uniform vec3 uLit, uShade, uBase, uRim;
varying vec2 vUv;
${NOISE}
// The wall keeps live's own top line and alpha inside it (the far rank, hazier) and stands two ranks of towers before it. X is radians along the arc
// (vUv.x*3.8: 0 at azimuth 198.85 degrees in the south, 3.8 at azimuth -18.85 in the north), h is vUv.y (0.0288 the ground, 0.1019 the foot at
// the shelf's own 380 m); 1 of either is 5200 m. Every tower comes from a hash of its cell number: no stream and no draw. The sun stands at azimuth 285, 18 degrees up.
// A rank is ONE body: a bank with a head on each tower, the heads joined in round saddles; it is lit as one form, and round lobes of three sizes, joined smoothly, only swell its outline and modulate its light.
// The lobes live in the rank's own frame (X, y = h*0.6/head: the heads' own level at that X stands at 0.6), where the heads' bare form is known without any noise.
vec3 h32(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz)*q.zyx); }
const mat2 LR1 = mat2(0.8525, 0.5227, -0.5227, 0.8525);
// live's value noise at p and at a second place p2 that lies in the same noise cell or in the next one to the left, above, or both (live's billow and the same
// billow a step toward the sun): x at p, y at p2, the very numbers vn gives; the second reads again every hash the first has read (7 hashes at most, not 8)
vec2 vn2(vec2 p, vec2 p2){
  vec2 i = floor(p), f = fract(p), i2 = floor(p2), f2 = fract(p2), dI = i2 - i;
  float a = h21(i), b = h21(i + vec2(1., 0.)), c = h21(i + vec2(0., 1.)), e = h21(i + vec2(1., 1.));
  float a2 = a, b2 = b, c2 = c, e2 = e;
  if (dI == vec2(-1., 0.)) { b2 = a; e2 = c; a2 = h21(i2); c2 = h21(i2 + vec2(0., 1.)); }
  else if (dI == vec2(0., 1.)) { a2 = c; b2 = e; c2 = h21(i2 + vec2(0., 1.)); e2 = h21(i2 + vec2(1., 1.)); }
  else if (dI == vec2(-1., 1.)) { b2 = c; a2 = h21(i2); c2 = h21(i2 + vec2(0., 1.)); e2 = h21(i2 + vec2(1., 1.)); }
  else if (dI != vec2(0.)) { a2 = h21(i2); b2 = h21(i2 + vec2(1., 0.)); c2 = h21(i2 + vec2(0., 1.)); e2 = h21(i2 + vec2(1., 1.)); }
  f = f*f*(3. - 2.*f); f2 = f2*f2*(3. - 2.*f2);
  return vec2(mix(mix(a, b, f.x), mix(c, e, f.x), f.y), mix(mix(a2, b2, f2.x), mix(c2, e2, f2.x), f2.y));
}
vec2 fbm4p(vec2 p, vec2 p2){ return vn2(p, p2)*0.5 + vn2(p*2.03 + 11.7, p2*2.03 + 11.7)*0.25 + vn2(p*4.1 + 5.3, p2*4.1 + 5.3)*0.125 + vn2(p*8.3 + 2.1, p2*8.3 + 2.1)*0.0625; }
// live's value noise at p and, on the same row, at the place xs (taken no farther than the next cell on either side): x at p, y at xs; 2 hashes more at most
vec2 vnx(vec2 p, float xs){
  vec2 i = floor(p), f = fract(p);
  float a = h21(i), b = h21(i + vec2(1., 0.)), c = h21(i + vec2(0., 1.)), e = h21(i + vec2(1., 1.));
  float i2 = clamp(floor(xs), i.x - 1., i.x + 1.), f2 = clamp(xs - i2, 0., 1.);
  float a2 = a, b2 = b, c2 = c, e2 = e;
  if (i2 < i.x) { b2 = a; e2 = c; a2 = h21(vec2(i2, i.y)); c2 = h21(vec2(i2, i.y + 1.)); }
  else if (i2 > i.x) { a2 = b; c2 = e; b2 = h21(vec2(i2 + 1., i.y)); e2 = h21(vec2(i2 + 1., i.y + 1.)); }
  f = f*f*(3. - 2.*f); f2 = f2*f2*(3. - 2.*f2);
  return vec2(mix(mix(a, b, f.x), mix(c, e, f.x), f.y), mix(mix(a2, b2, f2), mix(c2, e2, f2), f.y));
}
// tower i of a rank (cells W wide from X0; k 1 the near rank, 0 the middle one): its centre, its half width, its rise over live's line (before the arc's fade)
vec3 towerOf(float i, float W, float X0, float k){
  vec3 r = h32(vec2(i, 7. + 31.*k));
  float ese = k*step(abs(i - 4.), 0.5);                                  // the near rank's cell 4 is centred on azimuth 112.5: the tallest tower, the anvil's
  return vec3(X0 + (i + 0.5 + (r.x - 0.5)*0.4*(1. - ese))*W, W*mix(0.5 + 0.28*r.y, 0.7, ese), mix(0.03*r.z, mix(0.02 + 0.035*r.z, 0.065, ese), k));
}
// the HEADS' bare form at a place S of the rank's own frame: a head stands on each of the three towers that can reach the place. A head is half of its tower's
// half width; its foot stands at 0.65 of its own level (the floor of the saddles), it is widest at 0.4 of its own height, an elliptic dome above that, a fifth
// narrower toward its foot, and it runs on below its foot as a column. Two heads whose open gap is under 260 m are joined into a twin by a smooth maximum 0.1 wide.
// The form is known here without any noise and without any number of the pixel being drawn, so the lobes that grow from it are the same for every pixel.
// x: the heads' outline as a distance (over 0 inside), y: the place across the heads (-1 to 1, 0 between them), z: the heart (1 on a head's axis, 0 at its
// outline and between heads), w: how far the form leans toward the sky (the dome only)
float smax(float a, float b){ float h = max(0.1 - abs(a - b), 0.)/0.1; return max(a, b) + h*h*0.025; }
vec4 body(vec2 S, vec3 A, vec3 B, vec3 C){
  float v = (S.y/0.6 - 0.65)/0.35, z = clamp(1. - v/0.4, 0., 1.), g = 1. - 0.2*z*z*(3. - 2.*z), t = max(0., (v - 0.4)/0.6);
  vec3 a = 0.5*vec3(A.y, B.y, C.y), u = (vec3(S.x) - vec3(A.x, B.x, C.x))/(a*g), n2 = u*u + t*t, N = sqrt(n2);
  vec3 f = (1. - N)*g*(a*u*u + 0.126*t*t + a*1e-3)/(n2 + 1e-3);          // (a head's own distance: across its width on the flank, along the dome's height at its top)
  // no head is a clean oval: three slow swells (680 m, 490 m and 1090 m long, 52, 42 and 52 m high) lie across the heads and rise with the lobes; the lobes grow from the swollen form
  vec2 Sr = vec2(S.x, S.y - uTime*0.003);
  f += 0.010*sin(dot(Sr, vec2(43.8, 20.4)) + 1.3) + 0.008*sin(dot(Sr, vec2(50.7, -42.5)) + 4.1) + 0.010*sin(dot(Sr, vec2(10.2, 28.1)) + 2.2);
  vec3 w = 1. - smoothstep(0.8, 1.5, N), e = clamp(1. - n2, 0., 1.);
  float sw = w.x + w.y + w.z + 0.05, ts = min(t, 1.);
  return vec4(smax(smax(f.x, f.y), f.z), dot(clamp(u, -1., 1.), w)/sw, 1. - (1. - e.x)*(1. - e.y)*(1. - e.z), ts*ts*(3. - 2.*ts)*dot(min(N, 1.), w)/sw);
}
// one round lobe laid into the cloud. d: the place from the lobe's centre, re: its radius, am: its strength.
// F gathers the cloud's outline as a distance (over 0 inside), the lobes joined to it by a smooth maximum a quarter of their radius wide;
// Q gathers the product of (1 - bump), each bump (1 - t*t)^3, level at its middle and at its rim: the lobes' smooth relief, with no nearest cell, no line and no corner; dQ its slope
void disc(vec2 d, float re, float am, inout float F, inout float Q, inout vec2 dQ){
  if (re < 1e-4) return;
  float r2 = re*re, t = 1. - min(dot(d, d)/r2, 1.), b = am*t*t*t*min(re/0.06, 1.);          // a lobe's relief is as deep as the lobe is large
  dQ = dQ*(1. - b) + Q*6.*am*min(re/0.06, 1.)*t*t*d/r2;
  Q *= 1. - b;
  float dist = re - length(d);
  dist *= dist < 0. ? max(1., 0.03/re) : 1.;                           // (a lobe that has all but gone casts no edge about itself)
  float ks = 0.25*re, hh = clamp(0.5 + 0.5*(dist - F)/ks, 0., 1.);
  F = mix(F, dist, hh) + ks*hh*(1. - hh);
}
// one large lobe (about 440 m: its radius 0.42 to 0.85 of the cell by its own hash r, breathing a tenth on its own 7 to 14 s) with the smaller ones that ride on it:
// three of about 190 m on its upper rim, turned toward the sun, and two of about 80 m on each of those. A large lobe exists only if its own centre lies inside the heads' bare form
// (its radius grows from nothing over the first 0.4 of its depth), and every smaller one overlaps the one it rides on: so NOTHING CAN FLOAT FREE of the tower.
// The smaller ones grow only above half the head and most on the shoulder toward the sun.
void lobe(vec3 r, vec2 g, vec2 q, vec2 pS, float cell, vec3 A, vec3 B, vec3 C, vec3 L, inout float F, inout float Q, inout vec2 dQ){
  vec2 d = ((q - (g + 0.5 + (r.xy - 0.5)*0.5))*LR1)*cell, c = pS - d;
  float rad = (0.42 + 0.43*r.z)*(0.9 + 0.1*sin(uTime*(0.45 + 0.45*r.x) + r.x*40.))*cell;
  if (dot(d, d) > 2.2*rad*rad) return;                                  // (the lobe and all that rides on it reach 1.46 of its radius at most)
  vec4 bc = body(c, A, B, C);
  float re = rad*smoothstep(0., 0.4*rad, bc.x);
  if (re < 1e-4) return;
  float am = 0.55 + 0.45*fract(r.z*7.3 + r.x*3.1);
  float crowd = smoothstep(0.5, 0.75, c.y/0.6)*(0.55 + 0.45*(0.5 + 0.5*bc.y*L.x/0.951));
  disc(d, re, am, F, Q, dQ);
  for (int j = 0; j < 3; j++) {
    vec3 r2 = fract(r.zxy*vec3(17.3, 23.7, 31.1) + float(j)*vec3(0.37, 0.71, 0.13));
    float th = 1.5708 - 0.6*L.x + (r2.x - 0.5)*3.5 + 0.3*sin(uTime*(0.4 + 0.4*r2.z) + r2.z*40.);
    float rc = re*(0.35 + 0.2*r2.y)*crowd;
    vec2 d2 = d - (re - 0.45*rc)*vec2(cos(th), sin(th));                // (its centre inside the lobe it rides on, whatever its size)
    disc(d2, rc, am*0.8, F, Q, dQ);
    for (int m = 0; m < 2; m++) {
      vec3 r3 = fract(r2.yzx*vec3(13.1, 29.3, 19.7) + float(m)*vec3(0.53, 0.29, 0.83));
      float th3 = th + (r3.x - 0.5)*3. + 0.3*sin(uTime*(0.5 + 0.5*r3.z) + r3.z*40.);
      float rg = rc*(0.3 + 0.2*r3.y);
      disc(d2 - (rc - 0.45*rg)*vec2(cos(th3), sin(th3)), rg, am*0.45, F, Q, dQ);
    }
  }
}
// the three large lobes of cell g: one hash, the second and third drawn from it by arithmetic
void lobes(vec2 g, vec2 q, vec2 pS, float cell, vec3 A, vec3 B, vec3 C, vec3 L, inout float F, inout float Q, inout vec2 dQ){
  vec3 r = h32(g);
  lobe(r, g, q, pS, cell, A, B, C, L, F, Q, dQ);
  lobe(fract(r.zxy*vec3(27.13, 15.71, 39.37) + vec3(0.41, 0.17, 0.83)), g, q, pS, cell, A, B, C, L, F, Q, dQ);
  lobe(fract(r.yzx*vec3(21.57, 33.19, 11.83) + vec3(0.73, 0.59, 0.29)), g, q, pS, cell, A, B, C, L, F, Q, dQ);
}
// one rank laid over what stands behind it. A, B, C: its three towers here (cells i0 - 1, i0, i0 + 1, each W wide); k 1 the near rank, 0 the middle one;
// line: live's line here (the bank between the heads stands on it); lineS: the line the heads and the lobes' frame stand on (each head on its own level); topE: live's line at azimuth 112.5 itself;
// bil: live's billow; shade: the body's own tone in shade at this place
void rank(vec3 A, vec3 B, vec3 C, float W, float i0, float k, vec2 P, float line, float lineS, float topE, float bil, float shade, float sideK, vec3 L, float endK, inout vec3 col, inout float a, inout float flk){
  vec3 wr = 1. - min(abs(vec3(P.x) - vec3(A.x, B.x, C.x))/(0.8*W), 1.);
  wr *= wr;
  float sw = wr.x + wr.y + wr.z;
  float wE = k*dot(wr, step(abs(vec3(i0 - 1., i0, i0 + 1.) - 4.), vec3(0.5)))/sw;      // the tallest tower's share of this place
  float rb = sideK*dot(wr, vec3(A.z, B.z, C.z))/sw + wE*0.065*(0.96076 - sideK);      // the towers' rises, blended where two towers meet
  float ref = line + wE*(topE - line), refS = lineS + wE*(topE - lineS);      // in the tallest tower's share both lines are live's line at that tower's OWN azimuth
  float head = max(refS + rb, 0.05);                                    // the heads' own level here: the frame's 0.6
  float cell = 0.0661*mix(0.8, 1., k);
  vec2 pS = vec2(P.x, P.y*0.6/head);
  vec4 bd = body(pS, A, B, C);
  // the bank between the heads: its top at 0.65 of live's line at the place, raised (never lowered) by live's own billow; it carries no lobes of its own
  float F = smax(0.39*(ref + rb)/head + 0.1*max(bil - 0.3, 0.) - pS.y, bd.x), Q = 1.;
  vec2 dQ = vec2(0.);
  vec2 q = LR1*(vec2(pS.x, pS.y - uTime*0.003)/cell) + vec2(k*19.3 + 3.7, k*7.1 + 1.3), g = floor(q);      // the lobes rise slowly through the heads
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) lobes(g + vec2(float(i), float(j)), q, pS, cell, A, B, C, L, F, Q, dQ);
  F = min(F, (max(ref, refS) + 0.135 - P.y)*0.6/head);                   // no lobe stands more than 0.135 of h over the line it stands on
  float ta = smoothstep(0., 0.0077 + 0.0096*bil, F)*endK;                 // the outline dissolves over 40 to 90 m
  // the big form first: one light over the whole tower, from its sunward side to its far side and from head to base
  float rel = clamp(P.y/max(ref + rb, 0.05), 0., 1.2);                    // the height as a share of the rank's line AT THE PLACE (it runs smoothly along the arc: no tone steps from one head's level to the next)
  float nx = bd.y*0.75*smoothstep(0.3, 0.45, pS.y), ny = 0.55*bd.w;        // (under the saddles' floor the rank is one bank: no head has a side of its own there)
  float big = smoothstep(-0.3, 0.8, nx*L.x + ny*L.y + sqrt(max(0., 1. - nx*nx - ny*ny))*L.z);
  float low = smoothstep(0.38, 0.74, rel), hd = smoothstep(0.45, 1., rel);
  // the lobes only modulate it: v runs from 0 (a lobe's side turned full from the sun) to 1 (turned full to it) and moves a third of the tower's light at most; a hollow gets no darkening of its own
  vec2 G = -0.2*dQ;
  float v = 0.5 + 0.5*(L.z - dot(G, L.xy))/sqrt(1. + dot(G, G));
  float amt = shade + (1. - shade)*low*big*(1. - (1. - v)/3.);
  vec3 tc = mix(uShade, uLit, amt) + uRim*amt*hd*mix(0.21, 0.33, k);      // the wall is indigo: the forms are carried between uShade and uLit; the heads' pale share is a fifth of what it was
  tc = mix(tc, mix(uBase, uLit, 0.3), 0.3*(1. - k));                     // the middle rank stands in haze, a step lighter than the near one
  tc += uRim*0.5*(1. - smoothstep(0., 0.025, F))*(1. - a);                // a pale rim where the edge meets open sky
  float fk = (0.45 + 0.85*bd.z)*(0.8 + 0.2*Q);                           // a flicker glows from the head's heart; the lobes only dim it a little where they are thick
  float an = ta + a*(1. - ta), wgt = ta/max(an, 1e-4);
  col = mix(col, tc, wgt); flk = mix(flk, fk, wgt); a = an;
}
void main(){
  float x = vUv.x*13., h = vUv.y;
  float side = sin(vUv.x*3.14159);                                  // 1 due east, 0 at the ends of the arc
  float sideK = 0.25 + 0.75*side, endK = smoothstep(0., 0.16, side);
  vec2 P = vec2(vUv.x*3.8, h);
  // the near rank's three towers here (13 cells, one centred on azimuth 112.5) and the place Xs their heads stand on: all but level across a head, sliding from one centre to the next in the gap
  float iN = floor((P.x - 0.19162)/0.29231), Xs = P.x;
  vec3 An = vec3(0.), Bn = vec3(0.), Cn = vec3(0.);
  if (h >= 0.1019) {
    // (under the foot no tower is asked for: the rain needs live's line alone, and pays live's own 20 hashes for it)
    An = towerOf(iN - 1., 0.29231, 0.19162, 1.); Bn = towerOf(iN, 0.29231, 0.19162, 1.); Cn = towerOf(iN + 1., 0.29231, 0.19162, 1.);
    vec3 ws = 1. - min(abs(vec3(P.x) - vec3(An.x, Bn.x, Cn.x))/0.23385, 1.);
    ws *= ws; ws *= ws;
    Xs = dot(ws, vec3(An.x, Bn.x, Cn.x))/max(ws.x + ws.y + ws.z, 1e-6);
  }
  // live's top line, kept: the same sum as fbm4's, its two widest octaves read at the place and (sharing the hashes) at Xs
  vec2 pt = vec2(x*0.62 + 3.1, uTime*0.0035);
  float xq = Xs*2.12105 + 3.1;                                       // (13/3.8*0.62 = 2.12105: Xs in the line's own noise measure)
  vec2 o1 = vnx(pt, xq), o2 = vnx(pt*2.03 + 11.7, xq*2.03 + 11.7);
  float o3 = vn(pt*4.1 + 5.3)*0.125, o4 = vn(pt*8.3 + 2.1)*0.0625, wv = 0.1*vn(vec2(x*2.3, uTime*0.008));
  float top = (0.34 + 0.5*(o1.x*0.5 + o2.x*0.25 + o3 + o4) + wv) * sideK;
  float topS = (0.34 + 0.5*(o1.y*0.5 + o2.y*0.25 + o3 + o4) + wv) * (0.25 + 0.75*sin(Xs*0.826734));      // the near rank's line: every head on its own level
  float dxa = 1.507 - P.x, topE = top;                              // 1.507: azimuth 112.5, the tallest tower's own place
  if (h >= 0.1019 && dxa > -0.24 && dxa < 0.52) topE = (0.34 + 0.5*fbm4(vec2(6.2965, uTime*0.0035)) + 0.1*vn(vec2(11.858, uTime*0.008))) * 0.96076;       // live's line at azimuth 112.5 itself, where that tower or its anvil can reach
  if (h > max(top, max(topS, topE)) + 0.15) discard;
  float az = radians(198.85 - vUv.x*217.724);
  vec3 col; float a, flk;
  if (h >= 0.1019) {
    vec2 bb = fbm4p(vec2(x*2.6, h*9. - uTime*0.012), vec2(x*2.6 - 0.07, h*9. - uTime*0.012 + 0.03));
    float bil = bb.x, bil2 = bb.y;                                     // live's billow, and the same billows a step toward the sun, as live's
    float edge = top - h + (bil - 0.5)*0.2;
    a = smoothstep(0., 0.035, edge) * endK;                      // live's alpha: the far rank, never less
    float dl = radians(285.) - az;
    vec3 L = vec3(-sin(dl)*0.951, 0.309, -cos(dl)*0.951);              // toward the sun, in the wall's own frame (along X, up, toward the eye)
    float rel = clamp(h/max(top, 0.05), 0., 1.);
    float relief = clamp((bil - bil2)*4. + 0.5, 0., 1.);               // live's own soft relief
    // the far rank is live's band in live's own tones, in haze: what stands behind is lighter and flatter, never darker than the near rank's shade
    col = mix(uShade, uLit, (relief*0.45 + smoothstep(0.25, 1., rel)*0.55)*(0.55 + 0.45*bil));
    col = mix(col, mix(uBase, uLit, 0.3), 0.6);
    col += uRim * (1. - smoothstep(0., 0.05, edge)) * 0.5;             // its pale rim against the open sky, as live's
    flk = 0.5 + 0.9*bil;
    // the towers' bodies in shade keep live's billow, darker toward the foot: never one flat colour
    float shade = 0.45*relief*(0.55 + 0.45*bil)*mix(0.35, 1., smoothstep(0.1019, 0.4, h));
    float iM = floor((P.x + 0.17273)/0.34545);
    rank(towerOf(iM - 1., 0.34545, -0.17273, 0.), towerOf(iM, 0.34545, -0.17273, 0.), towerOf(iM + 1., 0.34545, -0.17273, 0.), 0.34545, iM, 0., P, top, top, topE, bil, shade, sideK, L, endK, col, a, flk);   // the middle rank: 11 cells, half a cell out of step, on live's line
    rank(An, Bn, Cn, 0.29231, iN, 1., P, top, topS, topE, bil, shade, sideK, L, endK, col, a, flk);    // the near rank, on its own line
    // the anvil of the tallest tower: flat at that tower's own head along its whole length, streaming toward the south (X falls southward), its underside soft and fibrous
    if (dxa > -0.08 && dxa < 0.52) {
      float flatT = topE + 0.06;
      float al = (dxa + 0.08)/0.6;
      float thick = mix(0.10, 0.02, smoothstep(0.13, 1., al));
      float fb = 0.6*vn(vec2((P.x + uTime*0.004)*22., h*70.)) + 0.4*vn(vec2((P.x + uTime*0.004)*55., h*160. + 3.));
      float und = flatT - thick*(0.55 + 0.9*fb);
      float aA = smoothstep(0., 0.012, flatT - h)*smoothstep(0., thick*0.8 + 0.004, h - und)*smoothstep(0., 0.13, al)*(1. - smoothstep(0.8, 1., al))*endK;
      float vA = clamp((h - und)/max(flatT - und, 0.01), 0., 1.);
      vec3 cA = mix(mix(uShade, uBase, 0.3), uLit, smoothstep(0.2, 0.9, vA)*(0.7 + 0.3*fb)) + uRim*0.33*smoothstep(0.6, 1., vA);
      float an = a + aA*(1. - a), wgt = aA*(1. - a)/max(an, 1e-4);         // it stands BEHIND every head and bank: it shows only where the sky was open, and lays no slab over any head
      col = mix(col, cA, wgt); flk = mix(flk, 0.7, wgt); a = an;
    }
    // the foot stands at the shelf's own height: the cloud darkens into it
    col = mix(uBase, col, smoothstep(0.1019, 0.1619, h));
    col = mix(col, uShade*0.9, (1. - smoothstep(0.1019, 0.1369, h))*0.85);
  } else {
    // under the foot the rain: veils leaning west, the far horizon's paler light in the gaps; nothing under the ground line
    float fall = (0.1019 - h)/0.0731;
    float Xv = P.x + 0.0365*cos(az)*fall + uTime*0.0004;
    float dens = max(smoothstep(0.36, 0.62, vn(vec2(Xv*4.2105, uTime*0.05))), 0.8*smoothstep(0.45, 0.75, vn(vec2(Xv*10., 9.1 - uTime*0.05))));     // broad veils (16 cells) and narrow ones between them (38 cells)
    dens *= (0.8 + 0.2*vn(vec2(Xv*31., 3.7 + uTime*0.08)))*(0.35 + 0.65*smoothstep(0.3, 0.75, top));
    float veil = dens*(1. - 0.35*clamp(fall, 0., 1.))*smoothstep(0.0288, 0.0348, h);
    vec3 gap = mix(uBase, uLit, 0.3*smoothstep(0.0248, 0.0328, h));
    col = mix(mix(gap, mix(uShade, uBase, 0.2), veil*0.92), uShade*0.9, smoothstep(0.0959, 0.1019, h)*0.85);
    a = endK; flk = 0.6;
  }
  if (a < 0.004) discard;
  for (int i = 0; i < 2; i++) {
    vec2 fp = i == 0 ? vec2(0.42, 0.3) : vec2(0.61, 0.24);
    float f = i == 0 ? uFlash.x : uFlash.y;
    vec2 d = (vUv - fp)*vec2(5.5, 2.4);
    col += vec3(0.55, 0.62, 1.15) * f * exp(-dot(d, d)*7.) * flk;
  }
  gl_FragColor = vec4(col, a);
}`;

// rain shafts hanging under the shelf (far)
const SHAFT_VERT = /* glsl */`
attribute vec3 aInfo;
varying vec2 vUv; varying vec3 vInfo; varying vec3 vW;
void main(){ vUv = uv; vInfo = aInfo; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const SHAFT_FRAG = /* glsl */`
uniform float uTime, uEdge;
uniform vec3 uCol;
varying vec2 vUv; varying vec3 vInfo; varying vec3 vW;
${NOISE}
void main(){
  float s = vUv.x*vInfo.x;
  float st = vn(vec2(s*9., vUv.y*1.3 - uTime*0.05 + vInfo.y))*0.6 + vn(vec2(s*31., vUv.y*2.1 - uTime*0.11))*0.4;
  float a = smoothstep(0.25, 0.8, st) * smoothstep(0., 0.2, vUv.x) * smoothstep(1., 0.8, vUv.x);
  a *= smoothstep(0.0, 0.5, vUv.y) * smoothstep(1., 0.9, vUv.y);
  a *= smoothstep(uEdge + 60., uEdge + 520., vW.x + (1. - vUv.y)*140.);
  gl_FragColor = vec4(uCol * a * 0.36, a * 0.36);
}`;

// cloth: washing on lines, flags, ropes. aPin = (free weight 0..1, phase, kind: 0 cloth, 1 rope, 2 the sheet that flies off)
const CLOTH_VERT = /* glsl */`
attribute vec3 aPin; attribute vec3 aSide;
uniform float uTime, uGust, uU;
uniform vec2 uWind;
varying vec3 vC; varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; vC = color;
  float w = aPin.x, ph = aPin.y, g = uGust;
  vec3 wd = vec3(uWind.x, 0., uWind.y);
  if (aPin.z > 0.5 && aPin.z < 1.5) {
    float dist = length(cameraPosition - p);
    p += aSide * max(1., dist*0.07);
    p.y += sin(uTime*3.1 + ph)*0.03*w;
  } else {
    float flap = sin(uTime*(4.5 + g*3.) + ph + p.y*2.3 + dot(p.xz, uWind)*1.9);
    float flap2 = sin(uTime*(7.3 + g*4.) + ph*1.7 + p.y*4.1 + p.x*1.3);
    p += wd * w * (0.2 + 0.75*g) * (0.62 + 0.38*flap);
    p.y += w * (0.1 + 0.42*g) * (0.5 + 0.5*flap2) * 0.7;
    p += vec3(-uWind.y, 0., uWind.x) * w * 0.14 * flap2;
    if (aPin.z > 1.5) {
      float t = clamp((uU - 0.085)/0.14, 0., 1.);
      float e = t*t*(3. - 2.*t);
      p += wd*(e*120.) + vec3(0., sin(t*3.1416)*13. + e*7. + sin(uTime*2.3)*1.2*e, sin(uTime*1.7)*5.*e);
      p.y += (w - 0.5)*sin(uTime*5. + t*20.)*1.4*e;
      p = mix(p, p + wd*4., step(0.985, t));
    }
  }
  vW = p;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CLOTH_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uAmb;
varying vec3 vC; varying vec3 vW;
#include <fog_pars_fragment>
void main(){
  vec3 cr = cross(dFdx(vW), dFdy(vW));
  vec3 N = cr / max(length(cr), 1e-9);
  float nl = abs(dot(N, uSunDir));
  vec3 col = vC * (uAmb*(0.75 + 0.25*abs(N.y)) + uSunCol*(0.3 + 0.7*nl));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// soft lit puffs: the gust front's wall of dust (instanced billboards riding uFront)
const PUFF_VERT = /* glsl */`
attribute vec3 aPos; attribute vec3 aS;
uniform float uTime, uFront;
uniform vec2 uWrap;
varying vec2 vUv; varying vec3 vS; varying float vFade;
#include <fog_pars_vertex>
void main(){
  vUv = uv; vS = aS;
  float span = max(uWrap.y, 1.), wrapOn = step(0.5, uWrap.y);
  float trav = mod(uTime*uWrap.x*(0.7 + 0.6*aS.z) + aS.y*span*7., span) * wrapOn;
  vec3 c = aPos + vec3(uFront - trav + sin(uTime*0.7 + aS.y*20.)*2.5, sin(uTime*0.9 + aS.y*33.)*0.6, 0.);
  float ends = mix(1., smoothstep(0., 0.15, trav/span) * (1. - smoothstep(0.8, 1., trav/span)), wrapOn);
  vec4 mvPosition = viewMatrix*vec4(c, 1.);
  float dist = -mvPosition.z;
  vFade = smoothstep(5., 24., dist) * ends;
  float rot = aS.y*6.283 + uTime*0.25*(aS.z - 0.5);
  vec2 o = (uv - 0.5)*aS.x; o = vec2(o.x*cos(rot) - o.y*sin(rot), o.x*sin(rot) + o.y*cos(rot));
  mvPosition.xy += o*vec2(1.25, 0.8);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */`
uniform float uTime, uOpacity;
uniform vec3 uCol, uColLit;
varying vec2 vUv; varying vec3 vS; varying float vFade;
#include <fog_pars_fragment>
${NOISE}
void main(){
  vec2 q = vUv - 0.5; float r = length(q)*2.;
  float n = vn(vUv*3.2 + vS.y*17. + uTime*0.12)*0.6 + vn(vUv*7.5 - vS.y*9. - uTime*0.2)*0.4;
  float a = smoothstep(1., 0.25, r + (n - 0.5)*0.75) * uOpacity * vFade * (0.5 + 0.5*vS.z);
  vec3 col = mix(uCol, uColLit, smoothstep(0.35, 0.8, n + q.y*0.6));
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

// lit rain: tall ribbons of streaks standing in the well, gold where the sun reaches them, slate in the rim's shadow
const STREAK_VERT = /* glsl */`
attribute vec2 aSeed;
varying vec2 vUv; varying vec3 vW; varying vec2 vSeed;
#include <fog_pars_vertex>
void main(){
  vUv = uv; vSeed = aSeed; vW = position;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const STREAK_FRAG = /* glsl */`
uniform float uTime, uRain;
uniform vec3 uSunDir, uGold, uShade, uCam;
varying vec2 vUv; varying vec3 vW; varying vec2 vSeed;
#include <fog_pars_fragment>
${NOISE}
float sunVis(vec3 p){
  vec3 L = uSunDir;
  float tx = L.x < 0. ? (-65. - p.x)/min(L.x, -1e-3) : (65. - p.x)/max(L.x, 1e-3);
  float tz = L.z < 0. ? (-65. - p.z)/min(L.z, -1e-3) : (38. - p.z)/max(L.z, 1e-3);
  float t = max(min(tx, tz), 0.);
  float ye = p.y + t*L.y;
  return smoothstep(-1.5, 1.5, ye);
}
void main(){
  float s = vUv.x*vSeed.x;
  float y = vUv.y*9. + uTime*2.4;
  float a = smoothstep(0.6, 0.95, vn(vec2(s*5.5, y*0.35 + vSeed.y*31.)));
  float fine = vn(vec2(s*90., y*2.2 + vSeed.y*7.)); fine *= fine;
  float f2 = vn(vec2(s*260., y*5.)); f2 = smoothstep(0.7, 1., f2);
  float alpha = (a*0.4 + 0.3) * (fine*0.55 + f2*0.6);
  alpha *= smoothstep(0., 0.12, vUv.x) * smoothstep(1., 0.88, vUv.x) * smoothstep(0., 0.1, vUv.y) * smoothstep(1., 0.75, vUv.y);
  float dist = length(uCam - vW);
  alpha *= smoothstep(9., 34., dist) * uRain;
  float vis = vW.y > 0. ? 1. : sunVis(vW);
  vec3 col = mix(uShade, uGold, vis) * alpha * 0.22;
  float fogF = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor = vec4(col*(1. - fogF*0.7), 0.);
}`;

// frogs: pale specks hopping on the low wet tiers and floating at the pool's edge as it rises
const FROG_VERT = /* glsl */`
attribute vec3 aBase; attribute vec3 aSeed;
uniform float uTime, uPoolY, uShow;
varying vec3 vN; varying vec3 vC;
#include <fog_pars_vertex>
void main(){
  float t = uTime*(0.5 + aSeed.x*0.5) + aSeed.y*17.;
  float cyc = floor(t), ph = fract(t);
  float hop = clamp((ph - 0.62)/0.38, 0., 1.);
  float dir = aSeed.z*6.283;
  float sgn = mod(cyc, 2.) < 0.5 ? 1. : -1.;
  float along = (sgn > 0. ? hop : 1. - hop) * 0.7 - 0.35;
  float yaw = dir + (sgn > 0. ? 0. : 3.1416);
  float cy = cos(yaw), sy = sin(yaw);
  vec3 lp = position * uShow * (0.75 + 0.5*aSeed.x);
  lp.y *= 1. + 0.5*sin(hop*3.1416);
  vec3 p = vec3(lp.x*cy + lp.z*sy, lp.y, -lp.x*sy + lp.z*cy);
  float afloat = step(aBase.y, uPoolY);
  vec3 base = aBase; base.y = max(aBase.y, uPoolY - 0.04);
  p += base + vec3(cos(dir), 0., -sin(dir))*along*(1. - 0.6*afloat) + vec3(0., sin(hop*3.1416)*0.42*(1. - 0.8*afloat), 0.);
  vN = normalize(vec3(normal.x*cy + normal.z*sy, normal.y, -normal.x*sy + normal.z*cy) + vec3(0., 1e-4, 0.));
  vC = mix(vec3(0.62, 0.66, 0.36), vec3(0.78, 0.74, 0.5), aSeed.y);
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FROG_FRAG = /* glsl */`
uniform vec3 uAmb, uSunCol, uSunDir;
varying vec3 vN; varying vec3 vC;
#include <fog_pars_fragment>
void main(){
  vec3 col = vC * (uAmb*(0.7 + 0.5*vN.y) + uSunCol*max(dot(vN, uSunDir), 0.)*0.5);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// creatures and loose props (peacocks, parasol, door): vertex colour, flat normals, lit from both sides so nothing goes black in shade
const CRIT_VERT = /* glsl */`
varying vec3 vC; varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vC = color; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CRIT_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uAmb;
varying vec3 vC; varying vec3 vW;
#include <fog_pars_fragment>
void main(){
  vec3 cr = cross(dFdx(vW), dFdy(vW));
  vec3 N = cr / max(length(cr), 1e-9);
  float nl = abs(dot(N, uSunDir));
  vec3 col = vC * (uAmb*(1.0 + 0.3*abs(N.y)) + uSunCol*(0.22 + 0.5*nl));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// the pool of light an oil lamp lays on the ground at dusk (additive discs, one mesh)
const LAMPPOOL_VERT = /* glsl */`
attribute float aPh;
varying vec2 vUv; varying float vPh;
#include <fog_pars_vertex>
void main(){
  vUv = uv; vPh = aPh;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LAMPPOOL_FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uCol;
varying vec2 vUv; varying float vPh;
#include <fog_pars_fragment>
void main(){
  float r = length(vUv - 0.5)*2.;
  float a = 1. - smoothstep(0., 1., r); a = a*a*(0.6 + 0.4*a);
  float fl = 0.86 + 0.14*sin(uTime*9. + vPh)*sin(uTime*13.7 + vPh*1.7);
  float fogF = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor = vec4(uCol*a*fl*(1. - fogF), 1.);
}`;

// ---------- layout helpers ----------
const LANE = [[-560, 44], [-330, 34], [-200, 27], [-128, 26], [-94, 19], [-74, 8]];
function laneDist(x, z) {
  let best = 1e9;
  for (let i = 0; i < LANE.length - 1; i++) {
    const ax = LANE[i][0], az = LANE[i][1], bx = LANE[i + 1][0] - ax, bz = LANE[i + 1][1] - az;
    const t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz), 0, 1), dx = x - ax - bx * t, dz = z - az - bz * t;
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}
// true where (x, z) is surely more than r from the lane (outside its box, x -560..-74 and z 8..44, grown by r and a metre): the grass
// densities ask this first, so the distance itself is only worked out near the lane; the answer is the same
const offLane = (x, z, r) => x > -73 + r || z < 7 - r || z > 45 + r;
const laneZ = (x) => (x < -128 ? 26 : x < -94 ? lerp(26, 19, (x + 128) / 34) : lerp(19, 8, clamp((x + 94) / 20, 0, 1)));
// the first frame's sight lines from the entry point to the rim gallery, its fallen bay and the pavilion kiosks: nothing tall stands here
const inWedge = (x, z, pad = 0) => { const k = (x + 170) / 102; return x > -152 && z > 26 - 44 * k - pad && z < 26 + 15 * k + pad; };
const wellD = (x, z) => Math.max(Math.abs(x), Math.abs(z + 2) - 2);
const inPit = (x, z) => Math.abs(x) < 66.6 && z > -66.6 && z < 39.5;
// 1 inside the village yard (packed earth), 0 in the fields
const yardMask = (x, z) => smoothstep(-137, -129, x) * (1 - smoothstep(-80, -70, x)) * smoothstep(-36, -26, z) * (1 - smoothstep(68, 80, z));
// strip fields: returns [crop 0..1, strip id]
const FA = 0.21, FC = Math.cos(FA), FS = Math.sin(FA);
function fieldAt(x, z, out) {
  const sx = x * FC + z * FS, sz = -x * FS + z * FC;
  const id = Math.floor(sz / 17), f = sz / 17 - id;
  const cross = sx / 96 + hash1(id * 3.1) * 5, cf = cross - Math.floor(cross);
  const bund = Math.min(f, 1 - f) * 17 < 0.9 || Math.min(cf, 1 - cf) * 96 < 0.9;
  const pid = id * 7.3 + Math.floor(cross) * 1.7, fallow = hash1(pid + 0.5) < 0.06;
  out[0] = bund ? 0 : fallow ? 0.12 : 1; out[1] = hash1(pid); out[2] = bund ? 1 : 0;
  return out;
}

// washing lines, flags and ropes for the cloth shader
function makeClothBuilder() {
  const pos = [], col = [], pin = [], side = [], idx = [];
  const add = (p, c, w, ph, kind, sd) => { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); pin.push(w, ph, kind); side.push(sd[0], sd[1], sd[2]); return pos.length / 3 - 1; };
  const Z3 = [0, 0, 0];
  const api = {
    // a rectangle hanging from its top edge a -> b (world points), dropping `drop` metres
    sheet(a, b, drop, colour, ph, kind = 0, nx = 3, ny = 4, taper = 0) {
      const c = H(colour), base = pos.length / 3;
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const u = i / nx, v = j / ny, uu = 0.5 + (u - 0.5) * (1 - taper * v);
        const k = 0.86 + 0.14 * Math.sin(u * 9 + ph) * (1 - v * 0.3);
        add([lerp(a[0], b[0], uu), lerp(a[1], b[1], uu) - drop * v, lerp(a[2], b[2], uu)], { r: c.r * k, g: c.g * k, b: c.b * k }, Math.pow(v, 1.25), ph + u * 0.9, kind, Z3);
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const q = base + j * (nx + 1) + i; idx.push(q, q + 1, q + nx + 2, q, q + nx + 2, q + nx + 1); }
    },
    // a rope as two crossed ribbons that widen with distance so they never alias
    rope(a, b, sag, colour, ph, segs = 8) {
      const c = H(colour), dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, hw = 0.022;
      for (const sd of [[0, hw, 0], [-dz / l * hw, 0, dx / l * hw]]) {
        const base = pos.length / 3;
        for (let i = 0; i <= segs; i++) {
          const t = i / segs, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)], w = 4 * t * (1 - t);
          add(p, c, w, ph, 1, sd); add(p, c, w, ph, 1, [-sd[0], -sd[1], -sd[2]]);
        }
        for (let i = 0; i < segs; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      }
    },
    // a line strung a -> b with washing on it
    washing(rng, a, b, count, colours, flyer = false) {
      const L = Math.hypot(b[0] - a[0], b[2] - a[2]), sag = 0.12 + L * 0.012;
      api.rope(a, b, sag, '#2a2622', rng() * 6);
      let t = 0.08;
      for (let i = 0; i < count && t < 0.9; i++) {
        const w = rng.range(0.7, 1.7) / L, drop = rng.range(0.7, 1.5), t1 = Math.min(0.94, t + w);
        const P = (tt) => [lerp(a[0], b[0], tt), lerp(a[1], b[1], tt) - sag * 4 * tt * (1 - tt) - 0.02, lerp(a[2], b[2], tt)];
        api.sheet(P(t), P(t1), drop, rng.pick(colours), rng() * 6, flyer && i === 1 ? 2 : 0, 3, 4);
        t = t1 + rng.range(0.02, 0.08);
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('aPin', new THREE.Float32BufferAttribute(pin, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 3));
      g.setIndex(idx);
      return g;
    },
  };
  return api;
}
const WASH = ['#f2ede0', '#e8e2d4', '#c8281e', '#e87a1c', '#2c4a9a', '#d8508a', '#2f8a5a', '#e8c020', '#f4f0e8', '#7a2c8a'];

// the village's small things, built into one kit Builder: surrounds, parapets, pots, charpoys, dung stacks, yard walls, poles
function houseProps(b, rng, h, L) {
  const { w, d, top } = h, front = d / 2, doorX = -w / 2 + w * 0.3;
  b.tr(h.x, 0, h.z, h.rot);
  // white-limed door surround and a limed band at the foot of the front wall
  b.col(L.lime, 0.85, 1).surf(S.SURF.PLAIN);
  b.box(doorX - 0.78, 0, front - 0.02, doorX - 0.56, 2.3, front + 0.1); b.box(doorX + 0.56, 0, front - 0.02, doorX + 0.78, 2.3, front + 0.1);
  b.box(doorX - 0.86, 2.2, front - 0.02, doorX + 0.86, 2.5, front + 0.13);
  b.box(-w / 2 + 0.2, 0, front + 0.01, w / 2 - 0.2, 0.42, front + 0.07);
  // a damp-dark foot all round, a limed band under the roof line, painted shutters at the front windows
  b.col([h.wall[0]*0.44, h.wall[1]*0.4, h.wall[2]*0.4], 0.7, 1.15);
  b.box(-w / 2 - 0.04, 0, -d / 2 - 0.04, w / 2 + 0.04, 0.5, -d / 2 + 0.02); b.box(-w / 2 - 0.04, 0, -d / 2, -w / 2 + 0.02, 0.5, front); b.box(w / 2 - 0.02, 0, -d / 2, w / 2 + 0.04, 0.5, front);
  // rising damp above the foot and rain streaks under the roof line: weathered mud, not flat paint. The kit's walls lean in 5 % and
  // run 0.8 -> 1 in tone from foot to top, so each patch follows the batter and meets the wall's own tone at its free edge
  { const sr = rng.fork('stain' + Math.round(h.x * 7 + h.z * 13)), HT = 3.91, bat = (y) => 1 - 0.05 * (y + 0.01) / HT, wg = (y) => 0.8 + 0.2 * (y + 0.01) / HT;
    const face = (f, q, y) => { const k = bat(y), e = 0.035; return f === 0 ? [q * k, y, d / 2 * k + e] : f === 1 ? [w / 2 * k + e, y, -q * k] : f === 2 ? [-q * k, y, -d / 2 * k - e] : [-w / 2 * k - e, y, q * k]; };
    const patch = (f, q0, q1, y0, y1, g0, g1) => b.quad(face(f, q0, y0), face(f, q1, y0), face(f, q1, y1), face(f, q0, y1), undefined,
      [h.wall[0] * g0, h.wall[1] * g0 * 0.96, h.wall[2] * g0 * 0.95], [h.wall[0] * g1, h.wall[1] * g1 * 0.98, h.wall[2] * g1 * 0.97]);
    b.surf(S.SURF.PLAIN);
    for (let f = 0; f < 4; f++) {
      const half = (f % 2 ? d : w) / 2 - 0.06, low = f < 2;                  // faces 0 and 1 carry the kit's windows: keep under their sills
      for (const [r0, r1] of (f === 0 ? [[-half, doorX - 0.85], [doorX + 0.85, half]] : [[-half, half]])) {
        let q = r0;
        while (q < r1 - 0.4) { const q1 = Math.min(r1, q + sr.range(1.5, 3.2)), y1 = low ? sr.range(0.85, 1.25) : sr.range(1.0, 2.0); patch(f, q, q1, 0.4, y1, 0.5, wg(y1)); q = q1; }
      }
      if (!low) { const n = Math.max(2, Math.round(half / 1.4));
        for (let i = 0; i < n; i++) { const c = lerp(-half + 0.5, half - 0.5, (i + sr.range(0.2, 0.8)) / n), hw = sr.range(0.2, 0.5), y0 = sr.range(1.5, 2.6); patch(f, c - hw, c + hw, y0, 3.32, wg(y0), 0.6); } }
    } }
  b.col(L.lime, 0.8, 1);
  { const k = 0.975, yb = 2.72; b.box(-w / 2 * k - 0.02, yb, front * k - 0.02, w / 2 * k + 0.02, yb + 0.16, front * k + 0.05); b.box(-w / 2 * k - 0.05, yb, -front * k, -w / 2 * k + 0.02, yb + 0.16, front * k); b.box(w / 2 * k - 0.02, yb, -front * k, w / 2 * k + 0.05, yb + 0.16, front * k);
    for (let x = -w / 2 + 0.6; x < w / 2 - 0.4; x += 0.62) b.box(x - 0.09, yb - 0.3, front * k - 0.02, x + 0.09, yb - 0.12, front * k + 0.045); }
  { const nwin = Math.max(1, Math.round(w / 4)), sc = rng.pick(L.shutters); b.col(sc, 0.8, 1.05);
    for (let i = 0; i < nwin; i++) { const x = lerp(-w / 2, w / 2, (i + 0.5) / nwin) + (nwin === 1 ? w * 0.25 : 0);
      b.box(x - 0.82, 1.24, front - 0.03, x - 0.46, 2.26, front + 0.06); b.box(x + 0.46, 1.24, front - 0.03, x + 0.82, 2.26, front + 0.06); } }
  // a straw lean-to on poles at the front of some houses
  if (rng.chance(0.55)) {
    const cx = w / 2 - 2.3 - rng.range(0, 1), hw2 = 1.9, zo = front + 2.9;
    b.col(L.wood, 0.85, 1); for (const sx of [-hw2, hw2]) b.beam([cx + sx, 0, zo], [cx + sx, 2.2, zo], 0.1, 0.1);
    b.beam([cx - hw2 - 0.2, 2.2, zo], [cx + hw2 + 0.2, 2.2, zo], 0.09, 0.09);
    for (let i = 0; i < 7; i++) { const x0 = cx - hw2 - 0.25 + i * ((hw2 * 2 + 0.5) / 7), x1 = x0 + (hw2 * 2 + 0.5) / 7 - 0.03; b.col(i % 2 ? L.straw : L.straw2, 0.85, 1.05);
      b.quad([x0, 2.78, front + 0.05], [x0, 2.2 + 0.06, zo + 0.35], [x1, 2.2 + 0.06, zo + 0.35], [x1, 2.78, front + 0.05]); b.quad([x0, 2.76, front + 0.05], [x1, 2.76, front + 0.05], [x1, 2.2 + 0.04, zo + 0.35], [x0, 2.2 + 0.04, zo + 0.35]); }
    b.col(L.sack, 0.8, 1.05); b.box(cx - 1.2, 0.32, front + 1.7, cx - 0.2, 0.85, front + 2.5); b.col(L.steel, 0.8, 1.1); b.cyl(cx + 0.9, 0.32, front + 2.1, 0.3, 0.34, 0.55, 9);
  }
  // a mud step (otla) along the front, with pots and a charpoy
  b.col(L.mud, 0.8, 1).surf(S.SURF.PLAIN); b.box(-w / 2, 0, front, w / 2, 0.32, front + 1.5);
  const pots = rng.int(2, 5);
  for (let i = 0; i < pots; i++) {
    const px = doorX + 1.5 + i * 0.62 + rng.range(-0.1, 0.1), pz = front + 0.55 + rng.range(-0.2, 0.3), s = rng.range(0.75, 1.2);
    b.col(rng.chance(0.7) ? L.terra : L.terraDark, 0.7, 1.1);
    b.lathe(px, 0.32, pz, [[0.12 * s, 0], [0.3 * s, 0.22 * s], [0.3 * s, 0.4 * s], [0.14 * s, 0.56 * s], [0.18 * s, 0.64 * s], [0, 0.64 * s]], 8, { smooth: true });
    if (rng.chance(0.3)) b.lathe(px, 0.32 + 0.64 * s, pz, [[0.1 * s, 0], [0.22 * s, 0.16 * s], [0.2 * s, 0.3 * s], [0.1 * s, 0.4 * s], [0, 0.4 * s]], 8, { smooth: true });
  }
  const charpoy = (cx, cy, cz, ry) => {
    b.tr(cx, cy, cz, ry); b.col(L.wood, 0.9, 1);
    for (const sx of [-0.9, 0.9]) for (const sz of [-0.42, 0.42]) b.beam([sx, 0, sz], [sx, 0.5, sz], 0.07, 0.07);
    b.beam([-0.9, 0.44, -0.42], [0.9, 0.44, -0.42], 0.06, 0.06); b.beam([-0.9, 0.44, 0.42], [0.9, 0.44, 0.42], 0.06, 0.06);
    b.col(L.rope, 0.9, 1); b.box(-0.9, 0.43, -0.42, 0.9, 0.47, 0.42);
    if (rng.chance(0.5)) { b.col(rng.pick(L.quilts), 0.9, 1); b.box(-0.8, 0.47, -0.36, rng.range(-0.1, 0.5), 0.55, 0.36); }
    b.pop();
  };
  if (rng.chance(0.75)) charpoy(-w / 2 + 1.5 + rng.range(0, 1), 0.32, front + 0.8, rng.range(-0.15, 0.15));
  // roof: parapet, then clutter (chillies drying, sacks, pots, a charpoy)
  b.col(h.wall, 0.85, 1).surf(S.SURF.PLAIN);
  const rw = w * 0.475 * (h.lv === 1 ? 1 : 0), rd = d * 0.475;
  if (h.lv === 1) {
    b.box(-rw, top, rd - 0.22, rw, top + 0.42, rd); b.box(-rw, top, -rd, rw, top + 0.42, -rd + 0.22);
    b.box(-rw, top, -rd, -rw + 0.22, top + 0.42, rd); b.box(rw - 0.22, top, -rd, rw, top + 0.42, rd);
    for (let i = 0; i < 4; i++) {                                         // patched mud plaster
      const cx = rng.range(-rw + 1.2, rw - 1.2), cz = rng.range(-rd + 1, rd - 1), k = rng.range(0.78, 1.16);
      b.col([h.wall[0] * k * 0.8, h.wall[1] * k * 0.78, h.wall[2] * k * 0.76], 0.95, 1.05); b.box(cx - rng.range(0.6, 1.6), top, cz - rng.range(0.5, 1.2), cx + rng.range(0.6, 1.6), top + 0.025, cz + rng.range(0.5, 1.2), { sides: false });
    }
    if (rng.chance(0.65)) {                                             // dung cakes drying in rows
      const cx = rng.range(-rw + 1.6, rw - 2.4), cz = rng.range(-rd + 1.2, rd - 1.6), nx = rng.int(3, 6), nz = rng.int(2, 4); b.col(L.dung, 0.9, 1.1);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) b.disc(cx + i * 0.46, top + 0.05, cz + j * 0.46, 0.18, 6, true);
    }
    if (rng.chance(0.4)) { b.col(L.steel, 0.75, 1.1); b.cyl(rng.range(-rw + 1, rw - 1), top, -rd + 0.8, 0.42, 0.42, 0.95, 9); }
    const n = rng.int(2, 4);
    for (let i = 0; i < n; i++) {
      const cx = rng.range(-rw + 1.3, rw - 1.3), cz = rng.range(-rd + 1.1, rd - 1.1), k = rng();
      if (k < 0.34) { b.col(rng.pick(L.dry), 0.95, 1.05); b.box(cx - rng.range(0.7, 1.4), top, cz - rng.range(0.5, 0.9), cx + 0.9, top + 0.05, cz + 0.7); }
      else if (k < 0.6) { b.col(L.sack, 0.75, 1.05); for (let j = 0; j < 3; j++) b.box(cx + j * 0.5 - 0.6, top, cz - 0.3, cx + j * 0.5 - 0.15, top + rng.range(0.5, 0.8), cz + 0.3); }
      else if (k < 0.8) charpoy(cx, top, cz, rng() * 3);
      else { b.col(L.terra, 0.7, 1.1); for (let j = 0; j < 3; j++) b.lathe(cx + j * 0.6 - 0.6, top, cz, [[0.12, 0], [0.27, 0.2], [0.27, 0.36], [0.13, 0.5], [0, 0.5]], 7, { smooth: true }); }
    }
  }
  // battered corner buttresses, rounded horns on the parapet corners, a mud stair up the side wall: soft hand-built outlines
  { const k2 = [h.wall[0] * 0.9, h.wall[1] * 0.88, h.wall[2] * 0.86];
    b.col(k2, 0.8, 1.02).surf(S.SURF.PLAIN);
    for (const sx of [-1, 1]) { b.frustum(sx * (w / 2 - 0.1), front - 0.1, 1.5, 1.5, 0.7, 0.7, 0, 2.5 + rng.range(0, 0.5), {}); if (rng.chance(0.5)) b.frustum(sx * (w / 2 - 0.1), -front + 0.1, 1.4, 1.4, 0.7, 0.7, 0, 2.2, {}); }
    b.col(h.wall, 0.9, 1.06);
    const ph = h.lv === 1 ? top + 0.42 : 3.9;                             // (the ground storey's roof, whatever stands on it)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.frustum(sx * (w * 0.475 - 0.16), sz * (d * 0.475 - 0.16), 0.66, 0.66, 0.3, 0.3, ph - 0.12, ph + 0.3 + rng.range(0, 0.08) * 2, {});
    if (h.lv === 1 && rng.chance(0.6)) {
      b.col(k2, 0.78, 1.04); const n = 10, rise = top / n, run = Math.min(0.5, (d - 1.2) / n), z0 = front - 0.4;
      for (let i = 0; i < n; i++) b.box(-w / 2 - 1.0, 0, z0 - (i + 1) * run, -w / 2 + 0.02, (i + 1) * rise, z0 - i * run, {});
      b.box(-w / 2 - 1.0, 0, -d / 2 + 0.1, -w / 2 + 0.02, top, z0 - n * run, {});
    } }
  // dung-cake stack and a yard wall on the far side
  if (rng.chance(0.6)) {
    const sx = w / 2 + 1.3, sz = rng.range(-d / 2 + 1, d / 2 - 1); b.col(L.dung, 0.7, 1.05);
    b.lathe(sx, 0, sz, [[0.95, 0], [0.9, 0.5], [0.7, 0.95], [0.38, 1.3], [0, 1.42]], 9, { smooth: true });
  }
  if (h.yard) {
    b.col(h.wall, 0.75, 0.98).surf(S.SURF.PLAIN);
    const yd = rng.range(4, 6.5), x0 = -w / 2 - 0.2, x1 = w / 2 + rng.range(1.5, 3.5), z0 = -d / 2 - yd, z1 = -d / 2;
    b.box(x0, 0, z0, x0 + 0.34, 1.35, z1); b.box(x1 - 0.34, 0, z0, x1, 1.35, z1 + 2); b.box(x0, 0, z0, x1 - 1.6, 1.35, z0 + 0.34);
    b.col(L.dung, 0.7, 1.05); if (rng.chance(0.7)) b.lathe(x0 + 1.3, 0, z0 + 1.4, [[0.9, 0], [0.85, 0.45], [0.6, 0.9], [0, 1.25]], 9, { smooth: true });
    b.col(L.sack, 0.8, 1.05); b.box(x1 - 2.2, 0, z1 - 1.4, x1 - 0.6, 0.6, z1 - 0.5);
  }
  b.pop();
}

export default {
  id: 'first-rain-stepwell',
  name: 'The Thousand-Stair Rain',
  category: 'city',
  media: ['air', 'open'],
  weirdness: 0.1,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('frs-d'), noise = ctx.noise;
    const detail = (ctx.quality && ctx.quality.detail) || 1, density = vary.density ?? 1, rare = !!vary.rare;
    const pickLook = vr.pick(['storm', 'storm', 'dusk', 'dust']), monsoon = vr.chance(0.3), festival = vr.chance(0.6);
    const lead = vr.chance(0.3) ? 'parakeets' : 'pigeons', stair = vr.chance(0.3) ? 'peacocks' : 'langurs';
    const hour = vary.hour || 'any';
    const lookId = hour === 'night' ? 'dusk' : hour === 'dawn' ? 'dust' : (hour === 'day' || hour === 'golden') ? 'storm' : pickLook;
    const look = LOOKS[lookId], dusk = lookId === 'dusk';
    const scene = new THREE.Scene();
    const TIME = { value: 0 };
    const white = new THREE.Color(1, 1, 1);

    // ----- path: the brief's 22 points (two nudged inward by the set-piece artist), exit in the pavilion's arch -----
    const path = makePath([[-170, 9, 26], [-128, 9, 26], [-94, 11, 19], [-63, 12, 4], [-30, 8, -22], [4, 3, -42], [36, -3, -43], [50, -8, -22], [48, -12, 4],
      [40, -16, 22], [18, -20, 28], [-10, -24, 28], [-29, -28, 17], [-34, -32, -2], [-33, -35, -18], [-27, -38, -29], [-16, -41, -31], [-5, -45, -28],
      [0, -47.6, -16], [0, -48, 4], [0, -48, 24], [0, -48, 46]]);

    // ----- sky, light, fog -----
    await ctx.yield();
    const sky = makeSky({ rng, ...look.sky, sunElevation: look.sunEl, sunAzimuth: look.sunAz, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    const fog0 = H(look.fog0), fog1 = H(look.fog1);
    scene.fog = new THREE.FogExp2(fog0.clone(), look.dens0);
    const rig = makeLightRig(sky, { bounce: 0.35 }); scene.add(rig.object);
    await ctx.yield();
    const hemi0 = rig.hemi.intensity;
    const sunDir = skyDirection(Math.max(look.sunEl, 13), look.sunAz);                 // toward the light, for everything self-lit
    const sunDir0 = sunDir.clone(), sunRare = skyDirection(63, 243), sunNow = sunDir.clone();
    const sunCol = H(look.heroSun[0]).lerp(white, 0.22), sunColRare = H('#fff0c4');
    const skyE = H(look.skyE[0]).multiplyScalar(look.skyE[1]), skyW = H(look.skyW[0]).multiplyScalar(look.skyW[1]);
    const fill = H(look.heroFill[0]).lerp(white, 0.18).multiplyScalar(look.heroFill[1]);
    // the dust look is washed clean by the rain: light, fill and sky cool to the storm look's as the air clears
    const CL = look.clean ? { sun: H(look.clean.sun).lerp(white, 0.22), fill: H(look.clean.fill[0]).lerp(white, 0.18).multiplyScalar(look.clean.fill[1]), skyE: H(look.clean.skyE[0]).multiplyScalar(look.clean.skyE[1]),
      light: H(look.clean.light), amb: H(look.clean.amb), light0: rig.sun.color.clone(), amb0: rig.hemi.color.clone() } : null;
    const sunCur = sunCol.clone(), fillCur = fill.clone(), skyECur = skyE.clone();
    // (and the sky itself: dome, shelf, cloud wall and rain shafts go from copper to the storm look's slate and indigo; filled in below)
    const wash = [];
    const washTo = (col, to) => { if (CL && col && col.isColor) wash.push([col, col.clone(), H(to)]); };

    // the cloud wall in the east: a backdrop of towers that follows the camera like the sky does
    const flashV = new THREE.Vector2(0, 0);
    const wallU = { uTime: TIME, uFlash: { value: flashV }, uLit: { value: H(look.wallLit) }, uShade: { value: H(look.wallShade) }, uBase: { value: look.wallBase ? H(look.wallBase) : H(look.wallShade).lerp(H(look.haze), 0.6) },
      uRim: { value: H(look.wallLit).multiplyScalar(0.5) } };
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(5200, 5200, 5200, 48, 1, true, Math.PI / 2 - 1.9, 3.8).translate(0, 2450, 0),
      new THREE.ShaderMaterial({ uniforms: wallU, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, transparent: true, depthWrite: false, side: THREE.BackSide }));
    wall.renderOrder = -0.9; wall.frustumCulled = false; scene.add(wall);

    // the shelf cloud sliding overhead
    const shelfU = { uTime: TIME, uEdge: { value: 1400 }, uFlash: { value: 0 }, uTear: { value: 0 }, uDark: { value: H(look.shelf[0]) }, uMid: { value: H(look.shelf[1]) },
      uLit: { value: H(look.shelf[2]) }, uHaze: { value: H(look.haze) }, uCam: { value: new THREE.Vector3() },
      uFlashPos: { value: new THREE.Vector3(1500, 380, -500) }, uTearPos: { value: new THREE.Vector3(-150, 380, -40) } };
    const shelf = new THREE.Mesh(new THREE.PlaneGeometry(10500, 13000).rotateX(Math.PI / 2).translate(2750, 380, 0),
      new THREE.ShaderMaterial({ uniforms: shelfU, vertexShader: SHELF_VERT, fragmentShader: SHELF_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    shelf.renderOrder = -0.5; shelf.frustumCulled = false; scene.add(shelf);
    if (CL) { const st = LOOKS.storm, su = sky.uniforms || {};
      washTo(shelfU.uDark.value, st.shelf[0]); washTo(shelfU.uMid.value, st.shelf[1]); washTo(shelfU.uLit.value, st.shelf[2]); washTo(shelfU.uHaze.value, st.haze);
      washTo(wallU.uLit.value, st.wallLit); washTo(wallU.uShade.value, st.wallShade); washTo(wallU.uBase.value, '#' + H(st.wallShade).lerp(H(st.haze), 0.6).getHexString()); washTo(wallU.uRim.value, '#' + H(st.wallLit).multiplyScalar(0.5).getHexString());
      washTo(su.uZenith && su.uZenith.value, st.sky.zenith); washTo(su.uMid && su.uMid.value, st.sky.mid); washTo(su.uHorizon && su.uHorizon.value, st.sky.horizon); washTo(su.uScatterColor && su.uScatterColor.value, st.sky.scatterColor); }

    // rain shafts under the shelf and the two flicker blooms inside the wall (one mesh)
    const shaftU = { uTime: TIME, uEdge: shelfU.uEdge, uCol: { value: H(dusk ? '#4c4b5e' : lookId === 'dust' ? '#7a6c68' : '#68677a') } };
    { const sr = rng.fork('shafts'), P = [], UV = [], INF = [], I = [];
      const quad = (a, b, c, d, info) => { const n = P.length / 3; P.push(...a, ...b, ...c, ...d); UV.push(0, 0, 1, 0, 1, 1, 0, 1); for (let k = 0; k < 4; k++) INF.push(...info); I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
      for (let i = 0; i < 11; i++) {
        const x = sr.range(260, 2600), z = sr.range(-2600, 2600), w = sr.range(380, 900), yaw = sr.range(-0.5, 0.5), lean = sr.range(110, 190);
        const dx = Math.sin(yaw) * w / 2, dz = Math.cos(yaw) * w / 2;
        quad([x - dx - lean, -12, z - dz], [x + dx - lean, -12, z + dz], [x + dx, 378, z + dz], [x - dx, 378, z - dz], [sr.range(2.5, 5), sr.range(0, 20), 0]);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setAttribute('aInfo', new THREE.Float32BufferAttribute(INF, 3)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: shaftU, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
      m.renderOrder = -0.65; m.frustumCulled = false; scene.add(m); }
    washTo(shaftU.uCol.value, '#68677a');
    await ctx.yield();

    // ----- hero: the stepwell, in its own (the brief's) coordinates -----
    const hero = await buildHero({ ...ctx, rng: rng.fork('hero') }, { palette: PALETTE, progress: 0, apron: 74, festival, sunDir: [sunDir.x, sunDir.y, sunDir.z],
      sunColor: look.heroSun[0], sunIntensity: look.heroSun[1], poolStart: monsoon ? -59.2 : -64.2, moss: monsoon ? 1 : 0, portalGlow: 1.1, cool: dusk ? 0.6 : 1 });
    scene.add(hero.object);
    hero.setSun(sunDir, sunCol, look.heroSun[1]); hero.setSky(skyE, skyW, fill); hero.setLamps(look.lamps); hero.setPortalGlow(H(look.portal).lerp(white, 0.3), 1.15);
    const A = hero.anchors;
    await ctx.yield();

    // ----- land: strip fields of mustard (or millet), the village yard, the lane; a hole cut for the well -----
    const cEarth = H('#a08a66'), cYard = H('#a8946e'), cLane = H('#c2ab84'), cBund = H('#6e5c3a'), cFallow = H('#8f7e4e');
    const cropA = H(monsoon ? '#5a9434' : '#e6cc22').multiplyScalar(1.75), cropB = H(monsoon ? '#7fa83e' : '#d0c22c').multiplyScalar(1.7), cropFar = H(monsoon ? '#6d9a3a' : '#e0c828').multiplyScalar(1.7);
    const fTmp = [0, 0, 0], cTmp = new THREE.Color();
    const earthMask = (x, z) => Math.max(yardMask(x, z), 1 - smoothstep(80, 97, wellD(x, z)));
    const heightAt = (x, z) => { const d = wellD(x, z); if (d <= 130) return -0.24 * (1 - smoothstep(76, 96, d));        // (within 130 m the far relief's weight is 0: the noise is not asked)
      return smoothstep(130, 520, d) * (noise.fbm2(x * 0.0035, z * 0.0035, 3) * 7 - 1.5); };
    // (called once per terrain vertex between the kit's yields, so it asks for nothing it will not use: the fine noise, the yard and
    // the lane are only worked out where they can show; the colours are the same)
    const groundColor = (x, z, y, ny, out) => {
      out = out || cTmp;
      const f = fieldAt(x, z, fTmp), n2 = noise.n2(x * 0.011 + 7, z * 0.011) * 0.5 + 0.5;
      out.copy(cropA).lerp(cropB, f[1]);
      const farK = smoothstep(260, 700, Math.hypot(x + 60, z));
      out.lerp(cropFar, farK * 0.6);
      if (f[0] < 0.5) out.lerp(f[2] ? cBund : cFallow, 1 - farK * 0.7);
      out.multiplyScalar(0.78 + 0.34 * n2);
      if (farK >= 1) return out;                                          // past 700 m there is no yard, apron or lane
      const nearLane = !offLane(x, z, 4.6), wd = wellD(x, z), ym = x > -137 && x < -70 && z > -36 && z < 80 ? yardMask(x, z) : 0;
      if (!nearLane && wd >= 97 && ym <= 0) return out;
      const em = Math.max(ym, 1 - smoothstep(80, 97, wd)), n = noise.n2(x * 0.05, z * 0.05) * 0.5 + 0.5;
      if (em > 0) { cTmp2.copy(cEarth).lerp(cYard, ym).multiplyScalar(0.82 + 0.3 * n); out.lerp(cTmp2, em); }
      if (nearLane) {
        const lk = 1 - smoothstep(1.6, 3.6, laneDist(x, z) + (n - 0.5) * 1.6);
        if (lk > 0) { cTmp2.copy(cLane).multiplyScalar(0.85 + 0.25 * n); out.lerp(cTmp2, lk); }
      }
      return out;
    };
    const cTmp2 = new THREE.Color();
    const focus = (x, z) => { const t = clamp((x + 190) / 130, 0, 1); return Math.min(Math.hypot(x - (-190 + 130 * t), z - laneZ(-190 + 130 * t)), Math.abs(wellD(x, z) - 70) * 1.4); };
    const terrain = await T.makeTerrainAsync({ rng: rng.fork('land'), noise, height: heightAt, corridor: false, focus, bounds: [-2700, -2600, 2500, 2600], cell: 2.5, near: 42, levels: 7,
      refine: 0, maxTriangles: 80000, biome: 'meadow', color: groundColor, sunDir, skirt: 20,
      palette: { rock: '#8a6a40', rockB: '#a58454', snow: 0, snowAmount: 0, clouds: 0.14, cloudSize: 520, cloudSpeed: 26, tufts: 0, ripples: 0, pebbles: 0.6, cracks: 0.45, strata: 0, wet: 0 } }, ctx.yield, 1);
    await ctx.yield();
    { // cut the pit out of the mesh: drop every triangle that reaches into it
      const g = terrain.geometry, pa = g.attributes.position, ia = g.index.array, keep = [];
      for (let i = 0; i < ia.length; i += 3) {
        if (i % 12288 === 0) await ctx.yield();
        const a = ia[i], b = ia[i + 1], c = ia[i + 2];
        if (inPit(pa.getX(a), pa.getZ(a)) || inPit(pa.getX(b), pa.getZ(b)) || inPit(pa.getX(c), pa.getZ(c))) continue;
        const cx = (pa.getX(a) + pa.getX(b) + pa.getX(c)) / 3, cz = (pa.getZ(a) + pa.getZ(b) + pa.getZ(c)) / 3;
        if (inPit(cx, cz)) continue;
        keep.push(a, b, c);
      }
      await ctx.yield();
      g.setIndex(keep);
    }
    scene.add(terrain.object);
    await ctx.yield();

    // ----- the village: 26 mud houses in two rows along the lane and a looser ring behind, all their small things, the shrine -----
    const mats = S.makeMaterials({ night: look.night, streetY: 0, lit: 0.5, glow: 2.2, warm: '#ff9a40', streetGlow: 0.16 });
    mats.setSky({ top: look.sky.zenith, horizon: look.sky.horizon, sun: look.sky.lightColor, sunDir: [sunDir.x, sunDir.y, sunDir.z] });
    await ctx.yield();
    const vrng = rng.fork('village'), houses = [], built = [];
    const WALLS = ['#c4a47c', '#b89a72', '#cdb08a', '#bfa888', '#c2a67e', '#d4c0a0', '#dccaa6', '#b8a082', '#e2d6ba', '#c8b494'];
    const tryHouse = (x, z, w, d, lv, rot, yard) => {
      const r = Math.hypot(w, d) / 2;
      if (path.nearestXZ(x, z).dist < d / 2 + 4.6 || x + r > -75.5 || laneDist(x, z) < d / 2 + 4.4) return false;
      if (houses.some((q) => Math.hypot(q.x - x, q.z - z) < q.r + r + 1.2)) return false;
      if (x + w / 2 > -104 && inWedge(x, z, d / 2 + 1)) return false;        // the last 30 m of lane is open ground: the flagstone track runs to the fallen bay
      if (lv > 1 && inWedge(x, z, r + 2)) lv = 1;                           // keep the gallery and its gap above the roofs
      houses.push({ x, z, w, d, lv, rot, r, yard, top: lv === 1 ? 3.9 : lv * 3 + 0.9, wall: S.lin(vrng.pick(WALLS)) }); return true;
    };
    for (const side of [-1, 1]) {
      let x = -131 + vrng.range(0, 3);
      while (x < -84) { const w = vrng.range(8, 11.5), d = vrng.range(6.5, 8.6); tryHouse(x + w / 2, laneZ(x + w / 2) + side * (5.3 + d / 2 + vrng.range(0, 1.6)), w, d, 1, side < 0 ? vrng.range(-0.08, 0.08) : Math.PI + vrng.range(-0.08, 0.08), false); x += w + vrng.range(1.6, 4.5); }
      x = -134 + vrng.range(0, 4);
      while (x < -86) { const w = vrng.range(8.5, 12.5), d = vrng.range(7, 9.5); tryHouse(x + w / 2, laneZ(x + w / 2) + side * (22.5 + d / 2 + vrng.range(0, 3)), w, d, vrng.chance(0.45) ? 2 : 1, (side < 0 ? 0 : Math.PI) + vrng.range(-0.25, 0.25), true); x += w + vrng.range(2.5, 6); }
    }
    for (let tries = 0; houses.length < 26 && tries < 400; tries++) {
      const x = vrng.range(-136, -84), z = vrng.range(-22, 68), w = vrng.range(8, 12), d = vrng.range(7, 9.5);
      tryHouse(x, z, w, d, vrng.pick([1, 1, 2, 2, 3]), vrng.range(0, TAU), vrng.chance(0.6));
    }
    for (const h of houses) {
      const hb = S.makeBuilding({ rng: vrng.fork('h' + built.length), style: 'adobe', width: h.w, depth: h.d, levels: h.lv, detail: 1, lit: 1, mats, position: [h.x, 0, h.z], rotationY: h.rot,
        palette: { wall: [h.wall], roof: '#a0764a', trim: '#efe6d2', wood: '#4a3222', accent: '#ffa040' } });
      built.push(hb);
      await ctx.yield();
    }
    const shrineAt = [-83, 40];
    const shrine = S.makeBuilding({ rng: vrng.fork('shrine'), style: 'dome', width: 5.4, height: 6.2, shape: 'pointed', detail: 1, lit: 0.6, mats, position: [shrineAt[0], 0, shrineAt[1]], rotationY: -Math.PI / 2,
      palette: { wall: ['#efe9dc'], dome: '#f4f0e6', trim: '#e6dcc8', gold: '#e8a020', accent: '#ffa040', roof: '#f0eadc' } });
    built.push(shrine);
    await ctx.yield();
    const LP = { lime: S.lin('#f0e8d6'), mud: S.lin('#b08650'), terra: S.lin('#b5562c'), terraDark: S.lin('#3a2a24'), wood: S.lin('#5a3c26'), rope: S.lin('#c9b488'), sack: S.lin('#b8a070'),
      dung: S.lin('#5a4630'), quilts: ['#b8281e', '#2c4a9a', '#d8a020', '#2f7a5a'].map((c) => S.lin(c)), dry: ['#b8201a', '#c8341c', '#d8a428', '#c9742a'].map((c) => S.lin(c)),
      shutters: ['#2f7a86', '#2c5a9a', '#3f8a5a', '#8a3a2a'].map((c) => S.lin(c)), straw: S.lin('#b89a54'), straw2: S.lin('#9c8040'), iron: S.lin('#3a3e44'), tractor: S.lin('#8a3a2a'), tyre: S.lin('#1c1c1e'), trolley: S.lin('#2c5a8a'), steel: S.lin('#8a8e94') };
    const pb = S.makeBuilder(8192), cloth = makeClothBuilder(), poles = [], tractorAt = [], rubbleAt = [];
    for (const h of houses) { houseProps(pb, vrng, h, LP); await ctx.yield(); }
    // washing lines: across the yards and from roof to roof; one sheet tears free when the gust arrives
    const pole = (x, y, z, hgt) => { pb.col(LP.wood, 0.85, 1).surf(S.SURF.PLAIN); pb.beam([x, y, z], [x + 0.05, y + hgt, z], 0.09, 0.09); };
    let lines = 0;
    for (let i = 0; i < houses.length && lines < 11; i++) {
      const h = houses[i], cs = Math.cos(h.rot), sn = Math.sin(h.rot);
      const W = (lx, lz) => [h.x + lx * cs + lz * sn, h.z - lx * sn + lz * cs];
      if (h.lv === 1 && vrng.chance(0.7)) {                             // on the roof, pole to pole
        const a = W(-h.w * 0.36, vrng.range(-1, 1)), b = W(h.w * 0.36, vrng.range(-1, 1));
        pole(a[0], h.top, a[1], 2.1); pole(b[0], h.top, b[1], 2.1);
        cloth.washing(vrng, [a[0], h.top + 2.0, a[1]], [b[0], h.top + 2.0, b[1]], vrng.int(3, 6), WASH, lines === 1); lines++;
      } else if (vrng.chance(0.6)) {                                   // in the yard behind
        const a = W(-h.w * 0.4, -h.d / 2 - 1.2), b = W(h.w * 0.45, -h.d / 2 - 3.6);
        if (path.nearestXZ(a[0], a[1]).dist > 5 && path.nearestXZ(b[0], b[1]).dist > 5) {
          pole(a[0], 0, a[1], 2.5); pole(b[0], 0, b[1], 2.5);
          cloth.washing(vrng, [a[0], 2.4, a[1]], [b[0], 2.4, b[1]], vrng.int(3, 6), WASH, false); lines++;
        }
      }
    }
    await ctx.yield();
    // the shrine's flag, and (festival) a strung line of orange flags along the west gallery roof
    pole(shrineAt[0], 5.8, shrineAt[1], 3.4);
    cloth.sheet([shrineAt[0], 9.15, shrineAt[1]], [shrineAt[0] - 1.7, 9.15, shrineAt[1] + 0.3], 1.0, '#f06a10', 1.3, 0, 3, 3, 0.85);
    if (festival) {
      const fr = rng.fork('flags');
      for (const [z0, z1] of [[-58, -8], [16, 36]]) {
        const a = [-68.6, 7.6, z0], b = [-68.6, 7.6, z1], L = z1 - z0, sag = 0.9;
        pole(a[0], 6, a[2], 1.7); pole(b[0], 6, b[2], 1.7); cloth.rope(a, b, sag, '#3a2a1e', 2, 12);
        for (let t = 0.03; t < 0.98; t += 0.85 / L) {
          const P = (tt) => [a[0], a[1] - sag * 4 * tt * (1 - tt), lerp(a[2], b[2], tt)];
          cloth.sheet(P(t), P(t + 0.5 / L), 0.62, fr.pick(['#f06a10', '#f08a10', '#e8501a', '#f0b020']), fr() * 6, 0, 1, 2, 0.95);
        }
      }
    }
    await ctx.yield();
    // hand pump, a parked tractor and trolley, a bicycle on its side, a grain heap, thorn-fence posts along the first bund
    { const px = -109, pz = laneZ(-109) + 3.4;
      pb.col(LP.mud, 0.8, 1).surf(S.SURF.PLAIN); pb.box(px - 1.1, 0, pz - 1.1, px + 1.1, 0.22, pz + 1.1);
      pb.col(LP.iron, 0.8, 1.1); pb.cyl(px, 0.22, pz, 0.09, 0.07, 1.25, 7); pb.box(px - 0.1, 1.35, pz - 0.1, px + 0.1, 1.6, pz + 0.1);
      pb.beam([px - 0.75, 1.72, pz], [px + 0.1, 1.42, pz], 0.06, 0.06); pb.beam([px + 0.05, 1.1, pz], [px + 0.42, 1.0, pz], 0.07, 0.07);
      pb.col(LP.steel, 0.8, 1.1); pb.cyl(px + 0.5, 0.22, pz + 0.05, 0.22, 0.24, 0.36, 8);
      // parked in the back lane between the rows (never the nearest thing on the centreline of the first frame)
      const tFree = (x, z, rot) => { for (const t of [-1.6, 0.6, 3, 5.7]) { const qx = x + t * Math.cos(rot), qz = z - t * Math.sin(rot);
        if (laneDist(qx, qz) < 6 || path.nearestXZ(qx, qz).dist < 7) return false;
        for (const h of houses) { const cs = Math.cos(h.rot), sn = Math.sin(h.rot), ex = qx - h.x, ez = qz - h.z, lx = ex * cs - ez * sn, lz = ex * sn + ez * cs;
          if (Math.abs(lx) < h.w / 2 + 3.6 && lz < h.d / 2 + 3.8 && lz > -h.d / 2 - (h.yard ? 7.4 : 2.2)) return false; } }
        return true; };
      let tx = -134, tz = 45, trot = 1.35;
      search: for (const dz of [18, 16, 20, 14, 22, -17, -19, -15, -21]) for (const x of [-126, -123, -129, -120, -117, -132]) for (const rot of [0.12, -0.2, 0.5])
        if (tFree(x, laneZ(x) + dz, rot)) { tx = x; tz = laneZ(x) + dz; trot = rot; break search; }
      tractorAt.push(tx + 2 * Math.cos(trot), tz - 2 * Math.sin(trot));
      const RX = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      const wheel = (X, R, zc, th) => { pb.push(RX); pb.col(LP.tyre, 0.9, 1.05); pb.lathe(X, zc - th / 2, -R, [[R * 0.42, 0], [R * 0.9, 0], [R, th * 0.22], [R, th * 0.78], [R * 0.9, th], [R * 0.42, th]], 12, { smooth: true });
        pb.col(LP.tractor, 0.9, 1.1); pb.lathe(X, zc - th * 0.3, -R, [[0, 0], [R * 0.42, 0], [R * 0.42, th * 0.6], [0, th * 0.6]], 8, {}); pb.pop(); };
      pb.tr(tx, 0, tz, trot);
      pb.col(LP.tractor, 0.85, 1.05); pb.box(-1.5, 0.75, -0.42, 0.5, 1.4, 0.42); pb.box(0.5, 0.75, -0.55, 1.5, 1.2, 0.55); pb.box(0.4, 1.4, -0.6, 1.45, 1.5, 0.6);
      pb.col(LP.iron, 0.8, 1); pb.beam([0.45, 1.2, -0.55], [0.45, 2.3, -0.55], 0.06, 0.06); pb.beam([0.45, 1.2, 0.55], [0.45, 2.3, 0.55], 0.06, 0.06); pb.box(0.4, 2.3, -0.62, 1.5, 2.36, 0.62);
      pb.beam([-1.2, 1.4, 0.2], [-1.2, 2.2, 0.2], 0.08, 0.08);
      for (const sz of [-0.8, 0.8]) { wheel(1.1, 0.68, sz, 0.42); wheel(-1.2, 0.36, sz * 0.82, 0.22); }
      pb.col(LP.tractor, 0.8, 1.05); for (const sz of [-0.8, 0.8]) pb.box(0.42, 1.36, sz - 0.26, 1.78, 1.44, sz + 0.26);        // mudguards
      pb.col(LP.iron, 0.8, 1); pb.box(0.75, 1.2, -0.25, 1.25, 1.3, 0.25); pb.box(1.2, 1.2, -0.25, 1.3, 1.75, 0.25); pb.beam([0.3, 1.4, 0], [0.62, 1.78, 0], 0.05, 0.05); pb.box(0.56, 1.72, -0.2, 0.68, 1.84, 0.2);   // seat and wheel
      pb.col(LP.trolley, 0.8, 1.05); pb.box(2.4, 0.7, -0.95, 5.6, 0.82, 0.95);
      pb.box(2.4, 0.82, -0.95, 5.6, 1.45, -0.88); pb.box(2.4, 0.82, 0.88, 5.6, 1.45, 0.95); pb.box(2.4, 0.82, -0.95, 2.47, 1.45, 0.95); pb.box(5.53, 0.82, -0.95, 5.6, 1.45, 0.95);
      pb.col(LP.sack, 0.8, 1.05); pb.box(2.7, 0.82, -0.7, 4.6, 1.25, 0.7);
      pb.col(LP.iron, 0.8, 1); pb.beam([1.75, 0.6, 0], [2.4, 0.72, 0], 0.08, 0.08);
      for (const sz of [-1.07, 1.07]) wheel(4.25, 0.46, sz, 0.24);
      pb.pop();
      const bx = -99.5, bz = laneZ(-99.5) + 3.1;                       // the bicycle, dropped where its rider ran
      pb.tr(bx, 0.06, bz, 0.7); pb.col(LP.tyre, 0.9, 1);
      for (const wx of [-0.55, 0.55]) { pb.lathe(wx, 0, 0, [[0.3, 0], [0.34, 0.02], [0.34, 0.05], [0.3, 0.07]], 12); }
      pb.col(LP.trolley, 0.9, 1.1); pb.beam([-0.55, 0.06, 0], [0.1, 0.08, 0.3], 0.04, 0.04); pb.beam([0.1, 0.08, 0.3], [0.55, 0.06, 0], 0.04, 0.04); pb.beam([-0.55, 0.06, 0], [0.55, 0.1, 0.1], 0.04, 0.04);
      pb.col(LP.iron, 0.9, 1.1); pb.beam([0.5, 0.08, 0.05], [0.62, 0.12, 0.5], 0.035, 0.035); pb.pop();
      pb.col(S.lin('#c9a23a'), 0.8, 1.1); pb.lathe(-121, 0, laneZ(-121) - 3.6, [[1.3, 0], [0.9, 0.35], [0.3, 0.7], [0, 0.78]], 10, { smooth: true });
      pb.col(LP.wood, 0.7, 1);
      for (let x = -168; x < -142; x += 2.3 + hash1(x) * 0.8) for (const zz of [8.5, 43.5]) { const z = zz + (hash1(x * 3.3) - 0.5) * 0.6; pb.beam([x, 0, z], [x + (hash1(x) - 0.5) * 0.5, 1.1 + hash1(x * 1.7) * 0.4, z], 0.08, 0.08); }
    }
    await ctx.yield();
    { // a worn flagstone track from the lane's end to the fallen bay, and what fell from it: column drums, roof slabs, blocks in the dry grass
      const stone = S.lin('#c9a56a'), stoneB = S.lin('#b8935c');
      for (let x = -104; x < -73.2; x += 1.32) for (let j = -1; j <= 1; j++) {
        const hs = hash1(x * 7.1 + j * 3.3), hs2 = hash1(x * 3.7 + j * 9.1); if (hs2 < 0.14) continue;
        const cx = x + (hs - 0.5) * 0.3, cz = laneZ(x) + j * 1.28 + (hs2 - 0.5) * 0.3, hw = 0.52 + hs * 0.12, hd = 0.5 + hs2 * 0.12, y = heightAt(cx, cz);
        pb.col(hs > 0.5 ? stone : stoneB, 0.82, 1.08).surf(S.SURF.PLAIN); pb.tr(cx, y - 0.02, cz, (hs - 0.5) * 0.3); pb.box(-hw, 0, -hd, hw, 0.07 + hs2 * 0.03, hd, {}); pb.pop();
      }
      const dr = rng.fork('drums'), rubE = new THREE.Euler(), rubQ = new THREE.Quaternion(), rubM = new THREE.Matrix4(), rubP = new THREE.Vector3(), rubS = new THREE.Vector3(1, 1, 1);
      for (let i = 0, tries = 0; i < 30 && tries < 300; tries++) {
        const x = dr.range(-97, -75), z = dr.range(-20, 30), kind = dr();
        if (laneDist(x, z) < 3.2 || houses.some((h) => Math.hypot(h.x - x, h.z - z) < h.r + 1)) continue;
        if (dr() > 1.15 - Math.hypot(x + 72, z - 4) / 30 * 0.6) continue;                        // thicker toward the fallen bay
        const y = heightAt(x, z) - 0.04, k = 0.85 + dr() * 0.3; i++; rubbleAt.push([x, z, kind < 0.42 ? 0.75 : kind < 0.75 ? 0.8 : 1.7]);
        // (carved stone, not primitives: drums keep their torus band and necking, some lie on their sides; blocks and roof slabs have a
        // dressed margin and sit a few degrees off level. The tilts come from a hash, so the layout's random draws are as they were)
        const yaw = dr() * TAU, h1 = hash1(x * 3.1 + z * 7.7), h2 = hash1(x * 5.3 - z * 2.9), sc = [stone[0] * k, stone[1] * k, stone[2] * k];
        pb.col(sc, 0.72, 1.08).surf(S.SURF.PLAIN);
        if (kind < 0.42) {
          const r = dr.range(0.5, 0.68), h = dr.range(0.45, 1.25), lying = h1 < 0.36 && h > 0.7;
          rubE.set(lying ? Math.PI / 2 + (h2 - 0.5) * 0.12 : (h1 - 0.5) * 0.16, yaw, lying ? 0 : (h2 - 0.5) * 0.16, 'YXZ');
          pb.push(rubM.compose(rubP.set(x, y + (lying ? r * 0.96 : 0.02), z), rubQ.setFromEuler(rubE), rubS));
          pb.lathe(0, lying ? -h / 2 : 0, 0, [[r * 0.93, 0], [r, 0.07], [r, h * 0.3], [r * 0.9, h * 0.35], [r * 0.9, h * 0.52], [r * 1.05, h * 0.58], [r * 1.05, h * 0.7], [r * 0.93, h * 0.76], [r * 0.93, h - 0.07], [r * 0.86, h], [r * 0.3, h], [r * 0.3, h - 0.06], [0, h - 0.06]], 12, {});
          if (lying) pb.lathe(0, -h / 2, 0, [[0, 0.05], [r * 0.3, 0.05], [r * 0.3, 0], [r * 0.93, 0]], 12, {});      // its other end, with the dowel socket
        } else if (kind < 0.75) {
          const sx = dr.range(0.35, 0.8), h = sx * dr.range(0.6, 1.1), sz = sx * 0.7, m = 0.07;
          rubE.set((h1 - 0.5) * 0.22, yaw, (h2 - 0.5) * 0.22, 'YXZ'); pb.push(rubM.compose(rubP.set(x, y + 0.03, z), rubQ.setFromEuler(rubE), rubS));
          pb.box(-sx, 0, -sz, sx, h - m, sz, {}); pb.col([sc[0] * 1.07, sc[1] * 1.06, sc[2] * 1.04], 0.9, 1.05); pb.box(-sx + m, h - m, -sz + m, sx - m, h, sz - m, {});
        } else {
          const L = dr.range(1.3, 2.6), h = dr.range(0.45, 0.7), m = 0.09, sl = [sc[0] * 0.74, sc[1] * 0.74, sc[2] * 0.74];   // thick roof slabs, a tone down so they lie in the ground
          rubE.set((h1 - 0.5) * 0.1, yaw, 0.03 + h2 * 0.09, 'YXZ'); pb.push(rubM.compose(rubP.set(x, y + 0.05 + L * 0.03, z), rubQ.setFromEuler(rubE), rubS));
          pb.col(sl, 0.72, 1.08); pb.box(-L, 0, -0.75, L, h - m, 0.75, {}); pb.col([sl[0] * 1.07, sl[1] * 1.06, sl[2] * 1.04], 0.9, 1.05); pb.box(-L + m, h - m, -0.75 + m, L - m, h, 0.75 - m, {});
          pb.col([sl[0] * 0.8, sl[1] * 0.78, sl[2] * 0.76], 0.9, 1.0); for (const q of [-L + 0.3, L - 0.42]) pb.box(q, h, -0.75 + m, q + 0.12, h + 0.035, 0.75 - m, {});   // a bearing rebate at each end only
        }
        pb.pop();
      }
    }
    await ctx.yield();
    const propMesh = new THREE.Mesh(pb.toGeometry(), mats.facades);
    await ctx.yield();
    { const all = [...built, propMesh], per = Math.ceil(all.length / 3);   // merged in three lots so no one step is long (a few more draw calls, the same picture)
      for (let i = 0; i < all.length; i += per) { scene.add(S.mergeObjects(all.slice(i, i + per)).object); await ctx.yield(); } }
    const clothU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: TIME, uGust: { value: 0.4 }, uU: { value: 0 }, uWind: { value: new THREE.Vector2(-0.985, 0.17) },
      uSunDir: { value: sunDir }, uSunCol: { value: H(look.sky.lightColor).multiplyScalar(dusk ? 0.5 : 1.1) }, uAmb: { value: H(look.sky.ambientColor).multiplyScalar(0.62) } };
    const clothMesh = new THREE.Mesh(cloth.geometry(), new THREE.ShaderMaterial({ uniforms: clothU, vertexShader: CLOTH_VERT, fragmentShader: CLOTH_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide }));
    clothMesh.frustumCulled = false; scene.add(clothMesh);
    await ctx.yield();

    // ----- flora: one wind for everything; neem and khejri, the crop, dry grass and caper on the rim, figs in the joints -----
    const wind = flora.makeWind({ direction: [-0.985, 0.17], strength: 0.7, speed: 1.3, gustScale: 0.05, gustiness: 0.75 });
    await ctx.yield();
    const leafOpts = { size: 512 };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);                             // the atlas is drawn in short steps and its pixels kept
    const leafMap = flora.makeLeafTexture(leafOpts);                                 // (so this call does no drawing)
    await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap, backlight: 1.0, backlightTint: '#e8e070', ambient: 1.9, leafAmbient: 1.7, sheen: 0.5 });
    const frng = rng.fork('flora');
    const neem = [];
    for (let i = 0; i < 3; i++) {
      neem.push(flora.oakGeometry({ rng: frng.fork('neem' + i), height: frng.range(8.5, 11), detail: 1, flex: 2, fullness: 1.05, leaf: '#4f7030', leafLight: '#86a04a', leafDark: '#2c4220', bark: '#6e5c48', barkDark: '#4a3c30' }));
      await ctx.yield();
    }
    const khejri = flora.oakGeometry({ rng: frng.fork('khejri'), height: 6.5, detail: 1, flex: 2, fullness: 0.7, leaf: '#6f8452', leafLight: '#9aa86c', leafDark: '#465438', bark: '#77664e', barkDark: '#4e4234' });
    const treePts = [];
    const treeOk = (x, z, r) => !inWedge(x, z, 7) && path.nearestXZ(x, z).dist > 9.5 + r && laneDist(x, z) > 5 && !inPit(x, z) && wellD(x, z) > 78 && !houses.some((h) => Math.hypot(h.x - x, h.z - z) < h.r + 1.5)
      && Math.hypot(x - shrineAt[0], z - shrineAt[1]) > 6 && !treePts.some((t) => Math.hypot(t.x - x, t.z - z) < 8);
    for (let tries = 0; treePts.length < 12 && tries < 500; tries++) {
      const x = frng.range(-150, -80), z = frng.range(-34, 76);
      if (treeOk(x, z, 1.5)) treePts.push({ x, y: heightAt(x, z), z, s: frng.range(0.85, 1.2), rot: frng() * TAU, v: frng.int(0, 2), d: 0, u: 0 });
    }
    for (let tries = 0; treePts.length < 16 && tries < 300; tries++) {
      const a = frng() * TAU, r = frng.range(96, 150), x = Math.cos(a) * r - 10, z = Math.sin(a) * r;
      if (treeOk(x, z, 0)) treePts.push({ x, y: heightAt(x, z), z, s: frng.range(0.8, 1.15), rot: frng() * TAU, v: 3, d: 0, u: 0 });
    }
    const trees = flora.makeScatter({ rng: frng.fork('trees'), variants: [...neem, khejri], points: treePts, material: leafMat, tint: 0.12, hue: 0.03,
      groundShadow: { sunDir, strength: 0.42, heightAt, color: '#2a2440', size: 1.2 } });
    scene.add(trees.object);
    await ctx.yield();
    // the houses ground themselves: a soft contact sheet round every footprint and a cast sheet dragged away from the sun; the crop
    // and dry grass standing in either (or under a tree) are darkened to match
    const castPts = [], contactPts = [];
    for (const h of houses) {
      const cs = Math.cos(h.rot), sn = Math.sin(h.rot), n = h.w > h.d * 1.2 ? 2 : 1, rr = (n === 1 ? Math.max(h.w, h.d) : h.d) * 0.5;
      for (let i = 0; i < n; i++) { const lx = n === 1 ? 0 : (i - 0.5) * h.w * 0.46, x = h.x + lx * cs, z = h.z - lx * sn;
        castPts.push({ x, z, r: rr * (h.lv > 1 ? 1.3 : 1) + 0.7 }); contactPts.push({ x, z, r: rr + 2.5 }); }
    }
    castPts.push({ x: shrineAt[0], z: shrineAt[1], r: 3.6 }); contactPts.push({ x: shrineAt[0], z: shrineAt[1], r: 4.6 });
    if (tractorAt.length) { castPts.push({ x: tractorAt[0], z: tractorAt[1], r: 2.4 }); contactPts.push({ x: tractorAt[0], z: tractorAt[1], r: 3.4 }); }
    for (const [x, z, r] of rubbleAt) { castPts.push({ x, z, r: r * 0.95 }); contactPts.push({ x, z, r: r + 0.55 }); }        // the fallen drums and slabs lie on the ground, not on a table
    const houseCast = flora.makeGroundShadows({ points: castPts, heightAt, sunDir, strength: dusk ? 0.6 : 1.3, color: '#746e94', size: 1, stretch: 0.9, cell: 7, lift: 0.14 });
    await ctx.yield();
    const houseContact = flora.makeGroundShadows({ points: contactPts, heightAt, sunDir: [0, 1, 0], strength: 2.2, color: '#6e6888', size: 1, cell: 7, lift: 0.17 });
    scene.add(houseCast.object, houseContact.object);
    const groundShade = [trees, houseCast, houseContact];
    await ctx.yield();
    const cropDensity = (x, z) => {
      if ((x > -137 && earthMask(x, z) > 0.25) || (!offLane(x, z, 3.4) && laneDist(x, z) < 3.4)) return 0;   // (west of x = -137 neither the yard nor the well's apron reaches: earthMask is 0)
      const f = fieldAt(x, z, fTmp); return f[0];
    };
    const cropOpts = { heightAt, density: cropDensity, wind, map: leafMat.map, width: [1.2, 1.9], height: monsoon ? [0.9, 1.35] : [1.05, 1.5], cards: 2, root: monsoon ? '#3a6c22' : dusk ? '#a89a24' : '#98a224', tip: monsoon ? '#98cc48' : dusk ? '#ffd428' : '#ffe626',   // (under the blue dusk fill the mustard is painted a step toward orange, so it stays yellow)
     
      dryAmount: 0.0, tint: 0.14, flowers: 0, fade: [135, 180], materialOptions: { ambient: 2.0, leafAmbient: 2.3, wrap: 0.8, backlight: 0.9, sheen: 0.9, detail: 0 } };
    const cropK = detail * Math.min(1.12, Math.max(0.85, density));
    const crop = await flora.makeGrassAsync({ rng: frng.fork('crop'), bounds: [-202, -44, -128, 100], count: Math.round(12500 * cropK), chunks: 2, ...cropOpts, shade: groundShade, width: [1.8, 2.8] }, ctx.yield);
    await ctx.yield();
    const crop2 = await flora.makeGrassAsync({ rng: frng.fork('crop2'), bounds: [-130, -128, -62, 152], count: Math.round(5800 * cropK), chunks: 2, ...cropOpts, shade: groundShade, width: [2.1, 3.3] }, ctx.yield);
    await ctx.yield();
    const crop3 = await flora.makeGrassAsync({ rng: frng.fork('crop3'), bounds: [-250, -110, -128, 160], count: Math.round(4000 * cropK), chunks: 1, ...cropOpts, cards: 1, width: [2.6, 3.8],
      density: (x, z) => (x > -202 && z > -44 && z < 100 ? 0 : cropDensity(x, z)) }, ctx.yield);
    scene.add(crop2.object, crop3.object);
    scene.add(crop.object);
    await ctx.yield();
    // dry grass on the rim and round the yards; caper bushes on the apron
    const southApron = (x, z) => z > 56.5 && Math.abs(x) < 73.2;
    const apronH = (x, z) => (wellD(x, z) < 74 ? 0.01 : heightAt(x, z));
    const dryDensity = (x, z) => { const d = wellD(x, z); if (inPit(x, z) || (d < 73.2 && !southApron(x, z)) || (!offLane(x, z, 3) && laneDist(x, z) < 3)) return 0; const v = Math.max(1 - smoothstep(88, 104, d), yardMask(x, z) * 0.35); return v > 0 && x < -75 && houses.some((h) => Math.hypot(h.x - x, h.z - z) < h.r) ? 0 : v; };   // (every house stands west of x = -75.5)
    const dryGrass = await flora.makeGrassAsync({ rng: frng.fork('dry'), bounds: [-150, -104, 104, 104], count: Math.round(7600 * detail), heightAt: apronH, density: dryDensity, shade: groundShade, wind, map: leafMat.map,
      width: [0.7, 1.2], height: [0.35, 0.75], root: '#7a6a3a', tip: '#d8c078', dryAmount: 0.5, flowers: 0, chunks: 2, fade: [110, 150], materialOptions: { ambient: 1.2, leafAmbient: 1.3, wrap: 0.4, backlight: 0.6, sheen: 0.6, detail: 0 } }, ctx.yield);
    scene.add(dryGrass.object);
    await ctx.yield();
    // and thicker, taller tufts among the fallen drums and slabs west of the fallen bay, so the stones lie in grass and not on bare earth
    const bayGrass = await flora.makeGrassAsync({ rng: frng.fork('dry-bay'), bounds: [-99, -24, -73.4, 34], count: Math.round(2100 * detail), heightAt: apronH, shade: groundShade, wind, material: dryGrass.material,
      density: (x, z) => ((!offLane(x, z, 2.6) && laneDist(x, z) < 2.6) || houses.some((h) => Math.hypot(h.x - x, h.z - z) < h.r) ? 0 : 0.35 + 0.65 * smoothstep(-99, -90, x)),
      width: [0.8, 1.4], height: [0.45, 0.95], root: '#7a6a3a', tip: '#d8c078', dryAmount: 0.5, flowers: 0, chunks: 1, fade: [110, 150] }, ctx.yield);
    scene.add(bayGrass.object);
    await ctx.yield();
    const bushV = [];
    for (let i = 0; i < 2; i++) { bushV.push(flora.bushGeometry({ rng: frng.fork('bush' + i), size: 1.4, detail: 0, flowers: 0, leaf: '#6a7a44', leafLight: '#98a060', leafDark: '#3c4a2a' })); await ctx.yield(); }
    const bushPts = [];
    for (let tries = 0; bushPts.length < 38 && tries < 900; tries++) {
      const a = frng() * TAU, r = frng.range(75, 104), x = clamp(Math.cos(a) * r * 1.3, -104, 104), z = clamp(Math.sin(a) * r * 1.3, -104, 104), d = wellD(x, z);
      if (d < 74.5 || (x < -74 && z > -30 && z < 70) || path.nearestXZ(x, z).dist < 9) continue;
      bushPts.push({ x, y: heightAt(x, z), z, s: frng.range(0.7, 1.5), rot: frng() * TAU, v: bushPts.length % 2, d: 0, u: 0 });
    }
    { const sr = rng.fork('capers-south');                               // and on the apron south of the pavilion roof
      for (let i = 0; i < 9; i++) { const x = sr.range(-70, 70), z = sr.range(58, 73); bushPts.push({ x, y: 0, z, s: sr.range(0.7, 1.4), rot: sr() * TAU, v: i % 2, d: 0, u: 0 }); } }
    // fig saplings rooted in the joints of the upper tiers
    const figV = [];
    for (let i = 0; i < 2; i++) { figV.push(flora.bushGeometry({ rng: frng.fork('fig' + i), size: 1.5, detail: 1, flowers: 0, leaf: '#3f7a34', leafLight: '#78b04a', leafDark: '#224a20' })); await ctx.yield(); }
    const figPts = [];
    for (let tier = 0; tier < 6; tier++) for (let wallI = 0; wallI < 3; wallI++) for (const p of A.ledges(tier, wallI)) {
      if (frng() > 0.3 - tier * 0.03) continue;
      const q = p.clone(); if (wallI === 0) q.z -= 2.1; else q.x += wallI === 1 ? 2.1 : -2.1;
      q.x += wallI === 0 ? frng.range(-4, 4) : 0; q.z += wallI === 0 ? 0 : frng.range(-4, 4);
      if (path.distanceTo(q.x, q.y + 1, q.z) < 7.5) continue;
      figPts.push({ x: q.x, y: q.y - 0.05, z: q.z, s: frng.range(0.5, 1.25), rot: frng() * TAU, v: figPts.length % 2, d: 0, u: 0 });
    }
    await ctx.yield();
    const bushes = flora.makeScatter({ rng: frng.fork('bushes'), variants: bushV, points: bushPts, material: leafMat, tint: 0.2 });
    await ctx.yield();
    const figs = flora.makeScatter({ rng: frng.fork('figs'), variants: figV, points: figPts, material: leafMat, tint: 0.2, sink: 0, tilt: 0.25 });
    scene.add(bushes.object, figs.object);
    await ctx.yield();

    // ----- fauna -----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const brng = rng.fork('birds');
    const PIGEON = { species: 'crows', size: 1.0, body: '#8f9cc0', belly: '#b6c0d8', wingC: '#98a4c6', trail: '#66708c', tip: '#2c3040', beak: '#caa08e', head: '#5a6688', flap: 5.2, glide: 0.18 };
    const PARAKEET = { species: 'parrots', size: 1.25, body: '#58b238', belly: '#93d24c', wingC: '#3f9a30', trail: '#2a7a2a', tip: '#1e5a3a', beak: '#e03a2a', head: '#66c244', tailC: '#3aa48c' };
    if (dusk) Object.assign(PIGEON, { body: '#687090', belly: '#858ca8', wingC: '#6e7694', trail: '#4c5370', tip: '#252a3c', head: '#48506c' });   // silhouettes on the dusk sky, not pale specks
    const nBirds = Math.round(500 * Math.min(1, detail) * look.flock * clamp(density, 0.8, 1.15));
    const ESC = lead === 'pigeons' ? PIGEON : PARAKEET, escK = lead === 'pigeons' ? 1 : 0.55;
    // they lift from the fields with the camera, pour over the parapet and wheel down the well ahead and beside it
    // (all the turns are right-handed: the left flock leaves before the east wall closes in on that side, the right one before the turn at the pavilion)
    const cool = (f) => { if (f.uniforms.uVivid) f.uniforms.uVivid.value = 0.55; if (f.uniforms.uBack) f.uniforms.uBack.value = 0.3; return f; };   // blue-grey stays blue-grey in warm light
    const esc = (f) => (lead === 'pigeons' ? cool(f) : f);
    // (flock cure 1) no bird's body comes within 2 m of the flown line, by place. The two flocks that fly beside us are dealt with a bound
    // (maxSigma 3): their courses lie 15 m and more off the line. The flock ahead of us at the end, the wheel in the well and the three
    // bursts keep their courses and spreads; the kit moves each bird that would come too near by its own place, by what it alone lacks
    // (keepClear with each), with a bound on the deal and a small wander written out so that the gap about our line stays narrow. The
    // flock ahead of us is made in the kit's stepped form: its clearing is the long step of these makes.
    const clearOf = (from, to) => ({ path, dist: 2, each: true, from, to, step: 2 });
    fauna.add(esc(F.makeFlock({ rng: brng.fork('a'), ...ESC, count: Math.round(nBirds * 0.33 * escK), spread: [3.5, 3, 14], wander: [1.6, 1.4, 3, 0.5], maxSigma: 3, along: { path, side: 16, up: 1.5, lead: 40, from: -0.03, to: 0.58, drift: 2 } })));
    await ctx.yield();
    fauna.add(esc(F.makeFlock({ rng: brng.fork('b'), ...ESC, lod: 'low', count: Math.round(nBirds * 0.27 * escK), spread: [3.5, 3, 14], wander: [1.6, 1.4, 3, 0.45], maxSigma: 3, along: { path, side: -15, up: -4, lead: 48, from: -0.03, to: 0.44, drift: 2 } })));
    await ctx.yield();
    fauna.add(esc(await F.makeFlockAsync({ rng: brng.fork('d'), ...ESC, count: Math.round(nBirds * 0.14 * escK), spread: [4, 2.6, 10], wander: [0.6, 0.4, 0.8, 0.5], maxSigma: 3, keepClear: clearOf(0.2, 1), along: { path, side: 0.5, up: 2.6, lead: 36, from: 0.72, to: 1.0, drift: 3 } }, ctx.yield)));
    await ctx.yield();
    fauna.add(cool(F.makeFlock({ rng: brng.fork('c'), ...PIGEON, lod: 'low', count: Math.round(nBirds * 0.26), spread: [6, 5, 20], wander: [1.2, 0.8, 1.6, 0.4], maxSigma: 3, keepClear: clearOf(0.2, 1), center: [0, -19, -8], radius: 19, height: 6, wobble: 0.3, speed: 14 })));
    await ctx.yield();
    const burst = (name, u, side, cnt, from, to) => fauna.add(F.makeFlock({ rng: brng.fork(name), ...PARAKEET, count: cnt, spread: [4, 3, 8], wander: [0.6, 0.4, 0.8, 0.6], maxSigma: 3, keepClear: clearOf(from, to), cross: { path, u, lead: 32, span: 120, angle: 62, side, height: -2, rise: 16, duration: DUR } }));
    burst('p1', 0.48, 1, 22, 0.4, 1); await ctx.yield();
    burst('p2', 0.63, -1, 20, 0.4, 1); await ctx.yield();
    burst('p3', 0.71, 1, 20, 0.25, 1);
    await ctx.yield();

    // langurs bounding up the flights of the east and west walls (or, some visits, a second troop of peacocks stands there instead)
    const hwOf = (k) => 65 - 3 * k;
    const stairLine = (sx) => {                                          // a dense polyline up the lattice: north-going flights low down, south-going above
      const pts = [], zA = (k) => (k >= 7 ? 17 - 7 * (12 - k) : -18 + 7 * (7 - k));       // apex z of the flight climbed on tier k
      let zf = 24;
      for (let k = 12; k >= 0; k--) {
        const x = sx * (hwOf(k) - 1.15), za = zA(k), y0 = -5 * (k + 1), y1 = -5 * k;
        for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector3(x, lerp(y0, y1, t) + 0.05, lerp(zf, za, t))); }
        if (k > 0) for (let i = 1; i < 5; i++) pts.push(new THREE.Vector3(sx * (hwOf(k) - 1.15 + 3 * i / 5), y1 + 0.05, za));
        zf = za;
      }
      return pts;
    };
    const stairH = (line) => (x, z) => { let best = 1e9, y = 0; for (let i = 0; i < line.length; i++) { const p = line[i], d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (d < best) { best = d; y = p.y; } } return y; };
    const LANGUR = { ...F.HERD_PRESETS.deer, h: 0.95, bodyLen: 1.05, width: 0.36, depth: 0.44, hip: 1.0, leg: [0.08, 0.055, 0.045], neckLen: 0.2, neckAng: 38, neck: [0.17, 0.14], headLen: 0.26, headR: 0.14, headPitch: 22,
      ears: 0.05, tail: 1.8, tailType: 'thin', antlers: 0, graze: 0, coat: '#7c7e80', belly: '#a9a9a4', legs: '#5c5d5e', sock: '#141212', accent: '#141212', horn: '#111111', pattern: 'none', speed: 1.45, stride: 0.9, varieties: 0, count: 15 };
    const stairPeacocks = [];
    if (stair === 'langurs') {
      for (const sx of [1, -1]) {
        const line = stairLine(sx), route = line.filter((p, i) => i % 3 === 0);
        // east troop: tiers 1-3 as the camera comes down that wall (u 0.54); west troop: tiers 5-7 as it turns north along that wall (u 0.72)
        let Lr = 0; for (let i = 1; i < route.length; i++) Lr += route[i].distanceTo(route[i - 1]);
        // (the kit starts a herd at a random point of its route, so the troop's place along it is set here from u, after the kit's own update)
        const spd = LANGUR.speed * 4.2, uAt = sx > 0 ? 0.54 : 0.72, fAt = sx > 0 ? 0.88 : 0.57, cyc = Lr * 1.2;
        const herd = F.makeHerd({ rng: brng.fork('langur' + sx), preset: dusk ? { ...LANGUR, coat: '#8c92a4', belly: '#aeb2c0', legs: '#6c7284' } : LANGUR, count: 15, mode: 'migrate', gait: 'run', route, closed: false, heightAt: stairH(line), spread: [0.35, 35], blobShadow: true, shadowOpacity: 0.3, fill: dusk ? 0.9 : 0.6 });
        const upd = herd.update.bind(herd), trav = [];
        herd.object.traverse((o) => { const tu = o.material && o.material.uniforms && o.material.uniforms.uTravel; if (tu && !trav.includes(tu)) trav.push(tu); });
        herd.update = (dt, time, camera, u) => {                                           // their clock is the camera's progress
          const uu = u || 0, sAt = ((((fAt * Lr + (uu - uAt) * DUR * spd) % cyc) + cyc) % cyc); upd(dt, uu * DUR, camera, u);
          for (const tu of trav) tu.value = sAt;
        };
        // each troop takes the light of the wall it climbs, not the village's warm key: the west wall is in slate shade, the east in sun (held
        // down so the grey coat does not go gold); at dusk both take the cool fill
        const troopLight = dusk ? { sunColor: '#c0b8c4', sunIntensity: 0.6, sky: '#8e90a8', skyIntensity: 1.25, ground: '#6a6470', groundIntensity: 1.0 }
          : sx < 0 ? { sunColor: '#aeb4c6', sunIntensity: 0.9, sky: '#9aa2bc', skyIntensity: 2.6, ground: '#6a6470', groundIntensity: 1.8 }
            : { sunColor: '#ffe2bc', sunIntensity: 1.6, sky: '#8e96b0', skyIntensity: 1.5, ground: '#77706c', groundIntensity: 1.1 };
        fauna.add(herd, { always: true, light: F.lightFrom(scene, troopLight) });
        await ctx.yield();
      }
    } else {
      for (let k = 1; k < 8; k++) for (const wallI of [1, 2]) { const L = A.ledges(k, wallI); for (let j = k % 2; j < L.length; j += 3) if (path.distanceTo(L[j].x, L[j].y + 1, L[j].z) > 14) stairPeacocks.push([L[j], wallI]); }
    }
    await ctx.yield();
    // goats and humped cattle trotting up the lane for shelter
    const laneRoute = (off, x0, x1) => { const r = []; for (let x = x0; x <= x1; x += 9) r.push([x, 0, laneZ(x) + off]); return r; };
    fauna.add(F.makeHerd({ rng: brng.fork('goats'), preset: { ...F.HERD_PRESETS.antelope, h: 0.64, horns: 0.2, coat: '#463a30', belly: '#6a5a4a', legs: '#382e26', sock: '#2a221c', accent: '#d8ccb8', pattern: 'none', tail: 0.12 },
      count: 4, mode: 'migrate', gait: 'run', route: laneRoute(2.3, -152, -84), closed: false, heightAt, spread: [1.2, 14], tints: ['#ffffff', '#e8d2b4', '#b89878', '#ffffff'] }));
    await ctx.yield();
    fauna.add(F.makeHerd({ rng: brng.fork('cattle'), preset: { ...F.HERD_PRESETS.bison, h: 1.32, hump: 0.22, horns: 0.3, coat: '#dcd6c6', belly: '#c8c0ae', legs: '#bdb5a4', sock: '#9a9282', accent: '#8a8274', neckAng: 6, headPitch: 42, speed: 1.0 },
      count: 2, mode: 'migrate', gait: 'run', route: laneRoute(-2.1, -156, -86), closed: false, heightAt, spread: [0.8, 9], speed: 0.75 }));
    await ctx.yield();

    // peacocks on the gallery roofs (one fans beside the fallen bay), two that glide down across the well, the parasol, a swinging door
    const lightU = { uSunDir: { value: sunNow }, uSunCol: { value: H(look.sky.lightColor).multiplyScalar(0.9) }, uAmb: { value: H(look.sky.ambientColor).multiplyScalar(0.75) } };
    const critMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU }, vertexShader: CRIT_VERT, fragmentShader: CRIT_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide });
    { const vb = makeVB(), pr = rng.fork('peacocks');
      vb.at(-68.8, 6.0, -8.6, Math.PI / 2 + 0.25, 1.45); peacock(vb, 1, 0);
      const spots = [[-69.5, 6, 17.5, 1.2], [-68.4, 6, -31, 2.0], [-30, 6, -68.6, 0.3], [14, 6, -69.2, -0.5], [44, 6, -68, 0.2], [68.6, 6, -40, -1.4], [69.2, 6, 6, -1.8]];
      for (const s of spots) { vb.at(s[0], s[1], s[2], s[3] + pr.range(-0.3, 0.3), 1.4); peacock(vb, 0, 0); }
      for (const [p, wallI] of stairPeacocks) { vb.at(p.x, p.y + 0.02, p.z, (wallI === 1 ? -Math.PI / 2 : Math.PI / 2) + pr.range(-0.9, 0.9), 1.0); peacock(vb, pr.chance(0.25) ? 1 : 0, 0); }
      const m = new THREE.Mesh(vb.geometry(), critMat); m.frustumCulled = false; scene.add(m); }
    // (their own material, so the mesh is never hidden: outside its glide it is parked on the gallery roof at no size, and the program is ready)
    const gliderU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...lightU, uTime: TIME, uAmp: { value: 0.42 } };
    const gliders = new THREE.Mesh(gliderGeometry([[0, 0, 0, 0, 1.5, 0.4], [4.5, 1.6, -6.5, 0.08, 1.45, 2.9]]),
      new THREE.ShaderMaterial({ uniforms: gliderU, vertexShader: GLIDER_VERT, fragmentShader: GLIDER_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide }));
    gliders.frustumCulled = false; gliders.position.set(-67, 6.8, -9); gliders.scale.setScalar(1e-4); scene.add(gliders);
    // their glide: off the west gallery roof beside the fallen bay as the camera comes through it, then 15 to 20 m off the camera's nose
    // across the well's mouth, to land on the top ledge under the corner tower (keyed to u: the camera never catches them)
    const glideU = [0.19, 0.235, 0.295, 0.34, 0.385, 0.43];
    const glideCurve = new THREE.CatmullRomCurve3([[-67, 6.8, -9], [-34.5, 3.6, -10.9], [-11.9, 2.2, -27.3], [4.7, 1.2, -38.4], [29, -1, -50], [50, -4.8, -63.3]].map((q) => new THREE.Vector3(q[0], q[1], q[2])), false, 'centripetal');
    const glideP = new THREE.Vector3(), glideQ = new THREE.Vector3();
    const parasol = (() => { const vb = makeVB(); vb.at(0, 0, 0);
      for (let i = 0; i < 8; i++) { vb.tint(i % 2 ? '#c8201c' : '#e0342a'); vb.lathe(0, 0, 0, [[0, 0], [1.05, 0.38]], 1, 'z', TAU / 8, (i / 8) * TAU); }
      vb.tint('#3a2a20'); vb.box(-0.025, -0.025, -0.1, 0.025, 0.025, 1.15);
      const m = new THREE.Mesh(vb.geometry(), critMat); scene.add(m); return m; })();
    const door = (() => { const h = houses[1] || houses[0], cs = Math.cos(h.rot), sn = Math.sin(h.rot), lx = -h.w / 2 + h.w * 0.3 - 0.5, lz = h.d / 2 + 0.08;
      const vb = makeVB(); vb.at(0, 0, 0); vb.tint('#5a3c26'); vb.box(0, 0.05, -0.04, 1.0, 2.05, 0.04); vb.tint('#3f2a1c'); vb.box(0.08, 0.9, -0.06, 0.92, 1.0, 0.06);
      const m = new THREE.Mesh(vb.geometry(), critMat); m.position.set(h.x + lx * cs + lz * sn, 0, h.z - lx * sn + lz * cs); m.userData.rot = h.rot; scene.add(m); return m; })();

    await ctx.yield();
    // frogs on the lowest tiers and round the pool
    const frogU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: TIME, uPoolY: hero.uniforms.uPoolY, uShow: { value: 0 }, ...lightU };
    { const fr = rng.fork('frogs'), n = Math.round(300 * Math.min(1, detail + 0.2)), base = new Float32Array(n * 3), seed = new Float32Array(n * 3), tmp = [];
      for (let k = 8; k < 13; k++) for (let w = 0; w < 3; w++) for (const p of A.ledges(k, w)) tmp.push(p);
      for (let i = 0; i < n; i++) {
        if (i < n * 0.62) { const p = tmp[fr.int(0, tmp.length - 1)], along = fr.range(-6, 6), across = fr.range(-1.6, 0.3);
          const wz = Math.abs(p.z + 2) > Math.abs(p.x) ? 0 : (p.x > 0 ? 1 : 2);
          base[i * 3] = p.x + (wz === 0 ? along : (wz === 1 ? -across : across)); base[i * 3 + 1] = p.y + 0.1; base[i * 3 + 2] = p.z + (wz === 0 ? across : along);
        } else { const a = fr() * TAU, r = fr.range(17.5, 25); base[i * 3] = clamp(Math.cos(a) * r, -24, 24); base[i * 3 + 1] = -64.75; base[i * 3 + 2] = clamp(6 + Math.sin(a) * r * 1.15, -22, 33); }
        seed[i * 3] = fr(); seed[i * 3 + 1] = fr(); seed[i * 3 + 2] = fr();
      }
      const g0 = new THREE.IcosahedronGeometry(0.17, 0).scale(1.15, 0.62, 1.5), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', g0.attributes.position); g.setAttribute('normal', g0.attributes.normal); if (g0.index) g.setIndex(g0.index);
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 3)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 3)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: frogU, vertexShader: FROG_VERT, fragmentShader: FROG_FRAG, fog: true }));
      m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // ----- air: dust before, rain after; whirling leaves; the gust front; dust devils; cooking smoke laid flat; lit rain in the well -----
    const prng = rng.fork('air'), set = fx.fxGroup(); scene.add(set.object);
    const RAIN_OP = 0.46, DUST_OP = lookId === 'dust' ? 0.6 : 0.35, LEAF_OP = 0.95;
    const rain = set.add(fx.makeParticles({ rng: prng.fork('rain'), preset: 'rain', time: TIME, count: Math.round(6500 * detail), box: [54, 42, 54], velocity: [-5.5, -25, 1], colors: look.rain, intensity: 1.05, opacity: RAIN_OP,
      size: [0.016, 0.03], stretch: 0.05 }));
    await ctx.yield();
    const dust = set.add(fx.makeParticles({ rng: prng.fork('dust'), preset: 'dust', time: TIME, count: Math.round(2400 * detail), box: [46, 24, 46], velocity: [-3.2, 0.1, 0.5], velocityRandom: [1.2, 0.3, 0.6], turbulence: [0.8, 0.4, 0.6],
      size: [0.035, 0.1], colors: ['#a8854e', '#b8935a', '#987644'], intensity: dusk ? 0.3 : 0.5, opacity: DUST_OP, additive: 0, twinkle: 0 }));
    await ctx.yield();
    const leaves = set.add(fx.makeParticles({ rng: prng.fork('leaves'), preset: 'leaves', time: TIME, follow: false, center: [0, -24, -8], box: [124, 62, 104], count: Math.round(1700 * detail), velocity: [-3.4, 0.6, 1.4],
      velocityRandom: [2.6, 1.8, 2.6], turbulence: [4.2, 2.2, 3.2], size: [0.3, 0.62], colors: ['#b8862c', '#8a5a2b', '#d9a55b'], opacity: LEAF_OP, lightDir: [sunDir.x, sunDir.y, sunDir.z] }));
    rain.setOpacity(0); leaves.setOpacity(0);
    await ctx.yield();
    // lit rain: ten tall ribbons of streaks standing across the well
    const streakU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: TIME, uRain: { value: 0 }, uSunDir: { value: sunNow }, uGold: { value: new THREE.Color(...look.gold) },
      uShade: { value: H(look.heroFill[0]).multiplyScalar(1.5) }, uCam: { value: new THREE.Vector3() } };
    { const P = [], UV = [], SD = [], I = [];
      const quad = (a, b, c, d, w, seed) => { const n = P.length / 3; P.push(...a, ...b, ...c, ...d); UV.push(0, 0, 1, 0, 1, 1, 0, 1); for (let k = 0; k < 4; k++) SD.push(w / 10, seed); I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
      const y0 = -66, y1 = 26, lean = 12;
      [-52, -34, -14, 6, 24].forEach((z, i) => quad([-60 - lean, y0, z], [60 - lean, y0, z], [60, y1, z], [-60, y1, z], 120, i * 1.7 + 0.3));
      [-50, -28, -6, 18, 42].forEach((x, i) => quad([x - lean, y0, -62], [x - lean, y0, 37], [x, y1, 37], [x, y1, -62], 99, i * 2.3 + 5.1));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setAttribute('aSeed', new THREE.Float32BufferAttribute(SD, 2)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: streakU, vertexShader: STREAK_VERT, fragmentShader: STREAK_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
      m.renderOrder = 3; m.frustumCulled = false; scene.add(m); }
    // the gust front: a wall of dust that comes through the village at the camera and passes under it at u 0.06
    const puffBase = { uTime: TIME, uCol: { value: H('#8a6a40') }, uColLit: { value: H(dusk ? '#b08a78' : '#e8b872') } };
    const makePuffs = (n, U, gen) => {
      const pos = new Float32Array(n * 3), sz = new Float32Array(n * 3), g0 = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
      for (let i = 0; i < n; i++) gen(i, pos, sz);
      g.setAttribute('position', g0.attributes.position); g.setAttribute('uv', g0.attributes.uv); g.setIndex(g0.index);
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(sz, 3)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, fog: true, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
      m.renderOrder = 3; m.frustumCulled = false; scene.add(m); return m;
    };
    const puffU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...puffBase, uFront: { value: -20 }, uOpacity: { value: 0 }, uWrap: { value: new THREE.Vector2(0, 0) } };
    makePuffs(Math.round(64 * Math.min(1, detail + 0.2)), puffU, (i, pos, sz) => { const low = prng() < 0.6; pos[i * 3] = prng.range(-9, 9) + (low ? 0 : 6); pos[i * 3 + 1] = low ? prng.range(1.2, 3.5) : prng.range(4, 9); pos[i * 3 + 2] = prng.range(-70, 130);
      sz[i * 3] = low ? prng.range(8, 14) : prng.range(11, 19); sz[i * 3 + 1] = prng(); sz[i * 3 + 2] = prng(); });
    // and dust streaming west across the mouth of the well before the rain lays it
    const wispU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...puffBase, uFront: { value: 74 }, uOpacity: { value: 0 }, uWrap: { value: new THREE.Vector2(10, 150) } };
    makePuffs(Math.round(34 * Math.min(1, detail + 0.2)), wispU, (i, pos, sz) => { pos[i * 3] = 0; pos[i * 3 + 1] = prng.range(-9, 4); pos[i * 3 + 2] = prng.range(-60, 34);
      sz[i * 3] = prng.range(9, 17); sz[i * 3 + 1] = prng(); sz[i * 3 + 2] = prng(); });
    await ctx.yield();
    const sunArr = [sunDir.x, sunDir.y, sunDir.z];
    const devilA = set.add(fx.makeDustDevil({ rng: prng.fork('devilA'), time: TIME, position: [150, heightAt(150, -150), -150], height: 62, radius: [1.6, 12], color: '#c79c62', colorTop: '#b89a6e', shadowColor: '#5a4636', opacity: 0.46,
      size: [4, 14], sunDir: sunArr, sunColor: look.sky.lightColor, sway: 4 }));
    await ctx.yield();
    const devilB = set.add(fx.makeDustDevil({ rng: prng.fork('devilB'), time: TIME, position: [-121, heightAt(-121, -66), -66], height: 30, radius: [0.8, 6], color: '#c9a06a', colorTop: '#b89a6e', shadowColor: '#5a4636', opacity: 0.4,
      sunDir: sunArr, sunColor: look.sky.lightColor, wander: 5 }));
    await ctx.yield();
    const smokeHouses = houses.filter((h) => h.lv > 1 || path.nearestXZ(h.x, h.z).dist > 20).slice(0, 2);
    for (const h of smokeHouses) set.add(fx.makeSmokeColumn({ rng: prng.fork('smoke' + h.x), time: TIME, position: [h.x + 1.5, h.top + 0.3, h.z - 1], height: 9, radius: [0.3, 2.6], size: [0.9, 5], count: 46,
      color: '#7d766e', colorTop: '#9a9288', shadowColor: '#4a4448', opacity: 0.34, wind: [-22, 0, 3.4], bend: 1.6, rate: 0.16, sunDir: sunArr, sunColor: look.sky.lightColor }));
    await ctx.yield();
    // dusk: oil lamps in the doorways, at the shrine and along the pavilion's galleries
    if (look.lamps) {
      const lp = [];
      for (const h of houses) { const cs = Math.cos(h.rot), sn = Math.sin(h.rot), lx = -h.w / 2 + h.w * 0.3 + 0.95, lz = h.d / 2 + 0.25; lp.push([h.x + lx * cs + lz * sn, 1.5, h.z - lx * sn + lz * cs]); }
      lp.push([shrineAt[0] - 2.2, 1.2, shrineAt[1]]);
      for (let st = 0; st < 5; st++) for (const id of [1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
        const a = Math.abs(id), k = (id * 7 + st * 13 + id * st * 3 + 120) % 5; if ((k !== 0 && k !== 2 && !(a === 3 && st === 1)) || (st < 2 && a < 3)) continue;   // the stone shader's rule: k = 0 a bright lamp, k = 2 a dim one
        lp.push([id === 1 ? 0 : Math.sign(id) * (a === 2 ? 5 : 7.5 + 4.625 * (a - 2.5)), -65 + 13 * st + 2.0, 41.5]);   // at the back wall, in the middle of its pool of light
      }
      for (const x of [-6.4, 6.4]) lp.push([x, -56.6, 39.5]);
      for (const q of A.lamps || []) lp.push([q.x, q.y, q.z]);                       // the fire bowls of the corner tower and the landing shrines
      set.add(fx.makeGlows({ rng: prng.fork('lamps'), time: TIME, positions: lp, color: '#ffae58', size: 2.4, sizeJitter: 0.3, intensity: 2.5, flicker: 0.5, halo: 1, core: 1 }));
      // and the pool of light each doorway lamp (and the shrine's) lays on the yard in front of it: soft additive discs in one mesh
      { const P = [], UV = [], PH = [], I = [], nDoor = houses.length + 1;
        for (let i = 0; i < nDoor; i++) {
          const h = houses[i], cs = h ? Math.cos(h.rot) : 0, sn = h ? Math.sin(h.rot) : 0, out = 1.9, r = h ? 3.5 : 3.0;
          const cx = h ? lp[i][0] + out * sn : lp[i][0] - 1.6, cz = h ? lp[i][2] + out * cs : lp[i][2], y = heightAt(cx, cz) + 0.06, n = P.length / 3, ph = hash1(i * 5.7 + 1.3) * 40;
          P.push(cx - r, y, cz - r, cx + r, y, cz - r, cx + r, y, cz + r, cx - r, y, cz + r); UV.push(0, 0, 1, 0, 1, 1, 0, 1); PH.push(ph, ph, ph, ph); I.push(n, n + 2, n + 1, n, n + 3, n + 2);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(PH, 1)); g.setIndex(I);
        const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: TIME, uCol: { value: H('#ffae58').multiplyScalar(0.36) } }, vertexShader: LAMPPOOL_VERT, fragmentShader: LAMPPOOL_FRAG,
          fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        m.renderOrder = 1; m.frustumCulled = false; scene.add(m); }
    } else if (A.lamps && A.lamps.length) {                                         // by day those few fires still burn in the rain's shade
      set.add(fx.makeGlows({ rng: prng.fork('lamps'), time: TIME, positions: A.lamps.map((q) => [q.x, q.y, q.z]), color: '#ffae58', size: 3.0, intensity: 2.0, flicker: 0.5, halo: 1, core: 1 }));
    }
    await ctx.yield();
    // rare: the shaft of sun that drops through the torn cloud
    const rays = rare ? set.add(fx.makeGodRays({ rng: prng.fork('rays'), time: TIME, position: [-14, 44, -4], direction: [-sunRare.x, -sunRare.y, -sunRare.z], radius: 18, count: 10, length: 132, width: [2.4, 8],
      color: '#fff0c4', intensity: 0, falloff: 1.1, fogAmount: 0.3 })) : null;
    if (rare) shelfU.uTearPos.value.set(-186, 380, 95);
    await ctx.yield();

    // ----- per-frame -----
    const camP = new THREE.Vector3(), colT = new THREE.Color(), windV = wind.uniforms.uFloraWind.value;
    const flashT = [-1, -1];                                             // the world time at which each flicker began (-1: not yet)
    const flashAt = (i, u, u0, time) => {
      if (u < u0) { flashT[i] = -1; return 0; }
      if (flashT[i] < 0) { if (u > u0 + 0.03) return 0; flashT[i] = time; }           // (a jump far past the trigger starts nothing)
      const t = time - flashT[i]; if (t <= 0 || t >= 0.6) return 0;
      if (t < 0.1) { const k = t / 0.1; return k * k * (3 - 2 * k); } const k = 1 - (t - 0.1) / 0.5; return k * k; };
    const sunI = look.heroSun[1], devilY0 = devilA.uniforms.uBase.value.y;
    function update(dt, time, camera, u) {
      const uu = u || 0;
      TIME.value = time;
      camera.getWorldPosition(camP);
      // the transformation, and (rare) the torn cloud: the sun swings high and south-west, so its light walks down the north and east walls
      hero.setProgress(uu);
      const wetK = smoothstep(0.3, 0.5, uu);
      if (CL) {
        const ck = smoothstep(0.36, 0.6, uu);
        sunCur.copy(sunCol).lerp(CL.sun, ck); fillCur.copy(fill).lerp(CL.fill, ck); skyECur.copy(skyE).lerp(CL.skyE, ck);
        hero.setSun(undefined, sunCur, undefined); hero.setSky(skyECur, undefined, fillCur);
        rig.sun.color.copy(CL.light0).lerp(CL.light, ck); rig.hemi.color.copy(CL.amb0).lerp(CL.amb, ck);
        for (let i = 0; i < wash.length; i++) wash[i][0].copy(wash[i][1]).lerp(wash[i][2], ck);
      }
      if (rare) {
        const k = smoothstep(0.72, 0.82, uu);
        sunNow.copy(sunDir0).lerp(sunRare, k).normalize();
        hero.setSun(sunNow, colT.copy(sunCur).lerp(sunColRare, k), sunI * (1 + k * (dusk ? 1.4 : 0.25)));
        hero.setShaft(22, -18, 46, k);                                     // one shaft on the north and east walls; pool and pavilion stay in shade
        shelfU.uTear.value = smoothstep(0.69, 0.78, uu); rays.uniforms.uIntensity.value = 0.34 * k * (1 - 0.7 * smoothstep(0.86, 0.94, uu));
      }
      hero.setCloud(lerp(34, 190, smoothstep(0.07, 0.2, uu)), 0.9 * (1 - smoothstep(0.15, 0.215, uu)));
      hero.update(dt, time, camera);
      // air: dust ochre to rain haze
      scene.fog.color.copy(fog0).lerp(fog1, wetK); scene.fog.density = lerp(look.dens0, look.dens1, wetK);
      rain.setOpacity(RAIN_OP * smoothstep(0.33, 0.47, uu));
      dust.setOpacity(DUST_OP * (1 - smoothstep(0.26, 0.42, uu)));
      leaves.setOpacity(LEAF_OP * smoothstep(0.12, 0.2, uu) * (1 - smoothstep(0.37, 0.47, uu)));
      streakU.uRain.value = smoothstep(0.38, 0.5, uu) * (rare ? 1 - 0.55 * smoothstep(0.78, 0.88, uu) : 1); streakU.uCam.value.copy(camP);
      frogU.uShow.value = smoothstep(0.4, 0.5, uu);
      // the eastern dust devil is laid by the rain that arrives from its side: it sinks, then is gone (meshes only, no light)
      devilA.uniforms.uBase.value.y = devilY0 - 70 * smoothstep(0.28, 0.42, uu); devilA.object.visible = uu < 0.43;
      // sky: the shelf slides overhead, two flickers in the wall
      shelfU.uEdge.value = lerp(1400, -560, smoothstep(0.03, 0.45, uu)); shelfU.uCam.value.copy(camP);
      const fA = flashAt(0, uu, 0.12, time), fB = flashAt(1, uu, 0.58, time), fl = Math.max(fA, fB);
      flashV.set(fA, fB); shelfU.uFlash.value = fl * 0.85;
      if (fB > 0) shelfU.uFlashPos.value.set(900, 380, 700); else shelfU.uFlashPos.value.set(1500, 380, -500);
      sky.update(dt, time, camera); rig.update(dt, time, camera); wall.position.set(camP.x, 0, camP.z);
      rig.hemi.intensity = hemi0 * (1 + 0.07 * fl);
      // wind: the gust front arrives at u 0.06
      const gust = smoothstep(0.03, 0.09, uu), breath = 0.5 + 0.5 * Math.sin(time * 0.6);
      windV.z = 0.7 + 1.45 * gust + 0.25 * breath;
      clothU.uGust.value = 0.35 + 0.95 * gust + 0.3 * breath; clothU.uU.value = uu;
      puffU.uFront.value = -20 - uu * 1600; puffU.uOpacity.value = 0.55 * smoothstep(0.012, 0.045, uu) * (1 - smoothstep(0.16, 0.26, uu));
      wispU.uOpacity.value = (lookId === 'dust' ? 0.34 : 0.22) * smoothstep(0.1, 0.19, uu) * (1 - smoothstep(0.36, 0.45, uu));
      terrain.update(dt, time); trees.update(dt, time, camera); crop.update(dt, time, camera); crop2.update(dt, time, camera); crop3.update(dt, time, camera); dryGrass.update(dt, time, camera); bayGrass.update(dt, time, camera); bushes.update(dt, time, camera); figs.update(dt, time, camera);
      mats.update(dt, time);
      fauna.update(dt, time, camera, uu); set.update(dt, time, camera);
      // the two peacocks that glide down across the well at u 0.3
      const gOn = uu > glideU[0] && uu < glideU[5];
      gliders.scale.setScalar(gOn ? 1 : 1e-4);
      if (gOn) {
        let gi = 0; while (gi < 4 && uu > glideU[gi + 1]) gi++;
        const gt = (gi + (uu - glideU[gi]) / (glideU[gi + 1] - glideU[gi])) / 5;
        glideCurve.getPoint(gt, glideP); glideCurve.getPoint(Math.min(1, gt + 0.01), glideQ);
        gliders.position.copy(glideP); gliders.position.y += Math.sin(time * 1.7) * 0.2;
        if (gt < 0.99) gliders.rotation.y = Math.atan2(glideQ.x - glideP.x, glideQ.z - glideP.z);
        gliders.rotation.z = Math.sin(time * 1.3) * 0.07;
      }
      // the parasol bowling down the lane, the door banging
      const px = -84 - ((time * 5.5 + 13) % 62);
      parasol.position.set(px, 1.0 + Math.abs(Math.sin(time * 4.1)) * 0.3, laneZ(px) + 1.4 + Math.sin(time * 1.3) * 0.9);
      parasol.rotation.set(0.3, 0.25, -time * 5.2);
      door.rotation.y = door.userData.rot + 0.8 + Math.sin(time * 2.3) * 0.6 + Math.sin(time * 5.9) * 0.12;
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 9000); path.pointAt(0, c0.position); c0.lookAt(0, 9, 20); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // the image's point of interest travels: the north wall's shrine over the pool until u 0.735, then across the east wall to the arch by 0.795
    const imageP = new THREE.Vector3();
    const imageAt = (time, u) => imageP.set(22, -56, -14).lerp(IMAGE_TO, smoothstep(0.735, 0.795, u));
    return {
      scene, path, duration: DUR,
      title: look.title + (rare ? ': the Torn Cloud' : monsoon ? ' (second week)' : ''),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 22, sway: 0.7, bank: 0.55 },
      pois: [
        { at: [-66, 4, 6], from: 0.0, to: 0.13, weight: 0.4, fade: 0.3 },                     // the gold gallery and its fallen bay
        { at: [4, -62, 2], from: 0.19, to: 0.33, weight: 0.62, fade: 0.35 },                 // the tip: the whole well, and the green coin with its lamps below
        { at: [59, 4, -59], from: 0.27, to: 0.435, weight: 0.66, fade: 0.25 },               // the gaze lifts to the corner tower against the storm
        { at: [-6, -54, 28], from: 0.40, to: 0.61, weight: 0.44, fade: 0.21 },                // round the corner and down the east wall: the pool before the arch, the portal's streak and its glow in the hall
        { at: [-16, -27, 38], from: 0.615, to: 0.71, weight: 0.4, fade: 0.25 },              // the pavilion's carving streaming past
        { at: imageAt, from: 0.675, to: 0.85, weight: 0.6, fade: 0.25 },                     // the image: the north wall and the rising pool, then the gaze leads the turn across the east wall to the arch
        { at: [0, -57, 10], from: 0.845, to: 0.9, weight: 0.3, fade: 0.3 },                  // the rising pool, then the portal takes over
      ],
      portal: { shape: 'circle', radius: 6.5, color: look.portal, glow: 1.1 },
      post: {
        exposure: look.exposure,
        bloom: { strength: 0.4, radius: 0.62, threshold: 0.92 },
        grade: { saturation: look.grade.saturation, contrast: look.grade.contrast, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.34, grain: 0.025, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); critMat.dispose(); },
    };
  },
};
