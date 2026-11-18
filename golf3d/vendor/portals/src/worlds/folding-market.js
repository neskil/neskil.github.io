// THE FOLDING MARKET. Late morning in a Thai railway market, from the cab of a diesel railcar: a tunnel of glowing
// cloth folds back in a wave just ahead of the buffers and drops shut again behind.
// The world is built in the hero's lane coordinates: s = metres along the lane (first awning at s = 0, last at
// s = LEN), x = metres right of the rail centreline. World space is the hero's local space: travel is toward -Z
// (z = LEN/2 - s), +X is right; the lane's two bends are sheared in by offsetAt(s).
//   s = -16        entry, on the open level crossing
//   s = 0..369     the market (hero), cut into rooms of different width, height, light and colour:
//     0..66      the tight cloth corridor: the folding wave close overhead, a dim cloth-lit tunnel ahead
//     66..111    an open sun square: house fronts set back, market umbrellas, a flame tree, a tuk-tuk crossing the rails
//     111..120   three rows of cloth that lift like a curtain on the hall
//     120..186   the lantern hall: a tin roof on trusses, three rows of paper lanterns, sun shafts through three roof slits
//     186..195   three rows of cloth that lift like a curtain on the canal
//     195..285   the line climbs a timber trestle (4.8 m) and crosses the canal on a girder span (222..252); the long-tail
//                comes down the basin on the left and passes under the bridge, a wat stands at the head of the basin; down the far
//                ramp the cloth stands raised either side (252..277) and from the crest the cloth roofs unzip below
//     285..345   the flower quarter: marigold and saffron cloth only, walls of garlands, heaps of flowers, drifting petals
//     345..369   the last rows lift like theatre curtains on the station
//   s = 369..434   the station yard: platform right, passing loop left, rain tree; portal at s = 434; beyond it the one chedi, 60 m left of the
//                track at s = 470, and far over the axis the cloud towers
// Looks by seed / ctx.vary.hour: late morning (default), sun-shower, golden afternoon, night market. A festival day
// (by seed) adds paper lanterns, bunting and three times the garlands. Rare event: a gust at s = 250 lifts every
// awning as far as the station in one ripple.
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig, skyDirection } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, buildCab, buildRailcar } from '../parts/folding-market.js';

// THE AWNINGS' SWING (the parts file's uAwn). false: as built (shut cloth slopes 24 degrees down to a free edge about 2.1 m up; a lifted
// panel stands 70 degrees up, a 94 degree swing; the valance and the front skirt hang deep while the cloth is shut). true: the design's own
// numbers on every row of the line: the free edge of a shut panel 2.7 m above the rail (the panel slopes 12.3 degrees), a 75 degree swing
// (a lifted panel stands 62.7 degrees up), valance and skirt short enough that the shut rows ahead are a low roof to look under.
const AWNING_SWING_DESIGN = false;
// THE AWNINGS' CLEARANCE OVER THE FLIGHT LINE: one rule of height for the whole line (the parts file's fmClearK). Within AWN_CLEAR.ahead
// metres in front of the cab, no part of the frame of a lifted or lifting panel that stands further than AWN_CLEAR.wall out from its own
// wall may be lower than AWN_CLEAR.h above the flight line; a panel that would be swings further up on its hinge (to 79 degrees with these
// numbers: as upright as a panel can stand without touching the cornice of its own shop). No panel is moved, taken out or re-timed. Over the
// next AWN_CLEAR.ease metres the rule eases off, so the rows beyond lift as the wave has them. null: no rule (the awnings as they were).
const AWN_CLEAR = { h: 4.8, wall: 0.7, ahead: 10, ease: 4 };
const PALETTE = ['#F4C21B', '#F08A2C', '#A9B45A', '#6F9BC4', '#FFF6DC', '#2E2A1C', '#C8281E'];
const LEN = 369, EYE = 2.55, S_ENTRY = -16, S_PORTAL = LEN + 65;
const YARD = [66, 111], HALL = [120, 186], RAMP = [195, 222, 252, 285], SPAN = [222, 252], QUAY = 207, FLOWER = [285, 345], RISE = 4.8;
// rooms for the hero: [s0, s1, side (-1 left, 1 right, 0 both), kind (0 open ground, 1 stalls without cloth, 2 roofed hall, 3 flower quarter)]
const ZONES = [[YARD[0], YARD[1], 0, 0], [HALL[0], HALL[1], 0, 2], [RAMP[0], QUAY, 0, 1], [QUAY, SPAN[0], -1, 0], [QUAY, SPAN[0], 1, 1], [SPAN[0], SPAN[1], 0, 0], [FLOWER[0], FLOWER[1], 0, 3]];
const inOpen = (s, side) => ZONES.some((z) => z[3] === 0 && s >= z[0] && s < z[1] && (z[2] === 0 || z[2] === side));
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rgb = (r, g, b) => ({ r, g, b });
const sc = (c, k) => ({ r: c.r * k, g: c.g * k, b: c.b * k });
const mx = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
const Zs = (s) => LEN / 2 - s;
// the height of the railhead above the ground: up a trestle, level over the canal, down again
const heightAt = (s) => RISE * sstep(RAMP[0], RAMP[1], s) * (1 - sstep(RAMP[2], RAMP[3], s));

const LOOKS = {
  day: {
    title: 'The Folding Market',
    sky: { preset: 'day', zenith: '#245fbc', mid: '#5c98d8', horizon: '#d9e6ec', ground: '#827f78', horizonPow: 9, midPow: 1.0, scatterColor: '#fff3d6', scatter: 0.35,
      sunColor: '#fff6dc', sunIntensity: 12, clouds: false, clouds2: { coverage: 0.22, stretch: 1, opacity: 0.35, scale: 0.9 }, lightColor: '#fff3d8', lightIntensity: 3.3, ambientColor: '#a9c4e6', groundLight: '#8a7f66', ambientIntensity: 1.5 },
    sunEl: 62, sunAz: 145, sunCol: ['#FFF6DC', 2.4], skyCol: [0.12, 0.17, 0.27], shade: 3.2, lamp: [0, 0, 0],
    fog: '#eee9dc', fogD: 0.0004, exposure: 0.9, bloom: { strength: 0.28, radius: 0.6, threshold: 1.0 }, grade: { saturation: 1.1, contrast: 1.10, tint: '#fffaf0', shadowTint: '#0a0c18', vignette: 0.26, grain: 0.02 },
    portal: '#ffb030', glow: 2.0, spill: 2.4, water: ['#3e5a3c', '#9fc4e0'], glit: 0.2, path: 0, lantern: 1.25, treeK: 13,
    cloud: { lit: [1.02, 0.98, 0.90], shd: [0.50, 0.57, 0.76], base: [0.40, 0.43, 0.62], haze: [0.72, 0.82, 0.90], hazeK: 0.5, glow: [0, 0, 0] },
  },
  shower: {
    title: 'The Folding Market: Sun-Shower',
    sky: { preset: 'day', zenith: '#3a69a8', mid: '#86a6c6', horizon: '#e9e6da', ground: '#7c7a73', horizonPow: 3.6, midPow: 1.2, scatterColor: '#fff0c8', scatter: 0.6,
      sunColor: '#fff3d0', sunIntensity: 12, clouds: { coverage: 0.5, softness: 0.4, opacity: 0.9, lit: '#fbf6ea', shade: '#6f7f9c' }, clouds2: false, lightColor: '#fff0cf', lightIntensity: 3.0, ambientColor: '#a4b6cf', groundLight: '#80786a', ambientIntensity: 1.4 },
    sunEl: 55, sunAz: 150, sunCol: ['#FFF2D0', 2.3], skyCol: [0.18, 0.225, 0.30], shade: 3.0, lamp: [0.04, 0.025, 0.01],
    fog: '#e6e3d6', fogD: 0.0011, exposure: 1.0, bloom: { strength: 0.34, radius: 0.65, threshold: 0.98 }, grade: { saturation: 1.08, contrast: 1.07, tint: '#f8fbff', shadowTint: '#060a0c', vignette: 0.3, grain: 0.022 },
    portal: '#ffb030', glow: 2.0, spill: 2.4, water: ['#44583e', '#b9c9d6'], glit: 0.2, path: 0, lantern: 1.3, rain: true, treeK: 13,
    cloud: { lit: [0.92, 0.90, 0.85], shd: [0.40, 0.45, 0.56], base: [0.29, 0.32, 0.42], haze: [0.80, 0.80, 0.74], hazeK: 0.55, glow: [0, 0, 0] },
  },
  golden: {
    title: 'The Folding Market at Golden Hour',
    sky: { preset: 'goldenHour', clouds: false, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.5 } },
    sunEl: 27, sunAz: 206, sunCol: ['#FFB25A', 2.9], skyCol: [0.20, 0.21, 0.30], shade: 2.6, lamp: [0.10, 0.06, 0.025],
    fog: '#f0c79a', fogD: 0.0007, exposure: 1.02, bloom: { strength: 0.36, radius: 0.68, threshold: 0.96 }, grade: { saturation: 1.1, contrast: 1.07, tint: '#fff4e2', shadowTint: '#100604', vignette: 0.3, grain: 0.022 },
    portal: '#ffa428', glow: 2.0, spill: 1.7, water: ['#2b3a33', '#d9a070'], glit: 0.08, path: 0.35, lantern: 1.6, treeK: 13,
    cloud: { lit: [1.02, 0.54, 0.20], shd: [0.50, 0.23, 0.30], base: [0.31, 0.20, 0.32], haze: [0.86, 0.58, 0.38], hazeK: 0.45, glow: [0, 0, 0] },
  },
  night: {
    title: 'The Folding Night Market',
    // (the moon stands low ahead and to the left, over the canal basin: its path lies on the water as the cab crosses the bridge)
    // (round 16: the night sky is a subject of its own: more stars (density 0.8), and the Milky Way's band laid so that it rises from the horizon to the right of
    // the towers and climbs up and to the left over them, its brighter part 34 degrees along it from the horizon; faint (0.26), its core a cool grey, never a white cloud)
    sky: { preset: 'night', zenith: '#081430', mid: '#14285c', horizon: '#2c4a86', ground: '#0a1226', starDensity: 0.8, milkyWay: 0.26, milkyAxis: [-0.59, -0.533, -0.606], milkyAngle: -34, milkyCore: '#c8c2d6', clouds: false,
      clouds2: { coverage: 0.3, stretch: 1, opacity: 0.5, scale: 0.9, lit: '#9fb4ea', shade: '#22305c' },
      bodyOverrides: { 0: { elevation: 22, azimuth: -24, size: 3.0, glow: 0.3 } }, lightElevationMin: 30, lightIntensity: 1.6, ambientIntensity: 2.6 },
    sunEl: 22, sunAz: -24, sunCol: ['#8FA8E0', 0.9], skyCol: [0.09, 0.12, 0.22], shade: 0.5, lamp: [0.75, 0.42, 0.17],
    fog: '#131d3a', fogD: 0.0008, exposure: 1.12, bloom: { strength: 0.4, radius: 0.66, threshold: 0.92 }, grade: { saturation: 1.12, contrast: 1.05, tint: '#fff6ea', shadowTint: '#02040c', vignette: 0.3, grain: 0.012 },
    portal: '#ffc680', glow: 1.6, spill: 1.1, water: ['#14263f', '#5d7ab4'], glit: 0.15, path: 0.4, lantern: 1.0, night: true, treeK: 13, skyR: 1.3, hallLamp: [0.84, 0.63, 0.40],
    // the towers by night (round 16e; the owner: "a moonlit cloud: a pale blue-silver body at about half the moon's own brightness, soft-edged, dark only in the
    // creases between lobes and along the flat base, the lantern amber a faint warmth on the lowest lobes only"). The sky behind is about 0.008, 0.023, 0.10 at 25
    // degrees up and 0.020, 0.055, 0.20 at 5. lit: a lobe's side toward the moon, pale blue-silver (on the picture its lit half comes to about half the moon's disc in
    // linear light; blue over red 2.7 to 1, so it is never the white of the day's tower); shd: its side away from the moon, a little deeper and never dark (0.4 to 0.57
    // of lit, still eleven times the sky's red and three times its blue behind it); tone: one soft ramp from the far side to the moon's side (0.15 to 0.85 of the turn),
    // and rim: a little more light where a lobe turns fully to the moon (the last quarter of the turn); base: the flat base in its own shade, the only dark besides the
    // creases, and form[0]: it has cleared 0.10 above the base; underK: the market's lamp colour (this look's `lamp`) times 0.2, added (never mixed in), so that it is
    // a faint warmth and no fire, and form[1]: gone 0.25 above the base, the height of the lowest lobes; glow: the heat lightning inside the pale body, added: at its
    // rare full height it lifts the lit side by a third and stays under the moon's disc; edge: the outline soft everywhere, 0.012 wide on the moon's side and 0.030
    // away from it, the base fading over 0.02 into the haze; lz 0: the light lies across the picture; moon: the moonlit shading, which only this look switches on:
    // [how sharply the lobes melt into one another (50: a seam about a twentieth of the cloud's height wide), how deep the crease between them (half the light),
    // how much of the small billows' bossing shows (0.6), how far two lobes' normals must part for the full crease (0.3 of their mean's length squared)]
    cloud: { lit: [0.22, 0.32, 0.60], shd: [0.09, 0.14, 0.34], base: [0.02, 0.035, 0.10], haze: [0.020, 0.055, 0.200], hazeK: 0.25, glow: [0.09, 0.07, 0.13],
      rim: [0.03, 0.04, 0.06], underK: 0.2, lz: 0, tone: [0.15, 0.85, 0.75, 1.0], edge: [0.012, 0.030, 0.02, 0], form: [0.10, 0.25, 0, 0], moon: [50, 0.5, 0.6, 0.3] },
  },
};

const WALLS = [rgb(0.56, 0.36, 0.11), rgb(0.33, 0.50, 0.40), rgb(0.62, 0.60, 0.52), rgb(0.60, 0.42, 0.20), rgb(0.40, 0.50, 0.56), rgb(0.60, 0.40, 0.36), rgb(0.58, 0.56, 0.44)];
const SHUT = [rgb(0.10, 0.30, 0.30), rgb(0.30, 0.19, 0.10), rgb(0.20, 0.36, 0.20), rgb(0.16, 0.26, 0.42), rgb(0.44, 0.42, 0.36), rgb(0.42, 0.12, 0.08)];
const CLOTHES = [rgb(0.75, 0.73, 0.66), rgb(0.70, 0.16, 0.12), rgb(0.16, 0.34, 0.60), rgb(0.82, 0.60, 0.10), rgb(0.30, 0.52, 0.34), rgb(0.72, 0.42, 0.52), rgb(0.80, 0.78, 0.74), rgb(0.20, 0.22, 0.30)];
const TRIM = rgb(0.66, 0.63, 0.55), DARK = rgb(0.05, 0.05, 0.055), STEEL = rgb(0.5, 0.5, 0.52), WOOD = rgb(0.33, 0.24, 0.14), TILE = rgb(0.62, 0.25, 0.08), TIN = rgb(0.42, 0.43, 0.44), LEAF = rgb(0.10, 0.26, 0.07), MAGENTA = rgb(0.62, 0.07, 0.3);

// ---------------------------------------------------------------- facade builder
// fr = { ox, os, ux, us, nx, ns }: origin (bottom-left seen from outside), unit along the wall, outward normal, in lane (x, s).
function frameBox(b, fr, u, y, n, su, sy, sn, col, tx = 1, tz = 1, shade = 0.86) {
  const x = fr.ox + fr.ux * u + fr.nx * n, s = fr.os + fr.us * u + fr.ns * n;
  b.box(x, y, Zs(s), Math.abs(fr.ux) * su + Math.abs(fr.nx) * sn, sy, Math.abs(fr.us) * su + Math.abs(fr.ns) * sn, col, tx, tz, shade);
}
const framePt = (fr, u, n) => [fr.ox + fr.ux * u + fr.nx * n, fr.os + fr.us * u + fr.ns * n];
// a window: one quad whose colour channels carry (pane u, v, hash) for the glass shader, which draws the frame, the mullion
// cross and a lit, curtained room. aux 0 dark, 1 lit when lamps are on, 2 temple door or window. alongX: the quad spans x.
function winQuad(b, hsh, cx, cy, cz, w, h, alongX, nrm, aux, panes = 1) {
  if (aux === 0 && b.litAll && hsh < 0.92) aux = 1;   // by night nine rooms in ten are lit
  const hw = w / 2, hh = h / 2, nx = alongX ? 0 : nrm, nz = alongX ? nrm : 0, pm = b.mat, pa = b.aux; b.mat = 7; b.aux = aux;
  const v = (du, dv) => b.vert(cx + (alongX ? du * hw : 0), cy + dv * hh, cz + (alongX ? 0 : du * hw), nx, 0, nz, (du * 0.5 + 0.5) * panes, dv * 0.5 + 0.5, hsh);
  b.quad(v(-1, -1), v(1, -1), v(1, 1), v(-1, 1)); b.mat = pm; b.aux = pa;
}
function frameWin(b, hsh, fr, u, y, n, w, h, aux, panes = 1) { const [x, s] = framePt(fr, u, n), ax = Math.abs(fr.ux) > 0.5; winQuad(b, hsh, x, y, Zs(s), w, h, ax, ax ? -fr.ns : fr.nx, aux, panes); }
function pot(b, x, y, s, R, k = 1, bushes = null) {
  b.mat = 0; b.cyl(x, y, Zs(s), 0.13 * k, 0.18 * k, 0.28 * k, 7, rgb(0.42, 0.2, 0.1));
  if (bushes) { bushes.push([s, x, y + 0.2 * k, k * 0.62]); return; }
  const ph = R.range(0.3, 0.55) * k;
  b.blob(x, y + 0.28 * k + ph * 0.55, Zs(s), ph * 0.8, ph * 0.7, ph * 0.8, LEAF, 5, 3, false, R.chance(0.65) ? MAGENTA : rgb(0.25, 0.42, 0.1));
}
// the storeys of a house that fit under a height no roof of it may pass (a rule of the place it stands in), never fewer than one: 1.0 m is kept for its roof
const storeysUnder = (cap, h0 = 4.6) => (cap === undefined ? Infinity : Math.max(1, Math.floor((cap - h0 - 1.0) / 3.2)));
// a building: volume, facade with windows, shutters, balconies, laundry, pipes, signs; `rich` 0 (far) .. 2 (close-up)
// o.cap: a height no roof of it may pass (the caller gives such a house the storeys that fit under it: storeysUnder)
function building(b, R, fr, W, D, floors, rich, o = {}) {
  const H0 = o.h0 ?? 4.6, FH = 3.2, H = H0 + floors * FH, wall = sc(o.wall || R.pick(WALLS), R.range(0.85, 1.1)), shut = R.pick(SHUT), trim = sc(TRIM, R.range(0.8, 1.05));
  const fb = (...a) => frameBox(b, fr, ...a);
  b.anim = [0, 0, 0, 0]; b.mat = 5; b.aux = 0;
  // a long front reads as two houses: beyond a bay line the wall takes another wash (chosen by its place, not by a random draw)
  const split = !o.skin && !o.wall && rich > 0 && W >= 8.9, bays0 = Math.max(2, Math.round(W / 1.7)), us = split ? (W / bays0) * Math.floor(bays0 / 2) : W;
  let wall2 = wall; if (split) { let wi = Math.floor(Math.abs(fr.os * 7.13 + fr.ox * 3.7)) % WALLS.length; if (Math.abs(WALLS[wi].r * 0.97 - wall.r) + Math.abs(WALLS[wi].g * 0.97 - wall.g) < 0.1) wi = (wi + 2) % WALLS.length; wall2 = sc(WALLS[wi], 0.97); }
  fb(us / 2, H / 2, -D / 2, us, H, D, wall, 1, 1, 0.8); if (split) fb((us + W) / 2, H / 2, -D / 2, W - us, H, D, wall2, 1, 1, 0.8);
  b.mat = 0;
  // roof: parapet and flat slab, or a pitched tin or tile roof
  const pitched = o.pitched ?? R.chance(0.45), roofCol = R.chance(0.5) ? sc(TILE, R.range(0.8, 1.1)) : sc(TIN, R.range(0.8, 1.2));
  if (o.skin) { /* a facade laid on another building's side: no roof of its own */ }
  else if (pitched) { fb(W / 2, H + 0.5, -D / 2, W + 0.5, 1.0, D + 0.9, roofCol, 1, 0.12, 0.85); b.mat = 5; fb(W / 2, H + 0.06, -D / 2, W + 0.3, 0.12, D + 0.6, sc(wall, 0.7)); b.mat = 0; }
  else { b.mat = 5; fb(W / 2, H + 0.3, -0.1, W, 0.6, 0.2, sc(wall, 0.92)); b.mat = 0; fb(W / 2, H + 0.02, -D / 2, W - 0.1, 0.05, D - 0.1, rgb(0.3, 0.29, 0.27)); }
  if (!o.skin && (rich > 0 || R.chance(0.5))) { // roof clutter: water tank, vent, antenna
    const [tx, ts] = framePt(fr, R.range(1.2, W - 1.2), -R.range(1.5, D - 1.5)), ty = H + (pitched ? 0.75 : 0.05);
    b.cyl(tx, ty, Zs(ts), 0.5, 0.5, 1.0, 9, R.chance(0.6) ? sc(rgb(0.25, 0.42, 0.6), 0.8) : STEEL); b.cyl(tx, ty + 1.0, Zs(ts), 0.52, 0.1, 0.14, 9, sc(STEEL, 0.8));
    const [ax, as] = framePt(fr, R.range(0.8, W - 0.8), -R.range(1, 3)); b.box(ax, ty + 1.3, Zs(as), 0.04, 2.6, 0.04, DARK); b.box(ax, ty + 2.3, Zs(as), 0.7 * Math.abs(fr.ux) + 0.03, 0.03, 0.7 * Math.abs(fr.us) + 0.03, DARK);
  }
  if (split) { const [jx, js] = framePt(fr, us, 0.09); b.cyl(jx, 0, Zs(js), 0.05, 0.05, H, 5, sc(STEEL, 0.55), false);   // a downpipe at the join, and the second house's parapet a course higher (1.165 m, where that fits under o.cap)
    if (!pitched && !(H + 1.165 > o.cap)) { b.mat = 5; fb((us + W) / 2, H + 0.85, -0.1, W - us, 0.5, 0.2, sc(wall2, 0.9)); b.mat = 0; fb((us + W) / 2, H + 1.13, -0.1, W - us + 0.06, 0.07, 0.26, trim); } }
  if (rich <= 0) { // far: one window strip per floor
    for (let f = 0; f < floors; f++) { frameWin(b, R(), fr, W / 2, H0 + f * FH + 1.75, 0.037, W - 1.6, 1.3, R.chance(0.6) ? 1 : 0, Math.max(1, Math.round((W - 1.6) / 1.05))); b.mat = 8; b.aux = 0;
      fb(0.5, H0 + f * FH + 1.75, 0.03, 0.5, 1.3, 0.05, shut); fb(W - 0.5, H0 + f * FH + 1.75, 0.03, 0.5, 1.3, 0.05, shut); fb(W / 2, H0 + f * FH + 1.75, 0.035, 0.5, 1.3, 0.05, shut); }
    b.mat = 0; return H;
  }
  fb(W / 2, H + (pitched ? -0.1 : 0.62), 0.12, W + 0.24, 0.16, 0.36, trim);
  fb(W / 2, H0 - 0.05, 0.1, W + 0.1, 0.14, 0.3, trim);
  b.cyl(...((p) => [p[0], 0, Zs(p[1])])(framePt(fr, 0.18, 0.1)), 0.055, 0.055, H, 5, sc(STEEL, 0.6), false);
  const bays = Math.max(2, Math.round(W / 1.7)), bw = W / bays;
  for (let f = 0; f < floors; f++) {
    const y0 = H0 + f * FH, balc = R.chance(0.55), b0 = balc ? R.int(0, bays - 2) : 0, b1 = balc ? Math.min(bays, b0 + R.int(2, 3)) : 0;
    for (let i = 0; i < bays; i++) {
      const u = (i + 0.5) * bw, inB = balc && i >= b0 && i < b1, kind = R();
      if (kind < 0.1 && !inB) { // blank bay with an air-conditioner
        fb(u, y0 + 0.9, 0.22, 0.8, 0.5, 0.4, rgb(0.52, 0.52, 0.5)); fb(u, y0 + 0.9, 0.43, 0.6, 0.36, 0.02, DARK); continue;
      }
      const wy = inB ? y0 + 1.25 : y0 + 1.75, wh = inB ? 2.2 : 1.4, ww = Math.min(0.9, bw - 0.75);
      frameWin(b, R(), fr, u, wy, 0.037, ww, wh, R.chance(0.6) ? 1 : 0);
      b.mat = 8; const open = R.chance(0.75) ? 1 : 0.35;
      fb(u - ww / 2 - 0.2 * open - 0.03, wy, 0.045, 0.4 * open + 0.05, wh, 0.04, sc(shut, R.range(0.8, 1.2))); fb(u + ww / 2 + 0.2 * open + 0.03, wy, 0.045, 0.4 * open + 0.05, wh, 0.04, sc(shut, R.range(0.8, 1.2)));
      b.mat = 0;
      fb(u, wy - wh / 2 - 0.04, 0.08, ww + 0.9, 0.07, 0.18, trim);
      if (rich > 1 && !inB) fb(u, wy + wh / 2 + 0.06, 0.06, ww + 0.3, 0.1, 0.12, trim);
      if (!inB && R.chance(0.22)) { b.mat = 0; fb(u, wy + wh / 2 + 0.25, 0.32, ww + 0.5, 0.06, 0.66, sc(R.pick(CLOTHES), 0.8), 1, 1, 0.7); }
      else if (!inB && R.chance(0.3)) { const [px, ps] = framePt(fr, u, 0.14); b.mat = 0; b.box(px, wy - wh / 2 + 0.06, Zs(ps), 0.9 * Math.abs(fr.ux) + 0.2 * Math.abs(fr.nx), 0.14, 0.9 * Math.abs(fr.us) + 0.2 * Math.abs(fr.ns), rgb(0.3, 0.2, 0.12));
        b.blob(px, wy - wh / 2 + 0.26, Zs(ps), 0.14 + 0.36 * Math.abs(fr.ux), 0.17, 0.14 + 0.36 * Math.abs(fr.us), LEAF, 5, 2, false, R.chance(0.6) ? MAGENTA : rgb(0.8, 0.5, 0.05)); }
    }
    if (balc) {
      const u0 = b0 * bw + 0.1, u1 = b1 * bw - 0.1, uc = (u0 + u1) / 2, wb = u1 - u0;
      b.mat = 0; fb(uc, y0 + 0.06, 0.5, wb, 0.12, 1.0, sc(trim, 0.8));
      b.mat = 6; fb(uc, y0 + 0.57, 0.97, wb, 0.9, 0.035, sc(R.pick([DARK, shut, rgb(0.3, 0.3, 0.3)]), 1.6)); fb(u0 + 0.02, y0 + 0.57, 0.5, 0.035, 0.9, 0.95, sc(DARK, 3)); fb(u1 - 0.02, y0 + 0.57, 0.5, 0.035, 0.9, 0.95, sc(DARK, 3));
      b.mat = 0; fb(uc, y0 + 1.04, 0.97, wb + 0.06, 0.05, 0.07, sc(WOOD, 0.8));
      if (R.chance(0.7)) for (let k = 0, n = R.int(1, 3); k < n; k++) { const [px, ps] = framePt(fr, R.range(u0 + 0.3, u1 - 0.3), 0.72); pot(b, px, y0 + 0.12, ps, R, 0.9); }
      if (R.chance(0.8)) { // a line of laundry above the rail, stirring
        const ly = y0 + 2.25, [ax, as] = framePt(fr, u0, 0.9), [bx, bs] = framePt(fr, u1, 0.9), ph = R.range(0, 6.28), sm = (as + bs) / 2;
        b.anim = [sm, 3, 0.012, 0]; b.tube([[ax, ly, Zs(as)], [(ax + bx) / 2, ly - 0.06, Zs(sm)], [bx, ly, Zs(bs)]], 0.012, 3, rgb(0.7, 0.7, 0.66));
        for (let u = u0 + 0.3; u < u1 - 0.3;) { const w = R.range(0.3, 0.6), h = R.range(0.45, 0.95); b.anim = [sm, 4, ly, ph + u]; fb(u + w / 2, ly - h / 2 - 0.03, 0.9, w, h, 0.016, sc(R.pick(CLOTHES), R.range(0.75, 1.0)), 1, 1, 0.9); u += w + R.range(0.06, 0.3); }
        b.anim = [0, 0, 0, 0];
      }
    }
  }
  if (rich > 0 && R.chance(0.7)) { // a blade sign without text
    const u = R.range(0.6, W - 0.6), y = H0 + R.range(0.6, FH * floors - 1.6), c = R.pick([PAL.red, PAL.saffron, PAL.blue, rgb(0.7, 0.68, 0.6), PAL.green]);
    fb(u, y, 0.62, 0.07, 1.7, 1.0, sc(c, 0.8)); fb(u, y + 0.35, 0.62, 0.09, 0.5, 0.7, mx(c, rgb(0.8, 0.78, 0.66), 0.8)); fb(u, y - 0.4, 0.62, 0.09, 0.14, 0.7, mx(c, rgb(0.8, 0.78, 0.66), 0.8));
    { const ink = sc(c, 0.42); for (let k = -1; k <= 1; k++) fb(u, y + 0.35 + 0.05 * k * k, 0.62 + k * 0.2, 0.105, 0.32 - 0.14 * k * k, 0.13, ink);   // lettering blocks, a rule, a bracket to the wall
      fb(u, y - 0.1, 0.62, 0.085, 0.05, 0.84, sc(c, 0.5)); fb(u, y - 0.66, 0.62, 0.105, 0.1, 0.46, ink); fb(u, y + 0.8, 0.3, 0.04, 0.04, 0.6, DARK); }
  }
  if (o.ground) groundFloor(b, R, fr, W, H0, rich);
  return H;
}
const PAL = { saffron: new THREE.Color(PALETTE[0]), orange: new THREE.Color(PALETTE[1]), green: new THREE.Color(PALETTE[2]), blue: new THREE.Color(PALETTE[3]), red: new THREE.Color(PALETTE[6]) };

// street-level shopfront on a road-facing facade: roller shutters or an open dark shop, a cloth awning, sign band, wares on the pavement
function groundFloor(b, R, fr, W, H0, rich) {
  const fb = (...a) => frameBox(b, fr, ...a), bays = Math.max(1, Math.round(W / 3.2)), bw = W / bays;
  for (let i = 0; i < bays; i++) {
    const u = (i + 0.5) * bw, open = R.chance(0.6), c = R.pick([PAL.saffron, PAL.green, PAL.blue, rgb(0.76, 0.73, 0.64), PAL.orange, PAL.red]);
    if (open) { b.mat = 0; fb(u, 1.45, 0.012, bw - 0.7, 2.9, 0.05, rgb(0.035, 0.03, 0.025)); b.mat = 1; b.aux = b.litAll ? 9 : 5; const [lx, ls] = framePt(fr, u + R.range(-0.5, 0.5), 0.12); b.blob(lx, 2.45, Zs(ls), 0.05, 0.06, 0.05, rgb(1.0, 0.72, 0.36), 5, 3); b.mat = 0; b.aux = 0;
      for (let k = 0, n = R.int(2, 4); k < n; k++) { const hh = R.range(0.5, 1.6); fb(u - bw / 2 + 0.7 + (k + 0.5) * (bw - 1.4) / n, hh / 2, 0.1, (bw - 1.4) / n * 0.8, hh, 0.3, sc(R.pick(CLOTHES), 0.6), 0.9, 0.95); } }
    else { b.mat = 8; fb(u, 1.45, 0.02, bw - 0.7, 2.9, 0.05, sc(R.pick([rgb(0.4, 0.44, 0.46), rgb(0.3, 0.4, 0.5), rgb(0.5, 0.46, 0.36)]), R.range(0.7, 1))); b.mat = 0; }
    fb(u, 3.25, 0.1, bw - 0.4, 0.55, 0.08, sc(c, 0.7)); fb(u, 3.25, 0.15, (bw - 0.4) * 0.7, 0.16, 0.03, mx(c, rgb(0.8, 0.78, 0.66), 0.75));
    if (R.chance(0.75)) { // awning with a valance, stirring
      const [ax, as] = framePt(fr, u, 0.9); b.M.makeRotationX(-fr.ns * 0.26).setPosition(ax, 2.92, Zs(as)); b.box(0, 0, 0, bw - 0.5, 0.04, 1.75, sc(c, 0.85), 1, 1, 0.8); b.M.identity();
      b.anim = [as, 4, 2.72, R.range(0, 6)]; fb(u, 2.6, 1.72, bw - 0.5, 0.24, 0.02, sc(c, 0.7)); b.anim = [0, 0, 0, 0];
    }
    if (rich > 0) for (let k = 0, n = R.int(1, 4); k < n; k++) { const [px, ps] = framePt(fr, u + R.range(-bw * 0.4, bw * 0.4), R.range(0.4, 1.2));
      if (R.chance(0.4)) pot(b, px, 0, ps, R, R.range(1, 1.5)); else { b.mat = 6; const st = R.int(1, 3); for (let j = 0; j < st; j++) b.box(px, 0.16 + j * 0.31, Zs(ps), 0.42, 0.3, 0.58, sc(R.pick([PAL.blue, PAL.blue, PAL.red, PAL.green]), R.range(0.6, 0.9)), 1.06, 1.04, 0.7); b.mat = 0; } }
  }
}

// ---------------------------------------------------------------- small props (lane coordinates) and vehicles (own origin, nose toward -Z)
function wheelX(b, x, y, z, r, w, seg = 10) { b.M.makeRotationZ(Math.PI / 2).setPosition(x + w / 2, y, z); b.mat = 0; b.cyl(0, 0, 0, r, r, w, seg, rgb(0.04, 0.04, 0.045)); b.mat = 3; b.cyl(0, -0.01, 0, r * 0.5, r * 0.5, w + 0.02, 6, STEEL); b.mat = 0; b.M.identity(); }
function scooter(b, R, x, s, lean = 1) {
  const z = Zs(s), c = sc(R.pick([PAL.red, PAL.blue, rgb(0.1, 0.1, 0.12), rgb(0.75, 0.73, 0.66), PAL.green, PAL.orange]), 0.85);
  wheelX(b, x - 0.05, 0.26, z - 0.62, 0.26, 0.1, 9); wheelX(b, x - 0.05, 0.26, z + 0.62, 0.26, 0.1, 9);
  b.mat = 2; b.aux = 0.05; b.box(x, 0.5, z + 0.1, 0.3, 0.3, 1.0, c, 0.8, 0.9); b.box(x, 0.75, z - 0.5, 0.34, 0.6, 0.14, c, 0.7, 1);
  b.mat = 0; b.box(x, 0.8, z + 0.3, 0.3, 0.1, 0.7, DARK, 0.9, 0.95); b.box(x, 1.06, z - 0.52, 0.62, 0.04, 0.05, DARK); b.box(x + 0.22 * lean, 0.2, z + 0.1, 0.03, 0.4, 0.03, STEEL);
  if (R.chance(0.6)) { b.mat = 6; b.box(x, 0.98, z + 0.72, 0.36, 0.26, 0.34, sc(R.pick([PAL.blue, PAL.red, PAL.green]), 0.7)); b.mat = 0; }
}
// a person, small and simple, but with shoulders, arms and a hat or hair so that it reads as a person and not as a pot.
// (x, y, z) is the seat (the feet when standing); yaw 0 faces -Z; o: { hat, yaw, stand, arms (1 = reaching forward), lite }
function figure(b, x, y, z, k, shirt, o = {}) {
  const skin = rgb(0.42, 0.27, 0.17), pm = b.mat, pa = b.aux, up = o.stand ? 0.8 * k : 0, sh = up + 0.52 * k, fw = o.arms ? 1 : 0.4;
  b.M.makeRotationY(o.yaw || 0).setPosition(x, y, z); b.mat = 0; b.aux = 0;
  if (o.stand) for (const sx of [-1, 1]) b.box(sx * 0.09 * k, 0.4 * k, 0, 0.13 * k, 0.8 * k, 0.15 * k, rgb(0.12, 0.13, 0.18), 0.9, 0.9);
  else if (!o.lite) b.box(0, 0.05 * k, -0.2 * k, 0.32 * k, 0.14 * k, 0.46 * k, rgb(0.12, 0.13, 0.18));
  b.box(0, up + 0.27 * k, 0, 0.3 * k, 0.54 * k, 0.2 * k, shirt, 1.4, 1.0, 0.8);
  for (const sx of [-1, 1]) {
    const hx = sx * (o.arms ? 0.2 : 0.15) * k, hy = sh - (o.arms ? 0.17 : 0.4) * k, hz = -0.36 * k * fw;
    b.tube([[sx * 0.2 * k, sh - 0.03 * k, 0], [sx * 0.28 * k, sh - 0.25 * k, -0.1 * k * fw], [hx, hy, hz]], 0.05 * k, 4, sc(shirt, 0.9));
    if (!o.lite) b.blob(hx, hy, hz - 0.03 * k, 0.05 * k, 0.05 * k, 0.05 * k, skin, 4, 2);
  }
  b.cyl(0, sh, 0, 0.05 * k, 0.045 * k, 0.1 * k, 5, skin, false);
  b.blob(0, sh + 0.19 * k, -0.01 * k, 0.1 * k, 0.115 * k, 0.105 * k, skin, 6, 3);
  if (o.hat) b.cyl(0, sh + 0.22 * k, 0, 0.32 * k, 0.015, 0.17 * k, 9, rgb(0.62, 0.52, 0.3), true, 0.8, rgb(0.72, 0.62, 0.38));
  else b.blob(0, sh + 0.2 * k, 0.025 * k, 0.11 * k, 0.11 * k, 0.118 * k, rgb(0.035, 0.03, 0.03), 6, 2, true);
  b.M.identity(); b.mat = pm; b.aux = pa;
}
// a seated figure in a shirt and (three times in four) a conical straw hat, facing the rails
function vendor(b, R, x, y, s, k = 1, lite = false) {
  const shirt = sc(R.pick(CLOTHES), 0.75), hat = R.chance(0.75);
  figure(b, x, y, Zs(s), k, shirt, { hat, yaw: x < 0 ? -Math.PI / 2 : Math.PI / 2, lite });
}
function cat(b, x, y, s, c) {
  const z = Zs(s); b.mat = 0; b.blob(x, y + 0.09, z, 0.12, 0.09, 0.22, c, 6, 3); b.blob(x + 0.02, y + 0.12, z - 0.2, 0.075, 0.07, 0.08, c, 5, 3);
  b.box(x - 0.03, y + 0.2, z - 0.2, 0.035, 0.06, 0.02, c, 0.2, 1); b.box(x + 0.07, y + 0.2, z - 0.2, 0.035, 0.06, 0.02, c, 0.2, 1); b.tube([[x, y + 0.06, z + 0.2], [x + 0.12, y + 0.04, z + 0.28], [x + 0.2, y + 0.05, z + 0.18]], 0.022, 4, c);
}
function garlandStrand(b, R, x, yTop, s, len, n = 4, lat = 3, bead = 0.1) {
  b.anim = [s, 2, yTop, R.range(0, 6.28)]; b.mat = 0;
  const nb = Math.max(n, Math.round(len / bead)), og = R.range(0.38, 0.54), br = 0.046 * Math.sqrt(bead / 0.1);   // round marigold heads, a jasmine bud every fifth, a tassel
  for (let j = 0; j < nb; j++) b.blob(x, yTop - 0.05 - (len * (j + 0.5)) / nb, Zs(s), br, br, br, j % 5 === 4 || j === 0 ? rgb(0.74, 0.72, 0.62) : rgb(0.86, og + 0.04 * (j % 2), 0.03), 4, lat);
  b.blob(x, yTop - len - 0.06, Zs(s), 0.022, 0.05, 0.022, rgb(0.74, 0.72, 0.62), 4, 2); b.blob(x, yTop - len - 0.15, Zs(s), 0.034, 0.06, 0.034, sc(PAL.red, 0.8), 5, 3); b.anim = [0, 0, 0, 0];
}
function tuktuk(b, R, body, canopy) {
  const RX = new THREE.Matrix4().makeRotationX(-Math.PI / 2), red = sc(PAL.red, 0.7), chrome = rgb(0.6, 0.6, 0.62);
  b.mat = 2; b.aux = 0.05;
  b.box(0, 0.42, 0.2, 1.22, 0.2, 2.5, body, 1, 1, 0.7);                                   // floor pan
  b.box(0, 0.8, 0.98, 1.34, 0.6, 0.86, body, 1, 0.94, 0.75); b.blob(0, 0.8, 1.4, 0.67, 0.3, 0.13, body, 8, 3);   // rear tub, rounded tail
  for (const x of [-0.62, 0.62]) b.box(x, 0.68, 0.1, 0.05, 0.36, 0.95, body, 1, 1, 0.8);  // low side panels by the bench
  b.blob(0, 0.5, -1.0, 0.44, 0.64, 0.5, body, 9, 4, true); b.box(0, 0.6, -0.78, 0.86, 0.5, 0.36, body, 0.9, 1, 0.75);   // the rounded front cowl and leg shield
  b.blob(0, 0.3, -1.25, 0.1, 0.36, 0.38, sc(body, 0.85), 8, 3, true);                      // mudguards over the three wheels
  for (const x of [-0.69, 0.69]) b.blob(x, 0.32, 0.9, 0.13, 0.33, 0.38, sc(body, 0.85), 8, 3, true);
  b.mat = 3; b.M.copy(RX).setPosition(0, 0.98, -1.34); b.cyl(0, 0, 0, 0.085, 0.12, 0.16, 9, sc(chrome, 0.6), false, 0.8, chrome); b.M.identity();   // headlamp fairing
  b.box(0, 0.5, -1.47, 0.5, 0.05, 0.06, chrome); b.box(0, 0.52, 1.5, 1.2, 0.06, 0.06, chrome);                                                    // bumpers
  b.mat = 1; b.aux = 3; b.blob(0, 0.98, -1.5, 0.1, 0.1, 0.04, rgb(1, 0.9, 0.7), 7, 3); b.aux = 1.2; for (const x of [-0.56, 0.56]) b.blob(x, 0.86, 1.43, 0.05, 0.05, 0.03, rgb(1, 0.12, 0.05), 5, 2);
  b.mat = 0; b.aux = 0;
  b.tube([[0, 0.95, -1.05], [0, 1.16, -0.86]], 0.03, 4, DARK); b.tube([[-0.36, 1.15, -0.78], [0, 1.18, -0.86], [0.36, 1.15, -0.78]], 0.022, 4, DARK);   // steering column and handlebar
  b.box(0, 0.76, -0.22, 0.5, 0.12, 0.42, red, 0.95, 0.95); b.box(0, 1.0, 0.0, 0.5, 0.4, 0.07, red, 0.9, 1);                         // driver's saddle and back
  b.box(0, 0.84, 0.66, 1.14, 0.16, 0.52, red, 0.97, 0.94); b.M.makeRotationX(0.16).setPosition(0, 1.2, 1.0); b.box(0, 0, 0, 1.14, 0.62, 0.1, sc(red, 0.9), 0.96, 1); b.M.identity();   // passenger bench and its raked back
  // windscreen frame, roof hoops and posts in thin tube; a tinted screen
  const post = rgb(0.5, 0.5, 0.52);
  for (const x of [-1, 1]) { b.tube([[x * 0.5, 1.02, -0.98], [x * 0.56, 1.5, -0.86], [x * 0.6, 1.84, -0.74]], 0.022, 4, post); b.tube([[x * 0.64, 1.08, 1.3], [x * 0.64, 1.84, 1.22]], 0.022, 4, post); b.tube([[x * 0.63, 0.84, 0.36], [x * 0.63, 1.86, 0.3]], 0.018, 4, post); }
  b.tube([[-0.6, 1.84, -0.74], [0, 1.9, -0.76], [0.6, 1.84, -0.74]], 0.022, 4, post); b.tube([[-0.5, 1.03, -0.98], [0.5, 1.03, -0.98]], 0.022, 4, post);
  b.mat = 2; b.aux = 0.05; b.M.makeRotationX(-0.16).setPosition(0, 1.44, -0.87); b.box(0, 0, 0, 1.06, 0.78, 0.02, rgb(0.07, 0.10, 0.12)); b.M.identity(); b.mat = 0; b.aux = 0;
  // the canopy: a low cloth dome over four posts, with a darker rolled edge and a scalloped fringe
  b.blob(0, 1.83, 0.24, 0.74, 0.2, 1.3, sc(canopy, 0.7), 10, 3, true, canopy); b.blob(0, 1.8, 0.24, 0.77, 0.05, 1.33, sc(canopy, 0.5), 10, 2);
  for (const x of [-0.75, 0.75]) for (let k = 0; k < 8; k++) b.box(x * (1 - 0.06 * Math.abs(k - 3.5) / 3.5), 1.72, -0.66 + k * 0.26, 0.02, k % 2 ? 0.1 : 0.15, 0.25, k % 2 ? rgb(0.76, 0.73, 0.64) : sc(canopy, 0.75));
  wheelX(b, -0.06, 0.26, -1.25, 0.26, 0.12); wheelX(b, -0.74, 0.26, 0.9, 0.26, 0.14); wheelX(b, 0.6, 0.26, 0.9, 0.26, 0.14);
  figure(b, 0, 0.82, -0.2, 1, sc(R.pick(CLOTHES), 0.7), { arms: 1 });
  for (let k = 0; k < 7; k++) b.blob(-0.45 + k * 0.15, 1.74 - 0.05 * Math.sin(k / 6 * Math.PI), -0.8, 0.035, 0.035, 0.035, k % 3 === 1 ? rgb(0.76, 0.74, 0.64) : rgb(0.9, 0.5, 0.03), 4, 2);
}
// a skin lofted through rings of points (the same count in each): smooth normals, facing the way ring order x station order turns
function loft(b, rings, colf) {
  const base = b.nv, nj = rings.length, ni = rings[0].length, P = (j, i) => rings[Math.min(nj - 1, Math.max(0, j))][Math.min(ni - 1, Math.max(0, i))];
  for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) {
    const p = rings[j][i], a0 = P(j, i - 1), a1 = P(j, i + 1), b0 = P(j - 1, i), b1 = P(j + 1, i), c = colf(i, j, p);
    const ax = a1[0] - a0[0], ay = a1[1] - a0[1], az = a1[2] - a0[2], bx = b1[0] - b0[0], by = b1[1] - b0[1], bz = b1[2] - b0[2];
    b.vert(p[0], p[1], p[2], ay * bz - az * by, az * bx - ax * bz + 1e-9, ax * by - ay * bx, c.r, c.g, c.b);
  }
  for (let j = 0; j < nj - 1; j++) for (let i = 0; i < ni - 1; i++) { const a = base + j * ni + i, c = a + ni; b.quad(a, a + 1, c + 1, c); }
}
// a Thai long-tail boat, 12.5 m, bow toward -Z, waterline at y = 0: a narrow lofted hull whose sheer sweeps up into a tall
// ribboned stem, thwarts and passengers under a striped canopy, the helmsman at the stern with a car engine on a pivot,
// and the long propeller shaft trailing aft into a rooster tail of spray
function longtail(b, R, glow = 0, moored = false) {
  const hull = R.pick([rgb(0.70, 0.67, 0.58), rgb(0.14, 0.36, 0.52), rgb(0.60, 0.15, 0.08)]), red = sc(PAL.red, 0.9), saf = sc(PAL.saffron, 0.85);
  // stations: [z, half beam, gunwale y, keel y]
  const K = [[-6.8, 0.035, 2.7, 2.42], [-6.3, 0.07, 2.0, 1.55], [-5.5, 0.19, 1.34, 0.74], [-4.3, 0.45, 0.9, 0.2], [-2.5, 0.73, 0.68, -0.1], [0.2, 0.86, 0.6, -0.18], [2.8, 0.8, 0.6, -0.16], [4.6, 0.63, 0.66, -0.08], [5.7, 0.47, 0.76, 0.08]];
  const cr = (a, p, q, d, t) => 0.5 * (2 * p + (q - a) * t + (2 * a - 5 * p + 4 * q - d) * t * t + (3 * p - a - 3 * q + d) * t * t * t), key = (q) => K[Math.min(K.length - 1, Math.max(0, q))];
  const st = (f) => { const j = Math.min(K.length - 2, Math.floor(f)), t = f - j; return [0, 1, 2, 3].map((m) => cr(key(j - 1)[m], key(j)[m], key(j + 1)[m], key(j + 2)[m], t)); };
  const NS = 26, S = []; for (let j = 0; j <= NS; j++) S.push(st((j / NS) * (K.length - 1)));
  b.mat = 2; b.aux = 0.05;
  loft(b, S.map(([z, hw, yg, yk]) => { const ring = []; for (let i = 0; i <= 8; i++) { const a = (i / 8 - 0.5) * Math.PI; ring.push([hw * Math.sin(a) * (1 - 0.1 * Math.cos(a)), yg - (yg - yk) * Math.pow(Math.max(Math.cos(a), 0), 0.7), z]); } return ring; }),
    (i, j, p) => { const z = S[j][0], top = i === 0 || i === 8; if (z < -5.2) return (z < -6.2 ? saf : z < -5.75 ? red : top ? red : sc(hull, 0.95)); return top ? red : i === 1 || i === 7 ? mx(saf, hull, 0.25) : p[1] < 0.12 ? rgb(0.2, 0.07, 0.05) : sc(hull, 0.78 + 0.22 * (p[1] > 0.3 ? 1 : 0.6)); });
  b.mat = 0; b.aux = 0;
  for (const sd of [-1, 1]) b.tube(S.map(([z, hw, yg]) => [sd * hw * 1.02, yg + 0.015, z]), 0.05, 4, red);          // gunwale rails
  { const D = S.filter(([z]) => z > -4.9); loft(b, D.map(([z, hw, yg]) => [[hw * 0.93, yg - 0.3, z], [0, yg - 0.33, z], [-hw * 0.93, yg - 0.3, z]]), (i, j) => sc(WOOD, 0.55 + 0.25 * (j % 2))); }   // the floor boards
  b.box(0, 0.44, 5.7, 0.86, 0.66, 0.06, sc(hull, 0.8), 1.08, 1);                                                    // transom
  // the stem's ribbons and garlands: wound scarves, a loop of marigolds, tails that stream in the boat's own wind
  for (let k = 0; k < 6; k++) { const q = st(0.5 + k * 0.2); b.blob(R.range(-0.1, 0.1) * 0.3, (q[2] + q[3]) / 2 - 0.02, q[0], 0.15 + q[1], 0.1, 0.16, [PAL.red, PAL.saffron, PAL.green, rgb(0.8, 0.3, 0.5), PAL.blue, rgb(0.8, 0.78, 0.7)][k], 6, 3); }
  for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.283; b.blob(Math.sin(a) * 0.22, 1.42 - 0.16 * Math.cos(a) - 0.1, -5.86 + Math.cos(a) * 0.12, 0.065, 0.06, 0.065, k % 4 === 3 ? rgb(0.78, 0.76, 0.66) : rgb(0.9, 0.48, 0.04), 5, 2); }
  for (let k = 0; k < 6; k++) { b.anim = [-1e4, 4, 1.62, k * 1.7]; b.box((k - 2.5) * 0.085, 1.16, -5.78 + 0.02 * k, 0.07, 0.92, 0.012, [red, saf, rgb(0.8, 0.3, 0.5), PAL.green, rgb(0.82, 0.8, 0.72), PAL.blue][k], 1, 1, 0.9); } b.anim = [0, 0, 0, 0];
  b.blob(0, 2.74, -6.82, 0.1, 0.14, 0.1, saf, 6, 3);
  // thwarts, passengers in straw hats, the canopy on its posts
  const zs = [-3.3, -2.0, -0.7, 0.6, 1.9, 3.1];
  for (const z of zs) b.box(0, 0.46, z, 1.36 - 0.05 * Math.abs(z), 0.05, 0.28, WOOD);
  for (let k = 0; k < 3; k++) figure(b, k % 2 ? 0.28 : -0.28, 0.49, zs[1 + k], 1, sc(R.pick(CLOTHES), 0.8), { hat: true });
  figure(b, 0.3, 0.49, zs[1], 1, sc(CLOTHES[3], 0.8), { hat: true }); figure(b, -0.26, 0.49, zs[4], 1, sc(CLOTHES[0], 0.85), {});
  { const cc = sc(R.pick([PAL.blue, PAL.green, rgb(0.76, 0.73, 0.64)]), 0.85), c2 = rgb(0.78, 0.75, 0.66), z0 = -2.9, z1 = 2.9, nz = 8, rings = [];
    for (let j = 0; j <= nz; j++) { const z = z0 + ((z1 - z0) * j) / nz, sag = 0.03 * Math.sin(j * Math.PI), ring = []; for (let i = 0; i <= 6; i++) { const a = (0.5 - i / 6) * 1.9; ring.push([Math.sin(a) * 1.02, 1.62 + 0.42 * Math.cos(a) + sag, z]); } rings.push(ring); }
    if (glow > 5) { b.mat = 1; b.aux = 1.2; }   // at night the canopy glows with the lanterns under it
    loft(b, rings, (i, j) => (j % 2 ? cc : c2)); b.mat = 0; b.aux = 0;   // (striped: the boat's colour and cream, band by band; by night it is lit from inside)
    for (const x of [-0.84, 0.84]) { for (const z of [-2.8, -0.9, 1.0, 2.8]) b.tube([[x * 0.92, 0.62, z], [x, 1.86, z]], 0.022, 4, STEEL);
      for (let k = 0; k < 12; k++) b.box(x, 1.74, z0 + 0.24 + k * 0.485, 0.02, k % 2 ? 0.16 : 0.24, 0.46, k % 2 ? c2 : red); } }
  // the engine on its pivot, the tiller, the long shaft, the helmsman standing at the stern
  b.box(0, 0.86, 4.9, 0.16, 0.66, 0.16, STEEL); b.mat = 3; b.box(0, 1.3, 4.86, 0.5, 0.4, 0.86, rgb(0.2, 0.2, 0.22)); b.cyl(0.2, 1.5, 4.6, 0.09, 0.09, 0.16, 6, rgb(0.5, 0.12, 0.08));
  b.tube([[-0.2, 1.45, 5.0], [-0.26, 1.82, 5.25], [-0.26, 1.86, 5.8]], 0.04, 4, STEEL);
  b.tube([[0, 1.16, 5.2], [0, 0.62, 7.6], [0, -0.04, 10.3]], 0.045, 5, STEEL); b.tube([[0, 1.34, 4.4], [0.1, 1.3, 3.85], [0.2, 1.24, 3.55]], 0.028, 4, STEEL); b.mat = 0;
  figure(b, 0, 0.36, 3.75, 1, sc(R.pick(CLOTHES), 0.75), { stand: true, hat: true });
  // (the rooster tail is a plume of spray sprites the world hangs on the boat)
  if (glow > 0) { b.mat = 1; b.aux = glow; b.blob(0, 2.3, -6.42, 0.1, 0.13, 0.1, rgb(1.0, 0.7, 0.32), 6, 3); for (const x of [-0.93, 0.93]) for (const z of [-2.6, -0.9, 0.9, 2.6]) b.blob(x, 1.66, z, 0.065, 0.085, 0.065, rgb(1.0, 0.72, 0.36), 5, 3); b.blob(0, 1.75, 5.4, 0.07, 0.09, 0.07, rgb(1.0, 0.3, 0.12), 5, 3); b.mat = 0; b.aux = 0; }
}
// a paper lantern round a flame: a pleated barrel of seven gores (bright down each gore, dark at the ribs, brightest low where the flame
// stands), dark caps top and bottom and a tassel. (x, y, z) is the middle of the barrel; the caller hangs it and sets b.anim.
const LANT = [rgb(0.92, 0.12, 0.05), rgb(0.96, 0.42, 0.04), rgb(0.96, 0.70, 0.12), rgb(0.90, 0.20, 0.42), rgb(0.22, 0.74, 0.46)];
function paperLantern(b, x, y, z, r, col, gain) {
  const G = 7, NJ = 4, ry = r * 1.2, PH = 1.08, VF = [0.62, 1.12, 1.0, 0.82, 0.55], base = b.nv, pm = b.mat, pa = b.aux;
  b.mat = 1; b.aux = gain;
  for (let j = 0; j <= NJ; j++) { const ph = -PH + (2 * PH * j) / NJ, cp = Math.cos(ph), sp = Math.sin(ph);
    for (let g = 0; g < G; g++) for (let e = 0; e < 3; e++) { const a = ((g + e * 0.5) / G) * 6.2832, k = VF[j] * (e === 1 ? 1 : 0.36), rr = r * cp * (e === 1 ? 1 : 0.93);
      b.vert(x + Math.cos(a) * rr, y + sp * ry, z + Math.sin(a) * rr, Math.cos(a) * cp, sp, Math.sin(a) * cp, col.r * k, col.g * k, col.b * k); } }
  for (let j = 0; j < NJ; j++) for (let g = 0; g < G; g++) for (let e = 0; e < 2; e++) { const a = base + j * G * 3 + g * 3 + e, c = a + G * 3; b.quad(a, c, c + 1, a + 1); }
  b.mat = 0; b.aux = 0; const yc = Math.sin(PH) * ry, rc = r * Math.cos(PH) * 1.1;
  b.cyl(x, y + yc - 0.012, z, rc, rc * 0.8, 0.05, 6, DARK); b.cyl(x, y - yc - 0.04, z, rc * 0.8, rc, 0.05, 6, DARK);
  b.box(x, y - yc - 0.04 - r * 0.55, z, 0.022, r * 1.1, 0.022, sc(PAL.red, 0.9)); b.blob(x, y - yc - 0.07 - r * 1.1, z, 0.035, 0.05, 0.035, rgb(0.8, 0.6, 0.1), 4, 2);
  b.mat = pm; b.aux = pa;
}
// gilded bell chedi, total height about 38 m at k = 1
function chedi(b, x, s, k, gold, baseK = 1, baseW = 1, glint = 0) {
  const z = Zs(s), white = rgb(0.44, 0.425, 0.385); let y = 0;   // (terraces take the floodlights too: material 9)
  b.mat = 9; for (const [w, h] of [[24, 2.0], [19.5, 1.8], [15.5, 1.7]]) { b.box(x, y + h * k * baseK / 2, z, w * k * baseW, h * k * baseK, w * k * baseW, white, 0.96, 0.96, 0.8); y += h * k * baseK; }
  b.mat = 9;
  const ring = (r0, r1, h, seg = 14) => { b.cyl(x, y, z, r0 * k, r1 * k, h * k, seg, sc(gold, 0.8), true, 0.85, gold); y += h * k; };
  ring(6.6, 6.2, 1.0, 8); ring(5.9, 5.6, 0.9, 8); ring(5.3, 5.3, 0.5); ring(5.5, 4.9, 1.3); ring(4.9, 3.5, 2.8); ring(3.5, 2.3, 2.6); ring(2.3, 1.7, 1.4);
  b.box(x, y + 0.7 * k, z, 3.0 * k, 1.4 * k, 3.0 * k, gold, 0.9, 0.9, 0.8); y += 1.4 * k;
  for (let i = 0; i < 9; i++) { const r = 1.45 - i * 0.11; ring(r, r * 0.72, 0.8, 10); }
  if (glint > 0) { ring(0.9, 0.2, 6.4, 8);   // the great chedi: a stouter spire, a tiered umbrella (hti) and a gilded bud that burns in the sun, so it reads from half a kilometre
    for (const [r, h] of [[1.05, 0.34], [0.78, 0.3], [0.52, 0.28]]) { b.cyl(x, y, z, r * k, r * 0.5 * k, h * k, 10, sc(gold, 0.85), true, 0.8, gold); y += h * k; }
    b.mat = 1; b.aux = glint; b.blob(x, y + 0.42 * k, z, 0.4 * k, 0.66 * k, 0.4 * k, rgb(1.0, 0.7, 0.24), 7, 4); b.aux = 0; y += 1.0 * k; }
  else { ring(0.5, 0.04, 6.4, 8); b.blob(x, y, z, 0.3 * k, 0.5 * k, 0.3 * k, gold, 6, 3); }
  b.mat = 0; return y;
}
// temple hall with stacked, upswept orange-and-green roofs; gable faces -s (toward the oncoming train)
function templeHall(b, x, s, W, L, k, gold, o = {}) {
  const z = Zs(s + L / 2), white = rgb(0.68, 0.66, 0.6), hw = W / 2, wallH = 5.2 * k;
  b.mat = 5; b.box(x, wallH / 2 + 0.6, z, W, wallH, L, white, 1, 1, 0.8); b.box(x, 0.3, z, W + 2.4, 0.6, L + 3, sc(white, 0.85)); b.mat = 0;
  const nW = o.nWin || 5, wW = o.winW || 1.0, wHt = wallH * (o.winH || 0.5);   // (o: a longer row of taller windows, a tall gilded finial on the front gable)
  for (let i = 0; i < nW; i++) for (const sd of [-1, 1]) winQuad(b, 0.13 + i * 0.17, x + sd * (hw + 0.06), 0.6 + wallH * 0.5, Zs(s + (i + 0.5) * L / nW), wW, wHt, false, sd, 2);
  winQuad(b, 0.5, x, 0.6 + wallH * 0.42, Zs(s) + 0.08, 1.8 * k, wallH * 0.8, true, 1, 2, 2);
  let y = wallH + 0.6;
  for (let t = 0; t < 3; t++) {
    const w = (hw + 1.6) * (1 - t * 0.24), len = L * (1 - t * 0.2) + 2.2, rise = w * 0.95, sl = Math.hypot(w, rise), ang = Math.atan2(rise, w);
    for (const sd of [-1, 1]) {
      b.M.makeRotationZ(-sd * ang).setPosition(x + sd * w / 2, y + rise / 2, z); b.box(0, 0, 0, sl + 0.5, 0.22, len, sc(TILE, 1.15), 1, 1, 0.9);
      b.box(-sd * (sl / 2 + 0.1) * -1, 0.02, 0, 0.9, 0.25, len + 0.06, rgb(0.12, 0.34, 0.16)); b.box(0, 0.03, len / 2 - 0.2, sl + 0.5, 0.25, 0.4, rgb(0.12, 0.34, 0.16)); b.box(0, 0.03, -len / 2 + 0.2, sl + 0.5, 0.25, 0.4, rgb(0.12, 0.34, 0.16));
      b.M.identity();
      b.mat = 9; b.M.makeRotationZ(sd * 0.5).setPosition(x + sd * (w + 0.5), y + 0.2, z + len / 2); b.box(0, 0.5, 0, 0.16, 1.5 * k, 0.16, gold, 0.1, 0.1); b.M.makeRotationZ(sd * 0.5).setPosition(x + sd * (w + 0.5), y + 0.2, z - len / 2); b.box(0, 0.5, 0, 0.16, 1.5 * k, 0.16, gold, 0.1, 0.1); b.M.identity(); b.mat = 0;
    }
    for (const e of [-1, 1]) { b.mat = t === 0 ? 0 : 9; b.box(x, y + rise / 2, z + e * (len / 2 - 0.5), w * 2 - 0.6, rise, 0.2, t === 0 ? sc(PAL.red, 0.5) : gold, 0.02, 1, 0.8); b.mat = 9; b.box(x, y + rise + 0.9 * k, z + e * (len / 2), 0.18, 2.0 * k, 0.18, gold, 0.1, 0.1); } b.mat = 0;
    y += rise * 0.5;
    if (t === 2 && o.finial) {   // a chofa: the tall gilded horn that sweeps up and forward from the front gable's apex, and a smaller one behind
      const yA = y + rise * 0.5 + 0.6 * k, zF = z + len / 2, F = o.finial;
      b.mat = 9; b.tube([[x, yA - 0.5, zF], [x, yA + 0.34 * F, zF + 0.16 * F], [x, yA + 0.62 * F, zF + 0.02 * F]], 0.26 * k, 5, gold);
      b.tube([[x, yA + 0.6 * F, zF + 0.03 * F], [x, yA + 0.84 * F, zF + 0.1 * F], [x, yA + F, zF + 0.34 * F]], 0.14 * k, 5, gold);
      b.blob(x, yA + 0.62 * F, zF + 0.02 * F, 0.36 * k, 0.3 * k, 0.36 * k, gold, 6, 3);
      b.tube([[x, yA - 0.5, z - len / 2], [x, yA + 0.3 * F, z - len / 2 - 0.1 * F], [x, yA + 0.52 * F, z - len / 2 + 0.02 * F]], 0.18 * k, 4, gold); b.mat = 0;
    }
  }
  return y;
}

// kit/sky.js bakes two 256 x 256 noise textures, each in one go (about 30 ms a piece on the test machine: the build's two longest
// steps). Both kit calls take a ready texture, so the same textures are made here in short steps and handed over.
async function skyNoiseTexture(pause) {   // as the kit's makeSkyNoise: R and B white noise, G = R shifted by (37, 17)
  const S = 256, d = new Uint8Array(S * S * 4); let a = 0x2545f491;
  const r = () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) & 255; };
  for (let y = 0, i = 0; y < S; y++) { for (let x = 0; x < S; x++, i++) { d[i * 4] = r(); d[i * 4 + 2] = r(); d[i * 4 + 3] = 255; } if ((y & 31) === 31) await pause(); }
  for (let y = 0; y < S; y++) { for (let x = 0; x < S; x++) d[(y * S + x) * 4 + 1] = d[(((y + 17) & 255) * S + ((x + 37) & 255)) * 4]; if ((y & 63) === 63) await pause(); }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}
async function cloudNoiseTexture(rng, pause, size = 256) {   // as the kit's makeNoiseTexture: tileable fbm in R and G, B and A shifted copies of R
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
          acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
        }
        if ((y & 63) === 63) await pause();
      }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1;
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  for (let y = 0; y < size; y++) { for (let x = 0; x < size; x++) {
    const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
    data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s]); data[p * 4 + 3] = px(f[0][s2]); }
    if ((y & 31) === 31) await pause(); }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

export default {
  id: 'folding-market',
  name: 'The Folding Market',
  category: 'city',
  media: ['rail', 'open'],
  weirdness: 0.05,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('fm-variant'), qd = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    vr();
    const hour = vary.hour || 'any', pick = vr.pick(['day', 'golden', 'day', 'shower', 'night', 'day', 'golden']);
    const lookId = hour === 'night' ? 'night' : hour === 'golden' || hour === 'dawn' ? 'golden' : hour === 'day' ? (pick === 'shower' ? 'shower' : 'day') : pick;
    const look = LOOKS[lookId], rare = !!vary.rare, festival = rng.fork('fm-festival').chance(0.3), livery = rng.fork('fm-livery').pick([0, 1, 0, 2, 0, 3, 0]), bendK = vr.range(0.11, 0.16) * (vr.chance(0.25) ? -1 : 1);
    const duration = 40.5, scene = new THREE.Scene(), T = { value: 0 };
    await ctx.yield();

    // ----- sky, light, fog -----
    const PR = makeRng((ctx.seed ^ 0x3c6ef372) >>> 0);   // a stream of its own for this round's additions: the world's other draws stay exactly as they were
    const skyNoise = await skyNoiseTexture(ctx.yield);
    await ctx.yield();
    const skyOpts = { rng, ...look.sky, renderer: ctx.renderer, bake: false, noiseTexture: skyNoise };   // (not baked: the night sky's bake was a 50 ms build step, and its moon and milky way are cheap on a GPU)
    if (!look.night) { skyOpts.sunElevation = look.sunEl; skyOpts.sunAzimuth = look.sunAz; }
    const sky = makeSky(skyOpts); scene.add(sky.object);
    // Kit workaround (kit/sky.js): the dome is two fans whose apexes sit exactly at the zenith and nadir, so with a
    // perfectly level camera (this flat railway) each apex lands on w = 0 and the software renderer drops the whole sky.
    // Tip the apexes a hair off the axis; nothing visible changes.
    sky.object.traverse((o) => { const pa = o.geometry && o.geometry.attributes.position; if (pa && pa.count === 17) { pa.setZ(0, 0.012); pa.needsUpdate = true; } });
    scene.fog = new THREE.FogExp2(new THREE.Color(look.fog), look.fogD);
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: 0.3 }); scene.add(rig.object);
    const sunDir = skyDirection(look.sunEl, look.sunAz);
    await ctx.yield();

    // ----- the hero lane, bends sheared in -----
    const ramp = (s, a, b) => { if (s <= a) return 0; if (s >= b) return (b - a) / 2 + (s - b); const t = (s - a) / (b - a); return (b - a) * (t * t * t - (t * t * t * t) / 2); };
    const offsetAt = (s) => bendK * (ramp(s, 94, 134) - ramp(s, 184, 224)), OFF = offsetAt(LEN);
    // market umbrellas standing free in the square (the hero instances them with its stall parasols): [s, x, base y, scale]
    const YR = rng.fork('fm-yard'), umbrellas = [];
    for (let i = 0; i < 15; i++) { const side = i % 2 ? 1 : -1, s = YARD[0] + 4.5 + Math.floor(i / 2) * 5.4 + YR.range(-0.8, 0.8), x = side * (i % 4 < 2 ? YR.range(5.2, 7.0) : YR.range(9.0, 11.6));
      if ((side < 0 && Math.hypot(x + 11, s - 90) < 4.6) || Math.abs(s - 100) < 2.3 || (side > 0 && Math.hypot(x - 9.6, s - 84) < 2.2)) continue;
      umbrellas.push([s, x, 0, YR.range(1.3, 1.6)]); }
    const nUmb0 = umbrellas.length;   // four more stalls close to the line, so the square is never bare paving beside the cab (drawn from PR: the yard's own draws stay as they were)
    for (const [s, x] of [[76.2, -6.3], [87.0, 6.2], [96.4, -6.0], [108.0, 6.3]]) { const k = PR.range(1.3, 1.55); if (umbrellas.length < 16 && !umbrellas.some((u) => Math.hypot(u[0] - s, u[1] - x) < 3.3)) umbrellas.push([s + PR.range(-0.3, 0.3), x, 0, k]); }
    const hero = await buildHero(ctx, { palette: PALETTE, length: LEN, offsetAt, sunDir: sunDir.toArray(), railcar: false, zones: ZONES, heightAt, span: SPAN, bridge: [RAMP[0] + 2, RAMP[3] - 2], waterCut: SPAN,
      freeParasols: umbrellas, ramp: 11, after: 120, lead: 3, detail: 0.44, cullAhead: 215, bulbGain: look.night ? 1.1 : 1, blue: [SPAN[1], RAMP[3]], tubeGain: look.night ? 7 : look.lamp[0] > 0.05 ? 3.2 : 1.3, wireMin: 4.92, weeds: true,
      swing: AWNING_SWING_DESIGN ? [-Math.asin((3.7 - (0.15 + 2.7)) / 4), (75 * Math.PI) / 180, 0.0, 0.7] : [-0.42, 1.642, 1.6, 2.5],
      clear: AWN_CLEAR ? [AWN_CLEAR.h, AWN_CLEAR.ahead, AWN_CLEAR.ease, AWN_CLEAR.wall] : null });
    scene.add(hero.object);
    const U = hero.uniforms;
    U.uYard.value.set(YARD[0], YARD[1], 14, 8.6);
    umbrellas.forEach(([us, ux, , uk], i) => { if (i < 16) U.uUmb.value[i].set(ux + offsetAt(us), Zs(us), 1.2 * uk, 1.85 * uk); });
    // the cloth set, by seed: two visits in five the whole roof is bleached white and cream, or blue and white
    { const cr = rng.fork('fm-cloth'), q = cr(), set = q < 0.2 ? [[0.68, 0.655, 0.56], [0.66, 0.58, 0.40], [0.64, 0.555, 0.35], [0.84, 0.60, 0.10]] : q < 0.4 ? [[0.16, 0.30, 0.56], [0.80, 0.78, 0.69], [0.36, 0.55, 0.74], [0.70, 0.16, 0.12]] : null;   // (each set keeps one saturated colour, so no V of cloth is all beige)
      if (set) set.forEach((c, i) => U.uPal.value[i].setRGB(c[0], c[1], c[2])); if (q < 0.2) U.uBandK.value = 1; }
    U.uSunCol.value.set(look.sunCol[0]).multiplyScalar(look.sunCol[1]); U.uSkyCol.value.setRGB(...look.skyCol);
    // (under shut cloth the lane sits at about a tenth of the sunlit value, lit in the cloth's own colour, so that the tunnel ahead reads dim and rich)
    U.uShade.value.multiplyScalar((look.shade / 3.2) * (look.night ? 1 : 0.6)); U.uTintK.value = look.night ? 1 : 0.55; U.uLamp.value.setRGB(...look.lamp); U.uWet.value = look.rain ? 1 : 0;
    U.uHallLamp.value.setRGB(...(look.hallLamp || [0.62, 0.35, 0.145]));   // (by night the hall's lanterns give a warm white, so the goods keep their colours)
    U.uPortal.value.set(offsetAt(S_PORTAL), 0, Zs(S_PORTAL), look.spill); U.uPortalCol.value.set(look.portal);
    const W3 = (s, x, y, out = new THREE.Vector3()) => out.set(x + offsetAt(s), y, Zs(s));
    await ctx.yield();

    // ----- the flight: the railhead, exactly -----
    const pts = []; for (let s = S_ENTRY; s <= S_PORTAL + 0.01; s += 6) pts.push([offsetAt(s), EYE + heightAt(s), Zs(s)]);
    const path = makePath(pts), uOf = (s) => (s - S_ENTRY) / (S_PORTAL - S_ENTRY);

    // ----- static town geometry in lane coordinates, chunked along the lane -----
    const R = rng.fork('fm-town'), NB = 9, batches = [];
    for (let i = 0; i < NB; i++) { const tb = hero.makeBatch(); tb.litAll = !!look.night; batches.push(tb); }
    const B = (s) => batches[Math.min(NB - 1, Math.max(0, Math.floor((s + 40) / 62)))];
    const gold = rgb(0.72, 0.46, 0.08);
    // THE CHEDI'S SIGHT LINES (round 16; the open correction: "lower or gap that roofline on its sight line, never raise the chedi"). The rule, in
    // space: while the cab rides the trestle's crest (s RAMP[1]..SPAN[1], the eye EYE + RISE above the ground) no roof on the left bank stands above
    // the sight line from the eye to the foot of the chedi's upper third. All those lines lie in one plane, which rises from the eye's line over the
    // rails toward the chedi (8.85 m up over the house fronts 5 m from the rails, 11.2 m over their backs); they cross the left bank between the canal
    // and s 299. A house under them has as many storeys as fit under that plane, and never fewer than one. The rule is asked of every house of the
    // lane's rows and of the first house on the far bank; nothing is asked of a place the lines do not cross. The chedi itself is not touched: 38 m,
    // 60 m left of the track at s 470.
    // THE CREST HOUSES (round 16b). A house the planes can cross, by its place alone (a row house: the ground from its start to the furthest end the
    // row's widths can give it, over the row's depth; the bank house: its footprint), builds from a fork of the town's stream of its own, named
    // 'crest-house-' + k, k counted in build order: one draw of the town's stream, taken where the house's first draw stood. On its fork it draws
    // only what it builds: its width, its storeys (a draw only where more than one fits under the plane) and its one facade. With the rule's numbers
    // these are the left row's houses that start before s 299.23 (four to seven of them, from the canal bank at SPAN[1] + 9) and the bank house.
    // Everything on the town's stream after the first of them is dealt anew against the rounds before 16b (once, here: a re-roll, not a bias).
    const CHEDI_AT = { x: -60, s: 470, h: 38 }, SEE = [RAMP[1], SPAN[1]];
    const chediCap = (s0, s1, xn, xf) => { const eye = EYE + RISE;   // (xn, xf: the footprint's near and far edge in lane x; undefined where no line crosses it)
      for (let i = 0; i <= 32; i++) { const t = (xn + ((xf - xn) * i) / 32) / CHEDI_AT.x; if (t <= 0 || t >= 1) continue;
        if (SEE[0] * (1 - t) + CHEDI_AT.s * t <= s1 && SEE[1] * (1 - t) + CHEDI_AT.s * t >= s0) return eye + ((CHEDI_AT.h * 2) / 3 - eye) * t; }
      return undefined; };
    let crestK = 0;
    const crestR = (can) => (can ? R.fork('crest-house-' + crestK++) : R);
    // a row of houses along the lane: richer where the cab sees their upper storeys (the mouth, the square, from the trestle)
    const laneRow = async (side, s0, s1, xf = 5, o = undefined) => {
      let s = s0;
      while (s < s1 - 1) {
        const HR = crestR(chediCap(s, Math.min(s1, s + 16), side * xf, side * (xf + 8)) !== undefined);   // (a house is at most 12 + 4 m long: the line below)
        let w = HR.pick([6, 6, 9, 9, 12]); if (s + w > s1 - 4) w = s1 - s;
        const tall = side > 0 && s > 186 && s < 290 ? 1 : 0, cap = chediCap(s, s + w, side * xf, side * (xf + 8)), fit = storeysUnder(cap);
        building(B(s), HR, { ox: side * xf, os: s, ux: 0, us: 1, nx: -side, ns: 0 }, w, 8, fit - tall > 1 ? (HR.chance(s > 190 && s < 290 ? 0.75 : 0.45) ? 2 : 1) + tall : Math.max(1, Math.min(fit, 1 + tall)), s < 46 || tall ? 2 : o || (s > 186 && s < 300) || s > 326 ? 1 : 0, { ...o, cap });
        s += w;
        await ctx.yield();
      }
    };
    // the end of a shop strip where the lane opens out: a gable wall with a blade sign, posters and a bulb, facing dir (-1: the oncoming train)
    const endWall = (side, s, dir) => { const b = B(s), wc = sc(R.pick(WALLS), 0.95), z = Zs(s - dir * 0.07), zf = Zs(s + dir * 0.2);
      b.mat = 5; b.box(side * 4.25, 2.6, z, 1.6, 5.2, 0.16, wc); b.mat = 0; b.box(side * 4.25, 5.25, z, 1.8, 0.14, 0.3, TRIM);
      if (dir > 0) return;
      b.box(side * 4.3, 3.6, Zs(s - 0.5), 0.07, 1.5, 0.8, sc(R.pick([PAL.red, PAL.blue, PAL.green]), 0.8)); b.box(side * 4.3, 3.9, Zs(s - 0.5), 0.09, 0.5, 0.6, rgb(0.74, 0.72, 0.6));
      for (const [px, py, pw, ph, pc] of [[3.85, 1.9, 0.5, 0.7, PAL.blue], [4.6, 2.05, 0.6, 0.45, PAL.red], [4.0, 4.2, 0.7, 0.9, PAL.green]]) { b.box(side * px, py, zf, pw, ph, 0.02, rgb(0.7, 0.67, 0.56)); b.box(side * px, py + ph * 0.18, zf + 0.015, pw * 0.8, ph * 0.4, 0.02, sc(pc, 0.6)); }
      b.box(side * 4.0, 2.75, Zs(s - 0.35), 0.03, 0.03, 0.5, DARK); b.mat = 1; b.aux = look.night ? 9 : 2.6; b.blob(side * 4.0, 2.62, Zs(s - 0.58), 0.05, 0.06, 0.05, rgb(1.0, 0.72, 0.36), 5, 3); b.mat = 0; b.aux = 0;
      for (let k = 0; k < 5; k++) garlandStrand(b, R, side * (3.6 + k * 0.16), 3.3, s - 0.3, R.range(0.7, 1.3), 4); };
    // a corner house at the far side of an open room, with a full facade (shopfronts, balconies) on the wall that faces the train
    const cornerHouse = (side, s, w = 9) => { const fl = 2, wall = R.pick(WALLS);
      building(B(s), R, { ox: side * 5, os: s, ux: 0, us: 1, nx: -side, ns: 0 }, w, 8, fl, 1, { wall });
      building(B(s), R, { ox: side > 0 ? 5 : -13, os: s - 0.03, ux: 1, us: 0, nx: 0, ns: -1 }, 8, 0.3, fl, 2, { skin: true, wall, ground: true }); };
    // corner blocks on the crossing road, their facades toward the oncoming train
    for (const side of [-1, 1]) {
      const b = B(0); let x = 5;
      [8, 9, 9, 12, 14].forEach((w, i) => {
        const xa = side > 0 ? x : -(x + w), fl = i === 0 ? (R.chance(0.5) ? 2 : 1) : R.int(1, 2);
        const H = building(b, R, { ox: xa, os: 0, ux: 1, us: 0, nx: 0, ns: -1 }, w, i === 0 ? 9 : R.range(9, 12), fl, i < 2 ? 2 : i < 3 ? 1 : 0, { ground: i < 4 });
        if (i === 0) building(b, R, { ox: side * 5, os: 0.3, ux: 0, us: 1, nx: -side, ns: 0 }, 8.4, 0.3, fl, 2, { skin: true, wall: R.pick(WALLS) });
        x += w; return H;
      });
      await ctx.yield();
      // the end of the shop strip: a gable wall with a blade sign, drainpipe and meter boxes
      const wc = sc(R.pick(WALLS), 0.95); b.mat = 5; b.box(side * 4.25, 2.6, Zs(-0.06), 1.6, 5.2, 0.16, wc); b.mat = 0;
      b.box(side * 4.25, 5.25, Zs(-0.1), 1.8, 0.14, 0.3, TRIM); b.box(side * 4.3, 3.6, Zs(-0.5), 0.07, 1.5, 0.8, sc(side > 0 ? PAL.red : PAL.blue, 0.8)); b.box(side * 4.3, 3.9, Zs(-0.5), 0.09, 0.5, 0.6, rgb(0.74, 0.72, 0.6));
      b.box(side * 4.6, 1.5, Zs(-0.2), 0.4, 0.5, 0.14, rgb(0.5, 0.5, 0.48)); b.cyl(side * 3.62, 0, Zs(-0.2), 0.05, 0.05, 5.2, 5, sc(STEEL, 0.6), false);
      b.mat = 5; b.box(side * 4.25, 0.55, Zs(-0.16), 1.62, 1.1, 0.05, sc(wc, 0.55)); winQuad(b, R(), side * 4.2, 4.35, Zs(-0.176), 0.6, 0.9, true, 1, 1);
      b.mat = 8; b.box(side * 3.78, 4.35, Zs(-0.17), 0.24, 0.9, 0.04, R.pick(SHUT)); b.box(side * 4.62, 4.35, Zs(-0.17), 0.24, 0.9, 0.04, R.pick(SHUT)); b.mat = 0; b.box(side * 4.2, 3.86, Zs(-0.2), 1.1, 0.06, 0.16, TRIM);
      b.box(side * 4.0, 2.75, Zs(-0.35), 0.03, 0.03, 0.5, DARK); b.mat = 1; b.aux = look.night ? 9 : 2.2; b.blob(side * 4.0, 2.62, Zs(-0.58), 0.05, 0.06, 0.05, rgb(1.0, 0.72, 0.36), 5, 3); b.mat = 0; b.aux = 0;
      for (let k = 0; k < 5; k++) garlandStrand(b, R, side * (3.6 + k * 0.16), 3.3, -0.3, R.range(0.7, 1.3), 4);
      await laneRow(side, 9, YARD[0]);
      await laneRow(side, YARD[0], YARD[1], 14, { ground: true });            // the square: house fronts set back 9 m, shops at their feet
      endWall(side, YARD[1], -1); await ctx.yield(); cornerHouse(side, YARD[1]); await ctx.yield();
      await laneRow(side, YARD[1] + 9, side < 0 ? QUAY : SPAN[0]);            // (left: as far as the quay; right: as far as the canal)
      if (side > 0) { endWall(1, SPAN[1], -1); await ctx.yield(); cornerHouse(1, SPAN[1]); await ctx.yield(); }     // (the left bank's first house is built with the canal, below)
      await laneRow(side, SPAN[1] + 9, LEN);
    }
    await ctx.yield();

    // ----- the level crossing -----
    const steamAt = [], bushAt = [];
    {
      const b = B(-10), white = rgb(0.72, 0.7, 0.66);
      for (const side of [-1, 1]) {
        const px = side * 4.9, z = Zs(-2.6);
        b.mat = 0; b.box(px, 0.6, z, 0.26, 1.2, 0.26, white, 0.9, 0.9); b.box(px, 0.25, z, 0.3, 0.3, 0.3, sc(PAL.red, 0.8));
        b.mat = 1; b.aux = look.night ? 9 : 2.6; b.anim = [-2.6, 6, 0, side > 0 ? 0 : Math.PI]; b.blob(px, 1.32, z, 0.09, 0.09, 0.09, rgb(1.0, 0.12, 0.05), 6, 3); b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
        b.M.makeRotationZ(side > 0 ? 1.78 : 1.36).setPosition(px, 1.05, z + 0.2);
        b.box(2.3, 0, 0, 5.2, 0.1, 0.09, white, 1, 1, 0.9); for (let k = 0; k < 5; k++) b.box(0.6 + k * 1.0, 0, 0, 0.5, 0.115, 0.1, sc(PAL.red, 0.85)); b.box(-0.55, 0, 0, 0.5, 0.34, 0.2, rgb(0.2, 0.2, 0.22)); b.M.identity();
        // power pole with a transformer, wires across the road and away along it
        const qx = side * 5.5, qz = Zs(-0.9); b.cyl(qx, 0, qz, 0.13, 0.09, 8.2, 6, rgb(0.3, 0.27, 0.24), true, 0.8); b.box(qx, 7.4, qz, 1.5, 0.09, 0.09, rgb(0.22, 0.2, 0.18)); b.box(qx, 6.6, qz, 1.1, 0.08, 0.08, rgb(0.22, 0.2, 0.18));
        b.mat = 3; b.cyl(qx + side * 0.35, 5.5, qz, 0.24, 0.24, 0.7, 8, rgb(0.4, 0.42, 0.44)); b.mat = 0;
        // a street lamp on an arm over the road
        b.tube([[qx, 6.1, qz], [qx - side * 0.5, 6.45, qz + 0.9], [qx - side * 0.9, 6.4, qz + 1.9]], 0.035, 4, rgb(0.22, 0.2, 0.18)); b.box(qx - side * 0.95, 6.36, qz + 2.1, 0.22, 0.09, 0.5, rgb(0.3, 0.3, 0.3));
        b.mat = 1; b.aux = look.night ? 9 : look.lamp[0] > 0.05 ? 3 : 0.5; b.blob(qx - side * 0.95, 6.29, qz + 2.1, 0.09, 0.05, 0.2, rgb(1.0, 0.8, 0.5), 6, 3); b.mat = 0; b.aux = 0;
        for (let w = 0; w < 3; w++) { const p2 = [], x1 = side * 44, sag = R.range(0.6, 1.1), yy = 7.45 - (w === 2 ? 0.8 : 0), zz = qz + (w - 1) * 0.3;
          for (let k = 0; k <= 8; k++) { const t = k / 8; p2.push([qx + (x1 - qx) * t, yy - sag * 4 * t * (1 - t) + t * 0.6, zz - t * 1.2]); }
          b.anim = [-0.9, 3, 0.018, 0]; b.tube(p2, 0.018, 3, rgb(0.03, 0.03, 0.035)); b.anim = [0, 0, 0, 0]; }
      }
      for (let w = 0; w < 4; w++) { const p2 = [], sag = R.range(0.3, 0.7), yy = w < 2 ? 7.45 : 6.65, zz = Zs(-0.9) + (w % 2 ? 0.25 : -0.25);
        for (let k = 0; k <= 8; k++) { const t = k / 8; p2.push([-5.5 + 11 * t, yy - sag * 4 * t * (1 - t), zz]); }
        b.anim = [-0.9, 3, 0.018, 0]; b.tube(p2, 0.018, 3, rgb(0.03, 0.03, 0.035)); b.anim = [0, 0, 0, 0]; }
      await ctx.yield();
      // the green flag on its post, left of the rails
      b.cyl(-4.25, 0, Zs(-1.9), 0.035, 0.03, 2.9, 5, white, false);
      for (let k = 0; k < 6; k++) { b.anim = [-1.9, 5, -4.25, 1.0]; b.box(-4.25 + 0.12 + k * 0.2, 2.45, Zs(-1.9), 0.2, 0.8, 0.012, rgb(0.08, 0.42, 0.16), 1, 1, 0.9); } b.anim = [0, 0, 0, 0];
      // strings of pennants across the mouth of the lane, snapping in the wind
      for (const [ss, y0, ph] of [[-0.7, 6.3, 0], [-1.1, 7.2, 2.1]]) { const p2 = [], yAt = (t) => y0 - 0.55 * 4 * t * (1 - t);
        for (let k = 0; k <= 10; k++) { const t = k / 10; p2.push([-5.5 + 11 * t, yAt(t), Zs(ss)]); }
        b.anim = [ss, 3, 0.014, 0]; b.mat = 0; b.tube(p2, 0.014, 3, DARK);
        for (let k = 1; k < 24; k++) { const t = k / 24, yy = yAt(t); b.anim = [ss, 4, yy, ph + k * 0.9]; b.M.makeRotationZ(Math.PI).setPosition(-5.5 + 11 * t, yy - 0.24, Zs(ss)); b.box(0, 0, 0, 0.3, 0.46, 0.012, sc(R.pick([PAL.red, PAL.saffron, PAL.green, PAL.blue, rgb(0.8, 0.78, 0.7), PAL.orange]), 0.8), 0.1, 1, 1); b.M.identity(); }
        b.anim = [0, 0, 0, 0]; }
      // a string of bare bulbs across the mouth of the lane, swinging on their flex
      { const ss = -0.35, p2 = [], yAt = (t) => 5.3 - 0.2 * 4 * t * (1 - t);
        for (let k = 0; k <= 10; k++) { const t = k / 10; p2.push([-3.6 + 7.2 * t, yAt(t), Zs(ss)]); }
        b.anim = [ss, 3, 0.016, 0]; b.mat = 0; b.tube(p2, 0.016, 3, DARK);
        for (let k = 1; k <= 4; k++) { const t = k / 5, x = -3.6 + 7.2 * t, yy = yAt(t), len = Math.min(R.range(0.35, 0.6), Math.abs(x) < 1.5 ? 0.25 : 9);   // (over the rails the flex is short: no bulb within 2 m of the eye's height)
          b.anim = [ss, 4, yy, k * 1.9]; b.mat = 0; b.aux = -1; b.tube([[x, yy, Zs(ss)], [x, yy - len, Zs(ss)]], 0.0075, 3, rgb(0.10, 0.065, 0.04)); b.aux = 0; b.cyl(x, yy - len - 0.06, Zs(ss), 0.024, 0.024, 0.06, 5, DARK);
          b.mat = 1; b.aux = look.night ? 9 : 3; b.blob(x, yy - len - 0.11, Zs(ss), 0.05, 0.065, 0.05, rgb(1.0, 0.72, 0.36), 6, 3); b.mat = 0; b.aux = 0; }
        b.anim = [0, 0, 0, 0]; }
      await ctx.yield();
      // a noodle cart under a parasol on the left corner; scooters, crates and a fruit table on the right
      { const cx = -7.4, cs = -1.7, z = Zs(cs);
        b.mat = 0; b.box(cx, 0.75, z, 1.7, 0.7, 0.85, rgb(0.5, 0.52, 0.54), 1, 1, 0.75); wheelX(b, cx - 0.9, 0.3, z, 0.3, 0.07); wheelX(b, cx + 0.83, 0.3, z, 0.3, 0.07);
        b.mat = 2; b.aux = 0.3; b.box(cx - 0.35, 1.35, z, 0.8, 0.5, 0.7, rgb(0.3, 0.38, 0.42)); b.mat = 3; b.cyl(cx + 0.45, 1.1, z, 0.22, 0.24, 0.26, 10, rgb(0.62, 0.63, 0.64)); b.cyl(cx + 0.45, 1.36, z, 0.24, 0.05, 0.07, 10, rgb(0.66, 0.67, 0.68)); b.mat = 0;
        steamAt.push([cs, cx + 0.45, 1.4]);
        b.cyl(cx + 0.2, 0, z - 0.6, 0.03, 0.03, 2.7, 5, STEEL, false); b.cyl(cx + 0.2, 2.45, z - 0.6, 1.45, 0.04, 0.5, 12, sc(PAL.red, 0.8), false, 0.9, rgb(0.74, 0.72, 0.64));
        vendor(b, R, cx - 0.2, 0.75, cs + 0.75, 1.15); for (let k = 0; k < 3; k++) b.cyl(cx + R.range(-1.2, 1.4), 0, Zs(cs - 1.2 - R.range(0, 0.5)), 0.15, 0.13, 0.42, 6, sc(R.pick([PAL.red, PAL.blue]), 0.8)); }
      for (let k = 0; k < 3; k++) scooter(b, R, 6.4 + k * 0.75 + R.range(-0.1, 0.1), -1.5 + R.range(-0.2, 0.2), k % 2 ? 1 : -1);
      b.mat = 6; for (let k = 0; k < 5; k++) { const xx = 9.6 + R.range(0, 1.6), ss = -1.0 - R.range(0, 0.8); for (let j = 0, st = R.int(1, 3); j < st; j++) b.box(xx, 0.16 + j * 0.31, Zs(ss), 0.42, 0.3, 0.58, sc(R.pick([PAL.blue, PAL.red, PAL.green]), R.range(0.6, 0.9)), 1.06, 1.04, 0.7); } b.mat = 0;
      cat(b, 5.75, 0.0, -0.75, rgb(0.5, 0.36, 0.2)); pot(b, 5.5, 0, -0.45, R, 1.4, bushAt); pot(b, -5.6, 0, -0.5, R, 1.5, bushAt); pot(b, -11.5, 0, -0.6, R, 1.3, bushAt); pot(b, 12.4, 0, -0.6, R, 1.4, bushAt);
    }
    await ctx.yield();
    // people only implied: hats and shirts deep in the shopfront shade, all along the lane
    for (let c = 0; c < LEN / 3; c++) for (const side of [-1, 1]) {
      const s = c * 3 + R.range(0.6, 2.4); if (!R.chance(0.42) || inOpen(s, side)) continue;
      vendor(B(s), R, side * R.range(3.8, 4.2), 0.48, s, R.range(0.95, 1.1), true);
    }
    await ctx.yield();
    // walls of marigold garlands near the end of the lane (three times as many on a festival day)
    const gq = hero.makeBatch();
    for (const side of [-1, 1]) for (let s = festival ? 30 : FLOWER[0] + 1; s < 348; s += festival && s < FLOWER[0] ? R.range(3.5, 6) : 0.7) {
      if (inOpen(s, side) || (s > HALL[1] && s < FLOWER[0])) continue;
      garlandStrand(s >= FLOWER[0] ? gq : B(s), R, side * (2.3 + R.range(-0.03, 0.03)), R.range(2.86, 3.02), s, R.range(0.55, 1.25), qd > 0.7 ? 4 : 3, 2, 0.14);
      await ctx.yield();
    }
    await ctx.yield();
    const garlandWall = new THREE.Mesh(gq.build(), hero.propMat); garlandWall.name = 'fm-garland-wall'; garlandWall.visible = false; scene.add(garlandWall);
    await ctx.yield();

    // ----- the open square (s 66..111): umbrella stalls, a flame tree, a spirit house, benches, scooters -----
    const FLAME = { x: -11, s: 90 };
    {
      const b = B(88), conc = rgb(0.42, 0.40, 0.37);
      const bulbAux = look.night ? 9 : look.lamp[0] > 0.05 ? 4 : 2.4; let ui = 0;
      for (const [s, x, , uk] of umbrellas) {   // under each umbrella a trestle table heaped with fruit or flowers, crates, a stool, someone sitting
        const YR0 = YR; { const YR = ui < nUmb0 ? YR0 : PR;
        const z = Zs(s), sd = x < 0 ? -1 : 1, wd = sc(WOOD, YR.range(0.8, 1.2)), kind = YR.int(0, 3);
        // a bare bulb on its flex under the canopy, stirring
        b.anim = [s, 4, 1.8 * uk, s * 1.3]; b.mat = 0; b.box(x + sd * 0.3, 1.66 * uk, z, 0.02, 0.28 * uk, 0.02, DARK);
        b.mat = 1; b.aux = bulbAux; b.blob(x + sd * 0.3, 1.5 * uk, z, 0.055, 0.07, 0.055, rgb(1.0, 0.72, 0.36), 5, 3); b.mat = 0; b.aux = 0; b.anim = [0, 0, 0, 0];
        if (ui === 1 || ui === 4 || ui === 8) { const px = x - sd * 1.0, pz = z + 0.75;   // a charcoal stove and a tall aluminium pot beside the table: steam all day
          b.mat = 3; b.cyl(px, 0.0, pz, 0.17, 0.21, 0.42, 8, rgb(0.3, 0.2, 0.15)); b.cyl(px, 0.42, pz, 0.27, 0.29, 0.34, 10, rgb(0.62, 0.63, 0.64)); b.cyl(px, 0.76, pz, 0.29, 0.06, 0.08, 10, rgb(0.66, 0.67, 0.68)); b.mat = 0;
          steamAt.push([s - 0.75, px, 0.86]); }
        ui++;
        b.mat = 0; b.box(x, 0.8, z, 1.0, 0.06, 1.9, wd, 1, 1, 0.8); for (const ez of [-0.8, 0.8]) b.box(x, 0.39, z + ez, 0.8, 0.78, 0.06, sc(wd, 0.7));
        b.box(x - sd * 0.5, 0.52, z, 0.02, 0.5, 1.84, sc(YR.pick([PAL.blue, PAL.green, PAL.red, PAL.saffron]), 0.6), 1, 1, 0.75);
        for (let j = -1; j <= 1; j++) { const hc = kind === 0 ? [rgb(0.72, 0.36, 0.02), rgb(0.86, 0.56, 0.04), 19] : kind === 1 ? [rgb(0.30, 0.50, 0.06), rgb(0.4, 0.6, 0.1), 15] : kind === 2 ? [rgb(0.62, 0.09, 0.04), rgb(0.7, 0.2, 0.05), 12] : [rgb(0.5, 0.3, 0.04), rgb(0.8, 0.6, 0.1), 9];
          b.mat = 2; b.aux = 0.25; b.box(x, 0.85, z + j * 0.6, 0.8, 0.05, 0.52, rgb(0.62, 0.64, 0.66), 1.06, 1.05, 0.7);
          b.mat = 4; b.aux = hc[2]; b.blob(x, 0.87, z + j * 0.6, 0.34, YR.range(0.12, 0.26), 0.22, hc[0], 6, 2, true, hc[1]); }
        b.mat = 6; for (let j = 0, st = YR.int(1, 3); j < st; j++) b.box(x + sd * 0.9, 0.16 + j * 0.31, z + 0.7, 0.42, 0.3, 0.58, sc(YR.pick([PAL.blue, PAL.red, PAL.green]), YR.range(0.6, 0.9)), 1.06, 1.04, 0.7); b.mat = 0;
        b.cyl(x + sd * 0.85, 0, z - 0.4, 0.15, 0.13, 0.42, 6, sc(YR.pick([PAL.red, PAL.blue]), 0.8));
        figure(b, x + sd * 0.82, 0.42, z - 0.4, 1.12, sc(YR.pick(CLOTHES), 0.75), { hat: YR.chance(0.7), yaw: sd > 0 ? Math.PI / 2 : -Math.PI / 2 });
        b.cyl(x, 0, z, 0.2, 0.2, 0.1, 8, rgb(0.3, 0.3, 0.3)); }
        await ctx.yield();
      }
      // a string of paper lanterns slung across the square before the hall's gable
      { const ss = 107, p2 = [], yAt = (t) => 7.7 - 1.0 * 4 * t * (1 - t);
        for (let k = 0; k <= 14; k++) { const t = k / 14; p2.push([-14 + 28 * t, yAt(t), Zs(ss)]); }
        b.anim = [ss, 3, 0.016, 0]; b.mat = 0; b.aux = 0; b.tube(p2, 0.016, 3, DARK);
        for (let k = 1; k < 12; k++) { const t = k / 12, x = -14 + 28 * t, yy = yAt(t); b.anim = [ss, 2.1, yy, PR() * 6.28]; b.mat = 0; b.box(x, yy - 0.1, Zs(ss), 0.016, 0.2, 0.016, DARK);
          paperLantern(b, x, yy - 0.2 - 0.3 * (k % 2 ? 1 : 1.2), Zs(ss), k % 2 ? 0.23 : 0.28, PR.pick(LANT), Math.min(2.1, look.lantern * 1.9)); }
        b.anim = [0, 0, 0, 0]; }
      await ctx.yield();
      // two strings of bare bulbs and pennants slung across the square between the house fronts, stirring in the wind
      for (const [ss, ph] of [[75.5, 0], [96.5, 2.1]]) { const p2 = [], yAt = (t) => 6.7 - 1.45 * 4 * t * (1 - t);
        for (let k = 0; k <= 14; k++) { const t = k / 14; p2.push([-14 + 28 * t, yAt(t), Zs(ss)]); }
        b.anim = [ss, 3, 0.016, 0]; b.mat = 0; b.tube(p2, 0.016, 3, DARK);
        for (let k = 1; k < 30; k++) { const t = k / 30, x = -14 + 28 * t, yy = yAt(t);
          if (k % 2) { b.anim = [ss, 4, yy, ph + k * 1.9]; b.mat = 0; b.box(x, yy - 0.13, Zs(ss), 0.02, 0.26, 0.02, DARK); b.mat = 1; b.aux = bulbAux; b.blob(x, yy - 0.32, Zs(ss), 0.06, 0.075, 0.06, rgb(1.0, 0.72, 0.36), 5, 3); b.mat = 0; b.aux = 0; }
          else { b.anim = [ss, 4, yy, ph + k * 0.9]; b.M.makeRotationZ(Math.PI).setPosition(x, yy - 0.27, Zs(ss)); b.box(0, 0, 0, 0.36, 0.52, 0.012, sc(PR.pick([PAL.red, PAL.saffron, PAL.green, PAL.blue, rgb(0.8, 0.78, 0.7), PAL.orange]), 0.8), 0.1, 1, 1); b.M.identity(); } }
        b.anim = [0, 0, 0, 0]; }
      { const stripes = [[PAL.red, 0.2], [rgb(0.8, 0.78, 0.72), 0.2], [sc(PAL.blue, 0.55), 0.4], [rgb(0.8, 0.78, 0.72), 0.2], [PAL.red, 0.2]];
        [[71.5, -1, 0], [84, -1, 1], [98, -1, 0], [107, -1, 1], [69.5, 1, 1], [79, 1, 0], [92, 1, 1], [104.5, 1, 0]].forEach(([fs, sd, plain], fi) => { const px = sd * 12.9, top = 7.4 + (fi % 3) * 0.5, ph = fi * 1.7, fz = Zs(fs);
          b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0; b.cyl(px, 0, fz, 0.055, 0.035, top + 0.15, 5, rgb(0.5, 0.41, 0.2), false); b.blob(px, top + 0.2, fz, 0.07, 0.07, 0.07, gold, 5, 3);
          for (let k = 0; k < 9; k++) { const fx2 = px - sd * (0.16 + k * 0.3); b.anim = [fs, 5, px, ph];
            if (plain) { b.box(fx2, top - 0.6, fz, 0.3, 1.2, 0.012, sc(k % 3 === 2 ? PAL.orange : PAL.saffron, 0.85), 1, 1, 0.92); }
            else { let yy = top; for (const [c, hh] of stripes) { b.box(fx2, yy - hh * 0.5, fz, 0.3, hh, 0.012, sc(c, 0.85), 1, 1, 1); yy -= hh; } } }
          b.anim = [0, 0, 0, 0]; }); }
      await ctx.yield();
      // the spirit house on its white pillar, hung with marigolds, an offering table in front
      { const x = 9.6, s = 84, z = Zs(s), white = rgb(0.7, 0.68, 0.62);
        b.mat = 5; b.box(x, 0.2, z, 1.5, 0.4, 1.5, white, 0.9, 0.9); b.cyl(x, 0.4, z, 0.16, 0.12, 1.25, 8, white); b.box(x, 1.72, z, 1.05, 0.12, 1.05, white);
        b.mat = 9; b.box(x, 2.08, z, 0.62, 0.6, 0.62, gold, 0.92, 0.92); b.mat = 0;
        for (const [w, y] of [[1.0, 2.44], [0.66, 2.66], [0.34, 2.86]]) { b.M.makeRotationY(Math.PI / 4).setPosition(x, y, z); b.cyl(0, 0, 0, w * 0.72, w * 0.22, 0.24, 4, sc(TILE, 1.2), true, 0.8, sc(PAL.red, 0.8)); b.M.identity(); }
        b.mat = 9; b.cyl(x, 3.08, z, 0.05, 0.01, 0.5, 5, gold); b.mat = 0;
        for (let k = 0; k < 6; k++) garlandStrand(b, YR, x - 0.45 + k * 0.18, 1.74, s - 0.56, YR.range(0.35, 0.6), 3, 2, 0.12);
        b.box(x, 0.5, Zs(s - 1.1), 0.9, 0.05, 0.45, sc(PAL.red, 0.7)); for (const e of [-0.4, 0.4]) b.box(x + e, 0.25, Zs(s - 1.1), 0.05, 0.5, 0.4, sc(PAL.red, 0.5));
        b.mat = 4; b.aux = 19; b.blob(x, 0.52, Zs(s - 1.1), 0.3, 0.12, 0.14, rgb(0.72, 0.36, 0.02), 6, 2, true, rgb(0.86, 0.56, 0.04)); b.mat = 0;
        pot(b, x - 0.95, 0, s + 0.3, YR, 1.4, bushAt); pot(b, x + 0.95, 0, s + 0.3, YR, 1.3, bushAt); }
      // a stone seat round the flame tree; benches, water jars, potted plants and scooters along the house fronts
      b.mat = 5; b.cyl(FLAME.x, 0, Zs(FLAME.s), 2.3, 2.2, 0.46, 12, conc, true, 0.8, sc(conc, 1.15)); b.mat = 0;
      b.cyl(FLAME.x, 0.46, Zs(FLAME.s), 1.7, 1.7, 0.04, 12, rgb(0.2, 0.15, 0.1));
      figure(b, FLAME.x + 2.0, 0.46, Zs(FLAME.s - 0.6), 1.1, sc(CLOTHES[2], 0.8), { hat: true, yaw: -Math.PI / 2 }); cat(b, FLAME.x + 1.6, 0.46, FLAME.s + 1.3, rgb(0.5, 0.36, 0.2));
      for (const sd of [-1, 1]) {
        for (let s = YARD[0] + 5; s < YARD[1] - 3; s += YR.range(5, 8)) { const x = sd * YR.range(12.4, 13.2);
          if (YR.chance(0.4)) { b.box(x, 0.45, Zs(s), 0.45, 0.06, 1.6, WOOD); for (const e of [-0.7, 0.7]) b.box(x, 0.22, Zs(s + e), 0.4, 0.44, 0.06, DARK); }
          else if (YR.chance(0.5)) pot(b, x, 0, s, YR, YR.range(1.3, 1.7), bushAt);
          else { b.cyl(x, 0, Zs(s), 0.3, 0.4, 0.7, 9, rgb(0.34, 0.2, 0.12), true, 0.8, rgb(0.42, 0.26, 0.15)); } }
        for (let k = 0; k < 3; k++) scooter(b, YR, sd * (11.6 + YR.range(-0.2, 0.2)), (sd > 0 ? 71.5 : 104.5) + k * 0.8, k % 2 ? 1 : -1);
      }
      await ctx.yield();
    }

    // ----- the lantern hall (s 120..186): a tin roof on timber trusses, purlins, gable ends, three rows of paper lanterns -----
    {
      const timber = rgb(0.10, 0.165, 0.15), iron = rgb(0.075, 0.13, 0.115), GX = 4.3, tin = rgb(0.42, 0.40, 0.355), s0 = HALL[0] - 0.6, s1 = HALL[1] + 0.6, roofY = (x) => 9.2 - Math.abs(x) * 0.245;
      const LC = [rgb(0.9, 0.12, 0.06), rgb(0.95, 0.45, 0.05), rgb(0.95, 0.75, 0.15), rgb(0.9, 0.25, 0.4), rgb(0.85, 0.82, 0.7)];
      // the roof (trusses, bars and purlins are painted iron): corrugated tin over the eaves, and between them glazing on iron bars, a rafter
      // every 1.5 m and a purlin every 1.43 m. The panes are only a faint sheen (the mesh `fm-hall-glass` below): the sky, the stars
      // and the moon show through them. Three vents 1.5 m wide stay open over the rails and let the sun fall in shafts.
      const slitAt = (s) => [132, 150, 168].some((c) => Math.abs(s - c) < 0.76);
      const strip = (b, sa, sb, xa, xb) => { const sg = xa + xb < 0 ? -1 : 1, nx = -sg * 0.238, c = sc(tin, 0.85 + 0.3 * (((sa * 0.37) % 1 + 1) % 1));
        b.mat = 0; b.aux = 0; const v = (x, s) => b.vert(x, roofY(x) - 0.03, Zs(s), nx, -0.971, 0, c.r, c.g, c.b); b.quad(v(xa, sa), v(xa, sb), v(xb, sb), v(xb, sa)); };
      for (let s = s0; s < s1 - 0.01;) { const e = Math.min(Math.floor(s / 6 + 1.0001) * 6, s1), b = B((s + e) / 2), zm = Zs((s + e) / 2);
        strip(b, s, e, -5.4, -GX); strip(b, s, e, GX, 5.4);
        for (const x of [-GX, -2.86, -1.43, 0, 1.43, 2.86, GX]) { const wide = x === 0 || Math.abs(x) === GX;   // purlins, widened with distance like wire so they never break up
          b.mat = 0; b.aux = 0; b.anim = [(s + e) / 2, 3, wide ? 0.06 : 0.035, 0]; b.M.makeRotationZ(x < 0 ? 0.24 : x > 0 ? -0.24 : 0).setPosition(x, roofY(x) - 0.02, zm); b.box(0, 0, 0, wide ? 0.12 : 0.07, 0.09, e - s, iron); b.M.identity(); }
        b.anim = [0, 0, 0, 0]; s = e; }
      await ctx.yield();
      for (let s = HALL[0] + 1.5; s < HALL[1] - 0.01; s += 1.5) { if (Math.abs(s / 6 - Math.round(s / 6)) < 0.01) continue;   // glazing bars across, between the trusses (none over the vents)
        const b = B(s), x0 = slitAt(s) ? 2.6 : 0, xm = (x0 + GX) / 2;
        for (const sd of [-1, 1]) { b.mat = 0; b.aux = 0; b.anim = [s, 3, 0.03, 0]; b.M.makeRotationZ(-sd * 0.24).setPosition(sd * xm, roofY(xm) - 0.02, Zs(s)); b.box(0, 0, 0, (GX - x0) / 0.971, 0.08, 0.06, iron); b.M.identity(); }
        b.anim = [0, 0, 0, 0]; }
      for (const c of [132, 150, 168]) { const b = B(c); b.mat = 0; for (const x of [-2.6, 2.6]) b.box(x, roofY(x) - 0.06, Zs(c), 0.1, 0.14, 1.5, iron); }
      { // the panes: a milky sheen by day, by night the lanterns' glow caught at a grazing angle and a glint across one pane in two
        const P = [], A = [], I = []; let n = 0;
        for (let s = HALL[0]; s <= HALL[1] + 0.01; s += 1.5) { const o = offsetAt(s); for (const x of [-GX, 0, GX]) { P.push(x + o, roofY(x) + 0.03, Zs(s)); A.push(x, s); n++; } }
        for (let j = 0; j < n / 3 - 1; j++) for (let i = 0; i < 2; i++) { const a = j * 3 + i, c = a + 3; I.push(a, a + 1, c + 1, a, c + 1, c); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I); g.computeBoundingSphere();
        const glass = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uSkyCol: U.uSkyCol, uSunCol: U.uSunCol, uHallLamp: U.uHallLamp, uTime: U.uTime, uCamL: U.uCamL, uS0: { value: HALL[0] } },
          vertexShader: /* glsl */`attribute vec2 aUV; varying vec2 vUV; varying vec3 vP; void main(){ vUV = aUV; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: /* glsl */`uniform vec3 uSkyCol, uSunCol, uHallLamp, uCamL; uniform float uTime, uS0; varying vec2 vUV; varying vec3 vP;
float h2(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 g = vec2(vUV.x / 1.43, (vUV.y - uS0) / 1.5), pane = floor(g), f = fract(g);
  float h = h2(pane + 3.0), dirt = 0.55 + 0.45 * h2(pane + 11.0), dayK = smoothstep(0.5, 1.4, uSunCol.g);
  vec3 V = normalize(uCamL - vP + vec3(0.0, 1e-4, 0.0)); float fr = 1.0 - abs(V.y); fr *= fr;
  float d = f.x + f.y - 0.55 - 0.6 * h, streak = smoothstep(0.0, 0.12, d) * (1.0 - smoothstep(0.16, 0.42, d)) * step(0.5, h);
  float ms = abs(fract((vUV.y - uS0 - 3.0) / 18.0) - 0.5) * 18.0, vent = 1.0 - (1.0 - step(0.75, ms)) * (1.0 - step(2.6, abs(vUV.x)));   // no glass in the three vents
  vec3 c = (uSkyCol * (0.10 + 0.55 * fr) * mix(0.5, 1.5, dayK) + uSunCol * 0.028 * dayK) * dirt
    + uHallLamp * (0.012 + 0.05 * streak + 0.10 * fr * dirt) * (0.93 + 0.07 * sin(uTime * 2.3 + pane.y * 2.1));
  gl_FragColor = vec4(max(c * vent, vec3(0.0)), 1.0);
}` }));
        glass.name = 'fm-hall-glass'; glass.renderOrder = 3; scene.add(glass); }
      await ctx.yield();
      for (let s = HALL[0]; s <= HALL[1] + 0.01; s += 6) { const b = B(Math.min(s, HALL[1] - 0.5)), z = Zs(s), end = s === HALL[0] || s >= HALL[1] - 0.01;
        b.mat = 0; b.aux = 0; b.box(0, 7.75, z, 10.7, 0.18, 0.16, timber); b.box(0, 8.42, z, 0.14, 1.3, 0.14, timber);
        for (const sd of [-1, 1]) { b.M.makeRotationZ(-sd * 0.24).setPosition(sd * 2.68, 8.42, z); b.box(0, 0, 0, 5.5, 0.16, 0.14, timber); b.M.makeRotationZ(sd * 0.42).setPosition(sd * 1.4, 8.22, z); b.box(0, 0, 0, 2.9, 0.1, 0.1, timber); b.M.identity(); }
        if (end) { const dz = s === HALL[0] ? 0.12 : -0.12;   // gable ends: slatted timber, a painted name board, a bulb over the mouth
          for (let k = -10; k <= 10; k++) { const x = k * 0.5, h = roofY(x) - 7.84; if (h > 0.1) b.box(x, 7.84 + h / 2, z + dz, 0.36, h, 0.04, sc(rgb(0.36, 0.25, 0.14), 0.8 + 0.25 * ((k * 0.37 + 5) % 1)), 1, 1, 0.9); }
          b.box(0, 7.4, z + dz * 2, 4.6, 0.62, 0.06, sc(PAL.red, 0.75)); b.box(0, 7.4, z + dz * 2.6, 4.2, 0.4, 0.03, rgb(0.76, 0.72, 0.58)); for (let k = -4; k <= 4; k++) b.box(k * 0.44, 7.4, z + dz * 3.1, 0.26, 0.2, 0.02, sc(k % 2 ? PAL.red : PAL.blue, 0.6));
          for (const x of [-4.4, 4.4]) { b.box(x, 6.4, z, 0.16, 2.8, 0.16, timber); } }
        await ctx.yield(); }
      for (const [ps, px] of [[138, -2.2], [170, 2.2]]) { const b = B(ps), pz = Zs(ps);   // two big aluminium pots on charcoal stoves, steaming under the lanterns
        b.mat = 3; b.aux = 0; b.cyl(px, 0.0, pz, 0.17, 0.21, 0.42, 8, rgb(0.3, 0.2, 0.15)); b.cyl(px, 0.42, pz, 0.27, 0.29, 0.32, 10, rgb(0.62, 0.63, 0.64)); b.cyl(px, 0.74, pz, 0.29, 0.06, 0.08, 10, rgb(0.66, 0.67, 0.68)); b.mat = 0; steamAt.push([ps, px, 0.84]); }
      // lanterns: three rows hung from the truss chords, swaying
      const lb = hero.makeBatch();
      for (let s = HALL[0] + 2; s < HALL[1] - 1; s += 3) for (const [x, y] of [[-2.4, 5.95], [0, 6.4], [2.4, 5.95]]) {
        const yy = y + R.range(-0.25, 0.25), ph = R.range(0, 6.28), big = x === 0 ? 1.25 : 1, c = R.pick(LC);
        lb.anim = [s, 2.1, 7.66, ph]; lb.mat = 0; lb.box(x, (7.66 + yy) / 2 + 0.04, Zs(s), 0.016, 7.66 - yy - 0.08, 0.016, DARK);
        paperLantern(lb, x, yy - 0.26 * big, Zs(s), 0.25 * big, LANT[LC.indexOf(c)], Math.min(2.2, look.lantern * 2 * (festival ? 1.1 : 1)));
        if (x > 0) await ctx.yield();
      }
      lb.anim = [0, 0, 0, 0];
      const lm = new THREE.Mesh(lb.build(), hero.propMat); lm.name = 'fm-lanterns'; scene.add(lm);
      await ctx.yield();
    }
    U.uTree2.value.set(FLAME.x + offsetAt(FLAME.s), 8.5, Zs(FLAME.s), 7.5);
    // sun shafts through the hall's three roof slits: a few soft additive sheets slanting down the sun's way (the dust in them is the hero's)
    { const P = [], A = [], I = [], yT = 8.55, tl = Math.min(yT / Math.max(sunDir.y, 0.2), 15); let n = 0;
      for (const c of [132, 150, 168]) for (const ds of [-0.6, -0.2, 0.2, 0.6]) { const s = c + ds, o = offsetAt(s);
        for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { P.push(o + u * 2.45 - sunDir.x * tl * v, yT - sunDir.y * tl * v, Zs(s) - sunDir.z * tl * v); A.push(u, v, c); }
        I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I); g.computeBoundingSphere();
      const shafts = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uSunCol: U.uSunCol, uTime: U.uTime, uCamL: U.uCamL },
        vertexShader: /* glsl */`attribute vec3 aUV; varying vec3 vUV; varying vec3 vP; void main(){ vUV = aUV; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec3 uSunCol, uCamL; uniform float uTime; varying vec3 vUV; varying vec3 vP;
float h2(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  float u = vUV.x, v = vUV.y, e = 1.0 - u * u; e *= e;
  float a = e * (1.0 - 0.7 * v) * smoothstep(0.0, 0.04, v) * (0.55 + 0.45 * n2(vec2(u * 2.5 + vUV.z, v * 3.0 - uTime * 0.17))) * (0.7 + 0.3 * n2(vec2(u * 9.0 - uTime * 0.3, v * 14.0 + vUV.z)));
  a *= smoothstep(1.2, 7.0, length(uCamL - vP));
  gl_FragColor = vec4(max(uSunCol * a * 0.075, vec3(0.0)), 1.0);
}` }));
      shafts.name = 'fm-shafts'; shafts.renderOrder = 5; scene.add(shafts); }

    // ----- the canal (s 195..285): the line climbs a trestle and crosses on a girder span. On the left the houses stop at the quay
    // (s 207) and a wide basin lies beside the track; under the span a channel runs off to the right between stilt houses -----
    const CANAL = { x0: -46, x1: -3.95, s0: 196, s1: 336, xr: 96 }, WAT = { x: -44, s: 349 };
    {
      const b = B(QUAY), b2 = B(SPAN[1]), conc = rgb(0.42, 0.40, 0.37), MR = rng.fork('fm-mural');
      { const wc = sc(R.pick(WALLS), 0.95); b2.mat = 5; b2.box(-4.25, 2.6, Zs(SPAN[1] - 0.07), 1.6, 5.2, 0.16, wc); b2.mat = 0; b2.box(-4.25, 5.25, Zs(SPAN[1] - 0.07), 1.8, 0.14, 0.3, TRIM); }
      // the wall that follows the canal on the left, facing the oncoming cab: a little flower stall with its own awning, garlands, posters, a bulb
      { const s = SPAN[1] - 0.2, z = Zs(s), c = R.pick([PAL.saffron, PAL.green, PAL.blue]);
        b2.mat = 0; b2.box(-4.3, 3.5, Zs(s - 0.35), 0.07, 1.5, 0.8, sc(PAL.red, 0.7)); b2.box(-4.3, 3.8, Zs(s - 0.35), 0.09, 0.5, 0.6, rgb(0.72, 0.7, 0.58));
        b2.M.makeRotationX(-0.3).setPosition(-4.3, 2.95, Zs(s - 0.75)); b2.box(0, 0, 0, 1.9, 0.035, 1.5, sc(c, 0.7), 1, 1, 0.8); b2.M.identity();
        for (let k = 0; k < 6; k++) { b2.anim = [s - 1.45, 4, 2.74, k]; b2.box(-5.1 + k * 0.32, 2.6, Zs(s - 1.45), 0.3, 0.26, 0.014, sc(k % 2 ? c : rgb(0.78, 0.75, 0.65), 0.68)); } b2.anim = [0, 0, 0, 0];
        b2.box(-4.3, 0.42, Zs(s - 0.6), 1.5, 0.84, 0.7, sc(WOOD, 0.9), 1, 1, 0.75);
        b2.mat = 4; b2.aux = 19; b2.blob(-4.3, 0.84, Zs(s - 0.6), 0.66, 0.24, 0.3, rgb(0.72, 0.36, 0.02), 7, 3, true, rgb(0.86, 0.56, 0.04)); b2.mat = 0; b2.aux = 0;
        for (let k = 0; k < 9; k++) garlandStrand(b2, R, -5.0 + k * 0.17, 2.55, s - 1.2, R.range(0.6, 1.2));
        for (const [px, py, pw, ph, pc] of [[-3.85, 1.9, 0.5, 0.7, PAL.blue], [-4.6, 2.05, 0.6, 0.45, PAL.red], [-3.95, 4.2, 0.7, 0.9, PAL.green]]) { b2.box(px, py, z + 0.03, pw, ph, 0.02, rgb(0.7, 0.67, 0.56)); b2.box(px, py + ph * 0.18, z + 0.045, pw * 0.8, ph * 0.4, 0.02, sc(pc, 0.6)); }
        b2.mat = 1; b2.aux = look.night ? 9 : 3; b2.blob(-4.3, 2.5, Zs(s - 0.8), 0.05, 0.06, 0.05, rgb(1.0, 0.72, 0.36), 6, 4); b2.mat = 0; b2.aux = 0;
        vendor(b2, R, -5.2, 0.27, s - 0.7, 1.15); }
      await ctx.yield();
      // the first house after the canal stands on the bank; its end wall, seen across the water, carries a sun-faded painted advertisement
      // (it stands under the chedi's sight lines from the trestle: by their rule it has one upper storey, and its painted wall sits lower on it; a crest house, on its own fork)
      const bankCap = chediCap(SPAN[1], SPAN[1] + 9, -5, -10);
      const md = 4.6 + 2 * 3.2 - building(b2, crestR(bankCap !== undefined), { ox: -5, os: SPAN[1], ux: 0, us: 1, nx: 1, ns: 0 }, 9, 5, Math.min(2, storeysUnder(bankCap)), 2, { wall: rgb(0.60, 0.42, 0.20), cap: bankCap });
      { const zz = Zs(SPAN[1] - 0.04), ink = sc(MR.pick([PAL.blue, PAL.green, PAL.red]), 0.6), bb = b2;
        bb.M.makeTranslation(-10.2, -0.28 * md, 0); bb.mat = 0; bb.box(3, 6.5, zz, 4.7, 3.1, 0.05, rgb(0.70, 0.65, 0.52));
        for (const yy of [8.0, 5.0]) bb.box(3, yy, zz + 0.012, 4.7, 0.17, 0.05, sc(PAL.red, 0.8));
        bb.blob(1.95, 6.55, zz + 0.03, 0.9, 0.9, 0.02, sc(PAL.red, 0.85), 20, 10); bb.blob(1.95, 6.55, zz + 0.05, 0.52, 0.52, 0.02, sc(PAL.saffron, 0.95), 18, 9);
        for (const [yy, ph] of [[5.72, 0], [5.46, 1.6]]) { const pts = []; for (let k = 0; k <= 16; k++) pts.push([3.05 + k * 0.118, yy + 0.07 * Math.sin(k * 1.1 + ph), zz + 0.03]); bb.tube(pts, 0.04, 4, sc(PAL.blue, 0.75)); }
        { const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([3.1 + t * 1.8, 6.22 - 0.2 * Math.sin(t * Math.PI) + (t > 0.8 ? (t - 0.8) * 3.4 : 0), zz + 0.035]); } bb.tube(pts, 0.065, 4, ink); }
        bb.box(3.85, 6.74, zz + 0.02, 0.95, 0.2, 0.05, sc(PAL.saffron, 0.9)); for (const wx of [3.45, 4.25]) bb.box(wx, 6.5, zz + 0.02, 0.045, 0.32, 0.05, ink);
        bb.box(3.95, 7.42, zz + 0.02, 1.75, 0.34, 0.05, ink); { let q = 3.2; while (q < 4.6) { const lw = MR.range(0.1, 0.22); bb.box(q + lw / 2, 7.42, zz + 0.035, lw, 0.18, 0.05, rgb(0.72, 0.67, 0.54)); q += lw + 0.07; } }
        bb.M.makeTranslation(-10.2, 0, 0);
        bb.cyl(0.45, 0, zz + 0.09, 0.05, 0.05, 9.5 - md, 6, rgb(0.33, 0.31, 0.28), false); bb.cyl(5.15, 3.3, zz + 0.09, 0.035, 0.035, 6.2 - md, 5, rgb(0.5, 0.5, 0.5), false);
        for (const wx of [1.6, 4.4]) winQuad(bb, MR(), wx, 3.0, zz + 0.046, 0.9, 1.3, true, 1, 1);
        bb.mat = 8; for (const wx of [0.95, 2.25, 3.75, 5.05]) bb.box(wx, 3.0, zz + 0.04, 0.4, 1.3, 0.04, sc(MR.pick(SHUT), 1.1)); bb.mat = 0;
        // a landing stage at its foot
        bb.box(3.5, 0.22, zz + 1.1, 6.0, 0.1, 2.3, WOOD, 1, 1, 0.8); for (const wx of [0.7, 3, 5.3]) bb.cyl(wx, -0.2, zz + 2.15, 0.08, 0.08, 1.1, 6, sc(WOOD, 0.7));
        bb.M.identity(); pot(bb, -6.4, 0.27, SPAN[1] - 1.0, R, 1.4, bushAt); pot(bb, -9.4, 0.27, SPAN[1] - 0.8, R, 1.3, bushAt); vendor(bb, R, -8.0, 0.27, SPAN[1] - 1.5, 1.15); }
      await ctx.yield();
      // the bank under the houses either side of the basin; the quay kerb with bollards where the water comes right up to the track
      for (const [s0, s1, xw] of [[CANAL.s0 - 2, QUAY, -13.7], [SPAN[1], SPAN[1] + 9, -10.6], [SPAN[1] + 9, CANAL.s1 + 2, -13.7]]) for (let s = s0; s < s1 - 0.1; s += 14) { const l = Math.min(14, s1 - s), bb = B(s + l / 2); bb.mat = 5; bb.box((xw - 3.7) / 2, 0.05, Zs(s + l / 2), -3.7 - xw, 0.42, l, conc, 1, 1, 0.7); bb.mat = 0; }
      for (let s = QUAY; s < SPAN[0] - 0.1; s += 5) { const bb = B(s + 2.5); bb.mat = 5; bb.box(-3.82, 0.1, Zs(s + 2.5), 0.38, 0.4, 5, conc, 0.9, 1, 0.75); bb.mat = 0;
        bb.cyl(-3.82, 0.3, Zs(s + 1.2), 0.11, 0.09, 0.42, 7, DARK); bb.cyl(-3.82, 0.7, Zs(s + 1.2), 0.15, 0.12, 0.07, 7, sc(PAL.saffron, 0.7)); }
      cat(b, -3.8, 0.3, QUAY + 9, rgb(0.52, 0.36, 0.18)); pot(b, -3.85, 0.3, QUAY + 0.8, R, 1.3, bushAt); pot(b, -3.85, 0.3, QUAY + 12.4, R, 1.1, bushAt);
      // where the channel cuts the lane: bank walls under the bridge abutments, and quay walls along the channel to the right
      for (const [s, d] of [[SPAN[0], -1], [SPAN[1], 1]]) { const bb = B(s); bb.mat = 5; bb.box(0, 0.08, Zs(s + d * 0.3), 8.2, 0.5, 0.6, conc, 1, 1, 0.7); bb.box((CANAL.xr + 3.9) / 2, 0.06, Zs(s + d * 0.3), CANAL.xr - 3.9, 0.46, 0.6, sc(conc, 0.95), 1, 1, 0.7); bb.mat = 0; }
      await ctx.yield();
      // stilt houses with landing stages: along the basin's far bank, along the channel's far bank (facing the oncoming cab), and across its end
      for (let s = CANAL.s0 + 2; s < CANAL.s1 - 6; s += 8.5) { const bb = B(s); building(bb, R, { ox: CANAL.x0 - 1.5, os: s, ux: 0, us: 1, nx: 1, ns: 0 }, R.range(6, 7.5), 7, 1, 1, { h0: 1.4, pitched: true });
        bb.mat = 0; bb.box(CANAL.x0 + 0.6, 0.5, Zs(s + 3), 4.4, 0.1, 3.0, WOOD, 1, 1, 0.8); for (const dz of [-1.3, 1.3]) bb.cyl(CANAL.x0 + 2.6, -0.2, Zs(s + 3 + dz), 0.08, 0.08, 1.4, 6, sc(WOOD, 0.7));
        if (R.chance(0.6)) { bb.M.makeRotationX(-Math.PI / 2).setPosition(CANAL.x0 + 3.7, 0.2, Zs(s + 3)); bb.mat = 2; bb.aux = 0.05; const hc2 = sc(R.pick([PAL.blue, PAL.red, WOOD]), 0.8); bb.box(0, 0, 0, 1.2, 4.2, 0.5, hc2, 0.3, 0.8, 0.75); bb.mat = 0; bb.box(0, -0.12, 0.256, 0.94, 3.6, 0.012, sc(hc2, 0.3), 0.3, 1, 1); bb.M.identity(); }
        if (R.chance(0.5)) pot(bb, CANAL.x0 - 0.6, 0.55, s + 2.2, R, 1.5, bushAt); await ctx.yield(); }
      for (let x = 14.5; x < CANAL.xr - 9;) { const w = R.range(6.5, 9), bb = B(SPAN[1] + 4);
        building(bb, R, { ox: x, os: SPAN[1] + 1.4, ux: 1, us: 0, nx: 0, ns: -1 }, w, 7, x < 40 && R.chance(0.4) ? 2 : 1, x < 50 ? 1 : 0, { h0: 1.4, pitched: true });
        bb.mat = 0; bb.box(x + w / 2, 0.5, Zs(SPAN[1] - 0.2), 3.2, 0.1, 3.4, WOOD, 1, 1, 0.8); for (const dx of [-1.3, 1.3]) bb.cyl(x + w / 2 + dx, -0.2, Zs(SPAN[1] - 1.7), 0.08, 0.08, 1.4, 6, sc(WOOD, 0.7));
        if (R.chance(0.6)) { const hc2 = sc(R.pick([PAL.blue, PAL.red, WOOD, PAL.green]), 0.8), bx = x + w / 2 + 3.6; bb.M.makeRotationX(-Math.PI / 2).setPosition(bx, 0.2, Zs(SPAN[1] - 1.2)); bb.M.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)); bb.mat = 2; bb.aux = 0.05; bb.box(0, 0, 0, 1.2, 4.2, 0.5, hc2, 0.3, 0.8, 0.75); bb.mat = 0; bb.box(0, -0.12, 0.256, 0.94, 3.6, 0.012, sc(hc2, 0.3), 0.3, 1, 1); bb.M.identity(); }
        if (x < 50) pot(bb, x + 0.8, 0.55, SPAN[1] + 0.6, R, 1.5, bushAt);
        x += w + R.range(0.6, 2.2); await ctx.yield(); }
      for (let s = SPAN[0] - 6; s < SPAN[1] + 8; s += 11) { building(B(SPAN[1]), R, { ox: CANAL.xr, os: s, ux: 0, us: 1, nx: -1, ns: 0 }, 10.5, 8, R.int(1, 2), 0, { h0: 1.6, pitched: true }); await ctx.yield(); }
      await ctx.yield();
      // the trestle by lamplight: a bare bulb on the handrail every 3 m, a paper lantern swinging on a pole every 9 m (outside the cab's clear box)
      const bulbAux = look.night ? 9 : look.lamp[0] > 0.05 ? 4 : 2.4, bulbC = rgb(1.0, 0.72, 0.36), LC = [rgb(0.9, 0.12, 0.06), rgb(0.95, 0.45, 0.05), rgb(0.95, 0.75, 0.15), rgb(0.9, 0.25, 0.4), rgb(0.85, 0.82, 0.7)];
      for (let s = RAMP[0] + 3, k = 0; s < RAMP[3] - 1; s += 3, k++) { const h = heightAt(s); if (h < 1.05) continue; const bb = B(s);
        for (const sd of [-1, 1]) { bb.mat = 0; bb.aux = 0; bb.box(sd * 1.815, h + 1.12, Zs(s), 0.03, 0.14, 0.03, DARK); bb.mat = 1; bb.aux = bulbAux; bb.blob(sd * 1.815, h + 1.24, Zs(s), 0.05, 0.06, 0.05, bulbC, 5, 3); bb.mat = 0; bb.aux = 0;
          if (k % 3 === (sd > 0 ? 0 : 1)) { const ph = PR() * 6.28, yT = h + 2.72, c = PR.pick(LC);
            bb.box(sd * 1.9, h + 1.4, Zs(s), 0.06, 2.8, 0.06, sc(WOOD, 0.6)); bb.box(sd * 2.06, yT + 0.04, Zs(s), 0.4, 0.05, 0.05, sc(WOOD, 0.6));
            bb.anim = [s, 2.1, yT, ph]; bb.box(sd * 2.2, yT - 0.1, Zs(s), 0.016, 0.2, 0.016, DARK);
            paperLantern(bb, sd * 2.2, yT - 0.44, Zs(s), 0.2, LANT[LC.indexOf(c)], Math.min(2.0, look.lantern * 1.1 + 0.6)); bb.anim = [0, 0, 0, 0]; } }
        await ctx.yield(); }
      // strings of bulbs on posts: along the quay beside the track, along the landing stages of the far bank, along the channel's far bank
      const festoon = (bb, x0, s0, x1, s1, y, n, r) => { const p2 = [];
        for (let k = 0; k <= n; k++) { const t = k / n; p2.push([x0 + (x1 - x0) * t, y - 0.22 * Math.abs(Math.sin(t * n * Math.PI / 4)), Zs(s0 + (s1 - s0) * t)]); }
        bb.anim = [(s0 + s1) / 2, 3, 0.014, 0]; bb.mat = 0; bb.tube(p2, 0.014, 3, DARK); bb.anim = [0, 0, 0, 0];
        for (let k = 0; k <= n; k++) { const q = p2[k]; if (k % 4 === 0) { bb.mat = 0; bb.box(q[0], y / 2, q[2], 0.06, y, 0.06, sc(WOOD, 0.7)); }
          else { bb.mat = 1; bb.aux = bulbAux * (r > 0.08 ? 1.5 : 1); bb.blob(q[0], q[1] - 0.1, q[2], r, r * 1.2, r, bulbC, 5, 3); bb.mat = 0; bb.aux = 0; } } };
      festoon(B(QUAY + 7), -3.84, QUAY + 1.2, -3.84, SPAN[0] - 0.3, 1.9, 12, 0.05);
      for (let s = CANAL.s0 + 2; s < CANAL.s1 - 10; s += 17) { festoon(B(s + 8), CANAL.x0 + 2.7, s, CANAL.x0 + 2.7, s + 17, 3.0, 16, 0.1); await ctx.yield(); }
      for (const ss of [286.5, 289.5, 292.5]) { const bb = B(ss), p2 = [], yAt = (t) => 5.2 - 0.4 * 4 * t * (1 - t);
        for (let k = 0; k <= 10; k++) { const t = k / 10; p2.push([-3.6 + 7.2 * t, yAt(t), Zs(ss)]); }
        bb.anim = [ss, 3, 0.016, 0]; bb.mat = 0; bb.aux = 0; bb.tube(p2, 0.016, 3, DARK); bb.anim = [0, 0, 0, 0];
        for (let k = 1; k <= 8; k++) { const t = k / 9; bb.mat = 1; bb.aux = bulbAux; bb.blob(-3.6 + 7.2 * t, yAt(t) - 0.09, Zs(ss), 0.06, 0.075, 0.06, bulbC, 5, 3); bb.mat = 0; bb.aux = 0; } }
      festoon(B(SPAN[1]), 13, SPAN[1] - 1.75, 45, SPAN[1] - 1.75, 3.0, 28, 0.09); festoon(B(SPAN[1]), 45, SPAN[1] - 1.75, 85, SPAN[1] - 1.75, 3.0, 28, 0.1);
      await ctx.yield();
      // a wat at the head of the basin: a gilded chedi and a temple hall, floodlit by night and mirrored in the water
      { const wb = B(345);
        await ctx.yield();
        // (the wat has no chedi of its own: the one chedi of the town stands by the station. Its hall is the larger for it: three stacked roofs,
        // a tall gilded finial on the gable that faces the bridge, a long row of tall windows lit from inside, the whole floodlit by night)
        templeHall(wb, WAT.x, WAT.s, 12, 22, 1.25, gold, { nWin: 8, winW: 1.5, winH: 0.66, finial: 5.2 });
        wb.mat = 5; wb.box(WAT.x, 0.25, Zs(WAT.s - 2.6), 9, 0.5, 3.2, rgb(0.66, 0.64, 0.58)); wb.box(WAT.x, 0.12, Zs(WAT.s - 4.6), 7, 0.24, 1.2, rgb(0.6, 0.58, 0.52)); wb.mat = 0;   // the steps before its door
        for (const sx of [-1, 1]) { wb.mat = 9; wb.cyl(WAT.x + sx * 3.4, 0.5, Zs(WAT.s - 1.4), 0.3, 0.24, 2.3, 7, gold); wb.blob(WAT.x + sx * 3.4, 3.0, Zs(WAT.s - 1.4), 0.36, 0.5, 0.36, gold, 6, 3); wb.mat = 0; }   // two gilded door guardians' posts
        wb.mat = 5; wb.box(-35, 0.16, Zs(339), 42, 0.5, 5.6, conc, 1, 1, 0.75); wb.box(-35, 0.0, Zs(336.4), 42, 0.5, 0.9, sc(conc, 0.85)); wb.mat = 0;   // the landing steps at the head of the basin
        for (const lx of [-52, -40, -28, -16]) { wb.cyl(lx, 0.4, Zs(337.2), 0.09, 0.07, 2.5, 6, rgb(0.5, 0.48, 0.42), false); paperLantern(wb, lx, 3.1, Zs(337.2), 0.26, LANT[LC.indexOf(PR.pick(LC))], Math.min(2.2, look.lantern * 2.2)); }
        festoon(wb, -55, 337.4, -15, 337.4, 2.6, 24, 0.1); }
      await ctx.yield();
    }
    await ctx.yield();

    // ----- the station yard: platform right, passing loop left, signal, clutter; chedi and temple halls beyond -----
    const SIDING = -9.5, TREE = { x: -6.4, s: 424 }, CHEDI = { x: CHEDI_AT.x, s: CHEDI_AT.s, k: 1.15 }, treeLimbs = []; let chediTop = 36;
    {
      const b = B(403), conc = rgb(0.36, 0.345, 0.32), green = rgb(0.10, 0.22, 0.18), z0 = Zs(403);
      b.mat = 0; b.box(5.3, 0.19, z0, 6.0, 0.38, 50, conc, 1, 1, 0.75); b.box(2.42, 0.386, z0, 0.2, 0.012, 50, sc(PAL.saffron, 0.85)); b.box(8.25, 0.55, z0, 0.1, 0.4, 50, sc(conc, 0.8));
      b.M.makeRotationZ(0.09).setPosition(5.45, 4.0, z0); b.box(0, 0, 0, 6.0, 0.06, 47, sc(TIN, 1.1), 1, 1, 0.6); b.M.identity();
      b.box(2.48, 3.6, z0, 0.05, 0.34, 47, green); b.box(8.42, 4.14, z0, 0.05, 0.3, 47, green);
      for (let s = 381.5; s < 426; s += 7) {
        const z = Zs(s); b.box(3.7, 2.05, z, 0.14, 3.4, 0.14, green, 0.8, 0.8); b.box(7.5, 2.2, z, 0.14, 3.7, 0.14, green, 0.8, 0.8); b.box(5.6, 3.82, z, 4.2, 0.1, 0.1, green);
        b.tube([[5.2, 3.8, z + 2], [5.2, 3.25, z + 2]], 0.012, 3, DARK); b.mat = 1; b.aux = look.night ? 8 : look.lamp[0] > 0.05 ? 3 : 1.3; b.blob(5.2, 3.16, z + 2, 0.1, 0.12, 0.1, rgb(1.0, 0.8, 0.5), 6, 3); b.mat = 0; b.aux = 0;
        if (R.chance(0.6)) { const bz = z + 3.4; b.box(7.0, 0.82, bz, 0.5, 0.06, 1.7, WOOD); b.box(7.26, 1.15, bz, 0.06, 0.5, 1.7, WOOD); b.box(7.0, 0.6, bz - 0.7, 0.4, 0.44, 0.06, DARK); b.box(7.0, 0.6, bz + 0.7, 0.4, 0.44, 0.06, DARK);
          if (R.chance(0.7)) vendor(b, R, 6.95, 0.86, 403 - (bz - z0) + R.range(-0.5, 0.5), 1.15); }
      }
      b.mat = 3; b.anim = [382.4, 2, 3.05, 1.0]; b.tube([[3.7, 3.05, Zs(382.4)], [3.7, 2.85, Zs(382.4)]], 0.012, 3, DARK); b.cyl(3.7, 2.58, Zs(382.4), 0.17, 0.07, 0.27, 9, rgb(0.78, 0.58, 0.2), true, 0.7); b.anim = [0, 0, 0, 0]; b.mat = 0;
      b.box(3.7, 3.08, Zs(382.2), 0.05, 0.05, 0.5, DARK);
      for (let s = 379.5; s < 427; s += 3.4) pot(b, 2.95 + R.range(-0.04, 0.1), 0.38, s, R, R.range(1.2, 1.6), bushAt);
      for (let k = 0; k < 9; k++) { const xx = R.range(4.3, 6.2), ss = R.range(388, 399); if (R.chance(0.5)) { b.mat = 6; for (let j = 0, st = R.int(1, 3); j < st; j++) b.box(xx, 0.54 + j * 0.31, Zs(ss), 0.42, 0.3, 0.58, sc(R.pick([PAL.blue, PAL.red, PAL.green]), R.range(0.6, 0.9)), 1.06, 1.04, 0.7); b.mat = 0; }
        else { b.cyl(xx, 0.38, Zs(ss), 0.22, 0.3, 0.34, 7, rgb(0.42, 0.31, 0.15), false, 0.7); b.mat = 4; b.aux = 14; b.blob(xx, 0.72, Zs(ss), 0.28, 0.12, 0.28, sc(R.pick([PAL.orange, PAL.green, PAL.red]), 0.7), 5, 2, true); b.mat = 0; } }
      cat(b, 7.0, 0.85, 414.6, rgb(0.14, 0.13, 0.12));
      await ctx.yield();
      building(b, R, { ox: 8.5, os: 395, ux: 0, us: 1, nx: -1, ns: 0 }, 36, 8, 1, 2, { h0: 0.55, pitched: true, wall: rgb(0.60, 0.55, 0.36) });
      building(b, R, { ox: 10, os: 447, ux: 0, us: 1, nx: -1, ns: 0 }, 22, 9, 1, 1, { h0: 1.0, pitched: true, wall: rgb(0.5, 0.36, 0.2) });
      await ctx.yield();
      for (let s = 371; s < 500; s += 11) { building(B(s), R, { ox: 29, os: s, ux: 0, us: 1, nx: -1, ns: 0 }, 10.5, 9, R.int(1, 2), s < 440 ? 1 : 0, { h0: 3.2 }); await ctx.yield(); }
      // passing loop, signal, drums, sleepers, fence, yard-side houses
      for (let s = 372; s < 489; s += 13) for (const dx of [-0.5, 0.5]) { b.mat = 0; b.box(SIDING + dx, 0.07, Zs(s + 6.5), 0.04, 0.12, 13, rgb(0.17, 0.11, 0.08)); b.mat = 3; b.box(SIDING + dx, 0.14, Zs(s + 6.5), 0.065, 0.035, 13, rgb(0.6, 0.6, 0.62), 0.8, 1, 0.45); b.mat = 0; }
      b.cyl(-7.6, 0, Zs(409), 0.07, 0.06, 4.8, 6, rgb(0.7, 0.7, 0.68), false); b.box(-7.6, 4.6, Zs(409), 0.34, 0.95, 0.24, DARK); b.box(-7.6, 5.12, Zs(409) + 0.1, 0.44, 0.06, 0.44, DARK);
      b.mat = 1; b.aux = 3.2; b.blob(-7.6, 4.4, Zs(409) + 0.13, 0.085, 0.085, 0.03, rgb(0.1, 1.0, 0.35), 6, 3); b.aux = 0.25; b.blob(-7.6, 4.82, Zs(409) + 0.13, 0.085, 0.085, 0.03, rgb(1.0, 0.1, 0.05), 6, 3); b.mat = 0; b.aux = 0;
      for (let k = 0; k < 6; k++) { b.mat = 3; b.cyl(-13.5 - (k % 3) * 0.72 + R.range(-0.05, 0.05), 0, Zs(376 + Math.floor(k / 3) * 0.74), 0.3, 0.3, 0.9, 9, sc(R.pick([PAL.blue, PAL.red, rgb(0.3, 0.32, 0.3), PAL.saffron]), 0.7)); b.mat = 0; }
      for (let j = 0; j < 4; j++) for (let k = 0; k < 5; k++) b.box(-5.2 + (j % 2 ? 0 : 0.15), 0.1 + j * 0.2, Zs(386 + k * 0.32), 2.4, 0.18, 0.26, sc(rgb(0.19, 0.14, 0.10), R.range(0.8, 1.3)));
      await ctx.yield();
      // the rain tree: a thick trunk and spreading limbs here; its crowns (flat pads of fine leaf) are grown on the limb ends below
      { const TR = rng.fork('fm-raintree'), bark = rgb(0.15, 0.13, 0.11), tx = TREE.x, tz = Zs(TREE.s);
        b.mat = 0; b.cyl(tx, -0.1, tz, 1.25, 0.8, 1.6, 10, sc(bark, 0.8), false, 0.8, bark); b.cyl(tx, 1.5, tz, 0.8, 0.62, 7.8, 10, bark, false, 1, sc(bark, 1.1));
        for (let k = 0; k < 7; k++) { const a = k * 0.9, r = 1.0 + 0.5 * (k % 2); b.tube([[tx + Math.cos(a) * 0.5, 1.6, tz + Math.sin(a) * 0.5], [tx + Math.cos(a) * r, 0.5, tz + Math.sin(a) * r], [tx + Math.cos(a) * (r + 0.9), -0.05, tz + Math.sin(a) * (r + 0.9)]], 0.2, 5, sc(bark, 0.9)); }   // buttress roots
        // (round 9: the trunk stands between the main line and the loop, 6 m left of the rails and 10 m short of the portal, and the limbs
        // reach right over the track: a parasol 28 m across whose lowest leaves clear the top of the portal. The brief's place, 9 m left,
        // is where the passing loop and its railcar run.)
        for (let i = 0; i < 10; i++) { const ring = i < 7, a = (i / (ring ? 7 : 3)) * 6.283 + TR.range(-0.25, 0.25), r = ring ? TR.range(8.2, 9.6) * 1.06 : TR.range(3.0, 4.2), y0 = ring ? TR.range(10.6, 11.5) : TR.range(12.4, 13.2);
          const ex = tx + Math.cos(a) * r, ez = tz + Math.sin(a) * r, y = y0 + 1.0 + (ring ? 1.1 * sat((ex + 5) / 4) : 0.4); treeLimbs.push([ex, y, ez, ring ? 1 : 1.12]);
          const yb = y - 3.3 * 0.8 * (ring ? 1 : 1.12);   // (the foot of the crown's own stem: the limb sweeps out, then up into it)
          b.tube([[tx, ring ? 8.0 : 9.0, tz], [tx + Math.cos(a) * r * 0.35, Math.max(yb - 0.9, 8.6), tz + Math.sin(a) * r * 0.35], [tx + Math.cos(a) * r * 0.82, yb - 0.3, tz + Math.sin(a) * r * 0.82], [ex, yb + 0.5, ez], [ex, yb + 1.7, ez]], ring ? 0.44 : 0.46, 6, bark); }
        b.mat = 0; }
      // more of a working yard: a hand trolley, sacks, a water butt, oil drums by the loop, a pile of ballast, lamp standards
      { b.mat = 3; for (const [x, s] of [[-12.4, 392], [-12.9, 392.8], [-6.3, 418]]) b.cyl(x, 0, Zs(s), 0.3, 0.3, 0.9, 9, sc(R.pick([PAL.blue, PAL.red, rgb(0.3, 0.32, 0.3)]), 0.7)); b.mat = 0;
        for (let k = 0; k < 7; k++) b.blob(-4.4 + R.range(-0.6, 0.6), 0.18 + (k > 4 ? 0.3 : 0), Zs(398 + R.range(-0.8, 0.8)), 0.42, 0.2, 0.3, sc(rgb(0.56, 0.5, 0.36), R.range(0.8, 1.1)), 7, 4);
        b.blob(-13.5, 0.0, Zs(404), 2.0, 0.8, 1.6, rgb(0.2, 0.185, 0.16), 9, 4, true, rgb(0.34, 0.32, 0.28));
        b.box(-3.6, 0.5, Zs(384), 0.9, 0.06, 1.3, WOOD); wheelX(b, -4.12, 0.22, Zs(384.3), 0.22, 0.06); wheelX(b, -3.14, 0.22, Zs(384.3), 0.22, 0.06); b.box(-3.6, 0.9, Zs(383.4), 0.9, 0.8, 0.05, sc(WOOD, 0.8));
        b.mat = 6; for (let j = 0; j < 3; j++) b.box(-3.6, 0.7 + j * 0.31, Zs(384.2), 0.42, 0.3, 0.58, sc(R.pick([PAL.blue, PAL.red, PAL.green]), 0.75), 1.06, 1.04, 0.7); b.mat = 0;
        for (const s of [396, 411.5]) { b.cyl(-6.6, 0, Zs(s), 0.07, 0.05, 5.2, 6, rgb(0.2, 0.26, 0.22), false); b.box(-6.1, 5.2, Zs(s), 1.1, 0.06, 0.06, rgb(0.2, 0.26, 0.22)); b.mat = 1; b.aux = look.night ? 9 : look.lamp[0] > 0.05 ? 3.5 : 1.2; b.blob(-5.6, 5.08, Zs(s), 0.14, 0.1, 0.14, rgb(1.0, 0.82, 0.55), 7, 4); b.mat = 0; b.aux = 0; } }
      for (let s = 370; s < 483; s += 3.2) b.box(-21, 0.6, Zs(s), 0.1, 1.2, 0.1, sc(conc, 1.1), 0.8, 0.8);
      for (let s = 370; s < 480; s += 16) { b.box(-21, 0.95, Zs(s + 8), 0.05, 0.08, 16, sc(conc, 1.1)); b.box(-21, 0.5, Zs(s + 8), 0.05, 0.08, 16, sc(conc, 1.1)); }
    }
    await ctx.yield();
    {
      const b = B(470);
      // the town's one chedi: gilded, 38 m, sixty metres left of the track beyond the station, with its two temple halls beside it
      // (the brief's far layer). It glints by day and is floodlit by night; over the vanishing point stand the cloud towers.
      // (round 16: by night its floodlights are a little warmer and stronger on the gilding, and they glow in the night haze round it: two soft
      // lights in the cloud of the town's bulbs below. Its size and place are the design's: 38 m, 60 m left of the track.)
      const top = chedi(b, CHEDI.x, CHEDI.s, CHEDI.k, look.night ? rgb(0.86, 0.52, 0.085) : gold, 1, 1, look.night ? 9 : 5);
      await ctx.yield();
      templeHall(b, CHEDI.x + 23, CHEDI.s - 22, 9, 20, 1, gold, { finial: 3.2 }); templeHall(b, CHEDI.x - 24, CHEDI.s + 4, 8, 17, 0.85, gold, { finial: 2.6 });
      await ctx.yield();
      b.mat = 5; b.box(-24.5, 0.9, Zs(451), 0.4, 1.8, 62, rgb(0.6, 0.58, 0.53)); b.mat = 0; b.box(-24.5, 1.85, Zs(451), 0.6, 0.14, 62, sc(TILE, 1.1));
      // water tower and the far side of the yard
      for (const [dx, ds] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) b.box(23 + dx, 4.5, Zs(486 + ds), 0.18, 9, 0.18, rgb(0.25, 0.22, 0.2));
      b.mat = 3; b.cyl(23, 9, Zs(486), 2.5, 2.5, 3.2, 12, rgb(0.42, 0.34, 0.3)); b.mat = 0; b.cyl(23, 12.2, Zs(486), 2.7, 0.1, 1.1, 12, sc(TIN, 0.9), false);
      let x = 16; for (const w of [10, 9, 12, 9, 11]) { building(b, R, { ox: x, os: 512, ux: 1, us: 0, nx: 0, ns: -1 }, w, 9, R.int(1, 2), 0, {}); x += w; }
      chediTop = top;
    }
    // ----- strings of bare bulbs on flex, all over the town: from roof to roof across the lane, along the crossing road, the banks of the basin and
    // the channel, the wat's landing, the platform and the yard. Each string is a thin sagging flex (here, in the town's batches); each bulb a small
    // glass (near the line) and, when the lamps are on, a sharp point in a soft halo (one Points cloud, below). Bulbs over water are mirrored in it.
    const bulbs = [], bulbGlass = look.night ? 9 : look.lamp[0] > 0.05 ? 4 : 1.6;   // [lane x, y, s, wire y, phase, mirrored]
    const bulbString = (x0, s0, y0, x1, s1, y1, n, sag, o = {}) => {
      const bb = B((s0 + s1) / 2), p2 = [], yAt = (t) => y0 + (y1 - y0) * t - sag * 4 * t * (1 - t), seg = Math.max(3, Math.min(6, Math.round(n * 0.55))), sm = (s0 + s1) / 2;
      for (let k = 0; k <= seg; k++) { const t = k / seg; p2.push([x0 + (x1 - x0) * t, yAt(t), Zs(s0 + (s1 - s0) * t)]); }
      bb.anim = [sm, 3, 0.014, 0]; bb.mat = 0; bb.aux = 0; bb.tube(p2, 0.014, 3, DARK); bb.anim = [0, 0, 0, 0];
      for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, ss = s0 + (s1 - s0) * t, yw = yAt(t), ph = ((x * 12.9898 + ss * 78.233 + k * 3.7) % 6.283 + 6.283) % 6.283;
        bulbs.push([x, yw - 0.13, ss, yw, ph, o.water ? 1 : 0, sm]);
        if (o.glass) { bb.anim = [sm, 4, yw, ph]; bb.mat = 0; bb.aux = 0; bb.mat = 1; bb.aux = bulbGlass; bb.tube([[x, yw - 0.05, Zs(ss)], [x, yw - 0.19, Zs(ss)]], 0.034, 3, rgb(1.0, 0.72, 0.36)); bb.mat = 0; bb.aux = 0; bb.anim = [0, 0, 0, 0]; } }
      if (o.post) [[x0, s0, y0], [x1, s1, y1]].forEach(([px, ps, py], e) => { const pl = Array.isArray(o.post) ? o.post[e] : o.post; if (!pl) return; const pb = B(ps); pb.mat = 0; pb.aux = 0; pb.tube([[px, py + 0.05 - pl, Zs(ps)], [px, py + 0.05, Zs(ps)]], 0.04, 3, sc(WOOD, 0.7)); });
    };
    // roof to roof across the mouth of the lane and zig-zag up the first cloth room (high over the raised cloth), along the crossing road's shopfronts
    bulbString(-5.6, -0.7, 8.7, 5.6, -0.7, 8.7, 11, 0.55, { glass: true });
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) bulbString(sd * (6 + k * 8.5), -1.25, 4.5, sd * (14.5 + k * 8.5), -1.25, 4.5, 6, 0.3, { glass: k === 0 });
    for (let k = 0; k < 5; k++) { const sa = 9 + k * 11.5, dir = k % 2 ? -1 : 1; bulbString(-5 * dir, sa, 8.7, 5 * dir, sa + 5.5, 8.7, 9, 0.5, { glass: true, post: 1.1 }); }
    // over the square: two long strings from house front to house front, high over the umbrellas, and along the shopfronts at either side
    bulbString(-13.8, YARD[0] + 5, 8.4, 13.8, YARD[0] + 19, 8.4, 17, 1.5, { glass: true }); bulbString(13.8, YARD[0] + 27, 8.4, -13.8, YARD[0] + 41, 8.4, 17, 1.5, { glass: true });
    for (const sd of [-1, 1]) for (let sa = YARD[0] + 3; sa < YARD[1] - 9; sa += 10) bulbString(sd * 13.5, sa, 4.2, sd * 13.5, sa + 10, 4.2, 6, 0.3, {});
    await ctx.yield();
    // the far bank of the basin (along the stilt houses' eaves), the backs of the lane's houses on the near bank, the wat's landing
    for (let sa = CANAL.s0 + 2; sa < CANAL.s1 - 10; sa += 8.5) bulbString(CANAL.x0 - 0.9, sa, 5.2, CANAL.x0 - 0.9, sa + 8.5, 5.2, 5, 0.3, { water: true });
    for (let sa = SPAN[1] + 10; sa < CANAL.s1 - 8; sa += 9) bulbString(-13.6, sa, 4.3, -13.6, sa + 9, 4.3, 5, 0.32, { water: true, post: [4.0, sa + 18 < CANAL.s1 - 8 ? 0 : 4.0] });
    bulbString(WAT.x - 6.6, WAT.s - 0.6, 7.6, WAT.x - 12, CANAL.s1 + 1.5, 2.9, 8, 0.5, { water: true }); bulbString(WAT.x + 6.6, WAT.s - 0.6, 7.6, WAT.x + 14, CANAL.s1 + 1.5, 2.9, 8, 0.5, { water: true });
    await ctx.yield();
    // the channel on the right: over the roofs of its far bank, and on posts along the near quay
    for (let xa = 14.5; xa < CANAL.xr - 14; xa += 9) bulbString(xa, SPAN[1] + 1.1, 6.3, xa + 9, SPAN[1] + 1.1, 6.3, 5, 0.35, { water: true });
    for (let xa = 6.5; xa < 58; xa += 8.5) bulbString(xa, SPAN[0] - 0.6, 2.9, xa + 8.5, SPAN[0] - 0.6, 2.9, 5, 0.3, { water: true, post: [2.7, xa + 8.5 < 58 ? 0 : 2.7], glass: xa < 16 });
    // roof to roof up the last straight; along the platform's canopy, across the yard to its two lamp standards, along the temple wall toward the chedi
    for (let k = 0; k < 5; k++) { const sa = 296 + k * 9.5, dir = k % 2 ? -1 : 1; bulbString(-5 * dir, sa, 8.7, 5 * dir, sa + 5, 8.7, 9, 0.5, { glass: true, post: 1.1 }); }
    for (let sa = 381.5; sa < 423; sa += 7) bulbString(2.46, sa + 0.2, 3.5, 2.46, sa + 6.8, 3.5, 5, 0.22, { glass: true });
    for (const sa of [396, 411.5]) bulbString(2.6, sa - 6.5, 5.5, -6.1, sa, 5.25, 9, 0.3, { glass: true, post: [1.9, 0] });
    for (let sa = 421; sa < 480; sa += 10) bulbString(-24.5, sa, 2.75, -24.5, sa + 10, 2.75, 5, 0.3, { post: [0.9, sa + 10 < 480 ? 0 : 0.9] });
    await ctx.yield();
    // pigeons feeding on the rails and the sleepers of the last straight, where the flock that bursts off the line takes wing: each pecks in its own time,
    // and is up and gone as that flock rises from the same place (kind 8; placed by a hash, no draw taken)
    const hsh = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    for (let k = 0; k < 7; k++) { const h1 = hsh(k * 3.1 + 0.7), h2 = hsh(k * 7.7 + 2.3), s = 293.2 + k * 0.94 + h1 * 0.5, onRail = k % 3 === 0, x = onRail ? (k % 2 ? 0.5 : -0.5) : (h2 - 0.5) * 2.2, y = onRail ? 0.155 : 0.045, z = Zs(s);
      const bb = B(s), grey = sc(rgb(0.34, 0.36, 0.42), 0.8 + 0.5 * h2), neck = k % 4 === 1 ? rgb(0.62, 0.6, 0.56) : rgb(0.16, 0.30, 0.27), dz = h1 < 0.5 ? 1 : -1;
      bb.anim = [s, 8, y, h1 * 40]; bb.mat = 0; bb.aux = 0;
      bb.blob(x, y + 0.075, z, 0.062, 0.058, 0.115, sc(grey, 0.8), 5, 2, false, grey); bb.blob(x, y + 0.165, z - dz * 0.085, 0.034, 0.04, 0.038, neck, 4, 2, false, sc(grey, 1.1));
      { const tc = sc(grey, 0.55), i0 = bb.vert(x - 0.03, y + 0.09, z + dz * 0.1, 0, 1, 0, tc.r, tc.g, tc.b); bb.vert(x + 0.03, y + 0.09, z + dz * 0.1, 0, 1, 0, tc.r, tc.g, tc.b); bb.vert(x, y + 0.075, z + dz * 0.21, 0, 1, 0, tc.r, tc.g, tc.b); bb.tri(i0, i0 + 1, i0 + 2); } bb.anim = [0, 0, 0, 0]; }
    for (const b of batches) { if (!b.nv) continue; const m = new THREE.Mesh(b.build(), hero.propMat); m.name = 'fm-town'; scene.add(m); await ctx.yield(); }

    // ----- ground beyond the hero's lane floor: road, backyards, station yard, loop ballast -----
    const FOGV = '#include <common>\n#include <fog_pars_vertex>\n', FOGF = '#include <common>\n#include <fog_pars_fragment>\n', fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const sheet = (xs, s0, s1, step, y) => {
      const P = [], O = [], I = [], nx = xs.length; let rows = 0;
      for (let s = s0; s <= s1 + 0.01; s += step, rows++) { const o = offsetAt(s); for (const x of xs) { P.push(x + o, y, Zs(s)); O.push(o); } }
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, c = a + nx; I.push(a, a + 1, c + 1, a, c + 1, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(O, 1)); g.setIndex(I); g.computeBoundingSphere();
      return g;
    };
    const SHEET_VS = FOGV + /* glsl */`attribute float aOff; varying vec3 vP; varying float vOff;
void main(){ vP = position; vOff = aOff; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
    const groundMat = new THREE.ShaderMaterial({ fog: true, uniforms: { ...fogU(), ...U, uSiding: { value: SIDING } }, vertexShader: SHEET_VS, fragmentShader: FOGF + hero.glsl + /* glsl */`
uniform float uSiding; varying vec3 vP; varying float vOff;
void main(){
  float s = uLen * 0.5 - vP.z, x = vP.x - vOff, ax = abs(x); vec2 w = vec2(x, s);
  float n1 = fmN2(w * 3.0), n2 = fmN2(w * 0.45 + 7.0), n3 = fmN2(w * 17.0), n4 = fmN2(w * 0.07 + 3.0);
  vec3 con = vec3(0.275, 0.262, 0.235) * (0.72 + 0.4 * n2) * (0.88 + 0.24 * n3);
  con *= 0.68 + 0.32 * smoothstep(0.0, 0.05, min(abs(fract(s / 3.0) - 0.5), abs(fract(x / 3.0) - 0.5)) * 3.0);
  con *= 1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.02, abs(fmN2(w * 0.55 + 20.0) - 0.5))) * smoothstep(0.5, 0.7, fmN2(w * 0.3 + 60.0));
  // the open square: old stains, painted stall bays, a drain grating now and then
  float sqK = step(uYard.x, s) * step(s, uYard.y) * step(ax, uYard.z);
  con *= 1.0 - 0.24 * sqK * smoothstep(0.45, 0.75, fmN2(w * 0.21 + 13.0));
  float bq = abs(fract((s - uYard.x - 1.8) / 5.4 + 0.5) - 0.5) * 5.4;
  float paint = max((1.0 - smoothstep(0.05, 0.085, bq)) * step(4.3, ax) * step(ax, 12.3), 1.0 - smoothstep(0.05, 0.085, min(abs(ax - 4.3), abs(ax - 12.3))));
  con = mix(con, vec3(0.50, 0.48, 0.42) * (0.6 + 0.4 * n3), sqK * paint * (0.15 + 0.55 * smoothstep(0.3, 0.7, n2)) * smoothstep(0.25, 0.5, n1 + 0.2));
  vec2 gq = vec2(ax - 3.95, mod(s - uYard.x - 4.0, 13.5) - 6.75);
  con = mix(con, vec3(0.05, 0.05, 0.055) * (0.6 + 0.8 * step(0.5, fract(s * 9.0))), sqK * step(max(abs(gq.x), abs(gq.y) * 0.75), 0.24));
  vec3 dirt = vec3(0.24, 0.19, 0.12) * (0.6 + 0.6 * n2) * (0.82 + 0.36 * n3);
  vec3 grass = vec3(0.10, 0.20, 0.05) * (0.55 + 0.9 * n1);
  vec3 col = mix(dirt, grass, smoothstep(0.45, 0.62, n4 * 0.7 + n1 * 0.3));
  col = mix(col, con, (1.0 - smoothstep(24.0, 27.0, ax)) * step(-0.6, s) * (1.0 - smoothstep(uLen, uLen + 3.0, s)));
  // the station yard: packed earth and gravel, wheel ruts, the loop's ballast and sleepers
  float yard = smoothstep(uLen - 1.0, uLen + 3.0, s) * (1.0 - smoothstep(21.0, 24.0, ax + n2 * 2.0));
  float cdist = length(uCamL - vP);
  vec3 earth = fmEarth(w, n1, n2, n3, cdist);
  earth *= 1.0 - 0.18 * (1.0 - smoothstep(0.1, 0.35, abs(fract(x * 0.31 + n2 * 0.4) - 0.5))) * smoothstep(9.0, 11.0, x);
  earth *= 1.0 - 0.5 * smoothstep(0.6, 0.8, fmN2(w * vec2(1.7, 0.45) + 31.0)) * (1.0 - smoothstep(1.6, 3.2, abs(x - uSiding)));
  col = mix(col, earth, yard);
  float sx = abs(x - uSiding), bl = (1.0 - smoothstep(1.35, 1.75, sx + (n1 - 0.5) * 0.3)) * smoothstep(uLen + 2.0, uLen + 5.0, s);
  vec3 bal = mix(vec3(0.13, 0.118, 0.10), vec3(0.34, 0.32, 0.275), fmStone(w, cdist)) * (0.7 + 0.5 * n1);
  float fsl = fract(s / 0.65), sl = (1.0 - smoothstep(0.34, 0.38, fsl)) * smoothstep(0.0, 0.03, fsl) * (1.0 - smoothstep(0.92, 0.97, sx));
  col = mix(col, mix(bal, vec3(0.19, 0.14, 0.10) * (0.6 + 0.7 * fmN2(vec2(x * 3.0, s * 40.0))), sl * 0.8), bl);
  // the crossing road: asphalt, worn centre dashes, stop bars before the rails
  float road = smoothstep(-47.0 - 3.0 * n2, -44.0 - 3.0 * n2, s) * (1.0 - smoothstep(-0.9, -0.5, s)) * (1.0 - step(s, -17.0) * smoothstep(30.0, 34.0, ax + 4.0 * n2));
  col = mix(col, fmRoad(w, n1, n2, n3), road);
  col = mix(col, col * 0.55, uWet * (0.5 + 0.5 * n2));
  vec3 lit = fmShade(col, vec3(0.0, 1.0, 0.0), vP, vOff);
  { float v2, s2; vec3 t2; fmSunEx(vP, vOff, v2, t2, s2); lit += col * vec3(0.18, 0.26, 0.48) * s2 * (0.13 / (0.08 + dot(col, vec3(0.333)))) * (1.0 - smoothstep(0.5, 1.4, uSunCol.g)); }   // by night open ground lies in a wash of moonlight, never black
  if (sqK > 0.5) { vec2 um = fmUmb(vP);   // the umbrellas' shade by day, the pools of their bulbs by night
    lit *= 1.0 - 0.72 * (1.0 - um.x) * smoothstep(0.3, 1.2, uSunCol.g); lit += col * uLamp * 1.5 * um.y; }
  vec3 V = normalize(uCamL - vP + vec3(0.0, 1e-4, 0.0)); float fr = 1.0 - max(V.y, 0.0); fr *= fr; fr *= fr;
  lit += uWet * uSkyCol * (0.06 + 0.5 * fr) * smoothstep(0.55, 0.75, n2);   // only the standing water mirrors the sky; wet earth stays dark
  gl_FragColor = vec4(max(lit, vec3(0.0)), 1.0);
  #include <fog_fragment>
}` });
    const ground = new THREE.Mesh(sheet([-1400, -220, -70, -27, -9, 9, 27, 70, 220, 1400], -160, 1200, 5, -0.08), groundMat); ground.name = 'fm-ground-wide'; scene.add(ground);
    // Seen through the previous world's portal, the engine cuts this world off at the entry plane, and the lower third of the
    // opening looks under the road at the sky's blank underside. An apron of the same road falls away steeply from the entry
    // line beneath the ground (never seen from the ride itself), so the opening's foreground is worn asphalt, paint and planks.
    { const g = new THREE.BufferGeometry(), P = [], O = [], o = offsetAt(S_ENTRY);
      for (const [ds, y] of [[0.04, -0.09], [6.5, -11.3]]) for (const x of [-90, 90]) { P.push(x + o, y, Zs(S_ENTRY + ds)); O.push(o); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(O, 1)); g.setIndex([0, 3, 1, 0, 2, 3]); g.computeBoundingSphere();   // (wound to face the camera that looks up at it from behind the entry)
      const apron = new THREE.Mesh(g, groundMat); apron.name = 'fm-entry-apron'; apron.frustumCulled = false; scene.add(apron); }
    await ctx.yield();

    // ----- the canal: glitter, sky sheen, the long-tail's wake -----
    const uBoat = { value: new THREE.Vector4(0, 0, 0, 1) }, wc = look.water.map((h) => new THREE.Color(h));
    const goldC = new THREE.Color(gold.r, gold.g, gold.b);
    const uWatCol = { value: look.night ? goldC.clone().multiply(new THREE.Color(...look.lamp)).multiplyScalar(4.2) : goldC.clone().multiply(U.uSunCol.value).multiplyScalar(0.6) };
    const waterMat = new THREE.ShaderMaterial({ fog: true, uniforms: { ...fogU(), ...U, uBoat, uWA: { value: wc[0] }, uWB: { value: wc[1] }, uGlit: { value: look.glit }, uPath: { value: look.path || 0 }, uSkyR: { value: look.skyR || 2.4 },
      uWat: { value: new THREE.Vector4(WAT.x + OFF, Zs(WAT.s + 6), 8.2, 23) }, uWatCol, uBank: { value: new THREE.Vector4(CANAL.x0, -13.7, SPAN[0], SPAN[1]) } }, vertexShader: SHEET_VS, fragmentShader: FOGF + hero.glsl + /* glsl */`
uniform vec4 uBoat, uWat, uBank; uniform vec3 uWA, uWB, uWatCol; uniform float uGlit, uPath, uSkyR; varying vec3 vP; varying float vOff;
void main(){
  vec2 w = vP.xz; float t = uTime;
  float r1 = fmN2(w * vec2(1.6, 0.7) + vec2(t * 0.25, t * 0.5)), r2 = fmN2(w * vec2(3.7, 1.9) - vec2(t * 0.4, t * 0.3)), r3 = fmN2(w * 9.0 + vec2(t * 1.1, -t * 0.8));
  // a slow swell, about 8 m from crest to crest, drifting down the basin: it tilts the mirror, so the reflected sky grades from the far bank to the near water
  float sw1 = sin(dot(w, vec2(0.62, 0.48)) + t * 0.55 + r1 * 1.5), sw2 = sin(dot(w, vec2(-0.32, 0.75)) - t * 0.42 + r2 * 1.2);
  vec3 Ns = normalize(vec3(sw1 * 0.075 + sw2 * 0.05, 1.0, sw1 * 0.05 - sw2 * 0.075));
  vec3 N = normalize(Ns + vec3((r1 - 0.5) * 0.4 + (r2 - 0.5) * 0.3, 0.0, (r2 - 0.5) * 0.35 + (r3 - 0.5) * 0.25));
  vec3 V = normalize(uCamL - vP + vec3(0.0, 1e-4, 0.0)), H = normalize(uSun + V);
  float fr = 1.0 - max(dot(N, V), 0.0); fr = fr * fr * fr;
  vec3 Rs = reflect(-V, Ns); float hz = 1.0 - clamp(Rs.y, 0.0, 1.0); hz *= hz;
  vec3 skyR = mix(uSkyCol * 1.3, uWB * (uSkyCol * uSkyR + uSunCol * 0.1), 0.2 + 0.8 * hz);
  vec3 col = mix(uWA * (uSunCol * 0.22 + uSkyCol * 1.2) * (0.8 + 0.3 * sw1 * sw2), skyR, 0.2 + 0.8 * fr);
  float sp = max(dot(N, H), 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col *= 0.8;
  float pathK = smoothstep(0.88, 0.98, dot(Rs, uSun)), glit = mix(uGlit, 1.0, pathK);   // glitter gathers into the sun's (or the moon's) path; elsewhere only a few sparks
  float nightW = 1.0 - smoothstep(0.5, 1.4, uSunCol.g);   // by night the moon's glints keep to its path, and the water between is dark
  col += uSunCol * (sp * 3.0 * mix(1.0, 0.12 + 0.6 * pathK, nightW) + glit * (smoothstep(0.81, 0.89, r3) * smoothstep(0.5, 0.64, r2) * 0.9 * (0.5 + 0.5 * sin(t * 6.0 + r1 * 40.0))
    + step(0.985, fmH2(floor(w * vec2(7.0, 3.5)) + floor(t * 4.0 + r1 * 3.0) * 7.31)) * 0.8 * smoothstep(0.4, 0.62, r1) * (0.25 + 0.75 * pathK)));
  // a low moon or sun lays a broken band of light along its own path
  vec3 Rn = reflect(-V, normalize(Ns + (N - Ns) * 0.5)); float band = smoothstep(0.965, 0.998, dot(Rn, uSun));
  col += uSunCol * uPath * (band * (0.2 + 0.9 * smoothstep(0.35, 0.75, r2)) + 0.12 * pathK * smoothstep(0.55, 0.8, r3));
  // the wat's hall at the head of the basin, mirrored: the reflected ray is tested against its lit walls, its stacked gable and the finial on it
  { vec2 hd = uWat.xy - vP.xz; float hl = max(length(Rn.xz), 1e-3); vec2 hn = Rn.xz / hl;
    float al = dot(hd, hn), miss = abs(hd.x * hn.y - hd.y * hn.x), hg = Rn.y * al / hl, q = clamp(hg / uWat.w, 0.0, 1.0);
    float rr = uWat.z * max(1.0 - 1.45 * max(q - 0.3, 0.0), 0.05 * step(q, 0.98));
    col += uWatCol * step(0.0, al) * step(0.0, hg) * step(hg, uWat.w) * (1.0 - smoothstep(rr * 0.75, rr * 1.1 + 0.5, miss)) * (0.55 + 0.45 * r2); }
  // lamps on: the lit windows and strings of bulbs of both banks lie on the water in long broken streaks
  { float lx = vP.x - vOff, ls = uLen * 0.5 - vP.z, col1 = fmN2(vec2(ls * 0.45, 3.0)), col2 = fmN2(vec2(lx * 0.45, 9.0));
    float far = exp(-max(lx - uBank.x, 0.0) * 0.085) * (0.3 + 1.2 * smoothstep(0.35, 0.8, col1)) * step(lx, -3.0);
    float near = exp(-max(uBank.y - lx, 0.0) * 0.16) * step(uBank.w + 9.0, ls) * (0.3 + 1.1 * smoothstep(0.35, 0.8, fmN2(vec2(ls * 0.5, 17.0)))) * step(lx, -3.0);
    float chan = (exp(-max(uBank.w - ls, 0.0) * 0.14) + 0.6 * exp(-max(ls - uBank.z, 0.0) * 0.2)) * (0.3 + 1.2 * smoothstep(0.35, 0.8, col2)) * step(-3.0, lx);
    col += vec3(1.0, 0.62, 0.26) * uLamp.r * (far + near + chan) * (0.35 + 0.65 * smoothstep(0.25, 0.7, r2)) * (0.55 + 0.45 * r3) * 0.42; }
  vec2 d = w - uBoat.xy; float cy = cos(uBoat.z), sy = sin(uBoat.z);
  float bh = d.x * sy + d.y * cy, adx = abs(d.x * cy - d.y * sy);   // boat space: bh = metres astern of the boat's middle
  float wk = smoothstep(-5.5, -3.6, bh) * (1.0 - smoothstep(12.0, 30.0, bh)) * exp(-max(bh, 0.0) * 0.05);
  float arm = abs(adx - (0.75 + max(bh + 4.6, 0.0) * 0.35));
  float foam = wk * (1.0 - smoothstep(0.3, 1.0 + max(bh, 0.0) * 0.07, arm)) * (0.55 + 0.45 * r3);
  foam += wk * 0.18 * (1.0 - smoothstep(0.0, 1.0, adx / (0.75 + max(bh + 4.6, 0.0) * 0.35))) * smoothstep(0.35, 0.7, r2) * smoothstep(4.0, 8.0, bh);   // churned water inside the V
  foam += (1.0 - smoothstep(0.6, 2.6, adx)) * smoothstep(8.5, 11.0, bh) * (1.0 - smoothstep(16.0, 44.0, bh)) * (0.5 + 0.5 * r2);        // the propeller's boil
  foam += (1.0 - smoothstep(0.35, 1.05, abs(adx - 0.62 - (bh + 4.6) * 0.12))) * smoothstep(-5.4, -4.4, bh) * (1.0 - smoothstep(-2.5, 1.5, bh)) * (0.7 + 0.3 * r3);   // the white bow wave curling off both sides
  col = mix(col, vec3(0.9) * (uSunCol * 0.28 + uSkyCol * 1.3) * mix(1.0, 0.6, nightW), clamp(foam * 1.3, 0.0, 0.85) * smoothstep(0.25, 0.7, r3 * 0.6 + r2 * 0.4) * (0.82 + 0.18 * r1) * uBoat.w);   // (by night the wake is a grey-blue ribbon, not a white sheet)
  // lamps on: the boat's lanterns smear warm on the water either side of the hull
  col += vec3(1.0, 0.6, 0.25) * uLamp.r * 1.3 * exp(-adx * adx * 0.22) * smoothstep(-7.0, 0.0, bh) * (1.0 - smoothstep(0.0, 7.0, bh)) * (0.45 + 0.55 * r3) * (0.6 + 0.4 * r2) * uBoat.w;
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <fog_fragment>
}` });
    const wg = [sheet([CANAL.x0, CANAL.x1], CANAL.s0, CANAL.s1, 5, 0.03), sheet([CANAL.x1, 30, CANAL.xr], SPAN[0] + 0.3, SPAN[1] - 0.3, 4.9, 0.03)];
    const water = new THREE.Mesh(mergeGeometries(wg), waterMat); wg.forEach((g) => g.dispose()); water.name = 'fm-canal'; scene.add(water);
    await ctx.yield();

    // ----- the market's own lights: every bulb of the strings above as a small sharp point in a soft halo, and, on the basin and the channel,
    // the reflection of each bulb that hangs by the water as a long trembling streak. (No lantern rises and nothing floats with a candle.)
    if (look.lamp[0] > 0.05) {
      const nW = bulbs.filter((q) => q[5]).length, n = bulbs.length + nW + (look.night ? 2 : 0), P = new Float32Array(n * 3), Bd = new Float32Array(n * 4); let j = 0;
      const put = (q, kind) => { P[j * 3] = q[0] + offsetAt(q[2]); P[j * 3 + 1] = q[1]; P[j * 3 + 2] = Zs(q[2]); Bd[j * 4] = q[6]; Bd[j * 4 + 1] = q[3]; Bd[j * 4 + 2] = q[4]; Bd[j * 4 + 3] = kind; j++; };
      for (const q of bulbs) put(q, 0); for (const q of bulbs) if (q[5]) put(q, 1);
      // the chedi's floodlights in the night haze: a wide soft glow round its upper half and a closer one round its spire (kinds 2 and 3). Light, not
      // size: they hang at the chedi's own place and depth, so every roof nearer than it hides them as it hides the chedi; the haze between is what
      // glows, so they fade as the cab comes near (gone within 85 m of it)
      if (look.night) for (const [hy, kind] of [[CHEDI_AT.h * 0.62, 2], [CHEDI_AT.h * 0.9, 3]]) put([CHEDI_AT.x, hy, CHEDI_AT.s, hy, 0, 0, CHEDI_AT.s], kind);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aB', new THREE.BufferAttribute(Bd, 4));
      const lights = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uPx: U.uPx, uTime: U.uTime, uCamS: U.uCamS, uCamL: U.uCamL, uLen: U.uLen, uGain: { value: look.night ? 1 : 0.5 }, uBend: { value: bendK },
          uBasin: { value: new THREE.Vector4(CANAL.x0, CANAL.x1, CANAL.s0, CANAL.s1) }, uChan: { value: new THREE.Vector4(CANAL.xr, SPAN[0] + 0.3, SPAN[1] - 0.3, SPAN[1]) } }, vertexShader: /* glsl */`
attribute vec4 aB; uniform float uPx, uTime, uCamS, uLen, uGain, uBend; uniform vec3 uCamL; uniform vec4 uBasin, uChan; varying vec4 vC; varying vec2 vT;
void main(){
  vec3 p = position; float d = aB.x - uCamS, w = max(aB.y - p.y, 0.0), A = d < 0.0 ? exp(d * 0.12) : 1.0 - smoothstep(0.0, 7.0, d), kind = aB.w, a = 1.0;
  // the bulb stirs on its flex exactly as its glass does (the hanging-cloth sway of the town's shader)
  p.z += (sin(uTime * 2.6 + aB.z + p.x * 2.0) * 0.32 + 0.10 * sin(uTime * 5.3 + aB.z * 3.0) + A * 0.5 * sin(-d * 1.1 + aB.z)) * w; p.x += cos(uTime * 2.1 + aB.z) * 0.07 * w;
  float fl = 0.9 + 0.1 * sin(uTime * (5.0 + 4.0 * fract(aB.z * 3.7)) + aB.z * 11.0);
  bool refl = kind > 0.5 && kind < 1.5;
  if (refl) {   // its reflection: where the sight line to the bulb's mirror image meets the water
    vec3 m = vec3(p.x, 0.06 - p.y, p.z); float k = clamp((uCamL.y - 0.03) / max(uCamL.y - m.y, 0.05), 0.0, 1.0); p = uCamL + (m - uCamL) * k; p.y = 0.07;
    float s = uLen * 0.5 - p.z, tb = clamp((s - 184.0) / 40.0, 0.0, 1.0), lx = p.x - uBend * (s - 114.0 - 40.0 * (tb * tb * tb - 0.5 * tb * tb * tb * tb) - max(s - 224.0, 0.0));
    float edge = mix(mix(uBasin.y, -10.6, step(uChan.w, s)), -13.7, step(uChan.w + 9.0, s));   // the near bank steps out past the bridge
    float inB = step(uBasin.x + 3.0, lx) * step(lx, edge) * step(uBasin.z, s) * step(s, uBasin.w), inC = step(uBasin.y, lx) * step(lx, uChan.x) * step(uChan.y, s) * step(s, uChan.z);
    a = max(inB, inC) * 0.6 * (uGain > 0.75 ? 1.0 : 0.45);   // (before dark the water is bright, and the streaks on it faint)
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  float dist = max(-mv.z, 0.5), lo = uPx * 0.011, px = uPx * (refl ? 7.0 : 0.5) / dist;
  gl_PointSize = clamp(px, refl ? lo * 4.0 : lo, uPx * (refl ? 0.3 : 0.14));
  vC = vec4(vec3(1.0, 0.60, 0.25) * (uGain * fl * a * (0.4 + 0.6 * min(1.0, px / lo)) * 2.1), kind);
  if (kind > 1.5) {   // a floodlight's glow in the haze: 34 m across round the chedi's upper half, 12 m round its spire
    float wide = step(kind, 2.5);
    gl_PointSize = clamp(uPx * mix(10.0, 28.0, wide) / dist, lo, uPx * 0.34);
    vC = vec4(vec3(1.0, 0.58, 0.19) * (mix(0.45, 0.50, wide) * smoothstep(85.0, 150.0, dist)), kind); }
  vT = vec2(aB.z, uTime);
}`, fragmentShader: /* glsl */`
varying vec4 vC; varying vec2 vT;
void main(){
  vec2 q = (gl_PointCoord - 0.5) * 2.0; float a;
  if (vC.a > 1.5) { float r2 = dot(q, q); a = exp(-r2 * 5.0) * (1.0 - smoothstep(0.35, 1.0, r2)); }   // a floodlight's glow in the haze
  else if (vC.a < 0.5) { float r2 = dot(q, q); a = (exp(-r2 * 34.0) * 2.4 + exp(-r2 * 4.5) * 0.24) * (1.0 - smoothstep(0.7, 1.0, r2)); }   // a small sharp point in a soft halo
  else {   // a long streak on the water, broken and trembling with the ripples
    float ay = abs(q.y), x = q.x + (0.035 * sin(q.y * 19.0 + vT.y * 3.1 + vT.x) + 0.02 * sin(q.y * 43.0 - vT.y * 4.7 + vT.x * 3.0)) * (0.4 + ay);
    a = exp(-x * x * 520.0) * (1.0 - ay) * (1.0 - ay) * (0.45 + 0.55 * smoothstep(-0.5, 0.4, sin(q.y * 27.0 - vT.y * 2.3 + vT.x * 5.0))) * 1.9;
  }
  gl_FragColor = vec4(max(vC.rgb * a, vec3(0.0)), 1.0);
}` }));
      lights.frustumCulled = false; lights.renderOrder = 4; lights.name = 'fm-bulb-lights'; scene.add(lights);
      await ctx.yield();
    }

    // ----- things that travel: the long-tail boat, a railcar on the passing loop, tuk-tuks idling at the crossing -----
    const moving = (build, yaw) => { const b = hero.makeBatch(true); build(b); const g = b.build(); if (yaw) g.rotateY(yaw); g.computeBoundingSphere(); const shift = new THREE.Vector3(), m = new THREE.Mesh(g, hero.makePropMaterial(shift)); m.userData.shift = shift; scene.add(m); return m; };
    const place = (m, x, y, z) => { m.position.set(x, y, z); m.userData.shift.copy(m.position); };
    const boat = moving((b) => longtail(b, R, look.night ? 14 : look.lamp[0] > 0.05 ? 2.5 : 0)); boat.frustumCulled = false;
    { // the rooster tail: spray thrown up and back from the propeller in an arc, every drop on its own beat
      const n = 96, KQ = makeRng((ctx.seed ^ 0x6b43a9b5) >>> 0), Sd = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) Sd[i] = KQ();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(Sd, 4));
      const plume = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, premultipliedAlpha: true, uniforms: { uTime: U.uTime, uPx: U.uPx, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol }, vertexShader: /* glsl */`
attribute vec4 aSeed; uniform float uTime, uPx; uniform vec3 uSunCol, uSkyCol; varying vec4 vC;
void main(){
  float ph = fract(uTime * (0.9 + 0.5 * aSeed.y) + aSeed.x), up = 1.0 + 1.2 * aSeed.z;
  vec3 p = vec3((aSeed.w - 0.5) * (0.3 + 1.3 * ph), 0.05 + up * 4.0 * ph * (1.0 - ph) * (1.0 - 0.25 * ph), 10.3 + ph * (3.2 + 2.0 * aSeed.y));
  vC = vec4(vec3(0.95) * (uSunCol * 0.62 + uSkyCol * 1.4), (0.5 + 0.4 * aSeed.z) * smoothstep(0.0, 0.08, ph) * (1.0 - ph * ph));
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uPx * (0.09 + 0.2 * ph) * (0.6 + 0.8 * aSeed.x) / max(-mv.z, 0.5), 1.5, 40.0);
}`, fragmentShader: /* glsl */`
varying vec4 vC;
void main(){ vec2 q = gl_PointCoord - 0.5; float a = max((1.0 - smoothstep(0.15, 0.5, length(q))) * vC.a, 0.0); gl_FragColor = vec4(max(vC.rgb, vec3(0.0)) * a, a); }` }));
      plume.frustumCulled = false; plume.renderOrder = 4; plume.name = 'fm-rooster-tail'; boat.add(plume); }
    await ctx.yield();
    // a second long-tail lies moored with its prow to the quay, close under the trestle: the cab climbs past it a few metres away
    const BOAT2 = { x: -9.2, s: 215.5 }, boat2 = moving((b) => longtail(b, makeRng((ctx.seed ^ 0x2a5b1e7) >>> 0), look.night ? 14 : look.lamp[0] > 0.05 ? 2.5 : 0, true), Math.PI);
    boat2.name = 'fm-moored-longtail'; place(boat2, offsetAt(BOAT2.s) + BOAT2.x, 0.05, Zs(BOAT2.s)); boat2.material.uniforms.uLaneOff.value = offsetAt(BOAT2.s);
    await ctx.yield();
    const cabR = rng.fork('fm-cab');
    const LIV2 = [[rgb(0.16, 0.30, 0.55), rgb(0.74, 0.72, 0.64)], [rgb(0.72, 0.68, 0.56), rgb(0.55, 0.07, 0.05)], [rgb(0.78, 0.33, 0.05), rgb(0.72, 0.68, 0.55)], [rgb(0.80, 0.52, 0.03), rgb(0.55, 0.07, 0.05)]];
    const car2Shift = new THREE.Vector3(), car2 = new THREE.Mesh(buildRailcar(cabR, null, LIV2[livery]).rotateY(Math.PI), hero.makePropMaterial(car2Shift));
    car2.frustumCulled = false; car2.name = 'fm-loop-railcar'; scene.add(car2);
    await ctx.yield();
    const tuks = [[-7.6, -7.0, -1.2], [7.9, -6.6, 1.35]].map(([x, s, yaw], i) => { const m = moving((b) => tuktuk(b, R, sc(R.pick([PAL.blue, rgb(0.1, 0.4, 0.3), rgb(0.7, 0.2, 0.3), PAL.saffron]), 0.9), i ? rgb(0.76, 0.73, 0.64) : sc(PAL.saffron, 0.9)), yaw); place(m, x, 0, Zs(s)); return m; });
    // one more tuk-tuk nips across the rails in front of the lane mouth as the railcar comes up to the crossing (keyed to u)
    const tukX = moving((b) => tuktuk(b, R, sc(PAL.blue, 0.9), sc(PAL.red, 0.75)), -Math.PI / 2), TUK_S = -4.2;
    car2.material.uniforms.uLaneOff.value = OFF;
    await ctx.yield();

    // ----- flora: the rain tree, coconut palms behind the roofs and round the temple, yard trees -----
    const wind = flora.makeWind({ direction: [0.5, 0.86], strength: 1.15 }), extras = [];
    await ctx.yield();
    const leafOpts = {};   // (the kit's full atlas: the platform's bougainvillea pass a metre from the cab, and at a quarter of the size their leaves showed as blocks)
    await flora.prepareLeafTexture(leafOpts, ctx.yield);   // the atlas, drawn in short steps
    await ctx.yield();
    const leafMap = flora.makeLeafTexture(leafOpts);   // (no pixel work here: prepareLeafTexture has drawn it)
    await ctx.yield();
    const fmat = flora.windMaterial({ wind, map: leafMap });
    const FR = rng.fork('fm-flora');
    const each = async (list, make) => { const out = []; for (const v of list) { out.push(make(v)); await ctx.yield(); } return out; };   // kit geometries, one per step
    await ctx.yield();
    // the rain tree's umbrella: ten small flat crowns on the limb ends, so the leaf is fine and the crown is a wide, high parasol
    const crownVar = await each([0, 1], (i) => flora.oakGeometry({ rng: FR.fork('rain' + i), detail: 1, height: 8.5, fullness: 1.5, leaf: '#3f7d2e', leafLight: '#8ab650', leafDark: '#1d4a1c', bark: '#5a4c3c' }));
    // (each crown is a small oak whose own stem would hang under its limb with a flared foot: the foot is lopped off, and the limb runs up into the stem)
    for (const g of crownVar) { const pos = g.attributes.position, ix = g.index; if (!ix) continue; const a = ix.array, keep = [];
      for (let i = 0; i < a.length; i += 3) if (!(pos.getY(a[i]) < 1.6 && pos.getY(a[i + 1]) < 1.6 && pos.getY(a[i + 2]) < 1.6)) keep.push(a[i], a[i + 1], a[i + 2]);
      g.setIndex(keep); }
    await ctx.yield();
    const crownG = [], cm = new THREE.Matrix4(), cq = new THREE.Quaternion(), cs3 = new THREE.Vector3(), cp3 = new THREE.Vector3(), UPY = new THREE.Vector3(0, 1, 0);
    for (const [i, [x, y, z, k]] of treeLimbs.entries()) { const g = crownVar[i % 2].clone(); cm.compose(cp3.set(x + OFF, y - 3.3 * 0.8 * k, z), cq.setFromAxisAngle(UPY, FR.range(0, 6.28)), cs3.set(1.45 * k, 0.8 * k, 1.45 * k)); g.applyMatrix4(cm); crownG.push(g); await ctx.yield(); }
    const rainTree = new THREE.Mesh(mergeGeometries(crownG), fmat); crownG.forEach((g) => g.dispose()); crownVar.forEach((g) => g.dispose());
    rainTree.name = 'fm-rain-tree'; scene.add(rainTree);
    await ctx.yield();
    U.uTree.value.set(TREE.x + OFF, look.treeK + 1, Zs(TREE.s), 16.5);   // its moving dapple lies on the last 25 m of ballast and the platform's edge
    const palmPts = [], addPalm = (s, x, k, v) => palmPts.push({ x: x + offsetAt(s), y: -0.1, z: Zs(s), s: k, rot: FR.range(0, 6.28), v, d: 30, u: sat(uOf(s)) });
    for (let i = 0, n = Math.round(12 * Math.min(1.2, density)); i < n; i++) { const sd = i % 2 ? 1 : -1; addPalm(FR.range(11, 80), sd * FR.range(15, 44), FR.range(0.95, 1.4), i); }
    for (let i = 0; i < 9; i++) addPalm(206 + i * 14 + FR.range(-3, 3), CANAL.x0 - FR.range(10, 18), FR.range(0.9, 1.3), i);
    for (let i = 0; i < 6; i++) addPalm(i % 2 ? FR.range(198, 216) : FR.range(266, 290), FR.range(16, 58), FR.range(1, 1.4), i);   // on the channel's banks
    for (const [s, x] of [[497, -41], [602, 31], [494, -79], [448, -84]]) addPalm(s, x, FR.range(1.1, 1.5), FR.int(0, 2));               // round the chedi
    for (const [s, x] of [[380, -27], [398, -30], [420, -47], [431, -26.5], [456, -29], [548, -74], [470, -78], [440, -88], [470, -94], [438, 22], [470, 26], [392, 21], [412, 24], [498, 6], [478, -3.5], [520, 30], [455, 40]]) addPalm(s + FR.range(-2, 2), x + FR.range(-2, 2), FR.range(0.9, 1.5), FR.int(0, 2));
    { const WR = makeRng((ctx.seed ^ 0x3ad8025f) >>> 0); for (const [ps, px] of [[330, -92], [362, -90], [366, -58], [372, -40], [348, -30], [345, -19], [356, -22]]) palmPts.push({ x: px + offsetAt(ps), y: -0.1, z: Zs(ps), s: WR.range(1.0, 1.5), rot: WR.range(0, 6.28), v: Math.floor(WR() * 3), d: 30, u: sat(uOf(ps)) }); }
    const palmR = FR.fork('palms'), palmVar = await each([0, 1, 2], (i) => flora.palmGeometry({ rng: FR.fork('pg' + i), height: 11 + i * 2.2, detail: 1, curve: 0.3 + i * 0.25 }));
    const palms = flora.makeScatter({ rng: palmR, variants: palmVar, points: palmPts, material: fmat, tint: 0.14 });
    scene.add(palms.object);
    await ctx.yield();
    const treePts = [[476, 13, 1.2], [392, -31, 0.9], [410, -36, 1.0], [426, -42, 1.0], [530, -70, 1.4], [486, 32, 1.1], [240, -62, 1.0], [60, -52, 1.1], [44, 50, 1.0]].map(([s, x, k], i) => ({ x: x + offsetAt(s), y: -0.1, z: Zs(s), s: k, rot: FR.range(0, 6.28), v: i, d: 30, u: sat(uOf(s)) }));
    const treeR = FR.fork('trees'), treeVar = await each([['o1', 13, 1.3, '#3a742c'], ['o2', 10, 1.2, '#4a8230']], ([k, height, fullness, leaf]) => flora.oakGeometry({ rng: FR.fork(k), detail: 1, height, fullness, leaf }));
    const trees = flora.makeScatter({ rng: treeR, variants: treeVar, points: treePts, material: fmat });
    scene.add(trees.object);
    await ctx.yield();
    // the flame tree in the square: an umbrella of scarlet over the stone seat
    { const fg = flora.oakGeometry({ rng: FR.fork('flame'), detail: 1, height: 9.5, fullness: 1.35, leaf: '#b5522a', leafLight: '#de9448', leafDark: '#6a3020', bark: '#5a4c3c' });
      await ctx.yield();
      const flame = flora.makeScatter({ rng: FR.fork('flame-s'), variants: [fg], points: [{ x: FLAME.x + offsetAt(FLAME.s), y: -0.1, z: Zs(FLAME.s), s: 1.15, rot: 1.3, v: 0, d: 30, u: sat(uOf(FLAME.s)) }], material: fmat, tint: 0.05, hue: 0.02 });
      scene.add(flame.object); extras.push(flame); }
    await ctx.yield();
    const bushPts = bushAt.map(([s, x, y, k], i) => ({ x: x + offsetAt(s), y, z: Zs(s), s: k, rot: FR.range(0, 6.28), v: i, d: 5, u: sat(uOf(s)) }));
    const bushR = FR.fork('bougainvillea'), bushVar = await each([['b1', 1.25, 0.85, '#d8257e', '#35702a'], ['b2', 1.1, 0.7, '#f0842a', '#3a742c'], ['b3', 1.3, 0.9, '#c41f6e', '#2f6a28']], ([k, size, flowers, flowerColor, leaf]) => flora.bushGeometry({ rng: FR.fork(k), size, flowers, flowerColor, leaf }));
    const bushes = flora.makeScatter({ rng: bushR, variants: bushVar, points: bushPts, material: fmat, sink: 0, tilt: 0, tint: 0.1 });
    scene.add(bushes.object);
    await ctx.yield();
    // weeds and grass: along the fence, between the loop's sleepers, at the platform foot, in the corners of the yard, on the quay
    const weedPts = [], addWeed = (s, x, k) => weedPts.push({ x: x + offsetAt(s), y: -0.06, z: Zs(s), s: k, rot: FR.range(0, 6.28), v: FR.int(0, 2), d: 5, u: sat(uOf(s)) });
    for (let s = 370; s < 482; s += FR.range(0.35, 0.9)) addWeed(s, -21 + FR.range(-0.7, 0.9), FR.range(0.7, 1.4));
    for (let s = 373; s < 470; s += FR.range(0.5, 1.4)) addWeed(s, SIDING + FR.pick([-1, 1]) * FR.range(0.0, 1.5), FR.range(0.35, 0.8));
    for (let s = 371; s < 428; s += FR.range(0.5, 1.3)) addWeed(s, 2.15 + FR.range(-0.25, 0.1), FR.range(0.4, 0.8));
    for (let i = 0, n = Math.round(420 * qd); i < n; i++) { const s = FR.range(371, 470), x = -FR.range(2.2, 20.5); if (Math.abs(x - SIDING) < 1.9) continue; addWeed(s, x, FR.range(0.4, 1.0) * (Math.abs(x) < 4 ? 0.6 : 1)); }
    for (let i = 0; i < 90; i++) addWeed(FR.range(371, 392), FR.range(9, 27), FR.range(0.5, 1.1));
    const weeds = flora.makeScatter({ rng: FR.fork('weeds'), variants: [flora.grassTuftGeometry({ rng: FR.fork('w1'), cards: 3, width: 1.0, height: 0.6, root: '#3a5a1e' }), flora.grassTuftGeometry({ rng: FR.fork('w2'), cards: 3, width: 0.9, height: 0.85, root: '#54662a' }),
      flora.grassTuftGeometry({ rng: FR.fork('w3'), cards: 2, width: 1.1, height: 0.5, root: '#3c6424', flower: '#e8c83a' })], points: weedPts, material: fmat, sink: 0, tilt: 0.1, tint: 0.2 });
    scene.add(weeds.object);
    await ctx.yield();

    // ----- cumulus towers building over the gulf, far ahead -----
    const CR = rng.fork('fm-clouds'), cl = [];
    for (let i = 0; i < 12; i++) { const a = -1.0 + (2.0 * (i + CR.range(0.1, 0.9))) / 12, d = CR.range(1500, 3100); cl.push([OFF + Math.sin(a) * d, CR.range(150, 260) * (d / 2300), Zs(S_PORTAL) - Math.cos(a) * d, CR.range(250, 470) * (d / 2300)]); }
    await ctx.yield();
    const cloudNoise = await cloudNoiseTexture(makeRng((ctx.seed ^ 0x7f4a7c15) >>> 0), ctx.yield);
    await ctx.yield();
    const clouds = makeCloudField({ rng: CR, sky, at: cl, wind: [-3.2, 0, 0.4], height: 1.0, noiseTexture: cloudNoise }); scene.add(clouds.object);
    await ctx.yield();
    // ----- the cloud towers: a great thunderhead dead ahead beyond the station, the thing the lane runs toward, and two smaller cumulus stepping
    // away to the right (same places and sizes as before: the great one 25 m off the last axis, 1500 m beyond the portal, 860 m tall).
    // Each is a modelled volume, not a sprite: two dozen lobes cut by the sight line in the shader. The great one is a cumulonimbus: a broad flat
    // base, a main tower of stacked turrets, a lower turret standing apart on either side with open sky (and by night its stars) between, and an
    // anvil spread from its crown toward the wind. Every lobe's outline is scalloped and its face bossed with smaller billows (cauliflower), crisp
    // on the side the light comes from and soft in shadow; the lobes swell and settle slowly, as cumulus builds.
    // By day: white with a warm lit side and lilac base. Golden hour: amber and rose, as it was before round 16.
    // By night (round 16e): a moonlit cloud, one pale blue-silver body at about half the moon's own brightness. Its lobes melt softly into one
    // another and are modelled by the moon, paler on its side and a little deeper away from it, never dark; the only dark is the soft narrow crease
    // where two lobes meet and the flat base; the outline is soft everywhere, a little crisper on the moon's side; the market's lamps are a faint
    // warmth on the lowest lobes only; stars stand round it and in its gaps; heat lightning breathes inside it (a soft glow that swells and dies
    // within, to a slow irregular rhythm of the tower's own seeded phases: never a bolt, never a flash of the sky).
    { const CB = [[-0.30, 0.13, 0.00, 0.125], [-0.14, 0.155, 0.06, 0.16], [0.05, 0.165, 0.10, 0.18], [0.24, 0.14, 0.04, 0.145], [0.38, 0.115, -0.02, 0.095], [-0.40, 0.15, -0.05, 0.075], [0.45, 0.14, -0.05, 0.05],   // the broad base
        [-0.02, 0.34, 0.12, 0.195], [0.15, 0.41, 0.05, 0.115], [-0.12, 0.46, 0.04, 0.095], [0.06, 0.50, 0.12, 0.17], [0.16, 0.60, 0.02, 0.085], [0.00, 0.64, 0.10, 0.15], [-0.10, 0.72, 0.0, 0.075], [0.07, 0.76, 0.08, 0.13], [0.14, 0.82, 0.0, 0.065], [0.02, 0.86, 0.06, 0.11],   // the main tower, turret on turret
        [-0.33, 0.30, 0.02, 0.115], [-0.36, 0.42, 0.03, 0.09], [-0.34, 0.52, 0.0, 0.07], [-0.365, 0.60, -0.02, 0.045],   // the turret that stands apart on the left
        [0.35, 0.29, 0.0, 0.105], [0.385, 0.39, 0.0, 0.07], [0.37, 0.46, -0.02, 0.045]];   // and the lower one on the right
      const P = [], Q = [], K = [], PH = [], I = []; let n = 0;
      const TW = CR.fork('fm-towers');   // (the towers' own stream, forked from the clouds' fork after its last draw: no other stream is shifted)
      // [x from the lane's last axis, distance beyond the portal, foot y, height of one cloud unit, width of one unit, lobes used, seed, flip]
      for (const [cx, cd, y0, H, Wd, ns, sd, fl] of [[-25, 1500, 60, 860, 720, 24, 0, 1], [640, 1950, 80, 560, 600, 14, 3.7, -1], [1320, 2550, 100, 500, 660, 11, 8.1, 1]]) {
        const top = ns > 20 ? 1.07 : ns > 12 ? 0.88 : 0.76, z = Zs(S_PORTAL + cd), ph = [TW.range(0, 6.283), TW.range(0, 6.283), TW.range(0, 6.283), TW.range(0, 6.283)];   // (the phases of its heat lightning)
        for (const [u, v] of [[-0.5, -0.02], [0.5, -0.02], [0.5, top], [-0.5, top]]) { P.push(OFF + cx + u * Wd, y0 + v * H, z); Q.push(u, v); K.push(sd, fl, ns); PH.push(...ph); }
        I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 3)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(PH, 4)); g.setIndex(I); g.computeBoundingSphere();
      const cc = look.cloud, v3 = (a) => ({ value: new THREE.Vector3(a[0], a[1], a[2]) });
      // the light the lobes are shaded by: the sun itself by day; for a light that stands behind the towers (the moon) or low at our back (the golden
      // sun), its direction across the picture with little depth, so that only the shoulders that face it are lit and the faces stay in the mass
      const shadeL = cc.lz === undefined ? sunDir.clone() : new THREE.Vector3(sunDir.x, sunDir.y, cc.lz).normalize();
      const towers = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uB: { value: CB.map((c) => new THREE.Vector4(c[0], c[1], c[2], c[3])) }, uL: { value: shadeL }, uTime: U.uTime,
        uLit: v3(cc.lit), uShd: v3(cc.shd), uBase: v3(cc.base), uHaze: v3(cc.haze), uGlow: v3(cc.glow), uHazeK: { value: cc.hazeK }, uRim: v3(cc.rim || [0, 0, 0]), uUnder: v3(cc.underK ? look.lamp.map((c) => c * cc.underK) : [0, 0, 0]),
        uTone: { value: new THREE.Vector4(...(cc.tone || [0.30, 0.52, 0.60, 0.80])) }, uEdge: { value: new THREE.Vector4(...(cc.edge || [0.006, 0.010, 0.003, 0])) }, uForm: { value: new THREE.Vector4(...(cc.form || [0.34, 0.5, 0, 0])) }, uMoon: { value: new THREE.Vector4(...(cc.moon || [0, 0, 0, 0])) } },
        vertexShader: /* glsl */`attribute vec2 aQ; attribute vec3 aK; attribute vec4 aPh; varying vec2 vQ; varying vec3 vK; varying vec4 vPh; void main(){ vQ = aQ; vK = aK; vPh = aPh; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec4 uB[24]; uniform vec3 uL, uLit, uShd, uBase, uHaze, uGlow, uRim, uUnder; uniform vec4 uTone, uEdge, uForm, uMoon; uniform float uTime, uHazeK; varying vec2 vQ; varying vec3 vK; varying vec4 vPh;
float h2(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
float bil(vec2 p){ return abs(2.0 * n2(p) - 1.0); }   // billows: round heads with creases between them
float bumpF(vec2 p, float sd){ return 0.6 * bil(p * 15.0 + vec2(sd, sd * 1.7)) + 0.4 * bil(p * 33.0 + vec2(sd * 2.0 + 5.2, -sd)); }
// the colour of one point of the cloud: N its lobe's normal, Nb the same bossed with the small billows, dep how far forward the lobe stands, b0 the billow there
vec3 shade(vec3 N, vec3 Nb, vec2 p, float yb, float dep, float b0, vec3 pk, float hs){
  vec2 lxy = uL.xy / max(length(uL.xy), 1e-4);
  float dif = dot(Nb, uL) * 0.5 + 0.5, up = smoothstep(yb, yb + uForm.x, p.y);
  float tone = smoothstep(uTone.x, uTone.y, dif) * 0.55 + smoothstep(uTone.z, uTone.w, dif) * 0.45;   // three painted tones: shade, half light, full light
  vec3 col = mix(uShd, uLit, tone);
  float crease = 0.80 + 0.20 * smoothstep(0.15, 0.75, N.z);
  col *= crease + 0.10 * up;                                                // each lobe darkens into the crease where it meets its neighbour
  col = mix(uBase, col, 0.30 + 0.70 * up);                                  // the flat base lies in its own shade
  // lit from behind or from the side (a low sun): the edges that face the light carry a thin bright rim
  float rim = 1.0 - clamp(Nb.z, 0.0, 1.0); rim *= rim;
  col += uRim * rim * smoothstep(0.05, 0.75, dot(Nb.xy / max(length(Nb.xy), 1e-4), lxy));
  // lit from below by the town's lamps (uForm.z: how far a lit underside turns to their amber): the flat base and the undersides of the lobes,
  // strongest low down and fading upward into the dark core (gone uForm.y above the base)
  float under = 1.0 - smoothstep(yb, yb + uForm.y, p.y); under *= sqrt(max(under, 0.0));
  float uk = max(under * (0.22 + 0.78 * smoothstep(0.35, -0.55, Nb.y)) * (0.5 + 0.5 * crease), 0.9 * (1.0 - smoothstep(yb + 0.01, yb + 0.08, p.y)));
  col = mix(col, uUnder * (0.8 + 0.4 * b0), clamp(uk, 0.0, 1.0) * uForm.z);
  // heat lightning: a soft glow that swells and dies inside the cloud, in its heart, high in its crown, low in its shoulder, each to its own slow
  // irregular rhythm; the thick lobes that stand in front stay dark against it
  vec2 ga = p - vec2(0.03, 0.44 * hs), gb = p - vec2(-0.02, 0.72 * hs), gc = p - vec2(0.14 * hs, 0.27 * hs);   // (hs: the hearts of a smaller tower sit lower, in the lobes it has)
  float gl = pk.x * exp(-dot(ga, ga) * 26.0) + 0.8 * pk.y * exp(-dot(gb, gb) * 40.0) + 0.7 * pk.z * exp(-dot(gc, gc) * 34.0);
  col += uGlow * gl * (1.0 - 0.6 * smoothstep(0.10, 0.24, dep)) * mix(1.0, 0.08, smoothstep(0.30, 0.92, N.z)) * (0.8 + 0.4 * b0);   // (the light comes round each lobe from behind: its face stays dark, a silhouette)
  return mix(col, uHaze, uHazeK * (1.0 - smoothstep(0.0, 0.55, p.y)));   // its foot stands in the haze over the gulf
}
// by night (uMoon set; the night look only): a moonlit cloud, one pale body. N: the lobes' normals melted into one another where they meet, Nb the same
// bossed, cr: 1 in the crease between two lobes and 0 on a lobe
vec3 shadeMoon(vec3 N, vec3 Nb, vec2 p, float yb, float cr, float b0, vec3 pk, float hs){
  float dif = dot(Nb, uL) * 0.5 + 0.5;
  vec3 col = mix(uShd, uLit, smoothstep(uTone.x, uTone.y, dif));            // paler on the moon's side, a little deeper away from it, never dark
  col += uRim * smoothstep(uTone.z, uTone.w, dif);                          // a little more light where a lobe turns fully to the moon
  // the lamps' warmth: on the lowest lobes only (gone uForm.y above the base), most on what faces down
  float under = 1.0 - smoothstep(yb, yb + uForm.y, p.y);
  col += uUnder * under * under * (0.4 + 0.6 * smoothstep(0.3, -0.5, Nb.y));
  // heat lightning: a soft glow that swells and dies inside the pale body, at the same three hearts and to the same seeded rhythm
  vec2 ga = p - vec2(0.03, 0.44 * hs), gb = p - vec2(-0.02, 0.72 * hs), gc = p - vec2(0.14 * hs, 0.27 * hs);
  float gl = pk.x * exp(-dot(ga, ga) * 26.0) + 0.8 * pk.y * exp(-dot(gb, gb) * 40.0) + 0.7 * pk.z * exp(-dot(gc, gc) * 34.0);
  col += uGlow * gl * (0.8 + 0.4 * b0);
  col *= 1.0 - uMoon.y * cr;                                                // dark only in the crease between lobes, soft and narrow
  col = mix(uBase, col, smoothstep(yb, yb + uForm.x, p.y));                 // and along the flat base
  return mix(col, uHaze, uHazeK * (1.0 - smoothstep(0.0, 0.55, p.y)));      // its foot stands in the haze over the gulf
}
void main(){
  float sd = vK.x; vec2 p0 = vec2(clamp(vQ.x, -0.6, 0.6) * vK.y, clamp(vQ.y, -0.1, 1.2));
  float dr = uTime * 0.012;   // the billows drift slowly through the cloud
  float w1 = n2(p0 * 7.0 + sd + vec2(dr, 0.0)), w2 = n2(p0 * 7.0 + sd + vec2(31.7, dr));
  vec2 p = p0 + (vec2(w1, w2) - 0.5) * 0.03, pd = p + vec2(dr * 0.25, 0.0);
  float b0 = bumpF(pd, sd), bx = (bumpF(pd + vec2(0.004, 0.0), sd) - b0) * 250.0, by = (bumpF(pd + vec2(0.0, 0.004), sd) - b0) * 250.0;
  float best = -9.0, edge = -1.0; vec3 N = vec3(0.0, 0.0, 1.0);
  vec3 nS = vec3(0.0); float wS = 0.0, cr = 0.0;
  for (int i = 0; i < 24; i++) { if (float(i) > vK.z - 0.5) break;   // (vK.z is a whole number carried in a varying: compared half a step off, so that rounding never lets one more lobe through)
    vec4 s = uB[i]; vec2 dv = p - s.xy; float l2 = dot(dv, dv), l = sqrt(l2), fi = float(i);
    float th = atan(dv.y, dv.x + (abs(dv.x) + abs(dv.y) < 1e-5 ? 1e-4 : 0.0));
    float r0 = s.w * (1.0 + 0.04 * sin(uTime * 0.13 + fi * 2.4 + sd)) * (0.96 + 0.10 * b0);
    float r = r0 * (0.94 + 0.10 * abs(sin(th * 2.5 + fi * 1.7 + sd)) + 0.06 * abs(sin(th * 6.5 + fi * 4.1 + sd * 2.0)));   // a scalloped outline: cauliflower heads
    edge = max(edge, r - l);
    if (l < r) { float hz = sqrt(max(r0 * r0 - l2, 0.0)), z = s.z + sqrt(max(r * r - l2, 0.0)) * 0.8; if (z > best) { best = z; N = vec3(dv, hz) / max(r0, 1e-3); } }   // (the seam between two lobes follows their scallops)
    // by night the lobes melt into one another: each weighs in by how far forward it stands there (its depth carried on beyond its outline, falling away), uMoon.x sharp
    if (uMoon.x > 0.0) { float w = exp(clamp((s.z + (l < r ? 0.8 : -0.8) * sqrt(abs(r * r - l2)) - 0.2) * uMoon.x, -60.0, 20.0));
      nS += w * normalize(vec3(dv, sqrt(max(r0 * r0 - l2, 0.0)) + 1e-4)); wS += w; } }
  // (where two lobes meet their normals part and the mean of them is shorter than either: that is the crease, full where it has lost uMoon.w of its length squared)
  if (uMoon.x > 0.0 && wS > 0.0) { N = nS / wS; cr = smoothstep(0.0, uMoon.w, 1.0 - dot(N, N)); }
  N = normalize(N + vec3(0.0, 0.0, 1e-3)); N.x *= vK.y; bx *= vK.y;   // (a mirrored tower is lit from the same side as the others)
  float yb = 0.088 + (w1 - 0.5) * 0.014;
  vec2 lxy = uL.xy / max(length(uL.xy), 1e-4);
  float toL = dot(N.xy / max(length(N.xy), 1e-4), lxy) * (1.0 - N.z * N.z);   // crisp heads on the side the light comes from, soft ones in shadow
  float a = smoothstep(0.0, mix(uEdge.y, uEdge.x, smoothstep(-0.2, 0.3, toL)), edge) * smoothstep(yb - uEdge.z, yb + uEdge.z * 2.5 + 0.002, p.y);
  // the anvil of the great tower: a flat slab spread from its crown, longer toward the wind, its ends frayed into fibres
  float aA = 0.0; vec3 Na = vec3(0.0, 0.0, 1.0);
  if (vK.z > 20.5) {
    float fib = n2(vec2(p.x * 5.0 + sd, p.y * 46.0 + sd)), fib2 = n2(vec2(p.x * 13.0 - sd, p.y * 90.0));
    float ax = p.x + 0.02, ay = p.y - 0.945, rx = ax < 0.0 ? 0.37 : 0.25, ry = ay < 0.0 ? 0.095 + 0.03 * b0 : 0.055, ex = abs(ax / rx), ey = ay / ry;
    float anv = 1.0 - sqrt(ex * ex + ey * ey * (ay > 0.0 ? ey * ey : 1.0)) + (fib - 0.5) * 0.6 * ex + (fib2 - 0.5) * 0.18;   // (flat on top, bellied below)
    aA = smoothstep(0.0, 0.08 + 0.30 * ex, anv);
    Na = normalize(vec3(ax / rx * 0.5, ay / ry * 0.9 + 0.15, 0.22 + 0.6 * smoothstep(0.0, 0.6, anv)));
  }
  if (max(a, aA) < 0.004) discard;
  // the three hearts of its heat lightning, each the sum of three slow swells with the tower's own phases: now and then they meet and the cloud glows
  vec3 f = sin(uTime * 0.31 + vPh.x + vec3(0.0, 2.1, 4.3)) + sin(uTime * 0.47 + vPh.y + vec3(0.0, 4.4, 1.3)) + sin(uTime * 0.73 + vPh.z + vec3(0.0, 1.7, 3.9));
  vec3 pk = smoothstep(vec3(0.3), vec3(2.5), f); pk = pk * pk * (0.92 + 0.08 * sin(uTime * 5.3 + vPh.w + vec3(0.0, 1.0, 2.0)));
  float hs = vK.z > 20.5 ? 1.0 : vK.z > 12.5 ? 0.62 : 0.5;
  vec3 col;
  if (uMoon.x > 0.0) {   // (uMoon.z: how much of the small billows' bossing the moon shows)
    col = shadeMoon(N, normalize(N + vec3(-bx, -by, 0.0) * 0.016 * uMoon.z + vec3(0.0, 0.0, 1e-3)), p, yb, cr, b0, pk, hs);
    if (aA > 0.004 && a < 0.996) { col = mix(shadeMoon(Na, normalize(Na + vec3(-bx, -by, 0.0) * 0.006 * uMoon.z), p, yb, 0.0, b0, pk, hs), col, a); a = max(a, aA); }
  } else {
  vec3 Nb = normalize(N + vec3(-bx, -by, 0.0) * 0.016 + vec3(0.0, 0.0, 1e-3));
  col = shade(N, Nb, p, yb, best, b0, pk, hs);
  if (aA > 0.004 && a < 0.996) {
    vec3 Nab = normalize(Na + vec3(-bx, -by, 0.0) * 0.006);
    col = mix(shade(Na, Nab, p, yb, -0.02, b0, pk, hs), col, a); a = max(a, aA); }
  }
  gl_FragColor = vec4(max(col, vec3(0.0)), a);
}` }));
      towers.name = 'fm-cloud-towers'; towers.frustumCulled = false; towers.renderOrder = 2.5; scene.add(towers); }
    await ctx.yield();

    // ----- festival day: paper lanterns and bunting strung across the slot -----
    if (festival) {
      const b = hero.makeBatch(), LC = [rgb(0.9, 0.12, 0.06), rgb(0.95, 0.45, 0.05), rgb(0.95, 0.75, 0.15), rgb(0.9, 0.25, 0.4), rgb(0.85, 0.82, 0.7)];
      for (let s = 7.5; s < 320; s += 9) {   // (the last 50 m of the slot stay clear, so the portal shows at the vanishing point)
        if (s > YARD[0] - 4 && s < FLOWER[0] + 3) continue;   // (the square, the hall and the trestle have no walls to string it between; no line is strung where the rails stand in the open)
        const yr = s > 150 ? R.range(4.75, 5.1) : R.range(5.3, 5.8), sag = R.range(0.35, 0.6), y = yr + Math.max(0, 5.1 - (yr - sag)), p2 = [], ph = R.range(0, 6.28), yAt = (t) => y - sag * 4 * t * (1 - t);   // (every line is carried high enough that its lowest lantern clears the cab by two metres)
        for (let k = 0; k <= 8; k++) { const t = k / 8; p2.push([-3.7 + 7.4 * t, yAt(t), Zs(s)]); }
        b.anim = [s, 3, 0.014, 0]; b.mat = 0; b.tube(p2, 0.014, 3, DARK);
        for (let k = 1; k <= 11; k++) { const t = k / 12, x = -3.7 + 7.4 * t, yy = yAt(t); if (Math.abs(x) > 2.3) continue;
          b.anim = [s, 4, yy, ph + k];
          if (k % 3 === 0) paperLantern(b, x, yy - 0.36, Zs(s), 0.2, LANT[LC.indexOf(R.pick(LC))], Math.min(2.0, look.lantern * 1.5));
          else b.box(x, yy - 0.2, Zs(s), 0.26, 0.34, 0.012, sc(R.pick(CLOTHES), 0.95), 1, 1, 0.9); }
        b.anim = [0, 0, 0, 0];
        await ctx.yield();
      }
      const m = new THREE.Mesh(b.build(), hero.propMat); m.frustumCulled = false; m.name = 'fm-festival'; scene.add(m);
    }
    await ctx.yield();

    // ----- fauna: pigeons that burst off the rails, flocks over the roofs, the street dog, butterflies at the garlands -----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const grey = { body: '#7d8494', belly: '#a0a6b2', wingC: '#6c7384', trail: '#8d93a3', tip: '#34363f', head: '#596070', beak: '#c8b8a0' };
    fauna.add(F.makeFlock({ rng: rng.fork('fm-burst'), species: 'crows', count: 14, size: 0.8, speed: 9, spread: [1.5, 0.8, 7], wander: [0.5, 0.4, 1.2, 0.5], maxSigma: 3, ...grey,
      cross: { path, u: uOf(317), lead: 9, angle: 0, height: 6.3, rise: 4, span: 60, bow: 0, duration } }));   // (the whole course lies over the flown line: 4.3 m over it where the flock takes wing, 8.3 m where it leaves)
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('fm-roofs'), species: 'crows', count: Math.round(30 * density), size: 0.8, spread: [30, 10, 30], wander: [4, 2, 4, 0.4], maxSigma: 3, ...grey, center: W3(392, 6, 26).toArray(), radius: 48, height: 0.6 }));   // (a level wheel 26 m up: no loop the kit can deal dips to the line)
    fauna.add(F.makeFlock({ rng: rng.fork('fm-roofs2'), species: 'crows', count: Math.min(24, Math.max(14, Math.round(20 * density))), size: 0.95, spread: [30, 4, 30], wander: [4, 0.5, 4, 0.4], maxSigma: 3, ...grey, center: W3(101, 2, 13).toArray(), radius: 10, height: 1.2, speed: 8 }));   // (wheeling low over the square: its lowest bird two metres over the flown line)
    await ctx.yield();
    fauna.add(F.makeHerd({ rng: rng.fork('fm-dog'), preset: { ...F.HERD_PRESETS.deer, h: 0.52, bodyLen: 1.05, width: 0.32, neckLen: 0.3, neckAng: 38, headLen: 0.36, headR: 0.1, headPitch: 10, ears: 0.12, tail: 0.5, tailType: 'thin', antlers: 0, graze: 0,
      coat: '#b08a55', belly: '#d2b78c', legs: '#a67e4c', sock: '#c8ac80', accent: '#b08a55', pattern: 'none', speed: 2.3, stride: 0.5, count: 1, varieties: 0 }, count: 1, mode: 'migrate', spread: [0, 0], y: 0.04,
      cross: { path, u: uOf(154), lead: 18, angle: 90, side: -1, span: 6.6, bow: 0, height: 0, duration } }));   // (in the hall, through the third sun shaft)
    await ctx.yield();
    if (!look.night) fauna.add(F.makeButterflies({ rng: rng.fork('fm-bf'), count: Math.round(34 * density * qd), path, uFrom: uOf(292), uTo: uOf(352), clear: 3.2, spread: 3.35, lift: [-1.3, 0.6], roam: [0.4, 1.0, 0.55, 0.03], size: 1.6 }));   // (behind the garland walls, over the flower heaps)
    if (!look.night) fauna.add(F.makeButterflies({ rng: rng.fork('fm-bf2'), count: Math.round(16 * density * qd), center: W3(402, 5.6, 1.4).toArray(), radius: 2.6, roam: [0.4, 1.0, 0.55, 0.03], size: 1.6 }));   // (over the platform and its potted bushes)
    await ctx.yield();

    // ----- steam off the aluminium pots; it whips along the lane as the cab passes -----
    const pots = hero.pots.concat(steamAt), NP = 14, NPB = 30, nSt = hero.pots.length * NP + steamAt.length * NPB, sP = new Float32Array(nSt * 3), sS = new Float32Array(nSt * 4), sO = new Float32Array(nSt * 2);
    { let j = 0; pots.forEach(([s, x, y], i) => { const big = i >= hero.pots.length;   // (the crossing's noodle cart: a thicker, larger plume, so the held entry view has rising steam)
      for (let k = 0, n = big ? NPB : NP; k < n; k++, j++) { sP[j * 3] = x + offsetAt(s); sP[j * 3 + 1] = y; sP[j * 3 + 2] = Zs(s); const rr = i > hero.pots.length ? PR : R; sS[j * 4] = rr(); sS[j * 4 + 1] = rr(); sS[j * 4 + 2] = rr(); sS[j * 4 + 3] = s; sO[j * 2] = offsetAt(s); sO[j * 2 + 1] = big ? 1.9 : 1; } }); }
    const steamG = new THREE.BufferGeometry(); steamG.setAttribute('position', new THREE.BufferAttribute(sP, 3)); steamG.setAttribute('aSeed', new THREE.BufferAttribute(sS, 4)); steamG.setAttribute('aOff', new THREE.BufferAttribute(sO, 2));
    const steam = new THREE.Points(steamG, new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true, uniforms: { ...fogU(), ...U }, vertexShader: FOGV + hero.glsl + /* glsl */`
attribute vec4 aSeed; attribute vec2 aOff; uniform float uPx; varying vec4 vC;
void main(){
  float ph = fract(uTime * (0.3 + 0.12 * aSeed.y) + aSeed.x), d = aSeed.w - uCamS, e = d + 5.0, push = exp(-e * e / 70.0);
  vec3 p = position;
  p.y += ph * (1.7 - 0.9 * push) * aOff.y;
  p.x += (aSeed.y - 0.5) * 0.45 * ph + sin(uTime * 1.3 + aSeed.x * 20.0) * 0.12 * ph;
  p.z += cos(uTime * 1.1 + aSeed.x * 30.0) * 0.12 * ph - push * ph * 3.2;
  float vis; vec3 tint; fmSun(p, aOff.x, vis, tint);
  vec3 c = mix(uShade * 0.25 + tint * uSunCol * 0.2 + uSkyCol * 0.5 + uLamp * 0.6 + uHallLamp * 1.1 * fmHallK(p, aOff.x), uSunCol * 0.55 + uSkyCol * 0.4, vis);
  vC = vec4(c, 4.0 * ph * (1.0 - ph) * (1.0 - ph) * 0.42);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(uPx * (0.10 + 0.34 * ph) * (0.7 + 0.6 * aSeed.z) * aOff.y / max(-mvPosition.z, 0.4), 1.0, 72.0);
  #include <fog_vertex>
}`, fragmentShader: FOGF + /* glsl */`
varying vec4 vC;
void main(){ vec2 q = gl_PointCoord - 0.5; float a = max((1.0 - smoothstep(0.08, 0.5, length(q))) * vC.a, 0.0); gl_FragColor = vec4(max(vC.rgb, vec3(0.0)) * a, a);
  #include <fog_fragment>
}` }));
    steam.frustumCulled = false; steam.renderOrder = 4; steam.name = 'fm-steam'; scene.add(steam);
    await ctx.yield();

    // ----- dust motes hanging in the hall's three sun shafts: each sinks slowly down the sun's own ray from its place in the roof slit -----
    let hallMotes = null;
    { const n = Math.round(330 * qd), mP = new Float32Array(n * 3), mS = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { const s = [132, 150, 168][i % 3] + (PR() - 0.5) * 1.3, o = offsetAt(s); mP[i * 3] = (PR() - 0.5) * 4.4 + o; mP[i * 3 + 1] = PR() * 8.1; mP[i * 3 + 2] = Zs(s); mS[i * 4] = PR(); mS[i * 4 + 1] = PR(); mS[i * 4 + 2] = PR(); mS[i * 4 + 3] = o; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(mP, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(mS, 4));
      const motes = new THREE.Points(g, new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...fogU(), ...U }, vertexShader: FOGV + hero.glsl + /* glsl */`
attribute vec4 aSeed; uniform float uPx; varying vec4 vC;
void main(){
  float y = 0.3 + mod(position.y - uTime * (0.05 + 0.12 * aSeed.x), 8.1);
  vec3 p = vec3(position.x, 8.6, position.z) - uSun * ((8.6 - y) / max(uSun.y, 0.2));
  p.x += sin(uTime * (0.3 + aSeed.y * 0.5) + aSeed.z * 40.0) * 0.25; p.z += cos(uTime * (0.25 + aSeed.x * 0.4) + aSeed.y * 40.0) * 0.2;
  float d = (uLen * 0.5 - p.z) - uCamS; p.z -= 2.0 * exp(-d * d * 0.03) * (0.4 + aSeed.z);
  float vis; vec3 tint; fmSun(p, aSeed.w, vis, tint);
  float tw = 0.5 + 0.5 * sin(uTime * (2.0 + aSeed.x * 5.0) + aSeed.y * 50.0);
  vC = vec4(vec3(1.0, 0.93, 0.78) * uSunCol, vis * tw * fmHallK(p, aSeed.w));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(uPx * (0.016 + 0.024 * aSeed.z) / max(-mvPosition.z, 0.5), 1.0, 10.0);
  #include <fog_vertex>
}`, fragmentShader: FOGF + /* glsl */`
varying vec4 vC;
void main(){ vec2 q = gl_PointCoord - 0.5; float a = 1.0 - smoothstep(0.1, 0.5, length(q));
  gl_FragColor = vec4(max(vC.rgb * vC.a * a * 0.55, vec3(0.0)), 1.0);
}` }));
      motes.frustumCulled = false; motes.renderOrder = 5; motes.name = 'fm-shaft-motes'; scene.add(motes); hallMotes = motes; }
    await ctx.yield();

    // ----- weather and the rare gust -----
    const rain = look.rain ? fx.makeParticles({ rng: rng.fork('fm-rain'), preset: 'rain', time: T, count: Math.round(3000 * qd), box: [7, 14, 30], size: [0.018, 0.032], stretch: 0.045, intensity: 1.1, opacity: 0.28, colors: ['#fff4d8', '#eaf2ff', '#ffe9b8'] }) : null;
    if (rain) scene.add(rain.object);
    const petals = rare ? fx.makeParticles({ rng: rng.fork('fm-petals'), preset: 'petals', time: T, count: Math.round(4000 * qd), box: [9, 7, 44], size: [0.07, 0.15], intensity: 1.7, colors: ['#ffb020', '#ff8a10', '#ffd040'], velocity: [0, -0.3, 7] }) : null;
    if (petals) { petals.setOpacity(0); scene.add(petals.object); }
    // a thin drift of marigold petals in the flower quarter, every visit
    const drift = fx.makeParticles({ rng: rng.fork('fm-drift'), preset: 'petals', time: T, count: Math.round(520 * qd), box: [8, 6.5, 34], size: [0.06, 0.13], intensity: 1.5, colors: ['#ffb020', '#ff8a10', '#ffd040'], velocity: [0.3, -0.35, 1.2] });
    drift.setOpacity(0); scene.add(drift.object);
    // scarlet petals off the flame tree drift across the square (time-driven: the square is never still)
    const flamePetals = fx.makeParticles({ rng: makeRng((ctx.seed ^ 0x1b873593) >>> 0), preset: 'petals', time: T, count: Math.round(700 * qd), box: [26, 9, 30], size: [0.08, 0.16], intensity: look.night ? 0.55 : 1.5, colors: ['#e2401c', '#ff6a2a', '#c8281e'], velocity: [0.6, -0.5, 0.7] });
    flamePetals.setOpacity(0); scene.add(flamePetals.object);
    // a second tuk-tuk crosses the rails in the square, well ahead of the cab (keyed to the cab's place on the line)
    const tukY = moving((b) => tuktuk(b, R, sc(rgb(0.1, 0.4, 0.3), 0.9), sc(PAL.saffron, 0.9)), -Math.PI / 2), TUK2_S = 100;
    const sunBase = U.uSunCol.value.clone();
    await ctx.yield();

    // ----- our railcar: the cab rides with the camera -----
    const cab = buildCab(hero, cabR, livery); scene.add(cab.object);
    const cabO = cab.object; cabO.rotation.order = 'YXZ';
    const CAB_YAW = 0.85, MIR = [-1.15, -0.2, -1.44], MIR_YAW = Math.atan2(-MIR[0], -MIR[2]);
    const CAB_OUT = 1.12;   // the cab is drawn a little large, so the visor and the pillars sit just outside the picture and only the bonnet and lamp frame it (the mirror is not drawn)
    await ctx.yield();

    const tan = new THREE.Vector3(), fwd = new THREE.Vector3(), camP = new THREE.Vector3(), camQ = new THREE.Quaternion(), camM = new THREE.Matrix4(), boatAt = new THREE.Vector3();
    const TAN31 = Math.tan((31 * Math.PI) / 180), poiA = new THREE.Vector3(), poiB = new THREE.Vector3(), poiC = new THREE.Vector3(), poiD = new THREE.Vector3(), poiE = new THREE.Vector3();
    // the long-tail comes down the basin toward us on the left (its ribboned prow and bow wave three-quarter on as the quay opens),
    // swings across the bow of the trestle and runs under the girder span just ahead of the nose, then away down the channel to
    // the right: a function of the cab's place on the line. boatPose writes lane x, s and yaw into BP.
    const BP = { x: 0, s: 0, yaw: Math.PI }, BOAT_R = 20, BOAT_S = 242;
    const boatPose = (camS) => { const q = 101.4 + 0.9 * (camS - 228), A = 68, C = A + BOAT_R * Math.PI / 2;
      if (q < A) { BP.x = -2 - BOAT_R; BP.s = BOAT_S + BOAT_R + (A - q); BP.yaw = Math.PI; }
      else if (q < C) { const f = (q - A) / BOAT_R; BP.x = -2 - BOAT_R * Math.cos(f); BP.s = BOAT_S + BOAT_R - BOAT_R * Math.sin(f); BP.yaw = Math.atan2(-Math.sin(f), -Math.cos(f)); }
      else { BP.x = -2 + (q - C); BP.s = BOAT_S; BP.yaw = -Math.PI / 2; }
      return BP; };
    // the wave's lead: 7 m in the cloth rooms (the lifting rows fill the top of the frame and the shut tunnel is close ahead); from the
    // bridge's crest it runs out to 55 m, so the cloth roofs of the flower quarter unzip below in one sweep; as the cab comes down among
    // them the far rows settle shut again and the ordinary wave takes over, until the last rows lift like theatre curtains on the station
    // (the lane's own lead at the entry: 16 m as the cab comes over the crossing, so the first rows already stand half lifted in front of the shut tunnel; it settles to 7 m by the first stalls)
    const leadAt = (s) => 7 + 9 * (1 - sstep(-16, 2, s)) + 48 * sstep(236, 272, s) - 46 * sstep(286, 312, s) + 31 * sstep(326, 342, s);
    function update(dt, time, camera, u) {
      T.value = time;
      camP.setFromMatrixPosition(camera.matrixWorld); camQ.setFromRotationMatrix(camM.extractRotation(camera.matrixWorld));
      const camS = Math.max(-17, LEN / 2 - camP.z);
      // the wave: shut at the entry, peeling open 5 to 9 m in front of the eye through the lane, stretching to 40 m for the last straight
      hero.setCamS(camS); hero.setLead(leadAt(camS));
      // in the cloth corridor and the flower quarter the cloth shuts within 7 m of the lead, so the dim, glowing tunnel fills the middle of the frame; 11 m elsewhere
      U.uRamp.value = 7 + 5 * (1 - sstep(-16, 4, camS)) + 4 * sstep(58, 70, camS) - 4 * sstep(278, 290, camS) + 4 * sstep(336, 348, camS);
      garlandWall.visible = camS > 200;
      // things that are never culled by the renderer are not drawn where they cannot be seen: the hall's motes away from the hall, the long-tail while the
      // hall and the houses stand between it and the line or once it has run off astern, the tuk-tuks once they are behind, the loop's railcar from the far end of the lane
      hallMotes.visible = camS > HALL[0] - 64 && camS < HALL[1] + 4; boat.visible = camS > 150 && camS < 264; tukX.visible = camS < 26; tukY.visible = camS > 20 && camS < TUK2_S + 14; car2.visible = camS > 200;
      boat2.visible = camS > 110 && camS < 300; boat2.position.y = 0.05 + 0.035 * Math.sin(time * 1.3 + 1.0); boat2.rotation.set(0.012 * Math.sin(time * 1.1), 0, 0.035 * Math.sin(time * 0.9 + 2.0)); boat2.userData.shift.copy(boat2.position);
      if (look.rain) U.uSunCol.value.copy(sunBase).multiplyScalar(0.85 + 0.15 * Math.sin(time * 0.785));   // sun-shower: cloud shadow drifts over, the sun pool dims and brightens
      drift.setOpacity(0.9 * sstep(262, 292, camS) * (1 - sstep(350, 372, camS))); drift.update(dt, time, camera);
      flamePetals.setOpacity(0.9 * sstep(36, 62, camS) * (1 - sstep(106, 122, camS))); flamePetals.update(dt, time, camera);
      if (rare) { const g = U.uGust.value, k = sstep(250, 252, camS) * (1 - sstep(274, 290, camS)); g.set(camS + 24 + (camS - 250) * 16, k); petals.setOpacity(sstep(251, 255, camS) * (1 - sstep(282, 300, camS))); petals.update(dt, time, camera); }
      hero.update(dt, time, camera);
      // the cab: aligned with the rails, rocking on the joints, drawn in from outside the frame as the flight begins. It is scaled to
      // the live projection so that visor, nose and pillars keep the same places at the frame's edges at any shape of screen.
      const k = sstep(0, 0.007, u), jt = camS / 11 - Math.floor(camS / 11), thump = Math.exp(-jt * 7) * Math.sin(jt * 40);
      const pe = camera.projectionMatrix.elements, ky = CAB_OUT / (Math.max(pe[5], 0.05) * TAN31), kx = Math.max(0.4, CAB_OUT / (Math.max(pe[0], 0.05) * TAN31 * 1.778)), km = Math.min(kx, ky), gy = km / ky;
      { const m = 1 + 0.7 * (1 - k); cabO.scale.set(kx * m, ky * m, 1); } { const gs = Math.sqrt(gy); cab.garland.scale.set(1, gs, 1); cab.garland.position.y = -0.975 + 0.06 * (1 - gs); }   // on a tall screen the beads are squashed only half way and re-seated, so they stay on top of the bonnet's crown
      cab.mesh.material.uniforms.uLaneOff.value = offsetAt(camS); cab.mirror.scale.set(km / kx, km / ky, 1); cab.lamp.scale.set(km / kx, km / ky, 1);
      path.tangentAt(u, tan);
      cabO.visible = u > 0;
      cabO.position.copy(camP); cabO.position.y -= 0.095 * ky - 0.006 * Math.sin(camS * 0.52) - 0.004 * thump;   // (the cab comes in by shrinking to its place from outside the frame's edges over the first 0.3 s: slid up from below, its roof wiped across the whole picture)
      fwd.set(0, 0, -1).applyQuaternion(camQ); const yT = Math.atan2(-tan.x, -tan.z); let dy = Math.atan2(-fwd.x, -fwd.z) - yT; dy -= Math.round(dy / 6.2831853) * 6.2831853;
      // (pitch: on the trestle the cab climbs and dips with the rails, and follows the gaze for the rest, as it does in yaw)
      const pT = Math.asin(Math.max(-0.9, Math.min(0.9, tan.y))), pC = Math.asin(Math.max(-0.9, Math.min(0.9, fwd.y)));
      cabO.rotation.set(pT + 0.88 * (pC - pT) + 0.0035 * Math.sin(camS * 1.04) + 0.004 * thump, yT + CAB_YAW * dy, 0.0105 * Math.sin(camS * 0.52 + 1.0));
      // the mirror keeps its place at the frame's edge whichever way the gaze turns: it turns with the camera, not with the bonnet
      { const a = (1 - CAB_YAW) * dy, ca = Math.cos(a), sa = Math.sin(a); cab.mirror.position.set(MIR[0] * ca + MIR[2] * sa, MIR[1], -MIR[0] * sa + MIR[2] * ca); cab.mirror.rotation.set(0, MIR_YAW + a, 0); }
      cab.mirror.visible = false;   // strangers read the small mirror at the left edge as a blob stuck to the frame; with the gaze turning it cannot be held just outside the picture, so it is not drawn
      cab.shift.copy(cabO.position);
      cab.garland.rotation.z = 0.03 * Math.sin(time * 2.3) + 0.015 * Math.sin(camS * 0.52); cab.garland.rotation.x = 0.05 * Math.sin(time * 1.7 + 1.0) + 0.03 * thump; cab.garland.position.x = 0.02 * Math.sin(time * 2.3 + 0.6);
      // the long-tail on the canal comes toward us through the gap, ahead and to the left; the railcar on the loop comes the other way too
      const bp = boatPose(camS), sb = bp.s;
      boat.position.set(offsetAt(sb) + bp.x, 0.05 + 0.03 * Math.sin(time * 1.7), Zs(sb)); boat.rotation.set(-0.03 - 0.012 * Math.sin(time * 2.3), bp.yaw, 0.03 * Math.sin(time * 1.1)); boat.userData.shift.copy(boat.position); boat.material.uniforms.uLaneOff.value = offsetAt(sb);
      uBoat.value.set(boat.position.x, boat.position.z, bp.yaw, 1);
      place(tukY, offsetAt(TUK2_S) - 15 + 26 * sat((camS - 58) / 34), 0.006 * Math.sin(time * 27) + 0.004 * Math.sin(time * 41), Zs(TUK2_S)); tukY.material.uniforms.uLaneOff.value = offsetAt(TUK2_S);
      const s2 = 452 - 0.5 * Math.max(camS - 335, 0);
      car2.position.set(OFF + SIDING, 0.012 * Math.sin(s2 * 0.52), Zs(s2)); car2.rotation.z = 0.008 * Math.sin(s2 * 0.52 + 1.0); car2Shift.copy(car2.position);
      for (let i = 0; i < tuks.length; i++) tuks[i].position.y = 0.006 * Math.sin(time * 31 + i * 2) + 0.004 * Math.sin(time * 47 + i);
      place(tukX, -11 + 24 * sat(u / 0.03), 0.006 * Math.sin(time * 29) + 0.004 * Math.sin(time * 43), Zs(TUK_S));
      sky.update(dt, time, camera); rig.update(dt, time, camera); clouds.update(dt, time, camera);
      for (let i = 0; i < extras.length; i++) extras[i].update(dt, time, camera);
      palms.update(dt, time, camera); trees.update(dt, time, camera); bushes.update(dt, time, camera); weeds.update(dt, time, camera); flora.updateWind(wind, time);
      fauna.update(dt, time, camera, u);
      if (rain) { rain.setOpacity(0.28 * (1 - sstep(HALL[0] - 14, HALL[0] - 1, camS) * (1 - sstep(HALL[1] - 6, HALL[1] + 6, camS)))); rain.update(dt, time, camera); }   // (no rain under the hall's roof)
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 4500); path.pointAt(0, c0.position); c0.lookAt(W3(0, 0, EYE)); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration,
      // the brief's speed table: slower over the crossing and into the lane, full speed through the market, easing past the canal
      pace: (u) => 0.72 + 0.33 * sstep(0.04, 0.3, u) - 0.12 * sstep(uOf(60), uOf(72), u) * (1 - sstep(uOf(100), uOf(112), u)) - 0.13 * sstep(uOf(120), uOf(134), u) * (1 - sstep(uOf(174), uOf(190), u)) - 0.24 * sstep(uOf(204), uOf(222), u) * (1 - sstep(uOf(262), uOf(282), u)),
      title: look.title + (festival ? ' (Festival Day)' : ''),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 4500, lookAhead: 22, sway: 0.45, bank: 0.3 },
      pois: [
        { at: (time, u) => { const cs = S_ENTRY + u * (S_PORTAL - S_ENTRY); return W3(cs + 8, -3.4, 2.0, poiA); }, from: uOf(8), to: uOf(50), weight: 0.7, fade: 0.3 },      // the left-hand stall fronts and trays, close by
        { at: (time, u) => { const cs = S_ENTRY + u * (S_PORTAL - S_ENTRY); return W3(cs + 14, -9, 4.5, poiB); }, from: uOf(72), to: uOf(106), weight: 0.55, fade: 0.25 },     // the square: the flame tree and the umbrellas on the left
        { at: (time, u) => { const cs = S_ENTRY + u * (S_PORTAL - S_ENTRY); return W3(cs + 10, 2.5, 7.5, poiC); }, from: uOf(124), to: uOf(186), weight: 0.6, fade: 0.25 },    // up and right into the hall's lanterns and roof slits
        { at: (time, u) => { const cs = S_ENTRY + u * (S_PORTAL - S_ENTRY); return W3(cs + 62, -30, 5 + heightAt(cs), poiD); }, from: uOf(206), to: uOf(250), weight: 0.5, fade: 0.35 },   // out over the basin: the water, the far bank, the wat at its head
        { at: (time, u) => { const cs = S_ENTRY + u * (S_PORTAL - S_ENTRY); return W3(cs + 7, 3.2, 4.6, poiE); }, from: uOf(292), to: uOf(336), weight: 0.7, fade: 0.3 },     // the right-hand awnings lifting, the garland wall
        { at: (time, u) => { const bp = boatPose(S_ENTRY + u * (S_PORTAL - S_ENTRY)); return W3(bp.s, bp.x, 1.2, boatAt); }, from: uOf(199), to: uOf(224), weight: 0.25, fade: 0.3 },   // the long-tail, coming down the basin and under the bridge
        { at: W3(CHEDI.s, CHEDI.x, 22), from: uOf(366), to: uOf(404), weight: 0.2, fade: 0.4 },           // in the yard, for a moment: the chedi, blazing gold on the left
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: look.glow, revealDistance: 200 },
      post: { exposure: look.exposure, bloom: look.bloom, grade: { aberration: 0, ...look.grade } },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); skyNoise.dispose(); cloudNoise.dispose(); },
    };
  },
};
