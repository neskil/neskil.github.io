// THE SLEDGE BETWEEN THE VOLCANOES, from The Left Hand of Darkness by Ursula K. Le Guin: a long blue dusk on a cracked
// glacier that climbs between a white volcano and a black one in eruption. Ash falls like black snow; two small hooded
// people haul one sledge up the pale ramp; we overtake them, climb the icefall and come over the lip onto a clean ice
// plateau under the first stars, where one small tent glows.
//
// MAP OF THIS FILE
//   1. LAYOUT       the map in metres, in the brief's own coordinates: we enter at the origin heading -Z, +X is the fire
//                   side. PATH, the glacier's profile GLACIER, the crevasse field, the lip, the plateau, the camp.
//                   A mirrored visit (the fire on the left) is the whole stage scaled by -1 in x.
//   2. makeLand()   one height function: glacier, walls, crevasses (from a baked depth map), icefall, lip, plateau with
//                   wind-ridges, the two whalebacks at the portal.
//   3. patchLand()  the kit terrain's material, patched once in build: ash tails, crevasse blue from the depth map, the
//                   red light of the fire, wind-ridge relief.
//   4. build(ctx)   seeded look -> land -> sky and lights -> the fire side (src/parts/sledge-between-volcanoes.js) ->
//                   ice (…-ice.js) -> camp (…-camp.js) -> air (ash, snow, haze) -> return.
//   SCRIPT          every pace, fade and gaze window is written in metres along the route from a place where the
//                   route crosses a line across the glacier (the last crevasse row, where the two took up the traces,
//                   the foot of the icefall, the lip, the flat of the plateau, the tent); u is whatever comes out.
//                   night(u) is the cut in time at the lip (stars out, the eruption low, the tent lit); walk(u) is how
//                   far the two have hauled (their steps are tied to the ground they cover); the one tower by the
//                   climb goes over as the flight climbs from the icefall's foot to the tower's own place (a
//                   declared pacing by metres flown; its dust is aged by the flight's own time). Ambient life (plume, flashes, bursts, steam, spindrift,
//                   cloth) runs on the world clock from seeded schedules; every start phase is seeded.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as fx from '../kit/fx.js';
import { makeSeracs, makePuffs, makeSpindrift, makeMoraine } from '../parts/sledge-between-volcanoes-ice.js';
import { makeCamp, CAMP_REACH, TENT_SHADE, DOOR_POOL } from '../parts/sledge-between-volcanoes-camp.js';
import { makeShared, sharedUniforms, forksOf, SBV_NOISE, SBV_LIGHT } from '../parts/sledge-between-volcanoes-common.js';
import { buildHero, makeCone, CRATER, PLUME_SPINE } from '../parts/sledge-between-volcanoes.js';
import { snoutsOf, TONGUE_SOURCES } from '../parts/sledge-between-volcanoes-lava.js';
import { makePlateauCrevasses, makeAshfall, makeRocks, makeStars, makeFarEdge } from '../parts/sledge-between-volcanoes-plateau.js';

const DUR = 48;
// ---------------------------------------------------------------- 1. layout
// The road, typed: up the glacier; a swing toward the fire side (build tests it against the snout of every tongue,
// each snout's own place, and keeps 60 m); back across the track behind the two and up beside them on their left; the
// gully, bending toward one wall and then the other; over the lip and on past the tent's own place (which is found in
// build from the two's line of march, below) on the side the track comes in by; then a long turn to the left round to
// the way out, the last stretch straight south of west. Nothing in the world is placed from this road.
const PATH = [[0, 46, 0], [4, 43.5, -60], [24, 51, -130], [54, 63, -200], [76, 76, -268], [66, 88, -325], [38, 96.5, -368], [15, 103, -405], [7.5, 106.2, -445], [8, 113, -482], [6, 120.5, -505], [7, 134, -530], [-7, 164, -580], [6, 197, -635], [0, 232, -700],
  [-10, 233.5, -730], [-32, 232, -752], [-52, 230.5, -772], [-66, 229.5, -800], [-84, 229, -835], [-118, 228.5, -872], [-170, 228.3, -900], [-228, 228, -895], [-275, 227.8, -870], [-310, 227.6, -850]];
// the glacier's surface on the centre line: [distance up the glacier (-z), height]
const GLACIER = [[-300, 6], [-220, 12], [0, 30], [130, 44], [260, 66], [400, 96], [520, 122], [610, 170], [700, 218], [742, 222.8], [830, 223.4], [1500, 224]];
const HALF = 190;                             // the ice is 380 m wide
const LIP_Z = -700, PLATEAU = 223.4;
const RAMP = [0, 40];                         // the clean snow ramp, x from .. to
const TRACK_X = 14, Z_TWO = -460;      // the two start hauling from this z                           // the sledge track on it
// the way out, and the heading of the road's last stretch
const PORTAL = [-310, -850], PORTAL_DIR = [-0.866, 0.5];
// THE SADDLE AND ITS LEE DRIFT (a rule of the place). The way out stands in the saddle between two whalebacks of ice,
// 8.5 m high, that lie 24 m either side of it; the saddle's own crest is SADDLE_H over the plateau. The one wind blows
// through the saddle within 20 degrees of its axis, and the snow it carries through the hoop is banked in the hoop's
// lee: one drift across the saddle, its crest 34 m down the saddle's axis from the way out, banked up to the level
// of the hoop's own top and no higher (the ring's middle height, its radius and the hoop's own thickness, each
// taken from the thing itself: the ring's middle hangs at the height of the last key of the road as this build
// works it, and makeLand() reads that same key, the one the hoop hangs from). It is placed by the saddle's own place
// and axis alone.
const SADDLE_H = 1.8, RING_R = 7, HOOP_R = 0.13;      // the saddle's crest over the plateau; the ring's radius; the hoop's thickness (its tube's radius)
// THE TWO'S LINE OF MARCH on the plateau (their own line, a rule of the place; nothing of it is read from the road):
// from the gully's head they came straight on up over the cornice to its back (MARCH_BEND), and from there they made
// straight for the way out. The tent stands on that second leg, at a share of it dealt from the camp's stream (12 to
// 16 hundredths: they camped soon after the climb), in the lee of a drift that lies 19 m up the wind of it.
const MARCH_HEAD = [TRACK_X, -690], MARCH_BEND = [TRACK_X - 4, -765];
const tentOn = (f) => [MARCH_BEND[0] + (PORTAL[0] - MARCH_BEND[0]) * f, MARCH_BEND[1] + (PORTAL[1] - MARCH_BEND[1]) * f];
const CREV_END = 338;                         // the last row of crevasses lies this far up the glacier
const FALL_FOOT = 505;                        // the foot of the icefall: the ramp ends here
const FLAT = 742;                             // from here on the plateau lies flat
const WHITE_TOP = [-950, 1000, -1750];
const BOUNDS = [-420, -1300, 420, 240];       // the land mesh: x0, z0, x1, z1
const WIND = [-0.984, 0.178];                 // the ground wind blows from +X to -X, a little toward +Z (x, z)
const FIRE = [190, 110, -400];                // the lava front, as a light

// a smooth monotone curve through keys [[x, y], ...] (Fritsch-Carlson)
function monotone(keys) {
  const n = keys.length, X = keys.map((k) => k[0]), Y = keys.map((k) => k[1]), d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) * 0.5;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  return (x) => {
    if (x <= X[0]) return Y[0]; if (x >= X[n - 1]) return Y[n - 1];
    let i = 0; while (x > X[i + 1]) i++;
    const h = X[i + 1] - X[i], t = (x - X[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * Y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * Y[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------------------------------------------------------------- the crevasse field: a baked depth map
// Transverse slots, bowed downhill, on both sides of the clean ramp. Depth in metres on a 0.5 m grid; the height
// function and the land's shader both read it, so the blue is exactly where the trench is.
// (the map reaches up through the icefall since fix round 3: two crevasses lie beside the corridor there)
const CV = { x0: -206, z0: -690, w: 412, d: 662, cell: 0.5 };
async function makeCrevasses(ctx, rng, noise, spacing, fr) {
  const NX = Math.round(CV.w / CV.cell), NZ = Math.round(CV.d / CV.cell), depth = new Float32Array(NX * NZ), list = [];
  const sides = [[-HALF + 6, RAMP[0] - 5], [RAMP[1] + 7, HALF - 6]];
  for (const [xa, xb] of sides) {
    let z = -58 - rng.range(0, spacing * 0.5);
    while (z > -CREV_END) {
      // one or two slots in a row across this side of the ice
      const two = rng.chance(0.45), span = xb - xa;
      const cuts = two ? [[xa + rng.range(0, 0.1) * span, xa + rng.range(0.38, 0.48) * span], [xa + rng.range(0.56, 0.66) * span, xb - rng.range(0, 0.08) * span]] : [[xa + rng.range(0, 0.3) * span, xb - rng.range(0, 0.3) * span]];
      for (const [a, b] of cuts) { const len = Math.min(160, b - a); if (len < 36) continue;
        list.push({ xc: (a + b) / 2 + (b - a - len) * (rng() - 0.5), zc: z + rng.range(-5, 5), half: len / 2, bow: rng.range(3, 11) * (len / 110), w: rng.range(1.6, 4.4), dep: rng.range(15, 30), rot: rng.range(-0.1, 0.1), key: rng.range(0, 100) }); }
      z -= spacing * rng.range(0.75, 1.3);
    }
  }
  // two crevasses in the icefall, one across each edge of the gully (the gully is the 17 m either side of the centre
  // line): the fire side's somewhere in the lower half of the fall (545 to 580 m up the glacier), the far side's in the
  // upper half (592 to 628 m up). Where along its half each lies, how far out across the edge, and its length, bow,
  // width, depth and bearing are dealt from a stream of their own (fr). The standing ice keeps 16 m from each.
  const fall = [];
  for (const [sx, da, db] of [[1, 545, 580], [-1, 592, 628]]) {
    const c = { xc: sx * (17 + fr.range(2, 6)), zc: -fr.range(da, db), half: fr.range(11, 15), bow: fr.range(1, 2.2), w: fr.range(2.2, 3), dep: fr.range(14, 18), rot: sx * fr.range(0.05, 0.16), key: fr.range(0, 100) };
    list.push(c); fall.push(c);
  }
  let work = 0;
  for (const c of list) {
    const cr = Math.cos(c.rot), sr = Math.sin(c.rot), ext = c.half + 2, i0 = Math.max(0, Math.floor((c.xc - ext - CV.x0) / CV.cell)), i1 = Math.min(NX - 1, Math.ceil((c.xc + ext - CV.x0) / CV.cell));
    const zext = c.bow + c.w + c.half * Math.abs(sr) + 4, j0 = Math.max(0, Math.floor((c.zc - zext - CV.z0) / CV.cell)), j1 = Math.min(NZ - 1, Math.ceil((c.zc + zext - CV.z0) / CV.cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = CV.x0 + i * CV.cell - c.xc, dz = CV.z0 + j * CV.cell - c.zc, lx = dx * cr + dz * sr, lz = -dx * sr + dz * cr, q = lx / c.half;
      if (q <= -1 || q >= 1) continue;
      const mid = c.bow * (1 - q * q) + 1.6 * noise.n2(lx / 17 + c.key, c.key * 0.7) + 0.5 * noise.n2(lx / 4.5, c.key);       // bowed downhill (+z), a wandering line
      const hw = c.w * Math.pow(1 - q * q, 0.6) * (0.75 + 0.5 * noise.n2(lx / 23 - c.key, 3.3));                             // a lens: it pinches out at both ends
      const dd = Math.abs(lz - mid); if (dd > hw + 0.9) continue;
      const prof = 1 - smoothstep(hw * 0.45, hw + 0.9, dd), v = c.dep * prof * Math.min(1, hw / 1.5), k = j * NX + i;
      if (v > depth[k]) depth[k] = v;
    }
    if ((work += (i1 - i0) * (j1 - j0)) > 18000) { work = 0; await ctx.yield(); }
  }
  const at = (x, z) => {
    const fx = (x - CV.x0) / CV.cell, fz = (z - CV.z0) / CV.cell; if (!(fx >= 0 && fz >= 0 && fx < NX - 1 && fz < NZ - 1)) return 0;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * NX + i;
    return (depth[k] * (1 - u) + depth[k + 1] * u) * (1 - v) + (depth[k + NX] * (1 - u) + depth[k + NX + 1] * u) * v;
  };
  // the same field as a texture for the land's shader (depth / 30 m in one byte)
  const data = new Uint8Array(NX * NZ); for (let k = 0; k < NX * NZ; k++) data[k] = Math.min(255, Math.round(depth[k] / 30 * 255));
  await ctx.yield();
  const tex = new THREE.DataTexture(data, NX, NZ, THREE.RedFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return { at, texture: tex, list, fall, box: new THREE.Vector4(CV.x0, CV.z0, 1 / CV.w, 1 / CV.d) };
}

// ---------------------------------------------------------------- 2. the land
function makeLand(noise, crev, TENT, RIDGE, crev2, ringKey) {      // ringKey: the last key of the road as worked, [x, y, z]: the ring's middle hangs at its y
  const G = monotone(GLACIER), wx = WIND[0], wz = WIND[1];
  // the lip bows back at its sides, so the icefall heads in a horseshoe
  const up = (x, z) => -z + 0.00075 * x * x * smoothstep(-430, -620, z);
  const ridges = (x, z) => {                                        // wind-ridges: long low crests along the wind, in patches
    const a = x * wx + z * wz, c = -x * wz + z * wx;
    const r1 = 1 - Math.abs(noise.n2(c / 7.5, a / 38)), r2 = 1 - Math.abs(noise.n2(c / 4.2 + 9, a / 21 - 4));
    const patch = smoothstep(-0.45, 0.35, noise.n2(x / 85 + 3, z / 85 - 7));
    return (0.95 * r1 * r1 * r1 + 0.35 * r2 * r2) * (0.35 + 0.65 * patch);
  };
  // the lip is no ruled line: it wanders some metres up and down the glacier along its length (the land's shader
  // carries the same three sines)
  const lipWob = (x) => 9 * Math.sin(x / 23 + 1.3) + 5 * Math.sin(x / 8.7 + 0.4) + 2.5 * Math.sin(x / 3.9 + 2);
  const height = (x, z) => {
    const d0 = up(x, z), d = d0 + lipWob(x) * smoothstep(600, 680, d0), ax = Math.abs(x);
    const plat = smoothstep(690, 724, d);                            // 0 on the glacier, 1 on the plateau
    // the ice: the centre-line profile, a little crowned, with long bowed swells
    // (the swells are slight on the ramp: the way up is the smooth one, and the flight passes low over it)
    const rampK = smoothstep(RAMP[0] - 14, RAMP[0] + 2, x) * (1 - smoothstep(RAMP[1] - 2, RAMP[1] + 14, x));
    let ice = G(d) - 0.00005 * x * x * (1 - plat) + (1 - plat) * (1 - 0.75 * rampK) * (0.9 * Math.sin(d / 21 + x * x / 5200) + 1.4 * noise.n2(x / 120, z / 120));
    // the icefall: benches and broken steps either side of the clear gully
    const fall = smoothstep(FALL_FOOT, FALL_FOOT + 40, d) * (1 - smoothstep(672, 700, d));
    if (fall > 0) { const rough = smoothstep(17, 42, ax); ice += fall * rough * (5.5 * noise.n2(x / 21, z / 14) + 3 * noise.n2(x / 8 + 5, z / 7))
      // the gully's own snow: the same wind-ridges as the plateau's, and low drifts
      + fall * (1 - rough) * (0.8 * noise.n2(x / 9, z / 11) + 1.2 * noise.n2(x / 31, z / 23) + 1.3 * ridges(x, z)); }
    // crevasses
    if (plat < 1) ice -= crev.at(x, z) * (1 - plat);
    // the plateau: wind-ridges, a broad swell, the two whalebacks either side of the portal, a flat place for the camp
    // (one pattern of ridges from the lip to the horizon; the lip itself a rounded cornice a little higher than the snow behind it)
    let top = PLATEAU + 0.9 * noise.n2(x / 240 + 1, z / 240) + ridges(x, z) * (1.4 + 0.3 * smoothstep(700, 760, d));
    { const c = (d - 717) / 9; if (c > -3 && c < 3) top += 2.7 * Math.exp(-c * c) * (0.75 + 0.25 * noise.n2(x / 17, 3.3)); }
    // the way out stands in the land: a whaleback of ice either side of it (8.5 m), a hollow between them, and in its
    // lee the snow the wind carries through: a drift 9 m high 26 m down the axis, and the saddle's lee drift (see LAYOUT)
    { const dxp = x - PORTAL[0], dzp = z - PORTAL[1], al = dxp * PORTAL_DIR[0] + dzp * PORTAL_DIR[1], ac = -dxp * PORTAL_DIR[1] + dzp * PORTAL_DIR[0];      // along the last heading, across it
      if (al * al + ac * ac < 160 * 160) {
        for (const sc of [-24, 24]) { const pc = (ac - sc) / 9, pa = al / 22, q = pa * pa + pc * pc; if (q < 9) top += 8.5 * Math.exp(-q) * (1 + 0.12 * noise.n2(x / 6, z / 6)); }
        const hq = (ac / 11) * (ac / 11) + (al / 15) * (al / 15); if (hq < 9) top -= 2.4 * Math.exp(-hq);
        // in its lee a drift (9 m), then the ice to the horizon
        const bq = (ac / 34) * (ac / 34) + ((al - 26) / 15) * ((al - 26) / 15); if (bq < 12) top += 9 * Math.exp(-bq) * (1 + 0.1 * noise.n2(x / 19, z / 19));
        // (polish 1) the crest the ring stands on: a low rise across the way between the two whalebacks, where the snow is
        // lower than it; never more than 1.8 m over the plateau's own level
        { const cq = ((al - 1) / 6) * ((al - 1) / 6) + (ac / 15) * (ac / 15); if (cq < 6) top = Math.max(top, PLATEAU + SADDLE_H * Math.exp(-cq)); }
        // (second part, B3c; fourth part, F1) the saddle's lee drift (see LAYOUT): its crest at the level of the hoop's
        // own top (the ring's middle, its radius, the hoop's thickness), 34 m down the saddle's axis, 40 m its measure across the saddle and 15 m along it; a
        // "not lower than", so live's drift is whole under it
        { const dq = (ac / 40) * (ac / 40) + ((al - 34) / 15) * ((al - 34) / 15); if (dq < 12) top = Math.max(top, PLATEAU + (ringKey[1] + RING_R + HOOP_R - PLATEAU) * Math.exp(-dq)); } } }
    // a pressure ridge, where the plateau's ice is pressed as it starts down over the lip: slabs of ice tilted up along a
    // wandering line that lies parallel to the lip (in the lip's own bowed measure d0), each slab about 7 m long. How far
    // behind the lip it lies, its bearing off the lip's line, its middle and its length are dealt (RIDGE).
    { const rx = Math.abs(x - RIDGE.xc); if (rx < RIDGE.half) { const pr = d0 - RIDGE.d0 - RIDGE.tilt * x + 6 * noise.n2(x / 40, RIDGE.key);
      if (pr > -5 && pr < 5) { const sl = ((x / 7 + 0.5 * noise.n2(x / 3, 1.1)) % 1 + 1) % 1; top += 1.9 * (1 - Math.abs(pr) / 5) * (0.25 + sl) * (0.6 + 0.4 * noise.n2(x / 19, 5.5)) * smoothstep(RIDGE.half, RIDGE.half - 30, rx); } } }
    { const q = Math.hypot(x - TENT[0], z - TENT[1]); if (q < 14) top = lerp(PLATEAU + 0.1, top, smoothstep(5, 14, q)); }
    // (polish 1) the plateau's own crevasses, where its ice bends (a second baked depth map)
    top -= crev2.at(x, z);
    // the drift the tent stands in the lee of: 2.4 m high, long down the wind, 19 m up the wind of the tent
    { const dx = x - (TENT[0] - wx * 19), dz = z - (TENT[1] - wz * 19), a = (dx * wx + dz * wz) / 8, c = (-dx * wz + dz * wx) / 6, q = a * a + c * c; if (q < 9) top += 2.4 * Math.exp(-q); }
    // the walls of the pass: buttress toes and moraine banks rising to a crest about 65 m above the ice
    const edge = HALF - 22 + 16 * noise.n2(z / 90, x > 0 ? 3.1 : 8.4), wall = smoothstep(edge, edge + 150, ax);
    let h = ice;
    if (wall > 0 && plat < 1) {
      const crest = Math.min(G(d) + 58 + 22 * noise.n2(z / 150, x > 0 ? 1.7 : 5.2), 229 + 5 * noise.n2(z / 80, 2.2)) + 9 * noise.n2(z / 37, x / 60);
      const rib = (1 - Math.abs(noise.n2(z / 46 + (x > 0 ? 11 : 0), ax / 150))) * 16 * wall * (1 - wall) * 4;
      h = lerp(ice, Math.max(crest, ice), wall * wall * (3 - 2 * wall)) + rib * 0.6 + 2.2 * noise.n2(x / 13, z / 13) * wall;
    }
    return lerp(h, top, plat);
  };
  return { height, G, up, ridges, lipWob };
}

// ---------------------------------------------------------------- 3. the land's material, patched once in build
// The kit terrain material keeps its lights, fog and near detail; this adds, per pixel and in the layout's own
// coordinates (x times uMx): rock ribs on the walls, ash in downwind tails (dirty on the fire side, clean on the far
// side, none on the ramp or above the lip), the blue inside of the crevasses from the depth map with a soft glow, the
// red light of the fire, and the relief of the wind-ridges on the plateau.
const LAND_PARS = /* glsl */`
uniform sampler2D tCrev; uniform vec4 uCvBox; uniform vec4 uLand;      // uLand: lip z, half width of the ice, mirror sign, ash amount
uniform vec4 uRampW;                                                    // ramp x0, x1, wind x, wind z
uniform vec3 uAshCol, uIce, uIceDeep, uIceGlow, uRibCol;
uniform vec3 uSnouts[4];                                               // where each tongue of lava ends on the ice: x, z, how far the wet ice reaches round it
float gSbvCv = 0., gSbvIn = 0., gSbvWet = 0., gSbvPlat = 0., gSbvCut = 0., gSbvShade = 1.;
uniform sampler2D tCrev2; uniform vec4 uCv2Box;                         // (polish 1) the plateau's crevasses
uniform vec4 uCrater, uTent; uniform float uDoorLit; uniform vec3 uLampCol;      // the crater's place (layout x, z); the tent (its middle and long axis, world); the lamp's strength as the camp has it, for the door's pool
${SBV_NOISE}
${SBV_LIGHT}
${TENT_SHADE}
${DOOR_POOL}
// the height (0..1.3, about a metre) of the plateau's sastrugi at a place given along and across the wind (m)
float sbvSast(vec2 q){ vec2 a = vec2(q.y/3.4 + .6*sN2(q/31.), q.x/24.); float r = 1. - abs(2.*sN2(a) - 1.), r2 = 1. - abs(2.*sN2(a*vec2(2.3, 1.7) + 9.) - 1.); return r*r*r + .3*r2*r2; }
`;
const LAND_COLOR = /* glsl */`
{ vec3 wp = vTWorld; vec2 p = vec2(wp.x*uLand.z, wp.z); vec3 wn0 = normalize(vTNormal);
  float dUp = -p.y + .00075*p.x*p.x*smoothstep(-430., -620., p.y);
  dUp += (9.*sin(p.x/23. + 1.3) + 5.*sin(p.x/8.7 + .4) + 2.5*sin(p.x/3.9 + 2.))*smoothstep(600., 680., dUp);
  float glacier = 1. - smoothstep(690., 724., dUp), ax = abs(p.x);
  float vd = length(vViewPosition);
  // rock ribs: where the walls of the pass are steep
  float wallK = smoothstep(uLand.y - 30., uLand.y + 40., ax)*glacier;
  float n1 = sF2(p/31.), n2 = sF2(p/7.3 + 11.);
  float rib = wallK*(1. - smoothstep(.66, .84, wn0.y + .22*(n1 - .5) + .1*(n2 - .5)));
  rib = max(rib, wallK*smoothstep(.56, .7, n1*.7 + .3*n2)*step(0., p.x)*.85);                    // the fire side: scoria shows through the old snow
  diffuseColor.rgb = mix(diffuseColor.rgb, uRibCol*(.6 + .9*n2), rib);
  // (polish 1) the walls' rock is rock: beds of lighter and darker stone lifted out of flat black, frost on the rim of every patch
  { float bedW = sN2(vec2(wp.y/4.5 + 2.5*n1, dot(p, vec2(.7, .7))/55.));
    diffuseColor.rgb = mix(diffuseColor.rgb, (uRibCol*(1.5 + 3.2*bedW) + vec3(.01, .012, .018))*(.7 + .6*n2), rib*.85);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.5, .56, .66), rib*(1. - rib)*1.6*smoothstep(.3, .7, n2)); }
  // ash: long tails down the wind
  vec2 wd = uRampW.zw; vec2 q = vec2(dot(p, wd), dot(p, vec2(-wd.y, wd.x)));
  float side = smoothstep(-110., 150., p.x);
  float tails = sF2(vec2(q.x/30., q.y/7.) + vec2(0., .35*sN2(p/60.))), blot = sF2(p/43. + 3.7), fine = sF2(vec2(q.x/9., q.y/1.1));
  // (fine veils and tails, no broad blots: the ash lies where the wind combed it)
  float ash = smoothstep(.62 - .4*side, .84 - .34*side, tails*.8 + blot*.3 + .2*(fine - .5)*(1. - smoothstep(.3, .9, fwidth(q.y/1.1))));      // (the fine veils fade into their mean where one is smaller than a pixel or two)
  ash = max(ash, side*.24*smoothstep(.4, .7, blot)*(.3 + .7*smoothstep(.4, .62, fine)));
  // a black tail down the wind from every crevasse lip on the fire side: the lee of the lip, six and twelve metres up the wind of here
  { vec2 c1 = (p - wd*6. - uCvBox.xy)*uCvBox.zw, c2 = (p - wd*13. - uCvBox.xy)*uCvBox.zw;
    float lee = max(smoothstep(.0, .03, texture2D(tCrev, c1).r), .6*smoothstep(.0, .03, texture2D(tCrev, c2).r))*step(0., c1.x)*step(c1.x, 1.)*step(0., c1.y)*step(c1.y, 1.);
    ash = max(ash, lee*side*(.55 + .45*fine)); }
  float ramp = smoothstep(uRampW.x - 9., uRampW.x + 3., p.x)*(1. - smoothstep(uRampW.y - 3., uRampW.y + 9., p.x));
  ash *= glacier*(1. - .82*ramp)*uLand.w*(1. - rib);
  // the glacier's own skin: windows of bare blue ice where the wind has swept it, plates of hard white crust between
  { float open = glacier*(1. - wallK)*(1. - .8*ramp);
    float win = smoothstep(.64, .66, sF2(p/9. + 5.3)*.76 + .24*sF2(p/2.1 + 1.7))*open;
    float crust = smoothstep(.5, .525, sF2(vec2(q.x/12., q.y/3.6) + 7.7))*(1. - win)*open;
    diffuseColor.rgb = mix(diffuseColor.rgb*(1. + .14*crust), vec3(.17, .36, .56)*(.8 + .4*n2), win*.75);
    ash *= 1. - .6*win; }
  diffuseColor.rgb = mix(diffuseColor.rgb, uAshCol*(.7 + .6*n2), ash*.72);
  // where the lava meets the ice: round each snout the ice is wet, dark blue-green and glossy, with white cracks and
  // trapped bubbles and snow lying in its hollows; between it and the snow a band of grey rotten ice. No water lies
  // or runs anywhere on this glacier.
  { float pool = 0.;
    for (int i = 0; i < 4; i++) { vec2 ds = p - uSnouts[i].xy; float rr = uSnouts[i].z, l = length(ds) + rr*.5*(n1 - .5) + rr*.3*(sF2(p/5. + float(i)*3.) - .5) + rr*.14*(sN2(p/1.3 + 5.) - .5);      // (polish 1: a broken, feathered edge)
      pool = max(pool, 1. - smoothstep(rr*.5, rr, l)); }
    float wet = pool*glacier;
    vec3 wetIce = vec3(.035, .1, .115)*(.7 + .6*n2);
    float wcr = 1. - smoothstep(.0, .03, abs(sN2(p/2.6 + 4.) - .5)), bub = smoothstep(.7, .8, sN2(p*1.9 + 7.));
    wetIce = mix(wetIce, vec3(.5, .6, .68), max(wcr*.6, bub*.3));
    // (polish 1) plainly ice: broken into plates by a second, finer set of white cracks, plate by plate a little lighter or darker
    { float wc2 = 1. - smoothstep(.0, .05, abs(sN2(p/1.15 + 9.) - .5)); wetIce *= .8 + .5*smoothstep(.45, .5, sN2(p/3.3 + 2.)); wetIce = mix(wetIce, vec3(.55, .64, .72), wc2*.7); }
    wetIce = mix(wetIce, diffuseColor.rgb, .8*smoothstep(.56, .7, sF2(p/5.5 + 2.2)));
    float slush = smoothstep(.04, .3, wet)*(1. - smoothstep(.4, .8, wet));
    diffuseColor.rgb = mix(diffuseColor.rgb, wetIce, smoothstep(.25, .7, wet));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.3, .36, .43)*(.8 + .4*n2), slush*.65);
    gSbvWet = wet*(.45 + .55*n2); }
  // crevasses: blue ice by depth, the bottom lost in blue-black
  vec2 cuv = (p - uCvBox.xy)*uCvBox.zw;
  float cv = texture2D(tCrev, cuv).r*step(0., cuv.x)*step(cuv.x, 1.)*step(0., cuv.y)*step(cuv.y, 1.);
  vec2 c2 = (p - uCv2Box.xy)*uCv2Box.zw; vec2 cc2 = texture2D(tCrev2, c2).rg*(step(0., c2.x)*step(c2.x, 1.)*step(0., c2.y)*step(c2.y, 1.)); float cv2 = cc2.r; cv = max(cv, cv2);
  // (second part, B6; third part) where a crevasse has its true trench the land is cut open over it. (Third part, C2:
  // no snow bridge is left over a cut: a bridge was the land's own skin, a flat blank slab with nothing under it.) The
  // cut is only marked here; the pixel is dropped at the end of this world's last piece of the land's shader, after
  // everything that takes a screen derivative.
  gSbvCut = cc2.g > .5 ? 1. : 0.;
  float inC = smoothstep(.015, .16, cv)*(1. - smoothstep(.6, .68, sF2(p/5. + 8.8)));                 // (snow bridges it here and there)
  vec3 ice = mix(uIce*2., uIce*.6, smoothstep(.05, .6, cv))*(.8 + .4*n2);
  ice = mix(ice, uIceDeep*1.5, smoothstep(.22, .8, cv2));                                           // (polish 1) the plateau's go down from blue to blue-black
  float lipK = smoothstep(.0, .012, cv)*(1. - inC);
  diffuseColor.rgb = mix(mix(diffuseColor.rgb, vec3(.8, .86, .95), lipK*.75), ice, inC);                // a lip of clean cornice, then the blue wall
  gSbvCv = cv; gSbvIn = inC;
  // wind-ridges on the plateau, finer than the mesh: relief for the raking light
  float snowK = max(1. - glacier, smoothstep(505., 560., dUp)*(1. - smoothstep(14., 34., ax)));      // the plateau, the lip and the gully's floor
  diffuseColor.rgb *= 1. + snowK*(.3*(sF2(vec2(q.x/34., q.y/6.) + 2.3) - .5) + .16*(sF2(vec2(q.x/9., q.y/1.7) + 5.1) - .5)*smoothstep(160., 30., vd));                         // drift: long pale and grey streaks down the wind
  // (polish 1) the plateau's ridges lie in fields, with smoother ice between: never one even ripple from edge to edge
  float plat = 1. - glacier, fld = smoothstep(.42, .6, sF2(p/95. + 4.4));
  float platK = snowK*smoothstep(260., 40., vd)*mix(1., .3 + .7*fld, plat);
  if (platK > .003) {
    float e = .35; vec2 qa = vec2(q.y/2.6, q.x/15.);
    float r0 = 1. - abs(2.*sN2(qa) - 1.), rx = 1. - abs(2.*sN2(qa + vec2(e/2.6, 0.)) - 1.), ry = 1. - abs(2.*sN2(qa + vec2(0., e/15.)) - 1.);
    vec2 g2 = vec2(rx*rx - r0*r0, ry*ry - r0*r0)/e;                 // across the wind, along it
    gTGrad += (vec3(-wd.y, 0., wd.x)*g2.x + vec3(wd.x, 0., wd.y)*g2.y)*platK*.8*vec3(uLand.z, 1., 1.);
    diffuseColor.rgb *= 1. + .07*platK*(r0*r0 - .4);
  }
  gSbvPlat = 1. - glacier;
  // (polish 1) THE PLATEAU. Sastrugi in the fields: long hard crests along the wind, up to about a metre high, with
  // their own relief and the long blue shadows the low afterglow throws from them (three places looked at toward the
  // light); smooth blue ice between the fields; ash lying grey in the lee of ridges and in veils down the wind,
  // thinning with distance from the crater. All in the world's metres; the fine relief fades by pixel footprint.
  // (Said once, here: the new crests' relief is added to the land's own gradient, as live's plateau relief is, so near
  // the eye it passes through the kit's close-up boost with it.)
  { float sw = max(fwidth(q.y/3.4), fwidth(q.x/24.)), sk = plat*fld*(1. - smoothstep(.3, .75, sw));
    if (sk > .003) { float e = .4, h0 = sbvSast(q), hx = sbvSast(q + vec2(0., e)), hy = sbvSast(q + vec2(e, 0.));
      vec2 g2 = vec2(hx - h0, hy - h0)/e;                               // across the wind, along it
      gTGrad += (vec3(-wd.y, 0., wd.x)*g2.x + vec3(wd.x, 0., wd.y)*g2.y)*sk*1.1*vec3(uLand.z, 1., 1.);
      vec2 Lp = vec2(uGlowDir.x*uLand.z, uGlowDir.z); float ll = max(length(Lp), 1e-3); Lp /= ll; float tanE = max(uGlowDir.y, .02)/ll;
      vec2 Lq = vec2(dot(Lp, wd), dot(Lp, vec2(-wd.y, wd.x)));
      float shd = smoothstep(0., .22, .9*(sbvSast(q + Lq*1.3) - h0) - 1.3*tanE);
      shd = max(shd, smoothstep(0., .22, .9*(sbvSast(q + Lq*3.2) - h0) - 3.2*tanE));
      shd = max(shd, smoothstep(0., .22, .9*(sbvSast(q + Lq*6.5) - h0) - 6.5*tanE));
      diffuseColor.rgb *= mix(vec3(1.), vec3(.5, .6, .82), shd*sk*.85)*(1. + .12*sk*(h0 - .3)); }
    if (plat > .01) {
      float bareP = plat*(1. - fld)*smoothstep(.5, .6, sF2(p/21. + 1.9));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.2, .4, .62)*(.8 + .4*n2), bareP*.5);
      float ashAmt = plat*(1. - smoothstep(1350., 2700., length(p - uCrater.xy)))*uLand.w;
      float leeN = smoothstep(.03, .16, dot(wn0.xz*vec2(uLand.z, 1.), wd));
      float veil = smoothstep(.5, .78, sF2(vec2(q.x/26., q.y/5.) + 12.3))*smoothstep(.35, .6, sF2(p/70. + 8.));
      diffuseColor.rgb = mix(diffuseColor.rgb, uAshCol*(.75 + .5*n2), ashAmt*clamp(.8*leeN + .5*veil, 0., 1.)*.55); } }
  // (fourth part, E2) THE SNOW'S FINE RELIEF, well under a cell of the land's mesh, on all the snow (the plateau, the
  // lip, the gully's floor): small sastrugi 0.6 m across the wind and 4 m along it, up to 10 cm high, in patches
  // some 30 m long and 6 m across (a quarter as high between the patches), their lines wandering by a metre and a
  // half so that none runs ruled; and a wind crust 0.2 m across and 1.2 m along, 5 cm; both add their slope to the land's own
  // gradient and a little tone, and each fades into its mean by the pixel's footprint alone (the eye's place is not read).
  if (snowK > .003) {
    vec2 qa = vec2(q.y/.62 + 2.4*sN2(vec2(q.x/7.3, q.y/2.1)) + 1.1*sN2(q/23.), q.x/4.1), qb = vec2(q.y/.19 + .6*sN2(q/2.7 + 4.), q.x/1.2);
    float ka = snowK*(.25 + .75*smoothstep(.3, .7, sN2(vec2(q.x/31., q.y/6.5) + 7.)))*(1. - smoothstep(.25, .7, max(fwidth(qa.x), fwidth(qa.y)))), kb = snowK*(1. - smoothstep(.25, .7, max(fwidth(qb.x), fwidth(qb.y))));
    vec2 g2 = vec2(0.); float tone = 0.;
    if (ka > .003) { float a0 = 1. - abs(2.*sN2(qa) - 1.), a1 = 1. - abs(2.*sN2(qa + vec2(.2, 0.)) - 1.), a2 = 1. - abs(2.*sN2(qa + vec2(0., .06)) - 1.);
      g2 += vec2((a1*a1 - a0*a0)/(.2*.62), (a2*a2 - a0*a0)/(.06*4.1))*(.1*ka); tone += .08*ka*(a0*a0 - .35); }
    if (kb > .003) { float b0 = sN2(qb), b1 = sN2(qb + vec2(.25, 0.)), b2 = sN2(qb + vec2(0., .1));
      g2 += vec2((b1 - b0)/(.25*.19), (b2 - b0)/(.1*1.2))*(.05*kb); tone += .05*kb*(b0 - .5); }
    gTGrad += (vec3(-wd.y, 0., wd.x)*g2.x + vec3(wd.x, 0., wd.y)*g2.y)*vec3(uLand.z, 1., 1.);
    diffuseColor.rgb *= 1. + tone;
  }
  // THE GLACIER'S WIND CRUST, in the world's own metres: hard plates about 2 m across the wind and 7 m along it, each
  // with its own relief for the raking light. On the open ice it stands in for the kit's near detail, whose close-up
  // boost (a texture, stretched along the view at a grazing angle) is taken back out here. It fades into its mean
  // where one plate is smaller than a pixel or two.
  { float open = glacier*(1. - wallK); vec2 qc = vec2(q.y/2., q.x/7.); float qw = max(fwidth(qc.x), fwidth(qc.y));
    if (open > .003) {
      gTGrad *= mix(1., .5/(1. + 2.*smoothstep(60., 5., vd)), open);
      float ck = open*(1. - smoothstep(.25, .6, qw));
      if (ck > .003) { float e = .3;
        float c0 = 1. - abs(2.*sN2(qc) - 1.), cx = 1. - abs(2.*sN2(qc + vec2(e/2., 0.)) - 1.), cy = 1. - abs(2.*sN2(qc + vec2(0., e/7.)) - 1.);
        vec2 g2 = vec2(cx*cx - c0*c0, cy*cy - c0*c0)/e;                 // across the wind, along it
        gTGrad += (vec3(-wd.y, 0., wd.x)*g2.x + vec3(wd.x, 0., wd.y)*g2.y)*ck*.3*vec3(uLand.z, 1., 1.);
        diffuseColor.rgb *= 1. + .09*ck*(c0*c0 - .4); } } }
  // (fourth part, E1b; fifth part, P2) THE TENT'S OWN SHADE on the snow at its foot: the camp's one rule
  // (TENT_SHADE, stated in the camp part): the tent shades the sky's light; the lamp's and the door's light come
  // from the tent and are not shaded by it (uTent: its middle and its long axis, world). Here the snow's colour is
  // darkened by the shade (so all that lights it is), and LAND_EMIT gives the lamp's and the door's light the share
  // back that this takes from them.
  gSbvShade = sbvTentShade(vTWorld.xz, uTent); diffuseColor.rgb *= gSbvShade;
}
`;
const LAND_EMIT = /* glsl */`
{ vec3 wn = normalize((vec4(normal, 0.)*viewMatrix).xyz);
  totalEmissiveRadiance += diffuseColor.rgb*(sbvFire(vTWorld, wn)*(1. - .7*gSbvIn) + 2.*sbvFire2(vTWorld, wn) + sbvRing(vTWorld, wn) + (sbvBelly(vTWorld, wn) + sbvRingFar(vTWorld, wn))*gSbvPlat) + uIceGlow*gSbvIn*smoothstep(.02, .12, gSbvCv)*(1. - smoothstep(.15, .6, gSbvCv));
  // the red sheen on the wet ice toward the fire
  totalEmissiveRadiance += uFireCol*uFire.y*.035*gSbvWet;
  // (polish 1) the tent's light spills out on the snow by its door: a small pool, gone within a few metres
  // (fifth part, P2: on the snow's own colour, not shaded by the tent; sixth part, S2: the pool is the camp's one
  //  declaration, DOOR_POOL, and breathes with the flame as the camp's own snow does)
  totalEmissiveRadiance += diffuseColor.rgb/gSbvShade*uLampCol*(uDoorLit*sbvDoorPool(vTWorld.xz, uTent));
  // (fifth part, P2) and the lamp's light through the cloth (the world's one point light) is not shaded by the tent
  // either: what the darkened colour takes from it below is made up here, by the light's own measure
#if NUM_POINT_LIGHTS > 0
  { IncidentLight lampL; getPointLightInfo(pointLights[0], -vViewPosition, lampL);
    totalEmissiveRadiance += diffuseColor.rgb*(1./gSbvShade - 1.)*lampL.color*(saturate(dot(normal, lampL.direction))*RECIPROCAL_PI); }
#endif
  // on the plateau the volcano's glow, low on the sky behind, lies on the crests of the snow that face it
  totalEmissiveRadiance += diffuseColor.rgb*uFireCol*(.34*gSbvPlat*clamp(dot(wn.xz, normalize(vec2(.6*uLand.z, -.8)))*4., 0., 1.)); }
// (third part) the land is cut open over a true trench here, last, after every screen derivative this world takes
if (gSbvCut > .5) discard;
`;
function patchLand(material, uniforms) {
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + LAND_PARS)
      .replace('#include <roughnessmap_fragment>', LAND_COLOR + '\n#include <roughnessmap_fragment>')
      .replace('totalEmissiveRadiance += gTEmit;', 'totalEmissiveRadiance += gTEmit;\n' + LAND_EMIT);
  };
  material.customProgramCacheKey = () => (prevKey ? prevKey.call(material) : '') + '-sbv-land';
  material.crevasseMap = uniforms.tCrev.value;      // a plain property, so the engine's disposer finds the texture
}

// ---------------------------------------------------------------- the far snow: the plateau carried to the horizon
const FAR_VS = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const FAR_FS = /* glsl */`
precision highp float;
varying vec3 vW; uniform vec4 uHole; uniform vec3 uSnow; uniform vec3 uHor[16]; uniform vec4 uFarW, uFarCr;      // uFarW: wind x, z, mirror sign, -   uFarCr: the crater's place (layout x, z)
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  vec2 p = vec2(vW.x*uFarW.z, vW.z);
  if (p.x > uHole.x && p.x < uHole.z && p.y > uHole.y && p.y < uHole.w) discard;                       // the land mesh lies here
  float dist = length(vW - cameraPosition);
  vec2 wd = uFarW.xy; vec2 q = vec2(dot(p, wd), dot(p, vec2(-wd.y, wd.x)));
  // wind-ridges as shading only, fading into the mean with distance
  float e = 1.5, k = smoothstep(1400., 250., dist);
  float r0 = 1. - abs(2.*sN2(vec2(q.y/7.5, q.x/38.)) - 1.), rx = 1. - abs(2.*sN2(vec2((q.y + e)/7.5, q.x/38.)) - 1.), ry = 1. - abs(2.*sN2(vec2(q.y/7.5, (q.x + e)/38.)) - 1.);
  vec3 n = normalize(vec3(0., 1., 0.) - (vec3(-wd.y, 0., wd.x)*(rx - r0) + vec3(wd.x, 0., wd.y)*(ry - r0))/e*1.7*k*vec3(uFarW.z, 1., 1.));
  float broad = sF2(p/420.);
  vec3 c = uSnow*(.9 + .2*broad)*(sbvSky(n) + sbvBelly(vW, n));      // (polish 1: the eruption's belly lights the far plateau too, dying with distance)
  c *= 1. - .3*(1. - smoothstep(1350., 2700., length(p - uFarCr.xy)))*smoothstep(.45, .75, sF2(vec2(q.x/60., q.y/9.) + 12.3));      // and ash lies on it in veils
  c = sbvFog(c, dist, 1.);
  // far away the snow takes the colour of the sky's own horizon in that direction
  vec2 d = normalize(vW.xz - cameraPosition.xz + vec2(1e-4, 0.)); float a = atan(d.x, -d.y)/6.2831853*16.; a = mod(a + 16., 16.);
  int i0 = int(floor(a)); int i1 = i0 + 1; if (i1 > 15) i1 = 0; if (i0 > 15) i0 = 15;
  vec3 hor = mix(uHor[i0], uHor[i1], fract(a));
  c = mix(c, hor, smoothstep(900., 5200., dist)*.96);
  gl_FragColor = vec4(c, 1.);
}`;

// ---------------------------------------------------------------- 4. the world
export default {
  id: 'sledge-between-volcanoes',
  name: 'The Sledge Between the Volcanoes',
  category: 'books',
  placeKind: 'wilderness',
  book: 'The Left Hand of Darkness',
  author: 'Ursula K. Le Guin, 1929 to 2018',
  weirdness: 0.25,
  async build(ctx) {
    const { rng, noise } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene(), stage = new THREE.Group(); stage.name = 'stage'; scene.add(stage);
    const updaters = [];                      // (dt, t, camera, u) => void
    const S = makeShared();

    // ---- THE FORKS: one list, one stream for each kind of thing this world deals, all taken here before anything is
    //      built. A loop that reads the land or the route and refuses places (seracs, moraine) has a stream to itself.
    const F = forksOf(rng, ['look', 'sky', 'crevasses', 'land', 'cone', 'tongues', 'bursts', 'rollers', 'steam', 'two', 'seracShapes', 'seracs', 'falls',
      'moraineShapes', 'moraine', 'camp', 'campLife', 'banners', 'blownSnow', 'drift', 'ash', 'snow', 'haze', 'flicker', 'skyClock', 'ashClock', 'snowClock']);
    // ---- the seeded look of this visit: every trait from its own fork of the look's stream, dealt by shares
    const LK = forksOf(F.look, ['mirror', 'hour', 'eruption', 'spacing', 'lead', 'push', 'weather', 'glow']);
    const deal = (r, table) => { let acc = 0; for (const [v, share] of table) { acc += share; if (r < acc) return v; } return table[table.length - 1][0]; };
    const look = {
      // the fire on the left: 1/2
      mirror: deal(LK.mirror(), [[false, 1 / 2], [true, 1 / 2]]),
      // the hour: blue dusk with the afterglow 1/2; deep night with the eruption the main light 1/4; a low copper sun ahead-left 1/4
      hour: vary.hour === 'night' ? 'night' : vary.hour === 'golden' || vary.hour === 'dawn' ? 'copper' : deal(LK.hour(), [['dusk', 1 / 2], ['night', 1 / 4], ['copper', 1 / 4]]),
      // the eruption: strong 1/2; waning (a lower greyer plume, more steam, heavier ashfall) 1/4; a surge with two tongues far out on the ice 1/4
      eruption: deal(LK.eruption(), [['strong', 1 / 2], ['waning', 1 / 4], ['surge', 1 / 4]]),
      // crevasse rows tight, middling or open: 1/3 each
      spacing: deal(LK.spacing(), [[17, 1 / 3], [22, 1 / 3], [28, 1 / 3]]),
      // which of the two leads: 1/2; the smaller one pushes from behind: 1/4
      lead: deal(LK.lead(), [[0, 1 / 2], [1, 1 / 2]]), push: deal(LK.push(), [[true, 1 / 4], [false, 3 / 4]]),
      // the plateau: clear and still 2/3, a ground blizzard 1/3
      weather: deal(LK.weather(), [['clear', 2 / 3], ['blizzard', 1 / 3]]),
      glowAz: -20 + LK.glow.range(-8, 8),
    };
    // the copper visit's low sun stands well off the way out: 50 degrees of bearing to the left of it, give or take 8
    if (look.hour === 'copper') look.glowAz -= 30;
    const mx = look.mirror ? -1 : 1;
    stage.scale.x = mx;
    const MX = (v) => new THREE.Vector3(v[0] * mx, v[1], v[2]);
    const night = look.hour === 'night', copper = look.hour === 'copper';
    const waning = look.eruption === 'waning', surge = look.eruption === 'surge', blizzard = look.weather === 'blizzard';


    // ---- light: cold skylight, the afterglow from ahead-left, the fire (analytic, in the shared uniforms)
    const skyCol = new THREE.Color(night ? '#2e5c9e' : '#3878B4'), gndCol = new THREE.Color(night ? '#182240' : '#1B2640'), glowCol = new THREE.Color(copper ? '#FFAE6A' : '#E8C8A8');
    const HEMI = night ? 3.3 : copper ? 3.4 : 4.2, GLOW = night ? 1.3 : copper ? 2.5 : 2.7;
    const glowAz = look.glowAz * mx * Math.PI / 180, glowEl = (copper ? 5 : 8) * Math.PI / 180;
    const glowDir = new THREE.Vector3(Math.sin(glowAz) * Math.cos(glowEl), Math.sin(glowEl), -Math.cos(glowAz) * Math.cos(glowEl));
    const hemi = new THREE.HemisphereLight(skyCol, gndCol, HEMI); scene.add(hemi);
    const sun = new THREE.DirectionalLight(glowCol, GLOW); sun.position.copy(glowDir).multiplyScalar(500); scene.add(sun, sun.target);
    S.uSkyCol.value.copy(skyCol).multiplyScalar(HEMI / Math.PI); S.uGndCol.value.copy(gndCol).multiplyScalar(HEMI / Math.PI);
    S.uGlowDir.value.copy(glowDir); S.uGlowCol.value.copy(glowCol).multiplyScalar(GLOW / Math.PI);
    S.uFirePos.value.copy(MX(FIRE)); S.uWashDir.value.set(0.3 * mx, 0.5, -0.8).normalize();
    // (polish 1) the eruption's burning belly, far up over the crater: a steady dull red light of the place on the
    // plateau and the white mountain (its strength by the visit's eruption and hour; it beats with the fire's own flicker)
    const BELLY = 1.5 * (waning ? 0.7 : surge ? 1.2 : 1) * (night ? 1.15 : copper ? 0.8 : 1);
    S.uBelly.value.set(668 * mx, 1540, -2084, BELLY);
    S.uFireZ.value.set(-790, -700);      // the mountain's red glow lies on the snow for the first ninety metres past the lip, then dies behind us
    const FOG = new THREE.Color(night ? '#1a2646' : copper ? '#33405f' : '#2A3B5E');
    scene.fog = new THREE.FogExp2(FOG, 0.00045); S.uFogCol.value.copy(FOG); S.uFogDen.value = 0.00045;
    await ctx.yield();

    // ---- sky: blue dusk with a narrow band of afterglow ahead-left; or deep night; or a copper sun on the plateau's horizon
    // (fifth part, J1: on the night visit the kit sky's milky way is a faint dust of stars, 0.02; it was 0.35, a
    //  cream cloud brighter than the snow. The sky is not turned. The number was tuned on the whole night flight of
    //  two night seeds, 15 and 20, on sheets of 33 looks drawn by chance: at 0.02 its brightest broad patch is no
    //  brighter than the sky about it and far under the snow. On the dusk and copper visits it is 0, as live's.)
    const sky = makeSky({ rng: F.sky, preset: 'blueHour', zenith: night ? '#060c22' : copper ? '#0d1a3a' : '#0B1530', mid: night ? '#13244c' : copper ? '#2c4878' : '#24406F', horizon: night ? '#263c6c' : copper ? '#5a6a9a' : '#3c5c96', ground: '#0C1730',
      horizonPow: 5, midPow: 1.5, sunElevation: copper ? 1.3 : -5, sunAzimuth: look.glowAz * mx, sunIntensity: copper ? 9 : 0, sunSize: 1.3, sunColor: '#FFB060', sunGlow: copper ? 0.9 : 0.25,
      scatterColor: copper ? '#FF9A50' : '#E9D3B0', scatter: night ? 0.55 : copper ? 1.7 : 1.25, scatterPow: copper ? 5 : 7, scatterHigh: 0, scatterFall: copper ? 11 : 16,
      stars: 0.85, twinkle: 0.5, starDensity: night ? 0.85 : 0.45, milkyWay: night ? 0.02 : 0, bodies: [], clouds: false });
    scene.add(sky.object);
    // a ground blizzard on the plateau: the horizon softens, the snow runs thicker, fewer stars come through
    const STARS0 = night ? 0.8 : copper ? 0.1 : 0.25, STARS1 = (night ? 1 : copper ? 0.45 : 0.85) * (blizzard ? 0.7 : 1);
    const starLevel = (k) => lerp(STARS0, STARS1, k);      // the level of the star field as the cut in time goes: live's rule, in one place
    await ctx.yield();

    // ---- the land
    // (the icefall's two crevasses and the plateau's pressure ridge each have a named stream of their own)
    const crev = await makeCrevasses(ctx, F.crevasses, noise, look.spacing, ctx.core.makeRng(ctx.core.hashSeed('sledge-icefall-crevasses:' + ctx.seed)));
    // where the tent stands: on the two's line of march, at a share of it dealt from the camp's stream
    const TENT = tentOn(F.camp.range(0.12, 0.16));
    // the pressure ridge: its line lies 98 to 148 m behind the cornice's crest (measured at the centre line), up to 0.08
    // of a radian off the lip's own line, its middle within 75 m either side of the centre line, 220 to 300 m long.
    // The road is typed, and crosses it or not.
    const rr = ctx.core.makeRng(ctx.core.hashSeed('sledge-pressure-ridge:' + ctx.seed));
    const RIDGE = { d0: rr.range(815, 865), tilt: rr.range(-0.08, 0.08), xc: rr.range(-75, 75), half: rr.range(110, 150), key: rr.range(0, 100) };      // (polish 1, S4a: its middle is dealt evenly about the centre line; it was -140 to 10)
    // (polish 1) the plateau's crevasses, from a stream of their own. What must stay whole, and the one keep-clear each
    // asks: the road's typed line on the plateau (5 m: the road crosses each row on a bridge of snow), the two's line of march from the gully's head to the tent
    // (10 m), the tent (24 m), and the lava: where a tongue runs the ice is gone (40 m from each tongue's line, from
    // its source on the wall, as the lava part has it, to its snout).
    const NEW = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const segD = (x, z, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], t = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / Math.max(1e-6, vx * vx + vz * vz), 0, 1); return Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); };
    const TONGUE_SRC = TONGUE_SOURCES, TONGUE_END = snoutsOf(surge);
    const ROAD_P = PATH.filter((q) => q[2] <= LIP_Z + 20).map((q) => [q[0], q[2]]), MARCH_P = [MARCH_HEAD, MARCH_BEND, TENT];
    const keepWhole = (x, z) => { let k = Math.hypot(x - TENT[0], z - TENT[1]) - 24;
      for (let i = 0; i < ROAD_P.length - 1; i++) k = Math.min(k, segD(x, z, ROAD_P[i], ROAD_P[i + 1]) - 5);
      for (let i = 0; i < MARCH_P.length - 1; i++) k = Math.min(k, segD(x, z, MARCH_P[i], MARCH_P[i + 1]) - 10);
      for (let i = 0; i < 4; i++) k = Math.min(k, segD(x, z, TONGUE_SRC[i], TONGUE_END[i]) - 40);
      // the pressure ridge's slabs stay whole: 15 m either side of its line (its wander counted), over its own length
      if (Math.abs(x - RIDGE.xc) < RIDGE.half + 6) k = Math.min(k, Math.abs(-z + 0.00075 * x * x - RIDGE.d0 - RIDGE.tilt * x) - 15);
      return k; };
    // (third part: every open crevasse is a true trench; nothing about them reads the road but the one keep-clear)
    const crev2 = await makePlateauCrevasses(ctx, { rng: NEW('sledge-plateau-crevasses'), noise, portal: PORTAL, dir: PORTAL_DIR, keep: keepWhole });
    const PTS = PATH.map((p) => p.slice());      // the road as this build works it (its keys may be lifted for clearance below)
    const land = makeLand(noise, crev, TENT, RIDGE, crev2, PTS[PTS.length - 1]);
    await ctx.yield();
    // ---- the flight: canonical for the land, mirrored for the engine.
    // CLEARANCE, on this seed's own land: the route is walked in steps of 2 m; where the snow comes nearer than 1.5 m
    // under it, the points of the route either side of that place are lifted by what is missing, and it is walked again.
    const tc0 = new THREE.Vector3(), MIN_GAP = 1.5, clearance = { lifted: 0 };
    // the sledge track runs up the clean ramp, parallel to the flight above z -380
    const trackX = (z) => TRACK_X + smoothstep(-380, -150, z) * (5 * noise.n2(z / 95, 4.4) + 3 * smoothstep(-60, 120, z));
    let pathC = makePath(PTS);
    // the two points of the road nearest a place (the road turns on the plateau, so z alone does not say where we are)
    const twoNearest = (x, z) => { let a = 0, b = 1, da = Infinity, db = Infinity; for (let i = 0; i < PTS.length; i++) { const d = Math.hypot(PTS[i][0] - x, PTS[i][2] - z); if (d < da) { b = a; db = da; a = i; da = d; } else if (d < db) { b = i; db = d; } } return [a, b]; };
    for (let pass = 0; pass < 8; pass++) {
      let worst = 0, xAt = 0, zAt = 0;
      for (let d = 0; d <= pathC.length; d += 2) { pathC.posAtDist(d, tc0); const lack = MIN_GAP - (tc0.y - land.height(tc0.x, tc0.z)); if (lack > worst) { worst = lack; xAt = tc0.x; zAt = tc0.z; } }
      if (worst <= 0) break;
      const [k, k2] = twoNearest(xAt, zAt);
      PTS[k][1] += worst + 0.1; PTS[k2][1] += worst + 0.1; clearance.lifted += worst + 0.1; pathC = makePath(PTS);
      await ctx.yield();
    }
    await ctx.yield();
    // the camp (tent, sledge, skis: 4.5 m round the tent, 2.4 m high) against the route: it keeps 2 m of air; if it
    // does not, the points of the route either side of the camp are lifted by what is missing
    // (each road tried is walked once, in steps of 2 m, and the walk kept)
    const walked = new WeakMap(), walkOf = (pth) => { let w = walked.get(pth); if (!w) { const n = Math.floor(pth.length / 2) + 1; w = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pth.posAtDist(i * 2, tc0); w[i * 3] = tc0.x; w[i * 3 + 1] = tc0.y; w[i * 3 + 2] = tc0.z; } walked.set(pth, w); } return w; };
    const gapOf = (pth, x, y0, y1, z) => { let best = Infinity; const w = walkOf(pth);
      for (let i = 0; i < w.length; i += 3) { const dx = w[i] - x, dz = w[i + 2] - z, py = w[i + 1], dy = py < y0 ? y0 - py : py > y1 ? py - y1 : 0, d2 = dx * dx + dy * dy + dz * dz; if (d2 < best) best = d2; }
      return Math.sqrt(best); };
    for (let pass = 0; pass < 6; pass++) {
      const lack = CAMP_REACH + 2 - gapOf(pathC, TENT[0], PLATEAU, PLATEAU + 2.4, TENT[1]);      // (third part: the camp measured as it now stands; it was 4.5 m round)
      if (lack <= 0) break;
      const [k, k2] = twoNearest(TENT[0], TENT[1]);
      PTS[k][1] += lack + 0.2; PTS[k2][1] += lack + 0.2; clearance.lifted += lack + 0.2; pathC = makePath(PTS);
      await ctx.yield();
    }
    await ctx.yield();
    // the two and their sledge (1.9 m high) against the route: along the whole of their haul (from 8 m behind where they
    // start, for the sledge, to as far as 0.9 m/s takes them in the flight's 48 s) the route keeps 4 m from them; if it
    // does not, the points of the route beside the haul are moved away from the track by what is missing
    const haulGap = () => { let g = Infinity; for (let z = Z_TWO + 8; z >= Z_TWO - 0.9 * DUR - 2; z -= 2) { const x = trackX(z), y = land.height(x, z); g = Math.min(g, gapOf(pathC, x, y, y + 1.9, z)); } return g; };
    for (let pass = 0; pass < 6; pass++) {
      const lack = 4 - haulGap();
      if (lack <= 0) break;
      for (const q of PTS) if (q[2] < Z_TWO + 50 && q[2] > Z_TWO - 0.9 * DUR - 30) q[0] -= lack + 0.2;
      clearance.moved = (clearance.moved || 0) + lack + 0.2; pathC = makePath(PTS);
      await ctx.yield();
    }
    await ctx.yield();
    clearance.two = haulGap();
    await ctx.yield();
    // the road against the lava: it swings by the snouts of the tongues but keeps 60 m from each (the snout's own place,
    // this visit's eruption); if it does not, the points of the swing are moved back toward the track by what is missing
    const SNOUTS = snoutsOf(surge);
    const snoutGap = () => { let g = Infinity; for (const sn of SNOUTS) { const y = land.height(sn[0], sn[1]); g = Math.min(g, gapOf(pathC, sn[0], y, y + 12, sn[1])); } return g; };
    for (let pass = 0; pass < 4; pass++) {
      const lack = 60 - snoutGap();
      if (lack <= 0) break;
      for (const q of PTS) if (q[2] < -150 && q[2] > -390) q[0] -= lack + 0.5;
      clearance.swing = (clearance.swing || 0) + lack + 0.5; pathC = makePath(PTS);
      await ctx.yield();
    }
    clearance.snout = snoutGap();
    // how near the road passes the tent (a distance that results: the tent stands by the rule of the line of march, the road is typed)
    clearance.tent = gapOf(pathC, TENT[0], PLATEAU, PLATEAU + 1.2, TENT[1]);
    // the ring has a light of its own, steady and cold-white, the same wherever the eye is
    S.uRing.value.set(PORTAL[0] * mx, PTS[PTS.length - 1][1], PORTAL[1], 1.7);
    await ctx.yield();
    await ctx.yield();
    const path = mx > 0 ? pathC : makePath(PTS.map((p) => [-p[0], p[1], p[2]]));
    await ctx.yield();
    // the route in steps of 2 m, for the tests of the things that stand near it: the gap from the route to an upright
    // thing standing at (x, z) from height y0 to y1
    const LEN = pathC.length, RN = Math.ceil(LEN / 2), RP = new Float32Array((RN + 1) * 3);
    for (let i = 0; i <= RN; i++) { pathC.posAtDist(Math.min(LEN, i * 2), tc0); RP[i * 3] = tc0.x; RP[i * 3 + 1] = tc0.y; RP[i * 3 + 2] = tc0.z; }
    const routeGap = (x, y0, y1, z) => { let best = Infinity;
      for (let i = 0; i <= RN; i++) { const dx = RP[i * 3] - x, dz = RP[i * 3 + 2] - z, py = RP[i * 3 + 1], dy = py < y0 ? y0 - py : py > y1 ? py - y1 : 0, d2 = dx * dx + dy * dy + dz * dz; if (d2 < best) best = d2; }
      return Math.sqrt(best); };

    // THE SCRIPT is written in metres along the route, counted from places in the world. A place is where the route
    // crosses a line across the glacier (the path only ever climbs toward -z, so each line is crossed once); the
    // crossing is found on the path, and u is whatever comes out of it.
    //   S_CREV  the last row of crevasses is behind us
    //   S_TWO   level with the place where the two took up the traces
    //   S_FOOT  the foot of the icefall, where the ramp ends
    //   S_LIP   the lip of the plateau
    //   S_FLAT  the plateau lies flat and open
    //   S_CAMP  level with the tent
    const sCross = (d) => { let a = 0, b = LEN; for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (-pathC.posAtDist(m, tc0).z < d) a = m; else b = m; } return (a + b) / 2; };
    const sAt = (u) => clamp(u, 0, 1) * LEN, uAt = (s) => clamp(s / LEN, 0, 1);
    const upAt = (u) => -pathC.pointAt(clamp(u, 0, 1), tc0).z;
    const S_CREV = sCross(CREV_END), S_TWO = sCross(-Z_TWO), S_FOOT = sCross(FALL_FOOT), S_LIP = sCross(-LIP_Z), S_FLAT = sCross(FLAT);
    await ctx.yield();
    const sNear = (x, z) => { let best = Infinity, bi = 0; for (let i = 0; i <= RN; i++) { const dx = RP[i * 3] - x, dz = RP[i * 3 + 2] - z, d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = i; } } return Math.min(LEN, bi * 2); };
    const S_CAMP = sNear(TENT[0], TENT[1]);
    clearance.keys = { LEN, S_CREV, S_TWO, S_FOOT, S_LIP, S_FLAT, S_CAMP, tent: TENT };
    // DECLARED PACING, by metres flown (the pass IS the journey). The flight keeps the two's company for the last 34 m of
    // route before the place where it draws level with them (S_LEVEL): it slows over the 50 m before that stretch and
    // flies it at the slowest pace the engine gives (0.35 against 2.3 on the open glacier, about 4 m/s against their
    // 0.9); from the level place it gathers speed over 40 m into the icefall's gully; it slows as it tops the lip (10 m
    // before to 45 m past), and again by the tent (from 70 to 40 m before it until 15 to 50 m past).
    // S_LEVEL is a place found, not typed: the two haul at 0.9 m/s on the flight's own clock, so where the flight draws
    // level with them depends on the pace, and the pace on that place; the pair is settled here by halving the
    // difference a few times.
    let S_LEVEL = S_TWO + 20;
    const paceS = (s) => 2.3 - 1.95 * smoothstep(S_LEVEL - 84, S_LEVEL - 34, s) + 2.15 * smoothstep(S_LEVEL, S_LEVEL + 40, s) - 0.7 * smoothstep(S_LIP - 10, S_LIP + 45, s)
      - 0.4 * smoothstep(S_CAMP - 70, S_CAMP - 40, s) + 0.6 * smoothstep(S_CAMP + 15, S_CAMP + 50, s);
    const pace = (u) => paceS(sAt(u));
    // the cut in time (later the same night) is made as we top the lip: from 25 m below it to 110 m past it
    const nightK = (u) => smoothstep(S_LIP - 25, S_LIP + 110, sAt(u));
    // the flight's own clock, as the engine keeps it: the pace read at 65 places along the route, held between 0.35 and
    // 2.5, straight between them; the seconds each stretch takes
    const CN = 512, clock = new Float32Array(CN + 1), p64 = new Float32Array(65);
    const flightTime = (u) => { const f = clamp(u, 0, 1) * CN, i = Math.min(CN - 1, Math.floor(f)); return lerp(clock[i], clock[i + 1], f - i); };
    const setClock = () => { for (let i = 0; i <= 64; i++) p64[i] = clamp(pace(i / 64), 0.35, 2.5);
      let acc = 0; clock[0] = 0; for (let i = 1; i <= CN; i++) { const x = (i - 0.5) / CN * 64, j = Math.min(63, Math.floor(x)); acc += 1 / lerp(p64[j], p64[j + 1], x - j); clock[i] = acc; }
      for (let i = 0; i <= CN; i++) clock[i] *= DUR / acc; };
    // how far the two have hauled: 0.9 m/s over the flight's own clock
    const walk = (u) => 0.9 * flightTime(u);
    const levelAt = () => { let s = S_TWO; while (s < S_FOOT + 60 && upAt(uAt(s)) < -Z_TWO + walk(uAt(s))) s += 0.25; return s; };
    await ctx.yield();
    for (let it = 0; it < 14; it++) { setClock(); const s = levelAt(); if (Math.abs(s - S_LEVEL) < 0.2) break; S_LEVEL = 0.5 * (S_LEVEL + s); }
    setClock();
    clearance.keys.S_LEVEL = S_LEVEL;
    await ctx.yield();
    const snowA = new THREE.Color(0.62, 0.68, 0.76), snowB = new THREE.Color(0.56, 0.63, 0.74), scoria = new THREE.Color('#2b282e');
    const landColor = (x, z, h, ny, out) => {
      const n1 = noise.n2(x * 0.006 + 17, z * 0.006 - 9), n2 = noise.n2(x * 0.03 + 5, z * 0.03 + 77);
      out.copy(snowA).lerp(snowB, smoothstep(-0.4, 0.6, n1)).multiplyScalar(1 + 0.06 * n2);
      // the fire side's wall is scoria under old snow
      const d = land.up(x, z);
      if (x > HALF - 10 && d < 700) out.lerp(scoria, smoothstep(HALF - 10, HALF + 110, x) * (0.45 + 0.3 * n2) * (1 - smoothstep(640, 700, d)));
      return out;
    };
    // (fifth part, J5: on the night visit the kit's glint patches on the hard snow are at 0.2 (0.5 on the others, as
    //  live's): under the low afterglow their highlight stood as white blobs on the dark snow near the eye)
    const terrain = await T.makeTerrainAsync({ rng: F.land, noise, path: pathC, height: land.height, color: landColor, biome: 'arctic', corridor: false,
      bounds: BOUNDS, cell: 2, near: 40, maxTriangles: 110000, skirt: 30, ao: 0.5,
      palette: { rock: '#1b1a20', rockB: '#2a2830', rockSlope: [0.02, 0.1], strata: 0.15, snow: null, patch: '#ffffff', patchAmount: 0.06, ripples: 0.22, rippleLength: 2.4, pebbles: 0, cracks: 0,
        sparkle: night ? 0.2 : 0.5, drift: 1, lee: 0.3, clouds: 0, joints: 0, bump: 0.3, detail: 0.3, wind: [WIND[0] * mx, WIND[1]], bounce: '#5f7fb8', bounceAmount: 0, roughness: 0.85 } }, ctx.yield);
    const landU = { ...sharedUniforms(S), tCrev: { value: crev.texture }, uCvBox: { value: crev.box }, uLand: { value: new THREE.Vector4(LIP_Z, HALF, mx, waning ? 1.45 : surge ? 1.15 : 1) },
      uRampW: { value: new THREE.Vector4(RAMP[0], RAMP[1], WIND[0], WIND[1]) }, uAshCol: { value: new THREE.Color('#58575d') }, uSnouts: { value: SNOUTS.map((sn, i) => new THREE.Vector3(sn[0], sn[1], [26, 30, 26, 22][i])) },
      uIce: { value: new THREE.Color('#2f8fc4').multiplyScalar(0.45) }, uIceDeep: { value: new THREE.Color('#061226') }, uIceGlow: { value: new THREE.Color('#35C2E8').multiplyScalar(0.12) },
      uRibCol: { value: new THREE.Color('#1c1a20') },
      tCrev2: { value: crev2.texture }, uCv2Box: { value: crev2.box }, uCrater: { value: new THREE.Vector4(CRATER[0], CRATER[2], 0, 0) }, uDoorLit: { value: 0 }, uTent: { value: new THREE.Vector4(0, -1e5, 0, 1) }, uLampCol: { value: new THREE.Color('#FFB060') } };
    // (fourth part, E2) the plateau's near shading must not show the land's mesh. The land's form stays live's; on the
    // plateau (from 704 to 740 m up the lip's own measure, and all of it beyond) each vertex's normal becomes the mean of
    // its own and its neighbours', taken twice (about two cells either way), so no 2 m cell is shaded as a plate of
    // its own; the fine wind relief that the shader lays over it (below a cell's size) carries the detail.
    { let tm = null; terrain.object.traverse((ob) => { if (!tm && ob.geometry && ob.geometry.getAttribute('aShade') && ob.geometry.index) tm = ob; });
      if (tm) { const gm = tm.geometry, PA = gm.getAttribute('position').array, NA = gm.getAttribute('normal').array, IA = gm.index.array, nv = NA.length / 3;
        let n0 = new Float32Array(NA), n1 = new Float32Array(nv * 3);
        for (let pass = 0; pass < 2; pass++) { n1.set(n0);
          for (let t = 0; t < IA.length; t += 3) { const a = IA[t] * 3, b = IA[t + 1] * 3, c = IA[t + 2] * 3;
            for (let k = 0; k < 3; k++) { const va = n0[a + k], vb = n0[b + k], vc = n0[c + k]; n1[a + k] += vb + vc; n1[b + k] += va + vc; n1[c + k] += va + vb; }
            if (t % 60000 === 0) await ctx.yield(); }
          for (let i = 0; i < nv * 3; i += 3) { const l = Math.hypot(n1[i], n1[i + 1], n1[i + 2]) || 1; n1[i] /= l; n1[i + 1] /= l; n1[i + 2] /= l; }
          const sw = n0; n0 = n1; n1 = sw; await ctx.yield(); }
        for (let i = 0; i < nv; i++) { const i3 = i * 3; if (NA[i3 + 1] < 0.3) continue;      // (the skirt's own vertices keep theirs)
          const w = smoothstep(704, 740, land.up(PA[i3], PA[i3 + 2])); if (w <= 0) continue;
          const x = lerp(NA[i3], n0[i3], w), y = lerp(NA[i3 + 1], n0[i3 + 1], w), z = lerp(NA[i3 + 2], n0[i3 + 2], w), l = Math.hypot(x, y, z) || 1; NA[i3] = x / l; NA[i3 + 1] = y / l; NA[i3 + 2] = z / l;
          if ((i & 16383) === 0) await ctx.yield(); }
        gm.getAttribute('normal').needsUpdate = true; } }
    patchLand(terrain.material, landU);
    stage.add(terrain.object);
    updaters.push((dt, t) => terrain.update(dt, t));
    await ctx.yield();

    // ---- the far snow, to the horizon; far away it takes the sky's own horizon colour for that direction
    const hor = []; { const d = new THREE.Vector3(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; hor.push(sky.colorAt(d.set(Math.sin(a), 0.012, -Math.cos(a)).normalize(), new THREE.Color())); } }
    const farGeo = new THREE.CircleGeometry(6200, 64).rotateX(-Math.PI / 2).translate(0, PLATEAU - 1.5, -1000);
    const farMat = new THREE.ShaderMaterial({ uniforms: { ...sharedUniforms(S), uHole: { value: new THREE.Vector4(BOUNDS[0] + 8, BOUNDS[1] + 8, BOUNDS[2] - 8, BOUNDS[3] + 400) }, uSnow: { value: snowA.clone().lerp(snowB, 0.5) },
      uHor: { value: hor }, uFarW: { value: new THREE.Vector4(WIND[0], WIND[1], mx, 0) }, uFarCr: { value: new THREE.Vector4(CRATER[0], CRATER[2], 0, 0) } }, vertexShader: FAR_VS, fragmentShader: FAR_FS });
    const farSnow = new THREE.Mesh(farGeo, farMat); farSnow.name = 'far-snow'; farSnow.frustumCulled = false; stage.add(farSnow);
    await ctx.yield();

    // ---- the fire side: the black volcano, its plume, the lava front, and the two with their sledge
    const hero = await buildHero(ctx, { shared: S, ground: (x, z) => terrain.surfaceAt(x, z), look, track: { x: TRACK_X, z0: Z_TWO, zFoot: 206, xAt: trackX }, cast: { lead: look.lead, push: look.push }, mx,
      forks: { cone: F.cone, tongues: F.tongues, bursts: F.bursts, rollers: F.rollers, steam: F.steam, two: F.two }, gap: routeGap });
    // the plume against the route: the nearest of its spine's rings stays 150 m clear; if it does not, the plume is lifted
    { let g = Infinity; for (const q of (hero.spine || PLUME_SPINE)) g = Math.min(g, routeGap(q[0], q[1], q[1], q[2]) - q[3]); clearance.plume = g; if (g < 150 && hero.billows) hero.billows.object.position.y += 150 - g; }
    clearance.lava = hero.lava ? hero.lava.bursts.clearance : null;
    stage.add(hero.object);
    await ctx.yield();
    // ---- the white volcano
    const white = await makeCone(ctx, S, { name: 'white-volcano', top: WHITE_TOP, foot: 60, radius: 1300, key: 9.2, rock: '#16161c', snowCover: 0.9, lava: 0, seg: 160, ring: 52, rich: 1 });
    stage.add(white.object);
    await ctx.yield();

    // ---- the icefall: seracs either side of the gully; one tower beside the climb leans and goes over as we pass,
    //      (the one declared event of the icefall, below); the other towers stand; ice dust where it lands
    const groundAt = (x, z) => terrain.surfaceAt(x, z);
    const KEYED = [41, -612];
    const seracs = await makeSeracs(ctx, S, { rng: F.seracs, shapes: F.seracShapes, falls: F.falls, noise, ground: groundAt, zone: { up: land.up, from: 522, to: 670, half: HALF - 12, gully: 17 }, count: Math.round(420 * Math.min(1, detail)),
      // (the ice stands by the land's rule alone: outside the gully's 17 m, on the benches; one plain clearance of 8 m
      //  from the road for safety. The road bends toward one wall and then the other.)
      mx, keyed: KEYED, gap: routeGap, margin: 8, avoid: [[SNOUTS[3][0], SNOUTS[3][1], 26], [SNOUTS[2][0], SNOUTS[2][1], 22], ...crev.fall.map((c) => [c.xc, c.zc, 16])] });
    // the tongue beside the icefall is a fire of its own on the ice and the rock near it
    S.uFire2.value.set(SNOUTS[3][0] * mx, groundAt(SNOUTS[3][0], SNOUTS[3][1]) + 14, SNOUTS[3][1], 150);
    clearance.seracs = seracs.clearance;
    // the least distance from the road to standing ice that results
    { let near = Infinity; for (const q of seracs.placed) { const y = groundAt(q[0], q[1]); near = Math.min(near, routeGap(q[0], y, y + q[3], q[1]) - q[2]); } clearance.seracNearest = near; }
    stage.add(seracs.object);
    await ctx.yield();
    // ---- moraine: dark rock on the ice along both margins, a medial stripe, strays by the way in
    const moraine = await makeMoraine(ctx, S, { rng: F.moraine, shapes: F.moraineShapes, ground: groundAt, half: HALF, mx, count: Math.round(320 * Math.min(1, detail)),
      blocked: (x, z) => crev.at(x, z) > 0.2 || (x > RAMP[0] - 4 && x < RAMP[1] + 4), gap: routeGap, margin: 12 });
    clearance.moraine = moraine.clearance;
    stage.add(moraine.object);
    await ctx.yield();
    // ---- the camp on the plateau: the tent, the tipped sledge, the skis, the track from the lip; its one point light
    // (the track is the two's own line of march: from the gully's head over the cornice to its back, then straight for
    //  the way out as far as the tent; it wanders a metre or so either side of that line by the plateau's own metres)
    const campTrack = [MARCH_HEAD, [MARCH_HEAD[0] - 1.5, (MARCH_HEAD[1] + MARCH_BEND[1]) / 2], [MARCH_BEND[0] + 2, MARCH_BEND[1] + 14]];
    { const lx = TENT[0] - MARCH_BEND[0], lz = TENT[1] - MARCH_BEND[1], ll = Math.hypot(lx, lz);
      for (let d = 0; d < ll - 14; d += 4) { const w = 1.2 * Math.sin(d / 9) * smoothstep(0, 12, d); campTrack.push([MARCH_BEND[0] + lx / ll * d + lz / ll * w, MARCH_BEND[1] + lz / ll * d - lx / ll * w]); } }
    const camp = await makeCamp(ctx, S, { rng: F.camp, ground: groundAt, at: TENT, wind: WIND, march: [(PORTAL[0] - MARCH_BEND[0]) / Math.hypot(PORTAL[0] - MARCH_BEND[0], PORTAL[1] - MARCH_BEND[1]), (PORTAL[1] - MARCH_BEND[1]) / Math.hypot(PORTAL[0] - MARCH_BEND[0], PORTAL[1] - MARCH_BEND[1])], trackFrom: [TRACK_X, -690], trackPts: campTrack, life: F.campLife, glow: 2, lightIntensity: night ? 60 : copper ? 30 : 46 });
    stage.add(camp.object);
    // (a little bloom at the wall the two sleep along, the one that carries their shadows; its place comes from the camp's own frame)
    const tentGlow = fx.makeGlow({ position: MX(camp.litWall), color: '#FFB060', size: 3, intensity: 0, halo: 1, core: 0.2 });
    scene.add(tentGlow.object);
    updaters.push((dt, t, camera, u) => {
      // the lamp shows as we top the lip: from 40 m below it to 60 m past
      const k = smoothstep(S_LIP - 40, S_LIP + 60, sAt(u)); camp.setLit(k); camp.update(t); tentGlow.uniforms.uIntensity.value = 0.07 * k; tentGlow.update(dt, t); });
    await ctx.yield();
    // ---- blown snow: banners off the lip, the tall seracs, the wall crests and the white summit; dust of the falls
    const em = [], er = F.banners, W3 = [WIND[0], 0, WIND[1]];
    seracs.fallers.forEach((f, i) => { if (i > 7) return; const lx = f.x + f.dir.x * f.h * 0.55, lz = f.z + f.dir.z * f.h * 0.55;
      em.push({ p: [lx, groundAt(lx, lz) + 2, lz], v: [f.dir.x * 5, 3.5, f.dir.z * 5], spread: f.h * 0.45, vr: 3.5, n: 16, life: 5.5, size: [3, 15], tone: 0, group: i, delay: 0.6, grav: 0.25, drag: 0.9, alpha: 0.5 }); });
    for (let x = -165; x <= 165; x += er.range(22, 36)) { if (Math.abs(x) < 20) continue; const z = -(717 - 0.00075 * x * x - land.lipWob(x)) + er.range(-4, 4);      // on the cornice's crest: the snow smokes off it
      em.push({ p: [x, groundAt(x, z) + 0.8, z], v: [W3[0] * 9, 1.5, W3[2] * 9], spread: 3.5, vr: 1.4, n: 24, life: 3.6, size: [1.4, 7], tone: 0, alpha: 0.3, drag: 0.25 }); }
    { const tall = seracs.placed.slice().sort((a, b) => b[3] - a[3]).slice(0, 16);
      for (const t of tall) em.push({ p: [t[0], groundAt(t[0], t[1]) + t[3] * 0.95, t[1]], v: [W3[0] * 8, 0.8, W3[2] * 8], spread: 0.8, vr: 0.9, n: 12, life: 2.4, size: [0.7, 3.4], tone: 0, alpha: 0.24, drag: 0.25 }); }
    for (const sx of [-1, 1]) for (let z = -120; z > -640; z -= er.range(70, 120)) { const x = sx * (HALF + er.range(105, 150));
      em.push({ p: [x, groundAt(x, z) + 1, z], v: [W3[0] * 10, 1.6, W3[2] * 10], spread: 5, vr: 1.5, n: 12, life: 4, size: [2.5, 9], tone: sx > 0 ? 0.55 : 0, alpha: 0.22, drag: 0.2 }); }
    em.push({ p: [WHITE_TOP[0], WHITE_TOP[1] - 6, WHITE_TOP[2]], v: [W3[0] * 30, 5, W3[2] * 30], spread: 26, vr: 5, n: 18, life: 15, size: [45, 230], tone: 0, alpha: 0.34, drag: 0.05 });
    // ---- ground streamers over the plateau
    // (fourth part, E2) how high the land's own surface stands over the plateau's level, every 2 m over the whole
    // plateau (the mesh's own heights, -0.5 to 2.5 m in 255 steps), so that a sheet of blown snow thins out where it
    // comes down to the snow (see makeSpindrift)
    const DG = { x0: BOUNDS[0], z0: BOUNDS[1], nx: (BOUNDS[2] - BOUNDS[0]) / 2 + 1, nz: Math.floor((-680 - BOUNDS[1]) / 2) + 1, lo: -0.5, span: 3 };
    const dgData = new Uint8Array(DG.nx * DG.nz);
    for (let j = 0; j < DG.nz; j++) { const z = DG.z0 + 2 * j; for (let i = 0; i < DG.nx; i++) dgData[j * DG.nx + i] = Math.round(255 * clamp((groundAt(DG.x0 + 2 * i, z) - PLATEAU - DG.lo) / DG.span, 0, 1));
      if (j % 6 === 5) await ctx.yield(); }
    const dgTex = new THREE.DataTexture(dgData, DG.nx, DG.nz, THREE.RedFormat, THREE.UnsignedByteType); dgTex.magFilter = THREE.LinearFilter; dgTex.minFilter = THREE.LinearMipmapLinearFilter; dgTex.generateMipmaps = true; dgTex.unpackAlignment = 1; dgTex.needsUpdate = true;
    const drift = makeSpindrift(S, { ground: { texture: dgTex, box: [DG.x0 - 1, DG.z0 - 1, 1 / (2 * DG.nx), 1 / (2 * DG.nz)], lo: PLATEAU + DG.lo, span: DG.span }, lee: [TENT[0], TENT[1], CAMP_REACH * 0.5, CAMP_REACH + 4], y: PLATEAU, wind: [WIND[0] * mx, WIND[1]], amount: (blizzard ? 1.6 : 1.0) * (copper ? 0.55 : 1), centre: [0, -1000], half: 420, layers: blizzard ? [0.3, 0.7, 1.15, 1.7] : [0.3, 0.75], rng: F.drift });
    stage.add(drift.object);
    // THE TOWER BY THE CLIMB GOES OVER (the one declared event of the icefall; a pacing by metres flown): it stands
    // upright until the road reaches the icefall's foot (S_FOOT) and is down where the road comes level with it
    // (S_KEY, the road's place nearest the tower); between the two it goes from upright to down, always the whole way.
    // Its ice dust starts as it strikes (at eight ninths of that stretch) and is aged the same way, by the flight: by
    // the flight's own time at the place flown less the flight's time at the place of the strike (never by the world's
    // clock, which runs on while the world is still seen through a ring). The other five towers that could fall stand.
    const S_KEY = sNear(KEYED[0], KEYED[1]), S_HIT = S_FOOT + (S_KEY - S_FOOT) * 8 / 9, T_HIT = flightTime(uAt(S_HIT)), KEY_I = Math.max(0, seracs.fallers.findIndex((f) => f.keyed));
    clearance.keys.S_KEY = S_KEY;
    const fallAges = new Float32Array(seracs.fallers.length).fill(-1);
    updaters.push((dt, t, camera, u) => {
      fallAges[KEY_I] = seracs.fallSeconds * clamp((sAt(u) - S_FOOT) / Math.max(1, S_KEY - S_FOOT), 0, 1);
      puffs.setAge(KEY_I, sAt(u) >= S_HIT ? Math.max(0, flightTime(u) - T_HIT) : -1);
      seracs.update(dt, t, fallAges);
    });
    await ctx.yield();

    // ---- the air: ash on the glacier, fine blown snow on the plateau
    // the ash and the snow each fall on a clock of their own that starts where the seed puts it
    const timeAsh = { value: 0 }, timeSnow = { value: 0 }, ashPhase = F.ashClock.range(0, 600), snowPhase = F.snowClock.range(0, 600), skyPhase = F.skyClock.range(0, 600);
    const ash = fx.makeParticles({ rng: F.ash, preset: 'ash', count: Math.round(2400 * detail * (waning ? 1.6 : 1)), time: timeAsh, box: [46, 30, 46], velocity: [WIND[0] * mx * 2.2, -1.1, WIND[1] * 2.2 + 0.4], velocityRandom: [1.2, 0.5, 1.2],
      size: [0.03, 0.1], colors: ['#141216', '#2b282c', '#09080a'], intensity: 0.5, opacity: 0.9, near: [3.5, 11] });
    const snow = fx.makeParticles({ rng: F.snow, preset: 'snow', count: Math.round(3200 * detail), time: timeSnow, box: [54, 22, 54], velocity: [WIND[0] * mx * 9, -0.5, WIND[1] * 9], velocityRandom: [2.5, 0.6, 2.5],
      turbulence: [0.5, 0.25, 0.9], size: [0.02, 0.06], colors: ['#f4ead8', '#dfe8f8', '#c6d6f0'], intensity: 0.9, opacity: 0.8 });
    scene.add(ash.object, snow.object);
    await ctx.yield();

    // ---- the sprites of blown snow, dust and haze (one draw). The ash haze on the fire side and the ice dust that
    //      comes off the tall seracs' faces are dealt from the haze's own stream (one of the forks in the list above).
    const hz = F.haze;
    // (the haze's cards are up to 80 m across: each emitter keeps 100 m from the road, tested here; one that does not is
    //  set back toward the fire side by what is missing)
    for (let i = 0; i < 7; i++) { let x = hz.range(120, 270); const z = hz.range(-520, -70); { const g = routeGap(x, 0, 400, z); if (g < 100) x += 100 - g; }
      em.push({ p: [x, groundAt(x, z) + hz.range(8, 30), z], v: [W3[0] * 3.5, 0.3, W3[2] * 3.5], spread: 14, vr: 1.2, n: 5, life: 16, size: [26, 80], tone: 1, alpha: 0.2, drag: 0.05, flat: 0.3 }); }
    { const tall = seracs.placed.slice().sort((a, b) => b[3] - a[3]).slice(16, 28);
      for (const t of tall) { const a = hz.range(0, 6.28); em.push({ p: [t[0] + Math.cos(a) * t[2] * 0.7, groundAt(t[0], t[1]) + t[3] * hz.range(0.4, 0.7), t[1] + Math.sin(a) * t[2] * 0.7], v: [W3[0] * 1.5, -1.2, W3[2] * 1.5],
        spread: t[3] * 0.12, vr: 0.5, n: 5, life: 2.6, size: [0.5, 2.6], tone: 0, alpha: 0.2, grav: 1.2, drag: 0.5 }); } }
    for (const e of camp.emitters) em.push(e);
    // spindrift streams down the wind through the ring and past it (the ring's own light falls on it)
    em.push({ p: [PORTAL[0] - W3[0] * 16, PLATEAU + 2.2, PORTAL[1] - W3[2] * 16], v: [W3[0] * 5, 0.25, W3[2] * 5], spread: 2.6, vr: 0.8, n: 34, life: 5, size: [1.2, 4.6], tone: 0, alpha: 0.3, drag: 0.2, flat: 0.5 });
    const puffs = makePuffs(S, { rng: F.blownSnow, emitters: em, wind: [W3[0] * 5, 0, W3[2] * 5], name: 'blown-snow' });
    stage.add(puffs.object);

    // ================================================================ POLISH ROUND 1: what is added on and round the plateau
    // Every dealt thing here takes a NEW named stream, so nothing older deals anew. Places are rules of the land.
    // ---- the far crags, the last of the fire-hills: black rock standing through the ice far out, anywhere on the
    //      plateau from 650 m to 2,600 m out from its middle, but not where the land of the flight lies (nor the
    //      glacier's trough), nor within 1,500 m of the white mountain's axis or 1,750 m of the crater's; 380 m apart
    const cgr = NEW('sledge-far-crags'), crags = [];
    for (let tries = 0; crags.length < 11 && tries < 240; tries++) {
      const a = cgr.range(0, Math.PI * 2), d = cgr.range(650, 2600), x = Math.cos(a) * d, z = -1000 + Math.sin(a) * d, R = cgr.range(45, 120), H = R * cgr.range(0.55, 1.3), key = cgr.range(0, 100);
      if (x > BOUNDS[0] - 80 && x < BOUNDS[2] + 80 && z > BOUNDS[1] - 80) continue;
      if (Math.hypot(x - WHITE_TOP[0], z - WHITE_TOP[2]) < 1500 || Math.hypot(x - CRATER[0], z - CRATER[2]) < 1750) continue;
      if (crags.some((c) => Math.hypot(c.x - x, c.z - z) < 380)) continue;
      crags.push({ x, z, y: PLATEAU - 1.5, R, H, key });
    }
    // ---- where the far ground meets the white mountain: drifts all round its foot (every fourth a bank of moraine),
    //      so that no ruled line is left there. Round the whole mountain, at the radius where its skirt meets the plateau.
    const ftr = NEW('sledge-foot-drifts'), foot = [];
    for (let i = 0; i < 56; i++) { const a = (i + ftr.range(-0.3, 0.3)) / 56 * Math.PI * 2, r = 955 + ftr.range(-50, 110), x = WHITE_TOP[0] + Math.cos(a) * r, z = WHITE_TOP[2] + Math.sin(a) * r, rock = i % 4 === 3;
      const len = ftr.range(60, 170) * (rock ? 0.5 : 1), wid = ftr.range(28, 60) * (rock ? 0.6 : 1), h = ftr.range(9, 26) * (rock ? 0.55 : 1);
      if (x > BOUNDS[0] - 10 && z > BOUNDS[1] - 10) continue;
      foot.push({ x, z, y: PLATEAU - 3, yaw: -a - Math.PI / 2, len, wid, h, rock }); }
    const rocks = await makeRocks(ctx, S, { noise, crags, foot, wind: WIND, blocks: crev2.blocks, blockRng: NEW('sledge-plateau-blocks'), over: crev2.depthAt, trenches: crev2.trenches, ground: land.height });
    stage.add(rocks.object);
    await ctx.yield();
    // ---- new air (one draw, a stream of its own): spindrift streaming along the ground toward and through the ring;
    //      a snow banner off every crag; wind plumes off the white mountain's upper ridges; a thread of steam from the
    //      tent's vent, rising straight and bending down the wind; low steam over the wet ice by each snout
    const air = (() => { const ar = NEW('sledge-plateau-air'), e2 = [];
      for (const k of [28, 52, 78]) { const lat = ar.range(-5, 5);
        e2.push({ p: [PORTAL[0] - W3[0] * k - W3[2] * lat, PLATEAU + 0.5, PORTAL[1] - W3[2] * k + W3[0] * lat], v: [W3[0] * 7, 0.15, W3[2] * 7], spread: 5, vr: 0.8, n: 22, life: 7, size: [1.5, 6], tone: 0, alpha: 0.26, drag: 0.2, flat: 0.1 }); }
      for (const c of crags) e2.push({ p: [c.x, c.y + c.H * 0.9, c.z], v: [W3[0] * 14, 2, W3[2] * 14], spread: c.R * 0.12, vr: 2, n: 7, life: 9, size: [c.H * 0.12, c.H * 0.75], tone: 0, alpha: 0.3, drag: 0.08 });
      for (let i = 0; i < 5; i++) { const a = ar.range(0, Math.PI * 2), tt = ar.range(0.1, 0.3), q1 = 1 - tt, hy = 60 + (WHITE_TOP[1] - 60) * (0.5 * Math.pow(q1, 1.9) + 0.5 * q1);
        e2.push({ p: [WHITE_TOP[0] + Math.cos(a) * 1300 * tt, hy + 12, WHITE_TOP[2] + Math.sin(a) * 1300 * tt], v: [W3[0] * 24, 4, W3[2] * 24], spread: 16, vr: 4, n: 9, life: 11, size: [30, 150], tone: 0, alpha: 0.28, drag: 0.05 }); }
      const vent = camp.emitters[0].p;
      e2.push({ p: [vent[0], vent[1], vent[2]], v: [0, 2.4, 0], spread: 0.05, vr: 0.12, n: 14, life: 5, size: [0.22, 1.5], tone: 0, alpha: 0.5, drag: 0.7 });
      SNOUTS.forEach((sn, i) => { const rr2 = [26, 30, 26, 22][i]; e2.push({ p: [sn[0] - rr2 * 0.3, groundAt(sn[0] - rr2 * 0.3, sn[1]) + 1.5, sn[1]], v: [W3[0] * 1.5, 1.2, W3[2] * 1.5], spread: rr2 * 0.5, vr: 0.6, n: 7, life: 5, size: [2.5, 8], tone: 0, alpha: 0.26, drag: 0.3, flat: 0.05 }); });
      return makePuffs(S, { rng: ar, emitters: e2, wind: [W3[0] * 5, 0, W3[2] * 5], name: 'plateau-air', belly: 1, glowAt: [camp.emitters[0].p[0] * mx, camp.emitters[0].p[1] - 0.2, camp.emitters[0].p[2], 1.4], glowCol: '#FFB060', glowK: 0 }); })();
    stage.add(air.object);
    // ---- the banner carried on: the smoke's long banner does not end where live's last billow fades; it goes on down
    //      the wind over the far plateau, climbing a little and spreading, dark, many billows with torn edges, its side
    //      toward the crater dull red and that red dying with distance from the mountain (a stream of its own; the same
    //      slow billows as the column's). No veil falls from it: its lower edge stays far above the skyline.
    const far = (() => { const fr2 = NEW('sledge-far-banner'), e3 = [], SP = [[-2300, 2025, -1520, 200], [-3100, 2150, -1370, 290], [-3900, 2300, -1220, 360], [-4600, 2450, -1090, 410]]      /* (second part, B4: it climbs as it goes, 2,025 to 2,450 m, so its far end never comes down toward the skyline) */, LIFE = 30, DRAG = 0.05, RISE = (1 - Math.exp(-DRAG * LIFE)) / DRAG;
      for (let i = 0; i < SP.length - 1; i++) { const a = SP[i], b = SP[i + 1], k = 1.5 / RISE;
        e3.push({ p: [a[0], a[1], a[2]], v: [(b[0] - a[0]) * k, (b[1] - a[1]) * k, (b[2] - a[2]) * k], spread: a[3] * 0.9, vr: 3, n: 40, life: LIFE, size: [a[3] * 0.9, b[3] * 1.2], tone: 1, alpha: [0.68, 0.6, 0.5][i], drag: DRAG, flat: 0.45 });      // (second part, B4: near three times the billows at 0.4 of the size: a ragged, billowed body)
        }      // (second part, B4: the veils of ash that fell from it are gone: they drew a dark wedge down toward the ring)
      return makePuffs(S, { rng: fr2, emitters: e3, wind: [0, 0, 0], name: 'far-banner', ashTone: waning ? '#6f6a66' : '#5b5653', renderOrder: 4, soft: 1, fogK: 0.4, belly: 14 }); })();
    stage.add(far.object);
    // ---- ash falling as black snow over the plateau (in the world's own metres; see the part)
    const ashfall = makeAshfall(S, { rng: NEW('sledge-plateau-ash'), count: Math.round(2600 * detail * (waning ? 1.5 : 1)), crater: [CRATER[0] * mx, CRATER[2]], mx, wind: [WIND[0] * mx, WIND[1]] });
    scene.add(ashfall.object);
    // ---- more stars over the dark half of the sky: a part of live's star field. The world hands them the field's own
    //      level each frame (starLevel, the one rule live's stars go by, called with the cut in time's own value as
    //      live's stars are), so they are as thin or as full as live's on every visit and come out with live's
    const stars = makeStars(S, { rng: NEW('sledge-night-stars'), count: 1500, away: [glowDir.x / Math.max(1e-3, Math.hypot(glowDir.x, glowDir.z)), glowDir.z / Math.max(1e-3, Math.hypot(glowDir.x, glowDir.z))] });
    scene.add(stars.object);
    // ---- (second part, B3a) the hoop's own rim: the engine's opening is asked bare (no wash inside its rim, which
    //      swelled and waned round it), and the world gives the hoop itself: a thin ring of one cold light, the same all
    //      the way round, in the ring's own plane (across the road's last heading), at the ring's place and radius
    { const hoop = new THREE.Mesh(new THREE.TorusGeometry(RING_R, HOOP_R, 8, 120), new THREE.MeshBasicMaterial({ color: new THREE.Color('#B9C9DE').multiplyScalar(1.3), fog: false }));
      hoop.position.set(PORTAL[0], PTS[PTS.length - 1][1], PORTAL[1]); hoop.rotation.y = Math.atan2(PORTAL_DIR[0], PORTAL_DIR[1]); hoop.name = 'ring-hoop'; stage.add(hoop); }
    // ---- the ice's far edge along the horizon
    const farEdge = makeFarEdge({ noise, centre: [0, -1000], y: PLATEAU - 1.5, hor });
    stage.add(farEdge.object);
    const LAMP_COL = new THREE.Color('#FFB060');      // the lamp's colour, parsed once
    // ---- the tent's place and long axis, for its shade and for the pool of light at its door (the camp's TENT_SHADE and DOOR_POOL)
    landU.uTent.value.set(TENT[0] * mx, TENT[1], WIND[0] * mx, WIND[1]);      // (the tent's long axis lies down the wind)
    await ctx.yield();

    // ---- gaze
    const tv = new THREE.Vector3();      // the gaze rests a little above and ahead of the two, so the mountain stays in the frame
    // where we draw level with the two (they are overtaken on the ramp: the flight is faster than their 0.9 m/s)
    const sPass = levelAt();
    // the first place of the road within r metres of the tent
    const sWithin = (r) => { for (let i = 0; i <= RN; i++) if (Math.hypot(RP[i * 3] - TENT[0], RP[i * 3 + 2] - TENT[1]) <= r) return Math.min(LEN, i * 2); return S_CAMP; };
    const S_T70 = sWithin(70), S_T40 = sWithin(40);
    clearance.keys.S_T70 = S_T70; clearance.keys.S_T40 = S_T40; clearance.ridge = RIDGE; clearance.fallCrevasses = crev.fall.map((c) => [c.xc, c.zc]);
    // (polish 1) the plateau's crevasses, read back: how many were dealt, how many are open at all after the keep-clear,
    // how many wide ones stand fully open somewhere, and the nearest open one to the road's line on the ground (its middle, in metres)
    { const open = crev2.list.filter((c) => c.open > 0); let near = Infinity, nearAt = null;
      for (const c of open) { if (c.open < 1) continue; let g = Infinity; for (let i = 0; i < ROAD_P.length - 1; i++) g = Math.min(g, segD(c.xc, c.zc, ROAD_P[i], ROAD_P[i + 1])); if (g < near) { near = g; nearAt = [c.xc, c.zc, c.w, c.half]; } }
      clearance.plateauCrevasses = { trenches: crev2.trenches.length, cut: crev2.list.filter((c) => c.cut).length, dealt: crev2.list.length, open: open.length, wide: open.filter((c) => c.wide && c.open >= 1).length, blocks: crev2.blocks.filter((b) => !b.out).length, near, nearAt }; }
    // a gaze window in route metres, its ramps in metres too
    const span = (from, to, ramp) => ({ from: uAt(from), to: uAt(to), fade: clamp(ramp / Math.max(1, to - from), 0.02, 0.5) });
    const pois = [
      // the plume's base: from the ring we came in by until the last row of crevasses is behind us (ramps of 90 m)
      { at: MX([430, 760, -2000]), ...span(0, S_CREV, 90), weight: 0.3 },
      // the two on the ramp: the gaze holds them from 150 m below the place they started until 28 m past the place where
      // we draw level (ramps of 25 m); as we come up with them it slides on up their line of march, so they leave by the
      // side of the frame
      { at: (time, u) => { const zc = -upAt(u), zt = Math.min(Z_TWO - walk(u) - 1, zc - 7), xt = trackX(zt); return tv.set(xt * mx, groundAt(xt, zt) + 1.4, zt); },
        ...span(S_TWO - 150, sPass + 28, 25), weight: 0.85 },
      // THE TENT (the one declared gaze pull on it): from the place where the road first comes within 70 m of the tent
      // until we are abreast of it; it eases in while the eye's distance to the tent falls from 70 m to 40 m, and out
      // over the same length of road before we are abreast
      { at: MX([TENT[0], PLATEAU + 1.2, TENT[1]]), ...span(S_T70, S_CAMP, S_T40 - S_T70), weight: 0.9 },
    ];
    // the fire's two slow beats start where the seed puts them
    const fk = F.flicker, FLICK = [fk.range(0, 6.283), fk.range(0, 6.283)];

    const FIRE_I = (waning ? 1.5 : surge ? 2.9 : 2.2) * (night ? 1.2 : 1), WASH_I = (waning ? 0.24 : surge ? 0.46 : 0.38) * (night ? 1.25 : 1);
    // what the clearance tests of this build chose (read by the builder's report)
    scene.userData.clearance = clearance;
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 62, near: 0.3, far: 6000 },
      pois,
      // (until the next world shows, the opening is one flat colour, that of the drift's snow behind it: a ring, not a disc)
      // (polish 1, S2: the ring is 14 m across, the guide's own measure for a portal (it was 12); its look stays the pinned
      //  thin hoop; the colour that fills it until the next place shows is the deep blue of the sky behind it, not a
      //  pale one, so that it reads as a hoop one can look through and never as a pale disc)
      portal: { shape: 'circle', radius: RING_R, color: '#B9C9DE', glow: 0.45, halo: false, frame: 0, style: 'ring', veil: night ? '#0a1330' : copper ? '#1d2a50' : '#132046', revealDistance: 110, blendDistance: 40 },
      post: { exposure: 1.1, bloom: { strength: 0.55, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 1.05, contrast: 1.06, shadowTint: '#060A18', vignette: 0.3, grain: 0.02 } },
      update(dt, t, camera, u) {
        timeAsh.value = t + ashPhase; timeSnow.value = t + snowPhase; S.uTime.value = t;
        const nk = nightK(u), level = 1 - 0.72 * nk;
        const flick = 1 + 0.25 * (0.6 * Math.sin(t * 1.885 + FLICK[0]) + 0.4 * Math.sin(t * 2.95 + FLICK[1]));
        S.uFire.value.y = FIRE_I * flick * level; S.uFire.value.z = WASH_I * (0.6 + 0.4 * flick) * level; S.uFire.value.w = hero.flash * 0.2;
        // (polish 1) the belly's light beats with the fire's own flicker; it does not go down with the cut in time
        S.uBelly.value.w = BELLY * (0.75 + 0.25 * flick); stars.uniforms.uLevel.value = starLevel(nk);
        landU.uDoorLit.value = camp.litNow; air.uniforms.uGlowCol2.value.copy(LAMP_COL).multiplyScalar(1.6 * camp.lit);
        if (blizzard) { const fd = 0.00045 * (1 + 1.5 * nk); scene.fog.density = fd; S.uFogDen.value = fd; }
        const g = GLOW * (1 + 0.25 * nk); sun.intensity = g; S.uGlowCol.value.copy(glowCol).multiplyScalar(g / Math.PI);
        hero.update(dt, t, camera, level, walk(u));
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, t, camera, u);
        if (sky.uniforms.uStars) sky.uniforms.uStars.value.x = starLevel(nk);
        sky.update(dt, t + skyPhase, camera);
        // the ash thins over the last 90 m below the lip and is gone 10 m past it; the blown snow comes in from 60 m below the lip to 40 m past
        const sr = sAt(u); ash.setOpacity(0.95 * (1 - smoothstep(S_LIP - 90, S_LIP + 10, sr))); snow.setOpacity((blizzard ? 1 : 0.8) * smoothstep(S_LIP - 60, S_LIP + 40, sr));      // ash below the lip, clean blown snow above it
      },
      dispose() { sky.dispose(); crev2.texture.dispose(); },     // the plateau's crevasse map reaches the land's shader only in its compile hook, where the engine's clearing cannot see it
    };
  },
};
