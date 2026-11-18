// THE CROSSING - late dry-season afternoon on the Mara River, lived from inside the herd.
//
// World space is the hero's local space (src/parts/mara-crossing.js, "The Fall"): the Fall's foot is at the
// origin, its face looks +Z across the river, the river in front of it flows +X, water level y = waterY.
// The river comes down from +Z along x ~ -84..-16, turns at the Fall and leaves toward +X. We run in from
// -X across the plain (y 11), down a gully to a lip in the upstream cut bank, leap, are carried left by the
// current across the front of the Fall, wade out on the inside bar and climb an exit gully to two figs.
//
// THE HERD IS A CONVEYOR: every animal is a slot on a lane baked into a float texture (one row per lane,
// one texel every 0.3 s of herd clock: xyz of the hooves + distance run; a second row: air, wet, speed).
// Herd clock = time-at-u (the pace table) plus a preview offset that only advances while u is 0. Column
// lanes are lateral offsets of the camera path, so the column keeps formation with the camera at any speed;
// the ten neighbours are authored slots on them. Leg phase = distance / stride: nothing skates.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as FL from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import { buildHero, DUST_GLSL, GLSL_COMMON, GLSL_FOGMIX, CLOUD_GLSL, ANIMAL_FRAG, WATER_GLSL, wildebeestGeometry, beastGeometry, SWIM_LV } from '../parts/mara-crossing.js';

const PAL = ['#E9B45A', '#C7A55E', '#9A6A45', '#2F2C2B', '#F3EDE0', '#8FB6D2', '#3F6B34'];
const PIV = 0.95, DUR = 42, LDT = 0.3, LW = 256, T0 = 15;          // lane texel step (s), texels per lane, seconds of lane before clock 0
const C3 = (h) => new THREE.Color(h);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- the looks (hour x weather), chosen by seed
const LOOKS = {
  golden: { hour: 'golden', weather: 'haze', zenith: '#6f9cc4', mid: '#9dbcd0', horizon: '#e6c88e', ground: '#b9975c', fog: '#dcc08c', fogK: 0.0021, gully: '#E9B45A', gullyK: 0.03,
    sunC: '#FFD9A0', sunI: 3.3, hemiSky: '#8c9fd6', hemiGnd: '#9A6A45', hemiI: 1.56, exposure: 0.92, tint: '#fff3e2', shadow: '#1a1630', sat: 1.08, clouds: 0.34, cloudLit: '#fff0d6', cloudShade: '#8a8fb0', grass: 0, mist: 0 },
  dawn: { hour: 'dawn', weather: 'haze', zenith: '#5f7fb8', mid: '#a9a9cc', horizon: '#f2bfae', ground: '#8a7a84', fog: '#c9b4c0', fogK: 0.0026, gully: '#b9b6d6', gullyK: 0.027,
    sunC: '#ffb9a2', sunI: 3.0, hemiSky: '#93a8dc', hemiGnd: '#7a6a70', hemiI: 1.69, exposure: 0.95, tint: '#fff0f2', shadow: '#141c38', sat: 1.05, clouds: 0.22, cloudLit: '#ffd9cc', cloudShade: '#7f88b4', grass: 0, mist: 1 },
  storm: { hour: 'golden', weather: 'storm', zenith: '#1c2244', mid: '#343c66', horizon: '#c9a070', ground: '#6a5c50', fog: '#6f7390', fogK: 0.0023, gully: '#E9B45A', gullyK: 0.032,
    sunC: '#ffcf8a', sunI: 3.6, hemiSky: '#5c68a8', hemiGnd: '#7a5a40', hemiI: 1.25, exposure: 0.98, tint: '#f6f2ff', shadow: '#14143a', sat: 1.12, clouds: 0.78, cloudLit: '#7c84a8', cloudShade: '#1c2038', grass: 0, mist: 0 },
  rains: { hour: 'golden', weather: 'rains', zenith: '#5d92c6', mid: '#92b8d6', horizon: '#dcd0a8', ground: '#9a9060', fog: '#cfc7a0', fogK: 0.0015, gully: '#e2bd78', gullyK: 0.018,
    sunC: '#FFD9A0', sunI: 3.3, hemiSky: '#8caade', hemiGnd: '#8a7a48', hemiI: 1.56, exposure: 0.92, tint: '#fff6e6', shadow: '#161a30', sat: 1.1, clouds: 0.46, cloudLit: '#fff4e0', cloudShade: '#7f8cae', grass: 0.6, mist: 0 },
  noon: { hour: 'noon', weather: 'rains', zenith: '#6aa0d8', mid: '#a6c6e2', horizon: '#e9e2c6', ground: '#b9a878', fog: '#e0d8ba', fogK: 0.0017, gully: '#e0c48a', gullyK: 0.022,
    sunC: '#fff5e6', sunI: 2.7, hemiSky: '#a8c4ea', hemiGnd: '#b08a60', hemiI: 1.62, exposure: 0.8, tint: '#fffaf0', shadow: '#1a1c2c', sat: 1.04, clouds: 0.3, cloudLit: '#ffffff', cloudShade: '#8a98b4', grass: 0.25, mist: 0 },
  dusk: { hour: 'dusk', weather: 'haze', zenith: '#4c5084', mid: '#b08a96', horizon: '#f2ac78', ground: '#80604e', fog: '#cc9e86', fogK: 0.0024, gully: '#d2a68c', gullyK: 0.028,
    sunC: '#ffb47c', sunI: 2.3, hemiSky: '#9488a8', hemiGnd: '#866650', hemiI: 1.88, exposure: 1.12, tint: '#fff4ea', shadow: '#1c1830', sat: 1.0, clouds: 0.3, cloudLit: '#ffc49a', cloudShade: '#6a5c80', grass: 0, mist: 0 },
};

// ---------------------------------------------------------------- 2D polyline helpers (river banks, tracks)
function makeLine(pts, reach = 0) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const n = pts.length - 1, ax = new Float64Array(n), az = new Float64Array(n), bx = new Float64Array(n), bz = new Float64Array(n), il = new Float64Array(n), acc = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) { ax[i] = pts[i][0]; az[i] = pts[i][1]; bx[i] = pts[i + 1][0] - ax[i]; bz[i] = pts[i + 1][1] - az[i]; const l2 = bx[i] * bx[i] + bz[i] * bz[i]; il[i] = 1 / Math.max(l2, 1e-9); acc[i + 1] = acc[i] + Math.sqrt(l2); }
  const out = { d: 0, s: 0, side: 1, i: 0 };
  // a point is only ever nearest to a few segments: each 16 m cell keeps (the first time it is asked) the segments that can be the nearest
  // to any point in it, in their own order, so the answer is the full scan's to the last bit
  const G = 16, cells = new Map(), dc = new Float64Array(n), DIAG = G * Math.SQRT2 + 1e-6;
  const cellOf = (cx, cz) => {
    const key = (cx + 8192) * 16384 + (cz + 8192); let c = cells.get(key); if (c) return c;
    const mx = (cx + 0.5) * G, mz = (cz + 0.5) * G; let m = 1e18;
    for (let i = 0; i < n; i++) {
      const px = mx - ax[i], pz = mz - az[i]; let t = (px * bx[i] + pz * bz[i]) * il[i]; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = px - bx[i] * t, dz = pz - bz[i] * t, d = Math.sqrt(dx * dx + dz * dz); dc[i] = d; if (d < m) m = d;
    }
    let k = 0; for (let i = 0; i < n; i++) if (dc[i] <= m + DIAG) k++;
    c = new Uint16Array(k); k = 0; for (let i = 0; i < n; i++) if (dc[i] <= m + DIAG) c[k++] = i;
    cells.set(key, c); return c;
  };
  // distance to the polyline, arc length of the nearest point, side (+1 = left of the direction of travel... cross sign)
  const near = (x, z) => {
    if (reach > 0 && (x < x0 - reach || x > x1 + reach || z < z0 - reach || z > z1 + reach)) { out.d = 1e9; return out; }
    let best = 1e18, bi = 0, bt = 0;
    const c = cellOf(Math.floor(x / G), Math.floor(z / G)), nc = c.length;
    for (let j = 0; j < nc; j++) {
      const i = c[j], px = x - ax[i], pz = z - az[i]; let t = (px * bx[i] + pz * bz[i]) * il[i]; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = px - bx[i] * t, dz = pz - bz[i] * t, d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; bt = t; }
    }
    out.d = Math.sqrt(best); out.i = bi; out.s = acc[bi] + bt * (acc[bi + 1] - acc[bi]);
    out.side = (bx[bi] * (z - az[bi]) - bz[bi] * (x - ax[bi])) >= 0 ? 1 : -1;     // +1 when the point is to the right (x->z turn) of the segment
    return out;
  };
  return { near, length: acc[n], pts };
}
// smooth a coarse polyline with a Catmull-Rom curve and resample it
function smoothLine(pts, step = 6) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'), n = Math.max(4, Math.round(c.getLength() / step)), out = [], v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { c.getPointAt(i / n, v); out.push([v.x, v.z]); }
  return out;
}

// ---------------------------------------------------------------- the lie of the land
// Everything the terrain, the lanes and the dressing need to agree on: the camera path, the river's two banks,
// the gullies, the pace table and the herd clock.
function makeLayout(ctx, hero, W) {
  const rng = ctx.rng.fork('layout'), A = hero.anchors, sh = A.shape, zFoot = A.fall.center[2];
  const j = (a) => rng.range(-a, a);
  // camera path: plain, gully, lip, leap, swim past the Fall, bar, exit gully. The gully bends left so that the leap already aims
  // downstream at the Fall; the swim runs on along its face 31 m out and only then turns right to the bar, so the Fall stays near the
  // direction of travel (the steady camera looks 58 m down the route and is pulled only a third as far by a point of interest)
  const hdl = Math.hypot(0.985, 0.17), hd = [0.985 / hdl, -0.17 / hdl], lip = [-83.5 + j(1.5), 6.5 + W, 41.5 + j(2)];
  const zs = Math.max(33.5, zFoot + 29) + j(1.2);                             // the swim's closest line to the Fall
  const gy = j(5), gb = j(4);
  const swim = [[-38, 0.7 + W, zs + 0.4], [-21, 0.7 + W, zs], [-4, 0.7 + W, zs], [20, 0.7 + W, zs + 1.2], [33, 0.7 + W, zs + 9.5], [42.5, 0.72 + W, zs + 19.8]];
  const bar = [[50, 1.2 + W, 66.2], [61, 2.3 + W, 73.2], [73, 3.0 + W, 79.7], [88, 3.75 + W, 85.7], [103, 4.5 + W, 91.7]];
  // the way in: the first 58 m run dead straight at the foot of the dust plume that stands over the Fall, so the column, the two arms
  // closing on it and the plume itself share the frame; then the way swings right to the gully's mouth. The gully's floor starts down
  // at its mouth and is three and a half metres below the plain a third of the way to the lip.
  const pA = [-240.6, 12.5, -3.6 + gy], pf = A.plume, aim = [lerp(pf.base[0], pf.top[0], 0.25) - pA[0], lerp(pf.base[2], pf.top[2], 0.25) - pA[2]], al = Math.hypot(aim[0], aim[1]);
  const pMouth = [-213, 12.5, 3.5 + gy * 0.8], pCut = [-186, 10.7, 13 + gy * 0.5 + gb * 0.3];
  const P = [
    [pA[0] - 76.4 * aim[0] / al, 12.5, pA[2] - 76.4 * aim[1] / al], [pA[0] - 18 * aim[0] / al, 12.5, pA[2] - 18 * aim[1] / al], pA, pMouth, pCut, [-160, 8.9, 24 + gb], [-135, 8.0, 32.5 + gb * 0.8], [-114, 7.5, 38.6 + gb * 0.4],
    [lip[0] - 14.5, 7.2 + W * 0.6, lip[2] + 1.6], lip,
    [lip[0] + 8 * hd[0], 6.35 + W, lip[2] + 8 * hd[1]], [lip[0] + 16 * hd[0], 4.95 + W, lip[2] + 16 * hd[1]], [lip[0] + 23 * hd[0], 2.95 + W, lip[2] + 23 * hd[1]], [lip[0] + 29.5 * hd[0], 1.05 + W, lip[2] + 29.5 * hd[1]],
    ...swim, ...bar,
  ];
  const TAIL = 13.5, e0 = P[P.length - 1], ed = new THREE.Vector3(0.927, 0, 0.375).normalize().multiplyScalar(Math.cos(0.052)).setY(Math.sin(0.052));
  for (const d of [TAIL, 2 * TAIL, 3 * TAIL]) P.push([e0[0] + ed.x * d, e0[1] + ed.y * d, e0[2] + ed.z * d]);
  const path = makePath(P);
  const L = path.length, v = new THREE.Vector3(), tv = new THREE.Vector3();
  // arc-length marks
  const NS = 480, px = new Float64Array(NS + 1), py = new Float64Array(NS + 1), pz = new Float64Array(NS + 1);
  for (let i = 0; i <= NS; i++) { path.posAtDist((i / NS) * L, v); px[i] = v.x; py[i] = v.y; pz[i] = v.z; }
  const sOf = (x, z) => { let b = 1e18, bi = 0; for (let i = 0; i <= NS; i++) { const dx = px[i] - x, dz = pz[i] - z, d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } } return (bi / NS) * L; };
  const sLip = sOf(lip[0], lip[2]), sGully = sOf(pMouth[0], pMouth[2]) + 4, sSplash = sLip + 30, sAbeam = sOf(swim[2][0], swim[2][2]), sWade = sOf(swim[5][0], swim[5][2]) - 2, sLand = sOf(bar[0][0], bar[0][2]), sBar = sOf(bar[1][0], bar[1][2]), sExit = sOf(bar[2][0], bar[2][2]);
  // the path as a 2D polyline for fast lateral distances (s, signed lateral: + = right of travel)
  const pl = []; for (let i = 0; i <= 120; i++) { path.posAtDist(-160 + (i / 120) * (L + 230), v); pl.push([v.x, v.z]); }
  const pline = makeLine(pl);
  const pathNear = (x, z) => { const o = pline.near(x, z); o.s -= 160; return o; };
  const pathY = (s) => { const f = clamp(s / L, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(f)); return py[i] + (py[i + 1] - py[i]) * (f - i) + (s > L ? (s - L) * ed.y : 0); };
  // river: outer (cut) bank = the hero's lip line, continued; inner bank = the bar
  const outer = [[-128, 420], [-104, 300], [-90, 200], [-85, 120], [-84.5, 78], [lip[0] + 0.5, lip[2] + 6], [lip[0] + 0.6, lip[2] - 6], [-81, 33], [-75, 24.5], [-66, sh.lipZ(-66) + 0.8]];
  for (let x = -60; x <= 60; x += 4) outer.push([x, sh.lipZ(x)]);
  outer.push([66, sh.lipZ(66) + 0.5], [78, sh.lipZ(66) + 5], [100, sh.lipZ(66) + 9], [135, sh.lipZ(66) + 5], [180, sh.lipZ(66) - 14], [250, sh.lipZ(66) - 60], [330, sh.lipZ(66) - 130]);
  const inner = smoothLine([[-28, 420], [-18, 300], [-15.5, 200], [-15, 130], [-13, 97], [-7, 77], [5, 66.5], [24, 63], [50, 66], [80, 75], [118, 82], [165, 66], [240, 16], [330, -56]], 15);
  const oLine = makeLine(outer), iLine = makeLine(inner);
  // pace: fast on land, a held leap, slow in the water. Across the plain it rises to the gully's own mouth, and from the mouth it runs
  // out to the gully's pace over the first forty metres between the walls
  const paceAt = (u) => {
    const s = u * L;
    let p = lerp(1.12, 1.28, sstep(0, sGully, s));
    p = lerp(p, 1.55, sstep(sGully, sGully + 40, s));
    p = lerp(p, 1.3, sstep(sLip - 12, sLip + 4, s));
    p = lerp(p, 0.56, sstep(sSplash - 6, sSplash + 8, s));
    p = lerp(p, 0.8, sstep(sWade, sBar, s));
    p = lerp(p, 1.06, sstep(sBar, sExit + 20, s));
    return p;
  };
  // the engine's own pace integral (64 steps, clamped), so the herd clock is the real time-at-u
  const NP = 64, pp = new Float64Array(NP + 1); for (let i = 0; i <= NP; i++) pp[i] = clamp(paceAt(i / NP), 0.35, 2.5);
  const NT = 512, tOfU = new Float64Array(NT + 1); let inv = 0;
  const pAt = (u) => { const x = clamp(u, 0, 1) * NP, i = Math.min(NP - 1, Math.floor(x)); return pp[i] + (pp[i + 1] - pp[i]) * (x - i); };
  for (let i = 1; i <= NT; i++) { inv += 1 / pAt((i - 0.5) / NT) / NT; tOfU[i] = inv; }
  for (let i = 0; i <= NT; i++) tOfU[i] *= DUR / inv;
  const v0 = (L / DUR) * pAt(0) * inv, v1 = (L / DUR) * pAt(1) * inv;                 // speed at both ends (m/s)
  const timeAtU = (u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return tOfU[i] + (tOfU[i + 1] - tOfU[i]) * (x - i); };
  // path distance at herd clock t (extrapolated at the end speeds before 0 and after DUR)
  const distAtTime = (t) => {
    if (t <= 0) return t * v0; if (t >= DUR) return L + (t - DUR) * v1;
    let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tOfU[m] <= t) lo = m; else hi = m; }
    return ((lo + (t - tOfU[lo]) / Math.max(1e-6, tOfU[hi] - tOfU[lo])) / NT) * L;
  };
  const uOfS = (s) => s / L;
  return { path, L, P, lip, hd, ed, v0, sLip, sGully, sSplash, sAbeam, sWade, sLand, sBar, sExit, pathNear, pathY, oLine, iLine, paceAt, timeAtU, distAtTime, uOfS, zFoot, sh, zs,
    posAt: (s, out) => path.posAtDist(s, out), tanAt: (s, out) => path.tangentAtDist(s, out), tv };
}

// the gaze on the Fall: from the lip until we are abeam of it. The point looked at slides downstream along the face as we pass, so the
// camera never has to look back over its shoulder; on a rare visit it turns to the slab while the slab comes down.
const FALL_U = [0.5, 0.705], SLAB_U = [0.578, 0.614];
const U_LUNGE = 0.66, U_YAWN = 0.69;                           // the brief's two beats in the river, at its own marks
function fallGaze(Y, hero, W, rare) {
  const A = hero.anchors, at = new THREE.Vector3(), slab = new THREE.Vector3(A.slab[0] + 3, W + 5, A.slab[2] + 3);
  const cam = new THREE.Vector3(), zF = Y.zFoot - 1;
  const look = (time, u) => {
    const uu = u ?? 0; Y.path.posAtDist(uu * Y.L, cam);
    // the point looked at runs along the face ahead of us, so the Fall sits left of centre with the swimmers ahead still in the picture
    at.set(clamp(cam.x + 22, lerp(6, -8, sstep(0.55, 0.59, uu)), 21), W + lerp(8.5, 6.5, sstep(0.52, 0.6, uu)), zF);
    return at; };
  // six pulls, not one: the steady camera takes each at 0.35 of its weight, so six of 0.32 bring the sweeping camera 0.9 of the way
  // to the point (which is placed with that in mind) and the steady camera half way, where one large pull would leave it at 0.3:
  // the Fall stays in the steady frame for the whole pass
  const pois = [0, 1, 2, 3, 4, 5].map(() => ({ from: FALL_U[0], to: FALL_U[1], weight: 0.3187, at: look }));
  // the rare slab: one pull of its own (the sweeping camera turns to it, the steady one barely), from the first crack until the dust has spread
  if (rare) pois.push({ from: SLAB_U[0] - 0.018, to: SLAB_U[1] + 0.031, weight: 0.55, at: slab });
  return pois;
}

// the exit gully: five metres of floor either side of us with a cut wall on each hand, opening a little at its head to let the herd round
// the ring. Both banks stand from the bar's head on, four metres at their highest and two where the figs stand on them.
const exitHW = (Y, s) => 5 + 3.6 * sstep(Y.L - 30, Y.L - 8, s) + 8 * (1 - sstep(Y.sBar - 10, Y.sExit + 6, s));
const exitRim = (Y, s, side) => sstep(Y.sBar + 3, Y.sExit + 12, s) * lerp(4.0, 1.9, sstep(Y.L - 40, Y.L - 10, s));
const FIG_LAT = 11.9;
// ---------------------------------------------------------------- land: height, trample and colour functions
function makeLand(ctx, Y, hero, W, look) {
  const nz = ctx.noise, sh = Y.sh, half = sh.half, rng = ctx.rng.fork('land');
  const zB = (x) => sh.zBack + 3 * nz.n2(x * 0.03, 4.2);
  // tracks of the other arms of the herd (2D centre lines): three feed the Fall, two leave the far bar
  const jx = () => rng.range(-10, 10);
  const tracks = [
    smoothLine([[-330, -64 + jx()], [-250, -60 + jx()], [-170, -64 + jx()], [-100, -72], [-42, -76], [-12, -64], [-5, sh.zBack - 2]], 14),
    smoothLine([[-190 + jx(), -270], [-130 + jx(), -205], [-70, -150], [-24, -100], [1, sh.zBack - 2]], 14),
    smoothLine([[190 + jx(), -250], [120 + jx(), -190], [62, -135], [24, -92], [8, sh.zBack - 2]], 14),
    smoothLine([[8, 63], [18, 72], [30, 80], [45, 87], [62, 93.5], [100, 104], [150, 122], [200, 150]], 9),
  ].map((l) => makeLine(l, 10));
  const figs = [-1, 1].map((sd) => { const p = Y.posAt(Y.L - 1.5, new THREE.Vector3()), t = Y.tanAt(Y.L, new THREE.Vector3()); return [p.x - t.z * sd * FIG_LAT, p.z + t.x * sd * FIG_LAT, sd]; });
  const o = { h: 0, tr: 0, kind: 0, lat: 0, s: 0, dO: 0, dI: 0, wall: 0, hw: 99, side: 1 };
  // kind: 0 plain, 1 river, 2 bar/peninsula
  const sample = (x, z) => {
    const O = Y.oLine.near(x, z), dO = O.d, sO = O.side;
    const I = Y.iLine.near(x, z), dI = I.d, sI = I.side;
    const Pn = Y.pathNear(x, z), lat = Pn.d, s = Pn.s;
    const inRiver = sO > 0 && sI < 0;
    const roll = 1.5 * nz.fbm2(x / 150 + 3.1, z / 150, 3) + 0.25 * nz.n2(x / 23, z / 23);
    const far = Math.hypot(x + 60, z - 20), hills = 26 * sstep(330, 900, far) * (0.55 + 0.45 * nz.fbm2(x / 420, z / 420 + 7, 3));
    let h, kind = 0, tr = 0, wall = 0, hwO = 99, trO = 0;
    if (inRiver) {
      kind = 1;
      h = W - Math.min(3.0, 0.5 + dO * 0.9, 0.05 + Math.min(dI, 11) * 0.05 + sstep(11, 14.5, dI) * 0.75 + Math.max(0, dI - 12) * 0.12);       // a shelf off the bar: they find their feet 10 m out
    } else if (sO <= 0 && (sI <= 0 || dO < dI)) {
      // the outer plain and its cut bank
      const mx = 1 - sstep(48, 53, Math.abs(x)), zl = sh.lipZ(x), inFoot = mx * sstep(zB(x) - 2, zB(x) + 1, z) * (z < zl + 8 ? 1 : 0);
      let plain = 11 + roll + hills;
      const heroTop = sh.topY(x), nearFoot = (1 - sstep(56, 80, Math.abs(x))) * sstep(sh.zBack - 60, sh.zBack - 16, z) * (1 - sstep(zl + 2, zl + 30, z));
      plain = lerp(plain, heroTop, nearFoot);
      plain = lerp(plain, sh.lipY(x) - 0.6, inFoot);
      const back = 1.7 * mx;
      h = W - 0.6 + (plain - W + 0.6) * Math.pow(clamp((dO - back) / 2.3, 0, 1), 0.5);
      if (dO < 3.5 + back) wall = 1;
      tr = Math.max(tr, (1 - sstep(half + 2, half + 12, Math.abs(x))) * sstep(sh.zBack - 90, sh.zBack - 20, z) * (z < zl + 2 ? 1 : 0)); trO = tr;
    } else {
      // the inside bar and the peninsula behind it
      kind = 2;
      const n = 1.5 * nz.n2(x / 17, z / 17), bar = W - 0.05 + Math.min(dI, 14) * 0.11;
      const pen = W + 7 + 7 * sstep(12, 62, dI) + roll * 0.6 + hills;
      const k = sstep(9 + n, 40 + n, dI);
      h = lerp(bar, pen, k);
    }
    // our tracks: the trampled way over the plain, the gully, the exit gully
    if (kind !== 1) {
      if (s < Y.sLip + 3) {
        const floor = Y.pathY(s) - 1.5;
        if (s > Y.sGully - 30) {
          const hw = lerp(6.6, 4.9, sstep(Y.sGully, Y.sLip - 30, s)) + 14 * (1 - sstep(Y.sGully - 30, Y.sGully + 22, s)) + 0.5 * nz.n2(s * 0.09, Pn.side * 3.3);
          hwO = hw; const e = lat - hw - 2.4, g = floor + (e <= 0 ? 0 : Math.min(e * 5.5, 1.3 + e * 2.7) + 0.55 * nz.n2(s * 0.16 + Pn.side * 9, e * 0.9) * Math.min(1, e));
          if (g < h) { h = g; if (e > 0.02) wall = 1; }
          if (e < 0.6) tr = 1;
        }
        if (kind === 0 && s < Y.sGully + 8) h = lerp(Math.min(h, floor), h, sstep(7, 24, lat));
        { const e = sstep(36, 96, s); tr = Math.max(tr, 1 - sstep(lerp(0, 1.2, e), lerp(0.4, 4.6, e), lat)); }       // (where we come in the way is not yet beaten wide: a braid of trails one animal broad through the grass, see trailAt)
      } else if (s > Y.sBar - 14) {
        const floor = Y.pathY(s) - 1.5, hw = exitHW(Y, s);
        hwO = hw; if (h < floor && lat < hw + 12) h = lerp(floor, h, sstep(hw - 1, hw + 12, lat));
        const e = lat - hw - 2.4, ramp = e <= 0 ? 0 : Math.min(e * 5.5, 1.3 + e * 2.7), g = floor + ramp + (e <= 0 ? 0 : 0.55 * nz.n2(s * 0.16 + Pn.side * 9, e * 0.9) * Math.min(1, e));
        if (g < h) { h = g; if (e > 0.02) wall = 1; }
        // the shoulders: where the land beside the cut lies lower than the bank should stand, the bank is built up: a levee four metres wide
        // on top that falls away behind over ten
        if (e > 0) { const rim = exitRim(Y, s, Pn.side), sh = floor + Math.min(ramp, rim * (1 + 0.1 * nz.n2(s * 0.11 + Pn.side * 5, e * 0.3))) * (1 - sstep(4, 14, e)); if (sh > h) { h = sh; if (ramp < rim) wall = 1; } }
        if (e < 0.6) tr = Math.max(tr, 1 - sstep(1.0, 3.4, lat), sstep(-1.2, 0.3, e) * 0.6);       // the exit's floor is grass but for our own track and the foot of its walls
      }
      for (const t of tracks) { const q = t.near(x, z); if (q.d < 9) { trO = Math.max(trO, 1 - sstep(3.2, 8.5, q.d)); tr = Math.max(tr, trO); } }
    }
    o.h = h; o.tr = tr; o.kind = kind; o.lat = lat; o.s = s; o.dO = dO; o.dI = dI; o.wall = wall; o.side = Pn.side; o.hw = hwO; o.trO = trO;
    return o;
  };
  const height = (x, z) => sample(x, z).h;
  // albedo of the ground (linear): straw and rust grass, ochre earth where trampled, strata on cut faces, mud on the bar
  const RGB = (r, g, b) => new THREE.Color(r, g, b);
  const cStraw = RGB(0.58, 0.49, 0.29), cRust = RGB(0.52, 0.39, 0.22), cEarth = RGB(0.48, 0.37, 0.24), cOchre = RGB(0.52, 0.38, 0.25), cRed = RGB(0.46, 0.29, 0.19),
    cPale = RGB(0.62, 0.55, 0.42), cMud = RGB(0.24, 0.2, 0.155), cSand = RGB(0.55, 0.49, 0.38), cGreen = RGB(0.25, 0.33, 0.13), cBed = RGB(0.15, 0.11, 0.07);
  const tmp = new THREE.Color();
  const color = (x, z, h, ny, out) => {
    const q = sample(x, z), n1 = nz.n2(x * 0.045 + 9, z * 0.045), n2 = nz.n2(x * 0.21, z * 0.21);
    out.copy(cStraw).lerp(cRust, 0.55 * sstep(-0.25, 0.65, n1));
    if (look.grass > 0) out.lerp(cGreen, look.grass * sstep(-0.5, 0.4, nz.n2(x * 0.02, z * 0.02 + 5)));
    out.multiplyScalar(0.86 + 0.24 * n2);
    out.lerp(tmp.copy(cEarth).multiplyScalar(0.9 + 0.16 * n2), q.tr * 0.92);
    if (q.kind === 1) out.copy(cBed);
    else if (q.kind === 2) { const mud = 1 - sstep(10, 15, q.dI); out.lerp(tmp.copy(cSand).lerp(cMud, sstep(-0.3, 0.5, n2) * 0.7 + 0.3 * (1 - sstep(0, 5, q.dI))), mud); }
    const steep = 1 - sstep(0.55, 0.82, ny);
    if (steep > 0) {
      const w = h + 1.1 * nz.n2(x * 0.035, z * 0.035), band = nz.n2(7.7, w * 0.5);
      tmp.copy(cOchre).lerp(cRed, clamp(0.45 + 0.7 * band, 0, 1)); tmp.lerp(cPale, 0.4 * Math.max(0, 1 - Math.abs(w - 7.4) / 0.8));
      out.lerp(tmp, steep);
    }
    if (h < W + 0.9 && q.kind !== 1) out.multiplyScalar(lerp(0.6, 1, sstep(W + 0.1, W + 0.9, h)));
    return out;
  };
  return { sample, height, color, tracks, figs, zB };
}

// the trails on the run in: our own, half a metre either side of the line we run, and the trails of the lines beside us weaving through the
// grass; they merge into the one beaten way between 36 and 96 m from the ring. slat: metres to the right of our line; s: metres along it.
// (BRAID: each trail's lateral place, how far it wanders, how fast, and its phase; the ground's shader draws the same six.)
const BRAID = [[2.5, 0.5, 0.11, 0.3], [-2.6, 0.55, 0.09, 2.1], [4.3, 0.7, 0.07, 4.0], [-4.5, 0.6, 0.08, 1.2], [6.6, 0.8, 0.06, 5.2], [-6.9, 0.8, 0.05, 3.3]];
const trailAt = (s, slat) => {
  let w = 1 - sstep(0.3, 0.8, Math.abs(slat));
  for (const c of BRAID) w = Math.max(w, 0.9 * (1 - sstep(0.22, 0.6, Math.abs(slat - c[0] - c[1] * Math.sin(s * c[2] + c[3])))));
  return w * (1 - sstep(36, 96, s));
};

// ---------------------------------------------------------------- lanes: the conveyor, baked into a float texture
const NCOL = 22;                                         // column lanes (the last three are the lane dead ahead of us, see CENTRE): the flankers' pair, two pairs outside them, an outer pair that makes the column a river,
                                                         // and three of them again swinging wide in the shallows: the flankers' pair (whoever wades within a second of us rides
                                                         // these, by the herd's rule that the shallows spread the lines) and the two lines our authored company swims in (it leaves the water wide of us, up the bank)
const LEAP_LAT = [-0.4, -3.4], LEAP_SHIFT = [9.6, 11.6, 4, 5.5, 0, 2, 1, 3.2, 9.6, 11.6, 4, 0, 0, 2.5, 1.2, 3.4, 4.4, 1.8, 0.6, 2.6, 1.4, 2.2], LEAP_O = [0.33, 0.52];     // the flankers at the leap: lateral shift (left, right), how much further each lane leaps, the clock lead of the two nearest
const FIRST_O = [0.9, 0.94, 1.0, 0.92, 1.1, 1.3, 1.22, 1.42];
const partAt = (u) => 1 - sstep(0.035, 0.085, u);          // the column closes round us between these two marks
// how far aside an animal oe seconds ahead of us stands while the column is parted (the shader's own rule, see laneTime)
const partG = (oe) => Math.max(1 - sstep(0.66, 0.84, oe), 0.8 * (1 - sstep(0.86, 5.2, oe)));
// PART: how far every line of the column stands aside at the ring we come in by. The innermost line runs 2.4 m from ours, so there it is
// 15.7 m off: the brief's "nothing is within 15 m" holds for every animal of the column by where its line lies, whoever it is.
const PART = 13.3, PART_FUNNEL = 8;
const LEAD = [-1.1, 1.1, 0.12, -2.85, 2.85, 3.72, 4.6, -3.73, -4.9, 5.4];      // our company on land only: three lead lines either side of the lane dead ahead (which stays open), four lines between the others', and three
                                                         // (FUNNEL) that run wide of the column on the plain and close on it at the gully's mouth, so that between the walls the floor is
                                                         // backs from wall to wall. They hold their places 8 to 25 m ahead of us down the gully, bolt for the lip in the last thirty
                                                         // metres, go over it ahead of us and under where they land: the company in the water is the authored one
const FUNNEL = [-3.73, -4.9, 5.4], FUNNEL_OUT = 20;
const DRY_T = 14, SHK = [1.4, 7.6];                                        // seconds a coat stays wet out of the river (it steams and is shaken dry on the way up the exit)
const COL_LO = -3, COL_SPAN = 18.5;                      // column slots live at clock offsets -3 .. +15.5 s from the camera
const leadLat = (ab) => (ab > 1 ? 2.45 : 2.9);            // the lead lines run in the flankers' own lines, and one a shoulder further out on our right
function bakeLanes(ctx, Y, land, W) {
  const lanes = [], v = new THREE.Vector3(), t = new THREE.Vector3();
  // the flankers' lines and the lead lines breathe: each side's runs a little ahead of its station and a little behind it, turn about, as a
  // running herd does: a third of a second either way, over six to nine seconds of the herd's clock, the same law from the ring to the figs
  // (a stream of its own; the lead lines run nose to tail in the flankers' lines, so each side's lines keep one beat)
  const ws = ctx.core.makeRng(ctx.core.hashSeed('lead-wander:' + ctx.seed));
  const WAN = [0, 1].map(() => ({ a: ws.range(0.3, 0.36), w: 6.2832 / ws.range(6, 9), p: ws() * 6.2832 }));
  const wander = (side, tc) => { const q = WAN[side > 0 ? 1 : 0]; return q.a * Math.sin(tc * q.w + q.p); };
  const breathes = (b) => { const ab = Math.abs(b); return ab < 2 || (ab > 2.39 && ab < 2.42); };
  const finish = (pts) => {            // pts[k] = [x, feetY, z, air]
    const a = new Float32Array(LW * 4), b = new Float32Array(LW * 4); let d = 0, wet = 0;
    for (let k = 0; k < LW; k++) {
      const p = pts[Math.min(k, pts.length - 1)], q = pts[Math.min(k + 1, pts.length - 1)];
      if (k > 0) { const o = pts[Math.min(k - 1, pts.length - 1)]; d += Math.hypot(p[0] - o[0], p[2] - o[2]); }
      if (p[1] < W - 0.45) wet = 1; else wet = Math.max(0, wet - LDT / DRY_T);               // a coat dries in a few seconds of running
      a.set([p[0], p[1], p[2], d], k * 4); b.set([p[3], wet, Math.hypot(q[0] - p[0], q[2] - p[2]) / LDT, p[3] < 0.5 && p[1] > W + 0.15 ? 1 : 0], k * 4);   // aux: air, wet, speed, hooves on dry land
    }
    lanes.push({ a, b }); return lanes.length - 1;
  };
  // column lanes: lateral offsets of the camera path (base b, + = right of travel)
  // part: the column stands apart round the ring we come in by (the way to the plume is open, and we see flanks, not rumps) and closes
  // round us again, the inner pair first. Each column lane is baked twice, parted and not: seen through a portal from far off the
  // column runs up the lane inside the opening, and it parts as the viewer comes up to the ring (uPart), every hoof on its own ground
  const colLat = (b, s, part) => {
    const ab = Math.abs(b), sg = Math.sign(b);
    if (ab < 2) {                                                                              // the lead lines: two and a half metres and more either side of our own line, so the lane dead ahead is open
      let l = leadLat(ab);                                                                      // (beaten earth and the plume's foot between two lines of rumps); at the ring they stand apart as the two arms of a V
      if (part) l += PART * (1 - sstep(48, 84, s));
      return sg * l;
    }
    let sc = lerp(1.5, 1, sstep(Y.sGully - 30, Y.sGully + 12, s));                              // spread on the plain, squeezed in the gully
    sc = lerp(sc, 1, sstep(Y.sLip + 6, Y.sSplash + 14, s));                                    // and packed again in the water: the heads round us are within a body length
    // between the walls the lanes close up so that the outer pair still has room (the floor's half width, less a shoulder)
    const hw = s < Y.sLip + 12 ? (s > Y.sGully - 30 ? lerp(6.6, 4.9, sstep(Y.sGully, Y.sLip - 30, s)) + 14 * (1 - sstep(Y.sGully - 30, Y.sGully + 22, s)) - 0.35 : 99) : s > Y.sBar - 14 ? exitHW(Y, s) : 99;
    sc = Math.min(sc, lerp(Math.max(0.45, (hw - 0.62 - 2.4) / 2.6), 9, sstep(Y.sLip - 4, Y.sLip + 10, s)));
    let l = 2.4 + (ab - 2.4) * sc;
    if (FUNNEL.includes(b)) l += FUNNEL_OUT * (1 - sstep(Y.sGully - 50, Y.sGully - 10, s));
    if (part) l += (FUNNEL.includes(b) ? PART_FUNNEL : PART) * (1 - sstep(48, 84, s));                      // (every line stands the same way aside: the arms of the V are files side by side)
    // at the leap the flank lines bunch on our own line: the break in the lip is narrow and they go over it shoulder to shoulder
    if (ab < 2.5) l += (sg < 0 ? LEAP_LAT[0] : LEAP_LAT[1]) * sstep(Y.sLip - 16, Y.sLip + 3, s) * (1 - (sg < 0 ? sstep(Y.sSplash + 12, Y.sSplash + 30, s) : sstep(Y.sSplash + 2, Y.sSplash + 13, s)));
    // wading out, the lines open: where hooves find bottom each line takes its own way up the bar, a body's length and more apart
    // (the lines on our left, the outside of the turn for the bar, stand off furthest; the wide pair stays wide until it is up the bank)
    if (ab > 2.405 && ab < 2.45) l += (sg < 0 ? 10.6 : 8.2) * sstep(Y.sWade - 16, Y.sWade + 3, s) * (1 - sstep(Y.sExit + 2, Y.sExit + 24, s));
    else if ((ab > 3.305 && ab < 3.32) || (ab > 4.155 && ab < 4.17)) l += (ab < 4 ? 10 : 12.5) * sstep(Y.sWade - 12, Y.sWade + 4, s);
    else l += (ab < 2.5 ? 1.2 : sg < 0 ? 3.0 + (ab - 3.3) * 1.4 : 1.2 + (ab - 2.4) * 0.75) * sstep(Y.sWade - 16, Y.sWade + 3, s) * (1 - sstep(Y.sBar - 4, Y.sExit + 5, s))
      + (sg < 0 && ab > 2.5 ? 2.8 * sstep(Y.sWade - 10, Y.sWade + 4, s) * (1 - sstep(Y.sWade + 8, Y.sWade + 18, s)) : 0);        // (widest where they first find their feet)
    l = lerp(l, Math.max(l, 6.75 + Math.min(ab - 2.4, 2.6) * 0.5), sstep(Y.L - 17, Y.L - 4, s));                 // and part round the ring, between it and the root-hung walls
    return sg * l;
  };
  // shift: this lane leaps that many metres further than the camera does, so its animals are still in the air beside and ahead of us
  // when we come down
  // lead: seconds a lane runs ahead of its station. The lead lines bolt for the lip; they and the flankers' lines breathe (wander)
  const tW0 = Y.timeAtU((Y.sLip - 22) / Y.L), tW1 = Y.timeAtU((Y.sLip + 4) / Y.L), tG0 = Y.timeAtU((Y.sGully - 10) / Y.L), tG1 = Y.timeAtU((Y.sGully + 22) / Y.L);
  const baked = new Map();                                     // the parted bake of each lane: where the arms have closed (84 m on) the other bake is the same points
  const column = (b, shift = 0, part = true, centre = false) => {
    const pts = [], br = breathes(b), key = b + ':' + shift + ':' + centre, was = part ? null : baked.get(key);
    if (part) baked.set(key, pts);
    for (let k = 0; k < LW; k++) {
      const tc = -T0 + k * LDT, s = Y.distAtTime(tc + (centre ? 0.68 * sstep(tW0, tW1, tc) - 0.08 * sstep(tG0, tG1, tc) : 0) + (br ? wander(b, tc) : 0));
      if (was && s > 84.5) { pts.push(was[k]); continue; }
      Y.posAt(s, v); Y.tanAt(s, t);
      const il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)), lat = colLat(b, s, part), x = v.x - t.z * il * lat, z = v.z + t.x * il * lat;
      const g = land.height(x, z); let y = Math.max(g, W - 1.14), air = 0;
      const sa = s - shift * sstep(Y.sLip - 1, Y.sLip + 7, s);
      if (s > Y.sLip - 2 && sa < Y.sSplash + 3) { const arc = Y.pathY(sa) - 1.5 - 0.04 * Math.abs(lat); if (arc > y + 0.02) { if (arc > g + 0.3 && s > Y.sLip - 0.5 && arc > W + 0.05) air = 1; y = arc; } }
      if (centre && s > Y.sSplash) y = Math.min(y, W - 1.2 - 3.6 * sstep(Y.sSplash, Y.sSplash + 5, s));          // they go under where they land, and stay under
      pts.push([x, y, z, air]);
    }
    return finish(pts);
  };
  // free lanes: run a 2D polyline at their own speed (slow in water), ending after `len` seconds
  const free = (line, lat, speed, swim = 2.7) => {
    const pts = []; let s = 0, guard = 0;
    while (s < line.length && pts.length < LW - 2 && guard++ < 4000) {
      const f = s / line.length * (line.pts.length - 1), i = Math.min(line.pts.length - 2, Math.floor(f)), a = line.pts[i], b = line.pts[i + 1], fr = f - i;
      const dx = b[0] - a[0], dz = b[1] - a[1], il = 1 / Math.max(1e-4, Math.hypot(dx, dz));
      const x = a[0] + dx * fr - dz * il * lat, z = a[1] + dz * fr + dx * il * lat, g = land.height(x, z), y = Math.max(g, W - 1.14);
      pts.push([x, y, z, 0]);
      s += (y < W - 0.7 ? swim : y < W + 0.4 ? 5 : speed) * LDT;
    }
    return { row: finish(pts), period: (pts.length - 1) * LDT };
  };
  // a companion: a station beside us, as a smooth function of the metres we have come and of the herd's clock:
  // fn(s, t) -> [metres ahead, metres to the right, metres sunk]. Sunk, it is under the ground or under the river.
  // Its run is from t0 to t1 of the herd's clock: it runs it once, and outside it the companion is not drawn (the lane's own fade at both
  // ends of a run, see laneTime)
  const track = (fn, t0 = -1, t1 = DUR + 3) => {
    const pts = [], n = Math.min(LW - 2, Math.ceil((t1 - t0) / LDT));
    for (let k = 0; k < n; k++) {
      const tc = t0 + k * LDT, s0 = Y.distAtTime(tc), a = fn(s0, tc), s = s0 + a[0];
      Y.posAt(s, v); Y.tanAt(s, t); const il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)), x = v.x - t.z * il * a[1], z = v.z + t.x * il * a[1];
      pts.push([x, Math.max(land.height(x, z), W - 1.14) - a[2], z, 0]);
    }
    return { row: finish(pts), period: (pts.length - 1) * LDT, t0 };
  };
  return { lanes, column, free, track, wander, colLat };
}
function laneTexture(lanes) {
  const H = lanes.length * 2, data = new Float32Array(LW * H * 4);
  lanes.forEach((l, i) => { data.set(l.a, i * 2 * LW * 4); data.set(l.b, (i * 2 + 1) * LW * 4); });
  const tex = new THREE.DataTexture(data, LW, H, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}
// CPU copy of a lane position (for scripted creatures and checks): hooves' xyz at lane time
function laneAt(l, tt, out) {
  const f = clamp(tt / LDT, 0, LW - 1.001), k = Math.floor(f), a = f - k, A = l.a;
  out.set(lerp(A[k * 4], A[k * 4 + 4], a), lerp(A[k * 4 + 1], A[k * 4 + 5], a), lerp(A[k * 4 + 2], A[k * 4 + 6], a));
  return out;
}

// two rules of the animal's bearing. WALK: a walking pace (m/s): under it a body holds its lane's own direction of travel and the slope of
// the ground along it (HERD_VERT). CLOSE_TURN: while the column closes round us, the sideways closing speed may turn a body by no more
// than so many degrees from its lane's direction (a wildebeest closing ranks angles its run, it does not run sideways).
const WALK = 1.4, CLOSE_TURN = 20;
// shared by everything that rides the lanes: where instance (row, offset, rate, period) is at the herd clock
const LANE_GLSL = /* glsl */`
uniform highp sampler2D uLane; uniform float uClock, uPrev, uPrevF, uSurge, uLandT[${NCOL}]; uniform vec2 uPart;
float gPart = 1., gRate = 0.;        // how far this animal stands aside at the entry, and how fast it is closing in
vec4 laneT(int k, int row){ return texelFetch(uLane, ivec2(clamp(k, 0, ${LW - 1}), row), 0); }
// returns lane time; vis = fade at the ends of the slot's run
float laneTime(vec4 L, out float vis){
  if (L.w < 0.) { float oe = mod(L.y + uPrev * L.z - (${COL_LO.toFixed(1)}), ${COL_SPAN.toFixed(1)}) + (${COL_LO.toFixed(1)});
    vis = smoothstep(${COL_LO.toFixed(1)}, ${(COL_LO + 0.6).toFixed(1)}, oe) * (1. - smoothstep(${(COL_LO + COL_SPAN - 1.5).toFixed(1)}, ${(COL_LO + COL_SPAN).toFixed(1)}, oe));
    // the column stands apart round the way in: whoever is within 9 m ahead stands right aside, the lines beyond are a V
    // that closes on the plume: eleven metres either side of us at fifteen metres, shoulder to shoulder with the lane ahead at sixty
    // (the lines dead ahead stand in the arms with the rest: the way between the arms is open ground to the plume's foot)
    float g2 = .8 * (1. - smoothstep(.86, 5.2, oe));
    float g = max(1. - smoothstep(.66, .84, oe), g2); gPart = uPart.x * g; gRate = uPart.y * g;
    return L.z * uClock + oe + ${T0.toFixed(1)} + .03 * sin(uSurge * .29 + L.y * 7.3) + .012 * sin(uSurge * .83 + L.y * 17.); }       // each eases forward and back in its place: a formation, not a frieze
  gPart = 1.; gRate = 0.;
  float tau = mod(uClock + uPrevF * L.z + L.y, L.w);                      // (rate 0: a companion keyed to our own clock, which the preview does not advance)
  // a companion keyed to our own clock runs its track once: before its run begins and after it has ended it is not drawn
  if (L.z == 0.) tau = clamp(uClock + L.y, 0., L.w);
  vis = smoothstep(0., 1.4, tau) * (1. - smoothstep(L.w - 1.6, L.w - .2, tau));
  return tau;
}
void lanePos1(float tt, int row, out vec4 P, out vec4 dP){
  float f = clamp(tt / ${LDT.toFixed(2)}, 1., ${(LW - 3).toFixed(1)}); int k = int(floor(f)); float a = f - float(k);
  vec4 p0 = laneT(k - 1, row), p1 = laneT(k, row), p2 = laneT(k + 1, row), p3 = laneT(k + 2, row);
  vec4 c1 = .5 * (p2 - p0), c2 = p0 - 2.5 * p1 + 2. * p2 - .5 * p3, c3 = .5 * (p3 - p0) + 1.5 * (p1 - p2);
  P = p1 + a * (c1 + a * (c2 + a * c3));
  dP = (c1 + a * (2. * c2 + 3. * a * c3)) / ${LDT.toFixed(2)};
}
// column lanes (the first 2 x NCOL rows) are baked twice: parted round the entry ring, and (2 x NCOL rows further on) running straight up the lane
void lanePos(float tt, int row, out vec4 P, out vec4 dP){
  lanePos1(tt, row, P, dP);
  // (the closing speed added to the lane's own is held to the tangent of CLOSE_TURN times the lane's speed)
  if (gPart < .999 && row < ${2 * NCOL}) { vec4 Q, dQ; lanePos1(tt, row + ${2 * NCOL}, Q, dQ); dP = mix(dQ, dP, gPart); vec2 cl = (P.xz - Q.xz) * gRate; dP.xz += cl * min(1., ${Math.tan(CLOSE_TURN * Math.PI / 180).toFixed(4)} * length(dP.xz) / max(length(cl), 1e-4)); P = mix(Q, P, gPart); }
}
// the lane's own direction of travel where the animal is (xy: a unit vector on the ground plan) and the climb of the ground along it
// (z: metres up to a metre run), taken over the lane's texels either side of the animal
vec3 laneRun(float tt, int row){
  float f = clamp(tt / ${LDT.toFixed(2)}, 1., ${(LW - 3).toFixed(1)}); int k = int(floor(f));
  vec4 c = laneT(k + 2, row) - laneT(k - 1, row);
  if (gPart < .999 && row < ${2 * NCOL}) c = mix(laneT(k + 2, row + ${2 * NCOL}) - laneT(k - 1, row + ${2 * NCOL}), c, gPart);
  float l = length(c.xz);
  return l > 1e-3 ? vec3(c.xz, c.y) / l : vec3(0.);
}
vec4 laneAux(float tt, int row){
  float f = clamp(tt / ${LDT.toFixed(2)}, 1., ${(LW - 3).toFixed(1)}); int k = int(floor(f));
  return mix(laneT(k, row + 1), laneT(k + 1, row + 1), f - float(k));
}
`;

// the side view of a wildebeest as a signed distance, in metres at size 1 (x forward, y up from the hooves): the far herd's cards are drawn
// with it, and every near animal's shadow is this outline sheared along the ground. plain > 0 leaves horns and beard off (calves, zebra).
const SIL_GLSL = /* glsl */`
float cap(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.); return length(pa - ba * h) - r; }
float ell(vec2 p, vec2 c, vec2 r){ return (length((p - c) / r) - 1.) * min(r.x, r.y); }
float leg(vec2 q, vec2 hip, float a, float run){ float sw = .45 * run, lift = .2 * run * max(cos(a), 0.); return cap(q, hip, vec2(hip.x + sw * sin(a), lift), .05); }
float beastSil(vec2 q, float run, float gait, float a, float plain){
  float d = ell(q, vec2(0., .98), vec2(.7, .29));                                    // barrel
  d = min(d, ell(q, vec2(.36, 1.13), vec2(.37, .28)));                               // the hump of the withers
  d = min(d, ell(q, vec2(-.48, .97), vec2(.3, .26)));                                // the sloping quarters
  vec2 nk = vec2(.6, 1.1), hp = mix(vec2(.84, .3), vec2(1.04, .86 + .05 * sin(a + 1.) * gait), run);    // head down grazing, or carried low and forward
  d = min(d, cap(q, nk, hp, .13));
  d = min(d, cap(q, hp, hp + mix(vec2(.09, -.15), vec2(.17, -.13), run), .085));     // the long face
  d = min(d, cap(q, hp + vec2(-.07, .09), hp + vec2(-.03, .26), .03) + plain);       // horns
  d = min(d, cap(q, nk + vec2(.08, -.2), mix(nk, hp, .75) + vec2(-.02, -.2), .05) + plain);     // beard
  d = min(d, cap(q, vec2(-.76, 1.05), vec2(-.96 - .12 * gait, .6 + .25 * gait), .03));
  d = min(d, leg(q, vec2(.42, .8), a, gait)); d = min(d, leg(q, vec2(.36, .8), a + .9, gait));
  d = min(d, leg(q, vec2(-.5, .8), a + 2.6, gait)); d = min(d, leg(q, vec2(-.56, .8), a + 3.5, gait));
  return d;
}
// the same animal seen end on, going away or coming: the round of the quarters, the hump beyond, a horn either side, two pairs of legs
float beastRear(vec2 q, float gait, float a, float plain){
  float d = ell(q, vec2(0., .98), vec2(.3, .4));
  d = min(d, ell(q, vec2(0., 1.31), vec2(.19, .2)));
  vec2 m = vec2(abs(q.x), q.y);
  d = min(d, cap(m, vec2(.08, 1.43), vec2(.25, 1.4), .03) + plain); d = min(d, cap(m, vec2(.25, 1.4), vec2(.29, 1.53), .024) + plain);
  d = min(d, cap(q, vec2(0., 1.05), vec2(.05 * sin(a), .5), .028));
  float l0 = .24 * gait * max(cos(a), 0.), l1 = .24 * gait * max(cos(a + 3.1), 0.);
  d = min(d, cap(q, vec2(-.16, .8), vec2(-.17, l0), .052)); d = min(d, cap(q, vec2(.16, .8), vec2(.17, l1), .052));
  d = min(d, cap(q, vec2(-.09, .8), vec2(-.08, l1 * .8), .045)); d = min(d, cap(q, vec2(.09, .8), vec2(.08, l0 * .8), .045));
  return d;
}
`;

// ---------------------------------------------------------------- herd vertex shader (kit Geo conventions, the hero's fragment shader)
// per instance: iL (lane row, clock offset, rate, period or -1 for column lanes)  iD (seed, size, calf, lateral jitter)  iTint
const HERD_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aAnim; attribute vec3 aPivot, aSwim, aSwimN; attribute float aGlow;
attribute vec4 iL, iD; attribute vec3 iTint;
uniform float uTime, uWaterY; uniform vec4 uWaveP;
varying vec3 vCol, vN, vW, vLp; varying float vWet, vVis, vMask;
${GLSL_COMMON}
${LANE_GLSL}
vec2 rotP(vec2 yz, float a){ float c = cos(a), s = sin(a); return vec2(yz.x * c - yz.y * s, yz.y * c + yz.x * s); }
void main(){
  float seed = iD.x, size = iD.y, vis; int row = int(iL.x + .5) * 2;
  float tt = laneTime(iL, vis); vec4 L, dL; lanePos(tt, row, L, dL); vec4 aux = laneAux(tt, row);
  // a body heads the way it goes over the ground. When its own speed over the ground falls under a walking pace it holds its lane's
  // direction of travel (it does not spin round), and between a walk and twice a walk it comes round to its own way again (own)
  float gs = length(dL.xz), v = max(gs, .5), own = smoothstep(${WALK.toFixed(1)}, ${(2 * WALK).toFixed(1)}, gs); vec3 run = laneRun(tt, row);
  vec2 hd = mix(run.xy, dL.xz / v, own); hd /= max(length(hd), 1e-3);
  float wAir = smoothstep(.15, .6, aux.x), deep = 1. - smoothstep(uWaterY - 1.06, uWaterY - .8, L.y), wSwim = deep * (1. - wAir);
  // heaving out: where the bottom comes up under them they get their feet down and surge: chest and head up, forelegs striking out of the water
  float wWade = (1. - deep) * (1. - smoothstep(uWaterY - .1, uWaterY + .25, L.y)) * (1. - wAir), heave = wWade * (1. - smoothstep(uWaterY - .8, uWaterY - .15, L.y));
  // the plunge: whoever comes down off the leap goes right under and comes up swimming (nobody lies on the water)
  float dl = iL.w < 0. ? tt - uLandT[clamp(row / 2, 0, ${NCOL - 1})] : -1., pk = clamp(dl / .9, 0., 1.), under = dl > 0. ? sin(pk * PI) : 0.;
  wSwim = max(wSwim, smoothstep(0., .12, dl) * (1. - smoothstep(.9, 1.2, dl)));
  float stride = 4.5 * size * mix(.42, 1., smoothstep(3., 9., v)), cyc = L.w / stride + seed * 7.;
  float runW = (1. - wAir) * (1. - wSwim);
  float bob = .05 * sin(cyc * 6.2832 + 1.) * runW * (1. + 1.5 * wWade), crouch = .11;
  float feet = mix(L.y, uWaterY - ${SWIM_LV.toFixed(2)} * size + .04 * sin(uTime * 2.6 + seed * 40.), wSwim) + min(L.y - uWaterY + 1.2, 0.) * wSwim;
  vec3 P = vec3(L.x - hd.y * iD.w, feet + (${PIV.toFixed(2)} - crouch * (1. - wSwim) + bob) * size, L.z + hd.x * iD.w);
  P.y -= 1.45 * size * under;
  float hv = heave * (.26 + .1 * sin(cyc * 6.2832 + .8)); P.y += hv * size;                    // it bounds: the chest comes clear of the water at every surge
  float wr = length(P.xz - uWaveP.xy) - uWaveP.z, wg = uWaveP.w * exp(-wr * wr * .08) * wSwim; P.y += .05 * wg;       // the slab's wave lifts each swimmer as it passes
  // its pitch is the slope of its own track, the rise over the run (under a walking pace: the slope of the ground along its lane alone)
  float pitch = atan(mix(-run.z, -dL.y / max(v, 3.), own)) * .85 * (1. - wSwim) * (1. - wWade) + (.06 - .03 * wWade) * sin(cyc * 6.2832 + 2.4) * runW - .035 * heave + (.025 * sin(uTime * 2.3 + seed * 30.) - .1 * wg) * wSwim;      // (in the shallows it goes level: back flat, head and horns up)
  float neckA = .1 + .14 * sin(cyc * 6.2832 + .6);
  float fall = smoothstep(.5, -3., dL.y);
  neckA = mix(neckA, mix(-.32, .12, fall), wAir);
  neckA = mix(neckA, -.34 + .06 * sin(cyc * 6.2832 + .6), wWade * .85);
  float tailUp = mix(mix(.4, 1.1, wAir), .15, wSwim);
  vec3 p = position, n = normal; float part = aAnim.z;
  if (part > .5 && part < 1.5) {
    bool front = aPivot.z > 0.; float side = aPivot.x > 0. ? 1. : 0.;
    float jy = aPivot.y, l1 = jy * .5, duty = .24, Ls = stride / size * duty;
    float ph = fract(cyc + (front ? .45 : 0.) + side * .11), dz, lift;
    if (ph < duty) { dz = Ls * (.5 - ph / duty); lift = 0.; }
    else { float e = (ph - duty) / (1. - duty); dz = Ls * (e * e * (3. - 2. * e) - .5); lift = (front ? .34 : .26) * (1. + (front ? 1.2 : .5) * wWade) * sin(e * PI); }
    vec2 T = vec2(crouch - bob + lift, aPivot.z + dz);
    T = vec2(${PIV.toFixed(2)}, 0.) + rotP(T - vec2(${PIV.toFixed(2)}, 0.), -pitch * runW);
    float jit = sin(uTime * 13. + seed * 9. + side * 2. + (front ? 0. : 1.7));
    vec2 Tf = front ? mix(vec2(.52, aPivot.z + .12), vec2(.17, aPivot.z + .42), fall) : mix(vec2(.3, aPivot.z - .55), vec2(.42, aPivot.z + .04), fall);
    Tf.y += .07 * jit; T = mix(T, Tf, wAir);
    float rc = cyc * 6.2832 + side * 3.1416, sk = smoothstep(-.3, .75, sin(rc));
    if (front) T = mix(T, vec2(mix(.05, .64, sk), aPivot.z + mix(-.06, .56, sk)), heave * .9); else T.x -= hv;      // one foreleg strikes forward clear of the water while the other is planted, turn about; the hind legs drive off the bottom
    vec2 hip = vec2(jy, aPivot.z), dd = T - hip;
    float dist = clamp(length(dd), .08, 2. * l1 * .999);
    float beta = atan(dd.y, max(-dd.x, .02)), A = acos(clamp(dist / (2. * l1), -1., 1.));
    float ua = beta + (front ? A : -A);
    vec2 knee = hip + l1 * vec2(-cos(ua), sin(ua));
    float la = atan(T.y - knee.y, knee.x - T.x + 1e-4);
    float w = smoothstep(.42, .58, aAnim.y);
    vec2 up = hip + rotP(p.yz - hip, -ua), lo = knee + rotP(p.yz - vec2(jy - l1, aPivot.z), -la);
    p.yz = mix(up, lo, w); n.yz = mix(rotP(n.yz, -ua), rotP(n.yz, -la), w);
  } else if (part > 1.5 && part < 2.5) {
    if (aAnim.w > 1.5 && iD.z > .5) p = mix(p, vec3(sign(p.x) * .05, 1.36, 1.04), .6);
    float a = neckA * aAnim.x;
    p.yz = aPivot.yz + rotP(p.yz - aPivot.yz, a); n.yz = rotP(n.yz, a);
  } else if (part > 2.5) {
    float w = aAnim.y, a = w * (tailUp + .25 * sin(cyc * 12.566 + seed));
    p.yz = aPivot.yz + rotP(p.yz - aPivot.yz, a); n.yz = rotP(n.yz, a);
    p.x += w * w * .16 * sin(uTime * 9. + seed * 20.);
  }
  // swimming: the baked pose (head low and forward, chin on the water, the withers awash), with a slow nod of the head
  if (wSwim > 0.) {
    vec3 sp = aSwim, sn = aSwimN;
    if (part > 1.5 && part < 2.5) { float na = .045 * sin(uTime * 2.3 + seed * 40.) * aAnim.x; sp.yz = aPivot.yz + rotP(sp.yz - aPivot.yz, na); sn.yz = rotP(sn.yz, na); if (aAnim.w > 1.5 && iD.z > .5) sp = mix(sp, vec3(sign(sp.x) * .05, 1.42, 1.1), .6); }
    p = mix(p, sp, wSwim); n = mix(n, sn, wSwim);
  }
  vec3 b = p - vec3(0., ${PIV.toFixed(2)}, 0.);
  b.yz = rotP(b.yz, pitch); n.yz = rotP(n.yz, pitch);
  // out of the river it shakes itself: once, a second long, a few seconds after its feet are on dry ground (the spray it throws is a sprite of its own)
  float sk = ((1. - aux.y) * ${DRY_T.toFixed(1)} - (${SHK[0].toFixed(1)} + ${SHK[1].toFixed(1)} * fract(seed * 13.7))) / 1.;
  float shake = aux.y > .02 ? step(uWaterY + .3, L.y) * smoothstep(0., .1, sk) * (1. - smoothstep(.5, 1., sk)) : 0.;
  float roll = .1 * sin(uTime * 3. + seed * 11.) * wAir + .05 * sin(uTime * 2.6 + seed) * wSwim + .15 * shake * sin(uTime * 39. + seed * 9.) * (.5 + .5 * smoothstep(.6, 1.3, position.y));
  float cr = cos(roll), sr = sin(roll); b.xy = vec2(b.x * cr - b.y * sr, b.y * cr + b.x * sr); n.xy = vec2(n.x * cr - n.y * sr, n.y * cr + n.x * sr);
  b.xz = vec2(b.x * hd.y + b.z * hd.x, b.z * hd.y - b.x * hd.x); n.xz = vec2(n.x * hd.y + n.z * hd.x, n.z * hd.y - n.x * hd.x);
  vec3 wp = P + b * size;
  vW = wp; vN = n; vLp = position; vMask = aGlow; vCol = color * iTint;
  vWet = max(aux.y, wSwim); vVis = vis;
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---------------------------------------------------------------- the herd: slots on lanes, three instanced draws
// the dead tree stands at the gully's mouth, 12 m to the right of the beaten way: from the ring it is just right of the axis against the dust
const TREE_SHORT = 8, LIFT_SHORT = 45;                          // the tree's station on the route, so far short of the gully's mouth; and how far short of that station the lens is when its first vulture heaves off
const treeS = (Y) => Y.sGully - TREE_SHORT;
function deadTreeAt(Y, land) {
  const sT = treeS(Y), p = Y.posAt(sT, new THREE.Vector3()), t = Y.tanAt(sT, new THREE.Vector3()), il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)), x = p.x - t.z * il * 12, z = p.z + t.x * il * 12;
  return new THREE.Vector3(x, land.height(x, z), z);
}
const frameAtS = (Y, s) => { const p = Y.posAt(s, new THREE.Vector3()), t = Y.tanAt(s, new THREE.Vector3()), il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)); return { p, f: new THREE.Vector3(t.x * il, 0, t.z * il), r: new THREE.Vector3(-t.z * il, 0, t.x * il) }; };
// a seat in the river's own water, so many metres ahead and to the right of where the swim line is at mark u: the first of the offered
// places that lies in water deep enough (the river's bed and banks decide, not the picture)
function riverSeat(Y, land, W, u, offers, depth) {
  const fr = frameAtS(Y, u * Y.L); let at = null;
  for (const [fw, lat] of offers) { const c = fr.p.clone().addScaledVector(fr.r, lat).addScaledVector(fr.f, fw), q = land.sample(c.x, c.z); if (q.kind === 1 && q.h < W - depth) { at = c; break; } }
  if (!at) at = fr.p.clone().addScaledVector(fr.r, 9);
  return { at, fr };
}
// where the hippo that yawns lies (14 m to our right as we pass the brief's mark), its heading (nose to the sun: the bearing of the world's
// own sun on the ground plan) and the point on it we look round at (its head, 0.9 m along its own heading from its place)
function yawnPlace(Y, land, W, sun) {
  const { at, fr: fH } = riverSeat(Y, land, W, U_YAWN, [[5, 14], [5, 13.4], [6, 13], [4, 13.5], [7, 12.6], [4, 12], [8, 12], [5, 11], [5, 10]], 1.2);
  const eye = fH.p, sd = new THREE.Vector3(at.x - eye.x, 0, at.z - eye.z).normalize(), sr = new THREE.Vector3(-sd.z, 0, sd.x);
  const yaw = Math.atan2(sun.x, sun.z);
  return { at, sd, sr, fH, yaw, poi: new THREE.Vector3(at.x + Math.sin(yaw) * 0.9, W + 1.35, at.z + Math.cos(yaw) * 0.9) };
}
// where the crocodile lunges: 13 m to our right as we pass the brief's mark, a little ahead, its jaws toward the column
function lungePlace(Y, land, W) {
  const { at, fr } = riverSeat(Y, land, W, U_LUNGE, [[7, 13], [6, 13], [8, 12.6], [5, 12.6], [7, 12], [9, 12], [7, 11]], 1.0);
  return { at, f: fr.f, r: fr.r, yaw: Math.atan2(fr.f.x * 0.25 - fr.r.x * 0.95, fr.f.z * 0.25 - fr.r.z * 0.95), sL: U_LUNGE * Y.L };
}
// the look to our right in the river: at the lunge, then on to the hippo that yawns (one point of interest that slides from one to the other).
// It goes by the two events' own stations on the route: it opens as far short of the lunge's station as the lunge lies to our side, slides
// from the lunge to the yawner between the two stations, and closes as far past the yawner's station as the yawner lies to our side.
const LUNGE_SIDE = 13, YAWN_SIDE = 14;                           // the brief's two distances: "lunges 13 m to the right", "yawns 14 m to the right"
function rightGaze(Y, land, W, sun) {
  const lg = lungePlace(Y, land, W), yw = yawnPlace(Y, land, W, sun), a = new THREE.Vector3(lg.at.x, W + 0.5, lg.at.z), at = new THREE.Vector3(), sY = U_YAWN * Y.L;
  return { at: (time, u) => at.copy(a).lerp(yw.poi, sstep(lg.sL, sY, (u ?? 0) * Y.L)), from: (lg.sL - LUNGE_SIDE) / Y.L, to: (sY + YAWN_SIDE) / Y.L, weight: 0.6 };
}
const GULLY_FOG = 1.3;                                           // x the look's gullyK: 0.039 for the golden hour, which is 35 m of visibility (and the herd, darker than the earth, holds twice as far)
// where we look on the run in: toward the dead tree as we come up to it, and down the lane at the backs ahead of us (the plume stands over them)
function plainGaze(Y, land) {
  const deadTop = deadTreeAt(Y, land); deadTop.y += 9; const liftP = new THREE.Vector3();
  // the lane look is lifted by the land at the place looked at (the point 46 m ahead on the route): 5.5 m over the route there, and
  // WALL_SHARE of the height the gully's walls stand over its floor at that place, so the point keeps its height over the plain while the
  // route goes down into the cut. That height is read from the land at even steps of three metres of the route: going out from the floor's
  // edge on either hand, the land's level where the cut's wall ends less the floor's (nothing where there is no cut); the mean of the two hands.
  const WALL_SHARE = 1, STEP = 3, REACH = 8, nW = Math.ceil(Y.sLip / STEP), wallH = new Float32Array(nW + 1), q = new THREE.Vector3(), tn = new THREE.Vector3();
  const hwPlain = land.sample(Y.posAt(0, q).x, q.z).hw;          // (the floor's half width where there is no cut: the open plain's)
  for (let i = 0; i <= nW; i++) {
    Y.posAt(Math.min(i * STEP, Y.sLip), q); Y.tanAt(Math.min(i * STEP, Y.sLip), tn); const il = 1 / Math.max(1e-4, Math.hypot(tn.x, tn.z));
    for (const sd of [-1, 1]) {
      const nx = -tn.z * il * sd, nz = tn.x * il * sd, c = land.sample(q.x + nx, q.z + nz), hw = c.hw, floor = c.h; if (hw >= hwPlain) continue;
      let wall = false, top = floor;
      for (let lat = hw; lat <= hw + REACH; lat += 0.5) { const e = land.sample(q.x + nx * lat, q.z + nz * lat); if (e.wall) { wall = true; top = e.h; } else if (wall) { top = e.h; break; } }
      wallH[i] += 0.5 * Math.max(0, top - floor);
    }
  }
  const liftAt = (time, u) => { const s = clamp(u ?? 0, 0, 1) * Y.L, sl = Math.min(s + 46, Y.sLip - 4), f = sl / STEP, i = Math.min(nW - 1, Math.floor(f)); Y.posAt(sl, liftP); liftP.y += 5.5 + WALL_SHARE * lerp(wallH[i], wallH[i + 1], f - i); return liftP; };
  // the lane look opens at the brief's own beat ("By u 0.05 two lines have merged round us") and closes where we reach the lip. The look
  // at the dead tree, the landmark of the run in, opens at the ring we come in by (the route's start) and closes at the tree's own
  // station.
  return [{ at: liftAt, from: 0.05, to: Y.sLip / Y.L, weight: 0.6 }, { at: deadTop, from: 0, to: treeS(Y) / Y.L, weight: 0.42 }];
}
async function buildHerd(ctx, Y, land, hero, W, opt) {
  const rng = ctx.rng.fork('herd'), U = hero.uniforms, B = bakeLanes(ctx, Y, land, W);
  const dens = opt.density, slots = [];                       // { row, o, r, period, seed, size, calf, jit, kind: 'hi'|'lo'|'z', tint }
  const tintW = (calf, R = rng) => { const k = R.range(0.66, 1.05), w = R.range(-0.05, 0.06); return calf ? [2.4 * k, 1.8 * k, 1.2 * k] : [k * (1.03 + w), k, k * (0.98 - w)]; };
  const tintZ = (R = rng) => { const k = R.range(0.56, 0.66); return [k, k * 0.96, k * 0.88]; };
  const add = (row, o, r, period, zebra, near, jit, adult, sz, R = rng) => {
    const calf = adult === 'calf' || (!zebra && !adult && R.chance(0.2)), size0 = zebra ? R.range(0.9, 0.98) : calf ? R.range(0.68, 0.8) : R.range(0.93, 1.1), size = sz || size0;
    slots.push({ row, o, r, period, seed: R(), size, calf: calf ? 1 : 0, jit, kind: zebra ? (near === 1 || near === 2 ? 'zx' : 'z') : near === 2 ? 'x' : near === 3 ? 'f' : near ? 'hi' : 'lo', tint: zebra ? tintZ(R) : tintW(calf, R) });
  };
  // the column round the camera
  const bases = [-2.4, 2.4, -3.3, 3.3, -4.15, 4.15, -5.0, 5.0, -2.41, 2.41, -3.31, -4.16, ...LEAD], colRows = [], authored = new Set(), company = [];
  // every line keeps station with us (rate 1): the column is a formation
  const rates = bases.map(() => 1), leads = [], pinned = new Set();
  const plainLat = (b) => Math.sign(b) * (Math.abs(b) < 2 ? leadLat(Math.abs(b)) : 2.4 + (Math.abs(b) - 2.4) * 1.5);
  const rx = ctx.rng.fork('herd-more');                                    // the animals that thicken the column draw from their own stream: the authored company keeps its places
  const zebLead = rng.chance(0.5) ? 1 : -1;                                 // side of the family first into the water
  // in the water the company on our left is authored: two wildebeest within a body length, two zebra a length further on.
  // [lane, metres ahead of us for the whole swim, zebra, size] (a place on a line is a clock offset: the metres over the swim's own speed)
  const vSwim = (Y.sWade - Y.sSplash) / (Y.timeAtU(Y.sWade / Y.L) - Y.timeAtU(Y.sSplash / Y.L));
  const COMPANY = [[2, 0.8, 0, 1.08], [4, 0.2, 0, 1.12], [2, 5.6, 1, 0], [4, 4.4, 1, 0]];
  for (let li = 0; li < bases.length; li++) {
    await ctx.yield();                                                      // one lane baked at a time
    const b = bases[li], row = B.column(b, LEAP_SHIFT[li], true, li >= 12); colRows.push(row);
    if (li >= 12) {
      const k = li - 12;
      if (k < 3) {                                                          // the lead lines: rumps and humped backs from 7 m on, either side of the open lane
        const o0 = [0.52, 0.66, 0.92][k], step = [0.52, 0.55, 0.7][k];
        for (let o = o0; o < 5.4; o += step * rx.range(0.9, 1.12)) { const oo = o + rx.range(-0.04, 0.04); add(row, oo, 1, -1, false, o < 1.6 ? 1 : o < 3.2 ? 0 : 3, rx.range(-0.2, 0.2), o < 2.6, undefined, rx); authored.add(slots[slots.length - 1]); leads.push([plainLat(b), oo]); }
      } else {                                                              // between the lines: whoever is nearest on our right, and the ranks behind the leaders
        for (const [o, near, calf] of [[[0.93, 1], [1.27, 1], [1.66, 0]], [[0.97, 1], [1.33, 1], [1.72, 0]], [[0.44, 2], [0.8, 1], [1.16, 1], [1.5, 0]], [[0.63, 1], [1.02, 1], [1.4, 0]],
          [[0.47, 1], [0.86, 1], [1.22, 0]], [[0.5, 1, 1], [0.74, 1], [1.08, 1], [1.45, 0]], [[0.52, 1, 1], [0.84, 1], [1.22, 0]]][k - 3]) {
          const oo = o + rx.range(-0.02, 0.02); add(row, oo, 1, -1, false, near, rx.range(-0.12, 0.12), calf ? 'calf' : true, near === 2 ? 1.04 : undefined, rx); authored.add(slots[slots.length - 1]); leads.push([plainLat(b), oo]);
        }
      }
      continue;
    }
    if (li >= 8) continue;                                                  // the wide pair has no animals of its own
    const offs = [];
    if (li < 2) {                                                           // authored: flankers 3.2 m ahead, leaders after them
      for (let o = LEAP_O[li]; o < COL_LO + COL_SPAN - 0.4; o += rng.range(0.5, 0.64) / Math.sqrt(dens)) offs.push(o);
      for (let o = LEAP_O[li] - rng.range(0.62, 0.7); o > COL_LO + 0.2; o -= rng.range(0.44, 0.6)) offs.push(o);
    } else if (li < 6) for (let o = COL_LO + 0.25 + rng.range(0, 0.3); o < COL_LO + COL_SPAN - 0.4; o += (o > -2.6 && o < 4.2 ? rng.range(0.42, 0.66) : rng.range(0.5, 0.86)) / Math.min(dens, 1.06)) offs.push(o);
    for (let i = offs.length - 1; i >= 0; i--) if (offs[i] > 0.6 && offs[i] < FIRST_O[li] + (li === 3 ? 0.66 : 0.3)) offs.splice(i, 1);                  // each line has a gap between our own company and its first animal
    offs.push(FIRST_O[li]);                                                                    // the first of each line, 12 to 15 m ahead of us
    const auth = COMPANY.filter((c) => c[0] === li).map((c) => ({ o: c[1] / vSwim, zebra: c[2], size: c[3] }));
    for (const a of auth) { for (let i = offs.length - 1; i >= 0; i--) if (Math.abs(offs[i] - a.o) < 0.4) offs.splice(i, 1); offs.push(a.o); }
    const zebAt = (o) => {
      let zebra = false;
      if (li >= 2 && Math.sign(b) < 0 && o > 0.25 && o < 1.5) zebra = true;                       // the family abreast on the left
      if (li >= 2 && Math.sign(b) === zebLead && o > 2.6 && o < 4.0) zebra = true;                // the family first into the water
      if (o > 9 && o < 10.2 && li >= 4) zebra = true;
      if (Math.abs(o) < 0.75) zebra = false;                                                     // (the zebra run in families ahead of us, not singly at our shoulder)
      return zebra;
    };
    if (li < 6) for (const o of offs) {
      const au = auth.find((a) => a.o === o), first = o === FIRST_O[li];
      const near = o > -0.5 && o < 0.9 ? (li < 2 ? 2 : 1) : o > -1.2 && o < 2.2 ? 1 : o > 4.6 ? 3 : 0;          // 2: our own company, the rounder build (the two lines at our shoulders; the lines beyond them take the build of the forty metres round us)
      if (au) { add(row, o, 1, -1, !!au.zebra, 2, 0, true, au.size || undefined); authored.add(slots[slots.length - 1]); pinned.add(slots[slots.length - 1]); company.push([slots[slots.length - 1], li === 2 ? 10 : 11]); continue; }
      let zebra = opt.zebraCast ? rng.chance(0.22) : false;
      if (zebAt(o)) zebra = true; if (Math.abs(o) < 0.75) zebra = false;
      const jit = li < 2 ? Math.sign(b) * rng.range(0, 0.3) : rng.range(-0.28, 0.28);
      add(row, o, 1, -1, zebra && !first, near, first ? 0 : jit, (li < 2 && o > -1 && o < 2.2) || first);
      if (li < 2 && o > -1 && o < 2.2) pinned.add(slots[slots.length - 1]);                        // the flank lines' animals at our shoulders are the brief's own flankers; the first of each line is held to the formation's rules like every other animal
    }
    // ---- the column thickened into a river: on the four lanes outside the flankers one more animal in every gap from just behind us to
    // ninety metres ahead, and the whole of the outer pair of lanes. They draw from their own stream (rx) and keep clear of the authored places.
    if (li >= 2) {
      const more = [], outer = li >= 6, sorted = offs.slice().sort((a, c) => a - c), free = (o) => !(o > 0.55 && o < 1.0) && Math.abs(o - FIRST_O[li]) > 0.24 && !(li === 3 && o > FIRST_O[li] && o < FIRST_O[li] + 0.8) && auth.every((a) => Math.abs(a.o - o) > 0.34);
      if (outer) { for (let o = COL_LO + 0.3 + rx.range(0, 0.3); o < COL_LO + COL_SPAN - 0.4; o += (o > -1.1 && o < 6.2 ? rx.range(0.3, 0.46) : rx.range(0.55, 0.9)) / Math.min(dens, 1.06)) if (free(o)) more.push(o); more.push(FIRST_O[li]); }
      else for (let i = 0; i < sorted.length - 1; i++) { const g = sorted[i + 1] - sorted[i], o = sorted[i] + g * rx.range(0.42, 0.58); if (o > -1.1 && o < 6.2 && g > 0.4 && free(o)) more.push(o); }
      for (const o of more) {
        const first = o === FIRST_O[li];
        const near = o > -0.9 && o < 1.7 ? 1 : o > 4.6 ? 3 : 0;
        const zebra = !first && zebAt(o);
        add(row, o, 1, -1, zebra, zebra && near === 1 ? 0 : near, first ? 0 : rx.range(-0.22, 0.22), first, undefined, rx); if (first) authored.add(slots[slots.length - 1]);
      }
    }
  }
  // two more on the lead lines, between their leaders
  { const re = ctx.rng.fork('herd-entry'); for (const [k, o] of [[2, 1.27], [0, 1.32]]) { add(colRows[12 + k], o, 1, -1, false, 1, re.range(-0.1, 0.1), true, undefined, re); authored.add(slots[slots.length - 1]); leads.push([plainLat(bases[12 + k]), o]); } }
  // the lead lines run in the flankers' lines and beside the ranks next to them: each of their animals takes the nearest free place along
  // its line, nose to tail with whoever is there already (no two animals in one place)
  {
    const lr = new Set(colRows.slice(12, 15)), lat = new Map(colRows.map((r, li) => [r, plainLat(bases[li])]));
    const fixed = slots.filter((sl) => sl.period < 0 && !lr.has(sl.row) && (sl.row === colRows[0] || sl.row === colRows[1] || authored.has(sl)));
    const kept = [], mine = slots.filter((sl) => lr.has(sl.row)).sort((a, b) => a.o - b.o);
    for (const sl of mine) {
      const hit = (o) => (m) => Math.abs(lat.get(m.row) - lat.get(sl.row)) < 0.4 && Math.abs(m.o - o) < 0.19;
      const li = leads.findIndex((l) => l[1] === sl.o);
      for (let k = 0; k <= 80; k++) {
        const o2 = sl.o + (k & 1 ? 1 : -1) * 0.05 * ((k + 1) >> 1); if (o2 < 0.5 || fixed.some(hit(o2)) || kept.some(hit(o2))) continue;
        sl.o = o2; if (li >= 0) leads[li][1] = o2; break;
      }
      kept.push(sl); pinned.add(sl);
    }
  }
  for (let li = 0; li < bases.length; li++) { await ctx.yield(); B.column(bases[li], LEAP_SHIFT[li], false, li >= 12); }      // the same lanes again, not parted
  for (const [sl, li] of company) sl.row = colRows[li];
  // the flankers' lines swing wide in the shallows (their second bake): whoever of them runs within a second of us takes that line, so on the
  // bar nobody wades at our elbow
  for (const sl of slots) for (const fi of [0, 1]) if (sl.period < 0 && sl.row === colRows[fi] && sl.o > -1 && sl.o < 1) sl.row = colRows[8 + fi];
  // ---- THE COMPANY'S STATIONS. Whoever keeps a place beside us has it as a function of the metres we have come (s) and the herd's clock (t):
  // [metres ahead of us, metres to our right, metres sunk]. Each strays a little from its station, slowly, by a stream of its own.
  const sw = ctx.core.makeRng(ctx.core.hashSeed('station-wander:' + ctx.seed));
  const drift = (aA, aL) => { const w1 = 6.2832 / sw.range(7, 11), p1 = sw() * 6.2832, w2 = 6.2832 / sw.range(9, 14), p2 = sw() * 6.2832; return (t) => [aA * Math.sin(t * w1 + p1), aL * Math.sin(t * w2 + p2)]; };
  // in the water and up the far bank: one station in the column for the swim and one for the climb. Each comes up from its plunge between the
  // lip and where we come down, and changes stations between two marks of the river: where hooves find the bottom (sWade) and where the
  // bar is gained (sBar). The one off our bow crosses our front to the left as it finds its feet; one comes past from astern on our left,
  // rearing out of the water four metres off, and climbs ahead of us; one on our right wades out a length ahead; one falls astern.
  const kClimb = (s) => sstep(Y.sWade, Y.sBar, s), under = (s) => 2.6 * (1 - sstep(Y.sLip, Y.sSplash, s));
  const COMP = [[[5.2, 1.0], [13, -4.0], 1.06], [[1.4, 4.6], [9.5, 4.0], 1.1], [[-6.5, -3.2], [14, -1.2], 1.04], [[1.4, 2.4], [-3, 4.4], 1.07]];
  const compFn = COMP.map(([a, b]) => { const d = drift(0.5, 0.2); return (s, t) => { const k = kClimb(s), w = d(t); return [lerp(a[0], b[0], k) + w[0], lerp(a[1], b[1], k) + w[1], under(s)]; }; });
  // where the animal at place oe of a column line (seconds of the herd's clock ahead of us) is when that clock reads t and the column
  // stands gp apart (the shader's own rule: between the line's closed bake and its parted one, by the herd's own closing)
  const drawnAt = (row, oe, t, gp, out, tmp) => { laneAt(B.lanes[row + NCOL], t + oe + T0, out); if (gp > 0) { laneAt(B.lanes[row], t + oe + T0, tmp); out.lerp(tmp, gp * partG(oe)); } return out; };
  // a zebra family on the plain: zebra travel at the edges of the column, and this family keeps its station at the left edge: outside the
  // outermost line of the column on our left, by where that line's animal abreast of each of the family is at that moment (drawnAt, which
  // the formation's test shares: the animal of the line that is as far along the route as the zebra, a place on a line being a clock
  // offset). The nearest of them runs one zebra's length (FAM_OUT) outside that animal, the others beyond that by their own
  // offsets in FAM. Where the ground funnels into the gully the family turns away over the plain: zebra do not like the gully. How far
  // it has turned is read from the land at each one's own station: the half width of the cut's floor there (land.sample's hw), from 0
  // where the funnel begins (before it, the open plain's) to 1 where it has narrowed to what it is at the gully's mouth, taken at even
  // steps of about a metre; once turned away it does not come back. [metres ahead, metres to the right, size]
  const FAM = [[9.2, -8.0, 0.97], [12.6, -9.3, 0.93], [15.2, -7.8, 0.98], [13.4, -10.6, 0.7], [17.2, -9.6, 0.94]];
  const FAM_OUT = 2.4, famIn = Math.max(...FAM.map((f) => f[1])), outL = Math.min(...bases.slice(0, 8)), fp = new THREE.Vector3(), ft2 = new THREE.Vector3();
  const outRow = colRows[bases.indexOf(outL)], clockAt = (s) => (s < 0 ? s / Y.v0 : Y.timeAtU(Math.min(1, s / Y.L))), fq = new THREE.Vector3(), fq2 = new THREE.Vector3(), fo = new THREE.Vector3(), fd = new THREE.Vector3();
  const famFn = FAM.map(([ah, lt]) => {
    const d = drift(0.7, 0.3);
    const place = (sf) => {                                                 // (we are ah metres short of the zebra's station sf)
      const t = clockAt(sf - ah); drawnAt(outRow, clockAt(sf) - t, t, partAt((sf - ah) / Y.L), fq, fq2); Y.posAt(sf, fo); Y.tanAt(sf, fd);
      return (-(fq.x - fo.x) * fd.z + (fq.z - fo.z) * fd.x) / Math.max(1e-4, Math.hypot(fd.x, fd.z)) - FAM_OUT + (lt - famIn);
    };
    const hwAt = (sf) => { Y.posAt(sf, fp); Y.tanAt(sf, ft2); const il = 1 / Math.max(1e-4, Math.hypot(ft2.x, ft2.z)), l = place(sf); return land.sample(fp.x - ft2.z * il * l, fp.z + ft2.x * il * l).hw; };
    const nT = Math.ceil(Y.sGully), dT = Y.sGully / nT, turn = new Float32Array(nT + 1), hwPlain = hwAt(0), hwMouth = hwAt(Y.sGully); let hwWide = 0, k = 0;
    for (let i = 0; i <= nT; i++) { const hw = hwAt(i * dT); if (hw < hwPlain) { if (!hwWide) hwWide = hw; k = Math.max(k, clamp((hwWide - hw) / Math.max(1e-3, hwWide - hwMouth), 0, 1)); } turn[i] = k; }
    const turnAt = (sf) => { const f = clamp(sf / dT, 0, nT), i = Math.min(nT - 1, Math.floor(f)); return lerp(turn[i], turn[i + 1], f - i); };
    return (s, t) => {
      const g = turnAt(s + ah), away = Math.max(0, s - Y.sGully), w = d(t);
      return [ah + w[0] + 8 * g - 0.85 * away, place(s + ah) + w[1] - 45 * g - 0.5 * away, 0]; }; });
  // the two at our elbows on the run in: one on each hand, two and a half metres ahead and 2.4 m aside (the brief's flankers). They run in the
  // flankers' lines and breathe with them (B.wander). They come up from astern once we are 15 m past the ring and fall astern again 34 m
  // short of the lip: the ones that leap beside us are the column's own. They are never under the ground: astern of us they run on the
  // ground like any other, and where they are not to be seen they are not drawn: their run begins as we come through the ring and ends
  // where they would themselves come to the lip (t1; the lane fades them in and out at the ends of a run). Each one's speed along the
  // route never falls under LEAST of ours (it drops back no faster than that, and never runs backward): its place along the route is
  // taken at even steps of a metre of our own run and held to that rule (the station is then a function of the metres we have come).
  const fkR = ctx.rng.fork('elbows'), sOut = Y.sLip - 34, LEAST = 0.5;
  const elbowFn = [-1, 1].map((sd) => {
    const ah = sd < 0 ? 2.5 : 2.85, sA = -16, own = []; let last = -1e9, sEnd = Y.sLip;
    const want = (s, t) => { const up = sstep(15, 28, s), out = sstep(sOut, sOut + 17, s), br = Y.distAtTime(t + B.wander(sd, t)) - s; return s + lerp(-7, ah + br, up) - 9.5 * out; };
    for (let s = sA; s <= Y.L + 1; s++) { last = Math.max(want(s, s < 0 ? s / Y.v0 : Y.timeAtU(Math.min(1, s / Y.L))), last + LEAST); own.push(last); if (last < Y.sLip) sEnd = s; }
    const fn = (s) => { const f = clamp(s - sA, 0, own.length - 1.001), i = Math.floor(f); return [lerp(own[i], own[i + 1], f - i) - s, sd * (2.4 + 1.4 * (1 - sstep(15, 28, s))), 0]; };
    fn.t1 = Y.timeAtU(sEnd / Y.L); return fn; });
  // the zebra family again in the river and on the far bank: three of them swim it ten metres ahead on our left, wade out at the water's edge
  // in front of us and climb the bar and the exit abreast six metres ahead of us on our left hand, still streaming
  const EXITZ = [[0, 6.0, -3.75, 0.96, 'zx'], [2, 6.5, -4.7, 0.92, 'zx'], [4.5, 9.0, -4.2, 0.95, 'z']];
  const exitFn = EXITZ.map(([lag, ahT, latT]) => (s) => { const e = sstep(Y.sWade - 6 + lag, Y.sBar + lag, s), in0 = sstep(Y.sSplash + 4, Y.sSplash + 40, s);
    return [lerp(ahT + 5.5, ahT, e) + 3 * sstep(Y.L - 22, Y.L, s), lerp(lerp(-15 - lag, latT - 2.4, in0), latT, e), 2.6 * (1 - sstep(Y.sSplash + 1 + lag, Y.sSplash + 7 + lag, s))]; });
  const stationFns = [...compFn, ...famFn, ...elbowFn, ...exitFn];
  // ---- THE FORMATION, by rules of the herd in lane coordinates (metres ahead of us along the way, metres to the right of our line; a
  // place on a line is a clock offset). They hold from the ring to the lip and from the bar to the figs, and are tested at even steps of
  // the route's metres:
  //   1. a least gap between two animals of one line (GAP_O seconds of the herd's clock);
  //   2. a clear band beside and just ahead of us (BAND: so many metres either side of our own line, from so far astern to so far ahead)
  //      for every animal but the brief's own neighbours (the flankers, the lead lines, the company), so that
  //      the lane dead ahead is open and no lane animal comes within two metres of the way;
  //   3. room round every station of the company (a body's length fore and aft, a body's breadth either side).
  // (At the ring the brief's fifteen clear metres hold by where the lines lie: PART.) Nobody is taken out: whoever breaks a rule is moved
  // along its line to the nearest place that keeps them all.
  {
    const GAP_O = 0.2, BAND = [3.2, -2, 5], ROOM = [2.7, 1.05], STEP = 3, q = new THREE.Vector3(), q2 = new THREE.Vector3(), tn = new THREE.Vector3(), walk = [];
    const mark = (s) => { Y.posAt(s, q); Y.tanAt(s, tn); const il = 1 / Math.max(1e-4, Math.hypot(tn.x, tn.z)), t = Y.timeAtU(s / Y.L), st = [];
      for (const fn of stationFns) { const a = fn(s, t); if (a[2] < 0.3) st.push(a[0], a[1]); }
      walk.push({ s, t, x: q.x, z: q.z, fx: tn.x * il, fz: tn.z * il, gp: partAt(s / Y.L), st }); };
    for (let s = 0; s <= Y.sLip; s += STEP) mark(s);
    for (let s = Y.sBar; s <= Y.L; s += STEP) mark(s);
    await ctx.yield();
    const wrap = (o) => ((o - COL_LO) % COL_SPAN + COL_SPAN) % COL_SPAN + COL_LO;
    const gap = (a, b) => { const d = Math.abs(a - b) % COL_SPAN; return Math.min(d, COL_SPAN - d); };
    // where the animal at place o of a line is when we are at mark f (the shader's own rule: the parted bake while the column stands apart)
    const breaks = (row, o, f) => {
      const oe = wrap(o); drawnAt(row, oe, f.t, f.gp, q, q2);
      const dx = q.x - f.x, dz = q.z - f.z, ah = dx * f.fx + dz * f.fz, lat = -dx * f.fz + dz * f.fx;
      if (Math.abs(lat) < BAND[0] && ah > BAND[1] && ah < BAND[2]) return true;
      for (let i = 0; i < f.st.length; i += 2) { const a = (ah - f.st[i]) / ROOM[0], b = (lat - f.st[i + 1]) / ROOM[1]; if (a * a + b * b < 1) return true; }
      return false;
    };
    const rowLat = new Map(colRows.map((r, li) => [r, plainLat(bases[li])])), lines = new Map(), lineOf = (row) => { const l = rowLat.get(row); return Math.sign(l) * Math.round(Math.abs(l) * 2 + 0.02); };
    for (const sl of slots) if (sl.period < 0) { const key = lineOf(sl.row); if (!lines.has(key)) lines.set(key, []); lines.get(key).push(sl); }
    const bad = (sl, o, mates) => mates.some((m) => m !== sl && gap(m.o, o) < GAP_O) || walk.some((f) => breaks(sl.row, o, f));
    let nMoved = 0, nStuck = 0;
    for (let i = slots.length - 1; i >= 0; i--) {
      if ((i & 3) === 0) await ctx.yield();
      const sl = slots[i]; if (sl.period >= 0 || pinned.has(sl)) continue;
      const mates = lines.get(lineOf(sl.row));
      if (!bad(sl, sl.o, mates)) continue;
      let ok = false;
      for (let k = 1; k <= 360 && !ok; k++) { const o2 = sl.o + (k & 1 ? 1 : -1) * 0.05 * ((k + 1) >> 1); if (!bad(sl, o2, mates)) { sl.o = o2; ok = true; } }
      if (ok) nMoved++; else nStuck++;
    }
    B.moved = [nMoved, nStuck];
    await ctx.yield();
    // the zebra family that wades out on our left: the first four grown animals of the left-hand lines that run between half a second and a
    // second and a half ahead of us (seven to seventeen metres up the bar), by lane and place alone
    let fam = 0;
    for (const li of [4, 2, 6]) for (const sl of slots) {
      if (fam >= 4 || sl.row !== colRows[li] || authored.has(sl) || sl.calf || sl.period >= 0) continue;
      const oe = wrap(sl.o);
      if (oe > 0.62 && oe < 1.45) { sl.kind = 'zx'; sl.tint = tintZ(rx); sl.size = rx.range(0.9, 0.98); fam++; }
    }
  }
  // how near an animal of a free line ever comes to our own line: the least distance between its track and the route, taken at even
  // steps of three metres of the route (with the time we are at each)
  const pvM = new THREE.Vector3(), hqM = new THREE.Vector3();
  const routeMarks = (sA, sB) => { const m = []; for (let s = sA; s <= sB; s += 3) { Y.posAt(s, pvM); m.push([Y.timeAtU(s / Y.L), pvM.x, pvM.z]); } return m; };
  const nearestOn = (lane, o, period, marks) => { let m = 1e9; for (const f of marks) { laneAt(lane, ((f[0] + o) % period + period) % period, hqM); m = Math.min(m, Math.hypot(hqM.x - f[1], hqM.z - f[2])); } return m; };
  // the other arms: three lines feeding the Fall, one leaving the far bar (of that one the light build serves all but those whose track
  // comes within 12 m of our line, as in the water)
  const freeRows = [], barMarks = routeMarks(Y.sLip, Y.L);
  for (let ti = 0; ti < land.tracks.length; ti++) {
    const line = land.tracks[ti], bar = ti === 3, lats = bar ? [-1.1, 1.3] : [-1.4, 1.5];
    for (const lat of lats) {
      await ctx.yield();
      const fr = B.free(line, lat + rng.range(-0.3, 0.3), rng.range(11, 13)); freeRows.push(fr);
      let o = rng.range(0, 1.5);
      while (o < fr.period - 0.4) {
        const zebra = opt.zebraCast ? rng.chance(0.22) : rng.chance(0.06);
        add(fr.row, o, 1, fr.period, zebra, bar && nearestOn(B.lanes[fr.row], o, fr.period, barMarks) < 12 ? 0 : 3, rng.range(-0.4, 0.4));
        o += (rng.chance(0.25) ? rng.range(2.2, 4) : rng.range(0.8, 1.5)) / dens * (bar ? 1.4 : 1);
      }
    }
  }
  // ---- the river is full of them: six more files in the water, swimming at their own pace (we overtake them). They take to the water under
  // the lip either side of where the leapers come down, so the water under the leap is heads and backs; three files hold between us and the
  // Fall, seven metres and more off our own line, come ashore well down the bar and go off along its beach; three bear away to our right,
  // round the hippos' slack, and climb the bar upstream of us to join the line that leaves it. Each file is full from end to end: a start
  // drawn from the seed and one rule of spacing all the way along it; the light build serves all but those whose own track comes within
  // 9 m of our line (the least distance between the swimmer and us, taken at even steps of the route's metres across the river).
  const waterRows = [];
  {
    const wr = ctx.rng.fork('water'), pv = new THREE.Vector3(), tv = new THREE.Vector3(), s0 = Y.sLip + 4.5;
    const off = (s, lat) => { Y.posAt(s, pv); Y.tanAt(s, tv); const il = 1 / Math.max(1e-4, Math.hypot(tv.x, tv.z)); return [pv.x - tv.z * il * lat, pv.z + tv.x * il * lat]; };
    const marks = routeMarks(Y.sLip, Y.sExit), nearest = (lane, o, period) => nearestOn(lane, o, period, marks);
    for (let k = 0; k < 6; k++) {
      await ctx.yield();
      const left = k < 3, j = k % 3, pts = [];
      if (left) {
        const l0 = [-2.8, -6.6, -10.4][j], l1 = [-7.6, -10.6, -13.6][j], l2 = -(17 + 2.6 * j);
        for (let s = s0; s < Y.sExit + 5; s += 7) pts.push(off(s, lerp(lerp(l0, l1, sstep(s0 + 5, Y.sSplash + 6, s)), l2, sstep(Y.sWade - 14, Y.sLand + 6, s))));
        for (const p of [[97, 76.5], [112, 82.6], [126, 84.6], [146, 77], [166, 70], [200, 47.5]]) pts.push([p[0] + 1.2 * j, p[1] + 2.1 * j]);
      } else {
        const l0 = [3.1, 7.2, 11.6][j], l1 = [7.8, 11.4, 15.6][j];
        for (let s = s0; s < Y.sSplash + 16; s += 7) pts.push(off(s, lerp(l0, l1, sstep(s0 + 5, Y.sSplash + 6, s))));
        for (const p of [[-16, 57.5], [0, 67.5], [10, 73.5], [22, 80.5], [36, 88], [52, 94], [72, 100]]) pts.push([p[0] - 1.6 * j, p[1] + 2.2 * j]);
      }
      const fr = B.free(makeLine(smoothLine(pts, 7)), 0, wr.range(11, 12.5), left ? 3.4 : 2.7), lane = B.lanes[fr.row]; waterRows.push(fr.row);
      const gapS = left ? [[1.5, 3.4], [1.9, 3.9], [2.4, 4.6]][j] : [[1.1, 2.1], [1.2, 2.4], [1.3, 2.7]][j];
      let near = 0;                                                    // (a file that swings more than 55 m from our line swims twice as open there)
      for (let tau = wr.range(0, 1.2); tau < fr.period - 0.4; tau += wr.range(gapS[0], gapS[1]) / Math.min(dens, 1.06) * (near > 55 ? 2 : 1)) {
        const o = tau, calf = wr.chance(0.16), size = calf ? wr.range(0.68, 0.8) : wr.range(0.93, 1.1);
        near = nearest(lane, o, fr.period);
        slots.push({ row: fr.row, o, r: 1, period: fr.period, seed: wr(), size, calf: calf ? 1 : 0, jit: wr.range(-0.5, 0.5), kind: near < 9 ? 'lo' : 'f', tint: tintW(calf, wr) });
      }
    }
  }
  // ---- our own company in the water and up the far bank (their stations: compFn above): heads, horns and foam collars two to five metres
  // off for the whole swim, so the water under us is never empty. Each shakes itself dry by the herd's one rule (HERD_VERT).
  await ctx.yield();
  const compRows = [];
  {
    const cr = ctx.rng.fork('wade');
    for (let i = 0; i < COMP.length; i++) {
      await ctx.yield();
      const c2 = B.track(compFn[i]); compRows.push(c2.row);
      slots.push({ row: c2.row, o: -c2.t0, r: 0, period: c2.period, seed: cr(), size: COMP[i][2], calf: 0, jit: 0, kind: 'x', tint: tintW(0, cr) });
    }
  }
  // ---- the zebra family on the plain (famFn above). It is never under the ground: it runs off over the plain.
  const famRows = [];
  {
    const fr = ctx.rng.fork('family');
    for (let i = 0; i < FAM.length; i++) {
      await ctx.yield();
      const cp = B.track(famFn[i]);
      famRows.push(cp.row); slots.push({ row: cp.row, o: -cp.t0, r: 0, period: cp.period, seed: fr(), size: FAM[i][2], calf: 0, jit: 0, kind: i ? 'z' : 'zx', tint: tintZ(fr) });
    }
  }
  // ---- the two at our elbows on the run in (elbowFn above)
  const flkRows = [];
  for (let i = 0; i < 2; i++) {
    await ctx.yield();
    const cp = B.track(elbowFn[i], 0, elbowFn[i].t1);
    flkRows.push(cp.row); slots.push({ row: cp.row, o: -cp.t0, r: 0, period: cp.period, seed: fkR(), size: i ? 0.99 : 1.03, calf: 0, jit: 0, kind: 'x', tint: tintW(0, fkR) });
  }
  // ---- the zebra family again in the river and on the far bank (exitFn above)
  const exitRows = [];
  {
    const fz = ctx.rng.fork('exit-family');
    for (let i = 0; i < EXITZ.length; i++) {
      await ctx.yield();
      const cp = B.track(exitFn[i]);
      exitRows.push(cp.row); slots.push({ row: cp.row, o: -cp.t0, r: 0, period: cp.period, seed: fz(), size: EXITZ[i][3], calf: 0, jit: 0, kind: EXITZ[i][4], tint: tintZ(fz) });
    }
  }
  // ---- and the zebra that surges clear of the crocodile's lunge: it swims the river ten metres off on our right, a length and a half
  // ahead, and drives forward as it comes abeam of where the crocodile lies (the brief's beat); it lands wide on the bar, astern of us
  {
    const fs = ctx.rng.fork('surge'), sL = opt.lunge.sL, S0 = Y.sSplash;
    await ctx.yield();
    const cp = B.track((s) => [lerp(5.5, 12, sstep(sL - 9, sL, s)) - 3 * sstep(sL + 8, sL + 40, s) - 15 * sstep(Y.sWade - 30, Y.sLand + 10, s), 9.6 + 4.4 * sstep(Y.sWade - 26, Y.sLand, s), 5 * (1 - sstep(S0 + 3, S0 + 9, s))]);
    exitRows.push(cp.row); slots.push({ row: cp.row, o: -cp.t0, r: 0, period: cp.period, seed: fs(), size: 0.97, calf: 0, jit: 0, kind: 'z', tint: tintZ(fs) });
  }
  // ---- the multitude: the other lines of the herd over the plain, a card each. Wide bands along the three arms that feed the Fall and
  // one more on our right making for the river above the gully; and the thousands standing and grazing between them.
  const far = [];                                              // [row, o, 1, period, seed, size, run, jit, x, y, z, heading]
  const pathPt = (sv, lat) => { const sc = Math.max(0, sv); Y.posAt(sc, fv); Y.tanAt(sc, ft); const il = 1 / Math.max(1e-4, Math.hypot(ft.x, ft.z)), tx = ft.x * il, tz = ft.z * il; return [fv.x + tx * (sv - sc) - tz * lat, fv.z + tz * (sv - sc) + tx * lat]; };
  const fv = new THREE.Vector3(), ft = new THREE.Vector3(), flank = (sd) => { const pts = []; for (let sv = -170; sv < Y.sGully + 12; sv += 30) pts.push(pathPt(sv, sd * (32 + 3 * Math.sin(sv * 0.021 + sd)))); return pts; };
  const t0 = land.tracks[0].pts, flankL = makeLine(smoothLine([...flank(-1), [-118, -58], [-70, -74], [-36, -74], [-14, -64], [-7, Y.sh.zBack - 2]], 14), 10);
  const flankR = makeLine(smoothLine([...flank(1), [-150, 98], [-134, 150], [-129, 230], [-142, 300]], 14), 10);
  const streams = [[flankL, [-12, -7, -2.5, 2.5, 7, 12]], [flankR, [-12, -7, -2.5, 2.5, 7, 12]], [land.tracks[0], [-8, 8]], [land.tracks[1], [-8, 8]], [land.tracks[2], [-8, 8]]];
  const dustRows = [];
  for (const [line, lats] of streams) for (const lat of lats) {
    await ctx.yield();
    const fr = B.free(line, lat + rng.range(-1.5, 1.5), rng.range(10.5, 12.5));
    let o = rng.range(0, 0.4);
    while (o < fr.period - 0.2) {
      const calf = rng.chance(0.18);
      far.push([fr.row, o, 1, fr.period, rng(), calf ? rng.range(0.66, 0.78) : rng.range(0.92, 1.1), 1, rng.range(-3, 3), 0, 0, 0, 0]);
      if (rng.chance(0.22 * Math.min(1, ctx.quality?.detail ?? 1))) dustRows.push([fr.row, o, 1, fr.period, rng(), rng.range(0.8, 1.3), rng.range(-3, 3), 5]);
      o += (rng.chance(0.07) ? rng.range(0.9, 2.2) : rng.range(0.07, 0.2)) / dens;
    }
  }
  // the column itself, many times as thick on ahead of us: cards between the modelled lines and outside them from 17 m on. Each rides between two
  // lanes (iP.y = the other lane, iP.z = how far across), so the mass closes up with the lanes in the gullies and parts with them at the ring.
  // None leaps: they are lost in the dust before the lip (iP.x = that lane time) and found again on the far bar (iP.w).
  await ctx.yield();
  {
    const tLipC = Y.timeAtU((Y.sLip + 1) / Y.L) + T0, tOutC = Y.timeAtU((Y.sBar + 3) / Y.L) + T0, dK2 = ctx.quality?.detail ?? 1;
    const pairs = [[0, 2, 0.34, 0.74], [1, 3, 0.34, 0.74], [2, 4, 0.3, 0.7], [3, 5, 0.3, 0.7], [4, 6, 0.3, 0.7], [5, 7, 0.3, 0.7], [4, 6, 1.25, 2.1], [5, 7, 1.25, 2.1], [12, 0, 0.3, 0.75], [13, 1, 0.3, 0.75], [12, 13, 0.25, 0.75]];
    for (const [la, lb, f0, f1] of pairs) for (let o = 1.3 + rng.range(0, 0.1); o < COL_LO + COL_SPAN - 0.6; o += rng.range(0.085, 0.19) / (dens * dK2)) {
      const calf = rng.chance(0.18), f = rng.range(f0, f1);
      if (la >= 12 && o > 6.2) continue;                                         // (the lane dead ahead is thick to ninety metres, not beyond)
      far.push([colRows[la], o, rates[la], -1, rng(), calf ? rng.range(0.66, 0.78) : rng.range(0.92, 1.1), 1, 0, tLipC, colRows[lb], f, la >= 12 ? 1e6 : tOutC]);
      if (rng.chance(0.07)) dustRows.push([colRows[la], o, rates[la], -1, rng(), rng.range(0.8, 1.3), rng.range(-3, 3), 5]);
    }
  }
  {
    const want = Math.round(1600 * (ctx.quality?.detail ?? 1)), nz = ctx.noise; let got = 0;
    for (let tries = 0; got < want && tries < want * 12; tries++) {
      if ((tries & 63) === 0) await ctx.yield();
      const x = rng.range(-560, 380), z = rng.range(-260, 340), q = land.sample(x, z);
      if (q.kind === 1 || q.lat < 50 || q.lat > 250 || q.hw < 30 || q.wall || q.trO > 0.05 || (q.kind === 2 && q.dI < 16) || rng() > 1.25 - q.lat / 250) continue;
      if (nz.n2(x * 0.011 + 3.1, z * 0.011 - 7.7) + 0.5 * nz.n2(x * 0.04, z * 0.04) < 0.05) continue;       // in clumps
      const y = land.height(x, z); if (y < W + 1.5) continue;
      const calf = rng.chance(0.15);
      far.push([0, 0, 1, 0, rng(), calf ? rng.range(0.66, 0.78) : rng.range(0.92, 1.1), rng.chance(0.2) ? 0.5 : 0, 0, x, y, z, rng.range(-0.9, 0.9) + (rng.chance(0.2) ? Math.PI : 0)]);
      got++;
    }
  }
  await ctx.yield();
  // ---- the budget: of the column's far end (ninety metres and more ahead of us) every second or third animal is left to the cards, and
  // the light build serves from forty-five metres on, and astern
  { let k = 0, k2 = 0; const rb = ctx.rng.fork('budget');
    // (the three arms that feed the Fall are never within eighty metres of us: a zebra there is a grey shape, and the light build draws it)
    const farRows = freeRows.slice(0, 6).map((f) => f.row);
    for (const sl of slots) if (sl.kind === 'z' && farRows.includes(sl.row)) { sl.kind = 'f'; sl.tint = tintW(0, rb); sl.size = rb.range(0.93, 1.1); }
    for (let i = slots.length - 1, k3 = 0; i >= 0; i--) if (farRows.includes(slots[i].row) && (k3++ % 3) === 2) slots.splice(i, 1);            // (and of their modelled animals two in three serve: the cards carry those lines)
    for (let i = slots.length - 1; i >= 0; i--) {
      const sl = slots[i]; if (sl.period >= 0 || authored.has(sl)) continue;
      if (sl.kind === 'z' && sl.o >= 4.6) { sl.kind = 'f'; sl.tint = tintW(0, rb); }                 // (a zebra's stripes do not carry sixty metres)
      if (sl.kind === 'f' && sl.o >= 7 && (k++ % 4) !== 0) { slots.splice(i, 1); continue; }
      if (sl.kind === 'f' && sl.o >= 5.6 && sl.o < 7 && (k2++ % 2) === 0) { slots.splice(i, 1); continue; }      // (seventy metres off the cards carry the mass)
      if (sl.kind === 'lo' && (sl.o > 2.5 || sl.o < -0.9)) sl.kind = 'f';
      if (sl.kind === 'x' && (sl.o < -0.2 || sl.o > 1.3)) sl.kind = 'hi';                                          // (astern of us nobody is seen close to: the light builds serve)
      if (sl.kind === 'hi' && (sl.o > 1.3 || sl.o < -0.45)) sl.kind = 'lo';
      if (sl.kind === 'zx' && (sl.o > 1.3 || sl.o < -0.45)) sl.kind = 'z';
    } }
  await ctx.yield();
  const tex = laneTexture(B.lanes);
  await ctx.yield();
  // where each column lane comes down (lane time): its splash stands there
  const tSplash = Y.timeAtU((Y.sSplash - 1) / Y.L) + T0, landT = bases.map(() => tSplash);
  colRows.forEach((row, li) => { const b = B.lanes[row].b; let k1 = -1; for (let k = 0; k < LW; k++) if (b[k * 4] > 0.5) k1 = k; if (k1 >= 0 && row < NCOL) landT[row] = (k1 + 1) * LDT; });
  const HU = { uLane: { value: tex }, uClock: { value: 0 }, uPrev: { value: 0 }, uPrevF: { value: 0 }, uSurge: { value: 0 }, uLandT: { value: landT }, uPart: { value: new THREE.Vector2(1, 0) } };
  // tiers: x = the camera's own company (full anatomy), hi = within 40 m, lo and f = the old light builds for the far column; zx / z the same for zebra
  const geos = {};
  geos.x = beastGeometry(PAL, 'w', 2); await ctx.yield();
  geos.hi = beastGeometry(PAL, 'w', 1); await ctx.yield();
  geos.lo = wildebeestGeometry(PAL, true); await ctx.yield(); geos.f = wildebeestGeometry(PAL, 2); await ctx.yield();
  geos.zx = beastGeometry(PAL, 'z', 2); await ctx.yield();
  geos.z = beastGeometry(PAL, 'z', 1);
  await ctx.yield();
  const camL = (r, s, camera) => { U.uCamL.value.setFromMatrixPosition(camera.matrixWorld); };
  const meshes = [], count = { x: 0, hi: 0, lo: 0, f: 0, zx: 0, z: 0 }; let triangles = 0;
  for (const kind of ['x', 'hi', 'lo', 'f', 'zx', 'z']) {
    const list = slots.filter((s) => s.kind === kind), n = list.length; count[kind] = n; if (!n) continue;
    const iL = new Float32Array(n * 4), iD = new Float32Array(n * 4), iT = new Float32Array(n * 3);
    list.forEach((s, i) => { iL.set([s.row, s.o, s.r, s.period], i * 4); iD.set([s.seed, s.size, s.calf, s.jit], i * 4); iT.set(s.tint, i * 3); });
    const base = geos[kind], g = new THREE.InstancedBufferGeometry(), zeb = kind === 'z' || kind === 'zx';
    g.index = base.index; for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
    g.setAttribute('iL', new THREE.InstancedBufferAttribute(iL, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4)); g.setAttribute('iTint', new THREE.InstancedBufferAttribute(iT, 3));
    g.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...HU, uRim: U.uRim },
      fog: true, vertexColors: true, side: THREE.DoubleSide, transparent: true, defines: zeb ? { ZEBRA: 1 } : {}, vertexShader: HERD_VERT, fragmentShader: ANIMAL_FRAG });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2.5; mesh.onBeforeRender = camL;
    meshes.push(mesh); triangles += (base.index.count / 3) * n;
  }
  await ctx.yield();
  // ---- what the hooves and chests throw up: dust puffs on land, foam collars and wakes in the water, a splash where each lands
  const tr = [];                                               // [iL x4, seed, size, phase, type]
  const dK = ctx.quality?.detail ?? 1, wallRows = bases.map((b, li) => (Math.abs(b) > 4.5 ? colRows[li] : -1));      // the lines along the gully's walls raise no low sheet of dust: a sprite cut off by the wall is a rectangle
  for (const s of slots) {
    const col = s.period < 0, L4 = [s.row, s.o, s.r, s.period];
    const fam = famRows.includes(s.row) || flkRows.includes(s.row) || exitRows.includes(s.row), nd = compRows.includes(s.row) ? 0 : col || fam ? (s.kind === 'lo' || s.kind === 'f' ? 2 : 3) : (rng.chance(0.6 * dK) ? 1 : 0);
    for (let k = 0; k < nd; k++) if (rng() < dK + 0.2) tr.push([...L4, rng(), s.size * rng.range(0.9, 1.3), rng(), 0]);
    if (col || compRows.includes(s.row) || exitRows.includes(s.row) || waterRows.includes(s.row) || s.row === freeRows[freeRows.length - 1].row || s.row === freeRows[freeRows.length - 2].row) tr.push([...L4, s.seed, s.size, s.jit, 1]);
    if (col) tr.push([...L4, rng(), s.size, s.jit, 3]);
    if ((col || compRows.includes(s.row) || exitRows.includes(s.row)) && s.kind !== 'f') for (const fore of [0.5, -0.45, 0]) tr.push([...L4, rng(), s.size, s.jit + Math.sign(fore) * 3.8, 2]);      // white water round the legs of whoever wades (z: lateral jitter + 8 x metres fore or aft)
    if ((col || compRows.includes(s.row) || exitRows.includes(s.row)) && s.kind !== 'f' && s.kind !== 'lo') { tr.push([...L4, s.seed, s.size, s.jit, 6]); tr.push([...L4, (s.seed * 1.7 + 0.31) % 1, s.size * 1.15, s.jit, 6]); tr.push([...L4, s.seed, s.size, s.jit, 7]); }      // steam off a wet back, and the halo of its shake
    if (col && s.kind === 'lo') tr.push([...L4, s.seed, s.size, s.jit, 7]);                                       // (the shake's halo on the lighter build too)
    if ((col || fam) && rng() < dK + 0.3 && !wallRows.includes(s.row)) { tr.push([...L4, rng(), s.size * rng.range(1.2, 1.6), 0.04, 4]); tr.push([...L4, rng(), s.size * rng.range(1.5, 2.1), rng.range(0.4, 0.75), 4]); }
  }
  for (const d of dustRows) tr.push(d);
  const nT = tr.length, tL = new Float32Array(nT * 4), tS = new Float32Array(nT * 4);
  tr.forEach((t, i) => { tL.set(t.slice(0, 4), i * 4); tS.set(t.slice(4), i * 4); });
  const tg = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  tg.index = q.index; tg.setAttribute('position', q.attributes.position);
  tg.setAttribute('iL', new THREE.InstancedBufferAttribute(tL, 4)); tg.setAttribute('iS', new THREE.InstancedBufferAttribute(tS, 4)); tg.instanceCount = nT;
  const tmat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...HU }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 iL, iS; uniform float uTime, uWaterY, uShade; uniform vec3 uSun, uWind, uCamL;
      varying vec2 vUv, vWd; varying vec4 vK; varying vec3 vL3; varying float vG;
      ${LANE_GLSL}
      void main(){
        float type = iS.w, vis, a = 0.; int row = int(iL.x + .5) * 2;
        float tt = laneTime(iL, vis); vec4 P, dP; vec3 pos; vec2 q = position.xy;
        vec3 right = normalize(vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]));
        vec3 up = normalize(vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]));
        float lt = 0.;
        if (type < .5) {                                    // dust puff left behind where a hoof struck
          float life = 3.4, age = fract(uTime / life + iS.x) * life; lt = age;
          lanePos(tt - age, row, P, dP); vec4 aux = laneAux(tt - age, row);
          float k = age / life, sz = iS.y * mix(.35, 1.5, 1. - (1. - k) * (1. - k));
          pos = P.xyz + vec3(sin(iS.x * 40.) * .5, .1 + sz * .42 + age * .16, cos(iS.x * 31.) * .5) + uWind * age * .5;
          a = smoothstep(0., .08, k) * pow(1. - k, 1.4) * step(uWaterY + .12, P.y) * smoothstep(.7, .98, aux.w) * (1. - .6 * aux.y) * smoothstep(3., 7., length(dP.xz)) * (1. - .3 * uShade);
          pos += right * q.x * sz + up * q.y * sz;
        } else if (type < 1.5) {                            // foam collar and wake, flat on the water
          lanePos(tt, row, P, dP); float v = max(length(dP.xz), .3); vec2 hd = dP.xz / v;
          a = (1. - smoothstep(uWaterY - .4, uWaterY - .12, P.y)) * smoothstep(uWaterY - 1.9, uWaterY - 1.3, P.y);
          q.y = q.y * .5 - .3;                              // +0.2 ahead of the chest .. -0.8 astern
          vec2 c = P.xz + vec2(-hd.y, hd.x) * iS.z + hd * .55 * iS.y;
          vec2 xz = c + vec2(hd.y, -hd.x) * q.x * 1.4 * iS.y + hd * q.y * 4.2 * iS.y;
          pos = vec3(xz.x, uWaterY + .06, xz.y);
        } else if (type < 2.5) {                            // white water thrown up round the legs of whoever wades
          lanePos(tt, row, P, dP); float v = max(length(dP.xz), .3); vec2 hd = dP.xz / v;
          float md = iS.z > 2. ? 1. : iS.z < -2. ? -1. : 0., off = md * .47, lj = iS.z - md * 3.8;
          float depth = uWaterY - P.y;                         // how deep the hooves are
          a = smoothstep(-.03, .05, depth) * (1. - smoothstep(.7, 1.05, depth)) * smoothstep(1.5, 4., v);
          q.y = q.y * .5 + .5; up = vec3(0., 1., 0.);
          if (md == 0.) {                                    // the water that sheets off its belly: a curtain of falling drops along the body
            float base = max(uWaterY, P.y), hgt = max(P.y + .8 * iS.y - base, .05);
            vec2 c = P.xz + vec2(-hd.y, hd.x) * lj;
            pos = vec3(c.x, base, c.y) + vec3(hd.x, 0., hd.y) * q.x * .6 * iS.y + up * q.y * hgt;
            a *= laneAux(tt, row).y * .9; lt = uTime; type = 2.3;
          } else if (md < 0.) {                              // the white ring each pair of legs leaves on the water, lying flat, and the churn between
            float per = .62, ph = fract(uTime / per + iS.x); lt = ph * per;
            vec2 c = P.xz + vec2(-hd.y, hd.x) * lj + hd * .1 * iS.y, xz = c + vec2(hd.y, -hd.x) * q.x * .75 * iS.y + hd * (q.y * 2. - 1.) * 1.15 * iS.y;
            pos = vec3(xz.x, uWaterY + .025, xz.y); a *= smoothstep(.02, .1, depth); type = 2.6;
          } else {
            float per = .62, ph = fract(uTime / per + iS.x); lt = ph * per;
            vec2 c = P.xz + vec2(-hd.y, hd.x) * lj + hd * (off + .25) * iS.y;
            pos = vec3(c.x, max(uWaterY, P.y) + .01, c.y) + right * q.x * iS.y * .7 * (.6 + .7 * ph) + up * q.y * iS.y * mix(.55, .95, fract(iS.x * 7.3)) * smoothstep(0., .12, ph) + vec3(hd.x, 0., hd.y) * ph * .6;
            a *= 1. - ph * ph;
          }
        } else if (type > 5.5) {                            // whoever has been in the river: steam off its back, and the halo of spray its shake throws
          vec4 aux = laneAux(tt, row); float tOut = (1. - aux.y) * ${DRY_T.toFixed(1)};       // seconds since it left the deep water
          if (type > 6.5) {
            lanePos(tt, row, P, dP); float v = max(length(dP.xz), .3); vec2 hd = dP.xz / v;
            float k = (tOut - (${SHK[0].toFixed(1)} + ${SHK[1].toFixed(1)} * fract(iS.x * 13.7))) / 1.; lt = clamp(k, 0., 1.3);
            a = aux.y > .02 ? step(uWaterY + .3, P.y) * smoothstep(0., .06, k) * (1. - smoothstep(.95, 1.25, k)) : 0.;
            float sz = iS.y * 1.45;                                 // a metre round the coat, no more: what it throws stays its own
            pos = P.xyz + vec3(-hd.y * iS.z, .98 * iS.y, hd.x * iS.z) + right * q.x * sz + up * q.y * sz;
          } else {
            float life = 1.5, age = fract(uTime / life + iS.x * 3.7) * life, k = age / life; lt = age;
            lanePos(tt - age * .3, row, P, dP); vec4 ax = laneAux(tt - age * .3, row); float v = max(length(dP.xz), .3); vec2 hd = dP.xz / v;
            float sz = iS.y * mix(.5, 1.7, k);
            pos = P.xyz + vec3(-hd.y * iS.z, (1.2 + .12 * sin(iS.x * 50.)) * iS.y + sz * .35 + age * .75, hd.x * iS.z) + vec3(hd.x, 0., hd.y) * (.5 * sin(iS.x * 23.)) + uWind * age * .25;
            a = sqrt(clamp(ax.y, 0., 1.)) * step(.02, ax.y) * step(uWaterY + .3, P.y) * smoothstep(.7, .98, ax.w) * smoothstep(0., .15, k) * (1. - k);
            pos += right * q.x * sz + up * q.y * sz;
          }
        } else if (type > 4.5) {                            // the pall that stands over a far line of the herd
          float life = 6., age = fract(uTime / life + iS.x) * life; lt = age;
          lanePos(tt - age, row, P, dP);
          float k = age / life, sz = iS.y * mix(1.6, 6.5, k);
          pos = P.xyz + vec3(sin(iS.x * 40.) * 3. + iS.z * .5, .5 + sz * .42 + age * .4, cos(iS.x * 31.) * 3.) + uWind * age * .8;
          a = smoothstep(0., .15, k) * (1. - k) * step(uWaterY + .12, P.y) * smoothstep(.7, .98, laneAux(tt - age, row).w) * .85;
          pos += right * q.x * sz + up * q.y * sz;
        } else if (type > 3.5) {                            // the knee-deep dust it runs in: a low wide puff at the hooves, and one trailing
          lanePos(tt - iS.z, row, P, dP); vec4 aux = laneAux(tt - iS.z, row); float sz = iS.y; lt = uTime * .3 + iS.z;
          pos = P.xyz + vec3(sin(iS.x * 40.) * .3, .24, cos(iS.x * 31.) * .3) + uWind * iS.z * .5;
          a = step(uWaterY + .12, P.y) * smoothstep(.7, .98, aux.w) * (1. - .6 * aux.y) * smoothstep(3., 7., length(dP.xz));
          pos += right * q.x * sz * 1.6 + vec3(0., 1., 0.) * (q.y + .35) * (.42 + .16 * sz);
        } else {                                            // the splash where it lands
          float tl = uLandT[clamp(int(iL.x + .5), 0, ${NCOL - 1})];
          lt = tt - tl - .05 - iS.x * .12; lanePos(tl + .15, row, P, dP);
          float life = 1.25, k = clamp(lt / life, 0., 1.), rise = smoothstep(0., .16, lt), fall = 1. - smoothstep(.3, 1., k);
          a = (lt > 0. && lt < life) ? smoothstep(0., .05, k) * (1. - k * k) : 0.;
          vec2 hd = normalize(dP.xz + vec2(1e-4, 0.));
          q.y = q.y * .5 + .5; up = vec3(0., 1., 0.);
          pos = vec3(P.x - hd.y * iS.z, uWaterY, P.z + hd.x * iS.z) + right * q.x * iS.y * 1.3 * (.55 + .9 * k) + up * q.y * iS.y * 1.9 * rise * (.3 + .7 * fall);
        }
        a *= vis;
        vec3 fwd = cross(right, up);
        vL3 = vec3(dot(uSun, right), dot(uSun, up), dot(uSun, fwd));
        vUv = position.xy; vK = vec4(type, a, iS.x, lt); vWd = vec2(dot(uWind, right), dot(uWind, up));
        vec3 vd = pos - uCamL; vG = max(dot(vd, uSun), 0.) / max(length(vd), .01); vG *= vG;          // seen against the sun the dust glows
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.);
        if (type < .5) a *= smoothstep(3., 8., -mvPosition.z) * (1. - .6 * smoothstep(60., 110., -mvPosition.z)); else if (type > 1.5 && type < 2.7) a *= smoothstep(1.2, 3., -mvPosition.z) * (1. - smoothstep(45., 70., -mvPosition.z)); else if (type > 5.5) a *= smoothstep(1.6, 4., -mvPosition.z) * (1. - smoothstep(45., 80., -mvPosition.z)); else if (type > 4.5) a *= smoothstep(16., 34., -mvPosition.z); else if (type > 3.5) a *= smoothstep(2.5, 7., -mvPosition.z) * (1. - .7 * smoothstep(50., 90., -mvPosition.z)); else if (type > 2.5) a *= .9 * smoothstep(2.6, 6.5, -mvPosition.z);
        vK.y = a;
        gl_Position = a > .004 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uFoam, uTea, uSkyRef, uHaze, uDustLit, uDustShade; uniform float uTime;
      varying vec2 vUv, vWd; varying vec4 vK; varying vec3 vL3; varying float vG;
      ${GLSL_COMMON}
      ${WATER_GLSL}
      ${GLSL_FOGMIX}
      void main(){
        float type = vK.x, al = 0., r = length(vUv), add = 1., pxw = fwidth(vUv.x) + fwidth(vUv.y); vec3 col;
        vec3 nn = vec3(vUv, sqrt(max(1. - min(r * r, 1.), 0.))); float lit = clamp(dot(nn, vL3) * .6 + .5, 0., 1.);
        if (type < .5) {
          float n = vn2(vUv * 1.9 + vK.z * 17. + vK.w * .25) * .65 + vn2(vUv * 4.7 - vK.z * 5.) * .35;
          al = (1. - smoothstep(.15, 1., r + (n - .5) * .9)) * (1. - smoothstep(.72, 1., r)) * .66;
          col = mix(mix(uDustShade * 1.6, uDustLit, .45), uDustLit * (.55 + .22 * uSunC), lit) + uDustLit * uSunC * vG * .3;
        } else if (type < 1.5) {
          al = wakeFoam(abs(vUv.x), .5 - vUv.y * .5, vK.z, vUv) * .96;          // 0 ahead of the chest .. 1 at the tail of the wake
          col = uFoam * (uSunC * .42 + uSkyC);
        } else if (type > 6.5) {
          // the shake: a short burst of fine bright drops flung off the coat, each on its own curved path (thrown out, slowed by the air,
          // falling), and a thin mist that drifts off downwind. The quad is 1.45 m either way from the middle of the body: nothing in it
          // travels more than a metre from the coat, and the mist is thin enough to see a zebra's stripes through.
          float k = clamp(vK.w, 0., 1.3), sd = vK.z, drops = 0.;
          for (int i = 0; i < 40; i++) {
            float fi = float(i), h1 = h21(vec2(fi * 1.31 + 3.7, sd * 91.7)), h2 = h21(vec2(fi * 2.17 + 9.1, sd * 37.3)), h3 = h21(vec2(fi * .73 + 5.3, sd * 53.9));
            float age = (k - h2 * .7) / .5;                                  // each leaves the coat at its own moment of the shake, and lives half a second
            if (age > 0. && age < 1.) {
              float th = h1 * 6.2832, tt = age * .5, sp = (.55 + .8 * h3) * 2.5, dr = (1. - exp(-tt * 3.6)) / 3.6;
              vec2 dir = vec2(cos(th), sin(th) * .75 + .4), o = vec2(cos(th) * .42, sin(th) * .2 + .03);
              vec2 p = o + dir * sp * dr + vec2(vWd.x * .12 * tt, -2.3 * tt * tt), vel = dir * sp * exp(-tt * 3.6) + vec2(0., -4.6 * tt);
              vec2 pa = vUv - p, ba = -vel * .016; float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.), d = length(pa - ba * hh);
              float rad0 = .016 + .016 * h1, rad = max(rad0, pxw * .8);
              drops += (1. - smoothstep(rad * .45, rad, d)) * min(1., rad0 * rad0 / (rad * rad) * 3.) * smoothstep(0., .08, age) * (1. - age * age * age);
            }
          }
          vec2 mc = vUv - vec2(vWd.x * .2 * k, .04 + .1 * k); float mr = length(mc * vec2(1., 1.25)) / (.36 + .3 * k);
          float fine = vn2(vUv * 4.6 + vec2(sd * 17., -k * 1.4)) * .6 + vn2(vUv * 10.5 - sd * 5.) * .4;
          float mist = exp(-mr * mr * 2.2) * smoothstep(.15, .7, fine) * .3 * smoothstep(0., .15, k) * (1. - smoothstep(.7, 1.25, k));
          al = clamp(drops * .95 + mist, 0., 1.) * (1. - smoothstep(.85, 1., r));
          col = mix(uFoam, uDustLit, .42) * (uSunC * (.38 + .5 * lit) + uSkyC * .8) + uFoam * uSunC * vG * .6; add = .7;
        } else if (type > 5.5) {                             // steam: thin wisps that rise off the wet hide and take the gold of the sun
          float n = vn2(vUv * 1.7 + vK.z * 17. + vec2(0., -vK.w * .9)) * .6 + vn2(vUv * 4.3 - vK.z * 5. + vec2(0., -vK.w * 1.7)) * .4;
          al = (1. - smoothstep(.05, 1., r + (n - .5) * 1.1)) * (1. - smoothstep(.7, 1., r)) * smoothstep(.26, .6, n) * .8;
          col = mix(uFoam, uDustLit, .45) * (uSunC * (.3 + .42 * lit) + uSkyC * .55) + uDustLit * uSunC * vG * .45; add = .75;
        } else if (type > 4.5) {
          float n = vn2(vUv * 1.6 + vK.z * 17. + vK.w * .12) * .65 + vn2(vUv * 3.9 - vK.z * 5.) * .35;
          al = (1. - smoothstep(.1, 1., r + (n - .5) * .9)) * (1. - smoothstep(.7, 1., r)) * .3;
          col = mix(mix(uDustShade * 1.6, uDustLit, .5), uDustLit * (.6 + .26 * uSunC), lit) + uDustLit * uSunC * vG * .3;
        } else if (type > 3.5) {
          float n = vn2(vUv * vec2(1.6, 1.1) + vK.z * 17. + vec2(vK.w, 0.)) * .65 + vn2(vUv * 4.1 - vK.z * 5.) * .35;
          al = (1. - smoothstep(.1, 1., r + (n - .5) * .8)) * (1. - smoothstep(.72, 1., r)) * (1. - smoothstep(-.5, 1., vUv.y)) * .86;
          col = mix(mix(uDustShade * 1.6, uDustLit, .5), uDustLit * (.6 + .26 * uSunC), clamp(vL3.x * vUv.x * .7 + .55, 0., 1.)) + uDustLit * uSunC * vG * .3;
        } else {
          vec2 u = vec2(vUv.x, vUv.y * .5 + .5);
          if (type > 2.5 && type < 2.7) {                    // rings on the water round the fore and the hind legs, spreading and breaking up
            float ph = vK.w / .62, n = vn2(vUv * 7. + vK.z * 13.) * .6 + vn2(vUv * 17. - vK.z * 5.) * .4;
            float r1 = length((vUv - vec2(0., .42)) * vec2(1.5, 2.6)) / (.3 + .6 * ph), r2 = length((vUv - vec2(0., -.42)) * vec2(1.5, 2.6)) / (.3 + .6 * fract(ph + .5));
            float ring = max(smoothstep(.5, .72, r1) * (1. - smoothstep(.8, 1., r1)) * (1. - ph * ph), smoothstep(.5, .72, r2) * (1. - smoothstep(.8, 1., r2)) * (1. - fract(ph + .5) * fract(ph + .5)));
            float churn = (1. - smoothstep(.3, 1., length(vUv * vec2(1.3, .95)))) * smoothstep(.45, .7, n);
            al = clamp(ring * (.5 + .9 * n) + churn * .7, 0., 1.) * .95;
          } else if (type > 2.2 && type < 2.4) {                    // drops falling off the belly
            float fx = vUv.x * 13. + vK.z * 9., c = floor(fx), h = h21(vec2(c, vK.z * 31.)), fall = fract(u.y * (1. + h) + vK.w * (2.2 + 2. * h) + h * 7.);
            al = (1. - smoothstep(.1, .3, abs(fx - c - .5))) * smoothstep(0., .25, fall) * (1. - smoothstep(.45, 1., fall)) * step(.3, h) * (1. - smoothstep(.6, 1., abs(vUv.x))) * .8;
          } else {
            al = spray(u, vK.z, clamp(vK.w / (type < 2.5 ? .62 : 1.25), 0., 1.), vK.w) * (type < 2.5 ? 1.5 : 1.);
          }
          col = uFoam * (uSunC * (.3 + .55 * lit) + uSkyC * .8); add = .8;
        }
        al *= vK.y;
        gl_FragColor = vec4(fogMix(col, FOGD) * al, al * add);
      }`,
  });
  const trail = new THREE.Mesh(tg, tmat); trail.frustumCulled = false; trail.renderOrder = 3.5; trail.onBeforeRender = camL;
  await ctx.yield();
  // ---- long shadows: every near animal on dry land throws its own outline, legs and all, along the ground away from the low sun. The quad is
  // the side view sheared: a point at (metres along the body, metres up) lies at hooves + heading x along + shadow direction x (up / tan elevation).
  // They multiply the ground under them (blue-violet: what the sky alone still lights), drawn before the herd so no animal is darkened by another's.
  const shSlots = slots.filter((s) => s.kind !== 'f' && (s.period < 0 || compRows.includes(s.row) || famRows.includes(s.row) || flkRows.includes(s.row) || exitRows.includes(s.row) || s.row === freeRows[freeRows.length - 1].row || s.row === freeRows[freeRows.length - 2].row));
  const nS = shSlots.length, sL = new Float32Array(nS * 4), sS = new Float32Array(nS * 4);
  shSlots.forEach((s, i) => { sL.set([s.row, s.o, s.r, s.period], i * 4); sS.set([s.seed, s.size, s.jit, s.calf || s.kind === 'z' || s.kind === 'zx' ? 1 : 0], i * 4); });
  const sg = new THREE.InstancedBufferGeometry();
  sg.setIndex([0, 1, 2, 0, 2, 3]); sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  sg.setAttribute('iL', new THREE.InstancedBufferAttribute(sL, 4)); sg.setAttribute('iS', new THREE.InstancedBufferAttribute(sS, 4)); sg.instanceCount = nS;
  const smat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...HU, uShK: { value: sstep(0.03, 0.16, U.uSun.value.y) } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8,
    blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 iL, iS; uniform float uWaterY, uShade, uShK; uniform vec3 uSun;
      varying vec2 vQ; varying vec4 vK;
      ${LANE_GLSL}
      ${CLOUD_GLSL}
      void main(){
        float vis; int row = int(iL.x + .5) * 2; float tt = laneTime(iL, vis); vec4 P, dP; lanePos(tt, row, P, dP); vec4 aux = laneAux(tt, row);
        float v = max(length(dP.xz), .5), size = iS.y; vec2 hd = dP.xz / v;
        vec2 sd = -uSun.xz; float sl = max(length(sd), 1e-3); sd /= sl;
        float k = min(sl / max(uSun.y, .04), 4.4);                          // metres of shadow to a metre of height
        vec2 q = vec2(position.x * 1.5, position.y * 1.85) * size;
        vec2 c = P.xz + vec2(-hd.y, hd.x) * iS.z, xz = c + hd * q.x + sd * (k * q.y);
        float a = vis * step(uWaterY + .12, P.y) * smoothstep(.7, .98, aux.w) * (1. - .93 * uShade) * uShK;
        a *= 1. - 1.15 * (1. - cloudSun(P.xz));                              // under a cloud nothing throws a shadow
        a *= mix(.5, 1., smoothstep(uWaterY + .9, uWaterY + 2.6, P.y));      // and on the wet mud of the bar it is faint: the mud is dark already
        float run = smoothstep(3., 9., v), stride = 4.5 * size * mix(.42, 1., run);
        vec4 mvPosition = modelViewMatrix * vec4(xz.x, P.y + .06, xz.y, 1.);
        a *= (1. - smoothstep(55., 100., -mvPosition.z)) * exp(-max(-mvPosition.z - 5., 0.) * .022);
        vQ = q / size; vK = vec4(fract(P.w / stride + iS.x * 7.), a, iS.w, run);
        gl_Position = a > .01 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC;
      varying vec2 vQ; varying vec4 vK;
      ${SIL_GLSL}
      ${GLSL_FOGMIX}
      void main(){
        float ph = vK.x * 6.2832; vec2 q = vQ; q.y -= .05 * sin(ph) * vK.w;
        float d = beastSil(q, 1., vK.w, ph, vK.z) - .045 * (1. - smoothstep(.45, .8, q.y));        // (the legs a little stouter than life, or they are lost)
        float soft = .012 + .022 * q.y + max(fwidth(q.x), fwidth(q.y)) * .8;       // the edge softens with the height of what throws it
        float al = (1. - smoothstep(-soft, soft, d)) * vK.y * (1. - fogAt(FOGD));
        vec3 amb = mix(uGndC, uSkyC, .9) * .8, lit = uSunC * max(uSun.y, .05) * 1.15 + amb;
        gl_FragColor = vec4(mix(vec3(1.), max(amb / max(lit, vec3(1e-3)) * vec3(.98, .9, 1.), vec3(.46, .38, .32)), al), 1.);
      }`,
  });
  const shadow = new THREE.Mesh(sg, smat); shadow.frustumCulled = false; shadow.renderOrder = 0.5;
  await ctx.yield();
  // ---- the far herd's cards: an upright quad per animal turned to the lens, its outline drawn in the shader (running or grazing)
  const nF = far.length, fL = new Float32Array(nF * 4), fD = new Float32Array(nF * 4), fP = new Float32Array(nF * 4);
  far.forEach((f, i) => { fL.set(f.slice(0, 4), i * 4); fD.set(f.slice(4, 8), i * 4); fP.set(f.slice(8, 12), i * 4); });
  const fg = new THREE.InstancedBufferGeometry();
  fg.setIndex([0, 1, 2, 0, 2, 3]); fg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  fg.setAttribute('iL', new THREE.InstancedBufferAttribute(fL, 4)); fg.setAttribute('iD', new THREE.InstancedBufferAttribute(fD, 4)); fg.setAttribute('iP', new THREE.InstancedBufferAttribute(fP, 4)); fg.instanceCount = nF;
  const fmat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...HU }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 iL, iD, iP; uniform float uTime, uWaterY; uniform vec3 uCamL, uSun;
      varying vec2 vUv; varying vec4 vK; varying float vA, vE, vS, vCs;
      ${LANE_GLSL}
      ${CLOUD_GLSL}
      void main(){
        float seed = iD.x, size = iD.y, run = iD.z, vis = 1., cyc; vec3 P; vec2 hd;
        if (abs(iL.w) > .5) {
          float tt = laneTime(iL, vis); vec4 Lp, dL; lanePos(tt, int(iL.x + .5) * 2, Lp, dL);
          if (iL.w < 0.) { vec4 Lq, dQ; float gp = gPart; lanePos(tt, int(iP.y + .5) * 2, Lq, dQ);
            float fz = iL.x > 11.5 && iP.y > 11.5 ? mix(iP.z, step(.5, iP.z), smoothstep(0., .25, gp)) : iP.z;       // (who runs between the two lines dead ahead stands with the nearer of them while they are apart)
            Lp = mix(Lp, Lq, fz); dL = mix(dL, dQ, fz);
            vis *= 1. - smoothstep(iP.x - .4, iP.x, tt) + smoothstep(iP.w, iP.w + 1., tt); }
          float v = max(length(dL.xz), .5); hd = dL.xz / v; P = Lp.xyz + vec3(-hd.y, 0., hd.x) * iD.w; cyc = Lp.w / (4.5 * size) + seed * 7.;
          vis *= step(uWaterY + .2, Lp.y);
        } else { P = iP.xyz; hd = vec2(cos(iP.w), sin(iP.w)); cyc = seed * 7. + uTime * .35 * run; }
        vec3 toC = uCamL - P; float dist = max(length(toC), .01); vec2 f = -toC.xz / max(length(toC.xz), .01), r = vec2(-f.y, f.x);
        float side = dot(hd, r), lenK = mix(.4, 1., abs(side));                       // seen end on it is only as wide as its shoulders
        vec3 wp = P + vec3(r.x, 0., r.y) * (position.x * 1.3 * size * lenK) + vec3(0., position.y * 1.7 * size, 0.);
        vUv = vec2(position.x * (side < 0. ? -1. : 1.), position.y); vK = vec4(run, fract(cyc), seed, size);
        vCs = cloudSun(P.xz);
        vA = vis * smoothstep(12., 18., dist); vE = abs(side); vS = dot(normalize(uSun.xz + vec2(1e-4, 0.)), r) * (side < 0. ? -1. : 1.);
        vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
        gl_Position = vA > .004 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uGndC, uDustLit;
      varying vec2 vUv; varying vec4 vK; varying float vA, vE, vS, vCs;
      ${SIL_GLSL}
      void main(){
        float run = min(vK.x * 2., 1.), gait = step(.75, vK.x), a = vK.y * 6.2832, calf = 1. - step(.85, vK.w);
        vec2 q = vec2(vUv.x * 1.3, vUv.y * 1.7); q.y -= .05 * sin(a) * gait;
        float aa = max(fwidth(q.x), fwidth(q.y)) * .7 + 1e-4;
        float d = vE < .5 ? beastRear(vec2(q.x * mix(.4, 1., vE), q.y), gait, a, calf) : beastSil(q, run, gait, a, calf);
        float al = (1. - smoothstep(-aa, aa, d)) * vA; if (al < .01) discard;
        vec3 base = mix(vec3(.105, .09, .082), vec3(.15, .115, .085), calf) * (.8 + .4 * fract(vK.z * 7.3));
        float top = smoothstep(.8, 1.35, q.y), rim = max(smoothstep(-.09, -.01, d) * smoothstep(.6, 1.1, q.y), smoothstep(-.045, -.008, d) * clamp(vUv.x * vS * 2.5 + .1, 0., 1.) * smoothstep(.3, .7, q.y) * .8);      // the sun's side of it burns
        vec3 col = base * ((uSkyC * .6 + uGndC * .35) * (.8 + .2 * vCs) + uSunC * (.03 + .14 * top + .45 * rim) * vCs);          // dark slate against the gold, a lit line along the spine
        col = mix(col, uDustLit * (.3 + .25 * vCs), (1. - smoothstep(0., .4, q.y)) * .45);              // its legs are lost in its own dust
        gl_FragColor = vec4(col, al);
        #ifdef USE_FOG
          float fd = vFogDepth * .45; gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1. - exp(-fogDensity * fogDensity * fd * fd));       // a dark shape holds its own in the haze longer than the ground does
        #endif
      }`,
  });
  const farMesh = new THREE.Mesh(fg, fmat); farMesh.frustumCulled = false; farMesh.renderOrder = 3.6; farMesh.onBeforeRender = camL;
  return { meshes, trail, shadow, far: farMesh, flanks: [flankL, flankR], tex, HU, lanes: B.lanes, colRows, slots, count, triangles: triangles + nT * 2 + nF * 2 + nS * 2, camL, bases, rates, compRows, famRows, flkRows, exitRows, waterRows, moved: B.moved };
}

// ---------------------------------------------------------------- the river beyond the hero's own sheet
function buildWater(hero, W, look) {
  const U = hero.uniforms, g = new THREE.PlaneGeometry(900, 900, 1, 1); g.rotateX(-Math.PI / 2); g.translate(60, W - 0.035, 100);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uMist: { value: look.mist } }, fog: true, transparent: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vW;
      void main(){ vW = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uFoam, uTea, uSkyRef, uHaze, uCamL; uniform float uTime, uCur, uCurSpeed;
      varying vec3 vW;
      ${GLSL_COMMON}
      ${WATER_GLSL}
      void main(){
        vec3 p = vW, V = uCamL - p; float dist = max(length(V), .01); V /= dist;
        vec2 dx = dFdx(p.xz), dy = dFdy(p.xz); float px = max(length(dx), length(dy));
        // two reaches: down from +Z, then away along +X past the Fall
        float up = clamp((p.z - 42.) / 34., 0., 1.) * (1. - clamp((p.x + 34.) / 34., 0., 1.));
        vec2 f = mix(p.xz - vec2(uCur * uCurSpeed * uTime, 0.), vec2(p.z + uCurSpeed * uTime, p.x), up);
        vec2 gr = riverSlope(p.xz, dx, dy, 1.);
        vec3 N = normalize(vec3(-gr.x, 1., -gr.y));
        vec3 R = reflect(-V, N); R.y = abs(R.y) + .002;
        vec3 sky = mix(uHaze, uSkyRef, smoothstep(.02, .24, R.y));          // wavelet backs turned to us mirror the blue overhead, the rest the gold of the horizon
        vec3 col = riverColor(N, V, dist, sky, 0., riverFoam(f, px) * (1. - .5 * smoothstep(30., 90., dist)), f, 0.);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 0.9;
  return mesh;
}

// ---------------------------------------------------------------- one lit material for the world's own creatures and props
// vertex colour x (sun half-lambert + sky/ground hemisphere), rim, wet gloss, fog. Optional per-instance iF
// (phase, rate, amplitude, aux) with aW (weight) drives: FLAP wings, SCULL tails, JAW a hinged lower jaw.
function litMaterial(hero, defines = {}, extra = {}) {
  const U = hero.uniforms;
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uGloss: { value: extra.gloss ?? 0.1 }, uWetLine: { value: extra.wetLine ?? -1000 }, uAlb: { value: extra.alb ?? 0.4 } },
    fog: true, vertexColors: true, side: THREE.DoubleSide, defines,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      uniform float uTime;
      #ifdef USE_ANIM
      attribute float aW; attribute vec4 iF;
      #endif
      varying vec3 vN, vW, vC;
      void main(){
        vec3 p = position, n = normal;
        #ifdef FLAP
          float a = (sin(uTime * iF.y + iF.x) * iF.z + iF.w) * aW;               // wings hinge about the body axis (z)
          float s = sign(p.x), c = cos(a), sn = sin(a) * s;
          p.xy = vec2(p.x * mix(1., c, abs(aW)), p.y + abs(p.x) * sin(a) * abs(aW)); n.xy = vec2(n.x * c - n.y * sn, n.y * c + n.x * sn);
        #endif
        #ifdef SCULL
          p.x += sin(uTime * iF.y + iF.x - p.z * 1.3) * iF.z * aW;
        #endif
        #ifdef JAW
          float ja = iF.z * aW, jc = cos(ja), js = sin(ja); vec2 h = vec2(.74, .74);             // hinge (y, z) at the back of the head
          vec2 d = p.yz - h; p.yz = h + vec2(d.x * jc - d.y * js, d.y * jc + d.x * js); n.yz = vec2(n.y * jc - n.z * js, n.z * jc + n.y * js);
        #endif
        vec4 wp = vec4(p, 1.);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n;
        #endif
        wp = modelMatrix * wp; vW = wp.xyz; vN = mat3(modelMatrix) * n;
        vC = color;
        #ifdef USE_INSTANCING_COLOR
          vC *= instanceColor;
        #endif
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uCamL, uTea; uniform float uGloss, uWetLine, uWaterY, uAlb;
      varying vec3 vN, vW, vC;
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(uCamL - vW + vec3(0., 1e-5, 0.));
        float wet = 1. - smoothstep(uWetLine, uWetLine + .25, vW.y);
        vec3 alb = vC * uAlb * mix(1., .6, wet);
        #ifdef DISTDARK
        { vec3 sv = uSun - V * dot(uSun, V); float rimS = smoothstep(.5, .9, dot(N, normalize(sv + vec3(0., 1e-5, 0.))));
          alb *= mix(1., .12, smoothstep(38., 120., length(uCamL - vW)) * (1. - rimS)); }
        #endif
        float ndl = dot(N, uSun), dif = max(ndl * .75 + .25, 0.);
        vec3 col = alb * (uSunC * dif + mix(uGndC, uSkyC, N.y * .5 + .5));
        float fr = 1. - max(dot(N, V), 0.); fr = fr * fr * fr;
        col += uSunC * fr * (.03 + .1 * max(ndl + .3, 0.)) * .5 + uSkyC * fr * (uGloss + .5 * wet) * .6;
        vec3 Hh = normalize(uSun + V); col += uSunC * pow(max(dot(N, Hh), 0.), 40.) * (uGloss + .3 * wet);
        col = mix(col, uTea * (uSunC * .25 + uSkyC), (1. - smoothstep(uWaterY - .4, uWaterY + .02, vW.y)) * .85);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- trees: thorn trees on the plain, the dead tree, the two figs
async function buildTrees(ctx, Y, land, hero, W, wind) {
  const rng = ctx.rng.fork('trees'), group = new THREE.Group(), detail = ctx.quality?.detail ?? 1;
  const matOpts = { wind, backlight: 0.85, backlightTint: '#e8d890' };
  if (FL.prepareLeafTexture) await FL.prepareLeafTexture(matOpts, ctx.yield);                // the kit paints its leaf texture in slices, so the material itself is quick
  const mat = FL.windMaterial(matOpts);
  const thornPal = { leaf: '#857647', leafLight: '#a8925a', leafDark: '#4a3e28', bark: '#5c4c3c', barkDark: '#2e2620' };
  await ctx.yield();
  const thorn = [];
  for (let i = 0; i < 2; i++) { thorn.push(FL.pineGeometry({ rng: rng.fork('t'), height: rng.range(7, 9), detail: 1, ...thornPal })); await ctx.yield(); }
  // (the far build: of two drawn from the seed the lighter one, they stand beyond seventy metres)
  const tfA = FL.pineGeometry({ rng: rng.fork('tf'), height: 8, detail: 0, ...thornPal }), tfB = FL.pineGeometry({ rng: rng.fork('tg'), height: 8, detail: 0, ...thornPal });
  const triN = (q) => (q.index ? q.index.count : q.attributes.position.count), thornFar = [triN(tfA) <= triN(tfB) ? tfA : tfB];
  await ctx.yield();
  const pts = [], want = 44;
  for (let tries = 0; pts.length < want && tries < 1200; tries++) {
    const ring = tries < 500, x = ring ? rng.range(-330, 190) : rng.range(-520, 420), z = ring ? rng.range(-190, 210) : rng.range(-420, 460);
    const q = land.sample(x, z); if (q.kind === 1 || q.wall || q.tr > 0.05 || q.lat < 16 || q.dO < 12 || (q.kind === 2 && q.dI < 26)) continue;
    if (Math.abs(x) < 70 && z > -70 && z < 20) continue;
    if (pts.some((p) => Math.hypot(p.x - x, p.z - z) < 26)) continue;
    pts.push({ x, y: q.h - 0.1, z, s: rng.range(0.85, 1.25), rot: rng() * 6.283, d: q.lat, u: clamp(q.s / Y.L, 0, 0.999), v: pts.length });
  }
  // a line of thorn trees along both rims of the gully: dark umbrellas against the sky above the cut banks, all the way down to the river
  {
    const rr = ctx.rng.fork('rim'), pv = new THREE.Vector3(), tv = new THREE.Vector3();
    for (let s = Y.sGully - 16 + rr.range(0, 6), k = 0; s < Y.sLip - 6; s += rr.range(11, 17), k++) {
      const sd = k % 2 ? 1 : -1; Y.posAt(s, pv); Y.tanAt(s, tv); const il = 1 / Math.max(1e-4, Math.hypot(tv.x, tv.z));
      for (let tries = 0; tries < 6; tries++) {
        const lat = sd * rr.range(14.5, 23), x = pv.x - tv.z * il * lat, z = pv.z + tv.x * il * lat, q = land.sample(x, z);
        if (q.kind !== 0 || q.wall || q.tr > 0.05 || q.lat < 13.5 || q.dO < 7 || pts.some((p) => Math.hypot(p.x - x, p.z - z) < 9)) continue;
        pts.push({ x, y: q.h - 0.1, z, s: rr.range(0.8, 1.2), rot: rr() * 6.283, d: 60, u: clamp(q.s / Y.L, 0, 0.999), v: pts.length }); break;        // (d 60: the light build, they are seen from below against the sky)
      }
    }
  }
  await ctx.yield();
  { const dT = deadTreeAt(Y, land); for (let i = pts.length - 1; i >= 0; i--) if (Math.hypot(pts[i].x - dT.x, pts[i].z - dT.z) < 20) pts.splice(i, 1); pts.forEach((q, i) => { q.v = i; }); }      // the dead tree stands alone
  const thorns = FL.makeScatter({ rng: rng.fork('s'), points: pts, variants: thorn, farVariants: thornFar, farDistance: 52, material: mat, wind, tint: 0.12, hue: 0.02 });
  group.add(thorns.object);
  await ctx.yield();
  // croton thicket crowding the bank tops
  const bush = [];
  for (let i = 0; i < 2; i++) { bush.push(FL.bushGeometry({ rng: rng.fork('b'), size: rng.range(1.5, 2.2), detail: 0, leaf: '#6f7b58', leafLight: '#98a070', leafDark: '#3f4a34', bark: '#4a3c30' })); await ctx.yield(); }
  const bpts = [];
  for (let tries = 0; bpts.length < Math.round(70 * detail) && tries < 2500; tries++) {
    const x = rng.range(-140, 190), z = rng.range(-20, 200), q = land.sample(x, z);
    if (q.kind === 1 || q.wall || q.tr > 0.05 || q.lat < 9) continue;
    const edge = q.kind === 0 ? q.dO : q.dI - 14; if (edge < 3.5 || edge > 13 || (Math.abs(x) < 58 && z < 30)) continue;
    bpts.push({ x, y: q.h - 0.15, z, s: rng.range(0.8, 1.5), rot: rng() * 6.283, d: q.lat, u: clamp(q.s / Y.L, 0, 0.999), v: bpts.length });
  }
  await ctx.yield();
  const bushes = FL.makeScatter({ rng: rng.fork('bs'), points: bpts, variants: bush, material: mat, wind, tint: 0.15, hue: 0.03 });
  group.add(bushes.object);
  await ctx.yield();
  // the dead tree at the gully's mouth: 12 m to the right of the path, bleached and barkless
  const dP = deadTreeAt(Y, land), dx = dP.x, dz = dP.z, dy = dP.y;
  const dg = FL.deadTreeGeometry({ rng: rng.fork('d'), height: 11.5, detail: 2, bark: '#cfc5b0', barkDark: '#8a8070' });
  await ctx.yield();
  const dead = new THREE.Mesh(dg, litMaterial(hero, { DISTDARK: 1 }, { alb: 0.86, gloss: 0.02 })); dead.position.set(dx, dy - 0.2, dz); dead.rotation.y = rng() * 6.283; dead.updateMatrixWorld(true); group.add(dead);
  // perches: the highest vertices of the dead tree in well separated places
  const perches = [], pa = dg.attributes.position, tmp = new THREE.Vector3(), cand = [];
  for (let i = 0; i < pa.count; i += 3) { tmp.fromBufferAttribute(pa, i); if (tmp.y > 5.5) cand.push(tmp.clone()); }
  cand.sort((a, b) => b.y - a.y);
  for (const c of cand) { if (perches.length >= 8) break; if (perches.every((q) => q.distanceTo(c) > 1.7)) perches.push(c); }
  for (const c of perches) c.applyMatrix4(dead.matrixWorld);
  // the two sycamore figs at the exit: yellow bark, the only green in the world
  const figs = [];
  for (const f of land.figs) {
    await ctx.yield();
    const fg = FL.oakGeometry({ rng: rng.fork('f' + f[2]), height: 20.5 + 0.5 * rng.range(19, 22) - 9.5, detail: 2, leaf: '#467a36', leafLight: '#86b24e', leafDark: '#2c5226', bark: '#b8a468', barkDark: '#6e6038', fullness: 1.38 });
    const m = new THREE.Mesh(fg, mat), y = land.height(f[0], f[1]); m.position.set(f[0], y - 0.3, f[1]); m.rotation.y = rng() * 6.283; group.add(m);
    figs.push({ x: f[0], y, z: f[1], side: f[2] });
    await ctx.yield();
  }
  // buttress roots: tall thin flanges that sweep out of the trunk in a concave curve, snake over the ground and dive into it;
  // between them thinner surface roots, and bare ones hanging where the gully has undercut the bank
  const g = new F.Geo(), cB = new THREE.Color(0.2, 0.165, 0.1), cM = new THREE.Color(0.125, 0.1, 0.06), cD = new THREE.Color(0.04, 0.03, 0.02);
  const floorY = Y.pathY(Y.L) - 1.5;
  for (const f of figs) {
    await ctx.yield();
    const NB = 9, a0 = rng() * 6.283;
    for (let k = 0; k < NB; k++) {
      const a = a0 + (k / NB) * 6.283 + rng.range(-0.18, 0.18), reach = rng.range(2.4, 4.8), rise = rng.range(1.3, 2.5), cx = Math.cos(a), cz = Math.sin(a), bend = rng.range(-0.7, 0.7), ph = rng() * 6.283, NSg = 9, rowsB = [];
      for (let i = 0; i <= NSg; i++) {
        const u = i / NSg, d = 0.35 + reach * u, sn = bend * u * u * 1.4 + 0.3 * Math.sin(u * 5 + ph) * u, x = f.x + cx * d - cz * sn, z = f.z + cz * d + cx * sn, gy = land.height(x, z);
        const top = Math.max(gy + 0.1 * (1 - u), f.y + rise * Math.pow(1 - u, 1.8) * (1 + 0.12 * Math.sin(u * 9 + ph)) + 0.3 * (1 - u)) - (i === NSg ? 0.25 : 0), bot = Math.min(gy, top) - 0.35, th = (0.34 * (1 - 0.7 * u) + 0.07) * (i === NSg ? 0.3 : 1), px = -cz * th, pz = cx * th, mid = bot + (top - bot) * 0.55;
        const c0 = cB.clone().lerp(cM, 0.2 + 0.6 * u), row = [g.v(x + px * 1.5, bot, z + pz * 1.5, cD), g.v(x + px, mid, z + pz, c0.clone().lerp(cD, 0.35)), g.v(x + px * 0.45, top - th * 0.5, z + pz * 0.45, c0), g.v(x, top, z, c0), g.v(x - px * 0.45, top - th * 0.5, z - pz * 0.45, c0), g.v(x - px, mid, z - pz, c0.clone().lerp(cD, 0.35)), g.v(x - px * 1.5, bot, z - pz * 1.5, cD)];
        rowsB.push(row);
      }
      for (let i = 0; i < NSg; i++) for (let j = 0; j < 6; j++) g.quad(rowsB[i][j], rowsB[i][j + 1], rowsB[i + 1][j + 1], rowsB[i + 1][j]);
    }
    for (let k = 0; k < 8; k++) {                      // surface roots snaking away between the flanges
      const a = rng() * 6.283, reach = rng.range(4, 8), r0 = rng.range(0.1, 0.17), ph = rng() * 6.283, pts2 = [], rr = [];
      for (let i = 0; i <= 6; i++) { const u = i / 6, d = 1 + reach * u, sn = 0.7 * Math.sin(u * 4 + ph) * u, x = f.x + Math.cos(a) * d - Math.sin(a) * sn, z = f.z + Math.sin(a) * d + Math.cos(a) * sn; pts2.push([x, land.height(x, z) + r0 * (0.5 - 1.3 * u * u), z]); rr.push(r0 * (1 - 0.6 * u)); }
      g.tube(pts2, rr, 5, cM, cD);
    }
    for (let k = 0; k < 6; k++) {                      // bare roots hanging into the gully
      const a = rng.range(0, 6.283), d = rng.range(1.5, 3.6), x = f.x + Math.cos(a) * d, z = f.z + Math.sin(a) * d, top = land.height(x, z), len = rng.range(1.2, 2.8);
      g.tube([[x, top + 0.3, z], [x + rng.range(-0.3, 0.3), top - len * 0.5, z + rng.range(-0.3, 0.3)], [x + rng.range(-0.4, 0.4), Math.max(floorY + 0.1, top - len), z + rng.range(-0.4, 0.4)]], [0.11, 0.08, 0.04], 5, cM, cD);
    }
  }
  await ctx.yield();
  // each fig stands on the rim of the cut, and its roots come over the lip and down the face to the floor: as thick as a thigh at the top
  { const rr = ctx.rng.fork('figroots'), pE = Y.posAt(Y.L - 1.5, new THREE.Vector3()), tE = Y.tanAt(Y.L - 1.5, new THREE.Vector3()), il = 1 / Math.max(1e-4, Math.hypot(tE.x, tE.z)), tx = tE.x * il, tz = tE.z * il;
    for (const f of figs) for (let k = 0; k < 7; k++) {
      const a = rr.range(-5.5, 4.5), sS = Y.L - 1.5 + a, hw = exitHW(Y, sS), fl = Y.pathY(sS) - 1.5, P = (al, l) => [pE.x + tx * al - tz * f.side * l, pE.z + tz * al + tx * f.side * l];
      const tq = P(a, hw + 5), top = land.height(tq[0], tq[1]), drop = rr.range(0.55, 1), r0 = rr.range(0.09, 0.17), w1 = rr.range(-0.5, 0.5), w2 = rr.range(-0.6, 0.6);
      const yEnd = Math.max(fl + 0.08, top - (top - fl) * drop);
      const p0 = P(a * 0.35, FIG_LAT - 0.7), p1 = P(a * 0.8, hw + 1.5), p2 = P(a, hw + 0.25), p3 = P(a + w1, hw - 0.18), p4 = P(a + w1 + w2, hw - 0.2 - (drop > 0.97 ? 0.5 : 0));
      g.tube([[p0[0], top + 0.2, p0[1]], [p1[0], top + 0.16, p1[1]], [p2[0], top + 0.12, p2[1]], [p3[0], (top + yEnd) * 0.5 + 0.2, p3[1]], [p4[0], yEnd, p4[1]]], [r0 * 1.2, r0, r0 * 0.95, r0 * 0.8, r0 * 0.45], 5, cM, cD);
    } }
  await ctx.yield();
  const roots = new THREE.Mesh(g.build(), litMaterial(hero, {}, { alb: 1, gloss: 0.03 })); roots.frustumCulled = false; group.add(roots);
  let triangles = roots.geometry.index.count / 3 + dg.index.count / 3 + (thorns.triangles || 0) + (bushes.triangles || 0);
  group.traverse((o) => { if (o.isMesh && o.geometry.userData?.kind === 'oak') triangles += o.geometry.index.count / 3; });
  return { group, thorns, bushes, perches, deadPos: new THREE.Vector3(dx, dy, dz), figs, pts, mat, triangles,
    update(dt, time, camera) { thorns.update(dt, time, camera); bushes.update(dt, time, camera); } };
}

// ---------------------------------------------------------------- creature geometry
function birdGeometry() {
  const g = new F.Geo(), c = C3('#ffffff'), cd = C3('#b8b8b8');
  g.loft([{ z: -0.42, y: 0, rx: 0, ry: 0 }, { z: -0.2, y: 0.0, rx: 0.07, ry: 0.06 }, { z: 0.1, y: 0.01, rx: 0.1, ry: 0.09 }, { z: 0.3, y: 0.03, rx: 0.06, ry: 0.06 }, { z: 0.44, y: 0.04, rx: 0, ry: 0 }], { sides: 5, top: c, belly: cd });
  g.fan([[0, 0, -0.3], [-0.14, 0, -0.56], [0.14, 0, -0.56]], c, cd);                                   // tail
  const w0 = g.n;
  for (const sx of [-1, 1]) {
    const le = [[sx * 0.06, 0.02, 0.2], [sx * 0.45, 0.03, 0.24], [sx * 0.8, 0.02, 0.14], [sx * 1.0, 0.02, -0.02]], te = [[sx * 0.06, 0.01, -0.14], [sx * 0.45, 0.01, -0.16], [sx * 0.8, 0.01, -0.14], [sx * 1.0, 0.01, -0.12]];
    g.strip(le, te, c, cd);
  }
  const geo = g.build(), n = geo.attributes.position.count, aW = new Float32Array(n);
  for (let i = w0; i < n; i++) aW[i] = Math.min(1, Math.abs(geo.attributes.position.getX(i)));
  geo.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
  return geo;
}
// a white-backed vulture on the wing, 2 units across (the instance makes it 2.4 m): broad plank wings with paler coverts along the leading
// edge and five spread primaries at each tip, a short wedge of tail, the pale ruff, and the bare head carried low and forward. The wings
// hinge about the body axis like the small birds' (aW).
function vultureGeometry() {
  const g = new F.Geo(), dk = C3('#5e4c3c'), mid = C3('#8a7458'), pale = C3('#c2aa86'), ruff = C3('#fff4e0'), head = C3('#d8b4a4'), tip = C3('#2a221c');
  g.loft([{ z: -0.3, y: 0, rx: 0, ry: 0 }, { z: -0.2, y: 0, rx: 0.085, ry: 0.075 }, { z: 0.04, y: -0.012, rx: 0.135, ry: 0.125 }, { z: 0.25, y: -0.012, rx: 0.12, ry: 0.115 }, { z: 0.36, y: 0, rx: 0.07, ry: 0.07 }], { sides: 7, top: mid, belly: pale });
  g.loft([{ z: 0.32, y: 0.0, rx: 0.086, ry: 0.082 }, { z: 0.4, y: -0.012, rx: 0.092, ry: 0.088 }, { z: 0.46, y: -0.025, rx: 0.05, ry: 0.05 }], { sides: 6, top: ruff, belly: ruff });
  g.loft([{ z: 0.44, y: -0.03, rx: 0.04, ry: 0.04 }, { z: 0.53, y: -0.055, rx: 0.043, ry: 0.046 }, { z: 0.6, y: -0.085, rx: 0.03, ry: 0.036 }, { z: 0.67, y: -0.14, rx: 0, ry: 0 }], { sides: 5, top: head, belly: head });
  g.fan([[0, 0.005, -0.22], [-0.14, 0, -0.47], [-0.06, 0, -0.53], [0.06, 0, -0.53], [0.14, 0, -0.47]], dk, tip);
  const w0 = g.n;
  for (const sx of [-1, 1]) {
    const le = [[sx * 0.07, 0.02, 0.25], [sx * 0.33, 0.035, 0.31], [sx * 0.6, 0.035, 0.28], [sx * 0.82, 0.025, 0.21]];
    const mi = [[sx * 0.07, 0.03, 0.06], [sx * 0.33, 0.045, 0.08], [sx * 0.6, 0.04, 0.07], [sx * 0.82, 0.03, 0.045]];
    const te = [[sx * 0.07, 0.0, -0.2], [sx * 0.33, 0.0, -0.21], [sx * 0.6, 0.0, -0.19], [sx * 0.82, 0.0, -0.13]];
    g.strip(le, mi, pale, mid); g.strip(mi, te, mid, dk);
    for (let i = 0; i < 5; i++) {                             // the primaries, spread like fingers
      const zb = 0.19 - i * 0.075, zt = 0.3 - i * 0.115, xt = sx * (1.0 - 0.035 * Math.abs(i - 1.2));
      g.strip([[sx * 0.8, 0.02, zb + 0.03], [sx * 0.9, 0.03, (zb + zt) * 0.5 + 0.028], [xt, 0.045, zt + 0.012]], [[sx * 0.8, 0.02, zb - 0.035], [sx * 0.9, 0.03, (zb + zt) * 0.5 - 0.028], [xt, 0.045, zt - 0.012]], dk, tip);
    }
  }
  const geo = g.build(), n = geo.attributes.position.count, aW = new Float32Array(n);
  for (let i = w0; i < n; i++) aW[i] = Math.min(1, Math.abs(geo.attributes.position.getX(i)));
  geo.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
  return geo;
}
// Nile crocodile, 5.1 m, nose +Z, the waterline at about y 0.12. gape > 0 builds the lunging one: shoulders and neck raised, the long
// upper jaw thrown open on its hinge, the lower jaw dropped, pale mouth lining and teeth showing.
// a vulture at rest: hunched, wings folded dark down its flanks, pale ruff, bare head sunk forward. Built lying along z; the instance stands it up.
function perchedVultureGeometry() {
  const g = new F.Geo(), body = C3('#7a6650'), belly = C3('#94806a'), wing = C3('#40352b'), wingD = C3('#2e2721'), ruff = C3('#e6dcc8'), head = C3('#c9a394'), beak = C3('#55483c');
  g.loft([{ z: -0.5, y: 0.02, rx: 0, ry: 0 }, { z: -0.36, y: 0.02, rx: 0.12, ry: 0.1 }, { z: -0.1, y: 0, rx: 0.2, ry: 0.17 }, { z: 0.16, y: 0.01, rx: 0.2, ry: 0.18 }, { z: 0.33, y: 0, rx: 0.13, ry: 0.13 }], { sides: 7, top: body, belly });
  g.loft([{ z: 0.29, y: 0, rx: 0.14, ry: 0.14 }, { z: 0.36, y: -0.01, rx: 0.15, ry: 0.15 }, { z: 0.43, y: -0.03, rx: 0.09, ry: 0.09 }], { sides: 7, top: ruff, belly: ruff });
  g.loft([{ z: 0.41, y: -0.04, rx: 0.06, ry: 0.06 }, { z: 0.5, y: -0.09, rx: 0.065, ry: 0.07 }, { z: 0.58, y: -0.15, rx: 0.05, ry: 0.055 }], { sides: 6, top: head, belly: head });
  g.loft([{ z: 0.56, y: -0.16, rx: 0.035, ry: 0.04 }, { z: 0.64, y: -0.22, rx: 0.025, ry: 0.035 }, { z: 0.68, y: -0.29, rx: 0, ry: 0 }], { sides: 5, top: beak, belly: beak });
  for (const sx of [-1, 1]) {
    g.strip([[sx * 0.15, 0.17, 0.3], [sx * 0.225, 0.15, 0.05], [sx * 0.2, 0.11, -0.3], [sx * 0.08, 0.06, -0.66]], [[sx * 0.19, -0.1, 0.27], [sx * 0.235, -0.12, 0.02], [sx * 0.2, -0.1, -0.3], [sx * 0.07, -0.02, -0.62]], wing, wingD);
  }
  g.fan([[0, 0.03, -0.4], [-0.1, 0.02, -0.7], [0.1, 0.02, -0.7]], wingD, wingD);
  return g.build();
}
function crocGeometry(gape = 0) {
  const g = new F.Geo(), RGB = (r, gg, b) => new THREE.Color(r, gg, b), top = RGB(0.05, 0.055, 0.025), dark = RGB(0.018, 0.02, 0.012), flank = RGB(0.12, 0.11, 0.05), belly = RGB(0.36, 0.32, 0.2), mouth = RGB(0.66, 0.4, 0.3), tooth = RGB(0.75, 0.72, 0.62);
  // tail, body, neck (to z 1.25): broad and flat, flanks paler than the back
  const body = g.loft([[-2.7, 0.05, 0, 0], [-2.45, 0.06, 0.035, 0.1], [-2.0, 0.06, 0.07, 0.15], [-1.5, 0.05, 0.14, 0.19], [-1.0, 0.03, 0.25, 0.22], [-0.55, 0.02, 0.38, 0.25], [-0.1, 0.01, 0.46, 0.27], [0.35, 0.01, 0.47, 0.27], [0.75, 0.01, 0.4, 0.245], [1.05, 0.02, 0.31, 0.2], [1.25, 0.03, 0.27, 0.17]]
    .map((r) => ({ z: r[0], y: r[1], rx: r[2], ry: r[3] })), { sides: 12, top, belly: flank, shade: [-0.2, 0.75], flat: 0.55 });
  g.paint(body, (px, py, pz, c) => { const band = Math.max(0, Math.sin(pz * 5.2 + Math.abs(px) * 2)); c.lerp(dark, 0.55 * band * band); if (py < -0.02) c.lerp(belly, 0.7); });
  // armour: four rows of keeled scutes on the back, running into the double crest of the tail and its single saw
  for (let i = 0; i < 26; i++) {
    const z = 1.05 - i * 0.14, onTail = z < -1.0, k = clamp((z + 2.7) / 1.7, 0.1, 1);
    for (const sx of onTail ? [-1, 1] : [-2, -1, 1, 2]) {
      const x = onTail ? sx * 0.07 * k : sx * (Math.abs(sx) === 1 ? 0.085 : 0.24) * Math.min(1, k * 1.2), yb = (onTail ? 0.05 + 0.2 * k : 0.27 - (Math.abs(sx) === 2 ? 0.045 : 0) - (z > 0.7 ? (z - 0.7) * 0.2 : 0)), h = onTail ? 0.07 * k + 0.035 : 0.04;
      g.fan([[x, yb + h, z - 0.01], [x - 0.045, yb - 0.02, z + 0.07], [x + 0.045, yb - 0.02, z + 0.07], [x + 0.045, yb - 0.02, z - 0.07], [x - 0.045, yb - 0.02, z - 0.07], [x - 0.045, yb - 0.02, z + 0.07]], top, dark);
    }
  }
  for (let i = 0; i < 9; i++) { const z = -1.75 - i * 0.105, k = clamp((z + 2.7) / 1.0, 0.05, 1), y = 0.06 + 0.15 * k; g.fan([[0, y + 0.07 * k + 0.03, z - 0.02], [0, y - 0.01, z + 0.06], [0.02, y - 0.02, z], [0, y - 0.01, z - 0.06], [-0.02, y - 0.02, z], [0, y - 0.01, z + 0.06]], top, dark); }
  // legs folded along the flank (they show when the lunge lifts the shoulders)
  for (const sx of [-1, 1]) for (const z of [0.72, -0.5]) g.tube([[sx * 0.36, 0.0, z], [sx * 0.56, -0.03, z - 0.14], [sx * 0.62, -0.1, z - 0.36], [sx * 0.6, -0.14, z - 0.5]], [0.085, 0.07, 0.05, 0.035], 5, top, flank);
  // skull: flat, with the eyes raised on their own knobs, then the long tapering snout with a nostril boss
  const h0 = g.n;
  g.loft([[1.25, 0.1, 0.26, 0.1], [1.42, 0.12, 0.25, 0.105], [1.6, 0.115, 0.2, 0.09], [1.9, 0.105, 0.15, 0.075], [2.2, 0.1, 0.13, 0.07], [2.36, 0.105, 0.12, 0.07], [2.42, 0.095, 0, 0]].map((r) => ({ z: r[0], y: r[1], rx: r[2], ry: r[3] })), { sides: 10, top, belly: gape > 0 ? mouth : flank, shade: gape > 0 ? [-0.35, 0.0] : [-0.2, 0.6], flat: 0.75 });
  for (const sx of [-1, 1]) {
    g.blob(sx * 0.135, 0.2, 1.47, 0.05, 0.055, 0.085, dark, top, 6, 4);                                        // eye knob
    g.blob(sx * 0.15, 0.215, 1.49, 0.02, 0.02, 0.03, RGB(0.5, 0.42, 0.12), dark, 4, 3);                      // the eye
    g.blob(sx * 0.035, 0.15, 2.36, 0.025, 0.02, 0.035, dark, dark, 4, 3);                                      // nostrils
    for (let i = 0; i < 9; i++) { const z = 1.5 + i * 0.105, w = 0.2 - (z - 1.5) * 0.085; g.fan([[sx * w, 0.03, z], [sx * w, 0.085, z - 0.03], [sx * w, 0.085, z + 0.03]], tooth, tooth); }   // upper teeth
  }
  const h1 = g.n;
  // lower jaw
  g.loft([[1.2, -0.03, 0.26, 0.075], [1.5, -0.03, 0.22, 0.06], [1.9, -0.025, 0.14, 0.045], [2.25, -0.02, 0.11, 0.04], [2.38, -0.02, 0, 0]].map((r) => ({ z: r[0], y: r[1], rx: r[2], ry: r[3] })), { sides: 8, top: gape > 0 ? mouth : flank, belly, shade: gape > 0 ? [0.3, 0.8] : [-0.6, 0.2], flat: 0.3 });
  for (const sx of [-1, 1]) for (let i = 0; i < 8; i++) { const z = 1.55 + i * 0.105, w = 0.19 - (z - 1.5) * 0.085; g.fan([[sx * w, 0.07, z], [sx * w, 0.015, z - 0.03], [sx * w, 0.015, z + 0.03]], tooth, tooth); }
  const j1 = g.n;
  if (gape > 0) {
    const rot = (r, hy, hz, an) => g.move(r, (p) => { const dz = p.z - hz, dy = p.y - hy; p.set(p.x, hy + dy * Math.cos(an) + dz * Math.sin(an), hz + dz * Math.cos(an) - dy * Math.sin(an)); });
    rot([h0, h1], 0.06, 1.25, gape); rot([h1, j1], 0.0, 1.22, -gape * 0.32);
    // shoulders, neck and head rear out of the water
    g.move([0, g.n], (p) => { const k = sstep(-0.2, 1.3, p.z), an = 0.3 * k, hz = 0.1, dz = p.z - hz, dy = p.y; if (p.z > hz) p.set(p.x, dy * Math.cos(an) + dz * Math.sin(an) * 1.0, hz + dz * Math.cos(an) - dy * Math.sin(an)); });
  }
  const geo = g.build(), n = geo.attributes.position.count, aW = new Float32Array(n);
  for (let i = 0; i < n; i++) aW[i] = clamp((-0.3 - geo.attributes.position.getZ(i)) / 2.2, 0, 1);
  geo.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
  return geo;
}
// A hippo, 3.8 m long at size 1, nose +Z, y 0 under its feet. The head is two hinged hulls with the mouth between them: the upper skull (eyes, ears,
// nostrils, palate, the short upper tusks) and the lower jaw (jowls, tongue, the long curved lower tusks), joined at the corners by stretched skin.
// aAnim = (jaw: +1 goes with the upper skull .. -1 with the lower jaw, 0 with the neck; head: how far it goes with the head when that is raised;
// what it is made of: 0 hide, 1 mouth lining, 2 ivory, 3 eye; ear: the signed weight of an ear's flick)
const HIP_HINGE = [0.8, 0.86], HIP_NECK = [0.74, 0.5], HIP_UP = 0.86, HIP_DN = 0.6;      // (y, z) of the jaw's hinge and of the base of the neck; how far each jaw swings
// lod: the light build for the pod lying low further off (ears, eye bosses, nostrils, the line of a back): no mouth, no ivory, coarser rings
function hippoGeometry(lod = false) {
  const S1 = lod ? 9 : 14, S2 = lod ? 8 : 12; const g = new F.Geo(), RGB = (r, gg, b) => new THREE.Color(r, gg, b), c = new THREE.Color();
  const top = RGB(0.086, 0.071, 0.074), flank = RGB(0.118, 0.1, 0.094), under = RGB(0.15, 0.118, 0.108), pinkSkin = RGB(0.2, 0.15, 0.135), dark = RGB(0.035, 0.028, 0.027);
  const lin = RGB(0.4, 0.19, 0.15), linDeep = RGB(0.15, 0.045, 0.036), lipC = RGB(0.26, 0.19, 0.165), ivory = RGB(0.76, 0.7, 0.56), ivoryD = RGB(0.52, 0.43, 0.28), tongue = RGB(0.44, 0.21, 0.165), palate = RGB(0.46, 0.25, 0.19);      // the mouth is umber-rose, of the ochre family: never candy pink; the hide is wet grey-brown everywhere (the paler skin round eye, ear and lip is grey too: the only rose is inside the jaw)
  // a hull of rings [z, top, bottom, half width, height of the widest point 0..1, top exponent, bottom exponent, side exponent]; fn paints and weights each vertex
  const hull = (rings, sides, fn) => {
    const start = g.n, rows = [];
    for (const r of rings) {
      const [z, t, b, w, wy = 0.5, nt = 2, nb = 2, nx = 2] = r;
      if (!(w > 1e-5)) { const i = g.v(0, (t + b) / 2, z, top); fn(i, 0, 0, z, (t + b) / 2); rows.push([i]); continue; }
      const row = [], ym = b + (t - b) * wy;
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
        const x = w * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / nx), y = cs >= 0 ? ym + (t - ym) * Math.pow(cs, 2 / nt) : ym - (ym - b) * Math.pow(-cs, 2 / nb);
        const i = g.v(x, y, z, top); fn(i, cs, sn, z, y); row.push(i);
      }
      rows.push(row);
    }
    for (let i = 0; i < rows.length - 1; i++) {
      const A = rows[i], B = rows[i + 1]; if (A.length === 1 && B.length === 1) continue;
      for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; if (A.length === 1) g.tri(A[0], B[j], B[j1]); else if (B.length === 1) g.tri(A[j], B[0], A[j1]); else g.quad(A[j], B[j], B[j1], A[j1]); }
    }
    return [start, g.n];
  };
  const set = (i, col, jaw, head, mat, ear = 0) => { g.c[i * 3] = col.r; g.c[i * 3 + 1] = col.g; g.c[i * 3 + 2] = col.b; g.a[i * 4] = jaw; g.a[i * 4 + 1] = head; g.a[i * 4 + 2] = mat; g.a[i * 4 + 3] = ear; };
  const all = (r, jaw, head, mat) => { for (let i = r[0]; i < r[1]; i++) { g.a[i * 4] = jaw; g.a[i * 4 + 1] = head; g.a[i * 4 + 2] = mat; } return r; };
  const jawW = (z) => sstep(0.7, 0.92, z);                                                // the back of the skull stays in the neck
  // barrel, shoulders and the thick creased neck; its front end is the back of the throat
  hull([[-1.78, 0.8, 0.7, 0], [-1.72, 0.97, 0.52, 0.24], [-1.55, 1.08, 0.33, 0.45], [-1.25, 1.15, 0.16, 0.6, 0.5, 2.2], [-0.8, 1.18, 0.06, 0.69, 0.48, 2.3], [-0.3, 1.17, 0.04, 0.72, 0.48, 2.3], [0.1, 1.17, 0.08, 0.7, 0.5, 2.3],
    [0.38, 1.19, 0.16, 0.62, 0.52, 2.2], [0.58, 1.17, 0.27, 0.5, 0.55], [0.74, 1.12, 0.36, 0.42, 0.55], [0.9, 1.07, 0.44, 0.36, 0.55], [0.94, 0.78, 0.74, 0]], S1, (i, cs, sn, z, y) => {
    c.copy(flank).lerp(top, sstep(-0.1, 0.6, cs)); if (cs < -0.15) c.lerp(under, sstep(-0.15, -0.75, cs));
    if (z > 0.42 && z < 0.92) c.multiplyScalar(0.84 + 0.16 * Math.cos((z - 0.42) * 39));                    // the folds of the neck
    c.multiplyScalar(0.9 + 0.2 * Math.sin(z * 7 + sn * 3) * Math.sin(y * 9));
    if (z > 0.92) set(i, linDeep, 0, 1, 1); else set(i, c, 0, sstep(0.5, 0.9, z), 0);
  });
  // the upper skull: brow and ears, the eyes raised on their sockets, the dip of the face, the broad swollen muzzle with the nostrils on top; flat underneath (the palate)
  hull([[0.74, 1.08, 0.8, 0.33, 0.3, 2.4, 6, 2.4], [0.9, 1.13, 0.8, 0.355, 0.3, 2.5, 6, 2.5], [1.05, 1.13, 0.8, 0.34, 0.3, 2.4, 6, 2.5], [1.22, 1.05, 0.8, 0.29, 0.3, 2.3, 6, 2.4], [1.42, 1.01, 0.8, 0.28, 0.3, 2.3, 6, 2.4],
    [1.62, 1.05, 0.795, 0.335, 0.3, 2.6, 6, 2.6], [1.82, 1.09, 0.79, 0.385, 0.32, 2.8, 6, 2.8], [1.96, 1.05, 0.795, 0.36, 0.35, 2.8, 5, 2.8], [2.04, 0.96, 0.815, 0.24, 0.4, 2.4, 3, 2.4], [2.065, 0.88, 0.88, 0]], S1, (i, cs, sn, z, y) => {
    if (cs < -0.35) { set(i, c.copy(linDeep).lerp(lin, sstep(0.86, 1.5, z)), jawW(z), 1, 1); return; }
    c.copy(flank).lerp(top, sstep(-0.1, 0.5, cs)); if (cs < 0.12) c.lerp(lipC, sstep(0.12, -0.3, cs) * sstep(0.95, 1.3, z));          // the pale lip
    c.lerp(pinkSkin, 0.5 * sstep(0.3, 0.75, Math.abs(sn)) * (1 - sstep(0.12, 0.3, Math.abs(z - 1.02))));                                // paler skin round the eyes
    c.multiplyScalar(0.92 + 0.16 * Math.sin(z * 13 + sn * 5));
    set(i, c, jawW(z), 1, 0);
  });
  // the lower jaw: deep jowls, a broad square chin; flat on top (the floor of the mouth)
  hull([[0.78, 0.8, 0.52, 0.32, 0.8, 6, 2.2, 2.4], [0.95, 0.8, 0.44, 0.335, 0.78, 6, 2.2, 2.4], [1.2, 0.8, 0.46, 0.3, 0.75, 6, 2.2, 2.4], [1.45, 0.8, 0.51, 0.285, 0.75, 6, 2.3, 2.4], [1.65, 0.795, 0.515, 0.33, 0.72, 6, 2.6, 2.6],
    [1.84, 0.79, 0.525, 0.38, 0.7, 6, 2.8, 2.8], [1.97, 0.795, 0.56, 0.35, 0.7, 5, 2.8, 2.8], [2.035, 0.8, 0.66, 0.22, 0.7, 3, 2.4, 2.4], [2.055, 0.74, 0.74, 0]], S2, (i, cs, sn, z, y) => {
    const jw = -sstep(0.72, 0.95, z);
    if (cs > 0.35) { set(i, c.copy(linDeep).lerp(lin, sstep(0.86, 1.5, z)), jw, 1, 1); return; }
    c.copy(under).lerp(flank, 0.55 * sstep(-0.6, 0.1, cs)); if (cs > -0.1) c.lerp(lipC, sstep(-0.1, 0.3, cs) * sstep(0.95, 1.3, z));
    c.multiplyScalar(0.9 + 0.2 * Math.sin(z * 11 + sn * 4));
    set(i, c, jw, 1, 0);
  });
  // the tongue on the floor of the mouth and the ridged pad of the palate over it: with the mouth shut each lies inside the other jaw
  if (!lod) all(hull([[0.98, 0.83, 0.79, 0], [1.1, 0.875, 0.79, 0.15, 0.3, 2, 6], [1.4, 0.89, 0.79, 0.2, 0.3, 2, 6], [1.68, 0.875, 0.79, 0.18, 0.3, 2, 6], [1.86, 0.83, 0.79, 0]], 8, (i) => set(i, tongue, -1, 1, 1)), -1, 1, 1);
  if (!lod) all(hull([[1.0, 0.8, 0.77, 0], [1.15, 0.8, 0.735, 0.2, 0.7, 6, 2], [1.5, 0.8, 0.728, 0.2, 0.7, 6, 2], [1.8, 0.8, 0.735, 0.25, 0.7, 6, 2], [1.96, 0.8, 0.77, 0]], 8, (i) => set(i, palate, 1, 1, 1)), 1, 1, 1);
  for (const sx of [-1, 1]) {
    // the corner of the mouth: skin stretched between the jaws, folded flat along the lips when the mouth is shut
    const TS = lod ? [] : [0, 0.14, 0.28, 0.42, 0.54], KS = [-1, -0.5, 0, 0.5, 1], rows = [];
    for (const t of TS) { const row = []; for (const k of KS) {
      const z0 = HIP_HINGE[1] + t * 1.2, fold = 1 - Math.abs(k), z = HIP_HINGE[1] + t * 1.2 * (1 - 0.32 * fold), w = 0.335 - 0.055 * sstep(0.95, 1.35, z0);
      const i = g.v(sx * (w - 0.015) * (1 - 0.16 * fold), 0.8, z, top); set(i, c.copy(linDeep).lerp(lin, sstep(0, 0.5, t)).lerp(lipC, 0.55 * Math.abs(k) * sstep(0.2, 0.5, t)), k, 1, 1); row.push(i); }
      rows.push(row); }
    for (let a = 0; a < TS.length - 1; a++) for (let b = 0; b < KS.length - 1; b++) g.quad(rows[a][b], rows[a + 1][b], rows[a + 1][b + 1], rows[a][b + 1]);
    // ear: a small round leaf on the corner of the skull (it flicks)
    const er = g.blob(sx * 0.318, 1.2, 0.855, 0.052, 0.09, 0.034, top, pinkSkin, lod ? 5 : 6, lod ? 3 : 4);
    for (let i = er[0]; i < er[1]; i++) { g.a[i * 4] = jawW(0.87); g.a[i * 4 + 1] = 1; g.a[i * 4 + 3] = sx * clamp((g.p[i * 3 + 1] - 1.12) / 0.17, 0, 1); }
    all(g.blob(sx * 0.245, 1.135, 1.05, 0.078, 0.064, 0.098, top, pinkSkin, lod ? 5 : 7, lod ? 3 : 4), 1, 1, 0);                      // the eye's raised socket
    all(g.blob(sx * 0.302, 1.152, 1.078, 0.031, 0.03, 0.036, dark, dark, 5, 3), 1, 1, 3);                         // the eye
    all(g.blob(sx * 0.165, 1.1, 1.85, 0.078, 0.052, 0.088, top, lipC, lod ? 5 : 6, lod ? 3 : 4), 1, 1, 0);                             // nostril boss
    if (lod) continue;
    all(g.blob(sx * 0.2, 1.138, 1.875, 0.03, 0.018, 0.04, dark, dark, 4, 3), 1, 1, 0);                             // nostril
    // ivory: the long curved tusks of the lower jaw and its forward pegs, the short tusks and pegs of the upper
    all(g.tube([[sx * 0.275, 0.77, 1.87], [sx * 0.305, 0.92, 1.85], [sx * 0.318, 1.05, 1.8], [sx * 0.31, 1.15, 1.74]], [0.052, 0.045, 0.031, 0], 6, ivoryD, ivory), -1, 1, 2);
    all(g.tube([[sx * 0.09, 0.78, 1.955], [sx * 0.097, 0.87, 1.985], [sx * 0.1, 0.945, 1.995]], [0.033, 0.027, 0], 5, ivoryD, ivory), -1, 1, 2);
    all(g.tube([[sx * 0.305, 0.82, 1.74], [sx * 0.315, 0.72, 1.76], [sx * 0.315, 0.63, 1.77]], [0.042, 0.033, 0], 5, ivoryD, ivory), 1, 1, 2);
    all(g.tube([[sx * 0.085, 0.82, 1.965], [sx * 0.085, 0.73, 1.985]], [0.03, 0], 5, ivoryD, ivory), 1, 1, 2);
  }
  // a hippo's head is a great blunt box: shorter, deeper and broader than the rings above draw it
  for (let i = 0; i < g.n; i++) {
    const z = g.p[i * 3 + 2]; if (z <= 0.8) continue;
    const k = sstep(0.8, 1.15, z);
    if (z > HIP_HINGE[1]) g.p[i * 3 + 2] = HIP_HINGE[1] + (z - HIP_HINGE[1]) * 0.86;
    g.p[i * 3 + 1] = HIP_HINGE[0] + (g.p[i * 3 + 1] - HIP_HINGE[0]) * (1 + 0.24 * k); g.p[i * 3] *= 1 + 0.14 * k;
  }
  return g.build();
}
// the hippos' own material: wet hide that holds the sky, a pink mouth, ivory; per instance iH = (yawn 0..1, ear phase, water streaming off it 0..1, head raised 0..1)
function hippoMaterial(hero) {
  const U = hero.uniforms;
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 aAnim, iH; uniform float uTime;
      varying vec3 vN, vW, vC, vL; varying vec4 vM;
      vec2 turn(vec2 zy, float a){ float c = cos(a), s = sin(a); return vec2(zy.x * c - zy.y * s, zy.y * c + zy.x * s); }      // (z, y): a positive angle lifts the nose
      void main(){
        vec3 p = position, n = normal;
        float ph = iH.y + sign(aAnim.w) * 1.7, e = max(sin(uTime * (.8 + .5 * fract(ph * 7.3)) + ph * 40.), 0.); e *= e; e *= e; e *= e; e *= e;
        float fl = e * sin(uTime * 31. + ph * 9.), ew = abs(aAnim.w);                               // an ear flicks: a quick shiver every few seconds
        p.z -= ew * fl * .07; p.x += sign(aAnim.w) * ew * fl * .035;
        float ja = iH.x * (aAnim.x > 0. ? ${HIP_UP.toFixed(2)} : ${HIP_DN.toFixed(2)}) * aAnim.x;
        p.zy = vec2(${HIP_HINGE[1].toFixed(2)}, ${HIP_HINGE[0].toFixed(2)}) + turn(p.zy - vec2(${HIP_HINGE[1].toFixed(2)}, ${HIP_HINGE[0].toFixed(2)}), ja); n.zy = turn(n.zy, ja);
        float ha = (.1 * iH.w + .03 * iH.x) * aAnim.y;
        p.zy = vec2(${HIP_NECK[1].toFixed(2)}, ${HIP_NECK[0].toFixed(2)}) + turn(p.zy - vec2(${HIP_NECK[1].toFixed(2)}, ${HIP_NECK[0].toFixed(2)}), ha); n.zy = turn(n.zy, ha);
        vL = position; vC = color; vM = vec4(aAnim.z, iH.x, iH.z, iH.y);
        vec4 wp = vec4(p, 1.);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n;
        #endif
        wp = modelMatrix * wp; vW = wp.xyz; vN = mat3(modelMatrix) * n;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uCamL, uTea, uSkyRef, uFoam; uniform float uWaterY, uTime;
      varying vec3 vN, vW, vC, vL; varying vec4 vM;
      ${GLSL_COMMON}
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(uCamL - vW + vec3(0., 1e-5, 0.)), Hh = normalize(uSun + V);
        float m = vM.x, lining = step(.5, m) * step(m, 1.5), ivory = step(1.5, m) * step(m, 2.5), eye = step(2.5, m), hide = 1. - step(.5, m);
        float fine = 1. - smoothstep(.02, .07, fwidth(vL.z) + fwidth(vL.y));                             // nothing finer than the screen can draw
        float n1 = vn3(vL * vec3(7., 9., 5.) + vM.w * 9.), n2 = mix(.5, vn3(vL * 14.), fine), wr = mix(.5, vn2(vec2(vL.z * 9. + vL.y * 2., vL.y * 13. + vL.x * 8.)), fine);
        vec3 alb = vC;
        alb *= mix(1., (.78 + .34 * n1) * (.86 + .28 * wr), hide);                                    // blotched and creased, never one flat tone
        alb *= mix(1., .82 + .18 * sin(vL.z * 58. + n2 * 2.), lining * step(vL.y, .8));              // the ridges of the palate
        alb *= mix(1., .9 + .2 * n2, lining + ivory);
        alb *= mix(1., .42 + .58 * smoothstep(.95, 1.7, vL.z), lining);                               // the mouth is a cave: it darkens back to the throat
        N = normalize(N + (vec3(n1, wr, n2) - .5) * .35 * hide);
        float ndl = dot(N, uSun), dif = max(ndl * .6 + .4, 0.);
        float sunL = dot(uSunC, vec3(.3, .5, .2)), skyL = dot(uSkyC, vec3(.3, .5, .2));
        vec3 sunD = mix(uSunC, vec3(sunL), .64 - .46 * lining), skyD = mix(uSkyC, vec3(skyL), .35 + .25 * lining);      // the mouth takes the gold key like everything else here
        dif = mix(dif, max(ndl * .85 + .15, 0.), lining);                                             // and is modelled by it: lit on the sun's side, in its own shade on the other
        vec3 amb = mix(uGndC * .9, skyD, N.y * .5 + .5) + vec3(.09, .085, .08) * sunL;
        vec3 col = alb * (sunD * dif * .9 + amb * (1. - .3 * lining));
        col += alb * sunD * lining * .08 * (.5 + .5 * max(-ndl, 0.));                                 // light comes through the thin flesh of the mouth
        float fr = 1. - max(dot(N, V), 0.), fr2 = fr * fr, fr3 = fr2 * fr, nh = max(dot(N, Hh), 0.), up = smoothstep(-.1, .8, N.y);
        float wetK = hide * (.55 + .45 * smoothstep(uWaterY + 1.4, uWaterY + .1, vW.y)) + lining * .3 + eye;
        vec3 skyM = mix(uSkyRef, vec3(.36, .5, .8) * (dot(uSkyRef, vec3(.3, .5, .2)) * 1.4 + .1), .6);
        col += skyM * wetK * (fr3 * fr * .2 + .04 * up + .02 * fr2);                                        // the sky lying on a wet back
        col += uSunC * wetK * (pow(nh, 70.) * .9 + pow(nh, 12.) * .05 * up);                           // and the low sun in a streak along it
        col += uSunC * fr3 * fr * smoothstep(-.3, .2, ndl) * (1. - .8 * smoothstep(.3, .7, ndl)) * .5 * hide;      // a gold rim where the light grazes
        col += uSunC * ivory * pow(nh, 20.) * .15;
        if (eye > .5) { float eg = pow(max(dot(N, normalize(V + vec3(0., .8, 0.))), 0.), 16.); col = alb * amb * .5 + (uSkyRef * 2.4 + uSunC * .6) * eg * eg; }
        // water streaming off whatever has just come up: bright threads running down it
        float st = vn2(vec2(vL.z * 11. + vL.x * 7., vW.y * 2.4 + uTime * 3.6 + vM.w * 5.)), thread = smoothstep(.66, .8, st) * vM.z * hide * smoothstep(uWaterY, uWaterY + .25, vW.y) * fine;
        col = mix(col, uFoam * (uSunC * .5 + uSkyC * .9), thread * .1);
        // the waterline: a torn band of foam, and what is under water goes to the river's own brown
        float fm = vn2(vec2(vL.z * 8. + uTime * .7, vL.x * 5.)) * .6 + vn2(vL.zx * 17.) * .4, band = (1. - smoothstep(.02, .08 + .12 * fm, abs(vW.y - uWaterY - .03))) * smoothstep(.3, .6, fm);
        col = mix(col, uFoam * (uSunC * .4 + uSkyC), band * (.45 + .5 * vM.z));
        col = mix(col, uTea * (uSunC * .25 + uSkyC), (1. - smoothstep(uWaterY - .35, uWaterY + .01, vW.y)) * .88);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}
// rings on the water round each hippo: iR = (x, z, half size of the quad, phase), iQ = (strength, how hard it has just heaved up 0..1);
// and, with a phase of 10 or more, a patch of foam lying on the water where the herd wades out
function buildRipples(hero, list, W) {
  const U = hero.uniforms, n = list.length, iR = new Float32Array(n * 4), iQ = new Float32Array(n * 2);
  list.forEach((r, i) => { iR.set([r.x, r.z, r.size, r.ph], i * 4); iQ.set([r.k, 0], i * 2); });
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.index = q.index; g.setAttribute('position', q.attributes.position);
  g.setAttribute('iR', new THREE.InstancedBufferAttribute(iR, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 2)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uRipY: { value: W + 0.045 } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 iR; attribute vec2 iQ; uniform float uRipY;
      varying vec2 vUv; varying vec4 vK;
      void main(){
        float sz = iR.z * (1. + .5 * iQ.y);
        vec4 mvPosition = modelViewMatrix * vec4(iR.x + position.x * sz, uRipY, iR.y + position.y * sz, 1.);
        vUv = position.xy; vK = vec4(iR.w, iQ.x, iQ.y, sz);
        gl_Position = iQ.x > .004 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uTea, uSkyRef, uFoam, uHaze; uniform float uTime;
      varying vec2 vUv; varying vec4 vK;
      ${GLSL_COMMON}
      ${GLSL_FOGMIX}
      void main(){
        float r = length(vUv), fw = fwidth(r), n = vn2(vUv * 3.1 + vK.x * 9.), h = 0., body = .2 / (1. + .5 * vK.z);
        if (vK.x > 9.5) {                                                        // (phase 10 and over: a patch of torn foam the waders have left, drifting)
          vec2 w = vUv * vK.w; float sd = vK.x - 10.;
          float fn = vn2(w * vec2(.5, 1.1) + sd * 17. + vec2(uTime * .08, 0.)), lace = vn2(w * vec2(2.2, 6.5) - sd * 9. + vec2(uTime * .21, uTime * .05)) * .6 + vn2(w * vec2(5., 13.) + sd * 5.) * .4;
          float fwl = fwidth(w.y) * 6.5;                                           // the lace goes to a thin even film where it is too fine to draw
          float f = smoothstep(.5, .7, fn) * mix(smoothstep(.5, .62, lace) * (1. - .6 * smoothstep(.7, .82, lace)), .22, smoothstep(.25, .8, fwl)) * (1. - smoothstep(.45, 1., r)) * vK.y * .8;
          gl_FragColor = vec4(fogMix(uFoam * (uSunC * .4 + uSkyC), FOGD) * f, f);
          return;
        }
        for (int i = 0; i < 3; i++) {
          float ph = fract(uTime * (.16 + .1 * vK.z) + float(i) / 3. + vK.x), rr = body + ph * (.95 - body) + (n - .5) * .08, wd = .09 + .08 * ph;
          float d = (r - rr) / wd, env = exp(-d * d) * (1. - ph) * smoothstep(0., .12, ph);
          h += env * sin(d * 2.4 + .6) * (1. - smoothstep(1., 3., fw / wd));                       // too fine to draw: gone, not a shimmer
        }
        h *= vK.y * (1. + .8 * vK.z) * (1. - smoothstep(.8, 1., r));
        vec3 bright = mix(uHaze, uSkyRef, .5) * 1.25 + uSunC * .12, darkC = uTea * (uSkyC * .55);
        float fo = smoothstep(.5, .75, vn2(vUv * 9. + vK.x * 5. + uTime * .2) * .6 + vn2(vUv * 23.) * .4) * (1. - smoothstep(body * .6, body * 2.6, r)) * vK.z;      // froth where it heaved up
        float al = clamp(abs(h) * 1.7, 0., .85);
        vec3 col = mix(h > 0. ? bright : darkC, uFoam * (uSunC * .4 + uSkyC), fo * .85); al = max(al, fo * .85);
        gl_FragColor = vec4(fogMix(col, FOGD) * al, al);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3.2;
  return { mesh, iQ, attr: g.attributes.iQ };
}
// ---- the bar we wade out on: two bleached snags the floods left (one on the mud under the bank, one stranded in the shallows), and egrets
// standing about them, stepping out of the herd's way
function buildBarDress(ctx, Y, land, hero, W, camL) {
  const rng = ctx.rng.fork('bar'), group = new THREE.Group(), g = new F.Geo(), v = new THREE.Vector3(), t = new THREE.Vector3();
  const cA = new THREE.Color(0.4, 0.36, 0.3), cB = new THREE.Color(0.12, 0.1, 0.085), perch = [];
  const at = (u, lat) => { Y.posAt(u * Y.L, v); Y.tanAt(u * Y.L, t); const il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)), x = v.x - t.z * il * lat, z = v.z + t.x * il * lat; return [x, Math.max(land.height(x, z), W - 0.12), z, t.x * il, t.z * il]; };
  const gy = (x, z) => Math.max(land.height(x, z), W - 0.12);
  const snag = (u, lat, len, ang, r0) => {
    const [x0, , z0, tx, tz] = at(u, lat); if (land.sample(x0, z0).wall) { for (let k = 0; k < 4; k++) perch.push(at(u, lat)); return; }
    const ca = Math.cos(ang), sa = Math.sin(ang), dx = tx * ca - tz * sa, dz = tz * ca + tx * sa, pts = [], rr = [], ph = rng() * 6.283;
    for (let i = 0; i <= 6; i++) { const f = i / 6, w = 0.45 * Math.sin(f * 3 + ph), x = x0 + dx * len * (f - 0.5) - dz * w, z = z0 + dz * len * (f - 0.5) + dx * w, r = r0 * (1 - 0.62 * f); pts.push([x, gy(x, z) + r * 0.6 + 0.7 * f * f, z]); rr.push(r); }
    g.tube(pts, rr, 6, cA, cB);
    for (let k = 0; k < 4; k++) {                                // the limbs it still has
      const i = 2 + k, q = pts[i], a = rng.range(-0.8, 0.8), h = rng.range(1.0, 1.9) * (1 - 0.1 * k), bx = -dz * Math.sin(a) + dx * 0.35, bz = dx * Math.sin(a) + dz * 0.35, tip = [q[0] + bx * h * 0.75, q[1] + h, q[2] + bz * h * 0.75];
      g.tube([q, [q[0] + bx * h * 0.25, q[1] + h * 0.55, q[2] + bz * h * 0.25], tip], [rr[i] * 0.5, rr[i] * 0.34, 0.025], 5, cA, cB); perch.push(tip);
    }
    for (let k = 0; k < 5; k++) {                                // and the root plate at its butt
      const a = (k / 5) * 6.283 + rng.range(-0.3, 0.3), h = rng.range(0.5, 1.0), q = pts[0], sx = -dz * Math.cos(a), sz = dx * Math.cos(a), sy = Math.sin(a);
      g.tube([q, [q[0] - dx * 0.35 + sx * h * 0.5, q[1] + sy * h * 0.5, q[2] - dz * 0.35 + sz * h * 0.5], [q[0] - dx * 0.5 + sx * h, Math.max(q[1] + sy * h, gy(q[0], q[2]) - 0.1), q[2] - dz * 0.5 + sz * h]], [r0 * 0.55, r0 * 0.32, 0.03], 5, cB, cB);
    }
  };
  snag(0.814, 13.4, 6.5, 0.5, 0.27); snag(0.834, -17.2, 7.5, -0.9, 0.3); snag(0.886, -8.6, 5.5, 0.7, 0.22);
  const wood = new THREE.Mesh(g.build(), litMaterial(hero, {}, { alb: 1, gloss: 0.04 })); wood.frustumCulled = false; wood.onBeforeRender = camL; group.add(wood);
  const eg = F.waderGeometry({ ...F.WADER_PRESETS.egret, body: '#e9e7df', belly: '#f1efe8', wing: '#dedcd2', neckC: '#ebe9e1', cap: '#ebe9e1' });
  const spots = [[...perch[5]], [...perch[7]], at(0.818, 14.8), at(0.823, 16.1), at(0.827, 14.3), at(0.812, -19.5), at(0.851, -15.6), at(0.855, -17.4), at(0.806, 15.6), [...perch[9]], at(0.881, -10.6), at(0.894, -9.8)];
  const birds = new THREE.InstancedMesh(eg, litMaterial(hero, {}, { alb: 0.8 }), spots.length), d = new THREE.Object3D();
  spots.forEach((q, i) => { d.position.set(q[0], q[1] - 0.02, q[2]); d.rotation.set(0, rng() * 6.283, 0); d.scale.setScalar(rng.range(1.05, 1.25)); d.updateMatrix(); birds.setMatrixAt(i, d.matrix); });
  birds.frustumCulled = false; birds.onBeforeRender = camL; group.add(birds);
  return { group, triangles: wood.geometry.index.count / 3 + spots.length * eg.index.count / 3 };
}
function buildBursts(hero, list) {
  const U = hero.uniforms, n = list.length, bA = new Float32Array(n * 4), bB = new Float32Array(n * 4), bC = new Float32Array(n * 4);
  list.forEach((b, i) => { bA.set([b.p[0], b.p[1], b.p[2], b.ev], i * 4); bB.set([b.v[0], b.v[1], b.v[2], b.life], i * 4); bC.set([b.s0, b.s1, (i * 0.618) % 1, b.type], i * 4); });
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.index = q.index; g.setAttribute('position', q.attributes.position);
  g.setAttribute('bA', new THREE.InstancedBufferAttribute(bA, 4)); g.setAttribute('bB', new THREE.InstancedBufferAttribute(bB, 4)); g.setAttribute('bC', new THREE.InstancedBufferAttribute(bC, 4)); g.instanceCount = n;
  const ages = { value: [-1, -1, -1, -1, -1, -1] };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uEv: ages }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 bA, bB, bC; uniform float uEv[6]; uniform vec3 uSun;
      varying vec2 vUv; varying vec4 vK; varying float vLit;
      void main(){
        int ev = int(bA.w + .5); float age = ev == 0 ? uEv[0] : ev == 1 ? uEv[1] : ev == 2 ? uEv[2] : ev == 3 ? uEv[3] : ev == 4 ? uEv[4] : uEv[5];
        float life = bB.w, type = bC.w, lt = age - bC.z * .12, k = clamp(lt / life, 0., 1.), a = (lt > 0. && lt < life) ? 1. : 0.;
        vec3 right = normalize(vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]));
        vec3 up = normalize(vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]));
        vec3 p = bA.xyz; vec2 q = position.xy; float sz = mix(bC.x, bC.y, 1. - (1. - k) * (1. - k)); vec2 ext = vec2(sz);
        if (type < .5) { p += bB.xyz * lt; p.y -= 4.9 * lt * lt; a *= smoothstep(0., .08, k) * (1. - k); }
        else if (type < 1.5) { p += bB.xyz * lt * (1. - .45 * k); a *= smoothstep(0., .18, k) * (1. - k) * (1. - k) * 1.1; }
        else if (type > 2.5) { p += bB.xyz * lt * (1. - .5 * k); a *= smoothstep(0., .07, k) * (1. - k) * 1.7; }
        else { float rise = smoothstep(0., .16, lt), fall = 1. - smoothstep(.3, 1., k); q.y = q.y * .5 + .5; up = vec3(0., 1., 0.); ext = vec2(bC.x * (.55 + .9 * k), bC.y * rise * (.3 + .7 * fall)); a *= smoothstep(0., .05, k) * (1. - k * k); }
        float dz = -(modelViewMatrix * vec4(p, 1.)).z;
        if (type < .5) ext = min(ext, vec2(.011 * dz));                 // drops stay drops however near they fly: never a disc on the screen
        a *= smoothstep(.4, 1.5, dz);
        vLit = clamp(dot(uSun, right) * q.x * .4 + dot(uSun, up) * q.y * .4 + .6, 0., 1.);
        vUv = position.xy; vK = vec4(type, a, bC.z, lt);
        vec4 mvPosition = modelViewMatrix * vec4(p + right * q.x * ext.x + up * q.y * ext.y, 1.);
        gl_Position = a > .004 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uFoam;
      varying vec2 vUv; varying vec4 vK; varying float vLit;
      ${GLSL_COMMON}
      ${GLSL_FOGMIX}
      void main(){
        float type = vK.x, r = length(vUv), al;
        if (type < .5) { float n = vn2(vUv * 5.5 + vK.z * 31.), n2 = vn2(vUv * 12. - vK.z * 17.); al = max(smoothstep(.55, .76, n * .62 + n2 * .5), 1. - smoothstep(.2, .5, r)) * (1. - smoothstep(.4, 1., r)) * .95; }      // a drop with a few smaller ones round it
        else if (type < 1.5 || type > 2.5) { float n = vn2(vUv * 2.2 + vK.z * 17. + vK.w * .6) * .6 + vn2(vUv * 5.5 - vK.z * 9.) * .4; al = (1. - smoothstep(.1, 1., r + (n - .5) * .8)) * (1. - smoothstep(.7, 1., r)) * .5; }
        else al = spray(vec2(vUv.x, vUv.y * .5 + .5), vK.z, clamp(vK.w / 1.2, 0., 1.), vK.w);
        al *= vK.y;
        vec3 col = uFoam * (uSunC * (.25 + .5 * vLit) + uSkyC * .8);
        gl_FragColor = vec4(fogMix(col, FOGD) * al, al * .85);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4.2;
  return { mesh, ages: ages.value };
}

// ---------------------------------------------------------------- air: chaff and dust motes round the lens, and the dust that veils the sky
const capped = (c, top) => { const m = Math.max(c.r, c.g, c.b); return m > top ? c.multiplyScalar(top / m) : c; };          // a colour kept under the bloom's threshold
function buildAir(ctx, hero, look) {
  const rng = ctx.rng.fork('air'), U = hero.uniforms, n = Math.round(650 * (ctx.quality?.detail ?? 1)), pos = new Float32Array(n * 3), sd = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([rng() * 36, rng() * 14, rng() * 36], i * 3); sd[i] = rng(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sd, 1));
  const AU = { uPx: { value: 450 }, uAmt: { value: 1 }, uCam: { value: new THREE.Vector3() } };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, ...AU }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute float aS; uniform float uTime, uPx, uAmt; uniform vec3 uWind, uCam;
      varying float vA, vS;
      void main(){
        vec3 p = position + (uWind * .8 + vec3(.3, 0., .2)) * uTime + vec3(sin(uTime * .7 + aS * 30.), sin(uTime * .9 + aS * 50.) * .6 + uTime * (.15 + .3 * aS), cos(uTime * .6 + aS * 40.)) * .5;
        p = mod(p - uCam + vec3(18., 4., 18.), vec3(36., 14., 36.)) - vec3(18., 4., 18.) + uCam;
        vec4 mv = modelViewMatrix * vec4(p, 1.); float d = -mv.z;
        float sz = (.035 + .05 * aS) * uPx / max(d, .5);
        gl_PointSize = clamp(sz, 1.5, 9.);
        vA = smoothstep(1.2, 3.5, d) * (1. - smoothstep(11., 18., d)) * uAmt * min(1., sz / 1.5) * (.4 + .6 * fract(aS * 7.3)); vS = aS;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunC, uDustLit; varying float vA, vS;
      void main(){ vec2 q = gl_PointCoord * 2. - 1.; float a = (1. - smoothstep(.2, 1., dot(q, q))) * vA; gl_FragColor = vec4(uDustLit * (.5 + .35 * uSunC) * (.7 + .5 * vS) * a, a * .8); }`,
  });
  const points = new THREE.Points(g, mat); points.frustumCulled = false; points.renderOrder = 5;
  // the dust dome: drawn right after the sky, it turns the sky to dust in the gully and lays a haze band on the horizon
  const dg = new THREE.SphereGeometry(60, 24, 12), DU = { uDomeC: { value: C3(look.gully) }, uDomeA: { value: 0.2 }, uDomeH: { value: 0 }, uDomeW: { value: 0.22 }, uCore: { value: new THREE.Vector4(1, 0, 0, 0) }, uCoreC: { value: C3(look.gully) },
    uDomeL: { value: 0 }, uDomeT: U.uTime, uDomeS: U.uSun, uDomeG: { value: capped(C3(look.gully).lerp(C3('#ffe9b8'), 0.45).multiplyScalar(1.12), 0.9) }, uDomeU: { value: C3(look.gully).multiply(new THREE.Color(0.5, 0.42, 0.36)) } };
  const dmat = new THREE.ShaderMaterial({
    uniforms: DU, side: THREE.BackSide, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uDomeC, uCoreC, uDomeS, uDomeG, uDomeU; uniform vec4 uCore; uniform float uDomeA, uDomeH, uDomeW, uDomeL, uDomeT; varying vec3 vD;
      ${GLSL_COMMON}
      void main(){ vec3 d = normalize(vD); float e = d.y, k = max(dot(d, uCore.xyz), 0.), core = k * k * k * .5 * uCore.w;
        // in the gully (uDomeL) the dust hangs in sheets that drift on the wind: read on a level plane overhead. Over the rim the sun
        // comes across they are gold, under the shaded wall umber, and straight up between them the sky shows through
        vec2 q = d.xz / max(e + .2, .14);
        float lay = vn2(q * vec2(1.1, 1.7) + uDomeT * vec2(.045, .02)) * .6 + vn2(q * 3.3 - uDomeT * vec2(.03, .07) + 5.) * .4;
        vec2 az = d.xz / max(length(d.xz), 1e-3), sz = uDomeS.xz / max(length(uDomeS.xz), 1e-3);
        float sunSide = smoothstep(-.5, .7, dot(az, sz)), high = smoothstep(.03, .3, e);
        vec3 c = mix(uDomeC, mix(uDomeU, uDomeG, sunSide), uDomeL * high * (.2 + .7 * smoothstep(.28, .7, lay)) * (1. - .6 * smoothstep(.6, .95, e)));
        c = mix(c, uCoreC, clamp(core, 0., 1.));
        float open = uDomeL * smoothstep(.13, .42, e) * (.3 + .6 * (1. - smoothstep(.3, .66, lay)));
        gl_FragColor = vec4(c, clamp(uDomeA * mix(1., uDomeH * (1. - open), smoothstep(-.02, uDomeW, e)) + core * .5, 0., 1.)); }`,
  });
  const dome = new THREE.Mesh(dg, dmat); dome.frustumCulled = false; dome.renderOrder = -0.5;
  // the brightening of the fog where the gully bends: five soft layers of light standing 26 to 46 m ahead, each broader than the gully's own
  // section and as tall as its walls, laid over the fog toward one colour that stays under the bloom's threshold (a broad glow, never a
  // white point), drawn before the herd so every animal stays dark against it
  const NG = 5, gg = new THREE.InstancedBufferGeometry(), gq = new THREE.PlaneGeometry(2, 2), gi = new Float32Array(NG); for (let i = 0; i < NG; i++) gi[i] = i;
  gg.index = gq.index; gg.setAttribute('position', gq.attributes.position); gg.setAttribute('iG', new THREE.InstancedBufferAttribute(gi, 1)); gg.instanceCount = NG;
  const GU = { uGlowP: { value: new THREE.Vector3() }, uGlowD: { value: new THREE.Vector3(1, 0, 0) }, uGlowC: { value: new THREE.Color(1, 0.82, 0.5) }, uGlowA: { value: 0 } };
  const gmat = new THREE.ShaderMaterial({ uniforms: GU, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`attribute float iG; uniform vec3 uGlowP, uGlowD; uniform float uGlowA; varying vec2 vUv;
      void main(){ vec3 c = uGlowP + uGlowD * iG * 5.;
        vec3 right = normalize(vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]));
        vUv = position.xy; gl_Position = uGlowA > .002 ? projectionMatrix * modelViewMatrix * vec4(c + right * position.x * (14.5 + iG * 1.5) + vec3(0., 1., 0.) * (1.4 + position.y * (5.6 + iG * .6)), 1.) : vec4(2., 2., 2., 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uGlowC; uniform float uGlowA; varying vec2 vUv;
      void main(){ vec2 q = abs(vUv); float a = (1. - smoothstep(.1, 1., q.x)) * (1. - smoothstep(.05, 1., q.y)); gl_FragColor = vec4(uGlowC, clamp(a * a * uGlowA, 0., 1.)); }` });
  const glow = new THREE.Mesh(gg, gmat); glow.frustumCulled = false; glow.renderOrder = 2.2;
  return { points, dome, glow, AU, DU, GU };
}

// ---------------------------------------------------------------- cumulus towers over the escarpment
// A rank of tall clouds standing over the blue wall on our right, 2.7 km off whichever way we go (they ride with the lens, like the sky):
// each a card turned to us, its heaped turrets drawn in the shader, lit on the sun's side and on top, blue-grey in its own shade and under its
// flat base. Drawn after the sky and before the far ridges, so the escarpment stands in front of their feet and the dust lies over them.
function buildCumulus(ctx, hero, look) {
  const rc = ctx.rng.fork('cumulus'), U = hero.uniforms, sun = U.uSun.value, azS = Math.atan2(sun.z, sun.x), list = [];
  for (let az = 0.62 + rc.range(0, 0.04), k = 0; az < 1.86; az += rc.range(0.13, 0.19), k++) {
    const big = k % 3 !== 1, w = big ? rc.range(1000, 1350) : rc.range(620, 800), h = big ? rc.range(640, 900) : rc.range(360, 480), sd = Math.round(rc() * 512) / 512;
    if (Math.abs(az - azS) < 0.14) continue;                               // (none across the sun itself)
    list.push([az, rc.range(150, 215), w, h, sd, Math.sin(azS - az), rc.range(0.9, 1.08), big ? 1 : 0]);
  }
  const n = list.length, iC = new Float32Array(n * 4), iK = new Float32Array(n * 4);
  list.forEach((l, i) => { iC.set(l.slice(0, 4), i * 4); iK.set(l.slice(4, 8), i * 4); });
  const g = new THREE.InstancedBufferGeometry();
  g.setIndex([0, 1, 2, 0, 2, 3]); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uCamL: U.uCamL, uLit: { value: capped(look.clouds > 0.7 ? C3(look.cloudLit).lerp(C3(look.sunC), 0.5).multiplyScalar(0.9) : C3(look.cloudLit).multiplyScalar(1.12), 0.8) }, uShd: { value: C3(look.cloudShade).lerp(C3(look.mid), 0.25) }, uHzn: { value: C3(look.horizon) } },
    depthTest: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 iC, iK; uniform vec3 uCamL; varying vec2 vUv; varying vec4 vI;
      void main(){
        float az = iC.x; vec3 c = vec3(uCamL.x + cos(az) * 2700., iC.y, uCamL.z + sin(az) * 2700.);
        vec3 wp = c + vec3(-sin(az), 0., cos(az)) * (position.x * iC.z * .5) + vec3(0., position.y * iC.w, 0.);
        vUv = position.xy; vI = iK;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLit, uShd, uHzn; varying vec2 vUv; varying vec4 vI;
      ${GLSL_COMMON}
      void main(){
        vec2 p = vUv; float sd = floor(vI.x * 512. + .5) / 512.;
        vec2 q = p + (vec2(vn2(p * 2.6 + sd * 9.), vn2(p * 2.6 + sd * 9. + 17.)) - .5) * .13 + (vec2(vn2(p * 6.5 + sd * 3.), vn2(p * 6.5 + sd * 3. + 31.)) - .5) * .05;
        // a heap of rounds: a broad low mass, and domes piled on it that narrow to one or two heads; each round has a lit and a shaded side
        float d = 1. - length((q - vec2(0., .2)) / vec2(.82, .2)); vec2 cb = vec2(0., .2), rv = vec2(.82, .3);
        for (int i = 0; i < 8; i++) {
          float fi = float(i), h1 = h11(sd * 17.3 + fi * 3.1), h2 = h11(sd * 5.7 + fi * 7.7), h3 = h11(sd * 11.1 + fi * 1.9), t = fi / 7.;
          vec2 c = vec2((h1 - .5) * 1.3 * (1. - .62 * t), .2 + .54 * t * (.8 + .2 * h2)); float r = mix(.3, .19, t) * (.8 + .45 * h3);
          float di = 1. - length((q - c) / vec2(r * 1.05, r));
          if (di > d) { d = di; cb = c; rv = vec2(r * 1.05, r); }
        }
        float foot = smoothstep(.07, .11, p.y + (vn2(vec2(p.x * 2.1, sd * 7.)) - .5) * .025);
        float al = smoothstep(0., .1, d) * foot * (1. - smoothstep(.9, 1., abs(p.x)));
        if (al < .01) discard;
        vec2 nd = (q - cb) / rv, L2 = normalize(vec2(vI.y * 1.1, .62));
        float bil = vn2(q * 5.5 + sd * 13.) * .6 + vn2(q * 11. - sd * 7.) * .4;
        float lit = clamp(dot(nd, L2) * .55 + .45 + (bil - .5) * .3, 0., 1.);
        lit *= mix(.35, 1., smoothstep(.08, .4, p.y));                                   // the flat base in its own shade
        vec3 col = mix(uShd * (.84 + .26 * bil), uLit, smoothstep(.3, .72, lit)) * vI.z;
        col += uLit * .14 * (1. - smoothstep(0., .25, d)) * smoothstep(.45, .8, lit);     // the lit edge burns a little
        col = mix(uHzn * .95, col, .35 + .65 * smoothstep(.04, .34, p.y));               // its foot stands in the haze
        gl_FragColor = vec4(col, al * .97);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = -0.9;
  return mesh;
}
// the shadows those clouds lay on the plain: the pattern is the land's own tiling texture, seated in the world by an offset drawn from the
// seed and sliding one way (a bearing drawn from the seed) at one wind speed, eight metres a second
function planClouds(ctx, size) {
  const rc = ctx.rng.fork('cloud-shadows'), z = 1 / size, an = rc() * 6.283, sp = 8 * z;
  return { z, ox: rc(), oz: rc(), dx: Math.cos(an) * sp, dz: Math.sin(an) * sp };
}

// ---------------------------------------------------------------- the beaten way under the lens: our own ground along the whole land path
// A ribbon laid on the rendered terrain (hoof-pocked ochre earth, scuffs along the run, crushed straw, grit; churned wet mud on the bar),
// short grazed stubble and broken stalks standing on it, and small half-sunk clods. Everything shades with the hero's light.
const GROUND_GLSL = /* glsl */`
// one hoof print per 0.34 m cell: a cloven dimple with a pushed-up rim; returns height in metres (about -0.02 .. +0.008)
float pock(vec2 p){
  vec2 c = floor(p / .29), q = p / .29 - c - .5; float h = h21(c + 3.7);
  q -= (vec2(h21(c + 11.3), h21(c - 5.1)) - .5) * .5;
  q.x *= 1.25; q *= .8 + .9 * h21(c + 17.1); float r = length(q), on = step(.3 + .55 * smoothstep(.3, .7, vn2(c * .16 + 2.)), h);
  float split = smoothstep(.0, .05, abs(q.x)) * .6 + .4;
  return on * (-.016 * (1. - smoothstep(.06, .27, r)) * split + .0035 * exp(-((r - .3) / .08) * ((r - .3) / .08)) * smoothstep(-.3, .3, q.y));
}
float groundH(vec2 p, vec2 t, float tr, float fine){
  vec2 a = vec2(dot(p, t), dot(p, vec2(-t.y, t.x)));                 // along / across the run
  float h = .01 * (vn2(p * .9) - .5) + .009 * (vn2(a * vec2(.6, 3.2)) - .5) * tr;      // ruts worn along the run
  h += (pock(p) + .6 * pock(p * 1.7 + 4.4)) * tr * fine;
  h += .006 * vn2(p * 14.) * fine + .004 * (1. - abs(2. * vn2(p * 5.3) - 1.)) * fine;
  h += gChurn * (.035 * (vn2(p * 2.7 + 9.) - .5) + .022 * (1. - abs(2. * vn2(p * 6.1) - 1.)) * fine + (pock(p * 1.3 + 7.7) + pock(p * 2.3 + 1.1)) * .8 * fine);     // between the walls the floor is churned to clods
  return h;
}
// crushed straw lying on the earth: one stalk per cell, two layers
float straw(vec2 p, float sc){
  vec2 c = floor(p * sc), q = fract(p * sc) - .5; float h = h21(c + 1.9), an = h * 6.283, on = step(.45, h21(c - 7.7));
  vec2 d = vec2(cos(an), sin(an)); q -= (vec2(h21(c + 2.2), h21(c + 8.8)) - .5) * .4;
  float al = dot(q, d), ac = dot(q, vec2(-d.y, d.x));
  return on * (1. - smoothstep(.012, .03, abs(ac))) * (1. - smoothstep(.2, .34, abs(al)));
}
// fallen fig leaves: x = mask, y = a hash for its colour
vec2 leafv(vec2 p, float sc){
  vec2 c = floor(p * sc), q = fract(p * sc) - .5; float h = h21(c + 4.3), an = h * 6.283, on = step(.3, h21(c - 2.9));
  vec2 d = vec2(cos(an), sin(an)); q -= (vec2(h21(c + 6.1), h21(c + 9.4)) - .5) * .45;
  float al = dot(q, d), ac = dot(q, vec2(-d.y, d.x));
  return vec2(on * (1. - smoothstep(.75, 1., length(vec2(al / .3, ac / .15)))) * (1. - .5 * smoothstep(.0, .02, abs(ac)) * 0.), h);
}
`;
async function buildGround(ctx, Y, land, hero, W, surf, look) {
  const rng = ctx.rng.fork('ground'), U = hero.uniforms, detail = ctx.quality?.detail ?? 1, group = new THREE.Group();
  const v = new THREE.Vector3(), t = new THREE.Vector3(), L = Y.L;
  const at = (s) => { if (s <= L) { Y.posAt(Math.max(0, s), v); Y.tanAt(Math.max(0, s), t); if (s < 0) { v.x += t.x * s; v.z += t.z * s; } } else { Y.posAt(L, v); Y.tanAt(L, t); v.x += t.x * (s - L); v.z += t.z * (s - L); } const il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)); t.x *= il; t.z *= il; };
  // ---- the ribbon
  const COLS = [-1, -0.8, -0.62, -0.46, -0.32, -0.19, -0.07, 0.07, 0.19, 0.32, 0.46, 0.62, 0.8, 1], NC = COLS.length, pos = [], dat = [], tan = [], lts = [], idx = [];
  let rows = 0;
  const strip = async (s0, s1, step) => {
    const r0 = rows;
    for (let s = s0; s <= s1 + 1e-3; s += s < -12 ? 2 * step : step) {       // (behind the ring, where only a portal's far view sees it, the rows are twice as far apart)
      if ((rows & 15) === 0) await ctx.yield();                   // a few rows of the ribbon at a time
      at(s); const cx = v.x, cz = v.z, tx = t.x, tz = t.z, q0 = land.sample(cx, cz);
      const half = Math.min(11.5, Math.max(2.5, q0.hw - 0.7)) * (s > L - 14 ? lerp(1, 0.62, sstep(L - 14, L - 4, s)) : 1);
      const endA = sstep(s0, s0 + 3, s) * (1 - sstep(s1 - 3, s1, s));
      // the shadow of the bank on the sun's side lies across the floor as far as the bank is high (the entry gully's floor is all in shade; in the
      // exit, where the banks are lower, the far side of the floor is in the sun)
      let sunV = 1, sgnS = 1, reach = 0; const hw0 = q0.hw;
      if (hw0 < 30) { const sx = U.uSun.value.x, sz = U.uSun.value.z, cr = sx * -tz + sz * tx, far = hw0 + 6.5, wallH = Math.max(0, land.sample(cx - tz * (cr > 0 ? 1 : -1) * far, cz + tx * (cr > 0 ? 1 : -1) * far).h - (Y.pathY(s) - 1.5));
        sgnS = cr > 0 ? 1 : -1; sunV = 1 - 0.85 * sstep(0.6, 2.4, wallH); reach = wallH * Math.abs(cr) / Math.max(0.05, U.uSun.value.y); }
      for (let j = 0; j < NC; j++) {
        const lat = COLS[j] * half, x = cx - tz * lat, z = cz + tx * lat, y = surf(x, z), q = land.sample(x, z);
        pos.push(x, y + 0.03, z); lts.push(lat, s); tan.push(tx, tz, s < Y.sLip ? 1 - 0.35 * sstep(Y.sGully - 10, Y.sGully + 30, s) : 0.5 * (1 - sstep(L - 6, L + 20, s)), q0.hw < 30 ? 1 : 0);
        const wetTrk = s > Y.sLand ? 0.92 * (1 - sstep(Y.sExit + 12, Y.sExit + 52, s)) * (1 - 0.7 * COLS[j] * COLS[j]) : 0;      // the dripping herd carries the river up the exit: churned wet mud and standing water
        dat.push(Math.abs(COLS[j]) > 0.99 ? 0 : endA, clamp(0.35 + 0.65 * q.tr, 0, 1), Math.max(q.kind === 2 ? 1 - sstep(W + 0.5, W + 2.6, y) : 0, wetTrk), lerp(sunV, 1, sstep(reach - 1.5, reach + 0.5, hw0 - sgnS * lat)));
      }
      rows++;
    }
    for (let i = r0; i < rows - 1; i++) for (let j = 0; j < NC - 1; j++) { const a = i * NC + j, b = a + NC; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  };
  await strip(-150, Y.sLip - 0.8, 1.3); await strip(Y.sWade - 4, L + 26, 1.3);
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(dat, 4)); g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 4)); g.setAttribute('aL', new THREE.Float32BufferAttribute(lts, 2)); g.setIndex(idx);
  const fg = land.figs, GU = { uFigs: { value: new THREE.Vector4(fg[0][0], fg[0][1], fg[1][0], fg[1][1]) }, uEarthA: { value: new THREE.Color(0.4, 0.275, 0.165) }, uEarthB: { value: new THREE.Color(0.53, 0.4, 0.25) }, uStraw: { value: new THREE.Color(0.62, 0.5, 0.27) }, uMud: { value: new THREE.Color(0.23, 0.165, 0.105) }, uGreen: { value: look.grass } };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...GU }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 aD, aT; attribute vec2 aL; varying vec3 vW; varying vec4 vD, vT; varying vec2 vL;
      void main(){ vW = position; vD = aD; vT = aT; vL = aL; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uCamL, uEarthA, uEarthB, uStraw, uMud, uSkyRef, uDustLit, uDustShade; uniform float uGreen, uShade, uTime; uniform vec4 uFigs;
      varying vec3 vW; varying vec4 vD, vT; varying vec2 vL;
      ${GLSL_COMMON}
      ${CLOUD_GLSL}
      float gChurn = 0.;
      ${GROUND_GLSL}
      // the trails on the run in (the world's trailAt): our own and six beside it, each one animal broad, weaving
      float braid(vec2 l, vec4 c){ return .9 * (1. - smoothstep(.22, .6, abs(l.x - c.x - c.y * sin(l.y * c.z + c.w)))); }
      float trails(vec2 l){
        float w = 1. - smoothstep(.3, .8, abs(l.x));
${BRAID.map((c) => `        w = max(w, braid(l, vec4(${c.map((v) => v.toFixed(3)).join(', ')})));`).join('\n')}
        return w * (1. - smoothstep(36., 96., l.y));
      }
      void main(){
        vec2 p = vW.xz, tg = normalize(vT.xy + vec2(1e-5, 0.)); vec3 Vv = uCamL - vW; float dist = length(Vv), tr = max(vD.y, .35 + .65 * trails(vL)), wet = vD.z;
        float fine = 1. - smoothstep(14., 34., dist), e = .02 + dist * .004; gChurn = max(max(vT.w, .45 * tr), wet * .9);                // (and the bar is trodden to a slop)
        float h0 = groundH(p, tg, tr, fine), hx = groundH(p + vec2(e, 0.), tg, tr, fine), hz = groundH(p + vec2(0., e), tg, tr, fine);
        vec3 N = normalize(vec3(-(hx - h0) / e * .85, 1., -(hz - h0) / e * .85));
        float n1 = vn2(p * .23 + 7.), n2 = vn2(p * 2.1), n3 = vn2(p * 9.);
        vec3 alb = mix(uEarthA, uEarthB, smoothstep(.2, .8, n1 * .6 + n2 * .4)) * (.82 + .3 * n3);
        float pk = (pock(p) + .6 * pock(p * 1.7 + 4.4)) * tr * fine;
        alb *= (1. + 5. * clamp(h0, -.03, .02)) * (1. - .3 * smoothstep(-.002, -.014, pk)) * (1. + .12 * smoothstep(.001, .004, pk));       // prints: dark in the bottom, pale on the pushed-up rim
        float st = max(straw(p, 2.6), straw(p + 3.3, 4.3) * .8) * fine;                         // crushed straw and stubble marks
        float litter = smoothstep(.42, .66, vn2(p * .8 + 3.) * .6 + vn2(p * 3.7) * .4) * (1.45 - .75 * tr);
        alb = mix(alb, uStraw * (.7 + .5 * n3) * mix(vec3(1.), vec3(.6, 1.1, .5), uGreen * .5), clamp(st * (.35 + .65 * litter) + litter * .35 * (.4 + .6 * vn2(p * vec2(31., 27.))), 0., 1.));
        float grit = smoothstep(.8, .93, vn2(p * 23.) * .6 + vn2(p * 47.) * .4) * fine; alb = mix(alb, vec3(.5, .46, .4), grit * .7);
        float figD = min(distance(p, uFigs.xy), distance(p, uFigs.zw)), lfK = (1. - smoothstep(7., 19., figD)) * fine;
        if (lfK > 0.) { vec2 l1 = leafv(p, 3.4), l2 = leafv(p + 5.7, 5.2); float lm = max(l1.x, l2.x * .9), lh = l1.x > l2.x * .9 ? l1.y : l2.y;
          alb = mix(alb, mix(vec3(.2, .11, .04), mix(vec3(.4, .36, .09), vec3(.16, .26, .07), smoothstep(.5, .8, lh)), smoothstep(.15, .5, lh)) * (.7 + .5 * n3), lm * lfK * (.4 + .6 * smoothstep(.35, .6, vn2(p * .7 + 9.)))); }
        float sward = (1. - smoothstep(.42, .8, tr)) * (.55 + .45 * smoothstep(.3, .6, vn2(p * 1.3 + 5.)));                                    // off the beaten way: a mat of dry grass
        alb = mix(alb, uStraw * mix(vec3(1.), vec3(.6, 1.1, .5), uGreen * .5) * (.45 + .5 * vn2(p * vec2(37., 31.)) + .3 * n3) * (.7 + .5 * n2), sward * .85);
        float dungK = smoothstep(.7, .8, vn2(p * 1.7 + 11.)) * smoothstep(.25, .6, vn2(p * 8.3)) * vT.w;                         // dung trodden into the floor
        alb = mix(alb, vec3(.12, .1, .055) * (.7 + .6 * n3), dungK * .8);
        alb *= 1. - gChurn * (.3 * smoothstep(.35, .7, vn2(p * 4.4 + 2.)) + .22 * smoothstep(.4, .65, vn2(p * .9 + 17.)));                                              // damp, darker where it was turned over
        alb = mix(alb, uMud * (.62 + .42 * n2), wet * .9);
        // the bar: water stands in every hollow of the churned mud, and each one holds the sky
        float pud = smoothstep(.45, .8, wet) * smoothstep(.6, .65, vn2(p * 1.05 + 13.) * .6 + vn2(p * 3.1 + 4.) * .4 - 2.5 * clamp(h0, -.02, .02));
        N = normalize(mix(N, vec3(0., 1., 0.), pud * .93)); alb *= 1. - .5 * pud;
        vec3 V = Vv / max(dist, 1e-3);
        float ndl = max(dot(N, uSun), 0.);
        float cs = cloudSun(p), sunW = vD.w * cs;
        vec3 col = alb * (uSunC * ndl * 1.15 * sunW + (mix(uGndC, uSkyC, mix(.5, .85, vD.w)) + uDustLit * .75 * (1. - vD.w)) * (.88 + 5. * clamp(h0 + pk, -.03, .01)));
        vec3 Hh = normalize(uSun + V); float fr = 1. - max(dot(N, V), 0.); fr *= fr; fr *= fr;
        col += (uSunC * pow(max(dot(N, Hh), 0.), 60.) * .8 + uSkyRef * fr * .5) * wet * (.4 + .6 * n2);     // wet mud shines
        vec3 pc = mix(uSkyRef, vec3(dot(uSkyRef, vec3(.3, .5, .2))) * vec3(1.22, 1., .74), .92) * 1.12;                 // the low sky: pale and warm, a little blue in it
        col = mix(col, pc * (.55 + .75 * fr) + uSunC * pow(max(dot(N, Hh), 0.), 260.) * 2., pud * (.5 + .5 * fr));
        // the dust the column keeps knee-deep over the beaten way: the further the ground, the more of the layer lies between it and us; it drifts in bands
        float dn = vn2(p * .05 + vec2(uTime * .11, uTime * .05)) * .65 + vn2(p * .19 - vec2(uTime * .23, 0.)) * .35;
        float lay = (1. - exp(-max(dist - 1.5, 0.) * .12 * (.04 + 2.6 * dn * dn * dn + vT.w * (.3 + .9 * dn)))) * max(vT.z, vT.w) * (.35 + .65 * tr) * (1. - wet) * (1. - .5 * uShade);
        float toSun = max(dot(-V, normalize(vec3(uSun.x, 0., uSun.z) + 1e-4)), 0.);
        vec3 dc = mix(uDustShade * (1.3 + uSkyC * .8), uDustLit * (.6 + .26 * uSunC), (.4 + .45 * toSun * toSun) * (.3 + .7 * cs));
        col = mix(col, dc * (1. - .35 * uShade), lay * .86);
        gl_FragColor = vec4(col, vD.x);
        #include <fog_fragment>
      }`,
  });
  const ribbon = new THREE.Mesh(g, mat); ribbon.frustumCulled = false; ribbon.renderOrder = 0.4; group.add(ribbon);
  // (the world asks for camera.nearThrough, so seen through a portal the ground in front of the entry is this same ribbon and turf)
  return { group, ribbon, at, v, t, triangles: idx.length / 3 };
}
// grazed stubble, broken stalks and small clods standing on the beaten way
async function buildStubble(ctx, Y, land, hero, W, surf, G, look, fringe) {
  const rng = ctx.rng.fork('stubble'), U = hero.uniforms, detail = ctx.quality?.detail ?? 1, group = new THREE.Group(), L = Y.L;
  const pos = [], uvs = [], idx = [];
  for (let c = 0; c < 2; c++) { const an = (c / 2) * Math.PI + 0.3, dx = Math.cos(an), dz = Math.sin(an), o = pos.length / 3; pos.push(-dx * 0.5, 0, -dz * 0.5, dx * 0.5, 0, dz * 0.5, dx * 0.5, 1, dz * 0.5, -dx * 0.5, 1, -dz * 0.5); uvs.push(c * 0.37, 0, c * 0.37 + 1, 0, c * 0.37 + 1, 1, c * 0.37, 1); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  const gA = [], gB = [], want = Math.round(4200 * detail);
  const landS = Y.sLip - 2 + 140, exitS = L + 22 - (Y.sBar - 6);
  for (let tries = 0; gA.length / 4 < want && tries < want * 6; tries++) {
    if ((tries & 127) === 0) await ctx.yield();
    const s = rng() < landS / (landS + exitS) ? rng.range(-140, landS - 140) : rng.range(Y.sBar - 6, L + 22), sd = rng.chance(0.5) ? 1 : -1, r = rng(), lat = sd * (0.8 + (s < 4 ? 14 : 9.5) * Math.pow(r, 1.45));
    G.at(s); const x = G.v.x - G.t.z * lat, z = G.v.z + G.t.x * lat, q = land.sample(x, z);
    if (q.kind === 1 || Math.abs(lat) > q.hw - 0.25 || (s > L - 12 && Math.abs(lat) > 6.5) || trailAt(s, lat) > 0.4) continue;
    const y = surf(x, z); if (y < W + 0.35) continue;
    const tall = sstep(1.3, 9, Math.abs(lat)), broken = rng.chance(0.3) ? 1 : 0;
    gA.push(x, y - 0.02, z, lerp(0.24, 0.52, tall) * rng.range(0.7, 1.4)); gB.push(rng() * 6.283, rng(), rng(), broken);
  }
  for (const fr of fringe) { gA.push(fr[0], fr[1], fr[2], fr[3]); gB.push(fr[4], rng(), rng(), 2); }
  await ctx.yield();
  const g = new THREE.InstancedBufferGeometry();
  g.setIndex(idx); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('gA', new THREE.InstancedBufferAttribute(new Float32Array(gA), 4)); g.setAttribute('gB', new THREE.InstancedBufferAttribute(new Float32Array(gB), 4));
  g.instanceCount = gA.length / 4;
  const green = look.grass;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uRoot: { value: new THREE.Color(0.1, 0.068, 0.038).lerp(new THREE.Color(0.08, 0.11, 0.04), green * 0.6) }, uTip: { value: new THREE.Color(0.4, 0.29, 0.12).lerp(new THREE.Color(0.3, 0.36, 0.13), green * 0.6) } },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 gA, gB; uniform float uTime; uniform vec3 uWind;
      varying vec2 vUv; varying vec3 vK; varying float vCs;
      ${CLOUD_GLSL}
      void main(){
        float brk = step(.5, gB.w) * step(gB.w, 1.5), frg = step(1.5, gB.w);
        float c = cos(gB.x), s = sin(gB.x); vec3 p = position; p.xz *= 2.1 * mix(1., 1.3, brk); p.y *= mix(mix(1., .5, brk), .58, frg);            // broken stalks lie low and splayed; the fringe on a lip is short
        p *= gA.w; p.xz = vec2(p.x * c - p.z * s, p.z * c + p.x * s);
        float gust = .5 + .5 * sin(uTime * 1.7 + gA.x * .21 + gA.z * .13 + gB.y * 3.) + .3 * sin(uTime * 5.3 + gB.y * 40.);
        p.xz += uWind.xz * uv.y * uv.y * (.04 + .07 * gust) * gA.w;
        p.xz += vec2(c, s) * uv.y * uv.y * (.4 + .12 * gust) * gA.w * frg; p.y -= uv.y * uv.y * .12 * gA.w * frg;                             // and leans out over the edge
        vUv = uv; vK = vec3(gB.y, gB.z, frg); vCs = cloudSun(gA.xz);
        vec4 mvPosition = modelViewMatrix * vec4(p + gA.xyz, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uGndC, uRoot, uTip, uDustLit; uniform float uShade; varying vec2 vUv; varying vec3 vK; varying float vCs;
      ${GLSL_COMMON}
      // one row of fine blades: x = mask, y = that blade's hash, z = height along the blade
      vec3 row(vec2 uv, float n, float sd){
        float fx = uv.x * n + sd * 13.7, c = floor(fx), f = fract(fx) - .5, h = h11(c + sd * 91.);
        float hgt = .34 + .66 * h, lean = (h11(c * 1.7 + 3. + sd * 7.) - .5) * 1.5, v = uv.y / hgt;
        float x = f - lean * v * v * .5, w = (.2 + .13 * h) * pow(max(1. - v, 0.), .6) + .11 * smoothstep(.72, .86, v) * (1. - smoothstep(.9, 1., v)) * step(.45, h);   // a seed head near the tip of the taller ones
        return vec3(step(abs(x), w) * step(v, 1.), h, v);
      }
      void main(){
        vec3 a = row(vUv, mix(15., 23., vK.z), vK.x), b = row(vUv + vec2(.31, 0.), mix(10., 16., vK.z), vK.y + .5);
        float m = max(a.x, b.x); if (m < .5) discard;
        float h = a.x > .5 ? a.y : b.y, vb = a.x > .5 ? a.z : b.z, v = vUv.y, head = smoothstep(.7, .84, vb) * step(.45, h);
        vec3 alb = mix(uRoot, uTip * (.7 + .5 * h), smoothstep(0., .8, vb));
        alb = mix(alb, uTip * vec3(1.5, 1.3, .95), head * .75);
        float sh = uShade * (1. - vK.z);                                    // the fringe on the lips stands in the sun above the gully's shade
        vec3 col = alb * (uSunC * (.12 + .44 * vb + .3 * head) * (.6 + .4 * h) * (1. - .8 * sh) * vCs + mix(uGndC, uSkyC, .3 + .6 * v) * (.45 + .55 * vb) + uDustLit * .2 * sh);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const tufts = new THREE.Mesh(g, mat); tufts.frustumCulled = false; group.add(tufts);
  // clods: rounded, half sunk, never bigger than a fist on the open ground; a little larger where they have rolled to a wall foot
  const ico = new THREE.IcosahedronGeometry(1, 0), ip = ico.attributes.position, nr = ico.attributes.normal, seen = new Map();
  for (let i = 0; i < ip.count; i++) {
    const key = ip.getX(i).toFixed(3) + ',' + ip.getY(i).toFixed(3) + ',' + ip.getZ(i).toFixed(3);
    if (!seen.has(key)) seen.set(key, [rng.range(0.8, 1.2), rng.range(0.8, 1.1), rng.range(0.8, 1.2)]);
    const k = seen.get(key), nx = ip.getX(i), ny = ip.getY(i), nz2 = ip.getZ(i), il = 1 / Math.hypot(nx, ny, nz2);
    nr.setXYZ(i, nx * il, ny * il, nz2 * il);                                                      // smooth: the normal of the sphere it was
    ip.setXYZ(i, nx * k[0], ny * 0.7 * k[1], nz2 * k[2]);
  }
  ico.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ip.count * 3).fill(1), 3));
  const n0 = Math.round(200 * detail), n = Math.round(420 * detail), clods = new THREE.InstancedMesh(ico, litMaterial(hero, {}, { alb: 1 }), n), d = new THREE.Object3D(), c = new THREE.Color();
  let k = 0;
  for (let tries = 0; k < n && tries < n * 12; tries++) {
    if ((tries & 127) === 0) await ctx.yield();
    const more = k >= n0;                                        // the second lot: earth slumped off the gully walls in heaps at their feet, and dung on the floor between
    const s = more ? (rng.chance(0.72) ? rng.range(Y.sGully - 8, Y.sLip - 2) : rng.range(Y.sBar - 2, L - 8)) : rng.chance(0.62) ? rng.range(2, Y.sLip - 1) : rng.range(Y.sBar - 8, L + 20), sd = rng.chance(0.5) ? 1 : -1; G.at(s);
    const q0 = land.sample(G.v.x, G.v.z), foot = q0.hw < 30 && rng.chance(more ? 0.7 : 0.6), slump = more && foot ? Math.pow(rng(), 1.7) : 0;
    const lat = sd * (more ? (foot ? q0.hw + 0.1 - slump * 1.1 : rng.range(0.4, Math.max(0.5, q0.hw - 1.2))) : foot ? q0.hw - rng.range(0.1, 1.3) : 1.3 + 9 * Math.pow(rng(), 1.6));
    const x = G.v.x - G.t.z * lat, z = G.v.z + G.t.x * lat, q = land.sample(x, z), sy = surf(x, z);
    if (q.kind === 1 || Math.abs(lat) > q.hw + 0.2 || sy < W + 0.2) continue;
    if (more && q0.hw > 30) continue;
    const dung = more && !foot, sc = more ? (foot ? lerp(0.24, 0.09, slump) * rng.range(0.7, 1.15) : rng.range(0.05, 0.1)) : foot ? rng.range(0.07, 0.19) : rng.range(0.035, 0.085);
    d.position.set(x, sy - sc * (dung ? 0.1 : 0.22), z); d.rotation.set(rng.range(-0.3, 0.3), rng() * 6.283, rng.range(-0.3, 0.3)); d.scale.set(sc * rng.range(0.9, 1.5), sc * (dung ? 0.55 : 1), sc * rng.range(0.9, 1.5)); d.updateMatrix(); clods.setMatrixAt(k, d.matrix);
    if (dung) c.setRGB(0.06, 0.05, 0.03).multiplyScalar(rng.range(0.7, 1.15)); else c.setRGB(0.27, 0.18, 0.11).multiplyScalar(rng.range(0.7, 1.2)).lerp(new THREE.Color(0.42, 0.34, 0.24), rng() * 0.35).multiplyScalar(more ? 0.3 : 1);     // (they take the sun the wall keeps off them: darker to stand in its shade)
    clods.setColorAt(k, c); k++;
  }
  clods.count = k; clods.instanceMatrix.needsUpdate = true; if (clods.instanceColor) clods.instanceColor.needsUpdate = true; clods.frustumCulled = false; group.add(clods);
  return { group, triangles: 4 * g.instanceCount + k * 20 };
}

// ---------------------------------------------------------------- red-oat grass: the long grass of the plain, thigh-deep either side of the beaten way
// One upright card per tuft, turned about its root to face the lens (two triangles), drawn as three ranks of arching stems with drooping
// rust seed heads. Against the low sun the heads and upper stems glow; gusts run across it in bands.
async function buildOats(ctx, Y, land, hero, W, surf, G, look, flanks) {
  const rng = ctx.rng.fork('oats'), U = hero.uniforms, detail = ctx.quality?.detail ?? 1, L = Y.L;
  const gA = [], gB = [], want = Math.round(9100 * detail), landS = Y.sLip + 150, exitS = L + 30 - (Y.sBar - 10);
  for (let tries = 0; gA.length / 4 < want && tries < want * 7; tries++) {
    if ((tries & 127) === 0) await ctx.yield();
    const s = rng() < landS / (landS + exitS) ? rng.range(-150, landS - 150) : rng.range(Y.sBar - 10, L + 30), sd = rng.chance(0.5) ? 1 : -1, lat = sd * (s > Y.sBar - 14 && rng.chance(0.5) ? 1.4 + 9 * Math.pow(rng(), 1.3) : 1.5 + 44 * Math.pow(rng(), 2.1));
    G.at(s); const x = G.v.x - G.t.z * lat, z = G.v.z + G.t.x * lat, q = land.sample(x, z);
    const exit = s > Y.sBar - 14;
    if (q.kind === 1 || q.wall || (q.hw < 30 && (exit ? q.lat > q.hw + 1.2 && q.lat < q.hw + 3 : q.lat < q.hw + 2.2)) || (q.kind === 2 && q.dI < 13) || (s > L - 12 && Math.abs(lat) < 7)) continue;
    const eN = sstep(36, 96, q.s), vArm = (1 - sstep(2.2, 4.4, Math.abs(q.lat - lerp(17.5, 4.5, sstep(48, 84, q.s))))) * sstep(6, 14, q.s) * (1 - sstep(76, 90, q.s));      // where the two arms of the herd stand as we come in, the grass is trodden short
    const beaten = Math.max(1 - sstep(lerp(0.3, 1.4, eN), lerp(0.9, 4.4, eN), q.lat), q.trO, trailAt(q.s, q.side * q.lat)), keep = (1 - beaten) * (0.45 + 0.55 * sstep(-0.3, 0.25, ctx.noise.n2(x * 0.045, z * 0.045)));
    const band = 1 - sstep(13, 19, Math.min(flanks[0].near(x, z).d, flanks[1].near(x, z).d));                      // where the flanking lines run the grass is trodden short
    if (rng() > keep * (1 - 0.45 * band)) continue;
    const y = surf(x, z); if (y < W + 0.5) continue;
    const tall = sstep(3.5, 12, q.lat) * (1 - 0.7 * q.trO) * (0.3 + 0.7 * sstep(10, 50, s)) * (exit && q.hw < 30 && q.lat < q.hw + 1.2 ? 0.35 : 1) * (1 - 0.7 * band);      // short where the first lines stand, and on the exit's floor
    gA.push(x, y - 0.03, z, lerp(0.42, 1.0, tall) * rng.range(0.75, 1.3) * (1 - 0.5 * vArm)); gB.push(rng(), rng(), rng.range(1.5, 2.5), rng.range(0.75, 1.15));
  }
  // where we come in the way is not yet beaten wide: red oats stand full height close on both hands, their heads in the bottom of the picture
  for (let i = 0; i < Math.round(300 * detail); i++) {
    const s = rng.range(5, 72), sd = rng.chance(0.5) ? 1 : -1, lat = sd * (1.9 + 6.5 * Math.pow(rng(), 1.4) + 1.6 * sstep(40, 72, s)); G.at(s);
    const x = G.v.x - G.t.z * lat, z = G.v.z + G.t.x * lat, y = surf(x, z); if (trailAt(s, lat) > 0.3) continue;
    gA.push(x, y - 0.03, z, lerp(0.8, 1.05, sstep(1.9, 4, Math.abs(lat))) * rng.range(0.8, 1.2) * (1 - 0.4 * sstep(50, 72, s))); gB.push(rng(), rng(), rng.range(1.5, 2.5), rng.range(0.75, 1.15));
  }
  // grazed, trodden clumps on the beaten way itself: along the narrow track we come in by, and thick over the wide trampled mouth of the gully
  // (the ground under the lens there is stubble and broken oat clumps, not bare earth)
  { const rc = ctx.rng.fork('clumps');
    for (let i = 0; i < Math.round(760 * detail); i++) {
      const s = rc.range(-6, 86), lat = (rc.chance(0.5) ? 1 : -1) * (0.55 + 5.2 * Math.pow(rc(), 1.2)); G.at(s);
      const x = G.v.x - G.t.z * lat, z = G.v.z + G.t.x * lat; if (trailAt(s, lat) > 0.45) continue;
      gA.push(x, surf(x, z) - 0.02, z, rc.range(0.16, 0.34) * lerp(0.8, 1.25, sstep(1, 3.5, Math.abs(lat)))); gB.push(rc(), rc(), rc.range(0.32, 0.7), rc.range(0.7, 1.05));
    }
    for (let i = 0, n = 0; n < Math.round(1900 * detail) && i < 9000; i++) {
      if ((i & 127) === 0) await ctx.yield();
      const s = rc.range(Y.sGully - 50, Y.sGully + 27), lat = (rc.chance(0.5) ? 1 : -1) * (0.4 + 10.6 * Math.pow(rc(), 1.25)); G.at(s);
      const x = G.v.x - G.t.z * lat, z = G.v.z + G.t.x * lat, q = land.sample(x, z);
      if (q.kind !== 0 || q.wall || Math.abs(lat) > q.hw - 0.7) continue;
      gA.push(x, surf(x, z) - 0.02, z, rc.chance(0.3) ? rc.range(0.38, 0.56) : rc.range(0.14, 0.34)); gB.push(rc(), rc(), rc.range(0.3, 0.75), rc.range(0.7, 1.05)); n++;
    }
  }
  await ctx.yield();
  const g = new THREE.InstancedBufferGeometry();
  g.setIndex([0, 1, 2, 0, 2, 3]); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setAttribute('gA', new THREE.InstancedBufferAttribute(new Float32Array(gA), 4)); g.setAttribute('gB', new THREE.InstancedBufferAttribute(new Float32Array(gB), 4));
  g.instanceCount = gA.length / 4;
  const green = look.grass, mixC = (a, b) => new THREE.Color(a[0], a[1], a[2]).lerp(new THREE.Color(b[0], b[1], b[2]), green * 0.6);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uRoot: { value: mixC([0.13, 0.09, 0.045], [0.08, 0.11, 0.04]) }, uTip: { value: mixC([0.5, 0.37, 0.16], [0.34, 0.4, 0.15]) }, uHead: { value: mixC([0.52, 0.2, 0.085], [0.5, 0.26, 0.1]) } },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 gA, gB; uniform float uTime; uniform vec3 uWind, uCamL, uSun;
      varying vec2 vUv; varying vec4 vK; varying float vCs, vGu;
      ${CLOUD_GLSL}
      void main(){
        vec3 toC = uCamL - gA.xyz; float dist = max(length(toC), .01); vec2 d = toC.xz / max(length(toC.xz), .01);
        float hgt = gA.w * smoothstep(.9, 2.6, dist) * (1. - smoothstep(95., 135., dist));          // none slaps the lens; far off it sinks into the plain's own colour
        vec3 p = gA.xyz + vec3(d.y, 0., -d.x) * position.x * gB.z + vec3(0., position.y * hgt, 0.);
        float gust = .5 + .5 * sin(uTime * 1.3 - dot(gA.xz, uWind.xz) * .2 + sin(dot(gA.xz, vec2(.07, -.05))) * 2.) + .25 * sin(uTime * 4.7 + gB.x * 40.);      // gusts cross the grass in bands thirty metres apart
        p.xz += uWind.xz * uv.y * uv.y * (.1 + .42 * gust * gust) * hgt; p.y -= uv.y * uv.y * .1 * gust * gust * hgt;
        vUv = uv; vK = vec4(gB.x, gB.y, gB.w, max(dot(-toC / dist, uSun), 0.)); vCs = cloudSun(gA.xz); vGu = gust * gust * sign(dot(uWind.xz, vec2(d.y, -d.x)) + 1e-4);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = hgt > .02 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uGndC, uRoot, uTip, uHead; varying vec2 vUv; varying vec4 vK; varying float vCs, vGu;
      ${GLSL_COMMON}
      // one rank of stems: x = mask, y = that stem's hash, z = height along the stem, w = seed head
      vec4 rank(vec2 uv, float n, float sd, float aa, float top){
        float fx = uv.x * n + sd * 13.7, c = floor(fx), f = fract(fx) - .5, h = h11(c + sd * 91.);
        float hgt = (.4 + .6 * h) * top, lean = (h11(c * 1.7 + 3. + sd * 7.) - .5) * 3.4, v = uv.y / max(hgt, .05), oat = step(.3, h);
        float x = f - lean * v * v * .5 - lean * oat * smoothstep(.6, 1., v) * .4;                                     // each blade arches its own way, and the head hangs over
        float hd = oat * smoothstep(.62, .72, v) * (1. - smoothstep(.93, 1., v));
        float w = (.06 + .04 * h) * pow(max(1. - v, 0.), .55) + aa + hd * (.05 + .13 * abs(sin(v * 47. + h * 30.)));      // spikelets down the head
        return vec4(step(abs(x), w) * step(v, 1.), h, v, hd);
      }
      void main(){
        float aa = min(fwidth(vUv.x) * 9., .16);
        float bnd = ((vK.y - .5) * .34 + clamp(vGu, -1.3, 1.3) * .17) * vUv.y * vUv.y;      // the tuft arches as one, its own way and over with the gust; each rank a little differently
        vec2 u1 = vUv + vec2(bnd, 0.), u2 = vUv + vec2(.31 + bnd * .45, 0.), u3 = vUv + vec2(.67 + bnd * 1.5, 0.);
        float edge = 1. - smoothstep(.36, .5, abs(u1.x - .5));                       // the card's ends are short: a tuft, not a hedge
        vec4 a = rank(u1, 26., vK.x, aa, .55 + .45 * edge), b = rank(u2, 19., vK.y + .5, aa, (.5 + .5 * edge) * .86), c = rank(u3, 35., vK.x + vK.y, aa, .5);
        float m = max(a.x, max(b.x, c.x)); if (m < .5) discard;
        vec4 k = a.x > .5 ? a : b.x > .5 ? b : c;
        float h = k.y, vb = k.z, head = k.w;
        vec3 alb = mix(uRoot, uTip * (.62 + .5 * h) * mix(vec3(1.), vec3(.8, .95, .62), step(.72, fract(vK.x * 5.3 + h * .3))), smoothstep(0., .75, vb)) * vK.z;       // some tufts still olive at the root
        alb = mix(alb, uHead * (.8 + .5 * h), head * .9);
        float glow = vK.w * vK.w * (.25 + .75 * vb);                                 // seen against the sun the stems are lit through
        vec3 col = alb * (uSunC * (.14 + .46 * vb + .3 * head) * (.6 + .4 * h) * (1. + 2.2 * glow) * vCs + mix(uGndC, uSkyC, .3 + .6 * vUv.y) * (.42 + .58 * vb));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { mesh, triangles: 2 * g.instanceCount };
}

// ---------------------------------------------------------------- the gully walls: cut earth standing in front of the terrain's smooth ramps
// Two ribbons per gully (entry and exit): near-vertical faces with strata beds that stand proud, erosion flutes, a band polished by
// shoulders, a broken overhanging turf lip and a rim that lies back onto the plain. Roots hang on them; dust trickles down them.
async function buildWalls(ctx, Y, land, hero, W, G, look) {
  const rng = ctx.rng.fork('walls'), nz = ctx.noise, U = hero.uniforms, L = Y.L, group = new THREE.Group(), detail = ctx.quality?.detail ?? 1;
  const sun = U.uSun.value, sl = Math.max(1e-3, Math.hypot(sun.x, sun.z)), tanEl = sun.y / sl;
  const RGB = (r, g, b) => new THREE.Color(r, g, b), cOchre = RGB(0.36, 0.2, 0.105), cRed = RGB(0.3, 0.115, 0.06), cPale = RGB(0.55, 0.43, 0.27), cSoil = RGB(0.05, 0.035, 0.025), cTurf = RGB(0.3, 0.24, 0.13), c = new THREE.Color();
  const bed = (y) => sstep(-0.15, 0.35, nz.n2(7.7, y * 0.5));                                   // hard (red) beds stand proud
  const relief = (s, y, sd) => { const band = Math.exp(-(((y - 1.25) / 0.45) ** 2)); return (0.5 * clamp(0.6 * nz.ridged2(s * 0.12 + sd * 17, y * 0.03 + 3.1, 2) + 0.5 * bed(y), 0, 1) * (1 - 0.75 * band) + 0.1 * band) * sstep(0.1, 1.0, y); };
  const VH = [-0.3, 0, 0.07, 0.15, 0.25, 0.37, 0.5, 0.63, 0.76, 0.87, 0.95, 1.0], NR = VH.length + 2;
  const pos = [], col = [], dat = [], idx = [], cols = [];
  let base = 0;
  const run = async (s0, s1, dress) => {
    const list = [];
    for (let s = s0; s <= s1; s += 1.25) {
      if ((list.length & 15) === 0) await ctx.yield();
      G.at(s); const cx = G.v.x, cz = G.v.z, tx = G.t.x, tz = G.t.z, floor = Y.pathY(s) - 1.5, o = { s, cx, cz, tx, tz, floor, side: [] };
      for (const sd of [-1, 1]) {
        const q = land.sample(cx - tz * sd * 4, cz + tx * sd * 4), hw = q.hw; let H = 0, eT = 0;
        if (hw < 30) { const far = hw + 2.4 + 3.8, h = land.sample(cx - tz * sd * far, cz + tx * sd * far).h; H = Math.max(0, h - floor) * sstep(s0, s0 + 4, s) * (1 - sstep(s1 - 4, s1, s)); eT = 2.4 + Math.max(0, H - 1.3) / 2.7 + 0.3; }
        o.side.push({ sd, hw: Math.min(hw, 30), H, eT });
      }
      list.push(o);
    }
    // the gully changes along its length: every twenty to thirty metres, from a stream of its own, one wall carries something of its
    // own: a side cut where a gutter has broken the rim down (on the rim the sun comes over, so its light breaks in on the wall opposite),
    // a block that has slumped to the foot of the face, a curtain of roots, a dead thorn fallen over the lip
    if (dress) {
      const rr = ctx.core.makeRng(ctx.core.hashSeed('gully-reach:' + ctx.seed)), order = [0, 1, 2, 3];
      for (let i = 3; i > 0; i--) { const j = Math.floor(rr() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
      const m = list[list.length >> 1], sunSd = (sun.x * -m.tz + sun.z * m.tx) > 0 ? 1 : 0;
      for (let sc = s0 + rr.range(26, 34), n = 0; sc < s1 - 14; sc += rr.range(20, 30), n++) {
        const kind = order[n % 4], sd = kind === 0 ? sunSd : rr.chance(0.5) ? 0 : 1, half = rr.range(3.4, 4.8) * (kind === 2 ? 1.7 : 1), seed = rr();
        let best = null;
        for (const o of list) {
          const k = 1 - sstep(half * 0.4, half, Math.abs(o.s - sc)), w = o.side[sd]; if (k <= 0 || w.H < 1.7) continue;
          if (kind === 0) w.H *= 1 - 0.58 * k; else if (kind === 1) w.slumpK = k; else if (kind === 2) w.rootK = k;
          else if (!best || Math.abs(o.s - sc) < Math.abs(best.s - sc)) best = o;
        }
        if (best) best.side[sd].thorn = seed + 0.001;
      }
    }
    for (const sd of [0, 1]) {
      const r0 = base;
      for (let i = 0; i < list.length; i++) {
        if ((i & 7) === 0) await ctx.yield();                     // a few columns of the wall at a time
        const o = list[i], w = o.side[sd], op = o.side[1 - sd], sgn = w.sd, nx = -o.tz * sgn, nz2 = o.tx * sgn, H = w.H;
        // where the sun clears the opposite rim on this wall (only the wall facing the sun is ever lit)
        const sinAz = Math.max(0.25, Math.abs((sun.x * nx + sun.z * nz2) / sl)), line = op.H - ((w.hw + op.hw) * tanEl) / sinAz;
        w.line = line;
        for (let r = 0; r < NR; r++) {
          let y, e, kind = 0, ao = 1;
          if (r < VH.length) {
            y = VH[r] * H; e = -0.1 + 0.1 * Math.max(0, y) + relief(o.s, o.floor + y, sgn) * Math.min(1, H / 1.5);
            // slumped blocks: here and there the face has let go and lies as a heap at its own foot, a scar hollowed out above it
            { const sl = Math.max(sstep(0.18, 0.5, nz.n2(o.s * 0.19 + sgn * 31, 4.4)), 1.7 * (w.slumpK || 0)) * Math.min(1, H / 2), v = VH[r]; e += sl * (0.55 * sstep(0.3, 0.6, v) * (1 - sstep(0.8, 0.95, v)) - 0.8 * (1 - sstep(0.05, 0.3, v)) * sstep(-0.2, 0.02, v)); }
            if (r === VH.length - 2) e -= 0.3 * (0.4 + 0.6 * (0.5 + 0.5 * nz.n2(o.s * 0.8, sgn * 5.5))) * Math.min(1, H / 2);       // the lip overhangs
            if (r === VH.length - 1) e += 0.05;
            ao = 0.5 + 0.5 * sstep(0, 0.35, VH[r]); if (r === VH.length - 3) ao = 0.6;
          } else {
            const k = r - VH.length; e = w.eT + (k ? 1.7 : 0.15); kind = 1;
            const hx = o.cx + nx * (w.hw + e), hz = o.cz + nz2 * (w.hw + e); y = Math.max(H, land.sample(hx, hz).h - o.floor) + (k ? -0.25 : 0.07);
          }
          const x = o.cx + nx * (w.hw + e), z = o.cz + nz2 * (w.hw + e), wy = o.floor + y;
          pos.push(x, wy, z);
          const ws = wy + 1.1 * nz.n2(x * 0.035, z * 0.035), b = nz.n2(7.7, ws * 0.5);
          c.copy(cOchre).lerp(cRed, clamp(0.45 + 0.75 * b, 0, 1)); c.lerp(cPale, 0.22 * Math.max(0, 1 - Math.abs(ws - 7.4) / 0.8)); c.lerp(cSoil, 0.3 * Math.max(0, 1 - Math.abs(ws - 5.1) / 0.3));
          c.multiplyScalar(0.85 + 0.3 * nz.n2(x * 0.5, wy * 0.6 + z * 0.5));
          if (kind === 0) c.lerp(cSoil, 0.85 * sstep(H - 0.7, H - 0.15, y)); else c.copy(cTurf).multiplyScalar(0.7 + 0.4 * nz.n2(x * 0.4, z * 0.4));
          col.push(c.r, c.g, c.b); dat.push(ao, y, line, kind);
        }
      }
      for (let i = 0; i < list.length - 1; i++) for (let r = 0; r < NR - 1; r++) {
        const a = r0 + i * NR + r, b = a + NR;
        if (sd === 0) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
      }
      base += list.length * NR;
    }
    cols.push(list);
  };
  await run(Y.sGully - 22, Y.sLip - 0.5, true); await run(Y.sBar - 4, L + 9, false);
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aData', new THREE.Float32BufferAttribute(dat, 4));
  g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 aData; varying vec3 vW, vN, vCol; varying vec4 vData;
      void main(){ vW = position; vN = normal; vCol = color; vData = aData; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uCamL, uDustLit; uniform float uShade;
      varying vec3 vW, vN, vCol; varying vec4 vData;
      ${GLSL_COMMON}
      float clod(vec3 p, float top){ return vn3(p * vec3(1.5, 2.6, 1.5)) * .6 + vn3(p * 5.3) * .3 + vn3(p * 13.) * .12 + (.25 * sin(p.y * 9. + vn2(p.xz * .4) * 5.) + .5 * vn2(vec2(p.x * 1.4 + p.z * .6, p.y * .13))) * (1. - top); }
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), p = vW; if (!gl_FrontFacing) N = -N;
        float top = max(smoothstep(.55, .85, N.y), vData.w), e = .1, y = vData.y, face = 1. - top;
        float polish = exp(-((y - 1.2) / .45) * ((y - 1.2) / .45)) * face;                             // the band rubbed smooth and dark by shoulders
        vec2 ta = p.xz;                 // the ground plan under the face: every pattern below is read off the earth itself, so a bulge in the face cannot bend it
        // the beds the flood cut through: each stands proud by its hardness. Where a hard bed sits on a soft one its top is a ledge that
        // takes the light; where a soft one sits under a hard one it is an undercut, dark
        // (the beds waver and break: each runs a few metres as a ledge, then is lost in the face, and a slumped scar wipes them out)
        float slump = smoothstep(.56, .74, vn3(vec3(ta.x * .19, p.y * .3 + 2., ta.y * .19)));
        float sy = p.y * 1.7 + (vn2(ta * .11 + 3.) - .5) * 2.4 + (vn2(ta * .43 + 7.) - .5) * 1.1 + (vn3(vec3(ta.x * .9, p.y * .6, ta.y * .9)) - .5) * .5, bi = floor(sy), bf = sy - bi, fw = fwidth(sy);
        float brk = smoothstep(.42, .62, vn2(ta * .27 + vec2(bi * 7.3, bi * 3.1)));
        float crisp = (1. - smoothstep(.25, .8, fw)) * face * (1. - .85 * polish) * brk * (1. - .85 * slump), hb = h21(vec2(bi, 5.3)), stp = h21(vec2(bi + 1., 5.3)) - hb;
        float edge = smoothstep(.45, 1., bf) * (1. - smoothstep(1. - max(.08, fw), 1., bf) * .5), ledge = edge * max(-stp, 0.) * crisp * .8, under = edge * max(stp, 0.) * crisp * .9;
        ledge = min(ledge, 1.); under = min(under, 1.);
        float h0 = clod(p, top); vec3 g = vec3(clod(p + vec3(e, 0., 0.), top), clod(p + vec3(0., e, 0.), top), clod(p + vec3(0., 0., e), top)) - h0;
        g = g / e; g -= N * dot(g, N); N = normalize(N - g * mix(.55, .16, top) * (1. - .8 * polish));
        N = normalize(N + vec3(0., 1., 0.) * (ledge * 1.6 - under * 1.0));
        vec3 alb = vCol * (.78 + .44 * vn3(p * vec3(.9, 3., .9)));
        alb *= mix(vec3(1.), (.88 + .24 * mix(hb, hb + stp, smoothstep(.55, 1., bf))) * mix(vec3(1.05, .97, .88), vec3(.95, 1., 1.06), mix(h21(vec2(bi, 1.7)), h21(vec2(bi + 1., 1.7)), smoothstep(.55, 1., bf))), face * (1. - polish) * (.35 + .65 * brk));     // bed by bed, where a bed shows
        alb = mix(alb, alb * vec3(1.22, .96, .8) * (.9 + .3 * vn3(p * 2.3)), slump * face * (1. - polish) * .7);          // a fresh scar: raw red earth
        { float pv = clamp((y - 2.3 - (vn2(ta * .21 + 5.) - .5) * 1.3) / .16, -6., 6.), pb = exp(-pv * pv) * smoothstep(.35, .6, vn2(ta * .33 + 8.));
          alb = mix(alb, vec3(.6, .53, .44) * (.65 + .6 * h21(floor(p.xz * 23.) + floor(p.y * 23.))), smoothstep(.62, .74, vn3(p * 7.)) * pb * face * .85 * (1. - slump)); }      // a pebble band, wavering and broken
        alb *= 1. - .3 * smoothstep(.5, .9, vn3(vec3(ta.x * 2.2, p.y * .22, ta.y * 2.2))) * face;                             // drip streaks
        alb = mix(alb, vec3(.56, .5, .42) * (.7 + .5 * h21(floor(p.xz * 31.))), smoothstep(.86, .93, vn3(p * 8.5)) * face * .7 * (1. - polish));   // pebbles in the earth
        alb *= (1. - .5 * under) * (1. + .3 * ledge);                                     // dust lies pale on the ledges
        alb = mix(alb, alb * vec3(.6, .55, .5), polish * .85);
        alb *= mix(1., (.75 + .5 * vn2(p.xz * 9.)), top);
        float ndl = dot(N, uSun), dif = max(ndl, 0.) * .85 + .15 * (ndl * .5 + .5);
        float sunV = mix(1., smoothstep(-.5, .5, y - vData.z), 1. - vData.w);
        float unlit = 1. - sunV * smoothstep(.0, .4, ndl);                 // in the other wall's shadow, or turned from the sun: the fill is the lit ground and the lit wall opposite
        vec3 V = normalize(uCamL - p + vec3(0., 1e-5, 0.)), Hh = normalize(uSun + V);
        vec3 col = alb * (uSunC * dif * sunV * .66 + mix(uGndC, uSkyC, N.y * .5 + .5) * vData.x + uSunC * vec3(.36, .24, .14) * (.3 + .72 * (1. - uShade)) * unlit * (.45 + .55 * vData.x) + uDustLit * .34 * uShade * (.4 + .6 * vData.x)
          + uSkyC * .32 * unlit * (1. - uShade));        // out of the gully's dust the shaded wall takes the open sky and the lit ground: earth, never a black hole
        col += uSunC * pow(max(dot(N, Hh), 0.), 14.) * .05 * polish * sunV + uSkyC * polish * .04;
        col += alb * (uSkyC * .3 + uSunC * .16 * sunV + uDustLit * .22 * uShade) * ledge;                        // the ledges' upper edges take the light
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; group.add(mesh);
  return { group, cols, relief, triangles: idx.length / 3, VH };
}
// roots as thick as an arm hanging from the lip and hugging the face, a dark fringe of grass along the rim, earth trickling down
async function buildWallDress(ctx, Y, hero, WL) {
  const rng = ctx.rng.fork('dress'), rm = ctx.rng.fork('mats'), U = hero.uniforms, group = new THREE.Group(), detail = ctx.quality?.detail ?? 1;
  const g = new F.Geo(), cA = new THREE.Color(0.17, 0.105, 0.058), cB = new THREE.Color(0.085, 0.055, 0.032), fringe = [], falls = [];
  const face = (o, w, y) => w.hw - 0.1 + 0.1 * Math.max(0, y) + WL.relief(o.s, o.floor + y, w.sd) * Math.min(1, w.H / 1.5);
  const P = (o, w, lat, y, along) => [o.cx - o.tz * w.sd * lat + o.tx * along, o.floor + y, o.cz + o.tx * w.sd * lat + o.tz * along];
  // a curtain of roots (a reach of wall where rootK is set, see buildWalls): the wall's own mats and roots are dealt there as on any other
  // reach, from the wall's streams; the curtain's are added after them from a stream of its own, as many as its strength k asks at each
  // column: 1.6 k times as many mats again as the wall's own step gives, 2.2 k times as many roots, each root up to half as long again
  const rc = ctx.core.makeRng(ctx.core.hashSeed('root-curtain:' + ctx.seed));
  for (const list of WL.cols) for (const si of [0, 1]) {
    let nextRoot = rng.range(0, 3), nextFall = rng.range(0, 6), nextMat = rm.range(0, 2), curMat = rc(), curRoot = rc();
    for (let i = 0; i < list.length; i++) {
      if ((i & 31) === 31) await ctx.yield();                    // a stretch of wall at a time
      const o = list[i], w = o.side[si], H = w.H;
      if (H > 0.5) for (let k = 0; k < 2; k++) if (k === 0 || i % 2) {                                   // the fringe: two tufts a column, on the lip and just behind it
        const e = w.eT * (k ? 0.75 : 0.3) + (k ? 0 : -0.25) + rng.range(-0.15, 0.15), al = rng.range(-0.45, 0.45), p = P(o, w, face(o, w, H) + Math.max(0, e), H * (k ? 1 : 0.97) + (k ? 0.05 : 0), al);
        const ragged = p[0] > 40;                                 // on the exit's knoll the rim is broken tufts, not a thatch
        if (ragged && rng.chance(0.45)) continue;
        fringe.push([p[0], p[1] - 0.05, p[2], rng.range(0.75, 1.3) * Math.min(1, 0.4 + H / 3) * (ragged ? rng.range(0.45, 1.0) : 1), Math.atan2(-o.tx * w.sd, o.tz * w.sd) + (ragged ? rng.range(-0.9, 0.9) : 0)]);
      }
      if (H < 1.7) continue;
      const mat = (R) => {                                        // a mat of fine rootlets hanging out of the turf under the lip
        const a0 = R.range(-0.4, 0.4), nH = R.int(5, 8);
        for (let k = 0; k < nH; k++) {
          const al = a0 + R.range(-0.45, 0.45), len = R.range(0.25, 1.0) * Math.min(1, H / 2.4), wdt = R.range(0.006, 0.012), y0 = H - R.range(0.02, 0.3), drift = R.range(-0.12, 0.12), c = k % 2 ? cA : cB;
          let pa = -1, pb = -1;
          for (let j = 0; j <= 2; j++) {
            const u = j / 2, y = y0 - len * u, ww = wdt * (1 - 0.7 * u), aa = al + drift * u * u, lt = face(o, w, y) - 0.035 - 0.05 * Math.sin(u * 3.1);
            const A = P(o, w, lt, y, aa - ww), Bq = P(o, w, lt, y, aa + ww), ia = g.v(A[0], A[1], A[2], c), ib = g.v(Bq[0], Bq[1], Bq[2], c);
            g.g[ia] = g.g[ib] = sstep(-0.5, 0.5, y - w.line);
            if (j) g.quad(pa, pb, ib, ia);
            pa = ia; pb = ib;
          }
        }
      };
      if (--nextMat <= 0) { nextMat = rm.range(1.0, 2.6) / Math.sqrt(detail); mat(rm); }
      const root = (R, longer) => {
        // a root as thick as an arm: over the lip, then down the face in one smooth tapering curve, with a fork and a few rootlets
        const len = Math.min(H - 0.5, R.range(1.6, 4.2) * longer), r0 = R.range(0.07, 0.125), wob = R.range(-0.8, 0.8), ph = R() * 6.283, ph2 = R() * 6.283, NS = 7;
        const along = (u) => wob * u * u * (3 - 2 * u) + 0.13 * Math.sin(u * 5 + ph) * u + 0.04 * Math.sin(u * 12 + ph2) * u;
        const rad = (u) => r0 * (1 - 0.82 * Math.pow(u, 0.8)) + 0.006;
        const at = (u) => { const y = H + 0.14 - (len + 0.14) * u, over = Math.max(0, 1 - u / 0.1); return P(o, w, face(o, w, Math.min(y, H * 0.94)) - rad(u) * 0.8 - 0.13 * Math.sin(Math.min(1, u * 1.5) * Math.PI) * (1 - over) + 0.42 * over * over, y - 0.05 * over, along(u)); };
        const sunAt = (px, py) => sstep(-0.5, 0.5, py - o.floor - w.line);
        const pts = [], rr = []; for (let j = 0; j <= NS; j++) { pts.push(at(j / NS)); rr.push(rad(j / NS)); }
        g.glow(g.tube(pts, rr, 4, cA, cB), sunAt);
        if (len > 2.2) {                                                            // a fork that wanders off along the face
          const u0 = R.range(0.28, 0.5), dir = R.chance(0.5) ? 1 : -1, fl = R.range(0.9, 1.7), y0 = H + 0.14 - (len + 0.14) * u0, fp = [], fr = [];
          for (let j = 0; j <= 5; j++) { const u = j / 5, y = Math.max(0.3, y0 - fl * u * (0.55 + 0.45 * u)); fp.push(P(o, w, face(o, w, y) - rad(u0) * 0.5 - 0.05, y, along(u0) + dir * fl * 0.6 * u * (2 - u) * 0.6)); fr.push(rad(u0) * 0.72 * (1 - 0.85 * u) + 0.005); }
          g.glow(g.tube(fp, fr, 3, cA, cB), sunAt);
        }
        for (let k = 0, nk = R.int(2, 3); k < nk; k++) {                           // rootlets
          const u0 = R.range(0.3, 0.9), dir = R.chance(0.5) ? 1 : -1, fl = R.range(0.35, 0.8), y0 = H + 0.14 - (len + 0.14) * u0, fp = [], fr = [];
          for (let j = 0; j <= 3; j++) { const u = j / 3, y = Math.max(0.2, y0 - fl * u * (0.7 + 0.3 * u)); fp.push(P(o, w, face(o, w, y) - 0.03, y, along(u0) + dir * fl * 0.5 * u)); fr.push(Math.max(0.006, rad(u0) * 0.4 * (1 - 0.8 * u))); }
          g.glow(g.tube(fp, fr, 3, cA, cB), sunAt);
        }
      };
      if (--nextRoot <= 0) { nextRoot = rng.range(1.9, 3.9) / Math.sqrt(detail); root(rng, 1); }
      if (w.rootK) {
        if ((curMat -= 1.6 * w.rootK) <= 0) { curMat += rc.range(1.0, 2.6) / Math.sqrt(detail); mat(rc); }
        if ((curRoot -= 2.2 * w.rootK) <= 0) { curRoot += rc.range(1.9, 3.9) / Math.sqrt(detail); root(rc, 1 + 0.5 * w.rootK); }
      }
      if (w.thorn) {                                                // a dead thorn fallen over the lip: its trunk still on the rim, its bare crown hanging down the face
        const tr = ctx.core.makeRng(ctx.core.hashSeed('rim-thorn:' + ctx.seed + ':' + Math.round(o.s))), cD = new THREE.Color(0.12, 0.098, 0.076), cE = new THREE.Color(0.06, 0.048, 0.038);
        const sunAt = (px, py) => sstep(-0.5, 0.5, py - o.floor - w.line), a0 = tr.range(-0.5, 0.5), lean = tr.range(-0.7, 0.7), hang = Math.min(H - 0.9, tr.range(1.9, 2.8));
        const trunk = (u) => { const over = sstep(0.25, 0.55, u), y = H + 0.3 + 0.25 * Math.sin(u * 3.1) * (1 - over) - hang * over * u; return P(o, w, face(o, w, Math.min(y, H * 0.94)) + lerp(1.9, -0.45 - 0.3 * u, over), y, a0 + lean * u); };
        const tp = [], trr = []; for (let j = 0; j <= 6; j++) { tp.push(trunk(j / 6)); trr.push(0.085 * (1 - 0.6 * j / 6)); }
        g.glow(g.tube(tp, trr, 4, cD, cE), sunAt);
        for (let k = 0, nk = tr.int(10, 13); k < nk; k++) {
          const u0 = tr.range(0.45, 0.98), b = trunk(u0), dir = k % 2 ? 1 : -1, bl = tr.range(0.9, 2.3), drop = tr.range(0.1, 0.9), outw = tr.range(0.1, 0.6), bp = [], br = [];
          for (let j = 0; j <= 3; j++) { const u = j / 3; bp.push([b[0] + o.tx * dir * bl * u - (-o.tz * w.sd) * outw * u * u, b[1] - drop * u * u + 0.2 * Math.sin(u * 3.1), b[2] + o.tz * dir * bl * u - (o.tx * w.sd) * outw * u * u]); br.push(0.04 * (1 - 0.8 * u) + 0.006); }
          g.glow(g.tube(bp, br, 3, cD, cE), sunAt);
        }
      }
      if (--nextFall <= 0) { nextFall = rng.range(2.2, 5.8); const p = P(o, w, face(o, w, H * 0.9) - 0.25, H * 0.93, 0); falls.push([p[0], p[1], p[2], rng(), H * 0.93, rng.range(0.16, 0.3), rng.range(0.7, 1.3), rng()]); }
    }
  }
  // roots take the wall's own light: in the sun only where the wall is (aGlow), a tone darker than the earth behind them on both sides
  const rmat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute float aGlow; varying vec3 vN, vW, vC; varying float vSun;
      void main(){ vW = position; vN = normal; vC = color; vSun = aGlow; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uDustLit; uniform float uShade; varying vec3 vN, vW, vC; varying float vSun;
      ${GLSL_COMMON}
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
        vec3 alb = vC * (.72 + .5 * vn3(vW * vec3(9., 2.2, 9.)));                                  // bark drawn out along the root
        float ndl = dot(N, uSun), dif = max(ndl * .7 + .3, 0.);
        vec3 col = alb * (uSunC * dif * vSun * .8 + mix(uGndC, uSkyC, N.y * .5 + .5) * .8 + uSunC * vec3(.36, .24, .14) * .26 * (1. - vSun) + uDustLit * .3 * uShade);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  await ctx.yield();
  const roots = new THREE.Mesh(g.build(), rmat); roots.frustumCulled = false; group.add(roots);
  // earth trickling off the lips: a sliding dust streak and a few dark clods in it
  const n = falls.length * 3, fA = new Float32Array(n * 4), fB = new Float32Array(n * 4);
  falls.forEach((fl, i) => { for (let k = 0; k < 3; k++) { fA.set([fl[0], fl[1], fl[2], (fl[3] + k * 0.13) % 1], (i * 3 + k) * 4); fB.set([fl[4], fl[5], fl[6], k === 0 ? 0 : 0.5 + 0.5 * ((fl[7] + k * 0.37) % 1)], (i * 3 + k) * 4); } });
  const fg = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  fg.index = q.index; fg.setAttribute('position', q.attributes.position); fg.setAttribute('fA', new THREE.InstancedBufferAttribute(fA, 4)); fg.setAttribute('fB', new THREE.InstancedBufferAttribute(fB, 4)); fg.instanceCount = n;
  const fmat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 fA, fB; uniform float uTime; varying vec2 vUv; varying vec3 vK;
      void main(){
        float t = fract(uTime * fB.y + fA.w), H = fB.x, clodK = fB.w; vec3 p = fA.xyz; float a;
        vec3 right = normalize(vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]));
        vec3 up = normalize(vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]));
        if (clodK < .25) { p += right * position.x * (.3 + .25 * t) + vec3(0., (position.y - 1.) * H * .5, 0.); a = sin(t * 3.14159) * .42; }          // the streak down the face
        else { float tt = fract(t * 1.7 + clodK), sz = .05 + .07 * clodK; p.y -= H * tt * tt; p += right * ((clodK - .75) * .5 + position.x * sz) + up * position.y * sz; a = 1. - smoothstep(.85, 1., tt); }
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        vUv = position.xy; vK = vec3(clodK, a * smoothstep(1.5, 4., -mvPosition.z), t);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uDustLit, uDustShade; varying vec2 vUv; varying vec3 vK;
      ${GLSL_COMMON}
      ${GLSL_FOGMIX}
      void main(){
        float al; vec3 col;
        if (vK.x < .25) { float n = vn2(vec2(vUv.x * 2. + vK.z * 3., vUv.y * 3. + vK.z * 9.)); al = (1. - smoothstep(.2, 1., abs(vUv.x) + (n - .5) * .6)) * smoothstep(-1., -.6, vUv.y) * (1. - smoothstep(.2, 1., vUv.y + (1. - vK.z) * 1.6 - .8)) * (.4 + .6 * n); col = mix(uDustShade * 1.5, uDustLit * (.5 + .2 * uSunC), .55); }
        else { al = 1. - smoothstep(.5, 1., length(vUv)); col = uDustShade * .35 * (uSunC * .3 + uSkyC); }
        al *= vK.y;
        gl_FragColor = vec4(fogMix(col, FOGD) * al, al);
      }`,
  });
  const fmesh = new THREE.Mesh(fg, fmat); fmesh.frustumCulled = false; fmesh.renderOrder = 3.4; group.add(fmesh);
  return { group, fringe, triangles: roots.geometry.index.count / 3 + n * 2 };
}

// ---------------------------------------------------------------- the dust standing over our own gully and trailing the column
function buildDustBank(ctx, Y, hero) {
  const rng = ctx.rng.fork('bank'), U = hero.uniforms, list = [], v = new THREE.Vector3(), t = new THREE.Vector3(), detail = ctx.quality?.detail ?? 1;
  // dC = (strength, the distance within which it thins away (0: none), how flat it lies, which side of its mass it stands on: +1 the sun's)
  const put = (s, lat, y, size, rise, c = [1, 0, 1, 0]) => { Y.posAt(s, v); Y.tanAt(s, t); const il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)); list.push([v.x - t.z * il * lat, y, v.z + t.x * il * lat, rng(), size, rise, rng.range(0.018, 0.034), rng(), ...c]); };
  for (let i = 0; i < Math.round(52 * detail); i++) { const h = Math.pow(rng(), 1.3), sg = rng.range(Y.sGully - 26, Y.sLip - 8), lg = rng.gauss() * 9, sz = rng.range(8, 13) + 7 * h, rs = rng.range(8, 18); if (i % 3 === 0) put(sg, lg, 12 + 20 * h, sz * 0.8, rs); }      // a few billows over the gully: the sky stays open above it
  for (let i = 0; i < Math.round(22 * detail); i++) put(rng.range(26, Y.sGully), rng.gauss() * 5, 12.2 + rng.range(0, 2.5), rng.range(3.5, 6.5), rng.range(2, 5));
  for (let i = 0; i < Math.round(22 * detail); i++) { const sb = rng.range(-20, Y.sGully); Y.posAt(Math.max(0, sb), v); put(sb, rng.gauss() * 8, v.y - 0.6 + rng.range(0, 2.2), rng.range(3.5, 7), rng.range(2, 5)); }
  for (let i = 0; i < Math.round(14 * detail); i++) put(rng.range(Y.sExit, Y.L + 30), rng.gauss() * 6, Y.pathY(Y.sExit + 40) + rng.range(1, 5), rng.range(3.5, 6), rng.range(2, 5));
  // the knee-deep sheet over the trampled mouth of the gully: low wide billows the rear rank runs in
  { const rs = ctx.rng.fork('sheet'); for (let i = 0; i < Math.round(46 * detail); i++) { const s = rs.range(Y.sGully - 44, Y.sGully + 26); put(s, rs.gauss() * 5.5, Y.pathY(s) - 1.5 + rs.range(0.25, 0.6), rs.range(4, 7), rs.range(0.3, 0.9), [1.35, 0, 0.3, 0]); } }
  // the plume's own mass: billows standing along the axis of the hero's plume over the Fall (its foot to its head, leaning with the wind),
  // so that with it they are one gold column, bright on its sunward side, umber in its own shade. It is dust, not a wall: from a hundred
  // and seventy metres it thins, and by a hundred it is the haze we ride into.
  { const rp = ctx.rng.fork('pall'), pf = hero.anchors.plume, sx = U.uSun.value.x, sz = U.uSun.value.z, sl = 1 / Math.max(1e-4, Math.hypot(sx, sz)), ux = sx * sl, uz = sz * sl;
    for (let i = 0; i < Math.round(48 * detail); i++) {
      const h = Math.pow(rp(), 0.85), lat = rp.gauss() * (15 - 5 * h) + 9 * h * h, dep = rp.gauss() * 11;      // lat: toward the sun; dep: across it
      list.push([lerp(pf.base[0], pf.top[0], h) + ux * lat - uz * dep, pf.base[1] - 1 + 60 * h, lerp(pf.base[2], pf.top[2], h) + uz * lat + ux * dep, rp(), rp.range(15, 23) - 4 * h, rp.range(6, 14), rp.range(0.011, 0.019), rp(), 1.55, 96, 1, clamp(lat / 13, -1, 1)]);
    } }
  const n = list.length, dA = new Float32Array(n * 4), dB = new Float32Array(n * 4), dC = new Float32Array(n * 4);
  list.forEach((l, i) => { dA.set(l.slice(0, 4), i * 4); dB.set(l.slice(4, 8), i * 4); dC.set(l.slice(8, 12), i * 4); });
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('dA', new THREE.InstancedBufferAttribute(dA, 4)); g.setAttribute('dB', new THREE.InstancedBufferAttribute(dB, 4)); g.setAttribute('dC', new THREE.InstancedBufferAttribute(dC, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uBankA: { value: 0.34 } }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 dA, dB, dC; uniform float uTime, uBankA; uniform vec3 uSun, uWind;
      varying vec2 vUv; varying vec3 vK; varying vec2 vL2; varying float vSide, vPall;
      void main(){
        float lt = fract(uTime * dB.z + dA.w), sz = dB.x * (.7 + .6 * lt);
        vec3 p = dA.xyz + vec3(0., dB.y * lt, 0.) + uWind * lt * 7.;
        vec3 right = normalize(vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]));
        vec3 up = normalize(vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]));
        vec4 mvPosition = modelViewMatrix * vec4(p + right * position.x * sz + up * position.y * sz * dC.z, 1.);
        float a = sin(lt * 3.14159) * uBankA * smoothstep(sz * .8, sz * 2.6, -mvPosition.z) * dC.x;
        if (dC.y > 0.) a *= smoothstep(dC.y, dC.y * 1.8, -mvPosition.z);
        vL2 = vec2(dot(uSun, right), dot(uSun, up)); vUv = position.xy; vK = vec3(a, dB.w, lt); vSide = dC.w; vPall = dC.y > 0. ? 1. : 0.;
        gl_Position = a > .004 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uDustLit, uDustShade;
      varying vec2 vUv; varying vec3 vK; varying vec2 vL2; varying float vSide, vPall;
      ${GLSL_COMMON}
      ${GLSL_FOGMIX}
      void main(){
        float r = length(vUv), n = vn2(vUv * 1.6 + vK.y * 23. + vK.z * .5) * .6 + vn2(vUv * 3.9 - vK.y * 11.) * .4;
        float al = min((1. - smoothstep(.1, 1., r + (n - .5) * .85)) * vK.x, .96);
        float lit = clamp(dot(vUv, vL2) * .55 + .5 + (n - .5) * .3 + vSide * .42, 0., 1.);
        // the plume's own billows keep its two tones from the plain: those on the sun's side of the mass gold, the rest umber in its shade,
        // and the plain's haze takes of them only what it takes of the plume
        float lit2 = smoothstep(.2, .8, clamp(vSide * .8 + .3 + dot(vUv, vL2) * .42 + (n - .5) * .45, 0., 1.));
        vec3 col = mix(uDustShade * (1.3 + uSkyC * .8) * mix(1., .78, vPall), uDustLit * (.62 + .24 * uSunC) * mix(1., 1.3, vPall), mix(lit, lit2, vPall));
        gl_FragColor = vec4(fogMix(col, FOGD * mix(1., .55, vPall)) * al, al);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3.6;
  return { mesh, triangles: n * 2 };
}

// ---------------------------------------------------------------- the world
export default {
  id: 'mara-crossing',
  name: 'The Crossing',
  category: 'wilderness',
  weirdness: 0.02,
  media: ['open', 'water'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, vr = rng.fork('vary');
    // ---- which visit is this: hour and weather, season, cast, the rare slab
    const r0 = vr(), pickG = vr.pick(['golden', 'golden', 'storm', 'rains']), july = vr.chance(0.3), zebraCast = vr.chance(0.25);
    let lookId = r0 < 0.3 ? 'golden' : r0 < 0.44 ? 'rains' : r0 < 0.54 ? 'dusk' : r0 < 0.74 ? 'storm' : r0 < 0.84 ? 'dawn' : 'golden';
    if (vary.hour === 'dawn') lookId = 'dawn'; else if (vary.hour === 'day') lookId = 'noon'; else if (vary.hour === 'night') lookId = 'dusk'; else if (vary.hour === 'golden') lookId = pickG;
    const look = LOOKS[lookId], rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // ---- the hero: the Fall, at the origin of the world
    const hero = await buildHero(ctx, { palette: PAL, hour: look.hour, weather: look.weather, season: july ? 'july' : 'october', density: Math.min(density, 1.0) * 0.8, cast: zebraCast ? 'zebra' : undefined,
      swimTo: [8, 58.5], cycle: 27, duration: DUR });
    scene.add(hero.object);
    const U = hero.uniforms, W = hero.anchors.waterY, sunDir = new THREE.Vector3().fromArray(hero.anchors.sunDir).normalize();
    U.uHaze.value.set(look.horizon).multiplyScalar(0.8); if (lookId === 'storm') U.uHaze.value.lerp(C3(look.mid), 0.65); U.uSkyRef.value.set(look.mid).lerp(C3(look.zenith), 0.3);      // the river mirrors this visit's sky
    await ctx.yield();
    const Y = makeLayout(ctx, hero, W); await ctx.yield();
    const land = makeLand(ctx, Y, hero, W, look), path = Y.path;
    await ctx.yield();
    // ---- sky, light, fog
    const sky = makeSky({ rng, preset: 'day', zenith: look.zenith, mid: look.mid, horizon: look.horizon, ground: look.ground, horizonPow: lookId === 'storm' ? 6 : 5.5, sunDirection: sunDir, sunColor: look.sunC, sunSize: 1.6, sunIntensity: lookId === 'dusk' ? 5 : 10,
      scatterColor: look.horizon, scatter: lookId === 'storm' ? 0.06 : 0.4, clouds: { coverage: look.clouds, lit: look.cloudLit, shade: look.cloudShade, scale: 1.3, haze: lookId === 'storm' ? 0.08 : 0.3 }, clouds2: lookId === 'storm' || lookId === 'golden' ? false : { coverage: 0.3, stretch: 1, opacity: 0.5 },
      lightColor: C3(look.sunC).lerp(C3('#ffffff'), 0.2), lightIntensity: look.sunI, ambientColor: look.hemiSky, groundLight: look.hemiGnd, ambientIntensity: look.hemiI, fogColor: look.fog, lightElevationMin: 9 });
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky); scene.add(rig.object);
    const fogA = C3(look.fog), fogB = C3(look.gully).lerp(C3(look.fog), 0.18).multiplyScalar(0.98);      // the gully's dust: gold, bright, and thick enough to lose the far end of the gully in
    scene.fog = new THREE.FogExp2(fogA.clone(), look.fogK);
    await ctx.yield();
    // ---- terrain: the plain, the river's bed and banks, both gullies (kit quadtree mesh over our height function)
    const terrain = await T.makeTerrainAsync({ rng, noise: ctx.noise, height: land.height, path, corridor: false, bounds: [-600, -500, 500, 560],
      cell: 2.4, near: 30, levels: 5, refine: 2, maxTriangles: 43000, biome: 'meadow', color: land.color, sunDir, skirt: 30,
      palette: { rock: '#b08c64', rockB: '#9a6a48', rockSlope: [0.5, 0.74], strata: 0.5, strataScale: 5, patch: '#cbb68a', patchAmount: 0.25, tufts: 0.35, pebbles: 0.35, cracks: 0.15, clouds: 0.8, streaks: 0.2, detail: 0.35, bump: 0.3 } }, ctx.yield);
    scene.add(terrain.object);
    await ctx.yield();
    // the clouds' shadows: the land's own pattern, lent to everything of ours that stands on it (the herd, the grass, the beaten way)
    const CLOUD_SIZE = 330, CLOUD_K = 0.44, tCl = terrain.uniforms && terrain.uniforms.uTCloud ? terrain.uniforms.uTCloud.value : U.uTCloud.value;
    const cloudPlan = planClouds(ctx, CLOUD_SIZE);
    tCl.z = cloudPlan.z; tCl.w = CLOUD_K; U.uTCloud.value = tCl; U.tCloud.value = terrain.detailTexture || null;
    await ctx.yield();
    const cumulus = buildCumulus(ctx, hero, look); scene.add(cumulus);
    await ctx.yield();
    const water = buildWater(hero, W, look); scene.add(water);
    // ---- far land: the Oloololo escarpment on the right, low hills all round
    {
      const pos = [], col = [], idx = [], cA = C3('#6f7f9e').lerp(C3(look.horizon), 0.42), cB = C3('#7f8ca6').lerp(C3(look.horizon), 0.62), nz = ctx.noise;
      const ridge = (n, fx, top, base, c0, c1) => { const o = pos.length / 3; for (let i = 0; i <= n; i++) { const t = i / n, p = fx(t), h = top(t); pos.push(p[0], base, p[1], p[0], h, p[1]); col.push(c1.r, c1.g, c1.b, c0.r, c0.g, c0.b); if (i < n) { const a = o + i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); } } };
      ridge(140, (t) => [-3600 + 7200 * t, 2500 + 500 * Math.sin(t * 3.1)], (t) => 250 + 70 * nz.fbm2(t * 9, 1.5, 3) + 40 * nz.n2(t * 40, 2), -40, cA, cB);
      ridge(160, (t) => [Math.cos(t * 6.283) * 2100, Math.sin(t * 6.283) * 2100], (t) => 60 + 45 * nz.fbm2(Math.cos(t * 6.283) * 3, Math.sin(t * 6.283) * 3 + 9, 3), -40, cB, C3(look.horizon).lerp(cB, 0.5));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = -0.8; scene.add(m);
    }
    if (look.weather === 'storm') {
      const rg = new THREE.PlaneGeometry(4200, 620, 24, 1); rg.translate(0, 300, 0);
      const rm = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uC: { value: C3(look.mid).multiplyScalar(0.55) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.x += (p.y - 300.) * .22; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uC; varying vec2 vUv;
          ${GLSL_COMMON}
          void main(){ float st = vn2(vec2(vUv.x * 90., vUv.y * 2.2 + uTime * .12)) * .6 + vn2(vec2(vUv.x * 23., vUv.y * .8 + uTime * .05)) * .4;
            float top = .5 + .32 * vn2(vec2(vUv.x * 7., 3.)); float env = smoothstep(0., .14, vUv.x) * (1. - smoothstep(.78, 1., vUv.x)) * smoothstep(.0, .2, vUv.y) * (1. - smoothstep(top - .34, top, vUv.y)) * (.55 + .45 * vn2(vec2(vUv.x * 5., 1.)));
            gl_FragColor = vec4(uC * (.8 + .4 * st), env * (.45 + .4 * st)); }` });
      const rain = new THREE.Mesh(rg, rm); rain.position.set(-500, -20, 1900); rain.frustumCulled = false; rain.renderOrder = -0.6; scene.add(rain);
    }
    await ctx.yield();
    // ---- the herd
    U.uCut.value.set(Y.lip[0] + 0.5, Y.lip[2] - 2, 0, 0);                    // the cut bank we leap from: the water is dark under it
    const yawn = yawnPlace(Y, land, W, sunDir);
    const lunge = lungePlace(Y, land, W);
    const pois = [...plainGaze(Y, land), ...fallGaze(Y, hero, W, rare), rightGaze(Y, land, W, sunDir)];
    const herd = await buildHerd(ctx, Y, land, hero, W, { density: Math.min(density, 1.03), zebraCast, lunge });
    for (const m of herd.meshes) scene.add(m); scene.add(herd.trail); scene.add(herd.far); scene.add(herd.shadow);
    water.onBeforeRender = herd.camL; cumulus.onBeforeRender = herd.camL;
    await ctx.yield();
    // ---- plants
    const wind = FL.makeWind({ direction: [U.uWind.value.x, U.uWind.value.z || -0.4], strength: 1.1, speed: 1.1 });
    const trees = await buildTrees(ctx, Y, land, hero, W, wind); scene.add(trees.group);
    trees.group.traverse((o) => { if (o.isMesh && o.material.isShaderMaterial) o.onBeforeRender = herd.camL; });
    terrain.addContact(trees.pts.map((p) => [p.x, p.z, 3.2]).concat(trees.figs.map((f) => [f.x, f.z, 5]), [[trees.deadPos.x, trees.deadPos.z, 2.5]]), { strength: 0.45 });
    await ctx.yield();
    await ctx.yield();
    // ---- scripted times on the herd clock (all keyed to u through the pace table)
    const L = Y.L, tAt = (u) => Y.timeAtU(u), v3 = () => new THREE.Vector3();
    const frame = (u, out = {}) => { const p = Y.posAt(u * L, v3()), t = Y.tanAt(u * L, v3()), il = 1 / Math.max(1e-4, Math.hypot(t.x, t.z)); out.p = p; out.f = new THREE.Vector3(t.x * il, 0, t.z * il); out.r = new THREE.Vector3(-t.z * il, 0, t.x * il); return out; };
    const uSplash = Y.sSplash / L, tSplash = tAt((Y.sSplash - 2.5) / L), tOx = tAt(0.10);
    // the vultures heave off the dead tree as we come up to it, by how far short of the tree the lens is along the way: the first when it is
    // 45 m short, the others one after another over the next 30 m of the run (each by a delay drawn from the seed). The lunge is at its
    // height and the yawn at its widest as we pass the brief's marks (each begins so many seconds before); the hippos blow either side of the yawn
    const sTree = treeS(Y), fT = frame(sTree / L), gTree = trees.deadPos.y, LIFT_RUN = 30;
    const tLunge = tAt(U_LUNGE) - 0.45, tY0 = tAt(U_YAWN) - 1.7, tY1 = tAt(U_YAWN) + 1.5, tBlowA = tAt(U_YAWN) - 0.9, tBlowB = tAt(U_YAWN) + 0.7;
    // ---- birds: vultures over the plume and off the dead tree, egrets and swallows with the column, oxpeckers off a back
    const NS = 26, NL = Math.min(6, Math.max(0, trees.perches.length - 2)), NE = 14, NW = 12, NO = 12, NB = NS + NL + NE + NW + NO;
    const birdGeo = birdGeometry(), bF = new Float32Array(NB * 4), brng = rng.fork('birds'), dummy0 = new THREE.Object3D();
    birdGeo.setAttribute('iF', new THREE.InstancedBufferAttribute(bF, 4));
    const birdMesh = new THREE.InstancedMesh(birdGeo, litMaterial(hero, { USE_ANIM: 1, FLAP: 1 }, { alb: 0.55 }), NB); birdMesh.frustumCulled = false; birdMesh.onBeforeRender = herd.camL; scene.add(birdMesh);
    const perchMesh = new THREE.InstancedMesh(perchedVultureGeometry(), litMaterial(hero, { DISTDARK: 1 }, { alb: 0.95 }), Math.max(1, NL)); perchMesh.frustumCulled = false; perchMesh.onBeforeRender = herd.camL; scene.add(perchMesh);
    // (the six that lift: the vulture build, one instance each; perched, each is the hunched bird on the bough)
    const vultGeo = vultureGeometry(), vF = new Float32Array(Math.max(1, NL) * 4); vultGeo.setAttribute('iF', new THREE.InstancedBufferAttribute(vF, 4));
    const vultMesh = new THREE.InstancedMesh(vultGeo, birdMesh.material, Math.max(1, NL)); vultMesh.frustumCulled = false; vultMesh.onBeforeRender = herd.camL; scene.add(vultMesh);
    const PL = hero.anchors.plume, birds = [], bc = new THREE.Color();
    for (let i = 0; i < NB; i++) {
      const b = { a: brng(), b: brng(), c: brng(), d: brng(), kind: i < NS ? 0 : i < NS + NL ? 1 : i < NS + NL + NE ? 2 : i < NS + NL + NE + NW ? 3 : 4, k: 0 };
      b.k = i - [0, NS, NS + NL, NS + NL + NE, NS + NL + NE + NW][b.kind];
      const tone = b.kind < 2 ? bc.set(brng.chance(0.3) ? '#8a7860' : '#4a3c30').multiplyScalar(brng.range(0.7, 1.1)) : b.kind === 2 ? bc.set('#f0ede2') : b.kind === 3 ? bc.set('#1c2434') : bc.set('#4a3826');
      birdMesh.setColorAt(i, tone); birds.push(b);
      if (b.kind === 1) { b.t0 = tAt((sTree - LIFT_SHORT + LIFT_RUN * (b.k + 0.8 * b.a) / Math.max(1, NL)) / L); vultMesh.setColorAt(b.k, bc.setScalar(0.85 + 0.3 * b.d)); }
    }
    if (!NL) { dummy0.scale.setScalar(0.001); dummy0.updateMatrix(); vultMesh.setMatrixAt(0, dummy0.matrix); vultMesh.setColorAt(0, bc.setScalar(1)); }
    birdMesh.instanceColor.needsUpdate = true; vultMesh.instanceColor.needsUpdate = true;
    const oxLane = herd.lanes[herd.colRows[0]], oxStart = laneAt(oxLane, tOx + 0.35 + T0, v3()), oxF = frame(0.10);
    const birdPos = (b, time, clock, prev, o) => {             // o: { x, y, z, amp, rate, bias, scale }
      if (b.kind === 0) {
        const h = 0.25 + 0.75 * b.a, R = 22 + 46 * b.b, w = (8.5 / R) * (b.c < 0.5 ? 1 : -1), an = time * w + b.d * 6.283;
        const far = b.k % 5 === 4;                               // a few wheel wide over the plain as scale
        o.x = lerp(PL.base[0], PL.top[0], h) + Math.cos(an) * R * (far ? 3 : 1) + (far ? -120 * b.a : 0); o.z = lerp(PL.base[2], PL.top[2], h) + Math.sin(an) * R * (far ? 3 : 1) + (far ? -40 : 0);
        o.y = 34 + 52 * h + 4 * Math.sin(time * 0.21 + b.c * 9); o.amp = 0.05; o.rate = 1.3; o.bias = 0.16; o.scale = 1.25 + 0.2 * b.c;
      } else if (b.kind === 1) {
        const pc = trees.perches[2 + b.k], k = clock - b.t0;
        if (k <= 0) { o.x = pc.x; o.y = pc.y + 0.22 + 0.03 * Math.sin(time * 1.3 + b.a * 9); o.z = pc.z + 0.002 * time; o.amp = 0.03; o.rate = 2; o.bias = -1.25; o.scale = 1.15; o.perch = 1; }
        else {
          // it drops off the bough, opens its wings and rows heavily forward and across our front from right to left, low over the backs
          // of the column, then climbs away toward the plume (metres along the way, to its left, and above the ground the tree stands on)
          const vf = 12 + 2.5 * b.b, vl = 3.6 + 2.4 * b.c, fw = vf * (k - 0.9 * (1 - Math.exp(-k / 0.9))), lf = vl * (k - 0.7 * (1 - Math.exp(-k / 0.7)));
          const hp = pc.y + 0.22 - gTree, low = Math.min(hp, 4.6 + 1.8 * b.a), g = Math.max(0, k - 1.1), f = fT.f, r = fT.r;
          o.x = pc.x + f.x * fw - r.x * lf; o.z = pc.z + f.z * fw - r.z * lf;
          o.y = gTree + lerp(hp, low, sstep(0, 1.5, k)) + (1.2 + 0.9 * b.d) * g * g / (g + 1.3) - 0.16 * Math.sin(time * 7.4 + b.a * 6.283) * sstep(0.3, 1, k);
          o.amp = lerp(0.85, 0.42, sstep(1.2, 4.5, k)); o.rate = 7.4; o.bias = lerp(0.75, 0.08, sstep(0, 0.5, k)); o.scale = 1.2; o.perch = 0;
        }
      } else if (b.kind === 2) {
        const oo = ((b.a * 10 + prev * 0.6) % 10) - 1, s = Y.distAtTime(clock + oo), sd = b.k % 2 ? 1 : -1;
        Y.posAt(s, _p); Y.tanAt(s, _t); const il = 1 / Math.max(1e-4, Math.hypot(_t.x, _t.z)), lat = sd * (7 + 7 * b.b) + 1.5 * Math.sin(time * 0.5 + b.c * 9);
        o.x = _p.x - _t.z * il * lat; o.z = _p.z + _t.x * il * lat;
        o.y = Math.max(land.height(o.x, o.z), W) + 2.4 + 2.6 * b.d + 0.5 * Math.sin(time * 0.9 + b.a * 20); o.amp = 0.62; o.rate = 9 + 2 * b.c; o.bias = 0.1; o.scale = 0.5;
      } else if (b.kind === 3) {
        const s = Y.distAtTime(clock + prev * 0.3) + 9 + 14 * b.a + 5 * Math.sin(time * 0.8 + b.b * 9), w = 1.1 + 0.8 * b.c;
        Y.posAt(s, _p); Y.tanAt(s, _t); const il = 1 / Math.max(1e-4, Math.hypot(_t.x, _t.z)), lat = (4 + 6 * b.d) * Math.sin(time * w + b.b * 6.283);
        o.x = _p.x - _t.z * il * lat; o.z = _p.z + _t.x * il * lat; o.y = _p.y - 0.6 + 1.6 * (1 + Math.sin(time * w * 2 + b.a * 9)) + b.c; o.amp = 0.7; o.rate = 16; o.bias = 0; o.scale = 0.2;
      } else {
        const k = clock - tOx - b.k * 0.05;
        if (k <= 0 || k > 5) { o.x = oxStart.x; o.y = -50; o.z = oxStart.z; o.scale = 0.001; o.amp = 0; o.rate = 1; o.bias = 0; }
        else {
          const f = oxF.f, r = oxF.r, fw = (12.5 + 3 * b.a) * k, sd = -(1.2 + 3.2 * b.b) * k * (1 - 0.08 * k), up = 0.9 + (1.3 + 1.5 * b.c) * k - 0.14 * k * k;
          o.x = oxStart.x + f.x * fw + r.x * sd + 0.3 * Math.sin(time * 9 + b.d * 9); o.z = oxStart.z + f.z * fw + r.z * sd; o.y = oxStart.y + 1.3 + up + 0.2 * Math.sin(time * 11 + b.a * 9);
          o.amp = 0.9; o.rate = 26; o.bias = 0; o.scale = 0.58 * sstep(0, 0.2, k) * (1 - sstep(4, 5, k));
        }
      }
      return o;
    };
    const _p = v3(), _t = v3(), bo = {}, bo2 = {}, dummy = new THREE.Object3D();
    await ctx.yield();
    // marabous on the dead tree
    const storkGeo = F.waderGeometry({ ...F.WADER_PRESETS.stork, body: '#e8e4dc', belly: '#f0ece4', wing: '#2a2c34', neckC: '#d8b0a8', cap: '#c89a94', beakC: '#c8b890', legC: '#b8b0a8' });
    const storkMat = perchMesh.material, storks = [];
    for (let i = 0; i < Math.min(2, trees.perches.length); i++) {
      const m = new THREE.Mesh(storkGeo, storkMat), pc = trees.perches[i]; m.position.copy(pc).y -= 0.05; m.scale.setScalar(1.55); m.rotation.y = brng() * 6.283; m.onBeforeRender = herd.camL; scene.add(m); storks.push(m);
    }
    await ctx.yield();
    const barDress = buildBarDress(ctx, Y, land, hero, W, herd.camL); scene.add(barDress.group);
    await ctx.yield();
    // ---- crocodiles
    const crng = rng.fork('crocs'), NC = 7, crocGeo = crocGeometry(), cF = new Float32Array(NC * 4);
    crocGeo.setAttribute('iF', new THREE.InstancedBufferAttribute(cF, 4));
    const crocMesh = new THREE.InstancedMesh(crocGeo, litMaterial(hero, { USE_ANIM: 1, SCULL: 1 }, { gloss: 0.07, wetLine: W + 0.16, alb: 1 }), NC); crocMesh.frustumCulled = false; crocMesh.onBeforeRender = herd.camL; scene.add(crocMesh);
    const gapeGeo = crocGeometry(0.5), gF = new Float32Array([0, 2, 0.1, 0]); gapeGeo.setAttribute('iF', new THREE.InstancedBufferAttribute(gF, 4));
    const gapeMesh = new THREE.InstancedMesh(gapeGeo, crocMesh.material, 1); gapeMesh.frustumCulled = false; gapeMesh.onBeforeRender = herd.camL; scene.add(gapeMesh);
    const fL = lunge, lungeAt = lunge.at, lungeYaw = lunge.yaw, crocs = [];
    // one drifts down with the current, which sets across our line from the right below the leap: its ridged back slides across our front
    // nine metres off. Its track is a line in the river (through a seat on our swim line, 34 m below the splash, along the set of the
    // current there); it is on that line by the herd clock, its head over our line as we come within thirteen metres and its tail as we come
    // within nine, then it turns downstream, four metres clear of us as we pass.
    const sX = Y.sSplash + 34, fX = frame(sX / L), xDir = fX.f.clone().multiplyScalar(0.5).addScaledVector(fX.r, -0.866), xDown = fX.f, X_V = 2.6, tX = tAt((sX - 13) / L), xYaw = Math.atan2(xDir.x, xDir.z);
    for (let i = 1; i < NC; i++) {
      let x = 0, z = 0, bask = i >= 5, ok = false, yaw = 0;
      for (let k = 0; k < 60 && !ok; k++) {
        // (the first of the drifters lies in the pool under the bank we leap from, among the swimmers)
        if (i === 1) { x = Y.lip[0] + crng.range(10, 30); z = Y.lip[2] + crng.range(-10, 8); const q = land.sample(x, z); ok = q.kind === 1 && q.dO > 5 && q.lat > 2.2; yaw = Math.PI / 2 + crng.range(-0.9, 0.3); }
        else if (bask) { x = crng.range(-10, 75); z = crng.range(60, 86); const q = land.sample(x, z); ok = q.kind === 2 && q.dI > 2.5 && q.dI < 7 && q.lat > 12; yaw = crng.range(0, 6.283); }
        else { x = i < 4 ? crng.range(-66, -30) : crng.range(50, 110); z = i < 4 ? crng.range(84, 150) : crng.range(34, 54); const q = land.sample(x, z); ok = q.kind === 1 && q.dO > 10 && q.dI > 8; yaw = i < 4 ? Math.PI + crng.range(-0.5, 0.5) : Math.PI / 2 + crng.range(-0.5, 0.5); }
      }
      crocs.push({ x, z, yaw, bask, y: bask ? land.height(x, z) + 0.1 : W - 0.1, ph: crng() * 6.283, size: crng.range(0.9, 1.12) });
    }
    for (let i = 0; i < NC; i++) cF.set([crng() * 6.283, 1.6 + crng(), i >= 5 ? 0 : 0.1, 0], i * 4);
    crocs[0].size = 1.16;
    await ctx.yield();
    // ---- hippos in the slack by the bar
    const hrng = rng.fork('hippos'), NH = 9, hipGeo = hippoGeometry(), hF = new Float32Array(NH * 4);
    hipGeo.setAttribute('iH', new THREE.InstancedBufferAttribute(hF, 4));
    const hipMesh = new THREE.InstancedMesh(hipGeo, hippoMaterial(hero), NH); hipMesh.frustumCulled = false; hipMesh.onBeforeRender = herd.camL; scene.add(hipMesh);
    const hipGeoLo = hippoGeometry(true), hFLo = new Float32Array(NH * 4); hipGeoLo.setAttribute('iH', new THREE.InstancedBufferAttribute(hFLo, 4));                       // the pod beyond the four round the yawn: the light build
    const hipLo = new THREE.InstancedMesh(hipGeoLo, hipMesh.material, NH); hipLo.frustumCulled = false; hipLo.onBeforeRender = herd.camL; scene.add(hipLo);
    const fH = yawn.fH, hippos = [], yawnAt = yawn.at, sd = yawn.sd, sr = yawn.sr;
    // the one that yawns lies nose to the sun (its heading is the sun's bearing on the ground plan, see yawnPlace): a dark head thrown
    // back and a dark jaw dropped with the rose between them (the jaw opens over a second and a half, and closes as slowly)
    const yawnYaw = yawn.yaw;
    hippos.push({ x: yawnAt.x, z: yawnAt.z, yaw: yawnYaw, ph: 0, size: 1.5, sink: 0, rest: 0.7, k: 1 });
    // three of the pod close by it, low in the water: ears, eyes and nostrils, a line of back
    for (const [fw, rt, turn, size] of [[-1.5, 4.8, 0.5, 1.2], [3.0, -4.4, -1.9, 1.25], [6.2, 1.6, -0.9, 1.15]]) {
      const x = yawnAt.x + sd.x * fw + sr.x * rt, z = yawnAt.z + sd.z * fw + sr.z * rt, q = land.sample(x, z);
      if (q.kind === 1 && q.lat >= 8) hippos.push({ x, z, yaw: yawnYaw + turn, ph: 1.2 + hippos.length * 2.1, size, sink: 0.08, rest: 0.84, k: 0.9 });
    }
    const nNear = hippos.length;
    for (let tries = 0; hippos.length < NH && tries < 300; tries++) {
      const x = yawnAt.x + fH.r.x * hrng.range(1, 13) + fH.f.x * hrng.range(-12, 7), z = yawnAt.z + fH.r.z * hrng.range(1, 13) + fH.f.z * hrng.range(-12, 7), q = land.sample(x, z);
      if (q.kind !== 1 || q.lat < 8.5 || hippos.some((h) => Math.hypot(h.x - x, h.z - z) < 3.4)) continue;
      hippos.push({ x, z, yaw: hrng() * 6.283, ph: hrng() * 6.283, size: hrng.range(0.8, 1.05), sink: hrng.range(0.2, 1), rest: hrng.range(0.93, 1), k: 0.55 });
    }
    const nHip = hippos.length; hipMesh.count = nNear; hipLo.count = Math.max(0, nHip - nNear);
    while (hippos.length < NH) hippos.push({ x: yawnAt.x, z: yawnAt.z, yaw: 0, ph: 0, size: 0.001, sink: 0, rest: 1, k: 0 });
    hippos.forEach((h, i) => { if (i < nNear) hF[i * 4 + 1] = h.ph + i * 0.37; else hFLo[(i - nNear) * 4 + 1] = h.ph + i * 0.37; });
    const ripList = hippos.map((h, i) => ({ x: h.x + Math.sin(h.yaw) * 0.45 * h.size, z: h.z + Math.cos(h.yaw) * 0.45 * h.size, size: (i ? 3.6 : 3.8) * h.size, ph: (i * 0.377) % 1, k: h.k }));
    for (let i = 0; i < 30; i++) {                                           // foam the waders leave on the shallows off the bar
      const fr = frame(lerp(Y.sWade - 10, Y.sBar, hrng()) / L), lat = hrng.range(-9, 9), x = fr.p.x + fr.r.x * lat, z = fr.p.z + fr.r.z * lat;
      if (land.height(x, z) < W - 0.04) ripList.push({ x, z, size: hrng.range(2.6, 5), ph: 10 + hrng(), k: hrng.range(0.6, 0.9) });
    }
    const ripples = buildRipples(hero, ripList, W);
    ripples.mesh.onBeforeRender = herd.camL; scene.add(ripples.mesh);
    const blowA = hippos[Math.min(2, nHip - 1)], blowB = hippos[Math.min(3, nHip - 1)];
    await ctx.yield();
    // ---- bursts: our own splash crown, the crocodile's lunge, the hippo's blow
    const bl = [], R = (a, b) => brng.range(a, b), fS = frame(uSplash), sp0 = fS.p.clone().addScaledVector(fS.f, 2.2); sp0.y = W;
    for (let i = 0; i < Math.round(170 * detail); i++) { const an = R(0, 6.283), rr = R(0.8, 4.4), vv = R(1, 4.4); bl.push({ p: [sp0.x + Math.cos(an) * rr, W + 0.15, sp0.z + Math.sin(an) * rr], v: [Math.cos(an) * vv + fS.f.x * 3.5, R(3.2, 9.2), Math.sin(an) * vv + fS.f.z * 3.5], life: R(0.8, 1.25), s0: R(0.03, 0.06), s1: R(0.05, 0.11), ev: 0, type: 0 }); }
    for (let i = 0; i < 4; i++) { const lat = R(-3.4, 3.4), fw = R(2.5, 6.5); bl.push({ p: [sp0.x + fS.f.x * fw + fS.r.x * lat, W + 0.05, sp0.z + fS.f.z * fw + fS.r.z * lat], v: [fS.f.x * 5.5, R(0.1, 0.35), fS.f.z * 5.5], life: R(1.1, 1.5), s0: 0.45, s1: R(0.8, 1.1), ev: 0, type: 1 }); }
    for (let i = 0; i < 9; i++) { const lat = (i % 2 ? 1 : -1) * R(1.6, 4.2), fw = R(0.5, 6); bl.push({ p: [sp0.x + fS.f.x * fw + fS.r.x * lat, W, sp0.z + fS.f.z * fw + fS.r.z * lat], v: [0, 0, 0], life: R(1.0, 1.3), s0: R(0.9, 1.5), s1: R(0.55, 1.0), ev: 0, type: 2 }); }
    const lAw = fL.f.clone().multiplyScalar(0.83).addScaledVector(fL.r, 0.56).multiplyScalar(2.1);
    for (let i = 0; i < 34; i++) { const an = R(0, 6.283), vv = R(1, 4); bl.push({ p: [lungeAt.x + lAw.x * R(0.5, 1.2) + Math.sin(lungeYaw) * R(-1, 3), W + 0.1, lungeAt.z + lAw.z * R(0.5, 1.2) + Math.cos(lungeYaw) * R(-1, 3)], v: [Math.cos(an) * vv + lAw.x * 0.8, R(3.5, 7.5), Math.sin(an) * vv + lAw.z * 0.8], life: R(0.8, 1.3), s0: R(0.05, 0.1), s1: R(0.1, 0.2), ev: 1, type: 0 }); }
    for (let i = 0; i < 7; i++) bl.push({ p: [lungeAt.x + lAw.x + Math.sin(lungeYaw) * R(-2, 4) + R(-0.6, 0.6), W, lungeAt.z + lAw.z + Math.cos(lungeYaw) * R(-2, 4) + R(-0.6, 0.6)], v: [0, 0, 0], life: R(1.1, 1.5), s0: R(1.4, 2.2), s1: R(1.7, 2.7), ev: 1, type: 2 });
    for (let i = 0; i < 3; i++) bl.push({ p: [lungeAt.x + lAw.x + R(-1.5, 1.5), W + 0.4, lungeAt.z + lAw.z + R(-1.5, 1.5)], v: [R(-1, 1), 1.5, R(-1, 1)], life: 1.6, s0: 1.2, s1: 3.2, ev: 1, type: 1 });
    // a hippo blows as it comes up: a jet of fine spray from the nostrils that hangs a moment and drifts off
    [[blowA, 2], [blowB, 4]].forEach(([h, ev]) => {
      const nx = Math.sin(h.yaw), nz = Math.cos(h.yaw), px = h.x + nx * 1.7 * h.size, pz = h.z + nz * 1.7 * h.size, py = W + (1.2 - h.rest) * h.size;
      for (let i = 0; i < 6; i++) bl.push({ p: [px + R(-0.12, 0.12), py, pz + R(-0.12, 0.12)], v: [nx * R(0.5, 1.5) + R(-0.4, 0.4), R(1.0, 2.3), nz * R(0.5, 1.5) + R(-0.4, 0.4)], life: R(1.3, 2.0), s0: R(0.1, 0.16), s1: R(0.5, 0.9), ev, type: 3 });
      for (let i = 0; i < 14; i++) bl.push({ p: [px, py, pz], v: [nx * R(0.6, 2.2) + R(-0.7, 0.7), R(2.2, 4.6), nz * R(0.6, 2.2) + R(-0.7, 0.7)], life: R(0.6, 1), s0: R(0.03, 0.05), s1: R(0.05, 0.09), ev, type: 0 });
    });
    // the yawner heaves up: water thrown off its shoulders and falling from its jaws
    { const h = hippos[0], nx = Math.sin(h.yaw), nz = Math.cos(h.yaw);
      for (let i = 0; i < 6; i++) { const al = R(-1.6, 2.6); bl.push({ p: [h.x + nx * al + R(-0.5, 0.5), W, h.z + nz * al + R(-0.5, 0.5)], v: [0, 0, 0], life: R(1.0, 1.4), s0: R(0.8, 1.3), s1: R(0.5, 0.9), ev: 3, type: 2 }); }
      for (let i = 0; i < 26; i++) { const al = R(0.6, 3), an = R(0, 6.283), vv = R(0.4, 1.8); bl.push({ p: [h.x + nx * al, W + R(0.3, 1.2), h.z + nz * al], v: [Math.cos(an) * vv + nx, R(1.5, 4.2), Math.sin(an) * vv + nz], life: R(0.7, 1.1), s0: R(0.03, 0.06), s1: R(0.06, 0.11), ev: 3, type: 0 }); }
      for (let i = 0; i < 3; i++) bl.push({ p: [h.x + nx * R(0, 2.4), W + 0.3, h.z + nz * R(0, 2.4)], v: [R(-0.5, 0.5), 1.2, R(-0.5, 0.5)], life: 1.7, s0: 0.5, s1: 1.7, ev: 3, type: 1 });
    }
    const bursts = buildBursts(hero, bl); bursts.mesh.onBeforeRender = herd.camL; scene.add(bursts.mesh);
    await ctx.yield();
    const air = buildAir(ctx, hero, look); scene.add(air.points, air.dome, air.glow); air.GU.uGlowC.value.copy(C3(look.gully));
    await ctx.yield();
    const surf = (x, z) => terrain.surfaceAt(x, z);
    const ground = await buildGround(ctx, Y, land, hero, W, surf, look); await ctx.yield();
    const walls = await buildWalls(ctx, Y, land, hero, W, ground, look); await ctx.yield();
    const wdress = await buildWallDress(ctx, Y, hero, walls); await ctx.yield();
    const stubble = await buildStubble(ctx, Y, land, hero, W, surf, ground, look, wdress.fringe); await ctx.yield();
    const oats = await buildOats(ctx, Y, land, hero, W, surf, ground, look, herd.flanks); oats.mesh.onBeforeRender = herd.camL; scene.add(oats.mesh); await ctx.yield();
    for (const d of [ground, walls, wdress, stubble]) { scene.add(d.group); d.group.traverse((o) => { if (o.isMesh) o.onBeforeRender = herd.camL; }); }
    const bank = buildDustBank(ctx, Y, hero); scene.add(bank.mesh);
    await ctx.yield();
    // ---- every frame
    let prev = 0; const tan0 = Y.tanAt(0, v3()).setY(0).normalize(), coreDir = v3(), coreC = capped(C3(look.gully).lerp(C3('#fff0c8'), 0.4).multiplyScalar(1.2), 0.9);
    const camPos = v3(), buf = new THREE.Vector2();
    const tSlab = tAt(SLAB_U[0]), SLAB_T = 2.5;
    U.uKeep.value.z = 7; U.uPDen.value *= 1.3;                 // (the ring's radius; the plume's one density)
    // the gaze rides a little above the level on the run in: the herd fills the bottom of the frame, the dust it raises the top
    const update = (dt, time, camera, u) => {
      const uu = clamp(u ?? 0, 0, 1);
      if (uu <= 0) prev += dt;                                   // the herd streams past the parked camera in the portal preview
      const clock = tAt(uu), s = uu * L;
      camPos.setFromMatrixPosition(camera.matrixWorld);
      // seen through a portal, the column runs on ahead at half the pace of the viewer who comes on (the far side of the opening is never empty),
      // and at the crossing every neighbour is where it was authored (no jump, and the near tiers are the near animals)
      const lead = uu <= 0 ? clamp(-((camPos.x - path.start.x) * tan0.x + (camPos.z - path.start.z) * tan0.z), 0, 140) : 0;
      herd.HU.uClock.value = clock; herd.HU.uSurge.value = time; herd.HU.uPrev.value = -0.5 * lead / Y.v0; herd.HU.uPrevF.value = prev; herd.HU.uPart.value.set(uu > 0 ? partAt(uu) : 1 - sstep(3, 24, lead), uu > 0.03 && uu < 0.09 ? (partAt(uu + 0.002) - partAt(uu - 0.002)) / Math.max(1e-3, Y.timeAtU(uu + 0.002) - Y.timeAtU(uu - 0.002)) : 0);
      hero.setClock(clock + prev); if (rare) hero.setCollapse(clamp((clock - tSlab) / SLAB_T, 0, 1), clock - tSlab);
      // the Fall's own swimmers keep clear of the lens: one ring, centred on it, of one radius
      hero.setKeepOut(camPos.x, camPos.z);
      hero.update(dt, time, camera);
      camPos.setFromMatrixPosition(camera.matrixWorld); U.uCamL.value.copy(camPos);
      // dust: gold fog in the gully, clear at one stroke over the river
      // (one fog, one density: it thickens from the gully's mouth to thirty-five metres of visibility, and from twenty-four metres short of the lip it is gone in a second)
      const gf = sstep(Y.sGully - 16, Y.sGully + 34, s) * (1 - sstep(Y.sLip - 24, Y.sLip - 3, s));
      // the gully changes along its length: the walls stand clear where we come in between them, the dust closes to fog as we go, and it
      // brightens ahead toward the bend and the lip (gp: how far along the gully we are, by the metres of the gully itself)
      const gp = sstep(Y.sGully + 6, Y.sLip - 30, s);
      scene.fog.density = lerp(look.fogK, look.gullyK * GULLY_FOG * lerp(0.6, 1.16, gp), gf); scene.fog.color.copy(fogA).lerp(fogB, gf);
      air.DU.uDomeC.value.copy(scene.fog.color).multiplyScalar(lerp(1, 1.04, gf)); air.DU.uDomeA.value = lerp(0.22, 1, gf); air.DU.uDomeH.value = lerp(0, 0.97, gf); air.DU.uDomeW.value = lerp(0.11, 0.3, gf); air.DU.uDomeL.value = gf;      // on the plain a gold band low down; in the gully the dust is the sky
      Y.tanAt(Math.min(L, s + 34), coreDir); coreDir.y = 0.05; coreDir.normalize(); air.DU.uCore.value.set(coreDir.x, coreDir.y, coreDir.z, lerp(0.42, 1, gp) * gf); air.DU.uCoreC.value.copy(coreC);      // and it is brightest ahead, where the gully bends
      U.uShade.value = gf; U.uRim.value = lerp(1, 3, gf) + 0.3 * sstep(Y.sSplash - 4, Y.sSplash + 14, s) * (1 - sstep(Y.sLand, Y.sBar, s));      // in the dust every spine and horn burns; in the river a little gold stays on the wet ones
      { const sg = Math.min(L, s + 26); Y.posAt(sg, air.GU.uGlowP.value); air.GU.uGlowP.value.y += 1.2; Y.tanAt(Math.min(L, sg + 8), air.GU.uGlowD.value); air.GU.uGlowD.value.y = 0; air.GU.uGlowD.value.normalize(); air.GU.uGlowA.value = lerp(0.14, 0.34, gp) * gf; air.GU.uGlowC.value.copy(coreC); }
      air.dome.position.copy(camPos); air.points.visible = !ctx.through;     // the motes round the lens are ours alone: not in the picture a portal shows of us
      ctx.renderer.getDrawingBufferSize(buf); air.AU.uPx.value = buf.y; air.AU.uCam.value.copy(camPos);
      air.AU.uAmt.value = lerp(1, 0.3, sstep(Y.sLip, Y.sSplash, s) * (1 - sstep(Y.sBar, Y.sExit, s)));
      sky.update(dt, time, camera); rig.update(dt, time, camera); terrain.update(dt, time); wind.update(time);
      // the clouds' shadows drift with the herd's clock (the terrain's own drift is replaced here, after it). They lie on the open plain:
      // within a hundred metres of the river, and over it, they are faint (by where the lens stands, whichever way it came there)
      { const O = Y.oLine.near(camPos.x, camPos.z), I = Y.iLine.near(camPos.x, camPos.z), dRiver = O.side > 0 && I.side < 0 ? 0 : Math.min(O.d, I.d);
        tCl.x = cloudPlan.ox + cloudPlan.dx * (clock + prev); tCl.y = cloudPlan.oz + cloudPlan.dz * (clock + prev); tCl.w = CLOUD_K * lerp(0.3, 1, sstep(88, 115, dRiver)); }
      trees.update(dt, time, camera);
      // birds
      for (let i = 0; i < NB; i++) {
        const b = birds[i]; bo.perch = 0; birdPos(b, time, clock, prev, bo); birdPos(b, time + 0.08, clock + (uu > 0 ? 0.08 : 0), prev + (uu > 0 ? 0 : 0.08), bo2);
        const dx = bo2.x - bo.x, dy = bo2.y - bo.y, dz = bo2.z - bo.z, hl = Math.hypot(dx, dz);
        dummy.position.set(bo.x, bo.y, bo.z);
        if (bo.perch) dummy.rotation.set(-1.05, b.d * 6.283, 0, 'YXZ');
        else dummy.rotation.set(-Math.atan2(dy, Math.max(hl, 0.02)) * 0.8, hl > 1e-4 ? Math.atan2(dx, dz) : b.d * 6.283, b.kind === 0 ? (b.c < 0.5 ? -0.32 : 0.32) : 0.1 * Math.sin(time * 2 + b.a * 9), 'YXZ');
        dummy.scale.setScalar(bo.perch ? 0.001 : bo.scale); dummy.updateMatrix();
        if (b.kind === 1) { vultMesh.setMatrixAt(b.k, dummy.matrix); vF[b.k * 4] = b.a * 6.283; vF[b.k * 4 + 1] = bo.rate; vF[b.k * 4 + 2] = bo.amp; vF[b.k * 4 + 3] = bo.bias; dummy.scale.setScalar(0.001); dummy.updateMatrix(); }
        birdMesh.setMatrixAt(i, dummy.matrix);
        if (b.kind === 1) {                                        // at rest it is the hunched bird on the branch; in the air, the flier
          dummy.position.set(bo.x, bo.y + 0.12, bo.z); dummy.rotation.set(-1.14, b.d * 6.283, 0, 'YXZ'); dummy.scale.setScalar(bo.perch ? 0.95 + 0.2 * b.c : 0.001); dummy.updateMatrix(); perchMesh.setMatrixAt(b.k, dummy.matrix);
        }
        bF[i * 4] = b.a * 6.283; bF[i * 4 + 1] = bo.rate; bF[i * 4 + 2] = bo.amp; bF[i * 4 + 3] = bo.bias;
      }
      birdMesh.instanceMatrix.needsUpdate = true; birdGeo.attributes.iF.needsUpdate = true; perchMesh.instanceMatrix.needsUpdate = true; vultMesh.instanceMatrix.needsUpdate = true; vultGeo.attributes.iF.needsUpdate = true;
      for (let i = 0; i < storks.length; i++) storks[i].rotation.z = 0.04 * Math.sin(time * 0.7 + i * 2);
      // crocodiles: the lunge (0), the one that slides across our front (1), drifters and baskers
      {
        const k = clock - tLunge, lift = sstep(0, 0.25, k) * (1 - sstep(1.0, 2.2, k)), surge = 4.2 * sstep(0, 0.42, k) - 1.2 * sstep(1.6, 3.4, k) - 2.2;
        const kx = clamp(clock - tX, -30, 5.5), kd = Math.max(0, clock - tX - 5.5), turn = sstep(4, 9, clock - tX);
        dummy.position.set(lungeAt.x + Math.sin(lungeYaw) * surge, W - 0.2 + 0.32 * lift, lungeAt.z + Math.cos(lungeYaw) * surge);
        dummy.position.y -= 1.3 * (1 - sstep(-0.5, 0, k)) + 1.3 * sstep(2.4, 3.4, k);
        dummy.rotation.set(-0.1 * lift, lungeYaw, 0.05 * lift, 'YXZ'); dummy.scale.setScalar(1.22); dummy.updateMatrix(); gapeMesh.setMatrixAt(0, dummy.matrix); gapeMesh.instanceMatrix.needsUpdate = true; gF[2] = 0.1 + 0.3 * lift; gF[1] = 2 + 6 * lift; gapeGeo.attributes.iF.needsUpdate = true;
        dummy.position.copy(fX.p).addScaledVector(xDir, X_V * kx).addScaledVector(xDown, 0.8 * kd); dummy.position.y = W - 0.1 + 0.015 * Math.sin(time * 0.9);
        dummy.rotation.set(0, xYaw + 1.05 * turn + 0.1 * Math.sin(time * 0.6), 0, 'YXZ'); dummy.scale.setScalar(1.12); dummy.updateMatrix(); crocMesh.setMatrixAt(0, dummy.matrix);
        for (let i = 1; i < NC; i++) {
          const cr = crocs[i - 1], d = cr.bask ? 0 : 2.5 * Math.sin(time * 0.07 + cr.ph);
          dummy.position.set(cr.x + Math.sin(cr.yaw) * d, cr.y + (cr.bask ? 0 : 0.02 * Math.sin(time * 0.8 + cr.ph)), cr.z + Math.cos(cr.yaw) * d);
          dummy.rotation.set(0, cr.yaw + (cr.bask ? 0 : 0.12 * Math.sin(time * 0.3 + cr.ph)), 0, 'YXZ'); dummy.scale.setScalar(cr.size); dummy.updateMatrix(); crocMesh.setMatrixAt(i, dummy.matrix);
        }
        crocMesh.instanceMatrix.needsUpdate = true; crocGeo.attributes.iF.needsUpdate = true;
      }
      // hippos: sinking and rising, an ear flicking; one heaves up head and shoulders and yawns as we swim past it
      const yUp = sstep(tY0 - 0.9, tY0 + 0.15, clock) * (1 - sstep(tY1 + 0.5, tY1 + 2.0, clock)), yOpen = sstep(tY0 - 0.4, tY0 + 1.1, clock) * (1 - sstep(tY1, tY1 + 1.5, clock));
      for (let i = 0; i < NH; i++) {
        const h = hippos[i], up = i ? 0 : yUp, dn = Math.max(0, Math.sin(time * 0.26 + h.ph)), under = h.sink * dn * dn;
        dummy.position.set(h.x, W - h.rest * h.size + 0.46 * up * h.size - 0.42 * under + 0.03 * Math.sin(time * 1.1 + h.ph), h.z);
        dummy.rotation.set(-0.17 * up - 0.02 * Math.sin(time * 0.7 + h.ph), h.yaw + 0.06 * Math.sin(time * 0.33 + h.ph) * (1 - up), 0, 'YXZ'); dummy.scale.setScalar(h.size); dummy.updateMatrix();
        if (i < nNear) { hipMesh.setMatrixAt(i, dummy.matrix); hF[i * 4] = i ? 0 : yOpen; hF[i * 4 + 2] = i ? 0.3 : up; hF[i * 4 + 3] = i ? 0.3 : up; }
        else { const j = i - nNear; hipLo.setMatrixAt(j, dummy.matrix); hFLo[j * 4] = 0; hFLo[j * 4 + 2] = 0.3; hFLo[j * 4 + 3] = 0.12; }
        ripples.iQ[i * 2] = h.k * (1 - 0.7 * under); ripples.iQ[i * 2 + 1] = i ? 0 : up * (1 - 0.6 * sstep(tY0 + 1.5, tY0 + 4, clock));
      }
      hipMesh.instanceMatrix.needsUpdate = true; hipGeo.attributes.iH.needsUpdate = true; hipLo.instanceMatrix.needsUpdate = true; hipGeoLo.attributes.iH.needsUpdate = true; ripples.attr.needsUpdate = true;
      bursts.ages[0] = clock - tSplash; bursts.ages[1] = clock - tLunge; bursts.ages[2] = clock - tBlowA; bursts.ages[3] = clock - tY0 + 0.75; bursts.ages[4] = clock - tBlowB;
    };
    { const c0 = new THREE.PerspectiveCamera(); c0.position.copy(path.start); c0.updateMatrixWorld(true); update(0, 0, c0, 0); }   // everything in place before the first frame
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DUR, pace: Y.paceAt,
      camera: { fov: 62, near: 0.25, far: 4200, lookAhead: 17, sway: 0.7, bank: 0.2, nearThrough: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 6, color: '#ffe6b8', glow: 0.9, tilt: true, revealDistance: 150 },
      post: { exposure: look.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.93 },
        grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { sky.dispose?.(); herd.tex.dispose(); },
    };
  },
};
