// THE CHINAR TERRACES
// An October morning in a walled Mughal garden in Kashmir, built at about 2.5 times life. World space is the hero's
// local space (brief coordinates + (0, 0, 480)): the axis runs down -Z, left is -X.
//   gatehouse hall  z 546..480 (floor 32.3, a water channel down its middle, pierced screens, honeycomb vault)
//   terrace 1       z 480..330, water y 32     chute 1  z 330..305     terrace 2  z 305..205, water y 24
//   chute 2         z 205..180                 terrace 3  z 180..101, water y 16, widening to the 60 m basin
//   the hero (src/parts/chinar-water-terraces.js): niche gallery z 84..100, the falling sheet at z 84, the tank
//   (y 0, z 84..-156) with its jets and the black pavilion at z -80; the portal sits in its far arch at z -102.
// Flight (890 m, 47 s, lens 56): out of the lit hall through the cusped arch (u 0.07), low down terrace 1 under an
//   arcade of crossing water arches between tulip beds and blossom, then UP through the gap in the chinar avenue to a
//   level 94 m for the one grand view (0.20-0.30, peak 0.25): the garden from edge to edge, both walls running in
//   to the black pavilion, and beyond the far wall the valley's fields and poplar rows, the lake with the sun's road
//   on it, a mist bank and the snow ranges (makeOutside below: nothing out there is kit scenery). Down in a long
//   dive to the second fish-scale chute, where the eye finds the kingfisher hanging on its wings over the canal
//   (hover 0.41-0.445) and follows its dive (0.445-0.4535, the ring on the water at 0.4515); across the east lawn,
//   over the retaining wall (0.57) and down in a left-hand turn, the great fall seen from outside (0.61), into the
//   gallery mouth (0.625): niches on the LEFT, the sheet on the RIGHT, the sunlit mouth ahead (0.63-0.70, flown
//   slowly). Out of the far mouth and round the frayed end of the fall (0.70-0.72): the tank and the pavilion
//   seen past the falling water's edge, threads of it across the right of the frame; then one S across the fountain
//   field past the mallards, up the causeway axis, in through the near arch (0.947) over the carpet to the portal.
//   The brief sends the camera round the LEFT end of the shelf, which would put the niches on the right; this
//   route is its mirror so that the frame the brief asks for (niches left, glass right) is the one that is seen.
//   It also leaves by the gallery's open end instead of through the middle of the sheet: an outside viewer found
//   the still taken between wall and water unreadable, and the view past the water's edge is the one that reads.
// Looks by seed: 'october' (red, mist), 'april' (green chinars, almond blossom, tulips, a sunlit shower), 'snow'
//   (first snow under a pearl sky), 'night' (snow under a full moon, oil lamps in the niches); ctx.vary.hour
//   'golden' mirrors the October sun to the right, 'dawn' holds it under the wall. Rare event: as the eye rounds the
//   fall's end a gust strips the veteran chinar beyond the left wall (x -114, z 20), dead ahead, bare in under two
//   seconds (u 0.713-0.749, the gaze held on it to 0.75) and its red blizzard crosses the tank (to u 0.90).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import { buildHero, makeB, archPanel, HC_PARS } from '../parts/chinar-water-terraces.js';

const V3 = THREE.Vector3;
const PAL = ['#C4381C', '#F5A21E', '#1D4FA8', '#2B4F5E', '#15161B', '#DCE3EA', '#9A8C80'];
const DUR = 47;
const PATH_PTS = [
  [0, 36.5, 540], [0, 36.5, 505], [0, 36.3, 472], [0, 36.5, 448], [0, 39.5, 434], [0, 48, 420], [0, 58.5, 404], [0, 69.5, 388], [0, 79.5, 373], [0, 87, 360], [0, 91.6, 348],
  [0, 93.6, 336], [0, 94, 324], [0, 92.6, 312], [0, 88.2, 300], [0, 80.5, 288], [0, 71, 274], [0, 60.9, 257], [0, 50.4, 241], [0, 41.3, 227], [0, 33.5, 216], [0, 29.5, 208], [0, 27.2, 196], [0, 22.8, 181], [0, 20.4, 169],
  [3, 20.4, 160], [17, 21.1, 151], [33, 21.8, 144], [47, 22.5, 125.5], [59, 22.8, 108.5], [67.5, 22.5, 100], [70, 21.4, 94], [66, 19.6, 90.2],
  [56, 15.4, 89.6], [45, 11, 90.8], [34, 8.4, 92], [20, 7.3, 92], [0, 7.3, 92], [-14, 7.3, 92.2], [-25, 7.2, 92.6], [-33, 6.9, 91.6], [-39, 6.4, 87], [-42.5, 5.8, 79],
  [-43, 5.1, 66], [-36, 4.6, 51], [-20, 4.5, 40], [0, 4.5, 33], [24, 4.6, 24], [45, 4.9, 5], [40, 5.6, -15], [21, 7.2, -29.5], [6, 8.5, -38.5], [0, 9, -48], [0, 9, -76], [0, 9, -102],
];
const U_SEC = 1 / DUR, L0 = 890.5;                    // one second of flight in u; the path's length when the moments after the dive were timed
const TREE_Z = [466, 438, 410, 382, 354, 298, 270, 242, 214, 186, 158, 130];
const groundY = (z) => (z > 330 ? 32.25 : z > 205 ? 24.25 : z > 101.3 ? 16.25 : 0);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- the looks
const LOOKS = {
  october: {
    hero: 'october', el: 14, az: -60, sun: '#fff0d8', sunI: 3.1, hemiS: '#8aa9ea', hemiG: '#9a8c7e', hemiI: 1.32,
    sky: { preset: 'day', zenith: '#0f3482', mid: '#1D4FA8', horizon: '#b9cde6', clouds: false, clouds2: { coverage: 0.36, stretch: 1, opacity: 0.7, wind: [-0.014, 0.002] } },
    fog: '#bfd0e6', fogD: 0.0021, leaf: ['#C4381C', '#F5A21E', '#4c1008'], back: '#F5A21E', backK: 1.4, lawn: '#4f7a34',
    fall: { preset: 'leaves', colors: ['#C4381C', '#e06a1c', '#F5A21E'], n: 1 }, beds: ['#F5A21E', '#c8102a', '#d0288a'],
    exposure: 1.0, mist: 1, mistK: 1.9, peakSun: '#fff4e6', portal: '#ffb650',
  },
  golden: {
    hero: 'october', el: 11, az: 60, sun: '#ffd9a6', sunI: 3.0, hemiS: '#8f9fd8', hemiG: '#a08872', hemiI: 1.22,
    sky: { preset: 'goldenHour', zenith: '#143a86', mid: '#3f66ae', horizon: '#ecd2aa', clouds: false, clouds2: { coverage: 0.4, stretch: 1, opacity: 0.75, wind: [-0.014, 0.002] } },
    fog: '#d8cdbd', fogD: 0.0021, leaf: ['#C4381C', '#F5A21E', '#4c1008'], back: '#ffb02a', backK: 1.5, lawn: '#557a30',
    fall: { preset: 'leaves', colors: ['#C4381C', '#e06a1c', '#F5A21E'], n: 1 }, beds: ['#F5A21E', '#c8102a', '#d0288a'],
    exposure: 1.0, mist: 0.8, mistK: 1.7, peakSun: '#ffd2a0', portal: '#ffb650',
  },
  dawn: {
    hero: 'october', el: 2.5, az: -60, sun: '#ffb9a0', sunI: 1.5, hemiS: '#7f9ce6', hemiG: '#6c6a80', hemiI: 1.35,
    sky: { preset: 'dawn', zenith: '#16306e', mid: '#5a6fb0', horizon: '#f2b8a4', clouds: false, clouds2: { coverage: 0.4, stretch: 1, opacity: 0.8, wind: [-0.014, 0.002], lit: '#ffc2b0' } },
    fog: '#b9bcd8', fogD: 0.0022, leaf: ['#b8341c', '#e8921e', '#481008'], back: '#F5A21E', backK: 1.0, lawn: '#46703a',
    fall: { preset: 'leaves', colors: ['#C4381C', '#e06a1c', '#F5A21E'], n: 0.8 }, beds: ['#F5A21E', '#c8102a', '#d0288a'],
    exposure: 1.18, mist: 1.4, mistK: 1.7, peakSun: '#ff9c8c', portal: '#ffb650',
  },
  april: {
    hero: 'april', el: 15, az: -60, sun: '#ffdcae', sunI: 3.3, hemiS: '#a2bff2', hemiG: '#9c9076', hemiI: 1.16,
    sky: { preset: 'day', zenith: '#15429a', mid: '#3f7acb', horizon: '#cfe0f2', clouds: { coverage: 0.3, opacity: 0.8 }, clouds2: { coverage: 0.34, stretch: 1, opacity: 0.6, wind: [-0.014, 0.002] } },
    fog: '#c3d6ec', fogD: 0.0012, leaf: ['#79b030', '#dcee64', '#28581c'], back: '#ecff86', backK: 1.6, lawn: '#4c8a36',
    fall: { preset: 'petals', colors: ['#ffd9e6', '#f6b6cc', '#ffffff'], n: 1.1 }, beds: ['#e0141c', '#ffd019', '#f7f2e6', '#e0141c', '#ffd019', '#ff6fa0'],
    orchard: [['#e58fb2', '#f3c3d4', '#a04a72'], ['#d9cdb4', '#ece2cc', '#b08a94']], cypress: '#2f6446', blossom: true,
    exposure: 1.0, mist: 0.9, mistK: 1.35, peakSun: '#fff4e2', portal: '#ffd27a',
    grade: { saturation: 1.05, contrast: 1.08, tint: '#fff8ee' },
  },
  snow: {
    hero: 'snow', el: 16, az: -60, sun: '#fff0e2', sunI: 1.55, hemiS: '#c9d3e6', hemiG: '#b4b8c6', hemiI: 1.25,
    sky: { preset: 'overcast', zenith: '#9aa5b8', mid: '#bcc5d2', horizon: '#dfe3ea', sunElevation: 16 },
    fog: '#d2d8e2', fogD: 0.0026, leaf: ['#b8301a', '#e08a1e', '#48100a'], back: '#F5A21E', backK: 0.9, lawn: '#56783c',
    fall: { preset: 'snow', colors: null, n: 1 }, beds: ['#F5A21E', '#c8102a', '#d0288a'],
    exposure: 0.96, mist: 1.1, mistK: 1.5, peakSun: '#ffffff', portal: '#ffb650',
  },
  night: {
    hero: 'night', el: 30, az: -60, sun: '#a9bdf0', sunI: 2.7, hemiS: '#5a76cc', hemiG: '#343c5c', hemiI: 2.1,
    sky: { preset: 'night', bodyOverrides: { 0: { elevation: 30, azimuth: -60, size: 2.6, phase: 1 } } },
    fog: '#1a2548', fogD: 0.0016, leaf: ['#9a2c1a', '#c8781e', '#3c0e08'], back: '#8fa8e8', backK: 0.5, lawn: '#56783c',
    fall: { preset: 'snow', colors: null, n: 0.5 }, beds: ['#F5A21E', '#c8102a', '#d0288a'],
    exposure: 1.5, mist: 1.0, mistK: 1.3, peakSun: '#c8d6ff', portal: '#ffb650',
  },
};
function pickLook(ctx, rng) {
  const hour = ctx.vary?.hour || 'any', r = rng();
  if (ctx.vary?.rare) return hour === 'golden' ? 'golden' : 'october';          // the red blizzard needs red trees
  if (hour === 'night') return 'night';
  if (hour === 'dawn') return 'dawn';
  if (hour === 'golden') return 'golden';
  if (r >= 0.55) return 'october';
  if (r >= 0.3) return 'april';
  if (r >= 0.12 || hour === 'day') return 'snow';
  return 'night';
}

// ---------------------------------------------------------------- the garden's stone, lawns and beds (one mesh, the hero's stone shader)
// kinds: 0 ashlar / paving, 4 lawn, 5 carved fish-scale, 6 pierced screen, 7 plaster, 8 creeper wall, 9 flower bed, 10 vault
async function buildGarden(b, o) {
  const { stone, lawnC, bedCols, rng, bedRects, pause } = o;
  const mm = (sx, a, c) => (sx > 0 ? [a, c] : [-c, -a]);
  const upS = (sx, a0, a1, z0, z1, y) => { const [x0, x1] = mm(sx, a0, a1); b.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], 0, 1, 0); };
  const boxS = (sx, a0, a1, y0, y1, z0, z1, skip = 'y') => { const [x0, x1] = mm(sx, a0, a1); b.box(x0, y0, Math.min(z0, z1), x1, y1, Math.max(z0, z1), skip); };
  const cham = (x0, z0, x1, z1, c) => [[x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c], [x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c]];

  // ---- gatehouse hall
  const FY = 32.3;
  for (const sx of [-1, 1]) {
    b.kind = 0; b.setCol(o.pale, 1.3); upS(sx, 5.6, 15.4, 480, 546, FY);
    b.kind = 5; b.setCol(stone, 1.05); boxS(sx, 5, 5.6, 31.4, FY + 0.3, 480, 546); boxS(sx, 5, 13.2, 31.4, 32.95, 479.4, 480);
    const T = (s, y, d) => [sx * (15 + d), y, s], Fn = [-sx, 0, 0];
    b.kind = 0;
    for (const [s0, s1, w, jal] of [[483, 490, 4.6, 0], [490, 518, 16, 1], [518, 532, 8, 0], [532, 546, 8, 0]]) {
      b.setCol(stone, 0.9 + 0.1 * rng());
      if (jal) archPanel(b, T, Fn, { s0, s1, y0: FY, y1: 52.5, cx: 504, w, yBase: 36, ySpring: 43.2, yApex: 47.6, foils: 1, per: 10, depth: 1.4, through: true });
      else archPanel(b, T, Fn, { s0, s1, y0: FY, y1: 52.5, cx: (s0 + s1) / 2, w, yBase: 34.6, ySpring: 43, yApex: 47.6, foils: 7, per: 3, depth: 0.8, back: true, aoIn: 0.55 });
    }
    b.kind = 6; b.setCol(stone, 1.05);
    b.quad([sx * 15.7, 36, 495.5], [sx * 15.7, 36, 512.5], [sx * 15.7, 47.9, 512.5], [sx * 15.7, 47.9, 495.5], -sx, 0, 0);
    b.kind = 0; b.setCol(stone, 1.08); boxS(sx, 14.5, 15.2, 52.5, 53.2, 483, 546, ''); boxS(sx, 14.75, 15.2, 33.9, 34.3, 483, 546, 'y');
    await pause();
  }
  b.kind = 10; b.setCol(stone, 1.0);
  for (let k = 0; k < 14; k++) {
    const a0 = (k / 14) * Math.PI, a1 = ((k + 1) / 14) * Math.PI;
    const x0 = 15 * Math.cos(a0), y0 = 53.2 + 8.3 * Math.sin(a0), x1 = 15 * Math.cos(a1), y1 = 53.2 + 8.3 * Math.sin(a1);
    b.quad([x0, y0, 480], [x1, y1, 480], [x1, y1, 546], [x0, y0, 546], -(x0 + x1) / 2, -4 - (y0 + y1) / 2 + 53.2, 0);
  }
  b.kind = 0; b.setCol(stone, 0.98);
  archPanel(b, (s, y, d) => [s, y, 483 - d], [0, 0, 1], { s0: -15.4, s1: 15.4, y0: FY, y1: 62, cx: 0, w: 18, yBase: FY, ySpring: 46.5, yApex: 56.3, foils: 9, per: 4, depth: 3, through: true, cusp: 0.07 });
  await pause();

  // ---- terraces: kerbs, paving, lawns with their beds
  const kerb = (sx, a, y, z0, z1) => { b.kind = 5; b.setCol(stone, 1.06); boxS(sx, a, a + 1.2, y - 0.7, y + 0.7, z0, z1); };
  const paving = (sx, a0, a1, y, z0, z1) => { b.kind = 0; b.setCol(stone, 1.0); upS(sx, a0, a1, z0, z1, y + 0.25); };
  const lawn = (sx, y, z0, z1, a0, a1, beds = [], bx0 = 19, bx1 = 29) => {
    const ly = y + 0.25;
    b.kind = 4; b.setCol(lawnC, 1);
    if (!beds.length) { upS(sx, a0, a1, z0, z1, ly); return; }
    upS(sx, a0, bx0, z0, z1, ly); upS(sx, bx1, a1, z0, z1, ly);
    let z = z0; for (const [c0, c1] of beds) { upS(sx, bx0, bx1, z, c0, ly); z = c1; } upS(sx, bx0, bx1, z, z1, ly);
    beds.forEach(([c0, c1], i) => {
      const n = 3;
      for (let k = 0; k < n; k++) {
        const col = bedCols[(i + k + (sx > 0 ? 1 : 0)) % bedCols.length], za = c0 + ((c1 - c0) * k) / n, zb = c0 + ((c1 - c0) * (k + 1)) / n;
        b.kind = 9; b.setCol(col, 0.8); upS(sx, bx0, bx1, za, zb, ly);
        const [x0, x1] = mm(sx, bx0, bx1); bedRects.push({ x0: x0 + 0.5, x1: x1 - 0.5, z0: za + (k ? 0 : 0.5), z1: zb - (k === n - 1 ? 0.5 : 0), y: ly, col });
      }
      b.kind = 0; b.setCol(stone, 1.1);
      boxS(sx, bx0 - 0.3, bx0, ly, ly + 0.22, c0 - 0.3, c1 + 0.3); boxS(sx, bx1, bx1 + 0.3, ly, ly + 0.22, c0 - 0.3, c1 + 0.3);
      boxS(sx, bx0, bx1, ly, ly + 0.22, c0 - 0.3, c0); boxS(sx, bx0, bx1, ly, ly + 0.22, c1, c1 + 0.3);
    });
  };
  const edge = (sx, y, z) => {                        // the lip of a terrace: a carved parapet and the plain face below it
    b.kind = 5; b.setCol(stone, 1.04); boxS(sx, 21, 99, y + 0.25, y + 1.15, z, z + 1);
    b.kind = 0; b.setCol(stone, 0.9); const [x0, x1] = mm(sx, 21, 99);
    b.quad([x0, y - 7.75, z], [x1, y - 7.75, z], [x1, y + 0.25, z], [x0, y + 0.25, z], 0, 0, -1, 78, 8);
  };
  for (const sx of [-1, 1]) {
    kerb(sx, 12, 32, 330, 480); paving(sx, 13.2, 17.5, 32, 330, 480);
    lawn(sx, 32, 331, 480, 17.5, 99, [[345, 367], [377, 399], [409, 431], [441, 463]]); edge(sx, 32, 330);
    kerb(sx, 12, 24, 205, 305); paving(sx, 13.2, 17.5, 24, 205, 305);
    lawn(sx, 24, 305, 330, 21, 99); lawn(sx, 24, 206, 305, 17.5, 99, [[210, 226], [234, 250], [258, 274], [282, 298]]); edge(sx, 24, 205);
    b.kind = 4; b.setCol(lawnC, 1); upS(sx, 17.5, 21, 205, 206, 24.25);
    kerb(sx, 12, 16, 151.2, 180); paving(sx, 13.2, 17.5, 16, 151.2, 180);
    b.kind = 5; b.setCol(stone, 1.06); boxS(sx, 12, 31.2, 15.3, 16.7, 150, 151.2); boxS(sx, 30, 31.2, 15.3, 16.7, 101.3, 150);
    lawn(sx, 16, 180, 205, 21, 99);
    lawn(sx, 16, 151.2, 180, 17.5, 99, [[158, 176]], 38, 50);
    lawn(sx, 16, 101.3, 151.2, 31.2, 99, [[108, 124], [130, 146]], 38, 50);
    await pause();
  }
  for (const sx of [-1, 1]) { b.kind = 0; b.setCol(stone, 1.0); upS(sx, 17.5, 21, 330, 331, 32.25); }

  // ---- the two chutes: carved cheeks, flanking stairs, and a throne slab bridging the canal at each head
  const chute = (zh, yT) => {
    const yB = yT - 8, zf = zh - 25, top = (z) => yT + 0.95 - (8 * (zh - z)) / 25;
    for (const sx of [-1, 1]) {
      for (const [a0, a1] of [[12, 13.2], [20, 21]]) {
        const [x0, x1] = mm(sx, a0, a1);
        b.kind = 5; b.setCol(stone, 1.05);
        for (const [x, nx] of [[x0, -1], [x1, 1]]) b.quad([x, yB - 0.7, zf], [x, yB - 0.7, zh], [x, top(zh), zh], [x, top(zf), zf], nx, 0, 0);
        b.quad([x0, top(zh), zh], [x1, top(zh), zh], [x1, top(zf), zf], [x0, top(zf), zf], 0, 1, -0.3);
        b.quad([x0, yB - 0.7, zf], [x1, yB - 0.7, zf], [x1, top(zf), zf], [x0, top(zf), zf], 0, 0, -1);
      }
      for (let k = 0; k < 16; k++) {
        const z0 = zh - ((k + 1) * 25) / 16, z1 = zh - (k * 25) / 16, ty = yT + 0.25 - (k + 1) * 0.5;
        b.kind = 0; b.setCol(stone, 0.95 + 0.09 * (k % 2)); boxS(sx, 13.2, 20, yB + 0.2, ty, z0, z1, 'yxX');
      }
      const [px0, px1] = mm(sx, 13.4, 16.6), pcx = (px0 + px1) / 2;
      b.kind = 0; b.setCol(stone, 1.0); b.prism(cham(px0, zh + 1, px1, zh + 5.4, 0.35), yT + 0.25, yT + 12.3, false, 0.75);
      b.setCol(stone, 1.1);
      b.ring([[0.45, yT + 0.25, 0.7], [0.45, yT + 1.3], [0.2, yT + 1.7], [0, yT + 1.7]], pcx, zh + 3.2, 1.6, 2.2);
      b.ring([[0, yT + 10.9], [0.25, yT + 11.1], [0.25, yT + 11.6], [0.55, yT + 11.9], [0.55, yT + 12.3]], pcx, zh + 3.2, 1.6, 2.2);
    }
    b.kind = 5; b.setCol(stone, 1.02); b.box(-18, yT + 12.3, zh, 18, yT + 13.5, zh + 6.4, '');
    b.kind = 0; b.setCol(stone, 1.1); b.box(-18.4, yT + 13.5, zh - 0.3, 18.4, yT + 13.85, zh + 6.7, '');
    b.setCol(stone, 0.95);
    for (const x of [-11, -7.4, -3.7, 0, 3.7, 7.4, 11]) b.box(x - 0.35, yT + 11.5, zh + 0.4, x + 0.35, yT + 12.3, zh + 6, 'Y');
    b.kind = 6; b.setCol(stone, 1.08);
    for (const z of [zh, zh + 6.4]) for (const nz of [-1, 1]) b.quad([-18, yT + 13.85, z], [18, yT + 13.85, z], [18, yT + 15.3, z], [-18, yT + 15.3, z], 0, 0, nz);
    b.kind = 0; b.setCol(stone, 1.12);
    for (const z of [zh, zh + 6.4]) b.box(-18.2, yT + 15.3, z - 0.18, 18.2, yT + 15.55, z + 0.18, '');
    b.box(-2.4, yT + 13.85, zh + 2.0, 2.4, yT + 14.5, zh + 4.4, 'y'); b.box(-2.4, yT + 14.5, zh + 3.9, 2.4, yT + 17.0, zh + 4.4, 'y');
    b.box(-2.4, yT + 14.5, zh + 2.0, -1.9, yT + 15.3, zh + 3.9, 'y'); b.box(1.9, yT + 14.5, zh + 2.0, 2.4, yT + 15.3, zh + 3.9, 'y');
  };
  chute(330, 32); await pause(); chute(205, 24); await pause();

  // ---- garden walls with blind arcades (creeper over their tops), the far wall, corner kiosks
  const wallRun = (sx, zA, zB, y0, y1) => {
    const n = Math.max(1, Math.round((zA - zB) / 11)), w = (zA - zB) / n;
    const T = (s, y, d) => [sx * (100 + d), y, s], Fn = [-sx, 0, 0];
    for (let i = 0; i < n; i++) {
      const s0 = zB + i * w; b.kind = 8; b.setCol(stone, 0.9 + 0.1 * rng());
      archPanel(b, T, Fn, { s0, s1: s0 + w, y0, y1, cx: s0 + w / 2, w: w * 0.68, yBase: y0 + 1.2, ySpring: y0 + (y1 - y0) * 0.55, yApex: y0 + (y1 - y0) * 0.8, foils: 1, per: 10, depth: 0.9, back: true, aoIn: 0.62 });
      b.kind = 0; b.setCol(stone, 1.02); const [x0, x1] = mm(sx, 99.6, 100.2);
      b.prism([[x0, s0 - 0.6], [x1, s0 - 0.6], [x1, s0 + 0.6], [x0, s0 + 0.6]], y0, y1, false, 0.7);
    }
    b.kind = 0; b.setCol(stone, 1.08); boxS(sx, 99.5, 102, y1, y1 + 0.5, zB, zA, 'y');
    const [x0, x1] = mm(sx, 100, 102); b.setCol(stone, 0.95); b.quad([x0, y1 - 8.5, zB], [x1, y1 - 8.5, zB], [x1, y1 + 0.5, zB], [x0, y1 + 0.5, zB], 0, 0, -1);
  };
  const kiosk = (cx, cy, cz, r = 3.3) => {
    const oct = (rr) => Array.from({ length: 8 }, (_, i) => { const a = ((i + 0.5) * Math.PI) / 4; return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]; });
    b.kind = 0; b.setCol(stone, 1.05); b.prism(oct(r + 0.5), cy, cy + 0.6, true, 0.8);
    for (const p of oct(r * 0.9)) b.box(p[0] - 0.22, cy + 0.6, p[1] - 0.22, p[0] + 0.22, cy + 4.6, p[1] + 0.22, 'yY');
    b.setCol(stone, 1.1); const ev = oct(r + 1.0); b.prism(ev, cy + 4.6, cy + 5.1, true);
    b.setCol(stone, 0.7); for (let i = 0; i < 8; i++) b.tri([cx, cy + 4.6, cz], [ev[i][0], cy + 4.6, ev[i][1]], [ev[(i + 1) % 8][0], cy + 4.6, ev[(i + 1) % 8][1]], 0, -1, 0);
    b.kind = 7; b.setCol(o.pale, 1);
    b.lathe([[r * 0.95, 5.1], [r * 1.0, 5.9], [r * 0.86, 7.0], [r * 0.55, 7.9], [r * 0.2, 8.4], [0.12, 8.7]], cx, cy, cz, 10);
    o.finials.push([cx, cy + 8.6, cz]);
  };
  for (const sx of [-1, 1]) {
    wallRun(sx, 480, 330, 32.25, 54); await pause(); wallRun(sx, 330, 205, 24.25, 46); await pause();
    wallRun(sx, 205, 100.6, 16.25, 38); await pause(); wallRun(sx, 100.6, -156, -0.4, 22); await pause();
    kiosk(sx * 101, 54.5, 477); kiosk(sx * 101, 54.5, 333.5); kiosk(sx * 101, 46.5, 208.5); kiosk(sx * 101, 38.5, 104); kiosk(sx * 101, 22.5, -155);
  }
  for (const sx of [-1, 1]) {
    const T = (s, y, d) => [sx * s, y, 480 + d], n = 8, w = 84.6 / n;
    for (let i = 0; i < n; i++) {
      const s0 = 15.4 + i * w; b.kind = 8; b.setCol(stone, 0.9 + 0.1 * rng());
      archPanel(b, T, [0, 0, -1], { s0, s1: s0 + w, y0: 32.25, y1: 54, cx: s0 + w / 2, w: w * 0.68, yBase: 33.45, ySpring: 44.2, yApex: 49.6, foils: 1, per: 10, depth: 0.9, back: true, aoIn: 0.62 });
    }
    const [x0, x1] = mm(sx, 15.4, 102);
    b.kind = 0; b.setCol(stone, 0.92); b.quad([x0, 18, 482.2], [x1, 18, 482.2], [x1, 54.5, 482.2], [x0, 54.5, 482.2], 0, 0, 1, 80, 30);
    b.setCol(stone, 1.08); b.box(x0, 54, 479.5, x1, 54.5, 482.4, 'y');
    await pause();
  }
  {
    const T = (s, y, d) => [s, y, -156 - d], n = 18, w = 200 / n;
    for (let i = 0; i < n; i++) {
      const s0 = -100 + i * w; b.kind = 8; b.setCol(stone, 0.9 + 0.1 * rng());
      archPanel(b, T, [0, 0, 1], { s0, s1: s0 + w, y0: -0.4, y1: 22, cx: s0 + w / 2, w: w * 0.68, yBase: 0.8, ySpring: 12, yApex: 17.6, foils: 1, per: 10, depth: 0.9, back: true, aoIn: 0.62 });
      b.kind = 0; b.setCol(stone, 1.02); b.prism([[s0 - 0.6, -156.2], [s0 + 0.6, -156.2], [s0 + 0.6, -155.6], [s0 - 0.6, -155.6]], -0.4, 22, false, 0.7);
    }
    b.kind = 0; b.setCol(stone, 1.08); b.box(-102, 22, -158, 102, 22.5, -155.5, 'y');
  }
}

// ---------------------------------------------------------------- props (kind 11 painted, 12 carpet) and brass (metal builder g)
function buildProps(b, g, o) {
  const C = (h) => new THREE.Color(h);
  const disc = (x, cy, cz, r, col) => { b.setCol(col, 1); for (let i = 0; i < 10; i++) { const a0 = (i / 10) * 6.2832, a1 = ((i + 1) / 10) * 6.2832; for (const nx of [-1, 1]) b.tri([x + nx * 0.12, cy, cz], [x + nx * 0.12, cy + Math.sin(a0) * r, cz + Math.cos(a0) * r], [x + nx * 0.12, cy + Math.sin(a1) * r, cz + Math.cos(a1) * r], nx, 0, 0); } };
  b.kind = 11;
  // barrow of leaves with a rake across it; the smouldering heap beside it
  const [bx, by, bz] = o.barrow, wood = C('#7a5632'), leafA = C(o.leafCols[0]), leafB = C(o.leafCols[1]);
  b.setCol(wood, 1); b.box(bx - 1.4, by + 0.9, bz - 2.2, bx + 1.4, by + 1.1, bz + 2.2, '');
  for (const sx of [-1, 1]) { b.box(bx + sx * 1.4 - 0.1, by + 0.9, bz - 2.2, bx + sx * 1.4 + 0.1, by + 2.0, bz + 2.2, 'y'); b.box(bx + sx * 1.15 - 0.09, by + 1.25, bz + 2.2, bx + sx * 1.15 + 0.09, by + 1.45, bz + 4.9, ''); b.box(bx + sx * 1.1 - 0.1, by, bz + 1.6, bx + sx * 1.1 + 0.1, by + 0.9, bz + 1.85, 'yY'); }
  b.box(bx - 1.4, by + 0.9, bz - 2.3, bx + 1.4, by + 2.0, bz - 2.1, 'y'); b.box(bx - 1.4, by + 0.9, bz + 2.1, bx + 1.4, by + 2.0, bz + 2.3, 'y');
  disc(bx - 1.75, by + 0.95, bz - 1.2, 0.95, C('#3a2a1c')); disc(bx + 1.75, by + 0.95, bz - 1.2, 0.95, C('#3a2a1c'));
  b.kind = o.heapKind;
  b.setCol(leafA, 0.9); b.lathe([[1.5, 1.9], [1.25, 2.45], [0.7, 2.95], [0.0, 3.1]], bx, by, bz, 9);
  b.setCol(leafB, 0.9); b.lathe([[0.75, 2.5], [0.5, 2.95], [0.0, 3.2]], bx + 0.5, by, bz - 0.7, 7);
  b.kind = 11;
  b.setCol(C('#b89a6a'), 1); b.box(bx - 3.6, by + 2.72, bz + 0.5, bx + 3.4, by + 2.9, bz + 0.68, '');
  b.setCol(C('#4a3a2a'), 1); b.box(bx + 3.3, by + 2.25, bz - 0.5, bx + 3.5, by + 2.95, bz + 1.7, '');
  for (let i = 0; i < 9; i++) b.box(bx + 3.32, by + 1.55, bz - 0.42 + i * 0.26, bx + 3.48, by + 2.25, bz - 0.32 + i * 0.26, 'Y');
  const [hx, hy, hz] = o.heap;
  b.kind = o.heapKind;
  b.setCol(leafA, 0.55); b.lathe([[3.0, 0, 0.6], [2.5, 0.7], [1.5, 1.35], [0.5, 1.7], [0.0, 1.75]], hx, hy, hz, 11);
  b.kind = 11;
  b.setCol(C('#2a2420'), 1); b.lathe([[0.9, 1.52], [0.5, 1.74], [0.0, 1.82]], hx + 0.2, hy, hz, 7);
  // the pavilion: carpet, cushions, cups, slippers on the step; tubs for the orange trees
  const [cx, cy, cz] = o.carpet;
  b.kind = 12; b.setCol(C('#ffffff'), 1); b.quad([cx - 8, cy + 0.04, cz - 5], [cx + 8, cy + 0.04, cz - 5], [cx + 8, cy + 0.04, cz + 5], [cx - 8, cy + 0.04, cz + 5], 0, 1, 0, 16, 10);
  b.kind = 11;
  const cush = [[-6.3, -3.3, '#1D4FA8', 1.0], [-6.7, -0.4, '#C4381C', 1.15], [-6.2, 2.6, '#F5A21E', 0.95], [6.4, -2.2, '#C4381C', 1.05], [6.6, 1.4, '#1D4FA8', 1.1], [-3.8, 3.9, '#7a1a5a', 0.9]];
  for (const [dx, dz, col, s] of cush) {
    b.setCol(C(col), 0.8); b.lathe([[0.0, 0.0, 0.5], [0.72 * s, 0.05, 0.6], [0.98 * s, 0.3 * s], [0.72 * s, 0.58 * s], [0.0, 0.64 * s]], cx + dx, cy + 0.04, cz + dz, 9);
    b.setCol(C('#e8c24a'), 1); b.lathe([[0.0, 0.62 * s], [0.14, 0.66 * s], [0.0, 0.74 * s]], cx + dx, cy + 0.04, cz + dz, 5);
  }
  const [tx, tz] = [cx + 4.7, cz - 0.6];
  b.setCol(C('#e9edf4'), 1); for (const [dx, dz] of [[-1.0, 0.7], [-0.6, -1.0], [0.9, 1.0]]) b.lathe([[0.1, 0.12], [0.2, 0.14], [0.26, 0.42], [0.23, 0.42], [0.17, 0.18]], tx + dx, cy + 0.04, tz + dz, 7);
  for (const dx of [0.9, 1.6]) { b.setCol(C('#b01a22'), 1); b.box(dx, 1.25, -51.9, dx + 0.36, 1.42, -51.0, 'y'); b.setCol(C('#e8c24a'), 1); b.box(dx + 0.05, 1.42, -51.25, dx + 0.31, 1.56, -51.0, 'y'); }
  for (const t of o.tubs) {
    const oct = (r) => Array.from({ length: 8 }, (_, i) => { const a = ((i + 0.5) * Math.PI) / 4; return [t[0] + Math.cos(a) * r, t[2] + Math.sin(a) * r]; });
    b.kind = 5; b.setCol(o.stone, 1.1); b.prism(oct(1.5), t[1], t[1] + 1.3, false, 0.75);
    b.kind = 0; b.setCol(o.stone, 1.2); b.prism(oct(1.7), t[1] + 1.3, t[1] + 1.55, true);
    b.kind = 11; b.setCol(C('#2a2018'), 1); b.prism(oct(1.35), t[1] + 1.55, t[1] + 1.6, true);
  }
  // brass: the samovar on its tray, gilt finials on the kiosks
  g.kind = 0; g.setCol(C(PAL[1]).lerp(C('#7a5216'), 0.42), 1);
  g.lathe([[0.0, 0.04], [1.7, 0.04], [1.85, 0.2], [1.75, 0.2], [1.6, 0.1], [0.0, 0.1]], tx, cy + 0.04, tz, 14);
  g.lathe([[0.5, 0.1], [0.62, 0.2], [0.3, 0.34], [0.25, 0.6], [0.75, 0.86], [0.96, 1.36], [0.9, 1.86], [0.6, 2.14], [0.3, 2.24], [0.37, 2.4], [0.2, 2.54], [0.3, 2.7], [0.1, 2.86], [0.0, 2.9]], tx, cy + 0.04, tz, 12);
  for (const sx of [-1, 1]) g.box(tx + sx * 0.95 - 0.07, cy + 1.3, tz - 0.1, tx + sx * 1.3, cy + 1.9, tz + 0.1, '');
  g.box(tx - 0.06, cy + 0.75, tz + 0.7, tx + 0.06, cy + 0.9, tz + 1.25, '');
  g.kind = 1; g.setCol(C(PAL[1]).lerp(C('#8a5a12'), 0.35), 1);
  const fin = [[0.95, 0], [1.15, 0.25], [0.6, 0.5], [0.38, 0.75], [0.7, 1.0], [1.0, 1.3], [0.95, 1.6], [0.5, 1.9], [0.25, 2.1], [0.55, 2.4], [0.5, 2.6], [0.14, 2.9], [0.07, 3.6], [0.0, 3.9]];
  for (const f of o.finials) g.lathe(fin.map((q) => [q[0] * 0.5, q[1] * 0.5]), f[0], f[1], f[2], 6);
}

// a mallard (or a ruddy shelduck): body, breast, neck, head and bill as lathes; nose toward +Z
function duckGeometry(shelduck) {
  const b = makeB(), C = (h) => new THREE.Color(h);
  b.kind = 11;
  b.setCol(C(shelduck ? '#c8742a' : '#8d7c68'), 1); b.lathe([[0.0, -0.08], [0.42, 0.0], [0.6, 0.2], [0.55, 0.42], [0.3, 0.56], [0.0, 0.6]], 0, 0, 0, 9);
  b.setCol(C(shelduck ? '#b8641e' : '#5a2f22'), 1); b.lathe([[0.0, 0.05], [0.3, 0.1], [0.36, 0.3], [0.24, 0.5], [0.0, 0.56]], 0, 0, 0.42, 8);
  b.setCol(C(shelduck ? '#e2c89c' : '#f2f2ee'), 1); b.lathe([[0.15, 0.45], [0.14, 0.72]], 0, 0, 0.55, 7);
  b.setCol(C(shelduck ? '#ecd9b4' : '#0f5a3a'), 1); b.lathe([[0.0, 0.66], [0.17, 0.72], [0.21, 0.86], [0.15, 1.0], [0.0, 1.04]], 0, 0, 0.6, 8);
  b.setCol(C(shelduck ? '#2a2420' : '#e8c22a'), 1); b.box(-0.08, 0.78, 0.76, 0.08, 0.86, 1.06, '');
  b.setCol(C(shelduck ? '#2a2420' : '#3a342e'), 1); b.tri([0, 0.62, -0.45], [-0.2, 0.36, -0.5], [0.2, 0.36, -0.5], 0, 0.3, -1); b.tri([0, 0.62, -0.45], [0, 0.34, -0.9], [-0.2, 0.36, -0.5], -1, 0.5, 0); b.tri([0, 0.62, -0.45], [0, 0.34, -0.9], [0.2, 0.36, -0.5], 1, 0.5, 0);
  return b.geometry();
}

// the kingfisher: an egg of a body with a big head, a long dagger of a bill and a stub of a tail; nose toward +Z, back up.
// Electric blue above with a pale streak down the back, orange below, a white throat. Its wings are drawn apart, as a blur.
function kingfisherGeometry() {
  const b = makeB(), C = (h) => new THREE.Color(h); b.kind = 11; b.setCol(C('#ffffff'), 1);
  // built with its length along +Y (the lathe's axis) and its back toward -Z, then laid down
  b.lathe([[0, -0.5], [0.07, -0.47], [0.17, -0.31], [0.25, -0.06], [0.27, 0.14], [0.23, 0.33], [0.14, 0.45], [0, 0.5]], 0, 0, 0, 10);
  b.lathe([[0, 0.28], [0.14, 0.32], [0.215, 0.44], [0.215, 0.55], [0.14, 0.67], [0, 0.71]], 0, 0, -0.07, 9);
  const soft = b.n;
  const bill = (zs, col) => { b.setCol(C(col), 1); const a = [-0.055, 0.66, -0.05 + zs * 0.05], c = [0.055, 0.66, -0.05 + zs * 0.05], m = [0, 0.66, -0.05], tip = [0, 1.36, 0.05]; b.tri(a, c, tip, 0, 0, zs); b.tri(a, m, tip, -1, 0, 0); b.tri(c, m, tip, 1, 0, 0); };
  bill(-1, '#1a1d24'); bill(1, '#a8452a');
  b.setCol(C('#0f58c8'), 1);
  for (const zs of [-1, 1]) b.quad([-0.07, -0.42, -0.03 + zs * 0.012], [0.07, -0.42, -0.03 + zs * 0.012], [0.13, -0.76, -0.02], [-0.13, -0.76, -0.02], 0, 0, zs);
  const g = b.geometry(); g.rotateX(Math.PI / 2);
  const P = g.attributes.position.array, K = g.attributes.color.array;
  const blue = C('#1479e8'), cyan = C('#52d8ff'), orange = C('#f07a1e'), white = C('#f1ede2'), c = new THREE.Color();
  for (let i = 0; i < soft; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], head = z > 0.47;
    const top = sstep(-0.05, 0.07, y - (z > 0.4 ? 0.05 : 0));
    c.copy(orange).lerp(blue, top);
    if (y > 0.12 && Math.abs(x) < 0.09 && z < 0.4) c.lerp(cyan, 0.85);                 // the streak of pale fire down the back
    if (y < 0.02 && z > 0.3 && z < 0.66) c.lerp(white, 0.9);                            // the throat
    if (head && y > 0.02 && y < 0.1 && z > 0.5) c.lerp(orange, 0.8);                    // the cheek
    K[i * 3] = c.r; K[i * 3 + 1] = c.g; K[i * 3 + 2] = c.b;
  }
  return g;
}

// ---------------------------------------------------------------- the two chutes: racing water over fish-scale scallops
const FOG_V = '#include <fog_pars_vertex>', FOG_F = '#include <fog_pars_fragment>';
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
// The carving: rows of round-edged shells, each row half a shell out of step with the last and lapped over the one
// below like roof tiles (mahi-pusht). xs = (x, metres down the slope). Returns (height 0..1, the lip the water
// breaks over, the pocket under it where it gathers, a number for the shell).
const CH_GLSL = /* glsl */`
vec4 chScale(vec2 xs){
  vec2 q = vec2(xs.x / 3., xs.y / 2.1);
  float row = floor(q.y); q.x += .5 * mod(row, 2.);
  vec2 f = vec2(fract(q.x) - .5, fract(q.y));
  float r1 = length(vec2(f.x, f.y * .92));                                    // this row's shell, rooted on its upstream edge
  float r2 = length(vec2(abs(f.x) - .5, (f.y - 1.) * .92));                   // the next row's, showing from under its lip
  float dome1 = sqrt(max(1. - r1 * r1 * 2.3, 0.)), dome2 = sqrt(max(1. - r2 * r2 * 2.3, 0.));
  float over = smoothstep(.57, .64, r1);
  float h = mix(.3 + .25 * dome1 + .45 * f.y, .3 + .25 * dome2 + .45 * (f.y - 1.), over);     // each shell thickens toward its lip, then drops to the next
  float lip = smoothstep(.46, .6, r1) * (1. - smoothstep(.62, .84, r1));
  float pocket = over * (1. - smoothstep(.66, 1.02, r1));
  return vec4(h, lip, pocket, floor(q.x) * 7. + row * 13.);
}`;
function makeChutes(U) {
  const pos = [], ck = [], idx = [], NX = 48, NS = 60, LEN = 25.9;
  for (const [zh, yT] of [[330, 32], [205, 24]]) {
    const base = pos.length / 3;
    for (let j = 0; j <= NS; j++) {
      const s = (j / NS) * LEN, z = zh + 0.3 - s, y = yT - 8 * Math.min(1, Math.max(0, (zh - z) / 25)) - (j === NS ? 0.12 : 0);
      for (let i = 0; i <= NX; i++) { pos.push(-12 + (24 * i) / NX, y, z); ck.push(s, j < 2 || j > NS - 2 || i === 0 || i === NX ? 0 : 1); }
    }
    for (let j = 0; j < NS; j++) for (let i = 0; i < NX; i++) { const a = base + j * (NX + 1) + i, c = a + NX + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('ck', new THREE.Float32BufferAttribute(ck, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      attribute vec2 ck; varying vec3 vP; varying vec2 vCk;
      ${FOG_V}
      ${CH_GLSL}
      void main(){
        vCk = vec2(position.x, ck.x);
        vec3 p = position + vec3(0., .952, -.305) * (chScale(vCk).x - .45) * .4 * ck.y;      // real relief: the shells stand out of the slope
        vP = p; vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying vec2 vCk;
      ${FOG_F}
      ${HC_PARS}
      ${CH_GLSL}
      void main(){
        float t = uHcTime, s = vCk.y;
        vec4 sc = chScale(vCk);
        float hx = chScale(vCk + vec2(.09, 0.)).x - chScale(vCk - vec2(.09, 0.)).x;
        float hs = chScale(vCk + vec2(0., .09)).x - chScale(vCk - vec2(0., .09)).x;
        // the slope's own frame: across (1,0,0), downhill (0,-.305,-.952), out of the stone (0,.952,-.305)
        vec3 n = normalize(vec3(0., .952, -.305) - vec3(1., 0., 0.) * hx * 2.2 - vec3(0., -.305, -.952) * hs * 2.2);
        float head = smoothstep(.3, 2.6, s), foot = smoothstep(21.5, 25.7, s);
        // the flow: threads racing downhill at three speeds, a slow surge, white where each lip breaks it
        float st1 = hcN2(vec2(vCk.x * 2.6, s * .35 - t * 4.2));
        float st2 = hcN2(vec2(vCk.x * 7.3 + 3., s * .8 - t * 7.5));
        float st3 = hcN2(vec2(vCk.x * .7, s * .22 - t * 2.6));
        float surge = .5 + .5 * sin(s * .7 - t * 4.5 + st3 * 5. + sc.w);
        float thread = smoothstep(.66, .8, st1 * .55 + st2 * .45) * (1. - sc.z * .7);
        float crest = sc.y * (.5 + .5 * st2) * (.65 + .35 * surge);
        float tail = sc.z * smoothstep(.45, .8, st2 * .6 + st1 * .4) * .5;
        float foam = clamp((crest * 1.3 + tail * .8 + thread * .5) * head + foot * (.5 + .5 * st1) - (1. - head) * .1, 0., 1.);
        // thin water over wet rose-grey stone, teal where it gathers under a lip
        vec3 stone = vec3(.17, .14, .13) * (.75 + .5 * hcN2(vCk * vec2(2.3, 2.9)) ) * (.6 + .6 * sc.x);
        vec3 teal = uHcWater * 3.6 * vec3(.7, 1.15, 1.1);
        vec3 alb = mix(mix(stone, teal, .45), teal, sc.z * .9);
        float gl = hcGarden(vec3(vP.x, hcGround(vP.z) + .4, vP.z));
        float nl = max(dot(n, uHcSun), 0.);
        vec3 sky = mix(uHcSkyHor, uHcSkyTop, .45);
        vec3 light = uHcSunCol * nl * gl * 1.5 + sky * (.34 + .3 * n.y);
        vec3 V = normalize(uHcCam - vP + vec3(0., 1e-4, 0.));
        vec3 R = reflect(-V, n); R.y = abs(R.y);
        float fr = 1. - max(dot(n, V), 0.); fr *= fr; fr *= fr;
        float glint = max(dot(normalize(R + vec3(0., 1e-4, 0.)), uHcSun), 0.); glint *= glint; glint *= glint; glint *= glint; glint *= glint;
        vec3 col = alb * light + mix(uHcSkyHor, uHcSkyTop, clamp(R.y * 1.6, 0., 1.)) * (.035 + .24 * fr) * mix(.6, 1., gl) + uHcSunCol * glint * glint * .9 * gl;
        vec3 white = (uHcSkyHor * .5 + uHcSunCol * .3) * mix(vec3(.5, .6, .86), vec3(1.), gl) * (.8 + .25 * st2);
        col = mix(col, white, foam);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}

// the rare event's red blizzard: leaves torn from one chinar, streaming across the tank at jet height, settling on the water
function makeBlizzard(U, n, origin, rng, cols) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const a = new Float32Array(n * 4); for (let i = 0; i < a.length; i++) a[i] = rng();
  g.setAttribute('iS', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
  const uniforms = { ...fogU(), ...U, uRare: { value: 0 }, uOrigin: { value: origin.clone() }, uColA: { value: new THREE.Color(cols[0]) }, uColB: { value: new THREE.Color(cols[1]) } };
  const m = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms,
    vertexShader: /* glsl */`
      attribute vec4 iS; uniform float uHcTime, uRare; uniform vec3 uOrigin, uHcCam, uHcSun; varying vec3 vC; varying vec2 vQ;
      ${FOG_V}
      void main(){
        float k = clamp((uRare - .3 * pow(iS.x, 1.6)) / .5, 0., 1.);                 // most of the crown goes in the first second
        vec3 start = uOrigin + vec3((iS.y - .5) * 26., 6. + iS.z * 22., (iS.w - .5) * 26.);
        float reach = 110. + 95. * fract(iS.y * 7.3);
        float yEnd = mix(2.5, 11., fract(iS.z * 5.7)) * (1. - smoothstep(.72, 1., k)) + .16;
        vec3 c = start + vec3(reach * k, 0., (fract(iS.w * 3.1) - .6) * 150. * k);
        c.y = mix(start.y, yEnd, smoothstep(0., .4, k)) + sin(k * 30. + iS.x * 40.) * 1.2 * (1. - k) * smoothstep(0., .1, k);
        float spin = 1. - smoothstep(.9, 1., k);
        float ang = uHcTime * (3. + 4. * iS.y) * spin + iS.x * 50.;
        vec3 ax1 = normalize(vec3(cos(ang), sin(ang * .7) * spin, sin(ang)));
        vec3 ax2 = normalize(cross(ax1, vec3(.31, 1., .17)) + vec3(1e-3, 0., 0.));
        float dc = distance(c, uHcCam);
        float sz = (.3 + .26 * iS.z) * smoothstep(0., .03, k) * smoothstep(1.2, 4., dc) * mix(.42, 1., smoothstep(3., 16., dc)) * min(1. + dc / 50., 3.6);   // far off each card stands for a handful of leaves
        vec3 p = c + (ax1 * position.x * .7 + ax2 * position.y) * sz;
        vec3 nn = cross(ax1, ax2);
        float lit = .45 + .5 * abs(dot(nn, uHcSun)) + .35 * max(dot(normalize(c - uHcCam + vec3(0., 1e-4, 0.)), uHcSun), 0.);
        vC = vec3(lit, fract(iS.x * 11.7), 0.); vQ = position.xy;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; varying vec2 vQ; uniform vec3 uColA, uColB, uHcSunCol;
      ${FOG_F}
      void main(){
        vec2 lq = vec2(vQ.x + 1e-5, vQ.y + .3); float lr = length(lq), la = atan(lq.x, lq.y);          // a chinar leaf: a broad hand with five short points and a stalk
        float lobe = .56 + .5 * pow(abs(cos(la * 1.5)), 1.15) * (.42 + .58 * smoothstep(-1., .6, cos(la)));   // one long point and two short shoulders: a leaf, not a star
        if (lr > lobe && !(abs(vQ.x) < .05 && vQ.y < -.3)) discard;
        float vein = 1. - .3 * (1. - smoothstep(0., .07, abs(sin(la * 1.5)) * lr));
        vec3 col = mix(uColA, uColB, smoothstep(.45, .95, vC.y + .25 * (lr - .5))) * vC.x * vein * (.35 + uHcSunCol * .55);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.visible = false;
  return { mesh, uniforms };
}

// ---------------------------------------------------------------- chinar crowns and bark, leaf litter
// The kit's crowns are made for a 12 m tree; at 45 m each leaf card is a sail. Here every card becomes five smaller
// ones, pushed in and out of the crown's surface and turned at their own angles, so a crown is a mass with depth and
// dark gaps (the material below then repeats the leaf cluster three times across each card: small hand-shaped leaves).
function refineCrown(geo, rng) {
  const A = geo.attributes, n = A.position.count, uv = A.uv.array, cards = [];
  for (let i = 0; i + 3 < n;) { if (uv[i * 2] < 0.25 && uv[i * 2 + 1] < 0.5 && uv[i * 2 + 6] < 0.25) { cards.push(i); i += 4; } else i++; }
  const SUB = [[0, 0], [-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]], out = {};
  for (const k in A) { const a = new Float32Array((n + cards.length * 16) * A[k].itemSize); a.set(A[k].array); out[k] = a; }
  const idx = Array.from(geo.index.array), P = out.position, C = out.color, c = [0, 0, 0], U = [0, 0, 0], V = [0, 0, 0], N = [0, 0, 0];
  let w = n;
  for (const i of cards) {
    for (let k = 0; k < 3; k++) { const a = P[i * 3 + k], b = P[i * 3 + 3 + k], d = P[i * 3 + 9 + k]; c[k] = (a + b + P[i * 3 + 6 + k] + d) / 4; U[k] = (d - a) / 2; V[k] = (b - a) / 2; }
    N[0] = U[1] * V[2] - U[2] * V[1]; N[1] = U[2] * V[0] - U[0] * V[2]; N[2] = U[0] * V[1] - U[1] * V[0];
    const s = Math.hypot(U[0], U[1], U[2]), nl = Math.hypot(N[0], N[1], N[2]) || 1;
    for (let j = SUB.length - 1; j >= 0; j--) {                    // the card itself is reshaped last: the copies read its attributes
      let b = i;
      if (j > 0) { b = w; w += 4; for (const k in out) { const sz = A[k].itemSize; out[k].copyWithin(b * sz, i * sz, (i + 4) * sz); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const ou = SUB[j][0] + rng.range(-0.2, 0.2), ov = SUB[j][1] + rng.range(-0.2, 0.2), on = (j ? rng.range(-0.5, 0.3) : rng.range(-0.75, -0.25)) * s;
      const phi = rng.range(-0.8, 0.8), th = rng.range(-0.7, 0.7), k = 0.5 * rng.range(0.85, 1.2), br = (0.8 + 0.4 * rng()) * (1 + 0.3 * on / s);
      const cp = Math.cos(phi) * k, sp = Math.sin(phi) * k, ct = Math.cos(th), st = Math.sin(th) * s * k / nl;
      for (let q = 0; q < 3; q++) {
        const u2 = (U[q] * cp + V[q] * sp) * ct + N[q] * st, v1 = V[q] * cp - U[q] * sp, cj = c[q] + U[q] * ou + V[q] * ov + (N[q] / nl) * on;
        P[b * 3 + q] = cj - u2 - v1; P[b * 3 + 3 + q] = cj - u2 + v1; P[b * 3 + 6 + q] = cj + u2 + v1; P[b * 3 + 9 + q] = cj + u2 - v1;
      }
      for (let q = 0; q < 12; q++) C[b * 3 + q] *= br;
    }
  }
  const g = new THREE.BufferGeometry();
  for (const k in out) g.setAttribute(k, new THREE.Float32BufferAttribute(out[k], A[k].itemSize));
  g.setIndex(idx); g.userData = { ...geo.userData }; g.computeBoundingSphere();
  return g;
}
// The kit's leaf-and-bark material, with two things of the chinar's own: the leaf cluster tiled three times across
// each card, and bark that is pale cream under flaking plates of olive-grey and tan.
function chinarize(mat) {
  const base = mat.onBeforeCompile, key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : 'flora';
  mat.onBeforeCompile = (sh, r) => {
    base(sh, r);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_fragment>', /* glsl */`
        #ifdef USE_MAP
          float cwLeaf = step(vMapUv.x, .25) * step(vMapUv.y, .5);
          vec2 cwQ = (vMapUv - vec2(.003, .006)) / vec2(.244, .488) * 3.;
          vec2 cwF = fract(cwQ); cwF.x = mix(cwF.x, 1. - cwF.x, step(.5, fract((floor(cwQ.x) + floor(cwQ.y)) * .5)));
          vec2 cwUv = mix(vMapUv, vec2(.003, .006) + clamp(cwF, 0., 1.) * vec2(.244, .488), cwLeaf);
          float cwG = mix(1., 3., cwLeaf);
          vec4 sampledDiffuseColor = textureGrad(map, cwUv, dFdx(vMapUv) * cwG, dFdy(vMapUv) * cwG);
          diffuseColor *= sampledDiffuseColor;
          // the width of the alpha edge, taken HERE, before the core is cut below: a derivative taken after a discard is not defined
          // (the rim of every cut came out different on each draw); the alpha test further down uses this width
          float cwEdge = fwidth(diffuseColor.a);
          // the crown's inner mass (solid cell, leaf-flagged): cut into leaf-sized scraps and sunk into shadow, so that
          // looking up into a crown shows dark limbs and layered leaves, never a smooth ball
          float cwCore = step(.5, vFlora.x) * step(.6, vMapUv.x);
          if (cwCore > .5) {
            float cwA = floraNoise(vFloraPos * .85), cwB2 = floraNoise(vFloraPos * 2.4 + 5.);
            if (cwA * .55 + cwB2 * .45 < .47) discard;
            diffuseColor.rgb *= .16 + .34 * cwB2;
          }
        #endif`)
      // three's own alpha test, line for line, but with the edge width taken above the cut
      .replace('#include <alphatest_fragment>', /* glsl */`
        #ifdef USE_ALPHATEST
          #ifdef ALPHA_TO_COVERAGE
            #ifdef USE_MAP
              diffuseColor.a = smoothstep(alphaTest, alphaTest + cwEdge, diffuseColor.a);
            #else
              diffuseColor.a = smoothstep(alphaTest, alphaTest + fwidth(diffuseColor.a), diffuseColor.a);
            #endif
            if (diffuseColor.a == 0.0) discard;
          #else
            if (diffuseColor.a < alphaTest) discard;
          #endif
        #endif`)
      .replace('#include <normal_fragment_begin>', /* glsl */`
        if (fLeaf < .5) {
          vec3 cwB = vFloraPos;
          float cb1 = floraNoise(cwB * vec3(.5, .26, .5) + 3.), cb2 = floraNoise(cwB * vec3(1.2, .55, 1.2) + 11.), cb3 = floraNoise(cwB * vec3(3.1, 1.4, 3.1));
          float cwFlake = smoothstep(.47, .6, cb1 * .6 + cb2 * .4 + (cb3 - .5) * .14);
          float cwTan = smoothstep(.52, .62, cb2 * .7 + cb3 * .3) * (1. - cwFlake);
          vec3 cwC = diffuseColor.rgb * (.82 + .22 * cb3);
          cwC = mix(cwC * vec3(1.03, 1., .92), cwC * vec3(.74, .76, .62), cwFlake);          // cream under soft olive flakes
          diffuseColor.rgb = mix(cwC, cwC * vec3(.9, .78, .62), cwTan * .8);                 // and tan ones
        }
        #include <normal_fragment_begin>`);
  };
  mat.customProgramCacheKey = () => key + '-chinar2';
  return mat;
}
// fallen leaves lying on the lawns and paving: each a small card hinged on its stalk and lifted a little, so the
// ground has relief where the camera skims it; a third of them stir. items: 8 floats per leaf (x, y, z, size, yaw, tilt, seed, hue)
function makeLitter(U, items, cols) {
  const n = items.length / 8, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { iP.set(items.slice(i * 8, i * 8 + 4), i * 4); iQ.set(items.slice(i * 8 + 4, i * 8 + 8), i * 4); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U, uColA: { value: new THREE.Color(cols[0]) }, uColB: { value: new THREE.Color(cols[1]) } },
    vertexShader: /* glsl */`
      attribute vec4 iP, iQ; uniform float uHcTime; varying vec2 vQ; varying vec3 vP; varying vec2 vK;
      ${FOG_V}
      void main(){
        float tilt = iQ.y + sin(uHcTime * (1.4 + iQ.z * 2.) + iQ.z * 40.) * .16 * step(.66, iQ.z);
        vec3 ax = vec3(cos(iQ.x), 0., sin(iQ.x)), az = vec3(-ax.z, 0., ax.x);
        vec3 l = ax * cos(tilt) + vec3(0., sin(tilt), 0.);
        vec3 p = iP.xyz + (l * (position.y + 1.) + az * position.x * .78) * iP.w + vec3(0., abs(position.x) * .22 * iP.w + .03, 0.);
        vQ = position.xy; vP = p; vK = vec2(iQ.w, .7 + .5 * sin(tilt));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vP; varying vec2 vK; uniform vec3 uColA, uColB;
      ${FOG_F}
      ${HC_PARS}
      void main(){
        vec2 lq = vec2(vQ.x + 1e-5, vQ.y + .3); float lr = length(lq), la = atan(lq.x, lq.y);
        float lobe = .56 + .5 * pow(abs(cos(la * 1.5)), 1.15) * (.42 + .58 * smoothstep(-1., .6, cos(la)));   // one long point and two short shoulders: a leaf, not a star
        if (lr > lobe && !(abs(vQ.x) < .05 && vQ.y < -.3)) discard;
        float vein = 1. - .3 * (1. - smoothstep(0., .07, abs(sin(la * 1.5)) * lr));
        vec3 alb = mix(uColA, uColB, smoothstep(.35, .95, vK.x + .3 * (lr - .5))) * (.55 + .6 * fract(vK.x * 7.3)) * vein;
        float lit = hcGarden(vP + vec3(0., .2, 0.));
        vec3 col = alb * (uHcSunCol * lit * .62 * vK.y + mix(uHcSkyHor, uHcSkyTop, .4) * .42);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- beyond the walls: the valley side, the lake, the peaks
// The garden steps down a wooded hillside to a lake (as Nishat does to the Dal). Seen from the grand view the walls are
// leading lines through orchards, poplar rows and field strips; the lake lies behind the far wall as a pale mirror with
// the sun's glitter on it, a bank of mist along its far shore, and the snow peaks standing out of the mist.
const HILL = [[-900, -16], [-330, -12], [-192, -3.4], [-150, -0.9], [0, 2.2], [100, 6.5], [205, 14], [330, 22], [480, 29.5], [760, 40]];
const hillY = (z) => { for (let i = 1; i < HILL.length; i++) if (z <= HILL[i][0]) { const a = HILL[i - 1], b = HILL[i], t = Math.max(0, (z - a[0]) / (b[0] - a[0])); return a[1] + (b[1] - a[1]) * t; } return 40; };
const ISLES = [[-335, -650, -335, -650, 62], [296, -575, 296, -575, 44], [430, -1000, 1500, -800, 80]];      // [x0, z0, x1, z1, radius]: Char Chinar, an islet, a long spit
const makeOutY = (noise) => (x, z) => {
  const ax = Math.max(0, Math.abs(x) - 100);
  let y = hillY(z + 0.2 * ax) + 2.6 * noise.fbm2(x * 0.0045 + 3, z * 0.0045, 3) * Math.min(1, ax / 60) + 0.01 * Math.max(0, ax - 250);
  for (const [x0, z0, x1, z1, r] of ISLES) {
    const dx = x1 - x0, dz = z1 - z0, t = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - x0 - dx * t, z - z0 - dz * t) / r;
    if (d < 1) y = Math.max(y, -9.5 + 13 * (1 - d * d) * (0.8 + 0.3 * noise.n2(x * 0.02, z * 0.02)));
  }
  return y;
};
// the ranges as the peaks' shader and the lake's mirror both know them: c = (cos, sin) of the azimuth, so they close on themselves
const PK_GLSL = /* glsl */`
float pkRidge(vec2 c, float f, float sd){
  float n = (1. - abs(2. * hcN2(c * f + sd) - 1.)) * .56;
  n += (1. - abs(2. * hcN2(c * f * 2.37 + sd + 7.3) - 1.)) * .27;
  n += hcN2(c * f * 5.3 + sd + 3.1) * .12 + hcN2(c * f * 11.7 + sd) * .05;
  return n;
}
float pkH(vec2 c, float fl){ return mix(.026, .008, fl * .5) + mix(.08, .036, fl * .5) * pow(pkRidge(c, 5.2 + 3.1 * fl, 13.7 * fl + 2.), 1.35); }`;
const OUT_LOOKS = {
  october: { f: ['#8f7f3c', '#5d7a36', '#6b4a30', '#a08a4a'], hedge: '#3c4a26', shore: '#77705a', round: ['#b8451c', '#dc8a1e', '#8c6a22'], poplar: ['#e3b21e', '#c99a1c'], orch: ['#c8501e', '#d9a02a'], back: '#ffb43a',
    deep: '#2c4a66', shade: '#7d9bd2', rock: '#56698e', glit: 1, cloud: 0.25 },
  april: { f: ['#5c9a38', '#d6c022', '#6e5a3e', '#7fb244'], hedge: '#2f5a2a', shore: '#7c8460', round: ['#5a9a30', '#8cbc44', '#3f8438'], poplar: ['#6fa838', '#5a9432'], orch: ['#f0a8c2', '#f1e8d6'], back: '#eaff8a',
    deep: '#2b5e86', shade: '#7fa2e0', rock: '#4f6fa6', glit: 1, cloud: 0.55 },
  snow: { f: ['#dde3ec', '#cdd5e1', '#b9b2a4', '#e6eaf0'], hedge: '#5a5a5e', shore: '#9aa0a6', round: ['#a8402a', '#c9cfd8', '#7a5a4c'], poplar: ['#8a7a6c', '#b9bcc2'], orch: ['#c8ccd4', '#9a7a6a'], back: '#ffd9b0',
    deep: '#7e8a9c', shade: '#aab5c8', rock: '#8c96a8', glit: 0.35, cloud: 0 },
  night: { f: ['#c9d2e6', '#b4bfd8', '#8a8c9c', '#d5dcec'], hedge: '#3a3e52', shore: '#6a7288', round: ['#6a3026', '#aab4cc', '#4a4250'], poplar: ['#5a5560', '#98a2ba'], orch: ['#a8b0c6', '#6a5a5c'], back: '#8fa8e8',
    deep: '#101c3c', shade: '#4a5c92', rock: '#27304e', glit: 0.8, cloud: 0 },
};
async function makeOutside(o) {
  const { U, L, hero, rng, noise, detail, pause, outY } = o;
  const O = OUT_LOOKS[hero], C = (h) => new THREE.Color(h), group = new THREE.Group();
  const fogC = C(L.fog), snowy = hero === 'snow' || hero === 'night';
  // ---- the ground: two flanks and the strip of shore beyond the far wall
  const pos = [], idx = [];
  const grid = (xs, zs) => {
    const base = pos.length / 3, nx = xs.length, nz = zs.length;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) pos.push(xs[i], Math.abs(xs[i]) < 102.5 && zs[j] > -159 ? Math.min(outY(xs[i], zs[j]), -0.6) : outY(xs[i], zs[j]), zs[j]);
    for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) { const a = base + j * nx + i; idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
  };
  const zs = []; for (let z = 760; z >= -1100; z -= 30) zs.push(z);
  for (const sx of [-1, 1]) { const xs = []; for (let i = 0; i <= 24; i++) xs.push(sx * (102 + 1500 * Math.pow(i / 24, 1.9))); grid(xs, zs); }
  await pause();
  { const xs = [], zz = []; for (let i = 0; i <= 8; i++) xs.push(-102 + 25.5 * i); for (let z = -158; z >= -380; z -= 18.5) zz.push(z); grid(xs, zz); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals();
  const landU = { ...fogU(), ...U, uFa: { value: C(O.f[0]) }, uFb: { value: C(O.f[1]) }, uFc: { value: C(O.f[2]) }, uFd: { value: C(O.f[3]) }, uHedge: { value: C(O.hedge) }, uShore: { value: C(O.shore) }, uCloud: { value: O.cloud } };
  const land = new THREE.Mesh(tg, new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: landU,
    vertexShader: /* glsl */`
      varying vec3 vP; varying vec3 vN;
      ${FOG_V}
      void main(){ vP = position; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying vec3 vN; uniform vec3 uFa, uFb, uFc, uFd, uHedge, uShore; uniform float uCloud;
      ${FOG_F}
      ${HC_PARS}
      void main(){
        vec2 q = vP.xz; float dist = length(uHcCam - vP);
        // field strips lying across the slope, each its own crop; hedges and ditches between them
        vec2 fq = vec2(q.x * .86 + q.y * .5, -q.x * .5 + q.y * .86) / vec2(74., 34.);
        fq.x += .37 * floor(fq.y) + .25 * hcN2(vec2(fq.y * .7, 3.));
        vec2 fi = floor(fq), ff = fract(fq);
        float h = hcHash(fi + 11.), h2 = hcHash(fi + 5.);
        vec3 alb = mix(mix(uFa, uFb, step(.42, h)), mix(uFc, uFd, step(.86, h)), step(.7, h)) * (.78 + .4 * h2);
        float near = 1. - smoothstep(120., 420., dist);
        alb *= 1. + (hcN2(vec2(fq.x * 3., fq.y * 30.)) - .5) * .3 * near;                 // furrows and swathes
        float bd = min(min(ff.x, 1. - ff.x) * 74., min(ff.y, 1. - ff.y) * 34.);
        alb = mix(uHedge, alb, smoothstep(.6, 2.4 + dist * .004, bd));
        alb *= .76 + .5 * hcFbm(q * .011 + 3.);
        alb = mix(alb, uShore * (.8 + .4 * hcN2(q * .2)), smoothstep(-1.1, -2.7, vP.y));  // reeds and wet shingle at the water's edge
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        float cs = smoothstep(.42, .7, hcFbm(q * .0015 + vec2(uHcTime * .004, 7.)));     // cloud shadows crossing the valley
        vec3 sky = mix(uHcSkyHor, uHcSkyTop, .45);
        float ndl = max(dot(n, uHcSun), 0.);
        vec3 col = alb * (uHcSunCol * (ndl * 1.5 + .12) * (1. - cs * uCloud) + sky * .5);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  }));
  land.frustumCulled = false; group.add(land);
  await pause();

  // ---- the lake: a pale mirror. It holds the sky, the snow ranges standing on their heads and the mist under them; the
  // sun's road lies across it as a field of sparks
  const sunAz = Math.atan2(U.uHcSun.value.x, -U.uHcSun.value.z), nightK = hero === 'night' ? 0.4 : 1;
  const pkU = { uSnowC: { value: C(L.peakSun).multiplyScalar(0.86 * nightK) }, uShadeC: { value: C(O.shade).multiplyScalar(hero === 'night' ? 0.5 : 0.74) }, uRockC: { value: C(O.rock) },
    uHazeC: { value: fogC.clone() }, uSunC2: { value: new THREE.Vector2(Math.cos(sunAz), Math.sin(sunAz)) }, uSnowAll: { value: snowy ? 1 : 0 } };
  // the sun's road on the lake is drawn 26 degrees off the garden's axis, inside the grand view's frame (the true sun stands 60 degrees off, outside it)
  const sunV = U.uHcSun.value, sunH = Math.hypot(sunV.x, sunV.z) || 1, glitSun = sunV.z < 0 ? new THREE.Vector3((sunV.x < 0 ? -1 : 1) * Math.sin(0.45) * sunH, sunV.y, -Math.cos(0.45) * sunH) : sunV.clone();
  const lakeU = { ...fogU(), ...U, ...pkU, uDeep: { value: C(O.deep) }, uGlit: { value: O.glit }, uGlitSun: { value: glitSun } };
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    fog: true, uniforms: lakeU,
    vertexShader: /* glsl */`
      varying vec3 vP;
      ${FOG_V}
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; uniform vec3 uDeep, uSnowC, uShadeC, uRockC, uHazeC; uniform float uGlit; uniform vec3 uGlitSun;
      ${FOG_F}
      ${HC_PARS}
      ${PK_GLSL}
      void main(){
        vec3 toC = uHcCam - vP; float dist = length(toC) + 1e-3; vec3 V = toC / dist; float t = uHcTime;
        vec2 q = vP.xz;
        // long lanes of smooth and ruffled water lying across the view, a slow swell under them
        float lane = hcN2(vec2(q.x * .0026 + t * .003, q.y * .017)) * .6 + hcN2(vec2(q.x * .009 - t * .004, q.y * .05)) * .4;
        vec2 rq = q * .09 + vec2(t * .22, -t * .17);
        float r0 = hcN2(rq), r1 = hcN2(rq + vec2(.7, 0.)), r2 = hcN2(rq + vec2(0., .7));
        float ruf = smoothstep(.4, .62, lane);
        vec3 n = normalize(vec3((r1 - r0) * (.05 + .3 * ruf), 1., (r2 - r0) * (.05 + .3 * ruf)));
        vec3 R = reflect(-V, n); R.y = abs(R.y) + .002; R = normalize(R);
        float fr = 1. - max(V.y, 0.); fr *= fr; fr *= fr;
        vec3 skyR = mix(uHcSkyHor * 1.04, uHcSkyTop, smoothstep(.03, .55, R.y));
        // the ranges in the mirror, drawn out a little by the ripples
        float rl = max(length(R.xz), 1e-4); vec2 rc = vec2(-R.z, R.x) / rl; float re = R.y / rl;
        float hm = 0.;
        for (int l = 0; l < 3; l++) hm = max(hm, pkH(rc, float(l)));
        float mt = 1. - smoothstep(hm - .006, hm + .006, re);
        vec3 mcol = mix(mix(uRockC, uShadeC, .6), mix(uShadeC, uSnowC, .62), smoothstep(.25, .6, re / max(hm, 1e-3)));
        skyR = mix(skyR, mix(mcol, uHazeC, .34), mt * .9);
        skyR = mix(skyR, uHazeC * 1.03, (1. - smoothstep(.006, .024, re)) * .92);
        vec3 col = mix(uDeep, skyR * .93, .4 + .6 * fr);
        col = mix(col * .88, col, 1. - ruf * .8);                                         // the ruffled lanes lie darker across the mirror
        // the sun's road: a broad field of sparks toward the sun, thickest where the water is ruffled
        float s = max(dot(R, uGlitSun), 0.); float s2 = s * s; float s6 = s2 * s2 * s2; float s14 = s6 * s6 * s2; s14 *= s14;
        float sp = hcN2(q * .31 + vec2(t * 1.4, -t)) * .55 + hcN2(q * .83 + vec2(-t * 1.9, t * 1.2)) * .45;
        float spark = smoothstep(.56, .8, sp) * (.3 + .7 * ruf);
        col += uHcSunCol * vec3(1., .9, .7) * (s14 * (.3 + 2.6 * spark) + s6 * (.03 + .3 * spark)) * uGlit;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
        gl_FragColor.rgb = mix(col, gl_FragColor.rgb, .3);                                // the haze lies lightly on the mirror: it is the far shore that is lost in mist
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uHazeC, smoothstep(1700., 3000., dist) * .9);
      }`,
  }));
  lake.position.set(0, -3, 200); lake.frustumCulled = false; group.add(lake);
  await pause();

  // ---- the trees of the valley: poplar rows outside the walls, groves of chinar, orchards in ranks. Far off and seen
  // over the walls only, so each is one upright card turned to the eye, its crown drawn and lit in the shader
  const tr = rng.fork('valley'), iP = [], iQ = [], iC = [], col = new THREE.Color();
  const tree = (x, z, h, w, type, hex, k) => { const y = outY(x, z); if (y < -1.9) return; col.set(hex).multiplyScalar(k); iP.push(x, y - 0.4, z, h); iQ.push(w, type, tr(), 0); iC.push(col.r, col.g, col.b); };
  for (const sx of [-1, 1]) {
    for (let z = 476; z > 106; z -= tr.range(7.5, 10)) tree(sx * (109.5 + tr.range(-1.2, 1.2)), z, tr.range(30, 39), tr.range(7, 9), 0, O.poplar[0], tr.range(0.82, 1.1));
    for (let z = 700; z > 110; z -= tr.range(14, 22)) tree(sx * (127 + tr.range(-3, 3)), z, tr.range(24, 33), tr.range(6.5, 8.5), 0, O.poplar[1], tr.range(0.8, 1.05));
  }
  await pause();
  const nG = Math.round(1500 * detail);
  for (let i = 0; i < nG; i++) {
    if ((i & 255) === 0) await pause();
    const sx = tr() < 0.5 ? -1 : 1, ax = 106 + 1050 * Math.pow(tr(), 1.7), z = tr.range(-200, 720), x = sx * ax;
    const g1 = noise.fbm2(x * 0.0052 + 11, z * 0.0052, 2), g2 = noise.fbm2(x * 0.0031 - 7, z * 0.0031 + 5, 2), pick = tr(), k = tr.range(0.78, 1.08);
    if (g2 > 0.12) {                                   // an orchard: small trees in ranks
      if (pick > 0.75) continue;
      const gx = Math.round(x / 13) * 13 + tr.range(-1, 1), gz = Math.round(z / 13) * 13 + tr.range(-1, 1);
      if (Math.abs(gx) > 106) tree(gx, gz, tr.range(8.5, 12), tr.range(10, 13), 2, O.orch[tr() < 0.6 ? 0 : 1], k);
    } else if (g1 > -0.05) {
      if (pick < 0.24) tree(x, z, tr.range(24, 36), tr.range(6.5, 9), 0, O.poplar[tr() < 0.5 ? 0 : 1], k);
      else if (ax > 152) { const h = tr.range(17, 31); tree(x, z, h, h * tr.range(1.0, 1.3), 1, O.round[Math.floor(tr() * 3) % 3], k); }   // round crowns keep 50 m off the walls: from the lawns one would stand over the parapet as a flat cut-out
    } else if (pick < 0.16 && ax > 152) { const h = tr.range(15, 26); tree(x, z, h, h * tr.range(1.0, 1.25), 1, O.round[Math.floor(tr() * 3) % 3], k); }
  }
  // Char Chinar: four great chinars on their island; poplars on the islet; a wooded spit closing the lake to the right
  for (const [dx, dz] of [[-17, -12], [16, -14], [-14, 15], [18, 13]]) tree(ISLES[0][0] + dx, ISLES[0][1] + dz, tr.range(33, 39), tr.range(38, 44), 1, O.round[0], tr.range(0.9, 1.1));
  for (let i = 0; i < 6; i++) tree(ISLES[0][0] + tr.range(-30, 30), ISLES[0][1] + tr.range(-30, 30), tr.range(20, 28), tr.range(6, 8), 0, O.poplar[0], tr.range(0.8, 1.05));
  for (let i = 0; i < 7; i++) tree(ISLES[1][0] + tr.range(-22, 22), ISLES[1][1] + tr.range(-22, 22), tr.range(24, 34), tr.range(6.5, 9), 0, O.poplar[i % 2], tr.range(0.8, 1.05));
  for (let i = 0; i < 46; i++) { const k = tr(), h = tr.range(20, 34), pop = tr() < 0.45; tree(430 + 1070 * k + tr.range(-20, 20), -1000 + 200 * k + tr.range(-48, 48), h, pop ? tr.range(6.5, 9) : h * 1.15, pop ? 0 : 1, pop ? O.poplar[0] : O.round[i % 3], tr.range(0.8, 1.05)); }
  const bg = new THREE.InstancedBufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  bg.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4)); bg.setAttribute('iQ', new THREE.InstancedBufferAttribute(new Float32Array(iQ), 4));
  bg.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(iC), 3)); bg.instanceCount = iP.length / 4;
  const groves = new THREE.Mesh(bg, new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U, uBack: { value: C(O.back) }, uSnowT: { value: snowy ? 1 : 0 } },
    vertexShader: /* glsl */`
      attribute vec4 iP, iQ; attribute vec3 iC; uniform float uHcTime; uniform vec3 uHcCam;
      varying vec2 vQ; varying vec3 vI, vC, vR, vF;
      ${FOG_V}
      void main(){
        vec3 toC = uHcCam - iP.xyz; vec3 f = normalize(vec3(toC.x, 0., toC.z) + vec3(1e-4, 0., 0.)); vec3 r = vec3(f.z, 0., -f.x);
        float sway = sin(uHcTime * (.9 + iQ.z) + iQ.z * 40.) * .012 * iP.w * position.y * position.y;
        vec3 p = iP.xyz + r * (position.x * iQ.x * .5 + sway) + vec3(0., position.y * iP.w, 0.);
        vQ = position.xy; vI = iQ.yzw; vC = iC; vR = r; vF = f;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vI, vC, vR, vF; uniform vec3 uBack; uniform float uSnowT;
      ${FOG_F}
      ${HC_PARS}
      void main(){
        float x = vQ.x, y = vQ.y, sd = vI.y;
        float n1 = hcN2(vec2(x * 3.3 + sd * 37., y * 5.1 + sd * 11.)), n2 = hcN2(vec2(x * 9. + sd * 5., y * 14. + sd * 3.));
        float n3 = hcN2(vec2(x * 29. + sd * 13., y * (vI.x < .5 ? 96. : 44.) + sd * 7.));           // leaf masses: seen close over the wall a crown is not a flat cut-out
        float r; vec2 c;
        if (vI.x < .5) {                                              // a poplar: a tall flame
          float yy = clamp((y - .06) / .94, 0., 1.);
          float w = .95 * sqrt(max(sin(3.1416 * yy), 0.)) * (1. - .42 * yy) + 1e-3;
          c = vec2(x / w, (yy - .45) * 1.1); r = abs(c.x);
        } else {                                                      // a round crown of three masses on a short trunk
          c = vec2(x, (y - .62) / .38);
          float l2 = length(vec2(x - .46, (y - .5) / .3)) + .34, l3 = length(vec2(x + .48, (y - .53) / .31)) + .3;
          r = min(length(c), min(l2, l3));
        }
        float edge = r + (n1 - .5) * .42 + (n2 - .5) * .24;
        float trunk = step(abs(x), vI.x < .5 ? .05 : .075) * step(y, .5);
        if (edge > .96 && trunk < .5) discard;
        float inCrown = 1. - step(.96, edge);
        vec3 N = normalize(vR * clamp(c.x, -1., 1.) + vec3(0., clamp(c.y, -1., 1.) * .7 + .35, 0.) + vF * sqrt(max(1. - min(r * r, 1.), .04)));
        float lit = max(dot(N, uHcSun), 0.);
        vec3 alb = vC * (.5 + .75 * smoothstep(.25, .75, n1 * .6 + n2 * .4)) * mix(.62, 1.1, y) * (.66 + .62 * n3);
        alb = mix(alb, vec3(.8, .84, .9), uSnowT * smoothstep(.15, .7, N.y + n1 * .3) * .75);
        vec3 sky = mix(uHcSkyHor, uHcSkyTop, .45);
        vec3 col = alb * (uHcSunCol * lit * 1.2 + sky * .5);
        float bl = max(dot(-vF, normalize(vec3(uHcSun.x, 0., uHcSun.z) + vec3(1e-4, 0., 0.))), 0.);      // against the sun the rim of every crown burns
        col += alb * uBack * uHcSunCol * (.28 + .8 * smoothstep(.45, 1., edge)) * bl;                  // and the light comes through the leaves
        col = mix(vec3(.06, .05, .045) * (uHcSunCol * .5 + sky), col, inCrown);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  }));
  groves.frustumCulled = false; group.add(groves);
  await pause();

  // ---- the peaks: three ranges drawn on one band far out, smooth-flanked, snow down to the mist that hides their feet
  const peaks = new THREE.Mesh(new THREE.CylinderGeometry(3000, 3000, 560, 64, 1, true), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: { ...U, ...pkU },
    vertexShader: 'varying vec3 vL; void main(){ vL = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      varying vec3 vL; uniform vec3 uSnowC, uShadeC, uRockC, uHazeC; uniform vec2 uSunC2; uniform float uSnowAll;
      ${HC_PARS}
      ${PK_GLSL}
      void main(){
        float e = (vL.y + 183.) / 3000.;                              // height over the lake as a tangent
        float fw = fwidth(e) * .9 + 1e-5;
        vec2 c = normalize(vec2(-vL.z, vL.x) + vec2(1e-4, 0.));       // (cos, sin) of the azimuth, 0 = down the garden
        vec2 pc = vec2(-c.y, c.x);
        float toSun = dot(c, uSunC2), sideS = c.y * uSunC2.x - c.x * uSunC2.y;
        vec3 col = uHazeC; float alpha = 0.;
        for (int l = 0; l < 3; l++) {
          float fl = float(l), f = 5.2 + 3.1 * fl, sd = 13.7 * fl + 2.;
          float H = pkH(c, fl);
          float dH = pkH(normalize(c + pc * .012), fl) - pkH(normalize(c - pc * .012), fl);
          float tt = clamp(e / max(H, 1e-3), 0., 1.2);
          // spurs running down from the crest: finer faces that take the sun or lose it
          vec2 sq = c * (f * 6.5) + vec2(tt * 2.3, -tt * 1.7) + sd;
          float sp = hcN2(sq + pc * .12) - hcN2(sq - pc * .12);
          float lit = clamp(.56 - .34 * toSun + (dH * 60. + sp * 1.5) * sideS + sp * .5, 0., 1.);
          lit = smoothstep(.3, .66, lit);
          float sline = mix(.2, .58, fl * .5) * (1. - uSnowAll * .8);
          float snow = smoothstep(sline - .1, sline + .12, tt + (hcN2(c * f * 9. + tt * 3.) - .5) * .3);
          vec3 rock = uRockC * (.62 + .5 * lit) * mix(1., .8, fl * .5);
          vec3 sn = mix(uShadeC, uSnowC, lit);
          vec3 lc = mix(rock, sn, snow * mix(1., .55, fl * .5 * (1. - uSnowAll)));
          lc += uSnowC * .22 * smoothstep(.9, 1., tt) * max(toSun, 0.) * snow;                // crests catching the light against the sun
          lc = mix(lc, uHazeC, mix(.5, .2, fl * .5) + .3 * (1. - tt) * (1. - tt));           // each range paler than the one in front
          float m = 1. - smoothstep(H - fw, H + fw, e);
          col = mix(col, lc, m); alpha = max(alpha, m);
        }
        // the mist bank along the far shore: its top soft and slowly rolling, brighter under the sun
        float top = .013 + .008 * hcN2(c * 7. + vec2(uHcTime * .006, 0.)) + .004 * hcN2(c * 23. - vec2(uHcTime * .011, 3.));
        float mist = 1. - smoothstep(top * .15, top, e);
        vec3 mc = uHazeC * 1.04 + uSnowC * .2 * toSun * toSun * toSun * toSun * step(0., toSun);
        col = mix(col, mc, mist * .93); alpha = max(alpha, mist * .93);
        gl_FragColor = vec4(col, alpha);
      }`,
  }));
  peaks.renderOrder = -0.5; peaks.frustumCulled = false; group.add(peaks);
  await pause();
  return { group, peaks, triangles: Math.round(idx.length / 3 + 2 + bg.instanceCount * 2 + 128), update(cx, cz) { peaks.position.set(cx, 180, cz); } };
}

// ---------------------------------------------------------------- the world
export default {
  id: 'chinar-water-terraces',
  name: 'The Chinar Terraces',
  category: 'domestic',
  weirdness: 0.05,
  media: ['water', 'air'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, dens = ctx.vary?.density ?? 1, rare = !!ctx.vary?.rare;
    const lookName = pickLook(ctx, rng.fork('look')), L = LOOKS[lookName];
    const snowy = L.hero === 'snow' || L.hero === 'night', night = L.hero === 'night', april = L.hero === 'april';
    const scene = new THREE.Scene();
    const path = makePath(PATH_PTS);
    // the moments after the dive keep their places on the ground when the climb before them is reshaped
    const uu = (u) => (u * L0 - (L0 - path.length)) / path.length, U_EXIT = uu(0.709);   // U_EXIT: where the path rounds the end of the sheet (its plane, z 84)
    await ctx.yield();
    const sunDir = skyDirection(L.el, L.az);
    const time = { value: 0 };

    // ---- sky, light, haze
    const sky = makeSky({ rng: rng.fork('sky'), ...L.sky, ...(night ? { bake: true, renderer: ctx.renderer } : { sunElevation: L.el, sunAzimuth: L.az }) });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(L.fog, L.fogD);
    const sun = new THREE.DirectionalLight(L.sun, L.sunI); sun.position.copy(sunDir).multiplyScalar(500); scene.add(sun);
    scene.add(new THREE.HemisphereLight(L.hemiS, L.hemiG, L.hemiI));
    await ctx.yield();
    const outY = makeOutY(ctx.noise);
    await ctx.yield();

    // ---- the hero: cascade, gallery, tank, pavilion; the canals, their jets and mist ride on its materials
    const canals = [
      { x0: -5, x1: 5, z0: 480, z1: 546, y: 32, lip: -1e4, jets: 0 }, { x0: -12, x1: 12, z0: 330, z1: 480, y: 32, lip: 330, jets: 1 },
      { x0: -12, x1: 12, z0: 205, z1: 305, y: 24, lip: 205, jets: 1 }, { x0: -12, x1: 12, z0: 160, z1: 180, y: 16, lip: 84, jets: 1 }, { x0: -12, x1: 12, z0: 150, z1: 160, y: 16, lip: 84, jets: 0 },   // (the owner's cure of 10-10: the lowest canal in two sheets, so that no ring is stamped at z 155, where the pair of jets is left out)
      { x0: -30, x1: 30, z0: 101.3, z1: 150, y: 16, lip: 84, jets: 0 },
      { x0: 34, x1: 100, z0: 86.2, z1: 96.4, y: 0, lip: 84, jets: 0 }, { x0: -100, x1: -34, z0: 86.2, z1: 96.4, y: 0, lip: 84, jets: 0 },   // the tank's two corners beside the gallery
    ];
    const jr = rng.fork('jets'), extraJets = [];
    // every terrace has its own water: terrace 1 opens between two arcades of arches thrown down the canal from bud to bud
    // (form 2: along their own line 8 m off the axis, never across the line of flight), then tall plumes between low
    // bells; terrace 2 is low bells with a tall plume every fourth; terrace 3 two pairs of the tallest (three until the cure of 10-10)
    const jetForm = (y, z, k, sx) => (y > 30 ? (z >= 435 ? [1.05, 1, 2] : (k + (sx > 0 ? 1 : 0)) % 3 === 0 ? [1.75, 0.42, 0] : (k + (sx > 0 ? 1 : 0)) % 3 === 1 ? [0.46, 1.6, 0] : [1.08, 0.85, 0])
      : y > 20 ? (k % 4 === 1 ? [1.9, 0.4, 0] : k % 2 === 0 ? [0.4, 1.8, 0] : [0.72, 1.25, 0]) : [1.6, 0.5, 0]);
    for (const [za, zb, y] of [[335, 475, 32], [215, 295, 24], [155, 175, 16]]) for (let z = za, k = 0; z <= zb; z += 10, k++) for (const sx of [-1, 1]) {
      // the owner's cure of 10-10, a fault in live found by interiors B's count: the flight passed through the falling water of the east jet at
      // 8, 16, 155 (0.02 to 0.30 m from the lens on every seed). The pair at z 155 is left out, with its buds; its two draws are still taken, so
      // every other jet keeps its seed. Terrace 3 keeps two pairs of the tallest.
      const j = { x: sx * 8, y, z, group: (k + (sx > 0 ? 1 : 0)) % 3, seed: jr(), k: jetForm(y, z, k, sx) };
      if (y !== 16 || z !== 155) extraJets.push(j);
    }
    const mr = rng.fork('mist'), mist = [], mk = L.mist * detail * Math.min(1.15, dens);
    const mistRun = (za, zb, hw, y, per) => { const n = Math.round(((zb - za) / per) * mk); for (let i = 0; i < n; i++) mist.push([mr.range(-hw, hw), y + mr.range(0.4, 1.3), mr.range(za, zb), mr(), 2, mr.range(6.5, 11.5) * (snowy ? 1.2 : 1)]); };
    mistRun(332, 476, 10.5, 32, 1.75); mistRun(207, 303, 10.5, 24, 1.7); mistRun(150, 178, 10.5, 16, 1.8); mistRun(96, 150, 27, 16, 1.7);
    for (const [zf, y] of [[305, 24], [180, 16]]) for (let i = 0; i < Math.round(9 * detail); i++) mist.push([mr.range(-10, 10), y + 0.3, zf - mr.range(0, 6), mr(), 0, mr.range(3.5, 6)]);
    const route = []; for (let i = 0; i <= 70; i++) { const p = path.pointAt(U_EXIT - 0.013 + ((1 - U_EXIT + 0.013) * i) / 70); route.push([p.x, p.y, p.z]); }
    const hero = await buildHero(ctx, { palette: PAL, look: L.hero, sunDir, terrace: false, route, canals, extraJets, mist, hole: false });
    scene.add(hero.object);
    const U = hero.uniforms, A = hero.anchors;
    hero.setLight({ mist: L.mistK, portal: L.portal });
    const outside = await makeOutside({ U: hero.uniforms, L, hero: L.hero, rng: rng.fork('outside'), noise: ctx.noise, detail, pause: ctx.yield, outY });
    scene.add(outside.group);
    const skyHor = new THREE.Color(L.fog), treeCol = new THREE.Color(L.leaf[0]).lerp(new THREE.Color(L.leaf[1]), 0.25);
    if (lookName === 'golden' || lookName === 'dawn') hero.setLight({ sunColor: L.sun, sunIntensity: lookName === 'dawn' ? 0.75 : 1.5, skyHorizon: skyHor, gard: [1, 1, 0, 0.3] });
    if (snowy) hero.setLight({ gard: [night ? 0.75 : 0.3, 0.38, 0, night ? 0.22 : 0.3] });      // first snow: white lawns with red leaves lying on them, not a carpet
    if (night) hero.setLight({ tree: treeCol.clone().multiplyScalar(0.16), skyTop: '#14265a', skyHorizon: '#3a5492', water: new THREE.Color(PAL[3]).multiplyScalar(0.42), sunColor: '#a9bdf0', sunIntensity: 0.95 });
    await ctx.yield();

    // ---- stone, lawns, beds, props (two meshes on the hero's stone shader, one on its brass)
    const stone = new THREE.Color(hero.stoneColor).multiplyScalar(1.22), pale = new THREE.Color(hero.stoneColor).lerp(new THREE.Color(PAL[5]), 0.5);
    const gb = makeB(), bedRects = [], finials = [];
    await buildGarden(gb, { stone, pale, lawnC: new THREE.Color(L.lawn), bedCols: L.beds.map((h) => new THREE.Color(h)), rng: rng.fork('garden'), bedRects, finials, pause: ctx.yield });
    const garden = new THREE.Mesh(await gb.geometryAsync(ctx.yield), hero.materials.stone); garden.frustumCulled = false; scene.add(garden);
    await ctx.yield();
    const pb = makeB(), mb = makeB();
    const BARROW = [-23, 24.25, 262], HEAP = [-28.5, 24.25, 250];
    buildProps(pb, mb, { barrow: BARROW, heap: HEAP, carpet: A.carpet, tubs: A.tubs, stone, finials, heapKind: april ? 11 : 13, leafCols: april ? ['#5f8a2c', '#8fae3c'] : [L.leaf[0], L.leaf[1]] });
    // raked drifts of leaves on the lawns (kept off the beds and clear of the route), then single leaves over everything near the eye
    const MOUNDS = april ? [] : [[28, 156, 2.4, 1.0], [34.5, 127, 2.0, 0.9], [58, 141, 2.6, 1.1], [63, 117, 3.0, 1.25], [88, 121, 2.6, 1.1], [72, 137, 2.2, 0.9], [56, 104.6, 2.4, 1.0],
      [-37, 252, 2.2, 0.9], [-34, 268, 2.6, 1.1], [22, 404, 2.2, 0.9], [-23, 372, 2.4, 1.0], [-58, 138, 2.4, 1.0]];
    pb.kind = 13;
    MOUNDS.forEach(([x, z, r, h], i) => { pb.setCol(new THREE.Color(L.leaf[i % 2 ? 0 : 2]).lerp(new THREE.Color(L.leaf[0]), 0.5), 0.6); pb.lathe([[r, 0, 0.55], [r * 0.82, h * 0.42], [r * 0.5, h * 0.84], [r * 0.2, h * 0.98], [0, h]], x, groundY(z), z, 9, i); });
    pb.kind = 11;
    await ctx.yield();
    const lr = rng.fork('litter'), lit = [], lK = detail * Math.min(april ? 1.03 : 1, dens) * (april ? 0.4 : snowy ? 0.5 : 1), lS = april ? 0.55 : 1;
    const onGround = (x, z) => Math.abs(x) > 13.5 && Math.abs(x) < 98 && z > 102 && z < 478 && !(Math.abs(x) < 21.6 && ((z > 303 && z < 338) || (z > 178 && z < 213))) && !(z < 151.6 && Math.abs(x) < 31.6);
    const leaf = (x, z, y, big, up) => { if (onGround(x, z)) lit.push(x, y + 0.02, z, lr.range(0.13, 0.27) * big * lS, lr.range(0, 6.283), up + Math.pow(lr(), 2.2) * 0.8, lr(), lr()); };
    for (const sx of [-1, 1]) for (const z of [...TREE_Z, 103.6]) for (let i = 0; i < Math.round(120 * lK); i++) { const a = lr.range(0, 6.283), d = 2.5 + 15 * Math.sqrt(lr()); leaf(sx * 34 + Math.cos(a) * d, z + Math.sin(a) * d, groundY(z + Math.sin(a) * d), 1, 0.05); }
    for (let i = 0; i < Math.round(11000 * lK); i++) {
      if ((i & 1023) === 0) await ctx.yield();        // a long scatter: hand the page back every thousand
      const x = lr.range(15, 97), z = lr.range(102, 179); if (lr() < Math.exp(-path.nearestXZ(x, z).dist / 13) * Math.max(0.06, 0.5 + 0.95 * ctx.noise.fbm2(x * 0.09, z * 0.09, 2))) leaf(x, z, 16.25, 1.1, 0.05);   // drifts
    }
    for (const [za, zb] of [[332, 478], [207, 303], [152, 178]]) for (let i = 0; i < Math.round((zb - za) * 3.0 * lK); i++) leaf((lr() < 0.5 ? -1 : 1) * (13.6 + Math.abs(lr.gauss()) * 1.3), lr.range(za, zb), groundY((za + zb) / 2), 0.9, 0.1);
    for (const [x, z, r, h] of MOUNDS) for (let i = 0; i < Math.round(110 * lK); i++) { const a = lr.range(0, 6.283), q = Math.sqrt(lr()) * 1.2; leaf(x + Math.cos(a) * r * q, z + Math.sin(a) * r * q, groundY(z) + h * Math.max(0, 1 - q * q * 0.82) * 0.98, 1.25, 0.35); }   // a skin of real leaves over every heap
    await ctx.yield();
    const litter = makeLitter(U, lit, april ? ['#f6c6d6', '#ffffff'] : [L.leaf[0], L.leaf[1]]); scene.add(litter);
    await ctx.yield();
    const props = new THREE.Mesh(pb.geometry(), hero.materials.stone); props.frustumCulled = false; scene.add(props);
    const brass = new THREE.Mesh(mb.geometry(), hero.materials.metal); brass.frustumCulled = false; scene.add(brass);
    await ctx.yield();
    const chutes = makeChutes(U); scene.add(chutes);
    await ctx.yield();

    // ---- chinars: two rows on the terraces, ten more beyond the tank's side walls
    const wind = flora.makeWind({ direction: [0.9, 0.38], strength: 1.05, gustiness: 0.75, gustScale: 0.03 });
    const leafOpts = { wind, backlight: L.backK, backlightTint: L.back, sheen: 0.55, ambient: 1.7, leafAmbient: 1.5, detail: 0.7, detailScale: 1.5, barkBump: 0.85 };
    await flora.prepareLeafTexture({}, ctx.yield);      // the leaf atlas drawn in short steps, so the call below does no pixel work
    const leafMap = flora.makeLeafTexture();
    await ctx.yield();
    const leafMat = flora.windMaterial({ ...leafOpts, map: leafMap });
    await ctx.yield();
    const chinarMat = chinarize(flora.windMaterial({ ...leafOpts, ambient: 1.3, map: leafMap }));
    await ctx.yield();
    const blossomMat = L.blossom ? flora.windMaterial({ ...leafOpts, backlight: 0.5, backlightTint: '#ffd6e0', ambient: 1.2, leafAmbient: 0.92, map: leafMap }) : leafMat;
    await ctx.yield();
    const tr = rng.fork('chinars'), lc = L.leaf;
    const mixH = (a, c, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(c), t).getHexString();
    const bark = { bark: '#cfc6b6', barkDark: '#8d8070', barkLight: '#ebe4d6' }, full = snowy ? 0.92 : 1.08;
    const tOpt = { height: 11, detail: 1, flex: 0.6, ...bark };
    const variants = [];
    variants.push(flora.oakGeometry({ rng: tr.fork('a'), ...tOpt, fullness: full, leaf: lc[0], leafLight: lc[1], leafDark: lc[2] }));
    await ctx.yield();
    variants.push(flora.mapleGeometry({ rng: tr.fork('b'), ...tOpt, fullness: full * 1.15, leaf: lc[0], leafLight: lc[1], leafDark: lc[2], gold: april ? '#b8d85a' : PAL[1], crimson: april ? '#4f8a2c' : '#9c1c12' }));
    await ctx.yield();
    variants.push(flora.oakGeometry({ rng: tr.fork('c'), ...tOpt, fullness: full, leaf: mixH(lc[0], lc[1], 0.4), leafLight: mixH(lc[1], '#ffe08a', 0.3), leafDark: mixH(lc[2], lc[0], 0.3) }));
    await ctx.yield();
    variants.push(flora.mapleGeometry({ rng: tr.fork('d'), ...tOpt, fullness: full * 1.15, leaf: mixH(lc[0], lc[2], 0.22), leafLight: lc[1], leafDark: lc[2], gold: april ? '#d0e870' : '#ffb83a', crimson: april ? '#3f7a2a' : '#8a1610' }));
    await ctx.yield();
    const trees = [];
    for (const sx of [-1, 1]) for (const z of TREE_Z) trees.push({ x: sx * 34 + tr.range(-1, 1), y: groundY(z), z: z + tr.range(-1, 1), h: z > 330 ? tr.range(41, 48) : tr.range(40, 43.5) });   // the lower terraces' trees a little shorter: the high view clears them
    for (const sx of [-1, 1]) for (const z of [70, 20, -30, -80, -130]) trees.push({ x: sx * 114, y: outY(sx * 114, z) - 0.6, z, h: tr.range(46, 52), ring: true });
    for (const x of [-75, -25, 25, 75]) trees.push({ x, y: outY(x, -173) - 0.3, z: -173, h: tr.range(46, 52), ring: true });      // and four beyond the far wall, either side of the pavilion
    const fine = [];
    for (let i = 0; i < variants.length; i++) { fine.push(refineCrown(variants[i], tr.fork('fine' + i))); await ctx.yield(); }
    const rareTree = rare ? trees.find((t) => t.ring && t.x < 0 && t.z === 20) : null;
    if (rareTree) rareTree.h = 62;                      // the veteran: its crown stands clear above the wall
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P3 = new V3(), S3 = new V3(), YA = new V3(0, 1, 0), col = new THREE.Color();
    const place = (im, i, x, y, z, sx, sy, sz, yaw) => { Q.setFromAxisAngle(YA, yaw); P3.set(x, y, z); S3.set(sx, sy, sz); im.setMatrixAt(i, M4.compose(P3, Q, S3)); };
    // the 24 on the terraces pass close overhead and wear the refined crowns; the ring beyond the walls keeps the plain ones
    [[fine, false], [variants, true]].forEach(([geos, ring]) => geos.forEach((geo, vi) => {
      const list = trees.filter((t, i) => i % variants.length === vi && t !== rareTree && !!t.ring === ring);
      if (!list.length) return;
      const im = new THREE.InstancedMesh(geo, chinarMat, list.length);
      list.forEach((t, i) => {
        const s = t.h / 11, sl = ring ? 1 : 0.87; place(im, i, t.x, t.y - 0.3, t.z, s * sl * tr.range(0.95, 1.12), s, s * sl * tr.range(0.95, 1.12), tr.range(0, 6.283));
        const br = tr.range(0.86, 1.12), hh = tr.range(-0.08, 0.1); im.setColorAt(i, col.setRGB(br * (1 + hh), br, br * (1 - hh)));
      });
      im.frustumCulled = false; scene.add(im);
    }));
    // one more chinar a side at the very edge of terrace 3, over the cascade's shoulders: their trunks throw the long blue
    // stripes across the last lawn and the basin (the shader's rows know them), their crowns frame the turn over the wall
    {
      const er = rng.fork('edge-chinars'), im = new THREE.InstancedMesh(fine[2], chinarMat, 2);
      [-1, 1].forEach((sx, i) => {
        const s = er.range(41, 45) / 11; place(im, i, sx * 34, 16.25 - 0.3, 103.6, s * er.range(0.95, 1.1), s, s * er.range(0.95, 1.1), er.range(0, 6.283));
        const br = er.range(0.9, 1.1); im.setColorAt(i, col.setRGB(br * 1.04, br, br * 0.96));
      });
      im.frustumCulled = false; scene.add(im);
    }
    let rareMat = null, rareFull = null;
    if (rareTree) {
      const o = { ...tOpt, fullness: 1.15, leaf: lc[0], leafLight: lc[1], leafDark: lc[2] }, seedR = (ctx.seed | 0) * 31 + 977;
      rareMat = chinarize(flora.windMaterial({ ...leafOpts, ambient: 1.3, map: leafMat.map }));
      await ctx.yield();
      rareFull = new THREE.Mesh(flora.oakGeometry({ rng: ctx.core.makeRng(seedR), ...o }), rareMat);
      await ctx.yield();
      const bare = new THREE.Mesh(flora.oakGeometry({ rng: ctx.core.makeRng(seedR), ...o, foliage: false }), chinarMat);
      for (const m of [rareFull, bare]) { m.position.set(rareTree.x, rareTree.y - 0.3, rareTree.z); m.scale.setScalar(rareTree.h / 11); m.frustumCulled = false; scene.add(m); }
    }
    await ctx.yield();

    // ---- cypress pairs against the side walls (almonds in blossom between them in April), the beds, the orange trees
    const inst = (geo, pts, scale, mat = leafMat) => {
      if (!pts.length) return null;
      const im = new THREE.InstancedMesh(geo, mat, pts.length);
      pts.forEach((p, i) => { const s = scale * tr.range(0.88, 1.12); place(im, i, p[0], p[1] - 0.15, p[2], s, s * tr.range(0.95, 1.1), s, tr.range(0, 6.283)); const br = tr.range(0.85, 1.1); im.setColorAt(i, col.setRGB(br, br, br)); });
      im.frustumCulled = false; scene.add(im); return im;
    };
    const cyA = [], cyB = [], alm = [];
    for (const sx of [-1, 1]) {
      for (const z of [452, 396, 346, 312, 256, 216, 192, 150]) for (const dz of [0, -6.5]) { const x = sx * 94.5, zz = z + dz; if (path.distanceTo(x, groundY(zz) + 8, zz) > 16) (dz ? cyB : cyA).push([x, groundY(zz), zz]); }
      for (const z of [424, 370, 284, 236, 170, 126]) { const x = sx * 91; if (path.distanceTo(x, groundY(z) + 6, z) > 16) alm.push([x, groundY(z), z]); }
    }
    const cyCol = L.cypress ? { leaf: L.cypress, leafLight: mixH(L.cypress, '#6f9a56', 0.4), leafDark: mixH(L.cypress, '#1f4252', 0.55) } : snowy ? { leaf: '#4f7a66', leafLight: '#9db4a8', leafDark: '#2e4f58' } : { leaf: '#35614a', leafLight: '#5f8a52', leafDark: '#1f3f48' };   // slate-green in shade, never black (paler under the snow sky, where nothing lights them)
    const cyG1 = flora.cypressGeometry({ rng: tr.fork('cy1'), height: 12, detail: 0, girth: 0.125, ...cyCol }), cyG2 = flora.cypressGeometry({ rng: tr.fork('cy2'), height: 12, detail: 0, girth: 0.115, ...cyCol });
    await ctx.yield();
    inst(cyG1, cyA, 1.5); inst(cyG2, cyB, 1.45);
    await ctx.yield();
    // dark cypresses in pairs at every gap between the beds, lining the canal walks: the deep green the lime chinars burn against
    const cyC = [], cyD = [];
    for (const sx of [-1, 1]) for (const [z, y] of [[372, 32.25], [404, 32.25], [436, 32.25], [469, 32.25], [343, 32.25], [230, 24.25], [254, 24.25], [278, 24.25], [301, 24.25], [154, 16.25]])
    {
      // a pair stands at its gap unless the line of flight comes within 8 m of either tree (the camera would fly through
      // its crown): then the pair stands at the first place up the same walk that is clear
      let zc = z; while (zc < z + 16 && Math.min(path.nearestXZ(sx * 18.6, zc - 2.7).dist, path.nearestXZ(sx * 18.6, zc + 2.7).dist) < 8) zc += 1;
      for (const dz of [-2.7, 2.7]) (dz > 0 ? cyC : cyD).push([sx * 18.6, y, zc + dz]);
    }
    const near3 = (q) => q[1] < 20, far3 = (q) => q[1] >= 20;
    inst(cyG1, cyC.filter(far3), 1.3); inst(cyG2, cyD.filter(far3), 1.12);
    await ctx.yield();
    inst(flora.cypressGeometry({ rng: tr.fork('cy3'), height: 12, detail: 1, girth: 0.125, ...cyCol }), cyC.filter(near3).concat(cyD.filter(near3)), 1.22);
    await ctx.yield();
    if (april) inst(flora.cherryGeometry({ rng: tr.fork('almond'), height: 8, detail: 0, leaf: '#e99ab8', leafLight: '#f4c6d6', leafDark: '#a4507a' }), alm, 1.6, blossomMat);
    await ctx.yield();
    // the orchards on the open lawns, two rows a side, and a blossom tree in every gap between the beds: almond pink and
    // pear white in April, gold and russet in October, white with rime under snow
    {
      const oc = L.orchard || (snowy ? [['#dfe6ee', '#ffffff', '#8a93a6'], ['#b5462a', '#e2903a', '#4a140a']] : [['#e0a224', '#ffd45a', '#7a4a12'], ['#b8401a', '#f08a1e', '#4a140a']]);
      const or = rng.fork('orchard'), oP = [[], []], oS = [[], []];
      const free = (x, z) => path.distanceTo(x, groundY(z) + 8, z) > 15 && !MOUNDS.some((m) => Math.hypot(m[0] - x, m[1] - z) < 6);
      for (const [za, zb] of [[344, 470], [212, 298], [108, 198]]) for (const [xr, ph] of [[60, 0], [79, 9]]) for (let z = za + ph, k = 0; z <= zb; z += 18, k++) for (const sx of [-1, 1]) {
        const x = sx * (xr + or.range(-2.5, 2.5)), zz = z + or.range(-3, 3);
        if (free(x, zz)) oP[(k + (xr > 70 ? 1 : 0) + (sx > 0 ? 1 : 0)) % 2].push([x, groundY(zz), zz]);
      }
      for (const sx of [-1, 1]) { for (const z of [372, 404, 436]) oS[1].push([sx * 24.5, 32.25, z]); for (const z of [230, 254, 278]) oS[0].push([sx * 24.5, 24.25, z]); }
      for (let i = 0; i < 2; i++) {
        const g = flora.cherryGeometry({ rng: tr.fork('orchard' + i), height: 8, detail: 0, leaf: oc[i][0], leafLight: oc[i][1], leafDark: oc[i][2] });
        inst(g, oP[i], 1.55, blossomMat); inst(g, oS[i], 1.2, blossomMat);
        await ctx.yield();
      }
    }
    const fr = rng.fork('flowers'), fl = [], fK = 0.42 * detail * Math.min(april ? 1.03 : 1, dens) * (snowy ? 0.4 : april ? 1.08 : 1);
    for (const r of bedRects) { const n = Math.round((r.x1 - r.x0) * (r.z1 - r.z0) * fK); for (let i = 0; i < n; i++) fl.push([fr.range(r.x0, r.x1), r.y, fr.range(r.z0, r.z1), r.col]); }
    const fgeo0 = flora.flowerGeometry({ rng: tr.fork('fl'), petalMask: true, root: april ? '#3f7a2a' : '#35561f' }), fgeo = new THREE.BufferGeometry(), petal = new Float32Array(fl.length * 3);
    fgeo.index = fgeo0.index; for (const k in fgeo0.attributes) fgeo.setAttribute(k, fgeo0.attributes[k]);
    fgeo.setAttribute('petal', new THREE.InstancedBufferAttribute(petal, 3));
    const flowers = new THREE.InstancedMesh(fgeo, leafMat, fl.length);
    fl.forEach((f, i) => { const s = fr.range(1.9, 2.8), k = fr.range(0.72, 1.08); place(flowers, i, f[0], f[1] - 0.05, f[2], s, s * fr.range(0.85, 1.15), s, fr.range(0, 6.283)); petal[i * 3] = f[3].r * k; petal[i * 3 + 1] = f[3].g * k; petal[i * 3 + 2] = f[3].b * k; flowers.setColorAt(i, col.setRGB(0.9, 0.95, 0.9)); });
    flowers.frustumCulled = false; scene.add(flowers);
    await ctx.yield();
    inst(flora.bushGeometry({ rng: tr.fork('orange'), size: 1.5, detail: 1, flowers: 0.9, flowerColor: '#ff8a1a', leaf: '#2c6a2e', leafLight: '#7fae4a', leafDark: '#123a1c' }), A.tubs.map((t) => [t[0], t[1] + 1.65, t[2]]), 1.85);
    await ctx.yield();

    // ---- air: falling leaves (or petals, or snow), a sunlit shower in April, smoke, steam, shafts through the screen
    const set = fx.fxGroup(); scene.add(set.object);
    const pf = L.fall.preset, flake = pf === 'snow', fallN = L.fall.n * detail * Math.min(1.25, dens), ld = sunDir.toArray();
    const fallCol = L.fall.colors ? { colors: L.fall.colors } : {};
    const fallA = set.add(fx.makeParticles({ rng: rng.fork('fall1'), preset: pf, time, count: Math.round((flake ? 3000 : 1000) * fallN), box: [64, 34, 64], size: flake ? [0.1, 0.26] : [0.3, 0.62], lightDir: ld, ...fallCol }));
    await ctx.yield();
    const fallB = set.add(fx.makeParticles({ rng: rng.fork('fall2'), preset: pf, time, count: Math.round((flake ? 2600 : 900) * fallN), box: [150, 60, 150], size: flake ? [0.22, 0.5] : [0.5, 0.95], lightDir: ld, ...fallCol }));
    await ctx.yield();
    const rain = april ? set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, count: Math.round(3400 * detail), colors: ['#f4faff', '#ffffff', '#ffe9c8'], intensity: 1.6, opacity: 0.55 })) : null;
    if (rain) rain.setOpacity(0);
    await ctx.yield();
    set.add(fx.makeSmokeColumn({ rng: rng.fork('smoke'), time, position: [HEAP[0] + 0.2, HEAP[1] + 1.7, HEAP[2]], height: 15, radius: [0.12, 0.85], size: [0.45, 2.3], count: 60, color: night ? '#34406a' : '#7388c0',
      colorTop: night ? '#4c5a8a' : '#9db2e0', shadowColor: night ? '#1c2440' : '#4a5a8c', ambient: night ? '#141a2c' : '#34426a', opacity: 0.3, wind: [1.5, 0, 0.5], bend: 0.8, sunDir: ld, sunColor: L.sun, rate: 0.05 }));
    await ctx.yield();
    const SAM = [A.carpet[0] + 4.7, A.carpet[1] + 2.95, A.carpet[2] - 0.6];
    set.add(fx.makeSmokeColumn({ rng: rng.fork('steam'), time, position: SAM, height: 4.6, radius: [0.1, 0.9], size: [0.5, 2.2], count: 22, color: '#dfe6f0', colorTop: '#ffffff', shadowColor: '#a6b0c6', ambient: '#7c869c', opacity: 0.4, wind: [0.2, 0, 0.1], bend: 0.3, rate: 0.09, sunDir: ld, sunColor: L.sun }));
    await ctx.yield();
    const sunSide = sunDir.x < 0 ? -1 : 1;
    set.add(fx.makeGodRays({ rng: rng.fork('rays'), time, position: [sunSide * 15.2, 41.6, 504], direction: [-sunDir.x, -sunDir.y, -sunDir.z], radius: 5, count: Math.round(10 * detail), length: 28, width: [0.4, 1.2], color: L.sun, intensity: 0.042 * L.sunI, falloff: 1.2 }));
    await ctx.yield();
    // the low sun comes through the gaps in the up-sun row of chinars in long shallow shafts that cross the canal and its mist
    if (!snowy) for (const [z, y] of [[262, 54], [142, 45]]) {
      set.add(fx.makeGodRays({ rng: rng.fork('shafts' + z), time, position: [sunSide * 31, y, z - sunDir.z * 6], direction: [-sunDir.x, -sunDir.y, -sunDir.z], radius: 13, count: Math.round(9 * detail), length: 78, width: [1.3, 4.2], color: L.sun, intensity: 0.05 * L.sunI, falloff: 1.2 }));
      await ctx.yield();
    }

    // the portal's light in the pavilion's arch, readable from the grand view half a kilometre off (hidden once the eye is near)
    const farGlow = set.add(fx.makeGlow({ position: [0, 10, -100.5], color: L.portal, size: 17, intensity: 1.5, time, halo: 1, core: 0.8, depthBias: 0.05 }));
    await ctx.yield();

    // ---- creatures: hoopoes (or mynas) flushing across the canal, the kingfisher, bulbuls at the chute heads, dragonflies, mallards
    const fLight = F.lightFrom(scene), birds = [];
    const mynas = rng.chance(0.3);
    // the lens dives through the level the flock crosses at: the crossing keeps its place on the route (u and lead name the same point as
    // before) and comes that much sooner, so that by place no bird's reach (its dealt place, held by the kit within three scatters; its
    // wander's box; its own ball) is within 2 m of the lens in the picture, or 1 m outside it, when the lens comes down to that level
    const hoopoes = F.makeFlock({ rng: rng.fork('hoopoe'), species: 'crows', count: 5, size: 1.65, speed: 11, spread: [3, 1.2, 5], wander: [1.2, 0.6, 1.2, 0.6], maxSigma: 3, flap: 4.2, amp: 0.75, glide: 0.2, light: fLight,
      cross: { path, u: 0.356, lead: 30.24, span: 90, angle: 62, side: 1, height: 0.6, duration: DUR },
      ...(mynas ? { body: '#3a2a22', belly: '#5a4636', wingC: '#2a2018', trail: '#f2eee4', tip: '#1a1410', beak: '#f0c020', head: '#1c1614' }
        : { body: '#c9864a', belly: '#e2b88e', wingC: '#1a1a1c', trail: '#f4f0e6', tip: '#16161a', beak: '#3a2a20', head: '#d08c4c' }) });
    scene.add(hoopoes.object);
    await ctx.yield();
    const KF = [[-24, 20.5, 147], [-14, 23.6, 157.5], [-7, 24.6, 163.6], [-4.2, 24.5, 165.4], [-3.2, 24.3, 166], [-2.8, 20.2, 165.6], [-2.6, 16.15, 165.2]];
    const kfSeg = [0]; let kfLen = 0, kfHover = 0;
    for (let i = 1; i < KF.length; i++) { kfLen += Math.hypot(KF[i][0] - KF[i - 1][0], KF[i][1] - KF[i - 1][1], KF[i][2] - KF[i - 1][2]); kfSeg.push(kfLen); if (i === 4) kfHover = kfLen; }
    const kfP = new V3(), kfE = new THREE.Euler(0, 0, 0, 'YXZ');
    const kfAt = (d, out) => { d = Math.min(kfLen, Math.max(0, d)); let i = 1; while (i < KF.length - 1 && kfSeg[i] < d) i++; const k = (d - kfSeg[i - 1]) / Math.max(1e-6, kfSeg[i] - kfSeg[i - 1]), a = KF[i - 1], c = KF[i]; return out.set(a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k, a[2] + (c[2] - a[2]) * k); };
    // in by u 0.41, then it hangs on its wings for a second and three quarters before the dive at 0.445
    const kA = uu(0.41), kB = uu(0.445), kC = uu(0.4535);
    const kfS = (u) => (u < kA ? kfHover * 0.95 * sstep(0.372, kA, u) : u < kB ? kfHover * (0.95 + (0.05 * (u - kA)) / (kB - kA)) : kfHover + (kfLen * 1.14 - kfHover) * sstep(kB, kC, u));
    const kfBody = new THREE.InstancedMesh(kingfisherGeometry(), hero.materials.stone, 1);
    kfBody.frustumCulled = false; kfBody.instanceMatrix.setUsage(THREE.DynamicDrawUsage); kfBody.visible = false; scene.add(kfBody);
    const kfU = { uT: time, uFold: { value: 0 }, uLight: { value: new THREE.Color(L.sun).multiplyScalar(night ? 0.5 : 0.75).add(new THREE.Color(L.hemiS).multiplyScalar(0.35)) } };
    const kfWings = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-1.2, -0.8, 0.12, 1.2, -0.8, 0.12, 1.2, 1.0, 0.12, -1.2, -0.8, 0.12, 1.2, 1.0, 0.12, -1.2, 1.0, 0.12], 3)),
      new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: kfU,
        vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: /* glsl */`varying vec2 vQ; uniform float uT, uFold; uniform vec3 uLight;
          void main(){
            vec2 q = vec2(abs(vQ.x), vQ.y - .04); float r = length(q) + 1e-4, ang = atan(q.y, q.x + 1e-4);
            float a0 = mix(-.6, 1.05, .5 + .5 * sin(uT * 57.));                               // nine beats a second: where the wing is this instant
            float len = 1.08, span = (1. - smoothstep(len * .7, len, r * (1. + .25 * abs(ang - .2)))) * smoothstep(.1, .22, r);
            float sweep = smoothstep(-.85, -.55, ang) * (1. - smoothstep(1.05, 1.3, ang));
            float blade = exp(-(ang - a0) * (ang - a0) / .05);
            float feather = .62 + .38 * sin(r * 34. + ang * 7.);
            float a = span * (sweep * .2 * feather + blade * .62) * (1. - uFold);
            vec3 col = mix(vec3(.02, .2, .66), vec3(.1, .62, 1.), smoothstep(.2, .95, r / len)) * (.55 + .45 * feather) + vec3(.5, .56, .6) * blade * .16;
            gl_FragColor = vec4(col * uLight, clamp(a, 0., .85));
          }` }));
    kfWings.matrixAutoUpdate = false; kfWings.frustumCulled = false; kfWings.visible = false; kfWings.renderOrder = 6; scene.add(kfWings);
    await ctx.yield();
    const ringU = { uK: { value: 0 }, uCol: { value: new THREE.Color(L.fog).multiplyScalar(0.8).add(new THREE.Color(L.sun).multiplyScalar(0.3)) } };
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: ringU,
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xz / 6.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: /* glsl */`varying vec2 vQ; uniform float uK; uniform vec3 uCol;
        void main(){ float r = length(vQ);
          float a = (1. - smoothstep(0., .06, abs(r - uK * .95))) + .7 * (1. - smoothstep(0., .05, abs(r - uK * .6))) + .5 * (1. - smoothstep(0., .04, abs(r - uK * .3)));
          a = a * (1. - uK) + (1. - smoothstep(0., .14, r)) * (1. - smoothstep(0., .3, uK)) * 1.5;
          gl_FragColor = vec4(uCol, clamp(a, 0., 1.) * .9); }` }));
    ring.position.set(-2.6, 16.07, 165.2); ring.visible = false; ring.renderOrder = 2; scene.add(ring);
    if (!snowy) {
      const bul = { body: '#5a4a3c', belly: '#d8cdb8', wingC: '#4a3c30', trail: '#6a5846', tip: '#2a211a', head: '#1c1816', beak: '#1c1816' };
      for (const [zh, y] of [[326, 32.6], [201, 24.6]]) birds.push(F.makeFlock({ rng: rng.fork('bulbul' + zh), species: 'swifts', count: 5, size: 1.8, speed: 4.5, center: [5.5, y, zh], radius: 3.4, height: 0.6, wobble: 0.5,
        spread: [1.6, 0.5, 5], wander: [0.6, 0.4, 0.6, 1.2], flap: 7, amp: 0.8, glide: 0.1, light: fLight, ...bul }));
      birds.push(F.makeDragonflies({ rng: rng.fork('dragon'), path, uFrom: uu(0.44), uTo: uu(0.6), count: Math.round(46 * detail), size: 5, varieties: [['#ff3a2a', '#40100a'], ['#ff5a1a', '#3a0e08']], clear: 3.5, spread: 11, lift: [-3.2, 0.4], light: fLight }));
    }
    for (const c of birds) scene.add(c.object);
    await ctx.yield();
    const dr = rng.fork('ducks'), duckD = [];
    const ducks = new THREE.InstancedMesh(duckGeometry(dr.chance(0.3)), hero.materials.stone, 6);
    for (let i = 0; i < 6; i++) { const ud = U_EXIT + 0.028 + i * 0.0075, p = path.pointAt(ud), side = i % 2 ? 1 : -1; duckD.push({ u: ud, x: p.x + side * dr.range(3.6, 5.6), z: p.z + dr.range(-3, 3), side, ph: dr.range(0, 6.28), yaw: dr.range(-0.6, 0.6) }); }
    ducks.frustumCulled = false; ducks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(ducks);
    const blizz = rareTree ? makeBlizzard(U, Math.round(5600 * detail), new V3(rareTree.x, 30, rareTree.z), rng.fork('blizzard'), [L.leaf[0], L.leaf[1]]) : null;
    if (blizz) scene.add(blizz.mesh);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // ---- the frame
    const camP = new V3(), gA = new V3(), gB = new V3();
    const pav = new V3(0, 11, -80);
    const gC = new V3(), gD = new V3(), gE = new V3(); let tall = 0;
    const pois = [
      { at: new V3(0, 10, -80), from: 0.07, to: 0.352, weight: 0.96 },                                                     // the grand view: up through the avenue, the gaze held on the pavilion at the garden's end
      { at: (t, u) => { path.pointAt(u, gD); gD.set(-0.5, gD.z > 212 ? 17 : 14.5, Math.min(gD.z - 16, 190)); const k = sstep(0.398, 0.418, u) * (1 - sstep(uu(0.46), uu(0.476), u)); return k > 0 ? gD.lerp(kfAt(kfS(u), gC), k) : gD; },
        from: 0.34, to: uu(0.478), weight: 0.85 },  // the dive, nose down onto the second chute; from 0.40 the eye finds the kingfisher hanging over it and follows it down into the water
      { at: new V3(-3.1, 23.2, 166), from: uu(0.44), to: uu(0.474), weight: 0.5 },                                                // the kingfisher over the canal
      { at: pav, from: uu(0.468), to: uu(0.59), weight: 0.72 },                                                                   // the pavilion beyond the bright lip
      { at: new V3(2, 6.4, 90.5), from: uu(0.572), to: uu(0.634), weight: 0.85 },                                                      // down into the corner: the great fall from outside, its face and the gallery mouth behind it
      { at: (t, u) => { path.pointAt(u, gA); return gA.set(gA.x - 17, 6.6, 99.8); }, from: uu(0.622), to: uu(0.65), weight: 0.4 },   // the niches at the close pass, ahead and left
      { at: () => gE.set(-37, 7.3, 93.2 + 1.6 * tall), from: uu(0.628), to: uu(0.692), weight: 0.85 },   // then THE IMAGE: down the gallery to its bright mouth, a touch toward the wall: niches left, glass right (a tall frame leans further to the niches)
      { at: rare ? new V3(-114, 33, 20) : new V3(6, 9, -40), from: uu(rare ? 0.686 : 0.674), to: uu(rare ? 0.772 : 0.75), weight: 0.86 },                             // out of the mouth: the tank and the pavilion past the falling water's edge
      { at: pav, from: uu(rare ? 0.765 : 0.74), to: uu(0.94), weight: 0.6 },
    ];
    const clamp01 = (x) => Math.min(1, Math.max(0, x));
    return {
      scene, path, duration: DUR,
      // linger on the grand view and behind the water, hurry across the east lawn
      pace: (u) => 1.1 - 0.34 * sstep(0.17, 0.215, u) * (1 - sstep(0.295, 0.345, u)) - 0.5 * sstep(uu(0.6), uu(0.635), u) * (1 - sstep(uu(0.705), uu(0.74), u)) + 0.18 * sstep(uu(0.47), uu(0.5), u) * (1 - sstep(uu(0.56), uu(0.6), u)),
      title: lookName === 'april' ? 'The Chinar Terraces in April' : snowy ? (night ? 'The Chinar Terraces by Moonlight' : 'The Chinar Terraces, First Snow') : 'The Chinar Terraces',
      camera: { fov: 56, near: 0.3, far: 3800, lookAhead: 22, sway: 0.6, bank: 0.45 },
      pois,
      portal: { shape: 'arch', width: A.portalSeat.width, height: A.portalSeat.height, color: L.portal, glow: 1, revealDistance: 300 },
      post: { exposure: L.exposure, bloom: { strength: night ? 0.5 : 0.32, radius: 0.62, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: night ? '#060a1c' : '#0c1a2c', vignette: 0.3, grain: 0.02, aberration: 0, ...(L.grade || {}) } },
      ride: 'none',
      update(dt, t, camera, u) {
        time.value = t; tall = camera.aspect < 1 ? 1 : 0;
        sky.update(dt, t, camera); wind.update(t);
        camP.setFromMatrixPosition(camera.matrixWorld); outside.update(camP.x, camP.z);
        hero.setProgress((u - (U_EXIT - 0.75 * U_SEC)) / (1.7 * U_SEC), 1);    // threads of the fall cross the right of the frame as the eye rounds its end
        hero.update(dt, t, camera);
        set.update(dt, t, camera);
        // falling leaves thin out under roofs: the gatehouse, the gallery behind the sheet, the pavilion
        const open = (1 - 0.75 * (1 - sstep(0.029, 0.085, u))) * (1 - sstep(uu(0.595), uu(0.63), u) * (1 - sstep(uu(0.7), uu(0.725), u))) * (1 - sstep(0.935, 0.955, u));
        const high = 1 - 0.6 * sstep(0.17, 0.22, u) * (1 - sstep(0.31, 0.36, u));       // fewer in the open air above the crowns
        fallA.setOpacity(open * high); fallB.setOpacity(open * high);
        farGlow.object.visible = u < uu(0.6);
        if (rain) rain.setOpacity(0.5 * sstep(0.31, 0.38, u) * (1 - sstep(0.47, 0.56, u)));
        // birds
        hoopoes.update(dt, t, camera, u);
        for (let i = 0; i < birds.length; i++) birds[i].update(dt, t, camera, u);
        const ks = kfS(u);
        const kfOn = u > 0.368 && ks < kfLen * 0.995;
        kfBody.visible = kfOn; kfWings.visible = kfOn;
        if (kfOn) {
          const hov = sstep(kfHover * 0.7, kfHover * 0.97, ks), dive = sstep(kfHover, kfHover + 1.6, ks);
          kfAt(ks, kfP); kfP.y += hov * (1 - dive) * 0.07 * Math.sin(t * 6.3);
          kfE.set(-0.1 - 0.42 * hov + 1.85 * dive, 0.82 + 0.4 * hov, 0.12 * Math.sin(t * 2.3) * hov * (1 - dive));
          Q.setFromEuler(kfE); S3.setScalar(1.1); M4.compose(kfP, Q, S3);
          kfBody.setMatrixAt(0, M4); kfBody.instanceMatrix.needsUpdate = true; kfWings.matrix.copy(M4); kfWings.matrixWorldNeedsUpdate = true; kfU.uFold.value = dive;
        }
        const rk = clamp01((u - uu(0.4515)) / 0.03); ring.visible = rk > 0 && rk < 1; ringU.uK.value = rk;
        // mallards paddle aside as the camera comes out of the falls
        for (let i = 0; i < duckD.length; i++) {
          const d = duckD[i], k = sstep(d.u - 0.034, d.u + 0.004, u), pad = Math.sin(t * 2.1 + d.ph);
          place(ducks, i, d.x + d.side * 6 * k + 0.2 * pad, -0.06 + 0.03 * Math.sin(t * 1.7 + d.ph) + 0.06 * Math.sin(k * Math.PI), d.z - 5 * k + 0.3 * Math.cos(t * 0.6 + d.ph),
            0.7, 0.9, 1.0, d.yaw * (1 - k) + (d.side > 0 ? -1.9 : 1.9) * k + 0.12 * pad);
        }
        ducks.instanceMatrix.needsUpdate = true;
        // the rare event: one chinar stripped in three seconds, its leaves across the tank
        if (blizz) {
          const strip = Math.pow(clamp01((u - (U_EXIT + 0.004)) / (1.7 * U_SEC)), 0.7);
          rareMat.alphaTest = 0.4 + 0.63 * strip; rareFull.visible = strip < 0.999;
          const rk2 = clamp01((u - (U_EXIT + 0.004)) / 0.19); blizz.uniforms.uRare.value = rk2; blizz.mesh.visible = rk2 > 0;
          hero.setLight({ leafMore: 0.5 * sstep(0.78, 0.93, u) });
        }
      },
      dispose() { sky.dispose(); hero.dispose(); fgeo0.dispose(); },
    };
  },
};
