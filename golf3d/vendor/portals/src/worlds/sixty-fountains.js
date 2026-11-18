// SIXTY FOUNTAINS: a frosty late-autumn morning in a Japanese mountain valley of steep thatched farmhouses, on the one
// day a year the fire cannons are tested. As a red dragonfly we come up the lane, slide under an eave hung with drying
// persimmons, a hydrant hut bangs open, and fountain after fountain rises up the valley ahead of us until sixty fans of
// water stand over the roofs at once; the largest house fires last and its two jets cross over the exit portal.
//
// Layout (layout space: +X east, the camera travels toward -Z; every look but "golden" mirrors X, so the eave and its
// strings pass on the right with the sun to the left, and in the golden look the low sun stands on the other side
// of the valley): hamlet of six houses along the lane (Z -50..-250), terraced paddies (Z -246..-414), the main village of
// 52 houses + the hero house on its terrace at (-20, -657). Everything scripted is a pure function of u: every fan has a
// threshold in u, nothing runs at u = 0.
// Looks by seed / ctx.vary.hour: morning (default), golden (late afternoon, mirrored), dusk (paper screens glow, fans
// floodlit, pink peaks), mist (dawn valley fog); season "late" by seed (snow lying on the thatch, bare maples, heavy
// frost); in the mist look the village stands in a real fog bank (lit puffs over a filler sheet; roofs, walls and props fade into it by height,
// the fans are cut off under its top and punch out of it, and it thins to haze as we come down into it); cast by seed (persimmons or radish and corn, crows or sparrows, thick or thin dragonflies, a second fire
// truck). Rare event: a sunlit snow squall at the top of the climb, and one gust that leans every fan the same way.
// The water is read against black: two groves of 45 m cedar stand behind the hamlet's first fans, a clump behind the veil
// jet, and the head wall is tall enough that the village fans stand under its line from the lane. The snow range beyond
// is this world's own smooth height field (makeFarRange), not the kit's faceted ridges. Where a fan lands, the thatch goes
// dark and wet in streaks down to the eave (the village map's wet channel, gated in u like the wave), cutting the late season's snow. Things seen on one stretch only
// (eave house, groves, hamlet racks and fruit, village huts and racks, the hero's fruit strings) are hidden elsewhere.
// The wave: nothing runs at u = 0; two heralds beyond the paddies lean together at the lane's vanishing point from u 0.03, the first hut fires as we
// leave the eave, the hamlet's guns (six by the lane, two beside its last houses) through the run, the village from u 0.2 to 0.56 (WAVE0, WAVE1; the
// thatch's wet stripes in the parts file use the same two numbers), the hero last at 0.612. The hamlet's fields are a patchwork read from a small plot
// map (crop, row direction, frost) that the ground shader and the placing of stooks share; bunds, a kerb and stooks give them relief. Everything added
// with the plot map draws from its own stream (nr), so the older streams give what they gave.
// The dry ground beside the causeway and under the climb is ploughed in furrows that follow the lane (drawn by the ground shader) with rows of small stooks on the
// ridges between them (instanced, in the thatch material, their own stream and their own sheet of ground shadows). The valley floor is lit flat near the eye: the
// kit's bump is switched off there (it smeared the floor under the low sun), and the floor's fine noise uses a hash of its own that keeps its precision far from z = 0.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeCloudField, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeFountains, Geo, GLSL_NOISE, makeVapour, makeThatchMaterial, buildRoof, hangRadish, hangCorn } from '../parts/sixty-fountains.js';

const PALETTE = ['#0E1C18', '#6B5B45', '#5C9AD4', '#F3F8FB', '#F07A1C', '#B4261C', '#E8BC2A'];
const TAN60 = Math.tan(Math.PI / 3), TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bell = (x, c, w) => { const t = clamp(1 - Math.abs(x - c) / w, 0, 1); return t * t * (3 - 2 * t); };

const LOOKS = {
  morning: { mx: -1, preset: 'day', sky: { zenith: '#2F6FB8', mid: '#4f8ed0', horizon: '#a9cdea', ground: '#56708a', horizonPow: 5, scatterColor: '#fff2da', scatter: 0.3 },
    sunEl: 22, sunAz: 50, sun: '#FFEBC8', sunI: 4.1, hemi: ['#a6c8f4', '#8c8168', 1.5], fog: '#a8c8ea', fogD: 0.00057, exposure: 1.0, bloom: 0.44, shStr: 0.3, contrast: 1.05, haze: 0.8, shC: [0.25, 0.3, 0.47], shK: 1, fill: [0.5, 0.4, 0.27],
    water: '#F3F8FB', shade: '#7FA3C8', fsun: '#FFE9C4', glow: 0.34, frost: 0.8, ridgeSun: '#fff4e2', portal: '#ffe0a8', pglow: 1.3, tint: '#fbfdff', shadow: '#0c1a24', sat: 1.08, groundFog: 0 },
  golden: { mx: 1, preset: 'goldenHour', sky: { zenith: '#2c62a8', mid: '#5e8ecb', horizon: '#ffd09a', ground: '#6a6258', horizonPow: 7, scatterColor: '#ffc078', scatter: 0.6 },
    sunEl: 13, sunAz: 52, sun: '#ffbe76', sunI: 3.8, hemi: ['#9db4e0', '#c09868', 2.0], fog: '#d8b48c', fogD: 0.0005, exposure: 1.15, bloom: 0.46, contrast: 1.0, shStr: 0.32, shCol: '#3a3050', shC: [0.4, 0.36, 0.55], shK: 1, fill: [0.5, 0.36, 0.22],
    water: '#fff0d8', shade: '#b89a86', fsun: '#ffc888', glow: 0.3, frost: 0.15, ridgeSun: '#ffc892', portal: '#ffe2b8', tint: '#fff7ec', shadow: '#241a22', sat: 1.15, groundFog: 0 },
  dusk: { mx: -1, preset: 'blueHour', sky: { zenith: '#101c4c', mid: '#2c3f86', horizon: '#8f7fb4', ground: '#1c2444', scatterColor: '#ff9aa0', scatter: 0.7, stars: 0.35, bodies: [] },
    sunEl: -5, sunAz: 62, sun: '#8ea6ec', sunI: 1.25, hemi: ['#8a9cf0', '#2c3252', 2.0], fog: '#34427a', fogD: 0.0007, exposure: 1.2, bloom: 0.48,
    water: '#f4f8ff', shade: '#8fa4d8', fsun: '#bcd0ff', glow: 2.4, frost: 0.6, ridgeSun: '#ff9aa6', portal: '#ffd9a0', tint: '#f4f2ff', shadow: '#060a22', sat: 1.08, groundFog: 0 },
  mist: { mx: -1, preset: 'dawn', sky: { zenith: '#3f78bc', mid: '#86aad2', horizon: '#f0d8c4', ground: '#8a94a4', horizonPow: 3.5, scatterColor: '#ffd9b0', scatter: 0.55 },
    sunEl: 13, sunAz: 58, sun: '#ffd09a', sunI: 4.2, hemi: ['#b4c6e8', '#9c8c66', 1.35], fog: '#cdd6e6', fogD: 0.001, exposure: 1.0, bloom: 0.5, shStr: 0.3, shCol: '#3a3050', shC: [0.56, 0.6, 0.76], shK: 0.7, fill: [0.56, 0.44, 0.28],
    water: '#fbf6ee', shade: '#7e93b8', fsun: '#ffd9a6', glow: 0.25, frost: 0.64, ridgeSun: '#ffe4c8', portal: '#ffe0a8', pglow: 1.3, tint: '#fdfbf7', shadow: '#0a1220', sat: 1.02, groundFog: 1 },
};

// ---------------------------------------------------------------------------------------------------------------------
// Small shared builders (all write into the hero's Geo accumulators so the whole valley is in one hand).
function lattice(S, rng, timber, paper, x, y, z, w, h, nxz, face) {   // paper screen with frame and bars; face = [nx, nz] outward
  const [fxn, fzn] = face, ax = Math.abs(fzn), az = Math.abs(fxn), tcol = timber();
  const pc = rng.chance(0.2) ? mix3(paper, [0.62, 0.55, 0.36], 0.35) : mul(paper, rng.range(0.9, 1.05));
  S.box(x + fxn * 0.05, y, z + fzn * 0.05, ax * w + az * 0.06, h, az * w + ax * 0.06, pc, { gb: 0.92, top: 1, noBottom: true });
  const bar = (u, v, bw, bh) => S.box(x + fxn * 0.1 + ax * u, y + v, z + fzn * 0.1 + az * u, ax * bw + az * 0.07, bh, az * bw + ax * 0.07, tcol, { gb: 1, top: 1, noBottom: true });
  bar(0, h / 2, w + 0.12, 0.09); bar(0, -h / 2, w + 0.12, 0.11); bar(-w / 2, 0, 0.09, h); bar(w / 2, 0, 0.09, h);
  for (let i = 1; i < nxz; i++) bar(-w / 2 + (w * i) / nxz, 0, 0.045, h);
  const ny = Math.max(1, Math.round(h / 0.75)); for (let i = 1; i < ny; i++) bar(0, -h / 2 + (h * i) / ny, w, 0.04);
}
function logs(S, rng, x0, y0, z0, nu, nv, axis, dirn, len) {            // a stack of split firewood, cut ends pale
  for (let v = 0; v < nv; v++) for (let u = 0; u < nu - (v % 2); u++) {
    const r = rng.range(0.11, 0.15), uu = (u + (v % 2) * 0.5) * 0.27 + rng.range(-0.02, 0.02), yy = y0 + 0.14 + v * 0.235, l = len * rng.range(0.85, 1.08);
    const col = mul(mix3([0.2, 0.15, 0.1], [0.11, 0.09, 0.07], rng()), rng.range(0.8, 1.2)), end = mul([0.5, 0.4, 0.26], rng.range(0.7, 1.15));
    if (axis === 'z') S.cyl([x0 + uu, yy, z0], [x0 + uu, yy, z0 + dirn * l], r, r, 5, col, { cap: true, capCol: end });
    else S.cyl([x0, yy, z0 + uu], [x0 + dirn * l, yy, z0 + uu], r, r, 5, col, { cap: true, capCol: end });
  }
}
function stoneLantern(S, x, y, z, c) {
  const mossy = mix3(c, [0.13, 0.19, 0.08], 0.5);
  S.box(x, y + 0.16, z, 1.0, 0.32, 1.0, c, { tx: 0.85, tz: 0.85, noBottom: true }); S.box(x, y + 0.95, z, 0.36, 1.3, 0.36, c, { tx: 0.85, tz: 0.85, noBottom: true });
  S.box(x, y + 1.69, z, 0.92, 0.18, 0.92, c, { tx: 1.1, tz: 1.1 }); S.box(x, y + 2.06, z, 0.6, 0.56, 0.6, mul(c, 1.1), { noBottom: true });
  S.box(x, y + 2.5, z, 1.25, 0.34, 1.25, mossy, { tx: 0.3, tz: 0.3, gb: 0.8 }); S.box(x, y + 2.8, z, 0.22, 0.3, 0.22, mossy, { tx: 0.4, tz: 0.4, noBottom: true });
}

// One gassho farmhouse into S (solids) and Th (thatch): ground at y = 0, front gable plane at z = +L/2 facing +Z.
// o: { L, WX (half width of the walls), ridgeY, dTop (slope length ridge to eave), hi (near, full detail), far (cheapest), rng, noise, straw, timber(), paper, stone() }
async function buildGassho(ctx, S, Th, o) {     // async: hands the page back between the roof, the walls, the gables and the tufts
  const { L, WX, ridgeY, dTop, hi, far, rng, straw, timber, paper } = o, zF = L / 2, zB = -L / 2, TH = o.TH ?? 0.95, drop = 2 * TH + 0.1;
  const roof = await buildRoof(Th, S, { z0: zB - 1.2, z1: zF + 1.2, ridgeY, dTop, TH, noise: o.noise, rng, straw, timber: timber(), ridgeSag: rng.range(0.15, 0.35),
    eaveBand: !!hi, NZ: hi ? 16 : far ? 4 : 8, ND: hi ? 9 : far ? 2 : 4, NV: hi ? 9 : far ? 2 : 4, CS: hi ? 6 : far ? 3 : 4, BS: hi ? 6 : far ? 3 : 5, PS: hi ? 6 : far ? 1 : 2, nB: hi ? undefined : far ? 3 : 5 }, ctx);
  await ctx.yield();
  const yw = (x) => Math.max(0.3, ridgeY - drop - TAN60 * Math.abs(x)), hwAt = (y) => Math.min(WX, (ridgeY - drop - y) / TAN60), hW = yw(WX);
  // long walls under the eaves
  for (const sgn of [1, -1]) {
    const x = sgn * WX;
    S.box(x, hW / 2 + 0.1, 0, 0.16, hW + 0.2, L, mul(timber(), 0.9), { noBottom: true, gb: 0.7 });
    if (!far) S.box(x, 0.2, 0, 0.6, 0.4, L + 0.4, mul(o.stone(), 0.9), { noBottom: true });
    if (hi) {
      const nb = Math.round(L / 2.5), bw = L / nb;
      for (let i = 0; i <= nb; i++) S.box(x + sgn * 0.08, hW / 2, zB + i * bw, 0.28, hW, 0.28, timber(), { noBottom: true, gb: 0.7 });
      for (let i = 0; i < nb; i++) {
        const zc = zB + (i + 0.5) * bw, kind = rng(), kB = o.trim ? 0.14 : 0.35, kP = o.trim ? 0.35 : 0.6;      // the eave house: mostly paper screens, so at dusk the strings hang in front of glowing paper
        // By day the wall behind the eave house's strings is boards of the darkest, smoke-black timber from end to end, so the fruit glows against it (the bays it
        // had are still built, into a Geo that is thrown away: the stream is where it was). At dusk it keeps its paper screens: the strings hang before their glow.
        const dark = o.darkSide === sgn, S0 = S; if (dark) { S = o.dump || (o.dump = new Geo(0)); for (let k = 0; k < 4; k++) S0.box(x + sgn * 0.1, 0.5 + (hW - 0.6) / 2, zc + (k - 1.5) * (bw - 0.3) / 4, 0.06, hW - 0.6, (bw - 0.3) / 4 - 0.015, mul([0.046, 0.034, 0.025], 0.75 + 0.5 * (((i * 4 + k) * 0.618) % 1)), { noBottom: true, gb: 0.75 }); }
        if (kind < kB) for (let k = 0; k < 4; k++) S.box(x + sgn * (0.1 + rng.range(-0.01, 0.01)), 0.5 + (hW - 0.6) / 2, zc + (k - 1.5) * (bw - 0.3) / 4, 0.06, hW - 0.6, (bw - 0.3) / 4 - 0.015, timber(), { noBottom: true, gb: 0.75 });
        else if (kind < kP) {
          S.box(x + sgn * 0.1, 1.0 + (hW - 1.2) / 2, zc, 0.06, hW - 1.2, bw - 0.34, mul([0.5, 0.46, 0.38], rng.range(0.8, 1.05) * (o.trim ? 0.8 : 1)), { noBottom: true, gb: 0.8 });
          if (o.trim) {      // seen from 1.4 m: a waist rail, a head rail and three battens over the earth plaster
            const tc = [0.07, 0.05, 0.035], ph = hW - 1.2, py = 1.0 + ph / 2;
            for (const [ry, rh] of [[1.0 + ph * 0.42, 0.11], [1.0 + ph * 0.86, 0.08]]) S.box(x + sgn * 0.15, ry, zc, 0.07, rh, bw - 0.34, mul(tc, 1.2), { noBottom: true, gb: 1 });
            for (const k of [-1, 0, 1]) S.box(x + sgn * 0.14, py, zc + k * (bw - 0.34) * 0.3, 0.05, ph, 0.07, tc, { noBottom: true, gb: 1 });
          }
        }
        else lattice(S, rng, timber, paper, x + sgn * 0.06, 1.0 + Math.min(1.9, hW - 1.3) / 2 + 0.1, zc, bw - 0.6, Math.min(1.9, hW - 1.3), 3, [sgn, 0]);
        S = S0;
        S.box(x + sgn * 0.12, 0.7, zc, 0.1, 0.5, bw - 0.3, timber(), { noBottom: true });
      }
      S.box(x + sgn * 0.08, hW - 0.25, 0, 0.26, 0.26, L + 0.5, timber(), { noBottom: true });
    }
  }
  await ctx.yield();
  // gables: board infill, praying-hands rafters, storeys of paper screens
  const floors = []; for (let y = 3.3, st = 3.1; hwAt(y + 1.5) > 0.7; y += st, st = Math.max(2.1, st - 0.4)) floors.push(y);
  floors.push(floors[floors.length - 1] + 2.2);
  const gable = (zg, dir, front) => {
    const zo = (k) => zg + dir * k, nb = hi ? 22 : far ? 2 : 6;
    for (let i = 0; i < nb; i++) {
      const xa = -WX + (i * 2 * WX) / nb, xb = xa + (2 * WX) / nb, col = hi ? timber() : mul(timber(), 0.9 + 0.2 * (i % 2)), k = hi ? rng.range(0, 0.03) : 0;
      const A = [xa, 0.3, zo(k)], B = [xb, 0.3, zo(k)], C = [xb, yw(xb), zo(k)], D = [xa, yw(xa), zo(k)];
      if (dir > 0) S.quad(A, B, C, D, col, 0.7, 0.7, 1, 1); else S.quad(B, A, D, C, col, 0.7, 0.7, 1, 1);
    }
    for (const sgn of [1, -1]) {
      S.beam([sgn * (WX + 0.45), hW - 0.6, zo(0.3)], [0, ridgeY - drop, zo(0.3)], 0.45, 0.4, timber());
      if (hi) for (let k = 0; k < 5; k++) { const t = 0.1 + k * 0.2, xx = sgn * (WX + 0.4) * (1 - t), yy = hW - 0.2 + (ridgeY - 2.0 - hW) * t; S.cyl([xx, yy, zo(-0.2)], [xx, yy, zo(1.15)], 0.08, 0.065, 5, timber(), { cap: true, capCol: [0.3, 0.24, 0.16] }); }
    }
    if (hi) for (const px of [-WX, -WX / 2, WX / 2, WX]) S.box(px, yw(px) / 2, zo(0.1), 0.28, yw(px), 0.24, timber(), { noBottom: true, gb: 0.7 });
    for (let fi = 0; fi < floors.length - 1; fi++) {
      const y0 = floors[fi], y1 = floors[fi + 1], hw0 = hwAt(y0) + 0.45, h = y1 - y0 - 1.25, yc = y0 + 0.55 + h / 2, hwT = hwAt(yc + h / 2) - 0.6;
      S.box(0, y0, zo(0.18), hw0 * 2, 0.3, 0.38, timber(), { gb: 0.8 });
      if (hi) for (const sgn of [1, -1]) S.box(sgn * hw0, y0, zo(0.22), 0.26, 0.36, 0.55, [0.42, 0.44, 0.45], { gb: 0.8 });
      if (hwT < 0.6) continue;
      const n = Math.max(1, Math.floor((hwT * 2) / 1.5)), w = (hwT * 2) / n;
      if (hi) { for (let i = 0; i < n; i++) { const xc = -hwT + (i + 0.5) * w; if (rng.chance(0.12)) S.box(xc, yc, zo(0.07), w - 0.2, h, 0.07, timber(), { noBottom: true }); else lattice(S, rng, timber, paper, xc, yc, zg, w - 0.2, h, 3, [0, dir]); } }
      else {
        S.box(0, yc, zo(0.05), hwT * 2, h, 0.06, mul(paper, rng.range(0.88, 1.02)), { gb: 0.92, top: 1, noBottom: true });
        const tc = timber(), nn = far ? Math.min(2, n) : n; for (let i = 0; i <= nn; i++) S.box(-hwT + (i * hwT * 2) / nn, yc, zo(0.1), far ? 0.16 : 0.1, h, 0.07, tc, { noBottom: true, gb: 1 });
        S.box(0, yc, zo(0.1), hwT * 2, 0.06, 0.07, tc, { noBottom: true, gb: 1 });
      }
    }
    // ground floor: door, screens, sill
    const gh = Math.min(2.2, floors[0] - 1.1);
    if (front) { S.box(0, 1.3, zo(0.06), 2.2, 2.6, 0.08, [0.012, 0.011, 0.012], { noBottom: true, gb: 1 }); S.box(-0.55, 1.25, zo(0.14), 1.05, 2.5, 0.07, timber(), { noBottom: true }); }
    for (const sgn of [1, -1]) {
      const xa = front ? 1.5 : 0.2, xb = WX - 0.4, n = hi ? Math.max(1, Math.round((xb - xa) / 1.6)) : 1, w = (xb - xa) / n;
      for (let i = 0; i < n; i++) {
        const xc = sgn * (xa + (i + 0.5) * w);
        if (hi) lattice(S, rng, timber, paper, xc, 0.85 + gh / 2, zg, w - 0.2, gh, 3, [0, dir]);
        else { S.box(xc, 0.85 + gh / 2, zo(0.05), w - 0.2, gh, 0.06, mul(paper, rng.range(0.85, 1)), { gb: 0.92, top: 1, noBottom: true }); const tc = timber(); for (let k = 0; k <= 2; k += far ? 2 : 1) S.box(xc - (w - 0.2) / 2 + (k * (w - 0.2)) / 2, 0.85 + gh / 2, zo(0.1), 0.09, gh, 0.07, tc, { noBottom: true, gb: 1 }); }
      }
    }
    if (!hi && front && o.leanTo) {   // the tall house: a plain shingle lean-to across the gable, on posts
      const yA = floors[0] - 0.3, yB = yA - 0.85, w = WX + 0.35, gc = far ? [0.17, 0.16, 0.15] : mul(mix3([0.2, 0.19, 0.17], timber(), 0.3), 1.1);
      S.quad([-w, yB, zo(2.5)], [w, yB, zo(2.5)], [w, yA, zo(0.1)], [-w, yA, zo(0.1)], gc, 0.75, 0.75, 1.1, 1.1);
      S.quad([-w, yB - 0.12, zo(2.5)], [w, yB - 0.12, zo(2.5)], [w, yB, zo(2.5)], [-w, yB, zo(2.5)], mul(gc, 0.6), 1, 1, 1, 1);
      if (!far) for (const px of [-WX, 0, WX]) S.box(px, (yB - 0.1) / 2, zo(2.3), 0.22, yB - 0.1, 0.22, mul(gc, 0.7), { noBottom: true, gb: 0.7 });
    }
    if (hi && front) {   // shingle lean-to weighted with stones, on posts
      const yA = floors[0] - 0.25, yB = yA - 0.8, grey = () => mul(mix3([0.2, 0.19, 0.17], timber(), rng() * 0.6), rng.range(0.8, 1.25)), nb2 = Math.round((WX * 2 + 0.6) / 0.42);
      for (let i = 0; i < nb2; i++) { const x = -WX - 0.3 + (i + 0.5) * 0.42, j = rng.range(-0.06, 0.1); S.beam([x, yA + rng.range(0, 0.03), zo(0.1)], [x, yB + j * 0.3, zo(2.3 + j)], 0.4, 0.05, grey(), { gb: 0.7 }); }
      S.box(0, yB - 0.1, zo(2.1), WX * 2 + 0.5, 0.2, 0.2, timber(), { gb: 0.8 });
      for (let i = 0; i < 9; i++) { const s = rng.range(0.22, 0.36); S.box(rng.range(-WX, WX), (yA + yB) / 2 + 0.12 + s * 0.3, zo(rng.range(0.8, 1.9)), s * 1.3, s * 0.6, s, mul(o.stone(), 1.2), { ry: rng.range(0, 3), tx: 0.55, tz: 0.6, noBottom: true }); }
      for (const px of [-WX, -WX / 3, WX / 3, WX]) { S.box(px, (yB - 0.2) / 2, zo(2.1), 0.2, yB - 0.2, 0.2, timber(), { noBottom: true, gb: 0.7 }); S.box(px, 0.08, zo(2.1), 0.45, 0.16, 0.45, o.stone(), { tx: 0.8, tz: 0.8, noBottom: true }); }
      logs(S, rng, -WX + 0.3, 0.3, zo(0.25), Math.floor((WX - 1.8) / 0.27), 5, 'z', dir, 0.8);
    }
  };
  gable(zF, 1, true); await ctx.yield(); gable(zB, -1, false); await ctx.yield();
  if (hi) {   // straw tufts: the furry outline of eaves, verges and ridge
    const tuft = (b, dx, dy, dz, len, w, col) => {
      const l = Math.hypot(dx, dy, dz) || 1, a = rng.range(0, 6.28), sx = Math.cos(a) * w, sz = Math.sin(a) * w, e0 = [0, 0, 5, 0], e1 = [0, 0, 5, 1];
      Th.tri([b[0] - sx, b[1], b[2] - sz], [b[0] + sx, b[1], b[2] + sz], [b[0] + (dx / l) * len, b[1] + (dy / l) * len, b[2] + (dz / l) * len], col, 0.8, 0.8, 1.2, [e0, e0, e1]);
    };
    const z0 = zB - 1.2, z1 = zF + 1.2, pale = mul(straw, 1.35), surf = roof.surf, k = o.tufts ?? 1, t2 = o.trng || rng, fine = mul(straw, 1.2);
    const wisp = (b, dx, dy, dz, len, w, col) => {      // a fine straw end off the eave line: thin, short, its own rng
      const l = Math.hypot(dx, dy, dz) || 1, a = t2.range(0, 6.28), sx = Math.cos(a) * w, sz = Math.sin(a) * w, e0 = [0, 0, 5, 0], e1 = [0, 0, 5, 1];
      Th.tri([b[0] - sx, b[1], b[2] - sz], [b[0] + sx, b[1], b[2] + sz], [b[0] + (dx / l) * len, b[1] + (dy / l) * len, b[2] + (dz / l) * len], col, 0.8, 0.8, 1.2, [e0, e0, e1]);
    };
    for (const sgn of [1, -1]) {
      for (let i = Math.round((z1 - z0) * 9 * k); i > 0; i--) for (let q = 0; q < 8; q++) rng();      // (the draws the old, coarser eave tufts took)
      for (let i = Math.round((z1 - z0) * 9 * k * (o.eaveTufts ?? 2)); i > 0; i--) wisp(surf(sgn, dTop + t2.range(-0.3, 0.62), t2.range(z0, z1), t2.range(-0.3, 0.03)), sgn * (0.5 + t2.range(-0.3, 0.5)), -0.866 + t2.range(-0.2, 0.4), t2.range(-0.3, 0.3), t2.range(0.12, 0.3), t2.range(0.02, 0.03), mul(fine, t2.range(0.8, 1.4)));
      for (const [zv, dir] of [[z1, 1], [z0, -1]]) for (let i = Math.round(50 * k); i > 0; i--) tuft(surf(sgn, rng.range(0.3, dTop), zv, rng.range(-0.2, 0.03)), sgn * rng.range(0, 0.5), rng.range(0, 0.5), dir, rng.range(0.25, 0.55) * 0.7, 0.035, pale);
      for (let i = Math.round(110 * k); i > 0; i--) tuft(surf(sgn, rng.range(1, dTop), rng.range(z0, z1), 0), sgn * 0.9, -0.2 + rng.range(0, 0.6), rng.range(-0.4, 0.4), rng.range(0.25, 0.5) * 0.75, 0.035, pale);
      await ctx.yield();
    }
    for (let i = Math.round((z1 - z0) * 6 * k); i > 0; i--) { const sgn = rng.sign(); tuft(surf(sgn, rng.range(0.05, 2.4), rng.range(z0, z1), 0.7), sgn * rng.range(-0.2, 0.8), 1, rng.range(-0.5, 0.5), rng.range(0.25, 0.5) * 0.8, 0.04, pale); }
    if (o.trim) {      // the eave we fly under: short straw ends hang from the lip of each of its three steps (about nine a metre), so seen along its length the edge is ragged
      await ctx.yield();     // straw, not three planks. They are the last draws of the tuft stream, so every earlier tuft is where it was.
      const TH3 = TH / 3;
      for (const sgn of [1, -1]) for (let st = 0; st < 3; st++) for (let i = Math.round((z1 - z0) * 9); i > 0; i--) {
        const b = surf(sgn, dTop + 0.42 + 0.2 * st + t2.range(-0.03, 0.01), t2.range(z0, z1), -(st + 1) * TH3 + t2.range(-0.01, 0.03));
        wisp(b, sgn * t2.range(-0.12, 0.3), -1, t2.range(-0.25, 0.25), t2.range(0.1, 0.22), t2.range(0.02, 0.032), mul(fine, t2.range(0.75, 1.3)));
      }
    }
  }
  return roof;
}

// ---------------------------------------------------------------------------------------------------------------------
// Materials
const SWAY = /* glsl */`
  uniform float uTime;
  vec3 sfSway(float depth, float ph){ return vec3(sin(uTime*1.25 + ph)*0.6 + sin(uTime*2.9 + ph*1.7)*0.25, 0., cos(uTime*1.05 + ph*1.3)*0.5)*(0.05*depth); }`;
function makeSolidMat(uGlow, uMist, uMistC, uFill, uSunW) {   // timber, plaster, paper, stone: grain and grime; paper screens glow at dusk
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uPaperGlow = uGlow; sh.uniforms.uSfMist = uMist; sh.uniforms.uSfMistC = uMistC; sh.uniforms.uSfFill = uFill; sh.uniforms.uSfSunW = uSunW;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; varying vec3 vSfWP;').replace('#include <begin_vertex>', `#include <begin_vertex>
      vOP = position; vON = normal;
      { vec4 sfw = vec4(position, 1.);
        #ifdef USE_INSTANCING
          sfw = instanceMatrix*sfw;
        #endif
        vSfWP = (modelMatrix*sfw).xyz; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; varying vec3 vSfWP; uniform float uPaperGlow; uniform vec4 uSfMist; uniform vec3 uSfMistC; uniform vec3 uSfFill; uniform vec3 uSfSunW;' + GLSL_NOISE)
      .replace('#include <fog_fragment>', `{ float sfTop = uSfMist.x + uSfMist.y*vSfWP.z;      // standing in the fog bank (mist look): walls and props dissolve into it, more with distance (the distance the sight line runs inside the bank: seen from above it, what stands near its top is a dark island and the floor shows dimly through it)
          float sfM = (1. - smoothstep(sfTop - 4., sfTop + 2., vSfWP.y))*mix(0.6, 1., 1. - smoothstep(sfTop - 9.5, sfTop - 5., vSfWP.y))*(1. - exp(-length(vViewPosition)*uSfMist.z*(cameraPosition.y > sfTop ? clamp((sfTop - vSfWP.y)/max(cameraPosition.y - vSfWP.y, 1e-3), 0., 1.) : 1.)))*uSfMist.w*(1. - smoothstep(-440., -400., vSfWP.z));      // palest at the feet
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uSfMistC, sfM); }
        #include <fog_fragment>
        gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 an = abs(vON); vec2 q = an.y > 0.6 ? vOP.xz : (an.x > an.z ? vOP.zy : vOP.xy);
          float g1 = sfFbm(q*1.7), g2 = sfN(q*vec2(23., 2.5)), g3 = sfN(q*31.);
          diffuseColor.rgb *= 0.68 + 0.36*g1 + 0.2*g2 + 0.12*g3; }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float pg = smoothstep(0.42, 0.55, min(vColor.r, min(vColor.g, vColor.b)))*step(vON.y, 0.5);
          totalEmissiveRadiance += vec3(1.0, 0.62, 0.3)*(uPaperGlow*pg*(0.55 + 0.45*sfN(vOP.xy*0.9 + vOP.z))*mix(0.4, 1., smoothstep(3., 18., length(vViewPosition))));      // a screen at arm's length keeps its lattice; far windows bloom
          float sfSn = dot(normal, (viewMatrix*vec4(uSfSunW, 0.)).xyz), sfUp = dot(normal, (viewMatrix*vec4(0., 1., 0., 0.)).xyz);
          totalEmissiveRadiance += diffuseColor.rgb*uSfFill*((1. - smoothstep(-0.25, 0.35, sfSn))*(0.7 - 0.3*sfUp)); }      // the sunlit ground throws warm light back onto faces turned from the sun`);
  };
  m.customProgramCacheKey = () => 'sf-solid';
  return m;
}
function makeSoftMat(uTime, uGlow, uFill) {    // cords, cloth, radishes, corn: aX = (depth along the cord, phase, cloth flag)
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aX;' + SWAY)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += sfSway(aX.x, aX.y) + vec3(0.3, 0., 1.)*(sin(position.x*2.6 + position.y*3.1 - uTime*3.4 + aX.y)*0.16*aX.x*aX.z);`);
    sh.uniforms.uPaperGlow = uGlow; sh.uniforms.uSfFill = uFill;      // at dusk what hangs under the eaves takes a little warm light from the paper screens behind it; by day, light thrown back by the ground
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uPaperGlow; uniform vec3 uSfFill;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb*vec3(1.0, 0.6, 0.28)*(0.22*uPaperGlow) + diffuseColor.rgb*uSfFill*0.8;');
  };
  m.customProgramCacheKey = () => 'sf-soft';
  return m;
}
function makeFruitMesh(fruits, geo, uTime, uSun, selfLit) {   // fruits: x, y, z, scale, depth, phase, r, g, b per fruit
  const n = fruits.length / 9, sw = new Float32Array(n * 3), mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime; sh.uniforms.uSunW = uSun; sh.uniforms.uSelf = { value: selfLit };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 iSw; varying vec3 vFp;' + SWAY)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFp = position; transformed += sfSway(iSw.x, iSw.y)*iSw.z;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunW; uniform float uSelf; varying vec3 vFp;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 fp = normalize(vFp + vec3(0., 1e-3, 0.));      // the calyx: a dark four-pointed cap where the fruit hangs from
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.05, 0.025), 0.85*smoothstep(0.5, 0.66, fp.y)*(1. - smoothstep(0.5, 0.64, abs(fp.x) + abs(fp.z)))); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 vd = normalize(vViewPosition); vec3 sunV = (viewMatrix*vec4(uSunW, 0.)).xyz;
          totalEmissiveRadiance += diffuseColor.rgb*(0.1 + 0.8*smoothstep(-0.3, 0.7, dot(sunV, -vd)))*uSelf*(0.5 + 0.5*max(dot(normal, vd), 0.)); }`);
  };
  mat.customProgramCacheKey = () => 'sf-fruit';
  const g = geo.clone(), mesh = new THREE.InstancedMesh(g, mat, Math.max(1, n)), M4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const o = i * 9, s = fruits[o + 3];
    M4.makeScale(s, s, s).setPosition(fruits[o], fruits[o + 1], fruits[o + 2]); mesh.setMatrixAt(i, M4);
    mesh.setColorAt(i, col.setRGB(fruits[o + 6], fruits[o + 7], fruits[o + 8]));
    sw[i * 3] = fruits[o + 4]; sw[i * 3 + 1] = fruits[o + 5]; sw[i * 3 + 2] = 1 / s;
  }
  mesh.count = n; g.setAttribute('iSw', new THREE.InstancedBufferAttribute(sw, 3)); mesh.frustumCulled = false;
  return mesh;
}
// Cedar for the valley walls: three stacked cones, instanced in thousands, tops stirring.
function cedarGeometry(col) {
  const P = [], N = [], C = [], sides = 5, tiers = [[0.06, 0.52, 0.2], [0.3, 0.78, 0.15], [0.56, 1.0, 0.095]];
  for (const [y0, y1, r] of tiers) for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * TAU, a1 = ((i + 1) / sides) * TAU, am = (a0 + a1) / 2, k = r / (y1 - y0), ny = 1 / Math.hypot(1, 1 / k);
    P.push(Math.cos(a0) * r, y0, Math.sin(a0) * r, 0, y1, 0, Math.cos(a1) * r, y0, Math.sin(a1) * r);
    for (const a of [a0, am, a1]) N.push(Math.cos(a) * (1 - ny * 0.5), ny, Math.sin(a) * (1 - ny * 0.5));
    const d = 0.5 + 0.5 * (i % 2), t = 0.75 + 0.6 * y1;
    C.push(col[0] * 0.55 * d, col[1] * 0.55 * d, col[2] * 0.55 * d, col[0] * 1.5 * t, col[1] * 1.6 * t, col[2] * 1.4 * t, col[0] * 0.55 * d, col[1] * 0.55 * d, col[2] * 0.55 * d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return g;
}
function makeCedarMat(uTime) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float cph = instanceMatrix[3].x*0.31 + instanceMatrix[3].z*0.23;
          transformed.xz += vec2(sin(uTime*0.9 + cph), cos(uTime*0.7 + cph*1.3))*(0.016*position.y*position.y);
        #endif`);
  };
  m.customProgramCacheKey = () => 'sf-cedar';
  return m;
}

// The valley floor drawn crisply in world space on top of the kit terrain: lane with ruts, paddy bunds and stubble rows,
// fallen ginkgo leaves, frost that survives only in shadow, cedar crowns on the walls. q = layout space (x mirrored).
function patchGround(material, U) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D tSfLane; uniform sampler2D tSfVil; uniform vec4 uSfVil; uniform vec4 uSfLane; uniform vec4 uSfPad; uniform vec4 uSfGk[6]; uniform vec3 uSfFrost; uniform vec3 uSfLeaf; uniform vec3 uSfCedar; uniform vec4 uSfK; uniform vec4 uSfW; uniform sampler2D tSfPlot; uniform sampler2D tSfLit; uniform vec3 uSfLeafR; uniform sampler2D tSfSh; uniform vec4 uSfShR; uniform vec3 uSfShC; uniform vec4 uSfMist; uniform vec3 uSfMistC; uniform vec4 uSfHz; uniform vec4 uSfT;
      ${GLSL_NOISE}
      // The shared hash multiplies a cell index by 345.45 and keeps the fraction: past an index of a few thousand (17 cells a metre at z = -300) a float has no
      // fraction left there, every row of cells along z comes out the same, and fine noise turns into lines that run with the flight. The floor's fine layers
      // use this hash instead: the cell index is wrapped to 1024 first and never multiplied by more than one.
      float sfGH(vec2 p){ p = mod(p, 1024.); vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
      float sfGN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(sfGH(i), sfGH(i+vec2(1.,0.)), f.x), mix(sfGH(i+vec2(0.,1.)), sfGH(i+vec2(1.,1.)), f.x), f.y); }
      // One mark (a pebble, a leaf, a clump of stubble) in each cell of p, filtered over the pixel's own footprint on the ground (h: half its size across and along, in
      // cells): crisp across the view at any grazing angle, and where it is smaller than the pixel it fades to its share of it, never to a smear. r: half sizes in cells
      // (0.6 to 1.4 times that, by the cell); keep: the share of cells that hold one; sh: where its shadow lies. Returns (coverage, the cell's tone, coverage of the shadow).
      vec3 sfMark(vec2 p, vec2 h, vec2 r, float keep, vec2 sh, float seed){
        vec2 id = floor(p), f = fract(p) - 0.5; float tone = sfGH(id + seed), on = step(sfGH(id + seed + 53.), keep);
        vec2 rr = r*(0.6 + 0.8*tone), c = (vec2(sfGH(id + seed + 19.), sfGH(id + seed + 37.)) - 0.5)*(1. - 2.*rr);
        float fade = on*min(1., rr.x/max(h.x, 1e-4))*min(1., rr.y/max(h.y, 1e-4))*(1. - smoothstep(1.2, 3.5, max(h.x, h.y)));
        vec2 e = (f - c)/rr; float l = max(length(e), 1e-3); vec2 n = e/(l*rr); n /= max(length(n), 1e-3);
        float aa = max(abs(n.x)*h.x + abs(n.y)*h.y, 1e-4), m = min(rr.x, rr.y);
        vec2 e2 = (f - c - sh)/rr; float l2 = max(length(e2), 1e-3);
        return vec3(clamp(0.5 - (l - 1.)*m/(2.*aa), 0., 1.)*fade, tone, clamp(0.5 - (l2 - 1.)*m/(2.*aa), 0., 1.)*fade);
      }
      // A stripe filtered over the pixel's own footprint: the share of the stretch [x - w/2, x + w/2] that a pulse train covers (period 1, on while fract is in
      // [0, d)). Crisp where a stripe is wider than a pixel; where it is finer it is its own share of the pixel, and its mean is d exactly.
      float sfPulse(float x, float d, float w){ float a = x - 0.5*w, b = x + 0.5*w; return ((floor(b)*d + min(fract(b), d)) - (floor(a)*d + min(fract(a), d)))/w; }
      const vec3 sfStraw = vec3(0.669, 0.470, 0.125), sfEarth = vec3(0.147, 0.105, 0.059);      // the palette's straw #E8BC2A greyed toward dry stalks; its wet earth #6B5B45
      // STUBBLE, the surface of a dry field, in world metres. at: metres along the rows and across them; w: the pixel's footprint along and across (m); frC: the
      // frost's colour; F: how much frost lies here (0 in the sun); spk: the frost's sparkle. Rows 0.3 m apart: a band of cut straw 0.15 m wide on each row (hills a
      // hand apart, 0.14 m long, staggered row to row, one in seven missing, straw litter between them), a dark wet furrow 0.09 m wide between two rows, earth
      // beside it; swaths 2.4 m wide (eight rows, one pass of the cutter) lie brighter where the straw fell. Every stripe is filtered by the footprint of its own
      // coordinate and fades to its own mean (the sums below are of shares, so the mean of the pattern is the colour it fades to: no jump, no grey, no shimmer).
      // Frost lies on the stubs first, least in the furrow: the rows show through it.
      vec3 sfStub(vec2 at, vec2 w, vec3 frC, float F, float spk){
        float rc = at.y/0.3, wr = max(w.y/0.3, 1e-3), kr = 1. - smoothstep(0.7, 1.5, wr), xr = fract(rc), row = floor(rc);
        float band = mix(0.5, sfPulse(xr - 0.25, 0.5, wr), kr), fur = mix(0.3, sfPulse(xr + 0.15, 0.3, wr), kr);
        float hc = at.x/0.2 + 0.5*mod(row, 2.), wh = max(w.x/0.2, 1e-3), kh = (1. - smoothstep(0.6, 1.3, wh))*kr, h = sfGH(vec2(floor(hc), row));
        float hill = mix(0.602, sfPulse(fract(hc) - 0.15, 0.7, wh)*step(h, 0.86), kh), tone = mix(1., 0.78 + 0.44*fract(h*13.7), kh);
        float ws = max(w.y/2.4, 1e-3), sw = 1. + 0.45*(sfPulse(fract(at.y/2.4) - 0.325, 0.35, ws) - 0.35)*(1. - smoothstep(0.7, 1.5, ws));
        vec3 cS = mix(sfStraw*tone, frC, 0.9*F), cL = mix(mix(sfEarth, sfStraw, 0.35), frC*0.85, 0.5*F), cE = mix(mix(sfEarth, sfStraw, 0.12), frC*0.8, 0.6*F), cF = mix(sfEarth*0.6, frC*0.7, 0.35*F);
        return (cE*(1. - band - fur) + mix(cL, cS, hill)*band + cF*fur)*sw + frC*(0.45*spk*F*band*hill);
      }`)
      .replace('#include <roughnessmap_fragment>', `{
        vec2 q = vec2(vTWorld.x*uSfK.x, vTWorld.z); vec3 b = diffuseColor.rgb;
        float fwq = max(fwidth(vTWorld.x), fwidth(vTWorld.z));
        float wallM = clamp(smoothstep(148., 176., abs(q.x) + 14.*(sfN(q*0.02) - 0.5)) + 1. - smoothstep(-990., -948., q.y), 0., 1.);
        // The kit tilts the normal by its detail maps, three times as hard within 60 m of the eye. Under this low sun, seen at a grazing angle, that turned the
        // valley floor into dark and light smears running with the flight and hid the rows, stones and furrows drawn here. The floor is lit flat near the eye
        // (its relief is drawn: rows, joints, ruts, frost); the walls and the far floor keep the kit's relief.
        gTGrad *= mix(smoothstep(90., 220., length(vViewPosition)), 1., wallM);
        vec2 suv = vec2((q.x - uSfShR.x)*uSfShR.y, (q.y - uSfShR.z)*uSfShR.w);      // the painted cast shadows
        float sfSh = texture2D(tSfSh, suv).r*step(0.001, suv.x)*step(suv.x, 0.999)*step(0.001, suv.y)*step(suv.y, 0.999)*(1. - wallM);
        float n1 = sfN(q*0.9), n2 = mix(0.5, sfGN(q*4.3), 1. - smoothstep(0.09, 0.32, fwq)), n3 = mix(0.5, sfGN(q*17.), 1. - smoothstep(0.025, 0.1, fwq));      // the fine octaves fade to their mean before they are finer than a pixel: no smeared grain at a grazing angle or from the air
        // What the ground's surface knows of shadow, for the frost that lies on stubble (and nothing here reads the eye): the painted cast shadows (houses, trees, racks,
        // stooks, huts), the terrain's own baked sun shade, and the valley wall's shadow as the frost line bounds it (east of fedge; the line itself is drawn further
        // down, as it was). In a look with no sun on the floor (dusk) the whole floor counts as shadow, at 0.6.
        float fedge = q.x - (11. + 30.*sfN(q*0.011 + 2.) + 3.*(n1 - 0.5) + 1.2*(n2 - 0.5) + 26.*uSfK.w);
        float spk = step(0.86, sfGN(q*29.))*(1. - smoothstep(0.02, 0.12, fwq));      // the frost's sparkle: near the eye only (by the footprint)
        vec3 shTint = mix(uSfShC, vec3(dot(uSfShC, vec3(0.4, 0.4, 0.2)))*vec3(1., 1.02, 1.12), 0.5);      // the tint a cast shadow lays on grass and field (applied further down)
        vec3 frSh = mix(vec3(1.), vec3(0.56, 0.67, 0.86), sfSh), frC = vec3(0.584, 0.672, 0.761)*frSh/mix(vec3(1.), shTint, sfSh);      // frost #C9D6E2; in a cast shadow it is lit by the sky alone and stays blue-white (0.56, 0.67, 0.86 of it after the shadow's tint), not the shadow's dusk blue and not a grey
        float shG = clamp(max(max(smoothstep(0.3, 0.7, sfSh), 1. - vTShade.x), 0.6*(1. - step(0.01, uSfW.y))), 0., 1.), wallG = 0.75*smoothstep(-0.9, 0.9, fedge);
        float sfRX = 92. + 12.*sin(q.y*0.011 + 1.) + 7.*sin(q.y*0.027), rivD = abs(q.x - sfRX);      // the river's axis, as the build lays it
        // lane: an old cart track. Two wheel tracks worn to bare earth that wander, swell and pinch (never ruled lines), a crown of frosted grass between them, pebbles
        // pressed into the earth, grass creeping in from the verges. All of it is drawn against the pixel's own footprint across the lane, so it stays crisp at insect height.
        vec2 lt = texture2D(tSfLane, vec2((q.y - uSfLane.x)*uSfLane.y, 0.5)).rg;
        float lx = (q.x - lt.r)*lt.g, dl = abs(lx), inZ = step(uSfLane.z, q.y)*step(q.y, uSfLane.w), fwd = fwidth(q.x)*lt.g;
        vec2 hq = 0.5*vec2(fwidth(q.x), fwidth(q.y));      // half the pixel's footprint on the ground, across and along (m)
        float sfAir = smoothstep(0.07, 0.24, min(3.*min(hq.x, hq.y), fwq));      // 0 underfoot .. 1 seen from the climb (by the footprint's narrow side: a grazing view down the lane is still underfoot)
        float laneM = (1. - smoothstep(0.95, 1.75, dl + (n1 - 0.5)*0.8))*inZ*(1. - wallM);
        float lnK = 1. - smoothstep(0.3, 0.8, fwd), sdS = step(0., lx), aT = clamp(fwd, 0.012, 0.4);
        float wob = (sfN(vec2(q.y*0.13 + sdS*17., 3.)) - 0.5)*0.22 + (sfN(vec2(q.y*0.47, 9. + sdS*5.)) - 0.5)*0.09;      // each track wanders a hand's width
        float tw = 0.17 + 0.12*sfN(vec2(q.y*0.31 + 7., sdS*3.));                                                              // and swells and pinches
        float dT = abs(dl - 0.72 - wob) + (n2 - 0.5)*0.08;
        float track = (1. - smoothstep(tw - aT, tw + aT, dT))*lnK, trackIn = (1. - smoothstep(0.02, tw*0.7 + aT, dT))*lnK;
        float worn = smoothstep(0.55, 0.75, sfN(vec2(q.y*0.19 + 31., 5.)));      // stretches where the crown is worn through to earth
        float lnCrown = (1. - smoothstep(0.4 - aT, 0.44 + aT, dl + wob*0.5 + (n2 - 0.5)*0.14 + (n3 - 0.5)*0.06))*(1. - 0.75*worn)*lnK;
        // grass on the crown: tufts a hand wide lying along the lane, each drawn whole against the pixel's footprint with its shadow (it was soft noise: a smear underfoot)
        vec2 tp = vec2(lx/0.05, q.y/0.42 + 0.37*floor(lx/0.05)), th = hq*vec2(lt.g/0.05, 1./0.42);      // (blades: slivers a finger wide and a foot long, staggered, so they never line up into cobbles)
        vec3 tfA = sfMark(tp + 5.5, th, vec2(0.3, 0.44), 0.8, vec2(0.), 71.), tfB = sfMark(vec2(lx/0.085, q.y/0.3 + 0.61*floor(lx/0.085)) + 1.5, hq*vec2(lt.g/0.085, 1./0.3), vec2(0.24, 0.44), 0.7, vec2(0.), 77.);
        float tuft = max(tfA.x, 0.8*tfB.x), tfar = smoothstep(0.45, 1.4, max(th.x, th.y));
        vec3 crownC = vec3(0.12, 0.21, 0.06)*(0.82 + 0.24*n2 + 0.2*n3);      // short moss and grass: the crown is green between the two dark ruts
        crownC = mix(crownC, mix(vec3(0.2, 0.36, 0.09), vec3(0.46, 0.52, 0.2), tfA.y), tfA.x*0.9);
        crownC = mix(crownC, mix(vec3(0.08, 0.17, 0.04), vec3(0.3, 0.4, 0.14), tfB.y), tfB.x*0.7*(1. - tfA.x));
        float rutSh = smoothstep(0.35, 0.6, sfSh), crownF = uSfK.z*(0.12 + 0.88*rutSh);      // (in the sun the crown keeps little frost: it reads green)
        crownC = mix(crownC, uSfFrost*(0.86 + 0.2*tfA.y), crownF*(0.22 + 0.68*tuft));      // the tufts hold frost, most in the shade
        crownC = mix(crownC, mix(vec3(0.2, 0.31, 0.1), uSfFrost*0.88, 0.55*crownF), tfar);
        vec3 laneC = vec3(0.31, 0.245, 0.155)*(0.86 + 0.2*n2 + 0.14*n3);      // damp packed earth
        laneC = mix(laneC, vec3(0.115, 0.085, 0.055)*(0.9 + 0.2*n3), 0.9*track);      // the tracks: wet earth, darker down the middle
        laneC *= 1. - 0.3*trackIn;
        laneC = mix(laneC, vec3(0.57, 0.5, 0.36), 0.5*(1. - smoothstep(0., 0.07 + aT, abs(dT - tw - 0.05)))*lnK*(1. - lnCrown));      // a pale, dry lip thrown up beside each track
        { vec3 pb = sfMark(q*4.6 + 3.3, hq*4.6, vec2(0.2, 0.17), 0.6, uSfT.zw*0.12, 11.);      // pebbles a hand across, each with its shadow
          vec3 pg = sfMark(q*11. + 7.1, hq*11., vec2(0.22, 0.2), 0.55, uSfT.zw*0.14, 23.);       // and grit
          float pk = 1. - 0.75*lnCrown;      // (few on the grass)
          laneC *= 1. - 0.45*max(pb.z - pb.x, 0.)*pk - 0.3*max(pg.z - pg.x, 0.)*pk;
          laneC = mix(laneC, mix(vec3(0.3, 0.29, 0.27), vec3(0.74, 0.7, 0.6), pb.y), pb.x*pk*0.9);
          laneC = mix(laneC, mix(vec3(0.28, 0.25, 0.2), vec3(0.7, 0.64, 0.52), pg.y), pg.x*pk*0.75); }
        laneC = mix(laneC, vec3(0.63, 0.56, 0.39)*(0.85 + 0.25*n3), 0.38*uSfT.y*(1. - track));      // (mist look: pale straw trodden into the lane)
        // Water stands in the ruts in runs a few strides long (the runs of the rut frost further down: where the lane is shaded the same runs hold frost, ice): a line
        // of the sky 0.09 m wide down the middle of the rut, antialiased by its own width on screen (a line finer than a pixel is its share of it).
        float rutRun = smoothstep(0.4, 0.55, sfN(vec2(q.y*0.8 + sdS*13., 2.)));
        laneC = mix(laneC, uSfHz.rgb*0.85, 0.9*(1. - smoothstep(0.045 - aT, 0.045 + aT, dT))*lnK*rutRun*(1. - rutSh*uSfK.z));
        laneC = mix(laneC, crownC, lnCrown*0.92);
        laneC = mix(laneC, vec3(0.12, 0.22, 0.06)*(0.7 + 0.6*n3), smoothstep(0.95, 1.5, dl + (n2 - 0.5)*0.6)*0.75);      // grass creeping in from the verges
        laneC = mix(laneC, uSfFrost*0.8*(0.8 + 0.3*n3), smoothstep(1.0, 1.8, dl)*smoothstep(0.4, 0.7, sfSh)*uSfK.z*0.75);      // the verge in shade keeps its frost: a pale edge to the lane
        vec3 airC = vec3(0.33, 0.26, 0.165);      // from the climb: an earth track, two dark wheel lines and the green crown between them
        airC *= 1. - 0.55*track;
        airC = mix(airC, mix(vec3(0.2, 0.32, 0.1), uSfFrost*0.82, 0.25*uSfK.z), lnCrown*0.75);
        laneC = mix(laneC, airC, 0.85*sfAir);
        // The verge: rough green grass either side of the lane, between it and the fields, drawn as tufts a hand wide each with its shadow (so it stands a little
        // taller than the field), moss in cushions where a house or a tree shades it. It is laid over the field's edge further down (it lay under the paddies).
        float vergeM = smoothstep(1.3, 2.2, dl + (n1 - 0.5)*0.6)*(1. - smoothstep(3.3, 5.6, dl + (n1 - 0.5)*1.4))*inZ*(1. - wallM)*smoothstep(-438., -420., q.y), vgF = smoothstep(0.3, 0.7, sfFbm(q*0.6 + 2.));
        vec3 vergeC = mix(vec3(0.1, 0.19, 0.055), vec3(0.22, 0.27, 0.1), vgF)*(0.72 + 0.3*n2 + 0.3*n3);
        { float moss = smoothstep(0.46, 0.62, sfFbm(q*0.85 + 31.) + 0.22*sfSh - 0.12*smoothstep(2.2, 4.6, dl));      // moss in cushions a stride across along the lane's edge, most where a house or a tree shades it
          vergeC = mix(vergeC, mix(vec3(0.08, 0.19, 0.04), vec3(0.17, 0.3, 0.065), n2)*(0.75 + 0.5*n3), 0.9*moss);
          vec3 vt = sfMark(vec2(q.x/0.24, q.y/0.34 + 0.43*floor(q.x/0.24)), hq/vec2(0.24, 0.34), vec2(0.34, 0.4), 0.85, uSfT.zw*0.5, 67.);
          vergeC *= 1. - 0.3*max(vt.z - vt.x, 0.);
          vergeC = mix(vergeC, vergeC*(1.05 + 0.35*vt.y), vt.x); }
        b = mix(b*(0.86 + 0.28*n2), laneC, laneM);
        // floor that is neither lane, verge, field, village nor river gravel (the knoll, the river's margin, the headland before the village): rough winter grass
        b = mix(b, mix(vec3(0.15, 0.22, 0.08), vec3(0.3, 0.3, 0.12), vgF)*(0.75 + 0.4*n2 + 0.2*n1), 0.75*(1. - wallM)*(1. - laneM)*smoothstep(11., 16., rivD)*smoothstep(-438., -420., q.y)*step(q.y, 58.));
        // PADDIES. The grid the build lays (36 by 28 m from x -72, z -246, six rows up the valley) is continued in the ground's surface to the feet of both walls:
        // every paddy is a field inside its bunds, the ones beyond the build's four columns dry. No field within 15 to 18 m of the river's axis (its gravel) or
        // on the viewing knoll. A bund is a dark earth bank with a line of dry grass tufts along its crown.
        vec2 pc = vec2((q.x - uSfPad.x)/36., (uSfPad.y - q.y)/28.), pid = floor(pc);
        float padM = step(0., pc.y)*step(pc.y, uSfPad.w)*(1. - smoothstep(4., 6.5, 8.5 - dl))*(1. - wallM)*smoothstep(15., 18., rivD)*smoothstep(37., 40., length(q - vec2(-112., -330.)));
        vec2 pf = fract(pc); float edge = min(min(pf.x, 1. - pf.x)*36., min(pf.y, 1. - pf.y)*28.);
        float bund = 1. - smoothstep(0.8, 1.5, edge + (n1 - 0.5)*0.6), padIn = padM*(1. - bund);
        // the hamlet's fields either side of the lane: a patchwork of plots inside grass bunds, each with its own crop (the plot map: R crop, G which
        // way it is worked, B how much frost it holds): straw stubble, dark turned earth, green winter crop, pale fallow. The tone holds at any distance.
        float fldM = step(-246., q.y)*smoothstep(4.5, 8., dl)*(1. - smoothstep(46., 57., q.x))*(1. - wallM)*inZ;      // (west of the lane the plots run on to the wall's foot)
        vec2 fc = vec2((q.x + 9.)/31., (q.y + 3.)/23.); fc.y += 0.37*floor(fc.x);
        vec2 fi = floor(fc), ff = fract(fc); vec4 pl = texture2D(tSfPlot, (mod(fi + vec2(3., 12.), vec2(8., 16.)) + 0.5)/vec2(8., 16.));      // (read round: plots beyond the map's eight columns are not copies of its edge)
        float fe = min(min(ff.x, 1. - ff.x)*31., min(ff.y, 1. - ff.y)*23.) + (n1 - 0.5)*0.7;
        float fbund = 1. - smoothstep(0.9, 1.6, fe);
        float fx = step(0.5, pl.g), fwr = mix(fwidth(q.y), fwidth(q.x), fx)/0.6, rowK = 1. - smoothstep(0.3, 0.8, fwr);
        float frc = mix(q.y, q.x, fx)/0.6, frf = abs(fract(frc) - 0.5), frid = floor(frc);
        float fdot = mix(smoothstep(0.4, 0.47, sfGN(vec2(mix(q.x, q.y, fx)*5.5, frid*7.1 + pl.a*31.))), 0.6, smoothstep(0.05, 0.25, fwq)), fa = clamp(fwr, 0.015, 0.2);
        float ft = pl.r, notSt = step(0.17, ft);      // notSt: 0 on the plots the map calls straw stubble (they take the stubble surface, not these rows)
        float fstub = (1. - smoothstep(0.13 - fa, 0.13 + fa, frf))*fdot*rowK*notSt;
        float ffur = smoothstep(0.38 - fa, 0.38 + fa, frf)*rowK*notSt;
        vec3 ftone = ft < 0.17 ? vec3(0.4, 0.34, 0.19) : (ft < 0.5 ? vec3(0.105, 0.085, 0.062) : (ft < 0.83 ? vec3(0.12, 0.175, 0.075) : vec3(0.27, 0.25, 0.12)));
        vec3 frow = ft < 0.17 ? vec3(0.62, 0.52, 0.28) : (ft < 0.5 ? vec3(0.21, 0.165, 0.11) : (ft < 0.83 ? vec3(0.2, 0.33, 0.11) : vec3(0.42, 0.38, 0.17)));
        vec3 fldC = ftone*(0.8 + 0.2*pl.a)*(0.84 + 0.2*n2 + 0.14*n3)*(1. - 0.3*ffur);
        fldC = mix(fldC, frow*(0.75 + 0.5*n3), fstub*0.8);
        fldC = mix(fldC, mix(ftone, frow, 0.35), 0.5*(1. - rowK));
        // the main village: yards, footpaths, garden plots inside bunds, wet ground under the fans (map: R yard, G path, B wet, A shade)
        float vilM = (1. - smoothstep(-438., -420., q.y))*(1. - wallM)*(1. - laneM);
        vec4 vm = texture2D(tSfVil, vec2((q.x - uSfVil.x)*uSfVil.y, (q.y - uSfVil.z)*uSfVil.w));
        vec2 qv = q + (vec2(sfN(q*0.043), sfN(q*0.043 + 17.)) - 0.5)*16.;
        vec2 gcv = vec2(qv.x/14., qv.y/10.); float gRow = floor(gcv.y), gWide = step(0.55, sfHash(vec2(gRow, 7.))), gDeep = step(0.6, sfHash(vec2(floor(gcv.x*0.5), 3.) + floor(gRow*0.5)*0.37));
        gcv.x += 0.5*step(0.25, fract(gRow*0.5)); gcv.x *= mix(1., 0.5, gWide);      // plots of several sizes: some rows hold double-width strips, and some plots run two rows deep
        gcv.y = mix(gcv.y, 2.*floor(gcv.y*0.5) + fract(gcv.y*0.5), gDeep*(1. - gWide));
        vec2 gi = floor(gcv), gf = fract(gcv); float gh = sfHash(gi + 3.7), gm = step(0.15, sfN(gi*0.41 + 3.))*(1. - smoothstep(0.2, 0.55, vm.r));
        float geY = mix(10., 20., gDeep*(1. - gWide));
        float ge = min(min(gf.x, 1. - gf.x)*mix(14., 28., gWide), min(gf.y, 1. - gf.y)*geY) + (n1 - 0.5)*0.3;
        float inPlot = smoothstep(0.72, 0.98, ge), bundV = 1. - inPlot;      // a crisp edge to every plot
        float ga = gh*0.6 - 0.3, gca = cos(ga), gsa = sin(ga); vec2 qr = vec2(gca*q.x + gsa*q.y, gca*q.y - gsa*q.x);
        float rw = (gh > 0.5 ? qr.x : qr.y)/1.1, rf2 = abs(fract(rw) - 0.5);
        float rowV = (1. - smoothstep(0.05, 0.4, rf2))*(1. - smoothstep(0.09, 0.32, fwq))*step(0.25, sfN(vec2(floor(rw)*3.3, (gh > 0.5 ? qr.y : qr.x)*0.9)));
        // THE STUBBLE SURFACE, once for the pixel, in the field it lies in. Which way a field is combed: a paddy parallel to one of its own bunds, alternating like a
        // chessboard by its place in the grid (column + row even: along x, its long side; odd: along z), so no two paddies that share a bund are combed alike; a
        // hamlet plot as its plot map says; a village plot along its own turned axis. Its frost: where the ground knows shadow (shG), and in the wall's shadow east
        // of the frost line (wallG; each hamlet plot its own share of that, the village little, as the line itself does); none in the sun. The village's plots hold 0.4
        // of a cast shadow's frost (trodden, among warm houses): seen from above the stubble shows through it.
        float fwx = 2.*hq.x, fwy = 2.*hq.y, zV = step(q.y, -420.), zP = (1. - zV)*step(q.y, -246.), stZ = mix(fx, mod(pid.x + pid.y, 2.), zP);
        vec2 qrW = vec2(abs(gca)*fwx + abs(gsa)*fwy, abs(gca)*fwy + abs(gsa)*fwx);
        vec2 stAt = mix(mix(q, q.yx, stZ), gh > 0.5 ? qr.yx : qr, zV), stW = mix(mix(vec2(fwx, fwy), vec2(fwy, fwx), stZ), gh > 0.5 ? qrW.yx : qrW, zV);
        float stF = uSfK.z*clamp(max(shG*mix(1., 0.4, zV), wallG*mix(mix(mix(0.5, 1., pl.b), 1., zP), 0.28, zV)), 0., 1.)*(1. - uSfW.w*zV);
        vec3 stC = sfStub(stAt, stW, frC, stF, spk)*(0.94 + 0.12*n1);
        float isStV = step(0.28, gh)*step(gh, 0.58), gTone = 0.82 + 0.36*sfHash(gi + 21.3);
        float stM = clamp(padIn + fldM*(1. - notSt)*(1. - fbund) + inPlot*gm*vilM*isStV, 0., 1.);      // where the surface is stubble
        { vec3 padC = stC*(0.9 + 0.22*sfGH(pid + 7.));      // each paddy its own tone
          float aB = clamp(fwq, 0.02, 4.), tuftL = min(clamp((0.3 - edge)/aB + 0.5, 0., 1.), 0.6/max(aB, 0.6))*smoothstep(0.33, 0.5, n2);      // the tuft line: 0.6 m wide on the crown, broken into tufts near the eye, never more than its share of a pixel
          padC = mix(padC, mix(sfEarth*0.75*(0.7 + 0.6*n2), vec3(0.5, 0.42, 0.2)*(0.8 + 0.4*n3), 0.85*tuftL), bund);
          b = mix(b, padC, padM); }
        fldC = mix(fldC, stC*(0.88 + 0.24*pl.a), 1. - notSt);
        fldC = mix(fldC, vec3(0.085, 0.13, 0.05)*(0.7 + 0.6*n2 + 0.3*n3), fbund*0.92);
        b = mix(b, fldC, fldM*0.85);
        float plotF = mix(1., (0.12 + 0.88*pl.b*pl.b)*(ft < 0.17 ? 0.8 : (ft < 0.5 ? 1. : (ft < 0.83 ? 0.45 : 0.9))), fldM*(1. - 0.6*fbund));      // each plot holds its own share of frost; the green crop least
        b = mix(b, vergeC, 0.92*vergeM*(1. - laneM));      // the verge, over the field's edge
        { float chB = smoothstep(0., 1., 1. - abs(q.y + 37.)/9.), dc = abs(q.x - (lt.r + mix(7.4, 3.2, smoothstep(-150., -95., q.y)) + 0.45*chB)) - 0.5*(1.3 + 1.95*chB), aE = max(fwidth(q.x), 0.02);      // the stone channel's edge: mossy stone from 0.3 to 1.0 m outside the water on both sides (the channel's own axis and width, z +44 to -246), jointed every 0.7 m
          float chM = clamp((dc - 0.3)/aE + 0.5, 0., 1.)*clamp((1.0 - dc)/aE + 0.5, 0., 1.)*step(-246., q.y)*step(q.y, 44.)*(1. - wallM);
          float jn = (1. - smoothstep(0.02, 0.05 + fwy, abs(fract(q.y/0.7 + 0.37*step(0., q.x - lt.r - 5.)) - 0.5)*0.7))*(1. - smoothstep(0.1, 0.3, fwy));
          b = mix(b, mix(vec3(0.07, 0.15, 0.04), vec3(0.3, 0.31, 0.27), smoothstep(0.45, 0.7, n2))*(0.8 + 0.4*n3)*(1. - 0.4*jn), 0.85*chM); }
        vec3 cropV = gh < 0.28 ? vec3(0.14, 0.29, 0.085) : (gh < 0.58 ? vec3(0.6, 0.49, 0.22) : (gh < 0.82 ? vec3(0.24, 0.28, 0.125) : vec3(0.15, 0.12, 0.085)));      // winter green, stubble, fallow, turned earth
        float rowC = smoothstep(0.1, 0.4, abs(fract(rw/3.6) - 0.5)), rowCK = smoothstep(0.09, 0.36, fwq)*(1. - smoothstep(0.9, 2.6, fwq));      // from the air the tilling still shows: bands a few rows wide
        float plotG = sfN(q*0.08 + gi*1.7);      // and no plot is one flat tone: it grades across its length
        vec3 plotV = mix(vec3(0.11, 0.092, 0.068)*(0.75 + 0.5*n2), cropV*(0.7 + 0.6*n3)*gTone, max(rowV*0.45, 0.74*smoothstep(0.09, 0.36, fwq)));
        plotV *= (1. - 0.26*(1. - rowC)*rowCK)*mix(1., 0.74 + 0.52*plotG, smoothstep(0.09, 0.36, fwq));
        plotV = mix(plotV, stC*gTone*(0.74 + 0.52*plotG), isStV);      // the village's stubble plots: the same surface as the paddies
        b = mix(b, plotV, inPlot*gm*vilM*0.92);
        b = mix(b, mix(vec3(0.15, 0.22, 0.08), vec3(0.3, 0.3, 0.12), smoothstep(0.3, 0.7, sfFbm(q*0.23 + 4.)))*(0.75 + 0.4*n2 + 0.2*n1), 0.72*vilM*(1. - gm)*(1. - smoothstep(0.3, 0.6, vm.r)));      // where no plot is dug: winter grass, mossy in patches
        b = mix(b, mix(vec3(0.12, 0.2, 0.07), vec3(0.24, 0.27, 0.105), smoothstep(0.35, 0.65, sfN(q*0.7 + 9.)))*(0.72 + 0.45*n2 + 0.25*n1)*mix(0.62, 1., step(0.01, uSfW.y)), bundV*gm*vilM*0.9);      // bunds of winter grass and moss: green lines between the plots
        float vfs = mix(1., clamp(inPlot*gm*(0.25 + 0.75*step(0.42, sfHash(gi + 9.1))) + 0.45*smoothstep(0.42, 0.58, vm.r), 0., 1.)*mix(0.6, mix(0.34, 1., sfSh)*(0.6 + 0.4*smoothstep(0.3, 0.7, plotG)), step(0.01, uSfW.y)), vilM);      // in the village frost lies plot by plot (and thinly on the yards), with the plots' edges, not in clouds
        // yards: trodden earth and straw around each house, worn in from its walls with a ragged edge and grass left standing in it (it was a flat grey-blue ellipse
        // under the sky's light: a decal from the climb); paths the colour of dry earth
        float yardV = smoothstep(0.3, 0.74, vm.r + (sfFbm(q*0.33 + 21.) - 0.5)*0.6 + (n1 - 0.5)*0.2)*vilM, pathV = smoothstep(0.45, 0.55, vm.g + (n2 - 0.5)*0.3)*vilM, trod = max(yardV, pathV);
        b = mix(b, mix(vec3(0.42, 0.33, 0.195), vec3(0.52, 0.44, 0.25), sfN(q*0.55 + 3.))*(0.8 + 0.35*n2), yardV*0.82*(0.55 + 0.45*smoothstep(0.34, 0.56, sfFbm(q*0.9 + 5.))));
        b = mix(b, vec3(0.6, 0.51, 0.34)*(0.8 + 0.3*n3), pathV*0.9);
        { float wthr = mix(0.2, 0.56, clamp((-424. - q.y)/465., 0., 1.)) + 0.03;      // wet ground only where a fan is running (the village wave's two thresholds), with a ragged edge and a wide falloff: dark earth, never a grey disc
          b *= 1. - 0.42*smoothstep(0.3, 0.72, vm.b + (sfFbm(q*0.4 + 13.) - 0.5)*0.55)*smoothstep(wthr, wthr + 0.035, uSfT.x)*vilM*(0.75 + 0.25*n2); }
        // fallen leaves under the ginkgos
        for (int i = 0; i < 6; i++) {
          vec4 g = uSfGk[i]; float d = length(q - g.xy)/max(g.z, 0.1) + (sfN(q*0.25 + g.xy*0.37) - 0.5)*0.7;
          float m = (1. - smoothstep(0.1, 1.45, d + (n1 - 0.5)*0.35))*g.w;
          float sp = mix(0.78*smoothstep(0.62 - 0.6*m, 0.7 - 0.5*m, n3*0.6 + n2*0.4), 0.7*m*m, sfAir);
          b = mix(b, uSfLeaf*(0.55 + 0.6*n3), sp*step(0.02, m)*(1. - wallM));
        }
        // frost holds in the shade and in hollows; in the fields each plot holds its own share, and the lane keeps it only along its edges. Stubble (stM) has its own
        // frost, in shadow only (above): this frost and the frost line's lie on everything else, as they did.
        float fr = clamp((1. - vTShade.x)*0.9*mix(1., 0.35 + 0.65*vfs, vilM) + uSfK.y*mix(smoothstep(0.35, 0.75, sfFbm(q*0.21 + 5.)), pl.b, 0.8*fldM)*vfs + 0.3*vm.a*(1. - step(0.01, uSfW.y))*vilM*(1. - vm.b)*(0.4 + 0.6*vfs), 0., 1.)*(0.55 + 0.45*n3)*(1. - wallM)*(1. - 0.94*laneM)*(1. - 0.6*trod)*plotF;
        float fcr = mix(smoothstep(0.33, 0.37, sfN(q*1.3 + 4.)), 0.7, max(sfAir, uSfT.y));      // (uSfT.y: the mist look, where the hoar lies evenly: no dark blotches)                              // crisp patches: frost lies where the ground is a hand lower
        float fRow = mix(1., 0.3 + 0.9*smoothstep(0.1, 0.42, frf), rowK*fldM*notSt);      // in the hamlet's plots the frost lies in the furrows and thin on the rows: every plot shows its rows and its crop through it
        b = mix(b, uSfFrost, min(1., fr*(0.5 + 0.5*fcr)*fRow*(1. - stM)*uSfK.z*(1. - uSfW.w*vilM)*(1. - 0.8*fstub*fldM)*(1. + 0.5*ffur*fldM)));      // uSfW.w: under the fog bank the village keeps less frost, so yards, paths and plots still read
        // the frost line (fedge, above): the floor on the sun's side of the valley was in the wall's shadow until now, and the sun line eats it as we fly
        float frim = smoothstep(0., 0.4, fedge)*(1. - smoothstep(0.4, 2.6, fedge));      // the sunlit edge of the frost: sharp, and brightest where the sun has just reached it
        float fline = smoothstep(-0.9, 0.9, fedge)*(1. - wallM)*(1. - 0.94*laneM)*(1. - vilM*mix(0.72, 0.92, trod));
        float fpat = mix(mix(0.2 + 0.8*smoothstep(0.48, 0.52, sfFbm(q*0.3 + 9.) + (n2 - 0.5)*0.08), 0.62, sfAir), plotF, 0.85*fldM)*vfs;                  // it lies in patches: the ground and its rows show through
        vec3 frostL = vec3(0.62, 0.7, 0.8)*(0.7 + 0.4*n3 + 0.25*n2) + vec3(0.8)*spk;
        b = mix(b, frostL*(1. + 0.25*frim), min(1., fline*uSfW.x*fpat*(0.5 + 0.5*fcr)*(0.55 + 0.45*n2)*fRow*(1. - stM)*(1. - 0.8*fstub*fldM)*(1. + 0.7*frim)));
        b *= 1. - 0.3*(1. - smoothstep(0.0, 0.5, abs(fedge + (n2 - 0.5)*1.5)))*uSfW.x*(1. - wallM)*(1. - laneM)*(1. - smoothstep(0.1, 0.4, fwq));      // the thawed, wet edge of the frost line
        b = mix(b, b*vec3(1.16, 1.06, 0.84), (1. - fline)*uSfW.y*(1. - wallM)*(1. - laneM));
        { float rutF = trackIn*laneM*uSfK.z*rutSh*rutRun;      // frost in the wheel ruts: a rut is a hand lower than the lane, and where a house or a tree shades the lane it holds frost in runs a few strides long
          b = mix(b, vec3(0.72, 0.8, 0.92)*(0.8 + 0.3*n3) + vec3(0.3)*spk, 0.8*rutF); }
        b *= 1. - 0.42*smoothstep(0.43 - fa, 0.43 + fa, frf)*rowK*fldM*(1. - fbund)*notSt;      // and in the hamlet's plots the furrow between two rows stays a dark line under the frost: the plots are corduroy, not a flat sheet
        // this morning's leaves: crimson under and down-wind of every maple, gold down-wind of every ginkgo, orange-gold under the entry persimmon, crisp, on lane
        // and field alike. Where they lie is the litter map's (R crimson, G gold; painted at build from the trees themselves), not a list of places.
        vec3 lf = sfMark(q*6.1 + 9.9, hq*6.1, vec2(0.3, 0.21), 1., vec2(0.), 83.); float lfar = smoothstep(0.35, 1.3, 6.1*max(hq.x, hq.y));      // single leaves, crisp across the view; a tint of them where they are finer than a pixel
        vec4 lit4 = texture2D(tSfLit, suv)*step(0.001, suv.x)*step(suv.x, 0.999)*step(0.001, suv.y)*step(suv.y, 0.999);
        { float lv = max(lit4.r, lit4.g), m = (1. - smoothstep(0.15, 1.0, 1. - lv + (n1 - 0.5)*0.3))*step(0.004, lv), lth = mix(0.86, 0.5, m);
          float sp = max(0.9*lf.x*step(lf.y, 1.36 - lth*1.5), 0.62*m*m*lfar)*step(0.02, m);      // (from further off a drift is a carpet of its colour, as the ginkgo's disc is)
          b = mix(b, mix(uSfLeafR, uSfLeaf, lit4.g/max(lit4.r + lit4.g, 1e-3))*(0.6 + 0.45*lf.y + 0.3*n3), sp*(1. - wallM)); }
        { vec3 pf = sfMark(q*3.3 + 4.4, hq*3.3, vec2(0.15, 0.15), 1., uSfT.zw*0.1, 97.);      // the persimmons' windfalls: fruit lying where it dropped under each tree (the litter map's B), whole and orange or split and brown, each with its shadow
          float on = step(pf.y, lit4.b*0.45)*step(0.02, lit4.b)*(1. - wallM);
          b *= 1. - 0.4*max(pf.z - pf.x, 0.)*on;
          b = mix(b, mix(vec3(0.82, 0.3, 0.035), vec3(0.3, 0.1, 0.03), step(0.72, fract(pf.y*7.3)))*(0.8 + 0.4*n3), pf.x*on); }
        { float gk1 = 1. - smoothstep(0.012, 0.05, fwq), gOn = (1. - wallM)*(1. - laneM)*(1. - stM);      // grit: crisp grain near the eye (the clods and stones lie on everything but stubble: a combed field has its own grain)
          vec3 ck = sfMark(q*6.3 + 1.7, hq*6.3, vec2(0.24, 0.2), 0.7, uSfT.zw*0.13, 41.);      // and clods, tufts and stones that keep their edge across the view where the fine grain has gone: the ground ahead is never a smooth smear
          b *= 1. + (smoothstep(0.5, 0.56, sfGN(q*57. + 3.)) - 0.45)*0.34*gk1*(1. - wallM) - 0.34*max(ck.z - ck.x, 0.)*gOn;
          b = mix(b, b*(1.2 + 0.5*ck.y) + 0.015, 0.55*ck.x*gOn); }
        float shF = smoothstep(0.3, 0.7, sfSh + (sfGN(q*2.3 + 7.) - 0.5)*0.12*(1. - sfAir))*uSfK.z*(1. - laneM)*(1. - 0.85*trod);      // frost holds where a house or a tree has kept the sun off (on grass: trodden earth holds little), its edge soft and following the shadow
        b *= 1. + 3.5*max(uSfW.y - 0.9, 0.)*(1. - sfSh)*(1. - wallM);      // late afternoon only (uSfW.y above 0.9): what the low sun still reaches is amber against the long violet shadows
        { float shL = dot(uSfShC, vec3(0.4, 0.4, 0.2));      // a shadow keeps the hue of what it falls on: half as blue on grass as the sky would make it, and earth-warm on the lane and the trodden yards
          b *= mix(vec3(1.), mix(mix(uSfShC, vec3(shL)*vec3(1., 1.02, 1.12), 0.5), vec3(shL)*vec3(1.15, 1., 0.86), 0.6*max(laneM, trod)), sfSh); }      // (on the lane's earth the shade stays earth: brown times the sky's blue was a flat grey)
        // Frost lies wherever a house, a tree or the wall has kept the sun off the ground, in the hamlet and under the village's houses alike, and it is the same
        // seen from the lane and from the air: blue-white (#C9D6E2 in the sky's light, never the shadow's own dusk blue and never a flat grey), on the crop's rows
        // first and thin between them so the plot's own crop or grass shows through, in patches a stride across, sparkling near the eye. (Stubble has its own, above.)
        // Where the shadow has just drawn back (shadows shorten toward what casts them as the sun climbs) the frost is still there and now in the sun: a white
        // rim a stride or two wide along the far edge of every shadow, which the sun line is eating.
        { float shPat = 0.15 + 0.85*smoothstep(0.32, 0.6, sfFbm(q*0.55 + 17.));
          float hold = mix(1., vfs, vilM)*mix(1., plotF, fldM);      // what holds it: in the village the dug plots (each its own share) and thinly the yards, not the winter grass between; in the hamlet each plot its share
          float onRow = mix(mix(0.35 + 0.5*n2, mix(0.5, 0.3 + 0.6*(1. - smoothstep(0.13 - fa, 0.13 + fa, frf)), rowK), fldM*(1. - fbund)), mix(0.5, 0.44 + 0.16*(1. - smoothstep(0.05, 0.4, rf2)), 1. - smoothstep(0.09, 0.32, fwq)), inPlot*gm*vilM);      // on the rows of the crop first (the hamlet's, the village's), on the tufts of grass elsewhere
          b = mix(b, vec3(0.584, 0.672, 0.761)*frSh*(0.9 + 0.2*n3 + 0.45*spk), shF*shPat*hold*onRow*(1. - stM)*mix(1., 0.5, vilM));
          vec2 suv2 = suv - (uSfT.zw*1.1 + vec2(-uSfT.w, uSfT.z)*0.45)*uSfShR.yw;
          float sh2 = texture2D(tSfSh, suv2).r*step(0.001, suv2.x)*step(suv2.x, 0.999)*step(0.001, suv2.y)*step(suv2.y, 0.999)*(1. - wallM);
          float rim = clamp(sh2 - sfSh, 0., 1.)*(1. - sfSh)*uSfK.z*(1. - laneM)*(1. - 0.6*trod)*(1. - stM)*hold;
          b = mix(b, vec3(0.8, 0.87, 0.97)*(0.85 + 0.2*n2 + 0.2*n3) + vec3(0.5)*spk, 0.6*rim*(0.45 + 0.55*shPat)); }
        b = mix(b, uSfFrost*(0.7 + 0.2*n2 + 0.16*n3), 0.4*uSfT.y*(1. - wallM)*(1. - 0.7*laneM*(1. - lnCrown))*smoothstep(-450., -400., q.y));      // the mist look: hoar on everything the fog has touched, so the floor of the run is frost-silver, not drab earth (the lane's earth least; the village floor under the bank keeps its own tones, or the sea has no depth)
        // cedar crowns on the walls
        vec2 cq = q*0.17 + vec2(0., vTWorld.y*0.11); float cr = sfN(cq)*0.6 + sfN(cq*2.3 + 7.)*0.4, crFade = 1. - smoothstep(0.35, 1.2, fwq*0.17*3.);
        float crown = mix(smoothstep(0.34, 0.66, sfN(cq*0.45 + 5.)), smoothstep(0.3, 0.72, cr), crFade)*max(crFade, 0.35) + 0.5*smoothstep(0.4, 0.7, sfN(cq*0.45 + 5.))*crFade;      // single crowns near; stands of crowns where they are finer than a pixel
        vec3 cedC = uSfCedar*mix(0.16, 1.5, min(crown, 1.))*(0.8 + 0.4*sfN(q*0.013 + 3.));
        b = mix(b, cedC, wallM*0.92);
        float clump = smoothstep(0.3, 0.72, sfN(cq*0.21 + 3.)*0.6 + sfN(cq*0.52 + 11.)*0.4);   // stands of crowns, still there when single crowns are finer than a pixel
        totalEmissiveRadiance += uSfCedar*((0.08 + 0.5*min(crown, 1.) + 0.6*clump)*(0.55 + 0.8*sfN(q*0.013 + 3.))*(0.75 + 0.5*smoothstep(40., 280., vTWorld.y))*uSfW.z*wallM);     // sky light on the crowns: the shadow wall is near-black green, never a hole
        totalEmissiveRadiance += uSfHz.rgb*(uSfHz.w*wallM*exp(-max(vTWorld.y + 0.03*vTWorld.z, 0.)/45.)*(1. - exp(-length(vViewPosition)*0.004)));      // valley haze lies against the foot of the walls: the village sits in a lit bowl
        diffuseColor.rgb = max(b, vec3(0.)); }
      #include <roughnessmap_fragment>`)
      .replace('#include <fog_fragment>', `{ float sfTop = uSfMist.x + uSfMist.y*vTWorld.z;      // the floor under the fog bank fades to the same tone as what stands on it (mist look; nothing elsewhere)
          float sfM = (1. - smoothstep(sfTop - 4., sfTop + 2., vTWorld.y))*(1. - exp(-length(vViewPosition)*uSfMist.z*(cameraPosition.y > sfTop ? clamp((sfTop - vTWorld.y)/max(cameraPosition.y - vTWorld.y, 1e-3), 0., 1.) : 1.)))*uSfMist.w*(1. - smoothstep(-440., -400., vTWorld.z));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uSfMistC, sfM); }
        #include <fog_fragment>
        gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));`);
  };
  material.customProgramCacheKey = () => 'sf-ground';
  material.needsUpdate = true;
}

// Flooded paddies: thin sheets that mirror the sky and the black cedar walls, with leaves skating and rings where spray lands.
function makePaddyMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U), defines: { NR: U.uGn.value.length }, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aE; varying vec3 vW; varying vec4 vE;
      #include <fog_pars_vertex>
      void main(){ vE = aE; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying vec4 vE;
      uniform float uTime; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uDark; uniform vec3 uLeaf; uniform float uRings; uniform vec3 uSnowC; uniform vec4 uFanC; uniform vec4 uGn[NR]; uniform vec4 uGm[NR];
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv/dist; vec2 rp = vW.xz;
        float n1 = sfN(rp*1.3 + vec2(uTime*0.25, uTime*0.11)), n2 = sfN(rp*3.1 - vec2(uTime*0.2, -uTime*0.17));
        vec2 g = rp*0.8; vec2 id = floor(g); vec2 f = fract(g) - 0.5; float h = sfHash(id);
        float ph = fract(uTime*(0.5 + 0.5*h) + h*7.);
        float rd = length(f + (vec2(sfHash(id + 3.), sfHash(id + 7.)) - 0.5)*0.5);
        float ring = (1. - smoothstep(0., 0.06, abs(rd - ph*0.45)))*(1. - ph)*step(1. - uRings, sfHash(id + 11.));
        float amp = 2. - smoothstep(6., 28., dist);      // livelier ripples near the eye
        vec3 N = normalize(vec3(((n1 - 0.5)*0.06 + (n2 - 0.5)*0.04)*amp + ring*0.25*f.x, 1., ((n2 - 0.5)*0.06 + (n1 - 0.5)*0.04)*amp + ring*0.25*f.y));
        vec3 R = reflect(-V, N); float lh = max(length(R.xz), 1e-3), el = R.y/lh, azf = R.x/lh;
        float upv = step(R.z, 0.)*(1. - smoothstep(0.45, 0.85, abs(azf)));      // the mirror looks up the valley: the dark head wall lies in it, and over that the snow range, upside down
        float wall = mix(0.06 + (0.17 + 0.05*sfN(vec2(azf*5., 3.)))*upv, 0.22, smoothstep(0.5, 0.9, abs(azf)));
        vec3 sky = mix(uHor, uZen, smoothstep(0., 0.85, R.y));
        float top = wall + 0.08 + 0.3*sfN(vec2(azf*4.5 + 1., 5.))*(0.55 + 0.45*sfN(vec2(azf*17., 2.)));      // the range's skyline
        float snowM = smoothstep(wall - 0.02, wall + 0.05, el)*(1. - smoothstep(top - 0.05, top, el + (n1 - 0.5)*0.05))*upv;
        sky = mix(sky, mix(uSnowC*vec3(0.5, 0.62, 0.86), uSnowC*vec3(0.84, 0.9, 1.0), smoothstep(0.35, 0.65, sfN(vec2(azf*21. + 3., el*26.)))), 0.52*snowM);
        vec3 refl = mix(uDark, sky, smoothstep(wall - 0.07, wall + 0.04, el + (n1 - 0.5)*0.08));
        // The fans stand in the mirror, each where it stands in the world: the ray off the water is met with the upright plane each nearby gun throws in (its
        // lean of this moment), and the fan is the band between its longest and its shortest stream there, as high as its water has risen. (uGn: muzzle x, z, y,
        // azimuth now; uGm: reach of the longest stream, apex, spread, how far along its flight the water's front is, in times-to-the-crest.)
        float fanIn = 0.;
        for (int i = 0; i < NR; i++) {
          vec4 g = uGn[i], m = uGm[i]; if (m.w <= 0.) continue;
          vec2 d = vec2(sin(g.w), cos(g.w)), nn = vec2(d.y, -d.x); float den = dot(R.xz, nn); if (abs(den) < 1e-4) continue;
          float tt = dot(g.xy - vW.xz, nn)/den; if (tt <= 0.) continue;
          vec3 Q = vW + R*tt; float s = dot(Q.xz - g.xy, d), hh = Q.y - g.z; if (s <= 0.15 || s >= m.x*0.995 || hh < -2.5) continue;
          float t0 = -log(1. - s/m.x), y0 = m.y*(2.*t0 - t0*t0), r1 = m.x*(1. - m.z), t1 = -log(1. - min(s/r1, 0.995)), y1 = s < r1*0.995 ? 0.92*m.y*(2.*t1 - t1*t1) : -60.;
          float top = max(y0, y1) + 0.4, bot = min(y0, y1) - 0.4, sof = 0.25 + 0.012*tt;
          float fin = smoothstep(bot - sof, bot + sof, hh)*(1. - smoothstep(top - sof, top + sof, hh))*step(t0, m.w)*(0.5 + 0.5*sfN(vec2(s*1.9 + float(i)*7.3, uTime*2.2 - hh*0.5)));
          fanIn = max(fanIn, fin);
        }
        refl = mix(refl, uFanC.rgb, 0.8*fanIn);
        float cv = 1. - clamp(V.y, 0., 1.); float fres = 0.05 + 0.95*cv*cv*cv*cv;
        float sd = max(dot(R, uSun), 0.); float s2 = sd*sd; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;
        float s3 = s2*s2; s3 *= s3; s3 *= s3;      // the sun in the water: a small disc broken into glints by the ripples and a faint sheen round it (it was a white sheet 20 degrees across: a smear of white where a paddy lay close under the low sun)
        float glint = smoothstep(0.5, 0.78, sfN(rp*6.3 + vec2(uTime*0.8, -uTime*0.6)));
        vec3 col = mix(vec3(0.045, 0.04, 0.03), refl, clamp(fres*1.1 + 0.14, 0., 1.)) + uSunCol*(s3*(0.5 + 2.2*glint) + s2*s2*0.28);      // close to the eye we look down into a hand's depth of water over mud; further out it is a mirror
        float leaf = step(0.955, sfN(rp*2.4 + vec2(uTime*0.05, uTime*0.02)))*step(0.5, sfN(rp*0.21 + 9.));
        col = mix(col, uLeaf*0.8, leaf);
        float e = min(min(vE.x, vE.z - vE.x), min(vE.y, vE.w - vE.y));
        float a = mix(0.8, 0.97, fres)*smoothstep(0.0, 2.0, e + (n2 - 0.5)*0.9 + (n1 - 0.5)*0.7);
        a = max(a, leaf*0.9*step(0.4, e));
        // Where the sheet meets the bund: a rim of dark wet mud a stride wide, under the water's own ragged edge (the sheet's first metre, where the water thins to
        // nothing; its outer edge broken by a noise of the place, which does not move). The water lies over it as it did.
        float em = e + (sfN(rp*1.7 + 3.) - 0.5)*0.7, mudA = 0.85*smoothstep(0.0, 0.3, em)*(1. - smoothstep(0.9, 1.5, em)), aO = a + (1. - a)*mudA;
        col = (col*a + (vec3(0.075, 0.058, 0.04)*(0.8 + 0.4*sfN(rp*5.3)) + uHor*0.03)*((1. - a)*mudA))/max(aO, 1e-3);
        gl_FragColor = vec4(col, clamp(aO, 0., 1.));
        #include <fog_fragment>
        gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));
      }`,
  });
}

// Camera-parented: drawn straight in clip space so it holds the frame at any aspect ratio.
function makeLens(U) {        // the veil pass: beads on the lens that run off, and a short pale whitening
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: /* glsl */`
      varying vec2 vUv; uniform float uBead; uniform float uWhite; uniform float uAspect;
      float h21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
      vec4 sfBeads(vec2 g, float thr){      // one layer of beads: each a small lens (bright cap, dark lower rim, a glint), running off as uBead grows
        float cx = floor(g.x); g.y += uBead*uBead*(0.8 + 3.2*h21(vec2(cx, 3.)));
        vec2 id = floor(g), f = fract(g) - 0.5; float h = h21(id), h2 = h21(id + 17.), h3 = h21(id + 41.);
        float wetHere = step(0.4, h21(floor(id*0.31) + 5.));
        vec2 c = (vec2(h2, h3) - 0.5)*0.7; float r = 0.025 + 0.1*h3*h3 + 0.025*h2; vec2 e = (f - c)/r; e.y /= 1. + 2.2*uBead*(0.4 + h2); e.y -= 0.25*uBead; float d = length(e);
        float inside = (1. - smoothstep(0.8, 1., d))*step(thr, h)*wetHere;
        float hi = 1. - smoothstep(0.05, 0.3, length(e - vec2(-0.3, 0.38)));
        float up = e.y/max(d, 1e-3);
        float rimLo = smoothstep(0.5, 0.95, d)*(1. - smoothstep(-0.6, 0.2, up)), rimHi = smoothstep(0.6, 0.95, d)*smoothstep(0.1, 0.8, up);
        vec3 col = mix(vec3(0.5, 0.57, 0.66), vec3(1.25, 1.3, 1.35), clamp(hi + 0.5*rimHi, 0., 1.));
        col = mix(col, vec3(0.04, 0.06, 0.09), rimLo*0.75);                    // the lower rim is dark: it shows the ground, upside down
        return vec4(col, inside*(0.05 + 0.75*hi + 0.55*rimLo + 0.3*rimHi));
      }
      void main(){
        vec2 p = vUv*vec2(uAspect, 1.);
        float life = smoothstep(0., 0.06, uBead)*(1. - smoothstep(0.55, 1., uBead));
        vec4 la = sfBeads(p*5., 0.72), lb = sfBeads(p*8.3 + 17., 0.82);      // two sizes of bead, in clusters: parts of the lens stay dry
        vec4 bd = la.w > lb.w ? la : lb;
        float a = bd.w*life; vec3 col = bd.rgb;
        col = mix(col, vec3(0.9, 0.94, 0.98), uWhite/max(uWhite + a, 1e-3)); a = max(a, uWhite);
        if (a < 0.004) discard;
        gl_FragColor = vec4(max(col, vec3(0.)), clamp(a, 0., 1.));
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 41;
  return mesh;
}
// Camera-parented, in clip space: the dragonfly's own wings, two a side, confined to the outer 5% of the frame's width. A steady, dithered shimmer of
// pale membrane with an amber root, never a strobe; uSpread 1 = held wide (the hover), 0 = swept back (the run).
function makeWings(U) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: /* glsl */`
      varying vec2 vUv; uniform float uTime; uniform float uSpread; uniform float uAlpha;
      float h21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
      float sfWing(float e, float y, float yc, float slope, float hw, float tip){      // one blade: e = 0 at 5% in from the frame's edge .. 1 at the edge
        float along = clamp((e - tip)/max(1. - tip, 1e-3), 0., 1.), d = abs(y - (yc + slope*(1. - e)));
        float w = max(hw*sqrt(along)*(0.55 + 0.45*along), 1e-4);      // (never zero: a smoothstep with equal edges is undefined)
        float vein = 0.75 + 0.25*smoothstep(0.1, 0.3, abs(fract((y - yc)*26. + e*3.) - 0.5));
        return (1. - smoothstep(0.55*w, w, d))*smoothstep(0., 0.2, along)*vein;
      }
      void main(){
        float e = (abs(vUv.x) - 0.9)/0.1;
        if (e <= 0. || uAlpha < 0.003) discard;
        float tip = mix(0.5, 0.04, uSpread), sw = mix(1.7, 1., uSpread);
        float a = max(sfWing(e, vUv.y, 0.26, 0.55*sw, 0.2, tip), sfWing(e, vUv.y, -0.12, -0.42*sw, 0.16, tip + 0.08));
        float shim = 0.72 + 0.28*sin(vUv.y*17. + uTime*7.)*sin(e*5. + uTime*4.3);
        float dith = 0.7 + 0.6*h21(floor(gl_FragCoord.xy));
        a *= uAlpha*shim*dith;
        if (a < 0.004) discard;
        vec3 col = mix(vec3(0.9, 0.95, 1.0), vec3(1.0, 0.72, 0.42), smoothstep(0.5, 1., e)*0.6);      // light only: a glassy membrane catching the sun, amber toward its root
        gl_FragColor = vec4(col*clamp(a, 0., 0.1), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 40;
  return mesh;
}
function makeDrips(pts, seeds, U) {  // thaw dripping off the cut eave
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(seeds, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aS; varying float vA; uniform float uTime; uniform float uBufH;
      void main(){
        float t = fract(uTime*0.5 + aS*7.31), k = max(0., (t - 0.35)/0.65);
        vec3 p = position; p.y -= 4.4*k*k;
        vec4 mv = modelViewMatrix*vec4(p, 1.);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = clamp(0.05*projectionMatrix[1][1]*uBufH*0.5/max(-mv.z, 0.5), 1.5, 7.);
        vA = smoothstep(0., 0.3, t)*(1. - smoothstep(0.9, 1., k));
      }`,
    fragmentShader: /* glsl */`
      varying float vA; uniform vec3 uSunCol;
      void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q)*2.; float a = vA*(1. - smoothstep(0.4, 1., d)); if (a < 0.02) discard; gl_FragColor = vec4(vec3(0.75, 0.82, 0.9) + uSunCol*0.8, a*0.9); }`,
  });
  return new THREE.Points(g, m);
}

// The far range: a real height field in polar coordinates 2.3-3.9 km out (smooth normals, so no facets), snow by height
// and slope, dark rock below it, a blue shadow side, haze thickest at the foot. It follows the camera like a sky dome.
async function makeFarRange(ctx, noise, rng, U) {
  const N = 160, M = 16, A0 = -2.025, A1 = 2.025, R0 = 2300, R1 = 3850, ox = rng.range(0, 40), oz = rng.range(0, 40), c1 = rng.range(-0.22, 0.22), c2 = c1 + rng.sign() * rng.range(0.42, 0.6);   // two sure massifs beyond the valley head
  const H = (th, r) => {                         // th = 0 looks up the valley (-Z)
    const x = Math.sin(th) * r, z = -Math.cos(th) * r, t = (r - R0) / (R1 - R0);
    const env = sm(0, 0.62, t) * (1 - 0.4 * sm(0.72, 1, t)), head = 0.55 + 0.45 * Math.exp(-(th * th) / 1.1);
    const rg = noise.ridged2(th * 1.3 + ox, r / 1700 + oz, 5), big = 0.5 + 0.5 * noise.fbm2(th * 0.62 + 7 + ox, r / 2600 + oz, 2);
    const massif = 0.45 * Math.exp(-((th - c1) * (th - c1)) / 0.18) + 0.34 * Math.exp(-((th - c2) * (th - c2)) / 0.3);      // two broad massifs, not two spikes
    return -60 + env * head * (800 + 1130 * Math.min(1, rg * (0.75 + 0.25 * (1 - massif)) + massif * (0.6 + 0.4 * rg)) * (0.58 + 0.56 * big));      // a high continuous ridge joins the peaks
  };
  const at = (th, r, out) => { out[0] = Math.sin(th) * r; out[1] = H(th, r); out[2] = -Math.cos(th) * r; return out; };
  const pos = new Float32Array((N + 1) * (M + 1) * 3), nor = new Float32Array((N + 1) * (M + 1) * 3), idx = [], a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0];
  for (let j = 0; j <= M; j++) for (let i = 0; i <= N; i++) {
    if (i === 0) await ctx.yield();     // every ring
    const th = A0 + ((A1 - A0) * i) / N, r = R0 + (R1 - R0) * Math.pow(j / M, 0.85), o = (j * (N + 1) + i) * 3, dth = 45 / r;
    at(th, r, a); pos[o] = a[0]; pos[o + 1] = a[1]; pos[o + 2] = a[2];
    at(th + dth, r, b); at(th, r + 45, c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = (Math.hypot(nx, ny, nz) || 1) * (ny < 0 ? -1 : 1);
    nor[o] = nx / l; nor[o + 1] = ny / l; nor[o + 2] = nz / l;
  }
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) { const p0 = j * (N + 1) + i, p1 = p0 + 1, p2 = p0 + N + 1, p3 = p2 + 1; idx.push(p0, p1, p3, p0, p3, p2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normal; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      varying vec3 vN; varying vec3 vP;
      uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uHaze; uniform vec3 uRock; uniform vec2 uFoot; uniform vec4 uK;   // uFoot: where the foot haze starts (m) and its falloff; uK: snow line, alpenglow gate (0 day, 1 dusk), haze base, haze at the foot
      ${GLSL_NOISE}
      void main(){
        vec2 q = vP.xz*0.0042; float f0 = sfFbm(q), fa = sfFbm(q + vec2(0.3, 0.)), fb = sfFbm(q + vec2(0., 0.3));
        vec2 q2 = q*3.1 + 7.; float g0 = sfFbm(q2), ga = sfFbm(q2 + vec2(0.3, 0.)), gb = sfFbm(q2 + vec2(0., 0.3));
        vec3 n = vN/max(length(vN), 1e-4) + vec3(f0 - fa, 0., f0 - fb)*1.6 + vec3(g0 - ga, 0., g0 - gb)*0.9; n /= max(length(n), 1e-4);          // spurs and gullies finer than the mesh, in two sizes
        float fine = sfN(vP.xz*0.021 + vP.y*0.013);
        float snow = smoothstep(-70., 120., vP.y - uK.x + (f0 - 0.5)*460. + (g0 - 0.5)*220. + (fine - 0.5)*130. - (1. - n.y)*270.);
        float lit = smoothstep(-0.15, 0.7, dot(n, uSun));
        float steep = 1. - abs(n.y);
        lit *= mix(1., smoothstep(uK.x + 220., uK.x + 900., vP.y + (f0 - 0.5)*260.)*(0.3 + 0.7*clamp(steep*steep*3.2, 0., 1.))*(0.55 + 0.45*fine), uK.y);   // at dusk only the crests hold the last light: a pink rim that fades down into blue, never whole faces
        vec3 alb = mix(uRock*(0.55 + 0.9*f0), vec3(0.93, 0.96, 1.0)*(0.84 + 0.2*fine + 0.12*f0), snow);
        alb = mix(alb, uRock*(0.45 + 0.9*g0), 0.85*smoothstep(0.4, 0.7, steep + (g0 - 0.5)*0.35 + (fine - 0.5)*0.15));      // dark rock ribs where it is too steep for snow to lie
        vec3 col = alb*(uAmb*(0.6 + 0.4*n.y) + uSunCol*lit);
        float hz = clamp(uK.z + uK.w*exp(-max(vP.y - uFoot.x, 0.)/max(uFoot.y, 1.)), 0., 0.96);      // thickest from the head wall's top down, so the base melts into the fogged wall under it
        gl_FragColor = vec4(max(mix(col, uHaze, hz), vec3(0.)), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'far-range';
  return { object: mesh, update(dt, t, camera) { const e = camera.matrixWorld.elements; mesh.position.set(e[12], 0, e[14]); } };
}

// Hydrant hut: base with the brass gun into S; one roof half (pivot frame: hinge on the z axis at the origin, closed lid
// running toward -X) into a thatch Geo. Local +X is the way the fan is thrown.
const HUT_PITCH = Math.atan2(1.6, 1.9), HUT_LL = Math.hypot(1.9, 1.6) + 0.1;
function hutGeometry(rng, timber, stone, straw, redC, brass) {
  const S = new Geo(0);
  S.box(0, 0.1, 0, 3.5, 0.2, 3.5, stone(), { tx: 0.96, tz: 0.96, noBottom: true });
  for (const [px, pz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) S.box(px * 1.42, 0.86, pz * 1.42, 0.17, 1.32, 0.17, timber(), { noBottom: true });
  for (const px of [1, -1]) for (let k = 0; k < 4; k++) S.box(px * 1.45, 0.82, -1.08 + k * 0.72, 0.06, 1.24, 0.69, timber(), { noBottom: true, gb: 0.7 });
  const top = (x) => 1.25 + (1.9 - Math.abs(x)) * 0.842 - 0.13;
  for (const pz of [1, -1]) for (let k = 0; k < 6; k++) {
    const xa = -1.45 + k * 0.483, xb = xa + 0.483, z = pz * 1.45, c = timber(), A = [xa, 0.2, z], B = [xb, 0.2, z], C = [xb, top(xb), z], D = [xa, top(xa), z];
    if (pz > 0) { S.quad(A, B, C, D, c, 0.7, 0.7, 1, 1); S.quad(B, A, D, C, mul(c, 0.5), 1, 1, 1, 1); } else { S.quad(B, A, D, C, c, 0.7, 0.7, 1, 1); S.quad(A, B, C, D, mul(c, 0.5), 1, 1, 1, 1); }
  }
  S.box(1.49, 1.0, 0.7, 0.03, 0.42, 0.42, mul(redC, 0.9), { noBottom: true, gb: 1 });
  for (const pz of [1, -1]) { S.box(-0.55, 1.05, pz * 1.49, 0.72, 0.72, 0.05, mul(redC, 1.25), { gb: 1 }); S.box(-0.55, 1.05, pz * 1.525, 0.3, 0.3, 0.02, [0.6, 0.58, 0.5], { gb: 1, noBottom: true }); }
  S.cyl([0, 0.2, 0], [0, 1.4, 0], 0.2, 0.17, 6, mul(redC, 0.85)); S.cyl([0, 1.38, 0], [0, 1.5, 0], 0.27, 0.27, 6, mul(redC, 0.6), { cap: true });
  S.box(0, 1.6, 0, 0.34, 0.26, 0.34, brass, { tx: 0.8, tz: 0.8 });
  S.cyl([0.02, 1.55, 0], [0.52, 2.07, 0], 0.13, 0.08, 6, brass, { k1: 1.2 }); S.cyl([0.46, 2.01, 0], [0.57, 2.12, 0], 0.11, 0.1, 6, mul(brass, 1.3), { cap: true, capCol: [0.02, 0.02, 0.02] });
  S.cyl([0.1, 0.25, 0.3], [1.2, 0.25, 1.9], 0.07, 0.07, 5, [0.5, 0.52, 0.5]);
  const g = new Geo(4), th = 0.3, hw = 1.85, LL = HUT_LL;
  g.ex = [0, 0, 1, 0]; g.box(-LL / 2, th / 2, 0, LL, th, hw * 2, mul(straw, 1.15), { gb: 1, top: 1 });
  g.ex = [0, 0, 6, 0]; g.box(-LL / 2, -0.03, 0, LL - 0.12, 0.06, hw * 2 - 0.1, timber(), { gb: 1 });
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x0 = -LL + (LL * i) / 2, x1 = x0 + LL / 2, za = -hw + hw * j, zb = za + hw, e = (x, z) => [z, LL + x, 0, 0], y = th + 0.02;
    g.quad([x0, y, zb], [x1, y, zb], [x1, y, za], [x0, y, za], straw, 1, 1, 1, 1, [e(x0, zb), e(x1, zb), e(x1, za), e(x0, za)]);
  }
  for (let i = 0; i < 26; i++) { const z = rng.range(-hw, hw), e0 = [0, 0, 5, 0], e1 = [0, 0, 5, 1], ridge = i > 16, bx = ridge ? -LL : 0; g.tri([bx, th * rng(), z - 0.05], [bx, th * rng(), z + 0.05], [bx + (ridge ? -0.1 : rng.range(0.2, 0.42)), th + (ridge ? rng.range(0.2, 0.4) : -0.1), z + rng.range(-0.1, 0.1)], mul(straw, 1.3), 0.8, 0.8, 1.2, [e0, e0, e1]); }
  for (const z of [-1.1, 1.1]) g.box(-0.12, -0.02, z, 0.34, 0.05, 0.1, [0.05, 0.035, 0.03], { gb: 1 });
  return { base: S.build(), lid: g.build() };
}
// Rice-straw drying rack, 12 m long along z: trestles, two rails, sheaves astride them (thatch material).
function rackGeometry(rng, straw, timberC, r2) {
  const R = new Geo(4), len = 12;
  R.ex = [0, 0, 6, 0];
  for (let i = 0; i <= 4; i++) { const z = -len / 2 + (i * len) / 4; R.cyl([-0.55, 0, z], [0.07, 3.35, z], 0.06, 0.05, 4, timberC); R.cyl([0.55, 0, z], [-0.07, 3.35, z], 0.06, 0.05, 4, timberC); }
  for (const yy of [3.05, 1.7]) R.cyl([0, yy, -len / 2 - 0.5], [0, yy + 0.04, len / 2 + 0.5], 0.05, 0.05, 4, timberC, { cap: true });
  for (const yy of [3.05, 1.7]) for (let z = -len / 2 + 0.25; z < len / 2; z += yy > 2 ? 0.8 : 1.3) { if (rng.chance(yy > 2 ? 0.06 : 0.3)) continue; for (let k = 0; k < 5; k++) rng(); }      // (the draws the old, gappy sheaves took)
  R.ex = [0, 0, 2, 0];
  for (const yy of [3.05, 1.7]) for (let z = -len / 2 + 0.3; z < len / 2; z += yy > 2 ? 0.78 : 1.3) {      // sheaves astride the rails, shoulder to shoulder on the top one
    if (r2.chance(yy > 2 ? 0.03 : 0.3)) continue;
    const h = r2.range(1.0, 1.3), c = mul(mix3(straw, [0.5, 0.39, 0.19], r2.range(0.2, 0.75)), r2.range(0.85, 1.2)), sp = yy < 2 ? 0.3 : 0.2;
    for (const sd of [-1, 1]) R.box(sd * sp, yy - h / 2 + 0.1, z + r2.range(-0.04, 0.04), 0.22, h, yy > 2 ? 0.9 : 0.78, c, { tx: 0.45, tz: 0.86, lean: [-sd * (sp - 0.07), 0], gb: 0.8, top: 1, noBottom: true });
  }
  R.box(0, 3.2, 0, 0.46, 0.2, len - 0.1, mul(mix3(straw, [0.5, 0.39, 0.19], 0.45), r2.range(1.0, 1.25)), { tx: 0.65, gb: 0.85, top: 1.1, noBottom: true });      // the ridge of straw along the top rail: from above the rack is one band, not a row of teeth
  return R.build();
}
// A straw stook into G: a ragged ten-sided skirt, a dark tied band, a splayed tuft above it (r: its own stream).
function stookGeo(G, r, wx, y, z, lean, hgt, c2) {
  const n = 10, yT = y + hgt * 0.8, rt = 0.2, ring = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r.range(-0.12, 0.12); ring.push([Math.cos(a), Math.sin(a), (i % 2 ? 0.6 : 0.8) * r.range(0.92, 1.1), r.range(0.8, 1.15), r.range(-0.05, 0.03)]); }
  for (let i = 0; i < n; i++) {
    const p = ring[i], q = ring[(i + 1) % n];
    const A = [wx + p[0] * p[2], y + p[4], z + p[1] * p[2]], B = [wx + q[0] * q[2], y + q[4], z + q[1] * q[2]], C = [wx + lean + q[0] * rt, yT, z + q[1] * rt], D = [wx + lean + p[0] * rt, yT, z + p[1] * rt];
    G.vert(A, p[0], 0.35, p[1], c2, 0.68 * p[3]); G.vert(C, q[0], 0.35, q[1], c2, 1.1 * q[3]); G.vert(B, q[0], 0.35, q[1], c2, 0.68 * q[3]);
    G.vert(A, p[0], 0.35, p[1], c2, 0.68 * p[3]); G.vert(D, p[0], 0.35, p[1], c2, 1.1 * p[3]); G.vert(C, q[0], 0.35, q[1], c2, 1.1 * q[3]);
  }
  G.cyl([wx + lean * 0.86, y + hgt * 0.69, z], [wx + lean * 0.96, y + hgt * 0.76, z], 0.3, 0.26, 6, [0.16, 0.11, 0.055]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + r.range(-0.2, 0.2), c = mul(c2, r.range(0.9, 1.12)), tip = [wx + lean + Math.cos(a + 0.4) * r.range(0.3, 0.46), y + hgt * r.range(0.95, 1.1), z + Math.sin(a + 0.4) * r.range(0.3, 0.46)];
    const P = [wx + lean + Math.cos(a) * 0.19, yT - 0.06, z + Math.sin(a) * 0.19], Q = [wx + lean + Math.cos(a + 0.85) * 0.19, yT - 0.06, z + Math.sin(a + 0.85) * 0.19];
    G.tri(P, tip, Q, c, 0.8, 1.1, 0.8); G.tri(P, Q, tip, c, 0.6, 0.6, 0.9);
  }
}
function person(S, rng, x, y, z, ry) {     // a watcher in a dark coat: a speck beside a hut
  const coat = mul(rng.pick([[0.07, 0.085, 0.14], [0.14, 0.1, 0.075], [0.05, 0.08, 0.2], [0.24, 0.05, 0.04], [0.2, 0.19, 0.17]]), rng.range(0.8, 1.6)), s = rng.range(0.9, 1.08);
  S.box(x, y + 0.42 * s, z, 0.34 * s, 0.84 * s, 0.24 * s, [0.15, 0.16, 0.25], { ry, noBottom: true, tx: 0.9 });
  S.box(x, y + 1.14 * s, z, 0.5 * s, 0.7 * s, 0.3 * s, coat, { ry, tx: 0.8, tz: 0.85 });
  S.box(x, y + 1.62 * s, z, 0.21 * s, 0.24 * s, 0.22 * s, rng.chance(0.4) ? mul(coat, 1.4) : [0.42, 0.3, 0.22], { ry, tx: 0.85, tz: 0.85 });
  S.box(x, y + 1.8 * s, z, 0.64 * s, 0.14 * s, 0.64 * s, [0.62, 0.52, 0.31], { ry, noBottom: true, tx: 0.2, tz: 0.2 });
}

export default {
  id: 'sixty-fountains',
  name: 'Sixty Fountains',
  category: 'city',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, vr = rng.fork('sf-look'), pick = vr();
    const lookId = vary.hour === 'dawn' ? 'mist' : vary.hour === 'day' ? 'morning' : vary.hour === 'golden' ? 'golden' : vary.hour === 'night' ? 'dusk'
      : pick < 0.4 ? 'morning' : pick < 0.62 ? 'golden' : pick < 0.82 ? 'dusk' : 'mist';
    const look = LOOKS[lookId], MX = look.mx, late = vr.chance(0.3), rare = !!vary.rare, dens = vary.density ?? 1, isDusk = lookId === 'dusk';
    const cast = { fruit: vr.chance(0.7) ? vr.range(0.8, 1) : vr.range(0.05, 0.3), sparrows: vr.chance(0.35), swarm: vr.chance(0.5) ? 1.5 : 0.75, trucks: vr.chance(0.4) ? 2 : 1 };
    const xr = vr.fork('extra');     // for everything added later: forking here leaves the other streams as they were
    const pal = PALETTE.map(lin), [cedarC, thatchC, , whiteC, persC, redC, goldC] = pal;
    const scene = new THREE.Scene(), time = { value: 0 }, updaters = [];

    // ------------------------------------------------------------ sky, fog, light
    const SUN = skyDirection(look.sunEl, MX * look.sunAz);
    const KEY = isDusk ? new THREE.Vector3(MX * 0.3, 0.72, -0.62).normalize() : SUN.clone();      // direction of the key light and of the silver in the water
    const sky = makeSky({ rng: rng.fork('sky'), preset: look.preset, ...look.sky, sunElevation: look.sunEl, sunAzimuth: MX * look.sunAz, clouds: false, clouds2: false, fogColor: look.fog, renderer: ctx.renderer, bake: isDusk });
    sky.object.name = 'sky'; scene.add(sky.object); updaters.push(sky);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(look.fog, look.fogD);
    const hemi = new THREE.HemisphereLight(look.hemi[0], look.hemi[1], look.hemi[2]);
    const sun = new THREE.DirectionalLight(look.sun, look.sunI); sun.position.copy(KEY).multiplyScalar(400);
    scene.add(hemi, sun);
    const ambC = lookId === 'golden' ? new THREE.Color('#6f86b8').multiplyScalar(0.42) : new THREE.Color(look.hemi[0]).multiplyScalar(isDusk ? 0.4 : 0.5), hazeC = new THREE.Color(look.fog).lerp(new THREE.Color(look.sky.horizon), isDusk ? 0.15 : lookId === 'mist' ? 0.1 : 0.35);
    const ridges = await makeFarRange(ctx, noise, rng.fork('ridges'), {
      uSun: { value: isDusk ? skyDirection(9, MX * look.sunAz) : KEY.clone() }, uSunCol: { value: new THREE.Color(look.ridgeSun).multiplyScalar(isDusk ? 0.9 : lookId === 'morning' ? 0.86 : lookId === 'golden' ? 1.1 : 0.95) },
      uAmb: { value: ambC }, uHaze: { value: hazeC }, uRock: { value: new THREE.Color('#465468') },
      uK: { value: new THREE.Vector4(lookId === 'golden' ? 380 : late ? 500 : 620, isDusk ? 1 : 0, isDusk ? 0.2 : 0.16, lookId === 'mist' ? 0.8 : lookId === 'morning' ? 0.36 : lookId === 'golden' ? 0.42 : 0.52) },
      uFoot: { value: lookId === 'mist' ? new THREE.Vector2(600, 420) : isDusk ? new THREE.Vector2(250, 520) : new THREE.Vector2(0, 620) } });
    scene.add(ridges.object); updaters.push(ridges);
    await ctx.yield();
    // four thin lens clouds standing over the far range
    const lensAt = [];
    for (let i = 0; i < 4; i++) {
      const cx = MX * (-1000 + i * 620 + rng.range(-120, 120)), cy = rng.range(900, 1180), cz = -2500 - rng.range(0, 400), w0 = rng.range(520, 760) * 0.3;
      for (let k = -4; k <= 4; k++) lensAt.push([cx + k * w0 * 0.3, cy - k * k * 0.5, cz + (k % 2) * 12, w0 * (1 - 0.05 * k * k)]);      // nine overlapping discs fuse into one smooth almond
    }
    const lensOpt = { sky, height: 0.05, puffs: 22, altitudeJitter: 0, wind: [MX * 2.2, 0, 0.6], opacity: 0.45, erode: 0.15, softness: 0.9, bump: 0.08, crisp: 0.05 }, lensA = lensAt.slice(0, 18), lensB = lensAt.slice(18);
    await ctx.yield();
    {   // the cloud fields' noise texture (two channels of four-octave value noise, tiling), built as the kit builds it but with a yield after every octave
      const size = 256, N = size * size, fch = [new Float32Array(N), new Float32Array(N)], ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size), nrg = ctx.core.makeRng('sf-cloudnoise:' + ctx.seed);
      for (let ch = 0; ch < 2; ch++) for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
        const acc = fch[ch], lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = nrg();
        for (let x = 0; x < size; x++) { const fx = (x / size) * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
        for (let y = 0; y < size; y++) { const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
          for (let x = 0, p = y * size; x < size; x++, p++) { const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x], ab = a + (b - a) * w; acc[p] += amp * (ab + (c + (d - c) * w - ab) * wy); } }
        await ctx.yield();
      }
      const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1, px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
      for (let y = 0; y < size; y++) { for (let x = 0; x < size; x++) { const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
        data[p * 4] = px(fch[0][p]); data[p * 4 + 1] = px(fch[1][p]); data[p * 4 + 2] = px(fch[0][s]); data[p * 4 + 3] = px(fch[0][s2]); } if (y === 127) await ctx.yield(); }
      const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
      tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true; lensOpt.noiseTexture = tex;
    }
    await ctx.yield();
    const lens = makeCloudField({ rng: rng.fork('lens'), ...lensOpt, count: lensA.length, at: lensA });      // two fields of two clouds each: each is a short step
    scene.add(lens.object); updaters.push(lens);
    await ctx.yield();
    const lens2 = makeCloudField({ rng: ctx.core.makeRng('sf-lens2:' + ctx.seed), ...lensOpt, count: lensB.length, at: lensB, noiseTexture: lens.noiseTexture || null });
    scene.add(lens2.object); updaters.push(lens2);
    await ctx.yield();

    // ------------------------------------------------------------ hero first: the path is laid on its anchors
    const wind = [MX * 0.9, 0, 1.6];
    const hero = await buildHero(ctx, { palette: PALETTE, progress: 0, sunDir: KEY.toArray(), sunColor: look.fsun, wind, fruit: cast.fruit, snow: late ? 0.6 : 0, paperGlow: look.glow, bounce: isDusk ? 0.22 : 0.6 });
    const floorY = (z) => 30 * clamp(-z / 1000, -0.25, 1.15);
    const HERO = { x: -20, z: -657 }, heroY = floorY(HERO.z), THETA = Math.atan(0.404);
    hero.object.position.set(MX * HERO.x, heroY, HERO.z); hero.object.rotation.y = MX * THETA; hero.object.updateMatrixWorld(true); scene.add(hero.object);
    const toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    if (hero.fountains) { hero.fountains.uniforms.uWater.value.set(look.water); hero.fountains.uniforms.uShade.value.set(look.shade); }
    await ctx.yield();

    // ------------------------------------------------------------ layout space (x mirrored into the world by MX)
    const AV = (z) => HERO.x + (z - HERO.z) * 0.404;                       // the avenue: the hero's fly-through axis
    const laneRaw = (z) => (z > -95 ? 0 : z > -150 ? 5 * sm(-95, -150, z) : z > -250 ? 5 : z > -300 ? lerp(5, 8, (-250 - z) / 50) : z > -330 ? lerp(8, 14, (-300 - z) / 30) : z > -425 ? lerp(14, AV(-425), (-330 - z) / 95) : AV(z));
    const LZ0 = -640, LZ1 = 60, LN = 280, laneTab = new Float32Array(LN + 1);
    for (let i = 0; i <= LN; i++) { const z = LZ0 + ((LZ1 - LZ0) * i) / LN; let s = 0; for (let k = -4; k <= 4; k++) s += laneRaw(z + k * 3.2); laneTab[i] = s / 9; }
    const LX = (z) => { const f = clamp((z - LZ0) / (LZ1 - LZ0), 0, 1) * LN, i = Math.min(LN - 1, Math.floor(f)); return lerp(laneTab[i], laneTab[i + 1], f - i); };
    const laneDist = (x, z) => { const d = (LX(z + 2) - LX(z - 2)) / 4; return Math.abs(x - LX(z)) / Math.sqrt(1 + d * d); };
    const RX = (z) => 92 + 12 * Math.sin(z * 0.011 + 1) + 7 * Math.sin(z * 0.027);
    const PAD = { x0: -72, z0: -246, nx: 4, nz: 6, cx: 36, cz: 28 }, padLevel = (r) => floorY(PAD.z0 - PAD.cz * (clamp(r, 0, PAD.nz - 1) + 0.5)) - 0.3;
    const KN = { x: -112, z: -330, r: 36, h: 7 };
    const wallAt = (x, z) => {
      const east = x > 0, W = 160 + 16 * noise.n2(z * 0.004, east ? 3 : 9), dx = Math.abs(x) - W, dz = -960 - z; let h = 0;
      if (dx > 0) { const H = east ? 300 : 400, tn = east ? 0.577 : 0.7; h = H * (1 - Math.exp((-dx * tn) / H)); }
      if (dz > 0) { const H = 350 + 110 * sm(70, 380, Math.abs(x)), hh = H * (1 - Math.exp((-dz * 0.92) / H)); h = Math.max(h, hh) + 0.3 * Math.min(h, hh); }
      if (h > 0) h *= 1 + 0.2 * noise.fbm2(x * 0.005, z * 0.005, 3) * sm(0, 50, h) + 0.1 * noise.ridged2(x * 0.011 + 7, z * 0.011, 3) * sm(10, 90, h);
      return h;
    };
    const heightL = (x, z) => {
      const dl = laneDist(x, z);
      let h = floorY(z) + 0.35 * noise.fbm2(x * 0.014, z * 0.014, 3) * sm(3, 12, dl);
      const cxi = (x - PAD.x0) / PAD.cx, czi = (PAD.z0 - z) / PAD.cz;
      if (cxi > -0.1 && cxi < PAD.nx + 0.1 && czi > -0.1 && czi < PAD.nz + 0.1) {
        const m = sm(-0.06, 0.02, cxi) * sm(PAD.nx + 0.06, PAD.nx - 0.02, cxi) * sm(-0.08, 0.03, czi) * sm(PAD.nz + 0.08, PAD.nz - 0.03, czi) * sm(4, 7.5, dl);
        const q = czi - 0.5, r0 = Math.floor(q), lv = lerp(padLevel(r0), padLevel(r0 + 1), sm(0.44, 0.56, q - r0));
        h = lerp(h, lv, m);
      }
      h -= 2.0 * (1 - sm(5, 11.5, Math.abs(x - RX(z))));
      if (z > -250) h += 1.0 * bell(RX(z) - x, 13.5, 5.5) * sm(-250, -222, z);
      h = lerp(heroY - 0.03, h, sm(44, 72, Math.hypot(x - HERO.x, z - HERO.z)));
      const dk = Math.hypot(x - KN.x, z - KN.z); if (dk < KN.r) h += KN.h * sm(KN.r, KN.r * 0.3, dk);
      return h + wallAt(x, z);
    };

    // ------------------------------------------------------------ path
    const P = (x, hh, z) => [MX * x, floorY(z) + hh, z];
    const fly = hero.anchors.flyThrough.map(toWorld);
    const path = makePath([P(0, 4, 8), P(0.6, 3.9, -30), P(-0.6, 3.3, -50), P(-0.7, 3.0, -62), P(-0.7, 3.0, -75), P(-0.7, 3.0, -88), P(0.3, 3.4, -104), P(3.4, 4, -125), P(5.5, 4.5, -150), P(5.2, 4.5, -190),
      P(5.0, 4.0, -235), P(6, 2.9, -280), P(10, 2.7, -318), P(23, 6, -352), P(36, 22, -388), P(42, 42, -422), P(46, 55, -460), P(40, 42, -500),
      [MX * 38, fly[0].y + 11.3, -538], ...fly.map((v) => [v.x, v.y, v.z])]);
    await ctx.yield();
    const L = path.length, uAtZ = (x, z) => path.nearestXZ(MX * x, z).u;
    let zVeil = -252; { let za = -215, zb = -292; for (let i = 0; i < 18; i++) { zVeil = (za + zb) / 2; if (uAtZ(5.2, zVeil) < 0.378) za = zVeil; else zb = zVeil; } }   // the veil falls just after the u 0.37 frame
    const nearP = T.pathNearest(path), pathD = (x, z) => nearP(MX * x, z);            // layout-space distance to the path
    await ctx.yield();

    // ------------------------------------------------------------ terrain
    const gk = [[-20, -302, 10], [-17, -112, 9], [41, -327, 10], [-58, -438, 11], [46, -598, 11], [-56, -602, 12]].map(([x, z, r]) => [x + rng.range(-2, 2), z + rng.range(-2, 2), r * rng.range(0.9, 1.15)]);
    const dayDark = lookId === 'morning' ? 0.62 : lookId === 'golden' ? 0.58 : 1;      // the morning's walls stand in their own shadow: near-black green, which the water is read against
    const cFloor = lin(isDusk ? '#857a5a' : '#a48f58'), cFloorB = lin(isDusk ? '#666248' : '#7f7148'), cVillage = lin(isDusk ? '#6f6450' : '#7d6c4c'), cBack = lin('#2a3024'), cWall = mul(cedarC, isDusk ? 3.6 : 3.0 * dayDark), cGravel = lin('#7c7a70'), cBed = [0.03, 0.045, 0.045];
    const wallMask = (x, z) => clamp(sm(150, 178, Math.abs(x)) + sm(-950, -992, z), 0, 1);
    const groundCol = (x, z, out) => {
      const k = 0.5 + 0.5 * noise.fbm2(x * 0.02, z * 0.02, 2), w = wallMask(x, z), vil = sm(-405, -440, z) * 0.7, back = sm(-790, -900, z), gr = 1 - sm(8, 15, Math.abs(x - RX(z))), bed = 1 - sm(4, 8.5, Math.abs(x - RX(z)));
      for (let i = 0; i < 3; i++) { let c = lerp(cFloorB[i], cFloor[i], k); c = lerp(c, cVillage[i], vil); c = lerp(c, cBack[i], back); c = lerp(c, cGravel[i], gr * 0.8); c = lerp(c, cBed[i], bed); out[i] = lerp(c, cWall[i], w); }
      return out;
    };
    const tmpC = [0, 0, 0];
    const focus = (x, z) => {
      const lx = MX * x; let d = nearP(x, z).dist;
      d = Math.min(d, 18 + Math.abs(lx - RX(z)) * 0.9, 8 + Math.hypot(lx - HERO.x, z - HERO.z) * 0.45);
      if (z < -400 && z > -920 && Math.abs(lx) < 165) d = Math.min(d, 60);
      return d;
    };
    await ctx.yield();
    const land = await T.makeTerrainAsync({
      rng: rng.fork('land'), noise, path, height: (x, z) => heightL(MX * x, z), corridor: false, cell: 4, near: 30, bounds: [-640, -1500, 640, 260], maxTriangles: 30000, refine: 1, focus,
      biome: 'alpine', palette: { rock: '#232c26', rockB: '#2e332a', strata: 0.1, snowAmount: 0, clouds: 0, tufts: late || look.frost > 0.6 ? 0.3 : 0.6, pebbles: 0.04, cracks: 0, patchAmount: 0.04 }, sunDir: (isDusk ? new THREE.Vector3(MX * 0.2, 0.9, -0.3) : KEY).toArray(), ao: 0.5, skirt: 30,
      color: (x, z, h, ny, out) => { groundCol(MX * x, z, tmpC); out.r = tmpC[0]; out.g = tmpC[1]; out.b = tmpC[2]; return out; },
    }, ctx.yield, 2);     // asks for a frame at every break the kit offers
    await ctx.yield();
    land.object.name = 'land'; scene.add(land.object); updaters.push(land);
    const laneData = new Uint16Array((LN + 1) * 2);
    for (let i = 0; i <= LN; i++) { const z = LZ0 + ((LZ1 - LZ0) * i) / LN, d = (LX(z + 2) - LX(z - 2)) / 4; laneData[i * 2] = THREE.DataUtils.toHalfFloat(laneTab[i]); laneData[i * 2 + 1] = THREE.DataUtils.toHalfFloat(1 / Math.sqrt(1 + d * d)); }
    const laneTex = new THREE.DataTexture(laneData, LN + 1, 1, THREE.RGFormat, THREE.HalfFloatType); laneTex.magFilter = laneTex.minFilter = THREE.LinearFilter; laneTex.needsUpdate = true;
    const frostC = late ? [0.76, 0.83, 0.92] : [0.7, 0.78, 0.88];
    const sfK = new THREE.Vector4(MX, late ? 0.75 : 0.3, clamp(look.frost + (late ? 0.25 : 0), 0, 1), 0);      // w: how far the frost line has retreated (set from u)
    const VIL = { w: 768, h: 768, x0: -176, x1: 176, z0: -944, z1: -416 }, vilData = new Uint8Array(VIL.w * VIL.h * 4);      // filled once the houses and guns are placed
    const vilTex = new THREE.DataTexture(vilData, VIL.w, VIL.h, THREE.RGBAFormat, THREE.UnsignedByteType); vilTex.magFilter = THREE.LinearFilter; vilTex.minFilter = THREE.LinearMipmapLinearFilter; vilTex.generateMipmaps = true;
    // the hamlet's plot map (8 x 16 plots, nearest): R crop (0 straw stubble, 1 turned earth, 2 winter green, 3 fallow), G worked along the lane, B frost held, A tone
    const nr = ctx.core.makeRng('sf-r8:' + ctx.seed);      // its own stream: everything added with the plot map draws from here, so the older streams are as they were
    const r17 = ctx.core.makeRng('sf-r17:' + ctx.seed);      // round seventeen's additions (the eave strings' fruit, the hamlet's curtains) draw from here
    const r9 = ctx.core.makeRng('sf-r9:' + ctx.seed);      // round nine's additions (kerb, channel plumes, paddy stooks, avenue fruit) draw from here
    const plotData = new Uint8Array(8 * 16 * 4);
    for (let i = 0; i < 128; i++) { const r = nr(); plotData[i * 4] = (r < 0.4 ? 0 : r < 0.58 ? 1 : r < 0.85 ? 2 : 3) * 85; plotData[i * 4 + 1] = nr.chance(0.75) ? 255 : 0; plotData[i * 4 + 2] = Math.round(255 * nr.range(0.1, 1)); plotData[i * 4 + 3] = Math.round(255 * nr()); }
    const plotTex = new THREE.DataTexture(plotData, 8, 16, THREE.RGBAFormat, THREE.UnsignedByteType); plotTex.magFilter = plotTex.minFilter = THREE.NearestFilter; plotTex.needsUpdate = true;
    const plotAt = (x, z) => { const fx = Math.floor((x + 9) / 31), fy = Math.floor((z + 3) / 23 + 0.37 * fx); return { fx, fy, type: plotData[(clamp(fy + 12, 0, 15) * 8 + clamp(fx + 3, 0, 7)) * 4] / 85 }; };
    const uMist = { value: new THREE.Vector4(9.5, -0.03, 0.024, look.groundFog ? 0.75 : 0) }, uMistC = { value: new THREE.Color('#c6c8d0') };      // (pearl: it was a cold grey-blue, and from the climb the sea, the floor and the houses' feet were all that one grey)      // the fog bank the village stands in (mist look only)
    // The litter map (layout space, a metre a texel, the cast-shadow map's own rectangle): what has fallen and lies on the floor. It is painted once at build, when the
    // trees are placed, and read by the ground shader: R crimson leaves, G gold leaves, B fallen persimmons, A straw chaff. Nothing in it changes after build().
    const LIT = { w: 340, h: 1024 }, litData = new Uint8Array(LIT.w * LIT.h * 4), WDX = 0.9 / Math.hypot(0.9, 1.6), WDZ = 1.6 / Math.hypot(0.9, 1.6);      // WDX, WDZ: the way the wind blows, in layout space
    const litTex = new THREE.DataTexture(litData, LIT.w, LIT.h, THREE.RGBAFormat, THREE.UnsignedByteType); litTex.magFilter = THREE.LinearFilter; litTex.minFilter = THREE.LinearMipmapLinearFilter; litTex.generateMipmaps = true;
    const litEll = (cx, cz, ra, rb, vals) => {      // an ellipse lying along the wind (ra along it, rb across), fullest at its middle; vals: how much of R, G, B, A
      const sx = 340 / LIT.w, sz = 1024 / LIT.h, r = Math.max(ra, rb), i0 = Math.max(0, Math.floor((cx - r + 170) / sx)), i1 = Math.min(LIT.w - 1, Math.ceil((cx + r + 170) / sx)), j0 = Math.max(0, Math.floor((cz - r + 960) / sz)), j1 = Math.min(LIT.h - 1, Math.ceil((cz + r + 960) / sz));
      for (let j = j0; j <= j1; j++) { const z = -960 + (j + 0.5) * sz - cz; for (let i = i0; i <= i1; i++) {
        const x = -170 + (i + 0.5) * sx - cx, d = Math.hypot((x * WDX + z * WDZ) / ra, (z * WDX - x * WDZ) / rb); if (d >= 1) continue;
        const o = (j * LIT.w + i) * 4; for (let c = 0; c < 4; c++) { const v = 255 * vals[c] * (1 - d); if (v > litData[o + c]) litData[o + c] = v; } } }
    };
    // The cast-shadow map (layout space, about half a metre a texel): the long shadows of houses, trees, racks, stooks and huts under the low sun, painted
    // once at build (below, when everything is placed) and read by the ground shader and by the grass. Nothing in it changes after build().
    const SH = { w: 640, h: 1920, x0: -170, x1: 170, z0: -960, z1: 64 }, shData = new Uint8Array(SH.w * SH.h);
    const shTex = new THREE.DataTexture(shData, SH.w, SH.h, THREE.RedFormat, THREE.UnsignedByteType); shTex.magFilter = THREE.LinearFilter; shTex.minFilter = THREE.LinearMipmapLinearFilter; shTex.generateMipmaps = true;
    const shC = look.shC || [1, 1, 1], shHyp = Math.hypot(KEY.x, KEY.z) || 1, shDX = (-MX * KEY.x) / shHyp, shDZ = -KEY.z / shHyp, shCot = isDusk ? 0 : Math.min(shHyp / Math.max(KEY.y, 0.05), 3.2), shK = look.shK ?? 0;
    const shPoly = (pts, amt, soft = 0.8) => {      // the convex hull of pts (layout x, z), filled, with a soft edge
      const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), Hh = [], cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      for (const q of p) { while (Hh.length >= 2 && cr(Hh[Hh.length - 2], Hh[Hh.length - 1], q) <= 0) Hh.pop(); Hh.push(q); }
      const lo = Hh.length + 1; for (let i = p.length - 2; i >= 0; i--) { const q = p[i]; while (Hh.length >= lo && cr(Hh[Hh.length - 2], Hh[Hh.length - 1], q) <= 0) Hh.pop(); Hh.push(q); }
      Hh.pop(); const n = Hh.length; if (n < 3 || shCot <= 0 || shK <= 0) return; amt *= shK;
      const E = new Float64Array(n * 4); let xa = 1e9, xb = -1e9, za = 1e9, zb = -1e9;
      for (let i = 0; i < n; i++) { const a = Hh[i], b = Hh[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; E[i * 4] = -dz / l; E[i * 4 + 1] = dx / l; E[i * 4 + 2] = a[0]; E[i * 4 + 3] = a[1]; xa = Math.min(xa, a[0]); xb = Math.max(xb, a[0]); za = Math.min(za, a[1]); zb = Math.max(zb, a[1]); }
      const sx = (SH.x1 - SH.x0) / SH.w, sz = (SH.z1 - SH.z0) / SH.h, i0 = Math.max(0, Math.floor((xa - soft - SH.x0) / sx)), i1 = Math.min(SH.w - 1, Math.ceil((xb + soft - SH.x0) / sx)), j0 = Math.max(0, Math.floor((za - soft - SH.z0) / sz)), j1 = Math.min(SH.h - 1, Math.ceil((zb + soft - SH.z0) / sz));
      for (let j = j0; j <= j1; j++) { const z = SH.z0 + (j + 0.5) * sz; for (let i = i0; i <= i1; i++) {
        const x = SH.x0 + (i + 0.5) * sx; let d = 1e9; for (let k = 0; k < n; k++) { const e = (x - E[k * 4 + 2]) * E[k * 4] + (z - E[k * 4 + 3]) * E[k * 4 + 1]; if (e < d) d = e; }
        if (d <= -soft) continue; const v = amt * 255 * sm(-soft, soft, d), o = j * SH.w + i; if (v > shData[o]) shData[o] = v; } }
    };
    const shOff = (x, z, h) => [x + shDX * h * shCot, z + shDZ * h * shCot];      // where the shadow of a point h metres up falls
    const shEll = (cx, cz, a, b, amt) => {      // an ellipse lying along the shadow's direction (a crown's shadow)
      if (shCot <= 0 || shK <= 0) return; amt *= shK;
      const sx = (SH.x1 - SH.x0) / SH.w, sz = (SH.z1 - SH.z0) / SH.h, r = Math.max(a, b) * 1.1, i0 = Math.max(0, Math.floor((cx - r - SH.x0) / sx)), i1 = Math.min(SH.w - 1, Math.ceil((cx + r - SH.x0) / sx)), j0 = Math.max(0, Math.floor((cz - r - SH.z0) / sz)), j1 = Math.min(SH.h - 1, Math.ceil((cz + r - SH.z0) / sz));
      for (let j = j0; j <= j1; j++) { const z = SH.z0 + (j + 0.5) * sz - cz; for (let i = i0; i <= i1; i++) {
        const x = SH.x0 + (i + 0.5) * sx - cx, d = Math.hypot((x * shDX + z * shDZ) / a, (z * shDX - x * shDZ) / b); if (d >= 1.08) continue;
        const v = amt * 255 * (1 - sm(0.72, 1.08, d)), o = j * SH.w + i; if (v > shData[o]) shData[o] = v; } }
    };
    const shBox = (x, z, ry, hx, hz, h, amt, soft) => {      // a box of half extents hx, hz turned by ry, h metres tall
      const c = Math.cos(ry), s = Math.sin(ry), pts = []; for (const [lx, lz] of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]) { const px = x + lx * c + lz * s, pz = z - lx * s + lz * c; pts.push([px, pz], shOff(px, pz, h)); }
      shPoly(pts, amt, soft);
    };
    const shHouse = (x, z, ry, hl, wx, hw, eaveY, ridge, amt) => {      // a gassho: walls, eaves and the ridge line
      const c = Math.cos(ry), s = Math.sin(ry), pts = [], at = (lx, lz, h) => { const px = x + lx * c + lz * s, pz = z - lx * s + lz * c; pts.push(h > 0 ? shOff(px, pz, h) : [px, pz]); };
      for (const sz2 of [-1, 1]) { for (const sx2 of [-1, 1]) { at(sx2 * wx, sz2 * hl, 0); at(sx2 * hw, sz2 * (hl + 1.2), eaveY); } at(0, sz2 * (hl + 1.2), ridge); }
      shPoly(pts, amt, 0.9);
    };
    const shCone = (x, z, r, h, amt) => shPoly([[x - shDZ * r, z + shDX * r], [x + shDZ * r, z - shDX * r], [x - shDX * r, z - shDZ * r], shOff(x, z, h)], amt, 0.9);      // a conifer
    const shTree = (x, z, rc, hc, amt) => { if (shCot <= 0) return; const [cx, cz] = shOff(x, z, hc); shPoly([[x - shDZ * 0.22, z + shDX * 0.22], [x + shDZ * 0.22, z - shDX * 0.22], [cx + shDZ * 0.22, cz - shDX * 0.22], [cx - shDZ * 0.22, cz + shDX * 0.22]], amt, 0.35); shEll(cx, cz, rc * (1 + 0.45 * shCot), rc, amt); };      // trunk and crown
    const shAt = (wx, z) => {      // the map at a world point, 0..1 (for the grass)
      const fx = ((MX * wx - SH.x0) / (SH.x1 - SH.x0)) * SH.w - 0.5, fz = ((z - SH.z0) / (SH.z1 - SH.z0)) * SH.h - 0.5, i = Math.floor(fx), j = Math.floor(fz); if (i < 0 || j < 0 || i >= SH.w - 1 || j >= SH.h - 1) return 0;
      const a = fx - i, b2 = fz - j, o = j * SH.w + i; return (lerp(lerp(shData[o], shData[o + 1], a), lerp(shData[o + SH.w], shData[o + SH.w + 1], a), b2)) / 255;
    };
    const castSh = { shadeAt(wx, z, out = [1, 1, 1]) { const s = shAt(wx, z); out[0] *= lerp(1, Math.min(1, shC[0] * 2.3), s); out[1] *= lerp(1, Math.min(1, shC[1] * 2.3), s); out[2] *= lerp(1, Math.min(1, shC[2] * 2.3), s); return out; } };      // (the tufts hold frost there too: they darken less than the ground, or they would be black specks on it)
    const sfT = new THREE.Vector4(0, lookId === 'mist' ? 1 : 0, shCot > 0 ? shDX : 0, shCot > 0 ? shDZ : 0);      // x: u (set every frame: the wet ground under a fan follows the wave); z, w: the way shadows fall (layout space), for the shadows of pebbles, clods and stubble
    patchGround(land.material, {
      tSfPlot: { value: plotTex }, tSfLit: { value: litTex }, uSfLeafR: { value: new THREE.Color(0.48, 0.1, 0.03) },
      tSfSh: { value: shTex }, uSfShR: { value: new THREE.Vector4(SH.x0, 1 / (SH.x1 - SH.x0), SH.z0, 1 / (SH.z1 - SH.z0)) }, uSfShC: { value: new THREE.Color(shC[0], shC[1], shC[2]) },
      tSfVil: { value: vilTex }, uSfVil: { value: new THREE.Vector4(VIL.x0, 1 / (VIL.x1 - VIL.x0), VIL.z0, 1 / (VIL.z1 - VIL.z0)) },
      tSfLane: { value: laneTex }, uSfLane: { value: new THREE.Vector4(LZ0, 1 / (LZ1 - LZ0), -628, 58) }, uSfPad: { value: new THREE.Vector4(PAD.x0, PAD.z0, PAD.nx, PAD.nz) },
      uSfGk: { value: gk.map((g) => new THREE.Vector4(g[0], g[1], g[2], late ? 1.25 : 1)) }, uSfFrost: { value: new THREE.Color(frostC[0], frostC[1], frostC[2]) },
      uSfLeaf: { value: new THREE.Color(goldC[0], goldC[1], goldC[2]) }, uSfCedar: { value: new THREE.Color(cedarC[0], cedarC[1], cedarC[2]).multiplyScalar(isDusk ? 4.7 : lookId === 'golden' ? 2.2 : 3.4 * (lookId === 'morning' ? 0.68 : 1)) },
      uSfK: { value: sfK }, uSfW: { value: new THREE.Vector4(0.72 * clamp(look.frost + (late ? 0.2 : 0), 0, 1), isDusk ? 0 : lookId === 'golden' ? 1.0 : 0.9, isDusk ? 0.45 : lookId === 'mist' ? 0.55 : lookId === 'morning' ? 0.72 : 0.55, lookId === 'mist' ? 0.5 : 0) },
      uSfHz: { value: new THREE.Vector4().fromArray([...new THREE.Color(look.fog).toArray(), isDusk ? 0.05 : lookId === 'golden' ? 0.04 : lookId === 'morning' ? 0.08 : 0.2]) },      // haze lying against the foot of the walls
      uSfMist: uMist, uSfMistC: uMistC, uSfT: { value: sfT },
    });
    const groundAt = (x, z) => land.heightAt(MX * x, z);       // layout-space ground height
    await ctx.yield();

    // ------------------------------------------------------------ houses
    const hr = rng.fork('houses');
    const timberBase = mix3(mul(cedarC, 0.9), [0.085, 0.055, 0.035], 0.6), straw = mix3(mul(thatchC, 1.8), [0.3, 0.29, 0.27], 0.22), paper = mul(whiteC, 0.8);
    const TIMK = isDusk ? [1.25, 1.15, 1.05] : [2.1, 1.75, 1.45];      // seen against the low sun the old timber was a black hole in the picture
    const mkTimber = (r) => () => { const c = mul(mix3(timberBase, [0.16, 0.12, 0.085], r() * r()), r.range(0.75, 1.3)); return [c[0] * TIMK[0], c[1] * TIMK[1], c[2] * TIMK[2]]; };
    const mkStone = (r) => () => { const g = r.range(0.13, 0.3); return mix3([g, g * 1.02, g * 1.05], r.chance(0.25) ? [0.12, 0.17, 0.08] : [0.32, 0.3, 0.26], r() * 0.45); };
    const timber = mkTimber(hr), stone = mkStone(hr);
    const uGlow = { value: look.glow }, uSunV = { value: KEY.clone() }, uSunSide = { value: MX }, uSunCol = { value: new THREE.Color(look.fsun) }, uBufH = { value: 1080 };
    const uFill = { value: new THREE.Color().fromArray(look.fill || [0, 0, 0]) };      // warm light thrown back by the sunlit ground (day looks)
    const solidMat = makeSolidMat(uGlow, uMist, uMistC, uFill, uSunV), softMat = makeSoftMat(time, uGlow, uFill);
    const wetK = new THREE.Vector4(MX, 1, 0, 0), wetH = [0, 1, 2].map(() => new THREE.Vector4(0, 0, 1, 9));      // where the fans land on the thatch: z = u (set every frame); the hamlet's three roof guns are filled in below
    const thatchMat = makeThatchMaterial({
      uTime: time, uSunSide, uSunW: uSunV, uSfMist: uMist, uSfMistC: uMistC, uMoss: { value: new THREE.Color(0.095, 0.135, 0.05) }, uFrost: { value: new THREE.Color(0.6, 0.66, 0.73) }, uFresh: { value: new THREE.Color(0.62, 0.47, 0.22) },
      uPatch: { value: [0, 1, 2].map(() => new THREE.Vector4(hr.range(-7, 7), hr.sign() * hr.range(3, 11), hr.range(0.8, 1.7), hr.range(0.9, 1.9))) }, uSL: { value: 15 }, uSnow: { value: late ? 0.6 : 0 }, uBounce: { value: isDusk ? 0.3 : 0.95 },
      tSfWet: { value: vilTex }, uSfWetR: { value: new THREE.Vector4(VIL.x0, 1 / (VIL.x1 - VIL.x0), VIL.z0, 1 / (VIL.z1 - VIL.z0)) }, uSfWetK: { value: wetK }, uSfWetH: { value: wetH },
    });
    const variant = async (o) => { const S = new Geo(0), Th = new Geo(4); await buildGassho(ctx, S, Th, { noise, rng: hr, straw, timber, paper, stone, ...o }); return { solid: S.build(), thatch: Th.build(), ...o }; };
    const eaveOf = (ridgeY, eaveY) => (ridgeY - eaveY) / 0.866;
    const variants = [], farVars = [];
    for (let i = 0; i < 3; i++) { const ridgeY = [12.6, 15.4, 18.4][i]; variants.push(await variant({ L: [16, 21, 26][i], WX: [4.2, 4.8, 5.5][i], ridgeY, dTop: eaveOf(ridgeY, 3.1), hi: false, leanTo: i === 2 })); await ctx.yield(); }
    for (const v of variants) { farVars.push(await variant({ L: v.L, WX: v.WX, ridgeY: v.ridgeY, dTop: v.dTop, hi: false, far: true, leanTo: v.leanTo })); await ctx.yield(); }
    const kr = ctx.core.makeRng('sf-fix:' + ctx.seed), tuftR = ctx.core.makeRng('sf-tufts:' + ctx.seed);      // the fine eave straw has its own stream, so the houses' stream is as it was
    let hiVar; { const o = { L: 20, WX: 4.8, ridgeY: 15.6, dTop: eaveOf(15.6, 3.2), hi: true, tufts: 0.6 * detail, trng: tuftR, eaveTufts: 2 }, S = new Geo(0), Th = new Geo(4);
      await buildGassho(ctx, S, Th, { noise, rng: hr, straw, timber, paper, stone, ...o }); await ctx.yield();
      const solid = await S.buildSlowly(ctx); await ctx.yield(); hiVar = { solid, thatch: await Th.buildSlowly(ctx), ...o }; }
    await ctx.yield();
    const houses = [];                                   // layout space: { x, z, ry, s, v (-1 = hi), ridge }
    for (const [x, z] of [[26, -100], [-24, -158], [30, -190], [-27, -215], [28, -236]]) houses.push({ x, z, ry: hr.range(-0.07, 0.07), s: hr.range(0.95, 1.05), v: -1 });
    {
      const cand = [];
      for (let row = 0; row < 12; row++) {
        const z0 = -438 - row * 41, hw = lerp(72, 150, sm(-430, -610, z0));
        for (let x0 = -hw + (row % 2) * 16; x0 <= hw; x0 += 33) {
          const x = x0 + hr.range(-5, 5), z = z0 + hr.range(-6, 6), pd = pathD(x, z);
          if (z > -640 && laneDist(x, z) < 15.5) continue;
          if (Math.hypot(x - HERO.x, z - HERO.z) < 52 || x > RX(z) - 21 || Math.abs(x) > 150) continue;
          if (pd.dist < 18 && pd.y - floorY(z) < 36) continue;
          if (gk.some((g) => Math.hypot(x - g[0], z - g[1]) < 15)) continue;
          cand.push({ x, z });
        }
      }
      hr.shuffle(cand);
      for (const c of cand.slice(0, 52)) houses.push({ x: c.x, z: c.z, ry: hr.range(-0.12, 0.12), s: lerp(0.86, 1.16, (hr.range(0.9, 1.1) - 0.9) / 0.2), v: hr.int(0, 2) });
    }
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), YAX = new THREE.Vector3(0, 1, 0), colT = new THREE.Color();
    const place = (x, y, z, ry, s) => M4.compose(V3.set(MX * x, y, z), Q.setFromAxisAngle(YAX, MX * ry), S3.set(s, s, s));
    for (const h of houses) { const hv = h.v < 0 ? hiVar : variants[h.v];
      // The great house is the largest thing in the valley, unmistakably: the two larger village variants stop at about 17 m to the ridge and 24 m long (the great
      // house is 25.5 m and 30 m). What was placed around a house (its gun, racks, trees) stays where its first size put it (hx0, hz0, ridge0), so nothing else moves.
      h.hx0 = hv.dTop * 0.5 * h.s; h.hz0 = (hv.L / 2 + 1.2) * h.s; h.ridge0 = hv.ridgeY * h.s; if (h.v === 2) h.s = Math.min(h.s, 0.92); else if (h.v === 1) h.s = Math.min(h.s, 1.05);
      h.hx = hv.dTop * 0.5 * h.s; h.hz = (hv.L / 2 + 1.2) * h.s; h.wx = hv.WX * h.s;      // half extents: eave to eave, verge to verge, wall to wall
      h.y = groundAt(h.x, h.z) - 0.12; h.ridge = hv.ridgeY * h.s; h.g = h.v < 0 ? (h.z < -170 ? -2 : -1) : h.v + (pathD(h.x, h.z).dist > 75 ? 3 : 0); }
    for (let v = -2; v < 6; v++) {
      const list = houses.filter((h) => h.g === v), vv = v < 0 ? hiVar : v < 3 ? variants[v] : farVars[v - 3]; if (!list.length) continue;
      if (v === -2) list.reverse();      // the hamlet's last three, furthest up the lane first: update() stops drawing each one once it is behind us
      const mt = new THREE.InstancedMesh(vv.thatch, thatchMat, list.length), ms = new THREE.InstancedMesh(vv.solid, solidMat, list.length);
      list.forEach((h, i) => {
        place(h.x, h.y, h.z, h.ry, h.s); mt.setMatrixAt(i, M4); ms.setMatrixAt(i, M4);
        const k = hr.range(0.82, 1.12); mt.setColorAt(i, colT.setRGB(k * hr.range(0.95, 1.06), k, k * hr.range(0.9, 1.04))); h.ct = colT.toArray(); ms.setColorAt(i, colT.setRGB(1, 1, 1).multiplyScalar(hr.range(0.85, 1.15))); h.cs = colT.r;
      });
      mt.name = 'thatch' + v; ms.name = 'walls' + v; scene.add(mt, ms);
    }
    await ctx.yield();
    const hamletFar = [];
    {
      const list = houses.filter((h) => h.g === -2), mid = await variant({ L: 20, WX: 4.8, ridgeY: 15.6, dTop: eaveOf(15.6, 3.2), hi: false, rng: xr, timber: mkTimber(xr), stone: mkStone(xr) });
      const mt = new THREE.InstancedMesh(mid.thatch, thatchMat, list.length), ms = new THREE.InstancedMesh(mid.solid, solidMat, list.length);
      list.forEach((h, i) => { place(h.x, h.y, h.z, h.ry, h.s); mt.setMatrixAt(i, M4); ms.setMatrixAt(i, M4); mt.setColorAt(i, colT.fromArray(h.ct)); ms.setColorAt(i, colT.setRGB(h.cs, h.cs, h.cs)); });
      mt.name = 'thatch-far'; ms.name = 'walls-far'; scene.add(mt, ms); hamletFar.push(mt, ms);
    }
    await ctx.yield();
    const heroFar = new THREE.Group(); heroFar.add(new THREE.Mesh(farVars[1].thatch, thatchMat), new THREE.Mesh(farVars[1].solid, solidMat));
    heroFar.position.set(MX * HERO.x, heroY + 1.4, HERO.z); heroFar.rotation.y = MX * THETA; heroFar.scale.setScalar(1.55); heroFar.name = 'hero-far'; scene.add(heroFar);
    // the eave house: west of the lane, its sunlit eave hung with drying fruit; we fly under it
    const EH = { x: -8, z: -73, L: 26, WX: 4.6, ridgeY: 19.5 }, fruitGeo = new THREE.SphereGeometry(1, 8, 4); fruitGeo.scale(1, 0.88, 1);
    const dripPts = [], dripSeeds = [], ehWin = [];
    {
      const er = rng.fork('eave'), S = new Geo(0), Th = new Geo(4), W = new Geo(3), fruits = [], side = MX, { L: EL, WX } = EH, zB = -EL / 2, zF = EL / 2, tm = mkTimber(er);
      await buildGassho(ctx, S, Th, { noise, rng: er, straw, timber: tm, paper, stone: mkStone(er), L: EL, WX, ridgeY: EH.ridgeY, dTop: 15.7, TH: 1.05, hi: true, tufts: 1.2 * detail, trng: tuftR, eaveTufts: 3, trim: true, darkSide: isDusk ? 0 : side });
      await ctx.yield();
      const cordC = [0.3, 0.25, 0.15], foodDim = isDusk ? 0.55 : 1;
      const hang = (x, y, z, len0, ph) => {     // one straw cord of drying food; sways as a pendulum in the shader
        const kind = er() < cast.fruit ? 0 : er.chance(0.5) ? 1 : 2, len = kind === 0 ? Math.min(len0 * 1.18, y - 0.45) : len0, e0 = [0, ph, 0], e1 = [len, ph, 0];      // (a string of fruit hangs a little longer than the corn and radish)
        W.quad([x - 0.03, y, z], [x + 0.03, y, z], [x + 0.03, y - len, z], [x - 0.03, y - len, z], cordC, 1, 1, 1, 1, [e0, e0, e1, e1]);
        W.quad([x, y, z - 0.03], [x, y, z + 0.03], [x, y - len, z + 0.03], [x, y - len, z - 0.03], cordC, 1, 1, 1, 1, [e0, e0, e1, e1]);
        if (kind === 0) {      // peeled persimmons tied in pairs, a knot every 11 cm: thirty to forty fruit to a string (their own stream; the old, sparse string's draws are still taken, so the eave's stream is where it was)
          for (let d = 0.2; d < len0; d += 0.2) for (let k = 0; k < 6; k++) er();
          for (let d = 0.16, k = 0; d < len - 0.04; d += 0.11, k++) { const a = ph + k * 2.1 + r17.range(-0.3, 0.3);
            for (const sg of [1, -1]) { const c = mul(mix3(persC, [0.36, 0.09, 0.015], r17() < 0.2 ? r17.range(0.3, 0.7) : r17() * 0.15), r17.range(0.85, 1.25));
              fruits.push(x + sg * Math.cos(a) * 0.062, y - d + r17.range(-0.015, 0.015), z + sg * Math.sin(a) * 0.062, r17.range(0.064, 0.08), d, ph, c[0], c[1], c[2]); } }
        } else if (kind === 1) for (let d = 0.25; d < len; d += 0.3) for (let k = 0; k < 3; k++) {
          const a = er.range(0, 6.28), cx = x + Math.cos(a) * 0.07, cz = z + Math.sin(a) * 0.07; W.ex = [d, ph, 0];
          const cc = mul(mix3(goldC, [0.75, 0.55, 0.2], er()), er.range(0.7, 1)); if (k < 2) hangCorn(W, [cx, y - d, cz], [cx + Math.cos(a) * 0.05, y - d - 0.3, cz + Math.sin(a) * 0.05], cc, 7, foodDim, 3);      // seen from 1.4 m: round cobs with kernel rows and husks
        } else for (let d = 0.1; d < len - 0.5; d += 0.75) { W.ex = [d + 0.4, ph, 0]; const tdx = er.range(-0.03, 0.03); hangRadish(W, x, y - d, z, tdx, er.range(0.7, 0.82), 8, foodDim); }      // round radishes with a green shoulder and their leaves
      };
      const xr = side * (WX + 0.8), yR = 4.5;
      S.cyl([xr, yR, zB + 0.5], [xr, yR + 0.04, zF - 0.5], 0.06, 0.05, 6, tm(), { cap: true });
      for (let z = zB + 1; z < zF; z += 4) S.beam([side * WX, yR + 0.32, z], [xr + side * 0.15, yR - 0.05, z], 0.1, 0.12, tm());
      for (let z = zB + 0.9, run = 0; z < zF - 0.8; z += 0.35, run++) { if (run % 15 > 12) continue; hang(xr, yR - 0.04, z, er.range(1.5, 2.1), er.range(0, 6.28)); }
      logs(S, er, side * (WX + 0.24), 0.02, zB + 1.5, 26, 4, 'x', side, 0.7);                      // firewood along the wall
      logs(S, er, side * (WX + 0.24), 0.02, zF - 7.5, 20, 5, 'x', side, 0.7);
      S.box(side * (WX + 0.62), 0.5, 1.2, 0.95, 0.08, 6.6, [0.2, 0.16, 0.11], { gb: 0.8 });       // a veranda bench with tubs on it
      for (let k = 0; k < 4; k++) S.box(side * (WX + 0.62), 0.24, -1.6 + k * 1.9, 0.16, 0.48, 0.16, tm(), { noBottom: true });
      for (const [bz, r, hgt] of [[-0.8, 0.3, 0.5], [2.8, 0.36, 0.42], [3.6, 0.22, 0.3]]) S.cyl([side * (WX + 0.62), 0.54, bz], [side * (WX + 0.62), 0.54 + hgt, bz], r * 0.88, r, 9, [0.2, 0.15, 0.1], { cap: true, capCol: [0.05, 0.07, 0.09] });
      for (let k = 0; k < 9; k++) { const z = zB + 1 + k * 0.33; S.box(-side * (WX + 0.3), 1.7, z + 6, 0.06, 3.3, 0.3, mul([0.3, 0.25, 0.16], er.range(0.75, 1.2)), { lean: [side * 0.3, 0], gb: 0.72, noBottom: true }); }   // reed snow fence on the shade side
      for (const sgn of [1, -1]) stoneLantern(S, side * (sgn * 4 - 5.4), 0, zF + 11, mkStone(er)());
      for (let x = -WX + 0.35; x < WX - 0.2; x += 0.62) { if (Math.abs(x + 0.2) < 1.35) continue; hang(x, 2.12, zF + 2.32, er.range(1.15, 1.6), er.range(0, 6.28)); }
      await ctx.yield();
      const y0 = groundAt(EH.x, EH.z) - 0.05, grp = new THREE.Group(); grp.position.set(MX * EH.x, y0, EH.z); grp.name = 'eave-house';
      const soft = new THREE.Mesh(await W.buildSlowly(ctx), softMat); soft.frustumCulled = false;
      await ctx.yield();
      const ehS = await S.buildSlowly(ctx); await ctx.yield(); const ehT = await Th.buildSlowly(ctx); await ctx.yield();
      // The strings' fruit, drawn twice over: round (the half of each fruit that the lane can see: 24 triangles) from 10 m ahead of the eye to just behind it, and
      // in 8 triangles beyond that. Each list is in order of z, and update() copies the stretch that is wanted to the front of the instance buffers (ehWin).
      const ehGH = new THREE.SphereGeometry(1, 4, 4, side > 0 ? Math.PI / 4 : -Math.PI / 4, Math.PI), ehGL = new THREE.BufferGeometry(); ehGH.scale(1, 0.88, 1);
      { const R = [[0, 1, 0]], I = []; for (const th of [1.05, 2.09]) for (const ph of [-1.5708, 0, 1.5708]) R.push([Math.sin(th) * Math.sin(ph), Math.cos(th) * 0.88, Math.sin(th) * Math.cos(ph)]); R.push([0, -0.88, 0]);      // the plain one: the half that faces the approach, eight triangles, a hexagon in outline
        for (const [a, b, c] of [[0, 1, 2], [0, 2, 3], [1, 4, 5], [1, 5, 2], [2, 5, 6], [2, 6, 3], [7, 5, 4], [7, 6, 5]]) { const A = R[a], B = R[b], C = R[c], ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
          if ((uy * vz - uz * vy) * (A[0] + B[0] + C[0]) + (uz * vx - ux * vz) * (A[1] + B[1] + C[1]) + (ux * vy - uy * vx) * (A[2] + B[2] + C[2]) > 0) I.push(a, b, c); else I.push(a, c, b); }
        ehGL.setAttribute('position', new THREE.Float32BufferAttribute(R.flat(), 3)); ehGL.setAttribute('normal', new THREE.Float32BufferAttribute(R.flat(), 3)); ehGL.setIndex(I); }
      const ehF = makeFruitMesh(fruits, ehGH, time, uSunV, isDusk ? 0.3 : 0.62), ehL = makeFruitMesh(fruits, ehGL, time, uSunV, isDusk ? 0.3 : 0.62); ehF.name = 'eave-fruit'; ehL.name = 'eave-fruit-far'; await ctx.yield();
      for (const m of [ehF, ehL]) { if (!m.count || !m.instanceColor) continue; const n = m.count, a = m.instanceMatrix.array, ord = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[j * 16 + 14] - a[i * 16 + 14]), ats = [[m.instanceMatrix, 16], [m.instanceColor, 3], [m.geometry.attributes.iSw, 3]];
        const full = ats.map(([at, k]) => { const src = at.array, out = new Float32Array(n * k); ord.forEach((s, i) => { for (let c = 0; c < k; c++) out[i * k + c] = src[s * k + c]; }); at.array.set(out); at.needsUpdate = true; return out; });
        const zs = new Float32Array(n); for (let i = 0; i < n; i++) zs[i] = full[0][i * 16 + 14] + EH.z; ehWin.push({ m, ats, full, zs, a: 0, b: n }); await ctx.yield(); }
      grp.add(new THREE.Mesh(ehS, solidMat), new THREE.Mesh(ehT, thatchMat), soft, ehF, ehL); scene.add(grp);
      for (let i = 0; i < 120; i++) { dripPts.push(MX * EH.x + side * er.range(8.25, 8.5), y0 + 4.8 + er.range(-0.1, 0.2), EH.z + er.range(zB - 1, zF + 1)); dripSeeds.push(er()); }
      houses.push({ x: EH.x, z: EH.z, ry: 0, s: 1, v: 9, y: y0, ridge: EH.ridgeY, ridge0: EH.ridgeY, L: EL, hx: 7.85, hz: EL / 2 + 1.2, hx0: 7.85, hz0: EL / 2 + 1.2, wx: WX });
    }
    const drips = makeDrips(dripPts, dripSeeds, { uTime: time, uBufH, uSunCol }); drips.visible = !isDusk; scene.add(drips);
    await ctx.yield();

    // ------------------------------------------------------------ hydrant huts, guns, the sixty fans
    const gr = rng.fork('guns'), guns = [], WAVE0 = 0.2, WAVE1 = 0.56;      // the village wave: first and last thresholds in u (the thatch's wet stripes use the same two numbers)   // layout space: { x, z, az, range, apex, spread, thr, floor }
    guns.push({ x: 10.5, z: -104, az: 1.32, range: 20, apex: 28, spread: 0.5, thr: 0.128, roof: 1, lat: 0.12 }, { x: -2.5, z: -150, az: -1.93, range: 24, apex: 26.5, spread: 0.55, thr: 0.148, roof: 1, lat: 0.14 },
      { x: -21, z: -93, az: 0.6, range: 21, apex: 25, spread: 0.5, thr: 0.158, roof: 1, lat: 0.12 }, { x: 17, z: -196, az: -1.5, range: 32, apex: 15, spread: 0.15, thr: 0.2, roof: 0 },
      { x: -7, z: -188, az: 1.5, range: 32, apex: 15, spread: 0.15, thr: 0.214, roof: 0 }, { x: 30, z: zVeil, az: -Math.PI / 2, range: 24.7, apex: 14.5, spread: 0.3, thr: 0.272, roof: 0, veil: 1 });      // a low arc: seen whole over the lane before we fly through its fall
    const fanClear = (g) => { for (const a of [-0.5, 0, 0.5]) for (const t of [0.3, 0.6, 0.85, 1.05]) { const px = g.x + Math.sin(g.az + a) * g.range * t, pz = g.z + Math.cos(g.az + a) * g.range * t, pd = pathD(px, pz); if (pd.dist < 13 && pd.y - floorY(pz) < 44) return false; } return true; };
    for (const h of houses) {
      if (h.v < 0 || h.v > 2) continue;
      let best = null;
      for (const sx of gr.chance(0.5) ? [1, -1] : [-1, 1]) {
        const off = Math.max(12.5, h.hx0 + 4.6), g = { x: h.x + sx * off, z: h.z + gr.range(4, 9), range: gr.range(16, 19) + off - 12.5, apex: Math.max(gr.range(23, 27.5), h.ridge0 + 7.5), spread: 0.55, roof: 1, lat: 0.16 };
        g.az = Math.atan2(h.x - g.x, h.z - 2 - g.z) + gr.range(-0.08, 0.08);
        const pd = pathD(g.x, g.z);
        if (houses.some((o) => o !== h && Math.abs(g.x - o.x) < o.hx0 + 2.4 && Math.abs(g.z - o.z) < o.hz0 + 2.4)) continue;
        if (laneDist(g.x, g.z) < 6.5 || (pd.dist < 10 && pd.y - floorY(g.z) < 30) || Math.hypot(g.x - HERO.x, g.z - HERO.z) < 46) continue;
        if (fanClear(g)) { best = g; break; }
      }
      if (!best) { best = { x: h.x, z: h.z - h.hz0 - 3.5, range: 15, apex: Math.max(27, h.ridge0 + 7.5), spread: 0.55, roof: 1, az: 0, lat: 0.16 }; }
      best.thr = lerp(WAVE0, WAVE1, clamp((-430 - best.z) / 465, 0, 1)) + gr.range(-0.01, 0.01);
      guns.push(best);
    }
    for (const z of [-552, -606, -662, -716]) {      // the river bank throws too: something for the east side of the climb to hold
      const x = RX(z) - 12, g = { x, z, az: Math.PI / 2 + xr.range(-0.3, 0.3), range: xr.range(16, 19), apex: xr.range(21, 25), spread: 0.42, roof: 0, extra: 1 };
      g.thr = lerp(WAVE0, WAVE1, clamp((-430 - z) / 465, 0, 1)) + xr.range(-0.01, 0.01); if (pathD(x, z).dist > 30) guns.push(g);
    }
    {   // guns 6-9 (their own stream): two roof guns beside the hamlet's last two houses, so the run has fans on both sides, and two heralds beyond the
        // paddies on the lane's axis, leaning together at its vanishing point from the first seconds (nothing runs at u = 0)
      const roofGun = (hx, hz, gx, gz) => ({ x: gx, z: gz, az: Math.atan2(hx - gx, hz - 2 - gz), range: 20, apex: nr.range(23, 25) + 5.5, spread: 0.55, roof: 1, lat: 0.16, thr: 9, nw: 1 });
      const hClear = (xx) => !houses.some((h) => Math.abs(xx - h.x) < 11.5 && Math.abs(-416.5 - h.z) < 17); let hs = 0;
      for (const d of [0, 2.5, -2.5, 5, -5, 7.5]) if (hClear(-4 + d) && hClear(12 + d)) { hs = d; break; }      // clear of the first row of village houses
      const herald = (x, az, thr) => ({ x: x + hs, z: -416.5, az, range: 16, apex: 30, spread: 0.5, roof: 0, thr, nw: 1 });
      guns.splice(6, 0, roofGun(-27, -215, -14.5, -210), roofGun(28, -236, 40, -231), herald(-4, Math.PI / 2, 9), herald(12, -Math.PI / 2, 9));
    }
    const r11 = ctx.core.makeRng('sf-r11:' + ctx.seed);      // round eleven's additions draw from here, so the older streams give what they gave
    const r14 = ctx.core.makeRng('sf-r14:' + ctx.seed);      // and round fourteen's from here
    const gunE = { x: 17.6, z: -181.5, az: Math.atan2(30 - 17.6, -192 + 181.5), range: 20, apex: r14.range(28, 30), spread: 0.55, roof: 1, lat: 0.16, thr: 9, r14: 1 };
    guns.push(gunE);
    {   // the last two guns: an arch of water over the causeway where the first paddies end. It jumps up ahead of us as we come out of the veil and we fly
        // under it, so the crossing of the paddies has water overhead against the sky and the peaks, and the village is seen through it
      const zp = -330, lx = LX(zp);
      guns.push({ x: lx - 13, z: zp + 1.5, az: Math.PI / 2, range: 25, apex: r11.range(15, 16), spread: 0.15, roof: 0, thr: 9, pd: 1 }, { x: lx + 13, z: zp - 1.5, az: -Math.PI / 2, range: 25, apex: r11.range(15, 16), spread: 0.15, roof: 0, thr: 9, pd: 1 });      // each lands just short of the other's hut, on dry ground, clear of the ginkgo beyond
    }
    await ctx.yield();
    {   // the village map: yards (R), footpaths (G), wet fall zones (B), frost in the shade of each house (A)
      const W = VIL.w, Hh = VIL.h, d = vilData, sx = (VIL.x1 - VIL.x0) / W, sz = (VIL.z1 - VIL.z0) / Hh;
      const put = (ch, xa, za, xb, zb, f) => {
        const i0 = Math.max(0, Math.floor((xa - VIL.x0) / sx)), i1 = Math.min(W - 1, Math.ceil((xb - VIL.x0) / sx)), j0 = Math.max(0, Math.floor((za - VIL.z0) / sz)), j1 = Math.min(Hh - 1, Math.ceil((zb - VIL.z0) / sz));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const v = f(VIL.x0 + (i + 0.5) * sx, VIL.z0 + (j + 0.5) * sz) * 255, o = (j * W + i) * 4 + ch; if (v > d[o]) d[o] = v; }
      };
      const disc = (ch, cx, cz, rx, rz, amt, inner = 0.55) => put(ch, cx - rx, cz - rz, cx + rx, cz + rz, (x, z) => amt * (1 - sm(inner, 1, Math.hypot((x - cx) / rx, (z - cz) / rz))));
      const seg = (ch, ax, az, bx, bz, w) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; put(ch, Math.min(ax, bx) - w - 1, Math.min(az, bz) - w - 1, Math.max(ax, bx) + w + 1, Math.max(az, bz) + w + 1, (x, z) => { const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1); return 1 - sm(w * 0.5, w * 0.5 + 1, Math.hypot(x - ax - dx * t, z - az - dz * t)); }); };
      const vh = houses.filter((h) => h.v >= 0 && h.v <= 2), root = (h) => (h.z > -640 ? laneDist(h.x, h.z) : Math.hypot(h.x - HERO.x, h.z - HERO.z));
      const shx = -MX * KEY.x, shz = -KEY.z, shl = Math.hypot(shx, shz) || 1;       // the way shadows fall, in layout space
      for (const h of vh) {
        disc(0, h.x, h.z, h.hx + 3.5, h.hz + 4.5, 1); disc(3, h.x + (shx / shl) * 9, h.z + (shz / shl) * 9, 10, 14, 0.9);
        const door = [h.x, h.z + h.hz + 1.5]; let tgt = null, best = 46;
        for (const o of vh) { if (o === h || root(o) > root(h) - 4) continue; const dd = Math.hypot(o.x + 3 - door[0], o.z + o.hz + 1.5 - door[1]); if (dd < best) { best = dd; tgt = [o.x + 3, o.z + o.hz + 1.5]; } }
        if (!tgt) tgt = h.z > -640 ? [LX(h.z + 22), h.z + 22] : [HERO.x + clamp(h.x - HERO.x, -24, 24), HERO.z - 22];
        const mx = (door[0] + tgt[0]) / 2 + xr.range(-4, 4), mz = (door[1] + tgt[1]) / 2 + xr.range(-3, 3);
        seg(1, door[0], door[1], mx, mz, 1.3); seg(1, mx, mz, tgt[0], tgt[1], 1.3);
        await ctx.yield();
      }
      await ctx.yield();
      for (const g of guns) if (g.z < -420) { const m = g.range * (1 - g.spread * 0.5), wx = g.x + Math.sin(g.az) * m, wz = g.z + Math.cos(g.az) * m;      // wet ground where a fan comes down: a wide, soft fall-off (the shader breaks its edge and wets it only while the fan runs), and none painted on the river
        if (Math.abs(wx - RX(wz)) > 11) disc(2, wx, wz, 9.5, 9.5, 0.9, 0.12); disc(0, g.x, g.z, 4.5, 4.5, 1); }
      await ctx.yield();
      disc(0, HERO.x, HERO.z, 46, 50, 1);
      vilTex.needsUpdate = true;
    }
    await ctx.yield();
    const NGUN = guns.length, hutGeo = hutGeometry(gr, timber, stone, straw, redC, mul(goldC, 0.9));
    await ctx.yield();
    const hutMesh = new THREE.InstancedMesh(hutGeo.base, solidMat, NGUN), lidMesh = new THREE.InstancedMesh(hutGeo.lid, thatchMat, NGUN * 2);
    const lidBase = [], lidLag = new Float32Array(NGUN * 2), lidSwing = new Float32Array(NGUN * 2), gunProg = new Float32Array(NGUN).fill(-1), M4b = new THREE.Matrix4(), M4c = new THREE.Matrix4();
    const props = new Geo(0), propsV = new Geo(0), pr = rng.fork('props'), floods = [];      // propsV: things of the main village, not drawn until it nears
    const hutSlot = guns.map((g, i) => i), hutZ = [];      // the village's huts are instanced nearest first, so only those within sight need drawing
    { const vi = []; for (let i = 10; i < NGUN; i++) vi.push(i); vi.sort((a, b) => guns[b].z - guns[a].z); vi.forEach((gi, k) => { hutSlot[gi] = 10 + k; hutZ.push(guns[gi].z); }); }
    // Every gun keeps live's sweep (one rate for all, the phase from the part's own draw); from a stream of its own a gun draws only how soon its jet tears (one draw a gun, in the guns' order);
    // and the thatch under a roof gun's fall steams while the fan stands (their own stream: three puffs a roof gun).
    const swR = ctx.core.makeRng(ctx.core.hashSeed('sf-r18-sweep:' + ctx.seed)), stR = ctx.core.makeRng(ctx.core.hashSeed('sf-r18-steam:' + ctx.seed));
    const fDefs = guns.map((g, i) => {
      g.y = groundAt(g.x, g.z); const azw = MX * g.az, tearAt = swR.range(0.22, 0.38), steam = [];
      if (g.roof && !g.veil) for (let k = 0; k < 3; k++) { const m = g.range * (1 - g.spread * stR.range(0.2, 0.8)), o = stR.range(-2, 2), sx = Math.sin(g.az), cz = Math.cos(g.az);
        steam.push({ p: [MX * (g.x + sx * m + cz * o), g.y + 4.5 + stR.range(0.4, 1.6), g.z + cz * m - sx * o], v: [0, stR.range(0.7, 1.3), 0], s: [stR.range(2, 3), stR.range(5.5, 8), stR.range(4.5, 7), stR()], alpha: stR.range(0.04, 0.06) }); }
      place(g.x, g.y, g.z, 0, 1); M4.makeRotationY(azw - Math.PI / 2).setPosition(MX * g.x, g.y, g.z); hutMesh.setMatrixAt(hutSlot[i], M4);
      for (let k = 0; k < 2; k++) { const side = k ? -1 : 1; lidBase.push(M4.clone().multiply(M4b.makeRotationY(side > 0 ? 0 : Math.PI).setPosition(side * 1.9, 1.25, 0))); lidLag[i * 2 + k] = (g.r14 ? r14 : g.pd ? r11 : g.nw ? nr : gr).range(0, 0.18); lidSwing[i * 2 + k] = (g.r14 ? r14 : g.pd ? r11 : g.nw ? nr : gr).range(1.85, 2.2); }
      const mz = V3.set(0.57, 2.12, 0).applyMatrix4(M4), pd = pathD(g.x, g.z).dist; floods.push([mz.x, mz.y + 1.2, mz.z]);
      const wr = g.r14 ? r14 : g.nw ? nr : g.extra ? xr : pr, np = g.pd ? 0 : pd < 70 ? wr.int(1, 3) : wr.int(0, 2);      // (the paddy pair's watchers stand on the bund: placed with the paddies)                 // watchers standing back from the hut
      for (let k = 0; k < np; k++) { const a = g.az + Math.PI + wr.range(-0.9, 0.9), d = wr.range(3.2, 5.5), px = g.x + Math.sin(a) * d, pz = g.z + Math.cos(a) * d; if (pathD(px, pz).dist > 5.5) person(g.z < -420 ? propsV : props, wr, MX * px, groundAt(px, pz), pz, wr.range(0, 3)); }
      for (let k = 0; k < 2; k++) lidMesh.setColorAt(hutSlot[i] * 2 + k, i === 0 ? colT.setRGB(2.1, 1.95, 1.5) : colT.setRGB(1, 1, 1));      // the hut that fires first has a lid of pale new straw
      return { position: [mz.x, mz.y, mz.z], azimuth: azw, range: g.range, apex: g.apex, spread: g.spread, lateral: g.lat ?? (g.veil ? 0.1 : 0.05), sweep: g.veil ? 0.12 : 0.35, tearAt, fallDrift: g.veil ? 0 : 0.25, steam, ...(g.veil ? { tearAt: 0.08, haze: false, mistAlpha: 0.45 } : {}), floorY: g.roof ? g.y + 4.5 : g.y + 0.1,
        strips: g.veil ? 28 : pd < 60 ? 24 : pd < 140 ? 14 : 10, drops: pd < 45 ? 340 : pd < 120 ? 130 : 45, width: g.veil ? 0.6 : pd < 60 ? 1 : pd < 140 ? 1.3 : 1.9 };
    });
    for (const [dx, dz] of [[-4.0, 2.6], [-3.1, 3.9]]) person(props, kr, MX * (guns[0].x + dx), groundAt(guns[0].x + dx, guns[0].z + dz), guns[0].z + dz, kr.range(0, 3));      // two watchers beside the first hut
    await ctx.yield();
    hutMesh.name = 'huts'; lidMesh.name = 'hut-lids'; lidMesh.frustumCulled = false; hutMesh.frustumCulled = false; scene.add(hutMesh, lidMesh);
    // two draws: the hamlet's six guns, and the village's, which is not drawn until its first gun is about to fire
    const fOpts = { sunDir: KEY.toArray(), sunColor: look.fsun, wind, water: look.water, shade: look.shade, segments: 14, detail };
    const fount = makeFountains(fDefs.slice(0, 8), { rng: gr.fork('water'), ...fOpts, segments: 22 });      // the hamlet's arcs pass close: more segments, so they curve
    await ctx.yield();
    const NP0 = NGUN - 2, fountB = makeFountains(fDefs.slice(10, NP0), { rng: gr.fork('water2'), ...fOpts });
    await ctx.yield();
    const fountP = makeFountains(fDefs.slice(NP0), { rng: r11.fork('waterP'), ...fOpts, segments: 22 });      // the paddy pair: a draw of its own, on from the veil to the top of the climb
    await ctx.yield();
    const fountH = makeFountains(fDefs.slice(8, 10), { rng: nr.fork('waterH'), ...fOpts });      // the two heralds: a draw of their own, on from the first seconds
    await ctx.yield();
    fount.object.name = 'fans'; fountB.object.name = 'fans-village'; fountH.object.name = 'fans-herald'; fountP.object.name = 'fans-paddy'; scene.add(fount.object, fountB.object, fountH.object, fountP.object);
    for (const f of [fount, fountB, fountH, fountP, hero.fountains]) if (f) { f.uniforms.uSkyK.value = isDusk ? 0 : 1; f.uniforms.uMistK.value = isDusk ? 1.3 : 2.1; f.uniforms.uGlowK.value = isDusk ? 0.4 : 1; }      // by day a stream seen against the sky is shaded, so it reads there too
    const RISE = 0.05, thrHero = 0.612, windBase = fount.uniforms.uWind.value.clone(), heroWind = hero.fountains ? hero.fountains.uniforms.uWind.value : null;
    let zStooks = 0;      // the far end (z) of the stook field
    let thrF0 = 1, thrB0 = 1;      // the first thresholds of the hamlet's guns and the village's: neither draw is made before its first gun is about to fire
    const setGuns = (u) => {
      for (let i = 0; i < NGUN; i++) {
        const p = clamp((u - guns[i].thr) / (guns[i].rise || RISE), 0, 1); if (p === gunProg[i]) continue;
        gunProg[i] = p; if (i < 8) fount.setProgress(i, p); else if (i < 10) fountH.setProgress(i - 8, p); else if (i < NP0) fountB.setProgress(i - 10, p); else fountP.setProgress(i - NP0, p);
        for (let k = 0; k < 2; k++) {
          const j = i * 2 + k, o = clamp((p - 0.02 * lidLag[j]) / (0.1 + 0.1 * lidLag[j]), 0, 1), bounce = o < 0.7 ? (o / 0.7) * (o / 0.7) : 1 - 0.13 * Math.sin(((o - 0.7) / 0.3) * Math.PI) * (1 - (o - 0.7) / 0.3);
          M4c.multiplyMatrices(lidBase[j], M4b.makeRotationZ(-HUT_PITCH - lidSwing[j] * bounce)); lidMesh.setMatrixAt(hutSlot[i] * 2 + k, M4c);
        }
        lidMesh.instanceMatrix.needsUpdate = true;
      }
    };
    setGuns(0);
    // The fans that can stand in the paddies' mirror: the forty guns nearest the middle of the paddies (a fan 25 m high is in the water of a sheet for an eye a few
    // metres up out to a few hundred metres beyond it). Their lean and their rise are set every frame from the fans themselves.
    const mirrorGuns = guns.map((g, i) => i).sort((a, b) => Math.hypot(guns[a].x, guns[a].z + 330) - Math.hypot(guns[b].x, guns[b].z + 330) || a - b).slice(0, 40);
    const uGn = { value: mirrorGuns.map(() => new THREE.Vector4()) }, uGm = { value: mirrorGuns.map(() => new THREE.Vector4()) };
    const mirrorQ = mirrorGuns.map((i, k) => { const d = fDefs[i], F = i < 8 ? fount : i < 10 ? fountH : i < NP0 ? fountB : fountP, sw = F.gunSweep[i < 8 ? i : i < 10 ? i - 8 : i < NP0 ? i - 10 : i - NP0];
      const tap = Math.sqrt((2 * d.apex) / 9.8), tfl = tap + Math.sqrt((2 * Math.max(d.apex + d.position[1] - d.floorY, 0.5)) / 9.8);
      uGn.value[k].set(d.position[0], d.position[2], d.position[1], d.azimuth); uGm.value[k].set(d.range / (1 - Math.exp(-tfl / tap)), d.apex, d.spread, 0);
      return { az: d.azimuth, sw: sw[0], ph: sw[1], rate: sw[2], lag: 1.2 * tap, tm: (tfl * 1.14) / tap }; });      // (lag: the water at the crest of a fan left the gun that long ago, and leans as the gun did then)
    await ctx.yield();

    // ------------------------------------------------------------ built things on the valley floor (world space, one merged mesh)
    const soft = new Geo(3), ptimber = mkTimber(pr), pstone = mkStone(pr), casters = [];
    const CHX = (z) => LX(z) + lerp(3.2, 7.4, sm(-95, -150, z)) + 0.45 * bell(z, -37, 9), chanW = (z) => 1.3 + 1.95 * bell(z, -37, 9), CH0 = 44, CH1 = -246;      // the koi pool at Z -37 is 3.2 m wide
    const surfL = (x, z) => land.surfaceAt(MX * x, z);        // the drawn ground: the channel lies on the mesh itself, so it can sit within centimetres of it
    for (let z = CH0; z > CH1; ) { const len = pr.range(0.8, 1.5); for (let q = 0; q < 10; q++) pr(); z -= len; }      // (the draws the old kerbs took)
    {     // the koi channel: a dark slot of water between flush coping stones of warm stone, mossed and frosted. Their tops stay under the
          // ground-shadow sheet (lift 0.12 m): a stone standing through it shows sunlit inside a shadow, and the kerb turns into a checker
      const cope = () => { let c = mul([0.27, 0.255, 0.215], lerp(0.8, 1.15, kr())); const q = kr(); if (q < 0.4) c = mix3(c, [0.13, 0.2, 0.08], lerp(0.2, 0.5, kr())); else if (q < 0.62) c = mix3(c, [0.62, 0.69, 0.76], lerp(0.15, 0.3, kr())); return c; };      // one warm stone, moss or a little frost on some
      for (const sd of [-1, 1]) for (let z = CH0; z > CH1; ) {      // uneven lengths, barely proud of the ground, one in ten missing: an old edge, not sleepers
        const len = kr.range(0.5, 2.4), zc = z - len / 2, kw = kr.range(0.28, 0.52), x = CHX(zc) + sd * (chanW(zc) / 2 + kw / 2 - 0.05 + kr.range(-0.03, 0.05)), top = kr.range(0.08, 0.115), ry = Math.atan2(CHX(zc + 1) - CHX(zc - 1), 2), gone = kr.chance(0.1), col = cope();
        if (!gone) props.box(MX * x, surfL(x, zc) + top - 0.15, zc, kw, 0.3, len - kr.range(0.03, 0.12), col, { ry: MX * ry + kr.range(-0.07, 0.07), tx: 0.86, tz: 0.94, gb: 0.85, top: 1.1, noBottom: true });
        z -= len;
      }
      const bedC = [0.018, 0.026, 0.027];
      for (let z = CH0; z > CH1; z -= 1.5) {     // the bed: a dark ribbon laid on the ground under the water
        const zb = z - 1.5, xa = CHX(z), xb = CHX(zb), wa = chanW(z) / 2 + 0.15, wb = chanW(zb) / 2 + 0.15;
        const A = [MX * (xa - wa), surfL(xa - wa, z) + 0.03, z], B = [MX * (xa + wa), surfL(xa + wa, z) + 0.03, z], C = [MX * (xb + wb), surfL(xb + wb, zb) + 0.03, zb], D = [MX * (xb - wb), surfL(xb - wb, zb) + 0.03, zb];
        if (MX > 0) props.quad(A, B, C, D, bedC); else props.quad(B, A, D, C, bedC);
      }
    }
    await ctx.yield();
    for (const z of [-12, -66, -96, -128, -206]) { const x = CHX(z), y = surfL(x, z); for (let k = -1; k <= 1; k++) props.box(MX * x, y + 0.25, z + k * 0.34, 2.3, 0.07, 0.31, mul([0.24, 0.19, 0.13], pr.range(0.8, 1.2)), { ry: pr.range(-0.03, 0.03), gb: 0.8 }); }   // plank bridges
    const rackGeo = rackGeometry(pr, straw, ptimber(), nr), racks = [];
    for (const [x, z] of [[11, -46], [10.5, -70], [-11, -121], [17.5, -140], [18, -168], [-9.5, -172], [-9, -228], [17.5, -216], [0.3, -316], [30, -344], [-42, -330], [30, -400]]) racks.push([x, z, pr.range(-0.05, 0.05)]);
    for (const sd of [-1, 1]) for (let s = 46; s < 160; s += 15.5) { const lx = sd * (17 + pr.range(0, 1.5)), zz = HERO.z + s * Math.cos(THETA) - lx * Math.sin(THETA), xx = HERO.x + s * Math.sin(THETA) + lx * Math.cos(THETA); racks.push([xx, zz, THETA]); }
    let nRack0 = 0; hr.shuffle(houses.filter((q) => q.v >= 0 && q.v < 3)).slice(0, 15).forEach((h, hi) => { const x = h.x + hr.sign() * Math.max(10.5, h.hx0 + 2.6), z = h.z + hr.range(-3, 3); if (laneDist(x, z) > 6 && pathD(x, z).dist > 9) racks.push([x, z, h.ry]); if (hi === 8) nRack0 = racks.length; });
    racks.push([-10.5, -19, xr.range(-0.05, 0.05)]);      // one in the entry foreground
    racks.forEach((r, i) => r.push((i < nRack0 ? pr : xr).range(0.85, 1.15)));
    const rackZ = [];
    const rackGrp = [0, 1, 2].map((k) => {       // hamlet, paddies, village: each drawn only while it can be seen
      const list = racks.filter((r) => (r[1] > -250 ? 0 : r[1] > -430 ? 1 : 2) === k).sort((a, b) => (k === 2 ? b[1] - a[1] : 0)), rm = new THREE.InstancedMesh(rackGeo, thatchMat, Math.max(1, list.length)); rm.count = list.length;
      list.forEach(([x, z, ry, tone], i) => { place(x, groundAt(x, z) - 0.05, z, ry, 1); rm.setMatrixAt(i, M4); rm.setColorAt(i, colT.setRGB(1, 1, 1).multiplyScalar(tone)); for (const q of [-3, 3]) casters.push({ x: MX * (x + Math.sin(ry) * q), z: z + Math.cos(ry) * q, r: 3.1 }); });
      if (k === 2) for (const r of list) rackZ.push(r[1]);
      rm.name = 'racks' + k; scene.add(rm); return rm;
    });
    await ctx.yield();
    for (const sd of [-1, 1]) for (let s = 40; s <= 124; s += 21) { const lx = sd * 5.2, zz = HERO.z + s * Math.cos(THETA) - lx * Math.sin(THETA), xx = HERO.x + s * Math.sin(THETA) + lx * Math.cos(THETA); stoneLantern(propsV, MX * xx, groundAt(xx, zz) - 0.05, zz, pstone()); }
    {   // a small red shrine gate with its lanterns and a shrine box, west of the lane
      const tx = -15, tz = -127, y = groundAt(tx, tz), red = mul(redC, 1.05), dark = [0.03, 0.03, 0.035];
      for (const sd of [-1, 1]) { props.cyl([MX * tx, y, tz + sd * 1.5], [MX * tx, y + 3.5, tz + sd * 1.42], 0.17, 0.15, 8, red); props.box(MX * tx, y + 0.2, tz + sd * 1.5, 0.5, 0.4, 0.5, dark, { noBottom: true }); stoneLantern(props, MX * (tx + 2.6), y, tz + sd * 2.6, pstone()); }
      props.box(MX * tx, y + 3.62, tz, 0.34, 0.24, 4.5, red, { gb: 0.9 }); props.box(MX * tx, y + 3.8, tz, 0.44, 0.13, 4.9, dark, { tz: 1.06 }); props.box(MX * tx, y + 2.85, tz, 0.2, 0.22, 3.5, red, { gb: 0.9 });
      props.box(MX * (tx - 3.4), y + 0.5, tz, 1.3, 1.0, 1.3, pstone(), { noBottom: true }); props.box(MX * (tx - 3.4), y + 1.5, tz, 1.1, 1.0, 1.0, ptimber(), { noBottom: true }); props.box(MX * (tx - 3.4), y + 2.2, tz, 1.7, 0.5, 1.5, mul(straw, 0.9), { tx: 0.2, tz: 0.9, gb: 0.8 });
    }
    {   // rope footbridge over the river
      const z = -300, xa = RX(z) - 12, xb = RX(z) + 12, ya = groundAt(xa, z) + 0.6, n = 30;
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = lerp(xa, xb, t), y = ya - 0.9 * Math.sin(Math.PI * t); props.box(MX * x, y, z, 0.7, 0.06, 1.5, mul([0.25, 0.2, 0.14], pr.range(0.8, 1.2)), { gb: 0.8 }); for (const sd of [-1, 1]) { props.box(MX * x, y + 1.0 + 0.25 * Math.abs(t - 0.5), z + sd * 0.72, 0.82, 0.05, 0.05, [0.2, 0.17, 0.11], { gb: 1 }); if (i % 3 === 0) props.box(MX * x, y + 0.55, z + sd * 0.72, 0.035, 1.1, 0.035, [0.2, 0.17, 0.11], { gb: 1 }); } }
      for (const x of [xa, xb]) for (const sd of [-1, 1]) props.cyl([MX * x, ya - 0.8, z + sd * 0.8], [MX * x, ya + 1.7, z + sd * 0.8], 0.11, 0.09, 6, ptimber(), { cap: true });
    }
    const clothRack = (xa, xb, z, cloth) => {     // indigo cloth and white radishes drying on poles
      const y = groundAt((xa + xb) / 2, z), indigo = [0.045, 0.1, 0.34];
      for (const px of [xa, (xa + xb) / 2, xb]) props.cyl([MX * px, y, z], [MX * px, y + 3.4, z], 0.07, 0.055, 5, ptimber(), { cap: true });
      shBox((xa + xb) / 2, z, 0, (xb - xa) / 2, 0.08, 3.2, cloth ? 0.75 : 0.5, 0.4);
      for (const yy of [3.15, 2.0]) {
        props.cyl([MX * (xa - 0.4), y + yy, z + 0.08], [MX * (xb + 0.4), y + yy + 0.04, z + 0.08], 0.045, 0.04, 5, mul(goldC, 0.35), { cap: true });
        if (cloth && yy > 3) for (let x = xa + 0.3; x < xb - 1.2; x += pr.range(1.5, 2.2)) {
          const ph = pr.range(0, 6.28), w = pr.range(1.0, 1.5), len = pr.range(1.5, 2.3), col = pr.chance(0.25) ? mul(whiteC, 0.75) : mul(indigo, pr.range(0.8, 1.6)), zz = z + 0.08;
          for (let j = 0; j < 5; j++) { const yA = y + yy - (j * len) / 5, yB = yA - len / 5, ea = [(j * len) / 5, ph, 1], eb = [((j + 1) * len) / 5, ph, 1]; soft.quad([MX * x, yB, zz], [MX * (x + w), yB, zz], [MX * (x + w), yA, zz], [MX * x, yA, zz], col, 0.85, 0.85, 1, 1, [eb, eb, ea, ea]); }
        } else for (let x = xa; x < xb; x += 0.26) { const d0 = 0.5, ph = pr.range(0, 6.28); soft.ex = [d0 + 0.4, ph, 0]; const tdx = MX * pr.range(-0.03, 0.03); hangRadish(soft, MX * x, y + yy - 0.03, z + 0.08, tdx, pr.range(0.7, 0.82), 6, isDusk ? 0.55 : 1); }
      }
    };
    clothRack(9, 15, -87, true); clothRack(-17, -11, -180, true); clothRack(13, 18, -246, false); clothRack(22, 28, -148, false);
    await ctx.yield();
    {   // parasols and watchers on the viewing knoll
      const n = cast.trucks > 1 ? 9 : 5, ky = (x, z) => groundAt(x, z);
      for (let i = 0; i < n; i++) { const a = pr.range(-1.2, 1.2), d = pr.range(2, 13), x = KN.x + 4 + Math.cos(a) * d, z = KN.z + Math.sin(a) * d, y = ky(x, z), c = pr.pick([[0.72, 0.7, 0.62], [0.74, 0.6, 0.56], [0.6, 0.68, 0.74], [0.78, 0.74, 0.5]]);
        person(props, pr, MX * x, y, z, pr.range(0, 3)); props.cyl([MX * (x + 0.25), y + 0.9, z], [MX * (x + 0.25), y + 2.15, z], 0.02, 0.02, 4, [0.1, 0.08, 0.06]); props.cyl([MX * (x + 0.25), y + 1.95, z], [MX * (x + 0.25), y + 2.22, z], 0.8, 0.06, 9, c);
        if (pr.chance(0.6)) person(props, pr, MX * (x + pr.range(0.8, 1.6)), ky(x + 1, z + 0.6), z + pr.range(0.4, 1.2), pr.range(0, 3)); }
    }
    // waterwheel beside the channel
    const WH = { z: -172 }; WH.x = CHX(WH.z) + 1.25; WH.y = groundAt(WH.x, WH.z) + 2.08;
    const wheel = new THREE.Group();
    {
      const g = new Geo(0), R = 2.0;
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * TAU, a1 = ((i + 1) / 16) * TAU, am = (a0 + a1) / 2;
        for (const sx of [-0.42, 0.42]) g.beam([sx, Math.cos(a0) * R, Math.sin(a0) * R], [sx, Math.cos(a1) * R, Math.sin(a1) * R], 0.07, 0.16, ptimber());
        g.beam([-0.5, Math.cos(am) * (R - 0.25), Math.sin(am) * (R - 0.25)], [0.5, Math.cos(am) * (R + 0.12), Math.sin(am) * (R + 0.12)], 0.05, 0.4, mul(ptimber(), 0.8));
        if (i % 2 === 0) for (const sx of [-0.42, 0.42]) g.beam([sx, 0, 0], [sx, Math.cos(a0) * R, Math.sin(a0) * R], 0.07, 0.09, ptimber());
      }
      g.cyl([-0.8, 0, 0], [0.8, 0, 0], 0.16, 0.16, 8, ptimber(), { cap: true });
      wheel.add(new THREE.Mesh(g.build(), solidMat)); wheel.position.set(MX * WH.x, WH.y, WH.z); wheel.name = 'waterwheel'; scene.add(wheel);
      for (const sx of [-0.85, 0.85]) for (const sz of [-1, 1]) props.beam([MX * (WH.x + sx), WH.y - 2.3, WH.z + sz * 1.3], [MX * (WH.x + sx), WH.y + 0.1, WH.z], 0.14, 0.14, ptimber());
      props.box(MX * (WH.x + 0.2), WH.y + 0.9, WH.z + 3.2, 0.5, 0.12, 4.6, ptimber(), { gb: 0.8 });   // the launder that feeds it
      for (const sz of [1.4, 5.2]) props.box(MX * (WH.x + 0.2), WH.y - 0.7, WH.z + sz, 0.12, 3.2, 0.12, ptimber(), { noBottom: true });
    }
    await ctx.yield();
    // the red fire truck creeping up the lane, lamp turning
    const trucks = [];
    for (let i = 0; i < cast.trucks; i++) {
      const g = new Geo(0), red = mul(redC, 1.1), grp = new THREE.Group();
      g.box(0, 1.05, 0.4, 1.9, 1.1, 3.6, red, { gb: 0.8 }); g.box(0, 1.55, -1.75, 1.9, 2.1, 1.5, red, { tz: 0.86, gb: 0.85 }); g.box(0, 2.0, -2.2, 1.7, 0.75, 0.5, [0.05, 0.08, 0.11], { gb: 1 });
      g.box(0, 1.9, 0.6, 1.3, 0.5, 2.8, [0.5, 0.5, 0.52], { gb: 0.8 }); g.box(0, 0.55, -2.55, 1.95, 0.25, 0.2, [0.6, 0.6, 0.6]); g.cyl([-0.6, 2.2, 0.9], [0.6, 2.2, 0.9], 0.34, 0.34, 8, [0.62, 0.6, 0.5], { cap: true });
      for (const sx of [-1, 1]) for (const sz of [-1.6, 1.3]) g.cyl([sx * 0.72, 0.42, sz], [sx * 1.0, 0.42, sz], 0.42, 0.42, 8, [0.02, 0.02, 0.02], { cap: true, capCol: [0.3, 0.3, 0.3] });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.14), new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 0.5, 0.25) })); lamp.position.set(0, 2.72, -1.6);
      grp.add(new THREE.Mesh(g.build(), solidMat), lamp); grp.name = 'fire-truck'; scene.add(grp); trucks.push({ grp, lamp, off: i * 71 + 8 });
    }
    await ctx.yield();

    // ------------------------------------------------------------ water: river, channel with koi, flooded paddies
    const WL = Water.waterLight(sky);
    {
      const rp = []; for (let z = -940; z <= 240; z += 36) rp.push([MX * RX(z), floorY(z) - 1.25, z]);
      const river = Water.makeRiver({ rng: rng.fork('river'), light: WL, points: rp, width: 15, segments: 320, speed: 2.6, deep: '#0c3644', shallow: '#356f7a', foam: 0.4, bankFoam: 0.4, opacity: 0.78, ...(lookId === 'golden' || lookId === 'morning' ? { glint: lookId === 'golden' ? 0.3 : 0.22, mid: sky.zenithColor.clone().lerp(sky.horizonColor, 0.3).multiplyScalar(0.6), horizon: sky.horizonColor.clone().multiplyScalar(0.3).lerp(new THREE.Color(cedarC[0], cedarC[1], cedarC[2]).multiplyScalar(2.2), 0.5), scatter: 0.2 } : {}),      // at a grazing angle it mirrors the dark far bank, not the bright horizon: water, not a road
        ...(isDusk ? { zenith: sky.zenithColor.clone().multiplyScalar(0.6), mid: sky.zenithColor.clone().lerp(sky.horizonColor, 0.3).multiplyScalar(0.5), horizon: sky.horizonColor.clone().multiplyScalar(0.22), scatter: 0.15, glint: 0.3 } : {}) });      // at dusk it mirrors the dark walls, not the pink horizon
        river.object.name = 'river'; scene.add(river.object); updaters.push(river);
      await ctx.yield();
      {   // boulders standing in the river along the village reach (their own stream): from the climb it reads as a river, not a road
        const br = nr.fork('boulders'), bg = T.rockGeometry({ rng: br, kind: 'boulder', radius: 1, detail: 1, color: '#b3afa2', colorB: '#84827a' }), spots = [];      // pale river granite, standing proud of the water: from the climb a boulder is a lit stone with a shaded side, never a flat black oval
        for (let z = -432; z > -720; z -= br.range(20, 40)) for (let k = br.int(1, 2); k > 0; k--) spots.push([RX(z) + br.range(-5, 5), z + br.range(-4, 4), br.range(1.2, 2.4)]);
        const bm = new THREE.InstancedMesh(bg, solidMat, spots.length);
        spots.forEach(([x, z, r], i) => { M4.compose(V3.set(MX * x, floorY(z) - 1.25 + r * 0.22, z), Q.setFromAxisAngle(YAX, br.range(0, TAU)), S3.set(r * br.range(0.9, 1.3), r * br.range(0.85, 1.1), r)); bm.setMatrixAt(i, M4); bm.setColorAt(i, colT.setRGB(1, 1, 1).multiplyScalar(br.range(1.0, 1.4))); });
        bm.name = 'river-boulders'; scene.add(bm);
      }
      await ctx.yield();
      const cp = []; for (let z = CH1 + 1; z <= CH0; z += 3.5) cp.push([MX * CHX(z), surfL(CHX(z), z) + 0.075, z]);
      const zA = CH1 + 1, zN = CH0 - zA;
      const chan = Water.makeRiver({ rng: rng.fork('chan'), light: WL, zenith: sky.zenithColor.clone().multiplyScalar(isDusk ? 0.5 : 0.6), mid: sky.zenithColor.clone().lerp(sky.horizonColor, 0.3).multiplyScalar(isDusk ? 0.5 : 0.6).lerp(new THREE.Color(0.05, 0.07, 0.06), isDusk ? 0 : 0.08), horizon: sky.zenithColor.clone().lerp(sky.horizonColor, 0.55).multiplyScalar(isDusk ? 0.45 : 0.58).lerp(new THREE.Color(0.06, 0.08, 0.07), isDusk ? 0 : 0.06), scatter: 0.06, glint: isDusk ? 0.7 : 0.42,     // a strip of sky between its banks, glinting
         points: cp, width: (t) => chanW(zA + zN * t) + 0.06, segments: 170, across: 4, speed: 1.1, deep: '#0a2228', shallow: '#4a8088', foam: isDusk ? 0.2 : 0.1, bankFoam: isDusk ? 0.16 : 0.08, bankFade: 0.1, opacity: 0.88, bow: 0, chop: 0.05 });      // by day a strip of the blue sky with a crisp edge at the coping (it had been darkened to a slot: a grey line from the lane)
      chan.object.name = 'channel'; scene.add(chan.object); updaters.push(chan);
    }
    await ctx.yield();
    const flooded = [], padPos = [], padE = [], sheets = [], dumpG = new Geo(0);      // sheets: every sheet of water as [x0, x1, z near, z far]; dumpG takes what a new sheet has drowned (its draws are still made)
    const sheet = (x0, x1, z0, z1, y) => { const sx = x1 - x0, sz = z0 - z1; sheets.push([x0, x1, z0, z1]);
      for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]) { padPos.push(MX * lerp(x0, x1, a), y, lerp(z0, z1, b)); padE.push(a * sx, b * sz, sx, sz); } };
    const rowZ = (r) => PAD.z0 - r * PAD.cz - 2.6;
    for (let c = 0; c < PAD.nx; c++) for (let r = 0; r < PAD.nz; r++) {
      const xa = PAD.x0 + c * PAD.cx, zc = PAD.z0 - (r + 0.5) * PAD.cz, laneIn = LX(zc) > xa - 6 && LX(zc) < xa + PAD.cx + 6;
      const wet = !laneIn && ((c === 1 && (r <= 2 || r >= 4)) || (c === 3 && r <= 1) || (c === 0 && r === 3) || pr.chance(0.42)); flooded.push(wet);
      const more = !wet && ((c === 1 && r === 3) || (c === 2 && r === 5));      // always water under the climb's first look at the village (the second stops short of the rack that stands there)
      if (!wet && !more) continue;
      sheet(xa + 1.7, more && c === 2 ? xa + 24.5 : xa + PAD.cx - 1.7, rowZ(r), rowZ(r) - PAD.cz + 5.2, padLevel(r) + 0.11);
    }
    // The lane crosses the paddies as a causeway with water on both hands: sheets in the lane's own column too, from 6 m out from the lane to the far bund
    // (east of it in the second and third rows, west of it under the climb). The ground there is already level with its row; where the lane stands higher its bank shows.
    for (const r of [1, 2]) { let lx = -1e9; for (let z = rowZ(r); z >= rowZ(r) - PAD.cz + 5.2; z -= 2) lx = Math.max(lx, LX(z)); if (34.3 - lx - 6.2 > 6) sheet(lx + 6.2, 34.3, rowZ(r), rowZ(r) - PAD.cz + 5.2, padLevel(r) + 0.11); }
    { let lx = 1e9; for (let z = rowZ(4); z >= rowZ(4) - PAD.cz + 5.2; z -= 2) lx = Math.min(lx, LX(z)); if (lx - 6.2 - 1.7 > 6) sheet(1.7, lx - 6.2, rowZ(4), rowZ(4) - PAD.cz + 5.2, padLevel(4) + 0.11); }
    const inSheet = (x, z) => sheets.some((q) => x > q[0] - 1 && x < q[1] + 1 && z < q[2] + 1 && z > q[3] - 1);
    { const g = guns[NP0], h = guns[NP0 + 1];      // the paddy pair's watchers, on the dry bund behind each hut
      for (const [px, pz] of [[g.x - 3.3, g.z - 1.2], [g.x - 2.6, g.z + 0.9], [h.x + 3.4, h.z + 0.6]]) person(props, r11, MX * px, groundAt(px, pz), pz, r11.range(0, 3)); }
    const stookSpots = [];      // where a stook stands (layout x, z): the field stooks added later keep clear of these
    for (let c = 0; c < PAD.nx; c++) for (let r = 0; r < PAD.nz; r++) {     // straw stooks standing in rows in the dry paddies
      if (flooded[c * PAD.nz + r] || pr.chance(0.2)) continue;
      const xa = PAD.x0 + c * PAD.cx, za = PAD.z0 - r * PAD.cz;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        const x = xa + 6 + i * 8 + pr.range(-0.6, 0.6), z = za - 6 - j * 8 + pr.range(-0.6, 0.6);
        if (laneDist(x, z) < 4.5 || pathD(x, z).dist < 5.5 || pr.chance(0.15)) continue;
        const y = groundAt(x, z) - 0.05, hgt = pr.range(1.5, 2.1), c2 = mul(mix3(straw, [0.55, 0.43, 0.2], pr()), pr.range(1.5, 2.1));
        const cut = inSheet(x, z) || (z < -262 && pathD(x, z).dist < 10.5);      // (dumped, not skipped: the draws are still made)
        stookGeo(cut ? dumpG : props, nr, MX * x, y, z, MX * pr.range(-0.1, 0.1), hgt, c2); if (!cut) stookSpots.push([x, z]);
      }
    }
    const stookAt = (r, x, z, G = props) => { const y = groundAt(x, z) - 0.05, hgt = r.range(1.5, 2.1), c2 = mul(mix3(straw, [0.55, 0.43, 0.2], r()), r.range(1.5, 2.1));
      stookGeo(G, nr, MX * x, y, z, MX * r.range(-0.1, 0.1), hgt, c2); stookSpots.push([x, z]); };
    for (const [x, z] of [[9.5, -6], [12.5, -9.5], [15.5, -13], [18.5, -16.5], [15, -3], [18, -6.5], [-13, -34], [-16.5, -37], [-20, -40]]) stookAt(xr, x + xr.range(-0.4, 0.4), z + xr.range(-0.4, 0.4));   // straw stooks in the entry foreground
    const isFlooded = (x, z) => { const c = Math.floor((x - PAD.x0) / PAD.cx), r = Math.floor((PAD.z0 - z) / PAD.cz); return c >= 0 && c < PAD.nx && r >= 0 && r < PAD.nz && flooded[c * PAD.nz + r] || inSheet(x, z); };
    for (const x0 of [12, 20, -14]) for (let i = 0; i < 7; i++) {      // rows of stooks on the dry paddies under the climb (their own stream; drawn with the village's things, so they are there for the whole climb)
      const x = x0 + r9.range(-0.5, 0.5), z = -366 - i * 6.2 + r9.range(-0.5, 0.5), keep = !r9.chance(0.12), lean = MX * r9.range(-0.1, 0.1), hgt = r9.range(1.5, 2.1), c2 = mul(mix3(straw, [0.55, 0.43, 0.2], r9()), r9.range(1.5, 2.1)), jit = r9.fork('stook' + x0 + ':' + i);
      if (keep && Math.abs(z + 386) > 2.2 && z > -412 && !isFlooded(x, z) && laneDist(x, z) > 5 && pathD(x, z).dist > 7) { stookGeo(propsV, jit, MX * x, groundAt(x, z) - 0.05, z, lean, hgt, c2); stookSpots.push([x, z]); }
    }
    const uRings = { value: 0 }, uFanC = { value: new THREE.Vector4().fromArray([...new THREE.Color(look.water).multiplyScalar(isDusk ? 0.75 : 1.05).toArray(), 0]) };
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(padPos, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(padE, 4));
      const zen = sky.zenithColor.clone(), hor = sky.horizonColor.clone();
      const pm = makePaddyMaterial({ uTime: time, uSun: uSunV, uSunCol, uZen: { value: zen }, uHor: { value: hor }, uDark: { value: isDusk ? new THREE.Color(cedarC[0], cedarC[1], cedarC[2]).multiplyScalar(2).lerp(new THREE.Color(look.fog), 0.25) : new THREE.Color(cedarC[0], cedarC[1], cedarC[2]).multiplyScalar(5).lerp(new THREE.Color(look.fog), 0.24) }, uLeaf: { value: new THREE.Color(goldC[0], goldC[1], goldC[2]) }, uRings,
        uSnowC: { value: isDusk ? new THREE.Color(0.5, 0.36, 0.46) : new THREE.Color(0.8, 0.86, 0.95).multiplyScalar(lookId === 'golden' ? 0.8 : 0.9) }, uFanC, uGn, uGm });
      pm.side = THREE.DoubleSide; const paddies = new THREE.Mesh(g, pm); paddies.name = 'paddies'; paddies.renderOrder = 2; scene.add(paddies);
    }
    await ctx.yield();

    // ------------------------------------------------------------ trees, fruit, ground cover, cedar walls
    const fruitVZ = [];      // z of the village trees' fruit, in instance order (descending)
    const tr = rng.fork('trees'), floraWind = flora.makeWind({ direction: [wind[0], wind[2]], strength: 0.8 });
    await ctx.yield();
    const leafOpt = { size: 512 };
    await flora.prepareLeafTexture(leafOpt, ctx.yield);      // kit: paints the leaf atlas (half size) in slices across frames
    const leafMap = flora.makeLeafTexture(leafOpt);
    await ctx.yield();
    const treeMat = flora.windMaterial({ wind: floraWind, backlight: 1.2, backlightTint: '#ffd27a', map: leafMap, ambient: isDusk ? 2.1 : 3.3 });
    await ctx.yield();
    const cedarMat = flora.windMaterial({ wind: floraWind, backlight: 0.9, backlightTint: '#8fd0a0', map: leafMap, leafAmbient: isDusk ? 2.2 : lookId === 'morning' ? 2.5 : 3.9, ambient: 2.6 });      // the tall cedars: more sky light, so a wall of them is dark green and not a black slab
    [treeMat, cedarMat].forEach((m, mi) => {      // trees stand in the fog bank like the walls and roofs do: trunks and low boughs dissolve into it (mist look; nothing elsewhere)
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (sh, r) => {
        prev(sh, r); sh.uniforms.uSfMist = uMist; sh.uniforms.uSfMistC = uMistC;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uSfMist; uniform vec3 uSfMistC;')
          .replace('#include <fog_fragment>', `{ float sfTop = uSfMist.x + uSfMist.y*vFloraWorld.z;
            float sfM = (1. - smoothstep(sfTop - 4., sfTop + 2., vFloraWorld.y))*mix(0.6, 1., 1. - smoothstep(sfTop - 9.5, sfTop - 5., vFloraWorld.y))*(1. - exp(-length(vViewPosition)*uSfMist.z*(cameraPosition.y > sfTop ? clamp((sfTop - vFloraWorld.y)/max(cameraPosition.y - vFloraWorld.y, 1e-3), 0., 1.) : 1.)))*uSfMist.w*(1. - smoothstep(-440., -400., vFloraWorld.z));
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uSfMistC, sfM); }
            #include <fog_fragment>
            gl_FragColor.rgb = max(gl_FragColor.rgb, vec3(0.));`);
      };
      m.customProgramCacheKey = () => 'sf-tree' + mi;
    });
    await ctx.yield();
    const pt = (x, z, s, v) => { const pd = pathD(x, z); return { x: MX * x, y: groundAt(x, z), z, s, rot: tr.range(0, TAU), d: pd.dist, u: pd.u, v }; };
    const free = (x, z, r) => !guns.some((g) => Math.hypot(g.x - x, g.z - z) < 5 + r * 0.4) && laneDist(x, z) > r && pathD(x, z).dist > r + 3 && Math.abs(x - CHX(z)) > 2.5 - (z < CH1 ? 9 : 0) && !houses.some((h) => Math.abs(x - h.x) < Math.max(8.5, h.hx0 + 1) + r * 0.5 && Math.abs(z - h.z) < Math.max(13, h.hz0 + 1.5) + r * 0.5) && Math.hypot(x - HERO.x, z - HERO.z) > 44;
    const axisPt = (s, lat) => [HERO.x + s * Math.sin(THETA) + lat * Math.cos(THETA), HERO.z + s * Math.cos(THETA) - lat * Math.sin(THETA)];
    {
      // persimmons: bare trees hung with orange fruit
      const pv = [], pf = [];
      for (let i = 0; i < 2; i++) { pv.push(flora.deadTreeGeometry({ rng: tr, height: 7.5, detail: 1, bark: '#7a6652' })); await ctx.yield(); }
      pf.push(flora.deadTreeGeometry({ rng: tr, height: 7.5, detail: 0, bark: '#7a6652' }));
      await ctx.yield();
      const spots = [[8.6, -24, 1.55], [19.5, -58, 1], [-19, -38, 0.9], [-13.5, -203, 1], [21, -250, 0.95], [-12, -246.5, 1], [14, -113, 0.9], [-15, -146, 0.85]];   // the first is the entry tree, heavy with fruit
      for (let z = -296; z > -424; z -= 17) { const sd = tr.sign(), x = LX(z) + sd * tr.range(6.5, 9); if (pathD(x, z).dist > 9) spots.push([x, z, tr.range(0.8, 1.05)]); }
      for (const sd of [-1, 1]) for (let s = 44; s < 160; s += 14) { const [x, z] = axisPt(s + tr.range(-2, 2), sd * (11.5 + tr.range(0, 1.2))); spots.push([x, z, tr.range(0.85, 1.05)]); }
      for (let k = 0, tries = 0; k < 14 && tries < 200; tries++) { const h = tr.pick(houses), x = h.x + tr.sign() * (tr.range(10, 13) + Math.max(0, h.hx0 - 8)), z = h.z + tr.range(8, 14); if (h.v > 2 || !free(x, z, 5) || spots.some((q) => Math.hypot(q[0] - x, q[1] - z) < 7)) continue; spots.push([x, z, tr.range(0.8, 1.05)]); k++; }
      const pts = spots.map(([x, z, s]) => pt(x, z, s, tr.int(0, 1)));
      pts[0].big = 1; { const pd = pathD(-8.8, -33); pts.push({ x: MX * -8.8, y: groundAt(-8.8, -33), z: -33, s: 1.3, rot: xr.range(0, TAU), d: pd.dist, u: pd.u, v: 1, big: 1, x2: 1 }); }
      await ctx.yield();
      const pers = flora.makeScatter({ rng: tr.fork('pers'), points: pts, variants: pv, farVariants: pf, farDistance: 48, material: treeMat, tilt: 0, stretch: 0, sink: 0, tint: 0.1 });
      pers.object.name = 'persimmons'; scene.add(pers.object); updaters.push(pers);
      await ctx.yield();
      const fruits = [], fruitsV = [], fruitsBig = [], e = new THREE.Euler(), vq = new THREE.Vector3();
      for (const p of pts) {
        const near = p.d < 32, g = p.d > 48 ? pf[0] : pv[p.v % 2], pos = g.getAttribute('position'), n = p.big ? 170 : Math.round((near ? 60 : 18) * (cast.fruit > 0.5 ? 1 : 0.5)), ph = p.x2 ? xr.range(0, TAU) : tr.range(0, TAU), tr2 = p.big ? xr : tr;
        if (p.big && !p.x2) { const n0 = Math.round(60 * (cast.fruit > 0.5 ? 1 : 0.5)); for (let i = 0, tries = 0; i < n0 && tries < n0 * 12; tries++) { if (pos.getY(tr.int(0, pos.count - 1)) < 3.2) continue; for (let k = 0; k < 6; k++) tr(); i++; } }   // keeps the tree stream where it was
        Q.setFromEuler(e.set(0, p.rot, 0)); casters.push({ x: p.x, z: p.z, r: 1.4 * p.s, k: 0, s: p.s });
        const vil = !p.big && p.z < -300;      // the village's trees are seen from 20 to 40 m on the descent: bigger fruit, and more of it
        for (let i = 0, tries = 0; i < n && tries < n * 12; tries++) {
          const vi = tr2.int(0, pos.count - 1); if (pos.getY(vi) < 3.2) continue;
          vq.set(pos.getX(vi), pos.getY(vi), pos.getZ(vi)).multiplyScalar(p.s).applyQuaternion(Q);
          const c = mul(mix3(persC, [0.5, 0.12, 0.02], tr2() * 0.35), tr2.range(0.85, 1.2));
          const fx0 = p.x + vq.x + tr2.range(-0.12, 0.12), fy0 = p.y + vq.y - tr2.range(0.1, 0.3), fz0 = p.z + vq.z + tr2.range(-0.12, 0.12), sr = p.big ? tr2.range(0.125, 0.155) : tr2.range(0.085, 0.12);
          const sc = p.big ? sr : vil ? lerp(near ? 0.125 : 0.16, near ? 0.17 : 0.22, (sr - 0.085) / 0.035) : sr * (near ? 1 : 1.5);
          (p.big ? fruitsBig : p.z < -300 ? fruitsV : fruits).push(fx0, fy0, fz0, sc, 1.6, ph + i, c[0], c[1], c[2]); i++;
        }
        if (vil) for (let i = 0, n2 = Math.round((near ? 28 : 27) * (cast.fruit > 0.5 ? 1 : 0.5)), tries = 0; i < n2 && tries < n2 * 12; tries++) {      // (their own stream)
          const vi = r9.int(0, pos.count - 1); if (pos.getY(vi) < 3.2) continue;
          vq.set(pos.getX(vi), pos.getY(vi), pos.getZ(vi)).multiplyScalar(p.s).applyQuaternion(Q);
          const c = mul(mix3(persC, [0.5, 0.12, 0.02], r9() * 0.35), r9.range(0.85, 1.2));
          fruitsV.push(p.x + vq.x + r9.range(-0.12, 0.12), p.y + vq.y - r9.range(0.1, 0.3), p.z + vq.z + r9.range(-0.12, 0.12), near ? r9.range(0.125, 0.17) : r9.range(0.16, 0.22), 1.6, ph + n + i, c[0], c[1], c[2]); i++;
        }
      }
      await ctx.yield();
      // Curtains of peeled persimmons under the gable eaves of the hamlet's five houses (their own stream; drawn with the trees' fruit, one draw call): two rails of
      // strings across each gable that the lane looks at, a string every half metre. The long eaves of these houses come down to 3 m: nothing hung under them shows.
      if (cast.fruit > 0.3) for (const h of houses) { if (h.v !== -1) continue; const s = h.s, a = MX * h.ry, ca = Math.cos(a), sa = Math.sin(a), zf = 10.55;
        for (const [yr, len] of [[3.05, 1.45], [5.75, 1.25]]) for (let lx = -4.25; lx < 4.3; lx += 0.5) { if (yr < 4 && Math.abs(lx) < 0.9) continue;      // (the door)
          const ph = r17.range(0, TAU), l1 = len * r17.range(0.8, 1.05);
          for (let d = 0.12; d < l1; d += 0.2) { const c = mul(mix3(persC, [0.36, 0.09, 0.015], r17() < 0.2 ? r17.range(0.3, 0.7) : r17() * 0.15), r17.range(0.85, 1.25)), px = lx + r17.range(-0.03, 0.03), pz = zf + r17.range(-0.03, 0.03);
            fruits.push(MX * h.x + s * (px * ca + pz * sa), h.y + s * (yr - d), h.z + s * (pz * ca - px * sa), s * r17.range(0.082, 0.1), d, ph, c[0], c[1], c[2]); } } }
      const tf = makeFruitMesh(fruits, new THREE.SphereGeometry(1, 4, 2), time, uSunV, isDusk ? 0.25 : 1); tf.name = 'tree-fruit'; scene.add(tf);
      { const nf = fruitsV.length / 9, ord = Array.from({ length: nf }, (_, i) => i).sort((a, b) => fruitsV[b * 9 + 2] - fruitsV[a * 9 + 2]), src = fruitsV.slice();      // nearest the hamlet first, so fruit far up the valley need not be drawn yet
        ord.forEach((si, k) => { for (let q = 0; q < 9; q++) fruitsV[k * 9 + q] = src[si * 9 + q]; fruitVZ.push(src[si * 9 + 2]); }); }
      const tfv = makeFruitMesh(fruitsV, new THREE.SphereGeometry(1, 4, 2), time, uSunV, isDusk ? 0.25 : 1); tfv.name = 'tree-fruit-v'; scene.add(tfv);
      const tfb = makeFruitMesh(fruitsBig, new THREE.SphereGeometry(1, 5, 3), time, uSunV, isDusk ? 0.25 : 1); tfb.name = 'entry-fruit'; scene.add(tfb);   // the two entry trees, seen from 7 m: round fruit, drawn only there
      await ctx.yield();
      // maples, ginkgos, floor-edge cedars
      const mv = []; for (let i = 0; i < 2; i++) { if (i) await ctx.yield(); mv.push(flora.mapleGeometry({ rng: tr, detail: 1, height: tr.range(8.5, 10.5), leaf: '#c22a16', leafLight: '#f0582a', leafDark: '#7a1410', foliage: !late || tr.chance(0.35), fullness: late ? 0.7 : 1 })); }
      await ctx.yield();
      const mf = [flora.mapleGeometry({ rng: tr, detail: 0, height: 9.5, leaf: '#c22a16', leafLight: '#f0582a', leafDark: '#7a1410', foliage: !late, fullness: late ? 0.7 : 1 })], mpts = [];
      await ctx.yield();
      for (const [x, z] of [[-13, -8], [15, -80], [-33, -128], [22, -160], [-15, -238], [38, -262], [-30, -300], [-96, -322], [-118, -346], [0.5, -344], [52, -358], [8, -386]]) mpts.push(pt(x, z, tr.range(0.8, 1.15), tr.int(0, 1)));
      for (let k = 0, tries = 0; k < 10 && tries < 300; tries++) { const x = tr.range(-140, 80), z = tr.range(-900, -430); if (!free(x, z, 7) || x > RX(z) - 12) continue; mpts.push(pt(x, z, tr.range(0.75, 1.15), tr.int(0, 1))); k++; }
      for (let k = 0, tries = 0; k < 17 && tries < 420; tries++) {      // more crimson among the village roofs, where the descent looks down (their own stream)
        const x = r11.range(-95, 62), z = r11.range(-720, -470), sc = r11.range(0.8, 1.15), rot = r11.range(0, TAU), v = r11.int(0, 1); if (!free(x, z, 7) || x > RX(z) - 12 || Math.abs(x - AV(z)) < 16 || mpts.some((q) => Math.hypot(q.x - MX * x, q.z - z) < 14)) continue;
        const pd = pathD(x, z); mpts.push({ x: MX * x, y: groundAt(x, z), z, s: sc, rot, d: pd.dist, u: pd.u, v }); k++;
      }      // crimson under the maples by the lane, orange-gold under the entry persimmon
      await ctx.yield();
      const maples = flora.makeScatter({ rng: tr.fork('maple'), points: mpts, variants: mv, farVariants: mf, farDistance: 60, material: treeMat, tint: 0.16, hue: 0.03 }); maples.object.name = 'maples'; scene.add(maples.object);
      await ctx.yield();
      const gv = []; for (let i = 0; i < 2; i++) { if (i) await ctx.yield(); gv.push(flora.oakGeometry({ rng: tr, detail: 1, height: tr.range(14, 16), leaf: '#E8BC2A', leafLight: '#ffe884', leafDark: '#b48a1e', bark: '#5c5248', fullness: late ? 0.6 : 1.05 })); }
      await ctx.yield();
      const gpts = gk.map((g, i) => pt(g[0], g[1], g[2] / 10.5, i % 2));
      {   // The leaf drifts (their own stream). Every maple and every ginkgo of the floor has shed one: it lies under the crown and stretches down-wind as far as a leaf
          // from the crown is carried (it falls at 1 m/s and the air takes it 1.65 m/s along, the leaf particles' own two speeds), crimson with a little gold under
          // a maple, gold beyond the yellow disc of a ginkgo. Nothing is laid by a list of places: a tree up-wind of the lane within REACH feeds a drift on the lane.
        const lr = ctx.core.makeRng(ctx.core.hashSeed('sf-r18-leafdrift:' + ctx.seed));
        const REACH = 80;      // how far over open ground a leaf is blown before something catches it (m)
        const drift = (x, z, crown, fall, gold, amt) => { const carry = fall * 1.65 * lr.range(0.45, 0.8), side = lr.range(-0.5, 0.5), ra = lr.range(4.5, 7.5), rb = lr.range(2.6, 4), v = [amt * (1 - gold), amt * gold, 0, 0];
          litEll(x + WDX * carry / 2 - WDZ * side, z + WDZ * carry / 2 + WDX * side, crown * 2.2 + carry / 2, crown * lr.range(2.0, 2.4), v);
          for (let t = crown; t < REACH; t += 1) { const px = x + WDX * t, pz = z + WDZ * t; if (pz > LZ1 - 2 || pz < LZ0 + 2 || laneDist(px, pz) > 1) continue;      // and where the wind's line from the tree meets the lane, its ruts and its crown of grass catch what is blown that far: a drift on the lane, thinner the further the tree
            const k = 1 - 0.6 * t / REACH; litEll(px, pz, ra, rb, v.map((q) => q * k)); litEll(x + WDX * t / 2, z + WDZ * t / 2, t / 2 + 1, 2.4, v.map((q) => q * 0.22 * k)); break; } };
        for (const p of mpts) drift(MX * p.x, p.z, 4.2 * p.s, 6.5 * p.s, lr.range(0, 0.15), late ? 1 : 0.92);
        for (const p of gpts) drift(MX * p.x, p.z, 5.2 * p.s, 10 * p.s, 1, 0.8);
        litEll(spots[0][0], spots[0][1], 7.5, 7.5, [0.25, 0.75, 0, 0]);      // and orange-gold under the entry persimmon, the one tree of its kind that still had leaves to drop
        const ff = ctx.core.makeRng(ctx.core.hashSeed('sf-r18-fruitfall:' + ctx.seed));      // windfalls under every persimmon (their own stream): a round patch as wide as the crown, off-centre down-wind, heavier under some trees than others
        for (const q of pts) { const lx = MX * q.x, o = ff.range(0, 1.2) * q.s, r = ff.range(2.6, 3.6) * q.s, a = ff.range(0.35, 1) * (q.big ? 1 : 0.8); litEll(lx + WDX * o, q.z + WDZ * o, r, r, [0, 0, a, 0]); }
      }
      const gink = flora.makeScatter({ rng: tr.fork('gink'), points: gpts, variants: gv, material: treeMat, tint: 0.06, hue: 0.01 }); gink.object.name = 'ginkgos'; scene.add(gink.object);
      await ctx.yield();
      for (const p of mpts) casters.push({ x: p.x, z: p.z, r: 4.2 * p.s, k: 1, s: p.s }); for (const p of gpts) casters.push({ x: p.x, z: p.z, r: 6 * p.s, k: 2, s: p.s });
      const ced = { leaf: '#1c3a2c', leafLight: '#2f5a42', leafDark: '#0c1b15', bark: '#3a2c24' }, cv = [0, 1].map(() => flora.coniferGeometry({ rng: tr, detail: 1, height: tr.range(19, 23), slim: 0.8, ...ced }));
      await ctx.yield();
      const cf = [flora.coniferGeometry({ rng: tr, detail: 0, height: 21, slim: 0.85, ...ced })];
      await ctx.yield();
      const cpts = [];
      for (let k = 0, tries = 0; k < Math.round(96 * detail) && tries < 900; tries++) {
        const edge = tr.chance(0.62), x = edge ? tr.sign() * tr.range(126, 168) : tr.range(-150, 150), z = edge ? tr.range(-940, 80) : tr.chance(0.6) ? tr.range(-960, -872) : tr.range(-860, -440);
        if (!free(x, z, 9) || x > RX(z) - 14 && x < RX(z) + 14 || pathD(x, z).dist < 26) continue;
        if (!edge && z > -872 && !tr.chance(0.25)) continue;
        cpts.push(pt(x, z, tr.range(0.75, 1.25), tr.int(0, 1))); k++;
      }
      {   // two groves of tall black cedar (about 45 m) that the hamlet's fans are read against: behind hut 1 as seen from the lane, and behind the first fan as seen from under the eave
        await ctx.yield();
        const cedG = { ...ced, leaf: '#2a5540', leafLight: '#3f7052', leafDark: '#16302a' }, gvG = [], gpts = [];      // built at their true height (about 50 m), so no leaf card is a blown-up paddle, and standing back: no bough within 14 m of the path
        for (let i = 0; i < 2; i++) { gvG.push(flora.coniferGeometry({ rng: xr, detail: 1, height: xr.range(49, 53), slim: 0.9, ...cedG })); await ctx.yield(); }
        // Every grove tree stands back until its lowest boughs (about 9.5 m of reach at full size) are 20 m clear of the flight: a frond that cuts the frame's edge
        // from closer than that is a faceted blade. It steps straight away from the lane, half a metre at a time (no draws: the streams are as they were).
        const standBack = (x, z, s) => { const sg = x > LX(z) ? 1 : -1; for (let k = 0; k < 28 && pathD(x, z).dist < 20 + 9.5 * s; k++) x += sg * 0.5; return x; };
        for (const [x, z, k] of [[-25, -175, 0.9], [-26, -183, 1], [-33, -178, 1.05], [-40, -180, 1], [-47, -177, 1.05], [-54, -181, 0.95], [-30, -189, 1.08], [-36, -186, 1], [-43, -188, 1.08], [-50, -186, 1], [-27, -197, 0.95], [-34, -195, 1.05], [-41, -196, 1], [-48, -194, 1.05], [-57, -189, 0.95],
          [30, -123, 0.92], [37, -122, 1.02], [44, -123, 1.05], [51, -125, 0.98], [34, -131, 1.05], [42, -131, 1]]) {
          const x1 = x + xr.range(-1, 1), zz = z + xr.range(-1, 1), s1 = k * xr.range(0.94, 1.06), xx = standBack(x1, zz, s1), pd = pathD(xx, zz); gpts.push({ x: MX * xx, y: groundAt(xx, zz), z: zz, s: s1, rot: xr.range(0, TAU), d: pd.dist, u: pd.u, v: xr.int(0, 1) });
        }
        { const g3 = ctx.core.makeRng('sf-grove3:' + ctx.seed);      // three more, 55 m tall, east of the crossing pair and well back from the lane (their own stream)
          for (const [x0, z] of [[33, -207], [41, -212], [48, -206]]) { const s1 = 1.07 * g3.range(0.95, 1.05), x = standBack(x0, z, s1), pd = pathD(x, z); gpts.push({ x: MX * x, y: groundAt(x, z), z, s: s1, rot: g3.range(0, TAU), d: pd.dist, u: pd.u, v: g3.int(0, 1) }); } }
        { const g4 = ctx.core.makeRng('sf-grove4:' + ctx.seed);      // round fifteen: three behind the crown of the first west fan as the lane sees it, two beyond the east roof gun
          for (const [x0, z, k] of [[-19.5, -176.5, 1.14], [-22, -184.5, 1.16], [-17.5, -190.5, 1.1], [47, -224, 0.96], [52.5, -229.5, 1.04]]) { const s1 = k * g4.range(0.96, 1.04), x = standBack(x0, z, s1), pd = pathD(x, z); gpts.push({ x: MX * x, y: groundAt(x, z), z, s: s1, rot: g4.range(0, TAU), d: pd.dist, u: pd.u, v: g4.int(0, 1) }); } }
        await ctx.yield();
        const gfG = [flora.coniferGeometry({ rng: xr, detail: 0, height: 51, slim: 0.92, ...cedG })];
        await ctx.yield();
        const grove = flora.makeScatter({ rng: xr.fork('grove'), points: gpts, variants: gvG, farVariants: gfG, farDistance: 62, material: cedarMat, tint: 0.1, stretch: 0.06, tilt: 0.02 }); grove.object.name = 'grove'; scene.add(grove.object);
        await ctx.yield();
        const gpts2 = [];     // behind the veil jet and the ginkgo: a shelter row on the bund between the lane's dry paddy and the flooded one
        for (const [x0, z, k] of [[34.8, -265, 0.78], [35.6, -271.5, 0.84], [34.6, -278, 0.76], [35.5, -284, 0.8]]) { const s1 = 1.1 * k * xr.range(0.95, 1.05), x = standBack(x0, z, s1), pd = pathD(x, z); gpts2.push({ x: MX * x, y: groundAt(x, z), z, s: s1, rot: xr.range(0, TAU), d: pd.dist, u: pd.u, v: xr.int(0, 1) }); }
        { const g5 = ctx.core.makeRng('sf-grove5:' + ctx.seed);      // the shelter row runs on to the corner of the last house: from the lane the east roof gun's fan stands against it, not against the low sun's glare
          for (const [x0, z, k] of [[41, -247.2, 0.98], [35.8, -251.5, 0.86], [35.3, -258.2, 0.9]]) { const s1 = 1.1 * k * g5.range(0.95, 1.05), x = standBack(x0, z, s1), pd = pathD(x, z); gpts2.push({ x: MX * x, y: groundAt(x, z), z, s: s1, rot: g5.range(0, TAU), d: pd.dist, u: pd.u, v: g5.int(0, 1) }); } }
        const groveB = flora.makeScatter({ rng: xr.fork('grove2'), points: gpts2, variants: gvG, material: cedarMat, tint: 0.1, stretch: 0.06, tilt: 0.02 }); groveB.object.name = 'grove2'; scene.add(groveB.object);
        await ctx.yield();
        for (const q of gpts2) casters.push({ x: q.x, z: q.z, r: 5.5, k: 4, s: q.s });
        for (const q of gpts) casters.push({ x: q.x, z: q.z, r: 7, k: 4, s: q.s });
      }
      await ctx.yield();
      const conifers = flora.makeScatter({ rng: tr.fork('ced'), points: cpts, variants: cv, farVariants: cf, farDistance: 60, material: cedarMat, tint: 0.14 }); conifers.object.name = 'cedars-near'; scene.add(conifers.object);
      await ctx.yield();
      for (const p of cpts) if (p.d < 90) casters.push({ x: p.x, z: p.z, r: 3.4 * p.s, k: 3, s: p.s }); else shCone(MX * p.x, p.z, 2.6 * p.s, 20 * p.s, 0.8);
      updaters.push({ update(dt, t) { flora.updateWind(floraWind, t); } });
      for (let k = 0, tries = 0; k < 24 && tries < 500; tries++) {      // rows of straw stooks between the village houses
        const x = xr.range(-140, 82), z = xr.range(-885, -445), a = xr.range(-0.4, 0.4), n = xr.int(3, 4);
        if (x > RX(z) - 16 || !free(x, z, 6) || !free(x + Math.cos(a) * 8, z + Math.sin(a) * 8, 6)) continue;
        for (let i = 0; i < n; i++) stookAt(xr, x + Math.cos(a) * i * 2.7, z + Math.sin(a) * i * 2.7, propsV); k++;
        if (k % 6 === 5) await ctx.yield();
      }
    }
    await ctx.yield();
    const wallZs = [];      // z of the east wall's cedars, in instance order (ascending)
    {   // the cedar walls: thousands of dark spires, close-ranked
      const cr = rng.fork('cedar'), geo = cedarGeometry(mul(cedarC, isDusk ? 3.8 : 3.0 * (lookId === 'morning' ? 0.66 : lookId === 'golden' ? 0.62 : 1))), mat = makeCedarMat(time), N = Math.round((look.groundFog ? 1000 : 1150) * detail), lists = [[], [], [], []], wallSlot = [];
      for (let i = 0; i < N; i++) {     // a fifth stand close-ranked along each skyline, a fifth along each wall foot, the rest scattered between
        const r = cr(), band = cr(); let x, z, ci, big = 1;
        if (r < 0.68) {
          const east = cr.chance(0.44); z = cr.range(-1120, 180); const W = 160 + 16 * noise.n2(z * 0.004, east ? 3 : 9);
          const dx = band < 0.22 ? 292 + 166 * cr() : band < 0.42 ? 4 + cr() * 125 : 4 + Math.pow(cr(), 1.25) * 290; if (band < 0.22) big = 1.45;
          x = (east ? 1 : -1) * Math.min(632, W + dx); ci = east ? 2 : z > -480 ? 0 : 1;
        } else { const sky = band < 0.24; z = sky ? -1300 - 190 * cr() : band < 0.42 ? -966 - cr() * 110 : -966 - Math.pow(cr(), 1.2) * 340; x = cr.range(-430, 430) * (sky ? 1.35 : 1); if (sky) big = 1.45; ci = 3; }
        lists[ci].push(x, z, big);
      }
      { const c2 = ctx.core.makeRng('sf-cedar2:' + ctx.seed), k2 = (look.groundFog ? 0.7 : 1) * detail;      // closer ranks where the reveal looks: the lower 130 m of the far side walls and of the head wall (their own stream)
        for (let i = Math.round(240 * k2); i > 0; i--) { const z = c2.range(-1000, -470), W = 160 + 16 * noise.n2(z * 0.004, 9); lists[1].push(-(W + 4 + Math.pow(c2(), 0.85) * 180), z, c2.range(0.9, 1.2)); }
        for (let i = Math.round(120 * k2); i > 0; i--) { const z = c2.range(-1000, -470), W = 160 + 16 * noise.n2(z * 0.004, 3); lists[2].push(W + 4 + Math.pow(c2(), 0.85) * 200, z, c2.range(0.9, 1.2)); }
        for (let i = Math.round(240 * k2); i > 0; i--) lists[3].push(c2.range(-330, 330), -966 - Math.pow(c2(), 0.85) * 170, c2.range(0.9, 1.2));
        const c3 = ctx.core.makeRng('sf-cedar3:' + ctx.seed);      // and along the lowest 120 m of both walls beside the hamlet and the paddies, where the daylight looks showed lone trees on a slope (their own stream)
        for (let i = Math.round(900 * k2); i > 0; i--) { const east = c3.chance(0.5), z = c3.range(-480, 180), W = 160 + 16 * noise.n2(z * 0.004, east ? 3 : 9); lists[east ? 2 : 0].push((east ? 1 : -1) * (W + 4 + Math.pow(c3(), 0.85) * 150), z, c3.range(0.9, 1.2)); } }
      for (let ci = 0; ci < 4; ci++) {
        const l = lists[ci], n = l.length / 3; if (!n) continue; const m = new THREE.InstancedMesh(geo, mat, n);
        await ctx.yield();
        const ord = Array.from({ length: n }, (_, i) => i); if (ci === 2) { ord.sort((a, b) => l[a * 3 + 1] - l[b * 3 + 1]); ord.forEach((src, slot) => { wallSlot[src] = slot; wallZs.push(l[src * 3 + 1]); }); }      // the east wall is instanced from the valley head down, so what is behind the camera need not be drawn
        for (let i = 0; i < n; i++) { if (i % 250 === 249) await ctx.yield(); const x = l[i * 3], z = l[i * 3 + 1], hh = cr.range(17, 28) * l[i * 3 + 2], wf = cr.range(0.85, 1.25), slot = ci === 2 ? wallSlot[i] : i; M4.compose(V3.set(MX * x, land.surfaceAt(MX * x, z) - 0.6, z), Q.setFromAxisAngle(YAX, cr.range(0, TAU)), S3.set(hh * wf, hh, hh * wf)); m.setMatrixAt(slot, M4); const k = cr.range(0.7, 1.25); m.setColorAt(slot, colT.setRGB(k * cr.range(0.9, 1.1), k, k * cr.range(0.9, 1.15))); }
        m.name = 'cedar-wall' + ci; if (ci === 2) m.computeBoundingSphere(); scene.add(m);      // (its bounds are taken while every instance counts)
      }
    }
    await ctx.yield();
    for (const h of houses) { const len = h.v === 9 ? 9 : 7, s = Math.sin(h.ry), c = Math.cos(h.ry); for (const k of h.g >= 3 ? [-0.55, 0.55] : [-1, 0, 1]) casters.push({ x: MX * (h.x + s * k * len), z: h.z + c * k * len, r: (h.g >= 3 ? 9.4 : 7.6) * h.s }); }
    for (const g of guns) if (pathD(g.x, g.z).dist < 80) casters.push({ x: MX * g.x, z: g.z, r: 2.4 });
    await ctx.yield();
    const shOpt = { heightAt: land.heightAt, sunDir: KEY, strength: isDusk ? 0.28 : look.shStr ?? 0.5, color: look.shCol ?? '#1a2440', size: 1.15, stretch: isDusk ? 0.6 : 1.1 };
    const shadows = flora.makeGroundShadows({ points: casters.filter((c) => c.z > -425), ...shOpt });      // hamlet and paddies
    await ctx.yield();
    const shadowsV = flora.makeGroundShadows({ points: casters.filter((c) => c.z <= -425 && c.z > -660), ...shOpt });     // the village, in two sheets
    await ctx.yield();
    const shadowsW = flora.makeGroundShadows({ points: casters.filter((c) => c.z <= -660), ...shOpt });
    shadows.object.name = 'ground-shadows'; shadowsV.object.name = 'ground-shadows-v'; shadowsW.object.name = 'ground-shadows-w'; scene.add(shadows.object, shadowsV.object, shadowsW.object);
    await ctx.yield();
    const stookField = new THREE.Group(); stookField.name = 'stook-field'; scene.add(stookField);
    {   // Rows of small straw stooks on the dry ground either side of the causeway and on the dry paddies under the climb (their own stream; two shapes, instanced).
        // They stand on the ridges between the furrows the ground shader draws there (lines 1.1 m apart that keep their distance from the lane): a row every third
        // ridge, a stook every 2.75 m along it, so from the lane they are rows running to the village and from the climb a grid. Clear of water, bunds, huts, racks,
        // trees, the older stooks and the low part of the flight.
      const sr = ctx.core.makeRng('sf-r13:' + ctx.seed), spots = [[], []], cast2 = [], shapes = [];
      for (let v = 0; v < 2; v++) { const G = new Geo(4); G.ex = [0, 0, 2, 0]; stookGeo(G, sr, 0, 0, 0, sr.range(-0.08, 0.08), sr.range(1.75, 1.95), [1, 1, 1]); shapes.push(G.build()); }      // in the thatch material, as bundled straw: seen against the low sun their edges glow, as the racks' sheaves do
      const dry = (x, z) => {
        const cx = (x - PAD.x0) / PAD.cx, cz = (PAD.z0 - z) / PAD.cz; if (cx < 0 || cx >= PAD.nx || cz < 0 || cz >= PAD.nz) return false;
        const fx = cx - Math.floor(cx), fz = cz - Math.floor(cz); if (Math.min(fx, 1 - fx) * PAD.cx < 2.2 || Math.min(fz, 1 - fz) * PAD.cz < 2.2) return false;      // not on a bund
        return !sheets.some((q) => x > q[0] - 1.3 && x < q[1] + 1.3 && z < q[2] + 1.3 && z > q[3] - 1.3);
      };
      for (let z = -277.5, k = 0; z > -412.5; z -= 2.75, k++) {
        for (const sd of [-1, 1]) for (let j = 0; j < 11; j++) {
          const zz = z + sr.range(-0.18, 0.18), d = (LX(zz + 2) - LX(zz - 2)) / 4, x = LX(zz) + sd * (4.95 + 3.3 * j + sr.range(-0.1, 0.1)) * Math.sqrt(1 + d * d);
          const sc = sr.range(0.76, 0.94), rot = sr.range(0, TAU), c2 = mul(mix3(straw, [0.55, 0.43, 0.2], sr()), sr.range(1.5, 2.1)), v = sr.int(0, 1), gone = sr.chance(0.05);
          if (gone || !dry(x, zz)) continue;
          const pd = pathD(x, zz), y = groundAt(x, zz), up = pd.y - y;      // Beside the low flight a stook stands only where the eye passes it whole: no nearer the track than 1.95 times the
          // eye's height over its foot (a 62 degree lens at 16:9, the nose a little up: nearer than that its foot slides under the bottom edge of the frame before it has
          // left by the side). All along the causeway that is the first ridge on the open side; the ridge on the other hand is too near. Where the climb begins none
          // stands close under it.
          if (up < 9 && pd.dist < (up < 3.4 ? 1.95 * up : 15)) continue;
          if (guns.some((g) => Math.hypot(g.x - x, g.z - zz) < 5) || casters.some((c) => Math.hypot(c.x - MX * x, c.z - zz) < c.r * 0.5 + 1.6) || stookSpots.some((q) => Math.hypot(q[0] - x, q[1] - zz) < 2.6)) continue;
          spots[v].push([x, y - 0.04, zz, rot, sc, c2]); cast2.push({ x: MX * x, z: zz, r: 0.8 * sc });
        }
        if (k % 8 === 7) await ctx.yield();
      }
      for (let v = 0; v < 2; v++) {
        const im = new THREE.InstancedMesh(shapes[v], thatchMat, Math.max(1, spots[v].length)); im.count = spots[v].length;
        spots[v].forEach(([x, y, z, rot, sc, c2], i) => { M4.compose(V3.set(MX * x, y, z), Q.setFromAxisAngle(YAX, rot), S3.set(sc, sc, sc)); im.setMatrixAt(i, M4); im.setColorAt(i, colT.setRGB(c2[0], c2[1], c2[2])); });
        im.name = 'stooks' + v; stookField.add(im);
      }
      await ctx.yield();
      stookField.userData.count = cast2.length; zStooks = cast2.reduce((m, c) => Math.min(m, c.z), 0) - 1;
      await ctx.yield();
      for (let i = 0; i < cast2.length; i++) { const c = cast2[i]; shCone(MX * c.x, c.z, 0.78 * c.r, 2.2 * c.r, 0.8); if (i % 120 === 119) await ctx.yield(); }
    }
    await ctx.yield();
    let shStook = 0;
    {   // paint the long shadows (see SH above): houses, the great house, huts, racks, trees, groves, stooks
      let n = 0;
      for (const h of houses) {
        const v = h.v === 9 ? { L: EH.L, WX: EH.WX, ridgeY: EH.ridgeY, dTop: 15.7 } : h.v < 0 ? hiVar : variants[h.v], s = h.s;
        shHouse(h.x, h.z, h.ry, (v.L / 2) * s, v.WX * s, (v.dTop * 0.5 + 0.2) * s, (v.ridgeY - v.dTop * 0.866) * s, v.ridgeY * s, 0.92);
        if (++n % 5 === 0) await ctx.yield();
      }
      { const c = Math.cos(THETA), s = Math.sin(THETA); shHouse(HERO.x - 8 * s, HERO.z - 8 * c, THETA, 15, 7, 13.5, 4.6, 26.5, 0.92); shBox(HERO.x, HERO.z, THETA, 20, 22, 1.5, 0.8); }
      await ctx.yield();
      for (const g of guns) shBox(g.x, g.z, g.az, 1.8, 1.8, 2.7, 0.85, 0.5);
      for (const r of racks) shBox(r[0], r[1], r[2], 0.45, 6.3, 3.25, 0.85, 0.5);
      shBox(WH.x, WH.z, 0, 0.55, 2, 4, 0.7, 0.5);
      await ctx.yield();
      n = 0;
      for (const c of casters) {
        if (c.k === undefined) continue; const x = MX * c.x, s = c.s;
        if (c.k === 0) shTree(x, c.z, 2.3 * s, 5.2 * s, 0.5); else if (c.k === 1) shTree(x, c.z, 3.8 * s, 6.4 * s, late ? 0.5 : 0.85); else if (c.k === 2) shTree(x, c.z, 5.4 * s, 9.6 * s, late ? 0.7 : 0.88);
        else if (c.k === 3) shCone(x, c.z, 2.8 * s, 20 * s, 0.75); else { shCone(x, c.z, 5.2 * s, 50 * s, 0.6); await ctx.yield(); }      // the groves' great shadows are soft bands of cool shade across lane and fields, not a second night
        if (++n % 8 === 0) await ctx.yield();
      }
      await ctx.yield();
      for (; shStook < stookSpots.length; shStook++) { const q = stookSpots[shStook]; shCone(q[0], q[1], 0.75, 2.0, 0.8); if (shStook % 100 === 99) await ctx.yield(); }
      await ctx.yield();
    }
    {   // ground cover: frosted verge grass along the lane, stubble in the dry paddies, pampas plumes along the channel
      const frosty = late || look.frost > 0.6;
      const inHouse = (x, z) => houses.some((h) => Math.abs(x - h.x) < (h.v === 9 ? 5.4 : h.wx + 0.9) && Math.abs(z - h.z) < (h.v === 9 ? 14 : h.hz + 0.3));
      const verge = await flora.makeGrassAsync({ rng: tr.fork('verge'), path, uRange: [0, 0.345], radius: 24, count: Math.round(4400 * detail * dens), bias: 1.7, heightAt: land.heightAt, wind: floraWind, map: treeMat.map, chunks: 3, flowers: 0, fade: [55, 85],
        density: (wx, z) => { const x = MX * wx, dl = laneDist(x, z), dc = Math.abs(x - CHX(z)) - chanW(z) / 2; if (dl < 1.7 || dc < 1.3 || inHouse(x, z)) return 0;
          return dl < 4.6 || dc < 3.2 || Math.abs(((x + 9) / 31) % 1 + 1) % 1 < 0.07 || noise.n2(x * 0.14 + 7, z * 0.14) > 0.12 ? 1 : 0; },      // in clumps: along the lane's verge, the channel and the bunds, and in drifts between
        root: frosty ? '#a3a18b' : '#77734f', tip: late ? '#eef2f2' : frosty ? '#eaeee8' : '#c4c19c', dry: '#d6cf9c', dryAmount: 0.5, height: [0.25, 0.55], width: [0.2, 0.4], shade: [shadows, castSh] }, ctx.yield);
      await ctx.yield();
      const stubble = await flora.makeGrassAsync({ rng: tr.fork('stubble'), path, uRange: [0.335, 0.53], radius: 30, count: Math.round(3900 * detail * dens), bias: 1.5, heightAt: land.heightAt, wind: floraWind, map: treeMat.map, chunks: 2, flowers: 0, fade: [35, 55],
        density: (wx, z) => { const x = MX * wx; return laneDist(x, z) < 1.9 || isFlooded(x, z) ? 0 : 1; }, root: '#84744a', tip: '#e2d49c', dry: '#ece2b6', dryAmount: 0.5, height: [0.3, 0.58], width: [0.13, 0.22], materialOptions: { backlight: 0.95, backlightTint: '#ffe2a0', ambient: 1.5, leafAmbient: 1.5 }, shade: [castSh] }, ctx.yield);
      await ctx.yield();
      verge.object.name = 'verge'; stubble.object.name = 'stubble'; scene.add(verge.object, stubble.object); updaters.push(verge, stubble);
      await ctx.yield();
      const avenue = await flora.makeGrassAsync({ rng: xr.fork('avenue'), path, uRange: [0.6, 1], radius: 30, count: Math.round(2400 * detail * dens), bias: 1.4, heightAt: land.heightAt, wind: floraWind, map: treeMat.map, chunks: 3, flowers: 0, fade: [35, 55],
        density: (wx, z) => { const x = MX * wx; return Math.abs(x - AV(z)) < 3.2 || Math.hypot(x - HERO.x, z - HERO.z) < 47 || inHouse(x, z) ? 0 : 1; }, root: '#57503a', tip: late ? '#cfd4cc' : '#b9b18a', dry: '#d8cc96', dryAmount: 0.6, height: [0.2, 0.4], width: [0.25, 0.45], shade: [shadows, shadowsV, shadowsW, castSh] }, ctx.yield);
      avenue.object.name = 'avenue-grass'; scene.add(avenue.object); updaters.push(avenue);
      await ctx.yield();
      const rv = [0, 1, 2].map(() => flora.reedGeometry({ rng: tr, height: tr.range(2.3, 3), ...(isDusk ? { leaf: '#55564f', tip: '#84827a', root: '#3b3c3a', head: '#7d7b78' } : { leaf: '#b3aa82', tip: '#f3efe0', root: '#6c6848', head: '#f4eedc' }) })), rpts = [];
      await ctx.yield();
      for (let z = CH0 - 6; z > CH1; z -= tr.range(2.5, 7)) { if (Math.abs(z + 37) < 11 || tr.chance(0.3)) continue; const x = CHX(z) + (tr.chance(0.75) ? 1 : -1) * (chanW(z) / 2 + tr.range(0.8, 1.6)); if (pathD(x, z).dist > 4.2 && !inHouse(x, z)) rpts.push(pt(x, z, tr.range(0.7, 1.2), tr.int(0, 2))); }
      for (let k = 0; k < 30; k++) { const z = tr.range(-420, -246), x = PAD.x0 + PAD.cx * tr.int(0, PAD.nx) + tr.range(-0.5, 0.5); if (laneDist(x, z) > 5 && pathD(x, z).dist > 5) rpts.push(pt(x, z, tr.range(0.7, 1.15), tr.int(0, 2))); }
      for (let z = -250; z > -640; z -= tr.range(6, 14)) { const x = RX(z) - tr.range(8.5, 11); rpts.push(pt(x, z, tr.range(0.8, 1.3), tr.int(0, 2))); }
      const rpts2 = [];
      for (let z = 30; z > -246; z -= xr.range(8, 15)) { const x = RX(z) - xr.range(8.5, 11), pd = pathD(x, z); rpts2.push({ x: MX * x, y: groundAt(x, z), z, s: xr.range(0.9, 1.4), rot: xr.range(0, TAU), d: pd.dist, u: pd.u, v: xr.int(0, 2) }); }
      for (const [x, z, sc] of [[6.6, -11, 1.2], [7.8, -13.5, 0.95], [6.2, -15.5, 0.8], [-6.8, -17, 1.1], [-7.6, -20, 0.85], [-7, -42, 1], [10.5, -34, 0.9]]) { const pd = pathD(x, z); rpts2.push({ x: MX * x, y: groundAt(x, z), z, s: sc, rot: xr.range(0, TAU), d: pd.dist, u: pd.u, v: xr.int(0, 2) }); }   // plumes in the entry foreground
      for (let z = -52; z > CH1 + 8; z -= r9.range(12, 15)) {      // a clump of plumes beside the channel every dozen metres: its line is broken, and it reads as a stream
        if (Math.abs(z + 37) < 11) continue; const sd = r9.chance(0.5) ? 1 : -1;
        for (let k = r9.int(2, 3); k > 0; k--) { const zz = z + r9.range(-1.3, 1.3), x = CHX(zz) + sd * (chanW(zz) / 2 + r9.range(0.6, 1.3)), pd = pathD(x, zz), sc = r9.range(0.7, 1.1), rot = r9.range(0, TAU), v = r9.int(0, 2);
          if (pd.dist > 4.2 && laneDist(x, zz) > 2.9 && !inHouse(x, zz)) rpts2.push({ x: MX * x, y: groundAt(x, zz), z: zz, s: sc, rot, d: pd.dist, u: pd.u, v }); }
      }
      for (let i = 0; i < 9; i++) { const x = -3 + i * 3.6 + r9.range(-1, 1), z = -386 + r9.range(-0.6, 0.6), pd = pathD(x, z), sc = r9.range(0.8, 1.2), rot = r9.range(0, TAU), v = r9.int(0, 2);      // a line of plumes on the paddy bund under the climb
        if (laneDist(x, z) > 5 && pd.dist > 6 && !r9.chance(0.15)) rpts.push({ x: MX * x, y: groundAt(x, z), z, s: sc, rot, d: pd.dist, u: pd.u, v }); }
      for (const [xa, xb, zb] of [[2, 25, -358], [-30, -3, -330], [19, 33, -302], [-30, -3, -302]]) for (let x = xa; x < xb; x += r11.range(2.2, 4.2)) {      // plumes along the bunds between the lane's own sheets of water (their own stream)
        const z = zb + r11.range(-0.8, 0.8), sc = r11.range(0.8, 1.25), rot = r11.range(0, TAU), v = r11.int(0, 2), pd = pathD(x, z);
        if (pd.dist > 6 && laneDist(x, z) > 5 && Math.hypot(x - gk[0][0], z - gk[0][1]) > 3 && !guns.some((g) => Math.hypot(g.x - x, g.z - z) < 4)) rpts.push({ x: MX * x, y: groundAt(x, z), z, s: sc, rot, d: pd.dist, u: pd.u, v });
      }
      await ctx.yield();
      const pampas2 = flora.makeScatter({ rng: xr.fork('pampas2'), points: rpts2, variants: rv, material: treeMat, tint: 0.1, hue: 0.02, sink: 0.04, tilt: 0.06 }); pampas2.object.name = 'pampas-entry'; scene.add(pampas2.object);
      await ctx.yield();
      const pampas = flora.makeScatter({ rng: tr.fork('pampas'), points: rpts.filter((q) => q.z >= -430), variants: rv, material: treeMat, tint: 0.1, hue: 0.02, sink: 0.04, tilt: 0.06 }); pampas.object.name = 'pampas'; scene.add(pampas.object);      // hamlet and paddies: behind us from the top of the climb
      await ctx.yield();
      const pampasR = flora.makeScatter({ rng: r9.fork('pampas-r'), points: rpts.filter((q) => q.z < -430), variants: rv, material: treeMat, tint: 0.1, hue: 0.02, sink: 0.04, tilt: 0.06 }); pampasR.object.name = 'pampas-river'; scene.add(pampasR.object);      // along the river through the village
    }
    await ctx.yield();
    {   // the hamlet's fields in relief (their own stream): raised grass bunds along the plot edges, a dry-stone kerb down the entry lane, stooks in rows on the stubble plots
      const inH = (x, z) => houses.some((h) => Math.abs(x - h.x) < (h.v === 9 ? 7 : 8.2) && Math.abs(z - h.z) < (h.v === 9 ? 16 : 13.5));
      const okB = (x, z) => { const dl = laneDist(x, z); return z < 54 && z > -243 && x < 50 && dl > 7.5 && dl < 46 && Math.abs(x - CHX(z)) > chanW(z) / 2 + 1.7 && !inH(x, z) && pathD(x, z).dist > 6 && !guns.some((g) => Math.hypot(g.x - x, g.z - z) < 3.8); };
      const frostTop = sfK.z > 0.6 ? 0.22 : 0.1, wB = (x, z) => 0.45 * noise.n2(x * 0.09 + 5, z * 0.09 + 1), hB = (x, z) => 0.3 + 0.1 * noise.n2(x * 0.21 + 3, z * 0.21), kB = (x, z) => 0.95 + 0.3 * noise.n2(x * 0.13, z * 0.13 + 9);
      const quadUp = (A, B, C, D, col, sA, sB, sC, sD) => { const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]); if (ny >= 0) props.quad(A, B, C, D, col, sA, sB, sC, sD); else props.quad(B, A, D, C, col, sB, sA, sD, sC); };
      const seg = (xa, za, xb, zb) => {      // one length of bund: a low trapezoid lying on the drawn ground
        const l = Math.hypot(xb - xa, zb - za), nx = -(zb - za) / l, nz = (xb - xa) / l, ha = hB(xa, za), hb = hB(xb, zb), ka = kB(xa, za), kb = kB(xb, zb);
        const c0 = mul(mix3([0.15, 0.21, 0.085], [0.27, 0.26, 0.14], nr() * 0.7), nr.range(0.9, 1.15)), ct = mix3(mul(c0, 1.1), [0.62, 0.68, 0.74], frostTop * nr.range(0.6, 1)), c = mix3(c0, [0.6, 0.66, 0.72], frostTop * 0.7), wa = wB(xa, za), wb = wB(xb, zb);      // grass and earth; the sides hold frost too, so a bund in shade is a pale bank, not a black bar
        const P = (x, z, o, up) => [MX * (x + nx * o), surfL(x + nx * o, z + nz * o) + up, z + nz * o];
        const a0 = P(xa, za, wa - 1.05, -0.05), a1 = P(xa, za, wa - 0.24, ha), a2 = P(xa, za, wa + 0.24, ha), a3 = P(xa, za, wa + 1.05, -0.05), b0 = P(xb, zb, wb - 1.05, -0.05), b1 = P(xb, zb, wb - 0.24, hb), b2 = P(xb, zb, wb + 0.24, hb), b3 = P(xb, zb, wb + 1.05, -0.05);
        quadUp(a0, b0, b1, a1, c, 0.9 * ka, 0.9 * kb, kb, ka); quadUp(a1, b1, b2, a2, ct, 1.05 * ka, 1.05 * kb, 1.05 * kb, 1.05 * ka); quadUp(a3, b3, b2, a2, c, 0.9 * ka, 0.9 * kb, kb, ka);
      };
      for (const x of [-40, -9, 22, 53]) for (let z = 52, k = 0; z > -244; z -= 4, k++) { if (okB(x, z - 2)) seg(x, z, x, z - 4); if (k % 25 === 24) await ctx.yield(); }
      for (let fx = -2; fx <= 1; fx++) for (let j = -12; j <= 3; j++) { const xa = -9 + 31 * fx, z = 23 * (j - 0.37 * fx) - 3; if (z > 52 || z < -243) continue; for (let k = 0; k < 8; k++) { const x0 = xa + k * 3.875; if (okB(x0 + 1.94, z)) seg(x0, z, x0 + 3.875, z); } if ((j & 3) === 0) await ctx.yield(); }
      const kc = () => { let c = mul([0.3, 0.285, 0.25], nr.range(0.85, 1.15)); const q = nr(); if (q < 0.35) c = mix3(c, [0.13, 0.2, 0.08], nr.range(0.2, 0.45)); else if (q < 0.65) c = mix3(c, [0.62, 0.69, 0.76], nr.range(0.12, 0.28)); return c; };
      for (let z = -4; z > -57; ) { const len = nr.range(0.45, 1.0); nr.range(-0.08, 0.08); nr.range(0.2, 0.36); nr.range(0.34, 0.5); kc(); nr.range(-0.08, 0.08); nr.chance(0.08); z -= len; }      // (the draws the old, even kerb took)
      for (let z = -4; z > -57; ) {      // the kerb: field stones of the lane's own gravel colour, sunk in the verge, of every length, askew, with gaps: a ragged edge, not a dashed line
        const len = r9.range(0.3, 1.4), zc = z - len / 2, x = LX(zc) - 2.55 + 0.2 * r9.range(-0.16, 0.16), kh = lerp(0.14, 0.22, (r9.range(0.12, 0.3) - 0.12) / 0.18), kw = lerp(0.36, 0.46, (r9.range(0.3, 0.55) - 0.3) / 0.25), ry = Math.atan2(LX(zc + 1) - LX(zc - 1), 2) + 0.22 * r9.range(-0.25, 0.25), q = r9();
        let col = mul([0.42, 0.4, 0.34], r9.range(0.85, 1.12)); if (q < 0.28) col = mix3(col, [0.15, 0.22, 0.09], r9.range(0.3, 0.6)); else if (q < 0.5) col = mix3(col, [0.62, 0.69, 0.76], r9.range(0.25, 0.5));
        { r9.chance(0.24); const gap = 0.03 + 0.07 * (r9.range(0.7, 0.95) - 0.7) / 0.25; props.box(MX * x, surfL(x, zc) + kh / 2 - 0.08, zc, kw, kh, Math.max(0.2, len - gap), col, { ry: MX * ry, tx: 0.9, tz: 0.97, gb: 0.94, top: 1.12, noBottom: true }); }      // set in one line: gaps of a few centimetres, a yaw of three degrees at most
        z -= len;
      }
      await ctx.yield();
      for (let fx = -1; fx <= 1; fx++) for (let j = -11; j <= -4; j++) {      // stooks standing in rows that run with the lane, on the plots the map calls stubble
        const xc = -9 + 31 * (fx + 0.5), zc = 23 * (j + 0.5 - 0.37 * fx) - 3; if (zc > -96 || zc < -238 || plotAt(xc, zc).type !== 0) continue;
        for (const x0 of fx < 0 ? [-28.5, -20.5] : fx > 0 ? [33.5, 41.5] : [-5, 18.5]) for (let i = 0; i < 5; i++) {
          const x = x0 + nr.range(-0.4, 0.4), z = zc + (i - 2) * 3.3 + nr.range(-0.4, 0.4), keep = !nr.chance(0.12);
          if (keep && free(x, z, 2) && laneDist(x, z) > 6.5 && !inH(x, z) && plotAt(x, z).type === 0) stookAt(nr, x, z);
        }
      }
      await ctx.yield();
    }
    for (; shStook < stookSpots.length; shStook++) { const q = stookSpots[shStook]; shCone(q[0], q[1], 0.75, 2.0, 0.8); }
    shTex.needsUpdate = true; litTex.needsUpdate = true;
    await ctx.yield();
    {
      const pm = new THREE.Mesh(await props.buildSlowly(ctx), solidMat); pm.name = 'props-hamlet';
      await ctx.yield();
      const sf = new THREE.Mesh(await soft.buildSlowly(ctx), softMat); sf.name = 'cloth'; sf.geometry.computeBoundingSphere(); sf.geometry.boundingSphere.radius += 2;      // its true bounds and 2 m for the sway of a cord in the wind: the renderer's own test of what lies in view applies to it
      await ctx.yield();
      const pv = new THREE.Mesh(await propsV.buildSlowly(ctx), solidMat); pv.name = 'props-village'; scene.add(pm, sf, pv);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the wave: thresholds in u, measured on the real path
    const uEaveEnd = uAtZ(-0.7, -88), uVeil = uAtZ(5.2, zVeil), uCross = uAtZ(5.2, -194);
    guns[0].thr = uEaveEnd - 0.012; guns[1].thr = uEaveEnd + 0.008; guns[2].thr = uEaveEnd + 0.022; guns[3].thr = uCross - 0.085; guns[4].thr = uCross - 0.07; guns[5].thr = uVeil - 0.1; guns[6].thr = uCross - 0.055; guns[7].thr = uCross - 0.04; guns[NP0].thr = uVeil + 0.002; guns[NP0 + 1].thr = uVeil + 0.012;
    guns[8].thr = uEaveEnd + 0.03; guns[9].thr = uEaveEnd + 0.045; gunE.thr = uCross - 0.075; for (let i = 0; i < 8; i++) thrF0 = Math.min(thrF0, guns[i].thr); for (let i = 10; i < NP0; i++) thrB0 = Math.min(thrB0, guns[i].thr);      // the heralds beyond the paddies fire once the first hut has: no water anywhere during the entry and the eave
    { const thr = guns.map((g) => g.thr);      // the water of a gun that has not fired is not sent to be drawn (it has none): each set of fans in the order its guns fire
      fount.orderByFiring(thr.slice(0, 8)); fountH.orderByFiring(thr.slice(8, 10)); fountB.orderByFiring(thr.slice(10, NP0)); fountP.orderByFiring(thr.slice(NP0)); }
    setGuns(0);

    // ------------------------------------------------------------ the speed table: the dart and hover is done with speed (12, 6 under the eave, 22, 18, 20, 14 m/s)
    const DUR = 42, uHov = Math.min(0.07, uEaveEnd - 0.065);
    const pace = (u) => { let v = lerp(12, 6, sm(uHov, uHov + 0.03, u)); v = lerp(v, 22, sm(uEaveEnd - 0.004, uEaveEnd + 0.035, u)); v = lerp(v, 18, sm(0.47, 0.49, u)); v = lerp(v, 20, sm(0.68, 0.7, u)); return lerp(v, 14, sm(0.89, 0.91, u)) / 17; };
    // The engine samples pace at 65 points and rescales it to last DUR; the same sums here give the time at every u, so
    // things that must take seconds (a column jumping to 30 m, crows going up) stay pure functions of u.
    const PN = 64, pTab = new Float32Array(PN + 1), TN = 512, tTab = new Float32Array(TN + 1);
    {
      let inv = 0; for (let i = 0; i <= PN; i++) pTab[i] = clamp(pace(i / PN), 0.35, 2.5); for (let i = 0; i < PN; i++) inv += 2 / (pTab[i] + pTab[i + 1]);
      const k = inv / PN, pv = (u) => { const x = clamp(u, 0, 1) * PN, i = Math.min(PN - 1, Math.floor(x)); return (pTab[i] + (pTab[i + 1] - pTab[i]) * (x - i)) * k; };
      for (let i = 1; i <= TN; i++) tTab[i] = tTab[i - 1] + DUR / TN / pv((i - 0.5) / TN);
    }
    const timeAt = (u) => { const x = clamp(u, 0, 1) * TN, i = Math.min(TN - 1, Math.floor(x)); return tTab[i] + (tTab[i + 1] - tTab[i]) * (x - i); };
    const uAfter = (u0, sec) => { const t1 = timeAt(u0) + sec; let i = Math.floor(clamp(u0, 0, 1) * TN); while (i < TN && tTab[i + 1] < t1) i++; return i >= TN ? 1 : (i + (t1 - tTab[i]) / Math.max(1e-6, tTab[i + 1] - tTab[i])) / TN; };
    for (const g of guns) g.rise = clamp(uAfter(g.thr, 1.5) - g.thr, 0.008, 0.07);      // every column takes about 1.5 s to stand, whatever the speed there
    const riseHero = clamp(uAfter(thrHero, 1.6) - thrHero, 0.008, 0.07);
    for (let i = 0; i < 3; i++) { const g = guns[i], m = g.range * (1 - g.spread * 0.5); wetH[i].set(MX * (g.x + Math.sin(g.az) * m), g.z + Math.cos(g.az) * m, 6.5, g.thr + g.rise * 0.8); }
    // a crossing flock flies its route in real seconds around tMid (the kit keys it to u, and u no longer runs evenly)
    const onTime = (f, uc, w, tMid, dur) => { const upd = f.update.bind(f); f.update = (dt, t, cam, u) => upd(dt, t, cam, u <= 0 ? 0 : clamp(uc + (2 * w * (timeAt(u) - tMid)) / dur, 0, 1.2)); return f; };

    // ------------------------------------------------------------ creatures
    const fr = rng.fork('fauna'), fauna = F.makeFauna(scene, { light: F.lightFrom(scene), rng: fr.fork('warm') });
    const reds = [['#ff3a2a', '#40100a'], ['#e8281a', '#3a0c08'], ['#ff5a30', '#48140a']];
    // Every group of creatures is drawn while the eye is within 200 of its members' own lengths of the group (of the sphere that holds it), the same on every
    // side: beyond that a creature is under 0.3 of a degree across, a speck. (The kit's own test of distance; no window before or after along the flight.)
    const SEEN = 200, seen = (len) => ({ range: SEEN * len });
    // The red dragonflies sun themselves on the straw racks (their places from a stream of their own): each has its place on a rack's top rail, somewhere along its
    // 12 m, a hand to a stride above the straw, and hovers and darts within a stride of it. The paddies' racks hold the larger swarm, the hamlet's the smaller
    // (the two swarms that were sown along the flight path, the same numbers and sizes). Racks are taken in their order, round and round.
    const perchR = ctx.core.makeRng(ctx.core.hashSeed('sf-r18-perch:' + ctx.seed));
    const perches = (list, n) => Array.from({ length: n }, (_, i) => { const r = list[i % list.length], q = perchR.range(-6, 6), up = perchR.range(0.15, 0.9); return [MX * (r[0] + Math.sin(r[2]) * q), groundAt(r[0], r[1]) + 3.2 + up, r[1] + Math.cos(r[2]) * q]; });
    { const n1 = Math.round(22 * cast.swarm * dens); fauna.add(F.makeDragonflies({ rng: fr.fork('d1'), count: n1, positions: perches(racks.filter((r) => r[1] <= -250 && r[1] > -430), n1), roam: [1.3, 0.45, 0.75, 0], size: 2.4, varieties: reds }), seen(0.13 * 2.4)); }
    await ctx.yield();
    { const n2 = Math.round(13 * cast.swarm * dens); fauna.add(F.makeDragonflies({ rng: fr.fork('d2'), count: n2, positions: perches(racks.filter((r) => r[1] > -250), n2), roam: [1.3, 0.45, 0.75, 0], size: 2.2, varieties: reds }), seen(0.13 * 2.2)); }
    await ctx.yield();
    // (flock cure 1) every kit creature that flies keeps 2.0 m of clear air from the flown line, BY PLACE. The birds, bird by bird: each course stays where
    // it is laid, a bird whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's keepClear with each; the kites, which soar,
    // only upward), the deal is held at three scatters, and each flock has a small wander of its own written out so that the lane it leaves about the line
    // stays narrow. Each stretch is the part of the route the course comes within 45 m of, and more; the kites are made by the kit's stepped maker (the same flock to the bit). The entry's dragonflies are kept by the kit's keepClear
    // for insects (an anchor whose whole flight would come within 2 m of the line is moved level, straight away from it) and roam four fifths as wide as
    // the maker's own, so that with the move no dragonfly flies outside the box it had: the kit knows no ground and no wall.
    const clearOf = (from, to, up) => ({ path, dist: 2, each: true, from, to, step: 2, ...(up ? { up: true } : {}) }), KEPT = { wander: [0.6, 0.4, 0.8, 0.4], maxSigma: 3 };
    fauna.add(F.makeDragonflies({ rng: xr.fork('d0'), count: 8, path, uFrom: 0.03, uTo: 0.075, clear: 6, spread: 5, lift: [-1.6, 1.3], size: 1.8, varieties: reds, roam: [1.9, 0.7, 0.75, 0], keepClear: { path, dist: 2, from: 0, to: 1, step: 0.5 } }), seen(0.13 * 1.8));     // our own swarm, close around the entry
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: xr.fork('ridge'), species: 'crows', count: 7, size: 1.25, wander: [1.2, 0.8, 1.6, 0.4], maxSigma: 3, keepClear: clearOf(0, 0.3), center: [MX * (EH.x - 3), groundAt(EH.x, EH.z) + EH.ridgeY + 7, EH.z + 2], radius: 15 }), seen(0.5 * 1.25));   // crows circling the eave house ridge
    await ctx.yield();
    fauna.add(F.makeFishSchool({ rng: fr.fork('koi'), species: 'koi', count: 14, center: [MX * CHX(-37), surfL(CHX(-37), -37) + 0.085, -37], spread: [1.25, 0.02], size: 1.5, caustics: 0 }), seen(0.6 * 1.5));
    await ctx.yield();
    for (const kz of [-70, -118]) { fauna.add(F.makeFishSchool({ rng: r14.fork('koi' + kz), species: 'koi', count: 8, center: [MX * CHX(kz), surfL(CHX(kz), kz) + 0.085, kz], spread: [0.5, 0.02], size: 1.3, caustics: 0 }), seen(0.6 * 1.3)); await ctx.yield(); }
    const bird = cast.sparrows ? { species: 'crows', lod: 'low', count: 90, size: 0.5, body: '#5e4a34', wingC: '#4a3826', spread: [16, 7, 22] } : { species: 'crows', count: 20, size: 1.35 };
    fauna.add(onTime(F.makeFlock({ rng: fr.fork('burst1'), ...bird, ...KEPT, keepClear: clearOf(0.12, 0.43), cross: { path, u: uEaveEnd + 0.045, lead: 46, height: 9, angle: 70, side: -1, span: 180, window: 0.1, rise: 26, duration: DUR } }), uEaveEnd + 0.045, 0.1, timeAt(guns[0].thr) + 4.3, 8));      // up as the first column jumps
    await ctx.yield();
    fauna.add(onTime(F.makeFlock({ rng: fr.fork('burst2'), ...bird, ...KEPT, keepClear: clearOf(0.2, 0.5), count: Math.round(bird.count * 0.7), cross: { path, u: uCross - 0.02, lead: 60, height: 13, angle: 110, side: 1, span: 190, window: 0.1, rise: 20, duration: DUR } }), uCross - 0.02, 0.1, timeAt(uCross - 0.02), 8.5));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: fr.fork('roost'), species: 'crows', count: 18, size: 1.3, wander: [1.2, 0.8, 1.6, 0.4], maxSigma: 3, keepClear: clearOf(0.65, 1), center: [MX * -30, floorY(-620) + 44, -620], radius: 80 }), seen(0.5 * 1.3));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: fr.fork('kites'), species: 'eagles', count: 2, size: 1.7, body: '#3c2c1e', maxSigma: 3, keepClear: clearOf(0.35, 1, true), center: [MX * 34, floorY(-590) + 72, -590], soarRadius: 60 }, ctx.yield));
    await ctx.yield();
    const egretAt = [-10, -288], egretY = padLevel(1) + 0.11;
    const egret = F.makeWaders({ rng: fr.fork('egret'), species: 'egret', count: 1, positions: [[MX * egretAt[0], egretY, egretAt[1]]], level: egretY, size: 1.3 }); fauna.add(egret);
    await ctx.yield();
    const uEgret = uAtZ(6.5, -280);
    fauna.add(onTime(F.makeFlock({ rng: fr.fork('egret-up'), species: 'gulls', count: 1, size: 1.7, body: '#f6f6f2', belly: '#ffffff', wingC: '#f4f4f0', tip: '#f0f0ec', spread: [0.5, 0.5, 0.5], ...KEPT, keepClear: clearOf(0.34, 0.67),
      cross: { path, u: uEgret + 0.03, lead: 30, height: 4, angle: 62, side: -1, span: 150, window: 0.085, rise: 18, duration: DUR } }), uEgret + 0.03, 0.085, timeAt(uEgret + 0.03), 7));
    await ctx.yield();

    // ------------------------------------------------------------ steam, smoke, particles, lens
    const vd = { P: [], V: [], S: [], K: [] }, vr2 = rng.fork('vapour');
    for (const h of houses) {
      const near = pathD(h.x, h.z).dist < 120, wx = MX * h.x, hl = h.v === 9 ? 11 : Math.min(8, h.hz - 1.6);
      for (let i = near ? 4 : 2; i > 0; i--) {     // hearth smoke seeping through the ridge
        vd.P.push(wx + vr2.range(-0.4, 0.4), h.y + h.ridge + 0.2, h.z + vr2.range(-hl, hl) * 0.7, -1); vd.V.push(0, vr2.range(0.7, 1.2), 0, 0);
        vd.S.push(vr2.range(0.8, 1.3), vr2.range(4.5, 7), vr2.range(6, 9), vr2()); vd.K.push(vr2.range(0.08, 0.13), 1, 0.9, 0.8);
      }
      if (near && !isDusk) for (let i = Math.round((h.v === 9 ? 26 : 11) * detail); i > 0; i--) {     // frost steam smoking off the sunlit slope
        const d = vr2.range(1.5, (h.ridge - 3.6) / 0.866);
        vd.P.push(wx + Math.sign(KEY.x) * d * 0.5, h.y + h.ridge - d * 0.866 + 0.45, h.z + vr2.range(-hl, hl), -1); vd.V.push(Math.sign(KEY.x) * vr2.range(0.1, 0.5), vr2.range(0.6, 1.3), 0, 0);
        vd.S.push(vr2.range(0.6, 1.2), vr2.range(2.6, 4.2), vr2.range(4, 7.5), vr2()); vd.K.push(vr2.range(0.05, 0.085), 0, 0.3, 1);
      }
    }
    for (const h of houses) if (h.v >= 0 && h.v <= 2) for (let i = 0; i < 3; i++) {     // big slow puffs so the village roofs steam when seen from the top of the climb
      const sg = Math.sign(KEY.x) || 1, d = xr.range(2, 7), hl = Math.min(8, h.hz - 1.6);
      vd.P.push(MX * h.x + sg * d * 0.5, h.y + h.ridge - d * 0.866 + 1, h.z + xr.range(-hl, hl) * 0.8, -1); vd.V.push(sg * xr.range(0.1, 0.4), xr.range(0.9, 1.5), 0, 0);
      vd.S.push(xr.range(4, 6), xr.range(8, 11), xr.range(7, 10), xr()); vd.K.push(isDusk ? 0.06 : xr.range(0.085, 0.11), isDusk ? 0.5 : 0, 0.5, 1);
    }
    for (const [hx, hy, hz] of [[EH.x, groundAt(EH.x, EH.z) + EH.ridgeY, EH.z + 5], [houses[0].x, houses[0].y + houses[0].ridge, houses[0].z + 3]]) for (let i = 0; i < 9; i++) {   // two hearth-smoke columns in the entry view
      vd.P.push(MX * hx + xr.range(-0.3, 0.3), hy + 0.3, hz + xr.range(-0.5, 0.5), -1); vd.V.push(0, xr.range(1.5, 1.9), 0, 0);
      vd.S.push(xr.range(0.9, 1.3), xr.range(5, 6.5), 9, i / 9 + xr.range(-0.03, 0.03)); vd.K.push(xr.range(0.17, 0.22), 1, 0.55, 0.9);
    }
    for (let i = 0; i < 4; i++) { vd.P.push(MX * WH.x, WH.y - 2.0, WH.z + vr2.range(-0.6, 0.6), -1); vd.V.push(0, 0.5, 0, 0); vd.S.push(0.5, 1.7, 2.4, vr2()); vd.K.push(0.1, 0, 0.3, 0.6); }
    const vapour = makeVapour(vd, Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uTime: time, uProg: { value: new Float32Array(1) }, uWind: { value: new THREE.Vector3(wind[0], 0, wind[2]) }, uSun: uSunV, uSunSide, uSunCol, uWater: { value: new THREE.Color(look.water) }, uMistK: { value: 1 } }), 1);
    vapour.renderOrder = 4; vapour.name = 'vapour'; scene.add(vapour);
    await ctx.yield();
    const set = fx.fxGroup(); set.object.name = 'fx'; scene.add(set.object);
    let gfog = null, bank = null;
    {   // The woodsmoke: a thin blue layer lying 20 m above the floor (the design), a thing of the world at one opacity whatever the eye's height. Its puffs are 4 to
        // 7 m thick and all of it lies inside the walls' feet (no centre further than 100 m from the valley's axis, no puff wider than 90 m; the walls begin at 148 m),
        // so it is a layer over the floor seen against the walls from below and against the floor from above, never a haze on the walls.
      const sp = []; for (let i = 0; i < 40; i++) { const z = vr2.range(-900, -20); sp.push([MX * 0.8 * vr2.range(-125, 125), floorY(z) + 20 + 0.5 * vr2.range(-2, 2), z]); }
      const smokeLayer = set.add(fx.makeMist({ rng: vr2.fork('layer'), time, positions: sp, count: sp.length, size: [50, 90], color: isDusk ? '#6f82c4' : '#9db6de', opacity: look.groundFog ? 0.1 : isDusk ? 0.14 : 0.13 * (look.haze ?? 1), flatten: 0.075 }));
      smokeLayer.object.name = 'woodsmoke';
      await ctx.yield();
      if (look.groundFog) gfog = set.add(fx.makeGroundFog({ rng: vr2.fork('fog'), time, heightAt: (x, z) => floorY(z), center: [0, 0, -400], size: 1150, mode: 'hug', lift: 1, height: 12, layers: 9, segments: 20, color: '#bfc5d3', opacity: 0.24, coverage: 0.8, sunDir: KEY.toArray(), sunColor: look.sun, scatter: 0.9 }));
      await ctx.yield();
      if (look.groundFog) {
        const mr = xr.fork('mist-cards'), mp = [];
        for (let i = 0; i < 30; i++) { const z = mr.range(-900, -440), x = mr.range(-135, 85); mp.push([MX * x, floorY(z) + mr.range(6, 10), z]); }
        for (let i = 0; i < 10; i++) { const z = mr.range(-640, -560), x = AV(z) + mr.range(-40, 40); mp.push([MX * x, floorY(z) + mr.range(5, 9), z]); }      // and along the avenue: the last descent comes down into lit lumps, not a flat sheet
        set.add(fx.makeMist({ rng: mr.fork('m'), time, positions: mp, count: mp.length, size: [46, 96], color: '#ffe9cc', opacity: 0.26, flatten: 0.2 }));      // the lit, lumpy top of the fog between the houses
        await ctx.yield();
        // The bank itself: lit, lumpy puffs lying 10-12 m deep over the village floor, so walls, eaves, trunks and stooks are under it and only the
        // upper roofs and the fans stand out. A lane is left open along the low part of the flight (the avenue to the portal); it thins as we come down into it.
        const br = ctx.core.makeRng('sf-bank:' + ctx.seed), clouds = [];
        for (let i = 0; i < 9; i++) for (let j = 0; j < 12; j++) {
          const x = -152 + (i + br.range(0.05, 0.95)) * 28, z = -424 - (j + br.range(0.05, 0.95)) * 40, pd = pathD(x, z), sc = br.range(0.7, 1.3), up = br.range(4.0, 6.8);
          if (pd.dist < 15 && pd.y - floorY(z) < 22 || pd.dist < 22 && pd.y - floorY(z) < 34) continue;      // (the gap opens wider, earlier: the avenue is seen in it from the descent)
          if (noise.n2(x * 0.021 + 3.7, z * 0.021) > 0.28) continue;      // windows in the bank (no draws): through them the floor, the racks and the paths show dimly, so the sea has depth
          clouds.push({ position: [MX * x, floorY(z) + up * 0.8, z], scale: sc });
        }
        bank = set.add(fx.makeCloudPuffs({ rng: br.fork('puffs'), time, clouds, puffs: 9, size: [16, 32], spread: [1.15, 0.14, 1.15], flatten: 0.42, opacity: 0.9, color: '#fff0dc', shadowColor: '#6f82ac', rim: 1.0, under: 0.2, variation: 0.8, detail: 2.5,      // (lumps lit and in shade by turns: from the climb the sea has sunlit tops and blue hollows, not one tone)
          sunDir: KEY.toArray(), sunColor: look.sun, veil: 0, drift: [0, 0, 0], billow: 0.05, near: [0.7, 3.0], nearCap: 0.4 }));      // near: a puff thins to haze within about 50 m of the eye, so no white card ever stands in front of a roof we pass
        bank.object.name = 'fog-bank';
        await ctx.yield();
      }
      if (look.groundFog) {      // a low sheet of sunlit haze over the hamlet lane: the first half flies into warm light, not flat grey
        const lr = nr.fork('lane-haze'), lp = [];
        for (let i = 0; i < 18; i++) { const z = -20 - (i + lr()) * 12.5, x = LX(z) + lr.range(-16, 16); lp.push([MX * x, floorY(z) + lerp(1.2, 5.5, (lr.range(2.2, 5.5) - 2.2) / 3.3), z]); }
        set.add(fx.makeMist({ rng: lr.fork('m'), time, positions: lp, count: lp.length, size: [24, 46], color: '#ffe0b4', opacity: 0.32, flatten: 0.24 }));
        await ctx.yield();
      }
      if (look.groundFog) {      // and on across the paddies to the foot of the climb
        const lr = r9.fork('lane-haze2'), lp = [];
        for (let i = 0; i < 10; i++) { const z = -246 - (i + lr()) * 17.4, x = LX(z) + lr.range(-18, 18); lp.push([MX * x, floorY(z) + lr.range(2.5, 6), z]); }
        set.add(fx.makeMist({ rng: lr.fork('m'), time, positions: lp, count: lp.length, size: [26, 48], color: '#ffe0b4', opacity: 0.16, flatten: 0.24 }));
        await ctx.yield();
      }
      if (!look.groundFog) {      // haze lying along the foot of the walls behind and beside the village (its own stream): from the climb the roofs and fans stand in a lit bowl, not in a black pit
        const hz = ctx.core.makeRng('sf-haze:' + ctx.seed), hp = [];
        for (let i = 0; i < 26; i++) { const head = i < 10, z = head ? hz.range(-990, -935) : hz.range(-900, -470), x = head ? hz.range(-150, 150) : (i % 2 ? 1 : -1) * hz.range(132, 176); hp.push([MX * x, floorY(z) + hz.range(12, 36) + (lookId === 'morning' || lookId === 'golden' ? 18 : 0), z]); }
        set.add(fx.makeMist({ rng: hz.fork('m'), time, positions: hp, count: hp.length, size: [70, 130], color: isDusk ? '#5a6cb0' : lookId === 'golden' ? '#8e98bc' : '#b4cdee', opacity: isDusk ? 0.08 : lookId === 'golden' ? 0.035 : lookId === 'morning' ? 0.05 : 0.2 * (look.haze ?? 1), flatten: 0.3 }));
        await ctx.yield();
      }
      if (isDusk) set.add(fx.makeGlows({ time, positions: floods, color: '#eaf2ff', size: 7, intensity: 0.6, halo: 1.2 }));
    }
    const leaves = set.add(fx.makeParticles({ rng: vr2.fork('leaves'), preset: 'leaves', time, count: Math.round(380 * detail), box: [56, 30, 56], colors: ['#E8BC2A', '#f4d24c', late ? '#caa222' : '#d9501e'], size: [0.12, 0.24], velocity: [wind[0] * 0.9, -1.0, wind[2] * 0.9] }));
    await ctx.yield();
    const spray = set.add(fx.makeParticles({ rng: vr2.fork('spray'), preset: 'rain', time, count: Math.round(750 * detail), box: [26, 20, 26], velocity: [wind[0] * 3.4, -5, wind[2] * 3.4], colors: ['#ffffff', '#dfeeff', '#fff4dc'], intensity: 1.3 }));
    await ctx.yield();
    const motes = set.add(fx.makeParticles({ rng: vr2.fork('motes'), preset: 'dust', time, count: Math.round(400 * detail), colors: ['#ffffff', '#dbe8f6', '#fff1d6'] }));
    await ctx.yield();
    const snow = rare || lookId === 'mist' && late ? set.add(fx.makeParticles({ rng: vr2.fork('snow'), preset: 'snow', time, count: Math.round(4200 * detail), velocity: [wind[0] * 3.2, -1.7, wind[2] * 3.2] })) : null;
    await ctx.yield();
    spray.setOpacity(0); if (snow) snow.setOpacity(0);
    const lensU = { uBead: { value: 0 }, uWhite: { value: 0 }, uAspect: { value: 1.78 } };
    const lensMesh = makeLens(lensU); lensMesh.name = 'lens'; lensMesh.visible = false; scene.add(lensMesh);
    const wingU = { uTime: time, uSpread: { value: 1 }, uAlpha: { value: 0 } }, wings = makeWings(wingU); wings.name = 'wings'; scene.add(wings);      // our own wings, a hint at the frame's edges (hidden while the world is seen through a portal)
    await ctx.yield();

    await sky.prewarm(ctx.renderer, null, scene);
    hero.object.visible = false;                       // (prewarmed while visible) the stand-in holds its place until the veil pass
    const firstHut = new THREE.Vector3(MX * guns[1].x, guns[1].y + 11, guns[1].z), waveAt = new THREE.Vector3(MX * 12, floorY(-480) + 9, -480), fanField = new THREE.Vector3(MX * -42, floorY(-585) + 12, -585), crown = toWorld(hero.anchors.crossing); crown.y -= 12;
    const hutA = new THREE.Vector3(MX * guns[0].x, guns[0].y + 2.4, guns[0].z), hutLook = new THREE.Vector3(), camW = new THREE.Vector3(), propsVil = scene.getObjectByName('props-village'), propsHam = scene.getObjectByName('props-hamlet');
    const bufSize = new THREE.Vector2(), wallW = scene.getObjectByName('cedar-wall0'), wallE = scene.getObjectByName('cedar-wall2'); let heroP = -1;
    const eaveGrp = scene.getObjectByName('eave-house'), vergeObj = scene.getObjectByName('verge'), groveObj = scene.getObjectByName('grove'), avenueObj = scene.getObjectByName('avenue-grass'), tfb = scene.getObjectByName('entry-fruit'), pampasE = scene.getObjectByName('pampas-entry'), pampasH = scene.getObjectByName('pampas'), grove2 = scene.getObjectByName('grove2'), fruitV = scene.getObjectByName('tree-fruit-v'), fruitH = scene.getObjectByName('tree-fruit'), hamletH = [scene.getObjectByName('thatch-1'), scene.getObjectByName('walls-1')], hamletB = [scene.getObjectByName('thatch-2'), scene.getObjectByName('walls-2')];   // things only ever seen on one stretch of the flight
    // What stands behind the eye is not drawn. Each scatter's instances are put in order of z once (matrices, colours and any other per-instance attribute together:
    // nothing on screen changes), furthest up the valley first, and update() draws only those not yet `back` metres behind the camera (its crown's reach and a margin).
    const zCull = [];
    for (const [nm, back] of [['persimmons', 12], ['maples', 12], ['ginkgos', 14], ['cedars-near', 12], ['pampas', 6], ['pampas-entry', 6], ['pampas-river', 6], ['grove', 20], ['grove2', 16], ['stook-field', 6], ['tree-fruit', 12]]) {
      const o = scene.getObjectByName(nm); if (!o) continue;
      o.traverse((m) => { if (!m.isInstancedMesh || m.count < 4) return;
        const n = m.count, ord = Array.from({ length: n }, (_, i) => i), a = m.instanceMatrix.array, zs = new Float32Array(n), ats = [[m.instanceMatrix, 16]];
        if (m.instanceColor) ats.push([m.instanceColor, 3]); for (const k in m.geometry.attributes) { const at = m.geometry.attributes[k]; if (at.isInstancedBufferAttribute && at.meshPerAttribute === 1 && at.count >= n) ats.push([at, at.itemSize]); }
        ord.sort((i, j) => a[i * 16 + 14] - a[j * 16 + 14]); ord.forEach((s, i) => { zs[i] = a[s * 16 + 14]; });
        for (const [at, k] of ats) { const src = at.array.slice(0, n * k); ord.forEach((s, i) => { for (let c = 0; c < k; c++) at.array[i * k + c] = src[s * k + c]; }); at.needsUpdate = true; }
        if (!m.boundingSphere) m.computeBoundingSphere(); zCull.push({ m, zs, back, n }); });
    }
    const fallXZ = new Float32Array(NGUN * 2); guns.forEach((g, i) => { const m = g.range * (1 - g.spread * 0.5); fallXZ[i * 2] = MX * (g.x + Math.sin(g.az) * m); fallXZ[i * 2 + 1] = g.z + Math.cos(g.az) * m; });
    // drift spray only where a running fan is close (never by u alone), and none in the dry gap of the last approach
    const sprayAt = (u, cam, above) => {
      let dn = 1e9; for (let i = 0; i < NGUN; i++) if (gunProg[i] > 0.6) { const d = Math.hypot(fallXZ[i * 2] - cam.x, fallXZ[i * 2 + 1] - cam.z); if (d < dn) dn = d; }
      return Math.max(0.8 * bell(u, uCross + 0.005, 0.035), 0.8 * bell(u, uVeil, 0.03), 0.42 * (1 - sm(12, 34, dn)) * (1 - sm(26, 50, above))) * (1 - sm(0.85, 0.9, u));
    };
    return {
      scene, path, duration: DUR, pace, ride: 'none',
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 5400, lookAhead: 22, sway: 0.8, bank: 0.9 },
      pois: [
        // under the eave the gaze rests on the hut that fires first, 18 m beyond the eave end; as it fires it lifts to the next one up the lane
        { at: (t, u) => hutLook.copy(hutA).lerp(firstHut, sm(uEaveEnd - 0.002, uEaveEnd + 0.035, u)), from: uEaveEnd - 0.075, to: uEaveEnd + 0.07, weight: 0.6 },
        { at: waveAt, from: 0.22, to: 0.45, weight: 0.45 },
        { at: fanField, from: 0.42, to: 0.74, weight: 0.75, fade: 0.25 },       // the climb looks at the middle of the fan field, not past its edge
        { at: crown, from: 0.64, to: 0.8, weight: 0.6 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: look.pglow ?? 1.15, revealDistance: 300 },
      post: {
        exposure: look.exposure, bloom: { strength: look.bloom, radius: 0.5, threshold: 0.92 },
        grade: { saturation: look.sat, contrast: look.contrast ?? 1.06, tint: look.tint, shadowTint: look.shadow, vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t; ctx.renderer.getDrawingBufferSize(bufSize); uBufH.value = bufSize.y; wetK.z = u; sfT.x = u;
        for (const o of updaters) o.update(dt, t, camera, u);
        setGuns(u); fount.setFired(u); fountH.setFired(u); fountB.setFired(u); fountP.setFired(u);
        const hp = clamp((u - thrHero) / riseHero, 0, 1); if (hp !== heroP) { heroP = hp; hero.setProgress(hp); }
        const gust = rare ? bell(u, 0.69, 0.075) : 0, wv = fount.uniforms.uWind.value;
        wv.set(windBase.x + MX * 7 * gust, 0, windBase.z + 2 * gust); fountB.uniforms.uWind.value.copy(wv); fountH.uniforms.uWind.value.copy(wv); fountP.uniforms.uWind.value.copy(wv); if (heroWind) heroWind.copy(wv);
        fount.object.visible = u > thrF0 - 0.012 && u < uVeil + 0.02; fountB.object.visible = u > Math.min(0.15, thrB0 - 0.012); fountH.object.visible = u > uEaveEnd && u < 0.72; fountP.object.visible = u > 0.3 && u < 0.66;
        hero.update(dt, t, camera); if (fount.object.visible) fount.update(dt, t, camera, ctx.renderer); if (fountB.object.visible) fountB.update(dt, t, camera, ctx.renderer); if (fountH.object.visible) fountH.update(dt, t, camera, ctx.renderer); if (fountP.object.visible) fountP.update(dt, t, camera, ctx.renderer);
        fauna.update(dt, t, camera, u); set.update(dt, t, camera);
        egret.object.visible = u < uEgret + 0.012;
        eaveGrp.visible = u < uEaveEnd + 0.014; drips.visible = !isDusk && u < uEaveEnd + 0.014; vergeObj.visible = u < 0.385; rackGrp[0].visible = u < 0.38; for (const m of hamletH) if (m) m.visible = u < 0.268; pampasE.visible = u < 0.38; pampasH.visible = u < 0.67; grove2.visible = u < 0.43; fruitV.visible = u > 0.25; fruitH.visible = u < 0.45;      // (hamletH: the last of them is behind us by 0.268)
        { const nearB = u >= guns[0].thr; for (const m of hamletB) if (m) { m.visible = nearB && u < uVeil + 0.002; m.count = Math.min(m.instanceMatrix.count, u > 0.352 ? 1 : u > 0.318 ? 2 : 3); } for (const m of hamletFar) m.visible = !nearB; }
        if (hero.fine) for (const m of hero.fine) m.visible = u > 0.6;      // the hero's fruit strings and cloth are invisible specks before the climb
        rackGrp[2].visible = u > 0.25; propsVil.visible = u > 0.25; propsHam.visible = u < 0.595; tfb.visible = u < 0.11; sfK.w = clamp(u / 0.5, 0, 1);
        groveObj.visible = u < 0.36; avenueObj.visible = u > 0.5; if (wallW) wallW.visible = u < 0.66;      // the west wall's lower half is behind us from the top of the climb
        const farH = u < uVeil + 0.002; if (heroFar.visible !== farH) { heroFar.visible = farH; hero.object.visible = !farH; }   // swapped behind the veil's whitening
        wheel.rotation.x = t * 0.7;
        for (const k of trucks) {
          const m = (t * 1.3 + k.off) % 150, zz = -392 - m, x = LX(zz), sc = sm(0, 5, m) * sm(150, 145, m);
          k.grp.position.set(MX * x, groundAt(x, zz), zz); k.grp.rotation.y = Math.atan2(-MX * (LX(zz - 1) - x), 1); k.grp.scale.setScalar(Math.max(0.001, sc)); k.lamp.rotation.y = t * 5;
        }
        camera.getWorldPosition(camW); const above = camW.y - floorY(camW.z);
        { // The nearest floor the frame can hold: where the rays through the bottom edge (its middle and both corners) meet the valley floor, taken 2.5 m high so that a stook's
          // top and the floor's rise up the valley are inside it. The stook field is drawn until all of it lies nearer than that (the climb looks over it).
          const e = camera.matrixWorld.elements, tv = Math.tan((camera.fov * Math.PI) / 360), h = Math.max(0, above - 2.5); let nearZ = -1e9;
          for (const sx of [-1, 0, 1]) { const dy = -e[9] - tv * e[5] + sx * tv * camera.aspect * e[1], dz = -e[10] - tv * e[6] + sx * tv * camera.aspect * e[2]; nearZ = Math.max(nearZ, dy < -1e-3 ? camW.z + (h / -dy) * dz : camW.z); }
          stookField.visible = u > 0.2 && nearZ > zStooks; }
        // (the tufts of stubble sown beside the lane are drawn by the kit's own rule and no other: each of their two beds while the eye is within 55 m of it, where they have faded out)
        if (eaveGrp.visible) { const zq = Math.round(camW.z * 2) / 2;      // the eave strings: round fruit from 10 m ahead to just behind the eye, the plain ones beyond
          ehWin.forEach((w, wi) => { const zN = wi ? zq - 10 : zq + 1.5, zF = wi ? -1e9 : zq - 10, n = w.zs.length; let a = 0; while (a < n && w.zs[a] > zN) a++; let b = a; while (b < n && w.zs[b] > zF) b++;
            if (a === w.a && b === w.b) return; w.a = a; w.b = b; w.m.count = b - a; w.ats.forEach(([at, k], i) => { at.array.set(w.full[i].subarray(a * k, b * k), 0); at.needsUpdate = true; }); }); }
        for (const c of zCull) { let n = c.n; const zc = camW.z + c.back; while (n > 0 && c.zs[n - 1] > zc) n--; while (n < c.zs.length && c.zs[n] <= zc) n++; if (n !== c.n) { c.n = n; c.m.count = n; } }      // trees, plumes and stooks behind the eye are not drawn
        { let n = 11; if (u >= 0.17) { const zc = camW.z - 380; while (n < NGUN && hutZ[n - 10] > zc) n++; } hutMesh.count = n; lidMesh.count = n * 2; }      // village huts further off are less than specks
        { let n = 0; const zc = camW.z - 300; while (n < rackZ.length && rackZ[n] > zc) n++; rackGrp[2].count = n; }
        if (fruitVZ.length) { let n = 0; const zc = camW.z - 240; while (n < fruitVZ.length && fruitVZ[n] > zc) n++; fruitV.count = n; }      // fruit further than 240 m up the valley is less than a pixel
        shadows.object.visible = u < 0.62; shadowsV.object.visible = u > 0.3; shadowsW.object.visible = u > 0.5;      // each sheet of ground shadows only while its stretch is near
        if (wallE) { let n = wallZs.length; const zc = camW.z + 45; while (n > 0 && wallZs[n - 1] > zc) n--; wallE.count = n; }      // east-wall cedars more than 45 m behind us
        if (gfog) {      // seen from inside it is thin haze; from the climb it is a sea, with the water punching out of it
          const hi = sm(8, 30, above), ft = 0.85 * sm(9, 26, above), down = sm(0.7, 0.8, u);      // down: on the last descent the sea thins under us, so the avenue shows through it before we are in it
          gfog.uniforms.uOpacity.value = lerp(0.05, 0.09, hi) * (1 - 0.88 * down); bank.uniforms.uOpacity.value = lerp(0.12, 0.92, sm(4, 16, above)) * (1 - 0.3 * down);      // (the sheets stay a thin haze from above too: at an opacity of 0.55 they laid one flat grey over the bank's lit lumps and the floor between them)
          uMist.value.w = lerp(0.45, 0.62, sm(2, 8, above)) * (1 - 0.55 * down); uMist.value.z = lerp(0.024, 0.03, sm(6, 18, above));      // (a uniform only) the houses' feet dissolve into the bank from above; down in it they are near and clear
          fountB.uniforms.uFogTop.value.set(9.5, -0.03, ft); if (hero.fountains) hero.fountains.uniforms.uFogTop.value.set(9.5, -0.03, ft);
        }
        leaves.setOpacity(0.9 * (1 - sm(14, 42, above))); motes.setOpacity(0.22 * (1 - sm(10, 30, above)));
        spray.setOpacity(sprayAt(u, camW, above)); if (snow) snow.setOpacity(rare ? sm(0.56, 0.64, u) * (1 - sm(0.84, 0.93, u)) : 0.8);
        uRings.value = 0.2 + 0.8 * Math.max(gunProg[NP0], gunProg[NP0 + 1]);      // rings where spray lands on the sheets: once the pair of fans that stands over them runs
        for (let k = 0; k < mirrorGuns.length; k++) { const i = mirrorGuns[k], q = mirrorQ[k], p = gunProg[i];
          uGn.value[k].w = q.az + q.sw * Math.sin((t - q.lag) * q.rate + q.ph); uGm.value[k].w = p > 0.12 ? ((p - 0.12) / 0.88) * q.tm : 0; }
        const bead = clamp((u - (uVeil - 0.012)) / 0.055, 0, 1);
        wingU.uAlpha.value = (isDusk ? 0.025 : 0.06) * (1 - sm(14, 20, above)) * (1 - sm(0.86, 0.9, u)); wingU.uSpread.value = 1 - sm(uEaveEnd - 0.004, uEaveEnd + 0.035, u);
        wings.visible = !ctx.through && u > 0 && wingU.uAlpha.value > 0.003;
        lensMesh.visible = u > uVeil - 0.02 && bead < 1; lensU.uBead.value = bead; lensU.uWhite.value = 0.3 * bell(u, uVeil + 0.002, 0.007); lensU.uAspect.value = camera.aspect;
      },
      dispose() {
        hero.dispose(); sky.dispose(); laneTex.dispose(); vilTex.dispose(); plotTex.dispose(); shTex.dispose(); litTex.dispose(); fruitGeo.dispose();
        for (const v of [...variants, ...farVars, hiVar]) { v.solid.dispose(); v.thatch.dispose(); }
      },
    };
  },
};
