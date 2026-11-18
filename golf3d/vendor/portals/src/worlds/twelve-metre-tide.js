// Twelve Metres of Tide. A Breton granite harbour at dead low water; six hours of a giant spring tide pass while we
// watch from the bow of a small blue fishing boat, and the flood lifts us from the harbour floor to the level of the
// village. The hero (src/parts/twelve-metre-tide.js) is the harbour itself: quay, moles, lighthouse, forty boats, the tide.
//
// The flight (about 356 m, 54 s, slow then quick; pace() below). The boat lies 19 m off the quay, bow along it:
//   0.00-0.04  on rippled sand among pots and buoys, the wall towering on the left, clouds streaming, tractors leaving
//              the oyster tables, the old tunny boat standing on her legs against the low sun: a breath of dry floor, then the
//              sea comes from the gap, ahead and to starboard: a bright ragged line of foam that runs down the floor toward us
//              with a mirror behind it, boats righting and swinging to their moorings; our own bow comes up as it reaches the keel
//   0.04-0.15  the boat rises 10 m with the flood, closing on the face: the waterline climbs the weed (wrack floating up as it
//              is reached), the barnacles, the ochre and the black lichen line; ladders, tide gauges, drains, mooring rings,
//              chains and four mooring piles pass close, foam lines and rafts of torn wrack stream along the wall, each pile
//              trails a wake; the light runs from first light to full morning, the lamp fades, the fog thins
//   0.15-0.25  the rim drops below the eye and the boat runs 22 m along the quay edge past the square: stalls at eye level,
//              awnings popping, shutters opening
//   0.25-0.32  a right-hand turn round a moored boat, time back to real speed
//   0.32-0.50  down the starboard side of the old tunny boat, 8 m off and under her sails (the sun in the cloth), her image
//              lying on the water
//   0.50-0.62  through the gate between her smaller sister and a big moored boat, hulls and rigging on both hands, then the
//              channel perches with their cage top-marks
//   0.62-0.75  close under the lighthouse and out through the gap; the reef the mole was built on stands beyond it, the swell
//              breaking white on its ledges; a tan-sailed yawl and a far sail cross the sun's road
//   0.75-1.00  round the seaward stack of the reef: a sea arch of the same granite comes out from behind it with the portal
//              in its throat, its light on the stone and on the water; the yawl passes 19 m down our starboard side, a second
//              stack to port and the beacon skerry to starboard, and the last straight runs in under the arch
// The bow heads with the boat, not with the gaze, and rides level: it swings to one side of the frame or leaves it whenever we
// look at the quay, the square, a sail overhead or the lamp; it is under the frame down the tunny boat's side and from the reef on.
//
// Seeded looks (ctx.vary.hour honoured): morning burn-off (first light to blue morning), after rain (pearl overcast breaking,
// wet stone), evening flood (afternoon to golden hour, the lamp coming on, late hydrangeas), before first light (moonlit
// blue hour, lit windows, lamp pools on the wall, ending at sunrise). Within a look the seed also picks thick, usual or
// thin fog (in thick fog the far mole is hidden at the start), the paint family, the awnings and how many sails are out.
// Life at low water: a cloud of waders wheels over the flats at the edge of the sea (it rides the tide with the first gulls).
// Rare event: the old fleet comes home: nine red-sailed luggers standing in from the east along the seaward side of the
// reef, the leader crossing ahead of the portal as we come out; dolphins ride at the bow.
// Vehicle: the world builds its own boat bow, so ride: 'none'.
// THE KIT'S FLOCKS, the cure of a fault in live (the owner's rule texts R and T): four crossings could touch our line (gullsE at the start, gullsC past the rim, the quay's gullsQ, the gap's gullsS; all loose flocks that hand their own wander already). Each is now handed maxSigma 3 and crosses higher by its own number (heights 12.5, 9, 8 and 6.5; were 5, 7.5, 1.2 and 5.5), its spread as live (rule text U: the spreads here are tight already, 9, 2.5, 30 and under, and the courses lie 6.5 to 12.5 m over the line with them), so that the box of three scatters with the wander and the body stays 2.0 m and more clear of the line on every deal; keepClear is not called, nothing is added at the build. The waders' loop, which the world lifts with the tide, lies 8 m further to seaward (every z of WADER_LOOP plus 8): the kit's ball about its course then stays 2.8 m and more off our line in plan, at every height of the tide.
// NOT CURED, left as live for the owner to rule on: gullsA, the first loop, lifted with the tide. It wheels round our own line in plan (0 to 14 m from it) and the line climbs 10 m through its heights in place; by place it clears only if the loop leaves the boat (11 m and more to one side) or flies 16 m and more over the eye, and either changes how it reads.
// Least from the flown line on forty seeds (the two lifted flocks at 48 poses of the tide), in the order of the calls: gullsA touches (as live), 6.63, (gullsB 10.51, not touched), 2.62, (gullsD 3.08 and gullsF 4.33, not touched), 3.43, 2.48 and the waders 2.84 m; in live the four crossings read -0.46, -0.03, -1.32 and 1.47 and the waders touched. The count rests on maxSigma in live's kit.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeLightRig, SKY_PRESETS } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import { buildHero, GW, stepNormals } from '../parts/twelve-metre-tide.js';

const C = (h) => new THREE.Color(h);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TIDE_LOW = -0.55, TIDE_HIGH = 12, EYE_W = 3.2, DRAFT = 0.4, RIM = 14, BOW_DROP = 0.36;

// each look is a pair of skies: A at dead low water, B at high water; everything else is blended by the same clock.
// fill = sky colour added to every surface, pool = the lamp pools on wall and paving [low water, high water]
const LOOKS = {
  morning: {
    title: 'Twelve Metres of Tide',
    // first light, gold not pink, to a low warm morning sun over the south-east that lays a road of sparks on the water
    a: { preset: 'dawn', sunElevation: 7, sunAzimuth: 108, cov: 0.4, zenith: '#1c429a', mid: '#6f8cc8', horizon: '#f6c493', scatterColor: '#ffbe78', scatter: 0.44, lightColor: '#ffc592', lightIntensity: 2.5 },
    b: { preset: 'day', sunElevation: 20, sunAzimuth: 140, cov: 0.42, zenith: '#124cae', mid: '#5f93d8', horizon: '#f0cfa2', horizonPow: 5, scatterColor: '#ffc988', scatter: 0.42, scatterPow: 5, sunColor: '#ffe0b0', sunGlow: 0.5,
      lightColor: '#ffddb2', lightIntensity: 3.4, ambientColor: '#9dbdf4', cl: { lit: '#fff0dc', shade: '#7c93c4' }, c2: 0.13 },
    fog: [0.0024, 0.00105], lamp: [6.6, 2.0], beams: [1.7, 0.0], win: [1.0, 0.0], pool: [0.7, 0], shade: 0.4, mist: 0.22, fill: 0.2, band: 0.7,
    wet: 0, season: 'summer', hour: 8, exposure: 1.0, bloom: 0.4, sand: '#ad966f', sheen: 0.62, glitter: 1,
    grade: { saturation: 1.16, contrast: 1.08, tint: '#fff7ec', shadowTint: '#0a1226', vignette: 0.3, grain: 0.02, aberration: 0 },
    portal: '#ffe6b8',
  },
  pearl: {
    title: 'Twelve Metres of Tide, after rain',
    a: { preset: 'overcast', sunElevation: 20, sunAzimuth: 110, cov: 0.9 },
    // silver to the end: broken cloud with shafts of sun on wet granite, never a second blue day
    b: { preset: 'day', sunElevation: 25, sunAzimuth: 140, cov: 0.7, zenith: '#55779c', horizon: '#dde5e6', lightColor: '#fff6ea' },
    fog: [0.0052, 0.0019], lamp: [5.2, 2.0], beams: [1.2, 0.05], win: [0.7, 0.0], pool: [0.45, 0], shade: 0.3, mist: 0.42, fill: 0.2, band: 0.58,
    wet: 1, season: 'summer', hour: 9, exposure: 0.93, bloom: 0.4, sheen: 0.6, glitter: 0.8,
    grade: { saturation: 0.98, contrast: 1.1, tint: '#f6faff', shadowTint: '#0b1420', vignette: 0.3, grain: 0.022, aberration: 0 },
    portal: '#ffd9a0',
  },
  golden: {
    title: 'Twelve Metres of Tide, evening flood',
    a: { preset: 'day', sunElevation: 32, sunAzimuth: 224, cov: 0.4 },
    b: { preset: 'goldenHour', sunElevation: 8.5, sunAzimuth: 250, cov: 0.44 },
    fog: [0.0022, 0.0013], lamp: [2.0, 6.6], beams: [0.0, 1.1], win: [0.0, 1.05], pool: [0, 1.0], shade: 0.4, mist: 0.3, fill: 0.17,
    wet: 0, season: 'late', hour: 20, exposure: 1.0, bloom: 0.45, glitter: 0.9,
    grade: { saturation: 1.06, contrast: 1.06, tint: '#fff3e2', shadowTint: '#10102a', vignette: 0.32, grain: 0.02, aberration: 0 },
    portal: '#d8ecff',
  },
  night: {
    title: 'Twelve Metres of Tide, before first light',
    // the moon is the key light and stands to seaward, so it rakes the quay face
    a: { preset: 'blueHour', sunAzimuth: 100, cov: 0.34, key: 0, bodyOverrides: { 0: { elevation: 27, azimuth: 150, size: 1.9 } }, lightIntensity: 2.4, lightColor: '#a9bcff', ambientIntensity: 2.1 },
    b: { preset: 'dawn', sunElevation: 4.5, sunAzimuth: 128, cov: 0.38 },
    fog: [0.0034, 0.0016], lamp: [6.6, 4.4], beams: [2.3, 0.45], win: [1.5, 0.5], pool: [3.5, 0.7], shade: 0.22, mist: 0.36, fill: 0.22,
    wet: 0, season: 'summer', hour: 5, exposure: 1.2, bloom: 0.5, sand: '#9c8f76', sheen: 0.6, glitter: 0.8,
    grade: { saturation: 1.05, contrast: 1.04, tint: '#f2f4ff', shadowTint: '#070b22', vignette: 0.34, grain: 0.024, aberration: 0 },
    portal: '#ffd9a0',
  },
};

// ---- the bow of our own boat, in boat space: the eye at the origin looking down -Z, +Y up ------------------------------
// At 16:9 only the last 1.3 m of the foredeck shows above the bottom edge of the frame (its tip 22 degrees below the eye
// line); a tall screen sees most of it, so the deck is laid plank by plank and carries its gear.
function bowGeometry(blue) {
  const B = new GW(), TIP = -4.6, LEN = 4.6;
  const WOOD = ['#a48e69', '#93805c', '#ac9772', '#9a8763', '#8c7a58', '#a08a60'].map(C), SEAM = C('#241d16'), GREYW = C('#8f8a80');
  const WHITE = C('#e9e4d6'), HULL = C(blue), HULLD = C(blue).multiplyScalar(0.62), COVER = C('#d6d0c0');
  const OXIDE = C('#7c2f24'), DARK = C('#3a2c20'), ROPE = C('#b8a070'), RUST = C('#6a3a22'), ORANGE = C('#e0621f'), IRON = C('#23211f');
  const hw = (z) => 1.7 * Math.pow(clamp((z - TIP) / LEN, 0, 1), 0.42) + 0.035;
  const gy = (z) => -2.0 + 0.14 * Math.pow(clamp(-z / 4.6, 0, 1), 1.6);        // gunwale top (sheer rising to the stem)
  const dy = (z) => gy(z) - 0.24;                                              // deck
  // strakes run fore and aft, parallel to the king plank, and nib into the covering board: [x0, x1, id]
  const KW = 0.34, PW = 0.235, SW = 0.016, CB = 0.13, strakes = [[-KW / 2, KW / 2, 0]];
  for (let i = 0; i < 7; i++) { strakes.push([KW / 2 + i * PW, KW / 2 + (i + 1) * PW, 1 + i * 2], [-(KW / 2 + (i + 1) * PW), -(KW / 2 + i * PW), 2 + i * 2]); }
  const hsh = (n) => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
  const plank = (id, z) => {       // one tone along each board, butt joints staggered from strake to strake, greyer toward the stem
    const board = Math.floor((z + 9 + hsh(id) * 2.1) / 2.1), c = (id === 0 ? C('#86714f') : WOOD[Math.floor(hsh(id * 7.3 + board * 3.1) * 6) % 6]).clone();
    c.multiplyScalar(0.94 + 0.12 * hsh(id * 1.7 + board)); c.lerp(GREYW, 0.3 * sstep(-2.0, -4.6, z) + 0.06 * hsh(id + board * 5.5));
    return c;
  };
  const zs = []; for (let z = 0.6; z > TIP + 0.16; z -= 0.3) zs.push(z); zs.push(TIP + 0.12, TIP);
  for (let k = 0; k < zs.length - 1; k++) {
    const z0 = zs[k], z1 = zs[k + 1], w0 = hw(z0) * 0.93, w1 = hw(z1) * 0.93, l0 = Math.max(0, w0 - CB), l1 = Math.max(0, w1 - CB), zm = (z0 + z1) / 2;
    B.quad([-w0, dy(z0) - 0.006, z0], [w0, dy(z0) - 0.006, z0], [w1, dy(z1) - 0.006, z1], [-w1, dy(z1) - 0.006, z1], SEAM);      // the caulking shows between the boards
    for (const [xa, xb, id] of strakes) {
      const a0 = clamp(xa + SW / 2, -l0, l0), b0 = clamp(xb - SW / 2, -l0, l0), a1 = clamp(xa + SW / 2, -l1, l1), b1 = clamp(xb - SW / 2, -l1, l1);
      if (b0 - a0 < 0.004 && b1 - a1 < 0.004) continue;
      const butt = Math.floor((z0 + 9 + hsh(id) * 2.1) / 2.1) !== Math.floor((z1 + 9 + hsh(id) * 2.1) / 2.1), zb = butt ? z0 - 0.02 : z0;
      B.quad([a0, dy(z0), zb], [b0, dy(z0), zb], [b1, dy(z1), z1], [a1, dy(z1), z1], plank(id, zm), plank(id, zm).multiplyScalar(0.96));
    }
    for (const sd of [-1, 1]) {                                                // covering board, bulwark inside, cap rail, flared topside
      const c0 = [sd * l0, dy(z0) + 0.012, z0], c1 = [sd * l1, dy(z1) + 0.012, z1], e0 = [sd * w0, dy(z0) + 0.012, z0], e1 = [sd * w1, dy(z1) + 0.012, z1];
      if (sd > 0) B.quad(c0, e0, e1, c1, COVER); else B.quad(e0, c0, c1, e1, COVER);
      const i0 = [sd * w0, dy(z0), z0], i1 = [sd * w1, dy(z1), z1], t0 = [sd * w0, gy(z0), z0], t1 = [sd * w1, gy(z1), z1];
      const o0 = [sd * (hw(z0) + 0.05), gy(z0), z0], o1 = [sd * (hw(z1) + 0.05), gy(z1), z1];
      const b0 = [sd * hw(z0) * 0.82, gy(z0) - 0.95, z0 + 0.25], b1 = [sd * hw(z1) * 0.82, gy(z1) - 0.95, z1 + 0.25];
      if (sd > 0) { B.quad(i1, i0, t0, t1, HULLD, HULL); B.quad(t1, t0, o0, o1, WHITE); B.quad(o1, o0, b0, b1, HULL, HULLD); }
      else { B.quad(i0, i1, t1, t0, HULLD, HULL); B.quad(t0, t1, o1, o0, WHITE); B.quad(o0, o1, b1, b0, HULL, HULLD); }
      if (k % 3 === 1 && z0 < -0.2 && z0 > -4) B.box(sd * (w0 - 0.045), dy(z0) + 0.13, z0, 0.07, 0.24, 0.09, HULL);       // bulwark stanchions
    }
  }
  // stem head with its iron band, samson post, cross pin
  B.box(0, gy(TIP) - 0.12, TIP + 0.02, 0.2, 0.24, 0.26, OXIDE); B.box(0, gy(TIP) + 0.015, TIP + 0.02, 0.24, 0.04, 0.3, DARK);
  B.box(0, dy(-3.9) + 0.13, -3.9, 0.15, 0.3, 0.15, DARK, 0, 0.9, C('#5a452e')); B.beam([-0.26, dy(-3.9) + 0.2, -3.9], [0.26, dy(-3.9) + 0.2, -3.9], 0.04, RUST, 5);
  // a mooring warp from the post over the stem, and a coil on the port side
  let prev = [0.04, dy(-3.9) + 0.14, -3.95];
  for (const p of [[0.1, dy(-4.2) + 0.06, -4.2], [0.09, gy(TIP) + 0.02, TIP + 0.2], [0.1, gy(TIP) + 0.01, TIP - 0.06], [0.11, gy(TIP) - 0.5, TIP - 0.1]]) { B.beam(prev, p, 0.03, ROPE, 5); prev = p; }
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) {
    const a0 = k / 9 * 6.2832, a1 = (k + 1) / 9 * 6.2832, R = 0.24 - r * 0.035, y = dy(-3.55) + 0.03 + r * 0.05;
    B.beam([-0.52 + Math.cos(a0) * R, y, -3.55 + Math.sin(a0) * R], [-0.52 + Math.cos(a1) * R, y, -3.55 + Math.sin(a1) * R], 0.03, ROPE, 4);
  }
  // a small anchor lashed to starboard, an orange pot buoy beside it
  const ay = dy(-3.5) + 0.05;
  B.beam([0.38, ay, -3.25], [0.5, ay + 0.02, -4.0], 0.035, RUST, 5); B.beam([0.22, ay, -3.92], [0.76, ay, -4.02], 0.035, RUST, 5);
  B.beam([0.3, ay, -3.2], [0.48, ay + 0.1, -3.32], 0.03, RUST, 4); B.prism(6, 0.05, 0.16, ay - 0.02, ay + 0.14, ORANGE, 0.72, -3.42, 0); B.prism(6, 0.16, 0.06, ay + 0.14, ay + 0.3, ORANGE, 0.72, -3.42, 1);
  // further aft (a tall screen sees it): the fish-hold hatch, two fish boxes, a boat hook along the bulwark, a pair of cleats
  const hy = dy(-1.7);
  B.box(0.38, hy + 0.08, -1.7, 1.06, 0.16, 1.06, HULLD, 0, 1, HULL);
  for (let i = 0; i < 4; i++) B.box(0.38 - 0.36 + i * 0.24, hy + 0.185, -1.7, 0.225, 0.05, 0.94, WOOD[(i * 2 + 1) % 6].clone().multiplyScalar(1.06));
  B.box(0.38, hy + 0.22, -1.38, 0.96, 0.03, 0.07, DARK); B.box(0.38, hy + 0.22, -2.02, 0.96, 0.03, 0.07, DARK);
  B.beam([0.3, hy + 0.23, -1.7], [0.46, hy + 0.23, -1.7], 0.03, IRON, 5);
  const fy = dy(-1.2);
  B.box(-0.72, fy + 0.13, -1.25, 0.66, 0.26, 0.44, C('#b8322a'), 0.12, 1.08, C('#c9443a')); B.box(-0.72, fy + 0.255, -1.25, 0.56, 0.02, 0.34, C('#3c1512'), 0.12);
  B.box(-0.7, fy + 0.4, -1.27, 0.66, 0.26, 0.44, C('#d8d4c8'), -0.06, 1.08, C('#e6e2d6')); B.box(-0.7, fy + 0.525, -1.27, 0.56, 0.02, 0.34, C('#7d8a8c'), -0.06);
  for (let i = 0; i < 5; i++) B.box(-0.9 + i * 0.1, fy + 0.545, -1.27 + 0.06 * Math.sin(i * 2.3), 0.07, 0.03, 0.26, C(i % 2 ? '#b9c4c8' : '#8fa0a8'), 0.3 * Math.sin(i * 1.7));
  B.beam([1.02, dy(-0.6) + 0.07, -0.5], [0.66, dy(-3) + 0.07, -3.05], 0.035, C('#b59868'), 6); B.beam([0.66, dy(-3) + 0.07, -3.05], [0.6, dy(-3) + 0.09, -3.2], 0.03, IRON, 4); B.beam([0.6, dy(-3) + 0.09, -3.2], [0.68, dy(-3) + 0.09, -3.27], 0.03, IRON, 4);
  for (const sd of [-1, 1]) { const cz = -2.7, cx = sd * (hw(cz) - 0.02); B.box(cx, gy(cz) + 0.05, cz, 0.07, 0.1, 0.34, IRON); B.box(cx, gy(cz) + 0.11, cz, 0.06, 0.04, 0.5, IRON); }
  return B.build();
}

// the bow in the boat's own frame: sway and heave, the turn, the nod, the roll about the keel, its coming out of nothing (out, tmp: Matrix4)
function bowLocal(out, tmp, sway, heave, turnK, nod, roll, present, piv) {
  out.makeTranslation(sway, heave, 0);
  tmp.makeRotationY(-turnK * 0.05); out.multiply(tmp); tmp.makeRotationX(nod); out.multiply(tmp);
  tmp.makeTranslation(0, -piv, 0); out.multiply(tmp); tmp.makeRotationZ(roll); out.multiply(tmp); tmp.makeTranslation(0, piv, 0); out.multiply(tmp);
  tmp.makeScale(present, present, present); out.multiply(tmp);
}

// ---- a small sailing boat for the bay (lugger = the rare red-sailed fleet) ------------------------------------------------
function sailGeometry(sail, hull, lugger) {
  const B = new GW(), L = lugger ? 13 : 7.5, NS = 8, bm = L * 0.17;
  const HC = C(hull), HD = C(hull).multiplyScalar(0.55), SC = C(sail), SD = C(sail).multiplyScalar(0.8), WD = C('#5a442c');
  const hb = (t) => Math.max(0.04, bm * Math.sin(Math.PI * Math.pow(t, 0.8)) + 0.02), zz = (t) => -L / 2 + L * t, sh = (t) => 0.8 + 0.5 * Math.pow(Math.abs(t - 0.45) * 2, 2);
  for (let i = 0; i < NS; i++) {
    const t0 = i / NS, t1 = (i + 1) / NS;
    for (const sd of [-1, 1]) {
      const a = [sd * hb(t0), sh(t0), zz(t0)], b = [sd * hb(t1), sh(t1), zz(t1)], c = [sd * hb(t1) * 0.25, -0.5, zz(t1)], d = [sd * hb(t0) * 0.25, -0.5, zz(t0)];
      if (sd > 0) B.quad(b, a, d, c, HC, HD); else B.quad(a, b, c, d, HC, HD);
    }
    B.quad([-hb(t0), sh(t0) - 0.12, zz(t0)], [-hb(t1), sh(t1) - 0.12, zz(t1)], [hb(t1), sh(t1) - 0.12, zz(t1)], [hb(t0), sh(t0) - 0.12, zz(t0)], C('#b9a886'));
  }
  const masts = lugger ? [[L * 0.2, L * 0.95, L * 0.62], [-L * 0.24, L * 0.78, L * 0.52]] : [[L * 0.12, L * 1.15, L * 0.6]];
  for (const [mz, mh, boom] of masts) {
    B.beam([0, 0.6, mz], [0, mh, mz], L * 0.012, WD, 5);
    if (lugger) {      // a dipping lug: a tall quadrilateral set to one side of the mast
      const br = (k, y) => [-0.25 - k * boom * 0.74, y, mz + k * boom * 0.62];     // braced 50 degrees off the keel, broadside to the harbour mouth
      const a = br(0.42, 1.9), b = br(-0.62, 2.2), c = br(-0.5, mh * 0.96), d = br(0.3, mh * 0.74);
      B.quad(a, b, c, d, SD, SC); B.beam(d, c, L * 0.008, WD, 4);
    } else {
      B.tri([0.05, 1.6, mz - 0.1], [0.5, 1.75, mz - boom], [0.05, mh * 0.97, mz - 0.1], SD, SD, SC);
      B.tri([0, 1.3, zz(1) - 0.2], [0.12, 1.5, mz + 0.25], [0, mh * 0.82, mz + 0.05], SD, SD, SC);
      B.beam([0.05, 1.6, mz - 0.1], [0.5, 1.75, mz - boom], L * 0.008, WD, 4);
    }
  }
  return B.build();
}

// ---- a figure for the quay and the market (white torso takes the per-instance colour) ----------------------------------------
function figureGeometry() {
  const B = new GW(), LEG = C('#22242c'), SKIN = C('#c79a7a'), W = new THREE.Color(1, 1, 1), WS = new THREE.Color(0.8, 0.8, 0.8), HAIR = C('#2e2620'), SHOE = C('#15161a');
  // legs taper to the ankle, the torso to the waist; shoulders slope into a neck; one arm carries a basket (hidden on two in three)
  for (const sx of [-0.095, 0.095]) { B.box(sx, 0.47, 0, 0.15, 0.78, 0.18, LEG, 0, 1.25); B.box(sx, 0.045, 0.035, 0.12, 0.09, 0.26, SHOE); }
  B.box(0, 1.08, 0, 0.36, 0.5, 0.21, WS, 0, 1.2, W); B.box(0, 1.4, 0, 0.44, 0.14, 0.24, W, 0, 0.56);
  for (const sx of [-0.265, 0.265]) { B.box(sx, 1.13, 0, 0.1, 0.5, 0.12, W, 0, 1.15); B.box(sx, 0.84, 0, 0.08, 0.1, 0.09, SKIN); }
  B.prism(6, 0.05, 0.05, 1.44, 1.52, SKIN, 0, 0, 0); B.prism(7, 0.085, 0.108, 1.5, 1.6, SKIN, 0, 0.01, 0); B.prism(7, 0.108, 0.098, 1.6, 1.7, SKIN, 0, 0.01, 0);
  B.prism(7, 0.114, 0.07, 1.67, 1.76, HAIR, 0, -0.005, 1);
  B.kind = 1;      // (aK = 1 marks the basket: the vertex shader folds it away unless the instance carries one)
  B.box(0.3, 0.66, 0.05, 0.3, 0.2, 0.36, C('#a8814a'), 0, 1.12, C('#c29a5e')); B.box(0.3, 0.79, 0.05, 0.26, 0.07, 0.3, C('#d9d2c0'));
  B.kind = 0;
  return B.build();
}
// figures walk between two points, turning at each end; all of it in the vertex shader
const FIG_HEAD = /* glsl */`attribute vec4 aW0; attribute vec4 aW1; attribute vec3 aTint; attribute float aK; uniform float uTime;
vec2 walkDir(){ vec2 d = aW1.xz - aW0.xz; d /= max(length(d), 1e-3); return fract(uTime * aW1.w + aW0.w) > .5 ? -d : d; }
vec3 walkTurn(vec3 p){ vec2 d = walkDir(); return vec3(p.x * d.y + p.z * d.x, p.y, -p.x * d.x + p.z * d.y); }
float figHash(float n){ return fract(sin(n * 91.7 + 2.3) * 43758.5453); }`;
const FIG_POS = /* glsl */`
{ float wf = fract(uTime * aW1.w + aW0.w), wt = 1. - abs(wf * 2. - 1.), ws = wt * wt * (3. - 2. * wt);
  float moving = step(.02, aW1.w) * smoothstep(0., .08, wt) * smoothstep(1., .92, wt);
  vec3 lp = transformed;
  if (aK > .5) lp = mix(vec3(.2, .9, 0.), lp, step(.66, figHash(aW0.w * 7.)));                    // one in three carries a basket
  lp.y += abs(sin(uTime * 7.4 + aW0.w * 43.)) * .04 * moving; lp.z += sin(uTime * 7.4 + aW0.w * 43.) * .1 * moving * step(lp.y, .5) * sign(lp.x);
  lp *= vec3(.94 + .12 * figHash(aW0.w * 3.), .9 + .18 * figHash(aW0.w), .94 + .12 * figHash(aW0.w * 3.));      // no two the same height or build
  transformed = walkTurn(lp) + mix(aW0.xyz, aW1.xyz, ws); }`;
function figureMaterial(U) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `${FIG_HEAD}\n#include <common>`)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = walkTurn(objectNormal);')
      .replace('#include <begin_vertex>', `#include <begin_vertex>${FIG_POS}`)
      .replace('#include <color_vertex>', '#include <color_vertex>\nif (color.g > .79 && color.r > .79 && color.b > .79) vColor.rgb = aTint * color.g;');
  };
  return m;
}
function figureDepthMaterial(U) {       // the shadow of a walking figure walks with it
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.customProgramCacheKey = () => 'tmt-depth-figure';
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `${FIG_HEAD}\n#include <common>`).replace('#include <begin_vertex>', `#include <begin_vertex>${FIG_POS}`);
  };
  return m;
}

// ---- the water our own bow throws: a foaming bow wave that rolls ahead of the stem and sweeps aft, lace streaming past, ------
// and bursts of spray. Both live in a level frame under the eye (x right, -z ahead, y = 0 on the water) and are driven by one
// number, uK = how fast the boat runs (0 at rest: nothing is drawn).
const FOAM_NOISE = /* glsl */`
float fh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float fvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(fh(i), fh(i + vec2(1., 0.)), f.x), mix(fh(i + vec2(0., 1.)), fh(i + vec2(1., 1.)), f.x), f.y); }
float ffb(vec2 p){ return fvn(p) * .5 + fvn(p * 2.13 + 7.1) * .3 + fvn(p * 4.7 + 3.3) * .2; }
`;
function makeFoam(U) {
  const g = new THREE.PlaneGeometry(30, 22, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, -5);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: 'varying vec2 vB, vWx; void main(){ vB = position.xz; vec4 wp = modelMatrix * vec4(position, 1.); vWx = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: /* glsl */`
      uniform float uTime, uK; uniform vec3 uCol; varying vec2 vB, vWx;
      ${FOAM_NOISE}
      void main(){
        float x = abs(vB.x), z = vB.y;                                   // the stem is at z = -4.6, the eye at 0
        float zf = -6.5 + .2 * x * x / (1. + .13 * x);                   // the crest: blunt ahead of the stem, sweeping back along both sides
        float dz = z - zf;
        float crest = dz < 0. ? smoothstep(-.34 - .1 * x, 0., dz) : exp(-dz / (.75 + .5 * x));
        float n = ffb(vWx * 1.5 + vec2(0., uTime * .2)), n2 = fvn(vWx * 5.7 - uTime * .5);
        float lace = smoothstep(.3, .66, n * .8 + n2 * .3 + crest * .5 - .16);
        float hull = 1.7 * pow(clamp((z + 4.6) / 4.6, 0., 1.), .42);
        float wash = smoothstep(0., .6, dz) * exp(-max(x - hull, 0.) / 1.5) * .7;
        float flecks = smoothstep(.66, .8, ffb(vWx * vec2(1.1, 1.1) + 13.) * .7 + n2 * .3) * .34 * exp(-max(x - hull - 2.5, 0.) / 1.5) * smoothstep(-1., 1.5, dz);      // lace left on the water, streaming aft
        float foam = clamp(crest * (.5 + .5 * lace) + wash * lace + flecks, 0., 1.);
        float fade = smoothstep(14.5, 8., length(vec2(vB.x, z + 4.)));
        float k = smoothstep(.06, .55, uK);
        float a = foam * fade * k;
        gl_FragColor = vec4(uCol * (.82 + .3 * n2), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'bow-wave';
  return mesh;
}
// spray thrown up where the swell breaks round a pier head: bursts on the beat of the swell the tide surface draws (5 s), each
// drop on its own arc. heads: [[x, z, a0, a1], ...] = a head's centre and the arc of its foot that takes the sea
function makeSurf(U, rng, n, heads) {
  const pos = new Float32Array(n * 3), sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const h = heads[i % heads.length], a = h[2] + (h[3] - h[2]) * rng();
    pos.set([h[0] + Math.sin(a) * (h[4] ?? 5.2), 0, h[1] + Math.cos(a) * (h[4] ?? 5.2)], i * 3); sd.set([Math.sin(a), Math.cos(a), rng(), rng()], i * 4);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sd, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: /* glsl */`
      attribute vec4 aS; uniform float uTime, uPx, uSurf; varying float vA;
      void main(){
        float ph = uTime / 5.0265 + position.z * .0334 - .25 - aS.z * .5, tt = fract(ph) * 5.0265, wave = floor(ph);
        float big = .45 + .55 * fract(sin((wave + aS.w * 3.) * 12.9898) * 43758.5453);            // no two waves break alike
        float up = (4.5 + 5.5 * aS.w) * (.6 + .4 * big), life = up / 4.9, a = clamp(tt / life, 0., 1.), out2 = .5 + 1.7 * fract(aS.w * 7.3 + aS.z * 3.1);
        vec3 p = position + vec3(aS.x * out2 * tt, max(up * tt - 4.9 * tt * tt, 0.), aS.y * out2 * tt - .8 * tt);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, .5);
        vA = uSurf * step(tt, life) * smoothstep(0., .06, a) * (1. - a * a) * big * smoothstep(7., 18., dist);
        gl_PointSize = clamp(uPx * (.12 + .3 * a) * (.6 + .8 * aS.z) / dist, 1.6, 6.5);
      }`,
    fragmentShader: 'uniform vec3 uCol; varying float vA; void main(){ vec2 c = gl_PointCoord - .5; float s = smoothstep(.25, .02, dot(c, c)); gl_FragColor = vec4(uCol * 1.1, s * vA * .85); }',
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 4; pts.name = 'surf-spray';
  return pts;
}
// the sea breaking on the foot of a pier head: sheets of spray that leap up the stone on the same beat and fall back, ragged
// and never twice the same. list: [[x, z, half-width, height], ...]; each sheet faces the eye and stands on the water (y = 0)
function makeBreakers(U, rng, list) {
  const pos = [], cen = [], par = [];
  for (const [x, z, w, h] of list) { const r1 = rng(), r2 = rng(); for (const [cx, cy] of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]]) { pos.push(cx, cy, 0); cen.push(x, 0, z); par.push(w, h, r1, r2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cen, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(par, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: U,
    vertexShader: /* glsl */`
      attribute vec3 aC; attribute vec4 aP; uniform float uTime, uSurf; varying vec2 vUv; varying vec3 vS;
      void main(){
        float ph = uTime / 5.0265 + aC.z * .0334 - .25 - aP.z * .46, tt = fract(ph) * 5.0265, wave = floor(ph);      // (each sheet up to half a beat after its neighbour: somewhere along the rock the sea is always breaking)
        float big = .4 + .6 * fract(sin((wave + aP.w * 7.) * 12.9898) * 43758.5453);
        float rise = smoothstep(0., .5, tt), fall = 1. - smoothstep(.6, 2.6, tt);
        vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
        vec3 wc = (modelMatrix * vec4(aC, 1.)).xyz;
        vec3 p = wc + right * (position.x * aP.x * (.55 + .45 * rise)) + vec3(0., position.y * aP.y * big * rise * (.3 + .7 * fall) - .15, 0.);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
        float near = smoothstep(14., 32., distance(cameraPosition, wc));                           // a sheet is a far thing: close to, only the drops are left
        vUv = position.xy; vS = vec3(uSurf * big * rise * (1. - smoothstep(1.3, 2.9, tt)) * near, tt, aP.z * 17. + wave * 3.7);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; varying vec2 vUv; varying vec3 vS;
      ${FOAM_NOISE}
      void main(){
        float x = vUv.x, y = vUv.y, tt = vS.y;
        float n = ffb(vec2(x * 2.2 + vS.z, y * 3. - tt * 1.5 + vS.z)), n2 = fvn(vec2(x * 7. + vS.z, y * 9. - tt * 3.2));
        float d = (1. - abs(x) * (1. + .8 * y)) * (1. - y * y);
        // thrown water, not a sheet of white: torn at every edge, full of holes, thinner toward its top, shaded from foot to crest
        float n3 = fvn(vec2(x * 15. - vS.z, y * 19. - tt * 5.5));
        float a = smoothstep(.16, .62, d * 1.3 + (n - .5) * 1.5 + (n2 - .5) * .7 - .3 * smoothstep(.7, 2.6, tt)) * smoothstep(1., .7, y)
          * smoothstep(1., .25, abs(x)) * smoothstep(-.02, .1, y) * (.5 + .5 * smoothstep(.25, .7, n3));
        gl_FragColor = vec4(min(uCol * (.86 + .22 * n2 + .1 * y) + .04, vec3(.95)), min(a * vS.x * 1.2, .72));
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3.5; mesh.name = 'breakers';
  return mesh;
}
function makeSpray(U, rng, n) {
  const pos = new Float32Array(n * 3), sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) sd.set([rng(), rng(), rng(), rng()], i * 4);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sd, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: /* glsl */`
      attribute vec4 aS; uniform float uTime, uK, uPx; varying float vA;
      void main(){
        float side = aS.x < .5 ? -1. : 1., life = .8 + .5 * aS.y, ph = uTime / life + aS.z * 7.;
        float a = fract(ph), burst = floor(ph);
        float r1 = fract(sin((burst + aS.w * 31.) * 12.9898) * 43758.5453), r2 = fract(sin((burst + aS.z * 17.) * 78.233) * 43758.5453);
        float slam = .5 + .5 * sin(burst * life * 4.2);                   // the bow drops into a wave about every second and a half
        vec3 v = vec3(side * (.6 + 1.4 * r1), 2.6 + (2.2 + 2.4 * slam) * r2, 3. + 6. * aS.y);
        float tt = a * life;
        vec3 p = vec3(side * (.2 + .5 * aS.w), .15, -5.4 + aS.w * 1.3) + v * tt - vec3(0., 4.9 * tt * tt, 0.);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, .3);
        vA = smoothstep(.3, .8, uK) * (1. - a) * smoothstep(0., .1, a) * step(0., p.y) * smoothstep(.5, 1.6, dist) * smoothstep(.45, .75, slam);
        gl_PointSize = min(uPx * (.035 + .085 * a) * (.6 + .8 * r1) / dist, 12.);
      }`,
    fragmentShader: 'uniform vec3 uCol; varying float vA; void main(){ vec2 c = gl_PointCoord - .5; float s = smoothstep(.25, .02, dot(c, c)); gl_FragColor = vec4(uCol * 1.1, s * vA * .55); }',
  });
  const pts = new THREE.Points(g, m); pts.matrixAutoUpdate = false; pts.frustumCulled = false; pts.renderOrder = 4; pts.name = 'spray';
  return pts;
}

// ---------------------------------------------------------------------------------------------------------------- the world
export default {
  id: 'twelve-metre-tide',
  name: 'Twelve Metres of Tide',
  category: 'city',
  weirdness: 0.15,
  media: ['water', 'air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.6, 1.4), mood = vary.mood ?? 0.5, rare = !!vary.rare;
    // ---- what this visit is: every draw up front, in a fixed order
    const lookPick = rng(), paintPick = rng(), seasonPick = rng(), sailPick = rng(), gullPick = rng(), cloudSeed = 1 + Math.floor(rng() * 900), nOff = rng() * 400;
    const fogPick = rng(), awnPick = rng(), fleetPick = rng();
    const h = vary.hour;
    const lp = (lookPick + 0.4) % 1;
    const lookName = h === 'night' ? 'night' : h === 'golden' ? 'golden' : h === 'dawn' ? 'morning' : h === 'day' ? (lp < 0.62 ? 'morning' : 'pearl')
      : (lp < 0.42 ? 'morning' : lp < 0.62 ? 'pearl' : lp < 0.85 ? 'golden' : 'night');
    const look = LOOKS[lookName], dayLook = lookName === 'morning' || lookName === 'pearl';
    // paint family (0 blues, 1 sea-greens, 2 faded reds): every look can have any, each leans to its own
    const paint = lookName === 'pearl' ? (paintPick < 0.5 ? 1 : paintPick < 0.8 ? 0 : 2) : lookName === 'golden' ? (paintPick < 0.5 ? 2 : paintPick < 0.8 ? 0 : 1) : (paintPick < 0.5 ? 0 : paintPick < 0.76 ? 1 : 2);
    const season = look.season === 'late' || seasonPick > 0.8 ? 'late' : 'summer';
    // the fog of this visit: thin, usual, or thick (the far mole and the lighthouse hidden until the flood is half in)
    const fogKind = fogPick < 0.3 ? 2 : fogPick < 0.72 ? 1 : 0;
    const fog0 = look.fog[0] * [0.62, 1, 1.4][fogKind], fog1 = look.fog[1] * [0.9, 1, 1.15][fogKind], mistK = [0.75, 1, 1.3][fogKind];
    const scene = new THREE.Scene();
    await ctx.yield();

    // ---- the two skies and one light rig -------------------------------------------------------------------------------
    const skyOf = (o, label) => {
      const P = SKY_PRESETS[o.preset] || {}, { cov, preset, cl, c2, ...over } = o;
      return makeSky({
        rng: rng.fork(label), preset, ...over,
        clouds: { ...(P.clouds || {}), ...(cl || {}), coverage: clamp(cov + (mood - 0.5) * 0.14, 0.2, 0.95), seed: cloudSeed, wind: [0.036, 0.014] },
        clouds2: { ...(P.clouds2 || {}), seed: cloudSeed + 7, wind: [0.017, 0.006], scale: 2.3, stretch: 0.55, opacity: Math.min(c2 ?? 0.26, P.clouds2?.opacity ?? 0.26) },
      });
    };
    const skyA = skyOf(look.a, 'skyA'); await ctx.yield();
    const skyB = skyOf(look.b, 'skyB'); await ctx.yield();
    // kit/sky cross-fades by alpha, but three.js does not blend an "opaque" material: the incoming dome goes to the transparent pass
    skyB.material.transparent = true; if (skyB.materialLow) skyB.materialLow.transparent = true;
    scene.add(skyA.object, skyB.object); skyB.setOpacity(0);
    scene.fog = new THREE.FogExp2(skyA.fogColor.clone(), fog0);
    // one shadow map, on from the start and never switched: houses, stalls, lamp posts, people, boats and our own bow all stand on the ground
    const rig = makeLightRig(skyA, { bounce: 0.45, ambient: 1.05, shadow: true, shadowSize: 2048, shadowRange: 70 }); scene.add(rig.object);
    await ctx.yield();

    // ---- the camera line (plan first: the hero keeps boats, pots and buoys clear of it) -------------------------------
    // In: 14.5 m over the sand (the first 6 dry, then the sheet races in), then 32 m afloat along the wall, seven degrees toward
    // it and 19 to 14 m off its face, then a short left-hand curve that swings the bow 38 degrees toward the square as the rim
    // comes down to the eye. Along the quay: a right-hand arc to 7.3 m off the quay edge, 22 m straight past the square with the
    // stalls at eye level, and a second arc round to the south. Out: down the harbour under the swung-out mainsail of the old
    // tunny boat (her clew 2 m inboard of our line), between a big fishing boat and her smaller sister, close under the
    // lighthouse through the gap, then left round the foot of the reef behind the mole: the portal stands over the open sea
    // beyond it and is hidden by the reef until we round its seaward stack.
    const RAD = Math.PI / 180, HD = (hd) => [Math.cos(hd * RAD), -Math.sin(hd * RAD)];     // a heading, degrees toward the wall
    const SN = (d) => Math.sin(d * RAD), CS = (d) => Math.cos(d * RAD);
    const H0 = 7, H1 = 38, H2 = -84, RR = 17, DQ = 22;
    const TC = [-27 + RR * SN(30), 9.6 + RR * CS(30)], TC2 = [TC[0] + DQ, TC[1]];                // the centres of the two arcs
    const arc = (hd) => [TC[0] - RR * SN(hd), TC[1] - RR * CS(hd)];                               // the first arc, by heading (38 .. 0)
    const arc2 = (hd) => [TC2[0] - RR * SN(hd), TC2[1] - RR * CS(hd)];                            // the second (0 .. -84)
    const T0 = arc(H1);
    // the straight beside the wall is the line through LP at heading H0; the left-hand curve is the circle that leaves it and
    // arrives at T0 on heading H1 (its radius follows: about 15 m)
    const LP = [-47 + 40 * SN(H0), 9.6 - 40 * CS(30) + 40 * CS(H0)], JD = HD(H0), along = (d) => [LP[0] + JD[0] * d, LP[1] + JD[1] * d];
    const RL = ((T0[0] - LP[0]) * -SN(H0) + (T0[1] - LP[1]) * -CS(H0)) / (1 - CS(H1 - H0));
    const CL = [T0[0] - RL * SN(H1), T0[1] - RL * CS(H1)];
    const jarc = (hd) => [CL[0] + RL * SN(hd), CL[1] + RL * CS(hd)];                              // the left-hand curve, by heading
    const J0 = jarc(H0), DJ = (J0[0] - LP[0]) * JD[0] + (J0[1] - LP[1]) * JD[1];                  // where the curve leaves the line
    const S_LEVEL = 14.5, S_STRAIGHT = 26 + DJ, S_RISE = S_STRAIGHT + RL * (H1 - H0) * RAD, W0 = along(-26 - S_LEVEL), W1 = along(-26);
    // [x, z, metres of the rise behind this point]
    const inPts = [[...W0, 0], [...along(-26 - S_LEVEL * 0.5), 0], [...W1, 0], [...along(-19.5), 6.5], [...along(-13), 13], [...along(-6.5), 19.5], [...along(0), 26], [...J0, S_STRAIGHT]];
    for (const d of [15, 23, 31]) inPts.push([...jarc(d), S_STRAIGHT + RL * (d - H0) * RAD]);
    const Q0 = arc(0), Q1 = arc2(0), RE = arc2(H2);
    const roundPts = [T0, arc(19), Q0, [Q0[0] + DQ / 3, Q0[1]], [Q0[0] + DQ * 2 / 3, Q0[1]], Q1, arc2(-21), arc2(-42), arc2(-63), RE];
    const PORTAL = [102, 204.4], GAP = [14, 152], SHIP = [13.5, 69], SHIP_YAW = 0.02, SHIP_S = 1.25, SIS = [27.8, 112], SIS_YAW = -0.27, SIS_S = 0.85;
    const outPts = [[21.6, 38], [22, 52], [21.8, 66], [21.2, 82], [20.4, 98], [18.6, 113], [16, 127], [14.3, 140], GAP, [14.5, 163], [19, 174.5], [29, 183.5], [43, 188.6], [58.4, 192.7], [73, 196.6], [87.5, 200.5], PORTAL];
    const plan = [...inPts.map((p) => [p[0], p[1]]), ...roundPts, ...outPts];
    // a tan-sailed yawl of the tunny boat's lines stands in past the beacon skerry on the reciprocal of our last course: she lies
    // off until the flood is in, crosses the sun's road as we round the reef and passes 19 m down our starboard side at u 0.84
    const YAWL_YAW = -1.833, YAWL = (u) => { const q = Math.max(u, 0.45) - 0.84; return [41.6 - 145 * q, 207.9 - 39 * q + 70 * Math.max(0, -0.16 - q)]; };
    // and a smaller lugger ahead of her under all her tan canvas: she lies off north of the beacon skerry until the flood is in,
    // stands in west of it, turns down the reef and runs west along z = 184: as we come out between the heads she comes down
    // the sun's road toward us (45 m off at the lighthouse, 17 m as we round the low rocks) and crosses 10 m ahead as we turn for
    // the arch. LUG(u) = [x, z, yaw], keyed to the flight like the yawl; her track is a curve through LUGW, walked at one speed
    // (320 m per unit of u), clear of every rock, of the yawl and of our own line by the time we reach it.
    const LUGW = [[72, 250], [66, 232], [60, 214], [51.5, 199], [42, 190], [33, 185], [20, 184], [0, 184.5], [-40, 186], [-90, 189]], LUGN = 324, lugS = [], lugP = [], lugY = [];
    { const cv = new THREE.CatmullRomCurve3(LUGW.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'), v = new THREE.Vector3(); let acc = 0;
      for (let i = 0; i <= LUGN; i++) { cv.getPoint(i / LUGN, v); if (i) acc += Math.hypot(v.x - lugP[2 * i - 2], v.z - lugP[2 * i - 1]); lugS.push(acc); lugP.push(v.x, v.z); }
      for (let i = 0; i <= LUGN; i++) { const a = Math.max(i - 1, 0), b = Math.min(i + 1, LUGN); lugY.push(Math.atan2(lugP[2 * b] - lugP[2 * a], lugP[2 * b + 1] - lugP[2 * a + 1])); } }
    const LUG_REST = lugS[LUGN / 9], LUG_AT = lugS[LUGN * 5 / 9];       // the samples that fall on the waypoints (66, 232) and (33, 185)
    const LUG = (u) => {
      const s = Math.max(LUG_REST, Math.min(lugS[LUGN] - 0.01, LUG_AT + 320 * (u - uGap))); let i = 1; while (lugS[i] < s) i++;      // (her run is tied to our own passing between the pier heads: she is at the waypoint (33, 185) as the eye is in the gap)
      const k = (s - lugS[i - 1]) / Math.max(1e-6, lugS[i] - lugS[i - 1]);
      return [lugP[2 * i - 2] + (lugP[2 * i] - lugP[2 * i - 2]) * k, lugP[2 * i - 1] + (lugP[2 * i + 1] - lugP[2 * i - 1]) * k, lugY[i - 1] + (lugY[i] - lugY[i - 1]) * k];
    };

    // ---- far land: the mainland behind the village, two low arms of the bay, the chapel islet ---------------------------
    const ISLE = [-112, 545], HAMLET = [];
    const farH = (x, z) => {
      const n = noise.fbm2(x * 0.0021 + nOff, z * 0.0021, 3), n2 = noise.n2(x * 0.006, z * 0.006 + nOff);
      let hgt = -6;
      const shore = -255 + 40 * noise.n2(x * 0.004 + nOff, 1.7);
      hgt = Math.max(hgt, -6 + (30 + 30 * n + 5 * n2) * sstep(shore, shore - 210, z) + 6);
      hgt = Math.max(hgt, -6 + 22 * Math.exp(-((x - 30) * (x - 30)) / 9000) * sstep(-150, -215, z));                // the neck that joins the headland
      const wx = x + 800 + z * 0.16, ex = x - 760 - z * 0.1;
      hgt = Math.max(hgt, -6 + (42 + 26 * n) * Math.exp(-(wx * wx) / 36000) * sstep(690, 480, z + 60 * n2));
      hgt = Math.max(hgt, -6 + (36 + 22 * n) * Math.exp(-(ex * ex) / 30000) * sstep(520, 330, z + 60 * n2));
      return hgt;
    };
    const isleH = (x, z) => {
      const dx = x - ISLE[0], dz = (z - ISLE[1]) * 1.25, r = Math.hypot(dx, dz) + 9 * noise.n2(x * 0.03 + nOff, z * 0.03);
      return -5 + 39 * sstep(64, 20, r) + 5 * sstep(24, 4, r) + 2.5 * noise.n2(x * 0.07, z * 0.07 + nOff) * sstep(70, 40, r);
    };
    // ---- the hero, with the world's own granite merged into its meshes -------------------------------------------------
    const lampXs = [-88, -64, -36, -12, 16, 40, 74, 96];
    const extend = async ({ G, GC, C: HC, vcol, pal, hillHeight }) => {
      const IRON = HC('#1c1d1f'), GLOW = HC('#ffcf8a').multiplyScalar(0.3), WALL = HC('#e4ded0');
      // sand under the sand. Seen through the previous portal, the opening reaches 3.6 m below the harbour floor (the eye is only
      // 3.4 m above it) and the picture is drawn from the opening's plane, so the rays of its lower quarter start under the sand
      // mesh. They land here: the same rippled wet sand, below the real floor everywhere in the basin, never seen from above it.
      G.kind = 8; G.quad([-104, -2.9, 1.7], [-104, -2.9, 132], [104, -2.9, 132], [104, -2.9, 1.7], pal.SAND); G.kind = 0;
      // lamp posts along the quay edge (their lanterns take the lighthouse lamp's glow)
      for (const lx of lampXs) {
        G.kind = 0; G.beam([lx, RIM, -2.1], [lx, RIM + 4.1, -2.1], 0.085, IRON, 6); G.beam([lx, RIM + 4.1, -2.1], [lx, RIM + 4.45, -1.5], 0.06, IRON, 4);
        G.prism(6, 0.2, 0.2, RIM, RIM + 0.5, IRON, lx, -2.1, 1); G.prism(6, 0.24, 0.05, RIM + 4.42, RIM + 4.6, IRON, lx, -1.45, 1);
        G.kind = 5; G.prism(6, 0.11, 0.17, RIM + 4.06, RIM + 4.42, GLOW, lx, -1.45, 2);
      }
      // two flagstaffs with striped black-and-white flags streaming in the wind: by the square, and beside the lighthouse
      const flag = (x, z, hgt, yaw, ph) => {
        G.xf(x, RIM, z, yaw); GC.xf(x, RIM, z, yaw); G.kind = 0;
        G.beam([0, 0, 0], [0, hgt, 0], 0.075, HC('#e4dfd2'), 6); G.prism(6, 0.11, 0.02, hgt, hgt + 0.22, HC('#c9a23a'), 0, 0, 1); G.prism(6, 0.22, 0.16, 0, 0.5, IRON, 0, 0, 1);
        GC.kind = 0; GC.pivot([0, hgt - 0.9, 0], 3, 0, 0.5, ph);
        const BK = HC('#15171a'), WH = HC('#ece8dc');
        for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) {
          const x0 = 0.07 + i * 0.44, x1 = x0 + 0.44, y1 = hgt - 0.12 - j * 0.34, y0 = y1 - 0.34;
          GC.quad([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], i < 2 && j < 2 ? WH : j % 2 ? WH : BK);
        }
        G.xf(0, 0, 0, 0); GC.xf(0, 0, 0, 0);
      };
      flag(-27.6, -3.6, 9.5, 0.35, 1.3); flag(32.6, 149.2, 7.5, 2.4, 4.1);
      await ctx.yield();
      // a gabled building: walls, slate roof, a dark door
      const gable = (x, y, z, yaw, w, d, hh, wall, kind) => {
        G.xf(x, y, z, yaw); const hw = w / 2, hr = hh + d * 0.55, sl = vcol(pal.SLATE, 0.08), lo = wall.clone().multiplyScalar(0.84);
        G.kind = kind;
        G.quad([-hw, -3, 0], [hw, -3, 0], [hw, hh, 0], [-hw, hh, 0], lo, wall); G.quad([hw, -3, -d], [-hw, -3, -d], [-hw, hh, -d], [hw, hh, -d], lo, wall);
        G.quad([hw, -3, 0], [hw, -3, -d], [hw, hh, -d], [hw, hh, 0], lo, wall); G.tri([hw, hh, 0], [hw, hh, -d], [hw, hr, -d / 2], wall);
        G.quad([-hw, -3, -d], [-hw, -3, 0], [-hw, hh, 0], [-hw, hh, -d], lo, wall); G.tri([-hw, hh, -d], [-hw, hh, 0], [-hw, hr, -d / 2], wall);
        G.kind = 2;
        G.quad([-hw - 0.3, hh - 0.1, 0.35], [hw + 0.3, hh - 0.1, 0.35], [hw + 0.3, hr + 0.05, -d / 2], [-hw - 0.3, hr + 0.05, -d / 2], sl);
        G.quad([hw + 0.3, hh - 0.1, -d - 0.35], [-hw - 0.3, hh - 0.1, -d - 0.35], [-hw - 0.3, hr + 0.05, -d / 2], [hw + 0.3, hr + 0.05, -d / 2], sl);
        G.xf(0, 0, 0, 0);
      };
      // the chapel on the islet: nave, west tower, slated spire, a low wall
      const iy = isleH(ISLE[0], ISLE[1]) - 0.4;
      gable(ISLE[0] - 2, iy, ISLE[1] + 4, 0.5, 8.5, 15, 6.2, vcol(pal.GRAN, 0.05, 1.25), 1);
      G.xf(ISLE[0] + 5.5, iy, ISLE[1] + 2.5, 0.5); G.kind = 1;
      G.box(0, 5.5, 0, 5.2, 13, 5.2, vcol(pal.GRAN, 0.05, 1.2), 0, 0.92); G.kind = 2;
      G.prism(4, 3.5, 1.0, 12, 16.5, vcol(pal.SLATE, 0.06), 0, 0, 0, Math.PI / 4); G.prism(4, 1.0, 0.05, 16.5, 22, vcol(pal.SLATE, 0.06, 1.06), 0, 0, 0, Math.PI / 4);
      G.xf(0, 0, 0, 0);
      await ctx.yield();
      // a hamlet on the mainland shore behind the village, with its own small spire
      for (let i = 0; i < 16; i++) {
        const x = -230 + i * 31 + 22 * Math.sin(i * 2.7), z = -330 - 34 * (0.5 + 0.5 * Math.sin(i * 1.9 + 1)), y = farH(x, z);
        if (y < 9) continue;
        gable(x, y - 0.3, z, 0.3 * Math.sin(i * 3.1), 8 + 3 * Math.sin(i * 1.3), 8, 5 + 2.2 * (0.5 + 0.5 * Math.sin(i * 4.3)), vcol(WALL, 0.06, i % 4 === 0 ? 0.8 : 1), 3);
        HAMLET.push([x, y, z]);
      }
      const sx = 62, sz = -372, sy = farH(sx, sz);
      G.xf(sx, sy, sz, 0); G.kind = 1; G.box(0, 7, 0, 5, 16, 5, vcol(pal.GRAN, 0.05, 1.15), 0, 0.94);
      G.kind = 2; G.prism(4, 3.4, 0.05, 15, 27, vcol(pal.SLATE, 0.06), 0, 0, 0, Math.PI / 4); G.xf(0, 0, 0, 0);
      void hillHeight;
    };
    const hero = await buildHero(ctx, {
      hour: look.hour, wet: look.wet, season, look: paint, fill: look.fill, waterSize: 9000, shadows: true, lampXs, awning: Math.floor(awnPick * 3),
      berth: W0, berthYaw: Math.PI / 2, berthDir: JD, fly: plan.map((p) => [p[0], 0, p[1]]), extend,
      // boats moored where the camera passes: to seaward of the rise, inside both arcs, along the run out (the two largest make
      // a gate with the sister ship; their masts and rigging stand over the line)
      moorings: [[-61.5, 27.6, 1.72, 1.3], [-40, 29.5, 1.5, 1.1], [-48, 40, 4.4, 1.3], [TC[0], TC[1] + 0.2, 2.2, 1.2], [TC2[0] - 1, TC2[1] + 2, 2.6, 1.3],
        [34, 40, 3.5, 1.5], [36.5, 66, 3.2, 1.6], [34, 88, 3.0, 1.4], [-3, 98, 3.1, 1.5], [12.3, 107, 0.02, 2.2], [3, 127, 3.05, 1.6], [31, 133, 3.3, 1.4]],
      // timber mooring piles the tide climbs beside the rise (two close under the wall between the boats tied at the ladders, two to
      // seaward 8 m off our line), a red and a green perch on the channel out; the boats scattered on the sand keep 5 m clear of them
      posts: [[-64.5, 5.2, 0], [-47.6, 5.3, 0], [-52, 23.8, 0], [-37, 22.4, 0], [22.6, 130, 1], [8.2, 142, 2]],
      // the old tunny boat rides head to the flood in the middle of the harbour, her sails hoisted to dry and swung out over our
      // line: we pass down her port side, 8.5 m off her keel, under the clew of the mainsail and the tip of her fishing pole.
      // Her smaller sister lies across the fairway from the largest fishing boat
      ship: [SHIP[0], SHIP[1], SHIP_YAW, SHIP_S], ship2: [SIS[0], SIS[1], SIS_YAW, SIS_S], ship3: [YAWL(0)[0], YAWL(0)[1], YAWL_YAW, 0.72], ship4: [lugP[2 * LUGN / 9], lugP[2 * LUGN / 9 + 1], lugY[LUGN / 9], 0.68], arch: true,
      keepOut: [[13.5, 55, 9.5], [13.5, 62, 9.5], [13.5, 69, 9.5], [13.5, 76, 9.5], [13.6, 83, 9.5], [13.7, 91, 8], [30.2, 104.5, 7.5], [27.8, 112, 7.5], [25.8, 119.5, 7.5], [24.2, 126, 6],
        [16, 147, 12], [14, 160, 12], [14, 135, 8]],
      portal: [PORTAL[0], TIDE_HIGH + EYE_W + 2.4, PORTAL[1], 4.7, look.portal], portalDir: [PORTAL[0] - 87.5, PORTAL[1] - 200.5], glitter: look.glitter ?? 1,
      pool: [W0[0] + JD[0] * 6.5 - JD[1] * 2.8, W0[1] + JD[1] * 6.5 + JD[0] * 2.8, 4.5, 1.6],      // standing water to starboard of the berth
      sand: look.sand, sheen: look.sheen ?? 1, band: look.band ?? 0.5,
    });
    scene.add(hero.object);
    await ctx.yield();
    const sandH = hero.sandHeight, hillH = hero.hillHeight;

    // ---- the path: aground, up with the flood, level over the rim, round to the right, out through the gap ---------------
    let sand0 = -9; for (let k = 0; k <= 8; k++) { const q = along(-26 - S_LEVEL * k / 8); sand0 = Math.max(sand0, sandH(q[0], q[1])); }
    const e0 = sand0 + DRAFT + EYE_W, HI = TIDE_HIGH + EYE_W, yLift = e0 - EYE_W;
    // the flood: slow at first, quickest at half tide, slow again as the rim comes down to the eye
    const riseS = (t) => 0.3 * t + 0.7 * (0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1)));
    // over high water (one height for each point of the round and of the run out): the last 46 m climb to the portal, its rim clear of the sea
    const tail = [...roundPts.map((p, i) => 0.016 * i), 0.16, 0.17, 0.18, 0.19, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.22, 0.3, 0.5, 1.0, 1.7, 2.4];
    const ys = [...inPts.map((p) => e0 + (HI - e0) * riseS(p[2] / S_RISE)), ...tail.map((d) => HI + d)];
    const path = makePath(plan.map((p, i) => [p[0], ys[i], p[1]]));
    await ctx.yield();
    const Ltot = path.length, uOf = (x, z) => path.nearestXZ(x, z).u, pt = new THREE.Vector3(), ptT = new THREE.Vector3();
    const uLift = uOf(W1[0], W1[1]), uTurn = uOf(T0[0], T0[1]), uEast = uOf(Q0[0], Q0[1]), uQ1 = uOf(Q1[0], Q1[1]), uSouth = uOf(RE[0], RE[1]);
    await ctx.yield();
    const uShip = uOf(22, SHIP[1]), uGate = uOf(19.3, 108), uGap = uOf(GAP[0], GAP[1]), uStack = uOf(19, 174.5), uOut = uOf(43, 188.6);
    await ctx.yield();
    let uRim = uTurn; for (let i = 0; i <= 400; i++) { const u = uTurn * i / 400; if (path.pointAt(u, pt).y >= RIM) { uRim = u; break; } }      // the eye level with the quay edge
    await ctx.yield();
    // the clock of the six hours: 0 at dead low water, 1 at high water
    const lapseAt = (u) => { const x = clamp(u / uTurn, 0, 1); return x * (0.45 + 0.55 * x * (3 - 2 * x)); };
    const DUR = 54, REVEAL = 150;
    // slow with the flood and past the square, quick down the harbour (easing under the sails), steadier round the reef and up to the portal
    const PACE = [[0, 0.36], [uLift, 0.36], [uRim, 0.36], [uTurn + 0.01, 0.38], [uEast + 0.01, 0.52], [uQ1, 0.62], [uSouth, 1.25], [uShip - 0.03, 1.7], [uShip + 0.04, 1.55], [uGate, 1.9], [uGap - 0.05, 2.0], [uGap + 0.02, 1.6],
      [uStack + 0.02, 1.6], [uOut + 0.03, 1.5], [0.93, 1.15], [1, 1.0]];
    const pace = (u) => { for (let i = 1; i < PACE.length; i++) if (u <= PACE[i][0]) return lerp(PACE[i - 1][1], PACE[i][1], sstep(PACE[i - 1][0], PACE[i][0], u)); return 1; };
    // the water level along the flight: for the first S_HOLD metres the floor is dry (the far edge of the sea breathing), then
    // the sheet races in and is under the keel at S_SHEET, the boat afloat by the end of the level run, and from there the
    // path itself is the tide (the eye rides EYE_W above it)
    const S_HOLD = 6, S_SHEET = 11.5, sandK = sand0 + 0.03, runK = (s) => Math.max(0, (s - S_HOLD) / (S_SHEET - S_HOLD)), restK = (s) => 1 - sstep(S_HOLD - 0.5, S_HOLD + 1.5, s);
    // at rest the edge of the sea stands 30 m to seaward of the berth, inside the opening view. It comes as a front (a line the
    // hero sweeps across the floor): F_FAR at rest, 9 m past the keel at S_SHEET, at the foot of the quay a little later. Behind
    // the front the sand is a mirror at once (the hero's film), and the level follows, so the sheet is whole, not a scatter of puddles.
    // (the front stands on z = F - FK * (x - berth x): slanted, because the sea comes from the gap, ahead and to starboard. So it
    // crosses the view as a bright line from the near right to the foot of the wall far ahead, and runs down the floor toward us)
    const FK = 0.55, F_FAR = W0[1] + 30, F_KEEL = W0[1] - 9, S_FRONT = S_HOLD + (S_SHEET - S_HOLD) * (F_FAR + 4) / (F_FAR - F_KEEL);
    let TIDE0 = 0; for (const dx of [4, 24, 44, 64]) TIDE0 += sandH(W0[0] + dx, F_FAR - FK * dx + 6) / 4;
    TIDE0 = Math.min(TIDE0 + 0.3, sandK - 0.25);
    const frontAt = (s, time) => (s >= S_FRONT ? -1e4 : F_FAR + (F_KEEL - F_FAR) * runK(s) + restK(s) * 3 * Math.sin(time * 0.7));
    const tideAt = (u) => {
      const s = u * Ltot;
      if (s <= S_SHEET) return lerp(TIDE0, sandK + 0.2, runK(s));
      if (s < S_LEVEL) return lerp(sandK + 0.2, yLift, sstep(S_SHEET, S_LEVEL, s));
      return Math.min(TIDE_HIGH, Math.max(yLift, path.pointAt(u, ptT).y - EYE_W));
    };
    // the sky's own clock. While the tide runs, cloud and shadow time passes RATE times faster than ours (also while the world
    // is only seen through a portal), then it eases back to real speed. It is a function of (time, u) so that a held frame
    // still streams: skyT = time + extra, extra = what the fast clock has gained at u on a flight flown at the planned pace.
    const RATE = 5, rateAt = (u) => 1 + (RATE - 1) * (1 - sstep(uRim, uEast, u));
    const NT = 128, tNom = new Float32Array(NT + 1), gain = new Float32Array(NT + 1);
    {
      let z = 0; for (let i = 0; i < NT; i++) z += 1 / clamp(pace((i + 0.5) / NT), 0.35, 2.5);
      for (let i = 0; i < NT; i++) { const um = (i + 0.5) / NT, dtn = DUR / (z * clamp(pace(um), 0.35, 2.5)); tNom[i + 1] = tNom[i] + dtn; gain[i + 1] = gain[i] + (rateAt(um) - 1) * dtn; }
    }
    const tab = (a, u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return a[i] + (a[i + 1] - a[i]) * (x - i); };
    await ctx.yield();

    // ---- far land mesh (smooth normals, the hero's own granite-and-grass material: rock skirts with tide bands, grass above)
    {
      const pos = [], col = [], idx = [], GR = [C('#4d6630'), C('#3c5a2c'), C('#6a8238'), C('#2f4a26')];
      const grid = (x0, x1, z0, z1, nx, nz, hf) => {
        const base = pos.length / 3;
        for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
          const x = lerp(x0, x1, i / nx), z = lerp(z0, z1, j / nz), y = hf(x, z);
          pos.push(x, y, z);
          const t = noise.n2(x * 0.011 + nOff, z * 0.011), w = noise.n2(x * 0.004, z * 0.004 + nOff), c = w > 0.25 ? GR[3] : t > 0.2 ? GR[2] : t < -0.3 ? GR[1] : GR[0], k = 0.92 + 0.16 * noise.n2(x * 0.03, z * 0.03);
          col.push(c.r * k, c.g * k, c.b * k);
        }
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      };
      grid(-1700, 1700, -1500, -180, 68, 30, farH); await ctx.yield();
      grid(-1500, -420, -180, 760, 24, 22, farH); await ctx.yield();
      grid(420, 1500, -180, 600, 24, 18, farH); await ctx.yield();
      grid(ISLE[0] - 84, ISLE[0] + 84, ISLE[1] - 70, ISLE[1] + 70, 28, 24, isleH); await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3).fill(6), 1));
      await ctx.yield();
      g.setIndex(idx); await ctx.yield(); await stepNormals(g, pos, idx, ctx); await ctx.yield();
      const land = new THREE.Mesh(g, hero.materials.solid); land.name = 'far-land'; land.receiveShadow = true; scene.add(land);      // (receives nothing out there; it shares the lit program of the other solids)
    }
    await ctx.yield();

    // ---- maritime pines on the ridge behind the village and on the neck (kit flora, wind in the vertex shader) -----------
    const wind = flora.makeWind({ direction: [0.8, -0.5], strength: 1.1, gustiness: 0.6 }); await ctx.yield();
    const leafOpts = { size: 256, seed: cloudSeed };                                               // the pines are never nearer than 60 m: a quarter-size atlas, a sixteenth of the bake
    await flora.prepareLeafTexture(leafOpts, ctx.yield, 4); await ctx.yield();                     // the atlas drawn in short steps (the same pixels), so the next line does no pixel work
    const leafMap = flora.makeLeafTexture(leafOpts); await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap }); await ctx.yield();
    const pineA = flora.pineGeometry({ rng: rng.fork('pineA'), height: 15, detail: 1 }); await ctx.yield();
    const pineB = flora.pineGeometry({ rng: rng.fork('pineB'), height: 11, detail: 1 }); await ctx.yield();
    const pineFar = flora.pineGeometry({ rng: rng.fork('pineC'), height: 13, detail: 0 }); await ctx.yield();
    const pines = flora.makeScatter({
      rng: rng.fork('pines'), bounds: [-150, -178, 150, -62], heightAt: hillH, material: leafMat, variants: [pineA, pineB],
      count: Math.round(34 * Math.min(1.15, density) * (0.7 + 0.3 * detail)), spacing: 5.5, scale: [0.75, 1.2], falloff: 0, yRange: [15.2, 99],
      density: (x, z) => ((Math.abs(x + 3) < 17 && z > -92) || (Math.abs(x) < 112 && z > -70) ? 0 : 1),
    });
    scene.add(pines.object); await ctx.yield();
    const farPines = flora.makeScatter({
      rng: rng.fork('farPines'), bounds: [-420, -520, 460, -205], heightAt: farH, material: leafMat, variants: [pineFar],
      count: Math.round(70 * (0.6 + 0.4 * detail)), spacing: 7, scale: [0.9, 1.7], falloff: 0, yRange: [13.5, 99],
      density: (x, z) => (HAMLET.some((p) => Math.hypot(p[0] - x, p[2] - z) < 16) ? 0 : 0.5 + 0.5 * noise.n2(x * 0.012, z * 0.012 + nOff)),
    });
    scene.add(farPines.object); await ctx.yield();

    // ---- people: the quay promenade and the aisles of the market ---------------------------------------------------------
    const WU = { uTime: { value: 0 } }, figDepth = figureDepthMaterial(WU);
    {
      const pr = rng.fork('people'), n0 = Math.round(54 * density * (0.6 + 0.4 * detail)), EDGE = 13, n = n0 + EDGE;
      const geo = figureGeometry(), w0 = new Float32Array(n * 4), w1 = new Float32Array(n * 4), tint = new Float32Array(n * 3);
      const CLOTH = ['#2c5fa6', '#c23a2e', '#e9e4d6', '#d9a327', '#3f6f5a', '#27508a', '#b8b0a0', '#7a3f6a', '#e0a08a', '#2a2e3a'].map(C);
      for (let i = 0; i < n0; i++) {
        const kind = pr(), y = (x, z) => hillH(x, z) + 0.04;
        let ax, az, bx, bz, sp = pr.range(0.75, 1.35);
        if (kind < 0.42) { az = bz = pr.range(-9.4, -3.2); ax = pr.range(-104, 96); bx = ax + pr.range(9, 30) * (pr.chance(0.5) ? 1 : -1); bx = clamp(bx, -108, 108); }
        else if (kind < 0.74) { az = bz = pr.pick([-19.8, -28.2, -36.8]) + pr.range(-0.9, 0.9); ax = pr.range(-21, 8); bx = ax + pr.range(6, 13); }
        else if (kind < 0.86) { ax = bx = pr.pick([-12.4, -4.1, 4.1, 12.4]) + pr.range(-0.5, 0.5); az = pr.range(-44, -30); bz = az + pr.range(8, 16); }
        else { ax = pr.range(-22, 22); az = pr.pick([-19.6, -28, -36.6]) + pr.range(-1.2, 1.2); bx = ax + 0.2; bz = az + 0.1; sp = 0; }     // someone standing at a stall
        const len = Math.hypot(bx - ax, bz - az);
        w0.set([ax, y(ax, az), az, pr()], i * 4); w1.set([bx, y(bx, bz), bz, sp > 0 ? sp / (2 * len) : 0], i * 4);
        const c = pr.pick(CLOTH); tint.set([c.r, c.g, c.b], i * 3);
      }
      // at the quay edge by the square: people leaning at the chain looking down at the boats, and others carrying the catch
      // between the edge and the stalls (oilskins and smocks: yellow, blue, red, white)
      const SMOCK = ['#d9a327', '#2c5fa6', '#c23a2e', '#e9e4d6', '#e0b83a', '#27508a'].map(C), figHashJ = (v) => { const q = Math.sin(v * 91.7 + 2.3) * 43758.5453; return q - Math.floor(q); };
      for (let k = 0; k < EDGE; k++) {
        const i = n0 + k, lean = k < 6, yq = RIM + 0.06;
        let ph = pr() * 0.45; if (!lean) for (let t = 0; t < 40 && !(figHashJ(ph * 7) > 0.74 && figHashJ(ph * 7) < 0.96); t++) ph = pr();      // (a phase whose hash says "carries a basket")
        if (lean) { const ax = [-20.8, -15.3, -8.6, -2.9, 6.3, 8.9][k] + pr.range(-0.3, 0.3); w0.set([ax, yq, -1.02, ph], i * 4); w1.set([ax + pr.range(-0.03, 0.03), yq, -0.92, 0], i * 4); }
        else { const ax = pr.range(-26, 4), az = pr.range(-5.2, -4.3), bx = ax + pr.range(8, 14), sp = pr.range(0.8, 1.25); w0.set([ax, yq, az, ph], i * 4); w1.set([bx, yq, az + pr.range(-0.3, 0.3), sp / (2 * (bx - ax))], i * 4); }
        const c = SMOCK[k % SMOCK.length]; tint.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('aW0', new THREE.InstancedBufferAttribute(w0, 4)); geo.setAttribute('aW1', new THREE.InstancedBufferAttribute(w1, 4)); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
      const people = new THREE.InstancedMesh(geo, figureMaterial(WU), n); people.frustumCulled = false; people.name = 'people';
      people.castShadow = true; people.receiveShadow = true; people.customDepthMaterial = figDepth; scene.add(people);
    }
    await ctx.yield();

    // ---- sails on the bay (and, rarely, the old fleet standing in) ---------------------------------------------------------
    const sails = [], boatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
    {
      const sr = rng.fork('sails'), tones = sailPick < 0.5 ? ['#f1ece0', '#e8dcc0', '#f4f0e8'] : ['#f1ece0', '#c9643a', '#e6c79a'];
      const geos = tones.map((t, i) => sailGeometry(t, ['#27508a', '#e9e4d6', '#2f6f5a'][i], false));
      const n = Math.round((3 + 9 * fleetPick) * density);          // a quiet bay or a regatta morning
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(geos[i % 3], boatMat), s = sr.range(0.9, 1.5), dir = sr.chance(0.5) ? 1 : -1;
        const b = { m, x: sr.range(-420, 420), z: sr.range(430, 780), v: sr.range(1.2, 2.6) * dir, ph: sr.range(0, 6.28), heel: sr.range(0.08, 0.2) * -dir, span: 520, kx: 0, kz: 0, lug: false };
        if (Math.abs(b.x - 8) < 40) b.x += 90;
        m.scale.setScalar(s); m.rotation.order = 'YXZ'; m.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(m); sails.push(b);
      }
      for (const [nx, nz, dir, sc] of [[60, 268, -1, 2], [-40, 300, 1, 1.5], [260, 236, -1, 1.5]]) {      // (the first crosses the sun's road as we round the reef: she keeps station with the flight, not with the clock)      // three working the bay just outside: near enough to be boats, not specks
        const m = new THREE.Mesh(geos[sails.length % 3], boatMat), b = { m, x: nx, z: nz, v: 1.7 * dir, ph: nx, heel: -0.14 * dir, span: 330, kx: 0, kz: 0, lug: false, near: sc > 1.6 };
        m.scale.setScalar(sc); m.rotation.order = 'YXZ'; m.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(m); sails.push(b);
      }
      if (rare) {
        const lg = sailGeometry('#9c3a26', '#1f2328', true), lg2 = sailGeometry('#b4552c', '#27323a', true);
        for (let i = 0; i < 9; i++) {
          const m = new THREE.Mesh(i % 2 ? lg2 : lg, boatMat), row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
          // a loose wedge standing in from the south-west; kx, kz = where each lies at the end of the flight. The leader
          // passes 60 m outside the pier heads as we run out, a red sail standing tall beside the lighthouse
          // the leader is already standing in: through the gap beside the portal as we come down the fairway, then close down our starboard side
          // (now: they stand in from the east along the seaward side of the reef, bound for the gap; the leader passes 14 m off our
          // starboard side on the last leg, the rest in a loose line beyond her, all on the reciprocal of our course)
          const b = { m, x: 0, z: 0, v: 0, ph: sr.range(0, 6.28), heel: 0.13, span: 0, kx: 24 + row * 36 + side * row * 7, kz: 216 + row * 13 + side * row * 9, lug: true, lead: i === 0 };
          m.scale.setScalar(sr.range(1.25, 1.6)); m.rotation.order = 'YXZ'; m.rotation.y = -1.833; scene.add(m); sails.push(b);
        }
      }
    }
    await ctx.yield();

    // ---- gulls (and, rarely, dolphins beside the bow on the run out) ---------------------------------------------------------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const gullN = (n) => Math.max(3, Math.round(n * density * (0.8 + 0.4 * gullPick)));
    // Every flock is kept tight about its route (the kit's loose gulls scatter 15 m sideways and 5 m up and down, which put birds
    // through the quay, on the water and against the lens). The first wheels a long loop over the foot of the wall beside the
    // rise, and rides the tide: its mesh is lifted with the water, so the birds are always 5 to 9 m above the eye.
    const GULL_LOOP = [[-74, 9.6, 18], [-66, 8.8, 12], [-46, 9.2, 11], [-27, 10.2, 12.5], [-19, 9.8, 19], [-27, 9, 26], [-46, 9.6, 27.5], [-66, 10.4, 26]];
    const gullsA = fauna.add(F.makeFlock({ rng: rng.fork('gullsA'), species: 'gulls', count: gullN(11), size: 1.1, route: GULL_LOOP, closed: true, spread: [4, 1.4, 30], wander: [1.6, 0.7, 1.6, 0.35] }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gullsE'), species: 'gulls', count: gullN(8), size: 1.2, spread: [9, 2.5, 30], wander: [2.5, 1, 2.5, 0.35], maxSigma: 3, cross: { path, u: 0.012, lead: 24, height: 12.5, angle: 72, side: 1, span: 150, rise: 5, duration: DUR } }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gullsB'), species: 'gulls', count: gullN(13), size: 1.3, spread: [18, 4.5, 34], center: [10, 40, 96], radius: 40, height: 5 }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gullsC'), species: 'gulls', count: gullN(8), size: 1.2, spread: [10, 3, 30], wander: [2.5, 1, 2.5, 0.35], maxSigma: 3, cross: { path, u: uRim + 0.04, lead: 26, height: 9, angle: 118, side: -1, span: 170, duration: DUR } }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gullsD'), species: 'gulls', count: gullN(6), size: 1.2, spread: [5, 2.2, 22], wander: [1.6, 0.9, 2, 0.35], along: { path, side: 4, up: 8.5, lead: 24, from: uSouth - 0.06, to: 1.08 } }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gullsF'), species: 'gulls', count: gullN(10), size: 1.25, spread: [9, 3, 24], center: [46, 31, 170], radius: 22, height: 4 }), { always: true });
    await ctx.yield();
    // gulls lifting off the quay edge as the boat comes along it, and a band of them stooping to the water outside the gap
    fauna.add(F.makeFlock({ rng: makeRng(hashSeed('tide-gullsQ:' + ctx.seed)), species: 'gulls', count: gullN(9), size: 1.15, spread: [5, 1.6, 16], wander: [1.2, 0.6, 1.2, 0.4], maxSigma: 3, cross: { path, u: uEast, lead: 13, height: 8, angle: 112, side: -1, span: 80, rise: 9, duration: DUR } }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: makeRng(hashSeed('tide-gullsS:' + ctx.seed)), species: 'gulls', count: gullN(8), size: 1.25, spread: [6, 1.5, 18], wander: [1.5, 0.6, 1.5, 0.4], maxSigma: 3, cross: { path, u: uGap, lead: 17, height: 6.5, angle: 70, side: 1, span: 120, sag: 6.5, duration: DUR } }), { always: true });
    await ctx.yield();
    // a cloud of small waders (knots) wheeling over the flats at the edge of the sea, to seaward of our line and above the mastheads:
    // the life of the low-water floor, twisting dark then pale as it turns. Like the first gulls it rides the tide.
    const WADER_LOOP = [[-62, 13, 46], [-48, 12.6, 42], [-30, 13, 43], [-16, 13.6, 48], [-12, 14, 56], [-24, 13.4, 62], [-44, 13, 60], [-60, 12.6, 54]];
    const waders = fauna.add(F.makeFlock({
      rng: rng.fork('waders'), species: 'starlings', count: Math.round(240 * Math.min(1.2, density) * (0.6 + 0.4 * detail)), size: 2.2, speed: 11, route: WADER_LOOP, closed: true,
      spread: [6.5, 2.4, 9], morph: 2.1, shear: 9, twist: 0.05, wander: [0.8, 0.5, 0.8, 1.2], body: '#7d776c', belly: '#efece4', wingC: '#8a8377', tip: '#3a3834',
    }), { always: true });
    await ctx.yield();
    if (rare) {
      const dolphinLight = { ...F.FAUNA_LIGHTS.day, sunIntensity: 1.7, skyIntensity: 0.9 };      // slate backs, not white shards
      fauna.add(F.makeDolphins({ rng: rng.fork('dolphins'), count: 7, level: TIDE_HIGH, light: dolphinLight, top: '#3d4a58', belly: '#aab4bd', along: { path, side: 4.5, up: -4.2, lead: 13, from: uSouth - 0.02, to: 1.06 } }), { always: true });
      await ctx.yield();
    }

    // ---- air: wisps over the wet sand at low water, a fog bank drawing off to seaward, motes in the first light -----------
    // (by day the low sun stands over the bow: capped lower there and lit with less of it, or the wisps lie over the nearest pots as a white veil)
    const fxTime = { value: 0 }, mistOp = Math.min(dayLook ? (fogKind === 0 ? 0.22 : 0.27) : (fogKind === 0 ? 0.34 : 0.42), look.mist * mistK);
    const wisps = fx.makeMist({
      rng: rng.fork('wisps'), time: fxTime, count: Math.round(42 * (0.6 + 0.4 * detail)), area: [170, 4, 100], center: [0, 3.2, 80], size: [16, 34],
      color: '#f1e8e2', opacity: mistOp, drift: [-0.75, 0, -0.5], sunDir: skyA.lightDirection, sunColor: dayLook ? skyA.lightColor.clone().multiplyScalar(0.4) : skyA.lightColor,
    });
    scene.add(wisps.object); await ctx.yield();
    const bankPts = [], br = rng.fork('bankPts');
    for (let i = 0; i < 24; i++) { const a = lerp(-1.3, 1.3, i / 23) + br.range(-0.03, 0.03), R = br.range(520, 800); bankPts.push([8 + Math.sin(a) * R, 10 + br.range(-2, 6), 150 + Math.cos(a) * R]); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + br.range(-0.2, 0.2), R = br.range(75, 180); bankPts.push([ISLE[0] + Math.sin(a) * R, 6 + br.range(-1, 4), ISLE[1] + 30 + Math.cos(a) * R * 0.8]); }     // the islet stands in it
    const bank = fx.makeMist({
      rng: rng.fork('bank'), time: fxTime, positions: bankPts, size: [130, 270], flatten: 0.34, color: '#fbf7f0', shadowColor: '#8195b6', opacity: look.wet ? 0.7 : 0.9,
      sunDir: skyB.lightDirection, sunColor: skyB.lightColor,
    });
    scene.add(bank.object); await ctx.yield();
    const bankZ0 = [70, 0, -240][fogKind];          // in thick fog the bank starts just outside the pier heads
    const motes = fx.makeParticles({
      rng: rng.fork('motes'), preset: 'dust', time: fxTime, count: Math.round(1100 * detail), box: [46, 18, 46], size: [0.018, 0.05],
      colors: ['#fff1d8', '#ffffff', '#ffe2c0'], intensity: 1.2, opacity: 0.3,
    });
    scene.add(motes.object); await ctx.yield();

    // ---- our own bow, and the water it throws -----------------------------------------------------------------------------------
    const bowFill = { value: new THREE.Color(0, 0, 0) }, bowMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, side: THREE.DoubleSide });
    bowMat.customProgramCacheKey = () => 'tmt-bow';
    bowMat.onBeforeCompile = (sh) => {       // the sky's fill on deck, coil and post when the low sun stands ahead and the bulwarks shade them
      sh.uniforms.uBowFill = bowFill;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', 'uniform vec3 uBowFill;\n#include <common>').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uBowFill;');
    };
    const bow = new THREE.Mesh(bowGeometry('#2a5ea8'), bowMat);
    bow.matrixAutoUpdate = false; bow.frustumCulled = false; bow.name = 'bow'; bow.castShadow = true; bow.receiveShadow = true; scene.add(bow);
    await ctx.yield();
    const FU = { uTime: fxTime, uK: { value: 0 }, uCol: { value: new THREE.Color(1, 1, 1) }, uPx: { value: 400 } };
    const foam = makeFoam(FU), spray = makeSpray(FU, rng.fork('spray'), Math.round(280 * (0.6 + 0.4 * detail)));
    scene.add(foam, spray);
    await ctx.yield();
    // spray where the swell breaks on the feet of the pier heads (the lighthouse's takes two thirds of it)
    const SU = { uTime: fxTime, uPx: FU.uPx, uCol: FU.uCol, uSurf: { value: 0 } };
    // (heads: [x, z, arc from, arc to, radius]; the lighthouse foot and the seaward stack of the reef take most of it)
    const surf = makeSurf(SU, rng.fork('surf'), Math.round(900 * (0.6 + 0.4 * detail)), [[28.5, 152.5, -2.0, 0.5], [-12.5, 149.5, -0.5, 2.0], [30, 161, -2.4, -0.6, 8.5], [39, 171, -2.3, 0.7, 7.6], [39, 171, -1.2, 0.9, 7.6],
      [50, 180.5, -1.3, 1.3, 5.6], [62, 183, -1.2, 1.2, 6], [74, 183.5, -1.1, 1.3, 5], [71, 209.5, 1.6, 4.6, 5], [74.5, 184.6, -1.3, 1.4, 5], [102.1, 190.5, -2.3, 0.5, 6.4], [95.2, 216, 1.8, 4.6, 5.8]]);
    scene.add(surf);
    // two more heads at the lighthouse's own foot, dealt from a stream of their own
    const surfFoot = makeSurf(SU, makeRng(hashSeed('tide-surf-foot:' + ctx.seed)), Math.round(250 * (0.6 + 0.4 * detail)), [[23.4, 164.2, -2.7, 0.3, 2.7], [25.2, 170.6, -2.5, 0.7, 2.3]]);
    scene.add(surfFoot);
    const breakers = makeBreakers(SU, rng.fork('breakers'), [[23.3, 150.9, 2.8, 4.6], [23.2, 153.9, 3.0, 6.6], [22.6, 158.6, 3.6, 6.5], [26, 163.5, 4.0, 7.4], [30.5, 169, 4.2, 8], [33.5, 175.5, 4.6, 9.5], [39, 179.3, 4.8, 9], [45, 177.6, 4, 7],
      [49, 184.2, 5, 6.2], [56, 185.6, 4.5, 5.2], [63, 186.8, 5, 6.6], [72, 186.6, 4.6, 5.6], [79, 185.5, 3.6, 4.6], [67.5, 205, 4, 6.2], [73.5, 205.3, 3.6, 5.2], [95.7, 189.2, 3.6, 4.6], [98.3, 195.2, 3.0, 3.6], [93.1, 210.5, 3.0, 3.6], [90, 216.5, 3.6, 4.4], [-7.3, 151, 2.8, 5], [-9.5, 154, 3.4, 6.6], [-12.5, 155, 3.6, 6], [21.4, 163.4, 2.2, 3.4], [23.6, 172.2, 2.2, 3.6]]);      // (the last two stand at the lighthouse's foot)
    scene.add(breakers);
    await ctx.yield();

    // ---- per-frame state (nothing is allocated in update) ---------------------------------------------------------------------
    const Y = new THREE.Vector3(0, 1, 0), camPos = new THREE.Vector3(), fwd = new THREE.Vector3(), rightV = new THREE.Vector3(), upV = new THREE.Vector3(), backV = new THREE.Vector3(), aftV = new THREE.Vector3();
    const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3(), m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4(), m3 = new THREE.Matrix4(), m4 = new THREE.Matrix4(), size2 = new THREE.Vector2();
    const cSun = new THREE.Color(), cHor = new THREE.Color(), cZen = new THREE.Color(), cAmb = new THREE.Color();
    const LS = { sunDir: rig.direction, sunColor: cSun, skyHorizon: cHor, skyZenith: cZen, ambient: cAmb, sunPower: 0.8 };
    const HEEL = 0.27, PIV = EYE_W + DRAFT, uOpen0 = uRim - 0.035, uOpen1 = uQ1 - 0.035;
    const shadowCam = new THREE.PerspectiveCamera();
    const sunMoves = lookName !== 'night', sunA0 = skyA.sunDirection.clone(), sunV = new THREE.Vector3(), sunFloor = Math.min(skyA.lightDirection.y, skyB.lightDirection.y);
    let lastFaunaL = -1, tEntry = 0;

    function update(dt, time, camera, u) {
      const uu = clamp(u ?? 0, 0, 1), L = lapseAt(uu), s = uu * Ltot;
      camPos.setFromMatrixPosition(camera.matrixWorld);
      fwd.set(0, 0, -1).transformDirection(camera.matrixWorld);

      // the tide: at rest the far flats breathe; then a sheet races in under the keel, and from there the path is the tide
      if (uu <= 1e-6) tEntry = time;
      const tideY = tideAt(uu) + restK(s) * 0.03 * Math.sin(time * 0.7);
      hero.setFront(frontAt(s, time), FK, W0[0], 1 - sstep(S_LEVEL + 0.5, S_LEVEL + 4.5, s));
      hero.setTide((tideY - TIDE_LOW) / (TIDE_HIGH - TIDE_LOW));
      hero.setVillage(sstep(uOpen0, uOpen1, uu));
      hero.setTractors(1 - Math.pow(1 - clamp((s - 0.3) / 15, 0, 1), 1.5));       // off the flats and up the slip ahead of the flood

      // light: sky A to sky B on the fast clock, one rig, fog thinning, lamp and windows
      const skyT = time + (RATE - 1) * tEntry + tab(gain, uu) + (rateAt(uu) - 1) * clamp(time - tEntry - tab(tNom, uu), -6, 6);
      // the kit's sky and rig read camera.position; behind a portal only matrixWorld is set, so they are given a stand-in that carries both
      shadowCam.matrixWorld.copy(camera.matrixWorld); shadowCam.matrixWorld.decompose(shadowCam.position, shadowCam.quaternion, shadowCam.scale);
      if (sunMoves) {      // the six hours show in the sun itself: the first sky's sun travels to where the second one's stands
        sunV.copy(sunA0).lerp(skyB.sunDirection, sstep(0, 0.34, L)).normalize(); skyA.sunDirection.copy(sunV);
        if (sunV.y < sunFloor) { const hh = Math.hypot(sunV.x, sunV.z) || 1, cc = Math.sqrt(1 - sunFloor * sunFloor); sunV.set(sunV.x / hh * cc, sunFloor, sunV.z / hh * cc); }
        skyA.lightDirection.copy(sunV);
      }
      skyA.update(dt, skyT, shadowCam); skyB.update(dt, skyT, shadowCam);
      skyB.setOpacity(L); skyA.object.visible = L < 0.999;
      rig.match(skyA, skyB, L);
      rig.update(dt, time, shadowCam);
      scene.fog.color.copy(skyA.fogColor).lerp(skyB.fogColor, L); scene.fog.density = lerp(fog0, fog1, L);
      cSun.copy(skyA.lightColor).lerp(skyB.lightColor, L); cHor.copy(skyA.horizonColor).lerp(skyB.horizonColor, L); cZen.copy(skyA.zenithColor).lerp(skyB.zenithColor, L);
      cAmb.copy(rig.hemi.color).multiplyScalar(rig.hemi.intensity / Math.PI); LS.sunPower = rig.sun.intensity / Math.PI;
      hero.setLight(LS);
      const sh = skyT * 0.055;                                                     // cloud shadows sweep sand and granite on the same clock
      hero.setShade(0.8 * sh + 3.1, -0.5 * sh + 1.7, look.shade * (0.95 + 0.15 * Math.sin(L * Math.PI)), 0.02);      // shadows 40 to 60 m across: they read as clouds crossing the floor and the wall, not as a slow dimming
      hero.setLamp(lerp(look.lamp[0], look.lamp[1], L), lerp(look.beams[0], look.beams[1], L));
      hero.setWindows(lerp(look.win[0], look.win[1], L));
      hero.setPool(lerp(look.pool[0], look.pool[1], L));
      hero.setWarm(1 - sstep(0.05, 0.9, L));                                       // the gold of first light leaves the water over the whole of the rise, not at a stroke
      hero.setPortalGlow((1 - sstep(REVEAL * 0.6, REVEAL, (1 - uu) * Ltot)) * sstep(uGap, uGap + 0.04, uu));      // (from inside the harbour the reef hides the portal, and its light)
      hero.update(dt, time, camera);
      if (Math.abs(L - lastFaunaL) > 0.04) { lastFaunaL = L; fauna.setLight(F.lightFrom(scene)); }

      // air and plants
      fxTime.value = time; WU.uTime.value = time;
      wisps.uniforms.uOpacity.value = mistOp * (1 - 0.93 * L); wisps.object.position.y = tideY - TIDE_LOW; wisps.update(dt, time, camera);
      gullsA.object.position.y = tideY - TIDE_LOW; waders.object.position.y = tideY - TIDE_LOW;
      bank.object.position.z = lerp(bankZ0, 110, L) + 30 * Math.sin(time * 0.02); bank.update(dt, time, camera);
      motes.setOpacity(0.3 * (1 - sstep(0.25, 0.6, L))); motes.update(dt, time, camera);
      pines.update(dt, time, camera); farPines.update(dt, time, camera);
      fauna.update(dt, time, camera, uu);

      // sails on the bay ride the same tide
      for (let i = 0; i < sails.length; i++) {
        const b = sails[i], m = b.m;
        if (b.lead) { const k = 480 * (uu - 0.87); m.position.set(54.6 - 0.966 * k, tideY - 0.1 + 0.12 * Math.sin(time * 0.9 + b.ph), 219.6 - 0.259 * k); }      // (outside the yawl's track and the arch's seaward pier)
        else if (b.lug) { const k = 300 * (1 - uu); m.position.set(b.kx + 0.966 * k, tideY - 0.1 + 0.12 * Math.sin(time * 0.9 + b.ph), b.kz + 0.259 * k); }
        else if (b.near) m.position.set(b.x - 110 * (uu - 0.7), tideY - 0.05 + 0.09 * Math.sin(time * 1.1 + b.ph), b.z);
        else { const x = ((b.x + b.v * time + b.span) % (2 * b.span) + 2 * b.span) % (2 * b.span) - b.span; m.position.set(x, tideY - 0.05 + 0.09 * Math.sin(time * 1.1 + b.ph), b.z); }
        m.rotation.z = b.heel + 0.035 * Math.sin(time * 0.8 + b.ph); m.rotation.x = 0.03 * Math.sin(time * 1.0 + b.ph * 1.7);
      }

      { const yp = YAWL(uu); hero.moveShip(2, yp[0], yp[1], YAWL_YAW + 0.03 * Math.sin(time * 0.4)); hero.setWake(0, yp[0], yp[1], YAWL_YAW);
        const lg = LUG(uu); hero.moveShip(3, lg[0], lg[1], lg[2] + 0.025 * Math.sin(time * 0.45 + 2)); hero.setWake(1, lg[0], lg[1], lg[2]); }

      // the bow: under the eye, heading with the boat, heeled while aground, righting as the water takes it,
      // then alive with the water, the speed and the turn. Gone (scaled to nothing) while the world is only seen through a portal.
      const present = sstep(S_SHEET - 1.5, S_SHEET + 0.5, s), afloat = sstep(S_SHEET + 0.3, S_LEVEL + 2.6, s);
      const speedK = clamp((pace(uu) - 0.35) / 1.55, 0, 1) * present;
      path.tangentAt(Math.max(0, uu - 0.012), tA); path.tangentAt(Math.min(1, uu + 0.012), tB);
      const turnK = clamp((tA.z * tB.x - tA.x * tB.z) * 3.2, -1, 1) * (0.35 + 0.65 * speedK);
      // the boat heads where the path goes, not where we look, and rides level: when the gaze turns to the quay, the square, a sail
      // overhead or the lamp, the stem swings to one side of the frame or leaves it; looking straight ahead only its head shows
      path.tangentAt(uu, tC); aftV.set(-tC.x, 0, -tC.z); if (aftV.lengthSq() < 1e-6) aftV.set(-1, 0, 0); aftV.normalize();
      rightV.crossVectors(Y, aftV).normalize();
      m1.makeBasis(rightV, Y, aftV).setPosition(camPos);
      const roll = HEEL * (1 - afloat) - HEEL * 0.32 * Math.sin(Math.PI * afloat) + afloat * (0.022 * Math.sin(time * 0.83 + 1) + 0.008 * Math.sin(time * 2.3)) + turnK * 0.07;
      // she pitches and heaves to the swell that runs in through the gap (the beat the tide surface draws), more the nearer the open sea
      const swellK = afloat * (0.12 + 0.88 * sstep(40, 150, camPos.z)), swPh = time * 1.25 + camPos.z * 0.21 + camPos.x * 0.025;
      const nod = afloat * 0.009 * Math.sin(time * 1.13) + 0.016 * speedK + 0.006 * speedK * Math.sin(time * 4.2) + 0.028 * swellK * Math.cos(swPh);
      const lift = afloat * Math.max(0, path.pointAt(uu, pt).y - EYE_W - tideY), hover = Math.min(lift, 0.45);      // the last metres rise to the portal: the bow rides up with the eye
      const heave = afloat * 0.05 * Math.sin(time * 0.9) + 0.15 * swellK * Math.sin(swPh) + speedK * (0.012 * Math.sin(time * 31) + 0.008 * Math.sin(time * 47 + 1) + 0.03 * Math.sin(time * 4.2)) - hover - (1 - present) * 2.4 - BOW_DROP - 0.9 * sstep(uOut - 0.01, uOut + 0.06, uu)
        - 0.22 * sstep(uSouth - 0.02, uSouth + 0.03, uu) * (1 - sstep(uGate - 0.04, uGate + 0.01, uu)) - 0.3 * sstep(uStack - 0.02, uStack + 0.03, uu);      // on the last straight the stem drops under the frame: the portal has the picture to itself
      // Whole or not at all. Where the stem head as it rode before (heave) would reach the bottom edge of this frame or stand above it,
      // she is lifted (0.3 to 0.8 m: the stem head a ninth of the picture's height above its bottom edge) so that the stem, both
      // rails, the bitt and the coil are in the picture and read as the bow we ride;
      // where it would only touch the edge or leave by a side, she is lowered out of the frame. One rule of the eye and the boat for
      // the whole flight: she comes and goes as smoothly as the gaze turns, and is never in view where she was not before.
      bowLocal(m2, m3, speedK * 0.006 * Math.sin(time * 39), heave, turnK, nod, roll, present, PIV); m4.multiplyMatrices(m1, m2);
      tA.set(0, -1.83, -4.6).applyMatrix4(m4); m3.copy(camera.matrixWorld).invert(); tA.applyMatrix4(m3);
      const pe = camera.projectionMatrix.elements, tz = Math.max(0.05, -tA.z), tipY = tA.y / tz * pe[5], tipX = Math.abs(tA.x / tz * pe[0]);
      const bowVis = tA.z < 0 ? sstep(-1.04, -1.0, tipY) * (1 - sstep(0.78, 1.02, tipX)) : 0, bowUp = clamp((-0.78 - tipY) * tz / pe[5], 0.3, 0.8);
      bowLocal(m2, m3, speedK * 0.006 * Math.sin(time * 39), heave + bowUp * bowVis - 0.6 * (1 - bowVis), turnK, nod, roll, present, PIV);
      bow.matrix.multiplyMatrices(m1, m2); bow.matrixWorldNeedsUpdate = true;
      bowFill.value.copy(cHor).multiplyScalar(0.3);

      // bow wave and spray: a level frame on the water under the eye, heading with the gaze
      m1.setPosition(camPos.x, tideY + 0.06, camPos.z);
      foam.matrix.copy(m1); foam.matrixWorldNeedsUpdate = true; spray.matrix.copy(m1); spray.matrixWorldNeedsUpdate = true;
      FU.uK.value = speedK * afloat * (1 - sstep(0.5, 1.5, lift)) * (1 - 0.9 * sstep(uStack - 0.02, uStack + 0.03, uu)) * bowVis;      // the wave is the bow's: it leaves the picture with her, never a crest of foam with no stem behind it
      FU.uCol.value.setRGB(cHor.r * 0.7 + cSun.r * 0.32, cHor.g * 0.7 + cSun.g * 0.32, cHor.b * 0.7 + cSun.b * 0.32);
      FU.uPx.value = ctx.renderer.getDrawingBufferSize(size2).y * camera.projectionMatrix.elements[5] * 0.5;
      surf.position.y = tideY; surfFoot.position.y = tideY; breakers.position.y = tideY; SU.uSurf.value = sstep(3, 8, tideY);
    }
    {
      const cam0 = new THREE.PerspectiveCamera(); cam0.position.copy(path.start); cam0.lookAt(tA.copy(path.start).add(path.startTangent)); cam0.updateMatrixWorld(true);
      update(0, 0, cam0, 0);
    }
    await ctx.yield();
    await skyA.prewarm(ctx.renderer, null, scene); await ctx.yield();
    { const v = skyB.object.visible; await skyB.prewarm(ctx.renderer, null, scene); skyB.object.visible = v; }

    // the gaze during the rise: the waterline climbing the quay face, 16 m ahead of the boat
    const poiV = new THREE.Vector3(), poiP = new THREE.Vector3();
    const wallPoi = (time, u) => { path.pointAt(u, poiP); return poiV.set(poiP.x + 21, tideAt(u) + 2.4, 0.8); };
    return {
      scene, path, duration: DUR, pace,
      title: look.title + (rare ? ', the fleet comes home' : ''),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 7, sway: 0.35, bank: 0.2 },
      pois: [
        { at: wallPoi, from: 0, to: uRim + 0.03, weight: 0.44, fade: 0.2 },                   // the wall: ladders, weed bands, the wet line
        { at: [-3, 18.5, -27], from: uRim - 0.035, to: uQ1 + 0.08, weight: 0.84 },             // the square, the church behind it
        { at: [SHIP[0] + 1.5, 23, SHIP[1] + 3], from: uSouth - 0.045, to: uShip + 0.035, weight: 0.5, fade: 0.25 },      // the tunny boat and her sails
        { at: [28.5, 29, 152.5], from: uGate + 0.005, to: uGap + 0.012, weight: 0.5, fade: 0.3 },   // the lighthouse and the sea breaking at its foot
        { at: [41, 17, 172], from: uGap - 0.03, to: uStack + 0.045, weight: 0.56, fade: 0.35 },   // the seaward stack of the reef, the portal coming out from behind it
      ],
      portal: { shape: 'circle', radius: 4.7, color: look.portal, glow: 1, revealDistance: REVEAL },
      post: { exposure: look.exposure, bloom: { strength: look.bloom, radius: 0.62, threshold: 0.9 }, grade: look.grade },
      update,
      dispose() { hero.dispose(); skyA.dispose(); skyB.dispose(); figDepth.dispose(); },
    };
  },
};
