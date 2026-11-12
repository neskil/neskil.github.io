// The Carnival on the Frozen River (Orlando, Virginia Woolf, 1882 to 1941): the winter of the Great Frost.
//
// A place that STANDS. The flight begins high over a white city on a still night (snow roofs, chimney smoke bending
// with the one wind, frozen birds lying on the roofs), comes down over the embankment onto a river frozen to clear dark glass and runs
// low down an alley of lantern-hung arcades and drinking booths, past a maze of clipped evergreens, striped pavilions,
// balloons hanging still and the salted bonfires that burn green, orange and purple, each doubled in the ice. It
// crosses the silken rope into the court's ground (the pagoda, the dancers), goes out over the swept ice where a
// porpoise, flounders and eels hang frozen and a sunk boat spills red apples round a seated shape on the bed, and passes
// the foreign ship frozen at her moorings. There the fast ice ends: its last metres are crazed with white cracks that
// stand in it, and below a broken edge, under a yellow morning that stands over that reach, the river lies parted into
// floes over fast yellow water: booths with their lanterns lit, a table laid for twenty, a bed, a bonfire still burning,
// each on a floe that an eddy turns; bergs reared as high as a house; slabs heaped at the piers of the great bridge of
// houses; small floes sailing through its arches. The ring stands in the widest arch with that reach's low sun behind it.
//
// HOW THE PLACE IS MADE. Everything is laid out by a plan in the river's own frame (src/parts, carnivalPlan): metres
// along the river's middle line and metres to its right. The plan is arithmetic only, so the same plan is replayed
// under node for the camera and for the clearances of every thing near the line.
//
// WHAT IS DRIVEN BY WHAT.
//   By the metres flown or a place of the route: ONLY the film's pace (a little faster from the alley's first arcade
//     bay to its last, slower from where the clear ice begins to the broken edge) and two pulls of the gaze (the pagoda,
//     from the alley's last bay to the far side of the dancers' ring; the sunk boat, from where the clear ice begins to
//     where the boat lies abeam). Nothing of the place begins, turns or ends as
//     the visitor comes; update() does not read u.
//   By place (a standing state, the same for every visitor from the first frame to the last): the broken reach (the
//     crazed edge, every floe built where a fixed age by river metre has carried it, the yellow water, the reared
//     bergs, the slabs at the piers, the laden floes, the fire that burns on one of them), and the two lights (night
//     over the fast ice, a yellow morning over the broken reach, joined by the river metre of the lit point). The sky
//     is ONE standing sky joined by direction: night at the zenith and up the river, the yellow morning low down it;
//     by night a small winter moon stands low in it, at a height and a bearing of the sky's own (a stream of its own,
//     anywhere round the sky away from the yellow quarter: in or out of the picture as the route turns). The spire
//     stands by the town's rule (anywhere along the near bank), the ship head to the stream. Past the silken rope the ice is swept bare down to its broken edge
//     (the frost thins there by the place's metres along the race).
//   By the world clock (habits, right at any phase, each proved against the whole line over every phase at once):
//     flames, sparks, glitter, smoke rising, bending and wavering, the powder snow that smokes off the roofs in
//     gusts, the stars' twinkle by night, the fires' colours,
//     the waver of candle-lit windows, skaters, sledges,
//     dancers, standers swaying, gulls on wrapped lanes, ripples; a floe's rock and bob, a slow swing or turn, an eddy's round, a foundering floe's dip, and the
//     wrapped rounds of the small floes and the apples that sail the race.
//   By the eye's distance: the engine's portal reveal, the far air, the ice's finest marks (drawn within 150 m), and
//     sheets that turn to face the eye (flames, glows, smoke). Nothing else: smoke and glows have one strength at every
//     distance, and all things, smoke among them, are kept off the line by place (people, floes and what they carry,
//     bergs, gulls, fires; balloons and their cords by 14 m; chimney smoke, as the wind bends it, by 6 m).
//     No figure regards the visitor.
//   By the seed (once, for the whole visit): the hour, the rare snow, the plan.
//   One rule of the BUILD, fixed before the flight: the smallest things of the town (the birds on the roofs, the
//     windows of every floor) are made only on the houses that stand within 70 m and 115 m of the route's line.
//
// Light: no lights of the engine's kind. One lit material (src/parts, makeLook): a key (moon or sun), a sky fill, a
// bounce off the ice, lantern light baked per vertex, and the nearest bonfire's light per vertex in that fire's colour
// of the moment. Everything standing on the ice has a flipped twin drawn through the sheet as its image.
import * as THREE from 'three';
import { lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { makeBuilder } from '../kit/structures.js';
import {
  PLAN_STEPS, planHead, houseStream, DURATION, COL, floePoint, fireColor, makeLook, addIceMats, addFxMats, makeFigures, lampColor, bakeGeoGen, litMeshGen,
  iceSheet, iceBedGen, iceHeldGen, iceWater, iceFloesGen, thawApplesGen, spriteMesh, smokeMesh, veilMesh, fireItems, pileInto, lanternInto, arcadeBayInto, boothInto, pavilionInto,
  mazeInto, balloonsInto, stringsInto, courtInto, quadUp, quadSide,
} from '../parts/carnival-on-the-frozen-river.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const SNOW = [0.8, 0.86, 0.96], GILT = [0.75, 0.52, 0.16];
// the direction of a light by its height over the horizon (degrees) and the way it lies (a unit [x, z])
const dirOf = (el, hx, hz) => new THREE.Vector3(hx * Math.cos(el * DEG), Math.sin(el * DEG), hz * Math.cos(el * DEG)).normalize();

// ---------------------------------------------------------------- the four hours: each TWO STANDING LIGHTS, joined by place
// a stands over the fast ice, b over the broken reach. One sun stands in the sky of an hour (el: its height; side: how
// far it lies off the way the race runs, as a part of 70 degrees toward the visitor's hand); by night the fast ice has
// a moon for its key (a small winter moon, 18 to 34 degrees up, at a bearing of its own: see the build) and the broken reach the low sun. key: colour of the moon or sun on a surface that faces it.
// fill: the sky's light on a surface that looks up. ground: light coming up off the ice. fog: colour and thickness of
// the far air (thin: the cold is clear). night: how much the windows show. lamp: how much lantern and fire light counts.
// deep: the colour of the ice's depth. The exposure is one for the whole visit.
const HOURS = {
  night: {
    sun: { el: 3.5, side: 0 }, moon: true, exposure: 1.12,
    a: { key: [0.6, 0.76, 1.25], fill: [0.095, 0.13, 0.27], ground: [0.07, 0.09, 0.17], fog: [0.035, 0.055, 0.14], fogK: 0.00042, night: 1, lamp: 1, top: [0.012, 0.02, 0.07], hor: [0.06, 0.1, 0.25], deep: [0.012, 0.045, 0.06] },
    b: { key: [1.2, 0.84, 0.37], fill: [0.18, 0.215, 0.32], ground: [0.135, 0.115, 0.08], fog: [0.45, 0.34, 0.2], fogK: 0.001, night: 0.4, lamp: 0.6, top: [0.09, 0.15, 0.34], hor: [0.7, 0.5, 0.23], deep: [0.027, 0.08, 0.09] },
  },
  golden: {
    sun: { el: 4.5, side: 0 }, exposure: 1.0,
    a: { key: [1.45, 0.62, 0.3], fill: [0.2, 0.2, 0.34], ground: [0.13, 0.09, 0.09], fog: [0.5, 0.26, 0.2], fogK: 0.0007, night: 0.75, lamp: 0.85, top: [0.07, 0.09, 0.24], hor: [0.95, 0.4, 0.2], deep: [0.02, 0.04, 0.06] },
    b: { key: [1.4, 0.56, 0.24], fill: [0.18, 0.17, 0.32], ground: [0.12, 0.08, 0.08], fog: [0.5, 0.24, 0.17], fogK: 0.00095, night: 0.8, lamp: 0.9, top: [0.06, 0.07, 0.21], hor: [0.95, 0.36, 0.17], deep: [0.018, 0.035, 0.055] },
  },
  day: {
    sun: { el: 13, side: 0.2 }, exposure: 0.76,
    a: { key: [1.2, 1.08, 0.9], fill: [0.2, 0.28, 0.48], ground: [0.12, 0.15, 0.21], fog: [0.4, 0.52, 0.74], fogK: 0.00045, night: 0, lamp: 0.45, top: [0.07, 0.17, 0.5], hor: [0.36, 0.5, 0.76], deep: [0.02, 0.1, 0.2] },
    b: { key: [1.34, 1.04, 0.58], fill: [0.23, 0.28, 0.44], ground: [0.15, 0.15, 0.14], fog: [0.56, 0.48, 0.33], fogK: 0.00085, night: 0.1, lamp: 0.5, top: [0.1, 0.2, 0.5], hor: [0.78, 0.62, 0.37], deep: [0.03, 0.1, 0.15] },
  },
  dawn: {
    sun: { el: 4.5, side: 0 }, exposure: 0.86,
    a: { key: [1.25, 0.84, 0.38], fill: [0.17, 0.2, 0.34], ground: [0.12, 0.1, 0.09], fog: [0.46, 0.34, 0.22], fogK: 0.0008, night: 0.6, lamp: 0.8, top: [0.07, 0.12, 0.32], hor: [0.78, 0.5, 0.24], deep: [0.025, 0.07, 0.09] },
    b: { key: [1.32, 0.94, 0.42], fill: [0.2, 0.23, 0.36], ground: [0.14, 0.12, 0.09], fog: [0.5, 0.38, 0.23], fogK: 0.001, night: 0.4, lamp: 0.65, top: [0.09, 0.16, 0.37], hor: [0.8, 0.56, 0.27], deep: [0.03, 0.085, 0.1] },
  },
};
// the ONE standing sky of an hour (kit sky). az, el: where the sun stands (down the river, low); by night the hard
// night holds the zenith and the up-river quarter, a small moon stands low, and the yellow morning stands low in the
// down-river quarter round the sun: a join by direction in the world, never by the eye's place or the metres flown
function skyOptions(hour, az, el, moonAz, moonEl) {
  const sun = (o) => ({ sunElevation: el, sunAzimuth: az, clouds: false, clouds2: false, ...o });
  if (hour === 'night') return sun({ preset: 'night', zenith: '#03061a', mid: '#0a1030', horizon: '#1b2a5c', stars: 1.25, twinkle: 0.55, starDensity: 1, milkyWay: 0.55,
    bodies: [{ elevation: moonEl, azimuth: moonAz, size: 1.15, phase: 0.98, intensity: 1.5, dark: 0.03, glow: 0.3, glowColor: '#dbe8ff', glowSize: 5, color: '#f2f5ff', texture: 0.4 }], key: 0,
    scatterColor: '#e0a63c', scatter: 0.9, scatterPow: 11, scatterHigh: 0, scatterFall: 9, sunColor: '#ffe08a', sunSize: 1.7, sunIntensity: 10, sunGlow: 0.5 });
  if (hour === 'golden') return sun({ preset: 'sunset', zenith: '#141c4a', mid: '#4a3566', horizon: '#ff7a3c', scatterColor: '#ff3d24', scatter: 0.6, scatterPow: 7, stars: 0.12, sunColor: '#ffb070', sunSize: 2.1 });
  if (hour === 'day') return sun({ preset: 'day', zenith: '#2452a8', mid: '#6f9ad6', horizon: '#c3d8f0', scatterColor: '#ffd98a', scatter: 0.3, scatterPow: 6 });
  return sun({ preset: 'dawn', zenith: '#27407c', mid: '#7d7c9c', horizon: '#f0b550', scatterColor: '#ffc23c', scatter: 0.6, scatterPow: 8, scatterFall: 5, stars: 0.1, sunColor: '#ffd070', sunSize: 2.2 });
}
// ---------------------------------------------------------------- the white city
const WALLS = ['#9a826c', '#84705f', '#ad9881', '#72635b', '#9f786b', '#858078'].map(lin), BIRDS = ['#3a2a22', '#8a2a1c', '#2a2a30', '#9a5a20'].map(lin);
const WIN = [1, 0.62, 0.26];
// a lit window's glow value carries a small fraction of its own, hashed from the window's own place in its maker's
// frame: the lit shader takes each window's waver (its rate and its phase) from that fraction, so no two keep step
const wv = (g, x, y, z) => g + 0.027 * (Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1);
// houses i0 to i1 of the plan: plaster walls, a snow roof, chimneys, windows that show by night; frozen birds on the near roofs
// (each house's dress is dealt from a stream of its own, by the house's name among all the places the plan tried)
function housesInto(b, P, i0, i1) {
  const C = P.city, EMB = C.EMB;
  for (let i = i0; i < i1; i++) {
    const h = C.houses[i], w = h.w, dp = h.dp, wall = h.wall, wc = WALLS[h.c % WALLS.length], d = [], r = houseStream(P, 'cityDress', h.id); for (let k = 0; k < 24; k++) d.push(r());
    b.tr(h.x, EMB, h.z, h.yaw);
    b.surf(0).col(wc, 0.62, 1.05); b.box(-w / 2, 0, -dp / 2, w / 2, wall, dp / 2, { top: false });
    b.col(SNOW, 0.86, 1.04); b.gable(-w / 2, -dp / 2, w / 2, dp / 2, wall, h.rise, { alongX: h.alongX, overhang: 0.35, style: 0, wallColor: mul(wc, 0.9) });
    for (const [lx, lz, ch] of h.chim) { const y0 = wall + h.rise * 0.25, y1 = ch - EMB; b.col([0.26, 0.17, 0.14], 0.8, 1); b.cbox(lx, y0, lz, 0.85, y1 - y0, 0.85, { capColor: SNOW }); }
    // windows: whole rows on the houses near the line, a pair on the rest
    const near = h.near < 115, floors = near ? Math.max(1, Math.floor((wall - 1.2) / 3)) : 1, nw = near ? Math.max(2, Math.floor(w / 2.7)) : 2;
    let q = 0;
    for (const sg of [-1, 1]) for (let f = 0; f < floors; f++) for (let k = 0; k < nw; k++) {
      const lit = d[q++ % 24] < 0.25 + 0.6 * h.lit, x = lerp(-w / 2, w / 2, (k + 0.5) / nw), y = (near ? 1.5 + f * 3 : wall - 2.2), z = sg * (dp / 2 + 0.03);
      if (!lit && !near) continue;
      b.surf(lit ? 1 : 0, 0, lit ? wv(0.9 + d[(q + 7) % 24] * 0.9, h.x + x, y, h.z + z) : 1).col(lit ? WIN : mul(wc, 0.35), 1, 1);
      if (sg > 0) b.quad([x - 0.45, y, z], [x + 0.45, y, z], [x + 0.45, y + 1.3, z], [x - 0.45, y + 1.3, z]); else b.quad([x + 0.45, y, z], [x - 0.45, y, z], [x - 0.45, y + 1.3, z], [x + 0.45, y + 1.3, z]);
    }
    if (h.near < 70) for (let k = 0; k < 5; k++) {
      // a bird lying where it fell on the snow of the roof
      const t = lerp(0.12, 0.88, d[k]), across = (t * 2 - 1), along = (d[k + 5] - 0.5) * 0.8, y = wall + h.rise * (1 - Math.abs(across)) + 0.12, hw = (h.alongX ? dp : w) / 2, hl = (h.alongX ? w : dp);
      const lx = h.alongX ? along * hl : across * hw, lz = h.alongX ? across * hw : along * hl;
      b.surf(0).col(BIRDS[k % 4], 0.8, 1.2); b.sphere(lx, y, lz, 0.17 + 0.08 * d[k + 10], 5, 3, { sy: 0.7 });
      b.col(mul(BIRDS[(k + 1) % 4], 0.8), 1, 1); b.tri([lx, y, lz], [lx + 0.42, y + 0.02, lz + 0.1], [lx + 0.3, y + 0.02, lz - 0.2]);
    }
    b.pop();
  }
}
// the spire beside the line, the hall across the river
function* landmarksInto(b, P) {
  const C = P.city, EMB = C.EMB, sp = C.spire, hl = C.hall, stone = [0.42, 0.4, 0.42];
  if (sp.ok) {
    b.tr(sp.x, EMB, sp.z, sp.yaw);
    const w = sp.w, tH = sp.towerH - EMB, top = sp.h - EMB;
    b.surf(0).col(stone, 0.6, 1.05); b.cbox(0, 0, 0, w, tH, w, { top: false });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.col(mul(stone, 0.85), 0.7, 1); b.cbox(sx * (w * 0.5 - 0.65), 0, sz * (w * 0.5 - 0.65), 1.3, tH + 2.2, 1.3, { capColor: SNOW }); }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, cx = Math.sin(a) * (w / 2 + 0.04), cz = Math.cos(a) * (w / 2 + 0.04), tx = Math.cos(a), tz = -Math.sin(a); b.surf(1, 0, wv(1.5, cx, tH, cz)).col(WIN, 1, 1); b.quad([cx - tx * 1.1, tH - 7, cz - tz * 1.1], [cx + tx * 1.1, tH - 7, cz + tz * 1.1], [cx + tx * 1.1, tH - 2.6, cz + tz * 1.1], [cx - tx * 1.1, tH - 2.6, cz - tz * 1.1]); }
    b.surf(0).col(mix3([0.3, 0.36, 0.4], SNOW, 0.55), 0.8, 1.05); b.lathe(0, tH, 0, [[w * 0.62, 0], [w * 0.4, 1.2], [w * 0.2, (top - tH) * 0.5], [0, top - tH - 1.4]], 8, { facet: true, start: Math.PI / 8 });
    b.col(GILT, 1, 1.2); b.beam([0, top - 2.2, 0], [0, top, 0], 0.14, 0.14); b.beam([-0.6, top - 0.8, 0], [0.6, top - 0.8, 0], 0.12, 0.12);
    b.pop();
  }
  yield;
  // the town's towers (the plan's): a slim spire, a square tower with pinnacles, or a gate turret with a jettied top;
  // a few lit windows and a gilt weathercock on each
  for (const t of C.townTowers) {
    b.tr(t.x, EMB, t.z, t.yaw);
    const w = t.w, H = t.h, body = H * (t.kind === 0 ? 0.5 : t.kind === 1 ? 0.8 : 0.62), st = mul(stone, 0.85 + 0.3 * t.lit);
    b.surf(0).col(st, 0.6, 1.05); b.cbox(0, 0, 0, w, body, w, { top: false });
    let capY = body, capR = w * 0.72, seg = 4;
    if (t.kind === 0) { capR = w * 0.62; seg = 8; }
    if (t.kind === 1) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.col(mul(st, 0.85), 0.7, 1); b.cbox(sx * (w * 0.5 - 0.5), 0, sz * (w * 0.5 - 0.5), 1, body + 1.8, 1, { capColor: SNOW }); }
    if (t.kind === 2) { b.col(mul(st, 1.12), 0.6, 1.05); b.cbox(0, body, 0, w * 1.25, H * 0.14, w * 1.25, { top: false }); capY = body + H * 0.14; capR = w * 0.92; }
    const nw = t.lit < 0.35 ? 1 : t.lit < 0.75 ? 2 : 3, k0 = Math.floor(t.lit * 16);
    for (let k = 0; k < nw; k++) {
      const a = (k + k0) * Math.PI / 2, r0 = w / 2 + 0.05, cx = Math.sin(a) * r0, cz = Math.cos(a) * r0, tx = Math.cos(a), tz = -Math.sin(a), y0 = body * (0.42 + 0.17 * k);
      b.surf(1, 0, wv(1.5, t.x + cx, y0, t.z + cz)).col(WIN, 1, 1); b.quad([cx - tx * 0.55, y0, cz - tz * 0.55], [cx + tx * 0.55, y0, cz + tz * 0.55], [cx + tx * 0.55, y0 + 2.2, cz + tz * 0.55], [cx - tx * 0.55, y0 + 2.2, cz - tz * 0.55]);
    }
    b.surf(0).col(mix3([0.3, 0.36, 0.4], SNOW, 0.55), 0.8, 1.05);
    b.lathe(0, capY, 0, [[capR, 0], [capR * 0.5, (H - capY) * 0.32], [0, H - capY]], seg, { facet: true, start: seg === 8 ? Math.PI / 8 : Math.PI / 4 });
    const ca = Math.cos(t.cock), sa = Math.sin(t.cock);
    b.col(GILT, 1, 1.2); b.beam([0, H - 0.4, 0], [0, H + 1.6, 0], 0.1, 0.1); b.beam([-0.8 * ca, H + 1, -0.8 * sa], [0.8 * ca, H + 1, 0.8 * sa], 0.08, 0.08);
    b.beam([0.12 * ca, H + 1.4, 0.12 * sa], [0.62 * ca, H + 1.4, 0.62 * sa], 0.06, 0.5);
    b.pop();
  }
  yield;
  b.tr(hl.x, EMB, hl.z, hl.yaw);
  b.surf(0).col([0.5, 0.44, 0.38], 0.6, 1.05); b.box(-hl.w / 2, 0, -hl.d / 2, hl.w / 2, hl.wall, hl.d / 2, { top: false });
  b.col(SNOW, 0.86, 1.04); b.gable(-hl.w / 2, -hl.d / 2, hl.w / 2, hl.d / 2, hl.wall, hl.h - hl.wall - EMB, { alongX: true, overhang: 0.6, style: 0, wallColor: [0.46, 0.4, 0.35] });
  for (let k = 0; k < 7; k++) { const x = lerp(-hl.w / 2, hl.w / 2, (k + 0.5) / 7); b.surf(1, 0, wv(1.6, x, 3, hl.d)).col(WIN, 1, 1); b.quad([x - 0.9, 3, hl.d / 2 + 0.05], [x + 0.9, 3, hl.d / 2 + 0.05], [x + 0.9, hl.wall - 2, hl.d / 2 + 0.05], [x - 0.9, hl.wall - 2, hl.d / 2 + 0.05]); }
  for (const sx of [-1, 1]) { b.surf(0).col([0.44, 0.4, 0.36], 0.7, 1); b.cbox(sx * (hl.w / 2 + 1.5), 0, 0, 4.5, hl.h - EMB - 3, 4.5, { top: false }); b.col(SNOW, 0.85, 1); b.frustum(sx * (hl.w / 2 + 1.5), 0, 5, 5, 0, 0, hl.h - EMB - 3, hl.h - EMB + 3); }
  b.pop();
}

// ---------------------------------------------------------------- the great bridge of houses
// Built in its own frame: x = metres to the right of the river's middle, z = metres UPstream of the bridge's middle line.
function* bridgeInto(b, P, r) {
  const B = P.bridge, HW = P.HW, half = B.half, nose = B.nose, deck = B.deckY, stone = [0.37, 0.35, 0.37], dark = mul(stone, 0.6);
  const O = P.river.at(B.s, 0), fl = P.T.flow;
  b.tr(O[0], 0, O[1], Math.atan2(-fl[0], -fl[1]));
  const yArch = (a, t) => a.spring + (a.crown - a.spring) * Math.sqrt(Math.max(1 - Math.pow(Math.abs(t), 2.2), 0));
  for (const a of B.arches) {
    yield;
    const wide = a.d0 === -9.5, n = wide ? 14 : 8, mid = (a.d0 + a.d1) / 2, hs = (a.d1 - a.d0) / 2, X = (k) => mid + hs * (k / n * 2 - 1), Y = (k) => yArch(a, k / n * 2 - 1);
    // the soffit (the wide arch takes a little of the ring's gold), and the two faces between the arch and the road
    if (wide) b.surf(8, 0, 0.2).col([0.8, 0.62, 0.36], 0.8, 1.1); else b.surf(0).col(dark, 0.8, 1.1);
    b.grid(n, 1, (u, v) => [lerp(a.d0, a.d1, u), yArch(a, u * 2 - 1), lerp(half, -half, v)], { flip: true });
    b.surf(0);
    for (let k = 0; k < n; k++) {
      b.col(stone, 0.7, 1.05);
      b.quad([X(k), Y(k), half], [X(k + 1), Y(k + 1), half], [X(k + 1), deck, half], [X(k), deck, half]);
      b.quad([X(k + 1), Y(k + 1), -half], [X(k), Y(k), -half], [X(k), deck, -half], [X(k + 1), deck, -half]);
      // the ring of pale stones round the wide arch, proud of the face
      if (wide) { b.col([0.72, 0.66, 0.56], 0.9, 1.1); b.quad([X(k), Y(k), half + 0.3], [X(k + 1), Y(k + 1), half + 0.3], [X(k + 1) * 1.08, Y(k + 1) + 1.1, half + 0.3], [X(k) * 1.08, Y(k) + 1.1, half + 0.3]); }
    }
  }
  for (const p of B.piers) {
    yield;
    const dm = (p.d0 + p.d1) / 2, yn = 8.2;
    b.col(stone, 0.55, 1.05);
    b.wall(p.d0, half, p.d1, half, yn, deck); b.wall(p.d1, -half, p.d0, -half, yn, deck);
    b.wall(p.d0, -half, p.d0, half, -3, yn); b.wall(p.d1, half, p.d1, -half, -3, yn);
    b.col(mul(stone, 0.9), 0.5, 1.05);
    b.wall(dm, half + nose, p.d1, half, -3, yn); b.wall(p.d0, half, dm, half + nose, -3, yn);
    b.wall(p.d1, -half, dm, -half - nose, -3, yn); b.wall(dm, -half - nose, p.d0, -half, -3, yn);
    b.col(SNOW, 1, 1); b.tri([p.d0, yn, half], [dm, yn, half + nose], [p.d1, yn, half]); b.tri([p.d1, yn, -half], [dm, yn, -half - nose], [p.d0, yn, -half]);
  }
  // the road, and the banks' ends of the bridge
  b.col(mul(SNOW, 0.8), 1, 1); b.quad([-HW - 60, deck, half], [HW + 60, deck, half], [HW + 60, deck, -half], [-HW - 60, deck, -half]);
  for (const sg of [-1, 1]) {
    const x0 = sg * (HW + 4), x1 = sg * (HW + 60);
    b.col(stone, 0.6, 1.05); b.wall(Math.min(x0, x1), half, Math.max(x0, x1), half, 0, deck); b.wall(Math.max(x0, x1), -half, Math.min(x0, x1), -half, 0, deck);
  }
  // the houses that stand on it, both edges: jettied out over the water, snow on their roofs, windows lit
  for (const hs of B.houses) {
    yield;
    const d = []; for (let k = 0; k < 12; k++) d.push(r());
    const zc = hs.row * (half - 2 + hs.jut * 0.5), z0 = zc - 2.5, z1 = zc + 2.5, x0 = hs.d - hs.w / 2, x1 = hs.d + hs.w / 2, wc = WALLS[Math.floor(d[0] * 6) % 6], zo = hs.row > 0 ? z1 : z0;
    b.surf(0).col(wc, 0.6, 1.05); b.box(x0, deck, z0, x1, deck + hs.h, z1, { top: false, bottom: true });
    b.col(SNOW, 0.86, 1.04); b.gable(x0, z0, x1, z1, deck + hs.h, hs.rise, { alongX: d[1] < 0.6, overhang: 0.3, style: 0, wallColor: mul(wc, 0.9) });
    b.col(dark, 1, 1); b.beam([x0 + 0.3, deck - 1.6, hs.row * half], [x0 + 0.3, deck, zo], 0.25, 0.25); b.beam([x1 - 0.3, deck - 1.6, hs.row * half], [x1 - 0.3, deck, zo], 0.25, 0.25);
    const nw = Math.max(2, Math.floor(hs.w / 2.4)), fl2 = Math.max(1, Math.floor(hs.h / 3.2));
    for (let f = 0; f < fl2; f++) for (let k = 0; k < nw; k++) {
      const lit = d[2 + (f * 3 + k) % 10] < 0.3 + 0.6 * hs.lit, x = lerp(x0, x1, (k + 0.5) / nw), y = deck + 1.3 + f * 3.1, z = zo + hs.row * 0.04;
      b.surf(lit ? 1 : 0, 0, lit ? wv(1.5, x, y, z) : 1).col(lit ? WIN : mul(wc, 0.3), 1, 1);
      if (hs.row > 0) b.quad([x - 0.42, y, z], [x + 0.42, y, z], [x + 0.42, y + 1.25, z], [x - 0.42, y + 1.25, z]); else b.quad([x + 0.42, y, z], [x - 0.42, y, z], [x - 0.42, y + 1.25, z], [x + 0.42, y + 1.25, z]);
    }
  }
  yield;
  // the gate over the wide arch: two towers, a great lit room between them, steep snow roofs
  const G = B.gate, tH = G.towerH * 0.62;
  for (const sx of [-1, 1]) {
    b.surf(0).col(mul(stone, 1.1), 0.6, 1.08); b.box(sx * 13.3 - 3.4, deck, -half - 0.6, sx * 13.3 + 3.4, deck + tH, half + 0.6, { top: false });
    b.col(SNOW, 0.85, 1.05); b.frustum(sx * 13.3, 0, 7.6, 2 * half + 2, 0.6, 3, deck + tH, deck + tH + 8.5);
    b.col(GILT, 1, 1.2); b.beam([sx * 13.3, deck + tH + 8.3, 0], [sx * 13.3, deck + tH + 11, 0], 0.16, 0.16);
    for (const sz of [-1, 1]) for (let k = 0; k < 3; k++) { const y = deck + 3 + k * (tH - 6) / 2, z = sz * (half + 0.64); b.surf(1, 0, wv(1.7, sx * 13.3, y, z)).col(WIN, 1, 1); if (sz > 0) b.quad([sx * 13.3 - 0.7, y, z], [sx * 13.3 + 0.7, y, z], [sx * 13.3 + 0.7, y + 2, z], [sx * 13.3 - 0.7, y + 2, z]); else b.quad([sx * 13.3 + 0.7, y, z], [sx * 13.3 - 0.7, y, z], [sx * 13.3 - 0.7, y + 2, z], [sx * 13.3 + 0.7, y + 2, z]); }
  }
  b.surf(0).col(mul(stone, 1.05), 0.7, 1.05); b.box(-9.9, deck, -half, 9.9, deck + 8.5, half, { top: false });
  b.col(SNOW, 0.86, 1.04); b.gable(-9.9, -half, 9.9, half, deck + 8.5, 6.5, { alongX: true, overhang: 0.5, style: 0, wallColor: stone });
  for (const sz of [-1, 1]) for (let k = 0; k < 5; k++) { const x = -7.2 + k * 3.6, z = sz * (half + 0.04); b.surf(1, 0, wv(1.9, x, deck, z)).col(WIN, 1, 1); if (sz > 0) b.quad([x - 1, deck + 2.4, z], [x + 1, deck + 2.4, z], [x + 1, deck + 6.6, z], [x - 1, deck + 6.6, z]); else b.quad([x + 1, deck + 2.4, z], [x - 1, deck + 2.4, z], [x - 1, deck + 6.6, z], [x + 1, deck + 6.6, z]); }
  b.pop();
}

// ---------------------------------------------------------------- the foreign ship, frozen fast at her moorings
// Her own frame: z toward the bow, x to starboard, y up; the ice lies at her waterline.
const shipTop = (u) => 5 + 5.6 * (1 - smoothstep(0, 0.3, u)) + 2.5 * smoothstep(0.74, 1, u);
const shipHalf = (sh, u) => sh.beam / 2 * (u < 0.72 ? 1 - 0.3 * Math.pow(1 - u / 0.72, 2) : Math.sqrt(Math.max(1 - Math.pow((u - 0.72) / 0.28, 2), 0)));
// where her lanterns hang (three at the stern, two by each mast at the rail, one under each mast's lowest yard, one at
// the bow), in the world's metres: she is lit from any side, by her own nature
function shipLampSpots(P) {
  const sh = P.ship, L = sh.len, c = Math.cos(sh.yaw), s = Math.sin(sh.yaw), out = [];
  for (const [x, y, z, size] of [[0, shipTop(0) + 2.4, -L / 2 - 0.5, 1.7], [-2.4, shipTop(0) + 1.7, -L / 2 - 0.4, 1.4], [2.4, shipTop(0) + 1.7, -L / 2 - 0.4, 1.4], [-2.2, 7.2, 0.02 * L, 1.1], [2.2, 7.2, 0.02 * L, 1.1], [0, shipTop(1) + 1.2, L / 2 - 1.5, 1.3],
    [-2.3, 8.2, -0.3 * L, 1], [2.3, 8.2, -0.3 * L, 1], [-1.9, 7.4, 0.3 * L, 1], [1.9, 7.4, 0.3 * L, 1],
    [0.7, 0.36 * sh.masts[0] + 3, -0.3 * L, 0.9], [-0.7, 0.36 * sh.masts[1] + 3, 0.02 * L, 0.9], [0.7, 0.36 * sh.masts[2] + 3, 0.3 * L, 0.9]]) out.push({ x: sh.x + x * c + z * s, y, z: sh.z - x * s + z * c, size, c: 0, floe: null });
  return out;
}
function* shipInto(b, P, r) {
  const sh = P.ship, L = sh.len, tar = [0.13, 0.09, 0.07], band = [0.5, 0.36, 0.12], ice = [0.72, 0.84, 1];
  b.push(new THREE.Matrix4().makeRotationY(sh.yaw).setPosition(sh.x, 0, sh.z).multiply(new THREE.Matrix4().makeRotationZ(sh.heel)));
  b.surf(0);
  for (const sg of [-1, 1]) b.grid(14, 4, (u, v) => [sg * shipHalf(sh, u) * (0.8 + 0.2 * Math.sin(Math.PI * Math.min(v * 1.2, 1))), lerp(-0.4, shipTop(u), v), (u - 0.5) * L],
    { flip: sg > 0, colorFn: (u, v) => (v > 0.8 ? band : v > 0.62 ? mul(tar, 1.5) : mul(tar, 0.7 + 0.6 * v)) });
  yield;
  // the deck, the stern's flat face with its lit gallery, frost along the rails
  b.col([0.3, 0.24, 0.18], 1, 1); b.grid(14, 1, (u, v) => [(v * 2 - 1) * shipHalf(sh, u) * 0.86, shipTop(u) - 0.9, (u - 0.5) * L], {});
  const hb = shipHalf(sh, 0), t0 = shipTop(0);
  b.col(mul(tar, 1.3), 0.7, 1.1); b.quad([hb * 0.8, -0.4, -L / 2], [-hb * 0.8, -0.4, -L / 2], [-hb * 0.86, t0, -L / 2], [hb * 0.86, t0, -L / 2]);
  for (let f = 0; f < 2; f++) for (let k = 0; k < 5; k++) { const x = (k - 2) * hb * 0.3, y = 4.4 + f * 2.5; b.surf(1, 0, wv(1.6, x, y, L)).col(WIN, 1, 1); b.quad([x + 0.5, y, -L / 2 - 0.05], [x - 0.5, y, -L / 2 - 0.05], [x - 0.5, y + 1.4, -L / 2 - 0.05], [x + 0.5, y + 1.4, -L / 2 - 0.05]); }
  // lit ports along both her sides, under the band
  for (const sg of [-1, 1]) for (let k = 0; k < 9; k++) {
    const u = 0.14 + k * 0.08, y = 3.3, v = (y + 0.7) / (shipTop(u) + 0.4), x = sg * (shipHalf(sh, u) * (0.8 + 0.2 * Math.sin(Math.PI * Math.min(v * 1.2, 1))) + 0.07), z = (u - 0.5) * L;
    b.surf(1, 0, wv(1.5, x, y, z)).col(WIN, 1, 1); quadSide(b, [x, y, z - 0.38], [x, y, z + 0.38], [x, y + 0.62, z + 0.38], [x, y + 0.62, z - 0.38], sg, 0);
  }
  b.surf(0).col(GILT, 0.8, 1.1); b.beam([-hb * 0.86, t0, -L / 2 - 0.1], [hb * 0.86, t0, -L / 2 - 0.1], 0.3, 0.3); b.beam([-hb * 0.84, 7, -L / 2 - 0.1], [hb * 0.84, 7, -L / 2 - 0.1], 0.2, 0.2);
  for (const [x, y] of [[0, t0 + 2.4], [-2.4, t0 + 1.7], [2.4, t0 + 1.7]]) { b.col(GILT, 1, 1); b.beam([x, t0, -L / 2 - 0.3], [x, y - 0.5, -L / 2 - 0.45], 0.1, 0.1); }
  // three masts, their yards with the sails furled and frozen, the bowsprit
  const mz = [-0.3 * L, 0.02 * L, 0.3 * L], icicle = (x, y, z, len) => { b.surf(8, 0, 0.12).col(ice, 0.9, 1.2); b.tri([x - 0.07, y, z], [x + 0.07, y, z], [x, y - len, z]); b.tri([x, y, z + 0.07], [x, y, z - 0.07], [x, y - len, z]); b.tri([x + 0.07, y, z], [x - 0.07, y, z], [x, y - len, z]); b.tri([x, y, z - 0.07], [x, y, z + 0.07], [x, y - len, z]); };
  for (let m = 0; m < 3; m++) {
    yield;
    const H = sh.masts[m], z = mz[m], y0 = shipTop(z / L + 0.5) - 0.9;
    b.surf(0).col([0.3, 0.22, 0.14], 0.7, 1.1); b.cyl(0, y0, z, 0.46, 0.17, H - y0, 7);
    [0.42, 0.64, 0.84].forEach((t, j) => {
      const y = lerp(y0, H, t), hl = sh.beam * [0.98, 0.76, 0.52][j];
      b.surf(0).col([0.24, 0.17, 0.11], 1, 1); b.beam([-hl, y, z + 0.5], [hl, y, z + 0.5], 0.26, 0.26);
      b.col(mix3(SNOW, [0.7, 0.66, 0.55], 0.3), 0.8, 1.05); b.beam([-hl * 0.92, y - 0.42, z + 0.5], [hl * 0.92, y - 0.42, z + 0.5], 0.6, 0.55);
      for (let k = 0; k < 12; k++) { const x = hl * (r() * 2 - 1) * 0.9, len = r.range(0.5, 2.2); icicle(x, y - 0.7, z + 0.5, len); }
      // the lifts and braces, stiff with ice
      b.surf(0).col(mul(ice, 0.5), 1, 1); for (const sg of [-1, 1]) b.beam([sg * hl, y, z + 0.5], [0, Math.min(H, y + (H - y0) * 0.16), z], 0.06, 0.06);
    });
    for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) { b.surf(0).col(mul(ice, 0.45), 1, 1); b.beam([sg * shipHalf(sh, z / L + 0.5) * 0.9, y0 + 0.9, z - 2.4 + k * 1.2], [0, lerp(y0, H, 0.64), z], 0.07, 0.07); }
    // the stay to the next mast and the icicles along it (drawn for every mast, hung where there is a stay)
    const hang = []; for (let k = 0; k < 9; k++) hang.push([r.range(0.1, 0.9), r.range(0.4, 1.6)]);
    const m2 = Math.min(m + 1, 2), yTo = lerp(shipTop(mz[m2] / L + 0.5), sh.masts[m2], 0.42);
    if (m < 2) { b.col(mul(ice, 0.5), 1, 1); b.beam([0, H - 0.5, z], [0, yTo, mz[m2]], 0.06, 0.06); for (const [t, len] of hang) icicle(0, lerp(H - 0.5, yTo, t), lerp(z, mz[m2], t), len); }
  }
  yield;
  b.surf(0).col([0.3, 0.22, 0.14], 0.8, 1.1); b.beam([0, shipTop(1) - 0.4, L / 2 - 2], [0, shipTop(1) + 3.2, L / 2 + 6], 0.34, 0.34);
  b.col(mul(ice, 0.5), 1, 1); b.beam([0, shipTop(1) + 3.2, L / 2 + 6], [0, lerp(shipTop(0.8), sh.masts[2], 0.84), mz[2]], 0.06, 0.06);
  // snow lying along her rails and on the stern castle
  for (const sg of [-1, 1]) for (let k = 0; k < 14; k++) { const u0 = k / 14, u1 = (k + 1) / 14; b.col(SNOW, 1, 1); b.beam([sg * shipHalf(sh, u0) * 0.83, shipTop(u0) + 0.06, (u0 - 0.5) * L], [sg * shipHalf(sh, u1) * 0.83, shipTop(u1) + 0.06, (u1 - 0.5) * L], 0.3, 0.14); }
  // the mooring cables down to the ice, each a frozen line
  for (const [x, z, ax, az] of [[-hb * 0.5, -L / 2, -8, -L / 2 - 6], [hb * 0.5, -L / 2, 8, -L / 2 - 6], [0, L / 2 - 1, -7, L / 2 + 4], [0, L / 2 - 1, 7, L / 2 + 4]]) { b.col(mul(ice, 0.55), 1, 1); b.beam([x, 4.6, z], [ax, 0, az], 0.09, 0.09); }
  b.pop();
}

// ---------------------------------------------------------------- what stands on the laden floes
// Each thing is built round its floe's own middle and rides it (the same habits as the floe, in the vertex shader).
const cargoSpot = (it, lx, y, lz) => { const c = Math.cos(it.yaw), s = Math.sin(it.yaw); return [it.x + lx * c + lz * s, y, it.z - lx * s + lz * c]; };
// the lanterns still lit on them, entered in the plan's list before any light is baked
function cargoLamps(P) {
  for (const it of P.cargo) {
    const add = (lx, y, lz, size) => { const q = cargoSpot(it, lx, y, lz); P.lamp(q[0], q[1], q[2], size, 0, it.f); };
    if (it.kind === 'booth') add(0, 2.7, 2.0, 1);
    if (it.kind === 'pavilion') add(0, 8.9, 0, 1.3);
    if (it.kind === 'table') for (const x of [-3.3, -1.1, 1.1, 3.3]) add(x, 1.95, 0, 0.55);
    if (it.kind === 'cat') add(1.3, 1.5, -0.6, 0.7);
  }
}
function cargoItemInto(b, it, r) {
  const d = []; for (let k = 0; k < 40; k++) d.push(r());
  b.tr(it.x, 0, it.z, it.yaw);
  b.surf(0);
  if (it.kind === 'booth') boothInto(b, { x: 0, z: 0, yaw: 0, w: 3.8, d: 3, h: 3.4, kind: Math.floor(it.v2 * 3), cA: Math.floor(it.v1 * 5) }, r);
  if (it.kind === 'pavilion') pavilionInto(b, { x: 0, z: 0, r: 4.2, h: 8.6, cA: Math.floor(it.v1 * 5), cB: Math.floor(it.v2 * 3) }, r);
  if (it.kind === 'bonfire') pileInto(b, { x: 0, z: 0, R: 2.4 }, r);
  if (it.kind === 'table') {
    // a table laid for twenty: a white cloth, ten chairs a side, plate, goblets, three great dishes, four branches of candles
    b.col([0.86, 0.84, 0.78], 0.6, 1); b.box(-4.6, 0.3, -0.78, 4.6, 0.98, 0.78);
    for (const sg of [-1, 1]) for (let k = 0; k < 10; k++) {
      const x = -4.05 + k * 0.9, z = sg * 1.22;
      b.surf(0).col([0.32, 0.18, 0.09], 0.7, 1.05); b.cbox(x, 0, z, 0.5, 0.5, 0.5); b.cbox(x, 0.5, z + sg * 0.21, 0.5, 0.85, 0.08);
      b.col(mul(COL.red, 1.2), 1, 1); b.cbox(x, 0.5, z, 0.44, 0.07, 0.44);
      b.surf(8, 0, 0.3).col(GILT, 0.9, 1.3); b.cyl(x, 0.98, sg * 0.5, 0.17, 0.17, 0.025, 6); b.cyl(x + 0.24, 0.98, sg * 0.42, 0.05, 0.07, 0.2, 5);
    }
    for (const x of [-2.2, 0, 2.2]) { b.surf(8, 0, 0.25).col(GILT, 0.9, 1.2); b.cyl(x, 0.98, 0, 0.42, 0.5, 0.1, 8); b.surf(0).col(x === 0 ? [0.5, 0.26, 0.12] : mul(COL.red, 1.4), 0.8, 1.2); b.sphere(x, 1.22, 0, 0.3, 7, 4, { sy: 0.8 }); }
    for (const x of [-3.3, -1.1, 1.1, 3.3]) { b.surf(8, 0, 0.3).col(GILT, 0.9, 1.2); b.cyl(x, 0.98, 0, 0.12, 0.04, 0.6, 5, { cap: false }); for (const o of [-0.22, 0, 0.22]) { b.surf(0).col([0.9, 0.88, 0.8], 1, 1); b.cbox(x + o, 1.55, 0, 0.05, 0.3, 0.05); b.surf(8, 0, 2.5).col([1, 0.75, 0.35], 1, 1); b.cbox(x + o, 1.85, 0, 0.06, 0.1, 0.06); } b.surf(8, 0, 0.3).col(GILT, 1, 1); b.beam([x - 0.26, 1.55, 0], [x + 0.26, 1.55, 0], 0.04, 0.04); }
  }
  if (it.kind === 'bed') {
    b.col([0.3, 0.17, 0.09], 0.7, 1.05); b.box(-1.15, 0, -1.4, 1.15, 0.55, 1.4);
    b.col([0.88, 0.86, 0.82], 0.8, 1); b.box(-1.08, 0.55, -1.33, 1.08, 0.85, 1.33); b.col([0.95, 0.93, 0.9], 1, 1); b.box(-0.9, 0.85, -1.25, -0.1, 1.02, -0.75); b.box(0.1, 0.85, -1.25, 0.9, 1.02, -0.75);
    b.col(mul(COL.red, 1.1), 0.7, 1.05); b.box(-1.1, 0.84, -0.5, 1.1, 0.9, 1.34);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { b.col([0.3, 0.17, 0.09], 0.8, 1.1); b.beam([sx * 1.1, 0, sz * 1.35], [sx * 1.1, 3.3, sz * 1.35], 0.13, 0.13); }
    b.col(mul(COL.red, 0.9), 0.8, 1.1); b.box(-1.22, 3.3, -1.47, 1.22, 3.6, 1.47, { bottom: true }); b.col(SNOW, 1, 1); b.box(-1.22, 3.6, -1.47, 1.22, 3.66, 1.47);
    b.col(mul(COL.red, 0.8), 0.6, 1); b.box(-1.16, 0.5, -1.44, 1.16, 3.3, -1.38); for (const sx of [-1, 1]) b.box(sx * 1.13 - 0.03, 0.5, -1.4, sx * 1.13 + 0.03, 3.3, -0.5);
  }
  if (it.kind === 'cat') {
    b.col([0.32, 0.2, 0.1], 0.7, 1.05); b.box(-0.6, 0, -0.6, 0.6, 0.95, 0.6);
    // pots and pans in a heap, copper catching the light; the cat on the chest
    for (let k = 0; k < 9; k++) { const a = d[k] * TAU, rad = 1.1 + d[k + 9] * 1.3, x = Math.cos(a) * rad, z = Math.sin(a) * rad, s = 0.2 + d[k + 18] * 0.22; b.surf(8, 0, 0.18).col(k % 3 ? [0.72, 0.36, 0.16] : [0.5, 0.5, 0.52], 0.7, 1.3); b.lathe(x, 0, z, [[s * 0.8, 0], [s, s * 0.9], [s * 1.05, s], [s * 0.86, s]], 7); if (k % 2) b.beam([x + s, s * 0.9, z], [x + s + 0.4, s * 0.95, z], 0.05, 0.04); }
    b.surf(0).col([0.03, 0.03, 0.035], 1, 1.3); b.sphere(0, 1.2, 0, 0.21, 6, 4, { sy: 1.25 }); b.sphere(0, 1.52, 0.1, 0.12, 6, 4);
    b.tri([-0.1, 1.6, 0.1], [-0.03, 1.6, 0.1], [-0.07, 1.74, 0.1]); b.tri([0.03, 1.6, 0.1], [0.1, 1.6, 0.1], [0.07, 1.74, 0.1]); b.tri([-0.03, 1.6, 0.1], [-0.1, 1.6, 0.1], [-0.07, 1.74, 0.1]); b.tri([0.1, 1.6, 0.1], [0.03, 1.6, 0.1], [0.07, 1.74, 0.1]);
    b.beam([0, 1.0, -0.18], [0.3, 1.0, -0.3], 0.06, 0.06); b.beam([0.3, 1.0, -0.3], [0.38, 1.28, -0.22], 0.05, 0.05);
  }
  b.pop();
}
// several baked geometries as one (the same attributes in each)
function mergeGeos(list) {
  const g = new THREE.BufferGeometry(), names = Object.keys(list[0].attributes); let nv = 0, ni = 0;
  for (const q of list) { nv += q.attributes.position.count; ni += q.index.count; }
  const idx = new Uint32Array(ni); let vo = 0, io = 0;
  for (const q of list) { const a = q.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; vo += q.attributes.position.count; }
  for (const nm of names) { const sz = list[0].attributes[nm].itemSize, arr = new Float32Array(nv * sz); let o = 0; for (const q of list) { arr.set(q.attributes[nm].array, o); o += q.attributes[nm].array.length; } g.setAttribute(nm, new THREE.BufferAttribute(arr, sz)); }
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  for (const q of list) q.dispose();
  return g;
}

// ---------------------------------------------------------------- the banks: embankment walls, snow lying inland, the far town
function* groundInto(b, P) {
  const Rv = P.river, HW = P.HW, EMB = P.city.EMB, s0 = -330, s1 = P.places.sB + 640, n = Math.ceil((s1 - s0) / 30);
  for (const sg of [-1, 1]) for (let i = 0; i < n; i++) {
    if (i % 12 === 11) yield;
    const sa = lerp(s0, s1, i / n), sb = lerp(s0, s1, (i + 1) / n), mid = Rv.at((sa + sb) / 2, 0), edge = Rv.at((sa + sb) / 2, sg * HW);
    const at = (s, d, y) => { const q = Rv.at(s, sg * d); return [q[0], y, q[1]]; };
    b.surf(0).col([0.33, 0.32, 0.35], 0.5, 1); quadSide(b, at(sa, HW, -0.2), at(sb, HW, -0.2), at(sb, HW + 0.5, EMB), at(sa, HW + 0.5, EMB), mid[0] - edge[0], mid[1] - edge[1]);
    const bands = [[0.5, 64, 0.8], [64, 240, 0.76], [240, 900, 0.72]];
    for (const [d0, d1, k] of bands) { b.col(mul(SNOW, k), 1, 1); quadUp(b, at(sa, HW + d0, EMB), at(sb, HW + d0, EMB), at(sb, HW + d1, EMB), at(sa, HW + d1, EMB), true); }
  }
}
// the town beyond the rows: plain blocks under snow roofs, and a few towers on the sky
function* farInto(b, P, r) {
  const Rv = P.river, HW = P.HW, EMB = P.city.EMB, pl = P.places, h = P.hand;
  for (const side of [-1, 1]) for (const inl of [80, 114, 152, 198, 252, 322]) {
    let s = -300;
    for (let k = 0; k < 90; k++) {
      if (k % 8 === 7) yield;
      const w = r.range(13, 22), dp = r.range(11, 17), hh = r.range(8, 15), rise = r.range(3, 6), jo = r.range(-7, 7), gap = r.range(0.5, 6), c = r.int(0, 5), lit = r(), wy = r.range(0.3, 0.7);
      const sc = s + w / 2; s += w + gap;
      if (sc > pl.sB + 600) continue;
      if (side === -h && inl < 215 && sc > pl.sStart - 165 && sc < pl.sE + 145) continue;
      const q = Rv.at(sc, side * (HW + inl + jo)), yaw = Rv.yawAt(sc);
      b.tr(q[0], EMB, q[1], yaw);
      b.surf(0).col(mul(WALLS[c], 0.9), 0.6, 1); b.box(-dp / 2, 0, -w / 2, dp / 2, hh, w / 2, { top: false });
      b.col(SNOW, 0.84, 1.02); b.gable(-dp / 2, -w / 2, dp / 2, w / 2, hh, rise, { alongX: false, overhang: 0.3, style: 0, wallColor: mul(WALLS[c], 0.8) });
      if (lit < 0.5) { const x = -side * (dp / 2 + 0.05); b.surf(1, 0, wv(1.4, q[0], hh * wy, q[1])).col(WIN, 1, 1); quadSide(b, [x, hh * wy, -0.6], [x, hh * wy, 0.6], [x, hh * wy + 1.4, 0.6], [x, hh * wy + 1.4, -0.6], -side, 0); }
      b.pop();
    }
  }
  yield;
  // the towers stand where the plan put them (each tested against the line and the entry axis)
  for (const t of P.city.towers) {
    b.surf(0).col([0.4, 0.38, 0.42], 0.6, 1.05); b.cbox(t.x, EMB, t.z, t.w, t.h * 0.55, t.w, { top: false });
    b.col(mix3([0.3, 0.36, 0.4], SNOW, 0.6), 0.8, 1.05); b.frustum(t.x, t.z, t.w * 1.1, t.w * 1.1, 0, 0, EMB + t.h * 0.55, EMB + t.h);
  }
}

// ---------------------------------------------------------------- gulls coming up the river over the broken reach
// Each on a lane of its own (the plan's: every lane is proved clear of the line), on a wrapped round of the world clock.
function makeGulls(P, look) {
  const G = P.gulls, A = P.river.at(G.sA, 0), fl = P.T.flow, n = G.list.length;
  const g = new THREE.InstancedBufferGeometry();
  // a body and two wings, each wing two blades: x is the span (-1 to 1), z the length
  const pos = [0, 0, 0.32, 0.07, 0, 0, -0.07, 0, 0, 0, 0, -0.34, -0.07, 0, 0, 0.07, 0, 0];
  for (const sg of [-1, 1]) pos.push(0, 0, 0.16, sg * 0.5, 0, 0.1, 0, 0, -0.1, sg * 0.5, 0, 0.1, sg * 1, 0, -0.06, 0, 0, -0.1);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  const ga = new Float32Array(n * 4), gb = new Float32Array(n * 4);
  G.list.forEach((q, i) => { ga.set([q.d, q.y, q.ph, q.v], i * 4); gb.set([q.flapPh, q.size, q.amp, q.flap], i * 4); });
  g.setAttribute('ga', new THREE.InstancedBufferAttribute(ga, 4)); g.setAttribute('gb', new THREE.InstancedBufferAttribute(gb, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...look.pick('uTime'), ...look.LIGHTU, uLane: { value: new THREE.Vector4(A[0], A[1], fl[0], fl[1]) }, uLen: { value: G.len } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 ga; attribute vec4 gb;
uniform float uTime; uniform vec4 uLane; uniform float uLen;
varying float vTip; varying vec3 vW;
void main(){
  float life = fract(ga.z + uTime * ga.w / uLen), along = uLen * (1. - life);
  float flap = sin(uTime * gb.w + gb.x), span = abs(position.x);
  vec3 p = position * gb.y * smoothstep(0., .05, life) * (1. - smoothstep(.95, 1., life));
  p.y += (span * flap * .42 - span * span * (.18 + .2 * flap)) * gb.y;
  vec2 f = uLane.zw, rt = vec2(-f.y, f.x);
  vec2 xz = uLane.xy + f * along + rt * ga.x - f * p.z + rt * p.x;
  vec3 w = vec3(xz.x, ga.y + sin(uTime * .6 + gb.x) * gb.z + p.y, xz.y);
  vTip = span; vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
    fragmentShader: look.LIGHT + /* glsl */`
varying float vTip; varying vec3 vW;
void main(){
  cfHere(vW);
  vec3 col = mix(vec3(.92, .93, .95), vec3(.25, .26, .3), smoothstep(.7, 1., vTip)) * (skyFill * 1.7 + keyCol * .55);
  col = mix(col, fogCol, fogAmt);
  gl_FragColor = vec4(col, 1.);
}`,
  });
  look.mats.gulls = mat;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.userData.triangles = n * 6;
  return m;
}

// ---------------------------------------------------------------- the world
export default {
  id: 'carnival-on-the-frozen-river',
  name: 'The Carnival on the Frozen River',
  category: 'books',
  placeKind: 'city',
  book: 'Orlando',
  author: 'Virginia Woolf, 1882 to 1941',
  media: ['air', 'open'],
  weirdness: 0.5,

  async build(ctx) {
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    // the plan, a step at a time (the same steps the replay runs under node)
    const P = planHead(ctx.seed, { hour: vary.hour, rare: vary.rare, density: vary.density });
    // a generator step breathes wherever it yields
    const run = async (it) => { let q = it && typeof it.next === 'function' ? it.next() : { done: true, value: it }; while (!q.done) { await ctx.yield(); q = it.next(); } await ctx.yield(); return q.value; };
    for (const step of PLAN_STEPS) await run(step(P));
    cargoLamps(P);
    const shipLamps = P.ship.ok ? shipLampSpots(P) : [];
    for (const l of shipLamps) P.lanterns.push(l);
    const look = addFxMats(addIceMats(makeLook())), U = look.U, R = P.R, T = P.T, L = P.L, pl = P.places;
    const scene = new THREE.Scene(), stats = { triangles: 0 };
    const put = (o) => { scene.add(o); stats.triangles += o.userData.triangles || 0; return o; };
    await ctx.yield();

    // ---- the hour: two standing lights (set once, here, and never changed in flight) and the one standing sky
    const H = HOURS[P.hour], fl = T.flow, rgt = [-fl[1], fl[0]];
    const headOf = (side) => { const a = side * 70 * DEG * P.hand; return [fl[0] * Math.cos(a) + rgt[0] * Math.sin(a), fl[1] * Math.cos(a) + rgt[1] * Math.sin(a)]; };
    const azOf = (h) => Math.atan2(h[0], -h[1]) / DEG;
    const sunHead = headOf(H.sun.side), sunDir = dirOf(H.sun.el, sunHead[0], sunHead[1]);
    // the moon's place is the sky's own: a height of 18 to 34 degrees and a bearing anywhere round the sky that lies 70
    // degrees and more from the yellow quarter (drawn from a stream of its own on every visit, used by night)
    const moonEl = R.moon.range(18, 34), moonBear = R.moon.range(70, 290) * DEG;
    const moonHead = H.moon ? [fl[0] * Math.cos(moonBear) + rgt[0] * Math.sin(moonBear), fl[1] * Math.cos(moonBear) + rgt[1] * Math.sin(moonBear)] : sunHead, moonDir = H.moon ? dirOf(moonEl, moonHead[0], moonHead[1]) : sunDir;
    look.setLight(false, { dir: moonDir, ...H.a }); look.setLight(true, { dir: sunDir, ...H.b });
    // the join of the two lights: by the lit point's metres along the race from the broken edge
    const o0 = P.river.at(T.sT, 0);
    U.uJoin.value.set(o0[0], o0[1], P.join.from, P.join.to); U.uJoinDir.value.set(fl[0], fl[1]);
    // where the swept ice begins: the silken rope's own place, in metres along the race from the broken edge
    const ropeAt = P.river.at(pl.sRope, 0); U.uSwept.value = (ropeAt[0] - o0[0]) * fl[0] + (ropeAt[1] - o0[1]) * fl[1];
    const sky = makeSky({ rng: R.skyA, ...skyOptions(P.hour, azOf(sunHead), H.sun.el, azOf(moonHead), H.moon ? moonEl : 0), ground: mul(H.a.fog, 0.9), quality: 0.5, renderOrder: -3, bake: P.hour === 'night', renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();

    // ---- the ice: bed, what it holds, the sheet, and the broken reach (its water, its floes, its apples)
    put(await run(iceBedGen(P, look)));
    put(await run(iceHeldGen(P, look)));
    put(iceWater(P, look)); put(iceSheet(P, look)); await ctx.yield();
    put(await run(iceFloesGen(P, look, P.floes, R.frost, P.sheetEdgeSD.map((q) => P.river.at(q[0], q[1] * 1.02)))));
    put(await run(thawApplesGen(P, look)));
    // ---- solids: built a few thousand corners at a time, each lot baked with the lanterns' and the fires' light
    let b = makeBuilder(16384), mark = 0;
    const flush = async (o) => { if (b.nv) put(await run(litMeshGen(b, P, look, o))); b = makeBuilder(16384); mark = 0; await ctx.yield(); };
    // breathe after every couple of thousand corners; bake and begin a new lot when it is large
    const pause = async () => { if (b.nv - mark > 700) { mark = b.nv; await ctx.yield(); } };
    const breathe = async (o) => { if (b.nv > 30000) await flush(o); else await pause(); };
    // a maker that yields is given the same Builder to its end: the lot is only baked between makers
    const make = async (gen, o) => { for (const step of gen) await pause(); await breathe(o); };
    const sprites = [], smoke = [];
    const onIce = { mirror: true };
    for (let i = 0; i < P.bays.length; i++) { arcadeBayInto(b, P.bays[i], R.arcadeDress); await breathe(onIce); }
    await flush(onIce);
    for (const bo of P.booths) { boothInto(b, bo, R.boothDress); await breathe(onIce); }
    await flush(onIce);
    for (const pv of P.pavilions) { pavilionInto(b, pv, R.pavilionDress); await breathe(onIce); }
    await make(mazeInto(b, P, R.mazeDress), onIce);
    await make(balloonsInto(b, P), onIce);
    await make(stringsInto(b, P), onIce);
    await make(courtInto(b, P, R.courtDress), onIce);
    for (const f of P.fires.filter((q) => !q.floe)) pileInto(b, f, R.piles);
    for (const l of P.lanterns) { if (!l.floe) lanternInto(b, l); await breathe(onIce); }
    await flush(onIce);
    if (P.ship.ok) await make(shipInto(b, P, R.shipDress), onIce);
    await flush(onIce);

    // ---- the city, the banks, the far town, the bridge: far of every lantern, so baked plain
    const plain = { plain: true }, HN = P.city.houses.length;
    for (let i = 0; i < HN; i += 6) { housesInto(b, P, i, Math.min(HN, i + 6)); await breathe(plain); }
    await flush(plain);
    await make(landmarksInto(b, P), plain); await make(groundInto(b, P), plain);
    await make(farInto(b, P, R.far), plain);
    await make(bridgeInto(b, P, R.bridgeDress), plain);
    await flush(plain);

    // ---- what the floes carry: one mesh that rides them
    const cargoGeos = [];
    for (const it of P.cargo) { const cb = makeBuilder(4096); cargoItemInto(cb, it, R['cargoDress' + it.n]); await ctx.yield(); cargoGeos.push(await run(bakeGeoGen(cb, P, { floe: it.f }))); stats.triangles += cb.ni / 3; }
    if (cargoGeos.length) { const cm = new THREE.Mesh(mergeGeos(cargoGeos), look.mats.litFloe); cm.frustumCulled = false; scene.add(cm); }
    await ctx.yield();

    // ---- fire, glows, smoke, falling snow
    for (const f of P.fires) fireItems(f, R.flames, sprites, smoke);
    for (const l of P.lanterns) sprites.push({ x: l.x, y: l.y, z: l.z, size: 2.5 * l.size, kind: 0, ph: l.ph === undefined ? R.glowPhase() : l.ph, col: mul(l.rgb || lampColor(l.c), 0.36), floe: l.floe, mirror: !l.floe });
    // on a small machine every third or so of the far smoke and of the snow is left out (never the fires)
    const keepBy = (i) => (i % 10) < Math.round(10 * detail);
    P.city.smoke.forEach((s, i) => { if (keepBy(i)) smoke.push({ x: s.x, y: s.y, z: s.z, w: s.w, h: s.h, ph: s.ph, kind: 0 }); });
    await ctx.yield();
    // snow (the rare visit): flakes falling straight down beside the line, none within 2.8 m of it
    const flakes = [];
    for (let i = 0; i < 6500; i++) flakes.push([R.snow.range(0, L - 2), R.snow.sign() * R.snow.range(3.5, 58), R.snow.range(14, 26), R.snow.range(0.15, 0.26), R.snow()]);
    if (P.rare) {
      for (let i = 0; i < flakes.length; i++) {
        const [fm, off, fall, size, ph] = flakes[i], q = P.beside(fm, off);
        let bi = 0, bk = 0; for (const f of P.fires) { const k = 1.2 / (1 + ((f.x - q[0]) ** 2 + (f.z - q[1]) ** 2) / 220); if (k > bk) { bk = k; bi = f.i; } }
        // the line is tested for 80 m of route each way of the flake's own metre (a flake is 58 m to the side at the most)
        const i0 = Math.max(0, Math.floor(fm / 2) - 40), i1 = Math.min(P.n - 1, Math.floor(fm / 2) + 40);
        if (keepBy(i) && P.gap(q[0], q[1], 0.1, 0, fall, i0, i1) >= 2.8) sprites.push({ x: q[0], y: 0.05, z: q[1], size, kind: 4, fi: bi, ph, h: fall, col: [0.5, bk, 0] });
        if (i % 60 === 59) await ctx.yield();
      }
    }
    // powder snow smoking off the roofs (the plan's veils, each by its house's own stream): each takes the light of
    // its own place (the hour's, the nearest fire's by distance, its own house's windows)
    const veils = [];
    P.city.veils.forEach((v, i) => {
      if (!keepBy(i)) return;
      let bi = 0, bk = 0; for (const f of P.fires) { const k = 1.2 / (1 + ((f.x - v.x) ** 2 + (f.z - v.z) ** 2) / 220); if (k > bk) { bk = k; bi = f.i; } }
      veils.push({ x: v.x, y: v.y, z: v.z, w: v.w, len: v.len, lift: v.lift, ph: v.ph, fi: bi, fk: bk, warm: 0.04 + 0.1 * v.lit });
    });
    put(veilMesh(look, veils));
    put(smokeMesh(look, smoke)); await ctx.yield();
    put(spriteMesh(look, sprites));
    await ctx.yield();
    const figs = makeFigures(P, look); scene.add(figs.object); stats.triangles += figs.triangles;
    put(makeGulls(P, look));
    await ctx.yield();

    // ---- the frame's uniforms: the world clock and nothing else (the fires' colours, and where the one fire that
    // burns on a floe has been carried by its floe's own round)
    const end = P.path.posAtDist(L), fc = [0, 0, 0], fp = [0, 0, 0], FIRE_I = 2.1;
    U.uFlow.value.set(fl[0], fl[1], 0); U.uRiverO.value.set(o0[0], o0[1]);
    U.uPortal.value.set(end.x, end.y, end.z, 1); U.uPortalCol.value.set(1, 0.74, 0.36);
    const frame = (time) => {
      U.uTime.value = time; U.uFlow.value.z = time;
      for (const f of P.fires) {
        fp[0] = f.x; fp[1] = 3; fp[2] = f.z;
        if (f.floe) floePoint(T, f.floe, f.x, 3, f.z, time, fp);
        fireColor(f, time, fc);
        U.uFire.value[f.i].set(fc[0], fc[1], fc[2]).multiplyScalar(FIRE_I); U.uFirePos.value[f.i].set(fp[0], fp[1], fp[2], 1);
      }
    };
    frame(0);
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path: P.path, duration: DURATION, pace: P.pace, camera: P.cam, pois: P.pois,
      portal: { shape: 'circle', radius: 7, color: '#ffd27a', glow: 1.3, revealDistance: 340 },
      post: { exposure: H.exposure, bloom: { strength: 0.5, radius: 0.6, threshold: 0.86 }, grade: { saturation: 1.08, contrast: 1.05, vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera) { frame(time); sky.update(dt, time, camera); },
      dispose() {
        scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        for (const k in look.mats) look.mats[k].dispose();
        sky.dispose?.();
      },
    };
  },
};
