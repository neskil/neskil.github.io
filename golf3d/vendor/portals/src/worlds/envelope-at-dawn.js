// THE ENVELOPE AT DAWN (world "envelope-at-dawn")
// A hot-air balloon at a dawn launch: flown into through its mouth while it lies on the meadow, ridden inside while it fills, stands
// up and lifts, left under the mouth's rim for the open air, and entered again from above through the open valve at its crown,
// where the ring stands. Nobody is in it. Nothing is lettered; no maker's pattern; six flat colours.
// OURS: the size, about three times life (the mouth 9 m in radius, 70.9 m from mouth to crown, 30 m at the widest), and the lean
// of 18 degrees downwind when she stands.
// THE WORLD SETS NEITHER portal.drawWithin NOR portal.drawIn: the ring stands whole in the open valve. A LIGHT OF THE RING: the
// cloth of the crown about the valve takes the ring's pale light, by place (it falls off with the distance from the valve's rim) and by
// the valve's own law of the metres flown.
// BY THE METRES FLOWN, each a plain function of the metres flown and nothing else (laws() below):
//   THE FILLING: the front of the filled cloth runs up the lying envelope, 20 m and 0.6 m more for every metre flown.
//   THE STANDING UP: 0 to 72 degrees over the 97 m after the row named ride0: at the flight's pace 72 degrees in 17.8 s, at most
//     8.4 degrees a second, while the lens itself turns at most 39 degrees a second (my count, _b-local/ev/turnrate.mjs). The eye
//     keeps the mouth, the basket and the flame in the middle of the picture throughout.
//   THE BURNER'S BLASTS: three: through the standing up; at the look down; as we look back at her from the open air.
//   THE LIFT: to 100 m as she stands, to 250 m by the look down, then a quarter of a metre for every metre flown; AND ITS DRIFT
//     toward the sun, 260 m by the wide look, then a quarter of a metre for every metre flown. The land sinks and slides away
//     under her; each other balloon takes a share of its own of the lift and of the drift, none for those that stay on the field.
//   THE VALVE: the rip top draws open as an iris from 4 m before to 8 m after the row named pano, its cloth gathered into a collar
//     under the rim: open before the crown is seen again.
// BY THE WORLD'S CLOCK, as loops of 40 s: the cloth's ripple, the flame's flicker, the fan's blades, the other balloons' sway, bob
//   and burners (and so their shadows on our cloth and on the land), the river's glints, the crawl of the mist, the shimmer in
//   the sun's shaft, the ripple of the valve's gathered collar.
// THE WAY: low over the meadow to the mouth; down the lying cave in a bow; back toward the mouth as the burner fires; the standing
// up; round her shaded side under the vault; out under the mouth's upwind rim, between the cables, and back in; once round the
// flame, the look down; out under the west rim into the open air; the dawn; back to look at her aloft, the valley beside her; up level with her crown;
// down her own axis from above into the open valve.
// COUNTED ON AN OLDER KIT (the crew's tree of 6 Oct). Stills for strangers: aa 2, 1280 by 720.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { EV, SUN, profR, frameOf, sectionOf, scPoint, makeDawn, makeCloth, makePanel, makeCables, basketGeometry, fanGeometry, fanBladesGeometry, otherGeometry, makeLand, landHeight, riverZ, makeLandMap, treeGeometry, shaftGeometry } from '../parts/envelope-at-dawn.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, f) => a + (b - a) * f, TAU = Math.PI * 2, DEG = Math.PI / 180;
const ss = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const DUR = 88;
const LIFT = 250, DRIFT = 260;

// ---------------------------------------------------------------- the way
// A row: ['W', x, y, z] a place on the meadow, ['B', x, y, z] a place in the open air given from the middle of the standing mouth, or ['S', x, h, w, degrees stood] a place given from the middle of the envelope's
// cross-section h metres up its axis (x to the side, w across), at that much stood up. After it: the gaze from there, as a place
// given the same way [x, h, w]; a name for the laws.
const ROWS = [
  // low over the launch meadow to the mouth, past basket, burner and fan
  [['W', 17, 7.4, 49], [0, 16, 20]], [['W', 14.5, 7.4, 38], [0, 16, 20]], [['W', 12, 7.2, 27], [0, 14, 12]], [['W', 9, 6.8, 17], [0, 13, 6]], [['W', 6, 7.2, 6], [0, 16, 4]], [['W', 3.5, 9.2, -4.5], [0, 30, 1]], [['S', 0.5, 0, 3.6, 0], [0, 70.9, 0], 'mouth'],
  // down the cloth cave as it fills
  [['S', -8, 9, 2.5, 0], [0, 70.9, 0]], [['S', -15, 19, 1.5, 0], [0, 70.9, 0]], [['S', -8.5, 28, 1, 0], [0, 70.9, 0]], [['S', 5.5, 33, 0.5, 0], [-2, 70.9, 0.5]], [['S', 14.5, 38, 0, 0], [-6, 70.9, 1]], [['S', 13, 44, -0.5, 0], [-14, 66, 1]],
  // round at the crown's end, and back toward the mouth as the burner fires
  [['S', 7, 48, -0.5, 0], [-24, 54, 2], 'far'], [['S', 3, 52, 0, 0], [-22, 36, 1]], [['S', -2, 52.5, 0, 0], [-18, 22, 0]],
  // THE STANDING UP, seen toward the mouth: the lens rides with the cloth down the cave while the basket tips upright, the flame
  // roars in and rises with her, and the meadow swings away in the mouth's round
  [['S', -6, 50, 0, 0], [-12, 12, -1], 'ride0'], [['S', -8, 43, -0.5, 8], [-3, -2, -2]], [['S', -8.5, 35, -1, 23], [0, -3, -2]], [['S', -8.5, 27, -1.5, 58], [0, -3, -1.5]], [['S', -9.5, 21.5, -1.5, 66], [2, 2, -3]], [['S', -12.5, 18, -9, 68], [3, 5, -5]],
  // then round her shaded side, the gaze up the sunlit wall to the crown as the shadows of the two that stand sunward sink down it
  [['S', -10, 19.5, 1, 69], [4, 10, -8]], [['S', -10.5, 19, 6, 71], [5, 21, -12]], [['S', -8, 20, 11, 71.6], [5, 34, -14.5]], [['S', -2, 22, 13.5, 72], [3, 49, -13.5]], [['S', 5, 25, 12.5, 72], [2, 60, -11]], [['S', 9, 29, 8, 72], [1, 64, -9]],
  [['S', 7, 33, 3, 72], [1, 60, -12], 'ride1'],
  // down her upwind side and out under the mouth's upwind rim: the launch field falling away, the others standing
  [['S', 11, 27, 2, 72], [2, 40, -12]], [['S', 12, 20, 7, 72], [-4, 22, -14]], [['S', 8, 13, 10, 72], [-6, 4, -8]], [['S', 4.5, 6, 7.5, 72], [-3, -12, 2]], [['S', 1.5, 0, 5.2, 72], [0, -30, 30]],
  [['S', 0.5, -3.5, 5, 72], [0, -34, 60], 'low'], [['S', -0.5, -4.8, 4.8, 72], [-2, -34, 66]], [['S', -1.6, -4.2, 4.9, 72], [-3, -36, 56]], [['S', -3, -1, 4.8, 72], [-2, -34, 52]],
  // back in, and once round the flame in the cone as the air aloft carries us: the look down, the river and the fields
  [['S', -6, 4, 3, 72], [0, -24, 6]], [['S', -7, 8, -3, 72], [2, -34, 2]], [['S', -2.5, 10.5, -7, 72], [1, -46, 2]], [['S', 4.5, 11.5, -7.5, 72], [-1, -54, 0]], [['S', 8, 12, -1, 72], [-3, -60, -6]], [['S', 7.5, 9, 4.5, 72], [-4, -60, -12]], [['S', 4.8, 6, 6.8, 72], [-3, -60, -24]],
  [['S', 1.5, 3.5, 7, 72], [-3, -60, -30], 'station'],
  // down to the mouth's west rim, under it between the cables, and out into the open air: the whole dawn
  [['S', -2.5, 2.6, 6.6, 72], [-2, -60, -32]], [['S', -5.4, 2.2, 4.2, 72], [-4, -56, -26]], [['S', -6.2, 1.0, 1.6, 72], [-10, -40, -40]], [['S', -5.6, -0.8, 0.8, 72], [-16, -20, -60]], [['S', -5, -2.8, 0.6, 72], [-12, 0, -85]],
  [['S', -4.8, -4.8, 0.4, 72], [0, 14, -95], 'pano'], [['B', -12, -6, -2], [0, 14, -95]], [['B', -23, -3, -10], [0, 14, -95], 'dawn'], [['B', -36, 8, -22], [12, 14, -95]],
  // round, and back to look at her whole, aloft; then up over her shoulder and down her own axis to the open valve and the ring
  [['B', -50, 28, -36], [30, 24, -40]], [['B', -62, 54, -46], [5, 32, -27], 'back'],
  [['B', -60, 68, -41], [10, 40, -23]], [['B', -54, 81, -35], [50, 44, 0]], [['B', -45, 92, -30.5], [250, 20, -10], 'over'],
  [['B', -30, 97, -31.5], [120, 50, -6]], [['B', -14, 99.5, -32.6], [0, 70.935, 0]], [['B', -2, 98.8, -32.1], [0, 70.935, 0], 'axis'],
  [['B', 0, 88.3, -28.7], [0, 70.935, 0]], [['B', 0, 77.9, -25.3], [0, 66, 0]], [['S', 0, 70.935, 0, 72], [0, 50, 0], 'end']];

// a curve through rows that rests where two rows agree and never swings past a row (a monotone cubic)
function monotone(xs, ys) {
  const n = xs.length, tg = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) { const h0 = xs[i] - xs[i - 1], h1 = xs[i + 1] - xs[i], s0 = (ys[i] - ys[i - 1]) / h0, s1 = (ys[i + 1] - ys[i]) / h1; if (s0 * s1 > 0) { const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0; tg[i] = (w0 + w1) / (w0 / s0 + w1 / s1); } }
  return (x) => { const m = clamp(x, xs[0], xs[n - 1]); let i = 0; while (i < n - 2 && m > xs[i + 1]) i++; const h = xs[i + 1] - xs[i], f = (m - xs[i]) / h, f2 = f * f, f3 = f2 * f;
    return (2 * f3 - 3 * f2 + 1) * ys[i] + (f3 - 2 * f2 + f) * h * tg[i] + (3 * f2 - 2 * f3) * ys[i + 1] + (f3 - f2) * h * tg[i + 1]; };
}

export function makeRoute() {
  const full = { th: 0, hf: 400, H: 0, open: 0 }, v = new THREE.Vector3();
const deg = ROWS.map(([p]) => (p[0] === 'W' ? 0 : (p[0] === 'B' ? 72 : p[4]))), m0 = scPoint(0, 0, 0, { ...full, th: 72 * DEG }, new THREE.Vector3());
  const pts = ROWS.map(([p]) => (p[0] === 'W' ? [p[1], p[2], p[3]] : p[0] === 'B' ? [m0.x + p[1], m0.y + p[2], m0.z + p[3]] : scPoint(p[1], p[2], p[3], { ...full, th: p[4] * DEG }, v).toArray()));
  const path = makePath(pts), L = path.length, M = new Float64Array(pts.length);
  // the metres flown at each row: the curve passes row k at k/(n-1) of its own measure
  { const len = path.curve.getLengths(), D = len.length - 1; for (let k = 0; k < pts.length; k++) { const x = D * k / (pts.length - 1), i = Math.min(D - 1, Math.floor(x)); M[k] = len[i] + (len[i + 1] - len[i]) * (x - i); } M[0] = 0; M[pts.length - 1] = L; }
  const names = {}; ROWS.forEach((r, i) => { if (r[2]) names[r[2]] = M[i]; });
  const thOf = monotone(Array.from(M), deg.map((d) => d * DEG));
  const gz = [0, 1, 2].map((c) => monotone(Array.from(M), ROWS.map((r) => r[1][c])));
  // THE LAWS BY THE METRES FLOWN
  const K = names, liftB = K.station - 8;
  const laws = (m, o = {}) => {
    o.m = m; o.th = thOf(m);
    o.hf = m < K.ride0 ? 20 + 0.6 * m : 400;                                               // the filling: its front runs up the envelope
    o.burn = Math.max(ss(m, K.far - 8, K.far + 6) * (1 - ss(m, K.ride1 + 2, K.ride1 + 14)), 0.55 * ss(m, K.low + 8, K.low + 20) * (1 - ss(m, K.station + 6, K.station + 18)), 0.8 * ss(m, K.back - 34, K.back - 16) * (1 - ss(m, K.over - 8, K.over + 6)));   // the blasts
    // the lift: off the meadow by 100 m as she stands, then away to the height of the looks down, and slowly on
    o.H = 100 * ss(m, K.ride1 - 14, K.ride1 + 30) + (LIFT - 100) * ss(m, K.low + 2, liftB) + 0.25 * Math.max(0, m - liftB);
    // and its drift: the air aloft carries her to the river, 260 m by the wide look
    { const d = DRIFT * ss(m, K.low + 2, K.station + 12) + 0.25 * Math.max(0, m - K.station - 12); o.dx = SD[0] * d; o.dz = SD[1] * d; }
    o.open = ss(m, K.pano - 4, K.pano + 8);                                                // the valve: its iris draws open while we look out, open before the crown is seen again
    o.shaft = 1;                                                                           // the sunbeam through it
    return o;
  };
  return { path, pts, M, names, laws, L, gaze: (m, st, out) => scPoint(gz[0](m), gz[1](m), gz[2](m), st, out) };
}

// the other balloons: where each stands on the meadow (x, z), how high its mouth is over the land at the start, how much of our
// own lift it shares, its pattern (0 gores, 1 spiral, 2 hoops, 3 zigzag, 4 belt) and colours, and whether its burner glows
const PAL = { cr: [0.62, 0.03, 0.05], ta: [0.92, 0.27, 0.03], sa: [0.96, 0.62, 0.06], te: [0.03, 0.42, 0.40], co: [0.05, 0.11, 0.56], pl: [0.36, 0.05, 0.36], cm: [0.86, 0.80, 0.64], bk: [0.03, 0.03, 0.04], gr: [0.08, 0.36, 0.10], sk: [0.22, 0.48, 0.86], pk: [0.86, 0.22, 0.42], wh: [0.9, 0.9, 0.88] };
const SD = [SUN.x / Math.hypot(SUN.x, SUN.z), SUN.z / Math.hypot(SUN.x, SUN.z)], PD = [-SD[1], SD[0]];
const sunward = (t, l) => [SD[0] * t + PD[0] * l, SD[1] * t + PD[1] * l];
export const OTHERS = [
  // those whose shadows cross our cloth: sunward of us, aloft or standing
  { at: sunward(112, -34), base: 15, share: 0.1, ds: 0.0, pat: 1, c: ['cr', 'cm', 'co'], glow: 1, cast: 1 },
  { at: sunward(150, 40), base: 15, share: 0.1, ds: 0.25, pat: 0, c: ['te', 'sa', 'sa'], glow: 1, cast: 1 },
  { at: sunward(260, -120), base: 30, share: 0.34, pat: 3, c: ['pl', 'sa', 'sa'], glow: 0.7 },
  { at: [-170, -110], base: 78, share: 0.5, pat: 2, c: ['co', 'wh', 'cr'], glow: 0.6 },
  // two that leave the meadow with us and climb under us
  { at: [-64, -104], base: 15, share: 0.42, ds: 1.1, pat: 4, c: ['sk', 'cr', 'cr'], glow: 1 }, { at: [-20, 310], base: 15, share: 0, pat: 1, c: ['sa', 'ta', 'cr'], glow: 1 },
  // standing about the field, their burners glowing in turn
  { at: [-98, -28], base: 15, share: 0, pat: 0, c: ['sa', 'cr', 'cr'], glow: 1 }, { at: [-135, 127], base: 15, share: 0, pat: 1, c: ['pl', 'ta', 'sa'], glow: 1 },
  { at: [132, 44], base: 15, share: 0, pat: 3, c: ['cr', 'wh', 'wh'], glow: 1 }, { at: [-58, 158], base: 15, share: 0, pat: 4, c: ['cr', 'sa', 'sa'], glow: 1 },
  { at: [156, -28], base: 15, share: 0, pat: 1, c: ['pk', 'pl', 'cm'], glow: 1 }, { at: [-196, -66], base: 15, share: 0, pat: 2, c: ['ta', 'co', 'sa'], glow: 1 },
  { at: [44, 196], base: 15, share: 0, pat: 0, c: ['co', 'ta', 'ta'], glow: 1 }, { at: [-132, -156], base: 15, share: 0, pat: 3, c: ['co', 'sa', 'sa'], glow: 1 },
  { at: [196, 126], base: 15, share: 0, pat: 4, c: ['cr', 'cm', 'cm'], glow: 1 },
  // aloft toward the sun, at our height and under it by the wide look
  { at: sunward(300, 210), base: 40, share: 0.8, pat: 3, c: ['cr', 'sa', 'sa'], glow: 0.8 }, { at: sunward(380, -140), base: 120, share: 0.35, pat: 0, c: ['pl', 'cm', 'cm'], glow: 0.7 },
  { at: sunward(560, 120), base: 90, share: 0.6, pat: 2, c: ['te', 'wh', 'ta'], glow: 0.6 }, { at: sunward(820, -60), base: 200, share: 0.3, pat: 1, c: ['co', 'sa', 'cr'], glow: 0.5 },
  { at: sunward(450, 60), base: 250, share: 0.2, pat: 4, c: ['sa', 'cr', 'cr'], glow: 0.5 }, { at: sunward(620, -220), base: 300, share: 0.1, pat: 0, c: ['co', 'wh', 'wh'], glow: 0.4 },
  { at: sunward(700, 260), base: 180, share: 0.4, pat: 1, c: ['gr', 'sa', 'cr'], glow: 0.4 }, { at: sunward(980, 180), base: 330, share: 0.1, pat: 2, c: ['cr', 'wh', 'co'], glow: 0.3 },
  { at: sunward(1150, -320), base: 280, share: 0.2, pat: 3, c: ['ta', 'pl', 'pl'], glow: 0.3 }, { at: sunward(1300, 40), base: 360, share: 0.1, pat: 0, c: ['pk', 'cm', 'cm'], glow: 0.3 },
  { at: sunward(1500, -140), base: 300, share: 0.1, pat: 1, c: ['te', 'sa', 'wh'], glow: 0.2 }, { at: sunward(1700, 300), base: 380, share: 0.1, pat: 4, c: ['co', 'sa', 'sa'], glow: 0.2 },
  // already aloft, near and far
  { at: [-240, -300], base: 150, share: 0.6, pat: 0, c: ['cr', 'sa', 'sa'], glow: 0.5 }, { at: [330, -210], base: 230, share: 0.7, pat: 1, c: ['co', 'sk', 'wh'], glow: 0.5 },
  { at: [-420, 120], base: 190, share: 0.65, pat: 2, c: ['gr', 'cm', 'gr'], glow: 0.5 }, { at: [260, 420], base: 300, share: 0.8, pat: 3, c: ['pl', 'pk', 'pk'], glow: 0.4 },
  { at: [-90, -620], base: 340, share: 0.85, pat: 4, c: ['ta', 'co', 'co'], glow: 0.4 }, { at: [620, -520], base: 420, share: 0.9, pat: 0, c: ['te', 'wh', 'wh'], glow: 0.3 },
  { at: [-700, -380], base: 380, share: 0.9, pat: 1, c: ['cr', 'cm', 'sa'], glow: 0.3 }, { at: [150, -900], base: 520, share: 0.95, pat: 2, c: ['sa', 'cr', 'pl'], glow: 0.3 },
  { at: [-1100, 300], base: 460, share: 0.95, pat: 0, c: ['sk', 'wh', 'wh'], glow: 0.2 }, { at: [900, 500], base: 560, share: 0.95, pat: 3, c: ['gr', 'sa', 'sa'], glow: 0.2 }];
const LYING = [{ at: [-88, 96], c: ['co', 'sa', 'cr'], pat: 1, hf: 44 }, { at: [124, 152], c: ['cr', 'cm', 'cm'], pat: 0, hf: 70 }, { at: [-215, 95], c: ['te', 'pk', 'sa'], pat: 3, hf: 30 }, { at: [214, 22], c: ['pl', 'sa', 'sa'], pat: 2, hf: 56 }];

// a lying, half-filled balloon as the others' material draws it (uv = gore, share of the height)
function lyingGeometry(hf) {
  const NG = 24, NR = 22, W = NG + 1, pos = [], nor = [], uv = [], idx = [], st = { th: 0, hf, H: 0 }, fr = frameOf(0), sec = {};
  for (let j = 0; j <= NR; j++) { sectionOf(EV.H * Math.pow(j / NR, 0.9), st, fr, sec);
    for (let i = 0; i < W; i++) { const a = TAU * i / NG, c = Math.cos(a), s = Math.sin(a), nl = Math.hypot(sec.b * c, sec.ax * s) || 1; pos.push(sec.ax * c, Math.max(sec.cy + sec.b * s, 0.05), sec.cz); nor.push(sec.b * c / nl, sec.ax * s / nl, 0); uv.push(i, j / NR); } }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NG; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
  const base = pos.length / 3, bg = new THREE.BoxGeometry(4.6, 3.6, 3.4), bp = bg.attributes.position, bn = bg.attributes.normal;
  for (let i = 0; i < bp.count; i++) { pos.push(bp.getX(i), bp.getY(i) + 2.05, bp.getZ(i) - 3.5); nor.push(bn.getX(i), bn.getY(i), bn.getZ(i)); uv.push(0, -1); }
  for (let i = 0; i < bg.index.count; i++) idx.push(base + bg.index.getX(i)); bg.dispose();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

// the flame: two shells about one axis (y 0 to 1), the inner marked
function flameGeometry() {
  const a = new THREE.CylinderGeometry(1, 1, 1, 22, 16, true).translate(0, 0.5, 0), b = a.clone(), n = a.attributes.position.count, P = new Float32Array(n * 6), N = new Float32Array(n * 6), I = new Float32Array(n * 2), idx = [];
  P.set(a.attributes.position.array, 0); P.set(b.attributes.position.array, n * 3); N.set(a.attributes.normal.array, 0); N.set(b.attributes.normal.array, n * 3); I.fill(1, n);
  for (let i = 0; i < a.index.count; i++) idx.push(a.index.getX(i)); for (let i = 0; i < b.index.count; i++) idx.push(n + b.index.getX(i));
  a.dispose(); b.dispose();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('aIn', new THREE.BufferAttribute(I, 1)); g.setIndex(idx); return g;
}

export default {
  id: 'envelope-at-dawn',
  name: 'The Envelope at Dawn',
  category: 'interior',
  weirdness: 0.3,
  media: ['interior'],
  async build(ctx) {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#3a4a70');
    const LT = makeDawn(), U = LT.uniforms || LT.U, disposables = [];
    const R = makeRoute(), path = R.path, L = R.L;
    await ctx.yield();
    const rt = makeRng(hashSeed('envelope-at-dawn-trees:' + ctx.seed));

    // ------------------------------------------------------------------ the sky
    { const g = new THREE.SphereGeometry(1, 40, 20); disposables.push(g); const m = new THREE.Mesh(g, LT.sky()); m.renderOrder = -100; m.frustumCulled = false; m.name = 'sky'; scene.add(m); }
    await ctx.yield();

    // ------------------------------------------------------------------ the land, which sinks as we lift
    const land = new THREE.Group(); land.name = 'land'; scene.add(land);
    const trees = [];
    { for (let x = -1700; x < 1700; x += 34) for (const sgn of [-1, 1]) { if (rt() < 0.3) continue; const xx = x + rt.range(-12, 12), zz = riverZ(xx) + sgn * rt.range(22, 40); trees.push({ x: xx, z: zz, s: rt.range(4.5, 9) }); }
      for (let k = 0; k < 16; k++) { const a = TAU * (k + rt.range(-0.3, 0.3)) / 16, rr = rt.range(330, 470), cx = rr * Math.cos(a), cz = rr * Math.sin(a), n = rt.int(5, 10); if (Math.abs(cz - riverZ(cx)) < 60) continue; for (let i = 0; i < n; i++) trees.push({ x: cx + rt.range(-34, 34), z: cz + rt.range(-34, 34), s: rt.range(4.5, 10) }); }
      for (let k = 0; k < 9; k++) { const a = TAU * (k + rt.range(-0.2, 0.2)) / 9, da = rt.range(-0.5, 0.5); for (let rr = 520; rr < 1300; rr += rt.range(26, 40)) { const x = rr * Math.cos(a + da * (rr - 520) / 800), z = rr * Math.sin(a + da * (rr - 520) / 800); if (Math.abs(z - riverZ(x)) < 40) continue; trees.push({ x, z, s: rt.range(4, 8) }); } } }
    await ctx.yield();
    const lm = makeLandMap(trees);
    await ctx.yield();
    for (const step of lm.steps) { step(); await ctx.yield(); }
    lm.done(); disposables.push(lm.tex);
    const landMat = LT.land(lm.tex);
    { const lnd = makeLand(); disposables.push(lnd.geometry); for (const step of lnd.steps) { step(); await ctx.yield(); }
      const m = new THREE.Mesh(lnd.geometry, landMat); m.frustumCulled = false; m.name = 'meadow'; land.add(m); }
    await ctx.yield();
    { const g = treeGeometry(); disposables.push(g); const im = new THREE.InstancedMesh(g, LT.solid(true), trees.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      trees.forEach((t, i) => { m4.compose(new THREE.Vector3(t.x, landHeight(t.x, t.z) - 0.2, t.z), q.setFromEuler(e.set(0, rt() * TAU, 0)), new THREE.Vector3(t.s * rt.range(0.8, 1.1), t.s, t.s * rt.range(0.8, 1.1))); im.setMatrixAt(i, m4); });
      im.frustumCulled = false; im.name = 'trees'; land.add(im); disposables.push(im); }
    await ctx.yield();

    // ------------------------------------------------------------------ the other balloons
    const col3 = (list, k) => { const a = new Float32Array(list.length * 3); list.forEach((o, i) => a.set(PAL[o.c[k]], i * 3)); return new THREE.InstancedBufferAttribute(a, 3); };
    const ro = makeRng(hashSeed('envelope-at-dawn-others:' + ctx.seed));
    const og = otherGeometry(); disposables.push(og);
    og.setAttribute('aC1', col3(OTHERS, 0)); og.setAttribute('aC2', col3(OTHERS, 1)); og.setAttribute('aC3', col3(OTHERS, 2));
    { const a = new Float32Array(OTHERS.length * 4); OTHERS.forEach((o, i) => { o.ph = ro() * TAU; o.rate = ro.int(3, 5); o.dr = ro.range(3, 8); o.dp = ro() * TAU; a.set([o.pat, o.ph, o.rate, o.glow], i * 4); }); og.setAttribute('aK', new THREE.InstancedBufferAttribute(a, 4)); }
    const others = new THREE.InstancedMesh(og, LT.others(), OTHERS.length); others.frustumCulled = false; others.name = 'other-balloons'; others.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(others); disposables.push(others);
    await ctx.yield();
    for (const ly of LYING) { const g = lyingGeometry(ly.hf); disposables.push(g);
      const one = (k) => new THREE.InstancedBufferAttribute(new Float32Array(PAL[ly.c[k]]), 3);
      g.setAttribute('aC1', one(0)); g.setAttribute('aC2', one(1)); g.setAttribute('aC3', one(2)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array([ly.pat, 0, 3, 0]), 4));
      const im = new THREE.InstancedMesh(g, others.material, 1); im.setMatrixAt(0, new THREE.Matrix4().makeRotationY(ro.range(-0.12, 0.12)).setPosition(ly.at[0], landHeight(ly.at[0], ly.at[1]), ly.at[1])); im.frustumCulled = false; im.name = 'lying-balloon'; land.add(im); disposables.push(im); }
    await ctx.yield();

    // ------------------------------------------------------------------ our envelope: the cloth, the rip top
    const cloth = makeCloth(LT.cloth(false)); disposables.push(cloth.geometry); scene.add(cloth.mesh);
    const panel = makePanel(LT.cloth(true)); disposables.push(panel.geometry); scene.add(panel.mesh);
    await ctx.yield();
    // ------------------------------------------------------------------ basket, burner, cables, fan
    const solid = LT.solid(false);
    const basket = new THREE.Mesh(basketGeometry(), solid); disposables.push(basket.geometry); basket.name = 'basket'; basket.frustumCulled = false; scene.add(basket);
    const cables = makeCables(solid); disposables.push(cables.geometry); scene.add(cables.mesh);
    const fan = new THREE.Mesh(fanGeometry(), solid); disposables.push(fan.geometry); fan.position.set(-7.5, 0, 4.5); fan.rotation.y = 0.32; fan.name = 'fan'; land.add(fan);
    const blades = new THREE.Mesh(fanBladesGeometry(), solid); disposables.push(blades.geometry); blades.position.set(0, 2.1, 0.45); blades.name = 'fan-blades'; fan.add(blades);
    await ctx.yield();
    // ------------------------------------------------------------------ the flame, its glow, the sun's shaft through the open top
    const flameMat = LT.flame();
    const flame = new THREE.Mesh(flameGeometry(), flameMat); disposables.push(flame.geometry); flame.frustumCulled = false; flame.renderOrder = 8; flame.name = 'flame'; scene.add(flame);
    const glowMat = LT.glow();
    const glow = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), glowMat); disposables.push(glow.geometry); glow.frustumCulled = false; glow.renderOrder = 9; glow.name = 'flame-glow'; scene.add(glow);
    const stUp = { th: EV.UP, hf: 400, H: 0, open: 1 };
    const shaft = new THREE.Mesh(shaftGeometry(stUp), LT.shaft()); disposables.push(shaft.geometry); shaft.frustumCulled = false; shaft.renderOrder = 7; shaft.name = 'sun-shaft'; scene.add(shaft);
    await ctx.yield();

    // ------------------------------------------------------------------ the flight
    const st = {}, fr = {}, v = new THREE.Vector3(), v2 = new THREE.Vector3(), g = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), YU = new THREE.Vector3(0, 1, 0), size = new THREE.Vector2();
    const corners = [[1.65, 6, -1.6], [-1.65, 6, -1.6], [-1.65, 6, 1.6], [1.65, 6, 1.6]];
    const setAll = (u, t) => {
      const m = clamp(u, 0, 1) * L; R.laws(m, st); frameOf(st.th, fr);
      const tt = t % EV.LOOP;
      land.position.set(-st.dx, -st.H, -st.dz); U.uGround.value = -st.H;
      cloth.update(st, t); panel.update(st, t);
      // the basket tips up about its lower edge; the burner frame rides on it
      basket.position.set(0, fr.by, fr.bz); basket.rotation.x = fr.be - Math.PI / 2; basket.updateMatrixWorld();
      for (let k = 0; k < 4; k++) { v.set(corners[k][0], corners[k][1], corners[k][2]).applyMatrix4(basket.matrixWorld); cables.set(k, v, cloth.rim(3 - k, v2)); }
      // the flame: from the burner into the middle of the mouth
      scPoint(0, 0, 0, st, v2); v.set(0, fr.fy, fr.fz); g.subVectors(v2, v).normalize();
      flame.position.copy(v).addScaledVector(g, 0.9); flame.quaternion.setFromUnitVectors(YU, g);
      const flick = 0.9 + 0.1 * Math.sin(TAU * 37 * tt / EV.LOOP) * Math.sin(TAU * 23 * tt / EV.LOOP);
      flameMat.uniforms.uLen.value = 2.2 + 13.5 * st.burn; flameMat.uniforms.uRad.value = 0.6 + 1.1 * st.burn; flameMat.uniforms.uPow.value = (0.25 + 0.75 * st.burn) * flick;
      U.uBurnP.value.copy(v).addScaledVector(g, 2 + 5 * st.burn); U.uBurn.value = (0.03 + st.burn) * flick;
      glow.position.copy(U.uBurnP.value); glowMat.uniforms.uPow.value = 0.02 + 0.07 * st.burn * flick; glowMat.uniforms.uSize.value = 10 + 18 * st.burn;
      blades.rotation.z = TAU * 60 * tt / EV.LOOP;
      // the light thrown about inside; the top
      const up = ss(st.th, 0.06, 0.75);
      U.uAmb.value.set(0.15, 0.10, 0.07).multiplyScalar(1 + 0.6 * up); U.uAmb.value.x += 0.03 * st.open; U.uAmb.value.y += 0.045 * st.open; U.uAmb.value.z += 0.07 * st.open;
      U.uHf.value = st.hf; U.uUp.value = up; U.uOpen.value = st.open; U.uTime.value = tt; shaft.material.uniforms.uGain.value = st.shaft;
      scPoint(0, EV.H, 0, st, U.uHoleC.value); U.uHoleN.value.set(0, fr.s, -fr.c);
      // the other balloons: their height by the metres flown, their drift and bob by the clock
      const bal = U.uBal.value, balG = landMat.uniforms.uBalG.value; let kb = 0;
      for (let i = 0; i < OTHERS.length; i++) { const o = OTHERS[i], up0 = o.base + o.share * st.H, free = clamp((up0 - 15) / 30, 0, 1);
        const ds = o.ds === undefined ? o.share : o.ds, lx = o.at[0] + ds * st.dx + free * o.dr * Math.sin(TAU * tt / EV.LOOP + o.dp), lz = o.at[1] + ds * st.dz + free * o.dr * Math.cos(TAU * tt / EV.LOOP + o.dp * 1.7);   // on the land
        const over = up0 + (1 - free) * landHeight(lx, lz) + free * 1.2 * Math.sin(TAU * 2 * tt / EV.LOOP + o.ph), x = lx - st.dx, z = lz - st.dz, y = over - st.H;
        m4.compose(v.set(x, y, z), q.setFromEuler(e.set(0, o.ph, 0)), one); others.setMatrixAt(i, m4);
        if (o.cast && kb < EV.NB) bal[kb++].set(x, y + 46, z, 30);
        // its shadow on the land: a place of its own in the list, fading out between 800 and 900 m from the meadow's middle
        if (i < 23) balG[i].set(lx, over, lz, 1 - ss(Math.hypot(lx, lz), 800, 900)); }
      for (; kb < EV.NB; kb++) bal[kb].w = 0;
      scPoint(0, 0, 0, st, v); balG[23].set(v.x + st.dx, v.y + st.H, v.z + st.dz, ss(up, 0.35, 0.85));   // our own, coming on as she stands
      others.instanceMatrix.needsUpdate = true;
    };
    setAll(0, 0);
    const gazeAt = (t, u) => { const m = clamp(u, 0, 1) * L; return R.gaze(m, R.laws(m, gst), g2); }, gst = {}, g2 = new THREE.Vector3();
    // the pace: slow through the standing up and at the look down
    const K = R.names, pace = (u) => { const m = u * L; return 1.3 - 0.68 * ss(m, K.ride0 - 14, K.ride0 + 6) * (1 - ss(m, K.ride1 + 4, K.ride1 + 20)) - 0.3 * ss(m, K.far - 20, K.far) * (1 - ss(m, K.ride0 - 14, K.ride0 + 6))
      - 0.2 * ss(m, K.ride1 - 28, K.ride1 - 20) * (1 - ss(m, K.ride1 - 2, K.ride1 + 8))
      - 0.6 * ss(m, K.ride1 + 2, K.ride1 + 14) * (1 - ss(m, K.pano + 6, K.pano + 24)) - 0.25 * ss(m, K.ride1 + 18, K.ride1 + 28) * (1 - ss(m, K.low + 4, K.low + 12))
      - 0.2 * ss(m, K.pano - 20, K.pano - 4) * (1 - ss(m, K.dawn - 4, K.dawn + 10)) - 0.35 * ss(m, K.back - 14, K.back) * (1 - ss(m, K.back + 6, K.back + 20)) - 0.3 * ss(m, K.over - 8, K.over + 4); };
    return {
      scene, path, duration: DUR, pace, title: 'The Envelope at Dawn', ride: 'none',
      camera: { fov: 62, near: 0.4, far: 9000, lookAhead: 14, sway: 0.35, bank: 0.2 },
      pois: [{ at: gazeAt, from: -0.2, to: 1.2, weight: 0.86, fade: 0.05 }],
      portal: { shape: 'circle', radius: 7.4, color: '#4fb4ff', glow: 0.7, revealDistance: Math.max(60, (L - K.back) / 0.6), blendDistance: 24, tilt: true },
      post: { exposure: 1.05, bloom: { strength: 0.36, radius: 0.7, threshold: 0.92 }, grade: { saturation: 1.08, contrast: 1.05, tint: '#fff8ee', shadowTint: '#0a1024', vignette: 0.28, grain: 0.015, aberration: 0 } },
      update(dt, t, camera, u = 0) {
        setAll(u, t);
        ctx.renderer.getDrawingBufferSize(size); U.uPx.value = size.y * camera.projectionMatrix.elements[5] * 0.5;
      },
      dispose() { for (const d of disposables) d.dispose(); LT.dispose(); },
    };
  },
};
