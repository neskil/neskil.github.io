// ARCHIPELAGO OF AIR: morning among floating islands above an endless sea of cloud.
//
// THE FLIGHT (u = path fraction)
//   0.00  enter low over the cloud sea, looking up a rising curve of islands at the Crown Island's ring of falls
//   0.08  skim the flowered top of the meadow island (A): its tallest trees stand in a belt round its shoulder (shoulderWood:
//         gourd trees and coral frond trees 12 to 16 m tall, a rule of the island's own), the meadow inside the belt open
//   0.16-0.22  THE GATEWAY: straight at the Crown under the shelf island (B), down an avenue of long swaying root curtains
//         hung with seed lanterns; its rough ceiling glows blue into pink with the light the cloud sea throws up; the vine
//         bridge to island D hangs off to one side
//   0.22-0.34  THE EYE: out of the gateway the path swoops down and straight in through the gap between the two falls that
//         face it. Under the Crown the cloud sea opens in a calm dark eye about 200 m wide with three banks of cloud puffs
//         winding down into it (they turn as you watch), and from its centre the SPOUT, a twisting three-strand rope of
//         cloud, climbs into the tip of the keel: the Crown drinks the sea. The pond island (C) lies off to one side; the
//         ribbon rays slide in alongside
//   0.36-0.55  a third of a turn through the gallery under the rim (falls right, keel left; contoured ceiling, lantern
//         roots), sun shafts slanting in between the falls, the draught winding up the keel (its puffs thin out near the
//         camera); the Crown's own ribbon rays (three, 12 m from tip to tip) circle it on courses of their own, each
//         drawn for itself, on the world clock from seeded starts: whichever is in the gallery as the camera comes round is the
//         one it meets, never nearer the lane than 31 m
//   0.55-0.70  out between two falls and on, well clear of the rim (60 m and more), straight at the wooded island (G) with
//         its fall, past two small bobbing islets of the climb (one to each side, one with a flock of parrots
//         circling it) and the cloud deck below; then a wide climbing left turn, and by 0.68 the lake, the spire and the
//         portal show over the rim (the gaze never turns faster than about 41 degrees a second)
//   0.70-1.00  over the hanging garden on the rim's lip and straight across the brimming lake into the hole through the
//         spire (the portal)
//   pace(u) lingers from the eye through the gallery and over the lake; the link outside flies at close to the mean pace.
//
// THE FILE
//   DECK_GLSL, DECK_SHADE, makeDeck()   the cloud sea, this world's own: a disc of billows that follows the camera, displaced
//                      in the vertex shader by seaH() and shaded by deckColor() as cloud, not as a lit surface. heads():
//                      the smooth upper envelope of round domes of unequal size, one to a jittered cell, so no two heads
//                      match and no cell edge shows. Five sizes of them (420 m massifs, 110 m banks, 38 m, 13 m and 4.5 m
//                      knobs; the small ones ride the crowns of the large, stand taller on a massif, and are drawn only
//                      where a pixel can hold them). Tone: a pale crown, a soft shoulder on the side turned from the sun
//                      (lilac or periwinkle, never a dark crescent), a thin soft seam between heads, the shadow a massif
//                      throws on its neighbour, no highlights; toward the horizon the shade thins out (crowns hide the
//                      valleys). The shadows of the Crown and the eleven largest islands; haze to a far colour darker than
//                      the sky's horizon (the sky dome's ground takes the same colour, so the horizon is one line). Round
//                      the spout's foot a second, finer disc (cloudSeaEye, same shader, 144 spokes x 54 rings) carries the
//                      eye, its bowl and the three arms winding into it: each arm one string of round puffs riding its own unbroken bank
//                      (chain(), laid out in spiral coordinates so the puffs stay round), turning as one
//   buildIsland()      one floating island (turf top in polar rings + inverted-mountain keel + fangs); async, yields as it goes
//   build(): looks     three looks chosen by ctx.vary.mood / hour: 'blue' clear morning, 'rose' low rosy sun (one peach-pink
//                      key; the lake keeps its own clear periwinkle horizon colour, lakeHor / lakeGain; turf lifted, turfGain; drifts in a
//                      yellow that stays gold under that light, flower / flowerGain), 'pearl' high
//                      haze with a crowd of cumulus towers; ctx.vary.density scales trees, islands, flocks; ctx.quality.detail
//                      thins grass, petals, flocks; ctx.vary.rare sends one 60 m leviathan ray round the Crown on a wide
//                      loop below the gallery, on the world clock
//            sky       kit sky and light rig; kit cumulus towers standing on the deck
//            hero      the Crown (src/parts/sky-archipelago.js); its kit (rock + flora materials, tree, root, tube and
//                      ribbon builders) dresses every other island, so the archipelago is one family of shapes
//            pause(w), rest()   the build hands the page back in batches of about 9 ms of work (see there), not at every step
//            path, islands A-G, mid islands (each its own stone tint; they bob, and the three largest trail a thin fall
//            that rides the bob and breaks into spray three island radii down, or at the cloud sea where its island floats lower than that), far impostors (banded rock, turf caps broken with pink at the lip, tree tufts), the gateway
//            curtains, towers, water, bridge, meadows (the grass takes the turf's own colour at its foot, as live's does; the flowered drifts are
//            painted on the ground and carried by the flowers; the rose look has its own drift colour, LOOKS.rose.flower), the rim's hanging garden, the islets
//            of the climb, life (the troop and the escort keep station ahead on the path, as in the live world; every other animal
//            flies a closed course of its own in world coordinates on the world clock, kept clear of the lane by airRoute / keepAir), gaze
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep as sst } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/sky-archipelago.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const PALETTE = ['#2f6fe0', '#9fd8ff', '#fff3e0', '#ff8fb0', '#2fb89a', '#6a4a8a', '#ffd23f'];
const HY = 300;            // world height of the Crown's lake
const SEA_Y = -45;         // where the small islands' falls and the cumulus towers meet the cloud sea
const DECK_Y = -10;        // base level of the cloud sea's billows (they reach about 55 m above it and below: the path never drops below ~123)
const DECK_LIFT = 0;       // how much the deck swells round the Crown (its falls end in the boil standing on it)
const EYE_DEPTH = 45;      // depth of the eye under the Crown's keel: a wide shallow well, so its floor shows from the approach
const CLEAR = 11;          // metres of air kept around the camera path

// the three looks (see build): sky ramp, sun, light, cloud colours, air, weather
const LOOKS = {
  blue: { sunEl: [35, 43], zen: '#2a66dc', hor: '#9fd8ff', gnd: '#86c0f4', sun: '#fff4dc', scat: '#fff0d0', scatK: 0.24, key: '#fff1d6', keyI: 3.4, amb: '#8fb4ff', ambI: 1.25,
    cLit: '#fff8ee', cShade: '#5078d4', cBot: '#3c5ec0', seaCrest: '#ffebcc', seaMid: '#b4ccf6', seaShade: '#7095e3', seaBot: '#476ccc', seaFar: '#5786e2', seaEye: '#152c86', seaTone: [1.0, 0.8, 0.42, 1.1, 0.2, 0.4],
    fog: '#8ebff6', fogD: 0.00046, cirrus: [0.26, 0.42], towers: [4, 6], tSize: [190, 330], tH: [0.7, 0.85],
    bounceA: '#4a90ee', bounce: 0.62, ground: 0.12, exposure: 0.98, tint: '#f8fbff', sat: 1.18 },
  rose: { sunEl: [13, 17], zen: '#2448c4', hor: '#ffd4d0', gnd: '#f0bccb', sun: '#ffd9a8', scat: '#ffab8c', scatK: 0.5, key: '#ffb070', keyI: 4.0, amb: '#7f8cff', ambI: 1.0,
    cLit: '#fff0e6', cShade: '#6f69d2', cBot: '#564eb2', seaCrest: '#ffd4a6', seaMid: '#c2b6de', seaShade: '#958dcb', seaBot: '#6a64b2', seaFar: '#7a6cc2', seaEye: '#1f2070', seaTone: [0.88, 1.25, 0.8, 1.2, 0.28, 0.25],
    fog: '#dcaed2', fogD: 0.00043, cirrus: [0.34, 0.5], towers: [5, 7], tSize: [200, 340], tH: [0.75, 0.95],
    bounceA: '#9a9cff', bounce: 0.8, ground: 0.34, exposure: 0.95, tint: '#fff4ec', sat: 1.22, lakeHor: '#7c8eea', lakeGain: 1.15, turfGain: 1.08, flower: '#ffe030', flowerGain: 1.35 },
  pearl: { sunEl: [45, 52], zen: '#4a80e4', hor: '#e9f1ff', gnd: '#d3e2fa', sun: '#fffaf0', scat: '#ffffff', scatK: 0.36, key: '#fff5e4', keyI: 3.2, amb: '#b4c8ff', ambI: 1.38,
    cLit: '#ffffff', cShade: '#5578d6', cBot: '#4666c0', seaCrest: '#fff3e0', seaMid: '#b8ccf4', seaShade: '#7a98df', seaBot: '#4a6cc4', seaFar: '#789ee4', seaEye: '#1d3690', seaTone: [1.0, 0.8, 0.42, 1.1, 0.2, 0.4],
    fog: '#b4cdf6', fogD: 0.0004, cirrus: [0.5, 0.62], towers: [10, 13], tSize: [170, 290], tH: [0.95, 1.2],
    bounceA: '#6ea6f4', bounce: 0.7, ground: 0.1, exposure: 0.86, tint: '#f6faff', sat: 1.12 },
};

// ---------- geometry accumulator (same layout as the hero's: position, color, aMix) ----------
function makeAcc() { return { p: [], c: [], m: [], idx: [], n: 0 }; }
// vertex normals and bounds straight on the typed arrays (several times quicker than the library's attribute-by-attribute pass),
// handing the page back every thousand triangles
async function finishGeometry(g, pause) {
  const pos = g.attributes.position.array, idx = g.index.array, nv = pos.length, nor = new Float32Array(nv);
  for (let t = 0; t < idx.length; t += 3) {
    if (pause && t % 3000 === 0 && t) await pause(0.7);
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
  }
  if (pause) await pause();
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < nv; i += 3) {
    if (pause && i % 9000 === 0 && i) await pause(2.5);
    const l = Math.sqrt(nor[i] * nor[i] + nor[i + 1] * nor[i + 1] + nor[i + 2] * nor[i + 2]) || 1; nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l;
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (pause) await pause();
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  let r2 = 0;
  for (let i = 0; i < nv; i += 3) { const dx = pos[i] - cx, dy = pos[i + 1] - cy, dz = pos[i + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(nv ? cx : 0, nv ? cy : 0, nv ? cz : 0), nv ? Math.sqrt(r2) : 0);
  return g;
}
// attributes first, then (after handing the page back) normals: short build steps instead of one long one
async function accGeometry(acc, pause) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); await pause(0.3);
  g.setAttribute('color', new THREE.Float32BufferAttribute(acc.c, 3)); await pause(0.6);
  g.setAttribute('aMix', new THREE.Float32BufferAttribute(acc.m, 2));
  g.setIndex(acc.idx);
  await pause();
  return finishGeometry(g, pause);
}
function gridIndex(acc, base, cols, rows) {          // columns wrap, rows do not
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols; i++) {
    const i1 = (i + 1) % cols, a = base + j * cols + i, b = base + j * cols + i1, c = base + (j + 1) * cols + i1, d = base + (j + 1) * cols + i;
    acc.idx.push(a, c, b, a, d, c);
  }
}

// ---------- one floating island: turf top (heightfield in polar rings) + inverted-mountain keel ----------
// spec: R, keelD, keelR (1 = plain inverted cone; < 1 = thin overhanging shelf round a narrow keel), shelfH, pow,
//       hum, NT, nTop, NU, keelAmp (scales the keel's large relief: under 1 for a narrow keel), keelFine (0 drops the 11 m relief where the keel's rows are too far apart to carry it), o[6] noise offsets, lean [x,z], pond { x, z, r, level } | null, fangs, pos (world Vector3),
//       carve (push vertices out of the camera corridor), shear [x,z] (the whole island tips: y += shear . xz),
//       ox/oy/oz (offset baked into the vertices: far impostors), acc (merge into this accumulator instead of returning geometry),
//       tint + tintK (a colour the rock leans to), turfRim (turf right out to the lip: far impostors)
async function buildIsland(S, env) {
  const { N, kit, tmpC, cCream, pause } = env;
  const o = S.o, R = S.R, NT = S.NT, nTop = S.nTop, NU = S.NU, y0 = 2.2 + R * (S.turfRim ? 0.1 : 0.02), ts = S.ts ?? 0.3, shx = S.shear ? S.shear[0] : 0, shz = S.shear ? S.shear[1] : 0;
  const Rth = (th) => { const c = Math.cos(th), s = Math.sin(th); return R * (1 + 0.15 * N.n2(c * 0.9 + o[0], s * 0.9 + o[1]) + 0.07 * N.n2(c * 2.3 + o[2], s * 2.3 + o[0])); };
  // (Rk: the rim radius on this bearing when the caller already has it; RthI holds it for each column of the grid)
  const RthI = new Float64Array(NT); for (let i = 0; i < NT; i++) RthI[i] = Rth((i / NT) * TAU);
  const topRaw = (x, z, Rk) => {
    const r = Math.hypot(x, z), f = r / (Rk || Rth(Math.atan2(x, z)));
    let h = 0.9 + S.hum * (1.7 + 2.1 * N.fbm2(x * 0.03 + o[3], z * 0.03 + o[4], 3)) + (S.dome || 0) * (1 - f * f);
    h = Math.max(0.6, h) * sst(1.03, 0.76, f) + 0.25;
    if (S.pond) { const d = Math.hypot(x - S.pond.x, z - S.pond.z); h = lerp(h, S.pond.level - 2.2, sst(S.pond.r + 2.5, S.pond.r - 3, d)); }
    return h;
  };
  const topY = (x, z) => topRaw(x, z) + shx * x + shz * z;
  const acc = S.acc || makeAcc(), base0 = acc.n, ox = S.ox || 0, oy = S.oy || 0, oz = S.oz || 0, wp = S.pos;
  const rockT = (x, y, z) => { kit.rockTint(x, y, z, tmpC); return S.tint ? tmpC.lerp(S.tint, S.tintK) : tmpC; };    // each far island its own stone
  const near = S.carve ? env.nearestIn(wp, Math.hypot(R * 1.4, S.keelD) + CLEAR + 4) : null;      // null when the path never comes close
  const push = (x, y, z, col, m0, m1) => {
    y += shx * x + shz * z;
    if (near) {                                              // keep the corridor: slide the vertex out to CLEAR metres
      const q = near(wp.x + x, wp.y + y, wp.z + z);
      if (q.d < CLEAR) { const k = CLEAR / Math.max(q.d, 0.01); x = q.x + (wp.x + x - q.x) * k - wp.x; y = q.y + (wp.y + y - q.y) * k - wp.y; z = q.z + (wp.z + z - q.z) * k - wp.z; }
    }
    acc.p.push(x + ox, y + oy, z + oz); acc.c.push(col.r, col.g, col.b); acc.m.push(m0, m1); acc.n++;
  };
  // top rings: turf runs to within a stride of the lip (rock that faces the sky is shaded warm and light by the hero's material)
  for (let j = 0; j < nTop; j++) {
    for (let i = 0; i < NT; i++) {
      if (i % 24 === 0) await pause(0.22);
      const th = (i / NT) * TAU, f = j === 0 ? 0.004 : Math.pow(j / (nTop - 1), 0.8), r = RthI[i] * f, x = Math.sin(th) * r, z = Math.cos(th) * r;
      const h = topRaw(x, z, RthI[i]), rock = S.turfRim ? 0 : sst(0.93, 1.0, f);
      kit.turfTint(x + o[5] * 9, z - o[4] * 7, tmpC);
      if (S.pond && h < S.pond.level + 0.5) tmpC.lerp(cCream, 0.5 * sst(S.pond.level + 0.5, S.pond.level - 0.4, h)).multiplyScalar(lerp(1, 0.6, sst(S.pond.level - 0.3, S.pond.level - 1.6, h)));
      if (rock > 0.5) rockT(x, h, z).lerp(cCream, 0.2);
      push(x, h, z, tmpC, rock, 1);
    }
  }
  // cliff lip
  for (let j = 0; j < 2; j++) for (let i = 0; i < NT; i++) {
    const th = (i / NT) * TAU, x0 = Math.sin(th), z0 = Math.cos(th), rr = RthI[i], ye = topRaw(x0 * rr, z0 * rr, rr);
    const y = lerp(ye, -y0, j ? 1 : 0.45), r = rr * (j ? 1.0 : 1.012) + 0.016 * R * N.n3(x0 * 3.5 + o[1], y * 0.4, z0 * 3.5);
    if (S.turfRim && !j) {                                   // a far island wears its meadow over the lip: a green band, pink in drifts, that shows from below and from the side
      kit.turfTint(x0 * r + o[5] * 9, z0 * r - o[4] * 7, tmpC).lerp(env.cPinkCap, 0.75 * sst(0.1, 0.5, N.n2(x0 * 2.2 + o[2], z0 * 2.2 + o[3])));
      push(x0 * r, y, z0 * r, tmpC, 0, 1);
    } else push(x0 * r, y, z0 * r, rockT(x0 * r, y, z0 * r).lerp(cCream, 0.25), 1, 1);
  }
  // underside
  const shelf = S.keelR < 1, rowU0 = (nTop + 2) * NT, fineK = 0.28 * (S.keelAmp ?? 1) * (S.keelFine ?? 1);
  const ceilK = (t) => (shelf ? 1 - sst(ts * 0.8, ts * 1.4, t) : 0);
  for (let k = 1; k <= NU; k++) {
    for (let i = 0; i < NT; i++) {
      if (i % 20 === 0) await pause(0.2);
      const t = k / NU, th = (i / NT) * TAU, x0 = Math.sin(th), z0 = Math.cos(th);
      const a = shelf ? Math.min(1, t / ts) : 1, b = shelf ? Math.max(0, (t - ts) / (1 - ts)) : t;
      const frac = (shelf ? (1 - S.keelR) * Math.pow(1 - a, S.capPow ?? 2.2) : 0) + S.keelR * Math.pow(1 - b, S.pow);
      const y = -y0 - (shelf ? S.shelfH * a : 0) - (S.keelD - y0 - (shelf ? S.shelfH : 0)) * Math.pow(b, 0.92);
      const ceil = ceilK(t);
      const lobes = 1 + (S.lobe ?? 0.2) * N.n2(x0 * 1.6 + o[4] + t * 1.8, z0 * 1.6 + o[5]) * sst(0, 0.25, t) * (1 - ceil);
      const rr = lerp(RthI[i], R, t) * frac * lobes, px = x0 * rr, pz = z0 * rr;
      const amp = R * lerp(0.26 * (S.keelAmp ?? 1), S.ceilAmp ?? 0.035, ceil) * (1 - 0.5 * t * t) * sst(0, 0.12, t);
      let d = amp * N.fbm3(px * 0.022 + o[0], y * 0.022, pz * 0.022 + o[1], 3) + (fineK ? fineK * amp * N.fbm3(px * 0.09, y * 0.09 + o[2], pz * 0.09, 2) : 0);
      d += 0.035 * R * Math.sin(y * (9 / R) + 3 * N.n2(th * 2, y * 0.03 + o[3])) * (1 - t) * (1 - ceil);
      const r = Math.max(0.25, rr + d), tt = t * t;
      const x = x0 * r + S.lean[0] * tt, z = z0 * r + S.lean[1] * tt;
      // a shelf ceiling gets soft ribs running out from the keel: pushed straight down, never up into the turf
      const rough = ceil > 0 && S.ceilRough ? S.ceilRough * ceil * sst(0.04, 0.3, a) * (0.6 * N.fbm3(x * 0.16 + o[2], y * 0.1, z * 0.16 + o[3], 2) + 1.5 * Math.max(0, N.ridged2(x0 * 4.2 + o[4], z0 * 4.2 + o[5], 2) - 0.5)) : 0;
      rockT(x, y, z);
      if (t < 0.35) tmpC.lerp(cCream, 0.25 * sst(0.35, 0.12, t));
      // aMix.y: 1 = open to the cloud sea's light (glows pale blue), lower = deep under the cap by the keel (glows pink)
      push(x, y + (ceil > 0 ? d * 0.4 : 0) - rough, z, tmpC, 1, lerp(1, 0.66, ceil * sst(0.2, 0.95, a)) * (1 - clamp(rough * 0.08, 0, 0.2)));
    }
  }
  await pause(0.3);
  gridIndex(acc, base0, NT, nTop + 2 + NU);
  const under = (k, i, out) => { const q = (base0 + rowU0 + (k - 1) * NT + ((i % NT) + NT) % NT) * 3; return out.set(acc.p[q] - ox, acc.p[q + 1] - oy, acc.p[q + 2] - oz); };
  // fangs: fluted, knuckled blobs hanging from the keel, a few with their tips broken off
  const fr = S.rng, v = new THREE.Vector3(), cols = S.fangRes || 8, rows = cols > 8 ? 8 : 6;
  for (let n = 0; n < (S.fangs || 0); n++) {
    await pause();
    const onCeil = S.fangCeil && n < S.fangCeil;                 // stalactites on a shelf ceiling: slimmer, lower rows
    const len = R * (onCeil ? fr.range(0.05, 0.13) : fr.range(0.1, 0.3)), rad = R * (onCeil ? fr.range(0.014, 0.03) : fr.range(0.035, 0.08));
    let free = false;                                            // no fang may hang beside the camera lane
    for (let tr = 0; tr < 8 && !free; tr++) {
      under(onCeil ? fr.int(S.fangK[0], S.fangK[1]) : fr.int(2, Math.max(3, NU - 3)), fr.int(0, NT - 1), v);
      free = !near || near(wp.x + v.x, wp.y + v.y + shx * v.x + shz * v.z - len * 0.7, wp.z + v.z).d > (S.fangClear || CLEAR + 6) + rad + len * 0.5;
    }
    if (!free) continue;
    const cy = v.y - len * 0.7, base = acc.n;
    const blunt = n % 3 === 1 ? 0.16 + 0.1 * (n % 4) / 3 : 0, cut = -1 + 0.5 * blunt;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const phi = (j / (rows - 1)) * Math.PI, th = (i / cols) * TAU;
      let sy = Math.cos(phi);
      const kk = Math.sin(phi) * (blunt + (1 - blunt) * Math.pow((sy + 1) / 2, 0.8)) * 1.35, sx = kk * Math.sin(th), sz = kk * Math.cos(th);
      if (blunt > 0 && sy < cut) sy = cut + 0.2 * (sx * Math.sin(n * 1.7) + sz * Math.cos(n * 1.3));
      const n1 = (1 + 0.5 * N.fbm3(v.x * 0.37 + sx, cy * 0.37 + sy * 1.2, v.z * 0.37 + sz, 2)) * (1 + 0.17 * N.n3(v.x + sx * 2.9, cy * 0.2 + sy * len * 0.4, v.z + sz * 2.9));
      const x = v.x + sx * rad * n1, y = cy + sy * len, z = v.z + sz * rad * n1;
      const dy = shx * x + shz * z;                              // push() shears again: take it out first (the anchor already carries it)
      push(x, y - dy, z, rockT(x, y, z).multiplyScalar(0.85), 1, 0.85);
    }
    gridIndex(acc, base, cols, rows);
  }
  return { geometry: S.acc ? null : await accGeometry(acc, pause), topY, Rth, under, spec: S, rowU0, base0, acc };
}

// ---------- THE CLOUD SEA: the world's own deck ----------
// A polar grid that follows the camera, lifted into billows in the vertex shader and shaded as CLOUD, not as a lit surface.
// It is made of round HEADS at five very different sizes (420 m massifs, then 110 m, 38 m, 13 m and 4.5 m), each layer the upper
// envelope of domes of unequal size, one to a cell, over a level floor: big heads swallow small neighbours and merge into banks,
// small ones stand apart, and nothing repeats as an even cell pattern. The smaller heads ride the crowns of the larger and thin
// out in the valleys between the massifs, where the deck lies lower, flatter and in a soft mid tone. The tone is light on form:
// a pale crown, a sunny flank, a lee shoulder in lilac shade, a thin soft seam where two heads meet, the massifs' shadows laid
// across their neighbours, and a little fuzz so no edge is a hard line. It grades with distance into a far colour DARKER than
// the sky's horizon, so the sea ends in a horizon line. It takes the shadows of the islands, and round the foot of the Crown's
// spout it calms and sinks into a dark eye with a scalloped lip; three strings of round puffs wind down into it (they turn with
// the spout).
const DECK_GLSL = /* glsl */`
uniform float uTime; uniform vec2 uDrift, uTone2; uniform vec4 uEye, uTone; uniform vec3 uSun;     // uTone, uTone2: see the tone below; eye: x, z of the spout's foot, lift of the deck round the Crown, depth of the eye
float dh21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float dvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(dh21(i), dh21(i + vec2(1.0, 0.0)), f.x), mix(dh21(i + vec2(0.0, 1.0)), dh21(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 dh22(vec2 p){ vec3 q = fract(p.xyx * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
// the profile every head shares. v = height of the envelope of paraboloids (below 0 between heads): x = a round dome 0..1 standing
// on a level floor, y = d(dome)/dv
vec2 domeOf(float v){ float r = sqrt(v * v + 0.012), p = sqrt(max(0.5 * (v + r), 1e-5)); return vec2(p, 0.25 * (1.0 + v / r) / p); }
// one layer of heads: x = dome (0 floor .. 1 the tallest crown), yz = its gradient per cell, w = soft seam where two heads meet
vec4 heads(vec2 p){
  vec2 i = floor(p), f = p - i, g = vec2(0.0); float vm = -9.0, sw = 0.0, s2 = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y)), rnd = dh22(i + o), r = f - o - 0.5 - 0.9 * (rnd - 0.5);
    float sz = 0.45 + 0.55 * fract(rnd.x * 7.3 + rnd.y * 3.1), k = 3.189 / sz, v = sz - k * dot(r, r), d = v - vm;
    float keep = exp(-30.0 * max(d, 0.0)), add = exp(30.0 * min(d, 0.0));                // a running smooth maximum: no crease is a knife edge
    sw = sw * keep + add; g = g * keep - add * 2.0 * k * r;
    s2 = s2 * exp(-5.0 * max(d, 0.0)) + exp(5.0 * min(d, 0.0));
    vm = max(vm, v);
  }
  vec2 D = domeOf(vm + log(max(sw, 1.0)) / 30.0);
  return vec4(D.x, D.y * g / max(sw, 1.0), min((s2 - 1.0) * 0.8, 1.0) * smoothstep(0.0, 0.5, D.x));
}
// the puffs of one arm of the eye, a single string of them: a = arm coordinate (one cell to an arm, its crest at the middle of the
// cell), b = along the arm (the spiral that crosses the arms at right angles; 16 cells to a turn, so the string closes on itself
// across the bearing where the angle wraps). x = dome, yz = its gradient in (across, along) units of one puff's length
vec3 chain(float a, float b){
  float ia = floor(a), ib = floor(b), u = (a - ia - 0.5) * 2.33, fb = b - ib, vm = -9.0, sw = 0.0; vec2 g = vec2(0.0);
  for (int n = -1; n <= 1; n++) {
    vec2 rnd = dh22(vec2(floor(mod(ia + 0.5, 3.0)) + 17.0, floor(mod(ib + float(n) + 0.5, 16.0)))), r = vec2(u - 0.5 * (rnd.x - 0.5), fb - float(n) - 0.5 - 0.6 * (rnd.y - 0.5));
    float sz = 0.6 + 0.4 * fract(rnd.x * 7.3 + rnd.y * 3.1), k = 2.1 / sz, v = sz - k * dot(r, r), d = v - vm;
    float keep = exp(-24.0 * max(d, 0.0)), add = exp(24.0 * min(d, 0.0));
    sw = sw * keep + add; g = g * keep - add * 2.0 * k * r; vm = max(vm, v);
  }
  vec2 D = domeOf(vm + log(max(sw, 1.0)) / 24.0);
  return vec3(D.x, D.y * g / max(sw, 1.0));
}
// height above the base level at world (x, z). big = share of the massifs; lod = shares of the 110 m, 38 m, 13 m and 4.5 m heads;
// shade = 0 in the vertex shader (height only). tone: 0 deep shade .. 1 a lit crown (before the colour ramp);
// k = (arm, bowl of the eye, calm zone, streaks in the eye)
float seaH(vec2 w, float big, vec4 lod, float shade, out float tone, out vec4 k){
  vec2 p = w - uDrift;
  vec2 q = p + 26.0 * vec2(dvn(p * 0.0052 + 3.1), dvn(p * 0.0052 + 9.7)) + 170.0 * (vec2(dvn(p * 0.0011 + vec2(5.3, 1.9)), dvn(p * 0.0011 + vec2(8.1, 4.4))) - 0.5);
  float sw = 2.0 * dvn(p * 0.0015 + 1.7) - 1.0;
  float sl = max(length(uSun.xz), 1e-3), sinE = clamp(uSun.y, 0.05, 0.999), cosE = sqrt(1.0 - sinE * sinE); vec2 sd = uSun.xz / sl;
  // the layers drift at slightly different speeds, so the deck rolls as it goes
  vec4 M = heads(q * 0.0024 + 11.0), B = vec4(0.0), C = vec4(0.0);
  float tw = smoothstep(0.3, 0.9, M.x), amp = 0.5 + 0.7 * tw, cr = 1.0;      // tall and knobbly on the massifs, low and smooth in the valleys
  vec2 G = 0.7 * M.yz; float ao = 0.14 * (1.0 - M.x) * (1.0 - M.x) + 0.15 * (1.0 - tw);
  float h = 20.0 * sw + 46.0 * (M.x - 0.6) * big, hs = 46.0 * (M.x - 0.6);
  if (lod.x > 0.001) {
    B = heads((q + 0.18 * uDrift) * 0.009 + 5.3); float a = amp * lod.x, e = max(1.0 - B.x, 0.0);
    G += 1.5 * a * B.yz; ao += a * (0.34 * e * sqrt(e) + 0.2 * B.w); h += a * 26.0 * (B.x - 0.55); hs += a * 26.0 * (B.x - 0.55);
    cr = mix(1.0, 0.4 + 0.6 * B.x, lod.x);
  }
  if (lod.y > 0.001) {
    C = heads((q - 0.22 * uDrift) * 0.026 + 2.7); float a = amp * cr * lod.y, e = max(1.0 - C.x, 0.0);
    G += 1.2 * a * C.yz; ao += a * (0.22 * e * sqrt(e) + 0.1 * C.w); h += a * 8.0 * (C.x - 0.5);
    cr *= mix(1.0, 0.5 + 0.5 * C.x, lod.y);
  }
  if (lod.z > 0.001) {
    vec4 D = heads(q * 0.077 + 7.1); float a = amp * cr * lod.z, e = max(1.0 - D.x, 0.0);
    G += 0.8 * a * D.yz; ao += a * (0.12 * e * sqrt(e) + 0.055 * D.w); h += a * 2.6 * (D.x - 0.5);
  }
  if (lod.w > 0.001) { vec4 E = heads(q.yx * 0.22 + 1.3); G += 0.4 * cr * lod.w * E.zy; }
  // the massifs' shadows: the deck toward the sun stands higher than here by more than the sun's slope
  float sh = 0.0;
  if (shade > 0.5) {
    float L = clamp(42.0 * cosE / sinE, 60.0, 190.0); vec2 q2 = q + sd * L;
    vec4 M2 = heads(q2 * 0.0024 + 11.0); float h2 = 46.0 * (M2.x - 0.6);
    if (lod.x > 0.001) h2 += lod.x * (0.5 + 0.7 * smoothstep(0.3, 0.9, M2.x)) * 26.0 * (heads((q2 + 0.18 * uDrift) * 0.009 + 5.3).x - 0.55);
    sh = smoothstep(-4.0, 24.0, h2 - hs - L * 0.6 * sinE / cosE);
  }
  // the eye: round the spout the billows calm and the deck sinks into a well with a scalloped lip; three strings of puffs wind down its wall
  vec2 e = w - uEye.xy; float rho = max(length(e), 1e-3);
  float zone = 1.0 - smoothstep(200.0, 380.0, rho), arm = 0.0, bowl = 0.0, streak = 0.5, lift = 0.0;
  if (zone > 0.001) {
    float th = atan(e.x, e.y + step(rho, 2e-3)), rl = max(rho, 12.0), lr = log(rl / 26.0);
    float thr = th - uTime * 0.1, ph = 3.0 * (thr - 2.3 * lr), sp = 0.5 + 0.5 * cos(ph);          // the whole spiral turns as one
    float env = (1.0 - smoothstep(250.0, 370.0, rho)) * smoothstep(6.0, 26.0, rho);
    bowl = 1.0 - smoothstep(36.0, 150.0, rho + 26.0 * (B.x - 0.45) + 10.0 * (C.x - 0.5));     // the heads round the lip scallop it
    vec3 Q = chain(ph * 0.159155 + 0.5, 1.1072 * (lr + 2.3 * thr) + 3.0);
    float bank = smoothstep(0.38, 0.92, sp), pk = 0.45 + 0.55 * bowl;      // broad banks outside; down into the eye each string's round puffs ride their bank,
    float qb = max(Q.x, 0.85 * bank), up = smoothstep(0.0, 0.15, Q.x - 0.85 * bank);      // which winds on unbroken at 0.85 of a puff's height between them: one rope of cloud with low
    arm = env * mix(bank, qb, pk);                                        // scalloped crowns, not a row of separate balls (qb: the string's own height; up: 0 on the bank, rising where a puff stands above it)
    float tr = (1.0 - smoothstep(0.04, 0.42, sp)) * env;
    h = h * (1.0 - 0.4 * zone) * (1.0 - 0.8 * bowl) + uEye.z * zone + arm * (30.0 - 14.0 * bowl) * (0.75 + 0.25 * B.x) - tr * 17.0 * (1.0 - bowl) - bowl * uEye.w + 26.0 * (1.0 - smoothstep(3.0, 22.0, rho));
    // each puff is shaded as a head: its slope, turned from the spiral's frame into the world's
    vec2 et = vec2(e.y, -e.x), gq = 0.358 * (Q.y * 1.1126 * (et - 2.3 * e) + Q.z * 1.1072 * (e + 2.3 * et)) / rl;
    G = G * (1.0 - 0.75 * bowl) + 1.25 * env * pk * up * gq;      // (only the part of a puff that stands above its bank has a slope of its own)
    ao = mix(ao, 0.08, 0.75 * bowl); sh *= 1.0 - 0.8 * zone;
    // crowns are pale, the face a bank turns to the eye is in soft shade, the troughs and the floor of the well in deeper shade
    lift = arm * (0.08 + 0.3 * qb) - 0.12 * arm * (0.5 + 0.5 * sin(ph)) * bowl;      // (pale by the string's own height: the bank between two crowns is nearly as pale as they are)
    lift -= 0.25 * tr * (1.0 - bowl) + 0.34 * bowl * (1.0 - arm);
    streak = 0.5 + 0.5 * cos(3.0 * th + 4.0 * lr + uTime * 0.4);
  }
  tone = 0.0;
  if (shade > 0.5) {
    float nl = (sinE - cosE * dot(G, sd)) / sqrt(1.0 + dot(G, G));
    float fz = lod.y * (dvn(p * 0.045 + 4.0) - 0.5) + 0.6 * lod.z * (dvn(p * 0.13 + vec2(1.0, 7.0)) - 0.5);
    // uTone = (level cloud, gain of a slope that faces the sun, depth of the shade on one turned from it, depth of the valleys),
    // uTone2.x = depth of a massif's shadow: each look sets them (a low sun models every head: cream-gold crowns, violet lee sides)
    float s = 0.6 * (nl - sinE); s = uTone.y * max(s, 0.0) - uTone.z * (1.0 - exp(min(s, 0.0) / max(uTone.z, 0.05)));      // the side turned from the sun is a soft shoulder, never a dark crescent
    tone = uTone.x + s - uTone.w * ao - uTone2.x * sh + 0.16 * fz + lift;
  }
  k = vec4(arm, bowl, zone, streak);
  return h;
}`;

const N_SHADOW = 12;
// the deck's colour at a point W of its surface, seen from cam
const DECK_SHADE = /* glsl */`
#define NSH ${N_SHADOW}
uniform vec3 uCrest, uMid, uShade, uBot, uFar, uEyeCol, uSunCol, uHaze, uShDir; uniform vec4 uShadow[NSH];
vec3 deckColor(vec3 W, vec3 cam){
  vec3 Vv = W - cam; float dist = max(length(Vv), 1e-3), d = length(Vv.xz); vec3 V = Vv / dist;
  // each size of head fades out before it is smaller than a few pixels (fp = metres of cloud under one pixel)
  float fp = max(length(dFdx(W.xz)), length(dFdy(W.xz)));
  vec4 lod = 1.0 - smoothstep(vec4(0.2), vec4(0.6), fp / vec4(110.0, 38.0, 13.0, 4.5));
  float tone; vec4 k;
  seaH(W.xz, 1.0, lod, 1.0, tone, k);
  float t = clamp(tone, 0.0, 1.0);
  // looked at along the deck the crowns hide the valleys behind them: toward the horizon the shade thins out and the sea is white
  t = mix(t, 0.6 + 0.4 * t, uTone2.y * (1.0 - smoothstep(0.04, 0.3, -V.y)) * (1.0 - k.z));
  // the ramp: deep shade, shade, the lilac (or periwinkle) of a shoulder, warm crest. A crown sits at the top of the last stretch.
  vec3 col = mix(uBot, uShade, clamp(t / 0.3, 0.0, 1.0));
  col = mix(col, uMid, clamp((t - 0.3) / 0.32, 0.0, 1.0));
  col = mix(col, uCrest, clamp((t - 0.62) / 0.33, 0.0, 1.0));
  float mu = max(dot(V, uSun), 0.0), mu2 = mu * mu;
  col += uSunCol * (0.14 * mu2 * mu2 * smoothstep(0.5, 1.0, t));       // crowns toward the sun glow a little: a soft bloom, no highlight
  // the eye: a calm dark well, faint streaks turning in it; the banks of puffs wind down its wall over it
  col = mix(col, uEyeCol * (0.72 + 0.6 * k.w), smoothstep(0.12, 0.62, k.y) * (1.0 - smoothstep(0.03, 0.4, k.x)));
  // the islands' shadows lie on the deck (ellipses drawn out along the sun's bearing): soft and blue, as cloud takes shadow
  float sh = 0.0;
  for (int i = 0; i < NSH; i++) {
    vec2 dd = W.xz - uShadow[i].xy; float al = dot(dd, uShDir.xy);
    float r = length(vec2(al * uShDir.z, length(dd - al * uShDir.xy)));
    sh = max(sh, uShadow[i].w * (1.0 - smoothstep(uShadow[i].z * 0.55, uShadow[i].z * 1.2, r)));
  }
  col = mix(col, col * vec3(0.56, 0.63, 0.9), sh);
  col = mix(col, uFar, 0.94 * smoothstep(uHaze.x, uHaze.y, d));
  col = mix(col, uFar, smoothstep(uHaze.z * 0.8, uHaze.z * 0.98, d));
  return col;
}`;
function makeDeck(o) {
  const NA = 128, NR = 90, R = 4700, r0 = 10, ratio = Math.pow(R / r0, 1 / (NR - 1));
  const pos = new Float32Array((NA * NR + 1) * 3), idx = [];
  for (let j = 0, r = r0; j < NR; j++, r *= ratio) for (let i = 0; i < NA; i++) {
    const a = ((i + (j % 2) * 0.5) / NA) * TAU, q = (1 + j * NA + i) * 3;
    pos[q] = Math.sin(a) * r; pos[q + 2] = Math.cos(a) * r;
  }
  for (let i = 0; i < NA; i++) idx.push(0, 1 + i, 1 + (i + 1) % NA);
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NA; i++) {
    const i1 = (i + 1) % NA, a = 1 + j * NA + i, b = 1 + j * NA + i1, c = 1 + (j + 1) * NA + i1, d = 1 + (j + 1) * NA + i;
    idx.push(a, c, b, a, d, c);                              // wound to face up
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R);
  const C = (h) => new THREE.Color(h), shadows = [];
  for (let i = 0; i < N_SHADOW; i++) shadows.push(new THREE.Vector4(0, 0, 1, 0));
  const uniforms = {
    uTime: { value: 0 }, uDrift: { value: new THREE.Vector2() }, uEye: { value: new THREE.Vector4(0, 0, o.lift, o.eyeDepth) }, uBaseY: { value: o.baseY },
    uCrest: { value: C(o.crest) }, uMid: { value: C(o.mid) }, uShade: { value: C(o.shade) }, uBot: { value: C(o.bottom) }, uFar: { value: C(o.far) }, uEyeCol: { value: C(o.eye) },
    uSun: { value: o.sunDir.clone() }, uSunCol: { value: o.sunColor.clone() }, uHaze: { value: new THREE.Vector3(o.haze[0], o.haze[1], R) },
    uShadow: { value: shadows }, uShDir: { value: new THREE.Vector3(1, 0, 1) }, uPatch: { value: 0 },
    uTone: { value: new THREE.Vector4(o.tone[0], o.tone[1], o.tone[2], o.tone[3]) }, uTone2: { value: new THREE.Vector2(o.tone[4], o.tone[5]) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: DECK_GLSL + /* glsl */`
      uniform float uBaseY, uPatch; varying vec3 vW;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0); vec4 k; float tone, r = length(w.xz - cameraPosition.xz);
        // the grid carries only the heads it is fine enough to hold: the smaller ones are shading alone. The eye's own patch is
        // fine enough for all of them, and matches the deck where the two meet
        vec4 lod = vec4(1.0 - smoothstep(400.0, 1000.0, r), 1.0 - smoothstep(90.0, 220.0, r), 0.0, 0.0);
        lod = mix(lod, vec4(1.0, 1.0, 1.0, 0.0), uPatch * (1.0 - smoothstep(120.0, 170.0, length(position.xz))));
        w.y = uBaseY + seaH(w.xz, 1.0 - 0.4 * smoothstep(1400.0, 3000.0, r), lod, 0.0, tone, k);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: DECK_GLSL + DECK_SHADE + /* glsl */`
      uniform float uPatch; varying vec3 vW;
      void main(){
        if (uPatch < 0.5 && length(vW.xz - uEye.xy) < 172.0) discard;      // the eye is drawn by its own finer patch
        gl_FragColor = vec4(deckColor(vW, cameraPosition), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false; mesh.name = 'cloudSea';
  // THE EYE'S PATCH: the deck's grid is 15-25 m coarse where the eye lies (300 m from the lane), too coarse for the puffs of its
  // arms. So the eye, out to 180 m from the spout's foot, is its own disc standing where the eye is: 144 spokes (not staggered)
  // and 54 rings that close up toward the middle, 2 to 5 m apart where the arms lie, in the same shader (the same program: only
  // the uPatch uniform differs); the deck leaves that disc out.
  const PA = 144, PR = 54, ppos = new Float32Array((PA * PR + 1) * 3), pidx = [];
  for (let j = 0; j < PR; j++) for (let i = 0; i < PA; i++) {
    const r = 180 * Math.pow((j + 1) / PR, 1.6), a = (i / PA) * TAU, q = (1 + j * PA + i) * 3;
    ppos[q] = Math.sin(a) * r; ppos[q + 2] = Math.cos(a) * r;
  }
  for (let i = 0; i < PA; i++) pidx.push(0, 1 + i, 1 + (i + 1) % PA);
  for (let j = 0; j < PR - 1; j++) for (let i = 0; i < PA; i++) {
    const i1 = (i + 1) % PA, a = 1 + j * PA + i, b = 1 + j * PA + i1, c = 1 + (j + 1) * PA + i1, d = 1 + (j + 1) * PA + i;
    pidx.push(a, c, b, a, d, c);
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3)); pgeo.setIndex(pidx);
  pgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 260);
  const patch = new THREE.Mesh(pgeo, new THREE.ShaderMaterial({ uniforms: { ...uniforms, uPatch: { value: 1 } }, vertexShader: material.vertexShader, fragmentShader: material.fragmentShader }));
  patch.name = 'cloudSeaEye';
  return {
    object: mesh, patch, uniforms, shadows,
    update(dt, time, camera) {
      uniforms.uTime.value = time; uniforms.uDrift.value.set(o.wind[0] * time, o.wind[1] * time);
      if (camera) { const e = camera.matrixWorld.elements; mesh.position.set(e[12], 0, e[14]); }
    },
  };
}

// The tileable fbm texture the kit's cumulus towers sample (R, G = two fbm fields; B, A = shifted copies of R). The kit makes
// one itself in a single 40-70 ms step when none is passed, so the world makes it here, a few rows at a time.
async function cloudNoise(rng, pause, size = 256) {
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        if (y % 64 === 0) await pause(1.0);
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x], top = a + (b - a) * w;
          acc[p] += amp * (top + (c + (d - c) * w - top) * wy);
        }
      }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1;
  const b0 = new Uint8Array(N), b1 = new Uint8Array(N), kN = 1.75 * 255 / norm, cN = (0.5 - 0.5 * 1.75) * 255;      // each field to bytes once
  for (let p = 0; p < N; p++) {
    if (p % 16384 === 0) await pause(2.5);
    b0[p] = clamp(f[0][p] * kN + cN, 0, 255); b1[p] = clamp(f[1][p] * kN + cN, 0, 255);
  }
  for (let y = 0; y < size; y++) {
    if (y % 64 === 0) await pause(2.5);
    for (let x = 0; x < size; x++) {
      const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
      data[p * 4] = b0[p]; data[p * 4 + 1] = b1[p]; data[p * 4 + 2] = b0[s]; data[p * 4 + 3] = b0[s2];
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

export default {
  id: 'sky-archipelago',
  name: 'Archipelago of Air',
  category: 'alien',
  media: ['air', 'open'],
  weirdness: 0.55,
  async build(ctx) {
    const rng = ctx.rng, N = ctx.noise;
    const scene = new THREE.Scene();
    const col = (h) => new THREE.Color(h), tmpC = new THREE.Color(), cCream = col(PALETTE[2]);
    const updaters = [];                                     // things with update(dt, time, camera, u)
    const owned = [];                                       // textures this file made itself: disposed with the world
    // HANDING THE PAGE BACK. ctx.yield() waits for a frame once 6 ms have passed since the last one, so a build that asks after
    // every fraction of a millisecond is cut into slices of 6-7 ms with a frame's wait (about 10 ms) after each: more waiting
    // than working. So the short steps are batched: pause(w) names roughly what the work since the last call costs (ms on the
    // slow shared test machine, a third of that on a viewer's; 0.4 when not given) and the page is handed back when about 9 ms
    // have gathered; rest() hands it back at once (after a kit call or any other long single step). No step is over ~20 ms.
    let owed = 0;
    const pause = (w = 0.4) => { owed += w; if (owed < 9) return undefined; owed = 0; return ctx.yield(); };
    const rest = () => { owed = 0; return ctx.yield(); };
    const vary = ctx.vary || {}, DENS = clamp(vary.density ?? 1, 0.7, 1.3), DET = clamp(ctx.quality?.detail ?? 1, 0.5, 1);

    // ---------- per-seed character: one of three looks, then everything else varies inside it ----------
    const r0 = rng(), r1 = rng(), mood = vary.mood ?? r0;
    let lookId = mood < 0.42 ? 'blue' : mood < 0.66 ? 'rose' : 'pearl';
    if (vary.hour === 'dawn' || vary.hour === 'golden') lookId = 'rose';
    else if (vary.hour === 'day' && lookId === 'rose') lookId = r0 < 0.55 ? 'blue' : 'pearl';
    const LK = LOOKS[lookId], rosy = lookId === 'rose', pearl = lookId === 'pearl';
    // the sun stands off the camera's shoulder on the -X side: out of frame at the entry (heading +Z) and across the lake (heading -Z),
    // side-lighting both, and behind the falls as seen from the gallery
    const sunEl = lerp(LK.sunEl[0], LK.sunEl[1], r1) + rng.range(-1.5, 1.5), sunAz = -66 + rng.range(-20, 20);
    const zenith = col(LK.zen), horizon = col(LK.hor);
    const moonSide = rng.sign();

    // ---------- sky, light, air ----------
    await rest();                                           // the kit's sky is one long step: keep this file's work out of it
    const sky = makeSky({
      rng: rng.fork('sky'), preset: 'day', zenith, horizon, mid: zenith.clone().lerp(horizon, rosy ? 0.42 : 0.3), ground: col(LK.seaFar), groundFalloff: 34,
      horizonPow: rosy ? 3.6 : 5.5, midPow: 1.25, sunElevation: sunEl, sunAzimuth: sunAz, sunColor: col(LK.sun), sunGlow: rosy ? 0.9 : 0.6,
      scatterColor: col(LK.scat), scatter: LK.scatK,
      clouds: false, clouds2: { coverage: rng.range(LK.cirrus[0], LK.cirrus[1]), opacity: rng.range(0.3, 0.46) + (pearl ? 0.16 : 0), stretch: 1, scale: rng.range(0.7, 1.4), lit: rosy ? '#ffe4d8' : '#ffffff', shade: rosy ? '#b9a0e0' : '#b9c8ee' },
      bodies: [
        { elevation: rng.range(16, 24), azimuth: moonSide * rng.range(16, 30), size: rng.range(5, 7.6), color: '#dfe6ff', color2: '#8fa8e0', texture: 0.8, intensity: rosy ? 0.6 : 0.42, glow: 0.02, seed: rng.int(1, 99) },
        { elevation: rng.range(30, 44), azimuth: 180 - moonSide * rng.range(12, 50), size: rng.range(1.7, 2.6), color: '#f0dcec', color2: '#b898c8', texture: 0.7, intensity: 0.5, glow: 0, seed: rng.int(1, 99) },
      ],
      lightColor: col(LK.key), lightIntensity: LK.keyI, ambientColor: col(LK.amb), ambientIntensity: LK.ambI,
      cloudLit: col(LK.cLit), cloudShade: col(LK.cShade),
      groundLight: col('#8fd8d8').lerp(col('#ffb0c0'), LK.ground),
    });
    await rest();
    // kit workaround: sky.js raises `side`/`ks` (= .5 + .5*dot) to a power; rounding can leave them a hair below zero
    // at the antisolar point, pow() of a negative base is NaN, and one NaN pixel blacks out the frame through bloom.
    for (const m of [sky.material, sky.materialLow]) if (m && typeof m.fragmentShader === 'string') {
      m.fragmentShader = m.fragmentShader.replace(/pow\(side,/g, 'pow(max(side, 0.),').replace(/pow\(ks,/g, 'pow(max(ks, 0.),');
      m.needsUpdate = true;
    }
    scene.add(sky.object); updaters.push(sky);
    // the air is tinted, not white: far islands sink into blue (or rose) while near rock keeps its colour
    const fogColor = col(LK.fog);
    scene.fog = new THREE.FogExp2(fogColor, LK.fogD * rng.range(0.9, 1.12));
    // kit workaround: rig.update(dt, time, camera) calls camera.getWorldDirection(), which rebuilds matrixWorld from the camera's
    // local matrix; the engine's portal camera keeps its pose in matrixWorld only (matrixAutoUpdate = false), so that call
    // resets it to the origin and the world shows wrong through the previous portal. No shadows here: the rig needs no camera.
    await rest();
    const rig = makeLightRig(sky, { bounce: 0.4, follow: false });
    scene.add(rig.object); updaters.push({ update: (dt, time) => rig.update(dt, time) });
    const sunDir = sky.lightDirection.clone();
    const faunaLight = { sunDir: sunDir.clone(), sunColor: sky.lightColor.clone(), sunIntensity: sky.lightIntensity, sky: sky.ambientColor.clone(), skyIntensity: sky.ambientIntensity,
      ground: rig.hemi.groundColor.clone(), groundIntensity: sky.ambientIntensity };
    await rest();
    // the cloud sea is the world's own deck (makeDeck above); it is made after the hero, which says where the spout's foot is.
    // These three draws stay here so every seed keeps the layout it had when the kit's sea was made at this point.
    rng.fork('sea'); rng.range(72, 88);
    const seaWind = [rng.range(2, 5), rng.range(-2, 2)];
    await pause();

    // ---------- the hero: the Crown Island ----------
    const hero = await buildHero(ctx, { palette: PALETTE, sunDir: sunDir.clone(), sunColor: sky.lightColor, skyTop: zenith, skyHorizon: horizon, portalColor: '#fff0c8', portalGlow: 1.0,
      lakeHorizon: LK.lakeHor ? col(LK.lakeHor) : horizon.clone().lerp(zenith, 0.45), lakeGain: LK.lakeGain ?? 1, turfGain: LK.turfGain ?? 1, flowerColor: LK.flower ? col(LK.flower).multiplyScalar(LK.flowerGain ?? 1) : undefined, bounce: LK.bounce, mist: 0.5, seaY: DECK_Y + DECK_LIFT - HY, eyeY: DECK_Y + DECK_LIFT - EYE_DEPTH + 8 - HY, cloudShade: LK.seaShade, pause, rest });
    hero.object.position.set(0, HY, 0);
    hero.uniforms.uBounceA.value.set(LK.bounceA);
    scene.add(hero.object);
    const kit = hero.kit, A = hero.anchors;
    await rest();
    // the cloud sea (see makeDeck): billows to a dark horizon, the eye and its three arms under the Crown's keel
    const deck = makeDeck({ baseY: DECK_Y, lift: DECK_LIFT, eyeDepth: EYE_DEPTH, wind: seaWind, sunDir, sunColor: sky.lightColor, haze: [pearl ? 800 : 900, 3400],
      crest: LK.seaCrest, mid: LK.seaMid, shade: LK.seaShade, bottom: LK.seaBot, far: LK.seaFar, eye: LK.seaEye, tone: LK.seaTone });
    deck.uniforms.uEye.value.x = A.spout.foot.x; deck.uniforms.uEye.value.y = A.spout.foot.z;
    deck.patch.position.set(A.spout.foot.x, 0, A.spout.foot.z);
    scene.add(deck.object, deck.patch); updaters.push(deck);
    await rest();

    // ---------- the flight path ----------
    const W = (v) => new THREE.Vector3(v.x, v.y + HY, v.z);
    const pol = (r, deg, y) => new THREE.Vector3(Math.sin(deg * D2R) * r, HY + y, Math.cos(deg * D2R) * r);
    const jx = rng.range(-28, 28), jy = rng.range(-5, 7), fl = A.flyThrough;
    const path = makePath([
      [135 + jx, 128 + jy, -700], [118 + jx * 0.9, 128.5 + jy, -648],      // entry, level
      [88 + jx * 0.6, 132 + jy * 0.6, -585],                              // over the meadow island
      [64 + jx * 0.3, 138 + jy * 0.3, -530],
      [52, 146, -482], [33, 157, -356],                                   // the gateway: straight at the Crown under the shelf island
      pol(285, 175, -160), pol(232, 178, -163),                           // a swoop down toward the cloud sea: the gap between two falls frames the keel, the eye and the rope
      pol(197, -176, -137), pol(168, -160, -96), pol(152, -140, -77),     // up in through that gap and round to the left under the rim
      W(fl[4]), W(fl[5]),                                                 // a third of a turn through the gallery
      pol(150, -82, -68), pol(176, -70, -61), pol(224, -60, -42),        // out between two falls and straight on out, away from the rim, at the wooded island
      pol(282, -49, -10), pol(322, -36, 16), pol(338, -22, 28),         // a wide climbing left turn 100-140 m off the rim: the Crown is seen whole, the lake, the spire and the portal over its lip
      pol(332, -9, 28), [-17.6, HY + 20, 312], [0, HY + 11, 252],         // wheel in over the rim, coming down low to its lip
      W(A.rimCrest).setY(HY + 11), [0, HY + 10, 110], W(A.portalSeat.position),
    ]);
    const NS = 560, ps = new Float32Array((NS + 1) * 3), _v = new THREE.Vector3(), _w = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, _v); ps[i * 3] = _v.x; ps[i * 3 + 1] = _v.y; ps[i * 3 + 2] = _v.z; }
    const near = { d: 0, x: 0, y: 0, z: 0, u: 0 };
    const scan = (x, y, z, list, n) => {                     // nearest path sample among list[0..n) (or all of them)
      let best = Infinity, bi = 0;
      for (let k = 0; k < n; k++) { const i = list ? list[k] : k, dx = ps[i * 3] - x, dy = ps[i * 3 + 1] - y, dz = ps[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      near.d = Math.sqrt(best); near.x = ps[bi * 3]; near.y = ps[bi * 3 + 1]; near.z = ps[bi * 3 + 2]; near.u = bi / NS;
      return near;
    };
    const nearest = (x, y, z) => scan(x, y, z, null, NS + 1);
    // the same search restricted to the samples within `reach` of a centre (an island only ever meets a short stretch of the path)
    const nearestIn = (c, reach) => {
      const list = [], r2 = reach * reach;
      for (let i = 0; i <= NS; i++) { const dx = ps[i * 3] - c.x, dy = ps[i * 3 + 1] - c.y, dz = ps[i * 3 + 2] - c.z; if (dx * dx + dy * dy + dz * dz < r2) list.push(i); }
      if (!list.length) return null;
      const arr = Int32Array.from(list);
      return (x, y, z) => scan(x, y, z, arr, arr.length);
    };
    // AIR ROUND THE LANE, one rule for everything that flies a course of its own (rays, flocks, the leviathan; live's two parrot
    // crossings, keyed to u as on the site and kept as its own lines, are not under it):
    // gap(): metres from a point to the lane line, the path taken as a chain of straight pieces between its samples (2.9 m apart),
    // with the point of the lane that is nearest. (The search looks at every eighth sample first: the nearest sample of all lies
    // within four samples, 11.5 m of lane, of one of those, so only the neighbours of the coarse samples that are within 13 m of
    // the best coarse distance need be looked at. The answer is the same as a search of them all, at a sixth of the work.)
    const gapAt = { d: 0, x: 0, y: 0, z: 0 }, CS = 8, NC = NS / CS, cd = new Float32Array(NC + 1);
    const gap = (x, y, z) => {
      let best = Infinity, bi = 0, bc = Infinity;
      for (let c = 0; c <= NC; c++) { const i = c * CS * 3, dx = ps[i] - x, dy = ps[i + 1] - y, dz = ps[i + 2] - z, d = dx * dx + dy * dy + dz * dz; cd[c] = d; if (d < bc) bc = d; }
      const lim = (Math.sqrt(bc) + 13) ** 2;
      for (let c = 0; c <= NC; c++) if (cd[c] <= lim) for (let i = Math.max(0, c * CS - 4), e = Math.min(NS, c * CS + 4); i <= e; i++) { const dx = ps[i * 3] - x, dy = ps[i * 3 + 1] - y, dz = ps[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      gapAt.d = Math.sqrt(best); gapAt.x = ps[bi * 3]; gapAt.y = ps[bi * 3 + 1]; gapAt.z = ps[bi * 3 + 2];
      for (let j = Math.max(0, bi - 1); j <= Math.min(NS - 1, bi); j++) {
        const ax = ps[j * 3], ay = ps[j * 3 + 1], az = ps[j * 3 + 2], bx = ps[j * 3 + 3] - ax, by = ps[j * 3 + 4] - ay, bz = ps[j * 3 + 5] - az;
        const t = clamp(((x - ax) * bx + (y - ay) * by + (z - az) * bz) / (bx * bx + by * by + bz * bz), 0, 1), cx = ax + bx * t, cy = ay + by * t, cz = az + bz * t, d = Math.hypot(cx - x, cy - y, cz - z);
        if (d < gapAt.d) { gapAt.d = d; gapAt.x = cx; gapAt.y = cy; gapAt.z = cz; }
      }
      return gapAt;
    };
    // airRoute(): a course whose control points are slid straight away from the lane, a little further each pass, until no point
    // of the course AS IT WILL BE FLOWN (the kit's own curve through them, tried every 2.5 m) is nearer the lane than `air` metres.
    // The courses are laid out to pass well to one side of the lane already (see each); this only trims them.
    const airRoute = (pts, air, closed = true) => {
      let length = 0, low = 0;
      for (let pass = 0; pass < 10; pass++) {
        const R = F.bakeRoute(pts, closed), n = Math.ceil(R.length / 2.5);
        length = R.length; low = Infinity;
        for (let i = 0; i <= n; i++) { R.pointAt((length * i) / n, _v); const d = gap(_v.x, _v.y, _v.z).d; if (d < low) low = d; }
        R.texture.dispose();
        if (low >= air) break;
        const want = air + 1.5 * (pass + 1);
        for (const p of pts) {
          const g = gap(p.x, p.y, p.z);
          if (g.d >= want) continue;
          if (g.d < 0.5) p.y = g.y - want; else { const k = want / g.d; p.set(g.x + (p.x - g.x) * k, g.y + (p.y - g.y) * k, g.z + (p.z - g.z) * k); }
        }
      }
      return { pts, length, air: low };
    };
    // keepAir(): every member of a troop or flock flies the group's course moved by its own fixed offset (and bobs or wanders
    // up to `slack` metres about that). A member whose own track would come within CLEAR + slack of the lane anywhere along the
    // course is drawn in toward the middle of the group until it does not: the formation closes up where the lane is near.
    const keepAir = (f, slack) => {
      const R = f.route, iA = f.geometry.attributes.iA, iB = f.geometry.attributes.iB, n = Math.ceil(R.length / 2.5), g = new Float32Array(n + 1), P = new Float32Array((n + 1) * 3);
      let low = Infinity, far = 0;
      for (let m = 0; m < f.count; m++) far = Math.max(far, Math.hypot(iA.array[m * 4], iA.array[m * 4 + 1], iB.array[m * 4 + 3]));
      for (let i = 0; i <= n; i++) { R.pointAt((R.length * i) / n, _v); P[i * 3] = _v.x; P[i * 3 + 1] = _v.y; P[i * 3 + 2] = _v.z; g[i] = gap(_v.x, _v.y, _v.z).d; if (g[i] < low) low = g[i]; }
      if (low - far - slack >= CLEAR) return f;               // the whole formation is clear all the way round
      // the stretch of the lane that lies within reach of the course, and the points of the course that lie within reach of it
      const reach = far + slack + CLEAR + 3, r2 = reach * reach, lane = [], hot = [], lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i <= n; i++) if (g[i] < reach) { hot.push(i); for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P[i * 3 + a] - reach); hi[a] = Math.max(hi[a], P[i * 3 + a] + reach); } }
      for (let j = 0; j <= NS; j++) if (ps[j * 3] > lo[0] && ps[j * 3] < hi[0] && ps[j * 3 + 1] > lo[1] && ps[j * 3 + 1] < hi[1] && ps[j * 3 + 2] > lo[2] && ps[j * 3 + 2] < hi[2]) for (const i of hot) { const dx = ps[j * 3] - P[i * 3], dy = ps[j * 3 + 1] - P[i * 3 + 1], dz = ps[j * 3 + 2] - P[i * 3 + 2]; if (dx * dx + dy * dy + dz * dz < r2) { lane.push(j); break; } }
      const laneIx = Int32Array.from(lane), need = (CLEAR + slack + 0.2) ** 2;      // (0.2: a sample of the lane may stand that much further off than the line between two)
      for (let m = 0; m < f.count; m++) {
        let ox = iA.array[m * 4], oy = iA.array[m * 4 + 1], oz = iB.array[m * 4 + 3];
        for (let tries = 0; tries < 16; tries++) {
          const len = Math.hypot(ox, oy, oz); let ok = true;
          if (low - len - slack < CLEAR) for (let h = 0; h < hot.length && ok; h++) {
            const i = hot[h]; if (g[i] - len - slack >= CLEAR) continue;
            const x = P[i * 3] + ox, y = P[i * 3 + 1] + oy, z = P[i * 3 + 2] + oz;
            for (let q = 0; q < laneIx.length; q++) { const j = laneIx[q] * 3, dx = ps[j] - x, dy = ps[j + 1] - y, dz = ps[j + 2] - z; if (dx * dx + dy * dy + dz * dz < need) { ok = false; break; } }
          }
          if (ok) break;
          ox *= 0.8; oy *= 0.8; oz *= 0.8;
        }
        iA.array[m * 4] = ox; iA.array[m * 4 + 1] = oy; iB.array[m * 4 + 3] = oz;
      }
      iA.needsUpdate = true; iB.needsUpdate = true;
      return f;
    };
    const frameAt = (u) => {                                 // path point + level forward / left vectors there
      const p = path.pointAt(u, new THREE.Vector3()), t = path.tangentAt(u, new THREE.Vector3()); t.y = 0; t.normalize();
      return { u, p, f: t, l: new THREE.Vector3(t.z, 0, -t.x) };
    };
    const frameAtPoint = (x, z) => frameAt(path.nearestXZ(x, z).u);

    // ---------- the archipelago ----------
    const env = { N, kit, tmpC, cCream, pause, nearestIn, cPinkCap: col(PALETTE[3]).lerp(col(PALETTE[2]), 0.2) };
    const rockMat = kit.rockMaterial(), floraMat = kit.floraMaterial;
    const islands = [];                                      // { group, base (Vector3), R, bob, isl }
    const iRng = rng.fork('islands'), lay = rng.fork('layout'), sideA = lay.sign();
    const specOf = (R, o = {}, g = iRng) => ({             // (g: the stream the island's character is drawn from)
      R, keelD: R * g.range(1.1, 2.3), keelR: 1, shelfH: 0, pow: g.range(0.5, 1.15), lobe: g.range(0.15, 0.4), hum: g.range(0.6, 1.3), dome: g.range(0, 2.5),
      NT: 40, nTop: 6, NU: 12, o: [0, 0, 0, 0, 0, 0].map(() => g.range(0, 60)), lean: [g.range(-0.3, 0.3) * R, g.range(-0.3, 0.3) * R],
      pond: null, fangs: g.int(3, 7), rng: g.fork('f' + islands.length), carve: false, ...o,
    });
    // a far island's own stone: cream, pink or violet, picked from numbers its spec already holds (no new random draws)
    const TINTS = [col(PALETTE[2]), col(PALETTE[3]).lerp(col(PALETTE[2]), 0.3), col(PALETTE[5]).lerp(col(PALETTE[0]), 0.25), col('#ffd9a0')];
    const tinted = (S) => { S.tint = TINTS[Math.floor(S.o[0] / 60 * 3.999) % 4]; S.tintK = 0.16 + 0.2 * (S.o[1] / 60); return S; };
    // trees and root curtains for one island, in its local frame; o.extra(isl) may add more to the same mesh
    const dress = async (isl, o = {}) => {
      const S = isl.spec, r = S.rng, wp = S.pos, R = S.R, v = _v;
      const clear = (x, y, z, rad) => !S.carve || nearest(wp.x + x, wp.y + y, wp.z + z).d > rad;
      kit.beginFlora();
      const nTrees = Math.round((o.trees ?? clamp(R * R * 0.0052, 3, 26)) * DENS), placed = [];
      for (let tries = 0; tries < nTrees * 12 && placed.length < nTrees; tries++) {
        const th = r.range(0, TAU), f = Math.sqrt(r()) * 0.84, rr = isl.Rth(th) * f, x = Math.sin(th) * rr, z = Math.cos(th) * rr, y = isl.topY(x, z);
        const h = r.range(6.5, 12.5) * clamp(0.62 + R / 110, 0.7, 1.25) * (o.treeScale || 1);
        if (S.pond && Math.hypot(x - S.pond.x, z - S.pond.z) < S.pond.r + 4) continue;
        if (placed.some((q) => (q[0] - x) ** 2 + (q[1] - z) ** 2 < 22)) continue;
        if (!clear(x, y + h * 0.75, z, CLEAR + h * 0.7) || !clear(x, y + h * 0.3, z, CLEAR + 2)) continue;
        placed.push([x, z]);
        kit.addTree(x, y, z, h, r.chance(o.frond ?? 0.6), r, !!o.rich);
        await pause(0.55);
      }
      await pause();
      const nCurt = o.curtains ?? Math.round(clamp(R * 0.16, 3, 14));
      for (let c = 0; c < nCurt; c++) {
        await pause(0.1);
        const k = r.int(o.curtK ? o.curtK[0] : 1, o.curtK ? o.curtK[1] : Math.max(2, Math.round(S.NU * (S.keelR < 1 ? 0.5 : 0.7)))), i0 = r.int(0, S.NT - 1), count = r.int(3, 7), pink = r.range(0.1, 0.9);
        const baseLen = clamp(R * r.range(0.14, 0.42), 5, 36) * (o.rootScale || 1);
        for (let m = 0; m < count; m++) {
          isl.under(k, i0 + m, v);
          const len = baseLen * r.range(0.55, 1.2), x = v.x, y = v.y, z = v.z;
          if (!clear(x, y - len * 0.5, z, CLEAR - 0.5 + len * 0.08) || !clear(x, y - len, z, CLEAR - 0.5 + len * 0.08) || !clear(x, y, z, CLEAR - 2)) continue;
          kit.addRoot(x, y, z, len, r, pink, 0.8, o.rich && r.chance(0.3) ? r.range(0.3, 0.5) : 0);
        }
      }
      if (o.extra) { await pause(); await o.extra(isl, placed); }
      await pause(0.6);
      return kit.endFlora(pause);
    };
    const addIsland = async (S, o = {}) => {
      const isl = await buildIsland(S, env), group = new THREE.Group();
      group.position.copy(S.pos);
      group.add(new THREE.Mesh(isl.geometry, rockMat));
      await pause();
      if (o.flora !== false) group.add(new THREE.Mesh(await dress(isl, o), floraMat));
      scene.add(group);
      const bR = o.bobRng || iRng;
      const rec = { group, base: S.pos.clone(), R: S.R, isl, bob: o.bob ? { amp: bR.range(1.2, 3.2), w: bR.range(0.16, 0.3), ph: bR.range(0, TAU), yaw: bR.range(0.01, 0.03) } : null };
      islands.push(rec);
      await pause();
      return rec;
    };

    // A: the meadow island the camera skims (its bulk left or right of the line, by seed)
    const fA = frameAtPoint(88 + jx * 0.6, -585);
    const posA = new THREE.Vector3(fA.p.x + fA.l.x * 9 * sideA, fA.p.y - 13.5, fA.p.z + fA.l.z * 9 * sideA);
    // THE SHOULDER WOOD: the meadow island's tallest trees stand in a belt round its shoulder, between 0.42 and 0.8 of the way from
    // its middle out to its rim, about one to every 9 m of the belt, coral frond trees with every third a gourd tree, each 12 to
    // 16 m tall from the turf it stands on; the meadow inside the belt is open. A rule of the island's own, in its own frame. The
    // one thing it takes from the flight is the air kept round the lane: no crown comes within CLEAR of it (a tree that would is
    // grown shorter, or not at all), so the belt opens where the lane crosses it.
    const shoulderWood = async (isl, placed) => {
      const S = isl.spec, fr = S.rng.fork('front'), nBelt = Math.round(TAU * 0.61 * S.R / 9);
      for (let n = 0; n < nBelt; n++) {
        const th = ((n + fr.range(-0.3, 0.3)) / nBelt) * TAU, rr = isl.Rth(th) * fr.range(0.42, 0.8), x = Math.sin(th) * rr, z = Math.cos(th) * rr, y = isl.topY(x, z), h0 = fr.range(12, 16);
        if (!placed.some((q) => (q[0] - x) ** 2 + (q[1] - z) ** 2 < 30)) for (const hk of [1, 0.86, 0.72]) {
          const h = h0 * hk, wx = S.pos.x + x, wz = S.pos.z + z;
          if (nearest(wx, S.pos.y + y + h * 0.78, wz).d < CLEAR + 0.5 * h || nearest(wx, S.pos.y + y + h * 0.3, wz).d < CLEAR + 2) continue;
          placed.push([x, z]);
          kit.addTree(x, y, z, h, n % 3 !== 0, fr, true);
          break;
        }
        await pause(0.8);
      }
    };
    const isA = await addIsland(specOf(50, { pos: posA, NT: 96, nTop: 12, NU: 20, hum: 0.8, dome: 1.2, carve: true, fangs: 8, fangRes: 10, keelD: 88 }), { trees: 20, curtains: 9, rich: true, extra: shoulderWood });

    // B: THE GATEWAY. A shelf island tipped up toward the Crown like a visor; the path runs straight under its cap, 36 m from the middle of its keel,
    // down an avenue of root curtains that ends in two long posts of roots at the far lip: the Crown's ring of falls stands between them.
    const uK = 1572.8 / path.length;                     // these fractions were set on a path 1572.8 m long: keep the places, not the numbers
    const uG = 0.197 * uK, fB = frameAt(uG), RB = 80;
    const posB = new THREE.Vector3(fB.p.x - fB.l.x * 36, fB.p.y + 33, fB.p.z - fB.l.z * 36);       // keel on the right, so the Crown stays in view from the entry
    const gate = { u: 0.223 * uK };
    const gatewayCurtains = async (isl) => {
      const S = isl.spec, gr = S.rng.fork('gate'), wp = S.pos, Lp = path.length;
      // the cap's ceiling as a cloud of points (the rows before the keel turns down), bucketed, for "how high is the roof over (x, z)"
      const KR = Math.round(S.NU * S.ts * 0.92), cv = new Float32Array(KR * S.NT * 3);
      for (let k = 1; k <= KR; k++) for (let i = 0; i < S.NT; i++) { isl.under(k, i, _v); const q = ((k - 1) * S.NT + i) * 3; cv[q] = _v.x; cv[q + 1] = _v.y; cv[q + 2] = _v.z; }
      const CELL = 4, cells = new Map(), key = (ix, iz) => ix * 4096 + iz;
      for (let q = 0; q < cv.length; q += 3) { const kk = key(Math.floor(cv[q] / CELL), Math.floor(cv[q + 2] / CELL)); let b = cells.get(kk); if (!b) cells.set(kk, b = []); b.push(q); }
      const ceilAt = (lx, lz) => {
        const ix = Math.floor(lx / CELL), iz = Math.floor(lz / CELL); let best = 1e9, by = 0;
        for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const b = cells.get(key(ix + a, iz + c)); if (b) for (const q of b) { const dx = cv[q] - lx, dz = cv[q + 2] - lz, d = dx * dx + dz * dz; if (d < best) { best = d; by = cv[q + 1]; } } }
        return best < 12 ? by : null;
      };
      const at = (s, lat, out) => {                          // island-local point `lat` metres left of the path at arc length s
        path.posAtDist(s, _w); path.tangentAtDist(s, _v); const tl = Math.hypot(_v.x, _v.z) || 1;
        return out.set(_w.x + (_v.z / tl) * lat - wp.x, 0, _w.z - (_v.x / tl) * lat - wp.z);
      };
      const q = new THREE.Vector3(), sMid = uG * Lp, sGate = gate.u * Lp;
      const rimS = (dir) => { let s = sMid; for (let k = 0; k < 130; k++) { at(s + dir, 0, q); if (ceilAt(q.x, q.z) === null) break; s += dir; } return s; };
      const sIn = rimS(-1), sOut = rimS(1);
      await pause(7);
      const hang = (s, lat, len, thick, pink, bud) => {
        at(s, lat, q); const cy = ceilAt(q.x, q.z);
        if (cy === null) return;
        const need = CLEAR - 0.5 + len * 0.07;                 // a root sways by up to 7% of its length
        if (nearest(wp.x + q.x, wp.y + cy - len, wp.z + q.z).d < need || nearest(wp.x + q.x, wp.y + cy - len * 0.55, wp.z + q.z).d < need) return;
        kit.addRoot(q.x, cy - 0.3, q.z, len, gr, pink, thick, bud);
      };
      // the avenue: two rows either side of the line, two roots deep, lengthening and opening out toward the gate
      for (let s = sIn + 5, n = 0; s < sGate - 4; s += 2.3, n++) for (const sg of [-1, 1]) for (let layer = 0; layer < 2; layer++) {
        if (n % 6 === 5 && sg < 0 && !layer) await pause(1.0);
        const k = sst(sGate - 60, sGate - 4, s), lat = sg * (12.9 + 2.2 * k + layer * 2.7 + gr.range(0, 1.5));
        const len = (lerp(11, 14, k) + 3 * Math.sin(s * 0.23 + sg * 1.3)) * gr.range(0.72, 1.18) * (layer ? 0.78 : 1);
        hang(s + gr.range(-0.8, 0.8), lat, len, 0.5, gr.range(0.15, 0.9), gr.chance(0.3) ? gr.range(0.3, 0.46) : 0);
      }
      await pause();
      // the gate: a dense post of long roots each side of the line, longest by the opening, and a short fringe across its top
      for (const sg of [-1, 1]) for (let b = 0; b < 10; b++) {
        await pause();
        const lat0 = sg * (15.4 + b * 1.4);
        for (let a = 0; a < 6; a++) {
          const len = lerp(34, 15, Math.pow(b / 9, 0.8)) * gr.range(0.74, 1.1) * (1 - 0.06 * a);
          hang(sGate + (a - 2.5) * 2.0 + gr.range(-0.6, 0.6), lat0 + gr.range(-0.4, 0.4), len, 0.56, gr.range(0.2, 0.9), gr.chance(0.42) ? gr.range(0.34, 0.54) : 0);
        }
      }
      for (let lat = -14; lat <= 14; lat += 1.5) hang(sGate + gr.range(-1.5, 1.5), lat + gr.range(-0.4, 0.4), gr.range(1.6, 3.4) + 0.3 * Math.abs(lat), 0.5, gr.range(0.3, 0.9), gr.chance(0.5) ? 0.3 : 0);
      await pause();
      // beyond the gate the roof runs on to the lip: a thin fringe so it is not bare
      for (let s = sGate + 7; s < sOut - 2; s += 3.4) for (const sg of [-1, 1]) hang(s + gr.range(-1, 1), sg * gr.range(15, 30), gr.range(3, 8), 0.5, gr.range(0.2, 0.9), gr.chance(0.4) ? 0.34 : 0);
    };
    const isB = await addIsland(specOf(RB, { pos: posB, NT: 160, nTop: 10, NU: 40, ts: 0.5, capPow: 1.9, ceilAmp: 0.036, ceilRough: 2.2, keelR: 0.21, keelAmp: 0.5, keelFine: 0, shelfH: 20, keelD: 150, pow: 0.8, hum: 1, carve: true,
      fangs: 22, fangCeil: 6, fangK: [15, 19], fangRes: 10, fangClear: 30, shear: [fB.f.x * 0.24, fB.f.z * 0.24], lean: [iRng.range(-10, 10), iRng.range(-10, 10)] }),
      { trees: 16, curtains: 12, curtK: [12, 30], rootScale: 1.3, extra: gatewayCurtains });

    // C: the pond island, in the sun below the bank out of the gateway (its spring spills off the rim that faces the gateway)
    const fC = frameAt(0.262 * uK), RC = 44, eyeG = path.pointAt(0.2 * uK, new THREE.Vector3());
    const posC = new THREE.Vector3(fC.p.x - fC.l.x * 58, fC.p.y - 33, fC.p.z - fC.l.z * 58);    // off to the right of the line: the view down to the eye stays open
    const dC = new THREE.Vector3(eyeG.x - posC.x, 0, eyeG.z - posC.z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);     // toward the gateway, turned to the open side
    const pond = { x: dC.x * RC * 0.6, z: dC.z * RC * 0.6, r: 10.5, level: 1.3 };
    const isC = await addIsland(specOf(RC, { pos: posC, NT: 96, nTop: 12, NU: 18, carve: true, pond, hum: 0.7, dome: 1.6, keelD: 76, fangs: 6, fangRes: 10 }), { trees: 15, curtains: 8, rich: true });
    // D: a small island hung below the shelf island's rim on the Crown's side of the line, so the vine bridge between the two sweeps
    // down the left of the gateway's opening against the sky (u 0.1-0.18). Its spec is drawn here and a stand-in holds its old
    // place in the list while the other islands are laid out (every seed keeps its layout); it is built after them (see below).
    const specD = specOf(28, { NT: 56, nTop: 7, NU: 14 }), slotD = islands.length;
    islands.push({ group: null, base: new THREE.Vector3(posB.x - fB.l.x * 104 + fB.f.x * 8, posB.y + 6, posB.z - fB.l.z * 104 + fB.f.z * 8), R: 28, bob: null, isl: null });
    // E: a tall island left of the opening view, with the archipelago's longest free fall
    const posE = new THREE.Vector3(fA.p.x + fA.l.x * 215 + fA.f.x * 180, 214 + iRng.range(-10, 14), fA.p.z + fA.l.z * 215 + fA.f.z * 180);
    const isE = await addIsland(specOf(46, { pos: posE, NT: 64, nTop: 8, NU: 16, keelD: 110 }), { trees: 14, curtains: 8 });
    // G: a wooded island outside the ring, beyond the gap the lane leaves the gallery by; the climbing turn wheels past above it
    const posG = pol(371, -27.5, -25 + iRng.range(-5, 5));
    const isG = await addIsland(specOf(58, { pos: posG, NT: 88, nTop: 9, NU: 18, keelD: 118, hum: 1, dome: 2.4 }), { trees: 28, curtains: 12, treeScale: 1.15, rootScale: 1.3 });
    // two dressed companions beyond it, so the view out of the falls has a rising chain of islands (they bob)
    const midOpts = (R) => ({ bob: true, trees: Math.max(5, Math.round(R * R * 0.0045)), treeScale: 1.5, rootScale: 1.5 });
    for (const [r, a, y, R] of [[525, -15 + iRng.range(-3, 3), -18, iRng.range(32, 40)], [520, -70 + iRng.range(-4, 4), -10, iRng.range(30, 38)]])
      await addIsland(tinted(specOf(R, { pos: pol(r, a, y + iRng.range(-8, 8)), NT: 64, nTop: 7, NU: 14 })), midOpts(R));

    // mid-distance islands (they bob): a rising curve either side of the approach, and a backdrop behind the Crown
    const e0 = path.pointAt(0, new THREE.Vector3());
    const sightDist = (x, z) => {                             // distance in plan from the opening sight line entry -> Crown
      const ax = e0.x, az = e0.z, bx = -40, bz = -170, t = clamp(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2), 0, 1);
      return Math.hypot(x - ax - (bx - ax) * t, z - az - (bz - az) * t);
    };
    const shapeOf = (R) => {                                 // cone, mushroom shelf, or shallow bowl
      const k = iRng();
      if (k < 0.3) return { keelR: iRng.range(0.36, 0.6), shelfH: R * iRng.range(0.18, 0.34), keelD: R * iRng.range(1.3, 2.2), pow: iRng.range(0.6, 1) };
      if (k < 0.5) return { keelD: R * iRng.range(0.7, 1.0), pow: iRng.range(0.32, 0.5), lobe: 0.45 };
      return {};
    };
    const taken = (x, z, R) => islands.some((q) => Math.hypot(q.base.x - x, q.base.z - z) < q.R + R + 26) || Math.hypot(x, z) < 290 + R || path.nearestXZ(x, z).dist < R + 48;
    const nMid = Math.round(iRng.int(9, 11) * DENS);
    for (let n = 0, tries = 0; n < nMid && tries < 500; tries++) {
      if (tries % 6 === 5) await pause(0.15);
      let x, y, z, R;
      if (n < 3) {                                           // behind the Crown, seen across the lake
        const a = (180 + iRng.range(-64, 64)) * D2R, d = iRng.range(370, 640);
        x = Math.sin(a) * d; z = Math.cos(a) * d; y = HY + iRng.range(25, 150); R = iRng.range(34, 62);
      } else if (n < 6) {                                    // outside the climbing turn
        const a = iRng.range(-95, 20) * D2R, d = iRng.range(430, 620);
        x = Math.sin(a) * d; z = Math.cos(a) * d; y = HY + iRng.range(-70, 70); R = iRng.range(26, 56);
      } else {
        const u = iRng.range(0, 0.36), p = path.pointAt(u, _v), t = path.tangentAt(u, _w), lat = iRng.range(105, 310) * (n % 2 ? 1 : -1), tl = Math.hypot(t.x, t.z) || 1;
        x = p.x + (t.z / tl) * lat; z = p.z - (t.x / tl) * lat; y = clamp(p.y + iRng.range(-45, 95), 96, 345); R = 18 + 38 * Math.pow(iRng(), 1.6);
        if (sightDist(x, z) < R + 34) continue;
      }
      if (taken(x, z, R)) continue;
      await addIsland(tinted(specOf(R, { pos: new THREE.Vector3(x, y, z), NT: R > 36 ? 56 : 44, nTop: 6, NU: 10, ...shapeOf(R) })), midOpts(R));
      n++;
    }
    // island D takes its real place now: the first of three seats beside the gateway that no other island crowds
    const seatsD = [[112, 58], [122, 24], [104, 92]].map(([dl, df]) => new THREE.Vector3(posB.x + fB.l.x * dl + fB.f.x * df, posB.y - 20, posB.z + fB.l.z * dl + fB.f.z * df));
    const crowded = (c) => islands.some((q, i) => i !== slotD && i !== 1 && Math.hypot(q.base.x - c.x, q.base.z - c.z) < q.R + 42 && Math.abs(q.base.y - c.y) < 90);
    const posD = seatsD.find((c) => !crowded(c)) || seatsD[0];
    specD.pos = posD;
    const isD = await addIsland(specD, { trees: 8, curtains: 5 });
    islands.splice(slotD, 1);                               // the stand-in goes; D itself is now last in the list
    // far impostors: ~300 triangles each, merged into three slowly bobbing groups; the tinted air stacks them into blue layers
    const farGroups = [];
    {
      const accs = [makeAcc(), makeAcc(), makeAcc()], nFar = iRng.int(22, 28), tufts = [[], [], []];
      for (let n = 0, tries = 0; n < nFar && tries < 400; tries++) {
        if (tries % 6 === 5) await pause(0.15);
        const a = iRng.range(0, TAU), d = iRng.range(620, 1750), x = Math.sin(a) * d, z = Math.cos(a) * d, R = iRng.range(45, 150);
        if (path.nearestXZ(x, z).dist < R + 260 || sightDist(x, z) < R + 60) continue;
        const behind = Math.abs(Math.abs(a - Math.PI) ) < 0.95;      // behind the spire as seen across the lake: keep them above its horizon
        const y = behind ? HY + iRng.range(70, 300) : iRng.range(110, 520) + d * 0.05;
        const S = tinted(specOf(R, { acc: accs[n % 3], ox: x, oy: y, oz: z, pos: new THREE.Vector3(), NT: 16, nTop: 4, NU: 6, fangs: 1, hum: 0.5, dome: 0, turfRim: true, ...shapeOf(R) }));
        const isl = await buildIsland(S, env);
        // a tuft of trees on its cap (drawn from the island's own stream, after its fangs): big enough to read at this range
        for (let t = 0, nT = d < 1200 ? 4 : 3; t < nT; t++) {
          const th = S.rng.range(0, TAU), rr = isl.Rth(th) * S.rng.range(0.1, 0.8), tx = Math.sin(th) * rr, tz = Math.cos(th) * rr;
          tufts[n % 3].push([x + tx, y + isl.topY(tx, tz), z + tz, S.rng.range(15, 22) * clamp(R / 80, 0.8, 1.5), S.rng.chance(0.85), S.rng]);
        }
        n++;
      }
      for (let g3 = 0; g3 < 3; g3++) {
        const acc = accs[g3];
        if (!acc.n) continue;
        const g = new THREE.Group(); g.add(new THREE.Mesh(await accGeometry(acc, pause), rockMat));
        kit.beginFlora();
        for (const t of tufts[g3]) { kit.addTree(t[0], t[1], t[2], t[3], t[4], t[5], false); await pause(0.35); }
        g.add(new THREE.Mesh(await kit.endFlora(pause), floraMat));
        scene.add(g);
        farGroups.push({ group: g, amp: iRng.range(2.5, 5), w: iRng.range(0.12, 0.2), ph: iRng.range(0, TAU) });
        await pause();
      }
    }
    // THE ISLETS OF THE CLIMB: two small bobbing islets hang in the strait between the Crown's gap (anchor gapOut) and the wooded
    // island, 10 to 25 m below the straight line between the two places: one 0.4 to 0.5 of the way along it, one 0.5 to 0.54 (clear of
    // both islands' falls), D off it in plan on opposite sides (first side by seed); each keeps `reach` m from the lane line. Stream ':climb-islets'.
    const islets = [];
    {
      const AIR_ISLET = 19, kR = makeRng(hashSeed(ctx.seed + ':climb-islets')), sideI = kR.sign(), gO = W(A.gapOut), sl = Math.hypot(posG.x - gO.x, posG.z - gO.z) || 1;
      for (let k = 0; k < 2; k++) {
        const R = kR.range(11, 14.5), c = new THREE.Vector3().lerpVectors(gO, posG, k ? kR.range(0.5, 0.54) : kR.range(0.4, 0.5)), down = kR.range(10, 25), sg = k ? -sideI : sideI;
        const D = k ? 1.25 * R + 35 + kR.range(0, 5) : AIR_ISLET + 3.5 + 1.3 * R + kR.range(2, 7), reach = k ? D - 1 : AIR_ISLET + 3.5 + 1.3 * R;
        c.set(c.x + ((posG.z - gO.z) / sl) * sg * D, c.y - down, c.z - ((posG.x - gO.x) / sl) * sg * D);
        const g = gap(c.x, c.y, c.z);                           // the lane bends on: measure against all of it, and stand off if it comes nearer
        if (g.d < reach) { const q = reach / Math.max(g.d, 1); c.set(g.x + (c.x - g.x) * q, g.y + (c.y - g.y) * q, g.z + (c.z - g.z) * q); }
        const rec = await addIsland(specOf(R, { pos: c, NT: 40, nTop: 5, NU: 9 }, kR), { bob: true, bobRng: kR, trees: 5, curtains: 3, rich: k === 0 });
        rec.islet = true; rec.group.name = 'islet-' + k; islets.push(rec);
      }
    }
    // the islands' shadows lie on the cloud sea (the Crown's, then the largest of the others)
    {
      const hl = Math.hypot(sunDir.x, sunDir.z) || 1, sx = sunDir.x / hl, sz = sunDir.z / hl, cot = hl / Math.max(sunDir.y, 0.15), kS = clamp(sunDir.y * 1.7, 0.45, 1);
      deck.uniforms.uShDir.value.set(sx, sz, 1 / (1 + 0.5 * cot));
      const cast = [{ x: 0, y: HY - 60, z: 0, R: 215, k: 0.85 }];
      for (const r of islands.filter((q) => !q.islet).sort((a, b) => b.R - a.R).slice(0, N_SHADOW - 1)) cast.push({ x: r.base.x, y: r.base.y - r.R * 0.5, z: r.base.z, R: r.R * 1.1, k: 0.7 });
      cast.forEach((c, i) => { const d = (c.y - DECK_Y) * cot; deck.shadows[i].set(c.x - sx * d, c.z - sz * d, c.R, c.k * kS); });
    }
    await pause();

    // ---------- weather: cumulus towers standing in the cloud sea among the islands (a crowd of them in the pearl look) ----------
    {
      const tR = rng.fork('towers'), nTow = tR.int(LK.towers[0], LK.towers[1]), at = [];
      // one always stands behind the wooded island, on the bearing of the climb out of the falls (u 0.58-0.64)
      at.push([-125 + tR.range(-30, 30), 10, 800 + tR.range(-40, 60), 430]);
      for (let tries = 0; tries < 500 && at.length < nTow; tries++) {
        if (tries % 6 === 5) await pause(0.15);
        const w = tR.range(LK.tSize[0], LK.tSize[1]), a = tR.range(0, TAU), d = pearl ? tR.range(330, 1050) : tR.range(480, 1500), x = -40 + Math.sin(a) * d, z = -120 + Math.cos(a) * d;
        if (path.nearestXZ(x, z).dist < w * 1.3 + 60 || Math.hypot(x, z) < 250 + w * 1.3 || sightDist(x, z) < w * 1.1 + 60 || Math.hypot(x - e0.x, z - e0.z) < 380 + w) continue;   // a cloud's puffs reach about 1.3 widths from its centre
        if (z < -150 && Math.abs(x) < -0.55 * z + w) continue;                    // calm sky behind the spire as seen across the lake: the portal sits against blue
        if (at.some((q) => Math.hypot(q[0] - x, q[2] - z) < (q[3] + w) * 0.75)) continue;
        at.push([x, SEA_Y + 4 + tR.range(-14, 22), z, w]);
      }
      const towerNoise = await cloudNoise(makeRng(hashSeed(ctx.seed + ':air-noise')), pause);       // its own generator: no draw taken from the world's
      owned.push(towerNoise);
      const towers = makeCloudField({ rng: tR.fork('field'), mode: 'cumulus', sky, at, noiseTexture: towerNoise, height: tR.range(LK.tH[0], LK.tH[1]), wind: [1.2, 0, 0.5], bottomColor: LK.cBot, hazeColor: fogColor });
      // seen from the shade side a tower must stay a pale cloud, not a dark smudge on the bright sea: lift its shade, base and floor
      // (uniform values only; the sea keeps the deeper shade for its troughs)
      if (towers.uniforms && towers.uniforms.uShade) {
        towers.uniforms.uShade.value.copy(col(LK.cShade)).lerp(col(LK.cLit), 0.6);
        towers.uniforms.uBottom.value.copy(col(LK.cBot)).lerp(col(LK.cLit), 0.3);
        towers.uniforms.uLight.value.x += 0.14;
        if (rosy && towers.uniforms.uSunColor) { const sc = towers.uniforms.uSunColor.value, l = (sc.r + sc.g + sc.b) / 3; sc.lerp(tmpC.setRGB(l, l, l), 0.55); }   // white-headed, lilac-bellied: never beige
      }
      scene.add(towers.object); updaters.push(towers);
    }
    await rest();

    // ---------- water on the small islands: a spring pond that spills off the pond island, long free falls off E and G ----------
    const WL = Water.waterLight(sky);
    const topWorld = (rec) => { const isl = rec.isl, p = rec.base; return (x, z) => { const lx = x - p.x, lz = z - p.z; return Math.hypot(lx, lz) < isl.Rth(Math.atan2(lx, lz)) * 0.98 ? p.y + isl.topY(lx, lz) : -1e4; }; };
    const topA = topWorld(isA), topC = topWorld(isC);
    const pondY = posC.y + pond.level;
    const lake = Water.makeLake({ rng: rng.fork('pond'), light: WL, level: pondY, center: [posC.x + pond.x, posC.z + pond.z], radius: pond.r + 3, segments: 22, band: false,
      depthAt: (x, z) => { const h = topC(x, z); return h < -1e3 ? -1 : pondY - h; }, deep: '#0f6f88', shallow: '#7fe0d0', shoreFoam: 0.6, foamWidth: 1.2, ripple: 1.3 });
    scene.add(lake.object); updaters.push(lake);
    await rest();
    let nFall = 0;
    const fallOff = (rec, ox, oz, y, width, o = {}) => {       // a fall leaving the rim of an island in direction (ox, oz): all the way down into the cloud sea unless o.height gives a shorter drop
      const isl = rec.isl, p = rec.base, r = isl.Rth(Math.atan2(ox, oz)) * 0.985;
      const wf = Water.makeWaterfall({ rng: rng.fork('fall' + (nFall++)), light: WL, top: [p.x + ox * r, y, p.z + oz * r], height: y - SEA_Y - 6, width, dir: [ox, oz], launch: 3.2,
        rainbow: 0, pool: false, mistCount: 70, mistOpacity: 0.3, lipLength: 4, tint: '#2a9aa0', ...o });
      scene.add(wf.object); updaters.push(wf);
      return wf;
    };
    fallOff(isC, dC.x, dC.z, pondY - 0.15, 6.5);
    await rest();
    { const d = new THREE.Vector3(-fA.l.x * 0.8 - fA.f.x * 0.6, 0, -fA.l.z * 0.8 - fA.f.z * 0.6).normalize(); fallOff(isE, d.x, d.z, posE.y + 0.5, 9, { lipLength: 7 }); }
    await rest();
    { const q = pol(215, -60, 0), d = new THREE.Vector3(q.x - posG.x, 0, q.z - posG.z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5); fallOff(isG, d.x, d.z, posG.y + 0.5, 9, { lipLength: 6 }); }
    await rest();
    // thin falls off the three largest bobbing islands: they ride the island's bob (see update)
    for (const rec of islands.filter((q) => q.bob && !q.islet).sort((a, b) => b.R - a.R).slice(0, 3)) {
      const a = iRng.range(0, TAU), wf = fallOff(rec, Math.sin(a), Math.cos(a), rec.base.y + 0.5, iRng.range(3.5, 5), { mistCount: 30, lipLength: 3, layers: 2, rows: 22, height: Math.min(rec.base.y + 0.5 - SEA_Y - 6, 3 * rec.R) });       // (far and thin: two sheets, fewer rows; so thin a fall breaks into spray after a drop of three times its island's radius; under an island that floats lower than that it runs on to the cloud sea as live's does, about one fall in sixty)
      rec.fall = wf.object; rec.fallY = wf.object.position.y;      // the kit seats a fall's object at its top: keep that height, the bob is added to it
      await rest();
    }

    // ---------- the vine bridge from the shelf island to its neighbour, hung with pennant leaves ----------
    {
      const bR = rng.fork('bridge'), d0 = new THREE.Vector3(posD.x - posB.x, 0, posD.z - posB.z).normalize();
      const rB = isB.isl.Rth(Math.atan2(d0.x, d0.z)) * 0.88;
      const a = new THREE.Vector3(posB.x + d0.x * rB, posB.y + isB.isl.topY(d0.x * rB, d0.z * rB) + 0.4, posB.z + d0.z * rB);
      const dB = new THREE.Vector3(posD.x - a.x, 0, posD.z - a.z).normalize(), rD = isD.isl.Rth(Math.atan2(-dB.x, -dB.z)) * 0.88;
      const b = new THREE.Vector3(posD.x - dB.x * rD, posD.y + isD.isl.topY(-dB.x * rD, -dB.z * rD) + 0.4, posD.z - dB.z * rD);
      const span = a.distanceTo(b), sx = dB.z, sz = -dB.x, swayMid = 0.7, sag = span * 0.12;
      const cDark = col('#3b2a4c'), cVine = col(PALETTE[4]).lerp(cCream, 0.15).multiplyScalar(0.8), flags = [PALETTE[3], PALETTE[6], PALETTE[2], PALETTE[4], '#ff6f9a'].map(col);
      kit.beginFlora();
      for (let v = 0; v < 4; v++) {
        await pause(2);
        const off = (v - 1.5) * 1.3, rail = v === 0 || v === 3 ? 1 : 0, ph = bR.range(0, TAU);
        const at = (s) => { const k = 4 * s * (1 - s); return [lerp(a.x, b.x, s) + sx * off * (1 + 0.5 * rail * k), lerp(a.y, b.y, s) - sag * k * (1 - 0.3 * rail) + rail * 1.5 + 0.25 * Math.sin(s * 23 + v), lerp(a.z, b.z, s) + sz * off * (1 + 0.5 * rail * k)]; };
        for (const half of [0, 1]) {
          const pts = [], rad = [];
          for (let j = 0; j <= 9; j++) { const t = j / 9; pts.push(at(half ? 1 - t * 0.5 : t * 0.5)); rad.push(lerp(0.62, 0.36, t) * (rail ? 0.6 : 1)); }
          kit.tube(pts, rad, 5, cDark, cVine, 0, swayMid, 1.3);
        }
        if (rail) for (let n = 1; n < 15; n++) {             // pennants hanging from the two rail vines
          const s = n / 15 + bR.range(-0.015, 0.015), p0 = at(s), k = 4 * s * (1 - s), sw = swayMid * k * k, len = bR.range(2.2, 3.6), c = bR.pick(flags), pts = [], wid = [];
          for (let j = 0; j <= 4; j++) { const t = j / 4; pts.push([p0[0], p0[1] - 0.2 - len * t, p0[2]]); wid.push(0.55 * (1 - 0.75 * t * t) + 0.05); }
          kit.ribbon(pts, wid, dB.x, dB.z, c, c, sw, sw + 1.1 + len * 0.25, 1.3);
        } else for (let n = 0; n < 7; n++) {                 // loose tendrils under the deck vines
          const s = bR.range(0.08, 0.92), p0 = at(s), len = bR.range(4, 11);
          kit.addRoot(p0[0], p0[1] - 1, p0[2], len, bR, bR.range(0.2, 0.9), 0.7, bR.chance(0.5) ? 0.4 : 0);
        }
      }
      scene.add(new THREE.Mesh(await kit.endFlora(pause), floraMat));
    }
    await pause();

    // ---------- meadows: grass and yellow flowers on the two overflown island tops and on the Crown's rim lane ----------
    // (each tuft takes the turf's own colour at its foot, live's line: a blade tinted with the drift's flower colour was lost against the painted drift and the meadow read as a smear)
    const turfAt = (rec) => { const S = rec.isl.spec, p = rec.base; return (x, z) => { kit.turfTint(x - p.x + S.o[5] * 9, z - p.z - S.o[4] * 7, tmpC); return [tmpC.r, tmpC.g, tmpC.b]; }; };
    const wind = flora.makeWind({ direction: [0.85, 0.35], strength: 1.15 });
    const grassOpts = { wind, width: [0.8, 1.4], height: [0.8, 1.5], flowers: clamp(0.09 * DENS, 0.05, 0.13), flowerColors: [PALETTE[6], '#ffe37a', PALETTE[6], PALETTE[3], PALETTE[2]], fade: [85, 125], tint: 0.16 };
    const tufts = (n) => Math.round(n * DET * (0.85 + 0.15 * DENS));
    await flora.prepareLeafTexture({}, ctx.yield);
    const gA = await flora.makeGrassAsync({ rng: rng.fork('grassA'), bounds: [posA.x - 58, posA.z - 58, posA.x + 58, posA.z + 58], count: tufts(4000), heightAt: topA, yRange: [posA.y - 2, posA.y + 30], groundColor: turfAt(isA), ...grassOpts }, ctx.yield);
    scene.add(gA.object); updaters.push(gA);
    await rest();
    const gC = await flora.makeGrassAsync({ rng: rng.fork('grassC'), bounds: [posC.x - 50, posC.z - 50, posC.x + 50, posC.z + 50], count: tufts(2700), heightAt: topC, yRange: [pondY + 0.25, posC.y + 30], groundColor: turfAt(isC), material: gA.material, ...grassOpts }, ctx.yield);
    scene.add(gC.object); updaters.push(gC);
    await rest();
    const gR = await flora.makeGrassAsync({ rng: rng.fork('grassR'), bounds: [-90, 135, 90, 209], count: tufts(3500), heightAt: (x, z) => HY + kit.topHeight(x, z), yRange: [HY + 0.9, HY + 30],
      groundColor: (x, z) => { kit.turfTint(x, z, tmpC); return [tmpC.r, tmpC.g, tmpC.b]; }, material: gA.material, ...grassOpts, width: [0.9, 1.6], height: [1.1, 2.2] }, ctx.yield);
    scene.add(gR.object); updaters.push(gR);
    await rest();
    // the rim crest is where the portal is first seen close: trees either side of the lane frame the spire, and vines trail over the
    // lip of the Crown's cliff all the way round (thickest by the lane), so the rim never shows as a bare slab
    // (all one mesh of some 16,000 triangles, drawn all the way: the roots on the lip are there from the first view of the Crown)
    {
      const cR = rng.fork('crest'), placed = [];
      kit.beginFlora();
      for (let tries = 0; tries < 200 && placed.length < 8; tries++) {
        const sgn = placed.length % 2 ? 1 : -1, x = sgn * cR.range(19, 42), z = cR.range(158, 196), h = kit.topHeight(x, z), ht = cR.range(9, 13);
        if (h < 1.6 || kit.topHeight(x * 0.97, z * 0.97) < 1.6 || kit.topHeight(x + 5, z) < 1.2 || kit.topHeight(x - 5, z) < 1.2) continue;
        if (placed.some((q) => (q[0] - x) ** 2 + (q[1] - z) ** 2 < 60) || nearest(x, HY + h + ht * 0.75, z).d < CLEAR + ht * 0.62) continue;
        placed.push([x, z]);
        kit.addTree(x, HY + h, z, ht, cR.chance(0.6), cR, true);
        await pause(1.0);
      }
      await pause();
      const cTealV = col(PALETTE[4]).multiplyScalar(0.8), cPinkV = col(PALETTE[3]), cTip = col(PALETTE[6]).lerp(col(PALETTE[4]), 0.4);
      for (let n = 0; n < 250; n++) {
        if (n % 5 === 4) await pause(0.25);
        const th = n < 90 ? cR.range(-0.55, 0.55) : cR.range(0, TAU), sx = Math.sin(th), cz = Math.cos(th), top = kit.topHeight(sx * 198.6, cz * 198.6);
        if (top < 1.2 || kit.topHeight(Math.sin(th + 0.02) * 198.6, Math.cos(th + 0.02) * 198.6) < 1.2 || kit.topHeight(Math.sin(th - 0.02) * 198.6, Math.cos(th - 0.02) * 198.6) < 1.2) continue;
        const x = sx * 202.5, z = cz * 202.5, len = cR.range(4, 11);
        if (n < 90) {                                        // by the lane: soft teal vines turning pink at their tips, spilling over the lip
          const L = 3 + (len - 4) * 0.57, ph = cR.range(0, TAU), pts = [], rad = [];
          for (let j = 0; j <= 5; j++) { const t = j / 5, r = 199.2 + 2.6 * Math.sin(Math.min(1, t * 2.2) * Math.PI * 0.5) + 0.3 * Math.sin(t * 7 + ph); pts.push([sx * r, HY + top + 0.25 + 0.5 * Math.sin(Math.min(1, t * 2.5) * Math.PI) - L * t * t, cz * r]); rad.push(lerp(0.24, 0.07, t)); }
          kit.tube(pts, rad, 4, cTealV, tmpC.copy(cTealV).lerp(cPinkV, cR.range(0.5, 1)), 0, L * 0.09, ph);
          continue;
        }
        if (nearest(x, HY + top, z).d < 9.5) continue;
        kit.addRoot(x, HY + top - 1.6, z, len, cR, cR.range(0.15, 0.95));
      }
      await pause();
      // a hanging garden down the face of the cliff by the lane: about sixteen clumps of slender tapering fronds, a few long and
      // most short, each turned its own way, teal with now and then a pink or gold tip, all swaying; warm rock shows between them
      const clumps = [], cGold = col(PALETTE[6]).lerp(col(PALETTE[2]), 0.25), cTealTip = cTealV.clone().lerp(cTip, 0.3);
      for (let c = 0; c < 16; c++) clumps.push(cR.range(-0.5, 0.5) * (0.35 + 0.65 * cR()));
      for (let n = 0; n < 520; n++) {
        if (n % 25 === 24) await pause(0.25);
        const th = clumps[n % 16] + cR.range(-0.02, 0.02), sx = Math.sin(th), cz = Math.cos(th), top = kit.topHeight(sx * 198.6, cz * 198.6);
        const L = 2 + 12 * Math.pow(cR(), 2.6), ph = cR.range(0, TAU), tw = cR.range(-0.8, 0.8), w0 = cR.range(0.1, 0.26), turn = cR.range(-0.9, 0.9);
        if (top < 1.0) continue;
        const pts = [], wid = [], r1 = cR.range(201.7, 203.1), ct = Math.cos(turn), st = Math.sin(turn);
        for (let j = 0; j <= 5; j++) { const t = j / 5, r = lerp(199.6, r1, Math.min(1, t * 3)) + 0.5 * t * Math.sin(t * 5 + ph); pts.push([sx * r + cz * tw * t, HY + top + 0.2 + 0.5 * Math.sin(Math.min(1, t * 3) * Math.PI) - L * t * t * (0.4 + 0.6 * t), cz * r - sx * tw * t]); wid.push(w0 * Math.pow(1 - t, 0.7) + 0.02); }
        kit.ribbon(pts, wid, cz * ct + sx * st, cz * st - sx * ct, tmpC.copy(cTealV).multiplyScalar(cR.range(0.6, 1.05)), n % 6 === 0 ? (n % 12 === 0 ? cPinkV : cGold) : cTealTip, 0.02, L * 0.16, ph);
      }
      await pause();
      // long lantern-tipped vines trail down between the clumps
      for (let n = 0; n < 40; n++) {
        const th = cR.range(-0.5, 0.5), sx = Math.sin(th), cz = Math.cos(th), top = kit.topHeight(sx * 198.6, cz * 198.6), len = cR.range(8, 16);
        if (top < 1.0 || nearest(sx * 202.4, HY + top, cz * 202.4).d < 9.5) continue;
        kit.addRoot(sx * 202.4, HY + top - 1.4, cz * 202.4, len, cR, cR.range(0.15, 0.8), 0.7, 0.35);
      }
      await pause();
      // and fronds of the meadow hanging out over the lip either side of the lane, so its edge is soft
      for (let n = 0; n < 56; n++) {
        const th = cR.range(-0.55, 0.55), sx = Math.sin(th), cz = Math.cos(th), top = kit.topHeight(sx * 198.6, cz * 198.6), L = cR.range(2.2, 4.4), ph = cR.range(0, TAU), tw = cR.range(-0.5, 0.5);
        if (top < 1.0) continue;
        const pts = [], wid = [];
        for (let j = 0; j <= 4; j++) { const t = j / 4, r = 198.4 + L * 0.85 * t; pts.push([sx * r + cz * tw * t, HY + top + 0.3 + L * (0.42 * Math.sin(t * 2.2) - 0.62 * t * t), cz * r - sx * tw * t]); wid.push(0.26 * Math.sin(Math.PI * (0.15 + 0.8 * t)) + 0.03); }
        kit.ribbon(pts, wid, cz, -sx, cTealV, n % 3 ? cTealTip : cPinkV, 0.02, 0.3 + L * 0.12, ph);
      }
      scene.add(new THREE.Mesh(await kit.endFlora(pause), floraMat));
    }
    await pause();

    // ---------- life (flock sizes follow ctx.vary.density and ctx.quality.detail; the rays the brief names keep their number) ----------
    // Every animal that flies a course keeps CLEAR = 11 m of air, and its own spread and wander on top, between itself and the
    // lane line: the courses are laid out with that margin (airRoute) and each member is held to it (keepAir).
    const fauna = [];
    const addFauna = (f, name) => { f.object.name = name; scene.add(f.object); fauna.push(f); return f; };
    const fR = rng.fork('fauna'), many = (a, b) => Math.max(6, Math.round(fR.int(a, b) * DENS * DET));
    // a closed course round the Crown's axis, `r` metres out: its height from the lake is given at a few bearings (degrees, y)
    // and eased between them; one control point to every 30 m; sense +1 flies with the bearing rising (the way the lane goes
    // round the gallery), -1 against it
    const crownLoop = (r, knots, sense, air) => {
      const n = Math.max(12, Math.ceil((TAU * r) / 30)), pts = [], K = knots.length;
      for (let i = 0; i < n; i++) {
        const deg = sense * (i / n) * 360, b = deg - 360 * Math.round(deg / 360);
        let j = 0; while (j < K && knots[j][0] <= b) j++;
        const k0 = knots[(j + K - 1) % K], k1 = knots[j % K], b0 = j === 0 ? k0[0] - 360 : k0[0], b1 = j === K ? k1[0] + 360 : k1[0];
        const t = b1 > b0 ? (b - b0) / (b1 - b0) : 0;
        pts.push(pol(r, deg, lerp(k0[1], k1[1], 0.5 - 0.5 * Math.cos(Math.PI * t))));
      }
      return airRoute(pts, air);
    };
    // the knots of a level ring, tipped: `mid` metres from the lake, `tilt` metres higher on the bearing `high` (degrees) and as
    // much lower opposite it; one knot to every 30 degrees
    const tipped = (mid, tilt, high) => Array.from({ length: 12 }, (_, i) => [30 * i - 180, mid + tilt * Math.cos((30 * i - 180 - high) * D2R)]);
    // a closed course round a point c: radius r, height yAt(bearing in radians), one control point to every 20 m or so
    const ringRound = (c, r, yAt, sense, air) => {
      const n = Math.max(10, Math.ceil((TAU * r) / 20)), pts = [];
      for (let i = 0; i < n; i++) { const th = sense * (i / n) * TAU; pts.push(new THREE.Vector3(c.x + Math.sin(th) * r, yAt(th), c.z + Math.cos(th) * r)); }
      return airRoute(pts, air);
    };
    // THE RIBBON RAYS (the brief's gliders, 12 m from tip to tip): they slide in ahead on the right out of the gateway and keep
    // station into the gallery (the troop, the live world's own formation); it closes up wherever a ray's own track would come
    // inside the air kept round the lane (keepAir).
    const rayLook = { top: '#5d4390', belly: '#fff0e2', patch: '#ff8fb0', edge: '#ffd23f', caustics: 0, light: faunaLight, rim: 0.8 };
    const nRays = fR.int(5, 8);
    keepAir(addFauna(F.makeMantaRay({ rng: fR.fork('rays'), count: nRays, span: 6, spread: [8, 5, 9], bob: 1.2, ...rayLook,
      along: { path, side: fR.range(19, 23), up: fR.range(-1, 3), lead: 52, from: 0.215, to: 0.63, drift: 5 } }), 'troop'), 1.2);
    await rest();
    // THE CROWN'S OWN RAYS: three more of the 12 m rays live under the Crown's rim, each on a closed course of its own round the
    // island's axis, inside the ring of falls (which hang 214 m out at this depth), flown on the world's clock, a third of a lap
    // apart, the way the lane goes round the gallery. They glide: one lap in 125 to 150 s, about 8 m a second. A course is a level
    // ring round the axis, tipped (see tipped): its radius drawn in 164 to 187 m, its tilt up to RAY_TILT = 14 m toward a drawn
    // bearing, its middle drawn in a third of the Crown's free air (which ray has which third is drawn; the trim then lifts the
    // low courses, so as flown the three lie nearer one another than as drawn). That air has a roof and a
    // floor: RAY_ROOF = 50 m below the lake keeps a course clear of the hanging growth (which ends 31 to 48 m down at these
    // radii), and the leviathan's ring (THE RARE VISIT below: its middle
    // 146 to 155 m below the lake, its tilt up to 10 m) never rises higher than 136 m below it, so with RAY_FLOOR = 120 m a
    // ray keeps 16 m of air over the leviathan's back; a tipped ring fits between them with its middle 64 to 106 m down.
    // No point of a course is nearer the lane line than RAY_AIR = 31 m (crownLoop trims it to that), so a ray's middle is never
    // nearer the lens than that and 25 m of air lie between a wing tip and the lane. A course the trim cannot bring to that, or
    // bends out to the falls (past 196 m), up to the roots or down under the floor, is drawn again, up to 120 times (the lane itself
    // comes in and goes out through the lower air, so few low courses fit); a ray for which none fits does not fly on that seed.
    // Starts, radii, heights and tilts are drawn from a stream of their own.
    {
      const RAY_AIR = 31, RAY_ROOF = 50, RAY_FLOOR = 120, RAY_TILT = 14, cr = makeRng(hashSeed(ctx.seed + ':crown-rays')), lap = cr.range(125, 150), start = cr(), deep = cr.int(0, 2);
      for (let k = 0; k < 3; k++) {
        let c = null;
        for (let n = 0; n < 120 && !c; n++) { const t = crownLoop(cr.range(164, 187), tipped(lerp(RAY_TILT - RAY_FLOOR, -RAY_ROOF - RAY_TILT, ((k + deep) % 3 + cr()) / 3), cr.range(0, RAY_TILT), cr.range(-180, 180)), 1, RAY_AIR);
          if (t.air >= RAY_AIR && t.pts.every((p) => Math.hypot(p.x, p.z) < 196 && p.y < HY - RAY_ROOF && p.y > HY - RAY_FLOOR)) c = t; await pause(2); }
        if (!c) continue;
        addFauna(F.makeMantaRay({ rng: makeRng(hashSeed(ctx.seed + ':crown-ray-' + k)), count: 1, span: 6, speed: c.length / lap, bob: 0.6, spread: [0, 0, 0], ...rayLook,
          route: c.pts, closed: true, start: (start + k / 3 + cr.range(-0.04, 0.04) + 1) % 1 }), 'crown-ray-' + k);
        await rest();
      }
    }
    // a second, smaller escort joins dead ahead on the climb out of the falls and leads over the rim to the spire
    keepAir(addFauna(F.makeMantaRay({ rng: fR.fork('rays2'), count: fR.int(3, 5), span: 5.4, spread: [7, 4, 10], bob: 1.2, ...rayLook,
      along: { path, side: -18, up: 2, lead: 64, from: 0.585, to: 1.0, drift: 4 } }), 'escort'), 1.2);
    await rest();
    // a few more wheel round the spire over the lake
    keepAir(addFauna(F.makeMantaRay({ rng: fR.fork('lakeRays'), count: fR.int(2, 4), span: 4.6, speed: 10, spread: [14, 6, 22], ...rayLook,
      center: [0, HY + 40, -6], radius: fR.range(80, 105), height: 10, direction: fR.sign() }), 'lake-rays'), 0.3);
    await rest();
    // SMALL BRIGHT BIRDS wheel round the meadow island on the world's clock: a level ring 68 to 78 m from its middle (outside its
    // rim), 16 to 20 m above it, tipped up to 5 m toward a drawn bearing. Where the ring would cut the flock's air round the lane
    // it rides over it (a point of it is raised until it keeps that many metres from the lane line). A stream of its own.
    const birdLook = { body: '#ff8fb0', belly: '#fff3e0', wingC: '#ffd23f', tip: '#2fb89a', head: '#ff7fa6', tailC: '#ffd23f', trail: '#ffb04a', light: faunaLight };
    const BIRD_KEEP = 6, wanderOf = (w) => Math.hypot(1.5 * w[0], w[1], w[2]), PARROT_WANDER = [2, 1.2, 2, 0.6];
    // LIVE'S TWO CROSSINGS, its own lines (keyed to u as on the site; inherited, unchanged): small bright birds crossing the approach
    // between the meadow island and the shelf island
    addFauna(F.makeFlock({ rng: fR.fork('cross'), species: 'parrots', count: many(18, 36), size: 2.3, ...birdLook,
      cross: { path, u: 0.115, window: 0.12, lead: 60, span: 380, angle: fR.range(50, 75), side: fR.sign(), height: fR.range(6, 14) } }), 'parrots-cross');
    await rest();
    // a second bright flock streams across the climbing turn just after the camera leaves the ring of falls
    addFauna(F.makeFlock({ rng: fR.fork('cross2'), species: 'parrots', count: many(16, 30), size: 2.4, ...birdLook,
      cross: { path, u: 0.6, window: 0.12, lead: 52, span: 320, angle: fR.range(40, 70), side: fR.sign(), height: fR.range(1, 8) } }), 'parrots-cross2');
    await rest();
    {
      const pR = makeRng(hashSeed(ctx.seed + ':parrots-meadow')), n1 = Math.max(6, Math.round(pR.int(18, 36) * DENS * DET)), rr = isA.R * 1.15 + 10 + pR.range(0, 10), y1 = posA.y + 13 + pR.range(3, 7), tilt = pR.range(0, 5), tb = pR.range(0, TAU), air = CLEAR + wanderOf(PARROT_WANDER) + BIRD_KEEP;
      const c = ringRound(posA, rr, (th) => { let y = y1 + tilt * Math.cos(th - tb); while (gap(posA.x + Math.sin(th) * rr, y, posA.z + Math.cos(th) * rr).d < air + 3) y += 2; return y; }, pR.sign(), air);
      keepAir(addFauna(F.makeFlock({ rng: pR, species: 'parrots', count: n1, size: 2.3, wander: PARROT_WANDER, ...birdLook, route: c.pts, closed: true }), 'parrots-meadow'), wanderOf(PARROT_WANDER));
    }
    await rest();
    // a second bright flock wheels round the further islet of the climb, 12 m outside its rim at the height of its trees, tipped
    // by a drawn 0 to 5 m toward a drawn bearing (the islet stands off the lane far enough for it: see the islets). A stream of its own.
    {
      const pR = makeRng(hashSeed(ctx.seed + ':parrots-islet')), n2 = Math.max(6, Math.round(pR.int(16, 30) * DENS * DET)), it = islets[1], y2 = it.base.y + 3 + pR.range(1, 8), tb = pR.range(0, TAU), tl = pR.range(0, 5);
      const c = ringRound(it.base, it.R * 1.25 + 12, (th) => y2 + tl * Math.cos(th - tb), pR.sign(), CLEAR + wanderOf(PARROT_WANDER) + BIRD_KEEP);
      keepAir(addFauna(F.makeFlock({ rng: pR, species: 'parrots', count: n2, size: 2.4, wander: PARROT_WANDER, ...birdLook, route: c.pts, closed: true }), 'parrots-islet'), wanderOf(PARROT_WANDER));
    }
    await rest();
    // white swifts hunting under the rim between the lane and the falls, round the tips of the lantern roots (176 m out, 40 m
    // below the lake: 27 m and more above the lane), and gulls soaring over the lake
    {
      const SWIFT_WANDER = [4, 2.5, 4, 0.7], c = crownLoop(176, [[0, -40]], -1, CLEAR + wanderOf(SWIFT_WANDER) + BIRD_KEEP);
      keepAir(addFauna(F.makeFlock({ rng: fR.fork('gallery'), species: 'swifts', count: many(26, 48), size: 2.8, spread: [13, 8, 34], wander: SWIFT_WANDER, body: '#f4f6ff', belly: '#ffffff', wingC: '#dfe8ff', tip: '#ff8fb0', light: faunaLight,
        route: c.pts, closed: true }), 'swifts-gallery'), wanderOf(SWIFT_WANDER));
    }
    await rest();
    const GULL_WANDER = [5, 2.5, 4, 0.35];
    keepAir(addFauna(F.makeFlock({ rng: fR.fork('gulls'), species: 'gulls', count: many(14, 30), size: 2.2, light: faunaLight, center: [0, HY + 52, 0], radius: fR.range(60, 85), height: 9 }), 'gulls-lake'), wanderOf(GULL_WANDER));
    await rest();
    // and a loose ring of white birds circling the Crown in front of the falls, 256 m out and 182 m below the lake: under the lane
    // where the lane swoops in low toward the eye, with the same air and more
    {
      const c = crownLoop(256, [[0, -182]], 1, CLEAR + wanderOf(GULL_WANDER) + 8);
      keepAir(addFauna(F.makeFlock({ rng: fR.fork('ring'), species: 'gulls', count: many(18, 32), size: 3, spread: [14, 10, 46], wander: GULL_WANDER, light: faunaLight, route: c.pts, closed: true }), 'gulls-ring'), wanderOf(GULL_WANDER));
    }
    await rest();
    // a higher wing of them wheels past the rim a little below its lip, 238 m out
    {
      const c = crownLoop(238, [[0, -10]], -1, CLEAR + wanderOf(GULL_WANDER) + BIRD_KEEP);
      keepAir(addFauna(F.makeFlock({ rng: fR.fork('ring2'), species: 'gulls', count: many(16, 28), size: 2.6, spread: [9, 7, 38], wander: GULL_WANDER, light: faunaLight, route: c.pts, closed: true }), 'gulls-rim'), wanderOf(GULL_WANDER));
    }
    await rest();
    // swifts hawking round the shelf island's keel among its roots, a storey below the lane (30 m from the keel's axis, 57 m under
    // the island's top; the lane passes 36 m from that axis and 24 m higher)
    {
      const SHELF_WANDER = [3, 2, 3, 0.9], rs = fR.fork('shelf'), ns = many(18, 26), c = ringRound(posB, 30, () => posB.y - 57, fR.sign(), CLEAR + wanderOf(SHELF_WANDER) + 4);
      keepAir(addFauna(F.makeFlock({ rng: rs, species: 'swifts', count: ns, size: 2.4, spread: [8, 5, 26], wander: SHELF_WANDER, body: '#f4f6ff', belly: '#ffffff', wingC: '#dfe8ff', tip: '#ffd23f', light: faunaLight,
        route: c.pts, closed: true }), 'swifts-shelf'), wanderOf(SHELF_WANDER));
    }
    await rest();
    // BIG SLOW BUTTERFLIES OVER THE FIRST MEADOW, KEPT OFF THE LANE BY PLACE. The kit deals them over the meadow (a disc of 36 m round
    // its middle, FLUTTER_LOW to 6 m over the ground flutterTop gives) with no regard for the lane, which passes through that air
    // early in the flight. Each roams a box about its anchor (the kit's reach.roam: half-extents on the world's axes, 2.45 m level and
    // 0.77 m up and down) and has a body (wings anywhere, by its own size: 0.74 to 1.38 m, worked below).
    // THE LAW, a build step of its own straight after the deal: a member whose box comes nearer the lane line than FLUTTER_AIR +
    // FLUTTER_SPARE and its own body has its ANCHOR moved by what it alone lacks, straight away from the lane's nearest point, and
    // is then held against the whole line again, until it is clear (on seeds 1 to 200 the lane passes over every one that is short:
    // it is moved down, or down and aside, by 1.84 m at most, in one move; no more than three in a swarm of 17 to 55, 110 of 6766
    // in all). A move that would take it under its dealt least height (FLUTTER_LOW over the ground at its new place) is not made: it
    // goes level instead, square off the lane, by the least such move that clears it, and rides up with the ground (the lane is
    // 6.0 m and more over that ground, a member's need under it at most 5.7 m: no seed of the 200 comes to this). FLUTTER_PASSES
    // is a guard, not a rule. The others stay where the deal put them. No draw is taken, the count stays, nothing is made smaller,
    // faded or hidden, and nothing is read but the lane line and the ground.
    // FLUTTER_AIR is the owner's 2 m of clear air from the lens's line to a body at its farthest. FLUTTER_SPARE covers what the
    // measure leaves out: the lane is measured as gap() measures it, a chain of straight pieces, and the lens's true curve stands
    // up to 0.034 m off that chain (0.009 m over the meadow); a place is kept in 32-bit floats (0.00004 m here). The lens's run-in
    // before the lane's first point is over 80 m from the nearest butterfly: nothing is kept for it.
    const FLUTTER_LOW = 1.5, FLUTTER_AIR = 2, FLUTTER_SPARE = 0.05, FLUTTER_PASSES = 40, FLUTTER_HALVINGS = 40, FLUTTER_NONE = 1e-6, FLUTTER_WING = 0.5;
    const flutterTop = (x, z) => Math.max(posA.y, topA(x, z));
    const flutter = addFauna(F.makeButterflies({ rng: fR.fork('flutter'), count: many(24, 44), size: 8, light: faunaLight, center: [posA.x, posA.y + 3, posA.z], radius: 36,
      heightAt: flutterTop, altitude: [FLUTTER_LOW, 6] }), 'butterflies');
    await rest();
    {
      const at = flutter.anchors, size = flutter.geometry.attributes.iB.array, [rx, ry, rz] = flutter.reach.roam, corner = Math.hypot(rx, ry, rz);
      // a member's body, wings anywhere, for a size of 1: the kit swings a wing vertex its arm (aAnim.x) about its root (x less the
      // arm, on its side: aAnim.y) in the plane across the body, so it stands no further out in that plane than root and arm, and
      // keeps its place along the body: 0.1325 m. (The kit's own reach.body adds root and arm in all three: 1.39 times this for these
      // wings, and the largest member's for all; a need that much too wide would move a member further than it lacks.)
      const P = flutter.geometry.attributes.position, An = flutter.geometry.attributes.aAnim;
      let wing = 0, piece = 0;                                // that body; the longest straight piece of the lane
      for (let v = 0; v < P.count; v++) { const arm = Math.abs(An.getY(v)) > FLUTTER_WING ? An.getX(v) : 0; wing = Math.max(wing, Math.hypot(Math.hypot(P.getX(v) - An.getY(v) * arm, P.getY(v)) + arm, P.getZ(v))); }
      wing *= flutter.uniforms.uScale.value;                  // (the kit's scale for the whole swarm: 1 as made)
      for (let j = 0; j < NS; j++) piece = Math.max(piece, Math.hypot(ps[j * 3 + 3] - ps[j * 3], ps[j * 3 + 4] - ps[j * 3 + 1], ps[j * 3 + 5] - ps[j * 3 + 2]));
      const out = (w, r) => (w > r ? w - r : w < -r ? w + r : 0);       // how far a coordinate stands outside the box (0 inside)
      // boxGap(): the lane against the whole roam box about (x, y, z). gap() measures to a point; this measures the same chain of
      // straight pieces to the box. Along one piece the distance to a box falls and then rises, never twice, so its least is where
      // its slope turns: found by halving (FLUTTER_HALVINGS times: finer than a float). Given back: the least distance d, the lane's
      // nearest point as seen from the anchor (wx, wy, wz) and the level run of the piece it lies on (bx, bz); d is Infinity when no
      // piece has a point within `reach` of the box.
      const hit = { d: 0, wx: 0, wy: 0, wz: 0, bx: 0, bz: 0 };
      const boxGap = (x, y, z, reach) => {
        const far = (reach + corner + piece) ** 2;
        hit.d = Infinity;
        for (let j = 0; j < NS; j++) {
          const a = j * 3, px = ps[a] - x, py = ps[a + 1] - y, pz = ps[a + 2] - z;
          if (px * px + py * py + pz * pz > far) continue;
          const bx = ps[a + 3] - ps[a], by = ps[a + 4] - ps[a + 1], bz = ps[a + 5] - ps[a + 2];
          let lo = 0, hi = 1;
          for (let k = 0; k < FLUTTER_HALVINGS; k++) { const t = (lo + hi) / 2; if (out(px + bx * t, rx) * bx + out(py + by * t, ry) * by + out(pz + bz * t, rz) * bz < 0) lo = t; else hi = t; }
          const wx = px + bx * lo, wy = py + by * lo, wz = pz + bz * lo, d = Math.hypot(out(wx, rx), out(wy, ry), out(wz, rz));
          if (d < hit.d) { hit.d = d; hit.wx = wx; hit.wy = wy; hit.wz = wz; hit.bx = bx; hit.bz = bz; }
        }
        return hit;
      };
      let any = false;
      for (let i = 0; i < flutter.count; i++) {
        const need = FLUTTER_AIR + FLUTTER_SPARE + wing * size[i * 4];
        let x = at[i * 3], y = at[i * 3 + 1], z = at[i * 3 + 2], pass = 0;
        if (gap(x, y, z).d >= need + corner) continue;         // the whole line is further off than its need and its box's far corner: most are passed here
        for (; pass < FLUTTER_PASSES; pass++) {
          const h = boxGap(x, y, z, need), lack = need - h.d;
          if (lack <= FLUTTER_NONE) break;
          // straight away from the lane's nearest point: from that point to the point of the box nearest it (a lane that runs
          // through the box: from the lane's nearest point to the anchor, as gap() gives it; an anchor on the lane itself: up)
          let nx = -out(h.wx, rx), ny = -out(h.wy, ry), nz = -out(h.wz, rz), nl = h.d;
          if (nl <= FLUTTER_NONE) { const g = gap(x, y, z); nx = x - g.x; ny = y - g.y; nz = z - g.z; nl = g.d; if (nl <= FLUTTER_NONE) { nx = 0; ny = 1; nz = 0; nl = 1; } }
          const k = lack / nl, tx = x + nx * k, ty = y + ny * k, tz = z + nz * k;
          if (ty >= flutterTop(tx, tz) + FLUTTER_LOW) { x = tx; y = ty; z = tz; continue; }
          // under its least height there: level instead, square off the lane's piece to the anchor's side, by the least move that
          // clears the lane (found by halving between no move and one that is sure to clear a straight lane: the box's own width
          // on that bearing and its need), then up with the ground
          const ml = Math.hypot(h.bx, h.bz) || 1;
          let mx = h.bz / ml, mz = -h.bx / ml, side = -(h.wx * mx + h.wz * mz), lo = 0;
          if (side < 0) { mx = -mx; mz = -mz; side = -side; }
          let hi = Math.max(lack, Math.abs(mx) * rx + Math.abs(mz) * rz - side + need);
          for (let q = 0; q < FLUTTER_HALVINGS; q++) { const t = (lo + hi) / 2; if (boxGap(x + mx * t, y, z + mz * t, need).d < need) lo = t; else hi = t; }
          x += mx * hi; z += mz * hi; y = Math.max(y, flutterTop(x, z) + FLUTTER_LOW);
        }
        if (pass) { at[i * 3] = x; at[i * 3 + 1] = y; at[i * 3 + 2] = z; any = true; }
      }
      if (any) flutter.setAnchors();                           // the kit's door: the instance buffer and the bounds follow, no draw
    }
    await rest();
    // THE RARE VISIT (ctx.vary.rare, about one flight in eight): a leviathan ribbon ray, 60 m from tip to tip (wider than two of
    // the Crown's falls), on a slow course of its own round the Crown under the three rays: a level ring, tipped (see tipped), drawn
    // from a stream of its own: 168 to 180 m out, its middle 146 to 155 m below the lake, its tilt up to 10 m toward a drawn bearing
    // (one lap in about two minutes, on the world's clock from a seeded start). Its course keeps CLEAR and its half span and
    // bob on top (43.5 m) from the lane line. Built only when it will fly.
    if (vary.rare) {
      const lv = makeRng(hashSeed(ctx.seed + ':leviathan-course')), c = crownLoop(lv.range(168, 180), tipped(lv.range(-155, -146), lv.range(0, 10), lv.range(-180, 180)), 1, CLEAR + 30 + 2.5);
      addFauna(F.makeMantaRay({ rng: fR.fork('leviathan'), count: 1, span: 30, speed: 9, bob: 2.5, ...rayLook, top: '#4a3684', rim: 1.1, route: c.pts, closed: true }), 'leviathan');
      await rest();
    }
    // petals (or golden pollen) on the wind, all the way
    const motes = fx.makeParticles(fR.chance(0.6)
      ? { rng: fR.fork('petals'), preset: 'petals', count: Math.round(800 * DET), box: [120, 70, 120], size: [0.2, 0.42], near: [4, 9], velocity: [2.6, -0.5, 1.0] }
      : { rng: fR.fork('pollen'), preset: 'pollen', count: Math.round(700 * DET), box: [90, 54, 90], size: [0.12, 0.3], near: [3, 7], velocity: [2.2, 0.3, 0.8], intensity: 1.0 });
    scene.add(motes.object); updaters.push(motes);
    await rest();

    // ---------- shafts: sun slanting in between the falls into the gallery, on the side of the ring that faces the sun ----------
    {
      const th = clamp(Math.atan2(sunDir.x, sunDir.z), -140 * D2R, -80 * D2R), el = Math.atan2(sunDir.y, Math.hypot(sunDir.x, sunDir.z));
      const y = Math.min(HY - 14, HY - 70 + 66 * Math.tan(el));          // so the beams cross the camera's line under the rim
      const shafts = fx.makeGodRays({ rng: rng.fork('shafts'), position: [Math.sin(th) * 212, y, Math.cos(th) * 212], direction: [-sunDir.x, -sunDir.y, -sunDir.z], radius: 62, count: 18, length: 210,
        width: [3, 12], color: rosy ? '#ffc08e' : '#ffe6b4', intensity: rosy ? 0.5 : 0.38, falloff: 1.1, far: [300, 520] });
      scene.add(shafts.object); updaters.push(shafts);
    }
    await rest();

    // ---------- gaze ----------
    const _poi = new THREE.Vector3(), portalAt = W(A.portalSeat.position);
    const pois = [
      { at: [-10, HY - 14, -20], from: 0, to: 0.31, weight: 0.55 },                                 // up the rising curve and through the gateway to the Crown's ring of falls
      { at: [A.spout.foot.x, HY + A.spout.foot.y + 34, A.spout.foot.z], from: 0.2, to: 0.375, weight: 0.66 },   // out of the gateway: down the falls to the eye in the cloud sea and the rope rising from it into the keel
      { at: (time, u) => { path.pointAt(u, _poi); const a = Math.atan2(_poi.x, _poi.z) + 0.55; return _poi.set(Math.sin(a) * 208, HY - 60, Math.cos(a) * 208); },
        from: 0.37, to: 0.585, weight: 0.34 },                                                      // the falls streaming past on the right
      { at: [posG.x, posG.y + 6, posG.z], from: 0.5, to: 0.7, weight: 0.55, fade: 0.4 },           // out between the falls: the wooded island held in the middle, the tower behind it
      // then one slow pan to the left (never over ~45 degrees a second) as the turn opens the whole Crown: rim, falls, lake, spire
      { at: [0, HY - 4, 0], from: 0.57, to: 0.86, weight: 0.6, fade: 0.38 },
      { at: portalAt, from: 0.64, to: 0.84, weight: 0.42 },
      { at: portalAt, from: 0.8, to: 0.99, weight: 0.5 },
    ];
    if (sky.prewarm && ctx.renderer) await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: 50,
      // linger down the falls and through the gallery and over the lake
      pace: (u) => { const band = (a, b) => sst(a - 0.03, a + 0.03, u) * (1 - sst(b - 0.03, b + 0.03, u)); return 1 - 0.2 * band(0.2, 0.5) + 0.05 * band(0.57, 0.72) - 0.14 * band(0.84, 0.94); },
      ride: 'none',
      camera: { fov: 62, near: 0.5, far: 5200, lookAhead: 34, sway: 1, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#fff0c8', glow: 1.1, revealDistance: 560 },
      post: {
        exposure: LK.exposure,
        bloom: { strength: 0.3, radius: 0.7, threshold: 0.95 },
        grade: { saturation: LK.sat, contrast: 1.09, tint: LK.tint, shadowTint: rosy ? '#1c1640' : '#141c3c', vignette: 0.26, grain: 0.018, aberration: 0 },
      },
      update(dt, time, camera, u) {
        motes.object.visible = !ctx.through;                 // the petals travel with the camera: not through the previous portal
        for (const x of updaters) x.update(dt, time, camera, u);
        hero.update(dt, time, camera);
        for (const f of fauna) f.update(dt, time, camera, u);
        for (const r of islands) if (r.bob) {
          const b = r.bob;
          r.group.position.y = r.base.y + b.amp * Math.sin(time * b.w + b.ph);
          r.group.rotation.y = b.yaw * Math.sin(time * b.w * 0.6 + b.ph * 1.7);
          if (r.fall) r.fall.position.y = r.fallY + r.group.position.y - r.base.y;
        }
        for (const g of farGroups) g.group.position.y = g.amp * Math.sin(time * g.w + g.ph);
      },
      dispose() { hero.dispose(); for (const t of owned) t.dispose(); },
    };
  },
};
